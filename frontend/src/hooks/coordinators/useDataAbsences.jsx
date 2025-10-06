import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import CryptoJS from "crypto-js";

const BASE = import.meta.env.VITE_BASE_URL;
const API_URL = `${BASE}4000/api`;
const USERS_API_URL = `${BASE}4000/api/users`;
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET;

const useDataAbsences = () => {
  const [absenceRecords, setAbsenceRecords] = useState([]);
  const [justificationMap, setJustificationMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userTeamId, setUserTeamId] = useState(null);
  const navigate = useNavigate();
  const userCache = useRef({});

  // Configuración Axios
  const axiosConfig = {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
  };

  // Manejo de errores
  const handleNetworkError = (err) => {
    if (!err.response || err.code === "ERR_NETWORK" || err.response?.status === 503) {
      navigate("/503");
    } else if (err.response?.status === 401 || err.response?.status === 403) {
      Swal.fire("Error", "No autorizado. Inicia sesión nuevamente.", "error");
      navigate("/login");
    } else {
      console.error("Error:", err);
    }
  };

  // Obtener teamId del usuario desde el servidor (fallback)
  const fetchUserTeamFromServer = async (userId) => {
    try {
      console.log("Obteniendo teamId desde servidor para userId:", userId);
      const res = await axios.get(`${USERS_API_URL}/${userId}`, axiosConfig);
      const user = res.data;
      
      console.log("Respuesta del servidor:", user);
      
      const teamId = user?.idTeam?._id || user?.idTeam || user?.id_team || null;
      console.log("teamId obtenido del servidor:", teamId);
      
      if (teamId) {
        setUserTeamId(teamId);
      } else {
        console.error("No se encontró teamId en el servidor");
      }
    } catch (error) {
      console.error("Error al obtener teamId del servidor:", error);
    }
  };

  // Leer y descifrar cookie
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
        
        console.log("Cookie completa:", userInfo);
        console.log("userId:", userInfo._id);
        console.log("teamId buscando:", userInfo.teamId);
        console.log("idTeam buscando:", userInfo.idTeam);
        console.log("id_team buscando:", userInfo.id_team);
        
        const userId = userInfo._id || null;
        const teamId = userInfo.teamId || userInfo.idTeam || userInfo.id_team || null;
        
        console.log("userId final:", userId);
        console.log("teamId final:", teamId);
        
        setUserId(userId);
        setUserTeamId(teamId);
        
        // Si no hay teamId en la cookie, buscarlo en el servidor
        if (userId && !teamId) {
          console.warn("No hay teamId en cookie, buscando en servidor...");
          fetchUserTeamFromServer(userId);
        }
      } catch (err) {
        console.error("Error al descifrar userInfo:", err);
        setUserId(null);
        setUserTeamId(null);
      }
    }
  }, []);

  // Obtener usuario por ID con cache
  const fetchUserById = async (id) => {
    if (!id) return null;
    if (userCache.current[id]) return userCache.current[id];

    try {
      const res = await axios.get(`${USERS_API_URL}/${id}`, axiosConfig);
      const user = res.data;

      let userType = "Sin definir";
      if (user?.collectionName) {
        if (user.collectionName === "employees") userType = "Empleado";
        if (user.collectionName === "coordinators") userType = "Coordinador";
        if (user.collectionName === "administrators") userType = "Administrador";
      }

      userCache.current[id] = { ...user, userType };
      return userCache.current[id];
    } catch (error) {
      console.error("Error fetchUserById:", error);
      userCache.current[id] = null;
      return null;
    }
  };

  // Obtener justificaciones
  const fetchJustifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/justifications`, axiosConfig);
      const map = (res.data || []).reduce((acc, j) => {
        if (j?.idAbsence) acc[j.idAbsence] = j;
        return acc;
      }, {});
      setJustificationMap(map);
      return map;
    } catch (error) {
      handleNetworkError(error);
      setJustificationMap({});
      return {};
    }
  };

  // Obtener registros de inasistencias
  // SOLO TRAE INASISTENCIAS DEL ÁREA DEL COORDINADOR
  const fetchAbsenceRecords = async () => {
    console.log("Iniciando fetchAbsenceRecords");
    console.log("userTeamId actual:", userTeamId);
    
    setLoading(true);
    try {
      // Validar que exista el teamId del coordinador
      if (!userTeamId) {
        console.warn("No hay userTeamId disponible, no se cargarán inasistencias");
        setAbsenceRecords([]);
        setLoading(false);
        return;
      }

      // SIEMPRE filtrar por el área (teamId) del coordinador
      const url = `${API_URL}/absences?idTeam=${userTeamId}`;
      console.log("URL de petición:", url);
      
      const res = await axios.get(url, axiosConfig);
      const records = res.data;
      
      console.log("Registros recibidos del servidor:", records.length);
      console.log("Primer registro:", records[0]);

      // Obtener IDs únicos de empleados
      const uniqueUserIds = [...new Set(
        records
          .map((rec) => rec.id_Employee || rec.idEmployee || rec.id_employee || rec.employeeId)
          .filter(Boolean)
      )];

      // Traer datos de usuarios con cache
      const usersMap = {};
      await Promise.all(
        uniqueUserIds.map(async (id) => {
          if (id) {
            const user = await fetchUserById(id);
            if (user) {
              usersMap[id] = user;
            }
          }
        })
      );

      // Mapear los datos con información del usuario
      const mappedRecords = records.map((rec) => {
        const employeeId = rec.id_Employee || rec.idEmployee || rec.id_employee || rec.employeeId;
        const user = usersMap[employeeId];

        return {
          ...rec,
          _id: rec._id,
          id_Employee: employeeId,
          employeeName: user
            ? `${user.names} ${user.surnames}`
            : rec.names && rec.surnames
            ? `${rec.names} ${rec.surnames}`
            : "Usuario no encontrado",
          employeeType: user?.userType || rec.employee_type || "Sin definir",
          employeeAvatar: user?.photo || rec.avatar || null,
          date: rec.date,
          areaName: rec.idTeam?.name || "Sin área",
          idTeam: rec.idTeam?._id || rec.idTeam || null,
          isJustified: !!justificationMap[rec._id],
          justification: justificationMap[rec._id] || null,
        };
      });

      setAbsenceRecords(mappedRecords);
      return mappedRecords;
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de inasistencias.", "error");
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Guardar o actualizar inasistencia
  const saveAbsence = async (data, absenceId = null) => {
    try {
      if (absenceId) {
        await axios.put(`${API_URL}/absences/${absenceId}`, data, axiosConfig);
        Swal.fire("Actualizado", "Registro de inasistencia actualizado.", "success");
      } else {
        await axios.post(`${API_URL}/absences`, data, axiosConfig);
        Swal.fire("Guardado", "Registro de inasistencia creado.", "success");
      }
      await fetchAbsenceRecords();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo guardar la inasistencia.", "error");
    }
  };

  // Eliminar inasistencia
  const deleteAbsence = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar registro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/absences/${id}`, axiosConfig);
      Swal.fire("Eliminado", "Registro de inasistencia eliminado.", "success");
      await fetchAbsenceRecords();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo eliminar el registro.", "error");
    }
  };

  // Cargar datos cuando userId y userTeamId estén disponibles
  useEffect(() => {
    if (userId && userTeamId) {
      console.log("Cargando datos con userId:", userId, "y teamId:", userTeamId);
      fetchAbsenceRecords();
      fetchJustifications();
    }
  }, [userId, userTeamId]);

  return {
    absenceRecords,
    justificationMap,
    loading,
    fetchAbsenceRecords,
    fetchJustifications,
    saveAbsence,
    deleteAbsence,
    userId,
    userTeamId,
  };
};

export default useDataAbsences;