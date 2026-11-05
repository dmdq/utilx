<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Video class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">延时摄影间隔计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">目标成片时长 × 帧率 → 拍摄间隔与总张数，支持反向由间隔推成片长度，附云层/日落/星空/车流/施工场景预设与 RAW/JPEG 存储卡容量估算</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线延时摄影间隔计算工具：按 间隔 = 拍摄总时长 ÷（成片秒数 × 帧率）正向算出拍摄间隔与总拍摄张数，
        也可反向输入间隔推算能剪出多长的成片；内置快速云层 1–2s、日落 3–5s、星空星轨 15–30s、车流 1–3s、
        施工数天 30–60s 场景预设，并按张数 × 单张体积（RAW/JPEG 口径）估算存储需求与 SD/CF 卡容量是否够用。
        参数全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <div class="flex items-start gap-2 mb-6 p-3 rounded-lg bg-muted/60 border border-border text-xs leading-relaxed text-muted-foreground">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>核心公式：间隔 = 拍摄总时长 ÷（成片秒数 × 帧率）。快门时间要短于间隔（建议不超过间隔的 2/3），否则相机来不及读完照片，间隔计时会被打乱。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Timer class="w-5 h-5 mr-2 text-primary" /> 拍摄参数
        </h2>

        <!-- 模式切换 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">计算方向</label>
          <div class="flex rounded-lg border border-border overflow-hidden">
            <button type="button" @click="mode = 'forward'" class="flex-1 px-3 py-2 text-xs font-medium transition" :class="mode === 'forward' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'">目标成片 → 间隔</button>
            <button type="button" @click="mode = 'reverse'" class="flex-1 px-3 py-2 text-xs font-medium transition" :class="mode === 'reverse' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'">已知间隔 → 成片</button>
          </div>
        </div>

        <!-- 成片时长（正向） -->
        <div v-if="mode === 'forward'">
          <label for="tl-clip" class="block text-sm font-medium text-foreground mb-1.5">目标成片时长（秒）</label>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <button
              v-for="c in CLIP_CHIPS"
              :key="c"
              type="button"
              @click="clipInput = c"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="clip === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >
              {{ c }}s
            </button>
          </div>
          <div class="flex items-center gap-2">
            <input id="tl-clip" v-model.number="clipInput" type="number" step="0.1" min="0.5" max="3600" class="w-28 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-xs text-muted-foreground">秒（成片剪出来的长度）</span>
          </div>
        </div>

        <!-- 间隔（反向） -->
        <div v-if="mode === 'reverse'">
          <label for="tl-interval" class="block text-sm font-medium text-foreground mb-1.5">拍摄间隔（秒）</label>
          <div class="flex items-center gap-2">
            <input id="tl-interval" v-model.number="intervalInput" type="number" step="0.1" min="0.1" max="86400" class="w-28 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-xs text-muted-foreground">秒（快门间隔计时器里设的值）</span>
          </div>
        </div>

        <!-- 帧率 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">成片帧率</label>
          <div class="flex gap-1.5">
            <button
              v-for="f in FPS_CHOICES"
              :key="f"
              type="button"
              @click="fps = f"
              class="flex-1 px-3 py-1.5 rounded-md text-xs font-medium border transition"
              :class="fps === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >
              {{ f }} fps
            </button>
          </div>
        </div>

        <!-- 拍摄总时长 -->
        <div>
          <label for="tl-total" class="block text-sm font-medium text-foreground mb-1.5">拍摄总时长（事件持续时间）</label>
          <div class="flex items-center gap-2">
            <input id="tl-total" v-model.number="totalInput" type="number" step="0.1" min="0.01" class="flex-1 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <div class="flex rounded-lg border border-border overflow-hidden">
              <button type="button" @click="totalUnit = 's'" class="px-3 py-1.5 text-xs font-medium" :class="totalUnit === 's' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'">秒</button>
              <button type="button" @click="totalUnit = 'min'" class="px-3 py-1.5 text-xs font-medium" :class="totalUnit === 'min' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'">分</button>
              <button type="button" @click="totalUnit = 'h'" class="px-3 py-1.5 text-xs font-medium" :class="totalUnit === 'h' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'">时</button>
              <button type="button" @click="totalUnit = 'd'" class="px-3 py-1.5 text-xs font-medium" :class="totalUnit === 'd' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'">天</button>
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">如「拍 2 小时的日落」就填 2 + 时；跨天施工用天。</p>
        </div>

        <!-- 场景预设卡 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">场景间隔预设（点击填入反向计算）</p>
          <div class="space-y-2">
            <button
              v-for="p in SCENE_PRESETS"
              :key="p.id"
              type="button"
              @click="applyPreset(p)"
              class="w-full flex items-start gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-left transition"
            >
              <component :is="p.icon" class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span class="text-xs leading-relaxed">
                <span class="text-foreground font-medium">{{ p.label }}：{{ p.range }}</span>
                <span class="block text-muted-foreground">{{ p.note }}</span>
              </span>
            </button>
          </div>
        </div>

        <button type="button" @click="resetAll" class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition">
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认参数
        </button>

        <div v-if="validationIssues.length" class="space-y-1.5">
          <p v-for="issue in validationIssues" :key="issue" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ issue }}</span>
          </p>
        </div>
      </div>

      <!-- 右：结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 主结果卡 -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-card border border-primary/40 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">拍摄间隔</p>
            <p class="text-2xl lg:text-3xl font-bold text-primary font-mono">{{ intervalText }}</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">总拍摄张数</p>
            <p class="text-xl lg:text-2xl font-bold text-foreground font-mono">{{ framesText }}</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">成片时长</p>
            <p class="text-xl lg:text-2xl font-bold text-foreground font-mono">{{ clipText }}</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">时间压缩倍数</p>
            <p class="text-xl lg:text-2xl font-bold text-foreground font-mono">{{ compressionText }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">间隔 × 帧率</p>
          </div>
        </div>

        <!-- 节奏明细卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Film class="w-5 h-5 mr-2 text-primary" /> 节奏明细
          </h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">成片帧数（成片秒 × 帧率）</span>
              <span class="font-semibold text-foreground font-mono">{{ clipFramesText }} 帧</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">成片 1 秒代表的实拍时间</span>
              <span class="font-semibold text-foreground font-mono">{{ perClipSecondText }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">实际需要拍摄的时长（张数 × 间隔）</span>
              <span class="font-semibold text-foreground font-mono">{{ actualDurationText }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">建议快门时间上限（间隔 × 2/3）</span>
              <span class="font-semibold text-foreground font-mono">{{ maxShutterText }}</span>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            间隔由运动速度倒推：先决定「成片里主体每秒该走多远」，再按压缩倍数折回实拍节奏。
            间隔过短（低于 1s）多数单反 / 无反的间隔计时器不支持，且快门寿命消耗大；间隔过长则成片会一跳一跳的。
          </p>
        </div>

        <!-- 存储估算卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <HardDrive class="w-5 h-5 mr-2 text-primary" /> 存储估算与卡容量判定
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label for="tl-format" class="block text-xs font-medium text-muted-foreground mb-1">文件格式口径</label>
              <select id="tl-format" v-model="formatChoice" class="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option v-for="f in FORMAT_PRESETS" :key="f.id" :value="f.id">{{ f.label }}（典型 {{ f.typical }}）</option>
                <option value="__custom">自定义单张体积…</option>
              </select>
            </div>
            <div>
              <label for="tl-size" class="block text-xs font-medium text-muted-foreground mb-1">单张体积（MB）</label>
              <input id="tl-size" v-model.number="sizeInput" type="number" step="0.5" min="0.5" max="500" class="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label for="tl-card" class="block text-xs font-medium text-muted-foreground mb-1">存储卡容量</label>
              <select id="tl-card" v-model.number="cardGb" class="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option v-for="c in CARD_OPTIONS" :key="c" :value="c">{{ c }} GB</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="p-3 bg-muted/50 rounded-lg text-center">
              <p class="text-[11px] text-muted-foreground mb-1">总占用</p>
              <p class="text-lg font-bold text-foreground font-mono">{{ storageGbText }}</p>
            </div>
            <div class="p-3 bg-muted/50 rounded-lg text-center">
              <p class="text-[11px] text-muted-foreground mb-1">占卡容量</p>
              <p class="text-lg font-bold text-foreground font-mono">{{ cardUsageText }}</p>
            </div>
            <div class="p-3 rounded-lg text-center" :class="cardFits ? 'bg-green-500/10' : 'bg-red-500/10'">
              <p class="text-[11px] text-muted-foreground mb-1">容量判定</p>
              <p class="text-sm font-bold" :class="cardFits ? 'text-green-600' : 'text-red-600'">{{ cardFits ? '一张卡够拍' : '一张卡不够' }}</p>
            </div>
            <div class="p-3 bg-muted/50 rounded-lg text-center">
              <p class="text-[11px] text-muted-foreground mb-1">该卡可拍张数</p>
              <p class="text-lg font-bold text-foreground font-mono">{{ capacityFramesText }}</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            {{ cardFits
              ? `按 ${size}MB/张估算，${cardGb}GB 卡装下全部 ${framesText} 张后还剩约 ${cardRemainText} 张余量。`
              : `按 ${size}MB/张估算，${cardGb}GB 卡只能拍 ${capacityFramesText} 张，还差约 ${cardShortText} 张——换大卡、降为 JPEG 或中途换卡。` }}
            实际单张体积随画质档位、机位噪点波动，建议按 1.2 倍冗余规划。
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>延时摄影间隔怎么定？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          延时间隔（interval）是两张照片之间等待的时间，它和成片时长、帧率由一个公式锁死：
          <b class="text-foreground">间隔 = 拍摄总时长 ÷（成片秒数 × 帧率）</b>。
          例：拍 2 小时（7200 秒）的云，想要 30 秒、25fps 的成片，需要 30 × 25 = 750 帧，间隔 = 7200 ÷ 750 = 9.6 秒。
          反过来，间隔定了成片长度也就定了：间隔 5 秒拍 2 小时，共 1440 张，25fps 下成片 57.6 秒。
          经验上由运动速度倒推更直观：先决定「成片里主体每秒该走多远」（云 1–2s、日落 3–5s、星轨 15–30s、车流 1–3s、施工数天档 30–60s），
          再看实拍总时长够不够；快门时间不要超过间隔的 2/3，给相机留出写入时间。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Holy Grail 日转夜怎么拍？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          「圣杯延时」指从白天连续拍到黑夜，难点是光比横跨十几档。常用两招：
          一是<b class="text-foreground">固定间隔 + 后期去闪烁</b>——间隔全程不变（日落场景 3–5s），曝光交给光圈优先自动档，后期用 LRTimelapse / deflicker 平滑亮度跳变；
          二是<b class="text-foreground">分段设档</b>——白天段间隔 5s、黄昏段 2–3s、夜晚段 15–30s，切档时手动过渡曝光。
          特别注意：太阳贴近地平线时天色变化最快，要把间隔从 3–5s 缩短到 1–2s 才能留住色彩层次；
          夜段曝光拉长到 15s 以上时，务必确认「快门 + 间隔」之和小于间隔计时值，否则相机来不及拍下一张。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">帧率与节奏：24 / 25 / 30 怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          帧率决定成片的节奏密度：同样的张数，24fps 剪出的成片最长、节奏最从容（电影感），25fps 对应 PAL 电视口径，
          30fps 更快更「顺滑」，适合网络短片。帧率翻倍 = 同样素材成片时长减半、压缩倍数翻倍——
          例如 750 张在 25fps 下成片 30 秒，在 30fps 下成片 25 秒。本工具支持 24/25/30 三档，
          拍完的素材在时间线上嫌太长或太快，不必回炉重拍：换帧率重新解读即可，张数不变。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">与站内视频工具的分工</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本工具只负责「开拍之前」的参数决策：间隔、张数、成片长度与存储规划。
          拍完之后的后期属于站内其他工具的活——粗剪去头去尾、截取最佳片段用
          <NuxtLink to="/tools/video-trimmer" class="text-primary hover:underline">视频裁剪器</NuxtLink>（本地重编码导出，不上传），
          延时序列导出的成片需要变速、抽帧或配乐时同样可以在站内的视频与音频工具里完成，全程纯本地计算。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">间隔设 0.5 秒可以吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              多数单反 / 无反的内置间隔计时最低 1 秒，且 RAW 写入时间可能超过 0.5s 导致漏拍；
              确实需要亚秒级间隔（快速云、爆闪人群）应使用支持高速连拍的机型或电子快门连拍后合成。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">拍星轨间隔要多大？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              星轨通常 15–30s 间隔：单张长曝 15–25s（或堆栈法用 20–30s 高感短曝），间隔加 2–5s 写入余量。
              想要连续无断点的星轨线条，让「快门 + 间隔」尽量接近星星移动 1–2 个像素的时间即可。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">存储按 RAW 还是 JPEG 估算？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              高画质需求（日落大光比、夜景堆栈）选 RAW，全画幅典型 25–50MB/张；JPEG Fine 典型 5–12MB/张。
              本工具默认 RAW 30MB / JPEG 8MB，可自定义单张体积，并按 1.2 倍冗余提示换卡风险。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算结果会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不会。间隔、张数与存储估算全部在你的浏览器内即时算出，无网络请求；参数仅保存在本机 localStorage 供下次访问恢复。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'timelapse-interval'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Video, Timer, Film, HardDrive, Cloud, Sun, Star, Car, Construction,
  RefreshCw, TriangleAlert, ChevronUp, ChevronDown, Info
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '延时摄影间隔计算器 - 拍摄间隔与张数在线换算',
  description: '免费在线延时摄影间隔计算：按目标成片时长与帧率算拍摄间隔和总张数，反向由间隔推成片长度，附云层日落星空车流施工场景预设、Holy Grail 日转夜提示与 RAW/JPEG 存储卡容量估算，纯浏览器本地计算不上传',
  keywords: '延时摄影间隔,延时摄影计算,timelapse calculator,拍摄间隔,日落延时,星轨间隔',
  author: '有条工具',
  ogTitle: '延时摄影间隔计算器 - 拍摄间隔与张数在线换算 | 有条工具',
  ogDescription: '输入成片时长与帧率即时算出拍摄间隔与总张数，场景预设与存储估算一步到位。',
  ogUrl: 'https://www.util.cn/tools/timelapse-interval',
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
          name: '延时摄影间隔计算器',
          url: 'https://www.util.cn/tools/timelapse-interval',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['目标成片→间隔正向计算', '已知间隔→成片反向计算', '24/25/30fps 帧率切换', '云层/日落/星空/车流/施工场景预设', '时间压缩倍数与快门上限提示', 'RAW/JPEG 存储估算与卡容量判定', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '延时摄影间隔计算器', item: 'https://www.util.cn/tools/timelapse-interval' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '延时摄影间隔怎么定？',
              acceptedAnswer: { '@type': 'Answer', text: '间隔 = 拍摄总时长 ÷（成片秒数 × 帧率）。也可由运动速度倒推：快速云层 1–2s、日落 3–5s、星轨 15–30s、车流 1–3s、施工数天档 30–60s。' }
            },
            {
              '@type': 'Question',
              name: 'Holy Grail 日转夜怎么拍？',
              acceptedAnswer: { '@type': 'Answer', text: '固定间隔交给光圈优先自动曝光，后期去闪烁；或按日段/黄昏/夜段分段设间隔与曝光。太阳贴近地平线时把间隔从 3–5s 缩到 1–2s。' }
            },
            {
              '@type': 'Question',
              name: '帧率 24/25/30 怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '24fps 电影感、25fps PAL 电视口径、30fps 更顺滑适合网络。同样张数下帧率越高成片越短、节奏越快；换帧率不改变所需张数。' }
            },
            {
              '@type': 'Question',
              name: '计算结果会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。间隔、张数与存储估算全部在浏览器内即时算出，无网络请求；参数仅保存在本机 localStorage 供下次访问恢复。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯函数（可独立单测） ----------
// 口径：间隔 = 总时长 ÷（成片秒 × 帧率）；总张数 = 成片秒 × 帧率（正向）。
// 反向：张数 = 总时长 ÷ 间隔（四舍五入到整数张），成片时长 = 张数 ÷ 帧率。
// 时间压缩倍数 = 间隔 × 帧率；存储总占用 = 张数 × 单张体积。

function clampNum(v, lo, hi) {
  const n = Number(v)
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, n))
}

function fmtOf(v, d = 2) {
  return Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—'
}

// 正向：成片秒 × 帧率 → 总张数（帧）
function framesForClipOf(clipSec, fps) {
  if (!(clipSec > 0) || !(fps > 0)) return NaN
  return clipSec * fps
}

// 正向：总时长 ÷（成片秒 × 帧率）→ 间隔（秒）
function intervalForClipOf(totalSec, clipSec, fps) {
  const frames = framesForClipOf(clipSec, fps)
  if (!Number.isFinite(frames) || frames <= 0) return NaN
  return totalSec / frames
}

// 反向：总时长 ÷ 间隔 → 张数（取整）与成片时长（张数 ÷ 帧率）
function clipFromIntervalOf(totalSec, intervalSec, fps) {
  if (!(totalSec > 0) || !(intervalSec > 0) || !(fps > 0)) return { frames: NaN, clip: NaN }
  const frames = Math.round(totalSec / intervalSec)
  return { frames, clip: frames / fps }
}

// 时间压缩倍数 = 间隔 × 帧率
function compressionFactorOf(intervalSec, fps) {
  if (!(intervalSec > 0) || !(fps > 0)) return NaN
  return intervalSec * fps
}

// 存储估算：总占用 MB = 张数 × 单张体积；GB = MB ÷ 1024；卡可拍张数 = floor(卡容量 × 1024 ÷ 单张体积)
function storageOf(frames, mbPerFrame, cardGb) {
  if (!(frames > 0) || !(mbPerFrame > 0)) return { totalMb: NaN, totalGb: NaN, capacityFrames: NaN }
  const totalMb = frames * mbPerFrame
  const capacityFrames = Number.isFinite(cardGb) && cardGb > 0 ? Math.floor(cardGb * 1024 / mbPerFrame) : NaN
  return { totalMb, totalGb: totalMb / 1024, capacityFrames }
}

// ---------- 常量 ----------
const FPS_CHOICES = [24, 25, 30]
const CLIP_CHIPS = [5, 10, 15, 20, 30, 60]
const CARD_OPTIONS = [32, 64, 128, 256, 512]
const FORMAT_PRESETS = [
  { id: 'raw', label: 'RAW', mb: 30, typical: '25–50MB/张' },
  { id: 'jpeg', label: 'JPEG 高画质', mb: 8, typical: '5–12MB/张' }
]
const SCENE_PRESETS = [
  { id: 'clouds', label: '快速云层', range: '1–2s', value: 1.5, note: '云移动快，间隔短才连贯', icon: Cloud },
  { id: 'sunset', label: '日落', range: '3–5s', value: 4, note: '太阳贴近地平线时缩短到 1–2s', icon: Sun },
  { id: 'stars', label: '星空 / 星轨', range: '15–30s', value: 20, note: '长曝后加 2–5s 写入余量', icon: Star },
  { id: 'traffic', label: '车流', range: '1–3s', value: 2, note: '与曝光时长匹配拉出车灯轨迹', icon: Car },
  { id: 'build', label: '施工 / 数天档', range: '30–60s', value: 45, note: '固定机位数天，注意供电与防抖', icon: Construction }
]

// ---------- 响应式参数 ----------
const TOOL_ID = 'timelapse-interval'
const mode = ref('forward') // 'forward' | 'reverse'
const clipInput = ref(30)
const intervalInput = ref(5)
const fps = ref(25)
const totalInput = ref(2)
const totalUnit = ref('h')
const formatChoice = ref('raw')
const sizeInput = ref(30)
const cardGb = ref(128)
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const UNIT_SECONDS = { s: 1, min: 60, h: 3600, d: 86400 }
const clip = computed(() => clampNum(Number(clipInput.value), 0.5, 3600))
const interval = computed(() => clampNum(Number(intervalInput.value), 0.1, 86400))
const totalSec = computed(() => {
  const raw = Number(totalInput.value)
  if (!Number.isFinite(raw) || raw <= 0) return NaN
  return raw * UNIT_SECONDS[totalUnit.value]
})
const size = computed(() => clampNum(Number(sizeInput.value), 0.5, 500))

const validationIssues = computed(() => {
  const list = []
  if (!Number.isFinite(totalSec.value)) list.push('拍摄总时长无效，请输入正数')
  if (mode.value === 'forward' && (Number(clipInput.value) < 0.5 || Number(clipInput.value) > 3600)) list.push(`成片时长超出 0.5 ~ 3600s 范围，已按 ${clip.value}s 计算`)
  if (mode.value === 'reverse' && (Number(intervalInput.value) < 0.1 || Number(intervalInput.value) > 86400)) list.push(`间隔超出 0.1 ~ 86400s 范围，已按 ${interval.value}s 计算`)
  if (Number.isFinite(totalSec.value)) {
    if (mode.value === 'forward' && Number.isFinite(intervalRaw.value) && intervalRaw.value < 1 && intervalRaw.value > 0) list.push(`间隔 ${fmtOf(intervalRaw.value, 2)}s 低于 1s，多数相机间隔计时器不支持，建议加长成片或压缩总时长`)
    if (mode.value === 'reverse' && clipFromIntervalOf(totalSec.value, interval.value, fps.value).frames < 1) list.push('间隔太长：整段拍不满一帧，请缩短间隔或总时长')
  }
  return list
})

// ---------- 计算结果 ----------
const intervalRaw = computed(() => (mode.value === 'forward'
  ? intervalForClipOf(totalSec.value, clip.value, fps.value)
  : Number(intervalInput.value)))
const frames = computed(() => (mode.value === 'forward'
  ? framesForClipOf(clip.value, fps.value)
  : (Number.isFinite(totalSec.value) && Number.isFinite(interval.value) && interval.value > 0 ? Math.round(totalSec.value / interval.value) : NaN)))
const clipResult = computed(() => (mode.value === 'forward'
  ? clip.value
  : (Number.isFinite(frames.value) ? frames.value / fps.value : NaN)))
const compression = computed(() => compressionFactorOf(
  mode.value === 'forward' ? intervalRaw.value : interval.value,
  fps.value
))
const intervalResult = computed(() => (mode.value === 'forward' ? intervalRaw.value : interval.value))
const actualDurationSec = computed(() => (Number.isFinite(frames.value) && Number.isFinite(intervalResult.value)
  ? frames.value * intervalResult.value
  : NaN))
const clipFrames = computed(() => (Number.isFinite(clipResult.value) ? clipResult.value * fps.value : NaN))

const intervalText = computed(() => (Number.isFinite(intervalResult.value) ? `${fmtOf(intervalResult.value, 2)} s` : '—'))
const framesText = computed(() => (Number.isFinite(frames.value) ? `${fmtOf(frames.value, 0)} 张` : '—'))
const clipText = computed(() => (Number.isFinite(clipResult.value) ? `${fmtOf(clipResult.value, 2)} s` : '—'))
const compressionText = computed(() => (Number.isFinite(compression.value) ? `${fmtOf(compression.value, 1)}×` : '—'))
const clipFramesText = computed(() => (Number.isFinite(clipFrames.value) ? fmtOf(clipFrames.value, 0) : '—'))
const perClipSecondText = computed(() => (Number.isFinite(compression.value) ? `${fmtOf(compression.value, 1)} s` : '—'))
const actualDurationText = computed(() => {
  const s = actualDurationSec.value
  if (!Number.isFinite(s)) return '—'
  if (s >= 86400) return `${fmtOf(s / 86400, 2)} 天`
  if (s >= 3600) return `${fmtOf(s / 3600, 2)} 小时`
  if (s >= 60) return `${fmtOf(s / 60, 2)} 分钟`
  return `${fmtOf(s, 1)} 秒`
})
const maxShutterText = computed(() => (Number.isFinite(intervalResult.value) ? `${fmtOf(intervalResult.value * 2 / 3, 2)} s` : '—'))

// 存储估算
const storage = computed(() => storageOf(frames.value, size.value, cardGb.value))
const cardFits = computed(() => Number.isFinite(storage.value.capacityFrames) && Number.isFinite(frames.value) && storage.value.capacityFrames >= frames.value)
const storageGbText = computed(() => (Number.isFinite(storage.value.totalGb) ? `${fmtOf(storage.value.totalGb, 2)} GB` : '—'))
const cardUsageText = computed(() => {
  if (!Number.isFinite(storage.value.totalMb) || !Number.isFinite(cardGb.value) || cardGb.value <= 0) return '—'
  return `${fmtOf(storage.value.totalMb / (cardGb.value * 1024) * 100, 1)}%`
})
const capacityFramesText = computed(() => (Number.isFinite(storage.value.capacityFrames) ? fmtOf(storage.value.capacityFrames, 0) : '—'))
const cardRemainText = computed(() => (cardFits.value && Number.isFinite(storage.value.capacityFrames) ? fmtOf(storage.value.capacityFrames - frames.value, 0) : '—'))
const cardShortText = computed(() => (!cardFits.value && Number.isFinite(storage.value.capacityFrames) ? fmtOf(frames.value - storage.value.capacityFrames, 0) : '—'))

// ---------- 交互动作 ----------
function applyPreset(p) {
  mode.value = 'reverse'
  intervalInput.value = p.value
}

function resetAll() {
  mode.value = 'forward'
  clipInput.value = 30
  intervalInput.value = 5
  fps.value = 25
  totalInput.value = 2
  totalUnit.value = 'h'
  formatChoice.value = 'raw'
  sizeInput.value = 30
  cardGb.value = 128
}

// 单张体积随格式口径联动（自定义除外；恢复本地设置阶段不联动）
let settingsLoaded = false
watch(formatChoice, (id) => {
  if (!settingsLoaded) return
  const f = FORMAT_PRESETS.find((x) => x.id === id)
  if (f) sizeInput.value = f.mb
})

// ---------- 设置持久化（localStorage，键前缀用工具 id） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(`${TOOL_ID}-settings`)
    if (!saved) return
    const s = JSON.parse(saved)
    if (s.mode === 'forward' || s.mode === 'reverse') mode.value = s.mode
    if (Number.isFinite(s.clip) && s.clip >= 0.5 && s.clip <= 3600) clipInput.value = s.clip
    if (Number.isFinite(s.interval) && s.interval >= 0.1 && s.interval <= 86400) intervalInput.value = s.interval
    if (FPS_CHOICES.includes(s.fps)) fps.value = s.fps
    if (Number.isFinite(s.total) && s.total > 0) totalInput.value = s.total
    if (['s', 'min', 'h', 'd'].includes(s.totalUnit)) totalUnit.value = s.totalUnit
    if (typeof s.formatChoice === 'string' && (s.formatChoice === '__custom' || FORMAT_PRESETS.some((f) => f.id === s.formatChoice))) formatChoice.value = s.formatChoice
    if (Number.isFinite(s.size) && s.size >= 0.5 && s.size <= 500) sizeInput.value = s.size
    if (CARD_OPTIONS.includes(s.cardGb)) cardGb.value = s.cardGb
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([mode, clipInput, intervalInput, fps, totalInput, totalUnit, formatChoice, sizeInput, cardGb], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(`${TOOL_ID}-settings`, JSON.stringify({
      mode: mode.value,
      clip: clipInput.value,
      interval: intervalInput.value,
      fps: fps.value,
      total: totalInput.value,
      totalUnit: totalUnit.value,
      formatChoice: formatChoice.value,
      size: sizeInput.value,
      cardGb: cardGb.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
  settingsLoaded = true
})
</script>
