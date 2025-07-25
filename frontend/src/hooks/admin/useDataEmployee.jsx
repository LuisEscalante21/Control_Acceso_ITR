import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

// Variables de entorno
const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE_URL}${PORT}/api`;

const useDataEmployee = () => {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);

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

  // Crear o actualizar empleado
  const saveEmployee = async (employeeData, idToUpdate = null) => {
    try {
      if (idToUpdate) {
        // Actualizar empleado
        await axios.put(`${API_URL}/employee/${idToUpdate}`, employeeData);
        Swal.fire(
          "¡Actualizado!",
          "El empleado ha sido actualizado.",
          "success"
        );
      } else {
        // Crear empleado
        await axios.post(`${API_URL}/registerEmployees`, employeeData);
        Swal.fire("¡Guardado!", "El empleado ha sido creado.", "success");
      }
      await fetchEmployees();
      handleCloseForm();
    } catch (error) {
      const backendMessage = error?.response?.data?.message;

      if (backendMessage === "Email already exists.") {
        Swal.fire("Error", "Este correo ya está en uso.", "warning");
      } else if (backendMessage === "Invalid email format.") {
        Swal.fire("Error", "El correo tiene un formato inválido.", "warning");
      } else {
        Swal.fire("Error", "No se pudo guardar el administrador.", "error");
      }
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

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/employee/${id}`);
        Swal.fire("¡Eliminado!", "El empleado ha sido eliminado.", "success");
        await fetchEmployees();
      } catch (error) {
        console.error("Error al eliminar empleado:", error);
        Swal.fire("Error", "No se pudo eliminar el empleado.", "error");
      }
    }
  };

  // Cerrar formulario
  const handleCloseForm = () => {
    setShowForm(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    employees,
    showForm,
    setShowForm,
    fetchEmployees,
    saveEmployee,
    deleteEmployee,
    handleCloseForm,
  };
};

export default useDataEmployee;
