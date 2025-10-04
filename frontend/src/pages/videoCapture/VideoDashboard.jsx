import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import useFaceRecognition from "../../hooks/widgets/useFaceRecognition";
import "../../styles/videoCapture/VideoDashboard.css";

export default function VideoDashboard() {
  const [time, setTime] = useState(new Date());
  const [isProcessing, setIsProcessing] = useState(false);
  const [accessRegistered, setAccessRegistered] = useState(false);
  const recognized = useFaceRecognition();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Resetear estado cuando cambia el rostro reconocido
  useEffect(() => {
    if (recognized) {
      setAccessRegistered(false); // Resetear acceso registrado para nuevo rostro
    }
  }, [recognized]);

  // Función para registro manual de acceso
  const handleManualAccess = async () => {
    if (!recognized || !recognized.id || accessRegistered) {
      if (accessRegistered) {
        Swal.fire({
          title: "Acceso ya registrado",
          text: "El acceso para este empleado ya ha sido registrado. Espere a que se reconozca otro rostro.",
          icon: "info",
          confirmButtonText: "Entendido"
        });
      } else {
        Swal.fire({
          title: "No hay rostro reconocido",
          text: "Primero debe reconocerse un empleado para registrar el acceso",
          icon: "warning",
          confirmButtonText: "Entendido"
        });
      }
      return;
    }

    setIsProcessing(true);

    try {
      // PRIMERA ALERTA: Mostrar reconocimiento exitoso
      const saludo = recognized.gender?.toLowerCase() === "femenino" ? "Bienvenida" : "Bienvenido";
      
      await Swal.fire({
        title: `${saludo} ${recognized.nombre || "Empleado"}`,
        text: "Su rostro ha sido reconocido exitosamente",
        icon: "success",
        timer: 2500,
        showConfirmButton: false,
        timerProgressBar: true
      });

      // Pequeña pausa antes de la siguiente alerta
      await new Promise(resolve => setTimeout(resolve, 500));

      const now = new Date();
      const accessType = recognized.tipo || "entrada";
      
      const accessData = {
        id_Employee: recognized.id,
        date: now.toISOString().split('T')[0],
        employeeArea: "Sin área"
      };

      if (accessType === "entrada") {
        accessData.entry_time = now.toISOString();
        accessData.entry_result = "Reconocido";
      } else {
        accessData.exit_time = now.toISOString();
        accessData.exit_result = "Reconocido";
      }

      const response = await fetch("http://localhost:4800/api/access", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${"b11qp8D&UeX2@9"}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(accessData)
      });

      if (response.ok) {
        const result = await response.json();
        setAccessRegistered(true);

        await Swal.fire({
          title: "¡Acceso registrado manualmente!",
          html: `
            <div style="text-align: left; margin: 20px 0;">
              <p><strong>Empleado:</strong> ${recognized.nombre || recognized.id}</p>
              <p><strong>Tipo:</strong> ${accessType === "entrada" ? "Entrada" : "Salida"}</p>
              <p><strong>Hora:</strong> ${now.toLocaleTimeString()}</p>
              <p><strong>Backend responde:</strong> ${result.message}</p>
              <p><strong>Resultado:</strong> Se determinará según tu horario asignado</p>
            </div>
          `,
          icon: "success",
          confirmButtonText: "Continuar",
          timer: 4000,
          timerProgressBar: true
        });
      } else {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: `No se pudo registrar el acceso: ${error.message}`,
        icon: "error",
        confirmButtonText: "Reintentar"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const dayFormatter = new Intl.DateTimeFormat("es-ES", { weekday: "long" });
  const dateNumber = time.getDate();
  const weekday = dayFormatter.format(time);
  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="vd-shell">
      <div className="vd-board">
        <div className="vd-content">
          {/* Header */}
          <div className="vd-header">
            <h1>BIENVENIDO</h1>
          </div>
          
          {/* Principal */}
          <div className="vd-main">
            <div className="vd-video-card">
              <img src="http://localhost:4600/videoCapture" alt="Streaming cámara" />
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

          {/* Botón de registro manual */}
          <div className="vd-access-section">
            <button
              onClick={handleManualAccess}
              disabled={!recognized || isProcessing || accessRegistered}
              className={`vd-access-button ${!recognized || isProcessing || accessRegistered ? 'vd-access-button--disabled' : ''}`}
            >
              {isProcessing ? (
                <>
                  <div className="vd-spinner"></div>
                  <span>Procesando...</span>
                </>
              ) : accessRegistered ? (
                'Acceso Ya Registrado'
              ) : (
                `Registrar ${recognized?.tipo === "salida" ? "Salida" : "Entrada"} Manual`
              )}
            </button>
            
            <div className="vd-access-instruction">
              {!recognized 
                ? "Espera a ser reconocido para registrar acceso manual"
                : accessRegistered
                ? "Acceso registrado. Espere reconocimiento de otro empleado."
                : `Presiona para registrar tu ${recognized.tipo || "acceso"} manualmente (se evaluará según tu horario)`
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
