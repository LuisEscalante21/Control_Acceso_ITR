// src/middlewares/requireAuth.js
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export default function requireAuth(req, res, next) {
  const token = req.cookies?.authToken;
  if (!token) return res.status(401).json({ message: "No autorizado" });
  try {
    const dec = jwt.verify(token, config.JWT.secret);
    req.user = dec; // { id, userType, ... }
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}
