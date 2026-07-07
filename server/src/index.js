const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const { setupWebSocket } = require('./websocket');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MEMBERS_FILE = path.join(DATA_DIR, 'members.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const CURRENT_ROOM_FILE = path.join(DATA_DIR, 'current-room.json');

function readJSON(file, defaultVal) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (e) {
    console.error('Read JSON error:', e);
  }
  return defaultVal;
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

let users = readJSON(USERS_FILE, []);
let members = readJSON(MEMBERS_FILE, []);
let sessions = readJSON(SESSIONS_FILE, {});
let currentRoom = readJSON(CURRENT_ROOM_FILE, {
  game: 'dota2',
  teamCount: 4,
  teamSize: 5,
  matchType: 'default',
  matchName: '',
  status: 'idle',
  teams: [],
  pool: [],
  checkin: [],
  pickOrder: [],
  currentPick: 0
});

const TEAM_COLORS = [
  { name: '火系', color: '#ef4b3f', surface: '#5a211e' },
  { name: '水系', color: '#27bff5', surface: '#153f55' },
  { name: '草系', color: '#44d16f', surface: '#194829' },
  { name: '电系', color: '#ffd84e', surface: '#574a18' },
  { name: '冰系', color: '#8de8ff', surface: '#1c4c59' },
  { name: '钢系', color: '#bac3cc', surface: '#3d454c' },
  { name: '龙系', color: '#9d68ff', surface: '#382761' },
  { name: '岩系', color: '#a87545', surface: '#493421' }
];

function saveAll() {
  writeJSON(USERS_FILE, users);
  writeJSON(MEMBERS_FILE, members);
  writeJSON(SESSIONS_FILE, sessions);
  writeJSON(CURRENT_ROOM_FILE, currentRoom);
}

function initMembers() {
  if (members.length === 0) {
    const defaultMembers = [
      { id: 'm1', name: '林仔', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linzai', available: true, game: 'dota2', role: '', rank: '' },
      { id: 'm2', name: '老鸡', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laoji', available: true, game: 'dota2', role: '', rank: '' },
      { id: 'm3', name: '蛋饼', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=danbing', available: true, game: 'dota2', role: '', rank: '' },
      { id: 'm4', name: '小刘', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoliu', available: true, game: 'dota2', role: '', rank: '' },
      { id: 'm5', name: '大狗', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dagou', available: true, game: 'dota2', role: '', rank: '' },
      { id: 'm6', name: 'ZSMJ', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zsmj', available: true, game: 'dota2', role: '', rank: '' },
      { id: 'm7', name: '核桃', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hetao', available: true, game: 'dota2', role: '', rank: '' },
      { id: 'm8', name: '雕哥', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diaoge', available: true, game: 'dota2', role: '', rank: '' },
      { id: 'm9', name: '大木老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=damu', available: true, game: 'dota2', role: '', rank: '' },
      { id: 'm10', name: '枫哥', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fengge', available: true, game: 'dota2', role: '', rank: '' },
      { id: 'm11', name: '宝哥', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=baoge', available: true, game: 'dota2', role: '', rank: '' },
      { id: 'm12', name: '谢彬', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiebin', available: true, game: 'dota2', role: '', rank: '' },
      { id: 'm13', name: 'Sylar', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sylar', available: true, game: 'dota2', role: '', rank: '' },
      { id: 'm14', name: '哈哈明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hahaming', available: true, game: 'dota2', role: '', rank: '' },
      { id: 'm15', name: 'AXX', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=axx', available: true, game: 'dota2', role: '', rank: '' },
      { id: 'm16', name: '霸气', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=baqi', available: true, game: 'dota2', role: '', rank: '' }
    ];
    members = defaultMembers;
    saveAll();
  }
}
initMembers();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  if (!token || !sessions[token]) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  req.user = sessions[token];
  req.token = token;
  next();
}

function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }
  next();
}

app.post('/api/auth/register', (req, res) => {
  const { username, password, nickname } = req.body;
  
  if (!username || !password) {
    return res.json({ success: false, message: '用户名和密码不能为空' });
  }
  
  if (users.find(u => u.username === username)) {
    return res.json({ success: false, message: '用户名已存在' });
  }
  
  const user = {
    id: 'u_' + Date.now(),
    username,
    password: hashPassword(password),
    nickname: nickname || username,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    isAdmin: username === 'admin',
    createdAt: new Date().toISOString()
  };
  
  users.push(user);
  
  const member = {
    id: 'member_' + user.id,
    name: user.nickname,
    avatar: user.avatar,
    userId: user.id,
    available: true,
    game: 'dota2',
    role: '',
    rank: ''
  };
  members.push(member);
  
  const token = generateToken();
  sessions[token] = { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, isAdmin: user.isAdmin, memberId: member.id };
  
  saveAll();
  
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      isAdmin: user.isAdmin
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username);
  if (!user || user.password !== hashPassword(password)) {
    return res.json({ success: false, message: '用户名或密码错误' });
  }
  
  const member = members.find(m => m.userId === user.id);
  
  const token = generateToken();
  sessions[token] = { 
    id: user.id, 
    username: user.username, 
    nickname: user.nickname, 
    avatar: user.avatar, 
    isAdmin: user.isAdmin,
    memberId: member ? member.id : null
  };
  
  saveAll();
  
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      isAdmin: user.isAdmin
    }
  });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  delete sessions[req.token];
  saveAll();
  res.json({ success: true });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.get('/api/room', (req, res) => {
  const roomData = {
    ...currentRoom,
    teams: currentRoom.teams.map((t, i) => ({
      ...t,
      ...TEAM_COLORS[i]
    })),
    poolMembers: currentRoom.pool.map(id => members.find(m => m.id === id)).filter(Boolean),
    checkinMembers: currentRoom.checkin.map(id => members.find(m => m.id === id)).filter(Boolean),
    allMembers: members
  };
  res.json({ success: true, room: roomData });
});

app.post('/api/room/checkin', authMiddleware, (req, res) => {
  const memberId = req.user.memberId;
  if (!memberId) {
    return res.json({ success: false, message: '用户没有关联成员' });
  }
  
  if (currentRoom.status === 'idle') {
    return res.json({ success: false, message: '比赛尚未开始' });
  }
  
  if (!currentRoom.checkin.includes(memberId)) {
    currentRoom.checkin.push(memberId);
    currentRoom.pool.push(memberId);
    saveAll();
    broadcastRoomUpdate();
  }
  
  res.json({ success: true, checkedIn: true });
});

app.post('/api/room/checkout', authMiddleware, (req, res) => {
  const memberId = req.user.memberId;
  if (!memberId) {
    return res.json({ success: false, message: '用户没有关联成员' });
  }
  
  const ci = currentRoom.checkin.indexOf(memberId);
  if (ci > -1) currentRoom.checkin.splice(ci, 1);
  const pi = currentRoom.pool.indexOf(memberId);
  if (pi > -1) currentRoom.pool.splice(pi, 1);
  
  saveAll();
  broadcastRoomUpdate();
  res.json({ success: true, checkedIn: false });
});

app.get('/api/admin/members', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ success: true, members });
});

app.post('/api/admin/members', authMiddleware, adminMiddleware, (req, res) => {
  const { name, avatar, game, role, rank, available } = req.body;
  const member = {
    id: 'm_' + Date.now(),
    name: name || '新成员',
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
    game: game || 'dota2',
    role: role || '',
    rank: rank || '',
    available: available !== false
  };
  members.push(member);
  saveAll();
  res.json({ success: true, member });
});

app.post('/api/admin/room/start', authMiddleware, adminMiddleware, (req, res) => {
  const { game, teamCount, teamSize, matchType, matchName } = req.body;
  
  currentRoom.game = game || 'dota2';
  currentRoom.teamCount = Math.min(8, Math.max(2, teamCount || 4));
  currentRoom.teamSize = Math.min(10, Math.max(1, teamSize || 5));
  currentRoom.matchType = matchType || 'default';
  currentRoom.matchName = matchName || '';
  currentRoom.status = 'waiting';
  currentRoom.teams = [];
  currentRoom.pool = [];
  currentRoom.checkin = [];
  currentRoom.pickOrder = [];
  currentRoom.currentPick = 0;
  
  for (let i = 0; i < currentRoom.teamCount; i++) {
    currentRoom.teams.push({
      name: TEAM_COLORS[i].name,
      captain: null,
      players: []
    });
  }
  
  saveAll();
  broadcastRoomUpdate();
  res.json({ success: true, room: currentRoom });
});

app.post('/api/admin/room/reset', authMiddleware, adminMiddleware, (req, res) => {
  currentRoom.status = 'idle';
  currentRoom.teams = [];
  currentRoom.pool = [];
  currentRoom.checkin = [];
  currentRoom.pickOrder = [];
  currentRoom.currentPick = 0;
  saveAll();
  broadcastRoomUpdate();
  res.json({ success: true });
});

app.post('/api/admin/room/pick', authMiddleware, adminMiddleware, (req, res) => {
  const { teamIndex, memberId, isCaptain } = req.body;
  
  if (currentRoom.status !== 'picking') {
    return res.json({ success: false, message: '不在选人阶段' });
  }
  
  const team = currentRoom.teams[teamIndex];
  if (!team) return res.json({ success: false, message: '队伍不存在' });
  
  const poolIdx = currentRoom.pool.indexOf(memberId);
  if (poolIdx === -1) return res.json({ success: false, message: '成员不在备选池' });
  
  if (isCaptain) {
    team.captain = memberId;
    if (!team.players.includes(memberId)) {
      team.players.push(memberId);
    }
  } else {
    if (team.players.length >= currentRoom.teamSize) {
      return res.json({ success: false, message: '队伍已满' });
    }
    team.players.push(memberId);
  }
  
  currentRoom.pool.splice(poolIdx, 1);
  currentRoom.currentPick++;
  
  saveAll();
  broadcastRoomUpdate();
  res.json({ success: true });
});

app.post('/api/admin/room/set-captain', authMiddleware, adminMiddleware, (req, res) => {
  const { teamIndex, memberId } = req.body;
  const team = currentRoom.teams[teamIndex];
  if (!team) return res.json({ success: false, message: '队伍不存在' });
  
  if (memberId) {
    team.captain = memberId;
    if (!team.players.includes(memberId)) {
      team.players.unshift(memberId);
      const idx = currentRoom.pool.indexOf(memberId);
      if (idx > -1) currentRoom.pool.splice(idx, 1);
    }
  } else {
    team.captain = null;
  }
  
  saveAll();
  broadcastRoomUpdate();
  res.json({ success: true });
});

app.post('/api/admin/room/start-pick', authMiddleware, adminMiddleware, (req, res) => {
  currentRoom.status = 'picking';
  
  const order = [];
  for (let round = 0; round < currentRoom.teamSize; round++) {
    if (round % 2 === 0) {
      for (let i = 0; i < currentRoom.teamCount; i++) {
        order.push(i);
      }
    } else {
      for (let i = currentRoom.teamCount - 1; i >= 0; i--) {
        order.push(i);
      }
    }
  }
  currentRoom.pickOrder = order;
  currentRoom.currentPick = 0;
  
  saveAll();
  broadcastRoomUpdate();
  res.json({ success: true });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const server = http.createServer(app);

const wss = setupWebSocket(server);

function broadcastRoomUpdate() {
  const roomData = {
    ...currentRoom,
    teams: currentRoom.teams.map((t, i) => ({
      ...t,
      ...TEAM_COLORS[i],
      players: t.players.map(id => members.find(m => m.id === id)).filter(Boolean),
      captain: t.captain ? members.find(m => m.id === t.captain) : null
    })),
    poolMembers: currentRoom.pool.map(id => members.find(m => m.id === id)).filter(Boolean),
    checkinMembers: currentRoom.checkin.map(id => members.find(m => m.id === id)).filter(Boolean)
  };
  
  const msg = JSON.stringify({ type: 'room-update', data: roomData });
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

server.listen(PORT, () => {
  console.log(`HTTP server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

module.exports = { app, server, wss, broadcastRoomUpdate };
