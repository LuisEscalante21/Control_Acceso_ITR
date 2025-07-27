import React from "react";
import iconSalida from "../../../img/Salida_acceso.png";
import iconEntrada from "../../../img/Entrada_acceso.png";
import { UserCircle } from "lucide-react";
import "../../../components/styles/employee/AccessCard.css";

const AccessCard = ({
  name,
  avatar,
  timeLabel,
  time,
  tipoRegistro,
  showJustifyButton,
  onJustifyClick,
}) => {
  const horaFormateada = new Date(time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const icono =
    tipoRegistro === "entrada"
      ? iconEntrada
      : tipoRegistro === "salida"
      ? iconSalida
      : null;

  return (
    <div className={`access-card ${showJustifyButton ? "late-access" : ""}`}>
      <span className="status-dot" />

      <div className="access-avatar">
        {avatar ? (
          <img src={avatar} alt="Avatar" className="access-avatar-img" />
        ) : (
          <UserCircle size={48} className="access-avatar-icon" />
        )}
      </div>

      <div className="access-name">{name || "Sin nombre"}</div>

      <div className="access-time">
        {icono && <img src={icono} alt="Ícono de acceso" />}
        <span>
          {timeLabel}: {horaFormateada}
        </span>
      </div>

      {showJustifyButton && (
        <button className="justify-button" onClick={onJustifyClick}>
          Justificar
        </button>
      )}
    </div>
  );
};

export default AccessCard;
