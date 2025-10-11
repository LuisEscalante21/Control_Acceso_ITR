import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import useAccessStats from "../../../hooks/widgets/useAccessStats.jsx";

const AttendanceChart = () => {
  // Variables de entorno
  const url = import.meta.env.VITE_BASE_URL;
  const port = import.meta.env.VITE_PORT_ACCESS;
  const API_URL = `${url}${port}/api/access`;
  const API_KEY = import.meta.env.VITE_API_ACCESS_KEY;

  const { data, loading, error } = useAccessStats(API_URL, API_KEY);

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p>Error al cargar datos</p>;
  if (!data || data.length === 0) return <p>No hay registros disponibles</p>;

  // Adaptar datos para Recharts
  const chartData = data.map((item, index) => ({
    day: `Día ${index + 1}`,
    tardanzas: Number(item.tardanzas) || 0,
    salidasTempranas: Number(item.salidasTempranas) || 0,
  }));

  return (
    <div style={{ width: "100%", height: "300px" }}>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="tardanzas" stroke="#0900b9ff" strokeWidth={2} />
          <Line type="monotone" dataKey="salidasTempranas" stroke="#b30000ff" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;
