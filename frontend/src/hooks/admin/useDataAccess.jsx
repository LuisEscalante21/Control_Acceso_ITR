import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const BASE = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE}${PORT}/api/access`;

const useAccessControl = () => {
  const [accessRecords, setAccessRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [recordEdit, setRecordEdit] = useState(null);

  // Obtener todos los registros de acceso
  const fetchAccessRecords = async () => {
    try {
      const res = await axios.get(API_URL);
      setAccessRecords(res.data);
    } catch (error) {
      console.error("Error al obtener registros de acceso:", error);
      Swal.fire("Error", "No se pudo obtener los registros de acceso.", "error");
    }
  };

  // Crear o actualizar registro de acceso
  const saveAccessRecord = async (recordData) => {
    try {
      if (recordEdit) {
        // Actualizar registro
        await axios.put(`${API_URL}/${recordEdit._id}`, recordData);
        Swal.fire("¡Actualizado!", "El registro de acceso ha sido actualizado.", "success");
      } else {
        // Crear registro
        await axios.post(API_URL, recordData);
        Swal.fire("¡Guardado!", "El registro de acceso ha sido creado.", "success");
      }
      fetchAccessRecords();
      handleCloseForm();
    } catch (error) {
      console.error("Error al guardar/actualizar registro:", error);
      Swal.fire("Error", "No se pudo guardar el registro de acceso.", "error");
    }
  };

  // Eliminar registro de acceso con confirmación
  const deleteAccessRecord = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡Esta acción eliminará el registro de acceso!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        Swal.fire("¡Eliminado!", "El registro de acceso ha sido eliminado.", "success");
        fetchAccessRecords();
      } catch (error) {
        console.error("Error al eliminar registro:", error);
        Swal.fire("Error", "No se pudo eliminar el registro de acceso.", "error");
      }
    }
  };

  // Cerrar formulario y limpiar edición
  const handleCloseForm = () => {
    setShowForm(false);
    setRecordEdit(null);
  };

  useEffect(() => {
    fetchAccessRecords();
  }, []);

  return {
    accessRecords,
    showForm,
    setShowForm,
    recordEdit,
    setRecordEdit,
    fetchAccessRecords,
    saveAccessRecord,
    deleteAccessRecord,
    handleCloseForm,
  };
};

export default useAccessControl;
