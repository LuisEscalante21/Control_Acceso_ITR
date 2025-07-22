import { Router } from "express";
import coordinatorsController from "../controllers/coordinatorsController.js";

const router = Router();

// Rutas para Coordinadores
router.get("/", coordinatorsController.getCoordinators); // Obtener todos los coordinadores
router.delete("/:id", coordinatorsController.deleteCoordinator); // Eliminar un coordinador por ID
router.put("/:id", coordinatorsController.updateCoordinator); // Actualizar un coordinador por ID

export default router;