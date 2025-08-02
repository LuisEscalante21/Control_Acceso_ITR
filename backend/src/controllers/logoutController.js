// logoutController.js
const logoutController = {};

logoutController.logout = (req, res) => {
  try {
    // Destruye sesión si usas express-session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) console.error("Error destruyendo sesión:", err);
      });
    }

    // Borra cookie authToken (ajusta secure según entorno)
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.json({ message: "Sesión cerrada correctamente" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error al cerrar sesión" });
  }
};

export default logoutController;
