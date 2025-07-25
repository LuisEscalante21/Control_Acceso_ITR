    import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/error/Error403.css"; 
import lockIcon from "../../img/403.jpg";

const Error403 = () => {
  const navigate = useNavigate();

  return (
    <div className="error403-container">
      <div className="error403-card">
        <img src={lockIcon} alt="Acceso denegado" className="error403-icon" />
        <h1 className="error403-code">403</h1>
        <h2 className="error403-title">Acceso Denegado</h2>
        <p className="error403-message">
          No tienes permiso para acceder a esta página. <br />
          Por favor, verifica tus credenciales o contacta al administrador.
        </p>
        <button 
          className="error403-button"
          onClick={() => navigate(-1)} 
          aria-label="Volver atrás"
        >
          Volver atrás
        </button>
      </div>
    </div>
  );
};

export default Error403;
