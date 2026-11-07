<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Trophy class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">比赛记分牌</h1>
          <p class="text-sm text-muted-foreground mt-1">大字号双队比分：单击加分、局分副计数、逐事件撤销、发球方标记与局点提示条，全屏投影可战报复制</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线比赛记分牌：两队命名后用大按钮记分（+1/−1 与 1/2/3 分快捷步长），比分大字适合手机横屏与平板投影；
        支持局分/盘分副计数、逐事件历史（可撤销单步，快照栈实现，刷新不丢）、发球方标记（乒乓球 11 分制自动轮发、
        排球/羽毛球按得分方轮转，可整体关闭）、局点/局末提示条（乒乓 11 分、排球 25 分、羽毛球 21 分净胜 2 分，
        羽毛球 29 平封顶 30——以通行规则为准并已在页内注明）；重置需二次确认，一键全屏投影、复制文本战报。
        全部数据保存在本机浏览器 localStorage，零上传。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：设置与操作 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Info class="w-5 h-5 mr-2 text-primary" /> 设置与操作
        </h2>

        <!-- 队名 -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label for="name-a" class="text-xs text-muted-foreground">主队名称</label>
            <input
              id="name-a"
              v-model="nameA"
              type="text"
              maxlength="12"
              placeholder="主队"
              class="w-full h-10 px-2.5 border border-border bg-background rounded-lg text-sm text-foreground"
            />
          </div>
          <div class="space-y-1">
            <label for="name-b" class="text-xs text-muted-foreground">客队名称</label>
            <input
              id="name-b"
              v-model="nameB"
              type="text"
              maxlength="12"
              placeholder="客队"
              class="w-full h-10 px-2.5 border border-border bg-background rounded-lg text-sm text-foreground"
            />
          </div>
        </div>

        <!-- 计分规则 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">计分规则（局点提示与发球轮转）</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="r in SB_RULES"
              :key="r.id"
              @click="ruleId = r.id"
              class="px-3 py-2 rounded-lg border text-sm font-medium transition"
              :class="ruleId === r.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/80'"
            >
              {{ r.label }}
            </button>
          </div>
        </div>

        <!-- 发球方标记 -->
        <button
          @click="serveOn = !serveOn"
          class="w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition flex items-center justify-center gap-2"
          :class="serveOn ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted border-border text-muted-foreground'"
          :aria-pressed="serveOn"
        >
          <CircleDot class="w-4 h-4" />
          发球方标记：{{ serveOn ? '开（记分后自动轮转 + 手动切换）' : '关' }}
        </button>

        <!-- 操作按钮 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="undoLast"
            :disabled="!canUndo"
            class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Undo2 class="w-4 h-4" /> 撤销一步
          </button>
          <button
            @click="copyReport"
            class="px-3 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-sm font-medium text-primary transition flex items-center justify-center gap-1.5"
          >
            <Copy class="w-4 h-4" /> 复制战报
          </button>
          <button
            @click="enterFullscreen"
            class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <Maximize class="w-4 h-4" /> 全屏投影
          </button>
          <button
            @click="resetAll"
            class="px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-sm font-medium text-red-600 transition flex items-center justify-center gap-1.5"
          >
            <Eraser class="w-4 h-4" /> 重置比分
          </button>
          <button
            v-if="serveOn"
            @click="flipServe"
            class="col-span-2 px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <CircleDot class="w-4 h-4" /> 手动切换发球权（当前：{{ state.serving === 0 ? nameA || '主队' : nameB || '客队' }}）
          </button>
        </div>

        <!-- 逐事件历史 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground flex items-center gap-1.5">
            <History class="w-4 h-4 text-primary" /> 逐事件历史（可撤销单步）
          </p>
          <div v-if="state.log.length" class="max-h-44 overflow-y-auto space-y-1 pr-1">
            <div
              v-for="(e, i) in state.log.slice(0, 12)"
              :key="'log-' + i"
              class="flex items-center justify-between px-2.5 py-1.5 bg-muted/50 border border-border rounded-lg text-xs"
            >
              <span class="text-foreground">{{ e.text }}</span>
              <span class="text-muted-foreground font-mono">{{ e.time }}</span>
            </div>
          </div>
          <p v-else class="text-xs text-muted-foreground">还没有记录：第一次加分后会出现在这里（保存在本机，刷新不丢）。</p>
        </div>
      </div>

      <!-- 右：大记分牌 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Trophy class="w-5 h-5 mr-2 text-primary" /> 记分牌
          </h2>
          <span class="text-xs text-muted-foreground font-mono">{{ ruleLabel }}</span>
        </div>

        <!-- 局点/局末提示条 -->
        <div
          v-if="noticeText"
          class="px-4 py-2.5 rounded-lg text-sm font-medium text-center"
          :class="status.over ? 'bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400' : 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400'"
        >
          {{ noticeText }}
        </div>

        <!-- 双队比分 -->
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="side in [0, 1]"
            :key="'team-' + side"
            class="rounded-xl border p-5 text-center transition"
            :class="side === 0 ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'"
          >
            <div class="flex items-center justify-center gap-2 mb-2">
              <span
                v-if="serveOn && state.serving === side"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold"
              >
                <CircleDot class="w-3 h-3" /> 发球
              </span>
              <span class="text-sm font-semibold text-foreground truncate max-w-[9rem]">{{ side === 0 ? nameA : nameB }}</span>
            </div>
            <p class="text-7xl sm:text-8xl font-bold font-mono tabular-nums leading-none text-foreground">
              {{ side === 0 ? state.scoreA : state.scoreB }}
            </p>
            <p class="text-xs text-muted-foreground mt-3">
              局分
              <button
                @click="changeGame(side, -1)"
                class="mx-1 w-6 h-6 rounded border border-border bg-background text-foreground hover:bg-muted transition"
                :aria-label="(side === 0 ? nameA : nameB) + ' 局分减一'"
              >−</button>
              <span class="text-lg font-bold text-foreground font-mono">{{ side === 0 ? state.gamesA : state.gamesB }}</span>
              <button
                @click="changeGame(side, 1)"
                class="mx-1 w-6 h-6 rounded border border-border bg-background text-foreground hover:bg-muted transition"
                :aria-label="(side === 0 ? nameA : nameB) + ' 局分加一'"
              >+</button>
            </p>

            <!-- 记分按钮 -->
            <div class="mt-4 grid grid-cols-4 gap-1.5">
              <button
                @click="addScore(side, 1)"
                class="py-2.5 rounded-lg bg-primary text-primary-foreground text-base font-bold hover:opacity-90 transition active:scale-95"
              >+1</button>
              <button
                @click="addScore(side, 2)"
                class="py-2.5 rounded-lg bg-primary/80 text-primary-foreground text-base font-bold hover:opacity-90 transition active:scale-95"
              >+2</button>
              <button
                @click="addScore(side, 3)"
                class="py-2.5 rounded-lg bg-primary/60 text-primary-foreground text-base font-bold hover:opacity-90 transition active:scale-95"
              >+3</button>
              <button
                @click="addScore(side, -1)"
                class="py-2.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-foreground text-base font-bold transition active:scale-95"
              >−1</button>
            </div>
          </div>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          口径：+2/+3 用于篮球三分、排球/乒乓球局末关键分等场景；−1 修正误触（不低于 0）。
          发球轮转：乒乓球每 2 分换发（10 平后每 1 分换发）；排球、羽毛球为每球得分制，谁得分谁发球；
          「自由计分」只提供手动切换。三种球类规则说明见页面下方折叠区，以通行规则为准。
        </p>
      </div>
    </div>

    <!-- 全屏投影 overlay -->
    <div
      v-if="fullscreen"
      class="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-10 p-8 select-none"
    >
      <div class="grid grid-cols-2 gap-8 w-full max-w-6xl">
        <div
          v-for="side in [0, 1]"
          :key="'fs-' + side"
          class="rounded-2xl border-2 p-10 text-center"
          :class="side === 0 ? 'border-primary/40 bg-primary/10' : 'border-border bg-muted/40'"
        >
          <p class="text-2xl font-bold text-foreground flex items-center justify-center gap-3">
            {{ side === 0 ? nameA : nameB }}
            <span
              v-if="serveOn && state.serving === side"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold"
            >
              <CircleDot class="w-3 h-3" /> 发球
            </span>
          </p>
          <p class="text-[7rem] leading-none font-bold font-mono tabular-nums text-foreground mt-4">
            {{ side === 0 ? state.scoreA : state.scoreB }}
          </p>
          <p class="text-lg text-muted-foreground mt-4 font-mono">局分 {{ side === 0 ? state.gamesA : state.gamesB }}</p>
        </div>
      </div>
      <p v-if="noticeText" class="text-xl font-semibold" :class="status.over ? 'text-green-600' : 'text-amber-600'">{{ noticeText }}</p>
      <button
        @click="exitFullscreen"
        class="px-6 py-3 rounded-lg bg-muted hover:bg-muted/80 border border-border text-foreground text-sm font-medium transition flex items-center gap-2"
      >
        <Minimize class="w-4 h-4" /> 退出全屏（Esc）
      </button>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12 group">
      <summary class="text-base font-semibold flex items-center cursor-pointer select-none text-muted-foreground">
        <Info class="w-4 h-4 mr-2 text-primary" /> 常见球类计分规则速查与常见问题（点击展开）
      </summary>

      <h2 class="text-2xl font-bold text-foreground mt-4 mb-4"><span class="text-primary mr-2">#</span>常见球类计分规则速查（以通行规则为准）</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="bg-muted/50 rounded-xl p-4">
          <h3 class="text-sm font-bold text-foreground mb-2">乒乓球 · 11 分制</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            每局 11 分、净胜 2 分（10 平后不封顶，打到领先 2 分为止）；每 2 分换发球方，
            10 平起每 1 分换发；每球得分制。国际比赛多为 7 局 4 胜（或 5 局 3 胜）。
            发球轮转口径：2 分一轮，从首个发球方开始轮转。
          </p>
        </div>
        <div class="bg-muted/50 rounded-xl p-4">
          <h3 class="text-sm font-bold text-foreground mb-2">排球 · 25 分制</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            每局 25 分、净胜 2 分（24 平后不封顶）；五局三胜，决胜局（第 5 局）15 分、同样净胜 2 分。
            每球得分制：谁赢得回合谁得分并获得下一球发球权（对方得分后发球权自动交换）。
            24 平后仍按净胜 2 分进行，无 30 分封顶。
          </p>
        </div>
        <div class="bg-muted/50 rounded-xl p-4">
          <h3 class="text-sm font-bold text-foreground mb-2">羽毛球 · 21 分制</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            每局 21 分、净胜 2 分（20 平后打到领先 2 分）；29 平时封顶——先得第 30 分者胜（30:29），
            这是三大球类中唯一有硬封顶的；三局两胜，11 分技术暂停。每球得分制，得分方获得发球权。
          </p>
        </div>
      </div>
      <p class="text-xs text-muted-foreground leading-relaxed mb-4">
        口径说明：以上为国际通行口径（ITTF 乒乓球、FIVB 排球、BWF 羽毛球），各类业余赛事可能调整
        （如业余排球 21 分制、乒乓 5 分热身局等）。本工具的局点提示按上表通行口径计算，
        「自由计分」模式关闭提示、只做通用记分。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">撤销是怎么做到"一步不错"的？</h3>
      <p class="text-sm text-muted-foreground leading-relaxed mb-4">
        每次记分/改局分/切发球前，工具先把当前完整状态（双方比分、局分、发球方）压入快照栈，
        修改永远作用在新状态上；「撤销一步」弹出最近一个快照整体恢复，再连按几次即可逐事件回退——
        例如连按 +2、+3、−1 后撤销，比分精确回到 +2 之后的状态，而不是简单地把 −1 反加回来
        （两者在被 0 下限截断时结果不同，快照栈永远正确）。快照栈与本机历史一起保存在
        localStorage，刷新页面后依然可以继续撤销。
      </p>

      <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-semibold text-foreground">适合哪些场景？</h3>
          <p class="text-muted-foreground text-sm mt-1">乒乓球、羽毛球、排球的业余对局记分最常用；篮球/街头篮球用 +2/+3 步长；台球局数、棋类局分用局分副计数 + 自由计分模式。大字比分加全屏模式也适合教室活动、趣味运动会投屏。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">局点提示条是什么逻辑？</h3>
          <p class="text-muted-foreground text-sm mt-1">按所选规则实时判断：某队再得 1 分即可赢下本局时提示「局点」（如乒乓 10:8、羽毛球 20:19、排球 24:20），一方已经满足获胜条件时提示「局末」，提示用色区分。规则细节见上方速查表。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">数据会丢吗？会上传吗？</h3>
          <p class="text-muted-foreground text-sm mt-1">队名、比分、局分、发球方和历史记录保存在本机浏览器的 localStorage，刷新/重开浏览器自动恢复；「重置比分」需二次确认，清空后不可恢复。全部数据不出设备。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">战报是什么格式？</h3>
          <p class="text-muted-foreground text-sm mt-1">纯文本一行：「主队 21:15 客队（局分 2:1）」，可直接粘贴到群聊或朋友圈；复制成功与失败都会弹窗提示。</p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'scoreboard-counter'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Trophy, Info, Copy, Undo2, Maximize, Minimize, Eraser, History,
  CircleDot, CheckCircle
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '比赛记分牌 - 在线大字比分计分器（可撤销/全屏）',
  description: '免费在线比赛记分牌：双队大字比分 +1/−1 与 1/2/3 快捷步长，局分副计数，逐事件历史可撤销单步（快照栈），乒乓球11分/排球25分/羽毛球21分局点提示与发球方标记，全屏投影与复制战报，localStorage 本地保存零上传',
  keywords: '比赛记分牌,在线计分器,比分牌,乒乓球计分,排球计分,羽毛球计分,篮球比分,记分板,全屏记分',
  author: '有条工具',
  ogTitle: '比赛记分牌 - 大字比分可撤销可全屏 | 有条工具',
  ogDescription: '双队大字记分：快捷步长、逐事件撤销、发球标记、局点提示条、全屏投影与战报复制。',
  ogUrl: 'https://www.util.cn/tools/scoreboard-counter',
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
          name: '比赛记分牌',
          url: 'https://www.util.cn/tools/scoreboard-counter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['双队大字比分，+1/−1 与 1/2/3 分快捷步长', '局分/盘分副计数', '逐事件历史可撤销单步（快照栈实现）', '发球方标记：乒乓每2分轮发、10平后每1分，排球/羽毛球得分方发球', '局点/局末提示条：乒乓11、排球25、羽毛球21（29平封顶30）', '全屏投影与复制文本战报', '重置二次确认，localStorage 本地保存刷新不丢', '本地运行零上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '比赛记分牌', item: 'https://www.util.cn/tools/scoreboard-counter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '局点提示条是什么逻辑？',
              acceptedAnswer: { '@type': 'Answer', text: '按所选规则实时判断：某队再得 1 分即赢下本局时提示局点（乒乓 10:8、羽毛球 20:19、排球 24:20），满足获胜条件时提示局末；乒乓 11 分、排球 25 分、羽毛球 21 分均需净胜 2 分，羽毛球 29 平封顶先到 30 者胜。' }
            },
            {
              '@type': 'Question',
              name: '发球方标记怎么轮转？',
              acceptedAnswer: { '@type': 'Answer', text: '乒乓球每 2 分换发、10 平后每 1 分换发；排球与羽毛球为每球得分制，得分方获得发球权；自由计分模式提供手动切换，也可整体关闭标记。' }
            },
            {
              '@type': 'Question',
              name: '撤销一步会恢复到什么状态？',
              acceptedAnswer: { '@type': 'Answer', text: '快照栈整体恢复：连按 +2、+3、−1 后撤销，比分精确回到 +2 之后的状态（比分、局分、发球方一起恢复），不是简单地把上一步反加回来。' }
            },
            {
              '@type': 'Question',
              name: '数据会丢吗？会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '保存在本机浏览器 localStorage，刷新自动恢复；重置需二次确认；全部数据不出设备。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== TESTABLE-BEGIN: 记分牌纯逻辑（reducer + 快照栈撤销 + 发球轮转 + 局点判定，可独立单测） =====
// 计分规则表（通行口径：ITTF/FIVB/BWF；cap=0 表示不封顶）
const SB_RULES = [
  { id: 'pingpong', label: '乒乓 11 分', target: 11, cap: 0 },
  { id: 'volleyball', label: '排球 25 分', target: 25, cap: 0 },
  { id: 'badminton', label: '羽毛球 21 分', target: 21, cap: 30 },
  { id: 'none', label: '自由计分', target: 0, cap: 0 }
]
function sbRuleOf(id) {
  return SB_RULES.find((r) => r.id === id) || SB_RULES[3]
}

// 初始状态（纯对象，页面用 reactive 包裹）
function sbCreateState() {
  return { scoreA: 0, scoreB: 0, gamesA: 0, gamesB: 0, serving: 0, log: [], past: [] }
}

// 快照：撤销以整状态恢复（比分+局分+发球方），避免"反加回来"在 0 下限截断时出错
function sbSnapshot(state) {
  return { scoreA: state.scoreA, scoreB: state.scoreB, gamesA: state.gamesA, gamesB: state.gamesB, serving: state.serving }
}
function sbPushPast(state) {
  const past = state.past.concat([sbSnapshot(state)])
  return { ...state, past: past.slice(-200) }
}

// 时间格式（历史列表展示用）
function sbFormatTime(ts) {
  const d = new Date(ts)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

// 记分：side 0=主队 1=客队；delta 可为 1/2/3/-1；rule 用于发球自动轮转
function sbApplyScore(state, side, delta, ruleId, ts) {
  const key = side === 0 ? 'scoreA' : 'scoreB'
  const name = side === 0 ? '主队' : '客队'
  let next = sbPushPast(state)
  next = { ...next, [key]: Math.max(0, next[key] + delta) }
  // 发球自动轮转（仅正分触发；−1 修正不动发球权）
  if (delta > 0 && ruleId) {
    if (ruleId === 'volleyball' || ruleId === 'badminton') {
      next = { ...next, serving: side } // 每球得分制：谁得分谁发球
    } else if (ruleId === 'pingpong') {
      next = { ...next, serving: sbPingpongServe(next.scoreA, next.scoreB, 0) }
    }
  }
  const log = [{ text: `${name} ${delta > 0 ? '+' : ''}${delta} → ${next.scoreA}:${next.scoreB}`, ts }, ...state.log].slice(0, 50)
  return { ...next, log }
}

// 局分增减（同样入快照栈）
function sbApplyGames(state, side, delta, ts) {
  const key = side === 0 ? 'gamesA' : 'gamesB'
  const name = side === 0 ? '主队' : '客队'
  let next = sbPushPast(state)
  next = { ...next, [key]: Math.max(0, next[key] + delta) }
  const log = [{ text: `${name} 局分${delta > 0 ? '+' : ''}${delta} → 局分 ${next.gamesA}:${next.gamesB}`, ts }, ...state.log].slice(0, 50)
  return { ...next, log }
}

// 手动切发球（自由计分/纠正用）
function sbFlipServe(state, ts) {
  let next = sbPushPast(state)
  next = { ...next, serving: 1 - next.serving }
  const log = [{ text: `发球权 → ${next.serving === 0 ? '主队' : '客队'}`, ts }, ...state.log].slice(0, 50)
  return { ...next, log }
}

// 撤销一步：弹出最近快照整体恢复，并移除对应最新一条日志
function sbUndo(state) {
  if (!state.past.length) return state
  const prev = state.past[state.past.length - 1]
  return { ...state, ...prev, past: state.past.slice(0, -1), log: state.log.slice(1) }
}

// 乒乓球发球轮转：每 2 分换发，双方均 ≥10 后每 1 分换发（firstServer 为 0/1）
function sbPingpongServe(a, b, firstServer) {
  const every = a >= 10 && b >= 10 ? 1 : 2
  return (firstServer + Math.floor((a + b) / every)) % 2
}

// 单局是否已由 s 胜出（对 o）：target 分 + 净胜 2；badminton 29 平封顶 30:29
function sbSetWon(s, o, rule) {
  if (!rule.target) return false
  if (rule.cap && s === rule.cap && o === rule.cap - 1) return true
  return s >= rule.target && s - o >= 2
}

// 局面状态：over/winner/gamePoint（0 主队 1 客队 2 双局点 -1 无）
function sbStatus(a, b, ruleId) {
  const rule = sbRuleOf(ruleId)
  if (!rule.target) return { over: false, winner: -1, gamePoint: -1 }
  const winA = sbSetWon(a, b, rule)
  const winB = sbSetWon(b, a, rule)
  if (winA) return { over: true, winner: 0, gamePoint: -1 }
  if (winB) return { over: true, winner: 1, gamePoint: -1 }
  const nextA = sbSetWon(a + 1, b, rule)
  const nextB = sbSetWon(b + 1, a, rule)
  const gp = nextA && nextB ? 2 : nextA ? 0 : nextB ? 1 : -1
  return { over: false, winner: -1, gamePoint: gp }
}

// 战报文本：主队 X:Y 客队（局分 a:b）
function sbReportText(state, nameA, nameB) {
  return `${nameA} ${state.scoreA}:${state.scoreB} ${nameB}（局分 ${state.gamesA}:${state.gamesB}）`
}
// ===== TESTABLE-END =====

// ---------- 页面状态 ----------
const STORAGE_KEY = 'scoreboard-counter-state-v1'
const PERSIST_LOG = 20
const PERSIST_PAST = 60

const nameA = ref('主队')
const nameB = ref('客队')
const ruleId = ref('pingpong')
const serveOn = ref(true)
const fullscreen = ref(false)
const state = reactive(sbCreateState())

const ruleLabel = computed(() => sbRuleOf(ruleId.value).label)
const status = computed(() => sbStatus(state.scoreA, state.scoreB, ruleId.value))
const canUndo = computed(() => state.past.length > 0)

const noticeText = computed(() => {
  const s = status.value
  if (!sbRuleOf(ruleId.value).target) return ''
  const a = nameA.value || '主队'
  const b = nameB.value || '客队'
  if (s.over) {
    const w = s.winner === 0 ? a : b
    const l = s.winner === 0 ? b : a
    return `${w} ${Math.max(state.scoreA, state.scoreB)}:${Math.min(state.scoreA, state.scoreB)} 赢下本局，记得给 ${w} 局分 +1（对手 ${l}）`
  }
  if (s.gamePoint === 0) return `局点：${a} ${state.scoreA}:${state.scoreB}，再得 1 分即赢下本局`
  if (s.gamePoint === 1) return `局点：${b} ${state.scoreB}:${state.scoreA}，再得 1 分即赢下本局`
  if (s.gamePoint === 2) return `双局点：${state.scoreA}:${state.scoreB}，下一分定胜负`
  return ''
})

// ---------- 动作 ----------
function nowTs() {
  return Date.now()
}

function addScore(side, delta) {
  const next = sbApplyScore({ ...state }, side, delta, serveOn.value ? ruleId.value : '', nowTs())
  Object.assign(state, next)
}

function changeGame(side, delta) {
  const next = sbApplyGames({ ...state }, side, delta, nowTs())
  Object.assign(state, next)
}

function flipServe() {
  const next = sbFlipServe({ ...state }, nowTs())
  Object.assign(state, next)
}

function undoLast() {
  const next = sbUndo({ ...state })
  Object.assign(state, next)
}

function resetAll() {
  if (!window.confirm('确定清空比分、局分与历史记录吗？此操作不可恢复（二次确认）。')) return
  Object.assign(state, sbCreateState())
  persist()
  alert('已重置：比分、局分与历史已清空。')
}

async function copyReport() {
  const text = sbReportText(state, nameA.value || '主队', nameB.value || '客队')
  try {
    await navigator.clipboard.writeText(text)
    alert(`战报已复制：\n${text}`)
  } catch {
    alert(`复制失败（浏览器未授权剪贴板），战报文本：\n${text}`)
  }
}

// ---------- 全屏投影（fixed overlay + 可选系统全屏，均 try/catch 兜底） ----------
function enterFullscreen() {
  fullscreen.value = true
  try {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => { /* 拒绝/不支持时仅保留 overlay */ })
    }
  } catch { /* 忽略 */ }
}

function exitFullscreen() {
  fullscreen.value = false
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {})
    }
  } catch { /* 忽略 */ }
}

function handleFsKey(e) {
  if (e.key === 'Escape' && fullscreen.value) exitFullscreen()
}

// ---------- localStorage 持久化（刷新不丢，try/catch 兜底） ----------
function persist() {
  try {
    const data = {
      nameA: nameA.value,
      nameB: nameB.value,
      ruleId: ruleId.value,
      serveOn: serveOn.value,
      scoreA: state.scoreA,
      scoreB: state.scoreB,
      gamesA: state.gamesA,
      gamesB: state.gamesB,
      serving: state.serving,
      log: state.log.slice(0, PERSIST_LOG),
      past: state.past.slice(-PERSIST_PAST)
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* 隐私模式/配额满时静默忽略 */ }
}

function restore() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const d = JSON.parse(raw)
    if (!d || typeof d !== 'object') return
    if (typeof d.nameA === 'string') nameA.value = d.nameA
    if (typeof d.nameB === 'string') nameB.value = d.nameB
    if (SB_RULES.some((r) => r.id === d.ruleId)) ruleId.value = d.ruleId
    if (typeof d.serveOn === 'boolean') serveOn.value = d.serveOn
    state.scoreA = Number(d.scoreA) >= 0 ? Number(d.scoreA) : 0
    state.scoreB = Number(d.scoreB) >= 0 ? Number(d.scoreB) : 0
    state.gamesA = Number(d.gamesA) >= 0 ? Number(d.gamesA) : 0
    state.gamesB = Number(d.gamesB) >= 0 ? Number(d.gamesB) : 0
    state.serving = d.serving === 1 ? 1 : 0
    if (Array.isArray(d.log)) state.log = d.log.filter((e) => e && typeof e.text === 'string').slice(0, PERSIST_LOG)
    if (Array.isArray(d.past)) state.past = d.past.filter((p) => p && typeof p === 'object').slice(-PERSIST_PAST)
  } catch { /* 数据损坏时忽略 */ }
}

watch([nameA, nameB, ruleId, serveOn, () => ({ ...state })], persist, { deep: true })

onMounted(() => {
  restore()
  window.addEventListener('keydown', handleFsKey)
  addRecentTool('scoreboard-counter')
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleFsKey)
  persist()
})
</script>

<style scoped>
details summary::-webkit-details-marker {
  display: none;
}
</style>
