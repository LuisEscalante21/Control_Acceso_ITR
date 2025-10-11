import React, { useEffect, useMemo, useState } from "react";
import useDataPermissions from "../../hooks/Global/UseDataPermissions";
import AdminViewPermissionModal from "../../components/admin/PageModals/PermisionsModal/ViewPermissionModal";
import "../../styles/admin/Permission.css";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";

// 📌 Qué es urgente
const isUrgent = (p) =>
  p?.permissionType === "incapacity" &&
  (p?.status || "").toLowerCase() === "pending";

// 📌 Mapeo de estado con clase
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

export default function AdminPermissions() {
  const {
    permissions,
    fetchAllPermissions,
    updatePermissionStatus,
    deletePermission,
  } = useDataPermissions();

  const [filterStatus, setFilterStatus] = useState("Todos");
  const [searchDate, setSearchDate] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchAllPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

<<<<<<< HEAD
const filteredPermissions = useMemo(() => {
  let list = permissions || [];

  if (searchDate) {
    const selectedDate = new Date(searchDate);

    list = list.filter((p) => {
      if (!p.applicationDay) return false;
      const permDate = new Date(p.applicationDay);
      return permDate <= selectedDate; //incluye el día elegido y días anteriores
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
=======
  // 🔐 Obtener userInfo descifrado (si existe cookie cifrada)
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
>>>>>>> 65de1165dd33779e61b74b4cd5c16aefd7089764
    }
  }

  // 🧮 Filtrado igual que CoordinatorPermissions.jsx
  const filteredPermissions = useMemo(() => {
    let list = permissions || [];

    // 📅 Filtrar por fecha seleccionada y días anteriores
    if (searchDate) {
      const selectedDate = new Date(searchDate);
      list = list.filter((p) => {
        if (!p.applicationDay) return false;
        const permDate = new Date(p.applicationDay);
        return permDate <= selectedDate;
      });
    }

    // 🟡 Filtrar por estado
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

    // 🚨 Urgentes primero
    list = [...list].sort((a, b) => {
      if (isUrgent(a) && !isUrgent(b)) return -1;
      if (!isUrgent(a) && isUrgent(b)) return 1;
      return 0;
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
    await fetchAllPermissions();
  };

  return (
    <div className="apg__page">
      <div className="apg__container">
        <header className="apg__header">
          <h1 className="titulo">Gestión de Permisos - Administrador</h1>
        </header>

        <section className="apg__sheet">
          <div className="apg__actions">
            <div className="apg__filters">
              {/* 📅 Fecha */}
              <div className="apg__chip">
                <input
                  type="date"
                  value={searchDate}
                  max={new Date().toISOString().split("T")[0]} // ⛔ no permite fechas futuras
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="apg__input"
                  aria-label="Buscar por fecha"
                />
              </div>

              {/* 🟡 Estado */}
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

      {/* 🪟 Modal */}
      <AdminViewPermissionModal
        isOpen={viewOpen}
        onClose={closeView}
        permission={selected}
        onChanged={refresh}
        updatePermissionStatus={updatePermissionStatus}
        deletePermission={deletePermission}
      />
    </div>
  );
}
