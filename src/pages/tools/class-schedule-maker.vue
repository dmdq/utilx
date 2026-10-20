<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <CalendarDays class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">课程表制作器</h1>
          <p class="text-sm text-muted-foreground mt-1">在线填写每周课程格子、自动配色，导出课表图与打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        填写每周课程格子选配色导出课表图，支持上课铃声时间，学生老师常用。可选择周一至周五 / 六 / 七共五到七天列，
        自定义节次行（如「第1节 08:00-08:45」）并插入上午 / 下午分隔行，点击格子选科目即自动配色，
        支持导出 PNG 课表图、A4 横版打印，课表内容自动保存在本机浏览器，全程本地计算不上传。
      </p>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      <!-- 输入区域：课表设置 -->
      <div class="space-y-5 no-print">
        <!-- 标题与星期列 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
            <CalendarDays class="w-4 h-4 text-primary" /> 基本设置
          </h2>

          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">课表标题</label>
            <input
              v-model="scheduleTitle"
              @change="persist()"
              type="text"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如：三(2)班 课程表"
            >
          </div>

          <div>
            <label class="block text-sm font-medium mb-2 text-foreground">星期列数</label>
            <div class="flex gap-2">
              <button
                v-for="n in [5, 6, 7]"
                :key="n"
                @click="changeDayCount(n)"
                :class="[
                  'flex-1 py-2 rounded-lg text-sm font-medium transition',
                  dayCount === n ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                {{ n === 5 ? '周一至周五' : n === 6 ? '周一至周六' : '周一至周日' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 节次行管理 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
              <ListTree class="w-4 h-4 text-primary" /> 节次行（{{ classRowCount }} 节课）
            </h2>
          </div>
          <p class="text-xs text-muted-foreground">标签里写上上课铃声时间即可，如「第1节 08:00-08:45」；分隔行用于区分上午 / 下午 / 晚自习。</p>

          <div class="space-y-2">
            <div v-for="(row, i) in rows" :key="row.id" class="flex items-center gap-1.5">
              <span
                :class="[
                  'shrink-0 px-1.5 py-0.5 rounded text-[10px]',
                  row.kind === 'class' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                ]"
              >{{ row.kind === 'class' ? '节次' : '分隔' }}</span>
              <input
                v-model="row.label"
                @change="persist()"
                type="text"
                class="flex-1 min-w-0 px-2.5 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
              <button
                @click="moveRow(i, -1)"
                :disabled="i === 0"
                class="px-1.5 py-1.5 rounded bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition"
                title="上移"
              >↑</button>
              <button
                @click="moveRow(i, 1)"
                :disabled="i === rows.length - 1"
                class="px-1.5 py-1.5 rounded bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition"
                title="下移"
              >↓</button>
              <button
                @click="deleteRow(i)"
                class="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                title="删除该行"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="flex gap-2 pt-1">
            <button
              @click="addClassPeriod"
              class="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition"
            >
              <Plus class="w-4 h-4" /> 添加节次
            </button>
            <button
              @click="addDivider"
              class="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 transition"
            >
              <Plus class="w-4 h-4" /> 插入分隔行
            </button>
          </div>
        </div>

        <!-- 科目管理 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
            <Palette class="w-4 h-4 text-primary" /> 科目列表
          </h2>
          <p class="text-xs text-muted-foreground">每个科目按名称自动哈希配色，同名科目颜色永远一致。</p>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="s in subjects"
              :key="s"
              class="inline-flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-full text-xs bg-muted"
            >
              <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: subjectColor(s).hexFill }"></span>
              <span class="text-foreground">{{ s }}</span>
              <button
                @click="removeSubject(s)"
                class="text-muted-foreground hover:text-red-500 leading-none px-0.5"
                :title="`从科目列表移除 ${s}`"
              >×</button>
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="newSubject"
              @keyup.enter="addSubject"
              type="text"
              class="flex-1 min-w-0 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="新科目名，如：信息科技"
            >
            <button
              @click="addSubject"
              class="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition"
            >添加</button>
          </div>
        </div>
      </div>

      <!-- 输出区域：课表网格 -->
      <div class="xl:col-span-2 space-y-4">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4 no-print">
            <div class="text-sm text-muted-foreground">
              <template v-if="selected">
                已选中：<span class="font-medium text-foreground">{{ weekLabelsShown[selected.d] }} · {{ selectedRowLabel }}</span>
              </template>
              <template v-else>点击格子选中，再点下方科目按钮填入；双击格子可清空</template>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                @click="exportPng"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition"
              >
                <Download class="w-4 h-4" /> 导出 PNG
              </button>
              <button
                @click="printSchedule"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-sm hover:bg-accent transition"
              >
                <Printer class="w-4 h-4" /> 打印课表
              </button>
              <button
                @click="fillSample"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition"
              >
                <Wand2 class="w-4 h-4" /> 填入示例
              </button>
              <button
                @click="clearAllCells"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm hover:text-red-500 transition"
              >
                <RotateCcw class="w-4 h-4" /> 清空格子
              </button>
            </div>
          </div>

          <!-- 科目快速填色条 -->
          <div class="flex flex-wrap gap-1.5 mb-4 no-print">
            <button
              v-for="s in subjects"
              :key="s"
              @click="fillSubject(s)"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                subjectColor(s).cls,
                selected ? 'hover:opacity-80 cursor-pointer' : 'opacity-50 cursor-not-allowed'
              ]"
            >{{ s }}</button>
            <button
              @click="clearSelected"
              :disabled="!selected"
              class="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-red-500 disabled:opacity-40 transition"
            >清空该格</button>
          </div>

          <!-- 打印标题 -->
          <h2 class="print-only text-xl font-bold text-foreground text-center mb-2">{{ scheduleTitle || '我的课程表' }}</h2>

          <!-- 课表网格 -->
          <div class="overflow-x-auto border border-border rounded-lg print-area">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th class="border border-border bg-muted px-2 py-2 font-medium text-muted-foreground whitespace-nowrap w-32 md:w-40">节次 / 星期</th>
                  <th
                    v-for="(w, i) in weekLabelsShown"
                    :key="w"
                    class="border border-border bg-muted px-2 py-2 font-semibold text-foreground whitespace-nowrap text-center min-w-[68px]"
                  >{{ w }}</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(row, ri) in displayRows" :key="row.id">
                  <tr v-if="row.kind === 'divider'">
                    <td :colspan="dayCount + 1" class="border border-border bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1.5 text-center text-xs font-semibold text-indigo-700 dark:text-indigo-300 cell-color">
                      {{ row.label }}
                    </td>
                  </tr>
                  <tr v-else>
                    <td class="border border-border bg-muted/50 px-2 py-2 text-xs text-foreground whitespace-nowrap">{{ row.label }}</td>
                    <td
                      v-for="(w, di) in weekLabelsShown"
                      :key="di"
                      @click="selectCell(di, row.pIdx)"
                      @dblclick="clearCellAt(di, row.pIdx)"
                      :class="[
                        'border border-border px-1.5 py-2.5 text-center font-medium cursor-pointer select-none transition min-w-[68px]',
                        cellColorClass(di, row.pIdx),
                        isSelected(di, row.pIdx) ? 'ring-2 ring-inset ring-primary' : ''
                      ]"
                      :title="cellValue(di, row.pIdx) ? '双击清空' : '点击选择后填科目'"
                    >
                      <span class="cell-color whitespace-nowrap">{{ cellValue(di, row.pIdx) || '\u00A0' }}</span>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <p class="text-xs text-muted-foreground mt-3 no-print">
            提示：课表在每次修改后自动保存到本机浏览器 localStorage，下次打开自动恢复；导出 PNG 为 2 倍分辨率，适合打印或发到群里。
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
          什么是课程表制作器？
        </h2>
        <p class="text-muted-foreground mb-4">
          课程表制作器是一款在线课程表（课表）制作工具：左侧管理节次行与星期列数，右侧网格中点击格子、选择科目即完成填色，
          科目颜色由名称哈希自动分配，同一科目在任何位置颜色恒定。做好后可一键导出 PNG 课表图或 A4 横版打印贴到教室墙上，
          是学生排课、老师做班级课表模板的常用工具。所有数据只保存在你自己的浏览器里。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">如何使用本工具</h3>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择星期列数（周一至周五 / 六 / 七），设置课表标题</li>
          <li>在节次行中编辑每节的名称与上课铃声时间（如「第1节 08:00-08:45」），可添加节次或插入「上午 / 下午」分隔行</li>
          <li>点击课表中的一个格子（选中后高亮），再点击下方科目按钮填入课程；双击格子即可清空</li>
          <li>需要更多科目时，在科目列表中自行添加，颜色自动分配</li>
          <li>完成后点击「导出 PNG」保存课表图，或「打印课表」直接输出横版纸张</li>
        </ol>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">科目自动配色与导出原理</h3>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>配色规则</strong>：对科目名做 FNV-1a 字符串哈希后映射到一组预设柔和色板，纯函数计算，同名永远同色，不同名大概率不同色</li>
          <li><strong>PNG 导出</strong>：用 Canvas 在本地按当前网格重绘标题、表头与所有格子，2 倍分辨率输出图片，不经过任何服务器</li>
          <li><strong>本地保存</strong>：每次修改自动写入 localStorage（含节次、科目、格子），换浏览器或清缓存后不会同步</li>
          <li><strong>打印</strong>：通过 @media print + A4 landscape 横向纸张只输出课表本体，隐藏所有操作按钮</li>
        </ul>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h4 class="text-lg font-semibold text-foreground">课表数据存在哪里？会丢失吗？</h4>
            <p class="text-muted-foreground mt-1">
              课表只保存在你当前浏览器的 localStorage 中，刷新或下次打开本页会自动恢复，不上传服务器。
              清除浏览器数据、换设备或换浏览器时不会同步，重要课表建议导出 PNG 留存一份。
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-foreground">为什么两个不同科目颜色一样？</h4>
            <p class="text-muted-foreground mt-1">
              颜色是科目名哈希后对色板长度取模得到的，色板共 12 色，科目非常多时会出现「哈希撞色」。
              撞色不影响使用，你可以给科目起更具体的名字（如「英语口语」与「英语笔试」）来区分颜色。
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-foreground">可以制作晚自习或兴趣班课表吗？</h4>
            <p class="text-muted-foreground mt-1">
              可以。节次行没有数量限制，点「插入分隔行」再改名为「晚自习」即可把课表分成多段；
              兴趣班只需把星期列数设为 7，把自己的课程填进对应格子。课表格子内容本身不限制科目名。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'class-schedule-maker'" :category="'time'" class="no-print" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  CalendarDays, ListTree, Palette, Trash2, Plus, Download, Printer,
  Wand2, RotateCcw, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '课程表制作器 - 在线课程表制作/课表图导出打印',
  description: '在线课程表制作器，选五到七天列、自定义节次与上课铃声时间、插入上午下午分隔行，点格子选科目自动配色，支持导出PNG课表图与A4横版打印，内容本地保存，学生老师常用',
  keywords: '课程表制作, 课表生成器, 在线课程表, 课程表模板, 课表配色, 电子课表打印',
  author: 'Util工具箱',
  ogTitle: '课程表制作器 - 有条工具',
  ogDescription: '填写每周课程格子选配色导出课表图，支持上课铃声时间，学生老师常用',
  ogUrl: 'https://www.util.cn/tools/class-schedule-maker',
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
          name: '课程表制作器',
          url: 'https://www.util.cn/tools/class-schedule-maker',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['五/六/七天列切换', '节次行增删与上下移', '上午下午分隔行', '科目名哈希自动配色', 'PNG课表图导出', 'A4横版打印', '本地自动保存']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '时间日期', item: 'https://www.util.cn/time/' },
            { '@type': 'ListItem', position: 3, name: '课程表制作器', item: 'https://www.util.cn/tools/class-schedule-maker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '课表数据存在哪里？会丢失吗？',
              acceptedAnswer: { '@type': 'Answer', text: '课表只保存在当前浏览器的 localStorage 中，刷新或下次打开自动恢复，不上传服务器；清缓存、换设备不会同步，建议导出 PNG 留存。' }
            },
            {
              '@type': 'Question',
              name: '科目颜色是怎么分配的？',
              acceptedAnswer: { '@type': 'Answer', text: '对科目名做 FNV-1a 哈希后映射到 12 色柔和色板，同名永远同色；科目很多时可能撞色，可用更具体的名字区分。' }
            },
            {
              '@type': 'Question',
              name: '可以制作晚自习或兴趣班课表吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以。节次行不限数量，插入分隔行并改名「晚自习」即可分段；兴趣班把星期设为 7 天再填对应格子。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'class-schedule-maker')

/* ===== PURE-BEGIN ===== */
const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const PALETTE = [
  { cls: 'bg-rose-100 text-rose-700', hexFill: '#ffe4e6', hexText: '#be123c' },
  { cls: 'bg-orange-100 text-orange-700', hexFill: '#ffedd5', hexText: '#c2410c' },
  { cls: 'bg-amber-100 text-amber-700', hexFill: '#fef3c7', hexText: '#b45309' },
  { cls: 'bg-lime-100 text-lime-700', hexFill: '#ecfccb', hexText: '#4d7c0f' },
  { cls: 'bg-green-100 text-green-700', hexFill: '#dcfce7', hexText: '#15803d' },
  { cls: 'bg-teal-100 text-teal-700', hexFill: '#ccfbf1', hexText: '#0f766e' },
  { cls: 'bg-sky-100 text-sky-700', hexFill: '#e0f2fe', hexText: '#0369a1' },
  { cls: 'bg-blue-100 text-blue-700', hexFill: '#dbeafe', hexText: '#1d4ed8' },
  { cls: 'bg-indigo-100 text-indigo-700', hexFill: '#e0e7ff', hexText: '#4338ca' },
  { cls: 'bg-violet-100 text-violet-700', hexFill: '#ede9fe', hexText: '#6d28d9' },
  { cls: 'bg-fuchsia-100 text-fuchsia-700', hexFill: '#fae8ff', hexText: '#a21caf' },
  { cls: 'bg-pink-100 text-pink-700', hexFill: '#fce7f3', hexText: '#be185d' }
]

const EMPTY_STYLE = { cls: 'bg-background text-muted-foreground', hexFill: '#ffffff', hexText: '#94a3b8' }

function hashName(name) {
  let h = 2166136261
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// 按科目名哈希取预设色：同名稳定同色
function subjectColor(name) {
  if (!name) return EMPTY_STYLE
  return PALETTE[hashName(String(name)) % PALETTE.length]
}

// grid[day][period]：每个星期列一个数组，每个节次（class 行）一格
function makeGrid(days, periods) {
  const out = []
  for (let d = 0; d < days; d++) {
    const rowArr = []
    for (let p = 0; p < periods; p++) rowArr.push('')
    out.push(rowArr)
  }
  return out
}

function setCell(grid, dayIdx, periodIdx, subject) {
  const g = grid.map(r => r.slice())
  if (g[dayIdx]) g[dayIdx][periodIdx] = subject
  return g
}

function clearCell(grid, dayIdx, periodIdx) {
  return setCell(grid, dayIdx, periodIdx, '')
}

function classIndexBefore(rows, index) {
  let n = 0
  for (let i = 0; i < index && i < rows.length; i++) {
    if (rows[i].kind === 'class') n++
  }
  return n
}

function appendClassRow(rows, grid, row) {
  return { rows: [...rows, row], grid: grid.map(r => [...r, '']) }
}

function appendDividerRow(rows, row) {
  return { rows: [...rows, row], grid }
}

function removeRowAt(rows, grid, index) {
  const target = rows[index]
  if (!target) return { rows, grid }
  const newRows = rows.slice(0, index).concat(rows.slice(index + 1))
  if (target.kind !== 'class') return { rows: newRows, grid }
  const pIdx = classIndexBefore(rows, index)
  return { rows: newRows, grid: grid.map(r => r.slice(0, pIdx).concat(r.slice(pIdx + 1))) }
}

function reorderRows(rows, grid, index, dir) {
  const target = index + dir
  if (index < 0 || target < 0 || target >= rows.length) return { rows, grid }
  const newRows = rows.slice()
  const tmp = newRows[index]
  newRows[index] = newRows[target]
  newRows[target] = tmp
  const oldCols = rows.filter(r => r.kind === 'class').map(r => r.id)
  const newCols = newRows.filter(r => r.kind === 'class').map(r => r.id)
  const newGrid = grid.map(r => newCols.map(id => r[oldCols.indexOf(id)]))
  return { rows: newRows, grid: newGrid }
}

function setDayCount(grid, days) {
  const periods = grid[0] ? grid[0].length : 0
  const out = []
  for (let d = 0; d < days; d++) {
    out.push(grid[d] ? grid[d].slice() : makeGrid(1, periods)[0])
  }
  return out
}

function clearAllGrid(grid) {
  const periods = grid[0] ? grid[0].length : 0
  return makeGrid(grid.length, periods)
}
/* ===== PURE-END ===== */

// ---------- 状态 ----------
const scheduleTitle = ref('我的课程表')
const dayCount = ref(5)
const rows = ref([
  { id: 1, kind: 'divider', label: '上午' },
  { id: 2, kind: 'class', label: '第1节 08:00-08:45' },
  { id: 3, kind: 'class', label: '第2节 08:55-09:40' },
  { id: 4, kind: 'class', label: '第3节 10:00-10:45' },
  { id: 5, kind: 'class', label: '第4节 10:55-11:40' },
  { id: 6, kind: 'divider', label: '下午' },
  { id: 7, kind: 'class', label: '第5节 14:00-14:45' },
  { id: 8, kind: 'class', label: '第6节 14:55-15:40' }
])
const grid = ref(makeGrid(5, 6))
const subjects = ref(['语文', '数学', '英语', '科学', '道德与法治', '体育', '音乐', '美术', '劳动', '心理', '班会', '自习'])
const newSubject = ref('')
const selected = ref(null)
const isSeoContentVisible = ref(true)
let rowIdSeed = 9

const STORAGE_KEY = 'class-schedule-maker-v1'
const DEFAULT_DIVIDERS = ['上午', '下午', '晚自习']

// ---------- 派生 ----------
const weekLabelsShown = computed(() => WEEK_LABELS.slice(0, dayCount.value))
const classRowCount = computed(() => rows.value.filter(r => r.kind === 'class').length)
const displayRows = computed(() => {
  let p = 0
  return rows.value.map(r => {
    if (r.kind === 'class') {
      const item = { id: r.id, kind: r.kind, label: r.label, pIdx: p }
      p++
      return item
    }
    return { id: r.id, kind: r.kind, label: r.label, pIdx: -1 }
  })
})
const selectedRowLabel = computed(() => {
  if (!selected.value) return ''
  const row = displayRows.value.find(r => r.pIdx === selected.value.p)
  return row ? row.label : ''
})

// ---------- 格子交互 ----------
const cellValue = (d, p) => (grid.value[d] && grid.value[d][p]) || ''
const cellColorClass = (d, p) => subjectColor(cellValue(d, p)).cls
const isSelected = (d, p) => !!selected.value && selected.value.d === d && selected.value.p === p

const selectCell = (d, p) => {
  selected.value = { d, p }
}
const clearCellAt = (d, p) => {
  grid.value = clearCell(grid.value, d, p)
  if (isSelected(d, p)) selected.value = null
  persist()
}
const fillSubject = (name) => {
  if (!selected.value) return
  grid.value = setCell(grid.value, selected.value.d, selected.value.p, name)
  persist()
}
const clearSelected = () => {
  if (!selected.value) return
  grid.value = clearCell(grid.value, selected.value.d, selected.value.p)
  persist()
}
const clearAllCells = () => {
  grid.value = clearAllGrid(grid.value)
  selected.value = null
  persist()
}
const fillSample = () => {
  const g = clearAllGrid(grid.value)
  const demo = ['语文', '数学', '英语', '科学', '道德与法治', '体育', '音乐', '美术', '自习', '班会']
  for (let d = 0; d < g.length; d++) {
    for (let p = 0; p < g[d].length; p++) {
      g[d][p] = demo[(d * 3 + p * 2) % demo.length]
    }
  }
  grid.value = g
  persist()
}

// ---------- 行列与科目管理 ----------
const changeDayCount = (n) => {
  dayCount.value = n
  grid.value = setDayCount(grid.value, n)
  selected.value = null
  persist()
}
const addClassPeriod = () => {
  const res = appendClassRow(rows.value, grid.value, {
    id: rowIdSeed++,
    kind: 'class',
    label: `第${classRowCount.value + 1}节`
  })
  rows.value = res.rows
  grid.value = res.grid
  persist()
}
const addDivider = () => {
  const used = rows.value.filter(r => r.kind === 'divider').length
  const label = DEFAULT_DIVIDERS[used] || '分隔'
  const res = appendDividerRow(rows.value, { id: rowIdSeed++, kind: 'divider', label })
  rows.value = res.rows
  grid.value = res.grid
  persist()
}
const deleteRow = (i) => {
  if (rows.value.length <= 1) return
  const res = removeRowAt(rows.value, grid.value, i)
  rows.value = res.rows
  grid.value = res.grid
  selected.value = null
  persist()
}
const moveRow = (i, dir) => {
  const res = reorderRows(rows.value, grid.value, i, dir)
  rows.value = res.rows
  grid.value = res.grid
  persist()
}
const addSubject = () => {
  const name = newSubject.value.trim()
  if (!name || subjects.value.includes(name)) return
  subjects.value = [...subjects.value, name]
  newSubject.value = ''
  persist()
}
const removeSubject = (name) => {
  subjects.value = subjects.value.filter(s => s !== name)
  persist()
}

// ---------- 本地保存（localStorage 仅在 onMounted / 事件中访问） ----------
const persist = () => {
  if (!process.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      title: scheduleTitle.value,
      dayCount: dayCount.value,
      rows: rows.value,
      grid: grid.value,
      subjects: subjects.value
    }))
  } catch (e) { /* 忽略存储配额异常 */ }
}

const loadState = () => {
  if (!process.client) return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (saved && Array.isArray(saved.rows) && Array.isArray(saved.grid)) {
      scheduleTitle.value = saved.title || '我的课程表'
      dayCount.value = Math.min(7, Math.max(1, Number(saved.dayCount) || 5))
      rows.value = saved.rows.filter(r => (r.kind === 'class' || r.kind === 'divider') && typeof r.label === 'string')
      const classCols = rows.value.filter(r => r.kind === 'class').length
      grid.value = saved.grid
        .filter(Array.isArray)
        .slice(0, dayCount.value)
        .map(r => r.slice(0, classCols).map(v => (typeof v === 'string' ? v : '')))
      while (grid.value.length < dayCount.value) grid.value.push(makeGrid(1, classCols)[0])
      if (Array.isArray(saved.subjects) && saved.subjects.length > 0) {
        subjects.value = saved.subjects.filter(s => typeof s === 'string' && s.trim() !== '')
      }
      rowIdSeed = Math.max(0, ...rows.value.map(r => Number(r.id) || 0)) + 1
    }
  } catch (e) {
    // 数据损坏时保持默认课表
  }
}

onMounted(() => {
  loadState()
  if (tool) addRecentTool(tool.id)
})

// ---------- 导出 PNG（canvas 本地绘制，含标题） ----------
const exportPng = () => {
  const days = dayCount.value
  const pr = displayRows.value
  const scale = 2
  const mg = 24
  const titleH = 76
  const headH = 46
  const labelW = 172
  const cellW = 148
  const rowH = 58
  const dividerH = 38
  const gridW = labelW + cellW * days
  let bodyH = headH
  for (const r of pr) bodyH += r.kind === 'divider' ? dividerH : rowH
  const W = gridW + mg * 2
  const H = titleH + bodyH + mg * 2

  const canvas = document.createElement('canvas')
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = '#0f172a'
  ctx.font = '700 28px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(scheduleTitle.value || '我的课程表', W / 2, mg + 26)
  ctx.fillStyle = '#64748b'
  ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(`${WEEK_LABELS[0]}–${WEEK_LABELS[days - 1]} · 共 ${classRowCount.value} 节课 · 由有条工具生成`, W / 2, mg + 56)

  const tableX = mg
  let tableY = mg + titleH

  // 表头
  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(tableX, tableY, gridW, headH)
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1
  ctx.fillStyle = '#334155'
  ctx.font = '600 13px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('节次 / 星期', tableX + labelW / 2, tableY + headH / 2)
  for (let d = 0; d < days; d++) {
    ctx.fillText(WEEK_LABELS[d], tableX + labelW + cellW * d + cellW / 2, tableY + headH / 2)
    ctx.strokeRect(tableX + labelW + cellW * d, tableY, cellW, headH)
  }
  ctx.strokeRect(tableX, tableY, labelW, headH)
  tableY += headH

  // 行
  ctx.textAlign = 'center'
  for (const r of pr) {
    const h = r.kind === 'divider' ? dividerH : rowH
    if (r.kind === 'divider') {
      ctx.fillStyle = '#e0e7ff'
      ctx.fillRect(tableX, tableY, gridW, h)
      ctx.fillStyle = '#4338ca'
      ctx.font = '700 13px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillText(r.label, tableX + gridW / 2, tableY + h / 2)
      ctx.strokeStyle = '#cbd5e1'
      ctx.strokeRect(tableX, tableY, gridW, h)
    } else {
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(tableX, tableY, labelW, h)
      ctx.fillStyle = '#334155'
      ctx.font = '500 12px "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillText(r.label, tableX + labelW / 2, tableY + h / 2)
      ctx.strokeStyle = '#cbd5e1'
      ctx.strokeRect(tableX, tableY, labelW, h)
      for (let d = 0; d < days; d++) {
        const subject = (grid.value[d] && grid.value[d][r.pIdx]) || ''
        const color = subjectColor(subject)
        ctx.fillStyle = color.hexFill
        ctx.fillRect(tableX + labelW + cellW * d, tableY, cellW, h)
        ctx.strokeStyle = '#cbd5e1'
        ctx.strokeRect(tableX + labelW + cellW * d, tableY, cellW, h)
        if (subject) {
          ctx.fillStyle = color.hexText
          ctx.font = '600 14px "PingFang SC", "Microsoft YaHei", sans-serif'
          ctx.fillText(subject, tableX + labelW + cellW * d + cellW / 2, tableY + h / 2)
        }
      }
    }
    tableY += h
  }

  const link = document.createElement('a')
  link.download = `${scheduleTitle.value || '课程表'}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

const printSchedule = () => {
  window.print()
}

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>

<style scoped>
.print-only {
  display: none;
}
@media print {
  .no-print {
    display: none !important;
  }
  .print-only {
    display: block;
  }
  .print-area {
    overflow: visible !important;
    border: none !important;
  }
  .cell-color {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page {
    size: A4 landscape;
    margin: 1.2cm;
  }
}
</style>
