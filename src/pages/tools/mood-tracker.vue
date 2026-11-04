<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Smile class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">情绪日记</h1>
          <p class="text-sm text-muted-foreground mt-1">每日 5 档情绪打卡 + 标签备注，心情月历上色、月度曲线、连续天数与趋势提醒</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线情绪日记工具：每天用 5 档表情（很糟 😢 / 不太好 😕 / 一般 😐 / 不错 🙂 / 很好 😄）给当天心情打分，顺手勾选影响因素标签、写一句话备注；
        页面按月历形式给每一天上色、用曲线画出整月起伏，并统计月平均、记录天数、连续天数与近两周趋势对比，历史记录随时点开修改，支持导出 CSV 备份。
        全部数据只保存在这台设备的浏览器里，不上传任何服务器。
      </p>
    </div>

    <!-- 说明条：隐私立场 + 非医疗声明 + 热线提示 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-6 flex items-start gap-2.5">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-sm text-muted-foreground leading-relaxed">
        记录只保存在这台设备的浏览器里——情绪数据是最私密的数据，不该上传到任何服务器。本工具不是医疗工具，持续情绪低落请寻求专业帮助（附心理援助热线提示：全国 24 小时心理援助热线
        <span class="font-semibold text-foreground">12356</span>）。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：当日 / 所选日期 记录卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Smile class="w-5 h-5 mr-2 text-primary" /> 记录情绪
          </h2>
          <span v-if="editingLabel" class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
            {{ editingLabel }}
          </span>
        </div>

        <!-- 5 档情绪：emoji 大按钮单选 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">{{ editingQuestion }}</p>
          <div class="grid grid-cols-5 gap-1.5">
            <button
              v-for="m in MOODS"
              :key="m.score"
              type="button"
              @click="selectedScore = m.score"
              class="py-2.5 px-1 rounded-lg border text-center transition"
              :class="selectedScore === m.score
                ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
                : 'border-border bg-muted/40 hover:bg-muted/70'"
              :title="`${m.label}（${m.score > 0 ? '+' + m.score : m.score}）`"
            >
              <span class="block text-2xl leading-none">{{ m.emoji }}</span>
              <span class="block text-[10px] mt-1.5 text-muted-foreground">{{ m.label }}</span>
            </button>
          </div>
          <p class="text-[10px] text-muted-foreground mt-1.5">评分只是主观感受的粗粒度标记：-2 很糟 ～ +2 很好，没有「正确答案」。</p>
        </div>

        <!-- 标签 chips 多选 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">和什么有关？（可多选）</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="tag in TAGS"
              :key="tag"
              type="button"
              @click="toggleTag(tag)"
              class="px-2.5 py-1 rounded-full border text-xs transition"
              :class="selectedTags.includes(tag)
                ? 'bg-primary/10 border-primary text-primary font-medium'
                : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'"
            >
              {{ tag }}
            </button>
          </div>
        </div>

        <!-- 一句话备注 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-foreground">一句话备注</p>
            <span class="text-[10px] text-muted-foreground" :class="noteText.length >= NOTE_MAX ? 'text-orange-500' : ''">
              {{ noteText.length }} / {{ NOTE_MAX }}
            </span>
          </div>
          <textarea
            v-model="noteText"
            :maxlength="NOTE_MAX"
            rows="3"
            placeholder="今天想记下什么？比如：加班到很晚，但晚饭很好吃（可不填）"
            class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          ></textarea>
        </div>

        <button
          type="button"
          @click="saveDay"
          :disabled="!canSave"
          class="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary"
        >
          {{ editingExisting ? '覆盖更新这一天的记录' : '保存这条记录' }}
        </button>

        <!-- 已保存确认条（内联状态反馈，不弹窗） -->
        <p
          v-if="saveState.text"
          class="text-xs leading-relaxed p-2.5 rounded border flex items-start gap-1.5"
          :class="saveState.type === 'ok'
            ? 'bg-green-500/10 border-green-500/20 text-green-600'
            : 'bg-red-500/10 border-red-500/20 text-red-600'"
        >
          <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ saveState.text }}</span>
        </p>

        <p class="text-xs text-muted-foreground leading-relaxed">
          同一天重复保存会覆盖旧记录；也可以在右侧心情月历里点击任意过去的日期，回看或修改当天的记录。
        </p>
      </div>

      <!-- 右：统计 + 月历 + 曲线（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 统计卡 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-card border border-border rounded-lg p-4">
            <p class="text-xs text-muted-foreground mb-1">本月平均</p>
            <p class="text-2xl font-bold" :class="monthStats.avg === null ? 'text-muted-foreground' : 'text-foreground'">
              {{ monthStats.avg === null ? '—' : (monthStats.avg > 0 ? '+' : '') + monthStats.avg }}
            </p>
            <p class="text-[10px] text-muted-foreground mt-1">五档均值（-2 ～ +2）</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4">
            <p class="text-xs text-muted-foreground mb-1">本月记录</p>
            <p class="text-2xl font-bold text-foreground">
              {{ monthStats.count }}<span class="text-sm font-normal text-muted-foreground ml-1">天</span>
            </p>
            <p class="text-[10px] text-muted-foreground mt-1">共 {{ curveData.days }} 天的月份</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4">
            <p class="text-xs text-muted-foreground mb-1">连续记录</p>
            <p class="text-2xl font-bold text-foreground">
              {{ streakDays }}<span class="text-sm font-normal text-muted-foreground ml-1">天</span>
            </p>
            <p class="text-[10px] text-muted-foreground mt-1">今天还没记不算断档</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4">
            <p class="text-xs text-muted-foreground mb-1">情绪趋势</p>
            <p class="text-base font-bold text-foreground leading-snug">{{ trend.label }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">{{ trendHint }}</p>
          </div>
        </div>

        <!-- 心情月历 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <h2 class="text-lg font-semibold flex items-center">
              <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 心情月历
            </h2>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="prevMonth"
                class="p-2 rounded-lg border border-border hover:bg-muted transition"
                aria-label="上一个月"
              >
                <ChevronLeft class="w-4 h-4 text-foreground" />
              </button>
              <span class="text-sm font-medium text-foreground min-w-[92px] text-center">{{ viewYear }} 年 {{ viewMonth }} 月</span>
              <button
                type="button"
                @click="nextMonth"
                class="p-2 rounded-lg border border-border hover:bg-muted transition"
                aria-label="下一个月"
              >
                <ChevronRight class="w-4 h-4 text-foreground" />
              </button>
              <button
                v-if="!isViewingCurrentMonth"
                type="button"
                @click="backToCurrentMonth"
                class="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs text-muted-foreground transition"
              >
                <RefreshCw class="w-3.5 h-3.5 inline mr-1 -mt-0.5" />回到本月
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between flex-wrap gap-2 text-xs">
            <p class="text-muted-foreground">本月分布：{{ distText }}</p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="exportCsv"
                :disabled="!records.length"
                class="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs text-foreground transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                导出 CSV
              </button>
              <button
                type="button"
                @click="handleClearClick"
                :disabled="!monthStats.count"
                class="px-3 py-1.5 rounded-lg border text-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
                :class="clearArmed
                  ? 'bg-red-500/10 border-red-500/40 text-red-600 font-medium'
                  : 'border-border hover:bg-muted text-muted-foreground'"
              >
                <Trash2 class="w-3.5 h-3.5 inline mr-1 -mt-0.5" />{{ clearArmed ? '再点一次确认清空' : '清空当月' }}
              </button>
            </div>
          </div>

          <!-- 月历网格 -->
          <div v-if="viewYear" class="space-y-1">
            <div class="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
              <span v-for="w in WEEK_LABELS" :key="w">{{ w }}</span>
            </div>
            <div class="grid grid-cols-7 gap-1">
              <template v-for="cell in monthCells" :key="cell.key">
                <button
                  v-if="cell.inMonth && !cell.isFuture"
                  type="button"
                  @click="selectDay(cell.key)"
                  :class="cellClassOf(cell)"
                  :title="cellTitleOf(cell)"
                >
                  <span class="text-lg leading-none">{{ cell.hasRecord ? emojiOf(cell.score) : cell.day }}</span>
                  <span v-if="cell.hasRecord" class="text-[9px] opacity-70 mt-0.5">{{ cell.day }}</span>
                  <span v-if="cell.key === todayKey" class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary"></span>
                </button>
                <div v-else-if="cell.inMonth" class="relative aspect-square rounded-lg border border-border/60 bg-muted/20 flex flex-col items-center justify-center text-muted-foreground/40 select-none">
                  <span class="text-sm leading-none">{{ cell.day }}</span>
                </div>
                <div v-else class="aspect-square rounded-lg flex items-center justify-center text-muted-foreground/30 text-xs select-none">
                  <span>{{ cell.day }}</span>
                </div>
              </template>
            </div>
          </div>
          <div v-else class="h-56 rounded-lg bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
            正在初始化日历…
          </div>

          <p v-if="bestWorst.best" class="text-xs text-muted-foreground leading-relaxed">
            本月最好的一天：{{ bestWorst.best.date.slice(5).replace('-', '/') }} {{ emojiOf(bestWorst.best.score) }}；
            最低的一天：{{ bestWorst.worst.date.slice(5).replace('-', '/') }} {{ emojiOf(bestWorst.worst.score) }}。
            点击任意过去的日期即可回看或修改当天的记录（今日用圆点标记）。
          </p>
          <p v-else class="text-xs text-muted-foreground leading-relaxed">
            本月还没有记录：在左侧选好情绪点保存即可；点击过去的日期也可以补记或回看（未来日期不可写）。
          </p>
        </div>

        <!-- 月度曲线 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Smile class="w-5 h-5 mr-2 text-primary" /> 月度曲线
          </h2>
          <div v-if="viewYear" class="relative">
            <svg viewBox="0 0 720 180" preserveAspectRatio="none" class="w-full h-44 block">
              <line
                v-for="g in curveData.guides"
                :key="g.score"
                x1="30"
                x2="690"
                :y1="g.y"
                :y2="g.y"
                :stroke="g.score === 0 ? 'rgba(148,163,184,0.5)' : 'rgba(148,163,184,0.22)'"
                stroke-width="1"
              />
              <polyline
                v-for="(seg, i) in curveData.segments"
                :key="`seg-${i}`"
                :points="segPoints(seg)"
                fill="none"
                class="text-primary"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
              <circle
                v-for="p in allCurvePoints"
                :key="`pt-${p.day}`"
                :cx="p.x"
                :cy="p.y"
                r="3.5"
                :fill="scoreColor(p.score)"
              />
            </svg>
            <div
              v-if="!curveData.segments.length"
              class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
            >
              本月还没有记录，在左侧记下第一条吧
            </div>
          </div>
          <div v-else class="h-44 rounded-lg bg-muted/40"></div>
          <div class="flex justify-between text-[10px] text-muted-foreground">
            <span>1 日</span><span>8</span><span>15</span><span>22</span><span>{{ curveData.days }} 日</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            横轴为日期，纵轴为五档分值（最上 +2 很好，最下 -2 很糟，中线为 0 一般）；圆点代表当天的记录，曲线断开表示当天没有记录。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>情绪日记是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          情绪日记是一款纯本地的情绪记录与追踪工具。每天选一档最贴近当下感受的表情（很糟 -2 / 不太好 -1 / 一般 0 / 不错 +1 / 很好 +2），
          可以顺手勾上影响情绪的因素标签（工作、睡眠、天气……）并写一句话备注，同一天重复保存会覆盖更新（upsert）。
          页面把每个月的记录画成一张按情绪上色的月历（红色系代表低落、绿色系代表愉悦）、一条月度曲线，并统计月平均分、记录天数、连续记录天数与近两周趋势对比；
          所有数据只保存在你这台设备的浏览器 localStorage 里，本工具不是医疗工具。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">记情绪日记有什么用？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          情绪管理的第一步是「觉察」。给感受一个 -2 ～ +2 的粗粒度评分，不需要精确，只需要诚实——这个动作本身就能把模糊的「心情不好」变成可观察、可描述的信号。
          坚持几周后，月历的颜色分布和趋势曲线会呈现一些凭印象看不到的事实：比如情绪低总落在加班日、睡不够的日子，或某类事件之后；
          标签统计还能帮你定位这些模式。许多心理咨询师也会建议来访者做类似记录，作为会谈的真实素材。
          需要说明的是：这是自我觉察工具，不是诊断或治疗工具，评分高低不代表任何临床结论。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">情绪和天气、季节有关系吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          有关系。研究上称为季节性情绪波动：秋冬季日照变短会影响褪黑素与血清素的分泌节律，部分人会出现明显的季节性情绪低落；
          持续阴雨、闷热高温等天气也与烦躁、疲惫的汇报率升高相关。这正是标签里保留「天气」的原因——记录一两个月后，
          你可以用自己的数据验证「我一到下雨天就情绪低」究竟是错觉还是有规律。如果发现秋冬低落明显且已影响生活，
          可以尝试白天多接触自然光、保持规律运动与社交；是否需要光照疗法等专业干预，请交给专业人士评估。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">连续记录断了怎么办？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          断了就断了，不用补记，也不必有挫败感。本工具的连击天数是「激励口径」：今天还没记不会打断连击（当天随手记上就自动接回去），
          但中间漏掉一整天后，连击会从新一轮连续记录重新开始数。习惯研究的共识是：中断一两天对习惯养成的影响远比想象的小，
          真正容易让人放弃的是「中断之后的全盘自我否定」。回来点开页面，记下今天这一条，就是最好的重启——历史记录一直都在，月历随时可以回看。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">情绪数据会上传吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不会，一条都不会。页面没有账号系统、没有后端接口，所有记录只写入你这台设备浏览器的 localStorage，
          月历、曲线和统计全部在本页实时计算，全程不发出任何网络请求。也因此没有任何人——包括我们——能看到你的情绪数据。
          相应的代价是：清理浏览器数据、换设备或重装系统都会让记录消失且无法找回，所以重要的阶段性记录建议用「导出 CSV」定期备份
          （文件带 BOM 头，Excel 直接打开中文不乱码）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么时候需要专业帮助？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          如果持续两周以上几乎每天情绪低落、对以前喜欢的事提不起兴趣，或伴随明显的睡眠与食欲改变、注意力下降、自责无力，
          甚至出现伤害自己的念头，请把这当作和感冒发烧一样正常、但需要认真对待的信号，及时寻求专业帮助：
          可拨打全国 24 小时心理援助热线 12356（免费），紧急情况请直接拨打 120 或 110。
          求助不是软弱——就像在日记里诚实地记下「今天很糟」一样，它是在认真地照顾自己。
        </p>
      </div>
    </div>

    <RelatedTools :currentToolId="'mood-tracker'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Smile, CheckCircle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Info, RefreshCw, Trash2, CalendarDays
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '情绪日记 - 在线心情记录与情绪追踪日历工具',
  description: '免费在线情绪日记工具：每天用 5 档表情记录心情，搭配标签与一句话备注，自动生成心情月历、月度曲线、连续记录天数与近两周趋势对比，历史记录可随时修改并导出 CSV。数据只保存在本机浏览器不上传；本工具不是医疗工具，持续情绪低落可拨打全国 24 小时心理援助热线 12356。',
  keywords: '情绪日记,心情记录,情绪追踪,心情日历,情绪管理',
  author: '有条工具',
  ogTitle: '情绪日记 - 在线心情记录与情绪追踪工具 | 有条工具',
  ogDescription: '5 档情绪打卡 + 标签备注，心情月历与月度曲线，数据仅存本机不上传。',
  ogUrl: 'https://www.util.cn/tools/mood-tracker',
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
          name: '情绪日记',
          url: 'https://www.util.cn/tools/mood-tracker',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['每日 5 档情绪打卡与覆盖修改', '影响因素标签与一句话备注', '心情月历按情绪深浅上色', 'SVG 月度情绪曲线', '月平均 / 记录天数 / 连续天数 / 趋势对比', 'CSV 导出（Excel 兼容）', '数据仅存本机不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '健康工具', item: 'https://www.util.cn/health/' },
            { '@type': 'ListItem', position: 3, name: '情绪日记', item: 'https://www.util.cn/tools/mood-tracker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '记情绪日记有什么用？',
              acceptedAnswer: { '@type': 'Answer', text: '情绪管理的第一步是觉察：给感受一个 -2～+2 的粗粒度评分，把模糊的心情变成可观察的信号。坚持几周后，月历颜色分布、趋势曲线与标签统计能帮你看到情绪与加班、睡眠、天气等因素的关联，也可作为心理咨询的真实素材。它是自我觉察工具，不是诊断工具。' }
            },
            {
              '@type': 'Question',
              name: '情绪和天气、季节有关系吗？',
              acceptedAnswer: { '@type': 'Answer', text: '有关系。秋冬季日照变短会影响褪黑素与血清素分泌，部分人出现明显的季节性情绪低落；持续阴雨、高温也与烦躁疲惫相关。给日记加上天气标签记录一两个月，就能用自己的数据验证这些规律；若秋冬低落明显且影响生活，请咨询专业人士。' }
            },
            {
              '@type': 'Question',
              name: '连续记录断了怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '不用补记也不必自责。本工具的口径是：今天还没记不算断档，当天记上连击自动接回；漏掉一整天后连击从新的连续段重新数起。中断一两天对习惯养成影响很小，回来记下今天这一条就是最好的重启，历史记录不会丢。' }
            },
            {
              '@type': 'Question',
              name: '情绪数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。页面没有账号系统和后端接口，所有记录只写入本机浏览器 localStorage，统计与曲线全部在本页实时计算，不发任何网络请求。清理浏览器数据或换设备会导致记录丢失，建议用导出 CSV（带 BOM，Excel 打开不乱码）定期备份。' }
            },
            {
              '@type': 'Question',
              name: '什么时候需要专业帮助？',
              acceptedAnswer: { '@type': 'Answer', text: '若持续两周以上几乎每天情绪低落、对以前喜欢的事提不起兴趣，或伴随明显睡眠食欲改变、注意力下降，甚至出现伤害自己的念头，请及时寻求专业帮助：可拨打全国 24 小时心理援助热线 12356（免费），紧急情况拨打 120 或 110。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const NOTE_MAX = 200 // 一句话备注的字数上限

// 5 档情绪常量：score 为分值（-2 ～ +2），emoji 直接渲染文字、不引入图标库
const MOODS = [
  { score: -2, emoji: '😢', label: '很糟' },
  { score: -1, emoji: '😕', label: '不太好' },
  { score: 0, emoji: '😐', label: '一般' },
  { score: 1, emoji: '🙂', label: '不错' },
  { score: 2, emoji: '😄', label: '很好' }
]

// 影响因素标签（多选）
const TAGS = ['工作', '学习', '家人', '朋友', '恋爱', '健康', '睡眠', '运动', '天气', '消费', '饮食', '旅行']

// 月历表头（周日开头）
const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六']

// 分值 → 月历格底色（-2 红 → +2 绿渐变）与曲线圆点色
const SCORE_TONES = {
  '-2': { cell: 'bg-red-500/25 border-red-500/40', dot: '#ef4444' },
  '-1': { cell: 'bg-orange-500/20 border-orange-500/35', dot: '#f97316' },
  '0': { cell: 'bg-slate-400/15 border-slate-400/30', dot: '#94a3b8' },
  '1': { cell: 'bg-lime-500/20 border-lime-500/35', dot: '#84cc16' },
  '2': { cell: 'bg-green-500/30 border-green-500/45', dot: '#22c55e' }
}

const CURVE_WIDTH = 720
const CURVE_HEIGHT = 180
const CURVE_PAD = 30

function pad2(n) {
  return String(n).padStart(2, '0')
}

// Date → 'YYYY-MM-DD'（本地时区）
function keyOfDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

// 某月天数（month 1-based）
function daysInMonthOf(year, month) {
  return new Date(year, month, 0).getDate()
}

// ISO 日期字符串平移 delta 天（支持跨月 / 跨年），返回 'YYYY-MM-DD'
function shiftDayIso(iso, delta) {
  const y = Number(iso.slice(0, 4))
  const m = Number(iso.slice(5, 7))
  const d = Number(iso.slice(8, 10))
  return keyOfDate(new Date(y, m - 1, d + delta))
}

// 按 dateKey 唯一覆盖写入一条日记录：同日覆盖、其余原样保留，返回按日期升序的新数组（不可变，不改原数组）
function upsertDay(records, dayRecord) {
  const exists = records.some((r) => r.date === dayRecord.date)
  const next = exists
    ? records.map((r) => (r.date === dayRecord.date ? { ...r, ...dayRecord } : r))
    : records.concat({ ...dayRecord, tags: [...(dayRecord.tags || [])] })
  return next.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

// 某月统计：{ avg 均值(1 位小数，无记录为 null), count 记录天数, dist 五档计数 [很糟,不太好,一般,不错,很好] }
function monthAvgOf(records, yearMonth) {
  const dist = [0, 0, 0, 0, 0]
  let sum = 0
  let count = 0
  for (const r of records) {
    if (typeof r.date !== 'string' || !r.date.startsWith(yearMonth)) continue
    const i = r.score + 2
    if (i < 0 || i > 4) continue
    dist[i] += 1
    sum += r.score
    count += 1
  }
  if (!count) return { avg: null, count: 0, dist }
  return { avg: Math.round((sum / count) * 10) / 10, count, dist }
}

// 连续记录天数（激励口径）：从今天往回数，断档即停。
// 「今天还没记」不算断档——此时从昨天开始往回数，当天补记后连击自动接上；
// 若昨天也没有记录，则连击为 0。
function streakOf(records, todayIso) {
  const set = new Set(records.map((r) => r.date))
  let cursor = set.has(todayIso) ? todayIso : shiftDayIso(todayIso, -1)
  let streak = 0
  while (set.has(cursor)) {
    streak += 1
    cursor = shiftDayIso(cursor, -1)
  }
  return streak
}

// 近 7 天（含今天）均值 − 前 7 天均值：
// 差值 ≥ +0.3 「最近在变好」；≤ -0.3 「最近有点低——记得照顾自己」；其余「平稳」。
// 任一窗口没有样本时 diff 为 null（样本不足，不轻易下结论）。
function moodTrendOf(records, todayIso) {
  const byDate = new Map(records.map((r) => [r.date, r.score]))
  const avgOfWindow = (from, to) => {
    const vals = []
    for (let off = from; off <= to; off++) {
      const key = shiftDayIso(todayIso, off)
      if (byDate.has(key)) vals.push(byDate.get(key))
    }
    if (!vals.length) return null
    return vals.reduce((s, v) => s + v, 0) / vals.length
  }
  const near = avgOfWindow(-6, 0)
  const prev = avgOfWindow(-13, -7)
  if (near === null || prev === null) return { diff: null, label: '样本不足' }
  const diff = Math.round((near - prev) * 10) / 10
  if (diff >= 0.3) return { diff, label: '最近在变好' }
  if (diff <= -0.3) return { diff, label: '最近有点低——记得照顾自己' }
  return { diff, label: '平稳' }
}

// 某月内情绪最高 / 最低的一天（并列时取日期较早的一天），无记录返回 { best: null, worst: null }
function bestWorstDayOf(records, yearMonth) {
  const inMonth = records
    .filter((r) => typeof r.date === 'string' && r.date.startsWith(yearMonth))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  if (!inMonth.length) return { best: null, worst: null }
  let best = inMonth[0]
  let worst = inMonth[0]
  for (const r of inMonth) {
    if (r.score > best.score) best = r
    if (r.score < worst.score) worst = r
  }
  return {
    best: { date: best.date, score: best.score },
    worst: { date: worst.date, score: worst.score }
  }
}

// 月历网格：固定 42 格（6 行 × 7 列，周日开头），含前后月补位日期；cell = { key, day, dow, inMonth }
function monthGridOf(year, month) {
  const firstDow = new Date(year, month - 1, 1).getDay()
  const start = new Date(year, month - 1, 1 - firstDow)
  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    cells.push({
      key: keyOfDate(d),
      day: d.getDate(),
      dow: d.getDay(),
      inMonth: d.getMonth() === month - 1 && d.getFullYear() === year
    })
  }
  return cells
}

// localStorage 原始数据 → 合法记录数组：过滤脏数据、按 dateKey 去重、备注截断、按日期升序
function normalizeRecords(raw) {
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  const out = []
  for (const item of raw) {
    if (!item || typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) continue
    const score = Number(item.score)
    if (!Number.isInteger(score) || score < -2 || score > 2) continue
    if (seen.has(item.date)) continue
    seen.add(item.date)
    const tags = Array.isArray(item.tags)
      ? item.tags.filter((t) => typeof t === 'string').slice(0, TAGS.length)
      : []
    const note = typeof item.note === 'string' ? item.note.slice(0, NOTE_MAX) : ''
    out.push({ date: item.date, score, tags, note })
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

// 月度曲线几何：把当月有记录的日子映射到 viewBox 坐标；无记录的日子断开（分段 polyline）
// 返回 { days 当月天数, segments: [[{ day, score, x, y }...]], guides: [{ score, y }] }
function curveGeometryOf(records, year, month, width = CURVE_WIDTH, height = CURVE_HEIGHT, pad = CURVE_PAD) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return { days: 30, segments: [], guides: [] }
  }
  const days = daysInMonthOf(year, month)
  const ym = `${year}-${pad2(month)}`
  const byDay = new Map()
  for (const r of records) {
    if (typeof r.date === 'string' && r.date.startsWith(ym)) {
      byDay.set(Number(r.date.slice(8, 10)), r.score)
    }
  }
  const xOf = (day) => Math.round((pad + ((day - 1) / (days - 1)) * (width - pad * 2)) * 10) / 10
  const yOf = (score) => Math.round((pad + ((2 - score) / 4) * (height - pad * 2)) * 10) / 10
  const guides = [2, 1, 0, -1, -2].map((score) => ({ score, y: yOf(score) }))
  const segments = []
  let cur = []
  for (let d = 1; d <= days; d++) {
    if (byDay.has(d)) {
      cur.push({ day: d, score: byDay.get(d), x: xOf(d), y: yOf(byDay.get(d)) })
    } else if (cur.length) {
      segments.push(cur)
      cur = []
    }
  }
  if (cur.length) segments.push(cur)
  return { days, segments, guides }
}

// CSV 字段转义：包含逗号 / 引号 / 换行时加双引号包裹，内部引号翻倍
function csvEscapeOf(field) {
  const s = String(field)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// 全量记录 → CSV 文本：表头 日期,分值,标签,备注；带 BOM（Excel 中文不乱码）；按日期升序
function csvOf(records) {
  const lines = ['日期,分值,标签,备注']
  for (const r of normalizeRecords(records)) {
    const tags = r.tags.join('、')
    lines.push([r.date, String(r.score), csvEscapeOf(tags), csvEscapeOf(r.note)].join(','))
  }
  return `\uFEFF${lines.join('\r\n')}`
}

// 分值 → emoji（无匹配返回占位符）
function emojiOf(score) {
  const m = MOODS.find((x) => x.score === score)
  return m ? m.emoji : '·'
}

// 分值 → 文案标签
function scoreLabelOf(score) {
  const m = MOODS.find((x) => x.score === score)
  return m ? m.label : ''
}

// ---------- 页面状态（响应式） ----------
const STORAGE_KEY = 'mood-tracker'

const records = ref([]) // [{ date: 'YYYY-MM-DD', score: -2..2, tags: [], note: '' }]，按日期升序
const todayKey = ref('') // 仅供 onMounted 后写入，避免 SSR/CSR 不一致
const viewYear = ref(0)
const viewMonth = ref(0)
const selectedKey = ref('') // 左侧卡片正在编辑的日期
const selectedScore = ref(null) // null = 尚未选择
const selectedTags = ref([])
const noteText = ref('')
const saveState = ref({ type: '', text: '' }) // 内联保存反馈条
const seoContentVisible = ref(true)
const clearArmed = ref(false) // 清空当月的两段式确认
let saveTimer = null
let clearTimer = null

// ---------- 派生状态 ----------
const yearMonth = computed(() => (viewYear.value && viewMonth.value ? `${viewYear.value}-${pad2(viewMonth.value)}` : ''))

const recordsByDate = computed(() => {
  const map = new Map()
  for (const r of records.value) map.set(r.date, r)
  return map
})

const monthCells = computed(() => {
  if (!viewYear.value) return []
  return monthGridOf(viewYear.value, viewMonth.value).map((c) => {
    const rec = recordsByDate.value.get(c.key)
    return {
      ...c,
      isFuture: todayKey.value ? c.key > todayKey.value : false,
      hasRecord: !!rec,
      score: rec ? rec.score : null
    }
  })
})

const monthStats = computed(() =>
  yearMonth.value ? monthAvgOf(records.value, yearMonth.value) : { avg: null, count: 0, dist: [0, 0, 0, 0, 0] }
)

const distText = computed(() => monthStats.value.dist.map((n, i) => `${MOODS[i].emoji}${n}`).join(' '))

const streakDays = computed(() => (todayKey.value ? streakOf(records.value, todayKey.value) : 0))

const trend = computed(() => (todayKey.value ? moodTrendOf(records.value, todayKey.value) : { diff: null, label: '—' }))

const trendHint = computed(() => {
  if (trend.value.diff === null) return '近 7 天 vs 前 7 天，样本还不够'
  const sign = trend.value.diff > 0 ? '+' : ''
  return `近 7 天 vs 前 7 天：${sign}${trend.value.diff} 分`
})

const bestWorst = computed(() =>
  yearMonth.value ? bestWorstDayOf(records.value, yearMonth.value) : { best: null, worst: null }
)

const curveData = computed(() =>
  viewYear.value
    ? curveGeometryOf(records.value, viewYear.value, viewMonth.value)
    : { days: 30, segments: [], guides: [] }
)

const allCurvePoints = computed(() => curveData.value.segments.flat())

const editingExisting = computed(() => !!(selectedKey.value && recordsByDate.value.get(selectedKey.value)))

const editingLabel = computed(() => {
  if (!selectedKey.value) return ''
  if (selectedKey.value === todayKey.value) return '今天'
  return `编辑 ${selectedKey.value.slice(5).replace('-', '/')}`
})

const editingQuestion = computed(() =>
  selectedKey.value && selectedKey.value === todayKey.value ? '今天感觉怎么样？' : '这一天感觉怎么样？'
)

const canSave = computed(() => !!(selectedKey.value && selectedScore.value !== null && !isFutureKey(selectedKey.value)))

const isViewingCurrentMonth = computed(() =>
  !!todayKey.value && yearMonth.value === todayKey.value.slice(0, 7)
)

// ---------- 渲染辅助 ----------
function isFutureKey(key) {
  return !!todayKey.value && key > todayKey.value
}

function cellClassOf(cell) {
  const base = 'relative aspect-square rounded-lg border text-center flex flex-col items-center justify-center transition select-none '
  const ring =
    cell.key === selectedKey.value
      ? 'ring-2 ring-primary '
      : cell.key === todayKey.value
        ? 'ring-2 ring-primary/50 '
        : ''
  const tone = cell.hasRecord
    ? `${SCORE_TONES[String(cell.score)].cell} font-medium`
    : 'border-border bg-muted/30 hover:bg-muted/70 cursor-pointer'
  return base + ring + tone
}

function cellTitleOf(cell) {
  if (cell.isFuture) return `${cell.day} 日（未来日期不可写）`
  if (cell.hasRecord) return `${cell.key}：${emojiOf(cell.score)} ${scoreLabelOf(cell.score)}`
  return `${cell.key}：未记录，点击补记`
}

function scoreColor(score) {
  const tone = SCORE_TONES[String(score)]
  return tone ? tone.dot : '#94a3b8'
}

function segPoints(seg) {
  return seg.map((p) => `${p.x},${p.y}`).join(' ')
}

// ---------- 交互 ----------
function flash(type, text) {
  saveState.value = { type, text }
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveState.value = { type: '', text: '' }
  }, 3000)
}

function resetForm() {
  selectedScore.value = null
  selectedTags.value = []
  noteText.value = ''
}

// 点击月历某日：载入该日已有记录到左侧表单（历史可改）
function selectDay(key) {
  if (isFutureKey(key)) return
  selectedKey.value = key
  const rec = recordsByDate.value.get(key)
  selectedScore.value = rec ? rec.score : null
  selectedTags.value = rec ? [...rec.tags] : []
  noteText.value = rec ? rec.note : ''
}

function toggleTag(tag) {
  selectedTags.value = selectedTags.value.includes(tag)
    ? selectedTags.value.filter((t) => t !== tag)
    : [...selectedTags.value, tag]
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
    return true
  } catch (err) {
    return false
  }
}

function saveDay() {
  if (!canSave.value) return
  const rec = {
    date: selectedKey.value,
    score: selectedScore.value,
    tags: [...selectedTags.value],
    note: noteText.value.trim().slice(0, NOTE_MAX)
  }
  records.value = upsertDay(records.value, rec)
  if (!persist()) {
    flash('err', '写入本机存储失败（浏览器隐私模式或容量受限）：本次修改仅在刷新页面前有效，建议先导出 CSV 备份。')
    return
  }
  const day = rec.date.slice(5).replace('-', '/')
  const verb = editingExisting.value ? '覆盖更新' : '保存'
  flash('ok', `已${verb} ${day} 的记录：${emojiOf(rec.score)} ${scoreLabelOf(rec.score)}${rec.tags.length ? `（${rec.tags.join('、')}）` : ''}，同一天再次保存会覆盖。`)
}

function shiftMonth(delta) {
  disarmClear()
  const total = viewYear.value * 12 + (viewMonth.value - 1) + delta
  viewYear.value = Math.floor(total / 12)
  viewMonth.value = (total % 12) + 1
}

function prevMonth() {
  shiftMonth(-1)
}

function nextMonth() {
  shiftMonth(1)
}

function backToCurrentMonth() {
  if (!todayKey.value) return
  disarmClear()
  viewYear.value = Number(todayKey.value.slice(0, 4))
  viewMonth.value = Number(todayKey.value.slice(5, 7))
}

function disarmClear() {
  clearArmed.value = false
  if (clearTimer) {
    clearTimeout(clearTimer)
    clearTimer = null
  }
}

// 两段式确认：第一次点击进入待确认态（3 秒后自动取消），第二次点击才真正清空
function handleClearClick() {
  if (!clearArmed.value) {
    clearArmed.value = true
    if (clearTimer) clearTimeout(clearTimer)
    clearTimer = setTimeout(disarmClear, 3000)
    return
  }
  const removed = monthStats.value.count
  const ym = yearMonth.value
  records.value = records.value.filter((r) => !r.date.startsWith(ym))
  if (selectedKey.value.startsWith(ym)) resetForm()
  persist()
  disarmClear()
  flash('ok', `已清空 ${viewYear.value} 年 ${viewMonth.value} 月的 ${removed} 条记录。`)
}

// 导出 CSV（带 BOM）：仅客户端执行
function exportCsv() {
  if (!records.value.length) return
  const blob = new Blob([csvOf(records.value)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mood-tracker-${yearMonth.value || 'all'}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 生命周期（浏览器 API 只在这里 / 回调中触达，SSR 安全） ----------
onMounted(() => {
  const now = new Date()
  todayKey.value = keyOfDate(now)
  viewYear.value = now.getFullYear()
  viewMonth.value = now.getMonth() + 1
  selectedKey.value = todayKey.value

  // 读取只在 onMounted：localStorage 不可用或数据损坏时按空记录开始
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) records.value = normalizeRecords(JSON.parse(raw))
  } catch (err) {
    /* 忽略：按空记录开始 */
  }

  // 今天已有记录时，把左侧表单预填为已保存内容（提示可覆盖）
  const existing = recordsByDate.value.get(todayKey.value)
  if (existing) {
    selectedScore.value = existing.score
    selectedTags.value = [...existing.tags]
    noteText.value = existing.note
  }

  addRecentTool('mood-tracker')
})

onBeforeUnmount(() => {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  disarmClear()
})
</script>
