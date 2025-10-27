import React from "react";
import iconSalida from "../../../img/Salida_acceso.png";
import iconEntrada from "../../../img/Entrada_acceso.png";
import { UserCircle, CheckCircle2, Clock } from "lucide-react";
import "../../../components/styles/AccessCard.css";

const AccessCard = ({
  name,
  avatar,
  employeeType,
  timeLabel,
  time,
  tipoRegistro,
  isJustified = false,
  justification = null,
  onViewJustification = null,
}) => {
  /**
   * Formatea la hora correctamente con AM/PM
   * Solución al bug de AM/PM invertido
   */
  const formatearHora = (timestamp) => {
    if (!timestamp) return "N/A";

    try {
      const fecha = new Date(timestamp);

      // Verificar si la fecha es válida
      if (isNaN(fecha.getTime())) {
        console.error("Fecha inválida:", timestamp);
        return "Hora inválida";
      }

      // Obtener horas y minutos
      let horas = fecha.getHours();
      const minutos = fecha.getMinutes();

      // Determinar AM o PM
      const periodo = horas >= 12 ? "PM" : "AM";

      // Convertir a formato 12 horas
      if (horas === 0) {
        horas = 12; // Medianoche -> 12 AM
      } else if (horas > 12) {
        horas = horas - 12; // 13:00 -> 1 PM
      }

      // Formatear con ceros a la izquierda
      const horasStr = horas.toString().padStart(2, "0");
      const minutosStr = minutos.toString().padStart(2, "0");

      return `${horasStr}:${minutosStr} ${periodo}`;
    } catch (error) {
      console.error("Error al formatear hora:", error);
      return "Error en hora";
    }
  };

  const horaFormateada = formatearHora(time);

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

      {/* Nombre y tipo */}
      <div className="access-name">
        {name || "Sin nombre"}
        {employeeType && (
          <div className="access-employee-type">{employeeType}</div>
        )}
      </div>

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
