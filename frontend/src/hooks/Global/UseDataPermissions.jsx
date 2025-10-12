import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const BASE_URL = `${URL}${PORT}`;
const API_URL = `${BASE_URL}/api/permissions`;

const useDataPermissions = (autoFetch = true) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // ============ helpers ============
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

  // ============ GET: Mis permisos ============
  const fetchPermissions = useCallback(async () => {
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
      return res;
    } catch (err) {
      setError(err);
      handleNetworkError(err);
      Swal.fire("Error", err.message || "No se pudieron obtener los permisos.", "error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ GET: Permisos del área (coordinador) ============
  const fetchTeamPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/team`, { credentials: "include" });
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
      Swal.fire("Error", err.message || "No se pudieron obtener los permisos del área.", "error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ POST: Crear permiso ============
  const postPermissionMultipart = useCallback(async (formData) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const msg = await safeJsonMessage(res);
        throw new Error(msg || `Error ${res.status} al crear permiso`);
      }
      Swal.fire("Éxito", "Permiso creado correctamente.", "success");
      // ❌ NO auto-refrescar aquí; deja que la página decida con refresh()
      return res;
    } catch (err) {
      handleNetworkError(err);
      Swal.fire("Error", err.message || "No se pudo crear el permiso.", "error");
      return null;
    }
  }, []);

  // ============ DELETE: Eliminar permiso ============
  const deletePermission = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const msg = await safeJsonMessage(res);
        throw new Error(msg || `Error ${res.status} al eliminar permiso`);
      }
      Swal.fire("Éxito", "Permiso eliminado correctamente.", "success");
      // ❌ NO auto-refrescar aquí
      return res;
    } catch (err) {
      handleNetworkError(err);
      Swal.fire("Error", err.message || "No se pudo eliminar el permiso.", "error");
      return null;
    }
  }, []);

  // ============ PATCH: Actualizar estado ============
const updatePermissionStatus = useCallback(
  async (id, { status, supervisorComments, Discount, quantityDiscount, actionBy }) => {
    try {
      const res = await fetch(`${API_URL}/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          supervisorComments: supervisorComments ?? "",
          Discount: typeof Discount === "boolean" ? Discount : undefined,
          quantityDiscount: typeof quantityDiscount === "number" ? quantityDiscount : undefined,
          actionBy: actionBy || undefined,
        }),
      });

      if (!res.ok) {
        const msg = await safeJsonMessage(res);
        return { ok: false, status: res.status, message: msg || `Error ${res.status}` };
      }

      Swal.fire("Éxito", "Estado del permiso actualizado.", "success");
      return { ok: true, status: res.status };
    } catch (err) {
      handleNetworkError(err);
      Swal.fire("Error", err.message || "No se pudo actualizar el estado del permiso.", "error");
      return { ok: false, status: 500, message: err.message };
    }
  },
  []
);


  // ============ GET: Todos los permisos (admin) ============
  const fetchAllPermissions = useCallback(async () => {
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
  }, []);

  // ============ Auto-fetch (opcional) ============
  useEffect(() => {
    if (autoFetch) {
      // Solo para páginas que SÍ quieren cargar "mis permisos" al montar
      fetchPermissions();
    }
  }, [autoFetch, fetchPermissions]);

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
