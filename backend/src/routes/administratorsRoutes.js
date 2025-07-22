import { Router } from "express";
import administratorsController from "../controllers/administratorsController.js";

const router = Router();

// Rutas para Administradores
router.get("/", administratorsController.getAdministrators); // Obtener todos los administradores
router.delete("/:id", administratorsController.deleteAdministrator); // Eliminar un administrador por ID
router.put("/:id", administratorsController.updateAdministrator); // Actualizar un administrador por ID

export default router;