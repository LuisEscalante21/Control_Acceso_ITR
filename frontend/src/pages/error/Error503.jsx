import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/error/Error503.css";
import Image from "../../img/503.jpg"; 

const Error503 = () => {
  const navigate = useNavigate();

  return (
    <div className="error503-container">
      <div className="error503-card">
        <img src={Image} alt="Servidor caído" className="error503-image" />
        <h1 className="error503-title">503 - Servicio No Disponible</h1>
        <p className="error503-message">
          Lo sentimos, el servidor no está disponible en este momento. <br />
          Por favor, intenta nuevamente más tarde.
        </p>
        <button className="error503-button" onClick={() => navigate("/")}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default Error503;
