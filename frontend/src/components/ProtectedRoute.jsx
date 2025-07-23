import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [userRole, setUserRole] = useState(null);
  const [isChecking, setIsChecking] = useState(true); 

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/checkAuth", {
          method: "GET",
          credentials: "include", // importante para enviar la cookie
        });

        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user.userType);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error verificando autenticación:", error);
        setUserRole(null);
      } finally {
        setIsChecking(false); // termina verificación
      }
    };

    checkAuth();
  }, []);

  // Mientras verifica sesión, muestra cargando
  if (isChecking) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <p>Verificando acceso…</p>
      </div>
    );
  }

  // Si no está autenticado o no tiene rol permitido
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado y tiene rol permitido
  return children;
};

export default ProtectedRoute;
