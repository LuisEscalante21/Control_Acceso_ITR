import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE_URL}${PORT}/api`;

const useDataTeams = () => {
  const [teams, setTeams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [teamEdit, setTeamEdit] = useState(null);
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

  // Obtener todos los equipos
  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${API_URL}/teams`, { withCredentials: true });
      setTeams(res.data);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de equipos.", "error");
    }
  };

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
        await fetchTeams();
      } catch (error) {
        handleNetworkError(error);
        Swal.fire("Error", "No se pudo eliminar el equipo.", "error");
      }
    }
  };

  // Cerrar formulario y limpiar estado
  const handleCloseForm = () => {
    setShowForm(false);
    setTeamEdit(null);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return {
    teams,
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
