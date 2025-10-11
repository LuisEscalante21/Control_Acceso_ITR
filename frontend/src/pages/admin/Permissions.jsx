import React, { useEffect, useMemo, useState } from "react";
import useDataPermissions from "../../hooks/Global/UseDataPermissions";
import AdminViewPermissionModal from "../../components/admin/PageModals/PermisionsModal/ViewPermissionModal";
import "../../styles/admin/Permission.css";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";

// ✅ Qué es urgente
const isUrgent = (p) =>
  p?.permissionType === "incapacity" &&
  (p?.status || "").toLowerCase() === "pending";

// ✅ Mapeo de estado con clase para badge
const mapStatusForCard = (perm) => {
  if (isUrgent(perm)) return { label: "! Urgente", cls: "urgente" };
  const s = (perm?.status || "").toLowerCase();
  if (s === "approved") return { label: "Aprobado", cls: "aprobado" };
  if (s === "rejected") return { label: "Rechazado", cls: "rechazado" };
  return { label: "Pendiente", cls: "pendiente" };
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

  // 🧠 Obtener userInfo descifrado (si existe cookie cifrada)
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

  // 🧮 Filtrado + orden urgentes primero
  const filtered = useMemo(() => {
    let list = permissions || [];

    // 📅 Filtrar por fecha seleccionada y días anteriores
    if (searchDate) {
      const selectedDate = new Date(searchDate);
      list = list.filter((p) => {
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

    // 🚨 Urgentes al inicio de la lista
    list = [...list].sort((a, b) => {
      if (isUrgent(a) && !isUrgent(b)) return -1;
      if (!isUrgent(a) && isUrgent(b)) return 1;
      return 0;
    });

    return list;
  }, [permissions, filterStatus, searchDate]);

  // 📌 Abrir y cerrar modal
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
        {/* 🧾 Título */}
        <header className="apg__header">
          <h1 className="titulo">Gestión de Permisos - Administrador</h1>
        </header>

        <section className="apg__sheet">
          <div className="apg__actions">
            <div className="apg__filters">
              {/* 📅 Filtro de fecha */}
              <div className="apg__chip">
                <input
                  type="date"
                  value={searchDate}
                  max={new Date().toISOString().split("T")[0]} // ⛔ no permite fechas futuras
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="apg__input"
                />
              </div>

              {/* 🟡 Filtro por estado */}
              <div className="apg__chip">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="apg__select"
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
          {filtered.length === 0 ? (
            <div className="apg__empty">No hay permisos para mostrar.</div>
          ) : (
            <div className="apg__list">
              {filtered.map((perm) => {
                const { label, cls } = mapStatusForCard(perm);
                return (
                  <button
                    key={perm._id}
                    className="apg__row"
                    onClick={() => openView(perm)}
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
