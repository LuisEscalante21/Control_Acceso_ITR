import React, { useEffect, useState } from "react";
import CryptoJS from "crypto-js";
import "../../components/styles/employee/Home.css";
import SchoolYearProgress from "../../components/Tools/graphics/SchoolYearProgress.jsx";
import GreetingCard from "../../components/Tools/widgets/GreetingCard.jsx";
import UserFaceCardSimple from "../../components/Perfil/UserFaceCardSimple";

export default function Home() {
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");
  const [userPhoto, setUserPhoto] = useState(null);
  const secretKey = import.meta.env.VITE_JWT_SECRET;

  useEffect(() => {
    // Leer y parsear la cookie userInfo
    const userInfoCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userInfo="));

    if (userInfoCookie && secretKey) {
      try {
        const encrypted = decodeURIComponent(userInfoCookie.split("=")[1]);
        const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedStr)
          throw new Error("No se pudo descifrar correctamente.");

        const userInfo = JSON.parse(decryptedStr);
        setUserName(userInfo.fullName || "Usuario");
        setUserPhoto(userInfo.photoUrl || null); // Ajusta la propiedad según tu backend
      } catch (err) {
        console.error("Error al descifrar userInfo:", err);
      }
    }
  }, [secretKey]);

  return (
    <div className="dashboard-home-container" style={{ position: "relative" }}>
      {/* Perfil pequeño arriba a la derecha */}
      <div style={{ position: "absolute", top: 24, right: 32, zIndex: 1000 }}>
        <UserFaceCardSimple
          name={userName}
          photo={userPhoto}
          description={"Bienvenido"}
          onClick={() => { /* acción al hacer click, por ejemplo navegar al perfil */ }}
        />
      </div>
      <h2>{`${greeting || "Hola"}, ${userName || "Usuario"}`}</h2>
      <div className="dashboard-widgets">
        <GreetingCard onGreetingReady={setGreeting} />
        <div className="widget-progress">
          <SchoolYearProgress />
        </div>
      </div>
    </div>
  );
}
