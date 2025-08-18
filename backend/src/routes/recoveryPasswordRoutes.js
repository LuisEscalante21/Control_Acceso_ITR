import { Router } from "express";
import { recoveryPasswordController } from "../controllers/recoveryPasswordController.js";

const router = Router();

// POST /api/recoveryPassword
router.post("/", (req, res, next) => {
  console.log("[API] POST /api/recoveryPassword", req.body);
  next();
}, recoveryPasswordController);

export default router;
