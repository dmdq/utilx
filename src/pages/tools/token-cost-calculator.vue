<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Calculator class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Token计数与API成本计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">估算文本 Token 数，对比主流模型 API 价格与本地推理成本</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴文本即可按主流分词器经验规则估算 Token 数量，内置 GPT、Claude、DeepSeek、Qwen 等模型的价格表（可编辑），一键计算单次与批量调用成本，并与本地显卡推理的电费成本对比。全部计算在浏览器本地完成。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Type class="w-5 h-5 mr-2 text-primary" /> 输入文本
          </h2>
          <textarea
            v-model="inputText"
            class="w-full h-44 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴要估算的文本，例如一段 Prompt、一篇文章或一次对话的完整内容..."
            spellcheck="false"
          ></textarea>
          <div class="grid grid-cols-3 gap-3 mt-4 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-lg font-bold text-foreground">{{ formatNum(stats.chars) }}</p>
              <p class="text-xs text-muted-foreground">字符</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-lg font-bold text-foreground">{{ formatNum(stats.words) }}</p>
              <p class="text-xs text-muted-foreground">词数(英文)</p>
            </div>
            <div class="bg-primary/10 rounded-lg p-3">
              <p class="text-lg font-bold text-primary">{{ formatNum(stats.tokens) }}</p>
              <p class="text-xs text-muted-foreground">估算 Token</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            估算规则：中文/日文等 CJK 字符约 1 字 = 1 Token，英文及符号约 4 字符 = 1 Token，与 GPT/Claude 分词器的实际偏差通常在 ±15% 以内。
          </p>
        </div>

        <!-- 批量场景 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Layers class="w-5 h-5 mr-2 text-primary" /> 调用量
          </h2>
          <label class="block text-sm text-foreground mb-2">每天调用次数</label>
          <input
            v-model.number="dailyCalls"
            type="number"
            min="0"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <label class="block text-sm text-foreground mb-2 mt-4">每次输出 Token（估算）</label>
          <input
            v-model.number="outputTokens"
            type="number"
            min="0"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-3">月成本按 30 天计算：输入 Token = 单次估算 × 次数。</p>
        </div>
      </div>

      <!-- 右侧：成本对比 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <DollarSign class="w-5 h-5 mr-2 text-primary" /> API 成本对比
            </h2>
            <label class="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" v-model="editPrices" class="accent-primary" /> 编辑价格
            </label>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2.5 pl-6 pr-3 font-medium">模型</th>
                  <th class="py-2.5 pr-3 font-medium">输入价/1M</th>
                  <th class="py-2.5 pr-3 font-medium">输出价/1M</th>
                  <th class="py-2.5 pr-3 font-medium">单次成本</th>
                  <th class="py-2.5 pr-6 font-medium">月成本(30天)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border/50">
                <tr v-for="m in priceTable" :key="m.name">
                  <td class="py-2.5 pl-6 pr-3 text-foreground whitespace-nowrap">
                    {{ m.name }}
                    <span v-if="m.currency === '$'" class="text-[10px] text-muted-foreground">USD</span>
                  </td>
                  <td class="py-2.5 pr-3">
                    <template v-if="editPrices">
                      <input v-model.number="m.input" type="number" step="0.01" class="w-20 px-2 py-1 bg-background border border-input rounded text-xs" />
                    </template>
                    <template v-else><span class="text-muted-foreground">{{ m.currency }}{{ m.input }}</span></template>
                  </td>
                  <td class="py-2.5 pr-3">
                    <template v-if="editPrices">
                      <input v-model.number="m.output" type="number" step="0.01" class="w-20 px-2 py-1 bg-background border border-input rounded text-xs" />
                    </template>
                    <template v-else><span class="text-muted-foreground">{{ m.currency }}{{ m.output }}</span></template>
                  </td>
                  <td class="py-2.5 pr-3 font-medium text-foreground">{{ perCallCost(m) }}</td>
                  <td class="py-2.5 pr-6 font-medium" :class="cheapestClass(m)">{{ monthlyCost(m) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground px-6 py-3 border-t border-border/50">
            价格为公开参考价（2025-2026），各厂商随时调整且常有缓存折扣，请以官方定价页为准；绿色为当前参数下最便宜。
          </p>
        </div>

        <!-- 本地推理对比 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Cpu class="w-5 h-5 mr-2 text-primary" /> 本地推理成本（纯电费）
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label class="block text-xs text-muted-foreground mb-1.5">整机功耗 (W)</label>
              <input v-model.number="powerW" type="number" min="5" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm" />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1.5">电价 (元/度)</label>
              <input v-model.number="electricityPrice" type="number" step="0.01" min="0" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm" />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1.5">生成速度 (Token/s)</label>
              <input v-model.number="tokensPerSec" type="number" min="1" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm" />
            </div>
            <div class="bg-primary/10 rounded-lg p-3 text-center">
              <p class="text-lg font-bold text-primary">{{ localCostPer1M }}</p>
              <p class="text-xs text-muted-foreground">每 1M 输出 Token</p>
            </div>
          </div>
          <div class="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground leading-relaxed">
            <p class="mb-2"><span class="text-foreground font-medium">解读：</span>{{ localVerdict }}</p>
            <p>本地推理没有 API 账单，但产出速度取决于硬件：没有独显的轻薄本建议跑 3B 以下量化模型（可用
              <NuxtLink to="/tools/gpu-detector/" class="text-primary hover:underline">GPU检测工具</NuxtLink>
              评估）；需要高质量长文本时，小模型本地跑 + 云端 API 兜底的混合方式通常最划算。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button @click="toggleSeoContent" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="展开或收起说明">
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于Token计数与API成本计算</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>Token 是大语言模型处理文本的最小单位，API 按输入与输出的 Token 数分别计费。中文文本每个汉字约占 1 个 Token，英文约 4 个字符占 1 个 Token。估算 Token 数是控制 API 成本的第一步：系统提示词、历史对话、RAG 检索内容都会作为输入 Token 重复计费，长对话的累积成本远超直觉。</p>
          <h3 class="text-lg font-semibold text-foreground">降低 API 成本的常用手段</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>精简系统提示词，删除重复的few-shot示例</li>
            <li>历史对话做摘要压缩，而不是全量拼接</li>
            <li>能用小模型的任务（分类、抽取）不用大模型</li>
            <li>利用厂商的缓存定价（重复前缀大幅折扣）</li>
            <li>高频、格式固定的任务交给本地小模型</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">估算和官方返回的 usage 不一致？</span>分词器各有差异，本工具为经验估算（±15%），精确数字以 API 响应中的 usage 字段为准。</li>
            <li><span class="text-foreground font-medium">价格数据会过期吗？</span>会，所有价格可在表格内直接编辑，保存后按你的价格计算。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'token-cost-calculator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Calculator, Type, Layers, DollarSign, Cpu, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: 'Token计数与API成本计算器 - 大模型API价格对比',
  description: '在线估算文本Token数量，对比GPT/Claude/DeepSeek/Qwen等大模型API价格，计算单次与月度调用成本，并与本地显卡推理电费成本对比',
  keywords: 'token计算, token计数, api成本计算, 大模型价格, gpt4价格, claude价格, deepseek价格, llm成本',
  author: 'Util工具箱',
  ogTitle: 'Token计数与API成本计算器 - 有条工具',
  ogDescription: '估算文本Token数，对比主流大模型API价格与本地推理成本',
  ogUrl: 'https://www.util.cn/tools/token-cost-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', name: 'Token计数与API成本计算器', url: 'https://www.util.cn/tools/token-cost-calculator', applicationCategory: 'DeveloperApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }, featureList: ['Token数量估算', '多模型价格对比', '月度成本计算', '本地推理电费对比'] },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
          { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
          { '@type': 'ListItem', position: 3, name: 'Token计数与API成本计算器', item: 'https://www.util.cn/tools/token-cost-calculator/' }
        ] }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'token-cost-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

const STORAGE_KEY = 'token-cost-calculator-prices'
const inputText = ref('')
const dailyCalls = ref(100)
const outputTokens = ref(500)
const editPrices = ref(false)
const powerW = ref(300)
const electricityPrice = ref(0.55)
const tokensPerSec = ref(30)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 价格表：币种 $ 为美元，¥ 为人民币（参考价，可编辑）
const priceTable = ref([
  { name: 'GPT-4o', currency: '$', input: 2.5, output: 10 },
  { name: 'GPT-4o-mini', currency: '$', input: 0.15, output: 0.6 },
  { name: 'Claude Sonnet', currency: '$', input: 3, output: 15 },
  { name: 'Claude Haiku', currency: '$', input: 0.8, output: 4 },
  { name: 'DeepSeek-V3', currency: '¥', input: 2, output: 8 },
  { name: 'Qwen-Plus', currency: '¥', input: 0.8, output: 2 },
  { name: 'Qwen-Max', currency: '¥', input: 2.4, output: 9.6 },
  { name: '本地模型(开源)', currency: '¥', input: 0, output: 0 }
])

onMounted(() => {
  if (process.client) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const arr = JSON.parse(saved)
        if (Array.isArray(arr) && arr.length === priceTable.value.length) {
          priceTable.value = arr
        }
      }
    } catch (e) { /* 忽略 */ }
  }
})

watch(priceTable, (val) => {
  if (!process.client) return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(val)) } catch (e) { /* 忽略 */ }
}, { deep: true })

// ---------- Token 估算 ----------
const stats = computed(() => {
  const text = inputText.value || ''
  const chars = text.length
  let cjk = 0
  for (const ch of text) {
    if (/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(ch)) cjk++
  }
  const other = chars - cjk
  const words = (text.match(/[a-zA-Z]+(?:'[a-z]+)?/g) || []).length
  const tokens = Math.ceil(cjk * 1 + other / 4)
  return { chars, words, tokens, cjk, other }
})

const formatNum = (n) => (n || 0).toLocaleString('zh-CN')

const totalInputTokens = computed(() => stats.value.tokens * Math.max(0, dailyCalls.value || 0))
const totalOutputTokens = computed(() => Math.max(0, outputTokens.value || 0) * Math.max(0, dailyCalls.value || 0))

const perCallCost = (m) => {
  if (!m.input && !m.output) return '免费'
  const cost = stats.value.tokens / 1e6 * m.input + Math.max(0, outputTokens.value || 0) / 1e6 * m.output
  return m.currency + cost.toFixed(4)
}

const monthlyCost = (m) => {
  if (!m.input && !m.output) return '—'
  const cost = totalInputTokens.value / 1e6 * m.input + totalOutputTokens.value / 1e6 * m.output
  return m.currency + cost.toFixed(2)
}

const cheapestMonthly = computed(() => {
  let best = Infinity
  for (const m of priceTable.value) {
    if (!m.input && !m.output) continue
    const cost = totalInputTokens.value / 1e6 * m.input + totalOutputTokens.value / 1e6 * m.output
    if (cost < best) best = cost
  }
  return best
})

const cheapestClass = (m) => {
  if (!m.input && !m.output) return 'text-muted-foreground'
  const cost = totalInputTokens.value / 1e6 * m.input + totalOutputTokens.value / 1e6 * m.output
  return cost === cheapestMonthly.value ? 'text-green-500' : 'text-foreground'
}

// ---------- 本地推理 ----------
const localCostPer1M = computed(() => {
  const tps = Math.max(1, tokensPerSec.value || 1)
  const hours = 1e6 / tps / 3600
  const cost = powerW.value / 1000 * hours * electricityPrice.value
  return '¥' + cost.toFixed(2)
})

const cloudCheapest = computed(() => {
  const per1M = (m) => (stats.value.tokens * m.input + Math.max(0, outputTokens.value || 0) * m.output) / 1e6
  let best = Infinity
  for (const m of priceTable.value) {
    if (!m.input && !m.output) continue
    best = Math.min(best, per1M(m) * (m.currency === '$' ? 7.2 : 1))
  }
  return best
})

const localVerdict = computed(() => {
  if (cloudCheapest.value === Infinity) return '请在价格表中保留至少一个云端模型用于对比。'
  const local = parseFloat(localCostPer1M.value.slice(1))
  const ratio = cloudCheapest.value / Math.max(local, 0.0001)
  if (ratio > 20) return `当前参数下本地推理每百万 Token 电费约 ¥${local.toFixed(2)}，约为最便宜云端 API 的 1/${Math.round(ratio)}，高频使用场景本地化收益非常明显。`
  if (ratio > 3) return `本地电费成本约为最便宜云端 API 的 1/${Math.round(ratio)}，中低频调用可以考虑本地化。`
  return `本地电费优势不明显（约 1/${Math.max(1, Math.round(ratio))}），低频调用直接用 API 更省心，硬件折旧也需计入考虑。`
})
</script>
