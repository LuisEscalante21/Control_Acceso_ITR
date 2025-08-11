// src/routes/permissionsRoute.js
import express from "express";
import permissionsController from "../controllers/permissionsController.js";
import verifyToken from "../middleware/verifyToken.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// Crear nuevo permiso (archivo opcional -> campo "supportingDocumentFile")
router
  .route("/")
  .post(verifyToken, upload.single("supportingDocumentFile"), permissionsController.InsertPermission)
  .get(verifyToken, permissionsController.getAllPermissions);

// Mis permisos
router
  .route("/mine")
  .get(verifyToken, permissionsController.getMyPermissions);

// Permisos del equipo (coordinadores)
router
  .route("/team")
  .get(verifyToken, permissionsController.getTeamPermissions);

// Ver uno (detalle)
router
  .route("/:id")
  .get(verifyToken, permissionsController.getOne)
  .delete(verifyToken, permissionsController.deleteOne);

// Cambiar estado (coord/admin)
router
  .route("/:id/status")
  .patch(verifyToken, permissionsController.updateStatus);

// Borrar todos (solo admin, requiere ?confirm=REMOVE)
router
  .route("/clear/all")
  .delete(verifyToken, permissionsController.clearAllPermissions);
// Descargar documento adjunto
router
.get("/:id", verifyToken, permissionsController.getOne);
router
.get("/:id/document", verifyToken, permissionsController.getDocument);
export default router;
