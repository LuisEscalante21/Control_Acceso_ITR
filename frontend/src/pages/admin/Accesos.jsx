import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import Swal from "sweetalert2";
import axios from "axios";
import "../../styles/Admin/Accesos.css";
import useDataAccess from "../../hooks/admin/useDataAccess";
import useDataTeams from "../../hooks/admin/useDataTeams";
import AccessCard from "../../components/admin/Cards/AccessCard.jsx";
import ViewJustifyModal from "../../components/Tools/PageModals/ViewJustifyModal.jsx";

const HorarioOptions = ["Entrada", "Salida"];

const Accesos = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedDocente, setSelectedDocente] = useState("Todos");
  const [selectedSalida, setSelectedSalida] = useState(HorarioOptions[0]);
  const [searchText, setSearchText] = useState("");
  const [viewJustify, setViewJustify] = useState(null);

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

  // Cerrar dropdowns al hacer clic fuera
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

  // Botón para eliminar todos los accesos
  // Botón para eliminar todos los accesos y justificaciones
  const handleDeleteAllAccess = async () => {
    const { value: text } = await Swal.fire({
      title: "Eliminar todos los accesos y justificaciones",
      html: `Para confirmar, escribe <b>REMOVE</b> en el campo`,
      input: "text",
      inputPlaceholder: "Escribe REMOVE",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      customClass: {
        confirmButton: "swal-confirm-danger",
        cancelButton: "swal-cancel",
      },
      inputValidator: (value) => {
        if (value.toLowerCase() !== "remove") {
          return "Debes escribir 'remove' para confirmar";
        }
      },
    });

    if (text && text.toLowerCase() === "remove") {
      try {
        // 1️⃣ Eliminar todos los accesos
        const resAccess = await axios.delete(`${API_URL_ACCESS}/access`, {
          headers: {
            Authorization: `Bearer ${API_ACCESS_KEY}`,
          },
        });

        // 2️⃣ Eliminar todas las justificaciones
        const resJustifications = await axios.delete(`${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_PORT}/api/justifications`,
          {
            headers: {
              Authorization: `Bearer ${API_ACCESS_KEY}`,
            },
          }
        );

        Swal.fire(
          "Eliminado",
          `Se eliminaron ${resAccess.data.deleted_count} registros de acceso y ${resJustifications.data.deleted_count} justificaciones`,
          "success"
        );

        fetchAccessRecords(); // refrescar lista
        fetchJustifications(); // refrescar justificaciones
      } catch (error) {
        console.error(error);
        Swal.fire(
          "Error",
          "No se pudieron eliminar los registros de acceso y justificaciones.",
          "error"
        );
      }
    }
  };

  // Filtrar registros según tipo_registro, búsqueda y justificación
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

          {/* Botón eliminar todos los accesos */}
          <button className="delete-all-access" onClick={handleDeleteAllAccess}>
            Eliminar todos los accesos
          </button>
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
