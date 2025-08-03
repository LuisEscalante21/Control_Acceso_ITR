import React, { useState } from "react";
import AccessCard from "./Cards/AccessCard";
import JustifyModal from "./PageModals/justifictions";

const AccesosList = ({ accessRecords, currentUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  // Al hacer clic en Justificar
  const handleJustifyClick = (record) => {
    setRegistroSeleccionado(record);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setRegistroSeleccionado(null);
  };

  return (
    <>
      {accessRecords.map((record) => (
        <AccessCard
          key={record._id}
          name={record.employeeName}
          avatar={record.employeeAvatar}
          timeLabel={record.entry_time ? "Entrada" : "Salida"}
          time={record.entry_time || record.exit_time}
          tipoRegistro={
            record.tipo_registro === "entrada y salida"
              ? "entrada"
              : record.tipo_registro
          }
          showJustifyButton={!record.isJustified} // mostrar botón si NO está justificado
          isJustified={record.isJustified}
          onJustifyClick={() => handleJustifyClick(record)}
        />
      ))}

      <JustifyModal
        isOpen={showModal}
        onClose={handleCloseModal}
        record={registroSeleccionado}
        currentUser={currentUser}
      />
    </>
  );
};

export default AccesosList;
