import React, { useState, useEffect } from "react";
import "../../styles/Admin/Teams.css";
import AreaCard from "../../components/admin/Cards/AreaCard.jsx";
import { CirclePlus } from "lucide-react";
import ModalNuevaArea from "../../components/admin/PageModals/AreasModal/NewTeamsModal.jsx";
import useDataTeams from "../../hooks/admin/useDataTeams.jsx";
import UpdateTeams from "../../components/admin/PageModals/AreasModal/UpdateTeams.jsx";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import UserFaceCardSimple from "../../components/Perfil/UserFaceCardSimple.jsx";

const Areas = () => {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const { teams, fetchTeams } = useDataTeams();

  useEffect(() => {
    fetchTeams();
  }, []);

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
      {/* Perfil pequeño arriba a la derecha */}
      <div style={{ position: "absolute", top: 24, right: 32, zIndex: 1000 }}>
        <UserFaceCardSimple
          name={userInfo?.fullName || userInfo?.names || "Usuario"}
          photo={userInfo?.photo || userInfo?.photoUrl || null}
          description={"Perfil"}
          onClick={() => { /* navegar a perfil o abrir panel */ }}
        />
      </div>
      <div className="encabezado">
        <h1 className="titulo">Gestión de Áreas</h1>
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <button
            className="nuevo-empleado-btn"
            style={{ width: "200px" }}
            onClick={() => setShowModal(true)}
          >
            <CirclePlus size={20} />
            Agregar Área
          </button>
        </div>
      </div>

      <div className="gestion-de-empleadoss" style={{ padding: "4% 6% 5% 6%" }}>
        <div
          className="empleados-list"
          style={{ minHeight: "200px", padding: "3% 6% 3% 5%" }}
        >
          {teams.length > 0 ? (
            <div className="area-row">
              {teams.map((area) => (
                <AreaCard
                  key={area._id}
                  name={area.name}
                  onClick={() => {
                    setSelectedArea(area);
                    setShowEditModal(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <p style={{ padding: "20px", color: "#888" }}>
              No se encontraron áreas.
            </p>
          )}
        </div>
      </div>

      {showModal && (
        <div
          className="employee-modal-overlay active"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "none", boxShadow: "none", padding: 0 }}
          >
            <ModalNuevaArea
              onSaved={() => {
                fetchTeams();
                setShowModal(false);
              }}
              onClose={() => setShowModal(false)}
            />
          </div>
        </div>
      )}

      {showEditModal && selectedArea && (
        <div
          className="employee-modal-overlay active"
          onClick={() => {
            setShowEditModal(false);
            setSelectedArea(null);
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "none", boxShadow: "none", padding: 0 }}
          >
            <UpdateTeams
              area={selectedArea}
              onClose={() => {
                setShowEditModal(false);
                setSelectedArea(null);
                fetchTeams();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Areas;
