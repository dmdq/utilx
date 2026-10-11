<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Server class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">数据库连接串解析器</h1>
          <p class="text-sm text-muted-foreground mt-1">解析 mysql / postgres / mongo / redis / jdbc 连接串，密码脱敏、键值表展示、反向生成</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴一条数据库连接串，自动识别标准 URL（postgres:// / mysql:// / mongodb:// 或 mongodb+srv:// / redis://）与 JDBC（jdbc:mysql:// / jdbc:postgresql:// / jdbc:oracle:thin:@）格式，拆解出类型、主机、端口、库名、用户名、密码与全部查询参数；密码默认脱敏显示，可点击查看；修改任意字段后实时反向生成新连接串，复制时可选择是否携带密码。解析全部在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入与解析 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Link2 class="w-5 h-5 mr-2 text-primary" /> 连接串输入
        </h2>
        <textarea
          v-model="rawInput"
          class="w-full h-32 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="postgres://user:pass@host:5432/db?sslmode=require&#10;jdbc:mysql://localhost:3306/test?useSSL=false&#10;jdbc:oracle:thin:@host:1521:sid&#10;redis://:pass@host:6379/0"
          spellcheck="false"
        ></textarea>

        <!-- 解析错误 -->
        <div
          v-if="parseError"
          class="flex items-start gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md p-2.5 text-xs leading-relaxed"
        >
          <AlertTriangle class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{{ parseError }}</span>
        </div>

        <!-- 示例 -->
        <div>
          <p class="text-xs text-muted-foreground mb-2">点击填入示例：</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="ex in samples"
              :key="ex"
              @click="rawInput = ex"
              class="px-2.5 py-1 bg-muted hover:bg-muted/80 text-muted-foreground rounded text-xs font-mono transition-all break-all"
            >{{ ex.length > 42 ? ex.slice(0, 42) + '…' : ex }}</button>
          </div>
        </div>

        <!-- 解析结果概览 -->
        <div v-if="parsedOk" class="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
          <span class="text-xs text-muted-foreground">识别结果：</span>
          <span :class="typeBadgeClass" class="text-xs px-2 py-0.5 rounded-full font-medium">{{ dbTypeLabel }}</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{{ formatLabel }}</span>
          <span class="text-xs text-muted-foreground ml-auto">{{ paramsRows.length }} 个查询参数</span>
        </div>
      </div>

      <!-- 右侧：字段与反向生成 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Settings2 class="w-5 h-5 mr-2 text-primary" /> 字段编辑与反向生成
        </h2>

        <template v-if="parsedOk">
          <!-- 字段表单 -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1">协议 / 类型</label>
              <input
                v-model="fields.scheme"
                type="text"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1">主机 host</label>
              <input
                v-model="fields.host"
                type="text"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1">端口 port</label>
              <input
                v-model="fields.port"
                type="text"
                :placeholder="defaultPortHint"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1">{{ databaseLabel }}</label>
              <input
                v-model="fields.database"
                type="text"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div v-if="fields.kind !== 'jdbc-oracle'">
              <label class="block text-xs font-medium text-muted-foreground mb-1">用户名 user</label>
              <input
                v-model="fields.user"
                type="text"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div v-if="fields.kind !== 'jdbc-oracle'">
              <label class="block text-xs font-medium text-muted-foreground mb-1">密码 password</label>
              <div class="relative">
                <input
                  v-model="fields.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="w-full px-3 py-2 pr-10 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  :title="showPassword ? '隐藏密码' : '显示密码'"
                >
                  <EyeOff v-if="showPassword" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- 查询参数键值表 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-medium text-muted-foreground">查询参数（可增删改）</label>
              <button
                @click="addParam"
                class="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus class="w-3.5 h-3.5" /> 添加参数
              </button>
            </div>
            <div v-if="paramsRows.length > 0" class="space-y-2">
              <div v-for="(p, pi) in paramsRows" :key="pi" class="flex items-center gap-2">
                <input
                  v-model="p.k"
                  type="text"
                  placeholder="键"
                  class="flex-1 px-2.5 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span class="text-muted-foreground text-xs">=</span>
                <input
                  v-model="p.v"
                  type="text"
                  placeholder="值"
                  class="flex-1 px-2.5 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  @click="removeParam(pi)"
                  class="text-muted-foreground hover:text-red-500 transition-colors"
                  title="删除此参数"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
            <p v-else class="text-xs text-muted-foreground">该连接串没有查询参数。</p>
          </div>

          <!-- 生成结果 -->
          <div class="pt-2 border-t border-border/50">
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-medium text-muted-foreground">生成的连接串</label>
              <button
                @click="copyGenerated"
                class="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5"
              >
                <Check v-if="copiedKey === 'gen'" class="w-3.5 h-3.5" />
                <Copy v-else class="w-3.5 h-3.5" />
                {{ copiedKey === 'gen' ? '已复制' : '一键复制' }}
              </button>
            </div>
            <pre class="w-full bg-muted/30 border border-border rounded-lg p-3 text-xs font-mono whitespace-pre-wrap break-all text-foreground">{{ generated || '填写主机后自动生成连接串' }}</pre>
            <label class="flex items-center gap-2 mt-2 cursor-pointer">
              <input v-model="copyWithPassword" type="checkbox" class="w-4 h-4 rounded border-border" />
              <span class="text-xs text-muted-foreground">复制时包含密码（不勾选则密码位留空）</span>
            </label>
          </div>
        </template>

        <div v-else class="py-12 text-center">
          <Server class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">粘贴连接串后，这里会显示各字段并支持反向编辑生成</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于数据库连接串解析器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            每种数据库、每种驱动都有自己的连接串写法：应用配置里常见 postgres://、mysql:// 这类标准 URL，老项目里则是 jdbc:mysql://、jdbc:oracle:thin:@ 这种 JDBC 格式。排查环境问题时经常需要快速确认某条连接串指向哪台主机、哪个库、带了哪些参数，本工具把这些格式统一拆解成结构化字段，所见即所得。
          </p>
          <h3 class="text-lg font-semibold text-foreground">支持的格式</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>标准 URL：postgres:// / postgresql:// / mysql:// / mongodb:// / mongodb+srv:// / redis://（含账号密码与查询参数）</li>
            <li>JDBC：jdbc:mysql://、jdbc:postgresql:// 等标准 URL 形态</li>
            <li>Oracle：jdbc:oracle:thin:@host:1521:sid 与 @//host:1521/service 两种形态</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">密码脱敏与反向生成</h3>
          <p>
            密码字段默认以密码框形式隐藏，点击小眼睛即可查看原文；修改主机、端口、库名、用户名或增删查询参数后，下方会实时重新生成连接串。复制时默认不携带密码（密码位留空），勾选后才会包含，避免把密码带进群聊或工单。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">连接串会被上传吗？</span>不会。解析与生成全部在浏览器本地完成，可以放心粘贴带真实密码的连接串。</li>
            <li><span class="text-foreground font-medium">为什么 JDBC 生成的结果不含账号密码？</span>JDBC URL 本身不承载账号密码，用户名密码由配置文件或连接池单独提供，工具按此约定省略这两项。</li>
            <li><span class="text-foreground font-medium">mongodb+srv 能解析吗？</span>能。mongodb+srv:// 会被识别为 MongoDB 类型，该协议本身不走自定义端口，端口栏留空即可。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'db-connection-parser'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Server, Link2, Settings2, Copy, Check, Eye, EyeOff,
  Plus, Trash2, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '数据库连接串解析器 - mysql/postgres/mongo/redis/jdbc 连接串拆解',
  description: '在线数据库连接串解析工具，支持 postgres、mysql、mongodb、redis 标准 URL 与 jdbc:mysql、jdbc:postgresql、jdbc:oracle 连接串，字段表格展示、密码脱敏、查询参数键值表、修改后反向生成，复制可选是否带密码，纯本地处理',
  keywords: '数据库连接串解析, jdbc url解析, dsn解析, postgres连接串, mongodb uri, redis连接串',
  author: 'Util工具箱',
  ogTitle: '数据库连接串解析器 - 有条工具',
  ogDescription: '五种数据库连接串一键拆解，密码脱敏、反向生成',
  ogUrl: 'https://www.util.cn/tools/db-connection-parser',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '数据库连接串解析器',
          url: 'https://www.util.cn/tools/db-connection-parser',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['五种连接串自动识别', '密码脱敏与查看', '查询参数键值表', '修改字段反向生成', '复制可选是否带密码']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发工具', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '数据库连接串解析器', item: 'https://www.util.cn/tools/db-connection-parser/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '连接串会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。解析与生成全部在浏览器本地完成，可以放心粘贴带真实密码的连接串。' }
            },
            {
              '@type': 'Question',
              name: '为什么 JDBC 生成的结果不含账号密码？',
              acceptedAnswer: { '@type': 'Answer', text: 'JDBC URL 本身不承载账号密码，用户名密码由配置文件或连接池单独提供，工具按此约定省略这两项。' }
            },
            {
              '@type': 'Question',
              name: 'mongodb+srv 能解析吗？',
              acceptedAnswer: { '@type': 'Answer', text: '能。mongodb+srv:// 会被识别为 MongoDB 类型，该协议本身不走自定义端口，端口栏留空即可。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'db-connection-parser')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const rawInput = ref('')
const fields = ref({ kind: '', scheme: '', host: '', port: '', user: '', password: '', database: '' })
const paramsRows = ref([])
const parsedOk = ref(false)
const parseError = ref('')
const showPassword = ref(false)
const copyWithPassword = ref(false)
const seoContentVisible = ref(true)
const copiedKey = ref('')
let copyTimer = null

const samples = [
  'postgres://admin:se1@db.host.com:5432/orders?sslmode=require',
  'jdbc:mysql://localhost:3306/test?useSSL=false&serverTimezone=UTC',
  'mongodb+srv://user:pass@cluster0.abcde.mongodb.net/shop?retryWrites=true',
  'redis://:mypassword@127.0.0.1:6379/0',
  'jdbc:oracle:thin:@db.internal:1521:orcl'
]

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 复制 ----------
const copyText = async (text, key) => {
  if (!text) return
  let ok = false
  try {
    await navigator.clipboard.writeText(text)
    ok = true
  } catch (e) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      ok = true
    } catch (e2) {
      ok = false
    }
  }
  if (ok) {
    copiedKey.value = key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedKey.value = ''
    }, 1500)
  }
}

const copyGenerated = () => {
  copyText(generateUrl(copyWithPassword.value), 'gen')
}

// ---------- 解析 ----------
const URL_RE = /^([a-z][a-z0-9+.-]*):\/\/(?:([^:@/\s]*)(?::([^@/\s]*))?@)?([^:/?#\s]+)(?::(\d+))?(?:\/([^?#\s]*))?(?:\?(.*))?$/i

const safeDecode = (s) => {
  try {
    return decodeURIComponent(s)
  } catch (e) {
    return s
  }
}

const parseQuery = (q) => {
  if (!q) return []
  return q.split('&')
    .filter(pair => pair !== '')
    .map(pair => {
      const i = pair.indexOf('=')
      if (i === -1) return { k: pair, v: '' }
      return { k: pair.slice(0, i), v: safeDecode(pair.slice(i + 1)) }
    })
}

const parseConnection = (raw) => {
  const s = raw.trim()
  if (!s) return null
  // JDBC 形态
  if (/^jdbc:/i.test(s)) {
    const inner = s.slice(5)
    // Oracle thin：@host:port:sid 或 @//host:port/service
    const om = inner.match(/^oracle:thin:@(?:\/\/)?([^:@/\s]+):(\d+)(?:[:/]([^?\s]+))?\s*(?:\?(.*))?$/i)
    if (om) {
      return {
        fields: { kind: 'jdbc-oracle', scheme: 'oracle:thin', host: om[1], port: om[2], user: '', password: '', database: om[3] || '' },
        params: parseQuery(om[4])
      }
    }
    const m = inner.match(URL_RE)
    if (m) {
      return {
        fields: { kind: 'jdbc', scheme: m[1].toLowerCase(), host: m[4], port: m[5] || '', user: '', password: '', database: m[6] ? safeDecode(m[6]) : '' },
        params: parseQuery(m[7])
      }
    }
    return null
  }
  // 标准 URL 形态
  const m = s.match(URL_RE)
  if (m) {
    const scheme = m[1].toLowerCase()
    let db = m[6] ? safeDecode(m[6]) : ''
    if ((scheme === 'redis' || scheme === 'rediss') && db === '') db = '0'
    return {
      fields: {
        kind: 'url',
        scheme,
        host: m[4],
        port: m[5] || '',
        user: m[2] ? safeDecode(m[2]) : '',
        password: m[3] ? safeDecode(m[3]) : '',
        database: db
      },
      params: parseQuery(m[7])
    }
  }
  return null
}

watch(rawInput, (v) => {
  const s = (v || '').trim()
  if (!s) {
    parsedOk.value = false
    parseError.value = ''
    return
  }
  const r = parseConnection(s)
  if (!r) {
    parsedOk.value = false
    parseError.value = '无法识别该连接串格式，请检查是否以 mysql://、postgres://、mongodb://、mongodb+srv://、redis:// 或 jdbc: 开头。'
    return
  }
  parsedOk.value = true
  parseError.value = ''
  fields.value = r.fields
  paramsRows.value = r.params.map(p => ({ k: p.k, v: p.v }))
})

// ---------- 类型徽章 ----------
const dbTypeLabel = computed(() => {
  const s = (fields.value.scheme || '').toLowerCase()
  if (s.startsWith('mongo')) return 'MongoDB'
  if (s === 'postgres' || s === 'postgresql') return 'PostgreSQL'
  if (s === 'mysql' || s === 'mariadb') return 'MySQL'
  if (s.indexOf('oracle') > -1) return 'Oracle'
  if (s === 'redis' || s === 'rediss') return 'Redis'
  if (s === 'sqlserver' || s === 'jtds:sqlserver') return 'SQL Server'
  return s ? s.toUpperCase() : '未知'
})

const typeBadgeClass = computed(() => {
  const map = {
    MySQL: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    PostgreSQL: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    MongoDB: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    Redis: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    Oracle: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    'SQL Server': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
  }
  return map[dbTypeLabel.value] || 'bg-muted text-muted-foreground'
})

const formatLabel = computed(() => {
  if (fields.value.kind === 'jdbc-oracle') return 'JDBC · Oracle thin'
  if (fields.value.kind === 'jdbc') return 'JDBC'
  return '标准 URL'
})

const databaseLabel = computed(() => {
  return fields.value.kind === 'jdbc-oracle' ? 'SID / Service' : '数据库 database'
})

const DEFAULT_PORTS = {
  mysql: '3306',
  mariadb: '3306',
  postgres: '5432',
  postgresql: '5432',
  mongodb: '27017',
  'mongodb+srv': '',
  redis: '6379',
  rediss: '6379',
  oracle: '1521',
  sqlserver: '1433'
}

const defaultPortHint = computed(() => {
  const d = DEFAULT_PORTS[(fields.value.scheme || '').toLowerCase()]
  return d ? '默认 ' + d : '端口'
})

// ---------- 反向生成 ----------
const generateUrl = (includePwd) => {
  const f = fields.value
  if (!f.scheme || !f.host) return ''
  const port = f.port ? ':' + f.port : ''
  const query = paramsRows.value
    .filter(p => p.k.trim() !== '')
    .map(p => p.k.trim() + '=' + p.v)
    .join('&')
  const q = query ? '?' + query : ''
  if (f.kind === 'jdbc-oracle') {
    return 'jdbc:oracle:thin:@' + f.host + port + (f.database ? ':' + f.database : '')
  }
  if (f.kind === 'jdbc') {
    return 'jdbc:' + f.scheme + '://' + f.host + port + (f.database ? '/' + f.database : '') + q
  }
  const pwd = includePwd ? f.password : ''
  const auth = (f.user || pwd) ? f.user + ':' + pwd + '@' : ''
  return f.scheme + '://' + auth + f.host + port + (f.database ? '/' + f.database : '') + q
}

// ---------- 参数行操作 ----------
const addParam = () => {
  paramsRows.value.push({ k: '', v: '' })
}

const removeParam = (i) => {
  paramsRows.value.splice(i, 1)
}
</script>
