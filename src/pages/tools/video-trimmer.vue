<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Scissors class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">视频裁剪</h1>
          <p class="text-sm text-muted-foreground mt-1">0.1 秒精度截取视频片段，去头去尾一键完成，本地重编码导出不上传</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        在线视频裁剪工具：加载本地视频后，用双滑杆或秒数输入精确设置开始与结束时间（0.1 秒精度），
        支持「去头 / 去尾 / 重置全片」快速操作与片段试播核对，按片段时长线性估算输出大小，
        点击导出即在浏览器内静音播放选中片段并实时重编码为 WebM 下载。全程本地处理，视频不会上传服务器。
      </p>
      <div class="inline-flex items-start gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-600 dark:text-amber-400">
        <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>视频在本地重编码导出（非无损剪切），处理速度取决于视频长度与设备性能；建议 ≤200MB 的短视频。Chrome/Edge 支持最佳，Safari 部分格式受限。</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：设置面板 -->
      <div class="space-y-6">
        <!-- 文件选择 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Play class="w-5 h-5 mr-2 text-primary" /> 选择视频文件
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
              ref="fileInputRef"
              type="file"
              accept="video/*,.mp4,.webm,.mov,.m4v"
              class="hidden"
              @change="handleFileChange"
            />
            <p class="text-sm font-medium text-foreground">点击或拖入视频文件（上限 {{ MAX_FILE_MB }}MB）</p>
            <p class="text-xs text-muted-foreground mt-1">mp4 / webm / mov / m4v，文件仅在本地解码</p>
          </div>
          <div v-if="fileName" class="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
              <p class="text-[10px] text-muted-foreground">{{ fileMetaText }}</p>
            </div>
            <button
              @click="clearFile"
              :disabled="exporting"
              class="p-1 text-muted-foreground hover:text-destructive disabled:opacity-40"
              title="重新选择文件"
            >
              <RefreshCw class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- 裁剪时间段 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Scissors class="w-5 h-5 mr-2 text-primary" /> 裁剪时间段
          </h2>

          <template v-if="videoUrl">
            <!-- 起止秒数输入（0.1s 精度） -->
            <div class="grid grid-cols-2 gap-3">
              <label class="block">
                <span class="block text-xs text-muted-foreground mb-1">开始时间（秒）</span>
                <input
                  v-model.number="startSec"
                  type="number"
                  min="0"
                  :max="duration"
                  step="0.1"
                  :disabled="exporting"
                  @change="onCommitStart"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono disabled:opacity-50"
                />
              </label>
              <label class="block">
                <span class="block text-xs text-muted-foreground mb-1">结束时间（秒）</span>
                <input
                  v-model.number="endSec"
                  type="number"
                  min="0"
                  :max="duration"
                  step="0.1"
                  :disabled="exporting"
                  @change="onCommitEnd"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono disabled:opacity-50"
                />
              </label>
            </div>

            <!-- 可视化轨道条：选区高亮 + 播放头 -->
            <div>
              <div class="relative h-3 bg-muted rounded-full">
                <div
                  class="absolute inset-y-0 bg-primary rounded-full"
                  :style="{ left: startPct + '%', width: Math.max(0, endPct - startPct) + '%' }"
                ></div>
                <div
                  class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-5 bg-foreground rounded-full pointer-events-none"
                  :style="{ left: currentPct + '%' }"
                ></div>
              </div>
              <div class="flex justify-between text-[10px] text-muted-foreground mt-1.5 font-mono">
                <span>{{ fmtTimeOf(0) }}</span>
                <span>当前 {{ fmtTimeOf(currentTime) }}</span>
                <span>{{ fmtTimeOf(duration) }}</span>
              </div>
            </div>

            <!-- 双滑杆 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label class="block">
                <span class="block text-xs text-muted-foreground mb-1">
                  起点滑杆 · <span class="text-primary font-mono">{{ fmtTimeOf(startSec) }}</span>
                </span>
                <input
                  v-model.number="startSec"
                  type="range"
                  min="0"
                  :max="duration || 0"
                  step="0.1"
                  :disabled="exporting || !duration"
                  @change="onCommitStart"
                  class="w-full accent-primary"
                />
              </label>
              <label class="block">
                <span class="block text-xs text-muted-foreground mb-1">
                  终点滑杆 · <span class="text-primary font-mono">{{ fmtTimeOf(endSec) }}</span>
                </span>
                <input
                  v-model.number="endSec"
                  type="range"
                  min="0"
                  :max="duration || 0"
                  step="0.1"
                  :disabled="exporting || !duration"
                  @change="onCommitEnd"
                  class="w-full accent-primary"
                />
              </label>
            </div>

            <!-- 快速按钮 -->
            <div class="grid grid-cols-3 gap-2">
              <button
                @click="trimHead"
                :disabled="exporting || !duration"
                class="py-2 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition disabled:opacity-40"
              >
                去头（以此刻为起点）
              </button>
              <button
                @click="trimTail"
                :disabled="exporting || !duration"
                class="py-2 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition disabled:opacity-40"
              >
                去尾（以此刻为终点）
              </button>
              <button
                @click="resetRange"
                :disabled="exporting || !duration"
                class="py-2 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition disabled:opacity-40"
              >
                <RefreshCw class="w-3.5 h-3.5 inline mr-1 -mt-0.5" />重置全片
              </button>
            </div>

            <!-- 预览跳转 + 试播片段 -->
            <div class="grid grid-cols-3 gap-2">
              <button
                @click="jumpToStart"
                :disabled="exporting || !duration"
                class="py-2 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition disabled:opacity-40"
              >
                跳到起点
              </button>
              <button
                @click="jumpToEnd"
                :disabled="exporting || !duration"
                class="py-2 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition disabled:opacity-40"
              >
                跳到终点
              </button>
              <button
                @click="toggleSegmentPreview"
                :disabled="exporting || !duration || !rangeCheck.ok"
                class="py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-40 flex items-center justify-center gap-1"
              >
                <Pause v-if="previewing" class="w-3.5 h-3.5" />
                <Play v-else class="w-3.5 h-3.5" />
                {{ previewing ? '停止试播' : '试播片段' }}
              </button>
            </div>

            <p
              v-if="duration > 0 && !rangeCheck.ok"
              class="text-xs text-destructive flex items-start gap-1.5"
            >
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ rangeCheck.error }}</span>
            </p>
          </template>

          <p v-else class="text-sm text-muted-foreground">
            选择视频后即可在此设置起止时间、去头去尾并试播核对。
          </p>
        </div>

        <!-- 导出 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Download class="w-5 h-5 mr-2 text-primary" /> 导出片段
          </h2>

          <!-- 输出预估 -->
          <div class="bg-muted/50 rounded-lg p-3 space-y-1.5 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">片段时长</span>
              <span class="text-foreground font-medium font-mono">{{ fmtTimeOf(clipSeconds) }}（{{ clipSeconds.toFixed(1) }} 秒）</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">估算输出大小</span>
              <span class="text-foreground font-medium">{{ hasVideo ? fmtBytesOf(estimatedMB) + '（按时长线性估算）' : '—' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">目标视频码率</span>
              <span class="text-foreground font-medium">{{ hasVideo ? Math.round(clipBitrate / 1000) + ' kbps' : '—' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">输出格式</span>
              <span class="text-foreground font-medium">{{ mimeLabelText }}</span>
            </div>
            <p class="text-[10px] text-muted-foreground flex items-start gap-1">
              <Info class="w-3 h-3 flex-shrink-0 mt-0.5" />
              输出为 WebM 重编码结果（非无损剪切），实际大小与画质以导出为准；导出耗时约等于片段时长。
            </p>
          </div>

          <button
            @click="startExport"
            :disabled="!canClickExport"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <RefreshCw v-if="exporting" class="w-4 h-4 animate-spin" />
            <Scissors v-else class="w-4 h-4" />
            {{ exporting ? '正在导出 ' + progressPct + '%' : '导出片段' }}
          </button>

          <button
            v-if="exporting"
            @click="abortExport"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-all"
          >
            中止导出（不保存结果）
          </button>

          <!-- 进度条（按播放进度实时计算） -->
          <div v-if="exporting" class="space-y-1.5">
            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full transition-all" :style="{ width: progressPct + '%' }"></div>
            </div>
            <p class="text-[10px] text-muted-foreground">
              已导出 {{ fmtTimeOf(exportedSeconds) }} / {{ fmtTimeOf(clipSeconds) }}（按播放进度实时计算，请保持页面在前台）
            </p>
          </div>

          <div v-if="error" class="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ error }}</span>
          </div>
          <div v-if="infoNotice" class="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg p-3">
            <Info class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ infoNotice }}</span>
          </div>

          <p class="text-[10px] text-muted-foreground leading-relaxed">
            说明：导出采用「实时录制」重编码——选中片段静音播放一遍、canvas 逐帧重绘并同步录制一遍；
            输出容器为 WebM（{{ mimeLabelText }}）。浏览器端暂无法低成本封装 MP4
            （WebCodecs 逐帧解码 + MP4 封装成本高），微信、抖音、B 站及主流剪辑软件均可直接使用 WebM。
          </p>
        </div>

        <!-- 浏览器不支持提示 -->
        <div v-if="supportChecked && !canExport" class="bg-card border border-amber-500/40 rounded-lg p-4 space-y-2">
          <p class="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <TriangleAlert class="w-4 h-4" /> 当前浏览器不支持视频导出
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            导出依赖 canvas.captureStream 与 MediaRecorder 视频录制能力（新版 Chrome / Edge / Firefox 支持，Safari 部分格式受限）。
            请更换浏览器后重试，或使用系统自带剪辑工具处理。
          </p>
        </div>
      </div>

      <!-- 右侧：预览与结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 视频预览 -->
        <div v-if="videoUrl" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center justify-between flex-wrap gap-2">
            <span class="flex items-center"><Play class="w-5 h-5 mr-2 text-primary" /> 原视频预览</span>
            <span v-if="exporting" class="text-xs font-normal text-amber-600 dark:text-amber-400">（导出中：正在静音播放并录制选中片段）</span>
          </h2>
          <video
            ref="videoEl"
            :src="videoUrl"
            playsinline
            preload="auto"
            :controls="!exporting"
            class="w-full max-h-96 rounded-lg bg-black transition-opacity"
            :class="exporting ? 'opacity-60 pointer-events-none' : ''"
            @loadedmetadata="onLoadedMetadata"
            @error="onVideoError"
            @timeupdate="onTimeUpdate"
            @pause="onVideoPause"
            @ended="onVideoEnded"
          ></video>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">总时长</p>
              <p class="text-sm font-bold text-foreground font-mono">{{ fmtTimeOf(duration) }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">分辨率</p>
              <p class="text-sm font-bold text-foreground">{{ videoSize.w ? videoSize.w + '×' + videoSize.h : '—' }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">文件大小</p>
              <p class="text-sm font-bold text-foreground">{{ fileSize ? fmtBytesOf(fileSizeMB) : '—' }}</p>
            </div>
          </div>
        </div>

        <!-- 导出结果 -->
        <div v-if="resultUrl" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" /> 导出完成
          </h2>
          <video :src="resultUrl" controls playsinline class="w-full max-h-96 rounded-lg bg-black"></video>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">片段时长</p>
              <p class="text-sm font-bold text-foreground font-mono">{{ fmtTimeOf(clipSeconds) }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">输出大小</p>
              <p class="text-sm font-bold text-green-600 dark:text-green-400">{{ resultSize ? fmtBytesOf(resultSize / 1048576) : '—' }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">输出格式</p>
              <p class="text-sm font-bold text-foreground">{{ mimeLabelText }}</p>
            </div>
          </div>
          <button
            @click="downloadResult"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Download class="w-4 h-4" /> 保存 {{ resultName }}
          </button>
        </div>

        <!-- 空状态 -->
        <div v-if="!videoUrl && !resultUrl" class="bg-card border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
          选择视频后，这里会显示原视频预览与导出结果
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于在线视频裁剪</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            想发一段 15 秒的精彩瞬间、去掉视频开头几秒的误录、或者把长视频掐头去尾只留正片——这些都需要「视频裁剪」。
            本工具在浏览器里完成选段与重编码：设置起止时间后，片段会被静音播放并实时重编码为 WebM 导出，
            视频自始至终不离开你的电脑，适合处理会议录屏、家庭视频等隐私内容。
          </p>

          <h3 class="text-lg font-semibold text-foreground">怎么截取视频的一段？</h3>
          <ol class="list-decimal list-inside space-y-1.5">
            <li>选择本地视频（≤200MB），在右侧预览确认画面与总时长；</li>
            <li>播放到合适位置，点「去头」把当前位置设为起点，或点「去尾」把当前位置设为终点；也可以直接拖动双滑杆，或输入精确到 0.1 秒的起止时间；</li>
            <li>点「跳到起点 / 跳到终点」让画面同步跳转核对边界，再点「试播片段」完整看一遍选区；</li>
            <li>确认无误后点「导出片段」，进度条按播放进度实时推进，完成后下载 clip-起点-终点.webm。</li>
          </ol>

          <h3 class="text-lg font-semibold text-foreground">导出为什么是 WebM 不是 MP4？</h3>
          <p>
            「无损剪切」需要按关键帧对齐直接切分容器流（remux），浏览器并没有公开这样的 API；用 WebCodecs 逐帧解码再加 MP4 封装器，
            在浏览器端实现成本高、兼容性参差。因此本工具采用浏览器原生的 MediaRecorder 实时重编码路线：
            片段静音播放一遍，canvas 逐帧重绘画面并录制为 WebM。代价是需要「播放一遍」的时间且有轻微重编码损失；
            好处是零依赖、纯本地、兼容性广。输出的 WebM 微信、抖音、B 站及主流剪辑软件都能直接使用，
            若目标平台只认 MP4，用桌面工具转一次容器即可。
          </p>

          <h3 class="text-lg font-semibold text-foreground">会压缩画质吗？</h3>
          <p>
            导出视频码率按原片平均码率（文件大小 × 8 ÷ 总时长）推算，并钳制在 1–8 Mbps 之间，与原片码率基本一致，
            因此不会额外压低画质；但由于经历「解码 → 重编码」一次有损压缩世代，细节会有轻微下降，快速运动画面更明显。
            面板中的输出大小是按「原片体积 × 片段时长占比」线性估算的参考值，实际大小由浏览器编码器决定。
          </p>

          <h3 class="text-lg font-semibold text-foreground">大视频怎么办？</h3>
          <p>
            超过 200MB 或时长很长的视频，建议先压缩再裁剪：先用站内
            <NuxtLink to="/tools/video-compressor/" class="text-primary hover:underline">视频压缩</NuxtLink>
            把体积降到 200MB 以内、顺手降一档分辨率，再回来截取片段，导出速度和成功率都会更高。
            对边界精度要求极高的长视频，也可以使用桌面端按关键帧无损剪切的工具配合处理。
          </p>

          <h3 class="text-lg font-semibold text-foreground">视频数据会上传吗？</h3>
          <p>
            不会。视频通过对象 URL（Blob URL）在浏览器内解码播放，选段、重编码与导出全部在本机完成，
            页面不会发出任何包含视频数据的网络请求，关闭或刷新页面后内存即释放。
          </p>

          <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
          <div class="space-y-4">
            <div>
              <h3 class="text-base font-semibold text-foreground">怎么截取视频的一段？</h3>
              <p class="text-sm text-muted-foreground mt-1">选择视频后，用「去头 / 去尾」按钮把当前位置设为起点或终点，或拖动双滑杆、输入精确到 0.1 秒的起止时间；用「跳到起点 / 终点」和「试播片段」核对边界后点「导出片段」，完成即可下载。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">导出为什么是 WebM 而不是 MP4？</h3>
              <p class="text-sm text-muted-foreground mt-1">浏览器没有公开按关键帧无损剪切（remux）的 API，浏览器端封装 MP4 成本高；本工具用 MediaRecorder 实时重编码输出 WebM，微信、抖音、B 站与主流剪辑软件均可直接使用，必要时可用桌面工具转为 MP4。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">导出会压缩画质吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">导出码率按原片平均码率推算并钳制在 1–8 Mbps，不会额外压低画质，但重编码有一次轻微的画质世代损失；面板中的估算大小按时长线性推算，仅作参考。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">视频数据会上传吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">不会。视频在浏览器内存中解码、选段与重编码，全程本地完成，不发任何网络请求，关闭页面即释放。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'video-trimmer'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Scissors, Play, Pause, Download, TriangleAlert, CheckCircle,
  ChevronUp, ChevronDown, Info, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '视频裁剪 - 在线截取视频片段，视频去头尾剪切工具',
  description: '免费在线视频裁剪工具：0.1 秒精度设置起止时间，双滑杆选取片段，去头去尾一键完成，片段试播核对后本地重编码导出 WebM，按时长估算输出大小，视频不上传服务器',
  keywords: '视频裁剪,视频剪辑,截取视频片段,在线视频剪切,视频去头尾',
  author: '有条工具',
  ogTitle: '视频裁剪 - 在线截取视频片段，视频去头尾剪切工具 | 有条工具',
  ogDescription: '0.1 秒精度截取视频片段，去头去尾一键完成，本地重编码导出 WebM，不上传服务器。',
  ogUrl: 'https://www.util.cn/tools/video-trimmer',
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
          name: '视频裁剪',
          url: 'https://www.util.cn/tools/video-trimmer',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['0.1 秒精度设置起止时间', '双滑杆可视化选取片段', '去头/去尾/重置全片一键操作', '片段试播与跳转核对', '输出大小按时长线性估算', '本地重编码导出 WebM', '视频不上传服务器']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '视频裁剪', item: 'https://www.util.cn/tools/video-trimmer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '怎么截取视频的一段？',
              acceptedAnswer: { '@type': 'Answer', text: '选择视频后，用去头/去尾按钮把当前位置设为起点或终点，或拖动双滑杆、输入精确到0.1秒的起止时间；用跳到起点/终点和试播片段核对边界后点导出片段，完成即可下载。' }
            },
            {
              '@type': 'Question',
              name: '导出为什么是 WebM 而不是 MP4？',
              acceptedAnswer: { '@type': 'Answer', text: '浏览器没有公开按关键帧无损剪切（remux）的API，浏览器端封装MP4成本高；本工具用MediaRecorder实时重编码输出WebM，微信、抖音、B站与主流剪辑软件均可直接使用，必要时可用桌面工具转为MP4。' }
            },
            {
              '@type': 'Question',
              name: '导出会压缩画质吗？',
              acceptedAnswer: { '@type': 'Answer', text: '导出码率按原片平均码率推算并钳制在1-8Mbps，不会额外压低画质，但重编码有一次轻微的画质世代损失；面板中的估算大小按时长线性推算，仅作参考。' }
            },
            {
              '@type': 'Question',
              name: '视频数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。视频在浏览器内存中解码、选段与重编码，全程本地完成，不发任何网络请求，关闭页面即释放。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_FILE_MB = 200      // 单文件大小上限（MB）
const EXPORT_FPS = 30        // canvas.captureStream 采集帧率
const MIN_RANGE_SEC = 0.1    // 片段最短时长（秒），与 UI 步进一致

// 秒 → "mm:ss.d"（0.1 秒精度显示，65.4 → "01:05.4"）
function fmtTimeOf(sec) {
  const totalTenths = Math.round(Math.max(0, Number(sec) || 0) * 10)
  const tenth = totalTenths % 10
  const totalSec = Math.floor(totalTenths / 10)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${tenth}`
}

// 校验时间段：0 ≤ start < end ≤ duration，合法返回 { ok: true }，否则 { ok: false, error }
function validateRangeOf(start, end, duration) {
  const s = Number(start)
  const e = Number(end)
  const d = Number(duration)
  if (!isFinite(d) || d <= 0) return { ok: false, error: '视频未加载或时长无效，请先选择可播放的视频文件' }
  if (!isFinite(s) || !isFinite(e)) return { ok: false, error: '时间格式无效，请输入数字（秒）' }
  if (s < 0) return { ok: false, error: '开始时间不能小于 0 秒' }
  if (e - d > 1e-6) return { ok: false, error: `结束时间不能超过视频总时长 ${fmtTimeOf(d)}` }
  if (s >= e) return { ok: false, error: '开始时间必须小于结束时间' }
  return { ok: true, error: '' }
}

// 按时长线性估算输出大小（MB，1 位小数）：原片体积 × (片段时长 / 总时长)
function estimateSizeOf(fileSizeMB, start, end, duration) {
  const size = Math.max(0, Number(fileSizeMB) || 0)
  const d = Number(duration)
  if (!isFinite(d) || d <= 0) return 0
  const span = Math.min(Math.max(0, Number(end) - Number(start)), d)
  if (!isFinite(span) || span <= 0) return 0
  return Math.round((size * span / d) * 10) / 10
}

// MB → 人类可读（KB / MB / GB）
function fmtBytesOf(mb) {
  const v = Math.max(0, Number(mb) || 0)
  if (v >= 1024) return (v / 1024).toFixed(2) + ' GB'
  if (v < 1) return Math.round(v * 1024) + ' KB'
  return v.toFixed(1) + ' MB'
}

// 导出文件名：clip-起点-终点.webm（0.1 秒精度，避免文件名非法字符）
function clipNameOf(start, end) {
  const s = Math.round(Math.max(0, Number(start) || 0) * 10) / 10
  const e = Math.round(Math.max(0, Number(end) || 0) * 10) / 10
  return `clip-${s}-${e}.webm`
}

// 导出目标码率（bps）：按原片平均码率（字节×8÷秒）推算，钳制 1～8 Mbps，异常时回退 2.5 Mbps
function bitrateOfClip(fileSizeBytes, durationSec) {
  const b = Number(fileSizeBytes)
  const d = Number(durationSec)
  if (!isFinite(b) || !isFinite(d) || b <= 0 || d <= 0) return 2500000
  return Math.min(8000000, Math.max(1000000, Math.round((b * 8) / d)))
}

// MediaRecorder mimeType 候选表：优先 VP9 → VP8 → 浏览器默认
const MIME_CANDIDATES = [
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

// 数值钳制（滑杆联动 / 进度计算共用）；非法输入回退到下界
function clampOf(value, min, max) {
  const n = Number(value)
  const lo = isFinite(min) ? min : 0
  const hi = isFinite(max) ? max : 0
  if (!isFinite(n)) return lo
  return Math.min(Math.max(n, lo), Math.max(lo, hi))
}
// ---------- 纯逻辑结束 ----------

// ---------- 状态 ----------
const fileInputRef = ref(null)
const videoEl = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const videoUrl = ref('')
const duration = ref(0)
const videoSize = ref({ w: 0, h: 0 })
const isDragging = ref(false)

const startSec = ref(0)
const endSec = ref(0)
const currentTime = ref(0)
const previewing = ref(false)

const exporting = ref(false)
const progress = ref(0)
const exportedSeconds = ref(0)

const resultUrl = ref('')
const resultName = ref('')
const resultSize = ref(0)

const error = ref('')
const infoNotice = ref('')
const seoContentVisible = ref(true)

const supportChecked = ref(false)
const support = ref({ recorder: false, capture: false })
const pickedMime = ref(null) // { mime, label }

// 非响应式录制内部件
let recorder = null
let chunks = []
let rafId = 0
let rvfcId = 0
let aborted = false
let recordCanvas = null
let recordStream = null // 本次导出自建的 canvas 采集流（结束时须 stop 释放）
// AudioContext 音频图：元素音频 → gain（监听音量）→ 扬声器 + 录制支路，懒建可复用
let audioCtx = null
let audioSrcNode = null
let gainNode = null
let audioDestNode = null
let graphForEl = null

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 计算属性 ----------
const fileSizeMB = computed(() => fileSize.value / (1024 * 1024))
const hasVideo = computed(() => !!videoUrl.value && duration.value > 0)
const clipSeconds = computed(() => Math.max(0, Number(endSec.value) - Number(startSec.value)))
const rangeCheck = computed(() => {
  if (!hasVideo.value) return { ok: false, error: '' }
  return validateRangeOf(startSec.value, endSec.value, duration.value)
})
const estimatedMB = computed(() => estimateSizeOf(fileSizeMB.value, startSec.value, endSec.value, duration.value))
const clipBitrate = computed(() => bitrateOfClip(fileSize.value, duration.value))
const canExport = computed(() => support.value.recorder && support.value.capture && !!pickedMime.value)
const canClickExport = computed(() => !exporting.value && hasVideo.value && canExport.value && rangeCheck.value.ok)
const progressPct = computed(() => Math.round(clampOf(progress.value, 0, 1) * 100))
const mimeLabelText = computed(() => {
  if (pickedMime.value) return pickedMime.value.label
  return supportChecked.value ? '当前浏览器不支持' : '检测中…'
})
const fileMetaText = computed(() => {
  const parts = []
  if (duration.value > 0) parts.push(`时长 ${fmtTimeOf(duration.value)}`)
  if (videoSize.value.w) parts.push(`${videoSize.value.w}×${videoSize.value.h}`)
  if (fileSize.value) parts.push(fmtBytesOf(fileSizeMB.value))
  return parts.join(' · ') || fmtBytesOf(fileSizeMB.value)
})
const pctOf = (t) => (duration.value > 0 ? clampOf((Number(t) / duration.value) * 100, 0, 100) : 0)
const startPct = computed(() => pctOf(startSec.value))
const endPct = computed(() => pctOf(endSec.value))
const currentPct = computed(() => pctOf(currentTime.value))

// 滑杆联动钳制：起点不得越过终点，终点不得越过起点/总时长
watch(startSec, (val) => {
  const c = clampOf(val, 0, Math.max(0, Number(endSec.value) - MIN_RANGE_SEC))
  if (Number(val) !== c) startSec.value = c
})
watch(endSec, (val) => {
  const d = duration.value > 0 ? duration.value : 0
  const c = clampOf(val, Math.min(d, Number(startSec.value) + MIN_RANGE_SEC), d)
  if (Number(val) !== c) endSec.value = c
})

// ---------- 文件选择（SSR 安全：对象 URL 仅在用户回调内创建） ----------
const triggerFileSelect = () => { fileInputRef.value && fileInputRef.value.click() }

function clearResult() {
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = ''
  resultName.value = ''
  resultSize.value = 0
}

function resetAll() {
  abortExportSilently()
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  videoUrl.value = ''
  fileName.value = ''
  fileSize.value = 0
  duration.value = 0
  videoSize.value = { w: 0, h: 0 }
  startSec.value = 0
  endSec.value = 0
  currentTime.value = 0
  previewing.value = false
  progress.value = 0
  exportedSeconds.value = 0
  clearResult()
}

function acceptFile(f) {
  if (!f) return
  if (exporting.value) {
    error.value = '正在导出，请先中止或等待完成后再更换视频'
    return
  }
  error.value = ''
  infoNotice.value = ''
  const typeOk = !f.type || f.type.startsWith('video/')
  const name = (f.name || '').toLowerCase()
  const extOk = ['.mp4', '.webm', '.mov', '.m4v'].some((ext) => name.endsWith(ext))
  if (!typeOk && !extOk) {
    error.value = '请选择视频文件（mp4 / webm / mov 等）'
    return
  }
  if (f.size > MAX_FILE_MB * 1024 * 1024) {
    error.value = `视频超过 ${MAX_FILE_MB}MB（当前约 ${(f.size / 1024 / 1024).toFixed(1)}MB）：浏览器本地重编码易内存不足，请先用视频压缩工具压小后再裁剪`
    return
  }
  resetAll()
  fileName.value = f.name
  fileSize.value = f.size
  videoUrl.value = URL.createObjectURL(f)
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
  infoNotice.value = ''
}

// ---------- 视频元信息与播放同步 ----------
function onLoadedMetadata() {
  const v = videoEl.value
  if (!v) return
  duration.value = isFinite(v.duration) ? v.duration : 0
  videoSize.value = { w: v.videoWidth, h: v.videoHeight }
  startSec.value = 0
  endSec.value = duration.value
  currentTime.value = 0
  if (!duration.value) {
    infoNotice.value = '未能读取视频时长（可能是流式封装或编码异常），无法导出，请尝试 mp4（H.264）等格式。'
  }
}

function onVideoError() {
  if (!videoUrl.value) return
  error.value = '视频无法在浏览器中播放（编码不受支持），请尝试 mp4（H.264）或 webm 格式'
}

function onTimeUpdate() {
  const v = videoEl.value
  if (!v) return
  currentTime.value = v.currentTime
  if (previewing.value && !exporting.value && v.currentTime >= Number(endSec.value) - 0.03) {
    v.pause() // 试播到达终点，pause 事件里复位 previewing
  }
  if (!exporting.value) return
  const span = Math.max(MIN_RANGE_SEC, Number(endSec.value) - Number(startSec.value))
  exportedSeconds.value = clampOf(v.currentTime - Number(startSec.value), 0, span)
  progress.value = clampOf(exportedSeconds.value / span, 0, 1)
  if (v.currentTime >= Number(endSec.value) - 0.03) completeExport()
}

function onVideoPause() {
  previewing.value = false
}

// 终止兜底：片段播到片尾时若最后一次 timeupdate 未越过 endSec-0.03 阈值，
// 靠 ended 事件收尾录制，避免导出永远卡在录制中；试播自然到达终点也在此复位
function onVideoEnded() {
  previewing.value = false
  if (exporting.value) completeExport()
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

async function jumpTo(t) {
  const v = videoEl.value
  if (!v) return
  v.pause()
  await seekTo(v, clampOf(t, 0, duration.value || 0))
  currentTime.value = v.currentTime
}

function jumpToStart() { jumpTo(startSec.value) }
function jumpToEnd() { jumpTo(endSec.value) }

// 数字输入提交（change 事件）：钳制后同步跳转验证
function onCommitStart() {
  if (!hasVideo.value) return
  startSec.value = clampOf(startSec.value, 0, Math.max(0, Number(endSec.value) - MIN_RANGE_SEC))
  jumpTo(startSec.value)
}
function onCommitEnd() {
  if (!hasVideo.value) return
  const d = duration.value
  endSec.value = clampOf(endSec.value, Math.min(d, Number(startSec.value) + MIN_RANGE_SEC), d)
  jumpTo(endSec.value)
}

// ---------- 快速按钮 ----------
function trimHead() {
  const v = videoEl.value
  if (!v || !hasVideo.value) return
  startSec.value = clampOf(v.currentTime, 0, Math.max(0, Number(endSec.value) - MIN_RANGE_SEC))
  jumpTo(startSec.value)
}
function trimTail() {
  const v = videoEl.value
  if (!v || !hasVideo.value) return
  const d = duration.value
  endSec.value = clampOf(v.currentTime, Math.min(d, Number(startSec.value) + MIN_RANGE_SEC), d)
  jumpTo(endSec.value)
}
function resetRange() {
  if (!hasVideo.value) return
  startSec.value = 0
  endSec.value = duration.value
  jumpTo(0)
}

// ---------- 试播片段 ----------
async function toggleSegmentPreview() {
  const v = videoEl.value
  if (!v || !hasVideo.value || exporting.value) return
  if (previewing.value) {
    v.pause()
    return
  }
  const check = validateRangeOf(startSec.value, endSec.value, duration.value)
  if (!check.ok) {
    error.value = check.error
    return
  }
  error.value = ''
  previewing.value = true
  await seekTo(v, Number(startSec.value))
  try {
    await v.play()
  } catch (err) {
    previewing.value = false
    error.value = '试播未能自动播放，请点击播放按钮后重试'
  }
}

// ---------- 音频图：元素音频分两路——经 gain 到扬声器（监听），直连录制支路 ----------
// 导出时把 gain 置 0 仅静音监听；录制支路取未经 gain 的源信号，导出结果仍带音轨
function ensureAudioGraph(video) {
  if (graphForEl === video && audioCtx && audioCtx.state !== 'closed' && gainNode && audioDestNode) {
    if (audioCtx.state === 'suspended') audioCtx.resume()
    return true
  }
  try {
    teardownAudioGraph()
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (typeof Ctx !== 'function') return false
    audioCtx = new Ctx()
    audioSrcNode = audioCtx.createMediaElementSource(video)
    gainNode = audioCtx.createGain()
    audioDestNode = audioCtx.createMediaStreamDestination()
    audioSrcNode.connect(gainNode)
    gainNode.connect(audioCtx.destination) // 监听支路：导出期间增益置 0 即静音
    audioSrcNode.connect(audioDestNode)    // 录制支路直接取自源，不受监听增益影响
    graphForEl = video
    // 异步链路里新建的 ctx 可能处于 suspended，尽力恢复避免录到无声
    if (audioCtx.state === 'suspended') {
      try { audioCtx.resume() } catch (err) { /* 忽略 */ }
    }
    return true
  } catch (err) {
    return false
  }
}

function teardownAudioGraph() {
  if (audioCtx && audioCtx.state !== 'closed') {
    try { audioCtx.close() } catch (err) { /* 忽略 */ }
  }
  audioCtx = null
  audioSrcNode = null
  gainNode = null
  audioDestNode = null
  graphForEl = null
}

// ---------- 逐帧绘制循环 ----------
function pumpFrame(ctx, video) {
  if (!exporting.value) return
  try {
    ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height)
  } catch (err) { /* 单帧绘制失败不中断录制 */ }
  if (typeof video.requestVideoFrameCallback === 'function') {
    rvfcId = video.requestVideoFrameCallback(() => pumpFrame(ctx, video))
  } else {
    rafId = requestAnimationFrame(() => pumpFrame(ctx, video))
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

// 播放到终点自然收尾：暂停 + 停止录制，onstop 里汇总结果
function completeExport() {
  const v = videoEl.value
  if (v) v.pause()
  stopRecorderSafe()
}

// 导出结束后的统一状态恢复（由 recorder.onstop 调用）
function finishExport() {
  exporting.value = false
  progress.value = 0
  exportedSeconds.value = 0
  stopPump()
  stopRecorderSafe()
  recorder = null
  if (recordStream) {
    recordStream.getTracks().forEach((t) => {
      try { t.stop() } catch (err) { /* 忽略 */ }
    })
    recordStream = null
  }
  recordCanvas = null
  if (gainNode) gainNode.gain.value = 1 // 恢复预览监听
  const v = videoEl.value
  if (v) v.pause()
}

function abortExportSilently() {
  aborted = true
  stopRecorderSafe()
}

// 用户中途中止：丢弃已录数据（aborted 标记使 onstop 不产出结果）
function abortExport() {
  if (!exporting.value) return
  aborted = true
  const v = videoEl.value
  if (v) v.pause()
  stopRecorderSafe()
}

// ---------- 主流程：MediaRecorder 实时重编码导出（用户手势触发） ----------
async function startExport() {
  const video = videoEl.value
  if (!video || !hasVideo.value) {
    error.value = '请先选择可在浏览器中播放的视频文件'
    return
  }
  if (exporting.value) return
  if (!canExport.value) {
    error.value = '当前浏览器缺少 canvas.captureStream 或 MediaRecorder 视频录制能力，请更换新版 Chrome / Edge'
    return
  }
  const check = validateRangeOf(startSec.value, endSec.value, duration.value)
  if (!check.ok) {
    error.value = check.error
    return
  }
  error.value = ''
  infoNotice.value = ''
  clearResult()
  exporting.value = true
  progress.value = 0
  exportedSeconds.value = 0
  aborted = false

  try {
    video.pause()
    await seekTo(video, Number(startSec.value))
    if (aborted) {
      // 用户在 seek 阶段点了中止：不再启动录制，直接复位收尾
      finishExport()
      return
    }

    // 离屏 canvas：按原始分辨率逐帧承接画面
    const w = video.videoWidth > 0 ? video.videoWidth : 640
    const h = video.videoHeight > 0 ? video.videoHeight : 360
    recordCanvas = document.createElement('canvas')
    recordCanvas.width = w
    recordCanvas.height = h
    const ctx = recordCanvas.getContext('2d')
    try { ctx.drawImage(video, 0, 0, w, h) } catch (err) { /* 首帧可能尚未就绪 */ }

    // 视频轨来自 canvas，音轨优先走 AudioContext（监听静音、录制有声）
    recordStream = recordCanvas.captureStream(EXPORT_FPS)
    const tracks = recordStream.getVideoTracks().slice()
    let audioOk = false
    if (ensureAudioGraph(video)) {
      gainNode.gain.value = 0 // 导出期间静音播放
      const at = audioDestNode.stream.getAudioTracks()
      if (at && at.length) {
        tracks.push(...at)
        audioOk = true
      }
    }
    if (!audioOk) {
      // 回退：元素自带 captureStream（此路径下导出期间会外放声音）
      const cs = typeof video.captureStream === 'function'
        ? video.captureStream
        : (typeof video.mozCaptureStream === 'function' ? video.mozCaptureStream : null)
      if (cs) {
        try {
          const at2 = cs.call(video).getAudioTracks()
          if (at2 && at2.length) {
            tracks.push(...at2)
            audioOk = true
            infoNotice.value = '当前浏览器不支持音频分流，导出期间会外放声音。'
          }
        } catch (err) { /* 落到无声导出 */ }
      }
    }
    if (!audioOk) {
      infoNotice.value = '未能获取音轨，本次导出为无声视频。'
    }

    const stream = new MediaStream(tracks)
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: pickedMime.value.mime,
        videoBitsPerSecond: clipBitrate.value,
        audioBitsPerSecond: 128000
      })
    } catch (err) {
      finishExport()
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
    recorder.onstop = () => {
      finishExport()
      if (aborted) {
        chunks = []
        if (!error.value) infoNotice.value = '已中止导出，未保存结果。'
        return
      }
      if (!chunks.length) {
        error.value = '未录制到任何数据：片段可能未能播放，请重试或更换浏览器'
        return
      }
      const blob = new Blob(chunks, { type: 'video/webm' })
      chunks = []
      if (blob.size < 1024) {
        error.value = '录制结果异常（数据为空），请重试或更换新版浏览器'
        return
      }
      resultUrl.value = URL.createObjectURL(blob)
      resultName.value = clipNameOf(startSec.value, endSec.value)
      resultSize.value = blob.size
    }

    recorder.start(1000)
    pumpFrame(ctx, video)
    await video.play()
  } catch (err) {
    // 启动半途失败按中止收尾：置 aborted 使 recorder.onstop 丢弃已录分片，
    // 避免 play() 被拒等情况下仍产出一段不完整的「导出完成」结果
    aborted = true
    finishExport()
    error.value = '导出失败：' + (err && err.message ? err.message : '视频未能自动播放，请重试')
  }
}

// ---------- 结果下载 ----------
function downloadResult() {
  if (!resultUrl.value || !resultName.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = resultName.value
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

onMounted(() => {
  addRecentTool('video-trimmer')
  // 能力检测仅在客户端 onMounted 执行（SSR 安全）
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
  stopRecorderSafe()
  finishExport()
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  clearResult()
  teardownAudioGraph()
})
</script>
