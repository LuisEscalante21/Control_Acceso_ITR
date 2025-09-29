import React, { useState, useEffect, useRef } from "react";
import "../../components/styles/ModalRostro.css";
import rostroImg1 from "../../img/Rostros-1.png";
import rostroImg2 from "../../img/Rostros-2.png";
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
  const [showCamera, setShowCamera] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

  const stopCamera = () => {
    try {
      const stream = videoRef.current?.srcObject;
      if (stream && typeof stream.getTracks === "function") {
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (_) {}
  };

  const handleClose = () => {
    setName("");
    setEmployeeCode("");
    setSelectedScheduleId("");
    setGender("");
    setAreaId("");
    setNewFile(null);
    setIsSaving(false);
    stopCamera();
    setShowCamera(false);
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

  const handleOpenCamera = async () => {
    setShowCamera(true);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        Swal.fire("Error", "No se pudo acceder a la cámara.", "error");
        setShowCamera(false);
      }
    } else {
      Swal.fire("Error", "Tu navegador no soporta la cámara.", "error");
      setShowCamera(false);
    }
  };

  const handleTakePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return Swal.fire("Error", "No se pudo capturar la imagen.", "error");
        }
        const file = new File([blob], "captura.jpg", { type: "image/jpeg" });
        setNewFile(file);
        Swal.fire({
          icon: "success",
          title: "Foto tomada",
          text: "La foto se ha capturado correctamente.",
          timer: 1000,
          showConfirmButton: false,
        });
        stopCamera();
        setShowCamera(false);
      },
      "image/jpeg",
      0.92
    );
  };

  const handleSave = async () => {
  if (isSaving) return;

  if (
    (mode === "add" &&
      (!name.trim() ||
        !employeeCode.trim() ||
        !selectedScheduleId ||
        !gender ||
        !areaId ||
        !newFile))
  ) {
    return Swal.fire(
      "Campos incompletos",
      "Completa todos los campos requeridos.",
      "warning"
    );
  }

  setIsSaving(true);

  const basePayload = {};

  if (mode === "add" || name.trim() !== face.name) {
    basePayload.name = name.trim();
  }
  if (mode === "add" || employeeCode.trim() !== face.employee_code) {
    basePayload.employee_code = employeeCode.trim();
    basePayload.code = employeeCode.trim();
  }
  if (mode === "add" || selectedScheduleId !== face.schedule_id) {
    basePayload.schedule_id = selectedScheduleId;
  }
  if (mode === "add" || gender !== face.gender) {
    basePayload.gender = gender;
  }
  if (mode === "add" || (areaId && areaId !== (face.area_id || face?.area?._id))) {
    basePayload.area_id = areaId;
  }

  try {
    const data = new FormData();
    Object.entries(basePayload).forEach(([k, v]) => data.append(k, v));
    if (newFile) data.append("image", newFile);

    await onSubmit(data, { asJson: false });
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

        <h2>{mode === "edit" ? "Editar rostro" : "Agregar rostro"}</h2>

        <label>Nombres y Apellidos:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre completo"
          autoComplete="off"
        />

        <label>Código de empleado:</label>
        <input
          type="text"
          value={employeeCode}
          onChange={(e) => setEmployeeCode(e.target.value)}
          placeholder="Código"
          autoComplete="off"
        />

        <label>Género:</label>
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Seleccione género</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="otro">Otro</option>
        </select>

        <label>Horario asociado:</label>
        <select
          value={selectedScheduleId}
          onChange={(e) => setSelectedScheduleId(e.target.value)}
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
          disabled={loadingAreas}
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
          <div
            className="option"
            onClick={handleOpenCamera}
            style={{ cursor: "pointer" }}
          >
            <img src={rostroImg2} alt="Abrir cámara" />
            <p>Abrir cámara</p>
          </div>
        </div>

        {showCamera && (
          <div className="camera-modal">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={handleTakePhoto}>Tomar foto</button>
              <button
                onClick={() => {
                  stopCamera();
                  setShowCamera(false);
                }}
              >
                Cancelar
              </button>
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        )}

        <button
          type="button"
          className="save-btn"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving
            ? mode === "edit"
              ? "Actualizando..."
              : "Agregando..."
            : mode === "edit"
            ? "Actualizar"
            : "Agregar"}
        </button>
      </div>
    </div>
  );
}

export default ModalFace;