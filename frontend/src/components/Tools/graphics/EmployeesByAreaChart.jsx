import React, { useMemo } from "react";
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
  const chartDataRaw = useChartEmployeesByTeam();

  const chartData = useMemo(() => chartDataRaw || [], [chartDataRaw]);

  if (!chartData || chartData.length === 0) return <p>Cargando datos...</p>;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="Empleados"
          stroke="#0a00beff"
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default React.memo(EmployeesByAreaChart);
