import React, { useState } from "react";
import { Search } from "lucide-react";
import "../../styles/employee/Inasistencias.css";
import useDataAbsences from "../../hooks/employee/useDataAbsences.jsx";
import AbsenceCard from "../../components/admin/Cards/AbsenceCard.jsx";
import ViewJustifyModal from "../../components/Tools/PageModals/ViewJustifyModal.jsx";

const JustificationFilterOptions = ["Todas", "Justificadas", "Pendientes"];

const AbsencesEmployee = () => {
  const [selectedJustify, setSelectedJustify] = useState("Todas");
  const [searchText, setSearchText] = useState("");
  const [viewJustify, setViewJustify] = useState(null);

  // Hook - ya filtra automáticamente por el ID del empleado
  const { absenceRecords, justificationMap, loading } = useDataAbsences();

  // Filtrado en frontend (justificación y búsqueda)
  // Ya no necesitas filtrar por employeeId porque el backend lo hace
  const filteredAbsences = (absenceRecords || [])
    .filter((absence) => {
      if (selectedJustify === "Justificadas") {
        return !!justificationMap?.[absence._id];
      }
      if (selectedJustify === "Pendientes") {
        return !justificationMap?.[absence._id];
      }
      return true;
    })
    .filter((absence) => {
      if (!searchText.trim()) return true;
      const nombre = absence.employeeName?.toLowerCase() || "";
      return nombre.includes(searchText.toLowerCase());
    });

  return (
    <div className="absence-history-container">
      <div className="encabezado-inasistencias">
        <h1 className="titulo">Mis inasistencias</h1>

        <div className="buscador">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por fecha"
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
            filteredAbsences.map((absence, index) => (
              <AbsenceCard
                key={absence._id || index}
                name={absence.employeeName}
                employeeType={absence.employeeType}
                avatar={absence.employeeAvatar}
                date={absence.date}
                isJustified={!!justificationMap?.[absence._id]}
                justification={justificationMap?.[absence._id]}
                onViewJustification={() =>
                  setViewJustify(justificationMap?.[absence._id])
                }
              />
            ))
          )}
        </div>
      </div>

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