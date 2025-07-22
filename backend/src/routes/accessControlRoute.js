import express from "express";
import accessControlController from "../controllers/accessControlController.js";

const router = express.Router();

router.get("/", accessControlController.getAllAccessRecords);
router.get("/:id", accessControlController.getAccessRecordById);
router.post("/", accessControlController.createAccessRecord);
router.put("/:id", accessControlController.updateAccessRecord);
router.delete("/:id", accessControlController.deleteAccessRecord);

export default router;