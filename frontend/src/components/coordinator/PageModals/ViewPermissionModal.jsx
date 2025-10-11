import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import "../PageStyles/ViewPermission.css";

// 🔧 Normalizador para PDFs
function normalizeCloudinaryUrl(url) {
  if (!url) return url;
  const isPdf = /\.pdf(\?|$)/i.test(url);
  if (isPdf && url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/raw/upload/");
  }
  return url;
}

export default function ViewPermissionModal({
  isOpen,
  onClose,
  permission,
  onChanged,
  deletePermission,
  updatePermissionStatus,
  currentUserId,
}) {
  if (!isOpen || !permission) return null;

  const {
    _id,
    idUser,
    permissionType,
    status,
    employeeName,
    employeeNumber,
    department,
    applicationDay,
    reason,
    supervisorComments,
    permissionDate,
    startTime,
    endTime,
    permissionDateFrom,
    permissionDateTo,
    sickLeaveDateFrom,
    sickLeaveDateTo,
    incapacityType,
    illnessType,
    createdAt,
    updatedAt,
    Discount: discountSaved,
    supportingDocument,
  } = permission;

  const docUrl = normalizeCloudinaryUrl(supportingDocument);
  const isPending = (status || "").toLowerCase() === "pending";
  const isOwn = currentUserId && String(idUser) === String(currentUserId);

  const [action, setAction] = useState("approve");
  const [comment, setComment] = useState(supervisorComments || "");
  const [applyDiscount, setApplyDiscount] = useState(!!discountSaved);

  useEffect(() => {
    setAction("approve");
    setComment(supervisorComments || "");
    setApplyDiscount(!!discountSaved);
  }, [permission?._id]);

  const canEdit = isPending && !isOwn;

  const labelStatus = useMemo(() => {
    const s = (status || "").toLowerCase();
    if (s === "pending") return "Pendiente";
    if (s === "approved") return "Aprobado";
    if (s === "rejected") return "Rechazado";
    return status || "-";
  }, [status]);

  const fmtDate = (d) => (!d ? "-" : String(d).substring(0, 10));

  //Actualizado: si rechaza, nunca se envía descuento
  const handleUpdate = async () => {
    if (!canEdit) return;

    const statusTo = action === "approve" ? "approved" : "rejected";
    const finalDiscount = action === "approve" ? applyDiscount : false;

    Swal.fire({
      title: "Guardando...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await updatePermissionStatus(_id, {
      status: statusTo,
      supervisorComments: comment,
      Discount: finalDiscount,
    });

    Swal.close();

    if (!res.ok) return Swal.fire("Error", "No se pudo actualizar", "error");

    await Swal.fire("Actualizado", "El permiso se actualizó correctamente", "success");
    onChanged?.();
    onClose?.();
  };

  return createPortal(
    <div className="vp2-overlay">
      <div className="vp2-modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="vp2-header">
          <h3 className="vp2-title">
            {permissionType === "minor"
              ? "Permiso menor"
              : permissionType === "major"
              ? "Permiso mayor"
              : permissionType === "incapacity"
              ? "Incapacidad"
              : "Permiso"}
          </h3>
          <button className="vp2-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="vp2-body">
          {/* Estado + Ver documento */}
          <div className="vp2-row">
            <span className={`vp2-status ${status?.toLowerCase()}`}>{labelStatus}</span>

            <div className="vp2-actions">
              <button
                className="vp2-btn ghost"
                onClick={() => docUrl && window.open(docUrl, "_blank", "noopener,noreferrer")}
                disabled={!docUrl}
                title={docUrl ? "Abrir documento" : "Sin documento"}
              >
                Ver documento
              </button>
            </div>
          </div>

          {/* Datos básicos */}
          <div className="vp2-grid">
            <div className="vp2-field">
              <label>Colaborador</label>
              <div>{employeeName}</div>
            </div>
            <div className="vp2-field">
              <label>Código</label>
              <div>{employeeNumber}</div>
            </div>
            
            <div className="vp2-field">
              <label>Fecha de solicitud</label>
              <div>{applicationDay}</div>
            </div>
          </div>

          {/* Detalles según tipo */}
          {permissionType === "minor" && (
            <div className="vp2-grid">
              <div className="vp2-field">
                <label>Fecha</label>
                <div>{fmtDate(permissionDate)}</div>
              </div>
              <div className="vp2-field">
                <label>Entrada</label>
                <div>{startTime}</div>
              </div>
              <div className="vp2-field">
                <label>Salida</label>
                <div>{endTime}</div>
              </div>
            </div>
          )}

          {permissionType === "major" && (
            <div className="vp2-grid">
              <div className="vp2-field">
                <label>Desde</label>
                <div>{fmtDate(permissionDateFrom)}</div>
              </div>
              <div className="vp2-field">
                <label>Hasta</label>
                <div>{fmtDate(permissionDateTo)}</div>
              </div>
            </div>
          )}

          {permissionType === "incapacity" && (
            <div className="vp2-grid">
              <div className="vp2-field">
                <label>Desde</label>
                <div>{fmtDate(sickLeaveDateFrom)}</div>
              </div>
              <div className="vp2-field">
                <label>Hasta</label>
                <div>{fmtDate(sickLeaveDateTo)}</div>
              </div>
              <div className="vp2-field">
                <label>Tipo incapacidad</label>
                <div>{incapacityType}</div>
              </div>
              <div className="vp2-field">
                <label>Tipo enfermedad</label>
                <div>{illnessType}</div>
              </div>
            </div>
          )}

          {reason && (
            <div className="vp2-notes">
              <div className="vp2-note">
                <label>Razón</label>
                <p>{reason}</p>
              </div>
            </div>
          )}

          {/* Gestión */}
          <h4 className="vp2-subtitle">Gestión</h4>
          <div className="vp2-grid">
            {canEdit ? (
              <>
                <div className="vp2-field">
                  <label>Acción</label>
                  <select value={action} onChange={(e) => setAction(e.target.value)}>
                    <option value="approve">Aprobar</option>
                    <option value="reject">Rechazar</option>
                  </select>
                </div>

                {/* 🔸 Solo mostrar la opción de descuento si aprueba */}
                {action === "approve" && (
                  <div className="vp2-field">
                    <label>¿Aplica descuento?</label>
                    <select
                      value={applyDiscount ? "yes" : "no"}
                      onChange={(e) => setApplyDiscount(e.target.value === "yes")}
                    >
                      <option value="no">No</option>
                      <option value="yes">Sí</option>
                    </select>
                  </div>
                )}

                <div className="vp2-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Comentario del supervisor</label>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <div className="vp2-field">
                  <label>Acción</label>
                  <div>{labelStatus}</div>
                </div>
                <div className="vp2-field">
                  <label>¿Aplica descuento?</label>
                  <div>{discountSaved ? "Sí" : "No"}</div>
                </div>
                {supervisorComments && (
                  <div className="vp2-field" style={{ gridColumn: "1 / -1" }}>
                    <label>Comentario del supervisor</label>
                    <div>{supervisorComments}</div>
                  </div>
                )}
              </>
            )}
          </div>

          {canEdit && (
            <div className="vp2-footer">
              <button className="vp2-btn ghost" onClick={onClose}>
                Cancelar
              </button>
              <button className="vp2-btn primary" onClick={handleUpdate}>
                {action === "approve" ? "Aprobar" : "Rechazar"}
              </button>
            </div>
          )}

          <div className="vp2-meta">
            Creado: {fmtDate(createdAt)} — Actualizado: {fmtDate(updatedAt)}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
