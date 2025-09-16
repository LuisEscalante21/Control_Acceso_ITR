import faiss
import numpy as np
from collections import Counter
from pymongo.errors import DuplicateKeyError

class FaissFaceIndex:
    def __init__(self, collection, dim=128, threshold=0.40, min_diff=0.03, topk=10, debug=True):
        """
        - IndexFlatIP sobre vectores L2 normalizados => similitud coseno.
        - threshold: similitud mínima para aceptar (0..1).
        - min_diff: margen mínimo entre el mejor match y el mejor 'impostor'.
        - topk: vecinos para voto mayoritario.
        - debug: imprime métricas (best_sim, impostor, margin) al buscar.
        """
        self.collection = collection
        self.dim = int(dim)
        self.threshold = float(threshold)
        self.min_diff = float(min_diff)
        self.topk = int(topk)
        self.debug = bool(debug)

        # Índice de FAISS para dot products (con vectores normalizados equivale a coseno)
        self.index = faiss.IndexFlatIP(self.dim)
        # Lista paralela al índice para mapear idx -> metadata (employee_code, etc.)
        self.metadata_list = []

    # ---------- utils ----------
    def _normalize(self, vector: np.ndarray) -> np.ndarray:
        v = np.asarray(vector, dtype='float32')
        n = np.linalg.norm(v)
        return v / n if n > 0 else v

    def _employees_array(self) -> np.ndarray:
        """Arreglo paralelo para mapear idx -> employee_code."""
        return np.array([m.get("employee_code") for m in self.metadata_list], dtype=object)

    # ---------- carga ----------
    def load_encodings(self) -> None:
        """
        Reconstruye el índice desde MongoDB cargando TODOS los encodings válidos.
        """
        self.index.reset()
        self.metadata_list.clear()

        encodings = []
        for doc in self.collection.find({"encoding": {"$type": "array"}}):
            try:
                enc = np.array(doc["encoding"], dtype="float32")
                if enc.shape[0] == self.dim and np.all(np.isfinite(enc)):
                    enc = self._normalize(enc)
                    encodings.append(enc)
                    self.metadata_list.append({
                        "employee_code": str(doc.get("employee_code", str(doc["_id"]))),
                        "gender": doc.get("gender", None),
                        "area_id": doc.get("area_id", None),
                    })
                else:
                    print(f"[FAISS][WARN] Encoding inválido o con dimensión incorrecta en doc {doc.get('_id')}")
            except Exception as e:
                print(f"[FAISS][ERROR] Documento inválido en Mongo: {e}")

        if encodings:
            arr = np.array(encodings, dtype="float32")
            # asegurar normalización L2 por si acaso
            norms = np.linalg.norm(arr, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            arr = arr / norms
            self.index.add(arr)
            print(f"[FAISS] Cargados {len(encodings)} encodings en el índice.")
        else:
            print("[FAISS] No se encontraron encodings válidos.")

    # ---------- búsqueda ----------
    def search_face(self, encoding_query):
        """
        Devuelve (employee_code:str, confidence:float) o (None, None).

        Reglas:
        - Debe superar 'threshold' por similitud coseno.
        - Debe respetar margen contra el mejor 'impostor' (min_diff).
        - Voto mayoritario en top-k entre vecinos que superan el threshold.
        """
        if self.index.ntotal == 0:
            if self.debug:
                print("[FAISS][DEBUG] Índice vacío.")
            return None, None

        q = np.array([self._normalize(encoding_query)], dtype="float32")
        k = min(self.topk, max(1, self.index.ntotal))
        sims, idxs = self.index.search(q, k)
        sims = sims[0].astype(float)
        idxs = idxs[0].astype(int)

        employees = self._employees_array()

        # Mejor vecino (top-1)
        best_sim = float(sims[0])
        best_idx = int(idxs[0])
        best_emp = employees[best_idx]

        # Mejor impostor: primer vecino con employee distinto
        impostor_sim = -1.0
        for s, i in zip(sims, idxs):
            if employees[i] != best_emp:
                impostor_sim = float(s)
                break
        margin = best_sim - (impostor_sim if impostor_sim >= 0 else 0.0)

        if self.debug:
            print(f"[FAISS][DEBUG] best_emp={best_emp} best_sim={best_sim:.3f} "
                  f"impostor={impostor_sim:.3f} margin={margin:.3f} "
                  f"th={self.threshold:.3f} mindiff={self.min_diff:.3f} k={k}")

        # Criterios de aceptación
        if best_sim < self.threshold:
            return None, None
        if impostor_sim >= 0 and (best_sim - impostor_sim) < self.min_diff:
            return None, None

        # Voto mayoritario entre vecinos que superan el umbral
        passed = [(employees[i], float(sims[pos])) for pos, i in enumerate(idxs) if sims[pos] >= self.threshold]
        if not passed:
            return None, None

        counts = Counter(emp for emp, _ in passed)
        voted_emp, _ = counts.most_common(1)[0]
        voted_sims = [s for emp, s in passed if emp == voted_emp]
        voted_conf = float(np.mean(voted_sims)) if voted_sims else best_sim

        # Si el voto coincide con el top-1, devuelve promedio del votado; si no, devuelve top-1.
        if voted_emp == best_emp:
            return str(voted_emp), voted_conf
        else:
            return str(best_emp), best_sim

    # ---------- altas ----------
    def add_face(self, encoding, employee_code, gender=None, area_id=None) -> bool:
        """
        Inserta una NUEVA muestra (encoding) para 'employee_code'.
        Permite múltiples muestras por empleado (mejor robustez).
        Añade al índice en caliente.
        """
        if not isinstance(encoding, (np.ndarray, list)):
            print("[FAISS+Mongo] Encoding no es un array válido.")
            return False

        encoding = np.array(encoding, dtype="float32")
        if encoding.shape[0] != self.dim:
            print(f"[FAISS+Mongo] Encoding de dimensión incorrecta: {encoding.shape[0]} (esperado: {self.dim})")
            return False
        if np.any(np.isnan(encoding)) or np.any(np.isinf(encoding)):
            print("[FAISS+Mongo] Encoding contiene valores inválidos (NaN o Inf).")
            return False

        encoding = self._normalize(encoding)

        # Insertar SIEMPRE una nueva muestra (sin bloquear duplicados)
        try:
            self.collection.insert_one({
                "employee_code": str(employee_code),
                "encoding": encoding.tolist(),
                "gender": gender,
                "area_id": area_id
            })
        except DuplicateKeyError:
            # Por si tu colección tiene unique index en (employee_code, ???)
            print(f"[FAISS+Mongo] Clave duplicada al insertar muestra de {employee_code}.")
            return False
        except Exception as e:
            print(f"[FAISS+Mongo] Error insertando en Mongo: {e}")
            return False

        # Añadir al índice en caliente
        self.index.add(np.array([encoding], dtype="float32"))
        self.metadata_list.append({
            "employee_code": str(employee_code),
            "gender": gender,
            "area_id": area_id
        })
        print(f"[FAISS+Mongo] Muestra añadida para empleado {employee_code}. Total en índice: {self.index.ntotal}")
        return True

    # ---------- bajas ----------
    def remove_face(self, employee_code) -> bool:
        """
        Elimina TODAS las muestras de 'employee_code' tanto en Mongo como del índice.
        Luego recarga el índice completo para mantener consistencia.
        """
        employee_code = str(employee_code)
        try:
            res = self.collection.delete_many({"employee_code": employee_code})
            if res.deleted_count == 0:
                print(f"[FAISS] No se encontraron muestras de {employee_code} en Mongo.")
                return False

            # Reconstruir índice desde cero para evitar desalineaciones
            self.load_encodings()
            print(f"[FAISS+Mongo] Eliminadas {res.deleted_count} muestra(s) de {employee_code} y recargado índice.")
            return True
        except Exception as e:
            print(f"[FAISS] Error al eliminar rostro: {e}")
            return False

    # ---------- utilitarios ----------
    def set_params(self, threshold=None, min_diff=None, topk=None, debug=None):
        """
        Ajusta parámetros en caliente.
        """
        if threshold is not None:
            self.threshold = float(threshold)
        if min_diff is not None:
            self.min_diff = float(min_diff)
        if topk is not None:
            self.topk = int(topk)
        if debug is not None:
            self.debug = bool(debug)
        return {
            "threshold": self.threshold,
            "min_diff": self.min_diff,
            "topk": self.topk,
            "debug": self.debug
        }

    def status(self):
        """
        Devuelve estado simple del índice.
        """
        return {
            "total_indexed": int(self.index.ntotal),
            "threshold": float(self.threshold),
            "min_diff": float(self.min_diff),
            "topk": int(self.topk),
            "debug": bool(self.debug)
        }
