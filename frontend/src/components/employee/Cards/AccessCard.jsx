import React from "react";
import iconSalida from "../../../img/Salida_acceso.png";
import iconEntrada from "../../../img/Entrada_acceso.png";
import { UserCircle, CheckCircle } from "lucide-react";
import "../../../components/styles/employee/AccessCard.css";
import JustifyButton from "../../Tools/Buttons/JustifyButton";

const AccessCard = ({
  name,
  avatar,
  timeLabel,
  time,
  tipoRegistro,
  showJustifyButton,
  onJustifyClick,
  isJustified,
  resultLabel, // "Tarde", "Antes", etc.
}) => {
  // Validar que time sea fecha válida
  const horaFormateada = time
    ? new Date(time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  const icono =
    tipoRegistro === "entrada"
      ? iconEntrada
      : tipoRegistro === "salida"
      ? iconSalida
      : null;

  const isLateOrEarly = resultLabel === "Tarde" || resultLabel === "Antes";

  return (
    <div className={`access-card ${showJustifyButton ? "late-access" : ""}`}>
      <span className="status-dot" />

      <div className="access-avatar">
        {avatar ? (
          <img
            src={avatar}
            alt={`${name || "Empleado"} avatar`}
            className="access-avatar-img"
          />
        ) : (
          <UserCircle size={48} className="access-avatar-icon" />
        )}
      </div>

      <div className="access-name">{name || "Sin nombre"}</div>

      <div className="access-time">
        {icono && <img src={icono} alt={`Ícono de ${tipoRegistro}`} />}
        <span>
          {isLateOrEarly ? (
            <span style={{ color: "red", fontWeight: "bold" }}>
              {resultLabel}:
            </span>
          ) : (
            `${timeLabel}:`
          )}{" "}
          {horaFormateada}
        </span>
      </div>

      {/* Mostrar botón o etiqueta según justificación */}
      {isJustified ? (
        <div className="justified-label" title="Registro justificado">
          <CheckCircle color="green" size={20} style={{ marginRight: 5 }} />
          Justificada
        </div>
      ) : (
        showJustifyButton && <JustifyButton onClick={onJustifyClick} />
      )}
    </div>
  );
};

export default AccessCard;
