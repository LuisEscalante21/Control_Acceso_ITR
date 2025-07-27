// src/components/JustifyButton.jsx
import React from "react";
import "../../styles/JustifyButton.css";

const JustifyButton = ({ onClick }) => {
  return (
    <button className="justify-button" onClick={onClick}>
      Justificar
    </button>
  );
};

export default JustifyButton;
