import { Outlet } from 'react-router-dom';
import SidebarCoordinator from '../../components/coordinator/SidebarCoordinator';
import '../../styles/Admin/Dashboard.css';

export default function EmployeeDashboard() {
  return (
    <div className="admin-dashboard-container">
      <SidebarCoordinator />
      <div className="admin-main-content">
        <Outlet />
      </div>
    </div>
  );
}