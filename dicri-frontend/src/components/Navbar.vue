<template>
  <nav class="navbar">
    <h2>DICRI Evidencias</h2>

    <ul>
      <li class="user-name">Bienvenido,   <strong>{{ auth.user?.name }}</strong></li>
      <li><RouterLink to="/login">Salir</RouterLink></li>
    </ul>
  </nav>
</template>

<script setup>
import { useAuthStore } from "../stores/auth";
import { storeToRefs } from "pinia";

const auth = useAuthStore();
</script>

<style scoped>
.navbar {
  width: 100%;
  background: #1a2430;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar ul {
  display: flex;
  gap: 1.2rem;
  list-style: none;
  align-items: center;
}

.navbar a {
  color: white;
  text-decoration: none;
  font-weight: bold;
}

.user-name {
  font-weight: bold;
  background: #2c3b4f;
  padding: 6px 12px;
  border-radius: 6px;
}
</style>
