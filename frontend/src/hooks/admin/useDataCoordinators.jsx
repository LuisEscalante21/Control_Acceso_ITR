import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const useDataCoordinators = () => {
  const [coordinators, setCoordinators] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [coordinatorEdit, setCoordinatorEdit] = useState(null);

  // Obtener todos los coordinadores
  const fetchCoordinators = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/coordinators");
      setCoordinators(res.data);
    } catch (error) {
      console.error("Error al obtener coordinador:", error);
      Swal.fire("Error", "No se pudo obtener la lista de coordinador.", "error");
    }
  };

  // Crear o actualizar coordinador
  const saveCoordinator = async (coordinatorData, id) => {
  try {
    if (id) {
      await axios.put(`http://localhost:4000/api/coordinators/${id}`, coordinatorData);
      Swal.fire("¡Actualizado!", "El coordinador ha sido actualizado.", "success");
    } else {
      await axios.post("http://localhost:4000/api/registerCoordinators", coordinatorData);
      Swal.fire("¡Guardado!", "El coordinador ha sido creado.", "success");
    }
    await fetchCoordinators();
    handleCloseForm();
  } catch (error) {
    console.error("Error al guardar/actualizar coordinador:", error);
    Swal.fire("Error", "No se pudo guardar el coordinador.", "error");
  }
};

  // Eliminar coordinador con confirmación
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
        await axios.delete(`http://localhost:4000/api/coordinators/${id}`);
        Swal.fire("¡Eliminado!", "El coordinador ha sido eliminado.", "success");
        await fetchCoordinators();
      } catch (error) {
        console.error("Error al eliminar coordinador:", error);
        Swal.fire("Error", "No se pudo eliminar el coordinador.", "error");
      }
    }
  };

  // Cerrar formulario y limpiar edición
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