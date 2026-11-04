<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Star class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">星空曝光计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">500 / 600 法则算星野最长快门：焦距 × 裁切系数即换，秒数精确保留 1 位小数，附拖长量、参数建议与银河季月相窗口</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线星空曝光计算器：星野摄影拍银河、拍星轨前，用 500 法则 / 600 法则算「星星不拖成线的最长快门」。
        公式就一条——最长快门(s) = 500（或 600）÷（实际焦距 mm × 裁切系数）：全幅 24mm 约 20.8s，APS-C 半幅只有约 13.9s，M43 更短。
        本页内置全幅 / APS-C / M43 / 中画幅裁切系数预设与自定义输入，输出精确到 0.1s，并给出两种法则的口径差异（500 偏保守、600 星点略长）、
        该快门下星点在传感器上的近似拖长量、拍摄参数建议卡（光圈 / ISO / RAW）与北半球银河季 + 月相窗口提示。
        全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Star class="w-5 h-5 mr-2 text-primary" /> 拍摄参数
        </h2>

        <!-- 法则选择 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">星点法则</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="r in RULES"
              :key="r.value"
              type="button"
              @click="rule = r.value"
              class="px-3 py-1.5 rounded-md text-xs font-medium border transition"
              :class="rule === r.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >{{ r.label }}</button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">
            {{ activeRuleTip }}
          </p>
        </div>

        <!-- 焦距 -->
        <div>
          <label for="se-focal" class="block text-sm font-medium text-foreground mb-1.5">镜头焦距（mm，填实际标称值）</label>
          <div class="flex items-center gap-2">
            <input id="se-focal" v-model.number="focal" type="number" min="1" step="1" class="w-28 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="f in FOCAL_CHIPS"
                :key="f"
                type="button"
                @click="applyFocalChip(f)"
                class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
                :class="focal === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              >{{ f }}mm</button>
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">按镜头标称焦距填（如 16-35 的 16 端填 16），等效换算交给下面的裁切系数，不要填等效值。</p>
        </div>

        <!-- 裁切系数 -->
        <div>
          <label for="se-crop" class="block text-sm font-medium text-foreground mb-1.5">机身裁切系数</label>
          <select id="se-crop" v-model="cropChoice" class="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option v-for="c in CROP_PRESETS" :key="c.id" :value="c.id">{{ c.label }}</option>
          </select>
          <div v-if="isCustomCrop" class="flex items-center gap-2 mt-2">
            <input v-model.number="customCrop" type="number" min="0.5" max="3" step="0.01" class="w-28 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-xs text-muted-foreground">倍（常见范围 0.79 ~ 2.0）</span>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">
            裁切系数越大、等效焦距越长，允许的快门越短。当前等效焦距
            <span class="font-mono text-foreground">{{ equivFocalText }}</span>。
          </p>
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
      <div class="space-y-6">
        <!-- 结果特大卡 -->
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Timer class="w-5 h-5 mr-2 text-primary" /> 最长快门（星星拖线前）
          </h2>
          <div v-if="exposureResult" class="space-y-3">
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono">
              <span class="text-xl text-foreground">{{ activeRuleMeta.label }}</span>
              <span class="text-sm text-muted-foreground">÷</span>
              <span class="text-xl text-foreground">{{ focal }}mm × {{ cropText }}</span>
              <span class="text-2xl text-primary">→</span>
              <span class="text-4xl lg:text-5xl font-bold text-primary break-all">{{ exposureResult.text }}</span>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>拍摄时按不低于此值的整档快门更实际：M 档或快门优先选 {{ shutterDialText }}，机内实际值以该档为准。</span>
            </p>
            <div class="p-3 rounded-lg bg-muted/60 border border-border text-xs text-foreground leading-relaxed flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>口径对照：另一法则（{{ otherRuleMeta.label }}）同参数约
                <span class="font-mono font-semibold">{{ exposureResult.otherText }}</span>——
                {{ rule === 500 ? '600 法则快门更长、进光更多，但星点拖长也更明显' : '500 法则更保守、星点更接近点状' }}；两种口径都允许轻微拖线，放大 100% 检查后按口味取舍。</span>
            </div>
            <!-- 星点拖长量 -->
            <div class="p-3 rounded-lg bg-muted/40 border border-border">
              <p class="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                <MoveDiagonal class="w-3.5 h-3.5 text-primary" /> 星点拖长量估算（可选参考）
              </p>
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                在 <span class="font-mono text-foreground">{{ focal }}mm</span>、快门
                <span class="font-mono text-foreground">{{ exposureResult.text }}</span> 下，星点在传感器上的近似拖长约
                <span class="font-mono text-foreground font-semibold">{{ exposureResult.trailText }}</span>
                （按地球自转 15″/s、天赤道附近最大值估算；赤纬越高按 cos(赤纬) 缩小）。
                全幅常见像素间距 4 ~ 6 μm，对应若干像素的轻微拖线——这正是 500 / 600 法则的固有折中；想更锐可缩短 10% ~ 20% 快门，或上赤道仪后彻底放开快门限制。
              </p>
            </div>
          </div>
          <p v-else class="p-8 text-center text-sm text-muted-foreground">填入焦距并选择裁切系数开始计算</p>
        </div>

        <!-- 拍摄参数建议卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 星野拍摄参数建议
          </h2>
          <p class="text-xs text-muted-foreground mb-3 leading-relaxed">按当前最长快门配齐一套银河 / 星野起步参数，均为社区通行经验口径，按现场光污染与机器高感微调。</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">光圈</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">f/1.4 ~ f/2.8 优先开到最大或收 1/3 档；光圈越大，同亮度下 ISO 和快门压力越小。</p>
            </div>
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">ISO</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">ISO 1600 ~ 6400 起步，看直方图微调；现代机身高感表现远好于想象，宁欠勿糊再后期提亮。</p>
            </div>
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">格式与白平衡</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">RAW 格式必开（后期拉阴影、校色温的前提）；白平衡 3500 ~ 4500K 起步，RAW 下也可后期再定。</p>
            </div>
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">对焦与稳定</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">手动对焦、实时取景放大对亮星合焦；上三脚架，用 2 秒延时或快门线避免机身震动，镜头防抖关闭。</p>
            </div>
          </div>
        </div>

        <!-- 银河季 + 月相联动 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Moon class="w-5 h-5 mr-2 text-primary" /> 银河季与月相窗口
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            北半球银河核心段（人马座方向的银心）每年 <strong class="text-foreground">4 ~ 9 月</strong>可拍：
            4 ~ 5 月在后半夜升起，6 ~ 8 月整夜可见（核心季，银心高度最高），9 月起提前到前半夜、可拍窗口逐月收窄；
            冬季银心贴地平且时间短，一般改拍冬季亮星与星轨。
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            月光是银河的头号天敌：满月前后银心基本被淹没，优先选<strong class="text-foreground">新月前后各 3 ~ 5 天</strong>的无月夜窗口，
            或月亮尚未升起 / 已落下的时段出机。
          </p>
          <NuxtLink
            to="/tools/moon-phase-calculator"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 bg-primary/10 text-sm font-medium text-primary hover:bg-primary/20 transition"
          >
            <Moon class="w-4 h-4" /> 用月相计算器锁定新月无月夜 →
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="relative mb-12">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>星空曝光计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款面向星野摄影的在线快门计算工具。地球在自转，长曝光里星星会相对传感器移动，快门一长星点就拖成短线。
          500 法则 / 600 法则是摄影师圈子里最通行的经验公式：把 500（或 600）除以「等效焦距」，
          得到星星尚不至明显拖线的最长快门秒数。本页帮你把焦距、裁切系数、两种法则、拖长量一次算清，
          并配套拍摄参数建议与银河季 / 月相窗口提示，全部在浏览器本地计算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">500 法则与 600 法则怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两条公式同源，只是常数不同：<strong>最长快门(s) = 常数 ÷（焦距 mm × 裁切系数）</strong>。
          500 法则偏保守，星点更接近点状，适合高像素机身、照片会被放大细看、或要叠深空素材的场景；
          600 法则允许星点略长，换到更长的快门与更多进光，适合机身像素不高、以社交媒体小图分享为主的拍摄。
          实操建议：先用 500 法则的值拍一张，放大 100% 看边角星点，能接受拖线再加长；不能接受就守着 500 的值。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">裁切系数怎么算等效焦距？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          等效焦距 = 实际焦距 × 裁切系数。全幅（35mm 传感器）系数 1.0；APS-C 半幅多为 1.5（索尼 / 尼康 / 富士），佳能约 1.6；
          M43 系统为 2.0；中画幅 44×33 传感器比全幅还大，系数约 0.79。系数越大、同焦距下视角越窄、等效焦距越长，
          允许的快门就越短——所以同样挂 24mm，全幅能曝约 20.8s，APS-C（1.5）只剩约 13.9s，M43（2.0）约 10.4s。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么我按公式拍，星角上还是拖线了？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两个原因：一是 500 / 600 法则本身是「不至明显拖线」的近似经验，画面四角与高像素机身上拖线先出现，
          机身像素密度越高、照片放大倍率越大越明显；二是公式只按焦距估算，没有考虑光圈、像素间距与星星赤纬。
          想更精确控制星点，进阶可用 NPF 法则获得更精确的星点控制（NPF 综合光圈、像素间距与赤纬等因素，公式较复杂，
          可借助专业星历 App 查询）。另外广角镜头边缘的彗差、像散也会让星点变形，那不是快门的问题。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">星轨是按这个快门拍吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不是。本工具算的是「星星不拖线」的最长快门，用于星野 / 银河；星轨恰恰要星星拖线：
          通行做法是单张 20 ~ 30s、ISO 1600 ~ 3200、f/2.8 连拍几十到几百张，后期用最大值堆栈连成轨迹，
          比单张超长曝光热噪更少、更可控。拍星轨时本工具的数值可作为「单张基础曝光」的起点。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">全幅 24mm 用 500 法则快门多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              500 ÷ 24 ≈ 20.8 秒。APS-C（裁切 1.5）同焦距为 500 ÷ 36 ≈ 13.9 秒；M43（2.0）为 500 ÷ 48 ≈ 10.4 秒。
              用本页输入焦距与机身类型即得精确到 0.1s 的结果。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">M43 的 14mm 能曝多久？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              500 ÷（14 × 2.0）= 500 ÷ 28 ≈ 17.9 秒。注意 M43 系数是 2.0，别只按标称 14mm 直接除，否则会算出 35.7s 的危险值。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">拍银河 ISO 和光圈怎么配？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              通行起步组合：最大光圈（f/1.4 ~ f/2.8）+ ISO 1600 ~ 6400 + 上述法则快门 + RAW 格式。
              拍完看直方图：峰值明显偏左且拉不动就加 ISO，天空亮部溢出就降 ISO 或收 1/3 档光圈。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">什么时间适合拍银河？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              北半球看银心集中在每年 4 ~ 9 月：6 ~ 8 月整夜可见最理想，4 ~ 5 月拍后半夜，9 月拍前半夜。
              月相上选新月前后各 3 ~ 5 天的无月夜，可用本站的月相计算器直接查任意日期的月相与月出月落。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不会。法则换算、拖长量估算与参数建议全部在你的浏览器内用纯算术即时完成，无网络请求，参数不被保存或上传。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'star-exposure-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Star, Timer, Info, RefreshCw, TriangleAlert, CheckCircle,
  ChevronUp, ChevronDown, Moon, Settings2, MoveDiagonal
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '星空曝光计算器 - 500/600 法则星野最长快门换算 | 有条工具',
  description: '免费在线星空曝光计算器：500 法则 / 600 法则按焦距×裁切系数即时算星野最长快门，全幅/APS-C/M43/中画幅预设与自定义，精确到 0.1s，附星点拖长量估算、光圈 ISO RAW 参数建议与北半球银河季月相窗口提示，纯浏览器本地计算不上传',
  keywords: '星空500法则,600法则 快门,星空摄影参数,astrophotography 500 rule,银河拍摄 快门时间',
  author: '有条工具',
  ogTitle: '星空曝光计算器 - 500/600 法则星野最长快门换算 | 有条工具',
  ogDescription: '输入焦距与机身裁切系数，即时算出星星不拖线的最长快门，附拍摄参数建议与银河季月相窗口。',
  ogUrl: 'https://www.util.cn/tools/star-exposure-calculator',
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
          name: '星空曝光计算器',
          url: 'https://www.util.cn/tools/star-exposure-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '500 法则 / 600 法则最长快门换算',
            '全幅 / APS-C 1.5 / 1.6 / M43 / 中画幅裁切系数预设与自定义',
            '结果精确到 0.1 秒',
            '两种法则口径对照（500 偏保守 / 600 星点略长）',
            '星点在传感器上的近似拖长量估算',
            '快门拨盘整档档位建议',
            '星野拍摄参数建议（光圈 / ISO / RAW / 对焦）',
            '北半球银河季与月相窗口提示',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '星空曝光计算器', item: 'https://www.util.cn/tools/star-exposure-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '全幅 24mm 用 500 法则快门多少？',
              acceptedAnswer: { '@type': 'Answer', text: '500 ÷ 24 ≈ 20.8 秒。APS-C（裁切 1.5）同焦距约 13.9 秒，M43（2.0）约 10.4 秒。最长快门 = 500 ÷（焦距 × 裁切系数）。' }
            },
            {
              '@type': 'Question',
              name: 'M43 的 14mm 能曝多久？',
              acceptedAnswer: { '@type': 'Answer', text: '500 ÷（14 × 2.0）= 500 ÷ 28 ≈ 17.9 秒。注意 M43 裁切系数为 2.0，需先乘系数再相除。' }
            },
            {
              '@type': 'Question',
              name: '拍银河 ISO 和光圈怎么配？',
              acceptedAnswer: { '@type': 'Answer', text: '通行起步组合：最大光圈（f/1.4 ~ f/2.8）+ ISO 1600 ~ 6400 + 500/600 法则快门 + RAW 格式，拍完按直方图微调。' }
            },
            {
              '@type': 'Question',
              name: '什么时间适合拍银河？',
              acceptedAnswer: { '@type': 'Answer', text: '北半球银心集中在每年 4 ~ 9 月可拍：6 ~ 8 月整夜可见，4 ~ 5 月拍后半夜，9 月拍前半夜；月相选新月前后各 3 ~ 5 天的无月夜窗口。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 单位约定：焦距 mm，快门秒。核心公式：最长快门(s) = 常数(500 或 600) ÷（焦距 × 裁切系数）。
// 星点拖长量：地球自转恒星视运动约 15″/s（天赤道处），换算 rad 后乘焦距得传感器上位移：
// trail(μm) ≈ 0.0727 × 焦距(mm) × 快门(s) × cos(赤纬)；本页按天赤道最大值（cos=1）估算。

// 最长快门（秒）：非法输入返回 null；显示时保留 1 位小数
function exposureOf(ruleConst, focalMm, crop) {
  const k = Number(ruleConst)
  const f = Number(focalMm)
  const c = Number(crop)
  if (!Number.isFinite(k) || !Number.isFinite(f) || !Number.isFinite(c) || f <= 0 || c <= 0) return null
  return k / (f * c)
}

// 星点拖长量（μm，天赤道最大值）：0.0727 × 焦距 × 快门；非法输入返回 null
function trailUmOf(focalMm, shutterSec) {
  const f = Number(focalMm)
  const t = Number(shutterSec)
  if (!Number.isFinite(f) || !Number.isFinite(t) || f <= 0 || t <= 0) return null
  return 0.0727 * f * t
}

// 秒 → 1 位小数文本（如 20.8333 → "20.8s"）；非法返回 '—'
function formatSec(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return '—'
  return `${sec.toFixed(1)}s`
}

// 秒 → 相机拨盘整档档位文本（1/3 档序列向上取整，含 30s 上限提示）
function shutterDialOf(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return '—'
  const dials = [1, 1.3, 1.6, 2, 2.5, 3.2, 4, 5, 6, 8, 10, 13, 15, 20, 25, 30]
  for (const d of dials) {
    if (sec <= d) return d < 1 ? `${Math.round(d * 1000)}ms` : `${d}s`
  }
  return '30s（B 门或间隔拍摄）'
}

function clampNum(v, lo, hi) {
  const n = Number(v)
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, n))
}

// ---------- 静态数据 ----------
const RULES = [
  { value: 500, label: '500 法则（偏保守）', tip: '500 法则偏保守：星点更接近点状，适合高像素机身与放大细看的成片。' },
  { value: 600, label: '600 法则（星点略长）', tip: '600 法则允许星点略长：快门长 20%、进光更多，适合小图分享与低像素机身。' }
]

// 裁切系数预设：中画幅 0.79 为 44×33 传感器常用口径；自定义覆盖特殊机型
const CROP_PRESETS = [
  { id: 'full', label: '全幅（1.0）', crop: 1.0 },
  { id: 'apsc15', label: 'APS-C · 索尼 / 尼康 / 富士（1.5）', crop: 1.5 },
  { id: 'apsc16', label: 'APS-C · 佳能（1.6）', crop: 1.6 },
  { id: 'm43', label: 'M43 系统（2.0）', crop: 2.0 },
  { id: 'mf', label: '中画幅 44×33（0.79）', crop: 0.79 },
  { id: 'custom', label: '自定义系数…', custom: true }
]

const FOCAL_CHIPS = [14, 16, 20, 24, 35, 50]

// ---------- 响应式参数 ----------
const rule = ref(500)
const focal = ref(24)
const cropChoice = ref('full')
const customCrop = ref(1.0)
const seoContentVisible = ref(true)

const activeRuleMeta = computed(() => RULES.find((r) => r.value === rule.value) || RULES[0])
const otherRuleMeta = computed(() => RULES.find((r) => r.value !== rule.value) || RULES[0])
const activeRuleTip = computed(() => activeRuleMeta.value.tip)
const isCustomCrop = computed(() => {
  const meta = CROP_PRESETS.find((c) => c.id === cropChoice.value)
  return !!meta && !!meta.custom
})
const cropMeta = computed(() => CROP_PRESETS.find((c) => c.id === cropChoice.value) || CROP_PRESETS[0])
const crop = computed(() => (isCustomCrop.value ? clampNum(customCrop.value, 0.5, 3) : cropMeta.value.crop))
const cropText = computed(() => `${crop.value}（${cropMeta.value.label.split('（')[0]}）`)
const equivFocalText = computed(() => `${+(focal.value * crop.value).toFixed(1)}mm`)

const validationIssues = computed(() => {
  const list = []
  const f = Number(focal.value)
  if (!Number.isFinite(f) || f <= 0) list.push('焦距需为大于 0 的数值（mm）')
  else if (f > 400) list.push('焦距超 400mm，星野一般用广角（14 ~ 50mm），请确认输入')
  if (isCustomCrop.value) {
    const raw = Number(customCrop.value)
    if (!Number.isFinite(raw) || raw < 0.5 || raw > 3) list.push(`自定义裁切系数限 0.5 ~ 3，已按 ${crop.value} 计算`)
  }
  return list
})

// ---------- 计算结果 ----------
const exposureResult = computed(() => {
  const f = Number(focal.value)
  if (!Number.isFinite(f) || f <= 0) return null
  const sec = exposureOf(rule.value, f, crop.value)
  if (sec === null) return null
  const otherSec = exposureOf(otherRuleMeta.value.value, f, crop.value)
  const trailUm = trailUmOf(f, sec)
  return {
    sec,
    text: formatSec(sec),
    otherText: formatSec(otherSec),
    trailUm,
    trailText: trailUm === null ? '—' : `≈ ${trailUm.toFixed(1)} μm`
  }
})

const shutterDialText = computed(() => (exposureResult.value ? shutterDialOf(exposureResult.value.sec) : '—'))

// ---------- 交互动作 ----------
function resetAll() {
  rule.value = 500
  focal.value = 24
  cropChoice.value = 'full'
  customCrop.value = 1.0
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 焦距快捷档点击登记最近使用（onMounted 已登记，此处幂等）
function applyFocalChip(f) {
  focal.value = f
  addRecentTool('star-exposure-calculator')
}

onMounted(() => {
  addRecentTool('star-exposure-calculator')
})
</script>
