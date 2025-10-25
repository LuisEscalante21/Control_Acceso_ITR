import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE_URL}${PORT}/api`;

const useDataTeams = () => {
  const [teams, setTeams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [teamEdit, setTeamEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Manejo de errores
  const handleNetworkError = (error) => {
    if (!error.response || error.code === "ERR_NETWORK" || error.response?.status === 503) {
      navigate("/503");
    } else if (error.response?.status === 401) {
      Swal.fire("Error", "No autorizado. Por favor inicia sesión.", "error");
      navigate("/login");
    } else {
      console.error("Error:", error);
    }
  };

  // Obtener equipos - SIEMPRE consulta al servidor
  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/teams`, { withCredentials: true });
      setTeams(res.data);
      setLoading(false);
      return res.data;
    } catch (error) {
      setLoading(false);
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de equipos.", "error");
      return [];
    }
  }, [navigate]);

  // Guardar o actualizar equipo
  const saveTeam = async (teamData, idToUpdate = null) => {
    try {
      const config = { withCredentials: true };
      
      // NO envíes FormData para equipos simples
      if (teamData instanceof FormData) {
        config.headers = { "Content-Type": "multipart/form-data" };
      }

      const teamId = idToUpdate || teamEdit?._id;

      console.log("🔵 saveTeam llamado con:", { 
        teamData, 
        teamId, 
        esActualizacion: !!teamId,
        url: teamId ? `${API_URL}/teams/${teamId}` : `${API_URL}/teams`
      });

      if (teamId) {
        // ACTUALIZAR - asegúrate que solo envías { name: "..." }
        console.log("🟡 Haciendo PUT a:", `${API_URL}/teams/${teamId}`);
        const response = await axios.put(`${API_URL}/teams/${teamId}`, teamData, config);
        console.log("✅ Respuesta del servidor (update):", response.data);
        Swal.fire("¡Actualizado!", "El equipo ha sido actualizado.", "success");
      } else {
        // CREAR NUEVO
        console.log("🟢 Haciendo POST a:", `${API_URL}/teams`);
        const response = await axios.post(`${API_URL}/teams`, teamData, config);
        console.log("✅ Respuesta del servidor (create):", response.data);
        Swal.fire("¡Guardado!", "El equipo ha sido guardado.", "success");
      }

      // Refresca la lista inmediatamente
      await fetchTeams();
      handleCloseForm();
      return true;
    } catch (error) {
      console.error("Error completo en saveTeam:", error.response?.data || error);
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo guardar el equipo.", "error");
      return false;
    }
  };

  // Eliminar equipo con confirmación
  const deleteTeam = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡Esta acción eliminará el equipo!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/teams/${id}`, { withCredentials: true });
        Swal.fire("¡Eliminado!", "El equipo ha sido eliminado.", "success");
        
        // Refresca la lista inmediatamente
        await fetchTeams();
        return true;
      } catch (error) {
        handleNetworkError(error);
        Swal.fire("Error", "No se pudo eliminar el equipo.", "error");
        return false;
      }
    }
    return false;
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setTeamEdit(null);
  };

  // Carga inicial
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return {
    teams,
    loading,
    showForm,
    setShowForm,
    teamEdit,
    setTeamEdit,
    fetchTeams,
    saveTeam,
    deleteTeam,
    handleCloseForm,
  };
};

export default useDataTeams;