<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Settings2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">.editorconfig 生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">可视化配置 root 声明、缩进风格、字符集与行尾，支持分节覆盖，一键生成可直接提交的 .editorconfig</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 .editorconfig 生成工具：勾选 root 声明、选择字符集与行尾（lf/crlf/cr）、配置缩进方式与缩进宽度，再为 Markdown、YAML、Makefile 等特殊文件添加分节覆盖规则，
        实时预览并一键复制或下载 .editorconfig 文件。内置前端 Web、Python、Go、Ruby、Java/C# 等常用缩进预设，帮助团队统一缩进风格、
        消除「空格还是 Tab」「lf 还是 crlf」这类无休止的争论。全部生成在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：配置选项 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 配置选项
          </h2>
          <button
            @click="resetAll"
            class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition"
          >
            <RefreshCw class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 重置
          </button>
        </div>

        <!-- 通用区 -->
        <div class="space-y-3">
          <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">通用规则（[*] 所有文件）</p>

          <label class="flex items-center justify-between gap-3 cursor-pointer py-1">
            <span class="text-sm text-foreground">声明 <code class="font-mono text-xs text-primary">root = true</code>（不再向上级目录查找）</span>
            <input
              v-model="opts.root"
              type="checkbox"
              class="h-4 w-4 flex-shrink-0 cursor-pointer"
              :style="{ accentColor: 'var(--primary, #2563eb)' }"
            />
          </label>

          <div>
            <label class="block text-xs text-muted-foreground mb-1.5" for="ec-charset">字符集 charset</label>
            <select
              id="ec-charset"
              v-model="opts.charset"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="utf-8">utf-8（推荐）</option>
              <option value="utf-8-bom">utf-8-bom</option>
              <option value="utf-16be">utf-16be</option>
              <option value="utf-16le">utf-16le</option>
              <option value="latin1">latin1</option>
              <option value="off">不设置（省略该行）</option>
            </select>
          </div>

          <div>
            <label class="block text-xs text-muted-foreground mb-1.5" for="ec-eol">行尾 end_of_line</label>
            <select
              id="ec-eol"
              v-model="opts.endOfLine"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="lf">lf（Unix / macOS / Git 默认）</option>
              <option value="crlf">crlf（Windows）</option>
              <option value="cr">cr（旧版 Mac，少见）</option>
            </select>
          </div>

          <label class="flex items-center justify-between gap-3 cursor-pointer py-1">
            <span class="text-sm text-foreground">文件末尾保留一个空行 <code class="font-mono text-xs text-primary">insert_final_newline</code></span>
            <input
              v-model="opts.insertFinalNewline"
              type="checkbox"
              class="h-4 w-4 flex-shrink-0 cursor-pointer"
              :style="{ accentColor: 'var(--primary, #2563eb)' }"
            />
          </label>

          <label class="flex items-center justify-between gap-3 cursor-pointer py-1">
            <span class="text-sm text-foreground">删除行尾多余空白 <code class="font-mono text-xs text-primary">trim_trailing_whitespace</code></span>
            <input
              v-model="opts.trimTrailingWhitespace"
              type="checkbox"
              class="h-4 w-4 flex-shrink-0 cursor-pointer"
              :style="{ accentColor: 'var(--primary, #2563eb)' }"
            />
          </label>
        </div>

        <hr class="border-border" />

        <!-- 缩进规则 -->
        <div class="space-y-3">
          <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">缩进规则</p>

          <div class="flex items-end gap-2">
            <div class="flex-1">
              <label class="block text-xs text-muted-foreground mb-1.5" for="ec-preset">缩进预设（一键填充，选后仍可修改）</label>
              <select
                id="ec-preset"
                v-model="presetId"
                @change="handlePresetChange"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">选择语言预设…</option>
                <option v-for="p in INDENT_PRESETS" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
            <button
              @click="loadWebPreset"
              class="flex-shrink-0 px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition whitespace-nowrap"
            >
              <Play class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 载入前端 Web
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-muted-foreground mb-1.5" for="ec-style">缩进方式 indent_style</label>
              <select
                id="ec-style"
                v-model="opts.indentStyle"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="space">空格 space</option>
                <option value="tab">Tab</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1.5" for="ec-size">缩进宽度 indent_size</label>
              <select
                id="ec-size"
                v-model="opts.indentSize"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="2">2</option>
                <option value="4">4</option>
                <option value="8">8</option>
                <option value="tab">tab（按 Tab 宽度）</option>
              </select>
            </div>
          </div>

          <p
            v-if="opts.indentStyle === 'tab'"
            class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5"
          >
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>Tab 缩进时，indent_size 的数值表示 Tab 的渲染列宽；选 tab 则交给编辑器默认 Tab 宽度。</span>
          </p>

          <div>
            <label class="block text-xs text-muted-foreground mb-1.5" for="ec-maxline">单行长度提醒 max_line_length（选填）</label>
            <select
              id="ec-maxline"
              v-model="opts.maxLineLength"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="off">不设置</option>
              <option value="80">80</option>
              <option value="100">100</option>
              <option value="120">120</option>
            </select>
          </div>
        </div>

        <hr class="border-border" />

        <!-- 分节规则 -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">分节规则（覆盖通用区）</p>
            <button
              @click="addSection"
              class="px-2.5 py-1 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-primary transition"
            >
              ＋ 新增分节
            </button>
          </div>

          <div v-for="(sec, idx) in sections" :key="idx" class="border border-border rounded-lg p-3 space-y-2.5 bg-muted/30">
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-muted-foreground font-mono flex-shrink-0">[</span>
              <input
                v-model="sec.glob"
                type="text"
                placeholder="如 *.{py,rb}、src/** 或 Makefile"
                class="flex-1 min-w-0 px-2 py-1.5 bg-background border border-border rounded text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span class="text-xs text-muted-foreground font-mono flex-shrink-0">]</span>
              <button
                @click="removeSection(idx)"
                class="flex-shrink-0 text-xs text-red-500 hover:text-red-600 font-medium"
                :aria-label="`移除分节 ${sec.glob || '未命名'}`"
              >
                移除
              </button>
            </div>

            <p
              v-if="globFeedback(idx).level === 'error'"
              class="text-xs text-red-500 flex items-start gap-1"
            >
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ globFeedback(idx).hint }}</span>
            </p>
            <p
              v-else-if="globFeedback(idx).level === 'info'"
              class="text-xs text-muted-foreground flex items-start gap-1"
            >
              <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ globFeedback(idx).hint }}</span>
            </p>

            <div class="grid grid-cols-2 gap-2">
              <div v-for="field in overrideFieldDefs" :key="field.key">
                <label class="block text-[10px] text-muted-foreground mb-1">{{ field.label }}</label>
                <select
                  v-model="sec.overrides[field.key]"
                  class="w-full px-1.5 py-1 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="inherit">跟随通用区</option>
                  <option v-for="choice in field.choices" :key="choice.value" :value="choice.value">{{ choice.label }}</option>
                </select>
              </div>
            </div>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed">
            每个分节只输出与通用区不同的键（覆盖相同值时自动省略）；匹配名为空的节不会出现在结果里。顺序：越靠下的分节优先级越高，可覆盖上面的分节。
          </p>
        </div>
      </div>

      <!-- 右：生成结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <FileCode class="w-5 h-5 mr-2 text-primary" /> 生成的 .editorconfig
          </h2>
          <span class="text-xs text-muted-foreground">{{ outputLines }} 行 · {{ outputChars }} 字符 · 实时更新</span>
        </div>

        <pre class="bg-muted/50 border border-border rounded-lg p-4 overflow-auto max-h-[460px] text-xs leading-relaxed font-mono text-foreground whitespace-pre">{{ outputText }}</pre>

        <div class="flex flex-wrap gap-2">
          <button
            @click="copyOutput"
            class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            <CheckCircle v-if="copied" class="w-4 h-4 inline mr-1.5 -mt-0.5" />
            <Copy v-else class="w-4 h-4 inline mr-1.5 -mt-0.5" />
            {{ copied ? '已复制' : '复制内容' }}
          </button>
          <button
            @click="downloadConfig"
            class="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            下载 .editorconfig
          </button>
        </div>

        <!-- 使用说明卡 -->
        <div class="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-1.5">
          <p class="text-sm font-medium text-foreground flex items-center">
            <Info class="w-4 h-4 mr-1.5 text-primary" /> 使用说明
          </p>
          <ol class="list-decimal list-inside space-y-1 text-xs text-muted-foreground leading-relaxed">
            <li>把生成内容保存为 <code class="font-mono">.editorconfig</code>，放在仓库根目录（或任何想生效的目录）。</li>
            <li>.editorconfig 不是拿来直接运行的：需配合编辑器插件，在保存文件时自动套用缩进、字符集与行尾。</li>
            <li>VSCode 需安装 EditorConfig 扩展才生效；JetBrains 全家桶（IDEA / WebStorm / PyCharm）原生支持。</li>
          </ol>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>.editorconfig 是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          .editorconfig 是一份「编辑器层」的代码风格约定：一个纯文本 INI 格式文件，加上各编辑器的 EditorConfig 插件，
          就能让同一个仓库里的所有人在任何编辑器中保持一致的缩进字符、缩进宽度、字符集与行尾。它只管最基础的三件事——
          缩进（空格还是 Tab、每级几格）、字符集（utf-8 等）、行尾（lf/crlf/cr），外加最终空行与行尾空白两类清理；
          引号单双、分号、换行宽、import 排序、代码质量等规则不在它的管辖范围内。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">与 Prettier、ESLint 的分工</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          三者常被混为一谈，其实分工清晰：
        </p>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          <li><strong class="text-foreground">EditorConfig</strong>：最底层，管「文件的物理形态」——缩进字符、字符集、行尾，任何语言、任何编辑器通用，保存前就生效。</li>
          <li><strong class="text-foreground">Prettier</strong>：管「排版后的代码长相」——引号、分号、折行宽度、逗号风格，按语言解析后重新输出代码。</li>
          <li><strong class="text-foreground">ESLint</strong>：管「写法对不对」——代码质量与部分风格规则，可自动修复，能约束逻辑层面的约定。</li>
        </ul>
        <p class="text-sm text-muted-foreground mt-2 leading-relaxed">
          通常的做法是三者并存：EditorConfig 作为全仓库公共底线，Prettier 负责格式化，ESLint 负责质量检查，
          并让 Prettier 的 useTabs / tabWidth 选项与 .editorconfig 保持一致，避免互相打架。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">放哪里？生效范围怎么算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          .editorconfig 放在哪个目录，就对哪个目录及其全部子目录生效。编辑器打开文件时，从文件所在目录逐级向上查找 .editorconfig，
          离文件越近的设置优先级越高，下层可覆盖上层。放仓库根目录是标准做法：团队成员 clone 后无需任何额外配置即可共享同一套规则。
          根目录文件里的 <code class="font-mono">root = true</code> 声明告诉插件「到此为止，别再向上查找」，
          避免个人 home 目录里的全局配置混入团队仓库。子项目、monorepo 的子包也可以放自己的 .editorconfig 单独收窄规则。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见分节写法</h3>
        <pre v-pre class="bg-muted/50 border border-border rounded-lg p-4 overflow-auto text-xs leading-relaxed font-mono text-foreground mb-2">[*]                          # 所有文件
indent_style = space
indent_size = 2

[*.{js,ts,vue}]              # 大括号匹配多种后缀
max_line_length = 100

[**.py]                      # 任意目录层级下的 .py
indent_size = 4

[src/**]                     # src 目录下的所有文件
charset = utf-8

[Makefile]                   # 精确文件名，必须用 Tab
indent_style = tab</pre>
        <p class="text-sm text-muted-foreground leading-relaxed">
          <code class="font-mono">*</code> 匹配除路径分隔符外的任意字符串，<code class="font-mono">**</code> 可跨目录层级，
          <code class="font-mono">{a,b}</code> 表示多模式任选，<code class="font-mono">\*</code> 转义后只匹配字面星号。
          写在后面的分节优先级更高，可覆盖前面的同名设置。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么 Makefile 必须用 Tab 缩进？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Makefile 的语法硬性规定：规则下面的命令行必须以一个真实的 Tab 字符（\t）开头，这是 make 解析语法的依据而不是风格偏好——
          如果编辑器把 Tab 自动替换成空格，make 会直接报「missing separator」错误。所以 Makefile 在 .editorconfig 里必须单独分节
          写 <code class="font-mono">indent_style = tab</code>，显式覆盖通用区的空格缩进。同理，YAML 对缩进字符敏感（禁止 Tab）、
          Markdown 渲染时 Tab 宽度不定，这类文件也建议单独分节处理。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div v-for="(item, i) in faqItems" :key="i">
            <h3 class="text-base font-semibold text-foreground">{{ item.q }}</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">{{ item.a }}</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'editorconfig-generator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Settings2, Copy, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, FileCode
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- FAQ 数据（正文与 JSON-LD 共用） ----------
const faqItems = [
  {
    q: 'editorconfig 是什么？和 Prettier、ESLint 有什么区别？',
    a: 'EditorConfig 是编辑器层的代码风格约定，只管最基础的三件事：缩进（空格/Tab 与宽度）、字符集、行尾，外加最终空行与行尾空白清理。它不管引号、分号、折行这些排版细节（Prettier 的领域），也不管代码质量规则（ESLint 的领域）。三者可以并存：EditorConfig 作全仓库公共底线，Prettier 负责格式化，ESLint 负责质量检查。'
  },
  {
    q: '.editorconfig 文件放在哪里？生效范围怎么算？',
    a: '放在哪个目录就对哪个目录及全部子目录生效。编辑器打开文件时会从文件所在目录逐级向上查找，越靠近文件的设置优先级越高，下层可覆盖上层。标准做法是放在仓库根目录并写上 root = true，阻止插件继续向上查找，避免个人全局配置混入团队仓库。'
  },
  {
    q: 'VSCode 需要装 EditorConfig 插件吗？',
    a: '需要。VSCode 必须安装「EditorConfig for VS Code」扩展才会读取 .editorconfig；JetBrains 全家桶（IDEA、WebStorm、PyCharm 等）原生支持，GitHub 代码浏览界面也会按它显示文件缩进，Vim、Emacs、Sublime Text 需要各自安装对应插件。'
  },
  {
    q: '常见分节写法有哪些？',
    a: '[*] 匹配所有文件；[*.{js,ts,vue}] 用大括号匹配多种后缀；[**.py] 匹配任意目录层级下的 .py；[src/**] 限定某个目录；[Makefile] 精确匹配单个文件名。写在后面的分节优先级更高，可以覆盖前面的设置；只需要在分节里写与通用区不同的键。'
  },
  {
    q: '为什么 Makefile 必须用 Tab 缩进？',
    a: 'Makefile 语法硬性要求：规则下的命令行必须以真实 Tab 字符开头，这是 make 解析语法的依据而非风格偏好。Tab 被替换成空格后 make 会报「missing separator」错误。因此 Makefile 要在 .editorconfig 里单独分节写 indent_style = tab，覆盖通用区的空格缩进。'
  }
]

// ---------- SEO ----------
useSeoMeta({
  title: '.editorconfig 生成器 - 在线编辑器配置文件生成工具',
  description: '免费在线 .editorconfig 生成器：可视化配置 root 声明、缩进风格（空格/Tab）、缩进宽度、字符集、行尾 lf/crlf、最终空行与行尾空白清理，支持 *.{md,yml}、Makefile 等分节覆盖规则与前端 Web、Python、Go 等一键缩进预设，一键复制下载，统一团队缩进风格与代码风格，纯浏览器本地运行不上传',
  keywords: 'editorconfig 生成,editorconfig 配置,缩进风格,代码风格统一,editorconfig 是什么',
  author: '有条工具',
  ogTitle: '.editorconfig 生成器 - 在线编辑器配置文件生成工具 | 有条工具',
  ogDescription: '可视化配置缩进、字符集与行尾，支持分节覆盖与常用缩进预设，一键生成 .editorconfig。',
  ogUrl: 'https://www.util.cn/tools/editorconfig-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '.editorconfig 生成器',
          url: 'https://www.util.cn/tools/editorconfig-generator',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['root 声明与通用规则可视化配置', '字符集与行尾 lf/crlf/cr 选择', '空格/Tab 缩进风格与宽度设置', '前端 Web、Python、Go、Ruby、Java 一键缩进预设', 'Markdown、YAML、Makefile 分节覆盖规则', 'max_line_length 选填', 'glob 匹配名校验与通配符提示', '一键复制与下载 .editorconfig', '本地生成不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '.editorconfig 生成器', item: 'https://www.util.cn/tools/editorconfig-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a }
          }))
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// ini 输出的键序规范（editorconfig 文档惯用顺序）
const SECTION_KEY_ORDER = ['charset', 'end_of_line', 'indent_style', 'indent_size', 'tab_width', 'insert_final_newline', 'trim_trailing_whitespace', 'max_line_length']
// 分节里允许覆盖的键（不含 max_line_length，通用区选填项）
const OVERRIDE_KEYS = ['charset', 'end_of_line', 'indent_style', 'indent_size', 'tab_width', 'insert_final_newline', 'trim_trailing_whitespace']
// 分节下拉的「跟随通用区」占位值
const INHERIT = 'inherit'
const EMPTY_OVERRIDES = { charset: INHERIT, end_of_line: INHERIT, indent_style: INHERIT, indent_size: INHERIT, tab_width: INHERIT, insert_final_newline: INHERIT, trim_trailing_whitespace: INHERIT }
const MARKDOWN_GLOB = '*.{md,mkdn}'

// 缩进宽度行：indent_size 直接采用所选值，'tab' 表示缩进宽度交给编辑器 Tab 宽度
function indentLineOf(style, size) {
  return `indent_size = ${size}`
}

// 把 UI 选项归一化为 ini 键值表：布尔转 'true'/'false'，'off' 与空值归 ''（不输出该键）
function normalizeBase(opts) {
  const onOff = (b) => (b ? 'true' : 'false')
  const max = String(opts.maxLineLength == null ? '' : opts.maxLineLength)
  return {
    charset: opts.charset && opts.charset !== 'off' ? opts.charset : '',
    end_of_line: opts.endOfLine,
    indent_style: opts.indentStyle,
    indent_size: String(opts.indentSize),
    tab_width: '',
    insert_final_newline: onOff(opts.insertFinalNewline),
    trim_trailing_whitespace: onOff(opts.trimTrailingWhitespace),
    max_line_length: max && max !== 'off' ? max : ''
  }
}

// 单个分节的输出行：节头 + 仅与通用区（base）不同的覆盖键；空 glob 不输出；
// 全部覆盖键都省略时保留节头与提示注释，方便用户确认该节仍然存在
function sectionLinesOf(glob, overrides, base) {
  const cleanGlob = String(glob || '').trim()
  if (!cleanGlob) return []
  const o = overrides || {}
  const lines = []
  OVERRIDE_KEYS.forEach((key) => {
    const v = o[key]
    if (!v || v === INHERIT) return
    if (String(v) === String(base[key])) return
    lines.push(`${key} = ${v}`)
  })
  if (!lines.length) {
    return [`[${cleanGlob}]`, '# （当前设置与通用区一致，此节没有覆盖项）']
  }
  return [`[${cleanGlob}]`, ...lines]
}

// 生成完整 .editorconfig 文本：头注释 + root 声明 + [*] 通用块 + 各分节
function buildEditorconfig(opts, sections) {
  const base = normalizeBase(opts)
  const lines = ['# EditorConfig 配置文件，规范详见 https://editorconfig.org']
  if (opts.root) lines.push('root = true')
  lines.push('')
  lines.push('[*]')
  SECTION_KEY_ORDER.forEach((key) => {
    if (base[key] !== '') lines.push(`${key} = ${base[key]}`)
  })
  ;(sections || []).forEach((sec) => {
    const secLines = sectionLinesOf(sec.glob, sec.overrides, base)
    if (!secLines.length) return
    lines.push('')
    lines.push(...secLines)
  })
  return lines.join('\n') + '\n'
}

// 分节匹配名校验：非空、无空格；对 \* 转义与 {} 多模式给出支持说明
function validateGlobOf(glob) {
  const g = String(glob || '')
  if (!g.trim()) {
    return { ok: false, level: 'error', hint: '分节匹配名不能为空，例如 *.py、src/**/*.{ts,tsx} 或 Makefile' }
  }
  if (/\s/.test(g)) {
    return { ok: false, level: 'error', hint: '匹配名不能包含空格：多个模式请用大括号组合，如 *.{js,vue}' }
  }
  if (/\\\*/.test(g)) {
    return { ok: true, level: 'info', hint: '使用了 \\* 转义：星号只匹配字面 * 字符，而非任意字符' }
  }
  if (/[{}]/.test(g)) {
    return { ok: true, level: 'info', hint: '大括号 {a,b} 表示多模式匹配：任一后缀命中即应用本节规则' }
  }
  return { ok: true, level: 'ok', hint: '' }
}

// 缩进预设表：只作起点，填充后所有项均可继续修改
const INDENT_PRESETS = [
  { id: 'web', name: '前端 Web（2 空格）', indentStyle: 'space', indentSize: '2' },
  { id: 'python', name: 'Python（4 空格）', indentStyle: 'space', indentSize: '4' },
  { id: 'go', name: 'Go（Tab）', indentStyle: 'tab', indentSize: 'tab' },
  { id: 'ruby', name: 'Ruby（2 空格）', indentStyle: 'space', indentSize: '2' },
  { id: 'java', name: 'Java / C#（4 空格）', indentStyle: 'space', indentSize: '4' },
  { id: 'markdown', name: 'Markdown 特例（Tab + 显示宽度 2）', markdownSpecial: true }
]

function presetById(id) {
  return INDENT_PRESETS.find((p) => p.id === id) || null
}

// Markdown 特例分节：Tab 缩进 + 显示宽度 2（列表层级渲染更紧凑，复制粘贴不会被展开成空格）
function createMarkdownSection() {
  return { glob: MARKDOWN_GLOB, overrides: { ...EMPTY_OVERRIDES, indent_style: 'tab', tab_width: '2' } }
}

// 默认通用区选项
function createDefaultOpts() {
  return { root: true, charset: 'utf-8', endOfLine: 'lf', indentStyle: 'space', indentSize: '2', insertFinalNewline: true, trimTrailingWhitespace: true, maxLineLength: 'off' }
}

// 默认预填两条分节：Markdown/YAML 固定 2 宽、Makefile 固定 Tab
function createDefaultSections() {
  return [
    { glob: '*.{md,yml,yaml}', overrides: { ...EMPTY_OVERRIDES, indent_size: '2' } },
    { glob: 'Makefile', overrides: { ...EMPTY_OVERRIDES, indent_style: 'tab' } }
  ]
}

// ---------- 响应式状态 ----------
const opts = reactive(createDefaultOpts())
const sections = ref(createDefaultSections())
const presetId = ref('')
const copied = ref(false)
const seoContentVisible = ref(true)

// 分节覆盖键的下拉定义（label + 候选值）
const overrideFieldDefs = [
  { key: 'indent_style', label: '缩进方式', choices: [{ value: 'space', label: 'space 空格' }, { value: 'tab', label: 'tab' }] },
  { key: 'indent_size', label: '缩进宽度', choices: [{ value: '2', label: '2' }, { value: '4', label: '4' }, { value: '8', label: '8' }, { value: 'tab', label: 'tab' }] },
  { key: 'tab_width', label: 'Tab 显示宽度', choices: [{ value: '2', label: '2' }, { value: '4', label: '4' }, { value: '8', label: '8' }] },
  { key: 'end_of_line', label: '行尾', choices: [{ value: 'lf', label: 'lf' }, { value: 'crlf', label: 'crlf' }, { value: 'cr', label: 'cr' }] },
  { key: 'charset', label: '字符集', choices: [{ value: 'utf-8', label: 'utf-8' }, { value: 'utf-8-bom', label: 'utf-8-bom' }, { value: 'latin1', label: 'latin1' }] },
  { key: 'insert_final_newline', label: '最终空行', choices: [{ value: 'true', label: '开启' }, { value: 'false', label: '关闭' }] },
  { key: 'trim_trailing_whitespace', label: '去行尾空白', choices: [{ value: 'true', label: '开启' }, { value: 'false', label: '关闭' }] }
]

// ---------- 计算属性 ----------
const outputText = computed(() => buildEditorconfig(opts, sections.value))
const outputLines = computed(() => outputText.value.split('\n').length)
const outputChars = computed(() => outputText.value.length)

// ---------- 事件与方法 ----------
function globFeedback(idx) {
  return validateGlobOf(sections.value[idx].glob)
}

function applyPresetById(id) {
  const preset = presetById(id)
  if (!preset) return
  if (preset.markdownSpecial) {
    const exists = sections.value.some((s) => s.glob === MARKDOWN_GLOB)
    if (!exists) {
      sections.value.push(createMarkdownSection())
    }
    presetId.value = id
    return
  }
  opts.indentStyle = preset.indentStyle
  opts.indentSize = preset.indentSize
  presetId.value = id
}

function handlePresetChange() {
  if (!presetId.value) return
  applyPresetById(presetId.value)
}

function loadWebPreset() {
  applyPresetById('web')
}

function addSection() {
  sections.value.push({ glob: '', overrides: { ...EMPTY_OVERRIDES } })
}

function removeSection(idx) {
  sections.value.splice(idx, 1)
}

async function copyOutput() {
  try {
    await navigator.clipboard.writeText(outputText.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch (err) {
    window.alert('复制失败，请手动全选输出区文本复制。')
  }
}

function downloadConfig() {
  try {
    const blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '.editorconfig'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err) {
    window.alert('下载失败，请手动复制输出内容并保存为 .editorconfig。')
  }
}

function resetAll() {
  Object.assign(opts, createDefaultOpts())
  sections.value = createDefaultSections()
  presetId.value = ''
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('editorconfig-generator')
})
</script>
