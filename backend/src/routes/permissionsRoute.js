// src/routes/permissionsRoute.js
import express from "express";
import permissionsController from "../controllers/permissionsController.js";
import verifyToken from "../middleware/verifyToken.js";
import multer from "multer";

const upload = multer({ dest: "public/permissions/" }); // asegúrate que exista la carpeta

const router = express.Router();

// Crear nuevo permiso (archivo opcional -> campo "supportingDocumentFile")
router
  .route("/")
  .post(
    verifyToken,
    upload.single("supportingDocumentFile"),
    permissionsController.InsertPermission
  )
  .get(verifyToken, permissionsController.getAllPermissions);

// Mis permisos
router.get("/mine", verifyToken, permissionsController.getMyPermissions);

// Permisos del equipo (coordinadores)
router.get("/team", verifyToken, permissionsController.getTeamPermissions);

// Descargar documento adjunto
router.get("/:id/document", verifyToken, permissionsController.getDocument);

// Ver uno (detalle) y borrar
router
  .route("/:id")
  .get(verifyToken, permissionsController.getOne)
  .delete(verifyToken, permissionsController.deleteOne);

// Cambiar estado (coord/admin)
router.patch("/:id/status", verifyToken, permissionsController.updateStatus);

// Borrar todos (solo admin, requiere ?confirm=REMOVE)
router.delete("/clear/all", verifyToken, permissionsController.clearAllPermissions);

export default router;
