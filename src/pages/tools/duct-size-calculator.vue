<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <AirVent class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">风管尺寸计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">风量 × 目标风速反算圆管直径 / 矩形风管宽高，就近吸附标准管径并回算实际风速</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线风管尺寸计算器：新风 / 通风管道选型一条公式——截面积 A = 风量 Q ÷ (3600 × 风速 v)。
        输入风量与目标风速（滑杆 2~10 m/s，主管 4~8、支管 2~4 m/s 常用区间徽章提示），
        自动算出所需截面积、理论圆管直径 d=√(4A/π)，并向上下两侧吸附 100~500mm 标准管径，
        双列展示两档的实际风速供比较；矩形模式支持按宽高比（1:1~4:1）或指定一边反求另一边。
        配套等速当量直径公式与主管 / 支管选型建议，全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Ruler class="w-5 h-5 mr-2 text-primary" /> 输入参数
        </h2>

        <div>
          <label for="duct-q" class="block text-sm font-medium text-foreground mb-1.5">风量 Q（m³/h）</label>
          <input id="duct-q" v-model.number="flow" type="number" min="30" max="50000" step="10" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono">
          <p class="text-[11px] text-muted-foreground mt-1.5">不知道风量？先用 <NuxtLink to="/tools/fresh-air-calculator/" class="text-primary underline underline-offset-2">新风量计算器</NuxtLink> 按房间算出设计风量再回来定管径。</p>
        </div>

        <div>
          <label for="duct-v" class="block text-sm font-medium text-foreground mb-1.5">目标风速 v（m/s）：{{ fmtNum(velocity, 1) }}</label>
          <input id="duct-v" v-model.number="velocity" type="range" min="2" max="10" step="0.5" class="w-full accent-primary">
          <div class="flex flex-wrap gap-2 mt-2">
            <span class="px-2.5 py-1 rounded-full text-xs font-medium border transition" :class="velocity >= 4 && velocity <= 8 ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-muted/50 border-border text-muted-foreground'">主管常用 4 ~ 8 m/s</span>
            <span class="px-2.5 py-1 rounded-full text-xs font-medium border transition" :class="velocity >= 2 && velocity <= 4 ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-muted/50 border-border text-muted-foreground'">支管常用 2 ~ 4 m/s</span>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">风速越高管径越小、噪声与阻力越大；对噪声敏感的住宅卧室取低值（主管 3.5~5），机房工业风管可到 8~10。常用区间参考 GB 50736-2012 表 6.6.3（低速风管推荐 / 最大流速），以现行标准原文为准。</p>
        </div>

        <!-- 形状模式 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">风管形状</p>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" class="px-3 py-1.5 rounded-lg border text-sm font-medium transition" :class="shape === 'round' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'" @click="shape = 'round'">圆形风管</button>
            <button type="button" class="px-3 py-1.5 rounded-lg border text-sm font-medium transition" :class="shape === 'rect' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'" @click="shape = 'rect'">矩形风管</button>
          </div>
        </div>

        <!-- 矩形子模式 -->
        <div v-if="shape === 'rect'" class="space-y-4">
          <div>
            <p class="text-sm font-medium text-foreground mb-1.5">矩形尺寸求法</p>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="px-3 py-1.5 rounded-lg border text-sm font-medium transition" :class="rectMode === 'ratio' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'" @click="rectMode = 'ratio'">按宽高比</button>
              <button type="button" class="px-3 py-1.5 rounded-lg border text-sm font-medium transition" :class="rectMode === 'side' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'" @click="rectMode = 'side'">指定一边</button>
            </div>
          </div>
          <div v-if="rectMode === 'ratio'">
            <label for="duct-ratio" class="block text-sm font-medium text-foreground mb-1.5">宽高比（宽:高）</label>
            <select id="duct-ratio" v-model.number="ratio" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option :value="1">1 : 1（正方形）</option>
              <option :value="2">2 : 1（常用）</option>
              <option :value="3">3 : 1（扁宽）</option>
              <option :value="4">4 : 1（规范上限）</option>
            </select>
            <p class="text-[11px] text-muted-foreground mt-1.5">GB 50736-2012 第 6.6.1 条：矩形风管长短边之比不宜大于 4。</p>
          </div>
          <div v-else class="flex items-center gap-2 flex-wrap">
            <input v-model.number="givenSide" type="number" min="0.05" step="0.05" class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono" aria-label="已知一边长度 米">
            <span class="text-xs text-muted-foreground">m = 已知一边（宽或高），自动反求另一边</span>
          </div>
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
            <Diameter class="w-5 h-5 mr-2 text-primary" /> 风管尺寸结果
          </h2>
          <div v-if="result" class="space-y-4">
            <!-- 截面积 + 理论直径 -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">所需截面积 A</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ fmtNum(result.area, 4) }}<span class="text-sm font-medium text-muted-foreground ml-1">㎡</span></p>
                <p class="text-[11px] text-muted-foreground mt-1 font-mono">{{ fmtNum(flow, 0) }} ÷ (3600 × {{ fmtNum(velocity, 1) }})</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">{{ shape === 'round' ? '理论圆管直径' : '理论当量尺寸' }}</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ fmtNum(result.dExact * 1000, 1) }}<span class="text-sm font-medium text-muted-foreground ml-1">mm</span></p>
                <p class="text-[11px] text-muted-foreground mt-1 font-mono">d = √(4A/π)</p>
              </div>
            </div>

            <!-- 圆形：标准管径双列 -->
            <div v-if="shape === 'round' && result.down && result.up" class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4 text-center border" :class="result.down.d === result.up.d ? 'border-primary/40' : 'border-border'">
                <p class="text-xs text-muted-foreground mb-1">就近标准管径（偏小档）</p>
                <p class="text-3xl font-bold" :class="result.down.d === result.up.d ? 'text-primary' : 'text-foreground'">{{ fmtNum(result.down.d * 1000, 0) }}<span class="text-base font-medium text-muted-foreground ml-1">mm</span></p>
                <p class="text-[11px] text-muted-foreground mt-1 font-mono">实际风速 {{ fmtNum(result.down.v, 2) }} m/s</p>
                <span :class="velocityBadgeClass(result.down.v)" class="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border">{{ velocityBadge(result.down.v) }}</span>
              </div>
              <div class="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">就近标准管径（偏大档 · 推荐）</p>
                <p class="text-3xl font-bold text-primary">{{ fmtNum(result.up.d * 1000, 0) }}<span class="text-base font-medium text-muted-foreground ml-1">mm</span></p>
                <p class="text-[11px] text-muted-foreground mt-1 font-mono">实际风速 {{ fmtNum(result.up.v, 2) }} m/s</p>
                <span :class="velocityBadgeClass(result.up.v)" class="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border">{{ velocityBadge(result.up.v) }}</span>
              </div>
            </div>
            <p v-if="shape === 'round' && result.down && result.up && result.down.d !== result.up.d" class="text-xs text-muted-foreground leading-relaxed">
              两档取舍：选小一档省吊顶空间但风速升高（噪声、阻力增大）；选大一档风速更低更安静，成本略高。噪声敏感场所优先偏大档。
            </p>
            <p v-if="shape === 'round' && result.down && result.up && result.down.d === result.up.d" class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>理论直径正好命中 {{ fmtNum(result.up.d * 1000, 0) }}mm 标准管径。</span>
            </p>

            <!-- 矩形结果 -->
            <div v-if="shape === 'rect' && result.rect" class="space-y-3">
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">{{ rectMode === 'ratio' ? `按宽高比 ${ratioLabel} 反算` : `指定一边 ${fmtNum(givenSide * 1000, 0)}mm 反算` }}</p>
                <p class="text-3xl font-bold text-primary font-mono">{{ fmtNum(result.rect.w * 1000, 0) }} × {{ fmtNum(result.rect.h * 1000, 0) }}<span class="text-base font-medium text-muted-foreground ml-1">mm</span></p>
                <p class="text-[11px] text-muted-foreground mt-1 font-mono">面积 {{ fmtNum(result.rect.w * result.rect.h, 4) }} ㎡ ≥ 所需 {{ fmtNum(result.area, 4) }} ㎡</p>
              </div>
              <div class="flex flex-wrap gap-2 text-xs">
                <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-muted-foreground">宽高比 {{ fmtNum(result.rect.w / result.rect.h, 2) }} : 1</span>
                <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-muted-foreground">长短边比 {{ result.rect.w / result.rect.h <= 4 ? '≤4 合规' : '>4 超限' }}</span>
                <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-muted-foreground">同面积等速当量直径 {{ fmtNum(diaOfArea(result.rect.w * result.rect.h) * 1000, 0) }}mm</span>
              </div>
              <p class="text-xs text-muted-foreground leading-relaxed">矩形两边为理论值，施工时向上圆整到 50mm 模数（如 417→450mm）；保持面积不小于所需截面积即可。</p>
            </div>

            <button type="button" class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition" @click="copyResult(result.text)">
              <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制结果
            </button>
          </div>
          <p v-else class="p-6 text-center text-sm text-muted-foreground">填入有效的风量与目标风速开始计算</p>
        </div>

        <!-- 选型速查卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Info class="w-5 h-5 mr-2 text-primary" /> 主管 / 支管选型速查
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead>
                <tr class="bg-muted/60 text-muted-foreground text-xs">
                  <th class="text-left px-3 py-2 font-medium">风量（m³/h）</th>
                  <th class="text-right px-3 py-2 font-medium">主管 @6 m/s</th>
                  <th class="text-right px-3 py-2 font-medium">支管 @3 m/s</th>
                </tr>
              </thead>
              <tbody class="text-muted-foreground">
                <tr v-for="row in QUICK_TABLE" :key="row.q" class="border-t border-border">
                  <td class="px-3 py-2 text-foreground font-mono">{{ fmtNum(row.q, 0) }}</td>
                  <td class="px-3 py-2 text-right font-mono">{{ row.mainMm }}mm</td>
                  <td class="px-3 py-2 text-right font-mono">{{ row.branchMm }}mm</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed">常用区间依据 GB 50736-2012《民用建筑供暖通风与空气调节设计规范》表 6.6.3（低速风管：主管推荐约 3.5~8 m/s、支管约 2.5~5 m/s，噪声敏感场所取低值），本表按主管 6、支管 3 m/s 示例，以现行标准原文为准。</p>
        </div>
      </div>
    </div>

    <!-- SEO 可折叠区 -->
    <details open class="bg-card border border-border rounded-lg p-6 mb-6">
      <summary class="cursor-pointer select-none text-lg font-semibold text-foreground">公式、当量直径与常见问题（FAQ）</summary>
      <div class="mt-4 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">核心公式</h3>
          <ul class="list-disc list-inside space-y-1 text-sm text-muted-foreground leading-relaxed">
            <li>截面积：A(㎡) = 风量 Q(m³/h) ÷ 3600 ÷ 风速 v(m/s)——风量换 m³/s 后除以风速。</li>
            <li>圆管直径：d = √(4A/π)，就近吸附 100/120/150/200/250/300/350/400/450/500mm 标准管径。</li>
            <li>选定管径回算风速：v = Q ÷ 3600 ÷ (πd²/4)，用来核对吸附后的实际风速是否仍在目标区间。</li>
            <li>矩形按宽高比 r：宽 = √(A·r)、高 = √(A/r)；指定一边时另一边 = A ÷ 已知边。</li>
            <li>等速当量直径（矩形→圆）：De = √(4ab/π)（a、b 为矩形宽高）——同面积口径，用于阻力估算请用水流当量直径公式另算。</li>
          </ul>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">主管与支管怎么分工？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            主管（干管）承担全部风量，截面大、流速可到 4~8 m/s，噪声经管壁衰减后影响小；支管只服务单个风口，
            风量小，流速控制在 2~4 m/s 以避免末端风口吹哨。设计顺序是「先定风口与风量 → 支管按低风速 → 汇总到主管按高风速」，
            越靠近风机管径越大。同一系统风速不宜突变，变径时用渐扩 / 渐缩过渡以减少涡流损失。
          </p>
        </div>

        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">3600 m³/h、6 m/s 该用多大圆管？</h3>
            <p class="text-sm text-muted-foreground mt-1">A = 3600 ÷ (3600×6) = 0.1667㎡，d = √(4A/π) ≈ 460.7mm：就近双档 DN450（实际风速约 6.29 m/s，略超目标）与 DN500（约 5.09 m/s，更安静）。噪声敏感优先 500。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">风速选高了会怎样？</h3>
            <p class="text-sm text-muted-foreground mt-1">风管噪声大约随风速 5~6 次方增长：8 m/s 与 4 m/s 相比噪声感明显增加，阻力（沿程 + 局部）按风速平方上升，风机能耗与再生噪声同步变大。住宅卧室主管建议 3.5~5 m/s，公共建筑 5~8 m/s，机房内可放宽。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">矩形风管为什么不能太扁？</h3>
            <p class="text-sm text-muted-foreground mt-1">宽高比越大，同面积下湿周越长、摩擦阻力越大，且板材与保温成本上升，规范建议长短边比不宜大于 4（GB 50736-2012 第 6.6.1 条）。吊顶受限时常用 3:1~4:1，再扁就该考虑扁圆管或加大宽度分层布置。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">和风量怎么配合使用？</h3>
            <p class="text-sm text-muted-foreground mt-1">先用新风量计算器按「人均法与换气次数法取大」得到设计风量，再回到本页选管径；末端风口与分支的风量按各房间分配后再逐段定径，主管取全量。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。截面积、管径与风速换算全部在你的浏览器内完成，无网络请求，参数不被保存或上传。</p>
          </div>
        </div>

        <p class="text-[11px] text-muted-foreground border-t border-border pt-3">数据来源：GB 50736-2012《民用建筑供暖通风与空气调节设计规范》表 6.6.3（风管内推荐 / 最大流速）与第 6.6.1 条（矩形长短边比 ≤4）；标准管径为通风工程常用规格系列。本页为工程估算工具，正式设计以现行标准原文为准。</p>
      </div>
    </details>

    <RelatedTools :currentToolId="'duct-size-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { AirVent, Ruler, Diameter, Copy, CheckCircle, TriangleAlert, Info, RefreshCw } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '风管尺寸计算器 - 风量风速反算圆管直径/矩形尺寸 | 有条工具',
  description: '免费在线风管尺寸计算器：按 A=Q/(3600v) 算风管截面积，d=√(4A/π) 反算圆管直径并吸附 100~500mm 标准管径双档回算实际风速，矩形模式支持宽高比与指定一边，主管 4~8 / 支管 2~4 m/s 常用风速区间徽章（GB 50736 表 6.6.3 口径），纯浏览器本地计算不上传',
  keywords: '风管尺寸计算器,风量风速管径计算,圆形风管直径,矩形风管尺寸,等速当量直径,通风管道计算',
  author: '有条工具',
  ogTitle: '风管尺寸计算器 - 风量风速反算圆管直径/矩形尺寸 | 有条工具',
  ogDescription: '风量×风速反算截面积与管径，标准管径双档对比回算实际风速，矩形按宽高比或指定一边。',
  ogUrl: 'https://www.util.cn/tools/duct-size-calculator',
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
          name: '风管尺寸计算器',
          url: 'https://www.util.cn/tools/duct-size-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'A=Q/(3600v) 截面积与 d=√(4A/π) 圆管直径计算',
            '100~500mm 标准管径就近吸附双档对比',
            '选定管径回算实际风速',
            '矩形模式：宽高比 1:1~4:1 或指定一边反求另一边',
            '主管 4~8 / 支管 2~4 m/s 常用风速区间徽章',
            '风速 2~10 m/s 滑杆与选型速查表',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '风管尺寸计算器', item: 'https://www.util.cn/tools/duct-size-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '3600 m³/h、6 m/s 该用多大圆管？',
              acceptedAnswer: { '@type': 'Answer', text: 'A=3600÷(3600×6)=0.1667㎡，d=√(4A/π)≈460.7mm，就近 DN450（实际约 6.29m/s）或 DN500（约 5.09m/s），噪声敏感优先 500。' }
            },
            {
              '@type': 'Question',
              name: '风速选高了会怎样？',
              acceptedAnswer: { '@type': 'Answer', text: '风管噪声大约随风速 5~6 次方增长，阻力按风速平方上升。住宅卧室主管建议 3.5~5m/s，公共建筑 5~8m/s。' }
            },
            {
              '@type': 'Question',
              name: '矩形风管为什么不能太扁？',
              acceptedAnswer: { '@type': 'Answer', text: '宽高比越大湿周越长、摩擦阻力与成本越大，GB 50736-2012 第 6.6.1 条建议长短边之比不宜大于 4。' }
            },
            {
              '@type': 'Question',
              name: '和风量怎么配合使用？',
              acceptedAnswer: { '@type': 'Answer', text: '先用新风量计算器按人均法与换气次数法取大得到设计风量，再回本页按主管 4~8、支管 2~4 m/s 分段定径。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== 纯逻辑与静态数据（单测区开始） =====
// 单位约定：风量 m³/h、风速 m/s、面积 ㎡、直径 m。
// 核心公式：A = Q/(3600v)；d = √(4A/π)；回算风速 v = Q/(3600·πd²/4)。

// 标准圆管直径系列（m）
const STD_DIAMETERS = [0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5]

// 截面积 A(㎡) = 风量 ÷ 3600 ÷ 风速；非法输入返回 null
function areaOf(flowM3h, velocity) {
  const q = Number(flowM3h); const v = Number(velocity)
  if (!Number.isFinite(q) || !Number.isFinite(v) || q <= 0 || v <= 0) return null
  return q / (3600 * v)
}

// 圆管直径 d(m) = √(4A/π)
function diaOfArea(area) {
  const a = Number(area)
  if (!Number.isFinite(a) || a <= 0) return null
  return Math.sqrt((4 * a) / Math.PI)
}

// 给定风量与管径回算实际风速 v(m/s)
function velocityOfDia(flowM3h, dia) {
  const q = Number(flowM3h); const d = Number(dia)
  if (!Number.isFinite(q) || !Number.isFinite(d) || q <= 0 || d <= 0) return null
  return q / (3600 * ((Math.PI * d * d) / 4))
}

// 标准管径双档：down = 不小于理论直径的最小标准档（保守/推荐），up = 不大于理论直径的最大标准档（紧凑）；
// 命中标准档时两档相同。此处命名与 UI 一致：down=偏小档、up=偏大档。
function diaCandidates(diaExact, list) {
  const arr = list || STD_DIAMETERS
  const d = Number(diaExact)
  if (!Number.isFinite(d) || d <= 0) return null
  const smaller = arr.filter((s) => s <= d + 1e-9)
  const bigger = arr.filter((s) => s >= d - 1e-9)
  const down = smaller.length ? smaller[smaller.length - 1] : arr[0]
  const up = bigger.length ? bigger[0] : arr[arr.length - 1]
  return { down, up }
}

// 矩形按宽高比（宽:高 = r:1）：宽 = √(A·r)，高 = √(A/r)
function rectFromRatio(area, ratio) {
  const a = Number(area); const r = Number(ratio)
  if (!Number.isFinite(a) || a <= 0 || !Number.isFinite(r) || r <= 0) return null
  const w = Math.sqrt(a * r)
  return { w, h: a / w }
}

// 矩形指定一边反求另一边：另一边 = A ÷ 已知边
function rectOtherSide(area, side) {
  const a = Number(area); const s = Number(side)
  if (!Number.isFinite(a) || a <= 0 || !Number.isFinite(s) || s <= 0) return null
  return a / s
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
const flow = ref(3600)
const velocity = ref(6)
const shape = ref('round')
const rectMode = ref('ratio')
const ratio = ref(2)
const givenSide = ref(0.4)

const ratioLabel = computed(() => `${ratio.value} : 1`)

// 选型速查表（主管 6 / 支管 3 m/s 示例）
const QUICK_TABLE = [
  { q: 300, mainMm: 150, branchMm: 200 },
  { q: 500, mainMm: 200, branchMm: 250 },
  { q: 800, mainMm: 250, branchMm: 350 },
  { q: 1200, mainMm: 300, branchMm: 400 },
  { q: 2000, mainMm: 350, branchMm: 500 },
  { q: 3600, mainMm: 500, branchMm: 650 }
]

const issues = computed(() => {
  const list = []
  const q = Number(flow.value)
  if (!Number.isFinite(q) || q <= 0) list.push('风量需为大于 0 的数值（m³/h）')
  const v = Number(velocity.value)
  if (!Number.isFinite(v) || v <= 0) list.push('目标风速需为大于 0 的数值（m/s）')
  if (shape.value === 'rect' && rectMode.value === 'side') {
    const s = Number(givenSide.value)
    if (!Number.isFinite(s) || s <= 0) list.push('指定一边需为大于 0 的数值（m）')
  }
  return list
})

const valid = computed(() => issues.value.length === 0)

const result = computed(() => {
  if (!valid.value) return null
  const area = areaOf(flow.value, velocity.value)
  if (area === null) return null
  const dExact = diaOfArea(area)
  if (dExact === null) return null

  let down = null
  let up = null
  if (shape.value === 'round') {
    const cand = diaCandidates(dExact, STD_DIAMETERS)
    down = { d: cand.down, v: velocityOfDia(flow.value, cand.down) }
    up = { d: cand.up, v: velocityOfDia(flow.value, cand.up) }
  }

  let rect = null
  if (shape.value === 'rect') {
    rect = rectMode.value === 'ratio' ? rectFromRatio(area, ratio.value) : { w: Number(givenSide.value), h: rectOtherSide(area, givenSide.value) }
    if (!rect || !Number.isFinite(rect.w) || !Number.isFinite(rect.h) || rect.w <= 0 || rect.h <= 0) rect = null
    else rect = { w: Math.max(rect.w, rect.h), h: Math.min(rect.w, rect.h) } // 宽取大边
  }

  const parts = [
    `风管尺寸：风量 ${fmtNum(flow.value, 0)} m³/h @ 目标风速 ${fmtNum(velocity.value, 1)} m/s`,
    `截面积 A = ${fmtNum(area, 4)} ㎡，理论圆管直径 d = ${fmtNum(dExact * 1000, 1)}mm`
  ]
  if (shape.value === 'round' && down && up) {
    parts.push(`标准管径：DN${fmtNum(down.d * 1000, 0)}（实际风速 ${fmtNum(down.v, 2)} m/s）/ DN${fmtNum(up.d * 1000, 0)}（实际风速 ${fmtNum(up.v, 2)} m/s）`)
  }
  if (rect) {
    parts.push(`矩形风管：${fmtNum(rect.w * 1000, 0)} × ${fmtNum(rect.h * 1000, 0)}mm（宽高比 ${fmtNum(rect.w / rect.h, 2)}:1）`)
  }
  return { area, dExact, down, up, rect, text: parts.join('\n') }
})

// ---------- 交互动作 ----------
function resetAll() {
  flow.value = 3600
  velocity.value = 6
  shape.value = 'round'
  rectMode.value = 'ratio'
  ratio.value = 2
  givenSide.value = 0.4
}

// 风速徽章：超 8 偏高、低于 2 偏低、其余合适
function velocityBadge(v) {
  if (!Number.isFinite(v) || v <= 0) return '—'
  if (v > 8) return '风速偏高'
  if (v < 2) return '风速偏低'
  return '风速合适'
}
function velocityBadgeClass(v) {
  if (!Number.isFinite(v) || v <= 0) return 'bg-muted/60 border-border text-muted-foreground'
  if (v > 8) return 'bg-amber-500/10 border-amber-500/20 text-amber-600'
  if (v < 2) return 'bg-amber-500/10 border-amber-500/20 text-amber-600'
  return 'bg-green-500/10 border-green-500/20 text-green-600'
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
  addRecentTool('duct-size-calculator')
})
</script>
