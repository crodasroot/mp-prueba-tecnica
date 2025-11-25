import Expediente from '../models/expediente.js';
import Indicio from '../models/indicio.js';
import { validationResult } from 'express-validator';

const expedienteController = {
  // Crear nuevo expediente
  crearExpediente: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        numero_expediente,
        titulo,
        descripcion,
        fecha_hecho,
        ubicacion_hecho,
        tecnico_id
      } = req.body;

    
      const existeExpediente = await Expediente.existeNumeroExpediente(numero_expediente);
      if (existeExpediente) {
        return res.status(400).json({
          error: 'El número de expediente ya existe'
        });
      }

      const expedienteId = await Expediente.crear({
        numero_expediente,
        titulo,
        descripcion,
        fecha_hecho,
        ubicacion_hecho,
        tecnico_id
      });

      res.status(201).json({
        message: 'Expediente creado exitosamente',
        id: expedienteId
      });
    } catch (error) {
      console.error('Error creando expediente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

 
  obtenerExpedientes: async (req, res) => {
    try {
      const { estado, fecha_inicio, fecha_fin, tecnico_id } = req.query;
      
      const filtros = {};
      if (estado) filtros.estado = estado;
      if (fecha_inicio && fecha_fin) {
        filtros.fecha_inicio = fecha_inicio;
        filtros.fecha_fin = fecha_fin;
      }
      if (tecnico_id) filtros.tecnico_id = tecnico_id;

      const expedientes = await Expediente.obtenerTodos(filtros);
      res.json(expedientes);
    } catch (error) {
      console.error('Error obteniendo expedientes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

 
  obtenerExpediente: async (req, res) => {
    try {
      const { id } = req.params;
      const expediente = await Expediente.obtenerPorId(id);
      
      if (!expediente) {
        return res.status(404).json({ error: 'Expediente no encontrado' });
      }

     
      const indicios = await Indicio.obtenerPorExpediente(id);
      expediente.indicios = indicios;

      res.json(expediente);
    } catch (error) {
      console.error('Error obteniendo expediente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  aprobarExpediente: async (req, res) => {
    try {
      const { id } = req.params;
      const { coordinador_id } = req.body;

      const expediente = await Expediente.obtenerPorId(id);
      if (!expediente) {
        return res.status(404).json({ error: 'Expediente no encontrado' });
      }

      if (expediente.estado !== 'revision') {
        return res.status(400).json({ error: 'El expediente no está en etapa de revisión' });
      }

      const actualizado = await Expediente.actualizarEstado(id, 'aprobado', coordinador_id);
      
      if (actualizado) {
        res.json({ message: 'Expediente aprobado exitosamente' });
      } else {
        res.status(400).json({ error: 'Error al aprobar el expediente' });
      }
    } catch (error) {
      console.error('Error aprobando expediente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  
  rechazarExpediente: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { coordinador_id, justificacion } = req.body;

      const expediente = await Expediente.obtenerPorId(id);
      if (!expediente) {
        return res.status(404).json({ error: 'Expediente no encontrado' });
      }

      if (expediente.estado !== 'revision') {
        return res.status(400).json({ error: 'El expediente no está en etapa de revisión' });
      }

      if (!justificacion) {
        return res.status(400).json({ error: 'La justificación es requerida para el rechazo' });
      }

      const actualizado = await Expediente.actualizarEstado(id, 'rechazado', coordinador_id, justificacion);
      
      if (actualizado) {
        res.json({ message: 'Expediente rechazado exitosamente' });
      } else {
        res.status(400).json({ error: 'Error al rechazar el expediente' });
      }
    } catch (error) {
      console.error('Error rechazando expediente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  
  enviarRevision: async (req, res) => {
    try {
      const { id } = req.params;

      const expediente = await Expediente.obtenerPorId(id);
      if (!expediente) {
        return res.status(404).json({ error: 'Expediente no encontrado' });
      }

      if (expediente.estado !== 'registro') {
        return res.status(400).json({ error: 'El expediente no está en etapa de registro' });
      }

      // Verificar que tenga indicios registrados
      const indicios = await Indicio.obtenerPorExpediente(id);
      if (indicios.length === 0) {
        return res.status(400).json({ error: 'No se puede enviar a revisión un expediente sin indicios' });
      }

      const actualizado = await Expediente.actualizarEstado(id, 'revision');
      
      if (actualizado) {
        res.json({ message: 'Expediente enviado a revisión exitosamente' });
      } else {
        res.status(400).json({ error: 'Error al enviar el expediente a revisión' });
      }
    } catch (error) {
      console.error('Error enviando a revisión:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

export default expedienteController;