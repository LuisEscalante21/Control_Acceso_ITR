import React, { useState, useEffect } from "react";
import useFaceRecognition from "../../hooks/widgets/useFaceRecognition";
import "../../styles/videoCapture/VideoDashboard.css";

export default function VideoDashboard() {
  const [time, setTime] = useState(new Date());
  const recognized = useFaceRecognition(); 

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="video-dashboard-container">
      <div className="video-container">
        <img
          src="http://localhost:4600/videoCapture"
          alt="Streaming cámara"
        />
      </div>

      <div className="clock-widget">
        <h2>Hora actual</h2>
        <p>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      </div>

      {recognized && (
        <div className="recognized-message">
          Rostro reconocido: {recognized.nombre || recognized.id}
        </div>
      )}
    </div>
  );
}
