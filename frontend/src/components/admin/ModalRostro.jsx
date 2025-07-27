import React, { useState, useEffect } from "react";
import "../../components/styles/ModalRostro.css";
import rostroImg1 from "../../img/Rostros-1.png";
import rostroImg2 from "../../img/Rostros-2.png";
import Swal from "sweetalert2";
import useDataSchedules from "../../hooks/admin/useDataSchedule.jsx";

function ModalFace({ mode = "add", face = {}, onClose, onSubmit }) {
  const [newFile, setNewFile] = useState(null);
  const [name, setName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [gender, setGender] = useState("");
  const [areaId, setAreaId] = useState("");
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  // Obtener horarios desde tu custom hook
  const { schedules } = useDataSchedules();

  // Cargar áreas desde tu API
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/teams");
        const data = await res.json();
        setAreas(data);
      } catch (err) {
        console.error("Error al cargar áreas:", err);
        setAreas([]);
      } finally {
        setLoadingAreas(false);
      }
    };
    fetchAreas();
  }, []);

  // Setear datos si estamos en modo edición
  useEffect(() => {
    if (mode === "edit" && face) {
      setName(face.name || "");
      setEmployeeCode(face.employee_code || "");
      setSelectedScheduleId(face.schedule_id || "");
      setGender(face.gender || "");
      setAreaId(face.area_id || "");
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
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return Swal.fire("Archivo inválido", "Selecciona una imagen válida.", "error");
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
    if (
      !name.trim() ||
      !employeeCode.trim() ||
      !selectedScheduleId ||
      !gender ||
      !areaId ||
      (mode === "add" && !newFile)
    ) {
      return Swal.fire("Campos incompletos", "Completa todos los campos requeridos.", "warning");
    }

    const data = new FormData();
    data.append("name", name.trim());
    data.append("employee_code", employeeCode.trim());
    data.append("schedule_id", selectedScheduleId);
    data.append("gender", gender);
    data.append("area_id", areaId);
    if (newFile) {
      data.append("image", newFile);
    }

    try {
      await onSubmit(data);
      handleClose();
    } catch (err) {
      Swal.fire("Error", "Ocurrió un error al guardar.", "error");
    }
  };

  return (
    <div className="employee-modal-overlay active" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={handleClose}>
          &times;
        </button>

        <h2>{mode === "edit" ? "Editar rostro" : "Agregar rostro"}</h2>

        <label>Nombres y Apellidos:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre completo"
        />

        <label>Código de empleado:</label>
        <input
          type="text"
          value={employeeCode}
          onChange={(e) => setEmployeeCode(e.target.value)}
          placeholder="Código"
        />

        <label>Género:</label>
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Seleccione género</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="otro">Otro</option>
        </select>

        <label>Horario asociado:</label>
        <select value={selectedScheduleId} onChange={(e) => setSelectedScheduleId(e.target.value)}>
          <option value="">Selecciona un horario</option>
          {schedules.map((sch) => (
            <option key={sch._id} value={sch._id}>
              {sch.name}
            </option>
          ))}
        </select>

        <label>Área:</label>
        <select value={areaId} onChange={(e) => setAreaId(e.target.value)} disabled={loadingAreas}>
          <option value="">Seleccione un área</option>
          {areas.map((area) => (
            <option key={area._id} value={area._id}>
              {area.name}
            </option>
          ))}
        </select>

        <div className="biometric-options">
          <div className="option">
            <label htmlFor="file-input">
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
          <div className="option">
            <img src={rostroImg2} alt="Abrir cámara" />
            <p>Abrir cámara</p>
          </div>
        </div>

        <button type="button" className="save-btn" onClick={handleSave}>
          {mode === "edit" ? "Actualizar" : "Agregar"}
        </button>
      </div>
    </div>
  );
}

export default ModalFace;
