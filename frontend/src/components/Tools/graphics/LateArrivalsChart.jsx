import React, { useEffect, useMemo, useCallback } from "react";
import { Sparklines, SparklinesBars } from "react-sparklines";
import useAccessStats from "../../../hooks/widgets/useAccessStats.jsx";
import debounce from "lodash.debounce";

const AttendanceChart = () => {
  const API_URL = "http://localhost:4800/api/access";
  const API_KEY = import.meta.env.VITE_API_ACCESS_KEY;
  const { data, loading, error, refetch } = useAccessStats(API_URL, API_KEY);

  useEffect(() => {
    const interval = setInterval(() => refetch(), 30000); 
    return () => clearInterval(interval);
  }, [refetch]);

  const handleRefetch = useCallback(debounce(refetch, 500), [refetch]);

  const llegadasTardes = useMemo(
    () => (data?.map(item => item.llegadasTardes ?? item.tardanzas ?? 0) || []),
    [data]
  );

  const llegadasTempranas = useMemo(
    () => (data?.map(item => item.llegadasTempranas ?? item.salidasTempranas ?? 0) || []),
    [data]
  );

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p>Error al cargar datos: {error.message}</p>;
  if (!data || data.length === 0) return <p>No hay registros disponibles</p>;

  return (
    <div style={{ width: "100%", padding: "10px" }}>
      <h3>Estadísticas de asistencia por área</h3>

      <div style={{ display: "flex", gap: "20px", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <p>Llegadas tardes</p>
          <Sparklines data={llegadasTardes} svgWidth={400} svgHeight={150}>
            <SparklinesBars style={{ fill: "rgba(255, 77, 79, 0.7)" }} />
          </Sparklines>
        </div>

        <div style={{ flex: 1 }}>
          <p>Llegadas tempranas</p>
          <Sparklines data={llegadasTempranas} svgWidth={400} svgHeight={150}>
            <SparklinesBars style={{ fill: "rgba(24, 144, 255, 0.7)" }} />
          </Sparklines>
        </div>
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
