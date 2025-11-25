import pool,{initializeDatabase} from '../config/database.js';


import bcrypt from 'bcryptjs';


initializeDatabase();

class Usuario {
  static async create({ nombre, email, password, rol = 'tecnico' }) {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      `INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)`,
      [nombre, email, hashed, rol]
    );
    const id = result.insertId;
    return { id, name: nombre, email, role: rol };
  }

  static async findAll() {
    const [rows] = await pool.execute(
      'SELECT id, nombre as name, email, rol FROM usuarios WHERE activo = true'
    );
    return rows.map(r => ({ id: r.id, name: r.name || r.nombre, email: r.email, role: r.rol }));
  }
  static async obtenerPorEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ? AND activo = true',
      [email]
    );
    return rows[0];
  }
  static async obtenerPorId(id) {
    const [rows] = await pool.execute(
      'SELECT id, nombre, email, rol FROM usuarios WHERE id = ? AND activo = true',
      [id]
    );
    return rows[0];
  }

  static async verificarPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async obtenerTecnicos() {
    const [rows] = await pool.execute(
      'SELECT id, nombre, email FROM usuarios WHERE rol = "tecnico" AND activo = true'
    );
    return rows;
  }
}

export default Usuario;