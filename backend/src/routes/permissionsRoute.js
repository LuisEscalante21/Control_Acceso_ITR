import express from "express";
import permissionsController from "../controllers/permissionsController.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// Crear nuevo permiso (Empleado o Coordinador autenticado)
router
  .route("/")
  .post(verifyToken, permissionsController.InsertPermission);

// Obtener todos los permisos (solo para los Admin)
router
  .route("/")
  .get(verifyToken, permissionsController.getAllPermissions);

// Obtener permisos propios del usuario autenticado
router
  .route("/mine")
  .get(verifyToken, permissionsController.getMyPermissions);

// Obtener permisos del equipo (solo para Coordinador)
router
  .route("/team")
  .get(verifyToken, permissionsController.getTeamPermissions);

// Cambiar estado del permiso (solo Coordinador o Admin)
router
  .route("/:id/status")
  .patch(verifyToken, permissionsController.updateStatus);

// Eliminar permiso (solo Coordinador o Admin)
router
  .route("/:id")
  .delete(verifyToken, permissionsController.clearAllPermissions);

export default router;
