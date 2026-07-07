<template>
  <div class="shell event-hub admin-home console-home">
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

    <div class="console-particles" aria-hidden="true"></div>

    <section class="console-stage">
      <div class="hub-hero console-hero">
        <div>
          <p class="console-kicker">在线选人台</p>
          <h1>
            <span>开饭</span>
            <span>选人</span>
          </h1>
        </div>
      </div>

      <div class="admin-home-layout console-panel-wrap">
        <section class="panel hub-panel create-session-panel console-create-panel">
          <div class="section-title">
            <div>
              <p class="eyebrow">开饭配置</p>
              <h2>新局开桌</h2>
            </div>
          </div>

          <form class="form" @submit.prevent="handleStart">
            <label class="field">
              <span>游戏</span>
              <select class="select" v-model="form.game">
                <option value="dota2">Dota 2</option>
                <option value="pubg">PUBG</option>
                <option value="csgo">CSGO</option>
              </select>
            </label>

            <div class="segmented-row">
              <button 
                type="button" 
                class="segment" 
                :class="{ active: form.isFun }"
                @click="form.isFun = !form.isFun"
              >娱乐赛</button>
              <button 
                type="button" 
                class="segment" 
                :class="{ active: form.isOfficial }"
                @click="form.isOfficial = !form.isOfficial"
              >正赛</button>
              <button 
                type="button" 
                class="segment" 
                :class="{ active: form.matchType === 'default' }"
                @click="form.matchType = 'default'"
              >默认赛事</button>
              <button 
                type="button" 
                class="segment" 
                :class="{ active: form.matchType === 'custom' }"
                @click="form.matchType = 'custom'"
              >自定义赛事</button>
            </div>

            <div class="grid two even">
              <label class="field">
                <span>队伍数量</span>
                <input 
                  class="input" 
                  type="number" 
                  min="2" 
                  max="8" 
                  v-model.number="form.teamCount"
                />
              </label>
              <label class="field">
                <span>每队人数</span>
                <input 
                  class="input" 
                  type="number" 
                  min="1" 
                  max="10" 
                  v-model.number="form.teamSize"
                />
              </label>
            </div>

            <label v-if="form.matchType === 'custom'" class="field">
              <span>赛事名称</span>
              <input class="input" type="text" v-model="form.matchName" placeholder="如：熊掌major" />
            </label>

            <button type="submit" class="btn btn-primary hub-primary console-cta" :disabled="loading">
              {{ loading ? '开启中...' : '开始选人' }}
            </button>
          </form>

          <div v-if="room && room.status !== 'idle'" style="margin-top: 20px;">
            <div class="section-title">
              <div>
                <p class="eyebrow">当前状态</p>
                <h2>进行中的比赛</h2>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <p class="muted">状态：{{ statusText }}</p>
              <p class="muted">队伍：{{ room.teamCount }} 队 / 每队 {{ room.teamSize }} 人</p>
              <p class="muted">已签到：{{ room.checkinMembers?.length || 0 }} 人</p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button 
                  v-if="room.status === 'waiting'" 
                  class="btn btn-primary" 
                  @click="handleStartPick"
                >开始选人</button>
                <button 
                  class="btn btn-danger" 
                  @click="handleReset"
                >重置比赛</button>
                <router-link class="btn btn-secondary" to="/watch">查看观众页</router-link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, inject } from 'vue'
import { startRoom, resetRoom, startPick, getRoom } from '../api.js'
import wsClient from '../websocket.js'

const showNotification = inject('showNotification')
const handleLogout = inject('handleLogout')

const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
const room = ref(null)
const loading = ref(false)

const form = reactive({
  game: 'dota2',
  teamCount: 4,
  teamSize: 5,
  isFun: true,
  isOfficial: false,
  matchType: 'default',
  matchName: ''
})

const statusText = computed(() => {
  const s = room.value?.status
  if (s === 'idle') return '未开始'
  if (s === 'waiting') return '等待选人'
  if (s === 'picking') return '选人中'
  return '已结束'
})

async function loadRoom() {
  try {
    const res = await getRoom()
    if (res.success) {
      room.value = res.room
    }
  } catch (e) {
    console.error(e)
  }
}

async function handleStart() {
  loading.value = true
  try {
    let matchType = 'default'
    if (form.matchType === 'custom') {
      matchType = 'custom'
    } else if (form.isOfficial) {
      matchType = 'official'
    } else if (form.isFun) {
      matchType = 'fun'
    }
    
    const res = await startRoom({
      game: form.game,
      teamCount: form.teamCount,
      teamSize: form.teamSize,
      matchType,
      matchName: form.matchName
    })
    
    if (res.success) {
      showNotification('比赛已开启', 'success')
      loadRoom()
    } else {
      showNotification(res.message || '开启失败', 'error')
    }
  } catch (e) {
    showNotification(e.response?.data?.message || '开启失败', 'error')
  } finally {
    loading.value = false
  }
}

async function handleStartPick() {
  try {
    const res = await startPick()
    if (res.success) {
      showNotification('选人已开始', 'success')
      loadRoom()
    } else {
      showNotification(res.message || '操作失败', 'error')
    }
  } catch (e) {
    showNotification(e.response?.data?.message || '操作失败', 'error')
  }
}

async function handleReset() {
  if (!confirm('确定要重置当前比赛吗？')) return
  
  try {
    const res = await resetRoom()
    if (res.success) {
      showNotification('比赛已重置', 'success')
      loadRoom()
    } else {
      showNotification(res.message || '重置失败', 'error')
    }
  } catch (e) {
    showNotification(e.response?.data?.message || '重置失败', 'error')
  }
}

function setupWebSocket() {
  const wsUrl = (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + 
    window.location.hostname + ':3000'
  wsClient.connect(wsUrl)
  
  wsClient.on('room-update', (data) => {
    room.value = data.data
  })
}

onMounted(() => {
  loadRoom()
  setupWebSocket()
})

onUnmounted(() => {
  wsClient.close()
})
</script>
