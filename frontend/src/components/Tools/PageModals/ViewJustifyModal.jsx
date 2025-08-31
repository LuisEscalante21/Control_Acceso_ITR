import React from "react";
import "../../styles/employee/Justificacion.css";

export default function ViewJustifyModal({ isOpen, onClose, justification }) {
  if (!isOpen || !justification) return null;

  return (
    <div className={`modal-overlay ${isOpen ? "active" : ""}`}>
      <div className="justify-form">
        <button type="button" className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2>Detalle de Justificación</h2>

        <p><b>Motivo:</b> {justification.reason || "-"}</p>
        <p><b>Fecha:</b> {justification.date ? new Date(justification.date).toLocaleDateString() : "-"}</p>
        {justification.arrivalTime && (
          <p><b>Hora:</b> {justification.arrivalTime}</p>
        )}

        {justification.evidenceUrl && (
          <div className="preview">
            {justification.evidenceUrl.endsWith(".pdf") ? (
              <a href={justification.evidenceUrl} target="_blank" rel="noreferrer">
                Ver PDF
              </a>
            ) : (
              <img src={justification.evidenceUrl} alt="Evidencia" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
