import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import "../PageModalStyles/NewPermissionModal.css";

import useDataCredentials from "../../../hooks/Global/useDataCredentials";
import useDataTeams from "../../../hooks/Global/useDataTeams";

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
  } = useForm({
    defaultValues: {
      applicationDay: "",
      employeeNumber: "",
      idTeam: "",
      Discount: false,
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
    },
  });

  const displayName = useMemo(() => {
    if (!user) return "";
    if (user.names || user.surnames)
      return `${user.names || ""} ${user.surnames || ""}`.trim();
    return user.fullName || "";
  }, [user]);

  const areaName = useMemo(() => {
    const id = user?.idTeam || user?.IdTeam;
    return id ? getTeamNameById?.(id) || "Área desconocida" : "";
  }, [user?.idTeam, user?.IdTeam, getTeamNameById]);

  useEffect(() => {
    if (!loading && user) {
      reset({
        applicationDay: today,
        employeeNumber: user?.numEmpleado || "",
        idTeam: user?.idTeam || user?.IdTeam || "",
        Discount: false,
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

  const validateByType = (form) => {
    if (permissionType === "minor") {
      if (!form.permissionDate || !form.startTime || !form.endTime)
        return "Completa fecha de ausencia, entrada y salida.";
      if (form.startTime >= form.endTime)
        return "La hora de entrada no puede ser mayor o igual a la de salida.";
    }
    if (permissionType === "major") {
      if (!form.permissionDateFrom || !form.permissionDateTo)
        return "Completa fecha de inicio y fin para permiso mayor.";
      if (form.permissionDateFrom > form.permissionDateTo)
        return "La fecha de inicio no puede ser posterior a la fecha de fin.";
      if (!form.reason && !file)
        return "Para permiso mayor incluye una razón o adjunta documento.";
    }
    if (permissionType === "incapacity") {
      if (!form.sickLeaveDateFrom || !form.sickLeaveDateTo)
        return "Completa fecha de inicio y fin para incapacidad.";
      if (form.sickLeaveDateFrom > form.sickLeaveDateTo)
        return "La fecha de inicio no puede ser posterior a la fecha de fin.";
      if (!form.incapacityType || !form.illnessType)
        return "Selecciona el tipo de incapacidad y de enfermedad.";
      if (!file) return "Para incapacidad el documento es obligatorio.";
    }
    return null;
  };

  const onSubmit = async (form) => {
    const typeErr = validateByType(form);
    if (typeErr) return Swal.fire("Datos incompletos", typeErr, "error");

    try {
      Swal.fire({ title: "Enviando permiso...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const fd = new FormData();
      fd.append("permissionType", permissionType);
      fd.append("applicationDay", form.applicationDay);
      fd.append("Discount", form.Discount ?? false);

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
        const msg = (await res.json())?.message || "Error al enviar.";
        Swal.close();
        return Swal.fire("Error", msg, "error");
      }

      Swal.close();
      await Swal.fire("¡Éxito!", "Permiso enviado correctamente.", "success");
      onSaved?.();
      closeAndReset();
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire("Error", err.message || "No se pudo enviar el permiso.", "error");
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="np-overlay">
      <form className="np-content" onSubmit={handleSubmit(onSubmit)} noValidate>
        <button type="button" className="np-close" onClick={closeAndReset}>×</button>

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

        <input type="hidden" {...register("applicationDay")} />
        <input type="hidden" {...register("employeeNumber")} />
        <input type="hidden" {...register("idTeam")} />
        <input type="hidden" {...register("Discount")} />

        <div className="np-grid">
          <div className="np-field"><label>Nombre del empleado</label><input disabled value={displayName} /></div>
          <div className="np-field"><label>Número de empleado</label><input disabled value={user?.numEmpleado || ""} /></div>
          <div className="np-field"><label>Área</label><input disabled value={areaName} /></div>
        </div>

        {permissionType === "minor" && (
          <div className="np-grid">
            <div className="np-field"><label>Fecha de ausencia</label><input type="date" min={today} {...register("permissionDate", { required: "Requerido" })} /></div>
            <div className="np-field"><label>Entrada</label><input type="time" {...register("startTime", { required: "Requerido" })} /></div>
            <div className="np-field"><label>Salida</label><input type="time" {...register("endTime", { required: "Requerido" })} /></div>
            <div className="np-field np-col-2"><label>Razón (opcional)</label><textarea rows={3} {...register("reason")} /></div>
          </div>
        )}

        {permissionType === "major" && (
          <div className="np-grid">
            <div className="np-field"><label>Inicio</label><input type="date" min={today} {...register("permissionDateFrom", { required: "Requerido" })} /></div>
            <div className="np-field"><label>Fin</label><input type="date" min={today} {...register("permissionDateTo", { required: "Requerido" })} /></div>
            <div className="np-field np-col-2"><label>Razón (opcional si adjuntas documento)</label><textarea rows={3} {...register("reason")} /></div>
          </div>
        )}

        {permissionType === "incapacity" && (
          <div className="np-grid">
            <div className="np-field"><label>Inicio</label><input type="date" min={today} {...register("sickLeaveDateFrom", { required: "Requerido" })} /></div>
            <div className="np-field"><label>Fin</label><input type="date" min={today} {...register("sickLeaveDateTo", { required: "Requerido" })} /></div>
            <div className="np-field"><label>Tipo de incapacidad</label>
              <select {...register("incapacityType", { required: "Requerido" })}>
                <option value="">Seleccione…</option>
                <option value="Initial">Inicial</option>
                <option value="Extension">Prórroga</option>
              </select>
            </div>
            <div className="np-field"><label>Tipo de enfermedad</label>
              <select {...register("illnessType", { required: "Requerido" })}>
                <option value="">Seleccione…</option>
                <option value="Common illness">Enfermedad común</option>
                <option value="Work accident">Accidente laboral</option>
              </select>
            </div>
          </div>
        )}

        <div className="np-field">
          <label>Documento de justificación</label>
          <input type="file" accept="image/*,.pdf" onChange={handleFileChange} />
          {docPreview && (
            /\.pdf(\?|$)/i.test(docPreview)
              ? <iframe className="np-preview" src={docPreview} title="doc" />
              : <img className="np-preview" src={docPreview} alt="preview" />
          )}
        </div>

        <div className="np-actions">
          <button type="button" className="np-btn ghost" onClick={closeAndReset} disabled={isSubmitting}>Cancelar</button>
          <button type="submit" className="np-btn" disabled={isSubmitting}>{isSubmitting ? "Enviando…" : "Enviar permiso"}</button>
        </div>
      </form>
    </div>,
    document.body
  );
}
