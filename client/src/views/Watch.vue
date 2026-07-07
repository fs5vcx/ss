<template>
  <div class="shell draft-shell">
    <header class="topbar">
      <router-link class="brand" to="/watch">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>选人系统</span>
      </router-link>
      <nav class="nav">
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
        <router-link v-if="user?.isAdmin" to="/admin">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1"></rect>
            <rect width="7" height="5" x="14" y="3" rx="1"></rect>
            <rect width="7" height="9" x="14" y="12" rx="1"></rect>
            <rect width="7" height="5" x="3" y="16" rx="1"></rect>
          </svg>
          <span>控制台</span>
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

    <h1 class="draft-title">选人房间</h1>

    <div class="draft-room">
      <section class="draft-toolbar panel">
        <div class="toolbar-grid viewer-toolbar-grid">
          <label class="field">
            <span>游戏</span>
            <select class="select" disabled>
              <option value="dota2" :selected="room?.game === 'dota2'">Dota 2</option>
              <option value="pubg" :selected="room?.game === 'pubg'">PUBG</option>
              <option value="csgo" :selected="room?.game === 'csgo'">CSGO</option>
            </select>
          </label>
          <label class="field">
            <span>队伍</span>
            <input class="input" disabled :value="room?.teamCount || 0" />
          </label>
          <label class="field">
            <span>人数</span>
            <input class="input" disabled :value="room?.teamSize || 0" />
          </label>
          <label class="field">
            <span>选人顺序</span>
            <input class="input" disabled :value="pickOrderText" />
          </label>
          <div class="toolbar-actions viewer-toolbar-status">
            <span class="tag live">自动刷新</span>
            <span v-if="room?.matchName" class="tag">{{ room?.matchName }}</span>
            <span class="tag">{{ matchTypeText }}</span>
          </div>
        </div>
        
        <div v-if="room?.status !== 'idle'" class="captain-row">
          <label 
            v-for="(team, idx) in room?.teams || []" 
            :key="idx"
            class="field captain-field"
            :style="{ '--team-color': team.color, '--team-surface': team.surface }"
          >
            <span>{{ team.name }}队长</span>
            <select class="select" disabled>
              <option :value="team.captain?.id || ''">
                {{ team.captain?.name || '等待队长' }}
              </option>
            </select>
          </label>
        </div>
      </section>

      <section class="draft-progress panel">
        <div class="progress-title">
          <strong>{{ statusText }}</strong>
          <span class="tag gold">{{ pickedCount }}/{{ totalPicks }}</span>
        </div>
        <div class="pick-order">
          <div 
            v-for="(pick, idx) in displayPickOrder" 
            :key="idx" 
            class="pick-slot"
            :class="{ active: idx < pickedCount }"
            :style="{ background: idx < pickedCount ? pick.color : '' }"
          ></div>
        </div>
      </section>

      <section class="draft-stage compact-stage">
        <div class="draft-main-column">
          <div class="draft-teams">
            <div class="team-grid team-grid-compact">
              <section 
                v-for="(team, idx) in room?.teams || []" 
                :key="idx"
                class="panel team"
                :style="{ '--team-color': team.color, '--team-surface': team.surface }"
              >
                <div class="section-title">
                  <h2>{{ team.name }}</h2>
                  <span class="tag gold">{{ team.players?.length || 0 }} / {{ room?.teamSize || 0 }}</span>
                </div>
                <div class="team-card-grid">
                  <template v-if="team.players?.length > 0">
                    <div 
                      v-for="player in team.players" 
                      :key="player.id"
                      class="card pool-tile team-tile"
                      :class="{ 'captain-card': team.captain?.id === player.id }"
                    >
                      <img class="avatar" :src="player.avatar" :alt="player.name" />
                      <strong :title="player.name">{{ player.name }}</strong>
                      <span v-if="team.captain?.id === player.id" class="tag live">队长</span>
                    </div>
                  </template>
                  <p v-else class="muted empty-slot">等待队长</p>
                </div>
              </section>
            </div>
          </div>
        </div>

        <aside class="panel draft-pool">
          <div class="section-title pool-title">
            <div>
              <h2>备选池</h2>
              <p class="pool-subtitle">已签到且可被当前场次选择的成员</p>
            </div>
            <div class="pool-title-actions">
              <span class="tag gold">{{ room?.poolMembers?.length || 0 }}</span>
            </div>
          </div>
          <div class="pool-grid">
            <template v-if="room?.poolMembers?.length > 0">
              <div 
                v-for="member in room?.poolMembers || []" 
                :key="member.id"
                class="card pool-tile"
              >
                <img class="avatar" :src="member.avatar" :alt="member.name" />
                <strong :title="member.name">{{ member.name }}</strong>
              </div>
            </template>
            <p v-else class="muted empty-pool">暂无已签到可选成员</p>
          </div>
        </aside>

        <section class="panel checkin-panel">
          <div class="section-title pool-title">
            <div>
              <h2>签到区</h2>
              <p class="pool-subtitle">点击签到，签到后进入本场备选池</p>
            </div>
            <div class="pool-title-actions">
              <span class="tag gold">{{ room?.checkinMembers?.length || 0 }}/{{ room?.allMembers?.length || 0 }}</span>
            </div>
          </div>
          <div class="pool-grid checkin-grid">
            <button 
              v-for="member in room?.allMembers || []" 
              :key="member.id"
              class="card pool-tile checkin-tile"
              :class="{ 'checked-in': isCheckedIn(member.id) }"
              @click="toggleCheckin(member)"
            >
              <img class="avatar" :src="member.avatar" :alt="member.name" />
              <strong :title="member.name">{{ member.name }}</strong>
              <span class="tag checkin-state">
                {{ isCheckedIn(member.id) ? '已签到' : '签到' }}
              </span>
            </button>
          </div>
        </section>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { getRoom, checkin, checkout } from '../api.js'
import wsClient from '../websocket.js'

const showNotification = inject('showNotification')
const handleLogout = inject('handleLogout')

const room = ref(null)
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
const wsListeners = []

const statusText = computed(() => {
  const s = room.value?.status
  if (s === 'idle') return '等待开始'
  if (s === 'waiting') return '等待选人'
  if (s === 'picking') return '选人中'
  return '已结束'
})

const matchTypeText = computed(() => {
  const t = room.value?.matchType
  if (t === 'fun') return '娱乐赛'
  if (t === 'official') return '正赛'
  if (t === 'custom') return '自定义赛事'
  return '默认赛事'
})

const pickedCount = computed(() => {
  if (!room.value?.teams) return 0
  return room.value.teams.reduce((sum, t) => sum + (t.players?.length || 0), 0)
})

const totalPicks = computed(() => {
  if (!room.value) return 0
  return (room.value.teamCount || 0) * (room.value.teamSize || 0)
})

const pickOrderText = computed(() => {
  if (!room.value?.pickOrder?.length) return ''
  return room.value.pickOrder.map(i => room.value.teams[i]?.name?.[0] || '').join('')
})

const displayPickOrder = computed(() => {
  if (!room.value?.pickOrder?.length || !room.value?.teams) return []
  return room.value.pickOrder.map(i => room.value.teams[i] || {})
})

function isCheckedIn(memberId) {
  return room.value?.checkinMembers?.some(m => m.id === memberId) || false
}

async function loadRoom() {
  try {
    const res = await getRoom()
    if (res.success) {
      room.value = res.room
    }
  } catch (e) {
    console.error('Load room error:', e)
  }
}

async function toggleCheckin(member) {
  if (room.value?.status === 'idle') {
    showNotification('比赛尚未开始，请等待管理员开启', 'error')
    return
  }
  
  if (!user.value?.memberId) {
    showNotification('请先登录账号', 'error')
    return
  }
  
  const memberOfUser = member.id === user.value.memberId || 
    (room.value?.checkinMembers?.some(m => m.userId === user.value.id))
  
  if (!memberOfUser && member.userId) {
    showNotification('只能为自己签到', 'error')
    return
  }
  
  try {
    if (isCheckedIn(member.id)) {
      const res = await checkout()
      if (res.success) {
        showNotification('已取消签到', 'info')
      }
    } else {
      const res = await checkin()
      if (res.success) {
        showNotification('签到成功，已进入备选池', 'success')
      } else {
        showNotification(res.message || '签到失败', 'error')
      }
    }
  } catch (e) {
    showNotification(e.response?.data?.message || '操作失败', 'error')
  }
}

function setupWebSocket() {
  const wsUrl = (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + 
    window.location.hostname + ':3000'
  wsClient.connect(wsUrl)
  
  wsListeners.push(
    wsClient.on('room-update', (data) => {
      room.value = data.data
    })
  )
}

onMounted(() => {
  loadRoom()
  setupWebSocket()
})

onUnmounted(() => {
  wsListeners.forEach(unsub => unsub())
  wsClient.close()
})
</script>
