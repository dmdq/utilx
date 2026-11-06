<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Hash class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">有效数字修约</h1>
          <p class="text-sm text-muted-foreground mt-1">GB/T 8170-2008 四舍六入五成双：保留 n 位有效数字 / n 位小数 / 修约间隔，与普通四舍五入差异对照</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线数值修约工具：按 GB/T 8170-2008「四舍六入五成双」规则修约，支持保留 n 位有效数字、保留 n 位小数、
        按修约间隔（0.5 / 0.05 / 0.005 / 整数 / 自定义正数）三种模式，单值或批量多行处理；
        结果表逐行给出修约值、保留位数标注与「普通四舍五入」对照列，规则不同的行自动高亮；
        大/小数值提供 1.23e-7 风格的科学计数法切换与双显。
        <span class="text-foreground font-medium">实现基于十进制字符串 + BigInt 定点运算，不经二进制浮点</span>，
        1.005 → 1.00、1.015 → 1.02 这类 toFixed 翻车场景逐位精确。适合实验室数据、检测报告与质量记录修约。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          <span class="font-semibold">为什么不能用 toFixed / Math.round</span>：二进制浮点里 1.005 实际是 1.00499999999999989…，
          (1.015).toFixed(2) 给 1.01、(2.675).toFixed(2) 给 2.67，而按 GB/T 8170 的十进制精确值应得 1.02 与 2.68。
          本工具全程十进制定点运算，不受此陷阱影响。
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主区：模式 + 输入 + 结果表 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="m in MODES"
            :key="m.id"
            @click="mode = m.id"
            :class="mode === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-xs sm:text-sm font-medium transition-all"
          >{{ m.label }}</button>
        </div>

        <!-- 模式参数 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div v-if="mode === 'sig'">
            <label for="sfr-n" class="block text-sm font-medium text-foreground mb-1.5">保留有效数字位数 n（1~12）</label>
            <input
              id="sfr-n"
              v-model.number="sigN"
              type="number"
              min="1"
              max="12"
              step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div class="flex gap-1.5 mt-2">
              <button v-for="n in [1, 2, 3, 4, 5]" :key="n" @click="sigN = n" class="px-2.5 py-1 rounded-md bg-muted/40 border border-border text-xs font-mono text-foreground hover:border-primary/40 transition">{{ n }}</button>
            </div>
          </div>
          <div v-else-if="mode === 'dec'">
            <label for="sfr-d" class="block text-sm font-medium text-foreground mb-1.5">保留小数位数 n（0~10）</label>
            <input
              id="sfr-d"
              v-model.number="decN"
              type="number"
              min="0"
              max="10"
              step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div class="flex gap-1.5 mt-2">
              <button v-for="n in [0, 1, 2, 3, 4]" :key="n" @click="decN = n" class="px-2.5 py-1 rounded-md bg-muted/40 border border-border text-xs font-mono text-foreground hover:border-primary/40 transition">{{ n }}</button>
            </div>
          </div>
          <div v-else>
            <label for="sfr-int" class="block text-sm font-medium text-foreground mb-1.5">修约间隔（正数，预设或自定义）</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="p in INTERVAL_PRESETS"
                :key="p"
                @click="intervalText = p"
                class="px-2.5 py-1 rounded-md border text-xs font-mono transition"
                :class="intervalText === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
              >{{ p === '1' ? '1（整数）' : p }}</button>
            </div>
            <input
              id="sfr-int"
              v-model="intervalText"
              type="text"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="自定义正数，如 0.2 或 5"
            />
            <p v-if="mode === 'interval' && intervalParsed === null" class="text-xs text-red-500 mt-1.5">修约间隔须为正的十进制数（如 0.5、0.05、2）。</p>
          </div>

          <div class="flex flex-col justify-between gap-2">
            <label class="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
              <input v-model="sciDisplay" type="checkbox" class="w-4 h-4 accent-[hsl(var(--primary))]" />
              科学计数法显示（1.23e-7 风格）
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                @click="loadExample"
                class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
              >
                <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 载入典型样例
              </button>
              <button
                @click="clearInput"
                class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition"
              >
                <RefreshCw class="w-3 h-3 inline mr-1 -mt-0.5" /> 清空
              </button>
            </div>
          </div>
        </div>

        <!-- 输入 -->
        <div>
          <label for="sfr-input" class="block text-sm font-medium text-foreground mb-1.5">输入数字（每行一个，支持 1.2345e-7 科学计数法与千分位逗号）</label>
          <textarea
            id="sfr-input"
            v-model="rowsText"
            rows="6"
            spellcheck="false"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            :placeholder="'1.005\n1.015\n2.5\n-1.25'"
          ></textarea>
        </div>

        <!-- 结果表 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-base font-semibold text-foreground">修约结果（GB/T 8170-2008）</h2>
            <button
              @click="copyTable"
              :disabled="!rows.length"
              class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle v-if="copyStatus === 'ok'" class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" />
              {{ copyStatus === 'ok' ? '已复制' : '复制结果表' }}
            </button>
          </div>

          <div v-if="rows.length" class="overflow-x-auto">
            <table class="w-full text-sm min-w-[560px]">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">原值</th>
                  <th class="py-2 pr-3 font-medium">修约值（GB/T 8170）</th>
                  <th class="py-2 pr-3 font-medium">保留标注</th>
                  <th class="py-2 pr-3 font-medium">普通四舍五入</th>
                  <th class="py-2 font-medium">差异</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, ri) in rows"
                  :key="ri"
                  class="border-b border-border/50"
                  :class="row.ok && row.differs ? 'bg-amber-500/10' : ''"
                >
                  <td class="py-2.5 pr-3 font-mono text-foreground">{{ row.raw }}</td>
                  <template v-if="row.ok">
                    <td class="py-2.5 pr-3">
                      <p class="font-mono font-semibold" :class="row.differs ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'">{{ row.primary }}</p>
                      <p v-if="row.secondary" class="font-mono text-[11px] text-muted-foreground">{{ row.secondary }}</p>
                    </td>
                    <td class="py-2.5 pr-3 text-xs text-muted-foreground">{{ row.label }}</td>
                    <td class="py-2.5 pr-3 font-mono text-muted-foreground">{{ row.normal }}</td>
                    <td class="py-2.5">
                      <span v-if="row.differs" class="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-medium">规则不同</span>
                      <span v-else class="text-muted-foreground text-[10px]">一致</span>
                    </td>
                  </template>
                  <template v-else>
                    <td class="py-2.5 pr-3 text-red-500 text-xs">无法识别</td>
                    <td class="py-2.5 pr-3 text-muted-foreground text-xs">—</td>
                    <td class="py-2.5 pr-3 text-muted-foreground text-xs">—</td>
                    <td class="py-2.5 text-muted-foreground text-xs">—</td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-muted/50 border border-border">
            <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">在上方输入框粘贴数字（每行一个），结果表将在此显示。可先点「载入典型样例」看规则效果。</p>
          </div>

          <p v-if="rows.length" class="text-[11px] leading-relaxed text-muted-foreground mt-3">
            规则速记：四舍六入五成双——舍弃位 &lt;5 舍、&gt;5 进；恰好为 5 时，5 后非零进一，5 后全零看 5 前一位（偶舍奇进）。
            负数先按绝对值修约再补符号（GB/T 8170 口径）。高亮行为 GB/T 8170 与普通四舍五入结果不同的行（两者均按十进制精确值计算）。
          </p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ListOrdered class="w-5 h-5 mr-2 text-primary" /> 修约口诀
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <p class="text-sm font-semibold text-foreground leading-relaxed">四舍六入五成双<br />五后非零就进一<br />五后全零看奇偶<br />五前为偶应舍去<br />五前为奇则进一</p>
          </div>
          <ul class="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li>· 1.005 → 2 位小数 → <span class="font-mono text-foreground">1.00</span>（5 后全零，5 前 0 为偶 → 舍）</li>
            <li>· 1.015 → 2 位小数 → <span class="font-mono text-foreground">1.02</span>（5 前 1 为奇 → 进）</li>
            <li>· 1.0051 → 2 位小数 → <span class="font-mono text-foreground">1.01</span>（5 后非零 → 进）</li>
            <li>· 2.5 → 整数 → <span class="font-mono text-foreground">2</span>；3.5 → <span class="font-mono text-foreground">4</span></li>
          </ul>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Binary class="w-5 h-5 mr-2 text-primary" /> 1.005 陷阱：浮点 vs 十进制
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5 text-xs font-mono text-muted-foreground">
            <p>(1.005).toFixed(2) → "1.00" <span class="text-amber-600 dark:text-amber-400">碰巧对</span></p>
            <p>(1.015).toFixed(2) → "1.01" <span class="text-red-500">错，应 1.02</span></p>
            <p>(2.675).toFixed(2) → "2.67" <span class="text-red-500">错，应 2.68</span></p>
            <p>Math.round(0.15*10)/10 → 0.1 <span class="text-red-500">错，应 0.2</span></p>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            根因：IEEE 754 双精度用二进制存数，1.015、2.675 这类十进制小数存的是近似值（1.015 实际是
            1.01499999999999990…），toFixed / 先乘后除作用在近似值上就会修错。
            本工具把输入当十进制字符串解析、用 BigInt 做定点整数运算，修约判断逐位精确。
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Scale class="w-5 h-5 mr-2 text-primary" /> 修约间隔怎么用
          </h2>
          <p class="text-xs leading-relaxed text-muted-foreground">
            修约间隔 0.5（1/2 单位）：把值除以 0.5，按整数口诀修约，再乘回 0.5——
            2.3 ÷ 0.5 = 4.6 → 5 → <span class="font-mono text-foreground">2.5</span>；
            2.25 ÷ 0.5 = 4.5（恰好半）→ 取偶 4 → <span class="font-mono text-foreground">2.0</span>。
            0.05、0.005 同理（1/20、1/200 单位），整数即间隔 1。检测报告的「按 0.5 分度报出」、
            计价最小单位 0.01、包装规格 2.5 kg 一档，都是修约间隔的实际用法。
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>GB/T 8170 数值修约是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          GB/T 8170-2008《数值修约规则与极限数值的表示和判定》规定了我国科技与生产领域统一的数值修约方法，
          核心口诀是「四舍六入五成双」：拟舍弃位小于 5 时舍去，大于 5 时进一；恰好等于 5 时不能机械地「逢五进一」，
          而要看 5 之后还有没有非零数字（有则进一）、5 之后全零时看 5 前一位的奇偶（偶舍奇进）。
          这样修约能让「进一」与「舍去」在大量数据中各占一半，避免系统性偏大或偏小（统计上无偏）。
          本工具按该规则实现保留 n 位有效数字、保留 n 位小数与修约间隔三种模式，并提供普通四舍五入对照列，
          规则不同的行高亮提示。全部计算在浏览器本地完成，数据不上传。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">四舍六入五成双：规则逐条拆解</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          记拟舍弃部分的第一个数字为判断起点：① 舍弃位 1~4 → 舍（1.234 → 1.23）；② 舍弃位 6~9 → 进（1.236 → 1.24）；
          ③ 舍弃位为 5 且后面还有非零数字 → 进（1.2351 → 1.24，真实值比一半多）；
          ④ 舍弃位为 5 且后面全零（或没有数字）→ 看 5 前一位：偶数则舍、奇数则进（1.225 → 1.22，1.235 → 1.24）。
          负数按绝对值修约后再补负号（−1.25 → −1.2）。0 不参与修约判断，保留几位小数就写几个 0。
          特别注意：判断必须基于十进制精确值——在二进制浮点上做这些判断，5 可能早已变成 4.9999…，
          这正是 1.005 → 1.00、1.015 → 1.02 这类经典案例的考点，也是本工具用 BigInt 定点实现的原因。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">与银行家舍入（Banker's Rounding）的关系</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          「五成双」在数学上等价于 round half to even（半数取偶），即通常说的银行家舍入——
          恰好一半时向偶数修约，其余按四舍五入。GB/T 8170 与理想银行家舍入的一致点：恰好 5 后全零时取偶；
          不同点在于 GB/T 8170 明确写出「五后非零进一」（本质是大于一半，任何正确实现都会进一），
          并额外规定了修约间隔（0.5、0.05、0.005 单位）与报出位数的表达方式。
          实务中更常见的偏差来自实现层面：不少语言的 round(x+0.5) 或 toFixed 作用在二进制浮点上，
          而 Java BigDecimal 的 HALF_EVEN、Python decimal 的 ROUND_HALF_EVEN 这类十进制定点实现与本工具口径一致。
          判断一条流水线是否「真·银行家舍入」：看它对 1.015（保留 2 位）给不给 1.02。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">有效数字、小数位与修约间隔怎么选</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          保留 n 位有效数字关心「相对精度」，适合测量值与科学计数：1.2345e-7 保留 3 位有效 → 1.23e-7（即 0.000000123），
          且修约后尾部的 0 也是有效数字（1.2 保留 3 位有效要写 1.20）。保留 n 位小数关心「绝对精度」，适合报出值与账面数字：
          1.005 保留 2 位小数 → 1.00。修约间隔是「按固定步长取最近档位」：间隔 0.5 表示结果只能是 0.5 的整数倍
          （2.3 → 2.5、2.25 → 2.0）。三种模式可互相印证：间隔 0.05 与保留 2 位小数档位相同，
          但对恰好压线的数（如 1.225 ÷ 0.05 = 24.5 恰半取偶 → 1.20）间隔法先除后取偶，判断路径更直观。
          写报告时按行业标准要求的模式选用即可。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">1.005 保留两位小数到底是 1.00 还是 1.01？</h3>
            <p class="text-sm text-muted-foreground mt-1">按 GB/T 8170 十进制精确值是 1.00：舍弃部分恰为 5（5 后全零），5 前一位是 0（偶数）→ 舍。普通四舍五入给 1.01。注意 (1.005).toFixed(2) 给 "1.00" 是「碰巧对」——二进制里 1.005 是 1.00499…；换 1.015 就翻车成 1.01（正确 1.02）。判断实现是否正确要看十进制精确值。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">修约间隔 0.5 是什么意思？</h3>
            <p class="text-sm text-muted-foreground mt-1">结果只能落在 0.5 的整数倍上（…1.5、2.0、2.5…）：把原值除以 0.5 按整数口诀修约再乘回。2.3 → 2.5（4.6 进到 5），2.25 → 2.0（4.5 恰半取偶 4）。GB/T 8170 称之为「0.5 单位修约」，0.05、0.005 是同法的 1/20、1/200 单位修约。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">修约后的 0 什么时候不能省？</h3>
            <p class="text-sm text-muted-foreground mt-1">有效数字模式下尾部 0 是精度的声明：1.234 保留 3 位有效是 1.23，但 1.2 保留 3 位有效必须写 1.20；小数位模式同理：1.005 保留 2 位小数写 1.00 而不是 1。这些 0 表示修约所到的位，本工具的「保留标注」列会写明位数。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">批量数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有修约都在你的浏览器本地完成（BigInt 十进制定点运算），不发送任何网络请求，输入与设置仅保存在本地 localStorage。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'significant-figure-rounder'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Hash, Info, AlertTriangle, ChevronUp, ChevronDown,
  Copy, CheckCircle, Play, RefreshCw, ListOrdered, Binary, Scale
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// ---------------------------------------------------------------------------
// GB/T 8170-2008 四舍六入五成双 —— 十进制字符串 + BigInt 定点实现。
// 头号技术要点：严禁经二进制浮点（toFixed / round 会因 1.005 = 1.00499… 翻车）。
// 内部表示：value = sign × N × 10^(−s)，N 为非负 BigInt（无前导零），s 为整数（可为负，
// 负值表示整数尾部还有 −s 个零）。修约一律对 |N| 进行，符号最后补回（GB/T 8170 负数口径）。
// ---------------------------------------------------------------------------

// 解析十进制数字符串：支持 +/-、小数点、科学计数法（1.2345e-7）、千分位逗号与空白。失败返回 null
function parseDecimal(input) {
  if (typeof input !== 'string') return null
  const t = input.trim().replace(/[,\s_]/g, '')
  if (t === '') return null
  const m = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(t)
  if (!m) return null
  const sign = m[1] === '-' ? -1 : 1
  const ip = m[2] || ''
  const fp = m[3] || ''
  if (ip === '' && fp === '') return null
  let N = BigInt((ip + fp).replace(/^0+(?=\d)/, ''))
  let s = fp.length - (m[4] ? parseInt(m[4], 10) : 0)
  if (s < 0) {
    N *= 10n ** BigInt(-s)
    s = 0
  }
  if (N === 0n) return { sign: 1, N: 0n, s: Math.max(s, 0) }
  return { sign, N, s }
}

// 修约间隔字符串 → { I, si }：interval = I × 10^(−si)，I 为正 BigInt。非法/非正返回 null
function parseInterval(str) {
  const p = parseDecimal(str)
  if (!p || p.sign < 0 || p.N === 0n) return null
  return { I: p.N, si: p.s }
}

// 核心：T = q·D + r 修约到 D 的整数倍（T、D 均为正 BigInt）。
// halfEven=true（GB/T 8170）：恰好一半取偶；false（普通四舍五入）：恰好一半进一。
// r·2 与 D 的比较覆盖全部 GB 口径：r·2>D 即「>5 或 5 后非零」→ 进；r·2<D 即「<5」→ 舍；
// r·2===D 即「恰为一半（5 后全零）」→ 看 q 奇偶（偶舍奇进）。
function roundQuotient(T, D, halfEven) {
  const q = T / D
  const r = T % D
  if (r === 0n) return q
  const r2 = r * 2n
  if (r2 > D) return q + 1n
  if (r2 < D) return q
  if (!halfEven) return q + 1n
  return q % 2n === 0n ? q : q + 1n
}

// 模式一：保留 n 位小数 → 结果定点在 s=n（尾部 0 保留，1.005→"1.00"）
function roundToDecimals(sign, N, s, n, halfEven) {
  if (N === 0n) return { sign: 1, N: 0n, s: n }
  if (s <= n) return { sign, N: N * 10n ** BigInt(n - s), s: n }
  const q = roundQuotient(N, 10n ** BigInt(s - n), halfEven)
  return { sign, N: q, s: n }
}

// 模式二：保留 n 位有效数字 → 结果有效位数 = n（N 的十进制位数即有效位数）
function roundToSigFigs(sign, N, s, n, halfEven) {
  if (N === 0n) return { sign: 1, N: 0n, s: 0 }
  const L = String(N).length
  if (L <= n) return { sign, N, s }
  const q = roundQuotient(N, 10n ** BigInt(L - n), halfEven)
  return { sign, N: q, s: s - (L - n) }
}

// 模式三：修约到 interval = I×10^(−si) 的整数倍（全整数运算）
function roundToInterval(sign, N, s, I, si, halfEven) {
  if (N === 0n) return { sign: 1, N: 0n, s: si }
  // value / interval = (N×10^si) / (I×10^s)
  const q = roundQuotient(N * 10n ** BigInt(si), I * 10n ** BigInt(s), halfEven)
  return { sign, N: q * I, s: si }
}

// 统一入口：p = { sign, N, s }，mode: 'sig'|'dec'|'interval'，param = n 或 { I, si }
function roundByMode(p, mode, param, halfEven) {
  if (mode === 'sig') return roundToSigFigs(p.sign, p.N, p.s, param, halfEven)
  if (mode === 'dec') return roundToDecimals(p.sign, p.N, p.s, param, halfEven)
  return roundToInterval(p.sign, p.N, p.s, param.I, param.si, halfEven)
}

// 定点十进制显示：minSig = 最少有效位数（有效数字模式传 n，保证 12.50 / 0.00120 的尾部 0）
function formatPlain(sign, N, s, minSig = 0) {
  let digits = N === 0n ? '0' : String(N)
  if (N !== 0n && minSig > 0 && digits.length < minSig) {
    const pad = minSig - digits.length
    digits += '0'.repeat(pad)
    s += pad
  }
  let body
  if (s <= 0) {
    body = digits + '0'.repeat(-s)
  } else if (digits.length <= s) {
    body = '0.' + '0'.repeat(s - digits.length) + digits
  } else {
    body = digits.slice(0, digits.length - s) + '.' + digits.slice(digits.length - s)
  }
  return (sign < 0 && N !== 0n ? '-' : '') + body
}

// 科学计数法显示（1.23e-7 风格）：minSig 控制尾数位数
function formatScientific(sign, N, s, minSig = 0) {
  if (N === 0n) return '0'
  let digits = String(N)
  if (minSig > 0 && digits.length < minSig) {
    const pad = minSig - digits.length
    digits += '0'.repeat(pad)
    s += pad
  }
  const exp = digits.length - 1 - s
  let decPart = digits.length > 1 ? digits.slice(1) : (minSig > 1 ? '0'.repeat(minSig - 1) : '')
  if (minSig > 0 && decPart.length > minSig - 1) decPart = decPart.slice(0, minSig - 1)
  const mant = digits[0] + (decPart ? '.' + decPart : '')
  return (sign < 0 ? '-' : '') + mant + 'e' + (exp < 0 ? '-' : '') + Math.abs(exp)
}

// 值的十进制指数（用于判断是否双显科学计数法）
function decimalExponent(N, s) {
  if (N === 0n) return 0
  return String(N).length - 1 - s
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '有效数字修约 - GB/T 8170四舍六入五成双在线计算（支持修约间隔）',
  description: '在线有效数字修约工具：GB/T 8170-2008四舍六入五成双规则，保留n位有效数字/n位小数/修约间隔(0.5/0.05/0.005/自定义)，单值与批量多行，普通四舍五入差异对照高亮，科学计数法1.23e-7双显，BigInt十进制定点实现避免1.005浮点陷阱，纯浏览器本地运行。',
  keywords: '有效数字修约,四舍六入五成双,gbt8170,数值修约规则,修约间隔计算,保留两位小数,银行家舍入',
  author: '有条工具',
  ogTitle: '有效数字修约 - GB/T 8170四舍六入五成双在线计算 | 有条工具',
  ogDescription: '保留 n 位有效数字/小数/修约间隔三种模式，普通四舍五入差异对照，BigInt 十进制定点不踩 1.005 陷阱。',
  ogUrl: 'https://www.util.cn/tools/significant-figure-rounder',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '有效数字修约',
  twitterDescription: 'GB/T 8170 四舍六入五成双，支持修约间隔与批量修约，与普通四舍五入差异对照。'
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
          name: '有效数字修约',
          url: 'https://www.util.cn/tools/significant-figure-rounder',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'GB/T 8170-2008 四舍六入五成双规则修约',
            '保留 n 位有效数字 / n 位小数 / 修约间隔（0.5、0.05、0.005、整数、自定义正数）',
            '单值与批量多行处理，支持 1.2345e-7 科学计数法输入',
            '普通四舍五入对照列，规则不同行高亮',
            '科学计数法 1.23e-7 风格切换与双显',
            'BigInt 十进制定点实现，1.005→1.00、1.015→1.02 逐位精确',
            '结果表一键复制，本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '有效数字修约', item: 'https://www.util.cn/tools/significant-figure-rounder' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1.005 保留两位小数到底是 1.00 还是 1.01？',
              acceptedAnswer: { '@type': 'Answer', text: '按 GB/T 8170 十进制精确值是 1.00：舍弃部分恰为 5（5 后全零），5 前一位是 0（偶数）→ 舍。普通四舍五入给 1.01。注意 toFixed(2) 给 1.00 是碰巧（二进制里 1.005=1.00499…），1.015 同法就翻车成 1.01（正确 1.02）。' }
            },
            {
              '@type': 'Question',
              name: '修约间隔 0.5 是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '结果只能落在 0.5 的整数倍上：把原值除以 0.5 按整数口诀修约再乘回。2.3÷0.5=4.6→5→2.5；2.25÷0.5=4.5 恰半取偶→4→2.0。0.05、0.005 是同法的 1/20、1/200 单位修约。' }
            },
            {
              '@type': 'Question',
              name: '修约后的 0 什么时候不能省？',
              acceptedAnswer: { '@type': 'Answer', text: '有效数字模式下尾部 0 是精度声明：1.2 保留 3 位有效必须写 1.20；小数位模式下 1.005 保留 2 位小数写 1.00 而不是 1。这些 0 表示修约所到的位。' }
            },
            {
              '@type': 'Question',
              name: '批量数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有修约都在浏览器本地完成（BigInt 十进制定点运算），不发送任何网络请求，输入与设置仅保存在本地 localStorage。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'significant-figure-rounder'
const SETTINGS_KEY = `${TOOL_ID}-settings`

const MODES = [
  { id: 'sig', label: '保留 n 位有效数字' },
  { id: 'dec', label: '保留 n 位小数' },
  { id: 'interval', label: '修约间隔' }
]
const INTERVAL_PRESETS = ['0.5', '0.05', '0.005', '1']
const EXAMPLE_LINES = ['1.005', '1.015', '0.15', '0.25', '2.5', '3.5', '-1.25', '2.3', '2.25', '1.2345e-7']

// ---------- 状态 ----------
const mode = ref('dec')
const sigN = ref(3)
const decN = ref(2)
const intervalText = ref('0.5')
const sciDisplay = ref(false)
const rowsText = ref(EXAMPLE_LINES.join('\n'))
const copyStatus = ref('idle')
const seoContentVisible = ref(true)

// ---------- 参数规整 ----------
const sigNClamped = computed(() => {
  const n = Math.floor(Number(sigN.value))
  return Number.isFinite(n) ? Math.min(12, Math.max(1, n)) : 3
})
const decNClamped = computed(() => {
  const n = Math.floor(Number(decN.value))
  return Number.isFinite(n) ? Math.min(10, Math.max(0, n)) : 2
})
const intervalParsed = computed(() => parseInterval(intervalText.value))

const modeParam = computed(() => {
  if (mode.value === 'sig') return sigNClamped.value
  if (mode.value === 'dec') return decNClamped.value
  return intervalParsed.value
})
const paramInvalid = computed(() => mode.value === 'interval' && intervalParsed.value === null)

const keepLabel = computed(() => {
  if (mode.value === 'sig') return `${sigNClamped.value} 位有效数字`
  if (mode.value === 'dec') return `${decNClamped.value} 位小数`
  return `间隔 ${intervalText.value.trim() || '—'}`
})

// ---------- 结果行 ----------
const rows = computed(() => {
  if (paramInvalid.value) return []
  const param = modeParam.value
  const minSig = mode.value === 'sig' ? param : 0
  const out = []
  const lines = rowsText.value.split(/\r?\n/)
  for (const raw of lines) {
    const trimmed = raw.trim()
    if (trimmed === '') continue
    const p = parseDecimal(trimmed)
    if (!p) {
      out.push({ raw: trimmed, ok: false, differs: false })
      continue
    }
    // roundQuotient 口径：halfEven=true 为 GB/T 8170 五成双，false 为普通四舍五入（半数进一）
    const gb = roundByMode(p, mode.value, param, true)
    const normal = roundByMode(p, mode.value, param, false)
    const gbPlain = formatPlain(gb.sign, gb.N, gb.s, minSig)
    const gbSci = formatScientific(gb.sign, gb.N, gb.s, minSig)
    const normalPlain = formatPlain(normal.sign, normal.N, normal.s, minSig)
    const exp = decimalExponent(gb.N, gb.s)
    const expOutside = exp <= -4 || exp >= 7
    let primary = sciDisplay.value ? gbSci : gbPlain
    let secondary = sciDisplay.value ? gbPlain : gbSci
    if (secondary === primary || (gb.N === 0n)) secondary = ''
    else if (!sciDisplay.value && !expOutside) secondary = ''
    out.push({
      raw: trimmed,
      ok: true,
      primary,
      secondary,
      normal: normalPlain,
      label: keepLabel.value,
      differs: gbPlain !== normalPlain
    })
  }
  return out
})

function loadExample() {
  rowsText.value = EXAMPLE_LINES.join('\n')
  trackEvent('工具结果', '载入示例', TOOL_ID)
}
function clearInput() {
  rowsText.value = ''
}

// ---------- 复制结果表（clipboard + 状态条，浏览器 API 仅在回调中） ----------
function buildTableTsv() {
  const header = ['原值', '修约值(GB/T 8170)', '保留标注', '普通四舍五入', '差异'].join('\t')
  const lines = rows.value.map((r) => {
    if (!r.ok) return [r.raw, '无法识别', '', '', ''].join('\t')
    return [r.raw, r.primary, r.label, r.normal, r.differs ? '规则不同' : '一致'].join('\t')
  })
  return [header, ...lines].join('\n')
}
let copyTimer = null
async function copyTable() {
  const text = buildTableTsv()
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copyStatus.value = 'ok'
    trackEvent('工具结果', '复制', TOOL_ID)
  } catch (err) {
    copyStatus.value = 'fail'
    alert('复制失败：浏览器未授权剪贴板，请手动选择表格复制。')
  }
  if (copyTimer !== null) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copyStatus.value = 'idle'; copyTimer = null }, 1600)
}

// ---------- SEO 折叠 ----------
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 设置持久化（localStorage 仅 onMounted / 用户交互回调触达，SSR 安全） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (MODES.some((m) => m.id === s.mode)) mode.value = s.mode
    if (Number.isFinite(s.sigN)) sigN.value = Math.min(12, Math.max(1, Math.floor(s.sigN)))
    if (Number.isFinite(s.decN)) decN.value = Math.min(10, Math.max(0, Math.floor(s.decN)))
    if (typeof s.intervalText === 'string') intervalText.value = s.intervalText
    if (s.sciDisplay === true || s.sciDisplay === false) sciDisplay.value = s.sciDisplay
    if (typeof s.rowsText === 'string') rowsText.value = s.rowsText
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([mode, sigN, decN, intervalText, sciDisplay, rowsText], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      mode: mode.value,
      sigN: sigN.value,
      decN: decN.value,
      intervalText: intervalText.value,
      sciDisplay: sciDisplay.value,
      rowsText: rowsText.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})
</script>
