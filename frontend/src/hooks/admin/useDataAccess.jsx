import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT_ACCESS;
const API_URL = `${BASE_URL}${PORT}/api`;
const EMPLOYEE_API_URL = `${BASE_URL}${PORT}/api/employee`;
const TEAM_API_URL = `${BASE_URL}${PORT}/api/teams`;
const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY || "";

const useDataAccess = (userId = null) => {
  const [accessRecords, setAccessRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [justificationMap, setJustificationMap] = useState({});
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${API_ACCESS_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 10000,
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
      const res = await axios.get(
        `${EMPLOYEE_API_URL}/search?id=${id_Employee}`,
        {
          timeout: 7000,
        }
      );
      if (Array.isArray(res.data)) return res.data[0] || null;
      return res.data;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${TEAM_API_URL}`, axiosConfig);
      setTeams(res.data || []);
    } catch (error) {
      console.error("Error al obtener áreas:", error);
    }
  };

  const fetchJustifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/justifications`, axiosConfig);
      const justifications = res.data;
      const map = {};
      justifications.forEach((j) => {
        if (j.idAccess) map[j.idAccess] = true;
      });
      setJustificationMap(map);
    } catch (error) {
      console.error("Error al obtener justificaciones:", error);
    }
  };

  // Calcula rango semanal
  const getWeekRange = () => {
    const today = new Date();
    const day = today.getDay();
    let start, end;

    if (day === 6 || day === 0) {
      start = new Date(today);
      start.setDate(today.getDate() - day + 1);
      end = new Date(today);
      end.setDate(today.getDate() - day + 7);
    } else if (day === 1) {
      start = new Date(today);
      start.setDate(today.getDate() - 7);
      end = new Date(today);
      end.setDate(today.getDate());
    } else {
      start = new Date(today);
      start.setDate(today.getDate() - day + 1);
      end = new Date(today);
      end.setDate(today.getDate() + (7 - day));
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  // Traer accesos (con filtro opcional)
  const fetchAccessRecords = async ({
    teamId = null,
    onlyMine = false,
    filterWeek = false,
  } = {}) => {
    try {
      // Construir la URL con parámetros
      let url = `${API_URL}/access`;
      const params = [];
      if (teamId) params.push(`teamId=${teamId}`);
      if (onlyMine && userId) params.push(`onlyEmployeeId=${userId}`);
      if (params.length > 0) url += `?${params.join("&")}`;

      const res = await axios.get(url, axiosConfig);
      let registros = res.data;

      // Filtrar por semana solo si se indica
      if (filterWeek) {
        const { start, end } = getWeekRange();
        registros = registros.filter((reg) => {
          const fecha = new Date(reg.date);
          return fecha >= start && fecha <= end;
        });
      }

      // Buscar empleados únicos
      const uniqueEmployeeIds = [
        ...new Set(registros.map((reg) => reg.id_Employee)),
      ];
      const empleadosMap = {};
      await Promise.all(
        uniqueEmployeeIds.map(async (id) => {
          const empleado = await fetchEmployeeById(id);
          if (empleado) empleadosMap[id] = empleado;
        })
      );

      const registrosConEmpleado = registros.map((reg) => {
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
    fetchAccessRecords();
    fetchJustifications();
    fetchTeams();
  }, []);

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
    teams,
    fetchTeams,
  };
};

export default useDataAccess;