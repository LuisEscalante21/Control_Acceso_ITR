import { useMemo } from "react";
import useDataTeams from "../../hooks/admin/useDataTeams";
import useDataEmployee from "../../hooks/admin/useDataEmployee";

const useChartEmployeesByTeam = () => {
  const { teams } = useDataTeams();
  const { employees } = useDataEmployee();

  const chartData = useMemo(() => {
    if (!teams.length) return null;

    // Contar empleados por equipo
    const formatted = teams.map((team) => {
      const total = employees.filter((emp) => {
        if (!emp.IdTeam) return false;
        // Compatibilidad si IdTeam es objeto o string
        if (typeof emp.IdTeam === "string") return emp.IdTeam === team._id;
        if (typeof emp.IdTeam === "object") return emp.IdTeam._id === team._id;
        return false;
      }).length;

      return {
        label: team.name,
        Empleados: total,
      };
    });

    return formatted;
  }, [teams, employees]);

  return chartData;
};

export default useChartEmployeesByTeam;
