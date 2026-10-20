<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Gift class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">农历生日提醒</h1>
          <p class="text-sm text-muted-foreground mt-1">农历↔公历生日互算，下一次生日日期、星期与倒计时一目了然</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        家里长辈只记农历生日、年轻人想知农历生日今年公历落在哪天？选择按公历或农历录入生日（年/月/日三输入，农历生日在闰月可勾选），
        本页内置 1900–2100 年农历压缩数据表做标准农历↔公历换算：按公历录显示对应农历生日与「下一次农历生日的公历日期」，
        按农历录显示对应公历与「下一次公历生日」，并给出距下次生日的天数倒计时、今年该生日是星期几与未来三次日期。
        闰月生日在当年无该闰月时按民俗回退到同名义平月并明确注明。农历编算口径以紫金山天文台发布为准，结果供参考。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左：录入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 h-fit">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          <CalendarDays class="w-5 h-5 text-primary" /> 录入生日
        </h2>

        <div class="flex gap-2">
          <button
            @click="mode = 'solar'"
            :class="[
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition',
              mode === 'solar' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            ]"
          >
            按公历（阳历）
          </button>
          <button
            @click="mode = 'lunar'"
            :class="[
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition',
              mode === 'lunar' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            ]"
          >
            按农历（阴历）
          </button>
        </div>

        <!-- 公历三输入 -->
        <div v-if="mode === 'solar'" class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">年（1900-2100）</label>
            <input v-model.number="solarYear" type="number" min="1900" max="2100" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">月</label>
            <select v-model.number="solarMonth" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">日</label>
            <select v-model.number="solarDay" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option v-for="d in solarDayLimit" :key="d" :value="d">{{ d }}日</option>
            </select>
          </div>
        </div>

        <!-- 农历三输入 -->
        <div v-else class="space-y-3">
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">农历年（1900-2100）</label>
              <input v-model.number="lunarYear" type="number" min="1900" max="2100" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">月</label>
              <select v-model.number="lunarMonth" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option v-for="m in 12" :key="m" :value="m">{{ monthLabel(m) }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">日</label>
              <select v-model.number="lunarDay" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option v-for="d in lunarDayLimit" :key="d" :value="d">{{ lunarDayName(d) }}</option>
              </select>
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm text-foreground">
            <input
              v-model="lunarIsLeap"
              type="checkbox"
              class="w-4 h-4 rounded border-border"
              :disabled="yearLeapMonth !== lunarMonth"
            >
            生日在闰月
            <span class="text-xs text-muted-foreground">
              （农历{{ lunarYear }}年{{ yearLeapMonth > 0 ? `闰${yearLeapMonth}月` : '无闰月' }}）
            </span>
          </label>
        </div>

        <div v-if="inputError" class="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm">
          {{ inputError }}
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          换算基于内置 1900–2100 年农历压缩数据表（公开的经典农历数据口径，与站内「农历日历转换工具」的历表数据同源互验）。
          朔日与闰月以国家权威部门（紫金山天文台）发布的农历编算为准，本工具结果供生日换算参考。
        </p>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-4">
        <div v-if="!inputError && converted && nextOcc" class="space-y-4">
          <!-- ① 生日换算 -->
          <div class="p-5 bg-card border border-border rounded-lg">
            <h2 class="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-primary" />
              {{ mode === 'solar' ? '这个公历生日的农历写法' : '这个农历生日的公历写法' }}
            </h2>
            <p class="text-2xl font-bold text-foreground leading-relaxed">
              <template v-if="mode === 'solar'">农历{{ converted.lunarFullText }}</template>
              <template v-else>{{ converted.solarText }}</template>
            </p>
            <p class="text-sm text-muted-foreground mt-2">
              {{ converted.subText }}
            </p>
          </div>

          <!-- ② 下一次生日（另一种历法口径） -->
          <div class="p-5 bg-card border border-primary/40 rounded-lg">
            <h2 class="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Gift class="w-4 h-4 text-primary" />
              下一次{{ mode === 'solar' ? '农历生日' : '公历生日' }}（公历日期）
            </h2>
            <p class="text-3xl font-bold text-primary">
              {{ nextOcc.dateText }}
              <span class="text-base font-medium text-foreground ml-2">星期{{ nextOcc.weekday }}</span>
            </p>
            <div class="grid grid-cols-2 gap-3 mt-3 text-sm">
              <div class="p-3 bg-muted rounded-lg">
                <span class="text-muted-foreground block text-xs mb-1">距下次生日</span>
                <span class="text-lg font-bold text-foreground">{{ nextOcc.daysUntil }} 天</span>
                <span v-if="nextOcc.isToday" class="ml-1 text-xs text-red-500 font-medium">就是今天，生日快乐！</span>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <span class="text-muted-foreground block text-xs mb-1">今年该生日（{{ today.sYear }}年）是</span>
                <span class="text-lg font-bold text-foreground">
                  星期{{ thisYearOcc ? thisYearOcc.weekday : '—' }}
                  <span v-if="thisYearOcc" class="text-xs font-normal text-muted-foreground ml-1">{{ thisYearOcc.dateText }}</span>
                </span>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-3 leading-relaxed">{{ nextOcc.explain }}</p>
          </div>

          <!-- ③ 未来三次对照 -->
          <div class="p-5 bg-card border border-border rounded-lg">
            <h2 class="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <CalendarDays class="w-4 h-4 text-primary" /> 未来三次{{ mode === 'solar' ? '农历' : '公历' }}生日
            </h2>
            <div class="overflow-x-auto">
              <table class="w-full text-sm border-collapse">
                <thead>
                  <tr class="text-muted-foreground">
                    <th class="border border-border px-3 py-2 text-left">次序</th>
                    <th class="border border-border px-3 py-2 text-left">公历日期</th>
                    <th class="border border-border px-3 py-2 text-left">星期</th>
                    <th class="border border-border px-3 py-2 text-left">{{ mode === 'solar' ? '农历' : '备注' }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(oc, oi) in upcoming" :key="oi" class="text-foreground">
                    <td class="border border-border px-3 py-2">第{{ oi + 1 }}次</td>
                    <td class="border border-border px-3 py-2 font-medium">{{ oc.dateText }}</td>
                    <td class="border border-border px-3 py-2">星期{{ oc.weekday }}</td>
                    <td class="border border-border px-3 py-2 text-xs text-muted-foreground">{{ oc.lunarText || oc.note || '常规' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-xs text-muted-foreground mt-2">
              {{ mode === 'solar' ? '农历生日每年对应的公历日期不同（约提前11天，逢闰月年份顺延）。' : '公历生日月日固定，此表用于确认周末/请假安排。' }}
            </p>
          </div>
        </div>

        <div v-else class="p-10 text-center text-muted-foreground border border-dashed border-border rounded-lg bg-card">
          {{ inputError || '在左侧录入生日后显示换算结果' }}
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="isSeoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          农历生日提醒怎么用？
        </h2>
        <p class="text-muted-foreground mb-4">
          长辈习惯过农历生日、年轻人身份证上是公历日期，两种记法互相换算最麻烦：农历月分大小（29/30 天）还设有闰月，
          同一个农历日期每年的公历日期都在漂移（平年提前约 11 天，逢闰月年份大幅顺延）。
          本工具内置 1900–2100 年农历压缩数据表完成标准农历↔公历互算，给出下一次农历（或公历）生日的公历日期、
          今年生日落在星期几、距下次生日的天数倒计时，以及未来三次日期，提前备好蛋糕与祝福。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-6 mb-3">闰月生日怎么处理？</h3>
        <p class="text-muted-foreground mb-4 text-sm leading-relaxed">
          农历约每 19 年置 7 闰。若生日恰在闰月（如 2023 年闰二月十五），而其它年份没有闰二月，
          按多数地方民俗「闰月生日遇平年过同名义平月」——本页会回退到当年二月十五并在结果中明确标注；
          若生日是腊月三十而当年腊月只有 29 天（小月），则回退到廿九，同样注明。
          有闰月且前后同名的年份（如平五月与闰五月），本工具录入时勾选「生日在闰月」即可精确指定。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-6 mb-3">农历公历换算原理与数据表</h3>
        <p class="text-muted-foreground mb-4 text-sm leading-relaxed">
          农历以朔望月定月（每月初一为朔日）、以中气定月序并置闰，规则复杂，工程上普遍采用「压缩数据表」：
          每年用一个十六进制数编码当年是否闰月、闰哪月、各月大小与闰月天数。本页内置 1900–2100 共 201 项的公开经典数据表，
          换算即「以 1900 年正月初一（公历 1900-01-31）为锚点累计天数」；与站内「农历日历转换工具」对照可互相验证。
          官方权威口径为紫金山天文台依东八区朔日与中气规则编算发布的农历年历。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-6 mb-3">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">生肖按立春还是正月初一算？</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              民俗上生肖随农历年，即正月初一更岁；部分命理口径按立春划分。本页生肖采用正月初一口径，
              若生日在一二月份之交，可能与按立春口径相差一个生肖，两种说法并存，供参考。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">倒计时以哪一天为「今天」？</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              以打开页面当天的本地日期为基准计算到「下一次生日」的天数，生日当天显示 0 天并提示生日快乐；
              今年对应日期已过则顺延下一年（农历生日按下一农历年重新换算公历日期）。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么同一个农历生日，公历日期忽早忽晚？</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              农历年 12 个月约 354 天，比回归年少约 11 天，次年对应公历整体提前；农历以 19 年 7 闰补齐，
              闰月年份该生日对应的公历日期又会推后甚至跳回。所以不能只记「大概某月中旬」，逐年换算才准确。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'lunar-birthday-reminder'" :category="'time'" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Gift, CalendarDays, Sparkles, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '农历生日提醒 - 农历公历生日互算与倒计时',
  description: '在线农历生日提醒：按公历或农历录入生日，内置1900-2100农历压缩数据表完成农历公历互算，显示下一次农历/公历生日日期、今年生日星期、倒计时天数，闰月生日回退注明，纯本地计算',
  keywords: '农历生日换算, 农历生日是哪天, 生日阳历农历对照, 农历生日倒计时, 闰月生日怎么过, 公历转农历生日',
  author: 'Util工具箱',
  ogTitle: '农历生日提醒 - 有条工具',
  ogDescription: '输入农历或公历生日，换算今年对应的另一种生日并算距下次天数',
  ogUrl: 'https://www.util.cn/tools/lunar-birthday-reminder',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '农历生日提醒',
          url: 'https://www.util.cn/tools/lunar-birthday-reminder',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['农历公历生日互算', '下一次生日日期推算', '生日倒计时', '今年生日星期', '闰月生日回退处理', '1900-2100农历压缩数据表']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '时间工具', item: 'https://www.util.cn/time/' },
            { '@type': 'ListItem', position: 3, name: '农历生日提醒', item: 'https://www.util.cn/tools/lunar-birthday-reminder/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '闰月生日怎么处理？',
              acceptedAnswer: { '@type': 'Answer', text: '生日在闰月而当年无该闰月时，按民俗回退到同名义平月并标注；腊月三十遇小月回退到廿九。' }
            },
            {
              '@type': 'Question',
              name: '为什么农历生日的公历日期年年变？',
              acceptedAnswer: { '@type': 'Answer', text: '农历一年约354天比回归年少约11天，对应公历逐年提前；19年7闰补齐，闰月年份又顺延，故须逐年换算。' }
            },
            {
              '@type': 'Question',
              name: '农历换算数据可靠吗？',
              acceptedAnswer: { '@type': 'Answer', text: '内置公开经典农历压缩数据表（1900-2100共201项），与站内农历日历工具口径同源互验；权威口径以紫金山天文台农历编算为准。' }
            }
          ]
        }
      ]
    })
  }]
})

/* ===== PURE-BEGIN ===== */
// 农历 1900-2100 年压缩数据表：每年一个十六进制数。
// 低 4 位 = 闰月月份（0 表示该年无闰月）；bit16（0x10000）= 闰月大小（1 为 30 天）；
// bit5-bit16（0x8000 递减到 0x10）依次表示正月至腊月是否大月（30 天）。
// 数据为公开流传并经广泛校验的经典农历数据口径（Jea杨 calendar.js 同源 lunarInfo），锚点：农历1900年正月初一 = 公历1900年1月31日。
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

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const MONTH_CN = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']

function inTable(y) {
  return y >= 1900 && y <= 2100
}

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

// 公历某年月天数
function solarDaysInMonth(y, m) {
  if (m === 2) {
    return ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 29 : 28
  }
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
}

// 公历 → 农历（区间 1900-01-31 ~ 2100-12-31），返回 {lYear,lMonth,lDay,isLeap} 或 null
function solarToLunar(y, m, d) {
  if (!inTable(y)) return null
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

// 农历 → 公历，返回 {sYear,sMonth,sDay} 或 null（参数越界/闰月不符/日期超月长）
function lunarToSolar(y, m, d, isLeapMonth) {
  isLeapMonth = !!isLeapMonth
  if (!inTable(y) || m < 1 || m > 12 || d < 1) return null
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
  // 目标为闰月：先走完同名义平月整月
  if (isLeapMonth) offset += dim
  const strap = Date.UTC(1900, 1, 30) // 农历1900年正月初一对应公历1900年1月31日（Date.UTC月份越界归一化处理）
  const cal = new Date((offset + d - 31) * 86400000 + strap)
  return { sYear: cal.getUTCFullYear(), sMonth: cal.getUTCMonth() + 1, sDay: cal.getUTCDate() }
}

// 农历目标月日在农历 lYear 年的公历日期；闰月缺失回退平月、三十遇小月取月末，附说明
function lunarDateInYear(lYear, lMonth, lDay, wantLeap) {
  let note = ''
  let useLeap = wantLeap
  if (wantLeap && leapMonth(lYear) !== lMonth) {
    useLeap = false
    note = `本年无闰${lMonth}月，按民俗回退过${MONTH_CN[lMonth - 1]}月`
  }
  let s = lunarToSolar(lYear, lMonth, lDay, useLeap)
  if (!s) {
    const limit = monthDays(lYear, lMonth)
    if (limit >= 1) {
      s = lunarToSolar(lYear, lMonth, limit, false)
      note = note ? `${note}；本月小月取${limit}日` : `本月无三十，回退到廿九`
    }
  }
  return s ? { ...s, note } : null
}

// 干支与生肖（正月初一更岁口径）
function ganzhiYear(lYear) {
  let g = (lYear - 4) % 10
  let z = (lYear - 4) % 12
  if (g < 0) g += 10
  if (z < 0) z += 12
  return { gz: GAN[g] + ZHI[z], zodiac: ZODIAC[z] }
}

// 两公历日期相差天数（b - a）
function diffDays(a, b) {
  return Math.round((Date.UTC(b.sYear, b.sMonth - 1, b.sDay) - Date.UTC(a.sYear, a.sMonth - 1, a.sDay)) / 86400000)
}

function weekdayOf(s) {
  return new Date(s.sYear, s.sMonth - 1, s.sDay).getDay()
}

function nextDayOf(s) {
  const dt = new Date(s.sYear, s.sMonth - 1, s.sDay + 1)
  return { sYear: dt.getFullYear(), sMonth: dt.getMonth() + 1, sDay: dt.getDate() }
}

// 下一次（含 from 当天）农历月日生日的公历日期
function nextLunarBirthdayDate(lMonth, lDay, wantLeap, from) {
  const curL = solarToLunar(from.sYear, from.sMonth, from.sDay)
  if (!curL) return null
  let lYear = curL.lYear
  for (let k = 0; k < 3; k++) {
    const cand = lunarDateInYear(lYear, lMonth, lDay, wantLeap)
    if (cand && diffDays(from, cand) >= 0) return cand
    lYear++
  }
  return null
}

// 下一次（含 from 当天）公历月日的日期；2月29非闰年取2月28并注
function nextSolarMonthDayDate(month, day, from) {
  const check = (y) => {
    const limit = solarDaysInMonth(y, month)
    if (day > limit) return { sYear: y, sMonth: month, sDay: limit, note: `${y}年${month}月无${day}日，取${month}月${limit}日` }
    return { sYear: y, sMonth: month, sDay: day, note: '' }
  }
  const thisYear = check(from.sYear)
  if (diffDays(from, thisYear) >= 0) return thisYear
  return check(from.sYear + 1)
}
/* ===== PURE-END ===== */

// ---------- 状态 ----------
const now = new Date()
const today = { sYear: now.getFullYear(), sMonth: now.getMonth() + 1, sDay: now.getDate() }

const WEEK_NAMES = ['日', '一', '二', '三', '四', '五', '六']

const mode = ref('solar')
const solarYear = ref(1990)
const solarMonth = ref(5)
const solarDay = ref(20)
const lunarYear = ref(2023)
const lunarMonth = ref(2)
const lunarDay = ref(15)
const lunarIsLeap = ref(true)
const isSeoContentVisible = ref(true)

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

const monthLabel = (m) => MONTH_CN[m - 1] + '月'
const lunarDayName = (d) => {
  if (d === 10) return '初十'
  if (d === 20) return '二十'
  if (d === 30) return '三十'
  const n1 = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  const n2 = ['初', '十', '廿', '卅']
  return n2[Math.floor(d / 10)] + n1[(d % 10) - 1]
}

// ---------- 录入校验 ----------
const yearLeapMonth = computed(() => {
  const y = Math.round(Number(lunarYear.value) || 0)
  return inTable(y) ? leapMonth(y) : 0
})

const solarDayLimit = computed(() => {
  const y = Math.round(Number(solarYear.value) || 0)
  const m = Math.round(Number(solarMonth.value) || 0)
  if (!inTable(y) || m < 1 || m > 12) return 31
  return solarDaysInMonth(y, m)
})

const lunarDayLimit = computed(() => {
  const y = Math.round(Number(lunarYear.value) || 0)
  if (!inTable(y)) return 30
  const m = Math.round(Number(lunarMonth.value) || 0) || 1
  const lim = lunarIsLeap.value ? leapDays(y) : monthDays(y, m)
  return lim > 0 ? lim : 29
})

const inputError = computed(() => {
  if (mode.value === 'solar') {
    const y = Math.round(Number(solarYear.value) || 0)
    if (!inTable(y)) return '公历年份需在 1900 - 2100 之间'
    const m = Math.round(Number(solarMonth.value) || 0)
    const d = Math.round(Number(solarDay.value) || 0)
    if (m < 1 || m > 12) return '公历月份需在 1 - 12'
    if (d < 1 || d > solarDaysInMonth(y, m)) return `${y}年${m}月没有${d}日`
    return ''
  }
  const y = Math.round(Number(lunarYear.value) || 0)
  if (!inTable(y)) return '农历年份需在 1900 - 2100 之间'
  if (lunarIsLeap.value && yearLeapMonth.value !== Number(lunarMonth.value)) {
    return `农历${y}年${yearLeapMonth.value > 0 ? '闰' + yearLeapMonth.value + '月才是闰月，' : '没有闰月，'}请调整勾选或月份`
  }
  const m = Math.round(Number(lunarMonth.value) || 0)
  const d = Math.round(Number(lunarDay.value) || 0)
  if (m < 1 || m > 12) return '农历月份需在 1 - 12'
  const lim = lunarIsLeap.value ? leapDays(y) : monthDays(y, m)
  if (d < 1 || d > lim) return `该农历月只有 ${lim} 天，请重选日期`
  return ''
})

// ---------- 换算 ----------
// converted：生日在「另一种历法」下的表示（kind=lunar 表示核心日期以农历月日存储）
const converted = computed(() => {
  if (inputError.value) return null
  if (mode.value === 'solar') {
    const y = Math.round(Number(solarYear.value))
    const m = Math.round(Number(solarMonth.value))
    const d = Math.round(Number(solarDay.value))
    const l = solarToLunar(y, m, d)
    if (!l) return null
    const gz = ganzhiYear(l.lYear)
    return {
      kind: 'lunar',
      lMonth: l.lMonth,
      lDay: l.lDay,
      lIsLeap: l.isLeap,
      lunarFullText: `${l.lYear}年${l.isLeap ? '闰' : ''}${MONTH_CN[l.lMonth - 1]}月${lunarDayName(l.lDay)}`,
      zodiac: gz.zodiac,
      gzYear: gz.gz,
      subText: `生肖${gz.zodiac} · ${gz.gz}年 · 出生当天星期${WEEK_NAMES[new Date(y, m - 1, d).getDay()]}`
    }
  }
  const y = Math.round(Number(lunarYear.value))
  const m = Math.round(Number(lunarMonth.value))
  const d = Math.round(Number(lunarDay.value))
  const leap = lunarIsLeap.value
  const s = lunarToSolar(y, m, d, leap)
  if (!s) return null
  const gz = ganzhiYear(y)
  return {
    kind: 'solar',
    sMonth: s.sMonth,
    sDay: s.sDay,
    solarText: `公历 ${s.sYear}年${s.sMonth}月${s.sDay}日`,
    zodiac: gz.zodiac,
    gzYear: gz.gz,
    subText: `农历${y}年${leap ? '闰' : ''}${MONTH_CN[m - 1]}月${lunarDayName(d)} · 生肖${gz.zodiac} · ${gz.gz}年 · 当天星期${WEEK_NAMES[weekdayOf(s)]}`
  }
})

// 下一次（另一种历法口径）的生日日期
const nextOcc = computed(() => {
  const c = converted.value
  if (!c) return null
  let occ = null
  if (c.kind === 'lunar') {
    occ = nextLunarBirthdayDate(c.lMonth, c.lDay, c.lIsLeap, today)
  } else {
    occ = nextSolarMonthDayDate(c.sMonth, c.sDay, today)
  }
  if (!occ) return null
  const days = diffDays(today, occ)
  const lunarText = `农历${MONTH_CN[c.lMonth - 1]}月${lunarDayName(c.lDay)}`
  return {
    dateText: `${occ.sYear}年${occ.sMonth}月${occ.sDay}日`,
    weekday: WEEK_NAMES[weekdayOf(occ)],
    daysUntil: days,
    isToday: days === 0,
    explain: occ.note
      ? `注：${occ.note}。（${c.kind === 'lunar' ? lunarText : `${c.sMonth}月${c.sDay}日`}生日，遇特殊月份按民俗回退处理）`
      : `${c.kind === 'lunar' ? lunarText : `${c.sMonth}月${c.sDay}日`}生日，下次对应公历 ${occ.sYear}年${occ.sMonth}月${occ.sDay}日。`
  }
})

// 今年（公历年 == today.sYear）该生日落在哪天与星期几
const thisYearOcc = computed(() => {
  const c = converted.value
  if (!c) return null
  let candidates = []
  if (c.kind === 'lunar') {
    const curL = solarToLunar(today.sYear, today.sMonth, today.sDay)
    if (!curL) return null
    candidates = [
      lunarDateInYear(curL.lYear - 1, c.lMonth, c.lDay, c.lIsLeap),
      lunarDateInYear(curL.lYear, c.lMonth, c.lDay, c.lIsLeap),
      lunarDateInYear(curL.lYear + 1, c.lMonth, c.lDay, c.lIsLeap)
    ]
  } else {
    candidates = [
      { sYear: today.sYear, sMonth: c.sMonth, sDay: Math.min(c.sDay, solarDaysInMonth(today.sYear, c.sMonth)), note: '' }
    ]
  }
  const hit = candidates.find(x => x && x.sYear === today.sYear)
  if (!hit) return null
  return { dateText: `${hit.sYear}年${hit.sMonth}月${hit.sDay}日`, weekday: WEEK_NAMES[weekdayOf(hit)] }
})

// 未来三次（含下一次）
const upcoming = computed(() => {
  const c = converted.value
  if (!c) return []
  const out = []
  let cursor = today
  for (let k = 0; k < 3; k++) {
    let occ = null
    if (c.kind === 'lunar') {
      occ = nextLunarBirthdayDate(c.lMonth, c.lDay, c.lIsLeap, cursor)
    } else {
      occ = nextSolarMonthDayDate(c.sMonth, c.sDay, cursor)
    }
    if (!occ) break
    let lunarText = ''
    if (c.kind === 'lunar') {
      const l = solarToLunar(occ.sYear, occ.sMonth, occ.sDay)
      if (l) lunarText = `农历${l.isLeap ? '闰' : ''}${MONTH_CN[l.lMonth - 1]}月${lunarDayName(l.lDay)}`
    }
    out.push({
      dateText: `${occ.sYear}年${occ.sMonth}月${occ.sDay}日`,
      weekday: WEEK_NAMES[weekdayOf(occ)],
      note: occ.note,
      lunarText
    })
    cursor = nextDayOf(occ)
  }
  return out
})
</script>

<style scoped>
/* 农历生日换算说明：闰月与大小月回退规则见 SEO 区说明 */
</style>
