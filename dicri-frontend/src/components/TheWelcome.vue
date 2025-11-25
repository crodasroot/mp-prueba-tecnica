<script setup>
import { ref, onMounted } from "vue";
import api from "../api/axios";

// LOADING
const loading = ref(true);

// DATOS PRINCIPALES DEL DASHBOARD
const stats = ref({
  total_expedientes: 0,
  aprobados: 0,
  rechazados: 0,
  revision: 0,
  registro: 0,
  total_indicios: 0,
  total_tecnicos: 0,
});

// CARGAR DATOS DEL DASHBOARD DESDE TUS APIS
const cargarDashboard = async () => {
  loading.value = true;

  // === 1) REPORTE GENERAL DE EXPEDIENTES ===
  const { data: repExp } = await api.get("/reportes/expedientes");

  // Calcular totales del reporte
  let aprobados = 0,
    rechazados = 0,
    revision = 0,
    registro = 0;

  repExp.estadisticas.forEach((e) => {
    aprobados += e.aprobados ;
    rechazados += e.rechazados ;
    revision += e.en_revision ;
    registro += e.en_registro ;
  });

  // === 2) REPORTE DE INDICIOS ===
  const { data: repInd } = await api.get("/reportes/indicios");

  let totalIndicios = 0;
  repInd.forEach((i) => (totalIndicios += i.total));

  // === 3) REPORTE DE TÉCNICOS ===
  const { data: repTec } = await api.get("/reportes/tecnicos");

  // Armamos el estado final del dashboard
  stats.value = {
    total_expedientes: repExp.total_expedientes,
    aprobados,
    rechazados,
    revision,
    registro,
    total_indicios: totalIndicios,
    total_tecnicos: repTec.length,
  };

  loading.value = false;
};

onMounted(cargarDashboard);
</script>

<template>
  <div class="container mt-4">
    <h2 class="fw-bold mb-4">📊 Dashboard General</h2>

    <!-- LOADING -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border"></div>
    </div>

    <!-- DASHBOARD -->
    <div v-else class="row g-4">

      <!-- Total Expedientes -->
      <div class="col-md-3">
        <div class="card shadow-sm p-3"> 
          <h5>Total Expedientes</h5>
          <h2 class="fw-bold text-primary">{{ stats.total_expedientes }}</h2>
        </div>
      </div>

      <!-- Aprobados -->
      <div class="col-md-3">
        <div class="card shadow-sm p-3">
          <h5>Aprobados</h5>
          <h2 class="fw-bold text-success">{{ stats.aprobados }}</h2>
        </div>
      </div>

      <!-- Rechazados -->
      <div class="col-md-3">
        <div class="card shadow-sm p-3">
          <h5>Rechazados</h5>
          <h2 class="fw-bold text-danger">{{ stats.rechazados }}</h2>
        </div>
      </div>

      <!-- En Revisión -->
      <div class="col-md-3">
        <div class="card shadow-sm p-3">
          <h5>En Revisión</h5>
          <h2 class="fw-bold text-warning">{{ stats.revision }}</h2>
        </div>
      </div>

      <!-- En Registro -->
      <div class="col-md-3">
        <div class="card shadow-sm p-3">
          <h5>En Registro</h5>
          <h2 class="fw-bold text-info">{{ stats.registro }}</h2>
        </div>
      </div>

      <!-- Indicios Totales -->
      <div class="col-md-3">
        <div class="card shadow-sm p-3">
          <h5>Promedio Indicios</h5>
          <h2 class="fw-bold">{{ stats.total_indicios  / stats.total_expedientes }}</h2>
        </div>
      </div>

      <!-- Técnicos Activos -->
      <div class="col-md-3">
        <div class="card shadow-sm p-3">
          <h5>Técnicos Activos</h5>
          <h2 class="fw-bold">{{ stats.total_tecnicos }}</h2>
        </div>
      </div>

    </div>
  </div>
</template>
