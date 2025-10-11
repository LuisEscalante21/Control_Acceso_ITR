import { useState } from "react";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const BASE_URL = `${API_URL}${PORT}`; 


export function useGenerateReport() {
  const [loading, setLoading] = useState(false);

  const generateReport = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/reports/user/${userId}/report`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Error al generar el reporte");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_${userId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire("Éxito", "Reporte descargado correctamente.", "success");
    } catch (error) {
      Swal.fire("Error", error.message || "No se pudo generar el reporte.", "error");
    } finally {
      setLoading(false);
    }
  };

  return { generateReport, loading };
}
