import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE_URL}${PORT}/api`;

const useDataTeams = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [teams, setTeams] = useState([]);
  const [teamEdit, setTeamEdit] = useState(null);

  // Obtener todas las áreas
  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${API_URL}/teams`);
      setTeams(res.data);
    } catch (err) {
      Swal.fire("Error", "No se pudo obtener la lista de equipos.", "error");
    }
  };

  // Guardar o actualizar equipo
  const saveTeam = async (teamData) => {
    try {
      if (teamData._id) {
        // Actualizar
        await axios.put(`${API_URL}/teams/${teamData._id}`, teamData);
        Swal.fire("¡Actualizado!", "El equipo ha sido actualizado.", "success");
      } else {
        // Insertar
        await axios.post(`${API_URL}/teams`, teamData);
        Swal.fire("¡Guardado!", "El equipo ha sido guardado.", "success");
      }

      await fetchTeams();
      handleCloseModal();
    } catch (err) {
      Swal.fire("Error", "No se pudo guardar el equipo.", "error");
    }
  };

  // Eliminar equipo con confirmación
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
        Swal.fire("Error", "No se pudo eliminar el equipo.", "error");
      }
    }
  };

  // Cerrar modal y limpiar edición
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
