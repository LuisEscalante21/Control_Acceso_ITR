import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/checkAuth', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user.userType);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        setUserRole(null);
      }
    };

    checkAuth();
  }, []);

  if (userRole === null) {
    return <div>Cargando...</div>;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;