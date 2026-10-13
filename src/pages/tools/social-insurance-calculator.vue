<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Shield class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">五险一金计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按城市社保公积金比例静态表计算缴额明细与到手工资</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        选择城市、输入税前月薪与公积金比例，即可按内置比例表逐项计算养老、医疗、失业、工伤与公积金的单位/个人缴纳金额，
        并按简化月度个税口径估算到手工资。全部计算在浏览器本地完成，薪资数据不上传。
      </p>
    </div>

    <!-- 政策口径提示 -->
    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
        本页社保公积金比例与基数上下限为<strong>按公开信息整理的估算口径（2025-2026）</strong>，各城市比例与基数每年调整且同一城市不同区行业存在差异，一切以官方最新政策与单位实际申报为准。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 输入信息
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">城市</label>
          <select
            v-model="cityKey"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="(c, key) in cities" :key="key" :value="key">{{ c.name }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">税前月薪（元）</label>
          <input
            v-model.number="salary"
            type="number"
            min="0"
            step="100"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 20000"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            公积金缴存比例（个人与单位同比例）：<span class="text-primary">{{ fundRate }}%</span>
          </label>
          <input
            v-model.number="fundRate"
            type="range"
            min="5"
            max="12"
            step="1"
            class="w-full accent-primary"
          />
          <div class="flex justify-between text-xs text-muted-foreground mt-1">
            <span>5%</span><span>8%</span><span>12%</span>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">各地公积金比例区间不同（多数城市 5%-12%），以单位实际申报为准</p>
        </div>

        <!-- 城市比例表 -->
        <div class="bg-muted/50 rounded-lg p-4">
          <p class="text-sm font-medium text-foreground mb-2">{{ currentCity.name }} 比例静态表（估算口径）</p>
          <div class="text-xs space-y-1.5">
            <div class="flex justify-between">
              <span class="text-muted-foreground">养老（单位/个人）</span>
              <span class="text-foreground font-medium">{{ currentCity.pensionU }}% / {{ currentCity.pensionP }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">医疗（单位/个人）</span>
              <span class="text-foreground font-medium">
                {{ currentCity.medicalU }}% / {{ currentCity.medicalP }}%<template v-if="currentCity.medicalPAdd">+{{ currentCity.medicalPAdd }}元</template>
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">失业（单位/个人）</span>
              <span class="text-foreground font-medium">{{ currentCity.unemployedU }}% / {{ currentCity.unemployedP }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">工伤（单位）</span>
              <span class="text-foreground font-medium">{{ currentCity.injuryU }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">基数上下限</span>
              <span class="text-foreground font-medium">{{ fmt(currentCity.baseMin) }} ~ {{ fmt(currentCity.baseMax) }} 元</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 结果区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <List class="w-5 h-5 mr-2 text-primary" /> 缴纳明细与到手
        </h2>

        <div v-if="salary > 0" class="space-y-4">
          <p class="text-xs text-muted-foreground">
            缴费基数：月薪 {{ fmt(salary) }} 元
            <template v-if="baseCapped">，超出上下限按 <strong class="text-foreground">{{ fmt(usedBase) }}</strong> 元计</template>
            <template v-else>，直接作为缴费基数 {{ fmt(usedBase) }} 元</template>
          </p>

          <!-- 单位缴纳 -->
          <div class="bg-muted/50 rounded-lg p-4">
            <p class="text-sm font-medium text-foreground mb-2">单位缴纳（合计 {{ fmt(result.unitTotal) }} 元/月）</p>
            <div class="text-xs space-y-1.5">
              <div class="flex justify-between">
                <span class="text-muted-foreground">养老 {{ currentCity.pensionU }}%</span>
                <span class="text-foreground font-medium">{{ fmt(result.unit.pension) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">医疗 {{ currentCity.medicalU }}%</span>
                <span class="text-foreground font-medium">{{ fmt(result.unit.medical) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">失业 {{ currentCity.unemployedU }}%</span>
                <span class="text-foreground font-medium">{{ fmt(result.unit.unemployed) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">工伤 {{ currentCity.injuryU }}%</span>
                <span class="text-foreground font-medium">{{ fmt(result.unit.injury) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">公积金 {{ fundRate }}%</span>
                <span class="text-foreground font-medium">{{ fmt(result.unit.fund) }}</span>
              </div>
            </div>
          </div>

          <!-- 个人缴纳 -->
          <div class="bg-muted/50 rounded-lg p-4">
            <p class="text-sm font-medium text-foreground mb-2">个人缴纳（合计 {{ fmt(result.personalTotal) }} 元/月）</p>
            <div class="text-xs space-y-1.5">
              <div class="flex justify-between">
                <span class="text-muted-foreground">养老 {{ currentCity.pensionP }}%</span>
                <span class="text-foreground font-medium">{{ fmt(result.personal.pension) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">医疗 {{ currentCity.medicalP }}%<template v-if="currentCity.medicalPAdd">+{{ currentCity.medicalPAdd }}元</template></span>
                <span class="text-foreground font-medium">{{ fmt(result.personal.medical) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">失业 {{ currentCity.unemployedP }}%</span>
                <span class="text-foreground font-medium">{{ fmt(result.personal.unemployed) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">公积金 {{ fundRate }}%</span>
                <span class="text-foreground font-medium">{{ fmt(result.personal.fund) }}</span>
              </div>
            </div>
          </div>

          <!-- 个税 -->
          <div class="text-sm">
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">应纳税所得额（月薪 − 5000 − 个人社保公积金）</span>
              <span class="text-foreground font-medium">{{ fmt(result.taxable) }} 元</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">个人所得税（简化月度口径）</span>
              <span class="text-foreground font-medium">{{ fmt(result.tax) }} 元</span>
            </div>
          </div>

          <!-- 到手 -->
          <div class="bg-primary/10 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">预计到手（税后）</p>
            <p class="text-2xl font-bold text-primary">{{ fmt(result.net) }} 元/月</p>
            <p class="text-xs text-primary mt-1">单位月用工成本约 {{ fmt(salary + result.unitTotal) }} 元</p>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            口径说明：社保按基数上下限取值，公积金按月薪并套用同一上下限（简化）；个税为简化月度口径，未考虑专项附加扣除与累计预扣法，实际以工资单为准。
          </p>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground">
          请输入税前月薪开始计算
        </div>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        免责声明：五险一金实际缴额取决于单位申报基数、当地年度调整、行业工伤费率与地方补充政策，本工具按公开信息整理的静态比例表估算，仅供参考，一切以官方最新政策为准。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于五险一金计算器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            五险一金指养老保险、医疗保险、失业保险、工伤保险、生育保险（多数城市已并入医疗）与住房公积金，由单位和职工按比例共同缴纳。
            本工具内置北京、上海、广州、深圳、杭州、成都、南京、武汉八个城市的常用比例静态表，输入月薪即可逐项拆解单位与个人缴额，并估算税后到手工资。
          </p>
          <h3 class="text-lg font-semibold text-foreground">各城市比例为什么不同</h3>
          <p>
            社保缴费比例与基数上下限由各省市自行确定并每年随社平工资调整，例如养老单位比例多为 15%-16%，医疗单位比例从 5.9% 到 9.9% 不等，
            基数上限通常为当地上年度全口径社平工资的 3 倍。同一城市不同行业工伤费率也有差别，本工具取常用基准值估算。
          </p>
          <h3 class="text-lg font-semibold text-foreground">到手工资怎么算</h3>
          <p>
            到手 = 税前月薪 − 个人缴纳的养老、医疗、失业、公积金 − 个人所得税。个税按简化月度口径计算：
            应纳税所得额 = 月薪 − 5000 元起征点 − 个人社保公积金，套用 3%-45% 月度税率表与速算扣除数，
            未考虑子女教育、房贷利息等专项附加扣除，实际个税以单位累计预扣预缴结果为准。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么我的社保缴额和计算结果不同？</span>常见原因：单位按最低基数或非全额月薪申报、城市比例已调整、医疗含地方补充险种、工伤按行业费率浮动。请以工资条与社保账单为准。</li>
            <li><span class="text-foreground font-medium">公积金比例为什么是 5%-12%？</span>住房公积金缴存比例国家规定区间为各 5%-12%，单位可在区间内选定，部分城市允许补充公积金进一步提高。本工具按个人与单位同比例简化计算。</li>
            <li><span class="text-foreground font-medium">基数超过上限怎么办？</span>月薪高于当地基数上限时，社保按上限缴纳；低于下限时按下限缴纳。工具会自动按所选城市的上下限取值并提示。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'social-insurance-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Shield, Calculator, List, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '五险一金计算器 - 社保公积金缴额与到手工资计算',
  description: '在线五险一金计算器，内置北京/上海/广州/深圳/杭州/成都/南京/武汉八城市社保公积金比例静态表，输入月薪逐项计算单位与个人缴额，按简化月度个税口径估算到手工资，纯本地计算',
  keywords: '五险一金计算器, 社保计算器, 公积金计算, 到手工资, 社保比例, 缴费基数, 个税计算',
  author: 'Util工具箱',
  ogTitle: '五险一金计算器 - 有条工具',
  ogDescription: '按城市比例静态表逐项计算五险一金缴额与到手工资',
  ogUrl: 'https://www.util.cn/tools/social-insurance-calculator',
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
          name: '五险一金计算器',
          url: 'https://www.util.cn/tools/social-insurance-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['八城市比例静态表', '单位/个人缴额明细', '基数上下限自动取值', '简化月度个税估算', '到手工资计算']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '五险一金计算器', item: 'https://www.util.cn/tools/social-insurance-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么我的社保缴额和计算结果不同？',
              acceptedAnswer: { '@type': 'Answer', text: '常见原因包括单位按最低基数或非全额月薪申报、城市比例已调整、医疗含地方补充险种等，请以工资条与社保账单为准。' }
            },
            {
              '@type': 'Question',
              name: '公积金比例为什么是 5%-12%？',
              acceptedAnswer: { '@type': 'Answer', text: '住房公积金缴存比例国家规定区间为各 5%-12%，单位可在区间内选定，部分城市允许补充公积金。' }
            },
            {
              '@type': 'Question',
              name: '基数超过上下限怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '月薪高于当地基数上限时按上限缴纳，低于下限时按下限缴纳，工具会自动按城市上下限取值并提示。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'social-insurance-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 城市静态比例表（2025-2026 公开口径，估算） ----------
const cities = {
  beijing:   { name: '北京', pensionU: 16, pensionP: 8, medicalU: 9.8, medicalP: 2, medicalPAdd: 3, unemployedU: 0.5, unemployedP: 0.5, injuryU: 0.2,  baseMin: 6821, baseMax: 35283 },
  shanghai:  { name: '上海', pensionU: 16, pensionP: 8, medicalU: 9.5, medicalP: 2, medicalPAdd: 0, unemployedU: 0.5, unemployedP: 0.5, injuryU: 0.16, baseMin: 7384, baseMax: 36549 },
  guangzhou: { name: '广州', pensionU: 15, pensionP: 8, medicalU: 6.85, medicalP: 2, medicalPAdd: 0, unemployedU: 0.8, unemployedP: 0.2, injuryU: 0.2,  baseMin: 4877, baseMax: 28299 },
  shenzhen:  { name: '深圳', pensionU: 15, pensionP: 8, medicalU: 5.9, medicalP: 2, medicalPAdd: 0, unemployedU: 0.7, unemployedP: 0.3, injuryU: 0.14, baseMin: 2360, baseMax: 28299 },
  hangzhou:  { name: '杭州', pensionU: 16, pensionP: 8, medicalU: 9.9, medicalP: 2, medicalPAdd: 0, unemployedU: 0.5, unemployedP: 0.5, injuryU: 0.2,  baseMin: 4812, baseMax: 24930 },
  chengdu:   { name: '成都', pensionU: 16, pensionP: 8, medicalU: 6.9, medicalP: 2, medicalPAdd: 0, unemployedU: 0.6, unemployedP: 0.4, injuryU: 0.2,  baseMin: 4511, baseMax: 22555 },
  nanjing:   { name: '南京', pensionU: 16, pensionP: 8, medicalU: 8.5, medicalP: 2, medicalPAdd: 0, unemployedU: 0.5, unemployedP: 0.5, injuryU: 0.24, baseMin: 4879, baseMax: 24396 },
  wuhan:     { name: '武汉', pensionU: 16, pensionP: 8, medicalU: 8,   medicalP: 2, medicalPAdd: 0, unemployedU: 0.7, unemployedP: 0.3, injuryU: 0.2,  baseMin: 4494, baseMax: 22470 }
}

// ---------- 月度税率表（3%-45% 速算扣除，简化月度口径） ----------
const monthlyTaxBrackets = [
  { limit: 80000, rate: 0.45, deduct: 15160 },
  { limit: 55000, rate: 0.35, deduct: 7160 },
  { limit: 35000, rate: 0.30, deduct: 4410 },
  { limit: 25000, rate: 0.25, deduct: 2660 },
  { limit: 12000, rate: 0.20, deduct: 1410 },
  { limit: 3000,  rate: 0.10, deduct: 210 },
  { limit: 0,     rate: 0.03, deduct: 0 }
]

// ---------- 状态 ----------
const cityKey = ref('beijing')
const salary = ref(20000)
const fundRate = ref(12)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const currentCity = computed(() => cities[cityKey.value])

const fmt = (v) => (isFinite(v) ? v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—')

// 缴费基数：月薪套用城市基数上下限
const usedBase = computed(() => {
  const c = currentCity.value
  return Math.min(Math.max(salary.value || 0, c.baseMin), c.baseMax)
})
const baseCapped = computed(() => salary.value > 0 && (salary.value > currentCity.value.baseMax || salary.value < currentCity.value.baseMin))

const monthlyTax = (taxable) => {
  if (taxable <= 0) return 0
  for (const b of monthlyTaxBrackets) {
    if (taxable > b.limit) return taxable * b.rate - b.deduct
  }
  return 0
}

const result = computed(() => {
  const c = currentCity.value
  const base = usedBase.value
  const s = Math.max(0, salary.value || 0)
  const fr = Math.min(12, Math.max(5, fundRate.value || 5))

  const personal = {
    pension: base * c.pensionP / 100,
    medical: base * c.medicalP / 100 + (c.medicalPAdd || 0),
    unemployed: base * c.unemployedP / 100,
    fund: base * fr / 100
  }
  const unit = {
    pension: base * c.pensionU / 100,
    medical: base * c.medicalU / 100,
    unemployed: base * c.unemployedU / 100,
    injury: base * c.injuryU / 100,
    fund: base * fr / 100
  }
  const personalTotal = personal.pension + personal.medical + personal.unemployed + personal.fund
  const unitTotal = unit.pension + unit.medical + unit.unemployed + unit.injury + unit.fund
  const taxable = s - 5000 - personalTotal
  const tax = monthlyTax(taxable)
  const net = s - personalTotal - tax

  return { personal, unit, personalTotal, unitTotal, taxable, tax, net }
})
</script>
