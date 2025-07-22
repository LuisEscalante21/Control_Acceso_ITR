// src/hooks/admin/useDataEmployee.jsx

import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const useDataEmployee = () => {
  // Estado global de empleados
  const [employees, setEmployees] = useState([]);
  // Control del formulario (nuevo/editar)
  const [showForm, setShowForm] = useState(false);

  // Estado para almacenar los empleados filtrados por coordinación (IdTeam)
  const [employeesByTeam, setEmployeesByTeam] = useState([]);

  /**
   * Trae todos los empleados desde el backend.
   */
  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/employee");
      setEmployees(res.data);
    } catch (error) {
      console.error("Error al obtener empleados:", error);
      Swal.fire("Error", "No se pudo obtener la lista de empleados.", "error");
    }
  };

  /**
   * Trae los empleados que pertenecen a una coordinación específica.
   * Usa el campo IdTeam de cada empleado para filtrar.
   */
  const fetchEmployeesByTeam = async (teamId) => {
    try {
      const res = await axios.get(
        `http://localhost:4000/api/employee/team/${teamId}`
      );
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

  /**
   * Crea un nuevo empleado o actualiza uno existente.
   * @param {Object} data - Los datos del empleado.
    @param {String|null} idToUpdate - ID del empleado a actualizar (si aplica).
   */
  const saveEmployee = async (data, idToUpdate = null) => {
    try {
      if (idToUpdate) {
        await axios.put(`http://localhost:4000/api/employee/${idToUpdate}`, data);
        Swal.fire("¡Actualizado!", "El empleado ha sido actualizado.", "success");
      } else {
        await axios.post("http://localhost:4000/api/registerEmployees", data);
        Swal.fire("¡Guardado!", "El empleado ha sido creado.", "success");
      }
      await fetchEmployees();
      handleCloseForm();
    } catch (error) {
      console.error("Error al guardar/actualizar empleado:", error);
      Swal.fire("Error", "No se pudo guardar el empleado.", "error");
    }
  };

  /**
   * Elimina un empleado tras confirmación del usuario.
   * @param {String} id - ID del empleado a eliminar.
   */
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
      await axios.delete(`http://localhost:4000/api/employee/${id}`);
      Swal.fire("¡Eliminado!", "El empleado ha sido eliminado.", "success");
      await fetchEmployees();
    } catch (error) {
      console.error("Error al eliminar empleado:", error);
      Swal.fire("Error", "No se pudo eliminar el empleado.", "error");
    }
  };

  /** Cierra el formulario y limpia su estado. */
  const handleCloseForm = () => {
    setShowForm(false);
  };

  // Al montar, cargamos la lista completa de empleados
  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    // CRUD global de empleados
    employees,
    fetchEmployees,
    saveEmployee,
    deleteEmployee,

    // Control del formulario
    showForm,
    setShowForm,
    handleCloseForm,

    // Filtrado por coordinación (IdTeam)
    employeesByTeam,
    fetchEmployeesByTeam,
  };
};

export default useDataEmployee;