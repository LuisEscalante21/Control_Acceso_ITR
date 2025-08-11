import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Construir la URL base desde variables .env
const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE_URL}${PORT}/api/teams`;

const useDataTeams = () => {
  // Estado para almacenar la lista de áreas/equipos
  const [teams, setTeams] = useState([]);

  // Hook de navegación para redirigir si hay errores graves
  const navigate = useNavigate();

  // ✅ Función para obtener todos los equipos/áreas (GET /api/teams)
  const fetchTeams = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Error al obtener equipos");

      const data = await res.json();
      setTeams(data || []);
    } catch (error) {
      console.error("Error al obtener equipos:", error);
      // Redirigir a página de error si es un problema de red
      if (error?.code === "ERR_NETWORK" || error?.status === 503) {
        navigate("/503");
      }
    }
  };

  // ✅ Función utilitaria para buscar el nombre del área por su ID
  const getTeamNameById = (id) => {
    const found = teams.find((team) => team._id === id);
    return found ? found.name : "Área desconocida";
  };

  // Al montar el componente, obtener todos los equipos
  useEffect(() => {
    fetchTeams();
  }, []);

  // Exportar funciones y datos
  return {
    teams,             // Lista de equipos disponibles
    fetchTeams,        // Función para recargar la lista
    getTeamNameById,   // Función para traducir ID de área a nombre
  };
};

export default useDataTeams;
