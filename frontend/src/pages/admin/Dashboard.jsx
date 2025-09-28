import React from 'react';
import { Outlet, useLocation, useRoutes } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import '../../styles/Admin/Dashboard.css';

export default function RicaldoneNavigation() {
  const location = useLocation();

  // Detectar si estamos en una ruta no válida dentro del dashboard admin
  const currentPath = location.pathname;

  // Si el path NO incluye una ruta definida y está dentro del admin-dashboard
  const isAdminRoute = currentPath.startsWith('/admin-dashboard');
  const validRoutes = [
    '/admin-dashboard/dashboard',
    '/admin-dashboard/personal',
    '/admin-dashboard/horarios',
    '/admin-dashboard/coordinadores',
    '/admin-dashboard/usuarios',
    '/admin-dashboard/permisos',
    '/admin-dashboard/historial',
    '/admin-dashboard/inasistencias',
    '/admin-dashboard/registros',
    '/admin-dashboard/areas',
  ];

  const isErrorPage =
    ['/403', '/503'].some((err) => currentPath.includes(err)) ||
    (isAdminRoute && !validRoutes.some((path) => currentPath.startsWith(path)));

  return (
    <div className="admin-dashboard-container">
      {/* Oculta el Sidebar en rutas de error o rutas inválidas */}
      {!isErrorPage && <Sidebar />}

      <div className="admin-main-content">
        <Outlet />
      </div>
    </div>
  );
}
