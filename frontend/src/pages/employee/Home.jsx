import React, { useState, useEffect } from 'react';
import '../../components/styles/employee/Home.css';
import SchoolYearProgress from "../../components/Tools/graphics/SchoolYearProgress.jsx";
import GreetingCard from "../../components/Tools/widgets/GreetingCard.jsx";

export default function Home() {
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Obtener datos del usuario desde la cookie `userInfo`
    const userInfoCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('userInfo='));

    if (userInfoCookie) {
      try {
        const userInfo = JSON.parse(decodeURIComponent(userInfoCookie.split('=')[1]));
        setUserName(userInfo.fullName || 'Usuario');
      } catch (err) {
        console.error('Error al parsear userInfo cookie:', err);
      }
    }
  }, []);

  return (
    <div className="dashboard-home-container">
      <h2>{greeting && `${greeting}, ${userName}`}</h2>

      <div className="dashboard-widgets">
        <GreetingCard onGreetingReady={setGreeting} />
        <div className="widget-progress">
          <SchoolYearProgress />
        </div>
      </div>
    </div>
  );
}
