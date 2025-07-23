import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/error/ErrorPage.css"; 
import errorImage from "../../img/404.jpg";

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="error-container">
      <div className="error-content">
        <h1 className="error-title">Oops!</h1>
        <h2 className="error-subtitle">Algo salió mal.</h2>
        <p className="error-text">
          La página que estás buscando no existe <br />
          y no sabemos cómo llegaste aquí. <br />
          Presiona el siguiente botón para regresar al sistema.
        </p>
        <button className="error-button" onClick={() => navigate("/")}>
          Ir al inicio
        </button>
      </div>
      <div className="error-image">
        <img src={errorImage} alt="Error 404" />
      </div>
    </div>
  );
};

export default ErrorPage;
