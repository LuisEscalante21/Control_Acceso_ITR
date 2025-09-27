import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import "../../../styles/Admin/Empleados.css";
import { Pencil, Trash2, Camera, UserCircle } from "lucide-react";
import { useGenerateReport } from "../../../hooks/Global/useGenerateReport";

// Convierte una fecha a formato yyyy-mm-dd para input[type="date"]
const toInputDateFormat = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

// Función para formatear el teléfono con guion después de 4 dígitos
const formatPhone = (value) => {
  value = value.replace(/\D/g, "");
  if (value.length > 4) {
    return value.slice(0, 4) + "-" + value.slice(4, 8);
  }
  return value;
};

export default function UpdateEmpleaods({
  empleado,
  onSave,
  onDelete,
  onClose,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm();
  const [editMode, setEditMode] = useState(false);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(empleado?.photo || "");

  const { generateReport } = useGenerateReport();
  const [loadingPDF, setLoadingPDF] = useState(false);

  useEffect(() => {
    reset({
      ...empleado,
      birthday: toInputDateFormat(empleado?.birthday),
      telephone: formatPhone(empleado?.telephone || ""),
      status: empleado?.status ? "activo" : "inactivo", // <-- inicializa status correctamente
    });
    setPhotoPreview(empleado?.photo || "");
    setPhotoFile(null);
    setEditMode(false);
  }, [empleado, reset]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire(
        "Error",
        "Por favor selecciona un archivo de imagen válido.",
        "error"
      );
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire("Error", "La imagen no debe superar los 2MB.", "error");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data) => {
    try {
      // Solo los campos permitidos
      const allowedFields = [
        "numEmpleado",
        "names",
        "surnames",
        "email",
        "password",
        "telephone",
        "address",
        "DUI",
        "birthday",
        "status",
      ];

      // Formatear status y teléfono
      data.status = data.status === "activo";
      data.telephone = formatPhone(data.telephone || "");

      // Construir FormData solo con los campos válidos y no vacíos
      const formData = new FormData();
      allowedFields.forEach((key) => {
        if (key === "password") {
          if (data.password && data.password.trim() !== "") {
            formData.append("password", data.password);
          }
        } else if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      await onSave(formData, empleado._id);

      Swal.fire(
        "Actualizado",
        "El empleado ha sido actualizado exitosamente.",
        "success"
      );
      setEditMode(false);
      onClose();
    } catch (error) {
      Swal.fire("Error", "No se pudo actualizar el empleado.", "error");
    }
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
        onClose();
      }
    });
  };

  if (!empleado) return null;

  return (
    <div className="modal-overlay active">
      <div className="cvcard-modal cvcard-modal-scroll">
        <button
          className="close-modal"
          onClick={onClose}
          aria-label="Cerrar modal"
          type="button"
        >
          ×
        </button>

        <div className="cvcard-header">
          {photoPreview ? (
            <img src={photoPreview} alt="Avatar" className="cvcard-avatar" />
          ) : (
            <UserCircle className="cvcard-avatar-placeholder" size={80} />
          )}
          <div className="cvcard-nombre">
            {empleado.names} {empleado.surnames}
          </div>
        </div>

        <div className="cvcard-info">
          <div className="cvcard-info-title-row">
            <span className="cvcard-info-title">Información personal</span>
            {!editMode && (
              <span className="cvcard-actions">
                <button
                  className="cvcard-action-btn"
                  onClick={() => setEditMode(true)}
                  title="Editar"
                  aria-label="Editar empleado"
                  type="button"
                >
                  <Pencil size={22} />
                </button>
                <button
                  className="cvcard-action-btn"
                  onClick={handleDelete}
                  title="Eliminar"
                  aria-label="Eliminar empleado"
                  type="button"
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
                <span className="cvcard-value">
                  {empleado.names} {empleado.surnames}
                </span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Correo electrónico</span>
                <span className="cvcard-value">{empleado.email}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Número telefónico</span>
                <span className="cvcard-value">{empleado.telephone}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Dirección de residencia</span>
                <span className="cvcard-value">{empleado.address}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Código de empleado</span>
                <span className="cvcard-value">{empleado.numEmpleado}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">DUI</span>
                <span className="cvcard-value">{empleado.DUI}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Fecha de nacimiento</span>
                <span className="cvcard-value">
                  {toInputDateFormat(empleado.birthday)}
                </span>
              </div>
              {/* ✅ BOTÓN PARA GENERAR REPORTE */}
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button
                  className="btn-reporte"
                  onClick={async () => {
                    setLoadingPDF(true);
                    try {
                      await generateReport(empleado._id); // ✅ Ejecuta el reporte
                    } catch (error) {
                      console.error("Error al generar reporte:", error);
                      Swal.fire(
                        "Error",
                        "No se pudo generar el reporte",
                        "error"
                      );
                    } finally {
                      setLoadingPDF(false);
                    }
                  }}
                  disabled={loadingPDF}
                >
                  {loadingPDF ? "Generando..." : "Generar Reporte PDF"}
                </button>
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
                <label htmlFor="numEmpleado">Código de empleado:</label>
                <input
                  id="numEmpleado"
                  {...register("numEmpleado", {
                    required: "Código obligatorio",
                  })}
                />
                {errors.numEmpleado && (
                  <span className="error-message">
                    {errors.numEmpleado.message}
                  </span>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="names">Nombres:</label>
                <input
                  id="names"
                  {...register("names", { required: "Nombres obligatorios" })}
                />
                {errors.names && (
                  <span className="error-message">{errors.names.message}</span>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="surnames">Apellidos:</label>
                <input
                  id="surnames"
                  {...register("surnames", {
                    required: "Apellidos obligatorios",
                  })}
                />
                {errors.surnames && (
                  <span className="error-message">
                    {errors.surnames.message}
                  </span>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="email">Correo electrónico:</label>
                <input
                  id="email"
                  type="email"
                  {...register("email", { required: "Correo obligatorio" })}
                />
                {errors.email && (
                  <span className="error-message">{errors.email.message}</span>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="telephone">Número telefónico:</label>
                <input
                  id="telephone"
                  {...register("telephone", {
                    required: "Teléfono obligatorio",
                  })}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    setValue("telephone", formatted);
                  }}
                />
                {errors.telephone && (
                  <span className="error-message">
                    {errors.telephone.message}
                  </span>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="status">Estado:</label>
                <select id="status" {...register("status", { required: true })}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
                {errors.status && (
                  <span className="error-message">Estado obligatorio</span>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="address">Dirección de residencia:</label>
                <input
                  id="address"
                  {...register("address", {
                    required: "Dirección obligatoria",
                  })}
                />
                {errors.address && (
                  <span className="error-message">
                    {errors.address.message}
                  </span>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="DUI">DUI:</label>
                <input
                  id="DUI"
                  {...register("DUI", { required: "DUI obligatorio" })}
                />
                {errors.DUI && (
                  <span className="error-message">{errors.DUI.message}</span>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="birthday">Fecha de nacimiento:</label>
                <input
                  id="birthday"
                  type="date"
                  {...register("birthday", { required: "Fecha obligatoria" })}
                />
                {errors.birthday && (
                  <span className="error-message">
                    {errors.birthday.message}
                  </span>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="photo">Imagen de perfil:</label>
                <div className="image-upload-container">
                  <label htmlFor="photo" className="custom-image-upload">
                    <Camera className="camera-icon" />
                    <span>
                      {photoPreview ? "Cambiar imagen" : "Agregar imagen"}
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
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="image-preview"
                      />
                    ) : (
                      <UserCircle
                        className="image-preview-placeholder"
                        size={80}
                      />
                    )}
                  </div>
                </div>
              </div>
              <button type="submit" className="btn-guardar">
                ACTUALIZAR
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
