import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie'; // Importar la librería
import '../../components/styles/admin/Home.css';
import GreetingCard from "../../components/Tools/widgets/GreetingCard.jsx";
import SchoolYearProgress from "../../components/Tools/graphics/SchoolYearProgress.jsx";

export default function AdminHome() {
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Leer y parsear la cookie userInfo
    const userInfoCookie = Cookies.get('userInfo');
    if (userInfoCookie) {
      try {
        const userInfo = JSON.parse(userInfoCookie);
        setUserName(userInfo.fullName || 'Usuario');
      } catch (error) {
        console.error('Error al parsear userInfo:', error);
        setUserName('Usuario');
      }
    } else {
      setUserName('Usuario');
    }
  }, []);

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
