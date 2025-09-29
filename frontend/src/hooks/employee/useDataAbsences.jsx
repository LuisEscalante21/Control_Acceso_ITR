import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BASE = import.meta.env.VITE_BASE_URL;
const API_URL = `${BASE}4000/api`;

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

  // ⭐ Obtener registros de inasistencias con filtro de área
  const fetchAbsenceRecords = async (options = {}) => {
    setLoading(true);
    try {
      const params = {};
      
      // Filtro por empleado específico
      if (options.onlyMine && userId) {
        params.onlyEmployeeId = userId;
      }
      
      // ⭐ Filtro por área/equipo
      if (options.idTeam && options.idTeam !== 'Todas') {
        params.idTeam = options.idTeam;
      }

      const res = await axios.get(`${API_URL}/absences`, { ...axiosConfig, params });
      const records = res.data;

      // ⭐ Mapear los datos con información del área
      const mappedRecords = records.map((rec) => ({
        ...rec,
        _id: rec._id,
        employeeName: `${rec.names || ''} ${rec.surnames || ''}`.trim(),
        employeeType: rec.employee_type,
        employeeAvatar: rec.avatar || null,
        date: rec.date,
        areaName: rec.idTeam?.name || 'Sin área',
        idTeam: rec.idTeam?._id || null,
        isJustified: !!justificationMap[rec._id],
        justification: justificationMap[rec._id] || null,
      }));

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