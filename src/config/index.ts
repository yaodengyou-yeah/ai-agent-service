/**
 * 服务端全局配置模块
 *
 * 集中管理所有可配置项，优先从环境变量读取。
 * 默认对接 DeepSeek API（兼容 OpenAI 协议）。
 *
 * 环境变量说明见 .env.example。
 */

export const config = {
  /** 服务端口号 */
  port: Number(process.env.PORT) || 3000,

  /** 请求体大小限制 */
  bodyLimit: '1mb',

  /**
   * AI 模型配置
   *
   * 默认使用 DeepSeek 模型，只需设置 DEEPSEEK_API_KEY 即可使用。
   * 未配置 API Key 时自动降级为 Mock 回复。
   *
   * 也支持任何兼容 OpenAI 协议的服务商：
   *   - 通义千问：  AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1  AI_MODEL=qwen-plus
   *   - Moonshot：  AI_BASE_URL=https://api.moonshot.cn/v1  AI_MODEL=moonshot-v1-8k
   *   - 智谱 GLM：  AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4  AI_MODEL=glm-4-flash
   */
  ai: {
    /** DeepSeek API Key（必填，否则降级 Mock） */
    apiKey: 'sk-610921c4a96a44db99eadd20c434639a',

    /** API 地址（可替换为其他 OpenAI 兼容服务商） */
    baseUrl: 'https://api.deepseek.com',

    /** 模型名称：deepseek-chat（通用）| deepseek-reasoner（深度思考） */
    model: 'deepseek-v4-flash',

    /** 系统提示词 */
    systemPrompt: '',

    /** 单次回复最大 token 数 */
    maxTokens: 4096,

    /** 生成随机性 0~2，越高越有创意 */
    temperature: 0.7
  },

  /**
   * SSE Mock 降级参数
   *
   * 仅在未配置 DEEPSEEK_API_KEY 时生效，模拟打字效果。
   */
  sse: {
    chunkInterval: 60,
    chunkMinSize: 2,
    chunkMaxSize: 5
  }
}
