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

  const handleNetworkError = (error) => {
    if (
      !error.response ||
      error.code === "ERR_NETWORK" ||
      error.response?.status === 503
    ) {
      navigate("/503");
    } else {
      console.error("Error:", error);
    }
  };

  const fetchCoordinators = async () => {
    try {
      const res = await axios.get(`${API_URL}/coordinators`);
      setCoordinators(res.data);
    } catch (error) {
      handleNetworkError(error);
      Swal.fire("Error", "No se pudo obtener la lista de coordinadores.", "error");
    }
  };

  const saveCoordinator = async (coordinatorData, id = null) => {
    try {
      const coordinatorId = id || coordinatorEdit?._id;

      if (coordinatorId) {
        // Si es FormData, eliminar IdTeam para no actualizarlo
        if (coordinatorData instanceof FormData) {
          coordinatorData.delete("IdTeam");
        } else if (typeof coordinatorData === "object") {
          delete coordinatorData.IdTeam;
        }

        await axios.put(`${API_URL}/coordinators/${coordinatorId}`, coordinatorData, {
          headers: coordinatorData instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : undefined,
        });

        Swal.fire("¡Actualizado!", "El coordinador ha sido actualizado.", "success");
      } else {
        // Crear con todo (incluyendo IdTeam)
        await axios.post(`${API_URL}/registerCoordinators`, coordinatorData, {
          headers: coordinatorData instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : undefined,
        });

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
        await axios.delete(`${API_URL}/coordinators/${id}`);
        Swal.fire("¡Eliminado!", "El coordinador ha sido eliminado.", "success");
        await fetchCoordinators();
      } catch (error) {
        handleNetworkError(error);
        Swal.fire("Error", "No se pudo eliminar el coordinador.", "error");
      }
    }
  };

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