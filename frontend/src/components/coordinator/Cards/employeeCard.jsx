import React from "react";
import "../../styles/docenteCard.css";
import { UserCircle } from "lucide-react";

const DocenteCard = ({ status, name, surnames, photo, onClick }) => {
  const hasPhoto = photo && photo.startsWith("http");

  return (
    <div className="docente-card" onClick={onClick} style={{ cursor: "pointer" }}>
      <div className="docente-info">
        <div className={`status-indicator ${status ? "online" : "offline"}`}></div>

        {hasPhoto ? (
          <img src={photo} alt={`${name} ${surnames}`} className="docente-avatar" />
        ) : (
          <UserCircle className="docente-avatar" size={50} color="#ccc" />
        )}

        <p className="docente-nombre">
          Nombre: <span className="bold">{name} {surnames}</span>
        </p>
      </div>
    </div>
  );
};

export default DocenteCard;