<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Car class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">胎压换算与冷热修正</h1>
          <p class="text-sm text-muted-foreground mt-1">kPa / bar / psi / kgf/cm² 四向换算，冷热胎压判定与载重建议</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线胎压换算器：在 kPa、bar、psi、kgf/cm² 四个单位间任意换算（1 bar = 100 kPa = 14.5 psi ≈ 1.02 kgf/cm²），
        附常见胎压锚点表；冷热修正卡片输入冷胎压基准与行驶升温，判定当前热胎读数是否正常——
        热胎读数 = 冷胎压 + 升温属于物理现象，请勿因热胎读数偏高而放气。另附满载加压口径与备胎高压注记。
        全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        口径说明：换算常数为 1 bar = 100 kPa（定义）、1 psi = 6.894757 kPa、1 kgf/cm² = 98.0665 kPa。
        行驶升温指胎压上升量（市区行驶 <span class="text-foreground font-medium">0.1~0.3 bar 典型</span>，高速/满载更高），
        理想气体下 2.5 bar 胎温每升 10℃ 胎压约升 0.07~0.09 bar。所有判定以<span class="text-foreground font-medium">冷胎压</span>为准，
        具体标准值以<span class="text-foreground font-medium">车辆 B 柱铭牌</span>为准。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 四向换算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ArrowLeftRight class="w-5 h-5 mr-2 text-primary" /> 四向换算（任意一格输入，其余自动更新）
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="u in UNITS" :key="u.key">
              <label :for="'tpc-' + u.key" class="block text-sm font-medium text-foreground mb-1.5">{{ u.label }}</label>
              <div class="flex">
                <input
                  :id="'tpc-' + u.key"
                  :value="displayVal(u.key)"
                  @input="onFieldInput(u.key, $event)"
                  type="number"
                  min="0"
                  step="0.01"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-l-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  :placeholder="u.placeholder"
                >
                <span class="flex items-center px-3 bg-muted border border-border border-l-0 rounded-r-lg text-xs text-muted-foreground whitespace-nowrap">{{ u.unit }}</span>
              </div>
            </div>
          </div>

          <p v-if="!hasValidSource" class="text-xs text-muted-foreground">输入任一单位的胎压数值开始换算。</p>

          <!-- 常见锚点表 -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">bar</th>
                  <th class="py-2 pr-3 font-medium">kPa</th>
                  <th class="py-2 pr-3 font-medium">psi</th>
                  <th class="py-2 pr-3 font-medium">kgf/cm²</th>
                  <th class="py-2 font-medium">常见场景</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in anchorRows"
                  :key="row.bar"
                  class="border-b border-border/50 hover:bg-muted/40 cursor-pointer transition-colors"
                  @click="pickAnchor(row.bar)"
                >
                  <td class="py-2 pr-3 font-semibold text-foreground">{{ row.bar.toFixed(1) }}</td>
                  <td class="py-2 pr-3 text-muted-foreground">{{ row.kpa }}</td>
                  <td class="py-2 pr-3 text-muted-foreground">{{ row.psi }}</td>
                  <td class="py-2 pr-3 text-muted-foreground">{{ row.kgf }}</td>
                  <td class="py-2 text-xs text-muted-foreground">{{ row.note }}</td>
                </tr>
              </tbody>
            </table>
            <p class="text-xs text-muted-foreground mt-2">点击任意一行可把该 bar 值填入换算输入框。</p>
          </div>
        </div>

        <!-- 冷热修正 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Thermometer class="w-5 h-5 mr-2 text-primary" /> 冷热修正判定
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="tpc-cold" class="block text-sm font-medium text-foreground mb-1.5">冷胎压基准（bar）</label>
              <input
                id="tpc-cold"
                v-model.number="coldBar"
                type="number"
                min="0"
                step="0.05"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="铭牌标准值，如 2.5"
              >
            </div>
            <div>
              <label for="tpc-rise" class="block text-sm font-medium text-foreground mb-1.5">行驶后胎压升温（bar）</label>
              <input
                id="tpc-rise"
                v-model.number="riseBar"
                type="number"
                min="0"
                step="0.05"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="典型 0.1~0.3"
              >
              <p class="text-xs text-muted-foreground mt-1">市区行驶 0.1~0.3 bar 典型</p>
            </div>
            <div>
              <label for="tpc-measured" class="block text-sm font-medium text-foreground mb-1.5">当前热胎读数（bar）</label>
              <input
                id="tpc-measured"
                v-model.number="measuredBar"
                type="number"
                min="0"
                step="0.05"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="行驶后实测，如 2.8"
              >
            </div>
          </div>

          <div v-if="judgeValid" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-4 rounded-lg border border-border bg-muted/50 space-y-2">
              <p class="text-sm text-muted-foreground">热胎预期读数 = 冷胎压 + 升温</p>
              <p class="text-2xl font-bold text-foreground">{{ fmt(round(judge.expected, 2)) }} <span class="text-sm font-normal text-muted-foreground">bar（≈ {{ fmt(round(judge.expected * 100, 0)) }} kPa）</span></p>
              <p class="text-xs text-muted-foreground">
                当前读数 {{ fmt(round(Number(measuredBar), 2)) }} bar，
                {{ judge.diff >= 0 ? '高于预期 +' : '低于预期 ' }}{{ fmt(round(Math.abs(judge.diff), 2)) }} bar
              </p>
            </div>
            <div class="p-4 rounded-lg border" :class="judgeCardCls">
              <p class="text-sm font-bold mb-1">{{ judgeTitle }}</p>
              <p class="text-xs leading-relaxed">{{ judgeMsg }}</p>
            </div>
          </div>
          <div v-else class="text-xs text-muted-foreground">填写冷胎压基准、升温与当前读数后给出判定。</div>

          <!-- 红警卡 -->
          <div class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-xs leading-relaxed text-red-600 dark:text-red-400 font-medium">
              红色警示：热胎读数高 ≠ 胎压过高。行驶后胎压升高 0.1~0.3 bar 是气体受热膨胀的正常物理现象，
              绝不要因热胎读数偏高而放气——放气后冷态会明显欠压，反而加剧胎肩磨损与油耗。
              判断胎压永远以冷胎压为准：停车 3 小时以上或行驶不足 2 公里时测量。
            </p>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 载重建议 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Weight class="w-5 h-5 mr-2 text-primary" /> 载重加压建议
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border">
            <p class="text-xs text-muted-foreground">满载 / 长途高速口径</p>
            <p class="text-lg font-bold text-foreground mt-1">铭牌标准值 +0.2~0.3 bar</p>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            空载/日常通勤按 B 柱铭牌标准冷胎压即可；<span class="text-foreground font-medium">满员、满载行李或长时间高速</span>时，
            在铭牌值基础上前轮 +0.2 bar、后轮 +0.2~0.3 bar 常见——加强胎侧支撑、降低屈挠生热。
            <span class="text-foreground font-medium">以车辆铭牌与说明书为准</span>，个别车型有专门的满载胎压行。
          </p>
          <p class="text-xs leading-relaxed text-muted-foreground">
            车辆常备：<span class="text-foreground font-medium">备胎按高压口径存放</span>（小备胎一般 3.5~4.2 bar，见备胎标牌），
            长期不用每月亏压，换上后先按标牌补到规定值再行驶。
          </p>
        </div>

        <!-- 冷胎压定义与检查节奏 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ClipboardCheck class="w-5 h-5 mr-2 text-primary" /> 冷胎压与检查节奏
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">冷胎压定义：</span>停车 3 小时以上，或行驶不足 2 公里（胎温≈气温）时测得的胎压。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">检查频率：</span>每月一次 + 跑长途前必查；自然渗漏每月 0.01~0.03 bar 属正常。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">季节温差：</span>秋冬降温每 10℃ 冷胎压约降 0.07~0.1 bar，入冬记得补压。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>TPMS 胎压监测报警阈值多为 −25% 左右，报警后按冷胎压补齐，不要热胎时补到报警线以上就完事。</span>
            </li>
          </ul>
        </div>

        <!-- 免责 -->
        <div class="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
            免责声明：本页换算为精确单位换算，冷热判定与加压建议为通用工程口径，具体以车辆铭牌、轮胎侧壁标注与厂商手册为准。
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>psi、bar、kPa 怎么读怎么换算？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          三套单位说的是同一件事——轮胎内部气体的压强。<span class="text-foreground font-medium">kPa（千帕）</span>是国际单位制，
          国内新车铭牌与说明书用它；<span class="text-foreground font-medium">bar（巴）</span>约等于一个大气压，
          欧系车与国内加油站气泵最常用；<span class="text-foreground font-medium">psi（磅/平方英寸）</span>是英制，
          美系车、进口胎侧壁与打气棒常见。固定关系：1 bar = 100 kPa ≈ 14.50 psi ≈ 1.02 kgf/cm²。
          快速心算：bar × 100 = kPa；psi ÷ 14.5 ≈ bar；铭牌 2.5 bar = 250 kPa ≈ 36.3 psi ≈ 2.55 kgf/cm²。
          本工具四格任意输入即可互转，不必记系数。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>什么是冷胎压？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          冷胎压指<span class="text-foreground font-medium">停车 3 小时以上、或行驶不足 2 公里</span>（轮胎温度与气温基本一致）时测得的胎压，
          这是所有厂商标定、铭牌标注与胎压监测报警线的基准口径。车辆行驶后轮胎生热，腔内气体升温升压，
          热胎读数普遍比冷胎压高 0.1~0.3 bar（市区），高速满载可到 0.4 bar 以上——这是物理规律不是漏气。
          如果早上冷车测是 2.5 bar，跑完高速看是 2.75 bar，完全正常；此时放气到 2.5，
          等车凉下来实际就只有 2.25 bar，长期偏欠压。所以：冷车定标准，热车只参考。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>轮胎充氮气有没有用？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          氮气是惰性干燥气体，卖点有三：分子略大渗透稍慢、不含水分使胎压随温度波动更小、不氧化轮辋与橡胶。
          但普通空气约 78% 本来就是氮气，对比实验中充氮与充干燥空气的保压与温压差异在真实用车尺度上很小；
          轮胎自然渗漏本来就要每月检查补气，氮气不能免除这项工作。<span class="text-foreground font-medium">结论：免费或顺手可以充，
          花几百块专门买意义不大</span>；比气体种类重要得多的是冷胎压数值本身准不准、每月查不查。
          赛车/性能场景充氮主要是为了干燥无水汽、压强-温度曲线稳定，属于专业需求。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>备胎胎压为什么那么高？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          非全尺寸小备胎（以及部分全尺寸备胎）出厂要求<span class="text-foreground font-medium">充到 3.5~4.2 bar 的高压存放</span>（以备胎或油箱盖内侧标牌为准）：
          一是备胎长期存放会缓慢漏气，起始充高压可保证一年后仍有可用胎压；
          二是换上备胎时你大概率没有气泵，高起点胎压能容忍 slow leak 后仍安全跑到修理店。
          换上备胎后应尽快（建议 60~80 km/h 以内、短途）到店把常规胎修复，并把备胎重新补到标牌高压。
          全尺寸备胎若常年在车底/尾箱，同样按标牌高压存放并纳入每月检查。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">2.5 bar 是多少 kPa 和 psi？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              2.5 bar = 250 kPa ≈ 36.3 psi ≈ 2.55 kgf/cm²。心算记两条：bar×100=kPa；psi÷14.5≈bar。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">热胎测出 2.8 bar，比冷胎压 2.5 高，要放气吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不要放气。冷胎压 2.5、升温 0.25 bar 时热胎预期读数就是 2.75 bar，测得 2.8 属"正常偏热"。
              判断胎压是否合适永远以冷胎压为准；只有冷胎状态超过铭牌值才需要调整。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">满载要加多少胎压？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              通用口径是按 B 柱铭牌标准值上调 0.2~0.3 bar（后轮为主），满员满载与长途高速适用；
              优先查说明书是否有专门的满载胎压行，以车辆铭牌为准。跑完重载行程后恢复标准冷胎压。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">胎压报警灯亮了但看读数不算低？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              TPMS 阈值按冷胎压标定且多为 −25% 报警；冷天早晨温差、某轮慢漏 0.5 bar 都会触发。
              先冷车补到铭牌值并复位，若短时间内同轮再次报警，检查是否扎钉慢漏。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'tire-pressure-convert'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Car, ArrowLeftRight, Thermometer, Info, Weight, ClipboardCheck,
  CheckCircle, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 换算基准（kPa 为锚）：1 bar = 100 kPa（定义）；1 psi = 6.894757293168361 kPa；1 kgf/cm² = 98.0665 kPa
const KPA_PER_BAR = 100
const KPA_PER_PSI = 6.894757293168361
const KPA_PER_KGF = 98.0665

// 任意单位 → kPa
function toKpa(v, unit) {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return null
  if (unit === 'bar') return n * KPA_PER_BAR
  if (unit === 'psi') return n * KPA_PER_PSI
  if (unit === 'kgf') return n * KPA_PER_KGF
  if (unit === 'kpa') return n
  return null
}

// kPa → 四单位（bar/kPa/psi/kgf）
function convertFromKpa(kpa) {
  if (!Number.isFinite(kpa) || kpa < 0) return null
  return {
    kpa,
    bar: kpa / KPA_PER_BAR,
    psi: kpa / KPA_PER_PSI,
    kgf: kpa / KPA_PER_KGF
  }
}

// 四舍五入到 d 位小数（加 EPSILON 防浮点尾差）
function round(v, d) {
  if (!Number.isFinite(v)) return null
  const m = Math.pow(10, d)
  return Math.round((v + Number.EPSILON) * m) / m
}

// 冷热判定：热胎预期 = 冷胎基准 + 升温；
// level：'low' 读数明显低于冷胎基准（漏气嫌疑）；'normal' 正常偏热；'hot' 升温偏大（重载/高速或异常）
// 阈值：低于冷胎 -0.05 判 low；高出预期 0.15 bar 以上判 hot；其间为 normal
function coldHotJudge(coldBar, riseBar, measuredBar) {
  const cold = Number(coldBar)
  const rise = Number(riseBar)
  const measured = Number(measuredBar)
  if (![cold, rise, measured].every(Number.isFinite)) return null
  if (cold <= 0 || rise < 0 || measured <= 0) return null
  const expected = cold + rise
  const diff = measured - expected
  let level
  if (measured < cold - 0.05) level = 'low'
  else if (diff > 0.15) level = 'hot'
  else level = 'normal'
  return { expected, diff, level }
}
// ==== PURE-FNS-END ====

// SEO
useSeoMeta({
  title: '胎压换算与冷热修正 - kPa/bar/psi 四向换算器',
  description: '在线胎压换算器：kPa、bar、psi、kgf/cm² 四向换算（1 bar=100 kPa≈14.5 psi），附常见胎压锚点表；冷热修正判定热胎读数是否正常（热胎读数=冷胎压+升温 0.1~0.3bar，勿因热胎偏高放气），附满载加压与备胎高压口径，纯本地计算。',
  keywords: '胎压换算,psi bar kPa,胎压单位换算,冷胎压热胎压,胎压多少正常,氮气胎压,备胎胎压',
  author: '有条工具',
  ogTitle: '胎压换算与冷热修正 - 有条工具',
  ogDescription: 'kPa/bar/psi/kgf 四向换算，冷热胎压判定与载重加压建议',
  ogUrl: 'https://www.util.cn/tools/tire-pressure-convert',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '胎压换算与冷热修正',
  twitterDescription: '四向单位换算 + 冷热胎压判定，勿因热胎读数高而放气'
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
          name: '胎压换算与冷热修正',
          url: 'https://www.util.cn/tools/tire-pressure-convert',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'kPa/bar/psi/kgf/cm² 四向换算',
            '常见胎压锚点表（2.3/2.5/2.8 bar 等）',
            '冷热胎压判定（热胎读数=冷胎压+升温）',
            '热胎勿放气红色警示卡',
            '满载 +0.2~0.3 bar 加压口径',
            '备胎高压存放注记'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '胎压换算与冷热修正', item: 'https://www.util.cn/tools/tire-pressure-convert' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'psi、bar、kPa 怎么换算？',
              acceptedAnswer: { '@type': 'Answer', text: '1 bar = 100 kPa ≈ 14.50 psi ≈ 1.02 kgf/cm²；心算记 bar×100=kPa、psi÷14.5≈bar，如 2.5 bar = 250 kPa ≈ 36.3 psi。' }
            },
            {
              '@type': 'Question',
              name: '什么是冷胎压？',
              acceptedAnswer: { '@type': 'Answer', text: '停车 3 小时以上或行驶不足 2 公里（胎温≈气温）时测得的胎压，是铭牌标准与报警线的基准口径。' }
            },
            {
              '@type': 'Question',
              name: '热胎读数偏高要放气吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不要。行驶后胎压升高 0.1~0.3 bar 是正常物理现象，放气后冷态会欠压；判断胎压永远以冷胎压为准。' }
            },
            {
              '@type': 'Question',
              name: '轮胎充氮气有没有用？',
              acceptedAnswer: { '@type': 'Answer', text: '氮气渗透稍慢、温压波动更小，但普通空气 78% 本就是氮气，日常收益有限；比气体种类更重要的是每月检查冷胎压。' }
            },
            {
              '@type': 'Question',
              name: '备胎胎压为什么那么高？',
              acceptedAnswer: { '@type': 'Answer', text: '备胎按 3.5~4.2 bar 高压存放（以备胎标牌为准），补偿长期存放的自然亏压，换上后可直接应急行驶到修理店。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'tire-pressure-convert'
const SETTINGS_KEY = 'tire-pressure-convert-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 状态 ----------
const srcUnit = ref('bar')
const srcRaw = ref('2.5')
const coldBar = ref(2.5)
const riseBar = ref(0.25)
const measuredBar = ref(2.8)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const UNITS = [
  { key: 'bar', label: 'bar（巴）', unit: 'bar', placeholder: '如 2.5', digits: 2 },
  { key: 'kpa', label: 'kPa（千帕）', unit: 'kPa', placeholder: '如 250', digits: 0 },
  { key: 'psi', label: 'psi（磅/平方英寸）', unit: 'psi', placeholder: '如 36.26', digits: 2 },
  { key: 'kgf', label: 'kgf/cm²（公斤力）', unit: 'kgf/cm²', placeholder: '如 2.55', digits: 3 }
]

const ANCHOR_BARS = [
  { bar: 2.0, note: '轻型车偏舒适设定' },
  { bar: 2.3, note: '家用轿车常见冷胎压' },
  { bar: 2.5, note: '铭牌标准值最常见' },
  { bar: 2.8, note: '满载 / 部分 SUV 前轮' },
  { bar: 3.0, note: '满载上限 / 备胎下限' }
]

// ---------- 四向换算 ----------
const hasValidSource = computed(() => toKpa(srcRaw.value, srcUnit.value) !== null)

function onFieldInput(unit, ev) {
  srcUnit.value = unit
  srcRaw.value = ev.target.value
}

function displayVal(unit) {
  const meta = UNITS.find(u => u.key === unit)
  const kpa = toKpa(srcRaw.value, srcUnit.value)
  if (kpa === null) return ''
  if (unit === srcUnit.value) return srcRaw.value
  const r = convertFromKpa(kpa)
  if (!r || r[unit] === undefined) return ''
  return String(round(r[unit], meta.digits))
}

// 锚点表行（bar 固定，其余单位换算后四舍五入）
const anchorRows = computed(() => ANCHOR_BARS.map(a => {
  const r = convertFromKpa(a.bar * KPA_PER_BAR)
  return {
    bar: a.bar,
    note: a.note,
    kpa: String(round(r.kpa, 0)),
    psi: String(round(r.psi, 2)),
    kgf: String(round(r.kgf, 3))
  }
}))

function pickAnchor(bar) {
  srcUnit.value = 'bar'
  srcRaw.value = String(bar)
}

// ---------- 冷热判定 ----------
const judge = computed(() => coldHotJudge(coldBar.value, riseBar.value, measuredBar.value))
const judgeValid = computed(() => judge.value !== null)

const JUDGE_STYLES = {
  normal: { cls: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400', title: '正常偏热' },
  low: { cls: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400', title: '偏低 / 漏气嫌疑' },
  hot: { cls: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400', title: '升温偏大' }
}
const judgeCardCls = computed(() => (judgeValid.value ? JUDGE_STYLES[judge.value.level].cls : ''))
const judgeTitle = computed(() => (judgeValid.value ? JUDGE_STYLES[judge.value.level].title : ''))
const judgeMsg = computed(() => {
  if (!judgeValid.value) return ''
  if (judge.value.level === 'normal') {
    return '当前读数落在「冷胎压 + 升温」的预期范围内，属于热胎物理升温的正常表现。请勿放气，冷态复核维持铭牌冷胎压即可。'
  }
  if (judge.value.level === 'low') {
    return '当前读数已接近甚至低于冷胎基准，升温后仍这么低大概率存在慢漏气或严重欠压，请尽快冷胎补气并检查胎面扎钉。'
  }
  return '升温超过典型范围（重载、高速、烈日曝晒或双胎并装常见）。先确认读数来自同一支胎压计，冷态复核；仍不建议直接放气，以冷胎压为准调整。'
})

// ---------- 格式化 ----------
function fmt(v) {
  return Number.isFinite(v) ? String(v) : '—'
}

// ---------- 设置持久化（localStorage，键前缀用工具 id，仅 onMounted/交互回调触达） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (UNITS.some(u => u.key === s.srcUnit)) srcUnit.value = s.srcUnit
    if (typeof s.srcRaw === 'string' && toKpa(s.srcRaw, s.srcUnit || 'bar') !== null) srcRaw.value = s.srcRaw
    if (Number.isFinite(s.coldBar) && s.coldBar > 0) coldBar.value = s.coldBar
    if (Number.isFinite(s.riseBar) && s.riseBar >= 0) riseBar.value = s.riseBar
    if (Number.isFinite(s.measuredBar) && s.measuredBar > 0) measuredBar.value = s.measuredBar
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([srcUnit, srcRaw, coldBar, riseBar, measuredBar], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      srcUnit: srcUnit.value,
      srcRaw: srcRaw.value,
      coldBar: coldBar.value,
      riseBar: riseBar.value,
      measuredBar: measuredBar.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
