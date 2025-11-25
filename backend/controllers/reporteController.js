import pool from '../config/database.js';
import Expediente from '../models/expediente.js';

const reporteController = {
  
  generarReporteExpedientes: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, estado } = req.query;
      
      let query = `
        SELECT 
          estado,
          COUNT(*) as total,
          COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as aprobados,
          COUNT(CASE WHEN estado = 'rechazado' THEN 1 END) as rechazados,
          COUNT(CASE WHEN estado = 'revision' THEN 1 END) as en_revision,
          COUNT(CASE WHEN estado = 'registro' THEN 1 END) as en_registro
        FROM expedientes
      `;
      
      const conditions = [];
      const params = [];
      
      if (fecha_inicio && fecha_fin) {
        conditions.push('fecha_registro BETWEEN ? AND ?');
        params.push(fecha_inicio, fecha_fin + ' 23:59:59');
      }
      
      if (estado) {
        conditions.push('estado = ?');
        params.push(estado);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' GROUP BY estado';
      
      const [estadisticas] = await pool.execute(query, params);
    
    const filtros = {};
    if (fecha_inicio && fecha_fin) {
      filtros.fecha_inicio = fecha_inicio;
      filtros.fecha_fin = fecha_fin;
    }
    if (estado) filtros.estado = estado;
    
    const expedientes = await Expediente.obtenerTodos(filtros);
   

    for (let expediente of expedientes) {
      const indicios = await Expediente.obtenerIndiciosPorExpediente(expediente.id);
      expediente.indicios = indicios || [];
    }
   


    res.json({
      estadisticas,
      expedientes,
     
      total_expedientes: expedientes.length
    });
    } catch (error) {
      console.error('Error generando reporte:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

 
  generarReporteIndicios: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      
      let query = `
        SELECT 
          i.tipo,
          COUNT(*) as total
        FROM indicios i
        INNER JOIN expedientes e ON i.expediente_id = e.id
      `;
      
      const conditions = [];
      const params = [];
      
      if (fecha_inicio && fecha_fin) {
        conditions.push('i.fecha_registro BETWEEN ? AND ?');
        params.push(fecha_inicio, fecha_fin + ' 23:59:59');
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' GROUP BY i.tipo ORDER BY i.tipo';
      
      const [reporte] = await pool.execute(query, params);
      
      res.json(reporte);
    } catch (error) {
      console.error('Error generando reporte de indicios:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  
  generarReporteTecnicos: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      
      let query = `
        SELECT 
          u.id as tecnico_id,
          u.nombre as tecnico_nombre,
          COUNT(DISTINCT e.id) as total_expedientes,
          COUNT(i.id) as total_indicios,
          COUNT(CASE WHEN e.estado = 'aprobado' THEN 1 END) as expedientes_aprobados,
          COUNT(CASE WHEN e.estado = 'rechazado' THEN 1 END) as expedientes_rechazados
        FROM usuarios u
        LEFT JOIN expedientes e ON u.id = e.tecnico_id
        LEFT JOIN indicios i ON e.id = i.expediente_id
        WHERE u.rol = 'tecnico'
      `;
      
      const conditions = [];
      const params = [];
      
      if (fecha_inicio && fecha_fin) {
        conditions.push('e.fecha_registro BETWEEN ? AND ?');
        params.push(fecha_inicio, fecha_fin + ' 23:59:59');
      }
      
      if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
      }
      
      query += ' GROUP BY u.id, u.nombre ORDER BY total_expedientes DESC';
      
      const [reporte] = await pool.execute(query, params);
      
      res.json(reporte);
    } catch (error) {
      console.error('Error generando reporte de técnicos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

export default reporteController;