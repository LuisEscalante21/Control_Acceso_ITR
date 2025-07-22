import React from "react";
import "../../styles/docenteCard.css";

const DocenteCard = ({ status, name, surnames, photo, onClick }) => {
  return (
    <div className="docente-card" onClick={onClick} style={{ cursor: "pointer" }}>
  <div className="docente-info">
    <div className={`status-indicator ${status ? "online" : "offline"}`}></div>
    <img src={photo} alt={`${name} ${surnames}`} className="docente-avatar" />
    <p className="docente-nombre">
      Nombre: <span className="bold">{name} {surnames}</span>
    </p>
  </div>
</div>

  );
};

export default DocenteCard;
