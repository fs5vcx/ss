<template>
  <router-view />
  
  <div v-if="notification" class="notification" :class="notification.type">
    {{ notification.message }}
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import { useRouter } from 'vue-router'
import { logout as apiLogout } from './api.js'

const notification = ref(null)
const router = useRouter()

function showNotification(message, type = 'success') {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

async function handleLogout() {
  try {
    await apiLogout()
  } catch (e) {}
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  showNotification('已退出登录', 'info')
  router.push('/login')
}

provide('showNotification', showNotification)
provide('handleLogout', handleLogout)
</script>
