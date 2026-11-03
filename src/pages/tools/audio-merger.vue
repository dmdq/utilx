<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <AudioLines class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">音频拼接器</h1>
          <p class="text-sm text-muted-foreground mt-1">多段录音按顺序合并成一个文件，本地解码拼接导出 WAV，支持段间静音与自动重采样</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线音频合并工具：把多段录音、语音备忘、课程片段、配乐小样按列表顺序首尾拼接为一个完整音频。每段文件先在浏览器本地解码为 PCM 采样，
        按你调整好的顺序写入同一缓冲后导出为无损 WAV；可设置段间静音（0–5 秒），采样率与声道自动跟随第一个文件，
        规格不一致的素材自动重采样，拼完还能先看总波形、试听再下载。全程本地处理，音频不上传任何服务器。
      </p>
      <div class="mt-3 inline-flex items-start gap-2 px-3 py-2 bg-muted/60 border border-border rounded-lg text-sm text-muted-foreground">
        <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <span>音频本地解码拼接后导出 WAV（无损 PCM）；MP3 等压缩格式作为输入不受影响。≤20 个文件、单文件 ≤100MB。</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左列：文件列表 + 拼接设置 -->
      <div class="space-y-6">
        <!-- 文件列表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-foreground">音频列表（自上而下拼接）</h2>
            <span class="text-xs text-muted-foreground font-mono">{{ items.length }} / {{ MAX_FILES }}</span>
          </div>

          <input ref="fileInputRef" type="file" accept="audio/*" multiple class="hidden" @change="onFileChange" />

          <button
            @click="triggerPick"
            :disabled="items.length >= MAX_FILES"
            class="w-full py-8 border-2 border-dashed rounded-lg transition-colors flex flex-col items-center gap-2"
            :class="items.length >= MAX_FILES ? 'border-border bg-muted/30 cursor-not-allowed opacity-60' : 'border-primary/40 hover:bg-muted/60'"
          >
            <AudioLines class="w-7 h-7 text-primary" />
            <span class="text-sm font-medium text-foreground">{{ items.length >= MAX_FILES ? '已达 20 个上限，请先删除部分文件' : '点击选择音频文件（可多选）' }}</span>
            <span class="text-xs text-muted-foreground">mp3 / wav / m4a / ogg / flac 等浏览器可解码格式，解码失败的单个标红跳过</span>
          </button>

          <p v-if="batchNotice" class="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{{ batchNotice }}
          </p>

          <div class="space-y-2">
            <p v-if="!items.length" class="text-xs text-muted-foreground text-center py-2">
              列表为空：先添加的排在上面，用每行的 ↑ ↓ 按钮调整拼接顺序
            </p>
            <div
              v-for="(item, idx) in items"
              :key="item.id"
              class="p-3 rounded-lg border space-y-2"
              :class="item.status === 'error' ? 'border-red-500/40 bg-red-500/5' : 'border-border bg-muted/40'"
            >
              <div class="flex items-center gap-2">
                <span class="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold flex-shrink-0 font-mono">#{{ item.serial }}</span>
                <span class="text-sm font-medium text-foreground truncate flex-1" :title="item.name">{{ item.name }}</span>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <button
                    @click="moveItem(idx, -1)"
                    :disabled="idx === 0"
                    aria-label="上移一段"
                    title="上移"
                    class="p-1 rounded border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="moveItem(idx, 1)"
                    :disabled="idx === items.length - 1"
                    aria-label="下移一段"
                    title="下移"
                    class="p-1 rounded border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="removeItem(item.id)"
                    aria-label="删除该段"
                    title="删除"
                    class="p-1 rounded border border-border bg-card text-muted-foreground hover:text-red-500 hover:border-red-500/40 transition"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div v-if="item.status === 'decoding'" class="text-xs text-muted-foreground">正在本地解码...</div>
              <div v-else-if="item.status === 'error'" class="text-xs text-red-500 flex items-center gap-1">
                <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0" />{{ item.error }}
              </div>
              <div v-else class="grid grid-cols-3 gap-x-2 text-xs text-muted-foreground font-mono">
                <span>{{ fmtDurOf(item.duration) }}</span>
                <span>{{ item.sampleRate }} Hz</span>
                <span>{{ item.channels === 1 ? '单声道' : item.channels + ' 声道' }}</span>
              </div>

              <div v-if="item.status === 'ok' && needsConvertOf(item)" class="text-[10px] text-muted-foreground">
                与首文件规格不同：拼接时将自动重采样{{ leadSpec.ch === 1 && item.channels > 1 ? '并平均混缩为单声道' : '' }}，时长不变
              </div>
            </div>
          </div>

          <button
            v-if="items.length"
            @click="clearAll"
            class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <Trash2 class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 全部清空
          </button>
        </div>

        <!-- 拼接设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold text-foreground">拼接设置</h2>

          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-foreground">段间静音</span>
              <span class="text-sm font-bold text-primary font-mono">{{ safeGap.toFixed(1) }} 秒</span>
            </div>
            <input v-model.number="gapSec" type="range" min="0" max="5" step="0.1" class="w-full accent-primary" />
            <div class="flex items-center justify-between mt-1">
              <span class="text-[10px] text-muted-foreground">0 秒（无缝拼接）</span>
              <button @click="resetGap" class="text-xs text-muted-foreground hover:text-primary transition-colors">重置静音时长</button>
              <span class="text-[10px] text-muted-foreground">5 秒</span>
            </div>
          </div>

          <div class="border-t border-border pt-3 space-y-2 text-xs text-muted-foreground">
            <p><span class="text-foreground font-medium">输出采样率：</span>跟随第一个文件{{ leadRateText }}</p>
            <p><span class="text-foreground font-medium">声道策略：</span>跟随第一个文件{{ leadChText }}</p>
            <p class="leading-relaxed">
              采样率或声道数与首文件不一致的素材，会在拼接时自动重采样到首文件规格（时长保持不变）；
              目标为单声道时，立体声段会自动平均混缩；单声道拼进立体声则自动复制到两个声道。
            </p>
          </div>
        </div>
      </div>

      <!-- 右列：拼接预览与导出 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground">拼接预览与导出</h2>

        <!-- 状态条：解码中 n/m / 完成 -->
        <div class="p-3 rounded-lg border border-border bg-muted/40 flex items-center gap-2 text-sm text-foreground">
          <CheckCircle v-if="decodeState === 'done' && items.length && errorCount === 0" class="w-4 h-4 text-green-500 flex-shrink-0" />
          <TriangleAlert v-else-if="decodeState === 'done' && errorCount > 0" class="w-4 h-4 text-amber-500 flex-shrink-0" />
          <Info v-else class="w-4 h-4 text-primary flex-shrink-0" />
          <span>{{ statusText }}</span>
        </div>

        <!-- 预估卡 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-primary/10 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">总时长预估（含静音）</p>
            <p class="text-2xl font-bold text-primary font-mono">{{ fmtDurOf(estDuration) }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">{{ estDuration.toFixed(1) }} 秒</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">待拼段数</p>
            <p class="text-2xl font-bold text-foreground">{{ okItems.length }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">静音 {{ safeGap.toFixed(1) }}s × {{ Math.max(0, okItems.length - 1) }} 处</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">输出规格（跟随首文件）</p>
            <p class="text-sm font-bold text-foreground mt-1.5 font-mono">{{ leadSpec.rate ? leadSpec.rate + ' Hz' : '—' }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">{{ leadSpec.ch === 1 ? '单声道 · WAV PCM16' : '立体声 · WAV PCM16' }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">预计 WAV 体积</p>
            <p class="text-sm font-bold text-foreground mt-1.5">{{ okItems.length ? formatSizeOf(estBytes) : '—' }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">未压缩 PCM（44 字节头）</p>
          </div>
        </div>

        <p class="text-xs text-muted-foreground">
          拼接顺序：<span class="font-mono text-foreground">{{ orderText || '—' }}</span>
          <span v-if="okItems.length > 1 && safeGap > 0" class="ml-2">段间将插入 {{ safeGap.toFixed(1) }} 秒静音 × {{ okItems.length - 1 }} 处</span>
        </p>

        <!-- 合成总波形预览 -->
        <div class="relative w-full h-[180px] rounded-lg border border-border bg-background overflow-hidden">
          <canvas ref="waveCanvasRef" class="absolute inset-0 w-full h-full"></canvas>
          <div v-if="!mergedMeta" class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <AudioLines class="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p class="text-xs text-muted-foreground">拼接完成后，这里显示合成音频的总波形（虚线为段落分界）</p>
          </div>
          <div v-else class="absolute bottom-1.5 left-3 right-3 flex justify-between text-[10px] font-mono text-muted-foreground pointer-events-none">
            <span>00:00</span>
            <span>{{ fmtDurOf(mergedMeta.duration) }}</span>
          </div>
        </div>

        <!-- 拼接进度 -->
        <div v-if="isMerging">
          <div class="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div class="h-full bg-primary transition-all" :style="{ width: Math.round(mergeProgress * 100) + '%' }"></div>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">{{ mergeStatusText }}</p>
        </div>

        <p v-if="mergeError" class="text-sm text-red-500 flex items-start gap-1.5">
          <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />{{ mergeError }}
        </p>

        <div v-if="mergedMeta" class="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-foreground flex items-start gap-2">
          <CheckCircle class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          <span>
            已生成 merged-audio.wav：{{ mergedMeta.segments }} 段 · {{ fmtDurOf(mergedMeta.duration) }} ·
            {{ mergedMeta.sampleRate }} Hz · {{ mergedMeta.channels === 1 ? '单声道' : '立体声' }} · {{ formatSizeOf(mergedMeta.size) }}
          </span>
        </div>

        <!-- 操作区 -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="mergeAudio"
            :disabled="!canMerge"
            class="flex-1 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download class="w-4 h-4 inline mr-1.5 -mt-0.5" /> {{ isMerging ? '正在拼接...' : '合并并下载 merged-audio.wav' }}
          </button>
          <button
            @click="togglePlay"
            :disabled="!mergedMeta || isMerging"
            class="px-5 py-3 rounded-lg bg-muted hover:bg-muted/80 border border-border text-sm font-medium text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Pause v-if="isPlaying" class="w-4 h-4 inline mr-1.5 -mt-0.5" />
            <Play v-else class="w-4 h-4 inline mr-1.5 -mt-0.5" />
            {{ isPlaying ? '停止试听' : '试听' }}
          </button>
          <button
            v-if="mergedMeta"
            @click="downloadMerged"
            class="px-5 py-3 rounded-lg bg-muted hover:bg-muted/80 border border-border text-sm font-medium text-foreground transition"
          >
            <Download class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重新下载
          </button>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
          说明：WAV 为未压缩 PCM（16bit），体积约为同时长 MP3 的 10 倍（10 分钟立体声约 100 MB）；
          解码、重采样、拼接与编码全部在本机完成，音频不会上传。拼接完成后可先试听，不满意可调整静音时长或顺序后重新拼接。
        </p>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="seoContentVisible ? '折叠内容' : '展开内容'"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>音频拼接器：把多段音频合并成一个文件</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          音频拼接器（音频合并工具）用于把几段独立的音频按顺序接成一条完整音轨：录音笔分段录制的采访、手机语音备忘、网课分节录音、
          有声书的多个章节、配音的多次补录……都可以在这里按顺序首尾相接。整个流程发生在浏览器里：文件通过 WebAudio 的 decodeAudioData
          在本地解码为 PCM 采样，按拼接计划逐段写入目标缓冲，再以手写的 RIFF 封装导出为 WAV，不经过任何服务器。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么把几段录音合成一个文件？</h3>
        <ol class="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground mb-2">
          <li>点击「选择音频文件」多选上传（最多 20 个、单文件不超过 100MB），每段会在本地自动解码；解码失败的单个文件标红跳过，不影响其他文件。</li>
          <li>用每行的 ↑ ↓ 按钮调整拼接顺序，段与段之间可设置 0–5 秒静音（默认 0 为无缝拼接）。</li>
          <li>输出采样率与声道自动跟随第一个文件，规格不同的素材自动重采样、混缩，无需手动处理。</li>
          <li>点击「合并并下载」，浏览器在本地完成拼接并导出 merged-audio.wav，同时给出总波形预览，可先试听确认再交付。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么导出的是 WAV 而不是 MP3？</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          WAV（PCM16）是无损封装：拼接本身只是把采样按顺序复制进新缓冲，不引入编码损失，导出即所见；WAV 也是兼容性最好的音频格式，
          所有剪辑软件、播放器和手机都直接支持。本页没有内置 MP3 编码器——如果你需要 MP3，可以先拼接导出 WAV，
          再用站内「音频格式互转」工具转成 MP3（注意 MP3 属于有损压缩，会引入一次编码损失）。压缩格式（MP3/M4A/OGG）作为输入
          则完全不受影响：它们在拼接前已被解码为 PCM，拼接质量取决于解码结果，与容器格式无关。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">拼接顺序怎么调？</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          列表从上到下就是拼接顺序。每行右侧有上移、下移两个箭头按钮，按一次移动一位；行首的 #序号 是上传时的编号，
          移动时保持不变，方便对照原始文件。删除某段只把它移出列表，已生成的拼接结果不受影响；
          调整顺序或静音后重新点击「合并并下载」即可得到新版本。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">不同采样率的文件能拼在一起吗？</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          能。输出规格跟随第一个文件：其余素材若采样率不同（例如 22050 Hz 的录音拼到 44100 Hz 的输出），
          会在拼接时通过 OfflineAudioContext 自动重采样；声道数不同的素材也会自动混缩或扩展
          （立体声拼进单声道输出时左右平均混缩，单声道拼进立体声时复制到两个声道）。重采样保持时长不变——
          它改变的是采样密度而不是播放速度，因此不会变调、不会变慢。列表中规格与首文件不同的段落会标注提示，
          你也可以通过调整文件顺序来改变「以谁的规格为准」。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">拼接后会不会有音质损失？</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          分两种情况：素材与首文件采样率、声道完全一致时，拼接是无缝复制采样，唯一的转换是量化到 16bit
          （理论动态范围约 96dB，正常回放听感上无差别）；采样率或声道不同时，会额外经过一次重采样插值或混缩，
          属于极轻微的数学运算差异。需要注意的是，MP3 等有损格式的损失发生在解码之前，本工具不会进一步叠加放大；
          追求最佳效果时，建议尽量用原始录音（WAV/高码率源）作为拼接素材。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">怎么把几段录音合成一个文件？</h3>
            <p class="text-sm text-muted-foreground mt-1">多选上传音频 → 用 ↑↓ 按钮排好顺序 → 按需设置段间静音 → 点击「合并并下载」导出 merged-audio.wav。全程本地处理，拼完可先看波形、试听再保存。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么导出的是 WAV 而不是 MP3？</h3>
            <p class="text-sm text-muted-foreground mt-1">WAV 是无损 PCM 封装，拼接过程零编码损失且全平台兼容；页面未内置 MP3 编码器，需要 MP3 时可先导出 WAV，再用站内音频格式互转工具二次转换（会引入一次有损压缩）。MP3 等格式作为输入不受影响。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">拼接顺序怎么调整？</h3>
            <p class="text-sm text-muted-foreground mt-1">列表自上而下即拼接顺序，每行有上移/下移按钮；#序号 保持上传时的编号不变便于核对。删除单段用垃圾桶按钮，调整后重新合并即可。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">不同采样率/声道数的文件能拼吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">能。输出采样率与声道跟随第一个文件，其余素材自动重采样、混缩到该规格，时长不变、不变调。规格不一致的段落会在列表中标注；调整文件顺序可改变以谁的规格为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">拼接后会有音质损失吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">规格一致的素材为无缝复制采样，仅量化到 16bit（动态范围约 96dB，听感无差别）；采样率不同时多一次重采样插值。有损格式（MP3 等）的损失发生在解码之前，本工具不会进一步放大。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'audio-merger'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  AudioLines, Play, Pause, Download, ArrowUp, ArrowDown,
  TriangleAlert, CheckCircle, ChevronUp, ChevronDown, Info, Trash2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '音频拼接器 - 在线合并多段音频/录音拼接导出 WAV',
  description: '在线音频拼接器，浏览器本地把多段 mp3/wav/m4a 录音按顺序合并为一个文件，支持上下调整顺序、段间静音、不同采样率自动重采样，无损导出 WAV 并可预览波形试听，文件不上传',
  keywords: '音频合并,音频拼接,mp3 合并,录音拼接,音频合成',
  author: '有条工具',
  ogTitle: '音频拼接器 - 在线合并多段音频导出 WAV | 有条工具',
  ogDescription: '多段录音按顺序本地合并，段间静音与自动重采样，无损导出 WAV，可波形预览与试听。',
  ogUrl: 'https://www.util.cn/tools/audio-merger',
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
          name: '音频拼接器',
          url: 'https://www.util.cn/tools/audio-merger',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['多段音频按序合并', '上移下移调整拼接顺序', '段间静音 0-5 秒', '自动重采样到首文件规格', '手写 RIFF 头导出 WAV 无损 PCM', '合成波形预览与试听', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '音频拼接器', item: 'https://www.util.cn/tools/audio-merger/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '怎么把几段录音合成一个文件？',
              acceptedAnswer: { '@type': 'Answer', text: '多选上传音频，用上下按钮排好顺序，按需设置段间静音，点击合并并下载导出 merged-audio.wav。全程本地处理，拼完可先看波形、试听再保存。' }
            },
            {
              '@type': 'Question',
              name: '为什么导出的是 WAV 而不是 MP3？',
              acceptedAnswer: { '@type': 'Answer', text: 'WAV 是无损 PCM 封装，拼接过程零编码损失且全平台兼容；页面未内置 MP3 编码器，需要 MP3 时可先导出 WAV 再用站内音频格式互转工具二次转换（会引入一次有损压缩）。MP3 等格式作为输入不受影响。' }
            },
            {
              '@type': 'Question',
              name: '拼接顺序怎么调整？',
              acceptedAnswer: { '@type': 'Answer', text: '列表自上而下即拼接顺序，每行有上移/下移按钮；序号保持上传时的编号不变便于核对。删除单段用垃圾桶按钮，调整后重新合并即可。' }
            },
            {
              '@type': 'Question',
              name: '不同采样率/声道数的文件能拼吗？',
              acceptedAnswer: { '@type': 'Answer', text: '能。输出采样率与声道跟随第一个文件，其余素材自动重采样、混缩到该规格，时长不变、不变调。规格不一致的段落会在列表中标注，调整文件顺序可改变以谁的规格为准。' }
            },
            {
              '@type': 'Question',
              name: '拼接后会有音质损失吗？',
              acceptedAnswer: { '@type': 'Answer', text: '规格一致的素材为无缝复制采样，仅量化到 16bit（动态范围约 96dB，听感无差别）；采样率不同时多一次重采样插值。有损格式（MP3 等）的损失发生在解码之前，本工具不会进一步放大。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_FILES = 20                        // 最多支持的文件数
const MAX_FILE_BYTES = 100 * 1024 * 1024    // 单文件 100MB 上限
const MAX_GAP_SEC = 5                       // 段间静音上限（秒）
const RIFF_HEADER_BYTES = 44                // 标准 WAV 头长度
const MAX_OUTPUT_BYTES = 1.5 * 1024 * 1024 * 1024 // 输出体积保护上限

// 浮点采样量化为 PCM16 有符号整数：先钳制到 [-1, 1]，再按符号不对称缩放
function floatToInt16Of(v) {
  let s = Number(v)
  if (!Number.isFinite(s)) s = 0
  s = s > 1 ? 1 : (s < -1 ? -1 : s)
  return Math.round(s < 0 ? s * 0x8000 : s * 0x7FFF)
}

// 总时长 = Σ每段时长 + 静音 × (段数 − 1)，保留 1 位小数
function totalDurationOf(durations, gapSec) {
  const list = Array.isArray(durations) ? durations : []
  let sum = 0
  for (let i = 0; i < list.length; i++) {
    sum += Math.max(0, Number(list[i]) || 0)
  }
  const gaps = list.length > 1 ? Math.max(0, Number(gapSec) || 0) * (list.length - 1) : 0
  return Math.round((sum + gaps) * 10) / 10
}

// 秒 → "mm:ss"（分钟可超过 59，非法输入归零）
function fmtDurOf(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r
}

// 拼接顺序展示文案：0 基索引数组 → "3 → 1 → 2"（显示为 1 基序号）
function interleaveOrderOf(indices) {
  if (!Array.isArray(indices) || !indices.length) return ''
  return indices.map((i) => (Number(i) || 0) + 1).join(' → ')
}

// 拼接计划：每段在目标缓冲中的写入偏移与长度（采样数）
// 段间静音体现为相邻段的 startSample 之间的空隙，目标缓冲零填充即为静音
function concatPlanOf(durations, gapSec, sampleRate) {
  const rate = Math.max(1, Number(sampleRate) || 1)
  const gapSamples = Math.round(Math.max(0, Number(gapSec) || 0) * rate)
  const plan = []
  let cursor = 0
  const list = Array.isArray(durations) ? durations : []
  for (let i = 0; i < list.length; i++) {
    const lengthSamples = Math.max(1, Math.round(Math.max(0, Number(list[i]) || 0) * rate))
    plan.push({ startSample: cursor, lengthSamples })
    cursor += lengthSamples + gapSamples
  }
  return plan
}

// 手写 WAV 编码器：44 字节标准 RIFF 头 + PCM16 小端交错，返回 ArrayBuffer
// samples 为「各声道采样数组组成的数组」（如 [左声道, 右声道]）
function encodeWavOf(samples, sampleRate) {
  const channels = samples && samples.length ? samples : [new Float32Array(0)]
  const numCh = channels.length
  const numFrames = channels[0] ? channels[0].length : 0
  const blockAlign = numCh * 2
  const dataSize = numFrames * blockAlign
  const buffer = new ArrayBuffer(RIFF_HEADER_BYTES + dataSize)
  const view = new DataView(buffer)
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)                       // fmt 块长度
  view.setUint16(20, 1, true)                        // PCM 格式
  view.setUint16(22, numCh, true)                    // 声道数
  view.setUint32(24, Math.max(1, Number(sampleRate) || 1), true) // 采样率
  view.setUint32(28, Math.max(1, Number(sampleRate) || 1) * blockAlign, true) // 字节率
  view.setUint16(32, blockAlign, true)               // 块对齐
  view.setUint16(34, 16, true)                       // 位深
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)                 // 数据大小
  let offset = RIFF_HEADER_BYTES
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numCh; c++) {
      view.setInt16(offset, floatToInt16Of(channels[c][i]), true)
      offset += 2
    }
  }
  return buffer
}

// 波形峰值：把采样数组按桶聚合，取每桶最大绝对值（用于 canvas 缩略波形）
function peakArrayOf(data, buckets) {
  const n = data && data.length ? data.length : 0
  const count = Math.max(1, Math.floor(Number(buckets) || 1))
  const peaks = new Array(count).fill(0)
  if (!n) return peaks
  const per = n / count
  for (let b = 0; b < count; b++) {
    const start = Math.floor(b * per)
    const end = Math.min(n, Math.max(start + 1, Math.floor((b + 1) * per)))
    let peak = 0
    for (let i = start; i < end; i++) {
      const v = Math.abs(Number(data[i]) || 0)
      if (v > peak) peak = v
    }
    peaks[b] = peak
  }
  return peaks
}

// 规格差异判定：某段是否需要重采样 / 混缩（相对目标规格）
function resampleNeedsOf(sampleRate, channels, targetRate, targetChannels) {
  return {
    resample: Number(sampleRate) !== Number(targetRate),
    remix: Number(channels) !== Number(targetChannels)
  }
}

// 静音时长钳制：0–5 秒，保留 1 位小数
function clampGapOf(v) {
  const n = Math.round((Number(v) || 0) * 10) / 10
  return Math.min(MAX_GAP_SEC, Math.max(0, n))
}

// 字节数 → 人类可读体积
function formatSizeOf(bytes) {
  const n = Math.max(0, Number(bytes) || 0)
  if (n < 1024) return Math.round(n) + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB'
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

// ---------- 页面状态 ----------
const fileInputRef = ref(null)
const waveCanvasRef = ref(null)
const items = ref([])               // { id, serial, name, size, status, error, duration, sampleRate, channels }
const gapSec = ref(0)
const decodeState = ref('idle')     // idle | decoding | done
const decodeDone = ref(0)
const decodeTotal = ref(0)
const batchNotice = ref('')
const isMerging = ref(false)
const mergeProgress = ref(0)
const mergeStatusText = ref('')
const mergeError = ref('')
const mergedMeta = ref(null)        // { segments, duration, sampleRate, channels, size }
const isPlaying = ref(false)
const seoContentVisible = ref(true)

// 非响应式大对象（AudioBuffer / Blob 不进响应式系统）
const bufferMap = new Map() // itemId -> 原始解码 AudioBuffer
let mergedBuffer = null     // 拼接后的 AudioBuffer（波形与试听用）
let mergedBlob = null       // 拼接后的 WAV Blob（下载用）
let mergedPlan = null       // 拼接计划（波形段落分界用）
let uidSeq = 0
let playCtx = null          // 试听 AudioContext（首次试听时创建）
let playSource = null

// ---------- 派生状态 ----------
const okItems = computed(() => items.value.filter((it) => it.status === 'ok'))
const errorCount = computed(() => items.value.filter((it) => it.status === 'error').length)
const okDurations = computed(() => okItems.value.map((it) => it.duration))
const safeGap = computed(() => clampGapOf(gapSec.value))
const leadSpec = computed(() => {
  const first = okItems.value[0]
  if (!first) return { rate: 0, ch: 0 }
  return { rate: first.sampleRate, ch: Math.min(2, Math.max(1, first.channels)) }
})
const leadRateText = computed(() => (leadSpec.value.rate ? `（当前 ${leadSpec.value.rate} Hz）` : '（待添加文件）'))
const leadChText = computed(() => (leadSpec.value.ch ? `（当前${leadSpec.value.ch === 1 ? '单声道' : '立体声'}）` : '（待添加文件）'))
const estPlan = computed(() => concatPlanOf(okDurations.value, safeGap.value, leadSpec.value.rate || 44100))
const estSamples = computed(() => {
  const plan = estPlan.value
  if (!plan.length) return 0
  const last = plan[plan.length - 1]
  return last.startSample + last.lengthSamples
})
const estBytes = computed(() => RIFF_HEADER_BYTES + estSamples.value * Math.max(1, leadSpec.value.ch) * 2)
const estDuration = computed(() => totalDurationOf(okDurations.value, safeGap.value))
const orderText = computed(() => interleaveOrderOf(okItems.value.map((it) => it.serial - 1)))
const canMerge = computed(() => okItems.value.length >= 2 && decodeState.value !== 'decoding' && !isMerging.value)

const statusText = computed(() => {
  if (decodeState.value === 'decoding') {
    return `解码中 ${decodeDone.value}/${decodeTotal.value}，失败的文件会标红跳过，不阻断其他文件`
  }
  if (!items.value.length) return '尚未添加文件：点击左侧按钮选择音频（支持多选），列表顺序即拼接顺序'
  const ok = okItems.value.length
  const bad = errorCount.value
  if (ok === 0) return `已添加 ${bad} 个文件但全部解码失败，请确认格式（mp3 / wav / m4a 等浏览器可解码格式）`
  if (bad) return `解码完成：${ok} 个文件可用、${bad} 个失败已跳过（标红），可开始拼接`
  return `解码完成：${ok} 个文件已就绪，用 ↑↓ 调整顺序后即可拼接`
})

function needsConvertOf(item) {
  if (!leadSpec.value.rate) return false
  const flags = resampleNeedsOf(item.sampleRate, item.channels, leadSpec.value.rate, leadSpec.value.ch)
  return flags.resample || flags.remix
}

// ---------- 列表操作 ----------
function triggerPick() {
  if (fileInputRef.value) fileInputRef.value.click()
}

function moveItem(idx, dir) {
  const next = idx + dir
  if (next < 0 || next >= items.value.length) return
  const list = items.value
  const moved = list.splice(idx, 1)[0]
  list.splice(next, 0, moved)
}

function patchItem(id, patch) {
  const it = items.value.find((x) => x.id === id)
  if (it) Object.assign(it, patch)
}

function removeItem(id) {
  items.value = items.value.filter((it) => it.id !== id)
  bufferMap.delete(id)
  if (!items.value.length) {
    decodeState.value = 'idle'
    decodeDone.value = 0
    decodeTotal.value = 0
    batchNotice.value = ''
  }
}

function clearAll() {
  stopPlayback()
  items.value = []
  bufferMap.clear()
  mergedBuffer = null
  mergedBlob = null
  mergedPlan = null
  mergedMeta.value = null
  mergeError.value = ''
  mergeProgress.value = 0
  mergeStatusText.value = ''
  decodeState.value = 'idle'
  decodeDone.value = 0
  decodeTotal.value = 0
  batchNotice.value = ''
}

function resetGap() {
  gapSec.value = 0
}

// ---------- 文件解码（用户手势回调内创建 AudioContext，SSR 安全） ----------
async function onFileChange(e) {
  const input = e.target
  const files = input && input.files ? Array.from(input.files) : []
  if (input) input.value = '' // 允许重复选择同一文件
  if (!files.length) return
  stopPlayback()
  batchNotice.value = ''

  const room = MAX_FILES - items.value.length
  if (room <= 0) {
    batchNotice.value = `最多保留 ${MAX_FILES} 个文件，本次选择的 ${files.length} 个已忽略，请先删除部分文件`
    return
  }
  const accepted = files.slice(0, room)
  const overflow = files.length - accepted.length
  if (overflow > 0) {
    batchNotice.value = `已达 ${MAX_FILES} 个上限，本次仅接收前 ${accepted.length} 个，${overflow} 个被忽略`
  }

  const tasks = []
  for (const file of accepted) {
    uidSeq += 1
    const entry = {
      id: uidSeq,
      serial: uidSeq, // 序号跟随累计添加次数，移动排序不变、删除后不复用
      name: file.name,
      size: file.size,
      status: 'decoding',
      error: '',
      duration: 0,
      sampleRate: 0,
      channels: 0
    }
    if (file.size > MAX_FILE_BYTES) {
      entry.status = 'error'
      entry.error = '超过 100MB 单文件上限，已跳过'
      items.value.push(entry)
      continue
    }
    items.value.push(entry)
    tasks.push({ id: entry.id, file })
  }

  if (!tasks.length) return
  decodeState.value = 'decoding'
  decodeTotal.value = tasks.length
  decodeDone.value = 0

  let ctx = null
  try {
    ctx = new AudioContext()
  } catch (err) {
    tasks.forEach((t) => patchItem(t.id, { status: 'error', error: '当前浏览器不支持 WebAudio，无法解码' }))
    decodeState.value = 'done'
    return
  }

  try {
    for (const t of tasks) {
      try {
        const arrayBuffer = await t.file.arrayBuffer()
        const buf = await ctx.decodeAudioData(arrayBuffer)
        bufferMap.set(t.id, buf)
        patchItem(t.id, {
          status: 'ok',
          duration: buf.duration,
          sampleRate: buf.sampleRate,
          channels: buf.numberOfChannels
        })
      } catch (err) {
        patchItem(t.id, { status: 'error', error: '解码失败：浏览器无法解析该文件（已跳过，不影响其他文件）' })
      }
      decodeDone.value += 1
    }
  } finally {
    decodeState.value = 'done'
    try { await ctx.close() } catch (err) {}
  }
}

// ---------- 拼接与导出（用户手势回调内创建 OfflineAudioContext） ----------
// 把一段原始 buffer 变换为目标规格的声道数据；规格一致时零拷贝风格直取，不一致时经 OfflineAudioContext 重采样/混缩
async function renderSegmentOf(buffer, targetRate, targetCh, lengthSamples) {
  if (buffer.sampleRate === targetRate && buffer.numberOfChannels === targetCh) {
    const chans = []
    for (let c = 0; c < targetCh; c++) {
      const src = buffer.getChannelData(c)
      const out = new Float32Array(lengthSamples)
      out.set(src.subarray(0, Math.min(src.length, lengthSamples)))
      chans.push(out)
    }
    return chans
  }
  const offline = new OfflineAudioContext(targetCh, lengthSamples, targetRate)
  const src = offline.createBufferSource()
  src.buffer = buffer
  src.connect(offline.destination)
  src.start(0, 0, buffer.duration)
  const rendered = await offline.startRendering()
  const chans = []
  for (let c = 0; c < targetCh; c++) chans.push(rendered.getChannelData(c))
  return chans
}

async function mergeAudio() {
  if (!canMerge.value) return
  stopPlayback()
  isMerging.value = true
  mergeError.value = ''
  mergeProgress.value = 0
  mergeStatusText.value = ''

  const list = okItems.value
  const buffers = list.map((it) => bufferMap.get(it.id)).filter(Boolean)
  if (buffers.length < 2) {
    isMerging.value = false
    mergeError.value = '可用音频不足 2 段，请先成功解码至少两个文件'
    return
  }

  try {
    const durations = buffers.map((b) => b.duration)
    const targetRate = buffers[0].sampleRate
    const targetCh = Math.min(2, Math.max(1, buffers[0].numberOfChannels))
    const gap = safeGap.value
    const plan = concatPlanOf(durations, gap, targetRate)
    const last = plan[plan.length - 1]
    const totalSamples = last.startSample + last.lengthSamples
    const outBytes = RIFF_HEADER_BYTES + totalSamples * targetCh * 2
    if (outBytes > MAX_OUTPUT_BYTES) {
      throw new Error(`预计输出 ${formatSizeOf(outBytes)}，超出 ${formatSizeOf(MAX_OUTPUT_BYTES)} 保护上限，请缩短素材或分批拼接`)
    }

    // 目标缓冲：按拼接计划逐段 copyToChannel，静音区间保持零填充
    const offline = new OfflineAudioContext(targetCh, totalSamples, targetRate)
    const target = offline.createBuffer(targetCh, totalSamples, targetRate)

    for (let i = 0; i < buffers.length; i++) {
      const needFlags = resampleNeedsOf(buffers[i].sampleRate, buffers[i].numberOfChannels, targetRate, targetCh)
      mergeStatusText.value = `正在处理第 ${i + 1}/${buffers.length} 段${needFlags.resample ? '（含重采样）' : ''}...`
      const segChans = await renderSegmentOf(buffers[i], targetRate, targetCh, plan[i].lengthSamples)
      for (let c = 0; c < targetCh; c++) {
        target.copyToChannel(segChans[c], c, plan[i].startSample)
      }
      mergeProgress.value = (i + 1) / (buffers.length + 1)
      await new Promise((r) => setTimeout(r, 0)) // 让出主线程，刷新进度
    }

    mergeStatusText.value = '正在写入 WAV（RIFF 头 + PCM16）...'
    const chans = []
    for (let c = 0; c < targetCh; c++) chans.push(target.getChannelData(c))
    const wav = encodeWavOf(chans, targetRate)
    mergedBlob = new Blob([wav], { type: 'audio/wav' })
    mergedBuffer = target
    mergedPlan = plan
    mergedMeta.value = {
      segments: buffers.length,
      duration: totalDurationOf(durations, gap),
      sampleRate: targetRate,
      channels: targetCh,
      size: wav.byteLength
    }
    mergeProgress.value = 1
    mergeStatusText.value = ''
    drawWave()
    downloadMerged()
  } catch (err) {
    mergeError.value = '拼接失败：' + (err && err.message ? err.message : '未知错误，请重试或更换素材')
    mergedMeta.value = null
    mergedBuffer = null
    mergedBlob = null
    mergedPlan = null
  } finally {
    isMerging.value = false
  }
}

function downloadMerged() {
  if (!mergedBlob) return
  const url = URL.createObjectURL(mergedBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'merged-audio.wav'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ---------- 波形绘制（合成后总波形 + 段落分界虚线） ----------
function drawWave() {
  const canvas = waveCanvasRef.value
  if (!canvas || !mergedBuffer) return
  const parent = canvas.parentElement
  const w = canvas.clientWidth || (parent ? parent.clientWidth : 600)
  const h = canvas.clientHeight || 180
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.round(w * dpr))
  canvas.height = Math.max(1, Math.round(h * dpr))
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const total = mergedBuffer.length
  const buckets = Math.min(1200, Math.max(80, Math.floor(w / 3)))
  const mid = h / 2

  // 中线
  ctx.fillStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.fillRect(0, mid - 0.5, w, 1)

  // 各声道峰值合并
  let peaks = peakArrayOf(mergedBuffer.getChannelData(0), buckets)
  for (let c = 1; c < mergedBuffer.numberOfChannels; c++) {
    const p2 = peakArrayOf(mergedBuffer.getChannelData(c), buckets)
    for (let i = 0; i < buckets; i++) {
      if (p2[i] > peaks[i]) peaks[i] = p2[i]
    }
  }

  // 波形柱
  const barW = w / buckets
  ctx.fillStyle = '#2563eb'
  for (let i = 0; i < buckets; i++) {
    const bh = Math.max(2, peaks[i] * (h - 16))
    ctx.fillRect(i * barW, mid - bh / 2, Math.max(1, barW * 0.7), bh)
  }

  // 段落分界虚线
  if (mergedPlan && mergedPlan.length > 1) {
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)'
    ctx.setLineDash([4, 4])
    for (let i = 1; i < mergedPlan.length; i++) {
      const x = Math.round((mergedPlan[i].startSample / total) * w) + 0.5
      ctx.beginPath()
      ctx.moveTo(x, 2)
      ctx.lineTo(x, h - 2)
      ctx.stroke()
    }
    ctx.setLineDash([])
  }
}

function handleResize() {
  if (mergedBuffer) drawWave()
}

// ---------- 试听（AudioBufferSourceNode，可停） ----------
function ensurePlayCtx() {
  if (!playCtx) playCtx = new AudioContext()
  if (playCtx.state === 'suspended' && playCtx.resume) playCtx.resume()
  return playCtx
}

function togglePlay() {
  if (isPlaying.value) {
    stopPlayback()
    return
  }
  if (!mergedBuffer) return
  try {
    const ctx = ensurePlayCtx()
    const src = ctx.createBufferSource()
    src.buffer = mergedBuffer
    src.connect(ctx.destination)
    src.onended = () => {
      if (playSource === src) {
        playSource = null
        isPlaying.value = false
      }
    }
    src.start()
    playSource = src
    isPlaying.value = true
  } catch (err) {
    isPlaying.value = false
    mergeError.value = '试听失败：' + (err && err.message ? err.message : '浏览器音频播放不可用')
  }
}

function stopPlayback() {
  if (playSource) {
    try {
      playSource.onended = null
      playSource.stop()
    } catch (err) {}
    playSource = null
  }
  isPlaying.value = false
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('audio-merger')
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  stopPlayback()
  if (playCtx) {
    try { playCtx.close() } catch (err) {}
    playCtx = null
  }
})
</script>
