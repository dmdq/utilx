<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Cookie编辑器</h1>
      <p class="text-gray-600 dark:text-gray-400">解析、编辑和生成Cookie字符串，支持各种Cookie格式</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- Cookie输入 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Cookie字符串</h2>
          <button @click="loadSample" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">示例</button>
        </div>
        <textarea
          v-model="cookieString"
          class="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm mb-4"
          placeholder="粘贴Cookie字符串 (name=value; name2=value2; ...)"
          @input="parseCookies"
        ></textarea>
        <button @click="parseCookies" class="w-full px-4 py-2 bg-blue-500 text-white rounded">解析Cookie</button>
      </div>

      <!-- Cookie列表 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">解析结果</h2>
          <button @click="addCookie" class="px-3 py-1 text-sm bg-green-500 text-white rounded">+ 添加</button>
        </div>

        <div class="space-y-3 max-h-80 overflow-y-auto">
          <div v-for="(cookie, index) in cookies" :key="index" class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div class="grid grid-cols-2 gap-2 mb-2">
              <input v-model="cookie.name" placeholder="名称" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
              <input v-model="cookie.value" placeholder="值" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
            </div>
            <div class="grid grid-cols-3 gap-2 mb-2">
              <input v-model="cookie.domain" placeholder="域名" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
              <input v-model="cookie.path" placeholder="路径" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
              <input v-model.number="cookie.maxAge" placeholder="Max-Age" type="number" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
            </div>
            <div class="flex gap-2">
              <label class="flex items-center gap-1 text-sm">
                <input type="checkbox" v-model="cookie.secure" class="rounded">
                <span>Secure</span>
              </label>
              <label class="flex items-center gap-1 text-sm">
                <input type="checkbox" v-model="cookie.httpOnly" class="rounded">
                <span>HttpOnly</span>
              </label>
              <label class="flex items-center gap-1 text-sm">
                <input type="checkbox" v-model="cookie.sameSite" class="rounded">
                <span>SameSite</span>
              </label>
              <button @click="removeCookie(index)" class="ml-auto text-red-500 text-sm">删除</button>
            </div>
          </div>
        </div>

        <div v-if="cookies.length === 0" class="text-center py-8 text-gray-400 text-sm">
          暂无Cookie，添加或解析Cookie字符串
        </div>
      </div>
    </div>

    <!-- 生成结果 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">生成的Cookie字符串</h2>
        <div class="flex gap-2">
          <button @click="format = 'header'" :class="['px-3 py-1 text-sm rounded', format === 'header' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']">请求头格式</button>
          <button @click="format = 'json'" :class="['px-3 py-1 text-sm rounded', format === 'json' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']">JSON格式</button>
          <button @click="copyResult" class="px-3 py-1 text-sm bg-green-500 text-white rounded" :disabled="!generatedCookie">复制</button>
        </div>
      </div>
      <textarea
        v-model="generatedCookie"
        readonly
        class="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
      ></textarea>
    </div>

    <!-- Cookie属性说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Cookie属性说明</h2>
      <div class="grid md:grid-cols-3 gap-4 text-sm">
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
          <h3 class="font-medium mb-2">Domain</h3>
          <p class="text-gray-600 dark:text-gray-400">指定Cookie的有效域名，子域名也会包含。</p>
        </div>
        <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded">
          <h3 class="font-medium mb-2">Path</h3>
          <p class="text-gray-600 dark:text-gray-400">指定Cookie的有效路径，只有该路径下的页面可以访问。</p>
        </div>
        <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded">
          <h3 class="font-medium mb-2">Secure</h3>
          <p class="text-gray-600 dark:text-gray-400">标记后只能通过HTTPS传输Cookie。</p>
        </div>
        <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded">
          <h3 class="font-medium mb-2">HttpOnly</h3>
          <p class="text-gray-600 dark:text-gray-400">禁止JavaScript访问Cookie，防止XSS攻击。</p>
        </div>
        <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded">
          <h3 class="font-medium mb-2">SameSite</h3>
          <p class="text-gray-600 dark:text-gray-400">防止CSRF攻击，控制Cookie在跨站请求中的发送。</p>
        </div>
        <div class="p-4 bg-gray-100 dark:bg-gray-700 rounded">
          <h3 class="font-medium mb-2">Max-Age</h3>
          <p class="text-gray-600 dark:text-gray-400">Cookie的有效期（秒），0或负数表示立即过期。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

useHead({
  title: 'Cookie编辑器 - 在线Cookie解析与生成',
  meta: [{ name: 'description', content: '在线Cookie编辑工具，解析、编辑和生成Cookie字符串，支持各种Cookie属性配置。' }],
  keywords: ['Cookie编辑', 'Cookie解析', 'Cookie生成', 'Set-Cookie', 'HTTP Cookie']
})

interface Cookie {
  name: string
  value: string
  domain?: string
  path?: string
  maxAge?: number
  secure?: boolean
  httpOnly?: boolean
  sameSite?: boolean
}

const cookieString = ref('')
const cookies = ref<Cookie[]>([])
const format = ref<'header' | 'json'>('header')

const generatedCookie = computed(() => {
  if (cookies.value.length === 0) return ''

  if (format.value === 'header') {
    return cookies.value.map(c => {
      let parts = [`${c.name}=${c.value}`]
      if (c.domain) parts.push(`Domain=${c.domain}`)
      if (c.path) parts.push(`Path=${c.path}`)
      if (c.maxAge !== undefined) parts.push(`Max-Age=${c.maxAge}`)
      if (c.secure) parts.push('Secure')
      if (c.httpOnly) parts.push('HttpOnly')
      if (c.sameSite) parts.push('SameSite=Lax')
      return parts.join('; ')
    }).join('\n')
  } else {
    return JSON.stringify(cookies.value, null, 2)
  }
})

watch(cookies, () => {
  // 触发computed重新计算
}, { deep: true })

function parseCookies() {
  if (!cookieString.value.trim()) {
    cookies.value = []
    return
  }

  // 处理多种Cookie格式
  const lines = cookieString.value.split('\n')
  const parsed: Cookie[] = []

  for (const line of lines) {
    const parts = line.split(';').map(p => p.trim())
    if (parts.length === 0) continue

    const [nameValue, ...attrs] = parts
    const [name, value] = nameValue.split('=')

    if (!name) continue

    const cookie: Cookie = {
      name: name.trim(),
      value: value || ''
    }

    for (const attr of attrs) {
      const [key, val] = attr.split('=')
      const attrKey = key.toLowerCase()

      switch (attrKey) {
        case 'domain':
          cookie.domain = val
          break
        case 'path':
          cookie.path = val
          break
        case 'max-age':
          cookie.maxAge = parseInt(val)
          break
        case 'secure':
          cookie.secure = true
          break
        case 'httponly':
          cookie.httpOnly = true
          break
        case 'samesite':
          cookie.sameSite = true
          break
      }
    }

    parsed.push(cookie)
  }

  cookies.value = parsed
}

function addCookie() {
  cookies.value.push({
    name: '',
    value: '',
    path: '/',
    secure: false,
    httpOnly: false
  })
}

function removeCookie(index: number) {
  cookies.value.splice(index, 1)
}

function loadSample() {
  cookieString.value = `sessionId=abc123; Domain=.example.com; Path=/; Secure; HttpOnly; SameSite=Lax
userId=456; Domain=.example.com; Path=/; Max-Age=3600`
  parseCookies()
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(generatedCookie.value)
    alert('已复制')
  } catch {}
}
</script>
