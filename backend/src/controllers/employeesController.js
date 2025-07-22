import employeesModel from "../models/Employees.js";
import bcryptjs from "bcryptjs";

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
    console.log("PHOTO RECIBIDA:", req.body.photo); // <-- Verifica aquí
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
      photo, // <-- Agrega este campo
    } = req.body;

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
      photo, // <-- Agrega este campo
    };

    // Si se incluye nueva contraseña, hashearla
    if (password) {
      const salt = await bcryptjs.genSalt(10);
      updatedData.password = await bcryptjs.hash(password, salt);
    }

    const updatedEmployee = await employeesModel.findByIdAndUpdate(
      req.params.id,
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