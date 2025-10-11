import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import "../../styles/employee/Justificacion.css";

const API_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const BASE_URL = `${API_URL}${PORT}`; 

export default function JustifyModal({
  isOpen,
  onClose,
  record,
  currentUser,
  refreshAccessRecords,
  onSave, // 🔹 Función para guardar desde el hook
  isAbsence = false, // 🔹 Flag para diferenciar acceso vs inasistencia
}) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onBlur" });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // 🔹 Auto-rellenar fecha y hora cuando se abre el modal
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setPreview(null);
      reset(); // 🔹 Resetear formulario al cerrar
      return;
    }

    if (record) {
      // 🔹 ========== FECHA ==========
      let fechaFormateada = "";

      if (isAbsence) {
        // Para inasistencias: usar la fecha del registro (formato dd/mm/yyyy o dd/mm/yy)
        if (record.date) {
          // Intentar parsear diferentes formatos
          let partes;
          if (record.date.includes("/")) {
            partes = record.date.split("/");
          } else if (record.date.includes("-")) {
            partes = record.date.split("-");
          }

          if (partes && partes.length === 3) {
            let dia = partes[0].padStart(2, "0");
            let mes = partes[1].padStart(2, "0");
            let anio = partes[2];

            // Si el año es de 2 dígitos, convertirlo a 4
            if (anio.length === 2) {
              anio = `20${anio}`;
            }

            fechaFormateada = `${anio}-${mes}-${dia}`; // yyyy-mm-dd para input date
          } else {
            // Fallback: usar fecha actual si no se puede parsear
            fechaFormateada = new Date().toISOString().split("T")[0];
          }
        } else {
          // Si no hay fecha en el registro, usar fecha actual
          fechaFormateada = new Date().toISOString().split("T")[0];
        }
      } else {
        // Para accesos: usar entry_time o exit_time
        if (record.entry_time || record.exit_time) {
          const dateObj = new Date(record.entry_time || record.exit_time);
          fechaFormateada = dateObj.toISOString().split("T")[0];
        } else {
          fechaFormateada = new Date().toISOString().split("T")[0];
        }
      }

      setValue("fecha", fechaFormateada);

      // 🔹 ========== HORA ==========
      let horaFormateada = "";

      if (isAbsence) {
        // Para inasistencias: usar hora actual
        horaFormateada = new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      } else {
        // Para accesos: extraer hora del entry_time o exit_time
        if (record.entry_time || record.exit_time) {
          const dateObj = new Date(record.entry_time || record.exit_time);
          horaFormateada = dateObj.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        } else {
          horaFormateada = new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        }
      }

      setValue("hora", horaFormateada);
    }
  }, [isOpen, record, currentUser, isAbsence, setValue, reset]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const isImage = selected.type.startsWith("image/");
    const isPDF = selected.type === "application/pdf";
    const isValidSize = selected.size <= 2 * 1024 * 1024; // 2MB

    if (!isImage && !isPDF) {
      Swal.fire({
        icon: "error",
        title: "Archivo no válido",
        text: "Solo se aceptan imágenes o PDF",
        confirmButtonText: "Aceptar",
      });
      return;
    }
    if (!isValidSize) {
      Swal.fire({
        icon: "error",
        title: "Archivo muy grande",
        text: "El archivo debe ser menor a 2MB",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const onSubmit = async (data) => {
    // 🔹 Validación adicional
    if (!data.justificacion || data.justificacion.trim().length < 10) {
      Swal.fire({
        icon: "warning",
        title: "Justificación muy corta",
        text: "Por favor, escribe al menos 10 caracteres explicando el motivo.",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    try {
      const formData = new FormData();

      // 🔹 Datos básicos
      formData.append("date", data.fecha);
      formData.append("arrivalTime", data.hora);
      formData.append("reason", data.justificacion.trim());
      formData.append("userId", currentUser?.id || currentUser?._id);
      formData.append("userType", "Employee");
      // Asegurar IdTeam no vacío (usar currentUser.idTeam si record no lo tiene)
      formData.append("IdTeam", record?.idTeam || currentUser?.idTeam || "");

      // 🔹 Agregar ID según el tipo (acceso o inasistencia)
      if (isAbsence) {
        formData.append("idAbsence", record?._id);
      } else {
        formData.append("idAccess", record?._id);
      }

      // 🔹 Evidencia (archivo) -- usar la clave que espera el backend ("evidencia")
      if (file) {
        formData.append("evidencia", file);
      }

      // Depuración: listar claves/valores de FormData en consola
      for (const pair of formData.entries()) {
        // Los archivos aparecerán como objetos File
        console.log("FormData:", pair[0], pair[1]);
      }

      // 🔹 Enviar usando la función del hook (con credenciales)
      if (onSave) {
        // onSave se espera que maneje axios con `withCredentials: true`
        await onSave(formData);

        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Justificación enviada correctamente",
          confirmButtonText: "Aceptar",
          timer: 2500,
        });
      } else {
        // 🔹 Fallback con fetch (incluir credenciales)
        const response = await fetch(
          `${BASE_URL}/api/justifications`,
          {
            method: "POST",
            body: formData,
            credentials: "include", // 🔹 Enviar cookies de sesión
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Error al enviar la justificación"
          );
        }

        await response.json();

        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Justificación enviada correctamente",
          confirmButtonText: "Aceptar",
          timer: 2500,
        });
      }

      // 🔹 Refrescar datos
      if (refreshAccessRecords) {
        await refreshAccessRecords();
      }

      // 🔹 Limpiar y cerrar modal
      setFile(null);
      setPreview(null);
      reset();
      onClose();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo guardar la justificación",
        confirmButtonText: "Aceptar",
      });
    }
  };

  return (
    <div className={`modal-overlay ${isOpen ? "active" : ""}`}>
      <form className="justify-form" onSubmit={handleSubmit(onSubmit)}>
        <button type="button" className="close-btn" onClick={onClose}></button>

        {/* 🔹 Título dinámico según el tipo */}
        <h2>
          {isAbsence ? "Justificar inasistencia" : "Justificar llegada tardía"}
        </h2>

        <label>Fecha:</label>
        <input
          type="date"
          {...register("fecha", { required: "Este campo es obligatorio" })}
        />
        {errors.fecha && <span className="error">{errors.fecha.message}</span>}

        <label>Hora:</label>
        <input
          type="time"
          {...register("hora", { required: "Este campo es obligatorio" })}
        />
        {errors.hora && <span className="error">{errors.hora.message}</span>}

        <label>Justificación:</label>
        <textarea
          placeholder={
            isAbsence
              ? "Explica el motivo de tu inasistencia (mínimo 10 caracteres)"
              : "Explica la razón del retraso (mínimo 10 caracteres)"
          }
          rows={4}
          {...register("justificacion", {
            required: "La justificación es obligatoria",
            minLength: {
              value: 10,
              message: "Mínimo 10 caracteres",
            },
            maxLength: {
              value: 500,
              message: "Máximo 500 caracteres",
            },
          })}
        />
        {errors.justificacion && (
          <span className="error">{errors.justificacion.message}</span>
        )}

        <label>Evidencia (imagen o PDF - opcional):</label>
        <label className="custom-file-upload">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
          />
          {file ? ` ${file.name}` : "Subir archivo"}
        </label>

        {preview && (
          <div className="preview">
            {file?.type?.includes("image") ? (
              <img src={preview} alt="Evidencia" />
            ) : (
              <p>{file.name}</p>
            )}
            <button
              type="button"
              className="remove-file-btn"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
            >
              ✕ Quitar archivo
            </button>
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "ENVIAR JUSTIFICACIÓN"}
        </button>
      </form>
    </div>
  );
}
