import React, { useState, useEffect } from "react";
import "../styles/PerfilCard.css";
import { UserCircle, Mail, Copy } from "lucide-react";
import useEmployeeProfile from "../../hooks/widgets/useProfile";
import LogoutButton from "../Logout";

const UserFaceCardSimple = ({ name: propName, photo: propPhoto, onClose }) => {
  const employee = useEmployeeProfile();
  const [teamName, setTeamName] = useState(""); 
  const [copied, setCopied] = useState(false);

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

  const displayName = propName || `${employee?.names || "Nombre"} ${employee?.surnames || ""}`.trim();
  const displayPhoto = propPhoto || employee?.photo || null;

  return (
    <div className="employee-panel-overlay" onClick={onClose}>
      <div className="employee-panel" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <button aria-label="Cerrar" className="close-btn" onClick={onClose}>×</button>
          <h3>Perfil del usuario</h3>
        </div>
        <div className="panel-content">
          <div className="employee-info">
            <div className="employee-photo">
              {displayPhoto ? (
                <img src={displayPhoto} alt="Foto del usuario" />
              ) : (
                <UserCircle size={120} />
              )}
            </div>
            <div className="employee-details">
              <p className="employee-code">
                <span className="label">Código: </span> 
                {employee?.numEmpleado || "N/A"}
              </p>
              <div className="employee-name">
                <h2>
                  {displayName || "Usuario"}
                </h2>
              </div>
              <p className="employee-area">
                {teamName}
              </p>
              <div className="employee-email">
                <Mail size={18} />
                <span>{employee?.email || "Correo no disponible"}</span>
                {(employee?.email) && (
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
  );
};

export default UserFaceCardSimple;
