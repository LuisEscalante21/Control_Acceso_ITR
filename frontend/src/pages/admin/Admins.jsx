import React, { useState, useMemo, useEffect } from "react";
import "../../styles/Admin/Admins.css";
import DocenteCard from "../../components/admin/Cards/DocenteCard.jsx";
import { Search, CirclePlus } from "lucide-react";
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
      <div
        className="encabezado"
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <h1 className="titulo">Gestión de Administradores</h1>
        <div
          className="busqueda-bar-G"
        >
          <div className="buscador-G" >
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o apellido"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <button
            className="nuevo-admin-btn"
            onClick={() => setShowNewAdmin(true)}
            style={{ maxWidth: "300px", minWidth: "300px" }}
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
                setAdminEdit(admin);
                setShowForm(true);
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
