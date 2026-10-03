<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Cpu class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">GPU检测与本地模型推荐</h1>
          <p class="text-sm text-muted-foreground mt-1">检测显卡与可用内存，告诉你能流畅运行哪些本地大模型和量化版本</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        通过 WebGPU / WebGL 读取本机 GPU 信息，识别显卡型号并推算可用显存或统一内存，再按「模型权重 + KV Cache + 运行时开销」的显存账单，给出 Qwen、Llama、DeepSeek 等热门开源模型在不同量化等级（Q3/Q4/Q6/Q8）下的运行建议。全部检测在浏览器本地完成，不上传任何信息。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：检测结果与修正 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 检测结果 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Activity class="w-5 h-5 mr-2 text-primary" /> 硬件检测结果
            </h2>
            <button
              @click="detect"
              :disabled="detecting"
              class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5"
            >
              <Loader2 v-if="detecting" class="w-3.5 h-3.5 animate-spin" />
              <RefreshCw v-else class="w-3.5 h-3.5" /> 重新检测
            </button>
          </div>

          <div v-if="detecting" class="py-10 text-center text-sm text-muted-foreground">
            <Loader2 class="w-6 h-6 animate-spin mx-auto mb-3 text-primary" />
            正在读取 GPU 信息...
          </div>

          <template v-else-if="detected">
            <!-- 识别结果 -->
            <div class="bg-muted/50 rounded-lg p-4 mb-4">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground mb-1">识别到的显卡</p>
                  <p class="text-base font-semibold text-foreground break-words">{{ matchedLabel }}</p>
                </div>
                <span
                  v-if="gpuMeta"
                  class="text-[10px] px-2 py-1 rounded-full whitespace-nowrap"
                  :class="vendorBadgeClass"
                >{{ vendorLabel }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-2 break-all leading-relaxed">
                {{ detected.renderer || detected.webgpuDescription || '未读取到渲染器信息' }}
              </p>
            </div>

            <!-- 明细 -->
            <div class="space-y-2.5 text-sm">
              <div class="flex items-center justify-between py-1.5 border-b border-border/50">
                <span class="text-muted-foreground">WebGPU</span>
                <span :class="detected.webgpu ? 'text-green-500' : 'text-muted-foreground'">
                  {{ detected.webgpu ? '支持（' + detected.webgpuFeatureCount + ' 项特性）' : '不支持' }}
                </span>
              </div>
              <div class="flex items-center justify-between py-1.5 border-b border-border/50">
                <span class="text-muted-foreground">CPU 逻辑核心</span>
                <span class="text-foreground">{{ detected.cores || '—' }} 核</span>
              </div>
              <div class="flex items-center justify-between py-1.5 border-b border-border/50">
                <span class="text-muted-foreground">系统内存</span>
                <span class="text-foreground">{{ detected.deviceMemory ? '≈' + detected.deviceMemory + ' GB（浏览器上报）' : '浏览器未提供，请手动填写' }}</span>
              </div>
              <div class="flex items-center justify-between py-1.5 border-b border-border/50">
                <span class="text-muted-foreground">最大纹理尺寸</span>
                <span class="text-foreground">{{ detected.maxTextureSize || '—' }}</span>
              </div>
              <div v-if="detected.maxBufferSize" class="flex items-center justify-between py-1.5 border-b border-border/50">
                <span class="text-muted-foreground">WebGPU 单缓冲上限</span>
                <span class="text-foreground">{{ formatBytes(detected.maxBufferSize) }}</span>
              </div>
            </div>

            <button
              @click="copyReport"
              class="w-full mt-4 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制检测报告
            </button>
          </template>
        </div>

        <!-- 手动修正 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 参数修正
          </h2>
          <p class="text-xs text-muted-foreground mb-4">
            浏览器无法直接读取显存容量，已按型号预填常见配置。苹果芯片请填写统一内存大小，与显存同等参与计算。
          </p>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">显卡型号</label>
              <select
                v-model="selectedGpuKey"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option
                  v-for="opt in gpuOptions"
                  :key="'g-' + opt.value"
                  :value="opt.value"
                >{{ opt.label }}</option>
                <optgroup v-for="group in gpuGroups" :key="group.vendor" :label="group.label">
                  <option
                    v-for="opt in group.options"
                    :key="opt.value"
                    :value="opt.value"
                  >{{ opt.label }}</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                {{ gpuMeta?.memType === 'unified' ? '统一内存（GB）' : '显存（GB）' }}
              </label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="memoryGB"
                  type="number"
                  min="2"
                  max="512"
                  class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div class="grid grid-cols-6 gap-1.5 mt-2">
                <button
                  v-for="size in memoryPresets"
                  :key="size"
                  @click="memoryGB = size"
                  :class="memoryGB === size ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >{{ size }}</button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">推理上下文长度</label>
              <div class="grid grid-cols-5 gap-1.5">
                <button
                  v-for="ctx in contextOptions"
                  :key="ctx.value"
                  @click="contextLength = ctx.value"
                  :class="contextLength === ctx.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                  :title="ctx.label"
                >{{ ctx.label }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：模型推荐 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 可用内存结论 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-2xl font-bold text-foreground">{{ memoryGB || '—' }}<span class="text-sm font-normal text-muted-foreground"> GB</span></p>
              <p class="text-xs text-muted-foreground mt-1">{{ gpuMeta?.memType === 'unified' ? '统一内存' : '显存总量' }}</p>
            </div>
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-2xl font-bold text-primary">{{ usableGB }}</p>
              <p class="text-xs text-muted-foreground mt-1">模型可用（含预留）</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-2xl font-bold text-green-500">{{ comfortableCount }}</p>
              <p class="text-xs text-muted-foreground mt-1">可流畅运行</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-2xl font-bold text-yellow-500">{{ tightCount }}</p>
              <p class="text-xs text-muted-foreground mt-1">可勉强运行</p>
            </div>
          </div>
          <p v-if="usableNote" class="text-xs text-muted-foreground mt-4 leading-relaxed">{{ usableNote }}</p>
        </div>

        <!-- 推荐列表 -->
        <div class="space-y-4">
          <!-- 流畅 -->
          <div class="bg-card border border-border rounded-lg p-6">
            <h3 class="text-base font-semibold text-foreground mb-1 flex items-center">
              <CheckCircle class="w-4 h-4 mr-2 text-green-500" /> 流畅运行
              <span class="ml-2 text-xs font-normal text-muted-foreground">权重 + 上下文占用不超过可用内存的 72%</span>
            </h3>
            <p v-if="comfortable.length === 0" class="text-sm text-muted-foreground py-3">当前配置下没有可流畅运行的大模型，可查看下方「勉强运行」或选择更小的模型。</p>
            <div v-else class="divide-y divide-border/50">
              <div v-for="rec in comfortable" :key="rec.name" class="py-3">
                <div class="flex items-center justify-between gap-3 flex-wrap">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-foreground">{{ rec.name }}
                      <span v-if="rec.note" class="text-xs text-muted-foreground font-normal">· {{ rec.note }}</span>
                    </p>
                    <p class="text-xs text-muted-foreground mt-0.5">Q4 约 {{ rec.required.Q4_K_M }} GB · {{ rec.type }}</p>
                  </div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span
                      v-for="q in quantList"
                      :key="q"
                      class="text-[10px] px-1.5 py-0.5 rounded font-mono"
                      :class="quantChipClass(rec, q)"
                      :title="q + ' 约需 ' + rec.required[q] + ' GB'"
                    >{{ q }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 勉强 -->
          <div class="bg-card border border-border rounded-lg p-6">
            <h3 class="text-base font-semibold text-foreground mb-1 flex items-center">
              <AlertTriangle class="w-4 h-4 mr-2 text-yellow-500" /> 勉强运行
              <span class="ml-2 text-xs font-normal text-muted-foreground">需缩短上下文、关闭其他占用内存的程序</span>
            </h3>
            <p v-if="tight.length === 0" class="text-sm text-muted-foreground py-3">无。你的配置可以直接跳过这一档。</p>
            <div v-else class="divide-y divide-border/50">
              <div v-for="rec in tight" :key="rec.name" class="py-3">
                <div class="flex items-center justify-between gap-3 flex-wrap">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-foreground">{{ rec.name }}
                      <span v-if="rec.note" class="text-xs text-muted-foreground font-normal">· {{ rec.note }}</span>
                    </p>
                    <p class="text-xs text-muted-foreground mt-0.5">Q4 约 {{ rec.required.Q4_K_M }} GB · {{ rec.type }}</p>
                  </div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span
                      v-for="q in quantList"
                      :key="q"
                      class="text-[10px] px-1.5 py-0.5 rounded font-mono"
                      :class="quantChipClass(rec, q)"
                      :title="q + ' 约需 ' + rec.required[q] + ' GB'"
                    >{{ q }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 超出 -->
          <div class="bg-card border border-border rounded-lg p-6">
            <h3 class="text-base font-semibold text-foreground mb-1 flex items-center">
              <XCircle class="w-4 h-4 mr-2 text-destructive" /> 当前跑不动
              <span class="ml-2 text-xs font-normal text-muted-foreground">升级配置或使用云端 API</span>
            </h3>
            <div class="divide-y divide-border/50">
              <div v-for="rec in overBudget" :key="rec.name" class="flex items-center justify-between gap-3 py-3">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-muted-foreground">{{ rec.name }}</p>
                  <p class="text-xs text-muted-foreground mt-0.5">最低 Q3 量化也需约 {{ rec.required.Q3_K_M }} GB</p>
                </div>
                <span class="text-xs text-muted-foreground whitespace-nowrap">建议 ≥ {{ Math.ceil(rec.required.Q4_K_M / 0.72 / 4) * 4 }} GB</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 量化速查 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-base font-semibold text-foreground mb-4 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 量化等级速查（GGUF）
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-4 font-medium">量化格式</th>
                  <th class="py-2 pr-4 font-medium">每 1B 参数占用</th>
                  <th class="py-2 pr-4 font-medium">7B 模型体积</th>
                  <th class="py-2 font-medium">质量与建议</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border/50">
                <tr v-for="row in quantTable" :key="row.q">
                  <td class="py-2.5 pr-4 font-mono text-foreground">{{ row.q }}</td>
                  <td class="py-2.5 pr-4 text-muted-foreground">≈ {{ row.perB }} GB</td>
                  <td class="py-2.5 pr-4 text-muted-foreground">≈ {{ row.sevenB }} GB</td>
                  <td class="py-2.5 text-muted-foreground">{{ row.advice }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
            通行经验：Q4_K_M 是质量与体积的最佳平衡点，也是 Ollama、LM Studio 等工具的默认档位；显存富余选 Q6_K（接近无损），追求极限压体积再考虑 Q3/IQ 系列。AWQ/GPTQ 4-bit（vLLM/ExLlama 生态）体积与 GGUF Q4 接近。
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于GPU检测与本地模型推荐</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            想在自己电脑上跑 Ollama、LM Studio、llama.cpp 本地大模型，第一个问题就是"我的显卡能跑多大的模型"。本工具通过浏览器的 WebGPU 与 WebGL 接口读取显卡型号与能力，识别出具体芯片后结合内置的显存规格库推算可用内存，再按大语言模型的真实显存占用公式（模型权重 + KV Cache + 运行时开销）逐个评估热门开源模型在不同量化等级下的可运行性。
          </p>
          <h3 class="text-lg font-semibold text-foreground">支持识别的显卡</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>Apple M1 / M2 / M3 / M4 系列（Base / Pro / Max / Ultra，按统一内存计算）</li>
            <li>NVIDIA GeForce RTX 20 / 30 / 40 / 50 系及专业卡（T4 / A100 / H100 / V100）</li>
            <li>AMD Radeon RX 6000 / 7000 / 9000 系</li>
            <li>Intel Arc 独显与集成显卡</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">量化版本怎么选</h3>
          <p>
            量化是把模型权重从 16-bit 浮点压缩到更低精度的技术，体积与显存占用成倍下降。GGUF 格式的 Q4_K_M（约 4-bit）是最常用的平衡档位，质量损失在多数场景下难以察觉；Q6_K 接近原始质量；Q8_0 几乎无损；FP16 为原始精度。显存紧张时可选择 Q3_K_M 或 IQ4_XS 进一步压缩，但低于 Q3 后质量下降会明显起来。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">检测结果与我的实际显存不符？</span>浏览器出于隐私考虑不暴露显存容量，本工具按显卡型号预填了常见配置，请在"参数修正"中改成实际显存；苹果芯片请填写统一内存。</li>
            <li><span class="text-foreground font-medium">苹果 Mac 为什么按统一内存的 70% 计算？</span>macOS 默认限制 GPU 可使用的有线内存比例（约 65%-75%），剩余部分留给系统。高级用户可通过 sysctl 调整 iogpu.wired_limit，但一般建议按默认值评估。</li>
            <li><span class="text-foreground font-medium">MoE 模型（如 Qwen3-30B-A3B）怎么算？</span>混合专家模型虽然每次只激活少量参数（推理速度快），但全部权重仍需完整载入内存，所以按总参数量 30B 计算占用。</li>
            <li><span class="text-foreground font-medium">检测信息会上传吗？</span>不会。所有检测与计算都在浏览器本地完成。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'gpu-detector'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Cpu, Activity, RefreshCw, Loader2, Settings2, Copy, CheckCircle,
  AlertTriangle, XCircle, Info, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'GPU检测工具 - 查看电脑能跑哪些本地大模型和量化版本',
  description: '在线检测显卡型号、显存与WebGPU支持，推荐你的电脑能流畅运行的本地大模型（Qwen/Llama/DeepSeek等）及GGUF量化版本选择（Q3/Q4/Q6/Q8），纯本地检测不上传',
  keywords: 'gpu检测, 显卡检测, 显存查询, 本地大模型, 本地部署llm, gguf量化, q4_k_m, ollama模型推荐, 能跑什么模型',
  author: 'Util工具箱',
  ogTitle: 'GPU检测与本地模型推荐 - 有条工具',
  ogDescription: '检测显卡与显存，告诉你能流畅运行哪些本地大模型和量化版本',
  ogUrl: 'https://www.util.cn/tools/gpu-detector',
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
          name: 'GPU检测与本地模型推荐',
          url: 'https://www.util.cn/tools/gpu-detector',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['WebGPU/WebGL显卡检测', '显存与统一内存估算', '本地大模型运行推荐', 'GGUF量化版本选择建议']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'GPU检测与本地模型推荐', item: 'https://www.util.cn/tools/gpu-detector/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '怎么知道我的电脑能跑多大的本地大模型？',
              acceptedAnswer: { '@type': 'Answer', text: '主要由显存（或苹果统一内存）决定：Q4量化下每10GB约可容纳16B参数模型，再减去约1-2GB的KV Cache与运行时开销。本工具可自动检测并逐模型评估。' }
            },
            {
              '@type': 'Question',
              name: '检测到的显存和实际不符怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '浏览器不暴露显存容量，工具按型号预填常见配置，可在参数修正中手动调整；苹果芯片填写统一内存大小即可。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'gpu-detector')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  detect()
})

// ---------- 状态 ----------
const detecting = ref(false)
const detected = ref(null)
const selectedGpuKey = ref('auto')
const memoryGB = ref(0)
const contextLength = ref(4096)
const seoContentVisible = ref(true)

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// 切换型号时带入该型号的默认显存/统一内存配置，用户仍可手动修改
watch(selectedGpuKey, (key) => {
  const meta = GPU_DB.find(d => d.key === key)
  if (meta) memoryGB.value = meta.memGB
})

// ---------- GPU 规格库 ----------
// memGB: 常见默认容量；memType: unified 统一内存 / dgpu 独显 / igpu 核显
const GPU_DB = [
  { key: 'apple-base', label: 'Apple M1 / M2 / M3 / M4（基础款）', vendor: 'apple', memGB: 8, memType: 'unified', re: /apple\s*m\d(\s|$|,\s*(?!pro|max|ultra))/i },
  { key: 'apple-pro', label: 'Apple M 系列 Pro', vendor: 'apple', memGB: 24, memType: 'unified', re: /apple.*m\d\s*pro/i },
  { key: 'apple-max', label: 'Apple M 系列 Max', vendor: 'apple', memGB: 48, memType: 'unified', re: /apple.*m\d\s*max/i },
  { key: 'apple-ultra', label: 'Apple M 系列 Ultra', vendor: 'apple', memGB: 128, memType: 'unified', re: /apple.*m\d\s*ultra/i },
  { key: 'apple-generic', label: 'Apple Silicon（未识别具体型号）', vendor: 'apple', memGB: 16, memType: 'unified', re: /apple(\s*gpu)?$/i },

  { key: 'rtx-5090', label: 'NVIDIA RTX 5090（32GB）', vendor: 'nvidia', memGB: 32, memType: 'dgpu', re: /rtx\s*5090/i },
  { key: 'rtx-5080', label: 'NVIDIA RTX 5080（16GB）', vendor: 'nvidia', memGB: 16, memType: 'dgpu', re: /rtx\s*5080/i },
  { key: 'rtx-5070ti', label: 'NVIDIA RTX 5070 Ti（16GB）', vendor: 'nvidia', memGB: 16, memType: 'dgpu', re: /rtx\s*5070\s*ti/i },
  { key: 'rtx-5070', label: 'NVIDIA RTX 5070（12GB）', vendor: 'nvidia', memGB: 12, memType: 'dgpu', re: /rtx\s*5070/i },
  { key: 'rtx-5060', label: 'NVIDIA RTX 5060（8GB）', vendor: 'nvidia', memGB: 8, memType: 'dgpu', re: /rtx\s*5060/i },
  { key: 'rtx-4090', label: 'NVIDIA RTX 4090（24GB）', vendor: 'nvidia', memGB: 24, memType: 'dgpu', re: /rtx\s*4090/i },
  { key: 'rtx-4080', label: 'NVIDIA RTX 4080 / 4080 Super（16GB）', vendor: 'nvidia', memGB: 16, memType: 'dgpu', re: /rtx\s*4080/i },
  { key: 'rtx-4070ti', label: 'NVIDIA RTX 4070 Ti（12GB）', vendor: 'nvidia', memGB: 12, memType: 'dgpu', re: /rtx\s*4070\s*ti/i },
  { key: 'rtx-4070', label: 'NVIDIA RTX 4070（12GB）', vendor: 'nvidia', memGB: 12, memType: 'dgpu', re: /rtx\s*4070/i },
  { key: 'rtx-4060', label: 'NVIDIA RTX 4060 / Ti（8GB）', vendor: 'nvidia', memGB: 8, memType: 'dgpu', re: /rtx\s*4060/i },
  { key: 'rtx-3090', label: 'NVIDIA RTX 3090 / 3090 Ti（24GB）', vendor: 'nvidia', memGB: 24, memType: 'dgpu', re: /rtx\s*3090/i },
  { key: 'rtx-3080', label: 'NVIDIA RTX 3080（10/12GB）', vendor: 'nvidia', memGB: 10, memType: 'dgpu', re: /rtx\s*3080/i },
  { key: 'rtx-3070', label: 'NVIDIA RTX 3070（8GB）', vendor: 'nvidia', memGB: 8, memType: 'dgpu', re: /rtx\s*3070/i },
  { key: 'rtx-3060', label: 'NVIDIA RTX 3060（12GB）', vendor: 'nvidia', memGB: 12, memType: 'dgpu', re: /rtx\s*3060/i },
  { key: 'rtx-2080ti', label: 'NVIDIA RTX 2080 Ti（11GB）', vendor: 'nvidia', memGB: 11, memType: 'dgpu', re: /2080\s*ti/i },
  { key: 'gtx-1660', label: 'NVIDIA GTX 1660 / 1650（6/4GB）', vendor: 'nvidia', memGB: 6, memType: 'dgpu', re: /gtx\s*16(60|50)/i },
  { key: 'h100', label: 'NVIDIA H100（80GB）', vendor: 'nvidia', memGB: 80, memType: 'dgpu', re: /h100/i },
  { key: 'a100', label: 'NVIDIA A100 / A800（40/80GB）', vendor: 'nvidia', memGB: 40, memType: 'dgpu', re: /a(100|800)/i },
  { key: 'v100', label: 'NVIDIA V100（16/32GB）', vendor: 'nvidia', memGB: 16, memType: 'dgpu', re: /v100/i },
  { key: 't4', label: 'NVIDIA T4（16GB）', vendor: 'nvidia', memGB: 16, memType: 'dgpu', re: /\bt4\b/i },

  { key: 'rx-9070xt', label: 'AMD Radeon RX 9070 XT（16GB）', vendor: 'amd', memGB: 16, memType: 'dgpu', re: /9070\s*xt/i },
  { key: 'rx-7900xtx', label: 'AMD Radeon RX 7900 XTX（24GB）', vendor: 'amd', memGB: 24, memType: 'dgpu', re: /7900\s*xtx/i },
  { key: 'rx-7900xt', label: 'AMD Radeon RX 7900 XT（20GB）', vendor: 'amd', memGB: 20, memType: 'dgpu', re: /7900\s*xt/i },
  { key: 'rx-7800xt', label: 'AMD Radeon RX 7800 XT（16GB）', vendor: 'amd', memGB: 16, memType: 'dgpu', re: /7800\s*xt/i },
  { key: 'rx-7700xt', label: 'AMD Radeon RX 7700 XT（12GB）', vendor: 'amd', memGB: 12, memType: 'dgpu', re: /7700\s*xt/i },
  { key: 'rx-7600', label: 'AMD Radeon RX 7600（8GB）', vendor: 'amd', memGB: 8, memType: 'dgpu', re: /7600/i },
  { key: 'rx-6800', label: 'AMD Radeon RX 6800 / XT（16GB）', vendor: 'amd', memGB: 16, memType: 'dgpu', re: /6800/i },
  { key: 'rx-6600', label: 'AMD Radeon RX 6600（8GB）', vendor: 'amd', memGB: 8, memType: 'dgpu', re: /6600/i },
  { key: 'amd-igpu', label: 'AMD 集成显卡（共享内存）', vendor: 'amd', memGB: 8, memType: 'igpu', re: /radeon(\s*(r|tm)?)?\s*(graphics|integrated)/i },

  { key: 'arc-b580', label: 'Intel Arc B580（12GB）', vendor: 'intel', memGB: 12, memType: 'dgpu', re: /b580/i },
  { key: 'arc-a770', label: 'Intel Arc A770（16GB）', vendor: 'intel', memGB: 16, memType: 'dgpu', re: /a770/i },
  { key: 'arc-a750', label: 'Intel Arc A750（8GB）', vendor: 'intel', memGB: 8, memType: 'dgpu', re: /a750/i },
  { key: 'intel-igpu', label: 'Intel 集成显卡（共享内存）', vendor: 'intel', memGB: 8, memType: 'igpu', re: /(intel(\(r\))?\s*(uhd|iris|hd))/i }
]

const VENDOR_LABELS = { apple: 'Apple 统一内存', nvidia: 'NVIDIA', amd: 'AMD', intel: 'Intel', unknown: '未知' }

const quantList = ['Q3_K_M', 'Q4_K_M', 'Q6_K', 'Q8_0']

// GGUF 每 1B 参数的近似体积（GB，含嵌入层等）
const QUANT_BYTES = {
  Q3_K_M: 0.46,
  Q4_K_M: 0.60,
  Q6_K: 0.81,
  Q8_0: 1.06
}

const quantTable = [
  { q: 'Q2_K', perB: 0.36, sevenB: '2.6 GB', advice: '质量下降明显，仅极限压体积时使用' },
  { q: 'Q3_K_M', perB: 0.46, sevenB: '3.3 GB', advice: '显存紧张时的可接受下限' },
  { q: 'Q4_K_M', perB: 0.60, sevenB: '4.4 GB', advice: '主流选择，质量/体积最佳平衡（Ollama 默认）' },
  { q: 'Q5_K_M', perB: 0.70, sevenB: '5.1 GB', advice: '比 Q4 略好，性价比一般' },
  { q: 'Q6_K', perB: 0.81, sevenB: '5.9 GB', advice: '接近无损，显存富余时的优选' },
  { q: 'Q8_0', perB: 1.06, sevenB: '7.7 GB', advice: '几乎无损' },
  { q: 'FP16', perB: 2.00, sevenB: '14.5 GB', advice: '原始精度，一般仅微调/训练场景使用' }
]

// 模型目录：paramsB 为总参数量（MoE 也按总量算权重显存）；fixedGB 用于非 LLM 的固定占用模型
const MODEL_CATALOG = [
  { name: 'Qwen3-0.6B', paramsB: 0.6, type: '对话 · 中文友好', note: '超轻量' },
  { name: 'Qwen3-1.7B', paramsB: 1.7, type: '对话 · 中文友好', note: '' },
  { name: 'Llama-3.2-1B', paramsB: 1.2, type: '对话 · Meta', note: '超轻量' },
  { name: 'Qwen3-4B', paramsB: 4, type: '对话 · 中文友好', note: '' },
  { name: 'Llama-3.2-3B', paramsB: 3.2, type: '对话 · Meta', note: '' },
  { name: 'Qwen3-8B', paramsB: 8, type: '对话 · 中文友好', note: '均衡之选' },
  { name: 'DeepSeek-R1-Distill-7B', paramsB: 7, type: '推理 · 思维链', note: '' },
  { name: 'Mistral-7B', paramsB: 7, type: '对话 · 欧洲系', note: '' },
  { name: 'GLM-4-9B', paramsB: 9, type: '对话 · 中文友好', note: '' },
  { name: 'Llama-3.1-8B', paramsB: 8, type: '对话 · Meta', note: '' },
  { name: 'Qwen3-14B', paramsB: 14, type: '对话 · 中文友好', note: '' },
  { name: 'DeepSeek-R1-Distill-14B', paramsB: 14, type: '推理 · 思维链', note: '' },
  { name: 'Phi-4-14B', paramsB: 14, type: '对话 · 微软', note: '' },
  { name: 'Gemma-3-12B', paramsB: 12, type: '对话 · 多模态', note: '' },
  { name: 'Qwen3-30B-A3B', paramsB: 30, type: 'MoE · 激活3B', note: '权重需全量载入，速度接近3B' },
  { name: 'Qwen3-32B', paramsB: 32, type: '对话 · 中文友好', note: '' },
  { name: 'DeepSeek-R1-Distill-32B', paramsB: 32, type: '推理 · 思维链', note: '' },
  { name: 'Llama-3.3-70B', paramsB: 70, type: '对话 · Meta', note: '' },
  { name: 'DeepSeek-R1-Distill-70B', paramsB: 70, type: '推理 · 思维链', note: '' },
  // 非 LLM 固定占用（已含运行开销）
  { name: 'bge-m3（向量化/检索）', fixedGB: 1.5, type: 'Embedding', note: 'RAG 检索必备' },
  { name: 'Whisper-large-v3（语音转文字）', fixedGB: 3.5, type: '语音识别', note: '' },
  { name: 'Stable Diffusion XL（文生图）', fixedGB: 8, type: '图像生成', note: '' },
  { name: 'Flux.1-schnell（文生图 FP8）', fixedGB: 13, type: '图像生成', note: '' }
]

const contextOptions = [
  { value: 2048, label: '2K' },
  { value: 4096, label: '4K' },
  { value: 8192, label: '8K' },
  { value: 16384, label: '16K' },
  { value: 32768, label: '32K' }
]

const memoryPresets = computed(() => {
  if (gpuMeta.value?.memType === 'unified') return [8, 16, 24, 32, 48, 64]
  return [4, 6, 8, 12, 16, 24]
})

// ---------- 检测 ----------
const detect = async () => {
  detecting.value = true
  const result = {
    renderer: '',
    vendor: '',
    webgpu: false,
    webgpuFeatureCount: 0,
    webgpuDescription: '',
    maxBufferSize: 0,
    maxTextureSize: 0,
    cores: 0,
    deviceMemory: 0,
    softwareRendering: false
  }

  try {
    // WebGPU 检测
    if (typeof navigator !== 'undefined' && navigator.gpu) {
      const adapter = await navigator.gpu.requestAdapter()
      if (adapter) {
        result.webgpu = true
        result.webgpuFeatureCount = adapter.features ? adapter.features.size : 0
        result.maxBufferSize = adapter.limits?.maxBufferSize || 0
        const info = adapter.info || {}
        result.webgpuDescription = [info.vendor, info.architecture, info.device, info.description].filter(Boolean).join(' · ')
        if (!result.renderer && info.description) result.renderer = info.description
        if (!result.vendor && info.vendor) result.vendor = info.vendor
      }
    }
  } catch (e) { /* 忽略 WebGPU 错误，走 WebGL */ }

  try {
    // WebGL 检测
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (gl) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info')
      const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
      const vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR)
      if (!result.renderer) result.renderer = renderer || ''
      if (!result.vendor) result.vendor = vendor || ''
      result.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0
      if (/swiftshader|software|llvmpipe/i.test(renderer || '')) {
        result.softwareRendering = true
      }
    }
  } catch (e) { /* 忽略 */ }

  if (typeof navigator !== 'undefined') {
    result.cores = navigator.hardwareConcurrency || 0
    result.deviceMemory = navigator.deviceMemory || 0
  }

  detected.value = result
  detecting.value = false

  // 自动匹配型号与内存
  const matched = matchGpu(result.renderer)
  if (matched) {
    selectedGpuKey.value = matched.key
    memoryGB.value = matched.memGB
  } else if (!memoryGB.value) {
    memoryGB.value = 8
  }
}

const matchGpu = (rendererStr) => {
  const s = rendererStr || ''
  for (const entry of GPU_DB) {
    if (entry.re.test(s)) return entry
  }
  return null
}

// ---------- 手动选项 ----------
const gpuOptions = computed(() => {
  const matched = matchGpu(detected.value?.renderer || '')
  const opts = [{ value: 'auto', label: matched ? '自动：' + matched.label : '自动（未识别，手动选择）' }]
  return opts
})

const gpuGroups = computed(() => {
  const defs = [
    { vendor: 'apple', label: 'Apple 芯片' },
    { vendor: 'nvidia', label: 'NVIDIA' },
    { vendor: 'amd', label: 'AMD' },
    { vendor: 'intel', label: 'Intel' }
  ]
  return defs.map(g => ({
    ...g,
    options: GPU_DB.filter(d => d.vendor === g.vendor).map(d => ({ value: d.key, label: d.label }))
  }))
})

const gpuMeta = computed(() => GPU_DB.find(d => d.key === selectedGpuKey.value) || null)

const matchedLabel = computed(() => {
  if (detected.value?.softwareRendering) return '软件渲染（无硬件加速）'
  if (gpuMeta.value) return gpuMeta.value.label.replace(/（.*?）/, '')
  return detected.value?.renderer ? '未识别型号（请手动选择）' : '未检测到 GPU'
})

const vendorLabel = computed(() => VENDOR_LABELS[gpuMeta.value?.vendor] || '未知')

const vendorBadgeClass = computed(() => {
  const v = gpuMeta.value?.vendor
  if (v === 'nvidia') return 'bg-green-500/10 text-green-500'
  if (v === 'amd') return 'bg-red-500/10 text-red-500'
  if (v === 'intel') return 'bg-blue-500/10 text-blue-500'
  return 'bg-muted text-muted-foreground'
})

// ---------- 显存账单与推荐 ----------
const RUNTIME_OVERHEAD_GB = 1.0

const usableFactor = computed(() => {
  if (!gpuMeta.value) return 0.6
  if (gpuMeta.value.memType === 'unified') return 0.70
  if (gpuMeta.value.memType === 'igpu') return 0.50
  return 0.92
})

const usableGB = computed(() => {
  const mem = Number(memoryGB.value) || 0
  if (mem <= 0) return 0
  return Math.floor(mem * usableFactor.value * 10) / 10
})

const usableNote = computed(() => {
  if (!gpuMeta.value) return ''
  if (detected.value?.softwareRendering) {
    return '当前浏览器使用软件渲染，无独立 GPU 加速。本地大模型仍可通过 Ollama / llama.cpp 以纯 CPU 模式运行小体积模型（建议 3B 以下 Q4 量化）。'
  }
  if (gpuMeta.value.memType === 'unified') {
    return '苹果芯片按统一内存的 70% 估算 GPU 可用额度（macOS 默认有线内存限制），其余留给系统。'
  }
  if (gpuMeta.value.memType === 'igpu') {
    return '集成显卡与系统共享内存，按 50% 估算可用额度，实际性能还受内存带宽限制，推理速度明显慢于独立显卡。'
  }
  return '独立显卡按 92% 估算可用额度，已预留显示输出与驱动占用。'
})

const modelRecs = computed(() => {
  const usable = usableGB.value
  const ctx = contextLength.value || 4096
  return MODEL_CATALOG.map(m => {
    let required = {}
    if (m.fixedGB) {
      for (const q of quantList) required[q] = m.fixedGB
    } else {
      const kv = m.paramsB * 0.045 * (ctx / 2048)
      for (const q of quantList) {
        required[q] = Math.round((m.paramsB * QUANT_BYTES[q] + kv + RUNTIME_OVERHEAD_GB) * 10) / 10
      }
    }
    return { ...m, required }
  }).map(rec => {
    const minRequired = rec.required.Q3_K_M
    if (usable <= 0) return { ...rec, tier: 'over' }
    if (minRequired > usable * 0.95) return { ...rec, tier: 'over' }
    if (rec.required.Q4_K_M <= usable * 0.72) return { ...rec, tier: 'ok' }
    return { ...rec, tier: 'tight' }
  })
})

const comfortable = computed(() => modelRecs.value.filter(r => r.tier === 'ok'))
const tight = computed(() => modelRecs.value.filter(r => r.tier === 'tight'))
const overBudget = computed(() => modelRecs.value.filter(r => r.tier === 'over'))
const comfortableCount = computed(() => comfortable.value.length)
const tightCount = computed(() => tight.value.length)

const quantChipClass = (rec, q) => {
  const need = rec.required[q]
  const usable = usableGB.value
  if (usable <= 0) return 'bg-muted text-muted-foreground'
  if (need <= usable * 0.72) return 'bg-green-500/10 text-green-500'
  if (need <= usable * 0.95) return 'bg-yellow-500/10 text-yellow-500'
  return 'bg-muted text-muted-foreground line-through'
}

const formatBytes = (bytes) => {
  if (!bytes) return '—'
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(0) + ' MB'
  return (bytes / 1024).toFixed(0) + ' KB'
}

const copyReport = async () => {
  if (!detected.value) return
  const lines = [
    '=== GPU 检测报告（Util.cn 有条工具） ===',
    '识别显卡: ' + matchedLabel.value,
    '渲染器: ' + (detected.value.renderer || '未读取到'),
    'WebGPU: ' + (detected.value.webgpu ? '支持' : '不支持'),
    'CPU 核心: ' + (detected.value.cores || '未知'),
    '显存/统一内存: ' + (memoryGB.value || '未知') + ' GB',
    '模型可用内存: ' + usableGB.value + ' GB',
    '上下文长度: ' + contextLength.value,
    '--- 可流畅运行 ---',
    ...comfortable.value.map(r => r.name + '（Q4 约 ' + r.required.Q4_K_M + ' GB）'),
    '--- 可勉强运行 ---',
    ...tight.value.map(r => r.name + '（Q4 约 ' + r.required.Q4_K_M + ' GB）')
  ].join('\n')

  try {
    await navigator.clipboard.writeText(lines)
    alert('检测报告已复制到剪贴板')
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = lines
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('检测报告已复制到剪贴板')
  }
}
</script>
