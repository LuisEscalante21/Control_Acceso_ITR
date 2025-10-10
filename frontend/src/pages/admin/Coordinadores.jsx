import React, { useState, useMemo, useEffect } from "react";
import "../../styles/Admin/Coordinators.css";
import DocenteCard from "../../components/admin/Cards/DocenteCard.jsx";
import { Search, CirclePlus } from "lucide-react";
import ModalCoordinators from "../../components/admin/PageModals/CoordinadoresModal/NewCoordinatorsModal.jsx";
import UpdateCoordinators from "../../components/admin/PageModals/CoordinadoresModal/UpdateCoordinators.jsx";
import useCoordinators from "../../hooks/admin/useDataCoordinators.jsx";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";

const Coordinadores = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewCoordinador, setShowNewCoordinador] = useState(false);
  const [coordinadorEdit, setCoordinadorEdit] = useState(null);

  const {
    coordinators,
    fetchCoordinators,
    saveCoordinator,
    deleteCoordinator,
  } = useCoordinators();

  useEffect(() => {
    fetchCoordinators();
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

  const filteredCoordinadores = useMemo(() => {
    return coordinators.filter((coordinador) => {
      const fullName = `${coordinador.names} ${coordinador.surnames}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, coordinators]);

  return (
    <>
      <div className="encabezado">
        <h1 className="titulo">Gestión de Coordinadores</h1>
        <div className="busqueda-bar">
          <div className="buscadora">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre o apellido"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="nuevo-empleado-btn-G"
            onClick={() => setShowNewCoordinador(true)}
          >
            <CirclePlus size={20} />
            Nuevo Coordinador
          </button>
        </div>
      </div>

      <div className="gestion-de-coordinadores">
        <div className="coordinadores-list">
          {filteredCoordinadores.length > 0 ? (
            filteredCoordinadores.map((coordinador) => (
              <div
                key={coordinador._id}
                onClick={() => setCoordinadorEdit(coordinador)}
                style={{ cursor: "pointer" }}
              >
                <DocenteCard
                  status={coordinador.status}
                  name={coordinador.names}
                  surnames={coordinador.surnames}
                  photo={coordinador.photo}
                />
              </div>
            ))
          ) : (
            <p style={{ padding: "20px", color: "#888" }}>
              No se encontraron coordinadores.
            </p>
          )}
        </div>
      </div>

      {showNewCoordinador && (
        <div className="modal-overlay active" onClick={() => setShowNewCoordinador(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "none", boxShadow: "none", padding: 0 }}
          >
            <ModalCoordinators
              onSaved={() => {
                fetchCoordinators();
                setShowNewCoordinador(false);
              }}
              onClose={() => setShowNewCoordinador(false)}
            />
          </div>
        </div>
      )}

      {coordinadorEdit && (
        <UpdateCoordinators
          coordinator={coordinadorEdit}
          onSave={async (data, id) => {
            await saveCoordinator(data, id);
            setCoordinadorEdit(null);
            fetchCoordinators();
          }}
          onDelete={async (id) => {
            await deleteCoordinator(id);
            setCoordinadorEdit(null);
            fetchCoordinators();
          }}
          onClose={() => setCoordinadorEdit(null)}
        />
      )}
    </>
  );
};

export default Coordinadores;