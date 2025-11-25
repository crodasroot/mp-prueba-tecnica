<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/axios'

const route = useRoute()
const router = useRouter()
const expedienteId = route.params.id
const indicioId = route.params.indicioId

const indicio = ref(null)
const cargando = ref(true)
const error = ref(null)

const fetchIndicio = async () => {
  cargando.value = true
  error.value = null
  try {
    // Intentar endpoint por expediente
    const { data } = await api.get(`/indicios/${expedienteId}/${indicioId}`)
    indicio.value = data
  } catch (err) {
    // Fallbacks comunes si el backend usa otro path
    try {
      const { data } = await api.get(`/indicios/${indicioId}`)
      indicio.value = data
    } catch (err2) {
      try {
        const { data } = await api.get(`/indicio/${indicioId}`)
        indicio.value = data
      } catch (err3) {
        console.error('No se pudo obtener el indicio:', err3)
        error.value = err3.response?.data || err3.message || 'Error al cargar indicio'
      }
    }
  } finally {
    cargando.value = false
  }
}

onMounted(fetchIndicio)

const volver = () => router.back()
</script>

<template>
  <div class="container py-4">
    <button class="btn btn-link mb-3" @click="volver">← Volver</button>

    <div v-if="cargando" class="card p-4">Cargando indicio...</div>

    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else-if="indicio" class="card">
      <div class="card-body">
        <h4 class="card-title">Indicio #{{ indicio.id || indicio._id }}</h4>
        <p><strong>Descripción:</strong> {{ indicio.descripcion || indicio.descripcion_hecho || '-' }}</p>
        <p><strong>Color:</strong> {{ indicio.color || '-' }}</p>
        <p><strong>Tamaño:</strong> {{ indicio.tamaño || indicio.tamano || '-' }}</p>
        <p><strong>Peso:</strong> {{ indicio.peso || '-' }}</p>
        <p><strong>Ubicación:</strong> {{ indicio.ubicacion || indicio.ubicacion_hecho || '-' }}</p>
        <p><strong>Técnico:</strong> {{ indicio.tecnico || indicio.tecnico_id || '-' }}</p>

        <div class="mt-3">
          <button class="btn btn-primary me-2" @click="() => {}">Editar (pendiente)</button>
          <button class="btn btn-outline-secondary" @click="volver">Cerrar</button>
        </div>
      </div>
    </div>

    <div v-else class="alert alert-secondary">No se encontró el indicio.</div>
  </div>
</template>

<style scoped>
.card-title { margin-bottom: 1rem; }
</style>
