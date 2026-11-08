<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <HeartPulse class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">BPM节拍检测</h1>
          <p class="text-sm text-muted-foreground mt-1">上传音乐自动检测 BPM 节拍速度，能量包络自相关算法，DJs与健身必备</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        上传音乐文件后，工具在浏览器本地把音频降混为单声道，按 512 采样步进、1024 采样窗口逐窗计算 RMS 能量包络，
        对相邻窗做正差分（半波整流）得到 onset 强度曲线，再在 60–180 BPM 对应的滞后区间上做自相关，
        取最强的局部峰给出主 BPM 与置信度，并列出 Top-3 候选。节拍检测存在经典的"八度误差"——
        同一首歌按半速或倍速数拍听感上都成立，因此结果同时提供 0.5×/1×/2× 一键换算，请结合听感确认。
        重型电子乐与古典乐精度有限，结果仅供对照；建议分析 8 分钟以内的音频。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：解码与分析全部在本地内存中完成，不会上传到任何服务器。
      </div>
      <div class="mt-3 inline-flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-700 dark:text-amber-400 max-w-3xl">
        <AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>说明条 · 八度误差是 BPM 检测的经典难题：同一首歌按 0.5×（半速）或 2×（倍速）数拍在听感上都"成立"，算法无法替你决定音乐感觉在哪一档。请看 Top-3 候选、用换算按钮切换后试听确认；重型电子乐/古典乐精度有限，诚实标注。</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左：上传与检测 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <Upload class="w-5 h-5 mr-2 text-primary" /> 上传与检测
          </h2>
          <span v-if="fileInfo" class="text-xs text-muted-foreground truncate max-w-[50%]">
            {{ fileInfo.name }} · {{ formatSize(fileInfo.size) }}
          </span>
        </div>

        <input ref="fileInput" type="file" accept="audio/*" class="hidden" @change="onFileChange" />

        <div v-if="!fileInfo">
          <button
            @click="triggerPick"
            class="w-full py-12 border-2 border-dashed border-border rounded-lg hover:bg-muted/60 transition-colors flex flex-col items-center gap-3 text-muted-foreground"
          >
            <Music class="w-8 h-8 text-primary" />
            <span class="text-sm font-medium text-foreground">点击选择音乐文件</span>
            <span class="text-xs">mp3 / m4a / wav / ogg / flac 等可解码格式，建议 8 分钟以内，仅在本地分析</span>
          </button>
        </div>

        <div v-else class="space-y-2">
          <div class="p-3 rounded-lg border border-border bg-muted/40 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="text-sm font-medium text-foreground truncate" :title="fileInfo.name">{{ fileInfo.name }}</div>
              <div class="text-xs text-muted-foreground mt-0.5 font-mono">
                {{ fileInfo.ext }} · {{ formatTime(duration) }} · {{ sampleRate }}Hz
              </div>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <button @click="triggerPick" class="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">重新选择</button>
              <button @click="clearFile" title="移除文件" class="p-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-red-500 hover:border-red-500/40 transition-colors">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
          <p v-if="duration > 480" class="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
            <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> 音频较长（{{ Math.round(duration / 60) }} 分钟），分析可能需要数秒；建议 8 分钟以内，取副歌部分最准。
          </p>
        </div>

        <p v-if="isDecoding" class="text-sm text-muted-foreground">正在本地解码音频...</p>
        <p v-if="isAnalyzing" class="text-sm text-muted-foreground">正在分析节拍（能量包络 → onset → 自相关）...</p>
        <p v-if="analyzeError" class="text-sm text-red-500">{{ analyzeError }}</p>

        <!-- 检测流程说明 -->
        <div class="border-t border-border pt-3">
          <h3 class="text-sm font-semibold text-foreground mb-2">检测流程（全程本地）</h3>
          <ol class="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
            <li>降混单声道：多声道平均混缩，避免左右声道相位差干扰节拍判断。</li>
            <li>能量包络：1024 采样窗 / 512 采样步进逐窗 RMS（44.1kHz 下约每秒 86 帧）。</li>
            <li>onset 强度：相邻窗能量的正差分（半波整流），突出"新声音"到达的时刻。</li>
            <li>自相关：在 60–180 BPM 对应的滞后区间找周期峰，取 Top-3 局部极大值并做抛物线插值细化。</li>
          </ol>
        </div>

        <p class="text-xs text-muted-foreground flex items-start gap-1.5 border-t border-border pt-3">
          <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          精度诚实标注：重型电子乐（鼓点密度高、易触发倍频峰）与古典乐（速度有弹性、缺少稳定节拍网格）精度有限；
          置信度低于 40% 时请务必以听感为准。
        </p>
      </div>

      <!-- 右：检测结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Activity class="w-5 h-5 mr-2 text-primary" /> 检测结果
        </h2>

        <div v-if="!fileInfo" class="py-12 text-center text-sm text-muted-foreground">
          <HeartPulse class="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          上传音乐后，这里显示主 BPM、置信度、Top-3 候选与节拍换算
        </div>

        <template v-else>
          <!-- 主结果 -->
          <div v-if="result && result.bpm > 0" class="rounded-lg border border-border bg-muted/40 p-4">
            <div class="flex items-end justify-between gap-4">
              <div>
                <div class="text-xs text-muted-foreground mb-1">检测结果（主 BPM）</div>
                <div class="flex items-baseline gap-2">
                  <span class="text-5xl font-bold text-primary font-mono">{{ displayBpm.toFixed(1) }}</span>
                  <span class="text-sm text-muted-foreground">BPM</span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs text-muted-foreground mb-1">置信度</div>
                <div class="text-lg font-semibold" :class="confidenceTextClass">{{ confidenceLabel }}</div>
                <div class="w-24 h-1.5 bg-muted rounded-full overflow-hidden mt-1 ml-auto">
                  <div class="h-full rounded-full" :class="confidenceBarClass" :style="{ width: Math.round(result.confidence * 100) + '%' }"></div>
                </div>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-3 font-mono">
              每拍约 {{ beatStats.msPerBeat.toFixed(0) }} ms · 每分钟 {{ Math.round(beatStats.beatsPerMinute) }} 拍 · 4 小节（16 拍）约 {{ beatStats.fourBarsSec.toFixed(1) }} s
            </p>
            <p v-if="result.confidence < 0.4" class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-start gap-1.5">
              <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> 置信度较低，结果仅供参考，请务必结合听感与候选列表确认。
            </p>
          </div>

          <!-- 未能检出 -->
          <div v-else-if="result" class="p-4 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground">
            未能检出明显节拍：信号过短、接近静音，或缺少稳定的节拍网格。可尝试换一段鼓点/节拍更清晰的副歌部分。
          </div>

          <!-- 八度换算 -->
          <div v-if="result && result.bpm > 0">
            <div class="text-sm font-medium text-foreground mb-2">八度换算（半速/倍速都可能才是真 BPM）</div>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="f in octaveFactors"
                :key="f.value"
                @click="applyOctave(f.value)"
                class="py-2 rounded-lg border text-sm transition-colors"
                :class="isOctaveActive(f.value)
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-muted/50 border-border text-foreground hover:border-primary/40'"
              >
                <span class="block font-medium">{{ f.label }}</span>
                <span class="block text-xs text-muted-foreground font-mono mt-0.5">≈ {{ octaveValue(f.value) }}</span>
              </button>
            </div>
          </div>

          <!-- Top-3 候选 -->
          <div v-if="result && result.candidates.length">
            <div class="text-sm font-medium text-foreground mb-2">Top-3 候选 BPM（点击设为主结果）</div>
            <div class="space-y-1.5">
              <button
                v-for="(c, i) in result.candidates"
                :key="i"
                @click="displayBpm = c.bpm"
                class="w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors"
                :class="Math.abs(displayBpm - c.bpm) < 0.05 ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'"
              >
                <span class="text-xs text-muted-foreground w-7 text-left font-mono">#{{ i + 1 }}</span>
                <span class="text-sm font-semibold text-foreground font-mono w-16 text-left">{{ c.bpm.toFixed(1) }}</span>
                <div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div class="h-full bg-primary/70 rounded-full" :style="{ width: Math.round(c.score * 100) + '%' }"></div>
                </div>
                <span v-if="Math.abs(displayBpm - c.bpm) < 0.05" class="text-xs text-primary flex-shrink-0">当前</span>
              </button>
            </div>
          </div>

          <!-- 元信息 -->
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-muted/50 border border-border rounded-lg p-3 text-center">
              <div class="text-xs text-muted-foreground">曲长</div>
              <div class="text-base font-semibold text-foreground mt-1 font-mono">{{ formatTime(duration) }}</div>
            </div>
            <div class="bg-muted/50 border border-border rounded-lg p-3 text-center">
              <div class="text-xs text-muted-foreground">采样率</div>
              <div class="text-base font-semibold text-foreground mt-1 font-mono">{{ sampleRate }}</div>
            </div>
            <div class="bg-muted/50 border border-border rounded-lg p-3 text-center">
              <div class="text-xs text-muted-foreground">分析耗时</div>
              <div class="text-base font-semibold text-foreground mt-1 font-mono">{{ analyzeMs > 0 ? analyzeMs + ' ms' : '—' }}</div>
            </div>
          </div>

          <p class="text-xs text-muted-foreground">
            换算公式：每拍毫秒 = 60000 ÷ BPM；1 分钟拍数 = BPM；4 小节时长 = 每拍毫秒 × 16（4/4 拍共 16 拍）。
          </p>
        </template>
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
          在线 BPM 检测工具：测出歌曲的节拍速度
        </h2>
        <p class="text-muted-foreground mb-6">
          BPM（Beats Per Minute，每分钟拍数）是描述音乐快慢的基本单位：120 BPM 表示每分钟 120 拍、每拍 500 毫秒。
          本工具把一段音乐在浏览器里本地完成节拍分析：先降混为单声道，按 1024 采样窗、512 步进计算 RMS 能量包络，
          用相邻窗的正差分（半波整流）提取 onset 强度，再对 60–180 BPM 对应的滞后区间做自相关，
          取最强局部峰得到主 BPM、置信度与 Top-3 候选。全程不联网、不上传文件。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">检测原理：能量包络 + 自相关</h3>
        <p class="text-muted-foreground mb-6">
          节拍的本质是能量按固定周期起伏：底鼓与军鼓周期性地把响度推高。工具先把波形压缩成约每秒 86 帧的响度曲线，
          再用"相邻帧正差分"把曲线变成 onset（新声音到达）强度——鼓点越密、越强的位置值越高。
          对这条曲线做自相关（把曲线与自己错开不同滞后相乘求和），滞后恰好等于节拍周期时得分最高；
          把滞后换算回 BPM（滞后 = 60/BPM × 帧率）即得到节拍速度，峰位还经过抛物线插值细化到亚帧精度。
          静音或无节拍信号会返回低置信度而不是硬给一个数。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">为什么会差一倍或一半：八度误差</h3>
        <p class="text-muted-foreground mb-6">
          这是 BPM 检测的经典难题：一首 130 BPM 的歌按 65 BPM 数拍（两拍并一拍）或按 260 BPM 数拍（每半拍算一拍）
          在听感上都成立，算法无法判断你心里的"一拍"落在哪一层。因此工具把 Top-3 候选全部列出，
          并提供 0.5×/1×/2× 一键换算——用 DJ 习惯或跺脚试听确认哪一档最自然即可。
          常见参考区间：嘻哈 60–100、流行 100–130、house/舞曲 120–130、drum & bass 160–180。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">哪些音乐测不准？</h3>
        <p class="text-muted-foreground mb-6">
          重型电子乐（鼓点密度极高，易触发倍频峰）、古典乐（速度有弹性、缺少稳定节拍网格）、
          纯人声清唱与环境音乐（几乎没有周期性能量起伏）精度有限——工具会如实给出较低的置信度，
          此时请以听感为准。鼓点清晰的流行、摇滚、舞曲与 hip-hop 效果最好；取副歌部分比取前奏更准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">检测结果怎么用？</h3>
        <p class="text-muted-foreground mb-6">
          DJ 打碟对速（两首歌 BPM 差 3% 以内才好接）、健身操课/跑步选歌（热身 90–110、训练 120–140、冲刺 150+）、
          视频剪辑卡点（每拍毫秒 = 60000 ÷ BPM，卡点间隔直接可得）、翻唱与改编定速（节拍器按检测值设定）。
          页面还给出 4 小节时长（16 拍）换算，方便算乐句循环的秒数。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是 BPM？</h3>
            <p class="text-muted-foreground mt-1">
              BPM 即每分钟拍数（Beats Per Minute）：120 BPM 表示每分钟 120 拍、每拍 500 毫秒；150 BPM 则每拍 400 毫秒。
              数值越大节奏越快。换算公式：每拍毫秒 = 60000 ÷ BPM。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么检测结果可能差一倍或一半？</h3>
            <p class="text-muted-foreground mt-1">
              这叫"八度误差"：半速（0.5×）与倍速（2×）在听感上都成立，算法无法替你决定心理拍层。
              工具给出 Top-3 候选与 0.5×/1×/2× 换算按钮，试听后确认即可；这属于节拍检测的固有难题而非故障。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">检测原理是什么？数据会上传吗？</h3>
            <p class="text-muted-foreground mt-1">
              能量包络（1024 窗/512 步进 RMS）→ 正差分 onset 强度 → 60–180 BPM 滞后区间自相关 → Top-3 局部峰。
              全部在浏览器本地计算，音频文件不上传任何服务器；静音或无节拍输入返回低置信度，不会报错。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">哪些音乐测不准？</h3>
            <p class="text-muted-foreground mt-1">
              重型电子乐（易触发倍频峰）、古典乐（速度弹性大）、清唱与环境音乐（缺少周期性能量）精度有限，
              置信度会如实偏低——低于 40% 时请以听感为准。鼓点清晰的流行/摇滚/舞曲效果最好，取副歌段更准。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">每拍毫秒和 4 小节时长怎么算？</h3>
            <p class="text-muted-foreground mt-1">
              每拍毫秒 = 60000 ÷ BPM（120 BPM → 500ms，150 BPM → 400ms）；1 分钟拍数就是 BPM 本身；
              4 小节（4/4 拍共 16 拍）时长 = 每拍毫秒 × 16，例如 120 BPM 的一首 4 小节乐句正好 8 秒。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持多大的音频？建议多长？</h3>
            <p class="text-muted-foreground mt-1">
              支持 mp3 / m4a / wav / ogg / flac 等浏览器可解码格式；建议 8 分钟以内——取 30–60 秒鼓点清晰的副歌
              分析速度快、也更准。超过 20 分钟的文件请先裁剪再分析。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'bpm-detector'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  HeartPulse, Upload, Music, Activity, ShieldCheck, Info, AlertTriangle,
  ChevronUp, ChevronDown, Trash2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'BPM节拍检测 - 在线测歌曲速度，本地自相关算法',
  description: '在线 BPM 检测工具，上传音乐浏览器本地分析节拍速度：能量包络 + onset + 自相关算法，Top-3 候选与半速/倍速换算，附每拍毫秒与 4 小节时长换算，重型电子乐与古典乐精度诚实标注，文件不上传',
  keywords: 'BPM检测,节拍检测,歌曲速度,曲速分析,BPM测试',
  author: '有条工具',
  ogTitle: 'BPM节拍检测 - 在线测歌曲速度 | 有条工具',
  ogDescription: '上传音乐自动检测 BPM，能量包络自相关算法，Top-3 候选与八度换算，本地处理不上传',
  ogUrl: 'https://www.util.cn/tools/bpm-detector',
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
          name: 'BPM节拍检测',
          url: 'https://www.util.cn/tools/bpm-detector',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['能量包络（1024窗/512步进 RMS）', '正差分半波整流 onset 强度', '60-180 BPM 自相关滞后搜索', '抛物线插值峰位细化', '主 BPM + 置信度', 'Top-3 候选 BPM', '0.5×/1×/2× 半速倍速换算', '每拍毫秒与 4 小节时长换算', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: 'BPM节拍检测', item: 'https://www.util.cn/tools/bpm-detector/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '什么是 BPM？',
              acceptedAnswer: { '@type': 'Answer', text: 'BPM 即每分钟拍数（Beats Per Minute）：120 BPM 表示每分钟 120 拍、每拍 500 毫秒。换算公式：每拍毫秒 = 60000 ÷ BPM。' }
            },
            {
              '@type': 'Question',
              name: '为什么检测结果可能差一倍或一半？',
              acceptedAnswer: { '@type': 'Answer', text: '这叫八度误差：半速（0.5×）与倍速（2×）在听感上都成立，算法无法替你决定心理拍层。工具给出 Top-3 候选与 0.5×/1×/2× 换算按钮，试听后确认即可。' }
            },
            {
              '@type': 'Question',
              name: '检测原理是什么？数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '能量包络（1024 窗/512 步进 RMS）→ 正差分 onset 强度 → 60-180 BPM 滞后区间自相关 → Top-3 局部峰。全部在浏览器本地计算，音频文件不上传。' }
            },
            {
              '@type': 'Question',
              name: '哪些音乐测不准？',
              acceptedAnswer: { '@type': 'Answer', text: '重型电子乐（易触发倍频峰）、古典乐（速度弹性大）、清唱与环境音乐精度有限，置信度会如实偏低；低于 40% 时请以听感为准。鼓点清晰的流行/摇滚/舞曲效果最好。' }
            },
            {
              '@type': 'Question',
              name: '每拍毫秒和 4 小节时长怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '每拍毫秒 = 60000 ÷ BPM（120 BPM → 500ms，150 BPM → 400ms）；4 小节（4/4 拍共 16 拍）时长 = 每拍毫秒 × 16，如 120 BPM 的 4 小节正好 8 秒。' }
            },
            {
              '@type': 'Question',
              name: '支持多大的音频？建议多长？',
              acceptedAnswer: { '@type': 'Answer', text: '支持 mp3/m4a/wav/ogg/flac 等浏览器可解码格式；建议 8 分钟以内，取 30-60 秒鼓点清晰的副歌分析最快最准，超过 20 分钟请先裁剪。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'bpm-detector')

// ==== PURE-FNS-START ====
// （纯函数区：仅依赖参数与标准内建，node 可直接抽取单测；不触碰任何浏览器 API 与响应式状态）

const BPM_MIN = 60
const BPM_MAX = 180

// BPM → 节拍换算：每拍毫秒 = 60000 / BPM；1 分钟拍数 = BPM；4 小节（4/4 拍共 16 拍）时长
function beatStatsOf(bpm) {
  const b = Number(bpm)
  if (!Number.isFinite(b) || b <= 0) {
    return { valid: false, bpm: 0, msPerBeat: 0, beatsPerMinute: 0, fourBarsMs: 0, fourBarsSec: 0 }
  }
  const msPerBeat = 60000 / b
  return {
    valid: true,
    bpm: b,
    msPerBeat,
    beatsPerMinute: b,
    fourBarsMs: msPerBeat * 16,
    fourBarsSec: (msPerBeat * 16) / 1000
  }
}

// 能量包络：win 窗 / hop 步进逐窗 RMS（默认 1024 / 512，44.1kHz 下约 86 帧/秒）
function energyEnvelopeOf(samples, win, hop) {
  const n = samples && samples.length ? samples.length : 0
  const w = Math.max(16, Math.floor(Number(win) || 1024))
  const h = Math.max(1, Math.floor(Number(hop) || 512))
  const frames = n >= w ? Math.floor((n - w) / h) + 1 : 0
  const env = new Float32Array(Math.max(0, frames))
  for (let f = 0; f < frames; f++) {
    let sum = 0
    const s = f * h
    for (let i = s; i < s + w; i++) {
      const v = samples[i]
      sum += v * v
    }
    env[f] = Math.sqrt(sum / w)
  }
  return env
}

// onset 强度：相邻窗能量的正差分（半波整流），返回曲线与其均值/标准差（用于去均值归一）
function onsetStrengthOf(env) {
  const frames = env ? env.length : 0
  const oLen = Math.max(0, frames - 1)
  const onset = new Float32Array(oLen)
  let mean = 0
  for (let i = 0; i < oLen; i++) {
    const d = env[i + 1] - env[i]
    onset[i] = d > 0 ? d : 0
    mean += onset[i]
  }
  if (oLen > 0) mean /= oLen
  let std = 0
  for (let i = 0; i < oLen; i++) {
    const d = onset[i] - mean
    std += d * d
  }
  std = oLen > 0 ? Math.sqrt(std / oLen) : 0
  return { onset, mean, std }
}

// 自相关得分：r(lag) = Σ onset[i]·onset[i+lag] / (oLen - lag)，按重叠长度归一避免偏向短滞后
function autocorrelationScoresOf(onset, minLag, maxLag) {
  const oLen = onset ? onset.length : 0
  const lo = Math.max(1, Math.floor(minLag))
  const hi = Math.min(Math.max(1, Math.ceil(maxLag)), oLen - 1)
  const r = new Float32Array(hi + 1)
  for (let lag = lo; lag <= hi; lag++) {
    let s = 0
    const lim = oLen - lag
    for (let i = 0; i < lim; i++) s += onset[i] * onset[i + lag]
    r[lag] = lim > 0 ? s / lim : 0
  }
  return { r, lo, hi }
}

// BPM 检测主入口：60-180 BPM 滞后区间自相关 → Top-3 局部极大值 → 抛物线插值细化 → 置信度（峰显著度 z 分数启发式）。
// 静音/恒定/过短/无峰输入一律返回低置信度结果（bpm=0），不抛异常。
function detectBpm(samples, sampleRate, opts) {
  const o = opts || {}
  const win = Math.max(64, Math.floor(Number(o.win) || 1024))
  const hop = Math.max(16, Math.floor(Number(o.hop) || 512))
  const bpmMin = Number(o.bpmMin) || BPM_MIN
  const bpmMax = Number(o.bpmMax) || BPM_MAX
  const empty = { bpm: 0, confidence: 0, candidates: [] }
  if (!samples || typeof samples.length !== 'number') return empty
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) return empty
  if (samples.length < win * 4) return empty // 过短：低置信度返回，不抛异常

  // 1) 能量包络（RMS）
  const env = energyEnvelopeOf(samples, win, hop)
  if (env.length < 8) return empty

  // 2) onset 强度：正差分半波整流 + 去均值/标准化
  const { onset, mean, std } = onsetStrengthOf(env)
  if (!(std > 1e-9)) return empty // 静音/恒定：无可感知节拍
  for (let i = 0; i < onset.length; i++) onset[i] = (onset[i] - mean) / std

  // 3) 自相关：滞后 = 60/BPM × 帧率，搜索 60-180 BPM 对应区间
  const frameRate = sampleRate / hop
  const minLag = Math.max(2, Math.floor(frameRate * 60 / bpmMax))
  const maxLag = Math.min(onset.length - 2, Math.ceil(frameRate * 60 / bpmMin))
  if (maxLag <= minLag) return empty
  const { r, lo, hi } = autocorrelationScoresOf(onset, minLag, maxLag)

  // 4) 局部极大值（平台去重）→ Top-3 → 抛物线插值细化峰位到亚帧精度
  const peaks = []
  for (let lag = lo + 1; lag < hi; lag++) {
    if (r[lag] > r[lag - 1] && r[lag] >= r[lag + 1] && r[lag] > 0) peaks.push({ lag, val: r[lag] })
  }
  if (!peaks.length) return empty
  peaks.sort((a, b) => b.val - a.val)

  const round1 = (x) => Math.round(x * 10) / 10
  const clampBpm = (x) => Math.min(bpmMax, Math.max(bpmMin, x))
  const cands = []
  for (const p of peaks.slice(0, 3)) {
    const l = p.lag
    const denom = r[l - 1] - 2 * r[l] + r[l + 1]
    let shift = 0
    if (denom !== 0) {
      const s = (0.5 * (r[l - 1] - r[l + 1])) / denom
      if (s > -1 && s < 1) shift = s
    }
    cands.push({ bpm: round1(clampBpm((60 * frameRate) / (l + shift))), score: p.val })
  }

  // 5) 置信度：主峰相对整个滞后区间分布的显著度（z 分数）启发式映射到 0..1
  let sumR = 0
  let sumR2 = 0
  const cnt = hi - lo + 1
  for (let lag = lo; lag <= hi; lag++) {
    sumR += r[lag]
    sumR2 += r[lag] * r[lag]
  }
  const meanR = sumR / cnt
  const stdR = Math.sqrt(Math.max(0, sumR2 / cnt - meanR * meanR))
  const z = stdR > 1e-9 ? (cands[0].score - meanR) / stdR : 0
  const confidence = Math.max(0, Math.min(1, (z - 2) / 4))

  const best = cands[0].score
  const candidates = cands.map((c) => ({ bpm: c.bpm, score: best > 0 ? c.score / best : 0 }))
  return { bpm: candidates[0].bpm, confidence, candidates }
}
// ==== PURE-FNS-END ====

// ---------- 页面状态 ----------
const fileInput = ref(null)
const fileInfo = ref(null) // { name, size, ext }
const duration = ref(0)
const sampleRate = ref(0)
const isDecoding = ref(false)
const isAnalyzing = ref(false)
const analyzeError = ref('')
const analyzeMs = ref(0)
const result = ref(null) // { bpm, confidence, candidates }；v-if 消费，不用 v-show
const displayBpm = ref(0)
const seoContentVisible = ref(true)

const octaveFactors = [
  { label: '0.5× 半速', value: 0.5 },
  { label: '1× 原速', value: 1 },
  { label: '2× 倍速', value: 2 }
]

// 非响应式大对象（AudioBuffer / Float32Array）
let audioBuffer = null

// ---------- 派生状态 ----------
const beatStats = computed(() => beatStatsOf(displayBpm.value))
const confidenceLabel = computed(() => {
  if (!result.value) return '—'
  const c = result.value.confidence
  return c >= 0.6 ? '较高' : (c >= 0.4 ? '中等' : (c >= 0.15 ? '偏低' : '极低'))
})
const confidenceTextClass = computed(() => {
  if (!result.value) return 'text-muted-foreground'
  const c = result.value.confidence
  return c >= 0.6 ? 'text-green-600 dark:text-green-400' : (c >= 0.4 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500')
})
const confidenceBarClass = computed(() => {
  if (!result.value) return 'bg-muted-foreground'
  const c = result.value.confidence
  return c >= 0.6 ? 'bg-green-500' : (c >= 0.4 ? 'bg-amber-500' : 'bg-red-500')
})

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
const triggerPick = () => { if (fileInput.value) fileInput.value.click() }

const formatTime = (t) => {
  const s = Math.max(0, Number(t) || 0)
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}:${r < 10 ? '0' : ''}${r.toFixed(1)}`
}
const formatSize = (n) => {
  if (!n) return '0 B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(2) + ' MB'
}

// 八度换算以检测主值为基准，按钮展示换算结果
const mainBpm = computed(() => (result.value ? result.value.bpm : 0))
const octaveValue = (factor) => (mainBpm.value > 0 ? (Math.round(mainBpm.value * factor * 10) / 10).toFixed(1) : '—')
const isOctaveActive = (factor) => {
  if (!mainBpm.value) return factor === 1
  return Math.abs(displayBpm.value - Math.round(mainBpm.value * factor * 10) / 10) < 0.05
}
const applyOctave = (factor) => {
  if (!mainBpm.value) return
  displayBpm.value = Math.round(mainBpm.value * factor * 10) / 10
}

function clearFile() {
  audioBuffer = null
  fileInfo.value = null
  duration.value = 0
  sampleRate.value = 0
  result.value = null
  displayBpm.value = 0
  analyzeError.value = ''
  analyzeMs.value = 0
}

onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

onBeforeUnmount(() => {
  audioBuffer = null
})

// ---------- 降混与检测（用户手势回调内创建 AudioContext，SSR 安全） ----------
// 多声道平均混缩为单声道（避免相位抵消干扰，逐声道累加后除以声道数）
function downmixToMono(buffer) {
  const n = buffer.length
  const chCount = Math.max(1, buffer.numberOfChannels)
  const out = new Float32Array(n)
  for (let c = 0; c < chCount; c++) {
    const data = buffer.getChannelData(c)
    for (let i = 0; i < n; i++) out[i] += data[i]
  }
  if (chCount > 1) {
    for (let i = 0; i < n; i++) out[i] /= chCount
  }
  return out
}

const onFileChange = async (e) => {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  isDecoding.value = true
  isAnalyzing.value = false
  analyzeError.value = ''
  result.value = null
  displayBpm.value = 0
  try {
    const arrayBuffer = await file.arrayBuffer()
    const ctx = new AudioContext()
    const buf = await ctx.decodeAudioData(arrayBuffer)
    await ctx.close()
    audioBuffer = buf
    const dot = file.name.lastIndexOf('.')
    const ext = dot >= 0 ? file.name.slice(dot + 1).toUpperCase() : '未知'
    fileInfo.value = { name: file.name, size: file.size, ext }
    duration.value = buf.duration
    sampleRate.value = buf.sampleRate

    if (buf.duration > 20 * 60) {
      analyzeError.value = '音频超过 20 分钟，请先裁剪到 8 分钟以内再分析（取副歌部分更准）'
      return
    }

    isAnalyzing.value = true
    await new Promise((r) => setTimeout(r, 0)) // 让出主线程刷新状态
    const mono = downmixToMono(buf)
    const t0 = (typeof performance !== 'undefined' ? performance : Date).now()
    const r = detectBpm(mono, buf.sampleRate)
    analyzeMs.value = Math.round((typeof performance !== 'undefined' ? performance : Date).now() - t0)
    result.value = r
    displayBpm.value = r.bpm
  } catch (err) {
    analyzeError.value = '解码失败：当前浏览器无法解析该音频文件，请尝试 mp3 / wav / m4a 格式'
  } finally {
    isDecoding.value = false
    isAnalyzing.value = false
  }
}
</script>
