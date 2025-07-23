import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

// Importar la URL base desde variables de entorno
const BASE = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE}${PORT}/api`;

const useDataAdmin = () => {
  const [admins, setAdmins] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [adminEdit, setAdminEdit] = useState(null);

  // Obtener todos los administradores
  const fetchAdmins = async () => {
    try {
      const res = await axios.get(`${API_URL}/administrators`);
      setAdmins(res.data);
    } catch (error) {
      console.error("Error al obtener administradores:", error);
      Swal.fire("Error", "No se pudo obtener la lista de administradores.", "error");
    }
  };

  // Crear o actualizar administrador
  const saveAdmin = async (adminData) => {
    try {
      if (adminEdit) {
        // Actualizar administrador
        await axios.put(`${API_URL}/administrators/${adminEdit._id}`, adminData);
        Swal.fire("¡Actualizado!", "El administrador ha sido actualizado.", "success");
      } else {
        // Crear administrador
        await axios.post(`${API_URL}/registerAdministrators`, adminData);
        Swal.fire("¡Guardado!", "El administrador ha sido creado.", "success");
      }
      fetchAdmins();
      handleCloseForm();
    } catch (error) {
      console.error("Error al guardar/actualizar administrador:", error);
      Swal.fire("Error", "No se pudo guardar el administrador.", "error");
    }
  };

  // Eliminar administrador con confirmación
  const deleteAdmin = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará al administrador.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/administrators/${id}`);
        Swal.fire("¡Eliminado!", "El administrador ha sido eliminado.", "success");
        fetchAdmins();
      } catch (error) {
        console.error("Error al eliminar administrador:", error);
        Swal.fire("Error", "No se pudo eliminar el administrador.", "error");
      }
    }
  };

  // Cerrar formulario y limpiar edición
  const handleCloseForm = () => {
    setShowForm(false);
    setAdminEdit(null);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return {
    admins,
    showForm,
    setShowForm,
    adminEdit,
    setAdminEdit,
    fetchAdmins,
    saveAdmin,
    deleteAdmin,
    handleCloseForm,
  };
};

export default useDataAdmin;
