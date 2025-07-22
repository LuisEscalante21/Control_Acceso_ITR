import express from "express";
import registerEmployeesController from "../controllers/registerEmployeesController.js";
import multer from "multer";

const router = express.Router();

const upload = multer({dest: "public/employees/"})

router.route("/")
.post(upload.single("photo"), registerEmployeesController.register);

export default router;