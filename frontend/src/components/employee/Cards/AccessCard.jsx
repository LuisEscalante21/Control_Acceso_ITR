import React from "react";
import iconSalida from "../../../img/Salida_acceso.png";
import iconEntrada from "../../../img/Entrada_acceso.png";
import { UserCircle, CheckCircle, Clock } from "lucide-react";
import "../../../components/styles/employee/AccessCard.css";
import JustifyButton from "../../Tools/Buttons/JustifyButton";

const AccessCard = ({
  name,
  avatar,
  timeLabel,
  time,
  tipoRegistro,
  showJustifyButton,
  isJustified,
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
    <div className="access-card">
      {/* Estado con puntito */}
      <span
        className={`status-dot ${isJustified ? "justified" : "pending"}`}
      />

      {/* Avatar */}
      <div className="access-avatar">
        {avatar ? (
          <img src={avatar} alt="Avatar" className="access-avatar-img" />
        ) : (
          <UserCircle size={48} className="access-avatar-icon" />
        )}
      </div>

      {/* Nombre */}
      <div className="access-name">{name || "Sin nombre"}</div>

      {/* Hora + icono */}
      <div className="access-time">
        {icono && <img src={icono} alt="Ícono de acceso" />}
        <span>
          {timeLabel}: {horaFormateada}
        </span>
      </div>

      {/* Botón de justificar si no está justificado */}
      {showJustifyButton && !isJustified && (
        <JustifyButton onClick={onJustifyClick} />
      )}

      {/* Labels con íconos de estado */}
      {isJustified && (
        <span className="justified-label">
          <CheckCircle size={16} className="icon-justified" /> Justificado
        </span>
      )}
      {!isJustified && showJustifyButton && (
        <span className="pending-label">
          <Clock size={16} className="icon-pending" /> Pendiente
        </span>
      )}
    </div>
  );
};

export default AccessCard;
