import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ArrivalBarChart = ({ accessRecords }) => {
  const data = useMemo(() => {
    if (!accessRecords?.length) {
      console.log("⚠️ No hay accessRecords");
      return [];
    }

    console.log("✅ accessRecords recibidos:", accessRecords);

    const today = new Date();
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(today.getDate() - 7);

    const recentRecords = accessRecords.filter((reg) => {
      if (
        !reg.entry_time ||
        !reg.entry_result ||
        !["entrada", "entrada y salida"].includes(reg.tipo_registro)
      ) {
        console.log("⏭️ Registro descartado:", reg);
        return false;
      }

      const entryDate = new Date(reg.entry_time);
      const valid =
        !isNaN(entryDate) && entryDate >= eightDaysAgo && entryDate <= today;

      if (!valid) {
        console.log("❌ Fecha fuera de rango:", reg.entry_time);
      }

      return valid;
    });

    console.log("📊 Registros filtrados:", recentRecords);

    const grouped = {};
    recentRecords.forEach((reg) => {
      const entryDate = new Date(reg.entry_time);
      const dayKey = entryDate.toISOString().split("T")[0];
      if (!grouped[dayKey])
        grouped[dayKey] = { "A tiempo": 0, "Tarde": 0, "Sin horario": 0 };

      if (reg.entry_result === "A tiempo") grouped[dayKey]["A tiempo"]++;
      else if (reg.entry_result === "Tarde") grouped[dayKey]["Tarde"]++;
      else grouped[dayKey]["Sin horario"]++;
    });

    const chartData = [];
    for (let i = 0; i < 8; i++) {
      const date = new Date();
      date.setDate(today.getDate() - (7 - i));
      const key = date.toISOString().split("T")[0];

      const record =
        grouped[key] || { "A tiempo": 0, "Tarde": 0, "Sin horario": 0 };
      chartData.push({
        name: key,
        aTiempo: record["A tiempo"],
        tarde: record["Tarde"],
        sinHorario: record["Sin horario"],
      });
    }

    console.log("📈 chartData final:", chartData);

    return chartData;
  }, [accessRecords]);


  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="aTiempo" fill="#4caf50" name="A tiempo" />
        <Bar dataKey="tarde" fill="#f44336" name="Tarde" />
        <Bar dataKey="sinHorario" fill="#9e9e9e" name="Sin horario" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ArrivalBarChart;
