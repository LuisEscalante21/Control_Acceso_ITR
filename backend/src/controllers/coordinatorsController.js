import coordinatorsModel from "../models/Coordinators.js";
import bcryptjs from "bcryptjs";
import { emailExistsInAnyCollection } from "../../src/utils/validationUsers.js";

const coordinatorsController = {};

// S E L E C T
coordinatorsController.getCoordinators = async (req, res) => {
  try {
    const coordinators = await coordinatorsModel.find();
    res.status(200).json(coordinators);
  } catch (error) {
    res.status(500).json({ message: "Error fetching coordinators", error });
  }
};

// D E L E T E
coordinatorsController.deleteCoordinator = async (req, res) => {
  try {
    await coordinatorsModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Coordinator deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting coordinator", error });
  }
};

// U P D A T E
coordinatorsController.updateCoordinator = async (req, res) => {
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

    const coordinatorId = req.params.id;

    // Validar email único en las 3 colecciones (excluyendo el actual)
    const emailExists = await emailExistsInAnyCollection(email, coordinatorId);
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists in the system" });
    }

    // Prepara los datos a actualizar
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

    const updatedCoordinator = await coordinatorsModel.findByIdAndUpdate(
      coordinatorId,
      updatedData,
      { new: true }
    );

    if (!updatedCoordinator) {
      return res.status(404).json({ message: "Coordinator not found" });
    }

    res.json({ message: "Coordinator updated", coordinator: updatedCoordinator });
  } catch (error) {
    res.status(500).json({ message: "Error updating coordinator", error });
  }
};

export default coordinatorsController;
