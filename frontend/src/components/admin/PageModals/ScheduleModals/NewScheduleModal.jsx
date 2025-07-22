import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { Eraser } from "lucide-react";
import "../../../../components/styles/NewScheduleModal.css";

// Constantes y utilidades
const days = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const turns = ["matutino", "vespertino"];

const initialDayState = {
  matutino: { entrada: "", salida: "" },
  vespertino: { entrada: "", salida: "" },
};

const defaultSchedule = {
  name: "",
  lunes: { ...initialDayState },
  martes: { ...initialDayState },
  miercoles: { ...initialDayState },
  jueves: { ...initialDayState },
  viernes: { ...initialDayState },
  sabado: { ...initialDayState },
  domingo: { ...initialDayState },
};

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// Componente reutilizable para inputs de tiempo
const TimeInput = ({ label, value, onChange, error }) => (
  <div className={`input-group ${error ? "has-error" : ""}`}>
    <span>{label}</span>
    <div className="input-time-am">
      <input
        type="time"
        value={value}
        onChange={onChange}
        aria-invalid={error ? "true" : "false"}
      />
      <span className="am-pm">{formatToAMPM(value)}</span>
    </div>
    {error && <span className="error-message">{error.message}</span>}
  </div>
);

// Funciones de utilidad
const formatToAMPM = (time) => {
  if (!time) return "Sin hora";
  const [hour, minute] = time.split(":");
  const h = parseInt(hour);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minute} ${suffix}`;
};

const isBefore = (time1, time2) => {
  if (!time1 || !time2) return true;
  const [h1, m1] = time1.split(":").map(Number);
  const [h2, m2] = time2.split(":").map(Number);
  return h1 < h2 || (h1 === h2 && m1 < m2);
};

const isBefore12_15 = (time) => {
  if (!time) return true;
  const [h, m] = time.split(":").map(Number);
  return h < 12 || (h === 12 && m <= 15);
};

const isAfter12_15 = (time) => {
  if (!time) return true;
  const [h, m] = time.split(":").map(Number);
  return h > 12 || (h === 12 && m > 15);
};

const NewScheduleModal = ({ onSave, onClose }) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: defaultSchedule,
    mode: "onChange"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const schedule = watch();

  const handleTimeChange = (day, turno, campo, value) => {
    setValue(`${day}.${turno}.${campo}`, value, { shouldValidate: true });
  };

  const handleClearDay = (day) => {
    turns.forEach(turno => {
      setValue(`${day}.${turno}.entrada`, "");
      setValue(`${day}.${turno}.salida`, "");
    });
  };

  const validateSchedule = (data) => {
    for (const day of days) {
      const matutino = data[day].matutino;
      const vespertino = data[day].vespertino;
      const dia = capitalize(day);

      // Validar horas matutinas (antes de 12:15 PM)
      if (matutino.entrada && !isBefore12_15(matutino.entrada)) {
        return `${dia} - Entrada matutina debe ser antes de las 12:15 PM`;
      }

      if (matutino.salida && !isBefore12_15(matutino.salida)) {
        return `${dia} - Salida matutina debe ser antes de las 12:15 PM`;
      }

      // Validar horas vespertinas (después de 12:15 PM)
      if (vespertino.entrada && !isAfter12_15(vespertino.entrada)) {
        return `${dia} - Entrada vespertina debe ser después de las 12:15 PM`;
      }

      if (vespertino.salida && !isAfter12_15(vespertino.salida)) {
        return `${dia} - Salida vespertina debe ser después de las 12:15 PM`;
      }

      // Validar orden de horas
      if (matutino.entrada && matutino.salida && !isBefore(matutino.entrada, matutino.salida)) {
        return `${dia} - En matutino, la entrada debe ser antes que la salida`;
      }

      if (vespertino.entrada && vespertino.salida && !isBefore(vespertino.entrada, vespertino.salida)) {
        return `${dia} - En vespertino, la entrada debe ser antes que la salida`;
      }
    }

    return true;
  };

  const onSubmit = async (data) => {
    if (!data.name.trim()) {
      Swal.fire("El nombre del horario es obligatorio", "", "warning");
      return;
    }

    const validationResult = validateSchedule(data);
    if (validationResult !== true) {
      Swal.fire(validationResult, "", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const transformed = transformSchedule(data);
      await onSave(transformed);
      Swal.fire({
        icon: "success",
        title: "Horario guardado",
        text: "El horario ha sido registrado exitosamente",
        timer: 2000,
        showConfirmButton: false
      });
      onClose();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Ocurrió un error al guardar el horario"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const transformSchedule = (schedule) => {
    const formatted = { name: schedule.name };
    for (const day of days) {
      const matutino = schedule[day].matutino;
      const vespertino = schedule[day].vespertino;
      const diaCapitalizado = capitalize(day);

      if (!matutino.entrada && !matutino.salida && !vespertino.entrada && !vespertino.salida) {
        formatted[diaCapitalizado] = null;
        continue;
      }

      formatted[diaCapitalizado] = {
        Matutino: {
          start: matutino.entrada ? formatToAMPM(matutino.entrada) : null,
          end: matutino.salida ? formatToAMPM(matutino.salida) : null,
        },
        Vespertino: {
          start: vespertino.entrada ? formatToAMPM(vespertino.entrada) : null,
          end: vespertino.salida ? formatToAMPM(vespertino.salida) : null,
        },
      };
    }
    return formatted;
  };

  return (
    <div className="modal-overlay active" role="dialog" aria-modal="true">
      <div className="cardH animate">
        <button 
          className="close-modal" 
          onClick={onClose}
          aria-label="Cerrar modal de horario"
          disabled={isSubmitting}
        >
          ×
        </button>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="schedule-header">
            <div className="schedule-name-row">
              <label className="schedule-name-label">Nombre:</label>
              <input
                type="text"
                className="schedule-name-input"
                {...register("name", { required: "Nombre es obligatorio" })}
                placeholder="Ej: Horario administrativo"
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && (
                <span className="error-message" role="alert">
                  {errors.name.message}
                </span>
              )}
            </div>
          </div>

          {days.map((day) => (
            <div key={day} className="schedule-day-section">
              <div className="day-header">
                <h3>{capitalize(day)}</h3>
                <button 
                  type="button"
                  className="clear-day-btn" 
                  onClick={() => handleClearDay(day)}
                  disabled={isSubmitting}
                >
                  <Eraser size={16} style={{ marginRight: 4 }} />
                  Limpiar
                </button>
              </div>

              {turns.map((turno) => (
                <div key={turno} className="schedule-block">
                  <label className="schedule-turno">{capitalize(turno)}:</label>

                  <div className="schedule-time-row">
                    <TimeInput
                      label="Entrada:"
                      value={schedule[day]?.[turno]?.entrada || ""}
                      onChange={(e) => handleTimeChange(day, turno, "entrada", e.target.value)}
                      error={errors[day]?.[turno]?.entrada}
                    />

                    <TimeInput
                      label="Salida:"
                      value={schedule[day]?.[turno]?.salida || ""}
                      onChange={(e) => handleTimeChange(day, turno, "salida", e.target.value)}
                      error={errors[day]?.[turno]?.salida}
                    />
                  </div>
                </div>
              ))}

              <hr />
            </div>
          ))}

          <div className="schedule-buttons">
            <button 
              type="submit" 
              className="guardar-btn"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "GUARDAR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewScheduleModal;