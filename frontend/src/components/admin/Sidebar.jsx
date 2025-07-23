import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {Home, Users, UserCheck, Settings, Shield, Clock, Scan, LayoutGrid, UserCog, Menu, X, LogOut, Calendar,} from "lucide-react";
import "../../components/styles/Sidebar.css";
import logoRical from "../../img/logo_rical.png";

const BASE = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE}${PORT}/api`;

export default function Sidebar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate(); 

  const navigationItems = [
    { name: "Dashboard", path: "/admin-dashboard/dashboard", icon: Home },
    {
      name: "Gestión de empleados",
      path: "/admin-dashboard/personal",
      icon: UserCheck,
    },
    {
      name: "Gestión de coordinadores",
      path: "/admin-dashboard/coordinadores",
      icon: UserCog,
    },
    {
      name: "Gestión de administradores",
      path: "/admin-dashboard/usuarios",
      icon: Settings,
    },
    {
      name: "Gestión de permisos",
      path: "/admin-dashboard/permisos",
      icon: Shield,
    },
    {
      name: "Historial de accesos",
      path: "/admin-dashboard/historial",
      icon: Clock,
    },
    {
      name: "Registros faciales",
      path: "/admin-dashboard/registros",
      icon: Scan,
    },
    {
      name: "Gestión de áreas",
      path: "/admin-dashboard/areas",
      icon: LayoutGrid,
    },
    { name: "Horarios", path: "/admin-dashboard/horarios", icon: Calendar },
  ];

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

      Swal.close();

      await Swal.fire({
        title: "¡Sesión cerrada!",
        text: "Has cerrado sesión correctamente",
        icon: "success",
        timer: 1000,
        showConfirmButton: false,
      });

      navigate("/login", { replace: true });

      // Prevenir retroceso
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

      navigate("/login", { replace: true });
    }
  };

  return (
    <>
      {/* Menú hamburguesa para móviles */}
      <div className="admin-hamburger-menu">
        <img src={logoRical} alt="Logo Ricaldone" className="admin-logo-img" />
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="hamburger-button"
        >
          {isMenuOpen ? (
            <X className="hamburger-icon" />
          ) : (
            <Menu className="hamburger-icon" />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <div className={`admin-sidebar ${isMenuOpen ? "mobile-open" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="admin-header-content">
            <div className="admin-logo-container">
              <img
                src={logoRical}
                alt="Logo Ricaldone"
                className="admin-logo-img"
              />
            </div>
            <div className="admin-header-text">
              <h1 className="admin-institute-title">INSTITUTO TÉCNICO</h1>
              <h2 className="admin-institute-subtitle">RICALDONE</h2>
            </div>
          </div>
        </div>

        <nav className="admin-navigation">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link key={index} to={item.path} className="admin-nav-item">
                <Icon className="admin-nav-icon" />
                <span className="admin-nav-text">{item.name}</span>
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="admin-nav-item admin-logout-btn"
          >
            <LogOut className="admin-nav-icon" />
            <span className="admin-nav-text">Cerrar sesión</span>
          </button>
        </nav>
      </div>
    </>
  );
}
