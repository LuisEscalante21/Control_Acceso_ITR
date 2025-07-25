import "../../styles/LoginPage.css";
import Swal from "sweetalert2";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LogoRedondo from "../../img/logo_redondo.png";

const BASE = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE}${PORT}/api`;

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Verificar si ya hay una sesión activa
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/checkAuth`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const userType = data.user.userType;

          // Redirige automáticamente según el rol
          if (userType === "Admin") {
            navigate("/admin-dashboard");
          } else if (userType === "Coordinator") {
            navigate("/coordinator-dashboard");
          } else if (userType === "Employee") {
            navigate("/employee-dashboard");
          }
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error de autenticación",
          text: `Usuario no autenticado o error al verificar sesión: ${
            error.message || error
          }`,
        });
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 403) {
        Swal.fire({
          icon: "warning",
          title: "Usuario inactivo",
          text: "Tu cuenta está inactiva. Por favor, contacta al administrador.",
        });
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Error en la solicitud. Verifica tus credenciales."
        );
      }

      if (data.message === "login successful") {
        Swal.fire({
          icon: "success",
          title: "¡Inicio de sesión exitoso!",
          text: `Bienvenido, ${data.userType}`,
          timer: 1900,
          showConfirmButton: false,
        });

        // Redirigir según el rol
        if (data.userType === "Admin") {
          navigate("/admin-dashboard");
        } else if (data.userType === "Coordinator") {
          navigate("/coordinator-dashboard");
        } else if (data.userType === "Employee") {
          navigate("/employee-dashboard");
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al iniciar sesión",
        text:
          error.message || "Ocurrió un error. Inténtalo de nuevo más tarde.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-container">
          <img
            src={LogoRedondo}
            alt="Instituto Técnico Ricaldone Logo"
            className="logo"
          />
          <h1 className="title">
            Bienvenido al Sistema de Control
            <br />
            de Acceso ITR
          </h1>
        </div>

        <p className="subtitle">
          Ingresa tus credenciales para acceder al sistema
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email" className="input-label">
              Correo electrónico institucional
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Email"
              className="input-field"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Contraseña"
              className="input-field"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Cargando..." : <b>Iniciar sesión</b>}
          </button>
        </form>

        <div className="footer">
          <b>
            <p>Desarrollado por el departamento de Desarrollo de Software</p>
          </b>
          <b>
            <p>
              del{" "}
              <a
                href="https://www.ricaldone.edu.sv/"
                className="highlight"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instituto Técnico Ricaldone
              </a>
            </p>
          </b>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
