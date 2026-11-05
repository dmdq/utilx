<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Aperture class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">快门角度换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">视频快门角度与快门速度双向换算：θ/360/fps 秒，180° 法则运动模糊基准，25fps 180° → 1/50s、24fps 1/48s → 180°，附常用角度速查表</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线快门角度换算工具：输入帧率 fps 与快门角度 θ，按 快门速度 = θ/360÷fps 即时换算曝光时间，
        也可反向输入快门速度求角度（θ = fps × 快门速度 × 360）。附 180° 法则说明卡、90/135/172.8/180/270/360 常用角度
        在 24/25/30/50/60/120 帧率下的速查矩阵，以及相对 180° 基准的曝光 EV 差。视频拍摄参数决策全部在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <div class="flex items-start gap-2 mb-6 p-3 rounded-lg bg-muted/60 border border-border text-xs leading-relaxed text-muted-foreground">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>快门角度 θ 决定每帧曝光时长 = θ/360 × 帧间隔。θ=180° 时曝光时间为帧间隔的一半，是电影感运动模糊的行业基准；θ 越大拖影越长，θ 越小画面越「脆」。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Film class="w-5 h-5 mr-2 text-primary" /> 换算参数
        </h2>

        <!-- 帧率 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">帧率 fps</label>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <button
              v-for="f in FPS_PRESETS"
              :key="f"
              type="button"
              @click="fpsPreset = f"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="fps === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >
              {{ f }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model.number="fpsCustom"
              type="number"
              step="0.001"
              min="1"
              max="1000"
              class="w-28 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="自定义"
            >
            <span class="text-xs text-muted-foreground">fps（1 ~ 1000，输入即生效）</span>
          </div>
        </div>

        <!-- 模式切换 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">换算方向</label>
          <div class="flex rounded-lg border border-border overflow-hidden">
            <button type="button" @click="mode = 'forward'" class="flex-1 px-3 py-2 text-xs font-medium transition" :class="mode === 'forward' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'">角度 → 快门速度</button>
            <button type="button" @click="mode = 'reverse'" class="flex-1 px-3 py-2 text-xs font-medium transition" :class="mode === 'reverse' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'">快门速度 → 角度</button>
          </div>
        </div>

        <!-- 正向：角度 -->
        <div v-if="mode === 'forward'">
          <label for="sa-angle" class="block text-sm font-medium text-foreground mb-1.5">快门角度 θ：{{ fmtOf(angle, 1) }}°</label>
          <input
            id="sa-angle"
            v-model.number="angleInput"
            type="range"
            min="45"
            max="360"
            step="0.1"
            class="w-full accent-primary cursor-pointer"
          >
          <div class="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>45°</span><span>180°</span><span>360°</span>
          </div>
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="a in ANGLE_CHIPS"
              :key="a"
              type="button"
              @click="angleInput = a"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="angle === a ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >
              {{ a }}°
            </button>
          </div>
        </div>

        <!-- 反向：快门速度 -->
        <div v-if="mode === 'reverse'">
          <label for="sa-speed" class="block text-sm font-medium text-foreground mb-1.5">快门速度</label>
          <input
            id="sa-speed"
            v-model.trim="speedInput"
            type="text"
            class="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="如 1/50 或 0.02"
          >
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="s in SPEED_CHIPS"
              :key="s"
              type="button"
              @click="speedInput = s"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="speedInput === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >
              {{ s }}
            </button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">支持 1/50 这类分数或 0.02 这类秒数，角度 = fps × 快门速度 × 360。</p>
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
        <div class="bg-card border border-border rounded-lg p-6">
          <div v-if="mode === 'forward'" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="bg-card border border-primary/40 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">快门速度</p>
              <p class="text-2xl lg:text-3xl font-bold text-primary font-mono">{{ speedFractionText }}</p>
            </div>
            <div class="bg-card border border-border rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">精确秒数</p>
              <p class="text-xl lg:text-2xl font-bold text-foreground font-mono break-all">{{ speedExactText }}</p>
            </div>
            <div class="bg-card border border-border rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">相对 180° 曝光</p>
              <p class="text-xl lg:text-2xl font-bold text-foreground font-mono">{{ evDiffText }}</p>
            </div>
            <div class="bg-card border border-border rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">运动模糊观感</p>
              <p class="text-sm font-semibold text-foreground mt-1.5">{{ blurLabel }}</p>
            </div>
          </div>
          <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="bg-card border border-primary/40 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">快门角度</p>
              <p class="text-2xl lg:text-3xl font-bold text-primary font-mono">{{ angleResultText }}</p>
            </div>
            <div class="bg-card border border-border rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">曝光时长</p>
              <p class="text-xl lg:text-2xl font-bold text-foreground font-mono break-all">{{ speedExactText }}</p>
            </div>
            <div class="bg-card border border-border rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">相对 180° 曝光</p>
              <p class="text-xl lg:text-2xl font-bold text-foreground font-mono">{{ evDiffText }}</p>
            </div>
            <div class="bg-card border border-border rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">运动模糊观感</p>
              <p class="text-sm font-semibold text-foreground mt-1.5">{{ blurLabel }}</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            {{ mode === 'forward'
              ? `按 快门速度 = θ/360 ÷ fps = ${fmtOf(angle, 1)}/360 ÷ ${fmtOf(fps, 3)} 计算；每帧曝光占帧间隔的 ${fmtOf(angle / 360 * 100, 1)}%。`
              : `按 θ = fps × 快门速度 × 360 = ${fmtOf(fps, 3)} × ${speedDisplayText} × 360 计算。` }}
          </p>
        </div>

        <!-- 180° 法则说明卡 -->
        <div class="bg-card border border-primary/40 rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-2">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> 180° 法则：电影感运动模糊的基准
          </h2>
          <p class="text-sm text-muted-foreground leading-relaxed mb-2">
            θ=180° 时，每帧曝光时间恰好是帧间隔的一半（24fps → 1/48s，25fps → 1/50s）：
            一个物体在单帧曝光内移动的距离约为帧间位移的一半，人眼会把这种程度的模糊读作「自然、流畅的电影运动」——
            这就是延续百年的 180° 法则。机械摄影机的旋转快门盘开口半圆即 180°，故得此名。
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded-lg bg-muted/60 border border-border">
              <p class="font-medium text-foreground mb-1 flex items-center"><TrendingUp class="w-4 h-4 mr-1.5 text-primary" /> θ 变大（270°/360°）：拖影更长</p>
              <p class="text-xs text-muted-foreground leading-relaxed">画面更「拖」、更梦幻，曝光更多；适合低速流动的云、水、光轨，或低照度环境抢曝光。</p>
            </div>
            <div class="p-3 rounded-lg bg-muted/60 border border-border">
              <p class="font-medium text-foreground mb-1 flex items-center"><TrendingDown class="w-4 h-4 mr-1.5 text-primary" /> θ 变小（90°）：画面更「脆」</p>
              <p class="text-xs text-muted-foreground leading-relaxed">拖影短、逐帧感强，战争片的紧张颤抖感（《拯救大兵瑞恩》诺曼底段）正是 90° 口径的经典手法。</p>
            </div>
          </div>
        </div>

        <!-- 常用角度速查表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Timer class="w-5 h-5 mr-2 text-primary" /> 常用角度速查表
          </h2>
          <p class="text-xs text-muted-foreground mb-3">六档常用快门角度在常见帧率下的快门速度（含 24fps 基准列）；高亮为最接近当前设置的行 / 列。</p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th class="text-left px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">角度 \ fps</th>
                  <th
                    v-for="(f, fi) in TABLE_FPS"
                    :key="f"
                    class="px-2 py-1.5 text-xs font-medium text-center border-b border-border"
                    :class="fi === activeFpsCol ? 'text-primary bg-primary/10' : 'text-muted-foreground'"
                  >{{ f }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, ri) in angleTable" :key="row.angle">
                  <td class="px-2 py-1.5 font-mono text-foreground" :class="ri === activeAngleRow ? 'text-primary bg-primary/10 font-bold' : ''">{{ row.angle }}°</td>
                  <td
                    v-for="(cell, ci) in row.cells"
                    :key="TABLE_FPS[ci]"
                    class="px-2 py-1.5 text-center font-mono text-foreground"
                    :class="ci === activeFpsCol && ri === activeAngleRow ? 'bg-primary/15 font-bold' : ci === activeFpsCol || ri === activeAngleRow ? 'bg-primary/5' : ''"
                  >{{ cell }}</td>
                </tr>
              </tbody>
            </table>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>快门角度是什么？一台摄影机的机械遗产</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          胶片时代摄影机用一块旋转的快门盘（shutter disc）控制曝光：圆盘转过一圈，胶片前进一帧，圆盘上开口的角度 θ 就是「快门角度」。
          每帧的曝光时间 = 开口占整圈的比例 × 帧间隔 = θ/360 ÷ fps。开口 180°（半圆）时曝光时间是帧间隔的一半：
          24fps 下即 1/48 秒，25fps 下即 1/50 秒，60fps 下即 1/120 秒。数字摄影机虽然没有了快门盘，
          但行业沿用角度来描述「运动模糊风格」，电影机的快门角度模式、主流 App 的参数面板都是这份机械遗产。
          本工具按这两个公式双向换算：快门速度 = θ/360/fps；角度 θ = fps × 快门速度 × 360（例如 25fps、1/50s → 180°）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么视频快门要跟着帧率走？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          静态照片的快门速度只关乎一张画面，而视频的每帧曝光时间不能超过帧间隔本身（24fps 下快门不可能慢于 1/24s），
          更重要的是：运动模糊的「长度」要与帧间位移匹配，观众才会把离散的帧序列读成连续流畅的运动。
          180° 法则（曝光 = 帧间隔一半）给出的模糊量恰好落在人眼最舒服的区间；快门角度大于 180°（如 270°/360°）拖影变长、
          画面发糊发梦；小于 180°（如 90°）拖影变短、画面干脆甚至逐帧顿挫——战争片刻意用 90° 制造紧张颤抖的手持感，
          而拍流水云层想要丝滑拉丝则可以开到 270° 以上。所以换快门角度（而不是随手改快门速度）才是视频控制运动模糊的正确姿势。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">电子快门 vs 全局快门：角度模式怎么落到数码机身？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          数码机身用电子快门模拟角度：机械快门或电子卷帘（rolling shutter）按 θ/360 × 帧间隔的时长给每帧曝光。
          卷帘快门逐行读取，快速横摇会出现果冻效应（垂直线条倾斜、螺旋桨弯折）；全局快门（global shutter）整幅同时曝光，
          从根本上消除果冻，运动模糊的形态也更接近胶片。索尼、松下等已在部分机型上量产全局快门；
          在无反上拍视频时，把快门模式设为角度（若支持）或按本工具换算成对应快门速度（如 25fps 180° → 1/50s）锁死，即可获得标准的电影模糊。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">与静态摄影「1/焦距」安全快门法则的区别</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          「1/焦距」（200mm 镜头手持不低于 1/200s）解决的是<b class="text-foreground">手抖</b>——机身自身晃动造成的光轴抖动，与帧率无关；
          快门角度解决的是<b class="text-foreground">运动再现</b>——被摄物体在帧序列里的模糊长度是否自然。两者经常冲突：
          长焦手持时 1/200s 相当于约 22°（24fps），画面会脆得像逐帧动画。解决方案不是牺牲 180° 法则，而是上稳定器、三脚架或提高帧率，
          让「安全快门」与「角度模糊」同时满足。换句话说：1/焦距是保住锐度的下限，快门角度是定住风格的基准。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">25fps 拍视频，快门该设多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              按 180° 法则：θ/360 ÷ 25 = 1/50 秒。本工具默认参数就是这组换算；若拍摄对象需要更脆或更拖的风格，
              再按速查表换 90°（1/100s）或 270°（1/33s）等角度。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">172.8° 是什么奇怪的角度？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              它对应 24fps 下恰好 1/50s（24 × 1/50 × 360 = 172.8°）。PAL 地区电源为 50Hz、历史上用 1/50s 拍摄可避免灯光频闪，
              于是 172.8° 成为 24fps + 1/50s 组合的标准角度写法，部分电影机的角度步进也按 172.8° 设档。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">高帧率升格（120fps）也要守 180° 吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              是的，法则与帧率无关：120fps 配 180° 即 1/240s。升格素材最终以 24fps 回放时运动被放慢，
              模糊长度同样被放慢，依然自然；若在 120fps 下用 1/1000s 这类过快快门，回放会明显顿挫。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算结果会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不会。快门速度与角度换算全部在你的浏览器内即时算出，无网络请求；参数仅保存在本机 localStorage 供下次访问恢复。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'shutter-angle'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Aperture, Film, Gauge, Timer, TrendingUp, TrendingDown,
  RefreshCw, TriangleAlert, ChevronUp, ChevronDown, Info
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '快门角度换算器 - 视频快门角度与快门速度双向换算',
  description: '免费在线快门角度换算：输入帧率与快门角度按 θ/360/fps 算快门速度，反向输入快门速度求角度，25fps 180° 即 1/50s，180° 法则运动模糊说明、常用角度速查表与电子快门/全局快门科普，纯浏览器本地计算不上传',
  keywords: '快门角度换算,180度法则,快门速度计算,视频快门,shutter angle,运动模糊',
  author: '有条工具',
  ogTitle: '快门角度换算器 - 视频快门角度与快门速度双向换算 | 有条工具',
  ogDescription: '输入帧率与角度即时换算快门速度，180° 法则说明与常用角度速查表。',
  ogUrl: 'https://www.util.cn/tools/shutter-angle',
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
          name: '快门角度换算器',
          url: 'https://www.util.cn/tools/shutter-angle',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['角度→快门速度 θ/360/fps', '快门速度→角度反向换算', '自定义帧率 1~1000fps', '180° 法则运动模糊说明', '常用角度×帧率速查表', '相对 180° 曝光 EV 差', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '快门角度换算器', item: 'https://www.util.cn/tools/shutter-angle' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '25fps 拍视频，快门该设多少？',
              acceptedAnswer: { '@type': 'Answer', text: '按 180° 法则：快门速度 = 180/360 ÷ 25 = 1/50 秒。需要更脆或更拖的风格再换 90°（1/100s）或 270°（1/33s）。' }
            },
            {
              '@type': 'Question',
              name: '为什么视频快门要跟着帧率走？',
              acceptedAnswer: { '@type': 'Answer', text: '每帧曝光不能超过帧间隔，且运动模糊长度需与帧间位移匹配，观众才会把帧序列读成连续运动；180°（曝光为帧间隔一半）是人眼最舒服的基准。' }
            },
            {
              '@type': 'Question',
              name: '电子快门和全局快门有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '电子卷帘快门逐行曝光，快速横摇有果冻效应；全局快门整幅同时曝光，消除果冻，运动模糊形态更接近胶片。角度模式在数码机身上按 θ/360×帧间隔 模拟。' }
            },
            {
              '@type': 'Question',
              name: '计算结果会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。换算全部在浏览器内即时算出，无网络请求；参数仅保存在本机 localStorage 供下次访问恢复。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯函数（可独立单测） ----------
// 口径：快门速度 t = θ/360 ÷ fps（秒）；反向 θ = fps × t × 360。
// 曝光相对 180° 基准的 EV 差 = log₂(θ/180)（曝光时长与 θ 成正比）。

function fmtOf(v, d = 2) {
  return Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—'
}

function clampNum(v, lo, hi) {
  const n = Number(v)
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, n))
}

// 快门角度 θ（度）+ 帧率 fps → 快门速度（秒）；参数无效返回 NaN
function shutterSecondsOf(angleDeg, fps) {
  if (!(angleDeg > 0) || !(fps > 0)) return NaN
  return angleDeg / 360 / fps
}

// 快门速度（秒）+ 帧率 fps → 快门角度（度）；参数无效返回 NaN
function angleOf(shutterSeconds, fps) {
  if (!(shutterSeconds > 0) || !(fps > 0)) return NaN
  return shutterSeconds * fps * 360
}

// 相对 180° 基准的曝光 EV 差 = log₂(θ/180)
function evDiffOf(angleDeg, baseDeg = 180) {
  if (!(angleDeg > 0) || !(baseDeg > 0)) return NaN
  return Math.log2(angleDeg / baseDeg)
}

// 快门速度文本：≥1s 直接显示秒；否则按 1/N 分数显示（分母近整则取整）
function formatShutterSpeedOf(t) {
  if (!Number.isFinite(t) || t <= 0) return '—'
  if (t >= 1) return `${fmtOf(t, 2)} s`
  const denom = 1 / t
  if (Math.abs(denom - Math.round(denom)) < 0.05) return `1/${Math.round(denom)} s`
  return `1/${fmtOf(denom, 1)} s`
}

// 解析快门速度输入：支持 "1/50"、"0.02"、"1/50s"；无效返回 NaN
function parseShutterSpeedOf(str) {
  if (typeof str !== 'string') return NaN
  const s = str.trim().replace(/[sS秒]/g, '')
  if (!s) return NaN
  if (s.includes('/')) {
    const parts = s.split('/')
    const a = Number(parts[0])
    const b = Number(parts[1])
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0 || parts.length !== 2) return NaN
    return a / b
  }
  const n = Number(s)
  return Number.isFinite(n) && n > 0 ? n : NaN
}

// 运动模糊观感描述（按角度分档）
function blurLabelOf(angleDeg) {
  if (!Number.isFinite(angleDeg) || angleDeg <= 0) return '—'
  if (angleDeg >= 315) return '拖影很长，梦幻流动感'
  if (angleDeg >= 225) return '拖影偏长，流动感强'
  if (angleDeg > 195) return '略长于电影基准'
  if (angleDeg >= 165) return '电影感基准区（180° 附近）'
  if (angleDeg >= 135) return '略短，画面偏干脆'
  if (angleDeg >= 90) return '拖影短，动作脆（战争片口径）'
  return '极短拖影，逐帧定格感'
}

// ---------- 常量 ----------
const FPS_PRESETS = [24, 25, 30, 50, 60, 120]
const ANGLE_CHIPS = [90, 135, 172.8, 180, 270, 360]
const SPEED_CHIPS = ['1/50', '1/48', '1/60', '1/100', '1/120']
const TABLE_ANGLES = [90, 135, 172.8, 180, 270, 360]
const TABLE_FPS = [24, 25, 30, 50, 60, 120]

// ---------- 响应式参数 ----------
const TOOL_ID = 'shutter-angle'
const fpsPreset = ref(25)
const fpsCustom = ref('') // 空串 = 未启用自定义
const mode = ref('forward') // 'forward' | 'reverse'
const angleInput = ref(180)
const speedInput = ref('1/50')
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const fps = computed(() => {
  const c = Number(fpsCustom.value)
  if (fpsCustom.value !== '' && fpsCustom.value !== null && fpsCustom.value !== undefined && Number.isFinite(c) && c > 0) {
    return clampNum(c, 0.001, 1000)
  }
  return fpsPreset.value
})
const angle = computed(() => clampNum(Number(angleInput.value), 45, 360))
const parsedSpeed = computed(() => parseShutterSpeedOf(speedInput.value))

const validationIssues = computed(() => {
  const list = []
  if (fpsCustom.value !== '' && fpsCustom.value !== null && fpsCustom.value !== undefined) {
    const c = Number(fpsCustom.value)
    if (!Number.isFinite(c) || c <= 0) list.push('自定义帧率无效，请输入正数；已按预设帧率计算')
    else if (c > 1000) list.push(`帧率超出 1000fps 上限，已按 ${fps.value}fps 计算`)
  }
  if (mode.value === 'reverse' && !Number.isFinite(parsedSpeed.value)) list.push('快门速度格式无效，支持 1/50 或 0.02 两种写法')
  if (mode.value === 'forward' && (Number(angleInput.value) < 45 || Number(angleInput.value) > 360)) list.push(`角度超出 45 ~ 360° 范围，已按 ${angle.value}° 计算`)
  if (mode.value === 'reverse' && Number.isFinite(parsedSpeed.value)) {
    const a = angleOf(parsedSpeed.value, fps.value)
    if (a > 360) list.push(`换算角度 ${fmtOf(a, 1)}° 超过 360°：机械快门盘无法实现，需电子快门、更宽开口机型或提高帧率`)
    else if (a < 45) list.push(`换算角度 ${fmtOf(a, 1)}° 低于 45°：拖影极短，画面接近逐帧定格，请确认是否符合预期`)
  }
  return list
})

// ---------- 计算结果 ----------
const speedSeconds = computed(() => shutterSecondsOf(angle.value, fps.value))
const angleResult = computed(() => (mode.value === 'reverse' ? angleOf(parsedSpeed.value, fps.value) : angle.value))
const evDiff = computed(() => evDiffOf(mode.value === 'reverse' ? angleResult.value : angle.value))

const speedFractionText = computed(() => formatShutterSpeedOf(speedSeconds.value))
const speedDisplayText = computed(() => (mode.value === 'reverse'
  ? (Number.isFinite(parsedSpeed.value) ? formatShutterSpeedOf(parsedSpeed.value) : '—')
  : speedFractionText.value))
const speedExactText = computed(() => {
  const t = mode.value === 'reverse' ? (Number.isFinite(parsedSpeed.value) ? parsedSpeed.value : NaN) : speedSeconds.value
  return Number.isFinite(t) ? `${fmtOf(t, 4)} s` : '—'
})
const angleResultText = computed(() => (Number.isFinite(angleResult.value) ? `${fmtOf(angleResult.value, 1)}°` : '—'))
const evDiffText = computed(() => {
  if (!Number.isFinite(evDiff.value)) return '—'
  const v = parseFloat(evDiff.value.toFixed(2))
  return `${v > 0 ? '+' : ''}${v} EV`
})
const blurLabel = computed(() => blurLabelOf(mode.value === 'reverse' ? angleResult.value : angle.value))

// 常用角度速查表（含 24fps 基准列）
const angleTable = computed(() => TABLE_ANGLES.map((a) => ({
  angle: a,
  cells: TABLE_FPS.map((f) => formatShutterSpeedOf(shutterSecondsOf(a, f)))
})))

// 表格高亮辅助：找与当前值最接近的下标
const activeFpsCol = computed(() => {
  let best = 0
  let gap = Infinity
  TABLE_FPS.forEach((f, i) => {
    const g = Math.abs(Math.log(f) - Math.log(fps.value))
    if (g < gap) { gap = g; best = i }
  })
  return best
})
const activeAngleRow = computed(() => {
  const cur = mode.value === 'reverse' ? angleResult.value : angle.value
  if (!Number.isFinite(cur)) return -1
  let best = -1
  let gap = Infinity
  TABLE_ANGLES.forEach((a, i) => {
    const g = Math.abs(Math.log(a) - Math.log(cur))
    if (g < gap) { gap = g; best = i }
  })
  return best
})

// ---------- 交互动作 ----------
function resetAll() {
  fpsPreset.value = 25
  fpsCustom.value = ''
  mode.value = 'forward'
  angleInput.value = 180
  speedInput.value = '1/50'
}

// ---------- 设置持久化（localStorage，键前缀用工具 id） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(`${TOOL_ID}-settings`)
    if (!saved) return
    const s = JSON.parse(saved)
    if (FPS_PRESETS.includes(s.fpsPreset)) fpsPreset.value = s.fpsPreset
    if (Number.isFinite(s.fpsCustom) && s.fpsCustom > 0) fpsCustom.value = s.fpsCustom
    else if (s.fpsCustom === '' || s.fpsCustom === null) fpsCustom.value = ''
    if (s.mode === 'forward' || s.mode === 'reverse') mode.value = s.mode
    if (Number.isFinite(s.angle) && s.angle >= 45 && s.angle <= 360) angleInput.value = s.angle
    if (typeof s.speed === 'string' && Number.isFinite(parseShutterSpeedOf(s.speed))) speedInput.value = s.speed
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([fpsPreset, fpsCustom, mode, angleInput, speedInput], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(`${TOOL_ID}-settings`, JSON.stringify({
      fpsPreset: fpsPreset.value,
      fpsCustom: fpsCustom.value,
      mode: mode.value,
      angle: angleInput.value,
      speed: speedInput.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})
</script>
