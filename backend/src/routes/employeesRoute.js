import express from "express";
import multer from "multer";
import employeesController from "../controllers/employeesController.js";

const router = express.Router();
const upload = multer({ dest: "public/employees/" });

router.get("/search", employeesController.getEmployee);   
router.get("/", employeesController.getEmployees);
router.get("/:id", employeesController.getEmployeeById);
router.put("/:id", upload.single("photo"), employeesController.updateEmployees);
router.delete("/:id", employeesController.deleteEmployees);

export default router;
