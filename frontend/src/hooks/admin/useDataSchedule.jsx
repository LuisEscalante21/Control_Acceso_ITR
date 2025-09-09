import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE_URL}${PORT}/api`;

const useDataSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [scheduleEdit, setScheduleEdit] = useState(null);
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

  // Obtener todos los horarios
  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`${API_URL}/schedules`, { withCredentials: true });
      setSchedules(res.data);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de horarios.", "error");
    }
  };

  // Guardar o actualizar horario
  const saveSchedule = async (scheduleData, idToUpdate = null) => {
    try {
      const config = { withCredentials: true };
      if (scheduleData instanceof FormData) config.headers = { "Content-Type": "multipart/form-data" };

      const scheduleId = idToUpdate || scheduleEdit?._id;

      if (scheduleId) {
        await axios.put(`${API_URL}/schedules/${scheduleId}`, scheduleData, config);
        Swal.fire("¡Actualizado!", "El horario ha sido actualizado.", "success");
      } else {
        await axios.post(`${API_URL}/schedules`, scheduleData, config);
        Swal.fire("¡Guardado!", "El horario ha sido creado.", "success");
      }

      await fetchSchedules();
      handleCloseForm();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo guardar el horario.", "error");
    }
  };

  // Eliminar horario con confirmación
  const deleteSchedule = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará el horario.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/schedules/${id}`, { withCredentials: true });
        Swal.fire("¡Eliminado!", "El horario ha sido eliminado.", "success");
        await fetchSchedules();
      } catch (error) {
        handleNetworkError(error);
        Swal.fire("Error", "No se pudo eliminar el horario.", "error");
      }
    }
  };

  // Cerrar formulario y limpiar estado
  const handleCloseForm = () => {
    setShowForm(false);
    setScheduleEdit(null);
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return {
    schedules,
    showForm,
    setShowForm,
    scheduleEdit,
    setScheduleEdit,
    fetchSchedules,
    saveSchedule,
    deleteSchedule,
    handleCloseForm,
  };
};

export default useDataSchedules;
