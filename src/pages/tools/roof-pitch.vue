<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部区 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Triangle class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">屋面坡度换算</h1>
          <p class="text-sm text-muted-foreground mt-1">角度、百分比、x:12 比例三制式互转，附斜坡长度与瓦材工艺提示</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线屋面坡度换算工具：任一制式输入，其余两制式实时联动——角度 θ ↔ 百分比（tan θ×100）↔ 比例 x:12（tan θ×12）。
        支持按水平投影长度 L 计算斜面长度（L/cos θ）、总升高与每米升高；内置沥青瓦、金属瓦楞板、混凝土平屋面的最低坡度工艺提示带，
        以及 2:12、4:12、6:12、12:12 等常见档位对照表。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        百分比口径 = 每 100 份水平长度的高差（tan θ×100）；x:12 口径源自北美“每 12 英寸水平跑多少英寸高”的习惯，
        与国内百分比口径可精确互转。最低坡度提示为通行行业经验（沥青瓦 2:12、金属瓦楞约 1:12、平屋面找坡 2%~3%），
        各地规范与厂家口径不一，施工前请以当地规范和产品说明书为准。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 三制式互转 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 三制式互转（任填其一，其余联动）
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label for="rp-angle" class="block text-sm font-medium text-foreground mb-1.5">角度 θ（°）</label>
              <input
                id="rp-angle"
                v-model.number="angleInput"
                type="number"
                min="0"
                max="89.9"
                step="0.1"
                @input="syncFromAngle"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 30"
              >
            </div>
            <div>
              <label for="rp-percent" class="block text-sm font-medium text-foreground mb-1.5">坡度百分比（%）</label>
              <div class="relative">
                <input
                  id="rp-percent"
                  v-model.number="percentInput"
                  type="number"
                  min="0"
                  step="0.1"
                  @input="syncFromPercent"
                  class="w-full pr-8 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 57.74"
                >
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
            <div>
              <label for="rp-ratio" class="block text-sm font-medium text-foreground mb-1.5">比例 x : 12</label>
              <div class="flex items-center gap-2">
                <input
                  id="rp-ratio"
                  v-model.number="ratioInput"
                  type="number"
                  min="0"
                  step="0.5"
                  @input="syncFromRatio"
                  class="flex-1 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 6.93"
                >
                <span class="text-muted-foreground text-sm whitespace-nowrap">: 12</span>
              </div>
            </div>
          </div>

          <!-- 换算结果带 -->
          <div v-if="currentConv" class="p-4 rounded-lg bg-muted/50 border border-border">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div>
                <p class="text-xs text-muted-foreground mb-1">角度 θ</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(currentConv.angle, 3) }}<span class="text-sm font-medium">°</span></p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">坡度百分比</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(currentConv.percent, 2) }}<span class="text-sm font-medium">%</span></p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">比例</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(currentConv.ratio12, 2) }}<span class="text-sm font-medium"> : 12</span></p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-3 text-center">
              tan θ = {{ fmt(currentConv.tan, 4) }}；每 1 m 水平升高 {{ fmt(currentConv.tan, 3) }} m，即每 12 份水平跑 {{ fmt(currentConv.ratio12, 2) }} 份高。
            </p>
          </div>
          <div v-else class="p-4 rounded-lg bg-muted/50 border border-border text-center text-sm text-muted-foreground">
            输入任一制式的坡度值（角度 0~89.9°，百分比与比例 ≥ 0）开始换算
          </div>

          <!-- 工艺提示带 -->
          <div v-if="adviceRows.length" class="space-y-2">
            <p class="text-sm font-medium text-foreground">瓦材适用提示（按当前坡度）</p>
            <div
              v-for="row in adviceRows"
              :key="row.name"
              class="flex items-start gap-2 p-3 rounded-lg border"
              :class="adviceCls(row.level)"
            >
              <component :is="adviceIcon(row.level)" class="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium text-foreground">{{ row.name }}<span class="font-normal text-muted-foreground">（最低 {{ row.min }}）</span></p>
                <p class="text-xs text-muted-foreground mt-0.5">{{ row.text }}</p>
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground">
              最低坡度为行业通行经验口径：沥青瓦 2:12（约 9.5°）、金属瓦楞板约 1:12、混凝土平屋面找坡 2%~3%；以当地规范与厂家口径为准。
            </p>
          </div>
        </div>

        <!-- 斜坡长度计算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 斜坡长度（按水平投影）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label for="rp-run" class="block text-sm font-medium text-foreground mb-1.5">水平投影长度 L（米）</label>
              <input
                id="rp-run"
                v-model.number="runLength"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 6"
              >
              <p class="text-xs text-muted-foreground mt-1">建筑平面图上的水平尺寸</p>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-foreground mb-1.5">按当前坡度换算</label>
              <div v-if="slopeResult" class="grid grid-cols-3 gap-3">
                <div class="p-3 rounded-lg bg-muted/50 border border-border text-center">
                  <p class="text-xs text-muted-foreground mb-1">斜面长度</p>
                  <p class="text-lg font-bold text-foreground">{{ fmt(slopeResult.slopeLen, 3) }} <span class="text-xs font-medium">m</span></p>
                </div>
                <div class="p-3 rounded-lg bg-muted/50 border border-border text-center">
                  <p class="text-xs text-muted-foreground mb-1">总升高</p>
                  <p class="text-lg font-bold text-foreground">{{ fmt(slopeResult.rise, 3) }} <span class="text-xs font-medium">m</span></p>
                </div>
                <div class="p-3 rounded-lg bg-muted/50 border border-border text-center">
                  <p class="text-xs text-muted-foreground mb-1">每米水平升高</p>
                  <p class="text-lg font-bold text-foreground">{{ fmt(slopeResult.risePerMeter, 3) }} <span class="text-xs font-medium">m/m</span></p>
                </div>
              </div>
              <div v-else class="p-3 rounded-lg bg-muted/50 border border-border text-center text-sm text-muted-foreground">
                先在上方输入有效坡度，再填写水平投影长度
              </div>
              <p v-if="slopeResult" class="text-xs text-muted-foreground mt-2">
                斜面长 = L ÷ cos θ = {{ fmt(runLength, 2) }} ÷ cos {{ fmt(currentConv ? currentConv.angle : 0, 2) }}°；总升高 = L × tan θ。实际下料另计挑檐与搭接，请按现场放样复核。
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 常见档位表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Table class="w-5 h-5 mr-2 text-primary" /> 常见坡度档位表
          </h2>
          <table class="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr class="bg-muted/60 text-xs text-muted-foreground">
                <th class="px-3 py-2 text-left font-medium">比例 x:12</th>
                <th class="px-3 py-2 text-right font-medium">角度</th>
                <th class="px-3 py-2 text-right font-medium">百分比</th>
                <th class="px-3 py-2 text-right font-medium">每 12 水平升高</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in pitchTable"
                :key="row.ratio"
                class="border-t border-border"
                :class="{ 'bg-primary/10': isActiveRow(row.ratio) }"
              >
                <td class="px-3 py-2 font-medium text-foreground">{{ row.ratio }} : 12</td>
                <td class="px-3 py-2 text-right font-mono text-muted-foreground">{{ fmt(row.angle, 2) }}°</td>
                <td class="px-3 py-2 text-right font-mono text-muted-foreground">{{ fmt(row.percent, 2) }}%</td>
                <td class="px-3 py-2 text-right font-mono text-muted-foreground">{{ fmt(row.ratio, 0) }}</td>
              </tr>
            </tbody>
          </table>
          <p class="text-xs text-muted-foreground">
            沥青瓦常用 4:12 以上起步；2:12 为多数厂家允许的最低档；12:12 即 45°。当前输入落在某档 ±0.05 内会高亮。
          </p>
        </div>

        <!-- 使用提示 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 读图与备料提示
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">图纸标注识别：</span>国内图纸常标百分比或角度，进口资料与瓦材说明书常用 x:12，三者可精确互转，不必估读。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">积雪地区：</span>坡度宜取大（常见 4:12 以上），利于卸雪；低坡度 + 积雪组合对防水层与搭接密封要求显著提高，按当地雪荷规范复核。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">下料长度：</span>斜面长按 L/cos θ 估算后，屋面板、挂瓦条与防水卷材还要加挑檐、搭接与损耗，采购按展开面积另计。</span>
            </li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>角度、百分比、x:12 三种坡度说法怎么来的？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          三种说法描述的是同一个几何量——屋面的倾斜程度，区别只在表达习惯：
          <span class="text-foreground font-medium">角度 θ</span> 是屋面与水平面的夹角，工程图与结构计算常用；
          <span class="text-foreground font-medium">百分比</span> 是“每 100 份水平长度升高多少”，即 tan θ × 100，国内图纸与排水找坡常用（如 2% 找坡）；
          <span class="text-foreground font-medium">x:12 比例</span> 源自北美行业习惯，“每 12 英寸水平跑（run）对应 x 英寸升高（rise）”，即 tan θ × 12，
          瓦材、窗屋产品说明书普遍沿用。因为三者都由 tan θ 派生，换算是精确的：4:12 = tan θ 0.3333 = 33.33% = 18.435°，不存在近似折算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">坡度与瓦材怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          瓦材对最低坡度有硬性口径：<span class="text-foreground font-medium">沥青瓦</span>最低 2:12（约 9.5°），低于此坡度水会在瓦缝间倒灌，
          必须改用防水卷材或满涂胶等平屋面做法；2:12~4:12 区间多数厂家要求双层瓦、满涂胶或加铺垫层，属“低坡加固”区；
          <span class="text-foreground font-medium">金属瓦楞板</span>最低在 1:12 量级，低坡时搭接与密封要按厂家低坡口径加强；
          <span class="text-foreground font-medium">混凝土平屋面</span>不做斜坡，但必须 2%~3% 找坡排水。
          各地规范与厂家口径不一，选材前先查产品说明书标注的适用坡度范围。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么平屋顶也要有坡？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          所谓“平”屋面只是视觉上平，排水层必须有 2%~3% 的找坡：完全无坡时雨水会形成积水（水窝），
          长期浸泡导致防水层老化起鼓、渗漏点集中在积水处。找坡可用结构找坡（梁板按坡浇筑）或材料找坡（保温/找坡层垫出坡度），
          天沟、落水口周边还会局部加大坡度。这也是本工具把“混凝土平屋面 2%~3%”纳入提示带的原因——坡度换算同样服务于排水设计。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">积雪地区的坡度口径有什么不同？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          积雪地区选坡要兼顾“卸雪”与“雪荷”：坡度大（常见 4:12 以上）积雪易滑落，减少屋面长期负载与冰坝风险；
          坡度小则积雪压实成冰层，融化水在瓦缝与檐口反复冻融，渗漏概率大增。但同时坡度越大，迎风雪漂移与檐口跌雪伤人也要考虑，
          檐口需设挡雪篦。结构上雪荷载取值、不均匀雪分布系数都要按当地规范复核——本工具给出的只是几何换算与经验提示，
          载荷与构造请以当地建筑规范为准。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>屋面坡度换算公式</h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>百分比</strong>: 坡度百分比 = tan θ × 100（每 100 份水平的高差）</li>
          <li><strong>x:12 比例</strong>: x = tan θ × 12（每 12 份水平的升高份数）</li>
          <li><strong>反推角度</strong>: θ = arctan(百分比 ÷ 100) = arctan(x ÷ 12)</li>
          <li><strong>斜面长度</strong>: 斜面长 = 水平投影 L ÷ cos θ</li>
          <li><strong>升高</strong>: 总升高 = L × tan θ；每米水平升高 = tan θ（m/m）</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">4:12 的坡度等于多少度和多少百分比？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              tan θ = 4 ÷ 12 = 0.3333，对应角度 θ = arctan(0.3333) ≈ 18.435°，坡度百分比 = 33.33%。
              即每 1 米水平跑升高约 0.333 米，6 米水平投影的斜面长约 6.325 米。可在上方任一输入框验证联动。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">坡度百分比 2% 是多少度？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              θ = arctan(0.02) ≈ 1.146°，对应约 0.24:12 的比例。2%~3%（约 1.1°~1.7°）是混凝土平屋面找坡的常用口径，
              目的是排水而非行走坡度——远低于任何瓦材的最低铺装坡度。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">30° 屋面是多少比例？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              tan 30° ≈ 0.5774，即百分比 57.74%、比例约 6.93:12。这一坡度对沥青瓦、金属瓦楞板都属于充足坡度，
              积雪地区也是常见选择。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">斜面长度怎么算？为什么要用余弦？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              水平投影 L 是平面图尺寸，屋面板实际沿斜面铺设，斜面长 = L ÷ cos θ。例如 6 米投影、30° 坡：
              6 ÷ cos 30° ≈ 6.928 米。cos θ ≤ 1，所以斜面总是比投影长，坡度越陡差得越多；采购屋面板与防水卷材时按斜面尺寸另加搭接与损耗。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :current-tool-id="'roof-pitch'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Triangle, Calculator, Ruler, Table, Lightbulb, Info,
  CheckCircle, AlertTriangle, XCircle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 坡度换算纯函数：三种制式均由 tan θ 派生，可精确互转
const RATIO_RUN = 12 // x:12 口径的水平跑常数

// 数值四舍五入（+Number.EPSILON 修正二进制表示误差，避免 1.005 类尾差）
function roundTo(v, d = 2) {
  if (!Number.isFinite(v)) return null
  const shift = Math.pow(10, d)
  return Math.round((v + Number.EPSILON) * shift) / shift
}

// 角度(°) -> tan；屋面口径限定 0 <= deg < 90
function tanFromAngle(deg) {
  if (!Number.isFinite(deg) || deg < 0 || deg >= 90) return null
  return Math.tan((deg * Math.PI) / 180)
}

// tan -> 角度(°)
function angleFromTan(t) {
  if (!Number.isFinite(t) || t < 0) return null
  return (Math.atan(t) * 180) / Math.PI
}

// 由角度求另两制式：百分比 = tan×100，x:12 = tan×12
function convFromAngle(deg) {
  const t = tanFromAngle(deg)
  if (t === null) return null
  return { angle: deg, percent: t * 100, ratio12: t * RATIO_RUN, tan: t }
}

// 由百分比求另两制式
function convFromPercent(p) {
  if (!Number.isFinite(p) || p < 0) return null
  const t = p / 100
  return { angle: angleFromTan(t), percent: p, ratio12: t * RATIO_RUN, tan: t }
}

// 由 x:12 比例求另两制式
function convFromRatio(x) {
  if (!Number.isFinite(x) || x < 0) return null
  const t = x / RATIO_RUN
  return { angle: angleFromTan(t), percent: t * 100, ratio12: x, tan: t }
}

// 斜坡长度：水平投影 L -> 斜面长 L/cos θ、总升高 L×tan θ、每米水平升高 tan θ
function slopeFromRun(len, deg) {
  if (!Number.isFinite(len) || len <= 0) return null
  const t = tanFromAngle(deg)
  if (t === null) return null
  const cos = Math.cos((deg * Math.PI) / 180)
  return { slopeLen: len / cos, rise: len * t, risePerMeter: t }
}

// 瓦材工艺提示：按 x:12 与百分比给各材适用级别（ok/warn/bad）
function pitchAdvice(ratio12, percent) {
  if (!Number.isFinite(ratio12) || ratio12 < 0 || !Number.isFinite(percent) || percent < 0) return []
  const rows = []
  if (ratio12 >= 4) {
    rows.push({ name: '沥青瓦', min: '2:12', level: 'ok', text: '坡度充足，可按厂家常规铺法施工。' })
  } else if (ratio12 >= 2) {
    rows.push({ name: '沥青瓦', min: '2:12', level: 'warn', text: '处于 2:12~4:12 低坡区，多数厂家要求双层瓦、满涂胶或加铺垫层，需核对厂家口径。' })
  } else {
    rows.push({ name: '沥青瓦', min: '2:12', level: 'bad', text: '低于沥青瓦最低坡度 2:12（约 9.5°），不应铺瓦，需改用防水卷材或满涂胶等平屋面做法。' })
  }
  if (ratio12 >= 2) {
    rows.push({ name: '金属瓦楞板', min: '约1:12', level: 'ok', text: '坡度充足，搭接与密封按常规口径即可。' })
  } else if (ratio12 >= 1) {
    rows.push({ name: '金属瓦楞板', min: '约1:12', level: 'warn', text: '处于 1:12 量级下限附近，搭接长度与密封要按低坡度口径加强。' })
  } else {
    rows.push({ name: '金属瓦楞板', min: '约1:12', level: 'bad', text: '低于金属瓦楞板常用下限（1:12 量级），搭接处易渗漏，不建议使用。' })
  }
  if (percent >= 2 && percent <= 3) {
    rows.push({ name: '混凝土平屋面', min: '2%~3%', level: 'ok', text: '处于 2%~3% 找坡口径区间，排水顺畅。' })
  } else if (percent < 2) {
    rows.push({ name: '混凝土平屋面', min: '2%~3%', level: 'bad', text: '低于 2% 找坡口径，易形成积水窝，防水层长期浸泡易渗漏。' })
  } else {
    rows.push({ name: '混凝土平屋面', min: '2%~3%', level: 'ok', text: '大于 3%，相当于结构找坡/斜屋面口径，排水充分。' })
  }
  return rows
}
// ==== PURE-FNS-END ====

const TOOL_ID = 'roof-pitch'
const SETTINGS_KEY = 'roof-pitch-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- SEO ----------
useSeoMeta({
  title: '屋面坡度换算 - 角度/百分比/比例x:12 三制式互转工具 | Util工具箱',
  description: '在线屋面坡度换算工具：角度、百分比、x:12 比例任一输入实时联动互转，按水平投影计算斜面长度与升高，内置沥青瓦 2:12、金属瓦楞 1:12、平屋面 2%~3% 找坡等最低坡度工艺提示与常见档位对照表，纯本地计算。',
  keywords: '屋面坡度换算,坡度百分比,坡度角度对照表,4:12坡度,屋顶坡度计算,roof pitch,找坡2%,斜坡长度计算',
  author: 'Util工具箱',
  ogTitle: '屋面坡度换算 - 角度/百分比/比例x:12 三制式互转 | Util工具箱',
  ogDescription: '任一制式输入实时联动互转，附斜坡长度计算与瓦材最低坡度工艺提示。',
  ogUrl: 'https://www.util.cn/tools/roof-pitch',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '屋面坡度换算 - 三制式互转工具',
  twitterDescription: '角度、百分比、x:12 比例实时联动互转，附斜坡长度与瓦材工艺提示。'
})

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
const faqs = [
  {
    q: '4:12 的坡度等于多少度和多少百分比？',
    a: 'tan θ = 4 ÷ 12 = 0.3333，角度 θ = arctan(0.3333) ≈ 18.435°，坡度百分比 = 33.33%，即每 1 米水平跑升高约 0.333 米。'
  },
  {
    q: '坡度百分比 2% 是多少度？',
    a: 'θ = arctan(0.02) ≈ 1.146°，约 0.24:12。2%~3% 是混凝土平屋面找坡的常用口径，用于排水，远低于瓦材最低铺装坡度。'
  },
  {
    q: '30° 屋面是多少比例？',
    a: 'tan 30° ≈ 0.5774，即坡度百分比 57.74%、比例约 6.93:12，对沥青瓦与金属瓦楞板都是充足坡度。'
  },
  {
    q: '斜面长度怎么算？为什么要用余弦？',
    a: '斜面长 = 水平投影 L ÷ cos θ。如 6 米投影、30° 坡：6 ÷ cos 30° ≈ 6.928 米。cos θ ≤ 1，坡度越陡斜面比投影长得越多，下料时另加挑檐、搭接与损耗。'
  }
]

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '屋面坡度换算',
          url: 'https://www.util.cn/tools/roof-pitch',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '角度/百分比/x:12 三制式实时联动互转',
            '水平投影长度转斜面长度与升高',
            '每米水平升高与 tan 值显示',
            '沥青瓦/金属瓦楞/平屋面最低坡度工艺提示带',
            '2~12:12 常见档位对照表',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '屋面坡度换算', item: 'https://www.util.cn/tools/roof-pitch' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a }
          }))
        }
      ]
    })
  }]
})

// ---------- 状态（输入框保存显示值，联动在 @input 回调里做） ----------
const angleInput = ref('18.435')
const percentInput = ref('33.33')
const ratioInput = ref('4')
const runLength = ref(6)
const lastEdited = ref('ratio') // 'angle' | 'percent' | 'ratio'

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化 ----------
const fmt = (v, d = 2) => {
  const r = roundTo(Number(v), d)
  return r === null ? '—' : String(r)
}

// ---------- 联动：编程改值不会触发 @input，因此不会成环 ----------
function syncFromAngle() {
  lastEdited.value = 'angle'
  const c = convFromAngle(Number(angleInput.value))
  percentInput.value = c ? fmt(c.percent, 2) : ''
  ratioInput.value = c ? fmt(c.ratio12, 2) : ''
}
function syncFromPercent() {
  lastEdited.value = 'percent'
  const c = convFromPercent(Number(percentInput.value))
  angleInput.value = c ? fmt(c.angle, 3) : ''
  ratioInput.value = c ? fmt(c.ratio12, 2) : ''
}
function syncFromRatio() {
  lastEdited.value = 'ratio'
  const c = convFromRatio(Number(ratioInput.value))
  angleInput.value = c ? fmt(c.angle, 3) : ''
  percentInput.value = c ? fmt(c.percent, 2) : ''
}

// 当前换算结果（从最近编辑的制式出发，保证与输入框所见一致）
const currentConv = computed(() => {
  if (lastEdited.value === 'angle') return convFromAngle(Number(angleInput.value))
  if (lastEdited.value === 'percent') return convFromPercent(Number(percentInput.value))
  return convFromRatio(Number(ratioInput.value))
})

// 斜坡长度结果
const slopeResult = computed(() => {
  if (!currentConv.value) return null
  return slopeFromRun(Number(runLength.value), currentConv.value.angle)
})

// 工艺提示带
const adviceRows = computed(() => {
  if (!currentConv.value) return []
  return pitchAdvice(currentConv.value.ratio12, currentConv.value.percent)
})

const adviceCls = (level) => {
  if (level === 'ok') return 'bg-green-500/10 border-green-500/20'
  if (level === 'warn') return 'bg-amber-500/10 border-amber-500/20'
  return 'bg-red-500/10 border-red-500/20'
}
const adviceIcon = (level) => {
  if (level === 'ok') return CheckCircle
  if (level === 'warn') return AlertTriangle
  return XCircle
}

// ---------- 常见档位表 ----------
const pitchTable = computed(() => {
  return [2, 3, 4, 5, 6, 8, 12].map((x) => {
    const c = convFromRatio(x)
    return { ratio: x, angle: c.angle, percent: c.percent }
  })
})

// 当前输入是否落在某档（容差 0.05，用于高亮）
const isActiveRow = (x) => {
  const c = currentConv.value
  if (!c) return false
  return Math.abs(c.ratio12 - x) < 0.05
}

// ---------- 设置持久化（localStorage，键前缀用工具 id；仅 onMounted 与交互回调触达） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (['angle', 'percent', 'ratio'].includes(s.lastEdited)) lastEdited.value = s.lastEdited
    if (s.angleInput !== undefined && s.angleInput !== '') angleInput.value = s.angleInput
    if (s.percentInput !== undefined && s.percentInput !== '') percentInput.value = s.percentInput
    if (s.ratioInput !== undefined && s.ratioInput !== '') ratioInput.value = s.ratioInput
    if (Number.isFinite(s.runLength) && s.runLength > 0) runLength.value = s.runLength
    // 恢复后按最近编辑制式重算联动字段
    if (lastEdited.value === 'angle') syncFromAngle()
    else if (lastEdited.value === 'percent') syncFromPercent()
    else syncFromRatio()
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([angleInput, percentInput, ratioInput, runLength, lastEdited], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      angleInput: angleInput.value,
      percentInput: percentInput.value,
      ratioInput: ratioInput.value,
      runLength: runLength.value,
      lastEdited: lastEdited.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
