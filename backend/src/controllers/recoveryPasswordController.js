import jsonwebtoken from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import EmployeesModel from "../models/Employees.js";
import CoordinatorsModel from "../models/Coordinators.js";
import AdministratorsModel from "../models/Administrators.js";
import nodemailer from "nodemailer";

// -------- Helpers --------
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: (process.env.EMAIL_PASS || "").replace(/\s+/g, ""),
    },
    logger: true,
    debug: true,
  });
}

function HTMLRecoveryEmail(code) {
  return `
    <div style="background:#f6f7fb;width:100%;margin:0;padding:0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" 
        style="width:100%; max-width:560px; margin:0 auto; padding:24px;">
        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" 
              style="background:#ffffff; border-radius:14px; box-shadow:0 2px 10px rgba(0,0,0,0.05); overflow:hidden;">
              <tr>
                <td style="background:#bf0e28; padding:18px 22px;">
                  <h1 style="margin:0;font-family:Arial,sans-serif;font-size:18px;color:#ffffff;">
                    Recuperación de contraseña
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding:22px;">
                  <p style="margin:0 0 14px; font-family:Arial,sans-serif; color:#444;">
                    Tu código de verificación es:
                  </p>
                  <div style="
                    display:inline-block;
                    border:1px solid #bf0e28;
                    background:#bf0e28;
                    color:#ffffff;
                    padding:10px 16px;
                    border-radius:8px;
                    font-family:'Courier New', Courier, monospace;
                    font-weight:bold;
                    font-size:16px;
                  ">
                    ${code}
                  </div>
                  <p style="margin:16px 0 0; font-family:Arial,sans-serif; color:#444;">
                    Este código expirará en 25 minutos.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

// -------- Controller --------
const passwordRecoveryController = {};

// 1. Solicitar código
passwordRecoveryController.requestCode = async (req, res) => {
  const { email } = req.body; // 👈 ahora recibimos correo
  try {
    if (!email) {
      return res.status(400).json({ message: "El correo es obligatorio" });
    }

    let userFound =
      (await EmployeesModel.findOne({ email })) ||
      (await CoordinatorsModel.findOne({ email })) ||
      (await AdministratorsModel.findOne({ email }));

    if (!userFound) {
      return res.json({ message: "Usuario no encontrado" });
    }

    // 🚨 Checar bloqueo
    if (
      userFound.lockRecoveryPassTime &&
      userFound.lockRecoveryPassTime > new Date()
    ) {
      return res.json({
        message: "La recuperación ya fue usada. Intenta de nuevo en 24 horas.",
      });
    }

    // Generar código + token
    const code = Math.floor(10000 + Math.random() * 60000).toString();
    const token = jsonwebtoken.sign(
      {
        id: userFound._id,
        code,
        userType: userFound.constructor.modelName,
        verified: false,
      },
      process.env.JWT_SECRET,
      { expiresIn: "25m" }
    );

    res.cookie("tokenRecoveryCode", token, {
     httpOnly: true, 
     secure: false, // ⚠️ no uses https en localhost
     sameSite: "lax", // ⚠️ permite compartir entre 5173 y 4000
     domain: "localhost", // 👈 asegura que pertenece al backend
     path: "/", 
     maxAge: 25 * 60 * 1000,
    });


    // Enviar email
    try {
      const transporter = createTransporter();
      await transporter.verify();
      await transporter.sendMail({
        from: `"Soporte PTC" <${process.env.EMAIL_USER}>`,
        to: userFound.email, // 👈 correo del usuario
        subject: "Código de recuperación de contraseña",
        html: HTMLRecoveryEmail(code),
      });
      console.log("[recovery] Email enviado a", userFound.email);
    } catch (mailErr) {
      console.error("Error enviando correo:", mailErr);
    }

    res.json({ message: "Código de verificación enviado" });
  } catch (error) {
    console.log("error " + error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// 2. Verificar código
passwordRecoveryController.verifyCode = async (req, res) => {
  const { code } = req.body;
  try {
    const token = req.cookies.tokenRecoveryCode;
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);

    if (decoded.code !== code) {
      return res.json({ message: "Código inválido" });
    }

    const newToken = jsonwebtoken.sign(
      {
        id: decoded.id,
        code: decoded.code,
        userType: decoded.userType,
        verified: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: "25m" }
    );

    res.cookie("tokenRecoveryCode", newToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 25 * 60 * 1000,
    });

    res.json({ message: "Código verificado correctamente" });
  } catch (error) {
    console.log("error " + error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// 3. Cambiar contraseña (hasheada + bloquear por 1 día)
passwordRecoveryController.newPassword = async (req, res) => {
  const { newPassword } = req.body;
  try {
    const token = req.cookies.tokenRecoveryCode;
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);

    if (!decoded.verified) {
      return res.json({ message: "Código no verificado" });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 12);
    const lockDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // ahora + 1 día

    if (decoded.userType === "Employees") {
      await EmployeesModel.findByIdAndUpdate(decoded.id, {
        password: hashedPassword,
        lockRecoveryPassTime: lockDate,
      });
    } else if (decoded.userType === "Coordinators") {
      await CoordinatorsModel.findByIdAndUpdate(decoded.id, {
        password: hashedPassword,
        lockRecoveryPassTime: lockDate,
      });
    } else if (decoded.userType === "Administrators") {
      await AdministratorsModel.findByIdAndUpdate(decoded.id, {
        password: hashedPassword,
        lockRecoveryPassTime: lockDate,
      });
    }

    res.clearCookie("tokenRecoveryCode");
    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.log("error " + error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default passwordRecoveryController;
