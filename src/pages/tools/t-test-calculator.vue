<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FlaskConical class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">t 检验计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">单样本 / 独立两样本（默认 Welch，可切 Student）/ 配对 t 检验，输出 t 值、自由度、双侧 p 值、Cohen's d 与 95% 均值差置信区间</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线 t 检验计算器：单样本 t 检验（t = (x̄−μ₀)/(s/√n)）、独立两样本 t 检验（默认 Welch 不等方差校正，
        Satterthwaite 自由度；可切换 Student 合并方差）与配对 t 检验（差值 d̄/(sd/√n)）。
        数据支持逗号 / 空格 / 换行宽容解析，输出两组均值与方差对比、方差比提示、t 值、自由度、双侧 p 值
        （t 分布 CDF 基于不完全贝塔 I_x(df/2, 1/2)，Lentz 连分式，双精度）、Cohen's d 效应量
        （独立用合并 sd 口径、配对用 d_z）与 95% 均值差置信区间，附显著性徽章（p&lt;0.05 / &lt;0.01 / &lt;0.001）。
        经典锚点（Cushny-Peebles 睡眠数据 t=−4.0621、p=0.00283）精确复现。全部计算在浏览器本地完成，不上传任何数据。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          <span class="font-semibold">p 值显著 ≠ 效应大</span>：n 很大时微小的均值差也会 p&lt;0.05。
          报告时同时给出效应量 Cohen's d（0.2 小 / 0.5 中 / 0.8 大）与置信区间，别只甩一个 p 值。
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主交互区 -->
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

        <!-- ① 单样本 -->
        <div v-if="mode === 'one'" class="space-y-4">
          <div>
            <label for="tt-data1" class="block text-sm font-medium text-foreground mb-1.5">样本数据（逗号 / 空格 / 换行分隔）</label>
            <textarea id="tt-data1" v-model="oneData" rows="3" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="52.1, 53.3, 49.8, 51.2, 52.7, 50.9"></textarea>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="tt-mu0" class="block text-sm font-medium text-foreground mb-1.5">检验值 μ₀</label>
              <input id="tt-mu0" v-model.number="mu0" type="number" step="any" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 50" />
            </div>
            <div class="bg-muted/50 rounded-lg p-3 border border-border text-xs text-muted-foreground leading-relaxed">
              单样本 t 检验回答「这批数据的均值是否偏离某个基准值 μ₀」：
              t = (x̄ − μ₀) / (s/√n)，df = n − 1。
            </div>
          </div>
        </div>

        <!-- ② 独立两样本 -->
        <div v-else-if="mode === 'two'" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="tt-g1" class="block text-sm font-medium text-foreground mb-1.5">第一组数据</label>
              <textarea id="tt-g1" v-model="g1Data" rows="3" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="27.5, 28.0, 26.9, 27.8, 28.4"></textarea>
            </div>
            <div>
              <label for="tt-g2" class="block text-sm font-medium text-foreground mb-1.5">第二组数据</label>
              <textarea id="tt-g2" v-model="g2Data" rows="3" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="24.1, 25.2, 23.8, 24.7, 25.0"></textarea>
            </div>
          </div>
          <div>
            <p class="text-sm font-medium text-foreground mb-1.5">方差假定</p>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                @click="welch = true"
                class="py-2 rounded-lg border text-xs font-medium transition"
                :class="welch ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
              >Welch（不等方差，推荐默认）</button>
              <button
                type="button"
                @click="welch = false"
                class="py-2 rounded-lg border text-xs font-medium transition"
                :class="!welch ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
              >Student（合并方差）</button>
            </div>
            <p class="text-[11px] text-muted-foreground mt-1.5">
              Welch 用 Satterthwaite 公式 df = (s₁²/n₁ + s₂²/n₂)² / [(s₁²/n₁)²/(n₁−1) + (s₂²/n₂)²/(n₂−1)]，
              两组方差或样本量不等时更稳健；Student 假定两组总体方差相等，用合并方差 sp²。
              现代统计软件（R、GraphPad）默认 Welch。
            </p>
          </div>

          <div v-if="twoResult" class="overflow-x-auto">
            <table class="w-full text-sm min-w-[420px]">
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
                <tr class="border-b border-border/50">
                  <td class="py-2 pr-3 text-foreground">第一组</td>
                  <td class="py-2 pr-3 font-mono text-muted-foreground">{{ twoResult.n1 }}</td>
                  <td class="py-2 pr-3 font-mono text-foreground">{{ fmtNum(twoResult.m1, 4) }}</td>
                  <td class="py-2 pr-3 font-mono text-foreground">{{ fmtNum(twoResult.v1, 4) }}</td>
                  <td class="py-2 font-mono text-foreground">{{ fmtNum(Math.sqrt(twoResult.v1), 4) }}</td>
                </tr>
                <tr class="border-b border-border/50">
                  <td class="py-2 pr-3 text-foreground">第二组</td>
                  <td class="py-2 pr-3 font-mono text-muted-foreground">{{ twoResult.n2 }}</td>
                  <td class="py-2 pr-3 font-mono text-foreground">{{ fmtNum(twoResult.m2, 4) }}</td>
                  <td class="py-2 pr-3 font-mono text-foreground">{{ fmtNum(twoResult.v2, 4) }}</td>
                  <td class="py-2 font-mono text-foreground">{{ fmtNum(Math.sqrt(twoResult.v2), 4) }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="leveneHint" class="mt-2 flex items-start gap-1.5 text-xs p-2.5 rounded bg-amber-500/10 text-amber-600 leading-relaxed">
              <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ leveneHint }}（此为方差比的粗略提示，非正式 Levene 检验。）</span>
            </p>
          </div>
        </div>

        <!-- ③ 配对 -->
        <div v-else class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="tt-p1" class="block text-sm font-medium text-foreground mb-1.5">第一组（如 处理前）</label>
              <textarea id="tt-p1" v-model="p1Data" rows="4" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="0.7, -1.6, -0.2, -1.2, -0.1, 3.4, 3.7, 0.8, 0.0, 2.0"></textarea>
            </div>
            <div>
              <label for="tt-p2" class="block text-sm font-medium text-foreground mb-1.5">第二组（如 处理后）</label>
              <textarea id="tt-p2" v-model="p2Data" rows="4" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="1.9, 0.8, 1.1, 0.1, -0.1, 4.4, 5.5, 1.6, 4.6, 3.4"></textarea>
            </div>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 border border-border text-xs text-muted-foreground leading-relaxed">
            配对 t 检验要求两组一一对应且等长。差值取 <span class="font-mono text-foreground font-semibold">d = 第一组 − 第二组</span>
            （与 R 的 <span class="font-mono">t.test(x=第一组, y=第二组, paired=TRUE)</span> 同方向；调换两组输入只会翻转 t 的符号，不影响 p 值）。
            检验 d̄ 是否偏离 0：t = d̄ / (sd/√n)，df = n − 1。
          </div>
          <div v-if="pairedInputError" class="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">{{ pairedInputError }}</p>
          </div>
          <div v-else-if="pairedResult" class="overflow-x-auto">
            <table class="w-full text-sm min-w-[420px]">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">配对</th>
                  <th class="py-2 pr-3 font-medium">第一组</th>
                  <th class="py-2 pr-3 font-medium">第二组</th>
                  <th class="py-2 font-medium">差值 d = 组1 − 组2</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(d, i) in pairedResult.diffs.slice(0, 20)" :key="i" class="border-b border-border/50">
                  <td class="py-1.5 pr-3 text-muted-foreground">#{{ i + 1 }}</td>
                  <td class="py-1.5 pr-3 font-mono text-muted-foreground">{{ fmtNum(p1Parsed[i], 4) }}</td>
                  <td class="py-1.5 pr-3 font-mono text-muted-foreground">{{ fmtNum(p2Parsed[i], 4) }}</td>
                  <td class="py-1.5 font-mono text-foreground">{{ fmtNum(d, 4) }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="pairedResult.diffs.length > 20" class="text-[11px] text-muted-foreground mt-1.5">仅显示前 20 对，共 {{ pairedResult.diffs.length }} 对。</p>
          </div>
        </div>

        <!-- 结果卡（三种模式共用结构） -->
        <div v-if="activeResult" class="space-y-3 border-t border-border pt-4">
          <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm text-muted-foreground">{{ activeLabel }}结果</p>
              <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="activeBadge.cls">{{ activeBadge.text }}</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div>
                <p class="text-xs text-muted-foreground">t 值</p>
                <p class="text-2xl font-bold font-mono text-primary">{{ fmtNum(activeResult.t, 4) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">自由度 df</p>
                <p class="text-2xl font-bold font-mono text-foreground">{{ fmtNum(activeResult.df, 2) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">双侧 p 值</p>
                <p class="text-2xl font-bold font-mono text-foreground">{{ fmtP(activeResult.p) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">效应量 {{ mode === 'paired' ? "d_z" : "Cohen's d" }}</p>
                <p class="text-2xl font-bold font-mono text-foreground">{{ fmtNum(activeResult.d, 4) }}</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-3 leading-relaxed">{{ activeFormulaText }}</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-xs text-muted-foreground mb-1">均值差（点估计）</p>
              <p class="text-lg font-bold font-mono text-foreground">{{ fmtNum(activeResult.diff, 4) }}</p>
              <p class="text-[10px] text-muted-foreground mt-1">{{ diffLabel }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4 sm:col-span-2">
              <p class="text-xs text-muted-foreground mb-1">均值差的 95% 置信区间</p>
              <p class="text-lg font-bold font-mono text-foreground">[ {{ fmtNum(activeResult.ciLo, 4) }}, {{ fmtNum(activeResult.ciHi, 4) }} ]</p>
              <p class="text-[10px] text-muted-foreground mt-1">均值差 ± t(0.975, df) × SE，{{ activeResult.ciLo < 0 && activeResult.ciHi < 0 ? '区间整体在 0 以下' : (activeResult.ciLo > 0 && activeResult.ciHi > 0 ? '区间整体在 0 以上' : '区间跨 0，95% 水平下不显著') }}</p>
            </div>
          </div>
          <button
            type="button"
            @click="copyResult"
            class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition flex items-center gap-1.5"
          >
            <Copy class="w-3.5 h-3.5" /> 复制检验结果
          </button>
        </div>
        <div v-else-if="activeError" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p class="text-sm text-muted-foreground">{{ activeError }}</p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 三种 t 检验怎么选
          </h2>
          <div class="space-y-2 text-xs leading-relaxed">
            <div class="p-2.5 rounded-lg bg-muted/50 border border-border">
              <p class="font-medium text-foreground">单样本 t</p>
              <p class="text-muted-foreground mt-0.5">一组数据 vs 已知基准（标准值、行业阈值、历史均值）。</p>
            </div>
            <div class="p-2.5 rounded-lg bg-muted/50 border border-border">
              <p class="font-medium text-foreground">独立两样本 t</p>
              <p class="text-muted-foreground mt-0.5">两组不同对象（A/B 实验、对照组 vs 处理组），组间互相独立。默认 Welch。</p>
            </div>
            <div class="p-2.5 rounded-lg bg-muted/50 border border-border">
              <p class="font-medium text-foreground">配对 t</p>
              <p class="text-muted-foreground mt-0.5">同一对象测两次（前后测、左右对照），个体内差异消掉了个体间变异，通常比当独立两组更灵敏。</p>
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> Cohen's d 怎么读
          </h2>
          <p class="text-xs leading-relaxed text-muted-foreground">
            d = 均值差 / 合并标准差，是「差了零点几个标准差」：0.2 小、0.5 中、0.8 大（Cohen 惯例）。
            配对设计常用 d_z = d̄ / sd(差值)，同一数据下 d_z 通常大于组间 d，两者不可直接比较。
            t 与 d 可以互推：独立等样本时 d = 2t/√df。
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">相关工具</h2>
          <NuxtLink to="/tools/confidence-interval-calculator" class="block p-3 rounded-lg border border-border bg-muted/40 hover:border-primary/40 transition text-sm">
            <span class="font-medium text-foreground">置信区间计算器 →</span>
            <p class="text-xs text-muted-foreground mt-1">均值与比例的置信区间、MOE 与样本量对比</p>
          </NuxtLink>
          <NuxtLink to="/tools/anova-calculator" class="block p-3 rounded-lg border border-border bg-muted/40 hover:border-primary/40 transition text-sm">
            <span class="font-medium text-foreground">方差分析计算器 →</span>
            <p class="text-xs text-muted-foreground mt-1">三组及以上均值比较，别再做多次 t 检验</p>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12">
      <summary class="cursor-pointer text-xl font-bold text-foreground select-none"><span class="text-primary mr-2">#</span>t 检验公式、FAQ 与参考</summary>
      <div class="mt-4">
        <h2 class="text-2xl font-bold text-foreground mb-4">t 检验计算器说明</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          t 检验用 t 统计量检验「均值是否等于某值 / 两组均值是否相等」。t 分布 CDF 通过不完全贝塔函数
          I_x(df/2, 1/2)（Lentz 连分式）计算：P(|T| ≥ |t|) = I_{df/(df+t²)}(df/2, 1/2)，双精度复现 R 的
          t.test 输出（Cushny-Peebles 睡眠配对数据 t = −4.0621、p = 0.00283）。本页支持单样本、
          独立两样本（Welch / Student）与配对三种模式，全部在浏览器本地计算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么时候用哪种 t 检验（对照表）</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[560px]">
            <thead>
              <tr class="text-left text-xs text-muted-foreground border-b border-border">
                <th class="py-2 pr-3 font-medium">设计</th>
                <th class="py-2 pr-3 font-medium">公式</th>
                <th class="py-2 pr-3 font-medium">自由度</th>
                <th class="py-2 font-medium">典型场景</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border/50">
                <td class="py-2 pr-3 text-foreground">单样本</td>
                <td class="py-2 pr-3 font-mono text-xs text-muted-foreground">t=(x̄−μ₀)/(s/√n)</td>
                <td class="py-2 pr-3 font-mono text-muted-foreground">n−1</td>
                <td class="py-2 text-muted-foreground">与基准值/标准值比较</td>
              </tr>
              <tr class="border-b border-border/50">
                <td class="py-2 pr-3 text-foreground">独立两样本（Welch）</td>
                <td class="py-2 pr-3 font-mono text-xs text-muted-foreground">t=(x̄₁−x̄₂)/√(s₁²/n₁+s₂²/n₂)</td>
                <td class="py-2 pr-3 font-mono text-muted-foreground">Satterthwaite（可为小数）</td>
                <td class="py-2 text-muted-foreground">两组独立对象，默认推荐</td>
              </tr>
              <tr class="border-b border-border/50">
                <td class="py-2 pr-3 text-foreground">独立两样本（Student）</td>
                <td class="py-2 pr-3 font-mono text-xs text-muted-foreground">t=(x̄₁−x̄₂)/(sp·√(1/n₁+1/n₂))</td>
                <td class="py-2 pr-3 font-mono text-muted-foreground">n₁+n₂−2</td>
                <td class="py-2 text-muted-foreground">方差确证相等且需要经典口径</td>
              </tr>
              <tr class="border-b border-border/50">
                <td class="py-2 pr-3 text-foreground">配对</td>
                <td class="py-2 pr-3 font-mono text-xs text-muted-foreground">t=d̄/(sd/√n)</td>
                <td class="py-2 pr-3 font-mono text-muted-foreground">对数−1</td>
                <td class="py-2 text-muted-foreground">前后测、同体双测量</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">Welch 和 Student 怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1">拿不准就 Welch：它在方差相等时几乎不损失功效，方差不等时显著更稳健，R 与主流统计软件已把 Welch 设为默认。Student 只在「两组总体方差确实相等」这个强假定下才精确，通常仅用于复现经典教材结果。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">方差比多大算「差异大」？</h3>
            <p class="text-sm text-muted-foreground mt-1">本页在两组样本方差比超过 2 时给出非正式提示。这是经验提示而非正式检验（正式的 F 比率检验或 Levene/Brown-Forsythe 检验对正态性与样本量更敏感）。看到提示时优先用 Welch——这也是本页默认。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">t 值多大才算显著？</h3>
            <p class="text-sm text-muted-foreground mt-1">取决于自由度：df 越小，|t| 需要越大。双侧 0.05 的临界值在 df=5 时是 2.5706，df=24 时是 2.0639，df→∞ 时收敛到 1.95996（正态 z）。直接看 p 值更方便，本页已按不完全贝塔精确计算。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">p = 0.049 和 p = 0.051 有本质区别吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">没有。0.05 是约定阈值不是物理边界，两者证据强度几乎相同。更好的做法是报告精确 p 值、效应量与置信区间，让读者看到量级而非二值结论。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">配对检验的 t 符号为什么和论文相反？</h3>
            <p class="text-sm text-muted-foreground mt-1">符号取决于差值方向。本页取 d = 第一组 − 第二组（与 R 的 t.test(x, y, paired=TRUE) 同向）；论文若按「后 − 前」定义差值，符号相反但 |t| 与 p 值完全一致。双侧检验中方向不重要。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。数据解析、t 统计量、p 值与效应量全部在你的浏览器本地计算，不发送任何网络请求，输入数据不被存储或上传。</p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">参考来源</h3>
        <ul class="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>Student (W. S. Gosset, 1908). The probable error of a mean. Biometrika 6.</li>
          <li>Welch, B. L. (1947). The generalization of 「Student's」 problem. Biometrika 34.</li>
          <li>Cushny, A. R. &amp; Peebles, A. R. (1905) 睡眠数据；R 内置 sleep 数据集经典算例</li>
          <li>Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences（效应量惯例）</li>
          <li>t 分布 CDF/分位数经不完全贝塔函数（Lentz 连分式，Numerical Recipes §6.4）计算</li>
        </ul>
      </div>
    </details>

    <RelatedTools :currentToolId="'t-test-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { FlaskConical, Info, AlertTriangle, CheckCircle, Copy } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// ---------- 高精度标准正态（erf 级数 + 连分式，供 normQuant / 大 df 回退） ----------
function erfSeries(t) {
  const t2 = t * t
  let term = t
  let sum = t
  for (let n = 1; n < 300; n++) {
    term *= -t2 * (2 * n - 1) / (n * (2 * n + 1))
    sum += term
    if (Math.abs(term) < 1e-19 * (Math.abs(sum) + 1)) break
  }
  return sum * 1.1283791670955126 // 2/√π
}

function erfcCf(t) {
  const N = 300
  let f = 0
  for (let n = N; n >= 1; n--) {
    f = (n / 2) / (t + f)
  }
  return (Math.exp(-t * t) / Math.sqrt(Math.PI)) / (t + f)
}

function normSf(x) {
  if (!Number.isFinite(x)) return x > 0 ? 0 : (x < 0 ? 1 : 0.5)
  if (x < 0) return 1 - normSf(-x)
  const t = x / Math.SQRT2
  if (t < 2.6) return 0.5 * (1 - erfSeries(t))
  return 0.5 * erfcCf(t)
}

function normCdf(x) {
  return 1 - normSf(x)
}

function normPdf(x) {
  return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)
}

function normQuant(p) {
  if (!Number.isFinite(p) || p <= 0 || p >= 1) return NaN
  const upper = p >= 0.5
  const tail = upper ? 1 - p : p
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
    const d = normPdf(x)
    if (d > 0) x -= e / d
  }
  return upper ? x : -x
}

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

// ---------- t 分布（CDF 基于不完全贝塔 I_x(df/2, 1/2)） ----------
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

// 双侧 p 值 = P(|T| ≥ |t|) = I_{df/(df+t²)}(df/2, 1/2)
function tTwoSidedP(t, df) {
  if (!Number.isFinite(t) || !(df > 0)) return NaN
  return betainc(df / 2, 0.5, df / (df + t * t))
}

// t 分位数：二分定界 + 牛顿精化，df ≥ 1e4 时退回正态
function tQuantile(p, df) {
  if (!Number.isFinite(p) || p <= 0 || p >= 1 || !(df > 0)) return NaN
  if (df >= 1e4) return normQuant(p)
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

// ---------- 基础统计与宽容解析 ----------
function parseNums(text) {
  if (typeof text !== 'string') return []
  return text.split(/[\s,;，；、]+/).map(s => s.trim()).filter(s => s.length > 0)
    .map(Number).filter(Number.isFinite)
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

// ---------- 三种 t 检验 ----------
function oneSampleT(data, mu0) {
  const n = data.length
  if (!(n >= 2) || !Number.isFinite(mu0)) return null
  const xbar = meanOf(data)
  const s = Math.sqrt(varOf(data))
  if (!(s > 0)) return null
  const se = s / Math.sqrt(n)
  const t = (xbar - mu0) / se
  const df = n - 1
  const crit = tQuantile(0.975, df)
  return {
    n, xbar, s, se, t, df, p: tTwoSidedP(t, df), d: (xbar - mu0) / s,
    diff: xbar - mu0, crit, ciLo: (xbar - mu0) - crit * se, ciHi: (xbar - mu0) + crit * se
  }
}

// 独立两样本：welch=true 用 Satterthwaite df，否则 Student 合并方差
function twoSampleT(d1, d2, welch) {
  const n1 = d1.length
  const n2 = d2.length
  if (!(n1 >= 2) || !(n2 >= 2)) return null
  const m1 = meanOf(d1)
  const m2 = meanOf(d2)
  const v1 = varOf(d1)
  const v2 = varOf(d2)
  if (!(v1 > 0) || !(v2 > 0)) return null
  const diff = m1 - m2
  const sp = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2))
  let se
  let df
  if (welch) {
    const s1n = v1 / n1
    const s2n = v2 / n2
    se = Math.sqrt(s1n + s2n)
    df = (s1n + s2n) * (s1n + s2n) / (s1n * s1n / (n1 - 1) + s2n * s2n / (n2 - 1))
  } else {
    se = sp * Math.sqrt(1 / n1 + 1 / n2)
    df = n1 + n2 - 2
  }
  const t = diff / se
  const crit = tQuantile(0.975, df)
  return {
    n1, n2, m1, m2, v1, v2, diff, se, t, df, welch,
    p: tTwoSidedP(t, df), sp, d: diff / sp,
    ciLo: diff - crit * se, ciHi: diff + crit * se
  }
}

// 配对 t：d_i = 组1 − 组2（与 R t.test(x=组1, y=组2, paired=TRUE) 同向）
function pairedT(d1, d2) {
  if (!Array.isArray(d1) || !Array.isArray(d2) || d1.length !== d2.length) return null
  const n = d1.length
  if (!(n >= 2)) return null
  const diffs = []
  for (let i = 0; i < n; i++) diffs.push(d1[i] - d2[i])
  const dbar = meanOf(diffs)
  const sd = Math.sqrt(varOf(diffs))
  if (!(sd > 0)) return null
  const se = sd / Math.sqrt(n)
  const t = dbar / se
  const df = n - 1
  const crit = tQuantile(0.975, df)
  return {
    n, diffs, dbar, sd, se, t, df,
    p: tTwoSidedP(t, df),
    dz: dbar / sd,
    d: dbar / sd,
    diff: dbar,
    ciLo: dbar - crit * se, ciHi: dbar + crit * se
  }
}

// ---------- 展示格式化 ----------
function fmtNum(v, d = 2) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return v.toFixed(d)
}

function fmtP(p) {
  if (p === null || p === undefined || !Number.isFinite(p)) return '—'
  if (p < 1e-16) return '< 1e-16'
  if (p < 1e-4) return p.toExponential(2)
  return p.toFixed(5)
}

// 显著性徽章：p<0.05 / <0.01 / <0.001
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
  title: 't 检验计算器 - 单样本/独立两样本(Welch)/配对t检验在线工具',
  description: '在线t检验计算器：单样本t检验、独立两样本t检验（默认Welch不等方差Satterthwaite自由度，可切Student合并方差）与配对t检验；数据逗号/空格/换行宽容解析，输出t值、自由度、双侧p值（不完全贝塔精确计算）、Cohen\'s d效应量、95%均值差置信区间与显著性徽章，方差比>2自动提示，Cushny-Peebles睡眠数据锚点复现，纯浏览器本地计算。',
  keywords: 't检验计算器,t test,t值计算,p值计算,welch t检验,student t检验,配对t检验,单样本t检验,cohen d效应量,satterthwaite自由度',
  author: '有条工具',
  ogTitle: 't 检验计算器 - 单样本/独立两样本/配对 t 检验 | 有条工具',
  ogDescription: 'Welch/Student 双口径、双侧 p 值精确计算、Cohen\'s d 与 95% 均值差置信区间，显著性徽章一目了然。',
  ogUrl: 'https://www.util.cn/tools/t-test-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 't 检验计算器',
  twitterDescription: '单样本 / 独立两样本 / 配对 t 检验，Welch 默认，p 值与效应量精确计算。'
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
          name: 't 检验计算器',
          url: 'https://www.util.cn/tools/t-test-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '单样本 t 检验：t=(x̄−μ₀)/(s/√n)',
            '独立两样本 t 检验：默认 Welch（Satterthwaite df），可切换 Student（合并方差）',
            '配对 t 检验：差值 t=d̄/(sd/√n)，支持前后测数据',
            '数据逗号/空格/换行宽容解析，配对差值表逐对展示',
            '双侧 p 值基于不完全贝塔 I_x(df/2,1/2) 精确计算（双精度）',
            "Cohen's d 效应量（独立合并 sd 口径 / 配对 d_z）",
            '95% 均值差置信区间与显著性徽章（p<0.05/<0.01/<0.001）',
            '两组方差比 > 2 非正式提示（建议 Welch）',
            '纯浏览器本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: 't 检验计算器', item: 'https://www.util.cn/tools/t-test-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Welch 和 Student t 检验怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '拿不准就 Welch：方差相等时几乎不损失功效，方差不等时显著更稳健，R 等统计软件已设为默认。Student 仅在两组总体方差确实相等时精确。' }
            },
            {
              '@type': 'Question',
              name: 't 值多大才算显著？',
              acceptedAnswer: { '@type': 'Answer', text: '取决于自由度：双侧 0.05 临界值 df=5 时为 2.5706，df=24 时为 2.0639，df→∞ 时收敛到 1.95996。直接看精确 p 值更方便。' }
            },
            {
              '@type': 'Question',
              name: '配对检验的 t 符号为什么和论文相反？',
              acceptedAnswer: { '@type': 'Answer', text: '符号取决于差值方向定义。本页取 d=第一组−第二组（与 R t.test(x,y,paired=TRUE) 同向）；方向相反只翻转符号，|t| 与双侧 p 值完全一致。' }
            },
            {
              '@type': 'Question',
              name: 'p=0.049 和 p=0.051 有本质区别吗？',
              acceptedAnswer: { '@type': 'Answer', text: '没有。0.05 是约定阈值而非物理边界，两者证据强度几乎相同。建议同时报告精确 p 值、效应量与置信区间。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 't-test-calculator'
const SETTINGS_KEY = `${TOOL_ID}-settings`

const MODES = [
  { id: 'one', label: '单样本' },
  { id: 'two', label: '独立两样本' },
  { id: 'paired', label: '配对' }
]

// ---------- 状态（预填经典算例） ----------
const mode = ref('one')
const oneData = ref('52.1, 53.3, 49.8, 51.2, 52.7, 50.9')
const mu0 = ref(50)
const g1Data = ref('27.5, 28.0, 26.9, 27.8, 28.4')
const g2Data = ref('24.1, 25.2, 23.8, 24.7, 25.0')
const welch = ref(true)
const p1Data = ref('0.7, -1.6, -0.2, -1.2, -0.1, 3.4, 3.7, 0.8, 0.0, 2.0')
const p2Data = ref('1.9, 0.8, 1.1, 0.1, -0.1, 4.4, 5.5, 1.6, 4.6, 3.4')

// ---------- 解析与结果 ----------
const oneParsed = computed(() => parseNums(oneData.value))
const g1Parsed = computed(() => parseNums(g1Data.value))
const g2Parsed = computed(() => parseNums(g2Data.value))
const p1Parsed = computed(() => parseNums(p1Data.value))
const p2Parsed = computed(() => parseNums(p2Data.value))

const oneResult = computed(() => oneSampleT(oneParsed.value, mu0.value))
const twoResult = computed(() => twoSampleT(g1Parsed.value, g2Parsed.value, welch.value))
const pairedResult = computed(() => pairedT(p1Parsed.value, p2Parsed.value))

const leveneHint = computed(() => {
  const r = twoResult.value
  if (!r) return ''
  const ratio = Math.max(r.v1, r.v2) / Math.min(r.v1, r.v2)
  if (ratio > 2) {
    return `两组样本方差比 = ${ratio.toFixed(2)} > 2，方差差异较大，建议使用 Welch 校正${r.welch ? '（当前已选）' : '（当前选的是 Student）'}`
  }
  return ''
})

const pairedInputError = computed(() => {
  if (p1Parsed.value.length === 0 || p2Parsed.value.length === 0) return ''
  if (p1Parsed.value.length !== p2Parsed.value.length) {
    return `两组数据长度不同（${p1Parsed.value.length} vs ${p2Parsed.value.length}），配对检验要求一一对应等长。`
  }
  if (pairedResult.value === null && p1Parsed.value.length >= 2) {
    return '差值标准差为 0（两组差值完全相同），无法计算 t 检验。'
  }
  return ''
})

const activeResult = computed(() => {
  if (mode.value === 'one') return oneResult.value
  if (mode.value === 'two') return twoResult.value
  return pairedInputError.value ? null : pairedResult.value
})

const activeError = computed(() => {
  if (mode.value === 'one') {
    if (oneParsed.value.length < 2) return '请至少输入 2 个有效的样本数据（逗号 / 空格 / 换行分隔）。'
    if (!Number.isFinite(mu0.value)) return '请填写检验值 μ₀。'
    if (oneResult.value === null) return '样本标准差为 0（数据完全相同），无法计算 t 检验。'
  }
  if (mode.value === 'two') {
    if (g1Parsed.value.length < 2 || g2Parsed.value.length < 2) return '两组各至少输入 2 个有效数据。'
    if (twoResult.value === null) return '某一组数据完全相同（方差为 0），无法计算 t 检验。'
  }
  if (mode.value === 'paired') {
    if (p1Parsed.value.length < 2) return '请各输入至少 2 对有效数据。'
    if (p1Parsed.value.length !== p2Parsed.value.length) return '两组数据长度不同，配对检验要求一一对应等长。'
    if (pairedResult.value === null) return '差值标准差为 0（两组差值完全相同），无法计算 t 检验。'
  }
  return ''
})

const activeLabel = computed(() => MODES.find((m) => m.id === mode.value)?.label || '')
const activeBadge = computed(() => (activeResult.value ? sigBadge(activeResult.value.p) : { text: '—', cls: '' }))

const diffLabel = computed(() => {
  if (mode.value === 'one') return 'x̄ − μ₀'
  if (mode.value === 'two') return 'x̄₁ − x̄₂'
  return 'd̄（差值均值）'
})

const activeFormulaText = computed(() => {
  if (mode.value === 'one') {
    const r = oneResult.value
    if (!r) return ''
    return `单样本：t = (x̄ − μ₀)/(s/√n) = (${fmtNum(r.xbar, 4)} − ${fmtNum(mu0.value, 4)})/${fmtNum(r.se, 4)}；s = ${fmtNum(r.s, 4)}，df = n−1 = ${r.df}`
  }
  if (mode.value === 'two') {
    const r = twoResult.value
    if (!r) return ''
    return r.welch
      ? `Welch：t = (x̄₁−x̄₂)/√(s₁²/n₁+s₂²/n₂)，df = ${fmtNum(r.df, 2)}（Satterthwaite）；合并标准差 sp = ${fmtNum(r.sp, 4)}`
      : `Student：t = (x̄₁−x̄₂)/(sp·√(1/n₁+1/n₂))，sp² = ${fmtNum(r.sp * r.sp, 4)}，df = n₁+n₂−2 = ${r.df}`
  }
  const r = pairedResult.value
  if (!r) return ''
  return `配对：t = d̄/(sd/√n) = ${fmtNum(r.dbar, 4)}/${fmtNum(r.se, 4)}，sd = ${fmtNum(r.sd, 4)}，df = n−1 = ${r.df}；d_z = d̄/sd = ${fmtNum(r.dz, 4)}`
})

// ---------- 复制 ----------
async function copyResult() {
  const r = activeResult.value
  if (!r) return
  const text = `${activeLabel.value} t 检验: t=${r.t.toFixed(4)}, df=${fmtNum(r.df, 2)}, 双侧p=${fmtP(r.p)}, 效应量=${fmtNum(r.d, 4)}, 95%CI 均值差 [${r.ciLo.toFixed(4)}, ${r.ciHi.toFixed(4)}]`
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
    trackEvent('工具结果', '复制', TOOL_ID)
  } catch (err) {
    alert('复制失败：浏览器未授权剪贴板，请手动选择结果复制。')
  }
}

// ---------- 设置持久化（localStorage 仅 onMounted / 用户交互回调触达，SSR 安全） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (MODES.some((m) => m.id === s.mode)) mode.value = s.mode
    if (Number.isFinite(s.mu0)) mu0.value = s.mu0
    if (s.welch === true || s.welch === false) welch.value = s.welch
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([mode, mu0, welch], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ mode: mode.value, mu0: mu0.value, welch: welch.value }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})
</script>
