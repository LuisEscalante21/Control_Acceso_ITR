// src/middleware/uploadPermissions.js
import multer from "multer";
import path from "path";
import fs from "fs";

const dest = "tmp/permissions";
if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

// Tipos de archivo permitidos (igual que en tu controller)
const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/jpg",
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dest),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname); // .pdf / .png / .doc ...
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ok = allowedTypes.includes(file.mimetype);
  if (ok) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG"), false);
  }
};

export const uploadPermissions = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
