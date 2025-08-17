import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import "../../styles/Admin/Accesos.css";
import useAccessControl from "../../hooks/admin/useDataAccess";
import AccessCard from "../../components/admin/Cards/AccessCard.jsx";

const HorarioOptions = ["Entrada", "Salida"];

const Accesos = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedDocente, setSelectedDocente] = useState("Todos");
  const [selectedSalida, setSelectedSalida] = useState(HorarioOptions[0]);
  const docentesRef = useRef(null);
  const salidasRef = useRef(null);

  const {
    accessRecords,
    fetchAccessRecords,
    fetchTeams, // si implementas filtrado por docente/equipo
    teams: docentesOptions,
  } = useAccessControl();

  useEffect(() => {
    fetchAccessRecords();
    fetchTeams && fetchTeams(); // si tienes equipos implementados
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

  const handleSelectDocente = (option) => {
    setSelectedDocente(option);
    setOpenDropdown(null);
  };

  const handleSelectSalida = (option) => {
    setSelectedSalida(option);
    setOpenDropdown(null);
  };

  // 👉 Filtrar registros según tipo_registro en lugar de entry_time/exit_time
  const filteredAccess = accessRecords.filter((person) => {
    // Filtrar por tipo_registro según filtro seleccionado
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
  });

  return (
    <div className="access-history-container">
      <div className="encabezado-accesos">
        <h1 className="titulo">Historial de accesos</h1>

        <div className="buscador">
          <Search className="search-icon" />
          <input type="text" placeholder="Buscar por nombre o apellido" />
        </div>

        <div className="filters">
          <div className="dropdown" ref={docentesRef}>
            <button
              className="filter-button docentes"
              onClick={() => handleDropdown("docentes")}
            >
              {selectedDocente} <ChevronDown size={16} />
            </button>
            {openDropdown === "docentes" && (
              <div className="dropdown-menu docentes">
                {["Todos", ...docentesOptions].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectDocente(option)}
                    className={selectedDocente === option ? "selected" : ""}
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
                selectedSalida === "Entrada"
                  ? person.entry_time
                  : person.exit_time;

              return (
                <AccessCard
                  key={index}
                  name={person.employeeName}
                  avatar={person.employeeAvatar}
                  timeLabel={selectedSalida}
                  time={time}
                  tipoRegistro={person.tipo_registro}
                  docente={person.docente}
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