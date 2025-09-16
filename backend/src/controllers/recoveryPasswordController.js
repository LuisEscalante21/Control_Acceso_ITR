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
  doc.updatePassStatus = true;      // campo estándar
  doc.updatePassBoolean = true;     // compat
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
          <!-- Contenedor principal tipo "card" -->
          <div style="
              margin:0;
              padding:0;
              background:#f6f7fb;
              width:100%;
          ">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%; max-width:560px; margin:0 auto; padding:24px;">
              <tr>
                <td>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff; border-radius:14px; box-shadow:0 2px 10px rgba(0,0,0,0.05); overflow:hidden;">
                    <tr>
                      <td style="background:#bf0e28; padding:18px 22px;">
                        <h1 style="margin:0; font-family:Arial, sans-serif; font-size:18px; line-height:1.2; color:#ffffff;">
                          Restablecimiento de contraseña
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:22px;">
                        <p style="margin:0 0 8px; font-family:Arial, sans-serif; color:#222;">
                          Hola ${user.names ?? "usuario"},
                        </p>
                        <p style="margin:0 0 14px; font-family:Arial, sans-serif; color:#444;">
                          Tu nueva contraseña temporal es:
                        </p>

                        <!-- Recuadro azul de la contraseña -->
                        <div style="
                          display:inline-block;
                          border:1px solid #000000ff;       /* azul delgado */
                          background:#000000ff;              /* azul muy claro */
                          color:#ffffff;
                          padding:10px 14px;
                          border-radius:8px;
                          font-family: 'Courier New', Courier, monospace;
                          font-weight:bold;
                          font-size:16px;
                          letter-spacing:0.5px;
                          margin:4px 0 16px;
                          white-space:nowrap;
                        ">
                          ${temp}
                        </div>

                        <p style="margin:10px 0 0; font-family:Arial, sans-serif; color:#444;">
                          Al iniciar sesión deberás cambiarla por una nueva.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 22px 22px;">
                        <img
                          src="https://ci3.googleusercontent.com/mail-sig/AIorK4zMH27kl85vbOKBpMPaoxgr2lqBdcehbq5fx0jygCwKQsMREnlGICUUb1_uIBMjc0nvi1uBoAzIszqo"
                          alt="Logo ITR"
                          width="100%"
                          style="max-width:100%; height:auto; display:block; border:0; margin:0;"/>
                      </td>
                    </tr>
                  </table>

                  <!-- Pie suave -->
                  <p style="text-align:center; font-family:Arial, sans-serif; color:#9aa0a6; font-size:12px; margin:14px 0 0;">
                    Si no solicitaste este cambio, por favor ignora este mensaje.
                  </p>
                </td>
              </tr>
            </table>
          </div>
        `,
      });

      console.log("[recovery] Email enviado a", email);
    } catch (mailErr) {
      console.error("Error enviando correo:", mailErr);
    }
  } catch (err) {
    console.error("recoveryPasswordController error:", err);
  }

  // siempre respondemos lo mismo al cliente
  return res.status(200).json(genericMsg);
};

export default { recoveryPasswordController };
