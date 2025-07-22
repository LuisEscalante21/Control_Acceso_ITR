import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../../components/styles/ModalUpdate.css";
import Icon from "../../assets/icon.jpg";
import { Pencil, Trash2 } from "lucide-react";

const toInputDateFormat = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

export default function UpdateEmpleaods({ empleado, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ ...empleado });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    setForm({ ...empleado });
    setEditMode(false);
  }, [empleado]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(form, empleado._id); 
    Swal.fire("Actualizado", "El empleado ha sido actualizado exitosamente.", "success");
    setEditMode(false);
    onClose();
  };

  const handleDelete = () => {
    Swal.fire({
      title: "¿Eliminar empleado?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(form._id);
      }
    });
  };

  if (!empleado) return null;

  return (
    <div className="modal-overlay active">
      <div className="cvcard-modal cvcard-modal-scroll">
        <button className="close-modal" onClick={onClose}>×</button>
        <div className="cvcard-header">
          <img src={Icon} alt="Avatar" className="cvcard-avatar" />
          <div className="cvcard-nombre">{empleado.names} {empleado.surnames}</div>
        </div>
        <div className="cvcard-info">
          <div className="cvcard-info-title-row">
            <span className="cvcard-info-title">Información personal</span>
            {!editMode && (
              <span className="cvcard-actions">
                <button className="cvcard-action-btn" onClick={() => setEditMode(true)} title="Editar">
                  <Pencil size={22} />
                </button>
                <button className="cvcard-action-btn" onClick={handleDelete} title="Eliminar">
                  <Trash2 size={22} />
                </button>
              </span>
            )}
          </div>
          {!editMode ? (
            <>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Nombres y apellidos</span>
                <span className="cvcard-value">{empleado.names} {empleado.surnames}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Correo electrónico:</span>
                <span className="cvcard-value">{empleado.email}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Número telefónico:</span>
                <span className="cvcard-value">{empleado.telephone}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Dirección de residencia:</span>
                <span className="cvcard-value">{empleado.address}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Código de empleado:</span>
                <span className="cvcard-value">{empleado.numEmpleado}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">DUI:</span>
                <span className="cvcard-value">{empleado.DUI}</span>
              </div>
              <div className="cvcard-info-group">
                <span className="cvcard-label">Fecha de nacimiento:</span>
                <span className="cvcard-value">{toInputDateFormat(empleado.birthday)}</span>
              </div>
            </>
          ) : (
            <form className="cvcard-form" onSubmit={handleSubmit} style={{ width: "100%", marginTop: 10 }}>
              <div className="form-field">
                <label>Código de empleado:</label>
                <input name="numEmpleado" value={form.numEmpleado || ""} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Nombres:</label>
                <input name="names" value={form.names || ""} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Apellidos:</label>
                <input name="surnames" value={form.surnames || ""} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Correo electrónico:</label>
                <input name="email" value={form.email || ""} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Número telefónico:</label>
                <input name="telephone" value={form.telephone || ""} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Dirección de residencia:</label>
                <input name="address" value={form.address || ""} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>DUI:</label>
                <input name="DUI" value={form.DUI || ""} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Fecha de nacimiento:</label>
                <input name="birthday" type="date" value={toInputDateFormat(form.birthday)} onChange={handleChange} required />
              </div>
              <button type="submit" className="btn-guardar">ACTUALIZAR</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}