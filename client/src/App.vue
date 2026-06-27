<template>
  <div class="app-container">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">☁️</span>
          <h1>个人云盘</h1>
        </div>
        <div class="header-right">
          <div class="stats" v-if="stats">
            <span class="stat-item">📁 {{ stats.totalFiles }} 个文件</span>
            <span class="stat-item">💾 {{ stats.totalSizeFormatted }}</span>
          </div>
          <div class="ws-status" :class="{ connected: wsConnected }">
            <span class="status-dot"></span>
            {{ wsConnected ? '已连接' : '断开连接' }}
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="upload-section">
        <div 
          class="upload-area"
          :class="{ 'drag-over': isDragOver }"
          @dragover.prevent="handleDragOver"
          @dragleave="handleDragLeave"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <input 
            ref="fileInput"
            type="file" 
            multiple 
            @change="handleFileSelect"
            style="display: none"
          />
          <div class="upload-icon">⬆️</div>
          <p class="upload-text">点击或拖拽文件到此处上传</p>
          <p class="upload-hint">支持单文件最大 100MB</p>
        </div>

        <div class="upload-progress" v-if="uploadingFiles.length > 0">
          <div 
            v-for="file in uploadingFiles" 
            :key="file.id" 
            class="progress-item"
          >
            <div class="progress-info">
              <span class="progress-name">{{ file.name }}</span>
              <span class="progress-percent">{{ file.progress }}%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: file.progress + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="file-list-section">
        <div class="section-header">
          <h2>文件列表</h2>
          <button class="refresh-btn" @click="loadFiles" :disabled="loading">
            🔄 刷新
          </button>
        </div>

        <div v-if="loading" class="loading">
          <p>加载中...</p>
        </div>

        <div v-else-if="files.length === 0" class="empty-state">
          <div class="empty-icon">📂</div>
          <p>暂无文件，快去上传吧！</p>
        </div>

        <div v-else class="file-list">
          <div 
            v-for="file in files" 
            :key="file.name" 
            class="file-item"
          >
            <div class="file-icon">
              {{ getFileIcon(file.name) }}
            </div>
            <div class="file-info">
              <div class="file-name" :title="getOriginalName(file.name)">
                {{ getOriginalName(file.name) }}
              </div>
              <div class="file-meta">
                <span>{{ file.sizeFormatted }}</span>
                <span>·</span>
                <span>{{ formatDate(file.modifiedAt) }}</span>
              </div>
            </div>
            <div class="file-actions">
              <button 
                class="action-btn download" 
                @click="downloadFile(file)"
                title="下载"
              >
                ⬇️ 下载
              </button>
              <button 
                class="action-btn delete" 
                @click="confirmDelete(file)"
                title="删除"
              >
                🗑️ 删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>

    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="modal" @click.stop>
        <h3>确认删除</h3>
        <p>确定要删除文件 "{{ fileToDelete && getOriginalName(fileToDelete.name) }}" 吗？</p>
        <div class="modal-actions">
          <button class="btn cancel" @click="showDeleteConfirm = false">取消</button>
          <button class="btn danger" @click="doDelete">删除</button>
        </div>
      </div>
    </div>

    <footer class="footer">
      <p>个人云盘 · 基于 Node.js + Vite + WebSocket 构建</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getFileList, uploadFile, deleteFile, getDownloadUrl, getStats } from './api.js'
import wsClient from './websocket.js'

const files = ref([])
const stats = ref(null)
const loading = ref(false)
const isDragOver = ref(false)
const fileInput = ref(null)
const uploadingFiles = ref([])
const wsConnected = ref(false)
const notification = ref(null)
const showDeleteConfirm = ref(false)
const fileToDelete = ref(null)

let wsListeners = []

function showNotification(message, type = 'success') {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + ' 天前'
  
  return date.toLocaleDateString('zh-CN')
}

function getOriginalName(fileName) {
  return fileName.replace(/_\d+\./, '.')
}

function getFileIcon(fileName) {
  const ext = fileName.split('.').pop().toLowerCase()
  const icons = {
    pdf: '📄',
    doc: '📝', docx: '📝',
    xls: '📊', xlsx: '📊',
    ppt: '📽️', pptx: '📽️',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️',
    mp4: '🎬', avi: '🎬', mov: '🎬', mkv: '🎬',
    mp3: '🎵', wav: '🎵', flac: '🎵',
    zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦',
    js: '💻', ts: '💻', html: '💻', css: '💻', py: '💻', java: '💻',
    json: '📋', txt: '📋', md: '📋'
  }
  return icons[ext] || '📁'
}

async function loadFiles() {
  loading.value = true
  try {
    const res = await getFileList()
    if (res.success) {
      files.value = res.files
    }
    await loadStats()
  } catch (err) {
    console.error('Failed to load files:', err)
    showNotification('加载文件列表失败', 'error')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const res = await getStats()
    if (res.success) {
      stats.value = res.stats
    }
  } catch (err) {
    console.error('Failed to load stats:', err)
  }
}

function triggerFileInput() {
  fileInput.value.click()
}

function handleFileSelect(e) {
  const files = e.target.files
  if (files && files.length > 0) {
    uploadFiles(Array.from(files))
  }
  e.target.value = ''
}

function handleDragOver(e) {
  isDragOver.value = true
}

function handleDragLeave(e) {
  isDragOver.value = false
}

function handleDrop(e) {
  isDragOver.value = false
  const files = e.dataTransfer.files
  if (files && files.length > 0) {
    uploadFiles(Array.from(files))
  }
}

async function uploadFiles(fileList) {
  for (const file of fileList) {
    const uploadItem = {
      id: Date.now() + Math.random(),
      name: file.name,
      progress: 0
    }
    uploadingFiles.value.push(uploadItem)

    try {
      wsClient.send('file-upload-start', { fileName: file.name })
      
      const result = await uploadFile(file, (progress) => {
        uploadItem.progress = progress
      })

      if (result.success) {
        showNotification(`文件 "${file.name}" 上传成功`, 'success')
      }
    } catch (err) {
      console.error('Upload failed:', err)
      showNotification(`文件 "${file.name}" 上传失败`, 'error')
    } finally {
      const index = uploadingFiles.value.findIndex(f => f.id === uploadItem.id)
      if (index > -1) {
        uploadingFiles.value.splice(index, 1)
      }
    }
  }
  
  await loadFiles()
}

function downloadFile(file) {
  const url = getDownloadUrl(file.name)
  const a = document.createElement('a')
  a.href = url
  a.download = getOriginalName(file.name)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function confirmDelete(file) {
  fileToDelete.value = file
  showDeleteConfirm.value = true
}

async function doDelete() {
  if (!fileToDelete.value) return
  
  try {
    const res = await deleteFile(fileToDelete.value.name)
    if (res.success) {
      showNotification('文件删除成功', 'success')
      showDeleteConfirm.value = false
      fileToDelete.value = null
      await loadFiles()
    }
  } catch (err) {
    console.error('Delete failed:', err)
    showNotification('文件删除失败', 'error')
  }
}

function setupWebSocket() {
  wsClient.connect()
  
  wsListeners.push(
    wsClient.on('connected', () => {
      wsConnected.value = true
      showNotification('WebSocket 已连接', 'success')
    })
  )
  
  wsListeners.push(
    wsClient.on('disconnected', () => {
      wsConnected.value = false
    })
  )
  
  wsListeners.push(
    wsClient.on('file-uploaded', (data) => {
      showNotification(`新文件上传: ${getOriginalName(data.file.name)}`, 'info')
      loadFiles()
    })
  )
  
  wsListeners.push(
    wsClient.on('file-deleted', (data) => {
      showNotification(`文件已删除: ${getOriginalName(data.fileName)}`, 'info')
      loadFiles()
    })
  )
  
  wsListeners.push(
    wsClient.on('system', (data) => {
      console.log('System message:', data.message)
    })
  )
  
  wsListeners.push(
    wsClient.on('welcome', (data) => {
      console.log('Welcome:', data.message)
    })
  )
}

onMounted(() => {
  loadFiles()
  setupWebSocket()
})

onUnmounted(() => {
  wsListeners.forEach(unsubscribe => unsubscribe())
  wsClient.close()
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 28px;
}

.logo h1 {
  font-size: 20px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  opacity: 0.9;
}

.stat-item {
  white-space: nowrap;
}

.ws-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(255,255,255,0.2);
}

.ws-status.connected {
  background: rgba(72, 187, 120, 0.3);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff6b6b;
}

.ws-status.connected .status-dot {
  background: #48bb78;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 30px 20px;
}

.upload-section {
  margin-bottom: 30px;
}

.upload-area {
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: #667eea;
  background: #f7f8fc;
}

.upload-area.drag-over {
  transform: scale(1.01);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 18px;
  color: #2d3748;
  margin-bottom: 8px;
  font-weight: 500;
}

.upload-hint {
  font-size: 14px;
  color: #718096;
}

.upload-progress {
  margin-top: 20px;
}

.progress-item {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.progress-name {
  color: #2d3748;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 10px;
}

.progress-percent {
  color: #667eea;
  font-weight: 500;
}

.progress-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.file-list-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 18px;
  color: #2d3748;
}

.refresh-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #edf2f7;
  color: #4a5568;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.refresh-btn:hover {
  background: #e2e8f0;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #718096;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  transition: background 0.2s;
  border: 1px solid #edf2f7;
}

.file-item:hover {
  background: #f7fafc;
  border-color: #e2e8f0;
}

.file-icon {
  font-size: 32px;
  margin-right: 16px;
  width: 48px;
  text-align: center;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 15px;
  color: #2d3748;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 13px;
  color: #718096;
  display: flex;
  gap: 8px;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.action-btn.download {
  background: #e6fffa;
  color: #234e52;
}

.action-btn.download:hover {
  background: #b2f5ea;
}

.action-btn.delete {
  background: #fff5f5;
  color: #742a2a;
}

.action-btn.delete:hover {
  background: #fed7d7;
}

.notification {
  position: fixed;
  top: 80px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  z-index: 1000;
  animation: slideIn 0.3s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.notification.success {
  background: #48bb78;
}

.notification.error {
  background: #f56565;
}

.notification.info {
  background: #4299e1;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
}

.modal h3 {
  font-size: 18px;
  color: #2d3748;
  margin-bottom: 12px;
}

.modal p {
  color: #718096;
  margin-bottom: 20px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn.cancel {
  background: #edf2f7;
  color: #4a5568;
}

.btn.cancel:hover {
  background: #e2e8f0;
}

.btn.danger {
  background: #f56565;
  color: white;
}

.btn.danger:hover {
  background: #e53e3e;
}

.footer {
  text-align: center;
  padding: 20px;
  color: #a0aec0;
  font-size: 13px;
}

@media (max-width: 640px) {
  .header-content {
    flex-direction: column;
    height: auto;
    padding: 12px 0;
    gap: 10px;
  }
  
  .stats {
    display: none;
  }
  
  .file-item {
    flex-wrap: wrap;
  }
  
  .file-actions {
    width: 100%;
    margin-top: 10px;
    justify-content: flex-end;
  }
}
</style>
