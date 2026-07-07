import { createRouter, createWebHistory } from 'vue-router'
import Login from './views/Login.vue'
import Register from './views/Register.vue'
import Watch from './views/Watch.vue'
import Admin from './views/Admin.vue'
import AdminMembers from './views/AdminMembers.vue'

const routes = [
  { path: '/', redirect: '/watch' },
  { path: '/login', component: Login, meta: { guest: true } },
  { path: '/register', component: Register, meta: { guest: true } },
  { path: '/watch', component: Watch, meta: { requiresAuth: true } },
  { path: '/admin', component: Admin, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/members', component: AdminMembers, meta: { requiresAuth: true, requiresAdmin: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.meta.requiresAdmin && user && !user.isAdmin) {
    next('/watch')
  } else if (to.meta.guest && token) {
    next('/watch')
  } else {
    next()
  }
})

export default router
