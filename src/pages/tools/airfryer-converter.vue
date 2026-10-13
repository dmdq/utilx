<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Flame class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">空气炸锅换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">烤箱菜谱一键换算（降 15°C、时间×0.75），内置常见食材对照表</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        空气炸锅靠热风循环与小空间聚热，效率普遍高于烤箱。把烤箱菜谱的温度降低约 15°C、时间缩短至 75%，即可作为空气炸锅的参考起点；不确定的话可直接查内置的 10 类常见食材对照表。所有时间为建议参考值，请以实际成色为准。
      </p>
    </div>

    <!-- 模式切换 -->
    <div class="flex gap-2 mb-4">
      <button
        @click="activeMode = 'formula'"
        :class="activeMode === 'formula' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
      >公式换算</button>
      <button
        @click="activeMode = 'table'"
        :class="activeMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
      >常见食材对照表</button>
    </div>

    <!-- 公式换算 -->
    <div v-if="activeMode === 'formula'" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center text-foreground">
          <Thermometer class="w-5 h-5 mr-2 text-primary" /> 烤箱菜谱参数
        </h2>
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">烤箱温度（°C）</label>
          <input
            v-model.number="ovenTemp"
            type="number"
            min="0"
            max="300"
            step="5"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">烤箱时间（分钟）</label>
          <input
            v-model.number="ovenTime"
            type="number"
            min="0"
            max="300"
            step="1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          换算规则：空气炸锅温度 = 烤箱温度 − 15°C；时间 = 烤箱时间 × 0.75。这是社区总结的经验起点，不同品牌功率有差异。
        </p>
      </div>

      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center text-foreground mb-4">
          <ArrowRightLeft class="w-5 h-5 mr-2 text-primary" /> 空气炸锅建议
        </h2>
        <div v-if="conversion" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">炸锅温度</p>
              <p class="text-2xl font-bold text-primary">{{ conversion.temp }}°C</p>
              <p class="text-[10px] text-muted-foreground mt-1">烤箱 {{ conversion.ovenTemp }}°C − 15</p>
            </div>
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">炸锅时间</p>
              <p class="text-2xl font-bold text-primary">{{ conversion.time }} 分</p>
              <p class="text-[10px] text-muted-foreground mt-1">烤箱 {{ conversion.ovenTime }} 分 × 0.75</p>
            </div>
          </div>
          <div class="bg-muted/50 rounded-lg p-4 text-center">
            <p class="text-sm text-muted-foreground">建议参考区间</p>
            <p class="text-lg font-bold text-foreground mt-1">{{ conversion.timeLow }} – {{ conversion.timeHigh }} 分钟</p>
            <p class="text-xs text-muted-foreground mt-1">首次制作建议取下限，中途观察上色情况</p>
          </div>
        </div>
        <div v-else class="p-8 text-center text-muted-foreground text-sm">
          请输入大于 0 的烤箱温度与时间开始换算
        </div>
      </div>
    </div>

    <!-- 对照表 -->
    <div v-else class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 class="text-lg font-semibold flex items-center text-foreground">
          <UtensilsCrossed class="w-5 h-5 mr-2 text-primary" /> 常见食材空气炸锅对照表
        </h2>
        <div class="relative sm:w-64">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            v-model="tableQuery"
            type="text"
            placeholder="搜索食材，如：鸡翅"
            class="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-muted-foreground border-b border-border">
              <th class="py-2 pr-3 font-medium">食材</th>
              <th class="py-2 pr-3 font-medium">建议温度</th>
              <th class="py-2 pr-3 font-medium">建议时间</th>
              <th class="py-2 font-medium">小贴士</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredPresets" :key="p.name" class="border-b border-border/50 hover:bg-muted/50 transition-colors">
              <td class="py-2.5 pr-3 font-medium text-foreground">{{ p.name }}</td>
              <td class="py-2.5 pr-3 text-muted-foreground">{{ p.temp }}°C</td>
              <td class="py-2.5 pr-3 text-muted-foreground">{{ p.time }}</td>
              <td class="py-2.5 text-muted-foreground text-xs">{{ p.tip }}</td>
            </tr>
            <tr v-if="filteredPresets.length === 0">
              <td colspan="4" class="py-6 text-center text-muted-foreground">没有找到匹配的食材，试试其他关键词</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 使用建议 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-card border border-border rounded-lg p-4">
        <h3 class="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <Info class="w-4 h-4 text-primary" /> 4L 以下建议分批
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">小容量炸锅一次装太多会让热风循环变差、受热不均，宁可分两批，也不要堆满一锅。</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <h3 class="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <Timer class="w-4 h-4 text-primary" /> 先预热 3 分钟
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">提前空烧 3 分钟再放食材，表面能更快脱水定型，更接近换算的参考时间。</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <h3 class="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <UtensilsCrossed class="w-4 h-4 text-primary" /> 单层平铺不重叠
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">食材重叠的区域热风吹不到，容易外焦里生；大件食材（整鸡、鸡腿）建议中途翻面一次。</p>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        免责声明：换算公式与对照表均为经验性"建议参考值"，不同品牌空气炸锅的功率、容量与温控差异较大，请以实际成色（色泽、内部熟度）为准，必要时用食品温度计确认中心温度；含生肉、蛋类食材请确保彻底熟透。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于烤箱转空气炸锅</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            空气炸锅本质上是一台顶部送风的小型对流烤箱：腔体小、热风贴着食材表面高速循环，升温快、脱水快。因此同样的菜谱，空气炸锅通常需要更低的温度、更短的时间。"温度 −15°C、时间 ×0.75"是最常用的经验换算起点。
          </p>
          <h3 class="text-lg font-semibold text-foreground">换算公式的原理</h3>
          <p>
            烤箱靠静态热辐射与自然对流加热，升温慢、效率低；空气炸锅的小腔体让单位食材面积的受热强度大幅提高。降 15°C 是为了抵消表面过度上色，缩到 75% 时间则对应整体加热效率的提升。首次按换算值制作时建议提前 2-3 分钟观察，宁可欠火再加时。
          </p>
          <h3 class="text-lg font-semibold text-foreground">哪些情况不适合直接换算</h3>
          <p>
            挂糊类（面衣、面包糠）在强热风下容易飞溅与焦化，建议喷油定型后低温慢烤；大块整鸡等厚食材中心升温慢，换算时间可能偏短，需延长并翻面；蛋糕、舒芙蕾等对温度敏感的烘焙，建议按 10°C 递减逐步试。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">空气炸锅需要预热吗？</span>建议预热 3 分钟。预热能让食材表面迅速脱水定型，成品更接近对照表的参考时间与口感。</li>
            <li><span class="text-foreground font-medium">换算后不熟怎么办？</span>换算值只是起点，受食材厚度与初始温度影响较大。不熟可加 180°C 续烤 3-5 分钟观察；含肉类请确认中心熟透再食用。</li>
            <li><span class="text-foreground font-medium">可以放锡纸或硅油纸吗？</span>可以，但要选耐高温规格且不要超出食材范围，避免纸张接触加热管；同时别让纸挡住热风循环。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'airfryer-converter'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Flame, Thermometer, Timer, ArrowRightLeft, UtensilsCrossed, Search, Info, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '空气炸锅换算器 - 烤箱温度时间一键转换',
  description: '在线空气炸锅换算器，烤箱菜谱按降 15°C、时间×0.75 一键换算并给出参考区间，内置薯条、鸡翅、整鸡等 10 类常见食材温度时间对照表，附预热与分批建议，纯本地计算',
  keywords: '空气炸锅换算, 烤箱转空气炸锅, 空气炸锅时间, 空气炸锅温度, 菜谱换算, 空气炸锅对照表',
  author: 'Util工具箱',
  ogTitle: '空气炸锅换算器 - 有条工具',
  ogDescription: '烤箱菜谱一键换算空气炸锅温度时间，内置常见食材对照表',
  ogUrl: 'https://www.util.cn/tools/airfryer-converter',
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
          name: '空气炸锅换算器',
          url: 'https://www.util.cn/tools/airfryer-converter',
          applicationCategory: 'LifestyleApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['烤箱→空气炸锅温度时间换算', '参考区间提示', '10 类常见食材对照表', '食材搜索', '预热/分批使用建议']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '空气炸锅换算器', item: 'https://www.util.cn/tools/airfryer-converter' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '空气炸锅需要预热吗？',
              acceptedAnswer: { '@type': 'Answer', text: '建议预热 3 分钟，能让食材表面迅速脱水定型，成品更接近参考时间与口感。' }
            },
            {
              '@type': 'Question',
              name: '换算后不熟怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '换算值只是起点，不熟可按原温度续烤 3-5 分钟观察；含肉类请确认中心熟透再食用。' }
            },
            {
              '@type': 'Question',
              name: '可以放锡纸或硅油纸吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，选耐高温规格且不超出食材范围，避免接触加热管，不要挡住热风循环。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'airfryer-converter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 换算纯函数（便于测试） ----------
function convertOven(temp, time) {
  if (!(temp > 0) || !(time > 0)) return null
  const t = Math.round(temp) - 15
  const base = Math.round(time * 0.75 * 10) / 10
  return {
    ovenTemp: Math.round(temp),
    ovenTime: Math.round(time * 10) / 10,
    temp: Math.max(0, t),
    time: base,
    timeLow: Math.max(1, Math.round(base * 0.9)),
    timeHigh: Math.max(1, Math.round(base * 1.1))
  }
}

// ---------- 页面状态 ----------
const activeMode = ref('formula')
const ovenTemp = ref(200)
const ovenTime = ref(20)
const tableQuery = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const conversion = computed(() => convertOven(ovenTemp.value, ovenTime.value))

// ---------- 内置对照表 ----------
const presets = [
  { name: '薯条', temp: 200, time: '15-18 分钟', tip: '冷冻薯条无需解冻，中途翻动 1 次' },
  { name: '鸡翅', temp: 180, time: '20-25 分钟', tip: '中途翻面，腌料含糖时注意上色' },
  { name: '鸡腿', temp: 190, time: '22-28 分钟', tip: '带骨厚件，最后 5 分钟降温防焦' },
  { name: '牛排', temp: 200, time: '8-12 分钟', tip: '回温后再入锅，按喜好的熟度减时' },
  { name: '三文鱼', temp: 180, time: '10-12 分钟', tip: '表面刷少许油防干，别叠放' },
  { name: '虾', temp: 190, time: '6-8 分钟', tip: '变红卷曲即熟，久烤容易缩水' },
  { name: '蛋挞', temp: 180, time: '10-12 分钟', tip: '挞液鼓起出现焦斑即可' },
  { name: '整鸡', temp: 180, time: '35-45 分钟', tip: '中途翻面 1 次，确认腔内熟透' },
  { name: '玉米', temp: 190, time: '12-15 分钟', tip: '刷奶香水更香，中途翻面' },
  { name: '春卷', temp: 190, time: '8-10 分钟', tip: '表面薄油喷雾更酥脆' }
]

const filteredPresets = computed(() => {
  const q = tableQuery.value.trim()
  if (!q) return presets
  return presets.filter(p => p.name.includes(q))
})
</script>
