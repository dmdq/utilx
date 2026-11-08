<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Clapperboard class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">GIF转视频</h1>
          <p class="text-sm text-muted-foreground mt-1">GIF 动图转 MP4/WebM，社交平台上传不再被压成糊图，纯本地解码不上传</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 GIF 转视频工具：拖入 .gif 文件，用浏览器原生 WebCodecs ImageDecoder 逐帧解码，
        按每帧自带的延时（GIF 帧节奏）原速重放到画布并实时录制为 MP4（自动降级 WebM）视频。
        支持选择循环次数（1/3/5 次）与背景色（透明 GIF 帧以所选背景填充）。转换全程在浏览器本地完成，
        GIF 文件与输出的视频都不会上传服务器。
      </p>
      <div class="flex flex-wrap gap-2 mt-3">
        <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">按帧延时原速播放</span>
        <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">循环 1/3/5 次可选</span>
        <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">背景色可自定义</span>
        <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">纯本地不上传</span>
      </div>
    </div>

    <!-- 页面说明条 -->
    <p class="flex items-start gap-2 text-xs leading-relaxed bg-primary/10 border border-primary/20 text-foreground rounded-lg p-3 mb-6">
      <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span>
        视频格式（MP4/WebM）不支持透明通道：透明 GIF 的透明区域会以所选背景色填充（默认黑色）。
        转换按每帧自带延时原速播放（非固定帧率），0 或过短的帧延时按浏览器播放器惯例抬升到约 100ms。
      </span>
    </p>

    <!-- 浏览器不支持提示：WebCodecs ImageDecoder 缺失时整块置灰 -->
    <div v-if="supportChecked && !decoderSupported" class="bg-card border border-red-500/40 rounded-lg p-4 space-y-2 mb-6">
      <p class="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
        <TriangleAlert class="w-4 h-4" /> 当前浏览器不支持 GIF 解码，本工具已置灰
      </p>
      <p class="text-xs text-muted-foreground leading-relaxed">
        本工具依赖 WebCodecs ImageDecoder API 解码 GIF 帧（Chrome / Edge 94+ 支持，Safari 16.4+ 部分支持）。
        当前浏览器未提供该能力，无法在本地解码 GIF——我们不希望为此把你的 GIF 上传到服务器解码，
        所以请换用新版 Chrome / Edge 等现代浏览器后再使用。
      </p>
    </div>
    <div v-else-if="supportChecked && !canRecord" class="bg-card border border-amber-500/40 rounded-lg p-4 space-y-2 mb-6">
      <p class="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
        <TriangleAlert class="w-4 h-4" /> 当前浏览器不支持视频录制
      </p>
      <p class="text-xs text-muted-foreground leading-relaxed">
        导出依赖 canvas.captureStream 与 MediaRecorder 能力（新版 Chrome / Edge / Firefox 支持）。
        请更换浏览器后重试。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" :class="{ 'opacity-60 pointer-events-none': supportChecked && !decoderSupported }">
      <!-- 左栏：输入与设置 -->
      <div class="space-y-6">
        <!-- 文件选择 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ImagePlay class="w-5 h-5 mr-2 text-primary" /> 选择 GIF 文件
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".gif,image/gif"
              class="hidden"
              @change="handleFileChange"
            />
            <ImagePlay class="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
            <p class="text-sm font-medium text-foreground">点击或拖入 .gif 文件（上限 100MB）</p>
            <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <ShieldCheck class="w-3 h-3" /> 本地解码录制，GIF 不上传
            </p>
          </div>
          <div v-if="fileName" class="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <ImagePlay class="w-4 h-4 text-primary flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
              <p class="text-[10px] text-muted-foreground">
                {{ formatSize(fileSize) }}<span v-if="gifDims.w"> · {{ gifDims.w }}×{{ gifDims.h }}</span><span v-if="frameCount"> · {{ frameCount }} 帧</span>
              </p>
            </div>
            <button
              @click="clearFile"
              :disabled="isBusy || probing"
              class="p-1 text-muted-foreground hover:text-destructive disabled:opacity-40"
              aria-label="移除文件"
              title="移除"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <p v-if="probing" class="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 class="w-3.5 h-3.5 animate-spin" /> 正在逐帧解析 GIF（帧数越多耗时越长，请稍候）…
          </p>
          <p v-if="fileSize > 20 * 1024 * 1024 && !probing" class="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> 大文件提醒：超过 20MB 的 GIF 逐帧解码耗时与内存占用较高，请耐心等待。
          </p>
        </div>

        <!-- 转换设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Repeat class="w-5 h-5 mr-2 text-primary" /> 转换设置
          </h2>

          <!-- 循环次数 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">循环次数</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="n in loopOptions"
                :key="n"
                @click="loopCount = n"
                :disabled="isBusy"
                :class="loopCount === n ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              >{{ n }} 次</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              微信 / 微博等平台上传视频后会自动循环播放，选 1 次即可；不自动循环的场景选 3 或 5 次延长展示时间。
            </p>
          </div>

          <!-- 背景色 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">背景色（透明区域以此填充）</label>
            <div class="flex items-center gap-2">
              <div class="grid grid-cols-3 gap-1.5 flex-1">
                <button
                  @click="bgMode = 'black'"
                  :disabled="isBusy"
                  :class="bgMode === 'black' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                >黑色</button>
                <button
                  @click="bgMode = 'white'"
                  :disabled="isBusy"
                  :class="bgMode === 'white' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                >白色</button>
                <button
                  @click="bgMode = 'custom'"
                  :disabled="isBusy"
                  :class="bgMode === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                >自定义</button>
              </div>
              <input
                v-if="bgMode === 'custom'"
                v-model="bgColor"
                type="color"
                :disabled="isBusy"
                class="w-10 h-9 p-0.5 bg-background border border-border rounded-lg cursor-pointer disabled:opacity-50"
                aria-label="自定义背景色"
              />
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              当前背景：{{ bgFill }}（视频格式不支持透明，透明 GIF 帧的透明区域以该颜色填充）
            </p>
          </div>

          <!-- GIF 解析信息与输出预估 -->
          <div class="bg-muted/50 rounded-lg p-3 space-y-1.5 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">画布尺寸 / 帧数</span>
              <span class="text-foreground font-medium font-mono">
                <template v-if="gifDims.w">{{ gifDims.w }}×{{ gifDims.h }} · {{ frameCount }} 帧</template>
                <template v-else>选择 GIF 后显示</template>
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">单圈时长（按帧延时累加）</span>
              <span class="text-foreground font-medium font-mono">{{ frameCount ? fmtDurationMs(loopDurationMs) : '—' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">预计输出时长（单圈 × 循环）</span>
              <span class="text-foreground font-medium font-mono">{{ frameCount ? fmtDurationMs(estimatedOutputMs) : '—' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">输出格式</span>
              <span class="text-foreground font-medium">{{ mimeLabelText }} · 无音轨（GIF 无声音）</span>
            </div>
            <p class="text-[10px] text-muted-foreground flex items-start gap-1">
              <Info class="w-3 h-3 flex-shrink-0 mt-0.5" />
              按每帧自带延时原速播放（非固定 fps）：GIF 里哪帧停多久，视频里就停多久。
            </p>
          </div>

          <!-- 开始转换 -->
          <button
            @click="startConvert"
            :disabled="!canStart"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Loader2 v-if="isBusy" class="w-4 h-4 animate-spin" />
            <Clapperboard v-else class="w-4 h-4" />
            {{ isBusy ? '逐帧录制中，请勿切换标签页' : '开始转换为视频（实时录制）' }}
          </button>

          <button
            v-if="isBusy"
            @click="cancelConvert"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-all"
          >
            中止转换（不保存结果）
          </button>

          <!-- 进度：当前帧 / 总帧 / 当前循环 -->
          <div v-if="isBusy">
            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full transition-all" :style="{ width: Math.min(100, Math.round(progress * 100)) + '%' }"></div>
            </div>
            <p class="text-[10px] text-muted-foreground mt-1.5">
              第 {{ currentLoop }} / {{ loopCount }} 圈 · 当前帧 {{ currentFrame }} / {{ frameCount }} · 已合成 {{ processedFrames }} / {{ totalFramesNeeded }} 帧
            </p>
          </div>

          <div v-if="error" class="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ error }}</span>
          </div>

          <p class="text-[10px] text-muted-foreground leading-relaxed">
            方式说明：GIF 由 ImageDecoder 逐帧解码，按每帧延时绘制到画布并以 30fps 采集、MediaRecorder 实时录制，
            所需时间约等于预计输出时长。GIF 本身没有音轨，输出为纯视频流。录制期间请保持页面在前台。
          </p>
        </div>
      </div>

      <!-- 右栏：预览与结果 -->
      <div class="space-y-6">
        <!-- 画布预览（也是录制源） -->
        <div v-if="gifDims.w" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center justify-between flex-wrap gap-2">
            <span class="flex items-center"><Play class="w-5 h-5 mr-2 text-primary" /> 帧预览</span>
            <span v-if="isBusy" class="text-xs font-normal text-amber-600 dark:text-amber-400">（转换中：按帧延时逐帧录制）</span>
            <span v-else class="text-xs font-normal text-muted-foreground">首帧效果（含背景色）</span>
          </h2>
          <div class="flex justify-center bg-muted/30 rounded-lg p-3">
            <canvas
              ref="canvasEl"
              :width="gifDims.w"
              :height="gifDims.h"
              class="max-w-full max-h-96 rounded"
              aria-label="GIF 帧画布预览"
            ></canvas>
          </div>
        </div>

        <!-- 转换结果 -->
        <div v-if="resultUrl && resultInfo" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CircleCheck class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" /> 转换完成
          </h2>
          <video :src="resultUrl" controls playsinline loop class="w-full max-h-96 rounded-lg bg-black"></video>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">循环次数</p>
              <p class="text-sm font-bold text-foreground">{{ resultInfo.loops }} 次</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">输出时长</p>
              <p class="text-sm font-bold text-foreground font-mono">{{ fmtDurationMs(resultInfo.durationMs) }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">输出大小</p>
              <p class="text-sm font-bold text-green-600 dark:text-green-400">{{ formatSize(resultInfo.size) }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">输出格式</p>
              <p class="text-sm font-bold text-foreground">{{ resultInfo.format }}</p>
            </div>
          </div>
          <button
            @click="downloadResult"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Download class="w-4 h-4" /> 保存 {{ resultInfo.name }}（{{ formatSize(resultInfo.size) }}）
          </button>
        </div>

        <!-- 空状态 -->
        <div v-if="!gifDims.w && !resultUrl" class="bg-card border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
          选择 GIF 后，这里会显示首帧预览（含背景色）与转换结果
        </div>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12">
      <summary class="text-xl font-bold text-foreground cursor-pointer select-none flex items-center">
        <span class="text-primary mr-2">#</span> GIF为什么要转视频？解码、循环与常见问题
      </summary>

      <div class="mt-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          很多平台（微博、小红书、抖音、B 站专栏等）上传 GIF 时会做激进的二次压缩：降帧率、缩分辨率、糊成马赛克，
          而同样的内容以 MP4 视频上传则能保留原始分辨率与帧节奏。本工具把 GIF 逐帧解码后按原有帧延时
          重放并录制为 MP4/WebM 视频，让动图以「视频身份」过审，画质明显更好。
          整个过程使用浏览器原生 WebCodecs ImageDecoder 在本地完成，GIF 不会上传服务器。
        </p>

        <h3 class="text-lg font-semibold text-foreground">功能介绍</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">本地逐帧解码</span>：使用 WebCodecs ImageDecoder（Chrome/Edge 94+，Safari 16.4+ 部分支持），不依赖任何在线解码服务。</li>
          <li><span class="text-foreground font-medium">原速帧节奏</span>：按每帧自带的 GCE 延时播放（非固定帧率），0 或过短的延时按浏览器播放器惯例抬升到约 100ms。</li>
          <li><span class="text-foreground font-medium">循环次数</span>：1 / 3 / 5 次可选，预计输出时长 = 单圈时长 × 循环次数。</li>
          <li><span class="text-foreground font-medium">背景色填充</span>：视频格式不支持透明通道，透明 GIF 的透明区域以黑 / 白 / 自定义色填充。</li>
          <li><span class="text-foreground font-medium">格式优先</span>：输出优先 MP4（新版 Chrome / Safari），自动降级 WebM（VP9/VP8），无音轨纯视频。</li>
          <li><span class="text-foreground font-medium">纯本地处理</span>：解码、绘制、录制全在本机，GIF 与输出视频均不上传。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground">使用场景</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>表情包上传微博 / 小红书 / 抖音，避免被压缩成低帧率糊图；</li>
          <li>营销号与自媒体把动图素材转成视频混剪发布；</li>
          <li>产品演示动图嵌入不支持 GIF 自动播放的平台（转为视频自动循环）；</li>
          <li>把 ScreenToGif 等工具录的 GIF 转成 mp4 归档，体积更小、兼容性更好。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground pt-2">常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h4 class="text-base font-semibold text-foreground">转出来的视频会保留透明背景吗？</h4>
            <p class="mt-1">
              不会。MP4 与 WebM 的常规编码（H.264 / VP9 / VP8）都不支持 alpha 透明通道，
              透明 GIF 的透明区域会以所选背景色填充（默认黑色，可选白色或自定义色）。
              如需保留透明请继续使用 GIF 或导出 WebM 序列帧。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">输出视频的帧率是多少？播放速度会变吗？</h4>
            <p class="mt-1">
              本工具按每帧自带的延时原速播放，不是固定帧率：GIF 里某帧停 100ms，视频里它就停留 100ms。
              录制采集为 30fps（重复帧由编码器合并），因此播放节奏与原 GIF 一致；
              0 或过短（小于 20ms）的帧延时按浏览器播放器的统一惯例抬升到约 100ms，避免"一闪而过"。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">为什么提示需要 Chrome / Edge？</h4>
            <p class="mt-1">
              浏览器没有公开的通用 GIF 解码 API，本工具使用较新的 WebCodecs ImageDecoder 标准逐帧解码
              （Chrome / Edge 94+ 支持，Safari 16.4+ 部分支持）。检测到当前浏览器不支持时工具会置灰并如实提示——
              我们坚持纯本地处理，不会为了兼容旧浏览器而把你的 GIF 上传到服务端解码。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">循环次数怎么选？</h4>
            <p class="mt-1">
              微信、微博等平台上传视频后会自动循环播放，选 1 次即可；不自动循环的场景（部分信息流、网页嵌入）选
              3 或 5 次，让动图多播几轮。输出时长 = 单圈时长 × 循环次数，面板中会实时预估。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">GIF 与输出文件会上传服务器吗？</h4>
            <p class="mt-1">
              不会。GIF 通过对象数据在浏览器内存中解码（ImageDecoder），逐帧绘制与录制全部在本机完成，
              页面不会发出任何包含文件数据的网络请求，关闭或刷新页面后内存即释放。
            </p>
          </div>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'gif-to-video'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import {
  Clapperboard, ImagePlay, Download, X, Loader2, CircleCheck,
  Repeat, Play, ShieldCheck, Info, TriangleAlert
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const tool = tools.find((t) => t.id === 'gif-to-video')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- SEO ----------
useSeoMeta({
  title: 'GIF转视频 - 在线GIF转MP4/WebM工具，画质不被平台压缩',
  description: '免费在线 GIF 转视频工具：WebCodecs 本地逐帧解码，按帧延时原速播放，循环 1/3/5 次与背景色可选，输出 MP4/WebM，社交平台上传不再被压成糊图，GIF 不上传服务器',
  keywords: 'gif转视频, gif转mp4, gif转webm, 动图转视频, gif格式转换, gif上传压缩',
  author: '有条工具',
  ogTitle: 'GIF转视频 - 在线GIF转MP4/WebM工具 | 有条工具',
  ogDescription: '本地逐帧解码 GIF，按帧延时原速转 MP4/WebM，循环与背景色可选，不上传数据。',
  ogUrl: 'https://www.util.cn/tools/gif-to-video',
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
          name: 'GIF转视频',
          url: 'https://www.util.cn/tools/gif-to-video',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['WebCodecs ImageDecoder 本地逐帧解码', '按帧延时原速播放（非固定 fps）', '循环 1/3/5 次可选', '透明区域背景色填充（黑/白/自定义）', '输出 MP4 优先自动降级 WebM', 'GIF 与输出均不上传服务器']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'GIF转视频', item: 'https://www.util.cn/tools/gif-to-video/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '转出来的视频会保留透明背景吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。MP4 与 WebM 常规编码不支持 alpha 透明通道，透明 GIF 的透明区域以所选背景色填充（默认黑色，可选白色或自定义色）。' }
            },
            {
              '@type': 'Question',
              name: '输出视频的帧率是多少？播放速度会变吗？',
              acceptedAnswer: { '@type': 'Answer', text: '按每帧自带延时原速播放（非固定 fps），GIF 里哪帧停多久视频里就停多久；0 或过短延时按浏览器惯例抬升到约 100ms。' }
            },
            {
              '@type': 'Question',
              name: '为什么提示需要 Chrome / Edge？',
              acceptedAnswer: { '@type': 'Answer', text: 'GIF 逐帧解码依赖 WebCodecs ImageDecoder（Chrome/Edge 94+，Safari 16.4+ 部分支持），不支持的浏览器会置灰提示；本工具坚持纯本地处理，不提供服务器解码。' }
            },
            {
              '@type': 'Question',
              name: '循环次数怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '微信、微博等平台上传视频后自动循环，选 1 次即可；不自动循环的场景选 3 或 5 次。输出时长 = 单圈时长 × 循环次数。' }
            },
            {
              '@type': 'Question',
              name: 'GIF 与输出文件会上传服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。GIF 在浏览器内存中解码，逐帧绘制与录制全部在本机完成，不发任何网络请求，关闭页面即释放。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯函数（node 自测覆盖） ----------
// 预计输出时长（毫秒）= 单圈帧延时总和 × 循环次数（delays=[100,200,300] loops=3 → 1800ms）
// 非法延时项跳过；循环次数小于 1 时按 1 处理；入参不是数组返回 0
function totalDurationMs(frameDelays, loops) {
  const arr = Array.isArray(frameDelays) ? frameDelays : []
  let sum = 0
  for (let i = 0; i < arr.length; i++) {
    const d = Number(arr[i])
    if (isFinite(d) && d > 0) sum += d
  }
  const n = Math.floor(Number(loops))
  const loopsSafe = isFinite(n) && n >= 1 ? n : 1
  return Math.round(sum * loopsSafe)
}

// ImageDecoder 的 frame.duration 单位为微秒（µs），GIF 的 GCE 延时以 1/100 秒（10ms 步进）记录。
// 换算为毫秒并对齐浏览器播放器行为：延时缺失/非法回退 100ms；不足 20ms（含 0）按约 100ms 处理，
// 避免"尽快切帧"型 GIF 在视频里快放糊成一闪而过
function frameDelayMsOf(durationUs) {
  const us = Number(durationUs)
  if (!isFinite(us) || us <= 0) return 100
  const ms = Math.round(us / 1000)
  if (ms < 20) return 100
  return ms
}

// 背景色 hex 校验：仅接受 #RGB 或 #RRGGBB（fillStyle 直接可用）
function isValidHexColor(str) {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(str || '').trim())
}
// ---------- 纯函数结束 ----------

// MediaRecorder mimeType 候选表：MP4 优先（Chrome 126+ / Safari 支持），降级 WebM VP9 → VP8 → 默认
const MIME_CANDIDATES = [
  { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', label: 'MP4（H.264）' },
  { mime: 'video/mp4', label: 'MP4' },
  { mime: 'video/webm;codecs=vp9', label: 'WebM（VP9）' },
  { mime: 'video/webm;codecs=vp8', label: 'WebM（VP8）' },
  { mime: 'video/webm', label: 'WebM（浏览器默认编码）' }
]

// 依次探测 mimeType 支持情况，返回命中的候选项；全不支持或探测函数无效返回 null
function pickMimeOf(isSupported) {
  if (typeof isSupported !== 'function') return null
  for (let i = 0; i < MIME_CANDIDATES.length; i++) {
    if (isSupported(MIME_CANDIDATES[i].mime)) return MIME_CANDIDATES[i]
  }
  return null
}

function fmtDurationMs(ms) {
  const v = Math.max(0, Math.round(Number(ms) || 0))
  if (v < 1000) return `${v} ms`
  return `${(v / 1000).toFixed(2)} s`
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 状态（状态机 idle/ready/processing/done/error） ----------
const fileInput = ref(null)
const canvasEl = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const isDragging = ref(false)

const status = ref('idle') // idle 无文件 / ready 解析完成 / processing 录制中 / done 完成 / error 出错
const probing = ref(false) // 选中文件后的逐帧解析阶段（status 仍为 idle/ready）
const error = ref('')

const gifDims = ref({ w: 0, h: 0 })
const frameDelays = ref([]) // 每帧延时（ms，已按浏览器惯例钳制）

const loopCount = ref(1)
const loopOptions = [1, 3, 5]
const bgMode = ref('black') // black / white / custom
const bgColor = ref('#000000')

const currentLoop = ref(0)
const currentFrame = ref(0)
const processedFrames = ref(0)
const progress = ref(0)

const resultUrl = ref('')
const resultInfo = ref(null) // { name, size, loops, durationMs, format }

const supportChecked = ref(false)
const decoderSupported = ref(false)
const support = ref({ recorder: false, capture: false })
const pickedMime = ref(null) // { mime, label }

const isBusy = computed(() => status.value === 'processing')

// ---------- 计算属性 ----------
const frameCount = computed(() => frameDelays.value.length)
const bgFill = computed(() => {
  if (bgMode.value === 'black') return '#000000'
  if (bgMode.value === 'white') return '#ffffff'
  return isValidHexColor(bgColor.value) ? bgColor.value.trim() : '#000000'
})
const loopDurationMs = computed(() => totalDurationMs(frameDelays.value, 1))
const estimatedOutputMs = computed(() => totalDurationMs(frameDelays.value, loopCount.value))
const totalFramesNeeded = computed(() => frameCount.value * loopCount.value)
const canRecord = computed(() => support.value.recorder && support.value.capture && !!pickedMime.value)
const canStart = computed(() => {
  // 解析失败时 frameCount 为 0，天然禁止；转换失败后 decoder 与帧信息仍有效，允许直接重试
  return !isBusy.value && !probing.value && frameCount.value > 0 && decoderSupported.value && canRecord.value
})
const mimeLabelText = computed(() => {
  if (pickedMime.value) return pickedMime.value.label
  return supportChecked.value ? '当前浏览器不支持' : '检测中…'
})

// 背景变化时刷新首帧预览（录制中不重绘）
watch([bgMode, bgColor], () => {
  if (isBusy.value || probing.value) return
  if (status.value === 'ready' || status.value === 'done') drawPreview()
})

// ---------- 文件选择（SSR 安全：解码仅在用户回调内进行） ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

function resetAll() {
  abortRecordingSilently()
  closeDecoder()
  fileName.value = ''
  fileSize.value = 0
  gifDims.value = { w: 0, h: 0 }
  frameDelays.value = []
  currentLoop.value = 0
  currentFrame.value = 0
  processedFrames.value = 0
  progress.value = 0
  clearResult()
}

function clearResult() {
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = ''
  resultInfo.value = null
}

function acceptFile(f) {
  if (!f) return
  if (isBusy.value) {
    error.value = '正在转换，请先中止或等待完成后再更换文件'
    return
  }
  if (probing.value) {
    error.value = '正在解析上一个 GIF，请稍候'
    return
  }
  error.value = ''
  const isGif = f.type === 'image/gif' || /\.gif$/i.test(f.name || '')
  if (!isGif) {
    status.value = 'error'
    error.value = '请选择 .gif 文件'
    return
  }
  if (f.size > 100 * 1024 * 1024) {
    status.value = 'error'
    error.value = 'GIF 超过 100MB：本地逐帧解码内存占用过高，建议先压缩 GIF 后再转换'
    return
  }
  resetAll()
  loadGif(f)
}

function handleFileChange(e) {
  const files = e.target.files
  if (files && files.length > 0) acceptFile(files[0])
  e.target.value = ''
}

function handleDrop(e) {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files && files.length > 0) acceptFile(files[0])
}

function clearFile() {
  resetAll()
  error.value = ''
  status.value = 'idle'
}

// ---------- ImageDecoder 生命周期 ----------
let gifDecoder = null
let gifFile = null
let openFrame = null // 尚未 close() 的 VideoFrame（卸载时兜底释放）

function closeOpenFrame() {
  if (openFrame) {
    try { openFrame.close() } catch (err) { /* 忽略 */ }
    openFrame = null
  }
}

function closeDecoder() {
  if (gifDecoder) {
    try { gifDecoder.close() } catch (err) { /* 忽略 */ }
    gifDecoder = null
  }
}

// 选中文件：解码元信息与每帧延时（逐帧按序 decode），解析完成后保留 decoder 供转换复用
async function loadGif(file) {
  if (typeof ImageDecoder === 'undefined') {
    status.value = 'error'
    error.value = 'GIF 解码依赖 WebCodecs ImageDecoder，当前浏览器不支持（需 Chrome/Edge 94+ 或 Safari 16.4+），请换用新版浏览器'
    return
  }
  probing.value = true
  gifFile = file
  fileName.value = file.name
  fileSize.value = file.size
  try {
    const buf = await file.arrayBuffer()
    const decoder = new ImageDecoder({ data: buf, type: 'image/gif' })
    await decoder.tracks.ready
    const track = decoder.tracks.selectedTrack
    const count = track && Number(track.frameCount) > 0 ? Number(track.frameCount) : 0
    if (!count) {
      closeDecoder()
      throw new Error('未能读取 GIF 帧数，文件可能已损坏或不被当前浏览器支持')
    }
    const delays = []
    let w = 0
    let h = 0
    for (let i = 0; i < count; i++) {
      const { image } = await decoder.decode({ frameIndex: i })
      if (i === 0) {
        w = image.displayWidth
        h = image.displayHeight
      }
      delays.push(frameDelayMsOf(image.duration))
      image.close()
    }
    if (!w || !h) {
      closeDecoder()
      throw new Error('未能读取 GIF 尺寸，文件可能已损坏')
    }
    closeDecoder()
    gifDecoder = decoder
    frameDelays.value = delays
    gifDims.value = { w, h }
    status.value = 'ready'
    await nextTick()
    drawPreview()
  } catch (err) {
    status.value = 'error'
    error.value = 'GIF 解析失败：' + (err && err.message ? err.message : '文件可能已损坏或不被当前浏览器支持')
  } finally {
    probing.value = false
  }
}

// 首帧预览：填背景 + 画第 0 帧（画布同时是录制源，转换时逐帧覆盖）
async function drawPreview() {
  const canvas = canvasEl.value
  const dec = gifDecoder
  if (!canvas || !dec || !gifDims.value.w) return
  try {
    const { image } = await dec.decode({ frameIndex: 0 })
    openFrame = image
    canvas.width = gifDims.value.w
    canvas.height = gifDims.value.h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = bgFill.value
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    image.close()
    openFrame = null
  } catch (err) { /* 预览失败不打断主流程 */ }
}

// ---------- 录制内部件 ----------
let recorder = null
let chunks = []
let aborted = false
let cancelled = false
let recordStream = null

function stopRecorderSafe() {
  if (recorder && recorder.state !== 'inactive') {
    try { recorder.stop() } catch (err) { /* 忽略 */ }
  }
}

function finishRecording() {
  stopRecorderSafe()
  recorder = null
  if (recordStream) {
    recordStream.getTracks().forEach((t) => {
      try { t.stop() } catch (err) { /* 忽略 */ }
    })
    recordStream = null
  }
}

function abortRecordingSilently() {
  if (!isBusy.value) return
  aborted = true
  cancelled = true
  stopRecorderSafe()
}

function cancelConvert() {
  if (!isBusy.value) return
  cancelled = true
  aborted = true
  stopRecorderSafe()
}

// setTimeout 按帧延时推进（rAF 在后台标签页会被暂停导致录制卡死，故用 setTimeout）
function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)))
}

// ---------- 主流程：逐帧解码 → 按帧延时绘制 → MediaRecorder 实时录制（用户手势触发） ----------
async function startConvert() {
  if (isBusy.value || probing.value) return
  const canvas = canvasEl.value
  if (!canvas || !frameCount.value || !gifDecoder) {
    status.value = 'error'
    error.value = '请先选择可解析的 GIF 文件'
    return
  }
  if (!decoderSupported.value) {
    status.value = 'error'
    error.value = '当前浏览器不支持 WebCodecs ImageDecoder，无法本地解码 GIF（需 Chrome/Edge 94+ 或 Safari 16.4+）'
    return
  }
  if (!canRecord.value) {
    status.value = 'error'
    error.value = '当前浏览器缺少 canvas.captureStream 或 MediaRecorder 能力，请更换新版 Chrome / Edge'
    return
  }
  error.value = ''
  clearResult()
  aborted = false
  cancelled = false
  status.value = 'processing'
  currentLoop.value = 0
  currentFrame.value = 0
  processedFrames.value = 0
  progress.value = 0

  const w = gifDims.value.w
  const h = gifDims.value.h
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = bgFill.value
  ctx.fillRect(0, 0, w, h)

  // 纯视频流：GIF 无音轨，仅 canvas 视频轨
  try {
    recordStream = canvas.captureStream(30)
    recorder = new MediaRecorder(recordStream, {
      mimeType: pickedMime.value.mime,
      videoBitsPerSecond: bitrateForGif(fileSize.value, estimatedOutputMs.value)
    })
  } catch (err) {
    finishRecording()
    status.value = 'error'
    error.value = '当前浏览器不支持创建视频录制器，请更换新版 Chrome / Edge 后重试'
    return
  }

  chunks = []
  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) chunks.push(ev.data)
  }
  recorder.onerror = () => {
    error.value = '录制出错：请保持页面在前台后重试'
    cancelled = true
    aborted = true
    stopRecorderSafe()
  }
  recorder.onstop = () => {
    finishRecording()
    closeOpenFrame()
    if (aborted) {
      chunks = []
      status.value = error.value ? 'error' : 'ready'
      return
    }
    if (!chunks.length) {
      status.value = 'error'
      error.value = '未录制到任何数据：请重试或更换浏览器'
      return
    }
    const blob = new Blob(chunks, { type: pickedMime.value.mime.split(';')[0] })
    chunks = []
    if (blob.size < 1024) {
      status.value = 'error'
      error.value = '录制结果异常（数据为空），请重试或更换新版浏览器'
      return
    }
    const ext = pickedMime.value.mime.includes('mp4') ? 'mp4' : 'webm'
    const base = (fileName.value || 'gif').replace(/\.gif$/i, '') || 'gif'
    resultUrl.value = URL.createObjectURL(blob)
    resultInfo.value = {
      name: `${base}.${ext}`,
      size: blob.size,
      loops: loopCount.value,
      durationMs: estimatedOutputMs.value,
      format: pickedMime.value.label
    }
    status.value = 'done'
  }

  // 逐帧按序解码 → 填背景 → 绘制 → 按该帧延时停留（墙钟锚定，解码耗时计入停留时间）
  recorder.start(1000)
  const loops = loopCount.value
  const total = totalFramesNeeded.value
  const startWall = performance.now()
  let target = startWall
  let processed = 0
  try {
    for (let loop = 1; loop <= loops; loop++) {
      if (cancelled) break
      currentLoop.value = loop
      for (let i = 0; i < frameCount.value; i++) {
        if (cancelled) break
        const { image } = await gifDecoder.decode({ frameIndex: i })
        if (cancelled) {
          image.close()
          break
        }
        openFrame = image
        ctx.fillStyle = bgFill.value
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(image, 0, 0, w, h)
        image.close()
        openFrame = null

        processed++
        currentFrame.value = i + 1
        processedFrames.value = processed
        progress.value = total > 0 ? processed / total : 0

        target += frameDelays.value[i]
        await sleepMs(target - performance.now())
      }
    }
    if (cancelled) {
      aborted = true
      stopRecorderSafe()
      return
    }
    stopRecorderSafe() // 正常完成：onstop 汇总结果
  } catch (err) {
    aborted = true
    closeOpenFrame()
    finishRecording()
    status.value = 'error'
    error.value = '转换失败：' + (err && err.message ? err.message : 'GIF 逐帧解码出错，请重试或更换文件')
  }
}

// 输出码率（bps）：按 GIF 体积均摊到输出时长推算，钳制 1~8 Mbps，异常时回退 2.5 Mbps
function bitrateForGif(fileSizeBytes, outputMs) {
  const b = Number(fileSizeBytes)
  const s = Number(outputMs) / 1000
  if (!isFinite(b) || !isFinite(s) || b <= 0 || s <= 0) return 2500000
  return Math.min(8000000, Math.max(1000000, Math.round((b * 8) / s)))
}

// ---------- 结果下载 ----------
function downloadResult() {
  if (!resultUrl.value || !resultInfo.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = resultInfo.value.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

onMounted(() => {
  // 能力检测仅在客户端 onMounted 执行（SSR 安全）
  decoderSupported.value = typeof ImageDecoder !== 'undefined'
  support.value = {
    recorder: typeof MediaRecorder !== 'undefined',
    capture: typeof HTMLCanvasElement !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function'
  }
  supportChecked.value = true
  const isSupported = (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function')
    ? (mime) => MediaRecorder.isTypeSupported(mime)
    : null
  pickedMime.value = pickMimeOf(isSupported)
})

onBeforeUnmount(() => {
  aborted = true
  cancelled = true
  closeOpenFrame()
  stopRecorderSafe()
  finishRecording()
  closeDecoder()
  clearResult()
})
</script>
