import { useState } from "react";

const API_BASE =
  window.location.hostname === "localhost" ? "http://localhost:4000" : "";
const API_URL = `${API_BASE}/api/recoveryPassword/newPassword`;

export default function useDataRecoveryNewPass() {
  const [loading, setLoading] = useState(false);

  const submitNewPass = async (newPassword) => {
    try {
      setLoading(true);

      const res = await fetch(API_URL, {
        method: "POST",
        credentials: "include", // 👈 Envia la cookie tokenRecoveryCode
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Error actualizando contraseña");
      return { ok: true, message: data?.message };
    } catch (err) {
      return { ok: false, error: err.message || "Error" };
    } finally {
      setLoading(false);
    }
  };

  return { loading, submitNewPass };
}
