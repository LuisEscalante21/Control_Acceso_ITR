import express from "express";
import mapController from "../controllers/mapFacesController.js";

const router = express.Router();

router.route("/").post(mapController.mapFace);

export default router;

