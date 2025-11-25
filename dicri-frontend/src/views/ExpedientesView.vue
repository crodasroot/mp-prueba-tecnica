<script setup>
import { ref, onMounted, computed, reactive } from "vue";
import api from "../api/axios";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();

const auth = useAuthStore();

const esCoordinador = computed(() => !!auth.user && auth.user.rol === "COORDINADOR");
const esTecnico = computed(() => !!auth.user && auth.user.rol === "TECNICO");
const actionLoading = reactive({}); // trackeo por id: actionLoading[id] = true/false

const expedientes = ref([]);
const tecnicos = ref([]);
const cargando = ref(true);
const tecnicosLoading = ref(false);
const guardando = ref(false);


const nuevo = ref({
  numero_expediente: "",
  tecnico_id: "",
  fecha_hecho: "",
  titulo: "",
  descripcion: "",
  ubicacion_hecho: ""
});


nuevo.value.indicios = [];

const nuevoIndicio = ref({
  nombre: "",
  descripcion: "",
  tipo: "otro",
  color: "",
  tamano: "",
  peso: "",
  ubicacion: "",
  ubicacion_almacen: "",
  estado_conservacion: "",
  observaciones: "",
  tecnico_id: ""
});


const cargarExpedientes = async () => {
  cargando.value = true;
  const { data } = await api.get("/expedientes");
  expedientes.value = data;
  cargando.value = false;
};


const cargarTecnicos = async () => {
  tecnicosLoading.value = true;
  try {
    const { data } = await api.get("/users");
    
    tecnicos.value = data
      .filter(u => u.role === "tecnico")  
      .map(u => ({
        id: u.id,
        name: u.name                       
      }));
     
  } catch (e) {
    tecnicos.value = [];
  }
  tecnicosLoading.value = false;
};



const agregarIndicio = () => {
  
  if (!nuevoIndicio.value.nombre) return alert('Completa el nombre del indicio');
  const tecnicoSeleccionado = nuevoIndicio.value.tecnico_id || nuevo.value.tecnico_id;
  if (!tecnicoSeleccionado) return alert('Selecciona un técnico para el indicio');

 
  nuevo.value.indicios.push({ ...nuevoIndicio.value, tecnico_id: tecnicoSeleccionado });
  nuevoIndicio.value = { nombre: '', descripcion: '', color: '', tamano: '', peso: '', ubicacion: '', tecnico_id: '' };
};

const quitarIndicio = (index) => {
  nuevo.value.indicios.splice(index, 1);
};

const guardar = async () => {
  if (!nuevo.value.numero_expediente || !nuevo.value.fecha_hecho || !nuevo.value.tecnico_id) {
    return alert("Completa número, técnico y fecha");
  }

  guardando.value = true;
  try {
    // Crear expediente primero
    const { data: created } = await api.post("/expedientes", {
      numero_expediente: nuevo.value.numero_expediente,
      tecnico_id: nuevo.value.tecnico_id,
      fecha_hecho: nuevo.value.fecha_hecho,
      titulo: nuevo.value.titulo,
      descripcion: nuevo.value.descripcion,
      ubicacion_hecho: nuevo.value.ubicacion_hecho,
    });

    const expedienteId = created?.id || created?._id || created;

    // Si hay indicios agregados, crearlos uno a uno en el endpoint correspondiente
      if (Array.isArray(nuevo.value.indicios) && nuevo.value.indicios.length > 0) {
        for (const indicio of nuevo.value.indicios) {
        // Payload según el controlador: el backend espera expediente_id en el body
        const payload = {
          nombre: indicio.nombre || indicio.descripcion,
          descripcion: indicio.descripcion,
          tipo: indicio.tipo || 'otro',
          color: indicio.color,
          tamano: indicio.tamano,
          // también incluir la key con ñ por si el backend la espera así
          'tamaño': indicio.tamano,
          peso: indicio.peso ? parseFloat(String(indicio.peso).replace(',', '.')) : null,
          ubicacion_almacen: indicio.ubicacion_almacen || '',
          ubicacion: indicio.ubicacion || '',
          estado_conservacion: indicio.estado_conservacion || '',
          observaciones: indicio.observaciones || '',
          tecnico_id: indicio.tecnico_id ? Number(indicio.tecnico_id) : Number(nuevo.value.tecnico_id),
          expediente_id: expedienteId
        };

        try {
          // POST a /indicios con expediente_id en el body (según tu controlador)
          await api.post(`/indicios`, payload);
        } catch (e) {
          console.error('Error creando indicio en /indicios:', e.response?.data || e.message);
          throw e;
        }
      }
      }

    // Reset del formulario y regenerar número
    nuevo.value = {
      numero_expediente: "",
      tecnico_id: "",
      fecha_hecho: "",
      titulo: "",
      descripcion: "",
      ubicacion_hecho: "",
      indicios: []
    };
    
    await cargarExpedientes();
  } catch (err) {
    console.error('Error al guardar expediente con indicios:', err);
    alert(err.response?.data?.error || err.response?.data?.message || "Error al guardar");
  }
  guardando.value = false;
};


const aprobarExpediente = async (id) => {
  if (!esCoordinador.value) return alert('No tienes permisos para aprobar');
  if (!confirm('¿Confirmar aprobación del expediente?')) return;
  try {
    actionLoading[id] = true;
    await api.put(`/expedientes/${id}/aprobar`, { coordinador_id: auth.user?.id });
    alert('Expediente aprobado');
    await cargarExpedientes();
  } catch (e) {
    console.error('Error aprobando expediente:', e.response?.data || e.message);
    alert(e.response?.data?.error || 'Error al aprobar');
  } finally {
    actionLoading[id] = false;
  }
};

// Rechazar expediente (solo coordinador) — pide justificación
const rechazarExpediente = async (id) => {
  if (!esCoordinador.value) return alert('No tienes permisos para rechazar');
  const justificacion = prompt('Ingresa la justificación del rechazo:');
  if (!justificacion) return alert('La justificación es requerida');
  try {
    actionLoading[id] = true;
    await api.put(`/expedientes/${id}/rechazar`, { coordinador_id: auth.user?.id, justificacion });
    alert('Expediente rechazado');
    await cargarExpedientes();
  } catch (e) {
    console.error('Error rechazando expediente:', e.response?.data || e.message);
    alert(e.response?.data?.error || 'Error al rechazar');
  } finally {
    actionLoading[id] = false;
  }
};

// Enviar a revisión (coordinador o técnico) cuando el expediente esté en 'registro'
const enviarRevision = async (id) => {
  if (!esCoordinador.value && !esTecnico.value) return alert('No tienes permisos para enviar a revisión');
  if (!confirm('¿Enviar expediente a revisión?')) return;
  try {
    actionLoading[id] = true;
    // Enviamos información mínima del remitente; el backend puede ignorarla o usarla según su lógica
    await api.put(`/expedientes/${id}/revision`, { remitente_id: auth.user?.id, remitente_rol: auth.user?.rol });
    alert('Expediente enviado a revisión');
    await cargarExpedientes();
  } catch (e) {
    console.error('Error enviando a revisión:', e.response?.data || e.message);
    alert(e.response?.data?.error || 'Error al enviar a revisión');
  } finally {
    actionLoading[id] = false;
  }
};

onMounted(() => {
  cargarExpedientes();
  cargarTecnicos();
  generarNumero();
});

const generarNumero = () => {
  const rnd = Math.floor(Math.random() * 1e6).toString().padStart(6, "0");
  nuevo.value.numero_expediente = `DICRI${rnd}`;
};
</script>

<template>
  <div class="container py-4">
   
    <h2 class="fw-bold mb-3"> Expedientes DICRI</h2>
         
    <!-- FORMULARIO -->
    <div class="card mb-4">
      <div class="card-body">

        <h5 class="mb-4">Registrar nuevo expediente</h5>

  <div class="row g-3">
          <div class="col-md-4">
            <div class="input-group">
              <input
                v-model="nuevo.numero_expediente"
                class="form-control"
                placeholder="Número de expediente"
                disabled
              />
             
            </div>
          </div>

          <div class="col-md-4">
            <select v-model="nuevo.tecnico_id" class="form-select">
              <option value="">Seleccione técnico</option>
              <option v-for="t in tecnicos" :key="t.id" :value="t.id">
                {{ t.name }}
              </option>
            </select>
          </div>

          <div class="col-md-4">
            <input type="date" v-model="nuevo.fecha_hecho" class="form-control" />
          </div>

          <div class="col-md-4">
            <input v-model="nuevo.titulo" class="form-control" placeholder="Título" />
          </div>

          <div class="col-md-4">
            <input v-model="nuevo.ubicacion_hecho" class="form-control" placeholder="Ubicación del hecho" />
          </div>

          <div class="col-md-12">
            <textarea v-model="nuevo.descripcion" class="form-control" placeholder="Descripción del hecho"></textarea>
          </div>

          <!-- Añadir indicios antes de guardar -->
          <div class="col-12 mt-3">
            <div class="card p-3">
              <h6 class="mb-3">Agregar indicio (antes de guardar expediente)</h6>

              <div class="row g-2 align-items-end">
                <div class="col-md-4">
                  <input v-model="nuevoIndicio.nombre" class="form-control" placeholder="Nombre del indicio" />
                </div>
                <div class="col-md-4">
                  <input v-model="nuevoIndicio.descripcion" class="form-control" placeholder="Descripción del indicio" />
                </div>
                <div class="col-md-2">
                  <select v-model="nuevoIndicio.tipo" class="form-select">
                    <option value="arma">Arma</option>
                    <option value="documento">Documento</option>
                    <option value="electronico">Electrónico</option>
                    <option value="vestimenta">Vestimenta</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div class="col-md-2">
                  <input v-model="nuevoIndicio.color" class="form-control" placeholder="Color" />
                </div>
                <div class="col-md-2">
                  <input v-model="nuevoIndicio.tamano" class="form-control" placeholder="Tamaño" />
                </div>
                <div class="col-md-2">
                  <input v-model="nuevoIndicio.peso" class="form-control" placeholder="Peso" />
                </div>
                <div class="col-md-2">
                  <select v-model="nuevoIndicio.tecnico_id" class="form-select">
                    <option value="">Técnico</option>
                    <option v-for="t in tecnicos" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </div>

                <div class="col-12 mt-2 d-flex gap-2">
                  <input v-model="nuevoIndicio.ubicacion" class="form-control" placeholder="Ubicación del indicio (sitio del hallazgo)" />
                  <input v-model="nuevoIndicio.ubicacion_almacen" class="form-control" placeholder="Ubicación en almacén" />
                  <input v-model="nuevoIndicio.estado_conservacion" class="form-control" placeholder="Estado de conservación" />
                  <button class="btn btn-sm btn-outline-primary" type="button" @click="agregarIndicio">Agregar indicio</button>
                </div>
              </div>

              <div class="mt-3">
                <small class="text-muted">Indicios agregados para este expediente:</small>
                <ul class="list-group mt-2">
                  <li class="list-group-item d-flex justify-content-between align-items-start" v-for="(i, idx) in nuevo.indicios" :key="idx">
                    <div>
                      <strong>{{ i.nombre || i.descripcion }}</strong>
                      <div class="text-muted small">{{ i.tipo }} · {{ i.color }} · {{ i.tamano }} · {{ i.ubicacion }}</div>
                      <div class="text-muted small">Almacén: {{ i.ubicacion_almacen }} · Estado: {{ i.estado_conservacion }}</div>
                    </div>
                    <div>
                      <button class="btn btn-sm btn-danger" @click="quitarIndicio(idx)">Eliminar</button>
                    </div>
                  </li>
                  <li v-if="!nuevo.indicios.length" class="list-group-item text-muted">No hay indicios añadidos.</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        <button class="btn btn-primary mt-3" @click="guardar" :disabled="guardando">
          <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
          {{ guardando ? "Guardando..." : "Guardar expediente" }}
        </button>

      </div>
    </div>

    <!-- TABLA -->
    <div class="card">
      <div class="card-body p-0">
          
        <table class="table table-bordered table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Número</th>
              <th>Técnico</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
              <th>Indicios</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="cargando">
              <td colspan="6" class="text-center py-4">Cargando...</td>
            </tr>

            <tr v-for="e in expedientes" :key="e.id">
              <td>{{ e.numero_expediente }}</td>
              <td>{{ e.tecnico_nombre}}</td>
              <td>{{ e.fecha_hecho }}</td>

              <td>
                <span class="badge"
                  :class="{
                    'bg-warning text-dark': e.estado === 'registro',
                    'bg-info': e.estado === 'revision',
                    'bg-success': e.estado === 'aprobado',
                    'bg-danger': e.estado === 'rechazado'
                  }">
                  {{ e.estado }}
                </span>
              </td>

              <td>
                <!-- Enviar a revisión: visible si está en 'registro' y el usuario es coordinador o el técnico asignado -->
                <button v-if="e.estado === 'registro' && (esCoordinador || (esTecnico && auth.user?.id == e.tecnico_id))" class="btn btn-sm btn-primary me-1" @click="enviarRevision(e.id)" :disabled="actionLoading[e.id]">
                  <span v-if="actionLoading[e.id]" class="spinner-border spinner-border-sm me-1"></span>
                  Enviar a revisión
                </button>
                    {{  }}
                <div v-if="esCoordinador">
                  <button v-if="e.estado === 'revision'" class="btn btn-sm btn-success me-1" @click="aprobarExpediente(e.id)" :disabled="actionLoading[e.id]">
                    <span v-if="actionLoading[e.id]" class="spinner-border spinner-border-sm me-1"></span>
                    Aprobar
                  </button>

                  <button v-if="e.estado === 'revision'" class="btn btn-sm btn-danger me-1" @click="rechazarExpediente(e.id)" :disabled="actionLoading[e.id]">
                    Rechazar
                  </button>
                </div>
              </td>

              <td>
                <button 
                  class="btn btn-outline-primary btn-sm"
                    @click="router.push(`/dashboard/expediente/${e.id}/indicios`)"
                >
                  Ver indicios →
                </button>
              </td>

            </tr>
          </tbody>

        </table>

      </div>
    </div>

  </div>
</template>
