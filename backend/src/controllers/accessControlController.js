import AccessControlModel from "../models/AccessControl.js";

const accessControlController = {};

// GET all access records
accessControlController.getAllAccessRecords = async (req, res) => {
  try {
    const records = await AccessControlModel.find().populate("id_Employee");
    res.status(200).json(records);
  } catch (error) {
    console.error("Error retrieving access records:", error);
    res.status(500).json({
      message: "Error retrieving access records",
      error: error.message || error.toString(),
    });
  }
};

// GET access record by ID
accessControlController.getAccessRecordById = async (req, res) => {
  try {
    const record = await AccessControlModel.findById(req.params.id).populate("id_Employee");
    if (!record) return res.status(404).json({ message: "Access record not found" });
    res.status(200).json(record);
  } catch (error) {
    console.error("Error retrieving access record by ID:", error);
    res.status(500).json({
      message: "Error retrieving access record",
      error: error.message || error.toString(),
    });
  }
};

// CREATE new access record
accessControlController.createAccessRecord = async (req, res) => {
  try {
    const {
      id_Employee,
      entry_time,
      entry_result,
      entry_photo,
      exit_time,
      exit_result,
      exit_photo,
      date,
    } = req.body;

    const newRecord = new AccessControlModel({
      id_Employee,
      entry_time,
      entry_result,
      entry_photo,
      exit_time,
      exit_result,
      exit_photo,
      date,
    });

    await newRecord.save();
    res.status(201).json({ message: "Access record created successfully" });
  } catch (error) {
    console.error("Error creating access record:", error);
    res.status(500).json({
      message: "Error creating access record",
      error: error.message || error.toString(),
    });
  }
};

// UPDATE access record by ID
accessControlController.updateAccessRecord = async (req, res) => {
  try {
    const updated = await AccessControlModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Access record not found" });
    res.status(200).json({ message: "Access record updated successfully", updated });
  } catch (error) {
    console.error("Error updating access record:", error);
    res.status(500).json({
      message: "Error updating access record",
      error: error.message || error.toString(),
    });
  }
};

// DELETE access record by ID
accessControlController.deleteAccessRecord = async (req, res) => {
  try {
    const deleted = await AccessControlModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Access record not found" });
    res.status(200).json({ message: "Access record deleted successfully" });
  } catch (error) {
    console.error("Error deleting access record:", error);
    res.status(500).json({
      message: "Error deleting access record",
      error: error.message || error.toString(),
    });
  }
};

export default accessControlController;
