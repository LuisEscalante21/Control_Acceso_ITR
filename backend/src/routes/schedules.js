import { Router } from "express";
import schedulesController from "../controllers/schedulesController.js";

const router = Router();

router.get("/", schedulesController.getSchedules); 
router.post("/", schedulesController.insertSchedule); 
router.delete("/:id", schedulesController.deleteSchedule); 
router.put("/:id", schedulesController.updateSchedule);

export default router;
