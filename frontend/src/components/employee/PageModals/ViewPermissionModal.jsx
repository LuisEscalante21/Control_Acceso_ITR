// src/components/employee/PageModals/ViewPermissionModal.jsx
import React, { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import "../PageModalStyles/ViewPermissionModal.css";

/** Corrige URLs de Cloudinary para PDFs guardados como RAW */
function normalizeCloudinaryUrl(url) {
  if (!url) return url;
  const isPdf = /\.pdf(\?|$)/i.test(url);
  if (isPdf && url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/raw/upload/");
  }
  return url;
}

export default function ViewPermissionModal({ isOpen, onClose, permission, onDeleted, deletePermission }) {
  if (!isOpen || !permission) return null;

  const {
    _id,
    permissionType,
    status,
    employeeName,
    employeeNumber,
    department,
    applicationDay,
    actionBy,
    reason,
    supportingDocument,
    // minor
    permissionDate,
    startTime,
    endTime,
    // major
    permissionDateFrom,
    permissionDateTo,
    // incapacity
    sickLeaveDateFrom,
    sickLeaveDateTo,
    incapacityType,
    illnessType,
    // sistema
    supervisorComments,
    createdAt,
    updatedAt,
  } = permission;

  const isPending = (status || "").toLowerCase() === "pending";
  const docUrl = normalizeCloudinaryUrl(supportingDocument);

  const labelStatus = useMemo(() => {
    const s = (status || "").toLowerCase();
    if (s === "pending") return "Pendiente";
    if (s === "approved") return "Aprobado";
    if (s === "rejected") return "Rechazado";
    if (s === "urgent") return "Urgente";
    return status || "-";
  }, [status]);

  const labelType = useMemo(() => {
    if (permissionType === "minor") return "Permiso menor";
    if (permissionType === "major") return "Permiso mayor";
    if (permissionType === "incapacity") return "Incapacidad";
    return permissionType || "-";
  }, [permissionType]);

  const fmtDate = (d) => {
    if (!d) return "-";
    try {
      const iso = typeof d === "string" ? d : new Date(d).toISOString();
      return iso.substring(0, 10);
    } catch {
      return String(d);
    }
  };

  // Cerrar con ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleDelete = async () => {
    if (!isPending) return;

    const result = await Swal.fire({
      title: "Eliminar permiso",
      text: "Solo se pueden eliminar permisos en estado Pendiente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      Swal.fire({ title: "Eliminando...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      // usar función del hook (sin rutas aquí)
      const res = await deletePermission(_id);

      Swal.close();

      if (!res.ok) {
        let msg = "";
        try { msg = (await res.json())?.message || ""; } catch {}
        return Swal.fire("Error", msg || `No se pudo eliminar (HTTP ${res.status})`, "error");
      }

      await Swal.fire("Eliminado", "El permiso fue eliminado.", "success");
      onDeleted?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire("Error", err.message || "No se pudo eliminar el permiso.", "error");
    }
  };

  const openDocument = () => {
    if (!docUrl) return;
    window.open(docUrl, "_blank", "noopener,noreferrer");
  };

  return createPortal(
    <div className="vp2-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="vp2-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vp2-header">
          <h3 className="vp2-title">{labelType}</h3>
          <button className="vp2-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {/* Body scrollable */}
        <div className="vp2-body">
          <div className="vp2-row">
            <span className={`vp2-status ${status?.toLowerCase()}`}>{labelStatus}</span>

            <div className="vp2-actions">
              <button
                className="vp2-btn ghost"
                onClick={openDocument}
                disabled={!docUrl}
                title={docUrl ? "Abrir en nueva pestaña" : "Sin documento"}
              >
                Ver documento
              </button>

              {isPending && (
                <button className="vp2-btn danger" onClick={handleDelete}>
                  Eliminar
                </button>
              )}
            </div>
          </div>

          {/* Datos comunes */}
          <div className="vp2-grid">
            <div className="vp2-field">
              <label>Colaborador</label>
              <div>{employeeName || "-"}</div>
            </div>
            <div className="vp2-field">
              <label>Código</label>
              <div>{employeeNumber || "-"}</div>
            </div>
            <div className="vp2-field">
              <label>Departamento</label>
              <div>{department || "-"}</div>
            </div>
            <div className="vp2-field">
              <label>Fecha de solicitud</label>
              <div>{applicationDay || "-"}</div>
            </div>
          </div>

          {permissionType === "minor" && (
            <>
              <h4 className="vp2-subtitle">Detalle permiso menor</h4>
              <div className="vp2-grid">
                <div className="vp2-field"><label>Fecha de ausencia</label><div>{fmtDate(permissionDate)}</div></div>
                <div className="vp2-field"><label>Entrada</label><div>{startTime || "-"}</div></div>
                <div className="vp2-field"><label>Salida</label><div>{endTime || "-"}</div></div>
              </div>
            </>
          )}

          {permissionType === "major" && (
            <>
              <h4 className="vp2-subtitle">Detalle permiso mayor</h4>
              <div className="vp2-grid">
                <div className="vp2-field"><label>Desde</label><div>{fmtDate(permissionDateFrom)}</div></div>
                <div className="vp2-field"><label>Hasta</label><div>{fmtDate(permissionDateTo)}</div></div>
              </div>
            </>
          )}

          {permissionType === "incapacity" && (
            <>
              <h4 className="vp2-subtitle">Detalle incapacidad</h4>
              <div className="vp2-grid">
                <div className="vp2-field"><label>Desde</label><div>{fmtDate(sickLeaveDateFrom)}</div></div>
                <div className="vp2-field"><label>Hasta</label><div>{fmtDate(sickLeaveDateTo)}</div></div>
                <div className="vp2-field"><label>Tipo de incapacidad</label><div>{incapacityType || "-"}</div></div>
                <div className="vp2-field"><label>Tipo de enfermedad</label><div>{illnessType || "-"}</div></div>
              </div>
            </>
          )}

          {(reason || supervisorComments || actionBy) && <h4 className="vp2-subtitle">Notas</h4>}
          <div className="vp2-notes">
            {reason && (<div className="vp2-note"><label>Razón del permiso</label><p>{reason}</p></div>)}
            {supervisorComments && (<div className="vp2-note"><label>Comentario del supervisor</label><p>{supervisorComments}</p></div>)}
            {actionBy && (<div className="vp2-note"><label>Gestionado por</label><p>{actionBy}</p></div>)}
          </div>

          <div className="vp2-meta">
            <small>Creado: {fmtDate(createdAt)} — Actualizado: {fmtDate(updatedAt)}</small>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
