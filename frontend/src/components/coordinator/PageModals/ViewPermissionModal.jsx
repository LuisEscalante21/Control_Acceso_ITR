import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
// Reusa tus clases CSS existentes (no agrego estilos internos)

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
}) {
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
    // descuento guardado
    Discount: discountSaved,
    quantityDiscount: qtySaved,
  } = permission;

  const isPending = (status || "").toLowerCase() === "pending";
  const docUrl = normalizeCloudinaryUrl(supportingDocument);

  // Combobox #2: acciones del coordinador
  const [action, setAction] = useState("approve"); // approve | reject
  const [comment, setComment] = useState(supervisorComments || "");
  const [Discount, setDiscount] = useState(!!discountSaved);
  const [quantityDiscount, setQuantityDiscount] = useState(Number(qtySaved || 0));

  useEffect(() => {
    setAction("approve");
    setComment(supervisorComments || "");
    setDiscount(!!discountSaved);
    setQuantityDiscount(Number(qtySaved || 0));
  }, [permission?._id]);

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

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const openDocument = () => {
    if (docUrl) window.open(docUrl, "_blank", "noopener,noreferrer");
  };

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

    if (typeof deletePermission !== "function") {
      return Swal.fire("Error", "deletePermission no está disponible.", "error");
    }

    try {
      Swal.fire({ title: "Eliminando...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const res = await deletePermission(_id);
      Swal.close();

      if (!res.ok) {
        let msg = "";
        try { msg = (await res.json())?.message || ""; } catch {}
        return Swal.fire("Error", msg || `No se pudo eliminar (HTTP ${res.status})`, "error");
      }
      await Swal.fire("Eliminado", "El permiso fue eliminado.", "success");
      onChanged?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire("Error", err.message || "No se pudo eliminar el permiso.", "error");
    }
  };

  const handleUpdate = async () => {
    if (!isPending) return;

    const statusTo = action === "approve" ? "approved" : "rejected";

    if (Discount && (quantityDiscount === "" || Number.isNaN(Number(quantityDiscount)) || Number(quantityDiscount) < 0)) {
      return Swal.fire("Falta dato", "Indica la cantidad de descuento (>= 0).", "warning");
    }

    if (typeof updatePermissionStatus !== "function") {
      return Swal.fire("Error", "updatePermissionStatus no está disponible.", "error");
    }

    try {
      Swal.fire({ title: "Actualizando...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const res = await updatePermissionStatus(_id, {
        status: statusTo,
        supervisorComments: comment,
        Discount,
        quantityDiscount: Number(quantityDiscount || 0),
      });
      Swal.close();

      if (!res.ok) {
        let msg = "";
        try { msg = (await res.json())?.message || ""; } catch {}
        return Swal.fire("Error", msg || `No se pudo actualizar (HTTP ${res.status})`, "error");
      }

      await Swal.fire("Guardado", "El permiso fue gestionado.", "success");
      onChanged?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire("Error", err.message || "No se pudo actualizar el permiso.", "error");
    }
  };

  return createPortal(
    <div className="vp2-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="vp2-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vp2-header">
          <h3 className="vp2-title">{labelType}</h3>
          <button className="vp2-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {/* Body */}
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

          {/* Datos */}
          <div className="vp2-grid">
            <div className="vp2-field"><label>Colaborador</label><div>{employeeName || "-"}</div></div>
            <div className="vp2-field"><label>Código</label><div>{employeeNumber || "-"}</div></div>
            <div className="vp2-field"><label>Departamento</label><div>{department || "-"}</div></div>
            <div className="vp2-field"><label>Fecha de solicitud</label><div>{applicationDay || "-"}</div></div>
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

          {/* Gestión (Combobox #2: acción + descuento + comentario) */}
          <h4 className="vp2-subtitle">Gestión</h4>
          <div className="vp2-grid">
            <div className="vp2-field">
              <label>Acción</label>
              <select value={action} onChange={(e) => setAction(e.target.value)} disabled={!isPending}>
                <option value="approve">Aprobar</option>
                <option value="reject">Rechazar</option>
              </select>
            </div>

            <div className="vp2-field">
              <label>Aplicar descuento</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={Discount}
                  onChange={(e) => setDiscount(e.target.checked)}
                  disabled={!isPending}
                />
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={quantityDiscount}
                  onChange={(e) => setQuantityDiscount(Number(e.target.value))}
                  placeholder="Cantidad"
                  disabled={!isPending || !Discount}
                  style={{ width: 120 }}
                />
              </div>
            </div>

            <div className="vp2-field" style={{ gridColumn: "1 / -1" }}>
              <label>Comentario del supervisor</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe un comentario…"
                disabled={!isPending}
              />
            </div>
          </div>

          <div className="vp2-actions" style={{ marginTop: 12 }}>
            <button className="vp2-btn ghost" onClick={onClose}>Cerrar</button>
            {isPending && (
              <button className="vp2-btn" onClick={handleUpdate}>
                {action === "approve" ? "Aprobar" : "Rechazar"}
              </button>
            )}
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
