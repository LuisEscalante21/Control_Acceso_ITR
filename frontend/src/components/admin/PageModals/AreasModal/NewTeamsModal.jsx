import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Swal from "sweetalert2";
import "../../../../components/styles/ModalNewTeams.css";

const API_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const BASE_URL = `${API_URL}${PORT}`; 


export default function ModalNuevaArea({ onSaved, onClose }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    if (data.name.trim().length < 3) {
      return Swal.fire("Nombre inválido", "El nombre debe tener al menos 3 caracteres.", "warning");
    }

    try {
      await axios.post(`${BASE_URL}/api/teams`, { name: data.name });
      await Swal.fire("¡Guardado!", "El área ha sido registrada exitosamente.", "success");
      reset();
      if (onSaved) onSaved();
      if (onClose) onClose();
    } catch (error) {
      await Swal.fire(
        "Error al guardar",
        error.response?.data?.message || "Verifica que los campos estén correctos.",
        "error"
      );
    }
  };

  return (
    <form className="new-coordinador-form" onSubmit={handleSubmit(onSubmit)}>
      <button
        type="button"
        className="close-modal"
        onClick={onClose}
        aria-label="Cerrar"
      >
        ×
      </button>
      <h2>Crear nueva área</h2>
      <div className="form-field">
        <label htmlFor="area-name">Nombre del área:</label>
        <input
          id="area-name"
          type="text"
          placeholder="Área"
          {...register("name", {
            required: true,
            minLength: 3,
            maxLength: 100,
          })}
        />
      </div>

      <button type="submit" className="btn-guardar" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "GUARDAR"}
      </button>
    </form>
  );
}
