<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import api from "../api/axios";

const route = useRoute();
const expedienteId = route.params.id;

const indicios = ref([]);
const tecnicos = ref([]);
const tecnicosLoading = ref(false);

const nuevo = ref({
  nombre: "",
  descripcion: "",
  tipo: "otro",
  color: "",
  tamaño: "",
  peso: "",
  ubicacion_almacen: "",
  estado_conservacion: "",
  observaciones: "",
  tecnico_id: "",
});

// Cargar indicios
const cargarIndicios = async () => {
  const { data } = await api.get(`/indicios/expediente/${expedienteId}`);
  indicios.value = data;
};

// Cargar técnicos
const cargarTecnicos = async () => {
  tecnicosLoading.value = true;
  try {
    const { data } = await api.get("/users");
    tecnicos.value = data
      .filter(u => u.rol === "tecnico")
      .map(u => ({
        id: u.id || u._id,
        name: u.nombre || u.name
      }));
  } catch (e) {
    tecnicos.value = [];
  }
  tecnicosLoading.value = false;
};

// Guardar
const guardar = async () => {
  const payload = {
    expediente_id: Number(expedienteId),
    nombre: nuevo.value.nombre || nuevo.value.descripcion,
    descripcion: nuevo.value.descripcion,
    tipo: nuevo.value.tipo,
    color: nuevo.value.color,
    tamaño: nuevo.value.tamaño,
    peso: nuevo.value.peso ? Number(nuevo.value.peso) : null,
    ubicacion_almacen: nuevo.value.ubicacion_almacen,
    estado_conservacion: nuevo.value.estado_conservacion,
    observaciones: nuevo.value.observaciones,
    tecnico_id: nuevo.value.tecnico_id ? Number(nuevo.value.tecnico_id) : null,
  };

  await api.post(`/indicios`, payload);

  // limpiar
  Object.keys(nuevo.value).forEach(k => nuevo.value[k] = "");
  nuevo.value.tipo = "otro";

  cargarIndicios();
};

onMounted(() => {
  cargarIndicios();
  cargarTecnicos();
});
</script>

<template>
  <div class="container mt-4">

    <h2 class="mb-4">Indicios del expediente {{ expedienteId }}</h2>

    <!-- FORMULARIO -->
    <div class="card mb-4">
      <div class="card-header">Agregar nuevo indicio</div>

      <div class="card-body">
        <div class="row g-3">

          <div class="col-md-4">
            <label class="form-label">Nombre</label>
            <input v-model="nuevo.nombre" class="form-control" />
          </div>

          <div class="col-md-4">
            <label class="form-label">Descripción</label>
            <input v-model="nuevo.descripcion" class="form-control" />
          </div>

          <div class="col-md-4">
            <label class="form-label">Tipo</label>
            <select v-model="nuevo.tipo" class="form-select">
              <option value="arma">Arma</option>
              <option value="documento">Documento</option>
              <option value="electronico">Electrónico</option>
              <option value="vestimenta">Vestimenta</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div class="col-md-3">
            <label class="form-label">Color</label>
            <input v-model="nuevo.color" class="form-control" />
          </div>

          <div class="col-md-3">
            <label class="form-label">Tamaño</label>
            <input v-model="nuevo.tamaño" class="form-control" />
          </div>

          <div class="col-md-3">
            <label class="form-label">Peso (kg)</label>
            <input v-model="nuevo.peso" class="form-control" />
          </div>

          <div class="col-md-3">
            <label class="form-label">Ubicación Almacén</label>
            <input v-model="nuevo.ubicacion_almacen" class="form-control" />
          </div>

          <div class="col-md-4">
            <label class="form-label">Estado de conservación</label>
            <input v-model="nuevo.estado_conservacion" class="form-control" />
          </div>

          <div class="col-md-4">
            <label class="form-label">Observaciones</label>
            <input v-model="nuevo.observaciones" class="form-control" />
          </div>

          <div class="col-md-4">
            <label class="form-label">Técnico</label>
            <select v-model="nuevo.tecnico_id" class="form-select">
              <option value="">Seleccione técnico</option>
              <option v-for="t in tecnicos" :key="t.id" :value="t.id">
                {{ t.name }}
              </option>
            </select>
          </div>

          <div class="col-12 mt-3">
            <button class="btn btn-primary w-100" @click="guardar">
              Guardar Indicio
            </button>
          </div>

        </div>
      </div>
    </div>

    <!-- TABLA -->
    <div class="card">
      <div class="card-header">Lista de indicios</div>

      <div class="card-body p-0">
        <table class="table table-striped table-bordered m-0">
          <thead class="table-dark">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Color</th>
              <th>Tamaño</th>
              <th>Peso</th>
              <th>Ubicación almacén</th>
              <th>Estado conservación</th>
              <th>Técnico</th>
              <th>Fecha</th>
              <th>Observaciones</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="i in indicios" :key="i.id">
              <td>{{ i.id }}</td>
              <td>{{ i.nombre }}</td>
              <td>{{ i.descripcion }}</td>
              <td>{{ i.tipo }}</td>
              <td>{{ i.color }}</td>
              <td>{{ i.tamaño }}</td>
              <td>{{ i.peso ?? "N/A" }}</td>
              <td>{{ i.ubicacion_almacen }}</td>
              <td>{{ i.estado_conservacion }}</td>
              <td>{{ i.tecnico_nombre }}</td>
              <td>{{ new Date(i.fecha_registro).toLocaleString() }}</td>
              <td>{{ i.observaciones }}</td>
            </tr>

            <tr v-if="indicios.length === 0">
              <td colspan="12" class="text-center py-3">No hay indicios registrados</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>
