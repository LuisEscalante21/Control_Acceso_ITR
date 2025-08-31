import React from "react";
import iconSalida from "../../../img/Salida_acceso.png";
import iconEntrada from "../../../img/Entrada_acceso.png";
import { UserCircle, CheckCircle2, Clock } from "lucide-react"; // Íconos para estado
import "../../../components/styles/AccessCard.css";

const AccessCard = ({
  name,
  avatar,
  timeLabel,
  time,
  tipoRegistro,
  isJustified = false,
  justification = null, // información de la justificación
  onViewJustification = null, // callback para abrir modal
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

      {/* Estado de justificación */}
      <div className="access-status">
        {isJustified ? (
          <span
            className="justified-label clickable"
            onClick={() => onViewJustification && onViewJustification()}
          >
            <CheckCircle2 size={16} /> Justificado
          </span>
        ) : (
          <span className="pending-label">
            <Clock size={16} /> Pendiente
          </span>
        )}
      </div>
    </div>
  );
};

export default AccessCard;
