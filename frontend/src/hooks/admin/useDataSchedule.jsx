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

  // Manejo de error de red
  const handleNetworkError = (error) => {
    if (!error.response || error.code === "ERR_NETWORK" || error.response?.status === 503) {
      navigate("/503");
    } else {
      console.error("Error:", error);
    }
  };

  // Obtener todos los horarios
  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`${API_URL}/schedules`);
      setSchedules(res.data);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de horarios.", "error");
    }
  };

  // Guardar o actualizar horario
  const saveSchedule = async (scheduleData) => {
    try {
      if (scheduleEdit) {
        await axios.put(`${API_URL}/schedules/${scheduleEdit._id}`, scheduleData);
        Swal.fire("¡Actualizado!", "El horario ha sido actualizado.", "success");
      } else {
        await axios.post(`${API_URL}/schedules`, scheduleData);
        Swal.fire("¡Guardado!", "El horario ha sido creado.", "success");
      }
      await fetchSchedules();
      handleCloseForm();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo guardar el horario.", "error");
    }
  };

  // Actualizar horario
  const updateSchedule = async (id, updatedData) => {
    try {
      await axios.put(`${API_URL}/schedules/${id}`, updatedData);
      Swal.fire("¡Actualizado!", "El horario ha sido actualizado correctamente.", "success");
      await fetchSchedules();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo actualizar el horario.", "error");
    }
  };

  // Eliminar horario
  const deleteSchedule = async (id) => {
    try {
      await axios.delete(`${API_URL}/schedules/${id}`);
      await fetchSchedules();
      return { success: true };
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo eliminar el horario.", "error");
      return { success: false };
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
    updateSchedule,
    handleCloseForm,
  };
};

export default useDataSchedules;