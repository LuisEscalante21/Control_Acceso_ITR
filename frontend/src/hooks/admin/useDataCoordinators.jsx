import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const API_URL = `${BASE_URL}${PORT}/api`;

const useDataCoordinators = () => {
  const [coordinators, setCoordinators] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [coordinatorEdit, setCoordinatorEdit] = useState(null);
  const navigate = useNavigate();

  // Manejo de errores
  const handleNetworkError = (error) => {
    if (!error.response || error.code === "ERR_NETWORK" || error.response?.status === 503) {
      navigate("/503");
    } else if (error.response?.status === 401) {
      Swal.fire("Error", "No autorizado. Por favor inicia sesión.", "error");
      navigate("/login");
    } else {
      console.error("Error:", error);
    }
  };

  // Obtener coordinadores
  const fetchCoordinators = async () => {
    try {
      const res = await axios.get(`${API_URL}/coordinators`, {
        withCredentials: true, //enviar cookie authToken
      });
      setCoordinators(res.data);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de coordinadores.", "error");
    }
  };

  // Guardar o actualizar coordinador
  const saveCoordinator = async (coordinatorData, id = null) => {
    try {
      const config = { withCredentials: true };
      if (coordinatorData instanceof FormData) config.headers = { "Content-Type": "multipart/form-data" };

      const coordinatorId = id || coordinatorEdit?._id;

      if (coordinatorId) {
        // No modificar IdTeam al actualizar
        if (coordinatorData instanceof FormData) coordinatorData.delete("IdTeam");
        else delete coordinatorData.IdTeam;

        await axios.put(`${API_URL}/coordinators/${coordinatorId}`, coordinatorData, config);
        Swal.fire("¡Actualizado!", "El coordinador ha sido actualizado.", "success");
      } else {
        await axios.post(`${API_URL}/registerCoordinators`, coordinatorData, config);
        Swal.fire("¡Guardado!", "El coordinador ha sido creado.", "success");
      }

      await fetchCoordinators();
      handleCloseForm();
    } catch (error) {
      handleNetworkError(error);
      const backendMessage = error?.response?.data?.message;

      if (backendMessage === "Email already exists.") {
        Swal.fire("Error", "Este correo ya está en uso.", "warning");
      } else if (backendMessage === "Invalid email format.") {
        Swal.fire("Error", "El correo tiene un formato inválido.", "warning");
      } else {
        Swal.fire("Error", "No se pudo guardar el coordinador.", "error");
      }
    }
  };

  // Eliminar coordinador
  const deleteCoordinator = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará al coordinador.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/coordinators/${id}`, { withCredentials: true });
        Swal.fire("¡Eliminado!", "El coordinador ha sido eliminado.", "success");
        await fetchCoordinators();
      } catch (error) {
        handleNetworkError(error);
        Swal.fire("Error", "No se pudo eliminar el coordinador.", "error");
      }
    }
  };

  // Cerrar formulario
  const handleCloseForm = () => {
    setShowForm(false);
    setCoordinatorEdit(null);
  };

  useEffect(() => {
    fetchCoordinators();
  }, []);

  return {
    coordinators,
    showForm,
    setShowForm,
    coordinatorEdit,
    setCoordinatorEdit,
    fetchCoordinators,
    saveCoordinator,
    deleteCoordinator,
    handleCloseForm,
  };
};

export default useDataCoordinators;
