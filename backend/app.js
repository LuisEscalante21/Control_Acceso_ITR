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
import teamsRoutes from "./src/routes/teamsRoutes.js";
import ScheduleRoutes from "./src/routes/schedules.js";
import usersRoutes from "./src/routes/UserRoute.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import recoveryPasswordRoutes from "./src/routes/recoveryPasswordRoutes.js";

const app = express();

// Configurar CORS
const corsOptions = {
  origin: "http://localhost:5173", // 👈 aquí pones la URL de tu frontend
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));


// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json());
app.use(cookieParser());

// Documentación Swagger
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.resolve("./Documentacion.json"), "utf-8")
);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rutas públicas
app.use("/api/login", loginRoutes);
app.use("/api/registerEmployees", registerEmployeesRoutes);
app.use("/api/registerAdministrators", registerAdministratorsRoutes);
app.use("/api/registerCoordinators", registerCoordinatorsRoutes);
app.use("/api/recoveryPassword", recoveryPasswordRoutes);
app.use("/api/forcePasswordUpdate", newPasswordRoutes);

// Rutas privadas (requieren autenticación)
app.use("/api/checkAuth", authRoutes);
app.use("/api/employee", authMiddleware, employeeRoutes);
app.use("/api/schedules", authMiddleware, ScheduleRoutes);
app.use("/api/logout", authMiddleware, logoutRoutes);
app.use("/api/coordinators", authMiddleware, coordinatorsRoutes);
app.use("/api/administrators", authMiddleware, administratorsRoutes);
app.use("/api/teams", authMiddleware, teamsRoutes);
app.use("/api/permissions", authMiddleware, permissionsRoutes);
app.use("/api/justifications", authMiddleware, justificationsRoutes);
app.use("/api/users", authMiddleware, usersRoutes);
app.use("/api/profile", authMiddleware, profileRoutes);

export default app;
