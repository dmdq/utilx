<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Terminal class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Conventional Commits生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">表单式生成规范提交说明，实时预览并保存历史</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        按约定式提交（Conventional Commits）规范填写 type、scope、breaking change、subject、body 与 footer，实时预览格式化结果并一键复制。最近 10 条记录保存在本机浏览器 localStorage，可随时恢复或删除。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：表单 + 速查卡 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 提交信息表单
          </h2>

          <!-- type + scope -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">类型 type</label>
              <select
                v-model="form.type"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option v-for="t in commitTypes" :key="t.value" :value="t.value">{{ t.value }}（{{ t.desc }}）</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">范围 scope（可选）</label>
              <input
                v-model="form.scope"
                type="text"
                placeholder="例如：api、ui、parser"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <!-- breaking + 自动小写 -->
          <div class="grid grid-cols-2 gap-3">
            <label class="flex items-center justify-between cursor-pointer bg-muted/30 rounded-lg px-3 py-2.5">
              <span class="text-sm text-foreground">Breaking Change（!）</span>
              <button
                type="button"
                @click="form.breaking = !form.breaking"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                :class="form.breaking ? 'bg-destructive' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="form.breaking ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>
            <label class="flex items-center justify-between cursor-pointer bg-muted/30 rounded-lg px-3 py-2.5">
              <span class="text-sm text-foreground">subject 自动小写</span>
              <button
                type="button"
                @click="form.autoLower = !form.autoLower"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                :class="form.autoLower ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="form.autoLower ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>
          </div>

          <!-- subject -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-foreground">简短描述 subject</label>
              <span
                class="text-xs font-mono"
                :class="subjectLength > 50 ? 'text-destructive' : subjectLength > 45 ? 'text-yellow-500' : 'text-muted-foreground'"
              >{{ subjectLength }}/50</span>
            </div>
            <input
              v-model="form.subject"
              type="text"
              placeholder="祈使句、小写开头、结尾不加句号"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">结尾句号会自动去除；超过 50 字符会标红提示</p>
          </div>

          <!-- body -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">详细说明 body（可选）</label>
            <textarea
              v-model="form.body"
              class="w-full h-24 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="解释做了什么、为什么这么做（what & why），建议每行不超过 72 字符"
            ></textarea>
          </div>

          <!-- footer -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">脚注 footer（可选）</label>
            <textarea
              v-model="form.footer"
              class="w-full h-20 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="Closes #123&#10;BREAKING CHANGE: 配置项 x 改名为 y"
            ></textarea>
            <p class="text-xs text-muted-foreground mt-1.5">每行一条；关闭 issue 用 Closes #123，破坏性变更说明用 BREAKING CHANGE: 前缀</p>
          </div>
        </div>

        <!-- 速查卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> Conventional Commits 速查卡
          </h3>
          <div class="space-y-1.5 mb-4">
            <div v-for="t in commitTypes" :key="'c-' + t.value" class="flex items-center gap-2 text-xs">
              <code class="bg-muted text-foreground px-1.5 py-0.5 rounded font-mono w-16 text-center flex-shrink-0">{{ t.value }}</code>
              <span class="text-muted-foreground flex-1">{{ t.desc }}</span>
              <span
                class="flex-shrink-0"
                :class="t.bump === 'MAJOR' ? 'text-destructive' : t.bump ? 'text-primary' : 'text-muted-foreground/60'"
              >{{ t.bump ? '→ ' + t.bump : '' }}</span>
            </div>
          </div>
          <ul class="text-xs text-muted-foreground space-y-2 border-t border-border pt-3">
            <li>• <span class="text-foreground">版本号影响</span>：feat → minor，fix → patch，breaking change → major，其余类型不影响</li>
            <li>• <span class="text-foreground">subject</span>：祈使句现在时（add 而非 added），首字母小写，结尾不加句号，不超过 50 字符</li>
            <li>• <span class="text-foreground">body</span>：与 subject 空一行，解释动机与前后差异，每行不超过 72 字符</li>
            <li>• <span class="text-foreground">破坏性变更</span>：两种标记方式——type 后加 !，或 footer 写 BREAKING CHANGE: 描述</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：预览 + 历史 -->
      <div class="space-y-6">
        <!-- 预览 -->
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Terminal class="w-5 h-5 mr-2 text-primary" /> 实时预览
            </h2>
            <button
              @click="copyMessage"
              :disabled="!message"
              class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制并存入历史
            </button>
          </div>
          <div class="p-6">
            <pre v-if="message" class="bg-muted/30 border border-border rounded-lg p-4 text-sm font-mono text-foreground whitespace-pre-wrap break-words">{{ message }}</pre>
            <div v-else class="py-12 text-center">
              <GitBranch class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">填写左侧表单后，这里会实时生成规范格式的提交说明</p>
            </div>
            <div v-if="headerPreview" class="mt-3 space-y-1">
              <p class="text-xs font-medium text-foreground">首行（git log --oneline 视角）</p>
              <p class="text-xs text-muted-foreground font-mono break-all bg-muted/50 rounded px-2 py-1">{{ headerPreview }}</p>
            </div>
          </div>
        </div>

        <!-- 历史 -->
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <History class="w-5 h-5 mr-2 text-primary" /> 历史记录
            </h2>
            <button
              v-if="history.length"
              @click="clearHistory"
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground transition-all flex items-center gap-1"
            >
              <Trash2 class="w-3 h-3" /> 清空
            </button>
          </div>
          <div v-if="history.length" class="divide-y divide-border/50">
            <div v-for="h in history" :key="h.id" class="px-6 py-3 flex items-center gap-3">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-mono text-foreground truncate">{{ h.text.split('\n')[0] }}</p>
                <p class="text-xs text-muted-foreground mt-0.5">{{ h.time }}</p>
              </div>
              <button
                @click="restoreEntry(h)"
                class="p-1.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                title="恢复到表单"
              >
                <ArrowRight class="w-3.5 h-3.5" />
              </button>
              <button
                @click="removeEntry(h.id)"
                class="p-1.5 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                title="删除"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div v-else class="py-12 text-center">
            <History class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground px-6">复制后会保存最近 10 条记录，点击箭头可恢复到表单</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>为什么使用约定式提交</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Conventional Commits 是一套轻量提交说明约定：type(scope): subject 的首行结构让 git log 机器可读，语义化版本工具（如 semantic-release、standard-version）据此自动推断版本号与生成 CHANGELOG——feat 触发次版本升级、fix 触发修订号升级、带 ! 或 BREAKING CHANGE 的提交触发主版本升级。团队统一格式后，code review 的效率和发布自动化的可靠性都会明显提升。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>团队成员记不住 11 种 type 的语义与顺序，用表单点选零心智负担</li>
            <li>给开源项目提 PR，按社区规范写提交说明提高合并速度</li>
            <li>搭配 semantic-release / changesets 等工具自动发版，生成规范的 CHANGELOG</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">scope 可以写哪些值？</span>任意对团队有意义的模块名，如 api、ui、auth，多个用逗号分隔不符合规范，建议拆分提交。</li>
            <li><span class="text-foreground font-medium">为什么 subject 不超过 50 字符？</span>这是 git 社区约定：保证在 git log --oneline、GitHub 界面等场景下首行不被截断。</li>
            <li><span class="text-foreground font-medium">历史记录会上传吗？</span>不会，最近 10 条记录只保存在本机浏览器 localStorage。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'commit-message-generator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Terminal, Settings2, GitBranch, History, Trash2, Copy, Info, ArrowRight,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Conventional Commits生成器 - 规范Git提交信息在线生成',
  description: '在线约定式提交生成器，表单填写type/scope/breaking change/subject/body/footer，实时预览规范Git提交信息并复制，附各类型版本号影响速查，历史记录本地保存',
  keywords: 'conventional commits, 提交信息生成, git commit 规范, 提交规范, commit message, 语义化提交',
  author: 'Util工具箱',
  ogTitle: 'Conventional Commits生成器 - 有条工具',
  ogDescription: '表单式生成规范提交说明，实时预览并保存历史',
  ogUrl: 'https://www.util.cn/tools/commit-message-generator',
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
          name: 'Conventional Commits生成器',
          url: 'https://www.util.cn/tools/commit-message-generator',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['11种提交类型点选', '破坏性变更标记', 'subject长度校验', '历史记录本地保存']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'Conventional Commits生成器', item: 'https://www.util.cn/tools/commit-message-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '各提交类型对版本号有什么影响？',
              acceptedAnswer: { '@type': 'Answer', text: 'feat 触发次版本（minor）升级，fix 触发修订号（patch）升级，带 ! 或 BREAKING CHANGE 脚注的提交触发主版本（major）升级，其余类型不影响版本号。' }
            },
            {
              '@type': 'Question',
              name: '破坏性变更怎么标记？',
              acceptedAnswer: { '@type': 'Answer', text: '两种方式：在 type 或 scope 后加感叹号（如 feat(api)!:），或在脚注区写 BREAKING CHANGE: 变更说明。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'commit-message-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  loadHistory()
})

// ---------- 常量 ----------
const commitTypes = [
  { value: 'feat', desc: '新功能', bump: 'MINOR' },
  { value: 'fix', desc: '缺陷修复', bump: 'PATCH' },
  { value: 'docs', desc: '文档变更', bump: '' },
  { value: 'style', desc: '代码格式（不影响逻辑）', bump: '' },
  { value: 'refactor', desc: '重构（非新增也非修复）', bump: '' },
  { value: 'perf', desc: '性能优化', bump: 'PATCH' },
  { value: 'test', desc: '测试相关', bump: '' },
  { value: 'chore', desc: '构建/工具/杂务', bump: '' },
  { value: 'build', desc: '构建系统或依赖变更', bump: '' },
  { value: 'ci', desc: 'CI 配置变更', bump: '' },
  { value: 'revert', desc: '回滚提交', bump: '' }
]

// ---------- 状态 ----------
const form = ref({
  type: 'feat',
  scope: '',
  breaking: false,
  autoLower: true,
  subject: '',
  body: '',
  footer: ''
})

const history = ref([])
const seoContentVisible = ref(true)

const STORAGE_KEY = 'commit-message-generator-history'
const HISTORY_MAX = 10

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 生成 ----------
const processedSubject = computed(() => {
  let s = form.value.subject.trim().replace(/[.。]+$/, '')
  if (form.value.autoLower && /^[A-Z]/.test(s)) {
    s = s.charAt(0).toLowerCase() + s.slice(1)
  }
  return s
})

const subjectLength = computed(() => processedSubject.value.length)

const headerPreview = computed(() => {
  if (!processedSubject.value) return ''
  const scope = form.value.scope.trim()
  return `${form.value.type}${scope ? `(${scope})` : ''}${form.value.breaking ? '!' : ''}: ${processedSubject.value}`
})

const message = computed(() => {
  if (!headerPreview.value) return ''
  const parts = [headerPreview.value]
  const body = form.value.body.trim()
  if (body) parts.push(body)
  const footer = form.value.footer.trim()
  if (footer) parts.push(footer)
  return parts.join('\n\n')
})

// ---------- 存储 ----------
const persistHistory = () => {
  if (!process.client) return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value)) } catch (e) { /* 忽略 */ }
}

const loadHistory = () => {
  if (!process.client) return
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (Array.isArray(data)) history.value = data.slice(0, HISTORY_MAX)
  } catch (e) { /* 忽略 */ }
}

const saveToHistory = () => {
  if (!message.value) return
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  history.value = [{
    id: Date.now(),
    time,
    text: message.value,
    form: { ...form.value }
  }, ...history.value.filter(h => h.text !== message.value)].slice(0, HISTORY_MAX)
  persistHistory()
}

const restoreEntry = (h) => {
  if (h.form) {
    form.value = { type: 'feat', scope: '', breaking: false, autoLower: true, subject: '', body: '', footer: '', ...h.form }
  }
}

const removeEntry = (id) => {
  history.value = history.value.filter(h => h.id !== id)
  persistHistory()
}

const clearHistory = () => {
  history.value = []
  persistHistory()
}

// ---------- 复制 ----------
const copyMessage = async () => {
  if (!message.value) return
  try {
    await navigator.clipboard.writeText(message.value)
    alert('已复制')
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = message.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制')
  }
  saveToHistory()
}
</script>
