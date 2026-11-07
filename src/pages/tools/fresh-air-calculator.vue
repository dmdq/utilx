<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Wind class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">新风量计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">人均新风量（GB 50736-2012）与换气次数双算法并排取大，m³/h 与 CFM 双单位，附风管尺寸建议</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线新风量计算器：选新风机前先算需要多大风量——方法一按人均新风量（GB 50736-2012：办公室、旅馆客房、住宅按人 30 m³/(h·人) 等标准档），
        方法二按房间换气次数 ACH（住宅 0.5~1、办公 1~2、会议室 2~3 次/h 常用设计值），
        两法并排展示、自动取大值并高亮「设计取大」，同步换算 CFM 风机口径并给出对应风管尺寸建议。
        房间支持「面积」或「长×宽」两种输入，全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Ruler class="w-5 h-5 mr-2 text-primary" /> 房间参数
        </h2>

        <!-- 面积 or 长宽 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">房间面积输入方式</p>
          <div class="grid grid-cols-2 gap-2 mb-2">
            <button type="button" class="px-3 py-1.5 rounded-lg border text-sm font-medium transition" :class="areaMode === 'area' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'" @click="areaMode = 'area'">直接填面积</button>
            <button type="button" class="px-3 py-1.5 rounded-lg border text-sm font-medium transition" :class="areaMode === 'lw' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'" @click="areaMode = 'lw'">长 × 宽</button>
          </div>
          <div v-if="areaMode === 'area'" class="flex items-center gap-2">
            <input v-model.number="area" type="number" min="1" step="1" class="w-28 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono" aria-label="房间面积 平方米">
            <span class="text-xs text-muted-foreground">㎡</span>
          </div>
          <div v-else class="flex items-center gap-2 flex-wrap">
            <input v-model.number="roomL" type="number" min="0.5" step="0.5" class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono" aria-label="房间长 米">
            <span class="text-xs text-muted-foreground">m（长）×</span>
            <input v-model.number="roomW" type="number" min="0.5" step="0.5" class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono" aria-label="房间宽 米">
            <span class="text-xs text-muted-foreground">m（宽）</span>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">当前面积 {{ fmtNum(effArea) }}㎡</p>
        </div>

        <div>
          <label for="fa-height" class="block text-sm font-medium text-foreground mb-1.5">层高（m）</label>
          <div class="flex items-center gap-2">
            <input id="fa-height" v-model.number="height" type="number" min="2" max="6" step="0.1" class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono">
            <span class="text-xs text-muted-foreground">常见住宅 2.8m、办公 3.0~3.6m</span>
          </div>
        </div>

        <div>
          <label for="fa-people" class="block text-sm font-medium text-foreground mb-1.5">房间人数</label>
          <input id="fa-people" v-model.number="people" type="number" min="0" max="100" step="1" class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono">
          <span class="text-xs text-muted-foreground ml-2">人（人均法的输入）</span>
        </div>

        <div>
          <label for="fa-rate" class="block text-sm font-medium text-foreground mb-1.5">方法一 · 人均新风量标准</label>
          <select id="fa-rate" v-model="rateId" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option v-for="r in PERSON_RATES" :key="r.id" :value="r.id">{{ r.label }}</option>
          </select>
          <div v-if="rateId === 'custom'" class="flex items-center gap-2 mt-2">
            <input v-model.number="customRate" type="number" min="5" max="100" step="1" class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono" aria-label="自定义人均新风量">
            <span class="text-xs text-muted-foreground">m³/(h·人)</span>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">取值依据 GB 50736-2012《民用建筑供暖通风与空气调节设计规范》公共建筑主要房间每人所需最小新风量（第 3.0.6 条，强制性条文），以现行标准原文为准。</p>
        </div>

        <div>
          <label for="fa-ach" class="block text-sm font-medium text-foreground mb-1.5">方法二 · 换气次数 ACH（次/h）</label>
          <select id="fa-ach" v-model="achId" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option v-for="a in ACH_PRESETS" :key="a.id" :value="a.id">{{ a.label }}</option>
          </select>
          <div v-if="achId === 'custom'" class="flex items-center gap-2 mt-2">
            <input v-model.number="customAch" type="number" min="0.2" max="10" step="0.1" class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono" aria-label="自定义换气次数">
            <span class="text-xs text-muted-foreground">次/h</span>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">换气次数为暖通设计手册常用经验值（住宅 0.5~1、办公 1~2、会议室 2~3 次/h），按房间用途选取，正式设计以现行规范与标准原文为准。</p>
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
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 双算法结果（取大）
          </h2>
          <div v-if="result" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4 text-center relative">
                <span v-if="result.which === 'person'" class="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-600 border border-green-500/20">设计取大</span>
                <p class="text-xs text-muted-foreground mb-1">方法一 · 人均法</p>
                <p class="text-2xl font-bold" :class="result.which === 'person' ? 'text-primary' : 'text-foreground'">{{ fmtNum(result.qPerson, 0) }}<span class="text-sm font-medium text-muted-foreground ml-1">m³/h</span></p>
                <p class="text-[11px] text-muted-foreground mt-1 font-mono">{{ fmtNum(people, 0) }} 人 × {{ fmtNum(activeRate) }} m³/(h·人)</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 text-center relative">
                <span v-if="result.which === 'ach'" class="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-600 border border-green-500/20">设计取大</span>
                <p class="text-xs text-muted-foreground mb-1">方法二 · 换气次数法</p>
                <p class="text-2xl font-bold" :class="result.which === 'ach' ? 'text-primary' : 'text-foreground'">{{ fmtNum(result.qAch, 0) }}<span class="text-sm font-medium text-muted-foreground ml-1">m³/h</span></p>
                <p class="text-[11px] text-muted-foreground mt-1 font-mono">{{ fmtNum(result.volume, 0) }} m³ × {{ fmtNum(activeAch) }} 次/h</p>
              </div>
            </div>

            <div class="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">设计新风量（两法取大）</p>
              <p class="text-4xl font-bold text-primary">{{ fmtNum(result.design, 0) }}<span class="text-lg font-medium text-muted-foreground ml-1">m³/h</span></p>
              <p class="text-xs text-muted-foreground mt-1 font-mono">≈ {{ fmtNum(result.cfm, 0) }} CFM（÷1.699 换算）</p>
            </div>

            <div class="flex flex-wrap gap-2 text-xs">
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-muted-foreground">房间体积 {{ fmtNum(result.volume, 0) }} m³</span>
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-muted-foreground">按 {{ result.which === 'person' ? '人均法' : '换气次数法' }} 取值</span>
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-muted-foreground">实际换气次数 {{ fmtNum(result.design / result.volume, 2) }} 次/h</span>
            </div>

            <!-- 风管尺寸建议 + 内链 -->
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                <Gauge class="w-4 h-4 text-primary" /> 对应风管尺寸建议
              </p>
              <p class="text-xs text-muted-foreground leading-relaxed">
                按 {{ fmtNum(result.design, 0) }} m³/h、主管风速 4~8 m/s 估算，圆管直径约
                <span class="font-mono text-foreground font-semibold">{{ fmtNum(ductHintOf(result.design) * 1000, 0) }}mm</span>（就近标准管径）。
                支管按 2~4 m/s 会更大一号——精确尺寸请用
                <NuxtLink to="/tools/duct-size-calculator/" class="text-primary font-medium underline underline-offset-2 hover:text-primary/80">风管尺寸计算器</NuxtLink>
                按风量与目标风速直接反算。
              </p>
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed">公式：人均法 Q₁ = 人数 × 人均新风量；换气次数法 Q₂ = 面积 × 层高 × ACH；设计新风量 = max(Q₁, Q₂)；CFM = m³/h ÷ 1.699。</p>
            <button type="button" class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition" @click="copyResult(result.text)">
              <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制结果
            </button>
          </div>
          <p v-else class="p-6 text-center text-sm text-muted-foreground">填入有效的房间参数开始计算</p>
        </div>

        <!-- 标准速查卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Info class="w-5 h-5 mr-2 text-primary" /> 常用取值速查
          </h2>
          <div class="overflow-x-auto mb-3">
            <table class="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead>
                <tr class="bg-muted/60 text-muted-foreground text-xs">
                  <th class="text-left px-3 py-2 font-medium">房间类型</th>
                  <th class="text-right px-3 py-2 font-medium">人均新风量</th>
                  <th class="text-right px-3 py-2 font-medium">常用 ACH</th>
                </tr>
              </thead>
              <tbody class="text-muted-foreground">
                <tr class="border-t border-border"><td class="px-3 py-2 text-foreground">住宅</td><td class="px-3 py-2 text-right font-mono">30</td><td class="px-3 py-2 text-right font-mono">0.5 ~ 1</td></tr>
                <tr class="border-t border-border"><td class="px-3 py-2 text-foreground">办公室</td><td class="px-3 py-2 text-right font-mono">30</td><td class="px-3 py-2 text-right font-mono">1 ~ 2</td></tr>
                <tr class="border-t border-border"><td class="px-3 py-2 text-foreground">旅馆客房</td><td class="px-3 py-2 text-right font-mono">30</td><td class="px-3 py-2 text-right font-mono">1 ~ 2</td></tr>
                <tr class="border-t border-border"><td class="px-3 py-2 text-foreground">会议室</td><td class="px-3 py-2 text-right font-mono">按密度分档</td><td class="px-3 py-2 text-right font-mono">2 ~ 3</td></tr>
                <tr class="border-t border-border"><td class="px-3 py-2 text-foreground">大堂、四季厅</td><td class="px-3 py-2 text-right font-mono">10</td><td class="px-3 py-2 text-right font-mono">1 ~ 2</td></tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed">人均新风量依据 GB 50736-2012 表 3.0.6（单位 m³/(h·人)）；会议室等高密人群房间按人员密度分档另有规定（约 14~19 m³/(h·人) 起步）；ACH 为设计手册常用经验区间。均以现行标准原文为准。</p>
        </div>
      </div>
    </div>

    <!-- SEO 可折叠区 -->
    <details open class="bg-card border border-border rounded-lg p-6 mb-6">
      <summary class="cursor-pointer select-none text-lg font-semibold text-foreground">两种方法、标准依据与常见问题（FAQ）</summary>
      <div class="mt-4 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">核心公式</h3>
          <ul class="list-disc list-inside space-y-1 text-sm text-muted-foreground leading-relaxed">
            <li>人均法：Q₁(m³/h) = 人数 × 人均新风量标准值（GB 50736-2012：办公室 / 客房 / 住宅按人均 30 m³/(h·人)，大堂 10）。</li>
            <li>换气次数法：Q₂(m³/h) = 房间体积(m³) × 换气次数 ACH(次/h)，体积 = 面积 × 层高。</li>
            <li>设计新风量 = max(Q₁, Q₂)——两法并排、取大值，避免「人多人均法不够、人少体积法不够」的偏科。</li>
            <li>CFM 换算：1 CFM = 1.699 m³/h，故 CFM = m³/h ÷ 1.699（选进口风机 / 管道机时常用）。</li>
          </ul>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">为什么两种方法要取大？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            人均法管「人的呼吸需求」——人越多需求越大，但人少的大空间（别墅客厅、空办公室）它会严重低估；
            换气次数法管「空间的稀释需求」——按体积稀释 CO₂ 与污染物，但人员密集的小会议室（10 人小会议室人均法 300 m³/h vs 体积法可能只有 120 m³/h）它又会低估。
            所以规范与设计手册的通行做法就是两法都算、取大值：本工具自动完成并排对比与取大高亮。
          </p>
        </div>

        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">120㎡ 层高 2.8m 的房子，ACH 按 1 算多大风量？</h3>
            <p class="text-sm text-muted-foreground mt-1">Q₂ = 120 × 2.8 × 1 = 336 m³/h；若 4 口人按人均 30 则 Q₁ = 120 m³/h——取大取 336 m³/h（约 198 CFM），选 350 m³/h 档新风机正好。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">住宅 ACH 取 0.5 还是 1？</h3>
            <p class="text-sm text-muted-foreground mt-1">常用设计手册口径：普通住宅满足基本健康通风取 0.5 次/h 即可；对 PM2.5 / CO₂ 敏感、常住人多或有宠物异味的，建议按 1 次/h 配置（机器可低速运行，余量留给高峰）。按 0.5 设计意味着设备小一半，后期无法「加风量」，宁可略大。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">人均 30 m³/h 是怎么来的？</h3>
            <p class="text-sm text-muted-foreground mt-1">按成年人轻活动强度下 CO₂ 浓度不超过约 1000ppm 的稀释需求推导，并被 GB 50736-2012《民用建筑供暖通风与空气调节设计规范》第 3.0.6 条（强制性条文）采纳为公共建筑主要房间（办公室、客房等）每人最小新风量；GB/T 18883 室内空气质量标准同样要求每人每小时 30m³。以现行标准原文为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">算完风量怎么定风管和机器？</h3>
            <p class="text-sm text-muted-foreground mt-1">机器按「设计新风量 × 1.1 管路损耗余量」选档；风管按风量与目标风速反算截面（主管 4~8、支管 2~4 m/s），可直接使用本站的风管尺寸计算器，两个工具的风量口径互通。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。新风量、CFM 与管径建议全部在你的浏览器内完成，无网络请求，参数不被保存或上传。</p>
          </div>
        </div>

        <p class="text-[11px] text-muted-foreground border-t border-border pt-3">数据来源：GB 50736-2012《民用建筑供暖通风与空气调节设计规范》第 3.0.6 条（公共建筑主要房间每人所需最小新风量）；换气次数取值综合《实用供热空调设计手册》等常用设计手册经验区间（住宅 0.5~1、办公 1~2、会议室 2~3 次/h）。本页为工程估算工具，正式设计以现行标准原文为准。</p>
      </div>
    </details>

    <RelatedTools :currentToolId="'fresh-air-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Wind, Ruler, Calculator, Copy, TriangleAlert, Info, RefreshCw, Gauge } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '新风量计算器 - 人均新风量/换气次数双算法取大 | 有条工具',
  description: '免费在线新风量计算器：按 GB 50736-2012 人均新风量（办公室/客房/住宅 30 m³/(h·人)）与换气次数 ACH（住宅 0.5~1、办公 1~2、会议室 2~3 次/h）双算法并排取大，自动换算 CFM 并给出风管尺寸建议，支持面积或长×宽输入，纯浏览器本地计算不上传',
  keywords: '新风量计算器,换气次数计算,人均新风量,GB 50736,新风系统 风量,CFM 换算',
  author: '有条工具',
  ogTitle: '新风量计算器 - 人均新风量/换气次数双算法取大 | 有条工具',
  ogDescription: '人均法与换气次数法并排计算自动取大，m³/h 与 CFM 双单位，附风管尺寸建议。',
  ogUrl: 'https://www.util.cn/tools/fresh-air-calculator',
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
          name: '新风量计算器',
          url: 'https://www.util.cn/tools/fresh-air-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '人均新风量法（GB 50736-2012 办公/客房/住宅 30 档预设）',
            '换气次数法（住宅 0.5~1 / 办公 1~2 / 会议室 2~3 常用值）',
            '两法并排对比、设计取大值高亮',
            'CFM 双单位换算（÷1.699）',
            '面积 / 长×宽 两种房间输入',
            '对应风管尺寸建议与站内风管计算器联动',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '新风量计算器', item: 'https://www.util.cn/tools/fresh-air-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '120㎡ 层高 2.8m 的房子 ACH 按 1 算多大风量？',
              acceptedAnswer: { '@type': 'Answer', text: 'Q=120×2.8×1=336m³/h；若 4 人按人均 30 仅 120m³/h，设计取大 336m³/h（约 198CFM），选 350m³/h 档新风机。' }
            },
            {
              '@type': 'Question',
              name: '住宅换气次数取 0.5 还是 1？',
              acceptedAnswer: { '@type': 'Answer', text: '普通住宅基本健康通风 0.5 次/h 即可；对 PM2.5/CO₂ 敏感、人多或有宠物异味建议按 1 次/h 配置，余量留给高峰，宁大勿小。' }
            },
            {
              '@type': 'Question',
              name: '人均 30 m³/h 是怎么来的？',
              acceptedAnswer: { '@type': 'Answer', text: '按轻活动强度下 CO₂ 不超过约 1000ppm 的稀释需求推导，GB 50736-2012 第 3.0.6 条采纳为公共建筑主要房间每人最小新风量，GB/T 18883 同样要求每人每小时 30m³。' }
            },
            {
              '@type': 'Question',
              name: '为什么两种方法要取大？',
              acceptedAnswer: { '@type': 'Answer', text: '人均法在人少的大空间会低估，换气次数法在人多的小房间会低估，规范通行做法是两法都算取大值：人均法管呼吸需求，体积法管稀释需求。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== 纯逻辑与静态数据（单测区开始） =====
// 单位约定：面积㎡、层高m、体积m³、风量m³/h、ACH 次/h、CFM ft³/min。

// 人均新风量预设（GB 50736-2012 表 3.0.6 公共建筑主要房间每人所需最小新风量）
const PERSON_RATES = [
  { id: 'office', label: '办公室 30 m³/(h·人)', rate: 30 },
  { id: 'residential', label: '住宅（按人）30 m³/(h·人)', rate: 30 },
  { id: 'hotel', label: '旅馆客房 30 m³/(h·人)', rate: 30 },
  { id: 'lobby', label: '大堂、四季厅 10 m³/(h·人)', rate: 10 },
  { id: 'custom', label: '自定义（5~100）…', custom: true }
]

// 换气次数预设（暖通设计手册常用经验区间）
const ACH_PRESETS = [
  { id: 'res05', label: '住宅 · 基础 0.5 次/h', ach: 0.5 },
  { id: 'res10', label: '住宅 · 加强 1.0 次/h', ach: 1.0 },
  { id: 'office15', label: '办公 · 常规 1.5 次/h', ach: 1.5 },
  { id: 'office20', label: '办公 · 加强 2.0 次/h', ach: 2.0 },
  { id: 'meeting30', label: '会议室 · 高频使用 3.0 次/h', ach: 3.0 },
  { id: 'custom', label: '自定义（0.2~10）…', custom: true }
]

// 长宽 → 面积
function areaOfRoom(l, w) {
  const a = Number(l); const b = Number(w)
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null
  return a * b
}

// 体积 = 面积 × 层高
function volumeOfRoom(area, height) {
  const a = Number(area); const h = Number(height)
  if (!Number.isFinite(a) || !Number.isFinite(h) || a <= 0 || h <= 0) return null
  return a * h
}

// 方法一：人均法 Q1 = 人数 × 人均标准
function personFlowQ(people, rate) {
  const p = Number(people); const r = Number(rate)
  if (!Number.isFinite(p) || p < 0 || !Number.isFinite(r) || r <= 0) return null
  return p * r
}

// 方法二：换气次数法 Q2 = 体积 × ACH
function achFlowQ(volume, ach) {
  const v = Number(volume); const a = Number(ach)
  if (!Number.isFinite(v) || v <= 0 || !Number.isFinite(a) || a <= 0) return null
  return v * a
}

// CFM 换算：1 CFM = 1.699 m³/h
function toCfm(m3h) {
  const v = Number(m3h)
  if (!Number.isFinite(v) || v < 0) return null
  return v / 1.699
}

// 设计取大：返回 { value, which: 'person' | 'ach' | 'equal' }
function designPick(qPerson, qAch) {
  const a = Number(qPerson); const b = Number(qAch)
  if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0) return null
  if (a > b) return { value: a, which: 'person' }
  if (b > a) return { value: b, which: 'ach' }
  return { value: a, which: 'equal' }
}

// 风管尺寸提示：按主管 6 m/s 反算圆管直径并吸附标准管径（mm→m）
const DUCT_STD_MM = [100, 120, 150, 200, 250, 300, 350, 400, 450, 500]
function ductHintOf(flowM3h) {
  const q = Number(flowM3h)
  if (!Number.isFinite(q) || q <= 0) return null
  const area = q / (3600 * 6)
  const d = Math.sqrt((4 * area) / Math.PI)
  const mm = d * 1000
  const up = DUCT_STD_MM.find((s) => s >= mm)
  return up !== undefined ? up / 1000 : (Math.ceil(mm / 50) * 50) / 1000
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
const areaMode = ref('area')
const area = ref(120)
const roomL = ref(12)
const roomW = ref(10)
const height = ref(2.8)
const people = ref(4)
const rateId = ref('residential')
const customRate = ref(30)
const achId = ref('res10')
const customAch = ref(1)

const rateMeta = computed(() => PERSON_RATES.find((r) => r.id === rateId.value) || PERSON_RATES[0])
const achMeta = computed(() => ACH_PRESETS.find((a) => a.id === achId.value) || ACH_PRESETS[0])
const activeRate = computed(() => (rateMeta.value.custom ? Number(customRate.value) || 0 : rateMeta.value.rate))
const activeAch = computed(() => (achMeta.value.custom ? Number(customAch.value) || 0 : achMeta.value.ach))
const effArea = computed(() => (areaMode.value === 'area' ? Number(area.value) || 0 : areaOfRoom(roomL.value, roomW.value) || 0))

const issues = computed(() => {
  const list = []
  if (effArea.value <= 0) list.push('房间面积需为大于 0 的数值（㎡）')
  const h = Number(height.value)
  if (!Number.isFinite(h) || h <= 0) list.push('层高需为大于 0 的数值（m）')
  const p = Number(people.value)
  if (!Number.isFinite(p) || p < 0) list.push('人数需为 ≥0 的整数')
  if (activeRate.value <= 0) list.push('人均新风量需为大于 0 的数值')
  if (activeAch.value <= 0) list.push('换气次数需为大于 0 的数值')
  if (p > 0 && activeRate.value <= 0) list.push('有人数时人均标准不能为 0')
  return list
})

const result = computed(() => {
  if (issues.value.length) return null
  const volume = volumeOfRoom(effArea.value, height.value)
  if (volume === null) return null
  const qAch = achFlowQ(volume, activeAch.value)
  const qPerson = people.value > 0 ? personFlowQ(people.value, activeRate.value) : 0
  if (qAch === null || qPerson === null) return null
  const pick = designPick(qPerson, qAch)
  if (!pick) return null
  return {
    volume,
    qPerson,
    qAch,
    design: pick.value,
    which: pick.which,
    cfm: toCfm(pick.value),
    text: `新风量计算：${fmtNum(effArea.value)}㎡ × ${fmtNum(height.value)}m（${fmtNum(volume, 0)}m³）· ${fmtNum(people.value, 0)} 人\n方法一 人均法：${fmtNum(qPerson, 0)} m³/h\n方法二 换气次数法（${fmtNum(activeAch.value)} 次/h）：${fmtNum(qAch, 0)} m³/h\n设计新风量（取大）：${fmtNum(pick.value, 0)} m³/h ≈ ${fmtNum(toCfm(pick.value), 0)} CFM`
  }
})

// ---------- 交互动作 ----------
function resetAll() {
  areaMode.value = 'area'
  area.value = 120
  roomL.value = 12
  roomW.value = 10
  height.value = 2.8
  people.value = 4
  rateId.value = 'residential'
  customRate.value = 30
  achId.value = 'res10'
  customAch.value = 1
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
  addRecentTool('fresh-air-calculator')
})
</script>
