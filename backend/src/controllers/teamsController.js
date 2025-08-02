import { model } from "mongoose";
import TeamsModel from "../models/Teams.js";

const teamsController = {};

// Obtener todos los equipos
teamsController.getTeam = async (req, res) => {
  try {
    const teams = await TeamsModel.find();
    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los equipos", error });
  }
};

// Insertar nuevo equipo
teamsController.insertTeam = async (req, res) => {
  try {
    const { name } = req.body;

    // Validar que el nombre no esté vacío
    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "El nombre del equipo es obligatorio y no puede estar vacío.",
      });
    }

    const newTeam = new TeamsModel({ name: name.trim() });
    await newTeam.save();

    res.status(201).json({
      message: "Equipo creado correctamente",
      newTeam,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al guardar el equipo",
      error,
    });
  }
};


// Eliminar equipo por ID
teamsController.deleteTeam = async (req, res) => {
  try {
    await TeamsModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Equipo eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el equipo", error });
  }
};

// Actualizar nombre de equipo por ID
teamsController.updateTeam = async (req, res) => {
  try {
    const { name } = req.body;

    // Validar que el nombre no esté vacío
    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "El nombre del equipo es obligatorio y no puede estar vacío.",
      });
    }

    const updatedTeam = await TeamsModel.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true }
    );

    if (!updatedTeam) {
      return res.status(404).json({ message: "Equipo no encontrado" });
    }

    res.status(200).json({
      message: "Equipo actualizado correctamente",
      updatedTeam,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar el equipo",
      error,
    });
  }
};

export default teamsController;
