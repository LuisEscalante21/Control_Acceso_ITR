const validarCorreo = (req, res, next) => {
    const correo = req.body.email;
    const dominio = '@ricaldone.edu.sv';
  
    // Verificar si el correo termina con el dominio correcto
    if (!correo.endsWith(dominio)) {
      return res.status(400).json({ message: "El correo debe terminar con ${dominio}" });
    }
  
    // Si pasa la validación, continúa con el siguiente middleware o controlador
    next();
  };