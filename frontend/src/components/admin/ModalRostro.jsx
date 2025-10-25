import React, { useState, useEffect } from "react";
import "../../components/styles/ModalRostro.css";
import rostroImg1 from "../../img/Rostros-1.png";
import Swal from "sweetalert2";
import useDataSchedules from "../../hooks/admin/useDataSchedule.jsx";
import useDataTeams from "../../hooks/admin/useDataTeams.jsx";
import axios from "axios";

function ModalFace({ mode = "add", face = {}, onClose, onSubmit }) {
  const [newFile, setNewFile] = useState(null);
  const [name, setName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [gender, setGender] = useState("");
  const [areaId, setAreaId] = useState("");

  const [loadingAreas, setLoadingAreas] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [userFound, setUserFound] = useState(false);

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
      setUserFound(false);
    } else {
      setName("");
      setEmployeeCode("");
      setSelectedScheduleId("");
      setGender("");
      setAreaId("");
      setNewFile(null);
      setUserFound(false);
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
    setUserFound(false);
    onClose();
  };

  // Función para buscar usuario por código de empleado
  const searchUserByCode = async (code) => {
    if (!code || code.trim().length < 1) {
      return;
    }

    setIsSearching(true);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/search/code/${code.trim()}`
      );

      if (response.data.found) {
        const userData = response.data.user;

        // Rellenar los campos automáticamente
        setName(userData.name);
        setGender(userData.gender);
        setAreaId(userData.area_id);
        setUserFound(true);

        Swal.fire({
          icon: "success",
          title: "Usuario encontrado",
          text: `Datos de ${userData.name} cargados exitosamente`,
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error al buscar usuario:", error);
      setUserFound(false);
      
      if (error.response?.status === 404) {
        // Usuario no encontrado - limpiar campos
        setName("");
        setGender("");
        setAreaId("");

        Swal.fire({
          icon: "info",
          title: "Usuario no encontrado",
          text: "No se encontró un usuario con ese código. Puedes ingresar los datos manualmente.",
          timer: 2500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al buscar el usuario. Intenta nuevamente.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Manejador para el cambio del código de empleado
  const handleEmployeeCodeChange = (e) => {
    const value = e.target.value;
    setEmployeeCode(value);
  };

  // Buscar cuando se pierde el foco del campo
  const handleEmployeeCodeBlur = () => {
    if (employeeCode && mode === "add") {
      searchUserByCode(employeeCode);
    }
  };

  // También puedes agregar búsqueda al presionar Enter
  const handleEmployeeCodeKeyPress = (e) => {
    if (e.key === "Enter" && employeeCode && mode === "add") {
      e.preventDefault();
      searchUserByCode(employeeCode);
    }
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
    if (isSaving) {
      console.log("Operación en progreso, evitando doble envío");
      return;
    }

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
    
    // Deshabilitar el botón de guardado inmediatamente
    const saveButton = document.querySelector('.save-btn');
    if (saveButton) {
      saveButton.disabled = true;
    }

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

        <label>Código de empleado:</label>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={employeeCode}
            onChange={handleEmployeeCodeChange}
            onBlur={handleEmployeeCodeBlur}
            onKeyPress={handleEmployeeCodeKeyPress}
            placeholder="Ingrese código de empleado"
            autoComplete="off"
            disabled={mode === "edit" || isSearching}
            style={{ paddingRight: isSearching ? "40px" : "10px" }}
          />
          {isSearching && (
            <span style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "12px"
            }}>
              🔍 Buscando...
            </span>
          )}
        </div>
        {mode === "add" && (
          <p style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
            Los datos se cargarán automáticamente si el código existe
          </p>
        )}

        <label>Nombres y Apellidos:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre completo"
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