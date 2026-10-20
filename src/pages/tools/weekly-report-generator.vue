<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Newspaper class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">周报结构生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">填要点即出四段式规范周报，自动编号与要点化</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        把本周完成事项、量化数据、遇到的问题、下周计划按行填进来，自动套上「本周工作 / 关键数据 / 问题与风险 / 下周计划」
        四段结构并逐条编号；空段落自动显示「无」。提供简洁、详实、结果导向三种模板风格，
        支持预览、复制与打印，内容草稿自动暂存在本机浏览器，下周接着改。全部处理在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入表单 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 no-print">
        <h2 class="text-lg font-semibold flex items-center">
          <ClipboardList class="w-5 h-5 mr-2 text-primary" /> 本周素材（每行一条）
        </h2>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">岗位（可选）</label>
            <input
              v-model="role"
              type="text"
              maxlength="20"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如：运营 / 前端工程师"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">项目名（可选）</label>
            <input
              v-model="project"
              type="text"
              maxlength="30"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如：会员体系改版"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">模板风格</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="st in WEEKLY_STYLES"
              :key="st"
              @click="style = st"
              :class="style === st ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
            >{{ st }}</button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">
            简洁=纯编号清单；详实=带标题头与「一、（1）」层级；结果导向=工作加成果标签、计划加目标标签
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">本周完成事项 *</label>
          <textarea
            v-model="done"
            rows="4"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="每行一条，如：&#10;完成活动页开发与联调&#10;输出竞品分析报告初稿"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">量化数据（可选，每行「指标名 数值」）</label>
          <textarea
            v-model="metrics"
            rows="3"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="每行一条，如：&#10;新增用户 1200&#10;页面转化率 3.2%"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">遇到的问题（可选）</label>
          <textarea
            v-model="issues"
            rows="3"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="每行一条，如：接口文档缺失，需后端补充"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">下周计划（可选）</label>
          <textarea
            v-model="nextPlan"
            rows="3"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="每行一条，如：完成灰度发布并观测数据"
          ></textarea>
        </div>

        <div class="flex gap-2">
          <button
            @click="clearAll"
            class="flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-sm font-medium transition-all"
          >
            <Trash2 class="w-4 h-4" /> 清空草稿
          </button>
          <span class="flex items-center text-xs text-muted-foreground ml-auto">草稿已自动保存在本机</span>
        </div>
      </div>

      <!-- 右侧：预览 -->
      <div class="bg-card border border-border rounded-lg p-6 flex flex-col preview-panel">
        <h2 class="text-lg font-semibold flex items-center mb-4 no-print">
          <Eye class="w-5 h-5 mr-2 text-primary" /> 周报预览
        </h2>
        <pre class="flex-1 overflow-auto whitespace-pre-wrap break-words p-4 bg-muted/50 border border-border rounded-lg text-sm text-foreground leading-relaxed font-sans min-h-[320px]">{{ reportText }}</pre>
        <div class="mt-4 flex gap-2 no-print">
          <button
            @click="copyReport"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"
          >
            <Check v-if="copyDone" class="w-4 h-4" />
            <Copy v-else class="w-4 h-4" />
            {{ copyDone ? '已复制' : '复制周报' }}
          </button>
          <button
            @click="printReport"
            class="flex items-center justify-center gap-2 px-4 py-2.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-sm font-medium transition-all"
          >
            <Printer class="w-4 h-4" /> 打印
          </button>
        </div>
      </div>
    </div>

    <!-- 写作提示 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3 no-print">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        写法建议：每条事项尽量「动词开头 + 对象 + 结果」，如「上线活动页，首日 UV 1.2 万」；数据行尽量带对比口径（环比、目标完成度）；
        「问题与风险」里除了问题再补一句需要谁的支持，周报就从流水账变成了管理工具。
      </p>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>周报怎么写才有结构</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            大部分职场周报的失败不是内容不够，而是结构混乱：想到哪写到哪，领导和同事抓不到重点。
            经典四段结构「本周工作 / 关键数据 / 问题与风险 / 下周计划」把过去与未来、事实与风险分开陈列，
            任何岗位都能直接套用。本工具负责把逐行素材自动编号、要点化，空段落补「无」，你只需要专注把每条内容写具体。
          </p>
          <h3 class="text-lg font-semibold text-foreground">周报的四段分别写什么</h3>
          <p>
            本周工作写「做了什么、到了什么阶段」，动词开头，一条一事；关键数据放可量化的结果，指标名加数值成行列出，
            这是周报里最被上级反复看的一段；问题与风险写「卡在哪、影响什么、需要什么支持」，把求助说清楚比抱怨更有用；
            下周计划按优先级排列，写可验收的事而不是「继续推进」这种无法核对的表述。
          </p>
          <h3 class="text-lg font-semibold text-foreground">三种模板风格怎么选</h3>
          <p>
            「简洁」适合发在 IM 群或日报式周报工具里，纯编号清单一眼扫完；「详实」适合邮件正文或需要归档的正式场景，
            带标题头与「一、二、三」层级，显得完整严谨；「结果导向」适合绩效季或向业务方汇报，工作条目冠以成果标签、
            计划条目冠以目标标签，把「做了什么」的叙述切换成「交付了什么」的口径。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">没数据或没问题怎么办？</span>对应输入框留空即可，生成的周报该段落会显示「无」，比直接删掉小标题更完整，也让上级知道你不是漏写而是确实没有。</li>
            <li><span class="text-foreground font-medium">草稿会保存吗？安全吗？</span>所有输入内容自动暂存在你当前浏览器的 localStorage 里，不上传服务器；换电脑或清除浏览器数据会丢失，重要周报生成后请及时复制或打印。</li>
            <li><span class="text-foreground font-medium">生成的周报能直接交吗？</span>结构与编号可以直接用，但内容仍是你的素材本身；建议提交前把「继续推进某事」改成「完成某事至某阶段」，把数据补上对比口径，再复制发送。</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'weekly-report-generator'" :category="'text'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Newspaper, ClipboardList, Eye, Copy, Check, Printer,
  AlertTriangle, ChevronUp, ChevronDown, Trash2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '周报结构生成器 - 本周工作/数据/问题/下周计划四段式模板',
  description: '在线周报结构生成器，按行填入本周完成事项、量化数据、遇到的问题与下周计划，自动生成四段式结构周报，支持简洁/详实/结果导向三种模板风格、自动编号、空段落补无、草稿本机暂存、复制与打印',
  keywords: '周报怎么写, 周报模板, 工作周报格式, 周报生成器, 每周工作总结, 下周计划模板',
  author: 'Util工具箱',
  ogTitle: '周报结构生成器 - 有条工具',
  ogDescription: '填要点即出四段式规范周报，自动编号与要点化',
  ogUrl: 'https://www.util.cn/tools/weekly-report-generator',
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
          name: '周报结构生成器',
          url: 'https://www.util.cn/tools/weekly-report-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['四段式结构自动生成', '三种模板风格', '要点自动编号', '空段落自动补无', '量化数据成行整理', '草稿本机暂存', '预览复制与打印']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: '周报结构生成器', item: 'https://www.util.cn/tools/weekly-report-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '没数据或没问题怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '对应输入框留空即可，生成的周报该段落会显示「无」，结构仍然完整，也表明不是漏写。' }
            },
            {
              '@type': 'Question',
              name: '草稿会保存吗？安全吗？',
              acceptedAnswer: { '@type': 'Answer', text: '输入内容自动暂存于当前浏览器 localStorage，不上传服务器；换设备或清除浏览器数据会丢失，请及时复制。' }
            },
            {
              '@type': 'Question',
              name: '生成的周报能直接提交吗？',
              acceptedAnswer: { '@type': 'Answer', text: '结构与编号可直接使用，建议提交前把条目改成可验收表述并为数据补充对比口径。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'weekly-report-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  restore()
})

/* ==== PURE:BEGIN ==== */
const WEEKLY_STYLES = ['简洁', '详实', '结果导向']
const CN_NUM = ['一', '二', '三', '四']

// 按行拆分并去除空行
const splitLines = (text) => String(text || '').split('\n').map(s => s.trim()).filter(Boolean)

// 「指标名 数值」行 → 「指标名：数值」；无法解析的保留原文
const fmtMetricLine = (line) => {
  const parts = String(line).split(/[\s:：,，]+/).filter(Boolean)
  if (parts.length >= 2) return parts[0] + '：' + parts.slice(1).join(' ')
  return line
}

// 组装结构化周报：四段齐全、自动编号、空段落显示「无」
const assembleWeekly = (input) => {
  const f = input || {}
  const style = WEEKLY_STYLES.includes(f.style) ? f.style : '简洁'
  const role = String(f.role || '').trim()
  const project = String(f.project || '').trim()
  const done = splitLines(f.done)
  const metrics = splitLines(f.metrics).map(fmtMetricLine)
  const issues = splitLines(f.issues)
  const next = splitLines(f.nextPlan)

  const sections = [
    { label: '本周工作', items: done, tag: '成果' },
    { label: '关键数据', items: metrics },
    { label: '问题与风险', items: issues },
    { label: '下周计划', items: next, tag: '目标' }
  ]

  const numbered = (items, tag) => items.map((line, i) => {
    if (style === '简洁') return (i + 1) + '. ' + line
    if (style === '详实') return '（' + (i + 1) + '）' + line
    return (i + 1) + '. ' + (tag ? tag + '：' : '') + line
  })

  const blocks = sections.map((sec, si) => {
    let heading = sec.label
    if (style === '详实') heading = CN_NUM[si] + '、' + sec.label
    if (style === '结果导向') heading = '【' + sec.label + '】'
    const body = sec.items.length > 0 ? numbered(sec.items, sec.tag).join('\n') : '无'
    return heading + '\n' + body
  })

  const lines = []
  if (project || role) {
    const who = (role && project) ? (project + '｜' + role) : (project || role)
    lines.push(who + ' 工作周报')
    lines.push('')
  }
  lines.push(blocks.join('\n\n'))
  return lines.join('\n')
}
/* ==== PURE:END ==== */

// ---------- 状态 ----------
const DRAFT_KEY = 'weekly-report-generator-draft'

const role = ref('')
const project = ref('')
const style = ref('简洁')
const done = ref('')
const metrics = ref('')
const issues = ref('')
const nextPlan = ref('')
const copyDone = ref(false)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const reportText = computed(() => assembleWeekly({
  style: style.value,
  role: role.value,
  project: project.value,
  done: done.value,
  metrics: metrics.value,
  issues: issues.value,
  nextPlan: nextPlan.value
}))

const persist = () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      role: role.value, project: project.value, style: style.value,
      done: done.value, metrics: metrics.value, issues: issues.value, nextPlan: nextPlan.value
    }))
  } catch (e) { /* 隐私模式静默 */ }
}

const restore = () => {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const d = JSON.parse(raw) || {}
    if (typeof d.role === 'string') role.value = d.role
    if (typeof d.project === 'string') project.value = d.project
    if (WEEKLY_STYLES.includes(d.style)) style.value = d.style
    if (typeof d.done === 'string') done.value = d.done
    if (typeof d.metrics === 'string') metrics.value = d.metrics
    if (typeof d.issues === 'string') issues.value = d.issues
    if (typeof d.nextPlan === 'string') nextPlan.value = d.nextPlan
  } catch (e) { /* 草稿损坏则忽略 */ }
}

// 输入变化自动存草稿（无 immediate，首帧不触碰浏览器 API）
watch([role, project, style, done, metrics, issues, nextPlan], persist)

const clearAll = () => {
  role.value = ''
  project.value = ''
  style.value = '简洁'
  done.value = ''
  metrics.value = ''
  issues.value = ''
  nextPlan.value = ''
  if (typeof localStorage !== 'undefined') {
    try { localStorage.removeItem(DRAFT_KEY) } catch (e) { /* 忽略 */ }
  }
}

let copyTimer = null
const copyReport = async () => {
  try {
    await navigator.clipboard.writeText(reportText.value)
    copyDone.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copyDone.value = false }, 2000)
  } catch (e) { /* 剪贴板不可用时可手动全选复制 */ }
}

const printReport = () => { window.print() }
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }

  .preview-panel {
    border: none !important;
    padding: 0 !important;
    background: transparent !important;
  }

  pre {
    overflow: visible !important;
    border: none !important;
    background: transparent !important;
  }
}
</style>
