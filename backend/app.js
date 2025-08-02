// Importo todo lo de la libreria de Express
import express from "express";
import bodyParser from "body-parser";
import employeeRoutes from "./src/routes/employeesRoute.js"
import coordinatorsRoutes from "./src/routes/coordinatorsRoutes.js"
import administratorsRoutes from "./src/routes/administratorsRoutes.js";
import registerAdministratorsRoutes from "./src/routes/registerAdministrators.js";
import loginRoutes from "./src/routes/login.js"
import permissionsRoutes from "./src/routes/permissionsRoute.js";
import justificationsRoutes from "./src/routes/justificationsRoutes.js";
import cookieParser from "cookie-parser"
import logoutRoutes from "./src/routes/logout.js"
import registerEmployeesRoutes from "./src/routes/registerEmployees.js";
import cors from 'cors';
import authRoutes from "./src/routes/authRoutes.js";
import registerCoordinatorsRoutes from "./src/routes/registerCoordinators.js";
import teamsRoutes from "./src/routes/teamsRoutes.js";
import ScheduleRoutes from "./src/routes/schedules.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";

const app = express();

// Configurar CORS
app.use(cors({
  origin: 'http://localhost:5173', // Permitir solicitudes desde el frontend
  credentials: true // Si necesitas enviar cookies o encabezados de autenticación
}));

// Aumenta el límite a 10mb (puedes ajustar según lo que necesites)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Que acepte datos en json
app.use(express.json());
// Que acepte cookies
app.use(cookieParser());

//Traemos el archivo json
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.resolve("./Documentacion.json"), "utf-8")
);

// Ruta para acceder a la documentación de la API
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());

// Definir las rutas de la API
app.use("/api/employee", employeeRoutes) // Ruta para los empleados
app.use("/api/schedules", ScheduleRoutes); // Ruta para los horarios
app.use("/api/login", loginRoutes)  // Ruta para iniciar sesión
app.use("/api/logout", logoutRoutes) // Ruta para cerrar sesión
app.use("/api/registerEmployees", registerEmployeesRoutes) // Ruta para registrar empleados
app.use("/api/registerAdministrators", registerAdministratorsRoutes); // Ruta para registrar administradores
app.use("/api/checkAuth", authRoutes); // Agregar las rutas de autenticación
app.use("/api/coordinators", coordinatorsRoutes); // Ruta para coordinadores
app.use("/api/registerCoordinators", registerCoordinatorsRoutes); // Ruta para registrar coordinadores
app.use("/api/administrators", administratorsRoutes); // Ruta para administradores
app.use("/api/teams", teamsRoutes); // Ruta para las areas o departamentos
app.use("/api/permissions", permissionsRoutes); // Ruta para los permisos
app.use("/api/justifications", justificationsRoutes); // Ruta para las justificaciones

// Exporto la constante para poder usar express en otros archivos
export default app;