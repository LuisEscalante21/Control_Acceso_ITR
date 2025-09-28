import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import "../../styles/Admin/Inasistencias.css";
import useDataAbsences from "../../hooks/admin/useDataAbsences.jsx";
import AbsenceCard from "../../components/admin/Cards/AbsenceCard.jsx";
import ViewJustifyModal from "../../components/Tools/PageModals/ViewJustifyModal.jsx";

const justifyOptions = ["Todas", "Justificadas", "Sin justificar"];

const Absences = () => {
  const [selectedJustify, setSelectedJustify] = useState(justifyOptions[0]);
  const [searchText, setSearchText] = useState("");
  const [viewJustify, setViewJustify] = useState(null);

  const justifyRef = useRef(null);

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
  const teamId = userInfo?.teamId || null; // ID del área del usuario

  // Hooks
  const {
    absenceRecords,
    justificationMap,
    fetchAbsenceRecords,
    fetchJustifications,
  } = useDataAbsences(empleadoId);

  useEffect(() => {
    fetchAbsenceRecords();
    fetchJustifications();
  }, []);

  // Cerrar dropdown de justificación
  useEffect(() => {
    function handleClickOutside(event) {
      if (justifyRef.current && !justifyRef.current.contains(event.target)) {
        setSelectedJustify(justifyOptions[0]);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectJustify = (option) => {
    setSelectedJustify(option);
  };

  // Filtrado
  const filteredAbsences = absenceRecords
    .filter((absence) => absence.teamId === teamId) // Solo del mismo team
    .filter((absence) => {
      if (selectedJustify === "Justificadas") return !!justificationMap?.[absence._id];
      if (selectedJustify === "Sin justificar") return !justificationMap?.[absence._id];
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
