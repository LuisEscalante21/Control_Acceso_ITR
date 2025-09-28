import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

// Pages
import LoginPage from "./pages/LoginPage/LoginPage";

// Auth
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";

// Admin
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import HomeAdmin from "./components/admin/home.jsx";
import Empleados from "./pages/admin/Empleados.jsx";
import Coordinators from "./pages/admin/Coordinadores.jsx";
import Admins from "./pages/admin/Admins.jsx";
import Accesos from "./pages/admin/Accesos.jsx";
import Absences from "./pages/admin/Absences.jsx";
import Areas from "./pages/admin/Areas.jsx";
import Horarios from "./pages/admin/Horarios.jsx";
import Rostros from "./pages/admin/Rostros.jsx";
import PermisosAdmin from "./pages/admin/Permissions.jsx";

// Coordinator
import CoordinatorDashboard from "./pages/coordinator/Dashboard.jsx";
import HomeCoordinator from "./components/coordinator/home.jsx";
import EmpleadosC from "./pages/coordinator/Empleados.jsx";
import CoordinatorAccesos from "./pages/coordinator/Accesos.jsx";
import CoordinatorPermisos from "./pages/coordinator/Permisos.jsx";
import CoordinatorsInasistencias from "./pages/coordinator/Absences.jsx";

// Employee
import EmployeeDashboard from "./pages/employee/Dashboard.jsx";
import HomeEmployee from "./pages/employee/Home.jsx";
import EmployeeAccesos from "./pages/employee/Accesos.jsx";
import EmployeePermisos from "./pages/employee/Permissions.jsx";

//Face recognition
import FaceReco from "./pages//videoCapture/VideoDashboard.jsx";

// Error Pages
import Error404 from "./pages/error/Error404.jsx";
import Error503 from "./pages/error/Error503.jsx";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta raíz redirige al login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Login solo si NO está autenticado */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />

        {/* Face recognition - no requiere login */}
        <Route path="/face-reco" element={<FaceReco />} />

        {/* Rutas del administrador */}
        <Route
          path="/admin-dashboard/*"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
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
          <Route path="permisos" element={<PermisosAdmin />} />
          <Route path="historial" element={<Accesos />} />
          <Route path="inasistencias" element={<Absences />} />
          <Route path="registros" element={<Rostros />} />
          <Route path="areas" element={<Areas />} />
          <Route path="*" element={<Error404 />} />
        </Route>

        {/* Rutas del coordinador */}
        <Route
          path="/coordinator-dashboard/*"
          element={
            <ProtectedRoute allowedRoles={["Coordinator"]}>
              <CoordinatorDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="" element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<HomeCoordinator />} />
          <Route path="empleado" element={<EmpleadosC />} />
          <Route path="permisosC" element={<CoordinatorPermisos />} />
          <Route path="historial" element={<CoordinatorAccesos />} />
          <Route path="inasistencias" element={<CoordinatorsInasistencias />} />

          <Route path="*" element={<Error404 />} />
        </Route>

        {/* Rutas del empleado */}
        <Route
          path="/employee-dashboard/*"
          element={
            <ProtectedRoute allowedRoles={["Employee"]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="" element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<HomeEmployee />} />
          <Route path="permisos" element={<EmployeePermisos />} />
          <Route path="historial" element={<EmployeeAccesos />} />
          <Route path="*" element={<Error404 />} />
        </Route>

        {/* Página 503 - uso para errores de respuestas del backend */}
        <Route path="/503" element={<Error503 />} />

        {/* Página para rutas no encontradas */}
        <Route path="*" element={<Error404 />} />
      </Routes>
    </Router>
  );
}

export default App;
