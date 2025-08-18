import { useMemo } from "react";
import useDataTeams from "../../hooks/admin/useDataTeams";
import useDataEmployee from "../../hooks/admin/useDataEmployee";

const useChartEmployeesByTeam = () => {
  const { teams } = useDataTeams();
  const { employees } = useDataEmployee();

  const chartData = useMemo(() => {

    if (!teams.length) {
      return null;
    }

    // Contar empleados por team (robusto para objeto o string)
    const counts = teams.map((team) => {
      const total = employees.filter(
        (emp) =>
          (emp.IdTeam && emp.IdTeam._id === team._id) ||
          emp.IdTeam === team._id
      ).length;
      return { team: team.name, total };
    });

    return {
      labels: counts.map((c) => c.team),
      datasets: [
        {
          label: "Cantidad de empleados por área",
          data: counts.map((c) => c.total),
          borderColor: "rgba(34, 47, 162, 1)",
          backgroundColor: "rgba(167, 177, 215, 0.5)",
          pointStyle: "circle",
          pointRadius: 8,
          pointHoverRadius: 12,
        },
      ],
    };
  }, [teams, employees]);

  return chartData;
};

export default useChartEmployeesByTeam;