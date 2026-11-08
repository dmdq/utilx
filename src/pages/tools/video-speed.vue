<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Gauge class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">视频变速</h1>
          <p class="text-sm text-muted-foreground mt-1">0.25~8 倍速快放慢放，可选保持音调，本地实时录制导出不上传</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线视频变速工具：选择本地视频，按 0.25 / 0.5 / 1 / 1.5 / 2 / 3 / 4 倍速一键调速，或在 0.1~8 之间输入任意倍率，
        预览即以该速度实时播放。可选「保持音调」（2 倍速也不变声）或「变速变调」（磁带快进效果）。
        导出采用 canvas 逐帧重绘 + MediaRecorder 实时重编码：视频按设定倍速播放一遍、同步录制成新视频，
        预计输出时长 = 原时长 ÷ 倍速。全程浏览器本地处理，视频不上传服务器。
      </p>
      <div class="flex flex-wrap gap-2 mt-3">
        <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">0.1~8 任意倍率</span>
        <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">保持音调可选</span>
        <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">预计时长实时显示</span>
        <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">纯本地不上传</span>
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左栏：文件与设置 -->
      <div class="space-y-6">
        <!-- 文件选择 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Film class="w-5 h-5 mr-2 text-primary" /> 选择视频文件
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
            <Upload class="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
            <p class="text-sm font-medium text-foreground">点击或拖入视频文件（上限 1GB）</p>
            <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <ShieldCheck class="w-3 h-3" /> 本地变速录制，视频不上传
            </p>
          </div>
          <div v-if="fileName" class="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <Film class="w-4 h-4 text-primary flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
              <p class="text-[10px] text-muted-foreground">
                {{ formatSize(fileSize) }}<span v-if="duration"> · 时长 {{ fmtTimeOf(duration) }}</span><span v-if="videoSize.w"> · {{ videoSize.w }}×{{ videoSize.h }}</span>
              </p>
            </div>
            <button
              @click="clearFile"
              :disabled="isBusy"
              class="p-1 text-muted-foreground hover:text-destructive disabled:opacity-40"
              aria-label="移除文件"
              title="移除"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <p v-if="fileSize > 300 * 1024 * 1024" class="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> 大文件提醒：超过 300MB 的视频在浏览器中解码回放会占用较多内存，请关闭多余标签页后再变速。
          </p>
        </div>

        <!-- 变速设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 变速设置
          </h2>

          <!-- 倍速预设 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">倍速预设</label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="p in speedPresets"
                :key="p.v"
                @click="speedInput = String(p.v)"
                :disabled="isBusy"
                :class="activeSpeed === p.v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              >{{ p.label }}×</button>
            </div>
          </div>

          <!-- 自定义倍速 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">自定义倍速</label>
            <div class="flex items-center gap-2">
              <input
                v-model="speedInput"
                type="number"
                min="0.1"
                max="8"
                step="0.05"
                :disabled="isBusy"
                @change="commitSpeed"
                class="w-28 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono disabled:opacity-50"
              />
              <span class="text-sm text-muted-foreground">倍（支持 0.1 ~ 8，如 1.25）</span>
            </div>
            <p v-if="speedInput !== '' && Number(speedInput) !== activeSpeed" class="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
              输入已按范围 0.1~8 钳制为 {{ activeSpeed }} 倍
            </p>
          </div>

          <!-- 音调选项 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">音调处理</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="keepPitch = true"
                :disabled="isBusy"
                :class="keepPitch ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              >保持音调（推荐）</button>
              <button
                @click="keepPitch = false"
                :disabled="isBusy"
                :class="!keepPitch ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              >变速变调（卡带效果）</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              {{ keepPitch ? '保持音调：变速后声音不变尖不变粗，适合网课倍速、慢动作讲解。' : '变速变调：音调随速度升高/降低，像老式磁带快放，适合搞笑与创意效果。' }}
            </p>
          </div>

          <!-- 输出预估 -->
          <div class="bg-muted/50 rounded-lg p-3 space-y-1.5 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">原片时长</span>
              <span class="text-foreground font-medium font-mono">{{ duration > 0 ? fmtTimeOf(duration) : '选择视频后显示' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">预计输出时长（原时长 ÷ 倍速）</span>
              <span class="text-foreground font-medium font-mono">{{ duration > 0 ? fmtTimeOf(estimatedOutput) : '—' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">输出格式</span>
              <span class="text-foreground font-medium">{{ mimeLabelText }}</span>
            </div>
            <p v-if="duration > 0 && estimatedOutput > 300" class="text-amber-600 dark:text-amber-400 flex items-start gap-1">
              <Info class="w-3 h-3 flex-shrink-0 mt-0.5" />
              慢速录制耗时较长（约 {{ Math.ceil(estimatedOutput / 60) }} 分钟），录制为实时进行，请保持页面在前台。
            </p>
          </div>

          <!-- 开始按钮 -->
          <button
            @click="startConvert"
            :disabled="!canStart"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Loader2 v-if="isBusy" class="w-4 h-4 animate-spin" />
            <Gauge v-else class="w-4 h-4" />
            {{ isBusy ? '实时变速录制中，请勿切换标签页' : '开始变速导出（耗时 ≈ 预计输出时长）' }}
          </button>

          <button
            v-if="isBusy"
            @click="stopEarly"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-all"
          >
            提前停止（保存已录制的部分）
          </button>

          <!-- 进度条：按已处理原片时长 / 预计输出总时长 -->
          <div v-if="isBusy || progress > 0">
            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full transition-all" :style="{ width: Math.min(100, Math.round(progress * 100)) + '%' }"></div>
            </div>
            <p class="text-[10px] text-muted-foreground mt-1.5">
              已处理原片 {{ fmtTimeOf(processedSeconds) }} / {{ fmtTimeOf(duration) }} · 已录制约 {{ fmtTimeOf(recordedSeconds) }} / {{ fmtTimeOf(estimatedOutput) }}
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
            方式说明：变速通过 video.playbackRate 实时生效，预览即所得；导出为「实时录制」重编码——视频按倍速播放一遍、
            canvas 逐帧重绘并同步录制，所需时间约等于输出时长。部分浏览器对 0.5~4 倍速区间之外的声音会静音（画面仍正常变速）。
            录制期间请保持页面在前台。
          </p>
        </div>

        <!-- 浏览器不支持提示 -->
        <div v-if="supportChecked && !canRecord" class="bg-card border border-amber-500/40 rounded-lg p-4 space-y-2">
          <p class="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <TriangleAlert class="w-4 h-4" /> 当前浏览器不支持本工具
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            导出依赖 canvas.captureStream 与 MediaRecorder 视频录制能力（新版 Chrome / Edge / Firefox 支持）。
            请更换浏览器后重试，或使用系统自带剪辑工具调整速度。
          </p>
        </div>
      </div>

      <!-- 右栏：预览与结果 -->
      <div class="space-y-6">
        <!-- 视频预览 -->
        <div v-if="videoUrl" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center justify-between flex-wrap gap-2">
            <span class="flex items-center"><Play class="w-5 h-5 mr-2 text-primary" /> 变速预览</span>
            <span v-if="isBusy" class="text-xs font-normal text-amber-600 dark:text-amber-400">（导出中：按 {{ activeSpeed }} 倍速实时播放并录制）</span>
          </h2>
          <video
            ref="videoEl"
            :src="videoUrl"
            playsinline
            preload="auto"
            :controls="!isBusy"
            class="w-full max-h-96 rounded-lg bg-black transition-opacity"
            :class="isBusy ? 'opacity-60 pointer-events-none' : ''"
            @loadedmetadata="onLoadedMetadata"
            @error="onVideoError"
            @timeupdate="onTimeUpdate"
            @ended="onVideoEnded"
          ></video>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">当前倍速</p>
              <p class="text-sm font-bold text-primary font-mono">{{ activeSpeed }}×</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">音调</p>
              <p class="text-sm font-bold text-foreground">{{ keepPitch ? '保持' : '变速变调' }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">预计输出</p>
              <p class="text-sm font-bold text-foreground font-mono">{{ duration > 0 ? fmtTimeOf(estimatedOutput) : '—' }}</p>
            </div>
          </div>
        </div>

        <!-- 变速结果 -->
        <div v-if="resultUrl && resultInfo" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CircleCheck class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" /> 变速完成{{ partial ? '（提前停止，输出为片段）' : '' }}
          </h2>
          <video :src="resultUrl" controls playsinline class="w-full max-h-96 rounded-lg bg-black"></video>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">倍速</p>
              <p class="text-sm font-bold text-primary font-mono">{{ resultInfo.speed }}×</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">输出时长</p>
              <p class="text-sm font-bold text-foreground font-mono">{{ fmtTimeOf(estimatedOutput) }}</p>
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
        <div v-if="!videoUrl && !resultUrl" class="bg-card border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
          选择视频后，这里会显示变速预览与导出结果
        </div>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12">
      <summary class="text-xl font-bold text-foreground cursor-pointer select-none flex items-center">
        <span class="text-primary mr-2">#</span> 视频变速是什么？倍速调整、音调处理与常见问题
      </summary>

      <div class="mt-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          视频变速把视频的播放速度调快或调慢：2 倍速看网课省一半时间，0.25 倍速看体育动作细节，
          3~4 倍速把长素材压成快进 timelapse。本工具在浏览器本地完成变速与导出：预览区以设定倍率实时播放（preservesPitch
          控制音调是否跟随变化），导出时 canvas 逐帧重绘画面、MediaRecorder 同步录制，得到一段真正「快进/慢放」的新视频文件，
          可直接发布到短视频平台或插入剪辑软件。
        </p>

        <h3 class="text-lg font-semibold text-foreground">功能介绍</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">任意倍率</span>：0.25 / 0.5 / 1 / 1.5 / 2 / 3 / 4 倍一键预设，0.1~8 之间任意自定义（超出范围自动钳制）。</li>
          <li><span class="text-foreground font-medium">实时预览</span>：调节倍率立即作用于预览播放，试听试看后再导出，所见即所得。</li>
          <li><span class="text-foreground font-medium">音调可选</span>：默认「保持音调」（变速不变声），也可选「变速变调」获得磁带快放的复古效果。</li>
          <li><span class="text-foreground font-medium">时长预估</span>：预计输出时长 = 原时长 ÷ 倍速，100 秒视频 2 倍速输出 50 秒、0.25 倍速输出 400 秒，导出前心中有数。</li>
          <li><span class="text-foreground font-medium">格式优先</span>：输出优先 MP4（新版 Chrome / Safari 支持），自动降级 WebM（VP9/VP8），录完即下。</li>
          <li><span class="text-foreground font-medium">纯本地处理</span>：解码、变速、录制全在本机，视频不上传任何服务器。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground">使用场景</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>网课与会议录像 1.5~2 倍速回看，节省时间；</li>
          <li>体育、舞蹈、教程动作 0.25~0.5 倍速慢放拆解；</li>
          <li>施工/种植/绘画等延时素材 3~8 倍速压缩成 timelapse；</li>
          <li>短视频二创：快放铺垫 + 正常速高潮的节奏剪辑素材；</li>
          <li>「变速变调」制作鬼畜、卡带风格的搞笑片段。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground pt-2">常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h4 class="text-base font-semibold text-foreground">变速后音调会变吗？</h4>
            <p class="mt-1">
              默认「保持音调」：通过 preservesPitch 让声音变速不变调，2 倍速也不会出现"花栗鼠声"。
              切换为「变速变调」则音调随速度升高或降低，适合刻意营造磁带快进、慢放的复古效果。
              该设置对浏览器实现有依赖，个别浏览器的极端倍率下（如 8 倍速）保持音调的效果会打折扣。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">导出要多久？为什么比剪辑软件慢？</h4>
            <p class="mt-1">
              本工具采用浏览器原生 MediaRecorder「实时录制」重编码：视频按设定倍速播放一遍、同步录制一遍，
              导出耗时 ≈ 预计输出时长（原时长 ÷ 倍速）。100 秒视频 2 倍速约 50 秒录完，0.25 倍速则需要约 6.7 分钟。
              好处是零依赖、纯本地、不上传；追求更快的非实时导出可使用桌面剪辑软件。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">为什么有些倍速下没有声音？</h4>
            <p class="mt-1">
              部分浏览器会对 0.5~4 倍速区间之外的音频做静音处理（画面仍正常变速），这是浏览器内核的限制。
              如需保留声音，建议使用 0.5~4 倍之间的倍率；无声视频（或倍率超出该区间）会正常导出画面。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">支持哪些输入与输出格式？</h4>
            <p class="mt-1">
              输入支持浏览器可播放的 mp4 / webm / mov 等格式；输出优先 MP4（Chrome 126+ 与 Safari 的 MediaRecorder 支持），
              不支持时自动降级为 WebM（VP9/VP8 + Opus）。WebM 在微信、抖音、B 站等平台均可直接上传或被自动转码。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">视频数据会上传吗？</h4>
            <p class="mt-1">
              不会。视频通过对象 URL 在浏览器内存中解码，变速、重绘与录制全部在本机完成，
              页面不会发出任何包含视频数据的网络请求，关闭或刷新页面后内存即释放。
            </p>
          </div>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'video-speed'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Gauge, Film, Upload, Download, X, Loader2, CircleCheck,
  Settings2, Play, ShieldCheck, Info, TriangleAlert
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const tool = tools.find((t) => t.id === 'video-speed')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- SEO ----------
useSeoMeta({
  title: '视频变速 - 在线视频倍速快放慢放工具，0.25~8倍速调整',
  description: '免费在线视频变速工具：0.25~8 倍速任意调整，实时预览，可选保持音调或变速变调，预计输出时长一目了然，本地实时录制导出 MP4/WebM，视频不上传服务器',
  keywords: '视频变速, 视频倍速, 视频快放, 视频慢放, 视频加速, 慢动作视频, 网课倍速',
  author: '有条工具',
  ogTitle: '视频变速 - 在线视频倍速快放慢放工具 | 有条工具',
  ogDescription: '0.25~8 倍速任意调整，保持音调可选，本地实时录制导出，不上传服务器。',
  ogUrl: 'https://www.util.cn/tools/video-speed',
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
          name: '视频变速',
          url: 'https://www.util.cn/tools/video-speed',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['0.25~8 倍速任意调整', '实时变速预览', '保持音调/变速变调可选', '预计输出时长实时估算', 'MP4 优先自动降级 WebM', '本地实时录制不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '视频变速', item: 'https://www.util.cn/tools/video-speed/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '变速后音调会变吗？',
              acceptedAnswer: { '@type': 'Answer', text: '默认保持音调（preservesPitch），变速不变声；切换为变速变调则音调随速度升高或降低，适合磁带快进的复古效果。' }
            },
            {
              '@type': 'Question',
              name: '导出要多久？',
              acceptedAnswer: { '@type': 'Answer', text: '采用实时录制重编码，导出耗时约等于预计输出时长（原时长÷倍速）：100 秒视频 2 倍速约 50 秒录完，0.25 倍速约 6.7 分钟。' }
            },
            {
              '@type': 'Question',
              name: '为什么有些倍速下没有声音？',
              acceptedAnswer: { '@type': 'Answer', text: '部分浏览器会对 0.5~4 倍速区间之外的音频静音（画面仍正常变速），需要声音时建议使用 0.5~4 倍之间的倍率。' }
            },
            {
              '@type': 'Question',
              name: '支持哪些输入与输出格式？',
              acceptedAnswer: { '@type': 'Answer', text: '输入支持浏览器可播放的 mp4/webm/mov 等格式；输出优先 MP4，自动降级 WebM（VP9/VP8+Opus），主流平台均可直接使用。' }
            },
            {
              '@type': 'Question',
              name: '视频数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。视频在浏览器内存中解码、变速与录制，全程本地完成，不发任何网络请求，关闭页面即释放。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯函数（node 自测覆盖） ----------
// 倍速钳制：合法数字钳制到 0.1~8；非法输入回退 1（不变速）
function clampSpeed(value) {
  const n = Number(value)
  if (!isFinite(n) || n <= 0) return 1
  return Math.min(8, Math.max(0.1, n))
}

// 预计输出时长（秒）= 原时长 ÷ 倍速；入参非法返回 0（100s@2x=50s，100s@0.25=400s）
function estOutputDuration(durationSec, speed) {
  const d = Number(durationSec)
  const r = Number(speed)
  if (!isFinite(d) || d <= 0 || !isFinite(r) || r <= 0) return 0
  return d / r
}

// 输出码率（bps）：按原片平均码率（字节×8÷秒）推算，钳制 1~8 Mbps，异常时回退 2.5 Mbps
function bitrateOfSource(fileSizeBytes, durationSec) {
  const b = Number(fileSizeBytes)
  const d = Number(durationSec)
  if (!isFinite(b) || !isFinite(d) || b <= 0 || d <= 0) return 2500000
  return Math.min(8000000, Math.max(1000000, Math.round((b * 8) / d)))
}

// MediaRecorder mimeType 候选表：MP4 优先（Chrome 126+ / Safari 支持），降级 WebM VP9 → VP8 → 默认
const MIME_CANDIDATES = [
  { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', label: 'MP4（H.264+AAC）' },
  { mime: 'video/mp4', label: 'MP4' },
  { mime: 'video/webm;codecs=vp9,opus', label: 'WebM（VP9+Opus）' },
  { mime: 'video/webm;codecs=vp8,opus', label: 'WebM（VP8+Opus）' },
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
// ---------- 纯函数结束 ----------

// 跨浏览器设置「保持音调」：Chrome 86+ / Firefox 101+ 为标准属性 preservesPitch（无前缀）；
// 旧版 Firefox 用 mozPreservesPitch，Safari（16.4 之前）用 webkitPreservesPitch，逐一兜底
function setPreservesPitch(el, val) {
  if (!el) return
  if ('preservesPitch' in el) {
    el.preservesPitch = val
  } else if ('mozPreservesPitch' in el) {
    el.mozPreservesPitch = val
  } else if ('webkitPreservesPitch' in el) {
    el.webkitPreservesPitch = val
  }
}

// 秒 → "mm:ss.d"（0.1 秒精度显示）
function fmtTimeOf(sec) {
  const totalTenths = Math.round(Math.max(0, Number(sec) || 0) * 10)
  const tenth = totalTenths % 10
  const totalSec = Math.floor(totalTenths / 10)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${tenth}`
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 状态（状态机 idle/ready/processing/done/error） ----------
const fileInput = ref(null)
const videoEl = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const videoUrl = ref('')
const duration = ref(0)
const videoSize = ref({ w: 0, h: 0 })
const isDragging = ref(false)

const status = ref('idle') // idle 无文件 / ready 已就绪 / processing 录制中 / done 完成 / error 出错
const error = ref('')
const warnText = ref('')
const partial = ref(false)

const speedInput = ref('2')
const keepPitch = ref(true)
const progress = ref(0)
const processedSeconds = ref(0) // 已播放的原片秒数
const recordedSeconds = ref(0)  // 已录制的输出秒数（原片秒数 ÷ 倍速）

const resultUrl = ref('')
const resultInfo = ref(null) // { name, size, speed, format }

const supportChecked = ref(false)
const support = ref({ recorder: false, capture: false })
const pickedMime = ref(null) // { mime, label }

const isBusy = computed(() => status.value === 'processing')

const speedPresets = [
  { v: 0.25, label: '0.25' },
  { v: 0.5, label: '0.5' },
  { v: 1, label: '1' },
  { v: 1.5, label: '1.5' },
  { v: 2, label: '2' },
  { v: 3, label: '3' },
  { v: 4, label: '4' }
]

// ---------- 计算属性 ----------
const activeSpeed = computed(() => clampSpeed(Number(speedInput.value)))
const estimatedOutput = computed(() => estOutputDuration(duration.value, activeSpeed.value))
const canRecord = computed(() => support.value.recorder && support.value.capture && !!pickedMime.value)
const hasVideo = computed(() => !!videoUrl.value && duration.value > 0)
const canStart = computed(() => !isBusy.value && hasVideo.value && canRecord.value)
const mimeLabelText = computed(() => {
  if (pickedMime.value) return pickedMime.value.label
  return supportChecked.value ? '当前浏览器不支持' : '检测中…'
})

// ---------- 倍速应用（预览实时生效） ----------
function applyRate(el) {
  if (!el) return
  try {
    el.playbackRate = activeSpeed.value
  } catch (err) { /* 个别浏览器支持的速率范围更小，忽略 */ }
  setPreservesPitch(el, keepPitch.value)
}

watch([activeSpeed, keepPitch], () => {
  if (isBusy.value) return
  applyRate(videoEl.value)
})

function commitSpeed() {
  const clamped = clampSpeed(Number(speedInput.value))
  speedInput.value = String(clamped)
}

// ---------- 文件选择（SSR 安全：对象 URL 仅在用户回调内创建） ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

function clearResult() {
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = ''
  resultInfo.value = null
  partial.value = false
}

function resetAll() {
  abortRecordingSilently()
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  videoUrl.value = ''
  fileName.value = ''
  fileSize.value = 0
  duration.value = 0
  videoSize.value = { w: 0, h: 0 }
  progress.value = 0
  processedSeconds.value = 0
  recordedSeconds.value = 0
  clearResult()
}

function acceptFile(f) {
  if (!f) return
  if (isBusy.value) {
    error.value = '正在录制导出，请先停止或等待完成后再更换视频'
    return
  }
  error.value = ''
  warnText.value = ''
  const typeOk = !f.type || f.type.startsWith('video/')
  const name = (f.name || '').toLowerCase()
  const extOk = ['.mp4', '.webm', '.mov', '.m4v'].some((ext) => name.endsWith(ext))
  if (!typeOk && !extOk) {
    status.value = 'error'
    error.value = '请选择视频文件（mp4 / webm / mov 等）'
    return
  }
  if (f.size > 1024 * 1024 * 1024) {
    status.value = 'error'
    error.value = '视频超过 1GB，浏览器本地重编码容易内存不足，建议先用剪辑工具分段处理'
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

// ---------- 元信息与播放同步 ----------
function onLoadedMetadata() {
  const v = videoEl.value
  if (!v) return
  duration.value = isFinite(v.duration) ? v.duration : 0
  videoSize.value = { w: v.videoWidth, h: v.videoHeight }
  applyRate(v)
  if (!duration.value) {
    status.value = 'error'
    error.value = '未能读取视频时长（可能是流式封装或编码异常），无法变速导出，请尝试 mp4（H.264）等格式。'
  }
}

function onVideoError() {
  if (!videoUrl.value) return
  status.value = 'error'
  error.value = '视频无法在浏览器中播放（编码不受支持），请尝试 mp4（H.264）或 webm 格式'
}

function onTimeUpdate() {
  const v = videoEl.value
  if (!v) return
  if (!isBusy.value) return
  processedSeconds.value = v.currentTime
  recordedSeconds.value = activeSpeed.value > 0 ? v.currentTime / activeSpeed.value : 0
  progress.value = duration.value > 0 ? Math.min(1, v.currentTime / duration.value) : 0
}

// 自然播完（或倍速快进到片尾）：收尾录制
function onVideoEnded() {
  if (isBusy.value) {
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

// ---------- 音轨接线：AudioContext.createMediaElementSource → MediaStreamAudioDestinationNode ----------
// 元素音频被接管后经 Graph 双路输出：一路进录制支路，一路回扬声器保持监听。
// playbackRate / preservesPitch 的处理发生在元素→Graph 之前，因此录到的就是变速后的声音。
let audioCtx = null
let audioSourceNode = null
let audioDestNode = null
let graphForEl = null

function ensureAudioGraph(video) {
  if (graphForEl === video && audioCtx && audioCtx.state !== 'closed' && audioDestNode) {
    if (audioCtx.state === 'suspended') {
      try { audioCtx.resume() } catch (err) { /* 忽略 */ }
    }
    return true
  }
  try {
    teardownAudioGraph()
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (typeof Ctx !== 'function') return false
    audioCtx = new Ctx()
    audioSourceNode = audioCtx.createMediaElementSource(video)
    audioDestNode = audioCtx.createMediaStreamDestination()
    audioSourceNode.connect(audioDestNode)      // 录制支路
    audioSourceNode.connect(audioCtx.destination) // 监听支路：录制期间仍可听到变速后的声音
    graphForEl = video
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
  audioSourceNode = null
  audioDestNode = null
  graphForEl = null
}

// ---------- 逐帧绘制循环 ----------
let recorder = null
let chunks = []
let rafId = 0
let rvfcId = 0
let aborted = false
let recordStream = null

function pumpFrame(ctx, video) {
  if (!isBusy.value) return
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

function finishRecording() {
  stopPump()
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
  const v = videoEl.value
  if (v) v.pause()
  stopRecorderSafe()
}

// 用户提前停止：保存已录制的部分
function stopEarly() {
  if (!isBusy.value) return
  partial.value = true
  const v = videoEl.value
  if (v) v.pause()
  stopRecorderSafe()
}

// ---------- 主流程：playbackRate 实时变速 + MediaRecorder 实时录制（用户手势触发） ----------
async function startConvert() {
  const video = videoEl.value
  if (!video || !hasVideo.value) {
    status.value = 'error'
    error.value = '请先选择可在浏览器中播放的视频文件'
    return
  }
  if (isBusy.value) return
  if (!canRecord.value) {
    status.value = 'error'
    error.value = '当前浏览器缺少 canvas.captureStream 或 MediaRecorder 视频录制能力，请更换新版 Chrome / Edge / Firefox'
    return
  }
  error.value = ''
  warnText.value = ''
  clearResult()
  partial.value = false
  aborted = false
  status.value = 'processing'
  progress.value = 0
  processedSeconds.value = 0
  recordedSeconds.value = 0

  try {
    video.pause()
    await seekTo(video, 0)
    if (aborted) {
      finishRecording()
      status.value = 'ready'
      return
    }
    // 变速与音调设置在播放/录制前生效
    applyRate(video)
    video.muted = false // 音轨经 AudioContext 接管，元素需保持非静音

    const w = video.videoWidth > 0 ? video.videoWidth : 640
    const h = video.videoHeight > 0 ? video.videoHeight : 360
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    try { ctx.drawImage(video, 0, 0, w, h) } catch (err) { /* 首帧可能尚未就绪 */ }

    const stream = canvas.captureStream(30)
    recordStream = stream
    const tracks = stream.getVideoTracks().slice()

    // 音轨：MediaElementSource → MediaStreamDestination（变速/变调处理已在元素侧完成）
    let audioOk = false
    if (ensureAudioGraph(video)) {
      const at = audioDestNode.stream.getAudioTracks()
      if (at && at.length) {
        tracks.push(...at)
        audioOk = true
      }
    }
    if (!audioOk) {
      // 回退：元素自带 captureStream 的音轨
      const cs = typeof video.captureStream === 'function'
        ? video.captureStream
        : (typeof video.mozCaptureStream === 'function' ? video.mozCaptureStream : null)
      if (cs) {
        try {
          const at2 = cs.call(video).getAudioTracks()
          if (at2 && at2.length) {
            tracks.push(...at2)
            audioOk = true
          }
        } catch (err) { /* 落到无声导出 */ }
      }
    }
    if (!audioOk) {
      warnText.value = '未能获取音轨，本次输出为无声变速视频。'
    }

    try {
      recorder = new MediaRecorder(new MediaStream(tracks), {
        mimeType: pickedMime.value.mime,
        videoBitsPerSecond: bitrateOfSource(fileSize.value, duration.value),
        audioBitsPerSecond: 128000
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
      error.value = '录制出错：请确认视频可正常播放，并保持页面在前台后重试'
      aborted = true
      const v = videoEl.value
      if (v) v.pause()
      stopRecorderSafe()
    }
    recorder.onstop = () => {
      finishRecording()
      if (aborted) {
        chunks = []
        status.value = error.value ? 'error' : 'ready'
        if (!error.value) warnText.value = ''
        return
      }
      if (!chunks.length) {
        status.value = 'error'
        error.value = '未录制到任何数据：视频可能未能播放，请重试或更换浏览器'
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
      const base = (fileName.value || 'video').replace(/\.[^.]+$/, '')
      resultUrl.value = URL.createObjectURL(blob)
      resultInfo.value = {
        name: `${base}-speed-${activeSpeed.value}x.${ext}`,
        size: blob.size,
        speed: activeSpeed.value,
        format: pickedMime.value.label
      }
      status.value = 'done'
    }

    recorder.start(1000)
    pumpFrame(ctx, video)
    await video.play()
  } catch (err) {
    // 启动半途失败：置 aborted 使 onstop 丢弃已录分片，避免产出不完整的「完成」结果
    aborted = true
    finishRecording()
    status.value = 'error'
    error.value = '变速导出失败：' + (err && err.message ? err.message : '视频未能自动播放，请重试')
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
  supportChecked.value = true
  const isSupported = (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function')
    ? (mime) => MediaRecorder.isTypeSupported(mime)
    : null
  pickedMime.value = pickMimeOf(isSupported)
})

onBeforeUnmount(() => {
  aborted = true
  const v = videoEl.value
  if (v) v.pause()
  stopRecorderSafe()
  finishRecording()
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  clearResult()
  teardownAudioGraph()
})
</script>
