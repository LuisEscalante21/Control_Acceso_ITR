import React from "react";

const AreaCard = ({ name, onClick }) => (
  <div className="area-card" onClick={onClick}>
    <span>{name}</span>
  </div>
);

export default AreaCard;
