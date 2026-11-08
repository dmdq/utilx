<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Blend class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">音频混音</h1>
          <p class="text-sm text-muted-foreground mt-1">两轨音频混音各自调音量与淡入淡出，离线渲染导出 WAV，本地处理</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        上传两轨音频（典型场景：人声 + 配乐），每轨独立调节音量（0–150%）、静音与淡入淡出（0–10 秒），
        再叠加总轨音量与主输出淡入淡出。波形按同一时间轴上下对齐预览，短轨尾部自动静音留白。
        点按渲染时使用 OfflineAudioContext 离线合成（非实时播放，不受系统声音干扰），增益自动化精确到采样级，
        结果以手写 RIFF 编码导出 PCM16 WAV。支持 mp3 / m4a / wav / ogg / flac 等浏览器可解码格式。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：解码、混音渲染与 WAV 编码全部在本机内存中完成，不会上传到任何服务器。
      </div>
      <div class="mt-3 inline-flex items-start gap-2 px-3 py-2 bg-muted/60 border border-border rounded-lg text-sm text-muted-foreground max-w-3xl">
        <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <span>配乐建议 -12dB（约 25%）起步、人声 0dB（100%）；给两轨或主输出加 1–3 秒淡入淡出，拼接与收尾更自然。</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左：波形预览（时长对齐） -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <Waves class="w-5 h-5 mr-2 text-primary" /> 波形预览（时长对齐）
          </h2>
          <span v-if="mixDuration > 0" class="text-xs text-muted-foreground font-mono">输出 {{ formatTime(mixDuration) }}</span>
        </div>

        <div v-if="!trackAInfo && !trackBInfo" class="py-12 text-center text-sm text-muted-foreground">
          <Blend class="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          上传音频后，这里上下并排显示两轨波形与混合结果波形（同一时间轴，短轨尾部留白）
        </div>

        <template v-else>
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium text-foreground flex items-center">
                <Music class="w-3.5 h-3.5 mr-1 text-blue-500" /> 轨道 A（人声）
              </span>
              <span class="text-xs text-muted-foreground font-mono">{{ trackAInfo ? formatTime(trackAInfo.duration) : '空轨' }}</span>
            </div>
            <canvas ref="waveCanvasA" class="w-full h-16 bg-muted rounded-lg block"></canvas>
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium text-foreground flex items-center">
                <Music class="w-3.5 h-3.5 mr-1 text-violet-500" /> 轨道 B（配乐）
              </span>
              <span class="text-xs text-muted-foreground font-mono">{{ trackBInfo ? formatTime(trackBInfo.duration) : '空轨' }}</span>
            </div>
            <canvas ref="waveCanvasB" class="w-full h-16 bg-muted rounded-lg block"></canvas>
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium text-foreground flex items-center">
                <AudioLines class="w-3.5 h-3.5 mr-1 text-emerald-600" /> 混合结果（{{ mixWaveRendered ? '已渲染' : '实时预估' }}）
              </span>
              <span class="text-xs text-muted-foreground font-mono">{{ formatTime(mixDuration) }}</span>
            </div>
            <canvas ref="waveCanvasMix" class="w-full h-20 bg-muted rounded-lg block border border-primary/30"></canvas>
          </div>
          <p v-if="alignmentText" class="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {{ alignmentText }}
          </p>
        </template>
      </div>

      <!-- 右：轨道参数与导出 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Sliders class="w-5 h-5 mr-2 text-primary" /> 轨道参数与导出
        </h2>

        <input ref="fileInputA" type="file" accept="audio/*" class="hidden" @change="onTrackFileChange($event, 'A')" />
        <input ref="fileInputB" type="file" accept="audio/*" class="hidden" @change="onTrackFileChange($event, 'B')" />

        <!-- 轨道 A -->
        <div class="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-semibold text-foreground flex items-center">
              <Music class="w-4 h-4 mr-1.5 text-blue-500" /> 轨道 A · 人声
            </span>
            <div class="flex items-center gap-1.5">
              <button
                v-if="trackAInfo"
                @click="mutedA = !mutedA"
                :aria-pressed="mutedA"
                :title="mutedA ? '取消静音' : '静音该轨'"
                class="p-1.5 rounded-md border transition-colors"
                :class="mutedA ? 'bg-red-500/10 border-red-500/40 text-red-500' : 'bg-card border-border text-muted-foreground hover:text-primary'"
              >
                <VolumeX v-if="mutedA" class="w-4 h-4" />
                <Volume2 v-else class="w-4 h-4" />
              </button>
              <button @click="pickTrack('A')" class="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                {{ trackAInfo ? '更换' : '选择文件' }}
              </button>
              <button
                v-if="trackAInfo"
                @click="clearTrack('A')"
                title="移除该轨"
                class="p-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-red-500 hover:border-red-500/40 transition-colors"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
          <p v-if="trackAInfo" class="text-xs text-muted-foreground truncate" :title="trackAInfo.name">
            {{ trackAInfo.name }} · {{ formatSize(trackAInfo.size) }} · {{ formatTime(trackAInfo.duration) }} · {{ trackAInfo.rate }}Hz
          </p>
          <p v-else class="text-xs text-muted-foreground">上传人声/主音轨，建议音量 0dB（100%）</p>

          <template v-if="trackAInfo">
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-foreground">音量</span>
                <span class="text-xs font-mono text-primary">{{ volumeA }}%<span class="text-muted-foreground">（{{ percentToDbText(volumeA) }} dB）</span></span>
              </div>
              <input v-model.number="volumeA" type="range" min="0" max="150" step="1" class="w-full accent-primary" />
              <div class="flex flex-wrap gap-1.5 mt-1.5">
                <button
                  v-for="p in volumePresets"
                  :key="p.value"
                  @click="volumeA = p.value"
                  class="px-2 py-0.5 text-xs rounded-md border transition-colors"
                  :class="volumeA === p.value ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'"
                >{{ p.label }}</button>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium text-foreground">淡入</span>
                  <span class="text-xs font-mono text-primary">{{ fadeInA > 0 ? fadeInA.toFixed(1) + ' s' : '关' }}</span>
                </div>
                <input v-model.number="fadeInA" type="range" min="0" max="10" step="0.1" class="w-full accent-primary" />
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium text-foreground">淡出</span>
                  <span class="text-xs font-mono text-primary">{{ fadeOutA > 0 ? fadeOutA.toFixed(1) + ' s' : '关' }}</span>
                </div>
                <input v-model.number="fadeOutA" type="range" min="0" max="10" step="0.1" class="w-full accent-primary" />
              </div>
            </div>
          </template>
          <p v-if="trackALoading" class="text-xs text-muted-foreground">正在本地解码...</p>
          <p v-if="trackAError" class="text-xs text-red-500">{{ trackAError }}</p>
        </div>

        <!-- 轨道 B -->
        <div class="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-semibold text-foreground flex items-center">
              <Music class="w-4 h-4 mr-1.5 text-violet-500" /> 轨道 B · 配乐
            </span>
            <div class="flex items-center gap-1.5">
              <button
                v-if="trackBInfo"
                @click="mutedB = !mutedB"
                :aria-pressed="mutedB"
                :title="mutedB ? '取消静音' : '静音该轨'"
                class="p-1.5 rounded-md border transition-colors"
                :class="mutedB ? 'bg-red-500/10 border-red-500/40 text-red-500' : 'bg-card border-border text-muted-foreground hover:text-primary'"
              >
                <VolumeX v-if="mutedB" class="w-4 h-4" />
                <Volume2 v-else class="w-4 h-4" />
              </button>
              <button @click="pickTrack('B')" class="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                {{ trackBInfo ? '更换' : '选择文件' }}
              </button>
              <button
                v-if="trackBInfo"
                @click="clearTrack('B')"
                title="移除该轨"
                class="p-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-red-500 hover:border-red-500/40 transition-colors"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
          <p v-if="trackBInfo" class="text-xs text-muted-foreground truncate" :title="trackBInfo.name">
            {{ trackBInfo.name }} · {{ formatSize(trackBInfo.size) }} · {{ formatTime(trackBInfo.duration) }} · {{ trackBInfo.rate }}Hz
          </p>
          <p v-else class="text-xs text-muted-foreground">上传配乐/伴奏轨，建议 -12dB（约 25%）起步</p>

          <template v-if="trackBInfo">
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-foreground">音量</span>
                <span class="text-xs font-mono text-primary">{{ volumeB }}%<span class="text-muted-foreground">（{{ percentToDbText(volumeB) }} dB）</span></span>
              </div>
              <input v-model.number="volumeB" type="range" min="0" max="150" step="1" class="w-full accent-primary" />
              <div class="flex flex-wrap gap-1.5 mt-1.5">
                <button
                  v-for="p in volumePresets"
                  :key="p.value"
                  @click="volumeB = p.value"
                  class="px-2 py-0.5 text-xs rounded-md border transition-colors"
                  :class="volumeB === p.value ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'"
                >{{ p.label }}</button>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium text-foreground">淡入</span>
                  <span class="text-xs font-mono text-primary">{{ fadeInB > 0 ? fadeInB.toFixed(1) + ' s' : '关' }}</span>
                </div>
                <input v-model.number="fadeInB" type="range" min="0" max="10" step="0.1" class="w-full accent-primary" />
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium text-foreground">淡出</span>
                  <span class="text-xs font-mono text-primary">{{ fadeOutB > 0 ? fadeOutB.toFixed(1) + ' s' : '关' }}</span>
                </div>
                <input v-model.number="fadeOutB" type="range" min="0" max="10" step="0.1" class="w-full accent-primary" />
              </div>
            </div>
          </template>
          <p v-if="trackBLoading" class="text-xs text-muted-foreground">正在本地解码...</p>
          <p v-if="trackBError" class="text-xs text-red-500">{{ trackBError }}</p>
        </div>

        <!-- 总轨（主输出） -->
        <div class="rounded-lg border border-border p-4 space-y-3">
          <span class="text-sm font-semibold text-foreground flex items-center">
            <AudioLines class="w-4 h-4 mr-1.5 text-primary" /> 总轨（主输出）
          </span>
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium text-foreground">总轨音量</span>
              <span class="text-xs font-mono text-primary">{{ masterVol }}%<span class="text-muted-foreground">（{{ percentToDbText(masterVol) }} dB）</span></span>
            </div>
            <input v-model.number="masterVol" type="range" min="0" max="150" step="1" class="w-full accent-primary" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-foreground">主输出淡入</span>
                <span class="text-xs font-mono text-primary">{{ masterFadeIn > 0 ? masterFadeIn.toFixed(1) + ' s' : '关' }}</span>
              </div>
              <input v-model.number="masterFadeIn" type="range" min="0" max="10" step="0.1" class="w-full accent-primary" />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-foreground">主输出淡出</span>
                <span class="text-xs font-mono text-primary">{{ masterFadeOut > 0 ? masterFadeOut.toFixed(1) + ' s' : '关' }}</span>
              </div>
              <input v-model.number="masterFadeOut" type="range" min="0" max="10" step="0.1" class="w-full accent-primary" />
            </div>
          </div>
          <p class="text-xs text-muted-foreground">主输出淡入淡出作用在混合结果的整体首尾，与各轨自己的淡入淡出叠加生效。</p>
        </div>

        <!-- 统计卡 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="bg-muted/50 border border-border rounded-lg p-3 text-center">
            <div class="text-xs text-muted-foreground">输出时长</div>
            <div class="text-base font-semibold text-foreground mt-1 font-mono">{{ mixDuration > 0 ? formatTime(mixDuration) : '—' }}</div>
          </div>
          <div class="bg-muted/50 border border-border rounded-lg p-3 text-center">
            <div class="text-xs text-muted-foreground">预计峰值</div>
            <div class="text-base font-semibold mt-1 font-mono" :class="peakClass">{{ mixDuration > 0 ? (predictedPeak * 100).toFixed(0) + '%' : '—' }}</div>
          </div>
          <div class="bg-muted/50 border border-border rounded-lg p-3 text-center">
            <div class="text-xs text-muted-foreground">预计体积</div>
            <div class="text-base font-semibold text-foreground mt-1 font-mono">{{ mixDuration > 0 ? formatSize(estimatedBytes) : '—' }}</div>
          </div>
          <div class="bg-muted/50 border border-border rounded-lg p-3 text-center">
            <div class="text-xs text-muted-foreground">输出规格</div>
            <div class="text-sm font-semibold text-foreground mt-1.5 font-mono">{{ outputRate }} Hz</div>
            <div class="text-[10px] text-muted-foreground">{{ outputChannels === 1 ? '单声道 · PCM16' : '立体声 · PCM16' }}</div>
          </div>
        </div>

        <p v-if="clipWarning" class="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
          <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {{ clipWarning }}
        </p>

        <button
          @click="renderMix"
          :disabled="!canRender || isRendering"
          class="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Download class="w-4 h-4" /> {{ isRendering ? '正在离线渲染...' : '渲染混音并下载 WAV' }}
        </button>
        <p v-if="renderError" class="text-sm text-red-500">{{ renderError }}</p>
        <p v-else-if="renderStatus" class="text-xs" :class="renderOk ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'">{{ renderStatus }}</p>

        <div v-if="resultUrl" class="border-t border-border pt-4">
          <div class="text-xs text-muted-foreground mb-1">混音结果试听（audio-mix.wav）</div>
          <audio :src="resultUrl" controls class="w-full h-9"></audio>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
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
          在线音频混音工具：两轨合成一轨
        </h2>
        <p class="text-muted-foreground mb-6">
          音频混音（混音合成）是把两条音轨叠加成一条：最常见的场景是给口播、播客或视频配音铺一条背景音乐——
          人声在 0dB 保持清晰，配乐压到 -12dB 左右垫在底下，再各加一点淡入淡出，一条"像被剪辑过"的成品音轨就出来了。
          本工具在浏览器里完成全部计算：文件先经 WebAudio 本地解码为 PCM 采样，渲染时通过 OfflineAudioContext
          离线合成（比实时播放更快、且不受系统其它声音干扰），最后用手写的 RIFF 封装导出 PCM16 WAV，全程无服务器参与。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">三步把人声和配乐合成一个文件</h3>
        <ol class="list-decimal list-inside space-y-1.5 text-muted-foreground mb-6">
          <li>分别给轨道 A、轨道 B 选择音频文件，两轨在本地解码后按同一时间轴上下对齐显示波形，短轨尾部自动留白。</li>
          <li>逐轨调音量（0–150%，25% 约等于 -12dB）、静音与淡入淡出（0–10 秒），需要时再调总轨音量与主输出首尾淡入淡出；混合结果波形实时预估。</li>
          <li>点击「渲染混音并下载 WAV」，浏览器离线渲染出成品，可直接试听，同时下载 audio-mix.wav。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mb-2">配乐音量怎么调：从 -12dB 开始</h3>
        <p class="text-muted-foreground mb-6">
          经验值：人声（主音轨）保持 0dB（100%），配乐从 -12dB（约 25%）起步，再按听感微调——
          配乐的作用是垫气氛而不是抢注意力，一旦听清旋律就偏响了。页面顶部的"预计峰值"能帮您避免叠完爆音：
          两轨都拉到 150% 时和很可能超过满幅，导出 WAV 时会被硬性削波产生爆音，此时应调低某轨或总轨音量。
          淡入淡出让拼接更自然：配乐建议 1–2 秒淡入、2–3 秒淡出，人声轨一般不需要。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">两轨长度不一样怎么办</h3>
        <p class="text-muted-foreground mb-6">
          输出时长以较长的一轨为准：短轨播完后尾部自动保持静音留白，波形上能直观看到。
          若希望配乐铺满整段人声，请先在站内音频裁剪工具里把配乐截到合适长度再上传；
          每轨的淡入淡出以"该轨自己的时长"为基准计算，因此短轨会在它自己的结尾淡出，不会拖到输出末尾。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">为什么导出的是 WAV</h3>
        <p class="text-muted-foreground mb-6">
          与站内其它音频工具一致，混音结果导出 PCM16 WAV：渲染输出是 32bit 浮点采样，写 WAV 时量化到 16bit
          （理论动态范围约 96dB），除此之外没有任何额外的编码损失。需要 mp3 等小体积格式时，
          可再用站内音频格式互转工具二次转换（会引入一次有损压缩）。采样率与声道跟随已上传的音轨
          （采样率不同会由 WebAudio 自动重采样，时长不变、不变调），源文件全程只读，不会被修改。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">怎么把配乐和人声合成一个文件？</h3>
            <p class="text-muted-foreground mt-1">
              轨道 A 传人声、轨道 B 传配乐，配乐音量先放到 25%（约 -12dB），人声保持 100%；
              给配乐加 1–2 秒淡入与 2–3 秒淡出，点「渲染混音并下载 WAV」即可得到成品，可先试听再交付。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">配乐音量调多少合适？</h3>
            <p class="text-muted-foreground mt-1">
              从 -12dB（约 25%）起步：配乐是垫底而非主角，一旦能听清旋律就偏响了。口播类建议压在 -18 ~ -12dB 之间，
              音乐类内容可以适当抬高。参考"预计峰值"指标避免叠加后超过满幅。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">淡入淡出一般设几秒？</h3>
            <p class="text-muted-foreground mt-1">
              配乐 1–2 秒淡入、2–3 秒淡出最常用；用作视频 BGM 收尾时可拉到 3–5 秒。
              淡入淡出区间若与轨长重叠，工具会自动退化为三角包络，不会出现增益跳变。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">两轨长度不一样，以哪个为准？</h3>
            <p class="text-muted-foreground mt-1">
              以较长的一轨为准，短轨尾部自动静音留白，波形与"输出时长"都会如实显示。
              想让配乐铺满全程，请先把配乐裁剪到与人声等长再上传。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">混音会爆音（削波）吗？怎么避免？</h3>
            <p class="text-muted-foreground mt-1">
              多轨叠加可能超过满幅。页面的"预计峰值"实时估算混合信号峰值：超过 100% 时导出 WAV 会被硬性削波产生爆音，
              请调低某轨或总轨音量；95%–100% 属于安全余量偏小的区间，也建议留些余量。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持什么格式？会上传吗？</h3>
            <p class="text-muted-foreground mt-1">
              输入支持 mp3 / m4a / wav / ogg / flac 等浏览器可解码格式；输出为与音轨同采样率的 PCM16 WAV。
              全部计算在浏览器本地完成，文件不会上传到任何服务器；建议单次混音不超过 30 分钟。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'audio-mixer'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  Blend, Music, AudioLines, Waves, Sliders, ShieldCheck, Upload, Download,
  Info, AlertTriangle, ChevronUp, ChevronDown, Volume2, VolumeX, Trash2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '音频混音 - 两轨音量淡入淡出在线合成导出 WAV',
  description: '在线音频混音工具，两轨音频（人声+配乐）各自调节音量、静音与淡入淡出，支持总轨音量与主输出淡入淡出，OfflineAudioContext 离线渲染导出 WAV，波形对齐预览短轨自动留白，全程浏览器本地处理不上传',
  keywords: '音频混音,两段音频合并,配音合成,背景音乐混音,音频叠加,淡入淡出',
  author: '有条工具',
  ogTitle: '音频混音 - 两轨音量淡入淡出在线合成 WAV | 有条工具',
  ogDescription: '两轨音频各自调音量与淡入淡出，离线渲染导出 WAV，波形对齐预览，本地处理不上传',
  ogUrl: 'https://www.util.cn/tools/audio-mixer',
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
          name: '音频混音',
          url: 'https://www.util.cn/tools/audio-mixer',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['两轨独立音量 0-150% 与静音', '每轨淡入淡出 0-10 秒', '总轨音量与主输出淡入淡出', 'OfflineAudioContext 离线渲染', '波形同时长轴对齐预览短轨留白', '预计峰值削波预警', '手写 RIFF 头导出 PCM16 WAV', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: '音频混音', item: 'https://www.util.cn/tools/audio-mixer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '怎么把配乐和人声合成一个文件？',
              acceptedAnswer: { '@type': 'Answer', text: '轨道 A 传人声、轨道 B 传配乐，配乐音量先放到 25%（约 -12dB），人声保持 100%，给配乐加淡入淡出后点渲染混音并下载 WAV，可先试听再交付。' }
            },
            {
              '@type': 'Question',
              name: '配乐音量调多少合适？',
              acceptedAnswer: { '@type': 'Answer', text: '从 -12dB（约 25%）起步，配乐是垫底而非主角，能听清旋律就偏响了；口播类建议 -18~-12dB，参考页面预计峰值避免削波。' }
            },
            {
              '@type': 'Question',
              name: '两轨长度不一样，以哪个为准？',
              acceptedAnswer: { '@type': 'Answer', text: '输出时长以较长的一轨为准，短轨尾部自动静音留白；每轨淡入淡出按该轨自身时长计算，短轨会在自己的结尾淡出。想让配乐铺满全程请先裁剪到等长。' }
            },
            {
              '@type': 'Question',
              name: '混音会爆音（削波）吗？怎么避免？',
              acceptedAnswer: { '@type': 'Answer', text: '多轨叠加可能超过满幅。页面的预计峰值实时估算混合峰值，超过 100% 导出会被硬性削波产生爆音，应调低某轨或总轨音量，95%-100% 也建议留余量。' }
            },
            {
              '@type': 'Question',
              name: '支持什么格式？会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '输入支持 mp3/m4a/wav/ogg/flac 等浏览器可解码格式，输出为 PCM16 WAV；全部计算在浏览器本地完成，文件不上传，建议单次混音不超过 30 分钟。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'audio-mixer')

// ==== PURE-FNS-START ====
// （纯函数区：仅依赖参数与标准内建，node 可直接抽取单测；不触碰任何浏览器 API 与响应式状态）

// a) 淡入淡出线性包络：t 时刻的增益系数（0..1）。
// 淡入段 [0, fadeIn] 线性上升 0→1；淡出段 [duration - fadeOut, duration] 线性下降 1→0；中间恒 1；
// fadeIn / fadeOut 为 0 表示该段不淡入/不淡出（恒 1）。两段重叠时按乘积包络处理，自然过渡且不越界。
function computeFadeGain(t, opts) {
  const o = opts || {}
  const fadeIn = Math.max(0, Number(o.fadeIn) || 0)
  const fadeOut = Math.max(0, Number(o.fadeOut) || 0)
  const duration = Math.max(0, Number(o.duration) || 0)
  const time = Number(t)
  if (!Number.isFinite(time)) return 0
  if (fadeIn <= 0 && fadeOut <= 0) return 1
  let g = 1
  if (fadeIn > 0 && time < fadeIn) g *= time / fadeIn
  if (fadeOut > 0 && time > duration - fadeOut) g *= Math.max(0, (duration - time) / fadeOut)
  return g < 0 ? 0 : (g > 1 ? 1 : g)
}

// b) 两轨采样加权混合：a×gainA + b×gainB，结果钳制到 [-1, 1]（非有限输入按 0 处理）
function mixSamples(a, b, gainA, gainB) {
  const x = Number.isFinite(a) ? a : 0
  const y = Number.isFinite(b) ? b : 0
  const ga = Number.isFinite(gainA) ? gainA : 0
  const gb = Number.isFinite(gainB) ? gainB : 0
  const v = x * ga + y * gb
  return v > 1 ? 1 : (v < -1 ? -1 : v)
}

// c) 离线渲染长度：输出缓冲取两轨采样数较长者（短轨尾部留白为静音），非法输入按 0
function renderLength(lenA, lenB) {
  const x = Number.isFinite(lenA) ? Math.max(0, lenA) : 0
  const y = Number.isFinite(lenB) ? Math.max(0, lenB) : 0
  return Math.max(x, y)
}

// 百分比音量（0-150）→ dBFS 文本（相对满幅 100% = 0dB；0 视为 -∞）
function percentToDbText(pct) {
  const v = Number(pct)
  if (!Number.isFinite(v) || v <= 0) return '-∞'
  return (20 * Math.log10(v / 100)).toFixed(1)
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

// 自写 WAV 编码（PCM16 小端），channels: Float32Array[]，返回 Uint8Array（44 字节 RIFF 头 + 交错采样）
function encodeWavFromChannels(channels, sampleRate) {
  const numCh = Math.max(1, channels.length)
  const numFrames = channels[0] ? channels[0].length : 0
  const blockAlign = numCh * 2
  const dataSize = numFrames * blockAlign
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numCh, true)
  view.setUint32(24, Math.max(1, Number(sampleRate) || 1), true)
  view.setUint32(28, Math.max(1, Number(sampleRate) || 1) * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)
  let offset = 44
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = channels[c][i]
      s = s > 1 ? 1 : (s < -1 ? -1 : s)
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
      offset += 2
    }
  }
  return new Uint8Array(buffer)
}
// ==== PURE-FNS-END ====

// ---------- 页面状态 ----------
const PREVIEW_BUCKETS = 600
const MAX_OUTPUT_SEC = 30 * 60

const fileInputA = ref(null)
const fileInputB = ref(null)
const waveCanvasA = ref(null)
const waveCanvasB = ref(null)
const waveCanvasMix = ref(null)

const trackAInfo = ref(null) // { name, size, ext, duration, rate, channels }
const trackBInfo = ref(null)
const trackALoading = ref(false)
const trackBLoading = ref(false)
const trackAError = ref('')
const trackBError = ref('')

const volumeA = ref(100)
const mutedA = ref(false)
const fadeInA = ref(0)
const fadeOutA = ref(0)
const volumeB = ref(25)
const mutedB = ref(false)
const fadeInB = ref(0)
const fadeOutB = ref(0)
const masterVol = ref(100)
const masterFadeIn = ref(0)
const masterFadeOut = ref(0)

const predictedPeak = ref(0)
const isRendering = ref(false)
const renderStatus = ref('')
const renderOk = ref(false)
const renderError = ref('')
const resultUrl = ref('')
const mixWaveRendered = ref(false)
const seoContentVisible = ref(true)

const volumePresets = [
  { label: '150%', value: 150 },
  { label: '0dB', value: 100 },
  { label: '-6dB', value: 50 },
  { label: '-12dB', value: 25 }
]

// 非响应式大对象（AudioBuffer / Float32Array 视图 / 波形峰值缓存）
let bufferA = null
let bufferB = null
let dataA = null
let dataB = null
let peaksA = null
let peaksB = null
let renderedPeaks = null
let debounceTimer = null

// ---------- 派生状态 ----------
const durAof = () => (trackAInfo.value ? trackAInfo.value.duration : 0)
const durBof = () => (trackBInfo.value ? trackBInfo.value.duration : 0)
const rateAof = () => (trackAInfo.value ? trackAInfo.value.rate : 0)
const rateBof = () => (trackBInfo.value ? trackBInfo.value.rate : 0)

const outputRate = computed(() => {
  const r = trackAInfo.value ? trackAInfo.value.rate : (trackBInfo.value ? trackBInfo.value.rate : 44100)
  return r >= 8000 && r <= 96000 ? r : 44100
})
const outputChannels = computed(() => {
  const stereo = (trackAInfo.value && trackAInfo.value.channels > 1) || (trackBInfo.value && trackBInfo.value.channels > 1)
  return stereo ? 2 : 1
})
const mixDuration = computed(() => {
  const rate = outputRate.value
  const len = renderLength(Math.round(durAof() * rate), Math.round(durBof() * rate))
  return len / rate
})
const estimatedBytes = computed(() => {
  const len = Math.round(mixDuration.value * outputRate.value)
  return 44 + len * outputChannels.value * 2
})
const canRender = computed(() => {
  return (trackAInfo.value || trackBInfo.value) && mixDuration.value > 0 && !isRendering.value && !trackALoading.value && !trackBLoading.value
})
const peakClass = computed(() => {
  if (predictedPeak.value > 1.001) return 'text-red-500'
  if (predictedPeak.value >= 0.95) return 'text-amber-600 dark:text-amber-400'
  return 'text-green-600 dark:text-green-400'
})
const clipWarning = computed(() => {
  if (predictedPeak.value > 1.001) {
    return `预计峰值 ${Math.round(predictedPeak.value * 100)}%，超过满幅：导出 WAV 时会被硬性削波产生爆音，建议调低某轨或总轨音量。`
  }
  return ''
})
const alignmentText = computed(() => {
  const a = durAof()
  const b = durBof()
  if (a > 0 && b > 0) {
    const diff = Math.abs(a - b)
    if (diff < 0.01) return '两轨时长基本一致，逐点叠加混音。'
    const shortName = a < b ? 'A' : 'B'
    return `输出时长以较长轨为准（${formatTime(Math.max(a, b))}）：轨道 ${shortName} 短 ${diff.toFixed(1)} 秒，其尾部自动保持静音留白。`
  }
  if (a > 0 || b > 0) return `当前仅轨道 ${a > 0 ? 'A' : 'B'} 上传，输出即该轨内容（可再上传另一轨叠加）。`
  return ''
})

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
const pickTrack = (which) => {
  const el = which === 'A' ? fileInputA.value : fileInputB.value
  if (el) el.click()
}
const formatTime = (t) => {
  const s = Math.max(0, Number(t) || 0)
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}:${r < 10 ? '0' : ''}${r.toFixed(1)}`
}
const formatSize = (n) => {
  if (!n) return '0 B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB'
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

onMounted(() => {
  if (tool) addRecentTool(tool.id)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
})

// ---------- 文件解码（用户手势回调内创建 AudioContext，SSR 安全） ----------
async function onTrackFileChange(e, which) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  const setLoading = which === 'A' ? (v) => { trackALoading.value = v } : (v) => { trackBLoading.value = v }
  const setError = which === 'A' ? (v) => { trackAError.value = v } : (v) => { trackBError.value = v }
  setLoading(true)
  setError('')
  try {
    const arrayBuffer = await file.arrayBuffer()
    const ctx = new AudioContext()
    const buf = await ctx.decodeAudioData(arrayBuffer)
    await ctx.close()
    const dot = file.name.lastIndexOf('.')
    const ext = dot >= 0 ? file.name.slice(dot + 1).toUpperCase() : '未知'
    const info = { name: file.name, size: file.size, ext, duration: buf.duration, rate: buf.sampleRate, channels: buf.numberOfChannels }
    if (which === 'A') {
      bufferA = buf
      dataA = buf.getChannelData(0)
      peaksA = peakArrayOf(dataA, PREVIEW_BUCKETS)
      trackAInfo.value = info
    } else {
      bufferB = buf
      dataB = buf.getChannelData(0)
      peaksB = peakArrayOf(dataB, PREVIEW_BUCKETS)
      trackBInfo.value = info
    }
    invalidateResult()
    await nextTick()
    refreshPreview()
  } catch (err) {
    setError('解码失败：当前浏览器无法解析该音频文件，请尝试 mp3 / wav / m4a 格式')
  } finally {
    setLoading(false)
  }
}

function clearTrack(which) {
  if (which === 'A') {
    bufferA = null; dataA = null; peaksA = null
    trackAInfo.value = null
    trackAError.value = ''
  } else {
    bufferB = null; dataB = null; peaksB = null
    trackBInfo.value = null
    trackBError.value = ''
  }
  invalidateResult()
  refreshPreview()
}

// ---------- 参数联动（150ms 防抖刷新预览；参数变化后旧渲染结果失效） ----------
function invalidateResult() {
  if (resultUrl.value) { URL.revokeObjectURL(resultUrl.value); resultUrl.value = '' }
  mixWaveRendered.value = false
  renderedPeaks = null
  renderStatus.value = ''
  renderOk.value = false
}

watch([volumeA, mutedA, fadeInA, fadeOutA, volumeB, mutedB, fadeInB, fadeOutB, masterVol, masterFadeIn, masterFadeOut], () => {
  invalidateResult()
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    refreshPreview()
  }, 150)
})

function refreshPreview() {
  drawAllWaves()
  predictedPeak.value = estimateMixPeak()
}

function handleResize() {
  if (trackAInfo.value || trackBInfo.value) drawAllWaves()
}

// ---------- 增益与预览计算（复用 PURE 纯函数） ----------
function trackGainAt(which, t) {
  const muted = which === 'A' ? mutedA.value : mutedB.value
  const vol = (which === 'A' ? volumeA.value : volumeB.value) / 100
  const dur = which === 'A' ? durAof() : durBof()
  const fi = which === 'A' ? fadeInA.value : fadeInB.value
  const fo = which === 'A' ? fadeOutA.value : fadeOutB.value
  return (muted ? 0 : vol) * computeFadeGain(t, { fadeIn: fi, fadeOut: fo, duration: dur })
}

function masterGainAt(t) {
  return (masterVol.value / 100) * computeFadeGain(t, { fadeIn: masterFadeIn.value, fadeOut: masterFadeOut.value, duration: mixDuration.value })
}

function trackPeakAt(t, peaks, trackDur) {
  if (!peaks || !trackDur || t >= trackDur) return 0
  const idx = Math.min(peaks.length - 1, Math.floor((t / trackDur) * peaks.length))
  return peaks[idx] || 0
}

function sampleValueAt(data, rate, dur, t) {
  if (!data || !rate || t >= dur) return 0
  const idx = Math.floor(t * rate)
  if (idx < 0 || idx >= data.length) return 0
  const v = data[idx]
  return Number.isFinite(v) ? v : 0
}

// 预估混合波形某时刻的值（peak 桶级别，用于实时预估波形）
function predictedMixValueAt(t) {
  const a = trackPeakAt(t, peaksA, durAof())
  const b = trackPeakAt(t, peaksB, durBof())
  const m = masterGainAt(t)
  return mixSamples(a, b, trackGainAt('A', t) * m, trackGainAt('B', t) * m)
}

// 削波预警：按原始采样步进扫描，估算未钳制的混合峰值（超过 1 即导出会削波）
function estimateMixPeak() {
  const mixDur = mixDuration.value
  if (!mixDur) return 0
  const steps = 20000
  let peak = 0
  for (let k = 0; k < steps; k++) {
    const t = ((k + 0.5) / steps) * mixDur
    const a = sampleValueAt(dataA, rateAof(), durAof(), t)
    const b = sampleValueAt(dataB, rateBof(), durBof(), t)
    const m = masterGainAt(t)
    const raw = Math.abs((a * trackGainAt('A', t) + b * trackGainAt('B', t)) * m)
    if (raw > peak) peak = raw
  }
  return peak
}

// ---------- 波形绘制 ----------
function prepCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth || (canvas.parentElement ? canvas.parentElement.clientWidth : 600)
  const h = canvas.clientHeight || 64
  canvas.width = Math.max(1, Math.round(w * dpr))
  canvas.height = Math.max(1, Math.round(h * dpr))
  const g = canvas.getContext('2d')
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.clearRect(0, 0, w, h)
  return { g, w, h }
}

function drawMidline(g, w, h) {
  const mid = h / 2
  g.fillStyle = 'rgba(128, 128, 128, 0.35)'
  g.fillRect(0, mid - 0.5, w, 1)
}

// 单轨波形：按时间轴映射到输出长度上，短轨尾部自然留白
function drawTrackWave(canvas, peaks, trackDur, color) {
  if (!canvas) return
  const { g, w, h } = prepCanvas(canvas)
  drawMidline(g, w, h)
  const mixDur = mixDuration.value
  if (!peaks || !trackDur || !mixDur) return
  const n = peaks.length
  const mid = h / 2
  const scale = h / 2 - 4
  const barW = Math.max(1, ((trackDur / n) / mixDur) * w * 0.7)
  g.fillStyle = color
  for (let i = 0; i < n; i++) {
    const t = ((i + 0.5) / n) * trackDur
    const x = (t / mixDur) * w
    const bh = Math.max(1, peaks[i] * scale)
    g.fillRect(x, mid - bh / 2, barW, bh)
  }
}

// 混合结果（实时预估）：逐桶套用各轨增益/淡入淡出与主输出增益后钳制显示
function drawPredictedMixWave() {
  const canvas = waveCanvasMix.value
  if (!canvas) return
  const { g, w, h } = prepCanvas(canvas)
  drawMidline(g, w, h)
  const mixDur = mixDuration.value
  if (!mixDur) return
  const n = PREVIEW_BUCKETS
  const mid = h / 2
  const scale = h / 2 - 6
  const barW = Math.max(1, (w / n) * 0.7)
  g.fillStyle = '#059669'
  for (let b = 0; b < n; b++) {
    const t = ((b + 0.5) / n) * mixDur
    const v = Math.min(1, Math.abs(predictedMixValueAt(t)))
    const bh = Math.max(1, v * scale)
    g.fillRect((b / n) * w, mid - bh / 2, barW, bh)
  }
}

// 混合结果（已渲染）：直接画离线渲染输出的峰值
function drawRenderedMixWave() {
  const canvas = waveCanvasMix.value
  if (!canvas) return
  const { g, w, h } = prepCanvas(canvas)
  drawMidline(g, w, h)
  if (!renderedPeaks) return
  const n = renderedPeaks.length
  const mid = h / 2
  const scale = h / 2 - 6
  const barW = Math.max(1, (w / n) * 0.7)
  g.fillStyle = '#059669'
  for (let i = 0; i < n; i++) {
    const bh = Math.max(1, renderedPeaks[i] * scale)
    g.fillRect((i / n) * w, mid - bh / 2, barW, bh)
  }
}

function drawAllWaves() {
  drawTrackWave(waveCanvasA.value, peaksA, durAof(), 'rgba(37, 99, 235, 0.65)')
  drawTrackWave(waveCanvasB.value, peaksB, durBof(), 'rgba(139, 92, 246, 0.65)')
  if (mixWaveRendered.value) drawRenderedMixWave()
  else drawPredictedMixWave()
}

// ---------- 离线渲染与导出（用户手势回调内创建 OfflineAudioContext，SSR 安全） ----------
// 把淡入淡出参数写成 WebAudio 增益自动化（setValueAtTime / linearRampToValueAtTime）；
// 淡入淡出区间重叠时退化为三角包络（单峰位于 fi/(fi+fo) 比例处），避免增益跳变
function scheduleGainAutomation(gainParam, vol, muted, fadeIn, fadeOut, duration) {
  const v = muted ? 0 : Math.max(0, Math.min(1.5, Number(vol) || 0))
  const d = Math.max(0.001, Number(duration) || 0.001)
  const fi = Math.max(0, Number(fadeIn) || 0)
  const fo = Math.max(0, Number(fadeOut) || 0)
  if (v <= 0 || (fi <= 0 && fo <= 0)) {
    gainParam.setValueAtTime(v, 0)
    return
  }
  if (fi + fo < d - 1e-6) {
    gainParam.setValueAtTime(fi > 0 ? 0 : v, 0)
    if (fi > 0) gainParam.linearRampToValueAtTime(v, fi)
    if (fo > 0) {
      gainParam.setValueAtTime(v, Math.max(fi, d - fo))
      gainParam.linearRampToValueAtTime(0, d)
    }
    return
  }
  if (fi <= 0) {
    gainParam.setValueAtTime(v, 0)
    gainParam.linearRampToValueAtTime(0, d)
  } else if (fo <= 0) {
    gainParam.setValueAtTime(0, 0)
    gainParam.linearRampToValueAtTime(v, d)
  } else {
    const p = (d * fi) / (fi + fo)
    gainParam.setValueAtTime(0, 0)
    gainParam.linearRampToValueAtTime(v, p)
    gainParam.linearRampToValueAtTime(0, d)
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function renderMix() {
  if (!canRender.value || isRendering.value) return
  isRendering.value = true
  renderError.value = ''
  renderStatus.value = ''
  try {
    if (typeof OfflineAudioContext === 'undefined') throw new Error('当前浏览器不支持 WebAudio 离线渲染')
    const rate = outputRate.value
    const ch = outputChannels.value
    const lenA = Math.round(durAof() * rate)
    const lenB = Math.round(durBof() * rate)
    const len = renderLength(lenA, lenB)
    if (len <= 0) throw new Error('没有可用的音轨数据，请先上传音频')
    if (len / rate > MAX_OUTPUT_SEC) throw new Error('输出超过 30 分钟上限，请先缩短素材')

    const offline = new OfflineAudioContext(ch, len, rate)
    const master = offline.createGain()
    scheduleGainAutomation(master.gain, masterVol.value / 100, false, masterFadeIn.value, masterFadeOut.value, len / rate)
    master.connect(offline.destination)

    const tracks = []
    if (bufferA) tracks.push({ buffer: bufferA, vol: volumeA.value / 100, muted: mutedA.value, fi: fadeInA.value, fo: fadeOutA.value, dur: durAof() })
    if (bufferB) tracks.push({ buffer: bufferB, vol: volumeB.value / 100, muted: mutedB.value, fi: fadeInB.value, fo: fadeOutB.value, dur: durBof() })
    for (const t of tracks) {
      const src = offline.createBufferSource()
      src.buffer = t.buffer
      const g = offline.createGain()
      scheduleGainAutomation(g.gain, t.vol, t.muted, t.fi, t.fo, t.dur)
      src.connect(g)
      g.connect(master)
      src.start(0)
    }

    renderStatus.value = '正在离线渲染...'
    const rendered = await offline.startRendering()
    const chans = []
    for (let c = 0; c < ch; c++) chans.push(rendered.getChannelData(c))
    const bytes = encodeWavFromChannels(chans, rate)
    const blob = new Blob([bytes], { type: 'audio/wav' })
    if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
    resultUrl.value = URL.createObjectURL(blob)
    renderedPeaks = peakArrayOf(rendered.getChannelData(0), PREVIEW_BUCKETS)
    mixWaveRendered.value = true
    drawAllWaves()
    triggerDownload(blob, 'audio-mix.wav')
    renderOk.value = true
    renderStatus.value = `混音完成（${formatSize(blob.size)}），已开始下载 audio-mix.wav，文件未离开浏览器`
  } catch (err) {
    renderOk.value = false
    renderError.value = '渲染失败：' + (err && err.message ? err.message : '未知错误，请重试或更换素材')
  } finally {
    isRendering.value = false
  }
}
</script>
