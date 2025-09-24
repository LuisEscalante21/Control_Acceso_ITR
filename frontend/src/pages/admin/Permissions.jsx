import React, { useEffect, useMemo, useState } from "react";
import useDataPermissions from "../../hooks/Global/UseDataPermissions";
import AdminViewPermissionModal from "../../components/admin/PageModals/PermisionsModal/ViewPermissionModal";
import "../../styles/admin/Permission.css";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import UserFaceCardSimple from "../../components/Perfil/UserFaceCardSimple.jsx";

//Qué es urgente
const isUrgent = (p) =>
  p?.permissionType === "incapacity" &&
  (p?.status || "").toLowerCase() === "pending";

// Mapeo de estado con clase
const mapStatusForCard = (perm) => {
  if (isUrgent(perm)) return { label: "🚨 Urgente", cls: "urgente" };
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
    confirmAndClearAllPermissions,
  } = useDataPermissions();

  const [filterStatus, setFilterStatus] = useState("Todos");
  const [searchDate, setSearchDate] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchAllPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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


  //Filtrado + orden urgentes primero
  const filtered = useMemo(() => {
    let list = permissions || [];

    if (searchDate) {
      list = list.filter((p) => (p.applicationDay || "").includes(searchDate));
    }

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

    //Urgentes al inicio (como prioridad)
    list = [...list].sort((a, b) => {
      if (isUrgent(a) && !isUrgent(b)) return -1;
      if (!isUrgent(a) && isUrgent(b)) return 1;
      return 0;
    });

    return list;
  }, [permissions, filterStatus, searchDate]);

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

  const handleClearAll = async () => {
    const res = await confirmAndClearAllPermissions();
    if (res?.ok) refresh();
  };

  return (
    <div className="apg__page">
      {/* Perfil pequeño arriba a la derecha */}
      <div style={{ position: "absolute", top: 24, right: 32, zIndex: 1000 }}>
        <UserFaceCardSimple
          name={userInfo?.fullName || userInfo?.names || "Usuario"}
          photo={userInfo?.photo || userInfo?.photoUrl || null}
          description={"Perfil"}
          onClick={() => { /* navegar o mostrar panel */ }}
        />
      </div>

      <div className="apg__container">
        {/* Título solo */}
        <header className="apg__header">
          <h2 className="apg__title">Permisos — Administrador</h2>
        </header>
        <div className="a">
          <button onClick={handleClearAll} className="apg__danger">
              Eliminar Todos Permisos
            </button>
          </div>

        <section className="apg__sheet">
          <div className="apg__actions">
            <div className="apg__filters">
              <div className="apg__chip">
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="apg__input"
                />
              </div>

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

          {/* Lista */}
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
                      <span className="apg__doc" aria-hidden>📄</span>
                      <span className="apg__rowTitle">
                        {perm.employeeName || "Colaborador"} — {perm.applicationDay}
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

      {/* Modal */}
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
