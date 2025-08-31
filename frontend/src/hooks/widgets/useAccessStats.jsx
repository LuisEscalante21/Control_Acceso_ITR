import { useState, useEffect, useCallback } from "react";

const useAccessStats = (apiUrl, apiKey) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useCallback evita recrear la función en cada render
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const registros = await res.json();

      const stats = registros.reduce((acc, r) => {
        let existing = acc.find(e => e.date === r.date);
        if (!existing) {
          existing = { date: r.date, tardanzas: 0, salidasTempranas: 0 };
          acc.push(existing);
        }

        if (r.entry_result === "Tarde") existing.tardanzas += 1;
        if (r.exit_result === "Salió antes") existing.salidasTempranas += 1;

        return acc;
      }, []);

      stats.sort((a, b) => new Date(a.date) - new Date(b.date));

      setData(stats);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, apiKey]);

  // Ejecutar automáticamente al montar el componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Retornamos la función para poder refrescar manualmente
  return { data, loading, error, refetch: fetchData };
};

export default useAccessStats;
