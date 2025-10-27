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
   * 🔹 Formatea la fecha en español de El Salvador
   * Corrige el problema de formato usando "es-SV"
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

      const opciones = {
        weekday: "short", // lun, mar, mié
        day: "2-digit", // 01, 02, 27
        month: "short", // ene, feb, oct
        year: "numeric", // 2025
      };

      // 🔹 IMPORTANTE: Usar "es-SV" para El Salvador
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

  // 🔹 Determinar si el estado es clickeable
  const isClickable =
    normalized === "justificada" && justification && onViewJustification;

  // 🔹 Manejar clic en justificación (solo si está justificada)
  const handleStatusClick = () => {
    if (isClickable) {
      onViewJustification(justification);
    }
  };

  // 🔹 Manejar teclas para accesibilidad
  const handleKeyDown = (e) => {
    if (isClickable && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handleStatusClick();
    }
  };

  return (
    <div className="absence-card">
      {/* 🔹 Status dot visual (opcional - requiere CSS) */}
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
        {/* 🔹 SI showJustifyButton es true, mostrar el componente JustifyButton */}
        {showJustifyButton && onJustifyClick ? (
          <JustifyButton onClick={onJustifyClick} />
        ) : (
          /* 🔹 SI NO, mostrar el label de estado */
          <span
            className={`${statusClass} ${isClickable ? "clickable" : ""}`}
            onClick={handleStatusClick}
            onKeyDown={handleKeyDown}
            style={{ cursor: isClickable ? "pointer" : "default" }}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
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
