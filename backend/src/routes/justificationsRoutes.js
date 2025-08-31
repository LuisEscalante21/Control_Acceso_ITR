import express from "express";
import multer from "multer";
import justificationsController from "../controllers/justificationsController.js";

const router = express.Router();

// Configuración de multer para evidencia (archivos)
const upload = multer({ dest: "public/justifications/" });

// 🔹 Obtener todas las justificaciones
router.get("/", justificationsController.getJustifications);

// 🔹 Obtener una justificación por ID
router.get("/:id", justificationsController.getJustificationById);

// 🔹 Crear nueva justificación (con archivo opcional)
router.post(
  "/",
  upload.single("evidencia"), // Campo de archivo: "evidencia"
  justificationsController.createJustification
);

// 🔹 Actualizar justificación existente (con archivo opcional)
router.put(
  "/:id",
  upload.single("evidencia"),
  justificationsController.updateJustification
);

// 🔹 Eliminar justificación individual
router.delete("/:id", justificationsController.deleteJustification);

// 🔹 Eliminar todas las justificaciones
router.delete("/", justificationsController.deleteAllJustifications);

export default router;
