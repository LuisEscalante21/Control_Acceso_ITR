import FaceModel from "../models/Face.js";
import ScheduleModel from "../models/Schedule.js";
import AccessControlModel from "../models/AccessControl.js";

export async function validarHorarioYRegistrar({
  id_Employee,
  tipo,
  fechaHora,
  foto,
}) {
  const face = await FaceModel.findOne({ employee_code: id_Employee });
  if (!face) throw new Error("Empleado no encontrado");

  const schedule = await ScheduleModel.findById(face.schedule_id);
  if (!schedule) throw new Error("Horario no encontrado");

  const dias = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
  const diaNombre = dias[fechaHora.getDay()];
  const seccion = fechaHora.getHours() < 12 ? "Matutino" : "Vespertino";

  const bloque = schedule[diaNombre]?.[seccion];
  if (!bloque) throw new Error(`No hay horario para ${diaNombre} - ${seccion}`);

  const horaActual = fechaHora.toTimeString().slice(0, 5); // HH:MM
  let resultado = "A tiempo";
  if (tipo === "entrada" && horaActual > bloque.start) resultado = "Tarde";
  if (tipo === "salida" && horaActual < bloque.end) resultado = "Salió antes";

  const fechaStr = fechaHora.toISOString().split("T")[0]; // YYYY-MM-DD
  let registro = await AccessControlModel.findOne({ id_Employee: face._id, date: fechaStr });

  if (!registro) {
    registro = new AccessControlModel({
      id_Employee: face._id,
      date: fechaStr,
      [`${tipo}_time`]: fechaHora,
      [`${tipo}_result`]: resultado,
      [`${tipo}_photo`]: foto || "",
    });
  } else {
    if (registro[`${tipo}_time`]) {
      console.log(`[INFO] Ya existe ${tipo} registrado para este día. No se actualizará.`);
      return "Ya registrado";
    }

    registro[`${tipo}_time`] = fechaHora;
    registro[`${tipo}_result`] = resultado;
    registro[`${tipo}_photo`] = foto || "";
  }

  await registro.save();
  return resultado;
}
