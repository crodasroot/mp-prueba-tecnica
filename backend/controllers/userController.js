import Usuario from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';


export const createUser = async (req, res) => {
  try {
    const { name, email, password, rol } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email y password son requeridos' });
    }

    const existente = await Usuario.obtenerPorEmail(email);
    if (existente) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const nuevo = await Usuario.create({ nombre: name, email, password, rol });
    return res.status(201).json({ message: 'Usuario creado', user: nuevo });
  } catch (error) {
    console.error('Error creando usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};


export const getUsers = async (req, res) => {
  try {
    const users = await Usuario.findAll();
    res.json(users);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son requeridos' });
    }

  const usuario = await Usuario.obtenerPorEmail(email);
  if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });

  const ok = await Usuario.verificarPassword(password, usuario.password);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

 
  const payload = { id: usuario.id, name: usuario.nombre, email: usuario.email, role: usuario.rol };
  const secret = process.env.JWT_SECRET || 'secret_dev_change_me';
  const token = jwt.sign(payload, secret, { expiresIn: '8h' });


  res.json({ token, user: payload });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
