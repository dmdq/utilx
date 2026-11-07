<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <TrendingUp class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">线性回归计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">最小二乘 ŷ=a+bx：斜率/截距/r/R²、残差逐点表、r 显著性 t 检验、散点回归图与预测区间（x₀ 反推）</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线线性回归计算器：粘贴 X:Y 或「X,Y」两列数据（逗号 / 冒号 / 空格 / 分号宽容解析，每行一点），
        最小二乘拟合 ŷ = a + bx（b = Sxy/Sxx、a = ȳ − b·x̄），输出斜率、截距、相关系数 r、决定系数 R²、
        斜率标准误与 r 显著性 t 检验（t = r√(n−2)/√(1−r²)，双侧 p 值基于不完全贝塔精确计算），
        逐点残差表（yᵢ、ŷᵢ、残差）与 SVG 散点 + 回归线图；
        预测模式输入 x₀ 给 ŷ₀ ± t·s·√(1 + 1/n + (x₀−x̄)²/Sxx) 预测区间并提示外推风险。
        Anscombe I 组经典数据（a=3.0001、b=0.5001、r=0.8164）等锚点精确复现。全部计算在浏览器本地完成，不上传任何数据。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          <span class="font-semibold">R² 高 ≠ 回归合理</span>：先画散点图看形状再谈拟合——Anscombe 四组数据
          R² 全是 0.67，但只有第一组真的是直线关系；预测区间只在观测范围内可信，外推需自担风险。
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
              <label for="lr-data" class="block text-sm font-medium text-foreground">数据（每行一点：X:Y 或 X,Y / X Y / X;Y）</label>
              <button type="button" @click="loadAnscombe" class="px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition">载入 Anscombe I 示例</button>
            </div>
            <textarea id="lr-data" v-model="dataText" rows="8" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="10:8.04&#10;8,6.95&#10;13 7.58"></textarea>
            <p class="text-[11px] text-muted-foreground mt-1.5">
              支持「10:8.04」「10,8.04」「10 8.04」「10;8.04」四种分隔，每行取前两个数为 (X, Y)；空行与无法解析的行自动跳过。
            </p>
          </div>

          <div v-if="lrResult" class="space-y-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <p class="text-sm text-muted-foreground mb-1">最小二乘拟合结果（n = {{ lrResult.n }}）</p>
              <p class="text-2xl sm:text-3xl font-bold text-primary font-mono">ŷ = {{ fmtNum(lrResult.a, 4) }} {{ lrResult.b >= 0 ? '+' : '−' }} {{ fmtNum(Math.abs(lrResult.b), 4) }}·x</p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                <div>
                  <p class="text-xs text-muted-foreground">斜率 b（SE {{ fmtNum(lrResult.seB, 4) }}）</p>
                  <p class="text-xl font-bold font-mono text-foreground">{{ fmtNum(lrResult.b, 4) }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">截距 a</p>
                  <p class="text-xl font-bold font-mono text-foreground">{{ fmtNum(lrResult.a, 4) }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">相关系数 r</p>
                  <p class="text-xl font-bold font-mono text-foreground">{{ fmtNum(lrResult.r, 4) }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">决定系数 R²</p>
                  <p class="text-xl font-bold font-mono text-foreground">{{ fmtNum(lrResult.r2, 4) }}</p>
                </div>
              </div>
              <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
                残差标准差 s = {{ fmtNum(lrResult.s, 4)}}；b 的 t 统计量 = {{ fmtNum(lrResult.tSlope, 4) }}（df = {{ lrResult.df }}），
                双侧 p = {{ fmtP(lrResult.p) }}
                <span class="font-semibold" :class="sigBadge(lrResult.p).cls">{{ sigBadge(lrResult.p).text }}</span>
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">r 的显著性检验</p>
                <p class="text-base font-bold font-mono text-foreground">t = {{ fmtNum(lrResult.tSlope, 4) }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">t = r√(n−2)/√(1−r²)，df = n−2 = {{ lrResult.df }}</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">Sxx / Syy / Sxy</p>
                <p class="text-base font-bold font-mono text-foreground">{{ fmtNum(lrResult.sxx, 3) }} / {{ fmtNum(lrResult.syy, 3) }}</p>
                <p class="text-sm font-mono text-muted-foreground">{{ fmtNum(lrResult.sxy, 3) }}</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">数据范围</p>
                <p class="text-sm font-mono text-foreground">x ∈ [{{ fmtNum(xMin, 3) }}, {{ fmtNum(xMax, 3) }}]</p>
                <p class="text-sm font-mono text-foreground">y ∈ [{{ fmtNum(yMin, 3) }}, {{ fmtNum(yMax, 3) }}]</p>
              </div>
            </div>

            <!-- 散点 + 回归线 -->
            <div>
              <p class="text-sm font-medium text-foreground mb-2">散点图与回归线</p>
              <svg :viewBox="'0 0 640 340'" class="w-full h-auto" role="img" aria-label="散点图与回归线">
                <!-- 轴 -->
                <line :x1="PADL" :y1="PADT" :x2="PADL" :y2="340 - PADB" class="text-muted-foreground" stroke="currentColor" stroke-width="1" />
                <line :x1="PADL" :y1="340 - PADB" :x2="640 - PADR" :y2="340 - PADB" class="text-muted-foreground" stroke="currentColor" stroke-width="1" />
                <!-- 轴标签 -->
                <text :x="PADL" :y="PADT - 4" class="fill-current text-muted-foreground" font-size="10" font-family="monospace">{{ fmtNum(yTop, 2) }}</text>
                <text :x="PADL" :y="340 - PADB + 12" class="fill-current text-muted-foreground" font-size="10" font-family="monospace">{{ fmtNum(xLo, 2) }}</text>
                <text :x="640 - PADR" :y="340 - PADB + 12" text-anchor="end" class="fill-current text-muted-foreground" font-size="10" font-family="monospace">{{ fmtNum(xHi, 2) }}</text>
                <text :x="PADL" :y="340 - 4" class="fill-current text-muted-foreground" font-size="10" font-family="monospace">{{ fmtNum(yBot, 2) }}</text>
                <!-- 回归线 -->
                <line :x1="lineX1" :y1="lineY1" :x2="lineX2" :y2="lineY2" class="text-sky-600" stroke="currentColor" stroke-width="2" />
                <!-- 数据点 -->
                <circle
                  v-for="(p, i) in lrResult.pts"
                  :key="i"
                  :cx="xToPix(p.x)"
                  :cy="yToPix(p.y)"
                  r="4"
                  class="text-primary fill-current"
                  fill-opacity="0.85"
                />
              </svg>
            </div>

            <button
              type="button"
              @click="copyResult"
              class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制回归结果
            </button>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">{{ lrError }}</p>
          </div>
        </div>

        <!-- 残差表 -->
        <div v-if="lrResult" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-3">残差逐点表（残差 = yᵢ − ŷᵢ）</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[420px]">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">#</th>
                  <th class="py-2 pr-3 font-medium">xᵢ</th>
                  <th class="py-2 pr-3 font-medium">yᵢ</th>
                  <th class="py-2 pr-3 font-medium">ŷᵢ</th>
                  <th class="py-2 font-medium">残差</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(p, i) in lrResult.pts.slice(0, 30)" :key="i" class="border-b border-border/50">
                  <td class="py-1.5 pr-3 text-muted-foreground">{{ i + 1 }}</td>
                  <td class="py-1.5 pr-3 font-mono text-foreground">{{ fmtNum(p.x, 4) }}</td>
                  <td class="py-1.5 pr-3 font-mono text-foreground">{{ fmtNum(p.y, 4) }}</td>
                  <td class="py-1.5 pr-3 font-mono text-muted-foreground">{{ fmtNum(p.yhat, 4) }}</td>
                  <td class="py-1.5 font-mono" :class="Math.abs(p.resid) > 2 * lrResult.s ? 'text-red-600 font-semibold' : 'text-muted-foreground'">{{ fmtNum(p.resid, 4) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="lrResult.pts.length > 30" class="text-[11px] text-muted-foreground mt-1.5">仅显示前 30 点，共 {{ lrResult.pts.length }} 点。</p>
          <p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
            |残差| &gt; 2s 的点标红（可能的离群点）；残差之和恒为 0，残差应大致随机散布——若呈弯曲/喇叭形，线性模型不合适。
          </p>
        </div>

        <!-- 预测模式 -->
        <div v-if="lrResult" class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold">预测模式（x₀ → ŷ₀ ± 预测区间）</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="lr-x0" class="block text-sm font-medium text-foreground mb-1.5">自变量取值 x₀</label>
              <input id="lr-x0" v-model.number="x0" type="number" step="any" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div class="bg-muted/50 rounded-lg p-3 border border-border text-xs text-muted-foreground leading-relaxed">
              预测区间 = ŷ₀ ± t(0.975, n−2)·s·√(1 + 1/n + (x₀−x̄)²/Sxx)，
              单个新观测的不确定度（含残差方差）；如需「均值响应的置信区间」把根号里的 1 去掉即可（更窄）。
            </div>
          </div>
          <div v-if="predResult" class="p-4 rounded-lg border border-primary/30 bg-primary/10">
            <p class="text-sm text-muted-foreground mb-1">x₀ = {{ fmtNum(x0, 4) }} 的预测</p>
            <p class="text-2xl font-bold text-primary font-mono">ŷ₀ = {{ fmtNum(predResult.yhat, 4) }}</p>
            <p class="text-sm text-foreground mt-1 font-mono">95% 预测区间 [ {{ fmtNum(predResult.lo, 4) }}, {{ fmtNum(predResult.hi, 4) }} ]（SE_pred = {{ fmtNum(predResult.sePred, 4) }}）</p>
            <p v-if="x0 < xMin || x0 > xMax" class="mt-2 flex items-start gap-1.5 text-xs p-2 rounded bg-amber-500/10 text-amber-600 leading-relaxed">
              <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>x₀ 在观测范围 [{{ fmtNum(xMin, 3) }}, {{ fmtNum(xMax, 3) }}] 之外，属外推：线性关系未必延伸到该区域，请谨慎引用。</span>
            </p>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> r 与 R² 怎么读
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <p><span class="font-mono text-foreground font-semibold">r ∈ [−1, 1]</span>　线性相关方向与强度</p>
            <p><span class="font-mono text-foreground font-semibold">R² = r²</span>　y 的方差被 x 线性解释的比例</p>
            <p><span class="font-mono text-foreground font-semibold">b = r·(sy/sx)</span>　斜率与 r 的关系</p>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            R² = 0.67 意思是「y 变异的 67% 能被 x 的线性项解释」。r 只度量线性关系：
            强曲线关系（如 y=x²，对称区间）r 可以是 0；一个离群点也能把 r 从 0 拉到 0.9。
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <AlertTriangle class="w-5 h-5 mr-2 text-amber-500" /> R² 的常见误读
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">相关 ≠ 因果</span>：冰淇淋销量与溺水人数 r 很高，共同原因是气温。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">R² 低 ≠ 没关系</span>：可能需要加变量、变换（取对数）或用非线性模型。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">范围敏感</span>：截取 x 的一段会让 R² 骤变，跨研究比较 R² 要先对齐范围。</span>
            </li>
          </ul>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">相关工具</h2>
          <NuxtLink to="/tools/anova-calculator" class="block p-3 rounded-lg border border-border bg-muted/40 hover:border-primary/40 transition text-sm">
            <span class="font-medium text-foreground">方差分析计算器 →</span>
            <p class="text-xs text-muted-foreground mt-1">分组均值比较（x 为分类变量时的「回归」）</p>
          </NuxtLink>
          <NuxtLink to="/tools/t-test-calculator" class="block p-3 rounded-lg border border-border bg-muted/40 hover:border-primary/40 transition text-sm">
            <span class="font-medium text-foreground">t 检验计算器 →</span>
            <p class="text-xs text-muted-foreground mt-1">斜率/相关显著性背后的 t 分布</p>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12">
      <summary class="cursor-pointer text-xl font-bold text-foreground select-none"><span class="text-primary mr-2">#</span>线性回归公式、FAQ 与参考</summary>
      <div class="mt-4">
        <h2 class="text-2xl font-bold text-foreground mb-4">线性回归计算器说明</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          最小二乘法找直线 ŷ = a + bx，使残差平方和 Σ(yᵢ−ŷᵢ)² 最小：b = Sxy/Sxx、a = ȳ − b·x̄，
          其中 Sxy = Σ(xᵢ−x̄)(yᵢ−ȳ)、Sxx = Σ(xᵢ−x̄)²。r = Sxy/√(Sxx·Syy) 度量线性相关，
          R² = r² 解释变异比例；r 的显著性用 t = r√(n−2)/√(1−r²)（df = n−2）检验，p 值经不完全贝塔精确计算。
          预测区间 SE_pred = s√(1 + 1/n + (x₀−x̄)²/Sxx)，x₀ 离均值越远区间越宽——这是回归「两端翘起」的几何来源。
          全部计算在浏览器本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">公式汇总</h3>
        <div class="bg-muted/50 rounded-lg p-4 border border-border space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p><span class="font-mono text-foreground font-semibold">斜率</span>：b = Sxy/Sxx；<span class="font-mono text-foreground font-semibold">截距</span>：a = ȳ − b·x̄</p>
          <p><span class="font-mono text-foreground font-semibold">相关系数</span>：r = Sxy/√(Sxx·Syy)；R² = r²</p>
          <p><span class="font-mono text-foreground font-semibold">残差方差</span>：s² = SSE/(n−2)，SSE = Syy − b·Sxy = Syy(1−r²)</p>
          <p><span class="font-mono text-foreground font-semibold">斜率标准误</span>：SE_b = s/√Sxx；t = b/SE_b = r√(n−2)/√(1−r²)</p>
          <p><span class="font-mono text-foreground font-semibold">预测区间</span>：ŷ₀ ± t(0.975, n−2)·s·√(1 + 1/n + (x₀−x̄)²/Sxx)</p>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">R² 的含义与常见误读</h3>
        <p class="text-sm text-muted-foreground mb-3 leading-relaxed">
          R² 回答「x 的线性项解释了 y 变异的百分之多少」，它不回答「x 是否导致 y」「模型形式是否正确」，
          也不保证预测可靠。四大误读：把相关当因果；R² 高就免检残差（离群点与曲线关系都能造出高 R²）；
          用 R² 比较不同因变量的模型（不可比）；对时间序列数据直接回归（伪回归，r 可以虚高）。
          配合本页残差表与散点图一起看，才是完整流程。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">r=0.8 强相关吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">看领域：物理测量里 0.8 很弱，社会科学里算强。更稳的口径是看 R²（0.64 的变异被解释）与散点图形态；样本量小时 |r| 还要除以抽样波动——本页 t 检验给出精确 p 值。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">预测区间和置信区间有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">置信区间描述「x₀ 处平均响应 ŷ」的不确定度（只含参数估计误差，根号里没有 1）；预测区间描述「单个新观测 y」的不确定度（还要加一项残差方差 s²，根号里的 1）。所以预测区间恒比置信区间宽，且不随 n→∞ 收窄到零。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">数据里有离群点怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">残差表已把 |残差| &gt; 2s 的点标红。先查数据录入错误与实验异常，确认是真实观测后再考虑：稳健回归、加虚拟变量或分别报告「含/不含」两套结果——直接删除需要说明理由。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">Anscombe 数据是什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">F. J. Anscombe (1973) 构造的四组 x,y 数据：均值、回归线（ŷ=3+0.5x）、R²=0.67 几乎完全相同，但散点形态天差地别（直线、曲线、离群点、水平诱饵）。它证明只看回归数字不看图会犯系统错误——本页示例即第一组。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。数据解析、回归拟合、残差与预测全部在你的浏览器本地计算，不发送任何网络请求，输入数据不被存储或上传。</p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">参考来源</h3>
        <ul class="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>Legendre, A. M. (1805) 最小二乘法；Gauss (1809) 正规方程</li>
          <li>Anscombe, F. J. (1973). Graphs in statistical analysis. The American Statistician 27.</li>
          <li>r 显著性检验与预测区间：NIST/SEMATECH e-Handbook §4.1.4「Linear Regression」</li>
          <li>t 分布 p 值经不完全贝塔函数（Lentz 连分式，Numerical Recipes §6.4）计算</li>
        </ul>
      </div>
    </details>

    <RelatedTools :currentToolId="'linear-regression-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { TrendingUp, Info, AlertTriangle, CheckCircle, Copy } from 'lucide-vue-next'
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

// ---------- t 分布（基于不完全贝塔） ----------
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

function tQuantile(p, df) {
  if (!Number.isFinite(p) || p <= 0 || p >= 1 || !(df > 0)) return NaN
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

// ---------- 数据宽容解析（X:Y / X,Y / X Y / X;Y） ----------
function parsePairs(text) {
  if (typeof text !== 'string') return []
  const pairs = []
  for (const raw of text.split(/\r?\n|;/)) {
    const line = raw.trim()
    if (!line) continue
    const nums = line.split(/[,，:：\s]+/).map(s => s.trim()).filter(s => s.length > 0)
      .map(Number)
    if (nums.length >= 2 && Number.isFinite(nums[0]) && Number.isFinite(nums[1])) {
      pairs.push([nums[0], nums[1]])
    }
  }
  return pairs
}

function meanOf(xs) {
  if (!Array.isArray(xs) || xs.length === 0) return NaN
  let s = 0
  for (const v of xs) s += v
  return s / xs.length
}

// ---------- 最小二乘线性回归 ----------
function linearRegression(pairs) {
  const n = pairs.length
  if (!(n >= 3)) return null
  let sx = 0
  let sy = 0
  for (const [x, y] of pairs) { sx += x; sy += y }
  const xbar = sx / n
  const ybar = sy / n
  let sxx = 0
  let syy = 0
  let sxy = 0
  for (const [x, y] of pairs) {
    const dx = x - xbar
    const dy = y - ybar
    sxx += dx * dx
    syy += dy * dy
    sxy += dx * dy
  }
  if (!(sxx > 0) || !(syy > 0)) return null
  const b = sxy / sxx
  const a = ybar - b * xbar
  const r = sxy / Math.sqrt(sxx * syy)
  const sse = syy - b * sxy
  const s2 = sse / (n - 2)
  if (!(s2 >= 0)) return null
  const s = Math.sqrt(s2)
  const seB = s / Math.sqrt(sxx)
  const tSlope = seB > 0 ? b / seB : 0
  const df = n - 2
  const pts = pairs.map(([x, y]) => ({ x, y, yhat: a + b * x, resid: y - (a + b * x) }))
  const predict = (x0) => {
    const yhat = a + b * x0
    const sePred = s * Math.sqrt(1 + 1 / n + (x0 - xbar) * (x0 - xbar) / sxx)
    const crit = tQuantile(0.975, df)
    return { x0, yhat, sePred, crit, lo: yhat - crit * sePred, hi: yhat + crit * sePred }
  }
  return {
    n, xbar, ybar, sxx, syy, sxy, b, a, r, r2: r * r,
    s, sse, seB, tSlope, df, p: tTwoSidedP(tSlope, df), pts, predict
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

function sigBadge(p) {
  if (p === null || p === undefined || !Number.isFinite(p)) return { text: '', cls: '' }
  if (p < 0.001) return { text: '（*** 极显著）', cls: 'text-green-600' }
  if (p < 0.01) return { text: '（** 高度显著）', cls: 'text-green-600' }
  if (p < 0.05) return { text: '（* 显著）', cls: 'text-amber-600' }
  return { text: `（ns 不显著）`, cls: 'text-muted-foreground' }
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '线性回归计算器 - 最小二乘拟合/r/R²/残差表/预测区间在线工具',
  description: '在线线性回归计算器：粘贴X:Y两列数据做最小二乘拟合ŷ=a+bx，输出斜率截距(含标准误)、相关系数r与R²、残差逐点表(|残差|>2s标红)、r显著性t检验(不完全贝塔精确p值)与SVG散点回归线图；预测模式给x₀的ŷ₀±t·s√(1+1/n+(x₀−x̄)²/Sxx)预测区间并提示外推；Anscombe I组a=3.0001、b=0.5001、r=0.8164锚点复现，纯浏览器本地计算。',
  keywords: '线性回归计算器,最小二乘法,linear regression,相关系数r,决定系数r2,残差分析,回归线,预测区间,anscombe数据,散点图',
  author: '有条工具',
  ogTitle: '线性回归计算器 - 最小二乘/r/R²/残差/预测区间 | 有条工具',
  ogDescription: '粘贴两列数据即得回归方程、残差表、显著性检验与散点图，预测区间自动算。',
  ogUrl: 'https://www.util.cn/tools/linear-regression-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '线性回归计算器',
  twitterDescription: '最小二乘回归、r/R²、残差表、散点图与预测区间。'
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
          name: '线性回归计算器',
          url: 'https://www.util.cn/tools/linear-regression-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '最小二乘拟合 ŷ=a+bx（b=Sxy/Sxx，a=ȳ−b·x̄），含斜率标准误',
            '相关系数 r 与决定系数 R²',
            '残差逐点表（yᵢ、ŷᵢ、残差，|残差|>2s 标红）',
            'r 显著性 t 检验（t=r√(n−2)/√(1−r²)，双侧 p 精确计算）',
            'SVG 散点图 + 回归线可视化',
            '预测模式：x₀ → ŷ₀ ± t·s·√(1+1/n+(x₀−x̄)²/Sxx) 预测区间，外推提示',
            'X:Y / X,Y / X Y 宽容解析，Anscombe I 经典示例',
            '纯浏览器本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '线性回归计算器', item: 'https://www.util.cn/tools/linear-regression-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'r=0.8 强相关吗？',
              acceptedAnswer: { '@type': 'Answer', text: '看领域：物理测量里 0.8 很弱，社会科学里算强。更稳的口径是看 R²（0.64 的变异被解释）与散点图形态，并用 t 检验确认显著性。' }
            },
            {
              '@type': 'Question',
              name: '预测区间和置信区间有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '置信区间描述 x₀ 处平均响应的不确定度；预测区间描述单个新观测的不确定度，根号里多一项残差方差 s²，恒更宽且不随 n→∞ 收窄到零。' }
            },
            {
              '@type': 'Question',
              name: 'R² 高就说明回归合理吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不一定。离群点和曲线关系都能造出高 R²（Anscombe 四组 R² 均为 0.67 而形态迥异）。必须配合残差表与散点图检查模型形式。' }
            },
            {
              '@type': 'Question',
              name: '数据里有离群点怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '残差表已把 |残差|>2s 的点标红。先查录入与实验异常，确认是真实观测后用稳健回归或分别报告含/不含两套结果，直接删除需说明理由。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'linear-regression-calculator'
const SETTINGS_KEY = `${TOOL_ID}-settings`

const ANSCOMBE = `10:8.04
8:6.95
13:7.58
9:8.81
11:8.33
14:9.96
6:7.24
4:4.26
12:10.84
7:4.82
5:5.68`

// SVG 布局常量
const W = 640
const H = 340
const PADL = 48
const PADR = 20
const PADT = 20
const PADB = 40

// ---------- 状态 ----------
const dataText = ref(ANSCOMBE)
const x0 = ref(10)

// ---------- 解析与结果 ----------
const pairs = computed(() => parsePairs(dataText.value))
const lrResult = computed(() => linearRegression(pairs.value))

const lrError = computed(() => {
  if (pairs.value.length === 0) return '请按「X:Y」或「X,Y」每行一点输入数据。'
  if (pairs.value.length < 3) return `至少需要 3 个数据点（当前 ${pairs.value.length} 个），df = n−2 才为正。`
  if (lrResult.value === null) return '所有 X（或所有 Y）取值完全相同，无法拟合直线。'
  return '数据未能解析，请检查格式。'
})

const xMin = computed(() => (lrResult.value ? Math.min(...lrResult.value.pts.map(p => p.x)) : NaN))
const xMax = computed(() => (lrResult.value ? Math.max(...lrResult.value.pts.map(p => p.x)) : NaN))
const yMin = computed(() => (lrResult.value ? Math.min(...lrResult.value.pts.map(p => p.y)) : NaN))
const yMax = computed(() => (lrResult.value ? Math.max(...lrResult.value.pts.map(p => p.y)) : NaN))

const predResult = computed(() => {
  if (!lrResult.value || !Number.isFinite(x0.value)) return null
  return lrResult.value.predict(x0.value)
})

// ---------- SVG 几何 ----------
// 域：数据范围外扩 6%，同时纳入回归线端点
const xLo = computed(() => (lrResult.value ? Math.min(xMin.value, lrResult.value.xbar) - 0.06 * (xMax.value - xMin.value || 1) : 0))
const xHi = computed(() => (lrResult.value ? Math.max(xMax.value, lrResult.value.xbar) + 0.06 * (xMax.value - xMin.value || 1) : 1))
const yLoRaw = computed(() => (lrResult.value ? Math.min(yMin.value, lrResult.value.a + lrResult.value.b * xLo.value, lrResult.value.a + lrResult.value.b * xHi.value) : 0))
const yHiRaw = computed(() => (lrResult.value ? Math.max(yMax.value, lrResult.value.a + lrResult.value.b * xLo.value, lrResult.value.a + lrResult.value.b * xHi.value) : 1))
const yBot = computed(() => (lrResult.value ? yLoRaw.value - 0.08 * (yHiRaw.value - yLoRaw.value || 1) : 0))
const yTop = computed(() => (lrResult.value ? yHiRaw.value + 0.08 * (yHiRaw.value - yLoRaw.value || 1) : 1))

function xToPix(x) {
  return PADL + (x - xLo.value) / (xHi.value - xLo.value) * (W - PADL - PADR)
}
function yToPix(y) {
  return PADT + (yTop.value - y) / (yTop.value - yBot.value) * (H - PADT - PADB)
}

const lineX1 = computed(() => xToPix(xLo.value))
const lineY1 = computed(() => yToPix(lrResult.value ? lrResult.value.a + lrResult.value.b * xLo.value : 0))
const lineX2 = computed(() => xToPix(xHi.value))
const lineY2 = computed(() => yToPix(lrResult.value ? lrResult.value.a + lrResult.value.b * xHi.value : 1))

// ---------- 交互 ----------
function loadAnscombe() {
  dataText.value = ANSCOMBE
  x0.value = 10
  trackEvent('工具结果', '载入示例', TOOL_ID)
}

async function copyResult() {
  const r = lrResult.value
  if (!r) return
  const text = `线性回归 (n=${r.n}): ŷ=${r.a.toFixed(4)}${r.b >= 0 ? '+' : '−'}${Math.abs(r.b).toFixed(4)}x, r=${r.r.toFixed(4)}, R²=${r.r2.toFixed(4)}, t=${r.tSlope.toFixed(4)}, df=${r.df}, p=${fmtP(r.p)}, s=${r.s.toFixed(4)}`
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
    if (Number.isFinite(s.x0)) x0.value = s.x0
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([x0], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ x0: x0.value }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})
</script>
