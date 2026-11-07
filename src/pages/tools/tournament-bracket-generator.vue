<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Swords class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">淘汰赛对阵表生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴队名自动生成单败淘汰对阵：蛇形种子位、轮空自动分配给前排种子、逐轮填比分自动晋级、SVG 导出与 A4 打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线淘汰赛对阵表生成器：粘贴队名（每行一个，2-64 队）一键生成单败淘汰对阵树——规模自动补齐到 2 的幂，
        轮空（bye）按标准规则分给最前的种子、首轮对手为最后种子位；种子按标准蛇形分布（8 队 1v8/4v5/2v7/3v6，
        16 队 1v16/8v9/5v12/4v13…），可随机洗牌或按输入顺序手动定种子（第一行 = 1 号种子）。
        逐轮填写比分后胜者自动晋级下一轮、冠军徽章自动点亮；对阵树以 SVG 横向渲染，可导出 .svg 文件或 A4 打印。
        种子与轮空规则以通行口径为准（Wikipedia《Seeding (sports)》标准表），全部计算本地完成。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Users class="w-5 h-5 mr-2 text-primary" /> 参赛名单
        </h2>

        <div class="space-y-2">
          <label for="teams-input" class="text-sm font-medium text-foreground">队名（每行一个，2-64 队；顺序即种子顺序）</label>
          <textarea
            id="teams-input"
            v-model="teamsInput"
            rows="10"
            placeholder="第一行 = 1 号种子&#10;例如：&#10;红队&#10;蓝队&#10;黄队&#10;绿队"
            class="w-full px-3 py-2.5 border border-border bg-background rounded-lg text-sm text-foreground font-mono leading-relaxed resize-y"
          ></textarea>
          <p class="text-xs text-muted-foreground">当前 <span class="font-semibold text-foreground">{{ parsedTeams.length }}</span> 支队伍（自动忽略空行与首尾空格；队名最长 16 字）</p>
          <p v-if="teamsError" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ teamsError }}</span>
          </p>
        </div>

        <!-- 排序方式 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">种子排序</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="sortMode = 'manual'"
              class="px-3 py-2.5 rounded-lg border text-sm font-medium transition"
              :class="sortMode === 'manual' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/80'"
            >
              手动种子（按行序）
            </button>
            <button
              @click="sortMode = 'random'"
              class="px-3 py-2.5 rounded-lg border text-sm font-medium transition flex items-center justify-center gap-1.5"
              :class="sortMode === 'random' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/80'"
            >
              <Shuffle class="w-4 h-4" /> 随机洗牌
            </button>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            {{ sortMode === 'manual' ? '手动种子：名单第一行为 1 号种子，第二行 2 号……按标准蛇形位置入座（1、2 号分居上下半区，只在决赛相遇）。' : '随机洗牌：生成时把名单打乱后再按行序定种子，适合抽签。' }}
          </p>
        </div>

        <button
          @click="generate"
          class="w-full px-4 py-3.5 rounded-lg text-base font-semibold transition flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:opacity-90"
        >
          <Swords class="w-5 h-5" /> 生成对阵表
        </button>

        <!-- 概览 -->
        <div v-if="rounds.length" class="bg-muted/50 rounded-xl p-4 space-y-1.5 text-sm">
          <p class="text-muted-foreground">规模：<span class="font-bold text-foreground font-mono">{{ bracketSize }}</span> 签位（补齐到 2 的幂）</p>
          <p class="text-muted-foreground">轮空：<span class="font-bold text-foreground font-mono">{{ byeCount }}</span> 个<span v-if="byeSeeds.length">，分给种子 {{ byeSeeds.join('、') }}（首轮对手为最后种子位=轮空）</span></p>
          <p class="text-muted-foreground">轮次：<span class="font-bold text-foreground font-mono">{{ rounds.length }}</span> 轮（首轮 {{ rounds[0].length }} 场）</p>
          <div v-if="champion" class="pt-2 flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-sm font-bold">
              <Crown class="w-4 h-4" /> 冠军：{{ champion }}
            </span>
          </div>
        </div>
      </div>

      <!-- 右：对阵树 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Trophy class="w-5 h-5 mr-2 text-primary" /> 对阵树
          </h2>
          <div v-if="rounds.length" class="flex gap-2">
            <button
              @click="exportSvg"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 border border-border rounded-lg text-foreground transition flex items-center gap-1.5"
            >
              <Download class="w-4 h-4" /> 导出 SVG
            </button>
            <button
              @click="printBracket"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 border border-border rounded-lg text-foreground transition flex items-center gap-1.5"
            >
              <Printer class="w-4 h-4" /> A4 打印
            </button>
          </div>
        </div>

        <!-- 未生成占位 -->
        <div v-if="!rounds.length" class="bg-muted/50 rounded-xl p-8 text-center">
          <Swords class="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p class="text-sm text-muted-foreground">在左侧粘贴队名后点「生成对阵表」：轮空自动分给最前种子，比分逐轮填写、胜者自动晋级。</p>
        </div>

        <!-- 逐轮比分填写 -->
        <div v-else class="space-y-4">
          <div
            v-for="(round, ri) in rounds"
            :key="'round-' + ri"
            class="space-y-2"
          >
            <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {{ roundName(ri, rounds.length) }} <span class="font-mono normal-case">（{{ round.length }} 场）</span>
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              <div
                v-for="(m, mi) in round"
                :key="'m-' + ri + '-' + mi"
                class="bg-muted/50 rounded-xl p-3 space-y-2"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="flex-1 min-w-0 text-sm truncate rounded px-2 py-1"
                    :class="slotClass(m, m.a)"
                  >{{ m.a || (m.bye ? '轮空' : '待定') }}</span>
                  <input
                    v-model.number="m.sa"
                    type="number"
                    min="0"
                    class="w-12 px-1 py-1 border border-border bg-background rounded text-center text-sm font-bold text-foreground font-mono"
                    :aria-label="'第' + (ri + 1) + '轮第' + (mi + 1) + '场 A 队比分'"
                    @change="onScore(ri, mi)"
                  />
                  <span class="text-xs text-muted-foreground">:</span>
                  <input
                    v-model.number="m.sb"
                    type="number"
                    min="0"
                    class="w-12 px-1 py-1 border border-border bg-background rounded text-center text-sm font-bold text-foreground font-mono"
                    :aria-label="'第' + (ri + 1) + '轮第' + (mi + 1) + '场 B 队比分'"
                    @change="onScore(ri, mi)"
                  />
                  <span
                    class="flex-1 min-w-0 text-sm truncate rounded px-2 py-1 text-right"
                    :class="slotClass(m, m.b)"
                  >{{ m.b || (m.bye ? '轮空' : '待定') }}</span>
                </div>
                <p class="text-[10px] text-muted-foreground">
                  <template v-if="m.bye">轮空场：{{ m.a }} 直接晋级</template>
                  <template v-else-if="tbWinnerOf(m)">{{ tbWinnerOf(m) }} 晋级</template>
                  <template v-else-if="m.a && m.b && m.sa !== null && m.sb !== null && m.sa !== '' && m.sb !== '' && Number(m.sa) === Number(m.sb)">比分相同，请分出胜负</template>
                  <template v-else>填入两队比分后胜者自动晋级</template>
                </p>
              </div>
            </div>
          </div>

          <!-- SVG 括号图 -->
          <div class="space-y-2">
            <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">括号图（横向，随比分自动更新）</p>
            <div class="overflow-auto border border-border rounded-lg bg-background p-3 bracket-print">
              <div v-html="svgHtml"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12 group">
      <summary class="text-base font-semibold flex items-center cursor-pointer select-none text-muted-foreground">
        <Info class="w-4 h-4 mr-2 text-primary" /> 种子与轮空规则说明、常见问题（点击展开）
      </summary>

      <h2 class="text-2xl font-bold text-foreground mt-4 mb-4"><span class="text-primary mr-2">#</span>种子与轮空：标准规则说明（以通行规则为准）</h2>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">蛇形（Serpentine）种子位分布</h3>
      <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
        单败淘汰的标准种子排布目标是：最强的选手/队伍尽量晚相遇——1、2 号种子分居两个半区、只能在决赛相遇；
        同一轮里两颗种子的号码之和相等（16 队首轮每场之和均为 17，半决赛每场之和均为 5）。
        通行蛇形表如下（Wikipedia《Seeding (sports)》标准示例）：
      </p>
      <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground mb-4">
        <li><span class="font-semibold text-foreground">8 队满员</span>：首轮 1v8、4v5、2v7、3v6；半决赛 1/8 胜者对 4/5 胜者、2/7 胜者对 3/6 胜者。</li>
        <li><span class="font-semibold text-foreground">16 队满员</span>：首轮 1v16、8v9、5v12、4v13、3v14、6v11、7v10、2v15。</li>
        <li>四分之一区结构：1 号种子所在四分之一区为 {1,8,9,16}，2 号所在为 {2,7,10,15}，保证 1、2 决赛才相遇。</li>
      </ul>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">轮空（Bye）怎么分？</h3>
      <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
        队数不是 2 的幂时，签位补齐到 2^⌈log₂n⌉，缺额数 = 2^k − n 即为轮空数；通行规则（Wikipedia《Bracket (tournament)》）
        是轮空分给最前的种子：5 队时规模 8、轮空 3 个，分给种子 1、2、3——它们的首轮对手正是"最后种子位"
        （6、7、8 号位，位置上无人），因此首轮轮空；种子 4 对 5 唯一真打。1 号种子永远从第二轮打起，且轮空对手不会是真实队伍。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">单败 vs 双败</h3>
      <p class="text-sm text-muted-foreground leading-relaxed mb-4">
        单败淘汰（Single Elimination）输一场即出局，赛程最短：n 队共 n−1 场，适合参赛多、时间紧的场合，
        但强队一次发挥失常即遭淘汰，名次说服力弱、下半区队伍比赛场次少。双败淘汰（Double Elimination）
        把队伍分入胜者组与败者组：胜者组输球掉入败者组还有一次机会，决赛常打"胜者组冠军 vs 败者组冠军"，
        必要时加赛一场（Bracket Reset）——总场次约 2n−2 到 2n−1 场，更公平但赛程几乎翻倍。
        本工具生成的是单败对阵；规模、种子与轮空逻辑与体育赛事、电竞赛事的通行做法一致。
      </p>

      <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-semibold text-foreground">5 支队怎么对阵？</h3>
          <p class="text-sm text-muted-foreground mt-1">规模补到 8 签位、共 3 个轮空：种子 1、2、3 首轮轮空直接进第二轮，唯一的首轮比赛是 4 号种子对 5 号种子。第二轮起按对阵树正常进行。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">「手动种子」和「随机洗牌」的区别？</h3>
          <p class="text-sm text-muted-foreground mt-1">手动种子按粘贴顺序定种子（第一行 = 1 号种子），适合已有排名或上一轮成绩的赛事；随机洗牌把名单打乱后再定种子，相当于抽签，适合杯赛第一轮。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">改了前面的比分，后面会怎样？</h3>
          <p class="text-sm text-muted-foreground mt-1">胜者自动晋级；若某场胜者因改分而变化，其下游所有场次的对阵与比分自动清空重填，避免脏数据。比分相同视为未分出胜负，不晋级。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">导出与打印是什么效果？</h3>
          <p class="text-sm text-muted-foreground mt-1">「导出 SVG」下载矢量对阵图（可无损缩放、可插到文档/公众号排版）；「A4 打印」调起系统打印，只打印括号图区域，建议横向纸张。两种都完全在本地完成。</p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'tournament-bracket-generator'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Swords, Users, Shuffle, Printer, Download, Info, Crown, Trophy, TriangleAlert, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '淘汰赛对阵表生成器 - 单败淘汰签表/SVG导出/A4打印',
  description: '免费在线淘汰赛对阵表生成器：粘贴队名（2-64 队）自动生成单败淘汰对阵树，蛇形种子位分布（8队1v8/4v5/2v7/3v6），轮空自动分配给前排种子，逐轮填比分自动晋级、冠军徽章，SVG 横向括号图导出与 A4 打印，本地运行零上传',
  keywords: '淘汰赛对阵表,对阵表生成器,赛程表生成,单败淘汰,轮空规则,种子排位,比赛抽签,bracket generator',
  author: '有条工具',
  ogTitle: '淘汰赛对阵表生成器 - 蛇形种子/自动轮空/SVG导出 | 有条工具',
  ogDescription: '粘贴队名生成单败淘汰对阵：标准蛇形种子、轮空自动分配、逐轮晋级、SVG 导出与 A4 打印。',
  ogUrl: 'https://www.util.cn/tools/tournament-bracket-generator',
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
          name: '淘汰赛对阵表生成器',
          url: 'https://www.util.cn/tools/tournament-bracket-generator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['2-64 队粘贴名单一键生成单败淘汰对阵树', '标准蛇形种子位（1v8/4v5/2v7/3v6、1v16/8v9…）', '轮空自动分配给最前种子（bye 数=2^k−n）', '手动种子（首行=1号种子）或随机洗牌抽签', '逐轮填写比分、胜者自动晋级、改分自动清空下游', '冠军徽章与轮次统计', 'SVG 横向括号图渲染、导出 .svg 与 A4 打印', '本地运行零上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '淘汰赛对阵表生成器', item: 'https://www.util.cn/tools/tournament-bracket-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '5 支队怎么对阵？轮空分给谁？',
              acceptedAnswer: { '@type': 'Answer', text: '规模补到 8 签位、共 3 个轮空，按通行规则分给最前的种子 1、2、3——它们的首轮对手是最后种子位（6/7/8 号位，位置无人）；唯一的首轮比赛是 4 号种子对 5 号种子。' }
            },
            {
              '@type': 'Question',
              name: '蛇形种子位是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '让强队晚相遇的标准排布：1、2 号种子分居两个半区只在决赛相遇，同轮对阵种子号之和相等（8 队首轮 1v8/4v5/2v7/3v6；16 队首轮 1v16/8v9/5v12/4v13/3v14/6v11/7v10/2v15）。' }
            },
            {
              '@type': 'Question',
              name: '改了前面的比分，后面会怎样？',
              acceptedAnswer: { '@type': 'Answer', text: '胜者自动晋级；若改分导致胜者变化，其下游场次的对阵与比分自动清空重填；比分相同视为未分出胜负、不晋级。' }
            },
            {
              '@type': 'Question',
              name: '单败和双败淘汰有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '单败输一场即出局，共 n−1 场、赛程最短；双败有胜者组与败者组两次机会，总场次约 2n−2 到 2n−1 场、更公平但赛程翻倍。本工具生成单败对阵。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== TESTABLE-BEGIN: 对阵表纯逻辑（蛇形种子 + 轮空分配 + 晋级传播 + SVG，可独立单测） =====
// 标准蛇形种子位序列：order(2)=[1,2]；倍增时对每个 x 依次展开为 [x, 2s+1−x]
// 8 队 → [1,8,4,5,2,7,3,6]（R1: 1v8/4v5/2v7/3v6）；16 队 → [1,16,8,9,4,13,5,12,2,15,7,10,3,14,6,11]
function tbSeedOrder(size) {
  let arr = [1]
  while (arr.length < size) {
    const n = arr.length * 2 + 1
    const next = []
    for (const x of arr) {
      next.push(x)
      next.push(n - x)
    }
    arr = next
  }
  return arr
}

// 规模：最小的不小于 n 的 2 的幂（n≥2）
function tbBracketSize(n) {
  let s = 2
  while (s < n) s *= 2
  return s
}
function tbByeCount(n) {
  return tbBracketSize(n) - n
}

// 单场胜者：轮空场直接晋级；双队且比分有效且不等 → 高分者；否则 null
function tbWinnerOf(m) {
  if (m.bye) return m.a
  if (m.a && m.b && m.sa !== null && m.sb !== null && m.sa !== '' && m.sb !== '') {
    const a = Number(m.sa)
    const b = Number(m.sb)
    if (Number.isFinite(a) && Number.isFinite(b) && a !== b) return a > b ? m.a : m.b
  }
  return null
}

// 构建对阵：teams[0] = 1 号种子；返回轮次数组 rounds[r][i] = { a, b, sa, sb, bye }
function tbBuildBracket(teams) {
  const n = teams.length
  const size = tbBracketSize(Math.max(2, n))
  const order = tbSeedOrder(size)
  const slotOf = order.map((seed) => (seed <= n ? teams[seed - 1] : null))
  const rounds = []
  // 首轮：相邻两两配对；对手缺席 → 轮空场（直接晋级）
  const r0 = []
  for (let i = 0; i < size; i += 2) {
    const a = slotOf[i]
    const b = slotOf[i + 1]
    r0.push({ a, b, sa: '', sb: '', bye: !!(a && !b || (!a && b)) })
  }
  // 轮空场规范化：把真实队伍放到 a 位
  for (const m of r0) {
    if (!m.a && m.b) {
      m.a = m.b
      m.b = null
    }
  }
  rounds.push(r0)
  // 后续轮空场位
  let count = size / 2
  while (count > 1) {
    count /= 2
    rounds.push(Array.from({ length: count }, () => ({ a: null, b: null, sa: '', sb: '', bye: false })))
  }
  // 首轮轮空直接晋级
  tbPropagateFrom(rounds, 0)
  return rounds
}

// 从第 ri 轮起向前传播胜者（下游对阵变化时清空其比分）
function tbPropagateFrom(rounds, ri) {
  for (let r = ri; r < rounds.length; r++) {
    for (let i = 0; i < rounds[r].length; i++) {
      const cur = rounds[r][i]
      const w = tbWinnerOf(cur)
      if (r + 1 < rounds.length) {
        const nm = rounds[r + 1][i >> 1]
        const slot = (i & 1) === 0 ? 'a' : 'b'
        if (nm[slot] !== w) {
          nm[slot] = w
          nm.sa = ''
          nm.sb = ''
        }
      }
    }
  }
}

// 深拷贝（纯数据）
function tbClone(rounds) {
  return rounds.map((r) => r.map((m) => ({ ...m })))
}

// 填比分：克隆 → 写入 → 自该轮起重新传播（胜者变化时下游比分自动作废）
function tbSetScore(rounds, ri, mi, sa, sb) {
  const rs = tbClone(rounds)
  const m = rs[ri][mi]
  m.sa = sa
  m.sb = sb
  tbPropagateFrom(rs, ri)
  return rs
}

// 冠军：最后一轮唯一一场的胜者
function tbChampion(rounds) {
  if (!rounds.length) return ''
  const final = rounds[rounds.length - 1][0]
  return tbWinnerOf(final) || ''
}

// 轮空种子列表（按场次顺序）
function tbByeSeeds(rounds, n) {
  const order = tbSeedOrder(tbBracketSize(Math.max(2, n)))
  const out = []
  for (let i = 0; i < rounds[0].length; i++) {
    if (rounds[0][i].bye) {
      const s1 = order[i * 2]
      const s2 = order[i * 2 + 1]
      out.push(Math.min(s1, s2))
    }
  }
  return out
}

// 随机洗牌（Fisher-Yates，rng 可注入便于测试）
function tbShuffle(arr, rng = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const t = a[i]
    a[i] = a[j]
    a[j] = t
  }
  return a
}

// 名单解析：每行一个，去空行与首尾空格，最长 16 字
function tbParseTeams(text) {
  return String(text || '')
    .split('\n')
    .map((s) => s.trim().slice(0, 16))
    .filter((s) => s.length > 0)
}

// XML 转义与名字截断
function tbEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function tbTrunc(s, n = 12) {
  const t = String(s || '')
  return t.length > n ? t.slice(0, n - 1) + '…' : t
}

// 括号 SVG（横向树）：rowH 行高、colW 列宽；轮空场用灰色斜体标注
function tbBuildSvg(rounds, title) {
  if (!rounds || !rounds.length) return ''
  const ROW_H = 46
  const COL_W = 196
  const BOX_W = 150
  const BOX_H = 34
  const r1Count = rounds[0].length
  const width = (rounds.length + 1) * COL_W + 20
  const height = r1Count * ROW_H + 50
  const parts = []
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="system-ui, -apple-system, sans-serif">`)
  parts.push(`<rect width="${width}" height="${height}" fill="#ffffff"/>`)
  parts.push(`<text x="14" y="26" font-size="15" font-weight="700" fill="#111">${tbEscape(tbTrunc(title || '', 40))}</text>`)
  // 坐标
  const pos = []
  for (let r = 0; r < rounds.length; r++) {
    pos.push([])
    for (let i = 0; i < rounds[r].length; i++) {
      let cy
      if (r === 0) cy = 50 + i * ROW_H + BOX_H / 2
      else {
        const prev = pos[r - 1]
        cy = (prev[i * 2].cy + prev[i * 2 + 1].cy) / 2
      }
      pos[r].push({ cx: 14 + r * COL_W, cy })
    }
  }
  // 连接线（肘形）
  for (let r = 0; r < rounds.length - 1; r++) {
    for (let i = 0; i < rounds[r].length; i++) {
      const p = pos[r][i]
      const q = pos[r + 1][i >> 1]
      const x1 = p.cx + BOX_W
      const x2 = q.cx
      const xm = (x1 + x2) / 2
      parts.push(`<path d="M ${x1} ${p.cy} H ${xm} V ${q.cy} H ${x2}" fill="none" stroke="#c4c4c4" stroke-width="1.5"/>`)
    }
  }
  // 盒子
  const NAMES = ['a', 'b']
  for (let r = 0; r < rounds.length; r++) {
    for (let i = 0; i < rounds[r].length; i++) {
      const m = rounds[r][i]
      const p = pos[r][i]
      const w = tbWinnerOf(m)
      parts.push(`<rect x="${p.cx}" y="${p.cy - BOX_H / 2}" width="${BOX_W}" height="${BOX_H}" rx="6" fill="#fafafa" stroke="#d4d4d4"/>`)
      for (let s = 0; s < 2; s++) {
        const name = m[NAMES[s]]
        const isWin = w && name === w
        const ty = p.cy - BOX_H / 2 + (s === 0 ? BOX_H / 2 : BOX_H)
        const fill = !name ? '#a3a3a3' : isWin ? '#166534' : '#333333'
        const weight = isWin ? '700' : '400'
        const text = !name ? (m.bye ? '轮空' : '待定') : tbTrunc(name, 11)
        parts.push(`<text x="${p.cx + 8}" y="${p.cy - BOX_H / 2 + (s === 0 ? 14 : BOX_H - 4)}" font-size="12" font-weight="${weight}" fill="${fill}"${!name ? ' font-style="italic"' : ''}>${tbEscape(text)}${isWin ? ' ✓' : ''}</text>`)
      }
      const mid = p.cy - 1
      parts.push(`<line x1="${p.cx}" y1="${mid}" x2="${p.cx + BOX_W}" y2="${mid}" stroke="#d4d4d4" stroke-width="1"/>`)
    }
  }
  // 冠军盒
  const champ = tbChampion(rounds)
  const cp = pos[rounds.length - 1][0]
  const cx = 14 + rounds.length * COL_W
  parts.push(`<rect x="${cx}" y="${cp.cy - 22}" width="BOXW" height="44" rx="8" fill="#fffbeb" stroke="#f59e0b"/>`.replace('BOXW', String(COL_W - 40)))
  parts.push(`<text x="${cx + 12}" y="${cp.cy - 5}" font-size="11" fill="#b45309">冠军</text>`)
  parts.push(`<text x="${cx + 12}" y="${cp.cy + 13}" font-size="13" font-weight="700" fill="#92400e">${tbEscape(champ ? tbTrunc(champ, 10) : '待产生')}</text>`)
  parts.push('</svg>')
  return parts.join('')
}
// ===== TESTABLE-END =====

// ---------- 页面状态 ----------
const teamsInput = ref('')
const sortMode = ref('manual')
const teamsError = ref('')
const rounds = ref([])
const bracketTitle = ref('淘汰赛对阵表')

const parsedTeams = computed(() => tbParseTeams(teamsInput.value))
const bracketSize = computed(() => (rounds.value.length ? tbBracketSize(rounds.value[0].length * 2) : 0))
const byeCount = computed(() => (rounds.value.length ? tbByeCount(rounds.value[0].length * 2) : 0))
const byeSeeds = computed(() => (rounds.value.length ? tbByeSeeds(rounds.value, rounds.value[0].length * 2) : []))
const champion = computed(() => tbChampion(rounds.value))
const svgHtml = computed(() => tbBuildSvg(rounds.value, bracketTitle.value))

const ROUND_NAMES = ['首轮', '第二轮', '四分之一决赛', '半决赛', '决赛']
function roundName(ri, total) {
  if (ri === total - 1) return '决赛'
  const fromEnd = total - 1 - ri
  if (fromEnd === 1) return '半决赛'
  if (fromEnd === 2) return '四分之一决赛'
  return ROUND_NAMES[ri] || `第 ${ri + 1} 轮`
}

function slotClass(m, name) {
  const w = tbWinnerOf(m)
  if (w && name === w) return 'bg-green-500/10 text-green-700 dark:text-green-400 font-semibold'
  if (name) return 'bg-background border border-border text-foreground'
  return 'bg-muted/60 text-muted-foreground italic'
}

function generate() {
  teamsError.value = ''
  let teams = parsedTeams.value
  if (teams.length < 2 || teams.length > 64) {
    teamsError.value = `请填写 2-64 支队伍（当前 ${teams.length} 支）。`
    return
  }
  if (sortMode.value === 'random') teams = tbShuffle(teams)
  rounds.value = tbBuildBracket(teams)
  bracketTitle.value = `淘汰赛对阵表（${teams.length} 队）`
}

function onScore(ri, mi) {
  const m = rounds.value[ri][mi]
  const sa = m.sa === '' || m.sa === null ? '' : Math.max(0, Math.floor(Number(m.sa) || 0))
  const sb = m.sb === '' || m.sb === null ? '' : Math.max(0, Math.floor(Number(m.sb) || 0))
  rounds.value = tbSetScore(rounds.value, ri, mi, sa, sb)
}

function exportSvg() {
  const svg = tbBuildSvg(rounds.value, bracketTitle.value)
  if (!svg) return
  try {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tournament-bracket.svg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    alert('已导出 tournament-bracket.svg（矢量图，可无损缩放）。')
  } catch {
    alert('导出失败：浏览器限制了下载，请截图或使用打印功能。')
  }
}

function printBracket() {
  window.print()
}

onMounted(() => {
  addRecentTool('tournament-bracket-generator')
})
</script>

<style scoped>
details summary::-webkit-details-marker {
  display: none;
}

@media print {
  body * {
    visibility: hidden;
  }
  .bracket-print,
  .bracket-print * {
    visibility: visible;
  }
  .bracket-print {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: none !important;
  }
}
</style>
