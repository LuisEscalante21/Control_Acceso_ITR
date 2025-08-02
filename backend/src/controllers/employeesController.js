import employeesModel from "../models/Employees.js";
import bcryptjs from "bcryptjs";

const employeesController = {};

// S E L E C T
employeesController.getEmployees = async (req, res) => {
  try {
    const employees = await employeesModel.find().populate("IdTeam");
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employees", error });
  }
};

// G E T  P O R  I D  O  T E A M
employeesController.getEmployee = async (req, res) => {
  const { id, teamId } = req.query;

  try {
    let result;

    if (id) {
      result = await employeesModel.findById(id).populate("IdTeam");
    } else if (teamId) {
      result = await employeesModel.find({ IdTeam: teamId }).populate("IdTeam");
    } else {
      return res.status(400).json({ message: "Debe proporcionar 'id' o 'teamId'" });
    }

    if (!result || (Array.isArray(result) && result.length === 0)) {
      return res.status(404).json({ message: "Empleado(s) no encontrado(s)" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo empleado(s)", error });
  }
};


// D E L E T E
employeesController.deleteEmployees = async (req, res) => {
  try {
    const deleted = await employeesModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Employee not found" });
    }
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

    res.json({ message: "Employee updated", employee: updatedEmployee });
  } catch (error) {
    res.status(500).json({ message: "Error updating employee", error });
  }
};

export default employeesController;