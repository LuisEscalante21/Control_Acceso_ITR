import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import "../../styles/Admin/Inasistencias.css";
import useDataAbsences from "../../hooks/admin/useDataAbsences.jsx";
import useDataTeams from "../../hooks/admin/useDataTeams";
import AbsenceCard from "../../components/admin/Cards/AbsenceCard.jsx";
import ViewJustifyModal from "../../components/Tools/PageModals/ViewJustifyModal.jsx";

const justifyOptions = ["Todas", "Justificadas", "Sin justificar", "Con permiso"];

const Absences = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedArea, setSelectedArea] = useState("Todas");
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [selectedJustify, setSelectedJustify] = useState(justifyOptions[0]);
  const [searchText, setSearchText] = useState("");
  const [viewJustify, setViewJustify] = useState(null);

  // 🔹 Estados del filtro de fecha
  const [dateFilterType, setDateFilterType] = useState("todas");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  const areaRef = useRef(null);
  const justifyRef = useRef(null);

  // 🔐 Leer info del usuario desde cookie cifrada
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

  // 🔹 Hooks personalizados
  const {
    absenceRecords,
    justificationMap,
    fetchAbsenceRecords,
    fetchJustifications,
    loading,
  } = useDataAbsences(empleadoId);
  const { teams: areaOptions, fetchTeams } = useDataTeams();

  // 🔸 Cargar datos iniciales
  useEffect(() => {
    fetchJustifications();
    fetchTeams();
    fetchAbsenceRecords();
  }, []);

  // 🔸 Recargar inasistencias al cambiar de área
  useEffect(() => {
    if (selectedAreaId !== undefined) {
      fetchAbsenceRecords({ idTeam: selectedAreaId });
    }
  }, [selectedAreaId]);

  // 🔸 Recargar inasistencias cuando cambian los filtros de fecha
  useEffect(() => {
    if (dateFilterType !== "todas") {
      let selectedDate = "";

      if (dateFilterType === "año") selectedDate = selectedYear;
      if (dateFilterType === "mes") selectedDate = selectedMonth;
      if (dateFilterType === "semana") selectedDate = selectedWeek;
      if (dateFilterType === "día") selectedDate = selectedDay;

      if (selectedDate) {
        fetchAbsenceRecords({
          idTeam: selectedAreaId,
          filterType: dateFilterType,
          selectedDate,
        });
      }
    } else {
      fetchAbsenceRecords({ idTeam: selectedAreaId });
    }
  }, [dateFilterType, selectedYear, selectedMonth, selectedWeek, selectedDay]);

  // 🔸 Cerrar dropdowns al hacer click fuera
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

  // 🔹 Filtrado de justificación y búsqueda
  const filteredAbsences = absenceRecords
    .filter((absence) => {
      const status = absence.status?.toLowerCase() || "";
      if (selectedJustify === "Justificadas") return status === "justificada";
      if (selectedJustify === "Sin justificar")
        return status === "pendiente" || status === "";
      if (selectedJustify === "Con permiso") return status === "con permiso";
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

        {/* 🔍 Buscador */}
        <div className="buscadora">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o apellido"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* 🔹 Filtros */}
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
              style={{ width: "200px", background: "#f4f4f4" }}
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

          {/* 🔹 Filtro de fecha alineado horizontalmente */}
          <div
            className="dropdown date-filter-horizontal"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              position: "relative",
            }}
          >
            <button
              className="filter-button salidas"
              style={{ width: "200px", background: "#f4f4f4" }}
              onClick={() => handleDropdown("date")}
            >
              {dateFilterType.charAt(0).toUpperCase() + dateFilterType.slice(1)}{" "}
              <ChevronDown size={16} />
            </button>

            {openDropdown === "date" && (
              <div className="dropdown-menu salidas">
                {["todas", "año", "mes", "semana", "día"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setDateFilterType(type);
                      setOpenDropdown(null);
                    }}
                    className={dateFilterType === type ? "selected" : ""}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {dateFilterType === "año" && (
              <input
                type="number"
                min="2000"
                max="2100"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="filter-input-right"
                placeholder="Año"
              />
            )}
            {dateFilterType === "mes" && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="filter-input-right"
              />
            )}
            {dateFilterType === "semana" && (
              <input
                type="week"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="filter-input-right"
              />
            )}
            {dateFilterType === "día" && (
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="filter-input-right"
              />
            )}
          </div>
        </div>
      </div>

      {/* 🧾 Lista de inasistencias */}
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
                status={absence.status}
                justification={justificationMap?.[absence._id]}
                onViewJustification={() =>
                  setViewJustify(justificationMap?.[absence._id])
                }
              />
            ))
          )}
        </div>
      </div>

      {/* 🪟 Modal de justificación */}
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
