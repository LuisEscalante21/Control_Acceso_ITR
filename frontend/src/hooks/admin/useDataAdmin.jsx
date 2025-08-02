import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BASE = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE}${PORT}/api`;

const useDataAdmin = () => {
  const [admins, setAdmins] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [adminEdit, setAdminEdit] = useState(null);
  const navigate = useNavigate();

  const handleNetworkError = (error) => {
    if (!error.response || error.code === "ERR_NETWORK" || error.response?.status === 503) {
      navigate("/503");
    } else {
      console.error("Error:", error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await axios.get(`${API_URL}/administrators`);
      setAdmins(res.data);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de administradores.", "error");
    }
  };

  const saveAdmin = async (adminData, adminId = null) => {
    try {
      if (adminId) {
        // Actualizar administrador con JSON normal
        await axios.put(`${API_URL}/administrators/${adminId}`, adminData);
        Swal.fire("¡Actualizado!", "El administrador ha sido actualizado.", "success");
      } else {
        // Crear nuevo administrador
        await axios.post(`${API_URL}/registerAdministrators`, adminData);
        Swal.fire("¡Guardado!", "El administrador ha sido creado.", "success");
      }

      fetchAdmins();
      handleCloseForm();
    } catch (error) {
      handleNetworkError(error);
      const backendMessage = error?.response?.data?.message;

      if (backendMessage === "Email already exists in the system") {
        Swal.fire("Error", "Este correo ya está en uso.", "warning");
      } else if (backendMessage === "Invalid email format.") {
        Swal.fire("Error", "El correo tiene un formato inválido.", "warning");
      } else {
        Swal.fire("Error", "No se pudo guardar el administrador.", "error");
      }
    }
  };

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
        handleNetworkError(error);
        Swal.fire("Error", "No se pudo eliminar el administrador.", "error");
      }
    }
  };

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
