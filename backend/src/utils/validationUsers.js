import Administrator from "../models/Administrators.js";
import Coordinator from "../models/Coordinators.js";
import Employee from "../models/Employees.js";

export const emailExistsInAnyCollection = async (email) => {
  if (await Administrator.findOne({ email })) return true;
  if (await Coordinator.findOne({ email })) return true;
  if (await Employee.findOne({ email })) return true;
  return false;
};
