<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <PiggyBank class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">52周存钱计划</h1>
          <p class="text-sm text-muted-foreground mt-1">正序/倒序/随机/固定四种 52 周存钱挑战，逐周打卡、月度小计、一键打印 A4 存钱表贴墙</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        经典 52 周存钱法：第 1 周存 10 元、每周多存 10 元，第 52 周存 520 元，一年正好攒下 13,780 元。本页把它做成可打卡的存钱挑战表：
        支持正序递增、倒序先难后易、随机洗牌（每周抽盲盒）与每周固定金额四种模式，起步金额与步长均可自定义；每周点一下即完成打卡，
        自动统计已存金额、进度百分比与月度小计，断了的周随时补卡；打卡记录只保存在你的浏览器本地，不上传任何数据。
        打印时只输出进度卡与 52 周表格，A4 打出来贴墙手写打卡正合适。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：计划设置 -->
      <div class="no-print bg-card border border-border rounded-lg p-6 space-y-4 h-fit">
        <h2 class="text-lg font-semibold flex items-center">
          <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 计划设置
        </h2>

        <!-- 存钱模式 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">存钱模式</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="m in MODES"
              :key="m.id"
              @click="applyMode(m.id)"
              class="px-3 py-2 rounded-lg border text-left transition"
              :class="mode === m.id ? 'border-primary bg-primary/10' : 'border-border bg-muted/40 hover:bg-muted/70'"
            >
              <span class="block text-sm font-medium" :class="mode === m.id ? 'text-primary' : 'text-foreground'">{{ m.name }}</span>
              <span class="block text-[10px] text-muted-foreground mt-0.5">{{ m.desc }}</span>
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-2 leading-relaxed">{{ planHint }}</p>
        </div>

        <!-- 起步金额 / 固定金额 -->
        <div>
          <label for="sct-base" class="block text-sm font-medium text-foreground mb-2">{{ baseLabel }}</label>
          <input
            id="sct-base"
            v-model.number="base"
            @change="onPlanParamChange"
            type="number"
            min="1"
            step="1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <!-- 递增步长（固定模式不需要） -->
        <div v-if="mode !== 'fixed'">
          <label for="sct-step" class="block text-sm font-medium text-foreground mb-2">每周步长（元/周）</label>
          <input
            id="sct-step"
            v-model.number="step"
            @change="onPlanParamChange"
            type="number"
            min="0"
            step="1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <!-- 洗牌种子（仅随机模式） -->
        <div v-if="mode === 'shuffle'" class="flex items-center justify-between gap-2 bg-muted/50 rounded-lg px-3 py-2.5">
          <span class="text-sm text-muted-foreground">洗牌种子 <span class="font-mono text-foreground font-semibold">#{{ seed }}</span></span>
          <button
            @click="rerollSeed"
            class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition shrink-0"
            title="换一个随机种子，金额顺序整体重排"
          >
            <RefreshCw class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 换一批
          </button>
        </div>

        <!-- 当前计划摘要 -->
        <div class="bg-primary/10 rounded-lg p-4 space-y-1.5">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">52 周总目标</span>
            <span class="font-bold text-primary">¥{{ fmtMoney(planTotal) }}</span>
          </div>
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>第 1 周</span><span class="font-mono">¥{{ fmtMoney(firstAmount) }}</span>
          </div>
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>第 52 周</span><span class="font-mono">¥{{ fmtMoney(lastAmount) }}</span>
          </div>
        </div>

        <!-- 切换/改参提示 -->
        <p
          v-if="changeNotice"
          class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground flex items-start gap-1.5"
        >
          <Info class="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>{{ changeNotice }}</span>
        </p>
        <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span>打卡记录只保存在本机浏览器，不上传服务器；修改模式、金额或洗牌种子会清空打卡进度——不同计划下同一周对应的金额不同，旧打卡无法沿用。</span>
        </p>
      </div>

      <!-- 右：进度卡 + 52 周表格（lg 占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <div class="no-print flex items-center justify-between flex-wrap gap-3">
          <h2 class="text-lg font-semibold flex items-center">
            <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 52 周存钱打卡表
          </h2>
          <div class="flex gap-2">
            <button
              @click="printPlan"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
            >
              <Printer class="w-4 h-4" /> 打印存钱表
            </button>
            <button
              @click="resetProgress"
              class="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center gap-1.5"
            >
              <RefreshCw class="w-4 h-4" /> 重置打卡
            </button>
          </div>
        </div>

        <!-- 打印区域：只输出进度卡 + 表格 -->
        <div class="print-area space-y-4">
          <!-- 进度卡 -->
          <div class="bg-card border border-border rounded-lg p-6">
            <h3 class="text-lg font-semibold flex items-center mb-4">
              <TrendingUp class="w-5 h-5 mr-2 text-primary" /> 进度总览
            </h3>
            <div class="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <p class="text-xs text-muted-foreground mb-1">已存入金额</p>
                <p class="text-4xl font-bold text-primary">¥{{ fmtMoney(progress.savedAmount) }}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <div class="bg-muted/50 rounded-lg px-4 py-2.5 min-w-[112px]">
                  <p class="text-[10px] text-muted-foreground mb-0.5">已完成周</p>
                  <p class="text-lg font-bold text-foreground">{{ progress.doneCount }}<span class="text-xs font-normal text-muted-foreground"> / {{ TOTAL_WEEKS }} 周</span></p>
                </div>
                <div class="bg-muted/50 rounded-lg px-4 py-2.5 min-w-[112px]">
                  <p class="text-[10px] text-muted-foreground mb-0.5">总目标</p>
                  <p class="text-lg font-bold text-foreground">¥{{ fmtMoney(planTotal) }}</p>
                </div>
                <div class="bg-muted/50 rounded-lg px-4 py-2.5 min-w-[112px]">
                  <p class="text-[10px] text-muted-foreground mb-0.5">剩余待存</p>
                  <p class="text-lg font-bold text-foreground">¥{{ fmtMoney(progress.remaining) }}</p>
                </div>
                <div v-if="mode === 'desc'" class="bg-amber-500/10 rounded-lg px-4 py-2.5 min-w-[112px]">
                  <p class="text-[10px] text-muted-foreground mb-0.5">剩余最高周</p>
                  <p class="text-lg font-bold text-amber-600">¥{{ fmtMoney(maxRemaining) }}</p>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div class="h-full bg-green-500 rounded-full transition-all duration-300" :style="{ width: progress.pct + '%' }"></div>
              </div>
              <span class="text-sm font-semibold text-foreground tabular-nums">{{ progress.pct }}%</span>
            </div>
          </div>

          <!-- 52 周表格（含 13 行月度小计） -->
          <div class="bg-card border border-border rounded-lg overflow-hidden">
            <div class="table-scroll overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-muted/60 text-muted-foreground">
                    <th class="px-4 py-2.5 text-left font-medium whitespace-nowrap">周数</th>
                    <th class="px-4 py-2.5 text-right font-medium whitespace-nowrap">应存金额</th>
                    <th class="px-4 py-2.5 text-center font-medium whitespace-nowrap">打卡</th>
                    <th class="px-4 py-2.5 text-right font-medium whitespace-nowrap">累计金额</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="row in displayRows" :key="row.type === 'week' ? 'w' + row.week : 'm' + row.month">
                    <!-- 周行 -->
                    <tr
                      v-if="row.type === 'week'"
                      class="border-t border-border transition-colors"
                      :class="row.done ? 'bg-green-500/10' : 'hover:bg-muted/40'"
                    >
                      <td class="px-4 py-2 whitespace-nowrap" :class="row.done ? 'text-green-700 font-medium' : 'text-foreground'">第 {{ row.week }} 周</td>
                      <td class="px-4 py-2 text-right font-mono whitespace-nowrap" :class="row.done ? 'text-green-700' : 'text-foreground'">¥{{ fmtMoney(row.amount) }}</td>
                      <td class="px-4 py-2 text-center">
                        <button
                          @click="toggleDone(row.week)"
                          :aria-pressed="row.done"
                          :title="row.done ? '取消打卡' : '标记本周已存'"
                          class="inline-flex items-center justify-center w-7 h-7 rounded-full transition"
                          :class="row.done ? 'text-green-600' : 'text-muted-foreground/40 hover:text-primary'"
                        >
                          <CheckCircle v-if="row.done" class="w-5 h-5" />
                          <span v-else class="block w-4 h-4 rounded-full border-2 border-current"></span>
                        </button>
                      </td>
                      <td class="px-4 py-2 text-right font-mono text-muted-foreground whitespace-nowrap">¥{{ fmtMoney(row.cumulative) }}</td>
                    </tr>
                    <!-- 月度小计行（第 1-4 周 = 1 月 … 第 49-52 周 = 13 月） -->
                    <tr v-else class="bg-muted/50 border-t border-border">
                      <td colspan="4" class="px-4 py-1.5 text-xs">
                        <div class="flex items-center justify-between gap-2 flex-wrap">
                          <span class="font-semibold text-foreground">第 {{ row.month }} 月小计 · 第 {{ row.fromWeek }}-{{ row.toWeek }} 周</span>
                          <span class="font-mono text-muted-foreground">
                            应存 ¥{{ fmtMoney(row.subtotal) }}<template v-if="row.doneCount > 0"> · 已存 <span class="text-green-700 font-semibold">¥{{ fmtMoney(row.saved) }}</span>（{{ row.doneCount }}/{{ row.weekCount }} 周）</template>
                          </span>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
            <p class="px-4 py-2.5 text-[11px] text-muted-foreground border-t border-border leading-relaxed">
              「累计金额」为第 1 周至该周的应存累计（计划口径，与打卡无关），已存金额与进度见上方进度卡；月度小计按每 4 周一组，方便对照发薪日与记账。
            </p>
          </div>
        </div>

        <!-- 本周该存高亮卡（按未完成的最早周推荐） -->
        <div v-if="nextDue" class="no-print bg-primary/10 border border-primary/30 rounded-lg p-5 flex items-center gap-4 flex-wrap">
          <div class="p-2.5 bg-primary/10 rounded-full shrink-0">
            <Play class="w-5 h-5 text-primary" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground mb-0.5">本周该存</p>
            <p class="text-xl font-bold text-foreground">第 {{ nextDue.week }} 周 · ¥{{ fmtMoney(nextDue.amount) }}</p>
          </div>
          <p class="text-xs text-muted-foreground sm:ml-auto max-w-[240px]">按未完成的最早一周推荐，存完到表格里点一下勾即可</p>
        </div>
        <div v-else class="no-print bg-green-500/10 border border-green-500/30 rounded-lg p-5 flex items-center gap-3">
          <CheckCircle class="w-6 h-6 text-green-600 shrink-0" />
          <p class="font-semibold text-foreground">52 周全部完成！一年共存下 ¥{{ fmtMoney(planTotal) }}，给自己点个赞。</p>
        </div>

        <!-- 静态提示条 -->
        <p class="no-print text-xs leading-relaxed p-3 rounded-lg bg-muted/60 text-muted-foreground flex items-start gap-2">
          <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span>存钱挑战的意义不是 13780 这个数字，是给「每周存一点」一个可见的节奏；断了一周就补上，别弃疗。</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>52周存钱法是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          52周存钱法是一年期的阶梯攒钱方法：第 1 周存 10 元，第 2 周存 20 元，每周比上一周多存 10 元，直到第 52 周存 520 元。
          每周金额构成等差数列（首项 10、公差 10、共 52 项），全年总额 = (首周 + 末周) × 52 ÷ 2 = (10 + 520) × 26 = 13,780 元，
          这就是流传最广的「一年攒下 13780」的来历。本工具在经典规则上做了扩展：可以倒过来存（先难后易）、可以洗牌（每周抽盲盒）、
          可以每周固定一个金额，也可以自定义起步金额与步长，并配逐周打卡与月度小计。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">倒序和正序，哪个更容易坚持？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          心理学口径上更常被推荐的是倒序（先难后易）：年初刚立完目标动力最足，趁热打铁先完成 520 元、510 元这些「大额周」，
          越到后面越轻松，年底只剩 10 元、20 元的「奖励周」；正序则前几周几乎无感、容易上手，但到了 11、12 月要连续存 400 元以上，
          正好撞上年末开销高峰，是弃坑的重灾区。「倒序放弃率更低」是网上常见的经验说法，但核心还是匹配自己的现金流：
          年终奖丰厚选正序也行，每月房租压力大就选倒序或固定档。两种顺序总额完全一样，工具里的统计口径不受影响。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">中途断了怎么办？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          断一周不等于失败。常用的三种容错方式：一是补存——第 N 周忘存了，第 N+1 周把两笔一起存上，再把打卡补齐；
          二是双倍周——手头宽裕的周主动多存一周的量，给未来的忙季留缓冲；三是换随机洗牌模式——金额被打乱后没有
          「这周要存 500」的心理负担，抽到多少存多少，断签的心理成本最低，适合已经断过几次、需要重启的人。
          本工具按周号记录打卡，补存后把对应周勾上即可，已存金额与进度会自动补算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">一年能存下多少？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          取决于起步金额和步长，自定义档位总额 = (起步金额 × 2 + 步长 × 51) × 26。常用档位举例：经典档起步 10、步长 10 → 13,780 元；
          进阶档起步 20、步长 20 → 27,560 元；轻量档每周固定 100 元 → 5,200 元；稳健档每周固定 200 元 → 10,400 元；
          学生党或现金流紧张时可以自定义起步 5、步长 5（全年 6,890 元），先跑通一年再加大力度。倒序只是把同样的金额反过来排，总额不变。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">打卡记录存在哪？会上传吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          全部打卡记录、模式与金额设置只保存在你当前浏览器的 localStorage 里，本页面不发送任何网络请求，不上传服务器。
          也因此：换浏览器、换设备或清除浏览器数据后记录不会跟着走；隐私/无痕模式可能禁用本地存储，工具会自动降级为仅内存记录（关页即清）。
          想长期留存，可以点「打印存钱表」把 52 周表格打出来贴墙，纸质打卡与线上打卡双轨并行。
        </p>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'savings-challenge-tracker'" :category="'finance'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  PiggyBank, CheckCircle, Printer, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, CalendarDays, TrendingUp
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '52周存钱计划 - 在线52周存钱挑战打卡表（正序/倒序/随机/固定）',
  description: '52周存钱计划打卡工具：正序递增、倒序先难后易、随机洗牌、每周固定四种模式一键生成52周阶梯存钱表，自动算累计金额与月度小计，逐周打卡统计已存金额与进度，支持打印A4存钱表贴墙，记录只存本地浏览器不上传',
  keywords: '52周存钱,存钱挑战,阶梯存钱,存钱计划表,攒钱方法',
  author: '有条工具',
  ogTitle: '52周存钱计划 - 在线52周存钱挑战打卡表 | 有条工具',
  ogDescription: '正序/倒序/随机洗牌/每周固定四种52周存钱模式，逐周打卡、月度小计、一键打印A4存钱表。',
  ogUrl: 'https://www.util.cn/tools/savings-challenge-tracker',
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
          name: '52周存钱计划',
          url: 'https://www.util.cn/tools/savings-challenge-tracker',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['正序/倒序/随机洗牌/每周固定四种模式', '52周逐周打卡与进度统计', '月度小计与累计金额对照表', '确定性随机洗牌（同种子同结果）', '本周该存智能推荐', '一键打印A4存钱表', '打卡进度本地保存不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '52周存钱计划', item: 'https://www.util.cn/tools/savings-challenge-tracker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '52周存钱法是什么？13780怎么来的？',
              acceptedAnswer: { '@type': 'Answer', text: '第1周存10元、每周比上一周多存10元、第52周存520元的阶梯存钱方法。每周金额是等差数列，全年合计按求和公式 (10+520)×52÷2 = 13780 元。' }
            },
            {
              '@type': 'Question',
              name: '倒序和正序哪个更容易坚持？',
              acceptedAnswer: { '@type': 'Answer', text: '常见说法是倒序（先难后易）更容易坚持：趁年初动力最强先完成520元、510元的大额周，越到后面越轻松；正序上手快，但年末要连续存400元以上，容易撞上开销高峰。两种顺序总额相同，匹配自己现金流才是关键。' }
            },
            {
              '@type': 'Question',
              name: '中途断了怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '下一周把两笔一起补存，或安排双倍周提前多存一周对冲忙季；也可以换随机洗牌模式，金额无规律、断签心理成本低，补上打卡即可继续。' }
            },
            {
              '@type': 'Question',
              name: '一年能存下多少？',
              acceptedAnswer: { '@type': 'Answer', text: '默认起步10元、步长10元是13780元；起步20、步长20是27560元；每周固定100元是5200元、固定200元是10400元。自定义时总额 = (起步金额×2 + 步长×51) × 26。' }
            },
            {
              '@type': 'Question',
              name: '打卡记录存在哪里？会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '只保存在当前浏览器的 localStorage 中，不上传服务器；换设备、换浏览器或清除浏览器数据不会同步，隐私模式下自动降级为仅内存记录。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const TOTAL_WEEKS = 52
const MONTH_SIZE = 4  // 每月按 4 周一组：第 1-4 周 = 1 月 … 第 49-52 周 = 13 月
const STORAGE_KEY = 'savings-challenge-tracker:v1'

// 金额兜底：非法输入回退默认值，负数归零、越界截断，保留两位小数
function sanitizeAmount(value, fallback, max) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  const clamped = Math.min(Math.max(n, 0), max)
  return Math.round(clamped * 100) / 100
}

// LCG 伪随机（MINSTD：x = x·48271 mod 2^31-1）：同一种子产生同一序列，确定性洗牌的基础
function lcgRandom(seed) {
  let state = Math.floor(Math.abs(Number(seed) || 0)) % 2147483647
  if (state === 0) state = 1
  return function next() {
    state = (state * 48271) % 2147483647
    return state / 2147483647
  }
}

// Fisher-Yates 洗牌：不改动入参数组，同 seed 同结果
function shuffleList(list, seed) {
  const arr = list.slice()
  const rand = lcgRandom(seed)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

// 洗牌一份计划：金额被打乱重排，周号按 1..N 重新对应（同 seed 同结果）
function shufflePlan(plan, seed) {
  const amounts = shuffleList(plan.map((p) => p.amount), seed)
  return plan.map((p, i) => ({ week: i + 1, amount: amounts[i] }))
}

// 生成计划：asc 正序（base 起步、每周 +step）/ desc 倒序（反排，第 1 周最大）/
// fixed 每周全等（只用 base）/ shuffle 确定性洗牌（同 seed 同结果）
function buildPlan(mode, base, step, weeks = TOTAL_WEEKS, seed = 1) {
  const b = sanitizeAmount(base, 10, 100000)
  const st = sanitizeAmount(step, 10, 10000)
  const n = Math.max(1, Math.min(200, Math.floor(Number(weeks) || TOTAL_WEEKS)))
  let plan
  if (mode === 'fixed') {
    plan = Array.from({ length: n }, (_, i) => ({ week: i + 1, amount: b }))
  } else {
    plan = Array.from({ length: n }, (_, i) => ({ week: i + 1, amount: b + i * st }))
  }
  if (mode === 'desc') {
    plan = plan.slice().reverse().map((p, i) => ({ week: i + 1, amount: p.amount }))
  }
  if (mode === 'shuffle') {
    plan = shufflePlan(plan, seed)
  }
  return plan
}

// 计划总额：所有周金额求和（等差序列即 (首+末)×周数÷2）
function planTotalOf(plan) {
  const sum = plan.reduce((s, p) => s + p.amount, 0)
  return Math.round(sum * 100) / 100
}

// 累计应存：第 i 项 = 第 1 周到第 i 周的应存总额（计划口径，与打卡无关，打印贴墙用）
function cumulativePlanOf(plan) {
  const out = []
  let acc = 0
  for (const p of plan) {
    acc += p.amount
    out.push(Math.round(acc * 100) / 100)
  }
  return out
}

// 打卡进度：doneSet 为已完成周号集合，已存金额按已完成周的 amount 求和
function progressOf(plan, doneSet) {
  const total = planTotalOf(plan)
  let savedAmount = 0
  let doneCount = 0
  for (const p of plan) {
    if (doneSet.has(p.week)) {
      savedAmount += p.amount
      doneCount += 1
    }
  }
  savedAmount = Math.round(savedAmount * 100) / 100
  return {
    doneCount,
    savedAmount,
    remaining: Math.round((total - savedAmount) * 100) / 100,
    pct: total > 0 ? Math.round((savedAmount / total) * 1000) / 10 : 0
  }
}

// 按月分组：每 4 周一组，第 1-4 周 = 1 月 … 第 49-52 周 = 13 月（展示/打印用）
function monthGroupOf(plan) {
  const groups = []
  for (let i = 0; i < plan.length; i += MONTH_SIZE) {
    const chunk = plan.slice(i, i + MONTH_SIZE)
    groups.push({
      month: groups.length + 1,
      fromWeek: chunk[0].week,
      toWeek: chunk[chunk.length - 1].week,
      weeks: chunk,
      subtotal: Math.round(chunk.reduce((s, p) => s + p.amount, 0) * 100) / 100
    })
  }
  return groups
}

// 一组周里已打卡的笔数与金额（月度小计行的「已存」口径）
function sumDoneOf(entries, doneSet) {
  let count = 0
  let saved = 0
  for (const p of entries) {
    if (doneSet.has(p.week)) {
      count += 1
      saved += p.amount
    }
  }
  return { count, saved: Math.round(saved * 100) / 100 }
}

// 本周该存：未完成周里最早的一周；全部完成返回 null
function nextDueOf(plan, doneSet) {
  for (const p of plan) {
    if (!doneSet.has(p.week)) return p
  }
  return null
}

// 剩余最高周金额（倒序模式展示「最难的还剩多少」）
function maxRemainingOf(plan, doneSet) {
  let max = 0
  for (const p of plan) {
    if (!doneSet.has(p.week) && p.amount > max) max = p.amount
  }
  return max
}

// 金额格式化：千分位 + 最多两位小数
function fmtMoney(n) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '0'
  return (Math.round(num * 100) / 100).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

// ---------- 页面状态 ----------
const MODES = [
  { id: 'asc', name: '正序递增', desc: '先易后难，第 1 周 10 元起步' },
  { id: 'desc', name: '倒序递减', desc: '先难后易，第 1 周就存大头' },
  { id: 'shuffle', name: '随机洗牌', desc: '每周抽盲盒，金额无规律' },
  { id: 'fixed', name: '每周固定', desc: '每周存一样多，简单直接' }
]

const mode = ref('asc')
const base = ref(10)
const step = ref(10)
const seed = ref(42)
const doneWeeks = ref(new Set())
const changeNotice = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const plan = computed(() => buildPlan(mode.value, base.value, step.value, TOTAL_WEEKS, seed.value))
const planTotal = computed(() => planTotalOf(plan.value))
const cumulativeList = computed(() => cumulativePlanOf(plan.value))
const progress = computed(() => progressOf(plan.value, doneWeeks.value))
const nextDue = computed(() => nextDueOf(plan.value, doneWeeks.value))
const maxRemaining = computed(() => maxRemainingOf(plan.value, doneWeeks.value))
const firstAmount = computed(() => plan.value[0].amount)
const lastAmount = computed(() => plan.value[plan.value.length - 1].amount)
const planMin = computed(() => plan.value.reduce((m, p) => Math.min(m, p.amount), Infinity))
const planMax = computed(() => plan.value.reduce((m, p) => Math.max(m, p.amount), 0))
const baseLabel = computed(() => (mode.value === 'fixed' ? '每周固定金额（元/周）' : '起步金额（元/周）'))

const planHint = computed(() => {
  if (mode.value === 'asc') {
    return `第 1 周存 ¥${fmtMoney(firstAmount.value)}，每周多存 ¥${fmtMoney(step.value)}，第 52 周存 ¥${fmtMoney(lastAmount.value)}。`
  }
  if (mode.value === 'desc') {
    return `先难后易：第 1 周就存 ¥${fmtMoney(firstAmount.value)}，每周递减 ¥${fmtMoney(step.value)}，第 52 周只需 ¥${fmtMoney(lastAmount.value)}。`
  }
  if (mode.value === 'shuffle') {
    return `把 ¥${fmtMoney(planMin.value)} ~ ¥${fmtMoney(planMax.value)} 的 52 笔金额打乱重排，每周抽到多少存多少（种子相同结果固定）。`
  }
  return `每周固定存 ¥${fmtMoney(firstAmount.value)}，52 周共 ¥${fmtMoney(planTotal.value)}。`
})

// 表格展示行：52 个周行 + 13 个月度小计行交错排列
const displayRows = computed(() => {
  const rows = []
  const cum = cumulativeList.value
  for (const group of monthGroupOf(plan.value)) {
    for (const p of group.weeks) {
      rows.push({
        type: 'week',
        week: p.week,
        amount: p.amount,
        cumulative: cum[p.week - 1],
        done: doneWeeks.value.has(p.week)
      })
    }
    const done = sumDoneOf(group.weeks, doneWeeks.value)
    rows.push({
      type: 'month',
      month: group.month,
      fromWeek: group.fromWeek,
      toWeek: group.toWeek,
      subtotal: group.subtotal,
      weekCount: group.weeks.length,
      doneCount: done.count,
      saved: done.saved
    })
  }
  return rows
})

// ---------- 事件处理（均为回调触发，SSR 安全） ----------
// 口径说明：打卡按「周号 → 当周应存金额」对应。切换模式或修改金额参数后，同一周号
// 对应的金额完全不同，沿用旧打卡会算出错误的已存金额，因此统一清空打卡进度，
// 视为重新开始一份新计划（提示条会告知用户）。
function clearProgress() {
  doneWeeks.value.clear()
}

function applyMode(id) {
  if (mode.value === id) return
  const target = MODES.find((m) => m.id === id)
  mode.value = id
  clearProgress()
  persist()
  changeNotice.value = `已切换为「${target ? target.name : id}」模式：每周对应的金额变了，打卡进度已清零，重新开始一份新计划。`
}

function onPlanParamChange() {
  clearProgress()
  persist()
  changeNotice.value = '金额参数已更新：每周对应的金额变了，打卡进度已清零。'
}

function rerollSeed() {
  seed.value = Math.floor(Math.random() * 899999999) + 100000000
  onPlanParamChange()
}

function toggleDone(week) {
  if (doneWeeks.value.has(week)) {
    doneWeeks.value.delete(week)
  } else {
    doneWeeks.value.add(week)
    changeNotice.value = ''
  }
  persist()
}

function resetProgress() {
  if (!window.confirm('确定清空全部 52 周打卡记录吗？已存金额统计会一并归零。')) return
  clearProgress()
  changeNotice.value = ''
  persist()
}

function printPlan() {
  window.print()
}

// 打卡进度持久化：只写当前浏览器 localStorage，失败（隐私模式等）静默降级为内存记录
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: mode.value,
      base: base.value,
      step: step.value,
      seed: seed.value,
      done: Array.from(doneWeeks.value)
    }))
  } catch (e) {
    // 存储不可用时忽略：打卡仅保留在当前页面内存中
  }
}

onMounted(() => {
  addRecentTool('savings-challenge-tracker')

  // 恢复上次打卡进度（读 localStorage 只发生在 onMounted，SSR 安全）
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object') return
    if (MODES.some((m) => m.id === saved.mode)) mode.value = saved.mode
    const b = Number(saved.base)
    if (Number.isFinite(b) && b > 0) base.value = b
    const st = Number(saved.step)
    if (Number.isFinite(st) && st >= 0) step.value = st
    const sd = Number(saved.seed)
    if (Number.isInteger(sd) && sd > 0) seed.value = sd
    if (Array.isArray(saved.done)) {
      doneWeeks.value = new Set(saved.done.filter((w) => Number.isInteger(w) && w >= 1 && w <= TOTAL_WEEKS))
    }
  } catch (e) {
    // 解析失败则使用默认设置，不影响页面其余功能
  }
})
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
  .print-area {
    box-shadow: none;
    border-radius: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .table-scroll {
    overflow: visible !important;
  }
  .print-area table {
    font-size: 11px;
  }
  .print-area th,
  .print-area td {
    padding-top: 2px !important;
    padding-bottom: 2px !important;
  }
}
@page {
  size: A4 portrait;
  margin: 10mm;
}
</style>
