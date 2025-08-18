import React, { useEffect, useState } from "react";
import CryptoJS from "crypto-js";
import "../../components/styles/admin/Home.css";
import GreetingCard from "../../components/Tools/widgets/GreetingCard.jsx";
import SchoolYearProgress from "../../components/Tools/graphics/SchoolYearProgress.jsx";
import LateArrivalsChart from "../../components/Tools/graphics/LateArrivalsChart.jsx";
import EmployeesByAreaChart from "../../components/Tools/graphics/EmployeesByAreaChart.jsx";

export default function AdminHome() {
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");

  const secretKey = import.meta.env.VITE_JWT_SECRET;

  useEffect(() => {
    const userInfoCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userInfo="));

    if (userInfoCookie && secretKey) {
      try {
        const encrypted = decodeURIComponent(userInfoCookie.split("=")[1]);
        const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedStr) throw new Error("No se pudo descifrar correctamente.");
        const userInfo = JSON.parse(decryptedStr);
        setUserName(userInfo.fullName || "Usuario");
      } catch (err) {
        console.error("Error al descifrar userInfo:", err);
      }
    }
  }, [secretKey]);

  return (
    <div className="dashboard-home-container">
      {/* Saludo principal */}
      <h2>
        {greeting
          ? `${greeting}, ${userName}`
          : `Hola, ${userName || "Usuario"}`}
      </h2>

      {/* Fila superior: Gráfica de llegadas dentro de su contenedor */}
      <div className="widget-late-chart">
        <LateArrivalsChart empleadoId={"123"} />
      </div>

      {/* Fila inferior: Día/fecha + Progreso del año */}
      <div className="dashboard-widgets">
        <div className="widget-day">
          <GreetingCard onGreetingReady={setGreeting} />
        </div>
        <div className="widget-progress">
          <SchoolYearProgress />
        </div>
      </div>

      {/* Widget inferior de gráfico de líneas */}
      <div className="widget-line-chart">
        <EmployeesByAreaChart />
      </div>
    </div>
  );
}
