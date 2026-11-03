<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Music2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">吉他和弦图查询</h1>
          <p class="text-sm text-muted-foreground mt-1">常用吉他和弦指法查询：SVG 指板图、逐弦按法说明、横按提示与逐弦试听</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线吉他和弦图工具：内置 40+ 个常用和弦（大调、小调、七和弦、挂留与强力五和弦）的标准指法数据，选择根音与和弦性质即可查看对应指板图——
        含 x / o 空弦标记、按点指法数字、横按粗条与品位标签；每根弦提供按法文字说明，可单独试听任意一根弦或整串琶音，
        全部计算与发声均在浏览器本地完成，配合站内调音器、节拍器即可完成「调弦 → 学按 → 跟拍」的入门闭环。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：和弦选择面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Music class="w-5 h-5 mr-2 text-primary" /> 选择和弦
        </h2>

        <!-- 根音 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">根音（12 个半音）</p>
          <div class="grid grid-cols-6 gap-1.5">
            <button
              v-for="root in ROOTS"
              :key="root"
              type="button"
              @click="selectedRoot = root"
              class="px-0 py-2 rounded-md border text-sm font-semibold transition"
              :class="selectedRoot === root
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/40 text-foreground border-border hover:bg-muted'"
              :aria-pressed="selectedRoot === root"
            >
              {{ root }}
            </button>
          </div>
        </div>

        <!-- 和弦性质 -->
        <div>
          <label for="chord-quality" class="text-sm font-medium text-foreground block mb-2">和弦性质</label>
          <select
            id="chord-quality"
            v-model="selectedQuality"
            class="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="q in QUALITIES" :key="q.id" :value="q.id">{{ q.label }}</option>
          </select>
        </div>

        <!-- 常用和弦快捷面板 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">入门常用和弦</p>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="key in BEGINNER_CHORDS"
              :key="key"
              type="button"
              @click="pickChord(key)"
              class="px-0 py-2 rounded-md border text-sm font-semibold transition"
              :class="currentKey === key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/40 text-foreground border-border hover:bg-muted'"
            >
              {{ key }}
            </button>
          </div>
          <button
            type="button"
            @click="pickRandomChord"
            class="mt-2 w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 随机来一个和弦
          </button>
        </div>

        <!-- 未收录提示 -->
        <div v-if="!currentChord" class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3.5 space-y-2">
          <p class="text-sm font-medium text-foreground flex items-center">
            <Info class="w-4 h-4 mr-1.5 text-amber-500" /> {{ currentKey }} 该和弦暂未收录
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">和弦库以常用指法为主，可以试试 {{ selectedRoot }} 根音下的这些已收录和弦：</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="alt in suggestions"
              :key="alt.key"
              type="button"
              @click="pickChord(alt.key)"
              class="px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition"
            >
              {{ alt.name }}
            </button>
          </div>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          图例：× 不弹、○ 空弦、圆点上的数字表示按弦手指（1 食指 / 2 中指 / 3 无名指 / 4 小指）、粗圆条表示横按。
        </p>
      </div>

      <!-- 右：大指板图 + 按法说明（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex items-baseline gap-3">
            <span class="text-4xl font-bold text-foreground">{{ currentChord ? currentChord.name : currentKey }}</span>
            <span class="text-sm text-muted-foreground">{{ currentQualityLabel }}</span>
          </div>
          <button
            type="button"
            @click="playArpeggio"
            :disabled="!currentChord"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 试听琶音（6 弦 → 1 弦）
          </button>
        </div>

        <!-- 大指板图 -->
        <div v-if="currentChord" class="flex justify-center">
          <div class="w-full max-w-[460px]" v-html="chordSvg"></div>
        </div>

        <!-- 横按徽章 -->
        <div v-if="currentChord && currentChord.barre" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <CheckCircle class="w-4 h-4 text-primary" />
          <span class="text-xs font-medium text-foreground">
            需横按：第 {{ currentChord.barre.fret }} 品，{{ currentChord.barre.from }} 弦 → {{ currentChord.barre.to }} 弦（食指放平压住整排弦）
          </span>
        </div>

        <!-- 逐弦按法说明 -->
        <div v-if="currentChord">
          <p class="text-sm font-medium text-foreground mb-2">按法文字说明（点击右侧喇叭可试听该弦）</p>
          <ul class="divide-y divide-border rounded-lg border border-border overflow-hidden">
            <li v-for="(line, i) in chordTextLines" :key="i" class="flex items-center justify-between gap-3 px-3.5 py-2 bg-muted/30">
              <span class="text-sm text-foreground">{{ line }}</span>
              <button
                type="button"
                @click="playString(i)"
                :disabled="currentChord.frets[i] === 'x'"
                class="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition disabled:opacity-30 disabled:cursor-not-allowed"
                :aria-label="`试听第 ${6 - i} 弦`"
                title="试听这一根弦"
              >
                <Volume2 class="w-4 h-4" />
              </button>
            </li>
          </ul>
        </div>

        <p v-if="!currentChord" class="text-sm text-muted-foreground leading-relaxed py-8 text-center">
          当前组合暂未收录指法，请从左侧「已收录和弦」中选择，或改用入门常用和弦。
        </p>

        <p class="text-xs text-muted-foreground leading-relaxed">
          提示：试听使用 WebAudio 合成音（三角波短音），按标准调弦 E2-A2-D3-G3-B3-E4（82.41 / 110.00 / 146.83 / 196.00 / 246.94 / 329.63 Hz）
          逐弦按品位换算音高，琶音间隔 200ms，仅作音位参考；练习时请以真实乐器听感为准。
        </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>和弦图怎么读？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          和弦图是一张「竖起来的指板」：图中 6 条竖线是 6 根琴弦（左边最粗的 E 弦，右边最细的 E 弦），横线是品格，顶部粗横线代表琴枕（上弦器）。
          弦上方的标记告诉你这根弦是否参与发声——「×」表示这根弦不弹（避免误扫到它），「○」表示空弦（左手不按，但要弹响）。
          指板上的圆点表示左手按弦的位置，圆点里的数字代表用哪根手指：1 = 食指、2 = 中指、3 = 无名指、4 = 小指。
          图左侧的数字是品格序号：如果显示 1-5 就是第一把位；当和弦位置较高时（例如 Bm 在第 2 品、Ebm 在第 6 品），图上方会标注「第 N 品起」。
          出现粗圆条（横按 / barre）时，表示要用一根手指（通常是食指）放平，同时按住标注范围内的多根弦。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">初学者先学哪几个和弦？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>入门「八大和弦」：C、G、D、A、E、Am、Em、Dm——全部不需要横按，两三个月内就能完成大部分流行歌的伴奏，本页快捷面板可一键切换查看。</li>
          <li>随后攻克 F 大横按（133211）：这是第一道坎，攻略一句话——食指先别使劲压满 6 根弦，把按弦的力气交给中指、无名指、小指去按 3 品 2 弦和 3、4 弦 2 品，食指只负责 1、2 弦和 6 弦这几根压不严的，再把手肘往身体方向收、拇指顶在琴颈背面借力。</li>
          <li>学会 F 之后就解锁了整族「E 形 / A 形横按」，Bm、B、Cm、F#m 等都只是同一手型平移品位。</li>
          <li>强力五和弦（C5、G5、A5、E5）只按 2-3 根弦，零基础当天就能弹出摇滚节奏，适合建立信心。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">横按（barre）怎么练？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          横按的核心不是「蛮力压死 6 根弦」，而是利用食指侧面靠拇指那条更硬的边缘去压，并让食指略微弯曲、贴着品丝后方约 3-5 毫米处发力（越靠近品丝越省力）。
          练习顺序建议：先练小横按（如 Dm7 的 1-2 弦横按、Esus4 的 1-5 弦横按）找食指放平的感觉；再用 F 检查每一根弦是否都能清晰发声——逐根弹响，
          发闷的那根微调食指的接触角度；最后练「A 形横按 + 平移」：按住 Bm 手型，保持手型不变整体上移或下移一格再弹，训练肌肉记忆。
          每次练习 5-10 分钟即可，食指酸痛（尤其是指关节）就要休息，虎口和大鱼际酸是正常的。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">和弦名后缀什么意思？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>无后缀（C、G）：大三和弦 = 根音 + 大三度 + 纯五度，听感明亮，是流行歌的主力。</li>
          <li>m（Am、Dm）：小三和弦，把三音降半音，听感暗淡忧伤。</li>
          <li>7（G7、A7）：属七和弦，在三和弦基础上加降七音，制造「想回到主和弦」的推动力，布鲁斯与终止式常客。</li>
          <li>maj7（Cmaj7、Fmaj7）：大七和弦，加大七音（不是降七音！），爵士与城市流行的慵懒感来源。</li>
          <li>m7（Am7、Em7）：小七和弦 = 小三和弦 + 小七度，比小三和弦更柔和、更「悬」。</li>
          <li>sus4 / sus2（Dsus4、Asus2）：挂留和弦，用四度（或二度）替换三音，三度没了所以「不分大小调」，常用在主和弦前面制造延迟解决的效果。</li>
          <li>5（C5、E5）：强力五和弦（Power Chord），只有根音 + 五度，没有三音所以无所谓大小调，失真摇滚的标准姿势。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">和站内调音器、节拍器配合练习</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          推荐的练习闭环：先用站内「吉他调音器」把 6 根弦调到标准音 E2-A2-D3-G3-B3-E4（本页试听也基于这套频率，弦不准时听感和音名都会对不上）；
          再来本页挑 3 个和弦（例如 C、G、Em），对着指板图把手指位置按熟，用「逐弦试听」检查每一根参与的弦是否发清晰（发闷多半是别的手指指肚蹭到了相邻弦）；
          最后打开站内「在线节拍器」，从 60 BPM 开始，每小节换一次和弦，稳定后再提速到 80-100 BPM。和弦切换顺了之后，
          用本页「随机来一个和弦」功能做每日 10 分钟的随机反应训练，对即兴伴奏很有帮助。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">和弦图上的 × 和 ○ 是什么意思？</h3>
            <p class="text-sm text-muted-foreground mt-1">× 表示该弦不弹（扫弦时避开它），○ 表示空弦——左手不用按，但要弹响。圆点里的数字 1-4 表示按弦手指：食指、中指、无名指、小指；粗圆条是横按标记。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">F 和弦按不响怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">别用食指蛮力压满 6 根弦：把力气留给中指、无名指、小指去按 2、3 品的音，食指只负责压不严的几根弦，并让其略微侧偏、靠近品丝发力。先逐根弹响检查，再练平移手型，每次 5-10 分钟即可。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么同一个和弦有不同的按法？</h3>
            <p class="text-sm text-muted-foreground mt-1">同一个和弦在指板上有多处音位组合，不同按法音色与把位不同，也影响与前后和弦的衔接难度。本页收录的是各和弦最通用的教学指法（第一把位优先），适合入门与绝大多数弹唱场景。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">试听的音和我的吉他不一样？</h3>
            <p class="text-sm text-muted-foreground mt-1">试听是 WebAudio 合成音，按标准调弦与平均律换算音高，仅用于核对音位；真实吉他的音色、延音与手感都不同，另外请先用调音器确认琴弦音准，弦不准时会对不上音。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'chord-chart-viewer'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Music2, Play, CheckCircle, ChevronUp, ChevronDown,
  Info, RefreshCw, Music, Volume2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '吉他和弦图查询 - 在线和弦指法表查询工具（含按法说明与试听）',
  description: '免费在线吉他和弦图查询工具，内置 40+ 常用和弦标准指法：C 调和弦、大调小调、七和弦、挂留与强力五和弦，SVG 指板图标注 x/o 空弦、按点指法数字与横按，逐弦按法文字说明、琶音试听，吉他入门必备，纯浏览器本地运行',
  keywords: '吉他和弦图,和弦指法,c 调和弦,和弦查询,吉他入门和弦',
  author: '有条工具',
  ogTitle: '吉他和弦图查询 - 在线和弦指法表查询工具 | 有条工具',
  ogDescription: '40+ 常用和弦标准指法，SVG 指板图 + 逐弦按法说明 + 琶音试听，横按与入门八大和弦一页搞定。',
  ogUrl: 'https://www.util.cn/tools/chord-chart-viewer',
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
          name: '吉他和弦图查询',
          url: 'https://www.util.cn/tools/chord-chart-viewer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['40+ 常用和弦标准指法库', 'SVG 指板图（x/o 标记、指法数字、横按条、品位标签）', '逐弦按法文字说明', 'WebAudio 逐弦试听与琶音播放', '入门八大和弦快捷面板', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '吉他和弦图查询', item: 'https://www.util.cn/tools/chord-chart-viewer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '和弦图上的 × 和 ○ 是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '× 表示该弦不弹（扫弦时避开它），○ 表示空弦——左手不用按但要弹响。圆点里的数字 1-4 表示按弦手指：食指、中指、无名指、小指；粗圆条是横按（barre）标记。' }
            },
            {
              '@type': 'Question',
              name: 'F 和弦按不响怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '别用食指蛮力压满 6 根弦：把力气留给中指、无名指、小指去按 2、3 品的音，食指只负责压不严的几根弦，并让其略微侧偏、靠近品丝发力。先逐根弹响检查，再练平移手型，每次 5-10 分钟即可。' }
            },
            {
              '@type': 'Question',
              name: '为什么同一个和弦有不同的按法？',
              acceptedAnswer: { '@type': 'Answer', text: '同一个和弦在指板上有多处音位组合，不同按法音色与把位不同，也影响与前后和弦的衔接难度。本页收录的是各和弦最通用的教学指法（第一把位优先），适合入门与绝大多数弹唱场景。' }
            },
            {
              '@type': 'Question',
              name: '试听的音和我的吉他不一样？',
              acceptedAnswer: { '@type': 'Answer', text: '试听是 WebAudio 合成音，按标准调弦 E2-A2-D3-G3-B3-E4 与平均律换算音高，仅用于核对音位；请先用调音器确认琴弦音准，弦不准时会对不上音。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const STRING_COUNT = 6
const FRET_ROWS = 5
// 标准调弦 EADGBE（6 弦 → 1 弦）空弦频率，A4 = 440Hz，与站内吉他调音器同一口径
const BASE_FREQS = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63]
const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'E']
const FINGER_NAMES = { 1: '食指', 2: '中指', 3: '无名指', 4: '小指' }
const FINGER_DIGITS = { 1: '1', 2: '2', 3: '3', 4: '4' }
const ROOTS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const QUALITIES = [
  { id: 'major', suffix: '', label: '大三和弦（无后缀）' },
  { id: 'minor', suffix: 'm', label: '小三和弦（m）' },
  { id: '7', suffix: '7', label: '属七和弦（7）' },
  { id: 'maj7', suffix: 'maj7', label: '大七和弦（maj7）' },
  { id: 'm7', suffix: 'm7', label: '小七和弦（m7）' },
  { id: 'sus2', suffix: 'sus2', label: '挂二和弦（sus2）' },
  { id: 'sus4', suffix: 'sus4', label: '挂四和弦（sus4）' },
  { id: '5', suffix: '5', label: '强力五和弦（5）' }
]
const BEGINNER_CHORDS = ['C', 'G', 'D', 'A', 'E', 'Am', 'Em', 'Dm', 'F']

// 由根音 + 性质 + 按品数据构建一条和弦记录（barre: { fret, from, to }，from/to 为弦号 1 最细 ~ 6 最粗）
function buildChord(root, quality, frets, fingers, barre) {
  const suffix = (QUALITIES.find((q) => q.id === quality) || {}).suffix || ''
  return { key: root + suffix, name: root + suffix, root, quality, frets, fingers, barre: barre || null }
}

// ---------- 和弦库：通用教学标准指法（第一把位优先），frets 从 6 弦到 1 弦，'x' = 不弹 ----------
const CHORD_LIST = [
  // 大三和弦（12 个根音全覆盖）
  buildChord('C', 'major', ['x', 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0], null),
  buildChord('C#', 'major', ['x', 4, 6, 6, 6, 4], [0, 1, 2, 3, 4, 1], { fret: 4, from: 1, to: 5 }),
  buildChord('D', 'major', ['x', 'x', 0, 2, 3, 2], [0, 0, 1, 3, 2, 0], null),
  buildChord('Eb', 'major', ['x', 6, 8, 8, 8, 6], [0, 1, 2, 3, 4, 1], { fret: 6, from: 1, to: 5 }),
  buildChord('E', 'major', [0, 2, 2, 1, 0, 0], [0, 2, 3, 1, 0, 0], null),
  buildChord('F', 'major', [1, 3, 3, 2, 1, 1], [1, 1, 2, 3, 4, 1], { fret: 1, from: 1, to: 6 }),
  buildChord('F#', 'major', [2, 4, 4, 3, 2, 2], [1, 1, 2, 3, 4, 1], { fret: 2, from: 1, to: 6 }),
  buildChord('G', 'major', [3, 2, 0, 0, 0, 3], [3, 2, 0, 0, 0, 4], null),
  buildChord('Ab', 'major', [4, 6, 6, 5, 4, 4], [1, 1, 2, 3, 4, 1], { fret: 4, from: 1, to: 6 }),
  buildChord('A', 'major', ['x', 0, 2, 2, 2, 0], [0, 0, 1, 2, 3, 0], null),
  buildChord('Bb', 'major', ['x', 1, 3, 3, 3, 1], [0, 1, 2, 3, 4, 1], { fret: 1, from: 1, to: 5 }),
  buildChord('B', 'major', ['x', 2, 4, 4, 4, 2], [0, 1, 2, 3, 4, 1], { fret: 2, from: 1, to: 5 }),
  // 小三和弦
  buildChord('E', 'minor', [0, 2, 2, 0, 0, 0], [0, 2, 3, 0, 0, 0], null),
  buildChord('A', 'minor', ['x', 0, 2, 2, 1, 0], [0, 0, 2, 3, 1, 0], null),
  buildChord('D', 'minor', ['x', 'x', 0, 2, 3, 1], [0, 0, 2, 3, 1, 0], null),
  buildChord('B', 'minor', ['x', 2, 4, 4, 3, 2], [0, 1, 4, 3, 2, 1], { fret: 2, from: 1, to: 5 }),
  buildChord('C', 'minor', ['x', 3, 5, 5, 4, 3], [0, 1, 3, 4, 2, 1], { fret: 3, from: 1, to: 5 }),
  buildChord('G', 'minor', [3, 5, 5, 3, 3, 3], [1, 1, 3, 4, 1, 1], { fret: 3, from: 1, to: 6 }),
  buildChord('F', 'minor', [1, 3, 3, 1, 1, 1], [1, 1, 3, 4, 1, 1], { fret: 1, from: 1, to: 6 }),
  buildChord('F#', 'minor', [2, 4, 4, 2, 2, 2], [1, 1, 3, 4, 1, 1], { fret: 2, from: 1, to: 6 }),
  buildChord('Bb', 'minor', ['x', 1, 3, 3, 2, 1], [0, 1, 3, 4, 2, 1], { fret: 1, from: 1, to: 5 }),
  buildChord('Eb', 'minor', ['x', 6, 8, 8, 7, 6], [0, 1, 3, 4, 2, 1], { fret: 6, from: 1, to: 5 }),
  // 属七和弦
  buildChord('C', '7', ['x', 3, 2, 3, 1, 0], [0, 3, 2, 4, 1, 0], null),
  buildChord('D', '7', ['x', 'x', 0, 2, 1, 2], [0, 0, 2, 1, 3, 0], null),
  buildChord('E', '7', [0, 2, 0, 1, 0, 0], [0, 2, 0, 1, 0, 0], null),
  buildChord('F', '7', [1, 3, 1, 2, 1, 1], [1, 3, 1, 2, 1, 1], { fret: 1, from: 1, to: 6 }),
  buildChord('G', '7', [3, 2, 0, 0, 0, 1], [3, 2, 0, 0, 0, 1], null),
  buildChord('A', '7', ['x', 0, 2, 0, 2, 0], [0, 2, 0, 3, 0, 0], null),
  buildChord('B', '7', ['x', 2, 1, 2, 0, 2], [0, 2, 1, 3, 0, 4], null),
  // 大七和弦
  buildChord('C', 'maj7', ['x', 3, 2, 0, 0, 0], [0, 3, 2, 0, 0, 0], null),
  buildChord('G', 'maj7', [3, 2, 0, 0, 0, 2], [3, 2, 0, 0, 0, 1], null),
  buildChord('F', 'maj7', ['x', 'x', 3, 2, 1, 0], [0, 0, 3, 2, 1, 0], null),
  buildChord('D', 'maj7', ['x', 'x', 0, 2, 2, 2], [0, 0, 1, 1, 1, 1], { fret: 2, from: 1, to: 3 }),
  // 小七和弦
  buildChord('A', 'm7', ['x', 0, 2, 0, 1, 0], [0, 0, 2, 0, 1, 0], null),
  buildChord('E', 'm7', [0, 2, 2, 0, 3, 0], [0, 2, 3, 0, 1, 0], null),
  buildChord('D', 'm7', ['x', 'x', 0, 2, 1, 1], [0, 0, 2, 1, 1, 0], { fret: 1, from: 1, to: 2 }),
  buildChord('B', 'm7', ['x', 2, 4, 2, 3, 2], [0, 1, 3, 1, 4, 1], { fret: 2, from: 1, to: 5 }),
  // 挂留和弦
  buildChord('D', 'sus4', ['x', 'x', 0, 2, 3, 3], [0, 0, 1, 3, 4, 0], null),
  buildChord('A', 'sus4', ['x', 0, 2, 2, 3, 0], [0, 0, 1, 2, 3, 0], null),
  buildChord('E', 'sus4', [0, 2, 2, 2, 2, 0], [0, 1, 1, 1, 1, 0], { fret: 2, from: 1, to: 5 }),
  buildChord('D', 'sus2', ['x', 'x', 0, 2, 3, 0], [0, 0, 1, 3, 0, 0], null),
  buildChord('A', 'sus2', ['x', 0, 2, 2, 0, 0], [0, 0, 1, 2, 0, 0], null),
  // 强力五和弦（Power Chord）
  buildChord('C', '5', ['x', 3, 5, 5, 'x', 'x'], [0, 1, 3, 4, 0, 0], null),
  buildChord('G', '5', [3, 5, 5, 'x', 'x', 'x'], [1, 3, 4, 0, 0, 0], null),
  buildChord('A', '5', ['x', 0, 2, 2, 'x', 'x'], [0, 0, 1, 2, 0, 0], null),
  buildChord('E', '5', [0, 2, 2, 'x', 'x', 'x'], [0, 1, 2, 0, 0, 0], null),
  buildChord('D', '5', ['x', 'x', 0, 2, 3, 'x'], [0, 0, 1, 3, 0, 0], null)
]
const CHORD_LIBRARY = Object.fromEntries(CHORD_LIST.map((c) => [c.key, c]))

// XML 转义（SVG 内联文本安全）
function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]))
}

// 按品换算频率：freq = base × 2^(fret/12)（十二平均律）
function fretToFreq(baseFreq, fret) {
  if (typeof fret !== 'number' || fret < 0) return 0
  return baseFreq * Math.pow(2, fret / 12)
}

// 计算指板图起始品位：最高按品 ≤ 5 时从第 1 品画起，否则下移窗口
function chordStartFret(chord) {
  let max = 0
  for (const f of chord.frets) {
    if (typeof f === 'number' && f > max) max = f
  }
  return max <= FRET_ROWS ? 1 : max - FRET_ROWS + 1
}

// 查询和弦 + 未收录时给出同根音的可用替代
function findChord(key) {
  return Object.prototype.hasOwnProperty.call(CHORD_LIBRARY, key) ? CHORD_LIBRARY[key] : null
}
function sameRootChords(root) {
  return CHORD_LIST.filter((c) => c.root === root)
}

// 和弦 → SVG 字符串（纯函数，SSR 可渲染）：6 弦 × 5 品网格、弦名、x/o 标记、按点+指法数字、横按条、品位标签
function chordToSvg(chord, opts = {}) {
  const startFret = opts.startFret || chordStartFret(chord)
  const padL = 40, padT = 48, padR = 18, padB = 34
  const stringGap = 28, fretGap = 32, dotR = 10
  const width = padL + stringGap * 5 + padR
  const height = padT + fretGap * FRET_ROWS + padB
  const nutY = padT
  const colX = (i) => padL + i * stringGap // i: 0..5 → 6 弦..1 弦
  const rowY = (rel) => nutY + (rel - 0.5) * fretGap
  const fg = 'var(--foreground,#111827)'
  const muted = 'var(--muted-foreground,#6b7280)'
  const border = 'var(--border,#e5e7eb)'
  const primary = 'var(--primary,#2563eb)'
  const p = []
  p.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="${escapeXml(chord.name)} 和弦指法图" font-family="system-ui, sans-serif">`)
  // 品格横线（第 1 把位时顶部为粗琴枕）
  for (let r = 0; r <= FRET_ROWS; r++) {
    const y = nutY + r * fretGap
    const isNut = startFret === 1 && r === 0
    p.push(`<line x1="${padL}" y1="${y}" x2="${padL + stringGap * 5}" y2="${y}" stroke="${isNut ? fg : border}" stroke-width="${isNut ? 5 : 1.2}" stroke-linecap="round"/>`)
  }
  // 6 根弦竖线（低音弦略粗）
  for (let i = 0; i < STRING_COUNT; i++) {
    p.push(`<line x1="${colX(i)}" y1="${nutY}" x2="${colX(i)}" y2="${nutY + FRET_ROWS * fretGap}" stroke="${muted}" stroke-width="${i <= 1 ? 1.6 : 1.1}" stroke-linecap="round"/>`)
  }
  // 左侧品位标签（绝对品号）
  for (let r = 0; r < FRET_ROWS; r++) {
    const y = nutY + (r + 0.5) * fretGap
    p.push(`<text x="${padL - 10}" y="${y}" dy="0.35em" text-anchor="end" font-size="11" fill="${muted}">${startFret + r}</text>`)
  }
  // 高把位提示
  if (startFret > 1) {
    p.push(`<text x="${padL + stringGap * 2.5}" y="${nutY - 32}" text-anchor="middle" font-size="12" font-weight="600" fill="${fg}">第 ${startFret} 品起</text>`)
  }
  // x / o 空弦标记
  chord.frets.forEach((f, i) => {
    if (f === 'x') {
      p.push(`<text x="${colX(i)}" y="${nutY - 14}" text-anchor="middle" font-size="13" fill="${muted}">×</text>`)
    } else if (f === 0) {
      p.push(`<circle cx="${colX(i)}" cy="${nutY - 19}" r="4.2" fill="none" stroke="${muted}" stroke-width="1.6" data-open="s${STRING_COUNT - i}"/>`)
    }
  })
  // 横按条
  if (chord.barre && chord.barre.fret >= startFret) {
    const rel = chord.barre.fret - startFret + 1
    if (rel >= 1 && rel <= FRET_ROWS) {
      const fromIdx = STRING_COUNT - chord.barre.to
      const toIdx = STRING_COUNT - chord.barre.from
      const x1 = colX(fromIdx) - dotR
      const x2 = colX(toIdx) + dotR
      p.push(`<rect x="${x1}" y="${rowY(rel) - dotR}" width="${x2 - x1}" height="${dotR * 2}" rx="${dotR}" fill="${primary}" fill-opacity="0.85" data-barre="fret${chord.barre.fret}s${chord.barre.from}-${chord.barre.to}"/>`)
    }
  }
  // 按点 + 指法数字
  chord.frets.forEach((f, i) => {
    if (f === 'x' || f === 0) return
    const rel = f - startFret + 1
    if (rel < 1 || rel > FRET_ROWS) return
    p.push(`<circle cx="${colX(i)}" cy="${rowY(rel)}" r="${dotR}" fill="${primary}" data-dot="s${STRING_COUNT - i}f${f}"/>`)
    const finger = chord.fingers && chord.fingers[i]
    const digit = FINGER_DIGITS[finger]
    if (digit) {
      p.push(`<text x="${colX(i)}" y="${rowY(rel)}" dy="0.35em" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">${digit}</text>`)
    }
  })
  // 底部弦名
  STRING_NAMES.forEach((n, i) => {
    p.push(`<text x="${colX(i)}" y="${nutY + FRET_ROWS * fretGap + 22}" text-anchor="middle" font-size="12" font-weight="600" fill="${muted}">${n}</text>`)
  })
  p.push('</svg>')
  return p.join('')
}

// 和弦 → 每弦一行文字说明（6 弦 → 1 弦）
function chordToText(chord) {
  return chord.frets.map((f, i) => {
    const strNo = STRING_COUNT - i
    if (f === 'x') return `${strNo} 弦：不弹`
    if (f === 0) return `${strNo} 弦：空弦`
    const finger = chord.fingers && FINGER_NAMES[chord.fingers[i]]
    return `${strNo} 弦：${f} 品${finger ? `，${finger}` : ''}`
  })
}

// ---------- 页面状态 ----------
const selectedRoot = ref('C')
const selectedQuality = ref('major')
const seoContentVisible = ref(true)

const currentKey = computed(() => {
  const q = QUALITIES.find((x) => x.id === selectedQuality.value) || QUALITIES[0]
  return selectedRoot.value + q.suffix
})
const currentChord = computed(() => findChord(currentKey.value))
const currentQualityLabel = computed(() => {
  const q = QUALITIES.find((x) => x.id === selectedQuality.value)
  return q ? q.label : ''
})
const suggestions = computed(() => (currentChord.value ? [] : sameRootChords(selectedRoot.value)))
const chordSvg = computed(() => (currentChord.value ? chordToSvg(currentChord.value) : ''))
const chordTextLines = computed(() => (currentChord.value ? chordToText(currentChord.value) : []))

function pickChord(key) {
  const chord = findChord(key)
  if (!chord) return
  selectedRoot.value = chord.root
  selectedQuality.value = chord.quality
}

function pickRandomChord() {
  const chord = CHORD_LIST[Math.floor(Math.random() * CHORD_LIST.length)]
  pickChord(chord.key)
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- Web Audio 试听（仅在用户回调中触发，SSR 安全） ----------
let audioCtx = null

function ensureAudioCtx() {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) audioCtx = new Ctx()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function pluckNote(ctx, freq, when) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.linearRampToValueAtTime(0.35, when + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 1.0)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(when)
  osc.stop(when + 1.1)
}

function playString(i) {
  const chord = currentChord.value
  if (!chord) return
  const fret = chord.frets[i]
  if (fret === 'x' || typeof fret !== 'number') return
  const ctx = ensureAudioCtx()
  if (!ctx) return
  pluckNote(ctx, fretToFreq(BASE_FREQS[i], fret), ctx.currentTime + 0.02)
}

function playArpeggio() {
  const chord = currentChord.value
  if (!chord) return
  const ctx = ensureAudioCtx()
  if (!ctx) return
  const t0 = ctx.currentTime + 0.03
  chord.frets.forEach((fret, i) => {
    if (fret === 'x' || typeof fret !== 'number') return
    pluckNote(ctx, fretToFreq(BASE_FREQS[i], fret), t0 + i * 0.2) // 逐弦琶音，间隔 200ms
  })
}

onMounted(() => {
  addRecentTool('chord-chart-viewer')
})

onBeforeUnmount(() => {
  if (audioCtx) {
    audioCtx.close().catch(() => {})
    audioCtx = null
  }
})
</script>
