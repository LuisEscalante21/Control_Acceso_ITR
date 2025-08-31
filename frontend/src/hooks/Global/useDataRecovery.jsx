import { useState } from "react";

const API_BASE =
  window.location.hostname === "localhost" ? "http://localhost:4000" : "";
const API_URL = `${API_BASE}/api/recoveryPassword`;

export default function useDataRecoveryPass() {
  const [loading, setLoading] = useState(false);

  /**
   * Envía { email, numEmpleado } al backend.
   * Tu backend responde 200 con { message: "validando credenciales" }.
   * Retorna { ok: true } en éxito de red, o { ok: false, error } si hay fallo.
   */
  const submitRecovery = async ({ email, numEmpleado }) => {
    try {
      setLoading(true);
      const res = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, numEmpleado }),
      });

      if (!res.ok) {
        let msg = "No se pudo enviar la solicitud.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch {}
        return { ok: false, error: msg };
      }

      return { ok: true };
    } catch (err) {
      return { ok: false, error: err?.message || "Error de red" };
    } finally {
      setLoading(false);
    }
  };

  return { loading, submitRecovery };
}
