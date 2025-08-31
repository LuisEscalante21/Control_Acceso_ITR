import React, { useEffect, useMemo, useCallback } from "react";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title } from "chart.js";
import { Bar } from "react-chartjs-2";
import useAccessStats from "../../../hooks/widgets/useAccessStats.jsx";
import debounce from "lodash.debounce";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const AttendanceChart = () => {
  const API_URL = "http://localhost:4800/api/access";
  const API_KEY = import.meta.env.VITE_API_ACCESS_KEY;
  const { data, loading, error, refetch } = useAccessStats(API_URL, API_KEY);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); 
    return () => clearInterval(interval);
  }, [refetch]);

  const handleRefetch = useCallback(debounce(refetch, 500), [refetch]);

  const chartData = useMemo(() => {
    if (!data) return { labels: [], datasets: [] };
    const labels = data.map(item => item.area || item.department || item.date || "Sin área");
    const llegadasTardes = data.map(item => item.llegadasTardes ?? item.tardanzas ?? 0);
    const llegadasTempranas = data.map(item => item.llegadasTempranas ?? item.salidasTempranas ?? 0);

    return {
      labels,
      datasets: [
        {
          label: "Llegadas tardes",
          data: llegadasTardes,
          borderColor: "rgba(204, 0, 0, 1)",
          backgroundColor: "rgba(255, 77, 79, 0.5)",
          borderWidth: 2,
          borderRadius: Number.MAX_VALUE,
          borderSkipped: false,
        },
        {
          label: "Llegadas tempranas",
          data: llegadasTempranas,
          borderColor: "rgba(24, 144, 255, 1)",
          backgroundColor: "rgba(24, 144, 255, 0.5)",
          borderWidth: 2,
          borderRadius: 5,
          borderSkipped: false,
        },
      ],
    };
  }, [data]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Estadísticas de asistencia por área" },
    },
    scales: {
      x: { ticks: { font: { size: 12 } } },
      y: { beginAtZero: true, ticks: { font: { size: 12 } } },
    },
  }), []);

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p>Error al cargar datos: {error.message}</p>;
  if (!data || data.length === 0) return <p>No hay registros disponibles</p>;

  return (
    <div style={{ width: "100%", height: "240px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", height: "200px" }}>
        <Bar data={chartData} options={options} />
      </div>
      <button
        onClick={handleRefetch}
        style={{
          marginTop: "10px",
          padding: "6px 16px",
          borderRadius: "8px",
          border: "none",
          background: "#0052cc",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        Refrescar ahora
      </button>
    </div>
  );
};

export default React.memo(AttendanceChart);
