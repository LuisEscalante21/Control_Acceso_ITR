  import Employee from "../models/Employees.js";
  import bcryptjs from "bcryptjs";
  import jsonwebtoken from "jsonwebtoken";
  import { config } from "../config.js";
  import { v2 as cloudinary } from "cloudinary";
  import validator from "validator";
  import { emailExistsInAnyCollection } from "../../src/utils/validationUsers.js";

  // Configurar cloudinary
  cloudinary.config({
    cloud_name: config.cloudinary.cloudinary_name,
    api_key: config.cloudinary.cloudinary_api_key,
    api_secret: config.cloudinary.cloudinary_api_secret,
  });

  const registerEmployeesController = {};

  // I N S E R T
  registerEmployeesController.register = async (req, res) => {
    try {
      const {
        numEmpleado,
        names,
        surnames,
        DUI,
        birthday,
        telephone,
        email,
        password,
        hireDate,
        IdTeam,
        status,
        address,
      } = req.body;

      // Validación básica
      if (
        !numEmpleado || !names || !surnames || !DUI || !birthday ||
        !telephone || !email || !password || !hireDate || !IdTeam || !status || !address
      ) {
        return res.status(400).json({ message: "All fields are required." });
      }

      // Validar formato de email
      if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email format." });
      }

      // Validar formato de teléfono (1234-5678)
      const phoneRegex = /^\d{4}-\d{4}$/;
      if (!phoneRegex.test(telephone)) {
        return res.status(400).json({ message: "Invalid telephone format." });
      }

      // Validar formato de DUI (12345678-9)
      const duiRegex = /^\d{8}-\d$/;
      if (!duiRegex.test(DUI)) {
        return res.status(400).json({ message: "Invalid DUI format." });
      }

      //Verificar que el email no exista en ninguna colección
      const emailExists = await emailExistsInAnyCollection(email);
      if (emailExists) {
        return res.status(400).json({ message: "Email already exists in the system." });
      }

      // Verificar si el empleado ya existe por email (opcional, ya cubierto por la validación global)
      const existEmployee = await Employee.findOne({ email });
      if (existEmployee) {
        return res.status(400).json({ message: "Employee already exists." });
      }

      // Hashea la contraseña
      const passwordHash = await bcryptjs.hash(password, 10);

      // Subir foto a cloudinary si existe
      let photoUrl = "";
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "employees",
          allowed_formats: ["jpg", "png", "jpeg"],
        });
        photoUrl = result.secure_url;
      }

      // Crear nuevo empleado
      const newEmployee = new Employee({
        numEmpleado,
        names,
        surnames,
        DUI,
        birthday,
        telephone,
        email,
        password: passwordHash,
        hireDate,
        IdTeam,
        status,
        address,
        photo: photoUrl,
      });

      await newEmployee.save();

      // Generar token JWT
      jsonwebtoken.sign(
        { id: newEmployee._id },
        config.JWT.secret,
        { expiresIn: config.JWT.expiresIn },
        (error, token) => {
          if (error) console.log(error);
          else res.cookie("authToken", token);
        }
      );

      res.status(201).json({
        message: "Employee registered successfully.",
        employee: newEmployee,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Error registering employee",
        error: error.message,
      });
    }
  };

  export default registerEmployeesController;
