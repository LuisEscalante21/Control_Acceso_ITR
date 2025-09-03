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

    const dayFormatter = new Intl.DateTimeFormat("es-ES", { weekday: "long" });
    const dateNumber = time.getDate();
    const weekday = dayFormatter.format(time);
    const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return (
      <div className="vd-shell">
        <div className="vd-board">
          {/* Alerta horizontal */}
          <div className={`vd-alert ${recognized ? "vd-alert--show" : ""}`}>
            {recognized ? (
              <>
                <span className="vd-dot" /> Rostro reconocido:{" "}
                <b>{recognized.nombre || recognized.id}</b>
              </>
            ) : null}
          </div>

          <div className="vd-content">
            {/* Header */}
            <div className="vd-header">
              <div className="vd-badge">🧿</div>
              <h1>BIENVENIDO/A</h1>
            </div>

            {/* Principal */}
            <div className="vd-main">
              <div className="vd-video-card">
                <img src="http://localhost:4600/videoCapture" alt="Streaming cámara" />
                <span className="vd-fps">FPS: 29.92</span>
              </div>

              <div className="vd-widgets">
                <div className="vd-date-card">
                  <div className="vd-date-day">
                    {weekday.charAt(0).toUpperCase() + weekday.slice(1)}
                  </div>
                  <div className="vd-date-num">{dateNumber}</div>
                </div>

                <div className="vd-time-card">
                  <span className="vd-time-text">{timeStr}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
