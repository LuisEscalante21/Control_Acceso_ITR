import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";

const JWT_SECRET = import.meta.env.VITE_JWT_SECRET;

const useEmployeeProfile = () => {
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const encryptedUserInfo = Cookies.get("userInfo");
        if (!encryptedUserInfo) {
          console.warn("No hay cookie userInfo");
          return;
        }

        const bytes = CryptoJS.AES.decrypt(
          decodeURIComponent(encryptedUserInfo),
          JWT_SECRET
        );
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedText) {
          console.error("No se pudo desencriptar la cookie userInfo");
          return;
        }

        const userInfo = JSON.parse(decryptedText);

        if (!userInfo?._id || !userInfo?.userType) {
          console.error("userInfo no contiene _id o userType");
          return;
        }

        // Admin de .env solo lectura
        if (userInfo.isReadOnly && userInfo._id === "Admin") {
          setEmployee({
            ...userInfo,
            team: null, // Admin no tiene equipo
          });
          return;
        }

        const baseURL = import.meta.env.VITE_BASE_URL + import.meta.env.VITE_PORT + "/api";
        let endpoint = "";

        switch (userInfo.userType.toLowerCase()) {
          case "employee":
            endpoint = `/employee/${userInfo._id}?populate=team`;
            break;
          case "coordinator":
            endpoint = `/coordinators/${userInfo._id}`;
            break;
          case "admin":
          case "administrator":
            endpoint = `/administrators/${userInfo._id}`;
            break;
          default:
            console.error("Tipo de usuario no reconocido:", userInfo.userType);
            return;
        }

        // Axios enviará automáticamente la cookie httpOnly con 'withCredentials'
        const { data } = await axios.get(`${baseURL}${endpoint}`, {
          withCredentials: true,
        });

        const normalizedData = { ...data, team: data.IdTeam || data.team || null };
        setEmployee(normalizedData);
      } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
      }
    };

    fetchProfile();
  }, []);

  return employee;
};

export default useEmployeeProfile;
