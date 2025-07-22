// src/pages/admin/AdminHome.jsx
import React, { useEffect, useState } from 'react';
import '../../components/styles/Home.css'; 

export default function Home() {
  const [greeting, setGreeting] = useState('');
  const [dayName, setDayName] = useState('');
  const [dayNumber, setDayNumber] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    updateGreetingAndDate();
    calculateSchoolYearProgress();
  }, []);

  // Función para determinar el saludo y la fecha
  const updateGreetingAndDate = () => {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 5 && hour < 12) {
      setGreeting('Buenos días');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('Buenas tardes');
    } else {
      setGreeting('Buenas noches');
    }

    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    setDayName(diasSemana[now.getDay()]);
    setDayNumber(now.getDate());
    setCurrentYear(now.getFullYear());
  };

  // Función para calcular el porcentaje de progreso del año escolar
  const calculateSchoolYearProgress = () => {
    const year = new Date().getFullYear();
    const start = new Date(`${year}-01-20`);
    const end = new Date(`${year}-10-20`);
    const today = new Date();

    if (today < start) {
      setProgress(0);
      return;
    }

    if (today > end) {
      setProgress(100);
      return;
    }

    const totalDuration = end - start;
    const elapsed = today - start;
    const percentage = (elapsed / totalDuration) * 100;
    setProgress(Math.floor(percentage)); 
  };

  return (
    <div className="dashboard-home-container">
      <h2>{greeting}, Luis Escalante</h2>

      <div className="dashboard-widgets">
        <div className="widget widget-bar-chart">
          <p>Gráfico de barras (ejemplo)</p>
        </div>

        <div className="widget widget-day">
          <h3>{dayName}</h3>
          <span className="day-number">{dayNumber}</span>
        </div>

        <div className="widget widget-progress">
          <div className="progress-circle">
            <div className="progress-fill">{progress}%</div>
          </div>
          <p>Progreso de año electivo {currentYear}</p>
        </div>
      </div>

      <div className="widget widget-line-chart">
        <p>Gráfico de líneas (ejemplo)</p>
      </div>
    </div>
  );
}
