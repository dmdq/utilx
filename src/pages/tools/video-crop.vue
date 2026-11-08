<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- 隐 video 元素：仅用于本地解码（不可见但保持渲染），画面按裁剪框重绘后预览/录制 -->
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
      @seeked="drawAll"
      @pause="previewPlaying = false"
      @ended="onVideoEnded"
    ></video>

    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Crop class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">视频画面裁剪</h1>
          <p class="text-sm text-muted-foreground mt-1">裁掉画面边缘区域重新构图：预设比例 + 拖拽框选 + 精确坐标，本地处理不上传</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        在线视频画面裁剪工具（空间裁剪）：去掉视频边缘的黑边、多余背景或水印区域，重新调整画面构图。
        支持预设比例（16:9 / 9:16 / 1:1 / 4:3 / 自由）、在预览画布上直接拖拽框选，以及 x / y / 宽 / 高
        数字输入精确调整，三者联动并自动钳制在源画面内。输出为裁剪区域的原尺寸画面（裁多大出多大、不缩放），
        点击开始后视频在本地播放一遍、逐帧裁剪重绘并同步重编码。全程在浏览器内完成，视频不会上传服务器。
        若需按时间段截取（去头去尾），请使用站内视频裁剪器。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：解码、裁剪与重编码全部在本机完成，视频不会上传到任何服务器。
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
              <ShieldCheck class="w-3 h-3" /> 本地裁剪，视频不上传
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

        <!-- 裁剪设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Frame class="w-5 h-5 mr-2 text-primary" /> 裁剪设置
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">预设比例</label>
            <div class="grid grid-cols-5 gap-1.5">
              <button
                v-for="r in ratioOptions"
                :key="r.id"
                @click="selectRatio(r)"
                :disabled="status === 'processing' || !hasVideo"
                :class="ratioId === r.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              >{{ r.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              选择比例后裁剪框自动取该比例的最大居中框；「自由」不锁定比例，可任意框选。
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">精确调整（像素，源画面坐标系）</label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2">
                <span class="text-xs text-muted-foreground flex-shrink-0">X</span>
                <input
                  v-model.number="crop.x"
                  type="number"
                  min="0"
                  :max="videoSize.w || 0"
                  step="1"
                  :disabled="status === 'processing' || !hasVideo"
                  @change="applyCropInputs('x')"
                  class="w-full bg-transparent text-sm text-foreground outline-none disabled:opacity-50"
                />
              </label>
              <label class="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2">
                <span class="text-xs text-muted-foreground flex-shrink-0">Y</span>
                <input
                  v-model.number="crop.y"
                  type="number"
                  min="0"
                  :max="videoSize.h || 0"
                  step="1"
                  :disabled="status === 'processing' || !hasVideo"
                  @change="applyCropInputs('y')"
                  class="w-full bg-transparent text-sm text-foreground outline-none disabled:opacity-50"
                />
              </label>
              <label class="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2">
                <span class="text-xs text-muted-foreground flex-shrink-0">宽</span>
                <input
                  v-model.number="crop.w"
                  type="number"
                  min="16"
                  :max="videoSize.w || 0"
                  step="1"
                  :disabled="status === 'processing' || !hasVideo"
                  @change="applyCropInputs('w')"
                  class="w-full bg-transparent text-sm text-foreground outline-none disabled:opacity-50"
                />
              </label>
              <label class="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2">
                <span class="text-xs text-muted-foreground flex-shrink-0">高</span>
                <input
                  v-model.number="crop.h"
                  type="number"
                  min="16"
                  :max="videoSize.h || 0"
                  step="1"
                  :disabled="status === 'processing' || !hasVideo"
                  @change="applyCropInputs('h')"
                  class="w-full bg-transparent text-sm text-foreground outline-none disabled:opacity-50"
                />
              </label>
            </div>
            <div class="flex items-center justify-between mt-2">
              <p class="text-xs text-muted-foreground">拖拽框选、预设比例与数字输入三方联动，越界自动钳制回画面内。</p>
              <button
                @click="resetCropToFull"
                :disabled="status === 'processing' || !hasVideo"
                class="flex-shrink-0 ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
              >
                <RefreshCw class="w-3 h-3" /> 全画面
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="keepAudio"
              type="checkbox"
              id="cropKeepAudio"
              :disabled="status === 'processing'"
              class="w-4 h-4 rounded border border-border"
            />
            <label for="cropKeepAudio" class="text-sm text-foreground">保留原声音轨（取消勾选则输出无声视频）</label>
          </div>

          <!-- 输出信息 -->
          <div class="bg-muted/50 rounded-lg p-3 space-y-1.5 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">源分辨率</span>
              <span class="text-foreground font-medium font-mono">{{ videoSize.w ? videoSize.w + '×' + videoSize.h : '选择视频后显示' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">裁剪区域</span>
              <span class="text-foreground font-medium font-mono">{{ cropLabel }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">输出尺寸（裁多大出多大）</span>
              <span class="text-primary font-medium font-mono">{{ crop.w > 0 ? crop.w + '×' + crop.h : '—' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">保留画面</span>
              <span class="text-foreground font-medium">{{ keptPct }}%</span>
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
              裁剪区域按原尺寸输出、不缩放不放大；裁掉的部分不再参与编码，画面构图由你决定。
            </p>
          </div>
        </div>

        <!-- 开始处理 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Crop class="w-5 h-5 mr-2 text-primary" /> 开始裁剪
            </h2>
            <span class="px-2 py-0.5 rounded-full border border-border text-xs" :class="statusChipClass">{{ statusLabel }}</span>
          </div>

          <button
            @click="startProcessing"
            :disabled="!canStart"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Loader2 v-if="status === 'processing'" class="w-4 h-4 animate-spin" />
            <Crop v-else class="w-4 h-4" />
            {{ status === 'processing' ? '实时裁剪中，请勿切换标签页' : '开始裁剪（耗时≈视频时长）' }}
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
            方式说明：浏览器没有「离线裁剪视频」的 API，本工具采用实时重编码——视频播放一遍、画面逐帧按裁剪框
            裁剪重绘到画布并同步录制，耗时约等于视频时长；输出优先 MP4（新版 Chrome / Safari 支持），否则为 WebM。
            录制期间裁剪框已锁定，请保持页面在前台。
          </p>
        </div>

        <!-- 浏览器不支持提示 -->
        <div v-if="supportChecked && !canRecord" class="bg-card border border-amber-500/40 rounded-lg p-4 space-y-2">
          <p class="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <TriangleAlert class="w-4 h-4" /> 当前浏览器不支持视频裁剪导出
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            本工具依赖 canvas.captureStream 与 MediaRecorder 录制能力（新版 Chrome / Edge / Firefox / Safari 支持）。
            请更换浏览器后重试，或使用桌面端剪辑软件裁剪画面。
          </p>
        </div>
      </div>

      <!-- 右侧：预览与结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 裁剪框选预览 -->
        <div v-if="videoUrl" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center justify-between flex-wrap gap-2">
            <span class="flex items-center"><SquareDashedMousePointer class="w-5 h-5 mr-2 text-primary" /> 源画面 · 拖拽框选裁剪区域</span>
            <span v-if="status === 'processing'" class="text-xs font-normal text-amber-600 dark:text-amber-400">（正在实时录制，裁剪框内即输出）</span>
          </h2>
          <canvas
            ref="previewCanvas"
            class="block mx-auto max-w-full max-h-96 rounded-lg bg-black cursor-crosshair select-none"
            style="touch-action: none"
            @pointerdown.prevent="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup.prevent="onPointerUp"
            @pointercancel="onPointerUp"
          ></canvas>
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
        </div>

        <!-- 输出画面预览（录制源画布） -->
        <div v-if="videoUrl" class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <MonitorPlay class="w-5 h-5 mr-2 text-primary" /> 输出画面预览
            <span class="ml-2 text-xs font-normal text-muted-foreground">（裁剪框内内容，所见即所得）</span>
          </h2>
          <canvas ref="recordCanvas" class="block mx-auto max-w-full max-h-56 rounded-lg bg-black"></canvas>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">总时长</p>
              <p class="text-sm font-bold text-foreground font-mono">{{ formatTime(duration) }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">源分辨率</p>
              <p class="text-sm font-bold text-foreground">{{ videoSize.w ? videoSize.w + '×' + videoSize.h : '—' }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">输出尺寸</p>
              <p class="text-sm font-bold text-primary font-mono">{{ crop.w ? crop.w + '×' + crop.h : '—' }}</p>
            </div>
          </div>
        </div>

        <!-- 处理结果 -->
        <div v-if="resultUrl && resultInfo" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle2 class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" /> 裁剪完成<span v-if="partial" class="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">（提前停止，输出为已录制部分）</span>
          </h2>
          <video :src="resultUrl" controls playsinline class="w-full max-h-96 rounded-lg bg-black"></video>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">输出尺寸</p>
              <p class="text-sm font-bold text-foreground font-mono">{{ crop.w }}×{{ crop.h }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">裁剪区域</p>
              <p class="text-sm font-bold text-foreground font-mono">{{ cropLabel }}</p>
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
          选择视频后，这里会显示裁剪框选预览、输出画面与导出结果
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于在线视频画面裁剪</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            视频两侧有黑边、拍了太多无关背景想把主体放大居中、横屏素材想裁成竖屏发短视频、画面边缘拍进了杂物或水印……
            这些都属于「画面构图」问题，用「视频画面裁剪」（空间裁剪）解决：把不需要的边缘区域裁掉，
            只保留你想留的那一块画面。本工具在浏览器里解码视频、逐帧按裁剪框裁剪重绘到画布并实时重编码，
            输出为裁剪区域的原尺寸画面。视频自始至终不离开你的电脑，适合处理会议录屏、家庭视频等隐私内容。
          </p>

          <h3 class="text-lg font-semibold text-foreground">画面裁剪与时间段裁剪有什么区别？</h3>
          <p>
            两者是互补关系：<b class="text-foreground">画面裁剪处理「空间」</b>——每帧保留画面的哪一块区域（去黑边、改构图、
            竖屏化），视频时长不变；站内
            <NuxtLink to="/tools/video-trimmer/" class="text-primary hover:underline">视频裁剪器</NuxtLink>
            处理「时间」——保留视频的哪一段（去头去尾截取片段），画面内容不变。如果两者都需要，
            建议先用画面裁剪确定构图、再用时间段裁剪截取范围（或反过来），互不影响。
          </p>

          <h3 class="text-lg font-semibold text-foreground">怎么裁剪视频画面？</h3>
          <ol class="list-decimal list-inside space-y-1.5">
            <li>选择本地视频（建议 ≤200MB），右侧会显示源画面与默认的全画面裁剪框；</li>
            <li>选预设比例（16:9 / 9:16 / 1:1 / 4:3 / 自由）自动生成该比例的最大居中框，或在预览画布上直接拖拽框选，也可以用 X / Y / 宽 / 高 数字输入精确调整——三者联动，越界自动钳制回画面内（最小 16px）；</li>
            <li>拖动时间条或播放预览，确认裁剪范围在整个时间段都合适；</li>
            <li>点「开始裁剪」，处理耗时约等于视频时长，完成后即可下载 原名-cropped 文件。</li>
          </ol>

          <h3 class="text-lg font-semibold text-foreground">裁剪后会损失画质吗？输出分辨率为什么变小？</h3>
          <p>
            输出严格等于裁剪区域的<b class="text-foreground">原尺寸</b>（裁 640×360 就输出 640×360），不做缩放放大；
            输出分辨率小于原视频是裁剪的必然结果——裁掉的部分不再参与编码。画质方面，画面会经历一次解码-重编码，
            有轻微的画质世代损失；输出码率按原片平均码率推算并钳制在 1–8 Mbps，
            而同样的码率分给更小的画面，单位面积的画质反而通常更好。
          </p>

          <h3 class="text-lg font-semibold text-foreground">大视频怎么办？</h3>
          <p>
            超过 200MB 的视频在浏览器里实时重编码较慢且占用内存，建议先用站内
            <NuxtLink to="/tools/video-compressor/" class="text-primary hover:underline">视频压缩</NuxtLink>
            把体积降下来再裁剪；若还想调整画面方向（旋转 / 镜像），可以配合站内
            <NuxtLink to="/tools/video-rotator/" class="text-primary hover:underline">视频旋转</NuxtLink>
            使用。对裁剪精度要求极高的专业场景，也可以使用桌面端剪辑软件处理。
          </p>

          <h3 class="text-lg font-semibold text-foreground">视频数据会上传吗？</h3>
          <p>
            不会。视频通过对象 URL（Blob URL）在浏览器内解码，框选、裁剪与重编码全部在本机完成，
            页面不会发出任何包含视频数据的网络请求，关闭或刷新页面后内存即释放。
          </p>

          <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
          <div class="space-y-4">
            <div>
              <h3 class="text-base font-semibold text-foreground">怎么裁剪视频画面？</h3>
              <p class="text-sm text-muted-foreground mt-1">选择视频后，用预设比例、拖拽框选或 X/Y/宽/高 数字输入确定裁剪框（三者联动、自动钳制），预览确认后点「开始裁剪」，耗时约等于视频时长，完成后下载即可。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">画面裁剪和视频裁剪器有什么区别？</h3>
              <p class="text-sm text-muted-foreground mt-1">本工具是空间裁剪：改每帧画面的构图（去黑边、竖屏化），时长不变；站内视频裁剪器是时间裁剪：截取某一段（去头去尾），画面内容不变。两者可配合使用。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">横屏视频能裁成竖屏吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">能。选择 9:16 预设，工具会自动取源画面内最大的竖屏居中框，也可以拖拽或输入精确调整位置；输出为该区域的竖屏画面，适合发短视频平台。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">裁剪后会损失画质吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">输出为裁剪区域原尺寸、不缩放；画面经历一次解码-重编码有轻微世代损失，输出码率按原片推算（1–8 Mbps 钳制），更小的画面分到同等码率，单位面积画质通常更好。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">视频会上传到服务器吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">不会。视频在浏览器内存中解码、裁剪与重编码，全程本地完成，不发任何网络请求，关闭页面即释放。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'video-crop'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Crop, Frame, SquareDashedMousePointer, MonitorPlay, Upload, X, Play, Pause, Download,
  TriangleAlert, CheckCircle2, ChevronUp, ChevronDown, Info, Loader2,
  Film, RefreshCw, ShieldCheck
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const tool = tools.find((t) => t.id === 'video-crop')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- SEO ----------
useSeoMeta({
  title: '视频画面裁剪 - 在线裁剪视频画面尺寸，视频去黑边改构图工具',
  description: '免费在线视频画面裁剪工具：预设 16:9/9:16/1:1/4:3/自由比例，预览画布拖拽框选 + 坐标精确调整，裁剪区域原尺寸输出，去黑边改构图竖屏化，本地重编码导出 MP4/WebM，视频不上传服务器',
  keywords: '视频裁剪, 画面裁剪, 视频去黑边, 裁剪视频尺寸, 视频改构图, 横屏转竖屏, 在线裁切视频',
  author: '有条工具',
  ogTitle: '视频画面裁剪 - 在线裁剪视频画面，去黑边改构图 | 有条工具',
  ogDescription: '预设比例 + 拖拽框选 + 坐标精确调整，裁剪区域原尺寸输出，本地处理不上传。',
  ogUrl: 'https://www.util.cn/tools/video-crop',
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
          name: '视频画面裁剪',
          url: 'https://www.util.cn/tools/video-crop',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['预设 16:9/9:16/1:1/4:3/自由比例', '预览画布拖拽框选', 'X/Y/宽/高数字精确调整', '三方联动越界自动钳制', '最小 16px 裁剪保护', '裁剪区域原尺寸输出', '实时预览所见即所得', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '视频画面裁剪', item: 'https://www.util.cn/tools/video-crop/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '怎么裁剪视频画面？',
              acceptedAnswer: { '@type': 'Answer', text: '选择视频后，用预设比例、拖拽框选或坐标数字输入确定裁剪框（三者联动、自动钳制），预览确认后点开始裁剪，耗时约等于视频时长，完成后下载即可。' }
            },
            {
              '@type': 'Question',
              name: '画面裁剪和视频裁剪器有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '画面裁剪是空间裁剪：改每帧画面的构图（去黑边、竖屏化），时长不变；视频裁剪器是时间裁剪：截取某一段（去头去尾），画面内容不变。两者可配合使用。' }
            },
            {
              '@type': 'Question',
              name: '横屏视频能裁成竖屏吗？',
              acceptedAnswer: { '@type': 'Answer', text: '能。选择 9:16 预设，工具会自动取源画面内最大的竖屏居中框，也可以拖拽或输入精确调整位置；输出为该区域的竖屏画面，适合发短视频平台。' }
            },
            {
              '@type': 'Question',
              name: '裁剪后会损失画质吗？',
              acceptedAnswer: { '@type': 'Answer', text: '输出为裁剪区域原尺寸、不缩放；画面经历一次解码-重编码有轻微世代损失，输出码率按原片推算（1-8 Mbps 钳制），更小的画面分到同等码率，单位面积画质通常更好。' }
            },
            {
              '@type': 'Question',
              name: '视频会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。视频在浏览器内存中解码、裁剪与重编码，全程本地完成，不发任何网络请求，关闭页面即释放。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯函数（node 自测提取区）begin ----------
const MIN_CROP = 16                  // 裁剪框最小边长（px）
// 输出格式候选：优先 MP4（Chrome 126+ / Safari 支持 MediaRecorder 录制 mp4），降级 WebM
const MIME_CANDIDATES = [
  { mime: 'video/mp4;codecs=avc1,mp4a.40.2', label: 'MP4（H.264 + AAC）', ext: 'mp4' },
  { mime: 'video/webm;codecs=vp9,opus', label: 'WebM（VP9 + Opus）', ext: 'webm' },
  { mime: 'video/webm;codecs=vp8,opus', label: 'WebM（VP8 + Opus）', ext: 'webm' },
  { mime: 'video/webm', label: 'WebM（浏览器默认编码）', ext: 'webm' }
]

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

// 输出文件名：原名-cropped.扩展名（无扩展名输入时回退 video）
function buildOutputName(baseName, suffix, ext) {
  const base = String(baseName || 'video').replace(/\.[^.]+$/, '') || 'video'
  return `${base}-${suffix}.${ext || 'webm'}`
}

// 预设比例的最大居中框：等比铺满源画面较窄的一边，另一边居中裁掉
function largestRectForRatio(vw, vh, ratio) {
  const w0 = Math.max(1, Math.round(Number(vw) || 0))
  const h0 = Math.max(1, Math.round(Number(vh) || 0))
  const r = Number(ratio) > 0 ? Number(ratio) : 0
  if (!r) return { x: 0, y: 0, w: w0, h: h0 }
  let w = w0
  let h = Math.round(w / r)
  if (h > h0) {
    h = h0
    w = Math.round(h * r)
  }
  return { x: Math.round((w0 - w) / 2), y: Math.round((h0 - h) / 2), w, h }
}

// 裁剪框钳制：坐标/尺寸取整并钳制在源画面内（最小 16px 保护）；
// ratio > 0 时锁定比例（以宽为基准同步高，超出可用空间则按高回推宽）
function clampCropRect(rect, videoW, videoH, ratio) {
  const vw = Math.max(1, Math.round(Number(videoW) || 0))
  const vh = Math.max(1, Math.round(Number(videoH) || 0))
  const r = (typeof ratio === 'number' && isFinite(ratio) && ratio > 0) ? ratio : 0
  let x = Math.round(Number(rect && rect.x) || 0)
  let y = Math.round(Number(rect && rect.y) || 0)
  let w = Math.round(Number(rect && rect.w) || 0)
  let h = Math.round(Number(rect && rect.h) || 0)
  // 1) 尺寸钳制：不小于最小值、不超过画面
  w = Math.min(Math.max(w, MIN_CROP), vw)
  h = Math.min(Math.max(h, MIN_CROP), vh)
  // 2) 位置钳制：框完整落在画面内（此步保证可用空间 ≥ 最小值）
  x = Math.min(Math.max(x, 0), vw - w)
  y = Math.min(Math.max(y, 0), vh - h)
  if (r > 0) {
    const maxW = vw - x
    const maxH = vh - y
    // 3) 比例锁定：以宽为基准同步高，超出可用空间则按高回推宽
    h = Math.round(w / r)
    if (h > maxH) {
      h = maxH
      w = Math.round(h * r)
    }
    if (w > maxW) {
      w = maxW
      h = Math.round(w / r)
    }
    // 4) 最小尺寸兜底（极小可用空间下比例可轻微偏差，优先保证框可用）
    w = Math.min(Math.max(w, MIN_CROP), maxW)
    h = Math.min(Math.max(h, MIN_CROP), maxH)
  }
  return { x, y, w, h }
}
// ---------- 纯函数（node 自测提取区）end ----------

const MAX_FPS = 30                   // canvas.captureStream 采集帧率
const MAX_PREVIEW_SIDE = 720         // 预览画布最长边（像素，CSS 再自适应缩放）
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
const previewCanvas = ref(null) // 源画面 + 裁剪框交互层
const recordCanvas = ref(null)  // 裁剪输出画布（录制源）
const fileName = ref('')
const fileSize = ref(0)
const videoUrl = ref('')
const duration = ref(0)
const videoSize = ref({ w: 0, h: 0 })
const isDragging = ref(false)
const error = ref('')
const warnText = ref('')
const partial = ref(false)

const crop = ref({ x: 0, y: 0, w: 0, h: 0 }) // 源画面像素坐标
const ratioId = ref('free')
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
let recordStream = null // 本次录制自建的画布采集流（结束时须 stop 释放）
// AudioContext 音频图：元素音频 → 录制支路（MediaStreamDestination）+ 监听支路（扬声器）
// MediaElementSource 与 video 元素一一绑定，创建后复用，仅在组件卸载时销毁
let audioCtx = null
let audioSrcNode = null
let audioDestNode = null
// 拖拽框选内部状态（非响应式）
let pointerDragId = null
let dragStart = null

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const ratioOptions = [
  { id: 'free', label: '自由', ratio: 0 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 }
]

const STATUS_LABELS = { idle: '待选择视频', ready: '已就绪', processing: '处理中', done: '已完成', error: '出错' }

// ---------- 计算属性 ----------
const hasVideo = computed(() => !!videoUrl.value && duration.value > 0)
const canRecord = computed(() => support.value.recorder && support.value.capture && !!pickedMime.value)
const canStart = computed(() => hasVideo.value && crop.value.w >= MIN_CROP && crop.value.h >= MIN_CROP && canRecord.value && status.value !== 'processing')
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
const cropLabel = computed(() => {
  const r = crop.value
  if (!r.w || !r.h) return '—'
  return `(${r.x}, ${r.y}) ${r.w}×${r.h}`
})
const keptPct = computed(() => {
  if (!videoSize.value.w || !videoSize.value.h || !crop.value.w) return 100
  const src = videoSize.value.w * videoSize.value.h
  return Math.max(1, Math.round((crop.value.w * crop.value.h / src) * 100))
})
const bigFileHint = computed(() => {
  if (fileSize.value > SOFT_LIMIT_BYTES) {
    return `当前文件约 ${formatSize(fileSize.value)}：浏览器实时重编码大文件较慢且占用内存，建议先用视频压缩工具压到 200MB 以内。`
  }
  return ''
})

// 裁剪框变化：同步输出画布尺寸并重绘两块画布（录制中已锁定，不响应）
watch(() => ({ ...crop.value }), () => {
  if (status.value === 'processing') return
  syncRecordCanvas()
  drawAll()
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
  crop.value = { x: 0, y: 0, w: 0, h: 0 }
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
    error.value = '视频超过 1GB：浏览器本地重编码容易内存不足，请先用视频压缩工具压小后再裁剪'
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

// ---------- 视频元信息与画布同步 ----------
function onLoadedMetadata() {
  const v = videoEl.value
  if (!v) return
  duration.value = isFinite(v.duration) ? v.duration : 0
  videoSize.value = { w: v.videoWidth, h: v.videoHeight }
  previewTime.value = 0
  // 默认裁剪框 = 全画面（等比取整）
  crop.value = clampCropRect({ x: 0, y: 0, w: v.videoWidth, h: v.videoHeight }, v.videoWidth, v.videoHeight, 0)
  syncPreviewCanvas()
  syncRecordCanvas()
}

function onLoadedData() {
  // 首帧数据就绪：画静态预览
  drawAll()
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
  // 播放中同步刷新裁剪预览
  drawAll()
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

// ---------- 裁剪框：预设 / 数字输入 / 拖拽 三方联动 ----------
function currentRatio() {
  const opt = ratioOptions.find((r) => r.id === ratioId.value)
  return opt ? opt.ratio : 0
}

// 预设比例：自动取该比例的最大居中框（自由 = 解锁并保持当前框）
function selectRatio(opt) {
  if (status.value === 'processing' || !hasVideo.value) return
  ratioId.value = opt.id
  if (opt.ratio > 0) {
    const raw = largestRectForRatio(videoSize.value.w, videoSize.value.h, opt.ratio)
    crop.value = clampCropRect(raw, videoSize.value.w, videoSize.value.h, opt.ratio)
  }
}

// 数字输入：越界自动钳制；比例锁定时改「高」同步宽，其余由 clampCropRect 同步
function applyCropInputs(field) {
  if (status.value === 'processing' || !hasVideo.value) return
  const r = { x: crop.value.x, y: crop.value.y, w: crop.value.w, h: crop.value.h }
  const ratio = currentRatio()
  if (ratio > 0 && field === 'h') {
    r.w = Math.round(r.h * ratio)
  }
  crop.value = clampCropRect(r, videoSize.value.w, videoSize.value.h, ratio)
}

function resetCropToFull() {
  if (status.value === 'processing' || !hasVideo.value) return
  const ratio = currentRatio()
  const raw = largestRectForRatio(videoSize.value.w, videoSize.value.h, ratio)
  crop.value = clampCropRect(raw, videoSize.value.w, videoSize.value.h, ratio)
}

// 预览画布 pointer → 源视频像素坐标（rect 为 CSS 显示尺寸，天然处理缩放）
function pointerToVideo(e) {
  const c = previewCanvas.value
  if (!c) return null
  const rect = c.getBoundingClientRect()
  if (!rect.width || !rect.height) return null
  const vx = ((e.clientX - rect.left) / rect.width) * videoSize.value.w
  const vy = ((e.clientY - rect.top) / rect.height) * videoSize.value.h
  return { x: vx, y: vy }
}

function onPointerDown(e) {
  if (status.value === 'processing' || !hasVideo.value) return
  const p = pointerToVideo(e)
  if (!p) return
  pointerDragId = e.pointerId
  try { e.currentTarget.setPointerCapture(e.pointerId) } catch (err) { /* 忽略 */ }
  dragStart = {
    x: Math.min(Math.max(p.x, 0), videoSize.value.w),
    y: Math.min(Math.max(p.y, 0), videoSize.value.h)
  }
  const ratio = currentRatio()
  crop.value = clampCropRect({ x: dragStart.x, y: dragStart.y, w: 1, h: 1 }, videoSize.value.w, videoSize.value.h, ratio)
}

function onPointerMove(e) {
  if (pointerDragId === null || !dragStart) return
  if (e.pointerId !== pointerDragId) return
  const p = pointerToVideo(e)
  if (!p) return
  const x1 = Math.min(dragStart.x, p.x)
  const y1 = Math.min(dragStart.y, p.y)
  const w = Math.max(1, Math.abs(p.x - dragStart.x))
  const h = Math.max(1, Math.abs(p.y - dragStart.y))
  const ratio = currentRatio()
  crop.value = clampCropRect({ x: x1, y: y1, w, h }, videoSize.value.w, videoSize.value.h, ratio)
}

function onPointerUp(e) {
  if (pointerDragId === null) return
  try { e.currentTarget && e.currentTarget.releasePointerCapture(e.pointerId) } catch (err) { /* 忽略 */ }
  pointerDragId = null
  dragStart = null
  // 收尾：按当前比例再钳一次（极端拖拽下保证框合法）
  const ratio = currentRatio()
  crop.value = clampCropRect(crop.value, videoSize.value.w, videoSize.value.h, ratio)
}

// ---------- 画布同步与绘制 ----------
function syncPreviewCanvas() {
  const c = previewCanvas.value
  const vw = videoSize.value.w
  const vh = videoSize.value.h
  if (!c || !vw || !vh) return
  const scale = Math.min(MAX_PREVIEW_SIDE / vw, MAX_PREVIEW_SIDE / vh, 1)
  const pw = Math.max(1, Math.round(vw * scale))
  const ph = Math.max(1, Math.round(vh * scale))
  if (c.width !== pw || c.height !== ph) {
    c.width = pw
    c.height = ph
  }
}

function syncRecordCanvas() {
  const c = recordCanvas.value
  const r = crop.value
  if (!c || !r.w || !r.h) return
  if (c.width !== r.w || c.height !== r.h) {
    c.width = r.w
    c.height = r.h
  }
}

// 裁剪绘制：drawImage 九参，原尺寸输出裁剪区域（裁多大出多大）
function drawCropped(ctx, video) {
  const r = crop.value
  if (!r.w || !r.h) return
  ctx.drawImage(video, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h)
}

// 源画面预览：整帧缩放绘制 + 裁剪框外半透明遮罩 + 绿色边框
function drawPreview() {
  const c = previewCanvas.value
  const v = videoEl.value
  if (!c || !v) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  const vw = videoSize.value.w
  const vh = videoSize.value.h
  if (!vw || !vh || !c.width || !c.height) return
  try {
    ctx.drawImage(v, 0, 0, vw, vh, 0, 0, c.width, c.height)
  } catch (err) { /* 首帧未就绪时忽略 */ return }
  const kx = c.width / vw
  const ky = c.height / vh
  const r = crop.value
  if (r.w > 0 && r.h > 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.beginPath()
    ctx.rect(0, 0, c.width, c.height)
    ctx.rect(r.x * kx, r.y * ky, r.w * kx, r.h * ky)
    ctx.fill('evenodd')
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = Math.max(2, Math.round(c.width / 300))
    ctx.strokeRect(r.x * kx, r.y * ky, r.w * kx, r.h * ky)
  }
}

// 输出画布：只画裁剪区域（录制时即从此画布采集）
function drawOutput() {
  const c = recordCanvas.value
  const v = videoEl.value
  if (!c || !v) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  if (!v.videoWidth || !v.videoHeight) return
  try {
    drawCropped(ctx, v)
  } catch (err) { /* 首帧未就绪时忽略 */ }
}

function drawAll() {
  drawPreview()
  drawOutput()
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
  drawAll()
  const v = videoEl.value
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
    name: buildOutputName(fileName.value, 'cropped', outputExt.value),
    size: blob.size
  }
  status.value = 'done'
}

// ---------- 主流程：实时录制裁剪（用户手势触发） ----------
async function startProcessing() {
  const video = videoEl.value
  if (!video || !hasVideo.value) {
    error.value = '请先选择可在浏览器中播放的视频文件'
    return
  }
  if (crop.value.w < MIN_CROP || crop.value.h < MIN_CROP) {
    error.value = '请先设置有效的裁剪框（最小 16×16 像素）'
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
    // 钳制并锁定裁剪框，同步两块画布尺寸
    crop.value = clampCropRect(crop.value, videoSize.value.w, videoSize.value.h, currentRatio())
    syncPreviewCanvas()
    syncRecordCanvas()
    const c = recordCanvas.value
    if (!c || !c.width || !c.height) throw new Error('裁剪画布未就绪，请重试')
    // 先画一帧，避免录制开头出现空帧
    try { drawOutput() } catch (err) { /* 首帧可能尚未就绪 */ }

    // 视频轨：输出画布（裁剪区域）的采集流
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
