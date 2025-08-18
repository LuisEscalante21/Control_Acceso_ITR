import React, { useEffect, useMemo, useState } from "react";
import useDataPermissions from "../../hooks/Global/useDataPermissions";
import NewPermissionModal from "../../components/coordinator/PageModals/NewPermissionModal"; // reusa el de empleado
import ViewPermissionModal from "../../components/coordinator/PageModals/ViewPermissionModal"; // este es el de coord

const mapStatus = (status) => {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "urgent":   return { label: "Urgente",   cls: "urgente" };
    case "rejected": return { label: "Rechazado", cls: "rechazado" };
    case "pending":  return { label: "Pendiente", cls: "pendiente" };
    case "approved": return { label: "Aprobado",  cls: "aprobado" };
    default:         return { label: "Desconocido", cls: "" };
  }
};

export default function CoordinatorPermissions() {
  const {
    permissions,
    fetchPermissions,        // mis permisos
    fetchTeamPermissions,    // permisos del área
    postPermissionMultipart, // crear (mismo modal de empleados)
    deletePermission,        // borrar si está pendiente
    updatePermissionStatus,  // aprobar/rechazar (+ descuento opcional)
    showModal,
    setShowModal,
  } = useDataPermissions();

  // Combobox #1: alcance
  const [scope, setScope] = useState("mine"); // "mine" | "team"
  // Filtros de la lista
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [searchDate, setSearchDate] = useState("");
  // Ver/Gestionar
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // Cargar cada vez que cambia el alcance
  useEffect(() => {
    if (scope === "mine") fetchPermissions();
    else fetchTeamPermissions();
  }, [scope]);

  const filteredPermissions = useMemo(() => {
    let list = permissions || [];
    if (searchDate) list = list.filter((p) => (p.applicationDay || "").includes(searchDate));
    if (filterStatus !== "Todos") {
      const desired = {
        Urgente: "urgent",
        Rechazado: "rejected",
        Pendiente: "pending",
        Aprobado: "approved",
      }[filterStatus];
      list = list.filter((p) => (p.status || "").toLowerCase() === desired);
    }
    return list;
  }, [permissions, filterStatus, searchDate]);

  const openNew = () => setShowModal(true);
  const closeNew = async () => {
    setShowModal(false);
    if (scope === "mine") await fetchPermissions();
    else await fetchTeamPermissions();
  };

  const openView = (perm) => { setSelected(perm); setViewOpen(true); };
  const closeView = () => { setSelected(null); setViewOpen(false); };

  const refresh = async () => {
    if (scope === "mine") await fetchPermissions();
    else await fetchTeamPermissions();
  };

  return (
    <div className="permissions-page">
      <div className="permissions-header">
        <h2>Permisos — Coordinador</h2>

        <div className="row" style={{ gap: 12 }}>
          {/* Combobox #1: Mis permisos / Permisos del área */}
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="mine">Mis permisos</option>
            <option value="team">Permisos del área</option>
          </select>

          {/* Filtros */}
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            placeholder="Buscar por fecha"
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="Todos">Todos</option>
            <option value="Urgente">Urgente</option>
            <option value="Rechazado">Rechazado</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Aprobado">Aprobado</option>
          </select>

          {/* Crear (reutiliza el mismo modal de empleado) */}
          <button onClick={openNew} className="btn-new-permission">
            Nuevo permiso
          </button>
        </div>
      </div>

      <div className="permissions-list">
        {filteredPermissions.length === 0 ? (
          <p>No hay permisos para mostrar.</p>
        ) : (
          filteredPermissions.map((perm) => {
            const { label, cls } = mapStatus(perm.status);
            return (
              <button
                key={perm._id}
                className={`permission-card ${cls}`}
                onClick={() => openView(perm)}
                title="Ver / Gestionar"
              >
                <div className="card-left">
                  <span className="permission-title">
                    📄 {perm.employeeName || "Colaborador"} — {perm.applicationDay}
                  </span>
                </div>
                <div className="card-right">
                  <span className={`status-label ${cls}`}>{label}</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Modal crear (mismo componente de empleado) */}
      <NewPermissionModal
        isOpen={showModal}
        onClose={closeNew}
        onSaved={refresh}
        postPermissionMultipart={postPermissionMultipart}
      />

      {/* Modal ver/gestionar (coordinador) */}
      <ViewPermissionModal
        isOpen={viewOpen}
        onClose={closeView}
        permission={selected}
        onChanged={refresh}
        deletePermission={deletePermission}
        updatePermissionStatus={updatePermissionStatus}
      />
    </div>
  );
}
