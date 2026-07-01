/**
 * 流式数据推送工具模块
 *
 * 将数据块按照 SSE 协议格式编码并写入响应流。
 * SSE 格式要求每行以 "data: " 开头，结尾用两个换行符分隔。
 */

import type { Response } from 'express'
import type { StreamChunk } from '../types/index.js'

/**
 * 将单个数据块按 SSE 格式写入 HTTP 响应流
 *
 * @param res   - Express Response 对象（已设置 SSE 头部）
 * @param chunk - 要推送的数据块
 *
 * SSE 协议格式示例：
 *   data: {"content":"你好","done":false}\n\n
 */
export function writeSSEChunk(res: Response, chunk: StreamChunk): void {
  res.write(`data: ${JSON.stringify(chunk)}\n\n`)
}

/**
 * 推送流结束标记
 *
 * 通知客户端数据已全部推送完毕，客户端收到 done:true 后应当关闭连接。
 */
export function writeSSEEnd(res: Response): void {
  writeSSEChunk(res, { content: '', done: true })
}

/**
 * 推送流错误信息
 *
 * 在流中断时向客户端报告错误原因，同时标记流结束。
 */
export function writeSSEError(res: Response, errorMessage: string): void {
  writeSSEChunk(res, { content: '', done: true, error: errorMessage })
}
