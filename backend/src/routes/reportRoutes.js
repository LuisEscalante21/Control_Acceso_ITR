import { Router } from "express";
import generateReportController from "../controllers/generateReportController.js";

const router = Router();

// Ruta para generar el reporte PDF de un usuario por su ID
router.get("/user/:userId/report", generateReportController.generateUserReport);

export default router;
