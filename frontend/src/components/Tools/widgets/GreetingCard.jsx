import React, { useEffect, useState } from 'react';

const GreetingCard = ({ onGreetingReady }) => {
  const [greeting, setGreeting] = useState('');
  const [dayName, setDayName] = useState('');
  const [dayNumber, setDayNumber] = useState('');

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();

    let saludo = '';
    if (hour >= 5 && hour < 12) {
      saludo = 'Buenos días';
    } else if (hour >= 12 && hour < 18) {
      saludo = 'Buenas tardes';
    } else {
      saludo = 'Buenas noches';
    }
    setGreeting(saludo);
    onGreetingReady && onGreetingReady(saludo); 

    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    setDayName(diasSemana[now.getDay()]);
    setDayNumber(now.getDate());
  }, []);

  return (
    <div className="widget widget-day">
      <h3>{dayName}</h3>
      <span className="day-number">{dayNumber}</span>
    </div>
  );
};

export default GreetingCard;
