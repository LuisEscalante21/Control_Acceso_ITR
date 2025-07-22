// routes/authRoutes.js
import express from "express";
import loginController from "../controllers/loginController.js";
import validarCorreo from "../middleware/validEmail.js"; // Importar el middleware

const router = express.Router();

// Ruta de login
router.post("/login", validarCorreo, loginController.login);

export default router;
