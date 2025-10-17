import { Router } from "express";
import { getUserById, getUserByEmployeeCode } from "../controllers/usersController.js";

const router = Router();

// GET /api/users/:id - Buscar por ID
router.get("/:id", getUserById);

// GET /api/users/search/code/:employeeCode - Buscar por código de empleado
router.get("/search/code/:employeeCode", getUserByEmployeeCode);

export default router;