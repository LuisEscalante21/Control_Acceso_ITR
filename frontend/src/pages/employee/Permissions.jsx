// src/pages/employee/Permissions.jsx
import React, { useEffect, useMemo, useState } from "react";
import NewPermissionModal from "../../components/employee/PageModals/NewPermissionModal";
import ViewPermissionModal from "../../components/employee/PageModals/ViewPermissionModal";
import useDataPermissions from "../../hooks/Global/useDataPermissions";
import "../../styles/employee/Permission.css";

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

export default function Permissions() {
  const {
    permissions,
    fetchPermissions,
    postPermissionMultipart,
    deletePermission,     // asegúrate que este llama a DELETE /api/permissions/:id
    showModal,
    setShowModal,
  } = useDataPermissions();

  const [filterStatus, setFilterStatus] = useState("Todos");
  const [searchDate, setSearchDate] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchPermissions(); }, []);

  const filteredPermissions = useMemo(() => {
    let list = permissions || [];
    if (searchDate) {
      list = list.filter((p) => (p.applicationDay || "").includes(searchDate));
    }
    if (filterStatus !== "Todos") {
      const wanted = {
        Urgente: "urgent",
        Rechazado: "rejected",
        Pendiente: "pending",
        Aprobado: "approved",
      }[filterStatus];
      list = list.filter((p) => (p.status || "").toLowerCase() === wanted);
    }
    return list;
  }, [permissions, filterStatus, searchDate]);

  const openView = (perm) => {
    setSelected(perm);
    setViewOpen(true);
  };
  const closeView = () => setViewOpen(false);

  const handleDeleted = async () => {
    await fetchPermissions();
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = async () => {
    setShowModal(false);
    await fetchPermissions();
  };

  return (
    <div className="permissions-page">
      <div className="permissions-header">
        <h2>Gestión de mis permisos</h2>
        <button onClick={handleOpenModal} className="btn-new-permission">
          Adjuntar un nuevo permiso
        </button>
      </div>

      <div className="filters">
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
                title="Ver detalles"
              >
                <div className="card-left">
                  <span className="permission-title">📄 Permiso {perm.applicationDay}</span>
                </div>
                <div className="card-right">
                  <span className={`status-label ${cls}`}>{label}</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <NewPermissionModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSaved={fetchPermissions}
        postPermissionMultipart={postPermissionMultipart}
      />

      <ViewPermissionModal
        isOpen={viewOpen}
        onClose={closeView}
        permission={selected}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
