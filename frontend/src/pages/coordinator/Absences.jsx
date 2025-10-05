import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import "../../styles/coordinators/Inasistencias.css";
import useDataAbsences from "../../hooks/coordinators/useDataAbsences.jsx";
import AbsenceCard from "../../components/admin/Cards/AbsenceCard.jsx";
import ViewJustifyModal from "../../components/Tools/PageModals/ViewJustifyModal.jsx";

// Opciones de filtros
const MainFilterOptions = [
  { value: "todos", label: "Todas" },
  { value: "mios", label: "Mis Inasistencias" },
];

const JustificationFilterOptions = ["Todas", "Justificadas", "Sin justificar"];

const Absences = () => {
  const [mainFilter, setMainFilter] = useState("todos");
  const [selectedJustify, setSelectedJustify] = useState("Todas");
  const [searchText, setSearchText] = useState("");
  const [viewJustify, setViewJustify] = useState(null);

  // Leer y descifrar info del usuario desde cookie cifrada
  const secretKey = import.meta.env.VITE_JWT_SECRET;
  let userInfo = null;
  const encryptedUserInfo = Cookies.get("userInfo");
  
  if (encryptedUserInfo && secretKey) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedUserInfo, secretKey);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      userInfo = decryptedStr ? JSON.parse(decryptedStr) : null;
    } catch (error) {
      console.error("Error al descifrar userInfo:", error);
      userInfo = null;
    }
  }

  const empleadoId = userInfo?._id || null;

  // Hook de datos - Ya filtra automáticamente por área del coordinador
  const {
    absenceRecords,
    justificationMap,
    fetchAbsenceRecords,
    fetchJustifications,
    userTeamId, // El área del coordinador
  } = useDataAbsences(empleadoId);

  // Refrescar datos al montar el componente
  const refreshAbsenceData = async () => {
    await fetchAbsenceRecords();
    await fetchJustifications();
  };

  useEffect(() => {
    if (empleadoId) {
      refreshAbsenceData();
    }
  }, [empleadoId]);

  // Filtrar inasistencias en el frontend
  const filteredAbsences = (absenceRecords || [])
    .filter((absence) => {
      // Filtro principal: Todas vs Mis Inasistencias
      if (mainFilter === "mios") {
        return absence.id_Employee === empleadoId;
      }
      // "todos" ya viene filtrado por área desde el backend
      return true;
    })
    .filter((absence) => {
      // Filtro por justificación
      if (selectedJustify === "Justificadas") {
        return !!justificationMap?.[absence._id];
      }
      if (selectedJustify === "Sin justificar") {
        return !justificationMap?.[absence._id];
      }
      return true;
    })
    .filter((absence) => {
      // Filtro por búsqueda de texto
      if (!searchText.trim()) return true;
      const nombre = absence.employeeName?.toLowerCase() || "";
      return nombre.includes(searchText.toLowerCase());
    });

  return (
    <div className="absence-history-container">
      {/* Encabezado */}
      <div className="encabezado-inasistencias">
        <h1 className="titulo">Historial de inasistencias</h1>

        {/* Buscador */}
        <div className="buscador">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o apellido"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Filtros */}
        <div className="filters">
          {/* Filtro principal: Todas vs Mis Inasistencias */}
          <select
            value={mainFilter}
            onChange={(e) => setMainFilter(e.target.value)}
            className="filter-dropdown"
            style={{ marginRight: "10px" }}
          >
            {MainFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Filtro por justificación */}
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

      {/* Lista de inasistencias */}
      <div className="absence-list-container">
        <div className="absence-list">
          {filteredAbsences.length === 0 ? (
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

      {/* Modal de visualización de justificación */}
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

export default Absences;