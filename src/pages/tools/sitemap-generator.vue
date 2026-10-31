<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ListTree class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Sitemap XML 生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴 URL 列表一键生成标准 sitemap.xml，自动补协议、去重校验，支持 lastmod / changefreq / priority</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 sitemap.xml 生成工具：每行粘贴一个网址（最多 5000 行），裸域名自动补全 https://，自动去除 #fragment 与重复 URL，无效行给出原因；
        lastmod 支持统一日期或逐条指定，changefreq、priority 可选设置；实时预览 XML、估算文件大小，超过单文件上限提示拆分 sitemap index；
        一键复制或下载 sitemap.xml，全部在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左栏：全局参数 + 生成统计 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Info class="w-5 h-5 mr-2 text-primary" /> 全局参数
        </h2>

        <!-- lastmod 模式 -->
        <div>
          <label for="lastmod-mode" class="block text-sm font-medium text-foreground mb-2">lastmod 修改日期</label>
          <select
            id="lastmod-mode"
            v-model="lastmodMode"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="none">不设置</option>
            <option value="uniform">统一日期（全部条目相同）</option>
            <option value="inline">逐条（URL 后空格跟日期）</option>
          </select>
          <input
            v-if="lastmodMode === 'uniform'"
            v-model="uniformDate"
            type="date"
            class="w-full mt-2 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
          <p v-if="lastmodMode === 'uniform' && !uniformDate" class="text-xs text-amber-600 mt-1.5">请选择日期，未选择时不会输出 lastmod 字段</p>
          <p v-if="lastmodMode === 'inline'" class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            在每行 URL 后加一个空格再写日期，格式 YYYY-MM-DD，例如 <code class="font-mono">https://a.com 2026-10-31</code>
          </p>
        </div>

        <!-- changefreq -->
        <div>
          <label for="changefreq" class="block text-sm font-medium text-foreground mb-2">changefreq 更新频率</label>
          <select
            id="changefreq"
            v-model="changefreq"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">不设置</option>
            <option value="always">always</option>
            <option value="hourly">hourly</option>
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
            <option value="monthly">monthly</option>
            <option value="yearly">yearly</option>
            <option value="never">never</option>
          </select>
        </div>

        <!-- priority -->
        <div>
          <label for="priority" class="block text-sm font-medium text-foreground mb-2">priority 优先级</label>
          <select
            id="priority"
            v-model="priority"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">不设置</option>
            <option value="1.0">1.0</option>
            <option value="0.9">0.9</option>
            <option value="0.8">0.8</option>
            <option value="0.7">0.7</option>
            <option value="0.5">0.5</option>
            <option value="0.3">0.3</option>
          </select>
        </div>

        <!-- 统计条 -->
        <div class="grid grid-cols-2 gap-2 text-center">
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">有效条目</p>
            <p class="text-xl font-bold text-green-600">{{ validCount }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">无效行</p>
            <p class="text-xl font-bold" :class="invalidCount ? 'text-red-500' : 'text-muted-foreground'">{{ invalidCount }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">去除重复</p>
            <p class="text-xl font-bold" :class="dupCount ? 'text-primary' : 'text-muted-foreground'">{{ dupCount }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">估算大小</p>
            <p class="text-xl font-bold text-foreground">{{ sizeText }}</p>
          </div>
        </div>

        <!-- 无效行展开明细 -->
        <div v-if="invalidCount > 0">
          <button
            @click="showInvalid = !showInvalid"
            class="w-full px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <ChevronUp v-if="showInvalid" class="w-3.5 h-3.5" />
            <ChevronDown v-else class="w-3.5 h-3.5" />
            {{ showInvalid ? '收起无效行明细' : `查看无效行明细（前 ${invalidPreviewLimit} 条）` }}
          </button>
          <div v-show="showInvalid" class="mt-2 space-y-1.5 max-h-56 overflow-auto">
            <div
              v-for="(item, idx) in invalidPreview"
              :key="idx"
              class="flex items-start gap-1.5 p-2 rounded bg-red-500/5 border border-red-500/10"
            >
              <TriangleAlert class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
              <div class="min-w-0">
                <p class="text-xs text-foreground">第 {{ item.line }} 行 · {{ item.reason }}</p>
                <p class="text-xs text-muted-foreground font-mono truncate">{{ item.text }}</p>
              </div>
            </div>
            <p v-if="invalidCount > invalidPreviewLimit" class="text-xs text-muted-foreground">
              其余 {{ invalidCount - invalidPreviewLimit }} 条无效行未列出，均不会进入生成结果。
            </p>
          </div>
        </div>

        <!-- 超限红条 -->
        <p
          v-if="overLimit"
          class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5"
        >
          <TriangleAlert class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          <span>已达单个 sitemap 文件上限（5 万条 URL 或约 10MB），搜索引擎无法完整读取，建议拆分为多个 sitemap 文件并用 sitemap index 汇总后提交；本工具暂不生成 index 文件。</span>
        </p>

        <!-- 状态提示 -->
        <p
          class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5"
          :class="invalidCount ? 'bg-red-500/10' : ''"
        >
          <TriangleAlert v-if="invalidCount" class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          <CheckCircle v-else class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
          <span>{{ statusHint }}</span>
        </p>
      </div>

      <!-- 右栏：URL 输入 + XML 预览 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <ListTree class="w-5 h-5 mr-2 text-primary" /> URL 列表（每行一个）
          </h2>
          <span class="text-xs text-muted-foreground">{{ rawLines.lines.length }} / {{ maxLines }} 行</span>
        </div>

        <textarea
          v-model="urlText"
          rows="12"
          spellcheck="false"
          class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="https://www.example.com/&#10;https://www.example.com/blog/post-1&#10;https://www.example.com/about 2026-10-31"
        ></textarea>

        <div class="space-y-1.5">
          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>输入裸域名（如 example.com/about）会自动补全 https://；行内 URL 后用空格跟日期可为该条单独指定 lastmod；#fragment 会被自动去除；重复 URL 自动去重。</span>
          </p>
          <p
            v-if="rawLines.truncated"
            class="text-xs leading-relaxed p-2.5 rounded bg-yellow-500/10 text-yellow-700 flex items-start gap-1.5"
          >
            <TriangleAlert class="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <span>已截断前 5000 行，后面的行不会参与生成。</span>
          </p>
        </div>

        <!-- 批量加后缀（可选） -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="flex items-center gap-1 text-sm font-medium text-foreground flex-shrink-0">
            <Plus class="w-4 h-4 text-primary" /> 批量加后缀
          </span>
          <input
            v-model="suffix"
            type="text"
            spellcheck="false"
            class="flex-1 min-w-[220px] px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="可选：如 /index.html 或 ?lang=zh，追加到每一行 URL 末尾"
          >
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-wrap gap-3">
          <button
            @click="copyXml"
            :disabled="!validCount"
            class="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制 XML
          </button>
          <button
            @click="downloadXml"
            :disabled="!validCount"
            class="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 下载 sitemap.xml
          </button>
          <button
            @click="resetAll"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
          </button>
          <button
            v-if="urlText"
            @click="urlText = ''"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <X class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 清空输入
          </button>
        </div>

        <!-- XML 预览 -->
        <div>
          <h3 class="text-sm font-medium text-foreground mb-2">XML 预览</h3>
          <pre class="font-mono text-xs leading-relaxed bg-muted/60 border border-border rounded-lg p-4 overflow-auto max-h-96 whitespace-pre text-foreground">{{ previewXml }}</pre>
          <p class="text-xs text-muted-foreground mt-1.5">预览仅显示前 30 条，下载包含全部。</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>sitemap.xml 是什么？我的网站需要吗？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          sitemap.xml 是一个符合 sitemaps.org 0.9 协议的 XML 文件，按固定格式列出站点的可收录 URL，并可选附上最后修改时间（lastmod）、
          预计更新频率（changefreq）与优先级（priority），帮助搜索引擎更完整、更快地发现页面。本工具把生成过程简化为
          「粘贴 URL 列表 → 自动校验去重 → 输出 XML」，几十秒就能补上这份文件。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed">
          需要与否取决于站点形态：小型站点（十几到几百个页面、内链结构良好）其实可以省略——搜索引擎顺着站内链接和外链也能发现全部页面；
          而内容页多、更新频繁、存在孤立页（没有内链指向）或新上线的域名，提供 sitemap 通常能加快并补全收录。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">生成后怎么提交给搜索引擎？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>Google Search Console：左侧「站点地图」入口，填入 sitemap.xml 的完整网址后提交。</li>
          <li>Bing 站长工具（Bing Webmaster Tools）：「Sitemaps」提交入口，也支持直接从 Search Console 导入站点。</li>
          <li>百度站长平台（搜索资源平台）：普通收录 / sitemap 入口提交。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">changefreq 和 priority 还有用吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          诚实地说：Google 官方已声明基本忽略 changefreq，priority 也几乎不影响抓取与排名；对 Google 而言真正可能有用的是
          lastmod（前提是时间真实准确，乱填反而有害）。保留这两个字段的输出，是为了兼容 Bing、Yandex 等仍会读取它们的引擎与部分第三方分析工具。
          拿不准就选「不设置」，XML 会更干净——这两个字段本来就是可选的。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">单个 sitemap 文件有大小限制吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          有。单个 sitemap 文件（未压缩）最多 50000 个 URL 或 50MB，任一达到上限就需要把 URL 拆分进多个 sitemap 文件，
          再用一个 sitemap index（&lt;sitemapindex&gt; 索引文件）汇总这些分片后提交。本工具会在条目数超过 5 万或估算体积超过 10MB 时给出红色提示，
          但暂不生成 index 文件——需要时可按 sitemaps.org 的 &lt;sitemapindex&gt; 规范手工拼装一个。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">和 robots.txt 里的 Sitemap: 行怎么配合？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          在 robots.txt 末尾加一行 <code class="font-mono">Sitemap: https://www.example.com/sitemap.xml</code>（绝对网址，多个 sitemap 写多行），
          能读取 robots.txt 的搜索引擎即使没去站长平台提交，也会自动发现并抓取 sitemap。两种方式互不冲突，建议同时使用；
          另外记得确认 sitemap 中的 URL 是可公开访问、可被正常返回 200 状态码的地址。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">sitemap.xml 是必须的吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不是硬性要求。小型站点内链完善时可以省略，搜索引擎靠链接也能发现页面；内容多、更新快、孤立页多的站点建议提供，通常能加快并补全收录。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">changefreq 和 priority 对 Google 有用吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">Google 已基本忽略这两个字段；时间准确的 lastmod 仍可能被参考。保留输出主要是为了兼容 Bing、Yandex 等其他引擎，不需要时选「不设置」即可。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">单个 sitemap 文件最多放多少条？</h3>
            <p class="text-sm text-muted-foreground mt-1">未压缩最多 50000 个 URL 或 50MB，超过任一上限需拆分为多个文件并用 sitemap index 汇总提交；本工具会在超限时给出提示，但不生成 index 文件。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'sitemap-generator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ListTree, CheckCircle, TriangleAlert, Copy, Download, RefreshCw,
  ChevronUp, ChevronDown, Info, Plus, X
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'Sitemap XML 生成器 - 在线网站地图生成工具',
  description: '免费在线 sitemap.xml 生成工具，粘贴 URL 列表自动补全协议、去除重复与非法行，支持统一或逐条 lastmod、changefreq、priority，实时预览与大小估算，一键复制下载，纯浏览器本地运行不上传',
  keywords: 'sitemap生成器,sitemap.xml生成,网站地图生成器,xml站点地图,sitemap在线生成,网站地图提交,lastmod生成器',
  author: '有条工具',
  ogTitle: 'Sitemap XML 生成器 - 在线网站地图生成工具 | 有条工具',
  ogDescription: '粘贴 URL 列表一键生成标准 sitemap.xml，自动校验去重，支持 lastmod / changefreq / priority。',
  ogUrl: 'https://www.util.cn/tools/sitemap-generator',
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
          name: 'Sitemap XML 生成器',
          url: 'https://www.util.cn/tools/sitemap-generator',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['每行一个 URL 批量生成 sitemap.xml', '自动补全 https 协议并去除 #fragment', '重复 URL 去重与无效行原因提示', '统一 / 逐条 lastmod 修改日期', 'changefreq 与 priority 可选设置', '实时预览与文件大小估算', '超 5 万条或 10MB 提示拆分', '一键复制与下载，本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'Sitemap XML 生成器', item: 'https://www.util.cn/tools/sitemap-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'sitemap.xml 是必须的吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是硬性要求。小型站点内链完善时可以省略，搜索引擎靠链接也能发现页面；内容多、更新快、孤立页多的站点建议提供，通常能加快并补全收录。' }
            },
            {
              '@type': 'Question',
              name: 'changefreq 和 priority 对 Google 有用吗？',
              acceptedAnswer: { '@type': 'Answer', text: 'Google 已基本忽略这两个字段；时间准确的 lastmod 仍可能被参考。保留输出主要是为了兼容 Bing、Yandex 等其他引擎，不需要时选不设置即可。' }
            },
            {
              '@type': 'Question',
              name: '单个 sitemap 文件最多放多少条？',
              acceptedAnswer: { '@type': 'Answer', text: '未压缩最多 50000 个 URL 或 50MB，超过任一上限需拆分为多个文件并用 sitemap index 汇总提交；本工具会在超限时给出提示，但不生成 index 文件。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 常量 ----------
const invalidPreviewLimit = 50 // 无效行明细最多展示条数

// ---------- 纯逻辑（可独立单测） ----------
const maxLines = 5000            // 输入最多行数，超出截断
const previewCount = 30          // 预览展示条数
const maxUrlsPerFile = 50000     // 单个 sitemap 文件 URL 数上限
const maxFileBytes = 10 * 1024 * 1024 // 红条提示的体积阈值（约 10MB）

// 截断输入到 max 行：超出部分丢弃并标记 truncated
function truncateLines(text, max) {
  const all = String(text ?? '').split('\n')
  if (all.length <= max) return { lines: all, truncated: false }
  return { lines: all.slice(0, max), truncated: true }
}

// 校验并规范化单个 URL：trim、去尾部斜杠与空白、无协议补 https://、去 #fragment
// 通过返回 { ok: true, url }，失败返回 { ok: false, reason }
function normalizeUrl(raw) {
  let u = String(raw ?? '').trim()
  if (!u) return { ok: false, reason: 'URL 为空' }
  u = u.replace(/[\s/]+$/g, '') // 去尾部斜杠与空白
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(u)) {
    u = 'https://' + u.replace(/^\/+/, '') // 无协议补 https://
  }
  const hashIndex = u.indexOf('#')
  if (hashIndex !== -1) u = u.slice(0, hashIndex) // 去 #fragment
  if (!/^https?:\/\//i.test(u)) return { ok: false, reason: '仅支持 http/https 协议' }
  if (/\s/.test(u)) return { ok: false, reason: 'URL 中包含空格' }
  const host = u.replace(/^https?:\/\//i, '').split(/[/?#]/)[0]
  if (!host || !host.includes('.')) return { ok: false, reason: '域名无效：至少要包含一个点（如 example.com）' }
  return { ok: true, url: u }
}

// 校验 YYYY-MM-DD 日期字符串是否为真实存在的日期（含闰年）
function isValidDateStr(s) {
  const str = String(s ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false
  const parts = str.split('-').map(Number)
  const y = parts[0]
  const m = parts[1]
  const d = parts[2]
  if (m < 1 || m > 12) return false
  const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
  const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return d >= 1 && d <= daysInMonth[m - 1]
}

// 解析一行输入：URL + 可选的空格分隔日期（YYYY-MM-DD），多余内容记入 extra
function parseUrlLine(line) {
  const text = String(line ?? '').trim()
  if (!text) return { url: '', lastmod: null, extra: '' }
  const parts = text.split(/\s+/)
  return {
    url: parts[0],
    lastmod: parts.length > 1 ? parts[1] : null,
    extra: parts.length > 2 ? parts.slice(2).join(' ') : ''
  }
}

// 校验整份 URL 列表：有效条目（去重后）、无效行（行号+原因）、重复计数
function validateUrlList(lines) {
  const valid = []
  const invalid = []
  const seen = new Set()
  let dupCount = 0
  const list = Array.isArray(lines) ? lines : []
  for (let i = 0; i < list.length; i++) {
    const raw = String(list[i] ?? '')
    if (!raw.trim()) continue // 空行直接跳过，不计数
    const parsed = parseUrlLine(raw)
    if (parsed.extra) {
      invalid.push({ line: i + 1, text: raw.trim(), reason: '一行只能包含 URL 和一个可选日期，多余内容请删除' })
      continue
    }
    if (parsed.lastmod !== null && !isValidDateStr(parsed.lastmod)) {
      invalid.push({ line: i + 1, text: raw.trim(), reason: '日期格式应为 YYYY-MM-DD，收到「' + parsed.lastmod + '」' })
      continue
    }
    const normalized = normalizeUrl(parsed.url)
    if (!normalized.ok) {
      invalid.push({ line: i + 1, text: raw.trim(), reason: normalized.reason })
      continue
    }
    if (seen.has(normalized.url)) {
      dupCount += 1
      continue
    }
    seen.add(normalized.url)
    valid.push({ url: normalized.url, lastmod: parsed.lastmod })
  }
  return { valid, invalid, dupCount }
}

// XML 五个特殊字符转义：& < > " '
function escapeXml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (ch) => (
    ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '"' ? '&quot;' : '&apos;'
  ))
}

// 批量给每行追加后缀（空行保持空行，后缀为空时原样返回副本）
function appendSuffixToLines(lines, suffixText) {
  const list = Array.isArray(lines) ? lines : []
  const sfx = String(suffixText ?? '')
  if (!sfx) return list.slice()
  return list.map((l) => {
    const t = String(l ?? '').trim()
    return t ? t + sfx : ''
  })
}

// 估算字符串的 UTF-8 字节数（中文等按 3 字节近似）
function estimateUtf8Bytes(s) {
  let bytes = 0
  const str = String(s ?? '')
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    bytes += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4
  }
  return bytes
}

// 生成完整 sitemap.xml：xml 声明 + urlset + 每条 <url>（lastmod/changefreq/priority 均为可选）
function buildSitemapXml(entries, options = {}) {
  const list = Array.isArray(entries) ? entries : []
  const cf = String(options.changefreq || '')
  const pv = String(options.priority || '')
  const out = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ]
  for (const entry of list) {
    if (!entry || !entry.url) continue
    out.push('  <url>')
    out.push('    <loc>' + escapeXml(entry.url) + '</loc>')
    if (entry.lastmod) out.push('    <lastmod>' + escapeXml(entry.lastmod) + '</lastmod>')
    if (cf) out.push('    <changefreq>' + escapeXml(cf) + '</changefreq>')
    if (pv) out.push('    <priority>' + escapeXml(pv) + '</priority>')
    out.push('  </url>')
  }
  out.push('</urlset>')
  return out.join('\n')
}

// 字节数人性化显示
function formatBytes(bytes) {
  const b = Number(bytes) || 0
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 页面状态 ----------
const urlText = ref('')
const suffix = ref('')
const lastmodMode = ref('none')   // none | uniform | inline
const uniformDate = ref('')
const changefreq = ref('')        // '' 表示不设置
const priority = ref('')          // '' 表示不设置
const showInvalid = ref(false)
const seoContentVisible = ref(true)

// ---------- 计算属性 ----------
const rawLines = computed(() => truncateLines(urlText.value, maxLines))

const report = computed(() => {
  const base = rawLines.value.lines
  const lines = suffix.value ? appendSuffixToLines(base, suffix.value) : base
  return validateUrlList(lines)
})

const validCount = computed(() => report.value.valid.length)
const invalidCount = computed(() => report.value.invalid.length)
const dupCount = computed(() => report.value.dupCount)

const invalidPreview = computed(() =>
  report.value.invalid.slice(0, invalidPreviewLimit).map((it) => ({
    ...it,
    text: it.text.length > 80 ? it.text.slice(0, 80) + '…' : it.text
  }))
)

// lastmod 模式决定最终条目：不设置→无；统一→同一日期；逐条→沿用行内解析结果
const effectiveEntries = computed(() => {
  const entries = report.value.valid
  if (lastmodMode.value === 'uniform') {
    const d = uniformDate.value
    return entries.map((e) => ({ url: e.url, lastmod: isValidDateStr(d) ? d : null }))
  }
  if (lastmodMode.value === 'none') {
    return entries.map((e) => ({ url: e.url, lastmod: null }))
  }
  return entries
})

const xmlOptions = computed(() => ({ changefreq: changefreq.value, priority: priority.value }))
const sitemapXml = computed(() => buildSitemapXml(effectiveEntries.value, xmlOptions.value))
const previewXml = computed(() => buildSitemapXml(effectiveEntries.value.slice(0, previewCount), xmlOptions.value))

const xmlBytes = computed(() => estimateUtf8Bytes(sitemapXml.value))
const sizeText = computed(() => formatBytes(xmlBytes.value))
const overLimit = computed(() => validCount.value > maxUrlsPerFile || xmlBytes.value > maxFileBytes)

const statusHint = computed(() => {
  if (!urlText.value.trim()) {
    return '在右侧粘贴 URL 列表开始生成：每行一个网址，裸域名会自动补全 https://。'
  }
  if (invalidCount.value) {
    return '检测到 ' + invalidCount.value + ' 个无效行，已自动忽略；可展开查看行号与原因，修正后立即生效。'
  }
  if (dupCount.value) {
    return '已自动去除 ' + dupCount.value + ' 个重复 URL，其余条目全部有效，XML 可直接复制或下载。'
  }
  return '全部 URL 校验通过，sitemap.xml 已就绪，可直接复制或下载。'
})

// ---------- 操作（浏览器 API 只在回调中调用，SSR 安全） ----------
async function copyXml() {
  try {
    await navigator.clipboard.writeText(sitemapXml.value)
    alert('已复制 sitemap.xml 全部内容到剪贴板')
  } catch (e) {
    alert('复制失败，请手动全选预览区文本进行复制')
  }
}

function downloadXml() {
  try {
    const blob = new Blob([sitemapXml.value], { type: 'application/xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sitemap.xml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    alert('下载失败，请复制预览区内容手动保存为 sitemap.xml')
  }
}

function resetAll() {
  urlText.value = ''
  suffix.value = ''
  lastmodMode.value = 'none'
  uniformDate.value = ''
  changefreq.value = ''
  priority.value = ''
  showInvalid.value = false
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('sitemap-generator')
})
</script>
