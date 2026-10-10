<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Droplets class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">洗涤标签速查</h1>
          <p class="text-sm text-muted-foreground mt-1">衣服洗涤标志图解对照，水洗/漂白/干燥/熨烫/干洗 23 个符号一键查询</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        衣服内侧的小标签看不懂？水洗槽、三角形、正方形、熨斗、圆圈五种图形分别对应水洗、漂白、干燥、熨烫和专业护理五大类。点击符号卡片查看含义与护理建议，也可以进入「符号自测」模式检验自己认不认得它们——再也不怕把毛衣洗成童装。全部内容本地渲染，无需联网查询。
      </p>
    </div>

    <!-- 分组筛选 -->
    <div class="flex flex-wrap items-center gap-2 mb-6">
      <button
        @click="activeGroup = 'all'"
        :class="activeGroup === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
        class="px-4 py-2 rounded-full text-sm font-medium transition-all"
      >全部（{{ symbols.length }}）</button>
      <button
        v-for="g in groups"
        :key="g.key"
        @click="activeGroup = g.key"
        :class="activeGroup === g.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
        class="px-4 py-2 rounded-full text-sm font-medium transition-all"
      >{{ g.label }}（{{ symbols.filter(s => s.group === g.key).length }}）</button>

      <button
        v-if="!quizMode"
        @click="startQuiz"
        class="ml-auto px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5"
      >
        <GraduationCap class="w-4 h-4" /> 符号含义自测
      </button>
      <button
        v-else
        @click="quizMode = false"
        class="ml-auto px-4 py-2 rounded-full text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-all flex items-center gap-1.5"
      >
        <X class="w-4 h-4" /> 退出自测
      </button>
    </div>

    <!-- 自测模式 -->
    <div v-if="quizMode" class="bg-card border border-border rounded-lg p-6 mb-8 max-w-2xl mx-auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold flex items-center">
          <GraduationCap class="w-5 h-5 mr-2 text-primary" /> 这是什么洗标？
        </h2>
        <span class="text-sm text-muted-foreground">答对 {{ quizScore.correct }} / {{ quizScore.total }}</span>
      </div>

      <div v-if="quizQuestion" class="space-y-4">
        <div class="flex justify-center py-4">
          <div class="p-5 border border-border rounded-lg">
            <svg viewBox="0 0 64 64" class="w-24 h-24 text-foreground" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" v-html="quizQuestion.svg"></svg>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            v-for="opt in quizOptions"
            :key="opt.id"
            @click="answerQuiz(opt.id)"
            :disabled="quizAnswered"
            :class="quizAnswered && opt.id === quizQuestion.id
              ? 'bg-primary/10 border-primary text-primary'
              : quizAnswered && opt.id === quizSelected
                ? 'bg-destructive/10 border-destructive text-destructive'
                : 'bg-background border-border text-foreground hover:border-primary'"
            class="px-4 py-3 rounded-lg border text-sm font-medium text-left transition-all disabled:cursor-default"
          >
            {{ opt.name }}
          </button>
        </div>

        <div v-if="quizAnswered" class="space-y-3">
          <div
            :class="quizSelected === quizQuestion.id ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'"
            class="rounded-lg p-3 text-sm font-medium"
          >
            {{ quizSelected === quizQuestion.id ? '回答正确！' : '答错了，正确答案是：' + quizQuestion.name }}
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground leading-relaxed">
            <b class="text-foreground">{{ quizQuestion.name }}</b>：{{ quizQuestion.meaning }}
          </div>
          <button
            @click="nextQuestion"
            class="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw class="w-4 h-4" /> 下一题
          </button>
        </div>
      </div>
    </div>

    <!-- 符号卡片 -->
    <template v-else>
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
        <button
          v-for="sym in filteredSymbols"
          :key="sym.id"
          @click="toggleSymbol(sym.id)"
          :class="selectedId === sym.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'"
          class="bg-card border rounded-lg p-3 flex flex-col items-center gap-2 transition-all cursor-pointer"
        >
          <svg viewBox="0 0 64 64" class="w-14 h-14 text-foreground" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" v-html="sym.svg"></svg>
          <span class="text-xs font-medium text-foreground text-center leading-tight">{{ sym.name }}</span>
        </button>
      </div>

      <!-- 选中符号的说明 -->
      <div v-if="selectedSymbol" class="bg-primary/5 border border-primary/30 rounded-lg p-6 mb-8 flex items-start gap-5">
        <div class="bg-card border border-border rounded-lg p-3 flex-shrink-0">
          <svg viewBox="0 0 64 64" class="w-20 h-20 text-foreground" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" v-html="selectedSymbol.svg"></svg>
        </div>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-bold text-foreground">{{ selectedSymbol.name }}</h3>
            <span class="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{{ groupLabel(selectedSymbol.group) }}</span>
          </div>
          <p class="text-sm font-medium text-foreground">{{ selectedSymbol.meaning }}</p>
          <p class="text-sm text-muted-foreground leading-relaxed">{{ selectedSymbol.detail }}</p>
        </div>
      </div>
    </template>

    <!-- 对照总表（可折叠） -->
    <div class="relative mb-8">
      <button
        @click="tableVisible = !tableVisible"
        class="w-full flex items-center justify-between bg-card border border-border rounded-lg px-6 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span class="font-semibold text-foreground flex items-center">
          <Table class="w-5 h-5 mr-2 text-primary" /> 洗涤符号对照总表（{{ symbols.length }} 个）
        </span>
        <ChevronUp v-if="tableVisible" class="w-5 h-5 text-muted-foreground" />
        <ChevronDown v-else class="w-5 h-5 text-muted-foreground" />
      </button>
      <div v-show="tableVisible" class="bg-card border border-t-0 border-border rounded-b-lg p-6">
        <div class="space-y-1.5">
          <div
            v-for="sym in symbols"
            :key="'t' + sym.id"
            class="flex items-center gap-4 py-2 border-b border-border/40 last:border-0"
          >
            <svg viewBox="0 0 64 64" class="w-9 h-9 text-foreground flex-shrink-0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" v-html="sym.svg"></svg>
            <span class="w-16 text-xs text-muted-foreground flex-shrink-0">{{ groupLabel(sym.group) }}</span>
            <span class="w-40 text-sm font-medium text-foreground flex-shrink-0">{{ sym.name }}</span>
            <span class="text-sm text-muted-foreground">{{ sym.meaning }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="seoContentVisible = !seoContentVisible"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>洗标怎么看：五秒读懂洗涤标志</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            洗涤标签（care label）遵循统一的图形语言：水洗槽代表水洗、三角形代表漂白、正方形代表干燥、熨斗代表熨烫、圆圈代表专业护理（干洗）。图形上叠加元素有固定含义——打叉一律表示「禁止」，数字多表示最高水温（如 40 表示 40°C），熨斗和烘干符号里的点越多代表温度越高（熨斗一点 110°C、两点 150°C、三点 200°C），图形下方加横杠表示需要「缓和/轻柔」处理。
          </p>
          <h3 class="text-lg font-semibold text-foreground">最容易洗坏的三个符号</h3>
          <p>
            一是三角形打叉（不可漂白）：含氯漂白剂的洗衣粉会让彩色衣物瞬间褪色；二是正方形加圆圈打叉（不可烘干）：羊毛、真丝和弹力面料进烘干机基本等于报废；三是圆圈打叉（不可干洗）：含 PU 涂层或橡胶装饰的衣服遇干洗溶剂会开裂发粘。买新衣服后先看这三处，能避开九成洗坏事故。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">符号上的数字和点代表什么？</span>水洗槽里的数字是最高水温（30/40/60/95°C）；熨斗里的点越多底板温度越高（一点 110°C、两点 150°C、三点 200°C）；烘干圆圈里的点表示烘干温度档位，一点低温、两点高温。</li>
            <li><span class="text-foreground font-medium">图形下面加横杠是什么意思？</span>表示「缓和处理」：水洗槽下加杠选轻柔档，干洗圆圈下加杠需缓和程序，机械作用和温度都要降低。</li>
            <li><span class="text-foreground font-medium">水洗和干洗都打了叉怎么办？</span>这类衣物标注为仅可专业护理，建议送到洗衣店说明面料，由专业人员选择湿洗或其他安全方式处理。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'laundry-symbol-guide'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Droplets, GraduationCap, X, RotateCcw, Table, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '洗涤标签速查 - 衣服洗涤标志图解对照与符号含义',
  description: '衣服洗涤标志图解对照表，水洗/漂白/干燥/熨烫/干洗23个常见洗涤符号一键查询，含符号含义自测小测验，再也不怕洗坏衣服，纯本地渲染',
  keywords: '洗涤标志图解, 洗衣符号对照表, 洗涤标签, 衣服洗标, 干洗标志, 洗涤符号含义',
  author: 'Util工具箱',
  ogTitle: '洗涤标签速查 - 有条工具',
  ogDescription: '衣服洗涤标志图解对照，水洗/漂白/熨烫/干洗符号一键查询，再也不怕洗坏衣服',
  ogUrl: 'https://www.util.cn/tools/laundry-symbol-guide',
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
          name: '洗涤标签速查',
          url: 'https://www.util.cn/tools/laundry-symbol-guide',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['23个常见洗涤符号图解', '水洗/漂白/干燥/熨烫/干洗分组', '符号含义自测小测验', '对照总表', '分组筛选速查']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '洗涤标签速查', item: 'https://www.util.cn/tools/laundry-symbol-guide/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '洗涤标志怎么看？',
              acceptedAnswer: { '@type': 'Answer', text: '水洗槽代表水洗、三角形代表漂白、正方形代表干燥、熨斗代表熨烫、圆圈代表专业护理；图形打叉表示禁止，点或数字表示温度档位，下方横杠表示缓和处理。' }
            },
            {
              '@type': 'Question',
              name: '熨斗上的点代表什么温度？',
              acceptedAnswer: { '@type': 'Answer', text: '一点约110°C（低温，合成纤维）、两点约150°C（中温，涤棉羊毛）、三点约200°C（高温，棉麻）。' }
            },
            {
              '@type': 'Question',
              name: '不可烘干和不可水洗的衣服怎么处理？',
              acceptedAnswer: { '@type': 'Answer', text: '不可烘干的衣物选择自然晾干（悬挂或平铺）；不可水洗的看干洗圆圈标注，可干洗则送干洗店，两者都禁止的需专业护理。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'laundry-symbol-guide')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- SVG 图形常量（viewBox 64x64，stroke 继承根节点 currentColor） ----------
const TUB = '<path d="M10 22 L14 46 Q15 50 19 50 L45 50 Q49 50 50 46 L54 22"/><path d="M12 28 Q17 23 22 28 T32 28 T42 28 T52 28"/>'
const TUB_ONLY = '<path d="M10 22 L14 46 Q15 50 19 50 L45 50 Q49 50 50 46 L54 22"/>'
const num = (t) => '<text x="32" y="45" font-size="15" font-weight="bold" text-anchor="middle" fill="currentColor" stroke="none">' + t + '</text>'
const CROSS = '<line x1="14" y1="14" x2="50" y2="50"/><line x1="50" y1="14" x2="14" y2="50"/>'
const TRIANGLE = '<path d="M32 13 L55 50 L9 50 Z"/>'
const SQUARE = '<rect x="12" y="12" width="40" height="40" rx="2"/>'
const BAR = '<line x1="22" y1="56" x2="42" y2="56"/>'
const TUMBLE = SQUARE + '<circle cx="32" cy="32" r="9"/>'
const dot = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="2.2" fill="currentColor" stroke="none"/>'
const IRON = '<path d="M10 44 L20 22 Q21.5 19 25 19 L52 19 Q55 19 55 22 L55 40 Q55 44 51 44 Z"/>'
const CIRCLE = '<circle cx="32" cy="30" r="19"/>'
const P = '<text x="32" y="36" font-size="18" font-weight="bold" text-anchor="middle" fill="currentColor" stroke="none">P</text>'
const PRO_BAR = '<line x1="22" y1="55" x2="42" y2="55"/>'

// ---------- 符号数据 ----------
const symbols = [
  // 水洗（水洗槽）
  { id: 'wash-30', group: 'wash', name: '30°C 水洗', meaning: '可机洗，最高水温 30°C，常规程序', detail: '常见于含羊毛混纺、深色或易缩水面料。水温过高易缩水褪色，机洗常规或轻柔档均可。', svg: TUB + num('30') },
  { id: 'wash-40', group: 'wash', name: '40°C 水洗', meaning: '可机洗，最高水温 40°C，常规程序', detail: '棉、涤纶等日常衣物最常见的洗标，常规程序机洗即可，注意深浅色分开。', svg: TUB + num('40') },
  { id: 'wash-60', group: 'wash', name: '60°C 水洗', meaning: '可机洗，最高水温 60°C，常规程序', detail: '床品、毛巾、婴幼儿衣物常用高温档，有助于除螨除菌；纯棉之外的面料慎用。', svg: TUB + num('60') },
  { id: 'wash-95', group: 'wash', name: '95°C 水洗', meaning: '可机洗，最高水温 95°C，需高温处理', detail: '极少见，多用于需要煮洗消毒的特殊织物，普通衣物请勿尝试。', svg: TUB + num('95') },
  { id: 'wash-hand', group: 'wash', name: '手洗', meaning: '只需手洗，请勿机洗，最高水温 40°C', detail: '蕾丝、真丝、羊毛等娇贵面料：温水轻柔手洗，勿拧绞，按压去水后平铺或挂干。', svg: TUB_ONLY + '<path d="M25 44 v-8 q0 -3 3 -3 h8 q3 0 3 3 v8"/><line x1="29" y1="33" x2="29" y2="27"/><line x1="32" y1="33" x2="32" y2="25"/><line x1="35" y1="33" x2="35" y2="27"/>' },
  { id: 'wash-gentle', group: 'wash', name: '缓和洗涤', meaning: '可机洗，但需选轻柔（缓和）程序', detail: '水洗槽下加横杠表示缓和处理，适合针织、带亮片或涂层衣物，建议装入洗衣袋。', svg: TUB + BAR },
  { id: 'wash-never', group: 'wash', name: '不可水洗', meaning: '不能水洗（机洗、手洗均不可）', detail: '通常对应需要专业护理的面料，请按标签上的干洗等护理方式处理。', svg: TUB + CROSS },
  // 漂白（三角形）
  { id: 'bleach-any', group: 'bleach', name: '可漂白', meaning: '可使用任意漂白剂', detail: '耐氯漂也耐氧漂，白色棉织物常见；仍建议按漂白剂包装说明控制浓度与时间。', svg: TRIANGLE },
  { id: 'bleach-oxygen', group: 'bleach', name: '仅氧漂', meaning: '只能用含氧漂白剂（彩漂），禁用含氯漂白', detail: '三角形内双斜线表示仅氧漂；氧漂温和不伤色，氯漂会使彩色面料褪色、纤维变脆。', svg: TRIANGLE + '<line x1="20" y1="45" x2="35" y2="30"/><line x1="28" y1="48" x2="43" y2="33"/>' },
  { id: 'bleach-never', group: 'bleach', name: '不可漂白', meaning: '禁用任何漂白剂', detail: '避免使用含漂白成分的洗衣粉/洗衣液，局部顽渍可用专用去渍品小范围处理。', svg: TRIANGLE + CROSS },
  // 干燥（正方形）
  { id: 'dry-tumble', group: 'dry', name: '可翻转烘干', meaning: '可用滚筒烘干机，常规温度', detail: '纯棉T恤、毛巾等耐烘面料；烘干前充分脱水可缩短时间、减少褶皱。', svg: TUMBLE },
  { id: 'dry-tumble-low', group: 'dry', name: '低温烘干', meaning: '可滚筒烘干，低温档（一点，约 60°C）', detail: '一点表示低温烘干，化纤、弹力面料适用；高温会导致弹力纤维老化缩水。', svg: TUMBLE + dot(32, 32) },
  { id: 'dry-tumble-high', group: 'dry', name: '高温烘干', meaning: '可滚筒烘干，高温档（两点，约 80°C）', detail: '两点表示可承受较高烘干温度，常见于厚棉毛巾、床品等织物。', svg: TUMBLE + dot(28.5, 32) + dot(35.5, 32) },
  { id: 'dry-tumble-never', group: 'dry', name: '不可烘干', meaning: '禁止使用滚筒烘干机', detail: '羊毛、真丝及带弹力/涂层衣物进烘干机极易缩水变形报废，洗后自然晾干。', svg: TUMBLE + CROSS },
  { id: 'dry-hang', group: 'dry', name: '悬挂晾干', meaning: '洗后挂起滴干，勿机脱水或拧绞', detail: '正方形内一条竖线。适合大件织物；注意毛衣类勿悬挂，以防重力拉长变形。', svg: SQUARE + '<line x1="32" y1="16" x2="32" y2="48"/>' },
  { id: 'dry-flat', group: 'dry', name: '平铺晾干', meaning: '平放摊开晾干，防止变形', detail: '正方形内一条横线。羊毛衫、羽绒、针织类必须平铺晾干，悬挂会坠长走形。', svg: SQUARE + '<line x1="16" y1="32" x2="48" y2="32"/>' },
  // 熨烫（熨斗）
  { id: 'iron-1', group: 'iron', name: '低温熨烫 110°C', meaning: '熨斗一点，最高底板温度约 110°C', detail: '合成纤维（涤纶、锦纶、腈纶）适用；温度过高会亮面、熔粘，建议垫布。', svg: IRON + dot(37, 34) },
  { id: 'iron-2', group: 'iron', name: '中温熨烫 150°C', meaning: '熨斗两点，最高底板温度约 150°C', detail: '涤棉、混纺、羊毛适用，建议垫布并使用蒸汽，羊毛类可趁半干熨烫。', svg: IRON + dot(31, 34) + dot(43, 34) },
  { id: 'iron-3', group: 'iron', name: '高温熨烫 200°C', meaning: '熨斗三点，最高底板温度约 200°C', detail: '棉麻及白色衣物适用，可用蒸汽强力熨压；深色面料建议反面熨烫。', svg: IRON + dot(26, 34) + dot(37, 34) + dot(48, 34) },
  { id: 'iron-never', group: 'iron', name: '不可熨烫', meaning: '禁止熨烫', detail: '常见于带涂层、压花、绒面（如丝绒）或含弹性纤维的衣物，受热即永久损伤。', svg: IRON + CROSS },
  // 专业护理（圆圈）
  { id: 'pro-dry', group: 'pro', name: '可干洗（P）', meaning: '可用常规干洗溶剂专业干洗', detail: '圆圈内字母 P，四氯乙烯或碳氢溶剂均可；西装、大衣等毛料首选干洗。', svg: CIRCLE + P },
  { id: 'pro-dry-gentle', group: 'pro', name: '缓和干洗', meaning: '可干洗，但需缓和程序、控制水分与机械作用', detail: '圆圈 P 下方加横杠，娇贵面料或带饰物衣物请告知干洗店缓和处理。', svg: CIRCLE + P + PRO_BAR },
  { id: 'pro-dry-never', group: 'pro', name: '不可干洗', meaning: '禁止干洗', detail: '圆圈打叉。含橡胶、PU 涂层等对干洗溶剂敏感的材质，请按水洗说明护理。', svg: CIRCLE + CROSS }
]

const groups = [
  { key: 'wash', label: '水洗' },
  { key: 'bleach', label: '漂白' },
  { key: 'dry', label: '干燥' },
  { key: 'iron', label: '熨烫' },
  { key: 'pro', label: '专业护理' }
]

const activeGroup = ref('all')
const selectedId = ref('')
const tableVisible = ref(false)
const seoContentVisible = ref(true)

const filteredSymbols = computed(() => {
  if (activeGroup.value === 'all') return symbols
  return symbols.filter(s => s.group === activeGroup.value)
})

const selectedSymbol = computed(() => symbols.find(s => s.id === selectedId.value) || null)

const groupLabel = (key) => {
  const g = groups.find(item => item.key === key)
  return g ? g.label : ''
}

const toggleSymbol = (id) => {
  selectedId.value = selectedId.value === id ? '' : id
}

// ---------- 自测小测验 ----------
const quizMode = ref(false)
const quizQuestion = ref(null)
const quizOptions = ref([])
const quizAnswered = ref(false)
const quizSelected = ref('')
const quizScore = ref({ correct: 0, total: 0 })

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

const nextQuestion = () => {
  const q = symbols[Math.floor(Math.random() * symbols.length)]
  const sameGroup = shuffle(symbols.filter(s => s.id !== q.id && s.group === q.group))
  const otherGroup = shuffle(symbols.filter(s => s.id !== q.id && s.group !== q.group))
  const distractors = [...sameGroup.slice(0, 2), ...otherGroup.slice(0, 2)].slice(0, 3)
  quizQuestion.value = q
  quizOptions.value = shuffle([q, ...distractors])
  quizAnswered.value = false
  quizSelected.value = ''
}

const startQuiz = () => {
  quizMode.value = true
  quizScore.value = { correct: 0, total: 0 }
  nextQuestion()
}

const answerQuiz = (id) => {
  if (quizAnswered.value || !quizQuestion.value) return
  quizSelected.value = id
  quizAnswered.value = true
  quizScore.value.total += 1
  if (id === quizQuestion.value.id) {
    quizScore.value.correct += 1
  }
}
</script>
