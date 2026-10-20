<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Brain class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">AI编程规则生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">勾选技术栈与偏好，一键生成 .cursorrules / CLAUDE.md / AGENTS.md</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        为你的项目生成 AI 助手行为规范文件：选择技术栈、编码规范偏好与 AI 工作方式，同一份配置自动按三种文件的常见结构输出 .cursorrules、CLAUDE.md 与 AGENTS.md（含项目概述/技术栈/代码风格/工作流程/注意事项分节），复制放进项目根目录即可约束 Cursor、Claude Code 与各类 Agent 的行为。纯本地生成，配置不出浏览器。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左：配置区 -->
      <div class="space-y-5">
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <Settings class="w-5 h-5 mr-2 text-primary" /> 技术栈
          </h2>

          <div v-for="group in stackGroups" :key="group.key">
            <label class="block text-sm font-medium text-foreground mb-2">{{ group.title }}（多选）</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in group.options"
                :key="opt"
                @click="toggleOption(group.key, opt)"
                :class="options[group.key].includes(opt) ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >{{ opt }}</button>
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <SlidersHorizontal class="w-5 h-5 mr-2 text-primary" /> 编码规范偏好
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">命名风格</label>
              <select
                v-model="options.naming"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="camelCase">camelCase 小驼峰</option>
                <option value="PascalCase">PascalCase 大驼峰</option>
                <option value="snake_case">snake_case 下划线</option>
                <option value="kebab-case">kebab-case 中划线</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">注释语言</label>
              <select
                v-model="options.commentLang"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="中文">中文</option>
                <option value="英文">英文</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">错误处理风格</label>
              <select
                v-model="options.errorHandling"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="try-catch 快速失败">try-catch 快速失败</option>
                <option value="Result/Option 模式">Result/Option 模式</option>
                <option value="全局错误中间件">全局错误中间件</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">禁止 AI 执行的操作（多选）</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="f in forbiddenChoices"
                :key="f"
                @click="toggleOption('forbidden', f)"
                :class="options.forbidden.includes(f) ? 'bg-destructive text-destructive-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >{{ f }}</button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">项目约定 / 目录结构描述（可选）</label>
            <textarea
              v-model="options.projectNotes"
              rows="4"
              spellcheck="false"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="例如：src/api 只放请求封装；src/components 按功能域分目录；改动数据库结构必须同步 migrations"
            ></textarea>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground flex items-center mb-4">
            <Sparkles class="w-5 h-5 mr-2 text-primary" /> AI 行为约束
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label v-for="b in behaviorChoices" :key="b.key" class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" v-model="options[b.key]" class="w-4 h-4 rounded border-border accent-primary" />
              {{ b.label }}
            </label>
          </div>
        </div>
      </div>

      <!-- 右：输出区 -->
      <div class="bg-card border border-border rounded-lg p-6 flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <FileCode class="w-5 h-5 mr-2 text-primary" /> 生成结果
          </h2>
          <button
            @click="copyOutput"
            class="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm transition-colors flex items-center gap-1.5"
          ><ClipboardCopy class="w-4 h-4" /> 复制当前文件</button>
        </div>

        <div class="flex gap-2 mb-4">
          <button
            v-for="tab in tabs"
            :key="tab"
            @click="activeTab = tab"
            :class="activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
          >{{ tab }}</button>
        </div>

        <pre class="flex-1 bg-muted border border-border rounded-lg p-4 text-xs leading-relaxed text-foreground overflow-auto whitespace-pre-wrap font-mono max-h-[600px]">{{ generated[activeTab] }}</pre>

        <p v-if="copyHint" class="text-xs text-primary mt-3">{{ copyHint }}</p>
        <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
          用法：.cursorrules 放项目根目录供 Cursor 读取；CLAUDE.md 供 Claude Code 读取；AGENTS.md 是开放的 Agent 规范文件，多数编码 Agent 均支持。建议随仓库提交并定期维护。
        </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>为什么要给 AI 编程助手写规则文件</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            大模型编码助手默认不知道你的技术栈、目录约定和团队规范，容易出现「自作主张重构」「引入不想要的依赖」「注释语言混用」等问题。
            规则文件相当于给 AI 的入职须知：每次会话自动注入，让它按你项目的方式干活，显著减少返工与代码审查负担。
          </p>
          <h3 class="text-lg font-semibold text-foreground">三种规则文件的定位差异</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">.cursorrules：</span>Cursor 编辑器的项目规则入口，纯文本即可，指令偏「行为约束」语气；</li>
            <li><span class="text-foreground font-medium">CLAUDE.md：</span>Claude Code 的项目记忆文件，Markdown 结构，可同时写背景知识与任务约定；</li>
            <li><span class="text-foreground font-medium">AGENTS.md：</span>跨工具的开放约定， aiml 等多类 Agent 都能读取，适合团队统一维护。</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">一条好的规则长什么样</h3>
          <p>
            具体、可判定、带优先级。与其写「代码要写好」，不如写「新增代码必须通过 vitest 单测；禁止修改 lockfile；改动超过 3 个文件先列方案再动手」。
            本工具生成的每个分节都遵循这一原则，你可以在此基础上继续手工补充。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">生成的内容会上传吗？</span>不会，模板拼接全部在浏览器本地完成。</li>
            <li><span class="text-foreground font-medium">规则越多越好吗？</span>不是，规则过长会稀释重点，建议控制在 60 行内，把最关键的行为约束放前面。</li>
            <li><span class="text-foreground font-medium">三种文件内容有区别吗？</span>信息相同、结构不同：按各自工具的常见阅读习惯组织标题与语气，任选其一或全部使用均可。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ai-rules-generator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Brain, Settings, SlidersHorizontal, Sparkles, FileCode,
  ClipboardCopy, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'AI编程规则生成器 - cursorrules/CLAUDE.md/AGENTS.md | 有条工具',
  description: '在线AI编程规则生成器，勾选技术栈、命名与错误处理偏好、AI行为约束，一键生成.cursorrules、CLAUDE.md、AGENTS.md三种规范文件，约束Cursor与Claude Code行为，纯本地生成',
  keywords: 'cursorrules生成, CLAUDE.md生成, AGENTS.md, AI编程规范, cursor规则, claude code配置, ai代码规范约束',
  author: 'Util工具箱',
  ogTitle: 'AI编程规则生成器 - 有条工具',
  ogDescription: '勾选技术栈与偏好，一键生成三种 AI 编程规范文件',
  ogUrl: 'https://www.util.cn/tools/ai-rules-generator',
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
          name: 'AI编程规则生成器',
          url: 'https://www.util.cn/tools/ai-rules-generator',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['技术栈多选', '.cursorrules/CLAUDE.md/AGENTS.md三格式', 'AI行为约束开关', '禁改操作清单', '本地生成不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'AI编程规则生成器', item: 'https://www.util.cn/tools/ai-rules-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '生成的内容会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，模板拼接全部在浏览器本地完成。' }
            },
            {
              '@type': 'Question',
              name: '规则越多越好吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是，规则过长会稀释重点，建议控制在60行内，把最关键的行为约束放前面。' }
            },
            {
              '@type': 'Question',
              name: '三种规则文件有区别吗？',
              acceptedAnswer: { '@type': 'Answer', text: '信息相同、结构不同：按Cursor、Claude Code与各Agent工具的常见阅读习惯组织标题与语气。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'ai-rules-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 选项定义 ----------
const stackGroups = [
  { key: 'frontend', title: '前端框架', options: ['Vue', 'React', 'Angular', 'Svelte', '原生JS'] },
  { key: 'backend', title: '后端语言', options: ['Node.js', 'TypeScript', 'Python', 'Go', 'Java', 'Rust', 'PHP'] },
  { key: 'database', title: '数据库', options: ['MySQL', 'PostgreSQL', 'SQLite', 'MongoDB', 'Redis'] },
  { key: 'testing', title: '测试框架', options: ['Vitest', 'Jest', 'Pytest', 'JUnit', 'Playwright', 'Cypress'] },
  { key: 'pkgManager', title: '包管理器', options: ['npm', 'pnpm', 'yarn', 'bun', 'pip', 'cargo', 'go mod'] }
]

const forbiddenChoices = [
  '修改 lockfile 与依赖清单',
  '自动执行 git commit/push',
  '删除或改写现有测试',
  '擅自新增第三方依赖',
  '改动生产配置与密钥',
  '顺手重构无关代码'
]

const behaviorChoices = [
  { key: 'askFirst', label: '不确定时先问再改' },
  { key: 'minimalChange', label: '最小改动原则' },
  { key: 'genTests', label: '新功能必须生成测试' },
  { key: 'planFirst', label: '实现前先说明方案' }
]

// ---------- 状态 ----------
const options = ref({
  frontend: ['Vue'],
  backend: ['TypeScript'],
  database: ['MySQL'],
  testing: ['Vitest'],
  pkgManager: ['pnpm'],
  naming: 'camelCase',
  commentLang: '中文',
  errorHandling: 'try-catch 快速失败',
  forbidden: ['修改 lockfile 与依赖清单', '自动执行 git commit/push', '擅自新增第三方依赖'],
  projectNotes: '',
  askFirst: true,
  minimalChange: true,
  genTests: true,
  planFirst: false
})

const tabs = ['.cursorrules', 'CLAUDE.md', 'AGENTS.md']
const activeTab = ref('.cursorrules')
const copyHint = ref('')
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const toggleOption = (groupKey, val) => {
  const list = options.value[groupKey].slice()
  const idx = list.indexOf(val)
  if (idx === -1) list.push(val)
  else list.splice(idx, 1)
  options.value = Object.assign({}, options.value, { [groupKey]: list })
}

// ---------- 纯函数：规则生成 ----------
// --- pure-test-start ---
function genRules(opts) {
  const stackLines = []
  if (opts.frontend.length) stackLines.push('前端框架：' + opts.frontend.join('、'))
  if (opts.backend.length) stackLines.push('后端语言：' + opts.backend.join('、'))
  if (opts.database.length) stackLines.push('数据库：' + opts.database.join('、'))
  if (opts.testing.length) stackLines.push('测试框架：' + opts.testing.join('、'))
  if (opts.pkgManager.length) stackLines.push('包管理器：' + opts.pkgManager.join('、'))

  const styleLines = [
    '命名统一使用 ' + opts.naming + '，文件名与导出符号保持一致',
    '代码注释一律使用' + opts.commentLang,
    '错误处理采用「' + opts.errorHandling + '」风格：不要吞掉异常，必须向上抛出或返回明确错误',
    '公共函数与组件需写清楚输入输出类型，优先使用静态类型'
  ]

  const workflowLines = []
  if (opts.planFirst) workflowLines.push('动手前先简述实现方案与涉及文件，等待确认')
  if (opts.askFirst) workflowLines.push('需求不明确时先提问澄清，不要擅自假设')
  if (opts.minimalChange) workflowLines.push('遵循最小改动原则：只修改与需求直接相关的代码，不做顺手重构')
  workflowLines.push('修改后运行相关测试与 lint，确保通过后再交付')
  if (opts.genTests) workflowLines.push('新增功能必须同步生成测试用例')

  const cautionLines = opts.forbidden.map(f => '禁止' + f + '（确有必要时先说明理由并征得同意）')
  if (opts.projectNotes && opts.projectNotes.trim()) {
    cautionLines.push('项目约定：' + opts.projectNotes.trim().replace(/\n+/g, '；'))
  }
  if (!cautionLines.length) cautionLines.push('遵守仓库现有 CODEOWNERS 与 CI 门禁，不要绕过检查')

  const overview = '本项目使用 AI 编程助手协同开发。以下规则用于约束 AI 在本仓库中的编码行为，优先级高于一般性习惯。'

  // .cursorrules：纯文本指令风格
  const cursorrules = [
    '# 项目 AI 编程规则（.cursorrules）',
    '',
    '[项目概述]',
    overview,
    '',
    '[技术栈]',
    ...stackLines,
    '',
    '[代码风格]',
    ...styleLines,
    '',
    '[工作流程]',
    ...workflowLines.map(w => '- ' + w),
    '',
    '[注意事项]',
    ...cautionLines.map(c => '- ' + c)
  ].join('\n')

  // CLAUDE.md：Markdown 章节 + 背景知识口吻
  const claudeMd = [
    '# CLAUDE.md',
    '',
    '## 项目概述',
    overview,
    '',
    '## 技术栈',
    ...stackLines.map(s => '- ' + s),
    '',
    '## 代码风格',
    ...styleLines.map(s => '- ' + s),
    '',
    '## 工作流程',
    ...workflowLines.map((w, i) => (i + 1) + '. ' + w),
    '',
    '## 注意事项',
    ...cautionLines.map(c => '- ⚠️ ' + c)
  ].join('\n')

  // AGENTS.md：任务导向的开放 Agent 规范
  const agentsMd = [
    '# AGENTS.md',
    '',
    '面向所有编码 Agent 的统一规范文件。',
    '',
    '## 项目概述',
    overview,
    '',
    '## 技术栈',
    ...stackLines.map(s => '- ' + s),
    '',
    '## 代码风格',
    ...styleLines.map(s => '- ' + s),
    '',
    '## 工作流程',
    ...workflowLines.map(w => '- ' + w),
    '',
    '## 注意事项（硬性红线）',
    ...cautionLines.map(c => '- ' + c)
  ].join('\n')

  return { cursorrules, claudeMd, agentsMd }
}
// --- pure-test-end ---

const generated = computed(() => genRules(options.value))

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(generated.value[activeTab.value])
    copyHint.value = '已复制 ' + activeTab.value + ' 内容'
    setTimeout(() => { copyHint.value = '' }, 3000)
  } catch {
    copyHint.value = '复制失败，请手动全选输出区文本复制'
    setTimeout(() => { copyHint.value = '' }, 4000)
  }
}
</script>
