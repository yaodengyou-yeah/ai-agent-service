# ai-agent-service

AI 智能对话助手 - 后端服务

基于 Express.js + TypeScript 构建，对接 DeepSeek API（兼容 OpenAI 协议），通过 SSE（Server-Sent Events）协议实现流式对话推送。

## 项目结构

```
src/
├── index.ts          # 入口：组装 Express 应用、注册中间件和路由
├── config/
│   └── index.ts      # 配置：端口、AI 模型参数等集中管理
├── middleware/
│   └── sse.ts        # 中间件：设置 SSE 响应头（Content-Type、Cache-Control 等）
├── routes/
│   └── chat.ts       # 路由：POST /api/chat - 流式对话接口
├── services/
│   └── ai.ts         # 服务：AI 核心逻辑，封装 DeepSeek/OpenAI 流式调用
├── utils/
│   └── stream.ts     # 工具：SSE 数据块格式写入
└── types/
    └── index.ts      # 类型：StreamChunk、ChatRequestBody 等共享类型定义
```

## 核心特性

- **流式对话**：基于 SSE 协议，逐字推送 AI 回复，实现打字机效果
- **DeepSeek 集成**：通过 OpenAI SDK 调用 DeepSeek API（默认 `deepseek-v4-flash` 模型）
- **多服务商兼容**：支持任意 OpenAI 兼容协议服务商（通义千问、Moonshot、智谱 GLM 等），只需修改 `AI_BASE_URL` 和 `AI_MODEL` 环境变量
- **Mock 降级**：未配置 API Key 时自动降级为 Mock 回复，模拟打字效果，方便本地开发调试
- **推理模型支持**：支持 `deepseek-reasoner` 等推理模型的思考过程（`reasoning_content`）
- **TypeScript 全栈类型**：完整的类型定义，确保前后端类型一致性

## 快速开始

### 环境要求

- Node.js >= 18
- npm

### 安装依赖

```bash
npm install
```

### 配置环境变量

直接修改 `src/config/index.ts` 中的 `ai.apiKey`，或通过环境变量配置：

```bash
export DEEPSEEK_API_KEY="your-api-key"
```

可选配置：
- `PORT` - 服务端口号（默认 3000）
- `AI_BASE_URL` - API 地址（默认 `https://api.deepseek.com`）
- `AI_MODEL` - 模型名称（默认 `deepseek-v4-flash`）

### 开发运行

```bash
npm run dev
```

服务启动后访问 `http://localhost:3000`。

### 类型检查

```bash
npm run typecheck
```

## API 接口

### POST /api/chat

流式对话接口。

**请求体：**

```json
{
  "message": "你好，请介绍一下自己",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message | string | 是 | 用户输入的文本 |
| history | array | 否 | 历史对话记录（多轮对话扩展用） |

**响应格式（SSE 流）：**

```
data: {"content":"你好","done":false}
data: {"content":"！","done":false}
data: {"content":"","done":true}
```

每个 SSE chunk 的结构：

| 字段 | 类型 | 说明 |
|------|------|------|
| content | string | 本次推送的文本片段 |
| reasoning | string | 推理模型的思考过程片段（可选） |
| done | boolean | 是否推送完毕 |
| error | string | 异常错误信息（可选） |

## 架构设计

```
用户输入 → 路由层验证 → AI 服务生成流 → SSE 工具写入 → 客户端逐字渲染

数据流向：
  1. 前端发送 POST /api/chat
  2. 路由层解析并验证请求参数
  3. AI 服务通过 OpenAI SDK 调用 DeepSeek 流式 API
  4. 将 OpenAI 流格式转换为 SSE 格式的 ReadableStream
  5. 路由层逐块读取并透传到 HTTP 响应流
  6. 流结束后关闭连接
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 运行时 | Node.js |
| 框架 | Express 4.x |
| AI SDK | openai ^4.70 |
| 语言 | TypeScript 5.6 |
| 开发工具 | tsx（热执行） |
| 跨域 | cors |
