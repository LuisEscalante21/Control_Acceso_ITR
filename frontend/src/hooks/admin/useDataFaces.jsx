import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const BASE_URL = "http://localhost:4500";
const API_KEY = import.meta.env.VITE_MAPEO_API_KEY;

const useDataFace = () => {
  const [faces, setFaces] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  };

  const fetchFaces = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/faces`, axiosConfig);
      setFaces(Array.isArray(res.data.faces) ? res.data.faces : []);
    } catch (error) {
      Swal.fire("Error", "No se pudo obtener la lista de rostros.", "error");
    }
  };

  const saveFace = async (formData) => {
    const name = formData.get("name");
    const employee_code = formData.get("employee_code");
    const schedule_id = formData.get("schedule_id");
    const file = formData.get("image");

    if (!name?.trim() || !employee_code?.trim() || !schedule_id || !(file instanceof File)) {
      Swal.fire("Error", "Faltan datos válidos para guardar el rostro.", "error");
      return;
    }

    try {
      Swal.fire({
        title: "Procesando rostro...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.post(`${BASE_URL}/mapeo`, formData, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.close();

      if (res.data.status !== "success") {
        Swal.fire("Error", res.data.message || "Error al registrar rostro", "error");
        return;
      }

      Swal.fire("¡Guardado!", "El rostro se registró correctamente.", "success");
      fetchFaces();
      handleCloseForm();
    } catch (error) {
      Swal.close();
      Swal.fire(
        "Error",
        error?.response?.data?.message || "No se pudo guardar el rostro.",
        "error"
      );
    }
  };

  const updateFace = async (id, formData) => {
    const name = formData.get("name");
    const code = formData.get("code");
    const schedule_id = formData.get("schedule_id");
    const file = formData.get("image");

    if (!name && !code && !schedule_id && !file) {
      Swal.fire("Error", "Faltan datos válidos para actualizar el rostro.", "error");
      return;
    }

    try {
      Swal.fire({
        title: "Actualizando rostro...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.put(`${BASE_URL}/faces/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.close();

      if (res.data.status !== "success") {
        Swal.fire("Error", res.data.message || "Error al actualizar rostro", "error");
        return;
      }

      Swal.fire("¡Actualizado!", "El rostro ha sido actualizado.", "success");
      fetchFaces();
      handleCloseForm();
    } catch (error) {
      Swal.close();
      Swal.fire(
        "Error",
        error?.response?.data?.message || "No se pudo actualizar el rostro.",
        "error"
      );
    }
  };

  const deleteFace = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará el rostro permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${BASE_URL}/faces/${id}`, axiosConfig);
      Swal.fire("¡Eliminado!", "El rostro ha sido eliminado.", "success");
      fetchFaces();
    } catch (error) {
      Swal.fire("Error", "No se pudo eliminar el rostro.", "error");
    }
  };

  const handleCloseForm = () => setShowForm(false);

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
