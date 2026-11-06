<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Compass class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">角度弧度换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">度 °、弧度 rad、梯度 gon、角分 ′、角秒 ″、转 rev 六向精确换算，附度分秒（DMS）合成面板</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线角度单位换算工具：以度（°）为基准的精确系数（180° = π rad、1° = π/180 ≈ 0.017453293 rad、1 gon = 0.9°（400 gon 等于一个圆周，测绘口径）、
        1° = 60′ = 3600″、1 rev = 360°），任一单位输入、其余五个联动更新；
        独立「度分秒 DMS」小面板把 °/′/″ 三段输入合成为小数度（测绘、天文常用，六十进制一键转小数），并给出当前主换算值的 DMS 反解显示；
        附 °↔rad 一键互换、特殊角速查卡，以及直角/平角/圆周与 30/45/60/90° 特殊角的度-弧度-gon-转对照表（点行即载入换算）。
        弧度和度怎么换、gon 是什么单位、角分角秒有多小，见下方说明。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Compass class="w-5 h-5 mr-2 text-primary" /> 输入角度
        </h2>

        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="u in UNITS"
            :key="u.id"
            @click="inputUnit = u.id"
            class="px-1 py-2 rounded-lg border text-[11px] font-semibold transition"
            :class="inputUnit === u.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
            :title="u.name"
          >
            {{ u.symbol }}
          </button>
        </div>

        <div>
          <input
            v-model="inputValue"
            type="number"
            step="any"
            placeholder="如 180，可为负数"
            class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p class="text-[10px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>输入以当前所选单位计，可为负数（如方位角、旋转角）；弧度以 rad 计（π rad = 180°）。</span>
          </p>
        </div>

        <p v-if="parsed === null" class="text-xs text-muted-foreground p-2.5 rounded bg-muted/40">
          请输入数值（可为负数），六单位换算结果将实时联动。
        </p>

        <div class="flex flex-wrap gap-2">
          <button
            @click="swapUnits"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition flex items-center gap-1.5"
          >
            <ArrowLeftRight class="w-3 h-3" /> 互换 {{ currentUnit.symbol }} ⇄ {{ swapTargetUnit.symbol }}
          </button>
          <button
            @click="applyPreset(180, 'deg')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 180°
          </button>
          <button
            @click="applyPreset(90, 'deg')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 90°
          </button>
          <button
            @click="applyPreset(1, 'rad')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 1 rad
          </button>
          <button
            @click="resetInput"
            class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition"
          >
            <RefreshCw class="w-3 h-3 inline mr-1 -mt-0.5" /> 清空
          </button>
        </div>

        <!-- 常用速查卡 -->
        <div class="border-t border-border pt-4">
          <p class="text-sm font-medium text-foreground mb-2">特殊角度速查（° → rad，点击载入）</p>
          <div class="grid grid-cols-1 gap-1.5">
            <button
              v-for="q in quickDegTable"
              :key="'q' + q.deg"
              @click="applyPreset(q.deg, 'deg')"
              class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition text-center"
            >
              {{ q.deg }}° = {{ q.radText }} rad
            </button>
          </div>
        </div>
      </div>

      <!-- 结果大表（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Compass class="w-5 h-5 mr-2 text-primary" /> 六单位换算结果
            </h2>
            <button
              @click="copyResults"
              :disabled="!canCopy"
              class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <CheckCircle v-if="copied" class="w-3.5 h-3.5 text-green-500" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copied ? '已复制' : '复制结果' }}
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              v-for="r in resultRows"
              :key="r.id"
              class="flex items-center justify-between px-4 py-3 rounded-lg border"
              :class="r.id === inputUnit ? 'bg-primary/10 border-primary/40' : 'bg-muted/40 border-border'"
            >
              <div>
                <p class="text-sm font-semibold text-foreground">{{ r.symbol }}
                  <span v-if="r.id === inputUnit" class="ml-1.5 text-[10px] font-normal text-primary">当前输入单位</span>
                </p>
                <p class="text-[11px] text-muted-foreground">{{ r.name }}（{{ r.systemLabel }}）</p>
              </div>
              <p class="text-2xl font-bold font-mono" :class="r.id === inputUnit ? 'text-primary' : 'text-foreground'">
                {{ r.value === null ? '—' : fmtAngle(r.value) }}
              </p>
            </div>
          </div>

          <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
            因子：180° = π rad = 0.5 rev = 200 gon；1° = π/180 ≈ 0.017453293 rad；1° = 60′ = 3600″；1 gon = 0.9°；
            1″ ≈ 4.848137×10⁻⁶ rad；1 rad = 180/π ≈ 57.295779513°。
            锚点：180° = 3.141592654 rad；1′ = 0.0166667°；90° = 100 gon。
          </p>
        </div>

        <!-- 度分秒（DMS）合成小面板 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Compass class="w-5 h-5 mr-2 text-primary" /> 度分秒（DMS）⇄ 小数度
          </h2>
          <p class="text-xs text-muted-foreground mb-4">测绘（全站仪/RTK 成果）与天文坐标惯用六十进制度分秒：1° = 60′，1′ = 60″。三段输入合成小数度，负角符号写在度上（−5°30′ = −5.5°）。</p>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <label class="block">
              <span class="text-xs text-muted-foreground">度（°，可负）</span>
              <input
                v-model="dmsDeg"
                type="number"
                step="any"
                placeholder="如 30"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="block">
              <span class="text-xs text-muted-foreground">分（′，0-59）</span>
              <input
                v-model="dmsMin"
                type="number"
                min="0"
                max="59"
                step="any"
                placeholder="如 30"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="block">
              <span class="text-xs text-muted-foreground">秒（″，0-59.99）</span>
              <input
                v-model="dmsSec"
                type="number"
                min="0"
                max="59.99"
                step="any"
                placeholder="如 0"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">合成小数度</p>
              <p class="text-2xl font-bold text-primary font-mono">{{ dmsCombinedText }}</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 mb-3">
            <button
              @click="loadDms"
              :disabled="!dmsValid"
              class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 载入主换算
            </button>
            <button
              @click="resetDms"
              class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition"
            >
              <RefreshCw class="w-3 h-3 inline mr-1 -mt-0.5" /> 清空 DMS
            </button>
            <span class="text-xs text-muted-foreground font-mono">{{ dmsReverseLine }}</span>
          </div>

          <p class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>分、秒是六十进制不是小数：30.5° ≠ 30°30′ 的「30.30」。反解方向同理——小数度乘 60 取整得分，余数再乘 60 得秒。GPS 输出多为小数度，地图/图纸标注多为 DMS，录入时务必确认口径。</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 页面说明条 -->
    <div class="bg-muted/40 border border-border rounded-lg px-4 py-3 mb-6 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        为什么有这么多角度单位：度源于古巴比伦六十进制（把圆分成 360 份，与一年约 360 天的天文历法传统相关）；
        弧度 rad 是 SI 导出单位（弧长 ÷ 半径，无量纲量），是数学、物理与编程语言（Math.sin 等）唯一自然的选择；
        梯度 gon 把圆分成 400 份、直角恰为 100 gon，欧洲大陆测绘工程惯用；角分/角秒用于天文与测绘的精细刻画（人眼分辨率约 1′，满月视直径约 31′）。
      </p>
    </div>

    <!-- 常见角度对照表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Compass class="w-5 h-5 mr-2 text-primary" /> 常见角度对照（点击行载入换算）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">弧度/gon/转列由度列按精确公式自动换算；特殊角的三角函数值按弧度制计算最简洁。</p>

      <div class="overflow-x-auto">
        <div class="min-w-[720px]">
          <div class="grid grid-cols-[1fr_0.8fr_1.2fr_0.8fr_0.8fr_1.8fr] gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground border-b border-border">
            <span>角度</span><span>度 °</span><span>弧度 rad</span><span>gon</span><span>转 rev</span><span>说明</span>
          </div>
          <button
            v-for="row in milestoneRows"
            :key="row.name"
            @click="loadMilestone(row)"
            class="w-full grid grid-cols-[1fr_0.8fr_1.2fr_0.8fr_0.8fr_1.8fr] gap-2 px-3 py-2.5 text-left text-xs border-b border-border/60 hover:bg-primary/5 transition items-center"
          >
            <span class="font-medium text-foreground">{{ row.name }}</span>
            <span class="font-mono text-foreground">{{ row.degText }}</span>
            <span class="font-mono text-foreground">{{ row.radText }}</span>
            <span class="font-mono text-muted-foreground">{{ row.gonText }}</span>
            <span class="font-mono text-muted-foreground">{{ row.revText }}</span>
            <span class="text-muted-foreground leading-snug">{{ row.note }}</span>
          </button>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>度、弧度、梯度（gon）都是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          度（°）把一个圆周分成 360 份，源自古巴比伦六十进制传统，几何、导航、日常最通用；
          弧度（rad）定义为「弧长 ÷ 半径」——1 rad 的圆弧长度恰好等于半径，是无量纲的 SI 导出单位，
          一个圆周 = 2π rad，数学物理的标准口径；
          梯度（gon，也叫哥恩/百分度）把圆周分成 400 份，直角恰好 100 gon，法国大革命时期随十进制化运动推出，欧洲大陆测绘惯用；
          角分（′）与角秒（″）是度的六十进制细分（1° = 60′ = 3600″），用于天文与高精度测量；
          转（rev，revolution）就是「圈」，机械转速与旋转编码器常用。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">弧度和度怎么换算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          记住一个锚点即可推出全部公式：180° = π rad。
          所以 1° = π/180 ≈ 0.017453293 rad（度转弧度：乘 π/180），1 rad = 180/π ≈ 57.295779513°（弧度转度：乘 180/π）。
          常用特殊角建议直接背弧度值：30° = π/6、45° = π/4、60° = π/3、90° = π/2、180° = π、360° = 2π。
          为什么数学一律用弧度？因为弧度下 sin x ≈ x（小角近似才成立）、d(sin x)/dx = cos x 等微积分公式才不带修正系数，
          编程语言 Math.sin() 接受的也是弧度——把 30 当弧度传进去是新手最常见的 bug。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">gon 是什么单位？为什么测绘用 400 gon 等于一个圆？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          gon（梯度，grade/gon，工程续标 g）= 一个圆周的 1/400，即 1 gon = 0.9°、直角 = 100 gon、1° ≈ 1.111 gon。
          好处全在十进制：直角整 100，测回记录与「百分之几的坡度」换算直观（100 gon 附近 1 gon ≈ 1.57% 坡度），
          德国、瑞士、法国、北欧的全站仪与地籍测量至今默认 gon 制。
          注意区分：英文 grade 有时也指百分度（直角 = 100 grades）与 gon 同义，但不要与「坡度百分比」混淆。
          中国测绘规范以 360° 制为主，读取欧洲进口仪器成果时需按 1 gon = 0.9° 换算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">角分、角秒有多小？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          1° = 60′（角分）= 3600″（角秒）；1′ = 1/60° ≈ 0.0166667°，1″ = 1/3600° ≈ 4.848137×10⁻⁶ rad。
          直观尺度：人眼分辨率约 1′，满月视直径约 31′（半度多一点）；
          在地球表面，1″ 的经度弧长在中纬度约 20-30 m（赤道上 1″ 经度 ≈ 30.9 m）——这就是 GPS/全站仪测角精度以秒计的原因。
          天文上视差用角秒（1 秒差距 = 视差 1″ 对应的距离），望远镜分辨率同样以角秒衡量。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">1 度等于多少弧度？</h3>
            <p class="text-sm text-muted-foreground mt-1">1° = π/180 ≈ 0.017453293 rad；反过来 1 rad = 180/π ≈ 57.295779513°。核心锚点：180° = π rad = 3.141592654 rad。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">90 度是多少 gon、多少转？</h3>
            <p class="text-sm text-muted-foreground mt-1">90° = 100 gon（直角，gon 制的基准点）= 0.25 rev（四分之一圈）。一个圆周 = 360° = 400 gon = 1 rev = 2π rad。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">度分秒 30°30′0″ 等于多少小数度？</h3>
            <p class="text-sm text-muted-foreground mt-1">30 + 30/60 + 0/3600 = 30.5°。分除以 60、秒除以 3600 后相加；反解时小数部分乘 60 得分、余数再乘 60 得秒。用上方 DMS 面板可直接合成与反解。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">换算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有角度换算与 DMS 合成都在你的浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="TOOL_ID" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Compass, ArrowLeftRight, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'angle-unit-converter'

// ---------- SEO ----------
useSeoMeta({
  title: '角度弧度换算 - 度/弧度/梯度gon/角分角秒在线换算工具（°/rad）',
  description: '免费在线角度单位换算：度、弧度、梯度（gon）、角分、角秒、转六向精确互转（180°=π rad、1°=0.017453293 rad、1 gon=0.9°），附度分秒 DMS 三段输入合成小数度面板、30/45/60/90° 特殊角对照表与弧度制科普，纯浏览器本地运行不上传',
  keywords: '角度弧度换算,度转弧度,弧度转度,gon梯度单位,角分角秒换算,dms转换,角度单位换算器',
  author: '有条工具',
  ogTitle: '角度弧度换算 - 度/弧度/梯度/角分角秒在线换算工具 | 有条工具',
  ogDescription: '六角度单位精确互转，度分秒 DMS 合成面板，特殊角对照表，纯本地换算。',
  ogUrl: 'https://www.util.cn/tools/angle-unit-converter',
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
          name: '角度弧度换算器',
          url: 'https://www.util.cn/tools/angle-unit-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['度 °/弧度 rad/梯度 gon/角分 ′/角秒 ″/转 rev 六向精确互转', '精确因子 180°=π rad、1 gon=0.9°、1°=60′=3600″', '度分秒 DMS 三段输入合成小数度（测绘/天文口径）', '当前值 DMS 反解显示', '直角/平角/圆周与特殊角 30/45/60/90° 对照表', '°↔rad 一键互换', '结果一键复制', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '角度弧度换算器', item: 'https://www.util.cn/tools/angle-unit-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1 度等于多少弧度？',
              acceptedAnswer: { '@type': 'Answer', text: '1° = π/180 ≈ 0.017453293 rad；1 rad = 180/π ≈ 57.295779513°。核心锚点：180° = π rad。' }
            },
            {
              '@type': 'Question',
              name: '90 度是多少 gon、多少转？',
              acceptedAnswer: { '@type': 'Answer', text: '90° = 100 gon（直角，gon 制基准）= 0.25 rev。一个圆周 = 360° = 400 gon = 1 rev = 2π rad。' }
            },
            {
              '@type': 'Question',
              name: '度分秒 30°30′0″ 等于多少小数度？',
              acceptedAnswer: { '@type': 'Answer', text: '30 + 30/60 + 0/3600 = 30.5°。分除以 60、秒除以 3600 后相加；反解方向相反。分秒是六十进制不是小数。' }
            },
            {
              '@type': 'Question',
              name: '换算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有角度换算与 DMS 合成都在浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- PURE-FNS-START ----------
// 换算系数以度（°）为基准：DEG_PER[unit] = 该单位 1 份对应多少度
const DEG_PER = {
  deg: 1,               // 度
  rad: 180 / Math.PI,   // 弧度（180° = π rad）
  gon: 0.9,             // 梯度（400 gon/圆，测绘口径，1 gon = 0.9°）
  arcmin: 1 / 60,       // 角分（1° = 60′）
  arcsec: 1 / 3600,     // 角秒（1° = 3600″）
  rev: 360              // 转（1 rev = 360°）
}

const UNITS = [
  { id: 'deg', symbol: '°', name: '度', systemLabel: '几何·导航通用' },
  { id: 'rad', symbol: 'rad', name: '弧度', systemLabel: 'SI·数学物理' },
  { id: 'gon', symbol: 'gon', name: '梯度（哥恩）', systemLabel: '欧洲测绘工程' },
  { id: 'arcmin', symbol: '′', name: '角分', systemLabel: '天文·测量细分' },
  { id: 'arcsec', symbol: '″', name: '角秒', systemLabel: '天文·高精度测量' },
  { id: 'rev', symbol: 'rev', name: '转（圈）', systemLabel: '机械·旋转' }
]

// 浮点尾差清洗：按 12 位有效数字截断；若与更低有效位的舍入值仅差相对 1e-9 以内则吸附，
// 使往返换算（如 °→rad→°）精确回到原值
function cleanFloat(v, sig = 12) {
  if (!Number.isFinite(v)) return NaN
  if (v === 0) return 0
  for (const s of [6, 8, 10]) {
    const cand = Number(v.toPrecision(s))
    if (cand !== 0 && Math.abs(v - cand) / Math.abs(v) < 1e-9) return cand
  }
  return Number(v.toPrecision(sig))
}

// 任意单位 → 度
function toDeg(value, unitId) {
  const k = DEG_PER[unitId]
  if (!Number.isFinite(value) || typeof k !== 'number') return NaN
  return cleanFloat(value * k)
}

// 度 → 任意单位
function fromDeg(deg, unitId) {
  const k = DEG_PER[unitId]
  if (!Number.isFinite(deg) || typeof k !== 'number') return NaN
  return cleanFloat(deg / k)
}

// 通用换算：value 按 fromId 输入，结果按 toId 表达
function convertAngle(value, fromId, toId) {
  return fromDeg(toDeg(value, fromId), toId)
}

// 输入解析：空串/非数字视为无效；角度可为负（方位角、旋转角）
function parseAngleInput(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

// 展示格式化：|v|<1000 用 9 位小数去尾零（保住 0.017453293 级精度），
// 更大用 4 位小数；极小（< 10⁻⁴，如角秒转弧度）用科学计数
function fmtAngle(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  const a = Math.abs(v)
  if (a < 1e-4 || a >= 1e15) {
    let s = v.toExponential(6)
    s = s.replace(/(\.\d*?)0+e/, '$1e').replace(/\.e/, 'e')
    return s
  }
  const d = a >= 1000 ? 4 : 9
  const s = v.toFixed(d)
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s
}

// 互换/预设载入时回填输入框的紧凑字符串（10 位有效数字）
function toInputString(v) {
  if (!Number.isFinite(v)) return ''
  return String(Number(v.toPrecision(10)))
}

// 度分秒（DMS）三段合成小数度：度 + 分/60 + 秒/3600
// 符号由第一个非零段决定（−5°30′ = −5.5°；0°0′−30″ = −0.008333°）
function composeDms(d, m, s) {
  if (d === null || m === null || s === null) return NaN
  const parts = [d, m, s]
  let sign = 1
  for (const p of parts) {
    if (p !== 0) { sign = p < 0 ? -1 : 1; break }
  }
  return cleanFloat(sign * (Math.abs(d) + Math.abs(m) / 60 + Math.abs(s) / 3600))
}

// 小数度 → DMS 反解（秒保留 2 位小数，自动处理 60 进位）
function decimalToDmsParts(x) {
  if (!Number.isFinite(x)) return null
  const sign = x < 0 ? -1 : 1
  const a = Math.abs(x)
  let d = Math.floor(a)
  const mFloat = (a - d) * 60
  let m = Math.floor(mFloat)
  let s = Math.round((mFloat - m) * 60 * 100) / 100
  if (s >= 60) { s -= 60; m += 1 }
  if (m >= 60) { m -= 60; d += 1 }
  return { sign, d, m, s }
}

// DMS 展示串：如 "30° 30′ 0″"
function dmsText(x) {
  const p = decimalToDmsParts(x)
  if (!p) return '—'
  const sText = p.s % 1 === 0 ? String(p.s) : p.s.toFixed(2)
  return `${p.sign < 0 ? '−' : ''}${p.d}° ${p.m}′ ${sText}″`
}

// 常见角度（度基准）
const ANGLE_MILESTONES = [
  { name: '直角', deg: 90, note: 'π/2 rad = 100 gon = 0.25 rev，gon 制的基准点' },
  { name: '平角', deg: 180, note: 'π rad = 200 gon = 0.5 rev，度↔弧度换算的核心锚点' },
  { name: '圆周角', deg: 360, note: '2π rad = 400 gon = 1 rev，一个完整圆周' },
  { name: '特殊角 30°', deg: 30, note: 'π/6 rad，sin 30° = 1/2' },
  { name: '特殊角 45°', deg: 45, note: 'π/4 rad，tan 45° = 1' },
  { name: '特殊角 60°', deg: 60, note: 'π/3 rad，sin 60° = √3/2' }
]
// ---------- PURE-FNS-END ----------

// ---------- 换算状态 ----------
const SWAP_PAIR = { deg: 'rad', rad: 'deg', arcmin: 'arcsec', arcsec: 'arcmin', gon: 'rev', rev: 'gon' }

const inputUnit = ref('deg')
const inputValue = ref('180')

function unitById(id) {
  return UNITS.find((u) => u.id === id) || null
}

const currentUnit = computed(() => unitById(inputUnit.value) || UNITS[0])
const swapTargetUnit = computed(() => unitById(SWAP_PAIR[inputUnit.value]) || UNITS[1])

const parsed = computed(() => parseAngleInput(inputValue.value))
const degValue = computed(() => (parsed.value === null ? NaN : toDeg(parsed.value, inputUnit.value)))

const resultRows = computed(() =>
  UNITS.map((u) => ({ ...u, value: parsed.value === null ? null : fromDeg(degValue.value, u.id) }))
)
const canCopy = computed(() => parsed.value !== null)

// 当前主换算值的 DMS 反解行
const dmsReverseLine = computed(() => {
  if (parsed.value === null) return '当前值反解：—'
  return `当前主换算值反解：${fmtAngle(degValue.value)}° = ${dmsText(degValue.value)}`
})

const copyText = computed(() => {
  if (parsed.value === null) return ''
  const lines = resultRows.value.map((r) => `${r.symbol}: ${fmtAngle(r.value)}`)
  return [`输入: ${fmtAngle(parsed.value)} ${currentUnit.value.symbol}（DMS: ${dmsText(degValue.value)}）`, ...lines].join('\n')
})

function applyPreset(value, unitId) {
  inputUnit.value = unitId
  inputValue.value = String(value)
  trackEvent('工具结果', '载入示例', TOOL_ID)
}

function loadMilestone(row) {
  applyPreset(row.deg, 'deg')
}

function swapUnits() {
  const target = SWAP_PAIR[inputUnit.value]
  if (!target) return
  if (parsed.value !== null) {
    const converted = convertAngle(parsed.value, inputUnit.value, target)
    if (Number.isFinite(converted)) inputValue.value = toInputString(converted)
  }
  inputUnit.value = target
  trackEvent('工具使用', '互换单位', TOOL_ID)
}

function resetInput() {
  inputValue.value = ''
  copied.value = false
}

// ---------- DMS 面板状态 ----------
const dmsDeg = ref('30')
const dmsMin = ref('30')
const dmsSec = ref('0')

function parseDmsField(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

const dmsCombined = computed(() => composeDms(parseDmsField(dmsDeg.value), parseDmsField(dmsMin.value), parseDmsField(dmsSec.value)))
const dmsValid = computed(() => Number.isFinite(dmsCombined.value))
const dmsCombinedText = computed(() => (dmsValid.value ? fmtAngle(dmsCombined.value) : '—'))

function loadDms() {
  if (!dmsValid.value) return
  inputUnit.value = 'deg'
  inputValue.value = toInputString(dmsCombined.value)
  trackEvent('工具结果', '载入示例', TOOL_ID)
}

function resetDms() {
  dmsDeg.value = ''
  dmsMin.value = ''
  dmsSec.value = ''
}

// ---------- 静态表（纯常量派生，无浏览器 API） ----------
const quickDegTable = [30, 45, 60, 90, 180].map((deg) => ({
  deg,
  radText: fmtAngle(convertAngle(deg, 'deg', 'rad'))
}))

const milestoneRows = ANGLE_MILESTONES.map((m) => ({
  name: m.name,
  deg: m.deg,
  note: m.note,
  degText: fmtAngle(m.deg),
  radText: fmtAngle(convertAngle(m.deg, 'deg', 'rad')),
  gonText: fmtAngle(convertAngle(m.deg, 'deg', 'gon')),
  revText: fmtAngle(convertAngle(m.deg, 'deg', 'rev'))
}))

// ---------- 复制（浏览器 API 仅在回调中，SSR 安全） ----------
const copied = ref(false)
let copyTimer = null

async function copyResults() {
  if (!canCopy.value) return
  try {
    await navigator.clipboard.writeText(copyText.value)
    copied.value = true
    if (copyTimer !== null) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2000)
    trackEvent('工具结果', '复制', TOOL_ID)
  } catch (error) {
    console.error('复制失败:', error)
    copied.value = false
  }
}

// ---------- SEO 折叠 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 设置持久化（localStorage，键前缀用工具 id，仅 onMounted/交互回调触达） ----------
const SETTINGS_KEY = `${TOOL_ID}-settings`

function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (UNITS.some(u => u.id === s.inputUnit)) inputUnit.value = s.inputUnit
    if (typeof s.inputValue === 'string' && parseAngleInput(s.inputValue) !== null) inputValue.value = s.inputValue
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([inputUnit, inputValue], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      inputUnit: inputUnit.value,
      inputValue: inputValue.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})
</script>
