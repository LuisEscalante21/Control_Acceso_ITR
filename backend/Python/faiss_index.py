import faiss
import numpy as np
from bson import ObjectId

class FaissFaceIndex:
    def __init__(self, dim=128):
        self.dim = dim
        self.index = faiss.IndexFlatL2(self.dim)
        self.codigo_list = []

    def _normalize(self, vector):
        norm = np.linalg.norm(vector)
        return vector / norm if norm > 0 else vector

    def load_encodings(self, collection):
        self.index.reset()
        self.codigo_list.clear()

        encodings = []
        for doc in collection.find({"encoding": {"$type": "array"}}):
            try:
                enc = np.array(doc['encoding'], dtype='float32')
                if enc.shape[0] == self.dim:
                    enc = self._normalize(enc)
                    encodings.append(enc)
                    codigo = doc.get("employee_code", str(doc["_id"]))
                    self.codigo_list.append(codigo)
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

        # Si cumple con el threshold y no hay otro encoding muy cercano (para evitar ambigüedad)
        if d0 < threshold and (distances[0][1] - d0 > min_diff):
            matched_codigo = self.codigo_list[i0]
            return matched_codigo, d0
        else:
            return None, None

    def add_face(self, encoding, codigo_str):
        encoding = np.array([self._normalize(encoding)], dtype='float32')
        self.index.add(encoding)
        self.codigo_list.append(str(codigo_str))

    def remove_face(self, codigo_str):
        if codigo_str not in self.codigo_list:
            return False

        idx = self.codigo_list.index(codigo_str)
        self.codigo_list.pop(idx)

        if self.index.ntotal == 0:
            print(f"[FAISS] Índice vacío, nada que eliminar.")
            return True

        encodings_flat = self.index.reconstruct_n(0, self.index.ntotal)
        encodings = np.reshape(encodings_flat, (self.index.ntotal, self.dim))
        new_encodings = np.delete(encodings, idx, axis=0)

        self.index.reset()
        if new_encodings.shape[0] > 0:
            self.index.add(new_encodings)

        print(f"[FAISS] Rostro con código {codigo_str} eliminado del índice.")
        return True
