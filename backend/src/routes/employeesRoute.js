import express from "express";
import employeesController from "../controllers/employeesController.js";

const router = express.Router();

router
  .route("/")
  .get(employeesController.getEmployees);

// 🔍 Buscar por ID o TeamID
router.get("/search", employeesController.getEmployee);

router
  .route("/:id")
  .put(employeesController.updateEmployees)
  .delete(employeesController.deleteEmployees);

export default router;
