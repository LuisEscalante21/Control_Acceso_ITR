import React from "react";
import "../../styles/HorarioCard.css"; 

const ScheduleCard = ({ name, onClick }) => {
  return (
    <div className="schedule-card" onClick={onClick}>
      <span className="schedule-name">{name}</span>
      <div className="schedule-options">⋯</div>
    </div>
  );
};

export default ScheduleCard;
