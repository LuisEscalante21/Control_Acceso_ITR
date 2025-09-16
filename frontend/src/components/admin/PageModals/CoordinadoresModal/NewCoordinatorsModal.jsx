import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Swal from "sweetalert2";
import { Camera } from "lucide-react";
import "../../../styles/Modal.css";

// ⬇️ Usa tu hook de equipos
import useDataTeams from "../../../../hooks/admin/useDataTeams.jsx";

// -------- Utilidades --------
const toInputDateFormat = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

// ---------------- Componente reutilizable: Input ----------------
const FormField = ({ label, name, register, errors, validation = {}, type = "text", ...props }) => (
  <div className={`form-field ${errors[name] ? "has-error" : ""}`}>
    <label htmlFor={name}>
      {label}
      {validation.required && <span className="required-asterisk">*</span>}
    </label>
    <input
      id={name}
      type={type}
      {...register(name, validation)}
      aria-invalid={errors[name] ? "true" : "false"}
      {...props}
    />
    {errors[name] && (
      <span className="error-message" role="alert">
        {errors[name].message}
      </span>
    )}
  </div>
);

// ---------------- Componente reutilizable: Select ----------------
const FormSelect = ({ label, name, register, errors, options, loading, validation = {}, ...props }) => (
  <div className={`form-field ${errors[name] ? "has-error" : ""}`}>
    <label htmlFor={name}>
      {label}
      {validation.required && <span className="required-asterisk">*</span>}
    </label>
    <select
      id={name}
      {...register(name, validation)}
      aria-invalid={errors[name] ? "true" : "false"}
      {...props}
    >
      <option value="">{loading ? "Cargando..." : "Selecciona una opción"}</option>
      {!loading &&
        options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
    </select>
    {errors[name] && (
      <span className="error-message" role="alert">
        {errors[name].message}
      </span>
    )}
  </div>
);

export default function NewCoordinatorsModal({ onSaved, onClose }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      status: "activo",
    },
  });

  // ⬇️ Usa el hook y maneja un loading local para UX
  const { teams: teamsRaw, fetchTeams } = useDataTeams();
  const [loadingTeams, setLoadingTeams] = useState(true);

  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Watchers para formateos
  const dui = watch("DUI") || "";
  const telephone = watch("telephone") || "";
  const birthdayWatch = watch("birthday");

  // DUI 00000000-0
  useEffect(() => {
    let value = dui.replace(/\D/g, "").slice(0, 9);
    if (value.length > 8) value = value.slice(0, 8) + "-" + value.slice(8);
    setValue("DUI", value);
  }, [dui, setValue]);

  // Teléfono 0000-0000
  useEffect(() => {
    let value = telephone.replace(/\D/g, "").slice(0, 8);
    if (value.length > 4) value = value.slice(0, 4) + "-" + value.slice(4);
    setValue("telephone", value);
  }, [telephone, setValue]);

  // Cargar equipos con el hook
  useEffect(() => {
    (async () => {
      try {
        await fetchTeams();
      } finally {
        setLoadingTeams(false);
      }
    })();
  }, [fetchTeams]);

  // Mapea equipos para el select
  const teamOptions = (teamsRaw || []).map((t) => ({
    value: t._id,
    label: t.name,
  }));

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.match("image.*")) {
        Swal.fire("Error", "Por favor selecciona un archivo de imagen válido", "error");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire("Error", "La imagen no debe exceder los 2MB", "error");
        return;
      }

      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    data.status = true; // coord siempre activo según tu lógica

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === "birthday" || key === "hireDate") {
        formData.append(key, toInputDateFormat(value));
      } else {
        formData.append(key, value);
      }
    });

    if (image) formData.append("photo", image);

    try {
      await axios.post(
        "http://localhost:4000/api/registerCoordinators",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true, // ✅ por si tu API usa cookies auth
        }
      );

      await Swal.fire({
        icon: "success",
        title: "¡Guardado!",
        text: "El coordinador ha sido registrado exitosamente.",
        timer: 2000,
      });

      reset();
      setImage(null);
      setPreviewUrl(null);

      if (onSaved) {
        const result = onSaved();
        if (result instanceof Promise) await result;
      }
      if (onClose) onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      await Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: error?.response?.data?.message || "Verifica que los campos estén correctos.",
      });
    }
  };

  return (
    <form className="new-coordinador-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <button
        type="button"
        className="close-modal"
        onClick={onClose}
        aria-label="Cerrar modal"
        disabled={isSubmitting}
      >
        ×
      </button>

      <h2>Crear un nuevo coordinador</h2>

      <FormField
        label="Código de empleado:"
        name="numEmpleado"
        register={register}
        errors={errors}
        validation={{
          required: "Este campo es requerido",
          minLength: { value: 3, message: "Mínimo 3 caracteres" },
        }}
      />

      <FormField
        label="Nombres:"
        name="names"
        register={register}
        errors={errors}
        validation={{
          required: "Este campo es requerido",
          pattern: {
            value: /^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/,
            message: "Solo se permiten letras",
          },
        }}
      />

      <FormField
        label="Apellidos:"
        name="surnames"
        register={register}
        errors={errors}
        validation={{
          required: "Este campo es requerido",
          pattern: {
            value: /^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/,
            message: "Solo se permiten letras",
          },
        }}
      />

      <FormField
        label="DUI:"
        name="DUI"
        register={register}
        errors={errors}
        validation={{
          required: "Este campo es requerido",
          pattern: { value: /^\d{8}-\d{1}$/, message: "Formato: 12345678-9" },
        }}
        maxLength={10}
        placeholder="12345678-9"
      />

      <FormField
        label="Fecha de nacimiento:"
        name="birthday"
        type="date"
        register={register}
        errors={errors}
        validation={{
          required: "Este campo es requerido",
          validate: (value) => {
            const date = new Date(value);
            const today = new Date();
            return date < today || "La fecha debe ser anterior al día actual";
          },
        }}
      />

      <FormField
        label="Número telefónico:"
        name="telephone"
        register={register}
        errors={errors}
        validation={{
          required: "Este campo es requerido",
          pattern: { value: /^\d{4}-\d{4}$/, message: "Formato: 1234-5678" },
        }}
        maxLength={9}
        placeholder="1234-5678"
      />

      <FormField
        label="Correo electrónico:"
        name="email"
        type="email"
        register={register}
        errors={errors}
        validation={{
          required: "Este campo es requerido",
          pattern: {
            value: /^[^\s@]+@ricaldone\.edu\.sv$/,
            message: "Debe ser un correo @ricaldone.edu.sv",
          },
        }}
        placeholder="usuario@ricaldone.edu.sv"
      />

      <FormField
        label="Contraseña:"
        name="password"
        type="password"
        register={register}
        errors={errors}
        validation={{
          required: "Este campo es requerido",
          minLength: { value: 8, message: "Mínimo 8 caracteres" },
          pattern: {
            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
            message: "Debe incluir mayúsculas, minúsculas y números",
          },
        }}
      />

      <FormField
        label="Fecha de contratación:"
        name="hireDate"
        type="date"
        register={register}
        errors={errors}
        validation={{
          required: "Este campo es requerido",
          validate: (value) => {
            if (!birthdayWatch) return true;
            return new Date(value) > new Date(birthdayWatch) || "Debe ser posterior a la fecha de nacimiento";
          },
        }}
      />

      <FormSelect
        label="Equipo:"
        name="IdTeam"
        register={register}
        errors={errors}
        options={teamOptions}      // ⬅️ ahora sí, del hook
        loading={loadingTeams}
        validation={{ required: "Debes seleccionar un equipo" }}
      />

      <FormField
        label="Dirección de residencia:"
        name="address"
        register={register}
        errors={errors}
        validation={{
          required: "Este campo es requerido",
          minLength: { value: 5, message: "Mínimo 5 caracteres" },
        }}
      />

      <div className="form-field">
        <label>Imagen:</label>
        <div className="image-upload-container">
          <label htmlFor="photo" className="custom-image-upload">
            <div className="image-upload-label">
              <Camera className="camera-icon" />
              <span>{image ? "Cambiar imagen" : "Agregar imagen"}</span>
            </div>
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </label>
          <div className="image-preview-area">
            {isSubmitting ? (
              <div className="image-uploading-spinner"></div>
            ) : previewUrl ? (
              <img src={previewUrl} alt="Vista previa" className="image-preview" />
            ) : (
              <div className="image-placeholder">Sin imagen</div>
            )}
          </div>
        </div>
      </div>

      <button type="submit" className="btn-guardar" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? (
          <>
            <span className="spinner" aria-hidden="true"></span>
            <span className="sr-only">Guardando...</span>
          </>
        ) : (
          "GUARDAR"
        )}
      </button>
    </form>
  );
}
