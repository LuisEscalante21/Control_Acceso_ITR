import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import '../../styles/Admin/Dashboard.css';

export default function RicaldoneNavigation() {
  return (
    <div className="admin-dashboard-container">
      <Sidebar />
      {/* Main Content Area */}
      <div className="admin-main-content">
        <Outlet />
      </div>
    </div>
  );
}