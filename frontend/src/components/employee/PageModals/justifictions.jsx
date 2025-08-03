import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import "../../styles/employee/Justificacion.css";

export default function JustifyModal({
  isOpen,
  onClose,
  record,
  currentUser,
  refreshAccessRecords,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onBlur" });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // Log: cuando cambian las props isOpen, record o currentUser
  useEffect(() => {
    console.log("Modal abierto:", isOpen);
    console.log("Registro seleccionado:", record);
    console.log("Usuario actual:", currentUser);
    if (!isOpen) {
      setFile(null);
      setPreview(null);
    }
  }, [isOpen, record, currentUser]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    console.log("Archivo seleccionado:", selected);
    if (!selected) return;

    const isImage = selected.type.startsWith("image/");
    const isPDF = selected.type === "application/pdf";
    const isValidSize = selected.size <= 2 * 1024 * 1024; // 2MB

    if (!isImage && !isPDF) {
      Swal.fire("Archivo no válido", "Solo se aceptan imágenes o PDF", "error");
      return;
    }
    if (!isValidSize) {
      Swal.fire("Archivo muy grande", "Debe ser menor a 2MB", "error");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const onSubmit = async (data) => {
    console.log("Datos formulario a enviar:", data);
    console.log("Archivo a enviar:", file);
    console.log("ID del acceso a enviar:", record?._id);

    const formData = new FormData();
    formData.append("date", data.fecha);
    formData.append("arrivalTime", data.hora);
    formData.append("reason", data.justificacion);
    formData.append("userId", currentUser?._id);
    formData.append("userType", currentUser?.userType);
    formData.append("IdTeam", currentUser?.idTeam);
    formData.append("idAccess", record?._id);

    if (file) {
      formData.append("evidencia", file);
    }

    try {
      const response = await fetch("http://localhost:4000/api/justifications", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error al enviar la justificación"
        );
      }

      console.log("Respuesta exitosa del servidor");
      Swal.fire("Éxito", "Justificación enviada correctamente", "success");
      if (refreshAccessRecords) {
        refreshAccessRecords(); // Recarga datos para reflejar el cambio
      }
      onClose();
    } catch (error) {
      console.error("❌ Error al enviar justificación:", error);
      Swal.fire("Error", error.message, "error");
    }
  };

  return (
    <div className={`modal-overlay ${isOpen ? "active" : ""}`}>
      <form className="justify-form" onSubmit={handleSubmit(onSubmit)}>
        <button type="button" className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2>Justificar llegada tardía</h2>

        <label>Fecha:</label>
        <input
          type="date"
          defaultValue={
            record?.date ? new Date(record.date).toISOString().slice(0, 10) : ""
          }
          {...register("fecha", { required: "Este campo es obligatorio" })}
        />
        {errors.fecha && <span className="error">{errors.fecha.message}</span>}

        <label>Hora:</label>
        <input
          type="time"
          defaultValue={
            record?.entry_time
              ? new Date(record.entry_time).toISOString().slice(11, 16)
              : ""
          }
          {...register("hora", { required: "Este campo es obligatorio" })}
        />
        {errors.hora && <span className="error">{errors.hora.message}</span>}

        <label>Justificación:</label>
        <textarea
          placeholder="Explica la razón del retraso"
          {...register("justificacion", {
            required: "La justificación es obligatoria",
          })}
        />
        {errors.justificacion && (
          <span className="error">{errors.justificacion.message}</span>
        )}

        <label>Evidencia (imagen o PDF):</label>
        <label className="custom-file-upload">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
          />
          Subir archivo
        </label>

        {preview && (
          <div className="preview">
            {file?.type?.includes("image") ? (
              <img src={preview} alt="Evidencia" />
            ) : (
              <p>{file.name}</p>
            )}
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "ENVIAR JUSTIFICACIÓN"}
        </button>
      </form>
    </div>
  );
}
