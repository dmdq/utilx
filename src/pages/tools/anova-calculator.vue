<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BarChart2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">方差分析计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">单因素 ANOVA：SS 分解 / F 检验 / η² 效应量 / 完整方差分析表，附两两比较（合并 t + Bonferroni 校正）</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线方差分析计算器：粘贴多组数据（组间空行分隔，或用「组名:」前缀）做单因素 ANOVA，
        输出各组 n / 均值 / 方差 / 标准差对照表、完整方差分析表（SS组间 = Σnᵢ(x̄ᵢ−x̄)²、SS组内 = ΣΣ(xᵢⱼ−x̄ᵢ)²、
        df1 = k−1、df2 = N−k、MS、F = MS组间/MS组内）、p 值（F 分布 CDF 基于不完全贝塔 I_x(d1/2, d2/2)，双精度）
        与 η² = SS组间/SS总 效应量，附显著性徽章与两两比较
        （合并 MS组内 的 t 检验 + Bonferroni 校正 p×比较数，并注明非 Tukey HSD）。
        组间 [23,25,28,24,27] / [30,32,29,31,33] / [25,27,26,28,24] 等锚点精确复现（F=15.2473，p=0.000507）。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          <span class="font-semibold">ANOVA 显著只说「至少有两组不同」</span>：它不告诉你是哪两组、
          也不意味着所有组都两两不同——结论要靠下面的两两比较；而比较做了多次，必须校正多重性（Bonferroni），
          否则假阳性会滚雪球。
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主交互区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 数据输入 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="av-data" class="block text-sm font-medium text-foreground">多组数据（组间用空行分隔，或每行「组名:」前缀）</label>
              <button type="button" @click="loadExample" class="px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition">载入三组示例</button>
            </div>
            <textarea id="av-data" v-model="dataText" rows="7" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="A: 23 25 28 24 27&#10;B: 30 32 29 31 33&#10;C: 25 27 26 28 24"></textarea>
            <p class="text-[11px] text-muted-foreground mt-1.5">
              组内数据用逗号 / 空格 / 换行分隔均可；「组名:」行开启新组（名称可中文），空行也会分隔新组（自动命名 组1、组2…）。每组至少 2 个数据。
            </p>
          </div>

          <div v-if="anovaResult" class="space-y-3">
            <!-- 组对照表 -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm min-w-[460px]">
                <thead>
                  <tr class="text-left text-xs text-muted-foreground border-b border-border">
                    <th class="py-2 pr-3 font-medium">组</th>
                    <th class="py-2 pr-3 font-medium">n</th>
                    <th class="py-2 pr-3 font-medium">均值</th>
                    <th class="py-2 pr-3 font-medium">方差 s²</th>
                    <th class="py-2 font-medium">标准差 s</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(g, i) in groupsParsed" :key="i" class="border-b border-border/50">
                    <td class="py-2 pr-3 text-foreground">{{ g.name }}</td>
                    <td class="py-2 pr-3 font-mono text-muted-foreground">{{ g.values.length }}</td>
                    <td class="py-2 pr-3 font-mono text-foreground">{{ fmtNum(anovaResult.means[i], 4) }}</td>
                    <td class="py-2 pr-3 font-mono text-foreground">{{ fmtNum(anovaResult.vars[i], 4) }}</td>
                    <td class="py-2 font-mono text-foreground">{{ fmtNum(Math.sqrt(anovaResult.vars[i]), 4) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 主结果卡 -->
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-sm text-muted-foreground">单因素方差分析（k = {{ anovaResult.k }} 组，N = {{ anovaResult.N }}）</p>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="sigBadge(anovaResult.p).cls">{{ sigBadge(anovaResult.p).text }}</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                <div>
                  <p class="text-xs text-muted-foreground">F 统计量</p>
                  <p class="text-2xl font-bold font-mono text-primary">{{ fmtNum(anovaResult.f, 4) }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">df (组间, 组内)</p>
                  <p class="text-2xl font-bold font-mono text-foreground">{{ anovaResult.df1 }}, {{ anovaResult.df2 }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">p 值</p>
                  <p class="text-2xl font-bold font-mono text-foreground">{{ fmtP(anovaResult.p) }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">效应量 η²</p>
                  <p class="text-2xl font-bold font-mono text-foreground">{{ fmtNum(anovaResult.eta2, 4) }}</p>
                </div>
              </div>
              <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
                {{ anovaResult.p < 0.05
                  ? `p < 0.05：拒绝「各组均值相等」的原假设，至少有两组存在显著差异；具体是哪两组见下方两两比较。`
                  : `p ≥ 0.05：不能拒绝「各组均值相等」的原假设；当前证据不足以说明组间有差异（不等于证明了相等）。` }}
                η² = {{ fmtNum(anovaResult.eta2, 4) }}，即组间差异解释了总变异的 {{ (anovaResult.eta2 * 100).toFixed(1) }}%（0.01 小 / 0.06 中 / 0.14 大，Cohen 惯例）。
              </p>
            </div>

            <!-- ANOVA 表 -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm min-w-[520px]">
                <thead>
                  <tr class="text-left text-xs text-muted-foreground border-b border-border">
                    <th class="py-2 pr-3 font-medium">来源</th>
                    <th class="py-2 pr-3 font-medium">SS</th>
                    <th class="py-2 pr-3 font-medium">df</th>
                    <th class="py-2 pr-3 font-medium">MS</th>
                    <th class="py-2 pr-3 font-medium">F</th>
                    <th class="py-2 font-medium">p</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-border/50">
                    <td class="py-2 pr-3 text-foreground">组间（因素）</td>
                    <td class="py-2 pr-3 font-mono text-foreground">{{ fmtNum(anovaResult.ssb, 4) }}</td>
                    <td class="py-2 pr-3 font-mono text-muted-foreground">{{ anovaResult.df1 }}</td>
                    <td class="py-2 pr-3 font-mono text-foreground">{{ fmtNum(anovaResult.msb, 4) }}</td>
                    <td class="py-2 pr-3 font-mono font-semibold text-primary">{{ fmtNum(anovaResult.f, 4) }}</td>
                    <td class="py-2 font-mono text-foreground">{{ fmtP(anovaResult.p) }}</td>
                  </tr>
                  <tr class="border-b border-border/50">
                    <td class="py-2 pr-3 text-foreground">组内（误差）</td>
                    <td class="py-2 pr-3 font-mono text-foreground">{{ fmtNum(anovaResult.ssw, 4) }}</td>
                    <td class="py-2 pr-3 font-mono text-muted-foreground">{{ anovaResult.df2 }}</td>
                    <td class="py-2 pr-3 font-mono text-foreground">{{ fmtNum(anovaResult.msw, 4) }}</td>
                    <td class="py-2 pr-3 font-mono text-muted-foreground">—</td>
                    <td class="py-2 font-mono text-muted-foreground">—</td>
                  </tr>
                  <tr class="border-b border-border/50 bg-muted/30">
                    <td class="py-2 pr-3 text-foreground">总计</td>
                    <td class="py-2 pr-3 font-mono text-foreground">{{ fmtNum(anovaResult.sst, 4) }}</td>
                    <td class="py-2 pr-3 font-mono text-muted-foreground">{{ anovaResult.N - 1 }}</td>
                    <td class="py-2 pr-3 font-mono text-muted-foreground">—</td>
                    <td class="py-2 pr-3 font-mono text-muted-foreground">—</td>
                    <td class="py-2 font-mono text-muted-foreground">—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 两两比较 -->
            <div v-if="anovaResult.pairs.length" class="border-t border-border pt-4">
              <h3 class="text-base font-semibold text-foreground mb-1">两两比较（合并 MS组内 的 t 检验 + Bonferroni 校正）</h3>
              <p class="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                注：此处为「两两 t 检验（方差用 ANOVA 的 MS组内 合并估计，df = {{ anovaResult.df2 }}）+ Bonferroni 校正（p 值 × 比较数 m = {{ anovaResult.nCompare }}，置信水平按 α/m 收缩）」，
                <span class="font-semibold">不是 Tukey HSD</span>——Tukey 需要学生化极差分布，本页未实现；
                Bonferroni 结果通常比 Tukey 略保守，但原理透明、任何 k 都适用。
              </p>
              <div class="overflow-x-auto">
                <table class="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr class="text-left text-xs text-muted-foreground border-b border-border">
                      <th class="py-2 pr-3 font-medium">比较</th>
                      <th class="py-2 pr-3 font-medium">均值差</th>
                      <th class="py-2 pr-3 font-medium">t</th>
                      <th class="py-2 pr-3 font-medium">校正后 p</th>
                      <th class="py-2 font-medium">95% CI（Bonferroni）</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(pr, i) in anovaResult.pairs" :key="i" class="border-b border-border/50">
                      <td class="py-2 pr-3 text-foreground">{{ groupsParsed[pr.i].name }} − {{ groupsParsed[pr.j].name }}</td>
                      <td class="py-2 pr-3 font-mono text-foreground">{{ fmtNum(pr.diff, 4) }}</td>
                      <td class="py-2 pr-3 font-mono text-foreground">{{ fmtNum(pr.t, 4) }}</td>
                      <td class="py-2 pr-3 font-mono" :class="pr.pAdj < 0.05 ? 'text-green-600 font-semibold' : 'text-muted-foreground'">{{ fmtP(pr.pAdj) }}</td>
                      <td class="py-2 font-mono text-muted-foreground">[ {{ fmtNum(pr.ciLo, 3) }}, {{ fmtNum(pr.ciHi, 3) }} ]</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <button
              type="button"
              @click="copyResult"
              class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制 ANOVA 结果
            </button>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">{{ anovaError }}</p>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 为什么用 ANOVA 而不是多次 t 检验
          </h2>
          <p class="text-xs leading-relaxed text-muted-foreground">
            3 组均值两两比较要做 3 次 t 检验，每次 5% 的假阳性率会让「至少一次误报」的概率升到约 14%
            （1−0.95³）；5 组要 10 次比较，整体假阳性率超过 40%。ANOVA 把检验合并成一次 F 检验，
            在「各组均值全相等」的原假设下把整体第一类错误率控制在 α；显著之后才进入校正后的两两比较定位差异。
            另外 F 检验用 MS组内 合并所有组的方差估计（df = N−k），比两两 t 检验各用各的方差更稳。
          </p>
          <div class="bg-muted/50 rounded-lg p-3 border border-border text-xs leading-relaxed">
            <p class="font-mono text-foreground font-semibold">F = MS组间 / MS组内</p>
            <p class="text-muted-foreground mt-1">组间方差远大于组内方差 → F 大 → p 小 → 组间确有差异。k=2 且两组等方差时，F = t²（与 Student t 检验完全等价）。</p>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> η² 与使用前提
          </h2>
          <p class="text-xs leading-relaxed text-muted-foreground">
            η² = SS组间/SS总 是「组别解释了总变异的比例」：0.01 小、0.06 中、0.14 大（Cohen 惯例）。
            ANOVA 的前提：各组观测独立、组内残差近似正态、各组方差接近（F 检验对方差不等有一定耐受性，
            组间样本量悬殊时更敏感）；严重违背时考虑 Welch ANOVA 或非参数 Kruskal-Wallis 检验。
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">相关工具</h2>
          <NuxtLink to="/tools/t-test-calculator" class="block p-3 rounded-lg border border-border bg-muted/40 hover:border-primary/40 transition text-sm">
            <span class="font-medium text-foreground">t 检验计算器 →</span>
            <p class="text-xs text-muted-foreground mt-1">只有两组时的均值比较（k=2 的 ANOVA 等价于 t²）</p>
          </NuxtLink>
          <NuxtLink to="/tools/chi-square-calculator" class="block p-3 rounded-lg border border-border bg-muted/40 hover:border-primary/40 transition text-sm">
            <span class="font-medium text-foreground">卡方检验计算器 →</span>
            <p class="text-xs text-muted-foreground mt-1">分类频数数据的多组比较</p>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12">
      <summary class="cursor-pointer text-xl font-bold text-foreground select-none"><span class="text-primary mr-2">#</span>ANOVA 公式、FAQ 与参考</summary>
      <div class="mt-4">
        <h2 class="text-2xl font-bold text-foreground mb-4">方差分析计算器说明</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          单因素方差分析（One-way ANOVA）检验「k 组均值是否全相等」：把总变异拆成组间 SS = Σnᵢ(x̄ᵢ−x̄)²
          与组内 SS = ΣΣ(xᵢⱼ−x̄ᵢ)²，F = (SS间/(k−1)) / (SS内/(N−k))。F 分布 CDF 基于正则化不完全贝塔
          I_x(d1/2, d2/2)（p 值取上尾 I_{d2/(d2+d1F)}(d2/2, d1/2)，保远尾精度）。η² = SS间/SS总 度量效应量。
          显著后用合并 MS组内 的两两 t 检验 + Bonferroni 校正（p × C(k,2)）定位差异，本页已注明其与 Tukey HSD 的关系。
          全部计算在浏览器本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">公式汇总</h3>
        <div class="bg-muted/50 rounded-lg p-4 border border-border space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p><span class="font-mono text-foreground font-semibold">组间</span>：SS间 = Σ nᵢ(x̄ᵢ − x̄)²，df1 = k−1，MS间 = SS间/df1</p>
          <p><span class="font-mono text-foreground font-semibold">组内</span>：SS内 = ΣΣ (xᵢⱼ − x̄ᵢ)²，df2 = N−k，MS内 = SS内/df2</p>
          <p><span class="font-mono text-foreground font-semibold">F 统计量</span>：F = MS间 / MS内；p = P(F_{df1,df2} ≥ F)（不完全贝塔上尾）</p>
          <p><span class="font-mono text-foreground font-semibold">效应量</span>：η² = SS间 / (SS间 + SS内)</p>
          <p><span class="font-mono text-foreground font-semibold">两两比较</span>：t = (x̄ᵢ−x̄ⱼ)/√(MS内(1/nᵢ+1/nⱼ))，p_adj = min(1, p_raw × m)，m = C(k,2)（Bonferroni，非 Tukey）</p>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">什么时候用 ANOVA 而不是多次 t 检验？</h3>
            <p class="text-sm text-muted-foreground mt-1">三组及以上一律先用 ANOVA：每多一次比较，整体假阳性率就膨胀一截（10 次比较不做校正时超过 40%）。ANOVA 一次性控制整体 α，方差估计也更稳。只有 k=2 时 t 检验与 ANOVA 完全等价（t² = F）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">ANOVA 显著后该用什么两两比较？</h3>
            <p class="text-sm text-muted-foreground mt-1">常用 Tukey HSD（基于学生化极差分布，本页未实现）、Bonferroni（本页实现：两两 t 检验 p 值乘以比较数）、Holm 逐步校正等。Bonferroni 在比较数很多时偏保守但永不过度乐观，任何组数都适用；需要 Tukey 可用 R 的 TukeyHSD()。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">各组方差不齐怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">看组对照表的方差列：方差比超过 4:1 且样本量不等时经典 F 检验的第一类错误会失真，可改用 Welch ANOVA（不假定等方差）或对数据做变换（取对数）。经典 F 对轻度不等方差有一定耐受性，尤其是各组 n 相近时。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">η² 和 R² 是一回事吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">本质相同：都是「组别/因素解释的变异占总变异的比例」，把组别变成虚拟变量做回归时 R² 恰好等于 η²。ANOVA 语境习惯叫 η²，回归语境叫 R²。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。分组解析、SS 分解、F 检验与两两比较全部在你的浏览器本地计算，不发送任何网络请求，输入数据不被存储或上传。</p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">参考来源</h3>
        <ul class="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>Fisher, R. A. (1925). Statistical Methods for Research Workers（方差分析起源）</li>
          <li>Bonferroni 校正与多重比较：Dunn, O. J. (1961). Multiple comparisons among means. JASA 56.</li>
          <li>η² 效应量惯例：Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences.</li>
          <li>F 分布 CDF 经正则化不完全贝塔（Lentz 连分式，Numerical Recipes §6.4）；R aov 口径验证</li>
        </ul>
      </div>
    </details>

    <RelatedTools :currentToolId="'anova-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { BarChart2, Info, AlertTriangle, CheckCircle, Copy } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// ---------- logGamma（Lanczos g=7）与不完全贝塔（Lentz 连分式） ----------
function logGamma(x) {
  const C = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ]
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  }
  const xx = x - 1
  let a = C[0]
  const t = xx + 7.5
  for (let i = 1; i < C.length; i++) a += C[i] / (xx + i)
  return 0.5 * Math.log(2 * Math.PI) + (xx + 0.5) * Math.log(t) - t + Math.log(a)
}

function betacf(a, b, x) {
  const MAXIT = 400
  const EPS = 3e-16
  const FPMIN = 1e-300
  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let c = 1
  let d = 1 - qab * x / qap
  if (Math.abs(d) < FPMIN) d = FPMIN
  d = 1 / d
  let h = d
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1 + aa / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    h *= d * c
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1 + aa / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < EPS) break
  }
  return h
}

function betainc(a, b, x) {
  if (!(a > 0) || !(b > 0) || !Number.isFinite(x)) return NaN
  if (x <= 0) return 0
  if (x >= 1) return 1
  const lnbt = logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  const bt = Math.exp(lnbt)
  if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a
  return 1 - bt * betacf(b, a, 1 - x) / b
}

// ---------- t 分布（基于不完全贝塔，两两比较用） ----------
function tPdf(t, df) {
  return Math.exp(logGamma((df + 1) / 2) - logGamma(df / 2)) /
    Math.sqrt(df * Math.PI) * Math.pow(1 + t * t / df, -(df + 1) / 2)
}

function tCdf(t, df) {
  if (!Number.isFinite(t) || !(df > 0)) return NaN
  const x = df / (df + t * t)
  const p = 0.5 * betainc(df / 2, 0.5, x)
  return t > 0 ? 1 - p : p
}

function tTwoSidedP(t, df) {
  if (!Number.isFinite(t) || !(df > 0)) return NaN
  return betainc(df / 2, 0.5, df / (df + t * t))
}

// t 分位数：二分定界 + 牛顿精化，df ≥ 1e4 时退回正态近似
function tQuantile(p, df) {
  if (!Number.isFinite(p) || p <= 0 || p >= 1 || !(df > 0)) return NaN
  if (df >= 1e4) {
    // 正态回退：对 normSf 二分 + 牛顿
    const tail = 1 - p
    let lo = 0
    let hi = 2
    while (normSf(hi) > tail && hi < 45) hi *= 2
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2
      if (normSf(mid) > tail) lo = mid
      else hi = mid
      if (hi - lo < 1e-13) break
    }
    let x = (lo + hi) / 2
    for (let i = 0; i < 3; i++) {
      const e = normSf(x) - tail
      const d = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)
      if (d > 0) x -= e / d
    }
    return x
  }
  let lo = -1
  let hi = 1
  let guard = 0
  while (tCdf(lo, df) > p && guard++ < 200) lo *= 2
  guard = 0
  while (tCdf(hi, df) < p && guard++ < 200) hi *= 2
  for (let i = 0; i < 200 && hi - lo > 1e-13 * (1 + Math.abs(lo) + Math.abs(hi)); i++) {
    const mid = (lo + hi) / 2
    if (tCdf(mid, df) < p) lo = mid
    else hi = mid
  }
  let x = (lo + hi) / 2
  for (let i = 0; i < 40; i++) {
    const fx = tCdf(x, df) - p
    const dx = tPdf(x, df)
    if (!(dx > 0) || !Number.isFinite(dx)) break
    const nx = x - fx / dx
    if (!Number.isFinite(nx) || nx <= lo || nx >= hi) break
    if (Math.abs(nx - x) < 1e-15 * (1 + Math.abs(x))) { x = nx; break }
    x = nx
  }
  return x
}

// erf 级数（normSf 大 df 回退用）
function normSf(x) {
  if (!Number.isFinite(x)) return x > 0 ? 0 : (x < 0 ? 1 : 0.5)
  if (x < 0) return 1 - normSf(-x)
  const t = x / Math.SQRT2
  if (t < 2.6) {
    const t2 = t * t
    let term = t
    let sum = t
    for (let n = 1; n < 300; n++) {
      term *= -t2 * (2 * n - 1) / (n * (2 * n + 1))
      sum += term
      if (Math.abs(term) < 1e-19 * (Math.abs(sum) + 1)) break
    }
    return 0.5 * (1 - sum * 1.1283791670955126)
  }
  let f = 0
  for (let n = 300; n >= 1; n--) {
    f = (n / 2) / (t + f)
  }
  return 0.5 * (Math.exp(-t * t) / Math.sqrt(Math.PI)) / (t + f)
}

// ---------- 基础统计与分组解析 ----------
function parseNums(text) {
  if (typeof text !== 'string') return []
  return text.split(/[\s,;，；、]+/).map(s => s.trim()).filter(s => s.length > 0)
    .map(Number).filter(Number.isFinite)
}

function parseGroups(text) {
  if (typeof text !== 'string') return []
  const groups = []
  let current = null
  const flush = () => {
    if (current && current.values.length > 0) groups.push(current)
    current = null
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) { flush(); continue }
    const m = line.match(/^([^\d:：\s][^:：]{0,20}?)[:：]\s*(.*)$/)
    if (m) {
      flush()
      current = { name: m[1].trim(), values: parseNums(m[2]) }
    } else {
      if (!current) current = { name: '', values: [] }
      current.values.push(...parseNums(line))
    }
  }
  flush()
  return groups.map((g, i) => ({ name: g.name || ('组' + (i + 1)), values: g.values }))
}

function meanOf(xs) {
  if (!Array.isArray(xs) || xs.length === 0) return NaN
  let s = 0
  for (const v of xs) s += v
  return s / xs.length
}

function varOf(xs) {
  const n = xs.length
  if (!(n > 1)) return NaN
  const m = meanOf(xs)
  let ss = 0
  for (const v of xs) ss += (v - m) * (v - m)
  return ss / (n - 1)
}

// ---------- 单因素 ANOVA ----------
function oneWayAnova(groups) {
  const k = groups.length
  if (!(k >= 2)) return null
  const ns = groups.map(g => g.length)
  if (ns.some(n => n < 2)) return null
  const means = groups.map(meanOf)
  const vars = groups.map(varOf)
  const N = ns.reduce((s, v) => s + v, 0)
  const all = []
  for (const g of groups) for (const v of g) all.push(v)
  const grand = meanOf(all)
  let ssb = 0
  let ssw = 0
  for (let i = 0; i < k; i++) {
    ssb += ns[i] * (means[i] - grand) * (means[i] - grand)
    for (const v of groups[i]) ssw += (v - means[i]) * (v - means[i])
  }
  const df1 = k - 1
  const df2 = N - k
  if (!(df2 > 0)) return null
  const msb = ssb / df1
  const msw = ssw / df2
  // 组内方差为 0 的退化情形（组内全同值）
  let f
  let p
  if (msw <= 0) {
    f = ssb > 0 ? Infinity : 0
    p = ssb > 0 ? 0 : 1
  } else {
    f = msb / msw
    p = fSf(f, df1, df2)
  }
  const sst = ssb + ssw
  const eta2 = sst > 0 ? ssb / sst : 0
  // 两两比较：合并 MS组内 的 t 检验 + Bonferroni 校正（p×比较数，非 Tukey）
  const m = k * (k - 1) / 2
  const pairs = []
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const se = Math.sqrt(msw * (1 / ns[i] + 1 / ns[j]))
      if (!(se > 0)) continue
      const tv = (means[i] - means[j]) / se
      const praw = tTwoSidedP(tv, df2)
      const tcrit = tQuantile(1 - 0.05 / m / 2, df2)
      pairs.push({
        i, j, diff: means[i] - means[j], se, t: tv,
        pAdj: Math.min(1, praw * m),
        ciLo: means[i] - means[j] - tcrit * se,
        ciHi: means[i] - means[j] + tcrit * se
      })
    }
  }
  return { k, N, ns, means, vars, grand, ssb, ssw, sst, df1, df2, msb, msw, f, p, eta2, pairs, nCompare: m }
}

// F 分布上尾（基于不完全贝塔的对称参数形式，保远尾精度）
function fSf(f, d1, d2) {
  if (!Number.isFinite(f) || !(d1 > 0) || !(d2 > 0)) return NaN
  if (f <= 0) return 1
  const x = d2 / (d2 + d1 * f)
  return betainc(d2 / 2, d1 / 2, x)
}

// ---------- 展示格式化 ----------
function fmtNum(v, d = 2) {
  if (v === null || v === undefined || !Number.isFinite(v)) return v === Infinity ? '∞' : (v === -Infinity ? '−∞' : '—')
  return v.toFixed(d)
}

function fmtP(p) {
  if (p === null || p === undefined || !Number.isFinite(p)) return '—'
  if (p < 1e-16) return '< 1e-16'
  if (p < 1e-4) return p.toExponential(2)
  return p.toFixed(5)
}

function sigBadge(p) {
  if (p === null || p === undefined || !Number.isFinite(p)) return { text: '—', cls: 'bg-muted text-muted-foreground' }
  if (p < 0.001) return { text: 'p < 0.001（*** 极显著）', cls: 'bg-green-500/10 text-green-600' }
  if (p < 0.01) return { text: 'p < 0.01（** 高度显著）', cls: 'bg-green-500/10 text-green-600' }
  if (p < 0.05) return { text: 'p < 0.05（* 显著）', cls: 'bg-amber-500/10 text-amber-600' }
  return { text: `p = ${fmtP(p)}（ns 不显著）`, cls: 'bg-muted text-muted-foreground' }
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '方差分析计算器 - 单因素ANOVA(F检验/η²/两两比较Bonferroni)在线工具',
  description: '在线方差分析计算器：粘贴多组数据(空行或组名:前缀分组)做单因素ANOVA，输出各组n/均值/方差对照表、完整ANOVA表(SS组间=Σnᵢ(x̄ᵢ−x̄)²、SS组内、df1=k−1、df2=N−k、MS、F=MS间/MS内)、p值(F分布不完全贝塔精确计算)与η²效应量，附显著性徽章与两两比较(合并MS组内t检验+Bonferroni校正,注明非Tukey)；三组经典数据F=15.2473、p=0.000507锚点复现，纯浏览器本地计算。',
  keywords: '方差分析计算器,anova,单因素方差分析,f检验,f分布,eta2效应量,组间方差,组内方差,bonferroni校正,两两比较',
  author: '有条工具',
  ogTitle: '方差分析计算器 - 单因素 ANOVA | 有条工具',
  ogDescription: 'SS 分解、F 检验、η² 效应量与校正后两两比较，多组均值比较一次搞定。',
  ogUrl: 'https://www.util.cn/tools/anova-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '方差分析计算器',
  twitterDescription: '单因素 ANOVA：F 检验、η²、方差分析表与 Bonferroni 两两比较。'
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
          name: '方差分析计算器',
          url: 'https://www.util.cn/tools/anova-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '多组数据宽容解析：空行分隔或「组名:」前缀分组',
            '各组 n / 均值 / 方差 / 标准差对照表',
            '完整 ANOVA 表：SS组间、SS组内、df1=k−1、df2=N−k、MS、F、p',
            'p 值基于正则化不完全贝塔 I_x(d1/2,d2/2) 上尾（双精度）',
            '效应量 η² = SS间/SS总（Cohen 小中大赛例）',
            '两两比较：合并 MS组内 t 检验 + Bonferroni 校正（注明非 Tukey HSD）',
            '显著性徽章（p<0.05/<0.01/<0.001）',
            '纯浏览器本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '方差分析计算器', item: 'https://www.util.cn/tools/anova-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '什么时候用 ANOVA 而不是多次 t 检验？',
              acceptedAnswer: { '@type': 'Answer', text: '三组及以上先用 ANOVA：每多一次比较整体假阳性率就膨胀（10 次比较不做校正超过 40%）。ANOVA 一次性控制整体 α，方差用 MS组内 合并估计更稳。k=2 时 t 检验与 ANOVA 等价（t²=F）。' }
            },
            {
              '@type': 'Question',
              name: 'ANOVA 显著后该用什么两两比较？',
              acceptedAnswer: { '@type': 'Answer', text: '本页提供合并 MS组内 的两两 t 检验 + Bonferroni 校正（p×比较数），保守但透明；Tukey HSD 基于学生化极差分布、通常略宽松，可用 R 的 TukeyHSD() 获得。' }
            },
            {
              '@type': 'Question',
              name: '各组方差不齐怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '方差比超过 4:1 且样本量不等时经典 F 检验会失真，可改用 Welch ANOVA 或对数据取对数等变换；各组 n 相近时经典 F 有一定耐受性。' }
            },
            {
              '@type': 'Question',
              name: 'η² 和 R² 是一回事吗？',
              acceptedAnswer: { '@type': 'Answer', text: '本质相同：都是因素解释的变异占总变异的比例。把组别变成虚拟变量做回归时 R² 恰好等于 η²。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'anova-calculator'

const EXAMPLE = `A: 23 25 28 24 27
B: 30 32 29 31 33
C: 25 27 26 28 24`

// ---------- 状态 ----------
const dataText = ref(EXAMPLE)

// ---------- 解析与结果 ----------
const groupsParsed = computed(() => parseGroups(dataText.value))
const anovaResult = computed(() => {
  const gs = groupsParsed.value
  if (gs.length < 2) return null
  if (gs.some(g => g.values.length < 2)) return null
  return oneWayAnova(gs.map(g => g.values))
})

const anovaError = computed(() => {
  const gs = groupsParsed.value
  if (gs.length === 0) return '请输入至少两组数据（组间空行或「组名:」前缀）。'
  if (gs.length < 2) return `只解析到 ${gs.length} 组，单因素 ANOVA 需要至少 2 组。`
  const bad = gs.filter(g => g.values.length < 2)
  if (bad.length > 0) return `组 [${bad.map(g => g.name).join('、')}] 数据不足 2 个，每组至少需要 2 个数据。`
  if (anovaResult.value === null) return '组内数据完全相同（方差为 0）且无法形成有效 F 检验，请检查数据。'
  return '数据未能解析，请检查格式。'
})

// ---------- 交互 ----------
function loadExample() {
  dataText.value = EXAMPLE
  trackEvent('工具结果', '载入示例', TOOL_ID)
}

async function copyResult() {
  const r = anovaResult.value
  if (!r) return
  const pairText = r.pairs.map(pr => `${groupsParsed.value[pr.i].name}−${groupsParsed.value[pr.j].name}: Δ=${pr.diff.toFixed(3)}, p_adj=${fmtP(pr.pAdj)}`).join('; ')
  const text = `单因素 ANOVA (k=${r.k}, N=${r.N}): F(${r.df1},${r.df2})=${r.f.toFixed(4)}, p=${fmtP(r.p)}, η²=${r.eta2.toFixed(4)}, SS间=${r.ssb.toFixed(3)}, SS内=${r.ssw.toFixed(3)}; 两两(Bonferroni): ${pairText}`
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
    trackEvent('工具结果', '复制', TOOL_ID)
  } catch (err) {
    alert('复制失败：浏览器未授权剪贴板，请手动选择结果复制。')
  }
}

// ---------- 生命周期（SSR 安全：浏览器 API 只在 onMounted / 事件回调触达） ----------
onMounted(() => {
  addRecentTool(TOOL_ID)
})
</script>
