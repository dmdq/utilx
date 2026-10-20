<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Droplets class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">腌渍配比计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按食材重量算泡菜酸菜糖醋的盐糖醋比例与用量，附亚硝酸盐安全期提示</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        腌泡菜、渍酸菜、调糖醋汁不再凭手感。输入食材重量，选择腌渍类型——四川泡菜（盐 2–4%）、韩式盐渍（5–8%）、日式浅渍（2%）、东北酸菜（2.5–3%）或糖醋汁（醋:糖:酱油 可调比例），工具按重量反推盐、糖、醋的克数与盐水浸泡所需的水量，并给出亚硝酸盐安全期与容器消毒建议。比例参考民间腌渍经验，具体口感可微调。全部计算在浏览器本地完成。
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Scale class="w-5 h-5 mr-2 text-primary" /> 食材与类型
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">食材重量（kg）</label>
          <input
            v-model.number="weightKg"
            type="number"
            min="0"
            step="0.1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="例如 2 表示 2kg"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">腌渍类型</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="t in PICKLE_TYPES"
              :key="t.key"
              @click="pickType(t.key)"
              :class="typeKey === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all text-left px-3"
            >{{ t.zh }}<span v-if="t.pct" class="opacity-70">（{{ t.pctText }}）</span></button>
          </div>
        </div>

        <div v-if="currentType && currentType.pct && currentType.max > currentType.min">
          <label class="block text-sm font-medium text-foreground mb-2">
            用盐浓度：<span class="text-primary">{{ saltPct }}%</span>
            <span class="text-xs text-muted-foreground ml-2">建议区间 {{ currentType.min }}–{{ currentType.max }}%</span>
          </label>
          <input
            v-model.number="saltPct"
            type="range"
            :min="currentType.min"
            :max="currentType.max"
            step="0.1"
            class="w-full accent-primary"
          />
        </div>
        <div v-else-if="currentType && currentType.pct">
          <p class="text-sm text-foreground">固定用盐浓度：{{ saltPct }}%（{{ currentType.zh }}惯例）</p>
        </div>

        <div v-if="currentType && currentType.kind === 'brine'">
          <label class="block text-sm font-medium text-foreground mb-2">
            浸没水量倍数：<span class="text-primary">{{ waterRatio }}</span> 倍食材重
          </label>
          <input
            v-model.number="waterRatio"
            type="range"
            min="1"
            max="2"
            step="0.1"
            class="w-full accent-primary"
          />
          <p class="text-xs text-muted-foreground mt-1.5">泡菜坛需盐水没过食材，一般 1.1–1.5 倍即可</p>
        </div>

        <div v-if="currentType && currentType.kind === 'sauce'" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">糖醋汁用量：食材重的 {{ sauceFactor }} 倍</label>
            <input
              v-model.number="sauceFactor"
              type="range"
              min="0.2"
              max="0.6"
              step="0.05"
              class="w-full accent-primary"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">比例 醋 : 糖 : 酱油</label>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <input v-model.number="ratioVinegar" type="number" min="0" step="0.5" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring" />
                <p class="text-xs text-muted-foreground text-center mt-1">醋</p>
              </div>
              <div>
                <input v-model.number="ratioSugar" type="number" min="0" step="0.5" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring" />
                <p class="text-xs text-muted-foreground text-center mt-1">糖</p>
              </div>
              <div>
                <input v-model.number="ratioSoy" type="number" min="0" step="0.5" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring" />
                <p class="text-xs text-muted-foreground text-center mt-1">酱油</p>
              </div>
            </div>
          </div>
        </div>

        <div class="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground leading-relaxed">
          盐浓度按「食材重 × 百分比」计，盐水浸泡另按「水量 × 目标浓度」反推盐量；两种方法可互为校准，腌渍咸淡最终以口味与安全底线为准。
        </div>
      </div>

      <!-- 右侧：配方输出 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <ClipboardList class="w-5 h-5 mr-2 text-primary" /> 配方明细
        </h2>

        <div v-if="plan.result" class="space-y-3">
          <div v-if="plan.result.drySalt !== undefined" class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span class="text-muted-foreground">直腌用盐（{{ saltPct }}% × 食材重）</span>
            <span class="font-bold text-foreground">{{ fmtG(plan.result.drySalt) }}</span>
          </div>
          <template v-if="plan.result.water !== undefined">
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">凉开水/矿泉水（{{ waterRatio }} 倍食材重）</span>
              <span class="font-semibold text-foreground">{{ fmtG(plan.result.water) }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">配 {{ saltPct }}% 盐水需再加盐</span>
              <span class="font-bold text-foreground">{{ fmtG(plan.result.brineSalt) }}</span>
            </div>
          </template>
          <template v-if="plan.result.vinegar !== undefined">
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">糖醋汁总量（{{ sauceFactor }} 倍食材重）</span>
              <span class="font-semibold text-foreground">{{ fmtG(plan.result.sauce) }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">醋（{{ ratioVinegar }}/{{ ratioSum }}）</span>
              <span class="font-bold text-foreground">{{ fmtG(plan.result.vinegar) }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">糖（{{ ratioSugar }}/{{ ratioSum }}）</span>
              <span class="font-bold text-foreground">{{ fmtG(plan.result.sugar) }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">酱油（{{ ratioSoy }}/{{ ratioSum }}）</span>
              <span class="font-bold text-foreground">{{ fmtG(plan.result.soy) }}</span>
            </div>
          </template>
          <div class="p-4 bg-primary/10 rounded-lg text-center">
            <p class="text-xs text-muted-foreground mb-1">{{ currentType ? currentType.zh : '' }} · {{ weightKg }}kg 食材</p>
            <p class="text-lg font-bold text-primary">{{ headline }}</p>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground text-sm">
          {{ plan.warning || '输入食材重量开始计算' }}
        </div>

        <div v-if="plan.result && currentType && currentType.kind !== 'sauce'" class="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
          <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <p>安全期提示（参考）：发酵腌菜在<strong class="text-foreground">腌制第 3–8 天亚硝酸盐达峰</strong>，建议<strong class="text-foreground">腌透 20 天后再吃，或在 1 天内趁鲜吃完</strong>，避开中间窗口；发现发黏、异臭、霉斑请整缸弃用。本提示为一般经验，不构成食品安全保证，特殊人群（孕妇、幼儿）请从严把关。</p>
        </div>
        <div v-if="plan.result && currentType && currentType.kind === 'sauce'" class="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
          <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <p>糖醋汁现调现用，冷藏建议 24 小时内用完；用于糖醋排骨等热菜时留底汁收浓即可，无需考虑亚硝酸盐问题。</p>
        </div>
      </div>
    </div>

    <!-- 容器消毒提示 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold flex items-center mb-4">
        <ShieldCheck class="w-5 h-5 mr-2 text-primary" /> 容器消毒提示
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div class="p-4 bg-muted/50 rounded-lg space-y-1">
          <p class="font-medium text-foreground">① 无油无水是底线</p>
          <p class="text-xs text-muted-foreground leading-relaxed">坛子、压菜石、筷子全部沸水烫洗或蒸 5 分钟，彻底晾干；全程忌沾生油与生水，否则极易生花变质。</p>
        </div>
        <div class="p-4 bg-muted/50 rounded-lg space-y-1">
          <p class="font-medium text-foreground">② 优先玻璃/陶瓷坛</p>
          <p class="text-xs text-muted-foreground leading-relaxed">避免金属容器长期接触盐水；泡菜坛用水封槽隔绝空气，置于阴凉避光处，温度 15–20°C 发酵更稳。</p>
        </div>
        <div class="p-4 bg-muted/50 rounded-lg space-y-1">
          <p class="font-medium text-foreground">③ 定期查“白花”</p>
          <p class="text-xs text-muted-foreground leading-relaxed">液面出现少量白膜可撇除并补高度酒抑菌；若浑浊发黏、有腐臭味则整缸废弃，容器重新消毒再用。</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>腌渍配比计算器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            腌渍成败的第一变量是盐浓度：太低则杂菌繁殖、食材腐烂，太高则发酵迟缓、咸到难以下咽。工具按各类腌渍的传统浓度区间给出参考——四川泡菜 2–4%、韩式盐渍 5–8%、日式浅渍 2%、东北酸菜 2.5–3%，并把「按食材重直算」和「按浸没水量反推」两条口径同时列出，方便对照自家配方。
          </p>
          <h3 class="text-lg font-semibold text-foreground">两种盐量口径</h3>
          <ul class="list-disc list-inside space-y-1">
            <li><span class="text-foreground font-medium">直腌法</span>：盐 = 食材重量 × 浓度%，适合抹盐杀水（韩式白菜、浅渍黄瓜）；</li>
            <li><span class="text-foreground font-medium">盐水浸没法</span>：水量 = 食材重 × 倍数（约 1.1–1.5 倍没过食材），盐 = 水量 × 浓度%，适合泡菜坛、酸菜缸；</li>
            <li>两法结果不同是正常的：盐水法只算溶解在水里的盐，若坛内食材也会出水，可酌情少放一成。</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">糖醋汁比例</h3>
          <p>
            家常糖醋汁按「醋 4 : 糖 2 : 酱油 1」起步（本工具可调），再按食材重量约 0.4 倍准备汁量；喜欢酸甜冲的加大醋份、喜欢挂汁的加糖，起锅前沿锅边烹少许醋提香。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么说「20 天后或 1 天内」吃？</span>发酵第 3–8 天是亚硝酸盐峰值窗口，20 天后被乳酸菌环境逐步降解，1 天内趁鲜吃则来不及积累——这是腌菜安全期的通行经验，并非绝对值，腌透与否还看酸香与质地。</li>
            <li><span class="text-foreground font-medium">盐放少了发臭还能救吗？</span>若仅轻微生花可撇膜、补盐到区间上限并加高度白酒；已发黏、腐臭或霉斑深色则说明杂菌占优，请勿食用，整缸处理并重新消毒。</li>
            <li><span class="text-foreground font-medium">计算结果和长辈的配方不一样？</span>本工具按现代食品安全的百分比口径折算，传统手感配方（如「一把盐」）受容器与食材含水影响大；建议以本表的浓度区间为安全底线，口味咸淡在上限内自行微调。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pickling-ratio-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Droplets, Scale, ClipboardList, ShieldCheck, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '腌渍配比计算器 - 泡菜酸菜糖醋的盐糖醋用量换算',
  description: '在线腌渍配比计算器，按食材重量计算四川泡菜、韩式盐渍、日式浅渍、酸菜的用盐克数与盐水浸泡水量，糖醋汁醋糖酱油比例可调，附亚硝酸盐安全期与容器消毒提示，纯本地计算',
  keywords: '腌渍比例, 泡菜盐的比例, 腌菜放多少盐, 盐水浓度计算, 糖醋比例, 酸菜怎么腌, 亚硝酸盐安全期',
  author: 'Util工具箱',
  ogTitle: '腌渍配比计算器 - 有条工具',
  ogDescription: '按食材重量算泡菜酸菜糖醋的盐糖醋比例与用量，附亚硝酸盐安全期提示',
  ogUrl: 'https://www.util.cn/tools/pickling-ratio-calculator',
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
          name: '腌渍配比计算器',
          url: 'https://www.util.cn/tools/pickling-ratio-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['五类腌渍类型盐浓度区间', '直腌/盐水反推双口径', '糖醋汁比例可调', '亚硝酸盐安全期提示', '容器消毒提示']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '腌渍配比计算器', item: 'https://www.util.cn/tools/pickling-ratio-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '腌泡菜盐的比例是多少？',
              acceptedAnswer: { '@type': 'Answer', text: '四川泡菜一般按食材重或水量2-4%（常取3%），韩式盐渍5-8%，日式浅渍约2%，东北酸菜2.5-3%，可在工具内按区间微调。' }
            },
            {
              '@type': 'Question',
              name: '为什么建议20天后或1天内食用？',
              acceptedAnswer: { '@type': 'Answer', text: '发酵腌菜在第3-8天亚硝酸盐达到峰值，20天后被发酵环境逐步降解，1天内趁鲜吃来不及积累，因此建议避开中间窗口。' }
            },
            {
              '@type': 'Question',
              name: '计算结果准确吗？',
              acceptedAnswer: { '@type': 'Answer', text: '按通行腌渍浓度经验区间换算，食材含水与容器差异会影响实际咸度，结果仅供参考；安全底线以无油消毒、浓度不低于下限、异常即弃用为准。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'pickling-ratio-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* __PURE_START__ */
// 腌渍类型配置：kind = dry 直腌 / brine 盐水浸没 / sauce 糖醋汁
const PICKLE_TYPES = [
  { key: 'sichuan', zh: '四川泡菜', kind: 'brine', pct: true, min: 2, max: 4, def: 3, pctText: '盐2-4%' },
  { key: 'korean', zh: '韩式盐渍', kind: 'dry', pct: true, min: 5, max: 8, def: 6, pctText: '盐5-8%' },
  { key: 'asazuke', zh: '日式浅渍', kind: 'dry', pct: true, min: 2, max: 2, def: 2, pctText: '盐2%' },
  { key: 'suancai', zh: '东北酸菜', kind: 'brine', pct: true, min: 2.5, max: 3, def: 2.8, pctText: '盐2.5-3%' },
  { key: 'sweet-sour', zh: '糖醋汁', kind: 'sauce', pct: false, pctText: '醋:糖:酱油' }
]

const round1 = (v) => Math.round(v * 10) / 10

// 主计算：返回 { warning, result }；result 随类型含 drySalt / water+brineSalt / sauce+vinegar+sugar+soy
const planPickling = (weight, typeKeyIn, saltPctIn, waterMul = 1.2, sauceMul = 0.4, ratioParts = [4, 2, 1]) => {
  const type = PICKLE_TYPES.find(t => t.key === typeKeyIn)
  if (!type) return { warning: '请选择腌渍类型', result: null }
  const w = Number(weight)
  if (!isFinite(w) || w <= 0) return { warning: '请输入食材重量（大于 0kg）', result: null }
  if (w > 20) return { warning: `食材已达 ${w}kg，超过 20kg 家庭容器难以压菜控温，亚硝酸盐峰值也更难把握，建议分批腌制`, result: null }

  const grams = w * 1000
  let result
  if (type.kind === 'sauce') {
    const parts = ratioParts.map(p => Math.max(0, Number(p) || 0))
    const sum = parts[0] + parts[1] + parts[2]
    const sauce = grams * Math.max(0.1, Number(sauceMul) || 0.4)
    result = sum > 0
      ? {
          sauce: round1(sauce),
          vinegar: round1(sauce * parts[0] / sum),
          sugar: round1(sauce * parts[1] / sum),
          soy: round1(sauce * parts[2] / sum)
        }
      : { sauce: round1(sauce), vinegar: 0, sugar: 0, soy: 0 }
  } else if (type.kind === 'brine') {
    const pct = Math.max(0.1, Number(saltPctIn) || type.def || 3)
    const wr = Math.min(3, Math.max(0.5, Number(waterMul) || 1.2))
    const water = grams * wr
    result = {
      drySalt: round1(grams * pct / 100),
      water: round1(water),
      brineSalt: round1(water * pct / 100)
    }
  } else {
    const pct = Math.max(0.1, Number(saltPctIn) || type.def || 2)
    result = { drySalt: round1(grams * pct / 100) }
  }
  return { warning: '', result }
}
/* __PURE_END__ */

// ---------- 状态 ----------
const weightKg = ref(2)
const typeKey = ref('sichuan')
const saltPct = ref(3)
const waterRatio = ref(1.2)
const sauceFactor = ref(0.4)
const ratioVinegar = ref(4)
const ratioSugar = ref(2)
const ratioSoy = ref(1)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const currentType = computed(() => PICKLE_TYPES.find(t => t.key === typeKey.value) || null)

const pickType = (key) => {
  typeKey.value = key
  const t = PICKLE_TYPES.find(x => x.key === key)
  if (t && t.pct) saltPct.value = t.def
}

const ratioSum = computed(() => {
  const sum = Number(ratioVinegar.value) + Number(ratioSugar.value) + Number(ratioSoy.value)
  return isFinite(sum) && sum > 0 ? round1(sum) : 0
})

const plan = computed(() => planPickling(
  weightKg.value,
  typeKey.value,
  saltPct.value,
  waterRatio.value,
  sauceFactor.value,
  [Number(ratioVinegar.value) || 0, Number(ratioSugar.value) || 0, Number(ratioSoy.value) || 0]
))

const fmtG = (v) => {
  const n = Number(v)
  if (!isFinite(n)) return '—'
  return n >= 1000 ? `${(n / 1000).toFixed(2)} kg（${Math.round(n)} g）` : `${n} g`
}

const headline = computed(() => {
  const r = plan.value.result
  const t = currentType.value
  if (!r || !t) return ''
  if (t.kind === 'sauce') return `醋 ${Math.round(r.vinegar)}g · 糖 ${Math.round(r.sugar)}g · 酱油 ${Math.round(r.soy)}g`
  if (t.kind === 'brine') return `直腌盐 ${Math.round(r.drySalt)}g / 盐水盐 ${Math.round(r.brineSalt)}g`
  return `用盐 ${Math.round(r.drySalt)}g`
})
</script>
