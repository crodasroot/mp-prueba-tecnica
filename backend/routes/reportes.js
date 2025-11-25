import express from 'express';
import reporteController from '../controllers/reporteController.js';

const router = express.Router();

// Rutas
router.get('/expedientes', reporteController.generarReporteExpedientes);
router.get('/indicios', reporteController.generarReporteIndicios);
router.get('/tecnicos', reporteController.generarReporteTecnicos);

export default router;