<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Hash class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">十字绣尺寸计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按布规格（11ct-32ct）换算绣面厘米数，一并给出裁布尺寸、用线估算、绣绷直径与装裱框档建议</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线十字绣布规格计算工具：输入图案的宽×高格数，选择 Aida 布的 count（每英寸格数）与留边宽度，
        即可得到绣面实际尺寸（格数 ÷ count × 2.54）、含双侧留边的裁布尺寸、全绣满口径的用线米数估算（含 1.2 损耗系数）、
        推荐绣绷直径档位（15/18/20/25/30/35/40cm）以及 A4 至 50×70cm 的常见装裱框档吸附建议，并以比例示意直观展示绣面与留边的位置关系。
        全部换算在本页浏览器内完成，不上传任何数据，开线开布、配绷配框前一次算清。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：参数输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 h-fit">
        <h2 class="text-lg font-semibold flex items-center">
          <Ruler class="w-5 h-5 mr-2 text-primary" /> 参数
        </h2>

        <div>
          <p class="text-sm font-medium text-foreground mb-2">图案格数（宽 × 高，格）</p>
          <div class="grid grid-cols-2 gap-2">
            <input
              v-model.number="gridW"
              type="number" min="1" max="9999" step="1"
              class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="图案宽度格数"
            />
            <input
              v-model.number="gridH"
              type="number" min="1" max="9999" step="1"
              class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="图案高度格数"
            />
          </div>
          <p class="text-xs text-muted-foreground mt-1">直接数图纸：1 格 = 布上 1 个方格，常见图案在 100-300 格之间</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">布规格（count = 每英寸格数）</label>
          <select
            v-model.number="clothCount"
            class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="c in CLOTHS" :key="c.count" :value="c.count">{{ c.label }}（1 格约 {{ c.cellMm }}mm）</option>
          </select>
          <p class="text-xs text-muted-foreground mt-1">数字越大布越细密：11ct 粗布适合新手，14ct 最常用，25ct 以上多为亚麻细布</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">每格用线股数（1-6 股）</label>
          <input
            v-model.number="strands"
            type="range" min="1" max="6" step="1"
            class="w-full accent-primary"
          />
          <p class="text-xs text-muted-foreground mt-1">当前 <span class="font-bold text-foreground">{{ strandsValid }}</span> 股——14ct 全针常规 2 股，细布用 1 股半针</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">留边宽 cm（0-15）</label>
          <input
            v-model.number="marginCm"
            type="number" min="0" max="15" step="0.5"
            class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p class="text-xs text-muted-foreground mt-1">四周各留的空白布边，用于上绷夹持与装裱覆胶，默认 5cm</p>
        </div>

        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground mb-1">快速预设</p>
          <button
            v-for="p in PRESETS"
            :key="p.name"
            @click="applyPreset(p)"
            class="w-full px-3 py-2 rounded-lg border border-border bg-muted/50 hover:bg-muted text-sm text-foreground transition text-left"
          >
            <Play class="w-3.5 h-3.5 inline mr-2 -mt-0.5 text-primary" /> {{ p.name }}
          </button>
        </div>

        <button
          @click="resetInputs"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置参数
        </button>
      </div>

      <!-- 右侧：结果面板（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <p
          v-if="!valid"
          class="text-xs leading-relaxed p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 flex items-start gap-1.5"
        >
          <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>格数需为 1-9999 的整数，留边取 0-15cm——当前输入无法换算，请先修正参数。修正前下方沿用上一次有效结果。</span>
        </p>
        <p
          v-else
          class="text-xs leading-relaxed p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 flex items-start gap-1.5"
        >
          <CheckCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>参数有效，按 {{ clothCount }}ct 布 · 每格 1 格约 {{ cellMmText }}mm · {{ strandsValid }} 股全针口径实时换算中。</span>
        </p>

        <!-- 结果四卡 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="bg-card border border-border rounded-lg p-4">
            <p class="text-xs text-muted-foreground mb-1 flex items-center"><Ruler class="w-3.5 h-3.5 mr-1 text-primary" /> 绣面尺寸</p>
            <p class="text-xl font-bold text-foreground">{{ last ? `${last.stitch.wCm} × ${last.stitch.hCm} cm` : '—' }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">格数 ÷ count × 2.54，1 格 = {{ cellMmText }}mm</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4">
            <p class="text-xs text-muted-foreground mb-1 flex items-center"><Scissors class="w-3.5 h-3.5 mr-1 text-primary" /> 裁布尺寸</p>
            <p class="text-xl font-bold text-foreground">{{ last ? `${last.fabric.wCm} × ${last.fabric.hCm} cm` : '—' }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">绣面 + 双侧留边（每边 {{ last ? last.margin : 5 }}cm）</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4">
            <p class="text-xs text-muted-foreground mb-1 flex items-center"><Info class="w-3.5 h-3.5 mr-1 text-primary" /> 用线估算</p>
            <p class="text-xl font-bold text-foreground">{{ last ? `约 ${last.thread.pathM} 米` : '—' }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">{{ last ? `全绣满口径 · 含 1.2 损耗 · 股米合计 ${last.thread.strandM} 米` : '输入有效后估算' }}</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4">
            <p class="text-xs text-muted-foreground mb-1 flex items-center"><Hash class="w-3.5 h-3.5 mr-1 text-primary" /> 绣绷建议</p>
            <p class="text-xl font-bold text-foreground">{{ last && last.hoop ? `${last.hoop} cm 档` : '需分区绣' }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">{{ last ? `对角线 ${last.diagCm}cm × 0.9 吸附常见档` : '—' }}</p>
          </div>
        </div>

        <!-- SVG 比例示意 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <h3 class="text-sm font-semibold text-foreground mb-3">裁布比例示意（绣面居中 · 四周留边）</h3>
          <svg
            v-if="svg"
            :viewBox="`0 0 ${svg.vbW + 46} ${svg.vbH + 34}`"
            class="w-full max-w-2xl mx-auto h-auto"
            role="img"
            aria-label="绣面在裁布内的位置示意"
          >
            <rect :x="svg.fx" :y="svg.fy" :width="svg.fw" :height="svg.fh" fill="currentColor" class="text-muted/60" stroke="#94a3b8" stroke-width="1" />
            <rect :x="svg.sx" :y="svg.sy" :width="svg.sw" :height="svg.sh" fill="none" stroke="#2563eb" stroke-width="1.5" />
            <line v-for="x in svg.v" :key="`v${x}`" :x1="x" :y1="svg.sy" :x2="x" :y2="svg.sy + svg.sh" stroke="#2563eb" stroke-opacity="0.18" stroke-width="1" />
            <line v-for="y in svg.h" :key="`h${y}`" :x1="svg.sx" :y1="y" :x2="svg.sx + svg.sw" :y2="y" stroke="#2563eb" stroke-opacity="0.18" stroke-width="1" />
            <text :x="svg.sx + svg.sw / 2" :y="svg.sy + svg.sh / 2 + 4" text-anchor="middle" class="fill-primary" font-size="12" font-weight="600">绣面 {{ last ? last.stitch.wCm : 0 }} × {{ last ? last.stitch.hCm : 0 }}cm</text>
            <text :x="svg.fx - 8" :y="svg.fy + svg.fh / 2" text-anchor="end" class="fill-muted-foreground" font-size="11" :transform="`rotate(-90 ${svg.fx - 8} ${svg.fy + svg.fh / 2})`">{{ last ? last.fabric.hCm : 0 }}cm</text>
            <text :x="svg.fx + svg.fw / 2" :y="svg.fy + svg.fh + 18" text-anchor="middle" class="fill-muted-foreground" font-size="11">{{ last ? last.fabric.wCm : 0 }}cm</text>
            <text :x="svg.fx + svg.m / 2" :y="svg.fy + svg.fh / 2 + 3" text-anchor="middle" class="fill-muted-foreground" font-size="10">留边 {{ last ? last.margin : 5 }}</text>
          </svg>
          <p v-else class="text-sm text-muted-foreground py-6 text-center">填入有效格数后显示比例示意</p>
          <p class="text-xs text-muted-foreground mt-2">示意按裁布实际比例绘制，蓝色网格为绣面区域（格线过密时自动抽稀），灰底为留边布。</p>
        </div>

        <!-- 买布多买 10% 提示条 -->
        <div v-if="last && buy" class="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-foreground flex items-start gap-2">
          <Info class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span class="leading-relaxed">
            经验提示：棉麻绣布上绷会被拉伸、下水会收缩，剪边还会脱线——买布请在裁布尺寸基础上<strong>多买约 10%</strong>，
            本图案建议按 <strong>{{ buy.wCm }} × {{ buy.hCm }} cm</strong> 起裁（已向上取整）。若打算先洗后绣，再放宽到 15%。
          </span>
        </div>

        <!-- 装裱建议条 -->
        <div v-if="last" class="p-3.5 rounded-lg bg-primary/5 border border-primary/20 text-sm text-foreground flex items-start gap-2">
          <Ruler class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span class="leading-relaxed">
            装裱建议：
            <template v-if="last.frame">裁布可并入常见相框档 <strong>{{ last.frame.label }}</strong>（含留边内窗：卡纸开窗盖住多余布边即可）。若绣面已接近布边、无需卡纸，也可直接照绣面尺寸配框。</template>
            <template v-else>裁布 {{ last.fabric.wCm }} × {{ last.fabric.hCm }}cm 已超出常见框档（最大 50×70cm），建议定制画框或改分幅装裱。</template>
          </span>
        </div>

        <!-- 全针 vs 半针 小卡 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <h3 class="text-sm font-semibold text-foreground mb-2 flex items-center"><Info class="w-4 h-4 mr-1.5 text-primary" /> 1/2 化格：全针与半针的布效差别</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            同一张布，「几股全针」与「1 股半针」的观感完全不同：2 股全针绣满后格形饱满、遮布性好，是 14ct 及以下粗布的常规口径（本工具用线估算即按此口径）；
            1 股半针只走对角线的一半行程，用线约为全针的一半，布面更轻薄透气，常用于 25ct/28ct 细亚麻布的人像过渡或背景晕染。
            布越密（count 越大）越适合减少股数：28ct 用 2 股全针会勒得布纹变形，一般 1 股即可；反之 11ct 粗布只用 1 股会露出布底。
            若整幅只绣半针，实际用线可按本页结果的约一半理解，但绣面厘米数不受针法影响——它只由格数与布规格决定。
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>十字绣尺寸计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款面向手工爱好者的十字绣布规格计算工具：把图纸上的格数换算成真实世界的厘米数，并顺着绣前流程一路算到底——
          裁布多大、留边多宽、大概费多少线、买多大的绣绷、完工后能配哪一档相框。所有计算在浏览器本地完成，
          不依赖网络，也不上传任何图案数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">14ct、11ct 这些数字到底什么意思？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          ct 是 count 的缩写，指布在 1 英寸（2.54cm）长度内有多少个方格。14ct 就是每英寸 14 格，单格边长约 2.54 ÷ 14 ≈ 1.81mm；
          11ct 每英寸 11 格，单格约 2.31mm，布更粗、图样显大，适合新手和大字；16ct、18ct 居中；
          25ct、28ct、32ct 每英寸二十几个格，单格不足 1mm，多为亚麻混纺细布，绣出来的成品细腻，但耗时长、需要更少的线股。
          同一张图纸在 11ct 与 14ct 布上绣出的成品尺寸相差约 27%，开线开布前先确认布规格。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">格数怎么变成厘米？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          核心换算只有一条公式：<strong>绣面厘米 = 格数 ÷ count × 2.54</strong>。
          例如 200 格的图案宽，在 14ct 布上是 200 ÷ 14 × 2.54 ≈ 36.3cm。
          裁布尺寸在此基础上四周各加留边：裁布宽 = 绣面宽 + 2 × 留边。用线估算则按「每针走线 ≈ 2.5 倍格边长」的全绣满口径，
          乘以总格数、股数和 1.2 损耗系数，结果以「米」为单位——具体见下方 FAQ 的说明。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么要留边？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          留边有三个用途：一是上绣绷时绷圈要夹住绣面以外的布，夹到图案边缘会把格数拉歪；二是长时间手持缝合的汗渍、磨边都落在空白处；
          三是装裱时背板覆胶、卡纸开窗都需要额外的布边来固定和遮丑。一般作品每边留 3-5cm 足够，
          大幅作品或计划专业装裱的建议留到 5-8cm；只做书签、钥匙扣等小件且用卡纸满裱的，2-3cm 也可以。留边直接计入裁布尺寸，别按绣面买布。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">绣线一支能用多久，为什么算不准？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本工具的用线估算按「全部绣满、每针走线约 2.5 倍格边长、含 1.2 损耗」的口径给出米数，
          但实际用线受针法密度影响非常大：全针、法针、1/4 针、直针的用线可差出一倍；
          拉线的松紧、回针藏线的习惯、换色与打结的损耗也因人而异。
          多股绣线（常见一支 6 股、总股长 = 股数 × 支长）换算成「支数」时还要看品牌支长标注，各家并不统一。
          所以本页只诚实报告「约 X 米（含损耗）」和股米合计，具体买几支请以手中色卡的支长换算，宁可先买齐主力色再补配。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">绣绷大小和布数怎么配套？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          绣绷不需要一次夹住整块布，但它的工作直径要和布的粗细匹配：11ct 粗布在 10cm 的小绷里几乎转不开，
          而 28ct 细布在大绷上又容易局部起皱。本页按裁布对角线 × 0.9 的口径吸附 15/18/20/25/30/35/40cm 常见档位给出一个参考起点；
          超出 40cm 的大幅作品（如客厅挂画）几乎都采用「分区上绷、最后拼合」的做法，用小一号的绷反复挪位置即可，不必追求超大绣绷。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">14ct 和 11ct 布绣同一张图，成品差多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">按格数 ÷ count × 2.54 换算，同一图案在 11ct 布上比 14ct 布大约 27%（14 ÷ 11 ≈ 1.27），用线也同比例增加。图纸若注明 14ct 而你想绣大一号挂客厅，换 11ct 布即可等比放大。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">用线估算能精确到买几支吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不能精确到支。本工具给出全绣满口径的总米数与股米合计，而各品牌绣线的股数（常见 6 股）与支长（常见 8m）不统一，加上针法密度和个人习惯差异可达 ±50%。请按股米合计除以单支总股长估算，主力色多备一支，以实际色卡为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">裁布尺寸要直接按它买布吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">建议再多买约 10%：棉麻布下水收缩、上绷拉伸、剪边脱线都会吃掉尺寸，按裁布尺寸向上取整并放宽一成再裁更稳妥；打算绣前先洗布的去浆处理，则建议放宽到 15%。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算结果会上传或保存吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。格数、布规格、留边等参数只在页面内存中参与换算，不发送任何网络请求，刷新页面即恢复默认值。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'cross-stitch-calculator'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Hash, Scissors, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Ruler
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '十字绣尺寸计算器 - 绣布绣线绣框用量在线计算',
  description: '免费在线十字绣布规格计算器：按 aida 11ct/14ct/16ct/18ct/25ct/28ct/32ct 把图纸格数换算成绣面厘米，自动给出含留边裁布尺寸、绣线用量米数估算、绣绷直径档位与常见相框装裱建议，纯浏览器本地计算不上传',
  keywords: '十字绣布规格计算,aida 14count 尺寸,绣线用量计算,十字绣留边,绣框尺寸',
  author: '有条工具',
  ogTitle: '十字绣尺寸计算器 - 绣布绣线绣框用量在线计算 | 有条工具',
  ogDescription: '输入图案格数与布规格，一次算清绣面尺寸、裁布留边、用线估算、绣绷直径与装裱框档。',
  ogUrl: 'https://www.util.cn/tools/cross-stitch-calculator',
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
          name: '十字绣尺寸计算器',
          url: 'https://www.util.cn/tools/cross-stitch-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['11ct-32ct 布规格换算绣面厘米', '留边裁布尺寸计算', '全绣满口径用线米数估算', '绣绷直径档位吸附', 'A4 至 50×70cm 装裱框档建议', '裁布比例 SVG 示意', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '十字绣尺寸计算器', item: 'https://www.util.cn/tools/cross-stitch-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '14ct 和 11ct 布绣同一张图，成品差多少？',
              acceptedAnswer: { '@type': 'Answer', text: '按格数÷count×2.54 换算，同一图案在 11ct 布上比 14ct 布大约 27%（14÷11≈1.27），用线也同比例增加。图纸若注明 14ct 而想绣大一号，换 11ct 布即可等比放大。' }
            },
            {
              '@type': 'Question',
              name: '用线估算能精确到买几支吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能精确到支。本工具给出全绣满口径的总米数与股米合计，而各品牌绣线的股数（常见 6 股）与支长（常见 8m）不统一，加上针法密度和个人习惯差异可达±50%。请按股米合计除以单支总股长估算，主力色多备一支，以实际色卡为准。' }
            },
            {
              '@type': 'Question',
              name: '裁布尺寸要直接按它买布吗？',
              acceptedAnswer: { '@type': 'Answer', text: '建议再多买约 10%：棉麻布下水收缩、上绷拉伸、剪边脱线都会吃掉尺寸，按裁布尺寸向上取整并放宽一成再裁更稳妥；打算绣前先洗布去浆的，建议放宽到 15%。' }
            },
            {
              '@type': 'Question',
              name: '为什么要留边？',
              acceptedAnswer: { '@type': 'Answer', text: '留边用于上绣绷夹持（夹到图案边缘会拉歪格数）、日常手持防磨防汗、以及装裱时覆胶固定和卡纸遮丑。一般每边留 3-5cm，大幅或专业装裱留 5-8cm，留边直接计入裁布尺寸。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const INCH_CM = 2.54        // 1 英寸 = 2.54 厘米
const WASTE_FACTOR = 1.2    // 用线损耗系数：换线、打结、回针藏线
const HOOP_FIT_FACTOR = 0.9 // 绣绷口径：对角线 × 0.9 作为「刚好罩住绣面」的最小绷径近似

// 常见 Aida/亚麻布规格：count = 每英寸格数；cellMm = 单格边长（毫米，2 位小数，纯常量）
const CLOTHS = [
  { count: 11, cellMm: 2.31, label: '11ct' },
  { count: 14, cellMm: 1.81, label: '14ct（Aida 最常用）' },
  { count: 16, cellMm: 1.59, label: '16ct' },
  { count: 18, cellMm: 1.41, label: '18ct' },
  { count: 25, cellMm: 1.02, label: '25ct（细布）' },
  { count: 28, cellMm: 0.91, label: '28ct（亚麻常用）' },
  { count: 32, cellMm: 0.79, label: '32ct' }
]

// 绣绷常见直径档位（cm）
const HOOP_TIERS = [15, 18, 20, 25, 30, 35, 40]

// 常见装裱框档（cm），按面积升序吸附
const FRAME_TIERS = [
  { label: 'A4（21×29.7）', w: 21, h: 29.7 },
  { label: '30×40', w: 30, h: 40 },
  { label: 'A3（29.7×42）', w: 29.7, h: 42 },
  { label: '40×50', w: 40, h: 50 },
  { label: '50×70', w: 50, h: 70 }
]

function round1(n) {
  return Math.round(n * 10) / 10
}
function round2(n) {
  return Math.round(n * 100) / 100
}

// 正整数格数校验
function isPosInt(n) {
  return Number.isFinite(n) && Number.isInteger(n) && n > 0
}

// 布规格校验：1-100 之间的正数格密度
function isValidCount(n) {
  return Number.isFinite(n) && n > 0 && n <= 100
}

// 绣面尺寸：格数 ÷ count × 2.54，1 位小数；非法输入返回 null
function stitchingSizeOf(grids, count) {
  if (!grids || !isPosInt(grids.w) || !isPosInt(grids.h) || !isValidCount(count)) return null
  return {
    wCm: round1((grids.w / count) * INCH_CM),
    hCm: round1((grids.h / count) * INCH_CM)
  }
}

// 裁布尺寸：绣面 + 双侧留边（每边各加 marginCm），留边 0 时与绣面相等
function fabricSizeOf(stitch, marginCm) {
  if (!stitch || !Number.isFinite(marginCm) || marginCm < 0) return null
  return {
    wCm: round1(stitch.wCm + 2 * marginCm),
    hCm: round1(stitch.hCm + 2 * marginCm)
  }
}

// 用线估算（全绣满口径：每针走线 ≈ 2.5 倍格边长，含回针与背走线；实际用线因针法密度差异大，可差出一倍）
// pathM = 工作线段总长（k 股并行走完绣面路径），strandM = 股米合计（k 股各走一遍路径的股长之和）
function threadLengthOf(gridsW, gridsH, count, strands, coverFactor = 2.5) {
  if (!isPosInt(gridsW) || !isPosInt(gridsH) || !isValidCount(count)) return null
  if (!isPosInt(strands) || strands < 1 || strands > 6) return null
  if (!Number.isFinite(coverFactor) || coverFactor <= 0) return null
  const cellCm = INCH_CM / count
  const rawM = gridsW * gridsH * cellCm * coverFactor * WASTE_FACTOR / 100
  return { pathM: round1(rawM), strandM: round1(rawM * strands) }
}

// 推荐绣绷最小直径：对角线 × 0.9 口径后吸附常见档，超出最大档返回 null（应分区绣）
function hoopSizeOf(fabricW, fabricH) {
  if (!(fabricW > 0) || !(fabricH > 0)) return null
  const need = Math.sqrt(fabricW * fabricW + fabricH * fabricH) * HOOP_FIT_FACTOR
  return HOOP_TIERS.find((d) => d >= need) || null
}

// 装裱框档吸附：裁布可横竖放入的最小常见档；超出返回 null
function frameSizeOf(fabricW, fabricH) {
  if (!(fabricW > 0) || !(fabricH > 0)) return null
  const fits = (t) =>
    (fabricW <= t.w + 0.05 && fabricH <= t.h + 0.05) ||
    (fabricH <= t.w + 0.05 && fabricW <= t.h + 0.05)
  return FRAME_TIERS.find(fits) || null
}

// 买布放宽建议：裁布 ×1.1 后向上取整到厘米
function buyAdviceOf(fabric) {
  if (!fabric) return null
  return { wCm: Math.ceil(fabric.wCm * 1.1), hCm: Math.ceil(fabric.hCm * 1.1) }
}

// 绣面对角线（1 位小数），用于绣绷口径展示
function diagOf(fabric) {
  if (!fabric) return null
  return round1(Math.sqrt(fabric.wCm * fabric.wCm + fabric.hCm * fabric.hCm))
}

// SVG 版式：裁布外框 + 居中绣面矩形 + 留边像素宽，按最大宽/高缩放
function svgLayoutOf(fabric, stitch, maxW = 460, maxH = 300) {
  if (!fabric || !stitch || !(fabric.wCm > 0) || !(fabric.hCm > 0)) return null
  const scale = Math.min(maxW / fabric.wCm, maxH / fabric.hCm)
  const fw = round2(fabric.wCm * scale)
  const fh = round2(fabric.hCm * scale)
  const sw = round2(stitch.wCm * scale)
  const sh = round2(stitch.hCm * scale)
  return {
    fx: 42, fy: 12, fw, fh,
    sx: round2(42 + (fw - sw) / 2), sy: round2(12 + (fh - sh) / 2), sw, sh,
    m: round2((fw - sw) / 2),
    vbW: fw + 46, vbH: fh + 34
  }
}

// 绣面内示意网格线：格线间距小于 minGap 像素时自动抽稀
function svgGridLinesOf(box, gridsW, gridsH, minGap = 8) {
  const lines = { v: [], h: [] }
  if (!box || !isPosInt(gridsW) || !isPosInt(gridsH)) return lines
  const stepX = box.sw / gridsW
  const stepY = box.sh / gridsH
  const skipX = Math.max(1, Math.ceil(minGap / stepX))
  const skipY = Math.max(1, Math.ceil(minGap / stepY))
  for (let i = skipX; i < gridsW; i += skipX) lines.v.push(round2(box.sx + i * stepX))
  for (let j = skipY; j < gridsH; j += skipY) lines.h.push(round2(box.sy + j * stepY))
  return lines
}

// ---------- 预设 ----------
const PRESETS = [
  { name: '① 大幅山水：200×300 格 · 14ct · 2 股', grids: { w: 200, h: 300 }, count: 14, strands: 2, margin: 5 },
  { name: '② 新手样卡：100×100 格 · 11ct · 3 股', grids: { w: 100, h: 100 }, count: 11, strands: 3, margin: 5 }
]

// ---------- 响应式状态（输入） ----------
const gridW = ref(100)
const gridH = ref(100)
const clothCount = ref(14)
const strands = ref(2)
const marginCm = ref(5)
const seoContentVisible = ref(true)

// ---------- 派生计算 ----------
const strandsValid = computed(() => (isPosInt(strands.value) ? Math.min(6, strands.value) : 2))
const marginValid = computed(() => {
  const m = Number(marginCm.value)
  return Number.isFinite(m) && m >= 0 && m <= 15 ? Math.round(m * 2) / 2 : 5
})
const cellMmText = computed(() => {
  const cloth = CLOTHS.find((c) => c.count === clothCount.value)
  return cloth ? cloth.cellMm.toFixed(2) : round2(INCH_CM / Math.max(clothCount.value, 1) * 10).toFixed(2)
})
const valid = computed(() =>
  isPosInt(gridW.value) && gridW.value <= 9999 &&
  isPosInt(gridH.value) && gridH.value <= 9999 &&
  CLOTHS.some((c) => c.count === clothCount.value)
)

// 计算链：格数 → 绣面 → 裁布 → 用线 / 绣绷 / 装裱
const current = computed(() => {
  if (!valid.value) return null
  const stitch = stitchingSizeOf({ w: gridW.value, h: gridH.value }, clothCount.value)
  if (!stitch) return null
  const fabric = fabricSizeOf(stitch, marginValid.value)
  return {
    stitch,
    fabric,
    thread: threadLengthOf(gridW.value, gridH.value, clothCount.value, strandsValid.value),
    hoop: hoopSizeOf(fabric.wCm, fabric.hCm),
    frame: frameSizeOf(fabric.wCm, fabric.hCm),
    diagCm: diagOf(fabric),
    margin: marginValid.value
  }
})

// 输入被改成非法时，沿用最后一次有效结果继续展示（避免整页空白）
const last = ref(null)
const lastSource = ref(null)
if (current.value) last.value = current.value
watch(current, (val) => {
  if (val) {
    last.value = val
    lastSource.value = { w: gridW.value, h: gridH.value, c: clothCount.value, s: strandsValid.value, m: marginValid.value }
  }
})

// SVG 示意与买布建议跟随 last
const svg = computed(() => {
  if (!last.value) return null
  const box = svgLayoutOf(last.value.fabric, last.value.stitch)
  if (!box) return null
  const src = lastSource.value || { w: gridW.value, h: gridH.value }
  return { ...box, ...svgGridLinesOf(box, src.w, src.h) }
})
const buy = computed(() => (last.value ? buyAdviceOf(last.value.fabric) : null))

// ---------- 交互 ----------
function applyPreset(p) {
  gridW.value = p.grids.w
  gridH.value = p.grids.h
  clothCount.value = p.count
  strands.value = p.strands
  marginCm.value = p.margin
}

function resetInputs() {
  gridW.value = 100
  gridH.value = 100
  clothCount.value = 14
  strands.value = 2
  marginCm.value = 5
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('cross-stitch-calculator')
})
</script>
