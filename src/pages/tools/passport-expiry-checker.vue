<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Plane class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">护照有效期提醒</h1>
          <p class="text-sm text-muted-foreground mt-1">对照各国「6 个月规则」判定能否出行，并给出换发时间建议</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入护照到期日、计划出行日期与目的地，工具按内置约 20 个热门国家/地区的公开口径（剩余有效月数要求、申根的
        「离境后 3 个月 + 签发 10 年内」等）自动判定「可以出行 / 存在风险 / 需换发」三种状态，
        并倒排最早建议申请换发的时间点。全部在浏览器本地计算，不上传任何个人信息。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <FileClock class="w-5 h-5 mr-2 text-primary" /> 出行信息
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2" for="expiryDate">护照到期日</label>
          <input
            id="expiryDate"
            v-model="expiryDate"
            type="date"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2" for="travelDate">计划出行日期</label>
          <input
            id="travelDate"
            v-model="travelDate"
            type="date"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2" for="destSelect">目的地</label>
          <select
            id="destSelect"
            v-model="destination"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="r in RULES" :key="r.id" :value="r.id">{{ r.label }} — {{ r.ruleText }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2" for="issueDate">
            护照签发日期（选填，申根国家建议填写）
          </label>
          <input
            id="issueDate"
            v-model="issueDate"
            type="date"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div class="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
          <div class="flex justify-between">
            <span class="text-muted-foreground">出行时剩余有效期</span>
            <span class="font-semibold text-foreground">{{ result.remainingLabel }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">目的地要求</span>
            <span class="font-semibold text-foreground">{{ currentRule.ruleText }}</span>
          </div>
        </div>

        <p v-if="inputError" class="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
          <AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ inputError }}
        </p>
      </div>

      <!-- 右侧：判定结果 -->
      <div class="bg-card border border-border rounded-lg p-6 flex flex-col">
        <h2 class="text-lg font-semibold flex items-center mb-4">
          <ShieldCheck class="w-5 h-5 mr-2 text-primary" /> 判定结果
        </h2>

        <template v-if="result.valid">
          <!-- 状态横幅 -->
          <div
            class="rounded-lg p-5 mb-4 flex items-center gap-4"
            :class="statusBg"
          >
            <component :is="statusIcon" class="w-10 h-10 flex-shrink-0" />
            <div>
              <p class="text-xl font-bold">{{ result.statusLabel }}</p>
              <p class="text-sm mt-0.5 opacity-90">{{ result.statusHint }}</p>
            </div>
          </div>

          <!-- 判定明细 -->
          <div class="text-sm space-y-2 mb-4">
            <div class="flex items-start justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">对照要求</span>
              <span class="text-foreground text-right font-medium ml-4">{{ currentRule.ruleText }}</span>
            </div>
            <div class="flex items-start justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">有效期最晚需覆盖到</span>
              <span class="text-foreground font-medium">{{ result.cutoffLabel }}</span>
            </div>
            <div v-if="currentRule.issueYears" class="flex items-start justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">签发日期要求（{{ currentRule.issueYears }} 年内）</span>
              <span class="font-medium" :class="result.tenYearOk ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                {{ result.tenYearOk ? (issueDate ? '符合' : '未填写签发日，请自行核对') : '已超 10 年，不符合' }}
              </span>
            </div>
            <div class="flex items-start justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">建议最晚换发完成日</span>
              <span class="text-foreground font-medium">{{ result.deadlineLabel }}</span>
            </div>
            <div class="flex items-start justify-between py-2">
              <span class="text-muted-foreground">最早建议申请日（预留约 2 个月办理周期）</span>
              <span class="text-primary font-semibold">{{ result.applyAdviceLabel }}</span>
            </div>
          </div>

          <div v-if="result.status !== 'ok'" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-3 flex items-start gap-2 mb-4">
            <RotateCcw class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              换发不影响旧护照上的有效签证：换发后旧护照将被剪角但会退还本人，有效签证可新旧护照同时出示使用
              （以各国使领馆口径为准）。出行前建议同步核对目的地签证要求。
            </p>
          </div>

          <!-- 换发通用提示 -->
          <div class="mt-auto bg-muted/50 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-foreground mb-2 flex items-center">
              <BookOpen class="w-4 h-4 mr-1.5 text-primary" /> 护照换发通用提示
            </h3>
            <ul class="text-xs text-muted-foreground space-y-1 leading-relaxed">
              <li>• 材料：出入境申请表、身份证、旧护照、2 寸白底证件照（部分地区可现场采集）</li>
              <li>• 时长：内地换发一般约 7 个工作日，加急可至 5 个工作日，以国家移民管理局与受理窗口为准</li>
              <li>• 时机：有效期不足或行程密集时可提前换发，换发后新护照有效期 10 年（16 周岁以上）</li>
            </ul>
          </div>
        </template>

        <div v-else class="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
          <Plane class="w-10 h-10 mb-3 opacity-40" />
          <p class="text-sm">{{ inputError || '填写护照到期日与出行日期后自动判定' }}</p>
        </div>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        免责声明：内置规则为各国移民与边检公开宣传口径的常见要求整理（部分国家对特定护照持有人存在「6 个月俱乐部」等豁免），
        航司值机、边检与使领馆的实际执行可能更严或随时调整，<strong>出行前请以各国驻华使领馆与国家移民管理局的最新规定为准</strong>。
        本工具结果仅供参考，不构成出行或拒出行的法定依据。
      </p>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
        :aria-label="seoContentVisible ? '收起说明' : '展开说明'"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于护照有效期与「6 个月规则」</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            很多出境被拒或航司拒绝登机的原因不是签证，而是护照有效期：相当多国家规定入境时护照剩余有效期不得少于
            6 个月（即从入境日往后推 6 个月仍有效）。本工具把护照到期日、出行日期与目的地规则放在一起算，
            一眼看出「还能走吗、什么时候必须换」。
          </p>
          <h3 class="text-lg font-semibold text-foreground">「6 个月规则」到底怎么算</h3>
          <p>
            关键是把「出行日」而不是「今天」当作起点：要求 = 到期日 ≥ 出行日 + 6 个月。
            例如护照 2027-01-01 到期、2026-09-01 出发去按 6 个月口径执行的国家，剩余只有 4 个月，不足 6 个月，
            航司与边检都可能拦下；同样的护照改到 2026-05-01 出发则满足要求。剩余恰好等于要求值时视为达标，
            但本工具仍会提示「存在风险」——入境后停留期越长，离境时越可能跌破要求。
          </p>
          <h3 class="text-lg font-semibold text-foreground">申根国家的两条线</h3>
          <p>
            申根区除要求护照在「计划离开申根区之日」后仍有至少 3 个月有效期外，还要求护照签发日期在 10 年以内——
            即使到期日足够，一本 2015 年签发、2030 年到期的旧护照也不符合入境条件。填写签发日期后本工具会同时校验这两条线。
            计划停留多久请以行程为准，3 个月按离境日计算意味着实际要求可能比本工具的保守估算更高。
          </p>
          <h3 class="text-lg font-semibold text-foreground">什么时候该去换发</h3>
          <p>
            建议以「判定不达标的时间点」倒排：先算出有效期最晚需覆盖到哪一天（达标线），再往前预留约 2 个月办理周期，
            即为最早建议申请日。剩余有效期已经不足或行程在 3 个月内的，直接预约换发；
            换发期间旧护照上的有效签证可新旧本一起使用，多数国家认可这一做法。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">护照只剩 5 个月，能去要求 6 个月的国家吗？</span>按公开口径不达标：从出行日往后推满 6 个月才安全。即使个别国家存在豁免或航司放行，边检仍有权拒绝入境，建议换发后再出行。</li>
            <li><span class="text-foreground font-medium">「有效期充足」但签证快到期怎么办？</span>本工具只判护照有效期；签证/停留期要求（如美国 EVUS、电子签时效）请另行核对，两者取更严格者执行。</li>
            <li><span class="text-foreground font-medium">换发需要多久？旧护照签证还有效吗？</span>内地一般约 7 个工作日（可加急），材料以受理窗口公示为准；换发后旧护照剪角退还本人，上面的有效签证通常可新旧护照同时出示使用。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'passport-expiry-checker'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Plane, FileClock, ShieldCheck, ShieldX, ShieldAlert,
  AlertTriangle, ChevronUp, ChevronDown, RotateCcw, BookOpen
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '护照有效期提醒 - 各国6个月规则出行判定与换发时间',
  description: '在线护照有效期检查工具，输入到期日、出行日期与目的地，按内置约20个国家/地区的公开口径（6个月/3个月/仅需有效/申根离境后3个月+签发10年内）判定可以出行、存在风险或需换发，并给出换发时间建议，纯本地计算',
  keywords: '护照有效期6个月规则, 护照快到期能出国吗, 出境护照要求, 护照换发时间, 申根护照要求, 免签入境要求',
  author: '有条工具',
  ogTitle: '护照有效期提醒 - 有条工具',
  ogDescription: '按各国公开口径判定护照有效期能否出境，并提示换发时机',
  ogUrl: 'https://www.util.cn/tools/passport-expiry-checker',
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
          name: '护照有效期提醒',
          url: 'https://www.util.cn/tools/passport-expiry-checker',
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['约20国/地区有效期口径对照', '6个月规则判定', '申根双条件校验', '换发时间倒排建议', '纯本地计算']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '护照有效期提醒', item: 'https://www.util.cn/tools/passport-expiry-checker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '护照只剩5个月，能去要求6个月的国家吗？',
              acceptedAnswer: { '@type': 'Answer', text: '按公开口径不达标：要求从出行日往后推满6个月仍有效。即使个别国家存在豁免或航司放行，边检仍可能拒绝入境，建议换发后再出行。' }
            },
            {
              '@type': 'Question',
              name: '申根国家对护照有什么特殊要求？',
              acceptedAnswer: { '@type': 'Answer', text: '两条线：计划在申根停留后护照仍有至少3个月有效期，且护照签发日期在10年以内；到期日足够但签发超过10年同样不符合入境条件。' }
            },
            {
              '@type': 'Question',
              name: '换发护照后旧护照上的签证还有效吗？',
              acceptedAnswer: { '@type': 'Answer', text: '换发时旧护照剪角后退还本人，上面的有效签证多数国家认可新旧护照同时出示使用，具体以相关使领馆口径为准。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'passport-expiry-checker')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* ==== PURE:BEGIN ==== */
const pad2 = (n) => String(n).padStart(2, '0')
const dateKey = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())

const parseDateKey = (key) => {
  const parts = String(key || '').split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  return isNaN(d.getTime()) ? null : d
}

// 加 n 个月，处理月末溢出（1月31日 + 1个月 → 2月28/29日）
const addMonths = (d, n) => {
  const base = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()
  return new Date(base.getFullYear(), base.getMonth(), Math.min(d.getDate(), lastDay))
}

// 内置各国/地区公开宣传口径（常见要求整理，实际执行以使领馆最新公告为准）
const RULES = [
  { id: 'us', label: '美国', months: 6, ruleText: '入境时有效期≥6个月', note: '部分国籍适用“六个月俱乐部”豁免，航司与边检常按6个月查验' },
  { id: 'canada', label: '加拿大', months: 0, ruleText: '停留期内有效即可', note: '建议预留充足有效期' },
  { id: 'japan', label: '日本', months: 0, ruleText: '入境及在留期间护照有效', note: '以可确认的有效期限为准' },
  { id: 'korea', label: '韩国', months: 0, ruleText: '入境时有效即可', note: '免签/电子旅行许可(K-ETA)另行核对' },
  { id: 'singapore', label: '新加坡', months: 6, ruleText: '入境时有效期≥6个月', note: '另需行程单与酒店订单备查' },
  { id: 'malaysia', label: '马来西亚', months: 6, ruleText: '入境时有效期≥6个月', note: 'MDAC 电子入境卡另行填报' },
  { id: 'thailand', label: '泰国', months: 6, ruleText: '入境时有效期≥6个月', note: '落地签/免签期以最新政策为准' },
  { id: 'vietnam', label: '越南', months: 6, ruleText: '入境时有效期≥6个月', note: '部分口岸口径为4个月，从严按6个月准备' },
  { id: 'indonesia', label: '印度尼西亚', months: 6, ruleText: '入境时有效期≥6个月', note: '巴厘岛等落地签同要求' },
  { id: 'philippines', label: '菲律宾', months: 6, ruleText: '入境时有效期≥6个月', note: '并需返程/续程机票' },
  { id: 'maldives', label: '马尔代夫', months: 1, ruleText: '有效期≥1个月', note: '落地签免费，离境税含在票价' },
  { id: 'uae', label: '阿联酋', months: 6, ruleText: '入境时有效期≥6个月', note: '免签停留期以口岸为准' },
  { id: 'turkey', label: '土耳其', months: 5, ruleText: '入境后仍有≥150天有效期', note: '电子签证有效期90天需另行核对' },
  { id: 'schengen', label: '申根国家（法德意西荷等）', months: 3, issueYears: 10, ruleText: '离境后≥3个月有效+签发≤10年', note: '3个月按计划离开申根之日计，本工具按出行日保守估算' },
  { id: 'uk', label: '英国', months: 0, ruleText: '整个停留期间有效即可', note: '电子签证许可(ETA)另行核对' },
  { id: 'russia', label: '俄罗斯', months: 6, ruleText: '入境起有效期≥6个月', note: '签证材料按俄方指定清单' },
  { id: 'australia', label: '澳大利亚', months: 0, ruleText: '入境及停留期内有效', note: '部分航司建议余6个月' },
  { id: 'newzealand', label: '新西兰', months: 1, ruleText: '离境后有效期≥1个月', note: 'NZeTA 另行申请' },
  { id: 'egypt', label: '埃及', months: 6, ruleText: '入境时有效期≥6个月', note: '落地签需材料备查' },
  { id: 'brazil', label: '巴西', months: 6, ruleText: '入境时有效期≥6个月', note: '电子签证按领馆要求办理' }
]

const getRule = (id) => RULES.find((r) => r.id === id) || RULES[0]

const DAY_MS = 86400000

// 核心判定：返回三态 status: ok|risk|danger
const checkPassport = (expiryKey, travelKey, destId, issueKey) => {
  const rule = getRule(destId)
  const exp = parseDateKey(expiryKey)
  const trv = parseDateKey(travelKey)
  if (!exp || !trv) {
    return { valid: false, rule, status: 'none' }
  }
  const remainingDays = Math.round((exp.getTime() - trv.getTime()) / DAY_MS)
  const approxMonths = Math.round(remainingDays / 30.4375 * 10) / 10

  const cutoff = addMonths(trv, rule.months)            // 有效期最晚需覆盖到
  const cutoffKey = dateKey(cutoff)
  const meetsMin = exp.getTime() >= cutoff.getTime()    // 边界相等 → 达标
  const riskBoundary = addMonths(trv, rule.months + 1)  // 再多1个月缓冲

  // 申根：签发 10 年内（自出行日回溯）
  let tenYearOk = true
  if (rule.issueYears) {
    const iss = parseDateKey(issueKey)
    if (iss) {
      const issueBoundary = addMonths(iss, rule.issueYears * 12)
      tenYearOk = trv.getTime() <= issueBoundary.getTime()
    }
  }

  let status = 'ok'
  let statusLabel = '可以出行'
  let statusHint = '护照有效期满足目的地公开口径要求，正常出行即可'
  if (!tenYearOk) {
    status = 'danger'
    statusLabel = '必须换发'
    statusHint = '护照签发已超 10 年，申根区不认可，需换发新护照后出行'
  } else if (remainingDays < 0) {
    status = 'danger'
    statusLabel = '必须换发'
    statusHint = '护照在出行日前已到期，无法出境'
  } else if (!meetsMin) {
    status = 'danger'
    statusLabel = '必须换发'
    statusHint = '出行时剩余 ' + approxMonths + ' 个月，低于 ' + rule.label + '要求的「' + rule.ruleText + '」'
  } else if (exp.getTime() < riskBoundary.getTime()) {
    status = 'risk'
    statusLabel = '存在风险'
    statusHint = '刚好满足最低要求但几乎没有余量，行程若有延误或停留偏长可能被拦，建议换发'
  }

  const deadline = rule.months > 0 ? cutoff : trv  // 最晚换发完成日
  const applyAdvice = addMonths(deadline, -2)      // 预留约 2 个月办理周期

  return {
    valid: true,
    rule,
    status,
    statusLabel,
    statusHint,
    remainingDays,
    approxMonths,
    cutoffKey,
    meetsMin,
    tenYearOk,
    deadlineKey: dateKey(deadline),
    applyAdviceKey: dateKey(applyAdvice)
  }
}
/* ==== PURE:END ==== */

// ---------- 状态 ----------
const expiryDate = ref('')
const travelDate = ref('')
const destination = ref('us')
const issueDate = ref('')

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const inputError = computed(() => {
  if (expiryDate.value && travelDate.value) return ''
  return '请选择护照到期日与出行日期'
})

const currentRule = computed(() => getRule(destination.value))

const result = computed(() => checkPassport(
  expiryDate.value, travelDate.value, destination.value, issueDate.value
))

const fmtKey = (key) => (key || '—')

const remainingLabel = computed(() => {
  const r = result.value
  if (!r.valid) return '—'
  if (r.remainingDays < 0) return '已过期 ' + (-r.remainingDays) + ' 天'
  return r.approxMonths + ' 个月（' + r.remainingDays + ' 天）'
})

const statusBg = computed(() => ({
  ok: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  risk: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
  danger: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
}[result.value.status] || 'bg-muted text-muted-foreground'))

const STATUS_ICONS = { ok: ShieldCheck, risk: ShieldAlert, danger: ShieldX }
const statusIcon = computed(() => STATUS_ICONS[result.value.status] || ShieldAlert)

// 复制判定摘要到文本（供存档对照）
const cutoffLabel = computed(() => fmtKey(result.value.cutoffKey))
const deadlineLabel = computed(() => fmtKey(result.value.deadlineKey))
const applyAdviceLabel = computed(() => fmtKey(result.value.applyAdviceKey))
</script>
