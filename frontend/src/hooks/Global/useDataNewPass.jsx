import { useState } from "react";

const URL = import.meta.env.VITE_BASE_URL;
const PORT = import.meta.env.VITE_PORT;
const BASE_URL = `${URL}${PORT}`; 

const API_URL = `${BASE_URL}/api/recoveryPassword/newPassword`;

export default function useDataRecoveryNewPass() {
  const [loading, setLoading] = useState(false);

  const submitNewPass = async (newPassword) => {
    try {
      setLoading(true);

      const res = await fetch(API_URL, {
        method: "POST",
        credentials: "include", //Envia la cookie tokenRecoveryCode
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
