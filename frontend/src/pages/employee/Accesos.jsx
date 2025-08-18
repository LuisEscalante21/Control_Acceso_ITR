import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import "../../styles/employee/Accesos.css";
import useDataAccess from "../../hooks/employee/useDataAccess";
import AccessCard from "../../components/employee/Cards/AccessCard.jsx";
import JustifyModal from "../../components/employee/PageModals/justifictions.jsx";

const HorarioOptions = ["Entrada", "Salida"];
const JustificationFilterOptions = ["Todos", "Justificados", "Pendientes"];

const Accesos = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedJustificationFilter, setSelectedJustificationFilter] = useState("Todos");
  const [selectedSalida, setSelectedSalida] = useState(HorarioOptions[0]);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [justificarInfo, setJustificarInfo] = useState(null);

  const justificationFilterRef = useRef(null);
  const salidasRef = useRef(null);

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

  // Extraemos datos y funciones del hook
  const {
    accessRecords,
    justificationMap = {},
    fetchAccessRecords,
    fetchJustifications,
  } = useDataAccess(empleadoId);

  // Refrescar registros y justificaciones
  const refreshAccessData = async () => {
    await fetchAccessRecords();
    await fetchJustifications();
  };

  useEffect(() => {
    refreshAccessData();
  }, [empleadoId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        (openDropdown === "justificationFilter" &&
          justificationFilterRef.current &&
          !justificationFilterRef.current.contains(event.target)) ||
        (openDropdown === "salidas" &&
          salidasRef.current &&
          !salidasRef.current.contains(event.target))
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

  const handleSelectJustificationFilter = (option) => {
    setSelectedJustificationFilter(option);
    setOpenDropdown(null);
  };

  const handleSelectSalida = (option) => {
    setSelectedSalida(option);
    setOpenDropdown(null);
  };

  const handleOpenJustifyModal = (person) => {
    setJustificarInfo(person);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setJustificarInfo(null);
  };

  // Filtrar accesos según usuario, tipo, estado justificación, y búsqueda
  const filteredAccess = (accessRecords || [])
    .filter((person) => person.id_Employee === empleadoId)
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
    // Filtro nuevo según justificación:
    .filter((person) => {
      const isJustified = !!justificationMap?.[person._id];
      if (selectedJustificationFilter === "Justificados") return isJustified;
      if (selectedJustificationFilter === "Pendientes") return !isJustified;
      return true; // "Todos"
    })
    .filter((person) => {
      if (!searchText.trim()) return true;
      const nombre = person.employeeName.toLowerCase();
      return nombre.includes(searchText.toLowerCase());
    });

  return (
    <div className="access-history-container">
      <div className="encabezado-accesos">
        <h1 className="titulo">Historial de accesos</h1>

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
          <div className="dropdown" ref={justificationFilterRef}>
            <button
              className="filter-button justification-filter"
              onClick={() => handleDropdown("justificationFilter")}
            >
              {selectedJustificationFilter} <ChevronDown size={16} />
            </button>
            {openDropdown === "justificationFilter" && (
              <div className="dropdown-menu justification-filter">
                {JustificationFilterOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectJustificationFilter(option)}
                    className={selectedJustificationFilter === option ? "selected" : ""}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

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
        </div>
      </div>

      <div className="access-list-container">
        <div className="access-list">
          {filteredAccess.length === 0 ? (
            <p>No hay registros de acceso para mostrar.</p>
          ) : (
            filteredAccess.map((person, index) => {
              const time =
                selectedSalida === "Entrada" ? person.entry_time : person.exit_time;

              if (!time) return null;

              const horaActual = new Date(time);
              const horaEsperada = new Date(time);
              horaEsperada.setHours(selectedSalida === "Entrada" ? 7 : 15);
              horaEsperada.setMinutes(30);
              horaEsperada.setSeconds(0);

              const isLateOrEarly =
                selectedSalida === "Entrada"
                  ? horaActual > horaEsperada
                  : horaActual < horaEsperada;

              return (
                <AccessCard
                  key={person._id || index}
                  name={person.employeeName}
                  avatar={person.employeeAvatar}
                  timeLabel={selectedSalida}
                  time={time}
                  tipoRegistro={person.tipo_registro}
                  docente={person.docente}
                  showJustifyButton={isLateOrEarly && !justificationMap?.[person._id]}
                  isJustified={!!justificationMap?.[person._id]}
                  onJustifyClick={() => handleOpenJustifyModal(person)}
                />
              );
            })
          )}
        </div>
      </div>

      {isModalOpen && (
        <JustifyModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          record={justificarInfo}
          currentUser={userInfo}
          refreshAccessRecords={refreshAccessData}
        />
      )}
    </div>
  );
};

export default Accesos;
