<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileCode class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">JSON 转 Go Struct</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴 JSON 自动生成 Golang 结构体定义，支持 int64/float64 拆分、time.Time 时间识别、json tag 与嵌套内联/命名 struct</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 JSON 转 Go Struct 工具：把一段 JSON 示例数据反推为可直接编译的 Go 结构体代码。自动完成字段命名（snake_case/camelCase/kebab-case → PascalCase，ID/URL/API/HTTP 等缩写保持大写）、
        类型推断（整数 → int64、小数 → float64、时间形状字符串 → time.Time、null 与混合数组 → interface{}）、嵌套对象展开（内联匿名 struct 或独立命名类型）与数组内对象字段并集合并，
        输出按 gofmt 习惯做列对齐。全部解析与生成在浏览器本地完成，JSON 数据不上传，适合为 API 响应快速建模。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左列：JSON 输入 + 生成设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Braces class="w-5 h-5 mr-2 text-primary" /> JSON 输入
        </h2>

        <textarea
          v-model="jsonInput"
          class="w-full min-h-[280px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-y font-mono text-sm"
          placeholder='在此粘贴 JSON 数据，例如 {"user_name": "张三", "age": 28}'
          spellcheck="false"
        ></textarea>

        <p
          v-if="generateResult.state === 'ok'"
          class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-foreground flex items-start gap-1.5"
        >
          <CheckCircle class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
          <span>JSON 校验通过（根类型：{{ generateResult.rootKind }}），Go 结构体已实时生成。</span>
        </p>
        <p
          v-else-if="generateResult.state === 'error'"
          class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-foreground flex items-start gap-1.5"
        >
          <TriangleAlert class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          <span>{{ inputErrorText }}</span>
        </p>

        <div class="flex flex-wrap gap-2">
          <button
            @click="loadSample"
            class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition"
          >
            <Play class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 载入示例
          </button>
          <button
            @click="formatInput"
            class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition"
          >
            <Braces class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 格式化输入
          </button>
          <button
            @click="resetAll"
            class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition"
          >
            <RefreshCw class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 重置
          </button>
        </div>

        <!-- 生成设置 -->
        <div class="border-t border-border pt-4 space-y-3">
          <h3 class="text-sm font-semibold text-foreground">生成设置</h3>

          <div>
            <label for="go-package-name" class="text-sm font-medium text-foreground">包名</label>
            <input
              id="go-package-name"
              type="text"
              v-model="packageName"
              class="mt-1 w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
              placeholder="main（留空则不输出 package 行）"
            />
          </div>

          <label class="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" v-model="addTag" class="mt-0.5 rounded" />
            <span>
              <span class="text-sm font-medium text-foreground">添加 json tag</span>
              <span class="block text-xs text-muted-foreground">生成 `json:"原始key"` 标签，key 原样保留，encoding/json 依赖它做字段映射</span>
            </span>
          </label>

          <label class="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" v-model="exported" class="mt-0.5 rounded" />
            <span>
              <span class="text-sm font-medium text-foreground">字段导出命名（PascalCase）</span>
              <span class="block text-xs text-muted-foreground">关闭后字段首字母小写；注意 encoding/json 默认不解析未导出字段</span>
            </span>
          </label>

          <label class="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" v-model="inlineStruct" class="mt-0.5 rounded" />
            <span>
              <span class="text-sm font-medium text-foreground">嵌套对象内联 struct</span>
              <span class="block text-xs text-muted-foreground">关闭后为嵌套对象生成独立命名类型（父字段名 PascalCase + Struct）</span>
            </span>
          </label>

          <label class="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" v-model="smartTime" class="mt-0.5 rounded" />
            <span>
              <span class="text-sm font-medium text-foreground">时间字段识别为 time.Time</span>
              <span class="block text-xs text-muted-foreground">字符串命中 ISO8601（可带毫秒/时区）、「2024-01-15 10:30:00」「2024-01-15」形状即视为时间</span>
            </span>
          </label>
        </div>
      </div>

      <!-- 右列：Go 代码预览（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <FileCode class="w-5 h-5 mr-2 text-primary" /> Go 代码预览（只读）
          </h2>
          <button
            @click="copyCode"
            :disabled="!generatedCode"
            class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 复制 Go 代码
          </button>
        </div>

        <pre
          v-if="generatedCode"
          class="w-full max-h-[560px] overflow-auto p-4 bg-muted border border-border rounded-lg font-mono text-sm whitespace-pre"
          style="tab-size: 4"
        >{{ generatedCode }}</pre>
        <div
          v-else
          class="w-full min-h-[280px] rounded-lg border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center text-center p-8"
        >
          <Braces class="w-10 h-10 text-primary/30 mb-2" />
          <p class="text-sm font-medium text-muted-foreground">在左侧粘贴 JSON，Go 结构体会在这里实时生成</p>
          <p class="text-xs text-muted-foreground/70 mt-1">支持嵌套对象、数组、混合类型；全部解析在浏览器本地完成，数据不上传</p>
        </div>

        <!-- 统计条 -->
        <div v-if="generateResult.state === 'ok'" class="grid grid-cols-3 gap-3 text-center">
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">顶层字段数</p>
            <p class="text-xl font-bold text-foreground">{{ statTopFields }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">嵌套 struct 数</p>
            <p class="text-xl font-bold text-foreground">{{ statNestedStructs }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">生成行数</p>
            <p class="text-xl font-bold text-foreground">{{ statLineCount }}</p>
          </div>
        </div>

        <!-- 类型推断说明卡（静态口径） -->
        <div class="bg-muted/40 border border-border rounded-lg p-4">
          <h3 class="text-sm font-semibold text-foreground flex items-center mb-2">
            <Info class="w-4 h-4 mr-1.5 text-primary" /> 类型推断口径
          </h3>
          <ul class="text-xs text-muted-foreground leading-relaxed space-y-1.5 list-disc list-inside">
            <li><span class="text-foreground font-medium">数字：</span>整数 → int64，带小数或指数 → float64（JSON 数字不区分整型宽度，统一按这两档承载）。</li>
            <li><span class="text-foreground font-medium">时间识别：</span>字符串形状命中 2024-01-15T10:30:00Z（ISO8601，可带毫秒与 Z / ±hh:mm 偏移）、2024-01-15 10:30:00、2024-01-15 之一 → time.Time；仅按形状识别，不校验真实日历。填写包名时自动补 import "time"（片段模式不输出 import）。</li>
            <li><span class="text-foreground font-medium">数组：</span>元素类型一致 → []T；int64/float64 混合 → []float64（数字家族归并）；其余混合（如 string+number）与空数组 → []interface{}。</li>
            <li><span class="text-foreground font-medium">数组内对象：</span>全部对象元素按字段并集合并（保留首次出现顺序），仅生成一次类型；同字段基础类别冲突时回退 interface{}，混入的 null / 标量元素忽略。</li>
            <li><span class="text-foreground font-medium">命名：</span>snake/camel/kebab key → PascalCase，ID/URL/API/HTTP 等缩写保持大写；非法字符当作分隔符过滤；同块内撞名自动加序号。</li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>JSON 转 Go Struct 是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          JSON 转 Go Struct 是一款在线 Golang 结构体生成工具。它把一段 JSON 示例数据反推为 Go 的 struct 类型定义：自动完成字段命名（snake_case/camelCase/kebab-case → PascalCase，ID/URL/API/HTTP 等缩写保持大写）、
          类型推断（整数 → int64、小数 → float64、时间形状字符串 → time.Time、null 与混合数组 → interface{}）、嵌套对象展开（内联匿名 struct 或独立命名类型）与数组内对象字段并集合并，
          并按需生成 `json:"key"` 标签。输出按 gofmt 习惯做 tab 缩进与列对齐，可直接粘贴进项目编译。全部推断在浏览器本地完成，JSON 数据不离开你的设备。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">json tag 是什么？必须加吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">tag 是写在结构体字段后面的元信息字符串。encoding/json 在 Unmarshal 时默认按「字段名大小写不敏感匹配」寻找 JSON key，加上 `json:"user_name"` 可以把 user_name 这样的下划线 key 精确映射到 UserName 字段，也能用 `json:"-"` 显式跳过字段。当 JSON key 与 Go 字段名完全一致时 tag 可以省略；但 key 含下划线、连字符或与字段名差异较大时，tag 基本是必须的。本工具默认开启并原样保留 key。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">嵌套 struct 内联和命名怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1">内联匿名 struct 把子对象类型直接写在字段上，整段代码自包含、层次一目了然，适合一次性解析的 API 响应；缺点是同结构无法复用，嵌套深了可读性下降。独立命名类型（本工具按「父字段名 PascalCase + Struct」命名，如 profile → ProfileStruct）可跨函数复用、单独定义方法，适合长期维护的数据模型。拿不准时先用内联，结构稳定后再抽成命名类型。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">时间字段为什么要 time.Time？</h3>
            <p class="text-sm text-muted-foreground mt-1">用 string 承接时间只是「能跑」，后续比较、格式化、算时间差都要再 parse 一遍；time.Time 让 encoding/json 与数据库驱动按 RFC3339 直接解析，空值判断、时区处理都有现成方法。本工具按形状识别：ISO8601（如 2024-01-15T10:30:00Z，可带毫秒与时区偏移）、2024-01-15 10:30:00、纯日期 2024-01-15 三种字符串会推断为 time.Time；识别只看形状不校验真实日历，误判时可随时关闭该开关。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">数组里多个对象的字段不一致怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">本工具采用「字段并集」策略：把数组内全部对象的字段按首次出现顺序合并成同一个 struct，只生成一次类型；同一字段在不同元素里基础类型冲突（比如一边是数字一边是字符串）时回退为 interface{}；数组中混入的 null 或标量元素会被忽略。相比只看首元素的策略，并集能避免漏字段导致的静默丢数据。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">什么时候会出现 interface{}？它的代价是什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">值为 null 的字段、类型冲突的合并字段、空数组与无法归并的混合数组都会推断为 interface{}（即 any）。代价是丢失静态类型：读写时需要类型断言，类型拼错只能到运行时才发现，IDE 补全与重构也帮不上忙。生成后建议人工过一遍 interface{} 字段，换回具体类型或指针类型（如 *string 表达可空）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">生成的 Go 代码怎么用？</h3>
            <p class="text-sm text-muted-foreground mt-1">复制代码保存为 .go 文件（包名与项目保持一致），定义变量后用 json.Unmarshal 解析即可：var u Root; if err := json.Unmarshal(data, &amp;u); err != nil { log.Fatal(err) }，之后就能以 u.UserName 这样的类型安全方式访问字段；字段名、tag 或类型不合口味时直接在生成结果上修改即可。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'json-to-go-struct'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileCode, Copy, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Braces
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'JSON 转 Go Struct - 在线 Golang 结构体生成工具',
  description: '免费在线 JSON 转 Go Struct 工具：粘贴 JSON 自动生成 Golang 结构体定义，支持 int64/float64 数字拆分、time.Time 时间字段智能识别、json tag 生成、嵌套内联或命名 struct、数组对象字段并集合并，gofmt 风格列对齐，纯浏览器本地运行不上传',
  keywords: 'json 转 go struct,golang 结构体生成,json to go,go 代码生成',
  author: '有条工具',
  ogTitle: 'JSON 转 Go Struct - 在线 Golang 结构体生成工具 | 有条工具',
  ogDescription: '粘贴 JSON 自动生成 Go 结构体：int64/float64 拆分、time.Time 时间识别、json tag、内联/命名 struct，本地运行不上传。',
  ogUrl: 'https://www.util.cn/tools/json-to-go-struct',
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
          name: 'JSON 转 Go Struct',
          url: 'https://www.util.cn/tools/json-to-go-struct',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['JSON 一键生成 Go struct', 'int64/float64 数字拆分', 'time.Time 时间字段智能识别', 'snake/camel/kebab → PascalCase 字段命名', '嵌套内联或命名 struct 两种模式', 'json tag 自动生成', '数组对象字段并集合并', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'JSON 转 Go Struct', item: 'https://www.util.cn/tools/json-to-go-struct/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'json tag 是什么？必须加吗？',
              acceptedAnswer: { '@type': 'Answer', text: 'tag 是结构体字段后的元信息字符串。encoding/json 默认按字段名大小写不敏感匹配 JSON key，加 `json:"user_name"` 可把下划线 key 精确映射到 UserName 字段。key 与字段名完全一致时 tag 可省略；key 含下划线、连字符或差异较大时基本必须。本工具默认开启并原样保留 key。' }
            },
            {
              '@type': 'Question',
              name: '嵌套 struct 内联和命名怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '内联匿名 struct 自包含、层次清晰，适合一次性解析的 API 响应；独立命名类型（父字段名+Struct）可复用、可定义方法，适合长期维护的模型。拿不准时先用内联，结构稳定后再抽成命名类型。' }
            },
            {
              '@type': 'Question',
              name: '时间字段为什么要 time.Time？',
              acceptedAnswer: { '@type': 'Answer', text: 'time.Time 让 encoding/json 与数据库驱动按 RFC3339 直接解析，比较、格式化、时区处理都有现成方法。本工具按形状识别 ISO8601（可带毫秒/时区）、2024-01-15 10:30:00、2024-01-15 三种字符串，仅看形状不校验真实日历，可随时关闭。' }
            },
            {
              '@type': 'Question',
              name: '数组里多个对象的字段不一致怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '采用字段并集策略：数组内全部对象的字段按首次出现顺序合并成同一个 struct，只生成一次类型；同字段基础类型冲突时回退 interface{}；混入的 null 或标量元素忽略。比只看首元素更不易漏字段。' }
            },
            {
              '@type': 'Question',
              name: '什么时候会出现 interface{}？它的代价是什么？',
              acceptedAnswer: { '@type': 'Answer', text: 'null 字段、类型冲突的合并字段、空数组与无法归并的混合数组都会推断为 interface{}（any）。代价是丢失静态类型，读写需类型断言，拼错类型只能运行时发现；建议生成后人工替换为具体类型或指针类型。' }
            },
            {
              '@type': 'Question',
              name: '生成的 Go 代码怎么用？',
              acceptedAnswer: { '@type': 'Answer', text: '保存为 .go 文件（包名与项目一致）后用 json.Unmarshal 解析：var u Root; if err := json.Unmarshal(data, &u); err != nil { log.Fatal(err) }，之后即可以类型安全方式访问字段。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// JSON → Go Struct 的核心口径（与页面「类型推断口径」卡片保持一致）：
// 1) 数字：整数 → int64，带小数/指数 → float64（JSON 数字不分宽度，统一两档承载）
// 2) 字符串：smartTime 开启且形状命中时间正则 → time.Time，否则 string
// 3) 数组：元素类型一致 → []T；int64/float64 混合 → []float64；其余混合/空数组 → []interface{}
// 4) null → interface{}
// 5) 对象：递归生成 struct（内联匿名或独立命名类型）；数组内对象按字段并集合并，仅生成一次类型

/** Go 常用缩写表：字段名中命中的词保持全大写（id/ID → ID，url → URL，http_code → HTTPCode） */
const GO_ACRONYMS = new Set(['id', 'url', 'api', 'http', 'https', 'json', 'xml', 'sql', 'uuid', 'ip'])

/** 时间形状正则（仅按形状识别，不校验真实日历，避免依赖宿主 Date 实现差异） */
const TIME_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,                                                           // 2024-01-15（Go 布局 2006-01-02）
  /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:?\d{2})?$/ // ISO8601 / 空格分隔日期时间
]

// 时间字段智能识别：命中上述任一形状（长度 >= 10 排除短串误判）
function isTimeLike(s) {
  return typeof s === 'string' && s.length >= 10 && TIME_PATTERNS.some((re) => re.test(s))
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

// 类型冲突哨兵：数组内对象合并时，同字段在不同元素的基础类别不一致则打标，生成时映射为 interface{}
// （Symbol 键无法由 JSON.parse 产出，不会与用户数据撞车）
const CONFLICT_MARK = Symbol('go-type-conflict')
const CONFLICT = Object.freeze({ [CONFLICT_MARK]: true })
function isConflict(v) {
  return isPlainObject(v) && v[CONFLICT_MARK] === true
}

// JSON key 切词：camelCase 按大小写边界拆分，非法字符一律视为分隔符
// 例：'HTTPCode' → ['HTTP','Code']，'userID' → ['user','ID']，'user_name' → ['user','name']
function splitKeyWords(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')     // 小写→大写边界：userName → user Name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')  // 连续大写收尾边界：HTTPCode → HTTP Code
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
}

// JSON key → Go 导出字段名（PascalCase）。
// 实现口径：切词后命中缩写表的词保持全大写；其余词仅首字母大写、保留内部大小写；
// 全部字符非法（如纯中文）回退 'Field'；数字开头补前缀 'F'。
// 例：user_name→UserName，HTTPCode→HTTPCode，user_id→UserID，$amount→Amount，123abc→F123abc
function fieldNameOf(key) {
  const words = splitKeyWords(key)
  if (!words.length) return 'Field'
  let name = words
    .map((w) => (GO_ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join('')
  if (/^[0-9]/.test(name)) name = 'F' + name
  return name
}

// 导出 → 非导出字段名：前导大写串整体转小写（UserName→userName、ID→id、HTTPCode→httpCode）
// 简化口径：APIURL → apiurl（不做混合大小写）；非导出字段默认无法被 encoding/json 解析
function unexportName(name) {
  const m = name.match(/^[A-Z]+(?=[A-Z][a-z])/) || name.match(/^[A-Z]+/)
  if (!m) return name
  return m[0].toLowerCase() + name.slice(m[0].length)
}

// 同一 struct 内字段重名去重：重名者追加序号 2、3…（首次出现不加后缀）
// 触发场景：非法字符过滤后撞名（如 'user-name' 与 'user.name' 都映射为 UserName）
function dedupeFieldNames(jsonKeys) {
  const seen = new Map()
  return jsonKeys.map((key) => {
    const base = fieldNameOf(key)
    const n = (seen.get(base) || 0) + 1
    seen.set(base, n)
    return { key, name: n === 1 ? base : base + n }
  })
}

// 单值 → Go 类型文本。opts：{ smartTime, resolveObject }
// 对象默认兜底 map[string]interface{}；生成器可通过 resolveObject 注入内联/命名类型文本
function goTypeOf(value, opts = {}) {
  if (value === null) return 'interface{}'
  const t = typeof value
  if (t === 'number') return Number.isInteger(value) ? 'int64' : 'float64'
  if (t === 'boolean') return 'bool'
  if (t === 'string') return opts.smartTime !== false && isTimeLike(value) ? 'time.Time' : 'string'
  if (Array.isArray(value)) return arrayTypeOf(value, opts)
  if (t === 'object') {
    return typeof opts.resolveObject === 'function' ? opts.resolveObject(value) : 'map[string]interface{}'
  }
  return 'interface{}'
}

// 数组元素类型归并口径：元素类型文本一致 → []T；全部为数字 → []float64（数字家族归并）；
// 其余混合（如 string+number）与空数组 → []interface{}
function arrayTypeOf(arr, opts) {
  if (!arr.length) return '[]interface{}'
  const uniq = [...new Set(arr.map((v) => goTypeOf(v, opts)))]
  if (uniq.length === 1) return '[]' + uniq[0]
  if (arr.every((v) => typeof v === 'number' && Number.isFinite(v))) return '[]float64'
  return '[]interface{}'
}

// 把字段值并入代表值（口径）：
// - null 不参与合并（无信息量）；已是冲突哨兵则维持
// - 无代表 → 直接采用；基础类别（number/string/boolean/array/object）不同 → 冲突哨兵
// - 双方均为普通对象 → 逐字段递归合并进代表对象
// - 双方均为数组且元素全为对象 → 拼接元素（延迟到生成时按同一口径合并）；否则保留代表值
function mergeInto(cur, incoming) {
  if (incoming === null || isConflict(cur)) return cur
  if (cur === undefined) return incoming
  const cat = (v) => (Array.isArray(v) ? 'array' : typeof v === 'object' ? 'object' : typeof v)
  if (cat(cur) !== cat(incoming)) return CONFLICT
  if (cat(cur) === 'object') {
    for (const k of Object.keys(incoming)) cur[k] = mergeInto(cur[k], incoming[k])
    return cur
  }
  if (cat(cur) === 'array') {
    const all = [...cur, ...incoming]
    return all.every(isPlainObject) ? all : cur
  }
  return cur
}

// 数组内对象合并为「虚拟代表对象」：字段取全部对象元素的并集（首次出现顺序），
// 类型冲突字段以哨兵标记（生成时映射 interface{}）；非对象元素忽略
function mergeObjArray(arr) {
  const merged = {}
  for (const el of arr) {
    if (!isPlainObject(el)) continue
    for (const k of Object.keys(el)) merged[k] = mergeInto(merged[k], el[k])
  }
  return merged
}

// struct 体：返回对齐后的字段行（已含绝对缩进）与字段数。
// 列对齐口径（模拟 gofmt）：块内字段名列、单行类型列分别按最宽值补空格；
// 多行类型（内联 struct）的 json tag 挂在收尾 '}' 之后。
function structBlock(obj, ctx, indentLevel) {
  const { o } = ctx
  const entries = Object.entries(obj)
  if (!entries.length) return { lines: [], fieldCount: 0 }
  const deduped = dedupeFieldNames(entries.map((e) => e[0]))
  const desc = deduped.map(({ key, name }, i) => {
    const displayName = o.exported ? name : unexportName(name)
    const typeText = fieldTypeName(entries[i][1], ctx, key, indentLevel)
    return { key, name: displayName, typeLines: typeText.split('\n') }
  })
  const indent = indentUnit(indentLevel)
  const nameW = Math.max(...desc.map((d) => d.name.length))
  const typeW = Math.max(...desc.map((d) => d.typeLines[0].length))
  const lines = desc.map((d) => {
    const single = d.typeLines.length === 1
    let head = indent + d.name.padEnd(nameW) + ' ' + (single ? d.typeLines[0].padEnd(typeW) : d.typeLines[0])
    const rest = d.typeLines.slice(1)
    if (!rest.length) {
      if (o.addTag) head += ' `json:"' + d.key + '"`'
      return head.replace(/\s+$/, '')
    }
    const last = rest.length - 1
    if (o.addTag) rest[last] += ' `json:"' + d.key + '"`'
    return [head.replace(/\s+$/, ''), ...rest].join('\n')
  })
  return { lines, fieldCount: desc.length }
}

// 对象 → 作为字段类型的 struct 文本：
// - 内联模式：'struct {...}'（首行 'struct {'，字段行缩进 fieldIndent+1，闭括号缩进 fieldIndent）
// - 命名模式：注册独立 'type XxxStruct struct {...}'（父字段名 PascalCase + Struct，重名追加序号）并返回类型名
function structTypeText(obj, ctx, namingKey, fieldIndent) {
  const { o } = ctx
  if (o.inlineStruct) {
    const body = structBlock(obj, ctx, fieldIndent + 1)
    return body.lines.length
      ? 'struct {\n' + body.lines.join('\n') + '\n' + indentUnit(fieldIndent) + '}'
      : 'struct {}'
  }
  const base = fieldNameOf(namingKey) + 'Struct'
  let typeName = base
  let n = 2
  while (ctx.usedTypeNames.has(typeName)) typeName = base + n++
  ctx.usedTypeNames.add(typeName)
  const slot = ctx.namedTypes.push(null) - 1 // 先占位：保证父类型声明先于子类型出现
  const body = structBlock(obj, ctx, 1)
  ctx.namedTypes[slot] = body.lines.length
    ? 'type ' + typeName + ' struct {\n' + body.lines.join('\n') + '\n}'
    : 'type ' + typeName + ' struct {}'
  return typeName
}

// 标量/标量数组的类型文本；命中 time.Time 时在 ctx 记账，供顶层补 import "time"
function scalarGoType(value, ctx) {
  const t = goTypeOf(value, { smartTime: ctx.o.smartTime })
  if (t.includes('time.Time')) ctx.usesTime = true
  return t
}

// 字段值 → 类型文本（可能多行：内联 struct），必要时注册独立命名类型
// 数组口径：直接元素含对象即按「全元素合并为一个结构」处理（字段并集，非对象元素忽略），类型只生成一次；
// 数组套数组的深层对象回退 map[string]interface{} 兜底
function fieldTypeName(value, ctx, namingKey, fieldIndent) {
  if (isConflict(value)) return 'interface{}'
  if (Array.isArray(value)) {
    if (value.some(isPlainObject)) {
      const merged = mergeObjArray(value)
      return '[]' + structTypeText(merged, ctx, namingKey, fieldIndent)
    }
    return scalarGoType(value, ctx)
  }
  if (isPlainObject(value)) return structTypeText(value, ctx, namingKey, fieldIndent)
  return scalarGoType(value, ctx)
}

// 缩进单位：gofmt 风格 tab
function indentUnit(n) {
  return '\t'.repeat(n)
}

// 顶层入口：JSON 根值 → Go 类型声明文本（string）
// opts: { packageName='main', addTag=true, exported=true, inlineStruct=true, smartTime=true }
// 口径：根为对象 → struct；根为数组/标量 → 直接 'type Root []T' / 'type Root T'；
// 包名留空则省略 package 行（片段模式，也不输出 import，需用时自行补）；
// 完整模式下生成结果含 time.Time 时自动补一行 import "time"
function generateGoStruct(jsonObj, opts = {}, name = 'Root') {
  const o = { packageName: 'main', addTag: true, exported: true, inlineStruct: true, smartTime: true, ...opts }
  const ctx = { o, namedTypes: [], usedTypeNames: new Set([name]), usesTime: false }
  let rootCode
  if (isPlainObject(jsonObj)) {
    const body = structBlock(jsonObj, ctx, 1)
    rootCode = body.lines.length
      ? 'type ' + name + ' struct {\n' + body.lines.join('\n') + '\n}'
      : 'type ' + name + ' struct {}'
  } else {
    rootCode = 'type ' + name + ' ' + fieldTypeName(jsonObj, ctx, name, 0)
  }
  const parts = []
  const pkg = String(o.packageName || '').trim()
  if (pkg) parts.push('package ' + pkg)
  if (pkg && ctx.usesTime) parts.push('import "time"')
  parts.push(rootCode)
  parts.push(...ctx.namedTypes)
  return parts.join('\n\n') + '\n'
}

// 从 JSON.parse 的错误消息中提取定位信息
// 口径：优先读取消息自带的 (line X column Y)（V8 新版 / Firefox 格式）；
// 否则解析 "at position N" 并结合原文换算行列（按 \n 计数，1 起始）；无位置信息（如 Unexpected end of JSON input）返回 null
function jsonErrorOf(message, text = '') {
  const msg = String(message || '')
  const out = { message: msg, position: null, line: null, column: null }
  const pm = msg.match(/position (\d+)/i)
  const lcm = msg.match(/line (\d+) column (\d+)/i)
  if (lcm) {
    out.line = parseInt(lcm[1], 10)
    out.column = parseInt(lcm[2], 10)
  }
  if (pm) {
    out.position = parseInt(pm[1], 10)
    if (out.line === null && typeof text === 'string' && text) {
      const lines = text.slice(0, out.position).split('\n')
      out.line = lines.length
      out.column = lines[lines.length - 1].length + 1
    }
  }
  return out
}

// ---------- 页面状态 ----------
const jsonInput = ref('')
const packageName = ref('main')
const addTag = ref(true)
const exported = ref(true)
const inlineStruct = ref(true)
const smartTime = ref(true)
const seoContentVisible = ref(true)

// 载入示例：嵌套用户对象（覆盖时间字段 / 数组 / 混合数组 / 对象数组字段并集 / null / 各类命名）
const SAMPLE_JSON = `{
  "id": 1001,
  "user_name": "张三",
  "email": "zhangsan@example.com",
  "age": 28,
  "balance": 1024.5,
  "is_vip": true,
  "tags": ["admin", "editor"],
  "profile": {
    "city": "杭州",
    "website_url": "https://example.com",
    "login_count": 42,
    "last_login_at": "2024-05-01T08:30:00Z"
  },
  "orders": [
    { "order_id": "A001", "amount": 99.9, "paid": true },
    { "order_id": "A002", "amount": 59.9, "paid": false, "coupon": "VIP10" }
  ],
  "scores": [90, 85.5, 77],
  "mixed_list": [1, 2.5, "three"],
  "remark": null,
  "created_at": "2024-01-15T10:30:00Z"
}`

// 实时生成：解析 + 结构体生成（computed 依赖输入与全部设置项，改动即重算）
const generateResult = computed(() => {
  const text = jsonInput.value
  if (!text.trim()) return { state: 'empty', code: '', error: null, topFields: 0, rootKind: '' }
  try {
    const data = JSON.parse(text)
    const code = generateGoStruct(data, {
      packageName: packageName.value,
      addTag: addTag.value,
      exported: exported.value,
      inlineStruct: inlineStruct.value,
      smartTime: smartTime.value
    })
    const rootKind = isPlainObject(data) ? '对象' : Array.isArray(data) ? '数组' : '标量'
    return {
      state: 'ok',
      code,
      error: null,
      topFields: isPlainObject(data) ? Object.keys(data).length : 0,
      rootKind
    }
  } catch (e) {
    return { state: 'error', code: '', error: jsonErrorOf(e.message, text), topFields: 0, rootKind: '' }
  }
})

const generatedCode = computed(() => generateResult.value.code)

const inputErrorText = computed(() => {
  if (generateResult.value.state !== 'error') return ''
  const err = generateResult.value.error
  const at = err.line !== null
    ? `（第 ${err.line} 行第 ${err.column} 列附近）`
    : err.position !== null ? `（位置 ${err.position} 附近）` : ''
  return `JSON 解析失败${at}：${err.message}`
})

const statTopFields = computed(() => generateResult.value.topFields)

// 嵌套 struct 数：代码中 'struct {' 出现次数减去根类型自身（内联与命名类型均含一次）
const statNestedStructs = computed(() => {
  const code = generateResult.value.code
  if (!code) return 0
  return Math.max(0, (code.match(/struct \{/g) || []).length - 1)
})

const statLineCount = computed(() => {
  const code = generateResult.value.code
  return code ? code.trimEnd().split('\n').length : 0
})

// ---------- 操作（均为回调触发，SSR 安全） ----------
function loadSample() {
  jsonInput.value = SAMPLE_JSON
}

// 格式化输入：JSON.stringify 两空格重排；解析失败时 alert 提示
function formatInput() {
  const text = jsonInput.value
  if (!text.trim()) return
  try {
    jsonInput.value = JSON.stringify(JSON.parse(text), null, 2)
  } catch (e) {
    alert('JSON 格式错误，无法格式化：' + (e && e.message ? e.message : e))
  }
}

function resetAll() {
  jsonInput.value = ''
  packageName.value = 'main'
  addTag.value = true
  exported.value = true
  inlineStruct.value = true
  smartTime.value = true
}

// 兼容非安全上下文的降级复制
function legacyCopyText(text) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch (e) {
    return false
  }
}

// 复制生成结果：成功 / 失败均以 alert 反馈（本站不使用 useNotification）
function copyCode() {
  const code = generatedCode.value
  if (!code) return
  const done = () => alert('已复制 Go 代码到剪贴板')
  const fail = () => alert('复制失败，请手动选择代码复制')
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(done, () => {
      legacyCopyText(code) ? done() : fail()
    })
  } else {
    legacyCopyText(code) ? done() : fail()
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('json-to-go-struct')
})
</script>
