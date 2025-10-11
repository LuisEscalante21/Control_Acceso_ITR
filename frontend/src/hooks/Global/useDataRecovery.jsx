// hooks/Global/useDataRecoveryPass.js
import { useState } from "react";

const URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const BASE_URL = `${URL}${PORT}`; 

const API_URL = `${BASE_URL}/api/recoveryPassword`;

export default function useDataRecoveryPass() {
  const [loading, setLoading] = useState(false);

  // helper genérico para POST
  const post = async (endpoint, body) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        credentials: "include", // importante para las cookies JWT
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return { ok: false, error: data?.message || "Error en la solicitud" };
      }

      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err?.message || "Error de red" };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Paso 1: solicitar código al correo
   * body: { email }
   */
  const requestCode = async ({ email }) => {
    return await post("/requestCode", { email });
  };

  /**
   * Paso 2: verificar código recibido por correo
   * body: { code }
   */
  const verifyCode = async ({ code }) => {
    return await post("/verifyCode", { code });
  };

  /**
   * Paso 3: establecer nueva contraseña (usado desde el modal NewPass)
   * body: { newPassword }
   */
  const newPassword = async ({ newPassword }) => {
    return await post("/newPassword", { newPassword });
  };

  return {
    loading,
    requestCode,
    verifyCode,
    newPassword,
  };
}
