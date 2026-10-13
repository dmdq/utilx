<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Cpu class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电源功率计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">选 CPU/GPU 型号估整机功耗，加余量自动推荐电源瓦数档</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        装机买电源最怕算不准：小了撞墙重启，大了白花钱。选择 CPU 与显卡型号（内置公开标称上限口径的静态功耗表），再填内存、硬盘、风扇数量，工具会给出各部件功耗明细与整机估算，并按 20% / 30% 余量向上取档推荐电源瓦数（550 / 650 / 750 / 850 / 1000 / 1200 / 1500W）。全部计算在浏览器本地完成。注：功耗为公开标称上限口径（Intel PL2/PPT、AMD PPT、GPU TGP），实际游戏负载通常更低。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Cpu class="w-5 h-5 mr-2 text-primary" /> 硬件配置
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">CPU 型号</label>
          <select
            v-model="cpuId"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <optgroup label="Intel">
              <option v-for="c in cpuOptions('intel')" :key="c.id" :value="c.id">{{ c.label }}（{{ c.watt }}W）</option>
            </optgroup>
            <optgroup label="AMD">
              <option v-for="c in cpuOptions('amd')" :key="c.id" :value="c.id">{{ c.label }}（{{ c.watt }}W）</option>
            </optgroup>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">显卡型号</label>
          <select
            v-model="gpuId"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <optgroup label="NVIDIA GeForce">
              <option v-for="g in gpuOptions('nvidia')" :key="g.id" :value="g.id">{{ g.label }}（{{ g.watt }}W）</option>
            </optgroup>
            <optgroup label="AMD Radeon">
              <option v-for="g in gpuOptions('amd')" :key="g.id" :value="g.id">{{ g.label }}（{{ g.watt }}W）</option>
            </optgroup>
            <option value="igpu">无独立显卡（核显输出）（0W）</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">内存条数（5W/条）</label>
            <input
              v-model.number="ramSticks"
              type="number"
              min="0"
              max="8"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">SATA/NVMe SSD 数（5W/块）</label>
            <input
              v-model.number="ssdCount"
              type="number"
              min="0"
              max="12"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">机械硬盘数（9W/块）</label>
            <input
              v-model.number="hddCount"
              type="number"
              min="0"
              max="12"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">机箱风扇数（3W/把）</label>
            <input
              v-model.number="fanCount"
              type="number"
              min="0"
              max="12"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">安全余量</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="headroom = 20"
              :class="headroom === 20 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >20%（均衡）</button>
            <button
              @click="headroom = 30"
              :class="headroom === 30 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >30%（推荐）</button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">余量覆盖瞬时功耗峰值（transient spike）与老化降额，高端显卡建议 30%</p>
        </div>
      </div>

      <!-- 右侧：结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Zap class="w-5 h-5 mr-2 text-primary" /> 功耗估算
        </h2>

        <!-- 明细 -->
        <div class="text-sm">
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground flex items-center gap-2"><Cpu class="w-4 h-4" /> CPU（{{ cpuName }}）</span>
            <span class="text-foreground font-medium">{{ cpuW }}W</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground flex items-center gap-2"><Monitor class="w-4 h-4" /> 显卡（{{ gpuName }}）</span>
            <span class="text-foreground font-medium">{{ gpuW }}W</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground flex items-center gap-2"><MemoryStick class="w-4 h-4" /> 内存 {{ ramSticks }} 条</span>
            <span class="text-foreground font-medium">{{ result.ram }}W</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground flex items-center gap-2"><HardDrive class="w-4 h-4" /> SSD {{ ssdCount }} 块 + HDD {{ hddCount }} 块</span>
            <span class="text-foreground font-medium">{{ result.ssd + result.hdd }}W</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <span class="text-muted-foreground flex items-center gap-2"><Fan class="w-4 h-4" /> 风扇 {{ fanCount }} 把</span>
            <span class="text-foreground font-medium">{{ result.fans }}W</span>
          </div>
        </div>

        <!-- 整机估算 -->
        <div class="bg-muted/50 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">整机估算功耗（标称上限口径）</p>
          <p class="text-2xl font-bold text-foreground">{{ result.total }}W</p>
          <p class="text-xs text-muted-foreground mt-1">加 {{ headroom }}% 余量后至少需要 {{ result.required }}W</p>
        </div>

        <!-- 推荐电源档 -->
        <div class="bg-primary/10 rounded-lg p-5 text-center">
          <p class="text-xs text-muted-foreground mb-1">推荐电源档位</p>
          <p class="text-3xl font-bold text-primary">{{ result.tier }}W</p>
          <p class="text-xs text-muted-foreground mt-1.5">
            {{ result.overTier ? `已超出最高档位，建议多卡/ workstation 平台定制方案` : `按 ${result.required}W 需求向上取档（550/650/750/850/1000/1200/1500W）` }}
          </p>
        </div>

        <!-- 核显模式提示 -->
        <div v-if="gpuId === 'igpu'" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
          <Zap class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>当前为核显输出模式（无独立显卡）：整机功耗很低，550W 档已有充足余量，迷你主机平台甚至可选更小瓦数的 SFX 电源。</span>
        </div>

        <!-- 口径说明 -->
        <div class="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
          <AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            功耗为公开标称上限口径：CPU 取 Intel PL2 / AMD PPT，显卡取 TGP，实际游戏与创作负载通常更低。
            超频、高负载渲染会进一步接近上限；RTX 40/50 系显卡存在毫秒级瞬时功耗尖峰，配置 30% 余量并选择一线品牌电源更稳妥。结果仅供参考。
          </span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于电源功率计算器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            电源是整机稳定性的地基。本工具内置 ≥16 款 CPU 与 ≥14 款显卡的公开标称功耗（CPU 取 Intel PL2 / AMD PPT 上限口径，显卡取 TGP），加上内存（5W/条）、SSD（5W/块）、机械硬盘（9W/块）、风扇（3W/把）的常规估算，得出整机功耗上限，再按余量档向上取推荐瓦数。所有数据为内置静态表，计算纯本地完成。
          </p>

          <h3 class="text-lg font-semibold text-foreground">为什么要留 20%-30% 余量</h3>
          <p>
            一是瞬时功耗尖峰：RTX 40/50 系等高端显卡在毫秒级负载突变时功耗可能瞬间远超 TGP，余量不足会触发过载保护重启；二是转换效率：电源在 50%-80% 负载区间效率最高、风扇噪音最低；三是老化降额：电容老化后实际输出能力会缓慢下降。30% 余量是装机社区的主流建议。
          </p>

          <h3 class="text-lg font-semibold text-foreground">功耗口径怎么看</h3>
          <p>
            Intel 处理器标称的 TDP 是基础功率（PL1），短时爆发受 PL2 限制，i7/i9 K 系列的 PL2 普遍达 253W；AMD 处理器按 PPT（Package Power Tracking）上限计，如 R7 9700X TDP 65W 但 PPT 为 88W。显卡功耗即厂商公布的 TGP（Total Graphics Power）。本工具统一采用「标称上限」口径估算，因此比实际游戏功耗偏高——按它买电源只会更稳不会翻车。
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">不装独立显卡需要多大电源？</span>核显平台整机负载通常不足 150W，550W 档已有极大余量，迷你平台可选更小瓦数；但仍建议不要低于 400W，为硬盘扩展和电源效率区间留余地。</li>
            <li><span class="text-foreground font-medium">超频用户怎么算？</span>超频会突破标称上限，建议在估算结果上额外再加 10%-20%，并优先选择高规格供电（如 ATX 3.0/3.1、原生 12V-2x6 接口）的电源。</li>
            <li><span class="text-foreground font-medium">推荐档位为什么固定那几档？</span>550/650/750/850/1000/1200/1500W 是主流电源市场的标准瓦数档，向上取档能保证买得到的电源一定覆盖需求。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'psu-wattage-calculator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Cpu, Monitor, MemoryStick, HardDrive, Fan, Zap, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '电源功率计算器 - 整机功耗估算与电源瓦数推荐',
  description: '在线电源功率计算器：内置 16+ 款 CPU 与 14+ 款显卡标称功耗表，估算整机功耗并按 20%/30% 余量推荐 550-1500W 电源档位，支持核显模式提示，纯本地计算',
  keywords: '电源功率计算器, 装机电源推荐, 整机功耗估算, 电源瓦数, psu calculator, 显卡功耗',
  author: 'Util工具箱',
  ogTitle: '电源功率计算器 - 有条工具',
  ogDescription: '选 CPU/GPU 型号自动估整机功耗，加余量推荐电源瓦数档',
  ogUrl: 'https://www.util.cn/tools/psu-wattage-calculator',
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
          name: '电源功率计算器',
          url: 'https://www.util.cn/tools/psu-wattage-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['16+ 款 CPU 功耗表（PL2/PPT 口径）', '14+ 款显卡 TGP 功耗表', '整机功耗明细', '20%/30% 余量档位', '550-1500W 标准档向上取档', '核显模式提示']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '电源功率计算器', item: 'https://www.util.cn/tools/psu-wattage-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么推荐留 20%-30% 余量？',
              acceptedAnswer: { '@type': 'Answer', text: '覆盖显卡毫秒级瞬时功耗尖峰、让电源运行在高效率区间、并为电源老化降额留出空间，30% 是装机社区的主流建议。' }
            },
            {
              '@type': 'Question',
              name: '功耗数据是什么口径？',
              acceptedAnswer: { '@type': 'Answer', text: 'CPU 取 Intel PL2 / AMD PPT 标称上限，显卡取厂商公布的 TGP，为公开标称上限口径，实际游戏负载通常更低。' }
            },
            {
              '@type': 'Question',
              name: '不装独立显卡需要多大电源？',
              acceptedAnswer: { '@type': 'Answer', text: '核显平台整机负载通常不足 150W，550W 档已有充足余量，迷你主机平台可选更小瓦数，但不建议低于 400W。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'psu-wattage-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ===== [PURE-START] 功耗静态表与计算纯函数（可独立提取测试） =====
// CPU 功耗表：Intel 取 PL2 / AMD 取 PPT（标称上限口径）
const CPU_LIST = [
  { id: 'i5-12600k', brand: 'intel', label: 'Intel i5-12600K', watt: 150 },
  { id: 'i7-12700k', brand: 'intel', label: 'Intel i7-12700K', watt: 190 },
  { id: 'i9-12900k', brand: 'intel', label: 'Intel i9-12900K', watt: 241 },
  { id: 'i5-13600k', brand: 'intel', label: 'Intel i5-13600K', watt: 181 },
  { id: 'i7-13700k', brand: 'intel', label: 'Intel i7-13700K', watt: 253 },
  { id: 'i9-13900k', brand: 'intel', label: 'Intel i9-13900K', watt: 253 },
  { id: 'i5-14600k', brand: 'intel', label: 'Intel i5-14600K', watt: 181 },
  { id: 'i7-14700k', brand: 'intel', label: 'Intel i7-14700K', watt: 253 },
  { id: 'i9-14900k', brand: 'intel', label: 'Intel i9-14900K', watt: 253 },
  { id: 'ultra5-245k', brand: 'intel', label: 'Intel Ultra 5 245K', watt: 159 },
  { id: 'ultra7-265k', brand: 'intel', label: 'Intel Ultra 7 265K', watt: 250 },
  { id: 'ultra9-285k', brand: 'intel', label: 'Intel Ultra 9 285K', watt: 250 },
  { id: 'r5-7500f', brand: 'amd', label: 'AMD R5 7500F', watt: 88 },
  { id: 'r5-7600', brand: 'amd', label: 'AMD R5 7600', watt: 88 },
  { id: 'r5-7600x', brand: 'amd', label: 'AMD R5 7600X', watt: 142 },
  { id: 'r7-7700x', brand: 'amd', label: 'AMD R7 7700X', watt: 142 },
  { id: 'r7-7800x3d', brand: 'amd', label: 'AMD R7 7800X3D', watt: 120 },
  { id: 'r9-7900x', brand: 'amd', label: 'AMD R9 7900X', watt: 230 },
  { id: 'r9-7950x', brand: 'amd', label: 'AMD R9 7950X', watt: 230 },
  { id: 'r7-9700x', brand: 'amd', label: 'AMD R7 9700X', watt: 88 },
  { id: 'r7-9800x3d', brand: 'amd', label: 'AMD R7 9800X3D', watt: 120 },
  { id: 'r9-9900x', brand: 'amd', label: 'AMD R9 9900X', watt: 162 },
  { id: 'r9-9950x', brand: 'amd', label: 'AMD R9 9950X', watt: 230 }
]

// 显卡功耗表：TGP（标称上限口径）
const GPU_LIST = [
  { id: 'rtx4060', brand: 'nvidia', label: 'RTX 4060', watt: 115 },
  { id: 'rtx4060ti', brand: 'nvidia', label: 'RTX 4060 Ti', watt: 160 },
  { id: 'rtx4070', brand: 'nvidia', label: 'RTX 4070', watt: 200 },
  { id: 'rtx4070s', brand: 'nvidia', label: 'RTX 4070 Super', watt: 220 },
  { id: 'rtx4070ti', brand: 'nvidia', label: 'RTX 4070 Ti', watt: 285 },
  { id: 'rtx4080', brand: 'nvidia', label: 'RTX 4080 / 4080 Super', watt: 320 },
  { id: 'rtx4090', brand: 'nvidia', label: 'RTX 4090', watt: 450 },
  { id: 'rtx5060', brand: 'nvidia', label: 'RTX 5060', watt: 145 },
  { id: 'rtx5060ti', brand: 'nvidia', label: 'RTX 5060 Ti', watt: 180 },
  { id: 'rtx5070', brand: 'nvidia', label: 'RTX 5070', watt: 250 },
  { id: 'rtx5070ti', brand: 'nvidia', label: 'RTX 5070 Ti', watt: 300 },
  { id: 'rtx5080', brand: 'nvidia', label: 'RTX 5080', watt: 360 },
  { id: 'rtx5090', brand: 'nvidia', label: 'RTX 5090', watt: 575 },
  { id: 'rx7600', brand: 'amd', label: 'RX 7600', watt: 165 },
  { id: 'rx7800xt', brand: 'amd', label: 'RX 7800 XT', watt: 263 },
  { id: 'rx7900gre', brand: 'amd', label: 'RX 7900 GRE', watt: 260 },
  { id: 'rx7900xt', brand: 'amd', label: 'RX 7900 XT', watt: 315 },
  { id: 'rx7900xtx', brand: 'amd', label: 'RX 7900 XTX', watt: 355 },
  { id: 'rx9070', brand: 'amd', label: 'RX 9070', watt: 220 },
  { id: 'rx9070xt', brand: 'amd', label: 'RX 9070 XT', watt: 304 }
]

// 主流电源标准瓦数档
const PSU_TIERS = [550, 650, 750, 850, 1000, 1200, 1500]

// 计算整机功耗与推荐档位
function calcPsu(opts) {
  const cpu = Math.max(0, opts.cpuW || 0)
  const gpu = Math.max(0, opts.gpuW || 0)
  const ram = Math.max(0, opts.ram || 0) * 5
  const ssd = Math.max(0, opts.ssd || 0) * 5
  const hdd = Math.max(0, opts.hdd || 0) * 9
  const fans = Math.max(0, opts.fans || 0) * 3
  const total = cpu + gpu + ram + ssd + hdd + fans
  const required = Math.ceil(total * (1 + (opts.headroomPercent || 0) / 100))
  const tier = PSU_TIERS.find(t => t >= required) || PSU_TIERS[PSU_TIERS.length - 1]
  const overTier = required > PSU_TIERS[PSU_TIERS.length - 1]
  return { cpu, gpu, ram, ssd, hdd, fans, total, required, tier, overTier }
}
// ===== [PURE-END] =====

// ---------- 状态 ----------
const cpuId = ref('i7-14700k')
const gpuId = ref('rtx4090')
const ramSticks = ref(2)
const ssdCount = ref(2)
const hddCount = ref(0)
const fanCount = ref(3)
const headroom = ref(30)
const seoContentVisible = ref(true)

const cpuOptions = (brand) => CPU_LIST.filter(c => c.brand === brand)
const gpuOptions = (brand) => GPU_LIST.filter(g => g.brand === brand)

const cpuItem = computed(() => CPU_LIST.find(c => c.id === cpuId.value) || CPU_LIST[0])
const gpuItem = computed(() => GPU_LIST.find(g => g.id === gpuId.value))

const cpuName = computed(() => cpuItem.value.label)
const cpuW = computed(() => cpuItem.value.watt)
const gpuName = computed(() => (gpuId.value === 'igpu' ? '核显输出' : (gpuItem.value ? gpuItem.value.label : '无')))
const gpuW = computed(() => (gpuId.value === 'igpu' ? 0 : (gpuItem.value ? gpuItem.value.watt : 0)))

const result = computed(() => calcPsu({
  cpuW: cpuW.value,
  gpuW: gpuW.value,
  ram: ramSticks.value,
  ssd: ssdCount.value,
  hdd: hddCount.value,
  fans: fanCount.value,
  headroomPercent: headroom.value
}))

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
