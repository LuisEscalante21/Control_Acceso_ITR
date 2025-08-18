import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";
import useChartEmployeesByTeam from "../../../hooks/widgets/useChartEmployeesByTeam.jsx";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const EmployeesByAreaChart = () => {
  const chartData = useChartEmployeesByTeam();

  if (!chartData) return <p>Cargando datos...</p>;

  const config = {
    type: "line",
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Cantidad de empleados por área"
        }
      }
    }
  };

  return <Line data={chartData} options={config.options} />;
};

export default EmployeesByAreaChart;
