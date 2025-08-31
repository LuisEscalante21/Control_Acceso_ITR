import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// constantes de entorno
const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE_URL}${PORT}/api`;

const useDataTeams = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [teams, setTeams] = useState([]);
  const [teamEdit, setTeamEdit] = useState(null);
  const navigate = useNavigate();

  // Manejo de errores de red
  const handleNetworkError = (err) => {
    if (
      !err.response ||
      err.code === "ERR_NETWORK" ||
      err.response?.status === 503
    ) {
      navigate("/503");
    } else {
      console.error("Error:", err);
    }
  };

  // Obtener todos los equipos
  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${API_URL}/teams`);
      setTeams(res.data);
    } catch (err) {
      handleNetworkError(err);
      Swal.fire("Error", "No se pudo obtener la lista de equipos.", "error");
    }
  };

  // Guardar o actualizar equipo
  const saveTeam = async (teamData) => {
    try {
      if (teamData._id) {
        await axios.put(`${API_URL}/teams/${teamData._id}`, teamData);
        Swal.fire("¡Actualizado!", "El equipo ha sido actualizado.", "success");
      } else {
        await axios.post(`${API_URL}/teams`, teamData);
        Swal.fire("¡Guardado!", "El equipo ha sido guardado.", "success");
      }
      await fetchTeams();
      handleCloseModal();
    } catch (err) {
      handleNetworkError(err);
      Swal.fire("Error", "No se pudo guardar el equipo.", "error");
    }
  };

  // Eliminar equipo
  const eliminarTeam = async (id) => {
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
        await axios.delete(`${API_URL}/teams/${id}`);
        Swal.fire("¡Eliminado!", "El equipo ha sido eliminado.", "success");
        await fetchTeams();
      } catch (err) {
        handleNetworkError(err);
        Swal.fire("Error", "No se pudo eliminar el equipo.", "error");
      }
    }
  };

  // Cerrar modal y limpiar estado
  const handleCloseModal = () => {
    setShowRegister(false);
    setTeamEdit(null);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return {
    showRegister,
    setShowRegister,
    teams,
    setTeams,
    teamEdit,
    setTeamEdit,
    fetchTeams,
    saveTeam,
    eliminarTeam,
    handleCloseModal,
  };
};

export default useDataTeams;