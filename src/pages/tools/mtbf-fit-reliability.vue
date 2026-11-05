<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Gauge class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">MTBF/FIT可靠性换算</h1>
          <p class="text-sm text-muted-foreground mt-1">MTBF ⇄ FIT ⇄ AFR ⇄ λ 四向联动，系统 FIT 合成、Arrhenius 加速因子与串/并联可靠性</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        四个模块一站式算清现场可靠性：① 基础换算——MTBF、FIT、年失效率 AFR、小时失效率 λ 任一输入其余联动，AFR 并列线性近似与指数式双口径；
        ② 系统合成——按器件行（名称 × 数量 × FIT）求 ΣFIT 与系统 MTBF，自动定位最弱环节；③ Arrhenius 加速因子——Ea/k 温度加速模型，烧机时长与现场年限互折；
        ④ 串/并联可靠性——n 个相同单元的可靠度与 MTBF 视角。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        MTBF 是随机失效期失效率的倒数，不是日历寿命也不是保修期；DPPM 管出厂质量、FIT 管现场可靠性，两者不能互相换算。
        内置自核锚点：MTBF = 10⁹ h → FIT = 1；FIT = 250 → MTBF = 4×10⁶ h；MTBF = 80,000 h → FIT = 12,500；Ea = 0.7 eV、55℃→125℃ → AF ≈ 77.66。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 模块①：基础换算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ArrowLeftRight class="w-5 h-5 mr-2 text-primary" /> 基础换算（MTBF ⇄ FIT ⇄ AFR ⇄ λ）
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="mtbf-in" class="block text-sm font-medium text-foreground mb-1.5">MTBF（h）</label>
              <input
                id="mtbf-in"
                v-model.number="inMtbf"
                @input="setFrom('mtbf')"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 4000000"
              >
            </div>
            <div>
              <label for="fit-in" class="block text-sm font-medium text-foreground mb-1.5">FIT（次 / 10⁹ h）</label>
              <input
                id="fit-in"
                v-model.number="inFit"
                @input="setFrom('fit')"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 250"
              >
            </div>
            <div>
              <label for="afr-in" class="block text-sm font-medium text-foreground mb-1.5">年失效率 AFR（%/年，线性口径）</label>
              <input
                id="afr-in"
                v-model.number="inAfr"
                @input="setFrom('afr')"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 0.219"
              >
            </div>
            <div>
              <label for="lam-in" class="block text-sm font-medium text-foreground mb-1.5">失效率 λ（次 / h）</label>
              <input
                id="lam-in"
                v-model.number="inLam"
                @input="setFrom('lam')"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 2.5e-7"
              >
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            任一字段输入即以其为基准联动换算其余三项；AFR 字段为线性口径（= FIT×8760/10⁹），反解亦按线性。
          </p>

          <template v-if="convValid">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">MTBF = 10⁹ / FIT</p>
                <p class="text-2xl font-bold text-primary">{{ fmtNum(convMtbf) }} <span class="text-sm font-medium text-muted-foreground">h</span></p>
                <p class="text-xs text-muted-foreground mt-1">≈ {{ fmtNum(convMtbf / 8760, 4) }} 年连续通电</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">FIT = 10⁹ / MTBF</p>
                <p class="text-2xl font-bold text-foreground">{{ fmtNum(outFit) }}</p>
                <p class="text-xs text-muted-foreground mt-1">次 / 10⁹ 器件小时</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">年失效率 AFR（双口径）</p>
                <p class="text-2xl font-bold text-foreground">{{ fmtNum(outAfrLin, 4) }}%</p>
                <p class="text-xs text-muted-foreground mt-1">线性近似；指数式 1−exp(−8760/MTBF) = {{ fmtNum(outAfrExp, 4) }}%（相对差 {{ fmtNum(afrDiffRel, 3) }}%）</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">失效率 λ = 1 / MTBF</p>
                <p class="text-2xl font-bold text-foreground">{{ fmtNum(outLam) }}</p>
                <p class="text-xs text-muted-foreground mt-1">次 / 小时（= FIT×10⁻⁹）</p>
              </div>
            </div>
            <div class="flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-lg p-3">
              <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p class="text-xs leading-relaxed text-muted-foreground">
                口径注记：MTBF 是失效率倒数不是日历寿命——给定任务时间内能不能撑住，要用可靠度 R = exp(−t/MTBF) 另算（见侧栏串/并联模块）；
                DPPM 管出厂质量、FIT 管现场可靠性。AFR 常见量级（MTBF ≥ 4.4×10⁶ h、AFR &lt; 0.2%）下线性与指数式相对差 &lt; 0.1%，失效率更高时以指数式为准。
              </p>
            </div>
            <button
              @click="copyConv"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
            >
              <Copy class="w-3.5 h-3.5" /> 复制换算结论
            </button>
          </template>
          <div v-else class="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            输入任一正数开始换算（示例：MTBF = 4×10⁶ h → FIT = 250 → AFR ≈ 0.219%/年）
          </div>
        </div>

        <!-- 模块②：系统合成 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Network class="w-5 h-5 mr-2 text-primary" /> 系统合成（串联：ΣFIT = Σ 数量×FIT）
          </h2>

          <div class="hidden sm:grid grid-cols-[1fr_5rem_6.5rem_4rem_1.75rem] gap-2 text-xs text-muted-foreground px-1.5">
            <span>器件名</span>
            <span class="text-right">数量</span>
            <span class="text-right">FIT</span>
            <span class="text-right">贡献</span>
            <span></span>
          </div>
          <div class="space-y-2">
            <div
              v-for="(row, idx) in sysRows"
              :key="idx"
              class="flex items-center gap-2 rounded-lg p-1.5 transition"
              :class="sys && sys.items.length > 1 && sys.worstIdx === idx ? 'ring-1 ring-red-400 bg-red-500/5' : ''"
            >
              <input
                v-model="row.name"
                type="text"
                class="flex-1 min-w-0 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="器件名"
              >
              <input
                v-model.number="row.qty"
                type="number"
                min="1"
                step="1"
                class="w-16 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="50"
              >
              <input
                v-model.number="row.fit"
                type="number"
                min="0"
                step="any"
                class="w-24 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="250"
              >
              <span class="w-14 text-right text-xs text-muted-foreground flex-shrink-0">{{ rowPct(idx) }}</span>
              <button
                @click="removeSysRow(idx)"
                class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition"
                :aria-label="'删除器件 ' + (row.name || idx + 1)"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="addSysRow"
              class="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
            >
              <Plus class="w-3.5 h-3.5" /> 添加器件
            </button>
            <button
              @click="loadSysDemo"
              class="flex-1 py-2 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
            >示例：多器件整机</button>
          </div>
          <p v-if="sys && sys.invalidCount > 0" class="text-xs text-yellow-600 dark:text-yellow-400">
            {{ sys.invalidCount }} 行无效（数量需 ≥ 1、FIT 需 > 0），已从计算中剔除
          </p>

          <template v-if="sys">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">ΣFIT = Σ（数量 × FIT）</p>
                <p class="text-2xl font-bold text-primary">{{ fmtNum(sys.totalFit) }} <span class="text-sm font-medium text-muted-foreground">FIT</span></p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">系统 MTBF = 10⁹ / ΣFIT</p>
                <p class="text-2xl font-bold text-foreground">{{ fmtNum(sys.mtbf) }} <span class="text-sm font-medium text-muted-foreground">h</span></p>
                <p class="text-xs text-muted-foreground mt-1">≈ {{ fmtNum(sys.mtbf / 8760, 4) }} 年连续通电</p>
              </div>
            </div>
            <p class="text-xs leading-relaxed text-muted-foreground bg-muted/50 border border-border rounded-lg p-2.5">
              最弱环节：<span class="text-red-600 dark:text-red-400 font-medium">{{ sys.worstName }}（贡献 {{ fmtNum(sys.worstPct, 3) }}% 的系统失效率）</span>。
              系统 MTBF 由最弱环节主导——「数量×FIT」最大的那行决定大头，降 FIT 优先降它；串联失效率直接相加，所以 FIT 可以按行累加。
            </p>
          </template>
          <div v-else class="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            至少填入一行有效器件（数量 ≥ 1、FIT > 0）
          </div>
        </div>

        <!-- 模块③：Arrhenius 加速因子 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Flame class="w-5 h-5 mr-2 text-primary" /> Arrhenius 加速因子（温度加速折算）
          </h2>

          <div>
            <label for="ea-in" class="block text-sm font-medium text-foreground mb-1.5">激活能 Ea（eV）</label>
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="e0 in eaOptions"
                :key="e0"
                @click="ea = e0"
                :class="Number(ea) === e0 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              >{{ e0 }} eV</button>
              <input
                id="ea-in"
                v-model.number="ea"
                type="number"
                min="0.01"
                step="0.05"
                class="w-24 px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
                aria-label="自定义激活能 Ea（eV）"
              >
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              0.7 eV 为硅器件通用经验值；电迁移 / 互连类机理常见 0.3~0.5 eV，介质击穿 / 钝化类可到 1.0 eV——氧化、电迁移等机理不同，以失效分析结论或厂商报告为准。
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="t-use" class="block text-sm font-medium text-foreground mb-1.5">现场使用温度 T_use（℃）</label>
              <input
                id="t-use"
                v-model.number="tUseC"
                type="number"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 55"
              >
              <p class="text-xs text-muted-foreground mt-1">= {{ fmtNum(cToK(tUseC), 6) }} K（自动换算开尔文）</p>
            </div>
            <div>
              <label for="t-stress" class="block text-sm font-medium text-foreground mb-1.5">应力温度 T_stress（℃）</label>
              <input
                id="t-stress"
                v-model.number="tStressC"
                type="number"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 125"
              >
              <p class="text-xs text-muted-foreground mt-1">= {{ fmtNum(cToK(tStressC), 6) }} K（自动换算开尔文）</p>
            </div>
            <div>
              <label for="burn-h" class="block text-sm font-medium text-foreground mb-1.5">试验时长 t（h）</label>
              <input
                id="burn-h"
                v-model.number="burnH"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 1000"
              >
            </div>
          </div>

          <template v-if="afValid">
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">AF = exp（Ea/k ×（1/T_use − 1/T_stress）），k = 8.617×10⁻⁵ eV/K</p>
              <p class="text-3xl font-bold text-primary">{{ fmtNum(af, 5) }} <span class="text-base font-medium text-muted-foreground">倍加速</span></p>
              <p v-if="af > 1 && burnH > 0" class="text-xs text-muted-foreground mt-1.5">
                {{ fmtNum(tStressC, 6) }}℃ 试验 {{ fmtNum(burnH, 6) }} h ≈ {{ fmtNum(tUseC, 6) }}℃ 现场 {{ fmtNum(fieldH, 5) }} h（≈ {{ fmtNum(fieldYears, 3) }} 年）；
                反向：覆盖现场一年（8,760 h）只需试验 {{ fmtNum(8760 / af, 4) }} h
              </p>
              <p v-else-if="af <= 1" class="text-xs text-yellow-600 dark:text-yellow-400 mt-1.5">
                T_stress ≤ T_use，AF ≤ 1 无加速意义——请确认是否把现场与应力温度填反
              </p>
            </div>
            <p class="text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg p-2.5">
              自核：Ea = 0.7 eV、55℃→125℃ 时 AF ≈ {{ fmtNum(anchorAF, 5) }}（与行业加速表 ≈ 78 倍一致）。
              烧机折算只覆盖温度应力，电压 / 湿度 / 机械应力需另按 Eyring、Coffin-Manson 等模型处理。
            </p>
          </template>
          <div v-else class="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            填入 Ea 与两个温度（T > −273.15℃）后给出加速因子
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 模块④：串/并联可靠性 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <Layers class="w-4 h-4 mr-2 text-primary" /> 串联 / 并联可靠性（进阶）
          </h3>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label for="sp-n" class="block text-xs text-muted-foreground mb-1">单元数 n</label>
              <input
                id="sp-n"
                v-model.number="spN"
                type="number"
                min="1"
                max="20"
                step="1"
                class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
            </div>
            <div>
              <label for="sp-mtbf" class="block text-xs text-muted-foreground mb-1">单元 MTBF（h）</label>
              <input
                id="sp-mtbf"
                v-model.number="spUnitMtbf"
                type="number"
                min="0"
                step="any"
                class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
            </div>
            <div>
              <label for="sp-t" class="block text-xs text-muted-foreground mb-1">任务时间 t（h）</label>
              <input
                id="sp-t"
                v-model.number="spT"
                type="number"
                min="0"
                step="any"
                class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
            </div>
          </div>

          <template v-if="spValid">
            <div class="bg-muted/50 rounded-lg p-3 space-y-2 text-xs leading-relaxed">
              <p class="text-muted-foreground">
                单元可靠度 r = exp(−t/MTBF) = <span class="text-foreground font-medium">{{ fmtNum(spR * 100, 4) }}%</span>（t = {{ fmtNum(spT, 4) }} h）
              </p>
              <p class="text-muted-foreground">
                串联 R = rⁿ = <span class="text-foreground font-medium">{{ fmtNum(spSer * 100, 4) }}%</span>；MTBF 视角：系统 MTBF = 单元 MTBF ÷ n = {{ fmtNum(spSerMtbf, 5) }} h
              </p>
              <p class="text-muted-foreground">
                并联 R = 1−(1−r)ⁿ = <span class="text-foreground font-medium">{{ fmtNum(spPar * 100, 4) }}%</span>；MTBF 视角：系统 MTBF ≈ 单元 MTBF × Hₙ = {{ fmtNum(spParMtbf, 5) }} h（H₂ = 1.5、H₃ ≈ 1.833）
              </p>
            </div>
            <p class="text-xs leading-relaxed text-muted-foreground">
              串联一坏全坏，可靠性只降不升；并联冗余收益随 n 递减（调和数 Hₙ 增长缓慢），换来的成本与体积要权衡。指数寿命假设，r 按任务时间折算。
            </p>
          </template>
          <div v-else class="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            填入单元 MTBF 与任务时间（需 0 &lt; r ≤ 1、1 ≤ n ≤ 20）
          </div>
        </div>

        <!-- 口径铁律卡 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <AlertTriangle class="w-4 h-4 mr-2 text-primary" /> 口径铁律
          </h3>
          <ul class="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <li>MTBF 是失效率的倒数，<span class="text-foreground font-medium">不是日历寿命</span>：MTBF = 10⁶ h 只代表每 10⁶ 器件小时平均发生一次随机失效。</li>
            <li><span class="text-foreground font-medium">DPPM 管出厂质量、FIT 管现场可靠性</span>，两者口径不同、不能互相换算。</li>
            <li>Arrhenius 折算只覆盖温度应力；Ea 取值比烧机时长更能左右结论。</li>
          </ul>
          <NuxtLink
            to="/tools/dppm-yield-calculator"
            class="block px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm text-foreground transition"
          >出厂质量口径？→ DPPM 良率计算器</NuxtLink>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>FIT 是什么：定义、单位与换算</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          FIT（Failure In Time）是现场失效率单位：1 FIT = 每 10⁹ 器件小时失效 1 次。MTBF（Mean Time Between Failures）与之互为倒数：
          MTBF(h) = 10⁹ ÷ FIT，失效率 λ = 1/MTBF（次/小时）= FIT×10⁻⁹。年失效率 AFR 常用两种口径：线性近似 AFR ≈ 8760/MTBF（即 FIT×8760/10⁹），
          指数式 AFR = 1−exp(−8760/MTBF)。常见量级下两者差异极小：MTBF ≥ 4.4×10⁶ h（AFR &lt; 0.2%，消费级 IC 典型量级）时相对差 &lt; 0.1%；
          MTBF 更小、失效率更高时应以指数式为准。本工具任一字段输入即四向联动，方便对规格书里的任一口径直读换算。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>MTBF 的常见误读：它是失效率的倒数，不是日历寿命</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          「MTBF 100 万小时 = 能用 114 年」是最常见的误读。MTBF 描述的是随机失效期（浴盆曲线平底段）的失效率倒数：一群器件累计运行 10⁶ 器件小时，
          平均发生 1 次失效。单只器件能否撑过任务时间 t 要用可靠度衡量：R(t) = exp(−t/MTBF)。以 MTBF = 10⁶ h 计算，连续通电一年的不失效概率约 99.1%，
          十年约 91.5%——远没有「114 年」乐观。而且磨损 / 寿命末期（浴盆曲线右端）不在 MTBF 口径内，那由设计寿命、磨损机理与烧机数据决定。
          对外承诺寿命前，先确认对方要的是 MTBF、设计寿命还是 B10 寿命。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>Arrhenius 加速因子与 Ea 取值</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          Arrhenius 模型把失效率对温度的依赖写成 AF = exp(Ea/k ×（1/T_use − 1/T_stress）)，其中 k = 8.617×10⁻⁵ eV/K 是玻尔兹曼常数，
          T 必须用开尔文（℃ + 273.15）。Ea（激活能）按失效机理取值：0.7 eV 是硅器件通用经验值；电迁移、互连类机理常见 0.3~0.5 eV；
          介质击穿、钝化层类可取 1.0 eV。同样 55℃→125℃：Ea = 0.3 / 0.5 / 0.7 / 1.0 eV 分别对应 AF ≈ 6.5 / 22 / 78 / 500 倍——
          Ea 取值比烧机时长更能左右结论，必须以失效分析结论或厂商可靠性报告为准，不能随意套用。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>烧机时长怎么折算现场年限</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          烧机 / 老化试验在应力温度 T_stress 下运行 t 小时，按 Arrhenius 口径等效于现场使用温度 T_use 下 AF×t 小时。
          例：125℃ 烧 1,000 h、现场 55℃、Ea = 0.7 eV → AF ≈ 77.7，等效现场 77,700 h ≈ 8.9 年。反向也常用：想用 125℃ 老化覆盖现场一年（8,760 h @ 55℃），
          只需 8,760 ÷ 77.7 ≈ 113 h 试验。注意两点：折算只覆盖温度应力，电压 / 湿度应力需按 Eyring 或 Coffin-Manson 类模型另行叠加；
          折算的是随机失效统计口径，不能等同于「免老化寿命保证」。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>系统可靠性合成：FIT 为什么直接相加</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          串联（任一器件失效即系统失效）的系统失效率是各器件失效率之和：ΣFIT = Σ（数量×FIT），系统 MTBF = 10⁹/ΣFIT——
          这就是「50 只 250 FIT 的器件合成出 MTBF 80,000 h」的由来。合成后看贡献占比：数量×FIT 最大的那行是「最弱环节」，
          占系统失效率的百分比最高，降 FIT 优先降它。并联冗余则相反：n 个相同单元并联 R = 1−(1−r)ⁿ，
          系统 MTBF ≈ 单元 MTBF×（1 + 1/2 + ⋯ + 1/n），可靠性收益随 n 递减。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>DPPM vs FIT：出厂质量与现场可靠性</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          DPPM 管出厂：每百万只中的不良数，反映工艺 / 制造质量，抽检口径与置信上限见
          <NuxtLink to="/tools/dppm-yield-calculator" class="text-primary hover:underline">DPPM 良率计算器</NuxtLink>。
          FIT 管现场：每 10⁹ 器件小时失效数，反映设计裕量与使用应力下的随机失效。出厂 DPPM 高的批现场 FIT 未必高
          （出厂不良多为可筛出的工艺缺陷），反之亦然——两者不能互相换算，客户要求里必须分开对待。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">MTBF 100 万小时是不是能用 114 年？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              不是。MTBF = 10⁶ h 表示随机失效期失效率 λ = 10⁻⁶ 次/h：一群器件累计运行 100 万器件小时平均发生一次失效。
              单只器件连续通电一年的不失效概率 R = exp(−8760/10⁶) ≈ 99.1%，十年 ≈ 91.5%。MTBF 是失效率的倒数，不是日历寿命也不是保修期。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">FIT 和 DPPM 有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              DPPM 管出厂质量（每百万只中的不良数，出货之前），FIT 管现场可靠性（每 10⁹ 器件小时的失效数，出货之后），两者口径不同、不能直接换算。
              串联系统总 FIT 等于各器件「数量×FIT」之和，系统 MTBF = 10⁹/ΣFIT。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">Arrhenius 加速因子的 Ea 怎么取？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              0.7 eV 是硅器件通用经验值；电迁移等互连机理常见 0.3~0.5 eV，介质击穿 / 钝化类可取 1.0 eV。
              同样 55℃→125℃，Ea 从 0.5 提到 0.7 倍速就从约 22 倍跳到约 78 倍——应以失效分析结论或厂商可靠性报告为准。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">1000 小时 125℃ 老化等效现场多久？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              按 AF = exp(Ea/k×(1/T_use−1/T_stress))：Ea = 0.7 eV、现场 55℃ 时 AF ≈ 77.7，等效现场 77,700 h ≈ 8.9 年；
              反向覆盖一年现场（8,760 h）只需约 113 h 试验。Ea 取值不同结果显著变化，需先定机理再折算。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'mtbf-fit-reliability'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Gauge, ArrowLeftRight, Network, Flame, Layers, Info, AlertTriangle,
  ChevronUp, ChevronDown, Copy, Plus, X, Link as LinkIcon
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'mtbf-fit-reliability'
const STORAGE_KEY = 'mtbf-fit-reliability.inputs'

// SEO
useSeoMeta({
  title: 'MTBF/FIT可靠性换算 - MTBF、FIT、AFR双向换算与Arrhenius加速因子',
  description: '在线 MTBF/FIT 换算工具：MTBF、FIT、AFR 年失效率、λ 失效率四向联动换算，串联系统 FIT 合成与最弱环节定位，Arrhenius 加速因子（Ea 0.3~1.0 eV）与烧机时长折算现场年限，纯本地计算',
  keywords: 'mtbf计算, fit换算, 失效率单位, mtbf fit关系, 年失效率afr, arrhenius加速因子, 老化等效时间, 可靠性计算, mtbf calculator, fit rate',
  author: 'Util工具箱',
  ogTitle: 'MTBF/FIT可靠性换算 - 有条工具',
  ogDescription: 'MTBF ⇄ FIT ⇄ AFR ⇄ λ 四向换算、系统 FIT 合成、Arrhenius 加速因子与串/并联可靠性',
  ogUrl: 'https://www.util.cn/tools/mtbf-fit-reliability',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'MTBF/FIT可靠性换算',
  twitterDescription: 'MTBF、FIT、AFR 四向换算与 Arrhenius 温度加速折算，纯本地计算'
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
          name: 'MTBF/FIT可靠性换算',
          url: 'https://www.util.cn/tools/mtbf-fit-reliability',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'MTBF / FIT / AFR / λ 四向联动换算',
            'AFR 线性近似与指数式双口径对照',
            '串联系统 ΣFIT 合成与最弱环节定位',
            'Arrhenius 加速因子与烧机-现场时长互折',
            '串 / 并联可靠度与 MTBF 视角'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: 'MTBF/FIT可靠性换算', item: 'https://www.util.cn/tools/mtbf-fit-reliability/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'MTBF 100 万小时是不是能用 114 年？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。MTBF 是随机失效期失效率的倒数：MTBF=10⁶ h 表示每 100 万器件小时平均一次失效，单只器件通电一年不失效概率约 99.1%（R=exp(−t/MTBF)），不是日历寿命。' }
            },
            {
              '@type': 'Question',
              name: 'FIT 和 DPPM 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'DPPM 管出厂质量（每百万只中的不良数，出货前），FIT 管现场可靠性（每 10⁹ 器件小时的失效数，出货后），两者不能直接换算；串联系统总 FIT 等于各器件数量×FIT 之和。' }
            },
            {
              '@type': 'Question',
              name: 'Arrhenius 加速因子的 Ea 怎么取？',
              acceptedAnswer: { '@type': 'Answer', text: '0.7 eV 是硅器件通用经验值；电迁移等互连机理常见 0.3~0.5 eV，介质击穿/钝化类可取 1.0 eV，应以失效分析结论或厂商可靠性报告为准。' }
            },
            {
              '@type': 'Question',
              name: '1000 小时 125℃ 老化等效现场多久？',
              acceptedAnswer: { '@type': 'Answer', text: '按 AF=exp(Ea/k×(1/T_use−1/T_stress))：Ea=0.7 eV、现场 55℃ 时 AF≈77.7，等效现场 77,700 h≈8.9 年；反向覆盖一年现场只需约 113 h 试验。' }
            }
          ]
        }
      ]
    })
  }]
})

// __PURE_FNS_START__
// ---------- 可靠性纯函数（无外部依赖） ----------
const HOURS_PER_YEAR = 8760
const BOLTZMANN = 8.617e-5 // eV/K

// 9 位有效数字取整：清理四向联动回写时的浮点尾差
const roundSig = (v, sig = 9) => {
  if (!isFinite(v) || v === 0) return v
  return Number(v.toPrecision(sig))
}

const cToK = (c) => Number(c) + 273.15

const fitFromMtbf = (mtbf) => (isFinite(mtbf) && mtbf > 0 ? 1e9 / mtbf : NaN)
const mtbfFromFit = (fit) => (isFinite(fit) && fit > 0 ? 1e9 / fit : NaN)
const lambdaFromMtbf = (mtbf) => (isFinite(mtbf) && mtbf > 0 ? 1 / mtbf : NaN)
const mtbfFromLambda = (lam) => (isFinite(lam) && lam > 0 ? 1 / lam : NaN)

// AFR 双口径：线性近似 8760/MTBF（= FIT×8760/10⁹）与指数式 1−exp(−8760/MTBF)
const afrLinPct = (mtbf) => (isFinite(mtbf) && mtbf > 0 ? HOURS_PER_YEAR / mtbf * 100 : NaN)
const afrExpPct = (mtbf) => (isFinite(mtbf) && mtbf > 0 ? (1 - Math.exp(-HOURS_PER_YEAR / mtbf)) * 100 : NaN)
const mtbfFromAfrPct = (pct) => (isFinite(pct) && pct > 0 ? HOURS_PER_YEAR * 100 / pct : NaN)
const afrFromFitPct = (fit) => (isFinite(fit) && fit > 0 ? fit * HOURS_PER_YEAR / 1e9 * 100 : NaN)

// 系统合成：ΣFIT = Σ(数量×FIT)，系统 MTBF = 10⁹/ΣFIT，定位最弱环节（数量×FIT 最大行）
const systemSynth = (rows) => {
  const valid = []
  let invalidCount = 0
  rows.forEach((r, i) => {
    const qty = Number(r.qty)
    const fit = Number(r.fit)
    if (isFinite(qty) && qty >= 1 && isFinite(fit) && fit > 0) {
      valid.push({ i, name: r.name, qty, fit, contrib: qty * fit })
    } else {
      invalidCount++
    }
  })
  if (!valid.length) return null
  const totalFit = valid.reduce((s, r) => s + r.contrib, 0)
  const worst = valid.reduce((w, r) => (r.contrib > w.contrib ? r : w), valid[0])
  return {
    totalFit,
    mtbf: 1e9 / totalFit,
    worstIdx: worst.i,
    worstName: worst.name || `器件 ${worst.i + 1}`,
    worstPct: worst.contrib / totalFit * 100,
    items: valid.map((r) => ({ i: r.i, name: r.name, qty: r.qty, fit: r.fit, contrib: r.contrib, pct: r.contrib / totalFit * 100 })),
    invalidCount
  }
}

// Arrhenius 加速因子：AF = exp(Ea/k × (1/T_use − 1/T_stress))，T 用开尔文
const arrheniusAF = (ea, tUseK, tStressK) => (
  isFinite(ea) && ea > 0 && isFinite(tUseK) && tUseK > 0 && isFinite(tStressK) && tStressK > 0
    ? Math.exp(ea / BOLTZMANN * (1 / tUseK - 1 / tStressK))
    : NaN
)

// 串/并联：r 由单元 MTBF 与任务时间折算（指数寿命）
const rFromMtbf = (mtbf, t) => (isFinite(mtbf) && mtbf > 0 && isFinite(t) && t >= 0 ? Math.exp(-t / mtbf) : NaN)
const seriesRel = (r, n) => Math.pow(r, n)
const parallelRel = (r, n) => 1 - Math.pow(1 - r, n)
// 并联系统 MTBF = 单元 MTBF × Hₙ（调和数，指数寿命解析解）
const parallelMtbfFactor = (n) => {
  let h = 0
  for (let k = 1; k <= n; k++) h += 1 / k
  return h
}

// 展示格式化（避免浮点尾差；小量纲走科学计数上标）
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '' }
const supNum = (n) => String(n).split('').map((c) => SUP[c] !== undefined ? SUP[c] : c).join('')
const fmtSci = (v, sig = 4) => {
  const exp = Math.floor(Math.log10(Math.abs(v)))
  const mant = Number((v / Math.pow(10, exp)).toPrecision(sig))
  return `${mant}×10${supNum(exp)}`
}
const fmtNum = (v, sig = 6) => {
  if (!isFinite(v)) return '—'
  if (v === 0) return '0'
  const a = Math.abs(v)
  if (a >= 1e9 || a < 1e-3) return fmtSci(v, Math.min(sig, 4))
  return Number(v.toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 6 })
}
// __PURE_FNS_END__

// ---------- 状态 ----------
const CONV_KEYS = ['mtbf', 'fit', 'afr', 'lam']
const inMtbf = ref(4000000)
const inFit = ref(250)
const inAfr = ref(0.219)
const inLam = ref(2.5e-7)
const convRefs = { mtbf: inMtbf, fit: inFit, afr: inAfr, lam: inLam }
const convSource = ref('mtbf')

const eaOptions = [0.3, 0.5, 0.7, 1.0]
const ea = ref(0.7)
const tUseC = ref(55)
const tStressC = ref(125)
const burnH = ref(1000)

const sysRows = ref([{ name: '同型器件', qty: 50, fit: 250 }])

const spN = ref(2)
const spUnitMtbf = ref(100000)
const spT = ref(8760)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 输入持久化（键前缀为工具 id）
watch([convSource, inMtbf, inFit, inAfr, inLam, ea, tUseC, tStressC, burnH, sysRows, spN, spUnitMtbf, spT], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      convSource: convSource.value,
      convVal: convRefs[convSource.value].value,
      ea: ea.value,
      tUseC: tUseC.value,
      tStressC: tStressC.value,
      burnH: burnH.value,
      sysRows: sysRows.value,
      spN: spN.value,
      spUnitMtbf: spUnitMtbf.value,
      spT: spT.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}, { deep: true })

onMounted(() => {
  addRecentTool(TOOL_ID)
  // 恢复上次输入
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      const num = (v, min) => (typeof v === 'number' && isFinite(v) && (min === undefined || v >= min) ? v : null)
      if (CONV_KEYS.includes(s.convSource)) {
        const v = num(s.convVal, 0)
        if (v !== null) {
          convSource.value = s.convSource
          convRefs[s.convSource].value = v
          setFrom(s.convSource)
        }
      }
      const eaV = num(s.ea, 0.001)
      if (eaV !== null) ea.value = eaV
      const tu = num(s.tUseC, -273.14)
      if (tu !== null) tUseC.value = tu
      const ts = num(s.tStressC, -273.14)
      if (ts !== null) tStressC.value = ts
      const bh = num(s.burnH, 0)
      if (bh !== null) burnH.value = bh
      if (Array.isArray(s.sysRows)) {
        const restored = s.sysRows
          .filter((r) => r && typeof r === 'object')
          .map((r) => ({ name: typeof r.name === 'string' ? r.name : '', qty: r.qty, fit: r.fit }))
        if (restored.length) sysRows.value = restored
      }
      const spn = num(s.spN, 1)
      if (spn !== null && spn <= 20) spN.value = Math.round(spn)
      const sum = num(s.spUnitMtbf, 0.001)
      if (sum !== null) spUnitMtbf.value = sum
      const spt = num(s.spT, 0)
      if (spt !== null) spT.value = spt
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})

// ---------- 模块①：基础换算四向联动 ----------
// v-model 先于 @input 处理器更新 ref，setFrom 以当前编辑字段为基准回写其余三项
const setFrom = (kind) => {
  const v = Number(convRefs[kind].value)
  if (!isFinite(v) || v <= 0) return
  convSource.value = kind
  let mtbf
  if (kind === 'mtbf') mtbf = v
  else if (kind === 'fit') mtbf = mtbfFromFit(v)
  else if (kind === 'afr') mtbf = mtbfFromAfrPct(v)
  else mtbf = mtbfFromLambda(v)
  if (kind !== 'mtbf') inMtbf.value = roundSig(mtbf)
  if (kind !== 'fit') inFit.value = roundSig(fitFromMtbf(mtbf))
  if (kind !== 'afr') inAfr.value = roundSig(afrLinPct(mtbf))
  if (kind !== 'lam') inLam.value = roundSig(lambdaFromMtbf(mtbf))
}

const convMtbf = computed(() => {
  const kind = convSource.value
  const v = Number(convRefs[kind].value)
  if (!isFinite(v) || v <= 0) return NaN
  if (kind === 'mtbf') return v
  if (kind === 'fit') return mtbfFromFit(v)
  if (kind === 'afr') return mtbfFromAfrPct(v)
  return mtbfFromLambda(v)
})
const convValid = computed(() => isFinite(convMtbf.value) && convMtbf.value > 0)
const outFit = computed(() => fitFromMtbf(convMtbf.value))
const outAfrLin = computed(() => afrLinPct(convMtbf.value))
const outAfrExp = computed(() => afrExpPct(convMtbf.value))
const outLam = computed(() => lambdaFromMtbf(convMtbf.value))
const afrDiffRel = computed(() => (
  isFinite(outAfrExp.value) && outAfrExp.value > 0
    ? Math.abs(outAfrLin.value - outAfrExp.value) / outAfrExp.value * 100
    : NaN
))

const copyConv = () => {
  const text = `MTBF=${fmtNum(convMtbf.value)} h（≈${fmtNum(convMtbf.value / 8760, 4)} 年通电）｜FIT=${fmtNum(outFit.value)}｜AFR 线性=${fmtNum(outAfrLin.value, 4)}%、指数式=${fmtNum(outAfrExp.value, 4)}%｜λ=${fmtNum(outLam.value)} 次/h｜口径注记：MTBF 是失效率倒数不是日历寿命，DPPM 管出厂质量、FIT 管现场可靠性`
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制换算结论到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动选择文本复制')
    })
  } else {
    alert('当前环境不支持剪贴板，请手动选择文本复制')
  }
}

// ---------- 模块②：系统合成 ----------
const sys = computed(() => systemSynth(sysRows.value))
const rowPct = (idx) => {
  if (!sys.value) return ''
  const it = sys.value.items.find((x) => x.i === idx)
  return it ? fmtNum(it.pct, 3) + '%' : '—'
}
const addSysRow = () => { sysRows.value.push({ name: '', qty: 1, fit: 250 }) }
const removeSysRow = (idx) => { sysRows.value.splice(idx, 1) }
const loadSysDemo = () => {
  sysRows.value = [
    { name: '主控 MCU', qty: 1, fit: 250 },
    { name: '存储颗粒', qty: 4, fit: 200 },
    { name: 'PMIC 电源', qty: 2, fit: 120 },
    { name: '收发器', qty: 10, fit: 150 }
  ]
}

// ---------- 模块③：Arrhenius 加速因子 ----------
const af = computed(() => arrheniusAF(Number(ea.value), cToK(tUseC.value), cToK(tStressC.value)))
const afValid = computed(() => {
  const tu = Number(tUseC.value)
  const ts = Number(tStressC.value)
  return isFinite(Number(ea.value)) && Number(ea.value) > 0 &&
    isFinite(tu) && tu > -273.15 && isFinite(ts) && ts > -273.15 &&
    isFinite(Number(burnH.value)) && Number(burnH.value) >= 0
})
const fieldH = computed(() => af.value * Number(burnH.value))
const fieldYears = computed(() => fieldH.value / HOURS_PER_YEAR)
const anchorAF = computed(() => arrheniusAF(0.7, cToK(55), cToK(125)))

// ---------- 模块④：串/并联 ----------
const spR = computed(() => rFromMtbf(Number(spUnitMtbf.value), Number(spT.value)))
// n 按整数处理（单元数为整数口径）
const spNInt = computed(() => {
  const n = Math.floor(Number(spN.value))
  return isFinite(n) && n >= 1 ? n : NaN
})
const spValid = computed(() => isFinite(spR.value) && spR.value > 0 && spR.value <= 1 &&
  isFinite(spNInt.value) && spNInt.value <= 20)
const spSer = computed(() => seriesRel(spR.value, spNInt.value))
const spPar = computed(() => parallelRel(spR.value, spNInt.value))
const spSerMtbf = computed(() => (isFinite(spNInt.value) ? Number(spUnitMtbf.value) / spNInt.value : NaN))
const spParMtbf = computed(() => (isFinite(spNInt.value) ? Number(spUnitMtbf.value) * parallelMtbfFactor(spNInt.value) : NaN))

// ---------- 相关工具 ----------
const relatedLinks = computed(() => ['dppm-yield-calculator', 'electrolytic-cap-life', 'aql-sampling-calculator']
  .map((id) => tools.find((t) => t.id === id))
  .filter(Boolean))
</script>
