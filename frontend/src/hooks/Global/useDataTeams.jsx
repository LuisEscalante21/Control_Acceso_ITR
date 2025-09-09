import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE_URL}${PORT}/api/teams`;

const useDataTeams = () => {
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();

  const fetchTeams = async () => {
    try {
      const res = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Descomenta si tu API requiere API Key
          // "Authorization": `Bearer ${API_ACCESS_KEY}`,
        },
        credentials: "include", 
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("No autorizado o sesión expirada");
        }
        throw new Error("Error al obtener equipos");
      }

      const data = await res.json();
      setTeams(data || []);
    } catch (error) {
      console.error("Error al obtener equipos:", error);
      if (error?.message.includes("No autorizado")) {
        navigate("/login"); // redirigir a login si no está autorizado
      } else {
        navigate("/503"); // error de red o servidor
      }
    }
  };

  const getTeamNameById = (id) => {
    const found = teams.find((team) => team._id === id);
    return found ? found.name : "Área desconocida";
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return {
    teams,
    fetchTeams,
    getTeamNameById,
  };
};

export default useDataTeams;
