import React, { useState, useEffect} from "react";
import "../styles/PerfilCard.css";
import { UserCircle, Mail, LogOut, Copy  } from "lucide-react";
import useEmployeeProfile from "../../hooks/widgets/useProfile";
import LogoutButton from "../../components/Logout";

const UserFaceCardSimple = ({ onClick }) => {
  const employee = useEmployeeProfile();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [teamName, setTeamName] = useState(""); 
  const [copied, setCopied] = useState(false);

    useEffect(() => {
    async function fetchTeam() {
      if (employee?.IdTeam) { 
        const response = await getTeamById(employee.IdTeam);
        setTeamName(response?.name || "Área no especificada");
      }
    }
    fetchTeam();
  }, [employee?.IdTeam]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(employee.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
      <div className="user-face-card-simple" onClick={openPanel}>
        <div className="photo-wrapper-simple">
          {employee && employee.photo ? (
            <img
              src={employee.photo}
              alt={employee.name}
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

      {isPanelOpen && (
        <div className="employee-panel-overlay" onClick={closePanel}>
          <div className="employee-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <div className="panel-header">
              <button className="close-icon" onClick={closePanel}>×</button>
              <h3>Perfil del empleado</h3>
            </div>
            </div>
            
            <div className="panel-content">
              <div className="employee-info">
                <div className="employee-photo">
                  {employee && employee.photo ? (
                    <img 
                      src={employee.photo} 
                      alt="Foto del empleado" 
                    />
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
                      {employee
                        ? `${employee.names || "Nombre"} ${employee.surnames|| "no disponible"}`
                        : "Nombre no disponible"}
                    </h2>
                  </div>
                  
                  <p className="employee-area">
                    {teamName || "Área no especificada"}
                  </p>
                 <div className="employee-email">
                  <Mail size={18} />
                  <span>{employee?.email || "Correo no disponible"}</span>
                  {employee?.email && (
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