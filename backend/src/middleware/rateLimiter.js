import rateLimit from 'express-rate-limit';


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1500, // limite cada IP a 100 solicitudes por ventana
  message: {
    status: 429, // Estado HTTP 429: Demasiadas solicitudes
    error: 'Demasiadas solicitudes, por favor intente de nuevo más tarde.' 
  }
});

export default limiter;