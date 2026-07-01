/**
 * 服务端全局类型定义
 *
 * 定义整个服务端共享的数据结构，确保各模块之间的类型一致性。
 * 当对接真实 LLM API 时，可在此扩展请求/响应相关的类型。
 */

/**
 * SSE 流式响应的单个数据块结构
 *
 * content   - 本次推送的文本片段
 * reasoning - 大模型思考过程文本片段（deepseek-reasoner 等推理模型）
 * done      - 是否已推送完毕，true 表示流结束
 * error     - 异常时携带的错误信息（可选）
 */
export interface StreamChunk {
  content?: string
  reasoning?: string
  done: boolean
  error?: string
}

/**
 * 客户端发送的聊天请求体结构
 *
 * message  - 用户输入的文本内容
 * history  - 可选的历史对话记录（用于多轮对话，后续扩展用）
 */
export interface ChatRequestBody {
  message: string
  history?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}
