import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT_ACCESS;
const API_URL = `${BASE_URL}${PORT}/api`;
const EMPLOYEE_API_URL = `${BASE_URL}${PORT}/api/employee`;
const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY || "";

const useDataAccess = (empleadoId) => {
  const [accessRecords, setAccessRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [justificationMap, setJustificationMap] = useState({});
  const navigate = useNavigate();

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${API_ACCESS_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 10000,
  };

  const handleNetworkError = (err) => {
    if (!err.response || err.code === "ERR_NETWORK" || err.response?.status === 503) {
      navigate("/503");
    } else {
      console.error("Error:", err);
    }
  };

  const fetchEmployeeById = async (id_Employee) => {
    try {
      const res = await axios.get(
        `${EMPLOYEE_API_URL}/search?id=${id_Employee}`,
        { timeout: 7000 }
      );
      if (Array.isArray(res.data)) return res.data[0] || null;
      return res.data;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  };

  const fetchJustifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/justifications`, axiosConfig);
      const justifications = res.data;

      const map = {};
      justifications.forEach((j) => {
        if (j.userId === empleadoId && j.idAccess) map[j.idAccess] = true;
      });

      setJustificationMap(map);
    } catch (error) {
      console.error("Error al obtener justificaciones:", error);
    }
  };

  // Nuevo: función para calcular rango de semana
  const getWeekRange = () => {
    const today = new Date();
    const day = today.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
    let start, end;

    if (day === 6 || day === 0) { // sábado o domingo
      start = new Date(today);
      start.setDate(today.getDate() - day + 1); // lunes de esta semana
      end = new Date(today);
      end.setDate(today.getDate() - day + 7); // domingo de esta semana
    } else if (day === 1) { // lunes
      start = new Date(today);
      start.setDate(today.getDate() - 7); // lunes anterior
      end = new Date(today);
      end.setDate(today.getDate()); // lunes actual
    } else { // cualquier otro día
      start = new Date(today);
      start.setDate(today.getDate() - day + 1); // lunes de esta semana
      end = new Date(today);
      end.setDate(today.getDate() + (7 - day)); // domingo de esta semana
    }

    // Ajustar horas a inicio y fin del día
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const fetchAccessRecords = async () => {
    if (!empleadoId) {
      console.warn("No hay empleadoId para filtrar registros de acceso");
      setAccessRecords([]);
      return;
    }

    try {
      const res = await axios.get(
        `${API_URL}/access?employeeId=${empleadoId}`,
        axiosConfig
      );
      const registros = res.data;

      // Filtrar registros por semana
      const { start, end } = getWeekRange();
      const registrosFiltrados = registros.filter((reg) => {
        const fecha = new Date(reg.date);
        return fecha >= start && fecha <= end;
      });

      const uniqueEmployeeIds = [
        ...new Set(registrosFiltrados.map((reg) => reg.id_Employee)),
      ];

      const empleadosMap = {};
      await Promise.all(
        uniqueEmployeeIds.map(async (id) => {
          const empleado = await fetchEmployeeById(id);
          if (empleado) empleadosMap[id] = empleado;
        })
      );

      const registrosConEmpleado = registrosFiltrados.map((reg) => {
        const empleado = empleadosMap[reg.id_Employee];
        return {
          ...reg,
          employeeName: empleado
            ? `${empleado.names} ${empleado.surnames}`
            : "Empleado no encontrado",
          employeeAvatar: empleado?.photo || null,
        };
      });

      setAccessRecords(registrosConEmpleado);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de accesos.", "error");
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
    if (empleadoId) {
      fetchAccessRecords();
      fetchJustifications();
    }
  }, [empleadoId]);

  return {
    accessRecords,
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
