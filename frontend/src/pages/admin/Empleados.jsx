import React, { useState, useMemo, useEffect } from "react";
import "../../styles/Admin/Empleados.css";
import EmpleadoCard from "../../components/admin/Cards/DocenteCard.jsx";
import { Search, CirclePlus } from "lucide-react";
import ModalEmpleado from "../../components/admin/PageModals/EmpleadosModal/NewEmpleadosModal.jsx";
import EditEmpleadoModal from "../../components/admin/PageModals/EmpleadosModal/UpdateEmpleaods.jsx";
import useEmployees from "../../hooks/admin/useDataEmployee.jsx";
import useDataTeams from "../../hooks/admin/useDataTeams.jsx"; 

const Empleados = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewEmpleado, setShowNewEmpleado] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);

  const { employees, fetchEmployees, saveEmployee, deleteEmployee } = useEmployees();
  const { teams, fetchTeams } = useDataTeams(); // <-- Hook de equipos

  // Traer empleados y equipos al cargar
  useEffect(() => {
    fetchEmployees();
    fetchTeams();
  }, []);

  // Filtrar empleados por nombre completo
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
      <div className="encabezado" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <h1 className="titulo">Gestión de Empleados</h1>
        <div className="busqueda-bar-G">
          <div className="buscador-G">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombres y apellidos"
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
                teamName={empleado.IdTeam ? getTeamName(empleado.IdTeam._id) : "Sin área"} // <-- Aquí se pasa el nombre del área
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
