import React from "react";
import { UserCircle, CheckCircle2, Clock, BadgeCheck } from "lucide-react";
import "../../styles/employee/AbsenceCard.css";

const AbsenceCard = ({
  name,
  avatar,
  employeeType,
  date,
  status = "pendiente",
  justification = null,
  onViewJustification = null,
  showJustifyButton = false,
  onJustifyClick = null,
}) => {
  // 🔹 Formatear fecha legible
  const fechaFormateada = new Date(date).toLocaleDateString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // 🔹 Normalizar el estado (minúsculas, sin espacios)
  const normalized = (status || "").toLowerCase().trim();

  // 🔹 Valores por defecto
  let statusClass = "pending-label";
  let statusLabel = "Pendiente";
  let Icon = Clock;

  // 🔹 Casos especiales
  if (normalized === "justificada") {
    statusClass = "justified-label";
    statusLabel = "Justificada";
    Icon = CheckCircle2;
  } else if (normalized === "con permiso") {
    statusClass = "permission-label";
    statusLabel = "Con permiso";
    Icon = BadgeCheck;
  }

  // 🔹 Si se hace clic en una justificada, mostrar la justificación
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

      {/* Estado y botón de justificar */}
      <div className="absence-status">
        <span
          className={`${statusClass} ${
            normalized === "justificada" && onViewJustification ? "clickable" : ""
          }`}
          onClick={handleClick}
        >
          <Icon size={16} /> {statusLabel}
        </span>

        {/* 🔹 Botón de justificar (solo visible si showJustifyButton = true) */}
        {showJustifyButton && (
          <button className="justify-btn" onClick={onJustifyClick}>
            Justificar
          </button>
        )}
      </div>
    </div>
  );
};

export default AbsenceCard;
