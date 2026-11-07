<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Ruler class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">屏幕尺子</h1>
          <p class="text-sm text-muted-foreground mt-1">银行卡 / 机型预设校准 PPI 后，屏幕即成毫米英寸双刻度直尺，拖动双把手测量任意长度</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线屏幕尺子：浏览器无法直接知道你的屏幕物理宽度，所以先做一次 10 秒的校准——用一张银行卡（ISO ID-1 标准 85.60×53.98mm）在屏上对齐，
        或选择设备型号套用官方分辨率/像素密度换算；校准后下方就是 cm 主刻度 + mm 次刻度的直尺，拖动 A/B 两个把手即可读出 px ↔ mm ↔ inch 三种单位。
        校准值保存在本地 localStorage，下次打开不用重新校准。所有计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：校准面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Crosshair class="w-5 h-5 mr-2 text-primary" /> 校准（先做这一步）
        </h2>

        <!-- 校准方式切换 -->
        <div class="grid grid-cols-3 gap-2">
          <button
            @click="calTab = 'card'"
            :class="calTab === 'card' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'"
            class="px-2 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1"
          >
            <CreditCard class="w-3.5 h-3.5" /> 银行卡
          </button>
          <button
            @click="calTab = 'device'"
            :class="calTab === 'device' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'"
            class="px-2 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1"
          >
            <Smartphone class="w-3.5 h-3.5" /> 机型预设
          </button>
          <button
            @click="calTab = 'manual'"
            :class="calTab === 'manual' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'"
            class="px-2 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1"
          >
            <PencilLine class="w-3.5 h-3.5" /> 手动
          </button>
        </div>

        <!-- 方式① 银行卡校准（最可靠） -->
        <div v-if="calTab === 'card'" class="space-y-3">
          <p class="text-xs text-muted-foreground leading-relaxed">
            找一张实体银行卡（标准尺寸 <span class="font-mono text-foreground">85.60 × 53.98 mm</span>，身份证 85.6×54.0mm 亦可），
            平贴在屏幕上下方框处，<span class="text-foreground font-medium">拖动滑杆直到边框与实体卡完全重合</span>，再点「确认校准」。
            CSS 里的 mm 单位不可靠，所以这里只认你拖出来的像素宽。
          </p>
          <div class="flex justify-center py-2">
            <div
              class="border-2 border-dashed border-primary rounded-lg bg-primary/5"
              :style="{ width: cardSliderPx + 'px', height: cardPreviewHeight + 'px' }"
            >
              <p class="text-center text-[10px] text-muted-foreground pt-1 font-mono">{{ cardSliderPx }} px</p>
            </div>
          </div>
          <input v-model.number="cardSliderPx" type="range" min="120" max="900" step="1" class="w-full accent-[var(--primary,#2563eb)]" />
          <div class="bg-muted/50 rounded-xl p-3 text-xs font-mono text-muted-foreground space-y-1">
            <p>pxPerMm = {{ cardSliderPx }} ÷ 85.6 = <span class="text-foreground font-bold">{{ cardPxPerMm }}</span> px/mm</p>
            <p>PPI ≈ {{ cardPxPerMm }} × 25.4 = <span class="text-foreground font-bold">{{ cardPpi }}</span></p>
          </div>
          <button
            @click="confirmCardCalibration"
            class="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-lg text-sm font-semibold transition"
          >
            确认校准（{{ cardPxPerMm }} px/mm）
          </button>
        </div>

        <!-- 方式② 机型预设 -->
        <div v-if="calTab === 'device'" class="space-y-3">
          <p class="text-xs text-muted-foreground leading-relaxed">
            按官方分辨率与像素密度（PPI）折算<span class="text-foreground font-medium">屏幕有源显示区宽度</span>：
            有源区宽 mm = 物理宽 px ÷ PPI × 25.4，pxPerMm = CSS 宽 ÷ 有源区宽。注意机身宽含边框，不能直接当显示区用。
          </p>
          <select
            v-model="deviceKey"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="d in DEVICE_PRESETS" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
          <div class="bg-muted/50 rounded-xl p-3 text-xs font-mono text-muted-foreground space-y-1">
            <p v-for="line in deviceDetailLines" :key="line">{{ line }}</p>
          </div>
          <button
            @click="confirmDeviceCalibration"
            class="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-lg text-sm font-semibold transition"
          >
            应用机型校准（{{ devicePxPerMm }} px/mm）
          </button>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            机型预设是官方参数折算的估计值：系统显示缩放、浏览器差异都可能带来 ±2% 上下偏差；要更准请用银行卡法。
          </p>
        </div>

        <!-- 方式③ 手动输入 -->
        <div v-if="calTab === 'manual'" class="space-y-3">
          <p class="text-xs text-muted-foreground leading-relaxed">已知自己屏幕的换算关系？直接填每毫米对应多少 CSS 像素（96dpi 标准屏 ≈ 3.78 px/mm）。</p>
          <label class="text-sm font-medium text-foreground block">pxPerMm（px / mm）</label>
          <input v-model.number="manualPxPerMm" type="number" step="0.001" min="1" max="40"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <button
            @click="confirmManualCalibration"
            class="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-lg text-sm font-semibold transition"
          >
            应用手动校准
          </button>
        </div>

        <!-- 当前校准状态 -->
        <div class="bg-muted/50 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p class="text-xs text-muted-foreground">当前校准值</p>
            <p class="text-sm font-bold font-mono text-foreground">{{ pxPerMmText }} px/mm
              <span v-if="calSource === 'guess'" class="text-[11px] font-sans font-normal text-amber-600 ml-1">（96dpi 估算，未校准）</span>
              <span v-else class="text-[11px] font-sans font-normal text-green-600 ml-1">（{{ sourceLabel }}）</span>
            </p>
          </div>
          <button
            @click="resetCalibration"
            class="px-2.5 py-1.5 border border-border rounded-lg text-xs text-foreground hover:bg-muted transition flex items-center gap-1"
          >
            <RotateCcw class="w-3.5 h-3.5" /> 重置
          </button>
        </div>

        <!-- 降级提示卡 -->
        <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
          <TriangleAlert class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            无法校准或没有银行卡？<span class="text-foreground font-medium">银行卡法最可靠</span>：任何 85.6mm 宽的磁条卡（借记卡/信用卡/公交卡/身份证）都行；
            机型预设仅建议手机用户使用，桌面大屏请优先银行卡或手动输入。
          </p>
        </div>
      </div>

      <!-- 右侧：直尺测量区（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 刻度尺（cm 主刻度 + mm 次刻度）
          </h2>
          <span
            v-if="calSource === 'guess'"
            class="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
          >未校准 · 按 96dpi 估算</span>
          <span v-else class="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300">
            已校准 · {{ pxPerMmText }} px/mm
          </span>
        </div>

        <!-- 直尺本体：SSR 渲染静态占位，测量后才渲染刻度 -->
        <div v-if="trackWidthPx > 0" class="space-y-1">
          <div ref="trackEl" class="relative h-24 select-none touch-none bg-background border border-border rounded-lg overflow-hidden">
            <!-- 刻度线 -->
            <div
              v-for="tick in ticks"
              :key="tick.mm"
              class="absolute bottom-0 border-l"
              :class="tick.level === 'cm' ? 'h-8 border-foreground' : (tick.level === 'half' ? 'h-5 border-muted-foreground/70' : 'h-3 border-muted-foreground/40')"
              :style="{ left: tick.x + 'px' }"
            ></div>
            <!-- cm 数字 -->
            <p
              v-for="tick in cmLabeledTicks"
              :key="'label-' + tick.mm"
              class="absolute bottom-8 -translate-x-1/2 text-[11px] font-mono text-muted-foreground"
              :style="{ left: tick.x + 'px' }"
            >{{ tick.label }}</p>
            <p class="absolute top-1 right-2 text-[10px] text-muted-foreground font-mono">单位：cm（每小格 1mm）</p>

            <!-- A→B 测量带 -->
            <div
              class="absolute bottom-0 h-10 bg-primary/15 border-x border-primary"
              :style="{ left: measureLeft + 'px', width: measurePx + 'px' }"
            ></div>
            <div
              class="absolute top-0 bottom-0 border-l-2 border-primary"
              :style="{ left: measureLeft + measurePx + 'px' }"
            ></div>

            <!-- 拖动把手 A / B -->
            <button
              v-for="h in handleDefs"
              :key="h.key"
              class="absolute top-1 -translate-x-1/2 w-7 h-9 rounded-md flex items-center justify-center text-white text-xs font-bold shadow cursor-ew-resize"
              :class="h.key === 'a' ? 'bg-red-500' : 'bg-blue-500'"
              :style="{ left: h.pos + 'px' }"
              @pointerdown.prevent="onHandleDown($event, h.key)"
              :aria-label="'测量把手 ' + h.key.toUpperCase()"
            >
              <GripVertical class="w-4 h-4" />
            </button>
          </div>

          <!-- 读数 -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-muted/50 rounded-xl p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">A → B 距离</p>
              <p class="text-xl font-mono font-bold text-foreground">{{ measureMm }} <span class="text-xs font-sans font-medium text-muted-foreground">mm</span></p>
            </div>
            <div class="bg-muted/50 rounded-xl p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">厘米</p>
              <p class="text-xl font-mono font-bold text-primary">{{ measureCm }} <span class="text-xs font-sans font-medium text-muted-foreground">cm</span></p>
            </div>
            <div class="bg-muted/50 rounded-xl p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">英寸</p>
              <p class="text-xl font-mono font-bold text-foreground">{{ measureInch }} <span class="text-xs font-sans font-medium text-muted-foreground">in</span></p>
            </div>
            <div class="bg-muted/50 rounded-xl p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">屏幕像素</p>
              <p class="text-xl font-mono font-bold text-foreground">{{ measurePx }} <span class="text-xs font-sans font-medium text-muted-foreground">px</span></p>
            </div>
          </div>
          <div class="flex items-center justify-between gap-2">
            <p class="text-[11px] text-muted-foreground">拖动红色 A / 蓝色 B 把手夹住要测的物体；把手位置也可用键盘左右方向键微调（聚焦后）。</p>
            <button
              @click="copyMeasure"
              class="px-2 py-1 border border-border text-xs text-foreground hover:bg-muted transition flex-shrink-0 flex items-center gap-1"
            >
              <Copy class="w-3.5 h-3.5" /> 复制读数
            </button>
          </div>
        </div>
        <div v-else class="h-48 flex items-center justify-center bg-muted/30 rounded-lg">
          <p class="text-sm text-muted-foreground">正在加载刻度尺…（若长时间空白请刷新页面）</p>
        </div>

        <!-- 换算公式卡 -->
        <div class="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground space-y-1.5 font-mono">
          <p class="font-sans font-semibold text-foreground">换算公式</p>
          <p>pxPerMm = 卡片像素宽 ÷ 85.6（银行卡法）</p>
          <p>实际长度 mm = 屏幕像素 ÷ pxPerMm；1 inch = 25.4 mm</p>
          <p>PPI = pxPerMm × 25.4；机型法：pxPerMm = PPI ÷ (25.4 × DPR)</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12 open:pb-8">
      <summary class="text-lg font-semibold text-foreground cursor-pointer select-none flex items-center">
        <Info class="w-5 h-5 mr-2 text-primary" /> 为什么不同屏幕「网页像素」不一样？刻度尺怎么才算准？（点击展开：原理、公式、FAQ 与来源）
      </summary>

      <div class="mt-4 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">CSS px ≠ 物理毫米</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            网页布局用的长度单位是 CSS 像素（逻辑像素）：CSS 规定在标准 96dpi 参考屏上 1px = 1/96 inch ≈ 0.2646mm，
            但这只是「参考换算」——手机为了在小物理屏上显示完整桌面网页，引入了设备像素比（DPR）：iPhone 15 Pro 的 CSS 视口宽 393px，
            背后是 1179 物理像素（DPR=3）。所以同样是 393px 的网页宽度，在 iPhone 15 Pro 上物理约 65mm，在一台 96dpi 的老显示器上就是约 104mm。
            浏览器不会把屏幕物理尺寸暴露给网页，这就是任何「网页尺子」都必须先校准的原因。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">两种校准方式的口径与公式</h3>
          <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li>银行卡法（推荐）：对齐实体卡后 pxPerMm = 卡片像素宽 ÷ 85.6；PPI = pxPerMm × 25.4。例：卡片量得 300px → 1mm=3.5047px，PPI≈89.0。误差只来自对齐精度，通常 &lt;1%。</li>
            <li>机型预设法：pxPerMm = 官方 PPI ÷ (25.4 × DPR)；屏幕有源区宽 = 物理分辨率宽 ÷ PPI × 25.4。例：iPhone 15 Pro = 460 ÷ (25.4×3) ≈ 6.037 px/mm，393 CSS px 对应约 65.1mm 显示区（机身宽 70.6mm 含边框，不能直接用）。</li>
            <li>默认未校准状态按 96dpi 估算：100px 显示 26.46mm，仅作占位参考，别拿去量东西。</li>
          </ul>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-semibold text-foreground">为什么不能用 CSS 的 mm/cm 单位直接画尺子？</h4>
              <p class="text-sm text-muted-foreground mt-1">CSS 中 1mm 固定等于 96/25.4 px，与屏幕真实物理尺寸无关——在手机上「1cm」可能只有真实 7mm。所以必须靠一个已知实物（银行卡）或官方参数（机型预设）反推 pxPerMm。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">校准后能测多准？</h4>
              <p class="text-sm text-muted-foreground mt-1">银行卡法一般可到 ±1% 量级（对齐得好可更好），足够量课本、零件、照片；但它依赖屏幕像素网格与浏览器渲染，不能替代游标卡尺做工程测量。浏览器缩放（Ctrl+/-）会改变 CSS px 与物理像素的映射，缩放后需重新校准。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">手机上用哪种方式最方便？</h4>
              <p class="text-sm text-muted-foreground mt-1">手机选「机型预设」一键校准最方便；追求精度仍建议银行卡法。校准值已存入浏览器 localStorage（仅保存在你自己的设备上），下次打开自动恢复，换设备或清浏览器数据后需要重新校准。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">外接显示器 / 投屏后读数对吗？</h4>
              <p class="text-sm text-muted-foreground mt-1">不对。校准值跟「校准时的那块屏」绑定，换显示器、改系统缩放比例、改浏览器缩放都会让 pxPerMm 失效，请重新校准一次。</p>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">口径与来源（两源交叉核对）</h3>
          <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li>银行卡 85.60 × 53.98mm：ISO/IEC 7810 ID-1 规范（identicon/维基条目交叉一致），身份证 85.6×54.0mm 为第二代居民身份证公开尺寸。</li>
            <li>机型 CSS 视口与 DPR：viewport 尺寸库（yesviz.com、blisk.io 设备库）两源交叉；PPI 与物理分辨率取厂商官方技术规格页（Apple Tech Specs、Samsung Specs、Google Store）。</li>
            <li>96dpi 参考：CSS 绝对单位换算规范（1in = 96px = 25.4mm，W3C CSS Values and Units）。</li>
          </ul>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'online-ruler'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Ruler, Crosshair, CreditCard, Smartphone, PencilLine,
  TriangleAlert, Info, Copy, RotateCcw, GripVertical
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '屏幕尺子 - 在线尺子毫米刻度（银行卡校准PPI） | 有条工具',
  description: '在线屏幕尺子：用银行卡 85.6mm 或机型预设校准 PPI 后，屏幕变成 cm+mm 双刻度直尺，拖动双把手测量任意长度，px↔mm↔inch 三单位读数，校准值本地保存，纯浏览器本地运行不上传。',
  keywords: '在线尺子,屏幕尺子,网页版直尺,尺子在线测量,银行卡校准尺子,PPI校准',
  author: '有条工具',
  ogTitle: '屏幕尺子 - 在线尺子毫米刻度（银行卡校准PPI） | 有条工具',
  ogDescription: '银行卡/机型预设校准 PPI 后屏幕即成毫米英寸双刻度直尺，拖动双把手测量，本地保存校准值。',
  ogUrl: 'https://www.util.cn/tools/online-ruler',
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
          name: '屏幕尺子',
          url: 'https://www.util.cn/tools/online-ruler',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '银行卡(85.6mm)拖动对齐校准 PPI',
            'iPhone/Galaxy/Pixel 机型预设一键校准',
            'cm 主刻度 + mm 次刻度直尺',
            'A/B 双把手拖动测量',
            'px↔mm↔cm↔inch 四单位读数',
            'localStorage 本地保存校准值',
            '未校准 96dpi 降级占位'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '屏幕尺子', item: 'https://www.util.cn/tools/online-ruler' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么不能用 CSS 的 mm/cm 单位直接画尺子？',
              acceptedAnswer: { '@type': 'Answer', text: 'CSS 中 1mm 固定等于 96/25.4 px，与屏幕真实物理尺寸无关，在手机上「1cm」可能只有真实 7mm，必须用已知实物或机型官方参数反推 pxPerMm。' }
            },
            {
              '@type': 'Question',
              name: '校准后能测多准？',
              acceptedAnswer: { '@type': 'Answer', text: '银行卡法一般 ±1% 量级，足够日常测量；不能替代游标卡尺做工程测量，浏览器或系统缩放改变后需重新校准。' }
            },
            {
              '@type': 'Question',
              name: '手机上用哪种校准方式最方便？',
              acceptedAnswer: { '@type': 'Answer', text: '手机选机型预设一键校准最方便；追求精度用银行卡法。校准值保存在浏览器 localStorage，仅存于本地设备。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯函数区（node 可独立单测） ----------
const CARD_MM = 85.6          // ISO/IEC 7810 ID-1 短边（银行卡长边）毫米数
const MM_PER_INCH = 25.4
const DEFAULT_PX_PER_MM = 96 / MM_PER_INCH   // 96dpi 标准参考屏：1px ≈ 0.2646mm，即 3.7795 px/mm（未校准占位）

// 银行卡法：卡片像素宽 → pxPerMm
function pxPerMmFromCard(cardPx, cardMm = CARD_MM) {
  if (!(cardPx > 0) || !(cardMm > 0)) return DEFAULT_PX_PER_MM
  return cardPx / cardMm
}

// 银行卡法：卡片像素宽 → 屏幕物理 PPI
function ppiFromCard(cardPx, cardMm = CARD_MM) {
  return pxPerMmFromCard(cardPx, cardMm) * MM_PER_INCH
}

// px ↔ 物理长度
function mmFromPx(px, pxPerMm) {
  if (!(pxPerMm > 0)) return 0
  return px / pxPerMm
}
function pxFromMm(mm, pxPerMm) {
  return mm * pxPerMm
}
function inchFromMm(mm) {
  return mm / MM_PER_INCH
}

// 刻度生成：0..floor(trackPx/pxPerMm) mm，1mm 一格，5mm 半高、10mm 主刻度带 cm 标签
function buildTicks(trackPx, pxPerMm) {
  const totalMm = Math.floor(mmFromPx(trackPx, pxPerMm))
  const ticks = []
  for (let mm = 0; mm <= totalMm; mm++) {
    ticks.push({
      mm,
      x: pxFromMm(mm, pxPerMm),
      level: mm % 10 === 0 ? 'cm' : (mm % 5 === 0 ? 'half' : 'mm'),
      label: mm % 10 === 0 ? String(mm / 10) : ''
    })
  }
  return ticks
}

// 机型预设：pxPerMm = 官方PPI ÷ (25.4 × DPR)；有源显示区宽 = 物理宽 ÷ PPI × 25.4
// 口径两源交叉：CSS 视口/DPR 取 yesviz + blisk 设备库，分辨率/PPI 取厂商官方规格页
const DEVICE_PRESETS = [
  { id: 'iphone-se', name: 'iPhone SE 2/3（4.7″）', cssWidth: 375, dpr: 2, ppi: 326, bodyWmm: 67.3 },
  { id: 'iphone-13-14', name: 'iPhone 13 / 14（6.1″）', cssWidth: 390, dpr: 3, ppi: 460, bodyWmm: 71.5 },
  { id: 'iphone-15-pro', name: 'iPhone 15 / 15 Pro（6.1″）', cssWidth: 393, dpr: 3, ppi: 460, bodyWmm: 70.6 },
  { id: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max（6.7″）', cssWidth: 430, dpr: 3, ppi: 460, bodyWmm: 76.7 },
  { id: 'galaxy-s24', name: '三星 Galaxy S24（6.2″）', cssWidth: 360, dpr: 3, ppi: 416, bodyWmm: 70.6 },
  { id: 'pixel-8', name: 'Google Pixel 8（6.2″）', cssWidth: 412, dpr: 2.625, ppi: 428, bodyWmm: 70.8 }
]

function pxPerMmForDevice(p) {
  if (!p || !(p.ppi > 0) || !(p.dpr > 0)) return DEFAULT_PX_PER_MM
  return p.ppi / (MM_PER_INCH * p.dpr)
}
function deviceScreenWmm(p) {
  if (!p || !(p.ppi > 0)) return 0
  return (p.cssWidth * p.dpr) / p.ppi * MM_PER_INCH
}

// 校准值合法性：真实屏幕落在 ~1.5（超大屏）..~12（超清小屏）px/mm 之间
function sanitizePxPerMm(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return DEFAULT_PX_PER_MM
  return Math.min(40, Math.max(1, n))
}

// ---------- 状态 ----------
const STORAGE_KEY = 'online-ruler-calibration-v1'

const calTab = ref('card')
const calSource = ref('guess')       // guess | card | device | manual
const pxPerMm = ref(DEFAULT_PX_PER_MM)

const cardSliderPx = ref(300)
const deviceKey = ref('iphone-15-pro')
const manualPxPerMm = ref(96 / 25.4)

// 直尺区
const trackEl = ref(null)
const trackWidthPx = ref(0)          // 0 = SSR/未测量，渲染静态占位
const handleA = ref(40)
const handleB = ref(200)
let dragWhich = null
let trackRect = null

// ---------- 计算属性 ----------
const pxPerMmText = computed(() => pxPerMm.value.toFixed(4).replace(/0+$/, '').replace(/\.$/, ''))
const sourceLabel = computed(() => ({ card: '银行卡', device: '机型预设', manual: '手动', guess: '估算' }[calSource.value] || ''))

const cardPxPerMm = computed(() => sanitizePxPerMm(pxPerMmFromCard(cardSliderPx.value)).toFixed(4))
const cardPpi = computed(() => ppiFromCard(cardSliderPx.value).toFixed(1))
const cardPreviewHeight = computed(() => Math.round(cardSliderPx.value / 85.6 * 53.98))

const devicePreset = computed(() => DEVICE_PRESETS.find((d) => d.id === deviceKey.value) || DEVICE_PRESETS[2])
const devicePxPerMm = computed(() => pxPerMmForDevice(devicePreset.value).toFixed(4))
const deviceDetailLines = computed(() => {
  const d = devicePreset.value
  const wmm = deviceScreenWmm(d)
  return [
    `CSS 视口 ${d.cssWidth} px × DPR ${d.dpr} → 物理 ${Math.round(d.cssWidth * d.dpr)} px`,
    `PPI ${d.ppi} → 有源显示区宽 ≈ ${wmm.toFixed(1)} mm`,
    `pxPerMm = ${d.ppi} ÷ (25.4×${d.dpr}) = ${pxPerMmForDevice(d).toFixed(4)}`,
    `（机身宽 ${d.bodyWmm}mm 含边框，仅参考不能当显示区用）`
  ]
})

const ticks = computed(() => (trackWidthPx.value > 0 ? buildTicks(trackWidthPx.value, pxPerMm.value) : []))
const cmLabeledTicks = computed(() => ticks.value.filter((t) => t.level === 'cm'))

const handleDefs = computed(() => [
  { key: 'a', pos: handleA.value },
  { key: 'b', pos: handleB.value }
])

const measurePx = computed(() => Math.abs(handleB.value - handleA.value))
const measureLeft = computed(() => Math.min(handleA.value, handleB.value))
const measureMm = computed(() => mmFromPx(measurePx.value, pxPerMm.value))
const measureCm = computed(() => measureMm.value / 10)
const measureInch = computed(() => inchFromMm(measureMm.value))

// ---------- 校准动作 ----------
function confirmCardCalibration() {
  pxPerMm.value = sanitizePxPerMm(pxPerMmFromCard(cardSliderPx.value))
  calSource.value = 'card'
  saveCalibration()
}
function confirmDeviceCalibration() {
  pxPerMm.value = sanitizePxPerMm(pxPerMmForDevice(devicePreset.value))
  calSource.value = 'device'
  saveCalibration()
}
function confirmManualCalibration() {
  pxPerMm.value = sanitizePxPerMm(manualPxPerMm.value)
  calSource.value = 'manual'
  saveCalibration()
}
function resetCalibration() {
  pxPerMm.value = DEFAULT_PX_PER_MM
  calSource.value = 'guess'
  saveCalibration()
}

function saveCalibration() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pxPerMm: pxPerMm.value, source: calSource.value }))
  } catch (err) { /* 隐私模式下 localStorage 可能不可用，忽略 */ }
}
function loadCalibration() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (saved && Number.isFinite(Number(saved.pxPerMm))) {
      pxPerMm.value = sanitizePxPerMm(saved.pxPerMm)
      calSource.value = ['card', 'device', 'manual'].includes(saved.source) ? saved.source : 'guess'
    }
  } catch (err) { /* 损坏数据直接忽略，回到默认估算 */ }
}

// ---------- 把手拖动（pointer events，仅交互期间挂监听） ----------
function onHandleDown(evt, which) {
  dragWhich = which
  const el = trackEl.value
  trackRect = el ? el.getBoundingClientRect() : null
  window.addEventListener('pointermove', onHandleMove)
  window.addEventListener('pointerup', onHandleUp)
}
function onHandleMove(evt) {
  if (!dragWhich || !trackRect) return
  const x = Math.min(Math.max(evt.clientX - trackRect.left, 0), trackRect.width)
  if (dragWhich === 'a') handleA.value = x
  else handleB.value = x
}
function onHandleUp() {
  dragWhich = null
  trackRect = null
  window.removeEventListener('pointermove', onHandleMove)
  window.removeEventListener('pointerup', onHandleUp)
}

// ---------- 复制读数（clipboard + alert） ----------
async function copyMeasure() {
  const text = `A→B：${measureMm.value.toFixed(1)} mm（${measureCm.value.toFixed(2)} cm / ${measureInch.value.toFixed(2)} in / ${measurePx.value} px），校准 ${pxPerMmText.value} px/mm — 屏幕尺子`
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
  } catch (err) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      alert('已复制')
    } catch (err2) { /* 复制彻底失败时静默 */ }
  }
}

// ---------- 生命周期 ----------
function measureTrack() {
  const el = trackEl.value
  if (el) {
    const w = el.getBoundingClientRect().width
    if (w > 0) {
      trackWidthPx.value = w
      // 把手默认位置贴在可用范围内（首次测量时）
      handleA.value = Math.min(handleA.value, w)
      handleB.value = Math.min(Math.max(handleB.value, handleA.value + 20), w)
    }
  }
}
function handleResize() {
  measureTrack()
}

onMounted(() => {
  addRecentTool('online-ruler')
  loadCalibration()
  measureTrack()
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('pointermove', onHandleMove)
  window.removeEventListener('pointerup', onHandleUp)
})
</script>
