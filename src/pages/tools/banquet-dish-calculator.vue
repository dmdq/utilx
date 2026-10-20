<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Utensils class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">家宴点菜计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按人数与场合生成凉热汤点配比与主食克重，聚餐宴请不再点多吃不饱</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        几个人吃饭点几个菜？输入人数、场合（家常/请客/婚宴），并勾选是否有老人小孩与是否喝酒，工具按民间经验公式生成建议菜单结构：凉菜、热菜（荤素各半）、汤与主食各几道，附人均菜数、硬菜（大菜）数量与「宁少勿多/留余量」策略提示。算法为经验估算，请结合菜系与饭量调整。全部计算在浏览器本地完成。
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Users class="w-5 h-5 mr-2 text-primary" /> 就餐情况
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">人数（{{ people }} 人）</label>
          <div class="flex items-center gap-3">
            <button
              @click="people = Math.max(2, people - 1)"
              class="w-10 h-10 flex items-center justify-center bg-muted rounded-lg hover:bg-muted/80 transition text-foreground"
            >-</button>
            <input
              v-model.number="people"
              type="number"
              min="2"
              max="30"
              class="flex-1 text-center px-4 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              @click="people = Math.min(30, people + 1)"
              class="w-10 h-10 flex items-center justify-center bg-muted rounded-lg hover:bg-muted/80 transition text-foreground"
            >+</button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">支持 2–30 人，更多桌数请按每桌 10 人拆分使用</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">场合</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="opt in occasionOptions"
              :key="opt.key"
              @click="occasion = opt.key"
              :class="occasion === opt.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ opt.label }}</button>
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm text-foreground">
          <input v-model="hasElderlyKids" type="checkbox" id="hasElderlyKids" class="w-4 h-4 rounded border-border" />
          有老人或小孩（加 1 道蒸菜/软烂素菜）
        </label>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">酒类</label>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="opt in alcoholOptions"
              :key="opt.key"
              @click="alcohol = opt.key"
              :class="alcohol === opt.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ opt.label }}</button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">喝酒增加下酒凉菜，同时主食饱腹感上升、米饭酌减</p>
        </div>

        <div class="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground leading-relaxed">
          本工具为民间经验公式（总菜数 ≈ 人数 + 2 + 场合加成，凉:热:汤 ≈ 1:3:1），不同菜系分量差异大，结果按「参考」看待、上桌前留一手。
        </div>
      </div>

      <!-- 右侧：建议菜单 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <ClipboardList class="w-5 h-5 mr-2 text-primary" /> 建议菜单结构
        </h2>

        <div class="p-4 bg-primary/10 rounded-lg text-center">
          <p class="text-xs text-muted-foreground mb-1">共约 {{ plan.total }} 道菜 · {{ strategyLabel }}</p>
          <p class="text-xl font-bold text-primary">
            凉 {{ plan.cold }} + 热 {{ plan.hot }}（荤 {{ plan.meat }} 素 {{ plan.veg }}）+ 汤 {{ plan.soup }}
          </p>
          <p class="text-xs text-muted-foreground mt-1.5">人均约 {{ perPerson }} 道，{{ plan.marginNote }}</p>
        </div>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span class="text-muted-foreground">凉菜</span>
            <span class="font-semibold text-foreground">{{ plan.cold }} 道</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span class="text-muted-foreground">热菜（荤素各半{{ hasElderlyKids ? '，含 1 道蒸软菜' : '' }}）</span>
            <span class="font-semibold text-foreground">{{ plan.hot }} 道（荤 {{ plan.meat }} / 素 {{ plan.veg }}）</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span class="text-muted-foreground">汤</span>
            <span class="font-semibold text-foreground">{{ plan.soup }} 道</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span class="text-muted-foreground">硬菜（大菜，每桌 10 人 2 道）</span>
            <span class="font-semibold text-foreground">{{ plan.bigDishes }} 道</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span class="text-muted-foreground">主食米饭（人均 {{ alcohol !== 'none' ? '0.15' : '0.2' }} 碗）</span>
            <span class="font-semibold text-foreground">约 {{ plan.riceBowls }} 碗</span>
          </div>
        </div>

        <div class="p-4 bg-muted rounded-lg">
          <h3 class="text-sm font-medium mb-2 flex items-center gap-2 text-foreground">
            <Lightbulb class="w-4 h-4" /> 点菜小贴士
          </h3>
          <div class="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <p>• 上菜节奏：凉菜先上、热菜分批，请客场合把硬菜排在中间上，场面感最好。</p>
            <p>• 荤素搭配：一荤配一素交替点，叶菜与根茎类混搭，比全点硬菜更耐吃。</p>
            <p>• 按菜系调整：东北菜分量大可减 1–2 道，粤菜精致可加 1 道；先按本表点，吃完光盘下次再加量。</p>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>家宴点菜计算器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            家宴点菜计算器把「几个人点几个菜」这道经典难题变成一次输入：家常饭求刚好，请客吃饭要体面，婚宴桌数多更要控制成本。工具按流传较广的经验公式生成凉菜、热菜（荤素各半）、汤与主食的配比，并针对老人小孩、饮酒等变量微调，帮你避免「点多吃不完」和「点少不够吃」两种尴尬。
          </p>
          <h3 class="text-lg font-semibold text-foreground">经验公式说明</h3>
          <ul class="list-disc list-inside space-y-1">
            <li><span class="text-foreground font-medium">总菜数</span> ≈ 人数 + 2，请客再加 2 道、婚宴再加 4 道；</li>
            <li><span class="text-foreground font-medium">结构配比</span>：凉菜 : 热菜 : 汤 ≈ 1 : 3 : 1，热菜内部荤素各半；</li>
            <li><span class="text-foreground font-medium">硬菜</span>：按每桌 10 人 2 道大菜（整鱼、肘子、炖鸡等）；</li>
            <li><span class="text-foreground font-medium">主食</span>：米饭人均 0.2 碗，饮酒场合降到 0.15 碗并加 1 道下酒凉菜。</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">宁少勿多还是留余量</h3>
          <p>
            家常场合建议「宁少勿多」：先按表点，不够再加两个快菜，避免剩菜压力；请客与婚宴建议「留余量」：在表的基础上额外备 1–2 道，菜量见碟不见底，主人才体面。工具会随场合自动切换该策略提示。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">8 个人请客点几个菜？</span>按公式约为 8 + 2 + 2 = 12 道：凉 2、热 8（荤 4 素 4）、汤 2，硬菜 2 道，再按菜系分量微调。</li>
            <li><span class="text-foreground font-medium">老人小孩多要改吗？</span>工具会自动加 1 道蒸菜/软烂素菜，点菜时优先选清蒸、炖煮与少辣少刺的菜品，鱼肉类避开多刺部位。</li>
            <li><span class="text-foreground font-medium">为什么和饭店推荐桌菜数不一样？</span>本工具按「人份经验值」估算，饭店套餐按毛利结构配量（分量偏小、汤饮凑数）。以本表为基准，实际按菜系分量与饭量增减 1–2 道即可。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'banquet-dish-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Utensils, Users, ClipboardList, Lightbulb,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '家宴点菜计算器 - 聚餐宴请菜量配比估算工具',
  description: '在线家宴点菜计算器，按人数与场合（家常/请客/婚宴）用民间经验公式生成凉菜热菜汤与主食配比，荤素各半、硬菜按桌、支持老人小孩与酒类变量调整，附点菜小贴士，纯本地计算',
  keywords: '家宴点菜, 几个人点几个菜, 聚餐点菜, 请客点菜数量, 宴请菜单, 菜量计算, 婚宴点菜',
  author: 'Util工具箱',
  ogTitle: '家宴点菜计算器 - 有条工具',
  ogDescription: '按人数与场合生成凉热汤点配比与主食克重，聚餐宴请不再点多吃不饱',
  ogUrl: 'https://www.util.cn/tools/banquet-dish-calculator',
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
          name: '家宴点菜计算器',
          url: 'https://www.util.cn/tools/banquet-dish-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['人数场合双变量估算', '凉热汤1:3:1配比', '热菜荤素各半', '硬菜按桌与主食碗数', '宁少勿多/留余量策略切换']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '家宴点菜计算器', item: 'https://www.util.cn/tools/banquet-dish-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '8个人请客点几个菜？',
              acceptedAnswer: { '@type': 'Answer', text: '按经验公式约为8+2+2=12道：凉菜2、热菜8（荤4素4）、汤2，硬菜2道，再按菜系分量增减。' }
            },
            {
              '@type': 'Question',
              name: '有老人小孩怎么调整？',
              acceptedAnswer: { '@type': 'Answer', text: '在菜单中加1道蒸菜或软烂素菜，优先清蒸炖煮、少辣少刺的菜品，主食保持松软。' }
            },
            {
              '@type': 'Question',
              name: '这个算法准确吗？',
              acceptedAnswer: { '@type': 'Answer', text: '属民间经验估算，不同菜系分量差异较大（东北菜偏大、粤菜精致），结果仅作参考，建议按实际饭量上下浮动1-2道。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'banquet-dish-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* __PURE_START__ */
// 场合加成（民间经验公式：总菜数 ≈ 人数 + 2 + 场合加成）
const OCCASIONS = {
  home: { label: '家常', bonus: 0, margin: 0, strategy: '宁少勿多' },
  host: { label: '请客', bonus: 2, margin: 1, strategy: '留余量' },
  wedding: { label: '婚宴', bonus: 4, margin: 2, strategy: '留余量' }
}

// 生成菜单结构：凉:热:汤 ≈ 1:3:1，热菜荤素各半
const planDishes = (ppl, occasionKey, elderlyKids, alcoholKey) => {
  const n = Math.min(30, Math.max(2, Math.round(Number(ppl) || 2)))
  const occ = OCCASIONS[occasionKey] || OCCASIONS.home
  let total = n + 2 + occ.bonus

  let cold = Math.round(total / 5)
  let soup = Math.round(total / 5)
  let hot = total - cold - soup
  let meat = Math.ceil(hot / 2)
  let veg = hot - meat

  if (elderlyKids) { veg += 1; hot += 1; total += 1 }
  const hasAlcohol = alcoholKey !== undefined && alcoholKey !== 'none'
  if (hasAlcohol) { cold += 1; total += 1 }

  const riceBowls = Math.round(n * (hasAlcohol ? 0.15 : 0.2) * 10) / 10
  const tables = Math.max(1, Math.ceil(n / 10))
  const bigDishes = tables * 2
  const marginNote = occ.strategy === '宁少勿多'
    ? '宁少勿多：先按表点，不够再加两个快菜'
    : `留余量：建议再备 ${occ.margin} 道，菜量见碟不见底`

  return {
    total, cold, hot, meat, veg, soup,
    riceBowls, bigDishes,
    strategy: occ.strategy,
    marginNote,
    perPerson: Math.round((total / n) * 10) / 10
  }
}
/* __PURE_END__ */

// ---------- 状态 ----------
const people = ref(8)
const occasion = ref('host')
const hasElderlyKids = ref(false)
const alcohol = ref('none')
const seoContentVisible = ref(true)

const occasionOptions = [
  { key: 'home', label: '家常' },
  { key: 'host', label: '请客' },
  { key: 'wedding', label: '婚宴' }
]

const alcoholOptions = [
  { key: 'none', label: '不喝酒' },
  { key: 'baijiu', label: '白酒' },
  { key: 'beer', label: '啤酒' },
  { key: 'wine', label: '红酒' }
]

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const plan = computed(() => planDishes(people.value, occasion.value, hasElderlyKids.value, alcohol.value))

const strategyLabel = computed(() => {
  const o = OCCASIONS[occasion.value]
  return `${o ? o.label : '家常'} · ${plan.value.strategy}`
})

const perPerson = computed(() => plan.value.perPerson.toFixed(1))
</script>
