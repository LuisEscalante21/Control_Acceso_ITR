import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import "../PageStyles/ViewPermission.css";

// 🔧 Normalizador para PDFs de Cloudinary
function normalizeCloudinaryUrl(url) {
  if (!url) return url;
  const isPdf = /\.pdf(\?|$)/i.test(url);
  if (isPdf && url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/raw/upload/");
  }
  return url;
}

// 🕒 Genera la acción con usuario, hora y tipo de acción
const getActionData = (type) => {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const fullName =
    storedUser.fullName ||
    `${storedUser.names ?? ""} ${storedUser.surnames ?? ""}`.trim() ||
    "Usuario desconocido";

  const now = new Date();
  return {
    user: fullName,
    day: now.getDate(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    hour: now.getHours(),
    min: now.getMinutes(),
    type,
  };
};

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
    actionBy,
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
  const fmtTime = (hour, min) =>
    `${hour?.toString().padStart(2, "0")}:${min?.toString().padStart(2, "0")}`;

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
      actionBy: getActionData(statusTo),
    });

    Swal.close();

    if (!res || !res.ok) {
      return Swal.fire("Error", res?.message || "No se pudo actualizar", "error");
    }

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

          {/* Datos comunes */}
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

          {/* Razón */}
          {reason && (
            <div className="vp2-notes">
              <div className="vp2-note">
                <label>Razón</label>
                <p>{reason}</p>
              </div>
            </div>
          )}

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

          {/* 🧾 Historial de acciones */}
          {Array.isArray(actionBy) && actionBy.length > 0 && (
            <>
              <h4 className="vp2-subtitle">Historial de acciones</h4>
              <ul className="vp2-history">
                {actionBy
                  .sort((a, b) => {
                    const da = new Date(a.year, a.month - 1, a.day, a.hour, a.min);
                    const db = new Date(b.year, b.month - 1, b.day, b.hour, b.min);
                    return da - db;
                  })
                  .map((a, idx) => {
                    const day = String(a.day ?? "").padStart(2, "0");
                    const month = String(a.month ?? "").padStart(2, "0");
                    const year = a.year ?? "-";
                    const label =
                      a.type === "approved"
                        ? "Aprobado por"
                        : a.type === "rejected"
                        ? "Rechazado por"
                        : "Gestionado por";
                    return (
                      <li key={a._id || idx}>
                        <strong>{label}</strong> {a.user || "-"} {day}/{month}/{year}{" "}
                        {fmtTime(a.hour, a.min)}
                      </li>
                    );
                  })}
              </ul>
            </>
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
