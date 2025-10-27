import React, { useState, useMemo } from "react";
import "../../styles/Admin/Rostros.css";
import UserFaceCard from "../../components/admin/Cards/UserFaceCard.jsx";
import { Search, CirclePlus } from "lucide-react";
import useDataFace from "../../hooks/admin/useDataFaces.jsx";
import ModalFace from "../../components/admin/ModalRostro.jsx";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";

const Rostros = () => {
  const {
    faces,
    showForm,
    setShowForm,
    saveFace,
    deleteFace,
    updateFace,
  } = useDataFace();

  const [searchTerm, setSearchTerm] = useState("");
  const [faceToEdit, setFaceToEdit] = useState(null);
  const [modalMode, setModalMode] = useState("add");

  const filteredFaces = useMemo(() => {
    return faces.filter((f) =>
      (f.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [faces, searchTerm]);

  const handleAddFace = () => {
    setFaceToEdit(null);
    setModalMode("add");
    setShowForm(true);
  };

  const handleEditFace = (face) => {
    setFaceToEdit(face);
    setModalMode("edit");
    setShowForm(true);
  };

  // Obtener userInfo descifrado (si existe cookie cifrada)
  const secretKey = import.meta.env.VITE_JWT_SECRET;
  let userInfo = null;
  const encryptedUserInfo = Cookies.get("userInfo");
  if (encryptedUserInfo && secretKey) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedUserInfo, secretKey);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      userInfo = decryptedStr ? JSON.parse(decryptedStr) : null;
    } catch (err) {
      console.error("Error descifrando userInfo:", err);
      userInfo = null;
    }
  }

  return (
    <>
      <div className="encabezado">
        <h1 className="titulo">Gestión de Rostros</h1>
        <div className="busqueda-bar-G">
          <div className="buscadora">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre o apellido"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            className="nuevo-empleado-btn-G"
            onClick={handleAddFace}
          >
            <CirclePlus size={20} />
            Agregar Rostro
          </button>
        </div>
      </div>

      <div className="gestion-de-rostros">
        <div className="rostros-list">
          {filteredFaces.length > 0 ? (
            filteredFaces.map((face) => (
              <UserFaceCard
                key={face._id}
                name={face.name}
                photo={face.image_url}
                onDelete={() => deleteFace(face._id)}
                onEdit={() => handleEditFace(face)}
              />
            ))
          ) : (
            <p style={{ padding: "20px", color: "#888" }}>
              No se encontraron rostros.
            </p>
          )}
        </div>
      </div>

      {showForm && (
        <ModalFace
          mode={modalMode}
          face={faceToEdit}
          onClose={() => setShowForm(false)}
          onSubmit={async (formData) => {
            if (modalMode === "add") {
              return saveFace(formData);
            } else {
              return updateFace(faceToEdit._id, formData);
            }
          }}
        />
      )}
    </>
  );
};

export default Rostros;