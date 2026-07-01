/**
 * AI 对话服务
 *
 * 对接 DeepSeek API（兼容 OpenAI 协议），通过 OpenAI SDK 发起流式调用。
 * 未配置 DEEPSEEK_API_KEY 时自动降级为 Mock 回复。
 *
 * 支持的模型：
 *   deepseek-chat     - 通用对话（默认）
 *   deepseek-reasoner - 深度思考（推理增强）
 *
 * 也支持任意 OpenAI 兼容服务商（通义千问 / Moonshot / 智谱GLM 等），
 * 只需修改环境变量 AI_BASE_URL 和 AI_MODEL。
 */

import OpenAI from 'openai'
import { config } from '../config/index.js'
import type { StreamChunk } from '../types/index.js'

/** OpenAI 客户端实例（单例，启动时初始化） */
let openai: OpenAI | null = null

if (config.ai.apiKey) {
  openai = new OpenAI({
    apiKey: config.ai.apiKey,
    baseURL: config.ai.baseUrl
  })
  console.log(`[AI] DeepSeek 已配置 → ${config.ai.baseUrl} (${config.ai.model})`)
} else {
  console.warn('[AI] 未配置 DEEPSEEK_API_KEY，将使用 Mock 回复')
}

/**
 * Mock 语料库 — 仅在未配置 API Key 时使用
 */
const mockResponses: string[] = [
  '你好！我是 AI 助手，很高兴为你服务。我可以帮助你解答问题、编写代码、分析数据等各种任务。',
  '这是一个很好的问题！让我来详细解释一下：流式响应(SSE)是一种服务器向客户端推送数据的技术，它允许服务器持续地向客户端发送数据，而不需要客户端反复轮询。',
  'Vue 3 使用了 Composition API，它提供了更灵活的代码组织方式。通过 setup 语法糖，我们可以写出更简洁、更易维护的组件代码。',
  'Node.js 的事件驱动和非阻塞 I/O 模型使其非常适合构建高性能的网络应用。结合 Express 框架，可以快速搭建 RESTful API 服务。'
]

/**
 * 生成流式文本响应
 *
 * - 有 API Key → 调用 DeepSeek / OpenAI 兼容 API 流式输出
 * - 无 API Key → Mock 模拟打字效果
 *
 * @param userMessage - 用户发送的消息
 * @returns ReadableStream<Uint8Array> - SSE 格式的字节流
 */
export function generateStreamResponse(userMessage: string): ReadableStream<Uint8Array> {
  if (openai) {
    return deepseekStream(userMessage)
  }
  return mockStream()
}

// ======================== DeepSeek / OpenAI 流式调用 ========================

/**
 * 通过 OpenAI SDK 调用兼容 API 并转换为 SSE 格式的 ReadableStream
 *
 * DeepSeek 的流式响应格式与 OpenAI 完全一致：
 *   每个 chunk 的 choices[0].delta.content 包含增量文本
 *   最后一个 chunk 的 choices[0].finish_reason 为 "stop"
 */
function deepseekStream(userMessage: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = await openai!.chat.completions.create({
          model: config.ai.model,
          messages: [
            { role: 'system', content: config.ai.systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: config.ai.maxTokens,
          temperature: config.ai.temperature,
          stream: true
        })

        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta as Record<string, unknown> | undefined

          // 思考过程（deepseek-reasoner 等推理模型返回 reasoning_content）
          const reasoning = delta?.reasoning_content as string | undefined
          if (reasoning) {
            const data: StreamChunk = { reasoning, done: false }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          }

          // 正式回复内容
          const content = delta?.content as string | undefined
          if (content) {
            const data: StreamChunk = { content, done: false }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          }
        }

        // 发送结束标记
        const end: StreamChunk = { content: '', done: true }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(end)}\n\n`))
        controller.close()
      } catch (err) {
        console.error('[AI] 模型调用失败:', err)
        const errorChunk: StreamChunk = {
          content: '',
          done: true,
          error: err instanceof Error ? err.message : 'AI 服务异常'
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`))
        controller.close()
      }
    }
  })
}

// ======================== Mock 降级 ========================

/**
 * 模拟打字效果的 Mock 流
 */
function mockStream(): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const responseIndex = Math.floor(Math.random() * mockResponses.length)
  const fullText = mockResponses[responseIndex]
  const chunkSize = config.sse.chunkMinSize +
    Math.floor(Math.random() * (config.sse.chunkMaxSize - config.sse.chunkMinSize + 1))
  let index = 0

  return new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        if (index >= fullText.length) {
          clearInterval(interval)
          controller.close()
          return
        }
        const chunk = fullText.slice(index, index + chunkSize)
        index += chunkSize
        const data: StreamChunk = { content: chunk, done: false }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }, config.sse.chunkInterval)
      return () => clearInterval(interval)
    }
  })
}
