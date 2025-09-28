import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import "../../styles/employee/Inasistencias.css";
import useDataAbsences from "../../hooks/admin/useDataAbsences.jsx";
import AbsenceCard from "../../components/admin/Cards/AbsenceCard.jsx";
import ViewJustifyModal from "../../components/Tools/PageModals/ViewJustifyModal.jsx";

const AbsencesEmployee = () => {
  const [selectedJustify, setSelectedJustify] = useState("Todas");
  const [searchText, setSearchText] = useState("");
  const [viewJustify, setViewJustify] = useState(null);

  // Leer info del usuario desde cookie cifrada
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

  // Hooks
  const { absenceRecords, justificationMap, fetchAbsenceRecords, fetchJustifications } =
    useDataAbsences(empleadoId);

  useEffect(() => {
    fetchAbsenceRecords();
    fetchJustifications();
  }, []);

  // Filtrado: solo las inasistencias del propio empleado
  const filteredAbsences = absenceRecords
    .filter((absence) => absence.employeeId === empleadoId)
    .filter((absence) => {
      if (selectedJustify === "Justificadas") return !!justificationMap?.[absence._id];
      if (selectedJustify === "Pendientes") return !justificationMap?.[absence._id];
      return true; // "Todas"
    })
    .filter((absence) => {
      if (!searchText.trim()) return true;
      return absence.employeeName?.toLowerCase().includes(searchText.toLowerCase());
    });

  return (
    <div className="absence-history-container">
      {/* Encabezado y buscador */}
      <div className="encabezado-inasistencias">
        <h1 className="titulo">Mis inasistencias</h1>
        <div className="buscador">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o apellido"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Filtro Justificación */}
        <div className="filters">
          <div className="justify-filters">
            <select
              value={selectedJustify}
              onChange={(e) => setSelectedJustify(e.target.value)}
              className="filter-dropdown"
            >
              <option value="Todas">Todas</option>
              <option value="Justificadas">Justificadas</option>
              <option value="Pendientes">Pendientes</option>
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
                onViewJustification={() => setViewJustify(justificationMap?.[absence._id])}
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

export default AbsencesEmployee;
