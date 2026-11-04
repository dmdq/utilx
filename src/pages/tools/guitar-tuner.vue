<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Guitar class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">吉他调音器</h1>
          <p class="text-sm text-muted-foreground mt-1">麦克风实时音高检测，指针表盘直读偏低偏高音分，支持吉他 / 尤克里里 / 贝斯 / 小提琴五种调弦</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线吉他调音器：打开麦克风后拨响琴弦，基于自相关算法在浏览器本地实时检出基音频率，
        以 ±50 音分指针表盘直观显示「偏低 / 偏高」与偏离量，并给出「拧紧 / 拧松」的方向性引导；
        内置吉他标准 EADGBE、降半音 Eb、尤克里里 GCEA、贝斯 EADG、小提琴 GDAE 五种调弦预设，
        支持 A4 415-460Hz 校准（交响乐团常用 442/443），点弦钮可播放标准音做耳朵调音对照。
        全程零上传：声音只在本地内存中分析，不录音，关闭页面即释放麦克风。
      </p>
    </div>

    <!-- 诚实说明条（静态） -->
    <div class="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 flex items-start gap-2">
      <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>
        诚实说明：调音精度依赖麦克风拾音质量——环境嘈杂或琴弦老化、泛音杂乱时指针会抖动、检测会不稳定，安静环境下效果最好；
        电吉他为实心琴身、几乎不通过空气共鸣发声，请直插声卡 / 音频接口并将其设为系统输入设备后再测。
      </span>
    </div>

    <!-- 环境提示条（onMounted 判定） -->
    <div
      v-if="envNotice.level === 'warn'"
      class="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 flex items-start gap-2"
    >
      <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{{ envNotice.text }}</span>
    </div>
    <div
      v-else-if="envNotice.level === 'error'"
      class="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 flex items-start gap-2"
    >
      <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{{ envNotice.text }}</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：乐器 / 校准面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Volume2 class="w-5 h-5 mr-2 text-primary" /> 乐器与校准
        </h2>

        <!-- 调弦预设 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">乐器 / 调弦预设</p>
          <div class="space-y-2">
            <button
              v-for="p in PRESETS"
              :key="p.id"
              @click="presetId = p.id"
              class="w-full text-left px-3 py-2.5 rounded-lg border transition"
              :class="presetId === p.id ? 'border-primary bg-primary/10' : 'border-border bg-muted/40 hover:bg-muted/70'"
            >
              <span class="block text-sm font-medium" :class="presetId === p.id ? 'text-primary' : 'text-foreground'">{{ p.name }}</span>
              <span class="block text-[11px] text-muted-foreground font-mono mt-0.5">{{ p.strings.map((s) => s.note).join(' · ') }}</span>
            </button>
          </div>
        </div>

        <!-- A4 校准 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">A4 校准（Hz）</p>
          <div class="flex items-center gap-2">
            <input
              v-model.number="a4"
              type="number"
              min="415"
              max="460"
              step="1"
              @change="a4 = clampA4(a4)"
              class="flex-1 h-9 px-2.5 bg-background border border-border border-border rounded-lg text-sm text-foreground font-mono"
            />
            <button
              @click="a4 = A4_DEFAULT"
              title="恢复 440Hz"
              class="h-9 w-9 flex-shrink-0 flex items-center justify-center bg-muted hover:bg-muted/80 border border-border rounded-lg text-muted-foreground transition"
            >
              <RefreshCw class="w-4 h-4" />
            </button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">范围 415-460，默认 440；交响乐团常用 442/443，与乐团合奏前请先确认标准音。</p>
        </div>

        <!-- 开始 / 停止 -->
        <button
          @click="tunerOn ? stopTuner() : startTuner()"
          :disabled="perm === 'requesting'"
          class="w-full px-4 py-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mic v-if="tunerOn" class="w-4 h-4 inline mr-1.5 -mt-0.5" />
          <Play v-else class="w-4 h-4 inline mr-1.5 -mt-0.5" />
          {{ perm === 'requesting' ? '等待授权…' : tunerOn ? '停止调音' : '开始调音（需要麦克风）' }}
        </button>

        <!-- 权限 / 状态行 -->
        <p class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5" :class="LEVEL_CLASSES[permHint.level]">
          <CheckCircle v-if="perm === 'granted'" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <TriangleAlert v-else-if="perm === 'denied' || perm === 'notfound'" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <Info v-else class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ permHint.text }}</span>
        </p>

        <!-- 错误内联提示 -->
        <p v-if="listenError" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ listenError }}</span>
        </p>

        <p class="text-xs text-muted-foreground leading-relaxed">
          麦克风采集已关闭回声消除 / 噪声抑制 / 自动增益等浏览器处理链，保证送入自相关检测的是原始波形；
          声音只在本地内存中分析、不录音不上传，点「停止调音」或关闭页面立即释放设备。
        </p>
      </div>

      <!-- 右：表盘与弦钮（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Mic class="w-5 h-5 mr-2 text-primary" /> 实时调音表盘
          </h2>
          <span class="inline-block px-2.5 py-1 rounded-full border text-xs font-medium" :class="verdictMeta.cls">
            {{ verdictMeta.label }}
          </span>
        </div>

        <!-- 半圆表盘：-50 … 0 … +50 音分 -->
        <div class="mx-auto w-full max-w-md">
          <svg :viewBox="`0 0 ${DIAL.w} ${DIAL.h}`" class="w-full select-none" role="img" aria-label="音分偏差表盘">
            <!-- 判定色区 -->
            <path v-for="z in dialZones" :key="z.from" :d="z.d" fill="none" :stroke="z.color" stroke-width="9" stroke-linecap="butt" />
            <!-- 刻度与标签 -->
            <g class="text-muted-foreground" stroke="currentColor">
              <line v-for="t in dialTicks" :key="t.c" :x1="t.x1" :y1="t.y1" :x2="t.x2" :y2="t.y2" :stroke-width="t.major ? 2 : 1" />
            </g>
            <g class="text-muted-foreground" fill="currentColor" font-size="11">
              <text v-for="t in dialLabels" :key="t.c" :x="t.x" :y="t.y" text-anchor="middle">{{ t.text }}</text>
              <text :x="DIAL.cx - DIAL.r + 4" :y="DIAL.cy - 10">← 偏低</text>
              <text :x="DIAL.cx + DIAL.r - 4" :y="DIAL.cy - 10" text-anchor="end">偏高 →</text>
            </g>
            <!-- 指针（角度 = 音分映射） -->
            <g :transform="`rotate(${needleAngle} ${DIAL.cx} ${DIAL.cy})`">
              <line
                :x1="DIAL.cx"
                :y1="DIAL.cy"
                :x2="DIAL.cx"
                :y2="DIAL.cy - DIAL.r + 20"
                :stroke="verdictMeta.stroke"
                stroke-width="3.5"
                stroke-linecap="round"
                :opacity="detectedCents === null ? 0.3 : 1"
              />
            </g>
            <circle :cx="DIAL.cx" :cy="DIAL.cy" r="7" :fill="verdictMeta.stroke" />
            <!-- 中央读数 -->
            <text
              :x="DIAL.cx"
              y="92"
              text-anchor="middle"
              class="text-foreground"
              fill="currentColor"
              font-size="32"
              font-weight="bold"
              font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
            >{{ freqText }}</text>
            <text :x="DIAL.cx" y="118" text-anchor="middle" class="text-muted-foreground" fill="currentColor" font-size="13">{{ nearestText }}</text>
          </svg>
        </div>

        <!-- 判定引导（方向性文案） -->
        <p class="text-center text-sm font-medium min-h-[1.5rem]" :class="verdictMeta.text">{{ guidanceText }}</p>

        <!-- 弦按钮组：耳朵调音法 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">标准音弦钮（点击播放 2 秒，耳朵调音法）</p>
          <div class="grid grid-cols-3 gap-2" :class="preset.strings.length > 4 ? 'sm:grid-cols-6' : 'sm:grid-cols-4'">
            <button
              v-for="(s, i) in preset.strings"
              :key="s.note + i"
              @click="playString(i)"
              class="px-2 py-2.5 rounded-lg border text-center transition"
              :class="stringButtonClass(i)"
            >
              <span class="flex items-center justify-center gap-1 text-sm font-bold">
                <Volume2 v-if="playingIndex === i" class="w-3.5 h-3.5" />
                {{ s.label }} {{ s.note }}
              </span>
              <span class="block text-[10px] font-mono mt-0.5 opacity-80">{{ targetFreqs[i].toFixed(2) }} Hz</span>
            </button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-2">绿色高亮 = 检测中自动识别的最近琴弦；喇叭图标 = 正在播放该弦标准音。</p>
        </div>

        <!-- 信号强度 -->
        <div>
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="text-muted-foreground">信号强度（实时 RMS）</span>
            <span class="font-mono font-bold text-foreground">{{ rmsText }}</span>
          </div>
          <div class="h-2.5 bg-muted rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 rounded-full" :style="{ width: rmsPercent + '%' }"></div>
          </div>
          <p
            v-if="weakSignal"
            class="mt-2 text-xs leading-relaxed text-amber-700 bg-amber-500/10 rounded p-2 flex items-start gap-1.5"
          >
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>信号太弱：靠近麦克风或大声一点，拨弦后让音自然延续 1-2 秒再读数。</span>
          </p>
        </div>

        <!-- 新手三步教学卡（静态） -->
        <div class="bg-muted/40 border border-border rounded-lg p-4">
          <p class="text-sm font-medium text-foreground mb-2.5 flex items-center">
            <Info class="w-4 h-4 mr-1.5 text-primary" /> 新手三步调音法
          </p>
          <ol class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground list-none">
            <li class="bg-card border border-border rounded-lg p-2.5"><span class="text-primary font-bold mr-1">①</span>点上方弦钮听标准音，记住目标音高</li>
            <li class="bg-card border border-border rounded-lg p-2.5"><span class="text-primary font-bold mr-1">②</span>拨同一根弦，看指针偏向与音分读数</li>
            <li class="bg-card border border-border rounded-lg p-2.5"><span class="text-primary font-bold mr-1">③</span>指针居中且判定变绿「准了」，再调下一根</li>
          </ol>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>吉他调音器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          吉他调音器是一款在浏览器本地运行的在线调音工具。它通过 getUserMedia 获取麦克风原始波形（显式关闭回声消除、噪声抑制与自动增益，
          避免处理链削掉基频与谐波），用 AnalyserNode 每帧读取 4096 个采样点，以归一化自相关（NSDF 简化版）+ 抛物线插值检出基音频率，
          再与当前调弦预设的目标频率比较，换算出音分（cents）偏差并驱动 ±50 音分指针表盘。全部计算都在你的设备内存中完成，不录音、不上传。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>吉他标准音是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          吉他标准调弦（Standard Tuning）从低到高为 E2-A2-D3-G3-B3-E4，对应 6 弦到 1 弦的空弦音。下表是以 A4 = 440Hz 为基准的标准频率；
          当把 A4 校准改为 442 或 443 时，所有目标频率按 a4/440 等比放大，本工具会自动换算，无需手动查表。
        </p>
        <div class="overflow-x-auto mb-2">
          <table class="w-full text-sm text-muted-foreground border border-border">
            <thead>
              <tr class="bg-muted/50 text-foreground">
                <th class="p-2 text-left font-medium">弦序</th>
                <th class="p-2 text-left font-medium">音名</th>
                <th class="p-2 text-left font-medium">标准频率（A4=440Hz）</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in standardPreset.strings" :key="s.note" class="border-t border-border">
                <td class="p-2">{{ s.label }}</td>
                <td class="p-2 font-mono">{{ s.note }}</td>
                <td class="p-2 font-mono">{{ s.freq.toFixed(2) }} Hz</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-muted-foreground mb-4">对照：尤克里里 GCEA（G4 392.00 / C4 261.63 / E4 329.63 / A4 440.00）、贝斯四弦 EADG（E1 41.20 起）、小提琴 GDAE（G3 196.00 起），可在左侧面板一键切换。</p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么用手机或电脑给吉他调音？</h3>
        <ol class="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>用手机或电脑浏览器打开本页，点「开始调音」并在弹窗中允许麦克风权限（需要 HTTPS 或 localhost 环境）。</li>
          <li>选择乐器与调弦预设，确认 A4 校准值：独奏默认 440，与交响乐团合奏常用 442/443。</li>
          <li>找一间安静的房间，设备放在距吉他音孔 30-50cm 处，麦克风正对音孔。</li>
          <li>从 6 弦开始逐根拨响，让音自然延续 1-2 秒，观察指针偏向与音分读数。</li>
          <li>指针偏左（偏低）就拧紧该弦钮，偏右（偏高）就拧松；每次微调约 1/4 圈再重新拨弦读数。</li>
          <li>判定变绿「准了」（±5 音分内）再调下一根；全部调完后从 6 弦到 1 弦复查一遍——调弦会互相拉动琴颈张力。</li>
          <li>也可点弦钮播放标准音，用耳朵对比两音之间的「拍频」波动，拍频越慢越准，顺便练耳。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">音分（cents）是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          音分是对音高偏差的对数度量：十二平均律中相邻两个半音的频率比为 2 的 12 次方根，把一个半音平均分成 100 份，每一份就是 1 音分，
          即 1 半音 = 100 音分，一个八度 = 1200 音分。换算公式为 cents = 1200 × log2(f1/f2)。一般相差 5 音分以内多数人耳分辨不出，
          超过 20 音分就能明显听出「不齐」，所以本工具把 ±5 音分判定为「准了」、±20 音分内判定为「接近」。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么调音器有时候不准？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>环境噪声：说话声、空调、键盘声混入拾音会干扰自相关检测，指针来回跳。</li>
          <li>泛音杂乱：琴弦老化、打品或左手指尖没按实，基频能量变弱，检出值不稳定。</li>
          <li>A4 校准不一致：乐团以 442 调音而调音器停在 440，会「越调越歪」，合奏前先统一标准音。</li>
          <li>拾音距离太远或音量太小：信号低于门限（RMS）时本工具会提示「信号太弱」，而不是硬给一个不可靠的读数。</li>
          <li>新换的琴弦张力未稳定：音高本身在漂移，建议拉伸并弹奏几分钟后再精调。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">耳朵调音和电子调音哪个好？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两者是互补关系。电子调音（本页表盘）直接给出与绝对标准音的偏差，快且准，适合新手和演出前快速校准；
          耳朵调音属于相对调音法：先定准一根弦，再靠弦与弦共振时的「拍频」把其余弦调齐——两音越接近，拍频波动越慢，完全重合时拍频消失。
          推荐流程是先用电子调音把 1 弦（或 A4 基准）调准，再用 5 品 / 7 品泛音的相对调音法调其余弦，既保证绝对音准又能训练听力。
          本工具两种方式都支持：表盘负责电子调音，弦钮播放标准音负责耳朵对照。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">浏览器提示权限被拒绝怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">Chrome 可点击地址栏左侧的锁图标 → 网站设置 → 把「麦克风」改为「允许」，然后刷新页面重试；macOS 用户还需要在 系统设置 → 隐私与安全性 → 麦克风 中勾选当前浏览器。若改完后仍失败，检查麦克风是否被其他应用占用。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">指针一直跳动、检测不稳定怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">多为环境噪声或琴弦泛音杂乱所致：换到安静房间、把设备移近到距音孔 30-50cm、拨弦后让音延续 1-2 秒再读数；老化琴弦建议先更换。本表盘读数取最近三次检测的中位数以抑制抖动，但输入信号本身太乱时任何算法都无法稳定。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">电吉他可以直接插线调音吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">本工具通过麦克风拾音，而电吉他实心琴身几乎不通过空气共鸣发声，直接对着音箱或裸琴拾音效果差。请把电吉他直插声卡 / 音频接口，并在系统和浏览器输入设备中选择该接口，本页即可正常检测其输出信号。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">A4 = 440Hz 和 442Hz 有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">A4 是标准音基准：440Hz 是国际通用标准，442/443Hz 常用于交响乐团，听起来更明亮。两者相差约 8 音分，耳朵可以感知。合奏前必须统一基准；本工具支持在 415-460 之间校准，所有弦的目标频率会按比例自动换算。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'guitar-tuner'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Guitar, Play, Mic, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Volume2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '吉他调音器 - 在线吉他/尤克里里/贝斯/小提琴调音工具',
  description: '免费在线吉他调音器：麦克风自相关音高检测，±50 音分指针表盘实时显示偏低偏高并给出拧紧拧松引导，支持吉他标准 EADGBE、降半音、尤克里里 GCEA、贝斯 EADG、小提琴 GDAE 五种调弦与 A4 415-460 校准，点弦钮播放标准音耳朵调音，纯浏览器本地运行不上传',
  keywords: '吉他调音,吉他调音器,online guitar tuner,调音器,尤克里里调音,贝斯调音,小提琴调音,标准音,A4校准,音分,cents,吉他标准音',
  author: '有条工具',
  ogTitle: '吉他调音器 - 在线吉他/尤克里里调音工具 | 有条工具',
  ogDescription: '麦克风自相关音高检测，指针表盘直观显示偏低偏高，五种调弦预设与 A4 校准，本地运行零上传。',
  ogUrl: 'https://www.util.cn/tools/guitar-tuner',
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
          name: '吉他调音器',
          url: 'https://www.util.cn/tools/guitar-tuner',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['麦克风自相关音高检测', '±50 音分指针表盘与方向性调音引导', '吉他/尤克里里/贝斯/小提琴五种调弦预设', 'A4 415-460Hz 校准', '标准音播放耳朵调音法', 'RMS 信号强度与弱信号提示', '本地运行零上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '吉他调音器', item: 'https://www.util.cn/tools/guitar-tuner/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '浏览器提示权限被拒绝怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: 'Chrome 可点击地址栏左侧的锁图标 → 网站设置 → 把「麦克风」改为「允许」，然后刷新页面重试；macOS 用户还需要在 系统设置 → 隐私与安全性 → 麦克风 中勾选当前浏览器。若改完后仍失败，检查麦克风是否被其他应用占用。' }
            },
            {
              '@type': 'Question',
              name: '指针一直跳动、检测不稳定怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '多为环境噪声或琴弦泛音杂乱所致：换到安静房间、把设备移近到距音孔 30-50cm、拨弦后让音延续 1-2 秒再读数；老化琴弦建议先更换。表盘读数取最近三次检测的中位数以抑制抖动，但输入信号本身太乱时任何算法都无法稳定。' }
            },
            {
              '@type': 'Question',
              name: '电吉他可以直接插线调音吗？',
              acceptedAnswer: { '@type': 'Answer', text: '本工具通过麦克风拾音，而电吉他实心琴身几乎不通过空气共鸣发声。请把电吉他直插声卡/音频接口，并在系统和浏览器输入设备中选择该接口，本页即可正常检测其输出信号。' }
            },
            {
              '@type': 'Question',
              name: 'A4 = 440Hz 和 442Hz 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'A4 是标准音基准：440Hz 是国际通用标准，442/443Hz 常用于交响乐团，听起来更明亮，两者相差约 8 音分。合奏前必须统一基准；本工具支持在 415-460 之间校准，所有弦的目标频率会按比例自动换算。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const RMS_GATE = 0.005        // RMS 低于此值视为信号太弱，不参与检测
const CLARITY_GATE = 0.5      // 归一化自相关峰值低于此值视为无明确音高（噪声 / 泛音杂乱）
const FIRST_PEAK_RATIO = 0.9  // 取首个达到全局峰值 90% 的局部极大，避免把 2 倍 / 3 倍周期误判为基音周期
const CENTS_IN_TUNE = 5       // |cents| ≤ 5 判定「准了」
const CENTS_CLOSE = 20        // |cents| ≤ 20 判定「接近」
const DIAL_CENTS = 50         // 表盘半圆量程 ±50 音分
const A4_MIN = 415
const A4_MAX = 460
const A4_DEFAULT = 440
const TONE_DURATION_S = 2     // 弦钮标准音播放时长（秒）

// 乐器 / 调弦预设（频率为 A4=440 基准的名义值，运行时按 a4 缩放）
const PRESETS = [
  {
    id: 'guitar-standard',
    name: '吉他 · 标准调弦 EADGBE',
    strings: [
      { label: '6弦', note: 'E2', freq: 82.41 },
      { label: '5弦', note: 'A2', freq: 110.00 },
      { label: '4弦', note: 'D3', freq: 146.83 },
      { label: '3弦', note: 'G3', freq: 196.00 },
      { label: '2弦', note: 'B3', freq: 246.94 },
      { label: '1弦', note: 'E4', freq: 329.63 }
    ]
  },
  {
    id: 'guitar-eb',
    name: '吉他 · 降半音 EbAbDbGbBbEb',
    strings: [
      { label: '6弦', note: 'Eb2', freq: 77.78 },
      { label: '5弦', note: 'Ab2', freq: 103.83 },
      { label: '4弦', note: 'Db3', freq: 138.59 },
      { label: '3弦', note: 'Gb3', freq: 185.00 },
      { label: '2弦', note: 'Bb3', freq: 233.08 },
      { label: '1弦', note: 'Eb4', freq: 311.13 }
    ]
  },
  {
    id: 'ukulele',
    name: '尤克里里 · 标准调弦 GCEA',
    strings: [
      { label: '4弦', note: 'G4', freq: 392.00 },
      { label: '3弦', note: 'C4', freq: 261.63 },
      { label: '2弦', note: 'E4', freq: 329.63 },
      { label: '1弦', note: 'A4', freq: 440.00 }
    ]
  },
  {
    id: 'bass',
    name: '贝斯 · 四弦 EADG',
    strings: [
      { label: '4弦', note: 'E1', freq: 41.20 },
      { label: '3弦', note: 'A1', freq: 55.00 },
      { label: '2弦', note: 'D2', freq: 73.42 },
      { label: '1弦', note: 'G2', freq: 98.00 }
    ]
  },
  {
    id: 'violin',
    name: '小提琴 · 标准调弦 GDAE',
    strings: [
      { label: '4弦', note: 'G3', freq: 196.00 },
      { label: '3弦', note: 'D4', freq: 293.66 },
      { label: '2弦', note: 'A4', freq: 440.00 },
      { label: '1弦', note: 'E5', freq: 659.26 }
    ]
  }
]

// A4 校准缩放：actual = nominal × (a4 / 440)
function scaleFrequencies(freqs, a4) {
  const base = Number(a4) > 0 ? Number(a4) : A4_DEFAULT
  const ratio = base / 440
  return (Array.isArray(freqs) ? freqs : []).map((f) => f * ratio)
}

// 音分差：f1 相对 f2 偏离多少音分（1 半音 = 100 音分）
function centsOf(f1, f2) {
  return Math.round(1200 * Math.log2(f1 / f2))
}

// 判定：|cents|≤5 准了（绿）/ ≤20 接近 / >20 偏低或偏高（黄 / 橙）
function tuneVerdictOf(cents) {
  if (cents === null || !Number.isFinite(cents)) return 'idle'
  const abs = Math.abs(cents)
  if (abs <= CENTS_IN_TUNE) return 'in-tune'
  if (abs <= CENTS_CLOSE) return 'close'
  return cents < 0 ? 'low' : 'high'
}

// 方向性引导文案：低了就拧紧、高了就拧松
function guidanceOf(cents) {
  if (cents === null || !Number.isFinite(cents)) return '拨响琴弦，指针会指出偏低还是偏高'
  const n = Math.abs(Math.round(cents))
  if (n <= CENTS_IN_TUNE) return '准了！保持住，再确认一遍'
  if (cents < 0) {
    return n <= CENTS_CLOSE ? `接近了：低了 ${n} 音分，再微微拧紧` : `低了 ${n} 音分，继续拧紧琴钮（升高音高）`
  }
  return n <= CENTS_CLOSE ? `接近了：高了 ${n} 音分，再微微放松` : `高了 ${n} 音分，适当拧松琴钮（降低音高）`
}

// 最近弦：按音分距离取最近的一根
function nearestStringOf(freq, presetFreqs) {
  if (!Number.isFinite(freq) || freq <= 0 || !Array.isArray(presetFreqs) || presetFreqs.length === 0) return null
  let bestIndex = -1
  let bestDist = Infinity
  for (let i = 0; i < presetFreqs.length; i++) {
    const target = presetFreqs[i]
    if (!Number.isFinite(target) || target <= 0) continue
    const dist = Math.abs(centsOf(freq, target))
    if (dist < bestDist) {
      bestDist = dist
      bestIndex = i
    }
  }
  if (bestIndex < 0) return null
  return { index: bestIndex, target: presetFreqs[bestIndex] }
}

// A4 输入钳制：非法回 440，范围 415-460，取整
function clampA4(value) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return A4_DEFAULT
  return Math.min(A4_MAX, Math.max(A4_MIN, n))
}

// 音分钳制到表盘量程，并映射为指针角度（-50→-90°，0→0°，+50→+90°）
function clampCents(cents, range = DIAL_CENTS) {
  return Math.min(range, Math.max(-range, cents))
}
function needleAngleOf(cents) {
  return (clampCents(cents) / DIAL_CENTS) * 90
}

// 中位数：表盘读数取最近 3 次检测的中位数以抑制抖动
function medianOf(nums) {
  const arr = (Array.isArray(nums) ? nums : []).filter((n) => Number.isFinite(n)).slice().sort((a, b) => a - b)
  if (!arr.length) return null
  const mid = Math.floor(arr.length / 2)
  return arr.length % 2 === 1 ? arr[mid] : Math.round((arr[mid - 1] + arr[mid]) / 2)
}

// RMS（均方根）：信号强度与太弱门限
function rmsOf(buffer) {
  if (!buffer || !buffer.length) return 0
  let sum = 0
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i]
  return Math.sqrt(sum / buffer.length)
}

// 自相关音高检测（NSDF 简化版 + 抛物线插值）：
// nsdf[τ] = 2·Σx[i]x[i+τ] / (Σx[i]² + Σx[i+τ]²)，周期处趋近 1；
// RMS 低于门限或峰值清晰度不足（噪声）返回 null。
function autocorrPitch(buffer, sampleRate, options = {}) {
  const minFreq = options.minFreq ?? 55
  const maxFreq = options.maxFreq ?? 1000
  if (!buffer || buffer.length < 2 || !(sampleRate > 0)) return null
  if (!(minFreq > 0) || !(maxFreq > minFreq)) return null

  if (rmsOf(buffer) < RMS_GATE) return null // 信号太弱

  const n = buffer.length
  const minLag = Math.max(2, Math.floor(sampleRate / maxFreq))
  const maxLag = Math.min(n - 2, Math.ceil(sampleRate / minFreq))
  if (maxLag <= minLag) return null

  const firstLag = Math.max(1, minLag - 1)
  const lastLag = Math.min(n - 2, maxLag + 1)
  const nsdf = new Float32Array(lastLag + 2)
  let bestVal = -Infinity
  let bestLag = -1
  for (let lag = firstLag; lag <= lastLag; lag++) {
    let corr = 0
    let energyA = 0
    let energyB = 0
    for (let i = 0, j = lag; j < n; i++, j++) {
      const a = buffer[i]
      const b = buffer[j]
      corr += a * b
      energyA += a * a
      energyB += b * b
    }
    const denom = energyA + energyB
    const value = denom > 0 ? (2 * corr) / denom : 0
    nsdf[lag] = value
    if (lag >= minLag && lag <= maxLag && value > bestVal) {
      bestVal = value
      bestLag = lag
    }
  }
  if (bestLag < 0 || bestVal < CLARITY_GATE) return null // 无明确音高（噪声 / 泛音过乱）

  // 在全局峰值之前寻找第一个足够高的局部极大：避免把 2 倍 / 3 倍周期误判为基音周期
  let chosen = bestLag
  const gate = bestVal * FIRST_PEAK_RATIO
  for (let lag = minLag; lag < bestLag; lag++) {
    if (nsdf[lag] >= gate && nsdf[lag] >= nsdf[lag - 1] && nsdf[lag] >= nsdf[lag + 1]) {
      chosen = lag
      break
    }
  }

  // 抛物线插值细化峰位，提升亚采样点精度
  let refined = chosen
  const y1 = nsdf[chosen - 1]
  const y2 = nsdf[chosen]
  const y3 = nsdf[chosen + 1]
  const denom2 = y1 - 2 * y2 + y3
  if (denom2 !== 0) {
    const delta = (0.5 * (y1 - y3)) / denom2
    if (Number.isFinite(delta) && Math.abs(delta) <= 1) refined = chosen + delta
  }

  const freq = sampleRate / refined
  if (!(freq >= minFreq && freq <= maxFreq)) return null
  return freq
}

// 由当前预设目标频率推导检测范围（贝斯 E1=41.2Hz 低于默认下限 55，需要放宽）
function detectRangeFor(freqs) {
  const valid = (Array.isArray(freqs) ? freqs : []).filter((f) => Number.isFinite(f) && f > 0)
  if (!valid.length) return { minFreq: 55, maxFreq: 1000 }
  return {
    minFreq: Math.max(30, Math.round(Math.min(...valid) * 0.8)),
    maxFreq: Math.min(1200, Math.round(Math.max(...valid) * 1.6))
  }
}

// 表盘几何：角度 0° 指向正上方，正值顺时针（偏右 = 偏高）
function polarToXY(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) }
}
function arcPath(cx, cy, r, a1, a2) {
  const p1 = polarToXY(cx, cy, r, a1)
  const p2 = polarToXY(cx, cy, r, a2)
  const large = a2 - a1 > 180 ? 1 : 0
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
}

// 权限状态机文案（复用 camera-mic-test 文案体系）
const PERM_HINTS = {
  idle: { text: '尚未开启：点击「开始调音」，并在浏览器弹窗中允许麦克风权限。', level: 'muted' },
  requesting: { text: '正在请求麦克风权限，请在浏览器弹窗中点击「允许」。', level: 'warn' },
  granted: { text: '麦克风已开启，拨响琴弦即可看到指针摆动。', level: 'ok' },
  denied: { text: '麦克风权限已被拒绝：Chrome 可点击地址栏锁图标 → 网站设置 → 将「麦克风」改为允许后刷新重试；macOS 还需在 系统设置 → 隐私与安全性 → 麦克风 中勾选当前浏览器。', level: 'error' },
  notfound: { text: '未检测到可用麦克风，请确认设备已连接并在系统中被识别。', level: 'error' }
}

// 环境判定：不支持 mediaDevices → error；非 HTTPS 且非 localhost → warn
function envNoticeOf(protocol, hostname, hasMediaDevices) {
  if (!hasMediaDevices) {
    return { level: 'error', text: '当前浏览器不支持麦克风采集（缺少 navigator.mediaDevices），请更换最新版 Chrome / Edge / Safari / Firefox。' }
  }
  const secure = protocol === 'https:'
  const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)
  if (!secure && !local) {
    return { level: 'warn', text: '麦克风权限需要 HTTPS 或 localhost 环境，当前页面可能无法申请设备权限。' }
  }
  return { level: 'ok', text: '' }
}

// ---------- 表盘几何（渲染常量，由纯函数生成一次） ----------
const DIAL = { w: 320, h: 180, cx: 160, cy: 160, r: 130 }
const VERDICT_META = {
  idle: { label: '待检测', cls: 'bg-muted text-muted-foreground border-border', text: 'text-muted-foreground', stroke: '#94a3b8' },
  'in-tune': { label: '准了', cls: 'bg-green-500/10 text-green-600 border-green-500/20', text: 'text-green-600', stroke: '#22c55e' },
  close: { label: '接近', cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20', text: 'text-amber-600', stroke: '#f59e0b' },
  low: { label: '偏低', cls: 'bg-orange-500/10 text-orange-600 border-orange-500/20', text: 'text-orange-600', stroke: '#f97316' },
  high: { label: '偏高', cls: 'bg-orange-500/10 text-orange-600 border-orange-500/20', text: 'text-orange-600', stroke: '#f97316' }
}
const LEVEL_CLASSES = {
  muted: 'bg-muted/60 text-muted-foreground',
  warn: 'bg-amber-500/10 text-amber-700',
  ok: 'bg-green-500/10 text-green-700',
  error: 'bg-red-500/10 text-red-600'
}

const dialZones = [
  { from: -50, to: -20, color: '#f97316' },
  { from: -20, to: -5, color: '#f59e0b' },
  { from: -5, to: 5, color: '#22c55e' },
  { from: 5, to: 20, color: '#f59e0b' },
  { from: 20, to: 50, color: '#f97316' }
].map((z) => ({ ...z, d: arcPath(DIAL.cx, DIAL.cy, DIAL.r, z.from, z.to) }))

const dialTicks = []
for (let c = -DIAL_CENTS; c <= DIAL_CENTS; c += 10) {
  const a = needleAngleOf(c)
  const major = c === -DIAL_CENTS || c === 0 || c === DIAL_CENTS
  const p1 = polarToXY(DIAL.cx, DIAL.cy, DIAL.r + 4, a)
  const p2 = polarToXY(DIAL.cx, DIAL.cy, DIAL.r - (major ? 14 : 9), a)
  dialTicks.push({ c, major, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y })
}
const dialLabels = [-DIAL_CENTS, 0, DIAL_CENTS].map((c) => {
  const p = polarToXY(DIAL.cx, DIAL.cy, DIAL.r + 26, needleAngleOf(c))
  return { c, x: p.x, y: p.y + 4, text: c > 0 ? `+${c}` : `${c}` }
})

// ---------- 页面状态 ----------
const presetId = ref('guitar-standard')
const a4 = ref(A4_DEFAULT)
const seoContentVisible = ref(true)
const envNotice = ref({ level: 'ok', text: '' })

const perm = ref('idle')       // idle / requesting / granted / denied / notfound
const tunerOn = ref(false)
const listenError = ref('')
const playingIndex = ref(-1)

const detectedFreq = ref(null)
const detectedCents = ref(null)
const detectedStringIndex = ref(-1)
const rmsLevel = ref(0)

const preset = computed(() => PRESETS.find((p) => p.id === presetId.value) || PRESETS[0])
const standardPreset = computed(() => PRESETS.find((p) => p.id === 'guitar-standard') || PRESETS[0])
const targetFreqs = computed(() => scaleFrequencies(preset.value.strings.map((s) => s.freq), a4.value))
const detectRange = computed(() => detectRangeFor(targetFreqs.value))
const verdict = computed(() => tuneVerdictOf(detectedCents.value))
const verdictMeta = computed(() => VERDICT_META[verdict.value] || VERDICT_META.idle)
const needleAngle = computed(() => (detectedCents.value === null ? 0 : needleAngleOf(detectedCents.value)))
const guidanceText = computed(() => guidanceOf(detectedCents.value))
const freqText = computed(() => (detectedFreq.value !== null ? `${detectedFreq.value.toFixed(1)} Hz` : '—'))
const nearestText = computed(() => {
  if (detectedStringIndex.value < 0 || !preset.value.strings[detectedStringIndex.value]) return '拨响琴弦后自动识别最近弦'
  const s = preset.value.strings[detectedStringIndex.value]
  return `最近弦：${s.label} ${s.note} · 目标 ${targetFreqs.value[detectedStringIndex.value].toFixed(2)} Hz`
})
const rmsPercent = computed(() => (tunerOn.value ? Math.min(100, Math.round(rmsLevel.value * 500)) : 0))
const rmsText = computed(() => (tunerOn.value ? `${rmsPercent.value}%` : '—'))
const weakSignal = computed(() => tunerOn.value && rmsLevel.value < RMS_GATE)
const permHint = computed(() => PERM_HINTS[perm.value] || PERM_HINTS.idle)

// ---------- 非响应式内部句柄（仅用户回调 / rAF 中触碰，SSR 安全） ----------
let micStream = null
let audioContext = null
let analyser = null
let floatData = null
let rafId = null
let lastDetectTs = 0
let toneOsc = null
let toneGain = null
const recentCents = [] // 最近 3 次音分，取中位数去抖（非响应式）
const DETECT_INTERVAL_MS = 100

// ---------- localStorage（A4 校准与乐器预设，try/catch 包裹） ----------
const STORAGE_KEY = 'guitar-tuner-settings'
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (saved && Number.isFinite(saved.a4) && saved.a4 >= A4_MIN && saved.a4 <= A4_MAX) {
      a4.value = Math.round(saved.a4)
    }
    if (saved && PRESETS.some((p) => p.id === saved.presetId)) {
      presetId.value = saved.presetId
    }
  } catch { /* 本地数据损坏或隐私模式下读取失败，忽略 */ }
}
function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ a4: a4.value, presetId: presetId.value }))
  } catch { /* 写入失败（如隐私模式）可忽略 */ }
}
watch([a4, presetId], saveSettings)

// ---------- 检测循环（仅 startTuner 之后运行） ----------
function detectLoop() {
  rafId = requestAnimationFrame(detectLoop)
  const now = performance.now()
  if (now - lastDetectTs < DETECT_INTERVAL_MS) return // 约 10 次/秒，节流省电
  lastDetectTs = now
  if (!analyser || !floatData || !audioContext) return

  analyser.getFloatTimeDomainData(floatData)
  rmsLevel.value = rmsOf(floatData)
  const pitch = autocorrPitch(floatData, audioContext.sampleRate, detectRange.value)

  if (pitch === null) {
    // 无有效音高：清空读数（信号强度条仍实时显示）
    if (detectedFreq.value !== null) {
      detectedFreq.value = null
      detectedCents.value = null
    }
    detectedStringIndex.value = -1
    recentCents.length = 0
    return
  }

  const nearest = nearestStringOf(pitch, targetFreqs.value)
  if (!nearest) return
  detectedFreq.value = pitch
  detectedStringIndex.value = nearest.index
  recentCents.push(centsOf(pitch, nearest.target))
  if (recentCents.length > 3) recentCents.shift()
  detectedCents.value = medianOf(recentCents)
}

// ---------- 音频设备（只在用户回调中访问浏览器 API，SSR 安全） ----------
function ensureAudioContext() {
  if (audioContext) return audioContext
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  audioContext = new Ctx()
  return audioContext
}

async function startTuner() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    perm.value = 'idle'
    listenError.value = '当前浏览器不支持麦克风采集（缺少 navigator.mediaDevices），请更换最新版 Chrome / Edge / Safari / Firefox。'
    return
  }
  perm.value = 'requesting'
  listenError.value = ''
  try {
    // 调音场景显式关闭浏览器音频处理链：
    // 回声消除 / 噪声抑制会削弱甚至削掉基频与谐波，自动增益会动态拉高底噪，
    // 三者都会破坏自相关检测的稳定性，因此全部关闭，直接分析原始波形。
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    })
    stopTone()
    micStream = stream
    const ctx = ensureAudioContext()
    if (!ctx) throw new Error('无法创建 AudioContext')
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {})
    const source = ctx.createMediaStreamSource(stream)
    analyser = ctx.createAnalyser()
    analyser.fftSize = 4096
    floatData = new Float32Array(analyser.fftSize)
    source.connect(analyser)
    tunerOn.value = true
    perm.value = 'granted'
    lastDetectTs = 0
    recentCents.length = 0
    rafId = requestAnimationFrame(detectLoop)
  } catch (err) {
    const name = err && err.name
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      perm.value = 'denied'
    } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
      perm.value = 'notfound'
    } else {
      perm.value = 'idle'
    }
    listenError.value = `麦克风开启失败：${(err && err.message) || '未知错误'}`
  }
}

function stopTuner() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop())
    micStream = null
  }
  analyser = null
  floatData = null
  tunerOn.value = false
  rmsLevel.value = 0
  detectedFreq.value = null
  detectedCents.value = null
  detectedStringIndex.value = -1
  recentCents.length = 0
}

// ---------- 标准音播放（耳朵调音法：Oscillator 2 秒） ----------
function playString(index) {
  const freq = targetFreqs.value[index]
  if (!Number.isFinite(freq) || freq <= 0) return
  const ctx = ensureAudioContext()
  if (!ctx) {
    listenError.value = '当前浏览器不支持 Web Audio，无法播放标准音。'
    return
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  stopTone()

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  const t0 = ctx.currentTime
  const dur = TONE_DURATION_S
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02)
  gain.gain.setValueAtTime(0.35, t0 + dur - 0.25)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + dur)

  toneOsc = osc
  toneGain = gain
  playingIndex.value = index
  osc.onended = () => {
    if (toneOsc === osc) {
      toneOsc = null
      toneGain = null
      playingIndex.value = -1
    }
    try { gain.disconnect() } catch { /* 已断开则忽略 */ }
  }
}

function stopTone() {
  if (toneOsc) {
    try { toneOsc.stop() } catch { /* 已停止则忽略 */ }
    // onended 回调负责置空 toneOsc / toneGain / playingIndex
  }
}

function stringButtonClass(i) {
  if (playingIndex.value === i) return 'border-primary bg-primary/10 text-primary'
  if (detectedStringIndex.value === i) return 'border-green-500/60 bg-green-500/10 text-green-600'
  return 'border-border bg-muted/40 text-foreground hover:bg-muted/70'
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  envNotice.value = envNoticeOf(
    window.location.protocol,
    window.location.hostname,
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  )
  loadSettings()
  addRecentTool('guitar-tuner')
})

onBeforeUnmount(() => {
  // 清理项：① 检测循环 rAF ② 标准音振荡器 ③ 麦克风流 track.stop() ④ AudioContext ⑤ 分析器句柄
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  stopTone()
  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop())
    micStream = null
  }
  analyser = null
  floatData = null
  if (audioContext) {
    audioContext.close().catch(() => {})
    audioContext = null
  }
})
</script>
