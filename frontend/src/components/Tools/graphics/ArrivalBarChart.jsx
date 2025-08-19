import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

/**
 * @param {Array} accessRecords - Registros de acceso filtrados por área
 */
const ArrivalBarChart = ({ accessRecords }) => {
  // Agrupa por resultado de entrada y calcula hora promedio
  const data = useMemo(() => {
    const result = { "A tiempo": [], "Tarde": [] };
    accessRecords.forEach((reg) => {
      if (reg.entry_time && reg.entry_result) {
        const hora = new Date(reg.entry_time).getHours() + new Date(reg.entry_time).getMinutes() / 60;
        if (reg.entry_result === "A tiempo") result["A tiempo"].push(hora);
        if (reg.entry_result === "Tarde") result["Tarde"].push(hora);
      }
    });
    // Calcula promedio
    return [
      {
        name: "A tiempo",
        promedio: result["A tiempo"].length
          ? (result["A tiempo"].reduce((a, b) => a + b, 0) / result["A tiempo"].length).toFixed(2)
          : 0,
      },
      {
        name: "Tarde",
        promedio: result["Tarde"].length
          ? (result["Tarde"].reduce((a, b) => a + b, 0) / result["Tarde"].length).toFixed(2)
          : 0,
      },
    ];
  }, [accessRecords]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis domain={[6, 12]} tickFormatter={(v) => `${Math.floor(v)}:${Math.round((v % 1) * 60).toString().padStart(2, "0")}`} />
        <Tooltip formatter={(value) => `${Math.floor(value)}:${Math.round((value % 1) * 60).toString().padStart(2, "0")}`} />
        <Legend />
        <Bar dataKey="promedio" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ArrivalBarChart;