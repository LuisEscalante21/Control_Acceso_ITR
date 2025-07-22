import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { X, Eraser } from "lucide-react";
import Swal from "sweetalert2";
import "../../../../components/styles/ScheduleFormModal.css";

const daysOfWeek = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

const toAMPM = (time) => {
  if (!time) return "Sin hora";
  const [hourStr, minute] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
};

const UpdateScheduleModal = ({ onClose, onUpdate, schedule }) => {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      name: "",
      ...daysOfWeek.reduce((acc, day) => ({
        ...acc,
        [day]: {
          Matutino: { start: "", end: "" },
          Vespertino: { start: "", end: "" },
        },
      }), {}),
    },
  });

  useEffect(() => {
    if (schedule && schedule.name) {
      setValue("name", schedule.name);
      daysOfWeek.forEach((day) => {
        if (schedule[day]) {
          setValue(`${day}.Matutino.start`, schedule[day].Matutino?.start || "");
          setValue(`${day}.Matutino.end`, schedule[day].Matutino?.end || "");
          setValue(`${day}.Vespertino.start`, schedule[day].Vespertino?.start || "");
          setValue(`${day}.Vespertino.end`, schedule[day].Vespertino?.end || "");
        }
      });
    }
  }, [schedule, setValue]);

  const onSubmit = async (data) => {
    try {
      const cleanedData = { name: data.name };
      daysOfWeek.forEach((day) => {
        const dayData = data[day];
        const validDay = {};
        if (dayData.Matutino.start && dayData.Matutino.end) {
          validDay.Matutino = { ...dayData.Matutino };
        }
        if (dayData.Vespertino.start && dayData.Vespertino.end) {
          validDay.Vespertino = { ...dayData.Vespertino };
        }
        if (Object.keys(validDay).length > 0) {
          cleanedData[day] = validDay;
        }
      });

      await onUpdate(schedule._id, cleanedData);
      onClose();
    } catch (error) {
      Swal.fire("Error", "No se pudo actualizar el horario.", "error");
    }
  };

  const clearDay = (day) => {
    setValue(`${day}.Matutino.start`, "");
    setValue(`${day}.Matutino.end`, "");
    setValue(`${day}.Vespertino.start`, "");
    setValue(`${day}.Vespertino.end`, "");
  };

  const watchAll = watch();

  return (
    <div className="modal-overlay active">
      <div className="cardH">
        <div className="modal-header">
          <X className="close-icon" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="schedule-name-row">
            <label className="schedule-name-label">Nombre :</label>
            <input className="schedule-name-input" {...register("name", { required: true })} />
          </div>

          {daysOfWeek.map((day) => (
            <div key={day} className="schedule-day-section">
              <div className="day-header">
                <h3>{day}</h3>
                <button type="button" className="clear-day-btn" onClick={() => clearDay(day)}>
                  <Eraser size={16} /> Limpiar
                </button>
              </div>

              {["Matutino", "Vespertino"].map((turno) => (
                <div className="schedule-block" key={turno}>
                  <span className="schedule-turno">{turno}:</span>
                  <div className="schedule-time-row">
                    <div className="input-group">
                      <label>Entrada:</label>
                      <div className="input-time-am">
                        <input type="time" {...register(`${day}.${turno}.start`)} />
                        <span className="am-pm">{toAMPM(watchAll?.[day]?.[turno]?.start)}</span>
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Salida:</label>
                      <div className="input-time-am">
                        <input type="time" {...register(`${day}.${turno}.end`)} />
                        <span className="am-pm">{toAMPM(watchAll?.[day]?.[turno]?.end)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <hr />
            </div>
          ))}

          <div className="schedule-buttons">
            <button type="button" className="cancelar-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="guardar-btn">Actualizar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateScheduleModal;
