// routes/justifications.routes.js
import express from "express";
import multer from "multer";
import justificationsController from "../controllers/justificationsController.js";

const router = express.Router();
const upload = multer({ dest: "public/justifications/" });


router.get("/", justificationsController.getJustifications);
router.get("/:id", justificationsController.getJustificationById);
router.post("/", upload.single("evidencia"), justificationsController.createJustification);
router.put("/:id", upload.single("evidencia"), justificationsController.updateJustification);
router.delete("/:id", justificationsController.deleteJustification);

export default router;
