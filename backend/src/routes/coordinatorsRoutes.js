import { Router } from "express";
import multer from "multer";
import coordinatorsController from "../controllers/coordinatorsController.js";
import { validateUniqueNumEmpleado } from "../middleware/validateUniqueNumEmpleado.js";

const router = Router();

// Configuración básica de multer (carpeta temporal)
const upload = multer({ dest: "public/coordinators/" });

// GET - Obtener todos los coordinadores
router.get("/", coordinatorsController.getCoordinators);

// GET - Obtener un coordinador por ID
router.get("/:id", coordinatorsController.getCoordinatorById);

// POST - Crear coordinador con validación de numEmpleado único
router.post(
  "/",
  upload.single("photo"),
  validateUniqueNumEmpleado("coordinators", false), // false = creación
  coordinatorsController.createCoordinator
);

// PUT - Actualizar coordinador con validación de numEmpleado único
router.put(
  "/:id",
  upload.single("photo"),
  validateUniqueNumEmpleado("coordinators", true), // true = edición
  coordinatorsController.updateCoordinator
);

// DELETE - Eliminar coordinador
router.delete("/:id", coordinatorsController.deleteCoordinator);

export default router;
