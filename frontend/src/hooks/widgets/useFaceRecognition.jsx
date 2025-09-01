import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import RostroReconocido from "../../../../backend/audio/RostroReconocido.mp3";

export default function useFaceRecognition(
  pollUrl = "http://localhost:4600/api/last_recognized",
  intervalMs = 3000
) {
  const [recognized, setRecognized] = useState(null);

  // Desbloquear audio tras primer clic del usuario
  useEffect(() => {
    const unlockAudio = () => {
      const audio = new Audio(RostroReconocido);
      audio.play().catch(() => {});
      window.removeEventListener("click", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(pollUrl, {
          headers: {
            Authorization: `Bearer ${
              import.meta.env.VITE_RECONOCIMIENTO_API_KEY
            }`,
          },
        });

        if (!res.ok) {
          console.error("Error en API:", res.status, res.statusText);
          return;
        }

        const data = await res.json();
        console.log("Polling data:", data); // <-- log para depuración

        // Si se reconoce un rostro nuevo
        if (data.reconocido && data.id !== recognized?.id) {
          setRecognized(data);

          const saludo =
            data.gender?.toLowerCase() === "femenino"
              ? "Bienvenida"
              : "Bienvenido";

          Swal.fire({
            title: `${saludo} ${data.nombre || "Empleado"}`,
            text: "Rostro reconocido correctamente",
            icon: "success",
            timer: 3000,
            showConfirmButton: false,
          });

          // Reproducir audio
          const audio = new Audio(RostroReconocido);
          audio
            .play()
            .catch((e) => console.error("Error reproduciendo audio:", e));
        }
      } catch (error) {
        console.error("Error consultando estado:", error);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [pollUrl, intervalMs, recognized]);

  return recognized;
}
