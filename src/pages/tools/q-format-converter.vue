<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Binary class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Q格式定点数转换器</h1>
          <p class="text-sm text-muted-foreground mt-1">Qm.n 定点数与浮点互转：Q7/Q15/Q31 常用格式、十六进制原码、饱和与截断行为演示</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 Q 格式定点数转换器：Qm.n 表示用 m 位整数位 + n 位小数位 + 1 位符号位（总位宽 m+n+1）表示实数，
        定点整数 = round(x × 2ⁿ)。支持 Q7（8 位）、Q15（16 位）、Q31（32 位）、Q7.8 等常用档与自定义 m.n，
        输出补码二进制/十六进制原码，双向可逆；输入超范围时可对照「饱和到边界」与「截断低位（回绕）」两种硬件行为，
        并标注量化误差上限。全部计算在浏览器本地完成，不上传。
      </p>
    </div>

    <!-- 格式配置条 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-6">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
        <div class="col-span-2 md:col-span-2">
          <label class="text-sm font-medium text-foreground block mb-1.5">预设档</label>
          <select
            v-model="presetKey"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="q7">Q7（8 位 · 0 整数位 + 7 小数位）</option>
            <option value="q15">Q15（16 位 · 0+15，音频常用）</option>
            <option value="q31">Q31（32 位 · 0+31，高精度定点）</option>
            <option value="q78">Q7.8（16 位 · 7+8，整型混合作业）</option>
            <option value="custom">自定义 Qm.n</option>
          </select>
        </div>
        <template v-if="presetKey === 'custom'">
          <div>
            <label class="text-xs text-muted-foreground block mb-1">整数位 m</label>
            <input v-model.number="customM" type="number" min="0" max="31" step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs text-muted-foreground block mb-1">小数位 n</label>
            <input v-model.number="customN" type="number" min="0" max="31" step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </template>
        <div class="bg-muted/50 rounded-lg p-3 md:col-span-2">
          <p class="text-xs text-muted-foreground">当前格式 <span class="text-foreground font-bold font-mono">{{ qLabel }}</span>
            · 总位宽 <span class="text-foreground font-mono">{{ effBits }}</span> 位
            · 表示范围 <span class="text-foreground font-mono">{{ rangeText }}</span></p>
          <p class="text-[11px] text-muted-foreground mt-1">量化步长 2<sup>−{{ effN }}</sup> ≈ {{ lsbText }}，误差上限（±½ LSB）≈ {{ errText }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 浮点 → 定点 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <ArrowLeftRight class="w-5 h-5 mr-2 text-primary" /> ① 浮点 → Q{{ effM }}.{{ effN }} 定点
        </h2>

        <div>
          <label class="text-sm font-medium text-foreground block mb-1.5">输入实数 x</label>
          <input v-model="floatInput" type="text" inputmode="decimal" placeholder="如 5.33 / -1.5 / 0.999"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>

        <div class="flex items-center gap-4 text-sm">
          <span class="text-muted-foreground">超范围行为：</span>
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input v-model="behavior" type="radio" value="sat" class="accent-[var(--primary,#2563eb)]" /> 饱和（钳到边界）
          </label>
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input v-model="behavior" type="radio" value="trunc" class="accent-[var(--primary,#2563eb)]" /> 截断低位（回绕）
          </label>
        </div>

        <template v-if="forwardResult">
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-muted/50 rounded-xl p-3">
              <p class="text-[11px] text-muted-foreground mb-1">定点整数（十进制）</p>
              <p class="text-lg font-mono font-bold text-foreground">{{ forwardResult.applied }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-3">
              <p class="text-[11px] text-muted-foreground mb-1">十六进制（补码原码）</p>
              <p class="text-lg font-mono font-bold text-primary">{{ forwardResult.hex }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-3">
              <p class="text-[11px] text-muted-foreground mb-1">还原浮点 x̂</p>
              <p class="text-lg font-mono font-bold text-foreground">{{ forwardResult.restored }}</p>
            </div>
          </div>
          <div class="bg-muted/50 rounded-xl p-3 font-mono text-xs text-muted-foreground break-all leading-relaxed">
            <span class="text-foreground">二进制：</span>{{ forwardResult.bin }}
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            过程：round({{ forwardResult.xInput }} × 2<sup>{{ effN }}</sup>) = {{ forwardResult.raw }}
            <template v-if="forwardResult.clamped"> → {{ behavior === 'sat' ? '饱和' : '截断' }}后 {{ forwardResult.applied }}（超出 [{{ rangeText }}]，已触发边界）</template>
            <template v-else>（在范围内，未触发边界）</template>
          </p>
          <button
            @click="copyForward"
            class="px-3 py-1.5 border border-border rounded-lg text-xs text-foreground hover:bg-muted transition w-fit flex items-center gap-1.5"
          >
            <Copy class="w-3.5 h-3.5" /> 复制整数+十六进制
          </button>
        </template>
        <p v-else class="text-xs text-muted-foreground">输入实数后自动换算。</p>
      </div>

      <!-- 定点 → 浮点 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <ArrowLeftRight class="w-5 h-5 mr-2 text-primary rotate-180" /> ② 定点整数 → 浮点
        </h2>

        <div>
          <label class="text-sm font-medium text-foreground block mb-1.5">
            输入定点整数（十进制或 <span class="font-mono">0x</span> 十六进制，按 {{ effBits }} 位补码解释）
          </label>
          <input v-model="reverseInput" type="text" placeholder="如 0x0555 / 1365 / -49152"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>

        <template v-if="reverseResult">
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-muted/50 rounded-xl p-3">
              <p class="text-[11px] text-muted-foreground mb-1">补码解释整数值</p>
              <p class="text-lg font-mono font-bold text-foreground">{{ reverseResult.signed }}</p>
            </div>
            <div class="bg-primary/10 rounded-xl p-3">
              <p class="text-[11px] text-muted-foreground mb-1">还原浮点 = int ÷ 2<sup>{{ effN }}</sup></p>
              <p class="text-lg font-mono font-bold text-primary">{{ reverseResult.value }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-3">
              <p class="text-[11px] text-muted-foreground mb-1">补码原码</p>
              <p class="text-lg font-mono font-bold text-foreground">{{ reverseResult.hex }}</p>
            </div>
          </div>
          <p v-if="reverseResult.outOfRange" class="text-xs text-amber-600">
            注：整数值超出 Q{{ effM }}.{{ effN }} 理论范围 [{{ rangeText }}] 对应的整数区间，已按 {{ effBits }} 位补码回绕解释。
          </p>
          <button
            @click="copyReverse"
            class="px-3 py-1.5 border border-border rounded-lg text-xs text-foreground hover:bg-muted transition w-fit flex items-center gap-1.5"
          >
            <Copy class="w-3.5 h-3.5" /> 复制还原浮点值
          </button>
        </template>
        <p v-else class="text-xs text-muted-foreground">输入定点整数（支持 0x 十六进制）后自动还原。</p>
      </div>
    </div>

    <!-- 饱和 vs 截断 对照演示 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold mb-1 flex items-center">
        <TriangleAlert class="w-5 h-5 mr-2 text-primary" /> 饱和 vs 截断低位对照（当前输入 {{ qLabel }}）
      </h2>
      <p class="text-xs text-muted-foreground mb-4 leading-relaxed">
        同一个超范围输入，两种硬件行为结果完全不同：饱和是 DSP/音频处理期望的行为（削波但不突变），截断低位即整数回绕（大信号会突变成反号大信号，音频里表现为爆音）。
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="bg-muted/50 rounded-xl p-4 space-y-2">
          <p class="text-sm font-semibold text-foreground flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-full text-[11px] bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300">饱和 Saturation</span>
            <span v-if="satView.triggered" class="text-[11px] text-amber-600">已触发边界</span>
          </p>
          <p class="font-mono text-sm text-foreground">整数：<span class="font-bold">{{ satView.int }}</span></p>
          <p class="font-mono text-sm text-primary">十六进制：<span class="font-bold">{{ satView.hex }}</span></p>
          <p class="font-mono text-xs text-muted-foreground">还原 ≈ {{ satView.restored }}</p>
        </div>
        <div class="bg-muted/50 rounded-xl p-4 space-y-2">
          <p class="text-sm font-semibold text-foreground flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-full text-[11px] bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">截断低位 / 回绕 Wrap</span>
            <span v-if="truncView.changed" class="text-[11px] text-amber-600">与饱和结果不同</span>
          </p>
          <p class="font-mono text-sm text-foreground">整数：<span class="font-bold">{{ truncView.int }}</span></p>
          <p class="font-mono text-sm text-primary">十六进制：<span class="font-bold">{{ truncView.hex }}</span></p>
          <p class="font-mono text-xs text-muted-foreground">还原 ≈ {{ truncView.restored }}</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12 open:pb-8">
      <summary class="text-lg font-semibold text-foreground cursor-pointer select-none flex items-center">
        <Info class="w-5 h-5 mr-2 text-primary" /> 定点 vs 浮点：DSP/嵌入式为什么用定点？饱和运算用在哪？（点击展开：原理、公式、FAQ 与来源）
      </summary>

      <div class="mt-4 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">Qm.n 格式与双向换算公式</h3>
          <p class="text-sm text-muted-foreground leading-relaxed font-mono">
            Qm.n：总位宽 bits = m + n + 1（1 位符号）。表示范围 [−2^m, 2^m − 2^−n]；量化步长（LSB）= 2^−n；舍入误差 ≤ 2^−n / 2。
          </p>
          <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed mt-2">
            <li>浮点 → 定点：定点整数 = round(x × 2ⁿ)，再用 m+n+1 位补码写出十六进制原码。</li>
            <li>定点 → 浮点：先按补码把最高位为 1 的原码折算成负数，再 x = 整数 ÷ 2ⁿ。</li>
            <li>例：Q7.8 下 0x0555 = 1365 → 1365/256 = 5.33203125；5.33 → round(5.33×256)=1364 → 0x0554；Q15 下 0.999 → round(0.999×32768)=32735 → 0x7FDF；−1.5 超出 Q15 表示域 [−1, 0.99997]：饱和 → −32768 = 0x8000，截断回绕 → −49152 mod 2¹⁶ = 16384 = 0x4000（读回 +0.5，正是回绕的危害）。</li>
          </ul>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">定点 vs 浮点：为什么 DSP/嵌入式偏爱定点</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            定点数就是「放大了 2ⁿ 倍的整数」，加减乘都是整数运算：在没有 FPU（浮点单元）的 MCU（Cortex-M0/M3、经典 DSP 如 TI C55x、大部分 8 位机）上，
            浮点要么硬件不支持要么慢几十倍；定点运算周期确定、可预测，这对音频/电机控制等硬实时系统至关重要。
            代价是动态范围小（Q15 只有 ±1 内的约定域）、需要手工定标和管理溢出——所以本页提供范围提示与饱和/截断对照。
            现代带 FPU 的芯片（Cortex-M4F/M7、桌面 CPU）上浮点已是默认选项，定点更多见于 legacy 代码与超低功耗场景。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">饱和运算在音频处理中的应用</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            音频采样叠加、滤波、增益后常会超出 Q15 满幅（±32767）。饱和运算把结果钳在边界——听起来是「削波（clip）」，失真但能量连续；
            若不做饱和而任由整数回绕，+32768 会突变成 −32768（反号极性跳变），听感是刺耳爆音，还可能损坏扬声器。
            所以 DSP 的 MAC（乘加）指令普遍带饱和模式（如 ARM SMLAxx、DSP 的 SAT 位），本页对照演示就是模拟这两种行为。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-semibold text-foreground">Q15 和 IQ15、Q1.15 是一回事吗？</h4>
              <p class="text-sm text-muted-foreground mt-1">大体是一回事：都是 16 位、1 符号位 + 15 小数位，约定域 [−1, 0.999969…]。不同厂商记法不同（TI 记 IQ15、有的文献记 Q1.15），注意有的记法把符号位计入 m，核对位宽定义即可——本工具按「总位宽 = m+n+1」口径。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">0.999 转成 Q15 为什么不是 32767？</h4>
              <p class="text-sm text-muted-foreground mt-1">round(0.999 × 32768) = round(32735.23) = 32735（0x7FDF），只有 ≥ 0.99997 才会四舍五入到 32767；32767/32768 ≈ 0.999969 才是 Q15 能表示的最大值。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">截断低位和直接取整是一回事吗？</h4>
              <p class="text-sm text-muted-foreground mt-1">不是。「截断低位」指结果超出位宽时丢掉高位回绕（wrap），与定点化时的「舍入 vs 截尾取整」是两件事；本页演示的是前者（溢出行为）。定点化统一用 round（四舍五入）。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">二进制/十六进制底层工具还有吗？</h4>
              <p class="text-sm text-muted-foreground mt-1">站内还有通用的 <a href="/tools/binary-convert/" class="text-primary hover:underline">二进制进制转换</a> 工具，可做任意位宽的进制互转；本页专注 Q 格式的定标与溢出行为。</p>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">口径与来源（两源交叉核对）</h3>
          <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li>Qm.n 定义（范围 [−2^m, 2^m−2^−n]、总位宽 m+n+1）：维基百科 Q (number format) 与 Texas Instruments《TMS320C6000 Integer Division / Qformat 应用笔记》口径一致。</li>
            <li>Q15 满幅 32767 / −32768 与音频饱和：ARM DSP 指令集文档（SMLABB 等饱和 MAC）与音频 DSP 教材通用口径一致。</li>
            <li>误差 ≤ 2^−n/2：四舍五入量化噪声标准结论，与信号处理教材一致。</li>
          </ul>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'q-format-converter'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Binary, ArrowLeftRight, TriangleAlert, Info, Copy } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'Q格式定点数转换器 - Qm.n 定点浮点互转（Q7/Q15/Q31） | 有条工具',
  description: '在线 Q 格式定点数转换器：浮点与 Qm.n 定点双向互转，Q7/Q15/Q31/Q7.8 预设与自定义位宽，输出补码二进制/十六进制原码，饱和与截断回绕对照演示，量化误差标注。DSP/嵌入式开发必备，本地运行不上传。',
  keywords: 'Q格式转换,定点数转换器,Q15格式,浮点定点互转,DSP定点运算,Q31',
  author: '有条工具',
  ogTitle: 'Q格式定点数转换器 - Qm.n 定点浮点互转（Q7/Q15/Q31） | 有条工具',
  ogDescription: 'Qm.n 定点数与浮点互转：Q7/Q15/Q31 常用格式、十六进制原码、饱和与截断行为演示。',
  ogUrl: 'https://www.util.cn/tools/q-format-converter',
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
          name: 'Q格式定点数转换器',
          url: 'https://www.util.cn/tools/q-format-converter',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '浮点 ↔ Qm.n 定点双向转换',
            'Q7/Q15/Q31/Q7.8 预设与自定义 m.n',
            '补码二进制/十六进制原码输出',
            '饱和 vs 截断低位（回绕）对照演示',
            '表示范围与量化误差标注',
            '支持 0x 十六进制输入按补码解释',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'Q格式定点数转换器', item: 'https://www.util.cn/tools/q-format-converter' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Q15 和 IQ15、Q1.15 是一回事吗？',
              acceptedAnswer: { '@type': 'Answer', text: '大体是同一格式：16 位、1 符号位 + 15 小数位，约定域 [-1, 0.999969]。注意部分记法把符号位计入 m，本工具按总位宽 = m+n+1 口径。' }
            },
            {
              '@type': 'Question',
              name: '0.999 转成 Q15 为什么不是 32767？',
              acceptedAnswer: { '@type': 'Answer', text: 'round(0.999×32768) = 32735（0x7FDF）；32767 对应 0.999969，是 Q15 能表示的最大值，需要更大值才会舍入到 32767。' }
            },
            {
              '@type': 'Question',
              name: '为什么音频处理要做饱和而不是回绕？',
              acceptedAnswer: { '@type': 'Answer', text: '饱和钳到 ±满幅听起来是削波失真，能量连续；整数回绕会让 +32768 突变成 -32768，反号跳变在音频里是刺耳爆音，可能损坏扬声器。DSP 的 MAC 指令普遍带饱和模式。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯函数区（node 可独立单测） ----------

// Qm.n：总位宽 = m + n + 1（1 位符号）
function totalBits(m, n) {
  return m + n + 1
}

// 表示范围 [−2^m, 2^m − 2^−n]
function qRangeMin(m) { return -Math.pow(2, m) }
function qRangeMax(m, n) { return Math.pow(2, m) - Math.pow(2, -n) }

// 浮点 → 定点原始整数（四舍五入）
function floatToQRaw(x, n) {
  return Math.round(x * Math.pow(2, n))
}

// 饱和：钳到 [−2^(m+n), 2^(m+n)−1] 整数区间
function satInt(raw, m, n) {
  const min = -Math.pow(2, m + n)
  const max = Math.pow(2, m + n) - 1
  return Math.min(max, Math.max(min, raw))
}

// 截断低位（回绕）：按 bits 位补码解释
function truncInt(raw, m, n) {
  const bits = m + n + 1
  const mod = Math.pow(2, bits)
  const u = ((raw % mod) + mod) % mod
  return u >= mod / 2 ? u - mod : u
}

// 有符号整数 → bits 位补码十六进制原码（如 0x7FDF；超范围值按低 bits 位回绕写出）
function intToTwosHex(intVal, bits) {
  const u = intVal < 0 ? intVal + Math.pow(2, bits) : intVal
  return '0x' + Math.round(u).toString(16).toUpperCase().padStart(bits / 4, '0')
}

// 有符号整数 → bits 位补码二进制（每 4 位加空格）
function intToTwosBin(intVal, bits) {
  const u = intVal < 0 ? intVal + Math.pow(2, bits) : intVal
  const raw = Math.round(u).toString(2).padStart(bits, '0')
  return raw.replace(new RegExp(`(.{4})(?=.)`, 'g'), '$1 ')
}

// 定点整数 → 浮点（x = int / 2^n）
function qToFloat(intVal, n) {
  return intVal / Math.pow(2, n)
}

// 文本解析：支持 0x 十六进制 / 十进制（含负号），再按 bits 位补码折算成有符号整数
function parseTwos(text, bits) {
  const s = String(text == null ? '' : text).trim()
  if (!s) return null
  let u = null
  if (/^0[xX][0-9a-fA-F]+$/.test(s)) {
    u = parseInt(s.slice(2), 16)
  } else if (/^[-+]?[0-9]+$/.test(s)) {
    u = parseInt(s, 10)
  }
  if (u === null || Number.isNaN(u)) return null
  const mod = Math.pow(2, bits)
  const uu = ((u % mod) + mod) % mod
  return uu >= mod / 2 ? uu - mod : uu
}

// 浮点展示：削尾零、避免超长小数
function fmtFloat(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return String(Number(n.toPrecision(10)))
}

// ---------- 格式状态 ----------
const PRESETS = {
  q7: { m: 0, n: 7 },
  q15: { m: 0, n: 15 },
  q31: { m: 0, n: 31 },
  q78: { m: 7, n: 8 }
}

const presetKey = ref('q78')
const customM = ref(7)
const customN = ref(8)

const effM = computed(() => {
  if (presetKey.value !== 'custom') return PRESETS[presetKey.value].m
  const m = Math.round(Number(customM.value))
  if (!Number.isFinite(m)) return 0
  return Math.min(31, Math.max(0, m))
})
const effN = computed(() => {
  if (presetKey.value !== 'custom') return PRESETS[presetKey.value].n
  const n = Math.round(Number(customN.value))
  if (!Number.isFinite(n)) return 0
  return Math.min(Math.max(0, 31 - effM.value), n)
})
const effBits = computed(() => totalBits(effM.value, effN.value))

const qLabel = computed(() => `Q${effM.value}.${effN.value}（${effBits.value} 位）`)
const rangeText = computed(() => `[−2^${effM.value}, 2^${effM.value}−2^−${effN.value}]`)
const lsbText = computed(() => fmtFloat(Math.pow(2, -effN.value)))
const errText = computed(() => fmtFloat(Math.pow(2, -effN.value) / 2))

// ---------- ① 浮点 → 定点 ----------
const floatInput = ref('5.33')
const behavior = ref('sat')

const forwardResult = computed(() => {
  const x = Number(String(floatInput.value).trim())
  if (!Number.isFinite(x)) return null
  const raw = floatToQRaw(x, effN.value)
  const applied = behavior.value === 'sat' ? satInt(raw, effM.value, effN.value) : truncInt(raw, effM.value, effN.value)
  const clamped = applied !== raw
  return {
    xInput: fmtFloat(x),
    raw,
    applied,
    clamped,
    hex: intToTwosHex(applied, effBits.value),
    bin: intToTwosBin(applied, effBits.value),
    restored: fmtFloat(qToFloat(applied, effN.value))
  }
})

// ---------- ② 定点 → 浮点 ----------
const reverseInput = ref('0x0555')

const reverseResult = computed(() => {
  const signed = parseTwos(reverseInput.value, effBits.value)
  if (signed === null) return null
  const minInt = -Math.pow(2, effM.value + effN.value)
  const maxInt = Math.pow(2, effM.value + effN.value) - 1
  return {
    signed,
    value: fmtFloat(qToFloat(signed, effN.value)),
    hex: intToTwosHex(signed, effBits.value),
    outOfRange: signed < minInt || signed > maxInt
  }
})

// ---------- 饱和 vs 截断对照 ----------
function makeView(intVal) {
  return {
    int: intVal,
    hex: intToTwosHex(intVal, effBits.value),
    restored: fmtFloat(qToFloat(intVal, effN.value))
  }
}
const satView = computed(() => {
  const x = Number(String(floatInput.value).trim())
  const raw = Number.isFinite(x) ? floatToQRaw(x, effN.value) : 0
  const v = makeView(satInt(raw, effM.value, effN.value))
  return { ...v, triggered: satInt(raw, effM.value, effN.value) !== raw }
})
const truncView = computed(() => {
  const x = Number(String(floatInput.value).trim())
  const raw = Number.isFinite(x) ? floatToQRaw(x, effN.value) : 0
  const v = makeView(truncInt(raw, effM.value, effN.value))
  return { ...v, changed: truncInt(raw, effM.value, effN.value) !== satInt(raw, effM.value, effN.value) }
})

// ---------- 复制（clipboard + alert） ----------
async function copyForward() {
  if (!forwardResult.value) return
  const r = forwardResult.value
  try {
    await navigator.clipboard.writeText(`${qLabel.value}: x=${r.xInput} → 定点整数 ${r.applied} = ${r.hex}（补码 ${r.bin.replace(/ /g, '')}）`)
    alert('已复制')
  } catch (err) { /* 失败静默 */ }
}
async function copyReverse() {
  if (!reverseResult.value) return
  const r = reverseResult.value
  try {
    await navigator.clipboard.writeText(`${qLabel.value}: ${r.hex} → 整数 ${r.signed} → 浮点 ${r.value}`)
    alert('已复制')
  } catch (err) { /* 失败静默 */ }
}

onMounted(() => {
  addRecentTool('q-format-converter')
})
</script>
