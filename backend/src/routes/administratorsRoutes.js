import { Router } from "express";
import multer from "multer";
import administratorsController from "../controllers/administratorsController.js";
import { validateUniqueNumEmpleado } from "../middleware/validateUniqueNumEmpleado.js";

const router = Router();

// Configuración básica de multer (carpeta temporal)
const upload = multer({ dest: "public/administrators/" });

// GET todos los administradores
router.get("/", administratorsController.getAdministrators);

// GET un administrador por ID
router.get("/:id", administratorsController.getAdministratorById);

// POST - Crear administrador con validación de numEmpleado único
router.post(
  "/",
  upload.single("photo"),
  validateUniqueNumEmpleado("administrators", false), // false = creación
  administratorsController.createAdministrator
);

// PUT - Actualizar administrador con validación de numEmpleado único
router.put(
  "/:id",
  upload.single("photo"),
  validateUniqueNumEmpleado("administrators", true), // true = edición
  administratorsController.updateAdministrator
);

// DELETE - Eliminar administrador
router.delete("/:id", administratorsController.deleteAdministrator);

export default router;
