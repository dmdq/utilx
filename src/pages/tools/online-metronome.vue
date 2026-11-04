<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Music class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">在线节拍器</h1>
          <p class="text-sm text-muted-foreground mt-1">30-240 BPM 精确打拍不漂移，支持 Tap Tempo、四种拍号与重音，练琴必备</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线节拍器工具：采用 WebAudio 音频时钟 lookahead 调度（25ms 轮询 + 120ms 提前预排），拍点由音频硬件时钟精确定时，不受 JS 主线程卡顿影响、长时间运行不累积漂移。
        支持 30-240 BPM 数字框与滑杆双向调节、连点测速（Tap Tempo）、2/4 / 3/4 / 4/4 / 6/8 四种拍号、每小节第 1 拍重音开关与木鱼 / 电子哔 / 侧棒三种音色；
        右侧摆锤与拍点实时可视化，并附曲速术语对照表。全部声音在浏览器本地实时合成，零上传、零第三方依赖。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：控制面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Timer class="w-5 h-5 mr-2 text-primary" /> 节拍控制
        </h2>

        <!-- BPM：数字输入 + 滑杆双向联动 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label for="bpm-number" class="text-sm font-medium text-foreground">BPM（每分钟拍数）</label>
            <span class="text-xs text-muted-foreground font-mono">每拍 {{ beatMsText }} ms</span>
          </div>
          <div class="flex items-center gap-3">
            <input
              id="bpm-number"
              v-model.number="bpm"
              type="number"
              min="30"
              max="240"
              step="1"
              class="w-24 h-10 px-3 bg-background border border-border border-border rounded-lg text-lg font-bold text-foreground font-mono text-center"
              @change="bpm = clampBpm(bpm)"
            />
            <input
              v-model.number="bpm"
              type="range"
              min="30"
              max="240"
              step="1"
              class="flex-1 accent-primary"
              aria-label="BPM 滑杆"
            />
          </div>
          <p class="text-xs text-muted-foreground">范围 30-240：数字框与滑杆共享同一数值双向联动，手输超界自动收敛。</p>
        </div>

        <!-- Tap Tempo 连点测速 -->
        <div class="bg-muted/40 border border-border rounded-lg p-3 space-y-2">
          <button
            @click="onTapTempo"
            class="w-full px-4 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-sm font-semibold text-primary transition active:scale-[0.98]"
          >
            Tap Tempo（跟着感觉连点测速）
          </button>
          <p class="text-xs text-muted-foreground leading-relaxed">
            已记录 {{ tapTimestamps.length }} 次：按心中曲速连续点按（至少 2 次），自动取相邻间隔均值换算 BPM；距上次点击超过 2 秒自动清空重来。
          </p>
        </div>

        <!-- 拍号 -->
        <div class="space-y-2">
          <label for="time-sig" class="text-sm font-medium text-foreground">拍号（每小节拍数）</label>
          <select
            id="time-sig"
            v-model="timeSig"
            class="w-full h-10 px-2.5 bg-background border border-border border-border rounded-lg text-sm text-foreground"
          >
            <option v-for="ts in TIME_SIGS" :key="ts.value" :value="ts.value">{{ ts.label }}</option>
          </select>
          <p
            v-if="timeSig === '6/8'"
            class="text-xs leading-relaxed p-2 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5"
          >
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>简化口径：6/8 按每小节 6 拍均分处理（以八分音符为一拍、第 1 拍重音），不区分「两大拍、每大拍 3 连音」的复拍子力度分层，数拍口诀见页面下方说明。</span>
          </p>
        </div>

        <!-- 重音开关 -->
        <button
          @click="accentOn = !accentOn"
          class="w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition flex items-center justify-center gap-2"
          :class="accentOn ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted border-border text-muted-foreground'"
          :aria-pressed="accentOn"
        >
          <CheckCircle v-if="accentOn" class="w-4 h-4" />
          <Info v-else class="w-4 h-4" />
          重音第 1 拍：{{ accentOn ? '开（高音 + 加重）' : '关（各拍等强）' }}
        </button>

        <!-- 音色 -->
        <div class="space-y-2">
          <label for="sound-type" class="text-sm font-medium text-foreground">音色</label>
          <select
            id="sound-type"
            v-model="soundType"
            class="w-full h-10 px-2.5 bg-background border border-border border-border rounded-lg text-sm text-foreground"
          >
            <option v-for="st in SOUND_TYPES" :key="st.value" :value="st.value">{{ st.label }}</option>
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

        <!-- 播放 / 暂停 + 重置 -->
        <div class="space-y-2 pt-1">
          <button
            @click="togglePlay"
            class="w-full px-4 py-3.5 rounded-lg text-base font-semibold transition flex items-center justify-center gap-2"
            :class="isPlaying ? 'bg-muted hover:bg-muted/80 border border-border text-foreground' : 'bg-primary text-primary-foreground hover:opacity-90'"
          >
            <template v-if="isPlaying">
              <Pause class="w-5 h-5" /> 暂停
            </template>
            <template v-else>
              <Play class="w-5 h-5" /> 开始打拍
            </template>
          </button>
          <button
            @click="resetAll"
            class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-2"
          >
            <RefreshCw class="w-4 h-4" /> 重置全部设置
          </button>
        </div>

        <!-- 错误内联提示 -->
        <p v-if="audioError" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ audioError }}</span>
        </p>
      </div>

      <!-- 右：可视化面板 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Music class="w-5 h-5 mr-2 text-primary" /> 节拍可视化
          </h2>
          <span
            v-if="isPlaying"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-600"
          >
            <CheckCircle class="w-3.5 h-3.5" /> 运行中
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground"
          >
            <Info class="w-3.5 h-3.5" /> 已暂停
          </span>
        </div>

        <!-- 摆锤：摆动周期 = 拍周期（animation-duration 动态绑定为 60/BPM 秒） -->
        <div class="relative h-44 rounded-xl border border-border bg-muted/30 overflow-hidden select-none">
          <div class="absolute top-3 left-1/2 -translate-x-1/2 w-44 h-1.5 rounded-full bg-primary/20"></div>
          <div class="absolute top-[18px] left-1/2 -translate-x-1/2">
            <!-- 外层负责水平定位，内层负责旋转动画：避免 translate 与 rotate 的 transform 冲突 -->
            <div
              class="flex flex-col items-center pendulum-arm"
              :class="{ 'pendulum-active': isPlaying }"
              :style="{ animationDuration: secondsPerBeat + 's' }"
            >
              <i class="w-2 h-2 rounded-full bg-muted-foreground/70"></i>
              <i class="w-1 h-24 sm:h-28 rounded-full bg-gradient-to-b from-muted-foreground/50 to-primary/80"></i>
              <i class="-mt-1 w-8 h-5 rounded-md bg-primary shadow"></i>
            </div>
          </div>
          <p class="absolute bottom-2 inset-x-0 text-center text-[10px] text-muted-foreground/70">
            摆动一次 = 一拍（{{ beatMsText }} ms）· 视觉近似，拍点以声音与下方高亮为准
          </p>
        </div>

        <!-- 大 BPM 数字 + 当前小节拍位置 -->
        <div class="text-center space-y-1">
          <p class="text-6xl sm:text-7xl font-bold text-primary font-mono tabular-nums leading-none">{{ bpm }}</p>
          <p class="text-sm text-muted-foreground">
            <span class="font-semibold text-foreground">{{ timeSig }}</span> · 第 {{ currentBeatText }} 拍
            <span v-if="isPlaying && currentBeat === 0 && accentOn" class="ml-1 text-primary font-medium">（重音）</span>
          </p>
        </div>

        <!-- 拍点行：按拍号渲染圆点，当前拍按音频时钟高亮 -->
        <div class="space-y-2">
          <div class="flex items-center justify-center gap-2 sm:gap-3 min-h-[44px]">
            <div
              v-for="n in beatsPerBar"
              :key="n"
              class="rounded-full border-2 flex items-center justify-center font-bold transition-all duration-100"
              :class="dotClassOf(n)"
            >
              <span>{{ n }}</span>
            </div>
          </div>
          <div class="max-w-sm mx-auto h-1.5 bg-muted rounded-full overflow-hidden" aria-hidden="true">
            <div class="h-full bg-primary/70 rounded-full" :style="{ width: (beatPhase * 100).toFixed(1) + '%' }"></div>
          </div>
          <p class="text-center text-[10px] text-muted-foreground/70">
            大圆点为每小节第 1 拍（重音位）；细条为当前拍内进度，按音频时钟逐帧刷新
          </p>
        </div>

        <!-- 曲速术语对照（静态卡，当前 BPM 落档高亮） -->
        <div class="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
          <h3 class="text-sm font-semibold text-foreground">曲速术语对照（当前 {{ bpm }} BPM 落在高亮档）</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div
              v-for="term in TEMPO_TERMS"
              :key="term.name"
              class="rounded-lg border p-2.5 text-center transition"
              :class="term.name === currentTerm.name ? 'border-primary bg-primary/10' : 'border-border bg-card'"
            >
              <p class="text-sm font-bold" :class="term.name === currentTerm.name ? 'text-primary' : 'text-foreground'">
                {{ term.name }}<span class="text-[10px] font-normal text-muted-foreground ml-1">{{ term.zh }}</span>
              </p>
              <p class="text-[10px] text-muted-foreground font-mono mt-0.5">{{ term.min }}-{{ term.max }} BPM</p>
            </div>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>在线节拍器是什么？练习时怎么用？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          节拍器（Metronome）以恒定速度发出规律的拍点音，是乐器练习中最基础的辅助工具：它提供不受情绪影响的客观时间基准，
          帮助练习者发现并修正抢拍、拖拍、时值不均等问题。本工具用浏览器 WebAudio 接口实时合成拍点音（正弦波、方波与噪声脉冲均可程序生成），
          无需下载安装 App，也不依赖外部音频文件；打开网页即可打拍，支持 30-240 BPM、四种常用拍号、重音与音量调节。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">练习时怎么用（先慢后快原则）？</h3>
        <ol class="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>先把 BPM 降到能「完整、干净」演奏目标片段的速度（通常为原速的 60%-70%），分段循环练习最难的部分。</li>
          <li>同一段落能连续 3 遍不错音、不掉拍之后，每次提高 4-8 BPM 再练，不要一步跨太大。</li>
          <li>卡不上拍就立刻退回上一档速度：宁可慢而准，不要快而错——错误动作练熟了更难改。</li>
          <li>复杂片段先分手 / 分声部各自跟拍练稳，最后再合手回到目标速度。</li>
          <li>每天收尾时用目标速度完整过一遍，记录当天能稳定驾驭的最高 BPM，方便追踪进步。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">BPM 是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          BPM 是 Beats Per Minute 的缩写，即「每分钟拍数」，是描述音乐速度的通用单位：60 BPM 表示每秒 1 拍，120 BPM 表示每秒 2 拍。
          本工具范围 30-240 BPM：30-60 多用于慢练与基本功，90-120 是流行歌常见速度，160 以上接近急板华彩。
          曲谱上的 ♩=88 记号即表示以四分音符为一拍、每分钟 88 拍。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">曲速术语对照</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          古典乐谱常用意大利语术语标注速度，与 BPM 的大致对应如下（各流派口径略有出入，取常用区间）：
        </p>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground mt-2">
          <li><span class="font-semibold text-foreground">Largo 广板</span>：40-60 BPM，庄严宽广，多用于颂歌与葬礼进行曲。</li>
          <li><span class="font-semibold text-foreground">Adagio 柔板</span>：66-76 BPM，从容抒情，常见于慢乐章。</li>
          <li><span class="font-semibold text-foreground">Andante 行板</span>：76-108 BPM，如步行般不急不缓。</li>
          <li><span class="font-semibold text-foreground">Moderato 中板</span>：108-120 BPM，中等速度，流行歌主力区间。</li>
          <li><span class="font-semibold text-foreground">Allegro 快板</span>：120-156 BPM，明快活泼，舞曲与奏鸣曲常用。</li>
          <li><span class="font-semibold text-foreground">Presto 急板</span>：156-180 BPM，飞快，多见于技巧性乐章。</li>
        </ul>
        <p class="text-xs text-muted-foreground mt-2">
          注：60-66 BPM 之间传统上另称 Larghetto（小广板），本工具对照表未单列，落在该区间时按就近原则归入相邻档。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么很多网页节拍器会不准？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          常见网页节拍器直接「setInterval 每拍触发一次 → 回调里立刻发声」，这有两个致命伤：其一，JS 定时器只保证「不早于」设定时刻触发，
          主线程一旦被布局、垃圾回收或其它脚本占住就会整体延后；其二，每次回调才安排下一拍，上一拍的延迟会计入下一拍的基准，误差逐拍累积，
          几十秒后就能明显听出忽快忽慢。本工具采用 WebAudio 的 lookahead 调度器（Chris Wilson 经典文章《A Tale of Two Clocks》的方案）：
          一个 25ms 的 setInterval 只当「轮询泵」，每次把未来 120ms 内的所有拍点用 osc.start(精确时刻) 预排进 AudioContext 的音频硬件时钟队列，
          实际发声由独立的音频渲染线程按采样精度执行——即使页面短暂卡顿也不影响拍点间隔，长时间运行不累积漂移，可达到专业节拍器的稳定度。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">6/8 拍怎么数？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          6/8 是复拍子（复合拍）：每小节 6 个八分音符，但律动上不是均匀的 6 下，而是「两大拍、每大拍均分 3 个八分音符」，
          常用口诀是 1(2 3) 4(5 6)，重音落在第 1 和第 4 拍，摇篮曲、吉格舞曲多用这种摇曳的双拍感。
          为了实现简单、可视化直观，本工具按「每小节 6 拍均分」的简化口径处理：以八分音符为一拍、仅第 1 拍重音；
          练习复拍子律动时，可自行把第 4 拍想象成第二重音，按两大拍分组来数。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">网页节拍器准确吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">准确。本工具不用 setTimeout 直接触发发声，而是用 WebAudio 音频时钟做前瞻调度：每 25ms 轮询一次，把未来 120ms 内的拍点预先排入音频硬件时钟，发声按采样精度执行，不受 JS 主线程卡顿影响，长时间运行不会累积漂移。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">练琴时怎么用节拍器？</h3>
            <p class="text-sm text-muted-foreground mt-1">先慢后快：把速度降到能完整演奏的慢速（约原速的 60%-70%），分段循环练到连续多遍不错音，再每次提高 4-8 BPM 逐步提速；卡不上拍就退回上一档，稳定后最终达到目标速度。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">6/8 拍怎么数？</h3>
            <p class="text-sm text-muted-foreground mt-1">6/8 律动上是两大拍、每大拍含 3 个八分音符，口诀 1(2 3) 4(5 6)，重音在第 1 和第 4 拍；本工具按 6 拍均分简化处理、第 1 拍重音，可自行把第 4 拍当作第二重音来练习复合拍感。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">我的 BPM 和拍号设置会被记住吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">会。BPM 与拍号保存在你本机浏览器的 localStorage 中，下次打开自动恢复；数据不出浏览器，清除站点数据后回到默认值（120 BPM、4/4 拍）。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'online-metronome'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Music, Play, Pause, Timer, Volume2, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '在线节拍器 - 免费 BPM 节拍器与拍号练习工具',
  description: '免费在线节拍器：WebAudio 音频时钟精确调度不漂移，30-240 BPM 与 Tap Tempo 连点测速，2/4、3/4、4/4、6/8 拍号与重音设置，木鱼/电子哔/侧棒三种音色，摆锤与拍点可视化并附曲速术语对照，练琴打拍必备，纯浏览器本地运行零上传',
  keywords: '在线节拍器,online metronome,节拍器,鼓点,练习节拍,BPM节拍器,拍号练习,曲速术语,Tap Tempo',
  author: '有条工具',
  ogTitle: '在线节拍器 - 免费在线节拍器练习工具 | 有条工具',
  ogDescription: 'WebAudio 音频时钟精确调度不漂移，30-240 BPM、Tap Tempo、四种拍号与曲速术语对照，练琴必备。',
  ogUrl: 'https://www.util.cn/tools/online-metronome',
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
          name: '在线节拍器',
          url: 'https://www.util.cn/tools/online-metronome',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['WebAudio 音频时钟 lookahead 精确调度不漂移', '30-240 BPM 数字框与滑杆双向联动', 'Tap Tempo 连点测速（最近 8 次间隔均值）', '2/4、3/4、4/4、6/8 四种拍号', '每小节第 1 拍重音开关', '木鱼 / 电子哔 / 侧棒三种音色与音量调节', '摆锤与拍点高亮可视化', '曲速术语对照高亮', '本地运行零上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '在线节拍器', item: 'https://www.util.cn/tools/online-metronome/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '网页节拍器准确吗？',
              acceptedAnswer: { '@type': 'Answer', text: '准确。本工具不用 setTimeout 直接触发发声，而是用 WebAudio 音频时钟做前瞻调度：每 25ms 轮询一次，把未来 120ms 内的拍点预先排入音频硬件时钟，发声按采样精度执行，不受 JS 主线程卡顿影响，长时间运行不会累积漂移。' }
            },
            {
              '@type': 'Question',
              name: '练琴时怎么用节拍器？',
              acceptedAnswer: { '@type': 'Answer', text: '先慢后快：把速度降到能完整演奏的慢速（约原速的 60%-70%），分段循环练到连续多遍不错音，再每次提高 4-8 BPM 逐步提速；卡不上拍就退回上一档，稳定后最终达到目标速度。' }
            },
            {
              '@type': 'Question',
              name: '6/8 拍怎么数？',
              acceptedAnswer: { '@type': 'Answer', text: '6/8 律动上是两大拍、每大拍含 3 个八分音符，口诀 1(2 3) 4(5 6)，重音在第 1 和第 4 拍；本工具按 6 拍均分简化处理、第 1 拍重音，可自行把第 4 拍当作第二重音来练习复合拍感。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const BPM_MIN = 30       // BPM 下限
const BPM_MAX = 240      // BPM 上限
const DEFAULT_BPM = 120  // 默认 / 无效输入回落值
const TAP_MAX_KEEP = 8   // Tap Tempo 最多保留最近 8 次 tap
const TAP_TIMEOUT_MS = 2000 // 距上次 tap 超过 2 秒视为新一轮（清空重来）

// BPM 收敛：非有限数或 <=0 回落默认值，否则四舍五入并夹到 [30, 240]
function clampBpm(v, fallback = DEFAULT_BPM) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.min(BPM_MAX, Math.max(BPM_MIN, n))
}

// Tap Tempo 口径：取相邻 tap 间隔的算术平均值 avg，bpm = 60000 / avg（四舍五入取整后夹到 [30, 240]）。
// - 少于 2 个时间点（不足 1 个间隔）→ null；
// - 调用方可传 now：距最后一次 tap 超过 TAP_TIMEOUT_MS 视为超时清空 → null；
// - 间隔不均时按全部相邻间隔的均值换算（如 400/600/500ms → 均值 500ms → 120 BPM）。
function tapTempoCalc(timestamps, now = null) {
  if (!Array.isArray(timestamps) || timestamps.length < 2) return null
  const taps = timestamps.slice(-TAP_MAX_KEEP)
  const nowRef = now === null ? taps[taps.length - 1] : now
  if (nowRef - taps[taps.length - 1] > TAP_TIMEOUT_MS) return null
  const intervals = []
  for (let i = 1; i < taps.length; i++) {
    const gap = taps[i] - taps[i - 1]
    if (gap > 0) intervals.push(gap)
  }
  if (!intervals.length) return null
  const avg = intervals.reduce((s, g) => s + g, 0) / intervals.length
  if (!(avg > 0)) return null
  return clampBpm(60000 / avg)
}

// 曲速术语六档（60-66 的 Larghetto 区间未单列，落档规则见下）
const TEMPO_TERMS = [
  { name: 'Largo', zh: '广板', min: 40, max: 60 },
  { name: 'Adagio', zh: '柔板', min: 66, max: 76 },
  { name: 'Andante', zh: '行板', min: 76, max: 108 },
  { name: 'Moderato', zh: '中板', min: 108, max: 120 },
  { name: 'Allegro', zh: '快板', min: 120, max: 156 },
  { name: 'Presto', zh: '急板', min: 156, max: 180 }
]

// tempoTermOf 口径：先按列表顺序取第一个 min<=bpm<=max 的档（边界值归较低档：76→Adagio、108→Andante、120→Moderato、156→Allegro、180→Presto）；
// 间隙值（如 61-65）与越界值归「到该档区间距离最近」的档（如 62 距 Largo 上界 2、距 Adagio 下界 4 → Largo）。
function tempoTermOf(bpm) {
  const hit = TEMPO_TERMS.find((t) => bpm >= t.min && bpm <= t.max)
  if (hit) return hit
  let best = TEMPO_TERMS[0]
  let bestDist = Infinity
  for (const t of TEMPO_TERMS) {
    const d = bpm < t.min ? t.min - bpm : bpm > t.max ? bpm - t.max : 0
    if (d < bestDist) {
      bestDist = d
      best = t
    }
  }
  return best
}

// 可视化高亮的纯计算：beat 为小节内当前拍（0 基，0 即重音拍），phase 为当前拍内相位 [0,1)。
// 手算示例：beatPhaseOf(0.75, 0, 0.5, 4)：elapsed=0.75，0.75/0.5=1.5 → floor=1 → beat=1、phase=0.5；
// currentTime 早于 startTime（未开播）返回 { beat: 0, phase: 0 }。
function beatPhaseOf(currentTime, startTime, secondsPerBeat, beatsPerBar) {
  if (!(secondsPerBeat > 0) || !(beatsPerBar > 0)) return { beat: 0, phase: 0 }
  const elapsed = currentTime - startTime
  if (elapsed < 0) return { beat: 0, phase: 0 }
  const total = Math.floor(elapsed / secondsPerBeat)
  return {
    beat: total % beatsPerBar,
    phase: elapsed / secondsPerBeat - total
  }
}

// 拍号定义：beats 为每小节拍数（6/8 采用「6 拍均分」简化口径，见 UI 静态说明）
const TIME_SIGS = [
  { value: '2/4', beats: 2, label: '2/4（进行曲）' },
  { value: '3/4', beats: 3, label: '3/4（圆舞曲）' },
  { value: '4/4', beats: 4, label: '4/4（常用拍号）' },
  { value: '6/8', beats: 6, label: '6/8（复合拍·简化均分）' }
]

function beatsPerBarOf(timeSig) {
  const found = TIME_SIGS.find((t) => t.value === timeSig)
  return found ? found.beats : 4
}

// 音色参数表：type 'sine' / 'square' 为振荡器波形，'noise' 表示白噪声过 band-pass（freq 为中心频率）。
// 重音拍：频率上移 + gain 提到约 1.8 倍（木鱼 800→1200Hz、电子哔 1000→1500Hz、侧棒 1800→2400Hz）。
const OSC_PARAM_TABLE = {
  woodblock: {
    normal: { freq: 800, type: 'sine', duration: 0.05, gain: 0.5 },
    accent: { freq: 1200, type: 'sine', duration: 0.05, gain: 0.9 }
  },
  beep: {
    normal: { freq: 1000, type: 'square', duration: 0.03, gain: 0.25 },
    accent: { freq: 1500, type: 'square', duration: 0.03, gain: 0.45 }
  },
  sidestick: {
    normal: { freq: 1800, type: 'noise', duration: 0.03, gain: 0.5 },
    accent: { freq: 2400, type: 'noise', duration: 0.04, gain: 0.9 }
  }
}

// buildOscParams 返回参数副本（避免调用方改动污染参数表）；未知音色回落木鱼
function buildOscParams(soundType, isAccent) {
  const entry = OSC_PARAM_TABLE[soundType] || OSC_PARAM_TABLE.woodblock
  return { ...(isAccent ? entry.accent : entry.normal) }
}

const SOUND_TYPES = [
  { value: 'woodblock', label: '木鱼感（短促清脆）' },
  { value: 'beep', label: '电子哔（方波短音）' },
  { value: 'sidestick', label: '侧棒（噪声脉冲）' }
]

// ---------- 调度与可视化常量 ----------
const SCHEDULER_INTERVAL_MS = 25 // 轮询泵周期：25ms
const SCHEDULE_AHEAD_S = 0.12    // 前瞻窗：提前 120ms 预排
const VISUAL_TOLERANCE_S = 0.3   // 300ms 容错窗：调度锚点落后超过该值时吸附重同步

// ---------- 页面状态 ----------
const seoContentVisible = ref(true)
const isPlaying = ref(false)
const audioError = ref('')
const bpm = ref(DEFAULT_BPM)
const timeSig = ref('4/4')
const accentOn = ref(true)
const soundType = ref('woodblock')
const volume = ref(80)
const tapTimestamps = ref([]) // 最近 tap 的 performance.now() 时间点
const currentBeat = ref(-1)   // 小节内当前拍（0 基），-1 = 无高亮
const beatPhase = ref(0)      // 当前拍内相位 [0,1)

const beatsPerBar = computed(() => beatsPerBarOf(timeSig.value))
const secondsPerBeat = computed(() => 60 / clampBpm(bpm.value))
const beatMsText = computed(() => Math.round(secondsPerBeat.value * 1000))
const currentBeatText = computed(() =>
  currentBeat.value >= 0 ? `${currentBeat.value + 1} / ${beatsPerBar.value}` : `— / ${beatsPerBar.value}`
)
const currentTerm = computed(() => tempoTermOf(clampBpm(bpm.value)))

// 拍点圆点样式：第 1 拍（重音位）更大，当前拍实心放大
function dotClassOf(n) {
  const active = currentBeat.value === n - 1
  const size = n === 1
    ? (active ? 'w-9 h-9 text-sm' : 'w-8 h-8 text-xs')
    : (active ? 'w-7 h-7 text-xs' : 'w-6 h-6 text-[10px]')
  const tone = active
    ? 'border-primary bg-primary text-primary-foreground scale-110 shadow-elevation-2'
    : (n === 1 ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border bg-muted/60 text-muted-foreground')
  return `${size} ${tone}`
}

// ---------- WebAudio 资源（非响应式，仅用户回调 / rAF 中触碰，SSR 安全） ----------
let audioCtx = null
let masterGain = null
let noiseBuffer = null
let schedulerTimer = null
let rafId = null
let nextNoteTime = 0      // 下一拍的音频时钟时刻
let beatCounter = 0       // 本次开播的全局拍计数，小节内拍 = beatCounter % beatsPerBar
const scheduleQueue = []  // 已预排拍记录 { time, beat, spb }，可视化高亮与其比对

function ensureAudioContext() {
  if (audioCtx) return audioCtx
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  audioCtx = new Ctx() // 仅在用户点击回调中创建（SSR / 自动播放策略安全）
  masterGain = audioCtx.createGain()
  masterGain.gain.value = volume.value / 100
  masterGain.connect(audioCtx.destination)
  noiseBuffer = null
  return audioCtx
}

// 白噪声缓冲（0.2s，一次性生成复用）：侧棒主体与木鱼瞬态共用
function ensureNoiseBuffer() {
  if (noiseBuffer || !audioCtx) return noiseBuffer
  const len = Math.max(1, Math.floor(audioCtx.sampleRate * 0.2))
  noiseBuffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return noiseBuffer
}

// 单个拍点发声：统一「声源 → 指数衰减包络 → 主 GainNode」链路
function scheduleBeatSound(time, isAccent) {
  if (!audioCtx || !masterGain) return
  const p = buildOscParams(soundType.value, isAccent)
  const env = audioCtx.createGain()
  env.gain.setValueAtTime(p.gain, time)
  env.gain.exponentialRampToValueAtTime(0.001, time + p.duration)
  env.connect(masterGain)

  if (p.type === 'noise') {
    // 侧棒：短噪声脉冲过 band-pass（freq 为中心频率）
    const src = audioCtx.createBufferSource()
    src.buffer = ensureNoiseBuffer()
    const bp = audioCtx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = p.freq
    bp.Q.value = 1.5
    src.connect(bp)
    bp.connect(env)
    src.start(time)
    src.stop(time + p.duration + 0.05)
  } else {
    const osc = audioCtx.createOscillator()
    osc.type = p.type
    osc.frequency.value = p.freq
    osc.connect(env)
    osc.start(time) // 关键：按预排时刻精确起振，而不是回调里立即发声
    osc.stop(time + p.duration + 0.05)
    if (soundType.value === 'woodblock') {
      // 木鱼感附加：极短高频噪声瞬态（约主音 12% 音量、12ms 衰减），模拟敲击质感
      const click = audioCtx.createBufferSource()
      click.buffer = ensureNoiseBuffer()
      const bp2 = audioCtx.createBiquadFilter()
      bp2.type = 'bandpass'
      bp2.frequency.value = 2600
      bp2.Q.value = 1
      const clickEnv = audioCtx.createGain()
      clickEnv.gain.setValueAtTime(p.gain * 0.12, time)
      clickEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.012)
      click.connect(bp2)
      bp2.connect(clickEnv)
      clickEnv.connect(masterGain)
      click.start(time)
      click.stop(time + 0.03)
    }
  }
}

// ---------- lookahead 调度器（Chris Wilson《A Tale of Two Clocks》口径） ----------
// 为什么不用 setTimeout 直敲：JS 定时器只保证「不早于指定时刻触发」，主线程一忙就整体延后，
// 且每次回调才排下一拍，误差逐拍累积，几十拍后可听出明显拖拍。
// 本工具：setInterval 仅作 25ms 一次的轮询泵，每次把 120ms 前瞻窗（SCHEDULE_AHEAD_S）内的所有未来拍
// 用 osc.start(nextNoteTime) 预排到 AudioContext 的音频硬件时钟上，nextNoteTime += 60/bpm 逐拍推进；
// 真正的发声时刻由音频渲染线程按采样精度执行，与 JS 主线程抖动完全解耦，长时间运行不累积漂移。
function scheduler() {
  if (!audioCtx || !isPlaying.value) return
  const now = audioCtx.currentTime
  // 后台标签页会把 setInterval 节流到 ≥1s：若调度锚点落后音频时钟超过 300ms 容错窗，
  // 直接吸附重同步（丢弃过期拍），避免回到前台后补播一串过期拍点
  if (nextNoteTime < now - VISUAL_TOLERANCE_S) {
    scheduleQueue.length = 0
    beatCounter = 0
    nextNoteTime = now + 0.06
  }
  const spb = secondsPerBeat.value
  const bar = beatsPerBar.value
  while (nextNoteTime < now + SCHEDULE_AHEAD_S) {
    const beatInBar = beatCounter % bar
    const isAccent = accentOn.value && beatInBar === 0
    scheduleBeatSound(nextNoteTime, isAccent)
    scheduleQueue.push({ time: nextNoteTime, beat: beatInBar, spb })
    nextNoteTime += spb // 60 / bpm，拍间隔由音频时钟刻度推进
    beatCounter += 1
  }
}

// ---------- rAF 可视化循环：audioCtx.currentTime 与调度记录比对刷新高亮 ----------
function loop() {
  rafId = requestAnimationFrame(loop)
  if (!audioCtx) return
  const now = audioCtx.currentTime
  // 清理过期记录：保留最近一个已到点拍（供相位计算）与全部未来拍，更早的旧拍清除，防止长会话队列增长
  let lastPastIdx = -1
  for (let i = 0; i < scheduleQueue.length; i++) {
    if (scheduleQueue[i].time <= now) lastPastIdx = i
    else break
  }
  if (lastPastIdx > 0) scheduleQueue.splice(0, lastPastIdx)
  // 取最近一个已到点的调度记录，用纯函数算出小节内拍与拍内相位
  let entry = null
  for (let i = scheduleQueue.length - 1; i >= 0; i--) {
    if (scheduleQueue[i].time <= now) {
      entry = scheduleQueue[i]
      break
    }
  }
  if (!entry) return // 首拍尚未到点（60ms 起振余量内）：保持初始高亮
  const r = beatPhaseOf(now, entry.time, entry.spb, beatsPerBar.value)
  const beatNow = (entry.beat + r.beat) % beatsPerBar.value
  if (beatNow !== currentBeat.value) currentBeat.value = beatNow
  beatPhase.value = r.phase
}

function startLoop() {
  if (rafId === null) rafId = requestAnimationFrame(loop)
}

function stopLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

// ---------- 事件处理（仅在用户回调中访问浏览器 API，SSR 安全） ----------
function startPlayback() {
  audioError.value = ''
  const ctx = ensureAudioContext()
  if (!ctx) {
    audioError.value = '当前浏览器不支持 WebAudio（缺少 AudioContext），请更换最新版 Chrome / Edge / Safari / Firefox。'
    return
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  bpm.value = clampBpm(bpm.value)
  scheduleQueue.length = 0
  beatCounter = 0
  currentBeat.value = 0
  beatPhase.value = 0
  nextNoteTime = ctx.currentTime + 0.06 // 留 60ms 起振余量
  scheduler() // 先排一轮，避免首拍空档
  schedulerTimer = setInterval(scheduler, SCHEDULER_INTERVAL_MS)
  isPlaying.value = true
  startLoop()
}

function pausePlayback() {
  if (schedulerTimer !== null) {
    clearInterval(schedulerTimer)
    schedulerTimer = null
  }
  stopLoop()
  isPlaying.value = false
  scheduleQueue.length = 0
  currentBeat.value = -1
  beatPhase.value = 0
}

function togglePlay() {
  if (isPlaying.value) pausePlayback()
  else startPlayback()
}

function resetAll() {
  pausePlayback()
  bpm.value = DEFAULT_BPM
  timeSig.value = '4/4'
  accentOn.value = true
  soundType.value = 'woodblock'
  volume.value = 80
  tapTimestamps.value = []
  audioError.value = ''
}

function onTapTempo() {
  const now = performance.now()
  const taps = tapTimestamps.value
  // 距上次 tap 超过 2 秒：视为新一轮，清空历史（口径与 tapTempoCalc 的超时判定一致）
  if (taps.length && now - taps[taps.length - 1] > TAP_TIMEOUT_MS) {
    taps.length = 0
  }
  taps.push(now)
  if (taps.length > TAP_MAX_KEEP) taps.splice(0, taps.length - TAP_MAX_KEEP)
  const next = tapTempoCalc(taps, now)
  if (next !== null) bpm.value = next
}

// ---------- localStorage 持久化（BPM 与拍号，try/catch 兜底） ----------
const STORAGE_KEY = 'online-metronome-prefs'

function loadPrefs() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (saved && typeof saved === 'object') {
      if (saved.bpm !== undefined) bpm.value = clampBpm(saved.bpm)
      if (saved.timeSig && TIME_SIGS.some((t) => t.value === saved.timeSig)) timeSig.value = saved.timeSig
    }
  } catch {
    /* localStorage 不可用或数据损坏时忽略，使用默认值 */
  }
}

function savePrefs() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ bpm: bpm.value, timeSig: timeSig.value }))
  } catch {
    /* 写入失败（隐私模式 / 配额满）时静默忽略 */
  }
}

watch([bpm, timeSig], savePrefs)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  loadPrefs()
  addRecentTool('online-metronome')
})

onBeforeUnmount(() => {
  // 1) 停止 lookahead 调度器（clearInterval 轮询泵）
  if (schedulerTimer !== null) {
    clearInterval(schedulerTimer)
    schedulerTimer = null
  }
  // 2) 停止 rAF 可视化循环
  stopLoop()
  isPlaying.value = false
  scheduleQueue.length = 0
  // 3) 关闭并释放 AudioContext（连带释放其上的主 GainNode 与噪声缓冲引用）
  masterGain = null
  noiseBuffer = null
  if (audioCtx) {
    try { audioCtx.close() } catch { /* 已关闭则忽略 */ }
    audioCtx = null
  }
})
</script>

<style scoped>
/* 摆锤：transform-origin 固定在顶端轴心，alternate 往返摆动 = 一拍摆一次（动画周期 = 拍周期 60/BPM 秒） */
.pendulum-arm {
  transform: rotate(0deg);
  transform-origin: 50% 4px;
  transition: transform 0.3s ease;
}
.pendulum-active {
  animation-name: metronome-swing;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  transition: none;
}
@keyframes metronome-swing {
  from { transform: rotate(-22deg); }
  to { transform: rotate(22deg); }
}
</style>
