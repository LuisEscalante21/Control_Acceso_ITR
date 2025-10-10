import React, { useState, useMemo, useEffect } from "react";
import CryptoJS from "crypto-js";
import "../../styles/Admin/Empleados.css";
import EmpleadoCard from "../../components/coordinator/Cards/employeeCard.jsx";
import { Search, CirclePlus } from "lucide-react";
import ModalEmpleado from "../../components/coordinator/PageModals/NewEmpleadosModal.jsx";
import EditEmpleadoModal from "../../components/coordinator/PageModals/UpdateEmpleaods.jsx";
import useEmployees from "../../hooks/coordinators/useDataEmployee.jsx";

const JWT_SECRET = import.meta.env.VITE_JWT_SECRET;

const Empleados = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewEmpleado, setShowNewEmpleado] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [teamId, setTeamId] = useState(null);

  const {
    employeesByTeam,
    fetchEmployeesByTeam,
    saveEmployee,
    deleteEmployee,
  } = useEmployees();

  useEffect(() => {
    // Función para obtener cookie por nombre
    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(";").shift();
      return null;
    }

    const encryptedUserInfo = getCookie("userInfo");

    if (encryptedUserInfo) {
      try {
        // Desencriptar cookie usando crypto-js AES
        const bytes = CryptoJS.AES.decrypt(decodeURIComponent(encryptedUserInfo), JWT_SECRET);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedText) throw new Error("No se pudo desencriptar userInfo");

        const userInfo = JSON.parse(decryptedText);

        if (userInfo?.idTeam) {
          setTeamId(userInfo.idTeam);
          fetchEmployeesByTeam(userInfo.idTeam);
        }
      } catch (err) {
        console.error("Error al desencriptar o parsear userInfo cookie:", err);
      }
    }
  }, []);

  const filteredEmpleados = useMemo(() => {
    return employeesByTeam.filter((empleado) => {
      const fullName = `${empleado.names} ${empleado.surnames}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, employeesByTeam]);

  const handleSave = async (data, id) => {
    await saveEmployee(data, id);
    setSelectedEmpleado(null);
    if (teamId) fetchEmployeesByTeam(teamId);
  };

  const handleDelete = async (id) => {
    await deleteEmployee(id);
    setSelectedEmpleado(null);
    if (teamId) fetchEmployeesByTeam(teamId);
  };

  return (
    <>
      <div className="encabezado" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <h1 className="titulo">Gestión de Empleados</h1>
              <div className="busqueda-bar">
                <div className="buscadora" style={{ display: "flex", alignItems: "center", gap: "8px", flex: '0 1 70%' }}>
                  <Search className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o apellido"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="buscador-input-responsive"
                    style={{ flex: 1 }}
                  />
                </div>
                <button
                  className="nuevo-empleado-btn-G responsive-btn"
                  onClick={() => setShowNewEmpleado(true)}
                  style={{ whiteSpace: "nowrap" }}
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
            <p style={{ padding: "20px", color: "#888" }}>
              No se encontraron empleados.
            </p>
          )}
        </div>
      </div>

      {showNewEmpleado && (
        <div
          className={`employee-modal-overlay ${showNewEmpleado ? "active" : ""}`}
          onClick={() => setShowNewEmpleado(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-nuevo-empleado"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "none", boxShadow: "none", padding: 0 }}
          >
            <ModalEmpleado
              tipo="empleado"
              teamId={teamId}
              onSaved={() => {
                if (teamId) fetchEmployeesByTeam(teamId);
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
