import "../../styles/LoginPage.css";
import Swal from "sweetalert2";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LogoRedondo from "../../img/logo_redondo.png";
import RecoveryPasswordModal from "../../components/Tools/PageModals/RecoveryPassword";
import NewPass from "../../components/Tools/PageModals/newPass";

const BASE = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE}${PORT}/api`;

console.log("API URL:", API_URL);

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modales
  const [showRecovery, setShowRecovery] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        setLoading(true);
        const response = await fetch(`${API_URL}/checkAuth`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const userType = data.user.userType;

          if (userType === "Admin") {
            navigate("/admin-dashboard");
          } else if (userType === "Coordinator") {
            navigate("/coordinator-dashboard");
          } else if (userType === "Employee") {
            navigate("/employee-dashboard");
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 403) {
        if (data.message && data.message.toLowerCase().includes("bloqueada")) {
          Swal.fire({
            icon: "error",
            title: "Cuenta bloqueada",
            text: data.message,
          });
        } else {
          Swal.fire({
            icon: "warning",
            title: "Usuario inactivo",
            text: "Tu cuenta está inactiva. Por favor, contacta al administrador.",
          });
        }
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Error en la solicitud. Verifica tus credenciales."
        );
      }

      if (data.message === "login successful") {
        // Ruta de destino según rol
        const nextRoute =
          data.userType === "Admin"
            ? "/admin-dashboard"
            : data.userType === "Coordinator"
            ? "/coordinator-dashboard"
            : "/employee-dashboard";

        Swal.fire({
          icon: "success",
          title: "¡Inicio de sesión exitoso!",
          text: `Bienvenido, ${data.fullName}`,
          timer: 1600,
          showConfirmButton: false,
        });

        // Guardar token en localStorage
        if (data.token) {
          localStorage.setItem("authToken", data.token);
        }

        navigate(nextRoute);
      }
    } catch (error) {
      if (
        error.message === "Failed to fetch" ||
        error.message.includes("503")
      ) {
        navigate("/503");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error al iniciar sesión",
          text:
            error.message || "Ocurrió un error. Inténtalo de nuevo más tarde.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-container">
          <img src={LogoRedondo} alt="Logo" className="logo" />
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group password-group">
            <label htmlFor="password" className="input-label">
              Contraseña
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Contraseña"
              className="input-field"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Cargando..." : <b>Iniciar sesión</b>}
          </button>
        </form>

        {/* 🔗 Enlace para recuperar contraseña */}
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={() => setShowRecovery(true)}
            className="link-button"
            style={{
              background: "transparent",
              border: "none",
              color: "#1e88e5",
              textDecoration: "underline",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <div className="footer">
          <b>
            <p>Desarrollado por estudiantes de 3° de Desarrollo de Software</p>
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

      {/* Modal Recuperación */}
      <RecoveryPasswordModal
        open={showRecovery}
        onClose={() => setShowRecovery(false)}
        onVerified={() => setShowNewPass(true)}
      />

      {/* Modal Nueva Contraseña */}
      <NewPass
        open={showNewPass}
        onSuccess={async () => {
          setShowNewPass(false);
          setPassword("");
          await Swal.fire({
            icon: "success",
            title: "Restablecimiento correcto",
            text: "¡Inicia sesión ahora!",
            timer: 2200,
            showConfirmButton: false,
          });
        }}
      />
    </div>
  );
};

export default LoginPage;