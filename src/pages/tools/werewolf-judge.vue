<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3 flex items-center gap-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Swords class="h-7 w-7 text-primary" />
        </div>
        狼人杀法官助手 - 自动发牌·夜晚流程·分段计时
      </h1>
      <p class="text-muted-foreground">
        线下狼人杀（面杀）法官/主持人的一站式辅助：按板子一键随机发牌、法官逐位翻牌查看身份；内置「狼人刀人 → 女巫用药 → 猎人确认 → 预言家验人 → 天亮」夜晚流程指引与标准台词；警长竞选/发言/投票分段倒计时到点提示；点击玩家即可标记出局、自动生成存活名单与出局顺序。纯前端本地运行、不联网，仅作为线下聚会辅助。
      </p>
    </div>

    <!-- ① 板子配置与发牌 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6 space-y-4">
      <h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
        <Users class="w-5 h-5 text-primary" /> 板子与配置
      </h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="b in boardOptions"
          :key="b.key"
          @click="selectBoard(b.key)"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            boardKey === b.key
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          ]"
        >{{ b.label }}</button>
      </div>

      <div v-if="boardKey === 'custom'" class="grid grid-cols-3 md:grid-cols-6 gap-3">
        <div v-for="r in ROLE_DEFS" :key="r.key" class="bg-muted/50 rounded-lg p-3 text-center space-y-2">
          <p class="text-xs font-medium text-foreground">{{ r.label }}</p>
          <div class="flex items-center justify-center gap-1.5">
            <button
              @click="changeCustomCount(r.key, -1)"
              class="w-7 h-7 flex items-center justify-center bg-background border border-border rounded-md hover:bg-accent text-foreground text-sm"
              aria-label="减少"
            >−</button>
            <span class="w-6 text-center font-mono font-bold text-foreground">{{ customCounts[r.key] || 0 }}</span>
            <button
              @click="changeCustomCount(r.key, 1)"
              class="w-7 h-7 flex items-center justify-center bg-background border border-border rounded-md hover:bg-accent text-foreground text-sm"
              aria-label="增加"
            >+</button>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <label class="text-sm text-muted-foreground">玩家人数：</label>
        <input
          v-model.number="playerCount"
          type="number"
          min="4"
          max="20"
          class="w-20 px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span class="text-sm text-foreground">板子总座位 <span class="font-bold text-primary">{{ boardTotal }}</span>，狼人阵营 <span class="font-bold">{{ wolfTotal }}</span></span>
        <button
          @click="deal"
          :disabled="!canDeal"
          class="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Moon class="w-4 h-4" /> {{ seats.length > 0 ? '重新发牌' : '发牌' }}
        </button>
      </div>
      <p v-if="countMismatch" class="text-xs text-amber-600 dark:text-amber-400">
        提示：玩家人数与板子座位数不一致，发牌将以板子的 {{ boardTotal }} 个座位为准；若人数确为 {{ playerCount }}，请切换自定义调整各角色数量。
      </p>
      <p v-if="!canDeal" class="text-xs text-muted-foreground">发牌需要至少 4 个座位且包含至少 1 名狼人。</p>
    </div>

    <!-- ② 法官发牌区 -->
    <div v-if="seats.length > 0" class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
          <Swords class="w-5 h-5 text-primary" /> 法官发牌（请勿泄露给玩家）
        </h2>
        <div class="flex gap-2">
          <button
            @click="revealAll"
            class="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >全部揭晓</button>
          <button
            @click="hideAll"
            class="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >全部盖回</button>
        </div>
      </div>
      <p class="text-xs text-muted-foreground mb-4">点击座位牌逐位翻面查看身份，方便法官在玩家私下确认时对照。</p>
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        <button
          v-for="s in seats"
          :key="s.seat"
          @click="toggleReveal(s.seat)"
          :class="[
            'h-20 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1',
            s.revealed ? factionMeta[s.faction].cls : 'bg-muted/50 border-border text-muted-foreground hover:bg-accent'
          ]"
        >
          <span class="text-xs opacity-80">{{ s.seat }} 号</span>
          <span v-if="s.revealed" class="font-bold">{{ s.label }}</span>
          <span v-else class="text-xs">点击翻牌</span>
          <span v-if="s.revealed" class="text-[10px] opacity-80">{{ factionMeta[s.faction].label }}</span>
        </button>
      </div>
    </div>

    <!-- ③ 夜晚流程指引 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
          <Moon class="w-5 h-5 text-primary" /> 夜晚流程指引
        </h2>
        <div class="flex gap-2">
          <button
            @click="prevStep"
            :disabled="currentStep <= 0"
            class="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40"
          >上一步</button>
          <button
            v-if="currentStep < 0"
            @click="currentStep = 0"
            class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >天黑请闭眼</button>
          <button
            v-else
            @click="nextStep"
            :disabled="currentStep >= steps.length - 1"
            class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40"
          >{{ currentStep >= steps.length - 1 ? '已到亮天' : '下一步' }}</button>
          <button
            v-if="currentStep > 0"
            @click="currentStep = 0"
            class="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >下一晚</button>
        </div>
      </div>

      <div
        v-if="activeStep"
        class="rounded-lg p-5 mb-4 bg-primary/10 border border-primary/30"
      >
        <p class="text-sm font-semibold text-primary mb-1.5">{{ currentStep + 1 }}/{{ steps.length }} · {{ activeStep.title }}</p>
        <p class="text-base text-foreground leading-relaxed">「{{ activeStep.line }}」</p>
      </div>
      <div v-else class="rounded-lg p-5 mb-4 bg-muted/50 text-sm text-muted-foreground">
        点击「天黑请闭眼」开始夜晚流程，法官按步骤照读台词推进即可。
      </div>

      <ol class="space-y-1.5">
        <li
          v-for="(st, i) in steps"
          :key="st.id"
          :class="[
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            i === currentStep ? 'bg-primary/10 text-primary font-semibold border border-primary/30' : '',
            currentStep >= 0 && i < currentStep ? 'text-muted-foreground/60 line-through' : '',
            (currentStep < 0 || i > currentStep) && i !== currentStep ? 'text-muted-foreground' : ''
          ]"
        >
          <span class="w-5 h-5 flex items-center justify-center rounded-full bg-muted text-xs font-mono flex-shrink-0">{{ i + 1 }}</span>
          {{ st.title }}
          <Check v-if="currentStep >= 0 && i < currentStep" class="w-4 h-4 text-green-600 dark:text-green-400" />
        </li>
      </ol>
    </div>

    <!-- ④ 分段计时器 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
        <Timer class="w-5 h-5 text-primary" /> 分段计时器
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-3">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="seg in segments"
              :key="seg.label"
              @click="applySegment(seg)"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeSegment === seg.label
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >{{ seg.label }}（{{ seg.sec / 60 }} 分钟）</button>
          </div>
          <div class="flex items-center gap-3">
            <label class="text-sm text-muted-foreground">自定义分钟：</label>
            <input
              v-model.number="timerMinutes"
              type="number"
              min="0.5"
              max="30"
              step="0.5"
              class="w-24 px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              @click="applyMinutes"
              class="px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted text-muted-foreground"
            >应用并重置</button>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            到点自动播放提示音（浏览器 Web Audio 本地合成）并弹窗提醒，无需任何外部文件。
          </p>
        </div>

        <div class="bg-muted/50 rounded-lg p-5 text-center space-y-3">
          <p class="text-4xl md:text-5xl font-bold font-mono text-foreground">{{ mmss }}</p>
          <div class="h-2 bg-background rounded-full overflow-hidden border border-border">
            <div
              class="h-full bg-primary transition-all"
              :style="{ width: timerPercent + '%' }"
            ></div>
          </div>
          <div class="flex justify-center gap-2">
            <button
              @click="toggleTimer"
              :class="[
                'px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
                timerRunning ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'bg-primary text-primary-foreground hover:bg-primary/90'
              ]"
            >
              <Pause v-if="timerRunning" class="w-4 h-4" />
              <Play v-else class="w-4 h-4" />
              {{ timerRunning ? '暂停' : '开始' }}
            </button>
            <button
              @click="resetTimer"
              class="px-5 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground flex items-center gap-2"
            >
              <RotateCcw class="w-4 h-4" /> 重置
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ⑤ 出局记录与存活名单 -->
    <div v-if="seats.length > 0" class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle class="w-5 h-5 text-primary" /> 出局记录（点击玩家标记/取消出局）
        </h2>
        <button
          v-if="deadSeats.length > 0"
          @click="reviveAll"
          class="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >全员复活</button>
      </div>

      <div class="flex flex-wrap gap-2 mb-5">
        <button
          v-for="s in seats"
          :key="s.seat"
          @click="toggleDead(s.seat)"
          :class="[
            'w-14 h-10 rounded-lg border text-sm font-medium transition-all',
            isDead(s.seat)
              ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 line-through'
              : 'bg-muted/50 border-border text-foreground hover:bg-accent'
          ]"
        >{{ s.seat }} 号</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div class="bg-muted/50 rounded-lg p-4">
          <p class="text-xs text-muted-foreground mb-2">存活名单（{{ aliveSeats.length }} 人）</p>
          <p class="text-foreground font-medium break-all">
            {{ aliveSeats.length > 0 ? aliveSeats.map(n => `${n}号`).join('、') : '全员出局，请法官复盘结算' }}
          </p>
        </div>
        <div class="bg-muted/50 rounded-lg p-4">
          <p class="text-xs text-muted-foreground mb-2">出局顺序</p>
          <p v-if="deadSeats.length === 0" class="text-muted-foreground">暂无玩家出局</p>
          <ol v-else class="space-y-1 text-foreground">
            <li v-for="(seat, idx) in deadSeats" :key="seat">
              第 {{ idx + 1 }} 位出局：{{ seat }} 号
              <span v-if="seatOf(seat)" class="text-xs text-muted-foreground">（{{ seatOf(seat).label }}）</span>
            </li>
          </ol>
        </div>
      </div>
    </div>

    <!-- 使用提示 / 免责 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        使用提示：本工具仅作为线下聚会时法官的照屏辅助——发牌时请背对玩家操作或交由法官手机查看；随机分配使用浏览器密码级随机数 crypto.getRandomValues 与 Fisher-Yates 洗牌；台词为常见标准流程，不同板子（如守卫、狼王、白狼王技能）请按你们桌上的官方或房规口径微调；页面纯前端本地运行、不联网、不上传任何对局数据。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于狼人杀法官助手</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            狼人杀面杀最手忙脚乱的角色是法官：既要背熟「天黑请闭眼」之后每个神职的唤醒顺序与手势规范，又要盯发言计时、记刀口和毒口、维护出局名单。本工具把这四件事合到一块屏上：发牌、流程台词、分段计时、出局记录，法官只需要照屏推进即可。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见板子与配置</h3>
          <p>
            标准局「预女猎白」12 人：狼人阵营为白狼王 1 加普通狼人 3，神职为预言家、女巫、猎人，平民 5，是聚会最常开的屠边规则局；简单局 9 人为狼 3、预言家女巫猎人各 1、平民 3，适合新手。若你们玩的是守卫局、狼王局或娱乐板，切到自定义按角色逐个加减数量即可，夜晚步骤清单会随板子中是否存在该神职自动增减。
          </p>
          <h3 class="text-lg font-semibold text-foreground">夜晚流程的标准口径</h3>
          <p>
            本工具采用常见顺序：狼人睁眼确认队友并统一刀口 → 女巫睁眼用药（解药/毒药） → 猎人睁眼记忆座位 → 预言家睁眼验人 → 天亮宣布死讯。部分社群习惯把预言家放在女巫之前或让猎人最后统一确认，属流程差异不影响平衡；第一晚是否允许女巫自救、能否同晚用双药等细节以你们桌上的规则为准。每步都配了可直接照读的台词文案。
          </p>
          <h3 class="text-lg font-semibold text-foreground">分段计时与法官操作建议</h3>
          <p>
            白天环节的节奏全靠法官控时：警长竞选、每人发言、集中投票各有常见时长，本工具内置三段预设并可自定义 0.5-30 分钟，倒计时归零时自动播放本地合成的提示音并弹窗，法官不必盯着秒表。建议法官把手机/平板横屏投屏到桌面一侧：发牌区在核对完所有人私看身份后点「全部盖回」，夜晚只按高亮步骤照读台词，出局玩家在记录区点一下座位号即可入册，天亮时直接照读存活名单与出局顺序，避免口头争议。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">发牌会不会被玩家看到或作弊？</span>牌面默认盖回，仅法官点击翻牌可见；随机分配在浏览器本地用密码级随机源完成，没有服务器，任何人（包括开发者）都无法预设或窥探结果。</li>
            <li><span class="text-foreground font-medium">计时到点有声音吗？</span>有。到点用 Web Audio 在本地合成一声提示音并弹窗提醒；若浏览器限制未播放声音，请确认已允许该页面发声或先与页面交互一次。</li>
            <li><span class="text-foreground font-medium">中途有人加进来怎么办？</span>调整板子人数后重新发牌即可；已进行到一半不建议插牌，可用自定义把人数加好再开下一局，出局记录在重新发牌时会自动清空。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'werewolf-judge'" :category="'random'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Swords, Users, Moon, Timer, Play, Pause, RotateCcw,
  Check, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '狼人杀法官助手 - 自动发牌·夜晚流程指引·面杀分段计时',
  description: '在线狼人杀法官工具：预女猎白/简单局/自定义板子一键密码级随机发牌，法官逐位翻牌；狼人刀人、女巫用药、猎人、预言家验人夜晚流程台词逐步推进；警长竞选/发言/投票分段计时到点提示音；点击标记出局自动生成存活名单与出局顺序，纯前端线下聚会辅助',
  keywords: '狼人杀法官, 狼人杀发牌, 狼人杀夜晚流程, 面杀计时器, 狼人杀板子, 预言家女巫猎人, 狼人杀主持人台词, 出局记录',
  author: 'Util工具箱',
  ogTitle: '狼人杀法官助手 - 有条工具',
  ogDescription: '自动发牌、夜晚流程台词指引、分段计时与出局记录，面杀法官照屏推进',
  ogUrl: 'https://www.util.cn/tools/werewolf-judge',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '狼人杀法官助手',
          url: 'https://www.util.cn/tools/werewolf-judge',
          applicationCategory: 'GameApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['预女猎白/简单局/自定义板子', '密码级随机发牌与逐位翻牌', '夜晚流程标准台词推进', '警长竞选/发言/投票分段计时', '点击标记出局与顺序记录', '纯本地不联网']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '狼人杀法官助手', item: 'https://www.util.cn/tools/werewolf-judge' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '发牌会不会被玩家看到或作弊？',
              acceptedAnswer: { '@type': 'Answer', text: '牌面默认盖回仅法官可见；随机分配在浏览器本地用密码级随机源完成，没有服务器参与，无法预设或窥探结果。' }
            },
            {
              '@type': 'Question',
              name: '计时到点有声音吗？',
              acceptedAnswer: { '@type': 'Answer', text: '有，到点用 Web Audio 本地合成提示音并弹窗提醒；若浏览器限制自动发声，先与页面交互一次再开始计时。' }
            },
            {
              '@type': 'Question',
              name: '中途有人加入怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '调整板子人数后重新发牌即可，出局记录会自动清空；进行到一半不建议插牌，可自定义人数后开下一局。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'werewolf-judge')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ==== CORE START ====
// 无偏整数抽样（拒绝法），与骰子页同一数学口径：先丢弃 >= ⌊2^32/f⌋*f 的样本再取模
function randIntUnbiased(faces, nextUint32) {
  const f = Math.max(1, Math.floor(faces))
  if (f === 1) return 1
  const limit = Math.floor(4294967296 / f) * f
  let x = nextUint32()
  let guard = 0
  while (x >= limit && guard < 10000) {
    x = nextUint32()
    guard++
  }
  return (x % f) + 1
}

const ROLE_DEFS = [
  { key: 'whiteWolfKing', label: '白狼王', faction: 'wolf' },
  { key: 'wolf', label: '狼人', faction: 'wolf' },
  { key: 'seer', label: '预言家', faction: 'god' },
  { key: 'witch', label: '女巫', faction: 'god' },
  { key: 'hunter', label: '猎人', faction: 'god' },
  { key: 'villager', label: '平民', faction: 'villager' }
]

const BOARDS = {
  standard12: { label: '预女猎白 · 12 人标准局', seats: 12, counts: { whiteWolfKing: 1, wolf: 3, seer: 1, witch: 1, hunter: 1, villager: 5 } },
  easy9: { label: '狼预女猎 · 9 人简单局', seats: 9, counts: { whiteWolfKing: 0, wolf: 3, seer: 1, witch: 1, hunter: 1, villager: 3 } }
}

// counts: {roleKey: 数量} → 角色牌堆（座位数量与板子定义严格一致）
function buildRoleDeck(counts) {
  const deck = []
  for (const def of ROLE_DEFS) {
    const c = Math.max(0, Math.round(Number(counts[def.key]) || 0))
    for (let i = 0; i < c; i++) deck.push({ key: def.key, label: def.label, faction: def.faction })
  }
  return deck
}

// Fisher-Yates 洗牌（无偏抽样驱动）
function shuffleDeck(deck, nextUint32) {
  const arr = deck.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randIntUnbiased(i + 1, nextUint32) - 1
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

// 发牌：返回 [{seat, key, label, faction, revealed}]，座位号 1..N 不重复
function dealRoles(counts, nextUint32) {
  const deck = shuffleDeck(buildRoleDeck(counts), nextUint32)
  return deck.map((r, i) => ({ seat: i + 1, key: r.key, label: r.label, faction: r.faction, revealed: false }))
}

// 夜晚步骤清单：仅包含板子中存在的角色，固定以天亮收尾
function stepSequence(counts) {
  const steps = []
  const c = (k) => Math.max(0, Math.round(Number(counts[k]) || 0))
  if (c('wolf') + c('whiteWolfKing') > 0) {
    steps.push({ id: 'wolves', title: '狼人请睁眼', line: '狼人请睁眼，互相确认队友，并统一今晚的刀口目标（请比出座位号）。白狼王若首晚出局可发动技能。狼人请闭眼。' })
  }
  if (c('witch') > 0) {
    steps.push({ id: 'witch', title: '女巫请睁眼', line: '女巫请睁眼。昨晚倒牌的是这位（法官比手势），你要使用解药吗？要使用毒药吗？（本局规则：能否自救、能否同晚双药请提前约定）女巫请闭眼。' })
  }
  if (c('hunter') > 0) {
    steps.push({ id: 'hunter', title: '猎人请睁眼', line: '猎人请睁眼，记住你的座位号。今晚能否开枪以法官手势为准：拇指向上可开枪，向下不可。猎人请闭眼。' })
  }
  if (c('seer') > 0) {
    steps.push({ id: 'seer', title: '预言家请睁眼', line: '预言家请睁眼，你要查验几号？（法官比手势：拇指向上为好人，向下为狼人）预言家请闭眼。' })
  }
  steps.push({ id: 'dawn', title: '天亮了', line: '天亮了，所有玩家请睁眼。法官宣布昨晚死讯（无人死亡/第 X 号玩家死亡），随后进入警长竞选与白天环节。' })
  return steps
}

// 标记出局：幂等（重复标记同一座位不产生重复记录），返回新数组
function markDead(deadSeats, seat) {
  if (deadSeats.indexOf(seat) !== -1) return deadSeats.slice()
  return [...deadSeats, seat]
}

function reviveSeat(deadSeats, seat) {
  return deadSeats.filter(s => s !== seat)
}
// ==== CORE END ====

// ---------- 浏览器随机源（仅在点击回调内被调用） ----------
const browserUint32 = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const a = new Uint32Array(1)
    crypto.getRandomValues(a)
    return a[0]
  }
  return Math.floor(Math.random() * 4294967296)
}

// ---------- 板子配置 ----------
const boardOptions = [
  { key: 'standard12', label: BOARDS.standard12.label },
  { key: 'easy9', label: BOARDS.easy9.label },
  { key: 'custom', label: '自定义板子' }
]
const boardKey = ref('easy9')
const playerCount = ref(9)
const customCounts = ref({ whiteWolfKing: 0, wolf: 3, seer: 1, witch: 1, hunter: 1, villager: 3 })

const currentCounts = computed(() => {
  if (boardKey.value === 'custom') return customCounts.value
  return BOARDS[boardKey.value].counts
})

const boardTotal = computed(() =>
  ROLE_DEFS.reduce((acc, r) => acc + Math.max(0, Math.round(Number(currentCounts.value[r.key]) || 0)), 0)
)

const wolfTotal = computed(() => {
  const c = currentCounts.value
  return Math.max(0, Math.round(Number(c.wolf) || 0)) + Math.max(0, Math.round(Number(c.whiteWolfKing) || 0))
})

const countMismatch = computed(() => boardTotal.value !== playerCount.value)
const canDeal = computed(() => boardTotal.value >= 4 && wolfTotal.value >= 1)

const selectBoard = (key) => {
  boardKey.value = key
  if (key !== 'custom') playerCount.value = BOARDS[key].seats
}

const changeCustomCount = (key, delta) => {
  const cur = Math.max(0, Math.round(Number(customCounts.value[key]) || 0))
  const next = cur + delta
  if (next < 0 || next > 9) return
  if (next > cur && boardTotal.value >= 20) return
  customCounts.value[key] = next
  playerCount.value = boardTotal.value
}

// ---------- 发牌与翻牌 ----------
const factionMeta = {
  wolf: { label: '狼人阵营', cls: 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400' },
  god: { label: '神职', cls: 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400' },
  villager: { label: '好人', cls: 'bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400' }
}

const seats = ref([])
const deadSeats = ref([])
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const deal = () => {
  if (!canDeal.value) return
  seats.value = dealRoles(currentCounts.value, browserUint32)
  deadSeats.value = []
  currentStep.value = -1
}

const toggleReveal = (seat) => {
  const found = seats.value.find(s => s.seat === seat)
  if (found) found.revealed = !found.revealed
}

const revealAll = () => { seats.value.forEach(s => { s.revealed = true }) }
const hideAll = () => { seats.value.forEach(s => { s.revealed = false }) }

// ---------- 夜晚流程 ----------
const steps = computed(() => stepSequence(currentCounts.value))
const currentStep = ref(-1)
const activeStep = computed(() => {
  if (currentStep.value < 0 || currentStep.value >= steps.value.length) return null
  return steps.value[currentStep.value]
})

const nextStep = () => {
  if (currentStep.value < steps.value.length - 1) currentStep.value += 1
}
const prevStep = () => {
  if (currentStep.value > 0) currentStep.value -= 1
}

// ---------- 出局记录 ----------
const deadSet = computed(() => new Set(deadSeats.value))
const isDead = (seat) => deadSet.value.has(seat)
const aliveSeats = computed(() => seats.value.filter(s => !isDead(s.seat)).map(s => s.seat))
const seatOf = (seat) => seats.value.find(s => s.seat === seat)

const toggleDead = (seat) => {
  deadSeats.value = isDead(seat) ? reviveSeat(deadSeats.value, seat) : markDead(deadSeats.value, seat)
}
const reviveAll = () => { deadSeats.value = [] }

// ---------- 分段计时器 ----------
const segments = [
  { label: '警长竞选', sec: 180 },
  { label: '玩家发言', sec: 120 },
  { label: '集中投票', sec: 60 }
]
const activeSegment = ref('玩家发言')
const timerMinutes = ref(2)
const timerTotal = ref(120)
const timerRemaining = ref(120)
const timerRunning = ref(false)
let timerId = null

const applySegment = (seg) => {
  stopTimer()
  activeSegment.value = seg.label
  timerTotal.value = seg.sec
  timerRemaining.value = seg.sec
  timerMinutes.value = Math.round((seg.sec / 60) * 10) / 10
}

const applyMinutes = () => {
  const m = Math.min(30, Math.max(0.5, Number(timerMinutes.value) || 2))
  timerMinutes.value = m
  stopTimer()
  activeSegment.value = ''
  timerTotal.value = Math.round(m * 60)
  timerRemaining.value = Math.round(m * 60)
}

const stopTimer = () => {
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
  timerRunning.value = false
}

const resetTimer = () => {
  stopTimer()
  timerRemaining.value = timerTotal.value
}

// 到点提示音：Web Audio 本地合成，不依赖任何音频文件；仅在回调/定时器内创建
const playChime = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9)
    osc.start()
    osc.stop(ctx.currentTime + 1)
    setTimeout(() => { ctx.close() }, 1600)
  } catch (e) { /* 浏览器不支持时仅靠弹窗提醒 */ }
}

const toggleTimer = () => {
  if (timerRunning.value) {
    stopTimer()
    return
  }
  if (timerRemaining.value <= 0) timerRemaining.value = timerTotal.value
  timerRunning.value = true
  timerId = setInterval(() => {
    timerRemaining.value -= 1
    if (timerRemaining.value <= 0) {
      timerRemaining.value = 0
      stopTimer()
      playChime()
      if (typeof alert === 'function') alert('时间到！本环节结束，请法官推进流程。')
    }
  }, 1000)
}

const mmss = computed(() => {
  const s = Math.max(0, timerRemaining.value)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
})

const timerPercent = computed(() => {
  if (timerTotal.value <= 0) return 0
  return Math.max(0, Math.min(100, (timerRemaining.value / timerTotal.value) * 100))
})

onUnmounted(() => {
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
})
</script>
