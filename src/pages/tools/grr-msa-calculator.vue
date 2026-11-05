<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sigma class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">GR&R测量系统分析</h1>
          <p class="text-sm text-muted-foreground mt-1">均值极差法 GR&R：EV / AV / %GRR、公差比 P/T 与 NDC 分级数，AIAG 三档判定</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        按 AIAG MSA 第四版·均值极差法（Average &amp; Range method）在线分析测量系统能力：填入 10 个零件 × 3 名操作者 × 3 次重复共 90 个读数，
        自动算出设备变差 EV（重复性）、操作者变差 AV（再现性）、合成变差 GRR 与 %GRR，并列给出公差比 P/T（6×GRR/Tolerance）与
        分级数 NDC = ⌊1.41 × PV/GRR⌋，按 &lt;10% 可接受 / 10%~30% 有条件 / &gt;30% 不可接受三档判定，方差分解条一眼看清是测量系统还是零件本身占主导。
        全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        口径：AIAG MSA 第四版均值极差法，K 系数取 K1 = 0.5908（3 次重复）、K2 = 0.5231（3 名操作者）、K3 = 0.3146（10 个零件）。
        本工具为均值极差法简化实现，正式 MSA 报告以 AIAG 手册与统计软件（ANOVA 法）为准。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 模块①：90 格数据矩阵 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-lg font-semibold flex items-center">
              <Ruler class="w-5 h-5 mr-2 text-primary" /> 测量数据矩阵（10 零件 × 3 操作者 × 3 重复）
            </h2>
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground">已填 {{ fillCount }}/90</span>
              <button
                @click="loadDemo"
                class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition"
              >
                <Sparkles class="w-3.5 h-3.5" /> 生成示例数据
              </button>
              <button
                @click="clearAll"
                class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
              >
                <RefreshCw class="w-3.5 h-3.5" /> 清空
              </button>
            </div>
          </div>

          <!-- 按操作者分 3 块，每块 10 行 -->
          <div
            v-for="(apName, aIdx) in appraiserNames"
            :key="apName"
            class="rounded-lg border border-border/60 overflow-hidden"
          >
            <div class="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border/60">
              <h3 class="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <User class="w-4 h-4 text-primary" /> 操作者 {{ apName }}
              </h3>
              <span class="text-xs text-muted-foreground font-mono">
                均值 X̄ = {{ fmtNum(appraiserStats(aIdx).xbar) }} · 平均极差 R̄ = {{ fmtNum(appraiserStats(aIdx).rbar) }}
              </span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-xs text-muted-foreground">
                    <th class="py-1.5 pl-3 pr-2 font-medium">零件</th>
                    <th class="py-1.5 px-2 font-medium text-center">第 1 次</th>
                    <th class="py-1.5 px-2 font-medium text-center">第 2 次</th>
                    <th class="py-1.5 px-2 font-medium text-center">第 3 次</th>
                    <th class="py-1.5 pl-2 pr-3 font-medium text-right">极差 R</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="pIdx in 10" :key="pIdx" class="border-t border-border/50">
                    <td class="py-1 pl-3 pr-2 text-xs text-muted-foreground whitespace-nowrap">#{{ pIdx }}</td>
                    <td v-for="tIdx in 3" :key="tIdx" class="px-1 py-1">
                      <input
                        v-model.number="cells[aIdx][pIdx - 1][tIdx - 1]"
                        type="number"
                        step="0.01"
                        inputmode="decimal"
                        class="w-full min-w-16 px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-right text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        :aria-label="'操作者' + apName + ' 零件' + pIdx + ' 第' + tIdx + '次测量值'"
                      >
                    </td>
                    <td class="pl-2 pr-3 text-right font-mono text-xs text-muted-foreground">{{ rowRange(aIdx, pIdx - 1) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p v-if="fillCount < 90" class="text-xs text-yellow-600 dark:text-yellow-400">
            填满全部 90 格后自动计算；也可以先用「生成示例数据」看完整流程。
          </p>
        </div>

        <!-- 模块②：公差与过程信息 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Target class="w-5 h-5 mr-2 text-primary" /> 公差与过程信息
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="grr-usl" class="block text-sm font-medium text-foreground mb-1.5">USL 上规格限</label>
              <input
                id="grr-usl"
                v-model.number="usl"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 45"
              >
            </div>
            <div>
              <label for="grr-lsl" class="block text-sm font-medium text-foreground mb-1.5">LSL 下规格限</label>
              <input
                id="grr-lsl"
                v-model.number="lsl"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 15"
              >
            </div>
            <div>
              <label for="grr-sigma" class="block text-sm font-medium text-foreground mb-1.5">过程标准差 σ（可选）</label>
              <input
                id="grr-sigma"
                v-model.number="processSigma"
                type="number"
                step="0.001"
                min="0"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="留空用零件变差估计"
              >
            </div>
          </div>
          <p class="text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg p-2.5">
            USL 与 LSL 都填入时才计算公差比 P/T = 6×GRR/(USL−LSL)。填入来自 SPC 控制图的过程标准差后，
            TV 取 6×σ过程，%GRR 反映测量系统占过程总变差的比例（此时 %PV 的含义是零件变差相对过程变差）。
          </p>
        </div>

        <!-- 模块③：变差分析结果 -->
        <template v-if="grr">
          <div class="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Calculator class="w-5 h-5 mr-2 text-primary" /> 变差分析结果（AIAG 均值极差法）
            </h2>

            <!-- %GRR 主判定 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="rounded-lg p-4 border" :class="grrJudgeCls">
                <p class="text-xs text-muted-foreground mb-1">%GRR = GRR / TV × 100%</p>
                <p class="text-3xl font-bold">{{ fmtNum(grr.pctGRR, 2) }}%</p>
                <p class="text-sm font-medium mt-1">{{ grrJudge.label }} — {{ grrJudge.desc }}</p>
              </div>
              <div class="rounded-lg p-4 border" :class="ptJudgeCls">
                <p class="text-xs text-muted-foreground mb-1">
                  P/T 比 = 6 × GRR / (USL − LSL) × 100%
                  <template v-if="!grr.hasPT">（未填公差）</template>
                </p>
                <p class="text-3xl font-bold">{{ grr.hasPT ? fmtNum(grr.pT, 2) + '%' : '—' }}</p>
                <p class="text-sm font-medium mt-1">
                  <template v-if="grr.hasPT">{{ ptJudge.label }} — {{ ptJudge.desc }}</template>
                  <template v-else>公差比口径：GRR 占特征公差带的比例，与 %GRR 并列参考</template>
                </p>
              </div>
            </div>

            <!-- 指标明细 -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-xs text-muted-foreground">EV 设备变差（重复性）</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ fmtNum(grr.EV) }}</p>
                <p class="text-xs text-muted-foreground">%EV = {{ fmtNum(grr.pctEV, 2) }}%</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-xs text-muted-foreground">AV 操作者变差（再现性）</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ fmtNum(grr.AV) }}</p>
                <p class="text-xs text-muted-foreground">%AV = {{ fmtNum(grr.pctAV, 2) }}%</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-xs text-muted-foreground">GRR 合成变差</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ fmtNum(grr.GRR) }}</p>
                <p class="text-xs text-muted-foreground">%GRR = {{ fmtNum(grr.pctGRR, 2) }}%</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-xs text-muted-foreground">PV 零件变差</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ fmtNum(grr.PV) }}</p>
                <p class="text-xs text-muted-foreground">%PV = {{ fmtNum(grr.pctPV, 2) }}%</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-xs text-muted-foreground">TV 总变差{{ grr.useProc ? '（6×σ过程）' : '' }}</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ fmtNum(grr.TV) }}</p>
                <p class="text-xs text-muted-foreground">{{ grr.useProc ? '来自过程标准差输入' : '√(GRR² + PV²)' }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-xs text-muted-foreground">NDC 分级数 = ⌊1.41 × PV/GRR⌋</p>
                <p class="text-lg font-bold font-mono" :class="ndcCls">{{ fmtNum(grr.ndc, 0) }}</p>
                <p class="text-xs" :class="ndcCls">{{ ndcHint }}</p>
              </div>
            </div>

            <!-- AV 取 0 提示 -->
            <div v-if="grr.avClamped" class="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <AlertTriangle class="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <p class="text-xs leading-relaxed text-yellow-700 dark:text-yellow-300">
                AV 根号内为负已按 AIAG 规则取 0：操作者间均值的差异（X̄diff = {{ fmtNum(grr.xdiff) }}）小于重复性误差水平，
                再现性被重复性淹没——通常说明操作手法一致、或操作者间差异低于量具噪声，不视为异常。
              </p>
            </div>

            <!-- 方差分解条 -->
            <template v-if="varBar">
              <div>
                <p class="text-sm font-medium text-foreground mb-2">方差分解条（各变差分量占 TV 的方差比例）</p>
                <svg viewBox="0 0 600 34" class="w-full h-auto" role="img" aria-label="EV AV PV 方差分解堆叠条">
                  <rect
                    v-for="(seg, i) in varBar.segs"
                    :key="i"
                    :x="seg.x"
                    y="4"
                    :width="seg.w"
                    height="26"
                    fill="currentColor"
                    :class="seg.cls"
                    fill-opacity="0.85"
                  />
                  <rect x="0" y="4" width="600" height="26" fill="none" stroke="currentColor" class="text-border" />
                </svg>
                <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-primary inline-block"></span>EV² / TV² = {{ fmtNum(varBar.pctEV, 1) }}%</span>
                  <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-sky-500 inline-block"></span>AV² / TV² = {{ fmtNum(varBar.pctAV, 1) }}%</span>
                  <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>PV² / TV² = {{ fmtNum(varBar.pctPV, 1) }}%</span>
                  <span v-if="varBar.remainderPct > 0.5" class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-muted-foreground/40 inline-block"></span>未包含变差 = {{ fmtNum(varBar.remainderPct, 1) }}%</span>
                </div>
                <p class="text-xs text-muted-foreground mt-1.5 bg-muted/50 border border-border rounded-lg p-2.5">
                  看占比定主攻方向：EV²+AV²（测量系统）占大头时先计量具与手法；PV 占大头时测量系统可信，差异来自零件本身（过程能力问题，
                  可用 <NuxtLink to="/tools/cpk-process-capability" class="text-primary hover:underline">Cpk 过程能力计算器</NuxtLink> 继续分析）。
                  <template v-if="!grr.useProc">未填过程标准差时 TV² = EV² + AV² + PV²，三者合计 100%。</template>
                </p>
              </div>
            </template>

            <button
              @click="copyResult"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
            >
              <Copy class="w-3.5 h-3.5" /> 复制 GR&R 分析结论
            </button>
          </div>
        </template>
        <div v-else class="bg-card border border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
          {{ fillCount < 90 ? '填满 90 个测量值后自动计算 EV / AV / GRR / PV / TV、%GRR、P/T 与 NDC' : '数据中存在无法解析的数值，请检查矩阵中的空格或非法字符' }}
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 判定基准 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <CheckCircle class="w-4 h-4 mr-2 text-primary" /> AIAG 三档判定基准
          </h3>
          <div class="space-y-2">
            <div
              v-for="band in judgeBands"
              :key="band.key"
              class="px-3 py-2 rounded-lg border text-xs leading-relaxed transition"
              :class="grrJudge && grrJudge.key === band.key ? band.activeCls : 'border-border/60 text-muted-foreground'"
            >
              <p class="font-medium">{{ band.range }}</p>
              <p>{{ band.desc }}</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            当前 %GRR = {{ grr ? fmtNum(grr.pctGRR, 2) + '%' : '—' }}，P/T = {{ grr && grr.hasPT ? fmtNum(grr.pT, 2) + '%' : '—' }}，两口径同标准。
            另需满足 NDC ≥ 5 才有足够的分辨分级数。
          </p>
        </div>

        <!-- 公式与 K 系数速查 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-2.5">
          <h3 class="font-semibold text-foreground flex items-center">
            <Sigma class="w-4 h-4 mr-2 text-primary" /> 公式与 K 系数（AIAG 第四版）
          </h3>
          <ul class="text-xs text-muted-foreground space-y-1.5 leading-relaxed font-mono">
            <li>EV = R̄̈ × K1，K1 = 0.5908（r = 3 次重复）</li>
            <li>AV = √((X̄diff × K2)² − EV²/(n·r))，K2 = 0.5231（k = 3 名操作者）；根号内为负取 0</li>
            <li>GRR = √(EV² + AV²)</li>
            <li>PV = Rp × K3，K3 = 0.3146（n = 10 个零件）</li>
            <li>TV = √(GRR² + PV²)，或 TV = 6 × σ过程（填入过程标准差时）</li>
            <li>NDC = ⌊1.41 × PV / GRR⌋</li>
          </ul>
          <p class="text-xs text-muted-foreground">
            n = 零件数（10），r = 重复次数（3）；R̄̈ 为全部极差的均值，X̄diff 为操作者均值极差，Rp 为零件均值的极差。
          </p>
        </div>

        <!-- 相关工具 -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>GR&R 测量系统分析是什么？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          GR&R（Gage Repeatability and Reproducibility，量具重复性与再现性）是 AIAG MSA 手册定义的测量系统能力分析方法：
          它回答「你看到的差异，有多少来自零件本身、有多少来自测量系统」。重复性（Repeatability）指同一操作者用同一量具多次测同一零件的差异——设备变差 EV；
          再现性（Reproducibility）指不同操作者测同一零件的平均值差异——操作者变差 AV。两者合成 GRR = √(EV² + AV²)，
          再与总变差 TV 相比得到 %GRR：<strong class="text-foreground">&lt;10% 可接受，10%~30% 有条件接受（需成本权衡），&gt;30% 不可接受</strong>。
          若测量系统本身就占了大头，后续所有 SPC 与 Cpk 结论都建立在噪声之上。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>重复性（EV）与再现性（AV）的区别</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          重复性是「同一人、同一把量具、同一零件」的读数散布，来自量具分辨力、夹持方式与环境噪声，用同一格内 3 次读数的极差估计（EV = R̄̈ × K1）；
          再现性是「不同人测同一零件」的平均值差异，来自操作手法、读数视线与夹紧力差异，用操作者均值的极差估计（AV = √((X̄diff × K2)² − EV²/(n·r))），
          减去 EV²/(n·r) 是为了避免重复性被重复计入。当操作者间差异小于重复性噪声时根号内为负，按 AIAG 规则 AV 取 0——
          本工具会明确提示这一情形。EV 大先查量具（分辨力、重复精度、夹具）；AV 大先查手法（作业指导、培训、定位方式）。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>为什么先做 GR&R，再算 Cpk？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          Cpk 用 σ 把过程与公差比较，而 σ 是从测量数据里估出来的——如果测量系统噪声本身就很大，估出的 σ 被夸大，Cpk 会被系统性低估，
          你会花冤枉钱去「改进」一个其实合格的过程；反过来若量具分辨力不足（数据被粗化），σ 可能被低估，Cpk 虚高，掩盖真实不良。
          行业惯例是：新量具、新产线、新项目 PPAP 提交前先做 GR&R（%GRR ≤ 10% 或 ≤ 30% 按客户要求），确认测量系统可用后，
          再用同一套数据流程算 <NuxtLink to="/tools/cpk-process-capability" class="text-primary hover:underline">Cpk 过程能力</NuxtLink>。
          两者是「先验尺、再量布」的关系。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>均值极差法与 ANOVA 法怎么选？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          均值极差法（本工具）用极差估计变差，公式简单、可在车间纸面完成，是 AIAG MSA 手册主推的现场方法；
          代价是无法分离操作者×零件的交互效应，且极差估计在小样本下效率略低。ANOVA 法把总平方和分解为零件、操作者、交互与误差项，
          能给出交互作用是否显著的检验，统计软件（Minitab、JMP）默认输出 ANOVA 法结果。
          实务建议：日常快速确认用均值极差法；PPAP、客户审核或极差法结果落在 10%~30% 灰色地带时，用 ANOVA 法复核
          （交互显著时均值极差法会低估或高估 AV）。两种方法对同一组数据通常给出接近的 %GRR。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>NDC（分级数）多少才够？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          NDC（Number of Distinct Categories，分辨分级数）= ⌊1.41 × PV/GRR⌋，含义是「这套测量系统能把零件间的差异可靠地分成几档」。
          AIAG 建议 NDC ≥ 5：低于 5 说明相对零件变差而言测量噪声太大，控制图上点会挤在一起、Cpk 对过程改进不敏感。
          注意 NDC 与 %GRR 是同一件事的两面：%GRR = 10% 时 NDC 约为 14，%GRR = 30% 时 NDC 约为 4.7——所以 %GRR 压到 27% 以下
          （NDC = 5）往往比盯死 30% 更有操作意义。NDC 为 0 或异常大时先检查数据是否全部相同或录入有误。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">GR&R 多少算合格？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              AIAG 三档：%GRR 与 P/T 均 &lt;10% 可接受；10%~30% 有条件接受——需结合量具成本、被测特性的重要性（安全/关键件从严）与客户要求；
              &gt;30% 不可接受，应先改进量具或手法再用于过程分析。同时要求 NDC ≥ 5。量产关键尺寸通常按 ≤10% 执行。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">AV 显示 0 是什么意思？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              AV = √((X̄diff × K2)² − EV²/(n·r))，当操作者间均值差异 X̄diff 很小、根号内为负时，按 AIAG 规则取 AV = 0，
              本工具会给出提示。这不是错误，通常说明三名操作者手法非常一致（再现性优于重复性），此时只看 %EV 即可。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">没有过程标准差时 %GRR 怎么解读？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              TV = √(GRR² + PV²)，即用这次研究里 10 个零件自身的变差当总变差——此时零件要尽量覆盖过程实际波动范围（取最小、最大与中间档），
              否则 %GRR 会失真：零件太一致会抬高 %GRR，零件差异过大则压低 %GRR。有 SPC 控制图时优先填入过程标准差（TV = 6σ），
              得到的 %GRR 更代表真实生产状态。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">90 个读数要真实测吗？示例数据有什么用？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              正式 GR&R 研究必须真实读数，且零件编号对操作者盲测（避免记忆效应）、随机顺序测量。「生成示例数据」内置轻微测量噪声与
              USL/LSL 口径，用于演示计算流程与判定链路，其结果不代表任何真实量具。
            </p>
          </div>
        </div>

        <p class="text-xs text-muted-foreground mt-8 pt-4 border-t border-border/60">
          口径与局限声明：本工具为 AIAG MSA 第四版均值极差法的简化实现（固定 10 零件 × 3 操作者 × 3 重复），
          未包含操作者×零件交互项与稳定性/偏倚/线性分析；正式 MSA 报告以 AIAG 手册与统计软件（ANOVA 法）为准。
        </p>
      </div>
    </div>

    <RelatedTools :currentToolId="'grr-msa-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Sigma, Info, Ruler, Target, Calculator, User, CheckCircle, AlertTriangle,
  Copy, RefreshCw, Sparkles, ChevronUp, ChevronDown, Link as LinkIcon
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'grr-msa-calculator'
const STORAGE_KEY = 'grr-msa-calculator.inputs'

// SEO
useSeoMeta({
  title: 'GR&R测量系统分析在线计算器 - 均值极差法 %GRR、P/T比与NDC判定 | Util工具箱',
  description: '在线 GR&R 计算器：AIAG MSA 第四版均值极差法，10×3×3 数据矩阵算 EV/AV/GRR/PV/TV、%GRR 三档判定、公差比 P/T 与 NDC 分级数，方差分解条看清测量系统与零件变差占比，纯本地计算',
  keywords: 'grr计算, 测量系统分析, 均值极差法, gr&r计算器, gage rr, msa分析, 重复性再现性, ndc计算, pct计算, grr calculator',
  author: 'Util工具箱',
  ogTitle: 'GR&R测量系统分析在线计算器',
  ogDescription: '均值极差法 GR&R：EV/AV/%GRR、公差比 P/T 与 NDC 分级数，AIAG 三档判定',
  ogUrl: 'https://www.util.cn/tools/grr-msa-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'GR&R测量系统分析在线计算器',
  twitterDescription: '均值极差法 GR&R、P/T 比与 NDC，AIAG 三档判定'
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
          name: 'GR&R测量系统分析在线计算器',
          url: 'https://www.util.cn/tools/grr-msa-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '10 零件 × 3 操作者 × 3 重复数据矩阵',
            'AIAG 均值极差法 EV/AV/GRR/PV/TV 计算',
            '%GRR 三档判定（10%/30%）',
            '公差比 P/T = 6×GRR/(USL−LSL)',
            'NDC 分级数与 ≥5 判据',
            '方差分解堆叠条（EV/AV/PV 占 TV 比例）',
            '一键生成含噪声示例数据'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: 'GR&R测量系统分析', item: 'https://www.util.cn/tools/grr-msa-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'GR&R 多少算合格？',
              acceptedAnswer: { '@type': 'Answer', text: 'AIAG 三档：%GRR 与 P/T 均 <10% 可接受；10%~30% 有条件接受（结合成本与重要性权衡）；>30% 不可接受。同时要求 NDC ≥ 5。' }
            },
            {
              '@type': 'Question',
              name: 'AV 显示 0 是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: 'AV = √((X̄diff×K2)² − EV²/(n·r))，操作者间差异小于重复性噪声时根号内为负，按 AIAG 规则取 AV = 0，说明操作者手法一致，只看 %EV 即可。' }
            },
            {
              '@type': 'Question',
              name: '没有过程标准差时 %GRR 怎么解读？',
              acceptedAnswer: { '@type': 'Answer', text: 'TV = √(GRR²+PV²)，用研究零件自身的变差当总变差，零件须覆盖过程实际波动范围；有 SPC 数据时优先填过程标准差（TV = 6σ）更代表真实生产状态。' }
            },
            {
              '@type': 'Question',
              name: 'NDC 要多少才够？',
              acceptedAnswer: { '@type': 'Answer', text: 'AIAG 建议 NDC ≥ 5，即 1.41 × PV/GRR 向下取整后至少为 5；NDC < 5 时测量噪声相对零件变差过大，控制图与 Cpk 灵敏度不足。' }
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
      if (Array.isArray(s.cells) && s.cells.length === 3 &&
        s.cells.every(a => Array.isArray(a) && a.length === 10 && a.every(p => Array.isArray(p) && p.length === 3))) {
        cells.value = s.cells.map(a => a.map(p => p.map(v => (typeof v === 'number' && isFinite(v)) ? v : '')))
      }
      if (typeof s.usl === 'number' && isFinite(s.usl)) usl.value = s.usl
      if (typeof s.lsl === 'number' && isFinite(s.lsl)) lsl.value = s.lsl
      if (typeof s.processSigma === 'number' && isFinite(s.processSigma)) processSigma.value = s.processSigma
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})

// __PURE_FNS_START__
// ---------- AIAG MSA 第四版·均值极差法 纯函数（无外部依赖） ----------
// K 系数（AIAG MSA 第四版，已对照手册核对）
// K1 = 1/d₂*（3 次重复，d₂* ≈ 1.6926）= 0.5908
// K2 = 1/d₂*（3 名操作者）= 0.5231
// K3 = 1/d₂*（10 个零件，d₂* ≈ 3.178）= 0.3146
const K1 = 0.5908
const K2 = 0.5231
const K3 = 0.3146

// 数据矩阵 → 全部中间量与结果
// cells: [操作者 a][零件 p][重复 t] 的三维数值矩阵（非法值视为未填，返回 null）
// opts: { usl, lsl, processSigma }
const grrCompute = (cells, opts) => {
  const o = opts || {}
  const people = cells.length
  if (!people) return null
  const parts = cells[0].length
  const trials = cells[0][0].length
  if (!parts || !trials) return null

  // 每操作者×零件：均值与极差
  const xbarAp = []
  const rAp = []
  for (let a = 0; a < people; a++) {
    const rowX = []
    const rowR = []
    for (let p = 0; p < parts; p++) {
      let sum = 0
      let mn = Infinity
      let mx = -Infinity
      for (let t = 0; t < trials; t++) {
        const raw = cells[a][p][t]
        // 空格 / null / undefined 一律视为未填（Number('') === 0 会把空格误当 0）
        if (raw === '' || raw === null || raw === undefined || typeof raw === 'boolean') return null
        const v = Number(raw)
        if (!isFinite(v)) return null
        sum += v
        if (v < mn) mn = v
        if (v > mx) mx = v
      }
      rowX.push(sum / trials)
      rowR.push(mx - mn)
    }
    xbarAp.push(rowX)
    rAp.push(rowR)
  }

  // R̄̈ = 全部极差的均值（设备变差的极差估计）
  const rbarA = []
  let rsum = 0
  for (let a = 0; a < people; a++) {
    let rs = 0
    for (let p = 0; p < parts; p++) rs += rAp[a][p]
    rbarA.push(rs / parts)
    rsum += rbarA[a]
  }
  const rDoubleBar = rsum / people
  const EV = rDoubleBar * K1

  // 操作者均值与 X̄diff → AV（根号内为负取 0）
  const xbarA = []
  for (let a = 0; a < people; a++) {
    let s = 0
    for (let p = 0; p < parts; p++) s += xbarAp[a][p]
    xbarA.push(s / parts)
  }
  const xdiff = Math.max.apply(null, xbarA) - Math.min.apply(null, xbarA)
  const avInside = Math.pow(xdiff * K2, 2) - (EV * EV) / (parts * trials)
  const avClamped = avInside <= 0
  const AV = avClamped ? 0 : Math.sqrt(avInside)
  const GRR = Math.sqrt(EV * EV + AV * AV)

  // 零件均值 → PV
  const xbarP = []
  for (let p = 0; p < parts; p++) {
    let s = 0
    for (let a = 0; a < people; a++) s += xbarAp[a][p]
    xbarP.push(s / people)
  }
  const Rp = Math.max.apply(null, xbarP) - Math.min.apply(null, xbarP)
  const PV = Rp * K3

  // TV：优先用过程标准差 × 6
  const sigmaProc = Number(o.processSigma)
  const useProc = isFinite(sigmaProc) && sigmaProc > 0
  const TV = useProc ? sigmaProc * 6 : Math.sqrt(GRR * GRR + PV * PV)
  if (!(TV > 0)) return null

  // 相对指标
  const pctEV = EV / TV * 100
  const pctAV = AV / TV * 100
  const pctPV = PV / TV * 100
  const pctGRR = GRR / TV * 100

  // 公差比 P/T（需同时填 USL > LSL）
  const uslNum = Number(o.usl)
  const lslNum = Number(o.lsl)
  const hasPT = isFinite(uslNum) && isFinite(lslNum) && uslNum > lslNum
  const pT = hasPT ? 6 * GRR / (uslNum - lslNum) * 100 : NaN

  // NDC = ⌊1.41 × PV/GRR⌋（GRR = 0 时无法定义）
  const ndc = GRR > 0 ? Math.floor(1.41 * PV / GRR) : NaN

  return {
    EV, AV, GRR, PV, TV, rDoubleBar, xdiff, Rp, xbarA, rbarA, xbarP,
    avClamped, useProc, pctEV, pctAV, pctPV, pctGRR, hasPT, pT, ndc
  }
}

// AIAG 三档判定：<10 可接受 / ≤30 有条件 / >30 不可接受
const judgeGrr = (pct) => {
  if (pct === null || pct === undefined || !isFinite(pct)) return null
  if (pct < 10) return { key: 'ok', label: '可接受', desc: '测量系统变差可忽略，可用于过程控制与分析' }
  if (pct <= 30) return { key: 'cond', label: '有条件接受', desc: '处于灰色地带，需结合量具成本、特性重要性与客户要求权衡' }
  return { key: 'bad', label: '不可接受', desc: '测量系统变差过大，应先改进量具与测量手法' }
}

// 确定性伪随机（示例数据用，mulberry32）
const mulberry32 = (seed) => {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 示例数据：零件均值 22~40，操作者偏置 0/0.2/0.4，重复性噪声 σ≈0.4，读数保留 2 位
const generateGrrDemo = (seed) => {
  const rnd = mulberry32(seed === undefined ? 20261105 : seed)
  let spare = null
  const gauss = () => {
    if (spare !== null) { const s = spare; spare = null; return s }
    let u = 0
    let v = 0
    while (u === 0) u = rnd()
    while (v === 0) v = rnd()
    const mag = Math.sqrt(-2 * Math.log(u))
    spare = mag * Math.sin(2 * Math.PI * v)
    return mag * Math.cos(2 * Math.PI * v)
  }
  const biases = [0, 0.2, 0.4]
  const partMeans = [22, 24, 26, 28, 30, 32, 34, 36, 38, 40]
  const out = []
  for (let a = 0; a < 3; a++) {
    const block = []
    for (let p = 0; p < 10; p++) {
      const trials = []
      for (let t = 0; t < 3; t++) {
        const v = partMeans[p] + biases[a] + gauss() * 0.4
        trials.push(Math.round(v * 100) / 100)
      }
      block.push(trials)
    }
    out.push(block)
  }
  return out
}

// 展示格式化（先按位数四舍五入，避免浮点尾差）
const fmtNum = (v, digits) => {
  if (v === null || v === undefined || !isFinite(v)) return '—'
  const d = digits === undefined ? 4 : digits
  const m = Math.pow(10, d)
  return String(Math.round(v * m) / m)
}
// __PURE_FNS_END__

// ---------- 状态 ----------
const appraiserNames = ['A', 'B', 'C']
const blankCells = () => Array.from({ length: 3 }, () => Array.from({ length: 10 }, () => Array.from({ length: 3 }, () => '')))
const cells = ref(blankCells())
const usl = ref('')
const lsl = ref('')
const processSigma = ref('')

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 输入持久化（键前缀为工具 id）
watch([cells, usl, lsl, processSigma], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      cells: cells.value,
      usl: usl.value,
      lsl: lsl.value,
      processSigma: processSigma.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}, { deep: true })

const clearAll = () => { cells.value = blankCells() }
const loadDemo = () => {
  cells.value = generateGrrDemo()
  // 预设 USL/LSL 口径（30±15），过程标准差留空走零件变差口径
  usl.value = 45
  lsl.value = 15
}

const fillCount = computed(() => {
  let n = 0
  for (const a of cells.value) {
    for (const p of a) {
      for (const t of p) {
        if (isFinite(Number(t))) n++
      }
    }
  }
  return n
})

// 单元格辅助显示
const rowRange = (a, p) => {
  const vals = cells.value[a][p].map(Number)
  if (!vals.every(v => isFinite(v))) return '—'
  return fmtNum(Math.max.apply(null, vals) - Math.min.apply(null, vals), 2)
}
const appraiserStats = (a) => {
  const filled = []
  for (let p = 0; p < 10; p++) {
    const vals = cells.value[a][p].map(Number)
    if (vals.every(v => isFinite(v))) filled.push(vals)
  }
  if (!filled.length) return { xbar: NaN, rbar: NaN }
  const xs = filled.map(v => v.reduce((s, x) => s + x, 0) / v.length)
  const rs = filled.map(v => Math.max.apply(null, v) - Math.min.apply(null, v))
  return {
    xbar: xs.reduce((s, x) => s + x, 0) / xs.length,
    rbar: rs.reduce((s, x) => s + x, 0) / rs.length
  }
}

// ---------- 计算 ----------
const grrInput = computed(() => ({
  usl: usl.value,
  lsl: lsl.value,
  processSigma: processSigma.value
}))
const grr = computed(() => grrCompute(cells.value, grrInput.value))

const grrJudge = computed(() => judgeGrr(grr.value ? grr.value.pctGRR : NaN))
const ptJudge = computed(() => judgeGrr(grr.value && grr.value.hasPT ? grr.value.pT : NaN))

const judgeClsMap = {
  ok: 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300',
  cond: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
  bad: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
}
const judgeBands = [
  { key: 'ok', range: '%GRR 或 P/T < 10%', desc: '可接受：测量系统变差可忽略，用于过程控制与分析', activeCls: judgeClsMap.ok },
  { key: 'cond', range: '%GRR 或 P/T 10% ~ 30%', desc: '有条件接受：结合成本、重要性权衡，关键件从严', activeCls: judgeClsMap.cond },
  { key: 'bad', range: '%GRR 或 P/T > 30%', desc: '不可接受：先改进量具、夹持与测量手法', activeCls: judgeClsMap.bad }
]
const grrJudgeCls = computed(() => (grrJudge.value ? judgeClsMap[grrJudge.value.key] : ''))
const ptJudgeCls = computed(() => (ptJudge.value ? judgeClsMap[ptJudge.value.key] : ''))

const ndcCls = computed(() => {
  if (!grr.value) return ''
  const n = grr.value.ndc
  if (!isFinite(n)) return 'text-red-600 dark:text-red-400'
  if (n >= 5) return 'text-green-600 dark:text-green-400'
  if (n >= 1) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
})
const ndcHint = computed(() => {
  if (!grr.value) return ''
  const n = grr.value.ndc
  if (!isFinite(n)) return 'GRR 为 0，NDC 无法定义（检查数据是否全部相同）'
  if (n >= 5) return '≥ 5，分辨分级数充足'
  if (n >= 1) return '不足 5，相对零件变差噪声偏大'
  return '≈ 0，测量系统几乎无法区分零件差异'
})

// 方差分解条（EV/AV/PV 占 TV 的方差比例）
const varBar = computed(() => {
  if (!grr.value) return null
  const { EV, AV, PV, TV } = grr.value
  let e = EV * EV / (TV * TV)
  let a = AV * AV / (TV * TV)
  let p = PV * PV / (TV * TV)
  // TV 取自过程标准差且分量方差超出 TV² 时按比例归一化
  if (e + a + p > 1) {
    const total = e + a + p
    e /= total
    a /= total
    p /= total
  }
  const remainder = Math.max(0, 1 - e - a - p)
  const colors = { ev: 'text-primary', av: 'text-sky-500', pv: 'text-emerald-500', other: 'text-muted-foreground/40' }
  const partsSeg = [
    { share: e, cls: colors.ev },
    { share: a, cls: colors.av },
    { share: p, cls: colors.pv },
    { share: remainder, cls: colors.other }
  ].filter(s => s.share > 0)
  let x = 0
  const segs = partsSeg.map(s => {
    const w = s.share * 600
    const seg = { x, w: Math.max(w, 1), cls: s.cls }
    x += w
    return seg
  })
  return {
    segs,
    pctEV: e * 100,
    pctAV: a * 100,
    pctPV: p * 100,
    remainderPct: remainder * 100
  }
})

const copyResult = () => {
  if (!grr.value) return
  const g = grr.value
  const lines = [
    'GR&R 测量系统分析（AIAG 均值极差法，10×3×3）',
    `EV(重复性) = ${fmtNum(g.EV)}（%EV = ${fmtNum(g.pctEV, 2)}%）`,
    `AV(再现性) = ${fmtNum(g.AV)}（%AV = ${fmtNum(g.pctAV, 2)}%）${g.avClamped ? '（根号内为负取 0）' : ''}`,
    `GRR = ${fmtNum(g.GRR)}，PV = ${fmtNum(g.PV)}，TV = ${fmtNum(g.TV)}${g.useProc ? '（6×σ过程）' : ''}`,
    `%GRR = ${fmtNum(g.pctGRR, 2)}% → ${grrJudge.value ? grrJudge.value.label : '—'}`,
    g.hasPT ? `P/T = ${fmtNum(g.pT, 2)}% → ${ptJudge.value ? ptJudge.value.label : '—'}` : 'P/T：未填公差',
    `NDC = ${fmtNum(g.ndc, 0)}（AIAG 建议 ≥ 5）`,
    '口径：AIAG MSA 第四版均值极差法简化实现'
  ]
  const text = lines.join('\n')
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制 GR&R 分析结论到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动选择文本复制')
    })
  } else {
    alert('当前环境不支持剪贴板，请手动选择文本复制')
  }
}

// ---------- 相关工具 ----------
const relatedLinks = computed(() => ['cpk-process-capability', 'dppm-yield-calculator', 'aql-sampling-calculator']
  .map(id => tools.find(t => t.id === id))
  .filter(Boolean))
</script>
