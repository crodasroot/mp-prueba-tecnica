import express, { json } from "express";
import cors from "cors";

import expedientesRoutes from "./routes/expedientes.js";
import reportesRoutes from "./routes/reportes.js";
import indiciosRoutes from "./routes/indicios.js";

import userRoutes from "./routes/userRoutes.js";
import pool , { initializeDatabase } from "./config/database.js";

const app = express();


app.use(cors({
  origin: "http://localhost:8911", 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));


app.use(json());


app.use("/api/expedientes", expedientesRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/indicios", indiciosRoutes);

app.use("/api/users", userRoutes);

const probarDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Conexión MySQL OK");
    connection.release();
  } catch (err) {
    console.error("Error conectando a MySQL:", err);
  }
};


const startServer = async () => {
  await probarDB();
  
  app.listen(3000, () => console.log("API lista → http://localhost:3000"));
};

startServer();
