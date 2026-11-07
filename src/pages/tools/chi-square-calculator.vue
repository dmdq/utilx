<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Grid3x3 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">卡方检验计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">拟合优度检验（自定义期望比例）与 R×C 列联表独立性检验，附贡献热力标色、Yates 校正与 Fisher 精确检验</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线卡方检验计算器：拟合优度检验 χ² = Σ(O−E)²/E（观测频数 + 可选期望比例，默认均匀期望），
        独立性检验（2×2 至 5×5 列联表，行内粘贴自动算行合计/列合计/期望频数 E = 行合计×列合计/总），
        每格贡献 (O−E)²/E 热力标色（贡献 &gt; 4 标红）快速定位偏离来源；
        2×2 表附 Yates 连续性校正 χ² 与 Fisher 精确检验（超几何双侧）p 值。
        卡方 p 值基于正则化不完全伽马函数 P(df/2, x/2)（级数 + Lentz 连分式双段）双精度计算，
        孟德尔 9:3:3:1 经典数据（χ² = 0.4700，p = 0.9254）等锚点精确复现。全部计算在浏览器本地完成，不上传任何数据。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          <span class="font-semibold">卡方检验用的是频数不是百分比</span>：输入必须是各类别的观测计数（正整数为主）。
          任一格期望频数 E &lt; 5 时近似失效——先合并相邻类别，或改用 Fisher 精确检验（本页 2×2 已内置）。
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主交互区 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="m in MODES"
            :key="m.id"
            @click="mode = m.id"
            :class="mode === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-xs sm:text-sm font-medium transition-all"
          >{{ m.label }}</button>
        </div>

        <!-- ① 拟合优度 -->
        <div v-if="mode === 'gof'" class="space-y-4">
          <div>
            <label for="cs-obs" class="block text-sm font-medium text-foreground mb-1.5">观测频数（逗号 / 空格 / 换行分隔，按类别顺序）</label>
            <textarea id="cs-obs" v-model="gofObs" rows="2" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="315, 108, 101, 32"></textarea>
          </div>
          <div>
            <label for="cs-ratio" class="block text-sm font-medium text-foreground mb-1.5">期望比例（可选，与观测同长度；留空 = 均匀期望）</label>
            <input id="cs-ratio" v-model="gofRatio" type="text" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 9, 3, 3, 1（孟德尔分离比）" />
            <p class="text-[11px] text-muted-foreground mt-1.5">
              比例会自动归一化（9:3:3:1 与 0.5625:0.1875:0.1875:0.0625 等价），期望频数 Eᵢ = 比例ᵢ/Σ比例 × 总数。
            </p>
          </div>

          <div v-if="gofResult" class="space-y-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-sm text-muted-foreground">拟合优度检验结果（k = {{ gofResult.cells.length }} 类）</p>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="sigBadge(gofResult.p).cls">{{ sigBadge(gofResult.p).text }}</span>
              </div>
              <div class="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <p class="text-xs text-muted-foreground">χ² 统计量</p>
                  <p class="text-2xl font-bold font-mono text-primary">{{ fmtNum(gofResult.chi2, 4) }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">自由度 df = k−1</p>
                  <p class="text-2xl font-bold font-mono text-foreground">{{ gofResult.df }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">p 值</p>
                  <p class="text-2xl font-bold font-mono text-foreground">{{ fmtP(gofResult.p) }}</p>
                </div>
              </div>
              <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
                p 值较大（不显著）→ 观测分布与期望比例「无显著差异」，数据拟合该理论比例；
                p 值较小 → 观测偏离期望显著。注意卡方检验方向是「拟合是否成立」，与 t 检验的习惯相反。
              </p>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-sm min-w-[420px]">
                <thead>
                  <tr class="text-left text-xs text-muted-foreground border-b border-border">
                    <th class="py-2 pr-3 font-medium">类别</th>
                    <th class="py-2 pr-3 font-medium">观测 O</th>
                    <th class="py-2 pr-3 font-medium">期望 E</th>
                    <th class="py-2 font-medium">贡献 (O−E)²/E</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(c, i) in gofResult.cells" :key="i" class="border-b border-border/50">
                    <td class="py-2 pr-3 text-foreground">{{ i + 1 }}</td>
                    <td class="py-2 pr-3 font-mono text-foreground">{{ fmtNum(c.o, 2) }}</td>
                    <td class="py-2 pr-3 font-mono text-muted-foreground">{{ fmtNum(c.e, 4) }}</td>
                    <td class="py-2 font-mono" :class="c.contrib > 4 ? 'text-red-600 font-semibold' : 'text-muted-foreground'">{{ fmtNum(c.contrib, 4) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p v-if="gofResult.cells.some(c => c.e < 5)" class="flex items-start gap-1.5 text-xs p-2.5 rounded bg-amber-500/10 text-amber-600 leading-relaxed">
              <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>存在期望频数 E &lt; 5 的类别，卡方近似可能失真：建议合并相邻类别提高 E，或样本量加大后重测。</span>
            </p>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">{{ gofError }}</p>
          </div>
        </div>

        <!-- ② 独立性 -->
        <div v-else class="space-y-4">
          <div>
            <label for="cs-table" class="block text-sm font-medium text-foreground mb-1.5">列联表（每行一条记录，格间逗号 / 空格 / Tab 分隔；支持 2×2 ~ 5×5）</label>
            <textarea id="cs-table" v-model="indTable" rows="3" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="12, 5&#10;7, 10"></textarea>
          </div>

          <div v-if="indResult" class="space-y-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-sm text-muted-foreground">独立性检验结果（{{ indResult.cells.length }}×{{ indResult.cells[0].length }}）</p>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="sigBadge(indResult.p).cls">{{ sigBadge(indResult.p).text }}</span>
              </div>
              <div class="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <p class="text-xs text-muted-foreground">χ² 统计量</p>
                  <p class="text-2xl font-bold font-mono text-primary">{{ fmtNum(indResult.chi2, 4) }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">df = (R−1)(C−1)</p>
                  <p class="text-2xl font-bold font-mono text-foreground">{{ indResult.df }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">p 值</p>
                  <p class="text-2xl font-bold font-mono text-foreground">{{ fmtP(indResult.p) }}</p>
                </div>
              </div>
              <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
                p 值小 → 拒绝独立假设，行变量与列变量相关；p 值大 → 数据与「两变量独立」相容。
                格中贡献 (O−E)²/E &gt; 4 的单元已标红，是偏离独立的主要来源。
              </p>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-sm min-w-[520px]">
                <thead>
                  <tr class="text-left text-xs text-muted-foreground border-b border-border">
                    <th class="py-2 pr-3 font-medium">行 \ 列</th>
                    <th v-for="j in indResult.cells[0].length" :key="j" class="py-2 pr-3 font-medium">列 {{ j }}</th>
                    <th class="py-2 font-medium">行合计</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(line, i) in indResult.cells" :key="i" class="border-b border-border/50">
                    <td class="py-2 pr-3 text-foreground">行 {{ i + 1 }}</td>
                    <td v-for="(c, j) in line" :key="j" class="py-2 pr-3 align-top">
                      <div
                        class="px-2 py-1 rounded border text-xs font-mono"
                        :class="c.contrib > 4 ? 'border-red-500 bg-red-500/10 text-red-600' : 'border-border bg-muted/40 text-foreground'"
                      >
                        <span class="font-semibold">{{ fmtNum(c.o, 0) }}</span>
                        <span class="text-muted-foreground">（E={{ fmtNum(c.e, 2) }}，贡献 {{ fmtNum(c.contrib, 2) }}）</span>
                      </div>
                    </td>
                    <td class="py-2 font-mono font-semibold text-foreground">{{ fmtNum(indResult.rowTotals[i], 0) }}</td>
                  </tr>
                  <tr class="border-b border-border/50 bg-muted/30">
                    <td class="py-2 pr-3 text-foreground font-medium">列合计</td>
                    <td v-for="(t, j) in indResult.colTotals" :key="'c' + j" class="py-2 pr-3 font-mono font-semibold text-foreground">{{ fmtNum(t, 0) }}</td>
                    <td class="py-2 font-mono font-semibold text-foreground">{{ fmtNum(indResult.n, 0) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 2×2 附加：Yates 与 Fisher -->
            <div v-if="indResult.chi2Yates !== null" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4 border border-border">
                <p class="text-xs text-muted-foreground mb-1">Yates 连续性校正 χ²（仅 2×2）</p>
                <p class="text-lg font-bold font-mono text-foreground">{{ fmtNum(indResult.chi2Yates, 4) }} <span class="text-sm font-normal text-muted-foreground">p = {{ fmtP(indResult.pYates) }}</span></p>
                <p class="text-[10px] text-muted-foreground mt-1 leading-relaxed">对 |O−E| 各减 0.5 再平方，修正小样本下卡方偏保守的倾向；样本量大时与未校正几乎一致。</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 border border-border">
                <p class="text-xs text-muted-foreground mb-1">Fisher 精确检验（超几何双侧）</p>
                <p class="text-lg font-bold font-mono text-foreground">p = {{ fmtP(indResult.fisherP) }}</p>
                <p class="text-[10px] text-muted-foreground mt-1 leading-relaxed">不依赖卡方近似，期望频数小（&lt; 5）或理论占比极端时的首选；对所有边际合计相同的 2×2 表按「概率 ≤ 观测表」枚举求和。</p>
              </div>
            </div>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">{{ indError }}</p>
          </div>
        </div>

        <button
          v-if="activeResult"
          type="button"
          @click="copyResult"
          class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition flex items-center gap-1.5"
        >
          <Copy class="w-3.5 h-3.5" /> 复制检验结果
        </button>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 期望频数 E &lt; 5 怎么办
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">合并类别</span>：把理论占比小的相邻类合并，直到合并后 E ≥ 5（注意合并后 df 相应减少）。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">换 Fisher 精确检验</span>：2×2 表直接用超几何精确 p 值（本页已内置）；R×C 可用蒙特卡洛重抽样。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">加大样本</span>：E 与总样本量成正比，翻倍采样通常最直接。</span>
            </li>
          </ul>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            经验阈值：所有 E ≥ 5 卡方近似可靠；1 ≤ E &lt; 5 谨慎（用 Yates 或 Fisher）；有 E &lt; 1 必须换方法。
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <AlertTriangle class="w-5 h-5 mr-2 text-amber-500" /> 卡方检验三大坑
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">输入是频数</span>：占比、均值、连续测量值都不能直接进卡方检验；先按类别计数。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">独立观测</span>：同一受试者重复计数会高估显著性；配对设计该用 McNemar 检验。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">显著 ≠ 相关强</span>：n 大时微弱偏离也显著，看 Cramér's V = √(χ²/(n·min(R−1,C−1))) 判断强度。</span>
            </li>
          </ul>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">相关工具</h2>
          <NuxtLink to="/tools/t-test-calculator" class="block p-3 rounded-lg border border-border bg-muted/40 hover:border-primary/40 transition text-sm">
            <span class="font-medium text-foreground">t 检验计算器 →</span>
            <p class="text-xs text-muted-foreground mt-1">连续数据的均值比较（卡方处理的是分类频数）</p>
          </NuxtLink>
          <NuxtLink to="/tools/anova-calculator" class="block p-3 rounded-lg border border-border bg-muted/40 hover:border-primary/40 transition text-sm">
            <span class="font-medium text-foreground">方差分析计算器 →</span>
            <p class="text-xs text-muted-foreground mt-1">多组连续数据的均值比较</p>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12">
      <summary class="cursor-pointer text-xl font-bold text-foreground select-none"><span class="text-primary mr-2">#</span>卡方检验公式、FAQ 与参考</summary>
      <div class="mt-4">
        <h2 class="text-2xl font-bold text-foreground mb-4">卡方检验计算器说明</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          卡方检验回答「观测频数与理论期望差多远」：χ² = Σ(O−E)²/E，df 由模型决定（拟合优度 k−1，独立性 (R−1)(C−1)）。
          p 值 = P(χ²_df ≥ χ²)，通过正则化不完全伽马 P(df/2, x/2) 计算（x 小用级数、x 大用 Lentz 连分式，双精度衔接）。
          2×2 表的 Fisher 精确检验对超几何分布逐表枚举求和，与 R fisher.test 同口径。
          孟德尔 9:3:3:1 数据（χ²=0.4700，df=3，p=0.9254）为内置锚点。全部计算在浏览器本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">公式汇总</h3>
        <div class="bg-muted/50 rounded-lg p-4 border border-border space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p><span class="font-mono text-foreground font-semibold">统计量</span>：χ² = Σ (Oᵢ − Eᵢ)² / Eᵢ（频数型数据，非负计数）</p>
          <p><span class="font-mono text-foreground font-semibold">拟合优度</span>：Eᵢ = N × 比例ᵢ/Σ比例（默认均匀 Eᵢ = N/k），df = k − 1</p>
          <p><span class="font-mono text-foreground font-semibold">独立性</span>：Eᵢⱼ = 行合计ᵢ × 列合计ⱼ / 总数，df = (R−1)(C−1)</p>
          <p><span class="font-mono text-foreground font-semibold">Yates 校正（2×2）</span>：χ² = Σ (|Oᵢ − Eᵢ| − 0.5)² / Eᵢ，df = 1</p>
          <p><span class="font-mono text-foreground font-semibold">Fisher 精确（2×2）</span>：P(a=k) = C(r₁,k)·C(r₂,c₁−k)/C(n,c₁)，双侧 p = Σ P(a=k)（P ≤ P(观测)）</p>
          <p><span class="font-mono text-foreground font-semibold">p 值</span>：P(χ²_df ≥ x) = Q(df/2, x/2) = 1 − P(df/2, x/2)（正则化不完全伽马）</p>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">期望频数小于 5 一定不能用卡方吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">「所有 E ≥ 5」是保守经验线。E 在 1~5 之间时近似已经偏保守，配合 Yates 校正或 Fisher 精确检验仍可用；有 E &lt; 1 则必须换方法。df 大（如 8×8 表）时少量 E 略小于 5 影响有限，多数 E ≥ 5 即可。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">拟合优度与独立性检验的区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">拟合优度是「一组频数 vs 一个理论分布」（单变量，df = k−1）；独立性是「按两个变量交叉分类的频数表是否相关」（双变量，df = (R−1)(C−1)），期望由数据自身的边际合计决定而非外部理论。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">Yates 校正什么时候用？</h3>
            <p class="text-sm text-muted-foreground mt-1">仅 2×2 表，且任一格期望频数较小（如 &lt; 5 或接近 5）时考虑使用；它让 p 值更保守。样本量大时校正与否几乎无差别，现代统计软件（R 默认）对 2×2 更推荐直接用 Fisher 精确检验。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">Fisher 精确检验的 p 值为什么和卡方差很多？</h3>
            <p class="text-sm text-muted-foreground mt-1">Fisher 不做任何大样本近似，直接按超几何分布精确枚举；小样本下卡方近似系统性偏乐观（χ² 偏大），Fisher 更可信。两种口径都给出时，小样本优先引用 Fisher。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">贡献热力标色怎么用？</h3>
            <p class="text-sm text-muted-foreground mt-1">每格贡献 (O−E)²/E 相加等于 χ²。贡献 &gt; 4 的格对总体显著性的「贡献」最大（自由度 1 的 0.05 临界值恰为 3.84），标红格就是「哪里偏离了」的直接答案，比只看总 χ² 更有诊断价值。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。频数解析、χ²、p 值与 Fisher 枚举全部在你的浏览器本地计算，不发送任何网络请求，输入数据不被存储或上传。</p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">参考来源</h3>
        <ul class="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>Pearson, K. (1900). On the criterion that a given system of deviations… Phil. Mag. 50.</li>
          <li>Yates, F. (1934). Contingency tables involving small numbers… JRSS Suppl. 1.</li>
          <li>Fisher, R. A. (1922). On the interpretation of χ² from contingency tables… JRSS 85.</li>
          <li>孟德尔豌豆试验 9:3:3:1 比率（315:108:101:32）经典算例</li>
          <li>不完全伽马级数/连分式与 Lentz 算法：Numerical Recipes §6.2；R chisq.test / fisher.test 同口径验证</li>
        </ul>
      </div>
    </details>

    <RelatedTools :currentToolId="'chi-square-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Grid3x3, Info, AlertTriangle, CheckCircle, Copy } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// ---------- logGamma（Lanczos g=7） ----------
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

// ---------- 不完全伽马（级数 + Lentz 连分式双段） ----------
// 级数段：P(a,x) = e^{−x}x^a/Γ(a) · Σ xⁿ/((a+1)(a+2)…)
function gammapSeries(a, x) {
  let ap = a
  let sum = 1 / a
  let del = sum
  for (let n = 1; n < 5000; n++) {
    ap += 1
    del *= x / ap
    sum += del
    if (Math.abs(del) < Math.abs(sum) * 1e-17) break
  }
  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a))
}

// 连分式段：Q(a,x) = e^{−x}x^a/Γ(a) · CF（Lentz 修正连分式）
function gammapCf(a, x) {
  const FPMIN = 1e-300
  let b = x + 1 - a
  let c = 1 / FPMIN
  let d = 1 / b
  let h = d
  for (let i = 1; i < 5000; i++) {
    const an = -i * (i - a)
    b += 2
    d = an * d + b
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = b + an / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < 1e-17) break
  }
  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h
}

// 正则化下不完全伽马 P(a,x)
function gammap(a, x) {
  if (!(a > 0) || !Number.isFinite(x) || x < 0) return NaN
  if (x === 0) return 0
  if (x < a + 1) return gammapSeries(a, x)
  return 1 - gammapCf(a, x)
}

// 正则化上不完全伽马 Q(a,x) = 1 − P(a,x)（直接算上尾，保远尾精度）
function gammapQ(a, x) {
  if (!(a > 0) || !Number.isFinite(x) || x < 0) return NaN
  if (x === 0) return 1
  if (x < a + 1) return 1 - gammapSeries(a, x)
  return gammapCf(a, x)
}

// 卡方分布 CDF / 上尾（p 值）= Q(df/2, x/2)
function chiSquareCdf(x, df) {
  if (!Number.isFinite(x) || x <= 0 || !(df > 0)) return x <= 0 ? 0 : NaN
  return gammap(df / 2, x / 2)
}

function chiSquareSf(x, df) {
  if (!Number.isFinite(x) || !(df > 0)) return NaN
  if (x <= 0) return 1
  return gammapQ(df / 2, x / 2)
}

// ---------- Fisher 精确检验（2×2，超几何双侧，与 R fisher.test 同口径） ----------
function fisherExact2x2(a, b, c, d) {
  const n = a + b + c + d
  const r1 = a + b
  const r2 = c + d
  const c1 = a + c
  const c2 = b + d
  if (!(n > 0) || r1 <= 0 || r2 <= 0 || c1 <= 0 || c2 <= 0) return 1
  const lnAll = logGamma(r1 + 1) + logGamma(r2 + 1) + logGamma(c1 + 1) + logGamma(c2 + 1) - logGamma(n + 1)
  const cellLogp = (k) => lnAll - logGamma(k + 1) - logGamma(r1 - k + 1) - logGamma(c1 - k + 1) - logGamma(r2 - c1 + k + 1)
  const logp0 = cellLogp(a)
  const kmin = Math.max(0, c1 - r2)
  const kmax = Math.min(r1, c1)
  let p = 0
  for (let k = kmin; k <= kmax; k++) {
    const lp = cellLogp(k)
    if (lp <= logp0 + 1e-9) p += Math.exp(lp)
  }
  return Math.min(1, p)
}

// ---------- 基础统计与宽容解析 ----------
function parseNums(text) {
  if (typeof text !== 'string') return []
  return text.split(/[\s,;，；、]+/).map(s => s.trim()).filter(s => s.length > 0)
    .map(Number).filter(Number.isFinite)
}

// ---------- 卡方检验 ----------
// 拟合优度：obs 观测频数，ratios 可选期望比例（自动归一化；null → 均匀）
function gofChiSquare(obs, ratios) {
  const k = obs.length
  if (!(k >= 2)) return null
  const N = obs.reduce((s, v) => s + v, 0)
  if (!(N > 0)) return null
  let es
  if (Array.isArray(ratios) && ratios.length === k && ratios.every(r => Number.isFinite(r) && r >= 0) && ratios.reduce((s, v) => s + v, 0) > 0) {
    const sr = ratios.reduce((s, v) => s + v, 0)
    es = ratios.map(r => r / sr * N)
  } else {
    es = obs.map(() => N / k)
  }
  let chi2 = 0
  const cells = []
  for (let i = 0; i < k; i++) {
    if (!(es[i] > 0)) return null
    const contrib = (obs[i] - es[i]) * (obs[i] - es[i]) / es[i]
    chi2 += contrib
    cells.push({ o: obs[i], e: es[i], contrib })
  }
  const df = k - 1
  return { chi2, df, p: chiSquareSf(chi2, df), cells, n: N }
}

// 独立性：rows 为 R×C 频数矩阵；2×2 时附 Yates 与 Fisher
function independenceChiSquare(rows) {
  const R = rows.length
  if (!(R >= 2)) return null
  const C = rows[0].length
  if (!(C >= 2) || !rows.every(r => r.length === C)) return null
  const rowTotals = rows.map(r => r.reduce((s, v) => s + v, 0))
  const colTotals = []
  for (let j = 0; j < C; j++) {
    let s = 0
    for (let i = 0; i < R; i++) s += rows[i][j]
    colTotals.push(s)
  }
  const n = rowTotals.reduce((s, v) => s + v, 0)
  if (!(n > 0) || rowTotals.some(v => !(v > 0)) || colTotals.some(v => !(v > 0))) return null
  let chi2 = 0
  let chi2Yates = 0
  const cells = []
  for (let i = 0; i < R; i++) {
    const line = []
    for (let j = 0; j < C; j++) {
      const e = rowTotals[i] * colTotals[j] / n
      const o = rows[i][j]
      const contrib = (o - e) * (o - e) / e
      chi2 += contrib
      chi2Yates += (Math.abs(o - e) - 0.5) * (Math.abs(o - e) - 0.5) / e
      line.push({ o, e, contrib })
    }
    cells.push(line)
  }
  const df = (R - 1) * (C - 1)
  return {
    chi2, df, p: chiSquareSf(chi2, df),
    chi2Yates: R === 2 && C === 2 ? chi2Yates : null,
    pYates: R === 2 && C === 2 ? chiSquareSf(chi2Yates, 1) : null,
    fisherP: R === 2 && C === 2 ? fisherExact2x2(rows[0][0], rows[0][1], rows[1][0], rows[1][1]) : null,
    cells, rowTotals, colTotals, n
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
  if (p === null || p === undefined || !Number.isFinite(p)) return { text: '—', cls: 'bg-muted text-muted-foreground' }
  if (p < 0.001) return { text: 'p < 0.001（*** 极显著）', cls: 'bg-green-500/10 text-green-600' }
  if (p < 0.01) return { text: 'p < 0.01（** 高度显著）', cls: 'bg-green-500/10 text-green-600' }
  if (p < 0.05) return { text: 'p < 0.05（* 显著）', cls: 'bg-amber-500/10 text-amber-600' }
  return { text: `p = ${fmtP(p)}（ns 不显著）`, cls: 'bg-muted text-muted-foreground' }
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '卡方检验计算器 - 拟合优度/独立性检验(含Yates校正与Fisher精确)在线工具',
  description: '在线卡方检验计算器：拟合优度检验(自定义期望比例,默认均匀)与R×C列联表独立性检验(2×2~5×5行内粘贴)，自动算期望频数E=行×列/总，每格贡献热力标色定位偏离，2×2附Yates连续性校正与Fisher精确检验(超几何双侧)；p值基于不完全伽马双精度计算，孟德尔9:3:3:1数据χ²=0.4700、p=0.9254锚点复现，纯浏览器本地计算。',
  keywords: '卡方检验计算器,chi square test,拟合优度检验,独立性检验,列联表,yates校正,fisher精确检验,期望频数,卡方分布p值',
  author: '有条工具',
  ogTitle: '卡方检验计算器 - 拟合优度/独立性检验 | 有条工具',
  ogDescription: 'R×C 列联表行内粘贴、贡献热力标色、Yates 校正与 Fisher 精确检验，期望频数建议一应俱全。',
  ogUrl: 'https://www.util.cn/tools/chi-square-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '卡方检验计算器',
  twitterDescription: '拟合优度与独立性卡方检验，Yates 校正与 Fisher 精确 p 值。'
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
          name: '卡方检验计算器',
          url: 'https://www.util.cn/tools/chi-square-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '拟合优度检验：观测频数 + 自定义期望比例（默认均匀），df=k−1',
            '独立性检验：2×2~5×5 列联表行内粘贴，自动行列合计与期望频数',
            '每格贡献 (O−E)²/E 热力标色（贡献>4 标红）',
            '2×2 附 Yates 连续性校正与 Fisher 精确检验（超几何双侧）',
            '期望频数 E<5 自动警告并给出处理建议',
            'p 值基于正则化不完全伽马（级数+Lentz 连分式双段）双精度计算',
            '孟德尔 9:3:3:1 锚点精确复现（χ²=0.4700, p=0.9254）',
            '纯浏览器本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '卡方检验计算器', item: 'https://www.util.cn/tools/chi-square-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '期望频数小于 5 一定不能用卡方吗？',
              acceptedAnswer: { '@type': 'Answer', text: '「所有 E≥5」是保守经验线。E 在 1~5 之间配合 Yates 校正或 Fisher 精确检验仍可用；有 E<1 必须换方法。合并相邻类别、加大样本或改用 Fisher 是标准处理。' }
            },
            {
              '@type': 'Question',
              name: '拟合优度与独立性检验的区别？',
              acceptedAnswer: { '@type': 'Answer', text: '拟合优度是一组频数 vs 一个理论分布（单变量，df=k−1，期望来自外部理论）；独立性检验是按两个变量交叉分类的频数表是否相关（df=(R−1)(C−1)，期望由数据边际合计决定）。' }
            },
            {
              '@type': 'Question',
              name: 'Fisher 精确检验的 p 值为什么和卡方差很多？',
              acceptedAnswer: { '@type': 'Answer', text: 'Fisher 不做大样本近似，按超几何分布精确枚举；小样本下卡方近似系统性偏乐观。小样本优先引用 Fisher 的结果。' }
            },
            {
              '@type': 'Question',
              name: '贡献热力标色怎么用？',
              acceptedAnswer: { '@type': 'Answer', text: '每格贡献 (O−E)²/E 相加等于总 χ²；贡献>4 的格（超过 df=1 的 0.05 临界值 3.84）标红，即为偏离独立/期望的主要来源。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'chi-square-calculator'
const SETTINGS_KEY = `${TOOL_ID}-settings`

const MODES = [
  { id: 'gof', label: '拟合优度' },
  { id: 'ind', label: '独立性 (R×C)' }
]

// ---------- 状态（预填孟德尔与 2×2 经典算例） ----------
const mode = ref('gof')
const gofObs = ref('315, 108, 101, 32')
const gofRatio = ref('9, 3, 3, 1')
const indTable = ref('12, 5\n7, 10')

// ---------- 解析与结果 ----------
const gofObsParsed = computed(() => parseNums(gofObs.value))
const gofRatioParsed = computed(() => {
  const t = gofRatio.value.trim()
  if (!t) return null
  return parseNums(t)
})

const gofResult = computed(() => {
  if (gofObsParsed.value.length < 2) return null
  return gofChiSquare(gofObsParsed.value, gofRatioParsed.value)
})

const gofError = computed(() => {
  if (gofObsParsed.value.length < 2) return '请输入至少 2 个类别的观测频数（正数计数）。'
  if (gofRatioParsed.value !== null && gofRatioParsed.value.length !== gofObsParsed.value.length) {
    return `期望比例个数（${gofRatioParsed.value.length}）与观测频数个数（${gofObsParsed.value.length}）不一致。`
  }
  return '观测频数需为非负数且总和大于 0；比例需非负且不同时为 0。'
})

const indParsed = computed(() => {
  const rows = []
  for (const raw of indTable.value.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const cells = parseNums(line)
    if (cells.length > 0) rows.push(cells)
  }
  return rows
})

const indResult = computed(() => {
  const rows = indParsed.value
  if (rows.length < 2) return null
  if (!rows.every(r => r.length === rows[0].length)) return null
  return independenceChiSquare(rows)
})

const indError = computed(() => {
  const rows = indParsed.value
  if (rows.length < 2) return '请输入至少 2 行频数，每行用逗号 / 空格分隔各列。'
  if (!rows.every(r => r.length === rows[0].length)) return `各行列数不一致（检测到 ${rows.map(r => r.length).join('、')}），请保证每行列数相同。`
  if (rows.length > 6 || rows[0].length > 6) return `表格为 ${rows.length}×${rows[0].length}，本工具支持 2×2 至 5×5（至多演示 6×6）。`
  if (indResult.value === null) return '频数需非负，且每行每列合计大于 0（存在全 0 行/列时无法计算）。'
  return '输入未能解析为有效的频数表。'
})

const activeResult = computed(() => (mode.value === 'gof' ? gofResult.value : indResult.value))

// ---------- 复制 ----------
async function copyResult() {
  let text = ''
  if (mode.value === 'gof' && gofResult.value) {
    const r = gofResult.value
    text = `拟合优度卡方检验: χ²=${r.chi2.toFixed(4)}, df=${r.df}, p=${fmtP(r.p)}, N=${r.n}`
  } else if (indResult.value) {
    const r = indResult.value
    text = `独立性卡方检验 (${r.cells.length}×${r.cells[0].length}): χ²=${r.chi2.toFixed(4)}, df=${r.df}, p=${fmtP(r.p)}`
    if (r.chi2Yates !== null) text += `, Yates χ²=${r.chi2Yates.toFixed(4)} (p=${fmtP(r.pYates)}), Fisher p=${fmtP(r.fisherP)}`
  }
  if (!text) return
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
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([mode], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ mode: mode.value }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})
</script>
