import faiss
import numpy as np
from collections import Counter

class FaissFaceIndex:
    def __init__(self, collection, dim=128, threshold=0.40, min_diff=0.03, topk=5, debug=True):
        """
        ÍNDICE FAISS PARA RECONOCIMIENTO FACIAL
        
        PARÁMETROS OPTIMIZADOS:
        - dim: 128 - Dimensión de los vectores face_recognition
        - threshold: 0.55 - Similitud mínima para considerar un match
        - min_diff: 0.08 - Margen mínimo contra impostores
        - topk: 5 - Número de vecinos más cercanos para votación
        - debug: True - Mostrar logs detallados
        
        IMPORTANTE: Este índice es de SOLO LECTURA desde MongoDB.
        Las operaciones de escritura deben hacerse desde el servicio de MAPEO.
        """
        self.collection = collection
        self.dim = int(dim)
        self.threshold = float(threshold)
        self.min_diff = float(min_diff)
        self.topk = int(topk)
        self.debug = bool(debug)

        # Índice FAISS con producto interno (similitud coseno después de normalizar)
        self.index = faiss.IndexFlatIP(self.dim)
        self.metadata_list = []

    def _normalize(self, vector: np.ndarray) -> np.ndarray:
        """
        Normaliza un vector para usar producto interno como similitud coseno.
        
        Args:
            vector: Vector de características (128-D)
            
        Returns:
            Vector normalizado (norma L2 = 1)
        """
        v = np.asarray(vector, dtype='float32')
        n = np.linalg.norm(v)
        return v / n if n > 0 else v

    def _employees_array(self) -> np.ndarray:
        """
        Retorna array con códigos de empleados en el mismo orden que el índice FAISS.
        
        Returns:
            Array numpy con employee_codes
        """
        return np.array([m.get("employee_code") for m in self.metadata_list], dtype=object)

    def load_encodings(self) -> None:
        """
        Carga TODOS los encodings desde MongoDB y reconstruye el índice FAISS.
        Esta es la ÚNICA forma correcta de actualizar el índice.
        
        Proceso:
        1. Resetea el índice actual
        2. Lee todos los documentos con encoding válido
        3. Normaliza y valida cada encoding
        4. Reconstruye el índice FAISS completo
        5. Sincroniza metadata_list
        """
        print("[FAISS] Iniciando recarga completa desde MongoDB...")
        
        # Limpiar estado actual
        self.index.reset()
        self.metadata_list.clear()

        encodings = []
        valid_count = 0
        invalid_count = 0
        
        # Cargar todos los documentos con encoding
        for doc in self.collection.find({"encoding": {"$type": "array"}}):
            try:
                enc = np.array(doc["encoding"], dtype="float32")
                
                # Validar dimensión y valores finitos
                if enc.shape[0] != self.dim:
                    print(f"[FAISS][WARN] Encoding con dimensión incorrecta: {enc.shape[0]} (esperado {self.dim})")
                    invalid_count += 1
                    continue
                    
                if not np.all(np.isfinite(enc)):
                    print(f"[FAISS][WARN] Encoding con valores no finitos (NaN/Inf)")
                    invalid_count += 1
                    continue
                
                # Normalizar para usar producto interno como similitud coseno
                enc = self._normalize(enc)
                encodings.append(enc)
                
                # Guardar metadata asociada
                self.metadata_list.append({
                    "employee_code": str(doc.get("employee_code", str(doc["_id"]))),
                    "gender": doc.get("gender", None),
                    "area_id": doc.get("area_id", None),
                })
                valid_count += 1
                
            except Exception as e:
                print(f"[FAISS][ERROR] Error procesando documento: {e}")
                invalid_count += 1

        # Agregar encodings al índice FAISS
        if encodings:
            arr = np.array(encodings, dtype="float32")
            
            # Re-normalizar por seguridad (redundante pero seguro)
            norms = np.linalg.norm(arr, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            arr = arr / norms
            
            self.index.add(arr)
            print(f"[FAISS] ✓ Recarga completa exitosa:")
            print(f"  - Encodings válidos: {valid_count}")
            print(f"  - Encodings inválidos: {invalid_count}")
            print(f"  - Total en índice: {self.index.ntotal}")
        else:
            print("[FAISS] ⚠ No se encontraron encodings válidos en MongoDB.")

    def search_face(self, encoding_query):
        """
        Busca el rostro más similar en el índice FAISS con validación estricta.
        
        Algoritmo:
        1. Valida que el mejor vecino supere el threshold
        2. Calcula margen contra el mejor impostor
        3. Agrupa votos por empleado
        4. Retorna el empleado con mejor confianza promedio
        
        Args:
            encoding_query: Vector de características del rostro a buscar (128-D)
            
        Returns:
            tuple: (employee_code, confidence) o (None, None) si no hay match
        """
        if self.index.ntotal == 0:
            if self.debug:
                print("[FAISS][DEBUG] Índice vacío. No hay rostros para buscar.")
            return None, None

        # Normalizar query
        q = np.array([self._normalize(encoding_query)], dtype="float32")
        
        # Buscar k vecinos más cercanos (buscamos más para mejor análisis)
        k = min(self.topk * 2, max(1, self.index.ntotal))
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
                print(f"[FAISS][REJECT] Similitud insuficiente:")
                print(f"  - best_sim={best_sim:.3f} < threshold={self.threshold:.3f}")
            return None, None

        # PASO 2: Calcular margen contra el mejor impostor (diferente empleado)
        impostor_sim = -1.0
        for s, i in zip(sims, idxs):
            if employees[i] != best_emp:
                impostor_sim = float(s)
                break

        margin = best_sim - (impostor_sim if impostor_sim >= 0 else 0.0)

        if impostor_sim >= 0 and margin < self.min_diff:
            if self.debug:
                print(f"[FAISS][REJECT] Margen insuficiente contra impostor:")
                print(f"  - margin={margin:.3f} < min_diff={self.min_diff:.3f}")
                print(f"  - Candidato: {best_emp} ({best_sim:.3f})")
                print(f"  - Impostor: ({impostor_sim:.3f})")
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
            print(f"[FAISS][MATCH] Reconocimiento exitoso:")
            print(f"  - Empleado: {voted_emp}")
            print(f"  - Confianza: {voted_conf:.3f}")
            print(f"  - Margen: {margin:.3f}")
            print(f"  - Muestras: {len(voted_sims)}")

        return str(voted_emp), voted_conf

    def set_params(self, threshold=None, min_diff=None, topk=None, debug=None):
        """
        Actualiza parámetros de reconocimiento en caliente.
        Útil para ajustar precisión sin reiniciar el servicio.
        
        Args:
            threshold: Nueva similitud mínima (0.0 a 1.0)
            min_diff: Nuevo margen mínimo contra impostores
            topk: Nuevo número de vecinos para votación
            debug: Activar/desactivar logs detallados
            
        Returns:
            dict: Parámetros actuales después del cambio
        """
        if threshold is not None:
            self.threshold = float(threshold)
        if min_diff is not None:
            self.min_diff = float(min_diff)
        if topk is not None:
            self.topk = int(topk)
        if debug is not None:
            self.debug = bool(debug)
        
        print(f"[FAISS] Parámetros actualizados:")
        print(f"  - threshold: {self.threshold}")
        print(f"  - min_diff: {self.min_diff}")
        print(f"  - topk: {self.topk}")
        print(f"  - debug: {self.debug}")
        
        return {
            "threshold": self.threshold,
            "min_diff": self.min_diff,
            "topk": self.topk,
            "debug": self.debug
        }

    def status(self):
        """
        Retorna estado actual del índice FAISS.
        
        Returns:
            dict: Información del índice y parámetros actuales
        """
        return {
            "total_indexed": int(self.index.ntotal),
            "dimension": int(self.dim),
            "threshold": float(self.threshold),
            "min_diff": float(self.min_diff),
            "topk": int(self.topk),
            "debug": bool(self.debug),
            "index_type": "IndexFlatIP (Cosine Similarity)"
        }

    def get_metadata(self, employee_code):
        """
        Obtiene metadata de un empleado específico.
        
        Args:
            employee_code: Código del empleado
            
        Returns:
            dict o None: Metadata del empleado si existe
        """
        employee_code = str(employee_code)
        for meta in self.metadata_list:
            if meta.get("employee_code") == employee_code:
                return meta
        return None

    def get_all_employees(self):
        """
        Retorna lista de todos los códigos de empleados indexados.
        
        Returns:
            list: Lista de employee_codes únicos
        """
        return list(set([m.get("employee_code") for m in self.metadata_list]))

    # ============================
    # MÉTODOS DESHABILITADOS
    # ============================
    # Estos métodos NO deben usarse en el servicio de reconocimiento.
    # Use el servicio de MAPEO para modificar rostros en MongoDB.
    
    def add_face(self, *args, **kwargs):
        """
        ⛔ MÉTODO DESHABILITADO
        
        No agregue rostros directamente al índice FAISS.
        Use el servicio de MAPEO (endpoint POST /mapeo) para registrar rostros.
        El servicio de reconocimiento recibirá automáticamente una notificación
        para recargar el índice.
        """
        raise NotImplementedError(
            "⛔ add_face() está deshabilitado en el servicio de reconocimiento.\n"
            "Use el servicio de MAPEO (POST /mapeo) para agregar rostros.\n"
            "El índice se recargará automáticamente desde MongoDB."
        )

    def remove_face(self, *args, **kwargs):
        """
        ⛔ MÉTODO DESHABILITADO
        
        No elimine rostros directamente del índice FAISS.
        Use el servicio de MAPEO (endpoint DELETE /faces/<id>) para eliminar rostros.
        El servicio de reconocimiento recibirá automáticamente una notificación
        para recargar el índice.
        """
        raise NotImplementedError(
            "⛔ remove_face() está deshabilitado en el servicio de reconocimiento.\n"
            "Use el servicio de MAPEO (DELETE /faces/<id>) para eliminar rostros.\n"
            "El índice se recargará automáticamente desde MongoDB."
        )