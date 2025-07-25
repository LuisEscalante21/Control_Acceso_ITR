import ScheduleModel from "../models/Schedule.js";

const schedulesController = {};

//GET
schedulesController.getSchedules = async (req, res) => {
  try {
    const schedules = await ScheduleModel.find();
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedules", error });
  }
};

//POST
schedulesController.insertSchedule = async (req, res) => {
  try {
    const { name, Lunes, Martes, Miercoles, Jueves, Viernes, Sabado, Domingo } = req.body;

    const newSchedule = new ScheduleModel({
      name,
      Lunes,
      Martes,
      Miercoles,
      Jueves,
      Viernes,
      Sabado,
      Domingo
    });

    await newSchedule.save();
    res.status(201).json({ message: "Horario guardado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al guardar el horario", error });
  }
};

//DELETE
schedulesController.deleteSchedule = async (req, res) => {
  try {
    await ScheduleModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Horario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el horario", error });
  }
};

//PUT
schedulesController.updateSchedule = async (req, res) => {
  try {
    const { name, Lunes, Martes, Miercoles, Jueves, Viernes, Sabado, Domingo } = req.body;

    const updatedSchedule = await ScheduleModel.findByIdAndUpdate(
      req.params.id,
      {
        name,
        Lunes,
        Martes,
        Miercoles,
        Jueves,
        Viernes,
        Sabado,
        Domingo
      },
      { new: true }
    );

    if (!updatedSchedule) {
      return res.status(404).json({ message: "Horario no encontrado" });
    }

    res.status(200).json({ message: "Horario actualizado correctamente", schedule: updatedSchedule });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el horario", error });
  }
};

export default schedulesController;