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
  const [userTeamId, setUserTeamId] = useState(null);
  const [userInfo, setUserInfo] = useState(null); // 🔹 NUEVO: Info completa del usuario
  const navigate = useNavigate();
  const userCache = useRef({});

  // 🔹 Axios config con credenciales (JSON)
  const axiosConfig = {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
  };

  // 🔹 Axios config con credenciales (FormData para archivos)
  const axiosConfigMultipart = {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 15000,
  };

  // 🔹 Manejo de errores de red
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

  // 🔹 Obtener teamId del usuario desde el servidor
  const fetchUserTeamFromServer = async (userId) => {
    try {
      const res = await axios.get(`${USERS_API_URL}/${userId}`, axiosConfig);
      const user = res.data;
      const teamId = user?.idTeam?._id || user?.idTeam || user?.id_team || null;
      if (teamId) setUserTeamId(teamId);
      return user;
    } catch (error) {
      console.error("Error al obtener teamId del servidor:", error);
      return null;
    }
  };

  // 🔹 Leer y descifrar cookie de usuario
  useEffect(() => {
    const userInfoCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userInfo="));

    if (userInfoCookie && JWT_SECRET) {
      try {
        const encrypted = decodeURIComponent(userInfoCookie.split("=")[1]);
        const bytes = CryptoJS.AES.decrypt(encrypted, JWT_SECRET);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedStr)
          throw new Error("No se pudo descifrar correctamente.");

        const userData = JSON.parse(decryptedStr);
        const userId = userData._id || null;
        const teamId =
          userData.teamId || userData.idTeam || userData.id_team || null;

        setUserId(userId);
        setUserTeamId(teamId);
        setUserInfo(userData); // 🔹 Guardar info completa

        if (userId && !teamId) fetchUserTeamFromServer(userId);
      } catch (err) {
        console.error("Error al descifrar userInfo:", err);
        setUserId(null);
        setUserTeamId(null);
        setUserInfo(null);
      }
    }
  }, [JWT_SECRET]);

  // 🔹 Obtener usuario por ID (con caché)
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
        if (user.collectionName === "administrators")
          userType = "Administrador";
      }

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

  // 🔹 Obtener inasistencias (con filtros dinámicos)
  const fetchAbsenceRecords = async (options = {}) => {
    setLoading(true);

    try {
      if (!userTeamId) {
        setAbsenceRecords([]);
        setLoading(false);
        return [];
      }

      // Construcción dinámica de query params
      const params = new URLSearchParams();
      params.append("idTeam", userTeamId);

      if (options.filterType && options.selectedDate) {
        switch (options.filterType) {
          case "año":
            params.append("year", options.selectedDate);
            break;
          case "mes":
            params.append("month", options.selectedDate);
            break;
          case "semana":
            params.append("week", options.selectedDate);
            break;
          case "día":
            params.append("day", options.selectedDate);
            break;
        }
      }

      const url = `${API_URL}/absences?${params.toString()}`;

      const res = await axios.get(url, axiosConfig);
      const records = res.data;

      // Obtener justificaciones actualizadas
      const justMap = await fetchJustifications();

      // Obtener usuarios únicos
      const uniqueUserIds = [
        ...new Set(
          records
            .map(
              (rec) =>
                rec.id_Employee ||
                rec.idEmployee ||
                rec.id_employee ||
                rec.employeeId
            )
            .filter(Boolean)
        ),
      ];

      // Resolver datos de usuarios
      const usersMap = {};
      await Promise.all(
        uniqueUserIds.map(async (id) => {
          const user = await fetchUserById(id);
          if (user) usersMap[id] = user;
        })
      );

      // Mapear registros con datos completos
      const mappedRecords = records.map((rec) => {
        const employeeId =
          rec.id_Employee ||
          rec.idEmployee ||
          rec.id_employee ||
          rec.employeeId;
        const user = usersMap[employeeId];
        const statusNorm = (rec.status || "pendiente").toLowerCase().trim();

        const isJustifiedByStatus = statusNorm === "justificada";
        const hasPermission = statusNorm === "con permiso";
        const employeeAvatar =
          user?.photo ||
          (rec.avatar && rec.avatar.startsWith("http") ? rec.avatar : null);

        return {
          ...rec,
          _id: rec._id,
          id_Employee: employeeId,
          employeeName: user
            ? `${user.names ?? ""} ${user.surnames ?? ""}`.trim()
            : `${rec.names ?? ""} ${rec.surnames ?? ""}`.trim() ||
              "Usuario no encontrado",
          employeeType: user?.userType || rec.employee_type || "Sin definir",
          employeeAvatar,
          date: rec.date,
          areaName: rec.idTeam?.name || "Sin área",
          idTeam: rec.idTeam?._id || rec.idTeam || null,
          status: rec.status || "pendiente",
          isJustified: isJustifiedByStatus || !!justMap[rec._id],
          hasPermission,
          justification: justMap[rec._id] || null,
        };
      });

      setAbsenceRecords(mappedRecords);
      return mappedRecords;
    } catch (error) {
      console.error("Error al obtener inasistencias:", error);
      handleNetworkError(error);
      Swal.fire(
        "Error",
        "No se pudo obtener la lista de inasistencias.",
        "error"
      );
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Guardar o actualizar inasistencia
  const saveAbsence = async (data, absenceId = null) => {
    try {
      if (absenceId) {
        await axios.put(`${API_URL}/absences/${absenceId}`, data, axiosConfig);
        Swal.fire(
          "Actualizado",
          "Registro de inasistencia actualizado.",
          "success"
        );
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

  // 🔹 Eliminar una inasistencia
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

  // 🔹 Cargar datos iniciales
  useEffect(() => {
    if (userId && userTeamId) {
      fetchAbsenceRecords();
    }
  }, [userId, userTeamId]);

  return {
    absenceRecords,
    justificationMap,
    loading,
    userId,
    userTeamId,
    userInfo, // 🔹 NUEVO: Info completa del usuario
    fetchAbsenceRecords,
    fetchJustifications,
    saveAbsence,
    deleteAbsence,
    saveAbsenceJustification, // 🔹 NUEVO: Para justificar inasistencias
  };
};

export default useDataAbsences;
