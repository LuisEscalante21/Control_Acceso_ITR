import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const mapController = {};

// P O S T
mapController.mapFace = async (req, res) => {
  try {
    const response = await fetch("http://localhost:4500/mapeo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MAPEO_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Error al mapear desde Node:", error.message);
    res.status(500).json({
      status: "error",
      message: "Fallo al mapear rostro",
      error: error.message,
    });
  }
};

export default mapController;
