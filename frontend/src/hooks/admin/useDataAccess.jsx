import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";


const useAccessControl = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [accessRecords, setAccessRecords] = useState([]);
  const [recordEdit, setRecordEdit] = useState(null);

  const fetchAccessRecords = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/access");
      setAccessRecords(res.data);
    } catch (err) {
      console.error("Error al obtener registros de acceso:", err);
      Swal.fire("Error", "No se pudo obtener los registros de acceso.", "error");
    }
  };

  const saveAccessRecord = async (recordData) => {
    try {
      if (recordEdit) {
        // Actualizar registro
        await axios.put(
          `http://localhost:4000/api/access/${recordEdit._id}`,
          recordData
        );
        Swal.fire("¡Actualizado!", "El registro de acceso ha sido actualizado.", "success");
      } else {
        // Crear nuevo registro
        await axios.post("http://localhost:4000/api/access", recordData);
        Swal.fire("¡Guardado!", "El registro de acceso ha sido creado.", "success");
      }
      fetchAccessRecords();
      handleCloseModal();
    } catch (err) {
      console.error("Error al guardar/actualizar registro:", err);
      Swal.fire("Error", "No se pudo guardar el registro de acceso.", "error");
    }
  };

  const eliminarAccessRecord = async (id) => {
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
        await axios.delete(`http://localhost:4000/api/access${id}`);
        Swal.fire("¡Eliminado!", "El registro de acceso ha sido eliminado.", "success");
        fetchAccessRecords();
      } catch (err) {
        console.error("Error al eliminar registro:", err);
        Swal.fire("Error", "No se pudo eliminar el registro de acceso.", "error");
      }
    }
  };
  const handleCloseModal = () => {
    setShowRegister(false);
    setRecordEdit(null);
  };

  useEffect(() => {
    fetchAccessRecords();
  }, []);

  return {
    showRegister,
    setShowRegister,
    accessRecords,
    setAccessRecords,
    recordEdit,
    setRecordEdit,
    fetchAccessRecords,
    saveAccessRecord,
    eliminarAccessRecord,
    handleCloseModal,
  };
};

export default useAccessControl;
