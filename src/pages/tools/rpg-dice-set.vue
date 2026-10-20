<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3 flex items-center gap-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Dices class="h-7 w-7 text-primary" />
        </div>
        跑团骰子集 - 多面骰池投掷与 COC/DND 检定
      </h1>
      <p class="text-muted-foreground">
        面向桌面角色扮演（TRPG）的在线骰子工具：d4 / d6 / d8 / d10 / d12 / d20 / d100 任意组合成骰子池，加正负修正值一键投掷；内置 DND 5e 的 d20 属性检定与 COC 克苏鲁的呼唤 d100 技能检定，自动判定大成功、困难成功、大失败等等级。随机源使用浏览器密码级随机数 crypto.getRandomValues 并以拒绝法消除取模偏差，全部在本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 模式切换 -->
    <div class="flex flex-wrap gap-2 mb-6">
      <button
        v-for="m in modes"
        :key="m.key"
        @click="mode = m.key"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
          mode === m.key
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
        ]"
      >
        <component :is="m.icon" class="w-4 h-4" />
        {{ m.label }}
      </button>
    </div>

    <!-- ===== 模式一：骰子池投掷 ===== -->
    <div v-if="mode === 'pool'" class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
          <Dices class="w-5 h-5 text-primary" /> 骰子池配置
        </h2>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div
            v-for="faces in DIE_TYPES"
            :key="faces"
            class="bg-muted/50 rounded-lg p-3 text-center space-y-2"
          >
            <p class="text-sm font-bold text-foreground">d{{ faces }}</p>
            <div class="flex items-center justify-center gap-1.5">
              <button
                @click="changeCount(faces, -1)"
                class="w-7 h-7 flex items-center justify-center bg-background border border-border rounded-md hover:bg-accent text-foreground text-sm"
                aria-label="减少"
              >−</button>
              <input
                v-model.number="pool[faces]"
                type="number"
                min="0"
                max="20"
                class="w-12 text-center px-1 py-1 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                @click="changeCount(faces, 1)"
                class="w-7 h-7 flex items-center justify-center bg-background border border-border rounded-md hover:bg-accent text-foreground text-sm"
                aria-label="增加"
              >+</button>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">修正值（±整数）</label>
          <div class="flex items-center gap-3">
            <button
              @click="modifier = Math.max(-99, safeModifier - 1)"
              class="w-10 h-10 flex items-center justify-center bg-muted rounded-lg hover:bg-muted/80 text-foreground"
            >−</button>
            <input
              v-model.number="modifier"
              type="number"
              class="flex-1 px-3 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              @click="modifier = Math.min(99, safeModifier + 1)"
              class="w-10 h-10 flex items-center justify-center bg-muted rounded-lg hover:bg-muted/80 text-foreground"
            >+</button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">骰池共 {{ totalDice }} 颗（上限 20 颗），总点数 = 各骰之和 + 修正值</p>
        </div>

        <button
          @click="rollPool"
          :disabled="totalDice === 0"
          class="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <RefreshCw class="w-5 h-5" />
          投掷 {{ currentExpression || '（先添加骰子）' }}
        </button>
      </div>

      <div class="bg-card border border-border rounded-lg p-6 flex flex-col">
        <h2 class="text-lg font-semibold text-foreground mb-4">投掷结果</h2>

        <div v-if="lastRoll" class="space-y-4">
          <div class="bg-primary/10 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">{{ lastRoll.expr }}</p>
            <p class="text-4xl font-bold text-primary">{{ lastRoll.total }}</p>
          </div>
          <div class="space-y-3">
            <div
              v-for="g in lastRoll.groups"
              :key="g.faces"
              class="flex items-center gap-3 flex-wrap p-3 bg-muted/50 rounded-lg"
            >
              <span class="text-sm font-medium text-foreground w-16">d{{ g.faces }} × {{ g.values.length }}</span>
              <div class="flex gap-1.5 flex-wrap">
                <span
                  v-for="(v, i) in g.values"
                  :key="i"
                  class="min-w-9 h-9 px-2 bg-background border border-border rounded-md flex items-center justify-center font-mono text-sm font-bold text-foreground"
                >{{ v }}</span>
              </div>
            </div>
            <div v-if="lastRoll.modifier !== 0" class="flex items-center gap-2 text-sm text-muted-foreground px-3">
              <span>修正值</span>
              <span class="font-mono font-bold text-foreground">{{ lastRoll.modifier > 0 ? '+' : '' }}{{ lastRoll.modifier }}</span>
              <span>= 骰面和 {{ lastRoll.sum }} {{ lastRoll.modifier > 0 ? '+' : '−' }} {{ Math.abs(lastRoll.modifier) }} → 总计 {{ lastRoll.total }}</span>
            </div>
          </div>
        </div>
        <div v-else class="flex-1 flex items-center justify-center text-muted-foreground text-sm py-12">
          配置骰子池后点击「投掷」查看逐骰明细
        </div>
      </div>
    </div>

    <!-- 骰池历史记录（两种结果视图共用） -->
    <div v-if="mode === 'pool'" class="bg-card border border-border rounded-lg p-6 mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
          <History class="w-5 h-5 text-primary" /> 投掷历史（保留最近 {{ HISTORY_LIMIT }} 次，本地保存）
        </h2>
        <button
          v-if="history.length > 0"
          @click="clearHistory"
          class="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground flex items-center gap-1"
        >
          <Trash2 class="w-4 h-4" /> 清空历史
        </button>
      </div>
      <div v-if="history.length > 0" class="space-y-2">
        <div
          v-for="(h, idx) in history"
          :key="idx"
          class="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg text-sm"
        >
          <div class="min-w-0">
            <p class="font-mono text-foreground truncate">{{ h.expr }}</p>
            <p class="text-xs text-muted-foreground mt-0.5">{{ h.detail }} · {{ h.time }}</p>
          </div>
          <span class="text-xl font-bold text-primary flex-shrink-0">{{ h.total }}</span>
        </div>
      </div>
      <p v-else class="text-sm text-muted-foreground">暂无历史记录</p>
    </div>

    <!-- ===== 模式二：DND d20 检定 ===== -->
    <div v-if="mode === 'dnd'" class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
          <Swords class="w-5 h-5 text-primary" /> DND d20 属性检定
        </h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          输入属性值（3-20）与熟练等加值，工具自动折算属性调整值 ⌊(属性−10)÷2⌋，掷 1d20 + 总加值，对照难度 DC 判定：天然 20 大成功、天然 1 大失败、其余按总点数是否达到 DC 判成功/失败。
        </p>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">属性值</label>
            <input
              v-model.number="dndAttr"
              type="number"
              min="3"
              max="30"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">额外加值</label>
            <input
              v-model.number="dndBonus"
              type="number"
              min="-10"
              max="20"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">难度 DC</label>
            <input
              v-model.number="dndDc"
              type="number"
              min="1"
              max="40"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <p class="text-xs text-muted-foreground">
          属性 {{ dndAttr }} → 调整值 <span class="font-mono font-bold text-foreground">{{ fmtSigned(dndAttrMod) }}</span>，合计加值 <span class="font-mono font-bold text-foreground">{{ fmtSigned(dndBonusTotal) }}</span>，需 1d20 ≥ {{ dndNeed }} 才成功
        </p>
        <button
          @click="rollDnd"
          class="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <Swords class="w-5 h-5" /> 掷 d20 检定
        </button>
      </div>

      <div class="bg-card border border-border rounded-lg p-6 flex flex-col">
        <h2 class="text-lg font-semibold text-foreground mb-4">检定结果</h2>
        <div v-if="dndResult" class="space-y-4">
          <div
            :class="[
              'rounded-lg p-4 text-center border',
              dndResult.outcome === '大成功' ? 'bg-green-500/10 border-green-500/30' : '',
              dndResult.outcome === '成功' ? 'bg-primary/10 border-primary/30' : '',
              dndResult.outcome === '失败' ? 'bg-muted/50 border-border' : '',
              dndResult.outcome === '大失败' ? 'bg-red-500/10 border-red-500/30' : ''
            ]"
          >
            <p class="text-xs text-muted-foreground mb-1">d20({{ dndResult.nat }}) {{ fmtSigned(dndResult.modifier) }} = {{ dndResult.total }} vs DC {{ dndResult.dc }}</p>
            <p
              :class="[
                'text-3xl font-bold',
                dndResult.outcome === '大成功' ? 'text-green-600 dark:text-green-400' : '',
                dndResult.outcome === '成功' ? 'text-primary' : '',
                dndResult.outcome === '失败' ? 'text-muted-foreground' : '',
                dndResult.outcome === '大失败' ? 'text-red-600 dark:text-red-400' : ''
              ]"
            >{{ dndResult.outcome }}</p>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center text-sm">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-xs text-muted-foreground mb-1">骰面</p>
              <p class="font-bold text-foreground font-mono">{{ dndResult.nat }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-xs text-muted-foreground mb-1">总加值</p>
              <p class="font-bold text-foreground font-mono">{{ fmtSigned(dndResult.modifier) }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-xs text-muted-foreground mb-1">结果</p>
              <p class="font-bold text-foreground font-mono">{{ dndResult.total }}</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">大成功=天然20，大失败=天然1（常见公开口径；若桌上约定属性检定不适用天然1/20，请以房规为准）。</p>
        </div>
        <div v-else class="flex-1 flex items-center justify-center text-muted-foreground text-sm py-12">
          点击左侧「掷 d20 检定」开始
        </div>
      </div>
    </div>

    <!-- ===== 模式三：COC d100 检定 ===== -->
    <div v-if="mode === 'coc'" class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
          <ScrollText class="w-5 h-5 text-primary" /> COC d100 技能检定
        </h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          输入技能值（1-100），掷 1d100 并按公开简化口径判定等级：≤技能值1/5 为极难成功，≤1/2 为困难成功，≤技能值为普通成功，大于技能值为失败，96-100 为大失败。
        </p>
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">技能值</label>
          <div class="flex items-center gap-3">
            <input
              v-model.number="cocSkill"
              type="number"
              min="1"
              max="100"
              class="flex-1 px-3 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              @click="rollCoc"
              class="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <ScrollText class="w-4 h-4" /> 掷 d100 检定
            </button>
          </div>
        </div>
        <div class="grid grid-cols-4 gap-2 text-center text-xs bg-muted/50 rounded-lg p-3">
          <div>
            <p class="text-muted-foreground mb-0.5">极难 ≤</p>
            <p class="font-bold text-foreground font-mono">{{ cocLevels.extreme }}</p>
          </div>
          <div>
            <p class="text-muted-foreground mb-0.5">困难 ≤</p>
            <p class="font-bold text-foreground font-mono">{{ cocLevels.hard }}</p>
          </div>
          <div>
            <p class="text-muted-foreground mb-0.5">成功 ≤</p>
            <p class="font-bold text-foreground font-mono">{{ cocLevels.regular }}</p>
          </div>
          <div>
            <p class="text-muted-foreground mb-0.5">大失败 ≥</p>
            <p class="font-bold text-red-600 dark:text-red-400 font-mono">96</p>
          </div>
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-6 flex flex-col">
        <h2 class="text-lg font-semibold text-foreground mb-4">检定结果</h2>
        <div v-if="cocResult" class="space-y-4">
          <div class="bg-primary/10 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">d100 = {{ cocResult.roll }}（技能 {{ cocResult.skill }}）</p>
            <p :class="['text-2xl font-bold', cocResult.gradeClass]">{{ cocResult.grade }}</p>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            判定口径：{{ cocResult.roll }}
            <template v-if="cocResult.roll >= 96"> ≥ 96，大失败</template>
            <template v-else-if="cocResult.roll <= cocLevels.extreme"> ≤ 极难阈值 {{ cocLevels.extreme }}（⌊技能/5⌋ 最小取 1），极难成功</template>
            <template v-else-if="cocResult.roll <= cocLevels.hard"> ≤ {{ cocLevels.hard }}（⌊技能/2⌋），困难成功</template>
            <template v-else-if="cocResult.roll <= cocResult.skill"> ≤ 技能值 {{ cocResult.skill }}，普通成功</template>
            <template v-else>&gt; 技能值 {{ cocResult.skill }}，失败</template>
          </p>
        </div>
        <div v-else class="flex-1 flex items-center justify-center text-muted-foreground text-sm py-12">
          输入技能值后点击「掷 d100 检定」
        </div>
      </div>
    </div>

    <!-- 公平性说明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        公平性说明：所有投掷使用浏览器密码级随机数 crypto.getRandomValues 产生 32 位无符号整数，并采用拒绝法——丢弃 ≥⌊2³²/面数⌋×面数 的样本后取模，从数学上保证每面等概率、无取模偏差；仅当环境缺少 crypto 时降级为 Math.random（结果仍随机但非密码级）。检定判定采用跑团圈常见公开口径，具体规则以你所在团规与规则书为准。数据全部在本页浏览器内生成与保存，不会上传。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于跑团骰子</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            桌面角色扮演（TRPG，俗称「跑团」）的核心机制是掷骰判定：龙与地下城（DND/D&amp;D）以 1d20 + 调整值对抗难度等级（DC），克苏鲁的呼唤（COC）以 1d100 不高于技能值判成功。除这两种骰子外，一套标准跑团骰子包含 d4、d6、d8、d10、d12、d20 七颗多面骰，伤害骰、技能加成等还会用到「几加几」表达式（如 2d6+3）与百分骰 d100。
          </p>
          <h3 class="text-lg font-semibold text-foreground">骰子池表达式怎么看</h3>
          <p>
            「NdM」表示投 N 颗 M 面骰并把点数相加，后面跟的修正值直接计入总和。例如 3d8+2 表示掷三颗八面骰（每颗 1-8）再 +2，结果范围是 5 到 26；本工具的骰子池模式支持 d4 到 d100 任意混搭，最多 20 颗，投掷后给出逐骰明细、骰面和与修正后总和，并可一键复制场景下在历史里回溯。
          </p>
          <h3 class="text-lg font-semibold text-foreground">拒绝法如何消除取模偏差</h3>
          <p>
            用 32 位随机整数（0 到 2³²−1 共 4,294,967,296 个值）直接对骰面数取模时，若 2³² 不能被面数整除，前若干个余数会比其他余数多摊到 1 个样本值，造成极微小偏差（如 d7 的「小点数」概率略高）。本工具先计算阈值 ⌊2³²/面数⌋×面数，凡是随机值 ≥ 阈值就重新抽样，使每个余数类恰好对应相同数量的随机值——数学上严格等概率。d4、d8、d16 等 2 的幂面数本就整除 2³²，一次即中、无需拒绝。
          </p>
          <h3 class="text-lg font-semibold text-foreground">DND 与 COC 的检定口径</h3>
          <p>
            DND 5e 的属性/技能检定是「1d20 + 属性调整值 + 熟练等加值 ≥ DC」：属性调整值等于 ⌊(属性值−10)÷2⌋，力量 15 即 +2；本工具按常见公开口径额外标注天然 20 大成功、天然 1 大失败。COC 的检定方向相反——骰出 1d100（100 记作 00）不高于技能值即成功，并按点数落入技能值的 1/5、1/2 与整值划分极难/困难/普通三档成功，高于技能值为失败、96-100 记大失败。两套判定逻辑都写在页面纯函数里，掷骰与判级结果一屏可读，方便新人 KP/DM 现场对照规则书。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">骰子结果公平吗？会被后台操控吗？</span>随机数由浏览器操作系统熵源的 crypto.getRandomValues 在本地生成，拒绝法保证每面严格等概率；页面不联网、无服务端参与，任何人都无法远程「安排点数」。</li>
            <li><span class="text-foreground font-medium">DND 属性检定天然 1 算大失败吗？</span>本工具按最常见的公开口径把天然 20 记大成功、天然 1 记大失败。严格按 5e 规则书，骰出 20/1 只在攻击骰有特殊意义，属性检定仍看总点数是否达标——两种口径都常见，以你桌上的房规为准。</li>
            <li><span class="text-foreground font-medium">COC 大失败是不是只看 96-100？</span>本工具采用公开简化口径：96-100 一律大失败。COC7 规则书中技能值 ≥ 96 时大失败区间会收窄到 100（00），需要更严格口径的守秘人可把大失败理解为「骰出 00」并自行调整。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'rpg-dice-set'" :category="'random'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Dices, Swords, ScrollText, RefreshCw, Trash2, History,
  AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '跑团骰子集 - 多面骰池投掷与 COC/DND 检定在线工具',
  description: '在线跑团骰子工具：d4/d6/d8/d10/d12/d20/d100 任意组合骰子池加修正值投掷，逐骰明细与历史记录；内置 DND d20 属性检定（大成功/大失败）与 COC d100 技能检定（极难/困难/普通成功/失败/大失败），随机源为密码级 crypto.getRandomValues 拒绝法无偏抽样，纯本地计算',
  keywords: '跑团骰子, 在线掷骰子, d20检定, d100检定, COC克苏鲁检定, DND属性检定, 多面骰子池, 骰子表达式',
  author: 'Util工具箱',
  ogTitle: '跑团骰子集 - 有条工具',
  ogDescription: 'd4-d100 骰子池投掷 + COC/DND 检定自动判定，密码级随机数无偏掷骰',
  ogUrl: 'https://www.util.cn/tools/rpg-dice-set',
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
          name: '跑团骰子集',
          url: 'https://www.util.cn/tools/rpg-dice-set',
          applicationCategory: 'GameApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['d4-d100 骰子池组合', '正负修正值', '逐骰明细与总和', '投掷历史本地保存', 'DND d20 检定大成功/大失败判定', 'COC d100 检定四级判定', '密码级无偏随机数']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '跑团骰子集', item: 'https://www.util.cn/tools/rpg-dice-set' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '骰子结果公平吗？会被后台操控吗？',
              acceptedAnswer: { '@type': 'Answer', text: '随机数由浏览器 crypto.getRandomValues 在本地生成，拒绝法保证每面严格等概率；页面不联网、无服务端参与，无法远程操控点数。' }
            },
            {
              '@type': 'Question',
              name: 'DND 属性检定天然 1 算大失败吗？',
              acceptedAnswer: { '@type': 'Answer', text: '本工具按最常见公开口径把天然 20 记大成功、天然 1 记大失败；严格 5e 规则中该口径主要适用于攻击骰，请以桌上房规为准。' }
            },
            {
              '@type': 'Question',
              name: 'COC 大失败是不是只看 96-100？',
              acceptedAnswer: { '@type': 'Answer', text: '本工具采用公开简化口径 96-100 一律大失败；COC7 中技能值 ≥96 时大失败区间收窄到 100，需按规则书调整口径。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'rpg-dice-set')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ==== CORE START ====
// 无偏整数抽样：拒绝法消除取模偏差。nextUint32 需返回 [0, 2^32) 的整数。
// 丢弃 >= limit 的样本后，每个余数类恰好对应 limit/faces 个随机值，严格等概率。
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

// 单颗骰子：结果恒在 [1, faces]
function rollDie(faces, nextUint32) {
  return randIntUnbiased(faces, nextUint32)
}

// entries: [{faces, count}]，返回逐骰分组、骰面和、修正后总和与表达式字符串
function rollGroups(entries, modifier, nextUint32) {
  const groups = []
  let sum = 0
  for (const e of entries) {
    if (!e.count || e.count < 1) continue
    const values = []
    for (let i = 0; i < e.count; i++) {
      const v = rollDie(e.faces, nextUint32)
      values.push(v)
      sum += v
    }
    groups.push({ faces: e.faces, values })
  }
  const mod = Math.round(Number(modifier) || 0)
  return { groups, sum, modifier: mod, total: sum + mod, expr: buildExpression(groups, mod) }
}

function buildExpression(groups, modifier) {
  if (groups.length === 0) return ''
  let expr = groups.map(g => g.values.length + 'd' + g.faces).join(' + ')
  if (modifier > 0) expr += ' + ' + modifier
  else if (modifier < 0) expr += ' - ' + Math.abs(modifier)
  return expr
}

// DND d20 检定：属性值折算调整值 ⌊(属性-10)/2⌋，加额外加值后与 DC 比较。
// 公开常见口径：天然 20 大成功、天然 1 大失败，其余 total >= dc 判成功。
function dndCheck(attr, bonus, dc, nextUint32) {
  const nat = rollDie(20, nextUint32)
  const a = Math.round(Number(attr) || 10)
  const attrMod = Math.floor((a - 10) / 2)
  const extra = Math.round(Number(bonus) || 0)
  const modifier = attrMod + extra
  const dcNum = Math.round(Number(dc) || 0)
  const total = nat + modifier
  let outcome
  if (nat === 20) outcome = '大成功'
  else if (nat === 1) outcome = '大失败'
  else outcome = total >= dcNum ? '成功' : '失败'
  return { nat, attrMod, extra, modifier, total, dc: dcNum, outcome }
}

// COC d100 判定（公开简化口径）：96-100 大失败；≤max(1,⌊s/5⌋) 极难（骰 1 必极限）；≤⌊s/2⌋ 困难；≤s 普通成功；否则失败
function cocGrade(roll, skill) {
  const s = Math.max(1, Math.min(100, Math.round(Number(skill) || 1)))
  const r = Math.max(1, Math.min(100, Math.round(Number(roll) || 1)))
  if (r >= 96) return '大失败'
  if (r <= Math.max(1, Math.floor(s / 5))) return '极难成功'
  if (r <= Math.floor(s / 2)) return '困难成功'
  if (r <= s) return '普通成功'
  return '失败'
}

function cocCheck(skill, nextUint32) {
  const roll = rollDie(100, nextUint32)
  const s = Math.max(1, Math.min(100, Math.round(Number(skill) || 1)))
  return { roll, skill: s, grade: cocGrade(roll, s) }
}
// ==== CORE END ====

// ---------- 页面状态 ----------
const DIE_TYPES = [4, 6, 8, 10, 12, 20, 100]
const HISTORY_LIMIT = 30
const HISTORY_KEY = 'rpg-dice-set-history'

const modes = [
  { key: 'pool', label: '骰子池投掷', icon: Dices },
  { key: 'dnd', label: 'DND d20 检定', icon: Swords },
  { key: 'coc', label: 'COC d100 检定', icon: ScrollText }
]
const mode = ref('pool')

// 浏览器无偏随机源：仅在点击回调内被调用时才触碰 crypto
const browserUint32 = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const a = new Uint32Array(1)
    crypto.getRandomValues(a)
    return a[0]
  }
  return Math.floor(Math.random() * 4294967296)
}

const pool = ref({ 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 1, 100: 0 })
const modifier = ref(0)
const lastRoll = ref(null)
const history = ref([])
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const safeModifier = computed(() => {
  const n = Number(modifier.value)
  return isFinite(n) ? Math.min(99, Math.max(-99, Math.round(n))) : 0
})

const totalDice = computed(() =>
  DIE_TYPES.reduce((acc, f) => acc + (Math.max(0, Math.round(Number(pool.value[f]) || 0))), 0)
)

const poolEntries = computed(() =>
  DIE_TYPES
    .map(f => ({ faces: f, count: Math.max(0, Math.round(Number(pool.value[f]) || 0)) }))
    .filter(e => e.count > 0)
)

const currentExpression = computed(() =>
  poolEntries.value.map(e => e.count + 'd' + e.faces).join(' + ') +
  (safeModifier.value > 0 ? ` + ${safeModifier.value}` : safeModifier.value < 0 ? ` - ${Math.abs(safeModifier.value)}` : '')
)

const changeCount = (faces, delta) => {
  const cur = Math.max(0, Math.round(Number(pool.value[faces]) || 0))
  const next = cur + delta
  if (next < 0 || next > 20) return
  if (next > cur && totalDice.value >= 20) return
  pool.value[faces] = next
}

const saveHistory = () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value.slice(0, HISTORY_LIMIT)))
  } catch (e) { /* 存储不可用时静默降级，仅内存记录 */ }
}

onMounted(() => {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(HISTORY_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) history.value = parsed.slice(0, HISTORY_LIMIT)
    }
  } catch (e) { /* 忽略损坏的历史数据 */ }
})

const timeLabel = () => {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
}

const rollPool = () => {
  if (totalDice.value === 0) return
  const result = rollGroups(poolEntries.value, safeModifier.value, browserUint32)
  lastRoll.value = result
  const detail = result.groups.map(g => `d${g.faces}[${g.values.join(',')}]`).join(' ')
  history.value.unshift({ expr: result.expr, total: result.total, detail, time: timeLabel() })
  if (history.value.length > HISTORY_LIMIT) {
    history.value = history.value.slice(0, HISTORY_LIMIT)
  }
  saveHistory()
}

const clearHistory = () => {
  history.value = []
  if (typeof localStorage !== 'undefined') {
    try { localStorage.removeItem(HISTORY_KEY) } catch (e) { /* 忽略 */ }
  }
}

// ---------- DND 检定 ----------
const dndAttr = ref(15)
const dndBonus = ref(0)
const dndDc = ref(15)
const dndResult = ref(null)

const dndAttrMod = computed(() => {
  const a = Math.round(Number(dndAttr.value) || 10)
  return Math.floor((a - 10) / 2)
})
const dndBonusTotal = computed(() => dndAttrMod.value + Math.round(Number(dndBonus.value) || 0))
const dndNeed = computed(() => {
  const dc = Math.round(Number(dndDc.value) || 0)
  return Math.max(2, Math.min(20, dc - dndBonusTotal.value))
})

const rollDnd = () => {
  dndResult.value = dndCheck(dndAttr.value, dndBonus.value, dndDc.value, browserUint32)
}

const fmtSigned = (v) => (v >= 0 ? `+${v}` : String(v))

// ---------- COC 检定 ----------
const cocSkill = ref(50)
const cocResult = ref(null)

const cocLevels = computed(() => {
  const s = Math.max(1, Math.min(100, Math.round(Number(cocSkill.value) || 1)))
  return {
    extreme: Math.max(1, Math.floor(s / 5)),
    hard: Math.floor(s / 2),
    regular: s
  }
})

const rollCoc = () => {
  const r = cocCheck(cocSkill.value, browserUint32)
  const gradeClassMap = {
    '极难成功': 'text-green-600 dark:text-green-400',
    '困难成功': 'text-emerald-600 dark:text-emerald-400',
    '普通成功': 'text-primary',
    '失败': 'text-muted-foreground',
    '大失败': 'text-red-600 dark:text-red-400'
  }
  cocResult.value = { ...r, gradeClass: gradeClassMap[r.grade] || 'text-foreground' }
}
</script>
