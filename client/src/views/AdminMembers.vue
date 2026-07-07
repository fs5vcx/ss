<template>
  <div class="shell event-hub members-page console-members">
    <header class="topbar">
      <router-link class="brand" to="/admin">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>选人系统</span>
      </router-link>
      <nav class="nav">
        <router-link to="/admin">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1"></rect>
            <rect width="7" height="5" x="14" y="3" rx="1"></rect>
            <rect width="7" height="9" x="14" y="12" rx="1"></rect>
            <rect width="7" height="5" x="3" y="16" rx="1"></rect>
          </svg>
          <span>控制台</span>
        </router-link>
        <router-link to="/admin/members">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>成员库</span>
        </router-link>
        <router-link to="/watch">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
            <circle cx="12" cy="12" r="2"></circle>
            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
            <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"></path>
          </svg>
          <span>观众页</span>
        </router-link>
      </nav>
      <div class="nav-right">
        <div class="user-info">
          <img :src="user?.avatar" :alt="user?.nickname" />
          <span>{{ user?.nickname }}</span>
        </div>
        <button class="logout-btn" @click="handleLogout">退出</button>
      </div>
    </header>

    <section class="hub-hero members-hero console-members-hero">
      <div>
        <p class="eyebrow">成员操作台</p>
        <h1>成员数据库</h1>
      </div>
    </section>

    <div class="members-layout">
      <div class="member-form panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">成员档案</p>
            <h2>新增成员</h2>
          </div>
        </div>

        <img 
          class="member-avatar-preview" 
          :src="form.avatar || defaultAvatar"
          alt="头像预览"
        />

        <form class="form" @submit.prevent="handleAdd">
          <label class="field">
            <span>昵称</span>
            <input class="input" type="text" v-model="form.name" placeholder="成员昵称" required />
          </label>

          <label class="field">
            <span>头像链接</span>
            <input class="input" type="text" v-model="form.avatar" placeholder="头像URL（可选）" />
          </label>

          <div class="segmented-row">
            <button 
              type="button" 
              class="segment" 
              :class="{ active: form.game === 'dota2' }"
              @click="form.game = 'dota2'"
            >Dota 2</button>
            <button 
              type="button" 
              class="segment" 
              :class="{ active: form.game === 'pubg' }"
              @click="form.game = 'pubg'"
            >PUBG</button>
            <button 
              type="button" 
              class="segment" 
              :class="{ active: form.game === 'csgo' }"
              @click="form.game = 'csgo'"
            >CSGO</button>
          </div>

          <label class="field">
            <span>职责/位置</span>
            <input class="input" type="text" v-model="form.role" placeholder="如：中单、carry" />
          </label>

          <label class="field">
            <span>段位/分数</span>
            <input class="input" type="text" v-model="form.rank" placeholder="如：冠绝一世" />
          </label>

          <div style="display: flex; gap: 8px;">
            <button type="submit" class="btn btn-primary" :disabled="loading" style="flex: 1;">
              {{ loading ? '添加中...' : '新增成员' }}
            </button>
            <button type="button" class="btn btn-secondary" @click="resetForm">清空</button>
          </div>
        </form>
      </div>

      <div>
        <div class="panel" style="margin-bottom: 16px;">
          <div class="section-title">
            <div>
              <p class="eyebrow">成员列表</p>
              <h2>主播名单</h2>
            </div>
            <span class="tag gold">{{ filteredMembers.length }} 人</span>
          </div>
          <input 
            class="input search-input" 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索成员..."
          />
        </div>

        <div class="member-list">
          <div 
            v-for="member in filteredMembers" 
            :key="member.id"
            class="panel member-card"
          >
            <img class="avatar" :src="member.avatar" :alt="member.name" />
            <h3>{{ member.name }}</h3>
            <p>{{ member.game === 'dota2' ? 'Dota 2' : member.game === 'pubg' ? 'PUBG' : 'CSGO' }}</p>
            <p v-if="member.role">{{ member.role }}</p>
            <p v-if="member.rank">{{ member.rank }}</p>
          </div>
        </div>

        <p v-if="filteredMembers.length === 0" class="muted" style="text-align: center; padding: 40px;">
          没有匹配的成员。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { getMembers, addMember } from '../api.js'

const showNotification = inject('showNotification')
const handleLogout = inject('handleLogout')

const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
const members = ref([])
const searchQuery = ref('')
const loading = ref(false)
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'

const form = reactive({
  name: '',
  avatar: '',
  game: 'dota2',
  role: '',
  rank: ''
})

const filteredMembers = computed(() => {
  if (!searchQuery.value) return members.value
  const q = searchQuery.value.toLowerCase()
  return members.value.filter(m => 
    m.name.toLowerCase().includes(q) ||
    (m.role && m.role.toLowerCase().includes(q))
  )
})

async function loadMembers() {
  try {
    const res = await getMembers()
    if (res.success) {
      members.value = res.members
    }
  } catch (e) {
    console.error(e)
  }
}

async function handleAdd() {
  if (!form.name) {
    showNotification('请输入成员昵称', 'error')
    return
  }
  
  loading.value = true
  try {
    const avatar = form.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(form.name)}`
    const res = await addMember({
      name: form.name,
      avatar,
      game: form.game,
      role: form.role,
      rank: form.rank
    })
    
    if (res.success) {
      showNotification('成员添加成功', 'success')
      resetForm()
      loadMembers()
    } else {
      showNotification(res.message || '添加失败', 'error')
    }
  } catch (e) {
    showNotification(e.response?.data?.message || '添加失败', 'error')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.name = ''
  form.avatar = ''
  form.game = 'dota2'
  form.role = ''
  form.rank = ''
}

onMounted(() => {
  loadMembers()
})
</script>
