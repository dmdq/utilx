<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Gauge class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">音频变速器</h1>
          <p class="text-sm text-muted-foreground mt-1">录音与课程按 0.5–3 倍速回放，变速不变调（时间拉伸）或倍速直变，本地解码处理并导出 WAV</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线音频变速工具：把课堂录音、播客、会议记录、语言学习的听力材料在浏览器里按你选择的倍速重新生成一个音频文件。
        「变速不变调」用时间拉伸算法把节奏改快的同时保持说话人的音高不变，听起来只是说得快了，不会变成「尖声快放」；
        「倍速直变」则按倍速直接重读采样，等价于播放器的倍速键，处理极快但音高会随之升高或降低。
        音频通过 WebAudio 在本地解码为 PCM，处理完可先试听再导出无损 WAV，全程不上传任何服务器。
      </p>
      <div class="mt-3 inline-flex items-start gap-2 px-3 py-2 bg-muted/60 border border-border rounded-lg text-sm text-muted-foreground">
        <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <span>变速不变调用时间拉伸算法（朴素重叠窗实现），处理后文件较大耗时较长；倍速直变（Pitch 会变）则实时预览即可。全程本地处理。</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左列：文件 + 变速设置 -->
      <div class="space-y-6">
        <!-- 文件卡片 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-foreground">音频文件</h2>
            <span class="text-xs text-muted-foreground font-mono">≤ 100MB</span>
          </div>

          <input ref="fileInputRef" type="file" accept="audio/*" class="hidden" @change="onFileChange" />

          <button
            @click="triggerPick"
            :disabled="decoding"
            class="w-full py-7 border-2 border-dashed rounded-lg transition-colors flex flex-col items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            :class="decodeError ? 'border-red-500/50 bg-red-500/5' : 'border-primary/40 hover:bg-muted/60'"
          >
            <Gauge class="w-7 h-7 text-primary" />
            <span class="text-sm font-medium text-foreground">{{ fileMeta ? '换一个音频文件' : (decoding ? '正在本地解码...' : '点击选择音频文件') }}</span>
            <span class="text-xs text-muted-foreground">mp3 / wav / m4a / ogg / flac 等浏览器可解码格式，单个文件</span>
          </button>

          <p v-if="decodeError" class="text-sm text-red-500 flex items-start gap-1.5">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />{{ decodeError }}
          </p>

          <div v-if="fileMeta" class="p-3 rounded-lg border border-border bg-muted/40 space-y-2">
            <p class="text-sm font-medium text-foreground truncate" :title="fileMeta.name">{{ fileMeta.name }}</p>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground font-mono">
              <span>时长 {{ fmtDurOf(fileMeta.duration) }}</span>
              <span>{{ fileMeta.duration.toFixed(1) }} 秒</span>
              <span>{{ fileMeta.sampleRate }} Hz</span>
              <span>{{ fileMeta.channels === 1 ? '单声道' : fileMeta.channels + ' 声道' }}</span>
              <span>{{ formatSizeOf(fileMeta.size) }}</span>
              <span>{{ fileMeta.lengthSamples }} 采样</span>
            </div>
          </div>

          <button
            @click="resetAll"
            class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置全部
          </button>
        </div>

        <!-- 变速设置卡片 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold text-foreground">变速设置</h2>

          <div>
            <p class="text-sm font-medium text-foreground mb-2">处理模式</p>
            <div class="grid grid-cols-1 gap-2" role="group" aria-label="变速模式">
              <button
                v-for="opt in modeOptions"
                :key="opt.id"
                @click="setMode(opt.id)"
                class="text-left px-3 py-2.5 rounded-lg border transition"
                :class="mode === opt.id ? 'border-primary bg-primary/10' : 'border-border bg-muted/40 hover:bg-muted/70'"
              >
                <span class="flex items-center gap-2">
                  <CheckCircle v-if="mode === opt.id" class="w-4 h-4 text-primary flex-shrink-0" />
                  <span v-else class="w-4 h-4 rounded-full border border-border flex-shrink-0"></span>
                  <span class="text-sm font-medium text-foreground">{{ opt.name }}</span>
                </span>
                <span class="block text-xs text-muted-foreground mt-1 leading-relaxed">{{ opt.hint }}</span>
              </button>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-foreground">倍速</span>
              <span class="text-sm font-bold text-primary font-mono">{{ speedText }}</span>
            </div>
            <input v-model.number="speed" type="range" min="0.5" max="3" step="0.05" class="w-full accent-primary" />
            <div class="flex items-center justify-between mt-1">
              <span class="text-[10px] text-muted-foreground">0.5×（放慢一倍）</span>
              <span class="text-[10px] text-muted-foreground">3×（加快三倍）</span>
            </div>
            <div class="grid grid-cols-5 gap-1.5 mt-3">
              <button
                v-for="p in speedPresets"
                :key="p"
                @click="setSpeed(p)"
                class="px-1 py-1.5 rounded-md border text-xs font-medium font-mono transition"
                :class="isPresetActive(p) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-foreground hover:bg-muted/70'"
              >
                {{ p }}×
              </button>
            </div>
          </div>

          <div class="border-t border-border pt-3 space-y-1.5 text-xs text-muted-foreground">
            <p><span class="text-foreground font-medium">输出规格：</span>跟随源文件{{ specText }}</p>
            <p v-if="mode === 'resample'" class="leading-relaxed flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>倍速直变按 rate 线性插值重读采样，时长变为原长 ÷ 倍速，音高会变高（&gt;1×）或变低（&lt;1×）。</span>
            </p>
            <p v-else class="leading-relaxed">
              变速不变调把音频切成重叠短窗（grain 2048 采样 / hop 512 采样，4 倍重叠）后按新节奏叠加，音高保持不变。
              朴素固定步长会让持续单音出现电平起伏与轻微「颤音」感，语音、会议、课程录音影响较小；拿不准时先用下方实时试听判断倍速是否合适。
            </p>
          </div>
        </div>
      </div>

      <!-- 右列：处理、试听与导出 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground">变速处理与试听导出</h2>

        <!-- 状态条 -->
        <div class="p-3 rounded-lg border border-border bg-muted/40 flex items-center gap-2 text-sm text-foreground">
          <CheckCircle v-if="resultMeta" class="w-4 h-4 text-green-500 flex-shrink-0" />
          <TriangleAlert v-else-if="processError" class="w-4 h-4 text-amber-500 flex-shrink-0" />
          <Info v-else class="w-4 h-4 text-primary flex-shrink-0" />
          <span>{{ statusText }}</span>
        </div>

        <!-- 时长与耗时预估 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">原时长</p>
            <p class="text-xl font-bold text-foreground font-mono">{{ fileMeta ? fmtDurOf(fileMeta.duration) : '—' }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">{{ fileMeta ? fileMeta.lengthSamples + ' 采样' : '待选择文件' }}</p>
          </div>
          <div class="bg-primary/10 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">新时长</p>
            <p class="text-xl font-bold text-primary font-mono">{{ outLen ? fmtDurOf(newDuration) : '—' }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">{{ outLen ? outLen + ' 采样' : '按倍速换算' }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">预估耗时</p>
            <p class="text-xl font-bold text-foreground font-mono">{{ outLen ? estCostText : '—' }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">{{ isProcessing && actualMs !== null ? '实际 ' + (actualMs / 1000).toFixed(1) + ' 秒' : '按采样数线性估算' }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[10px] text-muted-foreground mb-1">预计 WAV 体积</p>
            <p class="text-sm font-bold text-foreground mt-1.5">{{ outLen ? formatSizeOf(estBytes) : '—' }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">无损 PCM16（44 字节头）</p>
          </div>
        </div>

        <!-- 模式与倍速状态卡 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="col-span-2 p-3 rounded-lg border border-border bg-background">
            <p class="text-[10px] text-muted-foreground mb-1">当前模式</p>
            <p class="text-sm font-semibold text-foreground">{{ modeName }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">{{ mode === 'stretch' ? '时间拉伸 · 音高不变' : '重采样直变 · 音高随倍速' }}</p>
          </div>
          <div class="p-3 rounded-lg border border-border bg-background text-center">
            <p class="text-[10px] text-muted-foreground mb-1">倍速</p>
            <p class="text-lg font-bold text-primary font-mono">{{ speedText }}</p>
          </div>
          <div class="p-3 rounded-lg border border-border bg-background text-center">
            <p class="text-[10px] text-muted-foreground mb-1">播放状态</p>
            <p class="text-lg font-bold text-foreground">{{ isPlaying ? '试听中' : '未播放' }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">{{ playSourceLabel }}</p>
          </div>
        </div>

        <!-- 处理进度 -->
        <div v-if="isProcessing">
          <div class="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div class="h-full bg-primary transition-all" :style="{ width: Math.round(progress * 100) + '%' }"></div>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">{{ progressText }}</p>
        </div>

        <p v-if="processError" class="text-sm text-red-500 flex items-start gap-1.5">
          <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />{{ processError }}
        </p>

        <div v-if="resultMeta" class="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-foreground flex items-start gap-2">
          <CheckCircle class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          <span>
            已生成 {{ resultMeta.fileName }}：{{ modeName }} · {{ resultMeta.speedText }} ·
            {{ fmtDurOf(resultMeta.duration) }}（原 {{ fmtDurOf(resultMeta.sourceDuration) }}）·
            {{ resultMeta.sampleRate }} Hz · {{ resultMeta.channels === 1 ? '单声道' : '立体声' }} · 耗时 {{ (resultMeta.actualMs / 1000).toFixed(1) }} 秒
          </span>
        </div>

        <!-- 操作区 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            @click="processAudio"
            :disabled="!canProcess"
            class="col-span-2 sm:col-span-2 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Gauge class="w-4 h-4 inline mr-1.5 -mt-0.5" /> {{ isProcessing ? '正在变速处理...' : '开始变速处理' }}
          </button>
          <button
            @click="togglePlay"
            :disabled="!canPlay"
            class="py-3 rounded-lg bg-muted hover:bg-muted/80 border border-border text-sm font-medium text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Pause v-if="isPlaying" class="w-4 h-4 inline mr-1.5 -mt-0.5" />
            <Play v-else class="w-4 h-4 inline mr-1.5 -mt-0.5" />
            {{ isPlaying ? '停止试听' : '试听结果' }}
          </button>
          <button
            @click="downloadResult"
            :disabled="!resultMeta || isProcessing"
            class="py-3 rounded-lg bg-muted hover:bg-muted/80 border border-border text-sm font-medium text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 导出 WAV
          </button>
        </div>

        <button
          @click="previewOriginal"
          :disabled="!fileMeta || isProcessing"
          class="w-full py-2.5 rounded-lg bg-muted/50 hover:bg-muted/80 border border-dashed border-border text-sm font-medium text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play v-if="!isPlaying || playKind !== 'source'" class="w-4 h-4 inline mr-1.5 -mt-0.5" />
          <Pause v-else class="w-4 h-4 inline mr-1.5 -mt-0.5" />
          按 {{ speedText }} 实时试听原音频（走 playbackRate，不处理、音高会变）
        </button>

        <p class="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
          说明：变速不变调的结果已经把新节奏写进采样，试听按 1.0 倍速播放即为最终听感；「实时试听原音频」用 AudioBufferSourceNode 的 playbackRate
          直接改读取速度，无需等待处理，适合先判断倍速是否合适，但音高会一起变化。导出的 WAV 为未压缩 PCM16，体积约为同时长 MP3 的 10 倍；
          解码、拉伸、重采样与编码全部在本机完成，音频不上传。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>音频变速器：把录音按倍速重生成一个文件</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          音频变速器用于把一整段音频（课程录音、播客、会议记录、外语听力）改写成更快或更慢的版本并保存成新文件。它与播放器的倍速键最大的不同是：
          播放器的倍速只改变当下播放，关掉就没了，而且多数播放器的倍速会连带把音高一起升高；本页则把新的节奏写进采样、导出一个可以随处播放的 WAV 文件，
          并且支持「变速不变调」——时长压缩了，说话人的音高却保持不变。整个流程都在浏览器内完成：WebAudio 的 decodeAudioData 本地解码为 PCM，
          时间拉伸或重采样后由手写的 RIFF 编码器导出 WAV，不经过任何服务器。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">变速不变调是什么？（时间拉伸原理）</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          一句话：变速不变调就是「改变采样在时间轴上的排布密度，而不改变它们的疏密比例」，所以时长变了、音高不变。
          音高由相邻采样的间隔决定，直接把采样按 2 倍速读完（重采样）会让间隔减半、音高升一个八度；时间拉伸则反过来——
          把音频切成一小段一小段（本页 grain 取 2048 个采样，约 46 毫秒），每段加 Hann 窗后按更密的节奏重叠叠加到新的输出位置上，
          段内采样的疏密完全不动，因此音高维持原样，只是段与段之间少读或多读一些内容，整体时长就压缩或拉长了。
          本页实现的是朴素的窗口叠加法（固定切窗，不做相似度搜索），倍速越极端越容易在长音上听到轻微颤音，1.25–2 倍速通常听感自然。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">语言学习适合几倍速？</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          常见的建议区间是 1.25–1.5 倍：这个区间既能明显压缩听课与精听时间，又基本保留连读、弱读和语调细节，不至于把音节糊成一团。
          第一遍理解大意可以用 1.5–2 倍，第二遍逐句精听、跟读模仿时退回 0.75–1 倍把音听清，比一直 1 倍速效率更高。
          记忆类复习（背单词例句、复听笔记）适合 1.25 倍；内容密度高或有专业术语的材料建议不超过 1.25 倍。
          建议用「变速不变调」模式，音高不变才能保持对原始语调的感知；学习场景里若只是想快速筛内容，用倍速直变加实时试听即可，不必处理文件。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么处理后的文件变大？</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          两个原因叠加。第一，导出格式是无损 WAV（PCM16 未压缩）：44100Hz 立体声每秒固定占用约 176KB，10 分钟就是约 100MB，
          而同样 10 分钟的 MP3 只要 10MB 左右——这不是本页引入的损失，而是把解码后的采样原样封装的必然结果，好处是零编码损失、全平台兼容。
          第二，放慢会真的变长：0.5 倍速输出的时长与采样数是源文件的两倍，体积自然翻倍。反过来 2 倍速的文件会小一半。
          页面右上会实时显示「预计 WAV 体积」，需要 MP3 的话可以先导出 WAV，再用站内音频格式互转工具二次压缩。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">对音质有什么影响？</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          变速不变调的影响来自重叠相加：相邻窗口取自源文件的不同位置，叠加处相当于把几个不同时刻的读法做加权平均，
          因此瞬态（爆破音、鼓点）会被轻微抹平；对持续不变的单频成分，这几个读法之间存在固定相位差，加权平均后会带来电平起伏与轻微「颤音」感——
          这是朴素重叠窗（不做波形相似度对齐）的固有特性，倍速越极端越明显。语音、课程、会议这类宽带且不断变化的内容受影响较小，
          人耳主要听见的仍是「说得快了/慢了、音色没变」。本页在叠加时同时累计窗权和并做归一化，因此 1 倍速处理是逐点透明的（不增减任何电平），
          量化到 16bit 的动态范围约 96dB，听感上无差别。倍速直变的影响更「整齐」：线性插值相当于把波形在时间轴上重新取样，
          音高与音色同步升降，没有任何叠加平滑，电平也完全不变，但完全听不出原始的人声音色。
          若源文件本身是有损格式（MP3/M4A/OGG），其编码损失发生在解码之前，本页不会进一步放大。
          追求最佳效果建议用原始录音（WAV 或高码率源）作为输入，尽量把倍速控制在 2 倍以内，并在正式导出前先试听确认。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">和播放器倍速有什么区别？</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          播放器倍速是一次「实时读取加速」：同一份文件，播放时按 1.5 倍速度消费采样，音高通常会一起升高（部分播放器另带「保持音高」开关），
          关掉页面就恢复原样，也无法把 1.5 倍速的版本发给别人。本页做的是离线改写文件本身：
          变速不变调把新的节奏固化进采样，导出的 WAV 在任何播放器、手机、录音笔上播放都是这个速度且音高不变，适合做批量素材预处理、
          配合剪辑软件、或给不支持倍速的设备准备材料。而本页的「倍速直变」模式在算法上正等价于播放器的倍速键（都是重读采样），
          只是把结果保存了下来；「按倍速实时试听原音频」则直接用 AudioBufferSourceNode 的 playbackRate，与播放器实现同一件事。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">怎么让音频变快但声音不变尖？</h3>
            <p class="text-sm text-muted-foreground mt-1">选择「变速不变调」模式再设倍速。该模式用时间拉伸（重叠窗）改写采样排布，时长变短而音高不变；「倍速直变」按倍速重读采样，音高会同步升高。不确定时先用「按倍速实时试听原音频」判断倍速是否合适。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">语言学习用几倍速比较好？</h3>
            <p class="text-sm text-muted-foreground mt-1">常见建议是 1.25–1.5 倍：既能压缩时间又保留连读、弱读与语调细节。第一遍泛听可到 1.5–2 倍，逐句精听与跟读时回退到 0.75–1 倍；专业术语密集的材料建议不超过 1.25 倍。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么导出的文件比原来大很多？</h3>
            <p class="text-sm text-muted-foreground mt-1">导出为无损 WAV（PCM16），44.1kHz 立体声约 176KB/秒，10 分钟约 100MB，同时长 MP3 约 10MB；放慢到 0.5 倍还会让时长与体积翻倍。需要小体积可导出 WAV 后再用站内音频格式互转工具压缩为 MP3。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">处理需要多久？会上传我的录音吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">耗时按采样数线性增长，页面会给出「约 X 秒」的预估：变速不变调约为每输出采样 4 倍窗叠加的计算量，倍速直变快一个数量级。全程在你浏览器内存中完成解码、拉伸与编码，不发送任何网络请求，刷新页面即清空。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">提示「受保护或损坏的音频无法解码」怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">浏览器无法解密带 DRM 的文件，也无法解析截断或扩展名与实际编码不符的文件。可先在本地播放器确认能否正常打开，或用格式互转工具转成 WAV/MP3 后再上传；单个文件请控制在 100MB 以内。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'audio-speed-changer'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Gauge, Play, Pause, Download, CheckCircle,
  TriangleAlert, ChevronUp, ChevronDown, Info, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '音频变速器 - 在线录音变速/听录音加速不变调导出 WAV',
  description: '在线音频变速器，浏览器本地把录音、课程、播客按 0.5-3 倍速重新生成文件，支持变速不变调（时间拉伸保持音高）与倍速直变两种模式，可试听预览并无损导出 WAV，适合语言学习精听与会议回放，文件不上传',
  keywords: '音频变速,听录音加速,语言学习变速,不变调变速,audio speed',
  author: '有条工具',
  ogTitle: '音频变速器 - 在线录音变速/不变调加速导出 WAV | 有条工具',
  ogDescription: '0.5-3 倍速变速不变调（时间拉伸保持音高）或倍速直变，本地处理试听并导出 WAV，文件不上传。',
  ogUrl: 'https://www.util.cn/tools/audio-speed-changer',
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
          name: '音频变速器',
          url: 'https://www.util.cn/tools/audio-speed-changer',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['0.5-3 倍速调节', '变速不变调（重叠窗时间拉伸，音高不变）', '倍速直变（重采样，音高随倍速）', '快捷档位 0.5/0.75/1.25/1.5/2', '原时长与新时长换算', '预估处理耗时', '结果试听与 playbackRate 实时试听', '手写 RIFF 头无损导出 WAV', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: '音频变速器', item: 'https://www.util.cn/tools/audio-speed-changer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '怎么让音频变快但声音不变尖？',
              acceptedAnswer: { '@type': 'Answer', text: '选择变速不变调模式再设倍速。该模式用时间拉伸（重叠窗）改写采样在时间轴上的排布，时长变短而音高不变；倍速直变按倍速重读采样，音高会同步升高。不确定时先用「按倍速实时试听原音频」判断倍速是否合适。' }
            },
            {
              '@type': 'Question',
              name: '语言学习用几倍速比较好？',
              acceptedAnswer: { '@type': 'Answer', text: '常见建议是1.25-1.5倍：既能压缩时间又保留连读、弱读与语调细节。第一遍泛听可到1.5-2倍，逐句精听与跟读时回退到0.75-1倍；专业术语密集的材料建议不超过1.25倍。' }
            },
            {
              '@type': 'Question',
              name: '为什么导出的文件比原来大很多？',
              acceptedAnswer: { '@type': 'Answer', text: '导出为无损WAV（PCM16），44.1kHz立体声约176KB/秒，10分钟约100MB，同时长MP3约10MB；放慢到0.5倍还会让时长与体积翻倍。需要小体积可导出WAV后再用站内音频格式互转工具压缩为MP3。' }
            },
            {
              '@type': 'Question',
              name: '处理需要多久？会上传我的录音吗？',
              acceptedAnswer: { '@type': 'Answer', text: '耗时按采样数线性增长，页面会给出约X秒的预估：变速不变调约为每输出采样4倍窗叠加的计算量，倍速直变快一个数量级。全程在浏览器内存中完成解码、拉伸与编码，不发送任何网络请求。' }
            },
            {
              '@type': 'Question',
              name: '提示受保护或损坏的音频无法解码怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '浏览器无法解密带DRM的文件，也无法解析截断或扩展名与实际编码不符的文件。可先在本地播放器确认能否正常打开，或用格式互转工具转成WAV/MP3后再上传；单个文件请控制在100MB以内。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const SPEED_MIN = 0.5                     // 倍速下限
const SPEED_MAX = 3.0                     // 倍速上限
const GRAIN_SAMPLES = 2048                // 时间拉伸窗长（采样）
const HOP_SAMPLES = 512                   // 输出侧步进（采样），grain/hop = 4 倍重叠
const MAX_FILE_BYTES = 100 * 1024 * 1024  // 单文件 100MB 上限
const RIFF_HEADER_BYTES = 44              // 标准 WAV 头长度
const MAX_OUTPUT_BYTES = 1024 * 1024 * 1024 // 导出体积保护上限
const MAX_PEAK_BYTES = 1.5 * 1024 * 1024 * 1024 // 处理峰值内存保护上限
const GRAINS_PER_TICK = 200               // 每次让出主线程前处理的窗数
const OVERLAP_FACTOR = GRAIN_SAMPLES / HOP_SAMPLES // 叠加密度：每个输出采样被 4 个窗覆盖
const STRETCH_OPS_PER_SAMPLE = OVERLAP_FACTOR * 2  // 拉伸：每输出采样 OVERLAP 次「乘 + 加」
const RESAMPLE_OPS_PER_SAMPLE = 1         // 直变：每输出采样一次插值
const THROUGHPUT_SAMPLES_PER_MS = 20000   // 朴素 JS 吞吐标定 ≈ 2×10⁷ 采样/秒

// 倍速钳制：0.5–3.0，非法输入回落 1
function clampSpeedOf(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 1
  return Math.min(SPEED_MAX, Math.max(SPEED_MIN, n))
}

// 对称 Hann 窗：w[i] = 0.5×(1−cos(2πi/(n−1)))，两端点严格为 0，奇数长度时中心为 1
// 口径说明：端点取 0 保证窗口淡入淡出无突变、也便于单测断言；按 hop = grain/4 叠加时
// 4 个窗的权和实测 ≈ 2.0（中段波动 <0.02%），并非恰好等于 1，
// 因此叠加阶段同时累计窗权和并做归一化（WOLA），使输出增益严格为 1
function hannWindow(n) {
  const N = Math.max(0, Math.floor(Number(n) || 0))
  const w = new Float32Array(N)
  if (N < 2) return w // n=0 空窗；n=1 单点窗取端点值 0
  for (let i = 0; i < N; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)))
  }
  return w
}

// 朴素重叠窗时间拉伸计划：倍速 >1 时源侧步进变大（读得更远）→ 输出更短
// 源侧步进 step = clampSpeedOf(speedFactor) × hopSamples；共 ceil((N−grain)/step)+1 个窗
// 返回偏移表 [{ srcStart, dstStart, len }]，纯数据可直接单测；实际叠加在回调内完成
// 口径：|输出长度 − 原长 ÷ 倍速| ≤ grainSamples（推导见 stretchOutLengthOf 注释）
function stretchPlanOf(inputLengthSamples, speedFactor, grainSamples = GRAIN_SAMPLES, hopSamples = HOP_SAMPLES) {
  const N = Math.max(0, Math.floor(Number(inputLengthSamples) || 0))
  if (N === 0) return []
  const grain = Math.max(2, Math.floor(Number(grainSamples) || GRAIN_SAMPLES))
  const hop = Math.max(1, Math.floor(Number(hopSamples) || HOP_SAMPLES))
  if (N <= grain) return [{ srcStart: 0, dstStart: 0, len: N }] // 短于一个窗：整段单窗原样输出
  const v = clampSpeedOf(speedFactor)
  const step = Math.max(1, v * hop)
  const count = Math.max(1, Math.ceil((N - grain) / step) + 1)
  const plan = new Array(count)
  const lastStart = N - grain
  for (let k = 0; k < count; k++) {
    const src = Math.round(k * step)
    plan[k] = { srcStart: src > lastStart ? lastStart : src, dstStart: k * hop, len: grain }
  }
  return plan
}

// 拉伸后的输出采样数 = 末窗 dstStart + len
function stretchOutLengthOf(inputLengthSamples, speedFactor, grainSamples = GRAIN_SAMPLES, hopSamples = HOP_SAMPLES) {
  const plan = stretchPlanOf(inputLengthSamples, speedFactor, grainSamples, hopSamples)
  if (!plan.length) return 0
  const last = plan[plan.length - 1]
  return last.dstStart + last.len
}

// 倍速直变：按 rate 线性插值重读采样（等价于 playbackRate），长度 = floor(N/rate)
// 音高随倍速同步升降（>1 变尖、<1 变低沉），不做任何叠加平滑
function resampleLinearOf(input, rate) {
  const n = input && input.length ? input.length : 0
  if (!n) return new Float32Array(0)
  let r = Number(rate)
  if (!Number.isFinite(r) || r <= 0) r = 1
  const frames = Math.max(1, Math.floor(n / r))
  const out = new Float32Array(frames)
  for (let i = 0; i < frames; i++) {
    const pos = i * r
    const i0 = Math.floor(pos)
    const i1 = i0 + 1 < n ? i0 + 1 : n - 1
    const frac = pos - i0
    out[i] = input[i0] * (1 - frac) + input[i1] * frac
  }
  return out
}

// 输出采样数（两种模式统一口径，供时长/体积/耗时预估复用）
function outSamplesOf(inputLengthSamples, speedFactor, modeKey, grainSamples = GRAIN_SAMPLES, hopSamples = HOP_SAMPLES) {
  const N = Math.max(0, Math.floor(Number(inputLengthSamples) || 0))
  if (N === 0) return 0
  const v = clampSpeedOf(speedFactor)
  if (modeKey === 'resample') return Math.max(1, Math.floor(N / v))
  return stretchOutLengthOf(N, v, grainSamples, hopSamples)
}

// 新时长（秒）= 输出采样数 ÷ 采样率；口径：变速不变调为「原长 ÷ 倍速 ± grain/采样率」
function newDurationSecOf(inputLengthSamples, sampleRate, speedFactor, modeKey) {
  const rate = Math.max(1, Number(sampleRate) || 1)
  const out = outSamplesOf(inputLengthSamples, speedFactor, modeKey)
  return out / rate
}

// 预估处理耗时（毫秒）：按参与运算的采样数线性估算，仅用于给用户一个量级预期
function estProcessMsOf(outputSamples, channels, modeKey) {
  const n = Math.max(0, Math.floor(Number(outputSamples) || 0))
  const ch = Math.max(1, Math.floor(Number(channels) || 1))
  if (!n) return 0
  const per = modeKey === 'resample' ? RESAMPLE_OPS_PER_SAMPLE : STRETCH_OPS_PER_SAMPLE
  return Math.round((n * ch * per) / THROUGHPUT_SAMPLES_PER_MS)
}

// 预计导出体积（字节）：44 字节头 + PCM16 交织数据
function estOutBytesOf(outputSamples, channels) {
  const n = Math.max(0, Math.floor(Number(outputSamples) || 0))
  const ch = Math.max(1, Math.floor(Number(channels) || 1))
  return RIFF_HEADER_BYTES + n * ch * 2
}

// 处理峰值内存估算（字节）：时间拉伸需要窗权和 + 累加器（各输出采样 ×4）与目标缓冲（×ch×4），
// 再叠上已在内存中的源缓冲（×ch×4）；用于在处理前拦住会把标签页压垮的超长素材
function estPeakBytesOf(outputSamples, inputSamples, channels, modeKey) {
  const o = Math.max(0, Math.floor(Number(outputSamples) || 0))
  const i = Math.max(0, Math.floor(Number(inputSamples) || 0))
  const ch = Math.max(1, Math.floor(Number(channels) || 1))
  const scratch = modeKey === 'resample' ? o * 4 : o * 4 * 2
  return scratch + o * ch * 4 + i * ch * 4
}

// 浮点采样量化为 PCM16：先钳制到 [-1,1]，再按符号不对称缩放
function floatToInt16Of(v) {
  let s = Number(v)
  if (!Number.isFinite(s)) s = 0
  s = s > 1 ? 1 : (s < -1 ? -1 : s)
  return Math.round(s < 0 ? s * 0x8000 : s * 0x7FFF)
}

// 手写 WAV 编码器：44 字节标准 RIFF 头 + PCM16 小端交织
// samples 为「各声道采样数组组成的数组」（如 [左声道, 右声道]）
// 口径说明：为便于同步断言头部字段，这里返回 ArrayBuffer，Blob 封装在下载回调内完成
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
  const rate = Math.max(1, Number(sampleRate) || 1)
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)                  // fmt 块长度
  view.setUint16(20, 1, true)                   // PCM 格式
  view.setUint16(22, numCh, true)               // 声道数
  view.setUint32(24, rate, true)                // 采样率
  view.setUint32(28, rate * blockAlign, true)   // 字节率
  view.setUint16(32, blockAlign, true)          // 块对齐
  view.setUint16(34, 16, true)                  // 位深
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)            // 数据块大小
  let offset = RIFF_HEADER_BYTES
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numCh; c++) {
      view.setInt16(offset, floatToInt16Of(channels[c][i]), true)
      offset += 2
    }
  }
  return buffer
}

// 导出文件名：audio-x倍速.wav（去掉浮点尾零，如 1.50 → 1.5）
function outFileNameOf(speedFactor) {
  const v = Math.round(clampSpeedOf(speedFactor) * 100) / 100
  return 'audio-' + v + '倍速.wav'
}

// 秒 → "mm:ss"（分钟可超过 59，非法输入归零）
function fmtDurOf(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r
}

// 字节数 → 人类可读体积
function formatSizeOf(bytes) {
  const n = Math.max(0, Number(bytes) || 0)
  if (n < 1024) return Math.round(n) + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB'
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

// ---------- 模式定义 ----------
const modeOptions = [
  { id: 'stretch', name: '变速不变调（时间拉伸）', hint: '重叠窗改写节奏，音高保持不变，处理较慢' },
  { id: 'resample', name: '倍速直变（重采样）', hint: '按倍速重读采样，秒出结果，音高会变' }
]
const speedPresets = [0.5, 0.75, 1.25, 1.5, 2]

// ---------- 页面状态 ----------
const fileInputRef = ref(null)
const fileMeta = ref(null)      // { name, size, duration, sampleRate, channels, lengthSamples }
const resultMeta = ref(null)    // { fileName, duration, sourceDuration, sampleRate, channels, speedText, actualMs }
const mode = ref('stretch')
const speed = ref(1)
const decoding = ref(false)
const decodeError = ref('')
const isProcessing = ref(false)
const processError = ref('')
const progress = ref(0)
const progressText = ref('')
const actualMs = ref(null)
const isPlaying = ref(false)
const playKind = ref('')        // 'processed' | 'source' | ''
const seoContentVisible = ref(true)

// 非响应式大对象（AudioBuffer / Blob 不进响应式系统）
let decodedBuffer = null  // 原始解码 AudioBuffer
let processedBuffer = null // 变速后的 AudioBuffer
let processedBlob = null   // 导出用 WAV Blob
let playCtx = null         // 试听 AudioContext（首次试听时创建）
let playSource = null

// ---------- 派生状态 ----------
const speedNum = computed(() => clampSpeedOf(speed.value))
const speedText = computed(() => speedNum.value.toFixed(2).replace(/0$/, '').replace(/\.$/, '.0') + '×')
const modeName = computed(() => {
  const hit = modeOptions.find((o) => o.id === mode.value)
  return hit ? hit.name : '变速不变调（时间拉伸）'
})
const inSamples = computed(() => (fileMeta.value ? fileMeta.value.lengthSamples : 0))
const outLen = computed(() => outSamplesOf(inSamples.value, speedNum.value, mode.value))
const newDuration = computed(() => {
  if (!fileMeta.value || !outLen.value) return 0
  return newDurationSecOf(inSamples.value, fileMeta.value.sampleRate, speedNum.value, mode.value)
})
const estBytes = computed(() => (fileMeta.value ? estOutBytesOf(outLen.value, fileMeta.value.channels) : 0))
const estMs = computed(() => estProcessMsOf(outLen.value, fileMeta.value ? fileMeta.value.channels : 1, mode.value))
const estCostText = computed(() => '约 ' + Math.max(0.1, estMs.value / 1000).toFixed(1) + ' 秒')
const specText = computed(() => {
  if (!fileMeta.value) return '（待选择文件）'
  const f = fileMeta.value
  return `（当前 ${f.sampleRate} Hz · ${f.channels === 1 ? '单声道' : f.channels + ' 声道'}）`
})
const canProcess = computed(() => !!fileMeta.value && !decoding.value && !isProcessing.value)
const canPlay = computed(() => !!resultMeta.value && !isProcessing.value)
const playSourceLabel = computed(() => {
  if (!isPlaying.value) return '空闲'
  return playKind.value === 'source' ? '原音频 playbackRate' : '处理结果 1.0×'
})

const statusText = computed(() => {
  if (decoding.value) return '正在浏览器本地解码音频，解码成功后会自动给出时长与耗时预估'
  if (decodeError.value) return '音频解码失败：请换用浏览器可解析的格式（mp3 / wav / m4a / ogg）后重试'
  if (isProcessing.value) return progressText.value || '正在本地变速处理...'
  if (processError.value) return '处理未完成：请降低倍速或缩短音频后重试'
  if (resultMeta.value) return '处理完成：可先试听结果，确认后导出 WAV；调整倍速后需重新处理'
  if (!fileMeta.value) return '尚未选择文件：先上传音频，再选模式与倍速，处理前会给出新时长与耗时预估'
  return `已就绪：${modeName.value} · ${speedText.value}，新时长约 ${fmtDurOf(newDuration.value)}，${estCostText.value}内完成`
})

// ---------- 文件选择与解码（用户回调内创建 AudioContext，SSR 安全） ----------
function triggerPick() {
  if (fileInputRef.value) fileInputRef.value.click()
}

async function onFileChange(e) {
  const input = e.target
  const file = input && input.files && input.files.length ? input.files[0] : null
  if (input) input.value = '' // 允许重复选择同一文件
  if (!file) return

  stopPlayback()
  clearResult()
  decodeError.value = ''

  if (file.size > MAX_FILE_BYTES) {
    decodeError.value = '文件超过 100MB 上限，无法在浏览器内存中安全解码，请先裁剪或压缩'
    return
  }

  decoding.value = true
  let ctx = null
  try {
    ctx = new AudioContext()
  } catch (err) {
    decoding.value = false
    decodeError.value = '当前浏览器不支持 WebAudio，无法解码音频'
    return
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buf = await ctx.decodeAudioData(arrayBuffer)
    decodedBuffer = buf
    fileMeta.value = {
      name: file.name,
      size: file.size,
      duration: buf.duration,
      sampleRate: buf.sampleRate,
      channels: buf.numberOfChannels,
      lengthSamples: buf.length
    }
  } catch (err) {
    decodedBuffer = null
    fileMeta.value = null
    decodeError.value = '受保护或损坏的音频无法解码'
  } finally {
    if (ctx) {
      try { await ctx.close() } catch (err) {}
    }
    decoding.value = false
  }
}

// ---------- 变速处理（回调内按偏移表叠加，分块让出主线程刷新进度） ----------
function clearResult() {
  stopPlayback() // 参数一变，旧结果的试听就失去意义（幂等，重复调用无副作用）
  processedBuffer = null
  processedBlob = null
  resultMeta.value = null
  processError.value = ''
  progress.value = 0
  progressText.value = ''
  actualMs.value = null
}

function setMode(id) {
  if (mode.value === id) return
  mode.value = id
  clearResult()
}

function setSpeed(v) {
  speed.value = clampSpeedOf(v)
  clearResult()
}

// 快捷档位是否命中当前倍速（浮点比较给容差）
function isPresetActive(p) {
  return Math.abs(speedNum.value - Number(p)) < 0.001
}

const yieldTick = () => new Promise((resolve) => setTimeout(resolve, 0))

async function processAudio() {
  if (!canProcess.value || !decodedBuffer) return
  stopPlayback()
  clearResult()

  const v = clampSpeedOf(speed.value)
  const currentMode = mode.value
  const src = decodedBuffer
  const numCh = src.numberOfChannels
  const rate = src.sampleRate
  const inLen = src.length
  const outLenNow = outSamplesOf(inLen, v, currentMode)

  const bytes = estOutBytesOf(outLenNow, numCh)
  if (bytes > MAX_OUTPUT_BYTES) {
    processError.value = `预计输出 ${formatSizeOf(bytes)}，超出 ${formatSizeOf(MAX_OUTPUT_BYTES)} 保护上限：请提高倍速、改用倍速直变或先裁剪音频`
    return
  }
  const peak = estPeakBytesOf(outLenNow, inLen, numCh, currentMode)
  if (peak > MAX_PEAK_BYTES) {
    processError.value = `素材过长：处理约需 ${formatSizeOf(peak)} 内存，超出 ${formatSizeOf(MAX_PEAK_BYTES)} 上限，请先裁剪音频或改用倍速直变（实时试听不占内存）`
    return
  }
  if (outLenNow < 1) {
    processError.value = '音频过短，无法按当前倍速生成输出'
    return
  }

  isProcessing.value = true
  progress.value = 0
  progressText.value = currentMode === 'stretch' ? '正在按重叠窗时间拉伸（音高不变）...' : '正在按倍速重采样（音高会变）...'
  const startedAt = Date.now()

  try {
    const offline = new OfflineAudioContext(numCh, outLenNow, rate)
    const target = offline.createBuffer(numCh, outLenNow, rate)

    if (currentMode === 'resample') {
      for (let c = 0; c < numCh; c++) {
        target.copyToChannel(resampleLinearOf(src.getChannelData(c), v), c)
        progress.value = (c + 1) / numCh
        await yieldTick()
      }
    } else {
      const plan = stretchPlanOf(inLen, v, GRAIN_SAMPLES, HOP_SAMPLES)
      const win = hannWindow(GRAIN_SAMPLES)
      const totalWork = Math.max(1, plan.length * numCh)

      // 第一遍：累计窗权和（与声道无关），供叠加后归一化，消除非精确 COLA 带来的音量起伏
      const norm = new Float32Array(outLenNow)
      for (let p = 0; p < plan.length; p++) {
        const seg = plan[p]
        const d0 = seg.dstStart
        for (let i = 0; i < seg.len; i++) norm[d0 + i] += win[i]
      }

      // 第二遍：逐声道按偏移表叠加加窗后的源窗，再除以窗权和写回（累加器跨声道复用以省内存）
      const acc = new Float32Array(outLenNow)
      for (let c = 0; c < numCh; c++) {
        const chan = src.getChannelData(c)
        acc.fill(0)
        for (let p = 0; p < plan.length; p += GRAINS_PER_TICK) {
          const end = Math.min(plan.length, p + GRAINS_PER_TICK)
          for (let q = p; q < end; q++) {
            const seg = plan[q]
            const d0 = seg.dstStart
            const s0 = seg.srcStart
            for (let i = 0; i < seg.len; i++) acc[d0 + i] += chan[s0 + i] * win[i]
          }
          progress.value = (c * plan.length + end) / totalWork
          await yieldTick()
        }
        for (let i = 0; i < outLenNow; i++) {
          acc[i] = norm[i] > 1e-6 ? acc[i] / norm[i] : 0
        }
        target.copyToChannel(acc, c)
      }
    }

    progress.value = 1
    processedBuffer = target
    const ms = Date.now() - startedAt
    actualMs.value = ms
    resultMeta.value = {
      fileName: outFileNameOf(v),
      duration: target.duration,
      sourceDuration: src.duration,
      sampleRate: rate,
      channels: numCh,
      speedText: speedText.value,
      actualMs: ms
    }
    processError.value = ''
  } catch (err) {
    processedBuffer = null
    resultMeta.value = null
    processError.value = '变速失败：' + (err && err.message ? err.message : '未知错误，请降低倍速或缩短音频后重试')
  } finally {
    isProcessing.value = false
    progressText.value = ''
  }
}

// ---------- 导出 WAV（encodeWavOf → Blob 下载） ----------
function downloadResult() {
  if (!processedBuffer) return
  try {
    if (!processedBlob) {
      const chans = []
      for (let c = 0; c < processedBuffer.numberOfChannels; c++) {
        chans.push(processedBuffer.getChannelData(c))
      }
      const wav = encodeWavOf(chans, processedBuffer.sampleRate)
      processedBlob = new Blob([wav], { type: 'audio/wav' })
    }
    const url = URL.createObjectURL(processedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = resultMeta.value ? resultMeta.value.fileName : 'audio-speed.wav'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (err) {
    processError.value = '导出失败：' + (err && err.message ? err.message : '浏览器无法写入音频文件')
  }
}

// ---------- 试听（AudioBufferSourceNode，可停） ----------
function ensurePlayCtx() {
  if (!playCtx) playCtx = new AudioContext()
  if (playCtx.state === 'suspended' && playCtx.resume) playCtx.resume()
  return playCtx
}

function startSource(buffer, useRate) {
  const ctx = ensurePlayCtx()
  const srcNode = ctx.createBufferSource()
  srcNode.buffer = buffer
  if (useRate) srcNode.playbackRate.value = clampSpeedOf(speed.value)
  srcNode.connect(ctx.destination)
  srcNode.onended = () => {
    if (playSource === srcNode) {
      playSource = null
      isPlaying.value = false
      playKind.value = ''
    }
  }
  srcNode.start()
  playSource = srcNode
  isPlaying.value = true
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
  playKind.value = ''
}

function togglePlay() {
  if (isPlaying.value) {
    stopPlayback()
    return
  }
  if (!processedBuffer) return
  try {
    // 处理结果已把新节奏写进采样，按 1.0× 播放即为最终听感
    startSource(processedBuffer, false)
    playKind.value = 'processed'
  } catch (err) {
    isPlaying.value = false
    processError.value = '试听失败：' + (err && err.message ? err.message : '浏览器音频播放不可用')
  }
}

// 实时试听：走 playbackRate 直接按倍速读原音频，免处理但音高会变（与播放器倍速同理）
function previewOriginal() {
  if (isPlaying.value && playKind.value === 'source') {
    stopPlayback()
    return
  }
  if (!decodedBuffer) return
  stopPlayback()
  try {
    startSource(decodedBuffer, true)
    playKind.value = 'source'
  } catch (err) {
    isPlaying.value = false
    processError.value = '试听失败：' + (err && err.message ? err.message : '浏览器音频播放不可用')
  }
}

function resetAll() {
  stopPlayback()
  decodedBuffer = null
  fileMeta.value = null
  decodeError.value = ''
  mode.value = 'stretch'
  speed.value = 1
  clearResult()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('audio-speed-changer')
})

onBeforeUnmount(() => {
  stopPlayback()
  if (playCtx) {
    try { playCtx.close() } catch (err) {}
    playCtx = null
  }
  decodedBuffer = null
  processedBuffer = null
  processedBlob = null
})
</script>
