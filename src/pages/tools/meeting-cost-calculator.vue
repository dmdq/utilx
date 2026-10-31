<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Users class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">会议成本计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">输入参会人数、时薪与时长，算清一次会到底花多少钱，并按频次累计月度与年度开销</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线会议成本计算器：按「参会人数 × 平均时薪 × 会议时长」即时估算单次会议的真实人力成本，支持按月薪换算时薪（21.75 月计薪天数口径）、
        每周 / 每工作日 / 每月频次的月度与年度累计、人均成本与咖啡等值换算，并给出「少开 15 分钟」「少叫 20% 的人」各能省多少钱的缩时对比。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Users class="w-5 h-5 mr-2 text-primary" /> 会议参数
        </h2>

        <!-- 薪资口径 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">薪资口径</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="salaryMode = 'hourly'"
              :class="optionClass(salaryMode === 'hourly')"
              class="px-3 py-2 rounded-lg text-sm border transition-colors"
            >
              按平均时薪
            </button>
            <button
              type="button"
              @click="salaryMode = 'monthly'"
              :class="optionClass(salaryMode === 'monthly')"
              class="px-3 py-2 rounded-lg text-sm border transition-colors"
            >
              按平均月薪
            </button>
          </div>
        </div>

        <!-- 时薪 / 月薪输入 -->
        <div v-if="salaryMode === 'hourly'">
          <label for="mc-hourly" class="text-sm font-medium text-foreground mb-1.5 block">平均时薪（元 / 小时）</label>
          <input
            id="mc-hourly"
            v-model.number="hourlyRate"
            type="number"
            min="0"
            step="1"
            :class="inputCls"
            placeholder="默认 100"
          >
          <p class="text-xs text-muted-foreground mt-1">直接输入参会人的平均时薪，默认 100 元 / 小时</p>
        </div>
        <div v-else>
          <label for="mc-monthly" class="text-sm font-medium text-foreground mb-1.5 block">平均月薪（元 / 月）</label>
          <input
            id="mc-monthly"
            v-model.number="monthlySalary"
            type="number"
            min="0"
            step="100"
            :class="inputCls"
            placeholder="如 17400"
          >
          <p class="text-xs text-muted-foreground mt-1 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>时薪 = 月薪 ÷ 21.75 ÷ 8，其中 21.75 为国内月计薪天数口径</span>
          </p>
        </div>

        <!-- 当前口径 -->
        <div class="bg-muted/50 rounded-lg p-3 text-center">
          <p class="text-xs text-muted-foreground mb-1">当前口径</p>
          <p class="text-sm font-bold text-foreground">时薪 ¥{{ hourlyUsed }} · {{ safeAttendees }} 人 · {{ safeDuration }} 分钟</p>
        </div>

        <!-- 参会人数 -->
        <div>
          <label for="mc-attendees" class="text-sm font-medium text-foreground mb-1.5 block">参会人数（1-500）</label>
          <input
            id="mc-attendees"
            v-model.number="attendees"
            type="number"
            min="1"
            max="500"
            step="1"
            :class="inputCls"
          >
        </div>

        <!-- 会议时长 -->
        <div>
          <label for="mc-duration" class="text-sm font-medium text-foreground mb-1.5 block">会议时长（分钟，5-480）</label>
          <input
            id="mc-duration"
            v-model.number="duration"
            type="number"
            min="5"
            max="480"
            step="5"
            :class="inputCls"
          >
        </div>

        <!-- 会议频次 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">会议频次</p>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" @click="freq = 'once'" :class="optionClass(freq === 'once')" class="px-3 py-2 rounded-lg text-sm border transition-colors">单次</button>
            <button type="button" @click="freq = 'weekly'" :class="optionClass(freq === 'weekly')" class="px-3 py-2 rounded-lg text-sm border transition-colors">每周 N 次</button>
            <button type="button" @click="freq = 'workday'" :class="optionClass(freq === 'workday')" class="px-3 py-2 rounded-lg text-sm border transition-colors">每个工作日</button>
            <button type="button" @click="freq = 'monthly'" :class="optionClass(freq === 'monthly')" class="px-3 py-2 rounded-lg text-sm border transition-colors">每月 N 次</button>
          </div>
          <div v-if="freq === 'weekly'" class="mt-2">
            <label for="mc-weekly-n" class="text-xs text-muted-foreground mb-1 block">每周次数 N（1-5）</label>
            <input id="mc-weekly-n" v-model.number="weeklyTimes" type="number" min="1" max="5" step="1" :class="inputCls">
          </div>
          <div v-else-if="freq === 'monthly'" class="mt-2">
            <label for="mc-monthly-n" class="text-xs text-muted-foreground mb-1 block">每月次数 N（1-20）</label>
            <input id="mc-monthly-n" v-model.number="monthlyTimes" type="number" min="1" max="20" step="1" :class="inputCls">
          </div>
        </div>

        <!-- 校验提示 -->
        <p v-if="issues.length" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-foreground flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          <span>{{ issues.join('；') }}</span>
        </p>

        <!-- 操作 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            @click="loadExample"
            class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            载入示例
          </button>
          <button
            type="button"
            @click="resetAll"
            class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
          </button>
        </div>
      </div>

      <!-- 右侧：结果面板 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 大数字卡：单次成本 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center">
            <Timer class="w-5 h-5 mr-2 text-primary" /> 单次会议成本
          </h2>
          <div class="bg-primary/10 rounded-lg p-6 text-center mt-3">
            <p class="text-xs text-muted-foreground mb-2">{{ safeAttendees }} 人 × 时薪 ¥{{ hourlyUsed }} × {{ safeDuration }} 分钟</p>
            <p class="text-5xl sm:text-6xl font-bold text-primary">¥ {{ fmtMoney(singleCost) }}</p>
            <p class="text-sm text-muted-foreground mt-3">人均成本 ¥ {{ fmtMoney(avgCostPerPerson) }} / 人</p>
            <p v-if="coffeeCups >= 0.5" class="text-xs text-muted-foreground mt-1">≈ {{ coffeeCups }} 杯咖啡（按 15 元 / 杯估算）</p>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-3">
            口径：单次成本 = 参会人数 × 平均时薪 × 时长（分钟）÷ 60，人均成本 = 单次成本 ÷ 参会人数。时薪按全员平均估算，如需更精确可按职级加权。
          </p>
        </div>

        <!-- 周期卡：频次非单次时显示 -->
        <div v-if="showPeriod" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center">
            <RefreshCw class="w-5 h-5 mr-2 text-primary" /> 周期成本（按频次累计）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">月度成本</p>
              <p class="text-2xl font-bold text-foreground">¥ {{ fmtMoney(monthlyCost) }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ freqDesc }}</p>
            </div>
            <div class="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">年度成本</p>
              <p class="text-3xl font-bold text-primary">¥ {{ fmtMoney(yearlyCost) }}</p>
              <p class="text-sm font-medium text-primary/90 mt-1">这一年开这种会花掉 {{ toWanText(yearlyCost) }} 万元</p>
            </div>
          </div>
        </div>

        <!-- 缩时对比卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 缩时对比：这样开更便宜
          </h2>
          <div class="space-y-3 mt-3">
            <div v-if="shorterRow" class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/40 border border-border rounded-lg p-3">
              <div>
                <p class="text-sm font-medium text-foreground">{{ shorterRow.title }}</p>
                <p class="text-xs text-muted-foreground mt-0.5">压缩没有产出的寒暄与跑题，信息密度更高</p>
              </div>
              <p class="text-sm font-medium text-primary sm:text-right whitespace-nowrap">
                每次可省 ¥{{ fmtMoney(shorterRow.save) }}<span class="text-muted-foreground">、一年可省 ¥{{ fmtMoney(shorterRow.yearly) }}</span>
              </p>
            </div>
            <div v-if="fewerPeopleRow" class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/40 border border-border rounded-lg p-3">
              <div>
                <p class="text-sm font-medium text-foreground">{{ fewerPeopleRow.title }}</p>
                <p class="text-xs text-muted-foreground mt-0.5">只留必须做决定或提供关键信息的人，知会类内容用文档同步</p>
              </div>
              <p class="text-sm font-medium text-primary sm:text-right whitespace-nowrap">
                每次可省 ¥{{ fmtMoney(fewerPeopleRow.save) }}<span class="text-muted-foreground">、一年可省 ¥{{ fmtMoney(fewerPeopleRow.yearly) }}</span>
              </p>
            </div>
            <p v-if="!shorterRow && !fewerPeopleRow" class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>当前会议时长不超过 15 分钟、人数不足 5 人，本来就很精简，压缩空间有限。</span>
            </p>
          </div>

          <!-- 提示条 -->
          <div class="mt-4 flex items-start gap-2 bg-muted/60 rounded-lg p-3">
            <Info class="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p class="text-xs text-muted-foreground leading-relaxed">
              会议成本不是反对开会，而是让召集人意识到：参会人的时间×时薪×时长是真实成本。给会议配议程、限人数、定时长，是最便宜的提效手段。
            </p>
          </div>
        </div>

        <!-- 对比彩蛋：常见会议成本速查 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 常见会议成本速查
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div v-for="item in benchmarkCases" :key="item.name" class="bg-muted/40 border border-border rounded-lg p-3 text-center">
              <p class="text-xs text-muted-foreground">{{ item.name }}</p>
              <p class="text-xl font-bold text-foreground mt-1">¥ {{ item.cost }}</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">{{ item.detail }}</p>
            </div>
          </div>
          <p class="text-[10px] text-muted-foreground mt-3">
            按上述公式口径估算：成本 = 人数 × 时薪 × 时长 ÷ 60，时薪统一按 100 元 / 小时。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>会议成本计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          会议成本计算器是一款在线人力成本估算工具。它把一次会议折算成钱：输入参会人数、平均时薪（或平均月薪自动换算时薪）与会议时长，
          按「人数 × 时薪 × 时长」即时算出单次会议成本、人均成本，并按每周 / 每工作日 / 每月等频次累计出月度与年度开销；
          还提供「时长减 15 分钟」「人数减 20%」两个缩时对比，直接告诉你这样改一年能省多少钱。
          所有计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">会议成本怎么算？——人数×时薪×时长的乘数效应</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          会议成本 = 参会人数 × 平均时薪 × 会议时长（分钟）÷ 60。它是三个乘数的连乘，因此有明显的乘数效应：
          10 人、时薪 100 元、开 60 分钟，一次就是 10×100×1 = 1000 元；人数翻倍或时长翻倍，成本同步翻倍。
          很多「顺手拉个会」默认了人数与时长，而这两个变量恰恰最不受约束——把 60 分钟压到 45 分钟，10 人会一次就省 250 元。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么开会贵？——所有人的时间在叠加</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          会议成本是所有参会人时间的叠加，而不是「占用了一个人的一小时」：20 人的 2 小时会，实际消耗的是 40 小时工作时间。
          更隐蔽的是机会成本——这 40 小时本可以产出各自的开发、设计或客户工作，开会期间这些原产出整体暂停，
          因此真实成本比账面时薪更高。这也是为什么跨部门大会往往是最贵的一种会。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么开短会？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>议程前置：没有议程的会不开，目标、材料、决策点提前发出，会上只做讨论与决定。</li>
          <li>参会人最小化：只叫必须做决定或提供关键信息的人，知会类信息用文档同步。</li>
          <li>异步替代：能用共享文档、录屏或群消息讲清楚的，不占用所有人的同一时段。</li>
          <li>站会站立、限时：站立保持专注、15 分钟硬截止，每个议题设时间盒，超时转线下。</li>
          <li>会后留痕：结论、负责人、截止时间当场确认，避免「再开一次对齐会」。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">21.75 是什么？——月计薪天数口径</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          21.75 是国内的月计薪天数口径：(365 天 − 104 个双休日) ÷ 12 = 21.75 天。按每天 8 小时工作制，
          时薪 = 月薪 ÷ 21.75 ÷ 8。例如月薪 17400 元，时薪 ≈ 17400 ÷ 174 = 100 元。
          它是计算日工资、加班费的常用法定基数，用它换算时薪比「月薪 ÷ 30」更接近真实的工作投入。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">会议成本怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">成本 = 参会人数 × 平均时薪 × 会议时长（分钟）÷ 60。例如 10 人、时薪 100 元、开 60 分钟，一次会议成本 = 10×100×60÷60 = 1000 元，人均 100 元。人数与时长的乘数效应明显，缩时或减员都能线性省钱。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么开会这么贵？</h3>
            <p class="text-sm text-muted-foreground mt-1">因为成本是所有参会人时间的叠加：20 人的 2 小时会消耗 40 小时工作时间，且这些时间本可以用于各自的原产出，机会成本同样真实。会议越长、人越多，叠加效应越明显。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">时薪换算里的 21.75 是什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">21.75 是国内月计薪天数口径：(365 − 104 个双休日) ÷ 12 = 21.75 天。时薪 = 月薪 ÷ 21.75 ÷ 8（每天 8 小时），例如月薪 17400 元对应时薪约 100 元。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">怎么把会议成本降下来？</h3>
            <p class="text-sm text-muted-foreground mt-1">给会议配议程、限人数、定时长：议程前置让会上只做决定，参会人最小化砍掉无关听众，能用异步文档替代就不占用同一时段，站会站立并限时。把 60 分钟压到 45 分钟、人数减 20%，一年累计下来省的是真金白银。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'meeting-cost-calculator'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Users, Timer, CheckCircle, TriangleAlert, RefreshCw,
  ChevronUp, ChevronDown, Info
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '会议成本计算器 - 在线算一次会议到底花多少钱',
  description: '免费在线会议成本计算器，按人数×时薪×时长即时算出单次会议真实成本，支持月薪换算时薪（21.75 月计薪天数口径）、每周/每工作日/每月频次的月度与年度成本、人均成本与咖啡等值、缩时减人省钱对比，纯浏览器本地运行不上传',
  keywords: '会议成本计算器,开会成本,会议费用计算,时薪计算,月薪换算时薪,21.75月计薪天数,会议效率,开短会,提效工具',
  author: '有条工具',
  ogTitle: '会议成本计算器 - 在线算一次会议到底花多少钱 | 有条工具',
  ogDescription: '按人数×时薪×时长估算会议真实成本，支持月薪换算、频次累计与缩时省钱对比。',
  ogUrl: 'https://www.util.cn/tools/meeting-cost-calculator',
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
          name: '会议成本计算器',
          url: 'https://www.util.cn/tools/meeting-cost-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['按人数×时薪×时长计算单次会议成本', '月薪换算时薪（21.75 月计薪天数口径）', '每周/每工作日/每月频次的月度与年度成本', '人均成本与咖啡等值换算', '缩时 15 分钟与减员 20% 省钱对比', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '会议成本计算器', item: 'https://www.util.cn/tools/meeting-cost-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '会议成本怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '成本 = 参会人数 × 平均时薪 × 会议时长（分钟）÷ 60。例如 10 人、时薪 100 元、开 60 分钟，一次会议成本 = 10×100×60÷60 = 1000 元，人均 100 元。人数与时长的乘数效应明显，缩时或减员都能线性省钱。' }
            },
            {
              '@type': 'Question',
              name: '为什么开会这么贵？',
              acceptedAnswer: { '@type': 'Answer', text: '因为成本是所有参会人时间的叠加：20 人的 2 小时会消耗 40 小时工作时间，且这些时间本可以用于各自的原产出，机会成本同样真实。会议越长、人越多，叠加效应越明显。' }
            },
            {
              '@type': 'Question',
              name: '时薪换算里的 21.75 是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '21.75 是国内月计薪天数口径：(365 − 104 个双休日) ÷ 12 = 21.75 天。时薪 = 月薪 ÷ 21.75 ÷ 8（每天 8 小时），例如月薪 17400 元对应时薪约 100 元。' }
            },
            {
              '@type': 'Question',
              name: '怎么把会议成本降下来？',
              acceptedAnswer: { '@type': 'Answer', text: '给会议配议程、限人数、定时长：议程前置让会上只做决定，参会人最小化砍掉无关听众，能用异步文档替代就不占用同一时段，站会站立并限时。把 60 分钟压到 45 分钟、人数减 20%，一年累计下来省的是真金白银。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const PAY_DAYS_PER_MONTH = 21.75 // 国内月计薪天数口径：(365 − 104) ÷ 12
const HOURS_PER_DAY = 8          // 每天 8 小时工作制
const WEEKS_PER_YEAR = 52        // 一年约 52 周
const MONTHS_PER_YEAR = 12
const WORKDAYS_PER_YEAR = 261    // 21.75 × 12，每个工作日开会的一年次数
const COFFEE_PRICE = 15          // ≈15 元/杯

// 保留 2 位小数
function round2(v) {
  return Math.round(Number(v) * 100) / 100
}

// 宽松转数字：空串 / null / 非数字返回 NaN（Number('') === 0，需先排除）
function toNum(v) {
  if (v === '' || v === null || v === undefined) return NaN
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

// 整数截断到 [min, max]，无效输入回退 fallback
function clampInt(v, min, max, fallback) {
  const n = toNum(v)
  if (Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

// 数值截断到 [min, max]，无效输入回退 fallback
function clampNum(v, min, max, fallback) {
  const n = toNum(v)
  if (Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

// 月薪换算时薪：月薪 ÷ 21.75 ÷ 8，保留 2 位
function hourlyFromMonthly(m) {
  const monthly = toNum(m)
  if (Number.isNaN(monthly) || monthly <= 0) return 0
  return round2(monthly / (PAY_DAYS_PER_MONTH * HOURS_PER_DAY))
}

// 单次会议成本 = 人数 × 时薪 × 时长(分钟) ÷ 60，保留 2 位
function costOf(n, hourly, minutes) {
  const people = toNum(n)
  const rate = toNum(hourly)
  const mins = toNum(minutes)
  if (Number.isNaN(people) || Number.isNaN(rate) || Number.isNaN(mins)) return 0
  if (people <= 0 || rate < 0 || mins <= 0) return 0
  return round2(people * rate * mins / 60)
}

// 月度成本：单次→null（不折算）；每周 N 次→cost×N×52/12；每工作日→cost×21.75；每月 N 次→cost×N
function monthlyOf(cost, freq, n) {
  const c = toNum(cost)
  if (Number.isNaN(c)) return null
  if (freq === 'weekly') return round2(c * n * WEEKS_PER_YEAR / MONTHS_PER_YEAR)
  if (freq === 'workday') return round2(c * PAY_DAYS_PER_MONTH)
  if (freq === 'monthly') return round2(c * n)
  return null // once：单次会议不做周期折算
}

// 年度成本：单次→null；每周 N 次→cost×N×52；每工作日→cost×21.75×12；每月 N 次→cost×N×12
function yearlyOf(cost, freq, n) {
  const c = toNum(cost)
  if (Number.isNaN(c)) return null
  if (freq === 'weekly') return round2(c * n * WEEKS_PER_YEAR)
  if (freq === 'workday') return round2(c * PAY_DAYS_PER_MONTH * MONTHS_PER_YEAR)
  if (freq === 'monthly') return round2(c * n * MONTHS_PER_YEAR)
  return null
}

// 该频次一年开多少次（用于「一年可省」折算；单次按 1 次）
function timesPerYear(freq, n) {
  if (freq === 'weekly') return n * WEEKS_PER_YEAR
  if (freq === 'workday') return WORKDAYS_PER_YEAR
  if (freq === 'monthly') return n * MONTHS_PER_YEAR
  return 1
}

// 金额千分位格式化，固定 2 位小数（不依赖 locale，SSR/客户端一致）
function fmtMoney(v) {
  const n = toNum(v)
  if (Number.isNaN(n)) return '—'
  const fixed = round2(n).toFixed(2)
  const [int, dec] = fixed.split('.')
  const sign = int.startsWith('-') ? '-' : ''
  const digits = sign ? int.slice(1) : int
  const withSep = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${sign}${withSep}.${dec}`
}

// 年度金额转「万元」文本，去尾零（52000 → 5.2）
function toWanText(v) {
  const n = toNum(v)
  if (Number.isNaN(n)) return '—'
  return String(Number((n / 10000).toFixed(2)))
}

// 咖啡等值：成本 ÷ 15（≈15 元/杯），保留 2 位；不足 0.5 杯由展示层隐藏
function coffeeEquiv(cost) {
  const c = toNum(cost)
  if (Number.isNaN(c) || c <= 0) return 0
  return round2(c / COFFEE_PRICE)
}

// 人数减 20% 后的新人数（四舍五入，至少 1 人；不足 5 人不适用返回 null）
function fewerPeopleCount(n) {
  const people = toNum(n)
  if (Number.isNaN(people) || people < 5) return null
  return Math.max(1, Math.round(people * 0.8))
}

// ---------- 页面状态 ----------
const DEFAULTS = {
  salaryMode: 'hourly',
  hourlyRate: 100,
  monthlySalary: 17400,
  attendees: 8,
  duration: 60,
  freq: 'weekly',
  weeklyTimes: 1,
  monthlyTimes: 2
}

const salaryMode = ref(DEFAULTS.salaryMode)   // 'hourly' | 'monthly'
const hourlyRate = ref(DEFAULTS.hourlyRate)
const monthlySalary = ref(DEFAULTS.monthlySalary)
const attendees = ref(DEFAULTS.attendees)
const duration = ref(DEFAULTS.duration)       // 分钟
const freq = ref(DEFAULTS.freq)               // 'once' | 'weekly' | 'workday' | 'monthly'
const weeklyTimes = ref(DEFAULTS.weeklyTimes)
const monthlyTimes = ref(DEFAULTS.monthlyTimes)
const seoContentVisible = ref(true)

const inputCls = 'w-full px-4 py-2.5 bg-background border border-border rounded-lg font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40'

// 常见会议成本速查（硬编码，与 costOf 公式口径一致：时薪 100 元/小时）
const benchmarkCases = [
  { name: '30 分钟站会', cost: '250', detail: '5 人 × 时薪 100' },
  { name: '1 小时评审会', cost: '1,000', detail: '10 人 × 时薪 100' },
  { name: '跨部门 2 小时会', cost: '4,000', detail: '20 人 × 时薪 100' }
]

function optionClass(active) {
  return active
    ? 'bg-primary text-primary-foreground border-primary'
    : 'bg-muted/50 hover:bg-muted text-foreground border-border'
}

// ---------- 派生计算 ----------
const safeAttendees = computed(() => clampInt(attendees.value, 1, 500, DEFAULTS.attendees))
const safeDuration = computed(() => clampInt(duration.value, 5, 480, DEFAULTS.duration))
const safeWeeklyTimes = computed(() => clampInt(weeklyTimes.value, 1, 5, DEFAULTS.weeklyTimes))
const safeMonthlyTimes = computed(() => clampInt(monthlyTimes.value, 1, 20, DEFAULTS.monthlyTimes))

const hourlyUsed = computed(() => {
  if (salaryMode.value === 'monthly') {
    return hourlyFromMonthly(clampNum(monthlySalary.value, 0, 10000000, DEFAULTS.monthlySalary))
  }
  return clampNum(hourlyRate.value, 0, 1000000, DEFAULTS.hourlyRate)
})

const freqN = computed(() => {
  if (freq.value === 'weekly') return safeWeeklyTimes.value
  if (freq.value === 'monthly') return safeMonthlyTimes.value
  return 1
})

const singleCost = computed(() => costOf(safeAttendees.value, hourlyUsed.value, safeDuration.value))
const avgCostPerPerson = computed(() => round2(singleCost.value / safeAttendees.value))
const coffeeCups = computed(() => coffeeEquiv(singleCost.value))
const monthlyCost = computed(() => monthlyOf(singleCost.value, freq.value, freqN.value))
const yearlyCost = computed(() => yearlyOf(singleCost.value, freq.value, freqN.value))
const showPeriod = computed(() => singleCost.value > 0 && monthlyCost.value !== null && yearlyCost.value !== null)

const freqDesc = computed(() => {
  if (freq.value === 'weekly') return `每周 ${safeWeeklyTimes.value} 次 × 52 周 ÷ 12 个月`
  if (freq.value === 'workday') return '每个工作日开一次（月计薪 21.75 天）'
  if (freq.value === 'monthly') return `每月 ${safeMonthlyTimes.value} 次 × 12 个月`
  return '单次会议'
})

// 缩时对比：时长减 15 分钟（时长 > 15 分钟时适用）
const shorterRow = computed(() => {
  const mins = safeDuration.value
  if (!(mins > 15)) return null
  const save = round2(singleCost.value - costOf(safeAttendees.value, hourlyUsed.value, mins - 15))
  return {
    title: `时长减 15 分钟（${mins} → ${mins - 15} 分钟）`,
    save,
    yearly: round2(save * timesPerYear(freq.value, freqN.value))
  }
})

// 缩时对比：人数减 20%（≥5 人时适用）
const fewerPeopleRow = computed(() => {
  const n = safeAttendees.value
  const newN = fewerPeopleCount(n)
  if (newN === null || newN >= n) return null
  const save = round2(singleCost.value - costOf(newN, hourlyUsed.value, safeDuration.value))
  return {
    title: `人数减 20%（${n} → ${newN} 人）`,
    save,
    yearly: round2(save * timesPerYear(freq.value, freqN.value))
  }
})

// 输入校验提示（数学仍按边界值继续，保证始终有结果）
const issues = computed(() => {
  const list = []
  if (Number.isNaN(toNum(attendees.value)) || safeAttendees.value !== Math.round(toNum(attendees.value))) {
    list.push('参会人数需在 1-500 之间，已按边界值计算')
  }
  if (Number.isNaN(toNum(duration.value)) || safeDuration.value !== Math.round(toNum(duration.value))) {
    list.push('会议时长需在 5-480 分钟之间，已按边界值计算')
  }
  if (salaryMode.value === 'monthly') {
    const m = toNum(monthlySalary.value)
    if (Number.isNaN(m) || m <= 0) list.push('平均月薪需大于 0，当前按 0 计算为免费')
  } else {
    const r = toNum(hourlyRate.value)
    if (Number.isNaN(r) || r <= 0) list.push('平均时薪需大于 0，当前按 0 计算为免费')
  }
  if (freq.value === 'weekly') {
    const w = toNum(weeklyTimes.value)
    if (Number.isNaN(w) || safeWeeklyTimes.value !== Math.round(w)) list.push('每周次数需在 1-5 之间，已按边界值计算')
  }
  if (freq.value === 'monthly') {
    const mo = toNum(monthlyTimes.value)
    if (Number.isNaN(mo) || safeMonthlyTimes.value !== Math.round(mo)) list.push('每月次数需在 1-20 之间，已按边界值计算')
  }
  return list
})

// ---------- 操作 ----------
function loadExample() {
  salaryMode.value = 'monthly'
  monthlySalary.value = 17400
  hourlyRate.value = 100
  attendees.value = 12
  duration.value = 90
  freq.value = 'weekly'
  weeklyTimes.value = 2
  monthlyTimes.value = 2
}

function resetAll() {
  salaryMode.value = DEFAULTS.salaryMode
  monthlySalary.value = DEFAULTS.monthlySalary
  hourlyRate.value = DEFAULTS.hourlyRate
  attendees.value = DEFAULTS.attendees
  duration.value = DEFAULTS.duration
  freq.value = DEFAULTS.freq
  weeklyTimes.value = DEFAULTS.weeklyTimes
  monthlyTimes.value = DEFAULTS.monthlyTimes
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 本地持久化（仅客户端，try/catch 兜底） ----------
const STORAGE_KEY = 'meeting-cost-calculator-state-v1'

function loadSavedState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return data && typeof data === 'object' ? data : null
  } catch (e) {
    return null
  }
}

function persistState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      salaryMode: salaryMode.value,
      hourlyRate: hourlyRate.value,
      monthlySalary: monthlySalary.value,
      attendees: attendees.value,
      duration: duration.value,
      freq: freq.value,
      weeklyTimes: weeklyTimes.value,
      monthlyTimes: monthlyTimes.value
    }))
  } catch (e) {
    // 隐私模式 / 存储被禁用时静默跳过
  }
}

function applySavedState(data) {
  if (!data) return
  if (data.salaryMode === 'hourly' || data.salaryMode === 'monthly') salaryMode.value = data.salaryMode
  if (['once', 'weekly', 'workday', 'monthly'].includes(data.freq)) freq.value = data.freq
  const assign = (refObj, v, fallback) => {
    const n = toNum(v)
    refObj.value = Number.isNaN(n) ? fallback : n
  }
  assign(hourlyRate, data.hourlyRate, DEFAULTS.hourlyRate)
  assign(monthlySalary, data.monthlySalary, DEFAULTS.monthlySalary)
  assign(attendees, data.attendees, DEFAULTS.attendees)
  assign(duration, data.duration, DEFAULTS.duration)
  assign(weeklyTimes, data.weeklyTimes, DEFAULTS.weeklyTimes)
  assign(monthlyTimes, data.monthlyTimes, DEFAULTS.monthlyTimes)
}

watch(
  [salaryMode, hourlyRate, monthlySalary, attendees, duration, freq, weeklyTimes, monthlyTimes],
  () => persistState()
)

onMounted(() => {
  applySavedState(loadSavedState())
  addRecentTool('meeting-cost-calculator')
})
</script>
