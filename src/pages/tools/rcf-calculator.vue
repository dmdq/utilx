<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Cylinder class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">离心机 RPM-RCF 换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">转速 rpm 与相对离心力 ×g 双向换算、常用转头半径速查、差速离心场景需设转速联动表</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线离心机换算工具：正向由转速（rpm）与离心半径算出相对离心力 RCF（×g），反向由目标 ×g 开方求回需要设置的 rpm；
        内置微量机、角转子、水平转头、超速转子等常用半径速查与「细胞核 / 线粒体 / 微粒体沉淀」等实验场景的需设转速联动表，
        并展示公式代入过程。方案里的 rpm 换一台离心机就不能直接抄——半径不同、实际离心力差很多，一律先换成 ×g 再反算。
        全部计算在你的浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <div class="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6 text-sm leading-relaxed text-foreground flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p>
        RCF = 1.118×10⁻⁵ × n² × r（n 为 rpm、r 为离心半径 cm，结果 ×g）。<strong class="font-semibold">同一台离心机不同转头/孔位的 r 不同，请以说明书标注的最大半径为准</strong>；本工具存最近一次半径便于回用。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <ArrowLeftRight class="w-5 h-5 mr-2 text-primary" /> 换算方向与参数
        </h2>

        <!-- 双向切换 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="setMode('forward')"
            class="px-3 py-2.5 rounded-lg border text-sm font-medium transition"
            :class="mode === 'forward' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
          >
            RPM → RCF（×g）
          </button>
          <button
            @click="setMode('reverse')"
            class="px-3 py-2.5 rounded-lg border text-sm font-medium transition"
            :class="mode === 'reverse' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
          >
            RCF → RPM
          </button>
        </div>

        <!-- 正查输入 -->
        <div v-if="mode === 'forward'">
          <label class="block text-sm font-medium text-foreground mb-1.5" for="rcf-rpm-input">转速 n（rpm）</label>
          <input
            id="rcf-rpm-input"
            v-model="rpmInput"
            type="number"
            step="10"
            min="0"
            class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="例如 12000"
          />
        </div>

        <!-- 反查输入 -->
        <div v-else>
          <label class="block text-sm font-medium text-foreground mb-1.5" for="rcf-target-input">目标离心力 RCF（×g）</label>
          <input
            id="rcf-target-input"
            v-model="rcfTargetInput"
            type="number"
            step="100"
            min="0"
            class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="例如 10000"
          />
        </div>

        <!-- 半径输入 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5" for="rcf-radius-input">离心半径 r（cm，0.5–20）</label>
          <input
            id="rcf-radius-input"
            :value="radiusInput"
            @input="onRadiusInput($event.target.value)"
            type="number"
            step="0.1"
            class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="例如 4.8"
          />
        </div>

        <!-- 常用型号半径速查 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5" for="rcf-preset-select">常用离心机型号半径速查（示例值）</label>
          <select
            id="rcf-preset-select"
            v-model="presetSel"
            @change="applyPresetChoice"
            class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">— 选择后自动填入半径 —</option>
            <option v-for="p in ROTOR_PRESETS" :key="p.id" :value="p.id">{{ p.name }} ≈ {{ p.radiusCm }} cm</option>
          </select>
          <p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
            以上均为示例参考值，实际请以离心机/转头说明书标注的最大半径 r_max 为准（不同孔位可有差异）。
          </p>
        </div>

        <!-- 校验提示 -->
        <p
          v-if="inputWarn"
          class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5"
        >
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ inputWarn }}</span>
        </p>
        <p v-else class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-700 flex items-start gap-1.5">
          <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>参数正常：按半径 {{ radiusUsed }} cm 计算（最近一次半径已本地保存）。</span>
        </p>

        <div class="space-y-2">
          <button
            @click="applyDemoPreset"
            class="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 rounded-lg text-sm font-medium text-primary-foreground transition"
          >
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 示例：12000 rpm / 4.8 cm ≈ 7728 ×g
          </button>
          <button
            @click="resetInputs"
            class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 清空重填
          </button>
        </div>
      </div>

      <!-- 结果面板（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 结果卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Cylinder class="w-5 h-5 mr-2 text-primary" /> 换算结果
            </h2>
            <span class="text-xs text-muted-foreground font-mono px-2 py-1 rounded bg-muted/60">
              {{ mode === 'forward' ? 'RPM → RCF' : 'RCF → RPM' }}
            </span>
          </div>

          <div class="bg-primary/10 rounded-lg p-6 text-center">
            <p class="text-xs text-muted-foreground mb-2">
              {{ mode === 'forward' ? `半径 ${radiusUsed} cm 处的相对离心力` : `半径 ${radiusUsed} cm 下达到 ${rcfTargetInput || '—'} ×g 需设置` }}
            </p>
            <p class="text-5xl sm:text-6xl font-extrabold text-primary font-mono break-all">
              {{ bigValue }}<span class="text-xl font-bold ml-1.5">{{ bigUnit }}</span>
            </p>
            <p v-if="mode === 'reverse' && roundHint" class="text-xs text-muted-foreground mt-3">
              {{ roundHint }}
            </p>
          </div>

          <p class="text-sm font-mono bg-muted/50 rounded-lg p-3 leading-relaxed text-foreground break-all">
            {{ formulaLine }}
          </p>
        </div>

        <!-- 实验常用场景速查表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Target class="w-5 h-5 mr-2 text-primary" /> 实验常用场景 · 按当前半径 {{ radiusUsed }} cm 联动
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">实验场景</th>
                  <th class="py-2 pr-3 font-medium">典型离心力</th>
                  <th class="py-2 pr-3 font-medium">本机需设约</th>
                  <th class="py-2 font-medium">备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in sceneRows" :key="row.id" class="border-b border-border/60 last:border-0">
                  <td class="py-2 pr-3 text-foreground">{{ row.name }}</td>
                  <td class="py-2 pr-3 font-mono text-muted-foreground">{{ row.rcfText }}</td>
                  <td class="py-2 pr-3 font-mono font-semibold text-primary">{{ row.rpmText }} rpm</td>
                  <td class="py-2 text-xs text-muted-foreground">{{ row.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>敏感度小注：RCF 与转速平方成正比——{{ demoRpmA }} 到 {{ demoRpmB }} rpm 转速差 {{ rpmPctText }}%，离心力却差 {{ rcfPctText }}%。低速段别忽视平方放大。</span>
          </p>
        </div>

        <!-- 换算系数科普卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 换算系数从哪来（1.118×10⁻⁵ 的推导）
          </h2>
          <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li>标准重力加速度 g = 9.80665 m/s²（1901 年国际重力基准定义，常数本身沿用至今）。</li>
            <li>角速度 ω = 2πn ÷ 60（rad/s），向心加速度 a = ω² × r（r 取米）。</li>
            <li>相对离心力 RCF = a ÷ g，把 r 换成 cm、n 换成 rpm 整理得系数 (2π/60)² ÷ 100 ÷ 9.80665 ≈ 1.118×10⁻⁵。</li>
            <li>心算速记式：RCF ≈ 11.18 × r(cm) × (n/1000)²——如 12000 rpm、r=4.8：11.18×4.8×144 ≈ 7728×g，与上方预设一致。</li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>rpm 和 ×g 是什么关系？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          rpm（每分钟转数）描述转头转得多快，×g（相对离心力 RCF）描述样品实际被「甩」得多狠，二者通过公式
          RCF = 1.118×10⁻⁵ × n² × r 联系：离心力与转速的平方成正比，还与旋转半径成正比。
          同一个 12000 rpm，在 r=4.8cm 的迷你机上是约 7728×g，在 r=7cm 的台式角转上就是约 11269×g，在 r=10.5cm 的 50mL 角转上高达约 16904×g。
          所以离心力对半径同样敏感，不能只看转速面板上的数字。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么不同离心机的转速不能直接抄？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          文献方案里的 rpm 是在作者那台离心机（特定转头、特定半径）上验证过的。换到半径更小的转头，同样 rpm 的实际离心力更小，
          沉淀可能不完全；换到半径更大的转头则离心力偏大，可能压实甚至损伤沉淀。规范做法是把方案 rpm 按其半径换成 ×g，
          再用自己转头的 r_max 反算 rpm。例如经典手册条件 13375 rpm @5cm（恰为 10000×g）抄到 r=4.8cm 的转头上只剩约 9600×g，
          抄到 r=7cm 上变成约 14000×g——差 40% 以上，足以影响线粒体与溶酶体的分层效果。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">说明书的最大半径和最小半径取哪个？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          角转子说明书常标 r_min（孔位内端到轴心的最小距离）和 r_max（管底到轴心的最大距离）。沉淀效率由管底受力决定，
          换算与设定转速时一律取 <strong class="font-semibold text-foreground">r_max（最大半径）</strong>；只有密度梯度分层关注等密度点、
          或厂家用平均半径 r_av 给 k-factor 时，才按说明书要求改用对应值。孔位深浅不同的适配器半径也不同，以实际使用的为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">差速离心与密度梯度离心一句话</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          差速离心靠逐级提高 ×g（如本页场景表：1000 → 10000 → 100000×g）按颗粒大小沉淀分离细胞组分；
          密度梯度离心（如 Ficoll 分离淋巴细胞）靠介质密度梯度按浮点密度分层，转速只决定分层时间，通常取温和的 200–800×g 且避免大半径超速产热。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">换算公式的历史常数</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          系数 1.118×10⁻⁵ 并非经验值，而是 (2π/60)²÷(100×9.80665) 的化简：2π/60 把 rpm 换成 rad/s，除以 100 把 cm 换成 m，再除以标准重力加速度 9.80665 m/s²。
          美产手册常写作 RCF = 11.18 × r(cm) × (RPM/1000)²，本质完全相同；少数旧文献用 g=980 cm/s² 的近似得 1.117×10⁻⁵，误差 0.1%，可忽略。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">RPM 和 ×g 怎么换算？</h3>
            <p class="text-sm text-muted-foreground mt-1">正向：RCF(×g) = 1.118×10⁻⁵ × rpm² × 半径(cm)；反向：rpm = √( RCF ÷ (1.118×10⁻⁵ × 半径) )。把参数填进本页输入区即可，结果卡还会展示数字代入过程。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">离心半径填多少？说明书两个值取哪个？</h3>
            <p class="text-sm text-muted-foreground mt-1">取转头说明书标注的最大半径 r_max（管底到轴心距离），沉淀效果由管底受力决定。同一台离心机不同转头、不同孔位的 r 不同，请逐转头填写；本页会记住你最近一次的半径。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">文献里的 12000 rpm 能直接设到自己离心机上吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不建议。应先把文献 rpm 按其半径换算成 ×g，再用你自己转头的 r_max 反算 rpm。例如高速沉淀 DNA 常用 12000×g：在 r=4.8cm 需约 14954 rpm，在 r=10.5cm 只需约 10110 rpm，直接抄 12000 rpm 会两头出错。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。换算全在浏览器本地完成，只有最近一次半径存在你自己的 localStorage 里，清空浏览器数据即可抹除。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'rcf-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Cylinder, ArrowLeftRight, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Target
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '离心机 RPM-RCF 换算器 - 转速 rpm 与相对离心力×g 在线互转',
  description: '免费在线离心机 RPM↔RCF 双向换算工具：按 RCF=1.118×10⁻⁵·n²·r 正向算相对离心力、反向开方求需设 rpm，内置常用转头半径速查、细胞核/线粒体/微粒体等差速离心场景转速联动表与公式代入过程，纯浏览器本地运行不上传。',
  keywords: '离心机转速换算,RCF 计算,rpm g 转换,相对离心力公式,离心半径',
  author: '有条工具',
  ogTitle: '离心机 RPM-RCF 换算器 - 转速与相对离心力互转 | 有条工具',
  ogDescription: 'RPM↔×g 双向换算、转头半径速查、差速离心场景需设转速表，公式代入过程一目了然。',
  ogUrl: 'https://www.util.cn/tools/rcf-calculator',
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
          name: '离心机 RPM-RCF 换算器',
          url: 'https://www.util.cn/tools/rcf-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['RPM 与 RCF(×g) 双向换算', '常用转头半径示例速查填充', '差速离心实验场景需设转速联动表', '公式代入过程展示', '半径 0.5–20cm 越界钳制提醒', '最近半径本地保存']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '离心机 RPM-RCF 换算器', item: 'https://www.util.cn/tools/rcf-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'RPM 和 ×g 怎么换算？',
              acceptedAnswer: { '@type': 'Answer', text: '正向：RCF(×g)=1.118×10⁻⁵×rpm²×半径(cm)；反向：rpm=√(RCF÷(1.118×10⁻⁵×半径))。把参数填入工具即可，结果卡会展示数字代入过程。' }
            },
            {
              '@type': 'Question',
              name: '离心半径填多少？说明书的最大/最小半径取哪个？',
              acceptedAnswer: { '@type': 'Answer', text: '取转头说明书标注的最大半径 r_max（管底到轴心距离），沉淀效果由管底受力决定。同一台离心机不同转头和孔位的半径不同，请逐转头填写，工具会记住最近一次半径。' }
            },
            {
              '@type': 'Question',
              name: '文献里的 12000 rpm 能直接设到自己的离心机上吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不建议。应先把文献 rpm 按其转头半径换算成 ×g，再用自己转头的 r_max 反算 rpm。例如 12000×g 在半径 4.8cm 需约 14954 rpm，在 10.5cm 只需约 10110 rpm，直接抄数字会两头出错。' }
            },
            {
              '@type': 'Question',
              name: '换算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。全部计算在浏览器本地完成，仅最近一次半径保存在你本机的 localStorage，清空浏览器数据即可抹除。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// RCF = 1.118e-5 × n² × r（n: rpm，r: cm）
// 系数来源：ω = 2πn/60 (rad/s)，a = ω²·r(m)，RCF = a/g，g = 9.80665 m/s²
//   ⇒ 系数 = (2π/60)² ÷ 100 ÷ 9.80665 = 1.11824e-5，工程惯例截断为 1.118e-5
const RCF_CONST = 1.118e-5
const G_M_S2 = 9.80665
const RADIUS_MIN = 0.5
const RADIUS_MAX = 20
const DEFAULT_RADIUS = 4.8

function rcfOf(rpm, radiusCm) {
  return RCF_CONST * rpm * rpm * radiusCm
}

function rpmOf(rcf, radiusCm) {
  return Math.sqrt(rcf / (RCF_CONST * radiusCm))
}

function clampRadius(r) {
  return Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, r))
}

function parseNumber(s) {
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

// 转速变化百分比：(b - a) / a × 100
function rpmChangePct(a, b) {
  return ((b - a) / a) * 100
}

// 同半径下，转速 a→b 引起的 RCF 变化百分比（平方放大，与半径无关）
function rcfChangePctForRpm(a, b) {
  return ((b * b) / (a * a) - 1) * 100
}

// 千分位
function withCommas(s) {
  const parts = String(s).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

// ×g 显示：≥100 取整千分位；≥10 一位小数；否则两位小数
function fmtRcfText(v) {
  if (v >= 100) return withCommas(String(Math.round(v)))
  if (v >= 10) return v.toFixed(1)
  return v.toFixed(2)
}

// rpm 显示：接近整数显示整数，否则一位小数（反查规范要求）
function fmtRpmText(v) {
  const rounded = Math.round(v * 10) / 10
  return Number.isInteger(rounded) ? withCommas(String(rounded)) : withCommas(rounded.toFixed(1))
}

// 正查公式代入行
function forwardFormulaLine(rpm, radiusCm, rcfText) {
  return `RCF = 1.118×10⁻⁵ × ${withCommas(String(rpm))}² × ${radiusCm} = ${rcfText} ×g`
}

// 反查公式代入行
function reverseFormulaLine(rcf, radiusCm, rpmText) {
  return `RPM = √( ${withCommas(String(rcf))} ÷ (1.118×10⁻⁵ × ${radiusCm}) ) ≈ ${rpmText} rpm`
}

// 常用转头/机型半径速查（示例参考值，实际以说明书 r_max 为准）
const ROTOR_PRESETS = [
  { id: 'mini-ep', name: '迷你离心机 · 1.5/2.0mL EP 管', radiusCm: 4.8 },
  { id: 'pcr-spin', name: '掌上瞬离 · 单排 PCR 管', radiusCm: 5.0 },
  { id: 'bench-angle', name: '台式高速 · 通用角转子 EP 孔位', radiusCm: 7.0 },
  { id: 'angle-15', name: '角转子 · 15mL 离心管', radiusCm: 8.0 },
  { id: 'angle-50', name: '角转子 · 50mL 离心管', radiusCm: 10.5 },
  { id: 'swing-15', name: '水平转头 · 15mL × 4', radiusCm: 12.0 },
  { id: 'swing-50', name: '水平转头 · 50mL × 4', radiusCm: 15.0 },
  { id: 'bottle', name: '高速冷冻 · 250mL 培养瓶转子', radiusCm: 13.0 },
  { id: 'ultra', name: '超速离心 · 10 万 rpm 级水平转（示例）', radiusCm: 14.0 }
]

// 实验常用场景（差速离心沉淀 ×g 约定俗成）
const SCENES = [
  { id: 'nuclei', name: '细胞核 / 全细胞沉淀', rcf: 1000, note: '低速澄清，约 5 min' },
  { id: 'mito', name: '线粒体沉淀', rcf: 10000, note: '差速离心第二级' },
  { id: 'microsome', name: '微粒体 / 内质网沉淀', rcf: 100000, note: '通常需超速离心' },
  { id: 'dna', name: 'DNA 乙醇沉淀后管底收集', rcf: 12000, note: '微量机常用' },
  { id: 'lympho', name: '淋巴细胞分离（Ficoll）', rcf: 400, note: '温和分层，忌大半径超速' }
]

// 按当前半径生成场景联动表：每行给出该场景在本机需设的约 rpm
function buildSceneRows(radiusCm) {
  const r = clampRadius(radiusCm)
  return SCENES.map((s) => ({
    ...s,
    rcfText: `${withCommas(String(s.rcf))} ×g`,
    rpm: rpmOf(s.rcf, r),
    rpmText: withCommas(String(Math.round(rpmOf(s.rcf, r))))
  }))
}

// 手算断言参考：
//   rcfOf(1000, 5)      = 1.118e-5 × 1e6 × 5      = 55.9
//   rcfOf(12000, 4.8)   = 1.118e-5 × 1.44e8 × 4.8 = 7727.6 ≈ 7728
//   rpmOf(10000, 5)     = √(10000 ÷ 5.59e-5)      = 13375（经典手册值）
//   rpmChangePct(12000, 13000)        = 8.33%
//   rcfChangePctForRpm(12000, 13000)  = (13/12)² - 1 = 17.36%

// ---------- 状态与交互 ----------
const mode = ref('forward')          // 'forward': rpm→rcf；'reverse': rcf→rpm
const rpmInput = ref('12000')
const rcfTargetInput = ref('10000')
const radiusInput = ref(String(DEFAULT_RADIUS))
const presetSel = ref('')
const seoContentVisible = ref(true)

const RADIUS_STORAGE_KEY = 'rcf-calculator:lastRadius'

const radiusNum = computed(() => parseNumber(radiusInput.value))
const radiusUsed = computed(() =>
  Number.isFinite(radiusNum.value) ? clampRadius(radiusNum.value) : DEFAULT_RADIUS
)
const radiusOutOfRange = computed(
  () => Number.isFinite(radiusNum.value) && (radiusNum.value < RADIUS_MIN || radiusNum.value > RADIUS_MAX)
)

const rpmNum = computed(() => parseNumber(rpmInput.value))
const rcfTargetNum = computed(() => parseNumber(rcfTargetInput.value))

const inputWarn = computed(() => {
  if (!Number.isFinite(radiusNum.value)) return '离心半径未填或不是数字，暂按默认 4.8 cm 计算。'
  if (radiusOutOfRange.value) return `半径须在 ${RADIUS_MIN}–${RADIUS_MAX} cm 之间（收到 ${radiusNum.value}），已按 ${radiusUsed.value} cm 钳制计算，请核对转头说明书。`
  if (mode.value === 'forward' && !(rpmNum.value > 0)) return '请填写大于 0 的转速（rpm），常用范围 500–30000。'
  if (mode.value === 'reverse' && !(rcfTargetNum.value > 0)) return '请填写大于 0 的目标离心力（×g），常用范围 100–150000。'
  return ''
})

const hasResult = computed(() =>
  Number.isFinite(radiusNum.value) &&
  (mode.value === 'forward' ? rpmNum.value > 0 : rcfTargetNum.value > 0)
)

const forwardRcf = computed(() => (hasResult.value && mode.value === 'forward' ? rcfOf(rpmNum.value, radiusUsed.value) : 0))
const reverseRpm = computed(() => (hasResult.value && mode.value === 'reverse' ? rpmOf(rcfTargetNum.value, radiusUsed.value) : 0))

const bigValue = computed(() => {
  if (!hasResult.value) return '—'
  return mode.value === 'forward' ? fmtRcfText(forwardRcf.value) : fmtRpmText(reverseRpm.value)
})
const bigUnit = computed(() => (mode.value === 'forward' ? '×g' : 'rpm'))

const roundHint = computed(() => {
  if (mode.value !== 'reverse' || !hasResult.value) return ''
  const v = reverseRpm.value
  if (Math.abs(v - Math.round(v)) <= 0.05) return ''
  return `开方结果非整数：取整按转速就近，实际操作请设约 ${withCommas(String(Math.round(v)))} rpm。`
})

const formulaLine = computed(() => {
  if (!hasResult.value) return '填写转速或目标 ×g 与离心半径后，这里显示公式代入过程。'
  if (mode.value === 'forward') return forwardFormulaLine(rpmNum.value, radiusUsed.value, fmtRcfText(forwardRcf.value))
  return reverseFormulaLine(rcfTargetNum.value, radiusUsed.value, fmtRpmText(reverseRpm.value))
})

const sceneRows = computed(() => buildSceneRows(radiusUsed.value))

const demoRpmA = 12000
const demoRpmB = 13000
const rpmPctText = computed(() => rpmChangePct(demoRpmA, demoRpmB).toFixed(1))
const rcfPctText = computed(() => rcfChangePctForRpm(demoRpmA, demoRpmB).toFixed(1))

function setMode(m) {
  mode.value = m
}

function persistRadius(r) {
  try {
    localStorage.setItem(RADIUS_STORAGE_KEY, String(r))
  } catch (e) {
    // localStorage 不可用（隐私模式等）时静默降级，不影响计算
  }
}

function onRadiusInput(raw) {
  radiusInput.value = raw
  presetSel.value = ''
  const n = parseNumber(raw)
  if (Number.isFinite(n) && n >= RADIUS_MIN && n <= RADIUS_MAX) persistRadius(n)
}

function applyPresetChoice() {
  const p = ROTOR_PRESETS.find((x) => x.id === presetSel.value)
  if (!p) return
  radiusInput.value = String(p.radiusCm)
  persistRadius(p.radiusCm)
}

function applyDemoPreset() {
  mode.value = 'forward'
  rpmInput.value = '12000'
  radiusInput.value = String(DEFAULT_RADIUS)
  presetSel.value = ''
  persistRadius(DEFAULT_RADIUS)
}

function resetInputs() {
  mode.value = 'forward'
  rpmInput.value = ''
  rcfTargetInput.value = ''
  radiusInput.value = String(DEFAULT_RADIUS)
  presetSel.value = ''
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('rcf-calculator')
  try {
    const saved = Number(localStorage.getItem(RADIUS_STORAGE_KEY))
    if (Number.isFinite(saved) && saved >= RADIUS_MIN && saved <= RADIUS_MAX) {
      radiusInput.value = String(saved)
    }
  } catch (e) {
    // 忽略：无保存值时用默认半径
  }
})
</script>
