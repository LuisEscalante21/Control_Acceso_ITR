import React, { useState } from "react";
import { Search } from "lucide-react";
import "../../styles/employee/Inasistencias.css";
import useDataAbsences from "../../hooks/employee/useDataAbsences.jsx";
import AbsenceCard from "../../components/admin/Cards/AbsenceCard.jsx";
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
    saveJustification,
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

  // 🔹 Filtrado de inasistencias
  const filteredAbsences = (absenceRecords || [])
    .filter((absence) => {
      const status = (absence.status || "").toLowerCase().trim();
      if (selectedJustify === "Justificadas") return status === "justificada";
      if (selectedJustify === "Pendientes")
        return ["pendiente", "sin justificar"].includes(status);
      return true;
    })
    .filter((absence) => {
      if (!searchText.trim()) return true;
      const fecha = absence.date?.toLowerCase() || "";
      return fecha.includes(searchText.toLowerCase());
    });

  return (
    <div className="absence-history-container">
      <div className="encabezado-inasistencias">
        <h1 className="titulo">Mis inasistencias</h1>

        <div className="buscador">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por fecha (AAAA-MM-DD)"
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
              const isPending = ["pendiente", "sin justificar"].includes(
                (absence.status || "").toLowerCase().trim()
              );


              return (
                <AbsenceCard
                  key={absence._id || index}
                  name={absence.employeeName}
                  employeeType={absence.employeeType}
                  avatar={absence.employeeAvatar || "/images/default-avatar.png"}
                  date={absence.date}
                  status={absence.status}
                  isJustified={absence.status === "justificada"}
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
          onSave={saveJustification}
          refreshAccessRecords={refreshData}
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
