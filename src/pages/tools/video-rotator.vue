<template>
  <div class="max-w-8xl mx-auto">
    <!-- 隐 video 元素：仅用于本地解码（不可见但保持渲染），画面经 canvas 变换后预览/录制 -->
    <video
      v-if="videoUrl"
      ref="videoEl"
      :src="videoUrl"
      playsinline
      preload="auto"
      class="pointer-events-none fixed h-px w-px opacity-0"
      aria-hidden="true"
      tabindex="-1"
      @loadedmetadata="onLoadedMetadata"
      @loadeddata="onLoadedData"
      @error="onVideoError"
      @timeupdate="onTimeUpdate"
      @seeked="drawPreview"
      @pause="previewPlaying = false"
      @ended="onVideoEnded"
    ></video>

    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <RotateCw class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">视频旋转</h1>
          <p class="text-sm text-muted-foreground mt-1">旋转 90/180/270 度或镜像翻转，手机竖屏视频转横屏，本地处理不上传</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        在线视频旋转工具：选择本地视频后，可按顺时针 90° / 180° / 270° 旋转，并可叠加水平镜像、垂直镜像翻转，
        预览画布实时显示变换后的效果；点击开始后视频在本地播放一遍、逐帧重绘并同步重编码，输出与预览所见一致。
        全程在浏览器内完成，视频不会上传服务器。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：解码、旋转与重编码全部在本机完成，视频不会上传到任何服务器。
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧控制面板 -->
      <div class="space-y-6">
        <!-- 文件选择 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Upload class="w-5 h-5 mr-2 text-primary" /> 选择视频文件
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
              accept="video/*,.mp4,.webm,.mov,.m4v"
              class="hidden"
              @change="handleFileChange"
            />
            <p class="text-sm font-medium text-foreground">点击或拖入视频文件</p>
            <p class="text-xs text-muted-foreground mt-1">mp4 / webm / mov / m4v，文件仅在本地解码</p>
            <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <ShieldCheck class="w-3 h-3" /> 本地旋转，视频不上传
            </p>
          </div>
          <div v-if="fileName" class="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <Film class="w-4 h-4 text-primary flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
              <p class="text-[10px] text-muted-foreground">
                {{ formatSize(fileSize) }}<span v-if="duration"> · 时长 {{ formatTime(duration) }}</span><span v-if="videoSize.w"> · 原始 {{ videoSize.w }}×{{ videoSize.h }}</span>
              </p>
            </div>
            <button
              @click="clearFile"
              :disabled="status === 'processing'"
              class="p-1 text-muted-foreground hover:text-destructive disabled:opacity-40"
              title="移除"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <p v-if="bigFileHint" class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-start gap-1">
            <Info class="w-3 h-3 flex-shrink-0 mt-0.5" /> {{ bigFileHint }}
          </p>
        </div>

        <!-- 旋转与镜像设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 旋转与镜像
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">旋转角度（顺时针）</label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="r in rotationOptions"
                :key="r.deg"
                @click="rotation = r.deg"
                :disabled="status === 'processing'"
                :class="rotation === r.deg ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              >{{ r.label }}</button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label
              class="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
              :class="{ 'border-primary/60 bg-primary/5': mirrorH }"
            >
              <input
                v-model="mirrorH"
                type="checkbox"
                :disabled="status === 'processing'"
                class="w-4 h-4 rounded border border-border"
              />
              <FlipHorizontal2 class="w-4 h-4 text-primary flex-shrink-0" />
              <span class="text-sm text-foreground">水平镜像（左右翻转）</span>
            </label>
            <label
              class="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
              :class="{ 'border-primary/60 bg-primary/5': mirrorV }"
            >
              <input
                v-model="mirrorV"
                type="checkbox"
                :disabled="status === 'processing'"
                class="w-4 h-4 rounded border border-border"
              />
              <FlipVertical2 class="w-4 h-4 text-primary flex-shrink-0" />
              <span class="text-sm text-foreground">垂直镜像（上下翻转）</span>
            </label>
          </div>
          <p class="text-xs text-muted-foreground">镜像与旋转可叠加：先旋转、后镜像（镜像轴以输出画面为准），预览所见即输出所得。</p>

          <div class="flex items-center gap-2">
            <input
              v-model="keepAudio"
              type="checkbox"
              id="rotKeepAudio"
              :disabled="status === 'processing'"
              class="w-4 h-4 rounded border border-border"
            />
            <label for="rotKeepAudio" class="text-sm text-foreground">保留原声音轨（取消勾选则输出无声视频）</label>
          </div>

          <!-- 输出信息 -->
          <div class="bg-muted/50 rounded-lg p-3 space-y-1.5 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">变换组合</span>
              <span class="text-foreground font-medium">{{ transformLabel }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">输出尺寸</span>
              <span class="text-foreground font-medium font-mono">{{ outDims.w && outDims.h ? outDims.w + '×' + outDims.h : '选择视频后显示' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">输出格式</span>
              <span class="text-foreground font-medium">{{ mimeLabelText }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">视频码率</span>
              <span class="text-foreground font-medium">{{ Math.round(outBitrate / 1000) }} kbps（按原片推算）</span>
            </div>
            <div v-if="estBytes > 0" class="flex justify-between">
              <span class="text-muted-foreground">预计输出体积</span>
              <span class="text-foreground font-medium">约 {{ formatSize(estBytes) }}（估算值）</span>
            </div>
            <p class="text-[10px] text-muted-foreground flex items-start gap-1">
              <Info class="w-3 h-3 flex-shrink-0 mt-0.5" />
              旋转 90°/270° 时宽高互换；180° 与镜像不改变画面尺寸。
            </p>
          </div>
        </div>

        <!-- 开始处理 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <RotateCw class="w-5 h-5 mr-2 text-primary" /> 开始旋转
            </h2>
            <span class="px-2 py-0.5 rounded-full border border-border text-xs" :class="statusChipClass">{{ statusLabel }}</span>
          </div>

          <button
            @click="startProcessing"
            :disabled="!canStart"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Loader2 v-if="status === 'processing'" class="w-4 h-4 animate-spin" />
            <RotateCw v-else class="w-4 h-4" />
            {{ status === 'processing' ? '实时旋转中，请勿切换标签页' : '开始旋转（耗时≈视频时长）' }}
          </button>

          <button
            v-if="status === 'processing'"
            @click="stopProcessing"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-all"
          >
            停止并保存已录制部分
          </button>

          <!-- 进度条（实时录制，按播放进度计算） -->
          <div v-if="status === 'processing'">
            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full transition-all" :style="{ width: progressPct + '%' }"></div>
            </div>
            <p class="text-[10px] text-muted-foreground mt-1.5">
              已录制 {{ formatTime(recordedSeconds) }} / {{ formatTime(duration) }}（{{ progressPct }}%，实时录制：输出时长 = 源视频时长）
            </p>
          </div>

          <div v-if="error" class="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ error }}</span>
          </div>
          <div v-if="warnText" class="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg p-3">
            <Info class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ warnText }}</span>
          </div>

          <p class="text-[10px] text-muted-foreground leading-relaxed">
            方式说明：浏览器没有「一键改写视频方向」的 API，本工具采用实时重编码——视频播放一遍、画面逐帧按变换矩阵
            重绘到画布并同步录制，耗时约等于视频时长；输出优先 MP4（新版 Chrome / Safari 支持），否则为 WebM。
            录制期间请保持页面在前台。
          </p>
        </div>

        <!-- 浏览器不支持提示 -->
        <div v-if="supportChecked && !canRecord" class="bg-card border border-amber-500/40 rounded-lg p-4 space-y-2">
          <p class="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <TriangleAlert class="w-4 h-4" /> 当前浏览器不支持视频旋转导出
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            本工具依赖 canvas.captureStream 与 MediaRecorder 录制能力（新版 Chrome / Edge / Firefox / Safari 支持）。
            请更换浏览器后重试，或使用系统自带剪辑 App 旋转视频。
          </p>
        </div>
      </div>

      <!-- 右侧：预览与结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 变换效果预览 -->
        <div v-if="videoUrl" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center justify-between flex-wrap gap-2">
            <span class="flex items-center"><MonitorPlay class="w-5 h-5 mr-2 text-primary" /> 变换效果预览</span>
            <span v-if="status === 'processing'" class="text-xs font-normal text-amber-600 dark:text-amber-400">（正在实时录制，画面即输出）</span>
          </h2>
          <canvas ref="previewCanvas" class="block mx-auto max-w-full max-h-96 rounded-lg bg-black"></canvas>
          <div class="space-y-2">
            <input
              v-model.number="previewTime"
              type="range"
              min="0"
              :max="duration || 0"
              step="0.1"
              :disabled="status === 'processing' || !duration"
              @input="onScrub"
              class="w-full accent-primary"
            />
            <div class="flex items-center justify-between gap-3">
              <button
                @click="togglePreviewPlay"
                :disabled="status === 'processing' || !hasVideo"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-all disabled:opacity-40"
              >
                <Pause v-if="previewPlaying" class="w-4 h-4" />
                <Play v-else class="w-4 h-4" />
                {{ previewPlaying ? '暂停预览' : '播放预览' }}
              </button>
              <span class="text-xs text-muted-foreground font-mono">{{ formatTime(previewTime) }} / {{ formatTime(duration) }}</span>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">总时长</p>
              <p class="text-sm font-bold text-foreground font-mono">{{ formatTime(duration) }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">原始分辨率</p>
              <p class="text-sm font-bold text-foreground">{{ videoSize.w ? videoSize.w + '×' + videoSize.h : '—' }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">输出尺寸</p>
              <p class="text-sm font-bold text-primary font-mono">{{ outDims.w ? outDims.w + '×' + outDims.h : '—' }}</p>
            </div>
          </div>
        </div>

        <!-- 处理结果 -->
        <div v-if="resultUrl && resultInfo" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle2 class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" /> 旋转完成<span v-if="partial" class="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">（提前停止，输出为已录制部分）</span>
          </h2>
          <video :src="resultUrl" controls playsinline class="w-full max-h-96 rounded-lg bg-black"></video>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">输出尺寸</p>
              <p class="text-sm font-bold text-foreground font-mono">{{ outDims.w }}×{{ outDims.h }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">变换组合</p>
              <p class="text-sm font-bold text-foreground">{{ transformLabel }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">文件大小</p>
              <p class="text-sm font-bold text-green-600 dark:text-green-400">{{ formatSize(resultInfo.size) }}</p>
            </div>
          </div>
          <button
            @click="downloadResult"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Download class="w-4 h-4" /> 保存 {{ resultInfo.name }}
          </button>
        </div>

        <!-- 空状态 -->
        <div v-if="!videoUrl && !resultUrl" class="bg-card border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
          选择视频后，这里会显示旋转/镜像预览与导出结果
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于在线视频旋转</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            手机竖着拍的视频放到电脑或电视上就「躺倒」了、群里发横屏素材误拍了竖屏、拍摄时忘关竖屏锁定……
            这些都可以用「视频旋转」解决。本工具在浏览器里解码视频、逐帧重绘到画布并实时重编码，
            支持顺时针旋转 90 / 180 / 270 度，并可叠加水平镜像、垂直镜像翻转。
            视频自始至终不离开你的电脑，适合处理会议录屏、家庭视频等隐私内容。
          </p>

          <h3 class="text-lg font-semibold text-foreground">怎么旋转视频方向？</h3>
          <ol class="list-decimal list-inside space-y-1.5">
            <li>选择本地视频（建议 ≤200MB），右侧画布会立即显示变换后的预览画面；</li>
            <li>选择旋转角度：不旋转 / 顺时针 90° / 180° / 270°，按需勾选「水平镜像」或「垂直镜像」；</li>
            <li>拖动时间条或点「播放预览」核对各时间段的方向效果，决定是否保留原声；</li>
            <li>点「开始旋转」，处理耗时约等于视频时长，完成后即可下载 原名-rotated 文件。</li>
          </ol>

          <h3 class="text-lg font-semibold text-foreground">镜像与旋转叠加时，方向以哪个为准？</h3>
          <p>
            工具按「先旋转、后镜像」的顺序合成变换：先把画面旋转到位，再对结果做水平/垂直镜像，
            因此镜像轴始终对齐<b class="text-foreground">输出画面</b>的水平/垂直方向——预览画布里看到什么，
            导出就是什么，不用脑补坐标。例如「顺时针 90° + 水平镜像」：先顺时针转 90 度，再把转好的画面左右翻转。
          </p>

          <h3 class="text-lg font-semibold text-foreground">为什么 90° 旋转后画面宽高互换了？</h3>
          <p>
            旋转 90 度或 270 度时，画面的宽与高在几何上必然互换（横变竖、竖变横），180 度旋转与镜像则不改变尺寸。
            工具会自动换算输出分辨率并同步到预览画布，无需手动设置；输出码率按原片平均码率推算并钳制在 1–8 Mbps，
            正常观看几乎察觉不到重编码带来的画质差异。
          </p>

          <h3 class="text-lg font-semibold text-foreground">大视频怎么办？</h3>
          <p>
            超过 200MB 的视频在浏览器里实时重编码较慢且占用内存，建议先用站内
            <NuxtLink to="/tools/video-compressor/" class="text-primary hover:underline">视频压缩</NuxtLink>
            把体积降下来再旋转；若希望「无损改方向」（不重编码、只改旋转元数据），可以使用桌面端 FFmpeg 的
            transpose / hflip / vflip 滤镜，浏览器暂无对应的低成本 API。
          </p>

          <h3 class="text-lg font-semibold text-foreground">视频数据会上传吗？</h3>
          <p>
            不会。视频通过对象 URL（Blob URL）在浏览器内解码，旋转、镜像与重编码全部在本机完成，
            页面不会发出任何包含视频数据的网络请求，关闭或刷新页面后内存即释放。
          </p>

          <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
          <div class="space-y-4">
            <div>
              <h3 class="text-base font-semibold text-foreground">怎么把手机竖屏视频转成横屏？</h3>
              <p class="text-sm text-muted-foreground mt-1">选择视频后，在「旋转角度」里选顺时针 90° 或 270°，预览确认方向无误后点「开始旋转」，处理耗时约等于视频时长，完成后下载即可。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">旋转 90° 后画面宽高为什么互换了？</h3>
              <p class="text-sm text-muted-foreground mt-1">90 度与 270 度旋转会把画面宽高互换（横变竖、竖变横），180 度旋转尺寸不变，这是几何变换的必然结果，工具会自动换算输出尺寸。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">镜像和旋转可以叠加吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">可以。工具按「先旋转、后镜像」合成，镜像轴始终对齐输出画面的水平/垂直方向，预览画布所见即输出所得。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">旋转会损失画质吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">画面会经历一次解码-重编码，有轻微的画质世代损失；输出码率按原片平均码率推算（1–8 Mbps 钳制），正常观看几乎察觉不到。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">视频会上传到服务器吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">不会。视频在浏览器内存中解码、旋转与重编码，全程本地完成，不发任何网络请求，关闭页面即释放。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'video-rotator'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  RotateCw, FlipHorizontal2, FlipVertical2, Upload, X, Play, Pause, Download,
  TriangleAlert, CheckCircle2, ChevronUp, ChevronDown, Info, Loader2,
  Film, MonitorPlay, Settings2, ShieldCheck
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '视频旋转 - 在线旋转视频 90/180/270 度，手机竖屏视频转横屏',
  description: '免费在线视频旋转工具：顺时针旋转 90/180/270 度，可叠加水平/垂直镜像翻转，实时预览变换效果，本地重编码导出 MP4/WebM，视频不上传服务器',
  keywords: '视频旋转, 视频翻转, 手机视频转横屏, 竖屏转横屏, 视频镜像, 在线旋转视频',
  author: '有条工具',
  ogTitle: '视频旋转 - 在线旋转视频方向与镜像翻转 | 有条工具',
  ogDescription: '旋转 90/180/270 度或镜像翻转，手机竖屏视频转横屏，本地处理不上传。',
  ogUrl: 'https://www.util.cn/tools/video-rotator',
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
          name: '视频旋转',
          url: 'https://www.util.cn/tools/video-rotator',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['顺时针旋转 90/180/270 度', '水平镜像与垂直镜像翻转', '镜像与旋转可叠加', '实时预览变换效果', '输出尺寸自动换算', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '视频旋转', item: 'https://www.util.cn/tools/video-rotator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '怎么把手机竖屏视频转成横屏？',
              acceptedAnswer: { '@type': 'Answer', text: '选择视频后，在旋转角度里选顺时针90度或270度，预览确认方向无误后点开始旋转，处理耗时约等于视频时长，完成后下载即可。' }
            },
            {
              '@type': 'Question',
              name: '旋转 90° 后画面宽高为什么互换了？',
              acceptedAnswer: { '@type': 'Answer', text: '90度与270度旋转会把画面宽高互换（横变竖、竖变横），180度旋转尺寸不变，这是几何变换的必然结果，工具会自动换算输出尺寸。' }
            },
            {
              '@type': 'Question',
              name: '镜像和旋转可以叠加吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以。工具按先旋转、后镜像的顺序合成，镜像轴始终对齐输出画面的水平/垂直方向，预览画布所见即输出所得。' }
            },
            {
              '@type': 'Question',
              name: '旋转会损失画质吗？',
              acceptedAnswer: { '@type': 'Answer', text: '画面会经历一次解码-重编码，有轻微的画质世代损失；输出码率按原片平均码率推算（1-8 Mbps 钳制），正常观看几乎察觉不到。' }
            },
            {
              '@type': 'Question',
              name: '视频会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。视频在浏览器内存中解码、旋转与重编码，全程本地完成，不发任何网络请求，关闭页面即释放。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'video-rotator')

// ---------- 纯函数（node 自测覆盖） ----------
// 输出格式候选：优先 MP4（Chrome 126+ / Safari 支持 MediaRecorder 录制 mp4），降级 WebM
const MIME_CANDIDATES = [
  { mime: 'video/mp4;codecs=avc1,mp4a.40.2', label: 'MP4（H.264 + AAC）', ext: 'mp4' },
  { mime: 'video/webm;codecs=vp9,opus', label: 'WebM（VP9 + Opus）', ext: 'webm' },
  { mime: 'video/webm;codecs=vp8,opus', label: 'WebM（VP8 + Opus）', ext: 'webm' },
  { mime: 'video/webm', label: 'WebM（浏览器默认编码）', ext: 'webm' }
]

// 输出尺寸：顺时针旋转 90/270 度后宽高互换；0/180 度保持不变（镜像只翻转内容、不改尺寸）
function computeOutputSize(w, h, rotation) {
  const iw = Math.max(0, Math.round(Number(w) || 0))
  const ih = Math.max(0, Math.round(Number(h) || 0))
  const rot = ((Math.round(Number(rotation) || 0) % 360) + 360) % 360
  if (rot === 90 || rot === 270) return { w: ih, h: iw }
  return { w: iw, h: ih }
}

// 依次探测支持的输出格式，返回命中的候选项；全不支持或探测函数无效返回 null
function pickMimeOf(isSupported) {
  if (typeof isSupported !== 'function') return null
  for (let i = 0; i < MIME_CANDIDATES.length; i++) {
    if (isSupported(MIME_CANDIDATES[i].mime)) return MIME_CANDIDATES[i]
  }
  return null
}

// 输出码率（bps）：按原片平均码率（字节×8÷秒）推算，钳制 1～8 Mbps，异常时回退 2.5 Mbps
function bitrateOfSource(fileSizeBytes, durationSec) {
  const b = Number(fileSizeBytes)
  const d = Number(durationSec)
  if (!isFinite(b) || !isFinite(d) || b <= 0 || d <= 0) return 2500000
  return Math.min(8000000, Math.max(1000000, Math.round((b * 8) / d)))
}

// 输出文件名：原名-rotated.扩展名（无扩展名输入时回退 video）
function buildOutputName(baseName, suffix, ext) {
  const base = String(baseName || 'video').replace(/\.[^.]+$/, '') || 'video'
  return `${base}-${suffix}.${ext || 'webm'}`
}
// ---------- 纯函数结束 ----------

const MAX_FPS = 30                    // canvas.captureStream 采集帧率
const SOFT_LIMIT_BYTES = 200 * 1024 * 1024  // 大文件提醒阈值 200MB
const HARD_LIMIT_BYTES = 1024 * 1024 * 1024 // 硬上限 1GB（内存安全）

const formatTime = (sec) => {
  const s = Math.max(0, Math.floor(Number(sec) || 0))
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}:${r < 10 ? '0' : ''}${r}`
}

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 状态 ----------
const fileInput = ref(null)
const videoEl = ref(null)
const previewCanvas = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const videoUrl = ref('')
const duration = ref(0)
const videoSize = ref({ w: 0, h: 0 })
const isDragging = ref(false)
const error = ref('')
const warnText = ref('')
const partial = ref(false)

const rotation = ref(0)
const mirrorH = ref(false)
const mirrorV = ref(false)
const keepAudio = ref(true)
const previewTime = ref(0)
const previewPlaying = ref(false)

// 状态机：idle（未选视频）→ ready（就绪）→ processing（实时录制中）→ done / error
const status = ref('idle')
const recordedSeconds = ref(0)

const resultUrl = ref('')
const resultInfo = ref(null) // { name, size }

const supportChecked = ref(false)
const support = ref({ recorder: false, capture: false })
const pickedMime = ref(null) // { mime, label, ext }

const seoContentVisible = ref(true)

// 非响应式录制内部件
let recorder = null
let chunks = []
let rafId = 0
let rvfcId = 0
let aborted = false
let recordStream = null // 本次录制自建的 canvas 采集流（结束时须 stop 释放）
// AudioContext 音频图：元素音频 → 录制支路（MediaStreamDestination）+ 监听支路（扬声器）
// MediaElementSource 与 video 元素一一绑定，创建后复用，仅在组件卸载时销毁
let audioCtx = null
let audioSrcNode = null
let audioDestNode = null

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const rotationOptions = [
  { deg: 0, label: '不旋转' },
  { deg: 90, label: '90°' },
  { deg: 180, label: '180°' },
  { deg: 270, label: '270°' }
]

const STATUS_LABELS = { idle: '待选择视频', ready: '已就绪', processing: '处理中', done: '已完成', error: '出错' }

// ---------- 计算属性 ----------
const hasVideo = computed(() => !!videoUrl.value && duration.value > 0)
const canRecord = computed(() => support.value.recorder && support.value.capture && !!pickedMime.value)
const canStart = computed(() => hasVideo.value && canRecord.value && status.value !== 'processing')
const outDims = computed(() => computeOutputSize(videoSize.value.w, videoSize.value.h, rotation.value))
const outBitrate = computed(() => bitrateOfSource(fileSize.value, duration.value))
const estBytes = computed(() => {
  if (!duration.value) return 0
  const audioBps = keepAudio.value ? 128000 : 0
  return Math.round(((outBitrate.value + audioBps) * duration.value) / 8)
})
const progressPct = computed(() => (duration.value > 0 ? Math.min(100, Math.round((recordedSeconds.value / duration.value) * 100)) : 0))
const mimeLabelText = computed(() => (pickedMime.value ? pickedMime.value.label : (supportChecked.value ? '当前浏览器不支持' : '检测中…')))
const outputExt = computed(() => (pickedMime.value ? pickedMime.value.ext : 'webm'))
const blobType = computed(() => (pickedMime.value ? pickedMime.value.mime.split(';')[0] : 'video/webm'))
const statusLabel = computed(() => STATUS_LABELS[status.value] || status.value)
const statusChipClass = computed(() => {
  if (status.value === 'processing') return 'text-amber-600 dark:text-amber-400'
  if (status.value === 'done') return 'text-green-600 dark:text-green-400'
  if (status.value === 'error') return 'text-destructive'
  return 'text-muted-foreground'
})
const transformLabel = computed(() => {
  const parts = []
  parts.push(rotation.value > 0 ? `顺时针${rotation.value}°` : '不旋转')
  if (mirrorH.value) parts.push('水平镜像')
  if (mirrorV.value) parts.push('垂直镜像')
  return parts.join(' + ')
})
const bigFileHint = computed(() => {
  if (fileSize.value > SOFT_LIMIT_BYTES) {
    return `当前文件约 ${formatSize(fileSize.value)}：浏览器实时重编码大文件较慢且占用内存，建议先用视频压缩工具压到 200MB 以内。`
  }
  return ''
})

// 选项变化：同步画布尺寸并重绘预览（录制中已锁定选项，不响应）
watch([rotation, mirrorH, mirrorV], () => {
  if (status.value === 'processing') return
  syncPreviewCanvas()
  drawPreview()
})

// ---------- 文件选择（SSR 安全：对象 URL 仅在用户回调内创建） ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

function clearResult() {
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = ''
  resultInfo.value = null
  partial.value = false
}

function resetAll() {
  stopRecorderSafe()
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  videoUrl.value = ''
  fileName.value = ''
  fileSize.value = 0
  duration.value = 0
  videoSize.value = { w: 0, h: 0 }
  previewTime.value = 0
  previewPlaying.value = false
  recordedSeconds.value = 0
  clearResult()
}

function acceptFile(f) {
  if (!f) return
  if (status.value === 'processing') {
    error.value = '正在处理，请先停止后再更换视频'
    return
  }
  error.value = ''
  warnText.value = ''
  const typeOk = !f.type || f.type.startsWith('video/')
  const name = (f.name || '').toLowerCase()
  const extOk = ['.mp4', '.webm', '.mov', '.m4v'].some((ext) => name.endsWith(ext))
  if (!typeOk && !extOk) {
    error.value = '请选择视频文件（mp4 / webm / mov 等）'
    return
  }
  if (f.size > HARD_LIMIT_BYTES) {
    error.value = '视频超过 1GB：浏览器本地重编码容易内存不足，请先用视频压缩工具压小后再旋转'
    return
  }
  resetAll()
  fileName.value = f.name
  fileSize.value = f.size
  videoUrl.value = URL.createObjectURL(f)
  status.value = 'ready'
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
  warnText.value = ''
  status.value = 'idle'
}

// ---------- 视频元信息与预览同步 ----------
function onLoadedMetadata() {
  const v = videoEl.value
  if (!v) return
  duration.value = isFinite(v.duration) ? v.duration : 0
  videoSize.value = { w: v.videoWidth, h: v.videoHeight }
  previewTime.value = 0
  syncPreviewCanvas()
}

function onLoadedData() {
  // 首帧数据就绪：画第一帧静态预览
  syncPreviewCanvas()
  drawPreview()
}

function onVideoError() {
  if (!videoUrl.value) return
  status.value = 'error'
  error.value = '视频无法在浏览器中解码播放（编码不受支持），请尝试 mp4（H.264）或 webm 格式'
}

function onTimeUpdate() {
  const v = videoEl.value
  if (!v) return
  previewTime.value = v.currentTime
  if (status.value === 'processing') {
    recordedSeconds.value = Math.min(v.currentTime, duration.value || v.currentTime)
  }
  // 播放中同步刷新变换预览
  drawPreview()
}

function onVideoEnded() {
  previewPlaying.value = false
  // 自然播完：收尾录制（非手动停止，不标记 partial）
  if (status.value === 'processing') {
    partial.value = false
    stopRecorderSafe()
  }
}

// ---------- 预览控制 ----------
async function togglePreviewPlay() {
  const v = videoEl.value
  if (!v || !hasVideo.value || status.value === 'processing') return
  if (previewPlaying.value) {
    v.pause()
    return
  }
  try {
    await v.play()
    previewPlaying.value = true
  } catch (err) {
    error.value = '预览播放失败，请重试'
  }
}

function onScrub() {
  const v = videoEl.value
  if (!v || status.value === 'processing') return
  const t = Math.max(0, Math.min(Number(previewTime.value) || 0, duration.value || 0))
  v.currentTime = t
}

// ---------- 变换绘制（预览与录制共用同一变换） ----------
function syncPreviewCanvas() {
  const c = previewCanvas.value
  if (!c) return
  const out = outDims.value
  if (out.w > 0 && out.h > 0 && (c.width !== out.w || c.height !== out.h)) {
    c.width = out.w
    c.height = out.h
  }
}

// 将视频当前帧按「旋转 + 镜像」绘制到目标画布
function drawTransformed(ctx, video) {
  const w = video.videoWidth
  const h = video.videoHeight
  if (!w || !h) return
  ctx.save()
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  // 先把坐标原点移到输出画布中心，再叠加镜像与旋转
  ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2)
  // 叠加顺序说明：canvas 变换矩阵按「后设置者先作用于像素」合成（此处 CTM = T·S·R），
  // 因此先调用 scale（镜像）、再调用 rotate（旋转），等价于对画面内容「先旋转、后镜像」——
  // 镜像轴始终对齐输出画面的水平/垂直方向，与预览所见一致。
  ctx.scale(mirrorH.value ? -1 : 1, mirrorV.value ? -1 : 1)
  ctx.rotate((Number(rotation.value) * Math.PI) / 180)
  ctx.drawImage(video, -w / 2, -h / 2, w, h)
  ctx.restore()
}

function drawPreview() {
  const c = previewCanvas.value
  const v = videoEl.value
  if (!c || !v) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  if (!v.videoWidth || !v.videoHeight) {
    ctx.clearRect(0, 0, c.width, c.height)
    return
  }
  try {
    drawTransformed(ctx, v)
  } catch (err) { /* 首帧未就绪时忽略 */ }
}

// ---------- seek 定位（seeked 事件 + 1.5 秒超时兜底） ----------
function seekTo(video, t) {
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      video.removeEventListener('seeked', onSeeked)
      clearTimeout(timer)
      resolve()
    }
    const onSeeked = () => requestAnimationFrame(finish)
    const timer = setTimeout(finish, 1500)
    video.addEventListener('seeked', onSeeked)
    video.currentTime = t
  })
}

// ---------- 音轨获取：AudioContext 从 video 元素分流（录制支路 + 监听支路） ----------
function ensureAudioGraph(video) {
  if (audioCtx && audioCtx.state !== 'closed' && audioSrcNode && audioDestNode) {
    if (audioCtx.state === 'suspended') audioCtx.resume()
    return true
  }
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (typeof Ctx !== 'function') return false
    teardownAudioGraph()
    audioCtx = new Ctx()
    audioSrcNode = audioCtx.createMediaElementSource(video)
    audioDestNode = audioCtx.createMediaStreamDestination()
    audioSrcNode.connect(audioDestNode)        // 录制支路：供 MediaRecorder 采集
    audioSrcNode.connect(audioCtx.destination) // 监听支路：保持预览/录制期间可听见
    return true
  } catch (err) {
    teardownAudioGraph()
    return false
  }
}

function teardownAudioGraph() {
  if (audioCtx && audioCtx.state !== 'closed') {
    try { audioCtx.close() } catch (err) { /* 忽略 */ }
  }
  audioCtx = null
  audioSrcNode = null
  audioDestNode = null
}

// ---------- 逐帧绘制循环 ----------
function pumpFrame() {
  if (status.value !== 'processing') return
  const c = previewCanvas.value
  const v = videoEl.value
  if (c && v) {
    const ctx = c.getContext('2d')
    if (ctx) {
      try {
        drawTransformed(ctx, v)
      } catch (err) { /* 单帧绘制失败不中断录制 */ }
    }
  }
  if (!v) return
  if (typeof v.requestVideoFrameCallback === 'function') {
    rvfcId = v.requestVideoFrameCallback(() => pumpFrame())
  } else {
    rafId = requestAnimationFrame(() => pumpFrame())
  }
}

function stopPump() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  const v = videoEl.value
  if (rvfcId && v && typeof v.cancelVideoFrameCallback === 'function') {
    try { v.cancelVideoFrameCallback(rvfcId) } catch (err) { /* 忽略 */ }
  }
  rvfcId = 0
}

function stopRecorderSafe() {
  if (recorder && recorder.state !== 'inactive') {
    try { recorder.stop() } catch (err) { /* 忽略 */ }
  }
}

// 手动停止：保留已录制的部分并产出结果（partial 标记在结果标题中提示）
function stopProcessing() {
  if (status.value !== 'processing') return
  partial.value = true
  const v = videoEl.value
  if (v) recordedSeconds.value = Math.min(v.currentTime, duration.value || v.currentTime)
  stopRecorderSafe()
}

// 录制结束后的统一恢复（recorder.onstop / 卸载兜底调用）
function finishProcessing() {
  stopPump()
  stopRecorderSafe()
  recorder = null
  if (recordStream) {
    recordStream.getTracks().forEach((t) => {
      try { t.stop() } catch (err) { /* 忽略 */ }
    })
    recordStream = null
  }
  const v = videoEl.value
  if (v) {
    v.pause()
    v.muted = false
  }
  previewPlaying.value = false
  recordedSeconds.value = 0
}

function onRecorderStop() {
  finishProcessing()
  if (aborted) {
    chunks = []
    if (!error.value) error.value = '处理已中断，未保存结果。'
    status.value = 'error'
    return
  }
  if (!chunks.length) {
    status.value = 'error'
    error.value = '未录制到任何数据：视频可能未能播放，请重试或更换浏览器'
    return
  }
  const blob = new Blob(chunks, { type: blobType.value })
  chunks = []
  if (blob.size < 1024) {
    status.value = 'error'
    error.value = '录制结果异常（数据为空），请重试或更换新版浏览器'
    return
  }
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = URL.createObjectURL(blob)
  resultInfo.value = {
    name: buildOutputName(fileName.value, 'rotated', outputExt.value),
    size: blob.size
  }
  status.value = 'done'
}

// ---------- 主流程：实时录制旋转（用户手势触发） ----------
async function startProcessing() {
  const video = videoEl.value
  if (!video || !hasVideo.value) {
    error.value = '请先选择可在浏览器中播放的视频文件'
    return
  }
  if (status.value === 'processing') return // 防重复点击
  if (!canRecord.value) {
    error.value = '当前浏览器缺少 canvas.captureStream 或 MediaRecorder 能力，请更换新版 Chrome / Edge / Safari'
    return
  }
  error.value = ''
  warnText.value = ''
  clearResult()
  status.value = 'processing'
  recordedSeconds.value = 0
  partial.value = false
  aborted = false
  try {
    video.pause()
    video.muted = !keepAudio.value
    await seekTo(video, 0)
    if (aborted) {
      finishProcessing()
      status.value = 'error'
      return
    }
    syncPreviewCanvas()
    const c = previewCanvas.value
    if (!c || !c.width || !c.height) throw new Error('画布未就绪，请重试')
    const ctx = c.getContext('2d')
    // 先画一帧，避免录制开头出现空帧
    try { drawTransformed(ctx, video) } catch (err) { /* 首帧可能尚未就绪 */ }

    // 视频轨：预览画布的采集流（预览即输出）
    recordStream = c.captureStream(MAX_FPS)
    const tracks = recordStream.getVideoTracks().slice()
    if (keepAudio.value) {
      const at = ensureAudioGraph(video) ? audioDestNode.stream.getAudioTracks() : []
      if (at && at.length) {
        tracks.push(...at)
      } else {
        warnText.value = '未能获取音轨（视频可能无声或浏览器限制），本次输出为无声视频。'
      }
    }

    try {
      recorder = new MediaRecorder(new MediaStream(tracks), {
        mimeType: pickedMime.value.mime,
        videoBitsPerSecond: outBitrate.value,
        audioBitsPerSecond: 128000
      })
    } catch (err) {
      finishProcessing()
      status.value = 'error'
      error.value = '当前浏览器不支持创建视频录制器，请更换新版 Chrome / Edge 后重试'
      return
    }
    chunks = []
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data)
    }
    recorder.onerror = () => {
      error.value = '录制出错：请确认视频可正常播放，并保持页面在前台后重试'
      aborted = true
      stopRecorderSafe()
    }
    recorder.onstop = onRecorderStop
    recorder.start(1000)
    pumpFrame()
    await video.play()
    previewPlaying.value = true
  } catch (err) {
    // 启动半途失败按中断收尾：置 aborted 使 onstop 丢弃已录分片，避免产出不完整结果
    aborted = true
    stopRecorderSafe()
    finishProcessing()
    status.value = 'error'
    error.value = '处理失败：' + (err && err.message ? err.message : '视频未能自动播放，请点击播放按钮后重新开始')
  }
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
  if (tool) addRecentTool(tool.id)
  // 能力检测仅在客户端 onMounted 执行（SSR 安全）
  support.value = {
    recorder: typeof MediaRecorder !== 'undefined',
    capture: typeof HTMLCanvasElement !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function'
  }
  const isSupported = (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function')
    ? (mime) => MediaRecorder.isTypeSupported(mime)
    : null
  pickedMime.value = pickMimeOf(isSupported)
  supportChecked.value = true
})

onBeforeUnmount(() => {
  aborted = true
  stopRecorderSafe()
  finishProcessing()
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  clearResult()
  teardownAudioGraph()
})
</script>
