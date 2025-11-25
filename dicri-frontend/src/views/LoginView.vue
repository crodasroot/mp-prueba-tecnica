<script setup>
import { ref } from "vue";
import api from "../api/axios";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const email = ref("");
const password = ref("");
const loading = ref(false);

const router = useRouter();
const auth = useAuthStore();

const login = async () => {
  loading.value = true;

  try {
    const { data } = await api.post("/users/login", {
      email: email.value,
      password: password.value,
    });

    auth.setToken(data.token);
    auth.setUser(data.user);
    router.push("/");
  } catch (err) {
    alert("Credenciales incorrectas");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-container">

    <div class="login-card">
      <h2 class="title">DICRI — Acceso</h2>

      <div class="input-group">
        <input
          v-model="email"
          type="email"
          placeholder="Correo electrónico"
        />
      </div>

      <div class="input-group">
        <input
          v-model="password"
          type="password"
          placeholder="Contraseña"
        />
      </div>

      <button class="btn" @click="login" :disabled="loading">
        {{ loading ? "Ingresando..." : "Ingresar" }}
      </button>
    </div>

  </div>
</template>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5;
}

.login-card {
  background: white;
  width: 350px;
  padding: 2rem;
  border-radius: 14px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  text-align: center;
}

.title {
  margin-bottom: 1.6rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: #1a2430;
}

.input-group {
  margin-bottom: 1.2rem;
}

input {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #d0d0d0;
  font-size: 14px;
  outline: none;
}

input:focus {
  border-color: #1a73e8;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  background: #1a73e8;
  color: white;
  font-size: 15px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
}

.btn:disabled {
  background: #7aa9e8;
  cursor: not-allowed;
}

.btn:hover:not(:disabled) {
  background: #1557b0;
}
</style>
