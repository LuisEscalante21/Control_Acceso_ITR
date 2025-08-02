const coordinatorsController = {};
import coordinatorsModel from "../models/Coordinators.js";
import bcryptjs from "bcryptjs";

// S E L E C T
coordinatorsController.getCoordinators = async (req, res) => {
  const coordinators = await coordinatorsModel.find();
  res.json(coordinators);
};

// D E L E T E
coordinatorsController.deleteCoordinator = async (req, res) => {
  await coordinatorsModel.findByIdAndDelete(req.params.id);
  res.json({ message: "coordinator deleted" });
};

// U P D A T E
coordinatorsController.updateCoordinator = async (req, res) => {
  const {numEmpleado, names, surnames, DUI, birthday, telephone, email, password, IdTeam, status, address} = req.body;

  const updateCoordinator = await coordinatorsModel.findByIdAndUpdate(
    req.params.id,
    {numEmpleado, names, surnames, DUI, birthday, telephone, email, password, IdTeam, status, address},
    { new: true }
  );

  if (!updateCoordinator) {
    res.json({ message: "coordinator not found" });
  } else {
    res.json({ message: "coordinator updated" });
  }
};

export default coordinatorsController;