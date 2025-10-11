import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BASE = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE}${PORT}/api`;
const USERS_API_URL = `${BASE}${PORT}/api/users`; 

const useDataAbsences = (userId = null) => {
  const [absenceRecords, setAbsenceRecords] = useState([]);
  const [justificationMap, setJustificationMap] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  //  Configuración base de Axios
  const axiosConfig = {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
  };

  // Manejo centralizado de errores
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

  // Obtener usuario por ID
  const fetchUserById = async (id) => {
    try {
      const res = await axios.get(`${USERS_API_URL}/${id}`, axiosConfig);
      const user = res.data;

      // Normaliza el tipo de usuario
      let userType = "Sin definir";
      if (user?.collectionName) {
        if (user.collectionName === "employees") userType = "Empleado";
        if (user.collectionName === "coordinators") userType = "Coordinador";
        if (user.collectionName === "administrators") userType = "Administrador";
      }

      return { ...user, userType };
    } catch (error) {
      console.error("Error fetchUserById:", error);
      return null;
    }
  };

  //  Obtener todas las justificaciones
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

  // Obtener registros de inasistencias (con soporte para filtros)
  const fetchAbsenceRecords = async (options = {}) => {
    setLoading(true);
    try {
      const params = {};

      // Filtro: solo mis inasistencias
      if (options.onlyMine && userId) {
        params.onlyEmployeeId = userId;
      }

      // Filtro: por equipo o área
      if (options.idTeam && options.idTeam !== "Todas") {
        params.idTeam = options.idTeam;
      }

      // 🔹 NUEVO: filtros de fecha dinámica
      if (options.filterType && options.selectedDate) {
        switch (options.filterType) {
          case "año":
            params.year = options.selectedDate; // Ej: 2025
            break;
          case "mes":
            params.month = options.selectedDate; // Ej: 2025-10
            break;
          case "semana":
            params.week = options.selectedDate; // Ej: 2025-W41
            break;
          case "día":
            params.day = options.selectedDate; // Ej: 2025-10-06
            break;
        }
      }

      // Petición principal al backend
      const res = await axios.get(`${API_URL}/absences`, { ...axiosConfig, params });
      const records = res.data || [];

      // Extrae los IDs únicos de empleados
      const uniqueUserIds = [
        ...new Set(
          records
            .map(
              (rec) =>
                rec.idEmployee ||
                rec.id_Employee ||
                rec.employeeId ||
                rec.id_employee
            )
            .filter(Boolean)
        ),
      ];

      const usersMap = {};

      // Obtener datos de los usuarios asociados
      await Promise.all(
        uniqueUserIds.map(async (id) => {
          const user = await fetchUserById(id);
          if (user) usersMap[id] = user;
        })
      );

      // Mapear registros completos
      const mappedRecords = records.map((rec) => {
        const employeeId =
          rec.idEmployee || rec.id_Employee || rec.employeeId || rec.id_employee;
        const user = usersMap[employeeId];

        const statusNorm = (rec.status || "").toLowerCase().trim();
        const isJustifiedByStatus = statusNorm === "justificada";
        const hasPermission = statusNorm === "con permiso";

        const employeeAvatar =
          user?.photo ||
          rec.id_Employee?.photo ||
          (rec.avatar && rec.avatar.startsWith("http") ? rec.avatar : null) ||
          null;

        const employeeName = user
          ? `${user.names ?? ""} ${user.surnames ?? ""}`.trim()
          : `${rec.names ?? ""} ${rec.surnames ?? ""}`.trim() || "Usuario no encontrado";

        const employeeType = user?.userType || rec.employee_type || "Sin definir";

        return {
          ...rec,
          _id: rec._id,
          employeeId,
          employeeName,
          employeeType,
          employeeAvatar,
          date: rec.date,
          areaName: rec.idTeam?.name || "Sin área",
          idTeam: rec.idTeam?._id || null,
          status: statusNorm,
          isJustified: isJustifiedByStatus || !!justificationMap[rec._id],
          hasPermission,
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

  // Guardar o actualizar una inasistencia
  const saveAbsence = async (data, absenceId = null) => {
    try {
      if (absenceId) {
        await axios.put(`${API_URL}/absences/${absenceId}`, data, axiosConfig);
        Swal.fire("¡Actualizado!", "Registro de inasistencia actualizado.", "success");
      } else {
        await axios.post(`${API_URL}/absences`, data, axiosConfig);
        Swal.fire("¡Guardado!", "Registro de inasistencia creado.", "success");
      }
      await fetchAbsenceRecords();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo guardar la inasistencia.", "error");
    }
  };

  // Eliminar una inasistencia
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
      Swal.fire("¡Eliminado!", "Registro de inasistencia eliminado.", "success");
      await fetchAbsenceRecords();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo eliminar el registro.", "error");
    }
  };

  // Inicialización automática
  useEffect(() => {
    fetchJustifications();
    fetchAbsenceRecords();
  }, [userId]);

  return {
    absenceRecords,
    justificationMap,
    loading,
    fetchAbsenceRecords,
    fetchJustifications,
    saveAbsence,
    deleteAbsence,
  };
};

export default useDataAbsences;
