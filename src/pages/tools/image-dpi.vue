<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Ruler class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">图片DPI修改</h1>
          <p class="text-sm text-muted-foreground mt-1">字节级改写 PNG/JPEG 的 DPI 物理分辨率信息，零重编码零画质损失，附像素-厘米-英寸换算器</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        DPI 描述的是「每一英寸打印多少像素」，改变它不会改变像素，只改变图片打印出来的物理尺寸。
        本工具直接在文件字节层面改写 PNG 的 pHYs 块与 JPEG 的 JFIF APP0 分辨率字段——像素数据一个字节都不动，
        不重新编码、零画质损失。页面下方还提供像素 ↔ 厘米/英寸双向换算器与 A4 等常用纸张对照。
        全部处理在浏览器本地完成，文件不上传服务器。
      </p>
      <div class="flex flex-wrap gap-2 mt-3">
        <span class="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">字节级无损</span>
        <span class="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">零重编码</span>
        <span class="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">纯本地处理</span>
        <span class="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">像素厘米互查</span>
        <span class="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">300dpi 打印对照</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：上传 + 目标 DPI -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <ImageUp class="w-5 h-5 mr-2 text-primary" /> 选择图片（PNG / JPEG）
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/png,image/jpeg,.png,.jpg,.jpeg"
              class="hidden"
              @change="handleFileChange"
            />
            <Upload v-if="!file" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <FileCheck v-else class="w-8 h-8 mx-auto mb-2 text-primary" />
            <p v-if="!file" class="text-sm text-muted-foreground">点击选择或拖入 PNG / JPEG 文件</p>
            <template v-else>
              <p class="text-sm font-medium text-foreground truncate">{{ file.name }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ formatSize(file.size) }} · {{ fmtLabel }}</p>
            </template>
          </div>

          <!-- 图片预览与基本信息 -->
          <div v-if="file" class="mt-4 grid grid-cols-3 gap-2 text-center">
            <div class="bg-muted/50 rounded p-2">
              <p class="text-xs text-muted-foreground">像素宽高</p>
              <p class="text-sm font-medium text-foreground">{{ dims ? dims.width + '×' + dims.height : '—' }}</p>
            </div>
            <div class="bg-muted/50 rounded p-2">
              <p class="text-xs text-muted-foreground">格式</p>
              <p class="text-sm font-medium text-foreground">{{ fmtLabel }}</p>
            </div>
            <div class="bg-muted/50 rounded p-2">
              <p class="text-xs text-muted-foreground">文件大小</p>
              <p class="text-sm font-medium text-foreground">{{ formatSize(file.size) }}</p>
            </div>
          </div>
          <div v-if="file && previewUrl" class="mt-3 border border-border rounded-lg overflow-hidden bg-checkered p-2 flex justify-center">
            <img :src="previewUrl" alt="图片预览" class="max-h-48 max-w-full object-contain" />
          </div>
        </div>

        <!-- 目标 DPI 设置 -->
        <div v-if="file" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Target class="w-5 h-5 mr-2 text-primary" /> 目标 DPI
          </h2>
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-4">
            <button
              v-for="d in dpiPresets"
              :key="d"
              @click="targetDpi = d"
              :class="targetDpi === d ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all"
            >
              {{ d }}
            </button>
          </div>
          <label class="block text-sm font-medium text-foreground mb-2" for="custom-dpi">自定义 DPI（1-65535）</label>
          <input
            id="custom-dpi"
            v-model.number="targetDpi"
            type="number"
            min="1"
            max="65535"
            class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p class="text-xs text-muted-foreground mt-2">
            72 = 屏幕 / 150 = 普通打印 / 300 = 印刷标准。DPI 只影响打印物理尺寸与读取该字段的软件显示，不改变像素。
          </p>

          <button
            @click="applyDpi"
            :disabled="processing || !validTargetDpi"
            class="w-full mt-5 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
            <Settings v-else class="w-4 h-4" />
            {{ processing ? '处理中...' : '字节级改写 DPI 并生成文件' }}
          </button>
        </div>

        <!-- 口径说明（诚实标注） -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <ShieldAlert class="w-4 h-4 mr-2 text-primary" /> 关于 EXIF 分辨率的诚实说明
          </h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            部分相机把 DPI 存在 EXIF 的 XResolution / YResolution 字段里；本工具改写的是主流看图软件、
            排版与打印流程实际读取的 PNG pHYs 块 / JPEG JFIF APP0 字段。若文件同时带 EXIF 分辨率，两者可能不一致，
            以本说明为准：判断「软件显示的 DPI」请以改写后字段为准，建议用看图软件复核。
          </p>
        </div>
      </div>

      <!-- 右：检测结果 + 修改结果 + 换算器 -->
      <div class="space-y-6">
        <!-- 当前 DPI 检测 -->
        <div v-if="file" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Search class="w-5 h-5 mr-2 text-primary" /> 检测结果（当前文件）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-xs text-muted-foreground">当前 DPI</p>
              <p class="text-xl font-bold text-foreground mt-1">{{ currentDpiDisplay }}</p>
              <p class="text-xs mt-1" :class="dpiIsDefault ? 'text-muted-foreground' : 'text-primary'">{{ dpiSourceLabel }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-xs text-muted-foreground">物理尺寸（按当前 DPI）</p>
              <p class="text-sm font-medium text-foreground mt-1">{{ physicalSizeLabel }}</p>
              <p class="text-xs text-muted-foreground mt-1">宽 × 高</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-xs text-muted-foreground">目标 DPI 下物理尺寸</p>
              <p class="text-sm font-medium text-foreground mt-1">{{ targetPhysicalSizeLabel }}</p>
              <p class="text-xs text-muted-foreground mt-1">像素不变，仅字段变化</p>
            </div>
          </div>
          <p v-if="rawDpiInfo" class="text-xs text-muted-foreground mt-3">
            底层数据：{{ rawDpiInfo }}
          </p>
        </div>

        <!-- 空状态 -->
        <div v-if="!file" class="bg-card border border-border rounded-lg p-12">
          <div class="text-center">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Ruler class="w-8 h-8 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-foreground mb-2">为什么印刷方总要求 300dpi？</h3>
            <p class="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              印刷按物理尺寸出图，300dpi 意味着每英寸 300 个像素，是铜版纸印刷清晰度的行业底线。
              DPI 信息缺失或不符时，排版软件会把图片放到错误的物理大小。本工具字节级改写该信息，不用重新导出图片。
            </p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
              <div class="bg-muted/50 rounded-lg p-3">
                <FileSearch class="w-4 h-4 text-primary mb-1.5" />
                <p class="text-xs font-medium text-foreground">自动检测当前 DPI</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <ShieldCheck class="w-4 h-4 text-primary mb-1.5" />
                <p class="text-xs font-medium text-foreground">像素零损失</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <Calculator class="w-4 h-4 text-primary mb-1.5" />
                <p class="text-xs font-medium text-foreground">附尺寸换算器</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 修改结果 -->
        <div v-if="result" class="bg-card border border-green-500/40 rounded-lg p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle class="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-foreground">DPI 修改完成</h2>
              <p class="text-xs text-muted-foreground">{{ result.filename }} · 像素尺寸不变 · {{ deltaLabel }}</p>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center mb-4">
            <div class="bg-muted/50 rounded p-2">
              <p class="text-xs text-muted-foreground">文件大小</p>
              <p class="text-sm font-medium text-foreground">{{ formatSize(result.beforeSize) }} → {{ formatSize(result.size) }}</p>
            </div>
            <div class="bg-muted/50 rounded p-2">
              <p class="text-xs text-muted-foreground">输出 DPI（重新解析验证）</p>
              <p class="text-sm font-medium text-foreground">{{ result.verifyDpi === null ? '未写入' : result.verifyDpi }}</p>
            </div>
            <div class="bg-muted/50 rounded p-2">
              <p class="text-xs text-muted-foreground">CRC / 结构校验</p>
              <p class="text-sm font-medium" :class="result.verifyOk ? 'text-green-500' : 'text-destructive'">{{ result.verifyOk ? '通过' : '异常' }}</p>
            </div>
          </div>
          <button
            @click="downloadResult"
            class="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            <Download class="w-4 h-4" /> 保存到本地
          </button>
        </div>

        <!-- 打印尺寸换算器 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-1 flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 打印尺寸换算器
          </h2>
          <p class="text-xs text-muted-foreground mb-4">像素 ↔ 厘米 / 英寸双向换算：px = cm ÷ 2.54 × dpi</p>

          <div class="flex flex-wrap items-center gap-3 mb-4">
            <div class="flex items-center gap-1.5">
              <button
                v-for="d in convPresets"
                :key="d"
                @click="convDpi = d"
                :class="convDpi === d ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded text-xs font-medium transition-all"
              >
                {{ d }} dpi
              </button>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-xs text-muted-foreground" for="conv-dpi">自定义</label>
              <input
                id="conv-dpi"
                v-model.number="convDpi"
                type="number"
                min="1"
                class="w-20 px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 mb-4">
            <button
              @click="switchConvMode('px2cm')"
              :class="convMode === 'px2cm' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-md text-sm font-medium transition-all"
            >
              像素 → 厘米 / 英寸
            </button>
            <button
              @click="switchConvMode('cm2px')"
              :class="convMode === 'cm2px' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-md text-sm font-medium transition-all"
            >
              厘米 / 英寸 → 像素
            </button>
          </div>

          <!-- px → cm -->
          <div v-if="convMode === 'px2cm'" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-muted-foreground" for="px-w">像素宽</label>
                <input id="px-w" v-model.number="inPxW" type="number" min="0" class="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" placeholder="如 2480" />
              </div>
              <div>
                <label class="text-xs text-muted-foreground" for="px-h">像素高</label>
                <input id="px-h" v-model.number="inPxH" type="number" min="0" class="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" placeholder="如 3508" />
              </div>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-sm">
              <p class="text-foreground">宽 {{ fmtNum(cmWOut) }} cm（{{ fmtNum(inchWOut) }} in） × 高 {{ fmtNum(cmHOut) }} cm（{{ fmtNum(inchHOut) }} in）</p>
              <p class="text-xs text-muted-foreground mt-1">按 {{ validConvDpi }} dpi 换算</p>
            </div>
          </div>

          <!-- cm → px -->
          <div v-else class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-muted-foreground" for="cm-w">宽（cm）</label>
                <input id="cm-w" v-model.number="inCmW" type="number" min="0" step="0.1" class="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" placeholder="如 21" />
              </div>
              <div>
                <label class="text-xs text-muted-foreground" for="cm-h">高（cm）</label>
                <input id="cm-h" v-model.number="inCmH" type="number" min="0" step="0.1" class="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" placeholder="如 29.7" />
              </div>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-sm">
              <p class="text-foreground">宽 {{ fmtNum(pxWOut) }} px × 高 {{ fmtNum(pxHOut) }} px</p>
              <p class="text-xs text-muted-foreground mt-1">按 {{ validConvDpi }} dpi 换算，像素取整</p>
            </div>
          </div>

          <!-- 常用纸张对照 -->
          <div class="mt-4">
            <p class="text-xs font-medium text-foreground mb-2">常用纸张对照（按 {{ validConvDpi }} dpi）</p>
            <div class="space-y-1">
              <div
                v-for="p in papers"
                :key="p.name"
                class="flex items-center justify-between text-xs px-3 py-1.5 rounded"
                :class="p.name === 'A4' ? 'bg-primary/10 text-primary font-medium' : 'bg-muted/50 text-muted-foreground'"
              >
                <span>{{ p.name }}（{{ p.cmW }} × {{ p.cmH }} cm）</span>
                <span class="font-mono">{{ Math.round(cmToPx(p.cmW, validConvDpi)) }} × {{ Math.round(cmToPx(p.cmH, validConvDpi)) }} px</span>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-2">
              印刷提示：A4（21 × 29.7 cm）在 300 dpi 下需要约 2480 × 3508 像素；边缘留 3mm 出血请按 +36 像素估算。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-8">
      <summary class="text-lg font-semibold cursor-pointer select-none text-foreground flex items-center">
        <span class="text-primary mr-2">#</span>DPI 是什么？改 DPI 为什么可以无损？
      </summary>
      <div class="space-y-4 text-sm text-muted-foreground leading-relaxed mt-4">
        <h3 class="text-lg font-semibold text-foreground">功能介绍</h3>
        <p>
          DPI（Dots Per Inch，每英寸点数）是图片的「打印密度」元数据：同一张 2480 像素宽的图，
          按 300dpi 打印是 21.0 cm 宽，按 72dpi 打印就是 87.2 cm 宽——像素本身完全一样，变的只是物理尺寸的解释方式。
          PNG 把这个信息存在 pHYs 块里（单位是「像素/米」，1 米 = 39.37 英寸），JPEG 把它存在 JFIF APP0 段的
          X/Y density 字段里（可按英寸或厘米）。
        </p>
        <p>
          本工具直接解析文件字节：PNG 找到 pHYs 块就改写其像素/米数值并重算 CRC32 校验，没有就在 IHDR 后插入一个标准 pHYs 块；
          JPEG 找到 JFIF APP0 就改写 units 与 X/Y density，没有就在 SOI 后插入标准 JFIF 头（version 1.01）。
          除这十几个元数据字节外，文件其余部分（包括全部像素数据）原样保留——不重新编码、无画质损失、文件体积几乎不变。
        </p>
        <h3 class="text-lg font-semibold text-foreground">典型使用场景</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>印刷交付：印刷厂要求图片 DPI ≥ 300，源图只有 72/96 dpi 时字节级改写即可达标</li>
          <li>上传校验：考试报名、签证照片等系统按 DPI 元数据校验照片规格</li>
          <li>排版预览：把设计稿 DPI 改成与文档一致的值，InDesign / Word 里放置尺寸立刻正确</li>
          <li>规格换算：用换算器确认「这个尺寸像素够不够 300dpi 印刷」，如 A4 需 2480 × 3508 px</li>
        </ul>
        <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">修改 DPI 会损失画质吗？</span>不会。工具只改写十几个元数据字节，像素数据一个字节都不动，属于真正的零重编码无损修改。</li>
          <li><span class="text-foreground font-medium">为什么改完 DPI 像素尺寸没变？</span>DPI 只决定「打印密度」，不改变像素。要让 300dpi 下打印更大，需要增加像素（用图片尺寸调整工具放大）。</li>
          <li><span class="text-foreground font-medium">为什么有的软件读出来还是旧 DPI？</span>部分相机把分辨率同时写在 EXIF 的 XResolution 字段；本工具改的是主流查看器读取的 PNG pHYs / JPEG JFIF 字段，两者不一致时以页面说明为准，请以看图软件实际显示复核。</li>
          <li><span class="text-foreground font-medium">300dpi 打印需要多大像素？</span>像素 = 厘米 ÷ 2.54 × 300：A4（21 × 29.7 cm）约 2480 × 3508 px，6 寸照片（15.2 × 10.2 cm）约 1795 × 1205 px。</li>
          <li><span class="text-foreground font-medium">支持哪些格式？</span>PNG（pHYs 块）与 JPEG（JFIF APP0）。WebP / GIF / HEIC 等格式的 DPI 处理请先转换为 PNG。</li>
        </ul>
        <h3 class="text-lg font-semibold text-foreground">换算公式与口径</h3>
        <p>
          像素 = 物理尺寸 ÷ 2.54 × DPI（厘米制）；物理尺寸 = 像素 ÷ DPI × 2.54。PNG pHYs 的存储值是「像素/米」：
          ppu = DPI ÷ 0.0254（300 dpi ≈ 11811 像素/米）。本工具按此口径双向换算，页面内换算器与文件改写使用同一套公式。
        </p>
      </div>
    </details>

    <RelatedTools :current-tool-id="'image-dpi'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Ruler, ImageUp, Upload, FileCheck, Download, Loader2, Target,
  Settings, ShieldAlert, Search, CheckCircle, FileSearch, ShieldCheck, Calculator
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '图片DPI修改 - PNG/JPEG无损改DPI与像素厘米换算工具',
  description: '免费在线图片DPI修改工具：字节级改写PNG pHYs与JPEG JFIF分辨率字段，零重编码零画质损失，自动检测当前DPI与物理尺寸，附像素厘米英寸双向换算器与A4等300dpi印刷对照，纯本地处理不上传',
  keywords: '图片dpi修改,修改图片dpi,png dpi,jpeg dpi,300dpi,像素转厘米,图片物理尺寸,打印尺寸换算',
  author: '有条工具',
  ogTitle: '图片DPI修改 - 有条工具',
  ogDescription: '字节级改写 PNG/JPEG 的 DPI 信息，零重编码零画质损失，附像素厘米英寸双向换算器。',
  ogUrl: 'https://www.util.cn/tools/image-dpi',
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
          name: '图片DPI修改',
          url: 'https://www.util.cn/tools/image-dpi',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['字节级改写PNG pHYs块并重算CRC32', '改写JPEG JFIF APP0的X/Y density', '无pHYs/APP0时按标准自动插入', '零重编码零画质损失', '自动检测当前DPI与物理尺寸', '像素厘米英寸双向换算器', 'A4等常用纸张300dpi对照']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图像处理', item: 'https://www.util.cn/image/' },
            { '@type': 'ListItem', position: 3, name: '图片DPI修改', item: 'https://www.util.cn/tools/image-dpi/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '修改DPI会损失画质吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。工具只改写十几个元数据字节（PNG pHYs / JPEG JFIF字段），像素数据一个字节都不动，零重编码无损修改。' }
            },
            {
              '@type': 'Question',
              name: '为什么改完DPI像素尺寸没变？',
              acceptedAnswer: { '@type': 'Answer', text: 'DPI只决定打印密度，不改变像素。A4在300dpi下需要约2480×3508像素，像素不够请先用尺寸调整工具放大。' }
            },
            {
              '@type': 'Question',
              name: '为什么有的软件读出来还是旧DPI？',
              acceptedAnswer: { '@type': 'Answer', text: '部分相机把分辨率写在EXIF的XResolution字段；本工具改的是主流查看器读取的PNG pHYs / JPEG JFIF字段，两者不一致时以页面说明为准。' }
            },
            {
              '@type': 'Question',
              name: '300dpi打印需要多大像素？',
              acceptedAnswer: { '@type': 'Answer', text: '像素=厘米÷2.54×300：A4（21×29.7cm）约2480×3508px，6寸照片（15.2×10.2cm）约1795×1205px。' }
            },
            {
              '@type': 'Question',
              name: '支持哪些图片格式？',
              acceptedAnswer: { '@type': 'Answer', text: 'PNG（pHYs块）与JPEG（JFIF APP0）。WebP/GIF/HEIC等格式请先转换为PNG再修改DPI。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'image-dpi')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* ==== PURE:BEGIN ==== */
// ---------- 换算 ----------
const dpiToPpu = (dpi) => Math.round(dpi / 0.0254)   // PNG pHYs：像素/米
const ppuToDpi = (ppu) => ppu * 0.0254
const pxToCm = (px, dpi) => (px / dpi) * 2.54
const cmToPx = (cm, dpi) => (cm / 2.54) * dpi
const pxToInch = (px, dpi) => px / dpi
const inchToPx = (inch, dpi) => inch * dpi

// ---------- CRC32（poly 0xEDB88320，PNG 规范一致；CRC32("123456789") = 0xCBF43926） ----------
const CRC32_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < bytes.length; i++) c = CRC32_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

// ---------- 格式识别 ----------
const PNG_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
function isPng(bytes) {
  if (!bytes || bytes.length < 8) return false
  for (let i = 0; i < 8; i++) if (bytes[i] !== PNG_SIGNATURE[i]) return false
  return true
}
function isJpeg(bytes) {
  return !!(bytes && bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF)
}

function readU32(bytes, off) {
  return (((bytes[off] << 24) | (bytes[off + 1] << 16) | (bytes[off + 2] << 8) | bytes[off + 3]) >>> 0)
}
function writeU32(arr, off, val) {
  arr[off] = (val >>> 24) & 0xFF
  arr[off + 1] = (val >>> 16) & 0xFF
  arr[off + 2] = (val >>> 8) & 0xFF
  arr[off + 3] = val & 0xFF
}
function writeU16(arr, off, val) {
  arr[off] = (val >>> 8) & 0xFF
  arr[off + 1] = val & 0xFF
}

// ---------- PNG chunk 流 ----------
// 返回 [{ type, lenOff, typeOff, dataOff, dataLen, crcOff }]；解析失败返回 null
function parsePngChunks(bytes) {
  if (!isPng(bytes)) return null
  const chunks = []
  let off = 8
  while (off + 8 <= bytes.length) {
    const dataLen = readU32(bytes, off)
    const typeOff = off + 4
    const dataOff = off + 8
    if (dataLen > 0x7FFFFFFF || dataOff + dataLen + 4 > bytes.length) return null
    let type = ''
    for (let i = 0; i < 4; i++) type += String.fromCharCode(bytes[typeOff + i])
    chunks.push({ type, lenOff: off, typeOff, dataOff, dataLen, crcOff: dataOff + dataLen })
    if (type === 'IEND') break
    off = dataOff + dataLen + 4
  }
  return chunks
}

// 校验全部 chunk CRC
function verifyPngCrcs(bytes) {
  const chunks = parsePngChunks(bytes)
  if (!chunks || !chunks.length) return false
  for (const ch of chunks) {
    const stored = readU32(bytes, ch.crcOff)
    const calc = crc32(bytes.subarray(ch.typeOff, ch.dataOff + ch.dataLen))
    if (stored !== calc) return false
  }
  return true
}

// 读 PNG DPI：pHYs unit=1（像素/米）→ dpi=ppu*0.0254；unit=0 仅比例无物理意义 → dpi=null
function readPngDpi(bytes) {
  const chunks = parsePngChunks(bytes)
  if (!chunks) return null
  const phys = chunks.find(c => c.type === 'pHYs')
  if (!phys || phys.dataLen < 9) return { hasPhys: false, dpi: null, ppuX: 0, ppuY: 0, unit: -1 }
  const ppuX = readU32(bytes, phys.dataOff)
  const ppuY = readU32(bytes, phys.dataOff + 4)
  const unit = bytes[phys.dataOff + 8]
  return { hasPhys: true, dpi: unit === 1 ? Math.round(ppuToDpi(ppuX)) : null, ppuX, ppuY, unit }
}

// 字节级改 PNG DPI：有 pHYs 就地改写；无则在 IHDR 后插入标准 pHYs；其余 chunk 原样保留
function setPngDpi(bytes, dpi) {
  const chunks = parsePngChunks(bytes)
  if (!chunks) throw new Error('不是有效的 PNG 文件（签名或 chunk 流损坏）')
  if (!chunks.some(c => c.type === 'IHDR')) throw new Error('PNG 缺少 IHDR 块')
  const safeDpi = Math.max(1, Math.min(65535, Math.round(dpi)))
  const hasPhys = chunks.some(c => c.type === 'pHYs')

  const physData = new Uint8Array(9)
  writeU32(physData, 0, dpiToPpu(safeDpi))
  writeU32(physData, 4, dpiToPpu(safeDpi))
  physData[8] = 1 // unit = meter

  const makeChunk = (type, data) => {
    const chunk = new Uint8Array(12 + data.length)
    writeU32(chunk, 0, data.length)
    for (let i = 0; i < 4; i++) chunk[4 + i] = type.charCodeAt(i)
    chunk.set(data, 8)
    writeU32(chunk, 8 + data.length, crc32(chunk.subarray(4, 8 + data.length)))
    return chunk
  }

  let total = 8
  for (const ch of chunks) total += 12 + ch.dataLen
  if (!hasPhys) total += 12 + 9
  const out = new Uint8Array(total)
  out.set(bytes.subarray(0, 8), 0)
  let o = 8
  for (const ch of chunks) {
    if (ch.type === 'pHYs') {
      const c = makeChunk('pHYs', physData)
      out.set(c, o)
      o += c.length
      continue
    }
    const span = 12 + ch.dataLen
    out.set(bytes.subarray(ch.lenOff, ch.lenOff + span), o)
    o += span
    if (ch.type === 'IHDR' && !hasPhys) {
      const c = makeChunk('pHYs', physData)
      out.set(c, o)
      o += c.length
    }
  }
  return out
}

// ---------- JPEG 段流 ----------
// 从 SOI 后遍历 marker 段，遇到 SOS（其后是熵编码数据）或 EOI 停止
function parseJpegSegments(bytes) {
  if (!isJpeg(bytes)) return null
  const segs = []
  let off = 2
  while (off + 1 < bytes.length) {
    if (bytes[off] !== 0xFF) return null
    while (off < bytes.length && bytes[off] === 0xFF) off++ // 跳过 FF 填充
    const marker = bytes[off]
    off++
    if (marker === 0x00 || marker === 0xFF) continue
    const seg = { marker, markerOff: off - 1 }
    if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7) || marker === 0xD8 || marker === 0xD9) {
      segs.push(seg) // 独立 marker，无长度域
      if (marker === 0xD9) break
      continue
    }
    if (off + 2 > bytes.length) return null
    const len = (bytes[off] << 8) | bytes[off + 1]
    if (len < 2 || off + len > bytes.length) return null
    seg.lenOff = off
    seg.dataOff = off + 2
    seg.dataLen = len - 2
    segs.push(seg)
    if (marker === 0xDA) break // SOS：其后是熵编码数据，不是段
    off = off + len
  }
  return segs
}

// 找 JFIF APP0（FFE0 + "JFIF\0"）
function findJfifSegment(segs, bytes) {
  for (const s of segs) {
    if (s.marker !== 0xE0 || !s.dataLen || s.dataLen < 14) continue
    if (
      bytes[s.dataOff] === 0x4A && bytes[s.dataOff + 1] === 0x46 &&
      bytes[s.dataOff + 2] === 0x49 && bytes[s.dataOff + 3] === 0x46 &&
      bytes[s.dataOff + 4] === 0x00
    ) return s
  }
  return null
}

// 读 JPEG DPI：JFIF units 1=dpi，2=dpc（×2.54），0=仅比例 → dpi=null
function readJpegDpi(bytes) {
  const segs = parseJpegSegments(bytes)
  if (!segs) return null
  const jfif = findJfifSegment(segs, bytes)
  if (!jfif) return { hasJfif: false, dpi: null, units: -1, xDensity: 0, yDensity: 0, version: '' }
  const major = bytes[jfif.dataOff + 5]
  const minor = bytes[jfif.dataOff + 6]
  const units = bytes[jfif.dataOff + 7]
  const xD = (bytes[jfif.dataOff + 8] << 8) | bytes[jfif.dataOff + 9]
  const yD = (bytes[jfif.dataOff + 10] << 8) | bytes[jfif.dataOff + 11]
  const dpi = units === 1 ? xD : units === 2 ? xD * 2.54 : null
  return { hasJfif: true, dpi, units, xDensity: xD, yDensity: yD, version: major + '.' + String(minor).padStart(2, '0') }
}

// 字节级改 JPEG DPI：有 JFIF APP0 就地改写 units/X/Y density；无则在 SOI 后插入标准 JFIF APP0（v1.01, units=1）
function setJpegDpi(bytes, dpi) {
  const segs = parseJpegSegments(bytes)
  if (!segs) throw new Error('不是有效的 JPEG 文件（缺少 SOI 或段流损坏）')
  const safeDpi = Math.max(1, Math.min(65535, Math.round(dpi)))
  const jfif = findJfifSegment(segs, bytes)
  if (jfif) {
    const out = bytes.slice()
    out[jfif.dataOff + 7] = 1 // units: 1 = dots per inch
    writeU16(out, jfif.dataOff + 8, safeDpi)
    writeU16(out, jfif.dataOff + 10, safeDpi)
    return out
  }
  // 标准 JFIF APP0：FFE0 len=16 "JFIF\0" v1.01 units=1 Xd Yd 无缩略图，共 18 字节
  const app0 = new Uint8Array([
    0xFF, 0xE0, 0x00, 0x10,
    0x4A, 0x46, 0x49, 0x46, 0x00,
    0x01, 0x01,
    0x01,
    (safeDpi >> 8) & 0xFF, safeDpi & 0xFF,
    (safeDpi >> 8) & 0xFF, safeDpi & 0xFF,
    0x00, 0x00
  ])
  const out = new Uint8Array(bytes.length + app0.length)
  out.set(bytes.subarray(0, 2), 0) // SOI
  out.set(app0, 2)
  out.set(bytes.subarray(2), 2 + app0.length)
  return out
}

// 读像素尺寸（PNG 读 IHDR；JPEG 读 SOF0/1/2/... 段）
function readImageDimensions(bytes) {
  if (isPng(bytes)) {
    if (bytes.length < 24) return null
    return { width: readU32(bytes, 16), height: readU32(bytes, 20) }
  }
  if (isJpeg(bytes)) {
    const segs = parseJpegSegments(bytes)
    if (!segs) return null
    for (const s of segs) {
      const m = s.marker
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
        if (s.dataLen >= 5) {
          return {
            height: (bytes[s.dataOff + 1] << 8) | bytes[s.dataOff + 2],
            width: (bytes[s.dataOff + 3] << 8) | bytes[s.dataOff + 4]
          }
        }
      }
    }
  }
  return null
}
/* ==== PURE:END ==== */

// ---------- 状态 ----------
const file = ref(null)
const previewUrl = ref('')
const dims = ref(null)
const dpiInfo = ref(null)
const targetDpi = ref(300)
const processing = ref(false)
const isDragging = ref(false)
const result = ref(null)
const fileInput = ref(null)
let currentBytes = null // 非响应式，避免大字节数组被代理

const dpiPresets = [72, 96, 150, 300, 350, 600]
const fmt = ref('') // 'png' | 'jpeg'
const fmtLabel = computed(() => (fmt.value === 'png' ? 'PNG' : fmt.value === 'jpeg' ? 'JPEG' : '—'))

// ---------- DPI 检测展示 ----------
const currentDpi = computed(() => {
  const d = dpiInfo.value
  if (!d) return null
  if (fmt.value === 'png') return d.hasPhys ? d.dpi : null
  if (fmt.value === 'jpeg') return d.hasJfif ? d.dpi : null
  return null
})
const currentDpiDisplay = computed(() => currentDpi.value === null ? 96 : currentDpi.value)
const dpiIsDefault = computed(() => currentDpi.value === null)

const dpiSourceLabel = computed(() => {
  const d = dpiInfo.value
  if (!d || !fmt.value) return '—'
  if (fmt.value === 'png') {
    if (!d.hasPhys) return '未写入 pHYs，默认按 96'
    if (d.unit === 1) return 'PNG pHYs（像素/米）'
    return 'pHYs 仅比例无单位'
  }
  if (!d.hasJfif) return '未写入 JFIF APP0，默认按 96'
  if (d.units === 1) return 'JPEG JFIF（英寸）'
  if (d.units === 2) return 'JPEG JFIF（厘米）'
  return 'JFIF 仅比例无单位'
})

const rawDpiInfo = computed(() => {
  const d = dpiInfo.value
  if (!d) return ''
  if (fmt.value === 'png') {
    if (!d.hasPhys) return 'PNG chunk 流中未找到 pHYs 块'
    return 'pHYs: ' + d.ppuX + ' × ' + d.ppuY + ' 像素/米，unit=' + d.unit
  }
  if (!d.hasJfif) return 'JPEG 段流中未找到 JFIF APP0'
  return 'JFIF v' + d.version + ': units=' + d.units + ', X/Y density=' + d.xDensity + ' × ' + d.yDensity
})

const physicalLabel = (dpi) => {
  if (!dims.value || !dpi) return '—'
  const wCm = pxToCm(dims.value.width, dpi)
  const hCm = pxToCm(dims.value.height, dpi)
  return wCm.toFixed(1) + ' × ' + hCm.toFixed(1) + ' cm'
}
const physicalSizeLabel = computed(() => physicalLabel(currentDpiDisplay.value))
const targetPhysicalSizeLabel = computed(() => physicalLabel(validTargetDpi.value))

const validTargetDpi = computed(() => {
  const n = Number(targetDpi.value)
  return Number.isFinite(n) && n >= 1 && n <= 65535 ? Math.round(n) : null
})

// ---------- 文件选择 ----------
const triggerFileSelect = () => fileInput.value?.click()

const handleFileChange = (e) => {
  const selected = e.target.files?.[0]
  if (selected) setFile(selected)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const dropped = e.dataTransfer?.files?.[0]
  if (dropped) setFile(dropped)
}

const resetFile = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  file.value = null
  dims.value = null
  dpiInfo.value = null
  currentBytes = null
  result.value = null
  fmt.value = ''
}

const setFile = async (f) => {
  try {
    const buf = new Uint8Array(await f.arrayBuffer())
    let kind = ''
    if (isPng(buf)) kind = 'png'
    else if (isJpeg(buf)) kind = 'jpeg'
    if (!kind) {
      alert('仅支持 PNG / JPEG 文件（已按文件头识别）。其他格式请先转换为 PNG。')
      return
    }
    resetFile()
    file.value = f
    fmt.value = kind
    currentBytes = buf
    previewUrl.value = URL.createObjectURL(f)
    dims.value = readImageDimensions(buf)
    dpiInfo.value = kind === 'png' ? readPngDpi(buf) : readJpegDpi(buf)
  } catch (err) {
    alert('读取文件失败：' + (err.message || '未知错误'))
  }
}

// ---------- 字节级改写 ----------
const deltaLabelOf = (delta) => {
  if (delta === 0) return '0 字节增量（仅就地改写字段）'
  if (delta === 21) return '+21 字节（PNG 新增 pHYs 块）'
  if (delta === 18) return '+18 字节（JPEG 新增 JFIF APP0 段）'
  return (delta > 0 ? '+' : '') + delta + ' 字节'
}

const deltaLabel = computed(() => result.value ? deltaLabelOf(result.value.delta) : '')

const applyDpi = () => {
  if (!currentBytes || !validTargetDpi.value) return
  processing.value = true
  try {
    const beforeSize = currentBytes.length
    const out = fmt.value === 'png'
      ? setPngDpi(currentBytes, validTargetDpi.value)
      : setJpegDpi(currentBytes, validTargetDpi.value)
    // 重新解析输出文件做验证
    const re = fmt.value === 'png' ? readPngDpi(out) : readJpegDpi(out)
    const verifyDpi = re ? re.dpi : null
    let verifyOk = false
    if (fmt.value === 'png') {
      verifyOk = !!re && re.hasPhys && verifyPngCrcs(out) && re.ppuX === dpiToPpu(validTargetDpi.value)
    } else {
      verifyOk = !!re && re.hasJfif && re.units === 1 && re.xDensity === validTargetDpi.value && re.yDensity === validTargetDpi.value
    }
    const blob = new Blob([out], { type: fmt.value === 'png' ? 'image/png' : 'image/jpeg' })
    const base = file.value.name.replace(/\.[^.]+$/, '') || 'image'
    result.value = {
      blob,
      filename: base + '-' + validTargetDpi.value + 'dpi.' + (fmt.value === 'png' ? 'png' : 'jpg'),
      size: blob.size,
      beforeSize,
      delta: out.length - beforeSize,
      verifyDpi: verifyDpi === null ? null : Math.round(verifyDpi),
      verifyOk
    }
  } catch (err) {
    alert('修改失败：' + (err.message || '未知错误'))
  } finally {
    processing.value = false
  }
}

const downloadResult = () => {
  if (!result.value) return
  const url = URL.createObjectURL(result.value.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = result.value.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ---------- 打印尺寸换算器 ----------
const convPresets = [72, 150, 300]
const convDpi = ref(300)
const convMode = ref('px2cm') // 'px2cm' | 'cm2px'
const inPxW = ref(null)
const inPxH = ref(null)
const inCmW = ref(null)
const inCmH = ref(null)

const validConvDpi = computed(() => {
  const n = Number(convDpi.value)
  return Number.isFinite(n) && n >= 1 ? n : 1
})

const switchConvMode = (mode) => {
  if (mode === convMode.value) return
  // 切换方向时把当前值换算带过去，保持双向连续
  if (mode === 'cm2px' && Number.isFinite(inPxW.value) && Number.isFinite(inPxH.value)) {
    inCmW.value = Number(pxToCm(inPxW.value, validConvDpi.value).toFixed(2))
    inCmH.value = Number(pxToCm(inPxH.value, validConvDpi.value).toFixed(2))
  }
  if (mode === 'px2cm' && Number.isFinite(inCmW.value) && Number.isFinite(inCmH.value)) {
    inPxW.value = Math.round(cmToPx(inCmW.value, validConvDpi.value))
    inPxH.value = Math.round(cmToPx(inCmH.value, validConvDpi.value))
  }
  convMode.value = mode
}

const cmWOut = computed(() => (Number.isFinite(inPxW.value) ? pxToCm(inPxW.value, validConvDpi.value) : null))
const cmHOut = computed(() => (Number.isFinite(inPxH.value) ? pxToCm(inPxH.value, validConvDpi.value) : null))
const inchWOut = computed(() => (Number.isFinite(inPxW.value) ? pxToInch(inPxW.value, validConvDpi.value) : null))
const inchHOut = computed(() => (Number.isFinite(inPxH.value) ? pxToInch(inPxH.value, validConvDpi.value) : null))
const pxWOut = computed(() => (Number.isFinite(inCmW.value) ? Math.round(cmToPx(inCmW.value, validConvDpi.value)) : null))
const pxHOut = computed(() => (Number.isFinite(inCmH.value) ? Math.round(cmToPx(inCmH.value, validConvDpi.value)) : null))

const fmtNum = (v) => (v === null || !Number.isFinite(v)) ? '—' : Number(v.toFixed(2)).toString()

const papers = [
  { name: 'A4', cmW: 21.0, cmH: 29.7 },
  { name: 'A3', cmW: 29.7, cmH: 42.0 },
  { name: 'A5', cmW: 14.8, cmH: 21.0 },
  { name: '6寸照片', cmW: 15.2, cmH: 10.2 },
  { name: '名片', cmW: 9.0, cmH: 5.4 }
]

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<style scoped>
.bg-checkered {
  background-image:
    linear-gradient(45deg, #e8e8e8 25%, transparent 25%),
    linear-gradient(-45deg, #e8e8e8 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e8e8e8 75%),
    linear-gradient(-45deg, transparent 75%, #e8e8e8 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
}
</style>
