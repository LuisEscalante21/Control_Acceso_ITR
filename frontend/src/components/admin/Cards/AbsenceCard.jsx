import React from "react";
import { UserCircle, CheckCircle2, Clock, BadgeCheck } from "lucide-react";
import "../../styles/Admin/AbsenceCard.css";

const AbsenceCard = ({
  name,
  avatar,
  employeeType,
  date,
  status = "pendiente",          //ahora llega el estado del backend
  justification = null,
  onViewJustification = null,
}) => {
  const fechaFormateada = new Date(date).toLocaleDateString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const normalized = (status || "").toLowerCase().trim();

  let statusClass = "pending-label";
  let statusLabel = "Sin justificar";
  let Icon = Clock;

  if (normalized === "justificada") {
    statusClass = "justified-label";
    statusLabel = "Justificada";
    Icon = CheckCircle2;
  } else if (normalized === "con permiso") {
    statusClass = "permission-label";
    statusLabel = "Con permiso";
    Icon = BadgeCheck;
  }

  const handleClick = () => {
    if (normalized === "justificada" && onViewJustification) {
      onViewJustification(justification);
    }
  };

  return (
    <div className="absence-card">
      {/* Avatar */}
      <div className="absence-avatar">
        {avatar ? (
          <img src={avatar} alt="Avatar" className="absence-avatar-img" />
        ) : (
          <UserCircle size={48} className="absence-avatar-icon" />
        )}
      </div>

      {/* Nombre y tipo */}
      <div className="absence-name">
        {name || "Sin nombre"}
        {employeeType && (
          <div className="absence-employee-type">{employeeType}</div>
        )}
      </div>

      {/* Fecha */}
      <div className="absence-date">
        <span>Fecha: {fechaFormateada}</span>
      </div>

      {/* Estado */}
      <div className="absence-status">
        <span
          className={`${statusClass} ${normalized === "justificada" && onViewJustification ? "clickable" : ""}`}
          onClick={handleClick}
        >
          <Icon size={16} /> {statusLabel}
        </span>
      </div>
    </div>
  );
};

export default AbsenceCard;
