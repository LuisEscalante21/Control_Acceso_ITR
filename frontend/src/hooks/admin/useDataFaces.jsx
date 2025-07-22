import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const BASE_URL = "http://localhost:4500";
const API_KEY = "1HtMu1BG0RU17M5I7EkmjspAu72yxJ";

const useDataFace = () => {
  const [faces, setFaces] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  };

  // Obtener todos los rostros
  const fetchFaces = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/faces`, axiosConfig);
      setFaces(Array.isArray(res.data.faces) ? res.data.faces : []);
    } catch (error) {
      console.error("Error al obtener rostros:", error);
      Swal.fire("Error", "No se pudo obtener la lista de rostros.", "error");
    }
  };

  // Registrar nuevo rostro
  const saveFace = async (file) => {
    if (!file) {
      Swal.fire("Error", "No se seleccionó ningún archivo.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${BASE_URL}/mapeo`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${API_KEY}`,
        },
      });

      Swal.fire("¡Guardado!", "El rostro ha sido registrado.", "success");
      fetchFaces();
      handleCloseForm();
    } catch (error) {
      console.error("Error al guardar rostro:", error);
      Swal.fire(
        "Error",
        error.response?.data?.error || "No se pudo guardar el rostro.",
        "error"
      );
    }
  };

  // Actualizar rostro
  const updateFace = async (id, file) => {
    if (!file) {
      Swal.fire("Error", "No se seleccionó ningún archivo.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.put(`${BASE_URL}/faces/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${API_KEY}`,
        },
      });

      Swal.fire("¡Actualizado!", "El rostro ha sido actualizado.", "success");
      fetchFaces();
      handleCloseForm();
    } catch (error) {
      console.error("Error al actualizar rostro:", error);
      Swal.fire(
        "Error",
        error.response?.data?.error || "No se pudo actualizar el rostro.",
        "error"
      );
    }
  };

  // Eliminar rostro
  const deleteFace = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará el rostro permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${BASE_URL}/faces/${id}`, axiosConfig);
        Swal.fire("¡Eliminado!", "El rostro ha sido eliminado.", "success");
        fetchFaces();
      } catch (error) {
        console.error("Error al eliminar rostro:", error);
        Swal.fire(
          "Error",
          error.response?.data?.error || "No se pudo eliminar el rostro.",
          "error"
        );
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  useEffect(() => {
    fetchFaces();
  }, []);

  return {
    faces,
    showForm,
    setShowForm,
    fetchFaces,
    saveFace,
    updateFace,
    deleteFace,
    handleCloseForm,
  };
};

export default useDataFace;
