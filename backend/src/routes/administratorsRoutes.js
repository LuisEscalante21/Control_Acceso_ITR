import { Router } from "express";
import multer from "multer";
import administratorsController from "../controllers/administratorsController.js";

const router = Router();

// Configuración básica de multer (carpeta temporal)
const upload = multer({ dest: "public/administrators/" });

// Rutas para Administradores
router.route("/").get(administratorsController.getAdministrators);

router
  .route("/:id")
  .put(upload.single("photo"), administratorsController.updateAdministrator)
  .delete(administratorsController.deleteAdministrator);

export default router;
