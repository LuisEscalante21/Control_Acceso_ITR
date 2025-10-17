import React, { useEffect, useMemo, useState } from "react";
import useDataPermissions from "../../hooks/Global/UseDataPermissions";
import ViewPermissionModal from "../../components/coordinator/PageModals/ViewPermissionModal";
import NewPermissionModal from "../../components/coordinator/PageModals/NewPermissionModal";
import "../../styles/admin/Permission.css";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";

// 🟥 Identificar si un permiso es urgente
const isUrgent = (p) =>
  p?.permissionType === "incapacity" &&
  (p?.status || "").toLowerCase() === "pending";

// 🟡 Mapear estado a texto y clase visual
const mapStatusForCard = (perm) => {
  if (isUrgent(perm)) return { label: "! URGENTE", cls: "urgente" };
  const s = (perm?.status || "").toLowerCase();
  switch (s) {
    case "rejected":
      return { label: "Rechazado", cls: "rechazado" };
    case "pending":
      return { label: "Pendiente", cls: "pendiente" };
    case "approved":
      return { label: "Aprobado", cls: "aprobado" };
    default:
      return { label: "Desconocido", cls: "" };
  }
};

export default function CoordinatorPermissions() {
 const {
  permissions,
  fetchPermissions,
  fetchTeamPermissions,
  postPermissionMultipart,
  updatePermissionStatus,
  deletePermission,
  showModal,
  setShowModal,
} = useDataPermissions(false); 


  const [filterStatus, setFilterStatus] = useState("Todos");
  const [searchDate, setSearchDate] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [permissionScope, setPermissionScope] = useState("area"); // area | mine

  // 🧠 Obtener datos del usuario desde cookie cifrada
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

  // 📡 Al cargar, mostrar permisos del área por defecto
  useEffect(() => {
    fetchTeamPermissions();
  }, [fetchTeamPermissions]);

  // 🧮 Filtrar permisos
  const filteredPermissions = useMemo(() => {
  let list = permissions || [];

  // 📅 Filtro por fecha
  if (searchDate) {
    const selectedDate = new Date(searchDate);
    list = list.filter((p) => {
      if (!p.applicationDay) return false;
      const permDate = new Date(p.applicationDay);
      return permDate <= selectedDate;
    });
  }

  // 🟡 Filtro por estado
  if (filterStatus !== "Todos") {
    if (filterStatus === "Urgente") {
      list = list.filter(isUrgent);
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

  // 🚦 Orden personalizado: Urgente > Pendiente > Aprobado > Rechazado
  const statusOrder = {
    urgent: 0,
    pending: 1,
    approved: 2,
    rejected: 3,
    other: 4,
  };

  list = [...list].sort((a, b) => {
    const getOrder = (p) => {
      if (isUrgent(p)) return statusOrder.urgent;
      const status = (p.status || "").toLowerCase();
      return statusOrder[status] ?? statusOrder.other;
    };

    return getOrder(a) - getOrder(b);
  });

  return list;
}, [permissions, filterStatus, searchDate]);


  // 📌 Modal handlers
  const openView = (p) => {
    setSelected(p);
    setViewOpen(true);
  };

  const closeView = () => {
    setSelected(null);
    setViewOpen(false);
  };

  const refresh = async () => {
    if (permissionScope === "mine") {
      await fetchPermissions();
    } else {
      await fetchTeamPermissions();
    }
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = async () => {
    setShowModal(false);
    await refresh();
  };

  // 🧭 Cambiar entre "mis permisos" o "permisos del área"
  const handleScopeChange = async (e) => {
    const value = e.target.value;
    setPermissionScope(value);
    if (value === "mine") {
      await fetchPermissions(); // /api/permissions/mine
    } else {
      await fetchTeamPermissions(); // /api/permissions/team
    }
  };

  return (
    <div className="apg__page">
      <div className="apg__container">
        <header className="apg__header">
          <h1 className="titulo">Gestión de permisos</h1>
        </header>

        {/* 📎 Controles superiores */}
        <div className="pgp__new1">
          <button onClick={handleOpenModal} className="pgp__new">
            <span className="plus-icon"></span> Nuevo permiso
          </button>

          {/* 🔽 Dropdown con estilo igual al filtro */}
          
        </div>

        <section className="apg__sheet">
          <div className="apg__actions">
            <div className="apg__filters">
              {/* 📅 Filtro por fecha */}
              <div className="apg__chip">
                <input
                  type="date"
                  value={searchDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="apg__input"
                  aria-label="Buscar por fecha"
                />
              </div>

              {/* 🟡 Filtro por estado */}
              <div className="apg__chip">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="apg__select"
                  aria-label="Estado"
                >
                  <option value="Todos">Todos</option>
                  <option value="Urgente">Urgente</option>
                  <option value="Rechazado">Rechazado</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobado">Aprobado</option>
                </select>
              </div>

              <div className="pgp__chip">
            <select
              value={permissionScope}
              onChange={handleScopeChange}
              className="apg__select"
              aria-label="Filtro de tipo de permisos"
            >
              <option value="area">Permisos del área</option>
              <option value="mine">Mis permisos</option>
            </select>
          </div>
            </div>
          </div>

          {/* 📜 Lista de permisos */}
          {filteredPermissions.length === 0 ? (
            <div className="apg__empty">No hay permisos para mostrar.</div>
          ) : (
            <div className="apg__list">
              {filteredPermissions.map((perm) => {
                const { label, cls } = mapStatusForCard(perm);
                return (
                  <button
                    key={perm._id}
                    className="apg__row"
                    onClick={() => openView(perm)}
                    title="Ver / Gestionar"
                  >
                    <div className="apg__rowLeft">
                      <span className="apg__dot" />
                      <span className="apg__doc" aria-hidden>
                        📄
                      </span>
                      <span className="apg__rowTitle">
                        {perm.employeeName || "Colaborador"} —{" "}
                        {perm.applicationDay}
                      </span>
                    </div>
                    <div className="apg__rowRight">
                      <span className={`apg__badge ${cls}`}>{label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* 🪟 Modal para crear nuevo permiso */}
      <NewPermissionModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSaved={refresh}
        postPermissionMultipart={postPermissionMultipart}
      />

      {/* 🪟 Modal para ver y gestionar permiso */}
      <ViewPermissionModal
        isOpen={viewOpen}
        onClose={closeView}
        permission={selected}
        onChanged={refresh}
        updatePermissionStatus={updatePermissionStatus}
        deletePermission={deletePermission}
        currentUserId={userInfo?._id}
      />
    </div>
  );
}
