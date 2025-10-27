import { Router } from "express";
import {
  getUserById,
  getUserByEmployeeCode,
} from "../controllers/usersController.js";

const router = Router();

// ⚠️ IMPORTANTE: Las rutas más específicas DEBEN ir PRIMERO
// GET /api/users/search/code/:employeeCode - Buscar por código de empleado
router.get("/search/code/:employeeCode", getUserByEmployeeCode);

// GET /api/users/:id - Buscar por ID (va después de las rutas específicas)
router.get("/:id", getUserById);

export default router;
