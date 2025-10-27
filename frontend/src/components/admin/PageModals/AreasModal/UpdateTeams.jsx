import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import useDataTeams from "../../../../hooks/admin/useDataTeams.jsx";
import "../../../../components/styles/ModalUpdateTeams.css";

const UpdateTeams = ({ area, onClose, onSaved }) => {
  const { saveTeam } = useDataTeams();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  useEffect(() => {
    if (area) {
      reset({ name: area.name });
    }
  }, [area, reset]);

  const onSubmit = async (data) => {
    try {
      // Envía solo el nombre, el ID se pasa como segundo parámetro
      const success = await saveTeam({ name: data.name }, area._id);
      
      if (success) {
        // Llama onSaved para refrescar la lista en el componente padre
        if (onSaved) {
          onSaved();
        }
        onClose();
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
    }
  };

  return (
    <div className="card-teams-modal">
      <div className="card-teams-header">
        <div className="card-teams-title">Editar área</div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="card-teams-form">
        <div className="card-teams-group">
          <label className="card-teams-label">Nombre</label>
          <input
            className="card-teams-input"
            type="text"
            {...register("name", { 
              required: "El nombre es obligatorio",
              validate: value => value.trim().length > 0 || "El nombre no puede estar vacío"
            })}
          />
        </div>
        <div className="card-teams-actions">
          <button 
            type="submit" 
            className="card-teams-btn success" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Actualizando..." : "Actualizar"}
          </button>
          <button
            type="button"
            className="card-teams-btn neutral"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateTeams;