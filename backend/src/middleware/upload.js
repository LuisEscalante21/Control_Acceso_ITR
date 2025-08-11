
import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype.startsWith("image/") || file.mimetype === "application/pdf";
    if (!ok) return cb(new Error("Solo se permiten imágenes o PDF."));
    cb(null, true);
  },
});
