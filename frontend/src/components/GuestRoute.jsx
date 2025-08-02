import { Navigate } from 'react-router-dom';

const GuestRoute = ({ children }) => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (user) {
    const role = user.role;
    if (role === 'Admin') return <Navigate to="/admin-dashboard" />;
    if (role === 'Coordinator') return <Navigate to="/coordinator-dashboard" />;
    if (role === 'Employee') return <Navigate to="/employee-dashboard" />;
  }

  return children;
};

export default GuestRoute;