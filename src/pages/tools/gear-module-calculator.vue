<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-start gap-3 mb-3">
        <div class="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <component :is="toolIcon" class="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground mb-1">齿轮模数计算器 - 模数齿数对照与径节换算</h1>
          <p class="text-muted-foreground">输入模数与齿数，秒算分度圆、齿顶圆、齿根圆、全齿高与两轮中心距，支持模数↔径节 DP 双向换算，纯本地计算。</p>
        </div>
      </div>
      <p class="text-sm text-muted-foreground">适用于标准直齿圆柱齿轮（正常齿制 ha*=1、c*=0.25），模数序列按 GB/T 1357 自动吸附，适合机修测绘与机械传动速算。</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center gap-2 mb-4">
          <Cog class="w-4 h-4 text-primary" />
          <h2 class="text-base font-semibold text-foreground">齿轮参数</h2>
        </div>

        <div class="space-y-4">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label for="gear-module" class="block text-sm font-medium text-foreground">模数 m（mm）</label>
              <label class="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input v-model="snapEnabled" type="checkbox" class="w-4 h-4 rounded border border-border">
                吸附到标准模数（GB/T 1357）
              </label>
            </div>
            <input
              id="gear-module"
              v-model.number="mInput"
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              class="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="如 2"
            >
            <p v-if="snapInfo" class="text-xs mt-1" :class="snapInfo.snapped ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'">
              {{ snapInfo.text }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2 text-foreground">常用模数</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in presetModules"
                :key="preset"
                @click="mInput = preset"
                :class="[
                  'px-3 py-1.5 rounded-lg text-sm transition border',
                  Number(mInput) === preset
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground border-transparent'
                ]"
              >
                m{{ preset }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="gear-z1" class="block text-sm font-medium mb-1 text-foreground">小轮齿数 z₁</label>
              <input
                id="gear-z1"
                v-model.number="z1"
                type="number"
                min="5"
                max="500"
                step="1"
                class="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
            </div>
            <div>
              <label for="gear-z2" class="block text-sm font-medium mb-1 text-foreground">大轮齿数 z₂</label>
              <input
                id="gear-z2"
                v-model.number="z2"
                type="number"
                min="5"
                max="500"
                step="1"
                class="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
            </div>
          </div>

          <div class="p-3 rounded-lg bg-muted">
            <p class="text-xs text-muted-foreground leading-relaxed">按标准直齿圆柱齿轮正常齿制计算：齿顶高系数 ha*=1，顶隙系数 c*=0.25，齿根高 hf = 1.25m，全齿高 h = 2.25m。变位齿轮、斜齿轮（用法向模数）不适用本页公式。</p>
          </div>
        </div>
      </div>

      <!-- 结果区 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Calculator class="w-4 h-4 text-primary" />
            <h2 class="text-base font-semibold text-foreground">计算结果</h2>
          </div>
          <button
            v-if="results"
            @click="copyResults"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition"
          >
            <Copy v-if="!copied" class="w-3.5 h-3.5" />
            <Check v-else class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            {{ copied ? '已复制' : '复制结果' }}
          </button>
        </div>

        <template v-if="results">
          <!-- 中心距 -->
          <div class="p-4 bg-muted rounded-lg mb-4">
            <p class="text-sm text-muted-foreground mb-1">标准安装中心距 a = m(z₁+z₂)/2</p>
            <p class="text-3xl font-bold text-primary font-mono">{{ fmtLen(results.a) }}<span class="text-base font-normal text-muted-foreground ml-1">mm</span></p>
          </div>

          <!-- 两轮几何参数 -->
          <div class="overflow-x-auto mb-4">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-muted-foreground border-b border-border">
                  <th class="text-left py-2 pr-3 font-medium">参数</th>
                  <th class="text-right py-2 px-3 font-medium">公式</th>
                  <th class="text-right py-2 pl-3 font-medium">齿轮 1（z={{ results.z1 }}）</th>
                  <th class="text-right py-2 pl-3 font-medium">齿轮 2（z={{ results.z2 }}）</th>
                </tr>
              </thead>
              <tbody class="text-foreground">
                <tr class="border-b border-border/60">
                  <td class="py-2 pr-3">分度圆直径 d</td>
                  <td class="text-right px-3 text-xs text-muted-foreground font-mono">d = m·z</td>
                  <td class="text-right pl-3 font-mono">{{ fmtLen(results.g1.d) }}</td>
                  <td class="text-right pl-3 font-mono">{{ fmtLen(results.g2.d) }}</td>
                </tr>
                <tr class="border-b border-border/60">
                  <td class="py-2 pr-3">齿顶圆直径 da</td>
                  <td class="text-right px-3 text-xs text-muted-foreground font-mono">da = m(z+2)</td>
                  <td class="text-right pl-3 font-mono">{{ fmtLen(results.g1.da) }}</td>
                  <td class="text-right pl-3 font-mono">{{ fmtLen(results.g2.da) }}</td>
                </tr>
                <tr class="border-b border-border/60">
                  <td class="py-2 pr-3">齿根圆直径 df</td>
                  <td class="text-right px-3 text-xs text-muted-foreground font-mono">df = m(z−2.5)</td>
                  <td class="text-right pl-3 font-mono">{{ fmtLen(results.g1.df) }}</td>
                  <td class="text-right pl-3 font-mono">{{ fmtLen(results.g2.df) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 齿高与其它参数 -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            <div class="p-2.5 rounded-lg bg-muted/60">
              <p class="text-[11px] text-muted-foreground mb-0.5">齿顶高 ha = m</p>
              <p class="font-mono text-sm text-foreground">{{ fmtLen(results.ha) }} mm</p>
            </div>
            <div class="p-2.5 rounded-lg bg-muted/60">
              <p class="text-[11px] text-muted-foreground mb-0.5">齿根高 hf = 1.25m</p>
              <p class="font-mono text-sm text-foreground">{{ fmtLen(results.hf) }} mm</p>
            </div>
            <div class="p-2.5 rounded-lg bg-muted/60">
              <p class="text-[11px] text-muted-foreground mb-0.5">全齿高 h = 2.25m</p>
              <p class="font-mono text-sm text-foreground">{{ fmtLen(results.h) }} mm</p>
            </div>
            <div class="p-2.5 rounded-lg bg-muted/60">
              <p class="text-[11px] text-muted-foreground mb-0.5">顶隙 c = 0.25m</p>
              <p class="font-mono text-sm text-foreground">{{ fmtLen(results.c) }} mm</p>
            </div>
            <div class="p-2.5 rounded-lg bg-muted/60">
              <p class="text-[11px] text-muted-foreground mb-0.5">齿距 p = πm</p>
              <p class="font-mono text-sm text-foreground">{{ fmtLen(results.pitch) }} mm</p>
            </div>
            <div class="p-2.5 rounded-lg bg-muted/60">
              <p class="text-[11px] text-muted-foreground mb-0.5">传动比 i = z₂/z₁</p>
              <p class="font-mono text-sm text-foreground">{{ results.ratio }}</p>
            </div>
          </div>

          <p v-if="results.undercut" class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground">
            <TriangleAlert class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-amber-500" />
            {{ results.undercut }}
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">采用模数 m = {{ fmtLen(results.m) }} mm{{ results.snapped ? '（已由输入值吸附）' : '' }}；中心距为无侧隙标准安装理论值，实际装配考虑侧隙与公差。</p>
        </template>

        <div v-else class="p-8 text-center text-sm text-muted-foreground">
          请输入大于 0 的模数和 5~500 之间的整数齿数
        </div>
      </div>

      <!-- 模数 ↔ 径节换算 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6">
        <div class="flex items-center gap-2 mb-1">
          <ArrowLeftRight class="w-4 h-4 text-primary" />
          <h2 class="text-base font-semibold text-foreground">公制模数 ↔ 英制径节 DP 换算</h2>
        </div>
        <p class="text-xs text-muted-foreground mb-4">换算关系：m = 25.4 / DP（25.4 mm/英寸）。径节 DP 为每英寸分度圆直径上的齿数，数值越大齿越小。</p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div class="flex gap-2 mb-3">
              <button
                @click="dpMode = 'dp2m'"
                :class="['px-3 py-1.5 rounded-lg text-sm transition border', dpMode === 'dp2m' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80']"
              >径节 DP → 模数 m</button>
              <button
                @click="dpMode = 'm2dp'"
                :class="['px-3 py-1.5 rounded-lg text-sm transition border', dpMode === 'm2dp' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80']"
              >模数 m → 径节 DP</button>
            </div>

            <label :for="dpMode === 'dp2m' ? 'dp-input' : 'm-convert-input'" class="block text-sm font-medium mb-1 text-foreground">
              {{ dpMode === 'dp2m' ? '径节 DP（1/in）' : '模数 m（mm）' }}
            </label>
            <input
              :id="dpMode === 'dp2m' ? 'dp-input' : 'm-convert-input'"
              v-model.number="dpValue"
              type="number"
              min="0.1"
              max="200"
              step="0.1"
              class="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              :placeholder="dpMode === 'dp2m' ? '如 10' : '如 2.54'"
            >

            <div v-if="dpResult" class="p-4 bg-muted rounded-lg mt-3">
              <p class="text-xs text-muted-foreground mb-1">{{ dpMode === 'dp2m' ? `DP = ${trimNum(dpValue)} → 模数 m = 25.4 / ${trimNum(dpValue)}` : `m = ${trimNum(dpValue)} → 径节 DP = 25.4 / ${trimNum(dpValue)}` }}</p>
              <p class="text-2xl font-bold text-primary font-mono">
                {{ dpMode === 'dp2m' ? `m = ${fmtLen(dpResult)} mm` : `DP = ${fmtLen(dpResult)} /in` }}
              </p>
              <p v-if="dpMode === 'dp2m'" class="text-xs mt-1" :class="dpSnapText.snapped ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'">{{ dpSnapText.text }}</p>
            </div>
            <div v-else class="p-4 bg-muted rounded-lg mt-3 text-sm text-muted-foreground text-center">请输入大于 0 的数值</div>
          </div>

          <div>
            <p class="text-sm font-medium text-foreground mb-2">常用 DP ↔ m 对照</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                v-for="row in dpTable"
                :key="row.dp"
                @click="loadDp(row.dp)"
                class="p-2.5 rounded-lg bg-muted/60 hover:bg-primary/5 transition text-left"
              >
                <p class="font-mono text-sm text-foreground">DP {{ row.dp }}</p>
                <p class="font-mono text-xs text-muted-foreground">m ≈ {{ row.m }} mm</p>
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-3 leading-relaxed">英制径节制齿轮与公制模数制齿轮齿形参数不同，换算值仅供对照参考，替换配件时请核对齿形角（20° / 14.5°）与齿制。</p>
          </div>
        </div>
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
        <HelpCircle v-else class="w-5 h-5" />
      </button>

      <div v-show="seoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是齿轮模数计算器
        </h2>
        <p class="text-muted-foreground mb-4">
          齿轮模数计算器是一款面向机修与机械传动的在线速算工具：输入模数 m 和齿数 z，立即得到分度圆直径 d = mz、齿顶圆直径 da = m(z+2)、齿根圆直径 df = m(z−2.5) 与全齿高 2.25m；再输入配对齿轮齿数即可算出标准安装中心距 a = m(z₁+z₂)/2。工具还内置公制模数与英制径节 DP 的双向换算（m = 25.4/DP）以及 GB/T 1357 标准模数序列吸附，测绘旧齿轮、采购备件时尤其方便。全部计算在浏览器本地完成。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>输入模数 m（可勾选"吸附到标准模数"，输入值自动归到 GB/T 1357 序列并保留原值提示）；</li>
          <li>输入两个齿轮的齿数 z₁、z₂（单齿轮几何只看齿轮 1 一列即可）；</li>
          <li>读取分度圆、齿顶圆、齿根圆与中心距，点击"复制结果"粘贴到工单；</li>
          <li>遇到英制齿轮，切到"径节 DP → 模数 m"，输入 DP 即得到公制模数。</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          齿轮几何计算公式（标准直齿、正常齿制）
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>分度圆直径</strong>：d = m·z，模数是每齿占分度圆直径的毫米数；</li>
          <li><strong>齿顶圆直径</strong>：da = m(z + 2)，齿顶高 ha = m（ha* = 1）；</li>
          <li><strong>齿根圆直径</strong>：df = m(z − 2.5)，齿根高 hf = 1.25m（含顶隙 0.25m）；</li>
          <li><strong>全齿高</strong>：h = 2.25m；<strong>齿距</strong>：p = πm；</li>
          <li><strong>标准中心距</strong>：a = m(z₁ + z₂) / 2，即两轮分度圆半径之和；</li>
          <li><strong>模数 ↔ 径节</strong>：m = 25.4 / DP，如 DP 10 对应 m 2.54。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4 mb-6">
          <div>
            <h3 class="text-lg font-semibold text-foreground">齿轮模数是什么？</h3>
            <p class="text-muted-foreground mt-1">
              模数 m = d / z，是分度圆直径除以齿数得到的每齿长度（mm），反映轮齿的大小：模数越大，齿越厚、承载能力越高。
              例如 m=2、z=20 的齿轮分度圆直径 d = 2×20 = 40 mm，齿顶圆 da = 44 mm，齿根圆 df = 35 mm。
              我国国标 GB/T 1357 规定了 1、1.25、1.5、2、2.5、3、4、5、6、8、10 等标准模数序列，设计时应优先选用。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">模数和径节 DP 怎么换算？</h3>
            <p class="text-muted-foreground mt-1">
              径节 DP 是英制单位，表示每英寸分度圆直径上的齿数，与公制模数互为倒数关系：m = 25.4 / DP，DP = 25.4 / m。
              例如 DP 10 的齿轮对应 m = 25.4 / 10 = 2.54 mm。注意英制径节制齿轮与公制模数制齿轮齿形体系不同，换算值仅供对照，不能直接互换啮合。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么齿数少于 17 会根切？</h3>
            <p class="text-muted-foreground mt-1">
              标准直齿圆柱齿轮（ha* = 1、压力角 20°）不发生根切的最少齿数是 17。齿数少于 17 时，刀具顶部会切去齿根部分渐开线，削弱齿根强度。
              工程上常用变位齿轮（正变位）来避免根切，此时齿顶圆、齿根圆与中心距都会偏离本页标准公式，需另行计算。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">算出的中心距是装配尺寸吗？</h3>
            <p class="text-muted-foreground mt-1">
              a = m(z₁+z₂)/2 是无侧隙标准安装的理论中心距。实际装配要预留齿侧间隙，箱体孔距公差、轴承游隙都会影响最终啮合质量，
              加工与检修时请结合图纸公差与接触斑点检查确认。
            </p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          相关工具
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground">
          <li><NuxtLink to="/tools/tolerance-fit-lookup" class="text-primary hover:underline">公差配合速查</NuxtLink>：查轴孔配合上下偏差与最大间隙 / 过盈；</li>
          <li><NuxtLink to="/tools/torque-unit-converter" class="text-primary hover:underline">扭矩单位换算器</NuxtLink>：N·m、kgf·m、lb-ft、lb-in 四单位互算；</li>
          <li><NuxtLink to="/tools/belt-length-calculator" class="text-primary hover:underline">皮带长度计算器</NuxtLink>：带轮直径与中心距对应的带长速算；</li>
          <li><NuxtLink to="/tools/caliper-calculator" class="text-primary hover:underline">卡尺计算器</NuxtLink>：游标卡尺读数练习与换算。</li>
        </ul>
      </div>
    </div>

    <!-- 相关推荐 -->
    <RelatedTools :current-tool-id="'gear-module-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Cog, Calculator, Copy, Check, TriangleAlert, ArrowLeftRight, ChevronUp, HelpCircle } from 'lucide-vue-next'
import { addRecentTool } from '~/composables/useTools'
import { resolveToolIcon } from '~/utils/toolIcons'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO配置
useSeoMeta({
  title: '齿轮模数计算器 - 模数齿数对照与径节DP换算 | 有条工具',
  description: '免费在线齿轮模数计算器：输入模数与齿数速算分度圆d=mz、齿顶圆、齿根圆、全齿高与中心距a=m(z1+z2)/2，支持模数与径节DP双向换算（m=25.4/DP）及GB/T 1357标准模数吸附，纯本地计算。',
  keywords: '齿轮模数计算,模数齿数对照,分度圆直径计算,齿顶圆齿根圆,中心距计算,径节换算 DP,模数径节换算,gear module calculator,GB/T 1357 标准模数',
  author: '有条工具',
  ogTitle: '齿轮模数计算器 - 模数齿数对照与径节换算',
  ogDescription: '模数齿数秒算分度圆/齿顶圆/齿根圆与中心距，支持模数↔径节DP双向换算与标准模数吸附，纯本地计算。',
  ogUrl: 'https://www.util.cn/tools/gear-module-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '齿轮模数计算器 - 机械传动速算',
  twitterDescription: '模数齿数、中心距与径节DP换算速算工具，纯本地计算。'
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
          name: '齿轮模数计算器',
          url: 'https://www.util.cn/tools/gear-module-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '分度圆 d=mz、齿顶圆 da=m(z+2)、齿根圆 df=m(z-2.5)',
            '标准安装中心距 a=m(z1+z2)/2',
            '全齿高 2.25m、齿距 πm、传动比',
            '模数↔径节 DP 双向换算（m=25.4/DP）',
            'GB/T 1357 标准模数序列吸附并保留原值',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '齿轮模数计算器', item: 'https://www.util.cn/tools/gear-module-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '齿轮模数是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '模数 m = d / z，是分度圆直径除以齿数的每齿长度（mm），反映轮齿大小。例如 m=2、z=20 的齿轮分度圆 40mm，齿顶圆 44mm，齿根圆 35mm。GB/T 1357 规定了标准模数序列。' }
            },
            {
              '@type': 'Question',
              name: '模数和径节 DP 怎么换算？',
              acceptedAnswer: { '@type': 'Answer', text: 'm = 25.4 / DP，DP = 25.4 / m。例如 DP 10 对应 m = 2.54。英制径节制与公制模数制齿形体系不同，换算仅供对照，不能直接互换啮合。' }
            },
            {
              '@type': 'Question',
              name: '为什么齿数少于 17 会根切？',
              acceptedAnswer: { '@type': 'Answer', text: '标准直齿圆柱齿轮（ha*=1、压力角20°）不发生根切的最少齿数是17。少于17时刀具会切去齿根渐开线，常用变位齿轮避免，此时需另行计算几何尺寸。' }
            }
          ]
        }
      ]
    })
  }]
})

const trackToolUsage = () => { addRecentTool('gear-module-calculator') }
onMounted(() => { trackToolUsage() })

const toolIcon = resolveToolIcon('Cog', 'calculate')

// ---------- 标准模数序列（GB/T 1357，mm） ----------
const SERIES_1 = [0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 25, 32, 40, 50]
const SERIES_2 = [0.35, 0.7, 0.9, 1.75, 2.25, 2.75, 3.25, 3.5, 3.75, 4.5, 5.5, 6.5, 7, 9, 11, 14, 18, 22, 28, 36, 45]

// 就近吸附：第一系列优先（相同距离时先遍历者胜出）
function snapModule(m: number): { value: number, series: 1 | 2 } | null {
  if (!Number.isFinite(m) || m <= 0) return null
  let best: { value: number, series: 1 | 2 } | null = null
  let bestDiff = Infinity
  for (const v of SERIES_1) {
    const diff = Math.abs(m - v)
    if (diff < bestDiff - 1e-9) { bestDiff = diff; best = { value: v, series: 1 } }
  }
  for (const v of SERIES_2) {
    const diff = Math.abs(m - v)
    if (diff < bestDiff - 1e-9) { bestDiff = diff; best = { value: v, series: 2 } }
  }
  return best
}

const presetModules = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]

// ---------- 纯计算（可独立单测） ----------
function gearGeometry(m: number, z: number) {
  return {
    d: m * z,
    da: m * (z + 2),
    df: m * (z - 2.5)
  }
}

// ---------- 状态 ----------
const mInput = ref<number | null>(2)
const z1 = ref<number | null>(20)
const z2 = ref<number | null>(30)
const snapEnabled = ref(true)
const seoContentVisible = ref(true)
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const snap = computed(() => {
  const m = Number(mInput.value)
  if (!Number.isFinite(m) || m <= 0) return null
  return snapModule(m)
})

const mEffective = computed(() => {
  if (!snapEnabled.value) return Number(mInput.value)
  return snap.value ? snap.value.value : NaN
})

const snapInfo = computed(() => {
  const m = Number(mInput.value)
  if (!Number.isFinite(m) || m <= 0) return null
  const s = snap.value
  if (!s) return null
  const seriesLabel = s.series === 1 ? '第一系列' : '第二系列'
  if (Math.abs(m - s.value) < 1e-9) {
    return { snapped: false, text: `已为标准模数 m${trimNum(s.value)}（GB/T 1357 ${seriesLabel}）。` }
  }
  return { snapped: true, text: `输入 m${trimNum(m)} 已吸附到标准值 m${trimNum(s.value)}（GB/T 1357 ${seriesLabel}），计算按标准值进行。` }
})

interface GearResults {
  m: number
  snapped: boolean
  z1: number
  z2: number
  g1: ReturnType<typeof gearGeometry>
  g2: ReturnType<typeof gearGeometry>
  a: number
  ha: number
  hf: number
  h: number
  c: number
  pitch: number
  ratio: string
  undercut: string
}

const results = computed<GearResults | null>(() => {
  const m = mEffective.value
  const a1 = Number(z1.value)
  const a2 = Number(z2.value)
  if (!Number.isFinite(m) || m <= 0 || m > 100) return null
  if (!Number.isInteger(a1) || !Number.isInteger(a2) || a1 < 5 || a1 > 500 || a2 < 5 || a2 > 500) return null
  const g1 = gearGeometry(m, a1)
  const g2 = gearGeometry(m, a2)
  const ratio = a2 / a1
  let undercut = ''
  if (a1 < 17 || a2 < 17) {
    const small = a1 <= a2 ? a1 : a2
    undercut = `齿数 ${small} 少于 17，标准直齿轮易发生根切，建议正变位或降低齿顶高系数；本页标准公式未计入变位修正。`
  }
  return {
    m,
    snapped: snapEnabled.value && snap.value !== null && Math.abs(Number(mInput.value) - snap.value.value) >= 1e-9,
    z1: a1,
    z2: a2,
    g1,
    g2,
    a: m * (a1 + a2) / 2,
    ha: m,
    hf: 1.25 * m,
    h: 2.25 * m,
    c: 0.25 * m,
    pitch: Math.PI * m,
    ratio: trimNum(Math.round(ratio * 1000) / 1000),
    undercut
  }
})

// ---------- 模数 ↔ 径节 ----------
const dpMode = ref<'dp2m' | 'm2dp'>('dp2m')
const dpValue = ref<number | null>(10)

const dpResult = computed(() => {
  const v = Number(dpValue.value)
  if (!Number.isFinite(v) || v <= 0) return null
  // m = 25.4 / DP 与 DP = 25.4 / m 互为同一运算
  return 25.4 / v
})

const dpSnapText = computed(() => {
  if (dpMode.value !== 'dp2m' || !dpResult.value) return { snapped: false, text: '' }
  const s = snapModule(dpResult.value)
  if (!s) return { snapped: false, text: '' }
  if (Math.abs(dpResult.value - s.value) < 1e-9) {
    return { snapped: false, text: `恰为标准模数 m${trimNum(s.value)}（GB/T 1357）。` }
  }
  return { snapped: true, text: `最近标准模数为 m${trimNum(s.value)}（${s.series === 1 ? '第一' : '第二'}系列），换算值本身非标准值。` }
})

// 常用 DP 对照（DP → m，保留 4 位小数再修剪）
const dpTable = [4, 5, 6, 8, 10, 12, 16, 20].map(dp => ({
  dp,
  m: trimNum(Math.round((25.4 / dp) * 10000) / 10000)
}))

function loadDp(dp: number) {
  dpMode.value = 'dp2m'
  dpValue.value = dp
  trackToolUsage()
}

// ---------- 复制 ----------
const copyResults = async () => {
  const r = results.value
  if (!r) return
  trackToolUsage()
  const lines = [
    `齿轮参数（m=${fmtLen(r.m)} mm，z1=${r.z1}，z2=${r.z2}）`,
    `中心距 a = ${fmtLen(r.a)} mm`,
    `齿轮1：d=${fmtLen(r.g1.d)}，da=${fmtLen(r.g1.da)}，df=${fmtLen(r.g1.df)} mm`,
    `齿轮2：d=${fmtLen(r.g2.d)}，da=${fmtLen(r.g2.da)}，df=${fmtLen(r.g2.df)} mm`,
    `ha=${fmtLen(r.ha)}，hf=${fmtLen(r.hf)}，全齿高 h=${fmtLen(r.h)}，顶隙 c=${fmtLen(r.c)}，齿距 p=${fmtLen(r.pitch)} mm，i=${r.ratio}`
  ]
  if (r.undercut) lines.push(`提示：${r.undercut}`)
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    copied.value = true
    if (copyTimer !== null) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
    copied.value = false
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化 ----------
function trimNum(x: number): string {
  const fixed = (Math.round(x * 1000) / 1000).toFixed(3)
  return fixed.replace(/\.?0+$/, '')
}

function fmtLen(x: number): string {
  return trimNum(x)
}
</script>
