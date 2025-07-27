import express from "express";
import employeesController from "../controllers/employeesController.js";

const router = express.Router();

// Ruta para obtener empleados por ID de equipo
router.get("/team/:teamId", employeesController.getEmployeesByTeam); 

// Ruta para obtener empleado por ID
router.get("/:id", employeesController.getEmployeeById);


// Obtener todos los empleados
router.get("/", employeesController.getEmployees);

// Actualizar y eliminar empleado por ID
router
  .route("/:id")
  .put(employeesController.updateEmployees)
  .delete(employeesController.deleteEmployees);

export default router;
