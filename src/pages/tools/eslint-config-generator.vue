<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Code2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">ESLint 配置生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">选框架与规则，生成 ESLint 9 flat config、.prettierrc、.editorconfig 与 husky 配套片段</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        ESLint 9 改用 <code class="px-1 bg-muted rounded text-sm">eslint.config.js</code>（flat config）后，旧 .eslintrc 教程全部失效。本工具按项目类型（Vue 3 / React / TypeScript / Node / 纯 JS）与代码风格（引号、分号、缩进、尾逗号）生成 import 关系正确的 flat config，并附带可切换标签页的 <code class="px-1 bg-muted rounded text-sm">.prettierrc</code>、<code class="px-1 bg-muted rounded text-sm">.editorconfig</code> 与 husky + lint-staged 提交前检查片段，每个文件单独一键复制。纯本地生成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
      <!-- 左侧：表单 -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 class="font-semibold text-foreground flex items-center gap-2">
            <Layers class="w-4 h-4 text-primary" /> 项目类型（可多选组合）
          </h3>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="p in PROJECT_TYPES"
              :key="p.key"
              @click="toggleType(p.key)"
              :class="selected[p.key] ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ p.label }}</button>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 class="font-semibold text-foreground flex items-center gap-2">
            <Paintbrush class="w-4 h-4 text-primary" /> 代码风格
          </h3>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">引号</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="q in QUOTE_OPTIONS"
                :key="q.value"
                @click="quotes = q.value"
                :class="quotes === q.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ q.label }}</button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">缩进</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  v-for="ind in [2, 4]"
                  :key="ind"
                  @click="indent = ind"
                  :class="indent === ind ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-xs font-medium transition-all"
                >{{ ind }} 空格</button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">尾逗号</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  v-for="tc in COMMA_OPTIONS"
                  :key="tc.value"
                  @click="trailingComma = tc.value"
                  :class="trailingComma === tc.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-xs font-medium transition-all"
                >{{ tc.label }}</button>
              </div>
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="semi" type="checkbox" class="w-4 h-4 rounded border-border" >
            语句结尾强制分号（semi）
          </label>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center gap-2">
            <SlidersHorizontal class="w-4 h-4 text-primary" /> 配套与额外规则
          </h3>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="withPrettier" type="checkbox" class="w-4 h-4 rounded border-border" >
            搭配 Prettier（生成 eslint-config-prettier 收尾项）
          </label>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="noConsoleWarn" type="checkbox" class="w-4 h-4 rounded border-border" >
            no-console 设为警告（warn）
          </label>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="withHusky" type="checkbox" class="w-4 h-4 rounded border-border" >
            生成 husky + lint-staged 提交前检查片段
          </label>
        </div>
      </div>

      <!-- 右侧：分标签页输出 -->
      <div class="lg:col-span-3 space-y-4">
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="f in visibleFiles"
              :key="f.key"
              @click="activeTab = f.key"
              :class="activeTab === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
            >{{ f.name }}</button>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-xs text-muted-foreground">{{ activeFileHint }}</span>
            <button
              @click="copyText(activeFileContent, activeTab)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs text-foreground transition-colors"
            >
              <Check v-if="copiedKey === activeTab" class="w-3.5 h-3.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copiedKey === activeTab ? '已复制' : '复制此文件' }}
            </button>
          </div>

          <pre class="overflow-auto p-4 bg-muted/30 border border-border rounded-lg text-xs font-mono leading-relaxed max-h-[34rem] text-foreground">{{ activeFileContent }}</pre>

          <p class="text-xs text-muted-foreground leading-relaxed">{{ activeFileNote }}</p>
        </div>

        <div class="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            依赖安装提示：{{ installHint }}
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 ESLint 配置生成器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            ESLint 9 默认使用 flat config：项目根放一个 <code class="px-1 bg-muted rounded text-sm">eslint.config.js</code>，导出一个配置对象数组，后写的项目覆盖先写的规则。旧的 <code class="px-1 bg-muted rounded text-sm">.eslintrc.*</code> 与 extends 链在 9.x 中不再是首选写法，插件也必须显式 import 并挂进数组。本工具按勾选组合生成对应 import 与配置块。
          </p>

          <h3 class="text-lg font-semibold text-foreground">flat config 的数组顺序</h3>
          <p>
            推荐顺序是：全局忽略（ignores）→ <code class="px-1 bg-muted rounded text-sm">js.configs.recommended</code> → 框架插件推荐集（如 eslint-plugin-vue 的 flat/recommended、typescript-eslint 推荐集）→ 你的自定义 rules 块 → 最后放 <code class="px-1 bg-muted rounded text-sm">eslint-config-prettier</code> 关掉与 Prettier 冲突的格式规则。prettier 配置必须放数组末尾才生效。
          </p>

          <h3 class="text-lg font-semibold text-foreground">Vue + TypeScript 的解析器组合</h3>
          <p>
            .vue 文件必须用 <code class="px-1 bg-muted rounded text-sm">vue-eslint-parser</code> 做外层 parser，再把 <code class="px-1 bg-muted rounded text-sm">parserOptions.parser</code> 指向 typescript-eslint 处理 &lt;script lang="ts"&gt; 部分——两个 parser 直接互换是最常见的报错来源。勾选 Vue + TS 时本工具会生成这套组合。
          </p>

          <h3 class="text-lg font-semibold text-foreground">husky + lint-staged 怎么接</h3>
          <p>
            提交前检查的链路是：git commit → husky 的 pre-commit 钩子 → lint-staged 只对暂存文件跑 <code class="px-1 bg-muted rounded text-sm">eslint --fix</code> 与 <code class="px-1 bg-muted rounded text-sm">prettier --write</code>。本工具的 husky 标签页给出安装命令、钩子脚本内容与 package.json 的 lint-staged 段，三段拼起来即可用。
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">和旧 .eslintrc 什么关系？</span>ESLint 9 只自动读取 eslint.config.js；如仍在用 .eslintrc，需要设 ESLINT_USE_FLAT_CONFIG=false 或迁移到 flat config，推荐后者。</li>
            <li><span class="text-foreground font-medium">装完插件仍报 not found？</span>flat config 是显式 import，确认包名与版本匹配 ESLint 9（vue 用 eslint-plugin-vue@9+，TS 用 typescript-eslint@8+），且已安装 globals 包。</li>
            <li><span class="text-foreground font-medium">prettier 和 eslint 冲突？</span>把 eslint-config-prettier 放到配置数组最后一项即可关闭冲突的格式规则；代码格式化统一交给 prettier，ESLint 只管质量问题。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'eslint-config-generator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Code2, Layers, Paintbrush, SlidersHorizontal, Copy, Check,
  AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'ESLint 配置生成器 - ESLint 9 flat config 在线生成 | 有条工具',
  description: '在线 ESLint 配置生成器：按 Vue3/React/TS/Node 项目类型与引号、分号、缩进、尾逗号风格生成 ESLint 9 eslint.config.js flat config，附 .prettierrc、.editorconfig 与 husky + lint-staged 片段，分文件一键复制，纯本地生成',
  keywords: 'eslint配置生成, eslint.config.js, flat config, eslint9, prettier配置生成, husky lint-staged, editorconfig',
  author: '有条工具',
  ogTitle: 'ESLint 配置生成器 - 有条工具',
  ogDescription: '选框架与规则生成 ESLint 9 flat config + .editorconfig + husky 配套片段',
  ogUrl: 'https://www.util.cn/tools/eslint-config-generator',
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
          name: 'ESLint 配置生成器',
          url: 'https://www.util.cn/tools/eslint-config-generator',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['ESLint 9 flat config 生成', 'Vue/React/TS/Node 类型组合', '引号/分号/缩进/尾逗号风格', '.prettierrc 与 .editorconfig', 'husky + lint-staged 片段', '分标签页一键复制']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'ESLint 配置生成器', item: 'https://www.util.cn/tools/eslint-config-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'ESLint 9 还能用 .eslintrc 吗？',
              acceptedAnswer: { '@type': 'Answer', text: 'ESLint 9 默认只自动读取 eslint.config.js（flat config），.eslintrc 需显式开启兼容标志，新项目建议直接使用 flat config。' }
            },
            {
              '@type': 'Question',
              name: 'Vue 加 TypeScript 时 parser 怎么配？',
              acceptedAnswer: { '@type': 'Answer', text: '.vue 文件外层用 vue-eslint-parser，再通过 parserOptions.parser 指向 typescript-eslint 处理 script 块，本工具勾选 Vue+TS 会自动生成该组合。' }
            },
            {
              '@type': 'Question',
              name: 'prettier 和 eslint 规则冲突怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '把 eslint-config-prettier 放在 flat config 数组最后一项，关闭与 prettier 冲突的格式规则；格式化交给 prettier，ESLint 专注代码质量。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'eslint-config-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ===== [PURE-START] ESLint 配套文件生成纯函数（可独立提取测试） =====
// 生成 ESLint 9 flat config（eslint.config.js）
// opts: { vue, react, ts, node, browser, quotes: 'single'|'double', semi, indent,
//         trailingComma: 'es5'|'all'|'none', prettier, noConsoleWarn }
function genEslintConfig(opts) {
  const indentNum = Number(opts.indent) || 2
  const imports = ["import js from '@eslint/js'"]
  if (opts.browser || opts.node) imports.push("import globals from 'globals'")
  if (opts.ts) imports.push("import tseslint from 'typescript-eslint'")
  if (opts.vue) imports.push("import pluginVue from 'eslint-plugin-vue'")
  if (opts.react) {
    imports.push("import react from 'eslint-plugin-react'")
    imports.push("import reactHooks from 'eslint-plugin-react-hooks'")
  }
  if (opts.prettier) imports.push("import prettier from 'eslint-config-prettier'")

  const arr = []
  arr.push([
    '  {',
    "    ignores: ['dist/**', 'node_modules/**', 'coverage/**']",
    '  },'
  ].join('\n'))
  arr.push('  js.configs.recommended,')
  if (opts.vue) arr.push("  ...pluginVue.configs['flat/recommended'],")
  if (opts.ts) arr.push('  ...tseslint.configs.recommended,')

  if (opts.react) {
    const reactFiles = `**/*.{js,jsx${opts.ts ? ',ts,tsx' : ''}}`
    arr.push([
      '  {',
      `    files: ['${reactFiles}'],`,
      "    plugins: { react, 'react-hooks': reactHooks },",
      '    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },',
      '    rules: {',
      '      ...react.configs.recommended.rules,',
      "      ...react.configs['jsx-runtime'].rules,",
      "      'react-hooks/rules-of-hooks': 'error',",
      "      'react-hooks/exhaustive-deps': 'warn'",
      '    }',
      '  },'
    ].join('\n'))
  }

  // 主自定义块：文件模式 + 解析器 + 风格规则
  const exts = ['js', 'mjs', 'cjs']
  if (opts.ts) exts.push('ts', 'tsx')
  if (opts.vue) exts.push('vue')
  if (!opts.ts) exts.push('jsx')
  const filesPattern = `**/*.{${exts.join(',')}}`

  const langKeys = ["ecmaVersion: 'latest'", "sourceType: 'module'"]
  if (opts.vue) {
    langKeys.push("parser: 'vue-eslint-parser'")
    langKeys.push(opts.ts
      ? "parserOptions: { parser: 'typescript-eslint' }"
      : "parserOptions: { parser: 'espree' }")
  }
  const globalEntries = []
  if (opts.browser) globalEntries.push('...globals.browser')
  if (opts.node) globalEntries.push('...globals.node')
  if (globalEntries.length) langKeys.push(`globals: { ${globalEntries.join(', ')} }`)

  const rules = [
    `'quotes': ['error', '${opts.quotes === 'double' ? 'double' : 'single'}']`,
    `'semi': ['error', ${opts.semi ? "'always'" : "'never'"}]`,
    `'indent': ['error', ${indentNum}]`,
    `'comma-dangle': ['error', '${opts.trailingComma || 'none'}']`,
    "'no-var': 'error'"
  ]
  if (opts.noConsoleWarn) rules.unshift("'no-console': 'warn'")

  arr.push([
    '  {',
    `    files: ['${filesPattern}'],`,
    '    languageOptions: {',
    langKeys.map(k => `      ${k}`).join(',\n') + ',',
    '    },',
    '    rules: {',
    rules.map(r => `      ${r}`).join(',\n') + ',',
    '    }',
    '  },'
  ].join('\n'))

  if (opts.prettier) {
    arr.push('  // 放在数组末尾，关闭与 Prettier 冲突的格式规则\n  prettier,')
  }

  return `${imports.join('\n')}\n\nexport default [\n${arr.join('\n')}\n]\n`
}

// 生成 .prettierrc JSON
function genPrettierConfig(opts) {
  const conf = {
    semi: !!opts.semi,
    singleQuote: opts.quotes !== 'double',
    tabWidth: Number(opts.indent) || 2,
    trailingComma: opts.trailingComma || 'none',
    printWidth: 100
  }
  return JSON.stringify(conf, null, 2) + '\n'
}

// 生成 .editorconfig
function genEditorConfig(opts) {
  return `root = true

[*]
charset = utf-8
indent_style = space
indent_size = ${Number(opts.indent) || 2}
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
`
}

// 生成 husky + lint-staged 片段
function genHuskySnippet(opts) {
  const files = `*.{js,mjs,cjs${opts.ts ? ',ts,tsx' : ''}${opts.vue ? ',vue' : ''}}`
  const lintCmd = 'eslint --fix --max-warnings=0'
  const prettyCmd = 'prettier --write'
  return `# 1) 安装并初始化
npm i -D husky lint-staged prettier eslint-config-prettier
npx husky init

# 2) .husky/pre-commit 钩子内容
npx lint-staged

# 3) package.json 增加 lint-staged 配置段
{
  "lint-staged": {
    "${files}": [
      "${lintCmd}"${opts.prettier ? `,\n      "${prettyCmd}"` : ''}
    ]${opts.prettier ? `,\n    "*.{json,md,css,scss,html}": [\n      "${prettyCmd}"\n    ]` : ''}
  },
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
`
}

// 生成依赖安装提示
function genInstallHint(opts) {
  const pkgs = ['eslint', '@eslint/js', 'globals']
  if (opts.ts) pkgs.push('typescript-eslint')
  if (opts.vue) pkgs.push('eslint-plugin-vue')
  if (opts.react) pkgs.push('eslint-plugin-react', 'eslint-plugin-react-hooks')
  if (opts.prettier) pkgs.push('prettier', 'eslint-config-prettier')
  return `npm i -D ${pkgs.join(' ')}`
}
// ===== [PURE-END] =====

// ---------- 状态 ----------
const PROJECT_TYPES = [
  { key: 'vue', label: 'Vue 3' },
  { key: 'react', label: 'React' },
  { key: 'ts', label: 'TypeScript' },
  { key: 'node', label: 'Node' },
  { key: 'browser', label: '纯 JS（浏览器）' }
]
const QUOTE_OPTIONS = [
  { value: 'single', label: '单引号' },
  { value: 'double', label: '双引号' }
]
const COMMA_OPTIONS = [
  { value: 'none', label: '无' },
  { value: 'es5', label: 'ES5' },
  { value: 'all', label: '全部' }
]

const selected = ref({ vue: false, react: false, ts: false, node: false, browser: true })
const quotes = ref('single')
const semi = ref(true)
const indent = ref(2)
const trailingComma = ref('es5')
const withPrettier = ref(true)
const noConsoleWarn = ref(true)
const withHusky = ref(true)
const activeTab = ref('eslint')
const copiedKey = ref('')
const seoContentVisible = ref(true)

const toggleType = (key) => {
  selected.value = { ...selected.value, [key]: !selected.value[key] }
}

const configOptions = computed(() => ({
  vue: selected.value.vue,
  react: selected.value.react,
  ts: selected.value.ts,
  node: selected.value.node,
  browser: selected.value.browser,
  quotes: quotes.value,
  semi: semi.value,
  indent: indent.value,
  trailingComma: trailingComma.value,
  prettier: withPrettier.value,
  noConsoleWarn: noConsoleWarn.value
}))

const generatedFiles = computed(() => {
  const o = configOptions.value
  const out = [{
    key: 'eslint',
    name: 'eslint.config.js',
    content: genEslintConfig(o),
    hint: '放到项目根目录，ESLint 9 会自动读取此文件',
    note: '运行 npx eslint . 验证；报错缺包时按下方提示安装。'
  }]
  if (o.prettier) {
    out.push({
      key: 'prettier',
      name: '.prettierrc',
      content: genPrettierConfig(o),
      hint: '放到项目根目录，与 eslint-config-prettier 搭配使用',
      note: '建议在 VS Code 安装 Prettier 扩展并设置保存时格式化。'
    })
  }
  out.push({
    key: 'editorconfig',
    name: '.editorconfig',
    content: genEditorConfig(o),
    hint: '放到项目根目录，统一编辑器缩进与换行',
    note: '编辑器需支持 EditorConfig（VS Code 内置或装扩展）。'
  })
  if (withHusky.value) {
    out.push({
      key: 'husky',
      name: 'husky + lint-staged',
      content: genHuskySnippet(o),
      hint: '三段命令与配置片段，按顺序执行接入提交前检查',
      note: '要求 package.json 是 git 仓库的一部分；husky 8 以下写法不同，建议用最新版。'
    })
  }
  return out
})

const visibleFiles = computed(() => generatedFiles.value)

const activeFile = computed(() =>
  visibleFiles.value.find(f => f.key === activeTab.value) || visibleFiles.value[0]
)

const activeFileContent = computed(() => activeFile.value.content)
const activeFileHint = computed(() => activeFile.value.hint)
const activeFileNote = computed(() => activeFile.value.note)
const installHint = computed(() => genInstallHint(configOptions.value))

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
