<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Dumbbell class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">力单位换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">N / kN / kgf / lbf / dyn 五单位联动互转，1 kgf = 9.80665 N，称重传感器遗留口径与扭矩-力关系注记</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线力单位换算工具：以牛顿（N，SI）为基准的精确系数（1 kgf = 9.80665 N、1 lbf = 4.4482216152605 N、1 dyn = 0.00001 N），
        在牛顿、千牛、千克力、磅力、达因五个力单位之间实时互转，任一单位输入、其余四个联动更新；
        附体重、握力、螺栓预紧、传感器量程、安全绳破断等 8 条场景参考力（点行即载入换算）、kgf↔N 与 lbf↔N 常用速换卡，以及「扭矩 ÷ 力臂 → 力」联动小算（配合本站扭矩换算器使用）。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Gauge class="w-5 h-5 mr-2 text-primary" /> 输入力
        </h2>

        <div class="grid grid-cols-5 gap-1.5">
          <button
            v-for="u in UNITS"
            :key="u.id"
            @click="inputUnit = u.id"
            class="px-1 py-2 rounded-lg border text-[11px] font-semibold transition"
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
            step="any"
            placeholder="输入数值，如 9.80665"
            class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p class="text-[10px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>输入以当前所选单位计；「kg」在老秤与传感器上多为 kgf 口径（kg 是质量，kgf 才是力）。</span>
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            @click="applyPreset(1, 'kgf')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 1 kgf
          </button>
          <button
            @click="applyPreset(100, 'lbf')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 100 lbf
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
          <p class="text-sm font-medium text-foreground mb-2">常用速换（kgf↔N · lbf↔N）</p>
          <div class="grid grid-cols-2 gap-2 text-center">
            <div>
              <p class="text-[10px] text-muted-foreground mb-1.5">kgf → N</p>
              <div class="space-y-1">
                <button
                  v-for="q in quickKgfTable"
                  :key="'k' + q.value"
                  @click="applyPreset(q.value, 'kgf')"
                  class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition"
                >
                  {{ q.value }} = {{ q.converted }}
                </button>
              </div>
            </div>
            <div>
              <p class="text-[10px] text-muted-foreground mb-1.5">lbf → N</p>
              <div class="space-y-1">
                <button
                  v-for="q in quickLbfTable"
                  :key="'l' + q.value"
                  @click="applyPreset(q.value, 'lbf')"
                  class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition"
                >
                  {{ q.value }} = {{ q.converted }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 结果大表 + 扭矩-力联动（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Dumbbell class="w-5 h-5 mr-2 text-primary" /> 五单位换算结果
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
                {{ r.value === null ? '—' : fmtForce(r.value) }}
              </p>
            </div>
          </div>

          <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
            基准：1 N ≡ 1 N；1 kgf = 9.80665 N（1 kg × 标准重力加速度 g₀ = 9.80665 m/s²，精确定义）；1 lbf = 4.4482216152605 N（1 lb = 0.45359237 kg 精确定义）；
            1 dyn = 0.00001 N（厘米克秒制，1 g·cm/s²）。锚点：60 kg 体重所受重力 ≈ 588.4 N（60 × 9.80665），1 N ≈ 托起 102 g 物体的重力。
          </p>
        </div>

        <!-- 扭矩 ÷ 力臂 → 力 联动小算 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Wrench class="w-5 h-5 mr-2 text-primary" /> 扭矩 ÷ 力臂 → 力（与扭矩换算器联动）
          </h2>
          <p class="text-xs text-muted-foreground mb-4">扭矩 = 力 × 力臂（T = F·L），反向求力 F = T / L。例：300 N·m 扭矩配 0.5 m 扳手需 600 N 推力，加长力臂更省力。</p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <label class="block">
              <span class="text-xs text-muted-foreground">扭矩 T（N·m）</span>
              <input
                v-model="torqueNmInput"
                type="number"
                min="0"
                step="any"
                placeholder="如 300"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="block">
              <span class="text-xs text-muted-foreground">力臂 L（m）</span>
              <input
                v-model="armLengthInput"
                type="number"
                min="0"
                step="any"
                placeholder="如 0.5"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">所需力 F</p>
              <p class="text-2xl font-bold text-primary font-mono">{{ leverForceNText }}<span class="text-xs font-normal text-muted-foreground ml-0.5">N</span></p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center mb-3">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">换算 kgf</p>
              <p class="text-base font-bold text-foreground font-mono">{{ leverForceKgfText }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">换算 lbf</p>
              <p class="text-base font-bold text-foreground font-mono">{{ leverForceLbfText }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">60 kg 成人需体重压</p>
              <p class="text-base font-bold text-foreground font-mono">{{ leverBodyWeightPctText }}</p>
            </div>
          </div>

          <button
            @click="loadLeverForce"
            :disabled="!Number.isFinite(leverForceN)"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 把该力载入换算器
          </button>

          <p class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground flex items-start gap-1.5 mt-3">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>力是矢量（有方向），扭矩是力对转轴的「旋转效果」，两者量纲不同（N 与 N·m），不存在直接换算——本小算只针对「力作用在力臂末端」这一特定几何。需要扭矩侧换算（N·m↔kgf·m↔lb-ft）请用本站扭矩单位换算器。</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 页面说明条 -->
    <div class="bg-muted/40 border border-border rounded-lg px-4 py-3 mb-6 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        kgf（千克力）与 lbf（磅力）是「质量 × 标准重力」定义的力单位，系数为精确定义值，与当地实际重力加速度无关；工程称重、传感器标定遗留 kgf 口径时按 9.80665 折算即可。力学测试与法规定稿以 N/kN 为法定单位。
      </p>
    </div>

    <!-- 场景参考表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Gauge class="w-5 h-5 mr-2 text-primary" /> 场景参考力（点击行载入换算）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">「≈ 换算」列由系数自动换算；强度/预紧类数值为常见量级示例，工程使用以设计文件为准。</p>

      <div class="overflow-x-auto">
        <div class="min-w-[640px]">
          <div class="grid grid-cols-[1.4fr_0.8fr_0.9fr_1.6fr] gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground border-b border-border">
            <span>场景</span><span>参考值</span><span>≈ 换算</span><span>说明</span>
          </div>
          <button
            v-for="row in scenarioRows"
            :key="row.name"
            @click="loadScenario(row)"
            class="w-full grid grid-cols-[1.4fr_0.8fr_0.9fr_1.6fr] gap-2 px-3 py-2.5 text-left text-xs border-b border-border/60 hover:bg-primary/5 transition items-center"
          >
            <span class="font-medium text-foreground">{{ row.name }}</span>
            <span class="font-mono text-foreground">{{ row.valueText }}</span>
            <span class="font-mono text-muted-foreground">{{ row.convertedText }}</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>N、kgf、lbf、dyn 都是什么单位？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          力的国际单位是牛顿（N）＝使 1 kg 质量获得 1 m/s² 加速度所需的力。kgf（千克力）是「1 kg 在标准重力下的重量」，精确定义 1 kgf = 9.80665 N，
          老式弹簧秤、材料试验机、称重传感器上常见；lbf（磅力）按 1 lb = 0.45359237 kg × g₀ 定义，1 lbf = 4.4482216152605 N，美制图纸与火箭推力仍在用；
          dyn（达因）是厘米克秒制（CGS）单位，1 dyn = 0.00001 N，物理学史与表面张力文献中出现。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">60 kg 的体重是多少 N？为什么不是 588 就是 590？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          体重秤上的「60 kg」其实是力的读数（kgf 口径）：所受重力 = 60 × 9.80665 = 588.4 N。粗算用 60 × 9.8 = 588 N，若按 9.81 算则是 588.6 N——四舍五入就是「589 N」的由来。
          注意 588.4 N 是按国际约定的标准重力加速度 g₀ = 9.80665 m/s² 精确计算的，你所在城市的实际重力加速度在 9.77-9.82 之间浮动（纬度与海拔决定），体重秤出厂已按本地校准，不必自行修正。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">称重传感器为什么还标 kgf？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          国内大量存量称重传感器、材料试验机、注塑机合模力表按 kgf/t（吨力）标定，这是历史口径：1 t 力 = 1000 kgf = 9806.65 N ≈ 9.807 kN。
          新国标与出口设备一律要求 N/kN，替换旧传感器或对读数做记录时务必统一口径——「200 kg」量程传感器实际是 1.961 kN，混写单位会让标定证书与上位机显示差 2%。
          kg（质量）与 kgf（力）差一个 g₀：同是「1」的读数，物理量不同，禁止混用。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">扭矩和力是什么关系？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          扭矩 = 力 × 力臂（T = F·L）：同样 100 N 的手力，握在 0.2 m 短扳手上是 20 N·m，换成 0.5 m 长扳手就是 50 N·m——所以加长杆能「轻松拧紧」螺栓。
          反过来已知目标扭矩和扳手长度可求所需推力（用上方联动小算）。两者的单位分别是 N·m 与 N，量纲不同不能直接换算；
          需要扭矩单位互转（N·m ↔ kgf·m ↔ lb-ft）请用本站的扭矩单位换算器，它还带轮胎螺栓等场景参考扭矩与预紧估算。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">1 kgf 等于多少 N？为什么不是 9.8 也不是 10？</h3>
            <p class="text-sm text-muted-foreground mt-1">1 kgf = 9.80665 N，由 1 kg × g₀ = 9.80665 m/s² 精确定义。9.8 是两位小数的近似，10 是车间土法（带来约 2% 系统偏差），正式记录请按 9.80665。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">100 lbf 是多少 N？多少 kgf？</h3>
            <p class="text-sm text-muted-foreground mt-1">100 lbf = 444.82 N ≈ 45.36 kgf（1 lbf ≈ 0.4536 kgf）。美制紧固件、液压缸与火箭推力常用 lbf，翻译图纸时按 4.4482216152605 精确折算。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">达因（dyn）现在还用吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">工程上基本被 N 取代，但表面张力（mN/m 旧称 dyn/cm，数值相同）、胶粘剂剥离强度等文献仍见 1 dyn = 0.00001 N。老物化教材的 CGS 公式代入前先统一到 SI。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">换算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有换算与扭矩-力联动小算都在你的浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'force-convert'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Dumbbell, Wrench, Gauge, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'force-convert'

// ---------- SEO ----------
useSeoMeta({
  title: '力单位换算 - 在线N/kgf/lbf/dyn牛顿千克力磅力换算工具',
  description: '免费在线力单位换算，牛顿 N、千牛 kN、千克力 kgf、磅力 lbf、达因 dyn 五单位双向精确互转（1 kgf = 9.80665 N），附体重/握力/螺栓预紧/传感器量程场景参考表与扭矩-力联动小算，纯浏览器本地运行不上传',
  keywords: '力单位换算,n kgf换算,牛顿千克力,磅力换算,lbf n,达因,称重传感器',
  author: '有条工具',
  ogTitle: '力单位换算 - 在线N/kgf/lbf/dyn牛顿千克力磅力换算工具 | 有条工具',
  ogDescription: '五个力单位精确互转，1 kgf = 9.80665 N，扭矩-力关系注记与称重传感器遗留口径提示，纯本地换算。',
  ogUrl: 'https://www.util.cn/tools/force-convert',
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
          name: '力单位换算器',
          url: 'https://www.util.cn/tools/force-convert',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['N/kN/kgf/lbf/dyn 五单位双向互转', '精确定义系数（1 kgf = 9.80665 N、1 lbf = 4.4482216152605 N）', '体重/握力/螺栓预紧/安全绳 8 条场景参考力', 'kgf↔N、lbf↔N 常用速换卡', '扭矩÷力臂→力联动小算并可载入换算器', '结果一键复制', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '力单位换算器', item: 'https://www.util.cn/tools/force-convert/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1 kgf 等于多少 N？为什么不是 9.8 也不是 10？',
              acceptedAnswer: { '@type': 'Answer', text: '1 kgf = 9.80665 N，由 1 kg × g₀ = 9.80665 m/s² 精确定义。9.8 是近似值，10 是车间土法（约 2% 偏差），正式记录按 9.80665。' }
            },
            {
              '@type': 'Question',
              name: '100 lbf 是多少 N？多少 kgf？',
              acceptedAnswer: { '@type': 'Answer', text: '100 lbf = 444.82 N ≈ 45.36 kgf（1 lbf ≈ 0.4536 kgf）。美制紧固件与液压缸常用 lbf，按 4.4482216152605 精确折算。' }
            },
            {
              '@type': 'Question',
              name: '达因（dyn）现在还用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '工程上基本被 N 取代，但表面张力（dyn/cm 数值等于 mN/m）与胶粘文献仍见，1 dyn = 0.00001 N。CGS 公式代入前先统一到 SI。' }
            },
            {
              '@type': 'Question',
              name: '换算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有换算与扭矩-力联动小算都在浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 换算系数以 N（牛顿）为基准：N_PER[unit] = 该单位 1 份对应多少 N
const N_PER = {
  N: 1,                  // 牛顿（SI）
  kN: 1000,              // 千牛
  kgf: 9.80665,          // 千克力：1 kg × g₀ = 9.80665 m/s²（精确定义）
  lbf: 4.4482216152605,  // 磅力：0.45359237 kg × g₀（精确定义）
  dyn: 0.00001           // 达因：1 g·cm/s²（CGS 制，1 dyn = 1e-5 N）
}

const UNITS = [
  { id: 'N', symbol: 'N', name: '牛顿', systemLabel: '国际单位制 SI' },
  { id: 'kN', symbol: 'kN', name: '千牛', systemLabel: '国际单位制 SI' },
  { id: 'kgf', symbol: 'kgf', name: '千克力', systemLabel: '米制工程单位' },
  { id: 'lbf', symbol: 'lbf', name: '磅力', systemLabel: '英制' },
  { id: 'dyn', symbol: 'dyn', name: '达因', systemLabel: '厘米克秒制 CGS' }
]

function unitById(id) {
  return UNITS.find((u) => u.id === id) || null
}

// 浮点尾差清洗：按 12 位有效数字截断；若与更低有效位的舍入值仅差相对 1e-9 以内则吸附到整值，
// 使往返换算（如 bar→psi→bar）精确回到原值，同时不损失常规换算结果的精度
function cleanFloat(v, sig = 12) {
  if (!Number.isFinite(v)) return NaN
  if (v === 0) return 0
  for (const s of [6, 8, 10]) {
    const cand = Number(v.toPrecision(s))
    if (cand !== 0 && Math.abs(v - cand) / Math.abs(v) < 1e-9) return cand
  }
  return Number(v.toPrecision(sig))
}

// 任意单位 → N
function toN(value, unitId) {
  const k = N_PER[unitId]
  if (!Number.isFinite(value) || typeof k !== 'number') return NaN
  return cleanFloat(value * k)
}

// N → 任意单位
function fromN(n, unitId) {
  const k = N_PER[unitId]
  if (!Number.isFinite(n) || typeof k !== 'number') return NaN
  return cleanFloat(n / k)
}

// 通用换算：value 按 fromId 输入，结果按 toId 表达
function convertForce(value, fromId, toId) {
  return fromN(toN(value, fromId), toId)
}

// 输入解析：空串 / 非数字 / 负数一律视为无效
function parseForceInput(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// 展示格式化：按量级自适应小数位
function fmtForce(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  const a = Math.abs(v)
  if (a < 0.0005) return v.toExponential(2)
  const d = a >= 1000 ? 1 : a >= 10 ? 2 : a >= 1 ? 3 : 4
  return v.toFixed(d)
}

// 扭矩 ÷ 力臂 → 力：F = T / L（仅适用于力作用在力臂末端的几何）
function forceFromTorque(torqueNm, armM) {
  if (!Number.isFinite(torqueNm) || !Number.isFinite(armM) || armM === 0) return NaN
  return cleanFloat(torqueNm / armM)
}
// ---------- 纯逻辑结束 ----------

// ---------- 换算状态 ----------
const inputUnit = ref('kgf')
const inputValue = ref('1')

const parsed = computed(() => parseForceInput(inputValue.value))
const nValue = computed(() => (parsed.value === null ? null : toN(parsed.value, inputUnit.value)))
const resultRows = computed(() =>
  UNITS.map((u) => ({ ...u, value: nValue.value === null ? null : fromN(nValue.value, u.id) }))
)
const canCopy = computed(() => nValue.value !== null)

const copyText = computed(() => {
  if (nValue.value === null) return ''
  const unit = unitById(inputUnit.value)
  const lines = resultRows.value.map((r) => `${r.symbol}: ${fmtForce(r.value)}`)
  return [`输入: ${parsed.value} ${unit ? unit.symbol : ''}`, ...lines].join('\n')
})

function applyPreset(value, unitId) {
  inputUnit.value = unitId
  inputValue.value = String(value)
}

function resetInput() {
  inputValue.value = ''
  copied.value = false
}

// ---------- 静态表（纯常量派生，无浏览器 API） ----------
const scenarioRows = [
  { name: '60 kg 体重所受重力', v: 60, unit: 'kgf', show: 'N', note: '60 × 9.80665 = 588.4 N；体重秤读数即 kgf 口径' },
  { name: '一个中等苹果的重力', v: 1, unit: 'N', show: 'dyn', note: '1 N ≈ 托起 102 g 物体；= 100000 dyn' },
  { name: '成人握力（参考）', v: 350, unit: 'N', show: 'kgf', note: '成年男性 300-500 N，握力计以 kgf/lbf 双标常见' },
  { name: 'M12 8.8 级螺栓预紧力', v: 42, unit: 'kN', show: 'lbf', note: '0.7×640 MPa×84.3 mm²≈37-42 kN，按手册取值' },
  { name: '称重传感器量程', v: 20, unit: 'kgf', show: 'N', note: '遗留口径：20 kgf = 196.133 N ≈ 0.196 kN' },
  { name: '登山安全绳破断强度', v: 22, unit: 'kN', show: 'lbf', note: 'UIAA 认证要求 ≥ 22 kN（约 4946 lbf）' },
  { name: '手指轻按键盘', v: 0.5, unit: 'N', show: 'dyn', note: '机械轴 0.45-0.6 N 触发（45-60 gf），= 50000 dyn' },
  { name: '固体火箭助推器推力', v: 1200, unit: 'kN', show: 'lbf', note: '推力双口径 kN/lbf：1200 kN ≈ 269800 lbf' }
].map((s) => ({
  name: s.name,
  v: s.v,
  unit: s.unit,
  valueText: `${s.v} ${unitById(s.unit)?.symbol || s.unit}`,
  convertedText: `${fmtForce(convertForce(s.v, s.unit, s.show))} ${unitById(s.show)?.symbol || s.show}`,
  note: s.note
}))

const quickKgfTable = [1, 2, 5, 10, 20, 50].map((v) => ({
  value: v,
  converted: fmtForce(convertForce(v, 'kgf', 'N'))
}))
const quickLbfTable = [10, 25, 50, 100, 250, 500].map((v) => ({
  value: v,
  converted: fmtForce(convertForce(v, 'lbf', 'N'))
}))

function loadScenario(row) {
  applyPreset(row.v, row.unit)
}

// ---------- 扭矩-力联动状态 ----------
const torqueNmInput = ref('300')
const armLengthInput = ref('0.5')

const torqueNum = computed(() => parseForceInput(torqueNmInput.value))
const armNum = computed(() => parseForceInput(armLengthInput.value))
const leverForceN = computed(() => forceFromTorque(torqueNum.value, armNum.value))

const leverForceNText = computed(() => (Number.isFinite(leverForceN.value) ? fmtForce(leverForceN.value) : '—'))
const leverForceKgfText = computed(() => (Number.isFinite(leverForceN.value) ? fmtForce(convertForce(leverForceN.value, 'N', 'kgf')) : '—'))
const leverForceLbfText = computed(() => (Number.isFinite(leverForceN.value) ? fmtForce(convertForce(leverForceN.value, 'N', 'lbf')) : '—'))
const leverBodyWeightPctText = computed(() => {
  if (!Number.isFinite(leverForceN.value)) return '—'
  const pct = (leverForceN.value / 588.399) * 100
  return Number.isFinite(pct) ? `${fmtForce(pct)}%` : '—'
})

function loadLeverForce() {
  if (!Number.isFinite(leverForceN.value)) return
  applyPreset(Math.round(leverForceN.value * 100) / 100, 'N')
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

// ---------- 设置持久化（localStorage，键前缀用工具 id，仅 onMounted/交互回调触达） ----------
const SETTINGS_KEY = `${TOOL_ID}-settings`

function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (UNITS.some(u => u.id === s.inputUnit)) inputUnit.value = s.inputUnit
    if (typeof s.inputValue === 'string' && parseForceInput(s.inputValue) !== null) inputValue.value = s.inputValue
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([inputUnit, inputValue], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      inputUnit: inputUnit.value,
      inputValue: inputValue.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})
</script>
