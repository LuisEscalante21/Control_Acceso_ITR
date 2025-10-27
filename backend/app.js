import express from "express";
import bodyParser from "body-parser";
import { config } from './src/config.js';
import { authMiddleware } from './src/middleware/authMiddleware.js';
import employeeRoutes from "./src/routes/employeesRoute.js";
import coordinatorsRoutes from "./src/routes/coordinatorsRoutes.js";
import administratorsRoutes from "./src/routes/administratorsRoutes.js";
import registerAdministratorsRoutes from "./src/routes/registerAdministrators.js";
import loginRoutes from "./src/routes/login.js";
import newPasswordRoutes from "./src/routes/newPassController.js";
import permissionsRoutes from "./src/routes/permissionsRoute.js";
import justificationsRoutes from "./src/routes/justificationsRoutes.js";
import cookieParser from "cookie-parser";
import logoutRoutes from "./src/routes/logout.js";
import registerEmployeesRoutes from "./src/routes/registerEmployees.js";
import cors from 'cors';
import authRoutes from "./src/routes/authRoutes.js";
import registerCoordinatorsRoutes from "./src/routes/registerCoordinators.js";
import absences from "./src/routes/absenceRoutes.js";
import teamsRoutes from "./src/routes/teamsRoutes.js";
import ScheduleRoutes from "./src/routes/schedules.js";
import usersRoutes from "./src/routes/UserRoute.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import recoveryPasswordRoutes from "./src/routes/recoveryPasswordRoutes.js";
import reportRoutes from "./src/routes/reportRoutes.js";
import limiter from './src/middleware/rateLimiter.js';

const app = express();

// Configurar CORS
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://10.10.3.205", 
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));


// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(limiter); // Aplicar el limitador de velocidad a todas las rutas

// Documentación Swagger
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.resolve("./Documentacion.json"), "utf-8")
);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rutas públicas
app.use("/api/login", loginRoutes); // Ruta de login
app.use("/api/registerEmployees", registerEmployeesRoutes); // Nueva ruta para registrar empleados
app.use("/api/registerAdministrators", registerAdministratorsRoutes); // Nueva ruta para registrar administradores
app.use("/api/registerCoordinators", registerCoordinatorsRoutes); // Nueva ruta para registrar coordinadores
app.use("/api/recoveryPassword", recoveryPasswordRoutes); // Para recuperación de contraseña
app.use("/api/forcePasswordUpdate", newPasswordRoutes); // Para forzar cambio de contraseña

// Rutas privadas (requieren autenticación)
app.use("/api/checkAuth", authRoutes); // Ruta para verificar token
app.use("/api/employee", authMiddleware, employeeRoutes); // Rutas de empleados
app.use("/api/schedules", authMiddleware, ScheduleRoutes); // Rutas de horarios
app.use("/api/logout", authMiddleware, logoutRoutes); // Rutas de logout
app.use("/api/coordinators", authMiddleware, coordinatorsRoutes); // Rutas de coordinadores
app.use("/api/administrators", authMiddleware, administratorsRoutes); // Rutas de administradores
app.use("/api/teams", teamsRoutes); // Rutas de equipos
app.use("/api/permissions", authMiddleware, permissionsRoutes); // Rutas de permisos
app.use("/api/justifications", authMiddleware, justificationsRoutes); // Rutas de justificaciones
app.use("/api/reports", authMiddleware, reportRoutes); // Rutas de reportes
app.use("/api/users", usersRoutes); // Rutas de gestión de usuarios
app.use("/api/profile", authMiddleware, profileRoutes); // Rutas de perfil
app.use("/api/absences",authMiddleware, absences); // Rutas de inasistencias

export default app;