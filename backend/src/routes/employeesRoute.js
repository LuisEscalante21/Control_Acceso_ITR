import express from "express";
import multer from "multer";
import employeesController from "../controllers/employeesController.js";

const router = express.Router();

// Configuración básica de multer (carpeta temporal)
const upload = multer({ dest: "public/employees/" });

// Obtener todos los empleados
router.route("/").get(employeesController.getEmployees);

// Buscar empleado por ID o TeamID
router.get("/search", employeesController.getEmployee);

// Actualizar empleado con imagen y eliminar empleado
router
  .route("/:id")
  .put(upload.single("photo"), employeesController.updateEmployees)
  .delete(employeesController.deleteEmployees);

export default router;
