import React from "react";
import { UserCircle, CheckCircle2, Clock, BadgeCheck } from "lucide-react";
import JustifyButton from "../../Tools/Buttons/JustifyButton";
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
  /**
   * Formatea la fecha en español con mejor legibilidad
   * Ejemplo: "lun, 27 oct 2025"
   */
  const formatearFecha = (dateString) => {
    if (!dateString) return "Fecha no disponible";

    try {
      const fecha = new Date(dateString);

      // Verificar si la fecha es válida
      if (isNaN(fecha.getTime())) {
        console.error("Fecha inválida:", dateString);
        return "Fecha inválida";
      }

      // Opciones de formato en español
      const opciones = {
        weekday: "short", // lun, mar, mié
        day: "2-digit", // 01, 02, 27
        month: "short", // ene, feb, oct
        year: "numeric", // 2025
      };

      return fecha.toLocaleDateString("es-SV", opciones);
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Error en fecha";
    }
  };

  const fechaFormateada = formatearFecha(date);

  // 🔹 Normalizar el estado para comparación
  const normalized = (status || "pendiente").toLowerCase().trim();

  // 🔹 Determinar estilo, label e ícono según el estado
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
  } else if (normalized === "pendiente") {
    statusClass = "pending-label";
    statusLabel = "Pendiente";
    Icon = Clock;
  }

  // 🔹 Manejar clic en justificación (solo si está justificada)
  const handleStatusClick = () => {
    if (normalized === "justificada" && justification && onViewJustification) {
      onViewJustification(justification);
    }
  };

  // 🔹 Determinar si el estado es clickeable
  const isClickable =
    normalized === "justificada" && justification && onViewJustification;

  return (
    <div className="absence-card">
      {/* 🔹 Status dot visual */}
      <span
        className={`status-dot ${
          normalized === "justificada"
            ? "justified"
            : normalized === "con permiso"
            ? "permission"
            : "pending"
        }`}
      />

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
        {/* 🔹 SI showJustifyButton es true Y NO está justificada, mostrar JustifyButton */}
        {showJustifyButton &&
        normalized !== "justificada" &&
        normalized !== "con permiso" &&
        onJustifyClick ? (
          <JustifyButton onClick={onJustifyClick} />
        ) : (
          /* 🔹 SI NO, mostrar el label de estado */
          <span
            className={`${statusClass} ${isClickable ? "clickable" : ""}`}
            onClick={handleStatusClick}
            style={{ cursor: isClickable ? "pointer" : "default" }}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={(e) => {
              if (isClickable && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                handleStatusClick();
              }
            }}
            title={isClickable ? "Click para ver justificación" : ""}
          >
            <Icon size={16} /> {statusLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default AbsenceCard;
