// src/hooks/Global/useDataPermissions.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const API_BASE =
  window.location.hostname === "localhost" ? "http://localhost:4000" : "";
const API_URL = `${API_BASE}/api/permissions`;

const useDataPermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleNetworkError = (err) => {
    console.error("useDataPermissions error:", err);
    if (err instanceof TypeError) navigate("/503");
  };

  const safeJsonMessage = async (res) => {
    try {
      const data = await res.json();
      return data?.message || null;
    } catch {
      try { return await res.text(); } catch { return null; }
    }
  };

  // ===================== EMPLEADO: Mis permisos =====================
  // GET /api/permissions/mine
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/mine`, { credentials: "include" });
      if (!res.ok) {
        const msg = await safeJsonMessage(res);
        throw new Error(msg || `Error ${res.status} al obtener permisos`);
      }
      const body = await res.json();
      setPermissions(Array.isArray(body?.data) ? body.data : []);
    } catch (err) {
      setError(err);
      handleNetworkError(err);
      Swal.fire("Error", err.message || "No se pudieron obtener los permisos.", "error");
    } finally {
      setLoading(false);
    }
  };

  // POST /api/permissions (multipart)
  const postPermissionMultipart = async (formData) => {
    const res = await fetch(API_URL, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    return res;
  };

  // DELETE /api/permissions/:id
  const deletePermission = async (id) => {
    return fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
  };

  // ===================== COORDINADOR: Permisos del área =====================
  // GET /api/permissions/team
  const fetchTeamPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/team`, { credentials: "include" });
      if (!res.ok) {
        const msg = await safeJsonMessage(res);
        throw new Error(msg || `Error ${res.status} al obtener permisos del área`);
      }
      const body = await res.json();
      setPermissions(Array.isArray(body?.data) ? body.data : []);
      return res;
    } catch (err) {
      setError(err);
      handleNetworkError(err);
      Swal.fire("Error", err.message || "No se pudieron obtener los permisos del área.", "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // PATCH /api/permissions/:id/status
  const updatePermissionStatus = async (id, { status, supervisorComments, Discount, quantityDiscount }) => {
    return fetch(`${API_URL}/${id}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        supervisorComments: supervisorComments ?? "",
        Discount: typeof Discount === "boolean" ? Discount : undefined,
        quantityDiscount:
          typeof quantityDiscount === "number" ? quantityDiscount : undefined,
      }),
    });
  };

  // ===================== ADMIN: TODOS LOS PERMISOS (NUEVO) =====================
  // GET /api/permissions
const fetchAllPermissions = async () => {
  try {
    setLoading(true);
    setError(null);
    const res = await fetch(API_URL, { credentials: "include" });
    if (!res.ok) {
      const msg = await safeJsonMessage(res);
      throw new Error(msg || `Error ${res.status} al obtener todos los permisos`);
    }
    const body = await res.json();
    setPermissions(Array.isArray(body?.data) ? body.data : []);
    return res;
  } catch (err) {
    setError(err);
    handleNetworkError(err);
    Swal.fire("Error", err.message || "No se pudieron obtener los permisos globales.", "error");
    return null;
  } finally {
    setLoading(false);
  }
};


  // DELETE /api/permissions/clear/all?confirm=REMOVE (NUEVO)
  const clearAllPermissions = async () => {
    return fetch(`${API_URL}/clear/all?confirm=REMOVE`, {
      method: "DELETE",
      credentials: "include",
    });
  };

  // SweetAlert + clearAll (NUEVO)
  const confirmAndClearAllPermissions = async () => {
    const { value } = await Swal.fire({
      title: "¿Borrar TODOS los permisos?",
      html: `Para continuar escribe: <b>REMOVE</b>`,
      input: "text",
      inputPlaceholder: "REMOVE",
      inputAttributes: { autocapitalize: "off" },
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Cancelar",
      preConfirm: (val) => {
        if ((val || "").trim() !== "REMOVE") {
          Swal.showValidationMessage("Debes escribir exactamente: REMOVE");
        }
        return val;
      },
    });

    if ((value || "").trim() !== "REMOVE") return { ok: false, skipped: true };

    const res = await clearAllPermissions();
    if (!res.ok) {
      const msg = await safeJsonMessage(res);
      Swal.fire("Error", msg || `No se pudo eliminar (HTTP ${res.status})`, "error");
      return { ok: false };
    }

    Swal.fire("Listo", "Se eliminaron todos los permisos.", "success");
    return { ok: true };
  };

  // ===================== EFECTO INICIAL =====================
  useEffect(() => { fetchPermissions(); }, []);

  return {
    permissions,
    loading,
    error,
    // empleado
    fetchPermissions,
    postPermissionMultipart,
    deletePermission,
    // coordinador
    fetchTeamPermissions,
    updatePermissionStatus,
    // admin (NUEVO)
    fetchAllPermissions,
    clearAllPermissions,
    confirmAndClearAllPermissions,
    // ui
    showModal,
    setShowModal,
    // utilidad
    setPermissions,
  };
};

export default useDataPermissions;
