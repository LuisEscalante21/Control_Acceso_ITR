import React, { useState, useMemo } from "react";
import "../../styles/Admin/Rostros.css";
import UserFaceCard from "../../components/admin/Cards/UserFaceCard.jsx";
import { Search, CirclePlus } from "lucide-react";
import useDataFace from "../../hooks/admin/useDataFaces.jsx";
import ModalFace from "../../components/admin/ModalRostro.jsx";

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

  const handleSubmit = async (id, file, name) => {
    if (modalMode === "add") {
      await saveFace(file, name);
    } else {
      await updateFace(id, file, name);
    }
  };

  return (
    <>
      <div
        className="encabezado"
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <h1 className="titulo">Gestión de rostros</h1>
        <div className="busqueda-bar-G">
          <div className="buscador-G" style={{ flexGrow: 1 }}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <button
            className="nuevo-empleado-btn-G"
            style={{ maxWidth: "250px" }}
            onClick={handleAddFace}
          >
            <CirclePlus size={20} />
            Subir rostro
          </button>
        </div>
      </div>

      <div className="gestion-de-rostros">
        <div
          className="rostros-list"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "18px",
            justifyContent: "flex-start",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            padding: "20px",
            borderRadius: "10px",
            maxHeight: "630px",
            overflowY: "auto",
            backgroundColor: "#ffffff",
          }}
        >
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
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
};

export default Rostros;
