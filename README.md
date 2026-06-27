# 个人云盘

基于 Node.js + Vite + Vue 3 + WebSocket 构建的个人云盘系统。

## 功能特性

- 📁 文件管理：上传、下载、删除、列表展示
- 📤 拖拽上传：支持拖拽文件到上传区域
- 📊 实时统计：文件数量、总大小统计
- 🔌 WebSocket 实时通知：文件上传/删除实时同步
- 📱 响应式设计：支持桌面端和移动端
- 🎨 现代化 UI：美观的界面设计

## 技术栈

### 后端
- Node.js
- Express
- Multer (文件上传)
- ws (WebSocket)

### 前端
- Vue 3 (Composition API)
- Vite
- 原生 CSS (无框架依赖)

## 项目结构

```
.
├── server/              # 后端服务
│   ├── src/
│   │   ├── index.js     # 服务入口
│   │   ├── websocket.js # WebSocket 管理
│   │   └── routes/
│   │       └── files.js # 文件路由
│   ├── uploads/         # 上传文件目录
│   └── package.json
├── client/              # 前端项目
│   ├── src/
│   │   ├── App.vue      # 主组件
│   │   ├── api.js       # API 封装
│   │   ├── websocket.js # WebSocket 客户端
│   │   ├── main.js      # 入口文件
│   │   └── style.css    # 全局样式
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── package.json         # 根配置
```

## 快速开始

### 安装依赖

```bash
# 方式一：根目录一键安装
npm run install:all

# 方式二：分别安装
cd server && npm install
cd ../client && npm install
```

### 开发模式

```bash
# 启动后端服务 (端口 3000)
npm run dev:server

# 启动前端开发服务 (端口 5173)
npm run dev:client
```

然后访问 http://localhost:5173

### 生产构建

```bash
# 构建前端
npm run build:client

# 启动服务
npm start
```

## API 接口

### 文件列表
```
GET /api/files
```

### 上传文件
```
POST /api/files/upload
Content-Type: multipart/form-data
```

### 下载文件
```
GET /api/files/download/:filename
```

### 删除文件
```
DELETE /api/files/:filename
```

### 统计信息
```
GET /api/files/stats
```

### 健康检查
```
GET /api/health
```

## WebSocket 事件

### 服务端 -> 客户端
- `welcome` - 连接欢迎消息
- `system` - 系统消息
- `file-uploaded` - 文件上传通知
- `file-deleted` - 文件删除通知
- `pong` - 心跳响应

### 客户端 -> 服务端
- `ping` - 心跳检测
- `file-upload-start` - 开始上传通知

## WebSocket Secure (WSS) 支持

部署到 HTTPS 环境时，WebSocket 连接会自动使用 `wss://` 协议。

在生产环境使用 Nginx 反向代理时，需要配置 WebSocket 支持：

```nginx
location /ws {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

## License

MIT
