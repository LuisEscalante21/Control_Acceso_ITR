const logoutController = {};

// Cierre de sesión
logoutController.logout = async (req, res) => {
  try {
    res.clearCookie("authToken");
    res.clearCookie("userInfo"); //Limpia la cookie con la información del usuario
    return res.status(200).json({ message: "Sesión cerrada correctamente" });

  } catch (error) {
    return res.status(500).json({ error: "Error al cerrar sesión" });
  }
};

export default logoutController;
