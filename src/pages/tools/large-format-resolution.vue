<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Printer class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">喷绘写真分辨率计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按幅面与观看距离推荐 DPI 档位，输出像素与文件大小一步算清，附喷绘机幅宽拼接提示</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线喷绘写真分辨率计算器：户外喷绘、室内写真、灯布、车贴该做多大分辨率？输入幅面宽高（m 或 mm）
        并选工艺类型，按行业通行经验档位推荐 DPI（户外喷绘 30~45dpi、室内写真 72~120dpi、近距离展示 150dpi，
        均为行业通行经验，以合作喷绘厂要求为准），即时换算输出像素（尺寸×39.3701×dpi）、
        未压缩文件大小（RGB×3 字节 / CMYK×4 字节提示），并按喷绘机常见 3.2m / 5m 幅宽、写真机 1.6m 幅宽
        给出是否需要拼接的提示。支持按视距反推 DPI（视距越远所需 DPI 越低）。
        全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Printer class="w-5 h-5 mr-2 text-primary" /> 幅面参数
        </h2>

        <!-- 宽高 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="lf-w" class="block text-sm font-medium text-foreground mb-1.5">画面宽度</label>
            <input
              id="lf-w"
              v-model.number="widthVal"
              type="number"
              min="0.01"
              step="any"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
          </div>
          <div>
            <label for="lf-h" class="block text-sm font-medium text-foreground mb-1.5">画面高度</label>
            <input
              id="lf-h"
              v-model.number="heightVal"
              type="number"
              min="0.01"
              step="any"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
          </div>
        </div>
        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">尺寸单位</p>
          <div class="grid grid-cols-2 gap-2" role="group" aria-label="尺寸单位">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border text-sm font-medium transition"
              :class="unit === 'm' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="unit = 'm'"
            >米（m）</button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border text-sm font-medium transition"
              :class="unit === 'mm' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="unit = 'mm'"
            >毫米（mm）</button>
          </div>
        </div>

        <!-- 快捷幅面 -->
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="p in PRESET_SIZES"
            :key="p.label"
            type="button"
            class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
            :class="unit === p.unit && widthVal === p.w && heightVal === p.h ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            @click="applyPreset(p)"
          >{{ p.label }}</button>
        </div>

        <!-- 工艺类型 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">工艺类型（推荐 DPI 档）</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <button
              v-for="t in PROCESS_TYPES"
              :key="t.id"
              type="button"
              class="px-2.5 py-1.5 rounded-md text-xs font-medium border transition text-left"
              :class="typeId === t.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="applyType(t)"
            >{{ t.name }}</button>
            <button
              type="button"
              class="px-2.5 py-1.5 rounded-md text-xs font-medium border transition text-left"
              :class="typeId === 'custom' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="typeId = 'custom'"
            >自定义 / 按视距</button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">{{ activeType ? activeType.note : CUSTOM_NOTE }}</p>
        </div>

        <!-- 自定义 DPI / 视距 -->
        <div v-if="typeId === 'custom'" class="border-t border-border pt-4 space-y-3">
          <div>
            <p class="text-sm font-medium text-foreground mb-1.5">推荐方式</p>
            <div class="grid grid-cols-2 gap-2" role="group" aria-label="推荐方式">
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg border text-sm font-medium transition"
                :class="customMode === 'dpi' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
                @click="customMode = 'dpi'"
              >直接填 DPI</button>
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg border text-sm font-medium transition"
                :class="customMode === 'dist' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
                @click="customMode = 'dist'"
              >按视距推荐</button>
            </div>
          </div>
          <div v-if="customMode === 'dpi'" class="flex items-center gap-2">
            <label for="lf-dpi" class="text-sm text-foreground">输出 DPI</label>
            <input
              id="lf-dpi"
              v-model.number="customDpi"
              type="number"
              min="5"
              max="1200"
              step="1"
              class="w-28 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
          </div>
          <div v-else class="flex items-center gap-2">
            <label for="lf-dist" class="text-sm text-foreground">观看视距</label>
            <input
              id="lf-dist"
              v-model.number="viewDist"
              type="number"
              min="0.1"
              step="0.1"
              class="w-28 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <span class="text-xs text-muted-foreground">米（视距越远 DPI 越低）</span>
          </div>
        </div>

        <button
          type="button"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          @click="resetAll"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认参数
        </button>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-4">
        <!-- 结果大卡 -->
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ScanLine class="w-5 h-5 mr-2 text-primary" /> 输出参数结果
          </h2>
          <div v-if="result" class="space-y-3">
            <div class="bg-muted/50 rounded-xl p-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <div>
                <p class="text-xs text-muted-foreground mb-1">输出像素（宽 × 高）</p>
                <p class="text-3xl lg:text-4xl font-bold text-primary font-mono leading-tight break-all">{{ result.pxW }} × {{ result.pxH }} px</p>
              </div>
              <div class="text-xs text-muted-foreground space-y-0.5">
                <p>{{ fmt(widthM) }} × {{ fmt(heightM) }} m @ {{ result.dpi }} dpi</p>
                <p>换算：像素 = 尺寸(m) × 39.3701(英寸/m) × dpi</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">未压缩文件大小（RGB·TIF）</p>
                <p class="text-xl font-bold text-foreground font-mono">{{ result.rgbText }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">像素 × 3 字节（R/G/B 各 8bit）</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">CMYK 口径提示</p>
                <p class="text-xl font-bold text-foreground font-mono">{{ result.cmykText }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">像素 × 4 字节（四色各 8bit）</p>
              </div>
            </div>
            <div class="p-3 rounded-lg bg-muted/40 border border-border text-xs text-foreground leading-relaxed flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>{{ result.widthNote }}</span>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>位图源文件按上述像素制作；矢量稿（AI/PDF）输出与分辨率无关，交给喷绘厂前按此像素检查置入的位图清晰度即可。文件过大时可按 1:2 尺寸做图、DPI 翻倍（等像素口径）。</span>
            </p>
            <button
              type="button"
              class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
              @click="copyResult"
            >
              <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制输出参数文本
            </button>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">参数无效</p>
              <p class="text-xs text-muted-foreground mt-1">宽、高需为大于 0 的数值；DPI 限 5~1200；视距需大于 0。</p>
            </div>
          </div>
        </div>

        <!-- 视距对照表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Eye class="w-5 h-5 mr-2 text-primary" /> 视距 → DPI 经验对照
          </h2>
          <p class="text-xs text-muted-foreground mb-3 leading-relaxed">行业通行经验：视距越远，所需 DPI 越低（人眼分辨角约 1 角分，画面越远细节越"看不出来"，不必堆像素）。</p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">观看视距</th>
                  <th class="py-2 pr-3 font-medium">推荐 DPI</th>
                  <th class="py-2 font-medium">典型应用</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in DIST_TABLE" :key="row.label" class="border-b border-border/60">
                  <td class="py-2 pr-3 text-foreground">{{ row.label }}</td>
                  <td class="py-2 pr-3 font-mono text-primary">{{ row.dpi }}</td>
                  <td class="py-2 text-muted-foreground text-xs">{{ row.use }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground mt-3">按视距自动推荐时，本页取各档经验中值。此表为行业通行经验整理，特殊工艺（UV 卷材、灯片等）以喷绘厂要求为准。</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-6" open>
      <summary class="text-base font-semibold text-foreground cursor-pointer select-none mb-4">DPI 档位依据、文件格式要求与常见问题</summary>

      <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>喷绘写真分辨率计算器是什么？</h2>
      <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
        大幅面输出（喷绘、写真、灯布、车贴）与印刷不同：画面是"看"的而不是"贴着读"的，分辨率要求远低于纸张印刷。
        本工具按幅面尺寸与观看距离，用行业通行经验档位推荐 DPI，并换算出该按多大像素做图、文件会多大，
        以及会不会超出喷绘机幅宽需要拼接。核心公式只有一条：<strong class="text-foreground">输出像素 = 尺寸(m) × 39.3701(英寸/m) × DPI</strong>，
        未压缩文件大小 ≈ 宽 × 高 像素 × 3 字节（RGB）或 × 4 字节（CMYK）。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么喷绘不用 300dpi？</h3>
      <p class="text-sm text-muted-foreground leading-relaxed">
        分辨率的需求取决于观看距离，而不是绝对尺寸。人眼在 1 角分（约 1/3438 弧度）的分辨极限下，
        视距 3m 时每英寸能分辨的像素只有 3438÷(3000/25.4)≈29 个——这就是户外喷绘 30dpi 左右就"够看"的物理来源；
        同理视距 1m 时约需 87dpi、0.5m 时约需 174dpi。纸张印刷按 40cm 视距设计才需要 300dpi。
        若给 6m 的楼顶大牌做成 300dpi，文件会膨胀到 70000×35000 像素（约 7GB），喷绘 RIP 根本吃不下，
        而路人 50m 外看到的清晰度和 35dpi 版毫无差别。通行经验档位：
        <strong class="text-foreground">户外喷绘 30~45dpi（视距>3m）、室内写真 72~120dpi（视距 1~3m）、近距离展示 150dpi（视距<1m）</strong>，
        视距越远所需 DPI 越低；以上为行业通行经验整理（多来源交叉核对），具体以合作喷绘厂要求为准。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">喷绘机幅宽与拼接</h3>
      <p class="text-sm text-muted-foreground leading-relaxed">
        户外喷绘机（溶剂/弱溶剂）常见最大幅宽 3.2m 与 5m 两档：画面宽度 ≤3.2m 用 3.2m 机一次出，
        3.2~5m 用 5m 机，超过 5m（如楼顶大牌、包围楼体）需分版拼接，设计时预留拼接缝并让相邻两版图案重叠 5~10cm 对花；
        室内写真机（水印/UV）常见幅宽 1.6m（部分 1.27m / 1.8m），超宽画面同样分版。
        拼接缝尽量落在深色或渐变区域，避开人脸、文字与直线图形。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">上喷绘机对文件格式的要求</h3>
      <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
        <li>位图交 TIF（RGB 或 CMYK、LZW 无损压缩），矢量稿交 AI / PDF（文字转曲），喷绘厂 RIP 普遍支持；JPG 压缩过狠会出马赛克，慎用。</li>
        <li>按 1:1 实际尺寸做图、DPI 按 30~45 / 72~120 设定；文件过大可 1:2 做图、DPI 翻倍（像素总量不变）。</li>
        <li>文字内容少的画面也可把文字层栅格化防缺字体；位图内嵌图层合并前留一份源文件。</li>
        <li>灯布/车贴类按喷绘厂给定的出血与收边要求多做画面（车贴还需留缝与包边位），重要文字同样远离收边。</li>
        <li>以上为通行惯例整理，各厂设备与 RIP 不同，下单前以合作喷绘厂要求为准。</li>
      </ul>

      <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-semibold text-foreground">6m × 3m 户外喷绘要做多大像素？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            按 35dpi：6m × 39.3701 × 35 ≈ 8268px，3m ≈ 4134px，即约 8268×4134 像素，
            RGB 未压缩约 97.8 MB（102,539,736 字节）。1:2 做图则 4134×2067 像素、DPI 等效 70，喷绘输出效果一致。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">室内写真背景墙用多少 DPI？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            视距 1~3m 的室内画面按 72~120dpi：如 3m×2m 背景墙 @100dpi 约 11811×7874 像素、RGB 约 267MB。
            客人会凑近看 0.5m 内的部位（如前台背景字）时，把那块内容按 150dpi 局部处理。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">按视距怎么反推 DPI？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            经验对照：<1m 取 150dpi；1~3m 取 72~120；3~6m 取 40~45；6~10m 取 30~35；10~20m 取 20~25；>20m 取 15~20。
            物理依据是人眼 1 角分分辨极限：DPI ≈ 25.4 × 3438 ÷ 视距(mm)，再按画面内容打折——文字为主取上限，氛围大图取下限。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">文件太大发不出去怎么办？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            三招：① TIF 用 LZW/ZIP 无损压缩（不减清晰度）；② 按 1:2 尺寸做图、DPI 翻倍；③ 矢量部分改交 AI/PDF，
            只有位图占体积。也可与喷绘厂确认是否收 JPG（质量 10~12 级），能缩小一个数量级。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">数据以什么为准？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            像素与文件大小由公式精确计算；DPI 档位与幅宽为行业通行经验整理（多来源交叉核对），
            各喷绘厂设备、RIP 与工艺不同，正式下单以合作喷绘厂要求为准。本页全部计算在浏览器本地完成，不上传数据。
          </p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'large-format-resolution'" :category="'design'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Printer, ScanLine, Info, CheckCircle, TriangleAlert, Copy, Eye, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '喷绘写真分辨率计算器 - 幅面尺寸→输出像素/DPI/文件大小 | 有条工具',
  description: '免费在线喷绘写真分辨率计算器：输入幅面宽高（m/mm）与工艺类型（户外喷绘/室内写真/灯布/车贴），按行业通行 DPI 档位推荐分辨率，即时算输出像素（尺寸×39.3701×dpi）与未压缩文件大小（RGB/CMYK），附 3.2m/5m 幅宽拼接提示与视距对照表，纯浏览器本地计算',
  keywords: '喷绘分辨率多少合适,写真喷绘DPI计算,喷绘输出像素计算,广告画面分辨率,户外喷绘分辨率',
  author: '有条工具',
  ogTitle: '喷绘写真分辨率计算器 - 幅面→像素/DPI/文件大小 | 有条工具',
  ogDescription: '按视距推荐 DPI 档位，幅面尺寸换算输出像素与文件大小，喷绘机幅宽拼接提示一步到位。',
  ogUrl: 'https://www.util.cn/tools/large-format-resolution',
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
          name: '喷绘写真分辨率计算器',
          url: 'https://www.util.cn/tools/large-format-resolution',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '户外喷绘/室内写真/灯布/车贴 DPI 经验档位推荐',
            '米/毫米输入与常见幅面快捷预设',
            '输出像素换算（尺寸×39.3701×dpi）',
            '未压缩文件大小估算（RGB×3 / CMYK×4 字节）',
            '喷绘机 3.2m/5m、写真机 1.6m 幅宽拼接提示',
            '按视距反推 DPI（视距越远 DPI 越低）',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '设计工具', item: 'https://www.util.cn/design/' },
            { '@type': 'ListItem', position: 3, name: '喷绘写真分辨率计算器', item: 'https://www.util.cn/tools/large-format-resolution' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '6m × 3m 户外喷绘要做多大像素？',
              acceptedAnswer: { '@type': 'Answer', text: '按 35dpi：6m×39.3701×35≈8268px，3m≈4134px，约 8268×4134 像素，RGB 未压缩约 97.8MB。可按 1:2 尺寸做图、DPI 翻倍，像素总量不变。' }
            },
            {
              '@type': 'Question',
              name: '为什么喷绘不用 300dpi？',
              acceptedAnswer: { '@type': 'Answer', text: '分辨率需求取决于观看距离：人眼 1 角分分辨极限下，视距 3m 只需约 30dpi、1m 约 87dpi。纸张印刷按 40cm 视距才需要 300dpi；户外大牌做成 300dpi 文件巨大且没有观感差别。' }
            },
            {
              '@type': 'Question',
              name: '室内写真背景墙用多少 DPI？',
              acceptedAnswer: { '@type': 'Answer', text: '视距 1~3m 按 72~120dpi，如 3m×2m 背景 @100dpi 约 11811×7874 像素；会凑近看的局部按 150dpi 处理。' }
            },
            {
              '@type': 'Question',
              name: '喷绘文件交什么格式？',
              acceptedAnswer: { '@type': 'Answer', text: '位图交 TIF（LZW 无损压缩），矢量稿交 AI/PDF（文字转曲）；按 1:1 尺寸与 30~45/72~120dpi 设定，文件过大可 1:2 做图 DPI 翻倍，具体以喷绘厂要求为准。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 单位约定：幅面 m/mm，DPI 像素/英寸。核心公式：像素 = 尺寸(m) × 39.3701 × dpi；
// 文件字节 = 像素 × 3（RGB）或 × 4（CMYK）。DPI 档位为行业通行经验（多来源交叉核对）。
/* TESTABLE-START */
const MM_PER_M = 1000
const INCH_PER_M = 39.3701

// 工艺类型与 DPI 档（下限/默认/上限）
const PROCESS_TYPE_DEFS = [
  { id: 'outdoor', name: '户外喷绘', dpiMin: 30, dpi: 35, dpiMax: 45, note: '户外喷绘通行 30~45dpi（视距>3m）；默认取 35。喷绘机常见幅宽 3.2m / 5m。' },
  { id: 'indoor', name: '室内写真', dpiMin: 72, dpi: 100, dpiMax: 120, note: '室内写真通行 72~120dpi（视距 1~3m）；默认取 100。写真机常见幅宽 1.6m。' },
  { id: 'lightbox', name: '灯布', dpiMin: 25, dpi: 35, dpiMax: 45, note: '灯布/楼顶大牌视距远，通行 25~45dpi；按喷绘口径执行，注意布基透光会吃细节。' },
  { id: 'car', name: '车贴', dpiMin: 100, dpi: 120, dpiMax: 150, note: '车贴近距离观看，通行 100~150dpi；小字与贴缝细节按 150 准备。' }
]

// 视距（m）→ 经验 DPI（档位中值）；越远越低
function dpiFromDistance(d) {
  const x = Number(d)
  if (!Number.isFinite(x) || x <= 0) return null
  if (x < 1) return 150
  if (x < 3) return 100
  if (x < 6) return 42
  if (x < 10) return 35
  if (x < 20) return 25
  return 18
}

// 尺寸换算：按单位折算为米；非法返回 null
function toMeters(w, h, unit) {
  const W = Number(w), H = Number(h)
  if (!Number.isFinite(W) || !Number.isFinite(H) || W <= 0 || H <= 0) return null
  const f = unit === 'mm' ? 1 / MM_PER_M : 1
  return { wM: W * f, hM: H * f }
}

// 像素换算：米 → 英寸 × dpi，四舍五入；dpi 超 5~1200 返回 null
function pixelSize(wM, hM, dpi) {
  const D = Number(dpi)
  if (!Number.isFinite(wM) || !Number.isFinite(hM) || wM <= 0 || hM <= 0) return null
  if (!Number.isFinite(D) || D < 5 || D > 1200) return null
  return {
    pxW: Math.round(wM * INCH_PER_M * D),
    pxH: Math.round(hM * INCH_PER_M * D)
  }
}

// 未压缩文件字节数：RGB ×3 / CMYK ×4；返回 { bytes, mb }（mb 为二进制 MiB）
function fileSizeBytes(pxW, pxH, bytesPerPx) {
  const w = Number(pxW), h = Number(pxH), b = Number(bytesPerPx)
  if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0) return null
  if (!Number.isFinite(b) || b <= 0) return null
  const bytes = w * h * b
  return { bytes, mb: bytes / (1024 * 1024) }
}

// 幅宽提示：type='plotter'（喷绘/灯布）常见 3.2/5m；type='printer'（写真/车贴）常见 1.6m
function widthNoteM(wM, machineType) {
  const w = Number(wM)
  if (!Number.isFinite(w) || w <= 0) return ''
  if (machineType === 'printer') {
    if (w <= 1.6) return `画面宽 ${round2(w)}m ≤ 1.6m：写真机常见幅宽可一次输出，无需拼接。`
    return `画面宽 ${round2(w)}m 超出写真机常见 1.6m 幅宽：需分版拼接，相邻两版图案重叠 5~10cm 对花，拼缝避开文字与直线图形。`
  }
  if (w <= 3.2) return `画面宽 ${round2(w)}m ≤ 3.2m：喷绘机常见幅宽可一次输出，无需拼接。`
  if (w <= 5) return `画面宽 ${round2(w)}m 在 3.2~5m 之间：需用 5m 幅宽喷绘机一次输出；确认合作厂有 5m 机。`
  return `画面宽 ${round2(w)}m 超出喷绘机常见 5m 最大幅宽：需分版拼接，相邻两版重叠 5~10cm 对花，拼缝避开人脸与文字。`
}

function round2(v) {
  return Math.round(Number(v) * 100) / 100
}

function formatMB(mb) {
  if (!Number.isFinite(mb)) return '—'
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${(mb * 1024).toFixed(0)} KB`
}
/* TESTABLE-END */

// ---------- 静态数据 ----------
const CUSTOM_NOTE = '自定义：直接填 DPI，或按视距自动推荐（视距越远所需 DPI 越低，经验对照见右表）。'

const DIST_TABLE = [
  { label: '< 1m（近距展示）', dpi: '150 dpi', use: '展柜灯片、易拉宝小字、前台背景' },
  { label: '1 ~ 3m（室内）', dpi: '72 ~ 120 dpi', use: '写真背景墙、展板、车贴' },
  { label: '3 ~ 6m（半户外）', dpi: '40 ~ 45 dpi', use: '门店门头、走道广告' },
  { label: '6 ~ 10m', dpi: '30 ~ 35 dpi', use: '路边大牌、楼顶喷绘' },
  { label: '10 ~ 20m', dpi: '20 ~ 25 dpi', use: '高炮、围挡、墙体广告' },
  { label: '> 20m（远景）', dpi: '15 ~ 20 dpi', use: '楼体布、山体大字、桥梁横幅' }
]

const PRESET_SIZES = [
  { label: '6m×3m 大牌', unit: 'm', w: 6, h: 3 },
  { label: '3.2m×1m 门头', unit: 'm', w: 3.2, h: 1 },
  { label: '80×200cm 易拉宝', unit: 'mm', w: 800, h: 2000 },
  { label: '3m×2m 背景墙', unit: 'm', w: 3, h: 2 },
  { label: '5m×10m 围挡', unit: 'm', w: 5, h: 10 }
]

// ---------- 响应式参数 ----------
const unit = ref('m')
const widthVal = ref(6)
const heightVal = ref(3)
const typeId = ref('outdoor')
const customMode = ref('dpi')
const customDpi = ref(35)
const viewDist = ref(5)

const activeType = computed(() => PROCESS_TYPE_DEFS.find((t) => t.id === typeId.value) || null)

const dpi = computed(() => {
  if (typeId.value === 'custom') {
    if (customMode.value === 'dist') return dpiFromDistance(viewDist.value)
    return customDpi.value
  }
  return activeType.value ? activeType.value.dpi : null
})

const machineType = computed(() => {
  if (typeId.value === 'indoor' || typeId.value === 'car') return 'printer'
  return 'plotter'
})

const meters = computed(() => toMeters(widthVal.value, heightVal.value, unit.value))
const widthM = computed(() => (meters.value ? meters.value.wM : null))
const heightM = computed(() => (meters.value ? meters.value.hM : null))

const inputInvalid = computed(() => {
  if (!meters.value) return true
  const d = Number(dpi.value)
  return !Number.isFinite(d) || d < 5 || d > 1200
})

const result = computed(() => {
  if (inputInvalid.value || !meters.value) return null
  const px = pixelSize(meters.value.wM, meters.value.hM, dpi.value)
  if (!px) return null
  const rgb = fileSizeBytes(px.pxW, px.pxH, 3)
  const cmyk = fileSizeBytes(px.pxW, px.pxH, 4)
  if (!rgb || !cmyk) return null
  return {
    dpi: dpi.value,
    pxW: px.pxW,
    pxH: px.pxH,
    rgbText: formatMB(rgb.mb),
    cmykText: formatMB(cmyk.mb),
    widthNote: widthNoteM(meters.value.wM, machineType.value)
  }
})

// ---------- 交互动作 ----------
function applyType(t) {
  typeId.value = t.id
}

function applyPreset(p) {
  unit.value = p.unit
  widthVal.value = p.w
  heightVal.value = p.h
}

function resetAll() {
  unit.value = 'm'
  widthVal.value = 6
  heightVal.value = 3
  typeId.value = 'outdoor'
  customMode.value = 'dpi'
  customDpi.value = 35
  viewDist.value = 5
}

function fmt(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return String(Math.round(n * 100) / 100)
}

function resultText() {
  if (!result.value || !meters.value) return ''
  const r = result.value
  return `喷绘写真输出参数\n画面：${fmt(meters.value.wM)} × ${fmt(meters.value.hM)} m（${unit.value === 'mm' ? `${widthVal.value}×${heightVal.value}mm` : `${widthVal.value}×${heightVal.value}m`}）\n工艺：${typeId.value === 'custom' ? '自定义' : (activeType.value ? activeType.value.name : '')} @ ${r.dpi} dpi\n输出像素：${r.pxW} × ${r.pxH} px\n未压缩文件：RGB 约 ${r.rgbText}（CMYK 口径约 ${r.cmykText}）\n幅宽提示：${r.widthNote}`
}

async function copyResult() {
  const text = resultText()
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
  } catch {
    alert('复制失败，请手动记录数值')
  }
}

onMounted(() => {
  addRecentTool('large-format-resolution')
})
</script>
