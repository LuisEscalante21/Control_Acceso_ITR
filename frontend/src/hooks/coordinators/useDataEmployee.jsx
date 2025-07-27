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
  const [employeesByTeam, setEmployeesByTeam] = useState([]);
  const navigate = useNavigate();

  // Manejo general de errores de red o servidor
  const handleNetworkError = (err) => {
    if (!err.response || err.code === "ERR_NETWORK" || err.response?.status === 503) {
      navigate("/503");  // Redirigir a página 503
    } else {
      console.error("Error:", err);
    }
  };

  // Obtener todos los empleados
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_URL}/employee`);
      setEmployees(res.data);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de empleados.", "error");
    }
  };

  // Obtener empleados por equipo (coordinación)
  const fetchEmployeesByTeam = async (teamId) => {
    try {
      const res = await axios.get(`${API_URL}/employee/team/${teamId}`);
      setEmployeesByTeam(res.data);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudieron cargar los empleados de esta coordinación.", "error");
    }
  };

  // Crear o actualizar empleado
  // data = objeto con datos, idToUpdate = _id para actualizar
  const saveEmployee = async (data, idToUpdate = null) => {
    try {
      if (idToUpdate) {
        await axios.put(`${API_URL}/employee/${idToUpdate}`, data);
        Swal.fire("¡Actualizado!", "El empleado ha sido actualizado.", "success");
      } else {
        await axios.post(`${API_URL}/registerEmployees`, data);
        Swal.fire("¡Guardado!", "El empleado ha sido creado.", "success");
      }
      await fetchEmployees(); // Refrescar lista
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
      await axios.delete(`${API_URL}/employee/${id}`);
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
