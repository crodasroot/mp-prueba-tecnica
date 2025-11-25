import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || null,
    // Guardamos también la información del usuario en localStorage para poder
    // recuperarla al recargar la página y permitir que componentes lean `auth.user`.
    user: JSON.parse(localStorage.getItem("user") || "null"),
  }),

  actions: {
    setToken(token) {
      this.token = token;
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    },

    
   setUser(user) {
        if (user) {
          const normalized = {
            id: user.id,
            name: user.nombre || user.name || "",
            email: user.email,
            rol: user.role,
          };
          this.user = normalized;
          localStorage.setItem("user", JSON.stringify(normalized));
        } else {
          this.user = null;
          localStorage.removeItem("user");
        }
      }
      ,

          logout() {
            this.token = null;
            localStorage.removeItem("token");
            this.user = null;
            localStorage.removeItem("user");
          }
        }
});
