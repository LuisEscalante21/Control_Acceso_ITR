import React, { useState } from "react";
import { Trash2 } from "lucide-react";

const AreaCard = ({ name, onClick, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation(); // Evita que se abra el modal de edición
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div 
      className="area-card" 
      onClick={onClick} 
      style={{ position: "relative" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span>{name}</span>
      {onDelete && isHovered && (
        <button
          className="delete-btn"
          onClick={handleDelete}
          title="Eliminar área"
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: "#dc3545",
            border: "none",
            borderRadius: "50%",
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "white",
            transition: "all 0.2s",
            zIndex: 10,
            opacity: 0,
            animation: "fadeIn 0.2s forwards",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#c82333";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#dc3545";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <Trash2 size={14} />
        </button>
      )}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default AreaCard;