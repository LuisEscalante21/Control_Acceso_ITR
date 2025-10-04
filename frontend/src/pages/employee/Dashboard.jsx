import { Outlet, useLocation } from 'react-router-dom';
import SidebarEmployee from '../../components/employee/SidebarEmployee';
import '../../styles/employee/Dashboard.css';

export default function Dashboard() {
  const location = useLocation();
  const currentPath = location.pathname;

  // Verifica si es una ruta dentro del employee dashboard
  const isEmployeeRoute = currentPath.startsWith('/employee-dashboard');

  // Lista de rutas válidas para empleado
  const validRoutes = [
    '/employee-dashboard/dashboard',
    '/employee-dashboard/permisos',
    '/employee-dashboard/historial',
    '/employee-dashboard/inasistencias',
  ];

  // Determina si es una página de error o ruta no válida
  const isErrorPage =
    ['/403', '/503'].some((err) => currentPath.includes(err)) ||
    (isEmployeeRoute && !validRoutes.some((path) => currentPath.startsWith(path)));

  return (
    <div className="admin-dashboard-container">
      {!isErrorPage && <SidebarEmployee />}
      <div className="admin-main-content">
        <Outlet />
      </div>
    </div>
  );
}
