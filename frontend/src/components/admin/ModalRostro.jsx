import React, { useState, useEffect } from "react";
import "../../components/styles/ModalRostro.css";
import rostroImg1 from "../../img/Rostros-1.png";
import Swal from "sweetalert2";
import useDataSchedules from "../../hooks/admin/useDataSchedule.jsx";
import useDataTeams from "../../hooks/admin/useDataTeams.jsx";

function ModalFace({ mode = "add", face = {}, onClose, onSubmit }) {
  const [newFile, setNewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
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
      setPreviewUrl(face.image_url || null);
    } else {
      setName("");
      setEmployeeCode("");
      setSelectedScheduleId("");
      setGender("");
      setAreaId("");
      setNewFile(null);
      setPreviewUrl(null);
    }
  }, [mode, face]);

  // Limpiar URL de preview al desmontar
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleClose = () => {
    // Limpiar preview URL si existe
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setName("");
    setEmployeeCode("");
    setSelectedScheduleId("");
    setGender("");
    setAreaId("");
    setNewFile(null);
    setPreviewUrl(null);
    setIsSaving(false);
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea imagen
    if (!file.type.startsWith("image/")) {
      return Swal.fire(
        "Archivo inválido",
        "Selecciona una imagen válida (JPG, PNG, etc.).",
        "error"
      );
    }

    // Validar tamaño (máximo 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return Swal.fire(
        "Archivo muy grande",
        "La imagen no debe superar los 5MB.",
        "error"
      );
    }

    // Limpiar preview anterior si existe
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    // Crear preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setNewFile(file);

    Swal.fire({
      icon: "success",
      title: "Imagen cargada",
      text: `Archivo seleccionado: ${file.name}`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleSave = async () => {
    if (isSaving) {
      console.log("Operación en progreso, evitando doble envío");
      return;
    }

    // Validación de campos
    if (!name.trim()) {
      return Swal.fire(
        "Campo requerido",
        "El nombre es obligatorio.",
        "warning"
      );
    }

    if (!employeeCode.trim()) {
      return Swal.fire(
        "Campo requerido",
        "El código de empleado es obligatorio.",
        "warning"
      );
    }

    if (!selectedScheduleId) {
      return Swal.fire(
        "Campo requerido",
        "Debes seleccionar un horario.",
        "warning"
      );
    }

    if (!gender) {
      return Swal.fire(
        "Campo requerido",
        "Debes seleccionar el género.",
        "warning"
      );
    }

    if (!areaId) {
      return Swal.fire(
        "Campo requerido",
        "Debes seleccionar un área.",
        "warning"
      );
    }

    if (mode === "add" && !newFile) {
      return Swal.fire(
        "Imagen requerida",
        "Debes seleccionar una fotografía del rostro.",
        "warning"
      );
    }

    // Mostrar confirmación
    const result = await Swal.fire({
      title: "¿Confirmar registro?",
      html: `
        <div style="text-align: left; margin: 10px 0;">
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Código:</strong> ${employeeCode}</p>
          <p><strong>Género:</strong> ${gender}</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, registrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!result.isConfirmed) {
      return;
    }

    setIsSaving(true);
    
    // Deshabilitar el botón de guardado inmediatamente
    const saveButton = document.querySelector('.save-btn');
    if (saveButton) {
      saveButton.disabled = true;
    }

    // Mostrar loading
    Swal.fire({
      title: "Procesando rostro...",
      html: "Por favor espera mientras se valida y registra el rostro.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("employee_code", employeeCode.trim());
    formData.append("schedule_id", selectedScheduleId);
    formData.append("gender", gender);
    formData.append("area_id", areaId);

    if (newFile) {
      formData.append("image", newFile);
    }

    try {
      await onSubmit(formData, { asJson: false });

      Swal.fire({
        icon: "success",
        title: "¡Rostro registrado!",
        text: `El empleado ${name} ha sido registrado correctamente.`,
        timer: 2000,
        showConfirmButton: false,
      });

      handleClose();
    } catch (err) {
      console.error("Error al guardar rostro:", err);
      setIsSaving(false);

      // Manejo de errores específicos
      let errorTitle = "Error al registrar";
      let errorMessage = "Ocurrió un error al guardar el rostro.";

      if (err && err.message) {
        if (
          err.message.includes("duplicate") ||
          err.message.includes("duplicado")
        ) {
          errorTitle = "Empleado duplicado";
          errorMessage =
            "Este empleado ya tiene un rostro registrado en el sistema.";
        } else if (
          err.message.includes("no se pudo mapear") ||
          err.message.includes("no face")
        ) {
          errorTitle = "Rostro no detectado";
          errorMessage =
            "No se pudo detectar un rostro en la imagen. Por favor, usa una foto clara y frontal.";
        } else if (
          err.message.includes("calidad") ||
          err.message.includes("quality")
        ) {
          errorTitle = "Calidad insuficiente";
          errorMessage =
            "La calidad de la imagen es insuficiente. Usa una foto con buena iluminación y nitidez.";
        } else if (err.message.includes("no existe")) {
          errorTitle = "Empleado no encontrado";
          errorMessage = err.message;
        } else {
          errorMessage = err.message;
        }
      }

      Swal.fire({
        icon: "error",
        title: errorTitle,
        text: errorMessage,
        confirmButtonText: "Entendido",
      });
    }
  };

  return (
    <div className="employee-modal-overlay active" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="close-button"
          onClick={handleClose}
          aria-label="Cerrar"
          disabled={isSaving}
        >
          &times;
        </button>

        <h2>{mode === "edit" ? "Ver datos del rostro" : "Agregar rostro"}</h2>

        <label>Nombres y Apellidos: *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre completo"
          autoComplete="off"
          disabled={mode === "edit" || isSaving}
          maxLength={100}
        />

        <label>Código de empleado: *</label>
        <input
          type="text"
          value={employeeCode}
          onChange={(e) => setEmployeeCode(e.target.value)}
          placeholder="Código del empleado"
          autoComplete="off"
          disabled={mode === "edit" || isSaving}
          maxLength={50}
        />

        <label>Género: *</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          disabled={mode === "edit" || isSaving}
        >
          <option value="">Seleccione género</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="otro">Otro</option>
        </select>

        <label>Horario asociado: *</label>
        <select
          value={selectedScheduleId}
          onChange={(e) => setSelectedScheduleId(e.target.value)}
          disabled={mode === "edit" || isSaving}
        >
          <option value="">Selecciona un horario</option>
          {schedules.map((sch) => (
            <option key={sch._id} value={sch._id}>
              {sch.name}
            </option>
          ))}
        </select>

        <label>Área: *</label>
        <select
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          disabled={mode === "edit" || loadingAreas || isSaving}
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
              <label
                htmlFor="file-input"
                style={{
                  cursor: isSaving ? "not-allowed" : "pointer",
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                {previewUrl ? (
                  <div style={{ position: "relative" }}>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{
                        width: "100%",
                        maxWidth: "200px",
                        height: "auto",
                        borderRadius: "8px",
                        border: "2px solid #4CAF50",
                      }}
                    />
                    {!isSaving && (
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          background: "rgba(0,0,0,0.7)",
                          color: "white",
                          padding: "10px",
                          borderRadius: "5px",
                          fontSize: "12px",
                        }}
                      >
                        Click para cambiar
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <img src={rostroImg1} alt="Subir biométricos" />
                    <p>Subir nuevos datos biométricos</p>
                  </>
                )}
              </label>
              <input
                id="file-input"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isSaving}
                style={{ display: "none" }}
              />
              {newFile && (
                <p
                  style={{
                    fontSize: "12px",
                    marginTop: "5px",
                    color: "#4CAF50",
                  }}
                >
                  ✓ {newFile.name} ({(newFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
          </div>
        )}

        {mode !== "edit" && (
          <>
            <p style={{ fontSize: "11px", color: "#666", marginTop: "10px" }}>
              * Campos obligatorios
            </p>
            <button
              type="button"
              className="save-btn"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                opacity: isSaving ? 0.6 : 1,
                cursor: isSaving ? "not-allowed" : "pointer",
              }}
            >
              {isSaving ? "Procesando..." : "Agregar Rostro"}
            </button>
          </>
        )}

        {mode === "edit" && previewUrl && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <label style={{ display: "block", marginBottom: "10px" }}>
              Imagen registrada:
            </label>
            <img
              src={previewUrl}
              alt="Rostro registrado"
              style={{
                maxWidth: "300px",
                height: "auto",
                borderRadius: "8px",
                border: "2px solid #ddd",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ModalFace;
