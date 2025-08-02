import React, { useEffect, useState } from "react";
import CryptoJS from "crypto-js";
import "../../components/styles/admin/Home.css";
import GreetingCard from "../../components/Tools/widgets/GreetingCard.jsx";
import SchoolYearProgress from "../../components/Tools/graphics/SchoolYearProgress.jsx";

export default function AdminHome() {
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");

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
      } catch (err) {
        console.error("Error al descifrar userInfo:", err);
      }
    }
  }, [secretKey]);

  return (
    <div className="dashboard-home-container">
      {/* Mostrar saludo solo si existe */}
      <h2>{greeting && `${greeting}, ${userName}`}</h2>

      {/* Fila superior con 3 widgets distribuidos horizontalmente */}
      <div className="dashboard-widgets">
        <div className="widget widget-bar-chart">
          <p>Gráfico de barras (ejemplo)</p>
        </div>

        <div className="widget widget-day">
          <GreetingCard onGreetingReady={setGreeting} />
        </div>

        <div className="widget widget-progress">
          <SchoolYearProgress />
        </div>
      </div>

      {/* Widget inferior que ocupa el ancho completo */}
      <div className="widget widget-line-chart">
        <p>Gráfico de líneas (ejemplo)</p>
      </div>
    </div>
  );
}
