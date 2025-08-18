import bcryptjs from "bcryptjs";
import nodemailer from "nodemailer";
import EmployeesModel from "../models/Employees.js";
import CoordinatorsModel from "../models/Coordinators.js";
import AdministratorsModel from "../models/Administrators.js";

// -------- Helpers --------
function generateTempPassword(len = 8) {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const all = upper + lower + digits;

  let pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
  ];
  for (let i = pwd.length; i < len; i++) {
    pwd.push(all[Math.floor(Math.random() * all.length)]);
  }
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }
  return pwd.join("");
}

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: (process.env.EMAIL_PASS || "").replace(/\s+/g, ""), // sin espacios
    },
    logger: true,
    debug: true,
  });
}

function setFlagTrue(doc) {
  doc.updatePassStatus = true;      // tu campo estándar
  doc.updatePassBoolean = true;     // compat por si lo usaste en otro lado
  if (typeof doc.requestResetPassword !== "undefined") doc.requestResetPassword = false;
  if (typeof doc.resetPassword !== "undefined") doc.resetPassword = false;
}

// -------- Controller --------
/**
 * POST /api/recoveryPassword
 * body: { email, numEmpleado }
 * Respuesta SIEMPRE: 200 { message: "validando credenciales" }
 */
export const recoveryPasswordController = async (req, res) => {
  const genericMsg = { message: "validando credenciales" };

  try {
    const { email, numEmpleado } = req.body || {};
    if (!email || !numEmpleado) return res.status(200).json(genericMsg);

    // buscar en las tres colecciones
    const user =
      (await EmployeesModel.findOne({ email, numEmpleado })) ||
      (await CoordinatorsModel.findOne({ email, numEmpleado })) ||
      (await AdministratorsModel.findOne({ email, numEmpleado }));

    if (!user) return res.status(200).json(genericMsg);

    // generar temporal y guardar hasheada
    const temp = generateTempPassword(8);
    user.password = await bcryptjs.hash(temp, 12);
    setFlagTrue(user); // 🔒 forzar cambio en próximo login
    await user.save();

    // enviar correo (si falla, no revelamos nada al cliente)
    try {
      const transporter = createTransporter();
      await transporter.verify();
      await transporter.sendMail({
        from: `"Soporte PTC" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Recuperación de contraseña",
        html: `
          <h3>Restablecimiento de contraseña</h3>
          <p>Hola ${user.names ?? "usuario"},</p>
          <p>Tu nueva contraseña temporal es:</p>
          <p style="font-size:18px; font-weight:bold;">${temp}</p>
          <p>Al iniciar sesión deberás cambiarla por una nueva.</p>
        `,
      });
      console.log("[recovery] Email enviado a", email);
    } catch (mailErr) {
      console.error("❌ Error enviando correo:", mailErr);
    }

    return res.status(200).json(genericMsg);
  } catch (err) {
    console.error("❌ recoveryPasswordController error:", err);
    return res.status(200).json(genericMsg);
  }
};

export default { recoveryPasswordController };
