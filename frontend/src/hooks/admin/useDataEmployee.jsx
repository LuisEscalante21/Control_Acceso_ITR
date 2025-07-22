import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const useDataEmployee = () => {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Obtener todos los empleados
  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/employee");
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
        await axios.put(`http://localhost:4000/api/employee/${idToUpdate}`, employeeData);
        Swal.fire("¡Actualizado!", "El empleado ha sido actualizado.", "success");
      } else {
        // Crear empleado
        await axios.post("http://localhost:4000/api/registerEmployees", employeeData);
        Swal.fire("¡Guardado!", "El empleado ha sido creado.", "success");
      }
      fetchEmployees();
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

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:4000/api/employee/${id}`);
        Swal.fire("¡Eliminado!", "El empleado ha sido eliminado.", "success");
        fetchEmployees();
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