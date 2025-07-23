import { Outlet } from 'react-router-dom';
import SidebarEmployee from '../../components/employee/SidebarEmployee';
import '../../styles/Admin/Dashboard.css';

export default function Dashboard() {
  return (
    <div className="admin-dashboard-container">
      <SidebarEmployee />
      <div className="admin-main-content">
        <Outlet />
      </div>
    </div>
  );
}