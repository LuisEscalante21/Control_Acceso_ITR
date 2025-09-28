import React from "react";
import { UserCircle, CheckCircle2, Clock } from "lucide-react"; 
import "../../styles/Admin/AbsenceCard.css";

const AbsenceCard = ({
  name,
  avatar,
  employeeType,
  date,
  isJustified = false,
  justification = null,
  onViewJustification = null,
}) => {
  const fechaFormateada = new Date(date).toLocaleDateString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

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

      {/* Nombre y tipo */}
      <div className="access-name">
        {name || "Sin nombre"}
        {employeeType && <div className="access-employee-type">{employeeType}</div>}
      </div>

      {/* Fecha */}
      <div className="access-time">
        <span>Fecha: {fechaFormateada}</span>
      </div>

      {/* Estado de justificación */}
      <div className="access-status">
        {isJustified ? (
          <span
            className="justified-label clickable"
            onClick={() => onViewJustification && onViewJustification()}
          >
            <CheckCircle2 size={16} /> Justificada
          </span>
        ) : (
          <span className="pending-label">
            <Clock size={16} /> Sin justificar
          </span>
        )}
      </div>
    </div>
  );
};

export default AbsenceCard;