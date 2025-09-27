import React, { useEffect, useState } from "react";
import CryptoJS from "crypto-js";
import "../../components/styles/coordinator/Home.css";
import GreetingCard from "../../components/Tools/widgets/GreetingCard.jsx";
import SchoolYearProgress from "../../components/Tools/graphics/SchoolYearProgress.jsx";
import ArrivalBarChart from "../Tools/graphics/ArrivalBarChart.jsx";
import useDataAccess from "../../hooks/coordinators/useDataAccess";

export default function AdminHome() {
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");
  const [userPhoto, setUserPhoto] = useState(null);

  const secretKey = import.meta.env.VITE_JWT_SECRET;

  // Leer y descifrar info del usuario desde cookie cifrada con AES
  useEffect(() => {
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

  // Obtener el id del empleado y el id del área (teamId) desde la cookie
  const [empleadoId, setEmpleadoId] = useState(null);
  const [teamId, setTeamId] = useState(null);

  useEffect(() => {
    const userInfoCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userInfo="));
    if (userInfoCookie && secretKey) {
      try {
        const encrypted = decodeURIComponent(userInfoCookie.split("=")[1]);
        const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        if (decryptedStr) {
          const userInfo = JSON.parse(decryptedStr);
          setEmpleadoId(userInfo._id || null);
          setTeamId(userInfo.teamId || null);
        }
      } catch (err) {
        setEmpleadoId(null);
        setTeamId(null);
      }
    }
  }, [secretKey]);

  // Hook para obtener los registros de acceso del área
  const { accessRecords } = useDataAccess(empleadoId, teamId);

  return (
    <div className="dashboard-home-container" style={{ position: "relative" }}>
      {/* Mostrar saludo solo si existe */}
      <h2>{greeting && `${greeting}, ${userName}`}</h2>

      {/* Primera fila: gráfica de llegadas ocupa todo el ancho */}
      <div className="dashboard-row full-width">
        <div className="widget-late-chart">
          <ArrivalBarChart accessRecords={accessRecords} />
        </div>
      </div>

      {/* Segunda fila: GreetingCard + SchoolYearProgress */}
      <div className="dashboard-row widgets-bottom">
        <GreetingCard onGreetingReady={setGreeting} />

        <div className="widget widget-progress">
          <SchoolYearProgress />
        </div>
      </div>
    </div>
  );
}
