/**
 * 聊天路由模块
 *
 * 定义与前端对话相关的 API 端点。
 *
 * POST /api/chat - 核心对话接口
 *   请求体：{ message: string }
 *   响应：  SSE 流式数据，每个 chunk 格式为 { content: string, done: boolean }
 *
 * 数据流向：
 *   用户输入 → 路由层验证 → AI 服务生成流 → SSE 工具写入 → 客户端逐字渲染
 */

import type { Request, Response } from 'express'
import { Router } from 'express'
import { generateStreamResponse } from '../services/ai.js'
import { sseHeaders } from '../middleware/sse.js'
import { writeSSEEnd, writeSSEError } from '../utils/stream.js'
import type { ChatRequestBody } from '../types/index.js'

export const chatRouter = Router()

/**
 * POST /chat - 流式对话接口
 *
 * 接收用户消息，通过 SSE 协议逐字推送 AI 回复。
 * 整个响应生命周期：
 *   1. 验证输入参数
 *   2. 设置 SSE 响应头
 *   3. 调用 AI 服务获取 ReadableStream
 *   4. 逐块读取流并通过 res.write 推送给客户端
 *   5. 流结束后关闭连接
 *   6. 异常时推送错误信息并关闭连接
 */
chatRouter.post('/chat', sseHeaders, async (req: Request, res: Response) => {
  // ---------- 0. 禁用 TCP Nagle 算法，确保每个 chunk 即时发送不延迟 ----------
  req.socket.setNoDelay(true)

  // ---------- 1. 解析并验证请求参数 ----------
  const { message } = req.body as ChatRequestBody

  // 空消息校验：前端已做客户端校验，此处作为服务端兜底
  if (!message || !message.trim()) {
    // 注意：此时 SSE 头部已设置，需要按 SSE 格式返回错误
    writeSSEError(res, '消息不能为空')
    res.end()
    return
  }

  // ---------- 2. 调用 AI 服务获取流式响应 ----------
  const stream = generateStreamResponse(message)
  const reader = stream.getReader()

  try {
    // ---------- 3. 逐块读取流并推送给客户端 ----------
    while (true) {
      const { done, value } = await reader.read()

      // 数据块读取完毕，如果流在 done 时未自动关闭，则手动补发结束标记
      if (done) {
        writeSSEEnd(res)
        break
      }

      // 将读取到的 Uint8Array 直接写入响应流
      // AI 服务已经将数据编码为完整的 SSE 格式，此处只需要透传
      if (value) {
        res.write(value)
      }
    }
  } catch (err) {
    // ---------- 4. 异常处理 ----------
    // 捕获流读取过程中的任何异常（如网络中断、AI 服务故障等）
    console.error('[Chat] 流式响应中断:', err)

    // 尝试向客户端报告错误
    try {
      writeSSEError(res, '流式响应中断，请重试')
    } catch {
      // 此时连接可能已断开，忽略写入错误
    }
  } finally {
    // ---------- 5. 收尾：确保连接正确关闭 ----------
    res.end()
  }
})
