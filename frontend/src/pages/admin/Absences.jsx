import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import "../../styles/Admin/Inasistencias.css";
import useDataAbsences from "../../hooks/admin/useDataAbsences.jsx";
import useDataTeams from "../../hooks/admin/useDataTeams";
import AbsenceCard from "../../components/admin/Cards/AbsenceCard.jsx";
import ViewJustifyModal from "../../components/Tools/PageModals/ViewJustifyModal.jsx";

const justifyOptions = ["Todas", "Justificadas", "Sin justificar"];

const Absences = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedArea, setSelectedArea] = useState("Todas");
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [selectedJustify, setSelectedJustify] = useState(justifyOptions[0]);
  const [searchText, setSearchText] = useState("");
  const [viewJustify, setViewJustify] = useState(null);

  const areaRef = useRef(null);
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

  // Hooks
  const {
    absenceRecords,
    justificationMap,
    fetchAbsenceRecords,
    fetchJustifications,
    loading,
  } = useDataAbsences(empleadoId);
  const { teams: areaOptions, fetchTeams } = useDataTeams();

  // Cargar datos iniciales
  useEffect(() => {
    fetchJustifications();
    fetchTeams();
    fetchAbsenceRecords();
  }, []);

  // ⭐ Recargar inasistencias cuando cambia el área seleccionada
  useEffect(() => {
    if (selectedAreaId !== undefined) {
      fetchAbsenceRecords({ idTeam: selectedAreaId });
    }
  }, [selectedAreaId]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        (openDropdown === "area" &&
          areaRef.current &&
          !areaRef.current.contains(event.target)) ||
        (openDropdown === "justify" &&
          justifyRef.current &&
          !justifyRef.current.contains(event.target))
      ) {
        setOpenDropdown(null);
      }
    }

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const handleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleSelectArea = (option, areaId = null) => {
    setSelectedArea(option);
    setSelectedAreaId(areaId);
    setOpenDropdown(null);
  };

  const handleSelectJustify = (option) => {
    setSelectedJustify(option);
    setOpenDropdown(null);
  };

  // Filtrado (solo justificación y búsqueda, el área se filtra en backend)
  const filteredAbsences = absenceRecords
    .filter((absence) => {
      // Filtro por justificación
      if (selectedJustify === "Justificadas") return !!justificationMap?.[absence._id];
      else if (selectedJustify === "Sin justificar") return !justificationMap?.[absence._id];
      return true;
    })
    .filter((absence) => {
      // Filtro por búsqueda de nombre
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

        <div className="filters">
          {/* Dropdown Área */}
          <div className="dropdown" ref={areaRef}>
            <button
              className="filter-button docentes"
              onClick={() => handleDropdown("area")}
            >
              {selectedArea} <ChevronDown size={16} />
            </button>
            {openDropdown === "area" && (
              <div className="dropdown-menu docentes">
                <button
                  onClick={() => handleSelectArea("Todas", null)}
                  className={selectedArea === "Todas" ? "selected" : ""}
                >
                  Todas las áreas
                </button>
                {areaOptions.map((area) => (
                  <button
                    key={area._id}
                    onClick={() => handleSelectArea(area.name, area._id)}
                    className={selectedArea === area.name ? "selected" : ""}
                  >
                    {area.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown Justificación */}
          <div className="dropdown" ref={justifyRef}>
            <button
              className="filter-button salidas"
              onClick={() => handleDropdown("justify")}
            >
              {selectedJustify} <ChevronDown size={16} />
            </button>
            {openDropdown === "justify" && (
              <div className="dropdown-menu salidas">
                {justifyOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectJustify(option)}
                    className={selectedJustify === option ? "selected" : ""}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de inasistencias */}
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