import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import useChartEmployeesByTeam from "../../../hooks/widgets/useChartEmployeesByTeam.jsx";

const EmployeesByAreaChart = () => {
  const chartData = useChartEmployeesByTeam();

  if (!chartData) return <p>Cargando datos...</p>;
  
  const formattedData = Array.isArray(chartData)
    ? chartData
    : chartData.labels.map((label, i) => ({
        label,
        value: chartData.datasets[0].data[i] || 0
      }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#0a00beff"
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default EmployeesByAreaChart;
