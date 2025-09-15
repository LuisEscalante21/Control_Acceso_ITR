import React, { useEffect, useMemo, useState } from "react";
import CryptoJS from "crypto-js";
import NewPermissionModal from "../../components/employee/PageModals/NewPermissionModal";
import ViewPermissionModal from "../../components/employee/PageModals/ViewPermissionModal";
import useDataPermissions from "../../hooks/Global/UseDataPermissions";
import UserFaceCardSimple from "../../components/Perfil/UserFaceCardSimple.jsx";
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
    deletePermission,
    showModal,
    setShowModal,
  } = useDataPermissions();

  const [filterStatus, setFilterStatus] = useState("Todos");
  const [searchDate, setSearchDate] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // perfil del usuario
  const [userName, setUserName] = useState("");
  const [userPhoto, setUserPhoto] = useState(null);
  const secretKey = import.meta.env.VITE_JWT_SECRET;

  useEffect(() => {
    fetchPermissions();

    // Leer y parsear la cookie userInfo
    const userInfoCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userInfo="));

    if (userInfoCookie && secretKey) {
      try {
        const encrypted = decodeURIComponent(userInfoCookie.split("=")[1]);
        const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedStr)
          throw new Error("No se pudo descifrar correctamente.");

        const userInfo = JSON.parse(decryptedStr);
        setUserName(userInfo.fullName || "Usuario");
        setUserPhoto(userInfo.photoUrl || null);
      } catch (err) {
        console.error("Error al descifrar userInfo:", err);
      }
    }
  }, [secretKey]);

  const filteredPermissions = useMemo(() => {
    let list = permissions || [];

    if (searchDate) {
      const selectedDate = new Date(searchDate);
      list = list.filter((p) => {
        const permDate = new Date(p.applicationDay);
        return permDate <= selectedDate;
      });
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
  const closeView = () => {
    setViewOpen(false);
    setSelected(null);
  };
  const handleDeleted = async () => {
    await fetchPermissions();
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = async () => {
    setShowModal(false);
    await fetchPermissions();
  };

  return (
    <div className="pgp" style={{ position: "relative" }}>
      {/* Perfil arriba a la derecha */}
      <div style={{ position: "absolute", top: 24, right: 32, zIndex: 1000 }}>
        <UserFaceCardSimple
          name={userName}
          photo={userPhoto}
          description={"Mis Permisos"}
          onClick={() => { /* acción al hacer click */ }}
        />
      </div>

      <div className="pgp__container">
        {/* encabezado */}
        <header className="pgp__header">
          <h2 className="pgp__title">Gestión de mis permisos</h2>
        </header>

        <div className="pgp__new1">
          <button onClick={handleOpenModal} className="pgp__new">
            Adjuntar un nuevo permiso
          </button>
        </div>

        {/* container blanco con filtros y botón */}
        <section className="pgp__sheet">
          <div className="pgp__actions">
            <div className="pgp__filters">
              <div className="pgp__chip">
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="pgp__input"
                  aria-label="Buscar por fecha"
                />
              </div>
              <div className="pgp__chip">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pgp__select"
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

          {/* lista */}
          {filteredPermissions.length === 0 ? (
            <div className="pgp__empty">No hay permisos para mostrar.</div>
          ) : (
            <div className="pgp__list">
              {filteredPermissions.map((perm, idx) => {
                const { label, cls } = mapStatus(perm.status);
                return (
                  <button
                    key={perm._id}
                    className={`pgp__row ${
                      idx === filteredPermissions.length - 1 ? "last" : ""
                    }`}
                    onClick={() => openView(perm)}
                    title="Ver detalles"
                  >
                    <div className="pgp__rowLeft">
                      <span className="pgp__dot" />
                      <span className="pgp__doc" aria-hidden>
                        📄
                      </span>
                      <span className="pgp__rowTitle">
                        Permiso {perm.applicationDay}
                      </span>
                    </div>
                    <div className="pgp__rowRight">
                      <span className={`pgp__badge ${cls}`}>{label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* modales */}
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
        deletePermission={deletePermission}
      />
    </div>
  );
}
