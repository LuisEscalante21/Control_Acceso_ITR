import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';

// Parte del administrador
import AdminDashboard from './pages/admin/Dashboard.jsx';
import HomeAdmin from './components/admin/home.jsx';
import Empleados from './pages/admin/Empleados.jsx';
import Coordinators from './pages/admin/Coordinadores.jsx';
import Admins from './pages/admin/Admins.jsx';
import Accesos from './pages/admin/Accesos.jsx';
import Areas from './pages/admin/Areas.jsx';
import Horarios from './pages/admin/Horarios.jsx';
import Rostros from './pages/admin/Rostros.jsx';

// Parte del coordinador
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard.jsx';
import EmpleadosC from './pages/coordinator/Empleados.jsx';

// Parte del empleado
import EmployeeDashboard from './pages/employee/Dashboard.jsx';
import HomeEmployee from './pages/employee/Home.jsx';

// Página de error
import ErrorPage from './pages/error/ErrorPage.jsx';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Login accesible solo si NO está autenticado */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />

        {/* Rutas protegidas del administrador */}
        <Route
          path="/admin-dashboard/*"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="" element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<HomeAdmin />} />
          <Route path="personal" element={<Empleados />} />
          <Route path="horarios" element={<Horarios />} />
          <Route path="coordinadores" element={<Coordinators />} />
          <Route path="usuarios" element={<Admins />} />
          <Route path="permisos" element={<h1>Gestión de Permisos</h1>} />
          <Route path="historial" element={<Accesos />} />
          <Route path="registros" element={<Rostros />} />
          <Route path="areas" element={<Areas />} />
          <Route path="*" element={<ErrorPage />} />
        </Route>

        {/* Rutas protegidas del coordinador */}
        <Route
          path="/coordinator-dashboard/*"
          element={
            <ProtectedRoute allowedRoles={['Coordinator']}>
              <CoordinatorDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="" element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<h1>Inicio Coordinador</h1>} />
          <Route path="personal" element={<h1>Gestión de Empleados</h1>} />
          <Route path="permisos" element={<h1>Gestión de Permisos</h1>} />
          <Route path="historial" element={<h1>Historial de Accesos</h1>} />
          <Route path="empleado" element={<EmpleadosC />} />
          <Route path="*" element={<ErrorPage />} />
        </Route>

        {/* Rutas protegidas del empleado */}
        <Route
          path="/employee-dashboard/*"
          element={
            <ProtectedRoute allowedRoles={['Employee']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="" element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<HomeEmployee />} />
          <Route path="permisos" element={<h1>Mis Permisos</h1>} />
          <Route path="historial" element={<h1>Mi Historial de Accesos</h1>} />
          <Route path="*" element={<ErrorPage />} />
        </Route>
        {/* Ruta de error para cualquier otra URL no definida */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Router>
  );
}

export default App;
