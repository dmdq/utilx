<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Calculator class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">烘焙模具换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">蛋糕模具尺寸换算与配方等比缩放，圆模方模 4-12 寸全覆盖</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        手里只有 8 寸模具，配方却是 6 寸的怎么办？选择原模具与目标模具的形状和尺寸，工具按底面积（圆模 πr²、方模边长²）自动计算缩放系数，并把配方中的每种原料等比换算，附烘烤温度与时间的调整建议。默认内置戚风蛋糕示例配方，可自由增删原料行。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：模具选择 -->
      <div class="space-y-6">
        <!-- 原模具 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Cake class="w-5 h-5 mr-2 text-primary" /> 原模具（配方对应）
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">形状</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="s in shapeOptions"
                :key="'src-' + s.key"
                @click="srcShape = s.key"
                :class="srcShape === s.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ s.label }}</button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">尺寸</label>
            <div class="grid grid-cols-3 gap-1.5 mb-2">
              <button
                v-for="p in sizePresets"
                :key="'src-' + p.inch"
                @click="srcCm = p.cm"
                :class="srcCm === p.cm ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ p.inch }}寸</button>
            </div>
            <input
              v-model.number="srcCm"
              type="number"
              min="1"
              step="0.5"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">直径/边长 {{ srcCm }} cm（1 英寸 = 2.54 cm）</p>
          </div>

          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">原模具底面积</p>
            <p class="text-sm font-bold text-foreground">{{ fmtArea(srcArea) }} cm²</p>
          </div>
        </div>

        <!-- 目标模具 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ArrowRightLeft class="w-5 h-5 mr-2 text-primary" /> 目标模具（手上有的）
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">形状</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="s in shapeOptions"
                :key="'tgt-' + s.key"
                @click="tgtShape = s.key"
                :class="tgtShape === s.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ s.label }}</button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">尺寸</label>
            <div class="grid grid-cols-3 gap-1.5 mb-2">
              <button
                v-for="p in sizePresets"
                :key="'tgt-' + p.inch"
                @click="tgtCm = p.cm"
                :class="tgtCm === p.cm ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ p.inch }}寸</button>
            </div>
            <input
              v-model.number="tgtCm"
              type="number"
              min="1"
              step="0.5"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">直径/边长 {{ tgtCm }} cm</p>
          </div>

          <div class="bg-primary/10 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">缩放系数（目标面积 ÷ 原面积）</p>
            <p class="text-3xl font-bold text-primary">×{{ factor.toFixed(2) }}</p>
            <p class="text-xs text-primary mt-1">{{ fmtArea(srcArea) }} cm² → {{ fmtArea(tgtArea) }} cm²</p>
          </div>
        </div>
      </div>

      <!-- 中间：配方表 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <List class="w-5 h-5 mr-2 text-primary" /> 原配方原料
          </h2>
          <button
            @click="resetRecipe"
            class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80"
          >恢复示例</button>
        </div>

        <div class="space-y-2">
          <div v-for="(item, index) in ingredients" :key="index" class="flex items-center gap-2">
            <input
              v-model="item.name"
              type="text"
              placeholder="原料名"
              class="flex-1 min-w-0 px-2.5 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              v-model.number="item.amount"
              type="number"
              min="0"
              step="1"
              class="w-20 px-2.5 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              v-model="item.unit"
              class="w-16 px-1 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="g">g</option>
              <option value="个">个</option>
              <option value="ml">ml</option>
            </select>
            <button
              @click="removeIngredient(index)"
              class="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted transition-colors flex-shrink-0"
              aria-label="删除该行"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          @click="addIngredient"
          class="w-full py-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        >
          + 添加原料
        </button>

        <p class="text-xs text-muted-foreground leading-relaxed">
          默认为一个 6 寸戚风蛋糕的常见配方示例；鸡蛋按「个」计，换算结果支持小数并给出取整建议。换算假设模具高度一致，若深度差异较大还需微调。
        </p>
      </div>

      <!-- 右侧：换算结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <ClipboardList class="w-5 h-5 mr-2 text-primary" /> 换算后的配方
        </h2>

        <div class="space-y-2">
          <div
            v-for="(item, index) in ingredients"
            :key="'r' + index"
            class="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2.5"
          >
            <span class="text-sm text-foreground">{{ item.name || '原料 ' + (index + 1) }}</span>
            <span class="text-sm font-bold text-primary">
              {{ fmtAmount(item.amount * factor) }} {{ item.unit }}
              <span v-if="item.unit === '个' && item.amount > 0" class="text-[10px] text-muted-foreground font-normal ml-1">
                (原 {{ fmtAmount(item.amount) }}{{ item.unit }}，建议取整)
              </span>
            </span>
          </div>
          <div v-if="ingredients.length === 0" class="text-center text-muted-foreground py-8 text-sm">
            添加原料后自动换算
          </div>
        </div>

        <!-- 烘烤提示 -->
        <div v-if="factor > 1.5" class="bg-primary/10 rounded-lg p-4 text-xs text-primary leading-relaxed flex items-start gap-2">
          <AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>模具放大较多（系数 > 1.5）：建议烘烤温度降低约 10°C，时间延长 10-20 分钟，后期注意上色并多用竹签插入测试是否烤透，避免表面糊底面湿。</span>
        </div>
        <div v-else-if="factor < 0.67" class="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
          <AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>模具缩小较多：烘烤时间可缩短约四分之一到三分之一，温度可维持不变或提高约 10°C，提前观察上色避免烤过头。</span>
        </div>
        <div v-else class="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground leading-relaxed">
          模具尺寸接近：烘烤温度与时间基本不变，可在原方时间基础上前后几分钟内微调。
        </div>
      </div>
    </div>

    <!-- 常用模具对照表（可折叠） -->
    <div class="relative mb-8">
      <button
        @click="tableVisible = !tableVisible"
        class="w-full flex items-center justify-between bg-card border border-border rounded-lg px-6 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span class="font-semibold text-foreground flex items-center">
          <Table class="w-5 h-5 mr-2 text-primary" /> 常用模具底面积 / 换算系数对照表（以 6 寸圆模为基准）
        </span>
        <ChevronUp v-if="tableVisible" class="w-5 h-5 text-muted-foreground" />
        <ChevronDown v-else class="w-5 h-5 text-muted-foreground" />
      </button>
      <div v-show="tableVisible" class="bg-card border border-t-0 border-border rounded-b-lg p-6">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-muted-foreground border-b border-border">
                <th class="py-2 text-left font-medium">模具</th>
                <th class="py-2 text-right font-medium">直径/边长</th>
                <th class="py-2 text-right font-medium">底面积</th>
                <th class="py-2 text-right font-medium">换算系数</th>
                <th class="py-2 text-right font-medium">示例：鸡蛋 3 个 →</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in moldTable"
                :key="row.label"
                :class="row.label === moldLabel(srcShape, srcCm) || row.label === moldLabel(tgtShape, tgtCm) ? 'bg-primary/5' : ''"
                class="border-b border-border/40"
              >
                <td class="py-2 font-medium text-foreground">{{ row.label }}</td>
                <td class="py-2 text-right text-muted-foreground">{{ row.cm }} cm</td>
                <td class="py-2 text-right text-foreground font-mono">{{ fmtArea(row.area) }} cm²</td>
                <td class="py-2 text-right text-primary font-mono">×{{ row.factor.toFixed(2) }}</td>
                <td class="py-2 text-right text-muted-foreground">{{ fmtAmount(3 * row.factor) }} 个</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
          系数 = 该模具底面积 ÷ 6 寸圆模底面积（176.7 cm²）。圆模面积 = π×(直径/2)²，方模面积 = 边长²；方模同尺寸下面积约为圆模的 1.27 倍，圆转方时按面积换算即可。
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="seoContentVisible = !seoContentVisible"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>模具换算与配方缩放原理</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            烘焙配方的用量取决于模具的底面积而不是寸数：圆模面积 = π×(直径/2)²，方模面积 = 边长²。缩放系数 = 目标模具面积 ÷ 原模具面积，配方中每种原料等比乘以该系数即可。例如 6 寸圆模（15cm，约 176.7 cm²）换 8 寸圆模（20cm，约 314.2 cm²），系数约 1.78——6 寸方子里的 3 个鸡蛋就要换成约 5.3 个，面粉、糖、液体同理。
          </p>
          <h3 class="text-lg font-semibold text-foreground">换算后烘烤要调整什么</h3>
          <p>
            面积变化越大，烘烤参数越需要调整：系数大于 1.5 时，面糊更厚，建议温度降低约 10°C、时间延长 10-20 分钟；系数小于 0.67 时反向缩短时间。判断是否烤透永远以竹签测试为准——插入中心拔出无湿面糊即为烤好。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">鸡蛋按「个」怎么取整？</span>换算结果支持小数（如 5.3 个），小数部分不大时可打一个蛋搅匀后按比例取用；家常做法也可直接取整到相近整数，误差在 10% 以内一般不影响成败。</li>
            <li><span class="text-foreground font-medium">圆模换方模怎么算？</span>同样按面积换算，方模边长与圆模直径相同时面积约大 27%（15cm 方模 225 cm² 对 15cm 圆模 176.7 cm²），所以圆转方通常要按约 1.27 倍加料。</li>
            <li><span class="text-foreground font-medium">模具高度不同怎么办？</span>本工具按相同高度、底面积换算；若用更深的模具（如加高戚风模），面糊量还需按容积进一步上调并延长烘烤时间。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'cake-pan-converter'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Calculator, Cake, ArrowRightLeft, List, ClipboardList, AlertTriangle, Table, Trash2, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '烘焙模具换算器 - 蛋糕模具尺寸换算与配方等比缩放',
  description: '在线烘焙模具换算器，圆模方模4-12寸底面积换算，配方原料等比缩放，含戚风示例配方与烘烤温度时间调整建议，烤箱食谱必备，纯本地计算',
  keywords: '蛋糕模具换算, 烘焙换算器, 6寸8寸换算, 配方缩放, 烘焙计算器, 戚风蛋糕配方',
  author: 'Util工具箱',
  ogTitle: '烘焙模具换算器 - 有条工具',
  ogDescription: '蛋糕模具尺寸换算与配方等比缩放，圆模方模6-12寸全覆盖，烤箱食谱必配',
  ogUrl: 'https://www.util.cn/tools/cake-pan-converter',
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
          name: '烘焙模具换算器',
          url: 'https://www.util.cn/tools/cake-pan-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['圆模/方模底面积换算', '配方原料等比缩放', '鸡蛋按个支持小数', '常用模具系数对照表', '烘烤温度时间调整建议']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '烘焙模具换算器', item: 'https://www.util.cn/tools/cake-pan-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '6寸配方换8寸模具怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '按底面积换算：6寸圆模约176.7平方厘米，8寸圆模约314.2平方厘米，系数约1.78，所有原料用量乘以1.78（如3个鸡蛋换成约5.3个）。' }
            },
            {
              '@type': 'Question',
              name: '换算后烘烤温度时间要改吗？',
              acceptedAnswer: { '@type': 'Answer', text: '系数大于1.5时建议温度降低约10°C、时间延长10-20分钟；系数小于0.67时缩短时间。是否烤透以竹签测试为准。' }
            },
            {
              '@type': 'Question',
              name: '圆模和方模可以互换吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，按面积换算即可。同尺寸下方模面积约为圆模的1.27倍，圆转方需按比例增加原料。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'cake-pan-converter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 模具 ----------
const shapeOptions = [
  { key: 'round', label: '圆模' },
  { key: 'square', label: '方模' }
]

// 英寸 → 厘米预设（1 英寸 = 2.54 cm，取常用整数值）
const sizePresets = [
  { inch: 4, cm: 10 },
  { inch: 6, cm: 15 },
  { inch: 8, cm: 20 },
  { inch: 9, cm: 23 },
  { inch: 10, cm: 25 },
  { inch: 12, cm: 30 }
]

const srcShape = ref('round')
const srcCm = ref(15)
const tgtShape = ref('round')
const tgtCm = ref(20)

const moldArea = (shape, cm) => {
  const c = Math.max(0, cm)
  if (shape === 'square') return c * c
  return Math.PI * Math.pow(c / 2, 2)
}

const srcArea = computed(() => moldArea(srcShape.value, srcCm.value))
const tgtArea = computed(() => moldArea(tgtShape.value, tgtCm.value))
const factor = computed(() => (srcArea.value > 0 ? tgtArea.value / srcArea.value : 1))

const moldLabel = (shape, cm) => {
  const shapeText = shape === 'square' ? '方模' : '圆模'
  const preset = sizePresets.find(p => p.cm === cm)
  return preset ? `${preset.inch}寸${shapeText}` : `${cm}cm ${shapeText}`
}

const fmtArea = (v) => (isFinite(v) ? (Math.round(v * 10) / 10).toLocaleString('zh-CN') : '—')
const fmtAmount = (v) => {
  if (!isFinite(v)) return '—'
  const r = Math.round(v * 10) / 10
  return Number.isInteger(r) ? r.toLocaleString('zh-CN') : r.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

// ---------- 配方 ----------
const defaultRecipe = () => ([
  { name: '鸡蛋', amount: 5, unit: '个' },
  { name: '低筋面粉', amount: 85, unit: 'g' },
  { name: '牛奶', amount: 40, unit: 'g' },
  { name: '玉米油', amount: 40, unit: 'g' },
  { name: '细砂糖', amount: 60, unit: 'g' }
])

const ingredients = ref(defaultRecipe())

const addIngredient = () => {
  ingredients.value.push({ name: '', amount: 0, unit: 'g' })
}

const removeIngredient = (index) => {
  ingredients.value.splice(index, 1)
}

const resetRecipe = () => {
  ingredients.value = defaultRecipe()
}

// ---------- 对照表（以 6 寸圆模为基准） ----------
const baseArea = moldArea('round', 15)
const tableVisible = ref(false)
const seoContentVisible = ref(true)

const moldTable = computed(() => {
  const rows = []
  for (const p of sizePresets) {
    const area = moldArea('round', p.cm)
    rows.push({ label: `${p.inch}寸圆模`, cm: p.cm, area, factor: area / baseArea })
  }
  for (const p of sizePresets) {
    const area = moldArea('square', p.cm)
    rows.push({ label: `${p.inch}寸方模`, cm: p.cm, area, factor: area / baseArea })
  }
  return rows
})
</script>
