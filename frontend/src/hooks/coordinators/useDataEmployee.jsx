import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;
const BASE_URL = "http://localhost:4000";

const useDataEmployee = () => {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [employeesByTeam, setEmployeesByTeam] = useState([]);
  const navigate = useNavigate();

  const axiosConfig = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_ACCESS_KEY}`,
    },
    withCredentials: true,
  };

  const handleNetworkError = (err) => {
    if (!err.response || err.code === "ERR_NETWORK" || err.response?.status === 503) {
      navigate("/503");
    } else if (err.response?.status === 401 || err.response?.status === 403) {
      Swal.fire("Error", "API Key inválida o no autorizada.", "error");
    } else {
      console.error("Error:", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/employee`, axiosConfig);
      setEmployees(res.data);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de empleados.", "error");
    }
  };

  const fetchEmployeesByTeam = async (teamId) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/employee/search`, {
        ...axiosConfig,
        params: { teamId },
      });

      if (Array.isArray(res.data)) {
        setEmployeesByTeam(res.data);
      } else {
        throw new Error("Respuesta inesperada del servidor.");
      }
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudieron cargar los empleados de esta coordinación.", "error");
    }
  };

  const saveEmployee = async (data, idToUpdate = null) => {
    try {
      if (idToUpdate) {
        if (data instanceof FormData) data.delete("IdTeam");

        await axios.put(`${BASE_URL}/api/employee/${idToUpdate}`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${API_ACCESS_KEY}`,
          },
        });

        Swal.fire("¡Actualizado!", "El empleado ha sido actualizado.", "success");
      } else {
        await axios.post(`${BASE_URL}/api/registerEmployees`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${API_ACCESS_KEY}`,
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
      await axios.delete(`${BASE_URL}/api/employee/${id}`, axiosConfig);
      Swal.fire("¡Eliminado!", "El empleado ha sido eliminado.", "success");
      await fetchEmployees();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo eliminar el empleado.", "error");
    }
  };

  const handleCloseForm = () => setShowForm(false);

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
