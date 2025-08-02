import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Error403 from "../pages/error/Error403";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/checkAuth", {
          method: "GET",
          credentials: "include", // importante para enviar cookies
        });

        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUserRole(data.user.userType); 
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error verificando autenticación:", error);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <p>Verificando acceso…</p>
      </div>
    );
  }

  // No autenticado → redirige a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Autenticado pero sin rol permitido → muestra error 403
  if (!allowedRoles.includes(userRole)) {
    return <Error403 />;
  }

  // Todo bien → muestra el contenido protegido
  return children;
};

export default ProtectedRoute;
