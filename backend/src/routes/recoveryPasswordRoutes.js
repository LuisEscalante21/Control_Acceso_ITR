import express from "express";
import passwordRecoveryController from "../controllers/recoveryPasswordController.js";

const router = express.Router();

// 1 Solicitar código de verificación
router.route("/requestCode").post(passwordRecoveryController.requestCode);

// 2 Verificar código
router.route("/verifyCode").post(passwordRecoveryController.verifyCode);

// 3 Establecer nueva contraseña
router.route("/newPassword").post(passwordRecoveryController.newPassword);

export default router;
