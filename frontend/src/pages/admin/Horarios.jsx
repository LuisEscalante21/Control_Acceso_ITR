import React, { useState, useMemo, useEffect } from "react";
import "../../styles/admin/Horarios.css";
import useDataSchedules from "../../hooks/admin/useDataSchedule";
import ScheduleCard from "../../components/admin/Cards/HorarioCard.jsx";
import NewScheduleModal from "../../components/admin/PageModals/ScheduleModals/NewScheduleModal.jsx";
import ScheduleEditModal from "../../components/admin/PageModals/ScheduleModals/UpdateScheduleModal.jsx";
import ScheduleDetailsModal from "../../components/admin/PageModals/ScheduleModals/ScheduleDetailsModal.jsx";
import { Search, CirclePlus } from "lucide-react";

const Schedule = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const {
    schedules,
    fetchSchedules,
    saveSchedule,
    deleteSchedule,
    updateSchedule,
  } = useDataSchedules();

  useEffect(() => {
    fetchSchedules();
  }, []);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) =>
      schedule.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [schedules, searchTerm]);

  return (
    <>
      <div className="encabezadoschedule">
        <h1 className="titulo">Gestión de Horarios</h1>

        <div className="busqueda-schedule">
          <div className="buscadora">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="nuevo-horario-btn" onClick={() => setShowForm(true)}>
            <CirclePlus size={18} />
            Nuevo Horario
          </button>
        </div>
      </div>

      <div className="gestion-de-coordinadoress">
        <div className="coordinadores-list">
          {filteredSchedules.length > 0 ? (
            filteredSchedules.map((schedule) => (
              <ScheduleCard
                key={schedule._id}
                name={schedule.name}
                onClick={() => setSelectedSchedule(schedule)}
              />
            ))
          ) : (
            <p style={{ padding: "20px", color: "#888" }}>
              No se encontraron horarios.
            </p>
          )}
        </div>
      </div>

      {showForm && (
        <NewScheduleModal
          onSave={async (newData) => {
            await saveSchedule(newData);
            setShowForm(false);
            fetchSchedules();
          }}
          onClose={() => setShowForm(false)}
        />
      )}

      {selectedSchedule && (
        <ScheduleDetailsModal
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          onEdit={(data) => {
            setEditingSchedule(data);
            setSelectedSchedule(null);
          }}
          onDelete={async (id) => {
            await deleteSchedule(id);
            setSelectedSchedule(null);
            fetchSchedules();
          }}
        />
      )}

      {editingSchedule && (
        <ScheduleEditModal
          schedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onUpdate={async (id, updatedData) => {
            await updateSchedule(id, updatedData);
            fetchSchedules();
            setEditingSchedule(null);
          }}
        />
      )}
    </>
  );
};

export default Schedule;
