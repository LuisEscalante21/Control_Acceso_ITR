import React, { useState, useMemo, useEffect } from "react";
import "../../styles/Admin/Empleados.css";
import EmpleadoCard from "../../components/admin/Cards/DocenteCard.jsx";
import { Search, CirclePlus } from "lucide-react";
import ModalEmpleado from "../../components/admin/PageModals/EmpleadosModal/NewEmpleadosModal.jsx";
import EditEmpleadoModal from "../../components/admin/PageModals/EmpleadosModal/UpdateEmpleaods.jsx";
import useEmployees from "../../hooks/admin/useDataEmployee.jsx";

const Empleados = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewEmpleado, setShowNewEmpleado] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);

  const { employees, fetchEmployees, saveEmployee, deleteEmployee } = useEmployees();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmpleados = useMemo(() => {
    return employees.filter((empleado) => {
      const fullName = `${empleado.names} ${empleado.surnames}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, employees]);

  const handleSave = async (data, id) => {
    await saveEmployee(data, id);
    setSelectedEmpleado(null);
    fetchEmployees();
  };

  const handleDelete = async (id) => {
    await deleteEmployee(id);
    setSelectedEmpleado(null);
    fetchEmployees();
  };

  return (
    <>
      <div className="encabezado" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <h1 className="titulo">Gestión de Empleados</h1>
        <div className="busqueda-bar-G" style={{}}>
          <div className="buscador-G" style={{ }}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombres y apellidos"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{}}
            />
          </div>
          <button
            className="nuevo-empleado-btn-G"
            onClick={() => setShowNewEmpleado(true)}
            style={{ }}
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
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSelectedEmpleado(null)}
        />
      )}
    </>
  );
};

export default Empleados;
