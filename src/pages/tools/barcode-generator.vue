<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Barcode class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">条形码生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">EAN-13 / EAN-8 / UPC-A / Code 39 / Code 128 / ITF-14 六种格式，校验位自动补算，批量生成与 PNG / SVG / ZIP 下载</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线条形码生成工具：输入内容即可按所选格式实时校验并生成条形码，固定长度商品码自动补算 GS1 校验位（校验位不符时黄条提示、一键更正），
        条宽、高度、字号、条色、背景与边距均可自定义；批量模式每行一个码（最多 200 行），逐行校验后网格预览，可单条下载或一键打包 ZIP。
        全部生成在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Barcode class="w-5 h-5 mr-2 text-primary" /> 生成参数
        </h2>

        <!-- 格式选择 -->
        <div>
          <label for="barcode-format" class="text-sm font-medium text-foreground mb-1.5 block">条形码格式</label>
          <select
            id="barcode-format"
            v-model="format"
            @change="onFormatChange"
            class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="f in FORMATS" :key="f.id" :value="f.id">{{ f.label }}</option>
          </select>
        </div>

        <!-- 内容输入 + 实时校验 -->
        <div>
          <label for="barcode-input" class="text-sm font-medium text-foreground mb-1.5 block">条形码内容</label>
          <input
            id="barcode-input"
            :value="inputValue"
            @input="onInputChanged"
            type="text"
            :placeholder="inputPlaceholder"
            spellcheck="false"
            class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p
            class="mt-2 text-xs leading-relaxed p-2.5 rounded border flex items-start gap-1.5"
            :class="validationClass"
          >
            <TriangleAlert v-if="validation.level === 'error' || validation.level === 'warn'" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <Info v-else-if="validation.level === 'info'" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <CheckCircle v-else class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ validation.hint }}</span>
          </p>
          <button
            v-if="validation.level === 'warn' && validation.corrected"
            @click="applyCorrection"
            type="button"
            class="mt-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition"
          >
            一键更正为 {{ validation.corrected }}
          </button>
        </div>

        <!-- 样式参数 -->
        <div class="pt-1 border-t border-border space-y-3">
          <p class="text-sm font-medium text-foreground pt-3">样式参数（超出范围自动截断）</p>
          <div>
            <div class="flex justify-between text-xs text-muted-foreground mb-1"><span>条宽</span><span class="font-mono">{{ style.width }} px</span></div>
            <input v-model.number="style.width" type="range" min="1" max="4" step="1" class="w-full accent-primary" />
          </div>
          <div>
            <div class="flex justify-between text-xs text-muted-foreground mb-1"><span>高度</span><span class="font-mono">{{ style.height }} px</span></div>
            <input v-model.number="style.height" type="range" min="30" max="200" step="5" class="w-full accent-primary" />
          </div>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="style.displayValue" type="checkbox" class="accent-primary w-4 h-4" />
            在条形码下方显示文字
          </label>
          <div v-if="style.displayValue">
            <div class="flex justify-between text-xs text-muted-foreground mb-1"><span>文字字号</span><span class="font-mono">{{ style.fontSize }} px</span></div>
            <input v-model.number="style.fontSize" type="range" min="8" max="36" step="1" class="w-full accent-primary" />
          </div>
          <div>
            <div class="flex justify-between text-xs text-muted-foreground mb-1"><span>四周留白</span><span class="font-mono">{{ style.margin }} px</span></div>
            <input v-model.number="style.margin" type="range" min="0" max="50" step="1" class="w-full accent-primary" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-xs text-muted-foreground mb-1">条色</p>
              <input v-model="style.lineColor" type="color" class="w-full h-9 px-1 bg-background border border-border border-border rounded-lg cursor-pointer" />
            </div>
            <div>
              <p class="text-xs text-muted-foreground mb-1">背景色</p>
              <input v-model="style.bgColor" type="color" class="w-full h-9 px-1 bg-background border border-border border-border rounded-lg cursor-pointer" />
            </div>
          </div>
        </div>

        <button
          @click="resetStyle"
          type="button"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认参数
        </button>
      </div>

      <!-- 右：实时预览（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 实时预览
          </h2>
          <span class="text-xs text-muted-foreground font-mono">{{ format }}</span>
        </div>

        <!-- 预览画布区 -->
        <div
          class="rounded-xl border border-border min-h-[240px] flex items-center justify-center p-6 overflow-x-auto transition-colors"
          :style="{ backgroundColor: style.bgColor }"
        >
          <svg v-show="renderedValue" ref="svgRef" class="max-w-full h-auto" role="img" :aria-label="`条形码 ${renderedValue}`"></svg>
          <p v-if="renderError" class="text-sm text-red-500 flex items-center gap-1.5">
            <TriangleAlert class="w-4 h-4 flex-shrink-0" /> {{ renderError }}
          </p>
          <p v-else-if="!renderedValue" class="text-sm text-muted-foreground text-center">
            输入内容并点击「生成条形码」，预览会显示在这里
          </p>
        </div>

        <p v-if="renderedValue" class="text-xs text-muted-foreground text-center font-mono break-all">
          最终码值：{{ renderedValue }}<span v-if="validation.level === 'info'">（已自动补算校验位）</span><span v-else-if="validation.level === 'warn'">（校验位有误，已自动更正后生成）</span>
        </p>

        <p v-if="downloadError" class="text-xs text-red-500 flex items-center gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0" /> {{ downloadError }}
        </p>
        <p v-else-if="copyTip" class="text-xs text-green-600 flex items-center gap-1.5">
          <CheckCircle class="w-3.5 h-3.5 flex-shrink-0" /> {{ copyTip }}
        </p>

        <!-- 操作按钮 -->
        <div class="flex flex-wrap gap-2">
          <button
            @click="generateSingle"
            type="button"
            :disabled="!validation.ok"
            class="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            生成条形码
          </button>
          <button
            @click="downloadPng"
            type="button"
            :disabled="!renderedValue || busyDownload"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Download class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 下载 PNG（3 倍高清）
          </button>
          <button
            @click="downloadSvg"
            type="button"
            :disabled="!renderedValue"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Download class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 下载 SVG
          </button>
          <button
            @click="copyValue"
            type="button"
            :disabled="!renderedValue"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制码值
          </button>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          提示：内容不符合所选格式时「生成条形码」按钮置灰；EAN-13 / EAN-8 / UPC-A / ITF-14 输入固定长度的数据位时会自动补算校验位，
          Code 39 输入的小写字母与非法字符会被自动转大写并过滤。下载的 PNG 按 3 倍尺寸导出，适合印刷排版；SVG 为矢量格式，可无限放大。
        </p>
      </div>
    </div>

    <!-- 批量模式（折叠面板） -->
    <div class="relative bg-card border border-border rounded-lg p-6 mb-6">
      <button
        @click="batchOpen = !batchOpen"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起批量模式"
      >
        <ChevronUp v-if="batchOpen" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <h2 class="text-lg font-semibold flex items-center mb-3">
        <Package class="w-5 h-5 mr-2 text-primary" /> 批量模式（每行一个码，共用同一格式与样式参数）
      </h2>
      <div v-show="batchOpen" class="space-y-4">
        <textarea
          v-model="batchText"
          rows="6"
          spellcheck="false"
          class="w-full px-3 py-2.5 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="每行一个条形码内容，最多 200 行，空行自动忽略、首尾空格自动去除&#10;例如：&#10;590123412345&#10;692020288888&#10;UTIL-2026-A"
        ></textarea>

        <!-- 统计与无效行 -->
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span class="px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border">解析 {{ parsedBatch.lines.length }} 行</span>
          <span class="px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">有效 {{ batchValidation.valid.length }} 行</span>
          <span class="px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-500/20">无效 {{ batchValidation.invalid.length }} 行</span>
          <span v-if="parsedBatch.truncated" class="text-amber-600 flex items-center gap-1">
            <TriangleAlert class="w-3.5 h-3.5" /> 已超过 200 行上限，仅保留前 200 行
          </span>
        </div>
        <ul v-if="batchValidation.invalid.length" class="text-xs text-red-500 space-y-1 max-h-40 overflow-y-auto p-2.5 rounded bg-red-500/5 border border-red-500/20 list-disc list-inside">
          <li v-for="bad in batchValidation.invalid" :key="bad.line" class="font-mono">第 {{ bad.line }} 行「{{ bad.raw }}」：{{ bad.reason }}</li>
        </ul>

        <div class="flex flex-wrap gap-2">
          <button
            @click="generateBatch"
            type="button"
            :disabled="!batchValidation.valid.length || batchBusy"
            class="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Barcode class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 批量生成（{{ batchValidation.valid.length }} 个）
          </button>
          <button
            @click="downloadZip"
            type="button"
            :disabled="!batchValidation.valid.length || zipBusy"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Package class="w-4 h-4 inline mr-1.5 -mt-0.5" /> {{ zipBusy ? '打包中…' : '打包下载 ZIP' }}
          </button>
          <button
            v-if="batchGenerated"
            @click="clearBatch"
            type="button"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 清空结果
          </button>
        </div>
        <p v-if="batchError" class="text-xs text-red-500 flex items-center gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0" /> {{ batchError }}
        </p>

        <!-- 批量结果网格 -->
        <div v-show="batchGenerated" ref="batchGridRef" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div v-for="(item, idx) in batchItems" :key="idx + '-' + item.value" class="bg-muted/40 border border-border rounded-lg p-3 text-center space-y-2">
            <div class="rounded overflow-hidden py-2 px-1 flex justify-center" :style="{ backgroundColor: style.bgColor }">
              <canvas :data-batch-index="idx" class="max-w-full h-auto"></canvas>
            </div>
            <p class="text-xs font-mono text-foreground truncate" :title="item.value">{{ item.value }}</p>
            <button
              @click="downloadBatchItem(idx)"
              type="button"
              class="w-full px-2 py-1 text-xs bg-muted hover:bg-muted/80 border border-border rounded-md text-foreground transition inline-flex items-center justify-center gap-1"
            >
              <Download class="w-3 h-3" /> 下载 PNG
            </button>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>条形码生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          本页是一款完全运行在浏览器里的在线条形码生成器，基于开源库 JsBarcode 渲染条形码，支持 EAN-13、EAN-8、UPC-A、Code 39、Code 128、ITF-14
          六种常见一维码格式。工具会按所选格式实时校验内容：固定长度的商品码自动补算校验位，Code 39 自动转大写并过滤非法字符，Code 128 支持任意 ASCII
          可见字符；条宽、高度、是否显示文字、字号、条色、背景色与四周留白都可以调整，并支持 3 倍高清 PNG 与无损 SVG 导出，批量模式一次可处理 200
          行内容并打包下载 ZIP。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见条形码格式有什么区别？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>EAN-13：全球零售商品条码，13 位数字，中国大陆商品以 690-697 开头，超市收银台扫的就是它。</li>
          <li>EAN-8：EAN-13 的短版，8 位数字，用于包装太小印不下标准码的商品。</li>
          <li>UPC-A：北美通行的商品码，12 位数字，出口美国、加拿大市场的商品常用。</li>
          <li>Code 39：字符集为 A-Z、0-9 与少量符号，工业、汽配、医疗标签常用，无需申请即可自行编码。</li>
          <li>Code 128：字符集覆盖全部 ASCII 可见字符、编码密度高，物流单据、快递面单、库存管理最常用。</li>
          <li>ITF-14：14 位数字，专印在仓储外箱上的储运包装码，通常由内装商品的编码推算而来。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">条形码和二维码怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一维条形码只在水平方向记录一串编号，容量小但打印容错高、扫码极快，适合商品结算、物流分拣这类「扫编号、查系统」的场景；
          二维码在横竖两个方向记录数据，能直接嵌入网址、文本甚至整段信息，适合营销落地页、支付与票据凭证。简单说：内容是「系统里的一个编号」就用条形码，
          内容需要「自成一体被完整读出」就用二维码，两者也经常印在同一包装上各司其职。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">商品条码商用如何申请（GS1 说明）？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          零售结算使用的 EAN-13 / EAN-8 / UPC-A 属于 GS1 编码体系，数字前缀对应厂商识别代码，需要向所在国的 GS1 成员组织申请：
          中国大陆为中国物品编码中心（ANCC）及各地分中心，凭营业执照取得厂商识别代码后，再为每个商品品类分配商品项目代码，校验位按 GS1
          算法计算。本工具生成的条形码内容完全来自你的输入——若用于零售上架，请确保前缀来自正规申请的厂商代码；内部管理用途（Code 39 / Code 128 /
          ITF-14）可自行编码，无需申请。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">校验位是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          校验位是一维码最后一位数字，由前面的数据位按 1、3 交替的固定权重加权求和后，用 10 减去和的个位数（取模 10）得出，扫码器用它快速判断读取是否有误。
          EAN-13 由前 12 位算第 13 位，EAN-8 由前 7 位算第 8 位，UPC-A 由前 11 位算第 12 位，ITF-14 由前 13 位算第 14 位；
          Code 39 与 Code 128 不强制校验位。输入位数不够时本工具会自动补算，输入完整位数但校验位不符时会黄条提示并支持一键更正。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">数据是否上传？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          全部本地生成。内容校验、校验位补算、SVG / Canvas 渲染、PNG 导出与 ZIP 打包都在你的浏览器内完成，页面不会发起任何携带条形码内容的网络请求，
          断网也能正常使用；关闭或刷新页面后所有输入与生成结果自动清空。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">EAN-13 和 Code 128 该怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1">零售商品上架必须使用 EAN-13 这类 GS1 商品码（中国商品以 690-697 开头）；Code 128 字符集全、密度高，适合仓库、物流单据等内部管理场景，不需要申请即可自行编码。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">校验位是什么？算错了怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">校验位是条形码最后一位，由前面的数据位按 GS1 加权算法（权重 1、3 交替）计算得出，用于扫码防错。本工具输入 12 位 EAN-13 时会自动补算第 13 位；输入 13 位但校验位不符时会黄条提示，并可一键更正。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">生成的条形码会上传或保存到服务器吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。条形码由浏览器在页面内本地绘制，输入内容、批量列表与导出的 PNG / SVG / ZIP 都不经过任何服务器，刷新页面即清空，断网也能使用。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">批量生成有什么限制？</h3>
            <p class="text-sm text-muted-foreground mt-1">每次最多解析 200 行，自动忽略空行并去除首尾空格；每行按当前格式独立校验，无效行会标出行号与原因，有效行可逐条下载 PNG 或一键打包 ZIP。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'barcode-generator'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import {
  Barcode, Download, Package, RefreshCw,
  ChevronUp, ChevronDown, TriangleAlert, CheckCircle, Info, Copy
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '条形码生成器 - 在线批量生成 EAN-13/Code128 条形码工具',
  description: '免费在线条形码生成器，支持 EAN-13、EAN-8、UPC-A、Code 39、Code 128、ITF-14 六种格式，GS1 校验位自动补算与一键更正，条宽高度颜色边距自定义，批量生成打包下载 PNG/SVG/ZIP，纯浏览器本地运行不上传',
  keywords: '条形码生成器,条形码在线生成,EAN-13生成,Code128生成,UPC-A生成,ITF-14生成,Code39生成,批量条形码,校验位计算,条码下载',
  author: '有条工具',
  ogTitle: '条形码生成器 - 在线批量生成 EAN-13/Code128 条形码工具 | 有条工具',
  ogDescription: '六种条形码格式，校验位自动补算，样式自定义，批量生成与 PNG/SVG/ZIP 下载，本地运行不上传。',
  ogUrl: 'https://www.util.cn/tools/barcode-generator',
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
          name: '条形码生成器',
          url: 'https://www.util.cn/tools/barcode-generator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['支持 EAN-13 / EAN-8 / UPC-A / Code 39 / Code 128 / ITF-14 六种格式', 'GS1 校验位自动补算与一键更正', '条宽/高度/字号/颜色/边距自定义', '3 倍高清 PNG 与矢量 SVG 下载', '批量模式逐行校验、网格预览与 ZIP 打包下载', '本地生成不上传数据']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图片工具', item: 'https://www.util.cn/image/' },
            { '@type': 'ListItem', position: 3, name: '条形码生成器', item: 'https://www.util.cn/tools/barcode-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'EAN-13 和 Code 128 该怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '零售商品上架必须使用 EAN-13 这类 GS1 商品码（中国商品以 690-697 开头）；Code 128 字符集全、密度高，适合仓库、物流单据等内部管理场景，不需要申请即可自行编码。' }
            },
            {
              '@type': 'Question',
              name: '校验位是什么？算错了怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '校验位是条形码最后一位，由前面的数据位按 GS1 加权算法（权重 1、3 交替）计算得出，用于扫码防错。本工具输入 12 位 EAN-13 时会自动补算第 13 位；输入 13 位但校验位不符时会黄条提示，并可一键更正。' }
            },
            {
              '@type': 'Question',
              name: '生成的条形码会上传或保存到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。条形码由浏览器在页面内本地绘制，输入内容、批量列表与导出的 PNG / SVG / ZIP 都不经过任何服务器，刷新页面即清空，断网也能使用。' }
            },
            {
              '@type': 'Question',
              name: '批量生成有什么限制？',
              acceptedAnswer: { '@type': 'Answer', text: '每次最多解析 200 行，自动忽略空行并去除首尾空格；每行按当前格式独立校验，无效行会标出行号与原因，有效行可逐条下载 PNG 或一键打包 ZIP。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 数字串校验位（GS1 mod-10）：data 为不含校验位的数据串，
// firstWeight 是最左位的权重（1 或 3），向右 1/3 交替；check = (10 - sum % 10) % 10
function gs1CheckDigit(data, firstWeight) {
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    const d = data.charCodeAt(i) - 48
    sum += d * ((i % 2 === 0) ? firstWeight : (firstWeight === 1 ? 3 : 1))
  }
  return String((10 - (sum % 10)) % 10)
}

// EAN-13：12 位数据，权重 1,3,1,3...（左起奇数位×1 + 偶数位×3）
function checkDigitEan13(digits12) {
  return gs1CheckDigit(digits12, 1)
}

// UPC-A：11 位数据，权重 3,1,3,1...
function checkDigitUpca(digits11) {
  return gs1CheckDigit(digits11, 3)
}

// EAN-8：7 位数据，权重 3,1,3,1...
function checkDigitEan8(digits7) {
  return gs1CheckDigit(digits7, 3)
}

// ITF-14：13 位数据，权重 3,1,3,1...
function checkDigitItf14(digits13) {
  return gs1CheckDigit(digits13, 3)
}

// EAN-13 补全/更正：12 位→补校验位；13 位→校验并返回更正值
// 返回 { ok, value, expected }（ok 表示原值已合法）；非纯数字或位数不符返回 null
function completeEan13(text) {
  const t = String(text || '').trim()
  if (/^\d{12}$/.test(t)) {
    const expected = checkDigitEan13(t)
    return { ok: true, value: t + expected, expected }
  }
  if (/^\d{13}$/.test(t)) {
    const expected = checkDigitEan13(t.slice(0, 12))
    return { ok: expected === t[12], value: t.slice(0, 12) + expected, expected }
  }
  return null
}

// Code 39 合法字符集：A-Z 0-9 空格 - . $ / + %，自动转大写并过滤非法字符
function sanitizeCode39(text) {
  return String(text || '').toUpperCase().replace(/[^0-9A-Z\-. $/+%]/g, '')
}

// Code 128：任意 ASCII 可见字符（0x20-0x7E）
function isPrintableAscii(text) {
  return /^[\x20-\x7E]*$/.test(text)
}

// 数值非法/越界时截断到 [min, max]，非法输入回退 fallback
function clampNumber(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

// 批量文本解析：按行拆分、去首尾空格、去空行；可选去重；上限 200 行
// 返回 { lines: [{ line: 原始行号, text }], truncated }
function parseBatchLines(text, options = {}) {
  const { dedupe = false, maxLines = 200 } = options
  const raw = String(text || '').split(/\r?\n/)
  const out = []
  const seen = new Set()
  let truncated = false
  for (let i = 0; i < raw.length; i++) {
    const t = raw[i].trim()
    if (!t) continue
    if (dedupe) {
      if (seen.has(t)) continue
      seen.add(t)
    }
    if (out.length >= maxLines) {
      truncated = true
      break
    }
    out.push({ line: i + 1, text: t })
  }
  return { lines: out, truncated }
}

// 各固定长度格式的校验位补全：返回 { value: 补全/更正后的完整码, expected } 或 null
function completeForFormat(format, text) {
  const t = String(text || '').trim()
  const spec = {
    'EAN-13': [12, checkDigitEan13],
    'EAN-8': [7, checkDigitEan8],
    'UPC-A': [11, checkDigitUpca],
    'ITF-14': [13, checkDigitItf14]
  }
  const conf = spec[format]
  if (!conf || !/^\d+$/.test(t)) return null
  const [len, fn] = conf
  if (t.length === len) {
    const expected = fn(t)
    return { value: t + expected, expected }
  }
  if (t.length === len + 1) {
    const expected = fn(t.slice(0, len))
    return { value: t.slice(0, len) + expected, expected }
  }
  return null
}

// 统一校验入口：返回 { ok, level, hint, corrected }
// level: 'error'（非法，生成按钮置灰+红字）| 'warn'（校验位不符，黄条+一键更正）| 'info'（自动补位）| 'ok'
function validateForFormat(format, text) {
  const t = String(text || '').trim()
  const fixedSpec = { 'EAN-13': 12, 'EAN-8': 7, 'UPC-A': 11, 'ITF-14': 13 }
  const len = fixedSpec[format]
  if (len) {
    if (!t) return { ok: false, level: 'error', hint: `请输入 ${len} 位（自动补校验位）或 ${len + 1} 位数字`, corrected: null }
    if (!/^\d+$/.test(t)) return { ok: false, level: 'error', hint: `${format} 只能包含数字 0-9`, corrected: null }
    const c = completeForFormat(format, t)
    if (!c) {
      return { ok: false, level: 'error', hint: `${format} 需要 ${len} 位（自动补校验位）或 ${len + 1} 位数字，当前 ${t.length} 位`, corrected: null }
    }
    if (t.length === len) {
      return { ok: true, level: 'info', hint: `已自动补算校验位 ${c.expected}，完整码为 ${c.value}`, corrected: c.value }
    }
    if (t[len] === c.expected) {
      return { ok: true, level: 'ok', hint: `格式正确，共 ${t.length} 位（含校验位）`, corrected: null }
    }
    return { ok: true, level: 'warn', hint: `校验位应为 ${c.expected}，当前为 ${t[len]}，是否自动更正？`, corrected: c.value }
  }
  if (format === 'CODE 39') {
    const clean = sanitizeCode39(t)
    if (!clean) return { ok: false, level: 'error', hint: 'Code 39 至少需要一个合法字符：A-Z 0-9 空格 - . $ / + %', corrected: null }
    if (clean !== t) return { ok: true, level: 'info', hint: '已自动转大写并过滤非法字符', corrected: clean }
    return { ok: true, level: 'ok', hint: '格式正确', corrected: null }
  }
  if (format === 'CODE 128') {
    if (!t) return { ok: false, level: 'error', hint: '请输入条形码内容', corrected: null }
    if (!isPrintableAscii(t)) return { ok: false, level: 'error', hint: 'Code 128 仅支持 ASCII 可见字符（字母、数字、符号）', corrected: null }
    return { ok: true, level: 'ok', hint: '格式正确', corrected: null }
  }
  return { ok: false, level: 'error', hint: '未知格式', corrected: null }
}

// 批量逐行校验：有效行取补全/更正后的值，无效行带原始行号与原因
function validateBatchLines(lines, format) {
  const valid = []
  const invalid = []
  for (const item of lines) {
    const v = validateForFormat(format, item.text)
    if (v.ok) valid.push({ line: item.line, raw: item.text, value: v.corrected || item.text })
    else invalid.push({ line: item.line, raw: item.text, reason: v.hint })
  }
  return { valid, invalid }
}

// 由样式状态构建 JsBarcode 选项（数值越界自动截断）
function buildBarcodeOpts(styleState, jsFormat) {
  return {
    format: jsFormat,
    width: clampNumber(styleState.width, 1, 4, 2),
    height: clampNumber(styleState.height, 30, 200, 100),
    displayValue: !!styleState.displayValue,
    fontSize: clampNumber(styleState.fontSize, 8, 36, 20),
    lineColor: styleState.lineColor || '#000000',
    background: styleState.bgColor || '#ffffff',
    margin: clampNumber(styleState.margin, 0, 50, 10)
  }
}

// 下载文件名清洗：仅保留字母数字连字符下划线点，其余转为连字符
function sanitizeFilename(text) {
  return String(text || '').replace(/[^\w.-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 60) || 'barcode'
}

// ---------- 格式定义与样式状态 ----------
const FORMATS = [
  { id: 'EAN-13', label: 'EAN-13（全球零售商品码）', js: 'EAN13', placeholder: '如 590123412345 或 5901234123457' },
  { id: 'EAN-8', label: 'EAN-8（短版商品码）', js: 'EAN8', placeholder: '如 9638507 或 96385074' },
  { id: 'UPC-A', label: 'UPC-A（北美商品码）', js: 'UPC', placeholder: '如 036000291452' },
  { id: 'CODE 39', label: 'Code 39（工业/医疗标签）', js: 'code39', placeholder: '如 UTIL-2026-A' },
  { id: 'CODE 128', label: 'Code 128（物流/通用）', js: 'CODE128', placeholder: '如 UTIL-2026-BC01' },
  { id: 'ITF-14', label: 'ITF-14（外箱储运码）', js: 'ITF14', placeholder: '如 1234567890123' }
]

const DEFAULT_STYLE = { width: 2, height: 100, displayValue: true, fontSize: 20, lineColor: '#111827', bgColor: '#ffffff', margin: 10 }
const style = reactive({ ...DEFAULT_STYLE })

// ---------- 页面状态 ----------
const format = ref('EAN-13')
const inputValue = ref('')
const seoContentVisible = ref(true)
const batchOpen = ref(false)
const batchText = ref('')
const batchItems = ref([])
const batchGenerated = ref(false)
const batchBusy = ref(false)
const zipBusy = ref(false)
const batchError = ref('')
const renderedValue = ref('')
const renderError = ref('')
const downloadError = ref('')
const copyTip = ref('')
const busyDownload = ref(false)
let copyTimer = null

const svgRef = ref(null)
const batchGridRef = ref(null)

const currentFormat = computed(() => FORMATS.find((f) => f.id === format.value) || FORMATS[0])
const inputPlaceholder = computed(() => currentFormat.value.placeholder)
const validation = computed(() => validateForFormat(format.value, inputValue.value))
const validationClass = computed(() => ({
  error: 'bg-red-500/10 border-red-500/20 text-red-500',
  warn: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-600',
  ok: 'bg-green-500/10 border-green-500/20 text-green-600'
}[validation.value.level] || 'bg-muted/60 border-border text-muted-foreground'))

const parsedBatch = computed(() => parseBatchLines(batchText.value))
const batchValidation = computed(() => validateBatchLines(parsedBatch.value.lines, format.value))

// ---------- 事件处理（JsBarcode / canvas / document 仅在回调内使用，SSR 安全） ----------
function onInputChanged(e) {
  const raw = e.target.value
  // Code 39 输入即转大写并过滤非法字符，清洗后的值同步回显到输入框
  inputValue.value = format.value === 'CODE 39' ? sanitizeCode39(raw) : raw
  if (format.value === 'CODE 39' && e.target.value !== inputValue.value) {
    e.target.value = inputValue.value
  }
}

function onFormatChange() {
  // 切换格式后旧预览不再对应新格式，清空等待重新生成
  renderedValue.value = ''
  renderError.value = ''
}

function applyCorrection() {
  const v = validation.value
  if (v.corrected) inputValue.value = v.corrected
}

async function generateSingle() {
  const v = validation.value
  if (!v.ok) return
  const finalValue = v.corrected || inputValue.value.trim()
  renderError.value = ''
  downloadError.value = ''
  try {
    const JsBarcode = (await import('jsbarcode')).default
    const svgEl = svgRef.value
    if (!svgEl) return
    JsBarcode(svgEl, finalValue, buildBarcodeOpts(style, currentFormat.value.js))
    renderedValue.value = finalValue
  } catch (e) {
    renderedValue.value = ''
    renderError.value = '生成失败：内容可能包含当前格式不支持的字符或长度不符合要求。'
  }
}

function resetStyle() {
  Object.assign(style, DEFAULT_STYLE)
}

function triggerDownload(url, filename) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// PNG：SVG 序列化 → Image onload 后绘制到 3 倍 canvas → toBlob（判空）→ 下载
function downloadPng() {
  const svgEl = svgRef.value
  if (!svgEl || !renderedValue.value) return
  downloadError.value = ''
  busyDownload.value = true
  try {
    const xml = new XMLSerializer().serializeToString(svgEl)
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml)
    const w = Number(svgEl.getAttribute('width')) || 200
    const h = Number(svgEl.getAttribute('height')) || 100
    const scale = 3
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = w * scale
        canvas.height = h * scale
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          busyDownload.value = false
          downloadError.value = '导出 PNG 失败：当前浏览器不支持 Canvas'
          return
        }
        ctx.fillStyle = style.bgColor || '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          busyDownload.value = false
          if (!blob) {
            downloadError.value = '导出 PNG 失败：浏览器未返回图片数据'
            return
          }
          triggerDownload(URL.createObjectURL(blob), `barcode-${sanitizeFilename(renderedValue.value)}.png`)
        }, 'image/png')
      } catch (e) {
        busyDownload.value = false
        downloadError.value = '导出 PNG 失败：绘制图片时出错'
      }
    }
    img.onerror = () => {
      busyDownload.value = false
      downloadError.value = '导出 PNG 失败：SVG 转换为图片时出错'
    }
    img.src = dataUrl
  } catch (e) {
    busyDownload.value = false
    downloadError.value = '导出 PNG 失败：无法序列化条形码 SVG'
  }
}

function downloadSvg() {
  const svgEl = svgRef.value
  if (!svgEl || !renderedValue.value) return
  downloadError.value = ''
  try {
    const xml = new XMLSerializer().serializeToString(svgEl)
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
    if (!blob) {
      downloadError.value = '导出 SVG 失败：浏览器未返回文件数据'
      return
    }
    triggerDownload(URL.createObjectURL(blob), `barcode-${sanitizeFilename(renderedValue.value)}.svg`)
  } catch (e) {
    downloadError.value = '导出 SVG 失败：无法序列化条形码 SVG'
  }
}

async function copyValue() {
  if (!renderedValue.value) return
  try {
    await navigator.clipboard.writeText(renderedValue.value)
    copyTip.value = '码值已复制到剪贴板'
  } catch (e) {
    copyTip.value = '复制失败：浏览器未授权剪贴板访问'
  }
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copyTip.value = '' }, 2000)
}

// ---------- 批量模式 ----------
async function generateBatch() {
  if (!batchValidation.value.valid.length || batchBusy.value) return
  batchBusy.value = true
  batchError.value = ''
  batchItems.value = batchValidation.value.valid.map((v) => ({ value: v.value }))
  batchGenerated.value = true
  await nextTick()
  try {
    const JsBarcode = (await import('jsbarcode')).default
    renderBatchCanvases(JsBarcode)
  } catch (e) {
    batchError.value = '条形码库加载失败，请检查网络后重试'
  }
  batchBusy.value = false
}

function renderBatchCanvases(barcodeRenderer) {
  const grid = batchGridRef.value
  if (!grid) return
  const opts = buildBarcodeOpts(style, currentFormat.value.js)
  const canvases = grid.querySelectorAll('canvas[data-batch-index]')
  canvases.forEach((canvas) => {
    const idx = Number(canvas.getAttribute('data-batch-index'))
    const item = batchItems.value[idx]
    if (!item) return
    try {
      barcodeRenderer(canvas, item.value, opts)
    } catch (e) {
      batchError.value = `第 ${idx + 1} 个条形码（${item.value}）渲染失败`
    }
  })
}

function downloadBatchItem(idx) {
  const grid = batchGridRef.value
  const item = batchItems.value[idx]
  const canvas = grid ? grid.querySelector(`canvas[data-batch-index="${idx}"]`) : null
  if (!canvas || !item) return
  canvas.toBlob((blob) => {
    if (!blob) {
      batchError.value = '导出失败：浏览器未返回图片数据'
      return
    }
    triggerDownload(URL.createObjectURL(blob), `${idx + 1}_${sanitizeFilename(item.value)}.png`)
  }, 'image/png')
}

// ZIP：动态加载 jszip，逐条离线渲染 canvas → toBlob（判空）→ 打包下载
async function downloadZip() {
  const items = batchValidation.value.valid
  if (!items.length || zipBusy.value) return
  zipBusy.value = true
  batchError.value = ''
  try {
    const [JsBarcodeMod, JsZipMod] = await Promise.all([import('jsbarcode'), import('jszip')])
    const JsBarcode = JsBarcodeMod.default
    const JSZip = JsZipMod.default
    const opts = buildBarcodeOpts(style, currentFormat.value.js)
    const zip = new JSZip()
    for (let i = 0; i < items.length; i++) {
      const canvas = document.createElement('canvas')
      JsBarcode(canvas, items[i].value, opts)
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (blob) zip.file(`${i + 1}_${sanitizeFilename(items[i].value)}.png`, blob)
    }
    const out = await zip.generateAsync({ type: 'blob' })
    if (!out) {
      batchError.value = '打包失败：ZIP 生成结果为空'
      return
    }
    triggerDownload(URL.createObjectURL(out), `barcodes-${items.length}.zip`)
  } catch (e) {
    batchError.value = '打包下载失败：' + (e && e.message ? e.message : '生成过程中出现错误')
  } finally {
    zipBusy.value = false
  }
}

function clearBatch() {
  batchItems.value = []
  batchGenerated.value = false
  batchError.value = ''
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('barcode-generator')
})
</script>
