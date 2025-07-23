import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT; 
const API_URL = `${BASE_URL}${PORT}/api`;

const useDataEmployee = () => {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [employeesByTeam, setEmployeesByTeam] = useState([]);

  // Obtener todos los empleados
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_URL}/employee`);
      setEmployees(res.data);
    } catch (error) {
      console.error("Error al obtener empleados:", error);
      Swal.fire("Error", "No se pudo obtener la lista de empleados.", "error");
    }
  };

  // Obtener empleados por coordinación (IdTeam)
  const fetchEmployeesByTeam = async (teamId) => {
    try {
      const res = await axios.get(`${API_URL}/employee/team/${teamId}`);
      setEmployeesByTeam(res.data);
    } catch (error) {
      console.error("Error al obtener empleados por equipo:", error);
      Swal.fire(
        "Error",
        "No se pudieron cargar los empleados de esta coordinación.",
        "error"
      );
    }
  };

  // Crear o actualizar empleado
  const saveEmployee = async (data, idToUpdate = null) => {
    try {
      if (idToUpdate) {
        await axios.put(`${API_URL}/employee/${idToUpdate}`, data);
        Swal.fire("¡Actualizado!", "El empleado ha sido actualizado.", "success");
      } else {
        await axios.post(`${API_URL}/registerEmployees`, data);
        Swal.fire("¡Guardado!", "El empleado ha sido creado.", "success");
      }
      await fetchEmployees();
      handleCloseForm();
    } catch (error) {
      console.error("Error al guardar/actualizar empleado:", error);
      Swal.fire("Error", "No se pudo guardar el empleado.", "error");
    }
  };

  // Eliminar empleado con confirmación
  const deleteEmployee = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará al empleado.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/employee/${id}`);
      Swal.fire("¡Eliminado!", "El empleado ha sido eliminado.", "success");
      await fetchEmployees();
    } catch (error) {
      console.error("Error al eliminar empleado:", error);
      Swal.fire("Error", "No se pudo eliminar el empleado.", "error");
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    employees,
    fetchEmployees,
    saveEmployee,
    deleteEmployee,
    showForm,
    setShowForm,
    handleCloseForm,
    employeesByTeam,
    fetchEmployeesByTeam,
  };
};

export default useDataEmployee;