import express from "express";
import registerCoordinatorsController from "../controllers/registerCoordinatorsController.js";
import multer from "multer";

const router = express.Router();

const upload = multer({dest: "public/coordinators/"})

router.route("/")
.post(upload.single("photo"), registerCoordinatorsController.register);

export default router;