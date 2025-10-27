import express from "express";
import multer from "multer";
import employeesController from "../controllers/employeesController.js";
import { validateUniqueNumEmpleado } from "../middleware/validateUniqueNumEmpleado.js";

const router = express.Router();
const upload = multer({ dest: "public/employees/" });

// GET - Buscar empleados (por equipo u otros filtros)
router.get("/search", employeesController.getEmployee);

// GET - Obtener todos los empleados
router.get("/", employeesController.getEmployees);

// GET - Obtener un empleado por ID
router.get("/:id", employeesController.getEmployeeById);

// POST - Crear empleado con validación de numEmpleado único
router.post(
  "/",
  upload.single("photo"),
  validateUniqueNumEmpleado("employees", false), // false = creación
  employeesController.createEmployees
);

// PUT - Actualizar empleado con validación de numEmpleado único
router.put(
  "/:id",
  upload.single("photo"),
  validateUniqueNumEmpleado("employees", true), // true = edición
  employeesController.updateEmployees
);

// DELETE - Eliminar empleado
router.delete("/:id", employeesController.deleteEmployees);

export default router;
