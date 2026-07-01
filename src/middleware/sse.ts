/**
 * SSE 响应头中间件
 *
 * 在路由处理前统一设置 SSE 协议所需的 HTTP 响应头。
 * SSE 协议要求：
 *   - Content-Type 必须为 text/event-stream
 *   - Cache-Control 设为 no-cache 避免代理缓存
 *   - Connection 设为 keep-alive 保持长连接
 *   - X-Accel-Buffering 设为 no 禁用 Nginx 缓冲（部署时生效）
 */

import type { Request, Response, NextFunction } from 'express'

/**
 * 为响应设置 SSE（Server-Sent Events）所需的 HTTP 头
 *
 * 调用后 res 即进入流式模式，后续可通过 res.write() 持续推送数据。
 * 注意：调用此中间件后不应再使用 res.json() 等方法。
 */
export function sseHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  })
  // 立即刷新响应头，确保客户端尽快收到 SSE 头部，避免首字节延迟
  res.flushHeaders()
  next()
}
