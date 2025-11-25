import express from 'express';
const router = express.Router();
import { body, param } from 'express-validator';
import indicioController from '../controllers/indicioController.js';

// Validaciones
const validarIndicio = [
  body('expediente_id').isInt({ min: 1 }).withMessage('El expediente es requerido'),
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('tecnico_id').isInt({ min: 1 }).withMessage('El técnico es requerido')
];

// Rutas
router.post('/', validarIndicio, indicioController.crearIndicio);
router.get('/expediente/:expediente_id', indicioController.obtenerIndiciosPorExpediente);
router.get('/:id', indicioController.obtenerIndicio);
router.put('/:id', validarIndicio, indicioController.actualizarIndicio);
router.delete('/:id', indicioController.eliminarIndicio);

export default router;