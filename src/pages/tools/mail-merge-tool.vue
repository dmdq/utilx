<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Mail class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">批量文本生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">邮件合并式文本套版：名单 CSV + 模板 → 逐行批量生成个性化通知、提醒与邀请文案</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        名单+模板 → 批量生成个性化文本。数据全程本地处理，名单不上传。适合：家长通知、学员提醒、活动邀请、工单回复话术。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左面板：模板 + 名单 -->
      <div class="space-y-6">
        <!-- 模板输入 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Mail class="w-5 h-5 mr-2 text-primary" /> 通知模板
          </h2>
          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>用双花括号包字段名，字段名须与表头一致，例如 <code v-pre>{{姓名}}</code>；生成时逐行替换为名单数据，缺失字段替换为空串。</span>
          </p>
          <textarea
            ref="templateRef"
            v-model="template"
            rows="7"
            class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            :placeholder="templatePlaceholder"
          ></textarea>
          <div v-if="parsedHeaders.length">
            <p class="text-xs text-muted-foreground mb-1.5">插入字段（点击插入到模板光标处）：</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="h in parsedHeaders"
                :key="'tpl-' + h"
                type="button"
                @click="insertPlaceholder(h)"
                class="px-2 py-1 text-xs rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-medium transition"
              >{{ h }}</button>
            </div>
          </div>
          <p v-else class="text-xs text-muted-foreground">解析名单后，这里会出现可点击插入的字段按钮。</p>
        </div>

        <!-- 名单输入 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-lg font-semibold flex items-center">
              <FileSpreadsheet class="w-5 h-5 mr-2 text-primary" /> 名单（CSV，首行表头）
            </h2>
            <label
              class="cursor-pointer px-2.5 py-1.5 text-xs font-medium rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition flex-shrink-0"
            >
              上传 .csv
              <input ref="fileInputRef" type="file" accept=".csv,text/csv" class="hidden" @change="handleFileChange" />
            </label>
          </div>
          <textarea
            v-model="csvText"
            rows="9"
            class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            :placeholder="csvPlaceholder"
          ></textarea>
          <p class="text-xs text-muted-foreground leading-relaxed">
            最多解析 {{ MAX_ROWS }} 行数据；含英文逗号的单元格请用双引号包裹（内部引号写成两个 <code v-pre>""</code>）；请使用 UTF-8 编码，Excel 导出乱码可先在站内编码转换工具转码。
          </p>
          <div v-if="parsedHeaders.length">
            <p class="text-xs text-muted-foreground mb-1.5">表头字段（共 {{ parsedHeaders.length }} 个，点击插入模板）：</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="h in parsedHeaders"
                :key="'csv-' + h"
                type="button"
                @click="insertPlaceholder(h)"
                class="px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border font-medium transition"
              >{{ h }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右面板：校验 + 结果预览 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Play class="w-5 h-5 mr-2 text-primary" /> 生成结果
        </h2>

        <!-- 校验条 -->
        <div class="space-y-2">
          <p
            v-for="(h, i) in validationHints"
            :key="i"
            class="text-xs leading-relaxed rounded px-3 py-2 flex items-start gap-1.5"
            :class="hintClass(h.type)"
          >
            <TriangleAlert
              v-if="h.type === 'error' || h.type === 'warn'"
              class="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
              :class="h.type === 'error' ? 'text-red-500' : 'text-yellow-600'"
            />
            <CheckCircle v-else-if="h.type === 'ok'" class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <Info v-else class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" :class="h.type === 'muted' ? 'text-muted-foreground' : 'text-primary'" />
            <span>{{ h.text }}</span>
          </p>
        </div>

        <!-- 统计 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">数据行数</p>
            <p class="text-xl font-bold text-foreground">{{ parsed.rows.length }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">缺字段行数</p>
            <p class="text-xl font-bold" :class="missingRowCount ? 'text-yellow-600' : 'text-foreground'">{{ missingRowCount }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">占位符数</p>
            <p class="text-xl font-bold text-foreground">{{ placeholders.length }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">未使用列</p>
            <p class="text-xl font-bold" :class="validation.unused.length ? 'text-muted-foreground' : 'text-foreground'">{{ validation.unused.length }}</p>
          </div>
        </div>

        <!-- 结果预览（前 50 条） -->
        <div v-if="previewResults.length" class="space-y-3">
          <div
            v-for="r in previewResults"
            :key="r.index"
            @click="currentIndex = r.index"
            class="rounded-lg border p-3.5 cursor-pointer transition"
            :class="r.index === currentIndex ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/30 hover:border-primary/30'"
          >
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-xs font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">第 {{ r.index }} 条</span>
              <div class="flex items-center gap-2 min-w-0">
                <span
                  v-if="r.missingFields.length"
                  class="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 truncate"
                  :title="'缺字段：' + r.missingFields.join('、')"
                >缺字段：{{ r.missingFields.join('、') }}</span>
                <button
                  type="button"
                  @click.stop="copyOne(r)"
                  class="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-card hover:bg-muted border border-border text-foreground transition flex-shrink-0"
                >
                  <Copy class="w-3.5 h-3.5" /> 复制
                </button>
              </div>
            </div>
            <p class="text-sm text-foreground whitespace-pre-wrap leading-relaxed break-words">{{ r.text }}</p>
          </div>
          <p v-if="results.length > PREVIEW_LIMIT" class="text-xs text-muted-foreground text-center">
            仅预览前 {{ PREVIEW_LIMIT }} 条（共 {{ results.length }} 条），导出 TXT / CSV 可获取全部结果。
          </p>
        </div>
        <div v-else class="border border-dashed border-border rounded-lg p-8 text-center">
          <Mail class="w-10 h-10 text-primary/30 mx-auto mb-2" />
          <p class="text-sm font-medium text-muted-foreground">生成结果会显示在这里</p>
          <p class="text-xs text-muted-foreground/70 mt-1">左侧填好模板与名单后实时生成，点击卡片可选中「当前条」</p>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            @click="copyCurrent"
            class="px-3.5 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition flex items-center gap-1.5"
          >
            <Copy class="w-4 h-4" /> 复制当前条<span v-if="results.length" class="opacity-80">（第 {{ Math.min(Math.max(currentIndex, 1), results.length) }} 条）</span>
          </button>
          <button
            type="button"
            @click="exportTxt"
            class="px-3.5 py-2 text-sm font-medium rounded-lg bg-muted hover:bg-muted/80 border border-border text-foreground transition flex items-center gap-1.5"
          >
            <Download class="w-4 h-4" /> 导出全部 TXT
          </button>
          <button
            type="button"
            @click="exportCsv"
            class="px-3.5 py-2 text-sm font-medium rounded-lg bg-muted hover:bg-muted/80 border border-border text-foreground transition flex items-center gap-1.5"
          >
            <Download class="w-4 h-4" /> 导出 CSV
          </button>
          <button
            type="button"
            @click="loadExample"
            class="px-3.5 py-2 text-sm font-medium rounded-lg bg-muted hover:bg-muted/80 border border-border text-foreground transition flex items-center gap-1.5"
          >
            <Play class="w-4 h-4" /> 载入示例
          </button>
          <button
            type="button"
            @click="clearAll"
            class="px-3.5 py-2 text-sm font-medium rounded-lg bg-muted hover:bg-muted/80 border border-border text-foreground transition flex items-center gap-1.5"
          >
            <RefreshCw class="w-4 h-4" /> 清空
          </button>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          提示：缺字段（表头无对应列或该行单元格为空）会替换为空串并在卡片上以黄标标记，群发前建议先按黄标核对名单；导出 CSV 为「原数据 + 生成文本」列，带 UTF-8 BOM，Excel / WPS 直接打开不乱码。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>批量文本生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          批量文本生成器是一款在浏览器本地运行的邮件合并式文本套版工具：把一份名单（CSV，首行为表头）和一份带 <code v-pre>{{字段}}</code> 占位符的模板组合起来，
          按行逐条替换生成个性化文本，实时预览、逐条复制，或一键导出 TXT / CSV。整个过程不发任何网络请求，名单不上传，也不需要注册或安装任何软件。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么是邮件合并？和 Excel 加 Word 的邮件合并有何区别？</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          邮件合并指把「一份名单 + 一份模板」逐行组合、批量生成个性化文本的做法，最早常见于 Word 的邮件合并功能：要在 Excel 里准备数据源，在 Word 中连接数据、逐个插入合并域、预览再输出，步骤多、门槛高，域一旦插错整批返工。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本工具把同样的流程简化为「贴模板 + 贴名单」两步：占位符直接写在正文里，表头字段点击即插入，右侧实时预览全部结果并自动标记缺字段的行，还能整包导出。不需要 Office，也不会把名单交给任何服务器。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么写 <code v-pre>{{占位符}}</code> 模板？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>用双花括号包住字段名，例如 <code v-pre>{{姓名}}</code>、<code v-pre>{{时间}}</code>，花括号内侧的空格会被忽略。</li>
          <li>字段名必须与 CSV 首行表头完全一致（区分空格与写法），建议直接点击表头字段按钮插入，避免手写出错。</li>
          <li>同一个占位符可以在模板中出现多次；生成时所有出现位置都会被替换。</li>
          <li>行内缺失的字段（表头无对应列或该行单元格为空）会替换为空字符串，并在结果卡片上以黄标提示，发送前记得核对。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">CSV 文件怎么导出？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          在 Excel / WPS 中选择「文件 → 另存为 → CSV UTF-8（逗号分隔）」即可；务必选带 UTF-8 的选项，普通 CSV（ANSI/GBK 编码）在部分设备上会乱码。
          首行必须是表头，后续每行一条数据；如果拿到的文件打开已经是乱码，可以先用站内的编码转换工具把它转成 UTF-8，再粘贴回本页。含逗号或换行的单元格，导出时 Excel 会自动用双引号包裹，本工具可以正确解析。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">适合短信群发、微信通知这类场景吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          适合。生成结果逐条独立，可直接复制进短信、微信群、邮件正文或工单回复框：老师给家长发开课通知、培训机构提醒学员上课、组织者批量发活动邀请、客服按话术模板回复工单都可以套用。
          需要配合群发工具时，可导出 TXT（每条以分隔线隔开）或 CSV（原数据 + 生成文本列），方便按行取用与核对。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">名单数据会上传吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不会。名单解析、占位符替换、结果导出全部在你的浏览器内存中完成，页面不会发出任何包含名单内容的网络请求。模板与名单文本仅保存在你浏览器的 localStorage（用于刷新后恢复草稿），点击「清空」或清除浏览器数据后即被删除。
        </p>
      </div>
    </div>

    <RelatedTools :currentToolId="'mail-merge-tool'" :category="'text'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import {
  Mail, FileSpreadsheet, Copy, Download, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '批量文本生成器 - 在线邮件合并/文本套版工具',
  description: '免费在线批量文本生成器，粘贴 CSV 名单与含占位符的模板即可批量生成个性化通知、提醒与邀请文案，支持缺字段校验、逐条复制与 TXT/CSV 导出，名单全程本地处理不上传',
  keywords: '批量文本生成器,邮件合并,文本套版,CSV批量生成,个性化通知模板,家长通知生成,学员提醒,短信群发文案,工单回复话术',
  author: '有条工具',
  ogTitle: '批量文本生成器 - 在线邮件合并/文本套版工具 | 有条工具',
  ogDescription: '名单+模板 → 批量生成个性化文本，缺字段自动标记，支持 TXT/CSV 导出，名单不上传。',
  ogUrl: 'https://www.util.cn/tools/mail-merge-tool',
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
          name: '批量文本生成器',
          url: 'https://www.util.cn/tools/mail-merge-tool',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['{{字段}}占位符模板', 'CSV 名单本地解析（引号转义、列数校验）', '占位符与表头双向校验', '缺字段行黄标提示', '结果逐条复制', 'TXT / CSV（带 BOM）一键导出', '纯本地运行名单不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本处理', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: '批量文本生成器', item: 'https://www.util.cn/tools/mail-merge-tool/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '什么是邮件合并？和 Excel 加 Word 的邮件合并有何区别？',
              acceptedAnswer: { '@type': 'Answer', text: '邮件合并指把一份名单和一份模板逐行组合、批量生成个性化文本的做法。传统 Word 邮件合并要在 Excel 准备数据源、在 Word 里连接数据并逐个插入合并域，步骤多、门槛高；本工具简化为贴模板加贴名单两步，占位符直接写在正文里，表头字段点击即插入，右侧实时预览并自动标记缺字段行，无需 Office，名单也不经过任何服务器。' }
            },
            {
              '@type': 'Question',
              name: '怎么写 {{字段名}} 占位符模板？',
              acceptedAnswer: { '@type': 'Answer', text: '用双花括号包住字段名（如 {{姓名}}），字段名必须与 CSV 首行表头完全一致，花括号内侧空格会被忽略；同一个占位符可在模板中出现多次；行内缺失的字段会替换为空字符串，并在结果卡片上以黄标提示，发送前记得核对。' }
            },
            {
              '@type': 'Question',
              name: 'CSV 文件怎么导出？',
              acceptedAnswer: { '@type': 'Answer', text: '在 Excel 或 WPS 中选择「文件 → 另存为 → CSV UTF-8（逗号分隔）」即可，务必选带 UTF-8 的编码选项，普通 CSV（ANSI/GBK）在部分设备上会乱码；首行必须是表头。若文件打开已是乱码，可先用站内的编码转换工具转成 UTF-8 再粘贴回本页。' }
            },
            {
              '@type': 'Question',
              name: '适合短信群发、微信通知这类场景吗？',
              acceptedAnswer: { '@type': 'Answer', text: '适合。生成结果逐条独立，可直接复制进短信、微信群、邮件正文或工单回复框；家长通知、学员上课提醒、活动邀请、工单回复话术等批量场景都可套用，也可导出 TXT 或 CSV 配合群发工具按行取用。' }
            },
            {
              '@type': 'Question',
              name: '名单数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。名单解析、占位符替换与结果导出全部在浏览器内存中完成，页面不发出任何包含名单内容的网络请求；模板与名单仅保存在浏览器 localStorage 用于恢复草稿，清空或清除浏览器数据后即删除。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_ROWS = 2000      // 名单最大数据行数（超出忽略并计数）
const PREVIEW_LIMIT = 50   // 结果预览条数上限
const GENERATE_HEADER = '生成文本' // 导出 CSV 追加列的默认表头

// 轻量 CSV 行解析：处理双引号包裹与 "" 转义，返回字段数组
function splitCsvLine(line) {
  const fields = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      fields.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  fields.push(cur)
  return fields
}

// CSV 字段转义：含逗号 / 引号 / 换行时用双引号包裹并转义内部引号
function csvEscapeField(value) {
  const s = value === undefined || value === null ? '' : String(value)
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

// 解析名单 CSV：首行为表头（去首尾空格），空行跳过；
// 短行补空串、比表头多出的列忽略并计数；返回 { headers, rows, truncatedCount, limitedCount }
function parseCsv(text, maxRows = MAX_ROWS) {
  const clean = String(text || '').replace(/^\uFEFF/, '')
  const lines = clean.split(/\r?\n/)
  const headers = splitCsvLine(lines[0] || '').map((h) => h.trim())
  const rows = []
  let truncatedCount = 0
  let limitedCount = 0
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue // 空行跳过
    if (rows.length >= maxRows) {
      limitedCount += 1
      continue
    }
    const fields = splitCsvLine(lines[i])
    if (fields.length > headers.length) truncatedCount += 1 // 超长行的多余列忽略
    const row = {}
    for (let c = 0; c < headers.length; c++) {
      row[headers[c]] = c < fields.length ? fields[c] : '' // 短行补空
    }
    rows.push(row)
  }
  return { headers, rows, truncatedCount, limitedCount }
}

// 提取模板中的占位符（{{ 字段名 }}），去重且保持出现顺序
function extractPlaceholders(tpl) {
  const re = /\{\{\s*([^}]+?)\s*\}\}/g
  const seen = new Set()
  const out = []
  let m
  while ((m = re.exec(String(tpl || ''))) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1])
      out.push(m[1])
    }
  }
  return out
}

// 占位符与表头双向对照：
// missing = 占位符在表头中无对应列（报错，生成空内容）
// unused  = 表头列未被模板使用（仅提示，不报错）
function validateMerge(placeholders, headers) {
  const headerSet = new Set(headers || [])
  const phSet = new Set(placeholders || [])
  const missing = []
  const seen = new Set()
  ;(placeholders || []).forEach((p) => {
    if (!headerSet.has(p) && !seen.has(p)) {
      seen.add(p)
      missing.push(p)
    }
  })
  const unused = (headers || []).filter((h) => h && !phSet.has(h))
  return { missing, unused }
}

// 某一行缺失的字段：占位符无对应列，或该行对应单元格为空
function missingFieldsOf(placeholders, row) {
  return (placeholders || []).filter((p) => {
    if (!row || row[p] === undefined || row[p] === null) return true
    return String(row[p]) === ''
  })
}

// 单行渲染：占位符替换为行数据，行内缺失的字段替换为空串
function renderTemplate(tpl, row) {
  return String(tpl || '').replace(/\{\{\s*([^}]+?)\s*\}\}/g, (whole, name) => {
    const v = row ? row[name] : undefined
    return v === undefined || v === null ? '' : String(v)
  })
}

// 批量渲染：逐行生成 [{index, text, missingFields}]，index 从 1 开始
function renderAll(tpl, rows) {
  const placeholders = extractPlaceholders(tpl)
  return (rows || []).map((row, i) => ({
    index: i + 1,
    text: renderTemplate(tpl, row),
    missingFields: missingFieldsOf(placeholders, row)
  }))
}

// 导出 TXT：每条以「--- 第 N 条 ---」分隔拼接
function exportTxtOf(results) {
  return (results || [])
    .map((r) => `--- 第 ${r.index} 条 ---\n${r.text}`)
    .join('\n\n')
}

// 导出 CSV：原始各列 + 生成文本列（extraHeader 为追加列名），含引号转义
function exportCsvOf(rows, results, extraHeader) {
  const cols = rows && rows.length ? Object.keys(rows[0]) : []
  const head = cols.concat([extraHeader || GENERATE_HEADER])
  const lines = [head.map(csvEscapeField).join(',')]
  ;(rows || []).forEach((row, i) => {
    const vals = cols.map((c) => (row && row[c] !== undefined && row[c] !== null) ? String(row[c]) : '')
    vals.push(results && results[i] ? results[i].text : '')
    lines.push(vals.map(csvEscapeField).join(','))
  })
  return lines.join('\r\n')
}

// ---------- 示例与占位文案 ----------
const templatePlaceholder = '例：{{姓名}}家长您好，{{学生}}同学本期{{课程}}课程将于{{时间}}在{{地点}}开课，请准时到课。'
const csvPlaceholder = '姓名,学生,课程,时间,地点\n张女士,张小明,少儿编程,周六上午 9:00,科技楼 302\n李先生,李小红,少儿编程,周六上午 9:00,科技楼 302'
const EXAMPLE_TEMPLATE = '{{姓名}}家长您好，{{学生}}同学本期{{课程}}课程将于{{时间}}在{{地点}}开课，请准时到课。'
const EXAMPLE_CSV = [
  '姓名,学生,课程,时间,地点',
  '张女士,张小明,少儿编程,周六上午 9:00,科技楼 302',
  '李先生,李小红,少儿编程,周六上午 9:00,科技楼 302',
  '王女士,王小刚,机器人搭建,周日下午 2:00,创客空间'
].join('\n')

// ---------- 页面状态 ----------
const STORAGE_KEY = 'mail-merge-tool'
const template = ref('')
const csvText = ref('')
const seoContentVisible = ref(true)
const currentIndex = ref(1) // 「当前条」序号（点击结果卡片切换）
const templateRef = ref(null)
const fileInputRef = ref(null)

const parsed = computed(() => parseCsv(csvText.value))
const parsedHeaders = computed(() => parsed.value.headers.filter((h) => h))
const placeholders = computed(() => extractPlaceholders(template.value))
const validation = computed(() => validateMerge(placeholders.value, parsed.value.headers))
const results = computed(() => renderAll(template.value, parsed.value.rows))
const missingRowCount = computed(() => results.value.filter((r) => r.missingFields.length > 0).length)
const previewResults = computed(() => (template.value.trim() ? results.value.slice(0, PREVIEW_LIMIT) : []))

// 校验条：占位符/表头对照 + 行数/上限提示
const validationHints = computed(() => {
  const hints = []
  const hasCsv = csvText.value.trim().length > 0
  const hasTpl = template.value.trim().length > 0
  if (!hasCsv) {
    hints.push({ type: 'info', text: '先在左侧粘贴名单 CSV（首行为表头）或上传 .csv 文件。' })
  } else if (!parsed.value.headers.some((h) => h)) {
    hints.push({ type: 'warn', text: '未识别到表头：请确保第一行是字段名，用英文逗号分隔。' })
  }
  if (hasCsv && !hasTpl) {
    hints.push({ type: 'info', text: '名单已就绪，请在左侧填写模板开始生成。' })
  }
  if (parsed.value.limitedCount > 0) {
    hints.push({ type: 'warn', text: `名单超过 ${MAX_ROWS} 行上限，仅解析前 ${MAX_ROWS} 行，其余 ${parsed.value.limitedCount} 行已忽略。` })
  }
  if (parsed.value.truncatedCount > 0) {
    hints.push({ type: 'warn', text: `有 ${parsed.value.truncatedCount} 行比表头多出的列已被忽略。` })
  }
  if (validation.value.missing.length) {
    hints.push({ type: 'error', text: `占位符在表头中不存在：${validation.value.missing.map((p) => `{{${p}}}`).join('、')}，对应位置将生成空内容。` })
  }
  if (validation.value.unused.length) {
    hints.push({ type: 'muted', text: `表头列 ${validation.value.unused.join('、')} 未在模板中使用（仅提示，不影响生成）。` })
  }
  if (!hints.length) {
    hints.push({ type: 'ok', text: '模板与表头完全匹配，右侧已实时生成全部结果。' })
  }
  return hints
})

function hintClass(type) {
  if (type === 'error') return 'bg-red-500/10 text-red-600'
  if (type === 'warn') return 'bg-yellow-500/10 text-yellow-700'
  if (type === 'ok') return 'bg-green-500/10 text-green-600'
  if (type === 'muted') return 'bg-muted/60 text-muted-foreground'
  return 'bg-primary/10 text-foreground'
}

// ---------- 交互处理（回调内使用浏览器 API，SSR 安全） ----------
// 在模板光标处插入 {{字段}}
function insertPlaceholder(name) {
  const token = `{{${name}}}`
  const el = templateRef.value
  if (!el) {
    template.value += token
    return
  }
  const start = typeof el.selectionStart === 'number' ? el.selectionStart : template.value.length
  const end = typeof el.selectionEnd === 'number' ? el.selectionEnd : start
  template.value = template.value.slice(0, start) + token + template.value.slice(end)
  const caret = start + token.length
  nextTick(() => {
    el.focus()
    try { el.setSelectionRange(caret, caret) } catch (e) { /* 部分浏览器不支持时忽略 */ }
  })
}

// 复制：剪贴板 API + execCommand 兜底，成功/失败均 alert 提示
function copyText(text, successMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      alert(successMsg)
    }).catch(() => {
      fallbackCopy(text, successMsg)
    })
  } else {
    fallbackCopy(text, successMsg)
  }
}

function fallbackCopy(text, successMsg) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert(successMsg)
  } catch (e) {
    alert('复制失败，请手动选择文本复制')
  }
}

function copyOne(r) {
  copyText(r.text, `已复制第 ${r.index} 条`)
}

function copyCurrent() {
  if (!results.value.length) {
    alert('暂无可复制的结果，请先填写模板与名单')
    return
  }
  const idx = Math.min(Math.max(currentIndex.value, 1), results.value.length)
  const r = results.value[idx - 1]
  copyText(r.text, `已复制第 ${r.index} 条`)
}

// 下载（Blob utf-8；CSV 另加 BOM）
function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function exportTxt() {
  if (!results.value.length) {
    alert('暂无结果可导出，请先填写模板与名单')
    return
  }
  downloadFile(exportTxtOf(results.value), '批量文本生成结果.txt', 'text/plain;charset=utf-8')
}

function exportCsv() {
  if (!results.value.length) {
    alert('暂无结果可导出，请先填写模板与名单')
    return
  }
  const csv = '\uFEFF' + exportCsvOf(parsed.value.rows, results.value, GENERATE_HEADER)
  downloadFile(csv, '批量文本生成结果.csv', 'text/csv;charset=utf-8')
}

function loadExample() {
  template.value = EXAMPLE_TEMPLATE
  csvText.value = EXAMPLE_CSV
  currentIndex.value = 1
}

function clearAll() {
  template.value = ''
  csvText.value = ''
  currentIndex.value = 1
  try { localStorage.removeItem(STORAGE_KEY) } catch (e) { /* 忽略 */ }
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function handleFileChange(e) {
  const input = e.target
  const file = input.files && input.files[0]
  if (!file) return
  try {
    csvText.value = await file.text()
  } catch (err) {
    alert('读取文件失败，请重试或直接粘贴 CSV 内容')
  }
  input.value = '' // 允许重复选择同一文件
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 草稿持久化：模板 + 名单文本（localStorage 不可用时静默降级）
watch([template, csvText], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ template: template.value, csv: csvText.value }))
  } catch (e) { /* localStorage 不可用时静默降级 */ }
})

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data && typeof data.template === 'string') template.value = data.template
      if (data && typeof data.csv === 'string') csvText.value = data.csv
    }
  } catch (e) { /* 忽略损坏的本地草稿 */ }
  addRecentTool('mail-merge-tool')
})
</script>
