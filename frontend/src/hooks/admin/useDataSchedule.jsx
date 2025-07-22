import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const useDataSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [scheduleEdit, setScheduleEdit] = useState(null);

  // Obtener todos los horarios
  const fetchSchedules = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/schedules");
      setSchedules(res.data);
    } catch (error) {
      console.error("Error al obtener horarios:", error);
      Swal.fire("Error", "No se pudo obtener la lista de horarios.", "error");
    }
  };

  // Crear o actualizar desde formulario de creación
  const saveSchedule = async (scheduleData) => {
    try {
      if (scheduleEdit) {
        await axios.put(`http://localhost:4000/api/schedules/${scheduleEdit._id}`, scheduleData);
        Swal.fire("¡Actualizado!", "El horario ha sido actualizado.", "success");
      } else {
        await axios.post("http://localhost:4000/api/schedules", scheduleData);
        Swal.fire("¡Guardado!", "El horario ha sido creado.", "success");
      }
      fetchSchedules();
      handleCloseForm();
    } catch (error) {
      console.error("Error al guardar/actualizar horario:", error);
      Swal.fire("Error", "No se pudo guardar el horario.", "error");
    }
  };

  // Actualizar desde el modal de edición
  const updateSchedule = async (id, updatedData) => {
    try {
      await axios.put(`http://localhost:4000/api/schedules/${id}`, updatedData);
      Swal.fire("¡Actualizado!", "El horario ha sido actualizado correctamente.", "success");
      fetchSchedules();
    } catch (error) {
      console.error("Error al actualizar el horario:", error);
      Swal.fire("Error", "No se pudo actualizar el horario.", "error");
    }
  };

  // Eliminar horario
  const deleteSchedule = async (id) => {
    try {
      await axios.delete(`http://localhost:4000/api/schedules/${id}`);
      fetchSchedules();
      return { success: true };
    } catch (error) {
      console.error("Error al eliminar horario:", error);
      return { success: false };
    }
  };

  // Cerrar formulario y limpiar
  const handleCloseForm = () => {
    setShowForm(false);
    setScheduleEdit(null);
  };

  // Cargar al inicio
  useEffect(() => {
    fetchSchedules();
  }, []);

  // Exportar funciones y estados
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
