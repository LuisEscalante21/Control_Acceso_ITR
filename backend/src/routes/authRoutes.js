import express from "express";
import authController from "../controllers/authController.js";

const router = express.Router();

// Ruta para verificar autenticación
router.route("/").get(authController.checkAuth);

export default router;