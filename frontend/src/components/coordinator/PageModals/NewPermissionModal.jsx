// src/components/employee/PageModals/NewPermissionModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";


import useDataCredentials from "../../../hooks/Global/useDataCredentials";
import useDataTeams from "../../../hooks/Global/useDataTeams";

// Departamentos SV
const DEPARTAMENTOS = [
  "Ahuachapán","Santa Ana","Sonsonate","La Libertad","Chalatenango",
  "San Salvador","Cuscatlán","La Paz","Cabañas","San Vicente",
  "Usulután","San Miguel","Morazán","La Unión"
];

export default function NewPermissionModal({ isOpen, onClose, onSaved, postPermissionMultipart }) {
  const { user, loading } = useDataCredentials();
  const { getTeamNameById } = useDataTeams() || {};

  const [permissionType, setPermissionType] = useState("minor");
  const [file, setFile] = useState(null);
  const [docPreview, setDocPreview] = useState(null);

  const today = new Date().toISOString().split("T")[0]; 

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    defaultValues: {
      applicationDay: "",
      employeeNumber: "",
      idTeam: "",
      department: "",
      Discount: false,
      quantityDiscount: 0,
      // minor
      permissionDate: "",
      startTime: "",
      endTime: "",
      reason: "",
      // major
      permissionDateFrom: "",
      permissionDateTo: "",
      // incapacity
      sickLeaveDateFrom: "",
      sickLeaveDateTo: "",
      incapacityType: "",
      illnessType: "",
    },
  });

  // Nombre a mostrar
  const displayName = useMemo(() => {
    if (!user) return "";
    if (user.names || user.surnames) return `${user.names || ""} ${user.surnames || ""}`.trim();
    return user.fullName || "";
  }, [user]);

  // Nombre de área
  const areaName = useMemo(() => {
    const id = user?.idTeam || user?.IdTeam;
    return id ? (getTeamNameById?.(id) || "Área desconocida") : "";
  }, [user?.idTeam, user?.IdTeam, getTeamNameById]);

  // Autorellenar cuando cargue el usuario
  useEffect(() => {
    if (!loading && user) {
      reset({
        applicationDay: today,
        employeeNumber: user?.numEmpleado || "",
        idTeam: user?.idTeam || user?.IdTeam || "",
        department: user?.department || "",
        Discount: false,
        quantityDiscount: 0,
        permissionDate: "",
        startTime: "",
        endTime: "",
        reason: "",
        permissionDateFrom: "",
        permissionDateTo: "",
        sickLeaveDateFrom: "",
        sickLeaveDateTo: "",
        incapacityType: "",
        illnessType: "",
      });
    }
  }, [loading, user, reset, today]);

  const closeAndReset = () => {
    reset();
    setFile(null);
    setDocPreview(null);
    onClose?.();
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const ok = f.type.startsWith("image/") || f.type === "application/pdf";
    if (!ok) {
      Swal.fire("Archivo inválido", "Solo imagen o PDF.", "error");
      return;
    }

    setFile(f);
    setDocPreview(URL.createObjectURL(f));
  };

  // Valida por tipo (lado cliente)
  const validateByType = (form, dept) => {
    if (!dept) return "Debe seleccionar un departamento.";

    if (permissionType === "minor") {
      if (!form.permissionDate || !form.startTime || !form.endTime) {
        return "Completa fecha de ausencia, entrada y salida.";
      }
      if (form.startTime >= form.endTime) {
        return "La hora de entrada no puede ser mayor o igual a la de salida.";
      }
    }

    if (permissionType === "major") {
      if (!form.permissionDateFrom || !form.permissionDateTo) {
        return "Completa fecha de inicio y fin para permiso mayor.";
      }
      if (form.permissionDateFrom > form.permissionDateTo) {
        return "La fecha de inicio no puede ser posterior a la fecha de fin.";
      }
      if (!form.reason && !file) {
        return "Para permiso mayor incluye una razón o adjunta documento.";
      }
    }

    if (permissionType === "incapacity") {
      if (!form.sickLeaveDateFrom || !form.sickLeaveDateTo) {
        return "Completa fecha de inicio y fin para incapacidad.";
      }
      if (form.sickLeaveDateFrom > form.sickLeaveDateTo) {
        return "La fecha de inicio no puede ser posterior a la fecha de fin.";
      }
      if (!form.incapacityType || !form.illnessType) {
        return "Selecciona el tipo de incapacidad y de enfermedad.";
      }
      if (!file) {
        return "Para incapacidad el documento es obligatorio.";
      }
    }

    return null;
  };

  const handleHttpError = async (res) => {
    let msg = "";
    try {
      msg = (await res.json())?.message || "";
    } catch {
      try { msg = await res.text(); } catch {}
    }
    const text = msg || `HTTP ${res.status}`;
    if (res.status === 400) return Swal.fire("Datos inválidos", text, "warning");
    if (res.status === 401) return Swal.fire("No autorizado", text || "Inicia sesión.", "warning");
    if (res.status === 403) return Swal.fire("Acceso denegado", text, "error");
    if (res.status === 413) return Swal.fire("Archivo demasiado grande", text || "Máx. 10MB.", "error");
    if (res.status === 415) return Swal.fire("Tipo no permitido", text || "Solo imágenes o PDF.", "error");
    if (res.status >= 500) return Swal.fire("Error del servidor", text || "Intenta más tarde.", "error");
    Swal.fire("Error", text || "No se pudo enviar el permiso.", "error");
  };

  const onSubmit = async (form) => {
    const dept = form.department || user?.department || "";
    const typeErr = validateByType(form, dept);
    if (typeErr) {
      return Swal.fire("Datos incompletos", typeErr, "error");
    }

    try {
      Swal.fire({ title: "Enviando permiso...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const fd = new FormData();
      // campos comunes
      fd.append("permissionType", permissionType);
      fd.append("applicationDay", form.applicationDay);
      fd.append("department", dept);
      fd.append("Discount", form.Discount ?? false);
      fd.append("quantityDiscount", form.quantityDiscount ?? 0);

      // por tipo
      if (permissionType === "minor") {
        fd.append("permissionDate", form.permissionDate);
        fd.append("startTime", form.startTime);
        fd.append("endTime", form.endTime);
        if (form.reason) fd.append("reason", form.reason);
      }

      if (permissionType === "major") {
        fd.append("permissionDateFrom", form.permissionDateFrom);
        fd.append("permissionDateTo", form.permissionDateTo);
        if (form.reason) fd.append("reason", form.reason);
      }

      if (permissionType === "incapacity") {
        fd.append("sickLeaveDateFrom", form.sickLeaveDateFrom);
        fd.append("sickLeaveDateTo", form.sickLeaveDateTo);
        fd.append("incapacityType", form.incapacityType);
        fd.append("illnessType", form.illnessType);
      }

      if (file) fd.append("supportingDocumentFile", file);

      if (user?._id) fd.append("idUser", String(user._id));

      const res = await postPermissionMultipart(fd);
      if (!res.ok) {
        Swal.close();
        return handleHttpError(res);
      }

      Swal.close();
      await Swal.fire("¡Éxito!", "Permiso enviado correctamente.", "success");
      onSaved?.();
      closeAndReset(); // ⬅️ cerrar al enviar
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire("Error", err.message || "No se pudo enviar el permiso.", "error");
    }
  };

  if (!isOpen) return null;

  if (loading || !user) {
    return createPortal(
      <div className="np-overlay"><div className="np-content">Cargando datos…</div></div>,
      document.body
    );
  }

  return createPortal(
    <div className="np-overlay">
      <form
        className="np-content"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {/* Cerrar */}
        <button type="button" className="np-close" onClick={closeAndReset}>×</button>

        {/* Header */}
        <div className="np-header">
          <h3>Nuevo permiso</h3>
          <div className="np-type">
            {["minor", "major", "incapacity"].map((t) => (
              <button
                key={t}
                type="button"
                className={`np-chip ${permissionType === t ? "active" : ""}`}
                onClick={() => setPermissionType(t)}
              >
                {t === "minor" ? "Menor" : t === "major" ? "Mayor" : "Incapacidad"}
              </button>
            ))}
          </div>
        </div>

        {/* Hidden */}
        <input type="hidden" {...register("applicationDay")} />
        <input type="hidden" {...register("employeeNumber")} />
        <input type="hidden" {...register("idTeam")} />
        <input type="hidden" {...register("Discount")} />
        <input type="hidden" {...register("quantityDiscount", { valueAsNumber: true })} />

        {/* Datos del usuario */}
        <div className="np-grid">
          <div className="np-field">
            <label>Nombre del empleado</label>
            <input disabled value={displayName} />
          </div>
          <div className="np-field">
            <label>Número de empleado</label>
            <input disabled value={user?.numEmpleado || ""} />
          </div>
          <div className="np-field">
            <label>Área</label>
            <input disabled value={areaName} />
          </div>
          <div className="np-field">
            <label>Departamento</label>
            <select
              defaultValue={user?.department || ""}
              {...register("department")}
            >
              <option value="">Seleccione…</option>
              {DEPARTAMENTOS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Campos por tipo */}
        {permissionType === "minor" && (
          <div className="np-grid">
            <div className="np-field">
              <label>Fecha de ausencia</label>
              <input type="date" min={today} {...register("permissionDate", { required: "Requerido" })} />
              {errors.permissionDate && <small className="np-error">{errors.permissionDate.message}</small>}
            </div>
            <div className="np-field">
              <label>Entrada</label>
              <input type="time" {...register("startTime", { required: "Requerido" })} />
              {errors.startTime && <small className="np-error">{errors.startTime.message}</small>}
            </div>
            <div className="np-field">
              <label>Salida</label>
              <input type="time" {...register("endTime", { required: "Requerido" })} />
              {errors.endTime && <small className="np-error">{errors.endTime.message}</small>}
            </div>
            <div className="np-field np-col-2">
              <label>Razón (opcional)</label>
              <textarea rows={3} {...register("reason")} />
            </div>
          </div>
        )}

        {permissionType === "major" && (
          <div className="np-grid">
            <div className="np-field">
              <label>Inicio</label>
              <input type="date" min={today} {...register("permissionDateFrom", { required: "Requerido" })} />
              {errors.permissionDateFrom && <small className="np-error">{errors.permissionDateFrom.message}</small>}
            </div>
            <div className="np-field">
              <label>Fin</label>
              <input type="date" min={today} {...register("permissionDateTo", { required: "Requerido" })} />
              {errors.permissionDateTo && <small className="np-error">{errors.permissionDateTo.message}</small>}
            </div>
            <div className="np-field np-col-2">
              <label>Razón (opcional si adjuntas documento)</label>
              <textarea rows={3} {...register("reason")} />
            </div>
          </div>
        )}

        {permissionType === "incapacity" && (
          <div className="np-grid">
            <div className="np-field">
              <label>Inicio</label>
              <input type="date" min={today} {...register("sickLeaveDateFrom", { required: "Requerido" })} />
              {errors.sickLeaveDateFrom && <small className="np-error">{errors.sickLeaveDateFrom.message}</small>}
            </div>
            <div className="np-field">
              <label>Fin</label>
              <input type="date" min={today} {...register("sickLeaveDateTo", { required: "Requerido" })} />
              {errors.sickLeaveDateTo && <small className="np-error">{errors.sickLeaveDateTo.message}</small>}
            </div>
            <div className="np-field">
              <label>Tipo de incapacidad</label>
              <select {...register("incapacityType", { required: "Requerido" })}>
                <option value="">Seleccione…</option>
                <option value="Initial">Inicial</option>
                <option value="Extension">Prórroga</option>
              </select>
              {errors.incapacityType && <small className="np-error">{errors.incapacityType.message}</small>}
            </div>
            <div className="np-field">
              <label>Tipo de enfermedad</label>
              <select {...register("illnessType", { required: "Requerido" })}>
                <option value="">Seleccione…</option>
                <option value="Common illness">Enfermedad común</option>
                <option value="Work accident">Accidente laboral</option>
              </select>
              {errors.illnessType && <small className="np-error">{errors.illnessType.message}</small>}
            </div>
            <div className="np-field np-col-2">
              <small>Para incapacidad el documento es obligatorio.</small>
            </div>
          </div>
        )}

        {/* Documento */}
        <div className="np-field">
          <label>Documento de justificación</label>
          <input type="file" accept="image/*,.pdf" onChange={handleFileChange} />
          {docPreview && (
            /\.pdf(\?|$)/i.test(docPreview)
              ? <iframe className="np-preview" src={docPreview} title="doc" />
              : <img className="np-preview" src={docPreview} alt="preview" />
          )}
        </div>

        {/* Acciones */}
        <div className="np-actions">
          <button type="button" className="np-btn ghost" onClick={closeAndReset} disabled={isSubmitting}>
            Cancelar
          </button>
          <button type="submit" className="np-btn" disabled={isSubmitting}>
            {isSubmitting ? "Enviando…" : "Enviar permiso"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
