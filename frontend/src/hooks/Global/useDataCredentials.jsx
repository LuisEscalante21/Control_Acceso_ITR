import { useEffect, useState } from "react";
import CryptoJS from "crypto-js";

const useDataCredentials = () => {
  const [user, setUser] = useState(null);     // objeto de usuario o null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const SECRET = import.meta.env.VITE_JWT_SECRET; // Debe ser IGUAL a JWT_SECRET del backend

  // Lee una cookie por nombre
  const getCookie = (name) => {
    // Ej: "userInfo=VALOR; otra=..."
    const found = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
    if (!found) return null;
    // Valor crudo (URL-encoded)
    return found.split("=")[1] || null;
  };

  const loadFromCookie = () => {
    try {
      const encryptedRaw = getCookie("userInfo");
      if (!encryptedRaw || !SECRET) return null;

      // 1) Decodificar el valor de la cookie
      //    (cuando se guarda, los caracteres especiales quedan %XX)
      const encrypted = decodeURIComponent(encryptedRaw);

      // 2) Algunas implementaciones sustituyen "+" por espacios: revertir por si acaso
      const normalized = encrypted.replace(/ /g, "+");

      // 3) Desencriptar con la misma clave del backend
      const bytes = CryptoJS.AES.decrypt(normalized, SECRET);
      const utf8 = bytes.toString(CryptoJS.enc.Utf8);
      if (!utf8) throw new Error("Decryption returned empty string");

      // 4) Parsear JSON
      return JSON.parse(utf8);
    } catch (err) {
      console.error("Error al desencriptar userInfo:", err);
      return null;
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        // Intento 1: desde cookie cifrada (rápido, sin red)
        const fromCookie = loadFromCookie();
        if (fromCookie) {
          setUser(fromCookie);
          return;
        }

        // Intento 2 (fallback): pedir al backend /api/checkAuth
        const BASE = import.meta.env.VITE_BASE_URL;
        const PORT = import.meta.env.VITE_PORT;
        const url = `${BASE}${PORT}/api/checkAuth`;

        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("No autorizado");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setError(err);
        setUser(null);
        console.error("useDataCredentials fallback error:", err);
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, loading, error };
};

export default useDataCredentials;
