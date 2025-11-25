<script setup>
import { ref } from "vue";
import api from "../api/axios";

const filtros = ref({
  fecha_inicio: "",
  fecha_fin: "",
  estado: "",
});

const dataReporte = ref(null);
const cargando = ref(false);

const buscar = async () => {
  cargando.value = true;

  try {
    const { data } = await api.get("/reportes/expedientes", {
      params: filtros.value,
    });

    dataReporte.value = data;

  } catch (error) {
    console.error("Error al cargar reporte:", error);
  }

  cargando.value = false;
};
</script>

<template>
  <div class="container mt-4">

    <h2 class="text-center mb-4">Reporte de Expedientes</h2>

    <!-- Filtros -->
    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <div class="row">
          
          <div class="col-md-4">
            <label class="form-label">Fecha inicio</label>
            <input type="date" v-model="filtros.fecha_inicio" class="form-control" />
          </div>

          <div class="col-md-4">
            <label class="form-label">Fecha fin</label>
            <input type="date" v-model="filtros.fecha_fin" class="form-control" />
          </div>

          <div class="col-md-4">
            <label class="form-label">Estado</label>
            <select v-model="filtros.estado" class="form-select">
              <option value="">Todos</option>
              <option value="registro">Registro</option>
              <option value="revision">Revisión</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>

        </div>

        <button class="btn btn-primary w-100 mt-3" @click="buscar" :disabled="cargando">
          <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
          Buscar
        </button>
      </div>
    </div>
       
    <!-- Resultados -->
    <div v-if="dataReporte">

      <!-- Estadísticas -->
      <div class="card mb-4 shadow-sm">
        <div class="card-header"><strong>Estadísticas generales</strong></div>

        <div class="card-body">
          <table class="table table-bordered table-striped">
            <thead class="table-dark">
              <tr>
                <th>Estado</th>
                <th>Total</th>
                <th>Aprobados</th>
                <th>Rechazados</th>
                <th>En Revisión</th>
                <th>En Registro</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(e, i) in dataReporte.estadisticas" :key="i">
                <td>{{ e.estado }}</td>
                <td>{{ e.total }}</td>
                <td>{{ e.aprobados }}</td>
                <td>{{ e.rechazados }}</td>
                <td>{{ e.en_revision }}</td>
                <td>{{ e.en_registro }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Expedientes -->
      <div>
        <h4 class="mb-3">Expedientes detallados</h4>
        
        <div
          v-for="exp in dataReporte.expedientes"
          :key="exp.id"
          class="card mb-3 shadow-sm"
        >

          <div class="card-header bg-dark text-white">
            <strong>Expediente: {{ exp.numero_expediente }}</strong>
          </div>

          <div class="card-body">
            
            <div class="row mb-2">
              <div class="col-md-6">
                <p><strong>Título:</strong> {{ exp.titulo }}</p>
                <p><strong>Estado:</strong> {{ exp.estado }}</p>
              </div>

              <div class="col-md-6">
                <p><strong>Técnico:</strong> {{ exp.tecnico_nombre }}</p>
                <p><strong>Total Indicios:</strong> {{ exp.total_indicios }}</p>
              </div>
            </div>

            <!-- Tabla de indicios -->
            <table class="table table-bordered">
              <thead class="table-dark">
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  
                  <th>Fecha Registro</th>
                </tr>
              </thead>

              <tbody>
                <tr v-if="exp.indicios.length === 0">
                  <td colspan="5" class="text-center text-muted">
                    No hay indicios registrados
                  </td>
                </tr>
                  
                <tr v-for="ind in exp.indicios" :key="ind.id">
                  <td>{{ ind.nombre }}</td>
                  <td>{{ ind.descripcion }}</td>
                  <td>{{ ind.tipo }}</td>
                
                  <td>{{ ind.fecha_registro?.slice(0, 10) }}</td>
                </tr>
              </tbody>
            </table>

          </div>
        </div>

      </div>

    </div>

  </div>
</template>
