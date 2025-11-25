import Indicio from '../models/indicio.js';
import Expediente from '../models/expediente.js';
import { validationResult } from 'express-validator';

const indicioController = {
 
  crearIndicio: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const indicioData = req.body;

     
      const expediente = await Expediente.obtenerPorId(indicioData.expediente_id);
      if (!expediente) {
        return res.status(404).json({ error: 'Expediente no encontrado' });
      }

      if (expediente.estado !== 'registro') {
        return res.status(400).json({ 
          error: 'No se pueden agregar indicios a un expediente que no está en etapa de registro' 
        });
      }

      const indicioId = await Indicio.crear(indicioData);

      res.status(201).json({
        message: 'Indicio creado exitosamente',
        id: indicioId
      });
    } catch (error) {
      console.error('Error creando indicio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  
  obtenerIndiciosPorExpediente: async (req, res) => {
    try {
      const { expediente_id } = req.params;
      const indicios = await Indicio.obtenerPorExpediente(expediente_id);
      res.json(indicios);
    } catch (error) {
      console.error('Error obteniendo indicios:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  
  obtenerIndicio: async (req, res) => {
    try {
      const { id } = req.params;
      const indicio = await Indicio.obtenerPorId(id);
      
      if (!indicio) {
        return res.status(404).json({ error: 'Indicio no encontrado' });
      }

      res.json(indicio);
    } catch (error) {
      console.error('Error obteniendo indicio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  
  actualizarIndicio: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const indicioData = req.body;

      const indicio = await Indicio.obtenerPorId(id);
      if (!indicio) {
        return res.status(404).json({ error: 'Indicio no encontrado' });
      }

      // Verificar que el expediente está en estado de registro
      const expediente = await Expediente.obtenerPorId(indicio.expediente_id);
      if (expediente.estado !== 'registro') {
        return res.status(400).json({ 
          error: 'No se pueden modificar indicios de un expediente que no está en etapa de registro' 
        });
      }

      const actualizado = await Indicio.actualizar(id, indicioData);
      
      if (actualizado) {
        res.json({ message: 'Indicio actualizado exitosamente' });
      } else {
        res.status(400).json({ error: 'Error al actualizar el indicio' });
      }
    } catch (error) {
      console.error('Error actualizando indicio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  
  eliminarIndicio: async (req, res) => {
    try {
      const { id } = req.params;

      const indicio = await Indicio.obtenerPorId(id);
      if (!indicio) {
        return res.status(404).json({ error: 'Indicio no encontrado' });
      }

      // Verificar que el expediente está en estado de registro
      const expediente = await Expediente.obtenerPorId(indicio.expediente_id);
      if (expediente.estado !== 'registro') {
        return res.status(400).json({ 
          error: 'No se pueden eliminar indicios de un expediente que no está en etapa de registro' 
        });
      }

      const eliminado = await Indicio.eliminar(id);
      
      if (eliminado) {
        res.json({ message: 'Indicio eliminado exitosamente' });
      } else {
        res.status(400).json({ error: 'Error al eliminar el indicio' });
      }
    } catch (error) {
      console.error('Error eliminando indicio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

export default indicioController;