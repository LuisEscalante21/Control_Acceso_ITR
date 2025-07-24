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

export default function UpdateAdmins({ admin, onSave, onDelete, onClose }) {
  const [editMode, setEditMode] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(admin?.photo || "");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (admin) {
      reset({
        ...admin,
        birthday: toInputDateFormat(admin.birthday),
        status: admin.status ? "activo" : "inactivo",
        password: "",
      });
      setPhotoPreview(admin.photo || "");
      setEditMode(false);
    }
  }, [admin, reset]);

  const statusValue = watch("status");

  const onSubmit = async (data) => {
    try {
      data.status = data.status === "activo";
      data.photo = photoPreview;
      await onSave(data, admin._id);
      Swal.fire("Actualizado", "El administrador ha sido actualizado exitosamente.", "success");
      setEditMode(false);
      onClose();
    } catch (error) {
      Swal.fire("Error", "No se pudo actualizar el administrador", "error");
    }
  };

  const handleDelete = () => {
    Swal.fire({
      title: "¿Eliminar administrador?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(admin._id);
      }
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        Swal.fire("Error", "Por favor selecciona un archivo de imagen válido.", "error");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire("Error", "La imagen no debe superar los 2MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!admin) return null;

  return (
    <div className="modal-overlay active">
      <div className="cvcard-modal cvcard-modal-scroll">
        <button className="close-modal" onClick={onClose} aria-label="Cerrar modal">×</button>
        <div className="cvcard-header">
          {photoPreview ? (
            <img src={photoPreview} alt="Avatar" className="cvcard-avatar" />
          ) : (
            <UserCircle className="cvcard-avatar-placeholder" size={80} />
          )}
          <div className="cvcard-nombre">{admin.names} {admin.surnames}</div>
        </div>
        <div className="cvcard-info">
          <div className="cvcard-info-title-row">
            <span className="cvcard-info-title">Información personal</span>
            {!editMode && (
              <span className="cvcard-actions">
                <button
                  type="button"
                  className="cvcard-action-btn"
                  onClick={() => setEditMode(true)}
                  title="Editar"
                  aria-label="Editar administrador"
                >
                  <Pencil size={22} />
                </button>
                <button
                  type="button"
                  className="cvcard-action-btn"
                  onClick={handleDelete}
                  title="Eliminar"
                  aria-label="Eliminar administrador"
                >
                  <Trash2 size={22} />
                </button>
              </span>
            )}
          </div>

          {!editMode ? (
            <>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Nombres y apellidos</span>
                <span className="cvcard-value">{admin.names} {admin.surnames}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Correo electrónico:</span>
                <span className="cvcard-value">{admin.email}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Número telefónico:</span>
                <span className="cvcard-value">{admin.telephone}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Dirección de residencia:</span>
                <span className="cvcard-value">{admin.address}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Código de administrador:</span>
                <span className="cvcard-value">{admin.numEmpleado}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">DUI:</span>
                <span className="cvcard-value">{admin.DUI}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Fecha de nacimiento:</span>
                <span className="cvcard-value">{toInputDateFormat(admin.birthday)}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Estado:</span>
                <span className="cvcard-value">{admin.status ? "Activo" : "Inactivo"}</span>
              </div>
            </>
          ) : (
            <form
              className="cvcard-form"
              onSubmit={handleSubmit(onSubmit)}
              style={{ width: "100%", marginTop: 10 }}
              noValidate
            >
              <div className="form-field">
                <label htmlFor="numEmpleado">Código de administrador:</label>
                <input id="numEmpleado" {...register("numEmpleado", { required: "Código obligatorio" })} />
                {errors.numEmpleado && <span className="error-message">{errors.numEmpleado.message}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="names">Nombres:</label>
                <input id="names" {...register("names", { required: "Nombres obligatorios" })} />
                {errors.names && <span className="error-message">{errors.names.message}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="surnames">Apellidos:</label>
                <input id="surnames" {...register("surnames", { required: "Apellidos obligatorios" })} />
                {errors.surnames && <span className="error-message">{errors.surnames.message}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="email">Correo electrónico:</label>
                <input
                  id="email"
                  type="email"
                  {...register("email", {
                    required: "Correo obligatorio",
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@ricaldone\.edu\.sv$/,
                      message: "Correo debe ser @ricaldone.edu.sv",
                    },
                  })}
                />
                {errors.email && <span className="error-message">{errors.email.message}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="password">Nueva contraseña:</label>
                <input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="Dejar vacío para no cambiar"
                  autoComplete="new-password"
                />
              </div>

              <div className="form-field">
                <label htmlFor="telephone">Número telefónico:</label>
                <input id="telephone" {...register("telephone", { required: "Teléfono obligatorio" })} />
                {errors.telephone && <span className="error-message">{errors.telephone.message}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="address">Dirección de residencia:</label>
                <input id="address" {...register("address", { required: "Dirección obligatoria" })} />
                {errors.address && <span className="error-message">{errors.address.message}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="DUI">DUI:</label>
                <input
                  id="DUI"
                  {...register("DUI", {
                    required: "DUI obligatorio",
                    pattern: {
                      value: /^\d{8}-\d{1}$/,
                      message: "Formato DUI inválido (12345678-9)",
                    },
                  })}
                />
                {errors.DUI && <span className="error-message">{errors.DUI.message}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="birthday">Fecha de nacimiento:</label>
                <input
                  id="birthday"
                  type="date"
                  {...register("birthday", { required: "Fecha obligatoria" })}
                  max={toInputDateFormat(new Date())}
                />
                {errors.birthday && <span className="error-message">{errors.birthday.message}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="status">Estado:</label>
                <select
                  id="status"
                  {...register("status", { required: "Estado obligatorio" })}
                  defaultValue={statusValue}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
                {errors.status && <span className="error-message">{errors.status.message}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="photo">Imagen de perfil:</label>
                <div className="image-upload-container">
                  <label htmlFor="photo" className="custom-image-upload" tabIndex={0} onKeyDown={e => e.key === "Enter" && document.getElementById('photo').click()}>
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

              <button type="submit" className="btn-guardar" aria-label="Actualizar administrador">
                ACTUALIZAR
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
