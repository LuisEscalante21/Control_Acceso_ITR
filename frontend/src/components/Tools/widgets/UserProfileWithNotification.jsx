import React from "react";
import "../../styles/widgets/UserProfileWithNotification.css";
import { Bell, UserCircle } from "lucide-react";

const UserProfileWithNotification = ({ name, photoUrl }) => {
  return (
    <div className="user-profile-wrapper">
      <div className="user-profile-container">
        <div className="notification-icon">
          <Bell size={18} />
        </div>

        {photoUrl ? (
          <img src={photoUrl} alt="Perfil" className="profile-image" />
        ) : (
          <UserCircle size={32} className="default-profile-icon" />
        )}

        <span className="user-name">{name}</span>
      </div>
    </div>
  );
};

export default UserProfileWithNotification;
