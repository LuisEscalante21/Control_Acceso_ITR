import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, FileCheck, Clock, Menu, X, LogOut } from "lucide-react";
import "../../components/styles/SidebarEmployee.css";
import logoRical from "../../img/logo_rical.png";

const BASE = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE}${PORT}/api`;

export default function Sidebar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navigationItems = [
    { name: "Dashboard", path: "/employee-dashboard/dashboard", icon: Home },
    {
      name: "Mis Permisos",
      path: "/employee-dashboard/permisos",
      icon: FileCheck,
    },
    {
      name: "Historial de accesos",
      path: "/employee-dashboard/historial",
      icon: Clock,
    },
    
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
          {isMenuOpen ? (
            <X className="hamburger-icon" />
          ) : (
            <Menu className="hamburger-icon" />
          )}
        </button>
      </div>

      {/* Overlay para cerrar el menú en móviles */}
      {isMenuOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`admin-sidebar ${isMenuOpen ? "mobile-open" : ""}`}>
        {/* Header del sidebar */}
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

        {/* Navegación */}
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
        </nav>
      </div>
    </>
  );
}
