<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Package class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">民航行李额度对照</h1>
          <p class="text-sm text-muted-foreground mt-1">国内主要航司手提/托运额度对照，输入行李箱三边自动判定能否登机</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        选择航司，输入手提行李的件数、重量与长宽高（含轮子、提手），工具会按内置的各航司经济舱额度逐项判定是否超规，
        并给出托运建议与超规费用警示。下方附国内主要航司额度对照表，全部判定在浏览器本地完成。
      </p>
    </div>

    <!-- 政策口径提示 -->
    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
        本页额度数据<strong>按公开信息整理</strong>（经济舱常规票档口径），各航司规定随航线、票档与机型调整，特殊行李（乐器、运动器材等）另有限制，请以航司与机场最新规定为准。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Luggage class="w-5 h-5 mr-2 text-primary" /> 我的行李
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">航空公司</label>
          <select
            v-model="airlineId"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="a in airlines" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">手提件数</label>
            <input
              v-model.number="pieces"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">重量（kg）</label>
            <input
              v-model.number="weight"
              type="number"
              min="0"
              step="0.5"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">外形尺寸（cm，含轮子与提手）</label>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs text-muted-foreground mb-1">长</label>
              <input
                v-model.number="dimL"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">宽</label>
              <input
                v-model.number="dimW"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">高</label>
              <input
                v-model.number="dimH"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">任一边超过航司限制即判定超规，请把立式行李箱的轮子和提手算进去</p>
        </div>
      </div>

      <!-- 判定结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <CheckCircle2 class="w-5 h-5 mr-2 text-primary" /> 判定结果
        </h2>

        <div class="space-y-2">
          <div class="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5">
            <span class="text-sm text-muted-foreground">手提件数（限 {{ airline.pieces }} 件）</span>
            <span class="flex items-center gap-2 text-sm font-semibold">
              <span :class="checks.pieces ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">{{ checks.pieces ? '✓' : '✗' }}</span>
              <span class="text-foreground">{{ pieces }} 件</span>
            </span>
          </div>
          <div class="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5">
            <span class="text-sm text-muted-foreground">重量（限 {{ airline.weight }} kg）</span>
            <span class="flex items-center gap-2 text-sm font-semibold">
              <span :class="checks.weight ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">{{ checks.weight ? '✓' : '✗' }}</span>
              <span class="text-foreground">{{ weight }} kg</span>
            </span>
          </div>
          <div class="bg-muted/50 rounded-lg px-4 py-2.5">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">尺寸（限 {{ airline.l }} × {{ airline.w }} × {{ airline.h }} cm）</span>
              <span :class="['text-sm font-semibold', checks.size ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400']">{{ checks.size ? '✓' : '✗' }}</span>
            </div>
            <div class="flex gap-4 mt-1.5 text-xs">
              <span :class="dimL <= airline.l ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">长 {{ dimL }}/{{ airline.l }}</span>
              <span :class="dimW <= airline.w ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">宽 {{ dimW }}/{{ airline.w }}</span>
              <span :class="dimH <= airline.h ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">高 {{ dimH }}/{{ airline.h }}</span>
            </div>
          </div>
        </div>

        <!-- 结论 -->
        <div :class="['rounded-lg p-4 text-center', allPass ? 'bg-green-500/10' : 'bg-red-500/10']">
          <p class="text-xs text-muted-foreground mb-1">{{ airline.name }} 经济舱判定结论</p>
          <p :class="['text-xl font-bold', allPass ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400']">
            {{ allPass ? '✓ 符合手提标准，可直接登机' : '✗ 超出手提标准' }}
          </p>
          <p v-if="!allPass" class="text-xs text-red-600/80 dark:text-red-400/80 mt-1.5 leading-relaxed">
            超规行李需在值机柜台办理托运，机场现场托运与超规收费较高（常见 200-1000 元/段），建议提前在航司 App 预购行李额或精简行李
          </p>
          <p v-if="airline.checked === '无免费托运额'" class="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
            注意：{{ airline.name }}经济舱常规票档无免费托运行李额，托运需另行购买
          </p>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          免费托运额：{{ airline.name }}经济舱常规票档为 {{ airline.checked }}。判断口径为"任一边超限即超"，重量含手提包以外的全部手提行李；部分机场对行李架空间执行更严格，以现场为准。
        </p>
      </div>
    </div>

    <!-- 航司对照表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8 overflow-x-auto">
      <h2 class="text-lg font-semibold flex items-center mb-4">
        <Luggage class="w-5 h-5 mr-2 text-primary" /> 国内主要航司经济舱额度对照表
      </h2>
      <table class="w-full text-sm min-w-[620px]">
        <thead>
          <tr class="text-left text-muted-foreground border-b border-border">
            <th class="py-2.5 pr-4 font-medium">航司</th>
            <th class="py-2.5 pr-4 font-medium">手提重量</th>
            <th class="py-2.5 pr-4 font-medium">手提尺寸（cm）</th>
            <th class="py-2.5 pr-4 font-medium">件数</th>
            <th class="py-2.5 font-medium">免费托运额</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="a in airlines"
            :key="a.id"
            :class="['border-b border-border/50 cursor-pointer transition-colors', a.id === airlineId ? 'bg-primary/5' : 'hover:bg-muted/40']"
            @click="airlineId = a.id"
          >
            <td class="py-2.5 pr-4 font-medium text-foreground">{{ a.name }}</td>
            <td class="py-2.5 pr-4 text-muted-foreground">{{ a.weight }} kg</td>
            <td class="py-2.5 pr-4 text-muted-foreground">{{ a.l }} × {{ a.w }} × {{ a.h }}</td>
            <td class="py-2.5 pr-4 text-muted-foreground">{{ a.pieces }} 件</td>
            <td class="py-2.5 text-muted-foreground">{{ a.checked }}</td>
          </tr>
        </tbody>
      </table>
      <p class="text-xs text-muted-foreground mt-4">
        以上为经济舱常规票档的公开常用口径，廉航与全服务航司的高票档、常旅客会员可能另有额度，国际航线规定不同，以航司与机场最新规定为准。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于民航行李额度</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            手提行李额度由各航司自行规定，通常限制件数、重量与三边尺寸。国内全服务航司经济舱手提常见为 5-8 公斤、
            55×40×20 厘米左右；廉航（如春秋航空）额度更小且常规票档通常没有免费托运额。
            行李箱的标称尺寸不含轮子，但机场判定时会把轮子和提手算进去，这也是"20 寸登机箱被拒"的常见原因。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么 20 寸箱子可能不能登机</h3>
          <p>
            常见 20 寸登机箱箱体约 50×35×22 厘米，加上轮子与提手后通常达到 55×40×23 厘米左右，
            已经超过春秋、成都航等 40×30×20 的限制，也可能在东航、南航等 55×40×20 口径下因高度超限被查。
            出行前把立式高度（含轮）量准确，再用本工具按所乘航司判定一次最稳妥。
          </p>
          <h3 class="text-lg font-semibold text-foreground">托运额度怎么理解</h3>
          <p>
            全服务航司经济舱常规票档通常含 20 公斤免费托运额，按件计重的航线则限制件数与单件重量；
            春秋等廉航的常规票档不含免费托运额，行李额需要在购票或值机时单独购买。
            托运行李单件一般不超过 50 公斤（部分航司 32 公斤），超重、超大件按逾重行李费率另行计费。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">超规了会怎样？</span>值机或登机口被查出时需回头办理托运，机场现场购买行李额价格明显高于线上预购，廉航超规收费常见 200-1000 元/段，建议提前在航司 App 加购。</li>
            <li><span class="text-foreground font-medium">充电宝和锂电池可以托运吗？</span>不可以。充电宝、备用锂电池必须随身携带，且充电宝额定能量不超过 100Wh（100-160Wh 需航司批准），具体以民航局最新规定为准。</li>
            <li><span class="text-foreground font-medium">液体物品有什么限制？</span>随身携带化妆品单件不超过 100ml 且需装袋；超过部分应托运。酒类只能托运且有度数与包装限制，以机场安检要求为准。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'airline-baggage-checker'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Package, Luggage, CheckCircle2, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '民航行李额度对照 - 登机箱尺寸与托运规定查询',
  description: '国内主要航司行李额度对照表，覆盖国航/东航/南航/海航/春秋/吉祥/成都航经济舱手提重量尺寸与托运免费额，输入行李箱三边自动判定能否登机，纯本地计算',
  keywords: '登机箱尺寸, 行李额度查询, 托运重量, 民航行李规定, 20寸能登机吗, 春秋航空行李',
  author: 'Util工具箱',
  ogTitle: '民航行李额度对照 - 有条工具',
  ogDescription: '国内主要航司手提/托运额度对照，输入行李箱三边自动判定能否登机',
  ogUrl: 'https://www.util.cn/tools/airline-baggage-checker',
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
          name: '民航行李额度对照',
          url: 'https://www.util.cn/tools/airline-baggage-checker',
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['七家航司额度对照', '三边尺寸逐项判定', '重量与件数判定', '超规托运警示', '点击对照表快速切换航司']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '生活工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '民航行李额度对照', item: 'https://www.util.cn/tools/airline-baggage-checker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '超规了会怎样？',
              acceptedAnswer: { '@type': 'Answer', text: '需在值机柜台办理托运，机场现场购买行李额价格明显高于线上预购，廉航超规收费常见 200-1000 元/段。' }
            },
            {
              '@type': 'Question',
              name: '充电宝和锂电池可以托运吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不可以。充电宝、备用锂电池必须随身携带，充电宝额定能量不超过 100Wh，具体以民航局最新规定为准。' }
            },
            {
              '@type': 'Question',
              name: '为什么 20 寸箱子可能不能登机？',
              acceptedAnswer: { '@type': 'Answer', text: '20 寸登机箱加上轮子与提手后通常达到 55×40×23 厘米左右，超过春秋等航司 40×30×20 的限制。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'airline-baggage-checker')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 航司静态额度表（公开常用口径，经济舱常规票档） ----------
const airlines = [
  { id: 'airchina',      name: '国航',   weight: 5, l: 55, w: 40, h: 30, pieces: 1, checked: '20kg' },
  { id: 'chinaeastern',  name: '东航',   weight: 8, l: 55, w: 40, h: 20, pieces: 1, checked: '20kg' },
  { id: 'chinasouthern', name: '南航',   weight: 8, l: 55, w: 40, h: 20, pieces: 1, checked: '20kg' },
  { id: 'hainan',        name: '海航',   weight: 7, l: 55, w: 40, h: 20, pieces: 1, checked: '20kg' },
  { id: 'spring',        name: '春秋',   weight: 7, l: 40, w: 30, h: 20, pieces: 1, checked: '无免费托运额' },
  { id: 'juneyao',       name: '吉祥',   weight: 7, l: 55, w: 40, h: 20, pieces: 1, checked: '20kg' },
  { id: 'chengduair',    name: '成都航', weight: 7, l: 40, w: 30, h: 20, pieces: 1, checked: '20kg' }
]

// ---------- 状态 ----------
const airlineId = ref('airchina')
const pieces = ref(1)
const weight = ref(5)
const dimL = ref(55)
const dimW = ref(40)
const dimH = ref(20)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const airline = computed(() => airlines.find(a => a.id === airlineId.value) || airlines[0])

const checks = computed(() => ({
  pieces: pieces.value <= airline.value.pieces,
  weight: weight.value <= airline.value.weight,
  size: dimL.value <= airline.value.l && dimW.value <= airline.value.w && dimH.value <= airline.value.h
}))

const allPass = computed(() => checks.value.pieces && checks.value.weight && checks.value.size)
</script>
