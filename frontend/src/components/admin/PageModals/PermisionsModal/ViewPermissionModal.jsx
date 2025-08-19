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
    department,
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
    quantityDiscount: savedQty,
  } = permission;

  const [action, setAction] = useState("approved");
  const [supervisorComments, setSupervisorComments] = useState("");
  const [applyDiscount, setApplyDiscount] = useState(!!savedDiscount);
  const [quantityDiscount, setQuantityDiscount] = useState(
    typeof savedQty === "number" ? String(savedQty) : ""
  );

  useEffect(() => {
    setAction("approved");
    setSupervisorComments("");
    setApplyDiscount(!!savedDiscount);
    setQuantityDiscount(typeof savedQty === "number" ? String(savedQty) : "");
  }, [permission?._id, savedDiscount, savedQty]);

  const docUrl = normalizeCloudinaryUrl(supportingDocument);
  const isPending = (status || "").toLowerCase() === "pending";

  const labelStatus = useMemo(() => {
    if (permissionType === "incapacity" && isPending) return "🚨 Urgente";
    const s = (status || "").toLowerCase();
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

const handleSave = async () => {
  try {
    if (action === "approved") {
      if (
        quantityDiscount === "" ||
        isNaN(Number(quantityDiscount)) ||
        Number(quantityDiscount) < 0
      ) {
        return Swal.fire(
          "Dato inválido",
          "El descuento debe ser un número mayor o igual a 0.",
          "warning"
        );
      }
    }

    Swal.fire({
      title: "Guardando...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const payload = {
      status: action,
      supervisorComments,
    };

    if (action === "approved") {
      const num = Number(quantityDiscount) || 0;
      payload.Discount = num > 0;      // true si > 0
      payload.quantityDiscount = num;  // valor real
    } else {
      payload.Discount = false;
      payload.quantityDiscount = 0;
    }

    const res = await updatePermissionStatus(_id, payload);
    Swal.close();

    if (!res.ok) {
      const msg = await res.json().catch(() => ({}));
      return Swal.fire("Error", msg?.message || `HTTP ${res.status}`, "error");
    }

    await Swal.fire("Listo", "Permiso actualizado.", "success");
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

        <div className="vp2-body">
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

          {/* Datos base */}
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
                <div className="vp2-field">
                  <label>Fecha de ausencia</label>
                  <div>{fmtDate(permissionDate)}</div>
                </div>
                <div className="vp2-field">
                  <label>Entrada</label>
                  <div>{startTime || "-"}</div>
                </div>
                <div className="vp2-field">
                  <label>Salida</label>
                  <div>{endTime || "-"}</div>
                </div>
              </div>
            </>
          )}

          {permissionType === "major" && (
            <>
              <h4 className="vp2-subtitle">Detalle permiso mayor</h4>
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
            </>
          )}

          {permissionType === "incapacity" && (
            <>
              <h4 className="vp2-subtitle">Detalle incapacidad</h4>
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
                  <label>Tipo de incapacidad</label>
                  <div>{incapacityType || "-"}</div>
                </div>
                <div className="vp2-field">
                  <label>Tipo de enfermedad</label>
                  <div>{illnessType || "-"}</div>
                </div>
              </div>
            </>
          )}

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

                <div className="vp2-field">
  <label>Aplicar descuento</label>
  <div className="">
    <input
      type="number"
      min="0"
      step="0.5"
      value={quantityDiscount}
      onChange={(e) => setQuantityDiscount(e.target.value)}
      placeholder="Cantidad"
      disabled={action !== "approved"}
    />
  </div>
</div>


                <div className="vp2-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Comentario del supervisor</label>
                  <textarea
                    value={supervisorComments}
                    onChange={(e) => setSupervisorComments(e.target.value)}
                    placeholder="Escribe un comentario..."
                  />
                </div>
              </div>

              <div className="vp2-actions end">
                <button className="vp2-btn primary" onClick={handleSave}>
                  Guardar
                </button>
              </div>
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
