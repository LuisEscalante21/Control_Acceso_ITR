import { LogOut } from "lucide-react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const BASE = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE}${PORT}/api`;

const LogoutButton = ({ className = "logout-btn" }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "¿Estás seguro de que deseas cerrar la sesión?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: "Cerrando sesión...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });

      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userData");
      sessionStorage.clear();

      document.cookie = "userInfo=; Max-Age=0; path=/";
      document.cookie = "authToken=; Max-Age=0; path=/";

      Swal.close();

      await Swal.fire({
        title: "¡Sesión cerrada!",
        text: "Has cerrado sesión correctamente",
        icon: "success",
        timer: 1000,
        showConfirmButton: false,
      });

      navigate("/login", { replace: true });

      window.history.pushState(null, "", window.location.href);
      window.addEventListener("popstate", () => {
        window.history.pushState(null, "", window.location.href);
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      Swal.close();

      await Swal.fire({
        title: "Error de conexión",
        text: "Hubo un problema al cerrar sesión en el servidor, pero se cerrará la sesión local",
        icon: "warning",
        timer: 1500,
        showConfirmButton: false,
      });

      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userData");
      sessionStorage.clear();

      document.cookie = "userInfo=; Max-Age=0; path=/";

      navigate("/login", { replace: true });
    }
  };

  return (
    <button className={className} onClick={handleLogout}>
      <LogOut size={18} />
      Cerrar sesión
    </button>
  );
};

export default LogoutButton;