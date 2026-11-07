<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Circle class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">台球计分器</h1>
          <p class="text-sm text-muted-foreground mt-1">中式黑八局分计分（开球权轮换/连胜记录）+ 斯诺克单杆得分（红球彩球规则、台上剩余分、斯诺克提示）双模式</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线台球计分器，两种模式：① 中式黑八——双方局分一键记胜、逐局历史（开球方与胜者）、开球权轮换提示
        （胜者开球 / 交替开球可配，乔氏标准为胜方开球制）、当前连胜与最长连胜记录；② 斯诺克——红(1)/黄2/绿3/棕4/蓝5/粉6/黑7
        单杆得分跟踪，合法击球按钮自动约束（红后必彩、红球打完按黄→黑顺序清彩），台上剩余分按"红球数×8+27"实时递减
        （15 红接黑全清 = 147 满分，页面逻辑可直接验证），落后方分差超过台上剩余分时显示"需做斯诺克"，
        犯规送 4-7 分换人。含撤销一杆、犯规简化口径说明，全部本地运行零上传。
      </p>
    </div>

    <!-- 模式切换 -->
    <div class="flex justify-center mb-6">
      <div class="inline-flex bg-muted border border-border rounded-lg p-1">
        <button
          @click="mode = 'black8'"
          class="px-6 py-2.5 rounded-md text-sm font-semibold transition"
          :class="mode === 'black8' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'"
        >
          中式黑八 · 局分
        </button>
        <button
          @click="mode = 'snooker'"
          class="px-6 py-2.5 rounded-md text-sm font-semibold transition"
          :class="mode === 'snooker' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'"
        >
          斯诺克 · 单杆得分
        </button>
      </div>
    </div>

    <!-- ============ 黑八模式 ============ -->
    <div v-if="mode === 'black8'" class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Info class="w-5 h-5 mr-2 text-primary" /> 黑八设置
        </h2>
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label for="b8-a" class="text-xs text-muted-foreground">甲方名称</label>
            <input id="b8-a" v-model="b8NameA" type="text" maxlength="10" placeholder="甲方" class="w-full h-10 px-2.5 border border-border bg-background rounded-lg text-sm text-foreground" />
          </div>
          <div class="space-y-1">
            <label for="b8-b" class="text-xs text-muted-foreground">乙方名称</label>
            <input id="b8-b" v-model="b8NameB" type="text" maxlength="10" placeholder="乙方" class="w-full h-10 px-2.5 border border-border bg-background rounded-lg text-sm text-foreground" />
          </div>
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">开球权规则</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="b8.mode = 'winner'"
              class="px-3 py-2.5 rounded-lg border text-sm font-medium transition"
              :class="b8.mode === 'winner' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/80'"
            >胜者开球</button>
            <button
              @click="b8.mode = 'alternate'"
              class="px-3 py-2.5 rounded-lg border text-sm font-medium transition"
              :class="b8.mode === 'alternate' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/80'"
            >交替开球</button>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            {{ b8.mode === 'winner' ? '胜者开球（乔氏杯中式八球标准规则）：谁赢下上一局，下一局就由谁开球。' : '交替开球：双方轮流开球，与胜负无关（部分赛事规程采用）。' }}
          </p>
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">首局开球方</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="b8.firstBreaker = 0; b8.breaker = 0"
              class="px-3 py-2 rounded-lg border text-sm font-medium transition"
              :class="b8.firstBreaker === 0 ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/80'"
            >{{ b8NameA || '甲方' }}</button>
            <button
              @click="b8.firstBreaker = 1; b8.breaker = 1"
              class="px-3 py-2 rounded-lg border text-sm font-medium transition"
              :class="b8.firstBreaker === 1 ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/80'"
            >{{ b8NameB || '乙方' }}</button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="b8Undo"
            :disabled="!b8.frames.length"
            class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Undo2 class="w-4 h-4" /> 撤销上一局
          </button>
          <button
            @click="b8Reset"
            class="px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-sm font-medium text-red-600 transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw class="w-4 h-4" /> 重置
          </button>
        </div>
      </div>

      <!-- 右：局分 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Trophy class="w-5 h-5 mr-2 text-primary" /> 局分
          </h2>
          <span class="text-xs text-muted-foreground">当前开球方：<span class="font-bold text-primary">{{ b8.breaker === 0 ? (b8NameA || '甲方') : (b8NameB || '乙方') }}</span></span>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="side in [0, 1]"
            :key="'b8-' + side"
            class="rounded-xl border p-5 text-center transition"
            :class="b8.breaker === side ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'"
          >
            <p class="text-sm font-semibold text-foreground truncate">{{ side === 0 ? (b8NameA || '甲方') : (b8NameB || '乙方') }}</p>
            <p class="text-7xl font-bold font-mono tabular-nums leading-none mt-2 text-foreground">{{ side === 0 ? b8.scores[0] : b8.scores[1] }}</p>
            <p class="text-xs text-muted-foreground mt-2">当前连胜 {{ b8StreaksView.current[side] }} · 最长连胜 {{ b8StreaksView.best[side] }}</p>
            <button
              @click="b8Win(side)"
              class="mt-4 w-full py-3 rounded-lg bg-primary text-primary-foreground text-base font-bold hover:opacity-90 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Medal class="w-4 h-4" /> 赢下此局
            </button>
          </div>
        </div>

        <!-- 逐局历史 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground flex items-center gap-1.5">
            <History class="w-4 h-4 text-primary" /> 逐局历史
          </p>
          <div v-if="b8.frames.length" class="max-h-44 overflow-y-auto space-y-1 pr-1">
            <div
              v-for="(f, i) in [...b8.frames].reverse()"
              :key="'frame-' + i"
              class="flex items-center justify-between px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs"
            >
              <span class="font-mono text-muted-foreground">第 {{ f.n }} 局</span>
              <span class="text-muted-foreground">开球：{{ f.breaker === 0 ? (b8NameA || '甲方') : (b8NameB || '乙方') }}</span>
              <span class="font-semibold text-foreground">胜者：{{ f.winner === 0 ? (b8NameA || '甲方') : (b8NameB || '乙方') }}</span>
            </div>
          </div>
          <p v-else class="text-xs text-muted-foreground">还没有记录：点「赢下此局」记第一局，开球权会按所选规则自动轮转。</p>
        </div>
      </div>
    </div>

    <!-- ============ 斯诺克模式 ============ -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：记分操作 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <CircleDot class="w-5 h-5 mr-2 text-primary" /> 击球记录
        </h2>

        <p class="text-xs text-muted-foreground leading-relaxed">
          当前击球方：<span class="font-bold text-primary">{{ snStrikerName }}</span>
          · 球权：{{ snBallOnText }}
        </p>

        <!-- 得分按钮 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">打进得分</p>
          <div class="grid grid-cols-4 gap-2">
            <button
              @click="snPot('red')"
              :disabled="sn.over || !snCanPot('red')"
              class="py-3 rounded-lg bg-red-600 text-white text-sm font-bold hover:opacity-90 transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >红 1</button>
            <button
              v-for="c in SN_COLOURS"
              :key="'ball-' + c.id"
              @click="snPot(c.id)"
              :disabled="sn.over || !snCanPot(c.id)"
              class="py-3 rounded-lg text-sm font-bold transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              :class="c.btn"
            >{{ c.label }} {{ c.v }}</button>
          </div>
          <p class="text-[10px] text-muted-foreground leading-relaxed">红后必彩（彩球重摆）；红球打完后按黄→绿→棕→蓝→粉→黑顺序清彩（不可跳序）。</p>
        </div>

        <!-- 犯规 / 换人 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">犯规（对方得 4-7 分并换人）</p>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="p in [4, 5, 6, 7]"
              :key="'foul-' + p"
              @click="snFoul(p)"
              :disabled="sn.over"
              class="py-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-bold hover:bg-amber-500/20 transition disabled:opacity-40"
            >+{{ p }}</button>
          </div>
          <button
            @click="snPass"
            :disabled="sn.over"
            class="w-full py-2.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-sm font-medium text-foreground transition disabled:opacity-40"
          >未进球，换对手击球</button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            @click="snUndo"
            :disabled="!snPast.length"
            class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Undo2 class="w-4 h-4" /> 撤销一杆
          </button>
          <button
            @click="snReset"
            class="px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-sm font-medium text-red-600 transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw class="w-4 h-4" /> 新一局
          </button>
        </div>

        <p v-if="snFoulMsg" class="text-xs leading-relaxed p-2 rounded bg-amber-500/10 text-amber-600 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ snFoulMsg }}</span>
        </p>
      </div>

      <!-- 右：面板 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <CircleDot class="w-5 h-5 mr-2 text-primary" /> 斯诺克面板
          </h2>
          <span class="text-xs text-muted-foreground font-mono">台上剩余 <span class="text-base font-bold text-foreground">{{ snRemainingView }}</span> 分 · 红球 {{ sn.redsLeft }} 颗</span>
        </div>

        <!-- 本局结束 -->
        <div v-if="sn.over" class="rounded-xl border-2 border-green-500/50 bg-green-500/10 p-4 text-center">
          <p class="text-lg font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
            <Flag class="w-5 h-5" /> 本局结束：{{ snWinnerText }}
          </p>
        </div>

        <!-- 双方得分 -->
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="side in [0, 1]"
            :key="'sn-' + side"
            class="rounded-xl border p-5 text-center transition"
            :class="sn.striker === side && !sn.over ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'"
          >
            <p class="text-sm font-semibold text-foreground truncate">{{ side === 0 ? (snNameA || '甲方') : (snNameB || '乙方') }}</p>
            <p class="text-6xl font-bold font-mono tabular-nums leading-none mt-2 text-foreground">{{ side === 0 ? sn.scoreA : sn.scoreB }}</p>
            <p class="text-xs text-muted-foreground mt-2">本杆 <span class="font-bold text-primary">{{ sn.striker === side ? sn.break : 0 }}</span> · 单杆最高 {{ side === 0 ? sn.bestA : sn.bestB }}</p>
            <p v-if="snSnookerText[side]" class="mt-2 inline-block px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold">{{ snSnookerText[side] }}</p>
          </div>
        </div>

        <!-- 剩余分构成 -->
        <div class="bg-muted/50 rounded-xl p-4 space-y-1.5 text-xs text-muted-foreground">
          <p>剩余分口径：红球在台 = 红球数 × 8 + 27（每颗红球 = 1 分 + 最好情况的彩球 7 分，彩球总和 27）。</p>
          <p>15 红全部接黑再清彩 = 15×(1+7) + 27 = <span class="font-bold text-foreground">147</span> 满分单杆；本面板从 0 开始即可完整验证 147。</p>
          <p v-if="!sn.redsLeft && !sn.afterRed && !sn.over">收彩阶段：下一颗必打 <span class="font-bold text-foreground">{{ snNextColourLabel }}</span>。</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12 group">
      <summary class="text-base font-semibold flex items-center cursor-pointer select-none text-muted-foreground">
        <Info class="w-4 h-4 mr-2 text-primary" /> 黑八 vs 斯诺克规则差异与 147 构成（点击展开）
      </summary>

      <h2 class="text-2xl font-bold text-foreground mt-4 mb-4"><span class="text-primary mr-2">#</span>中式黑八 vs 斯诺克：规则差异速览</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div class="bg-muted/50 rounded-xl p-4">
          <h3 class="text-sm font-bold text-foreground mb-2">中式黑八（中式八球）</h3>
          <ul class="list-disc list-inside space-y-1 text-xs text-muted-foreground leading-relaxed">
            <li>16 颗球：全色/花色两组 1-7 号 + 黑 8 + 母球，分花色后打完本组再打黑 8 定胜负。</li>
            <li>计分按「局」：赢一局记 1 分，本工具提供局分、逐局历史与开球权轮换。</li>
            <li>开球权：乔氏杯中式八球大师赛标准规则（2025 版）为胜方开球制——赢一局开下一局；部分赛事规程采用交替开球，工具内两种均可配置。</li>
            <li>开球需至少 4 颗目标球碰库或有球入袋方为合法开球；开球黑 8 入袋需重置并交换开球权。</li>
          </ul>
        </div>
        <div class="bg-muted/50 rounded-xl p-4">
          <h3 class="text-sm font-bold text-foreground mb-2">斯诺克（Snooker）</h3>
          <ul class="list-disc list-inside space-y-1 text-xs text-muted-foreground leading-relaxed">
            <li>22 颗球：15 颗红球（各 1 分）+ 6 颗彩球（黄 2 绿 3 棕 4 蓝 5 粉 6 黑 7）+ 母球。</li>
            <li>计分按「杆」：红彩交替（彩球重摆），红球清完后按黄→绿→棕→蓝→粉→黑顺序一杆清彩。</li>
            <li>犯规至少送 4 分，最高按涉球分值送 7 分；对方可选择自己打或让犯规方继续（本工具简化为固定送 4-7 分并换人）。</li>
            <li>超分概念：分差大于台上剩余分时，落后方需要靠做斯诺克（障碍球）罚分翻盘——面板会自动提示。</li>
          </ul>
        </div>
      </div>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">147 满分是怎么构成的？</h3>
      <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
        满分单杆（maximum break）= 15 颗红球全部接黑球 + 一杆清完 6 颗彩球：
        15 × (1 + 7) = 120 分，再加彩球 2+3+4+5+6+7 = 27 分，合计 <span class="font-mono font-bold text-foreground">147</span>。
        台上剩余分的通行算法与此同构：红球在台时剩余 = 红球数 × 8 + 27（如开局 15×8+27 = 147），
        红球清完进入收彩阶段后按未清彩球面值递减，最后一颗黑球落袋剩余归 0、本局结束。
        本工具的斯诺克模式就是按这套逻辑实时递减的——从开局一路点"红、黑"交替再清彩，页面会完整算出 147。
      </p>
      <p class="text-xs text-muted-foreground leading-relaxed mb-4">
        口径说明：若对手犯规后出现自由球（free ball），理论单杆上限可达 155（职业赛仅出现两次）；本工具按常规无自由球口径计 147 上限。
        黑八开球权两种赛制并存，以赛事规程为准（默认按乔氏标准的胜者开球）。
      </p>

      <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-semibold text-foreground">「需做斯诺克」的提示是怎么算的？</h3>
          <p class="text-sm text-muted-foreground mt-1">通行口径：当一方落后分差 &gt; 台上剩余分时，即使清光台面也无法反超，只能通过做障碍球博对方犯规罚分——面板会对落后一方显示该提示，剩余分越少提示越关键。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">犯规怎么记？</h3>
          <p class="text-sm text-muted-foreground mt-1">真实斯诺克犯规按涉球分值判罚（最低 4、最高 7）。本工具提供 +4/+5/+6/+7 四档手动判罚并自动换人；自由球、无意识救球等复杂情形请按实际判罚值选择对应档位。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">黑八的连胜记录是什么？</h3>
          <p class="text-sm text-muted-foreground mt-1">逐局记录胜者后自动统计：当前连胜（从最近一局往前连续赢的局数）与最长连胜（整场最高纪录），适合让分、赌酸奶盖之类的场外彩头。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">斯诺克模式能撤销吗？</h3>
          <p class="text-sm text-muted-foreground mt-1">可以：每打一杆前都会存快照，「撤销一杆」恢复到上一杆之前（得分、红球数、球权、单杆分一起恢复），点错红黑不用手算回滚。</p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'billiards-counter'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Circle, CircleDot, Info, RotateCcw, Undo2, Trophy, Medal,
  History, Flag, TriangleAlert, CheckCircle
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '台球计分器 - 中式黑八局分与斯诺克单杆得分（147验证）',
  description: '免费在线台球计分器：中式黑八局分计分（胜者开/交替开可配、连胜记录、逐局历史）+ 斯诺克单杆得分跟踪（红彩规则、台上剩余分×8+27 递减、147 满分验证、需做斯诺克提示、犯规 4-7 分），撤销一杆，本地运行零上传',
  keywords: '台球计分器,中式黑八计分,斯诺克计分,斯诺克单杆,147满分,台球比分,黑八规则,斯诺克规则',
  author: '有条工具',
  ogTitle: '台球计分器 - 黑八局分 + 斯诺克单杆双模式 | 有条工具',
  ogDescription: '中式黑八局分/开球权/连胜记录，斯诺克红彩单杆、剩余分递减、斯诺克提示与 147 验证。',
  ogUrl: 'https://www.util.cn/tools/billiards-counter',
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
          name: '台球计分器',
          url: 'https://www.util.cn/tools/billiards-counter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['中式黑八：局分计分、胜者开/交替开可配、逐局历史与连胜记录', '斯诺克：红(1)/黄2/绿3/棕4/蓝5/粉6/黑7 单杆跟踪', '合法击球按钮约束：红后必彩、收彩阶段不可跳序', '台上剩余分按红球数×8+27 实时递减，可完整验证 147', '落后方分差 > 剩余分时提示需做斯诺克', '犯规 +4/+5/+6/+7 判罚并换人', '斯诺克撤销一杆（快照栈）、黑八撤销一局', '本地运行零上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '台球计分器', item: 'https://www.util.cn/tools/billiards-counter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '「需做斯诺克」的提示是怎么算的？',
              acceptedAnswer: { '@type': 'Answer', text: '当一方落后分差大于台上剩余分时，即使清光台面也无法反超，只能靠做障碍球博对方犯规罚分，面板会对落后一方显示该提示。' }
            },
            {
              '@type': 'Question',
              name: '147 满分是怎么构成的？',
              acceptedAnswer: { '@type': 'Answer', text: '15 颗红球全部接黑球 15×(1+7)=120 分，再一杆清完 6 颗彩球 2+3+4+5+6+7=27 分，合计 147；台上剩余分口径为红球数×8+27，与本工具面板一致。' }
            },
            {
              '@type': 'Question',
              name: '中式黑八的开球权怎么轮转？',
              acceptedAnswer: { '@type': 'Answer', text: '乔氏杯中式八球标准规则（2025 版）为胜方开球制：谁赢下上一局谁开下一局；部分赛事采用交替开球，工具内两种均可配置。' }
            },
            {
              '@type': 'Question',
              name: '斯诺克犯规怎么记？',
              acceptedAnswer: { '@type': 'Answer', text: '真实规则按涉球分值判罚（最低 4 最高 7），本工具提供 +4/+5/+6/+7 手动判罚并自动换人；自由球等复杂情形按实际判罚值选择档位。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== TESTABLE-BEGIN: 台球纯逻辑（黑八开球权/连胜 + 斯诺克剩余分/球权/147，可独立单测） =====
// ---------- 中式黑八 ----------
// 开球权：winner=胜者开球（乔氏标准）；alternate=交替开球
function b8NextBreaker(mode, lastWinner, currentBreaker) {
  return mode === 'winner' ? lastWinner : 1 - currentBreaker
}

// 记一局：返回新状态（frames 追加、局分+1、开球权轮转）
function b8RecordFrame(state, winner) {
  const frames = state.frames.concat([{ n: state.frames.length + 1, breaker: state.breaker, winner }])
  const scores = [...state.scores]
  scores[winner] += 1
  const breaker = b8NextBreaker(state.mode, winner, state.breaker)
  return { ...state, frames, scores, breaker }
}

// 撤销上一局：弹出末局、局分-1、开球权回到该局开球方
function b8UndoLast(state) {
  if (!state.frames.length) return state
  const frames = state.frames.slice(0, -1)
  const last = state.frames[state.frames.length - 1]
  const scores = [...state.scores]
  scores[last.winner] -= 1
  return { ...state, frames, scores, breaker: last.breaker }
}

// 连胜统计：current=当前连续胜场，best=最长连胜
function b8Streaks(frames) {
  const current = [0, 0]
  const best = [0, 0]
  const run = [0, 0]
  let prev = -1
  for (const f of frames) {
    if (f.winner === prev) run[f.winner] += 1
    else {
      prev = f.winner
      run[f.winner] = 1
    }
    if (run[f.winner] > best[f.winner]) best[f.winner] = run[f.winner]
  }
  // 当前连胜：从末尾往前的连续同胜者长度
  let i = frames.length - 1
  while (i >= 0 && frames[i].winner === prev) {
    current[prev] += 1
    i -= 1
  }
  return { current, best }
}

// ---------- 斯诺克 ----------
const SN_COLOURS = [
  { id: 'yellow', label: '黄', v: 2, btn: 'bg-yellow-400/80 text-yellow-950' },
  { id: 'green', label: '绿', v: 3, btn: 'bg-green-600 text-white' },
  { id: 'brown', label: '棕', v: 4, btn: 'bg-amber-800 text-white' },
  { id: 'blue', label: '蓝', v: 5, btn: 'bg-blue-600 text-white' },
  { id: 'pink', label: '粉', v: 6, btn: 'bg-pink-400 text-pink-950' },
  { id: 'black', label: '黑', v: 7, btn: 'bg-neutral-900 text-white' }
]

function snCreateState() {
  return { scoreA: 0, scoreB: 0, striker: 0, redsLeft: 15, afterRed: false, colourIdx: 0, break: 0, bestA: 0, bestB: 0, over: false }
}

// 台上剩余分：红球在台（或刚打进最后一颗红、待打跟彩）= 红球数×8+27；收彩阶段 = 未清彩球面值和
function snColoursSumFrom(idx) {
  let s = 0
  for (let i = idx; i < 6; i++) s += SN_COLOURS[i].v
  return s
}
function snRemaining(st) {
  if (st.redsLeft > 0 || st.afterRed) return st.redsLeft * 8 + 27
  return snColoursSumFrom(st.colourIdx)
}

// 球权判定：返回 true 表示打该球合法
function snCanPot(st, ball) {
  if (st.over) return false
  if (ball === 'red') return !st.afterRed && st.redsLeft > 0
  const idx = SN_COLOURS.findIndex((c) => c.id === ball)
  if (idx < 0) return false
  if (st.afterRed) return true // 红后任意彩
  if (st.redsLeft === 0) return idx === st.colourIdx // 收彩阶段不可跳序
  return false // 红球在台且非跟彩阶段：直接打彩为犯规（简化：按钮禁用，走犯规档）
}

// 打进一球（先经 snCanPot 校验）；返回新状态（得分即时计入击球方）
function snPot(st, ball) {
  if (!snCanPot(st, ball)) return st
  const next = { ...st }
  let gained = 0
  if (ball === 'red') {
    next.redsLeft -= 1
    next.afterRed = true
    next.break += 1
    gained = 1
  } else {
    const v = SN_COLOURS.find((c) => c.id === ball).v
    next.break += v
    gained = v
    if (st.redsLeft > 0 || st.afterRed) {
      next.afterRed = false // 彩球重摆（含最后一红之后的跟彩）
    } else {
      next.colourIdx += 1 // 收彩阶段：落袋不再重摆
    }
  }
  // 得分即时计入击球方
  if (next.striker === 0) next.scoreA += gained
  else next.scoreB += gained
  // 单杆最高
  if (next.striker === 0 && next.break > next.bestA) next.bestA = next.break
  if (next.striker === 1 && next.break > next.bestB) next.bestB = next.break
  // 收彩结束（黑球落袋）→ 本局结束
  if (next.redsLeft === 0 && !next.afterRed && next.colourIdx >= 6) next.over = true
  return next
}

// 犯规：对方 +points（4-7），本杆清零并记录，换人；红球清空后的跟彩期犯规 → 对手进入收彩
function snFoul(st, points) {
  const p = Math.min(7, Math.max(4, Math.round(Number(points) || 4)))
  const next = { ...st }
  const doneBreak = next.break
  if (next.striker === 0) {
    next.scoreB += p
    next.break = 0
    next.striker = 1
  } else {
    next.scoreA += p
    next.break = 0
    next.striker = 0
  }
  if (next.redsLeft === 0 && next.afterRed) {
    next.afterRed = false
  }
  next.lastBreak = doneBreak
  return next
}

// 未进球换人：本杆清零并记录；红球清空后的跟彩期换人 → 对手进入收彩
function snEndTurn(st) {
  const next = { ...st }
  const doneBreak = next.break
  next.striker = 1 - next.striker
  next.break = 0
  if (next.redsLeft === 0 && next.afterRed) next.afterRed = false
  next.lastBreak = doneBreak
  return next
}

// 需做斯诺克：落后分差 > 台上剩余分
function snNeedsSnooker(myScore, oppScore, remaining) {
  return oppScore - myScore > remaining
}

// 本局胜者（剩余分归 0 后）：分高者胜；平分返回 -1（重摆黑球加赛，简化提示）
function snWinner(st) {
  if (!st.over) return -1
  if (st.scoreA > st.scoreB) return 0
  if (st.scoreB > st.scoreA) return 1
  return -1
}
// ===== TESTABLE-END =====

// ---------- 页面状态 ----------
const mode = ref('black8')

// 黑八
const b8NameA = ref('甲方')
const b8NameB = ref('乙方')
const b8 = reactive({ mode: 'winner', firstBreaker: 0, breaker: 0, scores: [0, 0], frames: [] })
const b8StreaksView = computed(() => b8Streaks(b8.frames))

function b8Win(side) {
  const next = b8RecordFrame({ ...b8 }, side)
  Object.assign(b8, next)
}

function b8Undo() {
  Object.assign(b8, b8UndoLast({ ...b8 }))
}

function b8Reset() {
  if (!window.confirm('确定清空黑八局分与逐局历史吗？此操作不可恢复。')) return
  Object.assign(b8, { mode: b8.mode, firstBreaker: b8.firstBreaker, breaker: b8.firstBreaker, scores: [0, 0], frames: [] })
}

// 斯诺克
const snNameA = ref('甲方')
const snNameB = ref('乙方')
const sn = reactive(snCreateState())
const snPast = ref([])
const snFoulMsg = ref('')

const snStrikerName = computed(() => (sn.striker === 0 ? (snNameA.value || '甲方') : (snNameB.value || '乙方')))
const snRemainingView = computed(() => snRemaining(sn))
const snNextColourLabel = computed(() => (sn.colourIdx < 6 ? `${SN_COLOURS[sn.colourIdx].label} ${SN_COLOURS[sn.colourIdx].v}` : '—'))
const snBallOnText = computed(() => {
  if (sn.over) return '本局已结束'
  if (sn.afterRed) return '彩球（红后跟彩）'
  if (sn.redsLeft > 0) return '红球'
  return `收彩：${snNextColourLabel.value}`
})
const snSnookerText = computed(() => {
  const rem = snRemaining(sn)
  const out = ['', '']
  if (sn.over) return out
  if (snNeedsSnooker(sn.scoreA, sn.scoreB, rem)) out[0] = '需做斯诺克'
  if (snNeedsSnooker(sn.scoreB, sn.scoreA, rem)) out[1] = '需做斯诺克'
  return out
})
const snWinnerText = computed(() => {
  const w = snWinner(sn)
  if (w === 0) return `${snNameA.value || '甲方'} ${sn.scoreA}:${sn.scoreB} 获胜`
  if (w === 1) return `${snNameB.value || '乙方'} ${sn.scoreB}:${sn.scoreA} 获胜`
  return `${sn.scoreA}:${sn.scoreB} 平分，重摆黑球加赛（简化口径）`
})

function snSnapshotPush(cur) {
  snPast.value = [...snPast.value, JSON.parse(JSON.stringify(cur))].slice(-100)
}

function snDoPot(ball) {
  if (!snCanPot(sn, ball)) return
  snSnapshotPush(sn)
  snFoulMsg.value = ''
  Object.assign(sn, snPot({ ...sn }, ball))
}

function snDoFoul(points) {
  snSnapshotPush(sn)
  Object.assign(sn, snFoul({ ...sn }, points))
  snFoulMsg.value = `犯规：对方 +${points} 分，换 ${sn.striker === 0 ? (snNameA.value || '甲方') : (snNameB.value || '乙方')} 击球（真实规则按涉球分值判罚，最低 4 最高 7）。`
}

function snPass() {
  snSnapshotPush(sn)
  snFoulMsg.value = ''
  Object.assign(sn, snEndTurn({ ...sn }))
}

function snUndo() {
  if (!snPast.value.length) return
  const prev = snPast.value[snPast.value.length - 1]
  snPast.value = snPast.value.slice(0, -1)
  Object.assign(sn, prev)
  snFoulMsg.value = ''
}

function snReset() {
  if (!window.confirm('确定开新一局斯诺克吗？当前比分与本杆记录将清空。')) return
  snPast.value = []
  snFoulMsg.value = ''
  Object.assign(sn, snCreateState())
}

onMounted(() => {
  addRecentTool('billiards-counter')
})
</script>

<style scoped>
details summary::-webkit-details-marker {
  display: none;
}
</style>
