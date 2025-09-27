// src/pages/coordinators/CoordinatorPermissions.jsx
import React, { useEffect, useMemo, useState } from "react";
import useDataPermissions from "../../hooks/Global/UseDataPermissions";
import useDataCredentials from "../../hooks/Global/useDataCredentials";
import NewPermissionModal from "../../components/coordinator/PageModals/NewPermissionModal";
import ViewPermissionModal from "../../components/coordinator/PageModals/ViewPermissionModal";
import "../../styles/coordinators/Permissions.css";

// Permiso urgente = incapacidad + pendiente
const isUrgent = (p) =>
  (p?.permissionType === "incapacity") &&
  ((p?.status || "").toLowerCase() === "pending");

const mapStatusForCard = (perm) => {
  if (isUrgent(perm)) return { label: "! URGENTE", cls: "urgente" };
  const s = (perm?.status || "").toLowerCase();
  switch (s) {
    case "rejected": return { label: "Rechazado", cls: "rechazado" };
    case "pending":  return { label: "Pendiente", cls: "pendiente" };
    case "approved": return { label: "Aprobado",  cls: "aprobado"  };
    default:         return { label: "Desconocido", cls: "" };
  }
};

export default function CoordinatorPermissions() {
  const {
    permissions,
    fetchPermissions,
    fetchTeamPermissions,
    postPermissionMultipart,
    deletePermission,
    updatePermissionStatus,
    showModal,
    setShowModal,
  } = useDataPermissions();

  const { user } = useDataCredentials();
  const currentUserId = user?._id ? String(user._id) : null;

  // 👇 Cambié el valor inicial a "team" para que siempre muestre primero los del área
  const [scope, setScope] = useState("team"); 
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [searchDate, setSearchDate] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (scope === "mine") fetchPermissions();
    else fetchTeamPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

const filteredPermissions = useMemo(() => {
  let list = permissions || [];

  if (searchDate) {
    const selectedDate = new Date(searchDate);

    list = list.filter((p) => {
      if (!p.applicationDay) return false;
      const permDate = new Date(p.applicationDay);
      return permDate <= selectedDate; // 👈 incluye el día elegido y días anteriores
    });
  }

  if (filterStatus !== "Todos") {
    if (filterStatus === "Urgente") {
      list = list.filter((p) => isUrgent(p));
    } else {
      const desired = {
        Rechazado: "rejected",
        Pendiente: "pending",
        Aprobado: "approved",
      }[filterStatus];
      list = list.filter(
        (p) => (p.status || "").toLowerCase() === desired && !isUrgent(p)
      );
    }
  }

  //Ordena: urgentes primero
  list = [...list].sort((a, b) => {
    if (isUrgent(a) && !isUrgent(b)) return -1;
    if (!isUrgent(a) && isUrgent(b)) return 1;
    return 0; 
  });

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
    <div className="cpg">
      <div className="cpg__container">
        <header className="cpg__header">
           <h1 className="titulo">Gestión de Empleados</h1>
        </header>

        <div className="cpg__newWrap">
          <button onClick={openNew} className="cpg__new">Nuevo permiso</button>
        </div>

        <section className="cpg__sheet">
          <div className="cpg__actions">
            <div className="cpg__filters">
              <div className="cpg__chip">
                <select value={scope} onChange={(e) => setScope(e.target.value)} className="cpg__select">
                  <option value="team">Permisos del área</option>
                  <option value="mine">Mis permisos</option>
                </select>
              </div>

              <div className="cpg__chip">
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="cpg__input"
                  aria-label="Buscar por fecha"
                />
              </div>

              <div className="cpg__chip">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="cpg__select"
                  aria-label="Estado"
                >
                  <option value="Todos">Todos</option>
                  <option value="Urgente">Urgente</option>
                  <option value="Rechazado">Rechazado</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobado">Aprobado</option>
                </select>
              </div>
            </div>
          </div>

          {/* LISTA */}
          {filteredPermissions.length === 0 ? (
            <div className="cpg__empty">No hay permisos para mostrar.</div>
          ) : (
            <div className="cpg__list">
              {filteredPermissions.map((perm) => {
                const { label, cls } = mapStatusForCard(perm);
                return (
                  <button
                    key={perm._id}
                    className={`cpg__row`}
                    onClick={() => openView(perm)}
                    title="Ver / Gestionar"
                  >
                    <div className="cpg__rowLeft">
                      <span className="cpg__dot" />
                      <span className="cpg__doc" aria-hidden>📄</span>
                      <span className="cpg__rowTitle">
                        {perm.employeeName || "Colaborador"} — {perm.applicationDay}
                      </span>
                    </div>
                    <div className="cpg__rowRight">
                      <span className={`cpg__badge ${cls}`}>{label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modales */}
      <NewPermissionModal
        isOpen={showModal}
        onClose={closeNew}
        onSaved={refresh}
        postPermissionMultipart={postPermissionMultipart}
      />

      <ViewPermissionModal
        isOpen={viewOpen}
        onClose={closeView}
        permission={selected}
        onChanged={refresh}
        deletePermission={deletePermission}
        updatePermissionStatus={updatePermissionStatus}
        currentUserId={currentUserId}
      />
    </div>
  );
}
