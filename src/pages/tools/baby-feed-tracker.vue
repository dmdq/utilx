<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Milk class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">婴儿喂养记录器</h1>
          <p class="text-sm text-muted-foreground mt-1">亲喂计时、瓶喂奶量、换尿布状态一条龙记录，距上次喂养间隔一目了然，新手爸妈白天黑夜的省心账本</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线婴儿喂养记录工具：亲喂一键开始 / 结束计时并自动换算分钟，瓶喂一键 +10/+30/+50 快捷记录奶量，换尿布按「尿湿 / 便便 / 两者」打卡，
        自动汇总当日亲喂分钟数、瓶喂毫升数、尿布次数与喂养次数，实时计算距上次喂养的间隔并给出按需喂养提示；支持回看历史日期、导出当日 CSV。
        全部记录只保存在本机浏览器中，不上传任何数据，也不用注册登录。
      </p>
    </div>

    <!-- 数据安全说明条 -->
    <div class="mb-6 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
      <TriangleAlert class="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <span>记录只保存在这台设备的浏览器里，清除浏览器数据会丢失；重要成长记录建议截图备份。换设备不同步。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：记录面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Milk class="w-5 h-5 mr-2 text-primary" /> 记录一次
        </h2>

        <!-- 内联操作反馈状态条 -->
        <div
          v-if="statusBar"
          class="flex items-start gap-1.5 rounded-md border px-3 py-2 text-xs leading-relaxed"
          :class="statusBarClass"
        >
          <CheckCircle v-if="statusBar.kind === 'ok'" class="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <TriangleAlert v-else-if="statusBar.kind === 'warn'" class="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <Info v-else class="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ statusBar.text }}</span>
        </div>

        <!-- 类型三 tab -->
        <div class="grid grid-cols-3 gap-2">
          <button
            @click="activeTab = 'nursing'"
            class="flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium transition"
            :class="activeTab === 'nursing' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'"
          >
            <Milk class="h-4 w-4" /> 亲喂
          </button>
          <button
            @click="activeTab = 'bottle'"
            class="flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium transition"
            :class="activeTab === 'bottle' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'"
          >
            <Clock class="h-4 w-4" /> 瓶喂
          </button>
          <button
            @click="activeTab = 'diaper'"
            class="flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium transition"
            :class="activeTab === 'diaper' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'"
          >
            <RefreshCw class="h-4 w-4" /> 换尿布
          </button>
        </div>

        <!-- 亲喂：开始 / 结束计时 -->
        <div v-if="activeTab === 'nursing'" class="space-y-3">
          <p class="text-sm font-medium text-foreground">哺乳侧</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="side in sideOptions"
              :key="side.id"
              :disabled="nursingActive"
              @click="nursingSide = side.id"
              class="rounded-lg border py-2 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
              :class="nursingSide === side.id ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'"
            >
              {{ side.label }}
            </button>
          </div>
          <div v-if="nursingActive" class="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center space-y-2">
            <p class="text-xs text-muted-foreground">正在亲喂（{{ nursingSessionSideLabel }}）计时中</p>
            <p class="text-3xl font-bold text-primary font-mono">{{ nursingTimerText }}</p>
            <button
              @click="stopNursing"
              class="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
            >
              <Square class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 结束并记录本次亲喂
            </button>
          </div>
          <button
            v-else
            @click="startNursing"
            class="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 开始亲喂计时
          </button>
          <p class="text-xs text-muted-foreground leading-relaxed">
            亲喂看不到毫升数，用「侧别 + 时长」记录最实用：开工点开始，收工点结束，自动按分钟计入当日小结。计时不足 10 秒会自动取消，防止误触。
          </p>
        </div>

        <!-- 瓶喂：奶量快捷输入 -->
        <div v-else-if="activeTab === 'bottle'" class="space-y-3">
          <label class="text-sm font-medium text-foreground" for="bottle-ml-input">本次奶量（ml）</label>
          <input
            id="bottle-ml-input"
            v-model.number="bottleMl"
            type="number"
            min="0"
            step="10"
            placeholder="例如 120"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="amount in bottleQuickAmounts"
              :key="amount"
              @click="addBottleMl(amount)"
              class="rounded-lg border border-border bg-muted/40 hover:bg-muted py-2 text-sm font-medium text-foreground transition"
            >
              +{{ amount }}
            </button>
          </div>
          <button
            @click="recordBottle"
            class="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            <CheckCircle class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 记录瓶喂
          </button>
          <p class="text-xs text-muted-foreground leading-relaxed">
            快捷键在当前奶量上累加：比如冲了 90 ml 喝掉一半又续了 30 ml，点两次 +30 再记录即可；喝一半倒掉也可以按实际喝掉的量填写。
          </p>
        </div>

        <!-- 换尿布：状态打卡 -->
        <div v-else class="space-y-3">
          <p class="text-sm font-medium text-foreground">本次状态</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="st in diaperOptions"
              :key="st.id"
              @click="diaperStatus = st.id"
              class="rounded-lg border py-2 text-sm font-medium transition"
              :class="diaperStatus === st.id ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'"
            >
              {{ st.label }}
            </button>
          </div>
          <button
            @click="recordDiaper"
            class="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            <CheckCircle class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 记录换尿布
          </button>
          <p class="text-xs text-muted-foreground leading-relaxed">
            「两者」指尿湿和便便一次全有。满 5 天后的宝宝每天约 6 片以上湿透尿布是吃够的重要信号，当日小结里的换尿布次数就是数这个用的。
          </p>
        </div>
      </div>

      <!-- 右：状态卡 + 时间线 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Clock class="w-5 h-5 mr-2 text-primary" /> 喂养状态与时间线
          </h2>
          <!-- 历史天切换 -->
          <div class="flex items-center gap-1">
            <button
              @click="goOlderDay"
              :disabled="dayOffset >= MAX_DAY_OFFSET"
              class="w-8 h-8 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="查看更早一天"
            >‹</button>
            <span class="text-sm font-medium text-foreground min-w-[72px] text-center">{{ dayLabel }}</span>
            <button
              @click="goNewerDay"
              :disabled="dayOffset <= 0"
              class="w-8 h-8 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="查看更近一天"
            >›</button>
          </div>
        </div>

        <!-- 状态卡：距上次喂养 + 当日小结四格 -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="bg-primary/10 rounded-lg p-4 text-center flex flex-col justify-center">
            <p class="text-xs text-muted-foreground mb-1">距上次喂养</p>
            <p class="text-4xl font-bold text-primary leading-tight">{{ lastFeedIntervalText }}</p>
            <p class="text-xs text-muted-foreground mt-2 leading-relaxed">{{ lastFeedHint }}</p>
            <p class="text-[10px] text-muted-foreground/70 mt-1">提示口径以儿保医生建议为准</p>
            <p v-if="nursingActive" class="text-xs text-primary font-medium mt-2">亲喂计时中 {{ nursingTimerText }}</p>
            <p v-else-if="lastFeedText" class="text-[10px] text-muted-foreground/70 mt-1">{{ lastFeedText }}</p>
          </div>
          <div class="sm:col-span-2 grid grid-cols-2 gap-2 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">亲喂分钟</p>
              <p class="text-2xl font-bold text-foreground">{{ daySummary.nursingMinutes }}<span class="text-xs font-normal text-muted-foreground ml-0.5">分</span></p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">瓶喂总量</p>
              <p class="text-2xl font-bold text-foreground">{{ daySummary.bottleMl }}<span class="text-xs font-normal text-muted-foreground ml-0.5">ml</span></p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">换尿布次数</p>
              <p class="text-2xl font-bold text-foreground">{{ diaperCount }}<span class="text-xs font-normal text-muted-foreground ml-0.5">次</span></p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">喂养次数</p>
              <p class="text-2xl font-bold text-foreground">{{ daySummary.feedCount }}<span class="text-xs font-normal text-muted-foreground ml-0.5">次</span></p>
            </div>
          </div>
        </div>

        <!-- 时间线标题与操作 -->
        <div class="flex items-center justify-between flex-wrap gap-2 pt-1">
          <h3 class="text-sm font-semibold text-foreground">{{ dayLabel }}的记录（{{ dayRecordsSorted.length }} 条）</h3>
          <div class="flex items-center gap-2">
            <button
              @click="exportDayCsv"
              class="px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-foreground transition"
            >
              导出当日 CSV
            </button>
            <button
              @click="onClearAll"
              class="px-3 py-1.5 rounded-lg border text-xs font-medium transition"
              :class="clearArmed ? 'bg-red-500/10 border-red-500/30 text-red-600 hover:bg-red-500/20' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'"
            >
              <Trash2 class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> {{ clearArmed ? '再点一次确认清空' : '清空全部' }}
            </button>
          </div>
        </div>

        <!-- 今日时间线（倒序） -->
        <ul class="divide-y divide-border max-h-[420px] overflow-y-auto rounded-lg border border-border">
          <li v-for="rec in dayRecordsSorted" :key="rec.id" class="flex items-center gap-3 px-3 py-2.5">
            <span class="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground w-16 flex-shrink-0">
              <Clock class="w-3 h-3" />{{ timeTextOf(rec.ts) }}
            </span>
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
              :class="TYPE_META[rec.type] ? TYPE_META[rec.type].chip : 'bg-muted text-muted-foreground'"
            >{{ recordTitleOf(rec) }}</span>
            <span class="text-sm text-foreground flex-1 min-w-0 truncate">{{ recordDetailOf(rec) }}</span>
            <button
              @click="deleteRecord(rec.id)"
              class="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition flex-shrink-0"
              :aria-label="`删除 ${timeTextOf(rec.ts)} 的记录`"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </li>
          <li v-if="!dayRecordsSorted.length" class="px-3 py-10 text-center text-sm text-muted-foreground">
            {{ dayLabel }}还没有记录，从左边「记录一次」开始吧
          </li>
        </ul>

        <p class="text-xs text-muted-foreground leading-relaxed">
          间隔按「亲喂 + 瓶喂」的最近一次记录计算，换尿布不计入；查看过去日期时小结与时间线随之切换，导出 CSV 也是导出当前查看的这一天。
        </p>
      </div>
    </div>

    <!-- 医学免责提示条（静态） -->
    <div class="mb-6 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
      <Info class="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
      <span>本工具是记录辅助，不构成医学建议；喂养频率与奶量请以儿保医生指导为准。</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>婴儿喂养记录器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          婴儿喂养记录器是一款给新手爸妈用的在线喂养打卡工具。它把月子期最常见的三类记录收进一个页面：亲喂用「开始 / 结束计时」自动换算分钟，
          瓶喂直接记毫升数（+10/+30/+50 一键快捷输入），换尿布按「尿湿 / 便便 / 两者」打卡。每次记录都带上时间戳，自动汇总出当日小结
          （亲喂分钟数、瓶喂毫升数、尿布次数、喂养次数），并实时计算「距上次喂养」的间隔，帮睡眼惺忪的你回答那个半夜最常问的问题：
          「宝宝这次是几点喂的来着？」。
        </p>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          所有记录只保存在你这台设备的浏览器 localStorage 里（上限 2000 条，超出自动裁掉最旧的记录并提示），不联网、不上传、不需要注册。
          支持按天回看历史记录（‹ 昨天 ›），也可以把任意一天的记录导出成带 BOM 的 CSV 文件，用 Excel 或 WPS 打开留存。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">新生儿多久喂一次？</h3>
            <p class="text-sm text-muted-foreground mt-1">权威口径是「按需喂养」：新生儿一般 24 小时喂 8-12 次，白天间隔常在 1.5-3 小时、夜里可能拉长到 4 小时左右，但不必严格看钟——宝宝出现觅食、吃手、咂嘴、哭闹等饥饿信号就喂。月龄超过 1 个月、建立了自己节奏后，3-4 小时一次很常见；如果宝宝睡着不必叫醒，健康足月儿饿了会自己要。以上均为一般参考口径，具体请以儿保医生建议为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">怎么知道宝宝吃够了？</h3>
            <p class="text-sm text-muted-foreground mt-1">日常最直观的两个信号是尿量与体重：满 5 天后每天约 6 片以上湿透的尿布、体重按儿保曲线稳定增长，加上吃完有满足感，通常就说明吃够了；拿不准时在儿保体检时和医生确认。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">亲喂怎么记时间？</h3>
            <p class="text-sm text-muted-foreground mt-1">亲喂看不到毫升数，所以用「侧别 + 时长」记录：开工前选好哺乳侧点「开始亲喂计时」，结束时点「结束并记录」，工具自动按分钟计入当日小结；如果两侧都喂了，可分别记录两次，或直接选「两侧」记为一次。计时不足 10 秒会自动取消，避免误触产生垃圾记录。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">记录会丢吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">记录保存在这台设备浏览器的 localStorage 里，只要不清除浏览器数据、不换设备就不会丢；但清除浏览器缓存 / 网站数据、重装系统或换手机都不会带走这些记录，工具也不提供云端同步。建议在满月、百天等重要节点用「导出当日 CSV」或截图把小结留存备份。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">爸爸能用吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">当然——喂养成记录本来就该是全家共享的活。工具没有账号和登录，在同一台设备上，爸爸、奶奶、月嫂都能随手记录瓶喂和换尿布，全部计入当日小结；妈妈补觉醒来打开页面，谁喂过、几点喂的、喂了多少一目了然，不会出现「你到底喂没喂」的凌晨罗生门。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'baby-feed-tracker'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Milk, Play, Square, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Trash2, Clock
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '婴儿喂养记录器 - 宝宝吃奶/亲喂计时/换尿布记录工具',
  description: '免费在线婴儿喂养记录工具：亲喂一键计时自动换算分钟、瓶喂快捷记录奶量、换尿布状态打卡，自动汇总当日亲喂分钟数/瓶喂毫升数/尿布次数，实时计算距上次喂养间隔并给出按需喂养提示，支持历史回看与当日 CSV 导出，数据只存本机浏览器不上传',
  keywords: '喂养记录,宝宝吃奶记录,母乳计时,换尿布记录,新生儿喂养间隔',
  author: '有条工具',
  ogTitle: '婴儿喂养记录器 - 宝宝吃奶/亲喂计时/换尿布记录工具 | 有条工具',
  ogDescription: '亲喂计时、瓶喂奶量、换尿布打卡一条龙，距上次喂养间隔一目了然。',
  ogUrl: 'https://www.util.cn/tools/baby-feed-tracker',
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
          name: '婴儿喂养记录器',
          url: 'https://www.util.cn/tools/baby-feed-tracker',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['亲喂开始/结束计时并自动换算分钟', '瓶喂奶量快捷记录（+10/+30/+50）', '换尿布尿湿/便便/两者状态打卡', '当日小结：亲喂分钟/瓶喂毫升/尿布与喂养次数', '距上次喂养间隔与按需喂养提示', '历史日期回看与当日 CSV 导出', '本地存储不上传，上限 2000 条自动裁剪']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '健康工具', item: 'https://www.util.cn/health/' },
            { '@type': 'ListItem', position: 3, name: '婴儿喂养记录器', item: 'https://www.util.cn/tools/baby-feed-tracker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '新生儿多久喂一次？',
              acceptedAnswer: { '@type': 'Answer', text: '权威口径是按需喂养：新生儿一般24小时喂8-12次，白天间隔常在1.5-3小时、夜里可能拉长到4小时左右，出现觅食、吃手、哭闹等饥饿信号就喂；月龄超过1个月后3-4小时一次很常见，宝宝睡着不必叫醒。具体以儿保医生建议为准。' }
            },
            {
              '@type': 'Question',
              name: '怎么知道宝宝吃够了？',
              acceptedAnswer: { '@type': 'Answer', text: '日常最直观的两个信号是尿量与体重：满5天后每天约6片以上湿透的尿布、体重按儿保曲线稳定增长，加上吃完有满足感，通常说明吃够了；拿不准时与儿保医生确认。' }
            },
            {
              '@type': 'Question',
              name: '亲喂怎么记时间？',
              acceptedAnswer: { '@type': 'Answer', text: '亲喂用侧别加时长记录：开工前选好哺乳侧点开始亲喂计时，结束时点结束并记录，自动按分钟计入当日小结；两侧都喂可分别记两次或选两侧记一次，计时不足10秒自动取消。' }
            },
            {
              '@type': 'Question',
              name: '记录会丢吗？',
              acceptedAnswer: { '@type': 'Answer', text: '记录保存在这台设备浏览器的localStorage里（上限2000条，超出自动裁掉最旧记录），不清除浏览器数据、不换设备就不会丢；没有云端同步，重要节点建议导出当日CSV或截图备份。' }
            },
            {
              '@type': 'Question',
              name: '爸爸能用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，喂养成记录是全家共享的活。工具没有账号登录，同一台设备上爸爸、奶奶、月嫂都能随手记录瓶喂和换尿布，全部计入当日小结，谁喂过、几点喂的、喂了多少一目了然。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_RECORDS = 2000      // localStorage 记录上限，超出裁最旧
const DAY_MS = 24 * 60 * 60 * 1000
const NURSING_MIN_MS = 10000  // 亲喂计时不足此时长视为误触，不记录
const MAX_DAY_OFFSET = 30     // 历史回看最多往前翻 30 天

const TYPE_META = {
  nursing: { label: '亲喂', chip: 'bg-pink-500/10 text-pink-600' },
  bottle: { label: '瓶喂', chip: 'bg-sky-500/10 text-sky-600' },
  diaper: { label: '换尿布', chip: 'bg-amber-500/10 text-amber-600' }
}
const SIDE_LABELS = { left: '左侧', right: '右侧', both: '两侧' }
const DIAPER_LABELS = { wet: '尿湿', dirty: '便便', both: '两者' }

// 追加一条记录，返回新数组（不可变）：带自增 id 与 ts=now；超过上限裁掉最旧
function addRecord(records, record, now) {
  const nextId = records.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1
  const next = records.concat([{ ...record, id: nextId, ts: now }])
  return next.length > MAX_RECORDS ? next.slice(next.length - MAX_RECORDS) : next
}

// 按日过滤记录：dayStartIso 为当天 0 点的 ISO 串，取 [0 点, 次日 0 点) 区间
function todayRecordsOf(records, dayStartIso) {
  const start = new Date(dayStartIso).getTime()
  if (!Number.isFinite(start)) return []
  const end = start + DAY_MS
  return records.filter((r) => Number(r.ts) >= start && Number(r.ts) < end)
}

// 当日小结：亲喂分钟 / 瓶喂毫升 / 尿布分状态计数 / 喂养次数（亲喂+瓶喂）/ 最近一次喂养时间
function summaryOf(dayRecords) {
  let nursingMinutes = 0
  let bottleMl = 0
  const diapers = { wet: 0, dirty: 0, both: 0 }
  let feedCount = 0
  let lastFeedAt = null
  for (const r of dayRecords) {
    const ts = Number(r.ts)
    if (r.type === 'nursing') {
      nursingMinutes += Math.max(0, Math.round(Number(r.minutes) || 0))
      feedCount += 1
      if (lastFeedAt === null || ts > lastFeedAt) lastFeedAt = ts
    } else if (r.type === 'bottle') {
      bottleMl += Math.max(0, Math.round(Number(r.ml) || 0))
      feedCount += 1
      if (lastFeedAt === null || ts > lastFeedAt) lastFeedAt = ts
    } else if (r.type === 'diaper') {
      if (Object.prototype.hasOwnProperty.call(diapers, r.status)) diapers[r.status] += 1
    }
  }
  return { nursingMinutes, bottleMl, diapers, feedCount, lastFeedAt }
}

// 距上次喂养的间隔（时:分，跨日按纯时间差计算，正常）
function intervalSinceLastFeedOf(lastFeedTs, now) {
  const ms = Math.max(0, Number(now) - Number(lastFeedTs))
  const totalMin = Math.floor(ms / 60000)
  return { hours: Math.floor(totalMin / 60), minutes: totalMin % 60, ms }
}

// 间隔提示三档：0-3 按需喂养 / 3-4 常见间隔 / >4 睡着不必叫醒（月龄>1 个月口径）
function intervalHintOf(hours) {
  if (hours < 3) return '间隔 3 小时以内：新生儿按需喂养很正常，饿了就喂，不必严格看钟。'
  if (hours < 4) return '间隔 3-4 小时：是常见间隔，宝宝状态好就按这个节奏继续。'
  return '间隔超过 4 小时（月龄大于 1 个月）：如果宝宝睡着不必叫醒，健康足月儿饿了会要吃。'
}

// 毫秒 → "3小时25分" / "2小时" / "45分"（负数按 0 处理）
function formatIntervalOf(ms) {
  const totalMin = Math.floor(Math.max(0, Number(ms) || 0) / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0 && m > 0) return `${h}小时${m}分`
  if (h > 0) return `${h}小时`
  return `${m}分`
}

// 毫秒 → 亲喂计时展示 "MM:SS"（满一小时为 "H:MM:SS"）
function timerTextOf(ms) {
  const totalSec = Math.floor(Math.max(0, Number(ms) || 0) / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const p = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`
}

// 时间戳 → "HH:MM"（本地时区）
function timeTextOf(ts) {
  const d = new Date(Number(ts))
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}

// 当天 0 点（可往前偏移 offsetDays 天）→ "YYYY-MM-DD"（本地时区）
function dateKeyOf(nowMs, offsetDays) {
  const d = new Date(Number(nowMs))
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (Number(offsetDays) || 0))
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// 时间戳 → "YYYY-MM-DD HH:MM"（本地时区，CSV 用）
function dateTimeTextOf(ts) {
  return `${dateKeyOf(ts, 0)} ${timeTextOf(ts)}`
}

// 当天 0 点（可往前偏移）→ ISO 串，供 todayRecordsOf 作区间起点
function dayStartIsoOf(nowMs, offsetDays) {
  const d = new Date(Number(nowMs))
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (Number(offsetDays) || 0))
  return d.toISOString()
}

// 偏移天数 → "今天 / 昨天 / 前天 / M月D日"
function dayLabelOf(offsetDays, nowMs) {
  const off = Number(offsetDays) || 0
  if (off === 0) return '今天'
  if (off === 1) return '昨天'
  if (off === 2) return '前天'
  const d = new Date(dayStartIsoOf(nowMs, off))
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// 记录 → 类型标题（"亲喂/瓶喂/换尿布"）
function recordTitleOf(record) {
  return (TYPE_META[record.type] && TYPE_META[record.type].label) || '未知'
}

// 记录 → 详情文案（"左侧 · 12 分钟" / "120 ml" / "尿湿"）
function recordDetailOf(record) {
  if (record.type === 'nursing') {
    return `${SIDE_LABELS[record.side] || '未记侧别'} · ${Math.max(0, Math.round(Number(record.minutes) || 0))} 分钟`
  }
  if (record.type === 'bottle') {
    return `${Math.max(0, Math.round(Number(record.ml) || 0))} ml`
  }
  if (record.type === 'diaper') {
    return DIAPER_LABELS[record.status] || '未记状态'
  }
  return '—'
}

// CSV 单元格转义：含逗号 / 引号 / 换行时加引号并把内部引号翻倍
function csvEscapeOf(text) {
  const s = String(text)
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

// 当日记录 → 带 BOM 的 CSV 文本（时间,类型,详情；按时间升序）
function csvOf(dayRecords) {
  const header = ['时间', '类型', '详情']
  const rows = [...dayRecords]
    .sort((a, b) => Number(a.ts) - Number(b.ts))
    .map((r) => [dateTimeTextOf(r.ts), recordTitleOf(r), recordDetailOf(r)])
  const body = [header].concat(rows)
    .map((cols) => cols.map(csvEscapeOf).join(','))
    .join('\r\n')
  return '\uFEFF' + body
}

// 读取到的 localStorage 原始数据 → 合法记录数组（过滤脏数据、补 id/ts、上限裁剪）
function normalizeRecords(raw) {
  if (!Array.isArray(raw)) return []
  const valid = raw.filter((r) => r && typeof r === 'object'
    && Number.isFinite(Number(r.ts))
    && Object.prototype.hasOwnProperty.call(TYPE_META, r.type))
  return valid
    .map((r, i) => ({ ...r, id: Number.isFinite(Number(r.id)) ? Number(r.id) : i + 1, ts: Number(r.ts) }))
    .slice(Math.max(0, valid.length - MAX_RECORDS))
}

// ---------- 页面状态 ----------
const STORAGE_KEY = 'baby-feed-tracker'
const sideOptions = [
  { id: 'left', label: '左侧' },
  { id: 'right', label: '右侧' },
  { id: 'both', label: '两侧' }
]
const diaperOptions = [
  { id: 'wet', label: '尿湿' },
  { id: 'dirty', label: '便便' },
  { id: 'both', label: '两者' }
]
const bottleQuickAmounts = [10, 30, 50]

const records = ref([])
const nowTick = ref(Date.now())
const activeTab = ref('nursing')
const nursingSide = ref('left')
const nursing = ref(null) // { side, startTs } 亲喂进行中会话
const bottleMl = ref(0)
const diaperStatus = ref('wet')
const dayOffset = ref(0)
const clearArmed = ref(false)
const statusBar = ref(null)
const seoContentVisible = ref(true)

let tickTimer = null
let statusTimer = null
let clearArmTimer = null

// ---------- 计算属性 ----------
const overallSummary = computed(() => summaryOf(records.value))
const lastFeedAt = computed(() => overallSummary.value.lastFeedAt)
const lastFeedInterval = computed(() =>
  lastFeedAt.value === null ? null : intervalSinceLastFeedOf(lastFeedAt.value, nowTick.value)
)
const lastFeedIntervalText = computed(() => {
  if (lastFeedAt.value === null) return '暂无记录'
  const ms = nowTick.value - lastFeedAt.value
  return ms < 60000 ? '刚喂过' : formatIntervalOf(ms)
})
const lastFeedHint = computed(() =>
  lastFeedInterval.value === null
    ? '记录一次亲喂或瓶喂后，这里会显示间隔与按需喂养提示'
    : intervalHintOf(lastFeedInterval.value.hours)
)
const lastFeedText = computed(() =>
  lastFeedAt.value === null ? '' : `上次喂养 ${dateTimeTextOf(lastFeedAt.value)}`
)

const nursingActive = computed(() => nursing.value !== null)
const nursingTimerText = computed(() =>
  nursing.value ? timerTextOf(nowTick.value - nursing.value.startTs) : ''
)
const nursingSessionSideLabel = computed(() =>
  nursing.value ? (SIDE_LABELS[nursing.value.side] || '两侧') : ''
)

const selectedDayStartIso = computed(() => dayStartIsoOf(nowTick.value, dayOffset.value))
const dayRecords = computed(() => todayRecordsOf(records.value, selectedDayStartIso.value))
const dayRecordsSorted = computed(() => [...dayRecords.value].sort((a, b) => b.ts - a.ts))
const daySummary = computed(() => summaryOf(dayRecords.value))
const diaperCount = computed(() => {
  const d = daySummary.value.diapers
  return d.wet + d.dirty + d.both
})
const dayLabel = computed(() => dayLabelOf(dayOffset.value, nowTick.value))

const statusBarClass = computed(() => {
  if (!statusBar.value) return ''
  if (statusBar.value.kind === 'ok') return 'bg-green-500/10 border-green-500/20 text-green-600'
  if (statusBar.value.kind === 'warn') return 'bg-amber-500/10 border-amber-500/20 text-amber-600'
  return 'bg-primary/10 border-primary/20 text-primary'
})

// ---------- 浏览器存储（核心数据，均带 try/catch；读只在 onMounted） ----------
function loadStoredRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return normalizeRecords(JSON.parse(raw))
  } catch {
    return []
  }
}

function persistRecords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
    return true
  } catch {
    setStatus('warn', '写入浏览器本地存储失败，本次记录暂存于内存，请勿关闭页面')
    return false
  }
}

// ---------- 操作反馈（内联状态条，自动消失） ----------
function setStatus(kind, text) {
  statusBar.value = { kind, text }
  if (statusTimer) clearTimeout(statusTimer)
  statusTimer = setTimeout(() => {
    statusBar.value = null
    statusTimer = null
  }, 4000)
}

// ---------- 记录操作 ----------
function commitRecord(record) {
  const wasAtCap = records.value.length >= MAX_RECORDS
  records.value = addRecord(records.value, record, Date.now())
  if (!persistRecords()) return
  if (wasAtCap) setStatus('info', `记录已达 ${MAX_RECORDS} 条上限，已自动裁掉最旧的记录`)
}

function startNursing() {
  nursing.value = { side: nursingSide.value, startTs: Date.now() }
  setStatus('info', `亲喂计时开始（${SIDE_LABELS[nursingSide.value] || '两侧'}）`)
}

function stopNursing() {
  const session = nursing.value
  if (!session) return
  const elapsed = Date.now() - session.startTs
  nursing.value = null
  if (elapsed < NURSING_MIN_MS) {
    setStatus('warn', '本次计时不足 10 秒，视为误触已取消记录')
    return
  }
  const minutes = Math.max(1, Math.round(elapsed / 60000))
  commitRecord({ type: 'nursing', side: session.side, minutes })
  setStatus('ok', `已记录亲喂（${SIDE_LABELS[session.side] || '两侧'}）${minutes} 分钟`)
}

function addBottleMl(amount) {
  const base = Math.round(Number(bottleMl.value) || 0)
  bottleMl.value = Math.min(2000, Math.max(0, base + amount))
}

function recordBottle() {
  const ml = Math.round(Number(bottleMl.value) || 0)
  if (ml <= 0) {
    setStatus('warn', '请先填写或用快捷键选择本次奶量（ml）')
    return
  }
  commitRecord({ type: 'bottle', ml })
  setStatus('ok', `已记录瓶喂 ${ml} ml`)
  bottleMl.value = 0
}

function recordDiaper() {
  commitRecord({ type: 'diaper', status: diaperStatus.value })
  setStatus('ok', `已记录换尿布（${DIAPER_LABELS[diaperStatus.value] || '—'}）`)
}

function deleteRecord(id) {
  const target = records.value.find((r) => r.id === id)
  if (!target) return
  records.value = records.value.filter((r) => r.id !== id)
  if (persistRecords()) setStatus('ok', `已删除 ${timeTextOf(target.ts)} 的那条记录`)
}

function onClearAll() {
  if (!clearArmed.value) {
    clearArmed.value = true
    setStatus('warn', '将删除本设备上的全部喂养记录且无法恢复——再次点击「清空全部」确认')
    if (clearArmTimer) clearTimeout(clearArmTimer)
    clearArmTimer = setTimeout(() => {
      clearArmed.value = false
      clearArmTimer = null
    }, 6000)
    return
  }
  if (clearArmTimer) {
    clearTimeout(clearArmTimer)
    clearArmTimer = null
  }
  clearArmed.value = false
  nursing.value = null
  records.value = []
  if (persistRecords()) setStatus('ok', '已清空全部记录')
}

// ---------- 历史天切换与导出 ----------
function goOlderDay() {
  if (dayOffset.value < MAX_DAY_OFFSET) {
    dayOffset.value += 1
    clearArmed.value = false
  }
}

function goNewerDay() {
  if (dayOffset.value > 0) {
    dayOffset.value -= 1
    clearArmed.value = false
  }
}

function exportDayCsv() {
  const list = dayRecords.value
  if (!list.length) {
    setStatus('warn', `${dayLabel.value}还没有记录可导出`)
    return
  }
  const csv = csvOf(list)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `婴儿喂养记录-${dateKeyOf(Date.now(), dayOffset.value)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  setStatus('ok', `已导出 ${dayLabel.value} 的 CSV（${list.length} 条）`)
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  records.value = loadStoredRecords()
  addRecentTool('baby-feed-tracker')
  tickTimer = setInterval(() => { nowTick.value = Date.now() }, 1000)
})

onBeforeUnmount(() => {
  if (tickTimer !== null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
  if (statusTimer !== null) {
    clearTimeout(statusTimer)
    statusTimer = null
  }
  if (clearArmTimer !== null) {
    clearTimeout(clearArmTimer)
    clearArmTimer = null
  }
})
</script>
