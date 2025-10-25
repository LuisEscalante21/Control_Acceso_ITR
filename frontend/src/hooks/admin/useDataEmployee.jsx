import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE_URL}${PORT}/api`;

const useDataEmployee = () => {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [employeeEdit, setEmployeeEdit] = useState(null);
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

  // Obtener empleados
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_URL}/employee`, { withCredentials: true });
      setEmployees(res.data);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de empleados.", "error");
    }
  };

  // Guardar o actualizar empleado
  const saveEmployee = async (employeeData, idToUpdate = null) => {
    try {
      const config = { withCredentials: true };
      if (employeeData instanceof FormData) config.headers = { "Content-Type": "multipart/form-data" };

      const employeeId = idToUpdate || employeeEdit?._id;

      if (employeeId) {
        // Permitir actualizar IdTeam al editar un empleado (antes se eliminaba)
        await axios.put(`${API_URL}/employee/${employeeId}`, employeeData, config);
        Swal.fire("¡Actualizado!", "El empleado ha sido actualizado.", "success");
      } else {
        await axios.post(`${API_URL}/registerEmployees`, employeeData, config);
        Swal.fire("¡Guardado!", "El empleado ha sido creado.", "success");
      }

      await fetchEmployees();
      handleCloseForm();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo guardar el empleado.", "error");
    }
  };

  // Eliminar empleado
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
        await axios.delete(`${API_URL}/employee/${id}`, { withCredentials: true });
        Swal.fire("¡Eliminado!", "El empleado ha sido eliminado.", "success");
        await fetchEmployees();
      } catch (error) {
        handleNetworkError(error);
        Swal.fire("Error", "No se pudo eliminar el empleado.", "error");
      }
    }
  };

  // Cerrar formulario
  const handleCloseForm = () => {
    setShowForm(false);
    setEmployeeEdit(null);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    employees,
    showForm,
    setShowForm,
    employeeEdit,
    setEmployeeEdit,
    fetchEmployees,
    saveEmployee,
    deleteEmployee,
    handleCloseForm,
  };
};

export default useDataEmployee;
