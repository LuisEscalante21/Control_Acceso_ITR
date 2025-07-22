import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  Home, 
  FileCheck, 
  Clock,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import '../../components/styles/SidebarEmployee.css'; 
import logoRical from '../../img/logo_rical.png';

export default function Sidebar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navigationItems = [
  { name: 'Dashboard', path: '/employee-dashboard/dashboard', icon: Home },
  { name: 'Mis Permisos', path: '/employee-dashboard/permisos', icon: FileCheck },
  { name: 'Historial de accesos', path: '/employee-dashboard/historial', icon: Clock}
];

  const handleLogout = async () => {
    // Mostrar alerta de confirmación
    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que deseas cerrar la sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Cerrando sesión...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const token = localStorage.getItem('authToken');

        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ token })
        });

        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
        sessionStorage.clear();

        Swal.close();

        await Swal.fire({
          title: '¡Sesión cerrada!',
          text: 'Has cerrado sesión correctamente',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        navigate('/login', { replace: true });

        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', function(event) {
          window.history.pushState(null, '', window.location.href);
        });

      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        Swal.close();

        await Swal.fire({
          title: 'Error de conexión',
          text: 'Hubo un problema al cerrar sesión en el servidor, pero se cerrará la sesión local',
          icon: 'warning',
          timer: 2000,
          showConfirmButton: false
        });

        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
        sessionStorage.clear();
        navigate('/login', { replace: true });
      }
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
          {isMenuOpen ? <X className="hamburger-icon" /> : <Menu className="hamburger-icon" />}
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
      <div className={`admin-sidebar ${isMenuOpen ? 'mobile-open' : ''}`}>
        {/* Header del sidebar */}
        <div className="admin-sidebar-header">
          <div className="admin-header-content">
            <div className="admin-logo-container">
              <img src={logoRical} alt="Logo Ricaldone" className="admin-logo-img" />
            </div>
            <div className="admin-header-text">
              <h1 className="admin-institute-title">
                INSTITUTO TÉCNICO
              </h1>
              <h2 className="admin-institute-subtitle">
                RICALDONE
              </h2>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="admin-navigation">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={index}
                to={item.path}
                className="admin-nav-item"
              >
                <Icon className="admin-nav-icon" />
                <span className="admin-nav-text">
                  {item.name}
                </span>
              </Link>
            );
          })}
          
          {/* Botón de cerrar sesión */}
          <button
            onClick={handleLogout}
            className="admin-nav-item admin-logout-btn"
          >
            <LogOut className="admin-nav-icon" />
            <span className="admin-nav-text">
              Cerrar sesión
            </span>
          </button>
        </nav>
      </div>
    </>
  );
}
