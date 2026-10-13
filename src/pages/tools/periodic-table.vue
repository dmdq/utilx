<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <TestTube class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">元素周期表速查</h1>
          <p class="text-sm text-muted-foreground mt-1">118 种元素交互式周期表，点选查看名称/原子量/分类与常见用途</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        内置 118 种元素的序数、符号、中英文名、原子量（4 位有效数字）、分类、周期与族，按标准 18 列布局渲染（镧系锕系单独两行）；
        支持按中文名/符号/序数搜索与按分类着色筛选，点选任意元素在侧栏查看详情与常见用途。全部数据本地内置，离线可用。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="flex flex-col lg:flex-row gap-6 mb-6">
      <!-- 周期表 -->
      <div class="flex-1 min-w-0 bg-card border border-border rounded-lg p-4">
        <!-- 搜索 + 图例 -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <div class="relative sm:w-64">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              v-model="query"
              type="text"
              class="w-full pl-9 pr-8 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="搜索中文名/符号/序数，如 铁、Fe、26"
            />
            <button
              v-if="query"
              @click="query = ''"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="清空搜索"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          <span class="text-xs text-muted-foreground">{{ matchedCount }} / 118 种元素</span>
        </div>

        <div class="flex flex-wrap gap-x-3 gap-y-1.5 mb-3">
          <button
            v-for="(meta, key) in CATEGORY_META"
            :key="key"
            @click="toggleCat(key)"
            :class="['inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-all', activeCat === key ? 'border-primary bg-primary/10 text-foreground font-medium' : 'border-transparent text-muted-foreground hover:bg-muted']"
          >
            <span :class="['w-2.5 h-2.5 rounded-full inline-block', meta.dot]"></span>
            {{ meta.label }}
          </button>
        </div>

        <div class="overflow-x-auto pb-1">
          <div class="min-w-[980px]">
            <!-- 族号表头 -->
            <div class="grid gap-[3px] mb-[3px]" :style="{ gridTemplateColumns: gridCols }">
              <div v-for="g in 18" :key="g" class="text-center text-[9px] text-muted-foreground">{{ g }}</div>
            </div>

            <!-- 周期表主体：1-7 周期 + 空行 + 镧系/锕系 -->
            <div class="grid gap-[3px]" :style="{ gridTemplateColumns: gridCols, gridTemplateRows: gridRows }">
              <button
                v-for="el in elements"
                :key="el.z"
                @click="select(el)"
                :class="[
                  'rounded border text-center px-0.5 pt-0.5 pb-1 leading-tight transition-all',
                  CATEGORY_META[el.cat].cell,
                  isDimmed(el) ? 'opacity-15' : '',
                  selectedZ === el.z ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : 'hover:brightness-95 dark:hover:brightness-125'
                ]"
                :style="{ gridColumn: elementGridPos(el).col, gridRow: elementGridPos(el).row }"
                :title="el.z + ' ' + el.zh + ' ' + el.en"
              >
                <div class="text-[8px] text-left opacity-70">{{ el.z }}</div>
                <div class="text-[13px] font-bold font-mono">{{ el.symbol }}</div>
                <div class="text-[8px] opacity-80 truncate">{{ el.zh }}</div>
              </button>

              <!-- 镧系/锕系占位格 -->
              <div class="rounded border border-dashed border-violet-400 dark:border-violet-600 text-violet-700 dark:text-violet-300 flex flex-col items-center justify-center" :style="{ gridColumn: 3, gridRow: 6 }">
                <span class="text-[9px] font-medium">57-71</span>
                <span class="text-[9px]">镧系</span>
              </div>
              <div class="rounded border border-dashed border-fuchsia-400 dark:border-fuchsia-600 text-fuchsia-700 dark:text-fuchsia-300 flex flex-col items-center justify-center" :style="{ gridColumn: 3, gridRow: 7 }">
                <span class="text-[9px] font-medium">89-103</span>
                <span class="text-[9px]">锕系</span>
              </div>
            </div>
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-2">表格可横向滚动；点击图例按分类筛选，再次点击取消；点击元素格查看侧栏详情。</p>
      </div>

      <!-- 侧栏详情 -->
      <div class="lg:w-80 flex-shrink-0">
        <div class="bg-card border border-border rounded-lg p-6 lg:sticky lg:top-4">
          <template v-if="selected">
            <div class="flex items-start justify-between mb-4">
              <div>
                <p class="text-5xl font-bold font-mono text-foreground">{{ selected.symbol }}</p>
                <p class="text-lg font-semibold text-foreground mt-1">{{ selected.zh }}</p>
                <p class="text-sm text-muted-foreground">{{ selected.en }}</p>
              </div>
              <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', CATEGORY_META[selected.cat].cell]">
                <span :class="['w-2 h-2 rounded-full inline-block', CATEGORY_META[selected.cat].dot]"></span>
                {{ CATEGORY_META[selected.cat].label }}
              </span>
            </div>

            <div class="space-y-2 text-sm">
              <div class="flex justify-between py-1.5 border-b border-border/50">
                <span class="text-muted-foreground">原子序数</span>
                <span class="font-medium text-foreground">{{ selected.z }}</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-border/50">
                <span class="text-muted-foreground">原子量</span>
                <span class="font-medium text-foreground font-mono">{{ selected.weight }}</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-border/50">
                <span class="text-muted-foreground">周期</span>
                <span class="font-medium text-foreground">第 {{ selected.period }} 周期</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-border/50">
                <span class="text-muted-foreground">族</span>
                <span class="font-medium text-foreground">{{ groupLabel(selected) }}</span>
              </div>
            </div>

            <div class="mt-4 bg-muted/50 rounded-lg p-3">
              <p class="text-xs font-medium text-foreground mb-1 flex items-center">
                <Atom class="w-3.5 h-3.5 mr-1 text-primary" /> 常见用途
              </p>
              <p class="text-xs text-muted-foreground leading-relaxed">{{ selected.use }}</p>
            </div>

            <p v-if="hasNoStableIsotope(selected.z)" class="text-xs text-muted-foreground mt-3 leading-relaxed">
              * 该元素没有稳定同位素，表中原子量为最稳定/常见同位素的质量数。
            </p>
          </template>
          <div v-else class="text-sm text-muted-foreground">点击左侧元素格查看详情</div>
        </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于元素周期表</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            元素周期表按原子序数（核内质子数）排列元素，同族元素外层电子结构相似、化学性质相近。
            本页收录 1-118 号全部元素，按「分类着色 + 标准布局」呈现，适合学习速查、写作业对照与科普演示。
          </p>
          <h3 class="text-lg font-semibold text-foreground">分类颜色是怎么划分的</h3>
          <p>
            十类配色对应常见化学分类：碱金属与碱土金属（第 1、2 族）活泼易失电子；过渡金属（第 3-12 族）多为坚硬耐蚀的常用金属；
            主族金属与类金属、非金属、卤素、稀有气体覆盖 p 区；镧系与锕系单独成行。点图例可只高亮一类，快速观察同族纵列规律。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么镧系锕系单独放在下方</h3>
          <p>
            镧系（57-71）与锕系（89-103）属于 f 区，共 15 种元素电子填入方式相同、性质高度相似。
            若按真实位置插入第 6、7 周期第 3 族，表格会被拉得极宽，因此通行做法是在主表下方单独排两行，主表中以占位格标注。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么有些原子量是整数？</span>放射性元素（如锝、钷及 84 号之后）没有稳定同位素，表中取最稳定或常见同位素的质量数，故多为整数；稳定元素取 4 位有效数字。</li>
            <li><span class="text-foreground font-medium">搜索支持什么方式？</span>支持中文名（如「铁」）、元素符号（如 Fe，不区分大小写）与原子序数（如 26）三种方式，不匹配的元素会自动变暗。</li>
            <li><span class="text-foreground font-medium">数据准确吗？</span>原子量按 IUPAC 公布值取 4 位有效数字整理，超重元素数值随研究可能修订，考试与科研请以最新教材和官方数据为准。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'periodic-table'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  TestTube, Search, X, Atom,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '元素周期表速查 - 118 种元素名称/原子量/分类查询',
  description: '在线交互式元素周期表，内置 118 种元素的序数、符号、中英文名、原子量、分类、周期与族，支持中文名/符号/序数搜索与分类着色筛选，点选查看常见用途，纯本地计算',
  keywords: '元素周期表, 化学元素查询, 原子量查询, 元素周期表高清, 化学学习, 元素分类',
  author: 'Util工具箱',
  ogTitle: '元素周期表速查 - 有条工具',
  ogDescription: '118 种元素交互式周期表，点选查看名称/原子量/分类与常见用途',
  ogUrl: 'https://www.util.cn/tools/periodic-table',
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
          name: '元素周期表速查',
          url: 'https://www.util.cn/tools/periodic-table',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['118 种元素标准布局', '分类着色与图例筛选', '中文名/符号/序数搜索', '点选查看详情与用途', '镧系锕系分列显示']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '生活工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '元素周期表速查', item: 'https://www.util.cn/tools/periodic-table/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么有些原子量是整数？',
              acceptedAnswer: { '@type': 'Answer', text: '放射性元素没有稳定同位素，表中取最稳定或常见同位素的质量数，故多为整数。' }
            },
            {
              '@type': 'Question',
              name: '搜索支持什么方式？',
              acceptedAnswer: { '@type': 'Answer', text: '支持中文名、元素符号（不区分大小写）与原子序数三种方式，不匹配的元素自动变暗。' }
            },
            {
              '@type': 'Question',
              name: '数据准确吗？',
              acceptedAnswer: { '@type': 'Answer', text: '原子量按 IUPAC 公布值取 4 位有效数字整理，考试与科研请以最新教材和官方数据为准。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'periodic-table')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ===== [PURE-START] 元素静态数据与查询纯函数（可独立提取测试） =====
// 分类元数据：label 中文名 / cell 单元格配色 / dot 图例色点
const CATEGORY_META = {
  alkali:     { label: '碱金属',   cell: 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100',           dot: 'bg-red-400' },
  alkaline:   { label: '碱土金属', cell: 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-100', dot: 'bg-orange-400' },
  transition: { label: '过渡金属', cell: 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100',   dot: 'bg-amber-400' },
  post:       { label: '主族金属', cell: 'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-100',         dot: 'bg-teal-400' },
  metalloid:  { label: '类金属',   cell: 'bg-lime-100 dark:bg-lime-900/40 border-lime-300 dark:border-lime-700 text-lime-900 dark:text-lime-100',         dot: 'bg-lime-400' },
  nonmetal:   { label: '非金属',   cell: 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100', dot: 'bg-emerald-400' },
  halogen:    { label: '卤素',     cell: 'bg-cyan-100 dark:bg-cyan-900/40 border-cyan-300 dark:border-cyan-700 text-cyan-900 dark:text-cyan-100',         dot: 'bg-cyan-400' },
  noble:      { label: '稀有气体', cell: 'bg-sky-100 dark:bg-sky-900/40 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-100',               dot: 'bg-sky-400' },
  lanthanide: { label: '镧系',     cell: 'bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700 text-violet-900 dark:text-violet-100', dot: 'bg-violet-400' },
  actinide:   { label: '锕系',     cell: 'bg-fuchsia-100 dark:bg-fuchsia-900/40 border-fuchsia-300 dark:border-fuchsia-700 text-fuchsia-900 dark:text-fuchsia-100', dot: 'bg-fuchsia-400' }
}

// 118 种元素：[序数, 符号, 中文名, 英文名, 原子量(4位有效), 分类, 周期, 族, 常见用途]
// 放射性元素（锝、钷及 84 号之后）原子量取最稳定/常见同位素质量数
const EL = [
  [1, 'H', '氢', 'Hydrogen', 1.008, 'nonmetal', 1, 1, '最轻元素，化工合成与氢能源原料'],
  [2, 'He', '氦', 'Helium', 4.003, 'noble', 1, 18, '气球充气、低温冷却与保护气'],
  [3, 'Li', '锂', 'Lithium', 6.94, 'alkali', 2, 1, '锂电池核心材料、陶瓷玻璃'],
  [4, 'Be', '铍', 'Beryllium', 9.012, 'alkaline', 2, 2, 'X 射线窗口、航天合金'],
  [5, 'B', '硼', 'Boron', 10.81, 'metalloid', 2, 13, '硼硅玻璃、玻璃纤维、洗涤剂'],
  [6, 'C', '碳', 'Carbon', 12.01, 'nonmetal', 2, 14, '钢铁、石墨电极、钻石与碳材料'],
  [7, 'N', '氮', 'Nitrogen', 14.01, 'nonmetal', 2, 15, '液氮冷冻、化肥、保护气'],
  [8, 'O', '氧', 'Oxygen', 16.00, 'nonmetal', 2, 16, '呼吸与燃烧、医疗供氧、炼钢'],
  [9, 'F', '氟', 'Fluorine', 18.998, 'halogen', 2, 17, '含氟牙膏、制冷剂、特氟龙涂层'],
  [10, 'Ne', '氖', 'Neon', 20.18, 'noble', 2, 18, '霓虹灯、激光、低温制冷剂'],
  [11, 'Na', '钠', 'Sodium', 22.99, 'alkali', 3, 1, '食盐、烧碱工业、钠灯'],
  [12, 'Mg', '镁', 'Magnesium', 24.31, 'alkaline', 3, 2, '轻质合金、烟花、叶绿素核心'],
  [13, 'Al', '铝', 'Aluminium', 26.98, 'post', 3, 13, '门窗型材、包装箔、轻量化交通'],
  [14, 'Si', '硅', 'Silicon', 28.09, 'metalloid', 3, 14, '芯片、光伏电池、玻璃与有机硅'],
  [15, 'P', '磷', 'Phosphorus', 30.97, 'nonmetal', 3, 15, '磷肥、火柴、磷酸盐食品添加剂'],
  [16, 'S', '硫', 'Sulfur', 32.06, 'nonmetal', 3, 16, '硫酸、橡胶硫化、杀菌剂'],
  [17, 'Cl', '氯', 'Chlorine', 35.45, 'halogen', 3, 17, '自来水消毒、PVC 塑料、漂白剂'],
  [18, 'Ar', '氩', 'Argon', 39.95, 'noble', 3, 18, '焊接保护气、灯泡填充气'],
  [19, 'K', '钾', 'Potassium', 39.10, 'alkali', 4, 1, '钾肥、生理电解质、钾玻璃'],
  [20, 'Ca', '钙', 'Calcium', 40.08, 'alkaline', 4, 2, '水泥建材、骨骼牙齿成分'],
  [21, 'Sc', '钪', 'Scandium', 44.96, 'transition', 4, 3, '铝钪合金、体育器材、探照灯'],
  [22, 'Ti', '钛', 'Titanium', 47.87, 'transition', 4, 4, '航空合金、医用植入物、耐腐蚀件'],
  [23, 'V', '钒', 'Vanadium', 50.94, 'transition', 4, 5, '合金钢强化、钒液流电池'],
  [24, 'Cr', '铬', 'Chromium', 52.00, 'transition', 4, 6, '不锈钢、电镀、耐蚀涂层'],
  [25, 'Mn', '锰', 'Manganese', 54.94, 'transition', 4, 7, '炼钢脱氧、干电池、锰钢'],
  [26, 'Fe', '铁', 'Iron', 55.85, 'transition', 4, 8, '钢铁工业、血红蛋白核心'],
  [27, 'Co', '钴', 'Cobalt', 58.93, 'transition', 4, 9, '电池正极、强磁体、高温合金'],
  [28, 'Ni', '镍', 'Nickel', 58.69, 'transition', 4, 10, '不锈钢、电镀、动力电池'],
  [29, 'Cu', '铜', 'Copper', 63.55, 'transition', 4, 11, '电线电缆、电机、铜管'],
  [30, 'Zn', '锌', 'Zinc', 65.38, 'transition', 4, 12, '镀锌防腐、黄铜、干电池'],
  [31, 'Ga', '镓', 'Gallium', 69.72, 'post', 4, 13, '化合物半导体、LED、体温计'],
  [32, 'Ge', '锗', 'Germanium', 72.63, 'metalloid', 4, 14, '红外光学、光纤掺杂、半导体'],
  [33, 'As', '砷', 'Arsenic', 74.92, 'metalloid', 4, 15, '半导体掺杂、合金强化'],
  [34, 'Se', '硒', 'Selenium', 78.97, 'nonmetal', 4, 16, '光电材料、玻璃脱色、抗氧化剂'],
  [35, 'Br', '溴', 'Bromine', 79.90, 'halogen', 4, 17, '阻燃剂、感光材料、钻井液'],
  [36, 'Kr', '氪', 'Krypton', 83.80, 'noble', 4, 18, '高效灯泡、激光、中空窗充气'],
  [37, 'Rb', '铷', 'Rubidium', 85.47, 'alkali', 5, 1, '原子钟、光电管、科研'],
  [38, 'Sr', '锶', 'Strontium', 87.62, 'alkaline', 5, 2, '红色烟花、铁氧体磁体'],
  [39, 'Y', '钇', 'Yttrium', 88.91, 'transition', 5, 3, 'LED 荧光粉、超导材料、激光晶体'],
  [40, 'Zr', '锆', 'Zirconium', 91.22, 'transition', 5, 4, '核燃料包壳、陶瓷、耐蚀件'],
  [41, 'Nb', '铌', 'Niobium', 92.91, 'transition', 5, 5, '超导磁体、合金钢、珠宝'],
  [42, 'Mo', '钼', 'Molybdenum', 95.95, 'transition', 5, 6, '高强度钢、润滑剂、电极'],
  [43, 'Tc', '锝', 'Technetium', 98, 'transition', 5, 7, '医学影像示踪剂'],
  [44, 'Ru', '钌', 'Ruthenium', 101.1, 'transition', 5, 8, '催化剂、电触点、芯片互连'],
  [45, 'Rh', '铑', 'Rhodium', 102.9, 'transition', 5, 9, '汽车催化转化器、镜面镀层'],
  [46, 'Pd', '钯', 'Palladium', 106.4, 'transition', 5, 10, '催化转化、电子元件、加氢催化'],
  [47, 'Ag', '银', 'Silver', 107.9, 'transition', 5, 11, '导电触点、首饰、抗菌材料'],
  [48, 'Cd', '镉', 'Cadmium', 112.4, 'transition', 5, 12, '镍镉电池、颜料、电镀'],
  [49, 'In', '铟', 'Indium', 114.8, 'post', 5, 13, 'ITO 触摸屏、低温焊料'],
  [50, 'Sn', '锡', 'Tin', 118.7, 'post', 5, 14, '焊料、马口铁罐、食品包装'],
  [51, 'Sb', '锑', 'Antimony', 121.8, 'metalloid', 5, 15, '阻燃剂、合金硬化、半导体'],
  [52, 'Te', '碲', 'Tellurium', 127.6, 'metalloid', 5, 16, '薄膜光伏、热电材料、合金添加剂'],
  [53, 'I', '碘', 'Iodine', 126.9, 'halogen', 5, 17, '消毒剂、加碘盐、造影剂'],
  [54, 'Xe', '氙', 'Xenon', 131.3, 'noble', 5, 18, '氙气大灯、麻醉、离子推进'],
  [55, 'Cs', '铯', 'Cesium', 132.9, 'alkali', 6, 1, '原子钟标准、光电管、钻井液'],
  [56, 'Ba', '钡', 'Barium', 137.3, 'alkaline', 6, 2, '胃肠造影剂、烟花、钻井液'],
  [57, 'La', '镧', 'Lanthanum', 138.9, 'lanthanide', 6, 3, '镜头玻璃、储氢合金、催化剂'],
  [58, 'Ce', '铈', 'Cerium', 140.1, 'lanthanide', 6, 3, '打火石、抛光粉、尾气催化剂'],
  [59, 'Pr', '镨', 'Praseodymium', 140.9, 'lanthanide', 6, 3, '强磁体、焊工护目镜、玻璃着色'],
  [60, 'Nd', '钕', 'Neodymium', 144.2, 'lanthanide', 6, 3, '钕铁硼强磁、电机、耳机'],
  [61, 'Pm', '钷', 'Promethium', 145, 'lanthanide', 6, 3, '核电池、微光源'],
  [62, 'Sm', '钐', 'Samarium', 150.4, 'lanthanide', 6, 3, '高温磁体、激光器'],
  [63, 'Eu', '铕', 'Europium', 152, 'lanthanide', 6, 3, '红色荧光粉、防伪油墨'],
  [64, 'Gd', '钆', 'Gadolinium', 157.3, 'lanthanide', 6, 3, 'MRI 造影剂、中子屏蔽'],
  [65, 'Tb', '铽', 'Terbium', 158.9, 'lanthanide', 6, 3, '绿色荧光粉、磁致伸缩材料'],
  [66, 'Dy', '镝', 'Dysprosium', 162.5, 'lanthanide', 6, 3, '磁体耐温强化、核控制棒'],
  [67, 'Ho', '钬', 'Holmium', 164.9, 'lanthanide', 6, 3, '医用激光、强磁聚焦'],
  [68, 'Er', '铒', 'Erbium', 167.3, 'lanthanide', 6, 3, '光纤放大器、激光医疗'],
  [69, 'Tm', '铥', 'Thulium', 168.9, 'lanthanide', 6, 3, '便携 X 光源、激光器'],
  [70, 'Yb', '镱', 'Ytterbium', 173, 'lanthanide', 6, 3, '原子钟、光纤激光器'],
  [71, 'Lu', '镥', 'Lutetium', 175, 'lanthanide', 6, 3, 'PET 闪烁晶体、石油催化'],
  [72, 'Hf', '铪', 'Hafnium', 178.5, 'transition', 6, 4, '核控制棒、芯片栅极材料'],
  [73, 'Ta', '钽', 'Tantalum', 180.9, 'transition', 6, 5, '钽电容、医用植入、化工防腐'],
  [74, 'W', '钨', 'Tungsten', 183.8, 'transition', 6, 6, '灯丝、硬质合金、穿甲弹芯'],
  [75, 'Re', '铼', 'Rhenium', 186.2, 'transition', 6, 7, '航空发动机叶片、催化剂'],
  [76, 'Os', '锇', 'Osmium', 190.2, 'transition', 6, 8, '超硬合金、笔尖、电触点'],
  [77, 'Ir', '铱', 'Iridium', 192.2, 'transition', 6, 9, '火花塞、坩埚、电极'],
  [78, 'Pt', '铂', 'Platinum', 195.1, 'transition', 6, 10, '催化转化器、首饰、化疗药物'],
  [79, 'Au', '金', 'Gold', 197, 'transition', 6, 11, '货币首饰、电子触点、牙科'],
  [80, 'Hg', '汞', 'Mercury', 200.6, 'transition', 6, 12, '温度计血压计（渐淘汰）、荧光灯'],
  [81, 'Tl', '铊', 'Thallium', 204.4, 'post', 6, 13, '红外光学元件（严格管控）'],
  [82, 'Pb', '铅', 'Lead', 207.2, 'post', 6, 14, '蓄电池、防辐射材料、焊料'],
  [83, 'Bi', '铋', 'Bismuth', 209, 'post', 6, 15, '胃药、低熔点合金、化妆品'],
  [84, 'Po', '钋', 'Polonium', 209, 'post', 6, 16, '防静电刷、微型热源'],
  [85, 'At', '砹', 'Astatine', 210, 'halogen', 6, 17, '科研用放射性元素'],
  [86, 'Rn', '氡', 'Radon', 222, 'noble', 6, 18, '放射性气体、地质示踪'],
  [87, 'Fr', '钫', 'Francium', 223, 'alkali', 7, 1, '稀有放射性碱金属、科研'],
  [88, 'Ra', '镭', 'Radium', 226, 'alkaline', 7, 2, '历史发光涂料、放疗先驱'],
  [89, 'Ac', '锕', 'Actinium', 227, 'actinide', 7, 3, '靶向放射治疗、中子源'],
  [90, 'Th', '钍', 'Thorium', 232, 'actinide', 7, 3, '潜在核燃料、合金强化'],
  [91, 'Pa', '镤', 'Protactinium', 231, 'actinide', 7, 3, '科研示踪剂'],
  [92, 'U', '铀', 'Uranium', 238, 'actinide', 7, 3, '核燃料、历史着色玻璃'],
  [93, 'Np', '镎', 'Neptunium', 237, 'actinide', 7, 3, '中子探测、科研'],
  [94, 'Pu', '钚', 'Plutonium', 244, 'actinide', 7, 3, '核燃料、航天核电池'],
  [95, 'Am', '镅', 'Americium', 243, 'actinide', 7, 3, '烟雾报警器电离源'],
  [96, 'Cm', '锔', 'Curium', 247, 'actinide', 7, 3, '航天热源、元素合成靶材'],
  [97, 'Bk', '锫', 'Berkelium', 247, 'actinide', 7, 3, '合成超重元素靶材'],
  [98, 'Cf', '锎', 'Californium', 251, 'actinide', 7, 3, '中子源、油井测井'],
  [99, 'Es', '锿', 'Einsteinium', 252, 'actinide', 7, 3, '科研合成元素'],
  [100, 'Fm', '镄', 'Fermium', 257, 'actinide', 7, 3, '科研合成元素'],
  [101, 'Md', '钔', 'Mendelevium', 258, 'actinide', 7, 3, '科研合成元素'],
  [102, 'No', '锘', 'Nobelium', 259, 'actinide', 7, 3, '科研合成元素'],
  [103, 'Lr', '铹', 'Lawrencium', 266, 'actinide', 7, 3, '科研合成元素'],
  [104, 'Rf', '𬬻', 'Rutherfordium', 267, 'transition', 7, 4, '人工合成超重元素'],
  [105, 'Db', '𬭊', 'Dubnium', 268, 'transition', 7, 5, '人工合成超重元素'],
  [106, 'Sg', '𬭳', 'Seaborgium', 269, 'transition', 7, 6, '人工合成超重元素'],
  [107, 'Bh', '𬭛', 'Bohrium', 270, 'transition', 7, 7, '人工合成超重元素'],
  [108, 'Hs', '𬭶', 'Hassium', 277, 'transition', 7, 8, '人工合成超重元素'],
  [109, 'Mt', '鿏', 'Meitnerium', 278, 'transition', 7, 9, '人工合成超重元素'],
  [110, 'Ds', '𬭸', 'Darmstadtium', 281, 'transition', 7, 10, '人工合成超重元素'],
  [111, 'Rg', '𬬮', 'Roentgenium', 282, 'transition', 7, 11, '人工合成超重元素'],
  [112, 'Cn', '鿔', 'Copernicium', 285, 'transition', 7, 12, '人工合成超重元素'],
  [113, 'Nh', '鿭', 'Nihonium', 286, 'post', 7, 13, '人工合成超重元素'],
  [114, 'Fl', '𫓧', 'Flerovium', 289, 'post', 7, 14, '人工合成超重元素'],
  [115, 'Mc', '镆', 'Moscovium', 290, 'post', 7, 15, '人工合成超重元素'],
  [116, 'Lv', '𫟷', 'Livermorium', 293, 'post', 7, 16, '人工合成超重元素'],
  [117, 'Ts', '鿬', 'Tennessine', 294, 'halogen', 7, 17, '人工合成超重元素'],
  [118, 'Og', '鿫', 'Oganesson', 294, 'noble', 7, 18, '人工合成超重元素']
]

function toElements() {
  return EL.map((r) => ({
    z: r[0], symbol: r[1], zh: r[2], en: r[3], weight: r[4],
    cat: r[5], period: r[6], group: r[7], use: r[8]
  }))
}

// 标准布局定位：镧系/锕系置于第 9/10 行（第 8 行为空行），列从第 3 列起
function elementGridPos(el) {
  if (el.cat === 'lanthanide') return { col: el.z - 57 + 3, row: 9 }
  if (el.cat === 'actinide') return { col: el.z - 89 + 3, row: 10 }
  return { col: el.group, row: el.period }
}

// 搜索匹配：中文名/英文名/符号（不区分大小写）/序数
function matchElementQuery(el, q) {
  const s = String(q || '').trim()
  if (!s) return true
  const lower = s.toLowerCase()
  return (
    el.zh.includes(s) ||
    el.en.toLowerCase().includes(lower) ||
    el.symbol.toLowerCase().includes(lower) ||
    String(el.z).includes(s)
  )
}

// 无稳定同位素的元素：锝、钷及 84 号之后
function hasNoStableIsotope(z) {
  return z === 43 || z === 61 || z >= 84
}
// ===== [PURE-END] =====

// ---------- 状态 ----------
const elements = toElements()
const query = ref('')
const activeCat = ref('')
const selectedZ = ref(1)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const gridCols = 'repeat(18, minmax(0, 1fr))'
const gridRows = 'repeat(7, minmax(50px, auto)) 14px repeat(2, minmax(50px, auto))'

const select = (el) => { selectedZ.value = el.z }

const toggleCat = (key) => {
  activeCat.value = activeCat.value === key ? '' : key
}

const isDimmed = (el) => {
  if (activeCat.value && el.cat !== activeCat.value) return true
  return !matchElementQuery(el, query.value)
}

const matchedCount = computed(() => elements.filter(el => !isDimmed(el)).length)

const selected = computed(() => elements.find(el => el.z === selectedZ.value) || null)

const groupLabel = (el) => {
  if (el.cat === 'lanthanide') return '第 3 族位置（镧系）'
  if (el.cat === 'actinide') return '第 3 族位置（锕系）'
  return '第 ' + el.group + ' 族'
}
</script>
