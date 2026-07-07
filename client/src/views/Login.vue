<template>
  <div class="auth-page">
    <div class="auth-card panel">
      <div class="auth-header">
        <h1>选人系统</h1>
        <p>登录你的账号进入备选区</p>
      </div>
      
      <form class="form" @submit.prevent="handleLogin">
        <label class="field">
          <span>用户名</span>
          <input 
            type="text" 
            class="input" 
            v-model="username" 
            placeholder="请输入用户名"
            required
          />
        </label>
        
        <label class="field">
          <span>密码</span>
          <input 
            type="password" 
            class="input" 
            v-model="password" 
            placeholder="请输入密码"
            required
          />
        </label>
        
        <p v-if="error" class="error-text">{{ error }}</p>
        
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="auth-footer">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api.js'

const router = useRouter()
const showNotification = inject('showNotification')

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const res = await login(username.value, password.value)
    if (res.success) {
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      showNotification('登录成功', 'success')
      
      if (res.user.isAdmin) {
        router.push('/admin')
      } else {
        router.push('/watch')
      }
    } else {
      error.value = res.message || '登录失败'
    }
  } catch (e) {
    error.value = e.response?.data?.message || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>
