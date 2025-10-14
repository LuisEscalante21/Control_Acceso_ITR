import React, { useState, useEffect } from "react";
import "../../components/styles/ModalRostro.css";
import rostroImg1 from "../../img/Rostros-1.png";
import Swal from "sweetalert2";
import useDataSchedules from "../../hooks/admin/useDataSchedule.jsx";
import useDataTeams from "../../hooks/admin/useDataTeams.jsx";

function ModalFace({ mode = "add", face = {}, onClose, onSubmit }) {
  const [newFile, setNewFile] = useState(null);
  const [name, setName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [gender, setGender] = useState("");
  const [areaId, setAreaId] = useState("");

  const [loadingAreas, setLoadingAreas] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { schedules } = useDataSchedules();
  const { teams, fetchTeams } = useDataTeams();

  useEffect(() => {
    (async () => {
      try {
        await fetchTeams();
      } finally {
        setLoadingAreas(false);
      }
    })();
  }, [fetchTeams]);

  useEffect(() => {
    if (mode === "edit" && face) {
      setName(face.name || "");
      setEmployeeCode(face.employee_code || "");
      setSelectedScheduleId(face.schedule_id || "");
      setGender(face.gender || "");
      setAreaId(face.area_id || face?.area?._id || "");
      setNewFile(null);
    } else {
      setName("");
      setEmployeeCode("");
      setSelectedScheduleId("");
      setGender("");
      setAreaId("");
      setNewFile(null);
    }
  }, [mode, face]);

  const handleClose = () => {
    setName("");
    setEmployeeCode("");
    setSelectedScheduleId("");
    setGender("");
    setAreaId("");
    setNewFile(null);
    setIsSaving(false);
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return Swal.fire(
        "Archivo inválido",
        "Selecciona una imagen válida.",
        "error"
      );
    }

    setNewFile(file);

    Swal.fire({
      icon: "success",
      title: "Imagen cargada",
      text: `Archivo seleccionado: ${file.name}`,
      timer: 1000,
      showConfirmButton: false,
    });
  };

  const handleSave = async () => {
    if (isSaving) return;

    if (
      !name.trim() ||
      !employeeCode.trim() ||
      !selectedScheduleId ||
      !gender ||
      !areaId
    ) {
      return Swal.fire(
        "Campos incompletos",
        "Completa todos los campos requeridos.",
        "warning"
      );
    }

    if (mode === "add" && !newFile) {
      return Swal.fire(
        "Imagen requerida",
        "Debes seleccionar una imagen.",
        "warning"
      );
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("employee_code", employeeCode.trim());
    formData.append("code", employeeCode.trim());
    formData.append("schedule_id", selectedScheduleId);
    formData.append("gender", gender);
    formData.append("area_id", areaId);

    if (newFile) {
      formData.append("image", newFile);
    }

    try {
      await onSubmit(formData, { asJson: false });
      handleClose();
    } catch (err) {
      console.error(err);
      setIsSaving(false);
      const msg =
        (err && err.message) ||
        (typeof err === "string" ? err : null) ||
        "Ocurrió un error al guardar.";
      Swal.fire("Error", msg, "error");
    }
  };

  return (
    <div className="employee-modal-overlay active" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="close-button"
          onClick={handleClose}
          aria-label="Cerrar"
        >
          &times;
        </button>

        <h2>{mode === "edit" ? "Ver datos del rostro" : "Agregar rostro"}</h2>

        <label>Nombres y Apellidos:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre completo"
          autoComplete="off"
          disabled={mode === "edit"}
        />

        <label>Código de empleado:</label>
        <input
          type="text"
          value={employeeCode}
          onChange={(e) => setEmployeeCode(e.target.value)}
          placeholder="Código"
          autoComplete="off"
          disabled={mode === "edit"}
        />

        <label>Género:</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          disabled={mode === "edit"}
        >
          <option value="">Seleccione género</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="otro">Otro</option>
        </select>

        <label>Horario asociado:</label>
        <select
          value={selectedScheduleId}
          onChange={(e) => setSelectedScheduleId(e.target.value)}
          disabled={mode === "edit"}
        >
          <option value="">Selecciona un horario</option>
          {schedules.map((sch) => (
            <option key={sch._id} value={sch._id}>
              {sch.name}
            </option>
          ))}
        </select>

        <label>Área:</label>
        <select
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          disabled={mode === "edit" || loadingAreas}
        >
          <option value="">
            {loadingAreas ? "Cargando áreas..." : "Seleccione un área"}
          </option>
          {!loadingAreas &&
            teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
        </select>

        {mode !== "edit" && (
          <div className="biometric-options">
            <div className="option">
              <label htmlFor="file-input" style={{ cursor: "pointer" }}>
                <img src={rostroImg1} alt="Subir biométricos" />
                <p>Subir nuevos datos biométricos</p>
              </label>
              <input
                id="file-input"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              {newFile && (
                <p style={{ fontSize: "12px", marginTop: "5px" }}>
                  Archivo seleccionado: {newFile.name}
                </p>
              )}
            </div>
          </div>
        )}

        {mode !== "edit" && (
          <button
            type="button"
            className="save-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Agregando..." : "Agregar"}
          </button>
        )}
      </div>
    </div>
  );
}

export default ModalFace;
