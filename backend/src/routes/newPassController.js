import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { forcePasswordUpdateController } from "../controllers/newPassController.js";

const router = Router();

// POST /api/forcePasswordUpdate
router.post("/", requireAuth, forcePasswordUpdateController);

export default router;
