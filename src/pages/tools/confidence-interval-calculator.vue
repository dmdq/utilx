<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BarChart class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">置信区间计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">均值 CI（z/t 双口径）与比例 CI（Wald/Wilson 双口径），90/95/99/自定义置信水平，附 MOE 样本量再缩放表</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线置信区间计算器：均值的置信区间 x̄ ± 临界值·s/√n（σ 已知用 z 区间，σ 未知自动用 t 区间，df = n−1），
        比例的置信区间 p̂ ± z·√(p̂(1−p̂)/n)（Wald），n<30 或 np<5 时自动给 Wilson 分数区间并高亮说明。
        支持 90% / 95% / 99% 与自定义置信水平，输出区间、标准误、误差范围（MOE），
        并给「其他样本量 n 下的 MOE 对比表」帮你判断该收多少数据。95% 双侧 z = 1.959964、t(0.975, 24) = 2.063899 等锚点精确复现，
        分位数用逆 erf（牛顿精化）与不完全贝塔反解计算，双精度口径。全部计算在浏览器本地完成，不上传任何数据。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          <span class="font-semibold">95% 置信区间不是说「参数有 95% 概率落在这段里」</span>：
          频率学派的含义是——若反复抽样并按同一方法构造区间，约 95% 的区间会盖住真值。
          区间是随机的，参数是固定的，写报告时别把两件事说反。
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

        <!-- 置信水平选择（两种模式共用） -->
        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">置信水平</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="c in CONF_PRESETS"
              :key="c"
              type="button"
              @click="selectPreset(c)"
              class="px-3 py-1.5 rounded-lg border text-xs font-medium transition"
              :class="!useCustomConf && confLevel === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
            >{{ Math.round(c * 100) }}%</button>
            <button
              type="button"
              @click="useCustomConf = true"
              class="px-3 py-1.5 rounded-lg border text-xs font-medium transition"
              :class="useCustomConf ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
            >自定义…</button>
            <input
              v-if="useCustomConf"
              v-model.number="confCustom"
              type="number"
              min="50"
              max="99.9"
              step="0.5"
              class="w-24 px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <span v-if="useCustomConf" class="text-xs text-muted-foreground self-center">%（50 ~ 99.9）</span>
          </div>
        </div>

        <!-- 面板 ①：均值 CI -->
        <div v-if="mode === 'mean'" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="ci-xbar" class="block text-sm font-medium text-foreground mb-1.5">样本均值 x̄</label>
              <input id="ci-xbar" v-model.number="xbar" type="number" step="any" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 50" />
            </div>
            <div>
              <label for="ci-n" class="block text-sm font-medium text-foreground mb-1.5">样本量 n</label>
              <input id="ci-n" v-model.number="nMean" type="number" min="2" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 25" />
            </div>
            <div>
              <label for="ci-s" class="block text-sm font-medium text-foreground mb-1.5">{{ sigmaKnown ? '总体标准差 σ' : '样本标准差 s' }}</label>
              <input id="ci-s" v-model.number="sd" type="number" min="0" step="any" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 8" />
            </div>
          </div>
          <div>
            <p class="text-sm font-medium text-foreground mb-1.5">标准差口径</p>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                @click="sigmaKnown = false"
                class="py-2 rounded-lg border text-xs font-medium transition"
                :class="!sigmaKnown ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
              >σ 未知，用样本 s（t 区间）</button>
              <button
                type="button"
                @click="sigmaKnown = true"
                class="py-2 rounded-lg border text-xs font-medium transition"
                :class="sigmaKnown ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
              >σ 已知（z 区间）</button>
            </div>
            <p class="text-[11px] text-muted-foreground mt-1.5">
              何时用 t：总体标准差 σ 未知（绝大多数实际场景，用样本标准差 s 代替）时用 t 分布，n&lt;30 时必须用 t；
              n≥30 时 t 与 z 已很接近。只有 σ 确实已知（如工艺标准差受控）才用 z 区间。
            </p>
          </div>

          <div v-if="meanResult" class="space-y-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <p class="text-sm text-muted-foreground mb-1">
                {{ Math.round(confLevel * 100) }}% 置信区间（{{ meanResult.kind === 'z' ? 'z 区间' : `t 区间，df=${meanResult.df}` }}）
              </p>
              <p class="text-3xl font-bold text-primary font-mono">
                [ {{ fmtNum(meanResult.lo, 4) }}, {{ fmtNum(meanResult.hi, 4) }} ]
              </p>
              <p class="text-sm text-foreground mt-1 font-mono">
                x̄ ± MOE = {{ fmtNum(xbar, 4) }} ± {{ fmtNum(meanResult.moe, 4) }}
              </p>
              <p class="text-[11px] leading-relaxed text-muted-foreground mt-2">
                {{ meanResult.kind === 'z'
                  ? `z 区间：x̄ ± z·σ/√n，z = ${fmtNum(meanResult.crit, 6)}（逆 erf 牛顿精化）`
                  : `t 区间：x̄ ± t(α/2, df=n−1)·s/√n，t(${fmtNum((1 - confLevel) / 2, 4)} 校正后 = ${fmtNum(meanResult.crit, 6)})，df = ${meanResult.df}（不完全贝塔反解）` }}
              </p>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">标准误 SE</p>
                <p class="text-xl font-bold font-mono text-foreground">{{ fmtNum(meanResult.se, 6) }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">= {{ sigmaKnown ? 'σ' : 's' }} / √n</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">误差范围 MOE</p>
                <p class="text-xl font-bold font-mono text-foreground">{{ fmtNum(meanResult.moe, 6) }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">= 临界值 × SE</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">临界值</p>
                <p class="text-xl font-bold font-mono text-foreground">{{ fmtNum(meanResult.crit, 6) }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">{{ meanResult.kind === 'z' ? 'z(1−α/2)' : `t(1−α/2, ${meanResult.df})` }}</p>
              </div>
            </div>
            <button
              type="button"
              @click="copyMeanResult"
              class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制区间结果
            </button>

            <!-- n 再缩放表 -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm min-w-[480px]">
                <thead>
                  <tr class="text-left text-xs text-muted-foreground border-b border-border">
                    <th class="py-2 pr-3 font-medium">样本量 n</th>
                    <th class="py-2 pr-3 font-medium">自由度 / 临界值</th>
                    <th class="py-2 pr-3 font-medium">标准误 SE</th>
                    <th class="py-2 font-medium">MOE（{{ Math.round(confLevel * 100) }}%）</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in meanRescaleRows"
                    :key="row.n"
                    class="border-b border-border/50"
                    :class="row.n === nMean ? 'bg-primary/5' : ''"
                  >
                    <td class="py-2 pr-3 font-semibold text-foreground">{{ row.n }}{{ row.n === nMean ? '（当前）' : '' }}</td>
                    <td class="py-2 pr-3 font-mono text-muted-foreground">{{ row.critText }}</td>
                    <td class="py-2 pr-3 font-mono text-muted-foreground">{{ row.se }}</td>
                    <td class="py-2 font-mono text-foreground">{{ row.moe }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              MOE 与 1/√n 成正比：样本量翻 4 倍，误差范围减半。t 临界值随 df 增大向 z=1.959964 收敛。
            </p>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">请填写 n ≥ 2 的样本量与大于 0 的标准差，置信水平在 50% ~ 99.9% 之间。</p>
          </div>
        </div>

        <!-- 面板 ②：比例 CI -->
        <div v-else class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="ci-x" class="block text-sm font-medium text-foreground mb-1.5">「成功」数 x</label>
              <input id="ci-x" v-model.number="propX" type="number" min="0" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 45" />
            </div>
            <div>
              <label for="ci-propn" class="block text-sm font-medium text-foreground mb-1.5">总试验数 n</label>
              <input id="ci-propn" v-model.number="propN" type="number" min="1" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 100" />
            </div>
          </div>

          <div v-if="propResult" class="space-y-3">
            <!-- 推荐口径 -->
            <div
              class="p-4 rounded-lg border"
              :class="propResult.recommendWilson ? 'border-amber-500/40 bg-amber-500/10' : 'border-primary/30 bg-primary/10'"
            >
              <p class="text-sm mb-1 flex items-center gap-1.5" :class="propResult.recommendWilson ? 'text-amber-600' : 'text-muted-foreground'">
                <CheckCircle v-if="!propResult.recommendWilson" class="w-4 h-4 text-primary" />
                <AlertTriangle v-else class="w-4 h-4 text-amber-600" />
                {{ Math.round(confLevel * 100) }}% 置信区间 · {{ propResult.recommendWilson ? '推荐 Wilson 区间（小样本 / 稀疏计数条件触发）' : '推荐 Wald 区间（大样本且 np̂、n(1−p̂) ≥ 5）' }}
              </p>
              <p class="text-3xl font-bold text-primary font-mono">
                [ {{ fmtNum(propResult.primary.lo, 4) }}, {{ fmtNum(propResult.primary.hi, 4) }} ]
              </p>
              <p class="text-[11px] leading-relaxed mt-2" :class="propResult.recommendWilson ? 'text-amber-600' : 'text-muted-foreground'">
                {{ propResult.recommendWilson
                  ? `触发条件：n = ${propN} ${propN < 30 ? '< 30' : ''}${propResult.npSmall ? '、np̂ 或 n(1−p̂) < 5' : ''}。Wald 区间在边界附近会越界或过窄，改用 Wilson 分数区间（中心 ${(propResult.wilson.center * 100).toFixed(2)}% ± ${(propResult.wilson.half * 100).toFixed(2)}%）。`
                  : `Wald 区间：p̂ ± z·√(p̂(1−p̂)/n)，p̂ = ${fmtNum(propResult.primary.p, 4)}。` }}
              </p>
            </div>
            <!-- 对照口径 -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">Wald 区间</p>
                <p class="text-base font-bold font-mono text-foreground">[ {{ fmtNum(propResult.wald.lo, 4) }}, {{ fmtNum(propResult.wald.hi, 4) }} ]</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">Wilson 区间</p>
                <p class="text-base font-bold font-mono text-foreground">[ {{ fmtNum(propResult.wilson.lo, 4) }}, {{ fmtNum(propResult.wilson.hi, 4) }} ]</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">标准误 / MOE（Wald）</p>
                <p class="text-base font-bold font-mono text-foreground">{{ fmtNum(propResult.wald.se, 5) }} / {{ fmtNum(propResult.wald.moe, 5) }}</p>
              </div>
            </div>
            <button
              type="button"
              @click="copyPropResult"
              class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制区间结果
            </button>

            <div class="overflow-x-auto">
              <table class="w-full text-sm min-w-[420px]">
                <thead>
                  <tr class="text-left text-xs text-muted-foreground border-b border-border">
                    <th class="py-2 pr-3 font-medium">样本量 n</th>
                    <th class="py-2 pr-3 font-medium">标准误（p̂ 固定）</th>
                    <th class="py-2 font-medium">Wald MOE（{{ Math.round(confLevel * 100) }}%）</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in propRescaleRows"
                    :key="row.n"
                    class="border-b border-border/50"
                    :class="row.n === propN ? 'bg-primary/5' : ''"
                  >
                    <td class="py-2 pr-3 font-semibold text-foreground">{{ row.n }}{{ row.n === propN ? '（当前）' : '' }}</td>
                    <td class="py-2 pr-3 font-mono text-muted-foreground">{{ row.se }}</td>
                    <td class="py-2 font-mono text-foreground">{{ row.moe }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">请填写 0 ≤ x ≤ n 的成功数与 n ≥ 1 的试验总数。</p>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> z 区间 vs t 区间
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <p><span class="font-mono text-foreground font-semibold">z：x̄ ± z·σ/√n</span>　σ 已知</p>
            <p><span class="font-mono text-foreground font-semibold">t：x̄ ± t(α/2, n−1)·s/√n</span>　σ 未知</p>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            实际数据几乎总是 σ 未知 → 用 t。t 的尾巴比 z 粗，补偿了 s 对 σ 的估计误差：
            n=6 时 t(0.975, 5) = 2.570582 比 z = 1.959964 宽 31%；n=30 时 t(0.975, 29) = 2.045230 只宽 4%。
            「n ≥ 30 就能用 z」是 t 表时代的经验法则，如今直接算 t 没有任何成本。
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <AlertTriangle class="w-5 h-5 mr-2 text-amber-500" /> Wald 为什么会翻车
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">边界越界</span>：p̂ = 0.98、n = 50 时 Wald 上限 1.019 &gt; 1，概率超过 100%，显然荒谬；Wilson 天然落在 [0,1] 内。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">覆盖率不足</span>：名义 95% 的 Wald 区间在 p̂ 远离 0.5 时真实覆盖率可跌到 80% 以下；Wilson 的覆盖率始终接近名义水平。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">经验法则</span>：np̂ ≥ 5 且 n(1−p̂) ≥ 5 且 n ≥ 30 才放心用 Wald；否则本页自动切到 Wilson。</span>
            </li>
          </ul>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">相关工具</h2>
          <NuxtLink to="/tools/t-test-calculator" class="block p-3 rounded-lg border border-border bg-muted/40 hover:border-primary/40 transition text-sm">
            <span class="font-medium text-foreground">t 检验计算器 →</span>
            <p class="text-xs text-muted-foreground mt-1">均值的显著性检验与均值差的置信区间</p>
          </NuxtLink>
          <NuxtLink to="/tools/normal-distribution-calculator" class="block p-3 rounded-lg border border-border bg-muted/40 hover:border-primary/40 transition text-sm">
            <span class="font-medium text-foreground">正态分布计算器 →</span>
            <p class="text-xs text-muted-foreground mt-1">z 分位数与概率计算，z 区间的原理来源</p>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12">
      <summary class="cursor-pointer text-xl font-bold text-foreground select-none"><span class="text-primary mr-2">#</span>置信区间是什么？公式、FAQ 与参考</summary>
      <div class="mt-4">
        <h2 class="text-2xl font-bold text-foreground mb-4">置信区间计算器说明</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          置信区间用样本给未知参数一个「有把握的范围」：均值 CI 是 x̄ ± 临界值 × 标准误，
          比例 CI 是 p̂ ± z × √(p̂(1−p̂)/n)（Wald）或 Wilson 分数区间。临界值由置信水平决定：
          95% 双侧 z = 1.959964；σ 未知时改用 t 分布（df = n−1），95% 且 df=24 时 t = 2.063899。
          本页 z 分位数用逆误差函数牛顿精化、t 分位数用不完全贝塔反解（Lentz 连分式），
          双精度复现教科书锚点。全部计算在浏览器本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">公式汇总</h3>
        <div class="bg-muted/50 rounded-lg p-4 border border-border space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p><span class="font-mono text-foreground font-semibold">均值 z 区间</span>：x̄ ± z(1−α/2)·σ/√n（σ 已知）</p>
          <p><span class="font-mono text-foreground font-semibold">均值 t 区间</span>：x̄ ± t(1−α/2, n−1)·s/√n（σ 未知，df = n−1）</p>
          <p><span class="font-mono text-foreground font-semibold">Wald 比例区间</span>：p̂ ± z·√(p̂(1−p̂)/n)</p>
          <p><span class="font-mono text-foreground font-semibold">Wilson 区间</span>：(p̂ + z²/2n ± z·√(p̂(1−p̂)/n + z²/4n²)) / (1 + z²/n)</p>
          <p><span class="font-mono text-foreground font-semibold">标准误与 MOE</span>：SE = s/√n，MOE = 临界值 × SE；MOE ∝ 1/√n</p>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">什么时候用 t 区间而不是 z 区间？</h3>
            <p class="text-sm text-muted-foreground mt-1">只要总体标准差 σ 未知、用样本标准差 s 代替，就应该用 t 区间（df = n−1）；n &lt; 30 时必须用 t。n ≥ 30 时 t 与 z 的差别已经很小（95% 时约 4%），但仍建议直接用 t。只有 σ 确实已知（例如受控工艺的既定标准差）才使用 z 区间。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">95% 置信区间究竟是什么意思？</h3>
            <p class="text-sm text-muted-foreground mt-1">它不是说「真值有 95% 概率在这个区间里」——真值是固定数，区间才是随机的。正确表述：按同一方法反复抽样并构造区间，长期看约 95% 的区间会盖住真值。因此对同一批数据把置信水平从 95% 提到 99%，区间只会变宽（临界值从 1.96 升到 2.576），覆盖承诺才更可靠。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">样本量翻倍，误差范围减半吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不是。MOE 与 1/√n 成正比：样本量翻 4 倍 MOE 才减半。想精确控制 MOE，可以用 MOE(n) = z·σ/√n 反解 n = (z·σ/MOE)²。本页的 n 再缩放表列出了其他样本量下的 MOE 对比，可直接查。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">x = 0 或 x = n 时区间怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">此时 Wald 区间的标准误为 0，区间退化为一个点，明显失真。Wilson 区间仍能给出合理范围（例如 0/100 的 95% Wilson 上限约 3.7%）。本页在 np̂ &lt; 5 或 n(1−p̂) &lt; 5 或 n &lt; 30 时自动推荐 Wilson，并保留 Wald 作对照。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。均值、标准差、样本量与比例全部在你的浏览器本地计算，不发送任何网络请求，输入数值不被存储或上传。</p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">参考来源</h3>
        <ul class="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>NIST/SEMATECH e-Handbook of Statistical Methods, §7.2.2「Confidence Intervals」</li>
          <li>Wilson, E. B. (1927). Probable inference, the law of succession, and statistical inference. JASA 22.</li>
          <li>Brown, Cai &amp; DasGupta (2001). Interval estimation for a binomial proportion. Statistical Science 16.</li>
          <li>Student (W. S. Gosset, 1908) t 分布；分位数经不完全贝塔函数（Lentz 连分式，Numerical Recipes §6.4）数值反解</li>
        </ul>
      </div>
    </details>

    <RelatedTools :currentToolId="'confidence-interval-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { BarChart, Info, AlertTriangle, CheckCircle, Copy } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// ---------- 高精度标准正态（erf 级数 + 连分式，同 sigma-level-converter 页实现） ----------
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

// 上尾概率 Q(x) = 1 − Φ(x)
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

// 正态分位数：对 erf 基 normSf 先二分定界、再牛顿精化（上尾口径保对称）
function normQuant(p) {
  if (!Number.isFinite(p) || p <= 0 || p >= 1) return NaN
  const upper = p >= 0.5
  const tail = upper ? 1 - p : p // 上尾概率 ∈ (0, 0.5]
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

// 正则化不完全贝塔 I_x(a,b)
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

// t 分位数：对 tCdf 二分定界 + 牛顿精化（不完全贝塔反解），df ≥ 1e4 时退回正态
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

// ---------- 区间构造 ----------
// 均值 CI：sigmaKnown → z；否则 t（df=n−1）
function meanInterval(xbar, sdOrSigma, n, confLevel, sigmaKnown) {
  if (!(n >= 2) || !Number.isFinite(xbar) || !Number.isFinite(sdOrSigma) || sdOrSigma <= 0) return null
  if (!(confLevel > 0 && confLevel < 1)) return null
  const alpha = 1 - confLevel
  const se = sdOrSigma / Math.sqrt(n)
  if (sigmaKnown) {
    const z = normQuant(1 - alpha / 2)
    const moe = z * se
    return { kind: 'z', crit: z, df: null, se, moe, lo: xbar - moe, hi: xbar + moe }
  }
  const df = n - 1
  const t = tQuantile(1 - alpha / 2, df)
  const moe = t * se
  return { kind: 't', crit: t, df, se, moe, lo: xbar - moe, hi: xbar + moe }
}

// Wald 比例区间：p̂ ± z·√(p̂(1−p̂)/n)
function waldInterval(x, n, z) {
  if (!(n > 0) || !Number.isFinite(x) || x < 0 || x > n) return null
  const p = x / n
  const se = Math.sqrt(p * (1 - p) / n)
  const moe = z * se
  return { p, se, moe, lo: p - moe, hi: p + moe }
}

// Wilson 分数区间：(p̂+z²/2n ± z√(p̂(1−p̂)/n+z²/4n²))/(1+z²/n)
function wilsonInterval(x, n, z) {
  if (!(n > 0) || !Number.isFinite(x) || x < 0 || x > n) return null
  const p = x / n
  const z2 = z * z
  const denom = 1 + z2 / n
  const center = (p + z2 / (2 * n)) / denom
  const half = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / denom
  return { p, center, half, lo: Math.max(0, center - half), hi: Math.min(1, center + half) }
}

// ---------- 展示格式化 ----------
function fmtNum(v, d = 2) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return v.toFixed(d)
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '置信区间计算器 - 均值(z/t区间)与比例(Wald/Wilson区间)在线计算',
  description: '在线置信区间计算器：均值CI自动选z区间(σ已知)或t区间(σ未知,df=n−1)，比例CI给Wald与Wilson双口径并在n<30或np<5时高亮推荐Wilson；90/95/99/自定义置信水平，输出区间、标准误、MOE与其他样本量的MOE对比表，95%双侧z=1.959964、t(0.975,24)=2.063899精确复现，纯浏览器本地计算。',
  keywords: '置信区间计算器,confidence interval,均值的置信区间,t区间,z区间,wilson区间,wald区间,比例置信区间,误差范围moe,95%置信区间',
  author: '有条工具',
  ogTitle: '置信区间计算器 - 均值与比例的置信区间在线计算 | 有条工具',
  ogDescription: 'z/t 区间自动切换、Wald/Wilson 双口径对比、MOE 样本量再缩放表，90/95/99/自定义置信水平。',
  ogUrl: 'https://www.util.cn/tools/confidence-interval-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '置信区间计算器',
  twitterDescription: '均值与比例的置信区间计算，z/t 与 Wald/Wilson 双口径，MOE 对比表。'
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
          name: '置信区间计算器',
          url: 'https://www.util.cn/tools/confidence-interval-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '均值置信区间：σ 已知用 z 区间，σ 未知自动用 t 区间（df=n−1）',
            '比例置信区间：Wald 与 Wilson 双口径，小样本/稀疏计数自动推荐 Wilson',
            '90% / 95% / 99% 与自定义置信水平',
            '输出区间、标准误 SE、误差范围 MOE 与临界值',
            '其他样本量 n 下的 MOE 再缩放对比表',
            '逆 erf 牛顿精化 z 分位数、不完全贝塔反解 t 分位数（双精度）',
            '纯浏览器本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '置信区间计算器', item: 'https://www.util.cn/tools/confidence-interval-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '什么时候用 t 区间而不是 z 区间？',
              acceptedAnswer: { '@type': 'Answer', text: '总体标准差 σ 未知、用样本标准差 s 代替时用 t 区间（df=n−1）；n<30 时必须用 t。n≥30 时 t 与 z 已很接近，但仍建议直接用 t。只有 σ 确实已知才用 z 区间。' }
            },
            {
              '@type': 'Question',
              name: '95% 置信区间究竟是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '频率学派含义：按同一方法反复抽样并构造区间，长期约 95% 的区间会盖住真值。真值固定、区间随机，不要表述成「参数有 95% 概率落在区间内」。' }
            },
            {
              '@type': 'Question',
              name: '样本量翻倍，误差范围减半吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。MOE 与 1/√n 成正比：样本量翻 4 倍 MOE 才减半；目标 MOE 反推样本量 n=(z·σ/MOE)²。' }
            },
            {
              '@type': 'Question',
              name: 'x=0 或 x=n 时比例区间怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: 'Wald 区间标准误为 0 会退化为一点，明显失真；Wilson 区间仍合理（0/100 的 95% Wilson 上限约 3.7%）。小样本或稀疏计数应使用 Wilson 区间。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'confidence-interval-calculator'
const SETTINGS_KEY = `${TOOL_ID}-settings`

const MODES = [
  { id: 'mean', label: '均值 CI' },
  { id: 'prop', label: '比例 CI' }
]
const CONF_PRESETS = [0.9, 0.95, 0.99]

// ---------- 状态 ----------
const mode = ref('mean')
const confPreset = ref(0.95)
const useCustomConf = ref(false)
const confCustom = ref(97)
const xbar = ref(50)
const nMean = ref(25)
const sd = ref(8)
const sigmaKnown = ref(false)
const propX = ref(45)
const propN = ref(100)

const confLevel = computed(() => {
  if (!useCustomConf.value) return confPreset.value
  const c = Number(confCustom.value)
  if (!Number.isFinite(c)) return 0.95
  return Math.min(0.999, Math.max(0.5, c / 100))
})
const zCrit = computed(() => normQuant(1 - (1 - confLevel.value) / 2))

function selectPreset(c) {
  confPreset.value = c
  useCustomConf.value = false
}

// ---------- 面板 ①：均值 ----------
const meanResult = computed(() => meanInterval(xbar.value, sd.value, nMean.value, confLevel.value, sigmaKnown.value))

const N_LIST = [5, 10, 20, 30, 50, 100, 200, 500, 1000]
const meanRescaleRows = computed(() => {
  if (!meanResult.value) return []
  const ns = Array.from(new Set([...N_LIST, Math.floor(nMean.value)])).filter(n => n >= 2).sort((a, b) => a - b)
  return ns.map((n) => {
    const r = meanInterval(xbar.value, sd.value, n, confLevel.value, sigmaKnown.value)
    return {
      n,
      critText: r.kind === 'z' ? `z = ${fmtNum(r.crit, 4)}` : `df=${r.df}, t = ${fmtNum(r.crit, 4)}`,
      se: fmtNum(r.se, 4),
      moe: fmtNum(r.moe, 4)
    }
  })
})

// ---------- 面板 ②：比例 ----------
const propResult = computed(() => {
  const wald = waldInterval(propX.value, propN.value, zCrit.value)
  const wilson = wilsonInterval(propX.value, propN.value, zCrit.value)
  if (!wald || !wilson) return null
  const p = wald.p
  const recommendWilson = propN.value < 30 || p * propN.value < 5 || (1 - p) * propN.value < 5
  return { wald, wilson, recommendWilson, primary: recommendWilson ? wilson : wald, npSmall: p * propN.value < 5 || (1 - p) * propN.value < 5 }
})

const propRescaleRows = computed(() => {
  if (!propResult.value) return []
  const p = propResult.value.wald.p
  const ns = Array.from(new Set([...N_LIST, Math.floor(propN.value)])).filter(n => n > 0).sort((a, b) => a - b)
  return ns.map((n) => {
    const se = Math.sqrt(p * (1 - p) / n)
    return { n, se: fmtNum(se, 5), moe: fmtNum(zCrit.value * se, 5) }
  })
})

// ---------- 复制 ----------
function copyMeanResult() {
  const r = meanResult.value
  if (!r) return
  const text = `${Math.round(confLevel.value * 100)}% 置信区间（${r.kind === 'z' ? 'z' : `t, df=${r.df}`}）: [${r.lo.toFixed(4)}, ${r.hi.toFixed(4)}], x̄=${xbar.value}, ${sigmaKnown.value ? 'σ' : 's'}=${sd.value}, n=${nMean.value}, MOE=${r.moe.toFixed(4)}`
  copyText(text)
}
function copyPropResult() {
  const r = propResult.value
  if (!r) return
  const text = `${Math.round(confLevel.value * 100)}% 比例置信区间: Wald [${r.wald.lo.toFixed(4)}, ${r.wald.hi.toFixed(4)}], Wilson [${r.wilson.lo.toFixed(4)}, ${r.wilson.hi.toFixed(4)}], ${propX.value}/${propN.value}`
  copyText(text)
}
async function copyText(text) {
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
    if (CONF_PRESETS.includes(s.confPreset)) confPreset.value = s.confPreset
    if (s.useCustomConf === true || s.useCustomConf === false) useCustomConf.value = s.useCustomConf
    if (Number.isFinite(s.confCustom)) confCustom.value = s.confCustom
    if (Number.isFinite(s.xbar)) xbar.value = s.xbar
    if (Number.isFinite(s.nMean) && s.nMean >= 2) nMean.value = s.nMean
    if (Number.isFinite(s.sd) && s.sd > 0) sd.value = s.sd
    if (s.sigmaKnown === true || s.sigmaKnown === false) sigmaKnown.value = s.sigmaKnown
    if (Number.isFinite(s.propX) && s.propX >= 0) propX.value = s.propX
    if (Number.isFinite(s.propN) && s.propN >= 1) propN.value = s.propN
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([mode, confPreset, useCustomConf, confCustom, xbar, nMean, sd, sigmaKnown, propX, propN], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      mode: mode.value,
      confPreset: confPreset.value,
      useCustomConf: useCustomConf.value,
      confCustom: confCustom.value,
      xbar: xbar.value,
      nMean: nMean.value,
      sd: sd.value,
      sigmaKnown: sigmaKnown.value,
      propX: propX.value,
      propN: propN.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})
</script>
