<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <CalendarDays class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">可打印日历</h1>
          <p class="text-sm text-muted-foreground mt-1">月历 / 年历一键打印，A4 竖版单页排版，含农历与二十四节气标注</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线可打印日历模板：月历视图单页大格、适合手写备注，年历视图一页排下全年 12 个月；周一起始或周日起始可切换，
        可标注农历日期与闰月、二十四节气、今日高亮与周末底色，打印时自动隐藏页面装饰只留日历。
        全部排版在浏览器本地生成，无需注册、无水印，打印预览即所得。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 print-tight">
      <!-- 左：设置面板 -->
      <div class="no-print bg-card border border-border rounded-lg p-6 space-y-4 h-fit">
        <h2 class="text-lg font-semibold flex items-center">
          <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 打印设置
        </h2>

        <!-- 周起始 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">周起始</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="weekStart = 1"
              :class="segClass(weekStart === 1)"
              class="py-2 rounded-lg text-sm font-medium transition"
            >周一</button>
            <button
              @click="weekStart = 0"
              :class="segClass(weekStart === 0)"
              class="py-2 rounded-lg text-sm font-medium transition"
            >周日</button>
          </div>
        </div>

        <!-- 显示开关 -->
        <div class="space-y-2.5 pt-1">
          <label class="flex items-center justify-between gap-3 text-sm text-foreground cursor-pointer">
            <span>显示农历<span class="text-xs text-muted-foreground ml-1">（1900-2100）</span></span>
            <input v-model="showLunar" type="checkbox" class="w-4 h-4 rounded border border-border flex-shrink-0">
          </label>
          <label class="flex items-center justify-between gap-3 text-sm text-foreground cursor-pointer">
            <span>显示节气<span class="text-xs text-muted-foreground ml-1">（精确到天）</span></span>
            <input v-model="showTerm" type="checkbox" class="w-4 h-4 rounded border border-border flex-shrink-0">
          </label>
          <label class="flex items-center justify-between gap-3 text-sm text-foreground cursor-pointer">
            <span>今日高亮</span>
            <input v-model="showToday" type="checkbox" class="w-4 h-4 rounded border border-border flex-shrink-0">
          </label>
          <label class="flex items-center justify-between gap-3 text-sm text-foreground cursor-pointer">
            <span>备注栏<span class="text-xs text-muted-foreground ml-1">（加大行高、加宽周末列）</span></span>
            <input v-model="noteSpace" type="checkbox" class="w-4 h-4 rounded border border-border flex-shrink-0">
          </label>
        </div>

        <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
          <CheckCircle class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
          <span>打印时在系统对话框勾选「背景图形」，周末底色与今日高亮才会被印出；A4 竖版与 10mm 页边距已在页面内置，无需再调。</span>
        </p>

        <button
          @click="resetSettings"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置设置
        </button>

        <p class="text-xs text-muted-foreground leading-relaxed">
          本工具视图无状态：不保存、不上传任何数据，刷新页面即恢复默认设置。
        </p>
      </div>

      <!-- 右：日历区（打印时仅保留此块） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4 print-area">
        <!-- 工具条（不打印） -->
        <div class="no-print flex flex-wrap items-center gap-2">
          <div class="flex rounded-lg border border-border overflow-hidden flex-shrink-0">
            <button
              @click="setViewMode('month')"
              :class="segClass(viewMode === 'month')"
              class="px-3 py-1.5 text-sm font-medium transition"
            >月历</button>
            <button
              @click="setViewMode('year')"
              :class="segClass(viewMode === 'year')"
              class="px-3 py-1.5 text-sm font-medium transition"
            >年历</button>
          </div>

          <button
            @click="stepView(-1)"
            class="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition"
            :aria-label="viewMode === 'month' ? '上一月' : '上一年'"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="text-lg font-bold text-foreground min-w-[6.5rem] text-center">{{ viewTitle }}</span>
          <button
            @click="stepView(1)"
            class="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition"
            :aria-label="viewMode === 'month' ? '下一月' : '下一年'"
          >
            <ChevronRight class="w-4 h-4" />
          </button>

          <div class="flex items-center gap-1.5">
            <input
              v-model.number="yearInput"
              type="number"
              min="1900"
              max="2100"
              class="w-24 px-2.5 py-1.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="跳转到指定年份（1900-2100）"
              @change="applyYearJump"
            >
            <span class="text-sm text-muted-foreground">年</span>
          </div>

          <button
            @click="goToday"
            class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-sm font-medium text-foreground transition"
          >
            {{ goTodayLabel }}
          </button>

          <button
            @click="printCalendar"
            class="ml-auto px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition flex items-center gap-1.5"
          >
            <Printer class="w-4 h-4" /> 打印
          </button>
        </div>

        <!-- 日历主体 -->
        <div v-if="ready">
          <!-- 标题（屏幕与打印同构） -->
          <div class="text-center mb-4">
            <p class="print-title text-2xl font-bold text-foreground">{{ viewTitle }}</p>
            <p class="text-sm text-muted-foreground mt-1">
              {{ viewMode === 'month' ? monthLunarLabel : viewYear + ' 年年历 · 全年 12 个月一页' }}
            </p>
          </div>

          <!-- 月历视图：6 行 7 列 -->
          <div
            v-if="viewMode === 'month'"
            class="grid gap-px bg-border border border-border rounded-lg overflow-hidden select-none"
            :style="{ gridTemplateColumns: colTemplate }"
          >
            <div
              v-for="(name, hi) in weekHeaderNames"
              :key="'wh' + hi"
              class="print-month-head bg-muted text-center text-xs sm:text-sm font-medium text-muted-foreground py-2"
            >{{ name }}</div>

            <div
              v-for="cell in monthViewCells"
              :key="cell.date"
              class="print-month-cell flex flex-col items-start p-1.5 sm:p-2"
              :class="[
                cell.weekend ? 'bg-muted/50' : 'bg-card',
                cell.inMonth ? '' : 'opacity-40',
                noteSpace ? 'min-h-[112px] sm:min-h-[136px]' : 'min-h-[84px] sm:min-h-[100px]',
                isTodayCell(cell) ? 'ring-2 ring-inset ring-primary bg-primary/10' : ''
              ]"
            >
              <span
                class="print-month-day text-base sm:text-xl font-bold leading-none"
                :class="cell.weekend ? 'text-red-500' : 'text-foreground'"
              >{{ cell.day }}</span>
              <span
                v-if="cell.lunarText"
                class="print-month-sub mt-1 text-[10px] sm:text-xs leading-tight text-left"
                :class="lunarTextClass(cell.lunarKind)"
              >{{ cell.lunarText }}</span>
            </div>
          </div>

          <!-- 年历视图：12 个月小网格（3 列 × 4 行） -->
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div
              v-for="(grid, gi) in yearViewGrids"
              :key="'ym' + gi"
              class="print-year-block border border-border rounded-lg p-2"
            >
              <p class="text-center text-sm font-semibold text-foreground mb-1.5">{{ gi + 1 }}月</p>
              <div class="grid grid-cols-7 gap-px bg-border border border-border rounded overflow-hidden">
                <span
                  v-for="(name, hi) in weekHeaderNames"
                  :key="'yh' + gi + '-' + hi"
                  class="bg-muted text-center text-[9px] leading-4 text-muted-foreground font-medium"
                >{{ name }}</span>
                <div
                  v-for="(cell, ci) in grid"
                  :key="'yc' + gi + '-' + ci"
                  class="text-center"
                  :class="cell.weekend ? 'bg-muted/50' : 'bg-card'"
                >
                  <span
                    v-if="cell.inMonth"
                    class="print-year-day inline-block min-w-[14px] rounded-full text-[10px] leading-4 my-0.5 font-medium"
                    :class="isTodayCell(cell) ? 'bg-primary text-primary-foreground' : (cell.weekend ? 'text-red-500' : 'text-foreground')"
                  >{{ cell.day }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="py-20 text-center text-muted-foreground text-sm">
          正在生成本月日历…
        </div>

        <!-- 静态提示条 -->
        <p class="no-print text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5 bg-muted/60 rounded-lg p-3">
          <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span>农历与节气由内置历法表换算（1900-2100 年），节气精确到天（按通行的 UTC+8 时刻表口径），个别年份闰月排列以万年历为准。</span>
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="no-print relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>可打印日历是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          可打印日历是一款在线日历打印工具。它按你选择的年份与月份在浏览器里直接排出版式：月历视图固定 6 行 7 列、
          单元格大而留白多，适合打印后手写日程；年历视图把全年 12 个月排成 3 列 × 4 行的小网格，一张 A4 纵向纸就能印下全年。
          每个日期格可同时标注公历日、农历日（初一显示月名如「三月」）、二十四节气、周末底色与今日高亮，
          周起始可按习惯选周一或周日。点击「打印」后页面会自动隐藏设置与说明区，只把日历交给打印机。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么打印一个月历（步骤与 A4 设置）？</h3>
        <ol class="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground mb-4">
          <li>打开本页默认显示当年当月的月历，用左右箭头翻月，或在年份输入框里直接跳转（支持 1900-2100 年）。</li>
          <li>在左侧「打印设置」里选择周起始（周一 / 周日），按需打开农历、节气、今日高亮与备注栏。</li>
          <li>点右上角「打印」按钮（或按 Ctrl / ⌘ + P），若想要全年一页，先切到「年历」视图再打印。</li>
          <li>打印对话框中纸张选 A4、方向选纵向——页面已内置 A4 竖版与 10mm 页边距，无需手动设置页边距。</li>
          <li>如需保留周末底色与今日高亮，勾选对话框里的「背景图形」；追求省墨可以不勾，版式不受影响。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">2026 年有哪些假期？</h3>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          本页刻意不内置任何年份的假期表：法定节假日与调休安排由国务院办公厅在每年第四季度发布次年安排，年年不同，
          把某一年的放假表硬编码进日历很快就会过期出错。想知道 2026 年（或任意年份）哪个假期放几天、怎么拼假、
          该补哪天的班，请使用站内<NuxtLink to="/tools/holiday-calculator" class="text-primary hover:underline">节假日计算器</NuxtLink>按最新公告口径查询；
          本页日历只标注周六周日、农历与节气。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">农历和阴历是一回事吗？</h3>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          严格说不是。阴历（太阴历）只按月相定月，一年约 354 天，与四季脱节；而农历是阴阳合历——按朔望月定月的长短，
          又按节气与中气设置闰月（约十九年七闰）把年平均长度拉回回归年，再用干支纪年纪日。所以民间把农历叫「阴历」只是习惯说法，
          它其实带着一套阳历骨架（节气）做校准。本页农历标注由内置 1900-2100 年压缩历表换算，含闰月标志。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">节气是什么、怎么定的？</h3>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          二十四节气按太阳黄经划分：太阳在黄道上每运行 15° 定为一个节气，360° 共 24 个，立春为 315°、春分为 0°、夏至为 90°、秋分为 180°。
          因为纯粹跟着太阳走，节气在公历中的日期每年只在一两天内浮动（如立春总在 2 月 3 日或 4 日）。
          本页按通行的 UTC+8（北京时间）时刻口径，把节气时刻落到日历上的具体某一天。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">日历能加自己的备注吗？</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          可以，但方式是「打印后手写」。打开「备注栏」开关，月历会加大每行高度并加宽周末两列，留出书写空间。
          本工具刻意不做在线备注：视图无状态、不写入任何存储，刷新即恢复默认，避免你的日程与隐私内容残留在浏览器里；
          打印出来的纸，才是它的「存储介质」。
        </p>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'printable-calendar'" :category="'time'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  CalendarDays, Printer, ChevronLeft, ChevronRight,
  CheckCircle, ChevronUp, ChevronDown, Info, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '可打印日历 - 2026月历/年历A4打印模板（含农历与节气）',
  description: '免费在线可打印日历：月历、年历双视图一键打印，A4 竖版单页排版，周一起始/周日起始可切换，内置农历日期、闰月与二十四节气标注（1900-2100），今日高亮与手写备注栏，打印即所得，纯本地运行不上传',
  keywords: '可打印日历,月历打印,2026日历,年历模板,农历日历',
  author: '有条工具',
  ogTitle: '可打印日历 - 月历/年历A4打印模板（含农历与节气）',
  ogDescription: '月历大格手写、年历一页全年，农历与节气精确标注，A4 竖版一键打印。',
  ogUrl: 'https://www.util.cn/tools/printable-calendar',
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
          name: '可打印日历',
          url: 'https://www.util.cn/tools/printable-calendar',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['月历/年历双视图', '周一起始与周日起始切换', '农历日期与闰月标注（1900-2100）', '二十四节气精确到天', '今日高亮与周末底色', '备注栏手写空间', 'A4 竖版一页打印', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '时间日期', item: 'https://www.util.cn/time/' },
            { '@type': 'ListItem', position: 3, name: '可打印日历', item: 'https://www.util.cn/tools/printable-calendar/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '怎么打印一个月历？',
              acceptedAnswer: { '@type': 'Answer', text: '选好年月与周起始、农历/节气/备注栏等选项后点「打印」或 Ctrl/⌘+P，纸张选 A4、方向选纵向（页面已内置 A4 竖版与 10mm 页边距），需要底色时勾选「背景图形」；年历视图可一页打印全年 12 个月。' }
            },
            {
              '@type': 'Question',
              name: '2026 年有哪些假期？',
              acceptedAnswer: { '@type': 'Answer', text: '法定节假日与调休由国务院办公厅每年第四季度发布次年安排，年年不同，本页不硬编码假期表；日历只标注周六周日、农历与节气，具体放假安排请用站内节假日计算器按最新公告查询。' }
            },
            {
              '@type': 'Question',
              name: '农历和阴历是一回事吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。阴历只按月相定月；农历是阴阳合历，按朔望月定月、按节气与中气置闰（约十九年七闰），并用干支纪年，民间习惯把农历叫阴历。' }
            },
            {
              '@type': 'Question',
              name: '节气是什么、怎么定的？',
              acceptedAnswer: { '@type': 'Answer', text: '二十四节气按太阳黄经划分，每 15° 一个节气共 24 个（立春 315°、春分 0°、夏至 90°、秋分 180°），属阳历范畴；本页按通行的 UTC+8 时刻口径把节气落到具体某天。' }
            },
            {
              '@type': 'Question',
              name: '日历能加自己的备注吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以打印后手写：打开备注栏开关会加大行高并加宽周末列留出书写空间。本工具刻意不做在线备注，视图无状态、不保存数据，刷新即恢复默认。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 农历 1900-2100 年压缩数据表：每年一个十六进制数。
// 低 4 位 = 闰月月份（0 表示该年无闰月）；bit16（0x10000）= 闰月大小（1 为 30 天）；
// bit5-bit16（0x8000 递减到 0x10）依次表示正月至腊月是否大月（30 天）。
// 复制自站内 src/pages/tools/lunar-birthday-reminder.vue（公开流传并经广泛校验的经典农历数据口径，
// Jea杨 calendar.js 同源 lunarInfo），锚点：农历1900年正月初一 = 公历1900年1月31日。
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
  0x06566, 0x0d4a0, 0x0ea50, 0x16a95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06aa0, 0x1a6c4, 0x0aae0, // 2050-2059
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090-2099
  0x0d520 // 2100
]

// 农历月名、日期名与干支（随上表同源复制）
const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const MONTH_CN = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']

// 二十四节气通用算法（1900-2100，UTC+8 口径，与上表同属经典 calendar.js 数据家族）：
// 以回归年长度 31556925974.7ms 为基，加第 n 个节气的世纪内偏移，锚点 1900-01-06 02:05（北京时间）。
// 站内 solar-term-calculator.vue 仅含固定日期近似表（自注 ±1-2 天误差），不满足本页「精确到天」要求，故未照抄。
const S_TERM_INFO = [
  0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551, 218072, 240693,
  263343, 285989, 308563, 331033, 353350, 375494, 397447, 419210, 440795, 462224, 483532, 504758
]
// 节气名按 n 排列：n=0,1 在 1 月（小寒、大寒），n=2,3 在 2 月（立春、雨水），依此类推
const TERM_NAMES = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑',
  '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
]

// 农历 y 年闰哪个月（0=无闰月）
function leapMonth(y) {
  return LUNAR_INFO[y - 1900] & 0xf
}

// 农历 y 年闰月天数（无闰月为 0）
function leapDays(y) {
  return leapMonth(y) ? ((LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29) : 0
}

// 农历 y 年 m 月（平月）天数
function monthDays(y, m) {
  if (m > 12 || m < 1) return -1
  return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29
}

// 农历 y 年全年天数（含闰月）
function lYearDays(y) {
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0
  }
  return sum + leapDays(y)
}

// 公历 → 农历（区间 1900-01-31 ~ 2100-12-31），返回 {lYear,lMonth,lDay,isLeap} 或 null
function solarToLunar(y, m, d) {
  if (y < 1900 || y > 2100) return null
  if (y === 1900 && m === 1 && d < 31) return null
  let offset = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 86400000)
  let i
  let temp = 0
  for (i = 1900; i < 2101 && offset > 0; i++) {
    temp = lYearDays(i)
    offset -= temp
  }
  if (offset < 0) {
    offset += temp
    i--
  }
  const lYear = i
  const leap = leapMonth(i)
  let isLeap = false
  for (i = 1; i < 13 && offset > 0; i++) {
    if (leap > 0 && i === (leap + 1) && isLeap === false) {
      --i
      isLeap = true
      temp = leapDays(lYear)
    } else {
      temp = monthDays(lYear, i)
    }
    if (isLeap === true && i === (leap + 1)) isLeap = false
    offset -= temp
  }
  if (offset === 0 && leap > 0 && i === leap + 1) {
    if (isLeap) {
      isLeap = false
    } else {
      isLeap = true
      --i
    }
  }
  if (offset < 0) {
    offset += temp
    --i
  }
  return { lYear, lMonth: i, lDay: offset + 1, isLeap }
}

// 农历 → 公历，返回 {sYear,sMonth,sDay} 或 null
function lunarToSolar(y, m, d, isLeapMonth) {
  isLeapMonth = !!isLeapMonth
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1) return null
  if (isLeapMonth && leapMonth(y) !== m) return null
  const dim = monthDays(y, m)
  const limit = isLeapMonth ? leapDays(y) : dim
  if (d > limit) return null
  let offset = 0
  for (let i = 1900; i < y; i++) {
    offset += lYearDays(i)
  }
  const leap = leapMonth(y)
  let isAdd = false
  for (let i = 1; i < m; i++) {
    if (!isAdd && leap > 0 && leap <= i) {
      offset += leapDays(y)
      isAdd = true
    }
    offset += monthDays(y, i)
  }
  if (isLeapMonth) offset += dim
  const strap = Date.UTC(1900, 1, 30) // 越界归一化锚点：农历1900年正月初一 = 公历1900年1月31日
  const cal = new Date((offset + d - 31) * 86400000 + strap)
  return { sYear: cal.getUTCFullYear(), sMonth: cal.getUTCMonth() + 1, sDay: cal.getUTCDate() }
}

// 干支与生肖（正月初一更岁口径）
function ganzhiYear(lYear) {
  let g = (lYear - 4) % 10
  let z = (lYear - 4) % 12
  if (g < 0) g += 10
  if (z < 0) z += 12
  return { gz: GAN[g] + ZHI[z], zodiac: ZODIAC[z] }
}

// 'YYYY-MM-DD' 解析，非法返回 null
function parseDateStr(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ''))
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  return { y, m: mo, d }
}

// 补零拼 'YYYY-MM-DD'
function dateToStr(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// 星期索引（0=周日 … 6=周六），按 UTC 计算避免时区漂移
function weekdayOfDateStr(dateStr) {
  const p = parseDateStr(dateStr)
  if (!p) return -1
  return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()
}

// 农历日期中文名（初一…三十）
function lunarDayCn(d) {
  if (d === 10) return '初十'
  if (d === 20) return '二十'
  if (d === 30) return '三十'
  const n1 = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  const n2 = ['初', '十', '廿', '卅']
  return n2[Math.floor(d / 10)] + n1[(d % 10) - 1]
}

// 农历月名（含闰月标志），如 '三月' / '闰六月'
function lunarMonthCn(m, isLeap) {
  return (isLeap ? '闰' : '') + MONTH_CN[m - 1] + '月'
}

// 公历 → 农历包装：入参 'YYYY-MM-DD'，出参 {cnYear,cnMonth,cnDay,isLeap}，越界/非法返回 null
const lunarMemo = new Map()
function lunarOf(dateStr) {
  if (lunarMemo.has(dateStr)) return lunarMemo.get(dateStr)
  const p = parseDateStr(dateStr)
  let result = null
  if (p) {
    const l = solarToLunar(p.y, p.m, p.d)
    if (l && l.lYear >= 1900 && l.lYear <= 2100 && l.lMonth >= 1 && l.lMonth <= 12 && l.lDay >= 1 && l.lDay <= 30) {
      result = { cnYear: l.lYear, cnMonth: l.lMonth, cnDay: l.lDay, isLeap: l.isLeap }
    }
  }
  lunarMemo.set(dateStr, result)
  return result
}

// 第 n 个节气（0=小寒 … 23=冬至）在 y 年所在月内的「日」（1-31），UTC+8 口径
function sTermDay(y, n) {
  const ms = 31556925974.7 * (y - 1900) + S_TERM_INFO[n] * 60000 + Date.UTC(1900, 0, 6, 2, 5)
  return new Date(ms).getUTCDate()
}

// 'YYYY-MM-DD' → 节气名或 null（无节气/越界/非法日期）
function solarTermOf(dateStr) {
  const p = parseDateStr(dateStr)
  if (!p || p.y < 1900 || p.y > 2100) return null
  const base = (p.m - 1) * 2
  if (p.d === sTermDay(p.y, base)) return TERM_NAMES[base]
  if (p.d === sTermDay(p.y, base + 1)) return TERM_NAMES[base + 1]
  return null
}

// 周末判定（周六/周日恒为周末；weekStart 仅保持调用形态一致，不改变周末集合）
function isWeekendOf(dateStr, weekStart) {
  void weekStart
  const wd = weekdayOfDateStr(dateStr)
  return wd === 0 || wd === 6
}

// 月历网格：固定 6 行 × 7 列 = 42 格（按行展开），含前后月补位。
// weekStart：1=周一起始，0=周日起始。cell = { date:'YYYY-MM-DD', inMonth, weekday, day }
function monthGridOf(year, month, weekStart) {
  if (!Number.isFinite(year) || !Number.isInteger(month) || month < 1 || month > 12) return []
  const firstUtc = Date.UTC(year, month - 1, 1)
  const firstDow = new Date(firstUtc).getUTCDay()
  const lead = (firstDow - weekStart + 7) % 7
  const gridStartUtc = firstUtc - lead * 86400000
  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStartUtc + i * 86400000)
    const y = d.getUTCFullYear()
    const mo = d.getUTCMonth() + 1
    const day = d.getUTCDate()
    cells.push({
      date: dateToStr(y, mo, day),
      inMonth: y === year && mo === month,
      weekday: d.getUTCDay(),
      day
    })
  }
  return cells
}

// 年历网格：y 年 12 个月的网格（index 0 对应 1 月）
function yearGridsOf(year, weekStart) {
  const grids = []
  for (let m = 1; m <= 12; m++) {
    grids.push(monthGridOf(year, m, weekStart))
  }
  return grids
}

// 单格的农历/节气小字标注：{text, kind}，kind: 'month'(初一月名) | 'term'(节气) | 'day'(农历日) | ''
function lunarCellLabelOf(dateStr, showLunar, showTerm) {
  const l = showLunar ? lunarOf(dateStr) : null
  if (l && l.cnDay === 1) {
    return { text: lunarMonthCn(l.cnMonth, l.isLeap), kind: 'month' }
  }
  if (showTerm) {
    const term = solarTermOf(dateStr)
    if (term) return { text: term, kind: 'term' }
  }
  if (l) return { text: lunarDayCn(l.cnDay), kind: 'day' }
  return { text: '', kind: '' }
}

// 月历格展示装配：追加 day/weekend/lunarText/lunarKind，模板只做渲染
function decorateCellOf(cell, showLunar, showTerm) {
  const label = lunarCellLabelOf(cell.date, showLunar, showTerm)
  return {
    ...cell,
    weekend: isWeekendOf(cell.date, 1),
    lunarText: label.text,
    lunarKind: label.kind
  }
}

// 年份钳制到历表范围 1900-2100
function clampCalendarYear(y) {
  const n = Math.round(Number(y))
  if (!Number.isFinite(n)) return 1900
  return Math.min(2100, Math.max(1900, n))
}

// ---------- 视图状态（SSR 初值确定，「今日」在 onMounted 填充，避免水合不一致） ----------
const ready = ref(false)
const todayStr = ref('')
const viewMode = ref('month') // 'month' | 'year'
const viewYear = ref(1900)
const viewMonth = ref(1)
const yearInput = ref(1900)
const weekStart = ref(1)
const showLunar = ref(true)
const showTerm = ref(true)
const showToday = ref(true)
const noteSpace = ref(false)
const seoContentVisible = ref(true)

// ---------- 派生视图 ----------
const viewTitle = computed(() => {
  if (!ready.value) return '—'
  return viewMode.value === 'month'
    ? `${viewYear.value} 年 ${viewMonth.value} 月`
    : `${viewYear.value} 年`
})

const goTodayLabel = computed(() => (viewMode.value === 'month' ? '回到本月' : '回到今年'))

const weekHeaderNames = computed(() => {
  return weekStart.value === 1
    ? ['一', '二', '三', '四', '五', '六', '日']
    : ['日', '一', '二', '三', '四', '五', '六']
})

// 备注栏开启时周末两列加宽
const colTemplate = computed(() => {
  const w = noteSpace.value ? '1.25fr' : '1fr'
  return weekStart.value === 1
    ? `repeat(5, 1fr) ${w} ${w}`
    : `${w} repeat(5, 1fr) ${w}`
})

const monthViewCells = computed(() => {
  if (!ready.value) return []
  return monthGridOf(viewYear.value, viewMonth.value, weekStart.value)
    .map((cell) => decorateCellOf(cell, showLunar.value, showTerm.value))
})

const yearViewGrids = computed(() => {
  if (!ready.value) return []
  return yearGridsOf(viewYear.value, weekStart.value)
})

// 当月对应的农历年干支标签（按当月 1 日计）
const monthLunarLabel = computed(() => {
  if (!ready.value || viewMode.value !== 'month') return ''
  const l = lunarOf(dateToStr(viewYear.value, viewMonth.value, 1))
  if (!l) return ''
  const gz = ganzhiYear(l.cnYear)
  return `农历${gz.gz}（${gz.zodiac}）年`
})

// ---------- 交互（仅回调，SSR 安全） ----------
function segClass(active) {
  return active
    ? 'bg-primary text-primary-foreground'
    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
}

function lunarTextClass(kind) {
  if (kind === 'month') return 'text-primary font-medium'
  if (kind === 'term') return 'text-green-600 dark:text-green-500 font-medium'
  return 'text-muted-foreground'
}

function isTodayCell(cell) {
  return showToday.value && ready.value && cell.date === todayStr.value
}

function setViewMode(mode) {
  viewMode.value = mode === 'year' ? 'year' : 'month'
}

function stepView(delta) {
  if (viewMode.value === 'month') {
    let m = viewMonth.value + delta
    let y = viewYear.value
    if (m < 1) { m = 12; y -= 1 }
    if (m > 12) { m = 1; y += 1 }
    viewYear.value = clampCalendarYear(y)
    viewMonth.value = m
  } else {
    viewYear.value = clampCalendarYear(viewYear.value + delta)
  }
  yearInput.value = viewYear.value
}

function applyYearJump() {
  viewYear.value = clampCalendarYear(yearInput.value)
  yearInput.value = viewYear.value
}

function goToday() {
  const p = parseDateStr(todayStr.value)
  if (!p) return
  viewYear.value = clampCalendarYear(p.y)
  viewMonth.value = p.m
  yearInput.value = viewYear.value
}

function resetSettings() {
  weekStart.value = 1
  showLunar.value = true
  showTerm.value = true
  showToday.value = true
  noteSpace.value = false
}

function printCalendar() {
  window.print()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const d = now.getDate()
  todayStr.value = dateToStr(y, m, d)
  viewYear.value = clampCalendarYear(y)
  viewMonth.value = m
  yearInput.value = viewYear.value
  ready.value = true
  addRecentTool('printable-calendar')
})
</script>

<style scoped>
/* A4 竖版，10mm 页边距 */
@page {
  size: A4 portrait;
  margin: 10mm;
}

@media print {
  /* 打印时只保留日历区 */
  .no-print {
    display: none !important;
  }
  .print-tight {
    margin: 0 !important;
  }
  .print-area {
    border: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
  }
  /* 保留周末底色与今日高亮 */
  .print-area * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .print-title {
    font-size: 18pt !important;
  }
  /* 月历：单页大格，留手写空间 */
  .print-month-cell {
    height: 34mm !important;
    min-height: 34mm !important;
    padding: 1.5mm 2mm !important;
  }
  .print-month-day {
    font-size: 13pt !important;
  }
  .print-month-sub {
    font-size: 7.5pt !important;
  }
  /* 年历：12 个月一页排布 */
  .print-year-block {
    break-inside: avoid;
  }
  .print-year-day {
    font-size: 8pt !important;
    line-height: 1.4 !important;
  }
}
</style>
