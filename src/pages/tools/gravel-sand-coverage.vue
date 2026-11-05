<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部区 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Mountain class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">碎石沙土用量计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">面积×厚度→体积、吨数与袋数换算，附压实损耗与车载数参考</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线碎石/沙土用量计算工具：输入铺设面积（长×宽或直接面积）与铺设厚度，按材料堆积密度（碎石 1.5、沙子 1.6、砾石 1.7、覆土 1.3 t/m³，可改）
        换算体积 m³、吨数与袋数（25kg/50kg 两口径），并给出 +5% 压实损耗采购建议与手推车/三轮车/轻卡车载数参考。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        预设密度为常用<span class="text-foreground font-medium">堆积密度</span>口径（含颗粒间空隙，非材料真密度），砂石产地与粒径不同会有 ±10% 左右浮动，
        大宗采购建议按供应商实测堆积密度修改后计算。袋装口径按每袋净重 25kg/50kg 计，吨数按四舍五入保留 0.1 t 显示。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 铺设参数
        </h2>

        <!-- 面积输入 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">面积输入方式</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="inputMode = 'size'"
              :class="inputMode === 'size' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >按长 × 宽</button>
            <button
              @click="inputMode = 'area'"
              :class="inputMode === 'area' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >直接输入面积</button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <template v-if="inputMode === 'size'">
            <div>
              <label for="gsc-len" class="block text-sm font-medium text-foreground mb-1.5">长度（米）</label>
              <input
                id="gsc-len"
                v-model.number="lengthM"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 5"
              >
            </div>
            <div>
              <label for="gsc-wid" class="block text-sm font-medium text-foreground mb-1.5">宽度（米）</label>
              <input
                id="gsc-wid"
                v-model.number="widthM"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 4"
              >
            </div>
          </template>
          <div v-else>
            <label for="gsc-area" class="block text-sm font-medium text-foreground mb-1.5">面积（平方米）</label>
            <input
              id="gsc-area"
              v-model.number="areaM2"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 20"
            >
          </div>
          <div>
            <label for="gsc-thick" class="block text-sm font-medium text-foreground mb-1.5">铺设厚度（厘米）</label>
            <input
              id="gsc-thick"
              v-model.number="thicknessCm"
              type="number"
              min="0"
              step="0.5"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 5"
            >
            <p class="text-xs text-muted-foreground mt-1">松铺厚度，压实后会更薄</p>
          </div>
        </div>

        <!-- 材料预设 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">材料（预设堆积密度，可改）</label>
          <div class="flex flex-wrap gap-2 mb-3">
            <button
              v-for="m in materialPresets"
              :key="m.id"
              @click="selectMaterial(m)"
              :class="isMaterialActive(m) ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              {{ m.name }} {{ m.density }} t/m³
            </button>
          </div>
          <div class="max-w-xs">
            <label for="gsc-density" class="block text-sm font-medium text-foreground mb-1.5">堆积密度（t/m³）</label>
            <input
              id="gsc-density"
              v-model.number="density"
              type="number"
              min="0"
              step="0.05"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 1.5"
            >
          </div>
        </div>

        <!-- 计算结果 -->
        <div v-if="isValid && result" class="space-y-4 pt-2">
          <!-- 核心结果：含损耗建议采购 -->
          <div class="p-6 bg-muted/50 rounded-lg text-center border border-border">
            <p class="text-sm text-muted-foreground mb-1">建议采购（含 {{ LOSS_PCT }}% 压实损耗）</p>
            <p class="text-4xl font-bold text-green-600 dark:text-green-400">
              {{ fmt(result.lossVolume, 2) }} <span class="text-lg font-medium">m³</span>
            </p>
            <p class="text-sm text-muted-foreground mt-2">
              约 <span class="font-semibold text-foreground">{{ fmt(result.lossTons, 1) }} 吨</span>
              · 25kg 袋装 <span class="font-semibold text-foreground">{{ result.lossBags25 }} 袋</span>
              · 50kg 袋装 <span class="font-semibold text-foreground">{{ result.lossBags50 }} 袋</span>
            </p>
          </div>

          <!-- 理论用量明细 -->
          <div class="space-y-3">
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">理论体积（{{ areaText }} m² × {{ fmt(thicknessCm, 1) }} cm）</span>
              <span class="font-semibold text-foreground font-mono">{{ fmt(result.volume, 3) }} m³</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">理论吨数（{{ fmt(density, 2) }} t/m³）</span>
              <span class="font-semibold text-foreground font-mono">{{ fmt(result.tons, 1) }} t（{{ fmt(result.kg, 0) }} kg）</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">理论袋数 25kg / 50kg</span>
              <span class="font-semibold text-foreground font-mono">{{ result.bags25 }} 袋 / {{ result.bags50 }} 袋</span>
            </div>
          </div>

          <!-- +5% 压实损耗建议行 -->
          <div class="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">+{{ LOSS_PCT }}% 压实损耗建议</p>
              <p class="text-xs text-muted-foreground mt-1">
                砂石摊铺压实后体积收缩、运输撒漏与摊铺不平整都会吃掉余量：{{ fmt(result.volume, 2) }} m³ × 1.0{{ LOSS_PCT }} =
                {{ fmt(result.lossVolume, 2) }} m³ ≈ {{ fmt(result.lossTons, 1) }} t，25kg 袋约 {{ result.lossBags25 }} 袋。
                车辆碾压或深层回填场景建议上调至 +10%。
              </p>
            </div>
          </div>

          <!-- 车载数参考 -->
          <div class="p-4 bg-muted/50 rounded-lg border border-border">
            <p class="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Truck class="w-4 h-4 text-primary" /> 车载数参考（{{ fmt(result.lossVolume, 2) }} m³）
            </p>
            <div class="grid grid-cols-3 gap-3 text-center">
              <div v-for="t in truckRows" :key="t.name">
                <p class="text-xs text-muted-foreground">{{ t.name }}（{{ t.cap }} m³/车）</p>
                <p class="text-lg font-bold text-foreground">{{ t.count }} <span class="text-xs font-medium">车</span></p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-3">
              口径注记：手推车按 0.06 m³/车、三轮车 0.5 m³/车、轻卡 2 m³/车估算，即 1 m³ 约手推车 {{ fmt(trucksPerM3Ref.hand, 1) }} 车、
              三轮车 {{ fmt(trucksPerM3Ref.trike, 1) }} 车、轻卡 {{ fmt(trucksPerM3Ref.light, 1) }} 车；按整车装载系数实际还会略少。
            </p>
          </div>
        </div>

        <div v-else class="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-foreground">暂无法计算</p>
            <p class="text-xs text-muted-foreground mt-1">请检查：面积 &gt; 0（长宽均 &gt; 0）、厚度 &gt; 0、堆积密度 &gt; 0。</p>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 密度口径 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Scale class="w-5 h-5 mr-2 text-primary" /> 堆积密度口径
          </h2>
          <table class="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr class="bg-muted/60 text-xs text-muted-foreground">
                <th class="px-3 py-2 text-left font-medium">材料</th>
                <th class="px-3 py-2 text-right font-medium">堆积密度</th>
                <th class="px-3 py-2 text-right font-medium">1 m³ 约</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in materialPresets" :key="m.id" class="border-t border-border">
                <td class="px-3 py-2 font-medium text-foreground">{{ m.name }}</td>
                <td class="px-3 py-2 text-right font-mono text-muted-foreground">{{ m.density }} t/m³</td>
                <td class="px-3 py-2 text-right font-mono text-muted-foreground">{{ fmt(m.density * 1000 / 25, 0) }} 袋@25kg</td>
              </tr>
            </tbody>
          </table>
          <p class="text-xs leading-relaxed text-muted-foreground">
            堆积密度 = 质量 ÷ <span class="text-foreground font-medium">含空隙的堆积体积</span>，比材料真密度小（碎石真密度约 2.6~2.7 t/m³，
            堆起来只有 1.5 左右）。采购、装袋按堆积口径算才不会翻倍出错；湿沙含水会让同一方砂更重，雨季按上限取值。
          </p>
        </div>

        <!-- 采购提示 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 采购与施工提示
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">买方还是买吨：</span>零售袋装按袋、大宗按吨计价为主；吨 = 方 × 堆积密度，
              折算口径不同报价可能差一成，比价时先统一到吨。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">压实系数：</span>回填/垫层压实后体积收缩，松铺系数常见 1.1~1.25，
              要求压实的部位按设计压实度复核，不要按松方直接验收标高。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">粒径对用途：</span>5~10mm 找平垫层、10~20mm 面层/滤水、
              20~40mm 稳定层与路基；粒径越大孔隙越大，同重量下堆积体积越大。</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>堆积密度为什么不是材料密度？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          材料密度（真密度/颗粒密度）衡量的是颗粒实体，例如石灰岩碎石真密度约 2.6~2.7 t/m³；
          而<span class="text-foreground font-medium">堆积密度</span>是颗粒自然堆放时（含颗粒间空隙）单位体积的质量，碎石只有约 1.5 t/m³，
          沙子约 1.6、砾石约 1.7、覆土约 1.3。砂石堆里少则四成、多则一半是空气，采购与装车按堆积体积计量，
          所以<span class="text-foreground font-medium">必须用堆积密度换算吨数</span>——误用真密度会把用量算出近一倍的差距。
          堆积密度随粒径级配、含水率、堆放松紧浮动，本工具预设值可手动修改以贴合实际料源。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么是压实系数？为什么要多买 5%？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          松散砂石经摊铺、碾压后颗粒重新排列、孔隙减小，体积收缩，压实后体积与松铺体积之比即压实系数（松铺系数，
          常见 1.1~1.25）。按图纸尺寸算出的压实方量，乘以松铺系数才是要进场的松方量。本工具按 +5% 压实损耗给出建议行，
          适用于一般垫层与面层找平；车辆碾压的通道、深层回填或需要达到设计压实度的部位，
          建议上调到 +10% 或按设计松铺系数复核，宁多勿少——补料二次进场的运费往往超过余料钱。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">买方（立方米）还是买吨？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两种计价口径都常见：袋装零售按袋（25kg/50kg），砂石场与大宗运输按吨计价居多，也有按方（堆积体积）计价的。
          换算关系是 <span class="text-foreground font-medium">吨 = 方 × 堆积密度</span>：20 m² × 5 cm = 1 m³ 碎石 ≈ 1.5 t。
          比价时务必先统一口径——同样一车料，按湿砂（偏重）吨计价和按松方计价折出来的单价可能差一成以上；
          需要精确验收时可在料场实测堆积密度（一桶装满称重）后回填到本工具密度框。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">不同粒径的碎石都用在哪儿？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          <span class="text-foreground font-medium">5~10mm（瓜子片）</span>：找平层、垫层、抹面骨料，铺得薄、好压实；
          <span class="text-foreground font-medium">10~20mm</span>：庭院面层、排水滤水层、混凝土粗骨料，用途最广；
          <span class="text-foreground font-medium">20~40mm</span>：路基稳定层、回填盲沟、大孔隙排水带，承载力好但表面硌脚。
          粒径越大堆积孔隙越大，同吨位下摊铺面积更大——用本工具换吨数时记得选对应材料并按实际密度微调。
          覆土（约 1.3 t/m³）用于种植回填与抬高床，压实要求低，损耗余量可比砂石略小。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>碎石沙土用量计算公式</h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>面积</strong>: 面积 = 长 × 宽（米），或直接输入平方米</li>
          <li><strong>体积</strong>: 体积 m³ = 面积 m² × 厚度 cm ÷ 100</li>
          <li><strong>吨数</strong>: 吨 = 体积 × 堆积密度（t/m³）</li>
          <li><strong>袋数</strong>: 袋数 = 吨 × 1000 ÷ 每袋公斤数（向上取整）</li>
          <li><strong>建议采购</strong>: 建议体积 = 理论体积 × 1.05（+5% 压实损耗）</li>
          <li><strong>车数</strong>: 车数 = 建议体积 ÷ 单车容积（向上取整）</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">20 平方米铺 5 厘米碎石要多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              体积 = 20 × 5 ÷ 100 = 1 m³；碎石按 1.5 t/m³ 即 1.5 吨，25kg 袋装 60 袋、50kg 袋装 30 袋。
              加 5% 压实损耗后建议采购 1.05 m³ ≈ 1.6 t，25kg 袋约 63 袋。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">一方沙子等于多少吨？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              干中砂堆积密度约 1.6 t/m³，一方约 1.6 吨；含水后可达 1.7~1.8 t/m³，雨季按上限估价。
              反过来 1 吨干砂约 0.625 方。砾石约 1.7 t/m³、碎石约 1.5 t/m³、覆土约 1.3 t/m³，均可在密度框里修改。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">袋数为什么向上取整？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              袋装只能整袋买，算出 59.2 袋就必须买 60 袋，因此工具对袋数与车数一律向上取整。
              吨数则按四舍五入保留 0.1 t 显示，方便与报价单核对。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">覆土和种植土的用量一样算吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              体积算法相同（面积×厚度），覆土按 1.3 t/m³ 折吨；种植土掺配珍珠岩、腐叶后密度更低，
              且沉降明显，建议在理论量上多留 10%~15%，而不是本工具默认的 5%。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :current-tool-id="'gravel-sand-coverage'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Mountain, Calculator, Truck, Scale, Lightbulb, Info,
  CheckCircle, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 碎石沙土用量纯函数：体积 -> 吨 -> 袋数 -> 车数，全部基于堆积密度口径
const LOSS_PCT = 5 // 压实损耗建议（%）
const TRUCK_CAPS = { hand: 0.06, trike: 0.5, light: 2 } // 手推车/三轮车/轻卡单车容积 m³

// 材料预设（堆积密度 t/m³）
const materialPresets = [
  { id: 'gravel', name: '碎石', density: 1.5 },
  { id: 'sand', name: '沙子', density: 1.6 },
  { id: 'pebble', name: '砾石', density: 1.7 },
  { id: 'topsoil', name: '覆土', density: 1.3 }
]

// 数值四舍五入（+Number.EPSILON 修正二进制表示误差）
function roundTo(v, d = 2) {
  if (!Number.isFinite(v)) return null
  const shift = Math.pow(10, d)
  return Math.round((v + Number.EPSILON) * shift) / shift
}

// 向上取整并容忍浮点尾差：本应为整数却因二进制表示多出 1e-15 的值不额外进位
function ceilEps(x) {
  if (!Number.isFinite(x) || x < 0) return null
  return Math.ceil(x - 1e-9)
}

// 体积 = 面积(m²) × 厚度(cm) / 100
function volumeM3(areaM2, thicknessCm) {
  if (!Number.isFinite(areaM2) || areaM2 <= 0 || !Number.isFinite(thicknessCm) || thicknessCm <= 0) return null
  return areaM2 * (thicknessCm / 100)
}

// 含损耗体积 = 体积 × (1 + 损耗%/100)
function withLossVolume(volume, lossPct) {
  if (!Number.isFinite(volume) || volume <= 0 || !Number.isFinite(lossPct) || lossPct < 0) return null
  return volume * (1 + lossPct / 100)
}

// 吨数 = 体积(m³) × 堆积密度(t/m³)；公斤 = 吨 × 1000
function tonsFrom(volumeM3Val, densityT) {
  if (!Number.isFinite(volumeM3Val) || volumeM3Val <= 0 || !Number.isFinite(densityT) || densityT <= 0) return null
  const tons = volumeM3Val * densityT
  return { tons, kg: tons * 1000 }
}

// 袋数 = 公斤数 ÷ 每袋公斤数（向上取整；bagKg 常用 25 / 50）
function bagsFrom(kg, bagKg) {
  if (!Number.isFinite(kg) || kg <= 0 || !Number.isFinite(bagKg) || bagKg <= 0) return null
  return ceilEps(kg / bagKg)
}

// 车数 = 体积 ÷ 单车容积（向上取整）
function trucksFrom(volume, capM3) {
  if (!Number.isFinite(volume) || volume <= 0 || !Number.isFinite(capM3) || capM3 <= 0) return null
  return ceilEps(volume / capM3)
}

// 每 1 m³ 约需车数（参考口径，保留小数不取整）
function trucksPerM3(capM3) {
  if (!Number.isFinite(capM3) || capM3 <= 0) return null
  return 1 / capM3
}

// 汇总：一次算全理论量与含损耗量
function calcCoverage({ areaM2, thicknessCm, density }) {
  const volume = volumeM3(areaM2, thicknessCm)
  if (volume === null) return null
  const base = tonsFrom(volume, density)
  if (!base) return null
  const lossVolume = withLossVolume(volume, LOSS_PCT)
  const loss = tonsFrom(lossVolume, density)
  return {
    volume,
    tons: base.tons,
    kg: base.kg,
    bags25: bagsFrom(base.kg, 25),
    bags50: bagsFrom(base.kg, 50),
    lossVolume,
    lossTons: loss.tons,
    lossKg: loss.kg,
    lossBags25: bagsFrom(loss.kg, 25),
    lossBags50: bagsFrom(loss.kg, 50)
  }
}
// ==== PURE-FNS-END ====

const TOOL_ID = 'gravel-sand-coverage'
const SETTINGS_KEY = 'gravel-sand-coverage-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- SEO ----------
useSeoMeta({
  title: '碎石沙土用量计算器 - 体积/吨数/袋数换算工具 | Util工具箱',
  description: '在线碎石沙土用量计算工具：输入面积与铺设厚度换算体积 m³、吨数与 25kg/50kg 袋数，内置碎石 1.5、沙子 1.6、砾石 1.7、覆土 1.3 t/m³ 堆积密度预设（可改），附 +5% 压实损耗建议与手推车/三轮车/轻卡车载数参考，纯本地计算。',
  keywords: '碎石用量计算,沙子用量,一方砂多少吨,砂石袋数换算,堆积密度,压实系数,覆土用量,gravel calculator',
  author: 'Util工具箱',
  ogTitle: '碎石沙土用量计算器 - 体积/吨数/袋数换算 | Util工具箱',
  ogDescription: '面积×厚度→体积、吨数与袋数换算，附压实损耗与车载数参考，密度预设可改。',
  ogUrl: 'https://www.util.cn/tools/gravel-sand-coverage',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '碎石沙土用量计算器',
  twitterDescription: '面积×厚度→体积、吨数与袋数换算，附压实损耗与车载数参考。'
})

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
const faqs = [
  {
    q: '20 平方米铺 5 厘米碎石要多少？',
    a: '体积 = 20 × 5 ÷ 100 = 1 m³，碎石按 1.5 t/m³ 约 1.5 吨，25kg 袋装 60 袋；加 5% 压实损耗建议采购 1.05 m³ ≈ 1.6 t，约 63 袋。'
  },
  {
    q: '一方沙子等于多少吨？',
    a: '干中砂堆积密度约 1.6 t/m³，一方约 1.6 吨；含水后可达 1.7~1.8 t/m³。碎石约 1.5、砾石约 1.7、覆土约 1.3 t/m³。'
  },
  {
    q: '袋数为什么向上取整？',
    a: '袋装只能整袋购买，59.2 袋必须买 60 袋，因此袋数与车数一律向上取整；吨数按四舍五入保留 0.1 t 显示。'
  },
  {
    q: '覆土和种植土的用量一样算吗？',
    a: '体积算法相同（面积×厚度），覆土按 1.3 t/m³ 折吨；种植土掺配后密度更低且沉降明显，建议预留 10%~15% 余量。'
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
          name: '碎石沙土用量计算器',
          url: 'https://www.util.cn/tools/gravel-sand-coverage',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '长×宽或直接面积两种输入',
            '面积×厚度换算体积 m³',
            '堆积密度折算吨数（预设可改）',
            '25kg/50kg 双口径袋数向上取整',
            '+5% 压实损耗采购建议',
            '手推车/三轮车/轻卡车载数参考',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '碎石沙土用量计算器', item: 'https://www.util.cn/tools/gravel-sand-coverage' }
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

// ---------- 状态 ----------
const inputMode = ref('size') // 'size' 长×宽 | 'area' 直接面积
const lengthM = ref(5)
const widthM = ref(4)
const areaM2 = ref(20)
const thicknessCm = ref(5)
const density = ref(1.5)
const selectedMaterial = ref('gravel')

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化 ----------
const fmt = (v, d = 2) => {
  const r = roundTo(Number(v), d)
  return r === null ? '—' : String(r)
}

// ---------- 计算 ----------
const effectiveArea = computed(() => {
  if (inputMode.value === 'area') return Number(areaM2.value)
  return Number(lengthM.value) * Number(widthM.value)
})

const areaText = computed(() => fmt(effectiveArea.value, 2))

const isValid = computed(() =>
  effectiveArea.value > 0 &&
  Number.isFinite(Number(thicknessCm.value)) && Number(thicknessCm.value) > 0 &&
  Number.isFinite(Number(density.value)) && Number(density.value) > 0
)

const result = computed(() => {
  if (!isValid.value) return null
  return calcCoverage({ areaM2: effectiveArea.value, thicknessCm: Number(thicknessCm.value), density: Number(density.value) })
})

// 车载数行（按含损耗体积）
const truckRows = computed(() => {
  if (!result.value) return []
  return [
    { name: '手推车', cap: TRUCK_CAPS.hand, count: trucksFrom(result.value.lossVolume, TRUCK_CAPS.hand) },
    { name: '三轮车', cap: TRUCK_CAPS.trike, count: trucksFrom(result.value.lossVolume, TRUCK_CAPS.trike) },
    { name: '轻卡', cap: TRUCK_CAPS.light, count: trucksFrom(result.value.lossVolume, TRUCK_CAPS.light) }
  ]
})

const trucksPerM3Ref = computed(() => ({
  hand: trucksPerM3(TRUCK_CAPS.hand),
  trike: trucksPerM3(TRUCK_CAPS.trike),
  light: trucksPerM3(TRUCK_CAPS.light)
}))

// ---------- 材料选择 ----------
function selectMaterial(m) {
  selectedMaterial.value = m.id
  density.value = m.density
}
function isMaterialActive(m) {
  return Number(density.value) === m.density
}

// ---------- 设置持久化（localStorage，键前缀用工具 id；仅 onMounted 与交互回调触达） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (s.inputMode === 'size' || s.inputMode === 'area') inputMode.value = s.inputMode
    if (Number.isFinite(s.lengthM) && s.lengthM > 0) lengthM.value = s.lengthM
    if (Number.isFinite(s.widthM) && s.widthM > 0) widthM.value = s.widthM
    if (Number.isFinite(s.areaM2) && s.areaM2 > 0) areaM2.value = s.areaM2
    if (Number.isFinite(s.thicknessCm) && s.thicknessCm > 0) thicknessCm.value = s.thicknessCm
    if (Number.isFinite(s.density) && s.density > 0) density.value = s.density
    if (typeof s.selectedMaterial === 'string') selectedMaterial.value = s.selectedMaterial
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([inputMode, lengthM, widthM, areaM2, thicknessCm, density, selectedMaterial], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      inputMode: inputMode.value,
      lengthM: lengthM.value,
      widthM: widthM.value,
      areaM2: areaM2.value,
      thicknessCm: thicknessCm.value,
      density: density.value,
      selectedMaterial: selectedMaterial.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
