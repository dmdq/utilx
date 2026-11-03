<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Wand2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Prettier 配置生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">可视化调整 13 项官方选项，一键生成 .prettierrc / .prettierrc.yaml / package.json 配置</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 Prettier 配置生成器：所有选项默认值与 Prettier 3 官方文档一致（printWidth 80、tabWidth 2、trailingComma all、endOfLine lf 等），
        支持一键套用「常见前端团队」「无分号风格」预设；可切换「精简（只含非默认项）」与「完整（显式全部键）」两种输出口径，同步生成 .prettierrc、
        .prettierrc.yaml 与 package.json 内嵌片段三种载体，并附 npm 安装、npx --write 格式化命令、.prettierignore 片段及与 ESLint 协作的提示。
        全部在浏览器本地生成，不上传任何数据。
      </p>
    </div>

    <!-- 工具主体：左选项 + 右输出 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：选项面板 -->
      <div class="space-y-4">
        <!-- 预设 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center gap-2">
            <Wand2 class="w-4 h-4 text-primary" /> 预设（一键填充）
          </h3>
          <div>
            <label for="pw-preset" class="block text-sm font-medium text-foreground mb-1.5">选择预设</label>
            <select
              id="pw-preset"
              v-model="presetKey"
              @change="applyPreset"
              class="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="p in PRESETS" :key="p.key" :value="p.key">{{ p.label }}</option>
            </select>
          </div>
          <button
            @click="resetToDefaults"
            class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置为官方默认
          </button>
        </div>

        <!-- 选项 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 class="font-semibold text-foreground flex items-center gap-2">
            <FileCode class="w-4 h-4 text-primary" /> 选项（默认值 = Prettier 3 官方默认）
          </h3>

          <!-- 排版 -->
          <div class="space-y-3">
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="pw-print-width" class="text-sm font-medium text-foreground">printWidth 每行最大列数</label>
                <span class="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">默认 80</span>
              </div>
              <div class="flex items-center gap-3">
                <input id="pw-print-width" v-model.number="opts.printWidth" type="range" min="40" max="200" step="1" class="w-full">
                <span class="w-10 text-right text-sm font-mono text-primary">{{ opts.printWidth }}</span>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="pw-tab-width" class="text-sm font-medium text-foreground">tabWidth 缩进空格数</label>
                <span class="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">默认 2</span>
              </div>
              <select
                id="pw-tab-width"
                v-model.number="opts.tabWidth"
                class="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option v-for="n in [1, 2, 3, 4, 8]" :key="n" :value="n">{{ n }} 空格</option>
              </select>
            </div>
            <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input v-model="opts.useTabs" type="checkbox" class="w-4 h-4 rounded border-border">
              <span>useTabs 用 Tab 缩进代替空格</span>
              <span class="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">默认 false</span>
            </label>
          </div>

          <!-- 代码风格 -->
          <div class="border-t border-border pt-4 space-y-3">
            <p class="text-xs font-semibold text-muted-foreground">代码风格</p>
            <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input v-model="opts.semi" type="checkbox" class="w-4 h-4 rounded border-border">
              <span>semi 语句结尾加分号</span>
              <span class="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">默认 true</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input v-model="opts.singleQuote" type="checkbox" class="w-4 h-4 rounded border-border">
              <span>singleQuote 字符串用单引号</span>
              <span class="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">默认 false</span>
            </label>
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="pw-quote-props" class="text-sm font-medium text-foreground">quoteProps 对象键引号</label>
                <span class="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">默认 as-needed</span>
              </div>
              <select
                id="pw-quote-props"
                v-model="opts.quoteProps"
                class="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="as-needed">as-needed（需要时才加引号）</option>
                <option value="consistent">consistent（有需要就全部加）</option>
                <option value="preserve">preserve（保留原样）</option>
              </select>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="pw-trailing-comma" class="text-sm font-medium text-foreground">trailingComma 尾逗号</label>
                <span class="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">v3 默认 all · v2 es5</span>
              </div>
              <select
                id="pw-trailing-comma"
                v-model="opts.trailingComma"
                class="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">all（v3 默认，函数参数也补）</option>
                <option value="es5">es5（v2 默认，仅 ES5 结构）</option>
                <option value="none">none（不补尾逗号）</option>
              </select>
            </div>
          </div>

          <!-- 括号与箭头 -->
          <div class="border-t border-border pt-4 space-y-3">
            <p class="text-xs font-semibold text-muted-foreground">括号与箭头</p>
            <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input v-model="opts.bracketSpacing" type="checkbox" class="w-4 h-4 rounded border-border">
              <span>bracketSpacing 对象字面量内保留空格</span>
              <span class="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">默认 true</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input v-model="opts.bracketSameLine" type="checkbox" class="w-4 h-4 rounded border-border">
              <span>bracketSameLine 多行 HTML 标签「&gt;」不换行</span>
              <span class="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">默认 false</span>
            </label>
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="pw-arrow-parens" class="text-sm font-medium text-foreground">arrowParens 单参箭头函数括号</label>
                <span class="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">默认 always</span>
              </div>
              <select
                id="pw-arrow-parens"
                v-model="opts.arrowParens"
                class="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="always">always（始终加括号）</option>
                <option value="avoid">avoid（单参数省略括号）</option>
              </select>
            </div>
          </div>

          <!-- 文本与换行 -->
          <div class="border-t border-border pt-4 space-y-3">
            <p class="text-xs font-semibold text-muted-foreground">文本与换行</p>
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="pw-prose-wrap" class="text-sm font-medium text-foreground">proseWrap Markdown 折行</label>
                <span class="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">默认 preserve</span>
              </div>
              <select
                id="pw-prose-wrap"
                v-model="opts.proseWrap"
                class="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="preserve">preserve（保持原样）</option>
                <option value="always">always（按 printWidth 折行）</option>
                <option value="never">never（永不折行）</option>
              </select>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="pw-eol" class="text-sm font-medium text-foreground">endOfLine 行尾符</label>
                <span class="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">默认 lf</span>
              </div>
              <select
                id="pw-eol"
                v-model="opts.endOfLine"
                class="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="lf">lf（默认，推荐）</option>
                <option value="crlf">crlf（Windows）</option>
                <option value="cr">cr（旧 Mac）</option>
                <option value="auto">auto（保持文件首行行尾）</option>
              </select>
              <p class="mt-1.5 text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
                <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Windows Git 用户注意：开启 core.autocrlf 时检出文件是 CRLF，endOfLine=lf 会让 prettier 改写整份文件行尾。建议仓库加 .gitattributes（* text=auto eol=lf），或把 endOfLine 设为 auto。</span>
              </p>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="pw-hws" class="text-sm font-medium text-foreground">htmlWhitespaceSensitivity HTML 空格敏感</label>
                <span class="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">默认 css</span>
              </div>
              <select
                id="pw-hws"
                v-model="opts.htmlWhitespaceSensitivity"
                class="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="css">css（按 CSS display 决定）</option>
                <option value="strict">strict（严格保留空白）</option>
                <option value="ignore">ignore（忽略空白）</option>
              </select>
            </div>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-lg p-2.5 flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>早期版本的 jsxBracket（单参组件箭头括号）已在 Prettier 2.0 移除，行为并入 arrowParens，本工具不再提供该选项。</span>
          </p>

          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <CheckCircle v-if="diffKeys.length === 0" class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <Info v-else class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{{ diffStatusText }}</span>
          </p>
        </div>
      </div>

      <!-- 右侧：输出（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 配置输出 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileCode class="w-5 h-5 mr-2 text-primary" /> 配置输出
            </h2>
            <select
              v-model="mode"
              aria-label="选择配置模式"
              class="px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="minimal">精简（只含非默认项）</option>
              <option value="full">完整（显式全部键）</option>
            </select>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="t in OUTPUT_TABS"
              :key="t.key"
              @click="activeTab = t.key"
              :class="activeTab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
            >{{ t.name }}</button>
          </div>

          <div class="flex items-center justify-between gap-2">
            <span class="text-xs text-muted-foreground">{{ activeTabMeta.hint }}</span>
            <button
              @click="copyText(activeContent)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs text-foreground transition-colors flex-shrink-0"
            >
              <Copy class="w-3.5 h-3.5" /> 复制
            </button>
          </div>

          <pre class="overflow-auto p-4 bg-muted/30 border border-border rounded-lg text-xs font-mono leading-relaxed max-h-[30rem] text-foreground">{{ activeContent }}</pre>

          <p class="text-xs text-muted-foreground leading-relaxed">{{ modeNote }}</p>
        </div>

        <!-- 安装与格式化命令 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Play class="w-5 h-5 mr-2 text-primary" /> 安装与格式化命令
            </h2>
            <label class="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input v-model="hasPrettierDep" type="checkbox" class="w-3.5 h-3.5 rounded border-border">
              项目里已装过 prettier（跳过安装）
            </label>
          </div>
          <template v-for="(cmd, i) in installCmds" :key="cmd">
            <div class="flex items-stretch gap-2">
              <pre class="flex-1 overflow-auto p-3 bg-muted/30 border border-border rounded-lg text-xs font-mono text-foreground">{{ cmd }}</pre>
              <button
                @click="copyText(cmd)"
                :aria-label="`复制命令 ${cmd}`"
                class="px-3 rounded-lg bg-muted hover:bg-muted/80 text-xs text-foreground transition-colors flex-shrink-0"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>
            </div>
            <p v-if="i === installCmds.length - 1" class="text-xs text-muted-foreground leading-relaxed">
              npm i -D prettier 把 Prettier 装为开发依赖；npx prettier --write . 按当前配置格式化整个项目，node_modules 与 dist 默认不碰（配合下方 .prettierignore）。
            </p>
          </template>
        </div>

        <!-- .prettierignore（可折叠） -->
        <div class="bg-card border border-border rounded-lg p-5">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileCode class="w-5 h-5 mr-2 text-primary" /> .prettierignore
            </h2>
            <button
              @click="ignoreOpen = !ignoreOpen"
              class="text-muted-foreground hover:text-foreground"
              aria-label="展开或收起 .prettierignore"
            >
              <ChevronUp v-if="ignoreOpen" class="w-5 h-5" />
              <ChevronDown v-else class="w-5 h-5" />
            </button>
          </div>
          <div v-show="ignoreOpen" class="mt-3 space-y-3">
            <p class="text-xs text-muted-foreground leading-relaxed">保存为项目根目录的 .prettierignore，语法与 .gitignore 一致；下面片段覆盖最常见的误格式化场景（构建产物、依赖目录、锁文件）。</p>
            <div class="flex items-stretch gap-2">
              <pre class="flex-1 overflow-auto p-3 bg-muted/30 border border-border rounded-lg text-xs font-mono text-foreground">{{ ignoreContent }}</pre>
              <button
                @click="copyText(ignoreContent)"
                aria-label="复制 .prettierignore 内容"
                class="px-3 rounded-lg bg-muted hover:bg-muted/80 text-xs text-foreground transition-colors flex-shrink-0"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- 与 ESLint 协作提示 -->
        <div class="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
          <TriangleAlert class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            与 ESLint 协作：安装 <code class="px-1 bg-muted rounded">eslint-config-prettier</code> 并放到 ESLint flat config 数组最后一项，它会关闭所有与 Prettier 冲突的格式规则（引号、分号、尾逗号等）；之后格式化统一交给 Prettier，ESLint 只负责代码质量检查，两者互不打架。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>Prettier 配置生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          Prettier 配置生成器是一款在线 .prettierrc 生成工具。它把 Prettier 的 13 项官方选项做成可视化表单——printWidth（每行最大列数）、tabWidth（缩进空格数）、
          useTabs、semi（分号）、singleQuote（单引号）、quoteProps、trailingComma（尾逗号）、bracketSpacing、bracketSameLine、arrowParens、proseWrap、
          endOfLine（行尾符）与 htmlWhitespaceSensitivity——每项默认值都与 Prettier 3 官方文档一致并在旁标注。你可以在左侧实时调整，
          右侧同步生成三种载体：独立的 <code class="px-1 bg-muted rounded text-sm">.prettierrc</code>（JSON）、
          <code class="px-1 bg-muted rounded text-sm">.prettierrc.yaml</code>，以及 package.json 的 "prettier" 字段内嵌片段；
          每种格式都支持「精简（只含非默认项）」与「完整（显式全部键）」两种口径，并附安装命令、.prettierignore 片段与 ESLint 协作提示。纯浏览器本地生成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">prettier 和 eslint 的分工</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          ESLint 是代码质量工具：未使用变量、未定义引用、hooks 依赖这类「写了会出 bug」的问题归它管；Prettier 是代码格式化工具：引号、缩进、换行、尾逗号这类「长什么样」的问题归它管。
          两者的交集是一小撮格式规则（quotes、semi、comma-dangle 等），同时启用就会出现「ESLint 要求双引号、Prettier 格式化成单引号」的互相打架。
          标准做法是安装 <code class="px-1 bg-muted rounded text-sm">eslint-config-prettier</code>，并把它放到 ESLint 配置数组最后一项，关闭全部冲突规则；格式化统一交给 Prettier，ESLint 回归质量检查。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">.prettierrc 放哪？支持哪些文件名</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          放在项目根目录（与 package.json 同级）。Prettier 会从被格式化文件所在目录向上逐级查找配置，因此 monorepo 里也可以在子包再放一份覆盖根配置。
          可识别的配置载体有：package.json 的 "prettier" 字段、.prettierrc（JSON 或 JSON5）、.prettierrc.json、.prettierrc.yaml / .prettierrc.yml、
          .prettierrc.toml、prettier.config.js / .mjs / .cjs 等多种文件名，选一种即可（多个并存时按官方文档的优先级取用）。
          本工具生成的 JSON、YAML 与 package.json 片段对应其中最常用的三种载体。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">精简配置和完整配置哪个好</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          精简配置（只写非默认项）更短、升级友好——Prettier 升级改进默认值时你能自动受益，但读者需要「心中翻译」哪些键是默认值；
          完整配置（显式全部键）自解释性强，新人不查文档就能看到所有生效值，但默认值演进可能被显式写死的旧值锁住。
          团队口径建议：作为团队规范分发用完整配置（可读、可评审、可归档），个人项目或脚手架模板用精简配置（短、低维护）。
          本工具两种模式一键切换，对比后定稿即可。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">trailingComma 的 v2 / v3 差异</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          trailingComma 控制多行结构的末尾是否补逗号，可选 all / es5 / none。Prettier 3 起默认 all——函数调用与参数列表也补尾逗号，
          git diff 更干净、增删参数不再连带修改上一行；Prettier 2 默认 es5——只给对象、数组等 ES5 结构补，函数参数不补。
          es5 的价值主要是兼容不支持「尾逗号参数」的老运行时（如 IE）。新项目建议跟随官方默认 all；
          老项目从 v2 升级到 v3 后若不想让函数参数出现尾逗号，可显式写 es5。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">endOfLine 在 Windows 的坑</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          endOfLine 默认 lf。Windows 下 Git 若开启 core.autocrlf=true，检出文件行尾会被替换成 CRLF，而 Prettier 按 lf 校验就会提示「整份文件行尾都要改」，
          同事之间互相「修行尾」。两个解法：一是在仓库加 .gitattributes 写 <code class="px-1 bg-muted rounded text-sm">* text=auto eol=lf</code>，统一入库存 lf；
          二是把 endOfLine 设为 auto——Prettier 按每个文件第一行的现有行尾保持原样，行尾混搭的仓库用 auto 最省事。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么跑格式化？npx 一条命令</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不装编辑器插件也能直接跑：先 <code class="px-1 bg-muted rounded text-sm">npm i -D prettier</code> 安装依赖，
          再执行 <code class="px-1 bg-muted rounded text-sm">npx prettier --write .</code>，Prettier 会按当前配置格式化项目里所有支持的文件，
          并遵守 .prettierignore 与 .gitignore。只想检查不改文件，用 <code class="px-1 bg-muted rounded text-sm">npx prettier --check .</code>
          （CI 里常用，存在不合规文件时以非零退出码失败）。VS Code 用户再装 Prettier 官方扩展并开启「保存时格式化」，日常体验最顺。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">prettier 和 eslint 会不会冲突？</h3>
            <p class="text-sm text-muted-foreground mt-1">会有一小部分格式规则重叠。安装 eslint-config-prettier 并放到 ESLint 配置数组最后一项，关闭全部冲突规则即可；之后格式化交给 Prettier，ESLint 只管代码质量。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">.prettierrc 支持哪些文件名？</h3>
            <p class="text-sm text-muted-foreground mt-1">常见的有 .prettierrc（JSON/JSON5）、.prettierrc.json、.prettierrc.yaml / .prettierrc.yml、.prettierrc.toml、prettier.config.js / .mjs / .cjs，以及 package.json 的 "prettier" 字段。放项目根目录，选一种即可。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">trailingComma 应该选 all 还是 es5？</h3>
            <p class="text-sm text-muted-foreground mt-1">Prettier 3 默认 all（函数参数也补尾逗号），Prettier 2 默认 es5（仅对象、数组等 ES5 结构）。新项目跟随默认 all；需要兼容不支持尾逗号参数的老运行时再选 es5。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">Windows 上 endOfLine 报错怎么解决？</h3>
            <p class="text-sm text-muted-foreground mt-1">通常是 Git 的 core.autocrlf 把检出文件改成 CRLF，而 Prettier 默认 lf 导致。在仓库加 .gitattributes（* text=auto eol=lf）统一行尾，或把 endOfLine 设为 auto 保持各文件原样。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'prettier-config-generator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Wand2, Copy, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, FileCode
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'Prettier 配置生成器 - 在线生成 .prettierrc 配置文件 | 有条工具',
  description: '在线 Prettier 配置生成器：可视化调整 printWidth、tabWidth、semi、singleQuote、trailingComma、endOfLine 等 13 项官方选项（默认值=官方默认），一键生成 .prettierrc、.prettierrc.yaml 或 package.json 内嵌片段，支持精简（只含非默认项）与完整两种模式，附安装命令、.prettierignore 与 ESLint 协作提示，纯本地生成',
  keywords: 'prettier 配置,prettierrc 生成,代码格式化,printWidth,prettier 默认配置',
  author: '有条工具',
  ogTitle: 'Prettier 配置生成器 - 在线生成 .prettierrc 配置文件 | 有条工具',
  ogDescription: '可视化调整 13 项官方选项，一键生成 .prettierrc / YAML / package.json 三种格式配置，精简与完整模式一键切换。',
  ogUrl: 'https://www.util.cn/tools/prettier-config-generator',
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
          name: 'Prettier 配置生成器',
          url: 'https://www.util.cn/tools/prettier-config-generator',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['13 项 Prettier 官方选项可视化调整', '生成 .prettierrc / .prettierrc.yaml / package.json 片段', '精简与完整两种输出模式', '官方默认与团队风格预设一键填充', 'npm 安装与 npx --write 格式化命令', '.prettierignore 与 ESLint 协作提示', '纯本地生成不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'Prettier 配置生成器', item: 'https://www.util.cn/tools/prettier-config-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'prettier 和 eslint 会不会冲突？',
              acceptedAnswer: { '@type': 'Answer', text: '会有一小部分格式规则重叠。安装 eslint-config-prettier 并放到 ESLint 配置数组最后一项，关闭全部冲突规则即可；之后格式化交给 Prettier，ESLint 只管代码质量。' }
            },
            {
              '@type': 'Question',
              name: '.prettierrc 支持哪些文件名？',
              acceptedAnswer: { '@type': 'Answer', text: '常见的有 .prettierrc（JSON/JSON5）、.prettierrc.json、.prettierrc.yaml/.yml、.prettierrc.toml、prettier.config.js/.mjs/.cjs，以及 package.json 的 "prettier" 字段。放项目根目录，选一种即可。' }
            },
            {
              '@type': 'Question',
              name: 'trailingComma 应该选 all 还是 es5？',
              acceptedAnswer: { '@type': 'Answer', text: 'Prettier 3 默认 all（函数参数也补尾逗号），Prettier 2 默认 es5（仅对象、数组等 ES5 结构）。新项目跟随默认 all；需要兼容不支持尾逗号参数的老运行时再选 es5。' }
            },
            {
              '@type': 'Question',
              name: 'Windows 上 endOfLine 报错怎么解决？',
              acceptedAnswer: { '@type': 'Answer', text: '通常是 Git 的 core.autocrlf 把检出文件改成 CRLF，而 Prettier 默认 lf 导致。在仓库加 .gitattributes（* text=auto eol=lf）统一行尾，或把 endOfLine 设为 auto 保持各文件原样。' }
            }
          ]
        }
      ]
    })
  }]
})

onMounted(() => {
  addRecentTool('prettier-config-generator')
})

// ---------- 纯逻辑（可独立单测） ----------
// 注：jsxBracket（单参组件的箭头函数括号）选项已在 Prettier 2.0 移除（行为并入 arrowParens），故不提供。
// 选项键的固定输出顺序（与官方文档顺序一致）
const OPTION_ORDER = [
  'printWidth', 'tabWidth', 'useTabs', 'semi', 'singleQuote', 'quoteProps',
  'trailingComma', 'bracketSpacing', 'bracketSameLine', 'arrowParens',
  'proseWrap', 'endOfLine', 'htmlWhitespaceSensitivity'
]

// Prettier 3 官方默认值
const PRETTIER_DEFAULTS = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  quoteProps: 'as-needed',
  trailingComma: 'all',       // Prettier 3 默认 all；Prettier 2 默认 es5
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  proseWrap: 'preserve',
  endOfLine: 'lf',            // Windows Git autocrlf 用户注意 CRLF 坑
  htmlWhitespaceSensitivity: 'css'
}

// 预设：在官方默认基础上覆写
const PRESETS = [
  { key: 'official', label: 'Prettier 官方默认', values: {} },
  { key: 'team', label: '常见前端团队（100 列 · 双引号 · 带分号）', values: { printWidth: 100, semi: true, singleQuote: false } },
  { key: 'no-semi', label: '无分号风格（100 列 · 单引号 · avoid）', values: { printWidth: 100, semi: false, singleQuote: true, arrowParens: 'avoid' } }
]

// 与官方默认不同的键对象（精简配置口径；全默认 → {}）
function diffFromDefaultsOf(o) {
  const out = {}
  for (const k of OPTION_ORDER) {
    if (o[k] !== PRETTIER_DEFAULTS[k]) out[k] = o[k]
  }
  return out
}

// 按固定顺序取全部键对象（完整配置口径）
function fullConfigOf(o) {
  const out = {}
  for (const k of OPTION_ORDER) out[k] = o[k]
  return out
}

// JSON 格式（.prettierrc / .prettierrc.json）
function buildJsonOf(conf) {
  return JSON.stringify(conf, null, 2) + '\n'
}

// YAML 格式（.prettierrc.yaml）；本工具全部值为安全的 YAML 纯量，可裸写
function buildYamlOf(conf) {
  const keys = OPTION_ORDER.filter((k) => k in conf)
  if (!keys.length) return '{}\n'
  return keys.map((k) => `${k}: ${conf[k]}`).join('\n') + '\n'
}

// package.json 内嵌片段（"prettier": {...}）
function buildPackageSnippetOf(conf) {
  const body = JSON.stringify(conf, null, 2)
  if (body === '{}') return '"prettier": {}\n'
  return '"prettier": ' + body.split('\n').map((l, i) => (i === 0 ? l : '  ' + l)).join('\n') + '\n'
}

// 三格式统一入口；mode: 'minimal'（只含非默认项）| 'full'（显式全部键）
function buildPrettierRc(o, { mode = 'minimal' } = {}) {
  const conf = mode === 'full' ? fullConfigOf(o) : diffFromDefaultsOf(o)
  return { json: buildJsonOf(conf), yaml: buildYamlOf(conf), pkg: buildPackageSnippetOf(conf) }
}

// 安装与格式化命令；hasPrettierDep=true 时跳过安装行
function buildInstallCmd(hasPrettierDep) {
  const cmds = []
  if (!hasPrettierDep) cmds.push('npm i -D prettier')
  cmds.push('npx prettier --write .')
  return cmds
}

// 标准 .prettierignore 片段
function buildIgnoreOf() {
  return '# 构建产物与锁文件不参与格式化\ndist/\nnode_modules/\npnpm-lock.yaml\n'
}
// ---------- 纯逻辑结束 ----------

// ---------- 预设与 UI 状态 ----------
const presetKey = ref('official')
const opts = ref({ ...PRETTIER_DEFAULTS })
const mode = ref('minimal')
const activeTab = ref('json')
const hasPrettierDep = ref(false)
const ignoreOpen = ref(true)
const seoContentVisible = ref(true)
const ignoreContent = buildIgnoreOf()

const OUTPUT_TABS = [
  { key: 'json', name: '.prettierrc', hint: '保存为项目根目录的 .prettierrc（或 .prettierrc.json）' },
  { key: 'yaml', name: '.prettierrc.yaml', hint: '保存为 .prettierrc.yaml（.prettierrc.yml 等价）' },
  { key: 'pkg', name: 'package.json', hint: '粘进 package.json 顶层；后面还有字段时记得补逗号' }
]

const diffKeys = computed(() => Object.keys(diffFromDefaultsOf(opts.value)))

const configOutput = computed(() => buildPrettierRc(opts.value, { mode: mode.value }))
const activeContent = computed(() => configOutput.value[activeTab.value])
const activeTabMeta = computed(() => OUTPUT_TABS.find((t) => t.key === activeTab.value) || OUTPUT_TABS[0])
const installCmds = computed(() => buildInstallCmd(hasPrettierDep.value))

const diffStatusText = computed(() => {
  if (!diffKeys.value.length) {
    return '当前所有选项均为 Prettier 官方默认值：精简模式将输出空对象 {}，完整模式会显式列出全部默认键。'
  }
  return `有 ${diffKeys.value.length} 项与官方默认不同：${diffKeys.value.join('、')}；精简模式只输出这些键，完整模式输出全部 13 项。`
})

const modeNote = computed(() => {
  if (mode.value === 'full') {
    return '完整模式显式写出全部 13 个键：不查文档也能看到所有生效值，适合作为团队规范存档或交接文档。'
  }
  if (!diffKeys.value.length) {
    return '当前全部为官方默认值，精简模式输出 {}——空对象也是合法配置，Prettier 会按默认值运行。'
  }
  return `精简模式只写入与官方默认不同的 ${diffKeys.value.length} 项：配置更短，升级 Prettier 后不会被旧默认值拖累。`
})

function applyPreset() {
  const p = PRESETS.find((x) => x.key === presetKey.value) || PRESETS[0]
  opts.value = { ...PRETTIER_DEFAULTS, ...p.values }
}

function resetToDefaults() {
  presetKey.value = 'official'
  opts.value = { ...PRETTIER_DEFAULTS }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  } catch (e) {
    // 剪贴板不可用时静默失败
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
</script>
