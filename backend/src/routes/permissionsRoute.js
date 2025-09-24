// src/routes/permissionsRoute.js
import express from "express";
import permissionsController from "../controllers/permissionsController.js";
import verifyToken from "../middleware/verifyToken.js";

// 👇 usa tu middleware con filtro y límites
import { uploadPermissions } from "../middleware/upload.js";

const router = express.Router();

router
  .route("/")
  .post(
    verifyToken,
    uploadPermissions.single("supportingDocumentFile"),
    permissionsController.InsertPermission
  )
  .get(verifyToken, permissionsController.getAllPermissions);

// Mis permisos
router.get("/mine", verifyToken, permissionsController.getMyPermissions);

// Permisos del equipo (coordinadores)
router.get("/team", verifyToken, permissionsController.getTeamPermissions);

// Descargar / redirigir al documento adjunto
router.get("/:id/document", verifyToken, permissionsController.getDocument);

// Ver uno (detalle) y borrar uno
router
  .route("/:id")
  .get(verifyToken, permissionsController.getOne)
  .delete(verifyToken, permissionsController.deleteOne);

// Cambiar estado (coord/admin)
router.patch("/:id/status", verifyToken, permissionsController.updateStatus);

export default router;
