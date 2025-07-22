const coordinatorsController = {};
import coordinatorsModel from "../models/Coordinators.js";
import bcryptjs from "bcryptjs";

// S E L E C T
coordinatorsController.getCoordinators = async (req, res) => {
  try {
    const coordinators = await coordinatorsModel.find();
    res.status(200).json(coordinators);
  }
  catch (error) {
    res.status(500).json({ message: "Error fetching coordinators", error });
  }
};

// D E L E T E
coordinatorsController.deleteCoordinator = async (req, res) => {
  try{
    await coordinatorsModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Coordinator deleted" });
  }catch (error) {
    res.status(500).json({ message: "Error deleting coordinator", error });
  }
};

// U P D A T E
coordinatorsController.updateCoordinator = async (req, res) => {
  try {
    // Desestructura los campos del body
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
      photo, // <-- Agrega este campo
    };

    // Si se incluye nueva contraseña, hashearla
    if (password) {
      const salt = await bcryptjs.genSalt(10);
      updatedData.password = await bcryptjs.hash(password, salt);
    }

    const updatedCoordinator = await coordinatorsModel.findByIdAndUpdate(
      req.params.id,
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