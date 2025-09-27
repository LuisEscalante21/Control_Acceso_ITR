import React from "react";
import { useGenerateReport } from "../../../hooks/Global/useGenerateReport";

export default function GenerateReportButton({ userId }) {
  const { generateReport, loading } = useGenerateReport();

  return (
    <button onClick={() => generateReport(userId)} disabled={loading} className="btn-report">
      {loading ? "Generando..." : "Generar Reporte PDF"}
    </button>
  );
}
