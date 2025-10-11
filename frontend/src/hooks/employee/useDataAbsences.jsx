import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import CryptoJS from "crypto-js";

const BASE = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE}${PORT}/api`;
const USERS_API_URL = `${BASE}${PORT}/api/users`;
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET;

const useDataAbsences = () => {
  const [absenceRecords, setAbsenceRecords] = useState([]);
  const [justificationMap, setJustificationMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userInfo, setUserInfo] = useState(null); // 🔹 NUEVO: Guardar info completa del usuario
  const navigate = useNavigate();
  const userCache = useRef({});

  // 🔹 Axios config con credenciales (JSON)
  const axiosConfig = {
    withCredentials: true, // 🔹 Enviar cookies de sesión
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 15000,
  };

  // 🔹 Axios config con credenciales (FormData para archivos)
  const axiosConfigMultipart = {
    withCredentials: true, // 🔹 Enviar cookies de sesión
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 15000,
  };

  // 🔹 Manejo de errores global
  const handleNetworkError = (err) => {
    console.error("❌ Error de red:", err);

    if (
      !err.response ||
      err.code === "ERR_NETWORK" ||
      err.response?.status === 503
    ) {
      navigate("/503");
    } else if (err.response?.status === 401 || err.response?.status === 403) {
      Swal.fire({
        icon: "error",
        title: "No autorizado",
        text: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
        confirmButtonText: "Ir al login",
      }).then(() => {
        navigate("/login");
      });
    } else {
      console.error("Error detallado:", err.response?.data || err.message);
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

        if (!decryptedStr) {
          throw new Error("No se pudo descifrar correctamente.");
        }

        const userData = JSON.parse(decryptedStr);
        setUserId(userData._id || null);
        setUserInfo(userData); // 🔹 Guardar info completa
      } catch (err) {
        console.error("Error al descifrar userInfo:", err);
        setUserId(null);
        setUserInfo(null);
      }
    } else {
      console.warn("No se encontró cookie de usuario o JWT_SECRET");
    }
  }, [JWT_SECRET]);

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

  // 🔹 Obtener todas las justificaciones (filtradas por idAbsence)
  const fetchJustifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/justifications`, axiosConfig);

      // 🔹 Mapear solo las justificaciones de INASISTENCIAS (idAbsence)
      const map = (res.data || []).reduce((acc, j) => {
        if (j?.idAbsence) acc[j.idAbsence] = j;
        return acc;
      }, {});

      setJustificationMap(map);
      return map;
    } catch (error) {
      console.error("Error al obtener justificaciones:", error);
      handleNetworkError(error);
      setJustificationMap({});
      return {};
    }
  };

  // 🔹 Guardar justificación de INASISTENCIA (con FormData para archivos)
  const saveAbsenceJustification = async (formData) => {
    try {
      // 🔹 Debug: Mostrar qué se está enviando
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(
            `  ${key}: [Archivo] ${value.name} (${value.size} bytes)`
          );
        } else {
          console.log(`  ${key}:`, value);
        }
      }

      // 🔹 Enviar con axios (con credenciales)
      const response = await axios.post(
        `${API_URL}/justifications`,
        formData,
        axiosConfigMultipart
      );

      Swal.fire({
        icon: "success",
        title: "¡Justificado!",
        text: "La inasistencia ha sido justificada correctamente.",
        confirmButtonText: "Aceptar",
        timer: 3000,
      });

      // 🔹 Refrescar datos
      await fetchAbsenceRecords();
      await fetchJustifications();

      return true;
    } catch (error) {

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "No se pudo guardar la justificación.";

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonText: "Aceptar",
      });

      handleNetworkError(error);
      return false;
    }
  };

  // 🔹 Guardar justificación genérica (mantener compatibilidad para accesos)
  const saveJustification = async (data) => {
    try {
      const config =
        data instanceof FormData ? axiosConfigMultipart : axiosConfig;
      const response = await axios.post(
        `${API_URL}/justifications`,
        data,
        config
      );


      Swal.fire({
        icon: "success",
        title: "¡Justificado!",
        text: "La justificación ha sido guardada correctamente.",
        confirmButtonText: "Aceptar",
        timer: 3000,
      });

      await fetchAbsenceRecords();
      await fetchJustifications();

      return true;
    } catch (error) {
      console.error("Error al guardar justificación:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "No se pudo guardar la justificación.";

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonText: "Aceptar",
      });

      handleNetworkError(error);
      return false;
    }
  };

  // 🔹 Obtener las inasistencias del empleado logueado
  const fetchAbsenceRecords = async () => {
    setLoading(true);
    try {
      if (!userId) {
        setAbsenceRecords([]);
        setLoading(false);
        return [];
      }


      const url = `${API_URL}/absences?onlyEmployeeId=${userId}`;
      const res = await axios.get(url, axiosConfig);
      const records = res.data;

      // Obtener justificaciones actualizadas
      const justMap = await fetchJustifications();
      const user = await fetchUserById(userId);

      const mappedRecords = records.map((rec) => {
        const statusLower = (rec.status || "pendiente").toLowerCase().trim();

        return {
          ...rec,
          _id: rec._id,
          id_Employee: rec.id_Employee || userId,
          employeeName:
            `${user?.names || rec.names || ""} ${
              user?.surnames || rec.surnames || ""
            }`.trim() || "Sin nombre",
          employeeType: user?.userType || rec.employee_type || "Empleado",
          employeeAvatar:
            user?.photo ||
            (rec.avatar && rec.avatar.startsWith("http") ? rec.avatar : null) ||
            null,
          date: rec.date,
          areaName: rec.idTeam?.name || "Sin área",
          idTeam: rec.idTeam?._id || rec.idTeam || null,
          status: rec.status || "pendiente",
          isJustified: statusLower === "justificada" || !!justMap[rec._id],
          justification: justMap[rec._id] || null,
        };
      });

      setAbsenceRecords(mappedRecords);
      return mappedRecords;
    } catch (error) {
      console.error("Error al obtener inasistencias:", error);
      handleNetworkError(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo obtener la lista de inasistencias.",
        confirmButtonText: "Aceptar",
      });

      return [];
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Eliminar una justificación (opcional)
  const deleteJustification = async (justificationId) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará la justificación y la inasistencia volverá a estado pendiente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return false;

    try {
      await axios.delete(
        `${API_URL}/justifications/${justificationId}`,
        axiosConfig
      );

      Swal.fire({
        icon: "success",
        title: "¡Eliminado!",
        text: "La justificación ha sido eliminada.",
        confirmButtonText: "Aceptar",
        timer: 3000,
      });

      // Refrescar datos
      await fetchAbsenceRecords();
      await fetchJustifications();

      return true;
    } catch (error) {
      console.error("Error al eliminar justificación:", error);
      handleNetworkError(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar la justificación.",
        confirmButtonText: "Aceptar",
      });

      return false;
    }
  };

  // 🔹 Cargar datos al inicio
  useEffect(() => {
    if (userId) {
      fetchAbsenceRecords();
    }
  }, [userId]);

  // 🔹 Retornar datos y acciones
  return {
    absenceRecords,
    justificationMap,
    loading,
    userId,
    userInfo, // 🔹 NUEVO: Info completa del usuario
    fetchAbsenceRecords,
    fetchJustifications,
    saveJustification, // Genérica (para accesos)
    saveAbsenceJustification, // 🔹 Específica para inasistencias
    deleteJustification, // Eliminar justificación
  };
};

export default useDataAbsences;
