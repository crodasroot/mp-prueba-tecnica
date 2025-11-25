import pool,{initializeDatabase} from '../config/database.js';




class Expediente {

  static async crear(expedienteData) {
    const {
      numero_expediente,
      titulo,
      descripcion,
      fecha_hecho,
      ubicacion_hecho,
      tecnico_id
    } = expedienteData;

    const [result] = await pool.execute(
      `INSERT INTO expedientes 
       (numero_expediente, titulo, descripcion, fecha_hecho, ubicacion_hecho, tecnico_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [numero_expediente, titulo, descripcion, fecha_hecho, ubicacion_hecho, tecnico_id]
    );

    return result.insertId;
  }

  static async obtenerPorId(id) {
    const [rows] = await pool.execute(
      `SELECT e.*, u.nombre as tecnico_nombre, c.nombre as coordinador_nombre
       FROM expedientes e
       LEFT JOIN usuarios u ON e.tecnico_id = u.id
       LEFT JOIN usuarios c ON e.coordinador_id = c.id
       WHERE e.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async obtenerTodos(filtros = {}) {
    let query = `
      SELECT e.*, u.nombre as tecnico_nombre, c.nombre as coordinador_nombre,
             COUNT(i.id) as total_indicios
      FROM expedientes e
      LEFT JOIN usuarios u ON e.tecnico_id = u.id
      LEFT JOIN usuarios c ON e.coordinador_id = c.id
      LEFT JOIN indicios i ON e.id = i.expediente_id
    `;
    
    const conditions = [];
    const params = [];
    
    if (filtros.estado) {
      conditions.push('e.estado = ?');
      params.push(filtros.estado);
    }
    
    if (filtros.fecha_inicio && filtros.fecha_fin) {
      conditions.push('e.fecha_registro BETWEEN ? AND ?');
      params.push(filtros.fecha_inicio, filtros.fecha_fin + ' 23:59:59');
    }
    
    if (filtros.tecnico_id) {
      conditions.push('e.tecnico_id = ?');
      params.push(filtros.tecnico_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY e.id ORDER BY e.fecha_registro DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async actualizarEstado(id, estado, coordinador_id = null, justificacion = null) {
    const [result] = await pool.execute(
      `UPDATE expedientes 
       SET estado = ?, coordinador_id = ?, fecha_revision = NOW(), justificacion_rechazo = ?
       WHERE id = ?`,
      [estado, coordinador_id, justificacion, id]
    );
    return result.affectedRows > 0;
  }

 
  static async obtenerIndiciosPorExpediente(expediente_ids) {
   const [rows] = await pool.execute(
      'SELECT id,nombre, descripcion, tipo, fecha_registro FROM indicios WHERE expediente_id = ?',
      [expediente_ids]
    );
    return rows;
  }

  static async existeNumeroExpediente(numero_expediente, excludeId = null) {
    let query = 'SELECT id FROM expedientes WHERE numero_expediente = ?';
    const params = [numero_expediente];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows.length > 0;
  }
}

export default Expediente;
