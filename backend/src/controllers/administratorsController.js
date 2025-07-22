const administratorsController = {};
import administratorsModel from "../models/Administrators.js";
import bcryptjs from "bcryptjs";

// S E L E C T
administratorsController.getAdministrators = async (req, res) => {
  try {
    const administrators = await administratorsModel.find();
    res.status(200).json(administrators);
  } catch (error) {
    res.status(500).json({ message: "Error fetching administrators", error });
  }
};

// D E L E T E
administratorsController.deleteAdministrator = async (req, res) => {
  try {
    await administratorsModel.findById(req.params.id);
    res.status(200).json(administrator);
  }
  catch (error) {
    return res.status(500).json({ message: "Error deleted administrator", error });
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
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedAdministrator) {
      return res.status(404).json({ message: "Administrator not found" });
    }

    res.status(200).json({ message: "Administrator updated", administrator: updatedAdministrator });
  } catch (error) {
    res.status(500).json({ message: "Error updating administrator", error });
  }
};


export default administratorsController;