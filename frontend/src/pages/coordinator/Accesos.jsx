import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import "../../styles/coordinators/Accesos.css";
import useDataAccess from "../../hooks/coordinators/useDataAccess.jsx";
import AccessCard from "../../components/coordinator/Cards/AccessCard.jsx";
import ViewJustifyModal from "../../components/Tools/PageModals/ViewJustifyModal.jsx";
import JustifyModal from "../../components/employee/PageModals/justifictions.jsx";

// Opciones de filtros
const HorarioOptions = ["Entrada", "Salida"];
const JustificationFilterOptions = ["Todos", "Justificados", "Pendientes"];
const MainFilterOptions = [
  { value: "todos", label: "Todos" },
  { value: "mios", label: "Mis Accesos" },
];

const Accesos = () => {
  // Dropdowns
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mainFilter, setMainFilter] = useState("todos");
  const [selectedJustificationFilter, setSelectedJustificationFilter] =
    useState("Todos");
  const [selectedSalida, setSelectedSalida] = useState(HorarioOptions[0]);
  const [searchText, setSearchText] = useState("");

  // Modales
  const [viewJustify, setViewJustify] = useState(null);
  const [isJustifyModalOpen, setIsJustifyModalOpen] = useState(false);
  const [justificarInfo, setJustificarInfo] = useState(null);

  // Filtro fecha
  const [dateFilterType, setDateFilterType] = useState("todas");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  // Refs dropdown
  const mainFilterRef = useRef(null);
  const justificationFilterRef = useRef(null);
  const salidasRef = useRef(null);
  const dateRef = useRef(null);

  // Leer cookie y descifrar info usuario
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
    accessRecords,
    justificationMap = {},
    fetchAccessRecords,
    fetchJustifications,
    saveJustification,
    userTeamId,
  } = useDataAccess(empleadoId);

  // Inicializar datos
  useEffect(() => {
    fetchAccessRecords();
    fetchJustifications();
  }, []);

  const refreshAccessData = async () => {
    await fetchAccessRecords();
    await fetchJustifications();
  };

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        (openDropdown === "mainFilter" &&
          mainFilterRef.current &&
          !mainFilterRef.current.contains(event.target)) ||
        (openDropdown === "justificationFilter" &&
          justificationFilterRef.current &&
          !justificationFilterRef.current.contains(event.target)) ||
        (openDropdown === "salidas" &&
          salidasRef.current &&
          !salidasRef.current.contains(event.target)) ||
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

  // Dropdowns
  const handleDropdown = (dropdown) =>
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);

  const handleSelectMainFilter = (value) => {
    setMainFilter(value);
    setOpenDropdown(null);
  };

  const handleSelectJustificationFilter = (option) => {
    setSelectedJustificationFilter(option);
    setOpenDropdown(null);
  };

  const handleSelectSalida = (option) => {
    setSelectedSalida(option);
    setOpenDropdown(null);
  };

  // Modal de justificar
  const handleOpenJustifyModal = (record) => {
    setJustificarInfo(record);
    setIsJustifyModalOpen(true);
  };
  const handleCloseJustifyModal = () => {
    setJustificarInfo(null);
    setIsJustifyModalOpen(false);
  };

  // Filtrado de accesos
  const filteredAccess = (accessRecords || [])
    .filter((person) => {
      if (mainFilter === "mios") return person.id_Employee === empleadoId;
      return true;
    })
    .filter((person) => {
      if (selectedSalida === "Entrada") {
        return (
          person.tipo_registro === "entrada" ||
          person.tipo_registro === "entrada y salida"
        );
      } else {
        return (
          person.tipo_registro === "salida" ||
          person.tipo_registro === "entrada y salida"
        );
      }
    })
    .filter((person) => {
      const isJustified = !!justificationMap?.[person._id];
      if (selectedJustificationFilter === "Justificados") return isJustified;
      if (selectedJustificationFilter === "Pendientes") return !isJustified;
      return true;
    })
    .filter((person) => {
      if (!searchText.trim()) return true;
      return person.employeeName
        ?.toLowerCase()
        .includes(searchText.toLowerCase());
    })
    .filter((person) => {
      if (dateFilterType === "todas") return true;
      const recordDate = new Date(person.date);
      if (dateFilterType === "año")
        return recordDate.getFullYear() === +selectedYear;
      if (dateFilterType === "mes")
        return (
          recordDate.getFullYear() === +selectedYear &&
          recordDate.getMonth() + 1 === +selectedMonth
        );
      if (dateFilterType === "día")
        return recordDate.toISOString().split("T")[0] === selectedDay;
      return true;
    });

  // Opciones año y mes
  const yearOptions = Array.from(
    { length: new Date().getFullYear() - 1999 },
    (_, i) => 2000 + i
  );
  const monthOptions = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return (
    <div className="access-history-container">
      <div className="encabezado-accesos">
        <h1 className="titulo">Historial de accesos</h1>

        {/* Buscador */}
        <div className="buscadora">
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
          {/* Filtro principal */}
          <div className="dropdown" ref={mainFilterRef}>
            <button
              className="filter-button"
              onClick={() => handleDropdown("mainFilter")}
            >
              {mainFilter === "todos" ? "Todos" : "Mis Accesos"}{" "}
              <ChevronDown size={16} />
            </button>
            {openDropdown === "mainFilter" && (
              <div className="dropdown-menu">
                {MainFilterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelectMainFilter(opt.value)}
                    className={mainFilter === opt.value ? "selected" : ""}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtro salida */}
          <div className="dropdown" ref={salidasRef}>
            <button
              className="filter-button"
              onClick={() => handleDropdown("salidas")}
            >
              {selectedSalida} <ChevronDown size={16} />
            </button>
            {openDropdown === "salidas" && (
              <div className="dropdown-menu">
                {HorarioOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectSalida(option)}
                    className={selectedSalida === option ? "selected" : ""}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtro justificación */}
          <div className="dropdown" ref={justificationFilterRef}>
            <button
              className="filter-button"
              onClick={() => handleDropdown("justificationFilter")}
            >
              {selectedJustificationFilter} <ChevronDown size={16} />
            </button>
            {openDropdown === "justificationFilter" && (
              <div className="dropdown-menu">
                {JustificationFilterOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectJustificationFilter(option)}
                    className={
                      selectedJustificationFilter === option ? "selected" : ""
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtro fecha */}
          <div className="dropdown" ref={dateRef}>
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

            {dateFilterType === "año" && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">Año</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}

            {dateFilterType === "mes" && (
              <>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">Año</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">Mes</option>
                  {monthOptions.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </>
            )}

            {dateFilterType === "día" && (
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Lista de accesos */}
      <div className="access-list-container">
        <div className="access-list">
          {filteredAccess.length === 0 ? (
            <p>No hay registros de acceso para mostrar.</p>
          ) : (
            filteredAccess.map((person, idx) => {
              const time =
                selectedSalida === "Entrada"
                  ? person.entry_time
                  : person.exit_time;
              if (!time) return null;

              return (
                <AccessCard
                  key={person._id || idx}
                  name={person.employeeName}
                  avatar={person.employeeAvatar}
                  timeLabel={selectedSalida}
                  time={time}
                  tipoRegistro={person.tipo_registro}
                  docente={person.docente}
                  isJustified={!!justificationMap?.[person._id]}
                  justification={justificationMap?.[person._id]}
                  onViewJustification={() =>
                    setViewJustify(justificationMap?.[person._id])
                  }
                  showJustifyButton={
                    person.id_Employee === empleadoId &&
                    !justificationMap?.[person._id]
                  }
                  onJustifyClick={() => handleOpenJustifyModal(person)}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Modal de visualización */}
      {viewJustify && (
        <ViewJustifyModal
          isOpen={!!viewJustify}
          onClose={() => setViewJustify(null)}
          justification={viewJustify}
        />
      )}

      {/* Modal de justificación */}
      {isJustifyModalOpen && justificarInfo && (
        <JustifyModal
          isOpen={isJustifyModalOpen}
          onClose={handleCloseJustifyModal}
          record={justificarInfo}
          currentUser={{
            name: userInfo
              ? `${userInfo.names} ${userInfo.surnames}`
              : "Coordinador",
            photo: userInfo?.photo || null,
            id: empleadoId,
            idTeam: userTeamId,
          }}
          refreshAccessRecords={refreshAccessData}
          onSave={saveJustification}
          isAbsence={false}
        />
      )}
    </div>
  );
};

export default Accesos;
