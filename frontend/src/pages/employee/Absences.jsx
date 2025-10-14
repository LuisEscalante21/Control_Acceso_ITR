import React, { useState } from "react";
import { Search } from "lucide-react";
import "../../styles/employee/Inasistencias.css";
import useDataAbsences from "../../hooks/employee/useDataAbsences.jsx";
import AbsenceCard from "../../components/employee/Cards/AbsenceCard.jsx";
import JustifyModal from "../../components/employee/PageModals/justifictions.jsx";
import ViewJustifyModal from "../../components/Tools/PageModals/ViewJustifyModal.jsx";

const JustificationFilterOptions = ["Todas", "Justificadas", "Pendientes"];

const AbsencesEmployee = () => {
  const [selectedJustify, setSelectedJustify] = useState("Todas");
  const [searchText, setSearchText] = useState("");
  const [viewJustify, setViewJustify] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [justificarInfo, setJustificarInfo] = useState(null);

  const {
    absenceRecords,
    justificationMap,
    loading,
    saveAbsenceJustification,
    userId,
    fetchAbsenceRecords,
    fetchJustifications,
  } = useDataAbsences();

  const handleOpenJustifyModal = (absence) => {
    setJustificarInfo(absence);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setJustificarInfo(null);
  };

  const refreshData = async () => {
    await fetchAbsenceRecords();
    await fetchJustifications();
  };

  // 🔹 Filtrado de inasistencias por estado y buscador (año, mes o día)
  const filteredAbsences = (absenceRecords || [])
    .filter((absence) => {
      const status = (absence.status || "pendiente").toLowerCase().trim();
      if (selectedJustify === "Justificadas") return status === "justificada";
      if (selectedJustify === "Pendientes")
        return ["pendiente", "sin justificar"].includes(status);
      return true;
    })
    .filter((absence) => {
      if (!searchText.trim()) return true;

      const recordDate = new Date(absence.date);
      const year = recordDate.getFullYear().toString();
      const month = String(recordDate.getMonth() + 1).padStart(2, "0");
      const day = String(recordDate.getDate()).padStart(2, "0");

      const search = searchText.trim();

      return (
        year.includes(search) || month.includes(search) || day.includes(search)
      );
    });

  return (
    <div className="absence-history-container">
      <div className="encabezado-inasistencias">
        <h1 className="titulo">Mis inasistencias</h1>

        <div className="buscador">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por año, mes o día"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="filters">
          <select
            value={selectedJustify}
            onChange={(e) => setSelectedJustify(e.target.value)}
            className="filter-dropdown"
          >
            {JustificationFilterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="absence-list-container">
        <div className="absence-list">
          {loading ? (
            <p>Cargando inasistencias...</p>
          ) : filteredAbsences.length === 0 ? (
            <p>No hay inasistencias para mostrar.</p>
          ) : (
            filteredAbsences.map((absence, index) => {
              const statusNormalized = (absence.status || "pendiente")
                .toLowerCase()
                .trim();

              const isPending =
                statusNormalized === "pendiente" ||
                statusNormalized === "sin justificar" ||
                !absence.status;

              return (
                <AbsenceCard
                  key={absence._id || index}
                  name={absence.employeeName}
                  employeeType={absence.employeeType}
                  avatar={
                    absence.employeeAvatar || "/images/default-avatar.png"
                  }
                  date={absence.date}
                  status={absence.status || "pendiente"}
                  isJustified={statusNormalized === "justificada"}
                  justification={justificationMap?.[absence._id]}
                  showJustifyButton={isPending}
                  onJustifyClick={() => handleOpenJustifyModal(absence)}
                  onViewJustification={() =>
                    setViewJustify(justificationMap?.[absence._id])
                  }
                />
              );
            })
          )}
        </div>
      </div>

      {isModalOpen && (
        <JustifyModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          record={justificarInfo}
          currentUser={{ id: userId }}
          onSave={saveAbsenceJustification}
          refreshAccessRecords={refreshData}
          isAbsence={true}
        />
      )}

      {viewJustify && (
        <ViewJustifyModal
          isOpen={!!viewJustify}
          onClose={() => setViewJustify(null)}
          justification={viewJustify}
        />
      )}
    </div>
  );
};

export default AbsencesEmployee;
