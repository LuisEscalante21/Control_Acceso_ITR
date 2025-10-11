import { useState, useEffect } from "react";
import RostroReconocido from "../../../../backend/audio/RostroReconocido.mp3";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT_RECONOCIMIENTO;

export default function useFaceRecognition(
  pollUrl = `${BASE_URL}${PORT}/api/last_recognized`,
  intervalMs = 3000
) {
  const [recognized, setRecognized] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(pollUrl, {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_RECONOCIMIENTO_API_KEY}`,
          },
        });

        if (!res.ok) {
          console.error("Error en API:", res.status, res.statusText);
          return;
        }

        const data = await res.json();
        console.log("Polling data:", data);

        // Si se reconoce un rostro nuevo
        if (data.reconocido && data.id !== recognized?.id) {
          console.log("Nuevo rostro reconocido:", {
            id: data.id,
            nombre: data.nombre,
            gender: data.gender,
            tipo: data.tipo,
          });

          setRecognized(data);

          // Reproducir audio automáticamente
          const audio = new Audio(RostroReconocido);
          audio.play().catch((e) => console.error("Error reproduciendo audio:", e));
        }
      } catch (error) {
        console.error("Error consultando estado:", error);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [pollUrl, intervalMs, recognized]);

  return recognized;
}
