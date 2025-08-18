import React, { useRef } from "react";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title } from "chart.js";
import { Bar } from "react-chartjs-2";
import useAccessStats from "../../../hooks/widgets/useAccessStats.jsx";

// Registrar los elementos de Chart.js
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const AttendanceChart = () => {
  const API_URL = "http://localhost:4800/api/access";
  const API_KEY = import.meta.env.VITE_API_ACCESS_KEY;
  const { data, loading, error } = useAccessStats(API_URL, API_KEY);

  const chartRef = useRef();

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p>Error al cargar datos: {error.message}</p>;
  if (!data || !data.length) return <p>No hay registros disponibles</p>;

  // Preparar labels y datasets
  const labels = data.map(item => item.area || item.department || "Sin área");

  const llegadasTardes = data.map(item => item.llegadasTardes ?? item.tardanzas ?? 0);
  const llegadasTempranas = data.map(item => item.llegadasTempranas ?? item.salidasTempranas ?? 0);

  const chartData = {
    labels: labels,
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

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Estadísticas de asistencia por área",
      },
    },
    layout: {
      padding: 0,
    },
    scales: {
      x: {
        ticks: { font: { size: 12 } }
      },
      y: {
        beginAtZero: true,
        ticks: { font: { size: 12 } }
      }
    }
  };

  // Función para randomizar los datos
  const randomize = () => {
    if (chartRef.current) {
      chartRef.current.data.datasets.forEach(dataset => {
        dataset.data = dataset.data.map(() => Math.floor(Math.random() * 100));
      });
      chartRef.current.update();
    }
  };

  return (
    <div style={{ width: "100%", height: "240px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", height: "200px" }}>
        <Bar
          ref={chartRef}
          data={chartData}
          options={options}
          style={{ maxWidth: "100%", maxHeight: "200px" }}
        />
      </div>
      <button
        onClick={randomize}
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
        Randomize
      </button>
    </div>
  );
};

export default AttendanceChart;