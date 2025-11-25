import pool,{initializeDatabase} from '../config/database.js';



class Indicio {
  static async crear(indicioData) {
    const {
      expediente_id,
      nombre,
      descripcion,
      tipo,
      color,
      tamaño,
      peso,
      ubicacion_almacen,
      estado_conservacion,
      tecnico_id,
      observaciones
    } = indicioData;

    const [result] = await pool.execute(
      `INSERT INTO indicios 
       (expediente_id, nombre, descripcion, tipo, color, tamaño, peso, 
        ubicacion_almacen, estado_conservacion, tecnico_id, observaciones) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [expediente_id, nombre, descripcion, tipo, color, tamaño, peso,
       ubicacion_almacen, estado_conservacion, tecnico_id, observaciones]
    );

    return result.insertId;
  }

  static async obtenerPorExpediente(expediente_id) {
    const [rows] = await pool.execute(
      `SELECT i.*, u.nombre as tecnico_nombre
       FROM indicios i
       LEFT JOIN usuarios u ON i.tecnico_id = u.id
       WHERE i.expediente_id = ?
       ORDER BY i.fecha_registro DESC`,
      [expediente_id]
    );
    return rows;
  }

  static async obtenerPorId(id) {
    const [rows] = await pool.execute(
      `SELECT i.*, u.nombre as tecnico_nombre, e.numero_expediente
       FROM indicios i
       LEFT JOIN usuarios u ON i.tecnico_id = u.id
       LEFT JOIN expedientes e ON i.expediente_id = e.id
       WHERE i.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async actualizar(id, indicioData) {
    const {
      nombre,
      descripcion,
      tipo,
      color,
      tamaño,
      peso,
      ubicacion_almacen,
      estado_conservacion,
      observaciones
    } = indicioData;

    const [result] = await pool.execute(
      `UPDATE indicios 
       SET nombre = ?, descripcion = ?, tipo = ?, color = ?, tamaño = ?, peso = ?,
           ubicacion_almacen = ?, estado_conservacion = ?, observaciones = ?
       WHERE id = ?`,
      [nombre, descripcion, tipo, color, tamaño, peso,
       ubicacion_almacen, estado_conservacion, observaciones, id]
    );

    return result.affectedRows > 0;
  }

  static async eliminar(id) {
    const [result] = await pool.execute(
      'DELETE FROM indicios WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

export default Indicio;