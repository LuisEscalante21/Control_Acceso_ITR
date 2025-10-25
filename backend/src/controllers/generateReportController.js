import PDFDocument from "pdfkit";
import EmployeesModel from "../models/Employees.js";
import CoordinatorsModel from "../models/Coordinators.js";
import JustificationLateArrival from "../models/Justifications.js";
import Permissions from "../models/Permissions.js";
import Team from "../models/Teams.js";
import Access from "../models/registrationAccess.js";
import Absence from "../models/Absences.js";
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

    // Diagnostic logs: mostrar userId y validez
    console.log("[reports] generateUserReport called for userId:", userId, "isValid:", Types.ObjectId.isValid(userId));

    // Buscar primero en empleados, si no está, buscar en coordinadores
    let user = await EmployeesModel.findById(userId);
    let userType = "empleado";
    console.log("[reports] EmployeesModel.findById result:", !!user);
    if (!user) {
      user = await CoordinatorsModel.findById(userId);
      console.log("[reports] CoordinatorsModel.findById result:", !!user);
      userType = user ? "coordinador" : userType;
    }

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    let teamName = "No definido";
    if (user.IdTeam) {
      const team = await Team.findById(user.IdTeam);
      if (team) teamName = team.name || "No definido";
    }

    // Consultas defensivas: cada colección puede usar campos distintos según el tipo
    let justifications = [];
    let permissions = [];
    let accessRecords = [];
    let absences = [];

    try {
      justifications = await JustificationLateArrival.find({ userId });
    } catch (err) {
      console.error("Error consultando justificaciones:", err.message);
      justifications = [];
    }

    try {
      // Permissions.idUser suele ser string; intentamos con id como string y con número de empleado
      permissions = await Permissions.find({ $or: [{ idUser: userId }, { idUser: String(userId) }, { employeeNumber: user.numEmpleado || "" }] });
    } catch (err) {
      console.error("Error consultando permisos:", err.message);
      permissions = [];
    }

    try {
      // registrationAccess puede usar id_Employee como ObjectId o string; intentamos varias opciones
      accessRecords = await Access.find({ $or: [{ id_Employee: userId }, { id_Employee: String(userId) }] }).sort({ date: 1 });
    } catch (err) {
      console.error("Error consultando accesos:", err.message);
      accessRecords = [];
    }

    try {
      // Absences.id_Employee a veces es string (employee number) o id
      absences = await Absence.find({ $or: [{ id_Employee: userId }, { id_Employee: String(userId) }, { id_Employee: user.numEmpleado || "" }] }).sort({ date: -1 });
    } catch (err) {
      console.error("Error consultando inasistencias:", err.message);
      absences = [];
    }

    const doc = new PDFDocument({ margin: 50 });
    const fontPath = path.resolve("src/font/Roboto-Regular.ttf");
    doc.registerFont("Roboto", fontPath);
    doc.font("Roboto");

    const logoPath = path.resolve("../../../frontend/src/img/logo_redondo.png");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=reporte_${userId}.pdf`);

    doc.pipe(res);

    doc.on("error", (err) => {
      console.error("Error en PDFDocument:", err);
      if (!res.headersSent) res.end();
    });

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 450, 40, { width: 80 });
    }

  doc.fillColor("#2c3e50").fontSize(20).text("Reporte del usuario", 50, 50, { align: "left" });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#3498db").stroke();
    doc.moveDown();

    const startX = 50;
    const startY = doc.y;

    doc.fontSize(14).fillColor("#000");
  doc.text(`${userType.charAt(0).toUpperCase() + userType.slice(1)}: ${user.names} ${user.surnames}`, startX, startY);
  doc.text(`Código: ${user.numEmpleado || "No definido"}`);
  doc.text(`Área: ${teamName}`);
  doc.text(`Tipo de usuario: ${userType}`);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString("es-ES")}`);

    if (user.photo) {
      try {
        if (user.photo.startsWith("data:image")) {
          const matches = user.photo.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/);
          if (matches) {
            const base64Data = matches[3];
            const imageBuffer = Buffer.from(base64Data, "base64");
            doc.image(imageBuffer, 460, startY, { width: 100, height: 100, fit: [100, 100] });
          }
        } else if (user.photo.startsWith("http") || fs.existsSync(user.photo)) {
          doc.image(user.photo, 460, startY, { width: 100, height: 100, fit: [100, 100] });
        } else {
          const imageBuffer = Buffer.from(user.photo, "base64");
          doc.image(imageBuffer, 460, startY, { width: 100, height: 100, fit: [100, 100] });
        }
      } catch (err) {
        console.error("Error cargando imagen:", err.message);
      }
    }

    doc.moveDown(1.5);

    // -----------------------------
    // Permisos
    // -----------------------------
    doc.fontSize(16).fillColor("#34495e").text("Permisos solicitados", { underline: true });
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

        const formatDate = (d) => d ? new Date(d).toISOString().split("T")[0] : "N/A";

        if (perm.permissionType === "minor") {
          doc.text(`     Fecha: ${formatDate(perm.permissionDate)}`);
          doc.text(`     Desde: ${perm.startTime || "N/A"} hasta ${perm.endTime || "N/A"}`);
        }

        if (perm.permissionType === "major") {
          doc.text(`     Desde: ${formatDate(perm.permissionDateFrom)}`);
          doc.text(`     Hasta: ${formatDate(perm.permissionDateTo)}`);
        }

        if (perm.permissionType === "incapacity") {
          doc.text(`     Desde: ${formatDate(perm.sickLeaveDateFrom)}`);
          doc.text(`     Hasta: ${formatDate(perm.sickLeaveDateTo)}`);
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

    doc.moveDown(1);

    // -----------------------------
    // Inasistencias
    // -----------------------------
    doc.addPage();
    doc.fontSize(16).fillColor("#34495e").text("Inasistencias registradas", { underline: true });
    doc.moveDown(0.5);

    if (absences.length === 0) {
      doc.fontSize(12).fillColor("#7f8c8d").text("No se encontraron inasistencias.");
    } else {
      absences.forEach((absence, idx) => {
        const dateStr = absence.date && !isNaN(new Date(absence.date)) ?
          new Date(absence.date).toISOString().split("T")[0] : "Fecha inválida";

        doc.fontSize(12).fillColor("#000");
        doc.text(`🔹 #${idx + 1} - Fecha: ${dateStr}`);
        doc.text(`     Motivo: ${absence.reason || "No especificado"}`);
        doc.text(`     Tipo de empleado: ${absence.employee_type || "No definido"}`);
        doc.moveDown(0.5);
      });
    }

    // -----------------------------
    // Accesos
    // -----------------------------
    const formatDate = (d) => d && !isNaN(new Date(d)) ? new Date(d).toISOString().split("T")[0] : "Fecha inválida";

    doc.moveDown(1);
    doc.fontSize(16).fillColor("#34495e").text("Comparativo de Entradas", { underline: true });
    doc.moveDown(0.5);
    if (accessRecords.length === 0) {
      doc.fontSize(12).fillColor("#7f8c8d").text("No se encontraron registros de entrada.");
    } else {
      const dateX = 50, timeX = 200, resultX = 350;
      doc.fontSize(12).fillColor("#000");
      doc.text("Fecha", dateX).text("Hora Entrada", timeX).text("Resultado", resultX);
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).strokeColor("#3498db").stroke();
      doc.moveDown(0.5);
      accessRecords.forEach(rec => {
        const dateStr = formatDate(rec.date);
        const eTime = rec.entry_time ? new Date(rec.entry_time).toTimeString().split(" ")[0] : "N/A";
        const resEntry = rec.entry_result || "Sin registro";
        doc.fontSize(11).fillColor("#000");
        doc.text(dateStr, dateX);
        doc.text(eTime, timeX);
        doc.text(resEntry, resultX);
        doc.moveDown(0.5);
      });
    }

    doc.moveDown(1);
    doc.fontSize(16).fillColor("#34495e").text("Comparativo de Salidas", { underline: true });
    doc.moveDown(0.5);
    if (accessRecords.length === 0) {
      doc.fontSize(12).fillColor("#7f8c8d").text("No se encontraron registros de salida.");
    } else {
      const dateX = 50, timeX = 200, resultX = 350;
      doc.fontSize(12).fillColor("#000");
      doc.text("Fecha", dateX).text("Hora Salida", timeX).text("Resultado", resultX);
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).strokeColor("#3498db").stroke();
      doc.moveDown(0.5);
      accessRecords.forEach(rec => {
        const dateStr = formatDate(rec.date);
        const exTime = rec.exit_time ? new Date(rec.exit_time).toTimeString().split(" ")[0] : "N/A";
        const resExit = rec.exit_result || "Sin registro";
        doc.fontSize(11).fillColor("#000");
        doc.text(dateStr, dateX);
        doc.text(exTime, timeX);
        doc.text(resExit, resultX);
        doc.moveDown(0.5);
      });
    }

    // -----------------------------
    // Justificaciones
    // -----------------------------
    doc.moveDown(1);
    doc.fontSize(16).fillColor("#34495e").text("Justificaciones de llegadas tarde", { underline: true });
    doc.moveDown(0.5);
    if (justifications.length === 0) {
      doc.fontSize(12).fillColor("#7f8c8d").text("No se encontraron justificaciones.");
    } else {
      justifications.forEach((just, idx) => {
        const dateStr = formatDate(just.date);
        doc.fontSize(12).fillColor("#000");
        doc.text(`🔹 #${idx + 1} - Fecha: ${dateStr}`);
        doc.text(`     Hora de llegada: ${just.arrivalTime}`);
        doc.text(`     Motivo: ${just.reason}`);
        doc.text(`     Tipo de usuario: ${just.userType}`);
        doc.moveDown(0.5);
      });
    }

    doc.moveDown(2);
    doc.fontSize(10).fillColor("#95a5a6").text(
      "Este documento fue generado automáticamente. No requiere firma.",
      50,
      750,
      { align: "center" }
    );

    doc.end();
  } catch (error) {
    console.error("Error generando reporte:", error);
    // No hacer res.json si ya se usó pipe/res.end
    if (!res.headersSent) {
      res.status(500).json({ message: "Error generando reporte", error: error.message });
    }
  }
};

export default generateReportController;
