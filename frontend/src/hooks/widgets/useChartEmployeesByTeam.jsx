import { useMemo } from "react";
import useDataTeams from "../../hooks/admin/useDataTeams";
import useDataEmployee from "../../hooks/admin/useDataEmployee";

const useChartEmployeesByTeam = () => {
  const { teams } = useDataTeams();
  const { employees } = useDataEmployee();

  const chartData = useMemo(() => {
    if (!teams.length || !employees.length) return [];

    // Crear un mapa de conteo por IdTeam
    const teamCountMap = employees.reduce((acc, emp) => {
      const teamId = typeof emp.IdTeam === "string" ? emp.IdTeam : emp.IdTeam?._id;
      if (teamId) {
        acc[teamId] = (acc[teamId] || 0) + 1;
      }
      return acc;
    }, {});

    // Mapear al formato que Recharts necesita
    return teams.map((team) => ({
      label: team.name,
      Empleados: teamCountMap[team._id] || 0,
    }));
  }, [teams, employees]);

  return chartData;
};

export default useChartEmployeesByTeam;
