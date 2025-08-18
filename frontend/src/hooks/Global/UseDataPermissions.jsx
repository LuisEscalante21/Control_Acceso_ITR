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


  useEffect(() => { fetchPermissions(); }, []);

  return {
    permissions,
    loading,
    error,
    fetchPermissions,
    postPermissionMultipart,
    deletePermission,      // 👈 nuevo
    showModal,
    setShowModal,
  };
};

export default useDataPermissions;
