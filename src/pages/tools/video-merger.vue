<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- 隐 video 元素：每段各一个，仅用于本地解码与顺序播放（画面经 canvas 适配后预览/录制） -->
    <div class="pointer-events-none fixed left-0 top-0 h-px w-px overflow-hidden opacity-0" aria-hidden="true">
      <video
        v-for="clip in clips"
        :key="clip.id"
        :ref="(el) => registerClipVideo(clip.id, el)"
        :src="clip.url"
        playsinline
        preload="auto"
        tabindex="-1"
        @loadedmetadata="onClipMeta(clip)"
        @loadeddata="onClipLoadedData(clip)"
        @durationchange="onClipMeta(clip)"
        @error="onClipError(clip)"
        @timeupdate="onClipTimeUpdate"
        @ended="onClipEnded"
      ></video>
    </div>

    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Merge class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">视频拼接合并</h1>
          <p class="text-sm text-muted-foreground mt-1">多段视频按顺序拼成一个文件，统一分辨率编码，段间无缝衔接，本地处理不上传</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        在线视频拼接合并工具：把分段拍摄、多段录屏或「片头 + 正片 + 片尾」等多段视频按顺序合成一个文件。
        支持调整片段顺序、统一输出分辨率（跟随第一段 / 720p / 1080p），画面不一致时按等比适配居中并补黑边、不拉伸变形；
        每段原声依次保留、互不串音。合成采用实时顺序录制：画布流全程不断开，片段依次播放并逐帧重绘，
        全程在浏览器内完成，视频不会上传服务器。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：解码、拼接与重编码全部在本机完成，视频不会上传到任何服务器。
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧控制面板 -->
      <div class="space-y-6">
        <!-- 添加片段 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <ListVideo class="w-5 h-5 mr-2 text-primary" /> 添加视频片段
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
              multiple
              class="hidden"
              @change="handleFileChange"
            />
            <p class="text-sm font-medium text-foreground">点击或拖入多段视频（可多选）</p>
            <p class="text-xs text-muted-foreground mt-1">mp4 / webm / mov / m4v，按添加顺序拼接</p>
            <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <ShieldCheck class="w-3 h-3" /> 本地合成，视频不上传
            </p>
          </div>
          <p v-if="bigFileHint" class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-start gap-1">
            <Info class="w-3 h-3 flex-shrink-0 mt-0.5" /> {{ bigFileHint }}
          </p>
          <p v-if="clips.length" class="text-[10px] text-muted-foreground mt-2">
            已添加 {{ clips.length }} 段 · 总时长约 {{ formatTime(totalDuration) }} · 共 {{ formatSize(totalSize) }}
          </p>
        </div>

        <!-- 片段顺序列表 -->
        <div v-if="clips.length" class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ArrowUpDown class="w-5 h-5 mr-2 text-primary" /> 片段顺序
          </h2>
          <ul class="space-y-2">
            <li
              v-for="(clip, i) in clips"
              :key="clip.id"
              class="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2"
            >
              <span class="w-6 h-6 flex-shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{{ i + 1 }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-foreground truncate" :title="clip.name">{{ clip.name }}</p>
                <p v-if="clip.error" class="text-[10px] text-destructive">无法解码（编码不受支持），请移除后重试</p>
                <p v-else-if="!clip.ready" class="text-[10px] text-muted-foreground">读取信息中…</p>
                <p v-else class="text-[10px] text-muted-foreground">
                  {{ formatSize(clip.size) }} · 时长 {{ formatTime(clip.duration) }} · {{ clip.w }}×{{ clip.h }}
                </p>
              </div>
              <span v-if="resolutionMode === 'first' && i === 0" class="flex-shrink-0 text-[10px] text-primary bg-primary/10 rounded px-1.5 py-0.5">定分辨率</span>
              <div class="flex-shrink-0 flex items-center gap-0.5">
                <button
                  @click="moveClip(i, -1)"
                  :disabled="i === 0 || status === 'processing'"
                  class="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
                  title="上移"
                >
                  <ArrowUp class="w-3.5 h-3.5" />
                </button>
                <button
                  @click="moveClip(i, 1)"
                  :disabled="i === clips.length - 1 || status === 'processing'"
                  class="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
                  title="下移"
                >
                  <ArrowDown class="w-3.5 h-3.5" />
                </button>
                <button
                  @click="removeClip(i)"
                  :disabled="status === 'processing'"
                  class="p-1 text-muted-foreground hover:text-destructive disabled:opacity-40"
                  title="移除"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          </ul>
          <p class="text-xs text-muted-foreground">用上移 / 下移调整拼接顺序，第 1 段在「跟随第一段」模式下决定输出分辨率。</p>
        </div>

        <!-- 输出设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 输出设置
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">输出分辨率</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="r in resolutionOptions"
                :key="r.id"
                @click="resolutionMode = r.id"
                :disabled="status === 'processing'"
                :class="resolutionMode === r.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              >{{ r.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              各段画面按等比缩放置于输出框内居中（contain），不足处补黑边，画面不会被拉伸变形；统一 720p / 1080p 时按第一段方向决定横竖。
            </p>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="keepAudio"
              type="checkbox"
              id="mergeKeepAudio"
              :disabled="status === 'processing'"
              class="w-4 h-4 rounded border border-border"
            />
            <label for="mergeKeepAudio" class="text-sm text-foreground">保留各段原声（依次拼接，无串音；取消则输出无声视频）</label>
          </div>

          <!-- 输出信息 -->
          <div class="bg-muted/50 rounded-lg p-3 space-y-1.5 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">片段数 / 总时长</span>
              <span class="text-foreground font-medium">{{ clips.length }} 段 · {{ formatTime(totalDuration) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">输出尺寸</span>
              <span class="text-foreground font-medium font-mono">{{ outDims.w && outDims.h ? outDims.w + '×' + outDims.h : '添加片段后显示' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">输出格式</span>
              <span class="text-foreground font-medium">{{ mimeLabelText }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">视频码率</span>
              <span class="text-foreground font-medium">{{ Math.round(outBitrate / 1000) }} kbps（按素材推算）</span>
            </div>
            <div v-if="estBytes > 0" class="flex justify-between">
              <span class="text-muted-foreground">预计输出体积</span>
              <span class="text-foreground font-medium">约 {{ formatSize(estBytes) }}（估算值）</span>
            </div>
            <p class="text-[10px] text-muted-foreground flex items-start gap-1">
              <Info class="w-3 h-3 flex-shrink-0 mt-0.5" />
              段间为硬切衔接：切换瞬间画面短暂过渡、录制不停流，不会出现长时间黑屏或卡顿。
            </p>
          </div>
        </div>

        <!-- 开始合成 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Merge class="w-5 h-5 mr-2 text-primary" /> 开始合成
            </h2>
            <span class="px-2 py-0.5 rounded-full border border-border text-xs" :class="statusChipClass">{{ statusLabel }}</span>
          </div>

          <button
            @click="startMerge"
            :disabled="!canStart"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Loader2 v-if="status === 'processing'" class="w-4 h-4 animate-spin" />
            <Merge v-else class="w-4 h-4" />
            {{ status === 'processing' ? '实时合成中，请勿切换标签页' : '开始合成（实时进行，耗时≈素材总时长）' }}
          </button>

          <button
            v-if="status === 'processing'"
            @click="stopMerge"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-all"
          >
            停止并保存已合成部分
          </button>

          <!-- 进度（实时录制：按片段播放进度累计） -->
          <div v-if="status === 'processing'">
            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full transition-all" :style="{ width: progressPct + '%' }"></div>
            </div>
            <p class="text-[10px] text-muted-foreground mt-1.5">
              第 {{ Math.max(1, currentIdx + 1) }}/{{ clips.length }} 段 · 已合成 {{ formatTime(recordedSeconds) }} / 总 {{ formatTime(totalDuration) }}（{{ progressPct }}%，实时录制：合成耗时 ≈ 素材总时长）
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
            方式说明：浏览器没有「离线拼接视频」的 API，本工具采用实时顺序录制——画布采集流全程不断开，
            各段视频依次播放、逐帧按输出分辨率重绘并同步录制，因此合成耗时约等于素材总时长
            （30 分钟素材约需 30 分钟）。输出优先 MP4（新版 Chrome / Safari 支持），否则为 WebM。
            录制期间请保持页面在前台。
          </p>
        </div>

        <!-- 浏览器不支持提示 -->
        <div v-if="supportChecked && !canRecord" class="bg-card border border-amber-500/40 rounded-lg p-4 space-y-2">
          <p class="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <TriangleAlert class="w-4 h-4" /> 当前浏览器不支持视频拼接导出
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            本工具依赖 canvas.captureStream 与 MediaRecorder 录制能力（新版 Chrome / Edge / Firefox / Safari 支持）。
            请更换浏览器后重试，或使用桌面端剪辑软件拼接视频。
          </p>
        </div>
      </div>

      <!-- 右侧：预览与结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 合成效果预览 -->
        <div v-if="clips.length" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center justify-between flex-wrap gap-2">
            <span class="flex items-center"><MonitorPlay class="w-5 h-5 mr-2 text-primary" /> 输出画面预览</span>
            <span v-if="status === 'processing'" class="text-xs font-normal text-amber-600 dark:text-amber-400">（正在实时录制，画面即输出）</span>
          </h2>
          <canvas ref="previewCanvas" class="block mx-auto max-w-full max-h-96 rounded-lg bg-black"></canvas>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">片段数</p>
              <p class="text-sm font-bold text-foreground">{{ clips.length }} 段</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">总时长</p>
              <p class="text-sm font-bold text-foreground font-mono">{{ formatTime(totalDuration) }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">输出尺寸</p>
              <p class="text-sm font-bold text-primary font-mono">{{ outDims.w ? outDims.w + '×' + outDims.h : '—' }}</p>
            </div>
          </div>
          <p class="text-[10px] text-muted-foreground">预览显示第 1 段首帧按输出设置适配后的效果：画面居中等比缩放，两侧（或上下）不足处为黑边。</p>
        </div>

        <!-- 处理结果 -->
        <div v-if="resultUrl && resultInfo" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle2 class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" /> 合成完成<span v-if="partial" class="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">（提前停止，输出为已合成部分）</span>
          </h2>
          <video :src="resultUrl" controls playsinline class="w-full max-h-96 rounded-lg bg-black"></video>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">输出尺寸</p>
              <p class="text-sm font-bold text-foreground font-mono">{{ outDims.w }}×{{ outDims.h }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">拼接段数</p>
              <p class="text-sm font-bold text-foreground">{{ clips.length }} 段</p>
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
        <div v-if="!clips.length && !resultUrl" class="bg-card border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
          添加多段视频后，这里会显示输出画面预览与合成结果
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于在线视频拼接合并</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            一段长视频分几次才录完、手机相册里躺着多段素材想连成一条、需要给正片加上片头片尾、
            网课录屏被系统按 5 分钟一段切开……这些都可以用「视频拼接合并」一次搞定。
            本工具在浏览器里依次解码各段视频、按顺序逐帧重绘到画布并实时重编码为一条完整视频，
            支持调整片段顺序、统一输出分辨率，各段原声依次保留、互不串音。
            视频自始至终不离开你的电脑，适合处理会议录像、家庭视频等隐私内容。
          </p>

          <h3 class="text-lg font-semibold text-foreground">怎么把多段视频拼接成一个？</h3>
          <ol class="list-decimal list-inside space-y-1.5">
            <li>点击或拖入多段视频（支持一次多选），按需用上移 / 下移调整拼接顺序，移除不需要的片段；</li>
            <li>选择输出分辨率：跟随第一段、统一 720p 或统一 1080p，尺寸不一致的片段会等比适配并补黑边；</li>
            <li>确认是否保留各段原声，点「开始合成」——合成实时进行，耗时约等于素材总时长（30 分钟素材约需 30 分钟）；</li>
            <li>完成后预览成片并下载 原名-merged 文件（MP4 或 WebM，取决于浏览器能力）。</li>
          </ol>

          <h3 class="text-lg font-semibold text-foreground">分辨率不一致的多段视频能拼吗？</h3>
          <p>
            能。合成时每段画面都会按<b class="text-foreground">等比缩放、居中放置</b>（contain 适配）到输出框内：
            横屏片段拼进竖屏输出框会在上下补黑边，竖屏片段拼进横屏输出框会在左右补黑边，画面永远不会被拉伸变形。
            输出分辨率可选「跟随第一段」（最省事，后续片段自动适配）或「统一 720p / 1080p」
            （横竖方向按第一段自动判断）。如果各段分辨率差异很大，建议先用站内
            <NuxtLink to="/tools/video-compressor/" class="text-primary hover:underline">视频压缩</NuxtLink>
            统一压到相近分辨率再拼，成片观感更一致。
          </p>

          <h3 class="text-lg font-semibold text-foreground">为什么合成耗时约等于素材总时长？</h3>
          <p>
            浏览器没有可以离线、快速转码的 API，本工具采用「实时顺序录制」方案：画布采集流全程不断开，
            各段视频依次真实播放一遍，画面逐帧重绘、声音经增益切换同步采集，播放完的瞬间成片也就完成了。
            因此 30 分钟素材约需 30 分钟，1 小时素材约需 1 小时。录制期间请保持页面在前台、别锁屏；
            段与段之间为硬切衔接，切换在毫秒级完成，不会出现长时间黑屏或卡顿。
          </p>

          <h3 class="text-lg font-semibold text-foreground">各段的音轨是怎么处理的？</h3>
          <p>
            每段视频的音频都会单独接入同一条录制音轨：正在播放的片段增益为 1、其余片段增益为 0，
            因此各段声音按顺序原样保留、边界清晰，不会出现两段声音叠在一起串音的情况。
            不需要声音时取消勾选「保留各段原声」，输出即为无声视频。
          </p>

          <h3 class="text-lg font-semibold text-foreground">视频数据会上传吗？</h3>
          <p>
            不会。视频通过对象 URL（Blob URL）在浏览器内解码，排序、拼接与重编码全部在本机完成，
            页面不会发出任何包含视频数据的网络请求，关闭或刷新页面后内存即释放。
          </p>

          <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
          <div class="space-y-4">
            <div>
              <h3 class="text-base font-semibold text-foreground">怎么把多段视频拼接成一个？</h3>
              <p class="text-sm text-muted-foreground mt-1">添加多段视频（可多选），用上移/下移调整顺序，选择输出分辨率后点「开始合成」；合成实时进行，耗时约等于素材总时长，完成后下载 原名-merged 文件。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">分辨率不一致的多段视频能拼吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">能。每段画面按等比缩放置于输出框内居中（contain），不足处补黑边、不拉伸变形；可选跟随第一段或统一 720p/1080p，横竖方向按第一段自动判断。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">拼接要等多久？</h3>
              <p class="text-sm text-muted-foreground mt-1">合成实时进行，耗时约等于素材总时长：30 分钟素材约需 30 分钟。录制期间请保持页面在前台；中途停止会保存已合成的部分。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">段与段之间会有黑屏或卡顿吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">不会长时间卡顿：画布采集流全程不断开，段间为毫秒级硬切衔接；各段声音经增益开关依次保留，不会互相串音。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">视频会上传到服务器吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">不会。视频在浏览器内存中解码、拼接与重编码，全程本地完成，不发任何网络请求，关闭页面即释放。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'video-merger'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Merge, ListVideo, ArrowUpDown, ArrowUp, ArrowDown, Upload, X, Download,
  TriangleAlert, CheckCircle2, ChevronUp, ChevronDown, Info, Loader2,
  MonitorPlay, Settings2, ShieldCheck
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const tool = tools.find((t) => t.id === 'video-merger')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- SEO ----------
useSeoMeta({
  title: '视频拼接合并 - 在线合并多个视频为一个，多段视频拼接工具',
  description: '免费在线视频拼接合并工具：多段视频按顺序合成一个文件，可调整片段顺序，统一 720p/1080p 或跟随第一段分辨率，画面等比适配补黑边，各段原声保留无串音，本地实时合成不上传服务器',
  keywords: '视频拼接, 视频合并, 多段视频合成, 视频拼接器, 在线合并视频, 片头片尾拼接',
  author: '有条工具',
  ogTitle: '视频拼接合并 - 在线合并多个视频为一个 | 有条工具',
  ogDescription: '多段视频按顺序拼接，统一分辨率编码，段间无缝衔接，本地实时合成不上传。',
  ogUrl: 'https://www.util.cn/tools/video-merger',
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
          name: '视频拼接合并',
          url: 'https://www.util.cn/tools/video-merger',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['多段视频按顺序拼接', '上移/下移调整片段顺序', '跟随第一段或统一 720p/1080p 输出', '画面等比适配 contain 补黑边', '段间无缝衔接录制不停流', '各段原声保留无串音', '本地实时合成不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '视频拼接合并', item: 'https://www.util.cn/tools/video-merger/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '怎么把多段视频拼接成一个？',
              acceptedAnswer: { '@type': 'Answer', text: '添加多段视频（可多选），用上移/下移调整顺序，选择输出分辨率后点开始合成；合成实时进行，耗时约等于素材总时长，完成后下载原名-merged文件。' }
            },
            {
              '@type': 'Question',
              name: '分辨率不一致的多段视频能拼吗？',
              acceptedAnswer: { '@type': 'Answer', text: '能。每段画面按等比缩放置于输出框内居中（contain），不足处补黑边、不拉伸变形；可选跟随第一段或统一720p/1080p，横竖方向按第一段自动判断。' }
            },
            {
              '@type': 'Question',
              name: '拼接要等多久？',
              acceptedAnswer: { '@type': 'Answer', text: '合成实时进行，耗时约等于素材总时长：30分钟素材约需30分钟。录制期间请保持页面在前台；中途停止会保存已合成的部分。' }
            },
            {
              '@type': 'Question',
              name: '段与段之间会有黑屏或卡顿吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会长时间卡顿：画布采集流全程不断开，段间为毫秒级硬切衔接；各段声音经增益开关依次保留，不会互相串音。' }
            },
            {
              '@type': 'Question',
              name: '视频会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。视频在浏览器内存中解码、拼接与重编码，全程本地完成，不发任何网络请求，关闭页面即释放。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯函数（node 自测提取区）begin ----------
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

// 输出码率（bps）：按素材平均码率（总字节×8÷总秒数）推算，钳制 1～8 Mbps，异常时回退 2.5 Mbps
function bitrateOfSource(fileSizeBytes, durationSec) {
  const b = Number(fileSizeBytes)
  const d = Number(durationSec)
  if (!isFinite(b) || !isFinite(d) || b <= 0 || d <= 0) return 2500000
  return Math.min(8000000, Math.max(1000000, Math.round((b * 8) / d)))
}

// 输出文件名：第一段原名-merged.扩展名（无扩展名输入时回退 video）
function buildOutputName(baseName, suffix, ext) {
  const base = String(baseName || 'video').replace(/\.[^.]+$/, '') || 'video'
  return `${base}-${suffix}.${ext || 'webm'}`
}

// 总时长预计 = Σ段时长（忽略非法值：非数字 / NaN / Infinity / 负数 / 0）
function sumDurations(durations) {
  const list = Array.isArray(durations) ? durations : []
  return list.reduce((acc, d) => {
    const n = Number(d)
    return acc + (isFinite(n) && n > 0 ? n : 0)
  }, 0)
}

// 画面适配（contain）：源画面等比缩放至目标框内并居中（letterbox），返回绘制矩形
// 任意维度非法（≤0）返回全零矩形；结果保证整数、不出目标框
function computeFit(sw, sh, dw, dh) {
  const s = Math.round(Number(sw) || 0)
  const t = Math.round(Number(sh) || 0)
  const dW = Math.round(Number(dw) || 0)
  const dH = Math.round(Number(dh) || 0)
  if (s <= 0 || t <= 0 || dW <= 0 || dH <= 0) return { x: 0, y: 0, w: 0, h: 0 }
  const scale = Math.min(dW / s, dH / t)
  let w = Math.max(1, Math.round(s * scale))
  let h = Math.max(1, Math.round(t * scale))
  w = Math.min(w, dW)
  h = Math.min(h, dH)
  const x = Math.round((dW - w) / 2)
  const y = Math.round((dH - h) / 2)
  return { x, y, w, h }
}

// 输出分辨率：跟随第一段，或统一 720p / 1080p（横竖方向按第一段宽高判断）
function unifiedOutputSize(preset, firstW, firstH) {
  const fw = Math.round(Number(firstW) || 0)
  const fh = Math.round(Number(firstH) || 0)
  if (preset !== '720p' && preset !== '1080p') return { w: fw, h: fh }
  if (!fw || !fh) return { w: 0, h: 0 }
  const portrait = fh > fw
  if (preset === '720p') return portrait ? { w: 720, h: 1280 } : { w: 1280, h: 720 }
  return portrait ? { w: 1080, h: 1920 } : { w: 1920, h: 1080 }
}
// ---------- 纯函数（node 自测提取区）end ----------

const MAX_FPS = 30                    // canvas.captureStream 采集帧率
const SOFT_LIMIT_BYTES = 200 * 1024 * 1024  // 总体积提醒阈值 200MB
const HARD_LIMIT_BYTES = 1024 * 1024 * 1024 // 单文件硬上限 1GB（内存安全）

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
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

// ---------- 状态 ----------
const fileInput = ref(null)
const previewCanvas = ref(null)
const clips = ref([]) // { id, name, size, url, duration, w, h, ready, error }
const isDragging = ref(false)
const error = ref('')
const warnText = ref('')
const partial = ref(false)

const resolutionMode = ref('first') // first | 720p | 1080p
const keepAudio = ref(true)
const currentIdx = ref(-1)     // 正在合成的片段下标（-1 = 未开始）
const currentSeconds = ref(0)  // 当前片段已播放秒数

// 状态机：idle（未添加片段）→ ready（就绪）→ processing（实时合成中）→ done / error
const status = ref('idle')

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
let aborted = false
let recordStream = null // 本次录制自建的 canvas 采集流（结束时须 stop 释放）
let audioReady = false
// AudioContext 音频图：每段 video 各建 MediaElementSource → 各自 GainNode → 同一 MediaStreamDestination
// 当前段 gain=1、其余=0（防串音）；GainNode 同时连扬声器作监听支路。MediaElementSource 与元素一一
// 绑定且只能创建一次，跨多次合成复用，仅在组件卸载时销毁 AudioContext。
let audioCtx = null
let audioDestNode = null
const clipAudio = new Map() // clipId -> { src, gain }
const videoEls = new Map()  // clipId -> HTMLVideoElement

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const resolutionOptions = [
  { id: 'first', label: '跟随第一段' },
  { id: '720p', label: '统一 720p' },
  { id: '1080p', label: '统一 1080p' }
]

const STATUS_LABELS = { idle: '待添加片段', ready: '已就绪', processing: '合成中', done: '已完成', error: '出错' }

// ---------- 计算属性 ----------
const canRecord = computed(() => support.value.recorder && support.value.capture && !!pickedMime.value)
const allClipsReady = computed(() => clips.value.length > 0 && clips.value.every((c) => c.ready && !c.error))
const hasBadClip = computed(() => clips.value.some((c) => c.error))
const canStart = computed(() => allClipsReady.value && canRecord.value && status.value !== 'processing')
const totalDuration = computed(() => sumDurations(clips.value.map((c) => c.duration)))
const totalSize = computed(() => clips.value.reduce((acc, c) => acc + (Number(c.size) || 0), 0))
const firstClipSize = computed(() => (clips.value.length ? { w: clips.value[0].w, h: clips.value[0].h } : { w: 0, h: 0 }))
const outDims = computed(() => unifiedOutputSize(resolutionMode.value, firstClipSize.value.w, firstClipSize.value.h))
const outBitrate = computed(() => bitrateOfSource(totalSize.value, totalDuration.value))
const estBytes = computed(() => {
  if (!totalDuration.value) return 0
  const audioBps = keepAudio.value ? 128000 : 0
  return Math.round(((outBitrate.value + audioBps) * totalDuration.value) / 8)
})
const progressPct = computed(() => (totalDuration.value > 0 ? Math.min(100, Math.round((recordedSeconds.value / totalDuration.value) * 100)) : 0))
const recordedSeconds = computed(() => {
  const i = currentIdx.value
  if (i < 0 || i >= clips.value.length) return 0
  const prev = sumDurations(clips.value.slice(0, i).map((c) => c.duration))
  const cur = clips.value[i].duration || 0
  return prev + Math.min(currentSeconds.value, cur)
})
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
const bigFileHint = computed(() => {
  if (totalSize.value > SOFT_LIMIT_BYTES) {
    return `素材总体积约 ${formatSize(totalSize.value)}：浏览器实时合成大体积素材较慢且占用内存，建议先用视频压缩工具压到 200MB 以内再拼接。`
  }
  return ''
})

// 选项 / 片段顺序变化：同步画布尺寸并重绘预览（合成中已锁定选项，不响应）
watch(resolutionMode, () => {
  if (status.value === 'processing') return
  syncPreviewCanvas()
  drawPreview()
})
watch(() => (clips.value.length && clips.value[0] ? clips.value[0].id : ''), () => {
  if (status.value === 'processing') return
  syncPreviewCanvas()
  drawPreview()
})

// ---------- 片段管理（SSR 安全：对象 URL 仅在用户回调内创建） ----------
let clipSeq = 0
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

function clearResult() {
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = ''
  resultInfo.value = null
  partial.value = false
}

function releaseClipAudio(clipId) {
  const nodes = clipAudio.get(clipId)
  if (nodes) {
    try { nodes.src.disconnect() } catch (err) { /* 忽略 */ }
    try { nodes.gain.disconnect() } catch (err) { /* 忽略 */ }
    clipAudio.delete(clipId)
  }
}

function afterClipsMutated() {
  // 片段增删/排序后：清空旧结果并回到就绪态（合成中不触发）
  if (status.value === 'processing') return
  clearResult()
  status.value = clips.value.length ? 'ready' : 'idle'
  error.value = ''
  syncPreviewCanvas()
  drawPreview()
}

function acceptFiles(fileList) {
  const files = Array.from(fileList || [])
  if (!files.length) return
  if (status.value === 'processing') {
    error.value = '正在合成，请先停止后再添加片段'
    return
  }
  error.value = ''
  warnText.value = ''
  for (const f of files) {
    const typeOk = !f.type || f.type.startsWith('video/')
    const name = (f.name || '').toLowerCase()
    const extOk = ['.mp4', '.webm', '.mov', '.m4v'].some((ext) => name.endsWith(ext))
    if (!typeOk && !extOk) {
      error.value = `「${f.name}」不是视频文件（mp4 / webm / mov 等），已跳过`
      continue
    }
    if (f.size > HARD_LIMIT_BYTES) {
      error.value = `「${f.name}」超过 1GB：浏览器本地解码重编码容易内存不足，请先用视频压缩工具压小后再拼接`
      continue
    }
    clipSeq += 1
    clips.value.push({
      id: clipSeq,
      name: f.name || `片段${clipSeq}`,
      size: f.size,
      url: URL.createObjectURL(f),
      duration: 0,
      w: 0,
      h: 0,
      ready: false,
      error: false
    })
  }
  afterClipsMutated()
}

function handleFileChange(e) {
  acceptFiles(e.target.files)
  e.target.value = ''
}

function handleDrop(e) {
  isDragging.value = false
  acceptFiles(e.dataTransfer.files)
}

function moveClip(index, dir) {
  if (status.value === 'processing') return
  const target = index + dir
  if (target < 0 || target >= clips.value.length) return
  const list = clips.value
  const tmp = list[index]
  list[index] = list[target]
  list[target] = tmp
  afterClipsMutated()
}

function removeClip(index) {
  if (status.value === 'processing') return
  const removed = clips.value[index]
  if (!removed) return
  if (removed.url) URL.revokeObjectURL(removed.url)
  releaseClipAudio(removed.id)
  videoEls.delete(removed.id)
  clips.value.splice(index, 1)
  afterClipsMutated()
}

// 隐 video 元素注册（v-for 函数式 ref）
function registerClipVideo(clipId, el) {
  if (el) videoEls.set(clipId, el)
  else videoEls.delete(clipId)
}

// ---------- 片段元信息 ----------
function onClipMeta(clip) {
  const el = videoEls.get(clip.id)
  if (!el) return
  clip.duration = isFinite(el.duration) ? el.duration : 0
  clip.w = el.videoWidth
  clip.h = el.videoHeight
  clip.ready = clip.duration > 0 && el.videoWidth > 0 && el.videoHeight > 0
  if (!clip.ready) {
    clip.error = true
  }
  if (clips.value[0] && clips.value[0].id === clip.id && status.value !== 'processing') {
    syncPreviewCanvas()
  }
}

function onClipLoadedData(clip) {
  // 首帧数据就绪：第 1 段可画出静态输出预览
  if (clips.value[0] && clips.value[0].id === clip.id && status.value !== 'processing') {
    syncPreviewCanvas()
    drawPreview()
  }
}

function onClipError(clip) {
  clip.error = true
  clip.ready = false
  if (status.value === 'processing') {
    abortMerge(`片段「${clip.name}」解码失败，合成已中止`)
  }
}

// ---------- 画布：输出预览（预览 = 输出画面，黑边按 contain 绘制） ----------
function syncPreviewCanvas() {
  const c = previewCanvas.value
  if (!c) return
  const out = outDims.value
  if (out.w > 0 && out.h > 0 && (c.width !== out.w || c.height !== out.h)) {
    c.width = out.w
    c.height = out.h
  }
}

function fillCanvasBlack() {
  const c = previewCanvas.value
  if (!c) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, c.width, c.height)
}

// 静态预览：画第 1 段首帧按 contain 适配后的效果
function drawPreview() {
  const c = previewCanvas.value
  if (!c || !c.width) return
  const first = clips.value[0]
  const v = first ? videoEls.get(first.id) : null
  const ctx = c.getContext('2d')
  if (!ctx) return
  fillCanvasBlack()
  if (!v || !v.videoWidth || !v.videoHeight || v.readyState < 2) return
  const fit = computeFit(v.videoWidth, v.videoHeight, c.width, c.height)
  try {
    ctx.drawImage(v, 0, 0, v.videoWidth, v.videoHeight, fit.x, fit.y, fit.w, fit.h)
  } catch (err) { /* 首帧未就绪时忽略 */ }
}

// ---------- 音频图：每段 video 各建 Source → Gain → 同一 Destination ----------
function ensureAudioGraph() {
  if (audioCtx && audioCtx.state !== 'closed' && audioDestNode) {
    if (audioCtx.state === 'suspended') audioCtx.resume()
    return true
  }
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (typeof Ctx !== 'function') return false
    if (audioCtx && audioCtx.state !== 'closed') {
      try { audioCtx.close() } catch (err) { /* 忽略 */ }
    }
    clipAudio.clear()
    audioCtx = new Ctx()
    audioDestNode = audioCtx.createMediaStreamDestination()
    return true
  } catch (err) {
    teardownAudioGraph()
    return false
  }
}

function ensureClipAudio(clipId, el) {
  if (!audioCtx || audioCtx.state === 'closed' || !audioDestNode) return null
  if (clipAudio.has(clipId)) return clipAudio.get(clipId)
  try {
    const src = audioCtx.createMediaElementSource(el)
    const gain = audioCtx.createGain()
    gain.gain.value = 0
    src.connect(gain)
    gain.connect(audioDestNode)        // 录制支路：供 MediaRecorder 采集
    gain.connect(audioCtx.destination) // 监听支路：合成期间可听见当前段
    const nodes = { src, gain }
    clipAudio.set(clipId, nodes)
    return nodes
  } catch (err) {
    return null
  }
}

// 当前段增益 1、其余 0（防串音）；activeIdx 传 -1 表示全部静音
function setGains(activeIdx) {
  if (!audioCtx || audioCtx.state === 'closed') return
  clips.value.forEach((clip, i) => {
    const nodes = clipAudio.get(clip.id)
    if (nodes) {
      try { nodes.gain.gain.value = i === activeIdx ? 1 : 0 } catch (err) { /* 忽略 */ }
    }
  })
}

function teardownAudioGraph() {
  if (audioCtx && audioCtx.state !== 'closed') {
    try { audioCtx.close() } catch (err) { /* 忽略 */ }
  }
  audioCtx = null
  audioDestNode = null
  clipAudio.clear()
}

// ---------- 顺序播放：一段播完切下一段（录制不停流） ----------
function findIndexByEl(el) {
  for (const [clipId, candidate] of videoEls.entries()) {
    if (candidate === el) {
      return clips.value.findIndex((c) => c.id === clipId)
    }
  }
  return -1
}

async function playClip(i) {
  const clip = clips.value[i]
  const el = clip ? videoEls.get(clip.id) : null
  if (!el) throw new Error(`第 ${i + 1} 段视频未就绪`)
  currentIdx.value = i
  currentSeconds.value = 0
  setGains(keepAudio.value ? i : -1)
  el.muted = !keepAudio.value
  try { el.currentTime = 0 } catch (err) { /* 忽略 */ }
  fillCanvasBlack() // 段间切换瞬间为黑场硬切，避免残留上一段画面
  await el.play()
}

function onClipTimeUpdate(ev) {
  if (status.value !== 'processing') return
  const el = ev && ev.target
  const i = currentIdx.value
  const activeEl = (i >= 0 && clips.value[i]) ? videoEls.get(clips.value[i].id) : null
  if (!el || el !== activeEl) return
  currentSeconds.value = el.currentTime || 0
}

async function onClipEnded(ev) {
  if (status.value !== 'processing') return
  const el = ev && ev.target
  const idx = el ? findIndexByEl(el) : -1
  if (idx < 0 || idx !== currentIdx.value) return
  if (idx >= clips.value.length - 1) {
    // 最后一段自然播完：收尾录制（非手动停止，不标记 partial）
    partial.value = false
    stopRecorderSafe()
  } else {
    try {
      await playClip(idx + 1)
    } catch (err) {
      abortMerge(`第 ${idx + 2} 段「${clips.value[idx + 1] ? clips.value[idx + 1].name : ''}」未能自动播放，合成已中止：${err && err.message ? err.message : '请重试'}`)
    }
  }
}

// 预热播放权限：Safari 等浏览器要求每个媒体元素都获得过手势内的 play() 批准，
// 在用户点击的同一手势里对每段 play() 后立即暂停（当前段豁免，避免打断正式录制）
function primeClipsForPlayback() {
  clips.value.forEach((clip) => {
    const el = videoEls.get(clip.id)
    if (!el) return
    try {
      const p = el.play()
      if (p && typeof p.then === 'function') {
        p.then(() => {
          const active = currentIdx.value >= 0 ? clips.value[currentIdx.value] : null
          if (active && active.id === clip.id) return
          try { el.pause(); el.currentTime = 0 } catch (err) { /* 忽略 */ }
        }).catch(() => { /* 自动播放被拒：正式播放时再报错 */ })
      }
    } catch (err) { /* 忽略 */ }
  })
}

// ---------- 逐帧绘制循环（rAF：多元素轮播场景比 rvfc 更稳） ----------
function pumpFrame() {
  if (status.value !== 'processing') return
  const c = previewCanvas.value
  const i = currentIdx.value
  const v = (i >= 0 && clips.value[i]) ? videoEls.get(clips.value[i].id) : null
  if (c && v && v.videoWidth && v.videoHeight) {
    const ctx = c.getContext('2d')
    if (ctx) {
      try {
        const fit = computeFit(v.videoWidth, v.videoHeight, c.width, c.height)
        ctx.drawImage(v, 0, 0, v.videoWidth, v.videoHeight, fit.x, fit.y, fit.w, fit.h)
      } catch (err) { /* 单帧绘制失败不中断录制 */ }
    }
  }
  rafId = requestAnimationFrame(() => pumpFrame())
}

function stopPump() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

function stopRecorderSafe() {
  if (recorder && recorder.state !== 'inactive') {
    try { recorder.stop() } catch (err) { /* 忽略 */ }
  }
}

// 手动停止：保留已合成的部分并产出结果
function stopMerge() {
  if (status.value !== 'processing') return
  partial.value = true
  stopRecorderSafe()
}

// 录制异常中止：置 aborted 使 onstop 丢弃已录分片
function abortMerge(msg) {
  error.value = msg
  aborted = true
  stopRecorderSafe()
}

// 合成结束（正常/中止）后的统一恢复
function finishMergeCleanup() {
  stopPump()
  stopRecorderSafe()
  recorder = null
  if (recordStream) {
    recordStream.getTracks().forEach((t) => {
      try { t.stop() } catch (err) { /* 忽略 */ }
    })
    recordStream = null
  }
  setGains(-1)
  clips.value.forEach((clip) => {
    const el = videoEls.get(clip.id)
    if (el) {
      try { el.pause() } catch (err) { /* 忽略 */ }
      el.muted = false
    }
  })
  currentIdx.value = -1
  currentSeconds.value = 0
}

function onRecorderStop() {
  finishMergeCleanup()
  if (aborted) {
    chunks = []
    if (!error.value) error.value = '处理已中断，未保存结果。'
    status.value = 'error'
    return
  }
  if (!chunks.length) {
    status.value = 'error'
    error.value = '未录制到任何数据：片段可能未能播放，请重试或更换浏览器'
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
    name: buildOutputName(clips.value.length ? clips.value[0].name : 'video', 'merged', outputExt.value),
    size: blob.size
  }
  status.value = 'done'
}

// ---------- 主流程：实时顺序录制合成（用户手势触发） ----------
async function startMerge() {
  if (status.value === 'processing') return // 防重复点击
  if (!clips.value.length) {
    error.value = '请先添加至少一段视频'
    return
  }
  if (hasBadClip.value) {
    error.value = '存在无法解码的片段（红色标注），请先移除后再合成'
    return
  }
  if (!allClipsReady.value) {
    error.value = '片段信息尚未读取完成，请稍候再开始'
    return
  }
  if (!canRecord.value) {
    error.value = '当前浏览器缺少 canvas.captureStream 或 MediaRecorder 能力，请更换新版 Chrome / Edge / Safari'
    return
  }
  error.value = ''
  warnText.value = ''
  clearResult()
  status.value = 'processing'
  currentIdx.value = -1
  currentSeconds.value = 0
  partial.value = false
  aborted = false
  audioReady = false
  try {
    syncPreviewCanvas()
    const c = previewCanvas.value
    if (!c || !c.width || !c.height) throw new Error('画布未就绪，请重试')
    fillCanvasBlack()

    // 音频图（用户手势内创建）：每段 Source → Gain → 同一 Destination
    if (keepAudio.value) {
      audioReady = ensureAudioGraph()
      if (audioReady) {
        clips.value.forEach((clip) => {
          const el = videoEls.get(clip.id)
          if (el) ensureClipAudio(clip.id, el)
        })
        setGains(-1)
      }
    }

    // 预热前先统一静音：预热瞬间尚未开始录制，避免任何一声外放
    clips.value.forEach((clip) => {
      const el = videoEls.get(clip.id)
      if (el) el.muted = !keepAudio.value || !audioReady
    })
    // 预热各段播放权限（Safari 等要求每段媒体元素获得过手势内 play() 批准）
    primeClipsForPlayback()

    // 视频轨：画布采集流全程不断开，段间无缝（recorder 不停）
    recordStream = c.captureStream(MAX_FPS)
    const tracks = recordStream.getVideoTracks().slice()
    if (keepAudio.value) {
      if (audioReady && audioDestNode) {
        tracks.push(...audioDestNode.stream.getAudioTracks())
      } else {
        warnText.value = '未能获取音轨（浏览器限制），本次输出为无声视频。'
      }
    }

    try {
      recorder = new MediaRecorder(new MediaStream(tracks), {
        mimeType: pickedMime.value.mime,
        videoBitsPerSecond: outBitrate.value,
        audioBitsPerSecond: 128000
      })
    } catch (err) {
      finishMergeCleanup()
      status.value = 'error'
      error.value = '当前浏览器不支持创建视频录制器，请更换新版 Chrome / Edge 后重试'
      return
    }
    chunks = []
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data)
    }
    recorder.onerror = () => {
      abortMerge('录制出错：请确认各段视频可正常播放，并保持页面在前台后重试')
    }
    recorder.onstop = onRecorderStop
    recorder.start(1000)
    pumpFrame()
    await playClip(0)
  } catch (err) {
    // 启动半途失败按中断收尾：置 aborted 使 onstop 丢弃已录分片，避免产出不完整结果
    aborted = true
    stopRecorderSafe()
    finishMergeCleanup()
    status.value = 'error'
    error.value = '合成失败：' + (err && err.message ? err.message : '视频未能自动播放，请重试')
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
  finishMergeCleanup()
  clips.value.forEach((clip) => {
    if (clip.url) URL.revokeObjectURL(clip.url)
    releaseClipAudio(clip.id)
  })
  videoEls.clear()
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = ''
  resultInfo.value = null
  teardownAudioGraph()
})
</script>
