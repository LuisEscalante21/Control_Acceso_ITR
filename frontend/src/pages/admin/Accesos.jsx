import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import "../../styles/Admin/Accesos.css";
import useDataAccess from "../../hooks/admin/useDataAccess";
import useDataTeams from "../../hooks/admin/useDataTeams";
import AccessCard from "../../components/admin/Cards/AccessCard.jsx";

const HorarioOptions = ["Entrada", "Salida"];

const Accesos = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedDocente, setSelectedDocente] = useState("Todos");
  const [selectedSalida, setSelectedSalida] = useState(HorarioOptions[0]);
  const [searchText, setSearchText] = useState("");
  const docentesRef = useRef(null);
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

  // Hook para accesos
  const { accessRecords, fetchAccessRecords } = useDataAccess(empleadoId);

  // Hook para áreas/equipos
  const { teams: areaOptions, fetchTeams } = useDataTeams();

  useEffect(() => {
    fetchAccessRecords();
    fetchTeams();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        (openDropdown === "docentes" &&
          docentesRef.current &&
          !docentesRef.current.contains(event.target)) ||
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

  const handleSelectDocente = async (option) => {
    setSelectedDocente(option);
    setOpenDropdown(null);

    if (option === "Todos") {
      await fetchAccessRecords();
    } else if (option === "Mis registros") {
      await fetchAccessRecords({ onlyMine: true });
    } else {
      // cuando selecciona un área
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

  // Filtrar registros según tipo_registro y búsqueda
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
      if (!searchText.trim()) return true;
      const nombre = person.employeeName?.toLowerCase() || "";
      return nombre.includes(searchText.toLowerCase());
    });

  // LOG para depuración
  console.log("Áreas disponibles:", areaOptions);

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
          {/* Filtro de docente/área */}
          <div className="dropdown" ref={docentesRef}>
            <button
              className="filter-button docentes"
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

              return (
                <AccessCard
                  name={person.employeeName}
                  avatar={person.employeeAvatar}
                  timeLabel={selectedSalida}
                  time={time}
                  tipoRegistro={person.tipo_registro}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Accesos;
