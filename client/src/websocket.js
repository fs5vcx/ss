class WebSocketClient {
  constructor() {
    this.ws = null
    this.listeners = {}
    this.url = null
    this.reconnectTimer = null
    this.manualClose = false
  }

  connect(url) {
    if (this.ws) {
      this.close()
    }
    
    this.url = url || (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host
    this.manualClose = false
    this._connect()
  }

  _connect() {
    try {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this._emit('connected')
      }
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this._emit(data.type, data)
        } catch (e) {
          console.error('Parse message error:', e)
        }
      }
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this._emit('disconnected')
        if (!this.manualClose) {
          this._scheduleReconnect()
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this._emit('error', error)
      }
    } catch (e) {
      console.error('WebSocket connect error:', e)
      this._scheduleReconnect()
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (!this.manualClose) {
        this._connect()
      }
    }, 3000)
  }

  send(type, data = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }))
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
    
    return () => {
      const index = this.listeners[event].indexOf(callback)
      if (index > -1) {
        this.listeners[event].splice(index, 1)
      }
    }
  }

  _emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data))
    }
  }

  close() {
    this.manualClose = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

export default new WebSocketClient()
