<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Hourglass class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">工时表计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">一周 7 天逐日记工时，自动分平日 1.5x / 休息日 2x / 法定节假日 3x 加班，导出 CSV 与打印周报表</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线工时表计算器（Weekly Timesheet）：一周 7 天逐日填写上下班时间与午休分钟，自动算出当日工时（下班 − 上班 − 午休，暂不支持跨天），
        并按<b>《劳动法》第 44 条口径</b>分类加班——工作日超 8 小时部分计平日加班 1.5x、休息日全天 2x（可被补休替代）、法定节假日全天 3x（不得以补休代替）；
        输出本周总工时、标准工时（5×8 = 40）、各类加班时长、按倍数折算的等效标准工时与按小时薪估算的加班费；
        支持 CSV 导出（Excel 友好）、打印周报表与 localStorage 本周记录持久化。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：一周逐日记录（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 本周逐日记录
          </h2>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="loadExample"
              class="px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
            >
              载入示例
            </button>
            <button
              @click="clearWeek"
              class="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              <RefreshCw class="w-4 h-4 inline mr-1 -mt-0.5" /> 清空
            </button>
          </div>
        </div>

        <!-- 逐日表格（桌面） -->
        <div class="overflow-x-auto rounded-lg border border-border">
          <table class="w-full text-xs min-w-[720px]">
            <thead>
              <tr class="text-muted-foreground border-b border-border bg-muted/40">
                <th class="px-2 py-2 text-left font-medium">日期</th>
                <th class="px-2 py-2 text-left font-medium">类型</th>
                <th class="px-2 py-2 text-left font-medium">上班</th>
                <th class="px-2 py-2 text-left font-medium">下班</th>
                <th class="px-2 py-2 text-left font-medium">午休(分)</th>
                <th class="px-2 py-2 text-right font-medium">工时(h)</th>
                <th class="px-2 py-2 text-left font-medium">加班分类</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in rows" :key="i" class="border-b border-border/40 last:border-0">
                <td class="px-2 py-1.5">
                  <input
                    v-model="row.date"
                    type="date"
                    :aria-label="'第' + (i + 1) + '天日期'"
                    class="w-[130px] px-2 py-1.5 border border-border bg-background rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span class="block text-[10px] text-muted-foreground mt-0.5">{{ weekdayLabel(row.date) }}</span>
                </td>
                <td class="px-2 py-1.5">
                  <select
                    v-model="row.type"
                    :aria-label="'第' + (i + 1) + '天类型'"
                    class="w-full px-1.5 py-1.5 border border-border bg-background rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="work">工作日</option>
                    <option value="rest">休息日</option>
                    <option value="holiday">节假日</option>
                    <option value="leave">休假</option>
                  </select>
                </td>
                <td class="px-2 py-1.5">
                  <input
                    v-model="row.start"
                    type="time"
                    :aria-label="'第' + (i + 1) + '天上班时间'"
                    class="w-[92px] px-2 py-1.5 border border-border bg-background rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </td>
                <td class="px-2 py-1.5">
                  <input
                    v-model="row.end"
                    type="time"
                    :aria-label="'第' + (i + 1) + '天下班时间'"
                    class="w-[92px] px-2 py-1.5 border border-border bg-background rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </td>
                <td class="px-2 py-1.5">
                  <input
                    v-model.number="row.lunch"
                    type="number"
                    min="0"
                    step="15"
                    :aria-label="'第' + (i + 1) + '天午休分钟'"
                    class="w-[64px] px-2 py-1.5 border border-border bg-background rounded-lg text-foreground text-xs text-right focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </td>
                <td class="px-2 py-1.5 text-right font-mono text-foreground">
                  <template v-if="rowMinutes[i] !== null">{{ fmtHours(rowMinutes[i].hours) }}</template>
                  <span v-else class="text-muted-foreground">—</span>
                </td>
                <td class="px-2 py-1.5">
                  <span v-if="rowMinutes[i] !== null && !rowMinutes[i].valid" class="text-red-500 text-[11px]">下班需晚于上班（不支持跨天）</span>
                  <span v-else-if="rowMinutes[i] !== null && rowMinutes[i].lunchExceed" class="text-amber-600 text-[11px]">午休时长超过在岗时长</span>
                  <span v-else class="text-[11px]" :class="otBadgeCls(rowMinutes[i], row.type)">{{ otLabelFor(rowMinutes[i], row.type) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1">
          <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span>日期默认自动填入本周（周一为起点），可改；类型下拉决定加班倍数口径：工作日按「超 8h 部分计 1.5x」，休息日全天 2x、节假日全天 3x、休假不计工时。跨天班次暂不支持（下班需晚于上班、且都在 24:00 前）。</span>
        </p>
      </div>

      <!-- 右侧：周汇总结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 本周汇总
          </h2>
          <button
            @click="printReport"
            class="text-xs px-2.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-foreground transition"
          >
            <Printer class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 打印
          </button>
        </div>

        <!-- 总工时主卡 -->
        <div class="bg-primary/10 rounded-lg p-5 text-center">
          <p class="text-xs text-muted-foreground mb-1">本周总工时 / 标准工时（5×8）</p>
          <p class="text-4xl sm:text-5xl font-bold text-primary leading-tight font-mono">
            {{ fmtHours(totals.totalHours) }}<span class="text-base font-normal text-muted-foreground ml-1">h</span>
          </p>
          <p class="text-xs text-muted-foreground mt-2">
            标准 {{ totals.standardHours }}h · 加班 {{ fmtHours(totals.otHours) }}h · 超标准 {{ totals.totalHours >= totals.standardHours ? '+' : '' }}{{ fmtHours(totals.totalHours - totals.standardHours) }}h
          </p>
        </div>

        <!-- 加班分档 -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-muted/50 rounded-xl p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">平日加班 1.5x</p>
            <p class="text-xl font-bold text-foreground font-mono">{{ fmtHours(totals.weekdayOT) }}h</p>
            <p class="text-[11px] text-muted-foreground mt-1">工作日超 8h 部分</p>
          </div>
          <div class="bg-muted/50 rounded-xl p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">休息日 2x</p>
            <p class="text-xl font-bold text-foreground font-mono">{{ fmtHours(totals.restOT) }}h</p>
            <p class="text-[11px] text-muted-foreground mt-1">可被补休替代</p>
          </div>
          <div class="bg-muted/50 rounded-xl p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">节假日 3x</p>
            <p class="text-xl font-bold text-foreground font-mono">{{ fmtHours(totals.holidayOT) }}h</p>
            <p class="text-[11px] text-muted-foreground mt-1">不得以补休代替</p>
          </div>
        </div>

        <!-- 等效标准工时 -->
        <div class="bg-muted/50 rounded-xl p-4">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-foreground">等效标准工时（含正常工时 ×1 + 各类加班 × 倍数）</p>
            <p class="text-2xl font-bold text-primary font-mono">{{ fmtHours(totals.equivalent) }}h</p>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed mt-1">
            正常 {{ fmtHours(totals.normalHours) }}h×1 + 平日 {{ fmtHours(totals.weekdayOT) }}h×1.5 + 休息日 {{ fmtHours(totals.restOT) }}h×2 + 节假日 {{ fmtHours(totals.holidayOT) }}h×3。
            休息日加班可安排补休替代 2x 工资；节假日加班必须支付 3x 工资、不能补休代替（劳动法第 44 条口径）。
          </p>
        </div>

        <!-- 加班费估算 -->
        <div>
          <label for="ts-rate" class="block text-sm font-medium text-foreground mb-2">小时薪（元 / 小时，用于加班费估算）</label>
          <div class="flex items-center gap-2">
            <input
              id="ts-rate"
              v-model.number="hourlyRate"
              type="number"
              min="0"
              step="1"
              placeholder="如 50"
              class="flex-1 min-w-0 px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元 / 小时</span>
          </div>
          <div v-if="rateNum > 0" class="mt-2 bg-primary/10 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground mb-1">本周加班费估算</p>
            <p class="text-2xl font-bold text-primary font-mono">¥{{ fmtMoney(totals.otPay) }}</p>
            <p class="text-[11px] text-muted-foreground mt-1">={{ fmtHours(totals.weekdayOT) }}h×1.5 + {{ fmtHours(totals.restOT) }}h×2 + {{ fmtHours(totals.holidayOT) }}h×3，× {{ fmtMoney(rateNum) }} 元/h</p>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed mt-1.5 flex items-start gap-1">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
            <span>加班费基数与倍数受劳动合同、工资结构（是否含加班费包）与地方口径影响，本估算为教学口径，以现行规定与合同约定为准。</span>
          </p>
        </div>

        <!-- 导出 -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            @click="exportCsv"
            class="px-3 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            <Download class="w-4 h-4 inline mr-1 -mt-0.5" /> 导出 CSV
          </button>
          <button
            @click="copyResult"
            class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <Copy class="w-4 h-4 inline mr-1 -mt-0.5" /> 复制周报
          </button>
        </div>
      </div>
    </div>

    <!-- 口径与免责声明（页面固定） -->
    <div class="border border-border bg-muted/30 rounded-lg p-4 mb-8 flex items-start gap-2 print:hidden">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        加班倍数依据：《中华人民共和国劳动法》第四十四条——延长工作时间不低于 150%、休息日（不能安排补休）不低于 200%、法定休假日不低于 300%（人社部门官方解读两源核对）。
        标准工时口径：《国务院关于职工工作时间的规定》每日 8 小时、每周 40 小时。本页为个人工时记录与教学演示工具，
        <b class="text-foreground">不构成劳动争议证据或法律意见</b>；加班认定与工资基数以现行法规、劳动合同与单位考勤制度为准。
      </p>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg mb-12 group print:hidden">
      <summary class="flex items-center justify-between cursor-pointer select-none px-6 py-4">
        <span class="text-lg font-semibold text-foreground"><span class="text-primary mr-2">#</span>加班倍数三档口径、工时表与考勤的区别及常见问题</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div class="px-6 pb-6 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">计算公式</h3>
          <div class="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed space-y-2">
            <p><strong>当日工时</strong> = 下班 − 上班 − 午休分钟（跨天班次暂不支持，两端都须在 24:00 前）。</p>
            <p><strong>平日加班</strong>（工作日）= max(0, 当日工时 − 8)，按 1.5 倍折算与计酬；<strong>休息日加班</strong>按当日全部工时 × 2（不能补休时）；<strong>法定节假日加班</strong>按当日全部工时 × 3。</p>
            <p><strong>等效标准工时</strong> = 正常工时 × 1 + 平日加班 × 1.5 + 休息日加班 × 2 + 节假日加班 × 3，用于把一周「打了个几倍工」折成可比数字。</p>
            <p><strong>加班费估算</strong> = 平日加班 × 1.5 × 小时薪 + 休息日加班 × 2 × 小时薪 + 节假日加班 × 3 × 小时薪（法定节假日当日带薪工资照发，300% 为另付加班费口径）。</p>
            <p><strong>标准工时</strong>：每日 8 小时、每周 40 小时（《国务院关于职工工作时间的规定》）。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">加班倍数的三档口径（劳动法第 44 条）</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            <b class="text-foreground">平日延时加班 150%</b>：工作日 8 小时以外延长的工时，只能付钱、不能拿补休抵；
            <b class="text-foreground">休息日加班 200%</b>：优先安排同等时间补休，补休了就不必付 2 倍工资，不能补休才付 200%；
            <b class="text-foreground">法定节假日加班 300%</b>：必须支付 300% 工资报酬，<b class="text-foreground">不得以补休代替</b>（且节假日当日带薪工资照发）。
            三档倍数经国家信访局转载法条原文与北京市人社局官方解读两源核对；实行综合计算工时制岗位的超时与法定节假日加班另有细则，以现行规定为准。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">工时表（Timesheet）和考勤有什么区别？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            考勤是<b class="text-foreground">事实记录</b>：几点打卡、缺勤几天，服务于工资扣发与纪律管理，与本站
            <NuxtLink to="/tools/attendance-calculator/" class="text-primary hover:underline">考勤计算器</NuxtLink>配套；
            工时表是<b class="text-foreground">工时台账</b>：以「小时」为单位归集每天的工作时长并按用途分类（正常 / 加班 / 项目工时），
            服务于加班费、综合工时周期核算、项目计费与外包结算。考勤回答「来了没有」，工时表回答「干了多少小时、哪部分该按几倍付」。
            两者常常互相印证，但计酬维度不同。
          </p>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">一天上了 10 小时班怎么算加班？</h3>
            <p class="text-sm text-muted-foreground mt-1">工作日按「超 8 小时部分」计平日加班：10 小时 = 8h 正常 + 2h 平日加班，加班费按 1.5 倍；午休扣除与否取决于单位制度，本表按你填写的午休分钟数直接扣减。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">周六来了 6 小时，能换成补休吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">可以。休息日加班 200% 的口径是「先补休、不能补休才付 2 倍工资」；单位安排了同等时间补休的，就不必支付加班费。法定节假日加班则不能用补休代替 300% 工资。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">等效标准工时是什么意思？</h3>
            <p class="text-sm text-muted-foreground mt-1">把一周的实际工时按法定倍数折算成「相当于多少小时的标准工时」：例如正常 8h + 休息日 6h + 节假日 8h 的等效 = 8×1 + 6×2 + 8×3 = 44h，可以直观比较不同周的劳动强度与应得报酬。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">数据会保存吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">本周记录自动保存在你浏览器的 localStorage 中，仅保存在本地设备、不上传服务器；点「清空」会清除本周全部记录。导出 CSV 可用 Excel / WPS 直接打开（UTF-8 BOM）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">跨天班次（如夜班到凌晨）能算吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">暂不支持：本表要求下班时间晚于上班时间且都在 24:00 前。夜班建议把凌晨部分按下班时间记录为跨天两段，或等待后续版本支持跨天。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">口径来源与自查提示</h3>
          <ul class="text-xs text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li>《中华人民共和国劳动法》第四十四条：150% / 200%（可补休替代） / 300%（不得补休代替）（国家信访局转载法条原文、北京市人社局官方解读两源核对）。</li>
            <li>《国务院关于职工工作时间的规定》：职工每日工作 8 小时、每周工作 40 小时。</li>
            <li>加班费计算基数、值班与加班的认定等以现行规定与裁审口径为准，<b class="text-foreground">本页仅供教学演示</b>。</li>
          </ul>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'timesheet-calculator'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Hourglass, Calculator, CalendarDays, Info, TriangleAlert,
  ChevronDown, RefreshCw, Copy, Download, Printer
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '工时表计算器 - 一周工时/加班时长统计与 CSV 导出在线工具',
  description: '免费在线工时表计算器：一周 7 天逐日填写上下班与午休，自动算工时并按劳动法 44 条分平日 1.5x、休息日 2x、节假日 3x 加班，输出等效标准工时与加班费估算，支持 CSV 导出、打印周报表与本地持久化',
  keywords: '工时表计算器,timesheet模板,每周工时计算,加班时长统计,平日加班1.5倍,休息日加班2倍,节假日加班3倍,工时记录表',
  author: '有条工具',
  ogTitle: '工时表计算器 - 一周工时/加班时长统计与 CSV 导出在线工具 | 有条工具',
  ogDescription: '一周逐日记工时，自动分平日 1.5x / 休息日 2x / 节假日 3x 加班，等效标准工时与加班费一键估算。',
  ogUrl: 'https://www.util.cn/tools/timesheet-calculator',
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
          name: '工时表计算器',
          url: 'https://www.util.cn/tools/timesheet-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['一周 7 天逐日工时记录', '当日工时 = 下班 − 上班 − 午休', '劳动法 44 条加班三档分类（1.5x / 2x / 3x）', '等效标准工时折算', '按小时薪估算加班费', 'CSV 导出与打印周报表', 'localStorage 本地持久化']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '实用工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '工时表计算器', item: 'https://www.util.cn/tools/timesheet-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '一天上了 10 小时班怎么算加班？',
              acceptedAnswer: { '@type': 'Answer', text: '工作日按超 8 小时部分计平日加班：10 小时 = 8h 正常 + 2h 平日加班，按 1.5 倍计酬；午休按你填写的分钟数扣除。' }
            },
            {
              '@type': 'Question',
              name: '周六来了 6 小时，能换成补休吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以。休息日加班 200% 的口径是先安排补休、不能补休才付 2 倍工资；法定节假日加班则不得以补休代替 300% 工资。' }
            },
            {
              '@type': 'Question',
              name: '等效标准工时是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '把一周工时按法定倍数折算成标准工时：正常工时×1 + 平日加班×1.5 + 休息日加班×2 + 节假日加班×3，如 8+6×2+8×3 = 44h。' }
            },
            {
              '@type': 'Question',
              name: '数据会保存吗？',
              acceptedAnswer: { '@type': 'Answer', text: '本周记录自动保存在浏览器 localStorage，仅存于本地设备不上传；可随时清空或导出 CSV（UTF-8 BOM，Excel 可直接打开）。' }
            },
            {
              '@type': 'Question',
              name: '跨天班次（如夜班到凌晨）能算吗？',
              acceptedAnswer: { '@type': 'Answer', text: '暂不支持，本表要求下班晚于上班且都在 24:00 前；夜班建议拆成两段记录。' }
            }
          ]
        }
      ]
    })
  }]
})

// ==PURE-START==
// ---------- 纯逻辑（可独立单测） ----------
// 口径依据（两源交叉核对）：
// - 《中华人民共和国劳动法》第四十四条：延长工作时间不低于 150%；休息日不能补休的不低于 200%；
//   法定休假日不低于 300%（不得以补休代替）。
// - 《国务院关于职工工作时间的规定》：每日 8 小时、每周 40 小时 → 标准工时 5×8 = 40。
// - 平日加班只按「超 8h 部分」计 1.5x；休息日 / 节假日按当日全部工时计 2x / 3x。
// - 跨天不支持：下班必须晚于上班（24:00 前）。
// 时长以「分钟」为内部单位，展示与输出定点到 0.01 小时。

const STANDARD_DAY_HOURS = 8
const STANDARD_WEEK_HOURS = 40

// "HH:MM" → 当日分钟数；非法返回 null
function timeToMin(s) {
  if (typeof s !== 'string') return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

// 当日工时（小时）：下班 − 上班 − 午休；非法时间或跨天（end ≤ start）→ { valid: false }；
// 午休超过在岗时长 → 按 0 计并标记 lunchExceed。返回 { hours, valid, lunchExceed }。
function dayHoursOf(start, end, lunchMinutes) {
  const s = timeToMin(start)
  const e = timeToMin(end)
  if (s === null || e === null || e <= s) return { hours: 0, valid: false, lunchExceed: false }
  const span = e - s
  const lunch = Math.max(0, Math.round(Number(lunchMinutes) || 0))
  if (lunch >= span) return { hours: 0, valid: true, lunchExceed: true }
  return { hours: Math.round(((span - lunch) / 60) * 100) / 100, valid: true, lunchExceed: false }
}

// 按日类型拆分加班（小时）：work → 正常 + 超时 1.5x；rest → 全部 2x；holiday → 全部 3x；leave → 不计
function splitOtOf(type, hours) {
  const h = Math.max(0, Number(hours) || 0)
  if (type === 'work') {
    const normal = Math.min(STANDARD_DAY_HOURS, h)
    return { normal, weekdayOT: Math.round((h - normal) * 100) / 100, restOT: 0, holidayOT: 0 }
  }
  if (type === 'rest') return { normal: 0, weekdayOT: 0, restOT: h, holidayOT: 0 }
  if (type === 'holiday') return { normal: 0, weekdayOT: 0, restOT: 0, holidayOT: h }
  return { normal: 0, weekdayOT: 0, restOT: 0, holidayOT: 0 }
}

// 等效标准工时 = 正常 ×1 + 平日加班 ×1.5 + 休息日 ×2 + 节假日 ×3
function equivalentOf(normal, weekdayOT, restOT, holidayOT) {
  return Math.round((normal + weekdayOT * 1.5 + restOT * 2 + holidayOT * 3) * 100) / 100
}

// 加班费估算 = 各档时长 × 倍数 × 小时薪（0.01 定点）
function otPayOf(weekdayOT, restOT, holidayOT, hourlyRate) {
  const rate = Math.max(0, Number(hourlyRate) || 0)
  if (rate <= 0) return 0
  return Math.round((weekdayOT * 1.5 + restOT * 2 + holidayOT * 3) * rate * 100) / 100
}

// 给定任一 YYYY-MM-DD（或空），返回本周（周一为起点）7 天的日期数组；
// 传入非法 / 空日期时回退到今天所在周。
function weekDatesOf(dateStr, DateCtor) {
  let base = null
  const parts = typeof dateStr === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr) : null
  if (parts) {
    base = new DateCtor(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))
  } else {
    base = new DateCtor()
  }
  const shift = (base.getDay() + 6) % 7 // 周一=0 … 周日=6
  const monday = new DateCtor(base.getFullYear(), base.getMonth(), base.getDate() - shift)
  const out = []
  for (let i = 0; i < 7; i++) {
    const d = new DateCtor(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    out.push(`${d.getFullYear()}-${mm}-${dd}`)
  }
  return out
}

// 日期是周六 / 周日 → 建议默认类型 rest，否则 work
function defaultTypeOf(dateStr, DateCtor) {
  const parts = typeof dateStr === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr) : null
  if (!parts) return 'work'
  const wd = new DateCtor(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])).getDay()
  return wd === 0 || wd === 6 ? 'rest' : 'work'
}

// 周几标签（含周末强调），非法日期返回空串
function weekdayLabelOf(dateStr, DateCtor) {
  const parts = typeof dateStr === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr) : null
  if (!parts) return ''
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return names[new DateCtor(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])).getDay()] || ''
}

// CSV 组装：表头 + 7 行（日期/类型/上班/下班/工时/加班分类），含 UTF-8 BOM，字段做引号转义
function csvOf(rows, typeLabels) {
  const esc = (v) => {
    const s = String(v === null || v === undefined ? '' : v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const otTagOf = (row) => {
    const res = dayHoursOf(row.start, row.end, row.lunch)
    if (!res.valid || res.lunchExceed) return res.lunchExceed ? '午休超时长' : '未打卡/无效'
    const split = splitOtOf(row.type, res.hours)
    if (row.type === 'rest') return `休息日加班${res.hours}h(2x)`
    if (row.type === 'holiday') return `法定节假日加班${res.hours}h(3x)`
    if (row.type === 'leave') return '休假不计工时'
    return split.weekdayOT > 0 ? `平日加班${split.weekdayOT}h(1.5x)` : '无加班'
  }
  const lines = ['日期,类型,上班,下班,工时,加班分类']
  rows.forEach((row) => {
    const res = dayHoursOf(row.start, row.end, row.lunch)
    lines.push([
      esc(row.date),
      esc(typeLabels[row.type] || row.type),
      esc(row.start || ''),
      esc(row.end || ''),
      res.valid && !res.lunchExceed ? res.hours.toFixed(2) : '0.00',
      esc(otTagOf(row))
    ].join(','))
  })
  return '\uFEFF' + lines.join('\n')
}

// 小时展示：最多 2 位小数、去尾零
function fmtHours(n) {
  const v = Math.round((Number(n) || 0) * 100) / 100
  return String(v)
}

// 金额展示：千分位 + 固定 2 位小数
function fmtMoney(n) {
  const v = Math.round((Number(n) || 0) * 100) / 100
  const sign = v < 0 ? '-' : ''
  const parts = Math.abs(v).toFixed(2).split('.')
  return sign + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1]
}
// ==PURE-END==

// ---------- 页面状态 ----------
const TYPE_LABELS = { work: '工作日', rest: '休息日', holiday: '节假日', leave: '休假' }
const STORAGE_KEY = 'timesheet-weekly-v1'

const hourlyRate = ref(50)
const rows = ref([])

function emptyRow(dateStr) {
  return { date: dateStr || '', type: 'work', start: '', end: '', lunch: 60 }
}

function initRows(dateStr) {
  const dates = weekDatesOf(dateStr, Date)
  rows.value = dates.map((d) => ({ ...emptyRow(d), type: defaultTypeOf(d, Date) }))
}

// 载入 localStorage（仅浏览器），非法数据回退为本周默认
function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    if (!Array.isArray(data) || data.length !== 7) return false
    rows.value = data.map((r, i) => ({
      date: typeof r.date === 'string' ? r.date : '',
      type: ['work', 'rest', 'holiday', 'leave'].includes(r.type) ? r.type : 'work',
      start: typeof r.start === 'string' ? r.start : '',
      end: typeof r.end === 'string' ? r.end : '',
      lunch: isFinite(Number(r.lunch)) && Number(r.lunch) >= 0 ? Number(r.lunch) : 60
    }))
    return true
  } catch (e) {
    return false
  }
}

// 持久化（防抖写 localStorage）
let saveTimer = null
watch(rows, () => {
  if (typeof window === 'undefined') return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.value))
    } catch (e) { /* 存储不可用时静默跳过 */ }
  }, 200)
}, { deep: true })

onMounted(() => {
  addRecentTool('timesheet-calculator')
  const saved = loadSaved()
  if (!saved) {
    initRows('')
  } else if (!rows.value.some((r) => r.date)) {
    // 旧记录没有日期时，补成本周日期
    const dates = weekDatesOf('', Date)
    rows.value.forEach((r, i) => { if (!r.date) r.date = dates[i] })
  }
})

// ---------- 逐日派生 ----------
const rowMinutes = computed(() => rows.value.map((row) => {
  const any = row.start || row.end
  if (!any) return null
  return dayHoursOf(row.start, row.end, row.lunch)
}))

const totals = computed(() => {
  let totalHours = 0
  let normalHours = 0
  let weekdayOT = 0
  let restOT = 0
  let holidayOT = 0
  rows.value.forEach((row) => {
    const res = dayHoursOf(row.start, row.end, row.lunch)
    if (!res.valid || res.lunchExceed) return
    const split = splitOtOf(row.type, res.hours)
    totalHours += res.hours
    normalHours += split.normal
    weekdayOT += split.weekdayOT
    restOT += split.restOT
    holidayOT += split.holidayOT
  })
  totalHours = Math.round(totalHours * 100) / 100
  normalHours = Math.round(normalHours * 100) / 100
  weekdayOT = Math.round(weekdayOT * 100) / 100
  restOT = Math.round(restOT * 100) / 100
  holidayOT = Math.round(holidayOT * 100) / 100
  const otHours = Math.round((weekdayOT + restOT + holidayOT) * 100) / 100
  return {
    totalHours,
    standardHours: STANDARD_WEEK_HOURS,
    otHours,
    normalHours,
    weekdayOT,
    restOT,
    holidayOT,
    equivalent: equivalentOf(normalHours, weekdayOT, restOT, holidayOT),
    otPay: otPayOf(weekdayOT, restOT, holidayOT, hourlyRate.value)
  }
})

const rateNum = computed(() => Math.max(0, Number(hourlyRate.value) || 0))

// 逐日加班分类文案与配色
function otLabelFor(item, type) {
  if (!item) return '未打卡'
  if (!item.valid) return '时间无效'
  if (item.lunchExceed) return '午休超时长'
  if (item.hours === 0) return '无在岗时长'
  const split = splitOtOf(type, item.hours)
  if (type === 'rest') return `休息日 ${fmtHours(item.hours)}h ×2`
  if (type === 'holiday') return `节假日 ${fmtHours(item.hours)}h ×3`
  if (type === 'leave') return '休假不计工时'
  return split.weekdayOT > 0 ? `平日加班 ${fmtHours(split.weekdayOT)}h ×1.5` : '无加班'
}

function otBadgeCls(item, type) {
  if (!item || !item.valid || item.lunchExceed || item.hours === 0) return 'text-muted-foreground'
  if (type === 'leave') return 'text-muted-foreground'
  return 'text-primary font-medium'
}

function weekdayLabel(dateStr) {
  return weekdayLabelOf(dateStr, Date)
}

// ---------- 操作 ----------
function loadExample() {
  const dates = weekDatesOf('', Date)
  const mk = (i, type, start, end, lunch) => ({ date: dates[i], type, start, end, lunch })
  rows.value = [
    mk(0, 'work', '09:00', '18:00', 60),    // 周一 8h 正常
    mk(1, 'holiday', '09:00', '17:00', 0),  // 周二 法定节假日 8h ×3
    mk(2, 'work', '09:00', '19:00', 60),    // 周三 9h（1h 平日加班 1.5x）
    mk(3, 'work', '09:00', '18:00', 60),    // 周四 8h 正常
    mk(4, 'work', '09:00', '18:00', 60),    // 周五 8h 正常
    mk(5, 'rest', '10:00', '16:00', 0),     // 周六 休息日 6h ×2
    mk(6, 'leave', '', '', 60)              // 周日 休假
  ]
}

function clearWeek() {
  const dates = weekDatesOf(rows.value[0] && rows.value[0].date ? rows.value[0].date : '', Date)
  rows.value = dates.map((d) => emptyRow(d))
}

function exportCsv() {
  const csv = csvOf(rows.value, TYPE_LABELS)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `timesheet-${rows.value[0] && rows.value[0].date ? rows.value[0].date : 'week'}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function copyResult() {
  const t = totals.value
  const lines = [
    '【本周工时表】',
    `总工时 ${fmtHours(t.totalHours)}h（标准 ${t.standardHours}h，加班 ${fmtHours(t.otHours)}h）`,
    `平日加班 ${fmtHours(t.weekdayOT)}h×1.5 / 休息日 ${fmtHours(t.restOT)}h×2 / 节假日 ${fmtHours(t.holidayOT)}h×3`,
    `等效标准工时 ${fmtHours(t.equivalent)}h`,
    rateNum.value > 0 ? `加班费估算 ¥${fmtMoney(t.otPay)}（小时薪 ${fmtMoney(rateNum.value)} 元）` : '未填小时薪，未估算加班费',
    rows.value.map((r, i) => {
      const item = rowMinutes.value[i]
      return `${r.date || '未填日期'} ${TYPE_LABELS[r.type]} ${r.start || '--'}-${r.end || '--'} ${item && item.valid && !item.lunchExceed ? fmtHours(item.hours) + 'h' : '—'} ${otLabelFor(item, r.type)}`
    }).join('\n'),
    '免责：教学演示口径，以现行规定与单位考勤制度为准。'
  ].join('\n')
  navigator.clipboard.writeText(lines).then(() => alert('已复制')).catch(() => alert('复制失败，请手动复制'))
}

function printReport() {
  window.print()
}
</script>
