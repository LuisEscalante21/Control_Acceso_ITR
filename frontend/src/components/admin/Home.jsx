import React, { useEffect, useState, Suspense } from "react";
import CryptoJS from "crypto-js";
import "../../components/styles/admin/Home.css";
import GreetingCard from "../../components/Tools/widgets/GreetingCard.jsx";
import UserFaceCardSimple from "../Perfil/UserFaceCardSimple";

// Carga diferida de gráficas pesadas
const LateArrivalsChart = React.lazy(() =>
  import("../../components/Tools/graphics/LateArrivalsChart.jsx")
);
const SchoolYearProgress = React.lazy(() =>
  import("../../components/Tools/graphics/SchoolYearProgress.jsx")
);
const EmployeesByAreaChart = React.lazy(() =>
  import("../../components/Tools/graphics/EmployeesByAreaChart.jsx")
);

export default function AdminHome() {
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");
  const [userPhoto, setUserPhoto] = useState(null);
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
        setUserPhoto(userInfo.photoUrl || null); // Ajusta la propiedad según tu backend
      } catch (err) {
        console.error("Error al descifrar userInfo:", err);
      }
    }
  }, [secretKey]);

  return (
    <div className="dashboard-home-container">
      {/* Perfil pequeño arriba a la derecha */}
      <div style={{ position: "absolute", top: 24, right: 32, zIndex: 1000 }}>
        <UserFaceCardSimple
          name={userName}
          photo={userPhoto}
          description={"Bienvenido"}
          onClick={() => { /* acción al hacer click, por ejemplo navegar al perfil */ }}
        />
      </div>
      <h2>
        {greeting
          ? `${greeting} ${userName}`
          : `Hola ${userName || "Usuario"}`}
      </h2>

      {/* Gráfica de llegadas */}
      <div className="widget-late-chart">
        <Suspense fallback={<p>Cargando llegadas...</p>}>
          <LateArrivalsChart empleadoId={"123"} />
        </Suspense>
      </div>

      {/* Widgets Día y Progreso del año */}
      <div className="dashboard-widgets">
        <div className="widget-day">
          <GreetingCard onGreetingReady={setGreeting} />
        </div>
        <div className="widget-progress">
          <Suspense fallback={<p>Cargando progreso...</p>}>
            <SchoolYearProgress />
          </Suspense>
        </div>
      </div>

      {/* Gráfica de líneas */}
      <div className="widget-line-chart">
        <Suspense fallback={<p>Cargando gráfico de empleados...</p>}>
          <EmployeesByAreaChart />
        </Suspense>
      </div>
    </div>
  );
}
