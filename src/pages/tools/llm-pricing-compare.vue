<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <DollarSign class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">大模型API价格对比</h1>
          <p class="text-sm text-muted-foreground mt-1">主流大模型输入/输出 token 单价、上下文窗口一览与成本估算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        内置 18 个主流大模型的公开 API 价目表（按每百万 token 计价），支持按输入价、输出价、综合成本与上下文窗口排序，按国产/海外/免费额度筛选，并用月用量成本估算器直观对比各模型月账单，帮助快速选型。纯本地计算，数据不上传。
      </p>
    </div>

    <!-- 醒目提示 -->
    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6 flex items-start gap-3">
      <AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <p class="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
        数据为整理参考（价格量级取自 2025 年公开报价，表内标注更新日期），各厂商调价频繁且有缓存价、阶梯价、批量价差异，<strong>以官方最新报价为准</strong>。
      </p>
    </div>

    <!-- 筛选与排序 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-6">
      <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div class="flex items-center gap-2">
          <ArrowUpDown class="w-4 h-4 text-muted-foreground" />
          <span class="text-sm font-medium text-foreground">排序</span>
          <select
            v-model="sortKey"
            class="px-2 py-1.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="input">按输入价</option>
            <option value="output">按输出价</option>
            <option value="blend">按综合成本</option>
            <option value="context">按上下文窗口</option>
            <option value="name">按名称</option>
          </select>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <Filter class="w-4 h-4 text-muted-foreground" />
          <button
            @click="toggleFilter('all')"
            :class="filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          >全部</button>
          <button
            @click="toggleFilter('cn')"
            :class="filter === 'cn' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          >国产模型</button>
          <button
            @click="toggleFilter('oversea')"
            :class="filter === 'oversea' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          >海外模型</button>
          <button
            @click="toggleFilter('free')"
            :class="filter === 'free' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          >有免费额度</button>
        </div>
        <span class="text-xs text-muted-foreground ml-auto">共 {{ filteredModels.length }} 个模型</span>
      </div>
    </div>

    <!-- 价格表 -->
    <div class="bg-card border border-border rounded-lg mb-8 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-muted/50 text-left text-xs text-muted-foreground">
              <th class="px-4 py-3 font-medium">模型</th>
              <th class="px-4 py-3 font-medium">厂商</th>
              <th class="px-4 py-3 font-medium text-right">输入 $/1M</th>
              <th class="px-4 py-3 font-medium text-right">输出 $/1M</th>
              <th class="px-4 py-3 font-medium text-right">上下文</th>
              <th class="px-4 py-3 font-medium text-center">多模态</th>
              <th class="px-4 py-3 font-medium">免费额度</th>
              <th class="px-4 py-3 font-medium text-center">产地</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in filteredModels"
              :key="m.id"
              class="border-t border-border/50 hover:bg-accent/50 transition-colors"
            >
              <td class="px-4 py-3 font-medium text-foreground whitespace-nowrap">{{ m.name }}</td>
              <td class="px-4 py-3 text-muted-foreground whitespace-nowrap">{{ m.vendor }}</td>
              <td class="px-4 py-3 text-right font-mono text-foreground">{{ m.inputPrice.toFixed(2) }}</td>
              <td class="px-4 py-3 text-right font-mono text-foreground">{{ m.outputPrice.toFixed(2) }}</td>
              <td class="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">{{ m.contextLabel }}</td>
              <td class="px-4 py-3 text-center">
                <Check v-if="m.multimodal" class="w-4 h-4 inline text-green-600 dark:text-green-400" />
                <X v-else class="w-4 h-4 inline text-muted-foreground/50" />
              </td>
              <td class="px-4 py-3 text-xs text-muted-foreground">{{ m.freeTier || '—' }}</td>
              <td class="px-4 py-3 text-center">
                <span
                  :class="m.cn ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'"
                  class="inline-flex px-2 py-0.5 rounded-full text-xs"
                >{{ m.cn ? '国产' : '海外' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="px-4 py-3 text-xs text-muted-foreground border-t border-border">
        表内价格单位为美元/百万 tokens，更新日期：{{ PRICE_UPDATED_AT }}（2025 公开价，随时变动，以官方最新报价为准）。
      </p>
    </div>

    <!-- 成本估算器 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12">
      <h2 class="text-lg font-semibold text-foreground flex items-center mb-4">
        <BarChart3 class="w-5 h-5 mr-2 text-primary" /> 月成本估算器
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">每月输入 tokens（百万）</label>
          <input
            v-model.number="monthlyInputM"
            type="number"
            min="0"
            step="0.5"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">每月输出 tokens（百万）</label>
          <input
            v-model.number="monthlyOutputM"
            type="number"
            min="0"
            step="0.5"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div v-if="monthlyInputM > 0 || monthlyOutputM > 0" class="space-y-2">
        <p class="text-sm text-muted-foreground mb-3">
          估算口径：<code class="font-mono text-xs">月成本 = 输入M × 输入价 + 输出M × 输出价</code>，最低成本模型高亮。
        </p>
        <div
          v-for="row in costRows"
          :key="row.model.id"
          class="flex items-center gap-3 text-sm"
        >
          <span class="w-40 flex-shrink-0 truncate" :class="row.isCheapest ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-foreground'">{{ row.model.name }}</span>
          <div class="flex-1 bg-muted rounded-full h-5 overflow-hidden">
            <div
              :class="row.isCheapest ? 'bg-green-500/70' : 'bg-primary/50'"
              class="h-full rounded-full transition-all"
              :style="{ width: row.barPercent + '%' }"
            ></div>
          </div>
          <span class="w-24 text-right font-mono flex-shrink-0" :class="row.isCheapest ? 'text-green-600 dark:text-green-400' : 'text-foreground'">${{ row.cost.toFixed(2) }}</span>
        </div>
      </div>
      <div v-else class="py-8 text-center text-sm text-muted-foreground">
        输入每月预计使用的输入/输出 token 量（单位：百万），即可对比各模型月账单
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>如何按 API 价格给大模型选型</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            大模型 API 通常按 token 计费，输入与输出单价不同（输出普遍是输入的 3~5 倍），选型时不能只看输入价。
            典型聊天场景输入输出比约 3:1，长文档摘要场景则输入占绝对大头。用本页的「月成本估算器」按自己的真实用量配比测算，比单看挂牌价更可靠。
          </p>
          <h3 class="text-lg font-semibold text-foreground">影响实际账单的其他因素</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>缓存命中折扣：多家厂商对重复前缀输入提供 5 折甚至更低的缓存价；</li>
            <li>批量与 Batch API：离线任务用批处理接口通常半价；</li>
            <li>上下文超长附加费：超过阈值（如 128K/200K）单价可能翻倍；</li>
            <li>免费额度与限时优惠：国产模型价格战频繁，实际报价波动快。</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">国产模型与海外模型的价格差异</h3>
          <p>
            以 2025 年公开价看，国产模型（DeepSeek、通义千问、GLM、Kimi 等）单位 token 价格普遍比 GPT/Claude 同级低一个数量级，
            适合高并发、大流量与成本敏感业务；海外旗舰模型在复杂推理、长上下文一致性与生态成熟度上仍有优势。合理做法是分层路由：日常任务走低价模型，关键任务再升级。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">表里的价格准吗？</span>为 2025 年公开价的整理参考值并标注更新日期，模型改名、调价、下线都很频繁，下单前务必核对官网价目页。</li>
            <li><span class="text-foreground font-medium">一个 token 大约是多少字？</span>中文约 1 字 1~1.5 token，英文约 4 个字符 1 token，可用站内 Token 计算器精确估算。</li>
            <li><span class="text-foreground font-medium">开源自部署更便宜吗？</span>低并发时按量 API 更省；长期高负载且团队有 GPU 运维能力时，开源模型自部署的边际成本可能更低，可结合显存计算器评估。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'llm-pricing-compare'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  DollarSign, AlertTriangle, ArrowUpDown, Filter, Check, X,
  BarChart3, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '大模型API价格对比 - Token单价与月成本估算 | 有条工具',
  description: '在线大模型API价格对比表，收录GPT/Claude/Gemini/DeepSeek/通义千问/GLM/Kimi等18个主流模型输入输出单价与上下文窗口，支持排序筛选与月度token成本估算器，选型参考',
  keywords: '大模型API价格,token单价对比,模型选型成本,GPT价格,Claude价格,DeepSeek价格,便宜大模型,llm计费',
  author: 'Util工具箱',
  ogTitle: '大模型API价格对比 - 有条工具',
  ogDescription: '18个主流大模型输入/输出单价一览，支持排序筛选与月成本估算',
  ogUrl: 'https://www.util.cn/tools/llm-pricing-compare',
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
          name: '大模型API价格对比',
          url: 'https://www.util.cn/tools/llm-pricing-compare',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['18个主流模型价目表', '输入/输出/综合/上下文排序', '国产海外免费筛选', '月token成本估算器', '条形图对比']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '大模型API价格对比', item: 'https://www.util.cn/tools/llm-pricing-compare/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '表里的价格准吗？',
              acceptedAnswer: { '@type': 'Answer', text: '为2025年公开价的整理参考值并标注更新日期，模型调价频繁，下单前请以官网价目页为准。' }
            },
            {
              '@type': 'Question',
              name: '一个token大约是多少字？',
              acceptedAnswer: { '@type': 'Answer', text: '中文约1字1~1.5个token，英文约4个字符1个token，可用站内Token计算器精确估算。' }
            },
            {
              '@type': 'Question',
              name: '开源模型自部署更便宜吗？',
              acceptedAnswer: { '@type': 'Answer', text: '低并发时按量API更省；长期高负载且具备GPU运维能力时，自部署边际成本可能更低。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'llm-pricing-compare')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 静态价目表 ----------
// 单位：美元 / 1M tokens；价格量级取自 2025 公开价，仅整理参考，以官方最新报价为准
// --- pure-test-models-start ---
const PRICE_UPDATED_AT = '2025-06（2025 公开价，随时变动）'

const models = [
  { id: 'gpt-4o', name: 'GPT-4o', vendor: 'OpenAI', inputPrice: 2.50, outputPrice: 10.00, context: 128000, contextLabel: '128K', multimodal: true, freeTier: '', cn: false },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', vendor: 'OpenAI', inputPrice: 0.15, outputPrice: 0.60, context: 128000, contextLabel: '128K', multimodal: true, freeTier: '', cn: false },
  { id: 'claude-35-sonnet', name: 'Claude 3.5 Sonnet', vendor: 'Anthropic', inputPrice: 3.00, outputPrice: 15.00, context: 200000, contextLabel: '200K', multimodal: true, freeTier: '', cn: false },
  { id: 'claude-35-haiku', name: 'Claude 3.5 Haiku', vendor: 'Anthropic', inputPrice: 0.80, outputPrice: 4.00, context: 200000, contextLabel: '200K', multimodal: true, freeTier: '', cn: false },
  { id: 'gemini-15-pro', name: 'Gemini 1.5 Pro', vendor: 'Google', inputPrice: 1.25, outputPrice: 10.00, context: 2000000, contextLabel: '2M', multimodal: true, freeTier: '', cn: false },
  { id: 'gemini-15-flash', name: 'Gemini 1.5 Flash', vendor: 'Google', inputPrice: 0.075, outputPrice: 0.30, context: 1000000, contextLabel: '1M', multimodal: true, freeTier: 'AI Studio 有免费层', cn: false },
  { id: 'grok-2', name: 'Grok-2', vendor: 'xAI', inputPrice: 2.00, outputPrice: 10.00, context: 128000, contextLabel: '128K', multimodal: true, freeTier: '', cn: false },
  { id: 'mistral-large', name: 'Mistral Large', vendor: 'Mistral', inputPrice: 2.00, outputPrice: 6.00, context: 128000, contextLabel: '128K', multimodal: false, freeTier: '', cn: false },
  { id: 'llama-31-70b', name: 'Llama 3.1 70B', vendor: 'Meta(托管)', inputPrice: 0.60, outputPrice: 0.60, context: 128000, contextLabel: '128K', multimodal: false, freeTier: '开源权重可自部署', cn: false },
  { id: 'deepseek-v3', name: 'DeepSeek-V3', vendor: '深度求索', inputPrice: 0.27, outputPrice: 1.10, context: 64000, contextLabel: '64K', multimodal: false, freeTier: '', cn: true },
  { id: 'deepseek-r1', name: 'DeepSeek-R1', vendor: '深度求索', inputPrice: 0.55, outputPrice: 2.19, context: 64000, contextLabel: '64K', multimodal: false, freeTier: '', cn: true },
  { id: 'qwen-max', name: '通义千问-Max', vendor: '阿里云', inputPrice: 2.00, outputPrice: 6.00, context: 32000, contextLabel: '32K', multimodal: true, freeTier: '新用户有免费额度', cn: true },
  { id: 'qwen-plus', name: '通义千问-Plus', vendor: '阿里云', inputPrice: 0.40, outputPrice: 1.20, context: 128000, contextLabel: '128K', multimodal: false, freeTier: '新用户百万tokens', cn: true },
  { id: 'glm-4-plus', name: '智谱 GLM-4-Plus', vendor: '智谱AI', inputPrice: 0.70, outputPrice: 0.70, context: 128000, contextLabel: '128K', multimodal: false, freeTier: '注册赠试用额度', cn: true },
  { id: 'moonshot-128k', name: 'Kimi moonshot-v1-128k', vendor: '月之暗面', inputPrice: 2.00, outputPrice: 4.00, context: 128000, contextLabel: '128K', multimodal: false, freeTier: '', cn: true },
  { id: 'doubao-pro-128k', name: '豆包 Pro 128K', vendor: '字节火山', inputPrice: 0.80, outputPrice: 2.00, context: 128000, contextLabel: '128K', multimodal: true, freeTier: '新用户五十万tokens', cn: true },
  { id: 'ernie-4-turbo', name: '文心一言 4.0 Turbo', vendor: '百度', inputPrice: 4.00, outputPrice: 12.00, context: 128000, contextLabel: '128K', multimodal: true, freeTier: '', cn: true },
  { id: 'command-r-plus', name: 'Command R+', vendor: 'Cohere', inputPrice: 2.50, outputPrice: 10.00, context: 128000, contextLabel: '128K', multimodal: false, freeTier: '试用 Key 可用', cn: false }
]

// 取排序键值
const priceOf = (m, key) => {
  if (key === 'input') return m.inputPrice
  if (key === 'output') return m.outputPrice
  if (key === 'blend') return m.inputPrice + m.outputPrice
  if (key === 'context') return m.context
  return String(m.name)
}

// 稳定排序：主键相同按原索引兜底，保证结果确定
const sortByPrice = (list, key) => {
  return list
    .map((m, idx) => ({ m, idx }))
    .sort((x, y) => {
      const a = priceOf(x.m, key)
      const b = priceOf(y.m, key)
      if (key === 'context') return b - a || x.idx - y.idx
      if (key === 'name') return a.localeCompare(b) || x.idx - y.idx
      return a - b || x.idx - y.idx
    })
    .map(p => p.m)
}

// 成本估算：inputM/outputM 单位为百万 tokens
const estimateCost = (model, inputM, outputM) => {
  return inputM * model.inputPrice + outputM * model.outputPrice
}
// --- pure-test-models-end ---

// ---------- 状态 ----------
const sortKey = ref('blend')
const filter = ref('all')
const monthlyInputM = ref(2)
const monthlyOutputM = ref(1)
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const toggleFilter = (f) => { filter.value = f }

const filteredModels = computed(() => {
  let list = models
  if (filter.value === 'cn') list = models.filter(m => m.cn)
  else if (filter.value === 'oversea') list = models.filter(m => !m.cn)
  else if (filter.value === 'free') list = models.filter(m => m.freeTier !== '')
  return sortByPrice(list, sortKey.value)
})

const costRows = computed(() => {
  const inM = Math.max(0, monthlyInputM.value || 0)
  const outM = Math.max(0, monthlyOutputM.value || 0)
  if (inM <= 0 && outM <= 0) return []
  const costs = models.map(m => estimateCost(m, inM, outM))
  const max = Math.max(...costs)
  const min = Math.min(...costs)
  return models
    .map((m, i) => ({
      model: m,
      cost: costs[i],
      isCheapest: costs[i] === min,
      barPercent: max > 0 ? Math.max(1, (costs[i] / max) * 100) : 0
    }))
    .sort((a, b) => a.cost - b.cost)
})
</script>
