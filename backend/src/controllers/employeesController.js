import employeesModel from "../models/Employees.js";
import bcryptjs from "bcryptjs";
import { emailExistsInAnyCollection } from "../../src/utils/validationUsers.js"; 

const employeesController = {};

// S E L E C T
employeesController.getEmployees = async (req, res) => {
  try {
    const employees = await employeesModel.find();
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employees", error });
  }
};

// GET /employee/team/:teamId
employeesController.getEmployeesByTeam = async (req, res) => {
  const { teamId } = req.params;

  try {
    const employees = await employeesModel.find({ IdTeam: teamId });
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error al obtener empleados por equipo:", error);
    res.status(500).json({
      message: "Error al obtener empleados por coordinación",
      error,
    });
  }
};

// GET /employee/:id
employeesController.getEmployeeById = async (req, res) => {
  const { id } = req.params;
  
  // Validar que sea ObjectId válido
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const employee = await employeesModel.findById(id);
    if (!employee) return res.status(404).json({ message: "Empleado no encontrado" });
    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employee by ID", error });
  }
};


// D E L E T E
employeesController.deleteEmployees = async (req, res) => {
  try {
    await employeesModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Employee deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting employee", error });
  }
};

// U P D A T E
employeesController.updateEmployees = async (req, res) => {
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
      photo,
    } = req.body;

    const employeeId = req.params.id;

    // Validar email único globalmente
    const emailExists = await emailExistsInAnyCollection(email, employeeId);
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists in the system" });
    }

    // Preparar datos a actualizar
    const updatedData = {
      numEmpleado,
      names,
      surnames,
      DUI,
      birthday,
      telephone,
      email,
      hireDate,
      IdTeam,
      status,
      address,
      photo,
    };

    // Si se incluye nueva contraseña, hashearla
    if (password) {
      const salt = await bcryptjs.genSalt(10);
      updatedData.password = await bcryptjs.hash(password, salt);
    }

    const updatedEmployee = await employeesModel.findByIdAndUpdate(
      employeeId,
      updatedData,
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating employee", error });
  }
};

export default employeesController;
