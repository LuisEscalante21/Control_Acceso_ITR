import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import "../../ModalStyle/ViewPemission.css";

const normalizeCloudinaryUrl = (url) => {
  if (!url) return url;
  const isPdf = /\.pdf(\?|$)/i.test(url);
  if (isPdf && url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/raw/upload/");
  }
  return url;
};

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

export default function AdminViewPermissionModal({
  isOpen,
  onClose,
  permission,
  onChanged,
  updatePermissionStatus,
  deletePermission,
}) {
  if (!isOpen || !permission) return null;

  const {
    _id,
    permissionType,
    status,
    employeeName,
    employeeNumber,
    applicationDay,
    reason,
    supportingDocument,
    permissionDate,
    startTime,
    endTime,
    permissionDateFrom,
    permissionDateTo,
    sickLeaveDateFrom,
    sickLeaveDateTo,
    incapacityType,
    illnessType,
    supervisorComments: savedComments,
    createdAt,
    updatedAt,
    Discount: savedDiscount,
    actionBy,
  } = permission;

  const [action, setAction] = useState("approved");
  const [supervisorComments, setSupervisorComments] = useState("");
  const [applyDiscount, setApplyDiscount] = useState(!!savedDiscount);

  useEffect(() => {
    setAction("approved");
    setSupervisorComments("");
    setApplyDiscount(!!savedDiscount);
  }, [permission?._id, savedDiscount]);

  const docUrl = normalizeCloudinaryUrl(supportingDocument);
  const isPending = (status || "").toLowerCase() === "pending";

  const labelStatus = useMemo(() => {
    const s = (status || "").toLowerCase();
    if (permissionType === "incapacity" && isPending) return "! Urgente";
    if (s === "pending") return "Pendiente";
    if (s === "approved") return "Aprobado";
    if (s === "rejected") return "Rechazado";
    return status || "-";
  }, [status, permissionType, isPending]);

  const fmtDate = (d) => {
    if (!d) return "-";
    try {
      const iso = typeof d === "string" ? d : new Date(d).toISOString();
      return iso.substring(0, 10);
    } catch {
      return String(d);
    }
  };

  const fmtTime = (hour, min) =>
    `${hour?.toString().padStart(2, "0")}:${min?.toString().padStart(2, "0")}`;

  const handleSave = async () => {
    try {
      Swal.fire({
        title: "Guardando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const payload = {
        status: action,
        supervisorComments,
        actionBy: getActionData(action),
      };
      payload.Discount = action === "approved" ? applyDiscount : false;

      const res = await updatePermissionStatus(_id, payload);
      Swal.close();

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        return Swal.fire("Error", msg?.message || `HTTP ${res.status}`, "error");
      }

      await Swal.fire("Listo", "Permiso actualizado correctamente.", "success");
      onChanged?.();
      onClose?.();
    } catch (err) {
      Swal.close();
      Swal.fire("Error", err.message || "No se pudo actualizar.", "error");
    }
  };

  const handleDeleteOne = async () => {
    if (!isPending) return;
    const r = await Swal.fire({
      title: "Eliminar permiso",
      text: "Solo se pueden eliminar permisos pendientes.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!r.isConfirmed) return;

    const res = await deletePermission(_id);
    if (!res.ok) {
      const msg = await res.json().catch(() => ({}));
      return Swal.fire("Error", msg?.message || `HTTP ${res.status}`, "error");
    }
    await Swal.fire("Eliminado", "Permiso eliminado.", "success");
    onChanged?.();
    onClose?.();
  };

  const openDocument = () => {
    if (docUrl) window.open(docUrl, "_blank", "noopener,noreferrer");
  };

  return createPortal(
    <div className="vp2-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="vp2-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vp2-header">
          <h3 className="vp2-title">
            {permissionType === "minor"
              ? "Permiso menor"
              : permissionType === "major"
              ? "Permiso mayor"
              : "Incapacidad"}
          </h3>
          <button className="vp2-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="vp2-body">
          {/* Estado y acciones */}
          <div className="vp2-row">
            <span
              className={`vp2-status ${
                permissionType === "incapacity" && isPending
                  ? "urgent"
                  : status?.toLowerCase()
              }`}
            >
              {labelStatus}
            </span>
            <div className="vp2-actions">
              <button className="vp2-btn ghost" onClick={openDocument} disabled={!docUrl}>
                Ver documento
              </button>
              {isPending && (
                <button className="vp2-btn danger" onClick={handleDeleteOne}>
                  Eliminar
                </button>
              )}
            </div>
          </div>

          {/* Datos principales */}
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
              <label>Fecha de solicitud</label>
              <div>{applicationDay || "-"}</div>
            </div>
          </div>

        

          {/* Notas */}
          {(reason || savedComments) && <h4 className="vp2-subtitle">Notas</h4>}
          <div className="vp2-notes">
            {reason && (
              <div className="vp2-note">
                <label>Razón del permiso</label>
                <p>{reason}</p>
              </div>
            )}
            {savedComments && (
              <div className="vp2-note">
                <label>Comentario previo</label>
                <p>{savedComments}</p>
              </div>
            )}
          </div>

          {/* Gestión */}
          {isPending && (
            <>
              <h4 className="vp2-subtitle">Gestión</h4>
              <div className="vp2-grid">
                <div className="vp2-field">
                  <label>Acción</label>
                  <select value={action} onChange={(e) => setAction(e.target.value)}>
                    <option value="approved">Aprobar</option>
                    <option value="rejected">Rechazar</option>
                  </select>
                </div>
                {action === "approved" && (
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
                  <textarea
                    value={supervisorComments}
                    onChange={(e) => setSupervisorComments(e.target.value)}
                    placeholder="Escribe un comentario..."
                  />
                </div>
              </div>

              {/* 👇 Botones de acción abajo del modal */}
              <div className="vp2-footer">
                <button className="vp2-btn ghost" onClick={onClose}>
                  Cancelar
                </button>
                <button className="vp2-btn primary" onClick={handleSave}>
                  Guardar cambios
                </button>
              </div>
            </>
          )}

            {/* 🧾 Historial */}
          {Array.isArray(actionBy) && actionBy.length > 0 && (
            <>
              <h4 className="vp2-subtitle">Historial</h4>
              <ul className="vp2-history">
                {actionBy
                  .sort((a, b) => {
                    const da = new Date(a.year, a.month - 1, a.day, a.hour, a.min);
                    const db = new Date(b.year, b.month - 1, b.day, b.hour, b.min);
                    return da - db;
                  })
                  .map((a, idx) => {
                    const day = String(a.day).padStart(2, "0");
                    const month = String(a.month).padStart(2, "0");
                    const year = a.year;
                    const label =
                      a.type === "approved"
                        ? "Aprobado por"
                        : a.type === "rejected"
                        ? "Rechazado por"
                        : "Gestionado por";

                    return (
                      <li key={a._id || idx}>
                        <strong>{label}</strong> {a.user || "-"}    {day}/{month}/{year}{" "}
                        {fmtTime(a.hour, a.min)}
                      </li>
                    );
                  })}
              </ul>
            </>
          )}

          <div className="vp2-meta">
            <small>
              Creado: {fmtDate(createdAt)} — Actualizado: {fmtDate(updatedAt)}
            </small>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
