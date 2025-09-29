import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import "../../styles/coordinators/Inasistencias.css";
import useDataAbsences from "../../hooks/coordinators/useDataAbsences.jsx";
import AbsenceCard from "../../components/admin/Cards/AbsenceCard.jsx";
import ViewJustifyModal from "../../components/Tools/PageModals/ViewJustifyModal.jsx";

const Absences = () => {
  const [selectedAreaFilter, setSelectedAreaFilter] = useState("Todos");
  const [selectedJustify, setSelectedJustify] = useState("Todas");
  const [searchText, setSearchText] = useState("");
  const [viewJustify, setViewJustify] = useState(null);

  // 🔹 Leer info del usuario desde cookie cifrada
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
  const teamId = userInfo?.teamId || null;

  // 🔹 Hook de datos
  const {
    absenceRecords,
    justificationMap,
    fetchAbsenceRecords,
    fetchJustifications,
  } = useDataAbsences(empleadoId);

  // 🔹 Cargar registros cuando cambian los filtros
  useEffect(() => {
    const loadAbsences = async () => {
      if (selectedAreaFilter === "Mis inasistencias") {
        await fetchAbsenceRecords({ onlyMine: true });
      } else {
        await fetchAbsenceRecords({ idTeam: teamId });
      }
      await fetchJustifications();
    };
    loadAbsences();
  }, [selectedAreaFilter, teamId]);

  // 🔹 Filtro extra (justificación + búsqueda) en frontend
  const filteredAbsences = absenceRecords
    .filter((absence) => {
      if (selectedJustify === "Justificadas")
        return !!justificationMap?.[absence._id];
      if (selectedJustify === "Sin justificar")
        return !justificationMap?.[absence._id];
      return true;
    })
    .filter((absence) => {
      if (!searchText.trim()) return true;
      return absence.employeeName
        ?.toLowerCase()
        .includes(searchText.toLowerCase());
    });

  return (
    <div className="absence-history-container">
      {/* Encabezado y buscador */}
      <div className="encabezado-inasistencias">
        <h1 className="titulo">Historial de inasistencias</h1>
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
          {/* Área */}
          <div className="area-filters">
            <select
              value={selectedAreaFilter}
              onChange={(e) => setSelectedAreaFilter(e.target.value)}
              className="filter-dropdown"
            >
              <option value="Todos">Todos (mi área)</option>
              <option value="Mis inasistencias">Mis inasistencias</option>
            </select>
          </div>

          {/* Justificación */}
          <div className="justify-filters">
            <select
              value={selectedJustify}
              onChange={(e) => setSelectedJustify(e.target.value)}
              className="filter-dropdown"
            >
              <option value="Todas">Todas</option>
              <option value="Justificadas">Justificadas</option>
              <option value="Sin justificar">Sin justificar</option>
            </select>
          </div>
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

      {/* Modal */}
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
