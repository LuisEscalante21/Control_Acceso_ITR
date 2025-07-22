import express from "express";
import teamsController from "../controllers/teamsController.js";

const router = express.Router();

router
  .route("/")
  .get(teamsController.getTeam)
  .post(teamsController.insertTeam);

router
  .route("/:id")
  .put(teamsController.updateTeam)
  .delete(teamsController.deleteTeam);

export default router;