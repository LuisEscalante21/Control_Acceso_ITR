import React, { useState, useMemo, useEffect } from "react";
import "../../styles/Admin/Admins.css";
import DocenteCard from "../../components/admin/Cards/DocenteCard.jsx";
import { Search, CirclePlus } from "lucide-react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import UserFaceCardSimple from "../../components/Perfil/UserFaceCardSimple.jsx";
import ModalAdmin from "../../components/admin/PageModals/AdminsModal/NewAdminModal.jsx";
import UpdateAdmins from "../../components/admin/PageModals/AdminsModal/UpdateAdmins.jsx";
import useAdmins from "../../hookS/admin/useDataAdmin.jsx";

const Admins = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewAdmin, setShowNewAdmin] = useState(false);
  const [adminEdit, setAdminEdit] = useState(null);

  const { admins, fetchAdmins, saveAdmin, deleteAdmin } = useAdmins();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const fullName = `${admin.names} ${admin.surnames}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, admins]);

  return (
    <>
      {/* Perfil pequeño arriba a la derecha */}
      <div style={{ position: "absolute", top: 24, right: 32, zIndex: 1000 }}>
        <UserFaceCardSimple
          name={/* try fullName or names from cookie */ "Usuario"}
          photo={null}
          description={"Perfil"}
          onClick={() => {}}
        />
      </div>

      <div className="encabezado" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <h1 className="titulo">Gestión de Administradores</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "space-between" }}>
          <div className="buscador" style={{ display: "flex", alignItems: "center", gap: "8px", flex: '0 1 70%' }}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre o apellido"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, minWidth: "440px" }}
            />
          </div>

          <button
            className="nuevo-empleado-btn-G"
            onClick={() => setShowNewAdmin(true)}
            style={{ whiteSpace: "nowrap" }}
          >
            <CirclePlus size={20} />
            Nuevo Administrador
          </button>
        </div>
      </div>

      <div className="gestion-de-admins">
        <div className="admins-list">
          {filteredAdmins.length > 0 ? (
            filteredAdmins.map((admin) => (
              <div
                key={admin._id}
                onClick={() => {
                  setAdminEdit(admin); // Solo esto para abrir el modal
                }}
                style={{ cursor: "pointer" }}
              >
                <DocenteCard
                  status={admin.status}
                  name={admin.names}
                  surnames={admin.surnames}
                  photo={admin.photo}
                />
              </div>
            ))
          ) : (
            <p style={{ padding: "20px", color: "#888" }}>
              No se encontraron administradores.
            </p>
          )}
        </div>
      </div>

      {showNewAdmin && (
        <div
          className="modal-overlay active"
          onClick={() => setShowNewAdmin(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "none", boxShadow: "none", padding: 0 }}
          >
            <ModalAdmin
              tipo="admin"
              onSaved={() => {
                fetchAdmins();
                setShowNewAdmin(false);
              }}
              onClose={() => setShowNewAdmin(false)}
            />
          </div>
        </div>
      )}

      {adminEdit && (
        <UpdateAdmins
          admin={adminEdit}
          onSave={async (data, id) => {
            await saveAdmin(data, id);
            setAdminEdit(null);
            fetchAdmins();
          }}
          onDelete={async (id) => {
            await deleteAdmin(id);
            setAdminEdit(null);
            fetchAdmins();
          }}
          onClose={() => setAdminEdit(null)}
        />
      )}
    </>
  );
};

export default Admins;
