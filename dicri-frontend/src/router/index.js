import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

import LoginView from "../views/LoginView.vue";
import DashboardLayout from "../layouts/DashboardLayout.vue";
import HomeView from "../views/HomeView.vue";
import ExpedientesView from "../views/ExpedientesView.vue";
import IndiciosView from "../views/IndiciosView.vue";
import RevisionesView from "../views/RevisionesView.vue";
import ReportesView from "../views/ReportesView.vue";

const routes = [
  { path: "/login", component: LoginView },
  { path: "/", redirect: "/dashboard/home" },

  {
    path: "/dashboard",
    component: DashboardLayout,
    meta: { auth: true },
    children: [
      { path: "home", component: HomeView },
      { path: "expedientes", component: ExpedientesView },
  { path: "expediente/:id/indicios", component: IndiciosView },
  { path: "expediente/:id/indicios/:indicioId", component: () => import('../views/IndicioShow.vue') },
      { path: "revisiones", component: RevisionesView },
      { path: "reportes", component: ReportesView },
      { path: "", redirect: "home" },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  // Comprueba si alguna de las rutas matcheadas requiere auth
  const requiereAuth = to.matched.some((r) => r.meta && r.meta.auth);
  if (requiereAuth && !auth.token) next("/login");
  else next();
});

export default router;
