import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const BASE_URL = `${URL}${PORT}`; 

const API_URL = `${BASE_URL}/api/permissions`;

const useDataPermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
      try {
        return await res.text();
      } catch {
        return null;
      }
    }
  };

  // =========================
  // EMPLEADO: Mis permisos
  // =========================
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
      Swal.fire(
        "Error",
        err.message || "No se pudieron obtener los permisos.",
        "error"
      );
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

  // =========================
  // COORDINADOR: Permisos del área
  // =========================
  const fetchTeamPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/teams`, { credentials: "include" });
      if (!res.ok) {
        const msg = await safeJsonMessage(res);
        throw new Error(msg || `Error ${res.status} al obtener permisos del área`);
      }
      const body = await res.json();
      setPermissions(Array.isArray(body?.data) ? body.data : []);
      return res;
    } catch (err) {
      setError(err);
      handleNetworkError(err);
      Swal.fire(
        "Error",
        err.message || "No se pudieron obtener los permisos del área.",
        "error"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // PATCH: ACTUALIZAR ESTADO DE PERMISO
  // =========================
  const updatePermissionStatus = async (
    id,
    { status, supervisorComments, Discount, quantityDiscount, actionBy }
  ) => {
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
        actionBy: actionBy || undefined, // 👈 Agregamos historial de acción
      }),
    });
  };

  // =========================
  // ADMIN: Todos los permisos
  // =========================
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
      Swal.fire(
        "Error",
        err.message || "No se pudieron obtener los permisos globales.",
        "error"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // EFECTO INICIAL
  // =========================
  useEffect(() => {
    fetchPermissions();
  }, []);

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
    // admin
    fetchAllPermissions,
    // ui
    showModal,
    setShowModal,
    // utilidad
    setPermissions,
  };
};

export default useDataPermissions;
