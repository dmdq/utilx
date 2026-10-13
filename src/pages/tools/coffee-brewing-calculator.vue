<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Droplet class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">咖啡冲煮计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">粉水比互算 + 按烘焙度给水温研磨度与三段式注水时间线</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入粉量或水量即可按比例互算（1:14 ~ 1:17 可调），并根据烘焙度给出建议水温与研磨度；同时生成手冲三段式注水时间线：闷蒸、第一段至 40%、第二段至 70%、第三段注满，各段克数一目了然。以下参数均为冲煮建议起点，可按豆子与口味微调。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center text-foreground">
          <Coffee class="w-5 h-5 mr-2 text-primary" /> 冲煮参数
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">换算方向</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="inputMode = 'dose'"
              :class="inputMode === 'dose' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >按粉量算水量</button>
            <button
              @click="inputMode = 'water'"
              :class="inputMode === 'water' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >按水量算粉量</button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            {{ inputMode === 'dose' ? '粉量（克）' : '水量（克）' }}
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="amount"
              type="number"
              min="0"
              step="0.5"
              class="flex-1 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-sm text-muted-foreground">g</span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            粉水比：<span class="text-primary">1 : {{ ratio }}</span>
          </label>
          <input
            v-model.number="ratio"
            type="range"
            min="14"
            max="17"
            step="1"
            class="w-full accent-primary"
          />
          <div class="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1:14 浓郁</span>
            <span>1:16 均衡</span>
            <span>1:17 清淡</span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">烘焙度</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="r in roasts"
              :key="r.key"
              @click="roastKey = r.key"
              :class="roastKey === r.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >{{ r.label }}</button>
          </div>
        </div>
      </div>

      <!-- 输出区 -->
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-card border border-border rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">{{ inputMode === 'dose' ? '建议水量' : '建议粉量' }}</p>
            <p class="text-3xl font-bold text-primary">
              {{ inputMode === 'dose' ? fmt(brew.water) : fmt(brew.dose) }}
              <span class="text-base font-medium text-muted-foreground">g</span>
            </p>
            <p class="text-xs text-muted-foreground mt-1">比例 1 : {{ ratio }}，可按壶具容量取整</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">{{ inputMode === 'dose' ? '对应粉量' : '对应水量' }}</p>
            <p class="text-3xl font-bold text-foreground">
              {{ inputMode === 'dose' ? fmt(brew.dose) : fmt(brew.water) }}
              <span class="text-base font-medium text-muted-foreground">g</span>
            </p>
            <p class="text-xs text-muted-foreground mt-1">闷蒸建议 {{ fmt(brew.bloom) }} g（粉量 × 2.5）</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-card border border-border rounded-lg p-5">
            <p class="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Thermometer class="w-3.5 h-3.5" /> 建议水温（{{ activeRoast.label }}）</p>
            <p class="text-2xl font-bold text-foreground">{{ activeRoast.temp }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ activeRoast.tempNote }}</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-5">
            <p class="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Scale class="w-3.5 h-3.5" /> 建议研磨度</p>
            <p class="text-2xl font-bold text-foreground">{{ activeRoast.grind }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ activeRoast.grindNote }}</p>
          </div>
        </div>

        <!-- 三段式注水时间线 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Timer class="w-4 h-4 text-primary" /> 三段式注水时间线（建议）
          </h3>
          <div class="space-y-2.5">
            <div v-for="(seg, i) in timeline" :key="i" class="flex items-start gap-3">
              <div class="w-28 flex-shrink-0">
                <span class="text-xs font-mono text-muted-foreground">{{ seg.time }}</span>
              </div>
              <div class="flex-1 flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="seg.cls">{{ seg.label }}</span>
                <span class="text-sm text-foreground">{{ seg.text }}</span>
              </div>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            闷蒸水量按粉量 2.5 倍计算；三段目标分别到总水量的 40%、70%、100%，克数按当前水量自动换算，注水时以电子秤读数为准。
          </p>
        </div>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        免责声明：水温、研磨度与注水时间线均为通用"冲煮建议"起点，实际风味受豆子新鲜度、水质、器具与个人口味影响较大，请以此为基准按杯测结果微调；现磨咖啡建议在烘焙后 7-30 天的赏味期内饮用。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于手冲咖啡冲煮参数</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            手冲咖啡的核心变量只有四个：粉水比、水温、研磨度与注水节奏。固定其中三个、只调一个，就能稳定复现一杯好咖啡。本工具按通用手冲（V60 类锥形滤杯）给出建议起点，适合入门与日常校准。
          </p>
          <h3 class="text-lg font-semibold text-foreground">粉水比怎么选</h3>
          <p>
            1:14 ~ 1:15 偏浓郁，适合深烘与加奶场景；1:16 是最通用的均衡比例；1:17 偏清淡，适合浅烘大容量出品。粉量换算示例：15g 粉按 1:16 对应 240g 水，一人份手冲常见粉量为 15-20g。
          </p>
          <h3 class="text-lg font-semibold text-foreground">水温与烘焙度的关系</h3>
          <p>
            浅烘豆密度高、物质难萃取，需要 92-94°C 的较高水温把酸质与花香带出来；中烘 88-92°C 均衡萃取；深烘物质易萃取，84-88°C 配合中粗研磨可减少苦涩与烟熏感。没有温控壶时，热水开盖静置约 1 分钟约降 2-3°C，仅供参考。
          </p>
          <h3 class="text-lg font-semibold text-foreground">三段式注水的作用</h3>
          <p>
            闷蒸（粉量 2.5 倍水，约 30 秒）让咖啡粉排气均匀浸湿；第一段注到总水量 40%，建立主流率；第二段到 70%、第三段注满则控制流速与浸泡时间，避免一次注满导致萃取不均。整段流程约 1 分 50 秒到 2 分 30 秒，以秤读数为准即可。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">没有电子秤怎么办？</span>可以用量杯估算水量（1 克水约 1 毫升），但粉量强烈建议用秤，1-2 克的偏差就能明显改变浓淡。</li>
            <li><span class="text-foreground font-medium">闷蒸要注多少水？</span>通用建议为粉量的 2-2.5 倍，本工具按 2.5 倍计算，注水后轻轻绕圈让粉层均匀浸湿，静候约 30 秒。</li>
            <li><span class="text-foreground font-medium">时间线要严格卡点吗？</span>不必。各段时间是"建议"节奏，重点是总水量的分段目标与稳定绕圈，流速差异通过调整研磨度修正。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'coffee-brewing-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Droplet, Coffee, Thermometer, Scale, Timer, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '咖啡冲煮计算器 - 粉水比互算/水温研磨度/注水时间线',
  description: '在线咖啡冲煮计算器，粉量水量按 1:14~1:17 比例互算，按烘焙度给出建议水温（浅 92-94/中 88-92/深 84-88°C）与研磨度，自动生成三段式注水时间线（闷蒸/40%/70%/注满），纯本地计算',
  keywords: '咖啡粉水比, 手冲咖啡比例, 冲煮计算, 咖啡注水, 手冲参数, 咖啡水温, 研磨度建议',
  author: 'Util工具箱',
  ogTitle: '咖啡冲煮计算器 - 有条工具',
  ogDescription: '粉水比互算，按烘焙度给水温研磨度建议与三段式注水时间线',
  ogUrl: 'https://www.util.cn/tools/coffee-brewing-calculator',
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
          name: '咖啡冲煮计算器',
          url: 'https://www.util.cn/tools/coffee-brewing-calculator',
          applicationCategory: 'LifestyleApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['粉量/水量互算', '1:14~1:17 比例滑条', '按烘焙度建议水温与研磨度', '三段式注水时间线', '闷蒸水量计算']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '咖啡冲煮计算器', item: 'https://www.util.cn/tools/coffee-brewing-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '没有电子秤怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '水量可用量杯估算（1 克水约 1 毫升），但粉量建议务必用秤，1-2 克偏差即可明显改变浓淡。' }
            },
            {
              '@type': 'Question',
              name: '闷蒸要注多少水？',
              acceptedAnswer: { '@type': 'Answer', text: '通用建议为粉量的 2-2.5 倍，本工具按 2.5 倍计算，注水绕圈均匀浸湿后静候约 30 秒。' }
            },
            {
              '@type': 'Question',
              name: '注水时间线要严格卡点吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不必，时间为建议节奏，重点是分段水量目标与稳定绕圈，流速问题通过调整研磨度修正。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'coffee-brewing-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 冲煮计算（独立纯函数，便于测试） ----------
// 三段式：闷蒸 = 粉量×2.5g；第一段至总水量 40%，第二段至 70%，第三段注满
function computeBrew(dose, ratio) {
  const safeDose = dose > 0 ? dose : 0
  const safeRatio = ratio >= 10 && ratio <= 20 ? ratio : 16
  const water = safeDose * safeRatio
  const bloom = safeDose * 2.5
  const s1 = water * 0.4
  const s2 = water * 0.7
  return {
    dose: safeDose,
    ratio: safeRatio,
    water,
    bloom,
    stages: [
      { to: s1, pour: s1 - bloom },
      { to: s2, pour: s2 - s1 },
      { to: water, pour: water - s2 }
    ]
  }
}

// ---------- 烘焙度建议 ----------
const roasts = [
  { key: 'light', label: '浅烘', temp: '92-94°C', tempNote: '高温提升萃取率，突出花果酸质', grind: '中细', grindNote: '流速稍慢，避免萃取不足发尖酸' },
  { key: 'medium', label: '中烘', temp: '88-92°C', tempNote: '均衡萃取，酸甜苦平衡', grind: '中', grindNote: '通用研磨，接近细砂糖颗粒' },
  { key: 'dark', label: '深烘', temp: '84-88°C', tempNote: '低温抑制苦涩与烟熏感', grind: '中粗', grindNote: '加快流速，避免过萃发苦' }
]

// ---------- 页面状态 ----------
const inputMode = ref('dose')
const amount = ref(15)
const ratio = ref(16)
const roastKey = ref('medium')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const fmt = (v) => (isFinite(v) ? String(Math.round(v * 10) / 10) : '—')

const activeRoast = computed(() => roasts.find(r => r.key === roastKey.value) || roasts[1])

const safeAmount = computed(() => {
  const a = amount.value
  return isFinite(a) && a > 0 ? a : 0
})

const brew = computed(() => {
  if (inputMode.value === 'dose') return computeBrew(safeAmount.value, ratio.value)
  const water = safeAmount.value
  const dose = ratio.value > 0 ? Math.round((water / ratio.value) * 10) / 10 : 0
  return computeBrew(dose, ratio.value)
})

const timeline = computed(() => {
  const b = brew.value
  return [
    {
      label: '闷蒸',
      time: '0:00-0:30',
      cls: 'bg-primary/10 text-primary',
      text: `注入 ${fmt(b.bloom)} g（粉量 ×2.5），绕圈浸湿全部粉层后静候排气`
    },
    {
      label: '第一段',
      time: '0:30-1:10',
      cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      text: `稳定绕圈注水至秤读数 ${fmt(b.stages[0].to)} g（本段 ${fmt(b.stages[0].pour)} g，总水量 40%）`
    },
    {
      label: '第二段',
      time: '1:10-1:30',
      cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      text: `继续注水至 ${fmt(b.stages[1].to)} g（本段 ${fmt(b.stages[1].pour)} g，总水量 70%）`
    },
    {
      label: '第三段',
      time: '1:30-1:50',
      cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      text: `一次性注满至 ${fmt(b.stages[2].to)} g（本段 ${fmt(b.stages[2].pour)} g），等待滤完`
    }
  ]
})
</script>
