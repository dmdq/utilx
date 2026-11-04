<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <GanttChart class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">甘特图生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">任务表格排期一键生成 SVG 甘特图，今日线、进度内条、按日 / 周 / 月刻度，可下载、复制、打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线甘特图生成工具：在左侧表格里维护任务名称、起止日期与完成进度，右侧实时渲染成横条甘特图——条形长度即工期、红色虚线即今天、深色内条即完成率。
        支持按日 / 按周 / 按月切换时间刻度、导出 SVG 文件、复制 SVG 代码与一键打印，数据仅保存在本地浏览器，5-20 个任务的小项目排期首选。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：任务列表 + 视图设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 no-print">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <GanttChart class="w-5 h-5 mr-2 text-primary" /> 任务列表
          </h2>
          <button
            @click="addTask"
            class="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium inline-flex items-center gap-1 transition"
          >
            <Plus class="w-3.5 h-3.5" /> 添加任务
          </button>
        </div>

        <!-- 单个任务卡片 -->
        <div v-for="(task, index) in tasks" :key="index" class="rounded-lg border border-border bg-muted/30 p-3 space-y-2.5">
          <div class="flex items-center gap-2">
            <input
              v-model="task.name"
              type="text"
              maxlength="40"
              placeholder="任务名称"
              class="h-8 flex-1 min-w-0 px-2 bg-background border border-border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              @click="removeTask(index)"
              class="w-8 h-8 flex-shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition"
              aria-label="删除该任务"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <label class="block">
              <span class="block text-[10px] text-muted-foreground mb-1">开始日期</span>
              <input
                v-model="task.start"
                type="date"
                class="w-full h-8 px-2 bg-background border border-border border-input rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label class="block">
              <span class="block text-[10px] text-muted-foreground mb-1">结束日期</span>
              <input
                v-model="task.end"
                type="date"
                class="w-full h-8 px-2 bg-background border border-border border-input rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model.number="task.progress"
              type="range"
              min="0"
              max="100"
              step="5"
              class="flex-1 accent-primary"
              aria-label="完成进度百分比"
            />
            <span class="w-11 text-right text-xs font-mono text-foreground">{{ task.progress }}%</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button
              v-for="c in PALETTE"
              :key="c"
              @click="task.color = c"
              class="w-4 h-4 rounded-full border border-black/10 transition"
              :class="task.color === c ? 'ring-2 ring-ring' : 'opacity-50 hover:opacity-100'"
              :style="{ backgroundColor: c }"
              :aria-label="'选择颜色 ' + c"
            ></button>
            <span class="text-[10px] text-muted-foreground ml-1">点选换色</span>
          </div>
        </div>

        <p v-if="tasks.length === 0" class="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 text-center">
          暂无任务，点击「添加任务」或右侧「载入示例」开始排期
        </p>

        <!-- 校验提示 -->
        <p v-if="!validation.ok" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ validationText }}</span>
        </p>
        <p v-else-if="tasks.length > 0" class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
          <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>全部 {{ tasks.length }} 个任务校验通过，右侧甘特图已按最新数据渲染。</span>
        </p>

        <!-- 视图设置 -->
        <div class="pt-3 border-t border-border space-y-3">
          <h3 class="text-sm font-medium text-foreground">视图设置</h3>
          <div>
            <p class="text-[10px] text-muted-foreground mb-1.5">时间刻度（仅影响顶部标签密度，条形始终按日精确）</p>
            <div class="flex rounded-lg border border-border overflow-hidden">
              <button
                v-for="opt in SCALE_OPTIONS"
                :key="opt.value"
                @click="scale = opt.value"
                class="flex-1 px-2 py-1.5 text-xs font-medium transition"
                :class="scale === opt.value ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="showToday" type="checkbox" class="h-4 w-4 accent-primary" />
            显示今日线（红色虚线）
          </label>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="showProgress" type="checkbox" class="h-4 w-4 accent-primary" />
            显示进度内条与百分比
          </label>
        </div>
      </div>

      <!-- 右：甘特图（占两列，打印时仅保留本卡片内的图表） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4 print-area">
        <div class="no-print flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <GanttChart class="w-5 h-5 mr-2 text-primary" /> 甘特图预览
          </h2>
          <div class="flex flex-wrap items-center gap-2">
            <button
              @click="loadExample"
              class="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 transition"
            >
              <Play class="w-3.5 h-3.5" /> 载入示例
            </button>
            <button
              @click="clearTasks"
              class="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 transition"
            >
              <RefreshCw class="w-3.5 h-3.5" /> 清空
            </button>
            <button
              @click="copySvg"
              class="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 transition"
            >
              <Copy class="w-3.5 h-3.5" /> 复制 SVG
            </button>
            <button
              @click="downloadSvg"
              class="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 transition"
            >
              <Download class="w-3.5 h-3.5" /> 下载 SVG
            </button>
            <button
              @click="printChart"
              class="px-3 py-1.5 text-xs rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground inline-flex items-center gap-1 transition"
            >
              <Printer class="w-3.5 h-3.5" /> 打印
            </button>
          </div>
        </div>

        <!-- 统计条 -->
        <div class="no-print grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">任务数</p>
            <p class="text-lg font-bold text-foreground">{{ stats.count }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">总跨度</p>
            <p class="text-lg font-bold text-foreground">{{ stats.spanDays }} 天</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">最长任务</p>
            <p class="text-sm font-bold text-foreground truncate" :title="stats.longest">{{ stats.longest }} · {{ stats.longestDays }} 天</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">平均完成进度</p>
            <p class="text-lg font-bold text-primary">{{ stats.avgProgress }}%</p>
          </div>
        </div>

        <!-- 图表（内容由纯函数生成的 SVG 字符串，任务名均经 escapeXml 转义） -->
        <div class="chart-wrap overflow-x-auto rounded-lg border border-border bg-white p-2">
          <div v-html="svgString"></div>
        </div>

        <p class="no-print text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
          <span>
            条形长度 = 任务工期，红色虚线 = 今天，深色内条 = 已完成比例；鼠标悬停条形可查看起止日期。
            时间刻度只影响顶部标签密度，条形位置始终按日精确；图表全部由本地纯函数生成，可放心导出为 SVG 或打印。
          </span>
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>甘特图是什么？适合什么项目？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          甘特图（Gantt Chart）是一种横向条形排期图：每一行代表一个任务，条形的左右两端分别是计划开始与结束日期，条形长度直观对应工期长短。
          它最适合「任务几十个以内、有明确时间先后、需要盯进度」的场景——网站改版、活动筹备、产品上线、装修搬家、毕业设计等，
          一张图就能看清谁在什么时间段做什么、整体里程碑落在哪一天。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么轻量排期不需要重型项目管理工具？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          专业项目管理软件强在依赖关系、资源调配、多人协作与自动排程，但这些能力对 5-20 个任务的小项目来说往往是纯负担：
          注册建空间、学视图概念、维护字段的时间可能比排期本身还长。小项目的真实需求通常只是「把几件事按天铺到时间轴上，贴出来对齐进度」——
          一张表格加一张图就够了。本工具保留甘特图最有用的部分（工期条、今日线、完成率内条），去掉依赖箭头、资源平衡等重型概念，
          打开即用，导出的 SVG 可直接贴进周报、文档或幻灯片。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么读甘特图？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>条形长度 = 工期：条形从开始日期铺到结束日期（含首尾两天），越长代表占用时间越多。</li>
          <li>红色虚线 = 今日线：以「今天」为进度基准。虚线落在某个条形内部，说明该任务正在进行中；虚线已越过条形右端，说明计划时间已用完，需要确认是否逾期。</li>
          <li>深色内条 = 完成率：条形内部从左往右填充的深色部分代表完成进度百分比。内条推进速度与今日线位置对照，即可判断任务是超前还是落后。</li>
          <li>顶部刻度：按日显示日期、按周标出每周一、按月标出每月 1 号；切换刻度只改变标签密度，条形位置始终按日精确。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">本工具数据保存在哪里？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          全部任务数据仅保存在你当前浏览器的 localStorage 中，用于下次打开时恢复上次的任务列表；全程不发送任何网络请求、不上传服务器。
          更换浏览器 / 设备或清除站点数据后列表不会跟随迁移；需要长期留存请使用「下载 SVG」或「复制 SVG」保存图表，清除缓存前也请先自行备份任务内容。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">甘特图适合什么样的项目？</h3>
            <p class="text-sm text-muted-foreground mt-1">适合任务数量几十个以内、按时间铺开就能看清全局的排期场景，如网站改版、活动筹备、产品上线、装修搬家等；当任务间出现复杂依赖关系与多人资源冲突时，再考虑专业项目管理软件。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">5-20 个任务的小项目为什么要用表格排期而不是管理系统？</h3>
            <p class="text-sm text-muted-foreground mt-1">小项目的核心诉求是「把几件事按天铺到时间轴上」，表格加甘特图一分钟就能完成；而重型工具需要建空间、配流程、维护字段，维护成本常常超过排期本身，得不偿失。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">甘特图里的条形、虚线和内条分别表示什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">条形长度代表任务工期（起止日期含首尾）；红色虚线是今日线，作为进度基准；条内深色子条代表完成率，与今日线对照即可判断任务是超前还是落后于计划。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">用这个工具做的排期数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。任务列表只保存在当前浏览器的 localStorage 里，图表全部由本地纯函数生成；清除浏览器站点数据会丢失任务列表，长期保存请下载或复制 SVG。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'gantt-chart-maker'" :category="'others'" class="no-print" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  GanttChart, CheckCircle, TriangleAlert, Copy, Download, Printer,
  RefreshCw, ChevronUp, ChevronDown, Info, Plus, X, Play
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '甘特图生成器 - 在线项目排期图表制作工具',
  description: '免费在线甘特图生成器：任务表格排期一键生成 SVG 甘特图，支持起止日期、完成进度百分比、今日线、进度内条，按日/按周/按月刻度切换，可下载 SVG、复制代码与打印，纯浏览器本地运行不上传',
  keywords: '甘特图,甘特图生成器,甘特图制作,在线甘特图,项目排期,项目进度管理,任务排期工具,排期图表',
  author: '有条工具',
  ogTitle: '甘特图生成器 - 在线项目排期图表制作工具 | 有条工具',
  ogDescription: '任务表格排期一键生成 SVG 甘特图，今日线、进度内条、多刻度切换，支持下载 / 复制 / 打印。',
  ogUrl: 'https://www.util.cn/tools/gantt-chart-maker',
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
          name: '甘特图生成器',
          url: 'https://www.util.cn/tools/gantt-chart-maker',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['任务增删改与进度百分比', '6 色任务色板自动轮换', '按日/按周/按月刻度切换', '今日线与进度内条开关', 'SVG 下载与代码复制', '打印导出与本地保存不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '甘特图生成器', item: 'https://www.util.cn/tools/gantt-chart-maker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '甘特图适合什么样的项目？',
              acceptedAnswer: { '@type': 'Answer', text: '适合任务数量几十个以内、按时间铺开就能看清全局的排期场景，如网站改版、活动筹备、产品上线、装修搬家等；当任务间出现复杂依赖关系与多人资源冲突时，再考虑专业项目管理软件。' }
            },
            {
              '@type': 'Question',
              name: '5-20个任务的小项目为什么要用表格排期而不是管理系统？',
              acceptedAnswer: { '@type': 'Answer', text: '小项目的核心诉求是把几件事按天铺到时间轴上，表格加甘特图一分钟就能完成；而重型工具需要建空间、配流程、维护字段，维护成本常常超过排期本身。' }
            },
            {
              '@type': 'Question',
              name: '甘特图里的条形、虚线和内条分别表示什么？',
              acceptedAnswer: { '@type': 'Answer', text: '条形长度代表任务工期（起止日期含首尾）；红色虚线是今日线，作为进度基准；条内深色子条代表完成率，与今日线对照即可判断任务是超前还是落后于计划。' }
            },
            {
              '@type': 'Question',
              name: '用这个工具做的排期数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。任务列表只保存在当前浏览器的 localStorage 里，图表全部由本地纯函数生成；清除浏览器站点数据会丢失任务列表，长期保存请下载或复制 SVG。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 6 色任务色板（新增任务按下标自动轮换，可点选改）
const PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']
// SVG 几何常量
const DAY_W = 28      // 每天列宽 px
const LEFT_W = 140    // 左侧名称列宽 px
const ROW_H = 32      // 任务行高 px
const BAR_H = 18      // 条形高 px
const HEAD_H = 36     // 顶部刻度行高 px
const RIGHT_PAD = 12  // 图表右侧留白 px
const PAD_BOTTOM = 16 // 底部留白 px
const DAY_MS = 86400000

// 示例排期（from/to 为相对「今天」的天数偏移，覆盖前后两周）
const EXAMPLE_PLAN = [
  { name: '需求梳理', from: -12, to: -8, progress: 100 },
  { name: '方案设计', from: -7, to: -3, progress: 80 },
  { name: '开发', from: -2, to: 6, progress: 45 },
  { name: '测试', from: 7, to: 11, progress: 0 },
  { name: '上线', from: 12, to: 13, progress: 0 }
]

// 空状态占位图（无有效任务时返回）
const EMPTY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="150" viewBox="0 0 640 150" font-family="'PingFang SC','Microsoft YaHei',sans-serif"><rect width="640" height="150" fill="#ffffff"/><text x="320" y="70" font-size="14" fill="#94a3b8" text-anchor="middle">暂无有效任务</text><text x="320" y="94" font-size="12" fill="#cbd5e1" text-anchor="middle">在左侧添加任务，或点击「载入示例」快速开始</text></svg>`

// 严格解析 YYYY-MM-DD，返回 UTC 零点 Date；格式或日期不存在时返回 null
function parseDate(s) {
  if (typeof s !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const y = +m[1]
  const mo = +m[2]
  const d = +m[3]
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, mo - 1, d))
  // 回读校验：拦截 2026-02-30 这类「格式合法但不存在」的日期
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
  return dt
}

// Date → YYYY-MM-DD（统一 UTC 口径）
function formatDate(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}

// 加 n 天（UTC 口径，无时区漂移）
function addDays(d, n) {
  return new Date(d.getTime() + n * DAY_MS)
}

// 取「本地今天」的年月日，再转成 UTC 零点，用于与任务日期统一比较口径
function localTodayUtc(now) {
  const d = now || new Date()
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

// 整数天数差 b - a（双方先归一到各自的 UTC 零点再相减）
function daysBetween(a, b) {
  const ua = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate())
  const ub = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate())
  return Math.round((ub - ua) / DAY_MS)
}

// 进度百分比钳制到 [0, 100]，非法输入按 0 处理
function clampPercent(v) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}

// 校验任务列表：名称空、日期非法、end < start；index 为在原数组中的下标
function validateTasks(tasks) {
  const errors = []
  const list = Array.isArray(tasks) ? tasks : []
  list.forEach((t, index) => {
    const task = t || {}
    const name = typeof task.name === 'string' ? task.name.trim() : ''
    if (!name) errors.push({ index, reason: '任务名称为空' })
    const s = parseDate(task.start)
    const e = parseDate(task.end)
    if (!s) errors.push({ index, reason: '开始日期非法（应为 YYYY-MM-DD）' })
    if (!e) errors.push({ index, reason: '结束日期非法（应为 YYYY-MM-DD）' })
    if (s && e && e.getTime() < s.getTime()) errors.push({ index, reason: '结束日期早于开始日期' })
  })
  return { ok: errors.length === 0, errors }
}

// 计算甘特图布局：min/max 覆盖所有合法任务；max 至少为 min + 1 天（防止零宽图）
function buildGanttLayout(tasks) {
  const list = Array.isArray(tasks) ? tasks : []
  const valid = []
  list.forEach((task, index) => {
    const s = parseDate(task && task.start)
    const e = parseDate(task && task.end)
    if (s && e) valid.push({ task: task || {}, index, s, e })
  })
  if (!valid.length) return null

  let min = valid[0].s
  let max = valid[0].e
  for (const v of valid) {
    if (v.s.getTime() < min.getTime()) min = v.s
    if (v.e.getTime() > max.getTime()) max = v.e
  }
  if (max.getTime() - min.getTime() < DAY_MS) max = addDays(min, 1)

  // totalDays = 图表覆盖的天数（含首尾两端的列数），恒 >= 2
  const totalDays = daysBetween(min, max) + 1
  const rows = valid.map((v) => ({
    task: v.task,
    index: v.index,
    offsetDays: Math.max(0, daysBetween(min, v.s)),
    spanDays: Math.max(1, daysBetween(v.s, v.e) + 1) // 起止含首尾
  }))
  return { minDate: min, maxDate: max, totalDays, rows }
}

// 刻度间隔：按日 ≤14 天每 1 天 / ≤60 每 7 天 / 其余每 14 天；按周固定每周一；按月每月 1 号
function pickTickStep(totalDays, scale) {
  if (scale === 'week') return { unit: 'week', step: 1 }   // 每周一
  if (scale === 'month') return { unit: 'month', step: 1 } // 每月 1 号
  if (totalDays <= 14) return { unit: 'day', step: 1 }
  if (totalDays <= 60) return { unit: 'day', step: 7 }
  return { unit: 'day', step: 14 }
}

// XML/HTML 文本节点转义（任务名进入 SVG 前必须调用）
function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// 按像素宽度估算截断任务名（CJK 约 12px/字，其余约 6.6px/字，字号 12）
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

// 收集刻度点：[{ d: 天序号, label }]；无命中时回退到首日，保证图表永远有标签
function collectTicks(minDate, totalDays, step) {
  const ticks = []
  for (let d = 0; d < totalDays; d++) {
    const date = addDays(minDate, d)
    let hit = false
    let label = ''
    if (step.unit === 'week') {
      hit = date.getUTCDay() === 1
      label = `${date.getUTCMonth() + 1}/${date.getUTCDate()}`
    } else if (step.unit === 'month') {
      hit = date.getUTCDate() === 1
      label = (ticks.length === 0 || date.getUTCMonth() === 0)
        ? `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月`
        : `${date.getUTCMonth() + 1}月`
    } else {
      hit = d % step.step === 0
      label = `${date.getUTCMonth() + 1}/${date.getUTCDate()}`
    }
    if (hit) ticks.push({ d, label: escapeXml(label) })
  }
  if (!ticks.length) {
    ticks.push({
      d: 0,
      label: escapeXml(
        step.unit === 'month'
          ? `${minDate.getUTCFullYear()}年${minDate.getUTCMonth() + 1}月`
          : `${minDate.getUTCMonth() + 1}/${minDate.getUTCDate()}`
      )
    })
  }
  return ticks
}

// 生成 SVG 字符串：左侧 140px 名称列 + totalDays×28px 时间轴；任务名经 escapeXml 转义
function svgOf(layout, tasks, opts) {
  const options = opts || {}
  const scale = options.scale || 'day'
  const showToday = !!options.showToday
  const showProgress = !!options.showProgress
  if (!layout || !layout.rows || !layout.rows.length) return EMPTY_SVG

  const taskList = Array.isArray(tasks) ? tasks : []
  const { minDate, totalDays, rows } = layout
  const chartW = totalDays * DAY_W
  const svgW = LEFT_W + chartW + RIGHT_PAD
  const bodyH = rows.length * ROW_H
  const svgH = HEAD_H + bodyH + PAD_BOTTOM
  const parts = []

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" font-family="'PingFang SC','Microsoft YaHei',sans-serif">`)
  // 白底（打印友好）
  parts.push(`<rect x="0" y="0" width="${svgW}" height="${svgH}" fill="#ffffff"/>`)
  // 隔行底色
  for (let i = 1; i < rows.length; i += 2) {
    parts.push(`<rect x="0" y="${HEAD_H + i * ROW_H}" width="${svgW}" height="${ROW_H}" fill="#f8fafc"/>`)
  }

  // 顶部刻度
  const step = pickTickStep(totalDays, scale)
  const ticks = collectTicks(minDate, totalDays, step)
  for (const tk of ticks) {
    const x = LEFT_W + tk.d * DAY_W
    parts.push(`<line x1="${x}" y1="${HEAD_H}" x2="${x}" y2="${HEAD_H + bodyH}" stroke="#e2e8f0" stroke-width="1"/>`)
  }
  // 时间轴右边界
  parts.push(`<line x1="${LEFT_W + chartW}" y1="${HEAD_H}" x2="${LEFT_W + chartW}" y2="${HEAD_H + bodyH}" stroke="#e2e8f0" stroke-width="1"/>`)

  // 条形 + 进度内条
  rows.forEach((row, i) => {
    const yCenter = HEAD_H + i * ROW_H + ROW_H / 2
    const task = row.task || taskList[row.index] || {}
    const rawName = task.name == null || task.name === '' ? '未命名' : String(task.name)
    const color = PALETTE.includes(task.color) ? task.color : PALETTE[0]
    const progress = clampPercent(task.progress)

    const barX = LEFT_W + row.offsetDays * DAY_W + 2
    const barW = Math.max(4, row.spanDays * DAY_W - 4)
    const barY = yCenter - BAR_H / 2
    const startIso = formatDate(addDays(minDate, row.offsetDays))
    const endIso = formatDate(addDays(minDate, row.offsetDays + row.spanDays - 1))

    parts.push(`<rect x="${barX}" y="${barY}" width="${barW}" height="${BAR_H}" rx="6" ry="6" fill="${color}"><title>${escapeXml(`${rawName}：${startIso} ~ ${endIso} · ${row.spanDays} 天 · 完成 ${progress}%`)}</title></rect>`)
    if (showProgress && progress > 0) {
      const pw = Math.min(barW, (barW * progress) / 100)
      parts.push(`<rect x="${barX}" y="${barY}" width="${pw.toFixed(1)}" height="${BAR_H}" rx="4" ry="4" fill="rgba(15,23,42,0.45)"/>`)
    }
    if (showProgress && barX + barW + 34 <= LEFT_W + chartW) {
      parts.push(`<text x="${barX + barW + 6}" y="${yCenter + 3.5}" font-size="10" fill="#64748b">${progress}%</text>`)
    }
  })

  // 今日线（仅当今天落在图表范围内时绘制）
  if (showToday) {
    const today = localTodayUtc()
    const diff = daysBetween(minDate, today)
    if (diff >= 0 && diff < totalDays) {
      const x = LEFT_W + (diff + 0.5) * DAY_W
      parts.push(`<line x1="${x}" y1="${HEAD_H}" x2="${x}" y2="${HEAD_H + bodyH}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="5 3"/>`)
      const tx = Math.min(Math.max(x, LEFT_W + 14), LEFT_W + chartW - 14)
      parts.push(`<text x="${tx}" y="${HEAD_H - 3}" font-size="9" fill="#ef4444" text-anchor="middle">${escapeXml('今日')}</text>`)
    }
  }

  // 左列任务名（超长截断 + title 提示全名）
  rows.forEach((row, i) => {
    const yCenter = HEAD_H + i * ROW_H + ROW_H / 2
    const rawName = row.task && row.task.name != null && row.task.name !== '' ? String(row.task.name) : '未命名'
    const info = truncateName(rawName, LEFT_W - 22)
    parts.push(`<text x="${LEFT_W - 10}" y="${yCenter + 4}" font-size="12" fill="#334155" text-anchor="end">${escapeXml(info.text)}<title>${escapeXml(rawName)}</title></text>`)
  })

  // 刻度文字
  const tickFontSize = step.unit === 'day' && step.step === 1 ? 9 : 10
  for (const tk of ticks) {
    parts.push(`<text x="${LEFT_W + tk.d * DAY_W + 3}" y="24" font-size="${tickFontSize}" fill="#64748b">${tk.label}</text>`)
  }

  // 表头与名称列分隔线
  parts.push(`<line x1="0" y1="${HEAD_H}" x2="${svgW}" y2="${HEAD_H}" stroke="#cbd5e1" stroke-width="1"/>`)
  parts.push(`<line x1="${LEFT_W}" y1="0" x2="${LEFT_W}" y2="${HEAD_H + bodyH}" stroke="#cbd5e1" stroke-width="1"/>`)
  parts.push('</svg>')
  return parts.join('')
}

// 生成相对「今天」的 5 个示例任务（覆盖前后两周）
function makeExampleTasks(today) {
  const base = today || localTodayUtc()
  return EXAMPLE_PLAN.map((item, i) => ({
    name: item.name,
    start: formatDate(addDays(base, item.from)),
    end: formatDate(addDays(base, item.to)),
    progress: item.progress,
    color: PALETTE[i % PALETTE.length]
  }))
}

// ---------- 页面状态与交互 ----------
const SCALE_OPTIONS = [
  { value: 'day', label: '按日' },
  { value: 'week', label: '按周' },
  { value: 'month', label: '按月' }
]
const STORAGE_KEY = 'util:gantt-tasks'
// 仅用于服务端首屏占位的固定锚点日期；onMounted 后会被本地缓存或相对今天的示例替换，避免 SSR/客户端 hydration 不一致
const SSR_ANCHOR_TODAY = '2026-10-31'

const seoContentVisible = ref(true)
const isMounted = ref(false)
const scale = ref('day')
const showToday = ref(true)
const showProgress = ref(true)
const tasks = ref(makeExampleTasks(parseDate(SSR_ANCHOR_TODAY)))

const validation = computed(() => validateTasks(tasks.value))
const validationText = computed(() =>
  validation.value.errors.map((e) => `第 ${e.index + 1} 项：${e.reason}`).join('；')
)
const layout = computed(() => buildGanttLayout(tasks.value))
const svgString = computed(() =>
  svgOf(layout.value, tasks.value, {
    scale: scale.value,
    // isMounted 门控：SSR 与客户端首次渲染都不画今日线（今天由运行时决定），挂载后再补画，避免 hydration 不一致
    showToday: showToday.value && isMounted.value,
    showProgress: showProgress.value
  })
)
const stats = computed(() => {
  const list = tasks.value
  const avg = list.length
    ? Math.round(list.reduce((sum, t) => sum + clampPercent(t && t.progress), 0) / list.length)
    : 0
  const l = layout.value
  if (!l) {
    return { count: list.length, spanDays: 0, longest: '—', longestDays: 0, avgProgress: avg }
  }
  const longest = l.rows.reduce((a, b) => (b.spanDays > a.spanDays ? b : a))
  return {
    count: list.length,
    spanDays: l.totalDays,
    longest: (longest.task && longest.task.name) || '未命名',
    longestDays: longest.spanDays,
    avgProgress: avg
  }
})

// ---------- 操作（均为客户端回调，SSR 安全） ----------
function addTask() {
  const base = localTodayUtc()
  tasks.value.push({
    name: `新任务 ${tasks.value.length + 1}`,
    start: formatDate(base),
    end: formatDate(addDays(base, 2)),
    progress: 0,
    color: PALETTE[tasks.value.length % PALETTE.length]
  })
}

function removeTask(index) {
  tasks.value.splice(index, 1)
}

function loadExample() {
  tasks.value = makeExampleTasks()
}

function clearTasks() {
  tasks.value = []
}

// 从缓存恢复的单条任务做字段收敛，防止脏数据进入图表
function sanitizeTask(raw) {
  if (!raw || typeof raw !== 'object') return null
  const name = typeof raw.name === 'string' ? raw.name.slice(0, 40) : ''
  const start = typeof raw.start === 'string' && parseDate(raw.start) ? raw.start : ''
  const end = typeof raw.end === 'string' && parseDate(raw.end) ? raw.end : ''
  const progress = clampPercent(raw.progress)
  const color = PALETTE.includes(raw.color) ? raw.color : PALETTE[0]
  return { name, start, end, progress, color }
}

function persistTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.value))
  } catch (error) {
    // 隐私模式 / 配额不足时静默失败，不影响页面功能
  }
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
    .then(() => alert('已复制 SVG 代码，可粘贴到任意支持 SVG 的编辑器或文档中'))
    .catch(() => alert('复制失败，请改用「下载 SVG」保存图表'))
}

function downloadSvg() {
  if (!layout.value) {
    alert('暂无可下载的甘特图，请先添加任务或载入示例')
    return
  }
  try {
    const blob = new Blob([svgString.value], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'gantt.svg'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (error) {
    alert('下载失败：' + (error && error.message ? error.message : error))
  }
}

function printChart() {
  window.print()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  isMounted.value = true
  let restored = []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) restored = parsed.map(sanitizeTask).filter(Boolean)
    }
  } catch (error) {
    restored = []
  }
  tasks.value = restored.length ? restored : makeExampleTasks()
  // watch 注册在初始赋值之后：恢复 / 首次示例不写入缓存，只跟踪用户后续修改
  watch(tasks, persistTasks, { deep: true })
  addRecentTool('gantt-chart-maker')
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
