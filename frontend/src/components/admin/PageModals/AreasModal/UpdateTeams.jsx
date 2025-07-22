import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import useDataTeams from "../../../../hooks/admin/useDataTeams.jsx";
import "../../../../components/styles/ModalUpdateTeams.css";

const UpdateTeams = ({ area, onClose }) => {
  const { saveTeam, eliminarTeam } = useDataTeams();

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
    await saveTeam({ ...data, _id: area._id });
    onClose();
  };

  const handleDelete = async () => {
    await eliminarTeam(area._id);
    onClose();
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
            {...register("name", { required: true })}
          />
        </div>
        <div className="card-teams-actions">
          <button type="submit" className="card-teams-btn success" disabled={isSubmitting}>
            {isSubmitting ? "Actualizando..." : "Actualizar"}
          </button>
          <button
            type="button"
            className="card-teams-btn danger"
            onClick={handleDelete}
          >
            Eliminar
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
