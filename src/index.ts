/**
 * 服务端入口文件
 *
 * 负责初始化 Express 应用，注册中间件和路由，启动 HTTP 服务。
 *
 * 启动命令：
 *   npm run dev    - 开发模式（tsx 热执行）
 *   npm run start  - 生产模式
 *
 * 架构分层：
 *   index.ts            ← 入口：组装应用
 *   config/             ← 配置：集中管理常量
 *   middleware/         ← 中间件：SSE 头、错误处理等
 *   routes/             ← 路由：定义 API 端点
 *   services/           ← 服务：业务逻辑（AI 等）
 *   utils/              ← 工具：SSE 写入等通用函数
 *   types/              ← 类型：共享类型定义
 */

import express from 'express'
import cors from 'cors'
import { config } from './config/index.js'
import { chatRouter } from './routes/chat.js'

// ---------- 1. 创建 Express 应用实例 ----------
const app = express()

// ---------- 2. 注册全局中间件 ----------

// CORS：允许跨域请求（开发模式下前端 Vite 可能使用不同端口）
app.use(cors())

// JSON 解析：自动将请求体中的 JSON 字符串解析为对象挂载到 req.body
app.use(express.json({ limit: config.bodyLimit }))

// ---------- 3. 注册路由模块 ----------

// 对话相关接口统一挂载在 /api 路径下
// 当前支持：POST /api/chat - 流式对话
app.use('/api', chatRouter)

// ---------- 4. 启动 HTTP 服务 ----------
app.listen(config.port, () => {
  console.log(`[Server] AI Agent 服务已启动 → http://localhost:${config.port}`)
})
