<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Timer class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">在线棋钟</h1>
          <p class="text-sm text-muted-foreground mt-1">双面按键式对弈倒计时，Fischer 加秒与 Bronstein 延迟两种规则，键盘 A/L 按钟，超时判负提示音</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线棋钟工具：左右两块超大倒计时钟，点击自己一侧或按键盘 A / L 即"落子按钟"，己方时钟停止、对方时钟启动；
        时间规则支持 Fischer 加秒（每步走完固定加 x 秒）与 Bronstein 延迟（走完后加回 min(本步消耗, x)，
        快走不赚时、总时间永不增长——口径以通行规则为准并已在页面内说明）；预设 1+0 / 3+2 / 5+0 / 10+5 / 15+10，
        也可自定义分秒。计时引擎用 Date.now() 真实时间差整段反推而非 setInterval 逐步递减，切后台、卡顿都不累积漂移；
        一方归零即超时判负（徽章 + 长鸣提示音），走子哒声可选。状态机 idle → armed（白先行）→ running → paused / finished，全部本地运行。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：规则设置面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Info class="w-5 h-5 mr-2 text-primary" /> 时间规则
        </h2>

        <!-- 预设 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">时间控制预设（分钟 + 加秒）</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="p in TIME_PRESETS"
              :key="p.label"
              @click="applyPreset(p)"
              :disabled="configLocked"
              class="px-2 py-2.5 rounded-lg border text-sm font-semibold font-mono transition disabled:opacity-50 disabled:cursor-not-allowed"
              :class="presetActive(p) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-foreground hover:bg-muted/80'"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <!-- 自定义 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">自定义（分钟 1-180 / 加秒 0-600）</p>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label for="cfg-min" class="text-xs text-muted-foreground">基础时间（分钟）</label>
              <input
                id="cfg-min"
                v-model.number="cfgMinutes"
                type="number"
                min="1" max="180" step="1"
                :disabled="configLocked"
                class="w-full h-10 px-2.5 border border-border bg-background rounded-lg text-sm font-bold text-foreground font-mono text-center disabled:opacity-50"
                @change="normalizeCfg"
              />
            </div>
            <div class="space-y-1">
              <label for="cfg-inc" class="text-xs text-muted-foreground">加秒/延迟 x（秒）</label>
              <input
                id="cfg-inc"
                v-model.number="cfgInc"
                type="number"
                min="0" max="600" step="1"
                :disabled="configLocked"
                class="w-full h-10 px-2.5 border border-border bg-background rounded-lg text-sm font-bold text-foreground font-mono text-center disabled:opacity-50"
                @change="normalizeCfg"
              />
            </div>
          </div>
        </div>

        <!-- 增时模式 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">增时模式</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="cfgMode = 'fischer'"
              :disabled="configLocked"
              class="px-3 py-2.5 rounded-lg border text-sm font-medium transition disabled:opacity-50"
              :class="cfgMode === 'fischer' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/80'"
            >
              Fischer 加秒
            </button>
            <button
              @click="cfgMode = 'bronstein'"
              :disabled="configLocked"
              class="px-3 py-2.5 rounded-lg border text-sm font-medium transition disabled:opacity-50"
              :class="cfgMode === 'bronstein' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/80'"
            >
              Bronstein 延迟
            </button>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            {{ MODE_HINT[cfgMode] }}
          </p>
        </div>

        <!-- 声效 -->
        <button
          @click="soundOn = !soundOn"
          class="w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition flex items-center justify-center gap-2"
          :class="soundOn ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted border-border text-muted-foreground'"
          :aria-pressed="soundOn"
        >
          <Volume2 v-if="soundOn" class="w-4 h-4" />
          <VolumeX v-else class="w-4 h-4" />
          声效：{{ soundOn ? '开（走子哒声 + 超时长鸣）' : '关' }}
        </button>

        <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
          <Keyboard class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>键位：<span class="font-mono font-semibold text-foreground">A</span> = 按左侧钟（白方落子），<span class="font-mono font-semibold text-foreground">L</span> = 按右侧钟（黑方落子）；也可以直接点击对应时钟。开局后白方先行：先按 A 启动白方计时。</span>
        </p>
      </div>

      <!-- 右：双面大钟 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Timer class="w-5 h-5 mr-2 text-primary" /> 对局时钟
          </h2>
          <span
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium"
            :class="PHASE_META[phase].cls"
          >
            <component :is="PHASE_META[phase].icon" class="w-3.5 h-3.5" />
            {{ PHASE_META[phase].label }}
          </span>
        </div>

        <!-- 双面时钟 -->
        <div class="grid grid-cols-2 gap-4 select-none">
          <!-- 左：白方 -->
          <button
            @click="press(0)"
            class="relative rounded-xl border-2 p-6 text-center transition-colors duration-200 focus:outline-none"
            :class="sideClass(0)"
            :aria-label="'白方时钟：' + clockTextOf(0)"
          >
            <span class="block text-sm font-semibold tracking-widest mb-2">白方 · 左（A）</span>
            <span class="block text-5xl sm:text-7xl font-bold font-mono tabular-nums leading-none">{{ clockTextOf(0) }}</span>
            <span class="block text-xs mt-3 opacity-80">+{{ cfgInc }}s 每步 · {{ cfgMode === 'fischer' ? 'Fischer' : 'Bronstein' }}</span>
            <span
              v-if="phase === 'running' && active === 0"
              class="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-500 animate-pulse"
              aria-hidden="true"
            ></span>
            <span
              v-if="phase === 'armed'"
              class="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600"
            >先行</span>
          </button>

          <!-- 右：黑方 -->
          <button
            @click="press(1)"
            class="relative rounded-xl border-2 p-6 text-center transition-colors duration-200 focus:outline-none"
            :class="sideClass(1)"
            :aria-label="'黑方时钟：' + clockTextOf(1)"
          >
            <span class="block text-sm font-semibold tracking-widest mb-2">黑方 · 右（L）</span>
            <span class="block text-5xl sm:text-7xl font-bold font-mono tabular-nums leading-none">{{ clockTextOf(1) }}</span>
            <span class="block text-xs mt-3 opacity-80">+{{ cfgInc }}s 每步 · {{ cfgMode === 'fischer' ? 'Fischer' : 'Bronstein' }}</span>
            <span
              v-if="phase === 'running' && active === 1"
              class="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-500 animate-pulse"
              aria-hidden="true"
            ></span>
          </button>
        </div>

        <!-- 超时判负徽章 -->
        <div
          v-if="phase === 'finished'"
          class="rounded-xl border-2 border-red-500/50 bg-red-500/10 p-4 text-center"
        >
          <p class="text-lg font-bold text-red-600 flex items-center justify-center gap-2">
            <Flag class="w-5 h-5" />
            {{ timeoutSide === 0 ? '白方超时，黑方胜' : '黑方超时，白方胜' }}
          </p>
          <p class="text-xs text-muted-foreground mt-1">棋钟归零即超时判负（时间不足以完成任何一步）。点「重置」再开一盘。</p>
        </div>

        <!-- 操作 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            @click="startGame"
            :disabled="phase === 'running' || phase === 'paused' || phase === 'armed'"
            class="px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play class="w-4 h-4" /> 开始对局
          </button>
          <button
            @click="togglePause"
            :disabled="phase !== 'running' && phase !== 'paused'"
            class="px-4 py-3 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Pause v-if="phase === 'running'" class="w-4 h-4" />
            <Play v-else class="w-4 h-4" />
            {{ phase === 'paused' ? '继续' : '暂停' }}
          </button>
          <button
            @click="resetGame"
            :disabled="phase === 'idle'"
            class="px-4 py-3 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw class="w-4 h-4" /> 重置
          </button>
          <div class="px-4 py-3 rounded-lg bg-muted/50 border border-border flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
            {{ cfgMinutes }}min + {{ cfgInc }}s
          </div>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          状态机：未开始 → 就绪（白先行，按 A 启动白方计时）→ 计时中（按钟换边）→ 暂停 / 已结束。
          点击「自己一侧」表示落子完成：己方时钟停、加秒按规则入账、对方时钟立刻启动。
          计时以 Date.now() 真实时间差反推，浏览器切后台再回来时间仍然准确。
        </p>

        <p v-if="audioError" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ audioError }}</span>
        </p>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12 group">
      <summary class="text-base font-semibold flex items-center cursor-pointer select-none text-muted-foreground">
        <Info class="w-4 h-4 mr-2 text-primary" /> 棋钟规则说明与常见问题（点击展开）
      </summary>

      <h2 class="text-2xl font-bold text-foreground mt-4 mb-4"><span class="text-primary mr-2">#</span>Fischer 加秒 vs Bronstein 延迟：差在哪？</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div class="bg-muted/50 rounded-xl p-4">
          <h3 class="text-sm font-bold text-foreground mb-2">Fischer 增时（Increment / Bonus）</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            每走完一步，固定把 x 秒加回自己的主时间：新剩余 = 原剩余 − 本步消耗 + x。
            快走会"攒时间"（消耗 &lt; x 时钟面净增长），慢走多消耗多少就少多少。由前世界冠军 Bobby Fischer 发明并申请专利（1988），
            是当今大多数比赛与线上对弈的主流规则。举例 3+2：剩余 3:00 花了 1:00 走一步 → 2:00 + 2s = 2:02。
          </p>
        </div>
        <div class="bg-muted/50 rounded-xl p-4">
          <h3 class="text-sm font-bold text-foreground mb-2">Bronstein 延迟（Bronstein Delay）</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            走完后加回「本步消耗与 x 取小者」：新剩余 = 原剩余 − 本步消耗 + min(本步消耗, x)。
            消耗 ≥ x 时等价于 Fischer；消耗 &lt; x 时只加回实际消耗（快走净消耗为 0），
            所以主时间永远不可能超过初始值。由特级大师 David Bronstein 发明，与美式 Simple delay 数学上等价
            （FIDE 规则中两者可互换）。举例 3+2：同样花 1:00 → 2:00 + 2s = 2:02；
            花 1 秒 → 3:00−1s+1s = 3:00（Fischer 则是 3:01）。
          </p>
        </div>
      </div>
      <p class="text-xs text-muted-foreground leading-relaxed mb-4">
        口径说明：两种规则的本工具实现以通行定义为准（Fischer 固定加 x；Bronstein 加回 min(消耗, x)），
        与 Wikipedia《Chess clock》词条及主流棋钟厂商说明一致。另注：FIDE 正式规则会把加秒预加到第一步之前
        （3+2 开局即为 3:02）；本工具从主时间 3:00 起算、走完第一步后才加秒，更贴近休闲对弈的直观口径。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">时间控制术语速查</h3>
      <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
        <li><span class="font-semibold text-foreground">Bullet 子弹棋</span>：全盘约 1 分钟以内（如 1+0），拼手速与直觉。</li>
        <li><span class="font-semibold text-foreground">Blitz 超快棋</span>：全盘 3-10 分钟（如 3+2、5+0），FIDE 口径为每方初时少于 10 分钟。</li>
        <li><span class="font-semibold text-foreground">Rapid 快棋</span>：每方初时 10-60 分钟（如 10+5、15+10）。</li>
        <li><span class="font-semibold text-foreground">Classical 慢棋</span>：每方 60 分钟以上，通常按「X 步 / Y 分钟」分段控制。</li>
        <li><span class="font-semibold text-foreground">Sudden death 突然死亡</span>：无加秒无延迟，时间用完即负；是最简单也最残酷的控制方式。</li>
      </ul>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么本棋钟不会"越走越慢"？</h3>
      <p class="text-sm text-muted-foreground leading-relaxed mb-4">
        很多网页倒计时用 setInterval 每秒「remaining -= 1」：后台标签页的定时器会被浏览器节流到每分钟几十次甚至更少，
        每次少减的秒数都是永久误差，一盘 15 分钟的棋能慢出几十秒。本工具只在按键瞬间用 Date.now() 的真实时间差
        整段反推消耗（消耗 = 按钟时刻 − 本步起点），轮询定时器只负责刷新显示与超时检测，不参与时间累计；
        因此切后台、锁屏、电脑卡顿都不会让钟面失真，恢复前台后第一帧就校正到正确时间。
      </p>

      <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-semibold text-foreground">怎么"按钟"？</h3>
          <p class="text-sm text-muted-foreground mt-1">点击自己那一侧的时钟，或按键盘 A（左/白方）、L（右/黑方）。走完棋再按钟——按钟后己方计时停止，对方时钟立即开始；开局后必须先按 A 启动白方计时（白先行）。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">一方时间用完了怎么办？</h3>
          <p class="text-sm text-muted-foreground mt-1">按通行规则超时判负：钟面归零的一方直接输掉本局，页面会显示"超时判负"徽章并（开启声效时）长鸣一声提示。超时方的剩余时间按 0 记。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">Bronstein 模式下我的时间会越下越多吗？</h3>
          <p class="text-sm text-muted-foreground mt-1">不会。Bronstein 只加回 min(本步消耗, x)，快走最多保本、慢走必亏，主时间永远不会超过开局值；想要"快走攒时间"的效果请用 Fischer 模式。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">可以给象棋、围棋用吗？</h3>
          <p class="text-sm text-muted-foreground mt-1">可以。棋钟本身只管轮换计时，不限棋种：中国象棋、围棋、国际跳棋等双方轮流行棋的游戏都能用；包干制（无加秒）把加秒设为 0 即可。</p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'chess-clock-online'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Timer, Play, Pause, RotateCcw, Volume2, VolumeX, Keyboard,
  Info, Flag, CheckCircle, TriangleAlert, Clock
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '在线棋钟 - 双人按键倒计时（Fischer加秒/Bronstein延迟）',
  description: '免费在线棋钟：双面大字倒计时，点击或按键盘 A/L 按钟换边，Fischer 加秒与 Bronstein 延迟两种规则，预设 1+0/3+2/5+0/10+5/15+10 可自定义，Date.now 差值计时切后台不漂移，超时判负徽章与 WebAudio 提示音，本地运行零上传',
  keywords: '在线棋钟,棋钟,国际象棋计时器,象棋计时,下棋计时器,加秒棋钟,Fischer increment,Bronstein delay,超快棋计时',
  author: '有条工具',
  ogTitle: '在线棋钟 - 双面按键式对弈倒计时 | 有条工具',
  ogDescription: 'Fischer 加秒与 Bronstein 延迟双规则，A/L 键盘按钟，超时判负提示音，计时切后台不漂移。',
  ogUrl: 'https://www.util.cn/tools/chess-clock-online',
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
          name: '在线棋钟',
          url: 'https://www.util.cn/tools/chess-clock-online',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['双面大字时钟，点击自己一侧或按 A/L 键按钟换边', 'Fischer 加秒：每步走完固定加 x 秒', 'Bronstein 延迟：加回 min(本步消耗, x)，总时间永不增长', '预设 1+0 / 3+2 / 5+0 / 10+5 / 15+10 与自定义分钟+加秒', 'Date.now 差值计时，后台节流不漂移', '超时判负徽章与长鸣提示音，走子哒声可选', '暂停/继续/重置与白先行状态机', '本地运行零上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '在线棋钟', item: 'https://www.util.cn/tools/chess-clock-online/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Fischer 加秒和 Bronstein 延迟有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'Fischer 每步走完固定加 x 秒，快走能攒时间；Bronstein 加回 min(本步消耗, x)，快走最多保本，主时间永远不会超过开局值。消耗超过 x 的慢步两者完全等价。' }
            },
            {
              '@type': 'Question',
              name: '怎么按钟？',
              acceptedAnswer: { '@type': 'Answer', text: '点击自己一侧的时钟或按键盘 A（左/白方）、L（右/黑方）：己方计时停止、加秒入账、对方时钟立刻开始。开局后先按 A 启动白方计时。' }
            },
            {
              '@type': 'Question',
              name: '时间用完了怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '按通行规则超时判负：归零一方直接输掉本局，页面显示超时判负徽章并长鸣提示（声效开启时）。' }
            },
            {
              '@type': 'Question',
              name: '切到后台时间还准吗？',
              acceptedAnswer: { '@type': 'Answer', text: '准。计时用 Date.now() 真实时间差整段反推消耗，轮询定时器只刷新显示不参与累计，后台节流不会造成漂移。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== TESTABLE-BEGIN: 棋钟纯逻辑（增时规则 + 时钟格式化 + 配置收敛，可独立单测） =====
// 时间控制预设（label = 分钟+加秒 的通行写法）
const CC_PRESETS = [
  { label: '1+0', minutes: 1, inc: 0 },
  { label: '3+2', minutes: 3, inc: 2 },
  { label: '5+0', minutes: 5, inc: 0 },
  { label: '10+5', minutes: 10, inc: 5 },
  { label: '15+10', minutes: 15, inc: 10 }
]

// 增时口径（以通行规则为准）：
// - Fischer：每步固定加 x 秒；
// - Bronstein：加回 min(本步消耗, x)——快走不赚时、总时间永不增长（与美式 Simple delay 数学等价）。
function ccCredit(mode, consumedMs, incMs) {
  const inc = Math.max(0, Math.round(incMs))
  if (mode === 'bronstein') return Math.min(Math.max(0, Math.round(consumedMs)), inc)
  return inc
}

// 走完一步后的结算：消耗按真实时间差计算；若本步内已超时（消耗 ≥ 剩余），返回 flag 并把剩余记 0（超时判负，不加秒）
function ccAfterMove(remMs, consumedMs, mode, incMs) {
  const flag = consumedMs >= remMs
  if (flag) return { rem: 0, flag: true, bonus: 0 }
  const bonus = ccCredit(mode, consumedMs, incMs)
  return { rem: Math.round(remMs) - Math.round(consumedMs) + bonus, flag: false, bonus }
}

// 钟面格式：≥20s 显示 m:ss（向下取整，避免提前归零感）；<20s 显示 m:ss.t（十分之一秒，真实棋钟口径）
function ccFormatClock(ms) {
  const v = Math.max(0, Number(ms) || 0)
  const totalSec = Math.floor(v / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (v < 20000) {
    const t = Math.floor((v % 1000) / 100)
    return `${m}:${String(s).padStart(2, '0')}.${t}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

// 配置收敛：分钟 1-180、加秒 0-600，非法回落默认（3 分钟 / 2 秒）
function ccNormalizeCfg(minutes, inc) {
  const clamp = (v, min, max, fb) => {
    const n = Math.round(Number(v))
    if (!Number.isFinite(n)) return fb
    return Math.min(max, Math.max(min, n))
  }
  return { minutes: clamp(minutes, 1, 180, 3), inc: clamp(inc, 0, 600, 2) }
}

// 初始钟面（本工具口径：从主时间起算；FIDE 正式规则的首步预加增时在页面说明中注明）
function ccInitialMs(minutes) {
  return ccNormalizeCfg(minutes, 0).minutes * 60000
}

// 状态机合法迁移：idle→armed→running→paused/finished；armed 仅白方（0）可启动
function ccCanPress(phase, side) {
  if (phase === 'armed') return side === 0
  return phase === 'running'
}
// ===== TESTABLE-END =====

// ---------- 模式说明（静态表） ----------
const MODE_HINT = {
  fischer: 'Fischer 加秒：走完一步固定 +x 秒，快走可以攒时间，线上对弈与多数比赛的主流规则。',
  bronstein: 'Bronstein 延迟：走完加回 min(本步消耗, x)，快走最多保本，主时间永不超过开局值（以通行规则为准）。'
}

const PHASE_META = {
  idle: { label: '未开始', cls: 'bg-muted border-border text-muted-foreground', icon: Clock },
  armed: { label: '就绪 · 白先行', cls: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400', icon: Flag },
  running: { label: '计时中', cls: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400', icon: CheckCircle },
  paused: { label: '已暂停', cls: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400', icon: Clock },
  finished: { label: '已结束', cls: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400', icon: Flag }
}

// ---------- 页面状态 ----------
const cfgMinutes = ref(3)
const cfgInc = ref(2)
const cfgMode = ref('fischer')
const soundOn = ref(true)
const audioError = ref('')

const phase = ref('idle') // idle | armed | running | paused | finished
const active = ref(0)     // 0 = 左/白，1 = 右/黑
const baseMs = ref([180000, 180000]) // 各侧"本步起点"剩余
const turnStart = ref(0)  // 本步开始的真实时刻 Date.now()
const nowTick = ref(0)    // 轮询刷新的时间戳（仅显示用）
const timeoutSide = ref(-1)

const configLocked = computed(() => phase.value !== 'idle')

function normalizeCfg() {
  const c = ccNormalizeCfg(cfgMinutes.value, cfgInc.value)
  cfgMinutes.value = c.minutes
  cfgInc.value = c.inc
}

function presetActive(p) {
  return Number(cfgMinutes.value) === p.minutes && Number(cfgInc.value) === p.inc
}

function applyPreset(p) {
  if (configLocked.value) return
  cfgMinutes.value = p.minutes
  cfgInc.value = p.inc
  normalizeCfg()
}

// 时钟显示：运行方用真实时间差反推，其余用冻结值
function clockTextOf(side) {
  if (phase.value === 'running' && side === active.value) {
    return ccFormatClock(baseMs.value[side] - (nowTick.value - turnStart.value))
  }
  if (phase.value === 'paused' && side === active.value) {
    return ccFormatClock(baseMs.value[side])
  }
  return ccFormatClock(baseMs.value[side])
}

function sideClass(side) {
  const isActive = (phase.value === 'running' || phase.value === 'armed') && active.value === side
  if (phase.value === 'finished' && timeoutSide.value === side) {
    return 'border-red-500/60 bg-red-500/10 text-red-600 dark:text-red-400'
  }
  return isActive
    ? 'border-primary bg-primary/10 text-foreground shadow-[0_0_24px_rgba(0,0,0,0.06)]'
    : 'border-border bg-muted/30 text-muted-foreground opacity-70'
}

// ---------- 计时引擎：Date.now() 差值反推，杜绝 setInterval 递减漂移 ----------
let tickTimer = null
const TICK_MS = 100

function startTick() {
  if (tickTimer === null) tickTimer = setInterval(onTick, TICK_MS)
}
function stopTick() {
  if (tickTimer !== null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

function onTick() {
  if (phase.value !== 'running') return
  nowTick.value = Date.now()
  const rem = baseMs.value[active.value] - (nowTick.value - turnStart.value)
  if (rem <= 0) {
    // 超时判负：真实时间已越过零点
    baseMs.value[active.value] = 0
    timeoutSide.value = active.value
    phase.value = 'finished'
    stopTick()
    playTimeoutBeep()
  }
}

// ---------- 状态机动作 ----------
function startGame() {
  if (phase.value === 'running' || phase.value === 'paused' || phase.value === 'armed') return
  normalizeCfg()
  const ms = cfgMinutes.value * 60000
  baseMs.value = [ms, ms]
  active.value = 0
  timeoutSide.value = -1
  turnStart.value = 0
  nowTick.value = 0
  phase.value = 'armed'
}

function press(side) {
  if (!ccCanPress(phase.value, side)) return
  if (phase.value === 'armed') {
    // 白先行：首次按 A 启动白方计时
    turnStart.value = Date.now()
    nowTick.value = turnStart.value
    phase.value = 'running'
    startTick()
    playMoveClick()
    return
  }
  if (side !== active.value) return // 只能按自己的钟
  const consumed = Date.now() - turnStart.value
  const r = ccAfterMove(baseMs.value[active.value], consumed, cfgMode.value, cfgInc.value * 1000)
  baseMs.value[active.value] = r.rem
  active.value = 1 - active.value
  turnStart.value = Date.now()
  nowTick.value = turnStart.value
  playMoveClick()
}

function togglePause() {
  if (phase.value === 'running') {
    baseMs.value[active.value] = baseMs.value[active.value] - (Date.now() - turnStart.value)
    phase.value = 'paused'
    stopTick()
  } else if (phase.value === 'paused') {
    turnStart.value = Date.now()
    nowTick.value = turnStart.value
    phase.value = 'running'
    startTick()
  }
}

function resetGame() {
  stopTick()
  phase.value = 'idle'
  active.value = 0
  timeoutSide.value = -1
  turnStart.value = 0
  nowTick.value = 0
  baseMs.value = [cfgMinutes.value * 60000, cfgMinutes.value * 60000]
}

// ---------- WebAudio（走子哒声 / 超时长鸣，仅用户回调与超时事件触发，SSR 安全） ----------
let audioCtx = null

function ensureAudio() {
  if (audioCtx) return audioCtx
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  audioCtx = new Ctx()
  return audioCtx
}

function beepAt(freq, durSec, peak, type = 'sine') {
  if (!audioCtx || !soundOn.value) return
  const t = audioCtx.currentTime + 0.02
  const osc = audioCtx.createOscillator()
  const env = audioCtx.createGain()
  osc.type = type
  osc.frequency.value = freq
  env.gain.setValueAtTime(0.001, t)
  env.gain.exponentialRampToValueAtTime(Math.max(0.002, peak), t + 0.008)
  env.gain.exponentialRampToValueAtTime(0.001, t + durSec)
  osc.connect(env)
  env.connect(audioCtx.destination)
  osc.start(t)
  osc.stop(t + durSec + 0.05)
}

function playMoveClick() {
  if (!soundOn.value) return
  if (!ensureAudio()) {
    audioError.value = '当前浏览器不支持 WebAudio，走子提示音不可用；计时不受影响。'
    return
  }
  audioError.value = ''
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
  beepAt(660, 0.045, 0.35, 'square')
}

function playTimeoutBeep() {
  if (!soundOn.value || !audioCtx) return
  beepAt(880, 1.1, 0.5, 'sine')
}

// ---------- 键盘按钟（A = 左/白，L = 右/黑） ----------
function handleKeydown(e) {
  if (e.repeat) return
  const tag = (e.target && e.target.tagName) || ''
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
  const k = (e.key || '').toLowerCase()
  if (k === 'a') {
    e.preventDefault()
    press(0)
  } else if (k === 'l') {
    e.preventDefault()
    press(1)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  addRecentTool('chess-clock-online')
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  stopTick()
  if (audioCtx) {
    try { audioCtx.close() } catch { /* 已关闭则忽略 */ }
    audioCtx = null
  }
})
</script>

<style scoped>
details summary::-webkit-details-marker {
  display: none;
}
</style>
