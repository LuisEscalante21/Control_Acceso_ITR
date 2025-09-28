import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {Home, UserCheck, Settings, Shield, Clock,Scan, LayoutGrid, UserCog, UserX, Menu, X, Calendar} from "lucide-react";
import "../../components/styles/Sidebar.css";
import logoRical from "../../img/logo_rical.png";
import UserFaceCardSimple from "../Perfil/UserFaceCardSimple.jsx"

const BASE = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE}${PORT}/api`;

export default function Sidebar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false); 
  const navigate = useNavigate();

  const navigationItems = [
    { name: "Dashboard", path: "/admin-dashboard/dashboard", icon: Home },
    { name: "Gestión de empleados", path: "/admin-dashboard/personal", icon: UserCheck },
    { name: "Gestión de coordinadores", path: "/admin-dashboard/coordinadores", icon: UserCog },
    { name: "Gestión de administradores", path: "/admin-dashboard/usuarios", icon: Settings },
    { name: "Gestión de permisos", path: "/admin-dashboard/permisos", icon: Shield },
    { name: "Historial de accesos", path: "/admin-dashboard/historial", icon: Clock },
    { name: "inasistencias", path: "/admin-dashboard/inasistencias", icon: UserX},
    { name: "Registros faciales", path: "/admin-dashboard/registros", icon: Scan },
    { name: "Gestión de áreas", path: "/admin-dashboard/areas", icon: LayoutGrid },
    { name: "Horarios", path: "/admin-dashboard/horarios", icon: Calendar },
    { name: "Perfil", icon: UserCog}
  ];

  return (
    <>
      {/* Menú hamburguesa para móviles */}
      <div className="admin-hamburger-menu">
        <img src={logoRical} alt="Logo Ricaldone" className="admin-logo-img" />
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="hamburger-button"
        >
          {isMenuOpen ? <X className="hamburger-icon" /> : <Menu className="hamburger-icon" />}
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
          if (item.name === "Perfil") {
            return (
              <button
                key={index}
                className="admin-nav-item"
                type="button"
                onClick={() => setShowProfileModal(true)}
              >
                <Icon className="admin-nav-icon" />
                <span className="admin-nav-text">{item.name}</span>
              </button>
            );
          }
          return (
            <Link key={index} to={item.path} className="admin-nav-item">
              <Icon className="admin-nav-icon" />
              <span className="admin-nav-text">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      </div>
      {/* Modal para el perfil */}
      {showProfileModal && (
        <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <UserFaceCardSimple onClose={() => setShowProfileModal(false)} />
          </div>
        </div>
      )}
    </>
  );
}
