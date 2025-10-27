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

  // 🔹 Estado para el filtro de área
  const [selectedArea, setSelectedArea] = useState("Todas");
  const [openDropdown, setOpenDropdown] = useState(false);
  const areaRef = useRef(null);

  const { employees, fetchEmployees, saveEmployee, deleteEmployee } =
    useEmployees();
  const { teams, fetchTeams } = useDataTeams();

  // Traer empleados y equipos al cargar
  useEffect(() => {
    fetchEmployees();
    fetchTeams();
  }, []);

  // 🔹 Cerrar dropdown al hacer clic fuera
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

  // 🔹 Manejar cambio de filtro de área
  const handleSelectArea = async (option) => {
    setSelectedArea(option);
    setOpenDropdown(false);

    if (option === "Todas") {
      await fetchEmployees();
    } else {
      const team = teams.find((t) => t.name === option);
      if (team) {
        await fetchEmployees({ teamId: team._id });
      }
    }
  };

  // Filtrar empleados por nombre completo (búsqueda local)
  const filteredEmpleados = useMemo(() => {
    return employees.filter((empleado) => {
      const fullName = `${empleado.names} ${empleado.surnames}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, employees]);

  // Obtener nombre del equipo por su ID
  const getTeamName = (teamId) => {
    const team = teams.find((t) => t._id === teamId);
    return team ? team.name : "Sin área";
  };

  // Guardar o actualizar empleado
  const handleSave = async (data, id) => {
    await saveEmployee(data, id);
    setSelectedEmpleado(null);

    // 🔹 Recargar con el filtro actual
    if (selectedArea !== "Todas") {
      const team = teams.find((t) => t.name === selectedArea);
      if (team) {
        fetchEmployees({ teamId: team._id });
      }
    } else {
      fetchEmployees();
    }
  };

  // Eliminar empleado
  const handleDelete = async (id) => {
    await deleteEmployee(id);
    setSelectedEmpleado(null);

    // 🔹 Recargar con el filtro actual
    if (selectedArea !== "Todas") {
      const team = teams.find((t) => t.name === selectedArea);
      if (team) {
        fetchEmployees({ teamId: team._id });
      }
    } else {
      fetchEmployees();
    }
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

          {/* 🔹 Filtro de área */}
          <div
            className="dropdown"
            ref={areaRef}
            style={{ position: "relative" }}
          >
            <button
              className="filter-button"
              style={{
                minWidth: "320px",
                padding: "10px 16px",
                background: "#f4f4f4",
                border: "1px solid #ddd",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                fontSize: "14px",
                whiteSpace: "nowrap",
              }}
              onClick={() => setOpenDropdown(!openDropdown)}
            >
              {selectedArea} <ChevronDown size={16} />
            </button>

            {openDropdown && (
              <div
                className="dropdown-menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 5px)",
                  left: 0,
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  minWidth: "280px",
                  maxHeight: "300px",
                  overflowY: "auto",
                  zIndex: 1000,
                }}
              >
                <button
                  onClick={() => handleSelectArea("Todas")}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "none",
                    background:
                      selectedArea === "Todas" ? "#e8f4ff" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "14px",
                  }}
                >
                  Todas las áreas
                </button>

                {teams.map((area) => (
                  <button
                    key={area._id}
                    onClick={() => handleSelectArea(area.name)}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      border: "none",
                      background:
                        selectedArea === area.name ? "#e8f4ff" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "14px",
                    }}
                  >
                    {area.name}
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
                teamName={
                  empleado.IdTeam
                    ? getTeamName(empleado.IdTeam._id)
                    : "Sin área"
                }
                onClick={() => setSelectedEmpleado(empleado)}
              />
            ))
          ) : (
            <p style={{ padding: "20px", color: "#888" }}>
              {selectedArea !== "Todas"
                ? `No se encontraron empleados en el área: ${selectedArea}`
                : "No se encontraron empleados."}
            </p>
          )}
        </div>
      </div>

      {showNewEmpleado && (
        <div
          className={`employee-modal-overlay ${
            showNewEmpleado ? "active" : ""
          }`}
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
                // 🔹 Recargar con el filtro actual
                if (selectedArea !== "Todas") {
                  const team = teams.find((t) => t.name === selectedArea);
                  if (team) {
                    fetchEmployees({ teamId: team._id });
                  }
                } else {
                  fetchEmployees();
                }
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
