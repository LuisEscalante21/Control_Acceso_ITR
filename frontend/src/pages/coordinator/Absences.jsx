import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import "../../styles/coordinators/Inasistencias.css";
import useDataAbsences from "../../hooks/coordinators/useDataAbsences.jsx";
import AbsenceCard from "../../components/admin/Cards/AbsenceCard.jsx";
import JustifyModal from "../../components/employee/PageModals/justifictions.jsx";
import ViewJustifyModal from "../../components/Tools/PageModals/ViewJustifyModal.jsx";

const MainFilterOptions = [
  { value: "todos", label: "Todas" },
  { value: "mios", label: "Mis Inasistencias" },
];

const JustificationFilterOptions = [
  "Todas",
  "Justificadas",
  "Sin justificar",
  "Con permiso",
];

const Absences = () => {
  const [mainFilter, setMainFilter] = useState("todos");
  const [selectedJustify, setSelectedJustify] = useState("Todas");
  const [searchText, setSearchText] = useState("");
  const [viewJustify, setViewJustify] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [justificarInfo, setJustificarInfo] = useState(null);

  // 🔹 Estados del filtro de fecha
  const [dateFilterType, setDateFilterType] = useState("todas");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  const mainRef = useRef(null);
  const justifyRef = useRef(null);
  const dateRef = useRef(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  // 🔹 Leer y descifrar info del usuario
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
  const coordinatorId = userInfo?._id || null;

  const {
    absenceRecords,
    justificationMap,
    userId,
    fetchAbsenceRecords,
    fetchJustifications,
    saveAbsenceJustification,
  } = useDataAbsences();

  // 🔹 Abrir modal de justificación
  const handleOpenJustifyModal = (absence) => {
    setJustificarInfo(absence);
    setIsModalOpen(true);
  };

  // 🔹 Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setJustificarInfo(null);
  };

  // 🔹 Refrescar datos
  const refreshData = async () => {
    await fetchAbsenceRecords();
    await fetchJustifications();
  };

  // 🔸 Cargar datos al cambiar filtros
  useEffect(() => {
    const options = {};
    if (dateFilterType !== "todas") {
      options.filterType = dateFilterType;
      options.selectedDate =
        dateFilterType === "año"
          ? selectedYear
          : dateFilterType === "mes"
          ? selectedMonth
          : dateFilterType === "semana"
          ? selectedWeek
          : dateFilterType === "día"
          ? selectedDay
          : null;
    }
    fetchAbsenceRecords(options);
    fetchJustifications();
  }, [dateFilterType, selectedYear, selectedMonth, selectedWeek, selectedDay]);

  // 🔸 Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        (openDropdown === "main" &&
          mainRef.current &&
          !mainRef.current.contains(event.target)) ||
        (openDropdown === "justify" &&
          justifyRef.current &&
          !justifyRef.current.contains(event.target)) ||
        (openDropdown === "date" &&
          dateRef.current &&
          !dateRef.current.contains(event.target))
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const handleDropdown = (type) => {
    setOpenDropdown(openDropdown === type ? null : type);
  };

  // 🔹 Filtrado de inasistencias
  const filteredAbsences = (absenceRecords || [])
    .filter((absence) => {
      if (mainFilter === "mios") return absence.id_Employee === coordinatorId;
      return true;
    })
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

  // 🔹 Crear opciones de año (2000 - año actual)
  const yearOptions = Array.from(
    { length: new Date().getFullYear() - 1999 },
    (_, i) => 2000 + i
  );

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
          {/* Filtro principal */}
          <div className="dropdown" ref={mainRef}>
            <button
              className="filter-button"
              onClick={() => handleDropdown("main")}
            >
              {MainFilterOptions.find((f) => f.value === mainFilter)?.label}{" "}
              <ChevronDown size={16} />
            </button>
            {openDropdown === "main" && (
              <div className="dropdown-menu">
                {MainFilterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setMainFilter(opt.value);
                      setOpenDropdown(null);
                    }}
                    className={mainFilter === opt.value ? "selected" : ""}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtro de justificación */}
          <div className="dropdown" ref={justifyRef}>
            <button
              className="filter-button"
              onClick={() => handleDropdown("justify")}
            >
              {selectedJustify} <ChevronDown size={16} />
            </button>
            {openDropdown === "justify" && (
              <div className="dropdown-menu">
                {JustificationFilterOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSelectedJustify(option);
                      setOpenDropdown(null);
                    }}
                    className={selectedJustify === option ? "selected" : ""}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 🔹 Filtro de fecha */}
          <div
            className="dropdown date-filter-horizontal"
            ref={dateRef}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              position: "relative",
            }}
          >
            <button
              className="filter-button"
              onClick={() => handleDropdown("date")}
            >
              {dateFilterType.charAt(0).toUpperCase() + dateFilterType.slice(1)}{" "}
              <ChevronDown size={16} />
            </button>

            {openDropdown === "date" && (
              <div className="dropdown-menu">
                {["todas", "año", "mes", "día"].map((type) => (
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

            {/* Año con selector */}
            {dateFilterType === "año" && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="filter-input-right"
              >
                <option value="">Seleccionar año</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            )}

            {/* Selector nativo de mes */}
            {dateFilterType === "mes" && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="filter-input-right"
              />
            )}

            {/* Selector nativo de día */}
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

      {/* Lista de inasistencias */}
      <div className="absence-list-container">
        <div className="absence-list">
          {filteredAbsences.length === 0 ? (
            <p>No hay inasistencias para mostrar.</p>
          ) : (
            filteredAbsences.map((absence, index) => {
              const isOwnAbsence = absence.id_Employee === coordinatorId;
              const statusNormalized = (absence.status || "pendiente")
                .toLowerCase()
                .trim();
              const isPending =
                statusNormalized === "pendiente" ||
                statusNormalized === "sin justificar" ||
                !absence.status;

              const showJustifyButton = isOwnAbsence && isPending;

              return (
                <AbsenceCard
                  key={absence._id || index}
                  name={absence.employeeName}
                  employeeType={absence.employeeType}
                  avatar={absence.employeeAvatar}
                  date={absence.date}
                  status={absence.status || "pendiente"}
                  isJustified={statusNormalized === "justificada"}
                  justification={justificationMap?.[absence._id]}
                  showJustifyButton={showJustifyButton}
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

      {/* Modal de justificación */}
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

      {/* Modal de visualización */}
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
