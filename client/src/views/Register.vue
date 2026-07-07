<template>
  <div class="auth-page">
    <div class="auth-card panel">
      <div class="auth-header">
        <h1>注册账号</h1>
        <p>创建账号进入备选区</p>
      </div>
      
      <form class="form" @submit.prevent="handleRegister">
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
          <span>昵称</span>
          <input 
            type="text" 
            class="input" 
            v-model="nickname" 
            placeholder="显示的昵称（可选）"
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
            minlength="4"
          />
        </label>
        
        <label class="field">
          <span>确认密码</span>
          <input 
            type="password" 
            class="input" 
            v-model="confirmPassword" 
            placeholder="请再次输入密码"
            required
          />
        </label>
        
        <p v-if="error" class="error-text">{{ error }}</p>
        
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <div class="auth-footer">
        已有账号？<router-link to="/login">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../api.js'

const router = useRouter()
const showNotification = inject('showNotification')

const username = ref('')
const nickname = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  error.value = ''
  
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  
  if (password.value.length < 4) {
    error.value = '密码至少4位'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  
  loading.value = true
  
  try {
    const res = await register(username.value, password.value, nickname.value)
    if (res.success) {
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      showNotification('注册成功', 'success')
      router.push('/watch')
    } else {
      error.value = res.message || '注册失败'
    }
  } catch (e) {
    error.value = e.response?.data?.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>
