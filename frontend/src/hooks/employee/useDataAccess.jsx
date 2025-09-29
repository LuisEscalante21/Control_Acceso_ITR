import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT_ACCESS; // Flask
const API_URL = `${BASE_URL}${PORT}/api`;

const PORT_JUSTIFICATIONS = import.meta.env.VITE_PORT; // Node
const JUSTIFICATIONS_API_URL = `${BASE_URL}${PORT_JUSTIFICATIONS}/api/justifications`;
const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;

const useDataAccess = () => {
  const [accessRecords, setAccessRecords] = useState([]);
  const [justifications, setJustifications] = useState([]);
  const [justificationMap, setJustificationMap] = useState({});
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  // ------------------------------
  // Config Axios
  // ------------------------------
  const axiosConfigFlask = {
    headers: {
      Authorization: `Bearer ${API_ACCESS_KEY}`,
      "Content-Type": "application/json",
    },
  };

  const axiosConfigNode = {
    withCredentials: true, // enviar cookies de sesión
    headers: {
      "Content-Type": "application/json",
    },
  };

  // ------------------------------
  // Manejo de errores
  // ------------------------------
  const handleNetworkError = (err) => {
    if (!err.response || err.code === "ERR_NETWORK" || err.response?.status === 503) {
      navigate("/503");
    } else if (err.response?.status === 401 || err.response?.status === 403) {
      Swal.fire("Error", "No autorizado. Inicia sesión nuevamente.", "error");
    } else {
      console.error("Error:", err);
    }
  };

  // ------------------------------
  // Obtener justificaciones (Node)
  // ------------------------------
  const fetchJustifications = async () => {
    try {
      const res = await axios.get(JUSTIFICATIONS_API_URL, axiosConfigNode);
      setJustifications(res.data);

      const map = (res.data || []).reduce((acc, j) => {
        if (j?.idAccess) acc[j.idAccess] = j;
        return acc;
      }, {});
      setJustificationMap(map);

      return res.data;
    } catch (error) {
      handleNetworkError(error);
      console.error("Error al obtener justificaciones:", error);
      setJustificationMap({});
      return [];
    }
  };

  // ------------------------------
  // Obtener accesos (Flask)
  // ------------------------------
  const fetchAccessRecords = async () => {
    try {
      const accessRes = await axios.get(`${API_URL}/access`, axiosConfigFlask);

      // Traer justificaciones frescas
      const justs = await fetchJustifications();
      const jMap = justs.reduce((acc, j) => {
        if (j?.idAccess) acc[j.idAccess] = j;
        return acc;
      }, {});

      const registros = accessRes.data || [];

      const list = registros.map((reg) => ({
        ...reg,
        employeeName: reg.employeeName || "Empleado no encontrado",
        employeeAvatar: reg.employeeAvatar || null,
        justification: jMap[reg._id] || null,
      }));

      setAccessRecords(list);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de accesos.", "error");
    }
  };

  // ------------------------------
  // Guardar acceso (Flask)
  // ------------------------------
  const saveAccessRecord = async (data) => {
    try {
      await axios.post(`${API_URL}/access`, data, axiosConfigFlask);
      Swal.fire("¡Guardado!", "El registro de acceso ha sido guardado.", "success");
      await fetchAccessRecords();
      handleCloseForm();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo guardar el registro de acceso.", "error");
    }
  };

  // ------------------------------
  // Eliminar acceso (Flask)
  // ------------------------------
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
      Swal.fire("¡Eliminado!", "El registro de acceso ha sido eliminado.", "success");
      await fetchAccessRecords();
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo eliminar el registro de acceso.", "error");
    }
  };

  // ------------------------------
  // Ver justificación
  // ------------------------------
  const handleViewJustification = (justification) => {
    if (!justification) return;
    Swal.fire({
      title: "Justificación",
      html: `
        <p><b>Motivo:</b> ${justification.reason || "-"}</p>
        <p><b>Fecha:</b> ${
          justification.date ? new Date(justification.date).toLocaleDateString() : "-"
        }</p>
        ${
          justification.evidenceUrl
            ? `<img src="${justification.evidenceUrl}" width="100%" />`
            : ""
        }
      `,
      confirmButtonText: "Cerrar",
    });
  };

  const handleCloseForm = () => setShowForm(false);

  useEffect(() => {
    fetchAccessRecords();
  }, []);

  return {
    accessRecords,
    justifications,
    justificationMap,
    fetchAccessRecords,
    fetchJustifications,
    saveAccessRecord,
    deleteAccessRecord,
    handleViewJustification,
    showForm,
    setShowForm,
    handleCloseForm,
  };
};

export default useDataAccess;
