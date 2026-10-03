<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Braces class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">JSON合并工具</h1>
          <p class="text-sm text-muted-foreground mt-1">浅合并 / 深合并 / 取交集，冲突键对比预览，纯本地计算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在左右两侧粘贴 JSON 对象，选择合并策略：浅合并、深合并（数组可选替换/拼接/去重拼接）或仅取交集键；冲突键即时对比预览，支持"后者覆盖前者"与"前者优先"两种优先级。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 两个输入框 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center">
          <Braces class="w-5 h-5 mr-2 text-primary" /> 输入 A（左）
        </h2>
        <textarea
          v-model="jsonA"
          class="w-full h-64 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="{&#10;  &quot;name&quot;: &quot;默认配置&quot;,&#10;  &quot;database&quot;: { &quot;host&quot;: &quot;localhost&quot;, &quot;port&quot;: 3306 }&#10;}"
          spellcheck="false"
        ></textarea>
        <p v-if="parseA.error && !parseA.empty" class="text-xs text-destructive mt-2 flex items-center gap-1.5">
          <FileWarning class="w-3.5 h-3.5 shrink-0" /> A：{{ parseA.error }}
        </p>
      </div>

      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center">
          <Braces class="w-5 h-5 mr-2 text-primary" /> 输入 B（右）
        </h2>
        <textarea
          v-model="jsonB"
          class="w-full h-64 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="{&#10;  &quot;database&quot;: { &quot;host&quot;: &quot;prod.example.com&quot;, &quot;pool&quot;: 10 },&#10;  &quot;debug&quot;: false&#10;}"
          spellcheck="false"
        ></textarea>
        <p v-if="parseB.error && !parseB.empty" class="text-xs text-destructive mt-2 flex items-center gap-1.5">
          <FileWarning class="w-3.5 h-3.5 shrink-0" /> B：{{ parseB.error }}
        </p>
      </div>
    </div>

    <!-- 合并策略 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4 flex items-center">
        <Settings2 class="w-5 h-5 mr-2 text-primary" /> 合并策略
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">策略</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="s in strategyOptions"
              :key="s.value"
              @click="strategy = s.value"
              :class="strategy === s.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all"
              :title="s.title"
            >
              {{ s.label }}
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">数组处理（深合并时生效）</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="a in arrayModeOptions"
              :key="a.value"
              @click="arrayMode = a.value"
              :disabled="strategy !== 'deep'"
              :class="arrayMode === a.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {{ a.label }}
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">冲突时优先级</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="p in priorityOptions"
              :key="p.value"
              @click="priority = p.value"
              :class="priority === p.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all"
            >
              {{ p.label }}
            </button>
          </div>
        </div>
      </div>
      <ul class="text-xs text-muted-foreground mt-4 space-y-1">
        <li>• <span class="text-foreground">浅合并</span>：只合并第一层键，嵌套对象整体覆盖</li>
        <li>• <span class="text-foreground">深合并</span>：对象递归逐键合并；数组按 替换 / 拼接 / 去重拼接 处理</li>
        <li>• <span class="text-foreground">仅取交集</span>：只保留两边都存在的键</li>
        <li>• <span class="text-foreground">冲突优先级</span>：两边同键不同值时，决定采用 A（前者）还是 B（后者）的值</li>
      </ul>
    </div>

    <!-- 冲突预览 + 合并结果 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 冲突预览 -->
      <div class="bg-card border border-border rounded-lg">
        <div class="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <Eye class="w-5 h-5 mr-2 text-primary" /> 冲突预览
          </h2>
          <span v-if="conflicts.length" class="text-xs text-muted-foreground">{{ conflicts.length }} 个键的值不一致</span>
        </div>
        <div class="p-6">
          <div v-if="conflicts.length" class="space-y-2 max-h-80 overflow-auto">
            <div v-for="c in visibleConflicts" :key="c.key" class="border border-border rounded-lg p-3">
              <p class="text-xs font-mono font-medium text-foreground mb-2 break-all">{{ c.key }}</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div class="bg-muted/50 rounded p-2 min-w-0">
                  <p class="text-[10px] text-muted-foreground mb-0.5">A 的值{{ priority === 'a' ? '（采用）' : '' }}</p>
                  <p class="text-xs font-mono text-foreground break-all">{{ c.aPreview }}</p>
                </div>
                <div class="bg-muted/50 rounded p-2 min-w-0">
                  <p class="text-[10px] text-muted-foreground mb-0.5">B 的值{{ priority === 'b' ? '（采用）' : '' }}</p>
                  <p class="text-xs font-mono text-foreground break-all">{{ c.bPreview }}</p>
                </div>
              </div>
            </div>
            <p v-if="conflicts.length > visibleConflicts.length" class="text-xs text-muted-foreground text-center pt-1">
              还有 {{ conflicts.length - visibleConflicts.length }} 个冲突未显示
            </p>
          </div>
          <div v-else-if="bothOk" class="py-12 text-center">
            <CheckCircle class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">两边没有同键不同值的冲突</p>
          </div>
          <div v-else class="py-12 text-center">
            <Eye class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">在左右两侧输入合法的 JSON 对象后，这里会显示冲突对比</p>
          </div>
        </div>
      </div>

      <!-- 合并结果 -->
      <div class="bg-card border border-border rounded-lg">
        <div class="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 合并结果
          </h2>
          <div class="flex items-center gap-2">
            <button
              @click="copyOutput"
              :disabled="!mergedText"
              class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制
            </button>
            <button
              @click="downloadOutput"
              :disabled="!mergedText"
              class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
            >
              <Download class="w-3.5 h-3.5" /> 下载
            </button>
          </div>
        </div>
        <div class="p-6">
          <textarea
            v-if="mergedText"
            :value="mergedText"
            readonly
            class="w-full h-80 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none resize-y"
            spellcheck="false"
          ></textarea>
          <div v-else-if="parseErrors.length" class="py-12 text-center">
            <FileWarning class="w-10 h-10 mx-auto mb-3 text-destructive" />
            <p class="text-sm text-destructive font-medium mb-1">JSON 解析失败</p>
            <p v-for="(e, i) in parseErrors" :key="i" class="text-xs text-muted-foreground">{{ e }}</p>
          </div>
          <div v-else class="py-12 text-center">
            <Braces class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">在两侧输入 JSON 对象后，这里会显示合并结果</p>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于JSON合并工具</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            合并 JSON 是接口联调与配置管理的高频操作：默认配置叠加环境覆盖、两份数据取并集或找交集。本工具提供浅合并、深合并（数组可选替换/拼接/去重拼接）与仅取交集三种策略，冲突键即时对比预览，并支持"后者覆盖前者"与"前者优先"两种优先级方向。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>配置合并：默认配置与环境差异配置叠加</li>
            <li>数据集合并：把两份对象数组合并并按需去重</li>
            <li>找出两份 JSON 的共同键（交集）做对比分析</li>
            <li>合并前预览冲突，避免悄悄覆盖关键字段</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">深合并和浅合并的区别？</span>浅合并只比较第一层键，嵌套对象会被整体覆盖；深合并会递归进入对象逐键合并。</li>
            <li><span class="text-foreground font-medium">数组默认怎么处理？</span>深合并时可选择 替换、拼接、去重拼接 三种方式；替换即用优先一侧的数组整体覆盖。</li>
            <li><span class="text-foreground font-medium">数据会上传吗？</span>不会。全部合并计算都在浏览器本地完成，数据不出设备。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'json-merger'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Braces, Copy, Download, Eye, CheckCircle, FileWarning,
  Settings2, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'JSON合并工具 - 在线JSON深浅合并/取交集',
  description: '在线JSON合并工具，支持浅合并、深合并（数组替换/拼接/去重拼接）与仅取交集键，冲突键对比预览，支持后者覆盖前者或前者优先，纯本地计算',
  keywords: 'json合并, json深合并, json取交集, json对比, json工具, 合并json对象',
  author: 'Util工具箱',
  ogTitle: 'JSON合并工具 - 有条工具',
  ogDescription: '浅合并 / 深合并 / 取交集，冲突键对比预览，纯本地计算',
  ogUrl: 'https://www.util.cn/tools/json-merger',
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
          name: 'JSON合并工具',
          url: 'https://www.util.cn/tools/json-merger',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['浅合并/深合并', '数组拼接/去重', '仅取交集键', '冲突预览对比', '双向优先级控制']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'JSON合并工具', item: 'https://www.util.cn/tools/json-merger/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '深合并和浅合并有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '浅合并只比较第一层键，嵌套对象会被整体覆盖；深合并会递归进入对象逐键合并，数组可另选替换、拼接或去重拼接。' }
            },
            {
              '@type': 'Question',
              name: 'JSON合并会上传数据吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，全部合并计算都在浏览器本地完成，数据不出设备。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'json-merger')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const jsonA = ref('')
const jsonB = ref('')
const strategy = ref('deep')
const arrayMode = ref('replace')
const priority = ref('b')
const seoContentVisible = ref(true)

const strategyOptions = [
  { value: 'shallow', label: '浅合并', title: '只合并第一层键' },
  { value: 'deep', label: '深合并', title: '对象递归合并' },
  { value: 'intersect', label: '仅取交集', title: '只保留两边都有的键' }
]

const arrayModeOptions = [
  { value: 'replace', label: '替换' },
  { value: 'concat', label: '拼接' },
  { value: 'unique', label: '去重拼接' }
]

const priorityOptions = [
  { value: 'b', label: '后者覆盖前者' },
  { value: 'a', label: '前者优先' }
]

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 解析 ----------
const isPlainObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

const parseSide = (t) => {
  const s = t.trim()
  if (!s) return { ok: false, empty: true, data: null, error: '' }
  try {
    const v = JSON.parse(s)
    if (!isPlainObj(v)) {
      return { ok: false, empty: false, data: null, error: '需要是 JSON 对象（{...}）' }
    }
    return { ok: true, empty: false, data: v, error: '' }
  } catch (e) {
    return { ok: false, empty: false, data: null, error: 'JSON 语法错误：' + e.message }
  }
}

const parseA = computed(() => parseSide(jsonA.value))
const parseB = computed(() => parseSide(jsonB.value))
const bothOk = computed(() => parseA.value.ok && parseB.value.ok)

const parseErrors = computed(() => {
  const list = []
  if (parseA.value.error && !parseA.value.empty) list.push('输入 A（左）：' + parseA.value.error)
  if (parseB.value.error && !parseB.value.empty) list.push('输入 B（右）：' + parseB.value.error)
  return list
})

// ---------- 合并 ----------
const deepEqual = (x, y) => {
  if (x === y) return true
  if (typeof x !== typeof y) return false
  if (x === null || y === null || typeof x !== 'object') return false
  if (Array.isArray(x) !== Array.isArray(y)) return false
  if (Array.isArray(x)) {
    return x.length === y.length && x.every((v, i) => deepEqual(v, y[i]))
  }
  const kx = Object.keys(x)
  const ky = Object.keys(y)
  return kx.length === ky.length && kx.every(k => k in y && deepEqual(x[k], y[k]))
}

const dedupeConcat = (a, b) => {
  const seen = new Set()
  const out = []
  for (const item of [...a, ...b]) {
    const key = item !== null && typeof item === 'object'
      ? 'o:' + JSON.stringify(item)
      : typeof item + ':' + String(item)
    if (!seen.has(key)) {
      seen.add(key)
      out.push(item)
    }
  }
  return out
}

const deepMerge = (a, b, mode, bWins) => {
  const result = {}
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    const inA = k in a
    const inB = k in b
    if (inA && inB) {
      const av = a[k]
      const bv = b[k]
      if (isPlainObj(av) && isPlainObj(bv)) {
        result[k] = deepMerge(av, bv, mode, bWins)
      } else if (Array.isArray(av) && Array.isArray(bv)) {
        if (mode === 'concat') result[k] = av.concat(bv)
        else if (mode === 'unique') result[k] = dedupeConcat(av, bv)
        else result[k] = bWins ? bv : av
      } else {
        result[k] = bWins ? bv : av
      }
    } else if (inA) {
      result[k] = a[k]
    } else {
      result[k] = b[k]
    }
  }
  return result
}

const intersectMerge = (a, b, bWins) => {
  const out = {}
  for (const k of Object.keys(a)) {
    if (k in b) out[k] = bWins ? b[k] : a[k]
  }
  return out
}

const mergedResult = computed(() => {
  if (!bothOk.value) return null
  const a = parseA.value.data
  const b = parseB.value.data
  const bWins = priority.value === 'b'
  try {
    if (strategy.value === 'shallow') {
      return bWins ? { ...a, ...b } : { ...b, ...a }
    }
    if (strategy.value === 'deep') {
      return deepMerge(a, b, arrayMode.value, bWins)
    }
    return intersectMerge(a, b, bWins)
  } catch (e) {
    return null
  }
})

const mergedText = computed(() => {
  if (!mergedResult.value) return ''
  try {
    return JSON.stringify(mergedResult.value, null, 2)
  } catch (e) {
    return ''
  }
})

// ---------- 冲突预览 ----------
const previewValue = (v) => {
  let s
  try {
    s = JSON.stringify(v) ?? String(v)
  } catch (e) {
    s = String(v)
  }
  return s.length > 60 ? s.slice(0, 60) + '…' : s
}

const conflicts = computed(() => {
  if (!bothOk.value) return []
  const a = parseA.value.data
  const b = parseB.value.data
  const list = []
  for (const k of Object.keys(a)) {
    if (k in b && !deepEqual(a[k], b[k])) {
      list.push({ key: k, aPreview: previewValue(a[k]), bPreview: previewValue(b[k]) })
    }
  }
  return list
})

const visibleConflicts = computed(() => conflicts.value.slice(0, 30))

// ---------- 交互 ----------
const copyOutput = async () => {
  if (!mergedText.value) return
  try {
    await navigator.clipboard.writeText(mergedText.value)
    alert('已复制到剪贴板')
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = mergedText.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const downloadOutput = () => {
  if (!mergedText.value) return
  const blob = new Blob([mergedText.value], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'merged.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
