// src/hooks/Global/useDataCloudinary.jsx
import { useState, useCallback } from "react";
import Swal from "sweetalert2";

// Configuración Cloudinary
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || "permisos";

export default function useDataCloudinary() {
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(async (file) => {
    if (!file) return null;

    // Validar .env
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      console.error("Cloudinary env faltante: CLOUD_NAME o UPLOAD_PRESET");
      Swal.fire(
        "Configuración incompleta",
        "Revisa VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en tu .env",
        "warning"
      );
      return null;
    }

    // Permitimos imagen o PDF
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      Swal.fire("Archivo no permitido", "Solo se acepta imagen o PDF.", "error");
      return null;
    }

    // Endpoint según tipo: PDF → raw, Imagen → auto
    const resourceType = isPdf ? "raw" : "auto";
    const ENDPOINT = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET); // Debe existir en tu cuenta
    fd.append("folder", FOLDER);

    setUploading(true);
    try {
      const res = await fetch(ENDPOINT, { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error?.message || "Error subiendo a Cloudinary";
        throw new Error(msg);
      }

      // URL https del archivo subido
      return data.secure_url || data.url;
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      Swal.fire("Error al subir archivo", err.message || "Inténtalo de nuevo", "error");
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadFile, uploading };
}
