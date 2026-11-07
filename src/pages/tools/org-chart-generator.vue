<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Network class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">组织架构图生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">缩进文本描述层级一键生成 SVG 树图，上下 / 左右布局切换，可导出 SVG、PNG 与打印，纯本地运行</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线组织架构图制作工具：在左侧文本框里用缩进描述层级（行首 2 个空格为一级，支持制表符），或改用「上级|下级」逐行配对格式，
        右侧实时渲染成圆角矩形节点 + 折线连线的树形架构图——支持「从上到下」与「从左到右」两种布局方向切换、节点宽度按文字长度自适应、
        叶子较多时自动收紧间距紧凑排版。全部解析与绘图由浏览器本地纯函数完成，不上传任何数据；可下载 SVG / PNG、复制 SVG 代码或直接打印，
        架构文本草稿自动保存在本机 localStorage。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：文本输入 + 设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 no-print">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Network class="w-5 h-5 mr-2 text-primary" /> 架构描述
          </h2>
          <button
            type="button"
            @click="loadExample"
            class="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium inline-flex items-center gap-1 transition"
          >
            <Play class="w-3.5 h-3.5" /> 填充示例
          </button>
        </div>

        <!-- 输入格式切换说明卡 -->
        <div class="space-y-2">
          <div class="flex rounded-lg border border-border overflow-hidden" role="group" aria-label="输入格式">
            <button
              v-for="m in INPUT_MODES"
              :key="m.value"
              type="button"
              @click="inputMode = m.value"
              class="flex-1 px-2 py-1.5 text-xs font-medium transition"
              :class="inputMode === m.value ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'"
            >
              {{ m.label }}
            </button>
          </div>
          <p class="text-xs leading-relaxed p-2.5 rounded-lg bg-muted/50 text-muted-foreground">
            <template v-if="inputMode === 'indent'">
              每行一个部门 / 岗位：<b class="text-foreground">行首 2 个空格 = 一级</b>（4 个空格两级，Tab 同一级），首个顶格行为根节点，
              多个顶格行即多根并列。缩进一次跳两级会自动收拢到上一层的下一级。
            </template>
            <template v-else>
              每行一条「<b class="text-foreground">上级|下级</b>」配对（半角竖线分隔），顺序不限、可多根；
              重复配对与成环引用会自动忽略，未在任何配对里做过下级的名称即为根节点。
            </template>
          </p>
          <textarea
            v-model="orgText"
            rows="14"
            spellcheck="false"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono leading-6 focus:outline-none focus:ring-2 focus:ring-ring"
            :placeholder="inputMode === 'indent' ? '公司\n  研发部\n    前端组\n  市场部\n    品牌组' : '公司|研发部\n公司|市场部\n研发部|前端组'"
            aria-label="组织架构层级文本"
          ></textarea>
        </div>

        <!-- 布局设置 -->
        <div class="pt-3 border-t border-border space-y-3">
          <h3 class="text-sm font-medium text-foreground">布局设置</h3>
          <div>
            <p class="text-[10px] text-muted-foreground mb-1.5">布局方向</p>
            <div class="flex rounded-lg border border-border overflow-hidden">
              <button
                v-for="o in ORIENTATIONS"
                :key="o.value"
                type="button"
                @click="orientation = o.value"
                class="flex-1 px-2 py-1.5 text-xs font-medium transition"
                :class="orientation === o.value ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'"
              >
                {{ o.label }}
              </button>
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="compact" type="checkbox" class="h-4 w-4 accent-primary" />
            紧凑间距（叶子多时勾选；超过 12 个叶子也会自动收紧）
          </label>
        </div>

        <!-- 校验提示 -->
        <p v-if="parseError" class="text-xs leading-relaxed p-2.5 rounded-lg bg-red-500/10 text-red-600 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ parseError }}</span>
        </p>
        <p v-else class="text-xs leading-relaxed p-2.5 rounded-lg bg-green-500/10 text-green-600 flex items-start gap-1.5">
          <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>解析成功：{{ stats.roots }} 个根节点、共 {{ stats.nodes }} 个节点、最大 {{ stats.depth }} 级，右侧图已按最新文本渲染。</span>
        </p>

        <!-- 统计小卡 -->
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="bg-muted/50 rounded-xl p-3">
            <p class="text-[10px] text-muted-foreground mb-1">节点数</p>
            <p class="text-lg font-bold text-foreground">{{ stats.nodes }}</p>
          </div>
          <div class="bg-muted/50 rounded-xl p-3">
            <p class="text-[10px] text-muted-foreground mb-1">层级数</p>
            <p class="text-lg font-bold text-foreground">{{ stats.depth }}</p>
          </div>
          <div class="bg-muted/50 rounded-xl p-3">
            <p class="text-[10px] text-muted-foreground mb-1">根节点</p>
            <p class="text-lg font-bold text-foreground">{{ stats.roots }}</p>
          </div>
        </div>
      </div>

      <!-- 右：架构图预览 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4 print-area">
        <div class="no-print flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Network class="w-5 h-5 mr-2 text-primary" /> 架构图预览
          </h2>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              @click="clearText"
              class="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 transition"
            >
              <RefreshCw class="w-3.5 h-3.5" /> 清空
            </button>
            <button
              type="button"
              @click="copySvg"
              class="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 transition"
            >
              <Copy class="w-3.5 h-3.5" /> 复制 SVG
            </button>
            <button
              type="button"
              @click="downloadSvg"
              class="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 transition"
            >
              <Download class="w-3.5 h-3.5" /> 下载 SVG
            </button>
            <button
              type="button"
              @click="downloadPng"
              class="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 transition"
            >
              <ImageDown class="w-3.5 h-3.5" /> 下载 PNG
            </button>
            <button
              type="button"
              @click="printChart"
              class="px-3 py-1.5 text-xs rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground inline-flex items-center gap-1 transition"
            >
              <Printer class="w-3.5 h-3.5" /> 打印
            </button>
          </div>
        </div>

        <!-- 图表（内容由纯函数生成的 SVG 字符串，节点名均经 escapeXml 转义） -->
        <div class="chart-wrap overflow-x-auto rounded-xl border border-border bg-white p-3">
          <div v-html="svgString"></div>
        </div>

        <p class="no-print text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
          <span>
            深蓝为根节点、浅蓝为一级部门、白底为下级岗位；连线为折线式母线。节点宽度随文字长度自适应，
            悬停节点可查看完整名称。「从左到右」会把层级从纵向变为横向展开，适合部门多、层级深的架构。
          </span>
        </p>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="no-print group bg-card border border-border rounded-lg mb-12">
      <summary class="cursor-pointer select-none px-6 py-4 text-lg font-semibold text-foreground flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>组织架构图怎么画才规范？</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div class="px-6 pb-6">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>组织架构图制图规范</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          组织架构图（Org Chart）用「节点 + 连线」表达组织的汇报与隶属关系：一个节点代表一个部门或一个岗位，连线只表达「向谁汇报」这一种关系。
          好读的架构图有三个共性：层级从上往下逐级展开、同一层节点宽度对齐、连线只走横平竖直的折线而不是斜线交叉。
          本工具默认按这三个约定渲染：根节点置顶、同层横向排列、折线式母线连接，可直接用于员工手册、入职文档与汇报材料。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">一层一层拆：先部门、后岗位</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>先画顶层（公司 / 事业部），再画一级部门，最后才铺岗位——每往下画一层，都确认上一层的兄弟节点已经列全。</li>
          <li>同一层保持同一种粒度：不要在「一级部门」层混入具体岗位；虚线汇报、兼职顾问这类弱关系建议不放主图，另加备注。</li>
          <li>节点文字用「部门名」或「岗位名」，不要把职责、人数塞进节点；需要时用悬停提示或附表补充。</li>
          <li>层级建议控制在 3-5 级：超过 5 级通常说明中间管理层冗余，或应该改用「从左到右」布局换取横向空间。</li>
          <li>多人同一岗位（如「前端工程师 ×6」）合并成一个节点标注人数，比画 6 个同名节点清爽得多。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么时候选「从左到右」布局？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          「从上到下」适合层级浅（3 级以内）、部门数量适中的经典树；当叶子节点（岗位）很多时，横向会被撑得很宽。
          此时切换「从左到右」：层级变成纵向列、兄弟节点纵向堆叠，宽度只随层级数增长，正好适合层级深、每层岗位多的组织（如研发中心的各职能组）。
          本页两种布局使用同一份文本，切换不会丢失任何内容。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">数据保存在哪里？会上传吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不会上传。架构文本、输入格式与布局方向只保存在当前浏览器的 localStorage，用于下次打开时恢复草稿；
          解析与 SVG 绘制全部由本地纯函数完成。更换浏览器 / 设备或清除站点数据后草稿不会跟随迁移，长期留存请「下载 SVG / PNG」或把文本粘贴到文档备份。
          排完架构图若还要排项目任务，可用站内<a href="/tools/gantt-chart-maker/" class="text-primary underline">甘特图生成器</a>把部门工作铺到时间轴上。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">缩进格式和「上级|下级」格式怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1">从大纲文档（会议纪要、WPS / Word 多级列表）直接粘贴时用缩进格式最省事；手里只有一份散乱的汇报关系清单（如 HR 导出的上级工号对照）时，「上级|下级」逐行配对更顺手——顺序不限，工具会自动把关系拼成树。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">可以有多个根节点吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">可以。缩进格式里写多个顶格行、配对格式里出现多个从未做过「下级」的名称，都会渲染成并列的多棵树，适合集团多事业部、矩阵组织等场景。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">部门名里有特殊字符会出问题吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有节点文字在写入 SVG 前都会做 XML 转义（&lt; &gt; &amp; 引号等），「研发&lt;创新&gt;部」这类名称可以正常显示与导出。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">导出的 PNG 分辨率够打印吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">PNG 按 2 倍尺寸栅格化输出；如果要更高清晰度或需要后期在矢量软件里调整，建议用「下载 SVG」——SVG 是矢量格式，任意缩放不失真。</p>
          </div>
        </div>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :currentToolId="'org-chart-generator'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Network, CheckCircle, TriangleAlert, Copy, Download, Printer,
  RefreshCw, ChevronDown, Info, Play, ImageDown
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '组织架构图生成器 - 缩进文本在线画架构树图（SVG/PNG 导出）',
  description: '免费在线组织架构图生成器：缩进文本或「上级|下级」配对描述层级，一键生成圆角节点+折线连线的 SVG 树图，支持从上到下/从左到右布局切换、节点宽度自适应、多根并列，可下载 SVG、PNG 与打印，纯浏览器本地运行不上传',
  keywords: '组织架构图,组织架构图生成器,架构图在线制作,部门结构图,树图,团队架构',
  author: '有条工具',
  ogTitle: '组织架构图生成器 - 缩进文本在线画架构树图 | 有条工具',
  ogDescription: '缩进文本一键生成 SVG 组织架构图，上下/左右布局切换，多根并列，节点宽度自适应，可导出 SVG/PNG 与打印。',
  ogUrl: 'https://www.util.cn/tools/org-chart-generator',
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
          name: '组织架构图生成器',
          url: 'https://www.util.cn/tools/org-chart-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['缩进文本与「上级|下级」两种输入格式', '从上到下/从左到右布局切换', '多根并列与多级嵌套解析', '节点宽度按文字长度自适应', 'SVG 下载、PNG 导出与打印', 'localStorage 本地草稿不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '组织架构图生成器', item: 'https://www.util.cn/tools/org-chart-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '缩进格式和「上级|下级」格式怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '从大纲文档直接粘贴时用缩进格式最省事（行首 2 个空格为一级，Tab 同级）；手里只有散乱的汇报关系清单时，「上级|下级」逐行配对更顺手，顺序不限，工具会自动拼成树。' }
            },
            {
              '@type': 'Question',
              name: '可以有多个根节点吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以。缩进格式里写多个顶格行、配对格式里出现多个从未做过「下级」的名称，都会渲染成并列的多棵树，适合集团多事业部、矩阵组织等场景。' }
            },
            {
              '@type': 'Question',
              name: '部门名里有特殊字符会出问题吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有节点文字在写入 SVG 前都会做 XML 转义（小于号、大于号、与符号、引号等），含特殊字符的名称可正常显示与导出。' }
            },
            {
              '@type': 'Question',
              name: '导出的 PNG 分辨率够打印吗？',
              acceptedAnswer: { '@type': 'Answer', text: 'PNG 按 2 倍尺寸栅格化输出；需要更高清晰度或后期在矢量软件里调整时，建议下载 SVG——SVG 是矢量格式，任意缩放不失真。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// SVG 几何常量
const NODE_H = 36      // 节点高度 px
const MIN_W = 64       // 节点最小宽度 px
const MAX_W = 220      // 节点最大宽度 px
const NODE_PAD_X = 18  // 节点文字左右内边距 px
const MARGIN = 14      // 画布四周留白 px
const H_GAP_TD = 18    // 从上到下：兄弟子树水平间距 px
const V_GAP_TD = 44    // 从上到下：层间垂直间距 px
const VR_GAP_LR = 10   // 从左到右：兄弟节点垂直间距 px
const LR_GAP = 34      // 从左到右：层间水平间距 px
const ROOT_GAP = 30    // 多根树根节点之间的额外间距 px

const EMPTY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="150" viewBox="0 0 640 150" font-family="'PingFang SC','Microsoft YaHei',sans-serif"><rect width="640" height="150" fill="#ffffff"/><text x="320" y="70" font-size="14" fill="#94a3b8" text-anchor="middle">暂无节点</text><text x="320" y="94" font-size="12" fill="#cbd5e1" text-anchor="middle">在左侧输入层级文本，或点击「填充示例」快速开始</text></svg>`

// XML/HTML 文本转义（节点名进入 SVG 前必须调用）
function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// 行首缩进深度：Tab 记 1 级，空格每 2 个记 1 级（混用时分别累计后相加）
function lineDepth(line) {
  let depth = 0
  let i = 0
  while (i < line.length) {
    const ch = line[i]
    if (ch === '\t') { depth += 1; i += 1 }
    else if (ch === ' ') {
      let j = i
      while (j < line.length && line[j] === ' ') j += 1
      depth += Math.floor((j - i) / 2)
      i = j
    } else break
  }
  return depth
}

// 缩进文本 → 树（栈式解析）：返回根数组（多根支持）。
// 规则：以首行的缩进深度为根深度，深度不超过根深度的行都是并列根；
// 深度跳级（如根下直接 4 空格）自动收拢为上一层的孩子；空行跳过。
function parseIndented(text) {
  const roots = []
  const stack = [] // 当前路径：stack[d] 为深度 d 上的最新节点
  let rootDepth = null
  const lines = String(text || '').split(/\r?\n/)
  for (const raw of lines) {
    if (!raw.trim()) continue
    const depth = lineDepth(raw)
    if (rootDepth === null) rootDepth = depth
    const node = { name: raw.trim(), children: [] }
    if (depth <= rootDepth || stack.length === 0) {
      roots.push(node)
      stack.length = 0
      stack.push(node)
      continue
    }
    const d = Math.min(depth, stack.length) // 跳级收拢
    stack.length = d
    stack[d - 1].children.push(node)
    stack.push(node)
  }
  return roots
}

// 「上级|下级」逐行配对 → 树：重复配对与成环边自动忽略；从未做过下级的名称为根。
// 树语义：一个下级只挂到第一个出现的上级（后续配对忽略），避免共享节点被重复渲染。
function parsePairs(text) {
  const nodes = new Map()
  const roots = []
  const hasParent = new Set()
  const lines = String(text || '').split(/\r?\n/)
  // 判断 member 是否在 node 的子树内（含相等），用于拦截成环边：
  // 新边 p→c 会成环当且仅当 p 已在 c 的子树里（c 是 p 的祖先）
  function inSubtreeOf(member, node) {
    if (member === node) return true
    for (const c of node.children || []) {
      if (c === member || inSubtreeOf(member, c)) return true
    }
    return false
  }
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const seg = line.split('|')
    if (seg.length < 2) continue // 无竖线的行跳过
    const parentName = seg[0].trim()
    const childName = seg[1].trim()
    if (!parentName || !childName || parentName === childName) continue
    if (!nodes.has(parentName)) {
      const n = { name: parentName, children: [] }
      nodes.set(parentName, n)
      roots.push(n)
    }
    if (!nodes.has(childName)) {
      const n = { name: childName, children: [] }
      nodes.set(childName, n)
    }
    const p = nodes.get(parentName)
    const c = nodes.get(childName)
    if (hasParent.has(childName)) continue // 已有上级：重复配对或多上级，忽略
    if (inSubtreeOf(p, c)) continue        // 成环（新上级已在下级的子树里）
    p.children.push(c)
    hasParent.add(childName)
    const ri = roots.indexOf(c) // 下级不再作为根
    if (ri >= 0) roots.splice(ri, 1)
  }
  return roots
}

// 按输入格式解析（统一入口），并给出人类可读的错误信息
function parseOrgText(text, mode) {
  const roots = mode === 'pairs' ? parsePairs(text) : parseIndented(text)
  if (!roots.length) return { ok: false, roots: [], error: '没有解析到任何节点：请检查文本是否为空，或格式是否符合所选输入格式。' }
  return { ok: true, roots, error: '' }
}

// 按像素宽度估算节点文字宽（CJK/全角约 12px，半角约 6.6px，字号 12）
function textWidthPx(s) {
  let w = 0
  for (const ch of String(s)) w += ch.charCodeAt(0) > 255 ? 12 : 6.6
  return w
}

// 节点宽度自适应：夹在 [MIN_W, MAX_W]
function nodeWidthOf(name) {
  const w = textWidthPx(name) + NODE_PAD_X * 2
  return Math.min(MAX_W, Math.max(MIN_W, Math.ceil(w)))
}

// 超长文字截断（带省略号），宽度口径与 nodeWidthOf 一致
function truncateName(name, maxPx) {
  const text = String(name == null || name === '' ? '未命名' : name)
  let w = 0
  let out = ''
  for (const ch of text) {
    const cw = ch.charCodeAt(0) > 255 ? 12 : 6.6
    if (w + cw > maxPx) return { text: out + '…', truncated: true }
    out += ch
    w += cw
  }
  return { text: out, truncated: false }
}

// 间距档位：紧凑模式整体收紧（叶子多时自动或手动勾选）
function gapsFor(isCompact) {
  return isCompact
    ? { hTd: 8, vTd: 34, vrLr: 5, lr: 26, root: 14 }
    : { hTd: H_GAP_TD, vTd: V_GAP_TD, vrLr: VR_GAP_LR, lr: LR_GAP, root: ROOT_GAP }
}

function round1(n) { return Math.round(n * 10) / 10 }

// 树 → 扁平节点 + 折线连线 + 画布尺寸。
// orientation: 'td' 从上到下（层级纵向、同层横向排列）；'lr' 从左到右（层级横向、同层纵向堆叠）。
// 多根支持：td 模式根节点横向并列；lr 模式根节点纵向并列。
function buildOrgLayout(roots, orientation, isCompact) {
  const list = Array.isArray(roots) ? roots : []
  if (!list.length) return null
  const G = gapsFor(!!isCompact)

  const nodes = []
  const connectors = []
  const levelX = [] // lr 模式：每层的 x 坐标（前缀和）
  let width = 0
  let height = 0

  // ---- 度量：td 量子树宽 / lr 量子树高 ----
  function measureTD(node) {
    node._w = nodeWidthOf(node.name)
    if (!node.children.length) { node._tw = node._w; return }
    let sum = 0
    for (const c of node.children) { measureTD(c); sum += c._tw }
    sum += G.hTd * (node.children.length - 1)
    node._tw = Math.max(node._w, sum)
  }
  function measureLR(node) {
    node._w = nodeWidthOf(node.name)
    if (!node.children.length) { node._th = NODE_H; return }
    let sum = 0
    for (const c of node.children) { measureLR(c); sum += c._th }
    sum += G.vrLr * (node.children.length - 1)
    node._th = Math.max(NODE_H, sum)
  }

  function placeTD(node, leftHere, depth) {
    node._d = depth
    node._x = leftHere + (node._tw - node._w) / 2
    node._y = MARGIN + depth * (NODE_H + G.vTd)
    nodes.push(node)
    const kids = node.children
    if (!kids.length) return
    const total = kids.reduce((s, c) => s + c._tw, 0) + G.hTd * (kids.length - 1)
    let cursor = leftHere + (node._tw - total) / 2
    for (const c of kids) {
      placeTD(c, cursor, depth + 1)
      cursor += c._tw + G.hTd
    }
    // 折线连线：父底中 → 层间中线 → 横向母线 → 各子顶中
    const px = node._x + node._w / 2
    const py = node._y + NODE_H
    const midY = py + G.vTd / 2
    const cxs = kids.map((c) => c._x + c._w / 2)
    let d = `M ${round1(px)} ${round1(py)} L ${round1(px)} ${round1(midY)} L ${round1(Math.min(...cxs))} ${round1(midY)} L ${round1(Math.max(...cxs))} ${round1(midY)}`
    for (const c of kids) {
      d += ` M ${round1(c._x + c._w / 2)} ${round1(midY)} L ${round1(c._x + c._w / 2)} ${round1(c._y)}`
    }
    connectors.push(d)
  }

  function placeLR(node, topHere, depth) {
    node._d = depth
    node._x = levelX[depth]
    node._y = topHere + (node._th - NODE_H) / 2
    nodes.push(node)
    const kids = node.children
    if (!kids.length) return
    const total = kids.reduce((s, c) => s + c._th, 0) + G.vrLr * (kids.length - 1)
    let cursor = topHere + (node._th - total) / 2
    for (const c of kids) {
      placeLR(c, cursor, depth + 1)
      cursor += c._th + G.vrLr
    }
    // 折线连线：父右中 → 层间中线 → 纵向母线 → 各子左中
    const py = node._y + NODE_H / 2
    const midX = node._x + node._w + G.lr / 2
    const cys = kids.map((c) => c._y + NODE_H / 2)
    let d = `M ${round1(node._x + node._w)} ${round1(py)} L ${round1(midX)} ${round1(py)} L ${round1(midX)} ${round1(Math.min(...cys))} L ${round1(midX)} ${round1(Math.max(...cys))}`
    for (const c of kids) {
      d += ` M ${round1(midX)} ${round1(c._y + NODE_H / 2)} L ${round1(c._x)} ${round1(c._y + NODE_H / 2)}`
    }
    connectors.push(d)
  }

  if (orientation === 'lr') {
    list.forEach(measureLR)
    // 每层最大节点宽 → 该层 x 坐标（前缀和）
    const levelW = []
    const stack = list.map((r) => ({ n: r, d: 0 }))
    while (stack.length) {
      const { n, d } = stack.shift()
      levelW[d] = Math.max(levelW[d] || 0, n._w)
      for (const c of n.children) stack.push({ n: c, d: d + 1 })
    }
    levelX.length = 0
    let acc = MARGIN
    for (let d = 0; d < levelW.length; d++) {
      levelX[d] = acc
      acc += (levelW[d] || MIN_W) + G.lr
    }
    // 纵向排布：根依次堆叠
    let top = MARGIN
    for (const r of list) {
      placeLR(r, top, 0)
      top += r._th + G.root
    }
    height = top - G.root + MARGIN
    width = acc - G.lr + MARGIN
  } else {
    list.forEach(measureTD)
    let left = MARGIN
    for (const r of list) {
      placeTD(r, left, 0)
      left += r._tw + G.root
    }
    width = left - G.root + MARGIN
    const maxDepth = nodes.reduce((m, n) => Math.max(m, n._d), 0)
    height = MARGIN * 2 + maxDepth * (NODE_H + G.vTd) + NODE_H
  }

  return {
    nodes: nodes.map((n) => ({ name: n.name, depth: n._d, x: n._x, y: n._y, w: n._w, h: NODE_H })),
    connectors,
    width: Math.round(width),
    height: Math.round(height)
  }
}

// 节点配色（固定十六进制色值，导出的 SVG 与打印均可见）
function nodeStyle(depth) {
  if (depth === 0) return { fill: '#2563eb', stroke: '#1d4ed8', text: '#ffffff', weight: '600', size: 13 }
  if (depth === 1) return { fill: '#dbeafe', stroke: '#93c5fd', text: '#1e3a8a', weight: '500', size: 12 }
  return { fill: '#ffffff', stroke: '#cbd5e1', text: '#334155', weight: '400', size: 12 }
}

// 布局 → SVG 字符串（节点名经 escapeXml 转义）
function svgOf(layout) {
  if (!layout || !layout.nodes || !layout.nodes.length) return EMPTY_SVG
  const { nodes, connectors, width, height } = layout
  const parts = []
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="'PingFang SC','Microsoft YaHei',sans-serif">`)
  parts.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>`)
  // 连线（先画，被节点盖住端头更整洁）
  for (const d of connectors) {
    parts.push(`<path d="${d}" fill="none" stroke="#94a3b8" stroke-width="1.5"/>`)
  }
  // 节点
  for (const n of nodes) {
    const st = nodeStyle(n.depth)
    const info = truncateName(n.name, n.w - NODE_PAD_X * 2)
    parts.push(
      `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="8" ry="8" fill="${st.fill}" stroke="${st.stroke}" stroke-width="1"><title>${escapeXml(n.name)}</title></rect>`
    )
    parts.push(
      `<text x="${n.x + n.w / 2}" y="${n.y + n.h / 2 + st.size * 0.35}" font-size="${st.size}" font-weight="${st.weight}" fill="${st.text}" text-anchor="middle">${escapeXml(info.text)}</text>`
    )
  }
  parts.push('</svg>')
  return parts.join('')
}

// 统计：节点数 / 最大层级（根为 1 级）/ 根数
function orgStats(roots) {
  const list = Array.isArray(roots) ? roots : []
  let count = 0
  let maxDepth = 0
  const stack = list.map((r) => ({ n: r, d: 1 }))
  while (stack.length) {
    const { n, d } = stack.pop()
    count += 1
    if (d > maxDepth) maxDepth = d
    for (const c of n.children || []) stack.push({ n: c, d: d + 1 })
  }
  return { nodes: count, depth: maxDepth, roots: list.length }
}

// 示例架构：公司 → 4 部门 → 下属岗位（两级）
const EXAMPLE_TEXT = [
  '总公司',
  '  研发部',
  '    前端组',
  '    后端组',
  '    测试组',
  '  市场部',
  '    品牌策划',
  '    渠道推广',
  '  人力资源部',
  '    招聘专员',
  '    培训专员',
  '  财务部',
  '    会计',
  '    出纳'
].join('\n')

const EXAMPLE_PAIRS_TEXT = [
  '总公司|研发部',
  '总公司|市场部',
  '总公司|人力资源部',
  '总公司|财务部',
  '研发部|前端组',
  '研发部|后端组',
  '研发部|测试组',
  '市场部|品牌策划',
  '市场部|渠道推广',
  '人力资源部|招聘专员',
  '人力资源部|培训专员',
  '财务部|会计',
  '财务部|出纳'
].join('\n')

// ---------- 页面状态与交互 ----------
const INPUT_MODES = [
  { value: 'indent', label: '缩进格式' },
  { value: 'pairs', label: '上级|下级' }
]
const ORIENTATIONS = [
  { value: 'td', label: '从上到下' },
  { value: 'lr', label: '从左到右' }
]
const STORAGE_KEY = 'util:org-chart:v1'

const inputMode = ref('indent')
const orientation = ref('td')
const compact = ref(false)
const orgText = ref('')

// 紧凑模式：间距减半（叶子 > 12 时自动生效，与勾选叠加取更紧值）
function layoutGaps(roots, isCompact) {
  let leafCount = 0
  const stack = (Array.isArray(roots) ? roots : []).map((r) => ({ n: r, d: 1 }))
  let maxDepth = 1
  while (stack.length) {
    const { n, d } = stack.pop()
    if (d > maxDepth) maxDepth = d
    if (!n.children.length) leafCount += 1
    for (const c of n.children) stack.push({ n: c, d: d + 1 })
  }
  const auto = leafCount > 12
  return {
    compact: isCompact || auto,
    leafCount,
    maxDepth
  }
}

const parsed = computed(() => parseOrgText(orgText.value, inputMode.value))
const gaps = computed(() => layoutGaps(parsed.value.roots, compact.value))
const layout = computed(() => buildOrgLayout(parsed.value.roots, orientation.value, gaps.value.compact))
const svgString = computed(() => svgOf(layout.value))
const stats = computed(() => orgStats(parsed.value.roots))
const parseError = computed(() => parsed.value.error)

// ---------- 操作（均为客户端回调，SSR 安全） ----------
function loadExample() {
  orgText.value = inputMode.value === 'pairs' ? EXAMPLE_PAIRS_TEXT : EXAMPLE_TEXT
}

function clearText() {
  orgText.value = ''
}

function copySvg() {
  const text = svgString.value
  const write = async () => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
  }
  write()
    .then(() => alert('已复制'))
    .catch(() => alert('复制失败，请改用「下载 SVG」保存图表'))
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function downloadSvg() {
  if (!layout.value) {
    alert('暂无可下载的架构图，请先输入层级文本或填充示例')
    return
  }
  try {
    triggerDownload(new Blob([svgString.value], { type: 'image/svg+xml;charset=utf-8' }), 'org-chart.svg')
  } catch (error) {
    alert('下载失败：' + (error && error.message ? error.message : error))
  }
}

// PNG 导出：SVG → Image → canvas 2 倍栅格化
function downloadPng() {
  if (!layout.value) {
    alert('暂无可下载的架构图，请先输入层级文本或填充示例')
    return
  }
  try {
    const svg = svgString.value
    const { width, height } = layout.value
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      try {
        const scale = 2
        const canvas = document.createElement('canvas')
        canvas.width = width * scale
        canvas.height = height * scale
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('canvas 不可用')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((b) => {
          if (b) triggerDownload(b, 'org-chart.png')
          else alert('PNG 导出失败，请改用「下载 SVG」')
          URL.revokeObjectURL(url)
        }, 'image/png')
      } catch (e) {
        alert('PNG 导出失败：' + (e && e.message ? e.message : e))
        URL.revokeObjectURL(url)
      }
    }
    img.onerror = () => {
      alert('PNG 导出失败：SVG 解析异常，请改用「下载 SVG」')
      URL.revokeObjectURL(url)
    }
    img.src = url
  } catch (error) {
    alert('下载失败：' + (error && error.message ? error.message : error))
  }
}

function printChart() {
  window.print()
}

// 草稿持久化（localStorage 只在 onMounted 后触达）
function sanitizeDraft(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    text: typeof raw.text === 'string' ? raw.text.slice(0, 20000) : '',
    mode: raw.mode === 'pairs' ? 'pairs' : 'indent',
    orientation: raw.orientation === 'lr' ? 'lr' : 'td',
    compact: !!raw.compact
  }
}

function persistDraft() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      text: orgText.value,
      mode: inputMode.value,
      orientation: orientation.value,
      compact: compact.value
    }))
  } catch (error) {
    // 隐私模式 / 配额不足时静默失败
  }
}

onMounted(() => {
  let draft = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) draft = sanitizeDraft(JSON.parse(raw))
  } catch (error) {
    draft = null
  }
  if (draft) {
    orgText.value = draft.text
    inputMode.value = draft.mode
    orientation.value = draft.orientation
    compact.value = draft.compact
  } else {
    orgText.value = EXAMPLE_TEXT
  }
  // watch 注册在初始赋值之后：恢复 / 首次示例不写入缓存，只跟踪用户后续修改
  watch([orgText, inputMode, orientation, compact], persistDraft)
  addRecentTool('org-chart-generator')
})
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
  .print-area {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  .chart-wrap {
    border: none !important;
    overflow: visible !important;
  }
  body {
    background: #ffffff !important;
  }
}
</style>
