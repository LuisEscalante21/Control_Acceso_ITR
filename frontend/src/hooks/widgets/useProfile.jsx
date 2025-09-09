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

        // Desencriptar
        const bytes = CryptoJS.AES.decrypt(decodeURIComponent(encryptedUserInfo), JWT_SECRET);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedText) {
          console.error("No se pudo desencriptar la cookie userInfo");
          return;
        }

        const userInfo = JSON.parse(decryptedText);
        if (!userInfo?._id) {
          console.error("userInfo no contiene _id");
          return;
        }

        // Modifica la URL para que incluya la información del equipo
        const { data } = await axios.get(`http://localhost:4000/api/employee/${userInfo._id}?populate=team`);
        console.log(data);
        setEmployee(data);
      } catch (error) {
        console.error("Error al obtener el perfil del empleado:", error);
      }
    };

    fetchProfile();
  }, []);

  return employee;
};

export default useEmployeeProfile;
