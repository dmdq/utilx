<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <VolumeX class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">视频静音</h1>
          <p class="text-sm text-muted-foreground mt-1">去除视频原声或替换为新音轨，输出无声视频，文件不出浏览器</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        在线视频静音工具：两种模式任选——「去除音轨」输出不含任何声音的视频；
        「替换音轨」上传 mp3 / wav 等音频覆盖原声，音频比视频短可循环铺满、比视频长则随视频结束截断。
        视频在本地静音播放并逐帧重录制一遍，全程浏览器内完成，视频与音频都不会上传服务器。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：视频解码、消音与重编码全部在本机完成，不会上传到任何服务器。
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
              <ShieldCheck class="w-3 h-3" /> 本地处理，视频不上传
            </p>
          </div>
          <div v-if="fileName" class="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <Film class="w-4 h-4 text-primary flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
              <p class="text-[10px] text-muted-foreground">
                {{ formatSize(fileSize) }}<span v-if="duration"> · 时长 {{ formatTime(duration) }}</span><span v-if="videoSize.w"> · {{ videoSize.w }}×{{ videoSize.h }}</span>
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

        <!-- 静音模式 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 静音模式
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              @click="mode = 'remove'"
              :disabled="status === 'processing'"
              class="text-left p-3 rounded-lg border transition-colors disabled:opacity-50"
              :class="mode === 'remove' ? 'border-primary bg-primary/5' : 'border-border bg-muted/50 hover:bg-muted/80'"
            >
              <span class="flex items-center gap-2 text-sm font-medium text-foreground">
                <VolumeX class="w-4 h-4 text-primary" /> 去除音轨
              </span>
              <span class="block text-xs text-muted-foreground mt-1">输出不含任何声音的无声视频</span>
            </button>
            <button
              @click="mode = 'replace'"
              :disabled="status === 'processing'"
              class="text-left p-3 rounded-lg border transition-colors disabled:opacity-50"
              :class="mode === 'replace' ? 'border-primary bg-primary/5' : 'border-border bg-muted/50 hover:bg-muted/80'"
            >
              <span class="flex items-center gap-2 text-sm font-medium text-foreground">
                <Music class="w-4 h-4 text-primary" /> 替换音轨
              </span>
              <span class="block text-xs text-muted-foreground mt-1">上传音频文件覆盖视频原声</span>
            </button>
          </div>

          <!-- 去除音轨：输出说明 -->
          <p v-if="mode === 'remove'" class="text-xs text-muted-foreground flex items-start gap-1">
            <Info class="w-3 h-3 flex-shrink-0 mt-0.5" />
            输出将不含音轨：仅保留画面，文件体积更小，任何播放器中都没有声音。
          </p>

          <!-- 替换音轨：音频上传 -->
          <div v-if="mode === 'replace'" class="space-y-3">
            <div
              class="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
              :class="{ 'border-primary/60 bg-primary/5': isAudioDragging }"
              @click="triggerAudioSelect"
              @dragover.prevent="isAudioDragging = true"
              @dragleave.prevent="isAudioDragging = false"
              @drop.prevent="handleAudioDrop"
            >
              <input
                ref="audioInput"
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus"
                class="hidden"
                @change="handleAudioChange"
              />
              <p class="text-sm font-medium text-foreground">点击或拖入替换音频</p>
              <p class="text-xs text-muted-foreground mt-1">mp3 / wav / m4a / aac / ogg 等，本地解码</p>
            </div>

            <div v-if="audioName" class="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <Music class="w-4 h-4 text-primary flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-foreground truncate" :title="audioName">{{ audioName }}</p>
                <p class="text-[10px] text-muted-foreground">
                  {{ formatSize(audioSize) }}<span v-if="audioDuration"> · 时长 {{ formatTime(audioDuration) }}</span><span v-if="audioDecoding"> · 解码中…</span>
                </p>
              </div>
              <button
                @click="clearAudio"
                :disabled="status === 'processing'"
                class="p-1 text-muted-foreground hover:text-destructive disabled:opacity-40"
                title="移除音频"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- 音频循环策略提示 -->
            <p v-if="audioDuration > 0" class="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">{{ audioPlan.note }}</p>
            <div v-if="audioDuration > 0 && duration > 0 && audioDuration < duration" class="flex items-start gap-2">
              <input
                v-model="allowLoop"
                type="checkbox"
                id="muteLoop"
                :disabled="status === 'processing'"
                class="w-4 h-4 mt-0.5 rounded border border-border"
              />
              <label for="muteLoop" class="text-xs text-foreground">音频短于视频时循环铺满</label>
            </div>

            <!-- 替换音频试听 -->
            <div v-if="audioUrl" class="space-y-1.5">
              <p class="text-xs text-muted-foreground">替换音频试听</p>
              <audio :src="audioUrl" controls preload="metadata" class="w-full h-9"></audio>
            </div>

            <p class="text-xs text-muted-foreground flex items-start gap-1">
              <Info class="w-3 h-3 flex-shrink-0 mt-0.5" />
              {{ replaceOutputHint }}
            </p>
          </div>

          <!-- 输出信息 -->
          <div class="bg-muted/50 rounded-lg p-3 space-y-1.5 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">输出音轨</span>
              <span class="text-foreground font-medium">{{ outputAudioText }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">画面内容</span>
              <span class="text-foreground font-medium">与原视频一致（不改变方向与尺寸）</span>
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
          </div>
        </div>

        <!-- 开始处理 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <VolumeX class="w-5 h-5 mr-2 text-primary" /> 开始处理
            </h2>
            <span class="px-2 py-0.5 rounded-full border border-border text-xs" :class="statusChipClass">{{ statusLabel }}</span>
          </div>

          <button
            @click="startProcessing"
            :disabled="!canStart"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Loader2 v-if="status === 'processing'" class="w-4 h-4 animate-spin" />
            <VolumeX v-else class="w-4 h-4" />
            {{ status === 'processing' ? '实时处理中，请勿切换标签页' : '开始处理（耗时≈视频时长）' }}
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
            方式说明：浏览器没有「直接删改音轨」的 API，本工具采用实时重编码——视频静音播放一遍、画面逐帧重绘并同步录制，
            去音轨模式只录画面轨，替换音轨模式混入新音频，耗时约等于视频时长；输出优先 MP4（新版 Chrome / Safari 支持），
            否则为 WebM。录制期间请保持页面在前台。
          </p>
        </div>

        <!-- 浏览器不支持提示 -->
        <div v-if="supportChecked && !canRecord" class="bg-card border border-amber-500/40 rounded-lg p-4 space-y-2">
          <p class="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <TriangleAlert class="w-4 h-4" /> 当前浏览器不支持视频处理
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            本工具依赖 canvas.captureStream 与 MediaRecorder 录制能力（新版 Chrome / Edge / Firefox / Safari 支持）。
            请更换浏览器后重试，或使用系统自带剪辑 App 处理。
          </p>
        </div>
      </div>

      <!-- 右侧：预览与结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 原视频预览 -->
        <div v-if="videoUrl" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center justify-between flex-wrap gap-2">
            <span class="flex items-center"><MonitorPlay class="w-5 h-5 mr-2 text-primary" /> 原视频预览</span>
            <span v-if="status === 'processing'" class="text-xs font-normal text-amber-600 dark:text-amber-400">（处理中：视频正在静音播放并录制）</span>
          </h2>
          <video
            ref="videoEl"
            :src="videoUrl"
            playsinline
            preload="auto"
            :controls="status !== 'processing'"
            class="w-full max-h-96 rounded-lg bg-black transition-opacity"
            :class="status === 'processing' ? 'opacity-60 pointer-events-none' : ''"
            @loadedmetadata="onLoadedMetadata"
            @error="onVideoError"
            @timeupdate="onTimeUpdate"
            @ended="onVideoEnded"
          ></video>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">总时长</p>
              <p class="text-sm font-bold text-foreground font-mono">{{ formatTime(duration) }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">分辨率</p>
              <p class="text-sm font-bold text-foreground">{{ videoSize.w ? videoSize.w + '×' + videoSize.h : '—' }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">文件大小</p>
              <p class="text-sm font-bold text-foreground">{{ fileSize ? formatSize(fileSize) : '—' }}</p>
            </div>
          </div>
        </div>

        <!-- 处理结果 -->
        <div v-if="resultUrl && resultInfo" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle2 class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" /> 处理完成<span v-if="partial" class="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">（提前停止，输出为已录制部分）</span>
          </h2>
          <video :src="resultUrl" controls playsinline class="w-full max-h-96 rounded-lg bg-black"></video>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">处理模式</p>
              <p class="text-sm font-bold text-foreground">{{ mode === 'replace' ? '替换音轨' : '去除音轨' }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">输出规格</p>
              <p class="text-sm font-bold text-foreground">{{ outputExt.toUpperCase() }} · {{ mode === 'replace' ? '含替换音轨' : '不含音轨' }}</p>
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
          选择视频后，这里会显示原视频预览与处理结果
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于在线视频静音</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            发朋友圈不想暴露背景里的对话、素材配了新 BGM 要消掉原声、给视频重新配音前先「消音」……
            这些都可以用「视频静音」完成。工具提供两种模式：「去除音轨」输出完全无声的视频；
            「替换音轨」用你上传的音频（mp3 / wav / m4a 等）覆盖原声。全部处理在浏览器内完成，
            视频与音频都不会上传服务器，适合处理含隐私内容的素材。
          </p>

          <h3 class="text-lg font-semibold text-foreground">怎么去掉视频的声音？</h3>
          <ol class="list-decimal list-inside space-y-1.5">
            <li>选择本地视频（建议 ≤200MB），右侧可预览原视频（带原声，便于确认内容）；</li>
            <li>选择模式：去除音轨（输出无声视频）或替换音轨（上传新音频覆盖原声）；</li>
            <li>替换音轨模式下按需勾选「音频短于视频时循环铺满」，并可用播放器试听替换音频；</li>
            <li>点「开始处理」，视频会静音播放并实时重录制一遍，完成后下载即可。</li>
          </ol>

          <h3 class="text-lg font-semibold text-foreground">去音轨和静音有什么区别？</h3>
          <p>
            「去除音轨」后输出文件<b class="text-foreground">不包含音轨</b>：体积更小，播放器也不会再显示音量控制，
            后期剪辑软件里也看不到音频层；而把音量调到 0 只是播放时不响，声音数据仍在文件里。
            「替换音轨」则保留一条音轨，但内容换成了你上传的音频，适合换 BGM、加解说等场景。
          </p>

          <h3 class="text-lg font-semibold text-foreground">替换音频比视频短或长会怎样？</h3>
          <p>
            音频比视频<b class="text-foreground">长</b>：视频播完即停止录制，音频多余部分自动截断；
            音频比视频<b class="text-foreground">短</b>：默认只播一遍、之后保持静音，勾选「循环铺满」则会按
            「视频时长 ÷ 音频时长」向上取整循环播放，最后一遍在视频结尾处自然截断。选择音频后工具会明确提示将采用的策略。
          </p>

          <h3 class="text-lg font-semibold text-foreground">输出是 MP4 还是 WebM？</h3>
          <p>
            工具按浏览器能力自动选择：优先输出 MP4（H.264 + AAC，Chrome 126+ 与 Safari 支持），
            不支持时降级为 WebM（VP9/VP8 + Opus），面板中会显示实际格式。两种格式微信、抖音、B 站
            等主流平台都能直接使用；画面内容与原视频一致（不改变方向与尺寸），视频码率按原片平均码率推算并钳制在 1–8 Mbps。
          </p>

          <h3 class="text-lg font-semibold text-foreground">视频和音频会上传吗？</h3>
          <p>
            不会。视频与音频都通过对象 URL（Blob URL）在浏览器内存中解码与合成，全程本地完成，
            页面不会发出任何包含文件数据的网络请求，关闭或刷新页面后内存即释放。
          </p>

          <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
          <div class="space-y-4">
            <div>
              <h3 class="text-base font-semibold text-foreground">怎么去掉视频的声音？</h3>
              <p class="text-sm text-muted-foreground mt-1">选择视频后选「去除音轨」模式，点「开始处理」；视频会在本地静音播放并重录制一遍，输出的文件不含任何音轨。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">替换音轨支持哪些音频格式？</h3>
              <p class="text-sm text-muted-foreground mt-1">支持浏览器能解码的 mp3、wav、m4a、aac、ogg 等常见格式；选择后工具会自动解码并显示时长与播放策略。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">替换的音频比视频短或长怎么办？</h3>
              <p class="text-sm text-muted-foreground mt-1">音频比视频长时，视频结束即停止、多余部分截断；比视频短时可开启「循环铺满」（最后一遍在结尾截断），不开启则播完一遍后保持静音。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">去音轨和把音量调到 0 有什么区别？</h3>
              <p class="text-sm text-muted-foreground mt-1">去音轨后输出文件不含音轨，体积更小，播放器不再显示音量控制；两者播放时都听不到原声，但前者是真正移除了声音数据。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">视频和音频会上传吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">不会。视频与音频都在浏览器内存中解码与合成，全程本地完成，不发任何网络请求，关闭页面即释放。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'video-mute'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  VolumeX, Music, Upload, X, Download, TriangleAlert, CheckCircle2,
  ChevronUp, ChevronDown, Info, Loader2, Film, MonitorPlay, Settings2, ShieldCheck
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '视频静音 - 在线去除视频原声或替换音轨，本地处理不上传',
  description: '免费在线视频静音工具：一键去除视频音轨输出无声视频，或上传 mp3/wav 音频替换原声（音频短于视频可循环铺满），本地处理不上传服务器',
  keywords: '视频静音, 去掉视频声音, 视频消音, 视频去除原声, 替换音轨, 无声视频',
  author: '有条工具',
  ogTitle: '视频静音 - 在线去除视频原声或替换音轨 | 有条工具',
  ogDescription: '一键去除视频音轨或替换为新音频，循环铺满可选，文件不出浏览器。',
  ogUrl: 'https://www.util.cn/tools/video-mute',
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
          name: '视频静音',
          url: 'https://www.util.cn/tools/video-mute',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['去除音轨输出无声视频', '上传音频替换原声', '音频短于视频可循环铺满', '替换音频在线试听', '输出 MP4/WebM 自动适配', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '视频静音', item: 'https://www.util.cn/tools/video-mute/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '怎么去掉视频的声音？',
              acceptedAnswer: { '@type': 'Answer', text: '选择视频后选去除音轨模式，点开始处理；视频会在本地静音播放并重录制一遍，输出的文件不含任何音轨。' }
            },
            {
              '@type': 'Question',
              name: '替换音轨支持哪些音频格式？',
              acceptedAnswer: { '@type': 'Answer', text: '支持浏览器能解码的 mp3、wav、m4a、aac、ogg 等常见格式；选择后工具会自动解码并显示时长与播放策略。' }
            },
            {
              '@type': 'Question',
              name: '替换的音频比视频短或长怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '音频比视频长时，视频结束即停止、多余部分截断；比视频短时可开启循环铺满（最后一遍在结尾截断），不开启则播完一遍后保持静音。' }
            },
            {
              '@type': 'Question',
              name: '去音轨和把音量调到 0 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '去音轨后输出文件不含音轨，体积更小，播放器不再显示音量控制；两者播放时都听不到原声，但前者是真正移除了声音数据。' }
            },
            {
              '@type': 'Question',
              name: '视频和音频会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。视频与音频都在浏览器内存中解码与合成，全程本地完成，不发任何网络请求，关闭页面即释放。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'video-mute')

// ---------- 纯函数（node 自测覆盖） ----------
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

// 输出文件名：去音轨 → 原名-muted.扩展名；替换音轨 → 原名-replaced.扩展名
function buildOutputName(baseName, mode, ext) {
  const base = String(baseName || 'video').replace(/\.[^.]+$/, '') || 'video'
  const suffix = mode === 'replace' ? 'replaced' : 'muted'
  return `${base}-${suffix}.${ext || 'webm'}`
}

// 音频循环时长策略（纯函数）：
// - 音频比视频长（a >= v）：单次播放，视频结束时随录制一并停止（多余部分截断，覆盖 min(a, v) 秒）
// - 音频比视频短且允许循环：循环 ceil(v / a) 遍铺满全片，最后一遍在结尾截断
// - 音频比视频短且不允许循环：单次播放后静音（coveredSec = a，静音尾长 = v - a）
function audioLoopPlan(audioDur, videoDur, allowLoop) {
  const a = Math.max(0, Number(audioDur) || 0)
  const v = Math.max(0, Number(videoDur) || 0)
  if (a <= 0) {
    return { loop: false, plays: 0, coveredSec: 0, silentTailSec: v, note: '替换音频未就绪，将输出无声视频' }
  }
  if (v <= 0) {
    return { loop: false, plays: 1, coveredSec: 0, silentTailSec: 0, note: '视频时长未知，按单次播放处理' }
  }
  if (a >= v) {
    return { loop: false, plays: 1, coveredSec: Math.min(a, v), silentTailSec: 0, note: '音频不短于视频：单次播放，视频结束时随录制一并停止（多余部分截断）' }
  }
  if (allowLoop) {
    const plays = Math.max(1, Math.ceil(v / a))
    return { loop: true, plays, coveredSec: v, silentTailSec: 0, note: `音频较短：将循环播放 ${plays} 遍铺满全片，最后一遍在视频结尾处截断` }
  }
  return { loop: false, plays: 1, coveredSec: a, silentTailSec: Math.max(0, v - a), note: '音频较短且未开启循环：播完一遍后，剩余部分保持静音' }
}
// ---------- 纯函数结束 ----------

const MAX_FPS = 30                          // canvas.captureStream 采集帧率
const SOFT_LIMIT_BYTES = 200 * 1024 * 1024  // 大文件提醒阈值 200MB
const HARD_LIMIT_BYTES = 1024 * 1024 * 1024 // 视频硬上限 1GB（内存安全）
const AUDIO_LIMIT_BYTES = 200 * 1024 * 1024 // 替换音频上限 200MB

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
const audioInput = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const videoUrl = ref('')
const duration = ref(0)
const videoSize = ref({ w: 0, h: 0 })
const isDragging = ref(false)
const isAudioDragging = ref(false)
const error = ref('')
const warnText = ref('')
const partial = ref(false)

// 静音模式：remove = 去除音轨；replace = 替换音轨
const mode = ref('remove')
const audioName = ref('')
const audioSize = ref(0)
const audioUrl = ref('')
const audioDuration = ref(0)
const audioDecoding = ref(false)
const allowLoop = ref(true)

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
let recordCanvas = null
let recordStream = null // 本次录制自建的 canvas 采集流（结束时须 stop 释放）
let audioBuffer = null  // 解码后的替换音频（AudioBuffer，非响应式）
// 替换音轨的 Web Audio 节点（每次录制新建，结束后销毁）
let replaceCtx = null
let replaceSrc = null
let replaceDest = null

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const STATUS_LABELS = { idle: '待选择视频', ready: '已就绪', processing: '处理中', done: '已完成', error: '出错' }

// ---------- 计算属性 ----------
const hasVideo = computed(() => !!videoUrl.value && duration.value > 0)
const canRecord = computed(() => support.value.recorder && support.value.capture && !!pickedMime.value)
const canStart = computed(() => hasVideo.value && canRecord.value && status.value !== 'processing')
const outBitrate = computed(() => bitrateOfSource(fileSize.value, duration.value))
const estBytes = computed(() => {
  if (!duration.value) return 0
  const audioBps = mode.value === 'replace' ? 128000 : 0
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
const audioPlan = computed(() => audioLoopPlan(audioDuration.value, duration.value, allowLoop.value))
const outputAudioText = computed(() => {
  if (mode.value === 'remove') return '不含音轨（无声视频）'
  if (!audioName.value) return '替换音轨（未选择音频）'
  return `原声替换为 ${audioName.value}`
})
const replaceOutputHint = computed(() => {
  if (!audioName.value) return '输出将把视频原声替换为新选择音频的声音，画面内容不变。'
  return `输出将把视频原声替换为「${audioName.value}」的声音，画面内容不变。`
})
const bigFileHint = computed(() => {
  if (fileSize.value > SOFT_LIMIT_BYTES) {
    return `当前文件约 ${formatSize(fileSize.value)}：浏览器实时重编码大文件较慢且占用内存，建议先用视频压缩工具压到 200MB 以内。`
  }
  return ''
})

// ---------- 文件选择（SSR 安全：对象 URL 仅在用户回调内创建） ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }
const triggerAudioSelect = () => { audioInput.value && audioInput.value.click() }

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
    error.value = '视频超过 1GB：浏览器本地重编码容易内存不足，请先用视频压缩工具压小后再处理'
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

// ---------- 替换音频：选择 → 解码 → 试听 ----------
function clearAudio() {
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioUrl.value = ''
  audioName.value = ''
  audioSize.value = 0
  audioDuration.value = 0
  audioBuffer = null
}

async function acceptAudioFile(f) {
  if (!f) return
  if (status.value === 'processing') {
    error.value = '正在处理，请先停止后再更换音频'
    return
  }
  const typeOk = !f.type || f.type.startsWith('audio/')
  const name = (f.name || '').toLowerCase()
  const extOk = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.oga', '.flac', '.opus'].some((ext) => name.endsWith(ext))
  if (!typeOk && !extOk) {
    error.value = '请选择音频文件（mp3 / wav / m4a / ogg 等）'
    return
  }
  if (f.size > AUDIO_LIMIT_BYTES) {
    error.value = '音频超过 200MB：浏览器解码内存受限，请先裁剪音频后再替换'
    return
  }
  clearAudio()
  audioName.value = f.name
  audioSize.value = f.size
  audioUrl.value = URL.createObjectURL(f)
  audioDecoding.value = true
  error.value = ''
  try {
    // 解码在用户手势回调中进行（浏览器 API 不进 setup）
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (typeof Ctx !== 'function') throw new Error('浏览器不支持 Web Audio')
    const tmpCtx = new Ctx()
    const buf = await f.arrayBuffer()
    const decoded = await tmpCtx.decodeAudioData(buf)
    audioBuffer = decoded
    audioDuration.value = decoded.duration
    try { await tmpCtx.close() } catch (err) { /* 忽略 */ }
  } catch (err) {
    clearAudio()
    error.value = '音频无法在浏览器中解码（' + (err && err.message ? err.message : '格式不受支持') + '），请尝试 mp3 / wav / m4a'
  } finally {
    audioDecoding.value = false
  }
}

function handleAudioChange(e) {
  const files = e.target.files
  if (files && files.length > 0) acceptAudioFile(files[0])
  e.target.value = ''
}

function handleAudioDrop(e) {
  isAudioDragging.value = false
  const files = e.dataTransfer.files
  if (files && files.length > 0) acceptAudioFile(files[0])
}

// ---------- 视频元信息与播放同步 ----------
function onLoadedMetadata() {
  const v = videoEl.value
  if (!v) return
  duration.value = isFinite(v.duration) ? v.duration : 0
  videoSize.value = { w: v.videoWidth, h: v.videoHeight }
  if (!duration.value) {
    warnText.value = '未能读取视频时长（可能是流式封装或编码异常），请尝试 mp4（H.264）等格式。'
  }
}

function onVideoError() {
  if (!videoUrl.value) return
  status.value = 'error'
  error.value = '视频无法在浏览器中解码播放（编码不受支持），请尝试 mp4（H.264）或 webm 格式'
}

function onTimeUpdate() {
  const v = videoEl.value
  if (!v) return
  if (status.value === 'processing') {
    recordedSeconds.value = Math.min(v.currentTime, duration.value || v.currentTime)
  }
}

function onVideoEnded() {
  // 自然播完：收尾录制（非手动停止，不标记 partial）
  if (status.value === 'processing') {
    partial.value = false
    stopRecorderSafe()
  }
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

// ---------- 替换音轨：用解码好的 AudioBuffer 构建录制音源（循环策略见 audioLoopPlan） ----------
function setupReplaceAudio() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (typeof Ctx !== 'function' || !audioBuffer) return false
    teardownReplaceAudio()
    replaceCtx = new Ctx()
    replaceDest = replaceCtx.createMediaStreamDestination()
    replaceSrc = replaceCtx.createBufferSource()
    replaceSrc.buffer = audioBuffer
    replaceSrc.loop = audioPlan.value.loop
    replaceSrc.connect(replaceDest)           // 录制支路：供 MediaRecorder 采集
    replaceSrc.connect(replaceCtx.destination) // 监听支路：录制期间可听到替换后的声音
    if (replaceCtx.state === 'suspended') {
      try { replaceCtx.resume() } catch (err) { /* 忽略 */ }
    }
    return true
  } catch (err) {
    teardownReplaceAudio()
    return false
  }
}

function teardownReplaceAudio() {
  if (replaceSrc) {
    try { replaceSrc.stop() } catch (err) { /* 尚未 start 时会抛错，忽略 */ }
    try { replaceSrc.disconnect() } catch (err) { /* 忽略 */ }
  }
  replaceSrc = null
  replaceDest = null
  if (replaceCtx && replaceCtx.state !== 'closed') {
    try { replaceCtx.close() } catch (err) { /* 忽略 */ }
  }
  replaceCtx = null
}

// ---------- 逐帧绘制循环（离屏画布承接画面） ----------
function pumpFrame(ctx, video) {
  if (status.value !== 'processing') return
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
  recordCanvas = null
  teardownReplaceAudio()
  const v = videoEl.value
  if (v) {
    v.pause()
    v.muted = false // 恢复预览原声
  }
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
    name: buildOutputName(fileName.value, mode.value, outputExt.value),
    size: blob.size
  }
  status.value = 'done'
}

// ---------- 主流程：实时录制消音/替换（用户手势触发） ----------
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
  if (mode.value === 'replace' && !audioBuffer) {
    error.value = '替换音轨模式下请先选择音频，并等待解码完成'
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
    video.muted = true // 两种模式都不录制原声：去音轨输出无声，替换音轨录新音频
    await seekTo(video, 0)
    if (aborted) {
      finishProcessing()
      status.value = 'error'
      return
    }

    // 离屏 canvas：按原始分辨率逐帧承接画面（画面内容不变）
    const w = video.videoWidth > 0 ? video.videoWidth : 640
    const h = video.videoHeight > 0 ? video.videoHeight : 360
    recordCanvas = document.createElement('canvas')
    recordCanvas.width = w
    recordCanvas.height = h
    const ctx = recordCanvas.getContext('2d')
    try { ctx.drawImage(video, 0, 0, w, h) } catch (err) { /* 首帧可能尚未就绪 */ }

    recordStream = recordCanvas.captureStream(MAX_FPS)
    const tracks = recordStream.getVideoTracks().slice()
    if (mode.value === 'replace') {
      // 替换音轨：混入新音频（AudioBufferSourceNode → MediaStreamDestination）
      if (setupReplaceAudio()) {
        tracks.push(...replaceDest.stream.getAudioTracks())
      } else {
        warnText.value = '未能创建替换音轨（浏览器 Web Audio 受限），本次输出将为无声视频。'
      }
    }
    // 去除音轨模式：不接任何音轨，输出不含音轨

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
    pumpFrame(ctx, video)
    await video.play()
    // 视频开始播放后再起播替换音频，尽量对齐时间零点
    if (replaceSrc) {
      try { replaceSrc.start() } catch (err) { /* 忽略 */ }
    }
  } catch (err) {
    // 启动半途失败按中断收尾：置 aborted 使 onstop 丢弃已录分片，避免产出不完整结果
    aborted = true
    stopRecorderSafe()
    finishProcessing()
    status.value = 'error'
    error.value = '处理失败：' + (err && err.message ? err.message : '视频未能自动播放，请重试')
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
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  clearResult()
})
</script>
