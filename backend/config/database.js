import { createPool } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const dbConfig = {
  host: 'db',
  user: 'root',
  port: 3306,
  password: 'password',
  database: 'mydb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};


const pool = createPool(dbConfig);


const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol ENUM('tecnico', 'coordinador') DEFAULT 'tecnico',
        activo BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS expedientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_expediente VARCHAR(50) UNIQUE NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        fecha_hecho DATE,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ubicacion_hecho VARCHAR(255),
        tecnico_id INT,
        estado ENUM('registro', 'revision', 'aprobado', 'rechazado') DEFAULT 'registro',
        coordinador_id INT,
        fecha_revision TIMESTAMP NULL,
        justificacion_rechazo TEXT,
        FOREIGN KEY (tecnico_id) REFERENCES usuarios(id),
        FOREIGN KEY (coordinador_id) REFERENCES usuarios(id)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS indicios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expediente_id INT NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        tipo ENUM('arma', 'documento', 'electronico', 'vestimenta', 'otro') DEFAULT 'otro',
        color VARCHAR(100),
        tamaño VARCHAR(100),
        peso DECIMAL(10,2),
        ubicacion_almacen VARCHAR(255),
        estado_conservacion VARCHAR(100),
        tecnico_id INT,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        observaciones TEXT,
        FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE CASCADE,
        FOREIGN KEY (tecnico_id) REFERENCES usuarios(id)
      )
    `);

    // USUARIOS POR DEFECTO
    const hashedPasswordTecnico = await bcrypt.hash('tecnico123', 10);
    const hashedPasswordCoordinador = await bcrypt.hash('coordinador123', 10);
    const hashedPasswordRockdas = await bcrypt.hash('rockdas', 10);

    await connection.execute(`
      INSERT IGNORE INTO usuarios (nombre, email, password, rol) VALUES 
      ('Juan Pérez', 'tecnico@dicri.com', ?, 'tecnico'),
      ('María García', 'coordinador@dicri.com', ?, 'coordinador'),
      ('Carlos Rodas', 'crodas.root@gmail.com', ?, 'coordinador')
    `, [hashedPasswordTecnico, hashedPasswordCoordinador, hashedPasswordRockdas]);

    connection.release();
    console.log('Base de datos inicializada correctamente');

  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
    throw error;
  }
};


export default pool;
export { initializeDatabase };
