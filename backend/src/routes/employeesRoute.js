import express from "express";
import multer from "multer";
import employeesController from "../controllers/employeesController.js";

const router = express.Router();
const upload = multer({ dest: "public/employees/" });

// Obtener todos los empleados o filtrar por teamId con query
router.get("/", employeesController.getEmployees);

// Obtener empleado por ID (parámetro en la URL)
router.get("/:id", employeesController.getEmployeeById);

// Actualizar empleado con posible imagen
router.put("/:id", upload.single("photo"), employeesController.updateEmployees);

// Eliminar empleado
router.delete("/:id", employeesController.deleteEmployees);

export default router;
