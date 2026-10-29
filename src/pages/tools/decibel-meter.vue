<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Volume2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">噪音分贝检测</h1>
          <p class="text-sm text-muted-foreground mt-1">麦克风实时声级检测，dB 曲线与最大/平均值，噪声等级对照参考</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线噪音分贝检测工具：点击开始后调用麦克风实时分析环境声音，滚动展示最近 30 秒的声级 dB 曲线，并统计本次检测的最大 / 平均 / 最小值，附噪声等级对照表帮你判断当前环境吵不吵。
        所有音频只在你的浏览器内存中本地采集计算，<strong class="text-foreground">不上传、不录音保存</strong>。注意：结果为浏览器估算值，未经计量校准，不能替代专业声级计。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：控制面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Gauge class="w-5 h-5 mr-2 text-primary" /> 检测控制
        </h2>

        <div class="text-xs text-muted-foreground space-y-1">
          <p v-if="checked">
            <span class="text-foreground">当前浏览器：</span>{{ micSupported ? '支持麦克风声级检测' : '不支持麦克风采集（需 HTTPS 或 localhost）' }}
          </p>
          <p>点击「开始检测」后浏览器会请求麦克风权限，我们只读取音量大小，不录制保存任何声音。</p>
        </div>

        <!-- 开始 / 停止 -->
        <button
          v-if="!isRunning"
          @click="startDetection"
          class="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Play class="w-4 h-4" /> 开始检测
        </button>
        <button
          v-else
          @click="stopDetection"
          class="w-full bg-destructive text-white hover:bg-destructive/90 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Square class="w-4 h-4" /> 停止检测
        </button>

        <!-- 运行状态 -->
        <div v-if="isRunning" class="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-destructive animate-pulse flex-shrink-0"></span>
          <p class="text-xs text-muted-foreground">正在采集中 · 点击「停止检测」会立即释放麦克风</p>
        </div>

        <!-- 错误提示与解决指引 -->
        <div v-if="errorMessage" class="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-2">
          <div class="flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p class="text-xs text-destructive leading-relaxed">{{ errorMessage }}</p>
          </div>
          <div v-if="errorGuide.length" class="bg-background/60 rounded p-2.5">
            <p class="text-xs font-medium text-foreground mb-1">可以这样解决：</p>
            <ol class="list-decimal list-inside space-y-1 text-xs text-muted-foreground leading-relaxed">
              <li v-for="(gItem, gi) in errorGuide" :key="gi">{{ gItem }}</li>
            </ol>
          </div>
        </div>

        <!-- 隐私说明 -->
        <div class="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
          <ShieldCheck class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            隐私承诺：音频仅在你的浏览器内存中实时计算声级，<span class="text-foreground">不上传服务器、不录音保存、页面关闭即消失</span>。
          </p>
        </div>

        <!-- 免责提示 -->
        <p class="text-[11px] text-muted-foreground leading-relaxed">
          本工具显示的声压级为浏览器估算值，未经计量校准，不能替代专业声级计，不可用于职业卫生检测、环保投诉取证或任何有合规要求的场景。
        </p>
      </div>

      <!-- 右侧：实时读数与曲线（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Activity class="w-5 h-5 mr-2 text-primary" /> 实时声级
          </h2>
          <span
            v-if="currentTierIndex >= 0"
            class="px-2.5 py-1 rounded-full text-xs font-medium"
            :class="tierChipClass(currentTierIndex)"
          >
            {{ NOISE_TIERS[currentTierIndex].name }} · {{ NOISE_TIERS[currentTierIndex].range }} dB
          </span>
        </div>

        <!-- 当前 dB 大数字 -->
        <div class="bg-primary/5 rounded-lg p-6 text-center">
          <p class="text-xs text-muted-foreground mb-1">当前声级（估算）</p>
          <p class="text-6xl font-mono font-bold tabular-nums" :class="bigNumberClass">
            {{ currentDbText }}
            <span class="text-xl font-sans font-medium text-muted-foreground ml-1">dB</span>
          </p>
          <p class="text-[11px] text-muted-foreground mt-2">
            浏览器估算值，未经计量校准，不能替代专业声级计
          </p>
        </div>

        <!-- 滚动曲线 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-foreground">最近 30 秒 dB 曲线</p>
            <p class="text-xs text-muted-foreground">横轴：越靠右越新 · 纵轴：dB（估算）</p>
          </div>
          <canvas ref="canvasEl" class="w-full h-[280px] bg-background border border-border rounded-lg"></canvas>
        </div>

        <!-- 本次会话统计 -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground mb-1">最大值</p>
            <p class="text-xl font-mono font-bold text-destructive">{{ maxDbText }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground mb-1">平均值</p>
            <p class="text-xl font-mono font-bold text-foreground">{{ avgDbText }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground mb-1">最小值</p>
            <p class="text-xl font-mono font-bold text-primary">{{ minDbText }}</p>
          </div>
        </div>
        <p class="text-[11px] text-muted-foreground">
          统计为本次检测期间（自点击「开始检测」起）的累计结果；重新开始会自动清零。
        </p>
      </div>
    </div>

    <!-- 噪声等级对照表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold mb-1 flex items-center">
        <Ear class="w-5 h-5 mr-2 text-primary" /> 噪声等级对照参考
      </h2>
      <p class="text-xs text-muted-foreground mb-4">开始检测后，当前读数落在的档位会实时高亮；数值为通用参考，个体感受因环境与频率不同会有差异。</p>
      <div class="space-y-2">
        <div
          v-for="(tier, ti) in NOISE_TIERS"
          :key="tier.name"
          class="flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-all"
          :class="currentTierIndex === ti
            ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
            : 'border-border bg-muted/30'"
        >
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :class="tier.dotClass"></span>
          <span class="font-mono text-sm font-semibold text-foreground w-28 flex-shrink-0">{{ tier.range }} dB</span>
          <span
            class="text-sm font-medium w-32 flex-shrink-0"
            :class="currentTierIndex === ti ? 'text-primary' : 'text-foreground'"
          >{{ tier.name }}</span>
          <span class="text-xs text-muted-foreground">{{ tier.example }}</span>
        </div>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <HeartPulse class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        健康提示：85dB 以上长期暴露会造成不可逆的听力损伤（一般以每日 8 小时为上限，声级每增加 3dB 建议暴露时间减半）；若检测结果显示环境经常超过 85dB，建议佩戴耳塞或减少停留时间。
        本工具结果为浏览器估算值，未经计量校准，不能替代专业声级计，如有听力不适请及时就医。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>噪音分贝检测是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          噪音分贝检测是一款在线声级估算工具。它通过浏览器 getUserMedia 获取麦克风音频，用 Web Audio API 的 AnalyserNode 逐帧计算波形均方根（RMS），
          再按 dBFS + 94dB 的经验换算得到估算声压级，实时绘制最近 30 秒的滚动曲线，并统计本次检测的最大 / 平均 / 最小值，配合噪声等级对照表帮你快速判断当前环境是安静、正常交谈还是已经到了需要护耳的程度。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">适合哪些场景？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>想知道卧室、书房深夜噪音大概多少分贝，判断是否影响睡眠。</li>
          <li>租房、买隔音窗前后对比室内外噪音变化，做相对粗略的参考。</li>
          <li>办公室、咖啡馆挑座位，或给宝宝房间做个简单的环境吵闹程度评估。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">读数是怎么算出来的？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          浏览器只能拿到归一化的数字音频（-1 到 1），本工具先对每帧采样求均方根（RMS），换算成数字满幅相对值 dBFS（20·log10(RMS)），
          再加上 94dB 的经验偏移得到估算声压级。这个偏移假设麦克风满幅输入约对应 94dB 声压，因此结果受设备增益、自动增益控制（AGC）与频响影响，
          <strong class="text-foreground">是浏览器估算值，未经计量校准，不能替代专业声级计</strong>，更适合用来观察相对变化趋势。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">使用建议</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>检测时把设备麦克风朝向声源、不要遮挡，手机不要放在口袋或桌面软垫上。</li>
          <li>建议每次持续检测 30 秒以上，用「平均值」代表整体水平、「最大值」反映突发噪音。</li>
          <li>若读数一直贴着 0 dB，可能是权限未授予、麦克风被遮挡，或系统把输入静音了。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">手机上能用吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">可以。安卓 Chrome / Edge 与较新版本的 iOS Safari 都支持麦克风采集，但手机麦克风普遍开启自动增益（AGC），读数稳定性略差；建议横放平稳、远离机身遮挡，以平均值做参考。检测需在 HTTPS 或 localhost 环境下进行。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">测出来的分贝准不准？</h3>
            <p class="text-sm text-muted-foreground mt-1">仅供参考。结果是浏览器估算值，未经计量校准，受麦克风灵敏度、自动增益、距离与反射等因素影响，与专业声级计相比误差可达 ±10dB 甚至更多。它适合判断「大概多吵、是变吵了还是变安静了」，不能替代经检定的声级计用于职业卫生、环保监测等正式场合。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">85dB 标准是什么意思？</h3>
            <p class="text-sm text-muted-foreground mt-1">85dB 是常见的职业听力保护限值：在此声级下每日暴露不宜超过 8 小时；按等能量原则声级每增加 3dB，建议暴露时间减半（如 88dB 约 4 小时、91dB 约 2 小时）。长期在 85dB 以上环境生活或工作，建议佩戴护耳器具并定期检查听力。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'decibel-meter'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Volume2, Gauge, Play, Square, Activity, Ear,
  TriangleAlert, ShieldCheck, HeartPulse, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '噪音分贝检测 - 在线分贝仪/声级计测环境噪音 | 有条工具',
  description: '在线噪音分贝检测工具，麦克风实时估算环境声级，最近30秒滚动dB曲线与最大/平均/最小值统计，内置噪声等级对照表，本地采集不上传。浏览器估算值，未经计量校准，不能替代专业声级计。',
  keywords: '分贝仪,在线噪音检测,声级计,环境噪音测试,房间噪音多少分贝,噪音分贝对照表',
  author: '有条工具',
  ogTitle: '噪音分贝检测 - 在线分贝仪/声级计测环境噪音 | 有条工具',
  ogDescription: '麦克风实时检测环境噪音分贝，滚动dB曲线与最大/平均值统计，噪声等级对照参考，本地采集不上传。',
  ogUrl: 'https://www.util.cn/tools/decibel-meter',
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
          name: '噪音分贝检测',
          url: 'https://www.util.cn/tools/decibel-meter',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['麦克风实时声级估算', '最近30秒滚动dB曲线', '最大/平均/最小值统计', '噪声等级对照实时高亮', '权限被拒友好指引', '本地采集不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '健康工具', item: 'https://www.util.cn/health/' },
            { '@type': 'ListItem', position: 3, name: '噪音分贝检测', item: 'https://www.util.cn/tools/decibel-meter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '手机上能用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以。安卓 Chrome/Edge 与较新的 iOS Safari 都支持，但手机麦克风普遍开启自动增益，建议以平均值做参考；检测需在 HTTPS 或 localhost 环境下进行。' }
            },
            {
              '@type': 'Question',
              name: '测出来的分贝准不准？',
              acceptedAnswer: { '@type': 'Answer', text: '结果是浏览器估算值，未经计量校准，受麦克风灵敏度、自动增益与距离影响，误差可达±10dB以上，适合观察相对变化，不能替代专业声级计用于正式场合。' }
            },
            {
              '@type': 'Question',
              name: '85dB 标准是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '85dB 是常见的职业听力保护限值，每日暴露不宜超过8小时；声级每增加3dB建议暴露时间减半。长期处于85dB以上环境建议佩戴护耳器具并定期检查听力。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯函数区（node 可独立单测） ----------

// 波形采样 → RMS 均方根
function computeRms(samples) {
  if (!samples || !samples.length) return 0
  let sum = 0
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i]
  }
  return Math.sqrt(sum / samples.length)
}

// RMS → dBFS（数字满幅相对值）；全 0 采样（数字静音）返回 -Infinity
function rmsToDbfs(rms) {
  if (!(rms > 0)) return -Infinity
  return 20 * Math.log10(rms)
}

// dBFS → 估算声压级（SPL ≈ dBFS + 94），钳制到 [0, 140] dB
function dbfsToSpl(dbfs) {
  const v = dbfs + 94
  if (!Number.isFinite(v)) return 0
  return Math.min(140, Math.max(0, v))
}

// RMS → 估算声压级一步到位
function rmsToSpl(rms) {
  return dbfsToSpl(rmsToDbfs(rms))
}

// 噪声等级档位（内置静态参考数据）
const NOISE_TIERS = [
  { range: '0-35', max: 35, name: '非常安静', example: '安静图书馆 ≈ 30dB，几乎听不到环境声', dotClass: 'bg-emerald-500' },
  { range: '35-55', max: 55, name: '安静', example: '安静办公室 40-50dB，适合睡眠与专注', dotClass: 'bg-green-500' },
  { range: '55-68', max: 68, name: '正常', example: '正常交谈 ≈ 60dB，日常起居水平', dotClass: 'bg-blue-500' },
  { range: '68-82', max: 82, name: '较吵', example: '繁忙街道 / 吸尘器 70-80dB，长时间会心烦', dotClass: 'bg-yellow-500' },
  { range: '82-95', max: 95, name: '需要护耳', example: '85dB 起长期暴露损伤听力（每日 8 小时上限）', dotClass: 'bg-orange-500' },
  { range: '95-110', max: 110, name: '危险 · 短时即伤', example: '建筑工地 / 演唱会 100dB+，短时间即可能损伤听力', dotClass: 'bg-red-500' },
  { range: '110+', max: Infinity, name: '痛阈 · 立即远离', example: '120-130dB 达到痛阈，耳朵会产生痛感，务必立即离开', dotClass: 'bg-red-700' }
]

// 估算声压级 → 档位下标（不落任何档返回 -1）
function classifySpl(db) {
  if (typeof db !== 'number' || !Number.isFinite(db) || db < 0) return -1
  for (let i = 0; i < NOISE_TIERS.length; i++) {
    if (db < NOISE_TIERS[i].max) return i
  }
  return NOISE_TIERS.length - 1
}

// getUserMedia 错误 → 用户可读信息
function micErrorText(err) {
  const name = err && err.name ? err.name : ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return '麦克风权限被拒绝，无法检测。'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return '未检测到可用的麦克风设备。'
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return '麦克风被其他应用占用或系统未授权，请关闭占用麦克风的软件后重试。'
  }
  if (name === 'OverconstrainedError') {
    return '麦克风参数不受支持，请更换设备或浏览器后重试。'
  }
  if (name === 'TypeError' || !err) {
    return '当前环境不支持麦克风采集：需要 HTTPS 或 localhost 环境，并使用较新的浏览器。'
  }
  return '检测启动失败：' + (err.message || name || '未知错误')
}

// 权限类错误 → 解决指引步骤
function micErrorGuide(err) {
  const name = err && err.name ? err.name : ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return [
      '点击浏览器地址栏左侧的锁形 / 麦克风图标，把「麦克风」权限改为允许。',
      '若曾选择「永久拒绝」，需在浏览器设置的站点权限中重置后刷新页面。',
      '检查系统设置：确保本网站与浏览器本身有麦克风访问权限（macOS 在「系统设置 → 隐私与安全性 → 麦克风」）。'
    ]
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return [
      '确认设备有麦克风且未被物理禁用（部分笔记本有摄像头/麦克风物理开关）。',
      '检查系统声音设置中麦克风输入设备是否正常、是否被禁用。',
      '换一个有麦克风的设备，或在系统里插上外接麦克风后刷新页面。'
    ]
  }
  return [
    '关闭可能占用麦克风的软件（会议、直播、录音软件等）后重试。',
    '改用 Chrome / Edge / Firefox 等较新浏览器，并确认页面地址为 HTTPS 或 localhost。'
  ]
}

// ---------- 状态 ----------
const isRunning = ref(false)
const errorMessage = ref('')
const errorGuide = ref([])
const micSupported = ref(false)
const checked = ref(false)

// 大数字与统计（约 10Hz 节流刷新，曲线仍按 60fps 绘制）
const currentDb = ref(null)   // null = 尚无数据
const maxDb = ref(null)
const avgDb = ref(null)
const minDb = ref(null)

const canvasEl = ref(null)
const seoContentVisible = ref(true)

const currentDbText = computed(() => (currentDb.value === null ? '—' : currentDb.value.toFixed(1)))
const maxDbText = computed(() => (maxDb.value === null ? '—' : maxDb.value.toFixed(1)))
const avgDbText = computed(() => (avgDb.value === null ? '—' : avgDb.value.toFixed(1)))
const minDbText = computed(() => (minDb.value === null ? '—' : minDb.value.toFixed(1)))

// 当前档位下标：无数据时 -1，对照表不高亮
const currentTierIndex = computed(() => {
  if (currentDb.value === null) return -1
  return classifySpl(currentDb.value)
})

const bigNumberClass = computed(() => {
  const idx = currentTierIndex.value
  if (idx < 0) return 'text-foreground'
  if (idx >= 5) return 'text-red-600'
  if (idx === 4) return 'text-orange-500'
  return 'text-primary'
})

function tierChipClass(idx) {
  if (idx >= 5) return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
  if (idx === 4) return 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
  if (idx === 3) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300'
  return 'bg-primary/10 text-primary'
}

// ---------- 采集引擎（句柄全部非响应式） ----------
let audioCtx = null
let analyser = null
let sourceNode = null
let micStream = null
let rafId = null
let floatBuf = null          // Float32Array 采样缓冲
let canvasCtx = null         // canvas 2D 上下文
let points = []              // 曲线点 [{ t, db }]，仅保留最近 30 秒
let sessionSum = 0
let sessionCount = 0
let sessionMax = 0
let sessionMin = Infinity
let lastNumberSync = 0       // 上次大数字刷新时间戳

const CURVE_WINDOW_MS = 30000
const SPL_MIN = 0
const SPL_MAX = 100          // 曲线纵轴范围
const NUMBER_SYNC_MS = 100   // 大数字刷新 ≈ 10Hz

function syncStatsToRefs() {
  if (sessionCount > 0) {
    currentDb.value = points.length ? points[points.length - 1].db : currentDb.value
    maxDb.value = sessionMax
    minDb.value = sessionMin
    avgDb.value = sessionSum / sessionCount
  }
}

// 调整 canvas 物理像素尺寸（DPR 适配）
function setupCanvas() {
  const cv = canvasEl.value
  if (!cv) return
  const dpr = window.devicePixelRatio || 1
  const w = cv.clientWidth || 640
  const h = cv.clientHeight || 280
  cv.width = Math.round(w * dpr)
  cv.height = Math.round(h * dpr)
  canvasCtx = cv.getContext('2d')
}

// 绘制滚动曲线：dB 刻度线 + 数据折线
function drawCurve(now) {
  const ctx = canvasCtx
  const cv = canvasEl.value
  if (!ctx || !cv) return
  const w = cv.width
  const h = cv.height
  const dpr = window.devicePixelRatio || 1
  const padTop = 10 * dpr
  const padBottom = 20 * dpr
  const padLeft = 34 * dpr
  const plotW = w - padLeft - 8 * dpr
  const plotH = h - padTop - padBottom

  ctx.clearRect(0, 0, w, h)

  // dB 刻度线与标签
  ctx.font = `${11 * dpr}px ui-monospace, monospace`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 1
  for (let db = SPL_MIN; db <= SPL_MAX; db += 20) {
    const y = padTop + (1 - db / SPL_MAX) * plotH
    ctx.strokeStyle = db === 85 ? 'rgba(234, 88, 12, 0.45)' : 'rgba(113, 113, 122, 0.25)'
    ctx.beginPath()
    ctx.moveTo(padLeft, y)
    ctx.lineTo(padLeft + plotW, y)
    ctx.stroke()
    ctx.fillStyle = db === 85 ? 'rgba(234, 88, 12, 0.9)' : 'rgba(113, 113, 122, 0.9)'
    ctx.fillText(String(db), padLeft - 6 * dpr, y)
  }
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(113, 113, 122, 0.9)'
  // 85dB 护耳线标注
  const y85 = padTop + (1 - 85 / SPL_MAX) * plotH
  ctx.textAlign = 'left'
  ctx.fillText('85 护耳线', padLeft + 6 * dpr, y85 - 8 * dpr)
  // 时间刻度：-30s / -15s / 现在
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const timeMarks = [[0, '现在'], [15000, '-15s'], [30000, '-30s']]
  for (const [offsetMs, label] of timeMarks) {
    const x = padLeft + plotW - (offsetMs / CURVE_WINDOW_MS) * plotW
    ctx.fillText(label, Math.min(Math.max(x, padLeft), padLeft + plotW), h - 6 * dpr)
  }

  if (!points.length) {
    ctx.fillStyle = 'rgba(113, 113, 122, 0.8)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${13 * dpr}px system-ui, sans-serif`
    ctx.fillText(isRunning.value ? '正在等待声音数据…' : '点击「开始检测」开始绘制曲线', w / 2, h / 2)
    return
  }

  // 折线
  const lastDb = points[points.length - 1].db
  const strokeColor = lastDb >= 95 ? '#dc2626' : (lastDb >= 82 ? '#ea580c' : '#2563eb')
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 1.6 * dpr
  ctx.lineJoin = 'round'
  ctx.beginPath()
  for (let i = 0; i < points.length; i++) {
    const x = padLeft + plotW - ((now - points[i].t) / CURVE_WINDOW_MS) * plotW
    const db = Math.min(SPL_MAX, Math.max(SPL_MIN, points[i].db))
    const y = padTop + (1 - db / SPL_MAX) * plotH
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // 末点圆点
  const tail = points[points.length - 1]
  const tailX = padLeft + plotW
  const tailY = padTop + (1 - Math.min(SPL_MAX, Math.max(SPL_MIN, tail.db)) / SPL_MAX) * plotH
  ctx.fillStyle = strokeColor
  ctx.beginPath()
  ctx.arc(tailX, tailY, 3 * dpr, 0, Math.PI * 2)
  ctx.fill()
}

// 逐帧分析：RMS → dB → 记点/统计/绘图（曲线 60fps，数字节流 10Hz）
function tick(ts) {
  if (!isRunning.value || !analyser) return
  analyser.getFloatTimeDomainData(floatBuf)
  const spl = rmsToSpl(computeRms(floatBuf))

  points.push({ t: ts, db: spl })
  while (points.length && points[0].t < ts - CURVE_WINDOW_MS) {
    points.shift()
  }

  sessionSum += spl
  sessionCount += 1
  if (spl > sessionMax) sessionMax = spl
  if (spl < sessionMin) sessionMin = spl

  drawCurve(ts)

  if (ts - lastNumberSync >= NUMBER_SYNC_MS) {
    lastNumberSync = ts
    syncStatsToRefs()
  }

  rafId = requestAnimationFrame(tick)
}

async function startDetection() {
  errorMessage.value = ''
  errorGuide.value = []
  if (!micSupported.value) {
    errorMessage.value = micErrorText(null)
    errorGuide.value = micErrorGuide(null)
    return
  }
  try {
    // 仅在用户点击后请求麦克风，绝不在页面加载时自动请求
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true })

    const AudioCtx = window.AudioContext || window.webkitAudioContext
    audioCtx = new AudioCtx()
    if (audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') {
      await audioCtx.resume()
    }
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0
    sourceNode = audioCtx.createMediaStreamSource(micStream)
    sourceNode.connect(analyser)

    floatBuf = new Float32Array(analyser.fftSize)

    // 会话统计清零
    points = []
    sessionSum = 0
    sessionCount = 0
    sessionMax = 0
    sessionMin = Infinity
    currentDb.value = null
    maxDb.value = null
    avgDb.value = null
    minDb.value = null
    lastNumberSync = 0

    setupCanvas()
    isRunning.value = true
    cancelRaf()
    rafId = requestAnimationFrame(tick)
  } catch (err) {
    errorMessage.value = micErrorText(err)
    errorGuide.value = micErrorGuide(err)
    releaseAudio()
  }
}

function stopDetection() {
  syncStatsToRefs()
  releaseAudio()
}

function cancelRaf() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

// 停止音轨并释放 AudioContext，把麦克风还给系统
function releaseAudio() {
  cancelRaf()
  if (sourceNode) {
    try { sourceNode.disconnect() } catch (err) { /* 已断开时忽略 */ }
    sourceNode = null
  }
  if (micStream) {
    for (const track of micStream.getTracks()) track.stop()
    micStream = null
  }
  if (audioCtx) {
    audioCtx.close().catch(() => {})
    audioCtx = null
  }
  analyser = null
  isRunning.value = false
}

function toggleSeoContent() {
  seoContentVisible.value = !seoContentVisible.value
}

function handleResize() {
  if (canvasEl.value) setupCanvas()
}

onMounted(() => {
  addRecentTool('decibel-meter')
  micSupported.value = typeof navigator !== 'undefined'
    && !!navigator.mediaDevices
    && typeof navigator.mediaDevices.getUserMedia === 'function'
  checked.value = true
  setupCanvas()
  drawCurve(performance.now())
  window.addEventListener('resize', handleResize)
})

// 卸载必须停掉音轨释放设备，并取消动画帧
onUnmounted(() => {
  releaseAudio()
  window.removeEventListener('resize', handleResize)
})
</script>
