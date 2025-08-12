// src/middleware/uploadPermissions.js
import multer from "multer";
import path from "path";
import fs from "fs";

const dest = "tmp/permissions";
if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dest),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname); // .pdf / .png ...
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ok = file.mimetype.startsWith("image/") || file.mimetype === "application/pdf";
  cb(ok ? null : new Error("Solo se permiten imágenes o PDF."), ok);
};

export const uploadPermissions = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
