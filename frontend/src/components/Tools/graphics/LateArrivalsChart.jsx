import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import useAccessStats from "../../../hooks/widgets/useAccessStats.jsx";

const AttendanceChart = () => {
  const API_URL = "http://localhost:4800/api/access"; 
  const API_KEY = import.meta.env.VITE_API_ACCESS_KEY;

  const { data, loading, error } = useAccessStats(API_URL, API_KEY);

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p>Error al cargar datos: {error.message}</p>;
  if (!data.length) return <p>No hay registros disponibles</p>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="tardanzas" fill="#ff4d4f" name="Tardanzas" />
        <Bar dataKey="salidasTempranas" fill="#1890ff" name="Salidas tempranas" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AttendanceChart;
