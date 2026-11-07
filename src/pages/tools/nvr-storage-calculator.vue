<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <HardDrive class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">监控硬盘存储计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">码率 × 通道数 × 天数 × 触发占比互算硬盘容量，H.264/H.265 编码预设与已有容量反查可存天数</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线监控硬盘存储计算器：NVR 装几块硬盘、录像能存多少天，一条公式就能估——每日容量(GB) = 码率(Mbps) × 10.8。
        正向输入码率、通道数、存储天数与移动侦测触发占比，得出所需 GB/TB（十进制）；反向输入已有硬盘容量，
        反查这套监控还能录多少天。内置 H.264/H.265 下 1080P / 2K 四百万 / 4K 八百万的常见推荐码率
        （H.265 同画质约省一半码率），支持 1~10TB 常见盘位快选，全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <!-- 方向切换 -->
    <div class="flex flex-wrap gap-2 mb-6" role="group" aria-label="计算方向">
      <button
        v-for="d in DIRECTIONS"
        :key="d.id"
        type="button"
        class="px-4 py-2 rounded-lg border text-sm font-medium transition"
        :class="direction === d.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
        @click="direction = d.id"
      >
        {{ d.label }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 录像参数
        </h2>

        <div>
          <label for="nvr-bitrate" class="block text-sm font-medium text-foreground mb-1.5">单路码率（Mbps）</label>
          <input id="nvr-bitrate" v-model.number="bitrate" type="number" min="0.5" max="64" step="0.5" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono">
          <p class="text-[11px] text-muted-foreground mt-1.5">编码预设（常见经验值，VBR 场景相关，以摄像头实际设置与现行标准原文为准）：</p>
          <div class="grid grid-cols-2 gap-2 mt-2">
            <button
              v-for="p in CODEC_PRESETS"
              :key="p.key"
              type="button"
              class="px-2.5 py-2 rounded-lg border text-left transition"
              :class="bitrate === p.bitrate ? 'bg-primary/10 border-primary/40' : 'bg-muted/40 border-border hover:bg-muted'"
              @click="bitrate = p.bitrate"
            >
              <p class="text-xs font-medium text-foreground">{{ p.label }}</p>
              <p class="text-[11px] text-muted-foreground font-mono mt-0.5">{{ p.bitrate }} Mbps</p>
            </button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">H.265 同画质码率约为 H.264 的一半，4K 高运动场景建议取上限或开 Smart 编码。</p>
        </div>

        <div>
          <label for="nvr-ch" class="block text-sm font-medium text-foreground mb-1.5">通道数（路）</label>
          <input id="nvr-ch" v-model.number="channels" type="number" min="1" max="64" step="1" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono">
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="c in [1, 4, 8, 16, 32]"
              :key="c"
              type="button"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="channels === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="channels = c"
            >{{ c }} 路</button>
          </div>
        </div>

        <!-- 触发占比滑杆 -->
        <div>
          <label for="nvr-ratio" class="block text-sm font-medium text-foreground mb-1.5">录像触发占比：{{ ratioPct }}%</label>
          <input id="nvr-ratio" v-model.number="ratioPct" type="range" min="20" max="100" step="5" class="w-full accent-primary">
          <div class="flex justify-between text-[11px] text-muted-foreground mt-1">
            <span>20% 移动侦测为主</span>
            <span>100% 全天候连续录像</span>
          </div>
        </div>

        <!-- 正向：天数；反向：容量 -->
        <div v-if="direction === 'forward'">
          <label for="nvr-days" class="block text-sm font-medium text-foreground mb-1.5">需要存储的天数</label>
          <input id="nvr-days" v-model.number="days" type="number" min="1" max="365" step="1" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono">
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button v-for="d in [7, 15, 30, 60, 90]" :key="d" type="button" class="px-2.5 py-1 rounded-md text-xs font-medium border transition" :class="days === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'" @click="days = d">{{ d }} 天</button>
          </div>
        </div>

        <div v-else>
          <label for="nvr-cap" class="block text-sm font-medium text-foreground mb-1.5">已有硬盘容量（TB，十进制）</label>
          <input id="nvr-cap" v-model.number="capacityTb" type="number" min="0.5" step="0.5" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono">
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button v-for="t in DISK_PRESETS" :key="t" type="button" class="px-2.5 py-1 rounded-md text-xs font-medium border transition" :class="capacityTb === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'" @click="capacityTb = t">{{ t }}TB</button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">按硬盘厂商标称十进制容量估算（1TB = 1000GB）；NVR 实际可用容量略小于标称值。</p>
        </div>

        <button type="button" class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition" @click="resetAll">
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认参数
        </button>

        <div v-if="issues.length" class="space-y-1.5">
          <p v-for="issue in issues" :key="issue" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ issue }}</span>
          </p>
        </div>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-6">
        <!-- 正向结果 -->
        <div v-if="direction === 'forward'" class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <HardDrive class="w-5 h-5 mr-2 text-primary" /> 所需存储容量
          </h2>
          <div v-if="forwardResult" class="space-y-4">
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">总容量（{{ fmtNum(days) }} 天）</p>
              <p class="text-4xl font-bold text-primary">{{ fmtNum(forwardResult.tb) }}<span class="text-lg font-medium text-muted-foreground ml-1">TB</span></p>
              <p class="text-xs text-muted-foreground mt-1 font-mono">= {{ fmtNum(forwardResult.gb) }} GB</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">单路每日</p>
                <p class="text-xl font-bold text-foreground font-mono">{{ fmtNum(forwardResult.perChGb) }} GB</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">全部通道每日</p>
                <p class="text-xl font-bold text-foreground font-mono">{{ fmtNum(forwardResult.allChGb) }} GB</p>
              </div>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>选盘建议：往上取整到最近盘位。本方案建议配 <span class="font-mono font-semibold">{{ suggestDisk(forwardResult.tb) }}TB</span> 及以上监控级硬盘（全天候录像优先选 WD 紫盘 / 希捷酷鹰类 Surveillance 型号）。</span>
            </p>
            <p class="text-xs text-muted-foreground leading-relaxed">公式：每日容量(GB) = 码率(Mbps) × 10.8；总容量 = 每日 × 通道数 × 天数 × 触发占比。十进制换算（1TB=1000GB），与硬盘标称口径一致。</p>
            <button type="button" class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition" @click="copyResult(forwardResult.text)">
              <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制结果
            </button>
          </div>
          <p v-else class="p-6 text-center text-sm text-muted-foreground">填入有效的码率、通道数与天数开始计算</p>
        </div>

        <!-- 反向结果 -->
        <div v-else class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Timer class="w-5 h-5 mr-2 text-primary" /> 可存储天数
          </h2>
          <div v-if="reverseResult" class="space-y-4">
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">{{ fmtNum(capacityTb) }}TB 可录</p>
              <p class="text-4xl font-bold text-primary">{{ fmtNum(reverseResult.days, 1) }}<span class="text-lg font-medium text-muted-foreground ml-1">天</span></p>
              <p class="text-xs text-muted-foreground mt-1 font-mono">约 {{ fmtNum(reverseResult.days / 30, 1) }} 个月</p>
            </div>
            <div class="flex flex-wrap gap-2 text-xs">
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-muted-foreground">每日消耗 {{ fmtNum(reverseResult.gbPerDay) }} GB</span>
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-muted-foreground">{{ fmtNum(channels) }} 路 × {{ fmtNum(bitrate) }} Mbps × {{ ratioPct }}%</span>
              <span v-if="reverseResult.diskFull" class="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 font-medium">容量不足一天，请降码率 / 减通道 / 加盘</span>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">公式：天数 = 容量(TB) × 1000 ÷ [码率 × 10.8 × 通道数 × 触发占比]。循环覆盖录像按「先录后删」计，实际天数以此估算为准。</p>
            <button type="button" class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition" @click="copyResult(reverseResult.text)">
              <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制结果
            </button>
          </div>
          <p v-else class="p-6 text-center text-sm text-muted-foreground">填入有效的容量、码率与通道数开始计算</p>
        </div>

        <!-- 码率参考卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Info class="w-5 h-5 mr-2 text-primary" /> 常见码率参考（25fps）
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead>
                <tr class="bg-muted/60 text-muted-foreground text-xs">
                  <th class="text-left px-3 py-2 font-medium">分辨率</th>
                  <th class="text-right px-3 py-2 font-medium">H.264</th>
                  <th class="text-right px-3 py-2 font-medium">H.265</th>
                  <th class="text-right px-3 py-2 font-medium">H.265 单路 30 天</th>
                </tr>
              </thead>
              <tbody class="text-muted-foreground">
                <tr class="border-t border-border">
                  <td class="px-3 py-2 text-foreground">1080P / 200 万</td>
                  <td class="px-3 py-2 text-right font-mono">4 Mbps</td>
                  <td class="px-3 py-2 text-right font-mono">2 Mbps</td>
                  <td class="px-3 py-2 text-right font-mono">{{ fmtNum(totalGbOf(2, 1, 30, 100)) }} GB</td>
                </tr>
                <tr class="border-t border-border">
                  <td class="px-3 py-2 text-foreground">2K / 400 万</td>
                  <td class="px-3 py-2 text-right font-mono">6 Mbps</td>
                  <td class="px-3 py-2 text-right font-mono">4 Mbps</td>
                  <td class="px-3 py-2 text-right font-mono">{{ fmtNum(totalGbOf(4, 1, 30, 100)) }} GB</td>
                </tr>
                <tr class="border-t border-border">
                  <td class="px-3 py-2 text-foreground">4K / 800 万</td>
                  <td class="px-3 py-2 text-right font-mono">12 Mbps</td>
                  <td class="px-3 py-2 text-right font-mono">8 Mbps</td>
                  <td class="px-3 py-2 text-right font-mono">{{ fmtNum(totalGbOf(8, 1, 30, 100)) }} GB</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed">上表为常见工程经验值（25fps、VBR 动态码率下的典型取值）：运动场景取上限、静态场景可下调；开启 H.265 / Smart 编码约再省一半存储，实际以摄像头码率设置页读数为准。</p>
        </div>
      </div>
    </div>

    <!-- SEO 可折叠区 -->
    <details open class="bg-card border border-border rounded-lg p-6 mb-6">
      <summary class="cursor-pointer select-none text-lg font-semibold text-foreground">公式、编码说明与常见问题（FAQ）</summary>
      <div class="mt-4 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">核心公式</h3>
          <ul class="list-disc list-inside space-y-1 text-sm text-muted-foreground leading-relaxed">
            <li>单路每日容量(GB) = 码率(Mbps) × 10.8 —— 1Mbps = 10⁶ bit/s，一天 86400s 共 86.4Gb ÷ 8 = 10.8GB（十进制）。</li>
            <li>正向：总容量(GB) = 码率 × 10.8 × 通道数 × 天数 × 触发占比；1TB = 1000GB（与硬盘标称一致）。</li>
            <li>反向：可存天数 = 容量(TB) × 1000 ÷ (码率 × 10.8 × 通道数 × 触发占比)。</li>
            <li>触发占比：连续录像为 100%；纯移动侦测录像按实际触发时长占比估算（取 20%~100% 滑杆）。</li>
          </ul>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">H.264 与 H.265 差多少？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            H.265（HEVC）压缩效率约为 H.264 的两倍：同画质下码率可降低约 50%，同容量可存约两倍的时长。
            例如 1080P 单路 30 天连续录像，H.264 按 4Mbps 需约 1,296GB，H.265 按 2Mbps 仅需约 648GB。
            代价是解码压力更大，老旧 NVR / 本地回放可能卡顿；混合部署时可按「新机器 H.265、旧机器 H.264」逐步过渡。
          </p>
        </div>

        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">4Mbps 一路 30 天要多大硬盘？</h3>
            <p class="text-sm text-muted-foreground mt-1">按连续录像（100%）：4 × 10.8 × 30 = 1,296GB ≈ 1.296TB，装 2TB 盘有余量；若开 H.265 2Mbps 同样场景只需约 648GB。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">8 路 2Mbps、60% 触发、30 天要多少容量？</h3>
            <p class="text-sm text-muted-foreground mt-1">单路每日 2 × 10.8 × 60% = 12.96GB，8 路 30 天共 3,110.4GB ≈ 3.11TB，配 4TB 盘即可。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么算出来比实际能存的少？</h3>
            <p class="text-sm text-muted-foreground mt-1">三个原因：一是硬盘标称按十进制、系统按二进制显示（4TB 盘格式化后约 3.63TiB）；二是 NVR 文件系统与录像索引本身占空间；三是实际码率随画面运动波动（VBR），夜间静态码率低于设定值。工程上建议在计算结果上再留 10%~20% 余量。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">移动侦测录像占比怎么估？</h3>
            <p class="text-sm text-muted-foreground mt-1">看场景：门口白天人来人往可能 60% 以上都在录，夜间安静的院子可能不到 20%。没有把握就按 100% 连续录像规划容量，触发模式当作「意外的延长」而不是依赖项；重要点位（出入口、金库）建议一律连续录像。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。容量与天数估算全部在你的浏览器内完成，无网络请求，参数不被保存或上传。</p>
          </div>
        </div>

        <p class="text-[11px] text-muted-foreground border-t border-border pt-3">说明：码率预设为安防工程常见经验值（非标准强制条款），H.265 约省一半的结论与主流厂商口径一致；容量换算为纯数学推导（1Mbps=10.8GB/天，十进制）。正式设计请以摄像头实际码率与现行标准原文为准。</p>
      </div>
    </details>

    <RelatedTools :currentToolId="'nvr-storage-calculator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { HardDrive, Calculator, Copy, CheckCircle, TriangleAlert, Info, RefreshCw, Timer } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '监控硬盘存储计算器 - NVR 录像容量/可存天数换算 | 有条工具',
  description: '免费在线监控硬盘存储计算器：码率×通道数×天数×移动侦测触发占比算 NVR 所需硬盘容量（GB/TB 十进制），已有容量反查可存天数，内置 H.264/H.265 下 1080P/2K 四百万/4K 八百万常见推荐码率，H.265 约省一半存储，1~10TB 盘位快选，纯浏览器本地计算不上传',
  keywords: '监控硬盘容量计算,NVR 存储,录像天数计算,监控码率,H.265 存储,摄像头存储计算',
  author: '有条工具',
  ogTitle: '监控硬盘存储计算器 - NVR 录像容量/可存天数换算 | 有条工具',
  ogDescription: '码率×通道×天数×触发占比互算硬盘容量与可存天数，含 H.264/H.265 码率参考。',
  ogUrl: 'https://www.util.cn/tools/nvr-storage-calculator',
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
          name: '监控硬盘存储计算器',
          url: 'https://www.util.cn/tools/nvr-storage-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '码率×通道数×天数×触发占比算所需容量（GB/TB）',
            '已有硬盘容量反查可存天数',
            'H.264/H.265 编码与分辨率码率预设',
            '移动侦测触发占比 20%~100% 滑杆',
            '1/2/4/6/8/10TB 常见盘位快选',
            '十进制容量口径与选盘建议',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发工具', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '监控硬盘存储计算器', item: 'https://www.util.cn/tools/nvr-storage-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '4Mbps 一路 30 天要多大硬盘？',
              acceptedAnswer: { '@type': 'Answer', text: '按连续录像：4Mbps × 10.8 × 30 天 = 1296GB = 1.296TB，装 2TB 盘有余量；H.265 2Mbps 同场景约 648GB。' }
            },
            {
              '@type': 'Question',
              name: '8 路 2Mbps、60% 触发、30 天要多少容量？',
              acceptedAnswer: { '@type': 'Answer', text: '单路每日 2×10.8×60%=12.96GB，8 路 30 天共 3110.4GB≈3.11TB，配 4TB 盘即可。' }
            },
            {
              '@type': 'Question',
              name: '为什么算出来比实际能存的少？',
              acceptedAnswer: { '@type': 'Answer', text: '硬盘标称十进制而系统按二进制显示、NVR 文件系统占用、VBR 码率随场景波动都会造成偏差，建议在计算结果上留 10%~20% 余量。' }
            },
            {
              '@type': 'Question',
              name: '移动侦测录像占比怎么估？',
              acceptedAnswer: { '@type': 'Answer', text: '看场景人流量：门口白天可能 60% 以上，安静院子夜间不到 20%。没把握按 100% 连续录像规划，重要点位建议连续录像。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== 纯逻辑与静态数据（单测区开始） =====
// 单位约定：码率 Mbps、容量 GB（十进制，1TB=1000GB）、天数天、占比百分数。
// 核心公式：1Mbps = 10^6 bit/s × 86400s/天 ÷ 8 = 10.8 GB/天（十进制）。

// 编码预设：常见工程经验值（25fps、VBR 典型取值，页面已注明非标准强制值）
const CODEC_PRESETS = [
  { key: 'h264-1080p', label: 'H.264 · 1080P / 200万', bitrate: 4 },
  { key: 'h265-1080p', label: 'H.265 · 1080P / 200万', bitrate: 2 },
  { key: 'h264-2k', label: 'H.264 · 2K / 400万', bitrate: 6 },
  { key: 'h265-2k', label: 'H.265 · 2K / 400万', bitrate: 4 },
  { key: 'h264-4k', label: 'H.264 · 4K / 800万', bitrate: 12 },
  { key: 'h265-4k', label: 'H.265 · 4K / 800万', bitrate: 8 }
]

// 预置盘位（TB，十进制）
const DISK_PRESETS = [1, 2, 4, 6, 8, 10]

// 单路每日容量（GB）= 码率 × 10.8 × 触发占比
function gbPerDay(bitrateMbps, ratioPct) {
  const b = Number(bitrateMbps)
  const r = Number.isFinite(Number(ratioPct)) ? Number(ratioPct) : 100
  if (!Number.isFinite(b) || b <= 0 || r <= 0) return null
  return b * 10.8 * (r / 100)
}

// 总容量（GB）= 单路每日 × 通道数 × 天数
function totalGbOf(bitrateMbps, channels, days, ratioPct) {
  const per = gbPerDay(bitrateMbps, ratioPct)
  const c = Number(channels)
  const d = Number(days)
  if (per === null || !Number.isFinite(c) || c <= 0 || !Number.isFinite(d) || d <= 0) return null
  return per * c * d
}

// GB → TB（十进制）
function gbToTb(gb) {
  const v = Number(gb)
  if (!Number.isFinite(v) || v < 0) return null
  return v / 1000
}

// 反向：可存天数 = 容量(TB)×1000 ÷ (单路每日 × 通道数)
function daysForCapacity(capacityTb, bitrateMbps, channels, ratioPct) {
  const cap = Number(capacityTb)
  const per = gbPerDay(bitrateMbps, ratioPct)
  const c = Number(channels)
  if (!Number.isFinite(cap) || cap <= 0 || per === null || !Number.isFinite(c) || c <= 0) return null
  return (cap * 1000) / (per * c)
}

// 选盘建议：往上取整到预置盘位；超过最大档返回所需值本身
function suggestDisk(tb, presets) {
  const list = presets || DISK_PRESETS
  const v = Number(tb)
  if (!Number.isFinite(v) || v <= 0) return null
  const up = list.find((t) => t >= v)
  return up !== undefined ? up : Math.ceil(v)
}

// 千分位数字格式化：去除多余小数零，非法输入返回 '—'
function fmtNum(n, digits) {
  const d = digits === undefined ? 2 : digits
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return v.toLocaleString('zh-CN', { maximumFractionDigits: d, minimumFractionDigits: 0 })
}
// ===== 单测区结束 =====

// ---------- 响应式状态 ----------
const DIRECTIONS = [
  { id: 'forward', label: '正向：算所需容量' },
  { id: 'reverse', label: '反向：算可存天数' }
]

const direction = ref('forward')
const bitrate = ref(4)
const channels = ref(8)
const days = ref(30)
const ratioPct = ref(100)
const capacityTb = ref(4)

const issues = computed(() => {
  const list = []
  const b = Number(bitrate.value)
  if (!Number.isFinite(b) || b <= 0) list.push('码率需为大于 0 的数值（Mbps）')
  const c = Number(channels.value)
  if (!Number.isFinite(c) || c < 1 || !Number.isInteger(c)) list.push('通道数需为 ≥1 的整数')
  if (direction.value === 'forward') {
    const d = Number(days.value)
    if (!Number.isFinite(d) || d <= 0) list.push('存储天数需为大于 0 的数值')
  } else {
    const cap = Number(capacityTb.value)
    if (!Number.isFinite(cap) || cap <= 0) list.push('硬盘容量需为大于 0 的数值（TB）')
  }
  return list
})

const valid = computed(() => issues.value.length === 0)

const forwardResult = computed(() => {
  if (direction.value !== 'forward' || !valid.value) return null
  const perChGb = gbPerDay(bitrate.value, ratioPct.value)
  const gb = totalGbOf(bitrate.value, channels.value, days.value, ratioPct.value)
  if (perChGb === null || gb === null) return null
  return {
    perChGb,
    allChGb: perChGb * channels.value,
    gb,
    tb: gbToTb(gb),
    text: `监控存储需求：${fmtNum(bitrate.value)}Mbps × ${fmtNum(channels.value)} 路 × ${fmtNum(days.value)} 天 × 触发占比 ${ratioPct.value}% → 共 ${fmtNum(gb)}GB = ${fmtNum(gbToTb(gb))}TB（单路每日 ${fmtNum(perChGb)}GB）`
  }
})

const reverseResult = computed(() => {
  if (direction.value !== 'reverse' || !valid.value) return null
  const d = daysForCapacity(capacityTb.value, bitrate.value, channels.value, ratioPct.value)
  if (d === null) return null
  return {
    days: d,
    gbPerDay: gbPerDay(bitrate.value, ratioPct.value) * channels.value,
    diskFull: d < 1,
    text: `可存天数：${fmtNum(capacityTb.value)}TB ÷（${fmtNum(bitrate.value)}Mbps × ${fmtNum(channels.value)} 路 × ${ratioPct.value}%）→ 约 ${fmtNum(d, 1)} 天`
  }
})

// ---------- 交互动作 ----------
function resetAll() {
  direction.value = 'forward'
  bitrate.value = 4
  channels.value = 8
  days.value = 30
  ratioPct.value = 100
  capacityTb.value = 4
}

async function copyResult(text) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
  } catch {
    alert('复制失败，请手动复制')
  }
}

onMounted(() => {
  addRecentTool('nvr-storage-calculator')
})
</script>
