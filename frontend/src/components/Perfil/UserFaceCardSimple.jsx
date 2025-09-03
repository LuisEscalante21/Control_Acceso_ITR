import React from "react";
import "../styles/PerfilCard.css";
import { UserCircle } from "lucide-react";

const UserFaceCardSimple = ({ name, surnames, photo, description, onClick }) => {
  return (
    <div className="user-face-card-simple" onClick={onClick}>
      <div className="photo-wrapper-simple">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="circular-photo"
          />
        ) : (
          <UserCircle className="circular-photo default-avatar" size={64} />
        )}
      </div>
      <div className="info-simple">
        <p className="name-simple">{name}</p>
        {surnames && <p className="surname-simple">{surnames}</p>}
      </div>
    </div>
  );
};

export default UserFaceCardSimple;
