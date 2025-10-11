import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Swal from "sweetalert2";
import { Camera } from "lucide-react";
import "../../../components/styles/Modal.css";

const API_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const BASE_URL = `${API_URL}${PORT}`;

// Componente reutilizable para campos del formulario (input)
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

// Componente reutilizable para selects
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
      <option value="">Selecciona una opción</option>
      {loading ? (
        <option disabled>Cargando...</option>
      ) : (
        options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))
      )}
    </select>
    {errors[name] && (
      <span className="error-message" role="alert">
        {errors[name].message}
      </span>
    )}
  </div>
);

// Función para formatear fechas a YYYY-MM-DD para inputs tipo date
const toInputDateFormat = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

export default function NewEmployeesModal({ onSaved, onClose, teamId }) {
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

  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Watchers para campos con formato
  const dui = watch("DUI") || "";
  const telephone = watch("telephone") || "";
  const email = watch("email") || "";
  const hireDate = watch("hireDate");
  const birthday = watch("birthday");

  // Formatear DUI (00000000-0)
  useEffect(() => {
    let value = dui.replace(/\D/g, "").slice(0, 9);
    if (value.length > 8) value = value.slice(0, 8) + "-" + value.slice(8);
    setValue("DUI", value);
  }, [dui, setValue]);

  // Formatear teléfono (0000-0000)
  useEffect(() => {
    let value = telephone.replace(/\D/g, "").slice(0, 8);
    if (value.length > 4) value = value.slice(0, 4) + "-" + value.slice(4);
    setValue("telephone", value);
  }, [telephone, setValue]);

  // Validar dominio de correo
  useEffect(() => {
    if (email && !email.toLowerCase().endsWith("@ricaldone.edu.sv")) {
      setValue("email", "", { shouldValidate: true });
    }
  }, [email, setValue]);

  // Validar fecha de contratación
  useEffect(() => {
    if (hireDate && birthday && new Date(hireDate) <= new Date(birthday)) {
      setValue("hireDate", "", { shouldValidate: true });
    }
  }, [hireDate, birthday, setValue]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validar tipo de imagen
      if (!file.type.match("image.*")) {
        Swal.fire("Error", "Por favor selecciona un archivo de imagen válido", "error");
        return;
      }

      // Validar tamaño de imagen (2MB máximo)
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire("Error", "La imagen no debe exceder los 2MB", "error");
        return;
      }

      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    const formData = new FormData();

    // Insertar el teamId directamente aquí, sin usar input
    formData.append("IdTeam", teamId);

    // Agregar campos al FormData
    Object.entries(data).forEach(([key, value]) => {
      if (key === "birthday" || key === "hireDate") {
        formData.append(key, toInputDateFormat(value));
      } else if (key === "status") {
        formData.append(key, value === "activo");
      } else {
        formData.append(key, value);
      }
    });

    // Agregar imagen si existe
    if (image) {
      formData.append("photo", image);
    }

    try {
      await axios.post(`${BASE_URL}/api/registerEmployees`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await Swal.fire({
        icon: "success",
        title: "¡Guardado!",
        text: "El empleado ha sido registrado exitosamente.",
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
      let errorMessage = "Verifica que los campos estén correctos.";

      if (error.response) {
        errorMessage =
          error.response.data.message ||
          (error.response.status === 409 ? "El empleado ya existe" : errorMessage);
      }

      await Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: errorMessage,
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

      <h2>Crear un nuevo empleado</h2>

      <FormField
        label="Código de empleado:"
        name="numEmpleado"
        register={register}
        errors={errors}
        validation={{
          required: "Este campo es requerido",
          minLength: {
            value: 3,
            message: "Mínimo 3 caracteres",
          },
          pattern: {
            value: /^[a-zA-Z0-9]+$/,
            message: "Solo se permiten letras y números",
          },
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
          pattern: {
            value: /^\d{8}-\d{1}$/,
            message: "Formato: 12345678-9",
          },
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
          max: {
            value: toInputDateFormat(new Date()),
            message: "La fecha no puede ser futura",
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
          pattern: {
            value: /^\d{4}-\d{4}$/,
            message: "Formato: 1234-5678",
          },
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
          minLength: {
            value: 8,
            message: "Mínimo 8 caracteres",
          },
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
            if (!birthday) return true;
            return new Date(value) > new Date(birthday) || "Debe ser posterior a la fecha de nacimiento";
          },
        }}
      />

      <FormSelect
        label="Estado:"
        name="status"
        register={register}
        errors={errors}
        options={[
          { value: "activo", label: "Activo" },
          { value: "inactivo", label: "Inactivo" },
        ]}
      />

      <FormField
        label="Dirección de residencia:"
        name="address"
        register={register}
        errors={errors}
        validation={{
          required: "Este campo es requerido",
          minLength: {
            value: 5,
            message: "Mínimo 5 caracteres",
          },
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
              disabled={isSubmitting}
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

      <button
        type="submit"
        className="btn-guardar"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
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
