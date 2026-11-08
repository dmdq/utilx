<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <MonitorPlay class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">音频转视频</h1>
          <p class="text-sm text-muted-foreground mt-1">音频 + 封面图合成 MP4/WebM 视频，发视频号/朋友圈不再受限，分辨率可选、本地合成</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        许多平台只允许发视频不允许发音频——本工具把音频与一张封面图合成为视频：封面按 contain/cover 适配到
        1080×1080、1280×720、1920×1080 或 720×1280（竖版视频号）画布，可选黑/白/模糊原图三种背景，
        未传封面时用纯色背景加大字歌名。画面与音轨经 canvas.captureStream + MediaRecorder 实时合成，
        耗时约等于音频时长；优先输出 MP4（Chrome 126+ / Safari），不支持时自动降级 WebM。
        音频与图片全程在本地处理，不上传服务器。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：合成与编码全部在本机完成，不会上传到任何服务器。
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左列：文件与设置 -->
      <div class="space-y-6">
        <!-- 音频选择 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <AudioLines class="w-5 h-5 mr-2 text-primary" /> 选择音频
          </h2>
          <input ref="audioInput" type="file" accept="audio/*,.mp3,.m4a,.wav,.flac,.ogg,.aac" class="hidden" @change="onAudioChange" />
          <div
            class="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isAudioDragging }"
            @click="triggerAudioPick"
            @dragover.prevent="isAudioDragging = true"
            @dragleave.prevent="isAudioDragging = false"
            @drop.prevent="onAudioDrop"
          >
            <Upload v-if="!audioName" class="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
            <CheckCircle2 v-else class="w-7 h-7 mx-auto mb-2 text-green-500" />
            <p v-if="!audioName" class="text-sm text-muted-foreground">点击或拖入音频文件</p>
            <template v-else>
              <p class="text-sm font-medium text-foreground truncate" :title="audioName">{{ audioName }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ formatSize(audioSize) }}<span v-if="duration"> · 时长 {{ formatTime(duration) }}</span></p>
            </template>
          </div>
          <p v-if="audioError" class="text-sm text-red-500 mt-2">{{ audioError }}</p>
          <audio v-if="audioUrl" ref="audioEl" :src="audioUrl" controls class="w-full h-9 mt-3" @loadedmetadata="onAudioMeta" @error="onAudioError" @timeupdate="onTimeUpdate" @ended="onAudioEnded"></audio>
        </div>

        <!-- 封面选择 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <ImagePlus class="w-5 h-5 mr-2 text-primary" /> 封面图（可选）
          </h2>
          <input ref="coverInput" type="file" accept="image/*,.jpg,.jpeg,.png,.webp" class="hidden" @change="onCoverChange" />
          <div v-if="!coverUrl" class="space-y-3">
            <button
              @click="triggerCoverPick"
              class="w-full py-4 border-2 border-dashed border-border rounded-lg hover:bg-muted/60 transition-colors flex flex-col items-center gap-1.5 text-muted-foreground"
            >
              <ImagePlus class="w-5 h-5 text-primary" />
              <span class="text-xs">上传封面图，未上传时显示纯色背景 + 歌名大字</span>
            </button>
          </div>
          <div v-else class="flex items-center gap-3">
            <img :src="coverUrl" alt="封面预览" class="w-20 h-20 object-cover rounded border border-border" />
            <div class="flex-1 min-w-0 text-xs text-muted-foreground">
              <p class="text-foreground font-medium truncate">{{ coverName }}</p>
              <p class="mt-0.5">{{ coverDims.w ? coverDims.w + '×' + coverDims.h + ' 像素' : '' }}</p>
              <button @click="removeCover" class="mt-1.5 px-2 py-1 rounded border border-border bg-background text-muted-foreground hover:text-red-500 transition-colors">移除封面</button>
            </div>
          </div>
        </div>

        <!-- 视频设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 视频设置
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">分辨率</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="p in resPresets"
                :key="p.id"
                @click="resPreset = p.id"
                :disabled="state === 'recording'"
                :class="resPreset === p.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              >
                {{ p.label }}<span class="block text-[10px] opacity-75">{{ p.hint }}</span>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">背景</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="b in bgOptions"
                :key="b.id"
                @click="bgMode = b.id"
                :disabled="state === 'recording'"
                :class="bgMode === b.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              >{{ b.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">模糊背景：用封面图放大 40px 高斯模糊铺满做底（无封面时按纯色处理）</p>
          </div>

          <div v-if="coverUrl">
            <label class="block text-sm font-medium text-foreground mb-2">封面适配</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="f in fitOptions"
                :key="f.id"
                @click="fitMode = f.id"
                :disabled="state === 'recording'"
                :class="fitMode === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              >{{ f.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">contain 完整显示留边；cover 填满裁切</p>
          </div>

          <div class="flex items-center gap-2">
            <input v-model="motionBar" id="motion-bar" type="checkbox" :disabled="state === 'recording'" class="w-4 h-4 rounded border border-border" />
            <label for="motion-bar" class="text-sm text-foreground">轻动效：底部进度条随播放推进</label>
          </div>

          <div class="bg-muted/50 rounded-lg p-3 space-y-1.5 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">输出格式</span>
              <span class="text-foreground font-medium">{{ supportChecked && outputExt ? outputExt.toUpperCase() + '（自动检测）' : '检测中...' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">输出画面</span>
              <span class="text-foreground font-medium">{{ currentPreset.w }} × {{ currentPreset.h }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">预计耗时</span>
              <span class="text-foreground font-medium">{{ duration ? '≈ ' + formatTime(duration) + '（实时录制）' : '选择音频后显示' }}</span>
            </div>
          </div>

          <button
            @click="startRecord"
            :disabled="state === 'recording' || !audioReady || !canRecord"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Loader2 v-if="state === 'recording'" class="w-4 h-4 animate-spin" />
            <Film v-else class="w-4 h-4" />
            {{ state === 'recording' ? '录制中，请勿切换标签页' : '开始合成视频（耗时≈音频时长）' }}
          </button>

          <button
            v-if="state === 'recording'"
            @click="stopRecord"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-all"
          >
            <Square class="w-3.5 h-3.5" /> 停止并保存已录制部分
          </button>

          <div v-if="state === 'recording' || (state === 'done' && progress > 0)">
            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full transition-all" :style="{ width: Math.min(100, Math.round(progress * 100)) + '%' }"></div>
            </div>
            <p class="text-[10px] text-muted-foreground mt-1.5">已录制 {{ formatTime(elapsed) }} / {{ formatTime(duration) }}（按播放进度实时计算）</p>
          </div>

          <p v-if="state === 'error' && errorMsg" class="flex items-start gap-2 text-sm text-red-500 bg-red-500/10 rounded-lg p-3">
            <FileWarning class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ errorMsg }}
          </p>

          <div v-if="supportChecked && !canRecord" class="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg p-3">
            <FileWarning class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            当前浏览器缺少 canvas.captureStream 或 MediaRecorder 能力，请更换新版 Chrome / Edge / Safari / Firefox。
          </div>

          <p class="text-[10px] text-muted-foreground leading-relaxed">
            方式说明：浏览器没有「一键把音频封成视频」的 API，本工具按实时录制合成——静态画面绘制一帧后交给
            canvas.captureStream 持续捕捉，音轨经 WebAudio 分路接入录制器，播放完即合成完。录制期间会同步播放声音，
            请保持页面在前台。
          </p>
        </div>
      </div>

      <!-- 右列（span-2）：画面预览与结果 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <MonitorPlay class="w-5 h-5 mr-2 text-primary" /> 画面预览
            <span class="ml-2 text-xs font-normal text-muted-foreground">{{ currentPreset.w }} × {{ currentPreset.h }} · {{ outputExt ? outputExt.toUpperCase() : '' }}</span>
          </h2>
          <div class="flex justify-center bg-muted/30 rounded-lg border border-border p-3">
            <canvas ref="previewCanvas" class="max-w-full max-h-[420px] w-auto h-auto rounded border border-border bg-black object-contain"></canvas>
          </div>
          <p class="text-xs text-muted-foreground mt-3 text-center">
            预览即最终画面：设置变更实时重绘；开启轻动效后底部会出现随播放推进的进度条。
          </p>
        </div>

        <div v-if="state === 'done' && resultUrl" class="bg-card border border-green-500/40 rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CheckCircle2 class="w-5 h-5 mr-2 text-green-500" /> 合成完成
          </h2>
          <video :src="resultUrl" playsinline controls class="w-full max-h-[420px] rounded-lg bg-black mb-4"></video>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">输出格式</p>
              <p class="font-bold text-foreground">{{ resultInfo ? resultInfo.ext.toUpperCase() : '' }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">文件大小</p>
              <p class="font-bold text-foreground">{{ resultInfo ? formatSize(resultInfo.size) : '' }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">分辨率</p>
              <p class="font-bold text-foreground">{{ currentPreset.w }}×{{ currentPreset.h }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">时长</p>
              <p class="font-bold text-foreground">{{ formatTime(recordedSeconds) }}</p>
            </div>
          </div>
          <button
            @click="downloadResult"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all"
          >
            <Download class="w-4 h-4" /> 保存 {{ resultInfo ? resultInfo.name : '' }}（{{ resultInfo ? formatSize(resultInfo.size) : '' }}）
          </button>
        </div>

        <div v-if="state !== 'done' || !resultUrl" class="bg-card border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
          选择音频与封面后，这里会显示合成结果视频与保存按钮。静态画面默认不逐帧重绘，性能开销极低；
          如需画面更「活」，可开启底部进度条轻动效。
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="seoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="seoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          在线音频转视频工具
        </h2>
        <p class="text-muted-foreground mb-6">
          微信朋友圈只能发视频号链接、公众号后台不收纯音频、部分社区仅接受视频投稿——把音频「封」成视频是绕开这些
          限制最直接的办法。本工具在浏览器本地完成合成：封面图（可选）按 contain/cover 适配到所选分辨率画布，
          黑/白/模糊原图三种背景可选；未传封面时以纯色背景加大字歌名成片。画面轨由 canvas.captureStream 产出，
          音轨经 WebAudio（MediaElementSource → MediaStreamDestination）分路，交给 MediaRecorder 实时录制，
          优先输出 MP4（H.264/AAC，Chrome 126+ 与 Safari 支持），不支持时自动降级 WebM（VP8/Opus）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">典型使用场景</h3>
        <ul class="list-disc pl-5 space-y-1.5 text-muted-foreground mb-6">
          <li>播客/单曲分发：把 MP3 变成带封面的视频，直接发视频号、朋友圈、小红书与 B 站动态</li>
          <li>有声内容投稿：广播剧、有声书片段配一张章节封面即可投稿视频社区</li>
          <li>尺寸适配：竖版 720×1280 对应视频号/抖音竖屏，方形 1080×1080 对应朋友圈与Instagram 风格</li>
          <li>极简成片：不想做动画时，静态封面 + 底部进度条轻动效就是最低成本的「能看」版本</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么合成耗时约等于音频时长？</h3>
            <p class="text-muted-foreground mt-1">
              浏览器没有直接「音频文件 + 封面 → 视频文件」的转码 API。本工具采用实时录制方案：音频播放一遍，
              画面与声音同步录制成视频，因此总耗时≈音频时长。画面是静态的，只有首帧绘制与可选的进度条绘制，
              对机器性能要求很低；录制期间请保持页面在前台，切走标签页可能导致录制中断。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">输出 MP4 还是 WebM？</h3>
            <p class="text-muted-foreground mt-1">
              工具自动检测浏览器能力：Chrome 126+、Edge 与 Safari 优先输出 MP4（H.264 + AAC，兼容性最好），
              不支持 MP4 录制时降级为 WebM（VP8/Opus）。主流平台均接受 WebM 或会自动转码；若目标平台严格只收 MP4，
              请用新版 Chrome 打开本工具。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">封面怎么显示？没有封面行不行？</h3>
            <p class="text-muted-foreground mt-1">
              封面可选 contain（完整显示、按背景留边）或 cover（填满裁切）；背景可选黑、白或「模糊原图」——
              模糊背景是把封面放大并做 40px 高斯模糊铺满画布，contain 留边时观感最自然。不传封面也能合成：
              纯色背景居中显示音频文件名大字。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">音质有损失吗？</h3>
            <p class="text-muted-foreground mt-1">
              音轨经 WebAudio 转发后按 192kbps 编码（AAC 或 Opus，随容器而定），对分享场景基本无损听感；
              画面为静态帧，视频码率按分辨率自动设置。追求母带级音质请保留原始音频文件。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持多长的音频？会上传吗？</h3>
            <p class="text-muted-foreground mt-1">
              输出体积 ≈ 码率 × 时长 ÷ 8，录制在浏览器内存中攒片，建议单次 30 分钟以内；更长的音频建议分段合成。
              音频与封面全程在本地处理，不上传任何数据，完成后请记得点保存，关闭页面即释放。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :current-tool-id="'audio-to-video'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  MonitorPlay, ShieldCheck, Upload, Download, Loader2, AudioLines, ImagePlus,
  Settings2, Film, Square, CheckCircle2, FileWarning, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '音频转视频 - MP3加封面合成MP4/WebM，发视频号本地合成',
  description: '免费在线音频转视频工具：音频+封面图本地合成 MP4（自动降级 WebM），1080×1080/1280×720/1920×1080/720×1280 分辨率可选，黑/白/模糊背景与 contain/cover 适配，未传封面自动生成歌名画面，不上传服务器',
  keywords: '音频转视频,mp3转mp4,音乐配图视频,音频生成视频,歌曲转视频,视频号发音频,封面视频',
  author: '有条工具',
  ogTitle: '音频转视频 - 有条工具',
  ogDescription: '音频 + 封面图本地合成 MP4/WebM 视频，分辨率与背景可选，发视频号/朋友圈不再受限。',
  ogUrl: 'https://www.util.cn/tools/audio-to-video',
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
          name: '音频转视频',
          url: 'https://www.util.cn/tools/audio-to-video',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['音频+封面图实时合成视频', 'MP4优先自动降级WebM', '1080×1080/1280×720/1920×1080/720×1280分辨率', '黑/白/模糊原图背景', 'contain/cover封面适配', '无封面时歌名大字画面', '底部进度条轻动效可选', '本地合成不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: '音频转视频', item: 'https://www.util.cn/tools/audio-to-video/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么合成耗时约等于音频时长？',
              acceptedAnswer: { '@type': 'Answer', text: '浏览器没有直接转码API，工具采用实时录制：音频播放一遍、画面与声音同步录制，总耗时约等于音频时长，画面为静态帧所以性能开销很低。' }
            },
            {
              '@type': 'Question',
              name: '输出MP4还是WebM？',
              acceptedAnswer: { '@type': 'Answer', text: '自动检测浏览器能力：Chrome 126+、Edge与Safari优先输出MP4（H.264+AAC），不支持时降级WebM（VP8/Opus）；严格只收MP4的平台请用新版Chrome。' }
            },
            {
              '@type': 'Question',
              name: '封面怎么显示？没有封面行不行？',
              acceptedAnswer: { '@type': 'Answer', text: '封面可选contain完整留边或cover填满裁切，背景可选黑、白或模糊原图；不传封面时用纯色背景居中显示音频文件名大字。' }
            },
            {
              '@type': 'Question',
              name: '音质有损失吗？',
              acceptedAnswer: { '@type': 'Answer', text: '音轨按192kbps编码（AAC或Opus随容器而定），对分享场景基本无损听感；追求母带级音质请保留原始音频文件。' }
            },
            {
              '@type': 'Question',
              name: '支持多长的音频？会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '录制在浏览器内存中攒片，建议单次30分钟以内，更长音频请分段合成；全程本地处理不上传，完成后记得点保存。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'audio-to-video')

/* ==== PURE:BEGIN ==== */
// ---------- 分辨率预设 ----------
const RES_PRESETS = [
  { id: 'square', label: '1080×1080', w: 1080, h: 1080, hint: '方图' },
  { id: 'hd', label: '1280×720', w: 1280, h: 720, hint: '横版' },
  { id: 'fhd', label: '1920×1080', w: 1920, h: 1080, hint: '横版高清' },
  { id: 'vertical', label: '720×1280', w: 720, h: 1280, hint: '竖版' }
]
// 预设合法性：宽高为正偶数（编码器要求偶数尺寸）、比例与标称值一致
function isValidPreset(p) {
  if (!p || typeof p !== 'object') return false
  const w = Number(p.w), h = Number(p.h)
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 2 || h < 2) return false
  if (w % 2 !== 0 || h % 2 !== 0) return false
  return typeof p.id === 'string' && p.id.length > 0 && typeof p.label === 'string'
}

// ---------- 封面适配 ----------
// mode: contain 完整显示（min 缩放）| cover 填满裁切（max 缩放）；返回绘制矩形 { x, y, w, h }
function computeFit(mode, iw, ih, cw, ch) {
  const w = Math.max(1, Math.round(Number(iw) || 1))
  const h = Math.max(1, Math.round(Number(ih) || 1))
  const W = Math.max(1, Math.round(Number(cw) || 1))
  const H = Math.max(1, Math.round(Number(ch) || 1))
  const scale = mode === 'cover' ? Math.max(W / w, H / h) : Math.min(W / w, H / h)
  const dw = w * scale
  const dh = h * scale
  return { x: (W - dw) / 2, y: (H - dh) / 2, w: dw, h: dh }
}

// ---------- 输出名与格式 ----------
function pickOutputExt(mime) {
  return String(mime || '').indexOf('mp4') >= 0 ? 'mp4' : 'webm'
}
function stripExt(name) {
  const s = String(name || '')
  const dot = s.lastIndexOf('.')
  return dot > 0 ? s.slice(0, dot) : s
}
// 输出名 = 原音频名（去扩展名）+ 新容器扩展名
function buildOutputName(audioName, ext) {
  return stripExt(audioName) + '.' + (ext === 'mp4' ? 'mp4' : 'webm')
}

// ---------- 码率 ----------
// 静态画面压缩率极高，码率按像素面积 2.5 bit/px·帧 下限 1Mbps 上限 8Mbps，音轨固定 192kbps
function bitrateFor(w, h) {
  const W = Math.max(2, Number(w) || 2)
  const H = Math.max(2, Number(h) || 2)
  return Math.min(8000000, Math.max(1000000, Math.round(W * H * 2.5)))
}
const AUDIO_BITRATE = 192000

// ---------- 轻动效进度条 ----------
// 底部通栏进度条：y 固定贴底，宽度按 progress（0~1）推进；progress 越界按 0~1 钳制
function progressBarRect(cw, ch, progress, barH) {
  const W = Math.max(1, Math.round(Number(cw) || 1))
  const H = Math.max(1, Math.round(Number(ch) || 1))
  const HBar = Math.max(1, Math.round(Number(barH) || Math.max(4, Math.round(H * 0.008))))
  const p = Math.min(1, Math.max(0, Number(progress) || 0))
  return { x: 0, y: H - HBar, w: W * p, h: HBar }
}
/* ==== PURE:END ==== */

// ---------- 状态（5 态状态机：idle → ready → recording → done / error） ----------
const state = ref('idle')
const errorMsg = ref('')
const seoContentVisible = ref(true)

const audioInput = ref(null)
const coverInput = ref(null)
const audioEl = ref(null)
const previewCanvas = ref(null)

const audioName = ref('')
const audioSize = ref(0)
const audioUrl = ref('')
const duration = ref(0)
const audioError = ref('')
const isAudioDragging = ref(false)

const coverName = ref('')
const coverUrl = ref('')
const coverDims = ref({ w: 0, h: 0 })

const resPreset = ref('square')
const bgMode = ref('blur')
const fitMode = ref('contain')
const motionBar = ref(false)

const progress = ref(0)
const elapsed = ref(0)
const recordedSeconds = ref(0)
const resultUrl = ref('')
const resultInfo = ref(null)

const supportChecked = ref(false)
const support = ref({ recorder: false, capture: false, mimeType: '' })

const currentPreset = computed(() => {
  const p = RES_PRESETS.find(x => x.id === resPreset.value)
  return p || RES_PRESETS[0]
})
const outputExt = computed(() => (support.value.mimeType ? pickOutputExt(support.value.mimeType) : ''))
const audioReady = computed(() => !!audioUrl.value && duration.value > 0)
const canRecord = computed(() => support.value.recorder && support.value.capture && !!support.value.mimeType)

const resPresets = RES_PRESETS
const bgOptions = [
  { id: 'black', label: '黑' },
  { id: 'white', label: '白' },
  { id: 'blur', label: '模糊原图' }
]
const fitOptions = [
  { id: 'contain', label: 'contain 留边' },
  { id: 'cover', label: 'cover 填满' }
]

// 非响应式录制内部件
let recorder = null
let chunks = []
let rafId = 0
let recCanvas = null
let recCtx = null
let coverImg = null
let audioCtx = null
let audioSourceNode = null
let audioDestNode = null

onMounted(() => {
  if (tool) addRecentTool(tool.id)
  // 能力检测仅在客户端 onMounted 执行：mp4 优先（Chrome 126+ / Safari），webm 降级
  const pickMime = () => {
    if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return ''
    const mp4 = ['video/mp4;codecs=avc1.64002A,mp4a.40.2', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4']
    const webm = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    for (let i = 0; i < mp4.length; i++) if (MediaRecorder.isTypeSupported(mp4[i])) return mp4[i]
    for (let i = 0; i < webm.length; i++) if (MediaRecorder.isTypeSupported(webm[i])) return webm[i]
    return ''
  }
  support.value = {
    recorder: typeof MediaRecorder !== 'undefined',
    capture: typeof HTMLCanvasElement !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function',
    mimeType: pickMime()
  }
  supportChecked.value = true
  drawPreview(-1)
})

onBeforeUnmount(() => {
  teardown()
  if (audioCtx && audioCtx.state !== 'closed') { try { audioCtx.close() } catch (err) { /* 忽略 */ } }
  audioCtx = null
  audioSourceNode = null
  audioDestNode = null
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  if (coverUrl.value) URL.revokeObjectURL(coverUrl.value)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
})

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
const triggerAudioPick = () => { if (audioInput.value) audioInput.value.click() }
const triggerCoverPick = () => { if (coverInput.value) coverInput.value.click() }

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

// ---------- 音频选择 ----------
const resetResult = () => {
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = ''
  resultInfo.value = null
  recordedSeconds.value = 0
}

const onAudioChange = (e) => {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  acceptAudio(file)
}

const onAudioDrop = (e) => {
  isAudioDragging.value = false
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
  if (file) acceptAudio(file)
}

const acceptAudio = (f) => {
  if (state.value === 'recording') return
  audioError.value = ''
  errorMsg.value = ''
  if (f.size > 500 * 1024 * 1024) {
    audioError.value = '音频超过 500MB，实时录制内存占用较高，建议先分段'
    return
  }
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioName.value = f.name
  audioSize.value = f.size
  duration.value = 0
  progress.value = 0
  elapsed.value = 0
  resetResult()
  audioUrl.value = URL.createObjectURL(f) // 用户手势回调内创建对象 URL
  state.value = 'idle' // 等元数据加载后进入 ready
}

const onAudioMeta = () => {
  const a = audioEl.value
  if (!a) return
  duration.value = isFinite(a.duration) ? a.duration : 0
  if (duration.value > 1800) {
    audioError.value = '音频超过 30 分钟，浏览器内存中攒片可能失败，建议分段合成'
  }
  state.value = 'ready'
}

const onAudioError = () => {
  audioError.value = '音频无法在浏览器中解码播放，请尝试 mp3 / m4a / wav 格式'
  state.value = 'error'
}

const onTimeUpdate = () => {
  const a = audioEl.value
  if (!a || !duration.value) return
  elapsed.value = a.currentTime
  progress.value = Math.min(1, a.currentTime / duration.value)
}

const onAudioEnded = () => {
  if (state.value === 'recording') {
    recordedSeconds.value = duration.value
    finishRecording()
  }
}

// ---------- 封面选择 ----------
const removeCover = () => {
  if (coverUrl.value) URL.revokeObjectURL(coverUrl.value)
  coverUrl.value = ''
  coverName.value = ''
  coverDims.value = { w: 0, h: 0 }
  coverImg = null
  drawPreview(-1)
}

const onCoverChange = (e) => {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  const url = URL.createObjectURL(file) // 只创建一次，加载/失败后分别接管或回收
  const img = new Image()
  img.onload = () => {
    if (coverUrl.value) URL.revokeObjectURL(coverUrl.value)
    coverImg = img
    coverDims.value = { w: img.naturalWidth, h: img.naturalHeight }
    coverUrl.value = url
    coverName.value = file.name
    drawPreview(-1)
  }
  img.onerror = () => {
    URL.revokeObjectURL(url)
    errorMsg.value = '封面图无法解码，请更换 jpg / png / webp 图片'
    state.value = 'error'
  }
  img.src = url
}

// ---------- 画面绘制 ----------
// 场景绘制（预览与录制画布共用）：背景 + 封面/歌名 + 可选进度条
// progress < 0 表示不绘制进度条（静态画面）
const drawScene = (ctx, W, H, progress01) => {
  const hasCover = !!coverImg
  // 背景（无封面时模糊背景按纯色处理）
  if (hasCover && bgMode.value === 'blur') {
    drawBlurredCoverBg(ctx, W, H)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)' // 轻压暗让主体突出
    ctx.fillRect(0, 0, W, H)
  } else if (bgMode.value === 'white') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)
  } else {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, W, H)
  }
  if (hasCover) {
    // contain 时四周留 3% 安全边距；cover 铺满
    const bx = fitMode.value === 'cover' ? W : Math.round(W * 0.94)
    const by = fitMode.value === 'cover' ? H : Math.round(H * 0.94)
    const r = computeFit(fitMode.value, coverImg.naturalWidth, coverImg.naturalHeight, bx, by)
    ctx.drawImage(coverImg, r.x + (W - bx) / 2, r.y + (H - by) / 2, r.w, r.h)
  } else {
    // 纯色背景 + 音频文件名大字居中
    const onWhite = bgMode.value === 'white'
    ctx.fillStyle = onWhite ? '#111111' : '#ffffff'
    const fs = Math.round(Math.min(W, H) * 0.075)
    ctx.font = 'bold ' + fs + 'px system-ui, -apple-system, "PingFang SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(stripExt(audioName.value) || 'Audio', W / 2, H / 2, W * 0.86)
  }
  // 轻动效进度条
  if (progress01 >= 0) {
    const onWhite = bgMode.value === 'white'
    const bar = progressBarRect(W, H, progress01)
    ctx.fillStyle = onWhite ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)'
    ctx.fillRect(0, bar.y, W, bar.h)
    ctx.fillStyle = onWhite ? '#111111' : '#ffffff'
    ctx.fillRect(0, bar.y, bar.w, bar.h)
  }
}

// 模糊背景：ctx.filter 模糊 40px 放大铺满；浏览器不支持 filter 时用「缩小再放大」退化模糊
const drawBlurredCoverBg = (ctx, W, H) => {
  const iw = coverImg.naturalWidth || coverImg.width
  const ih = coverImg.naturalHeight || coverImg.height
  ctx.save()
  ctx.filter = 'blur(40px)'
  const filterOk = typeof ctx.filter === 'string' && ctx.filter.indexOf('blur') >= 0
  ctx.filter = 'none'
  if (filterOk) {
    const s = Math.max(W / iw, H / ih) * 1.35 // 放大避免模糊后边缘露底
    const dw = iw * s
    const dh = ih * s
    ctx.filter = 'blur(40px)'
    ctx.drawImage(coverImg, (W - dw) / 2, (H - dh) / 2, dw, dh)
    ctx.filter = 'none'
  } else {
    // 退化方案：先画到 24px 宽的小画布，再拉伸铺满，双线性插值天然模糊
    const small = document.createElement('canvas')
    small.width = 24
    small.height = Math.max(2, Math.round(24 * ih / iw))
    const sctx = small.getContext('2d')
    sctx.drawImage(coverImg, 0, 0, small.width, small.height)
    const s = Math.max(W / small.width, H / small.height) * 1.2
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(small, (W - small.width * s) / 2, (H - small.height * s) / 2, small.width * s, small.height * s)
  }
  ctx.restore()
}

const drawPreview = (progress01) => {
  const canvas = previewCanvas.value
  if (!canvas) return
  const p = currentPreset.value
  if (canvas.width !== p.w || canvas.height !== p.h) {
    canvas.width = p.w
    canvas.height = p.h
  }
  const ctx = canvas.getContext('2d')
  drawScene(ctx, p.w, p.h, progress01)
}

watch([resPreset, bgMode, fitMode], () => {
  if (state.value === 'recording') return
  drawPreview(-1)
})

// ---------- 录制流程（用户手势触发） ----------
const teardown = () => {
  if (rafId) { cancelAnimationFrame(rafId); rafId = 0 }
  if (recorder && recorder.state !== 'inactive') {
    try { recorder.stop() } catch (err) { /* 忽略 */ }
  }
  recorder = null
  chunks = []
  const a = audioEl.value
  if (a) { try { a.pause() } catch (err) { /* 忽略 */ } }
}

const ensureAudioGraph = () => {
  const a = audioEl.value
  if (!a) throw new Error('音频元素未就绪')
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext()
    audioSourceNode = audioCtx.createMediaElementSource(a)
    audioDestNode = audioCtx.createMediaStreamDestination()
    audioSourceNode.connect(audioDestNode)
    audioSourceNode.connect(audioCtx.destination) // 录制期间同步可听
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioDestNode.stream.getAudioTracks()
}

const startRecord = async () => {
  if (state.value === 'recording') return
  if (!audioReady.value) { errorMsg.value = '请先选择可播放的音频文件'; state.value = 'error'; return }
  if (!canRecord.value) { errorMsg.value = '当前浏览器缺少 canvas.captureStream 或 MediaRecorder 能力'; state.value = 'error'; return }
  errorMsg.value = ''
  resetResult()
  try {
    const a = audioEl.value
    a.pause()
    a.currentTime = 0
    const p = currentPreset.value
    recCanvas = document.createElement('canvas')
    recCanvas.width = p.w
    recCanvas.height = p.h
    recCtx = recCanvas.getContext('2d')
    // 首帧静态画面：captureStream(30) 会持续捕捉画布内容，静态场景无需逐帧重绘
    drawScene(recCtx, p.w, p.h, -1)

    const tracks = recCanvas.captureStream(30).getVideoTracks().slice()
    let audioTracks = []
    try {
      audioTracks = ensureAudioGraph()
    } catch (err) {
      audioTracks = []
    }
    if (audioTracks && audioTracks.length) tracks.push(...audioTracks)

    const merged = new MediaStream(tracks)
    const baseMime = support.value.mimeType.split(';')[0]
    recorder = new MediaRecorder(merged, {
      mimeType: support.value.mimeType,
      videoBitsPerSecond: bitrateFor(p.w, p.h),
      audioBitsPerSecond: AUDIO_BITRATE
    })
    chunks = []
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data)
    }
    recorder.onerror = () => {
      errorMsg.value = '录制出错，请保持页面在前台后重试'
      state.value = 'error'
      teardown()
    }
    recorder.onstop = () => {
      state.value = state.value === 'error' ? 'error' : 'done'
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0 }
      if (!chunks.length) {
        errorMsg.value = '未录制到数据：音频可能未能播放，请重试'
        state.value = 'error'
        return
      }
      const blob = new Blob(chunks, { type: baseMime })
      chunks = []
      if (blob.size < 1024) {
        errorMsg.value = '录制结果异常（数据为空），请重试或更换浏览器'
        state.value = 'error'
        return
      }
      resultUrl.value = URL.createObjectURL(blob)
      resultInfo.value = {
        name: buildOutputName(audioName.value, outputExt.value),
        size: blob.size,
        ext: outputExt.value
      }
    }
    recorder.start(1000)
    state.value = 'recording'
    progress.value = 0
    elapsed.value = 0
    // 轻动效：每帧重绘（进度条推进）；关闭时画面保持静态，不再重绘
    if (motionBar.value) {
      const loop = () => {
        if (state.value !== 'recording' || !recCtx) return
        const pNow = duration.value ? Math.min(1, (audioEl.value ? audioEl.value.currentTime : 0) / duration.value) : 0
        drawScene(recCtx, p.w, p.h, pNow)
        drawPreview(pNow)
        rafId = requestAnimationFrame(loop)
      }
      rafId = requestAnimationFrame(loop)
    }
    await a.play()
  } catch (err) {
    state.value = 'error'
    errorMsg.value = '合成失败：' + (err && err.message ? err.message : '音频未能自动播放，请点击重试')
    teardown()
  }
}

const finishRecording = () => {
  if (state.value !== 'recording') return
  const a = audioEl.value
  if (a && !a.paused) a.pause()
  if (rafId) { cancelAnimationFrame(rafId); rafId = 0 }
  if (recorder && recorder.state !== 'inactive') {
    try { recorder.stop() } catch (err) { /* onstop 兜底 */ }
  }
}

const stopRecord = () => {
  if (state.value !== 'recording') return
  recordedSeconds.value = elapsed.value
  finishRecording()
}

const downloadResult = () => {
  if (!resultUrl.value || !resultInfo.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = resultInfo.value.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>
