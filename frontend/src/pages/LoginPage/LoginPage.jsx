import "../../styles/LoginPage.css";
import Swal from "sweetalert2";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import LogoRedondo from "../../img/logo_redondo.png";

// ✅ Modal "¿Olvidaste tu contraseña?"
import RecoveryPasswordModal from "../../components/Tools/PageModals/RecoveryPassword";

// ✅ Modal de NUEVA contraseña (forzado tras login con temporal)
import NewPass from "../../components/Tools/PageModals/newPass";

const BASE = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE}${PORT}/api`;

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modales
  const [showRecovery, setShowRecovery] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null); // a dónde navegar después de actualizar

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
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
      } catch {
        // silencioso
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

        // ¿Debe forzar cambio de contraseña?
        const requires =
          data.requiresPasswordUpdate === true ||
          data.requiresPasswordUpdate === "true";

        if (requires) {
          // No navegamos aún; abrimos modal bloqueante
          setPendingRoute(nextRoute);
          setShowNewPass(true);
          return;
        }

        // Sin forzar cambio -> flujo normal
        Swal.fire({
          icon: "success",
          title: "¡Inicio de sesión exitoso!",
          text: `Bienvenido, ${data.fullName}`,
          timer: 1600,
          showConfirmButton: false,
        });

        navigate(nextRoute);
      }
    } catch (error) {
      if (error.message === "Failed to fetch" || error.message.includes("503")) {
        navigate("/503");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error al iniciar sesión",
          text: error.message || "Ocurrió un error. Inténtalo de nuevo más tarde.",
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
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle-btn"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Cargando..." : <b>Iniciar sesión</b>}
          </button>
        </form>

        {/* 🔗 Enlace para recuperar contraseña (abre el modal de RECOVERY) */}
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

      {/* 🪟 Modal Recuperación */}
      <RecoveryPasswordModal
        open={showRecovery}
        onClose={() => setShowRecovery(false)}
      />

      {/* 🪟 Modal Nueva Contraseña (BLOQUEANTE, solo se cierra en éxito) */}
      <NewPass
        open={showNewPass}
        onSuccess={async () => {
          setShowNewPass(false);
          setPassword(""); // limpia por seguridad
          await Swal.fire({
            icon: "success",
            title: "Restablecimiento correcto",
            text: "¡Inicia sesión ahora!",
            timer: 2200,
            showConfirmButton: false,
          });
          // Navega a la ruta pendiente
          if (pendingRoute) navigate(pendingRoute);
        }}
      />
    </div>
  );
};

export default LoginPage;
