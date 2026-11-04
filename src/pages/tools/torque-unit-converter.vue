<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Wrench class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">扭矩单位换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">N·m / kgf·m / lbf·ft / lbf·in 四单位双向互转，轮胎螺栓场景参考与预紧力粗估，汽修机修自行车装机必备</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线扭矩单位换算工具：以精确系数（1 kgf·m = 9.80665 N·m、1 lbf·ft = 1.355817948 N·m）在牛顿米、公斤力米、磅英尺、磅英寸之间实时互转，
        任一单位输入、其余三个联动更新；附轮胎螺丝、火花塞、把立曲柄等 12 条场景参考扭矩（点行即载入换算）、常用 N·m↔lb-ft 速换卡，
        以及按 T≈K·F·d 的螺栓预紧扭矩粗估。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Gauge class="w-5 h-5 mr-2 text-primary" /> 输入扭矩
        </h2>

        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="u in UNITS"
            :key="u.id"
            @click="inputUnit = u.id"
            class="px-2 py-2 rounded-lg border text-xs font-semibold transition"
            :class="inputUnit === u.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
            :title="u.name"
          >
            {{ u.symbol }}
          </button>
        </div>

        <div>
          <input
            v-model="inputValue"
            type="number"
            min="0"
            step="any"
            placeholder="输入数值，如 100"
            class="w-full px-3 py-2.5 rounded-lg border border-border border-border bg-background text-foreground text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p class="text-[10px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>输入以当前所选单位计；扭矩值不允许为负。</span>
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            @click="applyPreset(100, 'Nm')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 100 N·m
          </button>
          <button
            @click="applyPreset(50, 'lbft')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 50 lb-ft
          </button>
          <button
            @click="resetInput"
            class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition"
          >
            <RefreshCw class="w-3 h-3 inline mr-1 -mt-0.5" /> 清空
          </button>
        </div>

        <!-- 常用速换卡 -->
        <div class="border-t border-border pt-4">
          <p class="text-sm font-medium text-foreground mb-2">常用速换（N·m ↔ lb-ft，100 步进）</p>
          <div class="grid grid-cols-2 gap-2 text-center">
            <div>
              <p class="text-[10px] text-muted-foreground mb-1.5">N·m → lb-ft</p>
              <div class="space-y-1">
                <button
                  v-for="q in quickNmTable"
                  :key="'n' + q.value"
                  @click="applyPreset(q.value, 'Nm')"
                  class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition"
                >
                  {{ q.value }} = {{ q.converted }}
                </button>
              </div>
            </div>
            <div>
              <p class="text-[10px] text-muted-foreground mb-1.5">lb-ft → N·m</p>
              <div class="space-y-1">
                <button
                  v-for="q in quickLbftTable"
                  :key="'l' + q.value"
                  @click="applyPreset(q.value, 'lbft')"
                  class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition"
                >
                  {{ q.value }} = {{ q.converted }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 结果大表 + 预紧估算（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Wrench class="w-5 h-5 mr-2 text-primary" /> 四单位换算结果
            </h2>
            <button
              @click="copyResults"
              :disabled="!canCopy"
              class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <CheckCircle v-if="copied" class="w-3.5 h-3.5 text-green-500" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copied ? '已复制' : '复制结果' }}
            </button>
          </div>

          <div class="space-y-2">
            <div
              v-for="r in resultRows"
              :key="r.id"
              class="flex items-center justify-between px-4 py-3 rounded-lg border"
              :class="r.id === inputUnit ? 'bg-primary/10 border-primary/40' : 'bg-muted/40 border-border'"
            >
              <div>
                <p class="text-sm font-semibold text-foreground">{{ r.symbol }}
                  <span v-if="r.id === inputUnit" class="ml-1.5 text-[10px] font-normal text-primary">当前输入单位</span>
                </p>
                <p class="text-[11px] text-muted-foreground">{{ r.name }}（{{ r.systemLabel }}）</p>
              </div>
              <p class="text-2xl font-bold font-mono" :class="r.id === inputUnit ? 'text-primary' : 'text-foreground'">
                {{ r.value === null ? '—' : fmtTorque(r.value) }}
              </p>
            </div>
          </div>

          <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
            基准：1 N·m ≡ 1 N·m；1 kgf·m ≡ 9.80665 N·m（标准重力加速度精确定义）；1 lbf·ft ≡ 1.355817948 N·m；1 lbf·in ≡ 0.112984829 N·m。
            磅英尺（lb-ft / N·m ≈ 1.356）与磅英寸（lb-in，1 lb-ft = 12 lb-in）是英制习惯值。
          </p>
        </div>

        <!-- 螺栓预紧估算卡（选填高级） -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Info class="w-5 h-5 mr-2 text-primary" /> 螺栓预紧扭矩粗估（选填·高级）
          </h2>
          <p class="text-xs text-muted-foreground mb-4">经验式 T ≈ K · F · d：按 0.7×屈服强度取预紧力 F，K 随摩擦状态取 0.16 / 0.20 / 0.28。</p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <label class="block">
              <span class="text-xs text-muted-foreground">螺纹规格</span>
              <select v-model="boltSpec" class="mt-1 w-full px-3 py-2 rounded-lg border border-border border-border bg-background text-foreground text-sm">
                <option v-for="s in BOLT_SPECS" :key="s.id" :value="s.id">{{ s.id }}（As {{ s.As }} mm²）</option>
              </select>
            </label>
            <label class="block">
              <span class="text-xs text-muted-foreground">强度等级</span>
              <select v-model="boltGrade" class="mt-1 w-full px-3 py-2 rounded-lg border border-border border-border bg-background text-foreground text-sm">
                <option v-for="g in STRENGTH_GRADES" :key="g.id" :value="g.id">{{ g.id }} 级（屈服 {{ g.yieldMpa }} MPa）</option>
              </select>
            </label>
            <label class="block">
              <span class="text-xs text-muted-foreground">摩擦状态</span>
              <select v-model="boltFriction" class="mt-1 w-full px-3 py-2 rounded-lg border border-border border-border bg-background text-foreground text-sm">
                <option v-for="f in FRICTION_OPTIONS" :key="f.id" :value="f.id">{{ f.label }}</option>
              </select>
            </label>
          </div>

          <div class="grid grid-cols-2 gap-2 text-center mb-3">
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-[10px] text-muted-foreground mb-1">预估预紧力 F</p>
              <p class="text-2xl font-bold text-foreground font-mono">{{ preloadForceText }}<span class="text-xs font-normal text-muted-foreground ml-0.5">kN</span></p>
            </div>
            <div class="bg-primary/10 rounded-lg p-4">
              <p class="text-[10px] text-muted-foreground mb-1">建议扭矩 T（N·m）</p>
              <p class="text-2xl font-bold text-primary font-mono">{{ preloadTorqueText }}</p>
            </div>
          </div>

          <button
            @click="usePreloadTorque"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 把该扭矩载入换算器
          </button>

          <p class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground flex items-start gap-1.5 mt-3">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>粗估，精确按 VDI 2230 / ISO 16047 计算：K≈0.2 为通用简化（干态镀锌），实际受螺纹精度、垫圈、润滑剂影响极大；重要连接请用扭矩-转角法或超声波测量并按设计文件执行。</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 页面说明条 -->
    <div class="bg-muted/40 border border-border rounded-lg px-4 py-3 mb-6 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        换算系数为精确定义值；换算后请以扭矩扳手实测为准（扳手精度 ±4% 级）。螺栓参考扭矩为公开经验值，重要连接请按设计文件与润滑状态修正。
      </p>
    </div>

    <!-- 场景参考表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Gauge class="w-5 h-5 mr-2 text-primary" /> 场景参考扭矩（点击行载入中值换算）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">lb-ft 列由 N·m 参考区间自动换算；区间随车型 / 材质 / 润滑状态差异较大，以维修手册为准。</p>

      <div class="overflow-x-auto">
        <div class="min-w-[640px]">
          <div class="grid grid-cols-[1.4fr_0.8fr_0.9fr_1.6fr] gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground border-b border-border">
            <span>场景</span><span>N·m 区间</span><span>≈ lb-ft 区间</span><span>说明</span>
          </div>
          <button
            v-for="row in scenarioRows"
            :key="row.name"
            @click="loadScenario(row)"
            class="w-full grid grid-cols-[1.4fr_0.8fr_0.9fr_1.6fr] gap-2 px-3 py-2.5 text-left text-xs border-b border-border/60 hover:bg-primary/5 transition items-center"
          >
            <span class="font-medium text-foreground">{{ row.name }}</span>
            <span class="font-mono text-foreground">{{ row.rangeText }}</span>
            <span class="font-mono text-muted-foreground">{{ row.rangeLbftText }}</span>
            <span class="text-muted-foreground leading-snug">{{ row.note }}</span>
          </button>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>N·m、kgf·m、lb-ft 都是什么单位？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          扭矩等于力乘以力臂，国际单位制（SI / ISO 80000）里是牛顿米（N·m）：1 N 的力作用在 1 m 力臂末端。
          kgf·m（公斤力米，德标时代常写作 mkp / kpm）是米制工程单位：1 kgf 为 1 千克质量在标准重力加速度下的重量，故 1 kgf·m = 9.80665 N·m，常见于日系与欧洲老维修手册。
          英制侧用磅力英尺 lbf·ft（口语 lb-ft / ft-lbs）和磅力英寸 lbf·in（lb-in）：1 lbf·ft = 1.355817948 N·m，且 1 lb-ft 恰好等于 12 lb-in。
          美系车手册、扭力扳手刻度盘上的「Lb-Ft」就是它。三个制式指的是同一物理量，只是标尺不同。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么 1 kgf·m 是 9.80665 而不是 10？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          kgf（千克力）定义为 1 kg × g₀，其中 g₀ = 9.80665 m/s² 是 1901 年国际计量大会约定的标准重力加速度，因此 1 kgf·m 精确等于 9.80665 N·m，不是近似 9.8，更不是 10。
          车间里流传的「100 N·m ≈ 10 kg」土算法（按 1:10 取整）会带来约 2% 的系统性偏差——对普通紧固无伤大雅，但放在轮胎螺丝上，10 kg 土法设定的 100 N·m 实际只差 2 N·m，
          若反过来把扳手调到「10」想凑 100 N·m，误差方向就取决于哪端被取整。±4% 精度的扳手叠加 ±2% 的心算取整，已接近 6% 的总偏差，重要连接请勿使用土法。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">扳手上的单位开关别搞错（真实事故向）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          数显扭力扳手普遍支持 N·m / kgf·m / lb-ft / lb-in 一键切换，显示数字不变、单位变了就是灾难：lb-ft 比 N·m 大约 1.36 倍，
          把「100」当成 N·m 却在 lb-ft 档设定，实际拧紧 135.6 N·m，超扭 36%；换成 lb-in 档则差 8.85 倍。
          典型事故包括：轮毂超扭导致螺栓屈服、下次拆不下或断裂；自行车把立用 lb-in 档当 N·m 设定拧裂碳纤维前叉竖管；火花塞超扭拧断在缸盖里。
          动手前先确认屏幕右下角单位标识，再对照本工具换算一次——切换单位后数字应乘 1.356（N·m→lb-ft 为除以 1.356）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">预紧扭矩公式 T ≈ K·F·d 里的 K 是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          K 叫螺母系数（nut factor），是把「螺纹副摩擦 + 端面摩擦」折算进扭矩的综合经验系数：扭矩的约 90% 被摩擦吃掉，只有约 10% 真正转化为螺栓拉伸。
          干净干态钢螺纹 K≈0.20，轻度机油 / 二硫化钼润滑可到 0.14-0.16，锈蚀或脏污界面能超过 0.25；镀锌、达克罗涂层也有各自的 K 值。
          同一预紧力目标下，K 从 0.20 换成 0.14，所需扭矩直降三成——这就是「同一颗螺栓，上不上油差 30% 扭矩」的原因。
          K 本质是估算参数，散差可达 ±25%，正式设计请走 VDI 2230 或用扭矩-转角法、超声波伸长测量。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">轮胎螺丝到底打多少？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          乘用车轮毂螺栓以 M12 / M14 为主：M12 常见 90-120 N·m（66-88 lb-ft），M14 常见 120-140 N·m（88-103 lb-ft），
          部分欧系大车 M14x1.5 可达 140-170 N·m，务必以随车手册为准。操作要点：先对角（星形）分 2-3 遍逐步加力，最后按顺序打到终值；
          新装轮毂行驶 50-100 km 后复验一遍；气动扳手的「最高档」通常远超终值，打完必须用手动扭力扳手校核；螺栓涂油会把实际预紧力推高 20-30%，除非手册允许否则保持干态。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">轮胎螺丝该拧多少 N·m？换成 lb-ft 是多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">多数家用车 M12 轮毂螺栓为 90-120 N·m（约 66-88 lb-ft），M14 为 120-140 N·m（约 88-103 lb-ft）。先查随车手册，按星形对角分 2-3 遍加力，用手动扭力扳手给终值，气动扳手只用于预紧与拆卸。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">1 kgf·m 为什么是 9.80665 N·m 而不是 10？</h3>
            <p class="text-sm text-muted-foreground mt-1">kgf 由标准重力加速度 g₀=9.80665 m/s² 定义，所以 1 kgf·m 精确等于 9.80665 N·m。车间「1:10」土法会引入约 2% 固定偏差，叠加扳手 ±4% 精度后总误差可观，重要连接不要用土法。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">扭矩扳手换算后还是不准怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">先检查扳手当前单位档位（N·m / lb-ft / lb-in 一键切换后数字不变单位变了），再确认量程：扳手在量程 20% 以下误差显著偏大；每 12 个月或 5000 次使用后应送校。换算本身用精确系数，误差主要来自工具与摩擦状态。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">换算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有换算与预紧估算都在你的浏览器本地完成，不发送任何网络请求，输入数值不会被存储或记录。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'torque-unit-converter'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Wrench, Gauge, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '扭矩单位换算器 - 在线N·m/kgf·m/lb-ft/lb-in扭矩互换工具',
  description: '免费在线扭矩单位换算，N·m、kgf·m、lbf·ft、lbf·in 四单位双向精确互转，附轮胎螺丝与火花塞等场景参考扭矩、N·m↔lb-ft 速换表与螺栓预紧扭矩粗估，汽修机修自行车装机必备，纯浏览器本地运行不上传',
  keywords: '扭矩换算 N·m lb-ft kgf·m,扭力单位换算,扭矩扳手换算,轮胎扭矩 N·m,螺栓预紧力',
  author: '有条工具',
  ogTitle: '扭矩单位换算器 - 在线N·m/kgf·m/lb-ft/lb-in扭矩互换工具 | 有条工具',
  ogDescription: 'N·m、kgf·m、lb-ft、lb-in 四单位精确互转，轮胎螺栓场景参考与预紧扭矩粗估，纯本地换算。',
  ogUrl: 'https://www.util.cn/tools/torque-unit-converter',
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
          name: '扭矩单位换算器',
          url: 'https://www.util.cn/tools/torque-unit-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['N·m/kgf·m/lbf·ft/lbf·in 四单位双向互转', '精确换算系数（1 kgf·m = 9.80665 N·m）', '轮胎/火花塞/把立等 12 条场景参考扭矩', 'N·m↔lb-ft 常用速换卡', '螺栓预紧扭矩 T≈K·F·d 粗估', '结果一键复制', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '扭矩单位换算器', item: 'https://www.util.cn/tools/torque-unit-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '轮胎螺丝该拧多少 N·m？换成 lb-ft 是多少？',
              acceptedAnswer: { '@type': 'Answer', text: '多数家用车 M12 轮毂螺栓为 90-120 N·m（约 66-88 lb-ft），M14 为 120-140 N·m（约 88-103 lb-ft）。先查随车手册，按星形对角分2-3遍加力，用手动扭力扳手给终值，气动扳手只用于预紧与拆卸。' }
            },
            {
              '@type': 'Question',
              name: '1 kgf·m 为什么是 9.80665 N·m 而不是 10？',
              acceptedAnswer: { '@type': 'Answer', text: 'kgf 由标准重力加速度 g₀=9.80665 m/s² 定义，所以 1 kgf·m 精确等于 9.80665 N·m。车间 1:10 土法会引入约 2% 固定偏差，叠加扳手 ±4% 精度后总误差可观，重要连接不要用土法。' }
            },
            {
              '@type': 'Question',
              name: '扭矩扳手换算后还是不准怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '先检查扳手当前单位档位（N·m/lb-ft/lb-in 切换后数字不变、单位变了就是灾难），再确认量程：扳手在量程20%以下误差显著偏大；每12个月或5000次使用后应送校。换算本身用精确系数，误差主要来自工具与摩擦状态。' }
            },
            {
              '@type': 'Question',
              name: '换算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有换算与预紧估算都在浏览器本地完成，不发送任何网络请求，输入数值不会被存储或记录。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 换算系数以 N·m 为基准：NM_PER[unit] = 该单位 1 份对应多少 N·m（均为精确定义值）
const NM_PER = {
  Nm: 1,             // 1 N·m
  kgfm: 9.80665,     // 1 kgf·m = 1 kgf × 1 m，g₀ = 9.80665 m/s²
  lbft: 1.355817948, // 1 lbf·ft（磅力英尺）
  lbin: 0.112984829  // 1 lbf·in（磅力英寸）= 1 lb-ft ÷ 12
}

const UNITS = [
  { id: 'Nm', symbol: 'N·m', name: '牛顿米', systemLabel: '国际单位制 SI' },
  { id: 'kgfm', symbol: 'kgf·m', name: '公斤力米', systemLabel: '米制工程单位' },
  { id: 'lbft', symbol: 'lb-ft', name: '磅力英尺', systemLabel: '英制' },
  { id: 'lbin', symbol: 'lb-in', name: '磅力英寸', systemLabel: '英制' }
]

function unitById(id) {
  return UNITS.find((u) => u.id === id) || null
}

// 任意单位 → N·m
function toNm(value, unitId) {
  const k = NM_PER[unitId]
  if (!Number.isFinite(value) || typeof k !== 'number') return NaN
  return value * k
}

// N·m → 任意单位
function fromNm(nm, unitId) {
  const k = NM_PER[unitId]
  if (!Number.isFinite(nm) || typeof k !== 'number') return NaN
  return nm / k
}

// 通用换算：value 按 fromId 输入，结果按 toId 表达
function convertTorque(value, fromId, toId) {
  return fromNm(toNm(value, fromId), toId)
}

// 输入解析：空串 / 非数字 / 负数一律视为无效
function parseTorqueInput(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// 展示格式化：按量级自适应小数位
function fmtTorque(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  const a = Math.abs(v)
  const d = a >= 1000 ? 1 : a >= 10 ? 2 : a >= 1 ? 3 : 4
  return v.toFixed(d)
}

// 场景参考扭矩（公开经验值，以 N·m 计；lb-ft 列由系数自动换算）
const SCENARIOS = [
  { name: '汽车轮毂螺栓 M12', min: 90, max: 120, note: '家用车主流区间（≈66-88 lb-ft），星形对角分遍加力，50-100km 后复验' },
  { name: '汽车轮毂螺栓 M14', min: 120, max: 140, note: '较大车型/大螺栓（≈88-103 lb-ft），部分欧系可达 170，以手册为准' },
  { name: '火花塞（钢座）', min: 20, max: 30, note: '新垫圈塞接触后再旋 1/2 圈；铝制缸盖按下限，防拧断' },
  { name: '机油放油塞', min: 30, max: 50, note: '宁小勿大，超扭易拧滑油底壳螺纹；密封垫压紧即可' },
  { name: '自行车把立顶盖/侧螺栓', min: 5, max: 6, note: '碳纤维件严禁超出，遵循部件激光刻印值' },
  { name: '自行车曲柄（方孔）', min: 12, max: 14, note: '首次骑行后复紧，防松脱磨方孔' },
  { name: '山地车碟片螺栓（M5x6）', min: 5, max: 6, note: '六孔星形小步多次拧紧，防碟片偏摆' },
  { name: '饮料瓶盖旋盖（工业）', min: 1.2, max: 1.8, note: '产线开启扭矩 QC 参考，随内垫与润滑状态调整' },
  { name: '管道法兰螺栓 M16', min: 150, max: 180, note: '星形对称分 2-3 遍，垫片坐实升压前复紧' },
  { name: '笔记本 M2 螺钉', min: 0.15, max: 0.25, note: 'M2 自攻超扭即滑丝，建议限扭电批（约 0.2 N·m 级）' },
  { name: '自行车碳纤维座管夹', min: 4, max: 5, note: '配装配膏按刻印值，超出有层裂断裂风险' },
  { name: '发动机连杆螺栓 M9 (10.9)', min: 45, max: 55, note: '连杆多用扭矩+转角法终紧，拆下即换，仅供对照' }
]

// 场景行展示数据：lb-ft 区间自动换算 + 载入值取区间中值
function buildScenarioRows() {
  return SCENARIOS.map((s) => ({
    name: s.name,
    note: s.note,
    mid: (s.min + s.max) / 2,
    rangeText: s.min === s.max ? `${s.min}` : `${s.min}-${s.max}`,
    rangeLbftText: `${fmtTorque(convertTorque(s.min, 'Nm', 'lbft'))}-${fmtTorque(convertTorque(s.max, 'Nm', 'lbft'))}`
  }))
}

// 常用速换表：N·m ↔ lb-ft，100 步进
function buildQuickTable(unitId, otherId) {
  return [100, 200, 300, 400, 500].map((v) => ({
    value: v,
    converted: fmtTorque(convertTorque(v, unitId, otherId))
  }))
}

// 螺栓预紧估算（T ≈ K·F·d 经验式）
const BOLT_SPECS = [
  { id: 'M6', d: 6, As: 20.1 },
  { id: 'M8', d: 8, As: 36.6 },
  { id: 'M10', d: 10, As: 58.0 },
  { id: 'M12', d: 12, As: 84.3 },
  { id: 'M14', d: 14, As: 115 },
  { id: 'M16', d: 16, As: 157 },
  { id: 'M18', d: 18, As: 200 },
  { id: 'M20', d: 20, As: 245 }
]
const STRENGTH_GRADES = [
  { id: '8.8', yieldMpa: 640 },
  { id: '10.9', yieldMpa: 900 }
]
const FRICTION_OPTIONS = [
  { id: 'oiled', label: 'μ≈0.10 轻油/二硫化钼（K=0.16）', mu: 0.10, K: 0.16 },
  { id: 'dry', label: 'μ≈0.14 洁净干态·通用（K=0.20）', mu: 0.14, K: 0.20 },
  { id: 'rust', label: 'μ≈0.20 轻微锈蚀/脏污（K=0.28）', mu: 0.20, K: 0.28 }
]

// 预紧力 F = 0.7×屈服强度×应力截面面积；T = K·F·d（d 换算为米）
function estimateBoltTorque(specId, gradeId, frictionId) {
  const spec = BOLT_SPECS.find((s) => s.id === specId)
  const grade = STRENGTH_GRADES.find((g) => g.id === gradeId)
  const fr = FRICTION_OPTIONS.find((f) => f.id === frictionId)
  if (!spec || !grade || !fr) return null
  const sigma = 0.7 * grade.yieldMpa        // MPa = N/mm²
  const forceN = sigma * spec.As            // N
  const torqueNm = fr.K * forceN * (spec.d / 1000) // N·m
  return { sigma, forceN, torqueNm, K: fr.K }
}
// ---------- 纯逻辑结束 ----------

// ---------- 换算状态 ----------
const inputUnit = ref('Nm')
const inputValue = ref('100')

const parsed = computed(() => parseTorqueInput(inputValue.value))
const nmValue = computed(() => (parsed.value === null ? null : toNm(parsed.value, inputUnit.value)))
const resultRows = computed(() =>
  UNITS.map((u) => ({ ...u, value: nmValue.value === null ? null : fromNm(nmValue.value, u.id) }))
)
const canCopy = computed(() => nmValue.value !== null)

const copyText = computed(() => {
  if (nmValue.value === null) return ''
  const unit = unitById(inputUnit.value)
  const lines = resultRows.value.map((r) => `${r.symbol}: ${fmtTorque(r.value)}`)
  return [`输入: ${parsed.value} ${unit ? unit.symbol : ''}`, ...lines].join('\n')
})

function applyPreset(value, unitId) {
  inputUnit.value = unitId
  inputValue.value = String(value)
}

function resetInput() {
  inputUnit.value = 'Nm'
  inputValue.value = ''
  copied.value = false
}

// ---------- 静态表（纯常量派生，无浏览器 API） ----------
const scenarioRows = buildScenarioRows()
const quickNmTable = buildQuickTable('Nm', 'lbft')
const quickLbftTable = buildQuickTable('lbft', 'Nm')

function loadScenario(row) {
  applyPreset(row.mid, 'Nm')
}

// ---------- 预紧估算状态 ----------
const boltSpec = ref('M12')
const boltGrade = ref('8.8')
const boltFriction = ref('dry')

const preload = computed(() => estimateBoltTorque(boltSpec.value, boltGrade.value, boltFriction.value))
const preloadForceText = computed(() => (preload.value ? (preload.value.forceN / 1000).toFixed(1) : '—'))
const preloadTorqueText = computed(() => (preload.value ? fmtTorque(preload.value.torqueNm) : '—'))

function usePreloadTorque() {
  if (!preload.value) return
  applyPreset(Math.round(preload.value.torqueNm * 10) / 10, 'Nm')
}

// ---------- 复制（浏览器 API 仅在回调中，SSR 安全） ----------
const copied = ref(false)
let copyTimer = null

async function copyResults() {
  if (!canCopy.value) return
  try {
    await navigator.clipboard.writeText(copyText.value)
    copied.value = true
    if (copyTimer !== null) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
    copied.value = false
  }
}

// ---------- SEO 折叠 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('torque-unit-converter')
})
</script>
