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
  const [photoFile, setPhotoFile] = useState(null);

  const {
    register,
    handleSubmit,
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
      setPhotoFile(null);
      setEditMode(false);
    }
  }, [admin, reset]);

  const onSubmit = async (data) => {
    data.status = data.status === "activo";

    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key]);
    }

    if (photoFile) {
      formData.append("photo", photoFile);
    }

    try {
      await onSave(formData, admin._id);
      Swal.fire("Actualizado", "El administrador ha sido actualizado exitosamente.", "success");
      setEditMode(false);
      onClose();
    } catch (error) {
      Swal.fire("Error", "No se pudo actualizar el administrador.", "error");
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
      // Validar tipo de archivo imagen
      if (!file.type.match("image.*")) {
        Swal.fire("Error", "Por favor selecciona un archivo de imagen válido", "error");
        return;
      }
      // Validar tamaño max 2MB
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire("Error", "La imagen no debe exceder los 2MB", "error");
        return;
      }

      setPhotoFile(file);

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
            <form className="cvcard-form" onSubmit={handleSubmit(onSubmit)} style={{ width: "100%", marginTop: 10 }}>
              <div className="form-field">
                <label>Código de administrador:</label>
                <input {...register("numEmpleado", { required: true })} />
                {errors.numEmpleado && <span className="error-message">Código obligatorio</span>}
              </div>
              <div className="form-field">
                <label>Nombres:</label>
                <input {...register("names", { required: true })} />
                {errors.names && <span className="error-message">Nombres obligatorios</span>}
              </div>
              <div className="form-field">
                <label>Apellidos:</label>
                <input {...register("surnames", { required: true })} />
                {errors.surnames && <span className="error-message">Apellidos obligatorios</span>}
              </div>
              <div className="form-field">
                <label>Correo electrónico:</label>
                <input type="email" {...register("email", { required: true })} />
                {errors.email && <span className="error-message">Correo obligatorio</span>}
              </div>
              <div className="form-field">
                <label>Nueva contraseña:</label>
                <input type="password" {...register("password")} placeholder="Dejar vacío para no cambiar" autoComplete="new-password" />
              </div>
              <div className="form-field">
                <label>Número telefónico:</label>
                <input {...register("telephone", { required: true })} />
                {errors.telephone && <span className="error-message">Teléfono obligatorio</span>}
              </div>
              <div className="form-field">
                <label>Dirección de residencia:</label>
                <input {...register("address", { required: true })} />
                {errors.address && <span className="error-message">Dirección obligatoria</span>}
              </div>
              <div className="form-field">
                <label>DUI:</label>
                <input {...register("DUI", { required: true })} />
                {errors.DUI && <span className="error-message">DUI obligatorio</span>}
              </div>
              <div className="form-field">
                <label>Fecha de nacimiento:</label>
                <input type="date" {...register("birthday", { required: true })} />
                {errors.birthday && <span className="error-message">Fecha obligatoria</span>}
              </div>
              <div className="form-field">
                <label htmlFor="status">Estado:</label>
                <select id="status" {...register("status", { required: true })}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
                {errors.status && <span className="error-message">Estado obligatorio</span>}
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
