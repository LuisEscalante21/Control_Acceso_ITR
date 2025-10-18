import React, { useState, useMemo, useEffect, useRef } from "react";
import "../../styles/Admin/Empleados.css";
import EmpleadoCard from "../../components/admin/Cards/DocenteCard.jsx";
import { Search, CirclePlus, ChevronDown } from "lucide-react";
import ModalEmpleado from "../../components/admin/PageModals/EmpleadosModal/NewEmpleadosModal.jsx";
import EditEmpleadoModal from "../../components/admin/PageModals/EmpleadosModal/UpdateEmpleaods.jsx";
import useEmployees from "../../hooks/admin/useDataEmployee.jsx";
import useDataTeams from "../../hooks/admin/useDataTeams.jsx"; 
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";

const Empleados = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewEmpleado, setShowNewEmpleado] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [selectedArea, setSelectedArea] = useState("Todas");
  const [openDropdown, setOpenDropdown] = useState(false);
  const areaRef = useRef(null);

  const { employees, fetchEmployees, saveEmployee, deleteEmployee } = useEmployees();
  const { teams, fetchTeams } = useDataTeams();

  // Traer empleados y equipos al cargar
  useEffect(() => {
    fetchEmployees();
    fetchTeams();
  }, []);

  // Obtener userInfo descifrado (si existe cookie cifrada)
  const secretKey = import.meta.env.VITE_JWT_SECRET;
  let userInfo = null;
  const encryptedUserInfo = Cookies.get("userInfo");
  if (encryptedUserInfo && secretKey) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedUserInfo, secretKey);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      userInfo = decryptedStr ? JSON.parse(decryptedStr) : null;
    } catch (err) {
      console.error("Error descifrando userInfo:", err);
      userInfo = null;
    }
  }

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (areaRef.current && !areaRef.current.contains(event.target)) {
        setOpenDropdown(false);
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

  // Obtener nombre del equipo por su ID
  const getTeamName = (teamId) => {
    const team = teams.find((t) => t._id === teamId);
    return team ? team.name : "Sin área";
  };

  // Filtrar empleados por nombre completo y área
  const filteredEmpleados = useMemo(() => {
    return employees.filter((empleado) => {
      const fullName = `${empleado.names} ${empleado.surnames}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase());
      
      // Filtrar por área
      if (selectedArea === "Todas") {
        return matchesSearch;
      } else if (selectedArea === "Sin área") {
        return matchesSearch && !empleado.IdTeam;
      } else {
        const teamName = empleado.IdTeam ? getTeamName(empleado.IdTeam._id) : "";
        return matchesSearch && teamName === selectedArea;
      }
    });
  }, [searchTerm, selectedArea, employees, teams]);

  // Manejar selección de área
  const handleSelectArea = (area) => {
    setSelectedArea(area);
    setOpenDropdown(false);
  };

  // Guardar o actualizar empleado
  const handleSave = async (data, id) => {
    await saveEmployee(data, id);
    setSelectedEmpleado(null);
    fetchEmployees();
  };

  // Eliminar empleado
  const handleDelete = async (id) => {
    await deleteEmployee(id);
    setSelectedEmpleado(null);
    fetchEmployees();
  };

  return (
    <>
      <div className="encabezado">
        <h1 className="titulo">Gestión de Empleados</h1>
        <div className="busqueda-bar">
          <div className="buscadora">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre o apellido"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            className="nuevo-empleado-btn-G"
            onClick={() => setShowNewEmpleado(true)}
          >
            <CirclePlus size={20} />
            Nuevo Empleado
          </button>

          {/* Filtro por área */}
          <div className="dropdown"  ref={areaRef}>
            <button
              className="filter-button docentes"
              style={{ maxWidth: "400px" }}
              onClick={() => setOpenDropdown(!openDropdown)}
            >
              {selectedArea} <ChevronDown size={16} />
            </button>
            {openDropdown && (
              <div className="dropdown-menu docentes">
                <button
                  onClick={() => handleSelectArea("Todas")}
                  className={selectedArea === "Todas" ? "selected" : ""}
                >
                  Todas
                </button>
                <button
                  onClick={() => handleSelectArea("Sin área")}
                  className={selectedArea === "Sin área" ? "selected" : ""}
                >
                  Sin área
                </button>
                {teams.map((team) => (
                  <button
                    key={team._id}
                    onClick={() => handleSelectArea(team.name)}
                    className={selectedArea === team.name ? "selected" : ""}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          
        </div>
      </div>

      <div className="gestion-de-empleados">
        <div className="empleados-lists">
          {filteredEmpleados.length > 0 ? (
            filteredEmpleados.map((empleado) => (
              <EmpleadoCard
                key={empleado._id}
                status={empleado.status}
                name={empleado.names}
                surnames={empleado.surnames}
                photo={empleado.photo}
                teamName={empleado.IdTeam ? getTeamName(empleado.IdTeam._id) : "Sin área"} 
                onClick={() => setSelectedEmpleado(empleado)}
              />
            ))
          ) : (
            <p style={{ padding: "20px", color: "#888" }}>No se encontraron empleados.</p>
          )}
        </div>
      </div>

      {showNewEmpleado && (
        <div
          className={`employee-modal-overlay ${showNewEmpleado ? "active" : ""}`}
          onClick={() => setShowNewEmpleado(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "none", boxShadow: "none", padding: 0 }}
          >
            <ModalEmpleado
              tipo="empleado"
              onSaved={() => {
                fetchEmployees();
                setShowNewEmpleado(false);
              }}
              onClose={() => setShowNewEmpleado(false)}
            />
          </div>
        </div>
      )}

      {selectedEmpleado && (
        <EditEmpleadoModal
          empleado={selectedEmpleado}
          teams={teams}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSelectedEmpleado(null)}
        />
      )}
    </>
  );
};

export default Empleados;