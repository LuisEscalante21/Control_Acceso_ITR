import React, { useState, useEffect } from "react";
import "../../components/styles/ModalRostro.css";
import rostroImg1 from "../../img/Rostros-1.png";
import rostroImg2 from "../../img/Rostros-2.png";
import Swal from "sweetalert2";

const ModalFace = ({ mode = "add", face = {}, onClose, onSubmit }) => {
  const [newFile, setNewFile] = useState(null);
  const [name, setName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");

  useEffect(() => {
    if (mode === "edit") {
      setName(face.name || "");
      setEmployeeCode(face.employee_code || "");
    } else {
      setName("");
      setEmployeeCode("");
      setNewFile(null);
    }
  }, [mode, face]);

  const handleClose = () => {
    setName("");
    setEmployeeCode("");
    setNewFile(null);
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewFile(file);
    Swal.fire({
      icon: "success",
      title: "Imagen cargada",
      text: "La imagen fue cargada correctamente.",
      timer: 1000,
      showConfirmButton: false,
    });
  };

  const handleSave = async () => {
    if (!name || !employeeCode || !newFile) {
      return Swal.fire(
        "Campos incompletos",
        "Completa todos los campos y selecciona una imagen.",
        "warning"
      );
    }

    try {
      Swal.fire({
        title: "Subiendo imagen...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // 1. Subir imagen al backend (que la sube a Cloudinary)
      const formData = new FormData();
      formData.append("title", name);
      formData.append("content", employeeCode);
      formData.append("image", newFile);

      const uploadResponse = await fetch("http://localhost:4000/api/blog", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.status !== "success") {
        Swal.close();
        return Swal.fire(
          "Error al subir imagen",
          uploadData.message || "No se pudo subir la imagen.",
          "error"
        );
      }

      const imageUrl = uploadData.data.image;

      // 2. Llamar a la API Flask para mapear el rostro
      const mapeoResponse = await fetch("http://localhost:4500/mapeo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_MAPEO_API_KEY}`,
        },
        body: JSON.stringify({
          name,
          code: employeeCode,
          image_url: imageUrl,
        }),
      });

      const mapeoData = await mapeoResponse.json();
      Swal.close();

      if (mapeoData.status !== "success") {
        return Swal.fire(
          "Error al mapear rostro",
          mapeoData.message || "No se pudo procesar la imagen.",
          "error"
        );
      }

      Swal.fire("Éxito", "Rostro guardado y mapeado correctamente", "success");
      onSubmit(mode === "edit" ? face._id : null, newFile, name);
      handleClose();
    } catch (error) {
      console.error("Error:", error);
      Swal.close();
      Swal.fire(
        "Error inesperado",
        error.message || "No se pudo conectar con el servidor.",
        "error"
      );
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

        <div className="biometric-options">
          <div className="option">
            <label htmlFor="file-input">
              <img src={rostroImg1} alt="Subir biométricos" />
              <p>Subir nuevos datos biométricos</p>
            </label>
            <input
              id="file-input"
              name="file"
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
};

export default ModalFace;
