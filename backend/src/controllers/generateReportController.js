import PDFDocument from "pdfkit";
import Employee from "../models/Employees.js";
import JustificationLateArrival from "../models/Justifications.js";
import Permissions from "../models/Permissions.js";
import { Types } from "mongoose";
import path from "path";
import fs from "fs";

const generateReportController = {};

generateReportController.generateUserReport = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID de usuario inválido" });
    }

    const user = await Employee.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const justifications = await JustificationLateArrival.find({ userId });
    const permissions = await Permissions.find({ idUser: userId });

    const doc = new PDFDocument({ margin: 50 });

    // 📌 REGISTRAR FUENTE
    const fontPath = path.resolve("src/font/Roboto-Regular.ttf");
    doc.registerFont("Roboto", fontPath);
    doc.font("Roboto");

    // ✅ Ruta del logo (sin importarlo)
    const logoPath = path.resolve("../../../frontend/src/img/logo_redondo.png");

    // 🛠️ Configuración de headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=reporte_${userId}.pdf`);
    doc.pipe(res);

    // 🖼️ LOGO ESQUINA SUPERIOR DERECHA
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 450, 40, { width: 80 });
    }

    // 🧾 ENCABEZADO
    doc.fillColor("#2c3e50").fontSize(20).text("Reporte del empleado", 50, 50, {
      align: "left",
    });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#3498db").stroke();
    doc.moveDown();

    // 👤 INFORMACIÓN DEL EMPLEADO
    doc.fontSize(14).fillColor("#000");
    doc.text(`👤 Empleado: ${user.names} ${user.surnames}`);
    doc.text(`🆔 ID: ${user._id.toString()}`);
    doc.text(`💼 Cargo: ${user.position || "No definido"}`);
    doc.text(`🗓️ Fecha de generación: ${new Date().toLocaleDateString("es-ES")}`);
    doc.moveDown(1.5);

    // 🕒 JUSTIFICACIONES
    doc.fontSize(16).fillColor("#34495e").text("🕒 Justificaciones de llegadas tarde", { underline: true });
    doc.moveDown(0.5);

    if (justifications.length === 0) {
      doc.fontSize(12).fillColor("#7f8c8d").text("No se encontraron justificaciones.");
    } else {
      justifications.forEach((just, index) => {
        doc.fontSize(12).fillColor("#000");
        doc.text(`🔹 #${index + 1} - Fecha: ${just.date.toISOString().split("T")[0]}`);
        doc.text(`     Hora de llegada: ${just.arrivalTime}`);
        doc.text(`     Motivo: ${just.reason}`);
        doc.text(`     Tipo de usuario: ${just.userType}`);
        doc.moveDown(0.5);
      });
    }

    doc.moveDown(1);

    // 📝 PERMISOS
    doc.fontSize(16).fillColor("#34495e").text("📝 Permisos solicitados", { underline: true });
    doc.moveDown(0.5);

    if (permissions.length === 0) {
      doc.fontSize(12).fillColor("#7f8c8d").text("No se encontraron permisos.");
    } else {
      permissions.forEach((perm, i) => {
        doc.fontSize(12).fillColor("#000");
        doc.text(`🔹 Permiso #${i + 1}`);
        doc.text(`     Tipo: ${perm.permissionType}`);
        doc.text(`     Estado: ${perm.status}`);
        doc.text(`     Motivo: ${perm.reason || "No especificado"}`);

        if (perm.permissionType === "minor") {
          doc.text(`     Fecha: ${perm.permissionDate?.toISOString().split("T")[0] || "N/A"}`);
          doc.text(`     Desde: ${perm.startTime || "N/A"} hasta ${perm.endTime || "N/A"}`);
        }

        if (perm.permissionType === "major") {
          doc.text(`     Desde: ${perm.permissionDateFrom?.toISOString().split("T")[0] || "N/A"}`);
          doc.text(`     Hasta: ${perm.permissionDateTo?.toISOString().split("T")[0] || "N/A"}`);
        }

        if (perm.permissionType === "incapacity") {
          doc.text(`     Desde: ${perm.sickLeaveDateFrom?.toISOString().split("T")[0] || "N/A"}`);
          doc.text(`     Hasta: ${perm.sickLeaveDateTo?.toISOString().split("T")[0] || "N/A"}`);
          doc.text(`     Tipo de incapacidad: ${perm.incapacityType || "No definido"}`);
          doc.text(`     Tipo de enfermedad: ${perm.illnessType || "No definido"}`);
        }

        doc.text(`     ¿Con descuento? ${perm.Discount ? "Sí" : "No"}`);
        doc.text(`     Descuento estimado: ${perm.quantityDiscount || 0}`);
        doc.text(`     Documento de soporte: ${perm.supportingDocument || "No cargado"}`);
        doc.text(`     Comentarios del supervisor: ${perm.supervisorComments || "Ninguno"}`);
        doc.moveDown(0.8);
      });
    }

    // 🔚 PIE DE PÁGINA
    doc.moveDown(2);
    doc.fontSize(10).fillColor("#95a5a6").text(
      "Este documento fue generado automáticamente. No requiere firma.",
      50,
      750,
      { align: "center" }
    );

    doc.end();
  } catch (error) {
    console.error("Error generando reporte PDF:", error);
    res.status(500).json({ message: "Error generando reporte", error: error.message });
  }
};

export default generateReportController;
