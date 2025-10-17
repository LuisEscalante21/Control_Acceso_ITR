import faiss
import numpy as np
from collections import Counter
from pymongo.errors import DuplicateKeyError

class FaissFaceIndex:
    def __init__(self, collection, dim=128, threshold=0.55, min_diff=0.08, topk=5, debug=True):
        """
        PARÁMETROS OPTIMIZADOS PARA MAYOR PRECISIÓN:
        - threshold: 0.55 (antes 0.40) - Similitud mínima más estricta
        - min_diff: 0.08 (antes 0.03) - Mayor margen contra impostores
        - topk: 5 (antes 10) - Menos vecinos = menos ruido en votación
        """
        self.collection = collection
        self.dim = int(dim)
        self.threshold = float(threshold)
        self.min_diff = float(min_diff)
        self.topk = int(topk)
        self.debug = bool(debug)

        self.index = faiss.IndexFlatIP(self.dim)
        self.metadata_list = []

    def _normalize(self, vector: np.ndarray) -> np.ndarray:
        v = np.asarray(vector, dtype='float32')
        n = np.linalg.norm(v)
        return v / n if n > 0 else v

    def _employees_array(self) -> np.ndarray:
        return np.array([m.get("employee_code") for m in self.metadata_list], dtype=object)

    def load_encodings(self) -> None:
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
            except Exception as e:
                print(f"[FAISS][ERROR] Documento inválido: {e}")

        if encodings:
            arr = np.array(encodings, dtype="float32")
            norms = np.linalg.norm(arr, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            arr = arr / norms
            self.index.add(arr)
            print(f"[FAISS] Cargados {len(encodings)} encodings.")
        else:
            print("[FAISS] No hay encodings válidos.")

    def search_face(self, encoding_query):
        """
        BÚSQUEDA MEJORADA:
        1. Valida threshold estricto (0.55)
        2. Verifica margen contra impostor (0.08)
        3. Agrupa votos por empleado antes de decidir
        4. Devuelve None si hay ambigüedad
        """
        if self.index.ntotal == 0:
            if self.debug:
                print("[FAISS][DEBUG] Índice vacío.")
            return None, None

        q = np.array([self._normalize(encoding_query)], dtype="float32")
        k = min(self.topk * 2, max(1, self.index.ntotal))  # Buscamos más vecinos para mejor análisis
        sims, idxs = self.index.search(q, k)
        sims = sims[0].astype(float)
        idxs = idxs[0].astype(int)

        employees = self._employees_array()

        # PASO 1: Validar que el mejor vecino supera el threshold
        best_sim = float(sims[0])
        best_idx = int(idxs[0])
        best_emp = employees[best_idx]

        if best_sim < self.threshold:
            if self.debug:
                print(f"[FAISS][REJECT] best_sim={best_sim:.3f} < threshold={self.threshold:.3f}")
            return None, None

        # PASO 2: Calcular margen contra el mejor impostor
        impostor_sim = -1.0
        for s, i in zip(sims, idxs):
            if employees[i] != best_emp:
                impostor_sim = float(s)
                break

        margin = best_sim - (impostor_sim if impostor_sim >= 0 else 0.0)

        if impostor_sim >= 0 and margin < self.min_diff:
            if self.debug:
                print(f"[FAISS][REJECT] margin={margin:.3f} < min_diff={self.min_diff:.3f}")
                print(f"  best={best_emp}({best_sim:.3f}) vs impostor({impostor_sim:.3f})")
            return None, None

        # PASO 3: Voto mayoritario SOLO entre vecinos que superan threshold
        passed = [(employees[i], float(sims[pos])) 
                  for pos, i in enumerate(idxs) 
                  if sims[pos] >= self.threshold]

        if not passed:
            return None, None

        # Agrupar por empleado y calcular confianza promedio
        employee_scores = {}
        for emp, sim in passed:
            if emp not in employee_scores:
                employee_scores[emp] = []
            employee_scores[emp].append(sim)

        # Obtener el empleado con mejor confianza promedio
        best_employee = max(employee_scores.items(), 
                           key=lambda x: np.mean(x[1]))
        voted_emp, voted_sims = best_employee
        voted_conf = float(np.mean(voted_sims))

        if self.debug:
            print(f"[FAISS][MATCH] emp={voted_emp} conf={voted_conf:.3f} "
                  f"margin={margin:.3f} samples={len(voted_sims)}")

        return str(voted_emp), voted_conf

    def add_face(self, encoding, employee_code, gender=None, area_id=None) -> bool:
        if not isinstance(encoding, (np.ndarray, list)):
            print("[FAISS] Encoding no válido.")
            return False

        encoding = np.array(encoding, dtype="float32")
        if encoding.shape[0] != self.dim:
            print(f"[FAISS] Dimensión incorrecta: {encoding.shape[0]}")
            return False
        if np.any(np.isnan(encoding)) or np.any(np.isinf(encoding)):
            print("[FAISS] Encoding con NaN/Inf.")
            return False

        encoding = self._normalize(encoding)

        try:
            self.collection.insert_one({
                "employee_code": str(employee_code),
                "encoding": encoding.tolist(),
                "gender": gender,
                "area_id": area_id
            })
        except Exception as e:
            print(f"[FAISS] Error insertando: {e}")
            return False

        self.index.add(np.array([encoding], dtype="float32"))
        self.metadata_list.append({
            "employee_code": str(employee_code),
            "gender": gender,
            "area_id": area_id
        })
        print(f"[FAISS] Muestra añadida para {employee_code}. Total: {self.index.ntotal}")
        return True

    def remove_face(self, employee_code) -> bool:
        employee_code = str(employee_code)
        try:
            res = self.collection.delete_many({"employee_code": employee_code})
            if res.deleted_count == 0:
                print(f"[FAISS] No se encontró {employee_code}.")
                return False

            self.load_encodings()
            print(f"[FAISS] Eliminadas {res.deleted_count} muestras de {employee_code}.")
            return True
        except Exception as e:
            print(f"[FAISS] Error eliminando: {e}")
            return False

    def set_params(self, threshold=None, min_diff=None, topk=None, debug=None):
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
        return {
            "total_indexed": int(self.index.ntotal),
            "threshold": float(self.threshold),
            "min_diff": float(self.min_diff),
            "topk": int(self.topk),
            "debug": bool(self.debug)
        }