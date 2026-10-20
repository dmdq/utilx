<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Settings2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">GitHub Actions 生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">勾选语言矩阵/触发条件/缓存与测试步骤，生成可直接提交的 workflow yml</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        手写 CI 配置最容易在 YAML 缩进、actions 版本和缓存字段上出错。本工具按表单生成标准 <code class="px-1 bg-muted rounded text-sm">.github/workflows/ci.yml</code>：支持 push / Pull Request 分支多选、tag 触发与 cron 定时；Node / Python / Java / Go / Rust 五种语言带各自 setup action 与依赖缓存；检出、装依赖、lint、测试、构建、部署占位步骤按需勾选。纯本地生成，不读取你的仓库。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：表单 -->
      <div class="space-y-4">
        <div class="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 class="font-semibold text-foreground flex items-center gap-2">
            <FileText class="w-4 h-4 text-primary" /> 基本信息
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">工作流名称</label>
              <input
                v-model="wfName"
                type="text"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="CI"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">文件名</label>
              <input
                v-model="wfFile"
                type="text"
                spellcheck="false"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="ci.yml"
              >
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">运行环境</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="o in OS_OPTIONS"
                :key="o"
                @click="runsOn = o"
                :class="runsOn === o ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ o }}</button>
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 class="font-semibold text-foreground flex items-center gap-2">
            <Zap class="w-4 h-4 text-primary" /> 触发条件
          </h3>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">push 分支（逗号分隔，留空则监听所有分支）</label>
            <input
              v-model="pushBranches"
              type="text"
              spellcheck="false"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="main, develop"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">Pull Request 分支</label>
            <input
              v-model="prBranches"
              type="text"
              spellcheck="false"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="main"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">tag 触发（可选，如 v*）</label>
            <input
              v-model="tagPattern"
              type="text"
              spellcheck="false"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="v*"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">cron 定时（可选，UTC，如 0 2 * * *）</label>
            <input
              v-model="cronExpr"
              type="text"
              spellcheck="false"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="0 2 * * *"
            >
          </div>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="allowDispatch" type="checkbox" class="w-4 h-4 rounded border-border" >
            附加 workflow_dispatch（允许在网页手动触发）
          </label>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 class="font-semibold text-foreground flex items-center gap-2">
            <Boxes class="w-4 h-4 text-primary" /> 语言与版本
          </h3>
          <div class="grid grid-cols-5 gap-1.5">
            <button
              v-for="l in LANGUAGES"
              :key="l.value"
              @click="pickLanguage(l.value)"
              :class="language === l.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ l.label }}</button>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">{{ currentLang.versionLabel }}</label>
            <input
              v-model="languageVersion"
              type="text"
              spellcheck="false"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            >
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center gap-2">
            <ListChecks class="w-4 h-4 text-primary" /> 步骤勾选
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <label
              v-for="s in STEP_OPTIONS"
              :key="s.key"
              class="flex items-center gap-2 p-2.5 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors text-sm text-foreground"
            >
              <input v-model="steps[s.key]" type="checkbox" class="w-4 h-4 rounded border-border" >
              {{ s.label }}
            </label>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">测试命令（随语言自动填充，可改）</label>
            <input
              v-model="testCmd"
              type="text"
              spellcheck="false"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            >
          </div>
        </div>
      </div>

      <!-- 右侧：输出 -->
      <div class="space-y-4">
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-foreground flex items-center gap-2">
              <FileCode2 class="w-4 h-4 text-primary" /> .github/workflows/{{ wfFile || 'ci.yml' }}
            </h3>
            <button
              @click="copyText(workflowText, 'wf')"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs text-foreground transition-colors"
            >
              <Check v-if="copiedKey === 'wf'" class="w-3.5 h-3.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copiedKey === 'wf' ? '已复制' : '复制 YAML' }}
            </button>
          </div>
          <pre class="overflow-auto p-4 bg-muted/30 border border-border rounded-lg text-xs font-mono leading-relaxed max-h-[40rem] text-foreground">{{ workflowText }}</pre>
          <div class="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <p class="flex items-center gap-1.5">
              <FolderOpen class="w-3.5 h-3.5 text-primary" />
              粘贴指引：在仓库根创建 <code class="px-1 bg-muted rounded">.github/workflows/</code> 目录，把内容保存为 <code class="px-1 bg-muted rounded">{{ wfFile || 'ci.yml' }}</code> 提交推送即可
            </p>
            <p class="flex items-center gap-1.5">
              <Terminal class="w-3.5 h-3.5 text-primary" />
              查看运行：仓库 → Actions 标签页；本地可用 <code class="px-1 bg-muted rounded">act</code> 工具预演
            </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 GitHub Actions 生成器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            GitHub Actions 是 GitHub 官方的 CI/CD 平台：把 YAML 工作流放进 <code class="px-1 bg-muted rounded">.github/workflows/</code>，事件（push、PR、tag、定时）触发后 GitHub 会在托管运行器上按步骤执行。本工具把最常见的「检出 → 装环境 → 缓存依赖 → lint → 测试 → 构建」流水线固化成表单，生成缩进正确、版本官方（actions/checkout@v4、setup-node@v4 等）的配置。
          </p>

          <h3 class="text-lg font-semibold text-foreground">YAML 缩进与结构要点</h3>
          <p>
            workflow 的骨架是 <code class="px-1 bg-muted rounded">on → jobs → job → steps</code> 四层，每层缩进两个空格；steps 列表中 <code class="px-1 bg-muted rounded">- name:</code> 与 <code class="px-1 bg-muted rounded">uses:</code> / <code class="px-1 bg-muted rounded">run:</code> 的关系最易写错。本工具生成后请勿手工调空格，直接整文件提交；改步骤请回到表单重新生成。
          </p>

          <h3 class="text-lg font-semibold text-foreground">依赖缓存为什么重要</h3>
          <p>
            Node 项目把 <code class="px-1 bg-muted rounded">cache: 'npm'</code> 写进 setup-node 即可按 package-lock 自动缓存；Python 用 setup-python 的 <code class="px-1 bg-muted rounded">cache: 'pip'</code>，Go 的 setup-go 默认开启模块缓存。缓存命中后安装步骤普遍快 1-3 分钟，免费额度下的分钟数消耗也随之下降。锁文件缺失时缓存会告警但不影响运行。
          </p>

          <h3 class="text-lg font-semibold text-foreground">触发条件的组合</h3>
          <p>
            <code class="px-1 bg-muted rounded">push.branches</code> 与 <code class="px-1 bg-muted rounded">pull_request.branches</code> 控制「哪些分支的活动跑 CI」；tag 模式（如 v*）常用于发版流水线；<code class="px-1 bg-muted rounded">schedule.cron</code> 按 UTC 计时，北京时间需减 8 小时换算；勾选 workflow_dispatch 可在 Actions 页面点按钮手动触发，方便补跑。
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">部署步骤为什么是占位？</span>部署强依赖你的平台（Vercel / SSH / Docker Registry）与密钥，工具生成 echo 占位步骤，替换为官方 action 或 run 命令即可。</li>
            <li><span class="text-foreground font-medium">cron 什么时候真正执行？</span>GitHub 对 schedule 触发有排队延迟，高峰期可能晚几分钟甚至跳过一次；需要强时效请改用外部调度或 workflow_dispatch。</li>
            <li><span class="text-foreground font-medium">生成的 actions 版本过时了怎么办？</span>本工具固定引用 checkout@v4、setup-node@v4 等当前主版本；升级大版本前用 Actions 页面的运行日志确认新行为。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'github-actions-generator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Settings2, FileText, FileCode2, Zap, Boxes, ListChecks,
  Copy, Check, FolderOpen, Terminal, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'GitHub Actions 生成器 - CI workflow yml 在线生成 | 有条工具',
  description: '在线 GitHub Actions 生成器：勾选 push/PR/tag/cron 触发、ubuntu/windows/macos 运行环境、Node/Python/Java/Go/Rust 语言矩阵与缓存、lint/测试/构建步骤，一键生成缩进正确的 .github/workflows 配置，纯本地生成',
  keywords: 'github actions生成, workflow yml, CI配置生成, setup-node缓存, github actions模板, cron定时触发',
  author: '有条工具',
  ogTitle: 'GitHub Actions 生成器 - 有条工具',
  ogDescription: '勾选语言/触发/缓存/测试命令生成 workflow yml，CI 不再抄文档',
  ogUrl: 'https://www.util.cn/tools/github-actions-generator',
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
          name: 'GitHub Actions 生成器',
          url: 'https://www.util.cn/tools/github-actions-generator',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['push/PR/tag/cron 触发组合', '五种语言 setup action', '依赖缓存一键开启', '步骤勾选增删', '官方 actions 版本引用', '一键复制 YAML']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'GitHub Actions 生成器', item: 'https://www.util.cn/tools/github-actions-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '生成的部署步骤怎么用？',
              acceptedAnswer: { '@type': 'Answer', text: '部署强依赖你的平台与密钥，工具生成 echo 占位步骤，替换为 Vercel、SSH 或镜像推送等官方 action 与 run 命令即可。' }
            },
            {
              '@type': 'Question',
              name: 'cron 定时触发什么时候真正执行？',
              acceptedAnswer: { '@type': 'Answer', text: 'GitHub 对 schedule 触发有排队延迟，高峰期可能晚几分钟甚至跳过一次；需要强时效建议改用 workflow_dispatch 或外部调度。' }
            },
            {
              '@type': 'Question',
              name: '表单内容会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。YAML 完全在浏览器本地拼接生成，不读取你的仓库，也不发出任何网络请求。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'github-actions-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ===== [PURE-START] workflow 生成纯函数（可独立提取测试） =====
const LANG_META = {
  node: {
    label: 'Node', versionLabel: 'Node 版本', defaultVersion: '20',
    deps: 'npm ci', lint: 'npm run lint', test: 'npm test', build: 'npm run build'
  },
  python: {
    label: 'Python', versionLabel: 'Python 版本', defaultVersion: '3.12',
    deps: 'pip install -r requirements.txt', lint: 'ruff check .', test: 'pytest', build: 'echo "TODO: 构建命令"'
  },
  java: {
    label: 'Java', versionLabel: 'Java 版本', defaultVersion: '17',
    deps: 'mvn -q dependency:go-offline', lint: 'echo "TODO: lint 命令"', test: 'mvn -q test', build: 'mvn -q package -DskipTests'
  },
  go: {
    label: 'Go', versionLabel: 'Go 版本', defaultVersion: '1.22',
    deps: 'go mod download', lint: 'go vet ./...', test: 'go test ./...', build: 'go build ./...'
  },
  rust: {
    label: 'Rust', versionLabel: 'Rust 版本', defaultVersion: 'stable',
    deps: 'cargo fetch', lint: 'cargo clippy -- -D warnings', test: 'cargo test', build: 'cargo build --release'
  }
}

// 解析逗号分隔列表
function parseList(text) {
  return String(text || '').split(',').map(s => s.trim()).filter(Boolean)
}

// YAML 字符串安全加引号（含 * { } : 通配等敏感字符时加单引号）
function yamlScalar(s) {
  const str = String(s)
  return /[*?{}:,[\]&*#]/.test(str) || /^[\s-]/.test(str) ? `'${str.replace(/'/g, "''")}'` : str
}

// 生成 .github/workflows/*.yml 文本
// opts: { name, pushBranches[], prBranches[], tags[], cron, dispatch, os, language, version,
//         steps: { checkout, cache, deps, lint, test, build, deploy }, testCmd }
function genWorkflow(opts) {
  const meta = LANG_META[opts.language] || LANG_META.node
  const steps = opts.steps || {}
  const lines = []
  lines.push(`name: ${yamlScalar(opts.name || 'CI')}`)
  lines.push('')

  // on 触发块
  lines.push('on:')
  if ((opts.pushBranches || []).length) {
    lines.push('  push:')
    lines.push(`    branches: [${opts.pushBranches.map(yamlScalar).join(', ')}]`)
  } else if (!opts.cron && !(opts.prBranches || []).length && !(opts.tags || []).length) {
    lines.push('  push:')
    lines.push('    branches: [main]')
  }
  if ((opts.prBranches || []).length) {
    lines.push('  pull_request:')
    lines.push(`    branches: [${opts.prBranches.map(yamlScalar).join(', ')}]`)
  }
  if ((opts.tags || []).length) {
    if (!(opts.pushBranches || []).length) lines.push('  push:')
    lines.push(`    tags: [${opts.tags.map(yamlScalar).join(', ')}]`)
  }
  if (opts.cron) {
    lines.push('  schedule:')
    lines.push(`    - cron: '${String(opts.cron).trim()}'`)
  }
  if (opts.dispatch) lines.push('  workflow_dispatch:')

  lines.push('')
  lines.push('jobs:')
  lines.push('  build:')
  lines.push(`    runs-on: ${opts.os || 'ubuntu-latest'}`)
  lines.push('    steps:')

  if (steps.checkout) {
    lines.push('      - name: 检出代码')
    lines.push('        uses: actions/checkout@v4')
  }

  // 语言 setup（cache 勾选时才输出缓存字段）
  const v = String(opts.version || meta.defaultVersion)
  if (opts.language === 'node') {
    lines.push('      - name: 安装 Node')
    lines.push('        uses: actions/setup-node@v4')
    lines.push('        with:')
    lines.push(`          node-version: '${v}'`)
    if (steps.cache) lines.push(`          cache: 'npm'`)
  } else if (opts.language === 'python') {
    lines.push('      - name: 安装 Python')
    lines.push('        uses: actions/setup-python@v5')
    lines.push('        with:')
    lines.push(`          python-version: '${v}'`)
    if (steps.cache) lines.push(`          cache: 'pip'`)
  } else if (opts.language === 'java') {
    lines.push('      - name: 安装 JDK')
    lines.push('        uses: actions/setup-java@v4')
    lines.push('        with:')
    lines.push(`          java-version: '${v}'`)
    lines.push('          distribution: temurin')
  } else if (opts.language === 'go') {
    lines.push('      - name: 安装 Go')
    lines.push('        uses: actions/setup-go@v5')
    lines.push('        with:')
    lines.push(`          go-version: '${v}'`)
    if (steps.cache) lines.push('          cache: true')
  } else if (opts.language === 'rust') {
    lines.push('      - name: 安装 Rust')
    lines.push('        uses: dtolnay/rust-toolchain@stable')
    if (steps.cache) {
      lines.push('      - name: Rust 依赖缓存')
      lines.push('        uses: Swatinem/rust-cache@v2')
    }
  }

  const runStep = (name, run) => {
    lines.push(`      - name: ${name}`)
    lines.push(`        run: ${yamlScalar(run)}`)
  }
  if (steps.deps) runStep('安装依赖', meta.deps)
  if (steps.lint) runStep('代码检查', meta.lint)
  if (steps.test) runStep('运行测试', opts.testCmd || meta.test)
  if (steps.build) runStep('构建', meta.build)
  if (steps.deploy) runStep('部署（占位，替换为你的部署命令）', 'echo "TODO: 在此替换部署命令"')

  return lines.join('\n') + '\n'
}
// ===== [PURE-END] =====

// ---------- 状态 ----------
const LANGUAGES = Object.keys(LANG_META).map(k => ({ value: k, ...LANG_META[k] }))
const OS_OPTIONS = ['ubuntu-latest', 'windows-latest', 'macos-latest']
const STEP_OPTIONS = [
  { key: 'checkout', label: '检出代码 checkout' },
  { key: 'cache', label: '缓存依赖' },
  { key: 'deps', label: '安装依赖' },
  { key: 'lint', label: '代码检查 lint' },
  { key: 'test', label: '运行测试' },
  { key: 'build', label: '构建' },
  { key: 'deploy', label: '部署占位' }
]

const wfName = ref('CI')
const wfFile = ref('ci.yml')
const runsOn = ref('ubuntu-latest')
const pushBranches = ref('main, develop')
const prBranches = ref('main')
const tagPattern = ref('')
const cronExpr = ref('')
const allowDispatch = ref(true)
const language = ref('node')
const languageVersion = ref('20')
const steps = ref({ checkout: true, cache: true, deps: true, lint: true, test: true, build: true, deploy: false })
const testCmd = ref('npm test')

const copiedKey = ref('')
const seoContentVisible = ref(true)

const currentLang = computed(() => LANG_META[language.value] || LANG_META.node)

const pickLanguage = (l) => {
  language.value = l
  languageVersion.value = LANG_META[l].defaultVersion
  testCmd.value = LANG_META[l].test
}

// 版本留空时回退到语言默认值
watch(languageVersion, (v) => {
  if (!String(v).trim()) languageVersion.value = currentLang.value.defaultVersion
})

const workflowText = computed(() => genWorkflow({
  name: wfName.value.trim() || 'CI',
  pushBranches: parseList(pushBranches.value),
  prBranches: parseList(prBranches.value),
  tags: parseList(tagPattern.value),
  cron: cronExpr.value.trim(),
  dispatch: allowDispatch.value,
  os: runsOn.value,
  language: language.value,
  version: languageVersion.value.trim(),
  steps: steps.value,
  testCmd: testCmd.value.trim()
}))

let copyTimer = null
const copyText = async (text, key) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedKey.value = ''
    }, 1500)
  } catch (e) {
    // 剪贴板不可用时静默失败
  }
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
