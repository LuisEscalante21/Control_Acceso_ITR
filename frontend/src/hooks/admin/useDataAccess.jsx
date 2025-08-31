import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT_ACCESS;
const API_URL = `${BASE_URL}${PORT}/api`;
const API_URL_JUSTIFICATIONS = `${BASE_URL}4000/api/justifications`;
const EMPLOYEE_API_URL = `${BASE_URL}4000/api/employee`;
const TEAM_API_URL = `${BASE_URL}4000/api/teams`;
const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;

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
    if (!err.response || err.code === "ERR_NETWORK" || err.response?.status === 503) {
      navigate("/503");
    } else {
      console.error("🔴 Error de red:", err);
    }
  };

  const fetchEmployeeById = async (id_Employee) => {
    try {
      const res = await axios.get(`${EMPLOYEE_API_URL}/${id_Employee}`, { timeout: 7000 });
      return res.data;
    } catch (error) {
      console.error("🔴 Error fetchEmployeeById:", error);
      return null;
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${TEAM_API_URL}`, axiosConfig);
      setTeams(res.data || []);
    } catch (error) {
      console.error("🔴 Error al obtener áreas:", error);
    }
  };

  const fetchJustifications = async () => {
    try {
      const res = await axios.get(API_URL_JUSTIFICATIONS, axiosConfig);
      const map = (res.data || []).reduce((acc, j) => {
        if (j?.idAccess) acc[j.idAccess] = j;
        return acc;
      }, {});
      setJustificationMap(map);

    } catch (error) {
      console.error("🔴 Error al obtener justificaciones:", error);
      setJustificationMap({});
    }
  };

  const fetchAccessRecords = async (options = {}) => {
    try {
      let url = `${API_URL}/access`;
      if (options.onlyMine && userId) url += `?onlyEmployeeId=${userId}`;
      if (options.teamId) url += `?teamId=${options.teamId}`;


      const res = await axios.get(url, axiosConfig);
      let registros = res.data;
      const uniqueEmployeeIds = [...new Set(registros.map((reg) => reg.id_Employee))];
      const empleadosMap = {};

      await Promise.all(uniqueEmployeeIds.map(async (id) => {
        if (id) {
          const empleado = await fetchEmployeeById(id);
          if (empleado) empleadosMap[id] = empleado;
        }
      }));

      const registrosConEmpleado = registros.map((reg) => {
        const empleado = empleadosMap[reg.id_Employee];
        const enriched = {
          ...reg,
          employeeName: empleado ? `${empleado.names} ${empleado.surnames}` : "Empleado no encontrado",
          employeeAvatar: empleado?.photo || null,
        };
        return enriched;
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
    fetchAccessRecords();
    fetchJustifications();
    fetchTeams();
  }, [userId]);

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