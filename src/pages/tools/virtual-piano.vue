<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Piano class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">虚拟钢琴</h1>
          <p class="text-sm text-muted-foreground mt-1">网页弹钢琴：25 键琴键点击 + 电脑键盘弹奏，三种合成音色、录音回放，零依赖本地发声</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线虚拟钢琴工具：提供 C4–C6 共 25 个琴键（15 白键 + 10 黑键），可直接点击 / 触摸弹奏，也支持电脑键盘映射（A-L 白键、W-U 黑键，标准 DAW 惯例）。
        音色由 WebAudio 实时合成，提供钢琴感、电钢琴、管风琴三种音色与音量、±2 八度移位调节；内置录制回放功能，可把弹奏的音符序列录下来循环播放对照练习。
        全部声音在浏览器本地合成，不上传任何数据、零第三方依赖。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：设置面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Music class="w-5 h-5 mr-2 text-primary" /> 演奏设置
        </h2>

        <!-- 当前按下音名 -->
        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">当前按下</p>
          <p class="text-2xl font-bold text-primary min-h-[32px] leading-8 break-all">{{ activeNamesText }}</p>
          <p class="text-xs text-muted-foreground mt-1">鼠标点按或键盘按键都会在这里实时显示音名</p>
        </div>

        <!-- 音色 -->
        <div class="space-y-2">
          <label for="timbre-select" class="text-sm font-medium text-foreground">音色（WebAudio 合成）</label>
          <select
            id="timbre-select"
            v-model="timbre"
            class="w-full h-10 px-2.5 bg-background border border-border border-border rounded-lg text-sm text-foreground"
          >
            <option v-for="t in TIMBRES" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>

        <!-- 音量 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label for="volume-range" class="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Volume2 class="w-4 h-4 text-primary" /> 音量
            </label>
            <span class="text-xs text-muted-foreground font-mono">{{ volume }}%</span>
          </div>
          <input
            id="volume-range"
            v-model.number="volume"
            type="range"
            min="0"
            max="100"
            step="1"
            class="w-full accent-primary"
          />
        </div>

        <!-- 八度移位 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-foreground">八度移位（电脑键盘）</span>
            <span class="text-xs text-muted-foreground font-mono">{{ shiftText }}</span>
          </div>
          <div class="grid grid-cols-5 gap-1.5">
            <button
              v-for="opt in OCTAVE_OPTIONS"
              :key="opt"
              type="button"
              @click="octaveShift = opt"
              class="h-9 rounded-lg border text-sm font-semibold transition"
              :class="octaveShift === opt ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'"
              :aria-pressed="octaveShift === opt"
            >
              {{ opt > 0 ? `+${opt}` : opt }}
            </button>
          </div>
          <p class="text-xs text-muted-foreground">
            只平移电脑键盘映射（每档 12 个半音），屏显琴键不变：A 键当前对应 {{ midiNameOf(keymap.KeyA) }}。
          </p>
        </div>

        <!-- 录制与回放 -->
        <div class="space-y-2 pt-1 border-t border-border">
          <p class="text-sm font-medium text-foreground pt-3">录制与回放</p>
          <div class="bg-muted/40 border border-border rounded-lg p-3 flex items-center justify-between gap-2">
            <span class="flex items-center gap-2 min-w-0">
              <i
                class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                :class="isRecording ? 'bg-red-500 animate-pulse' : (isPlayingRec ? 'bg-green-500' : 'bg-zinc-400')"
              ></i>
              <span class="text-sm font-medium text-foreground whitespace-nowrap">{{ recStatusText }}</span>
            </span>
            <span class="text-xs text-muted-foreground font-mono whitespace-nowrap">{{ recCountText }}</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="toggleRecord"
              :disabled="isPlayingRec"
              class="px-3 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="isRecording ? 'bg-muted hover:bg-muted/80 border border-border text-foreground' : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600'"
            >
              <template v-if="isRecording">
                <Square class="w-4 h-4" /> 停止录制
              </template>
              <template v-else>
                <i class="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"></i> 录制
              </template>
            </button>
            <button
              type="button"
              @click="togglePlayback"
              :disabled="isRecording || recordNotes.length === 0"
              class="px-3 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="isPlayingRec ? 'bg-muted hover:bg-muted/80 border border-border text-foreground' : 'bg-primary text-primary-foreground hover:opacity-90'"
            >
              <template v-if="isPlayingRec">
                <Square class="w-4 h-4" /> 停止回放
              </template>
              <template v-else>
                <Play class="w-4 h-4" /> 回放录音
              </template>
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="loopPlayback = !loopPlayback"
              class="px-3 py-2.5 rounded-lg border text-sm font-medium transition flex items-center justify-center gap-1.5"
              :class="loopPlayback ? 'bg-green-500/10 border-green-500/30 text-green-600' : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'"
              :aria-pressed="loopPlayback"
            >
              <CheckCircle class="w-4 h-4" /> 循环回放：{{ loopPlayback ? '开' : '关' }}
            </button>
            <button
              type="button"
              @click="clearRecording"
              :disabled="recordNotes.length === 0 || isRecording"
              class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw class="w-4 h-4" /> 清空录音
            </button>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            点「录制」后弹奏的每个音符会按 {音名, 相对时刻, 时长} 记录（上限 {{ MAX_RECORD_NOTES }} 个音符，数据仅存本页内存，刷新即失），
            停止后可回放对照；开启循环回放可当伴奏轨反复播放。
          </p>
        </div>

        <!-- 重置 -->
        <button
          type="button"
          @click="resetAll"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-2"
        >
          <RefreshCw class="w-4 h-4" /> 重置全部设置
        </button>

        <!-- 错误内联提示 -->
        <p v-if="audioError" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ audioError }}</span>
        </p>
      </div>

      <!-- 右：琴键区（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Piano class="w-5 h-5 mr-2 text-primary" /> 琴键（C4 – C6 · 25 键）
          </h2>
          <span class="px-2.5 py-1 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground whitespace-nowrap">
            按下：{{ activeNamesText }}
          </span>
        </div>

        <!-- 琴键盘：白键 flex 平铺，黑键按百分比绝对定位叠加（窄屏横向滚动） -->
        <div class="overflow-x-auto rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
          <div class="relative h-56 sm:h-64 min-w-[620px]">
            <!-- 白键层 -->
            <div class="absolute inset-0 flex">
              <button
                v-for="k in whiteKeys"
                :key="k.midi"
                type="button"
                class="relative h-full flex-1 rounded-b-md border border-b-4 border-b-zinc-300 flex flex-col items-center justify-end gap-1 pb-2 transition-colors duration-75 touch-none select-none"
                :class="whiteKeyClassOf(k.midi)"
                @pointerdown.prevent="pressKey(k.midi, 'mouse')"
                @pointerup="releaseKey(k.midi, 'mouse')"
                @pointerleave="releaseKey(k.midi, 'mouse')"
                @contextmenu.prevent
              >
                <span
                  v-if="keyLetters[k.midi]"
                  class="px-1.5 py-0.5 rounded bg-zinc-200/80 text-[10px] font-bold text-foreground leading-none"
                >{{ keyLetters[k.midi] }}</span>
                <span class="text-[9px] sm:text-[10px] font-medium leading-none">{{ midiNameOf(k.midi) }}</span>
              </button>
            </div>
            <!-- 黑键层（offsetPct / widthPct 由纯函数 keyLayoutOf 计算） -->
            <button
              v-for="k in blackKeys"
              :key="k.midi"
              type="button"
              class="absolute top-0 z-10 h-[60%] rounded-b-md border border-b-4 border-b-zinc-950 flex items-end justify-center pb-1.5 transition-colors duration-75 touch-none select-none"
              :class="blackKeyClassOf(k.midi)"
              :style="{ left: k.offsetPct + '%', width: k.widthPct + '%' }"
              @pointerdown.prevent="pressKey(k.midi, 'mouse')"
              @pointerup="releaseKey(k.midi, 'mouse')"
              @pointerleave="releaseKey(k.midi, 'mouse')"
              @contextmenu.prevent
            >
              <span v-if="keyLetters[k.midi]" class="text-[9px] font-bold leading-none">{{ keyLetters[k.midi] }}</span>
            </button>
          </div>
        </div>

        <!-- 静态提示条 -->
        <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>电脑键盘映射为 A-L 白键、W-U 黑键（标准 DAW 惯例）；触摸设备直接点按。音色为合成音，非采样钢琴。</span>
        </p>

        <p class="text-xs text-muted-foreground leading-relaxed">
          提示：琴键按下时高亮（鼠标与键盘同步）；管风琴音色按住持续发声、松手约 0.3 秒收音，钢琴感与电钢琴音色会自动衰减。
          若在音量条 / 音色框等控件上打字无效，属正常防冲突设计，点击页面空白处恢复弹奏。
        </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>虚拟钢琴是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          虚拟钢琴是一款完全运行在浏览器里的在线钢琴工具：页面渲染 C4–C6 共 25 个琴键（一个半八度多一点，覆盖两个完整八度 C4-B5 加一个高音 C6），
          既可以用鼠标 / 触摸直接点按，也可以用电脑键盘弹奏——主键位行 A S D F G H J K L 对应一排白键，上排 W E T Y U O P 对应黑键，
          这是 Ableton Live、FL Studio 等 DAW 通用的键盘演奏映射惯例。声音不依赖任何音频文件，而是用 WebAudio 的振荡器（Oscillator）实时叠加基频与泛音、
          配合增益包络（Gain envelope）合成，提供钢琴感、电钢琴、管风琴三种音色，并可调音量与 ±2 八度移位；还支持录制弹奏序列并回放（可循环）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">钢琴键黑白怎么分布？（一个八度 7 白 + 5 黑）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一个八度包含 12 个半音，在键盘上分成 7 个白键（C D E F G A B）和 5 个黑键（C# D# F# G# A#）。
          黑键不是均匀分布的：E-F、B-C 之间是半音直接相邻，所以这两处没有黑键；其余白键相邻处（C-D、D-D... 等全音关系）各有一个黑键。
          因此黑白键以「2 黑 + 3 黑」为一组循环（C# D# 靠在一起，F# G# A# 靠在一起）。本工具的白键等宽平铺（flex 布局），
          黑键宽度约为白键的 62%，按「中心对齐相邻白键接缝」的规则用百分比绝对定位叠加在白键上方，位置由纯函数计算、可单测验证。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">键盘字母怎么对应音？（A=C4 惯例的来源）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          把电脑键盘当钢琴弹的映射并非随手安排：字母主行 A-L 的 9 个键恰好能放下 C4 到 D5 的 9 个白键（A=C4、S=D4、D=E4、F=F4、G=G4、H=A4、J=B4、K=C5、L=D5），
          而黑键正好落在键盘上排错开的 W E T Y U（C#4 D#4 F#4 G#4 A#4）以及 O P（C#5 D#5）上——上下排字母的物理交错关系与钢琴黑白键的交错结构完全同构，
          手型不需要别扭地扭转。这套映射在 Ableton Live、FL Studio 等音乐软件中已成事实标准，本工具沿用，学会一次到处通用。
          「八度移位」按钮可把整套键盘映射整体上移 / 下移（每档 12 个半音），用于弹奏屏显琴键之外的更高或更低音区。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">合成音和真钢琴有什么差别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          真钢琴的声音是琴槌击弦后琴弦与音板共鸣的产物：泛音列复杂且随击键力度、延音踏板动态变化，还带有击弦瞬态噪声。
          本工具用 OscillatorNode 程序合成来「示意」钢琴质感：钢琴感音色 = 三角波基频叠加 2、3 次泛音 + 约 1.2 秒指数衰减包络 + 轻微起振；
          电钢琴 = 正弦波叠加一个八度泛音、约 0.8 秒衰减；管风琴 = 正弦加少量方波、按住持续发声、松手约 0.3 秒收音。
          合成音干净稳定、零加载零依赖，但没有真实击弦噪声、琴体共鸣与力度层次，适合旋律创作、练耳、简谱验证与娱乐弹奏；
          需要演奏级音色时，建议使用采样音源或真钢琴。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">录音回放有什么用？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          点「录制」后，你弹的每个音符会按 {音名, 相对时刻 ms, 时长 ms} 记录成序列（上限 500 个音符），停止后可原样回放。典型用途：
          ① 弹一句短旋律后回放对照，客观检查自己的节奏与错音——耳朵听「正在弹的」和听「回放的」判断标准更冷静；
          ② 开启循环回放，把一段和弦进行变成循环伴奏轨，在上面练习即兴配旋律；
          ③ 随手记录突然出现的旋律灵感，防止弹完就忘。录音数据只存在当前页面内存里，刷新或关闭页面即清空，不会上传。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">八度是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          八度（octave）指相邻两个同名音之间的音程，例如 C4 到 C5：高音的频率恰好是低音的 2 倍（C4≈261.6Hz，C5≈523.3Hz），
          听起来「是同一个音、只是更高」。一个八度均分为 12 个半音，钢琴上就是 7 白 + 5 黑一组。
          本工具的音名采用科学音高记法：中央 C 记作 C4（MIDI 编号 60，标准音 A4=440Hz），每升高一个半音 MIDI 编号 +1，频率按 2^(n/12) 倍增。
          「八度移位 +1」表示电脑键盘整体上移一个八度（每个键 +12 半音），可以够到屏显琴键之外的高音区。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">钢琴键黑白是怎么分布的？</h3>
            <p class="text-sm text-muted-foreground mt-1">一个八度 12 个半音 = 7 个白键（C D E F G A B）+ 5 个黑键（C# D# F# G# A#）；E-F、B-C 之间是半音相邻所以没有黑键，黑键呈「2+3」分组循环。本工具黑键宽度约为白键 62%，中心对齐相邻白键接缝定位。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">电脑键盘字母怎么对应钢琴音？</h3>
            <p class="text-sm text-muted-foreground mt-1">沿用 DAW 惯例：A S D F G H J K L 对应 C4 到 D5 的白键，W E T Y U O P 对应黑键；上下排字母的物理交错与钢琴黑白键结构同构。八度移位按钮可把映射整体上下平移 12 个半音每档。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">这里的钢琴声是真钢琴吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不是，是 WebAudio 程序合成音：振荡器叠加基频与泛音再加指数衰减包络来模拟钢琴质感，干净稳定但没有真实击弦噪声、共鸣与力度层次；适合练耳、旋律创作与娱乐，演奏级需求建议用采样音源。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">录音回放能用来做什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">弹一句后回放对照检查节奏与错音；开启循环回放把和弦进行变成伴奏轨练即兴；也可随手记录旋律灵感。录音上限 500 个音符，仅存在本页内存中，刷新即清空、不上传。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">弹琴时打字 / 滚动会不会误触？</h3>
            <p class="text-sm text-muted-foreground mt-1">只有 A-L、W-U、O、P 这 15 个字母键被映射为琴键且已过滤输入框聚焦与按键重复事件；按住 Ctrl/Alt/Win 等修饰键的组合快捷键不会被劫持，音量条与音色下拉框聚焦时键盘弹奏自动暂停防误触。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'virtual-piano'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Piano, Play, Square, Volume2, CheckCircle,
  ChevronUp, ChevronDown, Info, RefreshCw, Music
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '虚拟钢琴 - 在线钢琴键盘弹奏工具（电脑键盘弹琴）',
  description: '免费在线虚拟钢琴：网页直接弹钢琴，25 键 C4-C6 点击与电脑键盘弹奏（A-L 白键、W-U 黑键 DAW 惯例），钢琴感/电钢琴/管风琴三种 WebAudio 合成音色，音量与八度移位调节，录制回放循环练习，纯浏览器本地运行零上传',
  keywords: '虚拟钢琴,在线钢琴,网页弹钢琴,键盘弹琴,piano online',
  author: '有条工具',
  ogTitle: '虚拟钢琴 - 在线钢琴键盘弹奏工具 | 有条工具',
  ogDescription: '25 键网页钢琴，键盘 A-L/W-U 弹奏、三种合成音色、录音回放循环练习，本地合成零上传。',
  ogUrl: 'https://www.util.cn/tools/virtual-piano',
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
          name: '虚拟钢琴',
          url: 'https://www.util.cn/tools/virtual-piano',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['25 键琴键（C4-C6）点击 / 触摸弹奏', '电脑键盘映射（A-L 白键、W-U 黑键，DAW 惯例）', '钢琴感 / 电钢琴 / 管风琴三种合成音色', '音量与 ±2 八度移位调节', '录制回放与循环播放（上限 500 音符）', '按下音名实时显示与按键高亮', 'WebAudio 本地实时合成零上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '虚拟钢琴', item: 'https://www.util.cn/tools/virtual-piano/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '钢琴键黑白是怎么分布的？',
              acceptedAnswer: { '@type': 'Answer', text: '一个八度 12 个半音 = 7 个白键（C D E F G A B）+ 5 个黑键（C# D# F# G# A#）；E-F、B-C 之间是半音相邻所以没有黑键，黑键呈 2+3 分组循环。本工具黑键宽度约为白键 62%，中心对齐相邻白键接缝定位。' }
            },
            {
              '@type': 'Question',
              name: '电脑键盘字母怎么对应钢琴音？',
              acceptedAnswer: { '@type': 'Answer', text: '沿用 DAW 惯例：A S D F G H J K L 对应 C4 到 D5 的白键，W E T Y U O P 对应黑键；上下排字母的物理交错与钢琴黑白键结构同构。八度移位按钮可把映射整体上下平移，每档 12 个半音。' }
            },
            {
              '@type': 'Question',
              name: '这里的钢琴声是真钢琴吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是，是 WebAudio 程序合成音：振荡器叠加基频与泛音再加指数衰减包络来模拟钢琴质感，干净稳定但没有真实击弦噪声、共鸣与力度层次；适合练耳、旋律创作与娱乐，演奏级需求建议用采样音源。' }
            },
            {
              '@type': 'Question',
              name: '录音回放能用来做什么？',
              acceptedAnswer: { '@type': 'Answer', text: '弹一句后回放对照检查节奏与错音；开启循环回放把和弦进行变成伴奏轨练即兴；也可随手记录旋律灵感。录音上限 500 个音符，仅存在本页内存中，刷新即清空、不上传。' }
            },
            {
              '@type': 'Question',
              name: '弹琴时打字或滚动会不会误触？',
              acceptedAnswer: { '@type': 'Answer', text: '只有 A-L、W-U、O、P 这 15 个字母键被映射为琴键，且已过滤输入框聚焦与按键重复事件；按住 Ctrl/Alt/Win 等修饰键的组合快捷键不会被劫持，音量条与音色下拉框聚焦时键盘弹奏自动暂停防误触。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MIDI_MIN = 21          // MIDI 音号下限（A0）
const MIDI_MAX = 108         // MIDI 音号上限（C8）
const MAX_RECORD_NOTES = 500 // 录音上限（音符条数）
const OCTAVE_SHIFT_MIN = -2  // 八度移位下限
const OCTAVE_SHIFT_MAX = 2   // 八度移位上限
const BLACK_WIDTH_RATIO = 0.62         // 黑键宽度 = 白键宽度 × 该比例
const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11] // 一个八度内白键的半音位置（C D E F G A B）
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// 基准键盘映射（octaveShift=0）：主键位行 A-L 白键、上排 W/U 黑键（标准 DAW 惯例），
// 值 = MIDI 音号，C4=60 起连续覆盖 60-75 半音
const BASE_KEYMAP = {
  KeyA: 60, KeyW: 61, KeyS: 62, KeyE: 63, KeyD: 64,
  KeyF: 65, KeyT: 66, KeyG: 67, KeyY: 68, KeyH: 69,
  KeyU: 70, KeyJ: 71, KeyK: 72, KeyO: 73, KeyL: 74, KeyP: 75
}

// MIDI 音号收敛到 [21, 108]
function clampMidi(m) {
  return Math.min(MIDI_MAX, Math.max(MIDI_MIN, Math.round(Number(m))))
}

// 八度移位收敛到 [-2, 2]，非法输入回落 0
function clampOctaveShift(v) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return 0
  return Math.min(OCTAVE_SHIFT_MAX, Math.max(OCTAVE_SHIFT_MIN, n))
}

// 音量百分比（0-100）收敛；超出范围夹边
function clampVolume(v) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}

// 音量百分比 → 主增益（平方曲线更贴近听感，0%→0、100%→1）
function volumeGainOf(percent) {
  const p = clampVolume(percent) / 100
  return p * p
}

// 是否白键（按 12 平均律内半音位置判断，跨八度取模安全）
function isWhiteMidi(midi) {
  return WHITE_SEMITONES.includes(((Math.round(midi) % 12) + 12) % 12)
}

// MIDI 音号 → 音名（科学音高记法）：60 → C4、61 → C#4、69 → A4、21 → A0、108 → C8
function midiNameOf(midi) {
  const m = Math.round(Number(midi))
  if (!Number.isFinite(m)) return ''
  const name = NOTE_NAMES[((m % 12) + 12) % 12]
  return `${name}${Math.floor(m / 12) - 1}`
}

// MIDI 音号 → 频率（Hz）：标准音 A4=69 号 = 440Hz，每半音 2^(1/12) 倍
function freqOf(midi) {
  return 440 * Math.pow(2, (Math.round(Number(midi)) - 69) / 12)
}

// 琴键布局：从 startMidi 起 count 个连续半音 → [{midi, isBlack, offsetPct, widthPct}]。
// 白键等宽（widthPct = 100/白键数，offsetPct = 序号 × 白键宽）；黑键宽度 = 白键 × 0.62，
// 中心对齐「左侧已排白键数」处的白键接缝（相邻两白键的分界线），offsetPct = 接缝 - 黑键半宽。
function keyLayoutOf(startMidi = 60, count = 25) {
  const midis = Array.from({ length: count }, (_, i) => startMidi + i)
  const whiteCount = midis.filter(isWhiteMidi).length
  const whiteW = 100 / whiteCount
  const blackW = whiteW * BLACK_WIDTH_RATIO
  const layout = []
  let whiteIdx = 0
  for (const midi of midis) {
    if (isWhiteMidi(midi)) {
      layout.push({ midi, isBlack: false, offsetPct: whiteIdx * whiteW, widthPct: whiteW })
      whiteIdx += 1
    } else {
      const seam = whiteIdx * whiteW // 左右相邻白键的接缝位置
      layout.push({ midi, isBlack: true, offsetPct: seam - blackW / 2, widthPct: blackW })
    }
  }
  return layout
}

// 电脑键盘映射：BASE_KEYMAP 整体加 octaveShift × 12 半音，逐键钳制到 [21, 108]
function keymapOf(octaveShift = 0) {
  const delta = Math.round(Number(octaveShift) || 0) * 12
  const map = {}
  for (const [code, base] of Object.entries(BASE_KEYMAP)) {
    map[code] = clampMidi(base + delta)
  }
  return map
}

// 追加一条录音音符 {midi, tMs, durMs:0}；已达上限时忽略新音符（保留先前记录）
function appendRecordNote(notes, midi, tMs, max = MAX_RECORD_NOTES) {
  if (notes.length >= max) return notes
  return notes.concat({ midi, tMs: Math.max(0, Math.round(tMs)), durMs: 0 })
}

// 结束一条音符：从后往前找同音名且未封闭（durMs=0）的记录，写入时长（最短 30ms）；无可闭合项时原样返回
function closeRecordNote(notes, midi, tMs) {
  for (let i = notes.length - 1; i >= 0; i--) {
    if (notes[i].midi === midi && notes[i].durMs === 0) {
      const next = notes.slice()
      next[i] = { ...next[i], durMs: Math.max(30, Math.round(tMs - next[i].tMs)) }
      return next
    }
  }
  return notes
}

// 录音序列总时长（ms）= max(每条 tMs + durMs)，空序列为 0
function playbackTotalMsOf(notes) {
  let total = 0
  for (const n of notes) {
    total = Math.max(total, n.tMs + Math.max(0, n.durMs))
  }
  return total
}

// 毫秒 → "x.xs" 秒展示
function formatSeconds(ms) {
  return `${(Math.max(0, ms) / 1000).toFixed(1)}s`
}

// ---------- 音色与常量 ----------
const TIMBRES = [
  { value: 'piano', label: '钢琴感（三角波 + 泛音，衰减约 1.2 秒）' },
  { value: 'electric', label: '电钢琴（正弦 + 八度泛音，衰减约 0.8 秒）' },
  { value: 'organ', label: '管风琴（按住持续发声，松手 0.3 秒收音）' }
]
const OCTAVE_OPTIONS = [-2, -1, 0, 1, 2]
const DEFAULT_VOLUME = 70
const PIANO_DECAY_S = 1.2     // 钢琴感指数衰减时长
const ELECTRIC_DECAY_S = 0.8  // 电钢指数衰减时长
const ORGAN_RELEASE_S = 0.3   // 管风琴松手收音时长
const NOTE_RELEASE_S = 0.15   // 衰减型音色松手快速收音时长
const PLAYBACK_TAIL_MS = 350  // 回放尾部缓冲（最后一音收音余量）
const REC_TICK_MS = 100       // 录制计时刷新周期

// ---------- 页面状态 ----------
const seoContentVisible = ref(true)
const timbre = ref('piano')
const volume = ref(DEFAULT_VOLUME)
const octaveShift = ref(0)
const audioError = ref('')
const activeMidis = ref([])        // 当前按下的 MIDI 音号（键盘/鼠标/回放共用，驱动高亮）
const isRecording = ref(false)
const recordNotes = ref([])        // [{ midi, tMs, durMs }]，tMs/durMs 相对录制起点的毫秒
const recElapsedMs = ref(0)
const isPlayingRec = ref(false)
const loopPlayback = ref(false)

// ---------- 计算属性 ----------
const keymap = computed(() => keymapOf(octaveShift.value))
// 键位反查：MIDI 音号 → 展示字母（KeyA → A），用于琴键上的键位提示
const keyLetters = computed(() => {
  const inv = {}
  for (const [code, midi] of Object.entries(keymap.value)) {
    inv[midi] = code.slice(3)
  }
  return inv
})
const activeNamesText = computed(() =>
  activeMidis.value.length
    ? [...activeMidis.value].sort((a, b) => a - b).map(midiNameOf).join(' + ')
    : '—'
)
const shiftText = computed(() => {
  const s = octaveShift.value
  if (s > 0) return `+${s} 八度`
  if (s < 0) return `${s} 八度`
  return '原位'
})
const recStatusText = computed(() => {
  if (isRecording.value) return `录制中 · ${formatSeconds(recElapsedMs.value)}`
  if (isPlayingRec.value) return loopPlayback.value ? '循环回放中' : '回放中'
  return '空闲'
})
const recCountText = computed(() => {
  const n = recordNotes.value.length
  return n >= MAX_RECORD_NOTES
    ? `${n} / ${MAX_RECORD_NOTES} 音符（已满）`
    : `${n} / ${MAX_RECORD_NOTES} 音符`
})
const recDurationText = computed(() => formatSeconds(recElapsedMs.value))

// 琴键布局（静态）：C4 起 25 键 = 15 白 + 10 黑
const keyboardLayout = keyLayoutOf(60, 25)
const whiteKeys = keyboardLayout.filter((k) => !k.isBlack)
const blackKeys = keyboardLayout.filter((k) => k.isBlack)

// 琴键样式：整串类名按状态切换，避免同类工具类互相覆盖
function whiteKeyClassOf(midi) {
  return activeMidis.value.includes(midi)
    ? 'border-primary/70 bg-primary/25 text-primary shadow-inner'
    : 'border-zinc-300 bg-gradient-to-b from-white to-zinc-100 hover:from-zinc-50 hover:to-white text-zinc-500'
}
function blackKeyClassOf(midi) {
  return activeMidis.value.includes(midi)
    ? 'border-primary bg-primary text-primary-foreground shadow-lg'
    : 'border-zinc-950 bg-gradient-to-b from-zinc-700 to-zinc-950 hover:from-zinc-600 text-zinc-400'
}

// ---------- WebAudio 音源（仅用户回调中触碰，SSR 安全） ----------
let audioCtx = null
let masterGain = null
const voices = new Map()      // midi → { env, oscs, sustained }
const pressSources = new Map() // midi → 'mouse' | 'kb' | 'playback'（按下来源，防误释放）

// 首次用户交互时懒创建 AudioContext（自动播放策略 / SSR 安全）
function ensureAudio() {
  if (audioCtx) return audioCtx
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  audioCtx = new Ctx()
  masterGain = audioCtx.createGain()
  masterGain.gain.value = volumeGainOf(volume.value)
  masterGain.connect(audioCtx.destination)
  audioError.value = ''
  return audioCtx
}

// 生成一个发声体：按音色叠加振荡器 + 增益包络。衰减型音色自动排程停止；管风琴持续发声等待松手。
function spawnVoice(midi) {
  const ctx = audioCtx
  if (!ctx || !masterGain) return
  if (voices.has(midi)) return // 同音已按下：不重复触发
  const f = freqOf(midi)
  const t0 = ctx.currentTime
  const env = ctx.createGain()
  env.connect(masterGain)
  const oscs = []
  const addOsc = (type, freq, level) => {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.value = level
    osc.connect(g)
    g.connect(env)
    osc.start(t0)
    oscs.push(osc)
  }
  let autoStopS = 0
  let sustained = false
  if (timbre.value === 'electric') {
    // 电钢：正弦基频 + 八度泛音，约 0.8s 指数衰减
    addOsc('sine', f, 0.6)
    addOsc('sine', f * 2, 0.22)
    env.gain.setValueAtTime(0.0001, t0)
    env.gain.exponentialRampToValueAtTime(0.85, t0 + 0.008)
    env.gain.exponentialRampToValueAtTime(0.0008, t0 + ELECTRIC_DECAY_S)
    autoStopS = ELECTRIC_DECAY_S + 0.05
  } else if (timbre.value === 'organ') {
    // 管风琴：正弦 + 方波弱混 + 八度泛音，按住持续发声（release 0.3s 在松手时处理）
    addOsc('sine', f, 0.5)
    addOsc('square', f, 0.06)
    addOsc('sine', f * 2, 0.1)
    env.gain.setValueAtTime(0.0001, t0)
    env.gain.exponentialRampToValueAtTime(0.75, t0 + 0.03)
    sustained = true
  } else {
    // 钢琴感：三角波基频 + 2/3 次泛音，轻 attack 后约 1.2s 指数衰减
    addOsc('triangle', f, 0.55)
    addOsc('sine', f * 2, 0.2)
    addOsc('sine', f * 3, 0.08)
    env.gain.setValueAtTime(0.0001, t0)
    env.gain.exponentialRampToValueAtTime(0.9, t0 + 0.012)
    env.gain.exponentialRampToValueAtTime(0.0008, t0 + PIANO_DECAY_S)
    autoStopS = PIANO_DECAY_S + 0.05
  }
  const voice = { env, oscs, sustained }
  voices.set(midi, voice)
  if (autoStopS > 0) {
    oscs.forEach((o) => o.stop(t0 + autoStopS)) // 再次 stop 会覆盖此时刻（松手提前收音）
  }
  oscs[0].onended = () => {
    try { env.disconnect() } catch { /* 已断开则忽略 */ }
    if (voices.get(midi) === voice) voices.delete(midi)
  }
}

// 松手收音：包络从当前值快速衰减（管风琴 0.3s，衰减型 0.15s），并停止振荡器
function releaseVoice(midi) {
  const voice = voices.get(midi)
  if (!voice) return
  voices.delete(midi)
  const ctx = audioCtx
  if (!ctx) return
  const now = ctx.currentTime
  const g = voice.env.gain
  const cur = Math.max(0.0001, g.value || 0.0001) // 先读当前包络值再取消自动化，避免跳变爆音
  if (typeof g.cancelAndHoldAtTime === 'function') {
    try { g.cancelAndHoldAtTime(now) } catch { g.cancelScheduledValues(now) }
  } else {
    g.cancelScheduledValues(now)
  }
  const rel = voice.sustained ? ORGAN_RELEASE_S : NOTE_RELEASE_S
  try {
    g.setValueAtTime(cur, now)
    g.exponentialRampToValueAtTime(0.0001, now + rel)
  } catch { /* 参数异常时忽略，交由 stop 截止 */ }
  voice.oscs.forEach((o) => {
    try { o.stop(now + rel + 0.05) } catch { /* 已停止则忽略 */ }
  })
}

// ---------- 按键（鼠标 / 键盘 / 回放共用入口） ----------
function pressKey(midi, source) {
  if (pressSources.has(midi)) return // 已按下（防键盘重复 / 同音回放叠加）
  pressSources.set(midi, source)
  activeMidis.value = [...activeMidis.value, midi]
  if (isRecording.value) {
    recordNotes.value = appendRecordNote(recordNotes.value, midi, performance.now() - recStartMs)
  }
  const ctx = ensureAudio()
  if (!ctx) {
    audioError.value = '当前浏览器不支持 WebAudio（缺少 AudioContext），无法发声，请更换最新版 Chrome / Edge / Safari / Firefox。'
    return
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  spawnVoice(midi)
}

function releaseKey(midi, source) {
  if (pressSources.get(midi) !== source) return // 来源不匹配不释放（回放不会误关手动按住的键）
  pressSources.delete(midi)
  activeMidis.value = activeMidis.value.filter((m) => m !== midi)
  if (isRecording.value) {
    recordNotes.value = closeRecordNote(recordNotes.value, midi, performance.now() - recStartMs)
  }
  releaseVoice(midi)
}

// ---------- 电脑键盘事件（onMounted 注册 / onBeforeUnmount 移除） ----------
const kbPressed = new Map() // code → 按下瞬间的 MIDI 音号（防止八度移位后 keyup 对不上号）

function isEditableTarget(e) {
  const t = e.target
  if (!t) return false
  const tag = (t.tagName || '').toLowerCase()
  return tag === 'input' || tag === 'select' || tag === 'textarea' || t.isContentEditable === true
}

function handleKeyDown(e) {
  if (e.repeat) return               // 忽略按住重复
  if (isEditableTarget(e)) return    // 输入框 / 下拉框聚焦时不弹奏
  const midi = keymap.value[e.code]
  if (midi === undefined) return
  if (e.ctrlKey || e.metaKey || e.altKey) return // 不劫持系统 / 浏览器快捷键
  e.preventDefault() // 防 Firefox 单键速搜等默认行为
  kbPressed.set(e.code, midi)
  pressKey(midi, 'kb')
}

function handleKeyUp(e) {
  const midi = kbPressed.get(e.code)
  if (midi === undefined) return
  kbPressed.delete(e.code)
  releaseKey(midi, 'kb')
}

// 失焦安全阀：窗口失焦时释放所有键盘按住的键，避免「卡音」
function handleWindowBlur() {
  for (const [code, midi] of Array.from(kbPressed)) {
    kbPressed.delete(code)
    releaseKey(midi, 'kb')
  }
}

// ---------- 录制与回放 ----------
let recStartMs = 0
let recTickTimer = null
let playbackTimers = [] // 回放的全部 setTimeout id（音符开 / 关 + 循环衔接）

function toggleRecord() {
  if (isRecording.value) stopRecording()
  else startRecording()
}

function startRecording() {
  stopPlayback() // 录制与回放互斥
  recordNotes.value = [] // 每次录制生成一条新录音
  recStartMs = performance.now()
  recElapsedMs.value = 0
  isRecording.value = true
  recTickTimer = setInterval(() => {
    recElapsedMs.value = performance.now() - recStartMs
  }, REC_TICK_MS)
}

function stopRecording() {
  if (!isRecording.value) return
  isRecording.value = false
  if (recTickTimer !== null) {
    clearInterval(recTickTimer)
    recTickTimer = null
  }
  // 松手前停止录制的音符按「持续到停止时刻」封闭
  const elapsed = performance.now() - recStartMs
  recordNotes.value = recordNotes.value.map((n) =>
    n.durMs > 0 ? n : { ...n, durMs: Math.max(120, Math.round(elapsed - n.tMs)) }
  )
}

function togglePlayback() {
  if (isPlayingRec.value) stopPlayback()
  else startPlayback()
}

function startPlayback() {
  if (!recordNotes.value.length) return
  stopPlayback()
  const ctx = ensureAudio()
  if (!ctx) {
    audioError.value = '当前浏览器不支持 WebAudio（缺少 AudioContext），无法回放发声。'
    return
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  isPlayingRec.value = true
  schedulePlayback()
}

// 按序列调度回放：每条音符两个 setTimeout（按下时刻 / 松手时刻），循环开关在总时长尾部衔接
function schedulePlayback() {
  clearPlaybackTimers()
  const notes = recordNotes.value
  for (const n of notes) {
    playbackTimers.push(setTimeout(() => {
      if (isPlayingRec.value) pressKey(n.midi, 'playback')
    }, n.tMs))
    const dur = n.durMs > 0 ? n.durMs : 250
    playbackTimers.push(setTimeout(() => {
      if (isPlayingRec.value) releaseKey(n.midi, 'playback')
    }, n.tMs + dur))
  }
  playbackTimers.push(setTimeout(() => {
    if (!isPlayingRec.value) return
    if (loopPlayback.value) schedulePlayback()
    else finishPlayback()
  }, playbackTotalMsOf(notes) + PLAYBACK_TAIL_MS))
}

function releasePlaybackKeys() {
  for (const [midi, source] of Array.from(pressSources)) {
    if (source === 'playback') releaseKey(midi, 'playback')
  }
}

function clearPlaybackTimers() {
  playbackTimers.forEach((id) => clearTimeout(id))
  playbackTimers = []
}

function finishPlayback() {
  isPlayingRec.value = false
  releasePlaybackKeys()
  clearPlaybackTimers()
}

function stopPlayback() {
  isPlayingRec.value = false // 先置位，让已在执行队列中的回调自我跳过
  releasePlaybackKeys()
  clearPlaybackTimers()
}

function clearRecording() {
  stopPlayback()
  recordNotes.value = []
}

// ---------- 设置与持久化（音色 / 音量 / 八度偏好，try/catch 兜底） ----------
const STORAGE_KEY = 'virtual-piano-prefs'

function loadPrefs() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (saved && typeof saved === 'object') {
      if (TIMBRES.some((t) => t.value === saved.timbre)) timbre.value = saved.timbre
      if (saved.volume !== undefined) volume.value = clampVolume(saved.volume)
      if (saved.octaveShift !== undefined) octaveShift.value = clampOctaveShift(saved.octaveShift)
    }
  } catch {
    /* localStorage 不可用或数据损坏时忽略，使用默认值 */
  }
}

function savePrefs() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      timbre: timbre.value,
      volume: volume.value,
      octaveShift: octaveShift.value
    }))
  } catch {
    /* 写入失败（隐私模式 / 配额满）时静默忽略 */
  }
}

watch([timbre, volume, octaveShift], savePrefs)

watch(volume, (v) => {
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(volumeGainOf(v), audioCtx.currentTime, 0.02)
  }
})

function resetAll() {
  stopPlayback()
  if (isRecording.value) stopRecording()
  timbre.value = 'piano'
  volume.value = DEFAULT_VOLUME
  octaveShift.value = 0
  loopPlayback.value = false
  audioError.value = ''
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('blur', handleWindowBlur)
  loadPrefs()
  addRecentTool('virtual-piano')
})

onBeforeUnmount(() => {
  // 1) 移除电脑键盘 / 失焦监听
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('blur', handleWindowBlur)
  kbPressed.clear()
  // 2) 结束录制（含计时器清理与未封闭音符收尾）
  if (isRecording.value) stopRecording()
  isRecording.value = false
  if (recTickTimer !== null) {
    clearInterval(recTickTimer)
    recTickTimer = null
  }
  // 3) 停止回放（清空全部调度定时器并释放回放按住的音）
  stopPlayback()
  // 4) 停音：释放全部发声体并断开主增益
  voices.forEach((voice) => {
    voice.oscs.forEach((o) => {
      try { o.stop() } catch { /* 已停止则忽略 */ }
    })
    try { voice.env.disconnect() } catch { /* 已断开则忽略 */ }
  })
  voices.clear()
  pressSources.clear()
  if (masterGain) {
    try { masterGain.disconnect() } catch { /* 已断开则忽略 */ }
    masterGain = null
  }
  // 5) 关闭 AudioContext 释放音频资源
  if (audioCtx) {
    try { audioCtx.close() } catch { /* 已关闭则忽略 */ }
    audioCtx = null
  }
})
</script>
