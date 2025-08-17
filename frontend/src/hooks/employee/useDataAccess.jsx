import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT_ACCESS;
const API_URL = `${BASE_URL}${PORT}/api`;

const PORT_JUSTIFICATIONS = import.meta.env.VITE_PORT;
const EMPLOYEE_API_URL = "http://localhost:4000/api/employee";
const JUSTIFICATIONS_API_URL = `${BASE_URL}${PORT_JUSTIFICATIONS}/api/justifications`;

const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;

const useDataAccess = () => {
  const [accessRecords, setAccessRecords] = useState([]);
  const [justifications, setJustifications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const handleNetworkError = (err) => {
    if (!err.response || err.code === "ERR_NETWORK" || err.response?.status === 503) {
      navigate("/503");
    } else {
      console.error("Error:", err);
    }
  };

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${API_ACCESS_KEY}`,
      "Content-Type": "application/json",
    },
  };

  // Obtener datos de un empleado por ID
  const fetchEmployeeById = async (id_Employee) => {
    try {
      const res = await axios.get(`${EMPLOYEE_API_URL}/${id_Employee}`);
      return res.data;
    } catch (error) {
      console.warn("No se pudo obtener empleado", id_Employee);
      return null;
    }
  };

  // Obtener registros de acceso
  const fetchAccessRecords = async () => {
    try {
      const res = await axios.get(`${API_URL}/access`, axiosConfig);
      const registros = res.data;

      const registrosConEmpleado = await Promise.all(
        registros.map(async (reg) => {
          const empleado = await fetchEmployeeById(reg.id_Employee);
          return {
            ...reg,
            employeeName: empleado
              ? `${empleado.names} ${empleado.surnames}`
              : "Empleado no encontrado",
            employeeAvatar: empleado?.photo || null,
          };
        })
      );

      setAccessRecords(registrosConEmpleado);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de accesos.", "error");
    }
  };

  // Obtener justificaciones
  const fetchJustifications = async () => {
    try {
      const res = await axios.get(JUSTIFICATIONS_API_URL, axiosConfig);
      setJustifications(res.data);
    } catch (error) {
      handleNetworkError(error);
      console.error("Error al obtener justificaciones:", error);
    }
  };

  const saveAccessRecord = async (data) => {
    try {
      await axios.post(`${API_URL}/access`, data, axiosConfig);
      Swal.fire("¡Guardado!", "El registro de acceso ha sido guardado.", "success");
      await fetchAccessRecords();
      handleCloseForm();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo guardar el registro de acceso.", "error");
    }
  };

  const deleteAccessRecord = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará el registro de acceso.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/access/${id}`, axiosConfig);
      Swal.fire("¡Eliminado!", "El registro de acceso ha sido eliminado.", "success");
      await fetchAccessRecords();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo eliminar el registro de acceso.", "error");
    }
  };

  const handleCloseForm = () => setShowForm(false);

  useEffect(() => {
    fetchAccessRecords();
    fetchJustifications();
  }, []);

  return {
    accessRecords,
    justifications,
    fetchAccessRecords,
    fetchJustifications,
    saveAccessRecord,
    deleteAccessRecord,
    showForm,
    setShowForm,
    handleCloseForm,
  };
};

export default useDataAccess;
