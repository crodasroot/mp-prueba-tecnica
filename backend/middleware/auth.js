import jwt from 'jsonwebtoken';
import Usuario from '../models/User.js';


export const verificarToken = async (req, res, next) => {
  try {
    const header = req.header('Authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const secret = process.env.JWT_SECRET || 'secret_dev_change_me';
    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    

    req.usuario = payload;
    next();
  } catch (error) {
    console.error('Error en verificarToken:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};


export const verificarCoordinador = (req, res, next) => {
  if (!req.usuario || req.usuario.rol !== 'coordinador') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de coordinador' });
  }
  next();
};

// Export por defecto para compatibilidad con código CommonJS previo
export default { verificarToken, verificarCoordinador };