import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const useDataEmployee = () => {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [employeesByTeam, setEmployeesByTeam] = useState([]);
  const navigate = useNavigate();

  // Manejo general de errores de red o servidor
  const handleNetworkError = (err) => {
    if (
      !err.response ||
      err.code === "ERR_NETWORK" ||
      err.response?.status === 503
    ) {
      navigate("/503"); // Redirigir a página 503
    } else {
      console.error("Error:", err);
    }
  };

  // Obtener todos los empleados
  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/employee");
      setEmployees(res.data);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de empleados.", "error");
    }
  };

  // Obtener empleados por equipo 
  const fetchEmployeesByTeam = async (teamId) => {
    try {
      const res = await axios.get("http://localhost:4000/api/employee/search", {
        params: { teamId },
      });
      setEmployeesByTeam(res.data);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire(
        "Error",
        "No se pudieron cargar los empleados de esta coordinación.",
        "error"
      );
    }
  };

  // Guardar o actualizar empleado
  const saveEmployee = async (data, idToUpdate = null) => {
    try {
      if (idToUpdate) {
        // Si es actualización, eliminar IdTeam para que no se actualice
        if (data instanceof FormData) {
          data.delete("IdTeam");
        }

        await axios.put(`http://localhost:4000/api/employee/${idToUpdate}`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        Swal.fire("¡Actualizado!", "El empleado ha sido actualizado.", "success");
      } else {
        await axios.post("http://localhost:4000/api/registerEmployees", data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        Swal.fire("¡Guardado!", "El empleado ha sido creado.", "success");
      }
      await fetchEmployees();
      handleCloseForm();
    } catch (error) {
      handleNetworkError(error);
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
      await axios.delete(`http://localhost:4000/api/employee/${id}`);
      Swal.fire("¡Eliminado!", "El empleado ha sido eliminado.", "success");
      await fetchEmployees(); // Refrescar lista
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo eliminar el empleado.", "error");
    }
  };

  // Cierra el formulario modal (o lo que uses)
  const handleCloseForm = () => setShowForm(false);

  // Cargar empleados al montar el hook/componente
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Exportamos estados y funciones
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
