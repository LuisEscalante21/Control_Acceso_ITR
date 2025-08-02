import { Router } from "express";
import multer from "multer";
import coordinatorsController from "../controllers/coordinatorsController.js";

const router = Router();

// Configuración básica de multer (carpeta temporal)
const upload = multer({ dest: "public/coordinators/" });

// Obtener todos los coordinadores
router.route("/").get(coordinatorsController.getCoordinators);

// Actualizar coordinador con imagen y eliminar coordinador
router
  .route("/:id")
  .put(upload.single("photo"), coordinatorsController.updateCoordinator)
  .delete(coordinatorsController.deleteCoordinator);

export default router;
