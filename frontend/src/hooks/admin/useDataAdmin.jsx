import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const useDataAdmin = () => {
  const [admins, setAdmins] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [adminEdit, setAdminEdit] = useState(null);

  // Obtener todos los administradores
  const fetchAdmins = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/administrators");
      setAdmins(res.data);
    } catch (error) {
      console.error("Error al obtener administradores:", error);
      Swal.fire("Error", "No se pudo obtener la lista de administradores.", "error");
    }
  };

 // Crear o actualizar administrador
const saveAdmin = async (adminData, id = null) => {
  try {
    if (id) {
      // Actualizar administrador
      await axios.put(`http://localhost:4000/api/administrators/${id}`, adminData);
      Swal.fire("¡Actualizado!", "El administrador ha sido actualizado.", "success");
    } else {
      // Crear administrador
      await axios.post("http://localhost:4000/api/registerAdministrators", adminData);
      Swal.fire("¡Guardado!", "El administrador ha sido creado.", "success");
    }
    await fetchAdmins();
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
        await axios.delete(`http://localhost:4000/api/administrators/${id}`);
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