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
  nuevoIndicio.value = { 
    nombre: '', 
    descripcion: '', 
    tipo: 'otro', 
    color: '', 
    tamano: '', 
    peso: '', 
    ubicacion: '', 
    ubicacion_almacen: '', 
    estado_conservacion: '',
    observaciones: '',
    tecnico_id: '' 
  };
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
    
    // Generar un nuevo número para el siguiente registro
    generarNumero(); 
    
    // Recargar la lista de expedientes
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

const generarNumero = () => {
  const rnd = Math.floor(Math.random() * 1e6).toString().padStart(6, "0");
  nuevo.value.numero_expediente = `DICRI${rnd}`;
};

onMounted(() => {
  cargarExpedientes();
  cargarTecnicos();
  generarNumero();
});


</script>

<template>
  <div class="container py-4">
    <header class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
      <h2 class="fw-bold text-primary">📂 Gestión de Expedientes DICRI</h2>
      <button class="btn btn-primary" data-bs-toggle="collapse" data-bs-target="#registroForm">
        ➕ Nuevo Expediente
      </button>
    </header>

    <div class="collapse mb-4" id="registroForm">
      <div class="card shadow-sm border-0">
        <div class="card-body p-4">
          <h5 class="card-title mb-4 border-bottom pb-2">Datos del Nuevo Expediente</h5>

          <form @submit.prevent="guardar">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label small fw-semibold">Número de Expediente</label>
                <div class="input-group">
                  <span class="input-group-text bg-light">#</span>
                  <input v-model="nuevo.numero_expediente" class="form-control fw-bold bg-light" disabled />
                </div>
              </div>

              <div class="col-md-4">
                <label class="form-label small fw-semibold">Técnico Asignado</label>
                <select v-model="nuevo.tecnico_id" class="form-select" required>
                  <option value="" disabled>Seleccione técnico...</option>
                  <option v-for="t in tecnicos" :key="t.id" :value="t.id">
                    {{ t.name }}
                  </option>
                </select>
                <small v-if="tecnicosLoading" class="text-muted">Cargando técnicos...</small>
              </div>

              <div class="col-md-4">
                <label class="form-label small fw-semibold">Fecha del Hecho</label>
                <input type="date" v-model="nuevo.fecha_hecho" class="form-control" required />
              </div>

              <div class="col-md-6">
                <label class="form-label small fw-semibold">Título / Resumen Corto</label>
                <input v-model="nuevo.titulo" class="form-control" placeholder="Ej: Robo a mano armada, Accidente de tráfico..." />
              </div>

              <div class="col-md-6">
                <label class="form-label small fw-semibold">Ubicación del Hecho</label>
                <input v-model="nuevo.ubicacion_hecho" class="form-control" placeholder="Dirección o descripción del lugar" />
              </div>

              <div class="col-md-12">
                <label class="form-label small fw-semibold">Descripción Detallada del Hecho</label>
                <textarea v-model="nuevo.descripcion" class="form-control" rows="3" placeholder="Detalles del suceso..."></textarea>
              </div>
            </div>

            <div class="accordion mt-4" id="accordionIndicios">
              <div class="accordion-item">
                <h2 class="accordion-header" id="headingOne">
                  <button class="accordion-button collapsed bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne">
                    🔬 Indicios Asociados ({{ nuevo.indicios.length }})
                  </button>
                </h2>
                <div id="collapseOne" class="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionIndicios">
                  <div class="accordion-body">
                    <h6 class="mb-3 text-secondary">Añadir Nuevo Indicio</h6>

                    <div class="row g-2 mb-3 align-items-end border-bottom pb-3">
                      <div class="col-md-3">
                        <label class="form-label small">Nombre*</label>
                        <input v-model="nuevoIndicio.nombre" class="form-control form-control-sm" placeholder="Nombre (ej: Casquillo, Teléfono)" />
                      </div>
                      <div class="col-md-3">
                        <label class="form-label small">Descripción</label>
                        <input v-model="nuevoIndicio.descripcion" class="form-control form-control-sm" placeholder="Descripción breve" />
                      </div>
                      <div class="col-md-2">
                        <label class="form-label small">Tipo</label>
                        <select v-model="nuevoIndicio.tipo" class="form-select form-select-sm">
                          <option value="arma">Arma</option>
                          <option value="documento">Documento</option>
                          <option value="electronico">Electrónico</option>
                          <option value="vestimenta">Vestimenta</option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>
                      <div class="col-md-2">
                        <label class="form-label small">Técnico</label>
                        <select v-model="nuevoIndicio.tecnico_id" class="form-select form-select-sm">
                          <option value="">(Técnico Exp.)</option>
                          <option v-for="t in tecnicos" :key="t.id" :value="t.id">{{ t.name }}</option>
                        </select>
                      </div>
                      <div class="col-md-2">
                        <button class="btn btn-sm btn-outline-success w-100" type="button" @click="agregarIndicio">
                          + Añadir
                        </button>
                      </div>

                      <div class="col-md-2">
                        <label class="form-label small">Color</label>
                        <input v-model="nuevoIndicio.color" class="form-control form-control-sm" placeholder="Color" />
                      </div>
                      <div class="col-md-2">
                        <label class="form-label small">Tamaño</label>
                        <input v-model="nuevoIndicio.tamano" class="form-control form-control-sm" placeholder="Tamaño" />
                      </div>
                      <div class="col-md-2">
                        <label class="form-label small">Peso (Kg/g)</label>
                        <input v-model="nuevoIndicio.peso" class="form-control form-control-sm" placeholder="Peso" />
                      </div>
                      <div class="col-md-3">
                        <label class="form-label small">Ubicación (Sitio)</label>
                        <input v-model="nuevoIndicio.ubicacion" class="form-control form-control-sm" placeholder="Lugar exacto del hallazgo" />
                      </div>
                      <div class="col-md-3">
                        <label class="form-label small">Ubicación (Almacén)</label>
                        <input v-model="nuevoIndicio.ubicacion_almacen" class="form-control form-control-sm" placeholder="Código de almacén/custodia" />
                      </div>
                      <div class="col-md-4">
                        <label class="form-label small">Estado de Conservación</label>
                        <input v-model="nuevoIndicio.estado_conservacion" class="form-control form-control-sm" placeholder="Estado (Bueno, Deteriorado, etc.)" />
                      </div>
                      <div class="col-md-8">
                        <label class="form-label small">Observaciones</label>
                        <input v-model="nuevoIndicio.observaciones" class="form-control form-control-sm" placeholder="Observaciones adicionales" />
                      </div>
                    </div>
                    
                    <h6 class="text-secondary mt-3">Indicios Pendientes de Guardar ({{ nuevo.indicios.length }})</h6>
                    <ul class="list-group list-group-flush mt-2">
                      <li class="list-group-item d-flex justify-content-between align-items-center bg-light" v-for="(i, idx) in nuevo.indicios" :key="idx">
                        <div class="ms-2 me-auto">
                          <div class="fw-bold text-primary">{{ i.nombre || i.descripcion }}</div>
                          <span class="badge bg-secondary me-2">{{ i.tipo }}</span>
                          <span class="small text-muted">{{ i.ubicacion }} | Almacén: {{ i.ubicacion_almacen }}</span>
                          <span class="small text-muted d-block" v-if="i.color || i.tamano || i.peso">
                            <small>Detalles: {{ i.color ? `${i.color} / ` : '' }}{{ i.tamano ? `${i.tamano} / ` : '' }}{{ i.peso ? `${i.peso} kg` : '' }}</small>
                          </span>
                        </div>
                        <button class="btn btn-sm btn-outline-danger" type="button" @click="quitarIndicio(idx)">
                          <span class="small">X Quitar</span>
                        </button>
                      </li>
                      <li v-if="!nuevo.indicios.length" class="list-group-item text-muted text-center">
                        Aún no hay indicios añadidos.
                      </li>
                    </ul>

                  </div>
                </div>
              </div>
            </div>
            <button class="btn btn-primary btn-lg mt-4 w-100" type="submit" :disabled="guardando">
              <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
              {{ guardando ? "Guardando Expediente y Indicios..." : "💾 Guardar Expediente DICRI" }}
            </button>
          </form>

        </div>
      </div>
    </div>
    <hr/>

    <div class="card shadow-sm">
      <div class="card-header bg-white fw-bold">
        📋 Lista de Expedientes Registrados
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-striped table-hover mb-0 align-middle">
            <thead class="table-dark">
              <tr>
                <th scope="col">Número</th>
                <th scope="col">Título/Hecho</th>
                <th scope="col">Técnico Asignado</th>
                <th scope="col">Fecha</th>
                <th scope="col" class="text-center">Estado</th>
                <th scope="col" class="text-center">Acciones</th>
                <th scope="col" class="text-center">Detalles</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="cargando">
                <td colspan="7" class="text-center py-4 text-muted">Cargando expedientes...</td>
              </tr>
              
              <tr v-for="e in expedientes" :key="e.id">
                <td class="fw-bold text-primary">{{ e.numero_expediente }}</td>
                <td>
                  <span class="fw-semibold">{{ e.titulo || 'Sin título' }}</span>
                  <div class="small text-muted fst-italic">{{ e.ubicacion_hecho || 'Ubicación no registrada' }}</div>
                </td>
                <td>{{ e.tecnico_nombre || 'N/A'}}</td>
                <td class="small">{{ new Date(e.fecha_hecho).toLocaleDateString() }}</td>

                <td class="text-center">
                  <span class="badge"
                    :class="{
                      'bg-warning text-dark': e.estado === 'registro',
                      'bg-info': e.estado === 'revision',
                      'bg-success': e.estado === 'aprobado',
                      'bg-danger': e.estado === 'rechazado'
                    }">
                    {{ e.estado.toUpperCase() }}
                  </span>
                </td>

                <td class="text-center">
                  <div class="d-flex flex-column align-items-center gap-1">
                    <button v-if="e.estado === 'registro' && (esCoordinador || (esTecnico && auth.user?.id == e.tecnico_id))" class="btn btn-sm btn-outline-primary w-100" @click="enviarRevision(e.id)" :disabled="actionLoading[e.id]">
                      <span v-if="actionLoading[e.id]" class="spinner-border spinner-border-sm me-1"></span>
                      📩 Revisión
                    </button>
                        
                    <div v-if="esCoordinador && e.estado === 'revision'" class="btn-group w-100" role="group">
                      <button class="btn btn-sm btn-success" @click="aprobarExpediente(e.id)" :disabled="actionLoading[e.id]">
                        <span v-if="actionLoading[e.id]" class="spinner-border spinner-border-sm me-1"></span>
                        ✔️ Aprobar
                      </button>
                      <button class="btn btn-sm btn-danger" @click="rechazarExpediente(e.id)" :disabled="actionLoading[e.id]">
                        <span v-if="actionLoading[e.id]" class="spinner-border spinner-border-sm me-1"></span>
                        ❌ Rechazar
                      </button>
                    </div>
                  </div>
                </td>

                <td class="text-center">
                  <button 
                    class="btn btn-outline-secondary btn-sm"
                    @click="router.push(`/dashboard/expediente/${e.id}/indicios`)"
                  >
                    Ver Indicios 👁️
                  </button>
                </td>
              </tr>
              <tr v-if="!cargando && !expedientes.length">
                <td colspan="7" class="text-center py-3 text-secondary">
                  No se encontraron expedientes.
                </td>
              </tr>
            </tbody>

          </table>
        </div>
      </div>
    </div>

  </div>
</template>