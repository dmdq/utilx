<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Thermometer class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">体感温度计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">热指数 × 风寒指数双向评估：输入气温、相对湿度与风速，自动判定闷热 / 风寒 / 中性模式并给出穿衣出行建议</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线体感温度（Apparent Temperature）计算工具：夏天湿度越大越闷（NOAA 热指数 Heat Index），冬天风越大越冷（NWS 风寒指数 Wind Chill）。
        工具按实际气象条件在两个公开气象经验公式之间自动切换，输出体感温度、与气温的差值、六档舒适度分级、湿度与风速敏感度对照表和对应模式的着装场景提示，
        摄氏 / 华氏一键联动。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <div class="flex items-start gap-2 bg-muted/60 border border-border rounded-lg px-4 py-3 mb-6 text-xs leading-relaxed text-muted-foreground">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>计算采用美国 NOAA/NWS 公开经验公式（热指数/风寒指数），适用范围有边界（公式超出适用域会给出警告并降级标注估算）；极端天气请以气象台预警为准。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：输入参数 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5 h-fit">
        <h2 class="text-lg font-semibold flex items-center">
          <Thermometer class="w-5 h-5 mr-2 text-primary" /> 输入参数
        </h2>

        <!-- 单位切换 -->
        <div class="flex rounded-lg border border-border overflow-hidden">
          <button
            v-for="u in units"
            :key="u.id"
            @click="unit = u.id"
            class="flex-1 py-2 text-sm font-medium transition"
            :class="unit === u.id ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'"
          >
            {{ u.label }}
          </button>
        </div>

        <!-- 气温 -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-foreground">气温（{{ tempUnitSuffix }}）</label>
            <span class="text-[10px] text-muted-foreground">适用 −40 ~ {{ unit === 'C' ? '45℃' : '113℉' }}</span>
          </div>
          <input
            type="number"
            step="0.5"
            v-model.number="tempInput"
            min="-40"
            :max="unit === 'C' ? 45 : 113"
            class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <!-- 相对湿度 -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-foreground flex items-center">
              <Droplet class="w-3.5 h-3.5 mr-1.5 text-sky-500" /> 相对湿度
            </label>
            <span class="text-xs font-mono text-muted-foreground">{{ rh }}%</span>
          </div>
          <input type="range" min="0" max="100" step="1" v-model.number="rhInput" class="w-full accent-primary mb-2" />
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            v-model.number="rhInput"
            class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <!-- 风速 -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-foreground flex items-center">
              <Wind class="w-3.5 h-3.5 mr-1.5 text-teal-500" /> 风速（km/h）
            </label>
            <span class="text-xs font-mono text-muted-foreground">{{ wind }} km/h</span>
          </div>
          <input type="range" min="0" max="120" step="1" v-model.number="windInput" class="w-full accent-primary mb-2" />
          <input
            type="number"
            min="0"
            max="120"
            step="1"
            v-model.number="windInput"
            class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <!-- 示例与重置 -->
        <div class="space-y-2 pt-1">
          <p class="text-xs text-muted-foreground">快速载入示例：</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="loadExample('summer')"
              class="px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-foreground transition"
            >
              <Sun class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-orange-500" /> 夏季 35℃/60%
            </button>
            <button
              @click="loadExample('winter')"
              class="px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-foreground transition"
            >
              <Snowflake class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-blue-500" /> 冬季 −5℃/风30
            </button>
          </div>
          <button
            @click="resetAll"
            class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置为默认值
          </button>
        </div>
      </div>

      <!-- 右：结果展示（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 大结果卡 -->
        <div class="bg-card border border-border rounded-lg p-6 text-center">
          <div class="flex items-center justify-center mb-4">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border" :class="modeMeta[result.mode].chip">
              <Sun v-if="result.mode === 'heat'" class="w-3.5 h-3.5" />
              <Snowflake v-else-if="result.mode === 'windchill'" class="w-3.5 h-3.5" />
              <Thermometer v-else class="w-3.5 h-3.5" />
              {{ modeMeta[result.mode].label }}
            </span>
          </div>
          <p class="text-xs text-muted-foreground mb-1">体感温度</p>
          <p class="text-6xl font-bold tracking-tight" :class="toneClasses[comfort.tone].text">{{ fmtTemp(result.feelsC) }}</p>
          <div class="flex flex-wrap items-center justify-center gap-2 mt-4 text-sm">
            <span class="text-muted-foreground">实际气温 {{ fmtTemp(tempC) }}</span>
            <span class="px-2 py-0.5 rounded-md bg-muted/60 font-mono" :class="deltaTextClass">比气温 {{ deltaText }}</span>
          </div>
          <p v-if="!result.ok" class="mt-3 inline-flex items-center gap-1.5 text-xs text-yellow-600 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0" /> {{ result.warning }}（结果按「估算」降级标注）
          </p>
        </div>

        <!-- 双指数对照小卡 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="rounded-lg border p-4" :class="result.mode === 'heat' ? 'bg-orange-500/5 border-orange-500/30' : 'bg-muted/30 border-border'">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-foreground flex items-center">
                <Sun class="w-4 h-4 mr-1.5 text-orange-500" /> 热指数（NOAA）
              </p>
              <span v-if="result.mode === 'heat'" class="inline-flex items-center gap-1 text-[10px] text-green-600">
                <CheckCircle class="w-3 h-3" /> 当前生效
              </span>
            </div>
            <p class="text-xl font-bold text-foreground">{{ fmtTemp(heatValueC) }}</p>
            <p class="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
              标定域 80–105℉（约 26.7–40.6℃）{{ result.mode === 'heat' ? ' · 含低湿/高湿修正项' : ' · 仅对照参考' }}
              <template v-if="!heatRange.ok"> · 超出标定域，估算</template>
            </p>
          </div>
          <div class="rounded-lg border p-4" :class="result.mode === 'windchill' ? 'bg-blue-500/5 border-blue-500/30' : 'bg-muted/30 border-border'">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-foreground flex items-center">
                <Snowflake class="w-4 h-4 mr-1.5 text-blue-500" /> 风寒指数（NWS）
              </p>
              <span v-if="result.mode === 'windchill'" class="inline-flex items-center gap-1 text-[10px] text-green-600">
                <CheckCircle class="w-3 h-3" /> 当前生效
              </span>
            </div>
            <p class="text-xl font-bold text-foreground">{{ fmtTemp(windchillValueC) }}</p>
            <p class="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
              标定域气温 ≤10℃ 且风速 ≥4.8km/h{{ result.mode === 'windchill' ? '' : ' · 仅对照参考' }}
              <template v-if="!windchillRange.ok"> · 超出标定域，估算</template>
            </p>
          </div>
        </div>

        <!-- 档位建议条 -->
        <div class="rounded-lg border p-4 flex items-start gap-3" :class="toneClasses[comfort.tone].bar">
          <CheckCircle v-if="comfort.id === 'comfort'" class="w-5 h-5 mt-0.5 flex-shrink-0" :class="toneClasses[comfort.tone].text" />
          <TriangleAlert v-else class="w-5 h-5 mt-0.5 flex-shrink-0" :class="toneClasses[comfort.tone].text" />
          <div class="text-left">
            <p class="text-sm font-semibold" :class="toneClasses[comfort.tone].text">
              {{ comfort.label }} · 体感 {{ fmtTemp(result.feelsC) }}
            </p>
            <p class="text-xs text-muted-foreground mt-1 leading-relaxed">{{ comfort.advice }}</p>
            <p class="text-[10px] text-muted-foreground mt-1.5">以上为通用健康常识提示，非医学建议。</p>
          </div>
        </div>

        <!-- 敏感度小表 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <p class="text-sm font-semibold text-foreground mb-2 flex items-center">
            <Wind class="w-4 h-4 mr-1.5 text-primary" /> 敏感度对照 · 出门前看一眼
          </p>
          <table class="w-full text-xs">
            <thead>
              <tr class="text-muted-foreground text-left">
                <th class="py-1.5 font-medium">条件变化</th>
                <th class="py-1.5 font-medium text-right">体感温度</th>
                <th class="py-1.5 font-medium text-right">较当前变化</th>
                <th class="py-1.5 font-medium text-right hidden sm:table-cell">生效模式</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in sensitivityRows" :key="row.key" class="border-t border-border">
                <td class="py-1.5 text-foreground">{{ row.label }}</td>
                <td class="py-1.5 text-right font-mono text-foreground">{{ fmtTemp(row.feelsC) }}</td>
                <td class="py-1.5 text-right font-mono" :class="signedClass(row.delta)">{{ fmtDelta(row.delta) }}</td>
                <td class="py-1.5 text-right hidden sm:table-cell text-muted-foreground">{{ modeMeta[row.mode].short }}</td>
              </tr>
            </tbody>
          </table>
          <p class="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            说明：变化为 0.0 表示该变量不进入当前生效公式（热指数不含风速项、风寒不含湿度项）；条件跨越 27℃ / 10℃ 边界时生效模式会随之切换。
          </p>
        </div>

        <!-- 场景提示 -->
        <div class="bg-muted/30 border border-border rounded-lg p-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span>{{ scenarioTip }}</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>体感温度是什么？怎么算？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          体感温度（Apparent Temperature）是气象学上「人实际感觉到的温度」：同样 35℃，湿度 20% 时清爽，湿度 80% 时难以忍受；
          同样 −5℃，无风时尚可，大风天则刺骨。它不是一个测量值，而是根据气温、相对湿度、风速用经验公式推算出来的指数。
          本工具分三种模式自动计算：气温 ≥27℃ 时启用 NOAA 热指数（Rothfusz 九项多项式，含低湿减项与高湿加项两个修正）；
          气温 ≤10℃ 且风速 ≥5km/h 时启用 NWS 2001 风寒公式（13.12+0.6215t−11.37v<sup>0.16</sup>+0.3965t·v<sup>0.16</sup>）；
          其余为中性区，体感接近实际气温，页面同时给出一个 Steadman 简化表观温度作粗略参考。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么夏天湿度大更闷、冬天风大更冷？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          生理机制一句话：闷热是因为高湿度抑制了汗液蒸发，人体最主要的「蒸发散热」通道被堵住，热量排不出去；
          风寒则是流动空气不断吹散皮肤表面那层被体温焐热的静止边界层，加速对流散热——所以风寒只作用于裸露皮肤，
          并不会真的把温度计读数（或汽车、水管的实体温度）降到体感值以下，这一点和热指数的「加重中暑风险」机制方向相反。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">热指数与风寒公式的来源</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          热指数出自气象学家 Rothfusz 对 1979 年斯坦德曼（Steadman）模型拟合出的多项式回归，1990 年被美国 NOAA/NWS 采用为公开发布口径，
          标定域约 80–105℉（26.7–40.6℃）；风寒指数由美国 NWS 与加拿大环境部基于人脸冻伤风洞实验联合修订，2001 年启用现行公式，
          适用气温 ≤10℃ 且 10 米高度风速 ≥4.8km/h。两个公式都是公开文献中的经验公式，本工具逐字实现并保留修正项，未做任何私有加工。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">冻伤与中暑：两条时间 / 分级线</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          风寒侧：体感降到 −10～−20℃ 区间时，裸露皮肤通常在约 15–30 分钟内可能冻伤；体感越低，冻伤时间越短，逼近 −40℃ 时以分钟计。
          热指数侧：一般按 80–90℉ 注意、90–103℉ 警惕、103–124℉ 危险、≥125℉ 极度危险分级，对应从轻度的热痉挛（大量出汗后肌肉抽搐），
          到中度的热衰竭（头晕、恶心、乏力），再到最重的热射病（核心体温超 40℃、意识障碍，需立即就医）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">本工具的边界</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>公式按「晴天树荫下、穿长袖长裤、静息或轻度活动」的原始实验条件标定：烈日直射下裸露皮肤体感还要再高数 ℃，风寒也不等于水面或车内物体的实际降温。</li>
          <li>输入超出标定域（如 41℃ 以上求热指数、无风求风寒）时仍会计算，但会标注「公式超出标定域，结果仅供参考」并降级为估算。</li>
          <li>结果基于你手动输入的气象三要素，不等于当地实时气象；户外决策请结合气象台官方数据与预警信号。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">体感温度和实际气温能差多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">完全取决于湿度与风速：35℃、相对湿度 60% 时热指数约 45℃；−5℃、风速 30km/h 时风寒约 −13℃；而在 10–27℃ 且风不大时，湿度影响有限，体感与实际气温接近。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么夏天湿度大更闷、冬天风大更冷？</h3>
            <p class="text-sm text-muted-foreground mt-1">高湿度抑制汗液蒸发、削弱人体蒸发散热所以更闷；流动空气吹散皮肤表面的保暖边界层、加速对流散热所以风大更冷，两者分别由热指数和风寒公式量化。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">什么时候会看到「公式超出标定域」警告？</h3>
            <p class="text-sm text-muted-foreground mt-1">热指数公式按 80–105℉ 标定，风寒公式按气温 ≤10℃ 且风速 ≥4.8km/h 标定。输入超出这些范围时页面仍给出数值，但会标注警告并按「估算」处理，此时结果仅供参考。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">输入的气象数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。气温、湿度、风速全部在浏览器本地代入公式计算，不发送任何网络请求，也不写入账号或服务器。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'feels-like-temperature-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Thermometer, Sun, Snowflake, Droplet, Wind,
  CheckCircle, TriangleAlert, ChevronUp, ChevronDown, Info, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '体感温度计算器 - 在线热指数/风寒指数/闷热体感温度计算',
  description: '免费在线体感温度计算器：按美国 NOAA/NWS 公开经验公式计算热指数与风寒指数，输入气温、相对湿度与风速，自动判定闷热/风寒/中性三模式，输出体感温度、与气温差值、六档舒适度分级、湿度风速敏感度表与穿衣建议，摄氏华氏联动，纯浏览器本地计算不上传',
  keywords: '体感温度计算,风寒指数,闷热指数,heat index,湿度体感',
  author: '有条工具',
  ogTitle: '体感温度计算器 - 在线热指数/风寒指数/闷热体感计算 | 有条工具',
  ogDescription: 'NOAA 热指数 × NWS 风寒公式双向评估：输入气温、湿度与风速，自动判定闷热/风寒/中性模式，附六档舒适度与穿衣出行建议。',
  ogUrl: 'https://www.util.cn/tools/feels-like-temperature-calculator',
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
          name: '体感温度计算器',
          url: 'https://www.util.cn/tools/feels-like-temperature-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['NOAA Rothfusz 热指数（含低湿/高湿修正）', 'NWS 2001 风寒指数', '闷热/风寒/中性三模式自动判定', '六档舒适度分级与行动建议', '湿度与风速敏感度对照表', '摄氏华氏联动', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '体感温度计算器', item: 'https://www.util.cn/tools/feels-like-temperature-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '体感温度和实际气温能差多少？',
              acceptedAnswer: { '@type': 'Answer', text: '完全取决于湿度与风速：35℃、相对湿度60%时热指数约45℃；−5℃、风速30km/h时风寒约−13℃；而在10–27℃且风不大时，湿度影响有限，体感与实际气温接近。' }
            },
            {
              '@type': 'Question',
              name: '为什么夏天湿度大更闷、冬天风大更冷？',
              acceptedAnswer: { '@type': 'Answer', text: '高湿度抑制汗液蒸发、削弱人体蒸发散热所以更闷；流动空气吹散皮肤表面的保暖边界层、加速对流散热所以风大更冷，两者分别由热指数和风寒公式量化。' }
            },
            {
              '@type': 'Question',
              name: '什么时候会看到「公式超出标定域」警告？',
              acceptedAnswer: { '@type': 'Answer', text: '热指数公式按80–105℉标定，风寒公式按气温≤10℃且风速≥4.8km/h标定。输入超出这些范围时页面仍给出数值，但会标注警告并按估算处理，此时结果仅供参考。' }
            },
            {
              '@type': 'Question',
              name: '输入的气象数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。气温、湿度、风速全部在浏览器本地代入公式计算，不发送任何网络请求，也不写入账号或服务器。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 摄氏 ↔ 华氏换算
function cToF(c) { return c * 9 / 5 + 32 }
function fToC(f) { return (f - 32) * 5 / 9 }

// 数值夹取（非法输入回落到下界）
function clampNum(v, lo, hi) {
  if (!Number.isFinite(v)) return lo
  return Math.min(hi, Math.max(lo, v))
}

// NOAA/NWS 热指数（Rothfusz 完整九项多项式，℉ 域）
// 标定域 80–105℉；含两个 NOAA 公开口径的修正项：
//  · 低湿修正：RH < 13% 且 80–112℉ 时减一项（干燥空气蒸发散热增强，体感略低于多项式值）
//  · 高湿修正：RH > 85% 且 80–87℉ 时加一项（低温高湿组合的多项式外推补偿）
function heatIndexOfF(tempF, rh) {
  const T = tempF
  const R = rh
  let hi = -42.379
    + 2.04901523 * T
    + 10.14333127 * R
    - 0.22475541 * T * R
    - 0.00683783 * T * T
    - 0.05481917 * R * R
    + 0.00122874 * T * T * R
    + 0.00085282 * T * R * R
    - 0.00000199 * T * T * R * R
  if (R < 13 && T >= 80 && T <= 112) {
    hi -= ((13 - R) / 4) * Math.sqrt(Math.abs(17 - Math.abs(T - 95)) / 45)
  }
  if (R > 85 && T >= 80 && T <= 87) {
    hi += ((R - 85) / 10) * ((87 - T) / 5)
  }
  return hi
}

// 热指数 ℃ 包装：℃ → ℉ 代入多项式，结果转回 ℃
function heatIndexC(tempC, rh) {
  return fToC(heatIndexOfF(cToF(tempC), rh))
}

// NWS 2001 风寒指数（℃ / km/h 公制版）：13.12 + 0.6215t − 11.37v^0.16 + 0.3965t·v^0.16
// 标定域：气温 ≤10℃ 且 10m 高度风速 ≥4.8km/h
// 公开校准：−5℃/30km/h → −13℃（NWS/加拿大环境部对照表值）；0℃/20km/h → −5℃
function windchillOfC(tempC, windKmh) {
  const v = Math.pow(windKmh, 0.16)
  return 13.12 + 0.6215 * tempC - 11.37 * v + 0.3965 * tempC * v
}

// Steadman 简化表观温度（无风、遮阴、仅中性区参考展示，口径非常粗略）：
// AT = t + 0.33e − 4.00，e 为水汽压（hPa，Magnus 公式）
function apparentSimpleC(tempC, rh) {
  const e = (rh / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC))
  return tempC + 0.33 * e - 4.0
}

// 模式判定：≥27℃ 用热指数；≤10℃ 且 ≥5km/h 用风寒；其余中性（体感≈气温，湿度只弱主导）
function chooseModeOf(tempC, rh, windKmh) {
  if (tempC >= 27) return 'heat'
  if (tempC <= 10 && windKmh >= 5) return 'windchill'
  return 'neutral'
}

// 热指数适用域判定（NOAA 标定域 80–105℉、湿度 0–100%）：超域返回警告文案
function inRangeOf(tempF, rh) {
  const ok = tempF >= 80 && tempF <= 105 && rh >= 0 && rh <= 100
  return ok ? { ok: true, warning: null } : { ok: false, warning: '公式超出标定域，结果仅供参考' }
}

// 风寒适用域判定（气温 ≤10℃ 且风速 ≥4.8km/h）
function windchillRangeOf(tempC, windKmh) {
  const ok = tempC <= 10 && windKmh >= 4.8
  return ok ? { ok: true, warning: null } : { ok: false, warning: '公式超出标定域，结果仅供参考' }
}

// 综合体感结果：模式 + 体感温度（℃）+ 是否超域降级
function feelsLikeOf(tempC, rh, windKmh) {
  const mode = chooseModeOf(tempC, rh, windKmh)
  if (mode === 'heat') {
    const r = inRangeOf(cToF(tempC), rh)
    return { mode, feelsC: heatIndexC(tempC, rh), ok: r.ok, warning: r.warning }
  }
  if (mode === 'windchill') {
    const r = windchillRangeOf(tempC, windKmh)
    return { mode, feelsC: windchillOfC(tempC, windKmh), ok: r.ok, warning: r.warning }
  }
  return { mode, feelsC: tempC, ok: true, warning: null }
}

// 舒适度六档分级（边界含下限：35 → danger、27 → hot、20 → comfort、10 → cool、0 → cold）
function comfortJudgeOf(feelsC) {
  if (feelsC >= 35) return { id: 'danger', label: '危险 · 防中暑', tone: 'red', advice: '体感已达危险级：中暑与热射病风险显著升高，避免正午前后户外活动，勤补水补盐，遮阳通风降温。' }
  if (feelsC >= 27) return { id: 'hot', label: '闷热 · 注意', tone: 'orange', advice: '闷热明显：减少户外暴露时长，穿透气浅色衣物，随身补水并注意防晒。' }
  if (feelsC >= 20) return { id: 'comfort', label: '舒适', tone: 'green', advice: '体感舒适：适合正常户外通勤与活动，按常规着装即可。' }
  if (feelsC >= 10) return { id: 'cool', label: '凉意', tone: 'blue', advice: '偏凉：早晚风大体感更明显，建议加一件外套或薄防风衣。' }
  if (feelsC >= 0) return { id: 'cold', label: '冷', tone: 'yellow', advice: '寒冷：注意防风保暖，戴帽子手套围巾，老人儿童等敏感人群缩短户外时间。' }
  return { id: 'severe', label: '严寒 · 冻伤风险', tone: 'red', advice: '严寒：存在冻伤风险，裸露皮肤可能在短时间内冻伤，尽量减少户外暴露并做好分层防风保暖。' }
}

// 敏感度四行：当前湿度 ±10% / 风速 ±10km/h 时的体感变化（含跨模式切换时的真实变化）
function sensitivityOf(tempC, rh, windKmh) {
  const base = feelsLikeOf(tempC, rh, windKmh).feelsC
  const mk = (key, label, rh2, wind2) => {
    const alt = feelsLikeOf(tempC, clampNum(rh2, 0, 100), clampNum(wind2, 0, Infinity))
    return { key, label, feelsC: alt.feelsC, delta: alt.feelsC - base, mode: alt.mode }
  }
  return [
    mk('rh+', '湿度 +10%', rh + 10, windKmh),
    mk('rh-', '湿度 −10%', rh - 10, windKmh),
    mk('wind+', '风速 +10km/h', rh, windKmh + 10),
    mk('wind-', '风速 −10km/h', rh, windKmh - 10)
  ]
}

// ---------- 元数据与配色 ----------
const toneClasses = {
  red: { text: 'text-red-600', bar: 'bg-red-500/10 border-red-500/30' },
  orange: { text: 'text-orange-600', bar: 'bg-orange-500/10 border-orange-500/30' },
  green: { text: 'text-green-600', bar: 'bg-green-500/10 border-green-500/30' },
  blue: { text: 'text-blue-600', bar: 'bg-blue-500/10 border-blue-500/30' },
  yellow: { text: 'text-yellow-600', bar: 'bg-yellow-500/10 border-yellow-500/30' }
}

const modeMeta = {
  heat: { label: '热指数模式（闷热）', short: '热指数', chip: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  windchill: { label: '风寒模式（干冷）', short: '风寒', chip: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  neutral: { label: '中性模式（接近气温）', short: '中性', chip: 'bg-muted text-muted-foreground border-border' }
}

const scenarioTips = {
  heat: '夏季场景提示：10:00–16:00 高温时段尽量转入室内活动；车辆停阴凉处，勿在密闭车内遗留人员、宠物或充电宝、打火机等高温敏感物品；运动后少量多次补水并适当补盐。',
  windchill: '冬季场景提示：采用「内层排汗 + 中层保暖 + 外层防风」分层穿搭，裸露皮肤戴好帽子、手套和口罩；骑行与等车时风寒效应最明显，儿童与老人尤其要缩短户外停留时间。',
  neutral: '中性区提示：当前湿度对体感影响有限，按实际气温正常着装即可；但早晚温差、降雨与突然起风仍会改变体感，出门前建议再对照临近预报。'
}

// ---------- 响应状态 ----------
const DEFAULTS = { tempC: 20, rh: 50, wind: 0 }
const tempC = ref(DEFAULTS.tempC)
const rh = ref(DEFAULTS.rh)
const wind = ref(DEFAULTS.wind)
const unit = ref('C')
const seoContentVisible = ref(true)

const units = [
  { id: 'C', label: '摄氏 ℃' },
  { id: 'F', label: '华氏 ℉' }
]
const tempUnitSuffix = computed(() => (unit.value === 'C' ? '℃' : '℉'))

// 气温输入按当前显示单位进出，内部始终存 ℃（往返换算不损失模式判定）
const tempInput = computed({
  get: () => Math.round((unit.value === 'C' ? tempC.value : cToF(tempC.value)) * 10) / 10,
  set: (v) => {
    if (unit.value === 'C') tempC.value = clampNum(Number(v), -40, 45)
    else tempC.value = fToC(clampNum(Number(v), -40, 113))
  }
})
const rhInput = computed({
  get: () => rh.value,
  set: (v) => { rh.value = clampNum(Math.round(Number(v)), 0, 100) }
})
const windInput = computed({
  get: () => wind.value,
  set: (v) => { wind.value = clampNum(Math.round(Number(v)), 0, 120) }
})

// 核心结果
const result = computed(() => feelsLikeOf(tempC.value, rh.value, wind.value))
const comfort = computed(() => comfortJudgeOf(result.value.feelsC))
const sensitivityRows = computed(() => sensitivityOf(tempC.value, rh.value, wind.value))
const heatValueC = computed(() => heatIndexC(tempC.value, rh.value))
const windchillValueC = computed(() => windchillOfC(tempC.value, wind.value))
const heatRange = computed(() => inRangeOf(cToF(tempC.value), rh.value))
const windchillRange = computed(() => windchillRangeOf(tempC.value, wind.value))
const scenarioTip = computed(() => scenarioTips[result.value.mode])

// 显示格式化（跟随单位）
function fmtTemp(c) {
  return unit.value === 'C' ? `${(Math.round(c * 10) / 10).toFixed(1)} ℃` : `${(Math.round(cToF(c) * 10) / 10).toFixed(1)} ℉`
}
function fmtDelta(dC) {
  const dv = unit.value === 'C' ? dC : dC * 9 / 5
  const sign = dv >= 0.05 ? '+' : dv <= -0.05 ? '−' : '±'
  return `${sign}${Math.abs(dv).toFixed(1)} ${tempUnitSuffix.value}`
}
function signedClass(dC) {
  if (dC > 0.05) return 'text-red-600'
  if (dC < -0.05) return 'text-blue-600'
  return 'text-muted-foreground'
}

const deltaText = computed(() => fmtDelta(result.value.feelsC - tempC.value))
const deltaTextClass = computed(() => signedClass(result.value.feelsC - tempC.value))

function loadExample(id) {
  unit.value = 'C'
  if (id === 'summer') {
    tempC.value = 35
    rh.value = 60
    wind.value = 0
  } else {
    tempC.value = -5
    rh.value = 60
    wind.value = 30
  }
}

function resetAll() {
  tempC.value = DEFAULTS.tempC
  rh.value = DEFAULTS.rh
  wind.value = DEFAULTS.wind
  unit.value = 'C'
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 挂载（SSR 安全：仅本地记录使用足迹） ----------
onMounted(() => {
  addRecentTool('feels-like-temperature-calculator')
})
</script>
