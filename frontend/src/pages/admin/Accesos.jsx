import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import "../../styles/Admin/Accesos.css";
import useDataAccess from "../../hooks/admin/useDataAccess";
import useDataTeams from "../../hooks/admin/useDataTeams";
import AccessCard from "../../components/admin/Cards/AccessCard.jsx";
import ViewJustifyModal from "../../components/Tools/PageModals/ViewJustifyModal.jsx";

const HorarioOptions = ["Entrada", "Salida"];
const justifyOptions = ["Todas", "Justificadas", "Sin justificar"];

const Accesos = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedDocente, setSelectedDocente] = useState("Todos");
  const [selectedSalida, setSelectedSalida] = useState(HorarioOptions[0]);
  const [selectedJustify, setSelectedJustify] = useState(justifyOptions[0]);
  const [searchText, setSearchText] = useState("");
  const [viewJustify, setViewJustify] = useState(null);

  // 🔹 Estados del filtro de fecha (sin semana)
  const [dateFilterType, setDateFilterType] = useState("todas");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  const docentesRef = useRef(null);
  const salidasRef = useRef(null);
  const justifyRef = useRef(null);

  // Leer y descifrar info del usuario desde cookie cifrada con AES
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
    justificationMap,
    fetchAccessRecords,
    fetchJustifications,
  } = useDataAccess(empleadoId);
  const { teams: areaOptions, fetchTeams } = useDataTeams();

  const API_URL_ACCESS = `${import.meta.env.VITE_BASE_URL}${
    import.meta.env.VITE_PORT_ACCESS
  }/api`;
  const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;

  // Inicializar datos
  useEffect(() => {
    fetchAccessRecords();
    fetchJustifications();
    fetchTeams();
  }, []);

  // 🔸 Recargar accesos cuando cambian los filtros de fecha
  useEffect(() => {
    if (dateFilterType !== "todas") {
      let selectedDate = "";

      if (dateFilterType === "año") selectedDate = selectedYear;
      if (dateFilterType === "mes") selectedDate = selectedMonth;
      if (dateFilterType === "día") selectedDate = selectedDay;

      if (selectedDate) {
        fetchAccessRecords({
          filterType: dateFilterType,
          selectedDate,
        });
      }
    } else {
      fetchAccessRecords();
    }
  }, [dateFilterType, selectedYear, selectedMonth, selectedDay]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        (openDropdown === "docentes" &&
          docentesRef.current &&
          !docentesRef.current.contains(event.target)) ||
        (openDropdown === "salidas" &&
          salidasRef.current &&
          !salidasRef.current.contains(event.target)) ||
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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  const handleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleSelectDocente = async (option) => {
    setSelectedDocente(option);
    setOpenDropdown(null);

    if (option === "Todos") {
      await fetchAccessRecords();
    } else if (option === "Mis registros") {
      await fetchAccessRecords({ onlyMine: true });
    } else {
      const team = areaOptions.find((t) => t.name === option);
      if (team) {
        await fetchAccessRecords({ teamId: team._id });
      }
    }
  };

  const handleSelectSalida = (option) => {
    setSelectedSalida(option);
    setOpenDropdown(null);
  };

  const handleSelectJustify = (option) => {
    setSelectedJustify(option);
    setOpenDropdown(null);
  };

  // 🔹 Filtrado de justificación, búsqueda y tipo de registro
  const filteredAccess = accessRecords
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
      const status = person.status?.toLowerCase() || "";
      if (selectedJustify === "Justificadas") return status === "justificada";
      if (selectedJustify === "Sin justificar")
        return status === "pendiente" || status === "";
      return true;
    })
    .filter((person) => {
      if (!searchText.trim()) return true;
      const nombre = person.employeeName?.toLowerCase() || "";
      return nombre.includes(searchText.toLowerCase());
    });

  return (
    <div className="access-history-container">
      <div className="encabezado-accesos">
        <h1 className="titulo">Historial de accesos</h1>

        <div className="buscadora">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o apellido"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="filters">
          {/* Filtro de docente/área */}
          <div className="dropdown"  ref={docentesRef}>
            <button
              className="filter-button docentes" style={{maxWidth:"200px"}}
              onClick={() => handleDropdown("docentes")}
            >
              {selectedDocente} <ChevronDown size={16} />
            </button>
            {openDropdown === "docentes" && (
              <div className="dropdown-menu docentes">
                <button
                  onClick={() => handleSelectDocente("Todos")}
                  className={selectedDocente === "Todos" ? "selected" : ""}
                >
                  Todos
                </button>
                <button
                  onClick={() => handleSelectDocente("Mis registros")}
                  className={
                    selectedDocente === "Mis registros" ? "selected" : ""
                  }
                >
                  Mis accesos
                </button>
                {areaOptions.map((area) => (
                  <button
                    key={area._id}
                    onClick={() => handleSelectDocente(area.name)}
                    className={selectedDocente === area.name ? "selected" : ""}
                  >
                    {area.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtro de tipo de horario */}
          <div className="dropdown" ref={salidasRef}>
            <button
              className="filter-button salidas"
              onClick={() => handleDropdown("salidas")}
            >
              {selectedSalida} <ChevronDown size={16} />
            </button>
            {openDropdown === "salidas" && (
              <div className="dropdown-menu salidas">
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

          {/* 🔹 Filtro de fecha (sin semana) */}
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

      {/* Lista de accesos */}
      <div className="access-list-container">
        <div className="access-list">
          {filteredAccess.length === 0 ? (
            <p>No hay registros de acceso para mostrar.</p>
          ) : (
            filteredAccess.map((person, index) => {
              const time =
                selectedSalida === "Entrada"
                  ? person.entry_time
                  : person.exit_time;

              if (!time) return null;

              return (
                <AccessCard
                  key={person._id || index}
                  name={person.employeeName}
                  employeeType={person.employeeType}
                  avatar={person.employeeAvatar}
                  timeLabel={selectedSalida}
                  time={time}
                  tipoRegistro={person.tipo_registro}
                  isJustified={!!justificationMap?.[person._id]}
                  justification={justificationMap?.[person._id]}
                  onViewJustification={() =>
                    setViewJustify(justificationMap?.[person._id])
                  }
                />
              );
            })
          )}
        </div>
      </div>

      {/* Modal de justificación */}
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

export default Accesos;
