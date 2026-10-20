<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <LayoutGrid class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">班级座位表生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">导入名单自动排座 / 随机打乱 / 按成绩蛇形排布，拖拽微调后导出打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        导入名单按网格自动排座或随机打乱，可拖拽微调导出打印，班主任定期刚需。粘贴每行一名的学生名单（名字后可附数字成绩），
        设置行数、每排座位数与走道位置，一键顺序填座、加密随机洗牌或 S 型蛇形排座防成绩扎堆，
        网格中拖拽任意两个座位即可交换，支持打印座位图与导出名单文本，全部计算在浏览器本地完成。
      </p>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="space-y-5 no-print">
        <!-- 名单 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
              <Users class="w-4 h-4 text-primary" /> 学生名单
            </h2>
            <span class="text-xs text-muted-foreground">{{ students.length }} 人</span>
          </div>
          <textarea
            v-model="rosterText"
            @change="applyLayout"
            rows="9"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="每行一名学生，可在名字后加数字成绩&#10;张三 95&#10;李四&#10;王五 88.5"
          ></textarea>
          <p class="text-xs text-muted-foreground">每行一名；「名字 数字」会被识别为成绩，用于按成绩蛇形排座；空行自动忽略。</p>
        </div>

        <!-- 教室布局 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
            <LayoutGrid class="w-4 h-4 text-primary" /> 教室布局
          </h2>

          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">班级 / 表格标题</label>
            <input
              v-model="className"
              @change="persist"
              type="text"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">行数（排）</label>
              <input
                v-model.number="rowCount"
                @change="applyLayout"
                type="number"
                min="1"
                max="12"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">每排座位数</label>
              <input
                v-model.number="manualCols"
                @change="applyLayout"
                type="number"
                min="1"
                max="12"
                :disabled="colMode === 'auto'"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
              <p class="text-xs text-muted-foreground mt-1">当前每排 {{ colCount }} 座</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2 text-foreground">列数模式</label>
            <div class="flex gap-2">
              <button
                @click="colMode = 'auto'; applyLayout()"
                :class="[
                  'flex-1 py-2 rounded-lg text-sm font-medium transition',
                  colMode === 'auto' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >自动（按人数÷行数）</button>
              <button
                @click="colMode = 'manual'; applyLayout()"
                :class="[
                  'flex-1 py-2 rounded-lg text-sm font-medium transition',
                  colMode === 'manual' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >指定列数</button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2 text-foreground">走道位置</label>
            <div class="flex gap-2">
              <button
                @click="aisle = 'middle'; persist()"
                :class="[
                  'flex-1 py-2 rounded-lg text-sm font-medium transition',
                  aisle === 'middle' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >中间走道</button>
              <button
                @click="aisle = 'sides'; persist()"
                :class="[
                  'flex-1 py-2 rounded-lg text-sm font-medium transition',
                  aisle === 'sides' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >两侧走道</button>
            </div>
          </div>
        </div>

        <!-- 排座模式 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
            <Shuffle class="w-4 h-4 text-primary" /> 排座模式
          </h2>
          <div class="space-y-2">
            <button
              v-for="m in modeOptions"
              :key="m.id"
              @click="mode = m.id; applyLayout()"
              :class="[
                'w-full text-left px-3 py-2.5 rounded-lg border transition',
                mode === m.id ? 'border-primary bg-primary/10' : 'border-border bg-muted/40 hover:bg-muted'
              ]"
            >
              <span class="text-sm font-medium text-foreground">{{ m.name }}</span>
              <span class="block text-xs text-muted-foreground mt-0.5">{{ m.desc }}</span>
            </button>
          </div>
          <button
            @click="reshuffle"
            class="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
          >
            <Shuffle class="w-4 h-4" /> 洗牌（随机打乱重排）
          </button>
        </div>
      </div>

      <!-- 输出区域：座位网格 -->
      <div class="xl:col-span-2 space-y-4">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4 no-print">
            <div class="text-sm text-foreground font-medium">{{ className || '班级座位表' }}</div>
            <div class="flex flex-wrap gap-2">
              <button
                @click="printChart"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition"
              >
                <Printer class="w-4 h-4" /> 打印座位表
              </button>
              <button
                @click="exportText"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-sm hover:bg-accent transition"
              >
                <Download class="w-4 h-4" /> 导出座位名单文本
              </button>
            </div>
          </div>

          <div v-if="students.length === 0" class="p-10 text-center text-muted-foreground border border-dashed border-border rounded-lg">
            在左侧粘贴学生名单（每行一名）后自动生成座位表
          </div>

          <div v-else class="print-area">
            <p class="text-center text-xs text-muted-foreground mb-2">
              {{ modeName }} · {{ rowCount }} 排 × {{ colCount }} 座 · {{ aisle === 'middle' ? '中间走道' : '两侧走道' }} · 拖拽任意两个座位可交换
            </p>

            <div class="overflow-x-auto print-inner">
            <!-- 讲台 -->
            <div class="mx-auto mb-4 w-44 md:w-60 py-2 rounded-b-lg bg-slate-200 dark:bg-slate-700 text-center text-sm font-semibold tracking-[0.5em] text-slate-600 dark:text-slate-300 cell-color">
              讲台
            </div>

            <!-- 座位网格 -->
            <div class="space-y-2 min-w-[430px]">
              <div
                v-for="(seatRow, r) in seatRows"
                :key="r"
                class="flex items-stretch justify-center"
              >
                <span class="self-center text-[10px] text-muted-foreground mr-2 w-8 text-right shrink-0">第{{ r + 1 }}排</span>
                <template v-for="(seat, c) in seatRow" :key="c">
                  <div v-if="aisle === 'sides' && c === 0" class="w-3 md:w-6 shrink-0"></div>
                  <div
                    draggable="true"
                    @dragstart="onDragStart(r * colCount + c)"
                    @dragover.prevent
                    @drop.prevent="onDrop(r * colCount + c)"
                    @click="clickSwap(seat ? r * colCount + c : -1)"
                    :class="[
                      'seat-cell relative rounded-lg border px-1 py-2 md:py-3 text-center cursor-grab select-none transition min-w-[52px] md:min-w-[76px] flex-1 max-w-[110px]',
                      seat ? 'bg-primary/10 border-primary/30 hover:border-primary' : 'bg-muted/40 border-border border-dashed',
                      dragPick === r * colCount + c ? 'ring-2 ring-inset ring-primary' : ''
                    ]"
                    :title="seat ? `${seat.name}${seat.score !== null ? '（' + seat.score + '分）' : ''}` : '空座位'"
                  >
                    <template v-if="seat">
                      <span class="block text-xs md:text-sm font-medium text-foreground truncate">{{ seat.name }}</span>
                      <span v-if="seat.score !== null" class="block text-[10px] text-muted-foreground">{{ seat.score }}分</span>
                    </template>
                    <span v-else class="block text-xs text-muted-foreground">空位</span>
                  </div>
                  <div v-if="aisle === 'middle' && c === midGap - 1" class="w-4 md:w-9 shrink-0"></div>
                  <div v-if="aisle === 'sides' && c === colCount - 1" class="w-3 md:w-6 shrink-0"></div>
                </template>
              </div>
            </div>
            </div>

            <div v-if="missingCount > 0" class="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs no-print">
              座位不足：还有 {{ missingCount }} 名学生未排入，请增加行数或每排座位数。
            </div>
            <div v-if="emptySeatCount > 0 && missingCount === 0" class="mt-3 text-xs text-muted-foreground no-print">
              共 {{ seatTotal }} 个座位，已排 {{ students.length }} 人，空 {{ emptySeatCount }} 座。
            </div>
          </div>

          <p class="text-xs text-muted-foreground mt-4 no-print">
            说明：拖拽交换为手动微调，切换排座模式或修改布局会重新排座并覆盖手动调整；随机洗牌使用浏览器加密级随机数（crypto.getRandomValues）。
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronUp v-if="isSeoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是班级座位表生成器？
        </h2>
        <p class="text-muted-foreground mb-4">
          班级座位表生成器是一款面向班主任与任课教师的在线排座工具：把学生名单粘贴进来，设定教室行数、每排座位数与走道位置，
          即可按顺序填座、加密随机打乱，或按成绩做 S 型蛇形排布防止高分扎堆前排同侧，生成带讲台方位的教室座位图。
          座位支持拖拽两两交换做手动微调，可打印张贴或导出名单文本发到家长群，数据全程留在本机浏览器。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">如何使用本工具排座位</h3>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧粘贴名单，每行一名，如「张三 95」（数字为可选成绩）</li>
          <li>设置行数、每排座位数（自动或指定）与走道位置（中间 / 两侧）</li>
          <li>选择排座模式：顺序填座、随机打乱（点「洗牌」重洗）或按成绩蛇形排布</li>
          <li>在座位图中按住某个座位拖到另一个座位松手，即完成交换；也可先点选一个座位、再点另一个座位在手机上完成交换</li>
          <li>确认后点「打印座位表」张贴，或「导出座位名单文本」存档</li>
        </ol>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">三种排座模式的区别</h3>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>顺序填座</strong>：按名单顺序逐排逐列放置，适合按学号、报名顺序固定入座</li>
          <li><strong>随机打乱</strong>：用 Fisher-Yates 洗牌 + crypto.getRandomValues 加密随机源，等概率公平，适合定期轮换座位防近视扎堆</li>
          <li><strong>按成绩蛇形排布</strong>：成绩从高到低排序后走「S 型」路线入座——第 1 排从左到右、第 2 排从右到左交替进行，相邻名次分居两侧，避免尖子生集中同一侧或同一列</li>
        </ul>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h4 class="text-lg font-semibold text-foreground">成绩是必须填的吗？没填成绩的学生怎么排？</h4>
            <p class="text-muted-foreground mt-1">
              成绩可选。名单中未带数字的学生视为无成绩：顺序与随机模式完全不受影响；蛇形模式下排在有成绩的学生之后，按名单原有顺序继续蛇形入座。
              也可以先把名单第二列用空格或逗号隔开写成绩，如「李四，92」。
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-foreground">拖拽交换后切换模式，调整会丢吗？</h4>
            <p class="text-muted-foreground mt-1">
              会。拖拽交换是对当前一次排座结果的手动微调；切换排座模式、修改行数 / 每排座位数或点击「洗牌」都会重新生成座位表。
              微调满意后请及时打印或导出文本留存。
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-foreground">每排座位数怎么确定最合适？</h4>
            <p class="text-muted-foreground mt-1">
              常见教室为每排 5-7 座。选择「自动」时每排座位数 = 人数 ÷ 行数向上取整，尽量坐满不留空位；
              选「指定」时按实际课桌列数填写，多余座位会显示为空位，可作为讲台边或最后一排的备用位。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'seating-chart-generator'" :category="'others'" class="no-print" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  LayoutGrid, Users, Shuffle, Printer, Download, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '班级座位表生成器 - 排座工具/随机打乱/按成绩蛇形排座',
  description: '在线班级座位表生成器，粘贴名单自动网格排座，支持顺序填座、crypto随机数洗牌打乱、按成绩S型蛇形排布防扎堆，拖拽交换座位微调，走道位置可设，打印并导出名单文本，纯本地计算',
  keywords: '班级座位表, 排座位工具, 座位表生成器, 随机排座, 按成绩排座, 蛇形排座, 教室座位图打印',
  author: 'Util工具箱',
  ogTitle: '班级座位表生成器 - 有条工具',
  ogDescription: '导入名单按网格自动排座或随机打乱，可拖拽微调导出打印，班主任定期刚需',
  ogUrl: 'https://www.util.cn/tools/seating-chart-generator',
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
          name: '班级座位表生成器',
          url: 'https://www.util.cn/tools/seating-chart-generator',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['名单粘贴导入', '顺序/随机/蛇形三种排座', 'crypto随机洗牌', '拖拽交换座位', '中间或两侧走道', '打印与文本导出']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '班级座位表生成器', item: 'https://www.util.cn/tools/seating-chart-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '成绩是必须填的吗？',
              acceptedAnswer: { '@type': 'Answer', text: '成绩可选，名字后不带数字即视为无成绩；蛇形模式下无成绩学生排在最后按名单顺序入座，顺序与随机模式不受影响。' }
            },
            {
              '@type': 'Question',
              name: '拖拽交换后切换模式，调整会丢吗？',
              acceptedAnswer: { '@type': 'Answer', text: '会。切换排座模式、修改行数或每排座位数、点击洗牌都会重新生成座位表，微调满意后请及时打印或导出留存。' }
            },
            {
              '@type': 'Question',
              name: '随机洗牌公平吗？',
              acceptedAnswer: { '@type': 'Answer', text: '采用 Fisher-Yates 洗牌算法配合浏览器 crypto.getRandomValues 加密级随机源，每种排列等概率出现。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'seating-chart-generator')

/* ===== PURE-BEGIN ===== */
// 名单解析：每行一名；「名字 95」「名字，95」等尾部数字识别为成绩
function parseRoster(text) {
  const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(l => l !== '')
  return lines.map(line => {
    const m = line.match(/^(.+?)[\s,，;；、\t]+(-?\d+(?:\.\d+)?)$/)
    if (m && m[1].trim() !== '') {
      return { name: m[1].trim(), score: Number(m[2]) }
    }
    return { name: line, score: null }
  })
}

const scoreValue = (s) => (s.score === null || !isFinite(s.score) ? -Infinity : s.score)

// 蛇形（S 型）排布：成绩从高到低，奇数排反向放置
function snakeLayout(students, cols) {
  const sorted = students.slice().sort((a, b) => scoreValue(b) - scoreValue(a))
  const out = []
  let r = 0
  for (let i = 0; i < sorted.length; i += cols) {
    const chunk = sorted.slice(i, i + cols)
    if (r % 2 === 1) chunk.reverse()
    for (const s of chunk) out.push(s)
    r++
  }
  return out
}

// Fisher-Yates 洗牌（随机源注入，浏览器端传 crypto 实现）
function shuffle(arr, rand) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

// 补齐/截断到 total 个座位（null 表示空位）
function padSeats(list, total) {
  const out = list.slice(0, total)
  while (out.length < total) out.push(null)
  return out
}

// 座位表文本导出（按排、按走道分组）
function seatsToText(seatRows, className, aisleMode) {
  const head = `${className || '班级座位表'}（讲台在上方）`
  const lines = seatRows.map((row, r) => {
    let text = row.map(s => (s ? s.name : '·')).join(' ')
    if (aisleMode === 'middle' && row.length > 1) {
      const m = Math.ceil(row.length / 2)
      text = `${row.slice(0, m).map(s => (s ? s.name : '·')).join(' ')} | ${row.slice(m).map(s => (s ? s.name : '·')).join(' ')}`
    }
    return `第${r + 1}排：${text}`
  })
  return `${head}\n${lines.join('\n')}`
}
/* ===== PURE-END ===== */

// ---------- 状态 ----------
const rosterText = ref([
  '王小明 95', '李思红 92', '张小华 88', '刘丽 90', '陈强 76', '杨洋 85',
  '黄雨欣 79', '周军 93', '吴静 82', '徐磊 87', '孙悦 91', '马超 78'
].join('\n'))
const className = ref('三年级(2)班 座位表')
const rowCount = ref(3)
const colMode = ref('auto')
const manualCols = ref(6)
const aisle = ref('middle')
const mode = ref('sequential')
const seats = ref([])
const dragFrom = ref(-1)
const dragPick = ref(-1)
const isSeoContentVisible = ref(true)

const modeOptions = [
  { id: 'sequential', name: '顺序填座', desc: '按名单顺序逐排逐列入座' },
  { id: 'random', name: '随机打乱', desc: '加密随机数洗牌，点「洗牌」重排' },
  { id: 'snake', name: '按成绩蛇形排布', desc: 'S 型高低位交替，防止成绩扎堆' }
]

const STORAGE_KEY = 'seating-chart-v1'

// ---------- 派生 ----------
const students = computed(() => parseRoster(rosterText.value))
const colCount = computed(() => {
  const rows = Math.max(1, Math.min(12, Math.round(Number(rowCount.value) || 1)))
  if (colMode.value === 'auto') {
    const n = students.value.length
    return Math.max(1, Math.min(12, n === 0 ? 6 : Math.ceil(n / rows)))
  }
  return Math.max(1, Math.min(12, Math.round(Number(manualCols.value) || 6)))
})
const seatTotal = computed(() => Math.max(1, Math.min(12, Math.round(Number(rowCount.value) || 1))) * colCount.value)
const missingCount = computed(() => Math.max(0, students.value.length - seatTotal.value))
const emptySeatCount = computed(() => seats.value.filter(s => !s).length)
const midGap = computed(() => Math.ceil(colCount.value / 2))
const modeName = computed(() => {
  const m = modeOptions.find(o => o.id === mode.value)
  return m ? m.name : ''
})
const seatRows = computed(() => {
  const cols = colCount.value
  const rows = Math.max(1, Math.min(12, Math.round(Number(rowCount.value) || 1)))
  const out = []
  for (let r = 0; r < rows; r++) {
    out.push(seats.value.slice(r * cols, r * cols + cols))
  }
  return out
})

// ---------- 排座 ----------
const cryptoRand = () => {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] / 4294967296
}

const buildSeatList = () => {
  const list = students.value
  const total = seatTotal.value
  if (mode.value === 'snake') {
    return padSeats(snakeLayout(list, colCount.value), total)
  }
  if (mode.value === 'random') {
    return padSeats(shuffle(list, cryptoRand()), total)
  }
  return padSeats(list, total)
}

const applyLayout = () => {
  seats.value = buildSeatList()
  dragFrom.value = -1
  dragPick.value = -1
}
const reshuffle = () => {
  if (mode.value !== 'random') mode.value = 'random'
  applyLayout()
}

// ---------- 拖拽 / 点选交换 ----------
const swapSeats = (a, b) => {
  if (a < 0 || b < 0 || a === b) return
  if (a >= seats.value.length || b >= seats.value.length) return
  const next = seats.value.slice()
  const tmp = next[a]
  next[a] = next[b]
  next[b] = tmp
  seats.value = next
}
const onDragStart = (i) => { dragFrom.value = i }
const onDrop = (i) => {
  swapSeats(dragFrom.value, i)
  dragFrom.value = -1
}
const clickSwap = (i) => {
  if (i < 0) return
  if (dragPick.value === -1) {
    dragPick.value = i
  } else {
    swapSeats(dragPick.value, i)
    dragPick.value = -1
  }
}

// ---------- 导出 ----------
const downloadText = (content, filename) => {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}
const exportText = () => {
  downloadText(seatsToText(seatRows.value, className.value, aisle.value), `${className.value || '班级座位表'}.txt`)
}
const printChart = () => {
  window.print()
}

// ---------- 本地保存（仅 onMounted / 事件中访问 localStorage） ----------
const persist = () => {
  if (!process.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      roster: rosterText.value,
      className: className.value,
      rowCount: rowCount.value,
      colMode: colMode.value,
      manualCols: manualCols.value,
      aisle: aisle.value,
      mode: mode.value
    }))
  } catch (e) { /* 忽略存储异常 */ }
}

const loadState = () => {
  if (!process.client) return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object') return
    if (typeof saved.roster === 'string') rosterText.value = saved.roster
    if (typeof saved.className === 'string' && saved.className) className.value = saved.className
    if (Number(saved.rowCount) >= 1) rowCount.value = Math.min(12, Math.round(Number(saved.rowCount)))
    if (saved.colMode === 'auto' || saved.colMode === 'manual') colMode.value = saved.colMode
    if (Number(saved.manualCols) >= 1) manualCols.value = Math.min(12, Math.round(Number(saved.manualCols)))
    if (saved.aisle === 'middle' || saved.aisle === 'sides') aisle.value = saved.aisle
    if (modeOptions.some(o => o.id === saved.mode)) mode.value = saved.mode
  } catch (e) {
    // 数据损坏时用默认示例
  }
}

onMounted(() => {
  loadState()
  applyLayout()
  if (tool) addRecentTool(tool.id)
})

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
  .print-area {
    overflow: visible !important;
  }
  .print-inner {
    overflow: visible !important;
  }
  .cell-color,
  .seat-cell {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
