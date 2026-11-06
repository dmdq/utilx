<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sigma class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">西格玛水平换算</h1>
          <p class="text-sm text-muted-foreground mt-1">σ ↔ DPMO/合格率双向换算、Cp/Cpk → σ 近似，含 1.5σ 偏移（Motorola 惯例）与无偏移双口径</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线西格玛水平换算工具：σ 水平 → DPMO 与合格率（可选「含 1.5σ 偏移」或「无偏移」口径）、DPMO 反解 σ 水平、
        Cp/Cpk 近似换算西格玛水平（σst = 3×Cpk + 1.5 行业惯例口径），并附 σ = 1.0~6.0 步进 0.5 的双口径对照表。
        正态概率用双精度高斯误差函数计算（erf 级数 + 连分式），6σ=3.4 DPMO 这类经典锚点精确复现。
        适合质量工程师做过程能力报告、六西格玛项目基线与目标设定。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          <span class="font-semibold">先分清口径再比数字</span>：业界说「6σ = 3.4 DPMO」用的是 Motorola 1.5σ 偏移惯例（单边规格口径，
          DPMO = (1−Φ(σ−1.5))×10⁶）；无偏移口径下 6σ 单边约 0.001 DPMO、双侧对称规格约 0.002 DPMO。
          两种 σ 差 1.5，报告与考核务必写明口径。
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主区：三个换算面板 -->
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

        <!-- 面板 ①：σ → DPMO + 合格率 -->
        <div v-if="mode === 'toDpmo'" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="sig-sigma" class="block text-sm font-medium text-foreground mb-1.5">西格玛水平 σ</label>
              <input
                id="sig-sigma"
                v-model.number="sigmaIn"
                type="number"
                min="-2"
                max="10"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 6"
              />
            </div>
            <div>
              <p class="text-sm font-medium text-foreground mb-1.5">口径</p>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="sigmaShifted = true"
                  class="py-2 rounded-lg border text-xs font-medium transition"
                  :class="sigmaShifted ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
                >含 1.5σ 偏移</button>
                <button
                  @click="sigmaShifted = false"
                  class="py-2 rounded-lg border text-xs font-medium transition"
                  :class="!sigmaShifted ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
                >无偏移</button>
              </div>
            </div>
          </div>

          <div v-if="sigmaValid" class="space-y-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <p class="text-sm text-muted-foreground mb-1">{{ sigmaShifted ? '含 1.5σ 偏移（Motorola 惯例，单边规格口径）' : '无偏移（单边规格口径）' }}</p>
              <p class="text-3xl font-bold text-primary">
                {{ fmtDpmo(sigmaPrimaryDpmo) }} <span class="text-sm font-normal text-muted-foreground">DPMO</span>
              </p>
              <p class="text-base font-semibold text-foreground mt-1">合格率 ≈ {{ fmtYield(sigmaPrimaryDpmo) }}</p>
              <p class="text-[11px] leading-relaxed text-muted-foreground mt-2">
                {{ sigmaShifted ? `z = σ − 1.5 = ${fmtNum(sigmaIn - 1.5, 2)}，DPMO = (1−Φ(z))×10⁶` : `z = σ = ${fmtNum(sigmaIn, 2)}，DPMO = (1−Φ(σ))×10⁶` }}
              </p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-xs text-muted-foreground border-b border-border">
                    <th class="py-2 pr-3 font-medium">口径</th>
                    <th class="py-2 pr-3 font-medium">z 值</th>
                    <th class="py-2 pr-3 font-medium">DPMO</th>
                    <th class="py-2 font-medium">合格率</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in sigmaRows"
                    :key="row.key"
                    class="border-b border-border/50"
                    :class="row.key === (sigmaShifted ? 'shifted' : 'plain1') ? 'bg-primary/5' : ''"
                  >
                    <td class="py-2 pr-3 text-foreground">{{ row.name }}</td>
                    <td class="py-2 pr-3 font-mono text-muted-foreground">{{ row.z }}</td>
                    <td class="py-2 pr-3 font-mono text-foreground">{{ row.dpmo }}</td>
                    <td class="py-2 font-mono text-foreground">{{ row.yield }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">请输入 −2 ~ 10 范围内的西格玛水平 σ。</p>
          </div>
        </div>

        <!-- 面板 ②：DPMO → σ -->
        <div v-else-if="mode === 'fromDpmo'" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="sig-dpmo" class="block text-sm font-medium text-foreground mb-1.5">DPMO（每百万机会缺陷数）</label>
              <input
                id="sig-dpmo"
                v-model.number="dpmoIn"
                type="number"
                min="0"
                max="1000000"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 3.4"
              />
            </div>
            <div>
              <p class="text-sm font-medium text-foreground mb-1.5">口径</p>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="dpmoShifted = true"
                  class="py-2 rounded-lg border text-xs font-medium transition"
                  :class="dpmoShifted ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
                >含 1.5σ 偏移</button>
                <button
                  @click="dpmoShifted = false"
                  class="py-2 rounded-lg border text-xs font-medium transition"
                  :class="!dpmoShifted ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
                >无偏移</button>
              </div>
            </div>
          </div>

          <div v-if="dpmoValid" class="space-y-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <p class="text-sm text-muted-foreground mb-1">反解西格玛水平（{{ dpmoShifted ? '含 1.5σ 偏移' : '无偏移' }}）</p>
              <p class="text-3xl font-bold text-primary">
                σ ≈ {{ fmtNum(dpmoPrimarySigma, 2) }}
                <span class="text-sm font-normal text-muted-foreground">（z = {{ fmtNum(dpmoPrimarySigma - (dpmoShifted ? 1.5 : 0), 4) }}）</span>
              </p>
              <p class="text-[11px] leading-relaxed text-muted-foreground mt-2">
                由 (1−Φ(z))×10⁶ = {{ fmtNum(dpmoIn, 4) }} 数值反解 z（正态分布函数单调，二分法精确到双精度），
                {{ dpmoShifted ? 'σ = z + 1.5' : 'σ = z' }}。合格率 ≈ {{ fmtYield(dpmoIn) }}。
              </p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-4 rounded-lg border border-border bg-muted/50">
                <p class="text-sm font-medium text-foreground mb-2">另一口径对照</p>
                <p class="text-xl font-bold font-mono text-foreground">
                  {{ dpmoShifted ? '无偏移' : '含 1.5σ 偏移' }} σ ≈ {{ fmtNum(dpmoOtherSigma, 2) }}
                </p>
                <p class="text-xs text-muted-foreground mt-1 leading-relaxed">
                  同一个 DPMO 在两种口径下 σ 恰好差 1.5——比对不同来源的 σ 报告时先问口径。
                </p>
              </div>
              <div class="p-4 rounded-lg border border-border bg-muted/50">
                <p class="text-sm font-medium text-foreground mb-2">近似过程能力</p>
                <p class="text-xl font-bold font-mono text-foreground">Cpk ≈ {{ fmtNum(dpmoShiftedSigma / 3 - 0.5, 2) }}</p>
                <p class="text-xs text-muted-foreground mt-1 leading-relaxed">
                  按 σst = 3Cpk + 1.5 反推：Cpk ≈ (σst − 1.5)/3。这是行业惯例近似，精确值请按实际数据计算 Cpk。
                </p>
              </div>
            </div>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">请输入 0 ~ 1,000,000 之间的 DPMO（不含边界：0 或 1,000,000 无法唯一反解）。</p>
          </div>
        </div>

        <!-- 面板 ③：Cp/Cpk → σ -->
        <div v-else class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="sig-cp" class="block text-sm font-medium text-foreground mb-1.5">Cp（可选）</label>
              <input
                id="sig-cp"
                v-model.number="cpIn"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 1.67"
              />
            </div>
            <div>
              <label for="sig-cpk" class="block text-sm font-medium text-foreground mb-1.5">Cpk（必填）</label>
              <input
                id="sig-cpk"
                v-model.number="cpkIn"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 1.33"
              />
            </div>
          </div>

          <div v-if="cpkValid" class="space-y-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <p class="text-sm text-muted-foreground mb-1">西格玛水平（行业惯例近似 σst = 3×Cpk + 1.5）</p>
              <p class="text-3xl font-bold text-primary">σst ≈ {{ fmtNum(sigmaSt, 2) }}</p>
              <p class="text-[11px] leading-relaxed text-muted-foreground mt-2">
                {{ cpkFallback ? '未填 Cpk，按 Cpk = Cp（过程均值无偏假设）近似。' : '' }}
                Cpk = {{ fmtNum(cpkEff, 3) }} → σlt = 3×Cpk = {{ fmtNum(sigmaLt, 2) }}（无偏移口径），
                σst = {{ fmtNum(sigmaSt, 2) }}（六西格玛报告口径，含 1.5σ 偏移惯例）。
              </p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="p-4 rounded-lg border border-border bg-muted/50">
                <p class="text-sm font-medium text-foreground mb-2">σlt（无偏移）</p>
                <p class="text-2xl font-bold font-mono text-foreground">{{ fmtNum(sigmaLt, 2) }}</p>
              </div>
              <div class="p-4 rounded-lg border border-border bg-muted/50">
                <p class="text-sm font-medium text-foreground mb-2">DPMO</p>
                <p class="text-2xl font-bold font-mono text-foreground">{{ fmtDpmo(cpkDpmo) }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">= (1−Φ(3×Cpk))×10⁶</p>
              </div>
              <div class="p-4 rounded-lg border border-border bg-muted/50">
                <p class="text-sm font-medium text-foreground mb-2">合格率</p>
                <p class="text-2xl font-bold font-mono text-foreground">{{ fmtYield(cpkDpmo) }}</p>
              </div>
            </div>
            <p class="text-[11px] leading-relaxed text-muted-foreground">
              注：两种口径下的 DPMO 数值相同（都等于 (1−Φ(3×Cpk))×10⁶）——因为 σst 的「含偏移」换算会再减回 1.5。
              有趣的是 DPMO 只由 Cpk 决定；Cp 比 Cpk 大多少反映的是过程均值偏离规格中心的程度（偏移量 ≈ (Cp−Cpk)×3σ）。
            </p>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">请至少输入一个大于 0 的 Cp 或 Cpk。</p>
          </div>

          <div class="border-t border-border pt-3">
            <p class="text-xs font-medium text-foreground mb-2">常用锚点（点击载入 Cpk）</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="a in CPK_ANCHORS"
                :key="a.v"
                @click="loadCpkAnchor(a.v)"
                class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition font-mono"
              >Cpk {{ a.text }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 1.5σ 偏移是什么
          </h2>
          <p class="text-xs leading-relaxed text-muted-foreground">
            Motorola 在推行六西格玛时假设：任何过程的均值在长期内都会漂移，幅度约为 ±1.5σ（相对规格中心的短期位置）。
            于是「短期 σ 水平」报出来要预留这 1.5σ 的漂移余量——6σ 短期水平对应长期的 z = 6 − 1.5 = 4.5，
            缺陷率 = 1−Φ(4.5) ≈ 3.4 ppm，这就是著名的「6σ = 3.4 DPMO」。
            该假设是行业惯例而非物理定律，无偏移口径下 6σ 的双侧缺陷率约 0.002 DPMO（10 亿分之 2），
            现实中几乎不可达，这也是 1.5σ 偏移被广泛采用的现实原因。
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Target class="w-5 h-5 mr-2 text-primary" /> 与 Cp / Cpk 的关系
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <p><span class="font-mono text-foreground font-semibold">σst ≈ 3×Cpk + 1.5</span>　六西格玛报告口径（含偏移）</p>
            <p><span class="font-mono text-foreground font-semibold">σlt = 3×Cpk</span>　无偏移（长期）口径</p>
            <p><span class="font-mono text-foreground font-semibold">DPMO = (1−Φ(3×Cpk))×10⁶</span></p>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            Cpk=1.33 → σst ≈ 5.49、σlt ≈ 3.99；Cpk=1.0 → σst=4.5、σlt=3.0（对应含偏移 66,807 DPMO）。
            该映射是单边规格近似，只要求「Cpk 达标」而不看均值位置时成立。
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <AlertTriangle class="w-5 h-5 mr-2 text-amber-500" /> 口径混用三大坑
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">单边 vs 双侧</span>：含偏移口径是单边规格口径；双侧对称规格的无偏移缺陷率要 ×2，别拿 3.4 DPMO 直接和单边表比。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">DPMO 的「机会数」</span>：DPMO 分母是缺陷机会数，同一产品机会数口径不同，DPMO 可差数倍，σ 换算前先统一机会定义。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">合格率 ≠ 良率</span>：DPMO 换出的合格率是「单机会无缺陷概率」，整线直通率（FTY）要按多个工序连乘，别混用。</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 对照表（面板 ④） -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="flex items-center justify-between mb-1">
        <h2 class="text-lg font-semibold flex items-center">
          <BarChart3 class="w-5 h-5 mr-2 text-primary" /> 面板④：σ 水平对照表（1.0 ~ 6.0 步进 0.5，双口径）
        </h2>
        <button
          @click="copyTable"
          class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition flex items-center gap-1.5"
        >
          <CheckCircle v-if="copied" class="w-3.5 h-3.5 text-green-500" />
          <Copy v-else class="w-3.5 h-3.5" />
          {{ copied ? '已复制' : '复制本表 TSV' }}
        </button>
      </div>
      <p class="text-xs text-muted-foreground mb-4">
        含偏移列按 Motorola 惯例 (1−Φ(σ−1.5))×10⁶（单边规格口径）；无偏移列给出单边与双侧对称规格（×2）两个数字。6σ 行为经典锚点。
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[640px]">
          <thead>
            <tr class="text-left text-xs text-muted-foreground border-b border-border">
              <th class="py-2 pr-3 font-medium">σ 水平</th>
              <th class="py-2 pr-3 font-medium bg-primary/5">含 1.5σ 偏移 DPMO</th>
              <th class="py-2 pr-3 font-medium bg-primary/5">含偏移合格率</th>
              <th class="py-2 pr-3 font-medium">无偏移单边 DPMO</th>
              <th class="py-2 pr-3 font-medium">无偏移双侧 DPMO</th>
              <th class="py-2 font-medium">无偏移双侧合格率</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in SIGMA_TABLE"
              :key="row.sigma"
              class="border-b border-border/50"
              :class="row.sigma === 6 ? 'bg-primary/5' : ''"
            >
              <td class="py-2.5 pr-3 font-semibold text-foreground">{{ fmtNum(row.sigma, 1) }}σ</td>
              <td class="py-2.5 pr-3 font-mono text-foreground bg-primary/5 font-medium">{{ fmtDpmo(row.shifted) }}</td>
              <td class="py-2.5 pr-3 font-mono text-muted-foreground bg-primary/5">{{ fmtYield(row.shifted) }}</td>
              <td class="py-2.5 pr-3 font-mono text-muted-foreground">{{ fmtDpmo(row.plain1) }}</td>
              <td class="py-2.5 pr-3 font-mono text-muted-foreground">{{ fmtDpmo(row.plain2) }}</td>
              <td class="py-2.5 font-mono text-muted-foreground">{{ fmtYield(row.plain2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
        自核锚点：6σ 含偏移 ≈ 3.4 DPMO（3.39767）、3σ 含偏移 ≈ 66,807、3σ 无偏移单边 ≈ 1,350、
        6σ 无偏移单边 ≈ 0.001 DPMO / 双侧 ≈ 0.002 DPMO。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>西格玛水平是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          西格玛水平（sigma level）是过程能力的度量：规格限与过程均值之间的距离用过程标准差 σ 的倍数表示。
          σ 水平越高，落在外面的缺陷越少。缺陷率与 σ 水平通过正态分布函数 Φ 换算：
          无偏移单边口径 DPMO = (1−Φ(σ))×10⁶，双侧对称规格把两根尾巴都算上（×2）；
          业界通行的「含 1.5σ 偏移」口径则按 DPMO = (1−Φ(σ−1.5))×10⁶ 换算，为长期均值漂移预留余量。
          本页四个面板覆盖 σ→DPMO、DPMO→σ 反解、Cp/Cpk→σ 与 1.0~6.0 全档对照，正态概率用双精度误差函数计算，
          6σ=3.4 DPMO、3σ=66,807 DPMO 等锚点精确复现。全部计算在浏览器本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">1.5σ 偏移从哪来？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          1.5σ 偏移是 Motorola 在 1980 年代推行六西格玛时引入的工程假设：过程的均值不会长期钉在规格中心，
          长期观察会看到约 ±1.5σ 的漂移（来源包括刀具磨损、批次原料、环境温度等系统性与随机性因素）。
          为了让「短期能力」的 σ 水平在长期能兑现，Motorola 把报告口径定为「短期 σ 水平减 1.5 后查正态表」：
          6σ 短期水平 → 长期 z=4.5 → 缺陷率 1−Φ(4.5) ≈ 3.4 ppm，即「六西格玛 = 3.4 DPMO」。
          这个假设并非精密定律——它是把「长期比短期差」这一经验事实折算成固定余量的行业惯例，
          优点是不同公司、不同项目的 σ 水平有了可比口径；争议在于 1.5 并非对所有过程都成立。
          因此本工具同时给出含偏移与无偏移两套数字，报告时注明口径即可避免歧义。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">与 Cp / Cpk 的关系</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Cp 与 Cpk 是过程能力指数：Cp = (USL−LSL)/(6σ) 只看宽度（过程潜力），Cpk 还要扣掉均值偏中心的部分（过程实际能力）。
          当只要求「Cpk 达标」而不追究均值位置时，行业惯例用 σst ≈ 3×Cpk + 1.5 把 Cpk 映射到六西格玛报告口径：
          Cpk=1.00 → σst=4.5、σlt=3.0、DPMO≈1,350；Cpk=1.33 → σst≈5.49；Cpk=1.67 → σst≈6.5。
          无偏移口径则直接 σlt = 3×Cpk。注意 DPMO 只由 Cpk 决定（DPMO = (1−Φ(3×Cpk))×10⁶），
          Cp 与 Cpk 的差值反映均值偏移量 ≈ (Cp−Cpk)×3σ——Cp 很大而 Cpk 小，说明过程宽够用但中心跑偏了，先调均值再谈升级。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么反解：DPMO → σ？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          正态分布函数单调，所以给定 DPMO 可以唯一反解 z：解方程 (1−Φ(z))×10⁶ = DPMO 得 z（本页用二分法，双精度收敛），
          再按口径还原：含偏移 σ = z + 1.5，无偏移 σ = z。例：DPMO=3.4 → z=4.4999 → 含偏移 σ≈6.00；
          DPMO=66,807 → z=1.5 → 含偏移 σ=3.00。手头只有合格率时先换算 DPMO = (1−合格率)×10⁶ 再反解。
          边界值 DPMO=0 或 1,000,000 在数学上对应 σ→∞ 或 σ→−∞，不在换算范围。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">6σ 到底是 3.4 还是 0.002 DPMO？</h3>
            <p class="text-sm text-muted-foreground mt-1">两个都对，口径不同：3.4 DPMO 是含 1.5σ 偏移的单边规格口径（Motorola 惯例，z=4.5）；0.002 DPMO 是无偏移双侧对称规格口径（1−Φ(6)≈0.001 单边，双侧×2≈0.002）。企业报告与教材默认前者，学术计算常给后者，比对前先确认口径。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">Cpk 1.33 对应几西格玛？</h3>
            <p class="text-sm text-muted-foreground mt-1">按行业惯例 σst = 3×1.33+1.5 ≈ 5.49（六西格玛报告口径，常被说成「约 5.5σ」）；无偏移口径 σlt = 3×1.33 ≈ 3.99。对应的 DPMO = (1−Φ(3.99))×10⁶ ≈ 32,700。说「Cpk 1.33 相当于 5.5σ」时务必带上「含 1.5σ 偏移惯例」。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">DPMO 反解出的 σ 是短期还是长期？</h3>
            <p class="text-sm text-muted-foreground mt-1">取决于你选的口径：选「含 1.5σ 偏移」反解出的是六西格玛报告惯例下的短期 σ 水平（长期等效 z = σ−1.5）；选「无偏移」时 σ 就是把当前缺陷率直接映射到正态尾部的 z 值（长期口径）。两套数差恒为 1.5。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">换算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。σ、DPMO、Cp/Cpk 全部在你的浏览器本地计算，不发送任何网络请求，输入数值不会被存储或上传。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'sigma-level-converter'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Sigma, Info, AlertTriangle, ChevronUp, ChevronDown,
  Copy, CheckCircle, Target, BarChart3
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// ---------- 高精度标准正态分布（双精度） ----------
// erf(t) Maclaurin 级数：erf(t) = (2/√π)·Σ(−1)ⁿ·t^(2n+1)/(n!(2n+1))。
// |t| < 2.6 时项最大 ~e^{t²}/2 量级（<70），双精度相消后绝对误差 ~1e-15，够用（见单测自核）。
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

// erfc(t) 连分式（DLMF 7.9）：erfc(t) = (e^{−t²}/√π)·1/(t + (1/2)/(t + (2/2)/(t + ...)))
// 向后递推，深度 300 对 t ≥ 2.6 收敛到双精度（见单测自核）。t ≥ 2.6 时尾项相对精度 ~1e-15，
// 远优于 A-S 26.2.17 在远尾的 ~7.5e-8 绝对误差，保证 6σ → 3.39767 DPMO 锚点逐位复现。
function erfcCf(t) {
  const N = 300
  let f = 0
  for (let n = N; n >= 1; n--) {
    f = (n / 2) / (t + f)
  }
  return (Math.exp(-t * t) / Math.sqrt(Math.PI)) / (t + f)
}

// 上尾概率 Q(x) = 1 − Φ(x)，x 任意实数
function normSf(x) {
  if (!Number.isFinite(x)) return x > 0 ? 0 : (x < 0 ? 1 : 0.5)
  if (x < 0) return 1 - normSf(-x)
  const t = x / Math.SQRT2
  if (t < 2.6) return 0.5 * (1 - erfSeries(t))
  return 0.5 * erfcCf(t)
}

// 标准正态分布函数 Φ(x)
function normCdf(x) {
  return 1 - normSf(x)
}

// ---------- σ ↔ DPMO ----------
const SIGMA_SHIFT = 1.5

// σ → DPMO。shifted=true：含 1.5σ 偏移 Motorola 惯例（单边规格口径）DPMO=(1−Φ(σ−1.5))×10⁶；
// shifted=false：无偏移单边 DPMO=(1−Φ(σ))×10⁶
function dpmoFromSigma(sigma, shifted) {
  if (!Number.isFinite(sigma)) return NaN
  const z = shifted ? sigma - SIGMA_SHIFT : sigma
  if (z <= -40) return 1e6
  if (z >= 40) return 0
  return normSf(z) * 1e6
}

// 无偏移双侧对称规格：两根尾巴 ×2
function dpmoTwoSidedPlain(sigma) {
  return 2 * dpmoFromSigma(sigma, false)
}

// DPMO → σ 反解：Q(z)·10⁶ = dpmo，Q 单调递减，二分法 z∈[−8,8]
function sigmaFromDpmo(dpmo, shifted) {
  if (!Number.isFinite(dpmo) || dpmo <= 0 || dpmo >= 1e6) return NaN
  const target = dpmo / 1e6
  let lo = -8
  let hi = 8
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (normSf(mid) > target) lo = mid
    else hi = mid
  }
  const z = (lo + hi) / 2
  return shifted ? z + SIGMA_SHIFT : z
}

// ---------- Cp/Cpk → σ（行业惯例近似） ----------
// σst = 3×Cpk + 1.5（六西格玛报告口径）；σlt = 3×Cpk（无偏移口径）；DPMO = (1−Φ(3×Cpk))×10⁶
function sigmaStFromCpk(cpk) {
  return 3 * cpk + SIGMA_SHIFT
}
function sigmaLtFromCpk(cpk) {
  return 3 * cpk
}
function dpmoFromCpk(cpk) {
  if (!Number.isFinite(cpk) || cpk <= 0) return NaN
  return normSf(3 * cpk) * 1e6
}

// ---------- 对照表：σ=1.0..6.0 步进 0.5 ----------
const SIGMA_TABLE = []
for (let i = 2; i <= 12; i++) {
  const sigma = i / 2
  const plain1 = dpmoFromSigma(sigma, false)
  SIGMA_TABLE.push({
    sigma,
    shifted: dpmoFromSigma(sigma, true),
    plain1,
    plain2: plain1 * 2
  })
}

// ---------- 展示格式化 ----------
function fmtNum(v, d = 2) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return v.toFixed(d)
}
function trimZeros(s) {
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s
}
function fmtDpmo(d) {
  if (d === null || d === undefined || !Number.isFinite(d)) return '—'
  if (d >= 1e6) return '1,000,000'
  if (d === 0) return '0'
  if (d >= 100) return Math.round(d).toLocaleString('en-US')
  if (d >= 0.01) return trimZeros(d.toFixed(3))
  return d.toExponential(2)
}
function fmtYield(dpmo) {
  if (dpmo === null || dpmo === undefined || !Number.isFinite(dpmo)) return '—'
  const y = (1 - dpmo / 1e6) * 100
  if (y <= 0) return '0%'
  if (y >= 99.99) return trimZeros(y.toFixed(6)) + '%'
  return trimZeros(y.toFixed(4)) + '%'
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '西格玛水平换算 - DPMO/合格率/Cpk双向换算（含1.5σ偏移口径）在线工具',
  description: '在线西格玛水平换算：σ↔DPMO与合格率双向换算（含1.5σ偏移Motorola口径/无偏移单边双侧口径）、DPMO反解σ水平、Cp/Cpk→σ近似（σst=3Cpk+1.5），附σ=1.0~6.0双口径对照表，6σ=3.4DPMO精确复现，双精度正态CDF计算，纯浏览器本地运行。',
  keywords: '西格玛水平换算,dpmo计算,六西格玛,sigma level,西格玛与合格率对照,cpk换算西格玛,1.5σ偏移,3.4dpmo',
  author: '有条工具',
  ogTitle: '西格玛水平换算 - DPMO/合格率/Cpk双向换算 | 有条工具',
  ogDescription: 'σ↔DPMO、DPMO反解、Cp/Cpk→σ 与 1.0~6.0 双口径对照表，含 1.5σ 偏移惯例说明。',
  ogUrl: 'https://www.util.cn/tools/sigma-level-converter',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '西格玛水平换算',
  twitterDescription: 'σ↔DPMO/合格率双向换算，含 1.5σ 偏移与无偏移双口径，Cp/Cpk 近似换算。'
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
          name: '西格玛水平换算',
          url: 'https://www.util.cn/tools/sigma-level-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'σ → DPMO 与合格率（含 1.5σ 偏移 / 无偏移口径可选）',
            'DPMO → σ 数值反解（二分法，双精度）',
            'Cp/Cpk → σ 行业惯例近似（σst=3Cpk+1.5、σlt=3Cpk）',
            'σ=1.0~6.0 步进 0.5 双口径对照表（单边/双侧）',
            '双精度正态 CDF（erf 级数+连分式），6σ=3.4 DPMO 精确复现',
            '1.5σ 偏移由来与口径混用注意事项科普',
            '对照表 TSV 一键复制，本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '西格玛水平换算', item: 'https://www.util.cn/tools/sigma-level-converter' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '6σ 到底是 3.4 还是 0.002 DPMO？',
              acceptedAnswer: { '@type': 'Answer', text: '两个都对，口径不同：3.4 DPMO 是含 1.5σ 偏移的单边规格口径（Motorola 惯例，z=4.5）；0.002 DPMO 是无偏移双侧对称规格口径。企业报告默认前者，学术计算常给后者，比对前先确认口径。' }
            },
            {
              '@type': 'Question',
              name: 'Cpk 1.33 对应几西格玛？',
              acceptedAnswer: { '@type': 'Answer', text: '按行业惯例 σst=3×1.33+1.5≈5.49（含偏移口径，常被说成约 5.5σ）；无偏移口径 σlt=3×1.33≈3.99，对应 DPMO≈32,700。引用时注明「含 1.5σ 偏移惯例」。' }
            },
            {
              '@type': 'Question',
              name: 'DPMO 反解出的 σ 是短期还是长期？',
              acceptedAnswer: { '@type': 'Answer', text: '取决于口径：含 1.5σ 偏移口径反解出的是六西格玛报告惯例下的短期 σ 水平（长期等效 z=σ−1.5）；无偏移口径的 σ 就是缺陷率直接映射的正态 z 值。两套数恒差 1.5。' }
            },
            {
              '@type': 'Question',
              name: '换算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。σ、DPMO、Cp/Cpk 全部在浏览器本地计算，不发送任何网络请求，输入数值不会被存储或上传。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'sigma-level-converter'
const SETTINGS_KEY = `${TOOL_ID}-settings`

const MODES = [
  { id: 'toDpmo', label: 'σ → DPMO' },
  { id: 'fromDpmo', label: 'DPMO → σ' },
  { id: 'cpk', label: 'Cp/Cpk → σ' }
]

const CPK_ANCHORS = [
  { v: 1.0, text: '1.00 → σst 4.5' },
  { v: 1.33, text: '1.33 → σst 5.49' },
  { v: 1.67, text: '1.67 → σst 6.5' }
]

// ---------- 状态 ----------
const mode = ref('toDpmo')
const sigmaIn = ref(6)
const sigmaShifted = ref(true)
const dpmoIn = ref(3.4)
const dpmoShifted = ref(true)
const cpIn = ref(1.67)
const cpkIn = ref(1.33)
const copied = ref(false)
const seoContentVisible = ref(true)

// ---------- 面板 ① ----------
const sigmaValid = computed(() => Number.isFinite(sigmaIn.value) && sigmaIn.value >= -2 && sigmaIn.value <= 10)
const sigmaPrimaryDpmo = computed(() => (sigmaValid.value ? dpmoFromSigma(sigmaIn.value, sigmaShifted.value) : NaN))
const sigmaRows = computed(() => {
  if (!sigmaValid.value) return []
  const s = sigmaIn.value
  const p1 = dpmoFromSigma(s, false)
  return [
    { key: 'shifted', name: '含 1.5σ 偏移（单边）', z: fmtNum(s - 1.5, 2), dpmo: fmtDpmo(dpmoFromSigma(s, true)), yield: fmtYield(dpmoFromSigma(s, true)) },
    { key: 'plain1', name: '无偏移（单边）', z: fmtNum(s, 2), dpmo: fmtDpmo(p1), yield: fmtYield(p1) },
    { key: 'plain2', name: '无偏移（双侧对称）', z: '±' + fmtNum(s, 2), dpmo: fmtDpmo(p1 * 2), yield: fmtYield(p1 * 2) }
  ]
})

// ---------- 面板 ② ----------
const dpmoValid = computed(() => Number.isFinite(dpmoIn.value) && dpmoIn.value > 0 && dpmoIn.value < 1e6)
const dpmoPrimarySigma = computed(() => (dpmoValid.value ? sigmaFromDpmo(dpmoIn.value, dpmoShifted.value) : NaN))
const dpmoOtherSigma = computed(() => (dpmoValid.value ? sigmaFromDpmo(dpmoIn.value, !dpmoShifted.value) : NaN))
// Cpk 近似恒按含 1.5σ 偏移口径的 σst 反推：Cpk ≈ (σst−1.5)/3
const dpmoShiftedSigma = computed(() => (dpmoValid.value ? sigmaFromDpmo(dpmoIn.value, true) : NaN))

// ---------- 面板 ③ ----------
const cpkValid = computed(() => {
  const cpk = Number(cpkIn.value)
  const cp = Number(cpIn.value)
  return (Number.isFinite(cpk) && cpk > 0) || (Number.isFinite(cp) && cp > 0)
})
const cpkEff = computed(() => {
  const cpk = Number(cpkIn.value)
  if (Number.isFinite(cpk) && cpk > 0) return cpk
  return Number(cpIn.value)
})
const cpkFallback = computed(() => {
  const cpk = Number(cpkIn.value)
  return !(Number.isFinite(cpk) && cpk > 0) && cpkValid.value
})
const sigmaSt = computed(() => sigmaStFromCpk(cpkEff.value))
const sigmaLt = computed(() => sigmaLtFromCpk(cpkEff.value))
const cpkDpmo = computed(() => dpmoFromCpk(cpkEff.value))

function loadCpkAnchor(v) {
  cpkIn.value = v
  mode.value = 'cpk'
  trackEvent('工具结果', '载入示例', TOOL_ID)
}

// ---------- 对照表复制 ----------
const TABLE_HEADER = ['σ水平', '含1.5σ偏移DPMO', '含偏移合格率', '无偏移单边DPMO', '无偏移双侧DPMO', '无偏移双侧合格率']
function buildTableTsv() {
  const lines = SIGMA_TABLE.map((r) => [
    fmtNum(r.sigma, 1), fmtDpmo(r.shifted), fmtYield(r.shifted),
    fmtDpmo(r.plain1), fmtDpmo(r.plain2), fmtYield(r.plain2)
  ].join('\t'))
  return [TABLE_HEADER.join('\t'), ...lines].join('\n')
}
let copyTimer = null
async function copyTable() {
  try {
    await navigator.clipboard.writeText(buildTableTsv())
    copied.value = true
    trackEvent('工具结果', '复制', TOOL_ID)
  } catch (err) {
    copied.value = false
    alert('复制失败：浏览器未授权剪贴板，请手动选择表格复制。')
  }
  if (copyTimer !== null) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = false; copyTimer = null }, 1600)
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
    if (Number.isFinite(s.sigmaIn) && s.sigmaIn >= -2 && s.sigmaIn <= 10) sigmaIn.value = s.sigmaIn
    if (s.sigmaShifted === true || s.sigmaShifted === false) sigmaShifted.value = s.sigmaShifted
    if (Number.isFinite(s.dpmoIn) && s.dpmoIn > 0 && s.dpmoIn < 1e6) dpmoIn.value = s.dpmoIn
    if (s.dpmoShifted === true || s.dpmoShifted === false) dpmoShifted.value = s.dpmoShifted
    if (Number.isFinite(s.cpIn) && s.cpIn > 0) cpIn.value = s.cpIn
    if (Number.isFinite(s.cpkIn) && s.cpkIn > 0) cpkIn.value = s.cpkIn
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([mode, sigmaIn, sigmaShifted, dpmoIn, dpmoShifted, cpIn, cpkIn], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      mode: mode.value,
      sigmaIn: sigmaIn.value,
      sigmaShifted: sigmaShifted.value,
      dpmoIn: dpmoIn.value,
      dpmoShifted: dpmoShifted.value,
      cpIn: cpIn.value,
      cpkIn: cpkIn.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})
</script>
