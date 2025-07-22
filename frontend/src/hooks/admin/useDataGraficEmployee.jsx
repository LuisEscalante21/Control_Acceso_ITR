import { useEffect, useState } from "react";

export default function useDataGraficEmployee() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/employee/by-team");
        if (!response.ok) throw new Error("Error al obtener datos del gráfico");
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, []);

  return { data, loading, error };
}
