<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Cpu class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">LoRA微调显存计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">估算全参 / LoRA / QLoRA 微调所需显存，推荐合适的显卡配置</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        选择基础模型、微调方式、批大小与序列长度，按「权重 + 优化器 + 激活值 + 框架开销」估算训练显存，并给出可运行的显卡建议。公式与系数透明可查，结果为工程估算值，实际以框架日志为准。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：参数 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 训练配置
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">基础模型</label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="m in modelSizes"
                :key="m.params"
                @click="modelParams = m.params"
                :class="modelParams === m.params ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 rounded text-xs font-medium transition-all"
              >{{ m.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">{{ currentModel.layers }} 层 · 隐藏维度 {{ currentModel.hidden.toLocaleString() }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">微调方式</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="f in fineTuneMethods"
                :key="f.value"
                @click="method = f.value"
                :class="method === f.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 rounded text-xs font-medium transition-all"
                :title="f.tip"
              >{{ f.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">{{ currentMethodTip }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">批大小（Batch Size）</label>
            <div class="grid grid-cols-6 gap-1.5">
              <button
                v-for="b in [1, 2, 4, 8, 16, 32]"
                :key="b"
                @click="batchSize = b"
                :class="batchSize === b ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 rounded text-xs font-medium transition-all"
              >{{ b }}</button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">序列长度</label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="s in [512, 1024, 2048, 4096]"
                :key="s"
                @click="seqLen = s"
                :class="seqLen === s ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 rounded text-xs font-medium transition-all"
              >{{ s }}</button>
            </div>
          </div>

          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-foreground">梯度检查点<span class="text-xs text-muted-foreground ml-1">（省显存，慢约 20-30%）</span></span>
            <button
              type="button"
              @click="gradCheckpoint = !gradCheckpoint"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
              :class="gradCheckpoint ? 'bg-primary' : 'bg-muted'"
            >
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="gradCheckpoint ? 'translate-x-6' : 'translate-x-1'"></span>
            </button>
          </label>
        </div>
      </div>

      <!-- 右侧：结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 显存账单 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 class="w-5 h-5 mr-2 text-primary" /> 显存账单
          </h2>
          <div class="flex items-end gap-4 mb-5">
            <div class="bg-primary/10 rounded-lg p-4 text-center min-w-[140px]">
              <p class="text-3xl font-bold text-primary">{{ totalVRAM }}</p>
              <p class="text-xs text-muted-foreground mt-1">估算训练显存</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center min-w-[140px]">
              <p class="text-2xl font-bold text-foreground">{{ recommendedGPU }}</p>
              <p class="text-xs text-muted-foreground mt-1">建议显卡（留 25% 余量）</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center min-w-[140px]">
              <p class="text-2xl font-bold text-foreground">{{ feasible ? '可行' : '建议降配' }}</p>
              <p class="text-xs text-muted-foreground mt-1">单卡 24GB 评估</p>
            </div>
          </div>

          <div class="space-y-2">
            <div v-for="row in breakdownRows" :key="row.label" class="flex items-center gap-3">
              <span class="text-xs text-muted-foreground w-40 flex-shrink-0">{{ row.label }}</span>
              <div class="flex-1 h-4 bg-muted/50 rounded overflow-hidden">
                <div class="h-full rounded transition-all" :class="row.color" :style="{ width: row.percent + '%' }"></div>
              </div>
              <span class="text-xs font-mono text-foreground w-16 text-right">{{ row.value }} GB</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground leading-relaxed">
            {{ breakdownNote }}
          </div>
        </div>

        <!-- 显卡适配表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <CheckCircle class="w-4 h-4 mr-2 text-primary" /> 常见显卡能否跑得动
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            <div
              v-for="g in gpuFitList"
              :key="g.name"
              class="rounded-lg p-3 border"
              :class="g.fit ? 'border-green-500/40 bg-green-500/5' : 'border-border bg-muted/30 opacity-60'"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-foreground">{{ g.name }}</span>
                <CheckCircle v-if="g.fit" class="w-4 h-4 text-green-500 flex-shrink-0" />
                <XCircle v-else class="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
              <p class="text-xs text-muted-foreground mt-1">{{ g.vram }}GB 显存{{ g.fit ? '' : ' · 不足' }}</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-4">
            消费级单卡跑不下时，可组合：QLoRA 降批大小 / 多卡张量并行 / 云端租卡（A100 80G 单卡可全参微调 13B）。
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于微调显存估算</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>微调显存由四部分组成：模型权重、优化器状态、激活值和框架开销。三种主流方式差别巨大——全参微调每个参数约需 16 字节（FP16 权重 2B + 梯度 2B + Adam 状态 8B + FP32 主权重 4B），因此 7B 模型全参微调需要约 112GB 以上；LoRA 冻结基础权重只训练低秩适配器，FP16 权重 2B/参数即可起步；QLoRA 把基础权重量化到 4-bit，约 0.6B/参数，24GB 消费卡就能微调 33B 模型。</p>
          <h3 class="text-lg font-semibold text-foreground">省显存的工程手段</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>梯度检查点：重算换显存，激活值降至 1/4 左右</li>
            <li>梯度累积：小批多次累积等效大批，激活值只按小批算</li>
            <li>8-bit 优化器：Adam 状态减半（paged_adamw_8bit）</li>
            <li>NEFTune / Unsloth / Liger Kernel：算子级优化进一步压缩</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">估算和实际训练差多少？</span>±20% 以内。实际显存受框架版本、是否 flash-attention、词表大小（logits 峰值）影响，务必留出余量。</li>
            <li><span class="text-foreground font-medium">为什么大词表模型（如 Qwen）显存更高？</span>输出 logits 层为 [batch×seq, vocab] 的 FP32 张量，词表 15 万时峰值可达数 GB，本工具已折算进框架开销。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'lora-vram-calculator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Cpu, Settings2, BarChart3, CheckCircle, XCircle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: 'LoRA微调显存计算器 - 全参/LoRA/QLoRA训练显存估算',
  description: '在线估算大模型微调所需显存，支持全参微调、LoRA、QLoRA三种方式，按批大小与序列长度计算显存账单，推荐合适的训练显卡配置',
  keywords: 'lora显存, qlora显存, 微调显存计算, 训练显存估算, 全参微调, 大模型微调, fine-tune vram',
  author: 'Util工具箱',
  ogTitle: 'LoRA微调显存计算器 - 有条工具',
  ogDescription: '估算全参/LoRA/QLoRA微调所需显存，推荐合适的显卡配置',
  ogUrl: 'https://www.util.cn/tools/lora-vram-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', name: 'LoRA微调显存计算器', url: 'https://www.util.cn/tools/lora-vram-calculator', applicationCategory: 'DeveloperApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }, featureList: ['全参/LoRA/QLoRA显存估算', '显存分项账单', '显卡适配推荐'] },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
          { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
          { '@type': 'ListItem', position: 3, name: 'LoRA微调显存计算器', item: 'https://www.util.cn/tools/lora-vram-calculator/' }
        ] }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'lora-vram-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 配置 ----------
const modelSizes = [
  { params: 1.5, label: '1.5B', layers: 28, hidden: 1536 },
  { params: 3, label: '3B', layers: 36, hidden: 3200 },
  { params: 7, label: '7B', layers: 32, hidden: 4096 },
  { params: 8, label: '8B', layers: 32, hidden: 4096 },
  { params: 14, label: '14B', layers: 48, hidden: 5120 },
  { params: 32, label: '32B', layers: 64, hidden: 5120 },
  { params: 70, label: '70B', layers: 80, hidden: 8192 }
]
const fineTuneMethods = [
  { value: 'full', label: '全参微调', tip: '更新全部权重，效果上限最高，显存开销巨大' },
  { value: 'lora', label: 'LoRA', tip: '冻结权重训练低秩适配器，显存约为推理的 1.2 倍' },
  { value: 'qlora', label: 'QLoRA', tip: '4-bit 量化基础权重 + LoRA，消费级单卡可微调大模型' }
]
const modelParams = ref(7)
const method = ref('lora')
const batchSize = ref(1)
const seqLen = ref(1024)
const gradCheckpoint = ref(true)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const currentModel = computed(() => modelSizes.find(m => m.params === modelParams.value) || modelSizes[2])
const currentMethodTip = computed(() => fineTuneMethods.find(f => f.value === method.value)?.tip || '')

// ---------- 显存账单 ----------
const bytesToGB = (b) => Math.round(b / (1024 ** 3) * 10) / 10

const vramParts = computed(() => {
  const P = modelParams.value * 1e9
  const { layers, hidden } = currentModel.value

  // 权重 + 优化器（字节/参数）
  let weightBytesPer, overheadGB
  if (method.value === 'full') {
    weightBytesPer = 16 // FP16权重2 + 梯度2 + Adam FP32状态8 + FP32主权重4
    overheadGB = 2
  } else if (method.value === 'lora') {
    weightBytesPer = 2.4 // FP16权重 + 适配器与优化器
    overheadGB = 1.5
  } else {
    weightBytesPer = 0.9 // 4-bit权重0.55 + 量化常量与适配器
    overheadGB = 1.5
  }
  const weightsGB = bytesToGB(P * weightBytesPer)

  // 激活值：与 layers×hidden×seq×batch 成正比；梯度检查点约省 75%
  const ckptFactor = gradCheckpoint.value ? 0.25 : 1.0
  const actBytes = batchSize.value * seqLen.value * layers * hidden * 2 * 6 * ckptFactor
  const actGB = bytesToGB(actBytes)

  // logits 峰值（大词表）：batch×seq×vocab×4B，按 1/4 序列长折算平均
  const logitsGB = bytesToGB(batchSize.value * seqLen.value * 150000 * 4 * 0.25)

  const total = Math.round((weightsGB + actGB + logitsGB + overheadGB) * 10) / 10
  return { weightsGB, actGB, logitsGB, overheadGB, total }
})

const totalVRAM = computed(() => vramParts.value.total + ' GB')

const breakdownRows = computed(() => {
  const p = vramParts.value
  const rows = [
    { label: '权重 + 优化器', value: p.weightsGB, color: 'bg-primary' },
    { label: '激活值', value: p.actGB, color: 'bg-blue-500' },
    { label: '输出层 logits 峰值', value: p.logitsGB, color: 'bg-purple-500' },
    { label: '框架/上下文开销', value: p.overheadGB, color: 'bg-muted-foreground' }
  ]
  return rows.map(r => ({ ...r, percent: Math.max(3, Math.round(r.value / p.total * 100)) }))
})

const breakdownNote = computed(() => {
  const m = method.value
  const base = `按 ${modelParams.value}B 参数、批 ${batchSize.value}、序列 ${seqLen.value}${gradCheckpoint.value ? '、梯度检查点开启' : ''} 估算。`
  if (m === 'full') return base + ' 全参微调显存 ≈ 参数量×16字节 + 激活值，7B 以上通常需要多卡或 A100/H100。'
  if (m === 'lora') return base + ' LoRA 显存 ≈ 参数量×2.4字节 + 激活值，适配器秩 r=8~64 的影响可忽略。'
  return base + ' QLoRA 基础权重按 4-bit（NF4）计，配合 paged 优化器可进一步压缩峰值。'
})

const recommendedGPU = computed(() => {
  const need = vramParts.value.total * 1.25
  const cards = [8, 12, 16, 24, 48, 80]
  const fit = cards.find(c => c >= need)
  return fit ? fit + 'GB' : '多卡'
})

const feasible = computed(() => vramParts.value.total * 1.25 <= 24)

const gpuFitList = computed(() => {
  const need = vramParts.value.total
  return [
    { name: 'RTX 4060', vram: 8 },
    { name: 'RTX 4070', vram: 12 },
    { name: 'RTX 4080', vram: 16 },
    { name: 'RTX 4090', vram: 24 },
    { name: 'A6000 / L40S', vram: 48 },
    { name: 'A100 / H100', vram: 80 }
  ].map(g => ({ ...g, fit: need * 1.2 <= g.vram }))
})
</script>
