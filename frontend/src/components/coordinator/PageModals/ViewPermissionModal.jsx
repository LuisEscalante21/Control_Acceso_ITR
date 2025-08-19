import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import "../PageStyles/ViewPermission.css";

export default function ViewPermissionModal({
  isOpen, onClose, permission,
  onChanged, deletePermission, updatePermissionStatus, currentUserId
}) {
  if (!isOpen || !permission) return null;

  const { _id, idUser, permissionType, status, employeeName, employeeNumber,
    department, applicationDay, reason, supervisorComments,
    permissionDate, startTime, endTime,
    permissionDateFrom, permissionDateTo,
    sickLeaveDateFrom, sickLeaveDateTo, incapacityType, illnessType,
    createdAt, updatedAt,
    Discount: discountSaved, quantityDiscount: qtySaved } = permission;

  const isPending = (status || "").toLowerCase() === "pending";
  const isOwn = currentUserId && String(idUser) === String(currentUserId);

  const [action, setAction] = useState("approve");
  const [comment, setComment] = useState(supervisorComments || "");
  const [quantityDiscount, setQuantityDiscount] = useState(qtySaved || "");

  useEffect(() => {
    setAction("approve");
    setComment(supervisorComments || "");
    setQuantityDiscount(qtySaved || "");
  }, [permission?._id]);

  const canEdit = isPending && !isOwn;

  const labelStatus = useMemo(() => {
    const s = (status || "").toLowerCase();
    if (s === "pending") return "Pendiente";
    if (s === "approved") return "Aprobado";
    if (s === "rejected") return "Rechazado";
    return status || "-";
  }, [status]);

  const fmtDate = (d) => !d ? "-" : String(d).substring(0,10);

  const handleUpdate = async () => {
    if (!canEdit) return;
    const statusTo = action === "approve" ? "approved" : "rejected";

    if (quantityDiscount !== "" && Number(quantityDiscount) < 0) {
      return Swal.fire("Dato inválido", "El descuento debe ser un número mayor o igual a 0.", "warning");
    }

    Swal.fire({ title:"Guardando...", allowOutsideClick:false, didOpen:()=>Swal.showLoading() });
    const res = await updatePermissionStatus(_id,{
      status:statusTo,
      supervisorComments:comment,
      Discount: Number(quantityDiscount) > 0,
      quantityDiscount: Number(quantityDiscount||0)
    });
    Swal.close();

    if(!res.ok) return Swal.fire("Error","No se pudo actualizar","error");

    await Swal.fire("Actualizado","El permiso se actualizó correctamente","success");
    onChanged?.(); onClose?.();
  };

  return createPortal(
    <div className="vp2-overlay">
      <div className="vp2-modal" role="dialog" aria-modal="true">
        <div className="vp2-header">
          <h3 className="vp2-title">{permissionType}</h3>
          <button className="vp2-close" onClick={onClose}>×</button>
        </div>

        <div className="vp2-body">
          <span className={`vp2-status ${status?.toLowerCase()}`}>{labelStatus}</span>

          <div className="vp2-grid">
            <div className="vp2-field"><label>Colaborador</label><div>{employeeName}</div></div>
            <div className="vp2-field"><label>Código</label><div>{employeeNumber}</div></div>
            <div className="vp2-field"><label>Departamento</label><div>{department}</div></div>
            <div className="vp2-field"><label>Fecha solicitud</label><div>{applicationDay}</div></div>
          </div>

          {permissionType==="minor" && (
            <div className="vp2-grid">
              <div className="vp2-field"><label>Fecha</label><div>{fmtDate(permissionDate)}</div></div>
              <div className="vp2-field"><label>Entrada</label><div>{startTime}</div></div>
              <div className="vp2-field"><label>Salida</label><div>{endTime}</div></div>
            </div>
          )}

          {permissionType==="major" && (
            <div className="vp2-grid">
              <div className="vp2-field"><label>Desde</label><div>{fmtDate(permissionDateFrom)}</div></div>
              <div className="vp2-field"><label>Hasta</label><div>{fmtDate(permissionDateTo)}</div></div>
            </div>
          )}

          {permissionType==="incapacity" && (
            <div className="vp2-grid">
              <div className="vp2-field"><label>Desde</label><div>{fmtDate(sickLeaveDateFrom)}</div></div>
              <div className="vp2-field"><label>Hasta</label><div>{fmtDate(sickLeaveDateTo)}</div></div>
              <div className="vp2-field"><label>Tipo incapacidad</label><div>{incapacityType}</div></div>
              <div className="vp2-field"><label>Tipo enfermedad</label><div>{illnessType}</div></div>
            </div>
          )}

          {reason && (
            <div className="vp2-notes">
              <div className="vp2-note"><label>Razón</label><p>{reason}</p></div>
            </div>
          )}

          <h4 className="vp2-subtitle">Gestión</h4>
          <div className="vp2-grid">
            {canEdit ? (
              <>
                <div className="vp2-field">
                  <label>Acción</label>
                  <select value={action} onChange={(e)=>setAction(e.target.value)}>
                    <option value="approve">Aprobar</option>
                    <option value="reject">Rechazar</option>
                  </select>
                </div>
                <div className="vp2-field">
                  <label>Descuento</label>
                  <input type="number" min="0"
                    value={quantityDiscount}
                    onChange={(e)=>setQuantityDiscount(e.target.value)}/>
                </div>
                <div className="vp2-field" style={{gridColumn:"1 / -1"}}>
                  <label>Comentario del supervisor</label>
                  <textarea value={comment} onChange={(e)=>setComment(e.target.value)}/>
                </div>
              </>
            ) : (
              <>
                <div className="vp2-field">
                  <label>Acción</label>
                  <div>{labelStatus}</div>
                </div>
                <div className="vp2-field">
                  <label>Descuento aplicado</label>
                  <div>{discountSaved ? `${qtySaved || 0}` : "No aplica"}</div>
                </div>
                {supervisorComments && (
                  <div className="vp2-field" style={{gridColumn:"1 / -1"}}>
                    <label>Comentario del supervisor</label>
                    <div>{supervisorComments}</div>
                  </div>
                )}
              </>
            )}
          </div>

          {canEdit && (
            <div className="vp2-footer">
              <button className="vp2-btn ghost" onClick={onClose}>Cerrar</button>
              <button className="vp2-btn primary" onClick={handleUpdate}>
                {action==="approve"?"Aprobar":"Rechazar"}
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
