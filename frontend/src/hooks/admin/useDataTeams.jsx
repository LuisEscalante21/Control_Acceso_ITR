import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE_URL}${PORT}/api`;

// Cache global simple
let cachedTeams = null;

const useDataTeams = () => {
  const [teams, setTeams] = useState(cachedTeams || []);
  const [showForm, setShowForm] = useState(false);
  const [teamEdit, setTeamEdit] = useState(null);
  const [loading, setLoading] = useState(!cachedTeams);
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

  // Obtener equipos (usa cache si existe)
  const fetchTeams = useCallback(async () => {
    if (cachedTeams) return cachedTeams;

    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/teams`, { withCredentials: true });
      cachedTeams = res.data;
      setTeams(res.data);
      setLoading(false);
      return res.data;
    } catch (error) {
      setLoading(false);
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de equipos.", "error");
      return [];
    }
  }, []);

  // Guardar o actualizar equipo
  const saveTeam = async (teamData, idToUpdate = null) => {
    try {
      const config = { withCredentials: true };
      if (teamData instanceof FormData) config.headers = { "Content-Type": "multipart/form-data" };

      const teamId = idToUpdate || teamEdit?._id;

      if (teamId) {
        await axios.put(`${API_URL}/teams/${teamId}`, teamData, config);
        Swal.fire("¡Actualizado!", "El equipo ha sido actualizado.", "success");
      } else {
        await axios.post(`${API_URL}/teams`, teamData, config);
        Swal.fire("¡Guardado!", "El equipo ha sido guardado.", "success");
      }

      // Actualiza cache
      cachedTeams = null;
      await fetchTeams();
      handleCloseForm();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo guardar el equipo.", "error");
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
        cachedTeams = null;
        await fetchTeams();
      } catch (error) {
        handleNetworkError(error);
        Swal.fire("Error", "No se pudo eliminar el equipo.", "error");
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setTeamEdit(null);
  };

  // Inicialmente solo carga si no hay cache
  useEffect(() => {
    if (!cachedTeams) fetchTeams();
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
