// UpdateCoordinators.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import "../../../../components/styles/ModalUpdate.css";
import { Pencil, Trash2, Camera } from "lucide-react";

const toInputDateFormat = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

export default function UpdateCoordinators({ coordinator, onSave, onDelete, onClose }) {
  const [editMode, setEditMode] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm();

  useEffect(() => {
    if (coordinator) {
      reset({
        ...coordinator,
        birthday: toInputDateFormat(coordinator.birthday),
        status: coordinator.status ? "activo" : "inactivo",
        password: ""
      });
      setEditMode(false);
      setPhotoPreview(coordinator.photo);
    }
  }, [coordinator, reset]);

  const onSubmit = async (data) => {
    // Convierte el estado a booleano
    data.status = data.status === "activo";
    // Si hay una nueva foto, envíala; si no, envía la original
    data.photo = photoPreview || coordinator.photo;
    // Si la contraseña está vacía, elimínala para no sobreescribir
    if (!data.password) delete data.password;

    await onSave(data, coordinator._id);
    await Swal.fire("Actualizado", "El coordinador ha sido actualizado exitosamente.", "success");
    setEditMode(false);
    onClose();
  };

  const handleDelete = () => {
    Swal.fire({
      title: "¿Eliminar coordinador?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(coordinator._id);
      }
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview("");
    }
  };

  if (!coordinator) return null;

  return (
    <div className="modal-overlay active">
      <div className="cvcard-modal cvcard-modal-scroll">
        <button className="close-modal" onClick={onClose}>×</button>
        <div className="cvcard-header">
          <img src={coordinator.photo} alt="Avatar" className="cvcard-avatar" />
          <div className="cvcard-nombre">{coordinator.names} {coordinator.surnames}</div>
        </div>
        <div className="cvcard-info">
          <div className="cvcard-info-title-row">
            <span className="cvcard-info-title">Información personal</span>
            {!editMode && (
              <span className="cvcard-actions">
                <button className="cvcard-action-btn" onClick={() => setEditMode(true)} title="Editar">
                  <Pencil size={22} />
                </button>
                <button className="cvcard-action-btn" onClick={handleDelete} title="Eliminar">
                  <Trash2 size={22} />
                </button>
              </span>
            )}
          </div>

          {!editMode ? (
            <>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Nombres y apellidos</span>
                <span className="cvcard-value">{coordinator.names} {coordinator.surnames}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Correo electrónico:</span>
                <span className="cvcard-value">{coordinator.email}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Número telefónico:</span>
                <span className="cvcard-value">{coordinator.telephone}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Dirección de residencia:</span>
                <span className="cvcard-value">{coordinator.address}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Código de coordinador:</span>
                <span className="cvcard-value">{coordinator.numEmpleado}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">DUI:</span>
                <span className="cvcard-value">{coordinator.DUI}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Fecha de nacimiento:</span>
                <span className="cvcard-value">{toInputDateFormat(coordinator.birthday)}</span>
              </div>
            </>
          ) : (
            <form className="cvcard-form" onSubmit={handleSubmit(onSubmit)} style={{ width: "100%", marginTop: 10 }}>
              <div className="form-field">
                <label>Código de coordinador:</label>
                <input {...register("numEmpleado", { required: true })} />
              </div>
              <div className="form-field">
                <label>Nombres:</label>
                <input {...register("names", { required: true })} />
              </div>
              <div className="form-field">
                <label>Apellidos:</label>
                <input {...register("surnames", { required: true })} />
              </div>
              <div className="form-field">
                <label>Correo electrónico:</label>
                <input type="email" {...register("email", { required: true })} />
              </div>
              <div className="form-field">
                <label>Nueva contraseña:</label>
                <input
                  type="password"
                  {...register("password", {
                    minLength: {
                      value: 8,
                      message: "La contraseña debe tener al menos 8 caracteres.",
                    },
                  })}
                  placeholder="Dejar vacío para no cambiar"
                  autoComplete="new-password"
                />
              </div>
              {errors.password && (
                <span className="error-message" role="alert">
                  {errors.password.message}
                </span>
              )}
              <div className="form-field">
                <label>Número telefónico:</label>
                <input {...register("telephone", { required: true })} />
              </div>
              <div className="form-field">
                <label>Dirección de residencia:</label>
                <input {...register("address", { required: true })} />
              </div>
              <div className="form-field">
                <label>DUI:</label>
                <input {...register("DUI", { required: true })} />
              </div>
              <div className="form-field">
                <label>Fecha de nacimiento:</label>
                <input type="date" {...register("birthday", { required: true })} />
              </div>
              <div className="form-field">
                <label htmlFor="status">Estado:</label>
                <select id="status" {...register("status", { required: true })}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="photo">Imagen de perfil:</label>
                <div className="image-upload-container">
                  <label htmlFor="photo" className="custom-image-upload">
                    <span className="image-upload-label">
                      <Camera className="camera-icon" />
                      <span>{photoPreview ? "Cambiar imagen" : "Agregar imagen"}</span>
                    </span>
                    <input
                      id="photo"
                      name="photo"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />
                  </label>
                  <div className="image-preview-area">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="image-preview" />
                    ) : (
                      <div className="image-placeholder">Sin imagen</div>
                    )}
                  </div>
                </div>
              </div>
              <button type="submit" className="btn-guardar" disabled={isSubmitting}>
                {isSubmitting ? "Actualizando..." : "ACTUALIZAR"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
