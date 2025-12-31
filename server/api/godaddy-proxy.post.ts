// GoDaddy API 代理 - 服务端处理 CORS 问题
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { method, endpoint, apiKey, apiSecret, data } = body

    const apiUrl = `https://api.godaddy.com/v1${endpoint}`

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `sso-key ${apiKey}:${apiSecret}`
    }

    const response = await $fetch.raw(apiUrl, {
      method: method as RequestInit['method'] || 'GET',
      headers,
      body: data ? JSON.stringify(data) : undefined
    })

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response._data
    }
  } catch (error: any) {
    return {
      ok: false,
      status: error.response?.status || 500,
      data: error.response?._data || error.message || '未知错误'
    }
  }
})
