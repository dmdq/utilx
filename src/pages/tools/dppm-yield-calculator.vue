<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sigma class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">DPPM良率计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">DPPM 与良率双向换算、真不良率置信上限（TI 口径）与多工序滚动良率</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        三个模块一站式算清出厂质量：① 观测换算——输入总数 N 与不良数 f，得到 DPPM、良率与 ppm 直读，反向按目标 DPPM 求允许不良数；
        ② 置信上限——按 TI 可靠性计算器口径给出真不良率的单侧置信上限（f = 0 用精确闭式 −ln(1−c)/N，f &gt; 0 用卡方上界 χ²(2(f+1), 1−c)/(2N)）；
        ③ 多工序滚动良率——各站良率连乘得总良率与等效 DPPM，定位最差一站并量化提升收益。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        观测 DPPM（f/N×10⁶）是这批样本的估计值；要对「真实不良率」做保守断言，请用置信上限模块。
        卡方分位数通过对不完全伽马函数数值求逆实现（自实现，无外部依赖），与 TI 可靠性计算器的工程口径一致。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 模块①：观测换算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Percent class="w-5 h-5 mr-2 text-primary" /> 观测换算（DPPM ⇄ 良率）
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="dppm-n" class="block text-sm font-medium text-foreground mb-1.5">总数 N（送测 / 出货只数）</label>
              <input
                id="dppm-n"
                v-model.number="obsN"
                type="number"
                min="1"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 10000"
              >
            </div>
            <div>
              <label for="dppm-f" class="block text-sm font-medium text-foreground mb-1.5">不良数 f</label>
              <input
                id="dppm-f"
                v-model.number="obsF"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 30"
              >
            </div>
          </div>
          <p v-if="obsN > 0 && obsF > obsN" class="text-xs text-red-600 dark:text-red-400">不良数 f 不能大于总数 N</p>

          <template v-if="obsValid">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">观测 DPPM = f/N × 10⁶</p>
                <p class="text-2xl font-bold text-primary">{{ fmtDppm(obsDppm) }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">良率 = (1 − f/N) × 100%</p>
                <p class="text-2xl font-bold text-foreground">{{ fmtPct(obsYieldPct) }}%</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg p-2.5">
              直读口径：不良概率 p = {{ obsP }}，每 100 万只中约 {{ Math.round(obsDppm).toLocaleString('zh-CN') }} 只不良（ppm 同值），
              每 1 万只中约 {{ Math.round(obsDppm / 100).toLocaleString('zh-CN') }} 只不良。
            </p>
          </template>

          <div class="pt-2 border-t border-border/50">
            <p class="text-sm font-medium text-foreground mb-2.5">反向：按目标 DPPM 求允许不良数</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="dppm-target" class="block text-xs text-muted-foreground mb-1">目标 DPPM</label>
                <input
                  id="dppm-target"
                  v-model.number="revDppm"
                  type="number"
                  min="0"
                  step="100"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 5000"
                >
              </div>
              <div>
                <label for="dppm-revn" class="block text-xs text-muted-foreground mb-1">批量 N</label>
                <input
                  id="dppm-revn"
                  v-model.number="revN"
                  type="number"
                  min="1"
                  step="1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 10000"
                >
              </div>
            </div>
            <template v-if="revValid">
              <div class="mt-3 flex items-center gap-3 bg-primary/10 rounded-lg p-3">
                <CheckCircle class="w-5 h-5 text-primary flex-shrink-0" />
                <p class="text-sm text-foreground">
                  允许不良数（向下取整）= <span class="font-bold text-primary">{{ revAllowed }}</span> 只，
                  对应实际观测 DPPM = <span class="font-mono">{{ fmtDppm(revActualDppm) }}</span>；
                  一旦出现 {{ revAllowed + 1 }} 只不良即超出目标。
                </p>
              </div>
            </template>
          </div>
        </div>

        <!-- 模块②：置信上限 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <TrendingUp class="w-5 h-5 mr-2 text-primary" /> 置信上限（真不良率保守断言）
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="dppm-cn" class="block text-sm font-medium text-foreground mb-1.5">总数 N</label>
              <input
                id="dppm-cn"
                v-model.number="confN"
                type="number"
                min="1"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 1000"
              >
            </div>
            <div>
              <label for="dppm-cf" class="block text-sm font-medium text-foreground mb-1.5">不良数 f（≤500）</label>
              <input
                id="dppm-cf"
                v-model.number="confF"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 0"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">置信度</label>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="c in confOptions"
                  :key="c.v"
                  @click="conf = c.v"
                  :class="conf === c.v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-sm font-medium transition-all"
                >{{ c.label }}</button>
              </div>
            </div>
          </div>

          <p v-if="confF > confFMax" class="text-xs text-red-600 dark:text-red-400">
            置信上限支持 f ≤ 500（卡方求逆的数值稳定范围）；不良数更大时请直接引用观测 DPPM 并扩大样本。
          </p>
          <p v-else-if="confN > 0 && confF > confN" class="text-xs text-red-600 dark:text-red-400">不良数 f 不能大于总数 N</p>

          <template v-if="upperValid">
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">
                真实不良率单侧置信上限（置信度 {{ confPercent }}%）
              </p>
              <p class="text-3xl font-bold text-primary">{{ fmtDppm(upperDppm) }} <span class="text-base font-medium text-muted-foreground">DPPM</span></p>
              <p class="text-xs text-muted-foreground mt-1.5">
                可断言：以 {{ confPercent }}% 置信度，真实不良率 ≤ {{ fmtDppm(upperDppm) }} DPPM，即上限不良率 ≤ {{ fmtPct(upperYieldPct) }}%
              </p>
            </div>
            <div class="text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg p-2.5 space-y-1">
              <p>
                算法：<template v-if="confF === 0">f = 0 精确闭式 −ln(1−c)/N × 10⁶ = {{ fmtDppm(upperDppm) }} DPPM</template><template v-else>卡方上界 χ²(2(f+1), 1−c) / (2N) × 10⁶，其中 χ²({{ 2 * (confF + 1) }}, {{ confPercent }}%) = {{ chi2Val.toFixed(5) }}</template>
              </p>
              <p>同一组 N、f，置信度从 60% 提到 90%，上限约放大 2.5 倍——对外承诺前先确认客户要求的置信口径。</p>
            </div>
            <div class="flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-lg p-3">
              <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p class="text-xs leading-relaxed text-muted-foreground">
                口径注记：观测 DPPM 是样本估计，置信上限才是对真不良率的保守断言；DPPM 管出厂质量，现场可靠性用 FIT。
              </p>
            </div>
            <button
              @click="copyUpper"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
            >
              <Copy class="w-3.5 h-3.5" /> 复制置信上限结论
            </button>
          </template>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 模块③：多工序滚动良率 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <Calculator class="w-4 h-4 mr-2 text-primary" /> 多工序滚动良率
          </h3>

          <div class="space-y-2">
            <div
              v-for="(row, idx) in rows"
              :key="idx"
              class="flex items-center gap-1.5 rounded-lg p-1.5 transition"
              :class="rolling && rolling.worstIdx === idx ? 'ring-1 ring-red-400 bg-red-500/5' : ''"
            >
              <input
                v-model="row.name"
                type="text"
                class="flex-1 min-w-0 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="工序名"
              >
              <input
                v-model.number="row.y"
                type="number"
                min="0"
                max="100"
                step="0.1"
                class="w-16 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="95"
              >
              <span class="text-xs text-muted-foreground flex-shrink-0">%</span>
              <button
                @click="removeRow(idx)"
                class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition"
                :aria-label="'删除工序 ' + (row.name || idx + 1)"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="addRow"
              class="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
            >
              <Plus class="w-3.5 h-3.5" /> 添加工序
            </button>
            <button
              @click="loadPreset"
              class="flex-1 py-2 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
            >示例：CP/FT/老化</button>
          </div>
          <p v-if="rolling && rolling.invalidCount > 0" class="text-xs text-yellow-600 dark:text-yellow-400">
            {{ rolling.invalidCount }} 行良率无效（需为 0~100 的数值），已从计算中剔除
          </p>

          <template v-if="rolling">
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">总良率 = ∏ 各站良率</p>
              <p class="text-2xl font-bold text-primary">{{ fmtPct(rolling.totalPct) }}%</p>
              <p class="text-xs text-muted-foreground mt-1">等效总 DPPM = {{ fmtDppm(rolling.totalDppm) }}</p>
            </div>
            <p v-if="rolling.worstName" class="text-xs leading-relaxed text-muted-foreground bg-muted/50 border border-border rounded-lg p-2.5">
              最差一站：<span class="text-red-600 dark:text-red-400 font-medium">{{ rolling.worstName }}（{{ fmtPct(rolling.worstY) }}%）</span><template v-if="rolling.improve">。
                若提升到次差站「{{ rolling.improve.secondName }}」水平（{{ fmtPct(rolling.improve.secondY) }}%），
                总良率可达 {{ fmtPct(rolling.improve.newTotalPct) }}%（+{{ rolling.improve.gainPp.toFixed(2) }}pp）——
                瓶颈站收益最大</template><template v-else>，各站良率相同或仅一站有效</template>。
            </p>
          </template>
          <div v-else class="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            至少填入一行有效良率（0~100%）
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <LinkIcon class="w-4 h-4 mr-2 text-primary" /> 相关工具
          </h3>
          <div class="space-y-2">
            <NuxtLink
              v-for="t in relatedLinks"
              :key="t.id"
              :to="'/tools/' + t.id"
              class="block px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm text-foreground transition"
            >{{ t.name }}</NuxtLink>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>DPPM 是什么、怎么算？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          DPPM（Defects Per Million，百万分之不良）是电子产品出厂质量的标准口径：DPPM = 不良数 f ÷ 总数 N × 10⁶。
          与良率的换算是同一枚硬币的两面：良率 Y = (1 − f/N) × 100%，DPPM = (1 − Y) × 10⁶。
          例如 10,000 只出货中发现 30 只不良，DPPM = 3,000，良率 99.7%。反向也很常用：客户要求 DPPM ≤ 5,000、批量 10,000 只，
          则整批最多允许 ⌊5,000 × 10,000 ÷ 10⁶⌋ = 50 只不良。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>为什么零不良不等于零 DPPM？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          「这批 1,000 只全检无不良」并不代表真实不良率是 0——样本里没看到不良，只是说明不良率大概率低于某个界限。
          把 f 当作二项分布 B(N, p) 的观测值，对 p 做单侧置信估计：f = 0 时上限有精确闭式 p ≤ −ln(1−c)/N；
          f &gt; 0 时上限为卡方形式 p ≤ χ²(2(f+1), 1−c) / (2N)（等价于对不完全伽马函数数值求逆）。
          本工具与 TI 可靠性计算器采用同一口径。这就是「零不良 ≠ 零 DPPM」：可以宣称的是「不良率不超过上限」，而不是 0。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>60% 置信的行业惯例从哪来？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          60% 置信上限是 TI 等半导体厂商可靠性手册和 JEDEC 相关实践里常用的「典型值」口径：以 60% 置信报告的失效率叫典型失效率，
          用于规格书与内部目标；而面对客户协议、车规审核或安全相关承诺，通常要求 90% 甚至 60/90 双口径同时给出。
          注意置信度越高上限越松：同样 1,000 只零不良，60% 置信上限约 916 DPPM，90% 置信约 2,303 DPPM——
          承诺前先确认对方要的是哪个口径，否则数字会差 2.5 倍。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>滚动良率的乘法衰减</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          多道工序的总良率是各站良率的连乘积，不是相加：CP 95% × FT 98% × 老化 99% = 92.169%，等效总 DPPM = 78,310。
          站数越多总良率衰减越快（每站 99% 的十道工序总良率只有约 90.4%），这就是产线「处处都还行、总良率却很难看」的数学原因。
          也因此改善优先级应该给最差一站：把 95% 的 CP 提到 98%，总良率立涨约 2.9 个百分点，比任何中等站的大幅优化都划算——
          这正是本工具高亮最差站并给出「提升到次差站水平」收益测算的原因。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>DPPM、FIT 与 AQL 的区别</h2>
        <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground leading-relaxed mb-4">
          <li><span class="text-foreground font-medium">DPPM：</span>出厂缺陷率口径，管「这批货交出去之前」的质量水平，按只数计数。</li>
          <li><span class="text-foreground font-medium">FIT：</span>现场可靠性口径，单位是每 10⁹ 器件小时的失效数，管「出货之后在用户手里」的随机失效与寿命行为，与 DPPM 不能直接换算。</li>
          <li><span class="text-foreground font-medium">AQL：</span>抽样验收口径（GB/T 2828.1 / ISO 2859-1），管「用多大的抽检方案、按什么接收界限判定批合格」，是交易检验规则而不是质量水平本身。具体抽样方案可用
            <NuxtLink to="/tools/aql-sampling-calculator" class="text-primary hover:underline">AQL 抽样检验计算器</NuxtLink> 查询。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>抽检与全检的 DPPM 口径差异</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          全检（100% 检验）的 DPPM 直接由计数得到，是这批的观测值；抽检得到的 DPPM 是估计值，必须带置信区间或置信上限才有意义——
          同样是「抽 315 只发现 0 不良」，60% 与 90% 置信的上限差 2.5 倍。用 AQL 方案验收合格的批，其过程平均 DPPM 仍可能高于
          单批观测值，两者口径不能混用：AQL 回答「这批收不收」，DPPM 回答「这条线质量水平如何」，置信上限回答「最坏能差到哪」。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">零不良的 DPPM 上限怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              f = 0 时用精确闭式：上限 DPPM = −ln(1 − 置信度) ÷ N × 10⁶。例：N = 1,000、置信 60%，上限 = −ln(0.4)/1,000 × 10⁶ ≈ 916 DPPM；
              置信 90% 时 ≈ 2,303 DPPM。f &gt; 0 时改用卡方上界 χ²(2(f+1), 1−c)/(2N) × 10⁶。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">1000 只 0 不良能宣称多少 DPPM？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              按 60% 置信（典型口径）可以宣称「真实不良率 ≤ 约 916 DPPM」；按 90% 置信（保守/客户协议口径）只能宣称 ≤ 约 2,303 DPPM。
              任何情况下都不能宣称 0 DPPM——样本量决定可断言的下限，想宣称 ≤100 DPPM 大约需要约 6,000 只零不良（60% 置信）。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">良率和 DPPM 怎么换算？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              DPPM = (1 − 良率) × 10⁶，良率 = 1 − DPPM ÷ 10⁶。例：良率 99.7% → DPPM = 3,000；DPPM 500 → 良率 99.95%。
              多道工序时先把各站良率连乘得总良率，再换算等效 DPPM。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">DPPM 多少算好？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              看行业与料别：一般消费电子整机组厂对元器件常见要求数百到数千 DPPM；手机、汽车电子的关键物料普遍要求两位数甚至个位数 DPPM；
              车规与医疗对安全件的要求最严。同样是 1,000 DPPM，对阻容料可能偏松、对 MCU 可能已是优秀水平，务必对照客户规格。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'dppm-yield-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Sigma, Percent, TrendingUp, Calculator, Info, CheckCircle,
  Link as LinkIcon, ChevronUp, ChevronDown, Copy, Plus, X, AlertTriangle
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'dppm-yield-calculator'
const STORAGE_KEY = 'dppm-yield-calculator.inputs'

// SEO
useSeoMeta({
  title: 'DPPM良率计算器 - DPPM与良率换算、置信上限、多工序滚动良率',
  description: '在线 DPPM 计算器：观测 DPPM 与良率双向换算、按 TI 口径计算真不良率置信上限（f=0 闭式与卡方上界，自实现不完全伽马求逆）、多工序滚动良率与最差站收益分析，纯本地计算',
  keywords: 'dppm计算, 良率计算, 百万分之不良, 置信区间不良率, 卡方置信上限, 零不良dppm, 测试良率, dppm calculator, yield calculator',
  author: 'Util工具箱',
  ogTitle: 'DPPM良率计算器 - 有条工具',
  ogDescription: 'DPPM 与良率双向换算、真不良率置信上限与多工序滚动良率',
  ogUrl: 'https://www.util.cn/tools/dppm-yield-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'DPPM良率计算器',
  twitterDescription: 'DPPM 换算、置信上限与滚动良率，TI 口径'
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
          name: 'DPPM良率计算器',
          url: 'https://www.util.cn/tools/dppm-yield-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '观测 DPPM 与良率双向换算',
            '按目标 DPPM 求允许不良数',
            '真不良率单侧置信上限（60%/90%/95%）',
            'f=0 精确闭式与 f>0 卡方上界（TI 口径）',
            '多工序滚动良率与最差站收益分析'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: 'DPPM良率计算器', item: 'https://www.util.cn/tools/dppm-yield-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '零不良的 DPPM 上限怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: 'f=0 时上限 DPPM = −ln(1−置信度) ÷ N × 10⁶；f>0 时用卡方上界 χ²(2(f+1), 1−c)/(2N) × 10⁶。' }
            },
            {
              '@type': 'Question',
              name: '1000 只 0 不良能宣称多少 DPPM？',
              acceptedAnswer: { '@type': 'Answer', text: '60% 置信可宣称真实不良率 ≤ 约 916 DPPM，90% 置信 ≤ 约 2,303 DPPM；任何情况都不能宣称 0 DPPM。' }
            },
            {
              '@type': 'Question',
              name: '良率和 DPPM 怎么换算？',
              acceptedAnswer: { '@type': 'Answer', text: 'DPPM = (1 − 良率) × 10⁶，良率 = 1 − DPPM ÷ 10⁶；多道工序先连乘各站良率再换算。' }
            },
            {
              '@type': 'Question',
              name: 'DPPM 多少算好？',
              acceptedAnswer: { '@type': 'Answer', text: '看行业与料别：消费电子常见数百到数千 DPPM，手机/汽车电子关键物料要求两位数甚至个位数 DPPM。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === TOOL_ID)
onMounted(() => {
  addRecentTool(TOOL_ID)
  // 恢复上次输入
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (typeof s.obsN === 'number') obsN.value = s.obsN
      if (typeof s.obsF === 'number') obsF.value = s.obsF
      if (typeof s.revDppm === 'number') revDppm.value = s.revDppm
      if (typeof s.revN === 'number') revN.value = s.revN
      if (typeof s.confN === 'number') confN.value = s.confN
      if (typeof s.confF === 'number') confF.value = s.confF
      if (typeof s.conf === 'number') conf.value = s.conf
      if (Array.isArray(s.rows)) {
        const restored = s.rows
          .filter((r) => r && typeof r.y === 'number')
          .map((r) => ({ name: typeof r.name === 'string' ? r.name : '', y: r.y }))
        if (restored.length) rows.value = restored
      }
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})

// __PURE_FNS_START__
// ---------- 统计纯函数（无外部依赖） ----------
// 上不完全伽马 Q(a, x) = e^(-x) · Σ (x^m / m!)，a 为正整数（精确多项式展开）
const gammaUpperQInt = (a, x) => {
  let term = 1
  let sum = 1
  for (let m = 1; m < a; m++) {
    term *= x / m
    sum += term
  }
  return Math.exp(-x) * sum
}

// 偶自由度卡方分布分位数 χ²(df, p)：解 gammaUpperQInt(df/2, x/2) = 1 - p（单调，二分求逆）
const chi2QuantileEven = (df, p) => {
  const a = df / 2
  const q = 1 - p
  let lo = 0
  let hi = 1
  while (hi < 1e7 && gammaUpperQInt(a, hi / 2) > q) hi *= 2
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (gammaUpperQInt(a, mid / 2) > q) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// 真不良率单侧置信上限（TI 可靠性计算器口径），返回 DPPM
const upperBoundDppm = (n, f, conf) => {
  if (!(n >= 1) || !(f >= 0) || !(conf > 0 && conf < 1)) return NaN
  if (f === 0) return -Math.log(1 - conf) / n * 1e6
  const x = chi2QuantileEven(2 * (f + 1), conf)
  return x / (2 * n) * 1e6
}

// 反向：目标 DPPM + 批量 N → 允许不良数（向下取整）
const allowedDefects = (targetDppm, n) => {
  if (!(targetDppm >= 0) || !(n >= 1)) return NaN
  return Math.floor(targetDppm * n / 1e6)
}

// 多工序滚动良率：连乘 + 最差站与次差站收益
const rollingStats = (rows) => {
  const valid = []
  let invalidCount = 0
  rows.forEach((r, i) => {
    if (isFinite(r.y) && r.y > 0 && r.y <= 100) valid.push({ i, name: r.name, y: r.y })
    else invalidCount++
  })
  if (!valid.length) return null
  let total = 1
  for (const r of valid) total *= r.y / 100
  const sorted = [...valid].sort((a, b) => a.y - b.y)
  const worst = sorted[0]
  const second = sorted.length > 1 ? sorted[1] : null
  let improve = null
  if (second && second.y > worst.y) {
    const newTotal = total / (worst.y / 100) * (second.y / 100)
    improve = {
      secondName: second.name || '次差站',
      secondY: second.y,
      newTotalPct: newTotal * 100,
      gainPp: (newTotal - total) * 100
    }
  }
  return {
    totalPct: total * 100,
    totalDppm: (1 - total) * 1e6,
    worstIdx: worst.i,
    worstName: worst.name || `工序 ${worst.i + 1}`,
    worstY: worst.y,
    improve,
    invalidCount
  }
}

// 展示格式化（避免浮点尾差）
const fmtDppm = (v) => {
  if (!isFinite(v)) return '—'
  if (v >= 10000) return Math.round(v).toLocaleString('zh-CN')
  if (v >= 100) return (Math.round(v * 10) / 10).toLocaleString('zh-CN', { maximumFractionDigits: 1 })
  return (Math.round(v * 100) / 100).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}
const fmtPct = (v) => {
  if (!isFinite(v)) return '—'
  const s = v.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
  const parts = s.split('.')
  return parts.length === 2 && parts[1].length >= 2 ? s : v.toFixed(2)
}
// __PURE_FNS_END__

// ---------- 状态 ----------
const confOptions = [
  { v: 0.6, label: '60%' },
  { v: 0.9, label: '90%' },
  { v: 0.95, label: '95%' }
]
const confFMax = 500

const obsN = ref(10000)
const obsF = ref(30)
const revDppm = ref(5000)
const revN = ref(10000)
const confN = ref(1000)
const confF = ref(0)
const conf = ref(0.6)
const rows = ref([
  { name: 'CP', y: 95 },
  { name: 'FT', y: 98 },
  { name: '老化', y: 99 }
])

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 输入持久化（键前缀为工具 id）
watch([obsN, obsF, revDppm, revN, confN, confF, conf, rows], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      obsN: obsN.value,
      obsF: obsF.value,
      revDppm: revDppm.value,
      revN: revN.value,
      confN: confN.value,
      confF: confF.value,
      conf: conf.value,
      rows: rows.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}, { deep: true })

const addRow = () => { rows.value.push({ name: '', y: 98 }) }
const removeRow = (idx) => { rows.value.splice(idx, 1) }
const loadPreset = () => {
  rows.value = [
    { name: 'CP', y: 95 },
    { name: 'FT', y: 98 },
    { name: '老化', y: 99 }
  ]
}

const confPercent = computed(() => Math.round(conf.value * 100))

// ---------- 模块①：观测换算 ----------
const obsValid = computed(() => isFinite(obsN.value) && obsN.value >= 1 && isFinite(obsF.value) && obsF.value >= 0 && obsF.value <= obsN.value)
const obsDppm = computed(() => (obsValid.value ? obsF.value / obsN.value * 1e6 : NaN))
const obsYieldPct = computed(() => (obsValid.value ? (1 - obsF.value / obsN.value) * 100 : NaN))
const obsP = computed(() => (obsValid.value ? (obsF.value / obsN.value).toFixed(6) : '—'))

const revValid = computed(() => isFinite(revDppm.value) && revDppm.value >= 0 && isFinite(revN.value) && revN.value >= 1)
const revAllowed = computed(() => (revValid.value ? allowedDefects(revDppm.value, revN.value) : NaN))
const revActualDppm = computed(() => (revValid.value && revAllowed.value > 0 ? revAllowed.value / revN.value * 1e6 : (revValid.value ? 0 : NaN)))

// ---------- 模块②：置信上限 ----------
const upperValid = computed(() =>
  isFinite(confN.value) && confN.value >= 1 &&
  isFinite(confF.value) && confF.value >= 0 && confF.value <= Math.min(confN.value, confFMax) &&
  confOptions.some((o) => o.v === conf.value)
)
const upperDppm = computed(() => (upperValid.value ? upperBoundDppm(confN.value, confF.value, conf.value) : NaN))
const chi2Val = computed(() => (upperValid.value && confF.value > 0 ? chi2QuantileEven(2 * (confF.value + 1), conf.value) : NaN))
const upperYieldPct = computed(() => (upperValid.value ? upperDppm.value / 1e4 : NaN))

const copyUpper = () => {
  const method = confF.value === 0
    ? 'f=0 精确闭式 −ln(1−c)/N'
    : `卡方上界 χ²(2(f+1),1−c)/(2N)，χ²=${chi2Val.value.toFixed(5)}`
  const text = `N=${confN.value}、f=${confF.value}、置信度 ${confPercent.value}%：真实不良率单侧置信上限 ≤ ${fmtDppm(upperDppm.value)} DPPM（口径：${method}，与 TI 可靠性计算器一致）`
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制置信上限结论到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动选择文本复制')
    })
  } else {
    alert('当前环境不支持剪贴板，请手动选择文本复制')
  }
}

// ---------- 模块③：滚动良率 ----------
const rolling = computed(() => rollingStats(rows.value))

// ---------- 相关工具 ----------
const relatedLinks = computed(() => ['aql-sampling-calculator', 'ab-sample-size-calculator', 'tolerance-fit-lookup']
  .map((id) => tools.find((t) => t.id === id))
  .filter(Boolean))
</script>
