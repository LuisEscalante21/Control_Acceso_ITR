const logoutController = {};

logoutController.logout = async (req, res) => {
  try {
    // Si además manejas sesión:
    req.session?.destroy();

    // Borrar cookie authToken enviando cabecera de expiración
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: false,    // true en producción
      sameSite: "lax",
      path: "/"
    });

    return res.json({ message: "Sesión cerrada correctamente" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error al cerrar sesión" });
  }
};

export default logoutController;