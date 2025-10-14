import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const BASE_PORT = import.meta.env.VITE_PORT;
const PORT = import.meta.env.VITE_PORT_ACCESS;
const API_URL = `${BASE_URL}${PORT}/api`; // Flask
const API_URL_JUSTIFICATIONS = `${BASE_URL}${BASE_PORT}/api/justifications`; // Node
const USERS_API_URL = `${BASE_URL}${BASE_PORT}/api/users`; // Node
const TEAM_API_URL = `${BASE_URL}${BASE_PORT}/api/teams`; // Node
const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;

const useDataAccess = (userId = null) => {
  const [accessRecords, setAccessRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [justificationMap, setJustificationMap] = useState({});
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();

  // Config Axios
  const axiosConfigFlask = {
    headers: {
      Authorization: `Bearer ${API_ACCESS_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 10000,
  };

  const axiosConfigNode = {
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 10000,
  };

  // Manejo de errores
  const handleNetworkError = (err) => {
    if (
      !err.response ||
      err.code === "ERR_NETWORK" ||
      err.response?.status === 503
    ) {
      navigate("/503");
    } else if (err.response?.status === 401 || err.response?.status === 403) {
      Swal.fire("Error", "No autorizado. Inicia sesión nuevamente.", "error");
    } else {
      console.error("Error de red:", err);
    }
  };

  // Obtener usuario por ID (Node)
  const fetchUserById = async (id) => {
    try {
      const res = await axios.get(`${USERS_API_URL}/${id}`, axiosConfigNode);
      const user = res.data;

      let userType = "Sin definir";
      if (user?.collectionName) {
        if (user.collectionName === "employees") userType = "Empleado";
        if (user.collectionName === "coordinators") userType = "Coordinador";
        if (user.collectionName === "administrators")
          userType = "Administrador";
      }

      return { ...user, userType };
    } catch (error) {
      console.error("Error fetchUserById:", error);
      return null;
    }
  };

  // Obtener áreas / teams (Node)
  const fetchTeams = async () => {
    try {
      const res = await axios.get(TEAM_API_URL, axiosConfigNode);
      setTeams(res.data || []);
    } catch (error) {
      handleNetworkError(error);
      console.error("Error al obtener áreas:", error);
    }
  };

  // Obtener justificaciones (Node)
  const fetchJustifications = async () => {
    try {
      const res = await axios.get(API_URL_JUSTIFICATIONS, axiosConfigNode);
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

  // 🔹 ACTUALIZADO: Obtener registros de acceso con soporte para filtros de fecha
  const fetchAccessRecords = async (options = {}) => {
    try {
      let url = `${API_URL}/access`;
      const params = {};

      if (options.onlyMine && userId) params.onlyEmployeeId = userId;
      if (options.excludeEmployeeId)
        params.excludeEmployeeId = options.excludeEmployeeId;
      if (options.teamId) params.teamId = options.teamId;

      // 🔹 NUEVO: Filtros de fecha dinámica
      if (options.filterType && options.selectedDate) {
        switch (options.filterType) {
          case "año":
            params.year = options.selectedDate;
            break;
          case "mes":
            params.month = options.selectedDate;
            break;
          case "semana":
            params.week = options.selectedDate;
            break;
          case "día":
            params.day = options.selectedDate;
            break;
        }
      }

      const res = await axios.get(url, { ...axiosConfigFlask, params });
      const registros = res.data;

      // Traer datos de usuarios involucrados (Node)
      const uniqueUserIds = [
        ...new Set(registros.map((reg) => reg.id_Employee)),
      ];
      const usersMap = {};

      await Promise.all(
        uniqueUserIds.map(async (id) => {
          if (id) {
            const user = await fetchUserById(id);
            if (user) usersMap[id] = user;
          }
        })
      );

      const registrosConUsuario = registros.map((reg) => {
        const user = usersMap[reg.id_Employee];

        // 🔹 Normalizar status para filtro de justificación
        const statusNorm = (reg.status || "").toLowerCase().trim();

        return {
          ...reg,
          _id: reg._id || reg.id,
          employeeName: user
            ? `${user.names} ${user.surnames}`
            : "Usuario no encontrado",
          employeeAvatar: user?.photo || null,
          employeeType: user?.userType || "Sin definir",
          status: statusNorm, // ✅ Campo status normalizado
        };
      });

      setAccessRecords(registrosConUsuario);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de accesos.", "error");
    }
  };

  // Guardar, editar, eliminar registros (Flask)
  const saveAccessRecord = async (data) => {
    try {
      await axios.post(`${API_URL}/access`, data, axiosConfigFlask);
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

  const editAccessRecord = async (id, data) => {
    try {
      await axios.patch(`${API_URL}/access/${id}`, data, axiosConfigFlask);
      Swal.fire(
        "¡Actualizado!",
        "El registro de acceso ha sido actualizado.",
        "success"
      );
      await fetchAccessRecords();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire(
        "Error",
        "No se pudo actualizar el registro de acceso.",
        "error"
      );
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
      await axios.delete(`${API_URL}/access/${id}`, axiosConfigFlask);
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

  const deleteAllAccessRecords = async () => {
    const result = await Swal.fire({
      title: "¿Eliminar todos los registros?",
      text: "Esta acción eliminará todos los registros de acceso.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar todo",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/access`, axiosConfigFlask);
      Swal.fire(
        "¡Eliminado!",
        "Todos los registros de acceso han sido eliminados.",
        "success"
      );
      await fetchAccessRecords();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo eliminar los registros.", "error");
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
    editAccessRecord,
    deleteAccessRecord,
    deleteAllAccessRecords,
    showForm,
    setShowForm,
    handleCloseForm,
    teams,
    fetchTeams,
  };
};

export default useDataAccess;
