import express from "express";
import accessControlController from "../controllers/accessControlController.js";

const router = express.Router();

router.get("/", accessControlController.getAllAccessRecords);
router.get("/:id", accessControlController.getAccessRecordById);
router.post("/", accessControlController.createOrUpdateAccessRecord);
router.delete("/:id", accessControlController.deleteAccessRecord);

export default router;
