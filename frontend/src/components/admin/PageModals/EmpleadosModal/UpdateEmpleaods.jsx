import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import "../../../../styles/Admin/Empleados.css";
import { Pencil, Trash2, Camera, UserCircle } from "lucide-react";

const toInputDateFormat = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

export default function UpdateEmpleaods({ empleado, onSave, onDelete, onClose }) {
  const [editMode, setEditMode] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(empleado?.photo || "");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (empleado) {
      reset({
        ...empleado,
        birthday: toInputDateFormat(empleado.birthday),
        status: empleado.status ? "activo" : "inactivo",
        password: ""
      });
      setPhotoPreview(empleado.photo || "");
      setEditMode(false);
    }
  }, [empleado, reset]);

  const onSubmit = async (data) => {
    data.status = data.status === "activo";
    data.photo = photoPreview;
    await onSave(data, empleado._id);
    Swal.fire("Actualizado", "El empleado ha sido actualizado exitosamente.", "success");
    setEditMode(false);
    onClose();
  };

  const handleDelete = () => {
    Swal.fire({
      title: "¿Eliminar empleado?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(empleado._id);
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
    }
  };

  if (!empleado) return null;

  return (
    <div className="modal-overlay active">
      <div className="cvcard-modal cvcard-modal-scroll">
        <button className="close-modal" onClick={onClose}>×</button>
        <div className="cvcard-header">
          {photoPreview ? (
            <img src={photoPreview} alt="Avatar" className="cvcard-avatar" />
          ) : (
            <UserCircle className="cvcard-avatar-placeholder" size={80} />
          )}
          <div className="cvcard-nombre">{empleado.names} {empleado.surnames}</div>
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
                <span className="cvcard-value">{empleado.names} {empleado.surnames}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Correo electrónico:</span>
                <span className="cvcard-value">{empleado.email}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Número telefónico:</span>
                <span className="cvcard-value">{empleado.telephone}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Dirección de residencia:</span>
                <span className="cvcard-value">{empleado.address}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Código de empleado:</span>
                <span className="cvcard-value">{empleado.numEmpleado}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">DUI:</span>
                <span className="cvcard-value">{empleado.DUI}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Fecha de nacimiento:</span>
                <span className="cvcard-value">{toInputDateFormat(empleado.birthday)}</span>
              </div>
            </>
          ) : (
            <form className="cvcard-form" onSubmit={handleSubmit(onSubmit)} style={{ width: "100%", marginTop: 10 }}>
              <div className="form-field">
                <label>Código de empleado:</label>
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
                <input {...register("email", { required: true })} />
              </div>
              <div className="form-field">
                <label>Nueva contraseña:</label>
                <input
                  type="password"
                  {...register("password")}
                  placeholder="Dejar vacío para no cambiar"
                  autoComplete="new-password"
                />
              </div>
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
                    <Camera className="camera-icon" />
                    <span>{photoPreview ? "Cambiar imagen" : "Agregar imagen"}</span>
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
                      <UserCircle className="image-preview-placeholder" size={80} />
                    )}
                  </div>
                </div>
              </div>
              <button type="submit" className="btn-guardar">ACTUALIZAR</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
