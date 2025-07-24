import React from "react";
import "../../../../components/styles/ViewScheduleModal.css";
import { Trash2, Pencil } from "lucide-react";
import Swal from "sweetalert2";

const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

const formatAMPM = (time) => {
  if (!time) return "Sin hora";
  const [h, m] = time.split(":");
  let hour = parseInt(h, 10);
  const minute = parseInt(m, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute.toString().padStart(2, "0")} ${ampm}`;
};

const ViewScheduleModal = ({ schedule, onClose, onEdit, onDelete }) => {
  if (!schedule || typeof schedule !== "object") {
    return <div className="modal-overlay active">Cargando horario...</div>;
  }

  const handleDelete = () => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "¿Quieres borrar este horario?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Sí, borrar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await onDelete(schedule._id);
          await Swal.fire("¡Eliminado!", "El horario fue borrado exitosamente.", "success");
          onClose();
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "No se pudo borrar el horario.", "error");
        }
      }
    });
  };

  return (
    <div className="modal-overlay active">
      <div className="cardH">
        <button className="close-x-btn" onClick={onClose}>×</button>

        <div className="view-header">
          <h2>{schedule?.name || "Horario sin nombre"}</h2>
          <div className="action-buttons">
            <button className="delete-btn" onClick={handleDelete}>
              <Trash2 size={16} /> Borrar
            </button>
            <button className="edit-btn" onClick={() => onEdit(schedule)}>
              <Pencil size={16} /> Actualizar
            </button>
          </div>
        </div>

        <div className="schedule-details-list">
          {days.map((day) => {
            const data = schedule[day];
            if (!data) return null;

            return (
              <div key={day} className="day-schedule">
                <h4>{day}</h4>
                {["Matutino", "Vespertino"].map((turno) => (
                  <div className="schedule-block" key={turno}>
                    <label className="schedule-turno">{turno}:</label>
                    <div className="schedule-time-row">
                      <div className="input-group">
                        <label>Entrada:</label>
                        <div className="input-time-am">
                          <input
                            className="readonly-time"
                            type="text"
                            value={data[turno]?.start || ""}
                            readOnly
                          />
                          <span className="am-pm">{formatAMPM(data[turno]?.start)}</span>
                        </div>
                      </div>
                      <div className="input-group">
                        <label>Salida:</label>
                        <div className="input-time-am">
                          <input
                            className="readonly-time"
                            type="text"
                            value={data[turno]?.end || ""}
                            readOnly
                          />
                          <span className="am-pm">{formatAMPM(data[turno]?.end)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <hr />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ViewScheduleModal;
