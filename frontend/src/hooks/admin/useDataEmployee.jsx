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
    if (
      !error.response ||
      error.code === "ERR_NETWORK" ||
      error.response?.status === 503
    ) {
      navigate("/503");
    } else if (error.response?.status === 401) {
      Swal.fire("Error", "No autorizado. Por favor inicia sesión.", "error");
      navigate("/login");
    } else {
      console.error("Error:", error);
    }
  };

  // 🔹 ACTUALIZADO: Obtener empleados con filtro opcional por área
  const fetchEmployees = async (options = {}) => {
    try {
      let url = `${API_URL}/employee`;
      const config = { withCredentials: true };

      // 🔹 Si hay filtro por equipo, obtener todos y filtrar en frontend
      const res = await axios.get(url, config);
      let employeesList = res.data;

      // 🔹 Filtro por área/equipo (filtrado en frontend)
      if (options.teamId) {
        employeesList = employeesList.filter((emp) => {
          // Compara con el ID del equipo (puede venir como objeto poblado o como string)
          const empTeamId = emp.IdTeam?._id || emp.IdTeam;
          return empTeamId === options.teamId;
        });
      }

      setEmployees(employeesList);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de empleados.", "error");
    }
  };

  // Guardar o actualizar empleado
  const saveEmployee = async (employeeData, idToUpdate = null) => {
    try {
      const config = { withCredentials: true };
      if (employeeData instanceof FormData)
        config.headers = { "Content-Type": "multipart/form-data" };

      const employeeId = idToUpdate || employeeEdit?._id;

      if (employeeId) {
        if (employeeData instanceof FormData) employeeData.delete("IdTeam");
        else delete employeeData.IdTeam;
        await axios.put(
          `${API_URL}/employee/${employeeId}`,
          employeeData,
          config
        );
        Swal.fire(
          "¡Actualizado!",
          "El empleado ha sido actualizado.",
          "success"
        );
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
        await axios.delete(`${API_URL}/employee/${id}`, {
          withCredentials: true,
        });
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
