import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)

export function register(username, password, nickname) {
  return api.post('/auth/register', { username, password, nickname })
}

export function login(username, password) {
  return api.post('/auth/login', { username, password })
}

export function logout() {
  return api.post('/auth/logout')
}

export function getMe() {
  return api.get('/auth/me')
}

export function getRoom() {
  return api.get('/room')
}

export function checkin() {
  return api.post('/room/checkin')
}

export function checkout() {
  return api.post('/room/checkout')
}

export function getMembers() {
  return api.get('/admin/members')
}

export function addMember(data) {
  return api.post('/admin/members', data)
}

export function startRoom(data) {
  return api.post('/admin/room/start', data)
}

export function resetRoom() {
  return api.post('/admin/room/reset')
}

export function pickPlayer(teamIndex, memberId, isCaptain = false) {
  return api.post('/admin/room/pick', { teamIndex, memberId, isCaptain })
}

export function setCaptain(teamIndex, memberId) {
  return api.post('/admin/room/set-captain', { teamIndex, memberId })
}

export function startPick() {
  return api.post('/admin/room/start-pick')
}

export default api
