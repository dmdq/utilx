<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Moon class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">月相计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">月龄查询、8 相月名与照度、下一个满月/新月预测、潮汐大小潮参考，海钓夜钓摄影中秋规划实用</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线月相计算器：选择任意日期，即刻得到当天月龄（距上次新月的天数）、月相名称（新月 / 娥眉月 / 上弦月 / 盈凸月 / 满月 / 亏凸月 / 下弦月 / 残月）、
        月亮照度百分比与月相示意图；并能查询下一个满月、下一个新月的日期，展示未来 8 天逐日月相与全年朔望日速查，据此判断大潮小潮窗口。
        算法内置于页面，全部在浏览器本地计算，不发起任何网络请求。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：查询面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 h-fit">
        <h2 class="text-lg font-semibold flex items-center">
          <Calendar class="w-5 h-5 mr-2 text-primary" /> 查询条件
        </h2>

        <div>
          <label for="moon-phase-date" class="block text-sm font-medium text-foreground mb-2">选择日期</label>
          <input
            id="moon-phase-date"
            v-model="dateStr"
            type="date"
            class="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground"
            @change="onDateChange"
            @input="onDateChange"
          />
          <p v-if="!inputValid" class="text-xs text-red-500 mt-2 flex items-center gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0" /> 日期无效，结果仍按上一次有效日期显示。
          </p>
          <p v-else class="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <CheckCircle class="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> 当前查询：{{ formatDateCn(queryDate) }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            @click="pickNext('full')"
            class="px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5"
          >
            <Play class="w-3.5 h-3.5" /> 查下一个满月
          </button>
          <button
            @click="pickNext('new')"
            class="px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5"
          >
            <Play class="w-3.5 h-3.5" /> 查下一个新月
          </button>
        </div>
        <button
          @click="goToday"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 回到今天
        </button>

        <p class="text-xs text-muted-foreground leading-relaxed">
          用途提示：赶海 / 矶钓看大潮（朔望前后），筏钓 / 光诱看小潮（弦月前后）；星空摄影避开满月；夜钓照明看月龄与照度。
        </p>
      </div>

      <!-- 右：结果展示（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 大月相图 + 核心指标（深空色块卡片） -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="bg-slate-900 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <div class="flex-shrink-0" v-html="curMoon.svg"></div>
            <div class="text-center sm:text-left space-y-2">
              <p class="text-xs text-slate-400">{{ formatDateCn(queryDate) }} · 月相示意</p>
              <p class="text-3xl font-bold text-white">{{ curMoon.name }}</p>
              <div class="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-1 text-sm">
                <span class="text-slate-300">月龄 <b class="text-amber-300 font-mono">{{ curMoon.age.toFixed(1) }}</b> 天</span>
                <span class="text-slate-300">照度 <b class="text-amber-300 font-mono">{{ curMoon.illumText }}</b></span>
              </div>
              <p class="text-xs text-slate-400">月龄 = 距上次新月的天数；照度为可见圆盘被点亮面积的近似百分比。</p>
            </div>
          </div>
        </div>

        <!-- 未来 8 天月相条 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Calendar class="w-5 h-5 mr-2 text-primary" /> 未来 8 天逐日月相
          </h2>
          <div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
            <button
              v-for="day in week8"
              :key="day.date"
              type="button"
              class="flex flex-col items-center gap-1 rounded-lg p-2 bg-muted/40 hover:bg-muted/80 border border-border transition"
              :title="`${day.date} · 月龄 ${day.age.toFixed(1)} 天`"
              @click="jumpTo(day.date)"
            >
              <span v-html="day.svg"></span>
              <span class="text-xs font-medium text-foreground">{{ day.label }}</span>
              <span class="text-[10px] text-muted-foreground">{{ day.name }}</span>
            </button>
          </div>
          <p class="text-xs text-muted-foreground">点击任意一天可把上方查询跳到该日。</p>
        </div>

        <!-- 下一满月 / 下一新月 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="bg-card border border-border rounded-lg p-5 space-y-2">
            <p class="text-sm font-medium text-muted-foreground flex items-center">
              <Moon class="w-4 h-4 mr-1.5 text-amber-500" /> 下一个满月（望）
            </p>
            <p class="text-xl font-bold text-foreground">{{ nextFull ? formatDateCn(nextFull.dateStr) : '—' }}</p>
            <p class="text-xs text-muted-foreground">还有 {{ nextFull ? nextFull.daysAway : '—' }} 天 · 满月前后多为大潮</p>
            <button
              v-if="nextFull"
              @click="jumpTo(nextFull.dateStr)"
              class="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 border border-border rounded-lg text-foreground transition flex items-center gap-1.5"
            >
              <Play class="w-3 h-3" /> 跳到那天
            </button>
          </div>
          <div class="bg-card border border-border rounded-lg p-5 space-y-2">
            <p class="text-sm font-medium text-muted-foreground flex items-center">
              <Moon class="w-4 h-4 mr-1.5 text-slate-400" /> 下一个新月（朔）
            </p>
            <p class="text-xl font-bold text-foreground">{{ nextNew ? formatDateCn(nextNew.dateStr) : '—' }}</p>
            <p class="text-xs text-muted-foreground">还有 {{ nextNew ? nextNew.daysAway : '—' }} 天 · 新月前后多为大潮、夜钓无月光</p>
            <button
              v-if="nextNew"
              @click="jumpTo(nextNew.dateStr)"
              class="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 border border-border rounded-lg text-foreground transition flex items-center gap-1.5"
            >
              <Play class="w-3 h-3" /> 跳到那天
            </button>
          </div>
        </div>

        <!-- 潮汐建议卡 -->
        <div class="bg-card border border-border rounded-lg p-5 flex items-start gap-3">
          <Waves class="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="text-sm font-semibold text-foreground">潮汐参考：{{ tide.title }}</p>
            <p class="text-sm text-muted-foreground leading-relaxed">{{ tide.text }}</p>
            <p class="text-xs text-muted-foreground/80">潮汐动力是参考，具体潮时查当地潮汐表。</p>
          </div>
        </div>

        <!-- 全年朔望速查 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calendar class="w-5 h-5 mr-2 text-primary" /> {{ tableYear }} 年朔望速查
          </h2>
          <div class="space-y-3">
            <div>
              <p class="text-sm font-medium text-foreground mb-2">朔日（新月，多对应农历初一）</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="d in yearTable.newMoonDates"
                  :key="'n' + d"
                  type="button"
                  class="px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-foreground transition"
                  @click="jumpTo(d)"
                >
                  {{ chipLabel(d) }}
                </button>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-foreground mb-2">望日（满月，多对应农历十五 / 十六）</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="d in yearTable.fullMoonDates"
                  :key="'f' + d"
                  type="button"
                  class="px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-foreground transition"
                  @click="jumpTo(d)"
                >
                  {{ chipLabel(d) }}
                </button>
              </div>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            速查表由均值朔望周期逐链推算生成，与官方月相历对照存在 ±1 天出入（望落时刻接近日界时最明显）；点击日期可跳到当天详情。
          </p>
        </div>
      </div>
    </div>

    <!-- 算法说明条 -->
    <div class="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8 text-sm text-muted-foreground">
      <Info class="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
      <span>采用通用新月均值周期算法（29.53059 日朔望月 + 已知新月锚点推日），精度约 ±0.5 天——足够潮汐、夜钓、中秋规划使用；天文级月相时刻请以紫金山天文台年历为准。</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>月相计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          月相计算器用于回答「今天月亮是什么相、月龄多大、什么时候满月、最近潮大水大还是潮平水静」。算法取 2000 年 1 月 6 日 18:14（UTC）的一次已知新月作锚点，
          以平均朔望月 29.53059 天为周期，把查询日的 12:00 UTC 与锚点相差的天数对周期取余，即得该日月龄；月龄 0 附近为新月、约 14.77 天为满月，
          按八段区间命名为新月 / 娥眉月 / 上弦月 / 盈凸月 / 满月 / 亏凸月 / 下弦月 / 残月，照度用 (1−cos 2π·月龄/周期)/2 近似。
          下一个满月、新月与全年朔望表都由同一算法逐日步进推得，纯本地计算、不依赖网络。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">月相周期为什么是 29.5 天而不是 27.3 天？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          月亮绕恒星背景转一圈（恒星月）约 27.32 天，但地球同时绕太阳前进了约 27°，日月再次合朔（月亮回到太阳方向）需要再多追约 2.2 天，
          于是「朔望月」平均为 29.53 天——月相更替看的是日、月相对方向，周期自然取 29.5 天。又因月球轨道是椭圆，真朔望月会在 29.27~29.83 天间波动，
          这正是均值算法与官方月相历存在零点几天出入的根源。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么每月初一、十五的月亮看起来不一样？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          农历是阴阳合历：每个月以「朔」（日月合朔的那一刻所在日）为初一，因此初一天文上必然是新月；此后月龄每天约加 1 天，到十五、十六月龄约 14~15 天即接近「望」（满月）。
          但朔与望之间的真实现隔并非恰好 14.77 天——所以民间说「十五的月亮十六圆」，满月落在十四至十七的情形都存在，需查具体年份。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">大潮、小潮是怎么来的？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          潮汐主要由月球（其次是太阳）引潮力驱动。新月与满月时日、地、月近乎排成一线，两种引潮力叠加，潮差最大，称「大潮」（spring tide）；
          上弦、下弦时日地月连线近似直角，太阳引潮力部分抵消月球引潮力，潮差最小，称「小潮」（neap tide）。
          海钓赶海讲究「三潮水、七潮旱」等经验，即围绕朔望选择平流与潮流窗口——本工具给出的是潮汐动力档位参考，具体涨落时刻务必以当地潮汐表为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">月亮照亮一半，为什么不叫「半月」？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          口语里的「半月」不是天文命名。上弦 / 下弦当天明暗界线（terminator）恰好通过圆盘中心，几何上确实是半轮亮面，
          但传统以明暗界线形如弓弦而得名「弦月」；且按照度公式，上下弦日的照度接近而非严格等于 50%。 astronomy 语境只讲「月龄、相位、照度%」三个量，本页面即按此口径展示。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">中秋节一定是满月吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          中秋是农历八月十五，但「望」可以落在八月十四至十六甚至十七：统计上「十五的月亮十六圆」出现频率并不低，十五当晚恰好正满的年份反而不算多。
          想确认某年中秋能否看到正圆月，可在本页选择当年中秋日期，查看月龄是否接近 14.77 天（满月 ±0.5 天）。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">今天月相怎么查？</h3>
            <p class="text-sm text-muted-foreground mt-1">打开本页面即默认按今天计算（日期由浏览器本地填充），显示当天月龄、八相名称、照度百分比与月相示意图；也可输入任意日期查询历史或未来的月相。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">月龄是什么？和农历日期什么关系？</h3>
            <p class="text-sm text-muted-foreground mt-1">月龄指距上一次新月过去天数（0~29.5 天），满月约在 14.8 天。农历初一理论上对应月龄 0（朔日），十五、十六对应接近满月，两者口径一致但真值有零点几天出入。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">海钓、赶海要看月相吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">有参考价值：新月、满月前后多大潮（潮差大、水流急），弦月前后多小潮（潮差小、水稳）。本页潮汐建议按这三档给出动力参考，具体潮时查当地潮汐表。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">本工具的日期准吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">采用均值朔望算法，月龄误差约 ±0.5 天；下一满月 / 新月与全年朔望速查与官方年历可能相差 1 天。做钓鱼、摄影、赏月计划足够，天文用途请以紫金山天文台年历为准。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'moon-phase-calculator'" :category="'time'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Moon, Calendar, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Waves
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '月相计算器 - 今日月龄/满月新月查询工具',
  description: '在线月相计算器：查询任意日期的月龄、八相月名与月亮照度，展示月相图与未来8天月相条，预测下一个满月和下一个新月，附大潮小潮潮汐参考与全年朔望日速查，纯本地算法不联网。',
  keywords: '月相查询,今天月相,月龄计算,潮汐参考,满月新月查询',
  author: '有条工具',
  ogTitle: '月相计算器 - 今日月龄/满月新月查询工具 | 有条工具',
  ogDescription: '查月龄、月相名、照度与下一个满月新月，附大小潮潮汐参考与全年朔望速查。',
  ogUrl: 'https://www.util.cn/tools/moon-phase-calculator',
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
          name: '月相计算器',
          url: 'https://www.util.cn/tools/moon-phase-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['任意日期月龄与八相命名', '月亮照度近似百分比', '月相 SVG 示意图', '未来 8 天逐日月相条', '下一个满月/新月预测', '大潮小潮潮汐参考', '全年朔望日速查（±1 天口径）']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '时间日期', item: 'https://www.util.cn/time/' },
            { '@type': 'ListItem', position: 3, name: '月相计算器', item: 'https://www.util.cn/tools/moon-phase-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '今天月相怎么查？',
              acceptedAnswer: { '@type': 'Answer', text: '打开本页面即默认按今天计算，显示当天月龄、八相名称（新月/娥眉月/上弦月/盈凸月/满月/亏凸月/下弦月/残月）、照度百分比与月相示意图，也可输入任意日期查询。' }
            },
            {
              '@type': 'Question',
              name: '月龄是什么？和农历日期什么关系？',
              acceptedAnswer: { '@type': 'Answer', text: '月龄指距上一次新月过去的天数（0~29.5天），满月约在14.8天。农历初一对应朔（月龄0附近），十五十六接近望（满月），两者口径一致但真值有零点几天出入。' }
            },
            {
              '@type': 'Question',
              name: '海钓、赶海要看月相吗？',
              acceptedAnswer: { '@type': 'Answer', text: '有参考价值：新月与满月前后多大潮（潮差大水流急），上下弦前后多小潮（潮差小水稳）。本页给出三档潮汐动力参考，具体潮时请以当地潮汐表为准。' }
            },
            {
              '@type': 'Question',
              name: '本工具算出的朔望日期准吗？',
              acceptedAnswer: { '@type': 'Answer', text: '采用29.53059日均值朔望周期加已知新月锚点的通用算法，月龄误差约±0.5天，满月/新月日期与官方月相历可能有1天出入；潮汐、夜钓、中秋规划足够用，天文用途请以紫金山天文台年历为准。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 通用新月均值周期算法：锚点为 2000-01-06 18:14 UTC 的已知新月，周期取平均朔望月 29.53059 天。
// 日口径：查询日期按 UTC 日处理，取当日 12:00 UTC（正午）为日样本点——
// 新月/满月多发生在白天时段内时，该样本日即日历上的“朔日/望日”，与公开月相表的按日标注对齐。
const SYNODIC = 29.53059                       // 平均朔望月（日）
const ANCHOR_MS = Date.UTC(2000, 0, 6, 18, 14, 0) // 锚点：2000-01-06 18:14 UTC 新月
const DAY_MS = 86400000
const QUARTER = SYNODIC / 4                    // ≈7.383 天：上弦月龄
const HALF = SYNODIC / 2                       // ≈14.765 天：满月月龄
const THREE_QUARTER = (SYNODIC * 3) / 4        // ≈22.148 天：下弦月龄
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidDateStr(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false
  const d = new Date(Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10))))
  // 回环校验：拦截 2025-02-30 这类“日溢出仍能被引擎解析”的输入
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

// 查询日 12:00 UTC 相对锚点的新月后天数（可正可负，含小数）
function daysSinceAnchor(dateStr) {
  const ms = Date.UTC(Number(dateStr.slice(0, 4)), Number(dateStr.slice(5, 7)) - 1, Number(dateStr.slice(8, 10)), 12)
  return (ms - ANCHOR_MS) / DAY_MS
}

// 月龄：daysSince ÷ 周期 取非负余数（对负数做 floor-mod），范围 [0, 29.53)
function moonAgeOf(dateStr) {
  const d = daysSinceAnchor(dateStr)
  return ((d % SYNODIC) + SYNODIC) % SYNODIC
}

// 八相命名。分界（月龄日）：新月 [0,1)∪[28.53,29.53)；娥眉月 1~(7.38−1)；上弦 ±1 天居中于 7.38；
// 盈凸月 8.38~13.77；满月 ±1 天居中于 14.77；亏凸月 15.77~21.15；下弦 ±1 天居中于 22.15；残月 23.15~28.53
function phaseNameOf(age) {
  const a = ((age % SYNODIC) + SYNODIC) % SYNODIC
  if (a < 1 || a >= SYNODIC - 1) return '新月'
  if (a < QUARTER - 1) return '娥眉月'
  if (a < QUARTER + 1) return '上弦月'
  if (a < HALF - 1) return '盈凸月'
  if (a < HALF + 1) return '满月'
  if (a < THREE_QUARTER - 1) return '亏凸月'
  if (a < THREE_QUARTER + 1) return '下弦月'
  return '残月'
}

// 照度百分比（近似，1 位小数）：照明分数 = (1−cos(2π·月龄/周期))/2；新月 0%、满月 100%、弦月≈50%
function illuminationOf(age) {
  const a = ((age % SYNODIC) + SYNODIC) % SYNODIC
  const pct = ((1 - Math.cos((2 * Math.PI * a) / SYNODIC)) / 2) * 100
  return Math.round(Math.min(100, Math.max(0, pct)) * 10) / 10
}

// 日期加减（UTC 日口径，ISO 字符串进出）
function addDaysUtc(dateStr, n) {
  return new Date(Date.parse(dateStr + 'T00:00:00Z') + n * DAY_MS).toISOString().slice(0, 10)
}

// 月相 SVG：深色圆盘 + 单一“亮面”路径（外侧半圆 + 明暗界线半椭圆近似）。
// θ=2π·月龄/周期；明暗界线半短轴 rx=|cosθ|·r，sweep 标志按渐盈/渐亏与凸/缺切换；新月 rx→r 时亮面收缩为零面积。
function moonSvgOf(age, size = 220, withSpace = true) {
  const a = ((age % SYNODIC) + SYNODIC) % SYNODIC
  const r = 44
  const theta = (2 * Math.PI * a) / SYNODIC
  const rx = Number((r * Math.abs(Math.cos(theta))).toFixed(2))
  const waxing = a < HALF
  const arcOuter = waxing ? 1 : 0 // 渐盈亮在右（外弧走右半圆），渐亏亮在左
  const arcInner = waxing
    ? (theta < Math.PI / 2 ? 0 : 1)   // 盈眉：界线向右侧凹；盈凸：向左侧凸出
    : (theta < (3 * Math.PI) / 2 ? 0 : 1) // 亏凸：界线向右侧凸出；亏眉（残月）：向左侧凹
  const d = `M 50 6 A ${r} ${r} 0 0 ${arcOuter} 50 94 A ${rx} ${r} 0 0 ${arcInner} 50 6 Z`
  const space = withSpace ? '<rect x="0" y="0" width="100" height="100" rx="10" fill="#0f172a"/>' : ''
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-hidden="true">` +
    space +
    `<circle cx="50" cy="50" r="${r}" fill="#1e293b" stroke="#475569" stroke-width="1"/>` +
    `<path d="${d}" fill="#fef3c7"/>` +
    '</svg>'
  )
}

// 下一个指定相位（'new' 新月 / 'full' 满月）：逐日步进扫月龄线，新月=月龄回绕（后一日更小），满月=越过 HALF。上限 30 天。
function nextPhaseOf(dateStr, phase) {
  if (!isValidDateStr(dateStr) || (phase !== 'new' && phase !== 'full')) return null
  let cur = dateStr
  for (let i = 1; i <= 30; i++) {
    const nextDate = addDaysUtc(cur, 1)
    const a = moonAgeOf(cur)
    const b = moonAgeOf(nextDate)
    const hit = phase === 'new' ? b < a : a < HALF && b >= HALF
    if (hit) return { dateStr: nextDate, daysAway: i }
    cur = nextDate
  }
  return null
}

// 潮汐三档：朔望（月龄 0/14.77 附近）→ 大潮；上下弦（7.38/22.15 附近）→ 小潮；其余中潮过渡
function tideNoteOf(age) {
  const a = ((age % SYNODIC) + SYNODIC) % SYNODIC
  const near = (x, c, w) => Math.abs(x - c) <= w || Math.abs(x - (c + SYNODIC)) <= w
  if (near(a, 0, 1.8) || near(a, HALF, 1.5)) {
    return {
      level: 'spring',
      title: '大潮窗口（Spring Tide，朔望前后）',
      text: '日、地、月近乎一线，日月引潮力叠加，涨落幅度大、水流急。赶海宜选低潮前后窗口，矶钓排钓注意流急时段，夜钓无月光（新月）或靠月光（满月）各有玩法。'
    }
  }
  if (near(a, QUARTER, 1.5) || near(a, THREE_QUARTER, 1.5)) {
    return {
      level: 'neap',
      title: '小潮窗口（Neap Tide，弦月前后）',
      text: '日地月近似直角，太阳引潮力抵消部分月球引潮力，潮差最小、水流和缓。近岸水交换慢，适合筏钓、光诱与平静水面作钓，赶海收获通常平平。'
    }
  }
  return {
    level: 'mid',
    title: '中潮过渡（大潮与小潮之间）',
    text: '潮差介于大潮小潮之间，流势中等，按当地潮汐表选平流（满潮/干潮前后约 1 小时）时段下钩即可。'
  }
}

// 全年朔望速查：从当年 1 月 1 日前一天起，逐链调用 nextPhaseOf 收集该年全部朔日/望日（约各 12~13 个）
function yearPhaseTable(year) {
  const chain = (phase) => {
    const list = []
    let cur = `${year - 1}-12-31`
    for (let g = 0; g < 15; g++) {
      const r = nextPhaseOf(cur, phase)
      if (!r || Number(r.dateStr.slice(0, 4)) !== year) break
      list.push(r.dateStr)
      cur = r.dateStr
    }
    return list
  }
  return { newMoonDates: chain('new'), fullMoonDates: chain('full') }
}

// ---------- 响应式状态（SSR 安全：今日日期只在 onMounted 填充） ----------
// SSR/首屏固定用锚点次日 2000-01-07（月龄约 0.7 天，新月）做静态示例，与客户端首次渲染一致，避免 hydration 不一致
const PLACEHOLDER_DATE = '2000-01-07'
const dateStr = ref(PLACEHOLDER_DATE)   // 输入框绑定值
const queryDate = ref(PLACEHOLDER_DATE) // 最后一次有效查询日（结果均以此驱动）
const seoContentVisible = ref(true)

const inputValid = computed(() => isValidDateStr(dateStr.value))

function onDateChange() {
  if (inputValid.value) queryDate.value = dateStr.value
}

function jumpTo(ds) {
  dateStr.value = ds
  queryDate.value = ds
}

function pickNext(phase) {
  const r = nextPhaseOf(queryDate.value, phase)
  if (r) jumpTo(r.dateStr)
}

function localTodayStr() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

function goToday() {
  jumpTo(localTodayStr())
}

function formatDateCn(ds) {
  return `${Number(ds.slice(0, 4))}年${Number(ds.slice(5, 7))}月${Number(ds.slice(8, 10))}日`
}

function chipLabel(ds) {
  return `${Number(ds.slice(5, 7))}月${Number(ds.slice(8, 10))}日`
}

const curMoon = computed(() => {
  const age = moonAgeOf(queryDate.value)
  return {
    age,
    name: phaseNameOf(age),
    illum: illuminationOf(age),
    illumText: `${illuminationOf(age).toFixed(1)}%`,
    svg: moonSvgOf(age, 200, true)
  }
})

const week8 = computed(() =>
  Array.from({ length: 8 }, (_, i) => {
    const date = addDaysUtc(queryDate.value, i + 1)
    const age = moonAgeOf(date)
    return {
      date,
      label: `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`,
      age,
      name: phaseNameOf(age),
      svg: moonSvgOf(age, 44, false)
    }
  })
)

const nextFull = computed(() => nextPhaseOf(queryDate.value, 'full'))
const nextNew = computed(() => nextPhaseOf(queryDate.value, 'new'))
const tide = computed(() => tideNoteOf(curMoon.value.age))
const tableYear = computed(() => Number(queryDate.value.slice(0, 4)))
const yearTable = computed(() => yearPhaseTable(tableYear.value))

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  const today = localTodayStr()
  dateStr.value = today
  queryDate.value = today
  addRecentTool('moon-phase-calculator')
})
</script>
