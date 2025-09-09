import React, { useState, useEffect } from "react";
import "../styles/PerfilCard.css";
import { UserCircle, Mail, Copy } from "lucide-react";
import useEmployeeProfile from "../../hooks/widgets/useProfile";
import LogoutButton from "../Logout";

const UserFaceCardSimple = ({ onClick }) => {
  const employee = useEmployeeProfile();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [teamName, setTeamName] = useState(""); 
  const [copied, setCopied] = useState(false);

  // Obtener el nombre del área directamente desde employee.IdTeam
  useEffect(() => {
    if (employee?.IdTeam) {
      setTeamName(employee.IdTeam.name || "Área no especificada");
    } else {
      setTeamName("Área no especificada");
    }
  }, [employee?.IdTeam]);

  const handleCopyEmail = () => {
    if (employee?.email) {
      navigator.clipboard.writeText(employee.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const photoSize = 56;

  const openPanel = () => {
    setIsPanelOpen(true);
    if (onClick) onClick();
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <>
      {/* Tarjeta de vista previa */}
      <div className="user-face-card-simple" onClick={openPanel}>
        <div className="photo-wrapper-simple">
          {employee?.photo ? (
            <img
              src={employee.photo}
              alt={employee.names}
              className="circular-photo"
            />
          ) : (
            <UserCircle className="circular-photo default-avatar" size={photoSize} />
          )}
        </div>
        <div className="info-simple">
          <p className="ver-perfil">Ver perfil</p>
        </div>
      </div>

      {/* Panel lateral */}
      {isPanelOpen && employee && (
        <div className="employee-panel-overlay" onClick={closePanel}>
          <div className="employee-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <button className="close-icon" onClick={closePanel}>×</button>
              <h3>Perfil del usuario</h3>
            </div>

            <div className="panel-content">
              <div className="employee-info">
                <div className="employee-photo">
                  {employee.photo ? (
                    <img src={employee.photo} alt="Foto del usuario" />
                  ) : (
                    <UserCircle size={120} />
                  )}
                </div>

                <div className="employee-details">
                  <p className="employee-code">
                    <span className="label">Código: </span> 
                    {employee.numEmpleado || "N/A"}
                  </p>

                  <div className="employee-name">
                    <h2>
                      {`${employee.names || "Nombre"} ${employee.surnames || "no disponible"}`}
                    </h2>
                  </div>

                  <p className="employee-area">
                    {teamName}
                  </p>

                  <div className="employee-email">
                    <Mail size={18} />
                    <span>{employee.email || "Correo no disponible"}</span>
                    {employee.email && (
                      <button
                        className="copy-email-btn"
                        title="Copiar correo"
                        onClick={handleCopyEmail}
                        style={{
                          marginLeft: "8px",
                          cursor: "pointer",
                          border: "none",
                          background: "transparent",
                          color: "#555",
                          display: "flex",
                          alignItems: "center"
                        }}
                      >
                        <Copy size={18} />
                      </button>
                    )}
                  </div>

                  {copied && (
                    <div style={{
                      color: "#4caf50",
                      fontWeight: "bold",
                      fontSize: "0.95rem",
                      marginTop: "6px",
                      textAlign: "center"
                    }}>
                      ¡Copiado!
                    </div>
                  )}

                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserFaceCardSimple;
