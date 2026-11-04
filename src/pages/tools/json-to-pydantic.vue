<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileCode2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">JSON 转 Pydantic</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴 JSON 一键生成 Pydantic v2 BaseModel，可直接用作 FastAPI 的 request / response 模型</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 JSON 转 Pydantic 工具：自动推断 int / float / bool / str / datetime / list 等类型，嵌套对象与对象数组生成独立模型类（被依赖的子模型排在前面），
        字段名统一规范为 snake_case，开启别名后每个字段以 Field(..., alias="原始键") 对齐上游 JSON，值为 null 的字段标注 Optional 并补默认值，import 按需精简不多一行。
        全部转换在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入与设置 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Braces class="w-5 h-5 mr-2 text-primary" /> 输入 JSON
          </h2>
          <textarea
            v-model="inputText"
            class="w-full h-72 px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴 JSON 数据（顶层为对象），例如：&#10;{&#10;  &quot;userId&quot;: 9527,&#10;  &quot;userName&quot;: &quot;陈默&quot;&#10;}"
            spellcheck="false"
          ></textarea>

          <div v-if="inputErrorText" class="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <TriangleAlert class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p class="text-xs text-red-600 leading-relaxed break-all">{{ inputErrorText }}</p>
          </div>
          <p v-else-if="parsedResult.ok" class="mt-3 flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle class="w-3.5 h-3.5 flex-shrink-0" /> JSON 解析成功，右侧已生成 Pydantic 模型
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 生成设置
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">根模型名（PascalCase）</label>
            <input
              v-model="modelName"
              type="text"
              placeholder="Root"
              class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div class="space-y-3.5 pt-1">
            <div>
              <div class="flex items-center justify-between cursor-pointer">
                <span class="text-sm text-foreground">字段别名 alias</span>
                <button
                  type="button"
                  @click="optAlias = !optAlias"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                  :class="optAlias ? 'bg-primary' : 'bg-muted'"
                  aria-label="切换字段别名"
                >
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="optAlias ? 'translate-x-6' : 'translate-x-1'"></span>
                </button>
              </div>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">开启后每个字段生成 Field(..., alias="原始键")，并注入 model_config = ConfigDict(populate_by_name=True)，两种键名都能赋值</p>
            </div>

            <div>
              <div class="flex items-center justify-between cursor-pointer">
                <span class="text-sm text-foreground">Optional 标注</span>
                <button
                  type="button"
                  @click="optOptional = !optOptional"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                  :class="optOptional ? 'bg-primary' : 'bg-muted'"
                  aria-label="切换 Optional 标注"
                >
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="optOptional ? 'translate-x-6' : 'translate-x-1'"></span>
                </button>
              </div>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">值为 null 的字段标注 Optional[T] 并补默认值 None，让字段真正可选</p>
            </div>

            <div>
              <div class="flex items-center justify-between cursor-pointer">
                <span class="text-sm text-foreground">datetime 识别</span>
                <button
                  type="button"
                  @click="optDatetime = !optDatetime"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                  :class="optDatetime ? 'bg-primary' : 'bg-muted'"
                  aria-label="切换 datetime 识别"
                >
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="optDatetime ? 'translate-x-6' : 'translate-x-1'"></span>
                </button>
              </div>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">符合 ISO 8601 的字符串（含纯日期）识别为 datetime，关闭后一律按 str</p>
            </div>

            <div>
              <div class="flex items-center justify-between cursor-pointer">
                <span class="text-sm text-foreground">嵌套独立模型</span>
                <button
                  type="button"
                  @click="optNest = !optNest"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                  :class="optNest ? 'bg-primary' : 'bg-muted'"
                  aria-label="切换嵌套独立模型"
                >
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="optNest ? 'translate-x-6' : 'translate-x-1'"></span>
                </button>
              </div>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">嵌套对象与对象数组生成独立 class（被依赖的子模型在前），关闭后一律用 dict 类型</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 pt-1">
            <button
              @click="loadSample"
              class="bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1"
            >
              <Play class="w-3.5 h-3.5" /> 载入示例
            </button>
            <button
              @click="formatInput"
              class="bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1"
            >
              <Braces class="w-3.5 h-3.5" /> 格式化
            </button>
            <button
              @click="resetAll"
              class="bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1"
            >
              <RefreshCw class="w-3.5 h-3.5" /> 重置
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：输出区 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileCode2 class="w-5 h-5 mr-2 text-primary" /> Pydantic 模型代码
            </h2>
            <button
              @click="copyCode"
              :disabled="!generatedCode"
              class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle v-if="copied" class="w-3.5 h-3.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5" /> {{ copied ? '已复制' : '复制' }}
            </button>
          </div>

          <div class="px-6 pt-4">
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-lg p-2.5 text-center">
                <p class="text-lg font-bold text-foreground">{{ stats.modelCount }}</p>
                <p class="text-xs text-muted-foreground">模型类</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-2.5 text-center">
                <p class="text-lg font-bold text-foreground">{{ stats.fieldCount }}</p>
                <p class="text-xs text-muted-foreground">字段</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-2.5 text-center">
                <p class="text-lg font-bold text-foreground">{{ stats.importCount }}</p>
                <p class="text-xs text-muted-foreground">import 行</p>
              </div>
            </div>
          </div>

          <div class="p-6 pt-4">
            <pre v-if="generatedCode" class="w-full max-h-[560px] overflow-auto p-4 bg-muted/30 border border-border rounded-lg text-xs font-mono leading-relaxed text-foreground whitespace-pre">{{ generatedCode }}</pre>
            <div v-else-if="inputErrorText" class="py-14 text-center">
              <TriangleAlert class="w-10 h-10 mx-auto mb-3 text-red-500" />
              <p class="text-sm text-red-600 font-medium mb-1">JSON 解析失败</p>
              <p class="text-xs text-muted-foreground">请按左侧提示修正语法后自动重新生成</p>
            </div>
            <div v-else class="py-14 text-center">
              <Braces class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">输入 JSON 后，这里会显示生成的 Pydantic 模型代码</p>
              <p class="text-xs text-muted-foreground/70 mt-1">也可以点击左侧「载入示例」先看看效果</p>
            </div>
          </div>
        </div>

        <!-- 用法提示卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 用法提示
          </h3>
          <ul class="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <li>• <span class="text-foreground font-medium">FastAPI 即插即用</span>：把生成的类直接用作路径操作的 request / response model，请求体自动完成校验与类型转换，OpenAPI 文档也随之生成。</li>
            <li>• <span class="text-foreground font-medium">校验普通字典</span>：<code class="px-1 py-0.5 bg-muted rounded font-mono text-foreground">Root.model_validate(obj)</code>（Pydantic v2）可校验任意 dict，失败时抛出 ValidationError 并精确指出字段与原因；<code class="px-1 py-0.5 bg-muted rounded font-mono text-foreground">model_dump(by_alias=True)</code> 按原始键导出。</li>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>JSON 转 Pydantic 工具说明</h2>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Pydantic 是什么？FastAPI 为什么用它？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          Pydantic 是 Python 生态最主流的数据校验库：用类型注解声明字段，构造对象时自动完成类型转换与校验，数据不合法就抛出 ValidationError 并精确指出字段与原因。
          FastAPI 把 Pydantic 当作地基——路径操作的请求体、响应模型本质都是 Pydantic 模型，参数校验、序列化、交互式 API 文档（OpenAPI / Swagger）全部由模型定义驱动，
          所以「JSON 定义接口结构 → 生成 Pydantic 模型」是接入 FastAPI 的第一步。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">v1 和 v2 的写法差异</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          Pydantic v2 用 <code class="px-1 py-0.5 bg-muted rounded font-mono text-foreground">model_config = ConfigDict(populate_by_name=True)</code> 一行类属性，
          取代了 v1 的 <code class="px-1 py-0.5 bg-muted rounded font-mono text-foreground">class Config:</code> 内嵌类写法；校验核心也换成了 Rust 实现的 pydantic-core，速度提升数倍。
          本工具输出的是 v2 写法（BaseModel + ConfigDict + Field），如需 v1，把 ConfigDict 那行改回 class Config: 即可。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">alias 什么时候需要？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          当上游 JSON 的键不符合 Python 命名规范时——例如 camelCase（userName）、kebab-case（api-version）、含空格（retry count）或撞上关键字（class）——
          Python 侧需要一个合法的 snake_case 字段名，序列化解析则靠 alias 对齐原始键，两边互不迁就。
          配置 populate_by_name=True 后，模型初始化时传字段名或原始键都能识别。
          原始键本身已经是合法 snake_case（如 order_id）时不再生成多余别名，保持代码干净。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Optional 和默认值的坑</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed mb-2">
          <li>字段值为 null 时只能推断成 Optional[Any] = None，无法得知真实类型，建议拿到代码后手动改成 Optional[str] 等更精确的注解。</li>
          <li>Optional[T] 只是类型层面「允许 None」，Pydantic 默认仍把没有默认值的 Optional 字段当必填——所以本工具会补上 = None 或 Field(None, alias=...) 让它真正可选。</li>
          <li>数组里混入 null 时会生成 list[Union[T, None]]，等价于「元素可空」；若想整段容错，也可手动放宽为 list[Any]。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">和 dataclass 的区别</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          dataclass（标准库）只是「数据容器」：自动生成 __init__ / __repr__ 等样板代码，不做任何运行时类型校验与转换，字段类型写错不会报错；
          Pydantic 模型在构造时校验并强制转换类型，还自带 model_validate / model_dump / JSON Schema 导出等接口。
          对外要信任校验（API 输入、配置解析）选 Pydantic；纯内部、追求轻量的数据结构用 dataclass 即可——Python 3.12+ 的 dataclass 也能和 Pydantic 混用。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">生成的代码需要安装什么依赖？</h3>
            <p class="text-sm text-muted-foreground mt-1">只需要 pydantic（v2 系列，pip install pydantic），FastAPI 项目自带无需额外安装；datetime 与 typing 都是 Python 标准库。生成代码可直接粘贴进 models.py 使用。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么每个字段都带 Field(..., alias=...)？可以去掉吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">这是「字段别名 alias」开关的效果：开启后每个字段都以 Field(..., alias="原始键") 对齐上游 JSON，Python 侧保持 snake_case，两种键名经 populate_by_name 配置都能赋值。若原始键本身已是规范 snake_case 且接受直用，可关闭开关得到裸字段声明。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">JSON 数据会被上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。JSON 解析、类型推断与代码生成全部在你的浏览器本地完成，不发送任何网络请求，刷新页面后数据自动清空，可以放心粘贴生产环境接口返回值。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'json-to-pydantic'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  FileCode2, Copy, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Braces
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'JSON 转 Pydantic - 在线生成 Python Pydantic Model / FastAPI 模型',
  description: '免费在线 JSON 转 Pydantic 工具：粘贴 JSON 自动生成 Pydantic v2 BaseModel 代码，支持字段别名 alias、Optional 标注与默认值、ISO 时间识别为 datetime、嵌套对象生成独立模型类，可直接用作 FastAPI request/response 模型，纯浏览器本地运行不上传数据',
  keywords: 'json 转 pydantic,pydantic model 生成,fastapi 模型,python dataclass,json to python',
  author: '有条工具',
  ogTitle: 'JSON 转 Pydantic - 在线生成 Python Pydantic Model | 有条工具',
  ogDescription: '粘贴 JSON 一键生成 Pydantic v2 BaseModel，支持 alias、Optional、datetime 识别与嵌套独立模型，可直接用作 FastAPI 模型。',
  ogUrl: 'https://www.util.cn/tools/json-to-pydantic',
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
          name: 'JSON 转 Pydantic',
          url: 'https://www.util.cn/tools/json-to-pydantic',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['JSON 转 Pydantic v2 BaseModel', '字段别名 alias 与 populate_by_name 配置', 'Optional 标注与默认值处理', 'ISO 时间字符串识别为 datetime', '嵌套对象生成独立模型类', 'import 按需精简', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'JSON 转 Pydantic', item: 'https://www.util.cn/tools/json-to-pydantic/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '生成的代码需要安装什么依赖？',
              acceptedAnswer: { '@type': 'Answer', text: '只需要 pydantic（v2 系列，pip install pydantic），FastAPI 项目自带无需额外安装；datetime 与 typing 都是 Python 标准库，生成代码可直接粘贴进 models.py 使用。' }
            },
            {
              '@type': 'Question',
              name: '为什么每个字段都带 Field(..., alias=...)？可以去掉吗？',
              acceptedAnswer: { '@type': 'Answer', text: '这是字段别名 alias 开关的效果：开启后每个字段都以 Field(..., alias="原始键") 对齐上游 JSON，Python 侧保持 snake_case，两种键名经 populate_by_name 配置都能赋值；若原始键本身已是规范 snake_case 且接受直用，可关闭开关得到裸字段声明。' }
            },
            {
              '@type': 'Question',
              name: 'JSON 数据会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。JSON 解析、类型推断与代码生成全部在浏览器本地完成，不发送任何网络请求，刷新页面后数据自动清空。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// ISO 日期时间识别口径：年份 4 位、月/日 2 位，可带 "T 或空格 + 时:分[:秒[.微秒]]" 与时区
// （Z 或 ±HH[:MM]）；纯日期 "YYYY-MM-DD" 也按 datetime 处理（datetime.fromisoformat 兼容该格式）。
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:?\d{2})?)?$/

// Python 3 常见 35 个关键字（含 True/False/None）：字段名 / 类名冲突时追加后缀
const PY_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for',
  'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or',
  'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
])

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

// 驼峰 / 连续大写边界切分：HTTPServer → HTTP_Server、userID → user_ID（供字段名与类名共用）
function splitCaseBoundaries(s) {
  return s
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
}

// 类型推断：JSON 值 → Python 类型注解
// - bool 前置判定（Python 中 bool 是 int 的子类，混入数组 Union 时必须单列，避免被数字分支吞掉）
// - JS 整数→int、带小数→float（JSON 里的 649.0 经 JSON.parse 收敛为整数 649，按 int 输出）
// - null → 'Optional[Any]'；作为数组元素时归一为 'None'（Union[int, None] 即 Optional[int] 的元素语义）
// - 数组：元素类型唯一取 list[T]；混合取 list[Union[...]]（保持首现顺序去重的简化口径）
// - 对象：opts.resolveModel(obj) 命中 → 子模型类名；否则 'dict'（嵌套独立模型关闭时的口径）
function pyTypeOf(value, opts = {}) {
  if (value === null) return 'Optional[Any]'
  const t = typeof value
  if (t === 'boolean') return 'bool'
  if (t === 'number') return Number.isInteger(value) ? 'int' : 'float'
  if (t === 'string') {
    if (opts.datetimeIdentify && ISO_DATETIME_RE.test(value)) return 'datetime'
    return 'str'
  }
  if (Array.isArray(value)) {
    if (!value.length) return 'list[Any]'
    const elemTypes = []
    for (const el of value) {
      const et = el === null ? 'None' : pyTypeOf(el, opts)
      if (!elemTypes.includes(et)) elemTypes.push(et)
    }
    if (elemTypes.length === 1) return `list[${elemTypes[0]}]`
    return `list[Union[${elemTypes.join(', ')}]]`
  }
  if (t === 'object') {
    if (typeof opts.resolveModel === 'function') {
      const modelName = opts.resolveModel(value)
      if (modelName) return modelName
    }
    return 'dict'
  }
  return 'Any'
}

// 任意 JSON key → 合法 snake_case Python 标识符（可单测）
// camelCase→camel_case、kebab/空格等非法字符压成 _、数字开头加 field_ 前缀、
// 与 Python 关键字冲突加后缀 _（class → class_）；清洗后为空回退 'field'
function pyFieldNameOf(key) {
  let s = splitCaseBoundaries(String(key ?? '').trim())
  s = s.replace(/[^a-zA-Z0-9_]+/g, '_').replace(/_{2,}/g, '_').replace(/^_+|_+$/g, '')
  s = s.toLowerCase()
  if (!s) return 'field'
  if (/^\d/.test(s)) s = 'field_' + s
  if (PY_KEYWORDS.has(s)) s += '_'
  return s
}

// 任意 JSON key / 自定义名 → PascalCase 模型类名（可单测）
// user_profile → UserProfile、api-version → ApiVersion；数字开头加 Model 前缀、
// 撞上关键字（如 none → None）追加 Model 后缀；清洗后为空回退 'Model'
function pyClassNameOf(key) {
  let s = splitCaseBoundaries(String(key ?? '').trim())
  s = s.replace(/[^a-zA-Z0-9]+/g, '_').replace(/_{2,}/g, '_').replace(/^_+|_+$/g, '')
  const name = s.split('_').filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase()).join('')
  if (!name) return 'Model'
  if (/^\d/.test(name)) return 'Model' + name
  if (PY_KEYWORDS.has(name)) return name + 'Model'
  return name
}

// 根模型名合法化：空值回退 Root
function sanitizeRootName(name) {
  const trimmed = String(name ?? '').trim()
  return trimmed ? pyClassNameOf(trimmed) : 'Root'
}

// 数组字段类型：对象元素合并同键样本生成独立子模型（nestModels 开启时经 register 注册），
// 标量元素逐个推断；null 元素归一为 'None'；空数组 → list[Any]；
// 数组套数组等深嵌套沿用 pyTypeOf 的简化口径（元素内对象视为 dict）
function arrayTypeOf(arr, key, opts, register) {
  if (!arr.length) return 'list[Any]'
  let objModelName = null
  if (opts.nestModels) {
    const objEls = arr.filter(isPlainObject)
    if (objEls.length) {
      const merged = {}
      for (const el of objEls) {
        for (const [k, v] of Object.entries(el)) {
          if (!(k in merged) || merged[k] === null) merged[k] = v
        }
      }
      objModelName = register(merged, key)
    }
  }
  const elemTypes = []
  for (const el of arr) {
    const et = el === null ? 'None' : isPlainObject(el) ? (objModelName || 'dict') : pyTypeOf(el, opts)
    if (!elemTypes.includes(et)) elemTypes.push(et)
  }
  if (elemTypes.length === 1) return `list[${elemTypes[0]}]`
  return `list[Union[${elemTypes.join(', ')}]]`
}

// 模型收集：对根对象做后序遍历，子模型先注册入列（被依赖者在前），返回模型数组。
// 同形对象（JSON 串相同）复用同一模型；同名不同形追加序号；同模型内重名字段追加 _序号。
function collectModels(rootObj, rootName, opts) {
  const models = []
  const shapeToName = new Map()
  const usedNames = new Set()

  function registerModel(obj, suggestedKey) {
    const shape = JSON.stringify(obj)
    if (shapeToName.has(shape)) return shapeToName.get(shape)
    let name = pyClassNameOf(suggestedKey)
    let seq = 2
    while (usedNames.has(name)) name = pyClassNameOf(suggestedKey) + seq++
    usedNames.add(name)

    const usedFieldNames = new Set()
    const fields = []
    for (const [key, value] of Object.entries(obj)) {
      let pyName = pyFieldNameOf(key)
      if (usedFieldNames.has(pyName)) {
        let n = 2
        while (usedFieldNames.has(pyName + '_' + n)) n++
        pyName = pyName + '_' + n
      }
      usedFieldNames.add(pyName)

      const optional = Boolean(opts.optionalMark) && value === null
      let pyType
      if (isPlainObject(value)) {
        pyType = opts.nestModels ? registerModel(value, key) : 'dict'
      } else if (Array.isArray(value)) {
        pyType = arrayTypeOf(value, key, opts, registerModel)
      } else {
        pyType = pyTypeOf(value, opts)
      }
      fields.push({
        key,
        pyName,
        pyType,
        optional,
        alias: Boolean(opts.alias) ? key : null
      })
    }
    models.push({ name, fields })
    shapeToName.set(shape, name)
    return name
  }

  registerModel(rootObj, rootName)
  return models
}

// 代码生成主入口：jsonObj（顶层对象）+ opts { alias, optionalMark, datetimeIdentify, nestModels } + name（根模型名）
// 返回完整 Python 代码：import 按需引入；嵌套模型被依赖者在前；每字段「名称: 类型 [= 默认值/Field]」
function generatePydantic(jsonObj, opts, name) {
  const rootName = sanitizeRootName(name)
  const src = isPlainObject(jsonObj) ? jsonObj : {}
  const models = collectModels(src, rootName, opts)
  const need = { datetime: false, Optional: false, Union: false, Any: false, Field: false, ConfigDict: false }
  const typeTexts = []

  // 字段类型渲染：null 推断出的 'Optional[Any]' 在 Optional 关闭时退化为 'Any'
  function renderTypeOf(field) {
    let t = field.pyType
    if (t === 'Optional[Any]') {
      need.Any = true
      if (!field.optional) return 'Any'
      need.Optional = true
      return 'Optional[Any]'
    }
    if (field.optional) {
      need.Optional = true
      return `Optional[${t}]`
    }
    return t
  }

  const rendered = models.map((model) => {
    const hasAlias = model.fields.some((f) => f.alias)
    if (hasAlias) need.ConfigDict = true
    const lines = model.fields.map((f) => {
      const typeText = renderTypeOf(f)
      typeTexts.push(typeText)
      const ann = `    ${f.pyName}: ${typeText}`
      if (f.alias) {
        need.Field = true
        const aliasText = String(f.alias).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
        return `${ann} = Field(${f.optional ? 'None' : '...'}, alias="${aliasText}")`
      }
      if (f.optional) return `${ann} = None`
      return ann
    })
    if (hasAlias) lines.push('    model_config = ConfigDict(populate_by_name=True)')
    const body = lines.length ? lines.join('\n') : '    pass'
    return `class ${model.name}(BaseModel):\n${body}`
  })

  for (const t of typeTexts) {
    if (/\bdatetime\b/.test(t)) need.datetime = true
    if (t.includes('Union[')) need.Union = true
    if (/\bAny\b/.test(t)) need.Any = true
  }

  // import 精确性：只引入用到的符号；标准库/typing 与第三方 pydantic 之间空一行
  const typingParts = ['Any', 'Optional', 'Union'].filter((k) => need[k])
  const pydParts = ['BaseModel', need.ConfigDict ? 'ConfigDict' : null, need.Field ? 'Field' : null].filter(Boolean)
  const importLines = []
  if (need.datetime) importLines.push('from datetime import datetime')
  if (typingParts.length) importLines.push(`from typing import ${typingParts.join(', ')}`)
  if (importLines.length && pydParts.length) importLines.push('')
  if (pydParts.length) importLines.push(`from pydantic import ${pydParts.join(', ')}`)
  return importLines.join('\n') + '\n\n\n' + rendered.join('\n\n\n') + '\n'
}

// 统计条口径：模型类数 / 字段数 / import 行数（直接按生成文本统计，可单测）
function codeStats(code) {
  const text = String(code || '')
  return {
    modelCount: (text.match(/^class /gm) || []).length,
    fieldCount: (text.match(/^ {4}[A-Za-z_][A-Za-z0-9_]*:/gm) || []).length,
    importCount: (text.match(/^from \S+ import /gm) || []).length
  }
}

// JSON 校验与错误定位口径：先 JSON.parse；失败时优先读 V8 新版 "line X column Y"，
// 其次旧版 "position N"（按换行折算行/列）；两者都取不到则只报错误消息。
function validateJson(text) {
  const raw = String(text ?? '')
  if (!raw.trim()) return { empty: true, ok: false }
  try {
    const data = JSON.parse(raw)
    if (!isPlainObject(data)) {
      return { ok: false, message: '顶层必须是 JSON 对象（以 { 开头）' }
    }
    return { ok: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    let line = 0
    let col = 0
    const lc = /line (\d+)[^\d]+column (\d+)/.exec(message)
    if (lc) {
      line = Number(lc[1])
      col = Number(lc[2])
    } else {
      const pos = /position (\d+)/.exec(message)
      if (pos) {
        const p = Math.min(Number(pos[1]), raw.length)
        const before = raw.slice(0, p)
        line = before.split('\n').length
        col = p - before.lastIndexOf('\n')
      }
    }
    return { ok: false, message, line, col }
  }
}

// 格式化输入：合法 → 2 空格缩进美化；非法返回 null 由调用方提示
function formatJsonText(text) {
  try {
    return JSON.stringify(JSON.parse(String(text ?? '')), null, 2)
  } catch {
    return null
  }
}

// ---------- 示例数据（嵌套订单：驼峰键 / null / ISO 时间 / 混合数组 / 非法字符键） ----------
const SAMPLE_JSON = `{
  "orderId": "SO-20260501-0086",
  "orderStatus": "paid",
  "createdAt": "2026-05-01T10:30:00Z",
  "totalAmount": 1280.5,
  "paid": true,
  "couponCodes": ["MAY1", "VIP95"],
  "extraTags": ["new", 7, null, true],
  "customer": {
    "userId": 9527,
    "userName": "陈默",
    "vipLevel": 3,
    "isActive": true,
    "birthday": "1996-05-12",
    "remark": null
  },
  "items": [
    { "skuId": "SKU-101", "title": "机械键盘", "price": 649.5, "quantity": 1, "inStock": true },
    { "skuId": "SKU-205", "title": "键帽套装", "price": 199.5, "quantity": 2, "inStock": false }
  ],
  "shippingAddress": null,
  "extra": { "channel": "miniapp", "api-version": "v2", "retry count": 3 }
}`

// ---------- 页面状态 ----------
const inputText = ref('')
const modelName = ref('Root')
const optAlias = ref(true)
const optOptional = ref(true)
const optDatetime = ref(true)
const optNest = ref(true)
const copied = ref(false)
const seoContentVisible = ref(true)
let copyTimer = null

// ---------- 派生结果 ----------
const parsedResult = computed(() => validateJson(inputText.value))

const inputErrorText = computed(() => {
  const r = parsedResult.value
  if (r.ok || r.empty) return ''
  const where = r.line ? `（第 ${r.line} 行 第 ${r.col} 列附近）` : ''
  return `JSON 解析失败${where}：${r.message}`
})

const generatedCode = computed(() => {
  const r = parsedResult.value
  if (!r.ok) return ''
  return generatePydantic(r.data, {
    alias: optAlias.value,
    optionalMark: optOptional.value,
    datetimeIdentify: optDatetime.value,
    nestModels: optNest.value
  }, modelName.value)
})

const stats = computed(() => codeStats(generatedCode.value))

// ---------- 交互 ----------
function loadSample() {
  inputText.value = SAMPLE_JSON
}

function formatInput() {
  if (!inputText.value.trim()) {
    alert('请先粘贴 JSON 数据')
    return
  }
  const formatted = formatJsonText(inputText.value)
  if (formatted === null) {
    alert('JSON 解析失败，无法格式化，请先按左侧错误提示修正语法')
    return
  }
  inputText.value = formatted
}

function resetAll() {
  inputText.value = ''
  modelName.value = 'Root'
  optAlias.value = true
  optOptional.value = true
  optDatetime.value = true
  optNest.value = true
  copied.value = false
}

async function copyCode() {
  const code = generatedCode.value
  if (!code) return
  let ok = false
  try {
    await navigator.clipboard.writeText(code)
    ok = true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      ok = true
    } catch {
      ok = false
    }
  }
  if (ok) {
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
      copyTimer = null
    }, 2000)
    alert('Pydantic 代码已复制到剪贴板')
  } else {
    alert('复制失败，请手动选择代码复制')
  }
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

onMounted(() => {
  addRecentTool('json-to-pydantic')
})

onBeforeUnmount(() => {
  if (copyTimer) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
})
</script>
