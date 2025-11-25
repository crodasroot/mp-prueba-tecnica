import express from 'express';
const router = express.Router();

import { body, param } from 'express-validator';
import expedienteController from '../controllers/expedienteController.js';

// Validaciones
const validarExpediente = [
  body('numero_expediente').notEmpty().withMessage('El número de expediente es requerido'),
  body('titulo').notEmpty().withMessage('El título es requerido'),
  body('tecnico_id').isInt({ min: 1 }).withMessage('El técnico es requerido')
];

const validarRechazo = [
  body('coordinador_id').isInt({ min: 1 }).withMessage('El coordinador es requerido'),
  body('justificacion').notEmpty().withMessage('La justificación es requerida')
];

// Rutas
router.post('/', validarExpediente, expedienteController.crearExpediente);
router.get('/', expedienteController.obtenerExpedientes);
router.get('/:id', expedienteController.obtenerExpediente);
router.put('/:id/aprobar', expedienteController.aprobarExpediente);
router.put('/:id/rechazar', validarRechazo, expedienteController.rechazarExpediente);
router.put('/:id/revision', expedienteController.enviarRevision);

export default router;