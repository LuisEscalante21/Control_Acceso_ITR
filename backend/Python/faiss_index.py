import faiss
import numpy as np
from pymongo.errors import DuplicateKeyError

class FaissFaceIndex:
    def __init__(self, collection, dim=128, threshold=0.4, min_diff=0.07):
        self.collection = collection
        self.dim = dim
        self.threshold = threshold
        self.min_diff = min_diff
        self.index = faiss.IndexFlatIP(self.dim)
        self.metadata_list = []

    def _normalize(self, vector):
        norm = np.linalg.norm(vector)
        return vector / norm if norm > 0 else vector

    def load_encodings(self):
        self.index.reset()
        self.metadata_list.clear()

        encodings = []
        for doc in self.collection.find({"encoding": {"$type": "array"}}):
            try:
                enc = np.array(doc['encoding'], dtype='float32')
                if enc.shape[0] == self.dim:
                    enc = self._normalize(enc)
                    encodings.append(enc)
                    metadata = {
                        "employee_code": doc.get("employee_code", str(doc["_id"])),
                        "gender": doc.get("gender", None),
                        "area_id": doc.get("area_id", None)
                    }
                    self.metadata_list.append(metadata)
            except Exception as e:
                print(f"[ERROR] Documento inválido en Mongo: {e}")

        if encodings:
            self.index.add(np.array(encodings, dtype='float32'))
            print(f"[FAISS] Cargados {len(encodings)} encodings en el índice.")
        else:
            print("[FAISS] No se encontraron encodings válidos.")

    def search_face(self, encoding_query):
        if self.index.ntotal == 0:
            return None, None

        encoding_query = np.array([self._normalize(encoding_query)], dtype='float32')
        similarities, indices = self.index.search(encoding_query, k=3)

        sim0 = similarities[0][0]
        sim1 = similarities[0][1]
        idx0 = indices[0][0]

        if sim0 > self.threshold and (sim0 - sim1) > self.min_diff:
            metadata = self.metadata_list[idx0]
            return metadata["employee_code"], sim0
        else:
            return None, None

    def add_face(self, encoding, employee_code, gender=None, area_id=None):
        if not isinstance(encoding, (np.ndarray, list)):
            print("[FAISS+Mongo] Encoding no es un array válido.")
            return False
        encoding = np.array(encoding, dtype='float32')
        if encoding.shape[0] != self.dim:
            print(f"[FAISS+Mongo] Encoding de dimensión incorrecta: {encoding.shape[0]} (esperado: {self.dim})")
            return False
        
        if np.any(np.isnan(encoding)) or np.any(np.isinf(encoding)):
            print("[FAISS+Mongo] Encoding contiene valores inválidos (NaN o Inf).")
            return False
        
        encoding = np.array(self._normalize(encoding), dtype='float32')

        # Verificar si ya existe en Mongo
        if self.collection.find_one({"employee_code": str(employee_code)}):
            print(f"[FAISS+Mongo] El empleado {employee_code} ya existe. No se inserta duplicado.")
            return False

        # Persistir en Mongo con manejo de excepción
        try:
            self.collection.insert_one({
                "employee_code": str(employee_code),
                "encoding": encoding.tolist(),
                "gender": gender,
                "area_id": area_id
            })
        except DuplicateKeyError:
            print(f"[FAISS+Mongo] Error de clave duplicada al insertar {employee_code}.")
            return False

        # Añadir a FAISS
        self.index.add(np.array([encoding], dtype='float32'))
        self.metadata_list.append({
            "employee_code": str(employee_code),
            "gender": gender,
            "area_id": area_id
        })
        print(f"[FAISS+Mongo] Empleado {employee_code} añadido.")
        return True

    def remove_face(self, employee_code):
        try:
            idx = next((i for i, meta in enumerate(self.metadata_list)
                        if meta["employee_code"] == employee_code), None)
            if idx is None:
                print(f"[FAISS] No se encontró el código {employee_code} en el índice.")
                return False

            total = self.index.ntotal
            if total == 0:
                print("[FAISS] Índice vacío, nada que eliminar.")
                return False

            # Eliminar de Mongo
            self.collection.delete_one({"employee_code": employee_code})

            # Eliminar de FAISS
            self.metadata_list.pop(idx)
            encodings_flat = self.index.reconstruct_n(0, total)
            encodings = np.array(encodings_flat).reshape(total, self.dim)
            new_encodings = np.delete(encodings, idx, axis=0)

            self.index.reset()
            if len(new_encodings) > 0:
                self.index.add(new_encodings)

            print(f"[FAISS+Mongo] Rostro con código {employee_code} eliminado.")
            return True
        except Exception as e:
            print(f"[FAISS] Error al eliminar rostro: {e}")
            return False