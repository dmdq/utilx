<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Camera class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">景深超焦距计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按画幅、焦距、光圈与对焦点计算近点 / 远点 / 超焦距，风光前景后景全清晰、人像虚化预估、微距毫米级景深，附对数轴景深图解</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线景深计算器：基于薄透镜几何光学公式，输入传感器画幅（自动取弥散圈标准值，可自定义）、焦距、光圈与对焦距离，
        即时给出近点、远点、总景深、放大倍率与超焦距；一键「用超焦距」把对焦点设在 H，即可从 H/2 到无穷远全部清晰——
        风光摄影的经典对焦策略。结果与图解全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <div class="flex items-start gap-2 mb-6 p-3 rounded-lg bg-muted/60 border border-border text-xs leading-relaxed text-muted-foreground">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>按薄透镜几何光学公式计算（理想镜头模型），实际镜头存在像差与呼吸效应，结果用于布光与对焦决策参考。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Aperture class="w-5 h-5 mr-2 text-primary" /> 拍摄参数
        </h2>

        <!-- 画幅 -->
        <div>
          <label for="dof-sensor" class="block text-sm font-medium text-foreground mb-1.5">画幅（决定弥散圈 c 默认值）</label>
          <select id="dof-sensor" v-model="sensorId" class="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option v-for="s in SENSORS" :key="s.id" :value="s.id">{{ s.name }}（{{ s.width }}×{{ s.height }}mm · c={{ s.c.toFixed(3) }}）</option>
          </select>
          <label class="flex items-center gap-2 text-xs text-muted-foreground mt-2 cursor-pointer select-none">
            <input v-model="cCustomEnabled" type="checkbox" class="accent-primary" />
            自定义弥散圈 c
          </label>
          <div v-if="cCustomEnabled" class="flex items-center gap-2 mt-2">
            <input v-model.number="cCustom" type="number" step="0.001" min="0.005" max="0.1" class="w-28 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-xs text-muted-foreground">mm（常用 0.005 ~ 0.1）</span>
          </div>
          <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            c 基于约 800 万像素全幅打印 8 寸、1600 万打印放大时的经典标准，现代高像素可按 c/2 加严。
          </p>
        </div>

        <!-- 焦距 -->
        <div>
          <label for="dof-focal" class="block text-sm font-medium text-foreground mb-1.5">焦距（mm）</label>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <button
              v-for="f in FOCAL_CHIPS"
              :key="f"
              type="button"
              @click="focalInput = f"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="focal === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >
              {{ f }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <input id="dof-focal" v-model.number="focalInput" type="number" step="1" min="4" max="800" class="w-28 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-xs text-muted-foreground">mm（4 ~ 800 可自定义）</span>
          </div>
        </div>

        <!-- 光圈 -->
        <div>
          <label for="dof-aperture" class="block text-sm font-medium text-foreground mb-1.5">光圈 f 档</label>
          <select id="dof-aperture" v-model="apertureChoice" class="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option v-for="a in APERTURE_CHOICES" :key="a" :value="String(a)">f/{{ a }}</option>
            <option value="__custom">自定义…</option>
          </select>
          <div v-if="apertureChoice === '__custom'" class="flex items-center gap-2 mt-2">
            <input v-model.number="apertureCustom" type="number" step="0.1" min="1" max="64" class="w-28 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-xs text-muted-foreground">f/（1 ~ 64）</span>
          </div>
        </div>

        <!-- 对焦距离 -->
        <div>
          <label for="dof-dist" class="block text-sm font-medium text-foreground mb-1.5">对焦距离（对焦点）</label>
          <div class="flex items-center gap-2">
            <input id="dof-dist" v-model.number="distInput" type="number" step="0.01" min="0" class="flex-1 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <div class="flex rounded-lg border border-border overflow-hidden">
              <button type="button" @click="distUnit = 'm'" class="px-3 py-1.5 text-xs font-medium" :class="distUnit === 'm' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'">m</button>
              <button type="button" @click="distUnit = 'cm'" class="px-3 py-1.5 text-xs font-medium" :class="distUnit === 'cm' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'">cm</button>
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">范围 0.1 ~ 1000 m；切换到 cm 可按 35 cm 这类微距距离输入。</p>
        </div>

        <!-- 预设 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">快速预设</p>
          <div class="space-y-2">
            <button
              v-for="p in PRESETS"
              :key="p.id"
              type="button"
              @click="applyPreset(p)"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-left transition"
            >
              <Play class="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span class="text-xs text-foreground">{{ p.label }}</span>
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

      <!-- 右：图解与结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- SVG 景深图解 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h2 class="text-lg font-semibold flex items-center">
              <Camera class="w-5 h-5 mr-2 text-primary" /> 景深图解（横轴对数压缩）
            </h2>
            <div class="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span class="flex items-center gap-1"><i class="w-2.5 h-2.5 rounded-sm inline-block" style="background-color: #10b981"></i>清晰区间</span>
              <span class="flex items-center gap-1"><i class="w-2.5 h-2.5 rounded-sm inline-block" style="background-color: #2563eb"></i>对焦平面</span>
              <span class="flex items-center gap-1"><i class="w-2.5 h-2.5 rounded-sm inline-block" style="background-color: #d97706"></i>超焦距 H</span>
            </div>
          </div>
          <div v-html="dofSvg" class="bg-muted/30 rounded-lg"></div>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            绿色区间内的一切在照片里都达到「可接受清晰」；蓝色虚线是你对焦的平面，左右各延伸出近点与远点。
            竖排标签自上而下依次为：对焦平面、近点 / 远点与超焦距位置。
          </p>
        </div>

        <!-- 结果卡 -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">近点</p>
            <p class="text-xl lg:text-2xl font-bold text-foreground font-mono break-all">{{ nearText }}</p>
          </div>
          <div class="bg-card border border-primary/40 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">远点</p>
            <p class="text-3xl lg:text-4xl font-bold text-primary font-mono break-all">{{ farText }}</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">总景深</p>
            <p class="text-xl lg:text-2xl font-bold text-foreground font-mono break-all">{{ totalText }}</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">放大倍率</p>
            <p class="text-xl lg:text-2xl font-bold text-foreground font-mono">{{ magnificationText }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">≈ f /（s − f）· ≥0.1 进入微距</p>
          </div>
        </div>

        <!-- 超焦距卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div class="min-w-0">
              <h2 class="text-lg font-semibold flex items-center mb-1">
                <MoveHorizontal class="w-5 h-5 mr-2 text-primary" /> 超焦距 {{ hyperfocalText }}
              </h2>
              <p class="text-sm text-muted-foreground leading-relaxed">
                把对焦点设在 <span class="font-medium text-foreground">{{ hyperfocalText }}</span>，此光圈下从
                <span class="font-medium text-foreground">{{ halfHyperfocalText }}</span> 到 ∞ 全部清晰。
              </p>
              <p class="text-xs mt-2 flex items-start gap-1.5" :class="atOrBeyondHyperfocal ? 'text-green-600' : 'text-muted-foreground'">
                <CheckCircle v-if="atOrBeyondHyperfocal" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <Info v-else class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{{ hyperfocalHint }}</span>
              </p>
            </div>
            <button type="button" @click="useHyperfocal" class="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition flex-shrink-0">
              <MoveHorizontal class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 用超焦距
            </button>
          </div>
        </div>

        <!-- 景深表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Aperture class="w-5 h-5 mr-2 text-primary" /> 景深速查表
          </h2>
          <p class="text-xs text-muted-foreground mb-3">当前焦距 {{ focal }}mm、画幅 {{ sensorMeta.name }}（c={{ cEff.toFixed(3) }}mm）下的总景深矩阵；高亮为最接近当前设置的行 / 列。</p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th class="text-left px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">总景深</th>
                  <th v-for="(d, di) in TABLE_DISTANCES" :key="d" class="px-2 py-1.5 text-xs font-medium text-center border-b border-border" :class="di === activeCol ? 'text-primary bg-primary/10' : 'text-muted-foreground'">{{ d }}m</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, ri) in dofMatrix" :key="TABLE_APERTURES[ri]">
                  <td class="px-2 py-1.5 font-mono text-foreground" :class="ri === activeRow ? 'text-primary bg-primary/10 font-bold' : ''">f/{{ TABLE_APERTURES[ri] }}</td>
                  <td
                    v-for="(cell, ci) in row"
                    :key="TABLE_DISTANCES[ci]"
                    class="px-2 py-1.5 text-center font-mono text-foreground"
                    :class="ci === activeCol && ri === activeRow ? 'bg-primary/15 font-bold' : ci === activeCol || ri === activeRow ? 'bg-primary/5' : ''"
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>景深超焦距计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款面向摄影（风光、街拍、人像、微距）的在线景深计算工具。选择传感器画幅后自动取对应的弥散圈标准值 c，
          输入焦距、光圈与对焦距离，按薄透镜几何光学公式 H = f²/(N·c) + f 计算超焦距，再由
          近点 = s(H−f)/(H+s−2f)、远点 = s(H−f)/(H−s) 求出景深区间；当对焦点 s ≥ H 时远点为无穷大。
          页面右侧的对数轴 SVG 图解会把近点、对焦平面、远点与超焦距画在同一根轴上，方便直观判断「前景够不够清晰、后景能不能到无穷」。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">超焦距是什么、怎么用？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          超焦距是「远景恰好清晰到无穷」的最近对焦点：对焦在 H 时，从 H/2 到无穷远全部在可接受清晰范围内——这是风光摄影的经典口诀
          「对焦超焦距，半 H 到无穷」。实际操作：按本工具算出 H（例如 16mm f/8 全画幅约 1.08m），把镜头对焦环拧到略大于 H 的刻度
          （宁远勿近，多退半步只会损失一点前景），近景与雪山星空同时锐利。街拍同理：50mm f/8 全画幅 H 约 4.2m，对焦 4m 后约 2.1m 之外全清晰，
          无需等对焦锁定即可抓拍。点击「用超焦距」按钮可把本页对焦点一键设为当前光圈的 H。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">弥散圈标准从哪来？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          「清晰」本质是人眼在正常观看距离下分辨不出一个足够小的模糊斑，这个能被接受的模糊斑直径就叫弥散圈 c。
          本页默认值沿用经典标准：约 800 万像素全画幅输出 8 寸照片、1600 万像素放大输出时，取画幅对角线约 1/1750 的模糊斑为阈值，
          故全画幅 c=0.030mm、APS-C 0.019mm、M4/3 0.015mm、1 英寸 0.012mm、44×33 中画幅 0.029mm。
          如今高像素机身、100% 放大检视与大幅面输出越来越多，可勾选「自定义弥散圈」按 c/2（如全幅 0.015mm）加严，得到的景深更保守可靠。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么光圈再小，远景也不是「无限深」？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          几何光学公式给出 s ≥ H 时远点为无穷，但这只是「可察觉模糊不超过 c」的定义结果：光圈从 f/8 收到 f/16，景深数字翻倍，
          画质却未必变好——小光圈下光线通过狭小孔径发生衍射，模糊斑从几何斑变成衍射斑，通常在 f/11 ~ f/16 之后开始明显吃掉细节。
          所以风光对焦优先用超焦距策略而非无脑缩光圈；「远景无限深」在对焦超过 H 之后就已成立，继续收缩光圈只是在和衍射做交换。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">手机没有对焦刻度怎么用？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          打开相机「专业 / 手动模式」中的 MF 手动对焦（多数安卓旗舰带距离标尺），按本工具算出的近点与对焦距离摆位置；
          iPhone 或无标尺机型可长按屏幕锁定 AE/AF 后再滑动曝光，或用第三方手动对焦 App。16mm 等效焦距、f/2.8 左右的手机
          超焦距通常只有 1m 上下：对焦一米外，从约 0.5m 到远处都清晰，扫街抓拍基本不会脱焦。主摄画幅小、c 值紧，等效景深反而比相机大。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">想要前中后景全锐怎么办？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          景深合成：保持机位，按「下一张的近点 ≈ 上一张的远点」的间距对近、中、远分别拍若干张（可用本工具逐次推算），后期按蒙版堆栈合成，即可获得单张物理上不可能达到的全景深——微距与大风光的常用手法。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">什么是超焦距？</h3>
            <p class="text-sm text-muted-foreground mt-1">超焦距 H = f²/(N·c) + f，是使远点恰好落到无穷远的最近对焦点。对焦在 H 时景深从 H/2 延伸到无穷远，风光与街拍常用它换取最大清晰范围；本页提供「用超焦距」一键设置。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">弥散圈 c 该选多大？</h3>
            <p class="text-sm text-muted-foreground mt-1">按画幅选默认值即可（全画幅 0.030mm 等），它对应约 800 万像素打印 8 寸的经典观察标准；若你会 100% 放大检视或大幅输出，可自定义为 c/2 加严，景深结果更保守。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么远景明明对焦无穷远还不够锐？</h3>
            <p class="text-sm text-muted-foreground mt-1">「清晰」的定义是模糊斑不大于 c，属于可接受而非极致锐利；且小光圈存在衍射，f/16 后画质开始下降。想前中后景全锐建议用景深合成，而不是一味收缩光圈。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算结果会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。景深、超焦距与图解全部在你的浏览器内由几何光学公式即时算出，无网络请求，参数不会被保存或上传。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'depth-of-field-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Camera, Aperture, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, MoveHorizontal
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '景深超焦距计算器 - 光圈焦距弥散圈在线景深表',
  description: '免费在线景深计算器：按画幅自动取弥散圈标准值，输入焦距光圈对焦距离，用薄透镜几何光学公式计算近点远点总景深与超焦距，SVG 对数轴图解、景深速查表与风光人像微距预设，纯浏览器本地计算不上传',
  keywords: '景深计算器,超焦距计算,景深表,弥散圈,光圈景深范围',
  author: '有条工具',
  ogTitle: '景深超焦距计算器 - 光圈焦距弥散圈在线景深表 | 有条工具',
  ogDescription: '输入画幅焦距光圈与对焦点，即时算出近点、远点、总景深与超焦距，对数轴图解一目了然。',
  ogUrl: 'https://www.util.cn/tools/depth-of-field-calculator',
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
          name: '景深超焦距计算器',
          url: 'https://www.util.cn/tools/depth-of-field-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['五种画幅弥散圈默认值可自定义', '近点/远点/总景深/放大倍率即时计算', '超焦距一键对点', 'SVG 对数轴景深图解', '景深速查表矩阵', '风光/人像/微距预设', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '景深超焦距计算器', item: 'https://www.util.cn/tools/depth-of-field-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '什么是超焦距？',
              acceptedAnswer: { '@type': 'Answer', text: '超焦距 H = f²/(N·c) + f，是使远点恰好落到无穷远的最近对焦点。对焦在 H 时景深从 H/2 延伸到无穷远，风光与街拍常用它换取最大清晰范围。' }
            },
            {
              '@type': 'Question',
              name: '弥散圈 c 该选多大？',
              acceptedAnswer: { '@type': 'Answer', text: '按画幅选默认值即可（全画幅 0.030mm 等），对应约 800 万像素打印 8 寸的经典观察标准；若会 100% 放大检视或大幅输出，可自定义为 c/2 加严，景深结果更保守。' }
            },
            {
              '@type': 'Question',
              name: '为什么远景明明对焦无穷远还不够锐？',
              acceptedAnswer: { '@type': 'Answer', text: '「清晰」的定义是模糊斑不大于 c，属于可接受而非极致锐利；且小光圈存在衍射，f/16 后画质开始下降。想前中后景全锐建议用景深合成，而不是一味收缩光圈。' }
            },
            {
              '@type': 'Question',
              name: '计算结果会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。景深、超焦距与图解全部在浏览器内由几何光学公式即时算出，无网络请求，参数不会被保存或上传。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 单位约定：焦距 f 与弥散圈 c 用 mm，光圈 N 无量纲，距离一律以 m 进出。

// 画幅常量表：c 基于约 800 万像素全幅打印 8 寸、1600 万打印放大时的经典标准
const SENSORS = [
  { id: 'fullframe', name: '全画幅', width: 36, height: 24, c: 0.030 },
  { id: 'apsc', name: 'APS-C', width: 23.5, height: 15.6, c: 0.019 },
  { id: 'm43', name: 'M4/3', width: 17.3, height: 13, c: 0.015 },
  { id: 'inch1', name: '1 英寸', width: 13.2, height: 8.8, c: 0.012 },
  { id: 'mf4433', name: '中画幅 44×33', width: 44, height: 33, c: 0.029 }
]
const FOCAL_CHIPS = [16, 24, 35, 50, 85, 135, 200]
const APERTURE_CHOICES = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22]
const TABLE_APERTURES = [2.8, 5.6, 8, 11, 16]
const TABLE_DISTANCES = [1, 2, 5, 10]
const PRESETS = [
  { id: 'landscape', label: '风光：16mm f/8 对焦 2m（近点约 70cm，远点 ∞）', focal: 16, aperture: 8, dist: 2 },
  { id: 'portrait', label: '人像：85mm f/1.8 对焦 3m（景深约 13cm）', focal: 85, aperture: 1.8, dist: 3 },
  { id: 'macro', label: '微距：50mm f/2.8 对焦 25cm（景深毫米级，放大 0.25×）', focal: 50, aperture: 2.8, dist: 0.25 }
]

function clampNum(v, lo, hi) {
  const n = Number(v)
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, n))
}

// 薄透镜超焦距（mm）：H = f²/(N·c) + f
function hyperfocalMm(fMm, N, cMm) {
  return (fMm * fMm) / (N * cMm) + fMm
}

// 超焦距（米输出，单位换算在包装函数）
function hyperfocalOf(fMm, N, cMm) {
  return hyperfocalMm(fMm, N, cMm) / 1000
}

// 景深三要素：近点/远点/总景深（米）。s ≥ H 时远点为无穷大（Infinity）
function dofOf(fMm, N, sMeters, cMm) {
  const H = hyperfocalMm(fMm, N, cMm) // mm
  const s = sMeters * 1000            // mm
  const near = (s * (H - fMm)) / (H + s - 2 * fMm)
  const far = s >= H ? Infinity : (s * (H - fMm)) / (H - s)
  return {
    near: near / 1000,
    far: Number.isFinite(far) ? far / 1000 : Infinity,
    total: Number.isFinite(far) ? (far - near) / 1000 : Infinity,
    hyperfocal: H / 1000
  }
}

// 放大倍率 ≈ f/(s−f)，微距场景参考值；s ≤ f 时无物理意义返回 Infinity
function magnificationOf(fMm, sMeters) {
  const s = sMeters * 1000
  if (s <= fMm) return Infinity
  return fMm / (s - fMm)
}

// 距离自适应格式化：≥1m 用米（两位内），10cm~1m 用厘米，1cm~10cm 取整厘米，更短用毫米，∞ 直出
function formatDistanceOf(m) {
  if (!Number.isFinite(m)) return '∞'
  if (m >= 1) return `${+(m >= 100 ? m.toFixed(0) : m.toFixed(2))} m`
  if (m >= 0.1) return `${+(m * 100).toFixed(1)} cm`
  if (m >= 0.01) return `${Math.round(m * 100)} cm`
  return `${+(m * 1000).toFixed(1)} mm`
}

// 横轴对数压缩映射（0~1）：0.1m→0，0.5m→0.15，10m→0.85，∞→1（分段线性，段内对数）
function axisPosOf(m) {
  if (!Number.isFinite(m)) return 1
  if (m <= 0.1) return 0
  if (m <= 0.5) return 0.15 * (Math.log(m / 0.1) / Math.log(5))
  if (m <= 10) return 0.15 + 0.7 * (Math.log(m / 0.5) / Math.log(20))
  return 0.85 + 0.15 * (1 - 10 / m)
}

// 生成景深图解 SVG 字符串：相机符号 + 对数轴 + 近/焦/远三竖线 + 绿色区间带 + 超焦距标记
function dofToSvg(dof, s, scale) {
  const w = scale.w
  const h = scale.h
  const padL = 54
  const padR = 44
  const axisY = h - 26
  const topY = 44
  const span = w - padL - padR
  const X = (m) => (padL + axisPosOf(m) * span).toFixed(1)
  const el = []
  el.push(`<svg viewBox="0 0 ${w} ${h}" class="w-full h-auto" role="img" aria-label="景深图解：相机在左，绿色区间为可接受清晰范围" xmlns="http://www.w3.org/2000/svg">`)
  // 景深绿色区间带（far 为 Infinity 时铺到轴最右端）
  el.push(`<rect x="${X(dof.near)}" y="${topY - 4}" width="${Math.max(2, padL + axisPosOf(dof.far) * span - (padL + axisPosOf(dof.near) * span)).toFixed(1)}" height="${axisY - topY + 4}" fill="#10b981" opacity="0.16" rx="3" />`)
  // 轴线与刻度
  el.push(`<line x1="${padL - 6}" y1="${axisY}" x2="${w - padR + 4}" y2="${axisY}" stroke="#94a3b8" stroke-width="1.5" />`)
  for (const t of [0.5, 1, 2, 5, 10]) {
    el.push(`<line x1="${X(t)}" y1="${axisY}" x2="${X(t)}" y2="${axisY + 4}" stroke="#94a3b8" />`)
    el.push(`<text x="${X(t)}" y="${axisY + 17}" font-size="10.5" fill="#94a3b8" text-anchor="middle">${t}m</text>`)
  }
  el.push(`<text x="${w - padR + 4}" y="${axisY + 17}" font-size="10.5" fill="#94a3b8" text-anchor="end">∞</text>`)
  // 相机符号（贴轴左端）
  el.push(`<g transform="translate(8,${axisY - 26})">
    <rect x="0" y="0" width="34" height="22" rx="4" fill="#64748b" />
    <rect x="10" y="-5" width="13" height="6" rx="2" fill="#64748b" />
    <circle cx="17" cy="11" r="7" fill="#e2e8f0" />
    <circle cx="17" cy="11" r="3.5" fill="#475569" />
  </g>`)
  // 近点 / 远点竖线（绿）
  el.push(`<line x1="${X(dof.near)}" y1="${topY - 4}" x2="${X(dof.near)}" y2="${axisY}" stroke="#059669" stroke-width="2" />`)
  el.push(`<line x1="${X(dof.far)}" y1="${topY - 4}" x2="${X(dof.far)}" y2="${axisY}" stroke="#059669" stroke-width="2" />`)
  // 对焦平面（蓝虚线）
  el.push(`<line x1="${X(s)}" y1="${topY - 14}" x2="${X(s)}" y2="${axisY}" stroke="#2563eb" stroke-width="2" stroke-dasharray="5 3" />`)
  el.push(`<text x="${X(s)}" y="16" font-size="11" fill="#2563eb" text-anchor="middle">对焦 ${formatDistanceOf(s)}</text>`)
  // 近/远点标签（第二行，∞ 直出）
  el.push(`<text x="${X(dof.near)}" y="${topY - 18}" font-size="10.5" fill="#059669" text-anchor="middle">${formatDistanceOf(dof.near)}</text>`)
  el.push(`<text x="${X(dof.far)}" y="${topY - 18}" font-size="10.5" fill="#059669" text-anchor="middle">${formatDistanceOf(dof.far)}</text>`)
  // 超焦距标记（仅当落在可视范围内）
  if (axisPosOf(dof.hyperfocal) < 0.995) {
    el.push(`<line x1="${X(dof.hyperfocal)}" y1="${topY + 6}" x2="${X(dof.hyperfocal)}" y2="${axisY}" stroke="#d97706" stroke-width="1.5" stroke-dasharray="2 3" />`)
    el.push(`<text x="${X(dof.hyperfocal)}" y="${axisY - 6}" font-size="10" fill="#d97706" text-anchor="middle">H ${formatDistanceOf(dof.hyperfocal)}</text>`)
  }
  el.push('</svg>')
  return el.join('')
}

// 反推所需光圈（二分近似）：求最小 f 档 N，使近点 ≤ targetNear 且远点 ≥ targetFar（targetFar 可为 Infinity）
// 返回 null 表示 0.7~64 档内无法覆盖该区间；结果为理想镜头下的近似值
function apertureForDof(fMm, sMeters, targetNearM, targetFarM, cMm) {
  const covers = (N) => {
    const d = dofOf(fMm, N, sMeters, cMm)
    return d.near <= targetNearM * 1.0001 && d.far >= targetFarM
  }
  const LO = 0.7
  const HI = 64
  if (covers(LO)) return LO
  if (!covers(HI)) return null
  let lo = LO
  let hi = HI
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (covers(mid)) hi = mid
    else lo = mid
  }
  return Math.round(hi * 100) / 100
}

// 景深表矩阵：每行一个光圈档、每列一个对焦距离，单元为总景深文本
function dofMatrixOf(fMm, cMm, apertures, distances) {
  return apertures.map((N) => distances.map((d) => formatDistanceOf(dofOf(fMm, N, d, cMm).total)))
}

// 表格高亮辅助：在候选值列表中找与当前值（对数域）最接近的下标
function nearestIndexOf(list, value) {
  let best = 0
  let bestGap = Infinity
  for (let i = 0; i < list.length; i++) {
    const gap = Math.abs(Math.log(list[i]) - Math.log(value))
    if (gap < bestGap) {
      bestGap = gap
      best = i
    }
  }
  return best
}

// ---------- 响应式参数 ----------
const sensorId = ref('fullframe')
const cCustomEnabled = ref(false)
const cCustom = ref(0.03)
const focalInput = ref(50)
const apertureChoice = ref('8')
const apertureCustom = ref(1.8)
const distInput = ref(2)
const distUnit = ref('m')
const seoContentVisible = ref(true)

const sensorMeta = computed(() => SENSORS.find((s) => s.id === sensorId.value) || SENSORS[0])
const cEff = computed(() => (cCustomEnabled.value ? clampNum(cCustom.value, 0.005, 0.1) : sensorMeta.value.c))
const focal = computed(() => clampNum(focalInput.value, 4, 800))
const aperture = computed(() => (apertureChoice.value === '__custom'
  ? clampNum(apertureCustom.value, 1, 64)
  : Number(apertureChoice.value)))
const sMeters = computed(() => clampNum(distUnit.value === 'm' ? distInput.value : distInput.value / 100, 0.1, 1000))

const validationIssues = computed(() => {
  const list = []
  const rawF = Number(focalInput.value)
  if (!Number.isFinite(rawF) || rawF < 4 || rawF > 800) list.push(`焦距超出 4 ~ 800mm 范围，已按 ${focal.value}mm 计算`)
  const rawN = apertureChoice.value === '__custom' ? Number(apertureCustom.value) : Number(apertureChoice.value)
  if (!Number.isFinite(rawN) || rawN < 1 || rawN > 64) list.push(`光圈超出 f/1 ~ f/64 范围，已按 f/${aperture.value} 计算`)
  const rawS = distUnit.value === 'm' ? Number(distInput.value) : Number(distInput.value) / 100
  if (!Number.isFinite(rawS) || rawS < 0.1 || rawS > 1000) list.push(`对焦距离超出 0.1 ~ 1000m 范围，已按 ${sMeters.value}m 计算`)
  if (cCustomEnabled.value && (Number(cCustom.value) < 0.005 || Number(cCustom.value) > 0.1)) list.push(`弥散圈建议 0.005 ~ 0.1mm，已按 ${cEff.value.toFixed(3)}mm 计算`)
  return list
})

// ---------- 计算结果 ----------
const dof = computed(() => dofOf(focal.value, aperture.value, sMeters.value, cEff.value))
const hyperfocal = computed(() => dof.value.hyperfocal)
const atOrBeyondHyperfocal = computed(() => sMeters.value >= hyperfocal.value)
const magnification = computed(() => magnificationOf(focal.value, sMeters.value))

const nearText = computed(() => formatDistanceOf(dof.value.near))
const farText = computed(() => formatDistanceOf(dof.value.far))
const totalText = computed(() => formatDistanceOf(dof.value.total))
const magnificationText = computed(() => (Number.isFinite(magnification.value) ? `${magnification.value.toFixed(3)}×` : '∞'))
const hyperfocalText = computed(() => `（H = ${formatDistanceOf(hyperfocal.value)}）`)
const halfHyperfocalText = computed(() => formatDistanceOf(hyperfocal.value / 2))
const hyperfocalHint = computed(() => (atOrBeyondHyperfocal.value
  ? `当前对焦 ${formatDistanceOf(sMeters.value)} ≥ H，远点已在无穷远。`
  : `当前对焦 ${formatDistanceOf(sMeters.value)} 小于 H，远点 ${farText.value}；点右侧按钮可改按超焦距对焦。`))

const dofSvg = computed(() => dofToSvg(dof.value, sMeters.value, { w: 780, h: 230 }))
const dofMatrix = computed(() => dofMatrixOf(focal.value, cEff.value, TABLE_APERTURES, TABLE_DISTANCES))
const activeRow = computed(() => nearestIndexOf(TABLE_APERTURES, aperture.value))
const activeCol = computed(() => nearestIndexOf(TABLE_DISTANCES, sMeters.value))

// ---------- 交互动作 ----------
function applyPreset(p) {
  focalInput.value = p.focal
  if (APERTURE_CHOICES.includes(p.aperture)) {
    apertureChoice.value = String(p.aperture)
  } else {
    apertureChoice.value = '__custom'
    apertureCustom.value = p.aperture
  }
  distUnit.value = 'm'
  distInput.value = p.dist
}

function useHyperfocal() {
  distUnit.value = 'm'
  distInput.value = Math.round(hyperfocal.value * 1000) / 1000
}

function resetAll() {
  sensorId.value = 'fullframe'
  cCustomEnabled.value = false
  cCustom.value = 0.03
  focalInput.value = 50
  apertureChoice.value = '8'
  apertureCustom.value = 1.8
  distUnit.value = 'm'
  distInput.value = 2
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('depth-of-field-calculator')
})
</script>
