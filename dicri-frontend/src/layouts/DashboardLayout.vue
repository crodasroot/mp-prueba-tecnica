<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="brand">
        <h5>Soy,  {{ auth.user?.rol }}</h5>
      </div>

      <nav class="menu">
        <ul>
          <li><RouterLink class="link" to="/dashboard/home">Inicio</RouterLink></li>
          <li><RouterLink class="link" to="/dashboard/expedientes">Expedientes</RouterLink></li>
          <li><RouterLink class="link" to="/dashboard/reportes">Reportes</RouterLink></li>
          <li><RouterLink class="link" to="/dashboard/revisiones">Revisiones (incompleto)</RouterLink></li>
        </ul>
      </nav>
    </aside>

    <!-- Content -->
    <div class="content">
      <Navbar />
      <main class="main">
        <router-view />
      </main>
    </div>
  </div>
  <footer class="text-center p-4 " style="border-right: #1a2430">
    <p>Dicri - Prueba Técnica Sistema de Gestión de Evidencias</p>
    <p>&copy; 2025   Carlos Rodas</p>
  </footer>
</template>

<script setup>
import Navbar from "../components/Navbar.vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();

// agregar el rol en mayúsculas
if (auth.user && auth.user.rol) {
  auth.user.rol = auth.user.rol.toUpperCase();
}
</script>

<style scoped>
/* Layout */
.layout {
  display: flex;
  min-height: 100vh;
  background: #f6f8fa;
  color: #222;
}

/* Sidebar */
.sidebar {
  width: 240px;
  background-color: #1a2430;
  color: #e6eef8;
  padding: 18px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255,255,255,0.04);
}

/* Brand */
.brand {
  margin-bottom: 12px;
}
.brand h5 {
  margin: 0;
  font-size: 18px;
  letter-spacing: 0.6px;
  color: #e6eef8;
}

/* Menu */
.menu {
  margin-top: 8px;
  flex: 1;
  overflow-y: auto;
}
.menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.menu li {
  margin-bottom: 8px;
}

/* Links */
.link {
  display: block;
  text-decoration: none;
  padding: 10px 12px;
  border-radius: 6px;
  color: #cfe3f7;
  font-weight: 500;
  transition: background 120ms ease, color 120ms ease;
}
.link:hover {
  background: rgba(255,255,255,0.03);
  color: #ffffff;
}

/* Active link (Vue router adds this class) */
.router-link-active {
  background: #0d6efd;
  color: white !important;
}

/* Content area */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Main area (below navbar) */
.main {
  padding: 20px;
  box-sizing: border-box;
  flex: 1;
}

/* Responsive: collapse sidebar under 720px */
@media (max-width: 720px) {
  .layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 10px;
    overflow-x: auto;
  }
  .menu ul {
    display: flex;
    flex-direction: row;
    gap: 6px;
  }
  .menu li {
    margin-bottom: 0;
  }
  .link {
    padding: 8px 10px;
    white-space: nowrap;
  }
}
</style>
