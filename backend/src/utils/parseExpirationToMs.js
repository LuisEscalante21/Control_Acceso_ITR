/**
 * Convierte una duración como '30d', '15m', '2h', etc. en milisegundos.
 * @param {string} exp - Cadena como '30d', '10h', '45m', etc.
 * @returns {number|null} Duración en milisegundos o null si es inválida.
 */
export default function parseExpirationToMs(exp) {
  const match = /^(\d+)([smhd])$/.exec(exp.trim());
  if (!match) return null;

  const num = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 1000 * 60,
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24,
  };

  return num * multipliers[unit];
}
