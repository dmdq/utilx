<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Coffee class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">摸鱼计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">月薪秒级实时滚动：已赚金额、每秒单价、今日进度条与下班倒计时，21.75 法定计薪口径</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线摸鱼计算器（打工人实时工资计算器）：输入月薪（或年薪）与上下班时间，按法定折算口径
        月计薪天数 21.75 天（(365 − 104) ÷ 12 = 21.75，现行工资折算口径沿用自原劳社部发〔2008〕3 号）实时滚动显示
        <b>今日已赚金额（含摸鱼中的每一秒）</b>、每小时 / 每分钟 / 每秒单价、当日进度条与下班倒计时；
        支持午休扣除（带薪时间不含午休）与「当月工作日」动态口径对比，附「今日带薪如厕时长」彩蛋卡
        （每日 3 次 × 6 分钟按小时薪折算，纯属彩蛋非严肃数据）。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Coffee class="w-5 h-5 mr-2 text-primary" /> 薪资与工作时间
        </h2>

        <!-- 月薪 / 年薪 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">薪资口径</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              @click="payMode = 'monthly'"
              class="py-2.5 rounded-lg text-sm font-medium border transition"
              :class="payMode === 'monthly' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >按月薪</button>
            <button
              type="button"
              @click="payMode = 'annual'"
              class="py-2.5 rounded-lg text-sm font-medium border transition"
              :class="payMode === 'annual' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >按年薪</button>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <input
              id="ssc-pay"
              v-model.number="payAmount"
              type="number"
              min="0"
              step="500"
              :placeholder="payMode === 'monthly' ? '如 10000' : '如 120000'"
              class="flex-1 min-w-0 px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">{{ payMode === 'monthly' ? '元 / 月' : '元 / 年' }}</span>
          </div>
          <p v-if="payMode === 'annual'" class="text-[11px] text-muted-foreground mt-1">折算月薪 = 年薪 ÷ 12。</p>
        </div>

        <!-- 上下班时间 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="ssc-start" class="block text-sm font-medium text-foreground mb-2">上班时间</label>
            <input
              id="ssc-start"
              v-model="startTime"
              type="time"
              class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label for="ssc-end" class="block text-sm font-medium text-foreground mb-2">下班时间</label>
            <input
              id="ssc-end"
              v-model="endTime"
              type="time"
              class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <!-- 午休扣除 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">午休扣除</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              @click="lunchDeduct = true"
              class="py-2 rounded-lg text-sm font-medium border transition"
              :class="lunchDeduct ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >扣除午休</button>
            <button
              type="button"
              @click="lunchDeduct = false"
              class="py-2 rounded-lg text-sm font-medium border transition"
              :class="!lunchDeduct ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >不扣除</button>
          </div>
          <div v-if="lunchDeduct" class="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label for="ssc-lunch-start" class="text-xs text-muted-foreground mb-1 block">午休开始</label>
              <input
                id="ssc-lunch-start"
                v-model="lunchStart"
                type="time"
                class="w-full px-2.5 py-1.5 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label for="ssc-lunch-min" class="text-xs text-muted-foreground mb-1 block">午休时长（分钟）</label>
              <input
                id="ssc-lunch-min"
                v-model.number="lunchMinutes"
                type="number"
                min="0"
                step="15"
                class="w-full px-2.5 py-1.5 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <!-- 计薪天数口径 -->
        <div>
          <label for="ssc-days" class="block text-sm font-medium text-foreground mb-2">计薪天数口径</label>
          <select
            id="ssc-days"
            v-model="daysMode"
            class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="fixed">21.75 天（法定口径：月计薪天数）</option>
            <option value="dynamic">当月实际工作日（趣味对比口径）</option>
          </select>
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>21.75 =（365 − 104 个双休日）÷ 12，来源《关于职工全年月平均工作时间和工资折算问题的通知》（原劳社部发〔2008〕3 号确立、人社部 2025 年 1 月 1 日起施行的同名通知沿用，数值不变）；不扣除 13 天法定节假日（节假日带薪）。「当月工作日」仅剔除周末、未扣法定节假日，仅供对比，工资折算法定口径是 21.75。</span>
          </p>
        </div>

        <!-- 输入校验 -->
        <p v-if="inputError" class="text-xs leading-relaxed text-red-500 p-2 rounded bg-red-500/10 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ inputError }}</span>
        </p>

        <!-- 操作 -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            @click="loadExample"
            class="px-3 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            载入示例
          </button>
          <button
            @click="resetAll"
            class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1 -mt-0.5" /> 重置
          </button>
        </div>
      </div>

      <!-- 右侧：实时结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Timer class="w-5 h-5 mr-2 text-primary" /> 今日实时收入
          </h2>
          <span v-if="nowText" class="text-xs font-mono text-muted-foreground">当前 {{ nowText }}</span>
        </div>

        <template v-if="canCalc && now !== null">
          <!-- 主金额卡 -->
          <div class="bg-primary/10 rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">
              今日已赚（{{ statusText }}，含摸鱼中的每一秒）
            </p>
            <p class="text-4xl sm:text-5xl font-bold text-primary leading-tight font-mono">
              ¥{{ fmtMoney(earnedToday) }}
            </p>
            <p class="text-xs text-muted-foreground mt-2">
              计薪时间 {{ paidHours.toFixed(2) }} 小时 / 天 · 单价 {{ daysMode === 'fixed' ? '21.75 天' : dynamicDays + ' 个工作日' }} 口径
            </p>
          </div>

          <!-- 单价三卡 -->
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">每小时</p>
              <p class="text-xl font-bold text-foreground font-mono">¥{{ fmtMoney(perHour) }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">每分钟</p>
              <p class="text-xl font-bold text-foreground font-mono">¥{{ fmtMoney(perMinute) }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">每秒</p>
              <p class="text-xl font-bold text-foreground font-mono">¥{{ perSecond.toFixed(3) }}</p>
            </div>
          </div>

          <!-- 进度条 -->
          <div>
            <div class="flex items-center justify-between text-xs mb-1.5">
              <span class="text-muted-foreground">今日进度（计薪时间）</span>
              <span class="font-mono text-foreground">{{ progressText }}</span>
            </div>
            <div class="h-3 bg-muted rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="progress >= 100 ? 'bg-green-500' : 'bg-primary'"
                :style="{ width: Math.min(100, progress) + '%' }"
              ></div>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              {{ countdownText }}
            </p>
          </div>

          <!-- 彩蛋卡：带薪如厕 -->
          <div class="border border-amber-500/20 bg-amber-500/10 rounded-lg p-4 flex items-start gap-2">
            <Coffee class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-semibold text-foreground">彩蛋：今日带薪如厕时长（每日 3 次 × 6 分钟）</p>
              <p class="text-xs text-muted-foreground leading-relaxed mt-1">
                按每分钟 ¥{{ fmtMoney(perMinute) }} 折算，每天「带薪如厕」约
                <b class="text-primary">¥{{ fmtMoney(toiletEarn) }}</b>，一个月（21.75 天）约
                <b class="text-primary">¥{{ fmtMoney(toiletEarn * 21.75) }}</b>——这是彩蛋非严肃数据，认真你就输了。
              </p>
            </div>
          </div>
        </template>

        <!-- SSR 骨架占位 / 输入不完整 -->
        <div v-else-if="canCalc" class="py-10 space-y-4 animate-pulse" aria-hidden="true">
          <div class="h-24 bg-muted rounded-lg"></div>
          <div class="grid grid-cols-3 gap-3">
            <div class="h-16 bg-muted rounded-xl"></div>
            <div class="h-16 bg-muted rounded-xl"></div>
            <div class="h-16 bg-muted rounded-xl"></div>
          </div>
          <div class="h-3 bg-muted rounded-full"></div>
          <p class="text-xs text-center text-muted-foreground">正在同步本地时间…</p>
        </div>
        <div v-else class="text-center text-muted-foreground py-16">
          <TriangleAlert class="w-10 h-10 mx-auto mb-3 text-yellow-500" />
          <p class="text-sm">请先完善左侧输入：{{ inputError }}</p>
          <p class="text-xs text-muted-foreground/70 mt-1">也可以点击「载入示例」：月薪 10000 元、9:00–18:00、午休 1 小时扣除。</p>
        </div>
      </div>
    </div>

    <!-- 免责声明（页面固定） -->
    <p class="text-xs text-muted-foreground leading-relaxed mb-8 flex items-start gap-1.5">
      <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <span>
        实时收入为按「月工资 ÷（月计薪天数 × 日计薪小时）」线性折算的娱乐估算，未考虑绩效、加班费、扣款与税五险，
        也不代表法定加班费或欠薪金额；「带薪如厕」为彩蛋内容。工资相关争议请以劳动合同与当地人社部门口径为准。
      </span>
    </p>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg mb-12 group">
      <summary class="flex items-center justify-between cursor-pointer select-none px-6 py-4">
        <span class="text-lg font-semibold text-foreground"><span class="text-primary mr-2">#</span>21.75 怎么来的？带薪时间口径科普</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div class="px-6 pb-6 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">计算公式</h3>
          <div class="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed space-y-2">
            <p><strong>时薪</strong> = 月薪 ÷（月计薪天数 × 日计薪小时）。默认口径：月计薪天数 21.75 天、日计薪 8 小时。</p>
            <p><strong>每分钟</strong> = 时薪 ÷ 60；<strong>每秒</strong> = 时薪 ÷ 3600；<strong>今日已赚</strong> = 每秒单价 × 已过计薪秒数（扣除午休时段）。</p>
            <p><strong>月计薪天数</strong> =（365 天 − 104 天双休日）÷ 12 月 = <b>21.75 天</b>（《关于职工全年月平均工作时间和工资折算问题的通知》：原劳社部发〔2008〕3 号确立，2025 年 1 月 1 日起人社部同名新通知沿用，数值不变）。</p>
            <p><strong>月工作日</strong> =（365 − 104 − 13）÷ 12 = 20.67 天（2025 年起法定节假日增至 13 天）——这是排班 / 工时口径，不用于工资折算：法定节假日（带薪）不扣工资，所以计薪天数只减双休日。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">21.75 怎么来的？为什么不是 30 或 22？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            2008 年原劳动和社会保障部发布《关于职工全年月平均工作时间和工资折算问题的通知》（劳社部发〔2008〕3 号）：
            全年 365 天减 104 天双休日 = 261 个<b class="text-foreground">计薪日</b>（法定节假日照常带薪，所以不减），
            261 ÷ 12 个月 = 21.75 天。2025 年 1 月 1 日起，人社部发布同名通知废止并替代 3 号文：法定节假日增至 13 天，
            月工作日相应调整为（365 − 104 − 13）÷ 12 = 20.67 天，但<b class="text-foreground">月计薪天数仍是 21.75 天</b>
            （节假日带薪、折算不减节假日）。21.75 不是「你每个月实际上班 21.75 天」，而是把全年计薪日平均到每个月，
            用来统一<b class="text-foreground">日工资 = 月工资 ÷ 21.75</b> 的折算口径——事假扣款、病假工资、加班费基数都靠它。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">带薪时间口径科普：哪些时间算钱？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            法定意义上「计薪时间」包括：正常工作时间、法定节假日（带薪）、年休假 / 婚丧假 / 产检假等法定带薪假，
            以及工作日午休以外的工间休息；午休（用餐休息时间）是否计薪取决于单位制度——多数公司按「午休不带薪」处理，
            这就是本页默认提供午休扣除开关的原因。病假按病假工资口径计薪（打折但有下限）、事假通常不带薪、
            工伤停工留薪期按原工资福利待遇足额计薪。摸鱼时间在劳动关系上属于「未提供劳动」，
            但因为工资按月固定发放，从现金流看确实是「带薪摸鱼」——这正是本工具的娱乐点。
          </p>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">月薪 10000，每秒赚多少钱？</h3>
            <p class="text-sm text-muted-foreground mt-1">时薪 = 10000 ÷（21.75 × 8）≈ 57.47 元；每秒 ≈ 0.016 元。上班 3 小时已赚约 172.41 元，全天 8 小时约 459.77 元。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">21.75 和 20.67 有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">21.75 是月计薪天数（工资折算口径，只减 104 天双休日）；20.67 是月工作日（排班工时口径，再减 13 天法定节假日，2025 年起）。算钱用 21.75，排班用 20.67。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">午休时间算工资吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">取决于单位制度：多数公司按「午休 1 小时不带薪」设计工作时间，此时日计薪为 8 小时；若合同约定午休带薪，则 9:00–18:00 全程 9 小时计薪。本页的午休扣除开关对应两种情况。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">摸鱼算「未提供劳动」会被扣钱吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">月薪制下工资按月发放、不按秒打卡，正常的工间放松不会被扣钱；但旷工、擅离岗位等仍可能按制度处理。本工具是解压玩具，别真拿它当考勤依据。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">「带薪如厕」是真的吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">这是彩蛋：按每日 3 次 × 6 分钟 × 每分钟单价折算的娱乐数字，不代表任何法定待遇——但摸鱼快乐是真的。</p>
          </div>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'slacking-salary-counter'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Coffee, Timer, Info, TriangleAlert, ChevronDown, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '摸鱼计算器 - 实时已赚工资/每秒单价在线计算（21.75 口径）',
  description: '免费在线摸鱼计算器：输入月薪或年薪与上下班时间，秒级实时滚动今日已赚金额、每小时/每分钟/每秒单价、当日进度条与下班倒计时，21.75 法定月计薪天数折算口径，午休扣除与带薪如厕彩蛋，纯浏览器本地计算不上传',
  keywords: '摸鱼计算器,实时工资计算,每秒赚多少钱,时薪换算,打工人解压,21.75计薪天数,带薪如厕',
  author: '有条工具',
  ogTitle: '摸鱼计算器 - 实时已赚工资/每秒单价在线计算 | 有条工具',
  ogDescription: '秒级滚动今日已赚金额、每秒单价与下班倒计时，21.75 法定计薪口径。',
  ogUrl: 'https://www.util.cn/tools/slacking-salary-counter',
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
          name: '摸鱼计算器',
          url: 'https://www.util.cn/tools/slacking-salary-counter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['今日已赚金额秒级实时滚动', '每小时 / 每分钟 / 每秒单价', '当日进度条与下班倒计时', '21.75 法定月计薪天数口径', '月薪 / 年薪切换与午休扣除', '当月工作日动态口径对比', '带薪如厕彩蛋卡', '纯本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '实用工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '摸鱼计算器', item: 'https://www.util.cn/tools/slacking-salary-counter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '月薪 10000，每秒赚多少钱？',
              acceptedAnswer: { '@type': 'Answer', text: '时薪 = 10000 ÷（21.75 × 8）≈ 57.47 元；每秒 ≈ 0.016 元。上班 3 小时已赚约 172.41 元，全天 8 小时约 459.77 元。' }
            },
            {
              '@type': 'Question',
              name: '21.75 和 20.67 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '21.75 是月计薪天数（工资折算口径，只减 104 天双休日）；20.67 是月工作日（排班工时口径，再减 13 天法定节假日，2025 年起）。算钱用 21.75，排班用 20.67。' }
            },
            {
              '@type': 'Question',
              name: '午休时间算工资吗？',
              acceptedAnswer: { '@type': 'Answer', text: '取决于单位制度：多数公司按「午休 1 小时不带薪」设计工时，日计薪 8 小时；若合同约定午休带薪则全程计薪。本页提供午休扣除开关。' }
            },
            {
              '@type': 'Question',
              name: '摸鱼算「未提供劳动」会被扣钱吗？',
              acceptedAnswer: { '@type': 'Answer', text: '月薪制下工资按月发放、不按秒打卡，正常的工间放松不会被扣钱；旷工、擅离岗位等仍可能按制度处理。' }
            },
            {
              '@type': 'Question',
              name: '「带薪如厕」是真的吗？',
              acceptedAnswer: { '@type': 'Answer', text: '这是彩蛋：按每日 3 次 × 6 分钟 × 每分钟单价折算的娱乐数字，不代表任何法定待遇。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测，输入输出均为「当日秒数」口径） ----------
// 口径依据：《关于职工全年月平均工作时间和工资折算问题的通知》
// （原劳社部发〔2008〕3 号确立 21.75；2025-01-01 起人社部同名新通知废止并替代 3 号文，月计薪天数仍为 21.75）
// - 月计薪天数 =（365 − 104）÷ 12 = 21.75 天（不扣法定节假日，节假日带薪）
// - 月工作日 =（365 − 104 − 13）÷ 12 ≈ 20.67 天（排班 / 工时口径，不用于工资折算）
// - 日工资 = 月工资 ÷ 21.75；小时工资 = 月工资 ÷（21.75 × 8）
// SSR 安全：所有 Date / interval 只在 onMounted 之后使用，SSR 与首帧渲染骨架占位。

const FIXED_PAY_DAYS = 21.75
const DAILY_PAID_HOURS = 8

// "HH:MM" → 当日秒数；非法返回 null
function timeToSecOf(s) {
  if (typeof s !== 'string') return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim())
  if (!m) return null
  const h = +m[1]
  const min = +m[2]
  if (h > 23 || min > 59) return null
  return h * 3600 + min * 60
}

// 月薪换算：年薪 ÷ 12；非法或 ≤0 返回 0
function monthlyPayOf(payMode, payAmount) {
  const n = Number(payAmount) || 0
  if (n <= 0) return 0
  return payMode === 'annual' ? n / 12 : n
}

// 计薪天数：21.75 固定，或当月实际工作日（仅剔除周末；动态口径需给年月与 Date 构造器以便单测）
function payDaysOf(daysMode, y, m, DateCtor) {
  if (daysMode !== 'dynamic') return FIXED_PAY_DAYS
  const Y = y
  const M = m
  let days = 0
  const last = new DateCtor(Y, M, 0).getDate()
  for (let d = 1; d <= last; d++) {
    const wd = new DateCtor(Y, M - 1, d).getDay()
    if (wd !== 0 && wd !== 6) days += 1
  }
  return days > 0 ? days : FIXED_PAY_DAYS
}

// 每小时单价 = 月薪 ÷（计薪天数 × 日计薪小时）
function hourlyRateOf(monthlyPay, payDays, paidHours) {
  if (!(monthlyPay > 0) || !(payDays > 0) || !(paidHours > 0)) return 0
  return monthlyPay / (payDays * paidHours)
}

// 当日带薪总小时 =（下班 − 上班）− 午休（若扣除且午休落在班次内）
function paidHoursOf(startSec, endSec, lunchDeduct, lunchStartSec, lunchMin) {
  if (startSec === null || endSec === null || endSec <= startSec) return 0
  let paid = endSec - startSec
  if (lunchDeduct) {
    const ls = lunchStartSec
    const le = lunchStartSec + lunchMin * 60
    const overlap = Math.max(0, Math.min(endSec, le) - Math.max(startSec, ls))
    paid -= overlap
  }
  return paid / 3600
}

// 截至时刻 nowSec 的已过计薪秒数（午休不计）
function paidElapsedSecOf(startSec, endSec, nowSec, lunchDeduct, lunchStartSec, lunchMin) {
  if (startSec === null || endSec === null || nowSec === null || endSec <= startSec) return 0
  const t = Math.min(Math.max(nowSec, startSec), endSec)
  let paid = t - startSec
  if (lunchDeduct) {
    const ls = lunchStartSec
    const le = lunchStartSec + lunchMin * 60
    const overlap = Math.max(0, Math.min(t, le) - Math.max(startSec, ls))
    paid -= overlap
  }
  return Math.max(0, paid)
}

// 已赚金额（0.01 元定点）
function earnedOf(perSec, paidElapsedSec) {
  return Math.round(perSec * paidElapsedSec * 100) / 100
}

// 倒计时文本
function countdownTextOf(endSec, nowSec) {
  if (endSec === null || nowSec === null) return ''
  if (nowSec >= endSec) return '今天已下班，摸到的鱼都是明天的粮。'
  const left = endSec - nowSec
  const h = Math.floor(left / 3600)
  const m = Math.floor((left % 3600) / 60)
  const s = left % 60
  return `距下班还有 ${h} 小时 ${m} 分 ${s} 秒`
}

// 金额展示：千分位 + 固定 2 位小数
function fmtMoney(n) {
  const v = Math.round((Number(n) || 0) * 100) / 100
  const sign = v < 0 ? '-' : ''
  const parts = Math.abs(v).toFixed(2).split('.')
  return sign + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1]
}

// ---------- 页面状态 ----------
const payMode = ref('monthly')
const payAmount = ref(10000)
const startTime = ref('09:00')
const endTime = ref('18:00')
const lunchDeduct = ref(true)
const lunchStart = ref('12:00')
const lunchMinutes = ref(60)
const daysMode = ref('fixed')
const now = ref(null) // 当日秒数；SSR / 首帧为 null，onMounted 后每秒更新
let timer = null

// 输入校验
const inputError = computed(() => {
  const s = timeToSecOf(startTime.value)
  const e = timeToSecOf(endTime.value)
  if (s === null) return '请选择合法的上班时间'
  if (e === null) return '请选择合法的下班时间'
  if (e <= s) return '下班时间需晚于上班时间'
  if (!(Number(payAmount.value) > 0)) return '请填写大于 0 的薪资'
  return ''
})

const canCalc = computed(() => inputError.value === '')

// ---------- 时间与单价派生 ----------
const monthlyPay = computed(() => monthlyPayOf(payMode.value, payAmount.value))

const startSec = computed(() => timeToSecOf(startTime.value))
const endSec = computed(() => timeToSecOf(endTime.value))
const lunchStartSec = computed(() => timeToSecOf(lunchStart.value) || 0)

const paidHours = computed(() =>
  paidHoursOf(startSec.value, endSec.value, lunchDeduct.value, lunchStartSec.value, Number(lunchMinutes.value) || 0)
)

const currentMonth = computed(() => (now.value === null ? null : new Date()))
const dynamicDays = computed(() => {
  const d = currentMonth.value
  if (!d) return 0
  return Math.round(payDaysOf('dynamic', d.getFullYear(), d.getMonth() + 1, Date))
})

const payDays = computed(() => (daysMode.value === 'dynamic' && dynamicDays.value > 0 ? dynamicDays.value : FIXED_PAY_DAYS))

// 单价（非法输入收敛为 0）
const perHour = computed(() => hourlyRateOf(monthlyPay.value, payDays.value, paidHours.value))
const perMinute = computed(() => Math.round((perHour.value / 60) * 10000) / 10000)
const perSecond = computed(() => perHour.value / 3600)

// 实时已赚
const paidElapsed = computed(() =>
  paidElapsedSecOf(startSec.value, endSec.value, now.value, lunchDeduct.value, lunchStartSec.value, Number(lunchMinutes.value) || 0)
)
const earnedToday = computed(() => earnedOf(perSecond.value, paidElapsed.value))

const totalPaidSec = computed(() => Math.round(paidHours.value * 3600))
const progress = computed(() => (totalPaidSec.value > 0 ? Math.round((paidElapsed.value / totalPaidSec.value) * 1000) / 10 : 0))
const progressText = computed(() => `${progress.value}%（${Math.floor(paidElapsed.value / 3600)}h ${Math.floor((paidElapsed.value % 3600) / 60)}m / 共 ${paidHours.value.toFixed(2)}h）`)

const nowText = computed(() => {
  if (now.value === null) return ''
  const h = Math.floor(now.value / 3600) % 24
  const m = Math.floor((now.value % 3600) / 60)
  const s = now.value % 60
  return [h, m, s].map((x) => String(x).padStart(2, '0')).join(':')
})

const statusText = computed(() => {
  if (now.value === null) return ''
  if (now.value < startSec.value) return '还没上班'
  if (now.value >= endSec.value) return '已下班'
  return '上班中'
})

const countdownText = computed(() => countdownTextOf(endSec.value, now.value))

// 彩蛋：每日 3 次 × 6 分钟
const toiletEarn = computed(() => Math.round(perMinute.value * 18 * 100) / 100)

// ---------- 生命周期（浏览器 API 只在 onMounted） ----------
function tick() {
  const d = new Date()
  now.value = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()
}

onMounted(() => {
  addRecentTool('slacking-salary-counter')
  tick()
  timer = setInterval(tick, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

function loadExample() {
  payMode.value = 'monthly'
  payAmount.value = 10000
  startTime.value = '09:00'
  endTime.value = '18:00'
  lunchDeduct.value = true
  lunchStart.value = '12:00'
  lunchMinutes.value = 60
  daysMode.value = 'fixed'
}

function resetAll() {
  payMode.value = 'monthly'
  payAmount.value = ''
  startTime.value = '09:00'
  endTime.value = '18:00'
  lunchDeduct.value = true
  lunchStart.value = '12:00'
  lunchMinutes.value = 60
  daysMode.value = 'fixed'
}
</script>
