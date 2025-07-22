import React from "react";
import "../../../components/styles/UserFaceCard.css";
import { Pencil, Trash2 } from "lucide-react";

const UserFaceCard = ({ name, photo, onDelete, onEdit }) => {
  return (
    <div className="user-face-card">
      <div className="photo-wrapper">
        <img src={photo} alt={name} />
      </div>

      <div className="info">
        <p className="name">{name}</p>
      </div>

      <div className="face-card-actions">
        <button
          className="edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil size={16} />
        </button>

        <button
          className="delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default UserFaceCard;