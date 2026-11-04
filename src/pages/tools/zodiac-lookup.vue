<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Cat class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">生肖年份速查</h1>
          <p class="text-sm text-muted-foreground mt-1">出生年份查属相与干支、十二生肖顺序地支对照、本命年推算、属相出生年反查，纯本地计算不上传</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线生肖年份速查工具：输入任意公历年份（1900-2100），即刻得到该年的生肖属相、干支纪年与传统性格说法；
        点击十二生肖图标可反查各属相对应的全部出生年份与年龄；本命年卡片自动推算你的下一个本命年还有几年。
        十二生肖按（年份 − 4）对 12 取模循环，天干地支按 60 甲子循环，全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：查询面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 出生年份查询
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5" for="zodiac-birth-year">出生年份（1900 - 2100）</label>
          <input
            id="zodiac-birth-year"
            v-model="birthYearInput"
            type="text"
            inputmode="numeric"
            maxlength="4"
            placeholder="例如 1988"
            class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            :class="queryError ? 'border-red-500/60' : 'border-border'"
          />
          <p v-show="queryError" class="text-xs text-red-500 mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ queryError }}</span>
          </p>
          <p v-show="!queryError" class="text-xs text-green-600 mt-1.5 flex items-start gap-1.5">
            <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ validHint }}</span>
          </p>
        </div>

        <!-- 本命年卡（依赖当前年份，onMounted 后填充，SSR 不渲染） -->
        <div v-if="benming" class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">本命年推算</p>
          <p class="text-2xl font-bold text-primary">{{ benming.year }} 年</p>
          <p class="text-xs text-muted-foreground mt-1">
            <span v-if="benming.isCurrent">今年就是你的本命年（虚岁 {{ benming.age }} 岁）</span>
            <span v-else>还有 {{ benming.yearsAway }} 年 · 届虚岁 {{ benming.age }} 岁</span>
          </p>
        </div>

        <!-- 生肖反查 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">生肖反查（点一个属相）</p>
          <div class="grid grid-cols-6 gap-2">
            <button
              v-for="item in zodiacGrid"
              :key="item.name"
              @click="selectZodiac(item.name)"
              class="flex flex-col items-center gap-0.5 py-2 rounded-lg border text-center transition hover:bg-muted/60"
              :class="selectedZodiac === item.name ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'"
            >
              <span class="text-xl leading-none">{{ item.emoji }}</span>
              <span class="text-xs text-foreground">{{ item.name }}</span>
            </button>
          </div>
        </div>

        <div v-show="selectedZodiac" class="bg-muted/50 rounded-lg p-3">
          <p class="text-xs text-muted-foreground mb-2">属{{ selectedZodiac }}的出生年与年龄（按当前年份 {{ currentYearLabel }} 计算）</p>
          <div v-if="zodiacAges.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="pair in zodiacAges"
              :key="pair.year"
              class="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-card text-xs text-foreground"
            >
              <b class="font-mono">{{ pair.year }}</b>
              <span class="text-muted-foreground">{{ pair.age }} 岁</span>
            </span>
          </div>
          <p v-else class="text-xs text-muted-foreground">正在载入当前年份……</p>
        </div>

        <button
          @click="resetQuery"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置查询
        </button>
      </div>

      <!-- 右：展示区（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 查询结果大卡 -->
        <div v-if="queryInfo" class="bg-card border border-border rounded-lg p-6">
          <div class="flex flex-col sm:flex-row sm:items-center gap-5">
            <div class="flex-shrink-0 w-28 h-28 mx-auto sm:mx-0 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span class="text-6xl leading-none">{{ queryInfo.emoji }}</span>
            </div>
            <div class="text-center sm:text-left">
              <p class="text-sm text-muted-foreground">{{ queryYear }} 年是</p>
              <p class="text-3xl font-bold text-foreground mt-0.5">
                {{ queryInfo.zodiac }}年<span class="text-primary">（{{ queryInfo.ganzhi }}年）</span>
              </p>
              <p class="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xl">{{ queryInfo.traits }}</p>
              <p class="text-xs text-muted-foreground/80 mt-2 flex items-center justify-center sm:justify-start gap-1">
                <Info class="w-3.5 h-3.5 flex-shrink-0" /> 性格描述为民俗说法，仅供娱乐参考
              </p>
            </div>
          </div>
        </div>

        <!-- 十二生肖顺序与地支对照 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Users class="w-5 h-5 mr-2 text-primary" /> 十二生肖顺序与地支对照
          </h2>
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <div v-for="item in zodiacGrid" :key="item.name" class="bg-muted/40 border border-border rounded-lg p-3 text-center space-y-1">
              <p class="text-[10px] text-muted-foreground">第 {{ item.order }} 位 · {{ item.branch }}</p>
              <p class="text-2xl leading-none">{{ item.emoji }}</p>
              <p class="text-sm font-medium text-foreground">{{ item.branch }}{{ item.name }}</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            口诀：子鼠、丑牛、寅虎、卯兔、辰龙、巳蛇、午马、未羊、申猴、酉鸡、戌狗、亥猪。生肖固定对应十二地支，地支对应十二时辰（子时 23-1 点……），古人按动物出没习性编排顺序。
          </p>
        </div>

        <!-- 年份速查表：查询年上下各 5 年 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 年份速查表（查询年前后各 5 年）
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-4 font-medium">公历年份</th>
                  <th class="py-2 pr-4 font-medium">干支</th>
                  <th class="py-2 font-medium">生肖</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in nearbyRows"
                  :key="row.year"
                  class="border-b border-border/60 last:border-0"
                  :class="row.year === queryYear ? 'bg-primary/10 font-semibold' : ''"
                >
                  <td class="py-2 pr-4 font-mono text-foreground">{{ row.year }}</td>
                  <td class="py-2 pr-4 text-foreground">{{ row.ganzhi }}</td>
                  <td class="py-2 text-foreground">{{ emojiOf(row.zodiac) }} {{ row.zodiac }}年</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 口径提示条（静态显著提示） -->
        <div class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-2.5">
          <TriangleAlert class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p class="text-xs leading-relaxed text-foreground">
            严格命理口径以立春为界（部分流派以正月初一春节为界）；1 月 1 日—立春前出生者，生肖可能按上一轮算——本工具按公历年份近似，正式场合建议查询具体农历日期（可用站内
            <NuxtLink to="/tools/lunar-calendar" class="text-primary underline underline-offset-2">农历转换工具</NuxtLink>
            核对）。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>生肖年份速查是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          生肖年份速查是一款纯本地的属相年份对照工具。十二生肖以 12 年为循环，与公历年份的换算关系为「(年份 − 4) mod 12」：
          甲子年（如 1984、2024 往前推的 1924 为同类起点）对应鼠，故 2024、2012、2000 等均为龙年（2024 − 4 = 2020，2020 mod 12 = 4，即第 5 位龙）。
          本工具同时给出干支纪年（天干 = (年份 − 4) mod 10，地支 = (年份 − 4) mod 12，如 1984 = 甲子、2024 = 甲辰），
          并可按属相反查出生年、推算下一个本命年。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">十二生肖顺序与地支怎么对应？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          固定顺序为鼠、牛、虎、兔、龙、蛇、马、羊、猴、鸡、狗、猪，逐一搭配十二地支：子鼠、丑牛、寅虎、卯兔、辰龙、巳蛇、午马、未羊、申猴、酉鸡、戌狗、亥猪。
          地支同时对应十二时辰——子时（23-1 点）老鼠活动最频繁、丑时（1-3 点）牛反刍备耕、辰时（7-9 点）传说龙行雨、午时（11-13 点）马尚奔跑，
          故民间以动物习性编排生肖顺序。查询年份时先看地支即可定生肖：逢「辰」必属龙，逢「子」必属鼠。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">属相按立春还是春节算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          民间存在两派口径：命理（八字、紫微斗数等）以<strong>立春</strong>为生肖年界，因为八字排盘以节气定月柱年柱；
          民俗与官方农历宣传多以<strong>正月初一（春节）</strong>为界。对绝大多数出生者两派结论一致，分歧只出现在 1 月下旬—2 月中旬的「夹缝期」：
          例如 2024 年立春在 2 月 4 日、春节在 2 月 10 日——2 月 3 日出生者，两派都算上一年癸卯兔年，但公历年份近似会给出「2024 龙年」；
          2 月 5 日—9 日出生者，立春派已算甲辰龙年，春节派仍算兔年。本工具按公历年份近似，边界日期出生请以具体农历/节气日期核对。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">本命年为什么 12 年一次？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          生肖是 12 年一循环的：出生那年值自己的生肖，往后每过 12 年干支地支再次轮回到同一生肖（1988 戊辰龙 → 2000 庚辰龙 → 2012 壬辰龙 → 2024 甲辰龙），
          这些年份即本命年，虚岁为 13、25、37、49、61、73……民俗认为本命年「值太岁」，故有穿红、佩戴饰物等祈福说法——均属文化习俗，仅供了解与娱乐。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">干支纪年和生肖什么关系？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          干支纪年由十天干（甲乙丙丁戊己庚辛壬癸）与十二地支（子丑寅卯辰巳午未申酉戌亥）依次相配，最小公倍数 60，故 60 年一甲子循环（如 1984 与 2044 同为甲子年）。
          生肖就是十二地支的「通俗版」：只取 12 年周期、配 12 种动物，比干支好记——说「属龙」不必记「辰」。因此凡地支为辰之年（甲辰、丙辰、戊辰、庚辰、壬辰）皆属龙年。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">今年是什么年？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          {{ thisYearText }}
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">生肖年份怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">按公历年份近似计算：(年份 − 4) 除以 12 取余数，对应鼠牛虎兔龙蛇马羊猴鸡狗猪的顺序。例如 2024 − 4 = 2020，余 4 即第 5 位龙年；2025 年余 5 即蛇年。严格口径以立春（命理）或春节（民俗）分界，1—2 月出生者建议按农历日期核对。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">属相按立春还是春节算？</h3>
            <p class="text-sm text-muted-foreground mt-1">两派都有：八字命理以立春为生肖年界，民俗多数以正月初一春节为界。差异只出现在立春到春节之间的出生者，例如 2024 年 2 月 5 日出生，立春派算龙年、春节派算兔年。本工具按公历年份近似，正式场合请查询具体农历日期。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">本命年为什么是 12 年一次？</h3>
            <p class="text-sm text-muted-foreground mt-1">生肖 12 年一循环，逢与出生年同一地支（同一生肖）的年份即本命年，如 1988 年出生者的本命年为 2000、2012、2024、2036 年，届虚岁 13、25、37、49 岁。穿红等说法属民俗，仅供娱乐。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">属龙的年份有哪些？</h3>
            <p class="text-sm text-muted-foreground mt-1">凡 (年份 − 4) mod 12 = 4 之年皆属龙：1952、1964、1976、1988、2000、2012、2024、2036……页内点击生肖「龙」即可列出 1900 年至今全部龙年出生年及对应年龄。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">干支纪年和生肖是什么关系？</h3>
            <p class="text-sm text-muted-foreground mt-1">干支 = 十天干配十二地支，60 年一甲子；生肖是十二地支的动物化表达，12 年一轮。干支相同地支则生肖必相同，如甲辰、丙辰、戊辰、庚辰、壬辰年都属龙。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">查询数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。生肖、干支与本命年全部由页面内公式在浏览器本地计算，不发送任何网络请求，也不写入浏览器存储。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'zodiac-lookup'" :category="'time'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Cat, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, CalendarDays, Users
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '生肖年份速查 - 属相年份对照表/本命年查询工具',
  description: '免费在线生肖年份速查，输入公历年份查生肖属相与干支纪年，十二生肖地支对照，属相反查出生年与年龄，本命年自动推算，1900-2100 年属相对照表，纯浏览器本地计算不上传',
  keywords: '生肖属相查询,属相年份对照表,本命年查询,十二生肖顺序,属相怎么算',
  author: '有条工具',
  ogTitle: '生肖年份速查 - 属相年份对照表/本命年查询工具 | 有条工具',
  ogDescription: '输入年份查生肖属相与干支，十二生肖地支对照，属相反查出生年，本命年自动推算。',
  ogUrl: 'https://www.util.cn/tools/zodiac-lookup',
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
          name: '生肖年份速查',
          url: 'https://www.util.cn/tools/zodiac-lookup',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['年份查生肖与干支纪年', '十二生肖地支对照表', '属相反查出生年与年龄', '本命年推算', '1900-2100 年份速查', '立春/春节口径说明', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '时间日期', item: 'https://www.util.cn/time/' },
            { '@type': 'ListItem', position: 3, name: '生肖年份速查', item: 'https://www.util.cn/tools/zodiac-lookup/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '生肖年份怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '按公历年份近似计算：(年份 − 4) 除以 12 取余数，对应鼠牛虎兔龙蛇马羊猴鸡狗猪的顺序。例如 2024 年 (2024−4) mod 12 = 4 即龙年，2025 年余 5 即蛇年。严格口径以立春（命理）或春节（民俗）分界，1—2 月出生者建议按农历日期核对。' }
            },
            {
              '@type': 'Question',
              name: '属相按立春还是春节算？',
              acceptedAnswer: { '@type': 'Answer', text: '两派都有：八字命理以立春为生肖年界，民俗多数以正月初一春节为界。差异只出现在立春到春节之间的出生者，例如 2024 年 2 月 5 日出生，立春派算龙年、春节派算兔年。本工具按公历年份近似，正式场合请查询具体农历日期。' }
            },
            {
              '@type': 'Question',
              name: '本命年为什么是 12 年一次？',
              acceptedAnswer: { '@type': 'Answer', text: '生肖 12 年一循环，逢与出生年同一地支（同一生肖）的年份即本命年，如 1988 年出生者的本命年为 2000、2012、2024、2036 年，届虚岁分别为 13、25、37、49 岁。穿红等说法属民俗，仅供娱乐。' }
            },
            {
              '@type': 'Question',
              name: '属龙的年份有哪些？',
              acceptedAnswer: { '@type': 'Answer', text: '凡 (年份 − 4) mod 12 = 4 之年皆属龙：1952、1964、1976、1988、2000、2012、2024、2036 年。页内点击生肖「龙」即可列出 1900 年至今全部龙年出生年及对应年龄。' }
            },
            {
              '@type': 'Question',
              name: '干支纪年和生肖是什么关系？',
              acceptedAnswer: { '@type': 'Answer', text: '干支 = 十天干配十二地支，60 年一甲子；生肖是十二地支的动物化表达，12 年一轮。地支相同则生肖必相同，如甲辰、丙辰、戊辰、庚辰、壬辰年都属龙。' }
            },
            {
              '@type': 'Question',
              name: '查询数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。生肖、干支与本命年全部由页面内公式在浏览器本地计算，不发送任何网络请求，也不写入浏览器存储。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const ZODIACS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const ZODIAC_EMOJIS = ['🐀', '🐂', '🐅', '🐇', '🐉', '🐍', '🐎', '🐐', '🐒', '🐓', '🐕', '🐖']
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
// 生肖对应地支固定映射：子鼠 丑牛 寅虎 卯兔 辰龙 巳蛇 午马 未羊 申猴 酉鸡 戌狗 亥猪
const BRANCH_TO_ZODIAC = { 子: '鼠', 丑: '牛', 寅: '虎', 卯: '兔', 辰: '龙', 巳: '蛇', 午: '马', 未: '羊', 申: '猴', 酉: '鸡', 戌: '狗', 亥: '猪' }
const MIN_YEAR = 1900
const MAX_YEAR = 2100
const RANGE_MAX_YEARS = 100 // zodiacByYearRangeOf 区间上限

// 民俗性格说法（固定文案，仅供娱乐）
const ZODIAC_TRAITS = {
  鼠: '机灵敏锐、观察力强，善于抓住机会，节俭而适应力出众。',
  牛: '勤勉踏实、任劳任怨，重承诺、有耐心，是值得托付的实干派。',
  虎: '勇敢果断、气场十足，自尊心强、有担当，天生敢于冒险行动。',
  兔: '温和细腻、懂得礼让，审美不俗，人缘好且心思灵巧。',
  龙: '志向远大、自信昂扬，自带焦点气场，行事有魄力与远见。',
  蛇: '冷静睿智、直觉敏锐，外柔内秀，思考问题深入而专注。',
  马: '热情开朗、向往自由，行动力强、乐观向上，闲不住的前行者。',
  羊: '温柔善良、共情力强，艺术感觉好，外柔内韧有主见。',
  猴: '聪明活泼、学得快，机智多变、点子多，是天生的灵活派。',
  鸡: '做事细致、洞察力强，勤劳守时、表达力好，追求井井有条。',
  狗: '忠诚正直、责任感强，爱憎分明、重情义，是最可靠的朋友。',
  猪: '心地宽厚、待人真诚，热爱生活、随和豁达，福气与好运常伴。'
}

// 生肖索引（0=鼠…11=猪），(year − 4) mod 12；对负差值也安全
function zodiacIndexOf(year) {
  return ((year - 4) % 12 + 12) % 12
}

// 生肖名：2024 龙、2025 蛇、2000 龙、1984 鼠、2100 猴
function zodiacOfYear(year) {
  return ZODIACS[zodiacIndexOf(year)]
}

// 干支名：天干 (year−4) mod 10、地支 (year−4) mod 12；1984 甲子、2024 甲辰、2000 庚辰
function ganzhiOfYear(year) {
  const stem = HEAVENLY_STEMS[((year - 4) % 10 + 10) % 10]
  const branch = EARTHLY_BRANCHES[zodiacIndexOf(year)]
  return stem + branch
}

// 该年生肖是否与给定属相相同
function yearMatchesZodiac(year, zodiac) {
  return ZODIACS.includes(zodiac) && zodiacOfYear(year) === zodiac
}

// 年份输入校验：合法返回 null，非法返回提示文案（1900-2100）
function validateYearInput(raw) {
  const s = String(raw === null || raw === undefined ? '' : raw).trim()
  if (!s) return '请输入出生年份（1900 - 2100）'
  if (!/^\d{4}$/.test(s)) return '请输入 4 位数字公历年份'
  const y = Number(s)
  if (y < MIN_YEAR || y > MAX_YEAR) return `年份需介于 ${MIN_YEAR} - ${MAX_YEAR} 之间`
  return null
}

// 某生肖的近年出生年与年龄：取 ≤ currentYear 的最近一轮，倒序列到 1900；年龄 = 当前年 − 出生年
function zodiacAgePairsOf(zodiac, currentYear) {
  const idx = ZODIACS.indexOf(zodiac)
  const now = Math.floor(Number(currentYear))
  if (idx === -1 || !Number.isFinite(now)) return []
  let latest = now
  while (zodiacIndexOf(latest) !== idx) latest -= 1
  const pairs = []
  for (let y = latest; y >= MIN_YEAR; y -= 12) {
    pairs.push({ year: y, age: now - y })
  }
  return pairs
}

// 下一个本命年：出生年 +12 循环中不小于 currentYear 的最少年份；虚岁 = 本命年 − 出生年 + 1
function nextBenmingNianOf(birthYear, currentYear) {
  const b = Math.floor(Number(birthYear))
  const now = Math.floor(Number(currentYear))
  if (!Number.isFinite(b) || !Number.isFinite(now)) return null
  const offset = ((now - b) % 12 + 12) % 12
  const yearsAway = (12 - offset) % 12
  const year = now + yearsAway
  return { year, yearsAway, age: year - b + 1, isCurrent: yearsAway === 0 }
}

// 区间生肖表（含干支），上限 RANGE_MAX_YEARS 年；from > to 或非法返回空
function zodiacByYearRangeOf(from, to) {
  const a = Math.floor(Number(from))
  const b = Math.floor(Number(to))
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return []
  const end = Math.min(b, a + RANGE_MAX_YEARS - 1)
  const rows = []
  for (let y = a; y <= end; y += 1) {
    rows.push({ year: y, zodiac: zodiacOfYear(y), ganzhi: ganzhiOfYear(y) })
  }
  return rows
}

// 组合查询信息（生肖/emoji/干支/性格）
function zodiacInfoOfYear(year) {
  const zodiac = zodiacOfYear(year)
  return {
    index: zodiacIndexOf(year),
    zodiac,
    emoji: ZODIAC_EMOJIS[zodiacIndexOf(year)],
    branch: EARTHLY_BRANCHES[zodiacIndexOf(year)],
    ganzhi: ganzhiOfYear(year),
    traits: ZODIAC_TRAITS[zodiac]
  }
}

// 生肖展示顺序表（第 1 位起）
function zodiacOrderTable() {
  return ZODIACS.map((name, i) => ({
    order: i + 1,
    name,
    emoji: ZODIAC_EMOJIS[i],
    branch: EARTHLY_BRANCHES[i]
  }))
}

// ---------- 页面状态 ----------
const birthYearInput = ref('2000')
const selectedZodiac = ref(null)
const seoContentVisible = ref(true)
// 日期敏感数据只在 onMounted 填充，SSR/首帧用 0 占位防 hydration 不一致
const currentYear = ref(0)

const queryError = computed(() => validateYearInput(birthYearInput.value))
const queryYear = computed(() => (queryError.value === null ? Number(birthYearInput.value) : null))
const queryInfo = computed(() => (queryYear.value === null ? null : zodiacInfoOfYear(queryYear.value)))

const validHint = computed(() => {
  if (queryError.value !== null || queryYear.value === null) return ''
  const info = queryInfo.value
  return `${info.ganzhi}年 · 属${info.zodiac}`
})

const currentYearLabel = computed(() => (currentYear.value > 0 ? `${currentYear.value}` : '载入中'))

const thisYearText = computed(() => {
  if (currentYear.value <= 0) return '页面载入后此处将显示今年（当前公历年）的干支与生肖；口径说明：按公历年份近似，立春/春节分界见上文。'
  const y = currentYear.value
  return `按公历年份近似：今年是 ${y} 年（${ganzhiOfYear(y)}年，属${zodiacOfYear(y)}），明年 ${y + 1} 年（${ganzhiOfYear(y + 1)}年，属${zodiacOfYear(y + 1)}）。严格口径以立春或春节分界，年初出生者见上文两派说明。`
})

const benming = computed(() => {
  if (queryYear.value === null || currentYear.value <= 0) return null
  return nextBenmingNianOf(queryYear.value, currentYear.value)
})

const zodiacGrid = zodiacOrderTable()

const zodiacAges = computed(() => {
  if (!selectedZodiac.value || currentYear.value <= 0) return []
  return zodiacAgePairsOf(selectedZodiac.value, currentYear.value)
})

// 年份速查表：查询年上下各 5 年（11 行）
const nearbyRows = computed(() => {
  if (queryYear.value === null) return []
  const from = Math.max(MIN_YEAR, queryYear.value - 5)
  const to = Math.min(MAX_YEAR, queryYear.value + 5)
  return zodiacByYearRangeOf(from, to)
})

function emojiOf(zodiac) {
  const idx = ZODIACS.indexOf(zodiac)
  return idx === -1 ? '' : ZODIAC_EMOJIS[idx]
}

function selectZodiac(name) {
  selectedZodiac.value = selectedZodiac.value === name ? null : name
}

function resetQuery() {
  birthYearInput.value = '2000'
  selectedZodiac.value = null
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  currentYear.value = new Date().getFullYear()
  addRecentTool('zodiac-lookup')
})
</script>
