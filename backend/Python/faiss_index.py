import faiss
import numpy as np
from bson import ObjectId

class FaissFaceIndex:
    def __init__(self, dim=128):
        self.dim = dim
        self.index = faiss.IndexFlatL2(self.dim)
        self.metadata_list = []  # Guarda employee_code, gender y area_id

    def _normalize(self, vector):
        norm = np.linalg.norm(vector)
        return vector / norm if norm > 0 else vector

    def load_encodings(self, collection):
        self.index.reset()
        self.metadata_list.clear()

        encodings = []
        for doc in collection.find({"encoding": {"$type": "array"}}):
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
            self.index.add(np.array(encodings))
            print(f"[FAISS] Cargados {len(encodings)} encodings en el índice.")
        else:
            print("[FAISS] No se encontraron encodings válidos.")

    def search_face(self, encoding_query, threshold=0.35, min_diff=0.05):
        if self.index.ntotal == 0:
            return None, None

        encoding_query = np.array([self._normalize(encoding_query)], dtype='float32')
        distances, indices = self.index.search(encoding_query, k=3)

        d0 = distances[0][0]
        i0 = indices[0][0]

        if d0 < threshold and (distances[0][1] - d0 > min_diff):
            metadata = self.metadata_list[i0]
            return metadata, d0
        else:
            return None, None

    def add_face(self, encoding, employee_code, gender=None, area_id=None):
        encoding = np.array([self._normalize(encoding)], dtype='float32')
        self.index.add(encoding)
        self.metadata_list.append({
            "employee_code": str(employee_code),
            "gender": gender,
            "area_id": area_id
        })

    def remove_face(self, employee_code):
        idx = next((i for i, meta in enumerate(self.metadata_list)
                    if meta["employee_code"] == employee_code), None)
        if idx is None:
            print(f"[FAISS] No se encontró el código {employee_code} en el índice.")
            return False

        self.metadata_list.pop(idx)

        encodings = self.index.reconstruct_n(0, self.index.ntotal)
        encodings = np.reshape(encodings, (self.index.ntotal, self.dim))
        new_encodings = np.delete(encodings, idx, axis=0)

        self.index.reset()
        if len(new_encodings) > 0:
            self.index.add(new_encodings)

        print(f"[FAISS] Rostro con código {employee_code} eliminado del índice.")
        return True
