import administratorsModel from "../models/Administrators.js";
import bcryptjs from "bcryptjs";
import { emailExistsInAnyCollection } from "../../src/utils/validationUsers.js"; 

const administratorsController = {};

// S E L E C T
administratorsController.getAdministrators = async (req, res) => {
  try {
    const administrators = await administratorsModel.find();
    res.status(200).json(administrators);
  } catch (error) {
    res.status(500).json({ message: "Error fetching administrators", error });
  }
};

// D E L E T E (corregido)
administratorsController.deleteAdministrator = async (req, res) => {
  try {
    const administrator = await administratorsModel.findByIdAndDelete(req.params.id);
    if (!administrator) {
      return res.status(404).json({ message: "Administrator not found" });
    }
    res.status(200).json({ message: "Administrator deleted", administrator });
  } catch (error) {
    res.status(500).json({ message: "Error deleting administrator", error });
  }
};

// U P D A T E
administratorsController.updateAdministrator = async (req, res) => {
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

    const adminId = req.params.id;

    // Validar email globalmente
    const emailExists = await emailExistsInAnyCollection(email, adminId);
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists in the system" });
    }

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

    if (password) {
      const salt = await bcryptjs.genSalt(10);
      updatedData.password = await bcryptjs.hash(password, salt);
    }

    const updatedAdministrator = await administratorsModel.findByIdAndUpdate(
      adminId,
      updatedData,
      { new: true }
    );

    if (!updatedAdministrator) {
      return res.status(404).json({ message: "Administrator not found" });
    }

    res.status(200).json({
      message: "Administrator updated",
      administrator: updatedAdministrator,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating administrator", error });
  }
};

export default administratorsController;
