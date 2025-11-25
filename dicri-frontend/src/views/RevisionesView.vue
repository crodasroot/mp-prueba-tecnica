<script setup>
import { ref, onMounted } from "vue";
import api from "../api/axios";

const pendientes = ref([]);

// Cargar expedientes
const cargar = async () => {
  try {
    const { data } = await api.get("/expedientes");
    pendientes.value = data;
  } catch (error) {
    console.error("Error cargando expedientes", error);
  }
};

// Aprobar
const aprobar = async (exp) => {
  const ok = confirm(`¿Seguro que desea aprobar el expediente #${exp.numero}?`);

  if (!ok) return;

  try {
    await api.put(`/expedientes/${exp.id}/aprobar`);
    cargar();
  } catch (error) {
    console.error("Error aprobando expediente", error);
  }
};

// Rechazar
const rechazar = async (exp) => {
  const motivo = prompt(
    `Ingrese la justificación para rechazar el expediente #${exp.numero}:`
  );

  if (!motivo || motivo.trim() === "") {
    alert("Debe escribir una justificación.");
    return;
  }

  try {
    await api.put(`/expedientes/${exp.id}/rechazar`, {
      justificacion: motivo,
    });
    cargar();
  } catch (error) {
    console.error("Error rechazando expediente", error);
  }
};

onMounted(cargar);
</script>

<template>
  <div class="contenedor">
    <h1>Revisión de Expedientes</h1>

    <table class="tabla">
      <thead>
        <tr>
          <th>#</th>
          <th>Título</th>
          <th>Técnico</th>
          <th>Indicios</th>
          <th>Aprobar</th>
          <th>Rechazar</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="e in pendientes" :key="e.id">
          <td>{{ e.numero }}</td>
          <td>{{ e.titulo }}</td>
          <td>{{ e.tecnico_nombre }}</td>
          <td>{{ e.total_indicios }}</td>

          <td>
            <button class="btn green" @click="aprobar(e)">Aprobar</button>
          </td>

          <td>
            <button class="btn red" @click="rechazar(e)">Rechazar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.contenedor {
  max-width: 1100px;
  margin: 0 auto;
}

.tabla {
  width: 100%;
  border-collapse: collapse;
}
.tabla th,
.tabla td {
  border: 1px solid #ccc;
  padding: 10px;
}
.tabla th {
  background: #f8f8f8;
}

.btn {
  padding: 7px 13px;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  font-weight: bold;
}
.green {
  background: #28a745;
  color: white;
}
.red {
  background: #dc3545;
  color: white;
}
</style>
