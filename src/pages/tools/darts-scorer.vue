<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Target class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">飞镖计分器</h1>
          <p class="text-sm text-muted-foreground mt-1">501/301 双人轮流计分：三镖一轮、爆分(BUST)回滚、Double-out 收镖校验、剩余分收镖路线提示与三镖平均分</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线飞镖计分器：501/301 起始分可选，双人轮流、每轮三镖输入（1-20 与 25 的单/双/三倍按钮矩阵，或直接输入分值）；
        严格按通行规则校验——单镖最高 60（T20），打爆（剩余为负、剩 1、或归零但末镖非双倍）即 BUST 回滚到本轮起始分并 forfeit 剩余镖；
        恰好归零且末镖为双倍（含内红心 DB=50）才获胜，可切换为 straight-out 直收模式；三镖平均分（3DA）实时统计；
        剩余分 ≤170 时按深度 3 镾搜索"建议收镖路线"（末镖优先双倍收），并标注 159/162/163/165/166/168/169 七个不可收镖分
        （以通行口径为准并已脚本穷举验证）。爆分、获胜有 WebAudio 提示音，全部本地运行。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Info class="w-5 h-5 mr-2 text-primary" /> 对局设置
        </h2>

        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">起始分</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="s in [501, 301]"
              :key="'start-' + s"
              @click="startScore = s"
              :disabled="matchOver"
              class="px-3 py-2.5 rounded-lg border text-sm font-semibold font-mono transition disabled:opacity-50"
              :class="startScore === s ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/80'"
            >
              {{ s }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">收镖规则</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="doubleOut = true"
              :disabled="matchOver"
              class="px-3 py-2.5 rounded-lg border text-sm font-medium transition disabled:opacity-50"
              :class="doubleOut ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/80'"
            >
              Double-out（通行）
            </button>
            <button
              @click="doubleOut = false"
              :disabled="matchOver"
              class="px-3 py-2.5 rounded-lg border text-sm font-medium transition disabled:opacity-50"
              :class="!doubleOut ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/80'"
            >
              Straight-out
            </button>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Double-out：最后一镖必须打中双倍区（或内红心 DB=50）才获胜；任何一轮把剩余分打成负数、
            1、或归零但末镖非双倍，即 BUST——本轮得分作废、剩余镖 forfeit，回到本轮起始分。Straight-out：归零即胜、只禁打负。
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label for="p1-name" class="text-xs text-muted-foreground">先手方名称</label>
            <input
              id="p1-name"
              v-model="playerNames[0]"
              type="text"
              maxlength="10"
              placeholder="玩家一"
              class="w-full h-10 px-2.5 border border-border bg-background rounded-lg text-sm text-foreground"
            />
          </div>
          <div class="space-y-1">
            <label for="p2-name" class="text-xs text-muted-foreground">后手方名称</label>
            <input
              id="p2-name"
              v-model="playerNames[1]"
              type="text"
              maxlength="10"
              placeholder="玩家二"
              class="w-full h-10 px-2.5 border border-border bg-background rounded-lg text-sm text-foreground"
            />
          </div>
        </div>

        <button
          @click="newLeg"
          class="w-full px-4 py-3.5 rounded-lg text-base font-semibold transition flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:opacity-90"
        >
          <RotateCcw class="w-5 h-5" /> 新一局（按当前设置重开）
        </button>

        <!-- 收镖速查 -->
        <div class="bg-muted/50 rounded-xl p-4 space-y-2">
          <p class="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Lightbulb class="w-4 h-4 text-primary" /> 剩余分速查（当前先手视角）
          </p>
          <p v-if="checkoutText" class="text-xs text-muted-foreground leading-relaxed">{{ checkoutText }}</p>
          <p class="text-[10px] text-muted-foreground/80 leading-relaxed">
            不可一轮收镖（bogey numbers，脚本穷举验证）：159、162、163、165、166、168、169；最高可收 170（T20 T20 DB）。
          </p>
        </div>
      </div>

      <!-- 右：计分面板 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Target class="w-5 h-5 mr-2 text-primary" /> {{ startScore }} 分 · {{ doubleOut ? 'Double-out' : 'Straight-out' }}
          </h2>
          <span
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium"
            :class="matchOver ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-muted border-border text-muted-foreground'"
          >
            <CheckCircle v-if="matchOver" class="w-3.5 h-3.5" />
            {{ matchOver ? '本局结束' : `轮到：${currentName}` }}
          </span>
        </div>

        <!-- 胜利/爆分横幅 -->
        <div v-if="matchOver" class="rounded-xl border-2 border-green-500/50 bg-green-500/10 p-4 text-center">
          <p class="text-lg font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
            <Trophy class="w-5 h-5" /> {{ winnerName }} 收镖获胜！
          </p>
          <p class="text-xs text-muted-foreground mt-1">最后一镖 {{ lastFinishDartLabel }}，共用了 {{ winnerDarts }} 镖（3DA {{ winnerAvg }}）。</p>
        </div>
        <div
          v-else-if="turnMessage"
          class="rounded-xl border p-4 text-center"
          :class="turnMsgIsBust ? 'border-red-500/50 bg-red-500/10' : 'bg-muted/50 border-border'"
        >
          <p class="text-base font-bold" :class="turnMsgIsBust ? 'text-red-600' : 'text-foreground'">{{ turnMessage }}</p>
        </div>

        <!-- 双方计分 -->
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="p in playersDisplay"
            :key="'player-' + p.idx"
            class="rounded-xl border p-5 text-center transition"
            :class="p.idx === currentPlayer && !matchOver ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'"
          >
            <p class="text-sm font-semibold text-foreground truncate">{{ p.name }}</p>
            <p class="text-6xl font-bold font-mono tabular-nums leading-none mt-2 text-foreground">{{ p.score }}</p>
            <p class="text-xs text-muted-foreground mt-3 font-mono">3DA {{ p.avg }} · 已投 {{ p.dartsThrown }} 镖 · 得 {{ p.pointsScored }} 分</p>
            <p class="text-[10px] text-muted-foreground mt-1 truncate">
              近几轮：{{ p.recent || '—' }}
            </p>
          </div>
        </div>

        <!-- 本轮三镖 -->
        <div class="bg-muted/50 rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-semibold text-foreground">本轮三镖（{{ currentName }}）：{{ turnDartLabels.length }}/3</p>
            <button
              @click="undoDart"
              :disabled="!turnDartLabels.length"
              class="px-2.5 py-1 text-xs bg-muted border border-border rounded text-muted-foreground hover:bg-muted/80 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Undo2 class="w-3 h-3" /> 撤销上一镖
            </button>
          </div>
          <div class="flex items-center gap-2 min-h-[40px]">
            <template v-if="turnDartLabels.length">
              <span
                v-for="(lbl, i) in turnDartLabels"
                :key="'dart-' + i"
                class="px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-primary font-mono text-sm font-bold"
              >{{ lbl }}</span>
            </template>
            <span v-else class="text-xs text-muted-foreground">还没有投镖：点下方矩阵记分（如 T20 = 三倍 20 = 60 分）。</span>
          </div>
        </div>

        <!-- 输入矩阵 -->
        <div v-if="!matchOver" class="space-y-3">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-foreground">倍率：</p>
            <div class="flex gap-1.5">
              <button
                v-for="m in ['S', 'D', 'T']"
                :key="'mult-' + m"
                @click="selectedMult = m"
                class="w-11 py-2 rounded-lg border text-sm font-bold transition"
                :class="selectedMult === m ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/80'"
              >{{ m }}</button>
            </div>
            <span class="text-xs text-muted-foreground ml-2">S=单倍 D=双倍 T=三倍；25 号区双倍 = 内红心 DB</span>
          </div>
          <div class="grid grid-cols-7 sm:grid-cols-11 gap-1.5">
            <button
              v-for="n in 20"
              :key="'pad-' + n"
              @click="throwDart(n)"
              class="py-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/80 text-foreground font-mono text-sm font-bold transition active:scale-95"
            >{{ n }}</button>
            <button
              @click="throwDart(25)"
              class="py-2.5 rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-mono text-sm font-bold transition active:scale-95 col-span-2"
            >25</button>
            <button
              @click="throwDart(0)"
              class="py-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/80 text-muted-foreground font-mono text-sm font-bold transition active:scale-95 col-span-2"
            >未中 0</button>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model.number="directValue"
              type="number"
              min="0"
              max="60"
              class="w-24 h-10 px-2.5 border border-border bg-background rounded-lg text-sm font-bold text-foreground font-mono text-center"
              aria-label="直接输入单镖分值"
            />
            <button
              @click="throwDirect"
              class="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-sm font-semibold text-primary transition"
            >直接输入分值（0-60）</button>
            <span class="text-xs text-muted-foreground">>20 的偶数按双倍、50 按内红心判定；末镖收分请优先用矩阵明确 D/DB。</span>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12 group">
      <summary class="text-base font-semibold flex items-center cursor-pointer select-none text-muted-foreground">
        <Info class="w-4 h-4 mr-2 text-primary" /> 501 规则与收镖表说明、常见问题（点击展开）
      </summary>

      <h2 class="text-2xl font-bold text-foreground mt-4 mb-4"><span class="text-primary mr-2">#</span>501 规则与 Double-out（以通行规则为准）</h2>
      <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
        标准飞镖（501）双人对抗：双方从 501 分开始轮流投镖，每轮 3 镖，投中区域的分值从剩余分中扣除，
        先把剩余分"恰好"扣到 0 者获胜。得分区：镖盘分 20 个扇区（1-20，20 在正上方，两侧是 1 和 5——
        这个刁钻的数字排布由 Brian Gamlin 于 1896 年设计，用来惩罚打偏），每个扇区有单倍、双倍（外环）与三倍（内环）三档，
        中央外圈为 25 分（外红心），圆心为 50 分（内红心，收镖时按双倍计）。单镖最高 60 分（三倍 20），一轮最高 180（T20×3，即 "Ton 80"）。
      </p>
      <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
        <span class="font-semibold text-foreground">Double-out（通行规则）</span>：获胜的最后一镖必须打中双倍区或内红心。
        由此产生三种 BUST（爆分）：把剩余分打成负数；打成 1（任何双倍都无法收 1，规则视同爆分）；恰好归零但末镖不是双倍。
        爆分后本轮得分作废、剩余镖 forfeit、分数回滚到本轮起始分（通行口径；民间另有"只回滚引发爆分那一镖"的 Northern Bust 变体）。
        想收着玩可以用本工具的 Straight-out 模式：归零即胜、只禁打负。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">收镖路线与不可收镖分（Bogey Numbers）</h3>
      <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
        剩余分 ≤170 时理论上才可能一轮（3 镖）收完——170 是最高收镖分（T20 + T20 + 内红心，绰号 Big Fish）。
        但其中 7 个数无论怎么组合都收不完：<span class="font-mono font-semibold text-foreground">159、162、163、165、166、168、169</span>
        （收镖表里俗称 bogey numbers；本工具的路线搜索即按"≤3 镾、末镖必须双倍、中途剩余不得为 1 或负"穷举验证，与通行收镖表一致）。
        站上 bogey number 的策略是先打高分化掉到可收的分（例如 169 打 T20+S19 留 90）。
      </p>
      <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground mb-4">
        <li>剩 170：T20 → T20 → DB（60+60+50，Big Fish）。</li>
        <li>剩 40：D20（双倍 20，"double top"）。</li>
        <li>剩 32：D16 一镖收（也可 16 + D8 两镖收）；剩 170：T20 T20 DB。</li>
      </ul>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">三镖平均分（3DA）怎么看？</h3>
      <p class="text-sm text-muted-foreground leading-relaxed mb-4">
        3DA = 总得分 ÷ 总投镖数（每轮不足 3 镾就收镖或爆分时，按实际投出的镖数计），是衡量飞镖水平的核心指标：
        业余休闲 30-40，俱乐部高手 50-60，职业选手 90-100+（PDC 顶级对决的场均 3DA 常在 100 上下，
        意味着平均每三轮就接近一次"two 180 + 收镖"的九镖节奏）。
      </p>

      <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-semibold text-foreground">为什么剩 1 分算爆分？</h3>
          <p class="text-sm text-muted-foreground mt-1">Double-out 下获胜镖必须是双倍，而双倍最小是 D1=2 分——剩 1 分时不存在任何合法收镖镖，规则把"打成剩 1"与打负同样按爆分处理（通行口径）。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">爆分后分数怎么算？</h3>
          <p class="text-sm text-muted-foreground mt-1">本轮三镖全部作废（含引发爆分那一镖之前的得分），剩余分回滚到本轮起始分，剩余未投的镖也作废，轮到对手。本工具会弹横幅提示并自动换人。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">内红心（Bull 50）算双倍吗？</h3>
          <p class="text-sm text-muted-foreground mt-1">算。通行规则里内红心（inner bull, 50 分）按双倍计，可以作为收镖镖；外红心（outer bull, 25 分）按单倍 25 计。170 的经典收法 T20 T20 DB 就是以内红心收尾。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">直接输入分值时双倍怎么判定？</h3>
          <p class="text-sm text-muted-foreground mt-1">大于 20 的偶数只可能是双倍区（单倍最大 20、三倍均为 3 的倍数），50 判定为内红心双倍；20 及以下的数按单倍记录——所以收分那镖建议用按钮矩阵明确选择 D 或 DB，避免歧义。</p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'darts-scorer'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Target, Info, RotateCcw, Undo2, Trophy, CheckCircle, TriangleAlert,
  Lightbulb, Volume2, VolumeX
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '飞镖计分器 - 501/301 在线计分（BUST回滚/收镖路线/3DA）',
  description: '免费在线飞镖计分器：501/301 双人轮流三镖一轮，单双三倍按钮矩阵，爆分 BUST 自动回滚本轮，Double-out 收镖校验（可切 Straight-out），剩余分收镖路线提示与 159-169 不可收镖分标注，三镖平均分 3DA 实时统计，WebAudio 提示音，本地运行零上传',
  keywords: '飞镖计分器,501计分,飞镖记分,收镖表,double out,三镖平均分,3DA,飞镖收镖路线,bogey number',
  author: '有条工具',
  ogTitle: '飞镖计分器 - 501/301 计分与收镖路线提示 | 有条工具',
  ogDescription: '三镖一轮、BUST 回滚、Double-out 校验、收镖路线与 3DA 统计，通行规则本地计分。',
  ogUrl: 'https://www.util.cn/tools/darts-scorer',
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
          name: '飞镖计分器',
          url: 'https://www.util.cn/tools/darts-scorer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['501/301 起始分，双人轮流每轮三镖', '1-20 与 25 的单/双/三倍按钮矩阵 + 直接输入分值', 'BUST 判定与回滚：打负、剩 1、归零非双倍均爆分（可切 Straight-out）', '收镖路线搜索（≤3 镾、末镖双倍）与 bogey number 标注', '三镖平均分 3DA 与投镖数实时统计', '本轮撤销上一镖、自动换人', 'WebAudio 爆分/获胜提示音', '本地运行零上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '飞镖计分器', item: 'https://www.util.cn/tools/darts-scorer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么剩 1 分算爆分？',
              acceptedAnswer: { '@type': 'Answer', text: 'Double-out 下获胜镖必须是双倍区，双倍最小是 D1=2 分，剩 1 分不存在合法收镖，规则按爆分处理；爆分后本轮得分作废、剩余分回滚到本轮起始分。' }
            },
            {
              '@type': 'Question',
              name: '哪些分无法一轮收完？',
              acceptedAnswer: { '@type': 'Answer', text: '159、162、163、165、166、168、169 这 7 个 bogey number 在 ≤3 镾且末镖双倍的规则下无法收完；170 是最高可收分（T20 T20 内红心 50）。' }
            },
            {
              '@type': 'Question',
              name: '内红心（Bull 50）算双倍吗？',
              acceptedAnswer: { '@type': 'Answer', text: '算。通行规则中内红心按双倍计、可作收镖镖；外红心 25 分按单倍计。' }
            },
            {
              '@type': 'Question',
              name: '三镖平均分（3DA）怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '总得分 ÷ 总投镖数（收镖或爆分时按实际投出镖数计）。业余 30-40、俱乐部高手 50-60、职业选手 90-100 以上。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== TESTABLE-BEGIN: 飞镖纯逻辑（单镖校验 + 回合模拟 + 收镖搜索 + 3DA，可独立单测） =====
// 候选镖表：base 1-20 × S/D/T + 25 × S/D(DB)；按分值降序（同分 T>D>S、base 降序）——路线搜索的确定性偏好
function dsCandidates() {
  const out = []
  for (let base = 1; base <= 20; base++) {
    for (const m of ['T', 'D', 'S']) {
      out.push({ label: m + base, v: base * (m === 'T' ? 3 : m === 'D' ? 2 : 1), double: m === 'D' })
    }
  }
  out.push({ label: '25', v: 25, double: false })
  out.push({ label: 'DB', v: 50, double: true })
  return out.sort((a, b) => (b.v - a.v) || (Number(b.double) - Number(a.double)))
}

// 单镖结算（doubleOut 口径）：打负、剩 1、归零非双倍 = bust；恰好 0 且双倍 = win
function dsApplyDart(rem, v, isDouble, doubleOut) {
  const next = rem - v
  if (doubleOut) {
    if (next === 0) return isDouble ? { rem: 0, status: 'win' } : { rem, status: 'bust' }
    if (next < 0 || next === 1) return { rem, status: 'bust' }
    return { rem: next, status: 'ok' }
  }
  if (next === 0) return { rem: 0, status: 'win' }
  if (next < 0) return { rem, status: 'bust' }
  return { rem: next, status: 'ok' }
}

// 回合模拟：startRem 起始分、darts = [{v, double}]（≤3 镾）；爆分回滚到起始分
function dsSimulateTurn(startRem, darts, doubleOut) {
  let cur = startRem
  for (let i = 0; i < darts.length; i++) {
    const r = dsApplyDart(cur, darts[i].v, darts[i].double, doubleOut)
    if (r.status === 'bust') return { endRem: startRem, dartsUsed: i + 1, status: 'bust', bustAt: i }
    if (r.status === 'win') return { endRem: 0, dartsUsed: i + 1, status: 'win' }
    cur = r.rem
  }
  return { endRem: cur, dartsUsed: darts.length, status: 'done', bustAt: -1 }
}

// 收镖路线搜索：≤3 镾、（doubleOut 时）末镖必须双倍、中途剩余 ≥2（不爆）；偏好：镖数少 → 分值高
function dsFindCheckout(d, doubleOut) {
  if (!Number.isFinite(d) || d < 1 || d > 170) return null
  if (doubleOut && d < 2) return null // 双倍最小 D1=2
  const cands = dsCandidates()
  const minRem = doubleOut ? 2 : 1
  for (let depth = 1; depth <= 3; depth++) {
    const res = dsSearch(d, depth, cands, minRem, doubleOut)
    if (res) return res
  }
  return null
}
function dsSearch(need, depth, cands, minRem, doubleOut) {
  for (const c of cands) {
    if (c.v > need) continue
    const left = need - c.v
    if (depth === 1) {
      if (left === 0 && (!doubleOut || c.double)) return [c.label]
      continue
    }
    if (left >= minRem) {
      const sub = dsSearch(left, depth - 1, cands, minRem, doubleOut)
      if (sub) return [c.label, ...sub]
    }
  }
  return null
}

// 不可收镖分全集（2-170 内搜索不到路线的），用于验证 bogey 列表
function dsImpossibleCheckouts() {
  const out = []
  for (let d = 2; d <= 170; d++) {
    if (!dsFindCheckout(d, true)) out.push(d)
  }
  return out
}

// 三镖平均分
function dsThreeDartAvg(points, darts) {
  if (!darts || darts <= 0) return '0.00'
  return (points / darts).toFixed(2)
}

// 直接输入分值的倍率推断：50=DB；>20 的偶数=D（单倍最大 20）；≤20 或其它=S（T 为 3 的倍数时可作 T？保持保守按 S，收分请用矩阵）
function dsInferDirect(v) {
  const n = Math.floor(Number(v))
  if (!Number.isFinite(n) || n < 0 || n > 60) return null
  if (n === 50) return { v: 50, double: true, label: 'DB' }
  if (n > 20 && n % 2 === 0 && n / 2 <= 20) return { v: n, double: true, label: 'D' + n / 2 }
  if (n === 0) return { v: 0, double: false, label: '0' }
  return { v: n, double: false, label: 'S' + n }
}
// ===== TESTABLE-END =====

// ---------- 页面状态 ----------
const startScore = ref(501)
const doubleOut = ref(true)
const playerNames = ref(['玩家一', '玩家二'])
const players = ref([
  { idx: 0, score: 501, dartsThrown: 0, pointsScored: 0, turns: [] },
  { idx: 1, score: 501, dartsThrown: 0, pointsScored: 0, turns: [] }
])
const currentPlayer = ref(0)
const turnStartRem = ref(501)
const turnDarts = ref([]) // [{label, v, double}]
const turnMessage = ref('')
const turnMsgIsBust = ref(false)
const matchOver = ref(false)
const winnerIdx = ref(-1)
const lastFinishDart = ref('')
const directValue = ref(null)
const selectedMult = ref('S')

const MULT_MULT = { S: 1, D: 2, T: 3 }

const currentName = computed(() => playerNames.value[currentPlayer.value] || `玩家${currentPlayer.value + 1}`)
const winnerName = computed(() => (winnerIdx.value >= 0 ? playerNames.value[winnerIdx.value] : ''))
const winnerDarts = computed(() => (winnerIdx.value >= 0 ? players.value[winnerIdx.value].dartsThrown : 0))
const winnerAvg = computed(() => (winnerIdx.value >= 0 ? players.value[winnerIdx.value].avg : '0.00'))
const turnDartLabels = computed(() => turnDarts.value.map((d) => d.label))

const playersView = computed(() =>
  players.value.map((p) => ({
    ...p,
    name: playerNames.value[p.idx] || `玩家${p.idx + 1}`,
    avg: dsThreeDartAvg(p.pointsScored, p.dartsThrown),
    recent: p.turns.slice(-3).map((t) => (t.bust ? 'BUST' : t.pts)).join(' / ')
  }))
)
const playersDisplay = playersView

const checkoutText = computed(() => {
  const d = players.value[currentPlayer.value].score
  if (d > 170) return `剩 ${d}：超过 170，无法一轮（3 镾）收完，先化分。`
  const route = dsFindCheckout(d, doubleOut.value)
  if (route) return `剩 ${d}：建议路线 ${route.join(' → ')}${doubleOut.value ? '（末镖双倍收）' : ''}。`
  return `剩 ${d}：不可一轮收（bogey number），建议先打高分化到可收分，例如 T20 后再看剩余。`
})

// ---------- WebAudio（投镖哒 / 爆分嗡 / 获胜三连音，仅事件回调触发，SSR 安全） ----------
let audioCtx = null
function ensureAudio() {
  if (audioCtx) return audioCtx
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  audioCtx = new Ctx()
  return audioCtx
}
function beepAt(freq, startAt, durSec, peak, type = 'sine') {
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const env = audioCtx.createGain()
  osc.type = type
  osc.frequency.value = freq
  env.gain.setValueAtTime(0.001, startAt)
  env.gain.exponentialRampToValueAtTime(Math.max(0.002, peak), startAt + 0.01)
  env.gain.exponentialRampToValueAtTime(0.001, startAt + durSec)
  osc.connect(env)
  env.connect(audioCtx.destination)
  osc.start(startAt)
  osc.stop(startAt + durSec + 0.05)
}
function playDartTick() {
  if (!ensureAudio()) return
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
  beepAt(740, audioCtx.currentTime + 0.02, 0.05, 0.25, 'square')
}
function playBustBuzz() {
  if (!audioCtx) return
  beepAt(180, audioCtx.currentTime + 0.02, 0.35, 0.4, 'sawtooth')
}
function playWinCue() {
  if (!audioCtx) return
  const t = audioCtx.currentTime + 0.02
  beepAt(523.25, t, 0.16, 0.4, 'sine')
  beepAt(659.25, t + 0.18, 0.16, 0.4, 'sine')
  beepAt(783.99, t + 0.36, 0.3, 0.4, 'sine')
}

// ---------- 投镖与回合 ----------
function commitTurn(pts, bust) {
  const p = players.value[currentPlayer.value]
  p.turns = [...p.turns, { pts, bust }].slice(-20)
  if (!bust) {
    p.dartsThrown += turnDarts.value.length
    p.pointsScored += pts
  } else {
    // 爆分：已投的镖计入门数但不计分（含作废镖），通行口径按投出即计
    p.dartsThrown += turnDarts.value.length
  }
  currentPlayer.value = 1 - currentPlayer.value
  turnDarts.value = []
  turnStartRem.value = players.value[currentPlayer.value].score
}

function throwDart(base) {
  if (matchOver.value) return
  const mult = MULT_MULT[selectedMult.value] || 1
  const v = base * mult
  const label = base === 0 ? '0' : `${selectedMult.value}${base}`
  doThrow({ v, double: selectedMult.value === 'D', label })
}

function throwDirect() {
  if (matchOver.value) return
  const inf = dsInferDirect(directValue.value)
  if (!inf) {
    turnMessage.value = '请输入 0-60 的整数分值。'
    turnMsgIsBust.value = false
    return
  }
  doThrow(inf)
}

function doThrow(dart) {
  const p = players.value[currentPlayer.value]
  const r = dsApplyDart(p.score, dart.v, dart.double, doubleOut.value)
  playDartTick()
  if (r.status === 'bust') {
    turnMessage.value = `BUST！${dart.label} 打出后剩余 ${p.score - dart.v < 0 ? '为负' : p.score - dart.v === 0 ? '0 但末镖非双倍' : p.score - dart.v === 1 ? '1（双倍无法收 1）' : '非法'}，本轮作废回 ${p.score} 分。`
    turnMsgIsBust.value = true
    turnDarts.value = [...turnDarts.value, dart] // 引爆镖也计入投镖数
    commitTurn(0, true)
    playBustBuzz()
    return
  }
  turnMessage.value = ''
  turnMsgIsBust.value = false
  turnDarts.value = [...turnDarts.value, dart]
  if (r.status === 'win') {
    p.score = 0
    p.dartsThrown += turnDarts.value.length
    p.pointsScored += turnStartRem.value
    p.turns = [...p.turns, { pts: turnStartRem.value, bust: false }].slice(-20)
    matchOver.value = true
    winnerIdx.value = currentPlayer.value
    lastFinishDart.value = dart.label
    playWinCue()
    return
  }
  p.score = r.rem
  if (turnDarts.value.length >= 3) {
    const pts = turnStartRem.value - p.score
    turnMessage.value = `本轮 ${pts} 分（${turnDarts.value.map((d) => d.label).join(' ')}），轮到 ${playerNames.value[1 - currentPlayer.value] || '对手'}。`
    commitTurn(pts, false)
  }
}

function undoDart() {
  if (matchOver.value || !turnDarts.value.length) return
  const darts = [...turnDarts.value]
  darts.pop()
  turnDarts.value = darts
  // 从本轮起始重放
  const sim = dsSimulateTurn(turnStartRem.value, darts, doubleOut.value)
  players.value[currentPlayer.value].score = sim.status === 'done' ? sim.endRem : turnStartRem.value
  turnMessage.value = ''
  turnMsgIsBust.value = false
}

function newLeg() {
  players.value = [0, 1].map((idx) => ({
    idx,
    score: startScore.value,
    dartsThrown: 0,
    pointsScored: 0,
    turns: []
  }))
  currentPlayer.value = 0
  turnStartRem.value = startScore.value
  turnDarts.value = []
  turnMessage.value = ''
  turnMsgIsBust.value = false
  matchOver.value = false
  winnerIdx.value = -1
  lastFinishDart.value = ''
}

onMounted(() => {
  newLeg()
  addRecentTool('darts-scorer')
})

onBeforeUnmount(() => {
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
