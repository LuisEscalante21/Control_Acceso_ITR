import React from 'react';
//import { AuthProvider } from './context/AuthProvider'; 
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
//Parte del administrador
import AdminDashboard from './pages/admin/Dashboard.jsx';
import Home from './components/admin/home.jsx'; 
import Empleados from './pages/admin/Empleados.jsx';
import Coordinators from './pages/admin/Coordinadores.jsx';
import Admins from './pages/admin/Admins.jsx';
import Accesos from './pages/admin/Accesos.jsx'; 
import Areas from './pages/admin/Areas.jsx';
import Horarios from './pages/admin/Horarios.jsx'; 
import Rostros from './pages/admin/Rostros.jsx';
//Parte del empleado
import EmployeeDashboard from './pages/employee/EmployeeDashboard.jsx';
//Parte del coordinador
import EmpleadosC from './pages/coordinator/Empleados.jsx';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard.jsx';
import './App.css';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin-dashboard/*"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          {/* Redirecciona al Dashboard */}
          <Route path="" element={<Navigate to="dashboard" />} />
          {/* Todas las Routes del AdminDashboard */}
          <Route path="dashboard" element={<Home/>} />
          <Route path="personal" element={<Empleados/>} />
          <Route path="horarios" element={<Horarios />} />
          <Route path="coordinadores" element={<Coordinators />} />
          <Route path="usuarios" element={<Admins/>} />
          <Route path="permisos" element={<h1>Gestión de Permisos</h1>} />
          <Route path="historial" element={<Accesos/>} />
          <Route path="registros" element={<Rostros/>} />
          <Route path="areas" element={<Areas />} />
        </Route>
        <Route
          path="/coordinator-dashboard"
          element={
            <ProtectedRoute allowedRoles={['Coordinator']}>
              <CoordinatorDashboard />
            </ProtectedRoute>
          }
        > {/* Redirecciona al Dashboard */}
          <Route path="" element={<Navigate to="dashboard" />} />
          {/* Rutas del empleado */}
          <Route path="dashboard" element={<h1>Inicio Empleado</h1>} />
          <Route path="empleado" element={<EmpleadosC/>} />
          <Route path="permisos" element={<h1>Gestión de permisos</h1>} />
          <Route path="historial" element={<h1>Historial de Accesos</h1>} />
          
        </Route>
        <Route
          path="/employee-dashboard/*"
          element={
            <ProtectedRoute allowedRoles={['Employee']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        >
          {/* Redirecciona al Dashboard */}
          <Route path="" element={<Navigate to="dashboard" />} />
          {/* Rutas del empleado */}
          <Route path="dashboard" element={<h1>Inicio Empleado</h1>} />
          <Route path="permisos" element={<h1>Mis Permisos</h1>} />
          <Route path="historial" element={<h1>Mi Historial de Accesos</h1>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;