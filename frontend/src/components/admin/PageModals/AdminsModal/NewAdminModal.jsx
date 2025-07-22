import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Swal from "sweetalert2";
import { Camera } from "lucide-react";
import "../../../styles/Modal.css";

// Componente reutilizable para inputs
const FormInput = ({ label, id, register, errors, validation, required, ...props }) => (
  <div className="form-field">
    <label htmlFor={id}>
      {label} 
      {validation?.required && <span className="required-asterisk">*</span>}
    </label>
    <input 
      id={id} 
      aria-invalid={errors[id] ? "true" : "false"}
      {...register(id, validation)} 
      {...props} 
    />
    {errors[id] && (
      <span className="error-message" role="alert">
        {errors[id].message}
      </span>
    )}
  </div>
);

// Componente para selects
const FormSelect = ({ label, id, register, errors, options, loading, validation, required }) => (
  <div className="form-field">
    <label htmlFor={id}>
      {label}
      {validation?.required && <span className="required-asterisk">*</span>}
    </label>
    <select 
      id={id} 
      aria-invalid={errors[id] ? "true" : "false"}
      {...register(id, validation)}
    >
      <option value="">Seleccione una opción</option>
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
    {errors[id] && (
      <span className="error-message" role="alert">
        {errors[id].message}
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
  } = useForm();

  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Watchers para campos con formato
  const DUI = watch("DUI") || "";
  const telephone = watch("telephone") || "";
  const password = watch("password");
  const hireDate = watch("hireDate");
  const birthday = watch("birthday");

  // Cargar equipos al montar el componente
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/teams");
        setTeams(res.data.map(team => ({
          value: team._id,
          label: team.name
        })));
      } catch (error) {
        console.error("Error al cargar equipos:", error);
        setTeams([]);
      } finally {
        setLoadingTeams(false);
      }
    };
    fetchTeams();
  }, []);

  // Formateadores de inputs
  useEffect(() => {
    setValue("DUI", formatDUI(DUI));
  }, [DUI]);

  useEffect(() => {
    setValue("telephone", formatTelephone(telephone));
  }, [telephone]);

  // Validación de fechas
  useEffect(() => {
    if (hireDate && birthday && new Date(hireDate) <= new Date(birthday)) {
      setValue("hireDate", "", { shouldValidate: true });
    }
  }, [hireDate, birthday, setValue]);

  const formatDUI = (value) => {
    value = value.replace(/\D/g, "").slice(0, 9);
    if (value.length > 8) value = value.slice(0, 8) + "-" + value.slice(8);
    return value;
  };

  const formatTelephone = (value) => {
    value = value.replace(/\D/g, "").slice(0, 8);
    if (value.length > 4) value = value.slice(0, 4) + "-" + value.slice(4);
    return value;
  };

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

  // Envío del formulario
  const onSubmit = async (data) => {
    try {
      if (!data.email.toLowerCase().endsWith("@ricaldone.edu.sv")) {
        throw new Error("El correo debe terminar en @ricaldone.edu.sv");
      }

      const formData = new FormData();
      
      // Agregar campos al FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key === "birthday" || key === "hireDate") {
          formData.append(key, new Date(value).toISOString());
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

      await axios.post("http://localhost:4000/api/registerAdministrators", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      await Swal.fire({
        icon: 'success',
        title: '¡Guardado!',
        text: 'El Administrador ha sido registrado exitosamente.',
        timer: 2000
      });
      
      // Resetear formulario
      reset();
      setImage(null);
      setPreviewUrl(null);
      
      if (onSaved) onSaved();
      if (onClose) onClose();
      
    } catch (error) {
      let errorMessage = "Error al registrar el administrador";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
      });
    }
  };

  return (
    <form 
      className="new-coordinador-form" 
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Formulario de nuevo administrador"
      noValidate
    >
      <button 
        type="button" 
        className="close-modal" 
        onClick={onClose} 
        aria-label="Cerrar modal"
        onKeyDown={(e) => e.key === 'Enter' && onClose()}
        disabled={isSubmitting}
      >
        ×
      </button>
      
      <h2>Crear un nuevo administrador</h2>

      <FormInput
        label="Código de empleado:"
        id="numEmpleado"
        register={register}
        errors={errors}
        validation={{ required: "El código de empleado es obligatorio" }}
        required
      />

      <FormInput
        label="Nombres:"
        id="names"
        register={register}
        errors={errors}
        validation={{ 
          required: "Los nombres son obligatorios",
          pattern: {
            value: /^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/,
            message: "Solo se permiten letras"
          }
        }}
        required
      />

      <FormInput
        label="Apellidos:"
        id="surnames"
        register={register}
        errors={errors}
        validation={{ 
          required: "Los apellidos son obligatorios",
          pattern: {
            value: /^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/,
            message: "Solo se permiten letras"
          }
        }}
        required
      />

      <FormInput
        label="DUI:"
        id="DUI"
        register={register}
        errors={errors}
        validation={{
          required: "El DUI es obligatorio",
          pattern: {
            value: /^\d{8}-\d{1}$/,
            message: "Formato inválido (12345678-9)"
          }
        }}
        placeholder="12345678-9"
        maxLength={10}
        required
      />

      <FormInput
        label="Fecha de nacimiento:"
        id="birthday"
        type="date"
        register={register}
        errors={errors}
        validation={{ 
          required: "La fecha de nacimiento es obligatoria",
          max: {
            value: new Date().toISOString().split('T')[0],
            message: "La fecha no puede ser futura"
          }
        }}
        required
      />

      <FormInput
        label="Número telefónico:"
        id="telephone"
        register={register}
        errors={errors}
        validation={{
          required: "El teléfono es obligatorio",
          pattern: {
            value: /^\d{4}-\d{4}$/,
            message: "Formato inválido (1234-5678)"
          }
        }}
        placeholder="1234-5678"
        maxLength={9}
        required
      />

      <FormInput
        label="Correo electrónico:"
        id="email"
        type="email"
        register={register}
        errors={errors}
        validation={{
          required: "El correo electrónico es obligatorio",
          pattern: {
            value: /^[a-zA-Z0-9._%+-]+@ricaldone\.edu\.sv$/,
            message: "Debe usar un correo institucional @ricaldone.edu.sv"
          }
        }}
        placeholder="usuario@ricaldone.edu.sv"
        required
      />

      <FormInput
        label="Contraseña:"
        id="password"
        type="password"
        register={register}
        errors={errors}
        validation={{
          required: "La contraseña es obligatoria",
          minLength: {
            value: 8,
            message: "Mínimo 8 caracteres"
          },
          pattern: {
            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
            message: "Debe incluir mayúsculas, minúsculas y números"
          }
        }}
        required
      />

      <FormInput
        label="Fecha de contratación:"
        id="hireDate"
        type="date"
        register={register}
        errors={errors}
        validation={{ 
          required: "La fecha de contratación es obligatoria",
          validate: value => {
            if (!birthday) return true;
            return new Date(value) > new Date(birthday) || 
              "Debe ser posterior a la fecha de nacimiento";
          }
        }}
        required
      />

      <FormSelect
        label="Equipo:"
        id="IdTeam"
        register={register}
        errors={errors}
        options={teams}
        loading={loadingTeams}
        validation={{ required: "Debe seleccionar un equipo" }}
        required
      />

      <FormSelect
        label="Estado:"
        id="status"
        register={register}
        errors={errors}
        options={[
          { value: "activo", label: "Activo" },
          { value: "inactivo", label: "Inactivo" }
        ]}
        validation={{ required: "Debe seleccionar un estado" }}
        required
      />

      <FormInput
        label="Dirección de residencia:"
        id="address"
        register={register}
        errors={errors}
        validation={{ 
          required: "La dirección es obligatoria",
          minLength: {
            value: 5,
            message: "Mínimo 5 caracteres"
          }
        }}
        required
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
              <img
                src={previewUrl}
                alt="Vista previa"
                className="image-preview"
              />
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
        ) : "GUARDAR"}
      </button>
    </form>
  );
}