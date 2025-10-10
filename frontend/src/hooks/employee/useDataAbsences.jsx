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
  const navigate = useNavigate();
  const userCache = useRef({});

  // Axios base config
  const axiosConfig = {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
  };

  // 🔹 Manejo de errores global
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

  // 🔹 Leer cookie cifrada del usuario logueado
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
      } catch (err) {
        console.error("Error al descifrar userInfo:", err);
        setUserId(null);
      }
    }
  }, []);

  // 🔹 Obtener información del usuario por ID (cacheado)
  const fetchUserById = async (id) => {
    if (!id) return null;
    if (userCache.current[id]) return userCache.current[id];

    try {
      const res = await axios.get(`${USERS_API_URL}/${id}`, axiosConfig);
      const user = res.data;

      let userType = "Empleado";
      if (user?.collectionName === "coordinators") userType = "Coordinador";
      if (user?.collectionName === "administrators") userType = "Administrador";

      userCache.current[id] = { ...user, userType };
      return userCache.current[id];
    } catch (error) {
      console.error("Error fetchUserById:", error);
      userCache.current[id] = null;
      return null;
    }
  };

  // 🔹 Obtener todas las justificaciones
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

  // 🔹 Guardar una justificación nueva
  const saveJustification = async (data) => {
    try {
      await axios.post(`${API_URL}/justifications`, data, axiosConfig);
      Swal.fire("¡Justificado!", "La inasistencia ha sido justificada correctamente.", "success");
      await fetchAbsenceRecords();
      await fetchJustifications();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo guardar la justificación.", "error");
    }
  };

  // 🔹 Obtener las inasistencias del empleado logueado
  const fetchAbsenceRecords = async () => {
    setLoading(true);
    try {
      if (!userId) {
        console.warn("No hay userId disponible");
        setAbsenceRecords([]);
        setLoading(false);
        return;
      }

      const url = `${API_URL}/absences?onlyEmployeeId=${userId}`;
      const res = await axios.get(url, axiosConfig);
      const records = res.data;
      const user = await fetchUserById(userId);

      const mappedRecords = records.map((rec) => {
        const statusLower = (rec.status || "").toLowerCase().trim();

        return {
          ...rec,
          _id: rec._id,
          id_Employee: rec.id_Employee || userId,
          employeeName: `${user?.names || rec.names || ""} ${user?.surnames || rec.surnames || ""}`.trim(),
          employeeType: user?.userType || rec.employee_type || "Empleado",
          employeeAvatar:
            user?.photo ||
            (rec.avatar && rec.avatar.startsWith("http") ? rec.avatar : null) ||
            null,
          date: rec.date,
          areaName: rec.idTeam?.name || "Sin área",
          idTeam: rec.idTeam?._id || rec.idTeam || null,
          // ✅ Mantener siempre el estado tal cual (no convertir a "Sin justificar")
          status: rec.status || "pendiente",
          isJustified:
            statusLower === "justificada" || !!justificationMap[rec._id],
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

  // 🔹 Cargar datos al inicio
  useEffect(() => {
    if (userId) {
      fetchAbsenceRecords();
      fetchJustifications();
    }
  }, [userId]);

  // 🔹 Retornar datos y acciones
  return {
    absenceRecords,
    justificationMap,
    loading,
    fetchAbsenceRecords,
    fetchJustifications,
    saveJustification,
    userId,
  };
};

export default useDataAbsences;
