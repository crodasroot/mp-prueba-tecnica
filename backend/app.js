import express, { json, urlencoded } from 'express';
import cors from 'cors';
import 'dotenv/config';

import { initializeDatabase } from './config/database.js';
import { verificarToken } from './middleware/auth.js';

import listEndpoints from 'express-list-endpoints';

// Importar rutas

import userRoutes from './routes/userRoutes.js';
import expedientesRoutes from './routes/expedientes.js';
import indiciosRoutes from './routes/indicios.js';
import reportesRoutes from './routes/reportes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

// Rutas públicas (registro / login)
app.use('/api/users', userRoutes);

// Middleware de autenticación (aplicado a rutas protegidas)


// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sistema de Gestión de Evidencias DICRI',
    version: '1.0.0',
    rutas: listEndpoints(app)
  });
});

app.use(verificarToken);

// Rutas protegidas
app.use('/api/expedientes', expedientesRoutes);
app.use('/api/indicios', indiciosRoutes);
app.use('/api/reportes', reportesRoutes);

console.table(listEndpoints(app));


// Manejo de errores 404 — usar handler sin path para evitar parsing de '*' por path-to-regexp
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error global:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Inicializar servidor
const startServer = async () => {
 
  try {
    // Inicializar base de datos
    await initializeDatabase();
    
    app.listen(PORT, () => {
      
      console.log(`Servidor corriendo en puerto ${PORT}`);
      console.log(`API disponible en: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Error iniciando servidor:', error);
    process.exit(1);
  }
};

// Start server only when not running tests
if (process.env.NODE_ENV !== 'test') {
  startServer();
}


export default app;