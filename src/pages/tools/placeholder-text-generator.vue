<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Type class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">占位文案生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">按行业模板组织，句子通顺可读，设计稿直接可用</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        选择行业与文案类型，一键生成中文占位文案。与随机字符或无意义的假文不同，这里的内容按行业句式模板组织，主语、谓语、修饰片段组合成通顺可读的句子，适合直接放进原型、设计稿与演示页面。全部在浏览器本地生成。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：设置 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 生成设置
          </h2>

          <!-- 行业 -->
          <label class="block text-xs text-muted-foreground mb-1.5 flex items-center">
            <Filter class="w-3.5 h-3.5 mr-1" /> 行业
          </label>
          <select
            v-model="industry"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="ind in industries" :key="ind.id" :value="ind.id">{{ ind.name }}</option>
          </select>

          <!-- 类型 -->
          <label class="block text-xs text-muted-foreground mb-1.5">文案类型</label>
          <div class="grid grid-cols-3 gap-1.5 mb-4">
            <button
              v-for="t in typeOptions"
              :key="t.value"
              @click="type = t.value"
              :class="type === t.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all"
            >{{ t.label }}</button>
          </div>
          <p class="text-xs text-muted-foreground mb-4">{{ currentTypeDesc }}</p>

          <!-- 数量 -->
          <div class="mb-5">
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs text-muted-foreground">生成数量</label>
              <span class="text-xs text-muted-foreground">{{ count }} 条</span>
            </div>
            <input
              v-model.number="count"
              type="range"
              min="1"
              max="20"
              class="w-full accent-primary"
              @change="clampCount"
            />
          </div>

          <button
            @click="generate"
            class="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCw class="w-4 h-4" /> 随机重摇
          </button>
        </div>

        <!-- 差异化说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 与随机文本生成的区别
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">随机文本生成</span>：输出乱序字符或 Lorem Ipsum 式假文，适合纯排版测试</li>
            <li>• <span class="text-foreground">占位文案生成器</span>：按行业句式模板组合，句子通顺、语义合理，评审时不会出戏</li>
            <li>• 内容为模板拼凑的虚构文案，仅作占位演示，请勿直接作为真实业务文案发布</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：结果 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Type class="w-5 h-5 mr-2 text-primary" />
              生成结果（{{ outputList.length }} 条）
            </h2>
            <button
              @click="copyAll"
              :disabled="outputList.length === 0"
              class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制全部
            </button>
          </div>

          <div class="p-6">
            <div v-if="outputList.length" class="space-y-3">
              <div
                v-for="(text, idx) in outputList"
                :key="idx"
                class="group flex items-start gap-3 bg-muted/30 border border-border rounded-lg p-3.5"
              >
                <span class="text-xs text-muted-foreground font-mono flex-shrink-0 mt-0.5 w-6 text-right">{{ idx + 1 }}.</span>
                <p
                  class="flex-1 min-w-0 text-foreground"
                  :class="type === 'para' ? 'text-sm leading-relaxed' : 'text-sm font-medium'"
                >{{ text }}</p>
                <button
                  @click="copyOne(text)"
                  class="flex-shrink-0 bg-muted hover:bg-muted/80 text-muted-foreground p-1.5 rounded transition-all"
                  :title="'复制这条'"
                >
                  <Copy class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div v-else class="py-16 text-center">
              <Type class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">选择行业与类型，点击「随机重摇」生成占位文案</p>
            </div>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于占位文案生成器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            设计稿和原型里最怕两种占位内容：一种是"这里是标题这里是正文"的说明文字，无法评估真实的排版密度；另一种是随机乱码或 Lorem Ipsum，评审时容易让人出戏。占位文案生成器在两者之间取了个平衡——按行业（通用、科技、电商、餐饮、教育、医疗）内置句式模板池，把主语片段、谓语片段与修饰片段组合成通顺可读的中文句子，长短可控、语义合理，放在演示里就像真实产品。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>原型与高保真设计稿：让界面看起来像"真的产品"，提升评审与演示效果</li>
            <li>前端开发 Mock：列表页、卡片流需要批量中文标题与摘要时一键填充</li>
            <li>模板与主题演示：CMS、电商、官网模板的默认展示内容</li>
            <li>测试排版：短标题、长标题、多行段落混合，检验截断与换行表现</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">内容是真实的吗？</span>不是。所有文案由句式模板随机拼凑生成，仅适合占位与演示，请勿作为真实业务文案发布。</li>
            <li><span class="text-foreground font-medium">会重复吗？</span>生成时自动去重；片段池组合空间很大，20 条以内几乎不会出现重复。</li>
            <li><span class="text-foreground font-medium">数据会上传吗？</span>不会，生成完全在浏览器本地完成。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'placeholder-text-generator'" :category="'text'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Type, Settings2, Copy, Info, RotateCw, Filter,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '占位文案生成器 - 中文假文/占位文本生成工具',
  description: '在线中文占位文案生成器，按通用/科技/电商/餐饮/教育/医疗行业模板生成通顺可读的短标题、长标题与段落文案，数量可控、一键复制，适合设计稿与原型占位，纯本地生成',
  keywords: '占位文案, 中文假文, 占位文本生成, 设计稿文案, 原型填充文案, placeholder text, mock文案',
  author: 'Util工具箱',
  ogTitle: '占位文案生成器 - 有条工具',
  ogDescription: '按行业模板组织，句子通顺可读，设计稿直接可用',
  ogUrl: 'https://www.util.cn/tools/placeholder-text-generator',
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
          name: '占位文案生成器',
          url: 'https://www.util.cn/tools/placeholder-text-generator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['六大行业模板', '短标题/长标题/段落', '1-20条批量生成', '单条与全部复制', '自动去重']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本处理', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: '占位文案生成器', item: 'https://www.util.cn/tools/placeholder-text-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '生成的文案可以正式使用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不可以。内容由句式模板随机拼凑，仅适合设计稿、原型与演示中的占位场景。' }
            },
            {
              '@type': 'Question',
              name: '与随机文本生成有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '随机文本输出乱序字符或无意义假文；本工具按行业句式模板组织，句子通顺可读，评审演示时更真实。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'placeholder-text-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 行业模板池（主语 S × 谓语 V × 修饰/领域 A × 载体 B × 效果 E） ----------
const industries = [
  {
    id: 'general', name: '通用',
    pools: {
      A: ['数字化', '协同办公', '品质服务', '精细化', '智能化', '一站式', '轻量化', '标准化'],
      B: ['工作台', '解决方案', '管理平台', '服务体系', '协作空间', '工具箱', '智能助手', '流程引擎'],
      S: ['团队', '企业', '组织', '项目组', '管理者', '每一位用户'],
      V: ['需要一套可靠的', '正在选择', '值得拥有', '可以信赖', '离不开'],
      E: ['让复杂的事情变简单', '让协作更加顺畅', '让效率提升看得见', '把时间还给重要的事', '让每一步都有据可依']
    },
    short: ['{A}{B}好帮手', '一站式{A}{B}', '{A}时代的{B}', '智慧{A}{B}', '{A}{B}新体验', '{A}{B}优选'],
    long: ['{A}{B}，{E}', '基于{A}理念的{B}，{E}', '为{S}打造的{A}{B}', '{A}时代，{S}的{B}之选', '让{S}{E}的{A}{B}'],
    sent: [
      '{S}{V}{A}{B}，{E}。',
      '在{A}的场景里，一套顺手的{B}往往能让{S}事半功倍。',
      '从挑选合适的{B}开始，{E}。',
      '{E}，这正是{A}{B}想要解决的问题。',
      '无论需求如何变化，{S}总能找到称手的{A}{B}。'
    ]
  },
  {
    id: 'tech', name: '科技',
    pools: {
      A: ['人工智能', '大数据', '云原生', '低代码', '物联网', '微服务', '边缘计算', '自动化'],
      B: ['开发平台', '数据中台', '解决方案', '推理引擎', '工具链', '监控体系', '服务网关', '部署方案'],
      S: ['开发者', '技术团队', '企业客户', '架构师', '产品经理'],
      V: ['正在采用', '信赖', '需要一套', '离不开'],
      E: ['让部署效率翻倍', '让数据驱动每一次决策', '让系统稳定运行', '让创新快速落地', '让运维省心省力']
    },
    short: ['{A}{B}上线', '新一代{A}{B}', '{A}{B}实践', '{A}驱动的{B}', '开箱即用的{A}{B}', '{A}{B}指南'],
    long: ['基于{A}的{B}，{E}', '{A}{B}：{E}', '面向{S}的{A}{B}，{E}', '当{S}遇上{A}，{B}这样选', '{A}加持的{B}，{E}'],
    sent: [
      '{S}{V}{A}{B}，{E}。',
      '在真实的业务场景里，{A}不是噱头，{B}才是落地关键。',
      '从选型到上线，一套靠谱的{A}{B}能让{S}少走很多弯路。',
      '{E}，这背后离不开{A}{B}的支撑。',
      '技术选型没有银弹，但{A}{B}值得优先评估。'
    ]
  },
  {
    id: 'ecom', name: '电商',
    pools: {
      A: ['全渠道', '私域运营', '直播带货', '会员营销', '跨境', '社区团购', '品牌精选'],
      B: ['商城系统', '营销方案', '供应链', '选品清单', '优惠专区', '门店', '购物节'],
      S: ['商家', '店铺', '品牌', '消费者', '运营团队'],
      V: ['纷纷选择', '青睐', '正在加入', '需要一套'],
      E: ['让成交自然增长', '让复购成为习惯', '让好货卖得更好', '让经营降本增效', '让流量变成留量']
    },
    short: ['{A}{B}热卖中', '{A}{B}专场', '精选{A}{B}', '{A}{B}上新', '{A}好物{B}', '{A}{B}甄选'],
    long: ['{A}{B}，{E}', '{A}时代，{S}的{B}指南', '好物来自{A}，{E}', '{S}都在用的{A}{B}', '{A}{B}进行时，{E}'],
    sent: [
      '{S}{V}{A}{B}，{E}。',
      '从选品到售后，{A}{B}让{S}的经营更从容。',
      '{E}，这是{A}{B}给{S}的承诺。',
      '会买的{S}，都懂得用好{A}{B}。',
      '一场{A}{B}，可能就是一次生意转折点。'
    ]
  },
  {
    id: 'food', name: '餐饮',
    pools: {
      A: ['新鲜食材', '招牌风味', '本地优选', '手工制作', '轻食健康', '深夜食堂', '家常味道'],
      B: ['菜单', '套餐', '门店', '中央厨房', '外送服务', '甜品站', '美食地图'],
      S: ['主厨', '门店', '餐厅', '美食爱好者', '老顾客'],
      V: ['推荐', '精心准备', '严选', '用心呈现'],
      E: ['让每一口都值得期待', '把新鲜送上餐桌', '让美味触手可及', '用味道留住回头客', '让用餐成为享受']
    },
    short: ['{A}{B}上新', '今日{A}{B}', '{A}{B}推荐', '招牌{A}{B}', '{A}{B}指南', '人气{A}{B}'],
    long: ['{A}{B}，{E}', '一口{A}，{E}', '{S}的{A}{B}日常', '从{A}到{B}，{E}', '{A}{B}：{E}'],
    sent: [
      '{S}{V}{A}{B}，{E}。',
      '好的味道离不开{A}，也离不开一套用心的{B}。',
      '{E}，这是{S}对{A}{B}的坚持。',
      '忙碌之余，让{A}{B}治愈一天的疲惫。',
      '从后厨到餐桌，{A}{B}把细节做到位。'
    ]
  },
  {
    id: 'edu', name: '教育',
    pools: {
      A: ['素质教育', '双语启蒙', '编程思维', '兴趣培养', '在线课堂', '因材施教', '全科辅导'],
      B: ['课程体系', '学习平台', '成长计划', '名师课堂', '练习册', '训练营', '学习社区'],
      S: ['孩子', '学员', '家长', '老师', '学习者'],
      V: ['正在加入', '适合', '需要一套', '信赖'],
      E: ['让学习成为习惯', '让进步看得见', '让每个孩子被看见', '让知识触手可及', '让成长更有方向']
    },
    short: ['{A}{B}开课', '{A}{B}计划', '新学期{A}{B}', '{A}{B}指南', '{A}启蒙{B}', '{A}{B}营'],
    long: ['{A}{B}，{E}', '给{S}的{A}{B}', '从{A}开始，{E}', '{A}{B}：{E}', '选对{B}，{A}事半功倍'],
    sent: [
      '{S}{V}{A}{B}，{E}。',
      '比起刷题，{A}{B}更在意{S}的长期兴趣。',
      '{E}，好的{B}应当做到这一点。',
      '每个{S}的节奏不同，{A}{B}讲究循序渐进。',
      '从入门到进阶，{A}{B}陪{S}稳步向前。'
    ]
  },
  {
    id: 'med', name: '医疗',
    pools: {
      A: ['全民健康', '慢病管理', '在线问诊', '心理关怀', '定期体检', '康复护理', '预防医学'],
      B: ['健康档案', '服务方案', '管理平台', '咨询服务', '报告解读', '随访计划'],
      S: ['家庭', '患者', '医生', '用户', '体检机构'],
      V: ['正在使用', '需要', '值得信赖', '推荐使用'],
      E: ['让健康管理更简单', '让就医少跑冤枉路', '把关怀落到日常', '让专业守护每一天', '让健康有迹可循']
    },
    short: ['{A}{B}上线', '{A}{B}服务', '您的{A}{B}', '{A}{B}指南', '安心{A}{B}', '{A}{B}关怀'],
    long: ['{A}{B}，{E}', '为{S}提供的{A}{B}', '{A}从{B}开始', '{A}{B}：{E}', '专业{A}{B}，{E}'],
    sent: [
      '{S}{V}{A}{B}，{E}。',
      '健康不是一次体检，而是日常的{A}{B}。',
      '{E}，让{S}更安心。',
      '把专业交给{B}，把放心留给{S}。',
      '从预防到随访，{A}{B}守护每一步。'
    ]
  }
]

// ---------- 状态 ----------
const typeOptions = [
  { value: 'short', label: '短标题', desc: '8-12 字标题，适合卡片与列表' },
  { value: 'long', label: '长标题', desc: '15-25 字带效果描述的标题' },
  { value: 'para', label: '段落', desc: '2-3 句连贯短文，适合正文占位' }
]

const industry = ref('general')
const type = ref('short')
const count = ref(5)
const outputList = ref([])
const seoContentVisible = ref(true)

const currentIndustry = computed(() => industries.find(i => i.id === industry.value) || industries[0])
const currentTypeDesc = computed(() => typeOptions.find(t => t.value === type.value)?.desc || '')

const clampCount = () => {
  if (!Number.isFinite(count.value)) count.value = 5
  count.value = Math.max(1, Math.min(20, Math.round(count.value)))
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 生成引擎 ----------
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

const fillTemplate = (tpl, pools) => {
  return tpl.replace(/\{([A-Za-z]+)\}/g, (m, key) => (pools[key] ? pick(pools[key]) : m))
}

const pickSentenceSet = (ind, n) => {
  const pool = [...ind.sent]
  const chosen = []
  for (let i = 0; i < n && pool.length; i++) {
    chosen.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
  }
  return chosen
}

const generateOne = (ind, kind) => {
  if (kind === 'short') {
    // 短标题：尝试让长度落在 8-12 字（去除标点后计长）
    let best = ''
    for (let i = 0; i < 40; i++) {
      const text = fillTemplate(pick(ind.short), ind.pools).replace(/[，。、：]/g, '')
      const len = text.length
      if (len >= 8 && len <= 12) return text
      if (!best || Math.abs(len - 10) < Math.abs(best.length - 10)) best = text
    }
    return best
  }
  if (kind === 'long') return fillTemplate(pick(ind.long), ind.pools)
  // 段落：2-3 个不重复句式组合
  const n = 2 + Math.floor(Math.random() * 2)
  return pickSentenceSet(ind, n).map((tpl) => fillTemplate(tpl, ind.pools)).join('')
}

const generate = () => {
  clampCount()
  const ind = currentIndustry.value
  const results = []
  const seen = new Set()
  let guard = 0
  while (results.length < count.value && guard < count.value * 40) {
    guard++
    const text = generateOne(ind, type.value)
    if (!text || seen.has(text)) continue
    seen.add(text)
    results.push(text)
  }
  outputList.value = results
}

// 行业或类型切换时自动生成
watch([industry, type], generate)

// ---------- 复制 ----------
const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const copyOne = async (text) => {
  await copyText(text)
}

const copyAll = async () => {
  if (!outputList.value.length) return
  await copyText(outputList.value.join('\n'))
}

onMounted(() => {
  generate()
})
</script>
