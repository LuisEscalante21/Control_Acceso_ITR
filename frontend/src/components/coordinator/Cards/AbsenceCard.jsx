import React from "react";
import { UserCircle, CheckCircle2, Clock, BadgeCheck } from "lucide-react";
import JustifyButton from "../../Tools/Buttons/JustifyButton"; // 🔹 Importar el componente
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
  const fechaFormateada = new Date(date).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // 🔹 Normalizar el estado
  const normalized = (status || "pendiente").toLowerCase().trim();

  // 🔹 Valores por defecto
  let statusClass = "pending-label";
  let statusLabel = "Sin justificar";
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

  // 🔹 Manejar clic en justificada
  const handleStatusClick = () => {
    if (normalized === "justificada" && justification && onViewJustification) {
      onViewJustification(justification);
    }
  };

  return (
    <div className="absence-card">
      {/* Avatar */}
      <div className="absence-avatar">
        {avatar ? (
          <img
            src={avatar}
            alt={`Avatar de ${name}`}
            className="absence-avatar-img"
          />
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
        {/* 🔹 SI showJustifyButton es true, mostrar el componente JustifyButton */}
        {showJustifyButton && onJustifyClick ? (
          <JustifyButton onClick={onJustifyClick} />
        ) : (
          /* 🔹 SI NO, mostrar el label de estado */
          <span
            className={`${statusClass} ${
              normalized === "justificada" && justification ? "clickable" : ""
            }`}
            onClick={handleStatusClick}
            role={
              normalized === "justificada" && justification
                ? "button"
                : undefined
            }
            tabIndex={
              normalized === "justificada" && justification ? 0 : undefined
            }
          >
            <Icon size={16} /> {statusLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default AbsenceCard;
