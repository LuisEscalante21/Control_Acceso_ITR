import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import CryptoJS from "crypto-js";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT_ACCESS;
const API_URL = `${BASE_URL}${PORT}/api`; // Flask API
const PORT_NODE = import.meta.env.VITE_PORT;
const EMPLOYEE_API_URL = `${BASE_URL}4000/api/employee`; // Node
const COORDINATOR_API_URL = `${BASE_URL}4000/api/coordinators`; // Node
const JUSTIFICATIONS_API_URL = `${BASE_URL}${PORT_NODE}/api/justifications`; // Node
const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET;

const useDataAccess = () => {
  const [accessRecords, setAccessRecords] = useState([]);
  const [justifications, setJustifications] = useState([]);
  const [justificationMap, setJustificationMap] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userTeamId, setUserTeamId] = useState(null);

  const navigate = useNavigate();
  const userCache = useRef({}); // Cache usuarios

  // ------------------------------
  // Config Axios
  // ------------------------------
  const axiosFlask = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${API_ACCESS_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });

  const axiosNode = axios.create({
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
  });

  // ------------------------------
  // Manejo de errores
  // ------------------------------
  const handleNetworkError = (err) => {
    if (!err.response || err.code === "ERR_NETWORK" || err.response?.status === 503) {
      navigate("/503");
    } else if (err.response?.status === 401 || err.response?.status === 403) {
      Swal.fire("Error", "No autorizado. Inicia sesión nuevamente.", "error");
    } else {
      console.error("🔴 Error:", err);
    }
  };

  // ------------------------------
  // Leer y descifrar cookie
  // ------------------------------
  useEffect(() => {
    const userInfoCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userInfo="));

    if (userInfoCookie && JWT_SECRET) {
      try {
        const encrypted = decodeURIComponent(userInfoCookie.split("=")[1]);
        const bytes = CryptoJS.AES.decrypt(encrypted, JWT_SECRET);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedStr) throw new Error("No se pudo descifrar correctamente.");
        const userInfo = JSON.parse(decryptedStr);
        setUserId(userInfo._id || null);
        setUserTeamId(userInfo.teamId || null);
      } catch (err) {
        console.error("🔴 Error al descifrar userInfo:", err);
        setUserId(null);
        setUserTeamId(null);
      }
    }
  }, []);

  // ------------------------------
  // Obtener usuario (Empleado / Coordinador) con cache
  // ------------------------------
  const fetchUserById = async (id) => {
    if (!id) return null;
    if (userCache.current[id]) return userCache.current[id];

    try {
      const resEmployee = await axiosNode.get(`${EMPLOYEE_API_URL}/${id}`);
      if (resEmployee.status === 200) {
        userCache.current[id] = { ...resEmployee.data, userType: "Empleado" };
        return userCache.current[id];
      }

      const resCoordinator = await axiosNode.get(`${COORDINATOR_API_URL}/${id}`);
      if (resCoordinator.status === 200) {
        userCache.current[id] = { ...resCoordinator.data, userType: "Coordinador" };
        return userCache.current[id];
      }

      userCache.current[id] = null;
      return null;
    } catch {
      userCache.current[id] = null;
      return null;
    }
  };

  // ------------------------------
  // Obtener registros de acceso (Flask)
  // 🔹 SOLO TRAE ACCESOS DEL ÁREA DEL COORDINADOR
  // ------------------------------
  const fetchAccessRecords = async () => {
    try {
      // 🔹 Validar que exista el teamId del coordinador
      if (!userTeamId) {
        console.warn("⚠️ No hay teamId disponible, no se cargarán accesos");
        setAccessRecords([]);
        return;
      }

      // 🔹 SIEMPRE filtrar por el área (teamId) del coordinador que inició sesión
      const url = `/access?teamId=${userTeamId}`;
      const res = await axiosFlask.get(url);
      const registros = res.data;

      // Traer datos de usuarios
      const uniqueIds = [...new Set(registros.map((r) => r.id_Employee))];
      const usersMap = {};
      await Promise.all(
        uniqueIds.map(async (id) => {
          if (id) {
            const user = await fetchUserById(id);
            if (user) usersMap[id] = user;
          }
        })
      );

      const registrosConUsuario = registros.map((reg) => {
        const user = usersMap[reg.id_Employee];
        return {
          ...reg,
          employeeName: user ? `${user.names} ${user.surnames}` : "Usuario no encontrado",
          employeeAvatar: user?.photo || null,
          employeeType: user?.userType || "Sin definir",
        };
      });

      setAccessRecords(registrosConUsuario);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de accesos.", "error");
    }
  };

  // ------------------------------
  // Obtener justificaciones (Node)
  // ------------------------------
  const fetchJustifications = async () => {
    try {
      const res = await axiosNode.get(JUSTIFICATIONS_API_URL);
      setJustifications(res.data);

      const map = (res.data || []).reduce((acc, j) => {
        if (j?.idAccess) acc[j.idAccess] = j;
        return acc;
      }, {});
      setJustificationMap(map);
    } catch (error) {
      handleNetworkError(error);
      console.error("🔴 Error al obtener justificaciones:", error);
      setJustificationMap({});
    }
  };

  // ------------------------------
  // Guardar / Eliminar registros (Flask)
  // ------------------------------
  const saveAccessRecord = async (data) => {
    try {
      await axiosFlask.post("/access", data);
      Swal.fire("¡Guardado!", "Registro de acceso guardado.", "success");
      await fetchAccessRecords();
      handleCloseForm();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo guardar el registro.", "error");
    }
  };

  const deleteAccessRecord = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar registro?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      await axiosFlask.delete(`/access/${id}`);
      Swal.fire("¡Eliminado!", "Registro eliminado.", "success");
      await fetchAccessRecords();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo eliminar el registro.", "error");
    }
  };

  const handleCloseForm = () => setShowForm(false);

  useEffect(() => {
    fetchAccessRecords();
    fetchJustifications();
  }, [userId, userTeamId]);

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
    userId,
    userTeamId,
  };
};

export default useDataAccess;