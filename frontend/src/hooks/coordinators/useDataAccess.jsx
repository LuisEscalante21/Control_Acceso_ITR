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

const useDataAccess = (empleadoId, teamId) => {
  const [accessRecords, setAccessRecords] = useState([]);
  const [justifications, setJustifications] = useState([]);
  const [justificationMap, setJustificationMap] = useState({});
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${API_ACCESS_KEY}`,
      "Content-Type": "application/json",
    },
  };

  const handleNetworkError = (err) => {
    if (
      !err.response ||
      err.code === "ERR_NETWORK" ||
      err.response?.status === 503
    ) {
      navigate("/503");
    } else {
      console.error("Error:", err);
    }
  };

  const fetchEmployeeById = async (id_Employee) => {
    try {
      const res = await axios.get(`${EMPLOYEE_API_URL}/${id_Employee}`);
      return res.data;
    } catch {
      return null;
    }
  };

  const fetchAccessRecords = async () => {
    try {
      // --- Aquí enviamos el teamId para que solo traiga accesos de mi área ---
      const url = teamId
        ? `${API_URL}/access?teamId=${teamId}`
        : `${API_URL}/access`;
      const res = await axios.get(url, axiosConfig);
      const registros = res.data;

      // Adjuntar datos de empleado (nombre, foto) a cada registro
      const registrosConEmpleado = await Promise.all(
        registros.map(async (reg) => {
          const empleado = await fetchEmployeeById(reg.id_Employee);
          return {
            ...reg,
            employeeName: empleado
              ? `${empleado.names} ${empleado.surnames}`
              : "Empleado no encontrado",
            employeeAvatar: empleado?.photo || null,
            teamId: empleado?.teamId || null,
          };
          return enriched;
        })
      );

      setAccessRecords(registrosConEmpleado);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de accesos.", "error");
    }
  };

  const fetchJustifications = async () => {
    try {
      const res = await axios.get(JUSTIFICATIONS_API_URL, axiosConfig);
      setJustifications(res.data);

      const map = (res.data || []).reduce((acc, j) => {
        if (j?.idAccess) acc[j.idAccess] = j;
        return acc;
      }, {});
      setJustificationMap(map);
    } catch (error) {
      handleNetworkError(error);
      console.error("Error al obtener justificaciones:", error);
      setJustificationMap({});
    }
  };

  const saveAccessRecord = async (data) => {
    try {
      await axios.post(`${API_URL}/access`, data, axiosConfig);
      Swal.fire(
        "¡Guardado!",
        "El registro de acceso ha sido guardado.",
        "success"
      );
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
      Swal.fire(
        "¡Eliminado!",
        "El registro de acceso ha sido eliminado.",
        "success"
      );
      await fetchAccessRecords();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo eliminar el registro de acceso.", "error");
    }
  };

  const handleCloseForm = () => setShowForm(false);

  useEffect(() => {
    if (teamId) fetchAccessRecords();
    fetchJustifications();
  }, [teamId]);

  return {
    accessRecords,
    justifications,
    justificationMap,
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
