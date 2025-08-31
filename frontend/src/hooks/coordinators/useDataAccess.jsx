import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import CryptoJS from "crypto-js";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT_ACCESS;
const API_URL = `${BASE_URL}${PORT}/api`;

const PORT_JUSTIFICATIONS = import.meta.env.VITE_PORT;
const EMPLOYEE_API_URL = `${BASE_URL}4000/api/employee`;
const COORDINATOR_API_URL = `${BASE_URL}4000/api/coordinators`;
const JUSTIFICATIONS_API_URL = `${BASE_URL}${PORT_JUSTIFICATIONS}/api/justifications`;

const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET;

const useDataAccess = () => {
  const [accessRecords, setAccessRecords] = useState([]);
  const [justifications, setJustifications] = useState([]);
  const [justificationMap, setJustificationMap] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState(null); // empleado o coordinador
  const [userTeamId, setUserTeamId] = useState(null);

  const navigate = useNavigate();

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${API_ACCESS_KEY}`,
      "Content-Type": "application/json",
    },
  };

  // Cache para usuarios (persistente entre renders)
  const userCache = useRef({});

  // Manejar errores de red
  const handleNetworkError = (err) => {
    if (!err.response || err.code === "ERR_NETWORK" || err.response?.status === 503) {
      navigate("/503");
    } else {
      console.error("Error:", err);
    }
  };

  // Leer y descifrar cookie para obtener userId y teamId
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
        console.error("Error al descifrar userInfo:", err);
        setUserId(null);
        setUserTeamId(null);
      }
    }
  }, []);

  // Obtener usuario (empleado o coordinador) con cache
  const fetchUserById = async (id) => {
    if (!id) return null;
    if (userCache.current[id]) return userCache.current[id];

    try {
      // Intentar empleado, 404 no lanza error
      const resEmployee = await axios.get(`${EMPLOYEE_API_URL}/${id}`, {
        ...axiosConfig,
        validateStatus: (status) => status < 500,
      });
      if (resEmployee.status === 200) {
        userCache.current[id] = resEmployee.data;
        return resEmployee.data;
      }

      // Si no existe, buscar coordinador
      const resCoordinator = await axios.get(`${COORDINATOR_API_URL}/${id}`, axiosConfig);
      userCache.current[id] = resCoordinator.data || null;
      return userCache.current[id];

    } catch {
      userCache.current[id] = null;
      return null;
    }
  };

  // Obtener registros de acceso
  const fetchAccessRecords = async () => {
    try {
      const url = userTeamId ? `${API_URL}/access?teamId=${userTeamId}` : `${API_URL}/access`;
      const res = await axios.get(url, axiosConfig);
      const registros = res.data;

      const registrosConUsuario = await Promise.all(
        registros.map(async (reg) => {
          const usuario = await fetchUserById(reg.id_Employee);
          return {
            ...reg,
            employeeName: usuario ? `${usuario.names} ${usuario.surnames}` : "Usuario no encontrado",
            employeeAvatar: usuario?.photo || null,
            teamId: usuario?.IdTeam || null,
          };
        })
      );

      setAccessRecords(registrosConUsuario);
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

  // Guardar registro de acceso
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

  // Eliminar registro de acceso
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

  // Ejecutar fetch al tener userId
  useEffect(() => {
    if (userId) fetchAccessRecords();
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
