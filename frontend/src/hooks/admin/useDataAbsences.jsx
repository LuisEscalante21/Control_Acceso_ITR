import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BASE = import.meta.env.VITE_BASE_URL;
const API_URL = `${BASE}4000/api`;
const USERS_API_URL = `${BASE}4000/api/users`; // ⭐ Endpoint de usuarios

const useDataAbsences = (userId = null) => {
  const [absenceRecords, setAbsenceRecords] = useState([]);
  const [justificationMap, setJustificationMap] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      console.error("🔴 Error:", err);
    }
  };

  // ⭐ Obtener usuario por ID (igual que en useDataAccess)
  const fetchUserById = async (id) => {
    try {
      const res = await axios.get(`${USERS_API_URL}/${id}`, axiosConfig);
      const user = res.data;

      let userType = "Sin definir";
      if (user?.collectionName) {
        if (user.collectionName === "employees") userType = "Empleado";
        if (user.collectionName === "coordinators") userType = "Coordinador";
        if (user.collectionName === "administrators") userType = "Administrador";
      }

      return { ...user, userType };
    } catch (error) {
      console.error("🔴 Error fetchUserById:", error);
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

  // ⭐ Obtener registros de inasistencias (con datos de usuario desde endpoint de users)
  const fetchAbsenceRecords = async (options = {}) => {
    console.log("🚀 Iniciando fetchAbsenceRecords con opciones:", options);
    setLoading(true);
    try {
      const params = {};
      
      // Filtro por empleado específico
      if (options.onlyMine && userId) {
        params.onlyEmployeeId = userId;
      }
      
      // Filtro por área/equipo
      if (options.idTeam && options.idTeam !== 'Todas') {
        params.idTeam = options.idTeam;
      }

      console.log("📡 Llamando API con URL:", `${API_URL}/absences`, "Params:", params);
      const res = await axios.get(`${API_URL}/absences`, { ...axiosConfig, params });
      const records = res.data;

      console.log("📊 Registros de inasistencias recibidos:", records);
      console.log("📊 Cantidad de registros:", records?.length);

      // ⭐ Obtener IDs únicos de empleados (puede venir como idEmployee, id_employee, o employeeId)
      const uniqueUserIds = [...new Set(records.map((rec) => rec.idEmployee || rec.id_employee || rec.employeeId).filter(Boolean))];
      console.log("👥 IDs únicos de usuarios a buscar:", uniqueUserIds);
      
      const usersMap = {};

      // ⭐ Traer datos de usuarios involucrados desde el endpoint de users
      await Promise.all(
        uniqueUserIds.map(async (id) => {
          if (id) {
            const user = await fetchUserById(id);
            if (user) {
              usersMap[id] = user;
              console.log(`✅ Usuario obtenido para ID ${id}:`, user);
            } else {
              console.warn(`⚠️ No se pudo obtener usuario para ID ${id}`);
            }
          }
        })
      );

      console.log("🗺️ Mapa de usuarios:", usersMap);

      // ⭐ Mapear los datos con información del usuario y área
      const mappedRecords = records.map((rec) => {
        const employeeId = rec.idEmployee || rec.id_employee || rec.employeeId;
        const user = usersMap[employeeId];
        
        const mappedRecord = {
          ...rec,
          _id: rec._id,
          employeeName: user ? `${user.names} ${user.surnames}` : (rec.names && rec.surnames ? `${rec.names} ${rec.surnames}` : "Usuario no encontrado"),
          employeeType: user?.userType || rec.employee_type || "Sin definir",
          employeeAvatar: user?.photo || rec.avatar || null,
          date: rec.date,
          areaName: rec.idTeam?.name || 'Sin área',
          idTeam: rec.idTeam?._id || null,
          isJustified: !!justificationMap[rec._id],
          justification: justificationMap[rec._id] || null,
        };

        console.log("📝 Registro mapeado:", {
          employeeId,
          employeeName: mappedRecord.employeeName,
          employeeAvatar: mappedRecord.employeeAvatar,
          employeeType: mappedRecord.employeeType
        });

        return mappedRecord;
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
      Swal.fire("¡Eliminado!", "Registro de inasistencia eliminado.", "success");
      await fetchAbsenceRecords();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo eliminar el registro.", "error");
    }
  };

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