<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Microscope class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">细胞计数与接种密度计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">血球计数板浓度换算、台盼蓝活率、传代取液补液体积与 T25 转 T75 扩瓶口径</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线细胞计数计算工具：血球计数板两种口径（四角 4 大格平均 / 中央大格 5 中格×25 折算）由各格细胞数与稀释倍数算出细胞浓度——
        cells/mL = 平均每大格 × 稀释倍数 × 10⁴（0.1 mm 深标准板口径）；填入死细胞数即按台盼蓝口径给活率与活细胞浓度；
        传代模式按目标接种密度 × 培养体积 × 瓶数反推取母液与补液体积；并附 T25 → T75 等容器面积比扩瓶换算。
        全部计算在你的浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面提示条 -->
    <div class="mb-6 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
      <TriangleAlert class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-sm leading-relaxed text-foreground font-medium">
        口径说明：本页按 0.1 mm 深标准计数板（改良牛鲍氏板）计算，每个 1 mm² 大格容积 0.1 mm³ = 10⁻⁴ mL；
        压线细胞"数上不数下、数左不数右"；细胞浓度与活率受吹打均匀性影响，建议平行计数两板取均值。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 卡一：计数输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Grid3x3 class="w-5 h-5 mr-2 text-primary" /> 计数与活率参数
        </h2>

        <!-- 口径切换 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="m in COUNT_MODES"
            :key="m.id"
            @click="setMode(m.id)"
            class="px-3 py-2.5 rounded-lg border text-sm font-medium transition"
            :class="state.mode === m.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
          >
            {{ m.name }}
          </button>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">{{ modeInfo.hint }}</p>

        <!-- 活细胞各格输入 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">活细胞数（各 {{ modeInfo.unitName }}，留空不参与平均）</p>
          <div class="grid gap-2" :class="modeInfo.slots === 5 ? 'grid-cols-5' : 'grid-cols-4'">
            <div v-for="i in modeInfo.slots" :key="'live-' + i">
              <label :for="'cell-live-' + i" class="block text-xs text-muted-foreground mb-1">格 {{ i }}</label>
              <input
                :id="'cell-live-' + i"
                v-model="state.live[i - 1]"
                type="number"
                min="0"
                class="w-full px-2 py-2 bg-background border border-border rounded-lg text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <!-- 死细胞各格输入 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">
            死细胞数（台盼蓝着色，同口径；不算活率可全部留空）
          </p>
          <div class="grid gap-2" :class="modeInfo.slots === 5 ? 'grid-cols-5' : 'grid-cols-4'">
            <div v-for="i in modeInfo.slots" :key="'dead-' + i">
              <label :for="'cell-dead-' + i" class="block text-xs text-muted-foreground mb-1">死 {{ i }}</label>
              <input
                :id="'cell-dead-' + i"
                v-model="state.dead[i - 1]"
                type="number"
                min="0"
                class="w-full px-2 py-2 bg-background border border-border rounded-lg text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="—"
              />
            </div>
          </div>
        </div>

        <!-- 稀释倍数 -->
        <div>
          <label for="cell-dilution" class="block text-sm font-medium text-foreground mb-1.5">稀释倍数（计数前总体稀释）</label>
          <input
            id="cell-dilution"
            v-model="state.dilution"
            type="number"
            step="1"
            min="1"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="例如 10"
          />
          <p class="text-xs text-muted-foreground mt-1.5">台盼蓝 1:1 混匀 = 2×；1:9 = 10×。填原液不稀释请填 1。</p>
        </div>

        <div class="space-y-2">
          <button
            @click="applyCountDemo"
            class="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 rounded-lg text-sm font-medium text-primary-foreground transition"
          >
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 示例：4 大格 45/44/46/45，稀释 10×，死细胞 5/4/6/5
          </button>
          <button
            @click="clearCountInputs"
            class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 清空计数输入
          </button>
        </div>
      </div>

      <!-- 卡二：浓度与活率结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Microscope class="w-5 h-5 mr-2 text-primary" /> 细胞浓度与活率
        </h2>

        <template v-if="countRes">
          <div class="bg-primary/10 rounded-lg p-6 text-center">
            <p class="text-xs text-muted-foreground mb-2">细胞浓度（{{ countRes.viabilityPctText ? '总细胞' : '计数浓度' }}）</p>
            <p class="text-4xl sm:text-5xl font-extrabold text-primary font-mono break-all">
              {{ countRes.concSci }}<span class="text-base font-bold ml-1.5">cells/mL</span>
            </p>
            <p class="text-xs text-muted-foreground mt-2 font-mono">{{ countRes.concComma }} cells/mL</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">活率（台盼蓝）</p>
              <p class="text-3xl font-bold" :class="countRes.viabilityClass">{{ countRes.viabilityPctText || '—' }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ countRes.deadNote }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">活细胞浓度</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">{{ countRes.liveConcSci || '—' }}</p>
              <p class="text-xs text-muted-foreground mt-1">cells/mL（总浓度 × 活率）</p>
            </div>
          </div>

          <div class="space-y-1.5 text-sm">
            <div class="flex justify-between items-center p-2.5 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">平均每大格（1 mm²）</span>
              <span class="font-mono font-semibold text-foreground">{{ countRes.perLargeText }}</span>
            </div>
            <div class="flex justify-between items-center p-2.5 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">计入格数 / 稀释倍数</span>
              <span class="font-mono font-semibold text-foreground">{{ countRes.slotsUsedText }} 格 × {{ trimNum(dilNum, 2) }}</span>
            </div>
          </div>

          <p class="text-sm font-mono bg-muted/50 rounded-lg p-3 leading-relaxed text-foreground break-all">
            {{ countFormulaLine }}
          </p>
          <p v-if="countRes.viabilityLine" class="text-sm font-mono bg-muted/50 rounded-lg p-3 leading-relaxed text-foreground break-all">
            {{ countRes.viabilityLine }}
          </p>
          <p v-if="lowViability" class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-amber-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>活率低于 70%：状态偏差或消化过度，建议优化传代操作后再接种；冻存前活率低于 80% 一般不建议继续冻存。</span>
          </p>

          <div class="flex flex-wrap gap-2 items-center pt-2 border-t border-border">
            <button
              @click="copyCountResult"
              :disabled="!copyText"
              class="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle v-if="copied" class="w-4 h-4" />
              <Copy v-else class="w-4 h-4" />
              {{ copied ? '已复制结果' : '复制计数结果' }}
            </button>
            <p class="text-xs text-muted-foreground">含口径、各格原始数与算式，可直接贴进实验记录。</p>
          </div>
        </template>

        <div v-else class="p-8 text-center text-muted-foreground">
          <p>{{ countWarn || '填写至少一个格子的细胞数后，这里显示细胞浓度与活率。' }}</p>
        </div>
      </div>

      <!-- 卡三：传代稀释输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Droplets class="w-5 h-5 mr-2 text-primary" /> 传代稀释参数
        </h2>

        <div>
          <label for="cell-conc" class="block text-sm font-medium text-foreground mb-1.5">当前悬液细胞浓度（cells/mL）</label>
          <div class="flex gap-2">
            <input
              id="cell-conc"
              v-model="state.conc"
              type="text"
              inputmode="decimal"
              class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 4.5e6 或 4500000"
            />
            <button
              @click="bringInCount"
              :disabled="!countRes || !countRes.liveConcSci"
              class="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              带入上方活细胞浓度
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">建议填台盼蓝计数的活细胞浓度；支持 4.5e6 科学计数格式。</p>
        </div>

        <div>
          <label for="cell-density" class="block text-sm font-medium text-foreground mb-1.5">目标接种密度（活细胞 / mL）</label>
          <input
            id="cell-density"
            v-model="state.density"
            type="text"
            inputmode="decimal"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="如 2e5 或 200000"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="cell-vessels" class="block text-sm font-medium text-foreground mb-1.5">培养容器数（瓶/孔）</label>
            <input
              id="cell-vessels"
              v-model="state.vessels"
              type="number"
              step="1"
              min="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="例如 5"
            />
          </div>
          <div>
            <label for="cell-vol" class="block text-sm font-medium text-foreground mb-1.5">每容器培养体积（mL）</label>
            <input
              id="cell-vol"
              v-model="state.volPerVessel"
              type="number"
              step="0.5"
              min="0"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="例如 10"
            />
          </div>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          口径：总需活细胞 = 接种密度 × 每容器体积 × 容器数；取母液 = 总需 ÷ 当前浓度，剩余用培养基补足到总体积。
          贴壁细胞吹打要分散均匀，取样前再次混匀。
        </p>
      </div>

      <!-- 卡四：传代结果 + 扩瓶换算 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <FlaskRound class="w-5 h-5 mr-2 text-primary" /> 传代取液方案与扩瓶换算
        </h2>

        <template v-if="passageRes">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">取母液</p>
              <p class="text-3xl font-bold text-primary font-mono">{{ passageRes.takeText }}</p>
              <p class="text-xs text-muted-foreground mt-1">mL 细胞悬液</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">补培养基</p>
              <p class="text-2xl font-bold text-foreground font-mono">{{ passageRes.topupText }}</p>
              <p class="text-xs text-muted-foreground mt-1">mL（补足 {{ passageRes.totalMediumText }} mL）</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">总需活细胞</p>
              <p class="text-2xl font-bold text-foreground font-mono">{{ passageRes.totalCellsSci }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ passageRes.densitySci }}/mL × {{ passageRes.volText }} mL × {{ passageRes.vesselsText }} 瓶</p>
            </div>
          </div>
          <p class="text-sm font-mono bg-muted/50 rounded-lg p-3 leading-relaxed text-foreground break-all">
            {{ passageFormulaLine }}
          </p>
          <p
            v-if="passageRes.takeTooMuch"
            class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-amber-600 flex items-start gap-1.5"
          >
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>取母液体积超过总体积：当前浓度不足，请先离心浓缩（如 800–1000 ×g 5 min）或减少瓶数/接种密度。</span>
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            实操：母液混匀后按量加入各瓶，再分别补培养基至每瓶 {{ passageRes.volText }} mL，十字晃匀后镜检密度确认。
          </p>
        </template>
        <div v-else class="p-6 text-center text-sm text-muted-foreground">
          {{ passageWarn || '填写当前浓度、目标密度与培养体积后，这里显示取液与补液方案。' }}
        </div>

        <!-- 扩瓶换算 -->
        <div class="pt-3 border-t border-border space-y-3">
          <h3 class="text-sm font-semibold text-foreground flex items-center">
            <ArrowUpRight class="w-4 h-4 mr-1.5 text-primary" /> 倍增扩瓶：T25 → T75 等面积比换算
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="cell-from-vessel" class="block text-xs font-medium text-foreground mb-1">现容器</label>
              <select
                id="cell-from-vessel"
                v-model="state.fromVessel"
                class="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option v-for="v in VESSELS" :key="v.id" :value="v.id">{{ v.name }} · {{ v.area }} cm²</option>
              </select>
            </div>
            <div>
              <label for="cell-to-vessel" class="block text-xs font-medium text-foreground mb-1">目标容器</label>
              <select
                id="cell-to-vessel"
                v-model="state.toVessel"
                class="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option v-for="v in VESSELS" :key="v.id" :value="v.id">{{ v.name }} · {{ v.area }} cm²</option>
              </select>
            </div>
          </div>
          <div>
            <label for="cell-from-cells" class="block text-xs font-medium text-foreground mb-1">现容器内细胞数（cells）</label>
            <input
              id="cell-from-cells"
              v-model="state.fromCells"
              type="text"
              inputmode="decimal"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 1.5e6 或 1500000"
            />
          </div>
          <p v-if="scaleRes" class="text-sm text-foreground leading-relaxed">
            面积比 <span class="font-mono font-semibold text-primary">×{{ scaleRes.ratioText }}</span>：
            {{ scaleRes.fromName }}（{{ scaleRes.fromArea }} cm²）→ {{ scaleRes.toName }}（{{ scaleRes.toArea }} cm²），
            按相同接种密度（{{ scaleRes.perCm2 }} cells/cm²）需 <span class="font-mono font-semibold text-primary">{{ scaleRes.targetSci }}</span> cells。
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            面积为常见厂家（Corning / Falcon 等）典型生长面积参考值，同规格不同厂家略有差异，请以所用培养容器说明书为准。
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>细胞计数与接种密度计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          细胞计数与接种密度计算器是面向细胞培养日常操作的在线换算工具，覆盖四步：
          ①血球计数板计数——两种口径（四角 4 大格平均 / 中央大格 5 中格×25 折算）由各格细胞数与稀释倍数算出细胞浓度；
          ②台盼蓝活率——填入死细胞数即得活率与活细胞浓度；③传代稀释——按目标接种密度、瓶数与培养体积反推取母液与补液体积；
          ④倍增扩瓶——T25 转 T75 等按生长面积比换算接种量。计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">血球计数板的结构与 ×10⁴ 从哪来？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          改良牛鲍氏计数板由 H 形凹槽盖玻片构成 0.1 mm 深的计数腔：每个 1 mm × 1 mm 大格的容积 = 1 mm² × 0.1 mm = 0.1 mm³ = 10⁻⁴ mL。
          所以每大格数出的细胞数换算成浓度要乘以 10⁴，再乘稀释倍数：
        </p>
        <p class="text-sm font-mono bg-muted/50 rounded-lg p-3 text-foreground break-all mb-2">
          细胞浓度（cells/mL）= 平均每大格细胞数 × 稀释倍数 × 10⁴
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          例：四角 4 大格分别 45 / 44 / 46 / 45（平均 45），稀释 10×，浓度 = 45 × 10 × 10⁴ = 4.5×10⁶ cells/mL；
          若死细胞平均 5 格（45 ÷ (45+5)），活率 90%，活细胞浓度 = 4.5×10⁶ × 90% = 4.05×10⁶ cells/mL。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">两种计数口径怎么选？</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-4">
          <li><strong>4 大格平均</strong>：数四角 4 个 1 mm² 大格（每个含 16 中格），细胞浓度 = 平均每大格 × 稀释 × 10⁴。细胞悬液常规口径，适合 20–500 个/大格的密度。</li>
          <li><strong>5 中格 ×25 折算</strong>：中央大格划为 25 个中格（每中格 16 小格），常规数四角 + 中心 5 个中格。每大格 = 平均每中格 × 25，浓度 = 平均每中格 × 25 × 稀释 × 10⁴。适合密度高、想数得更快的场景（红细胞法口径，计 80 个小格）。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">稀释倍数怎么定？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          计数前对悬液做的所有稀释连乘。台盼蓝 1:1 等体积混匀 = 2×；10 μL 细胞 + 90 μL 染液 = 10×。
          理想计数密度是每大格 20–100 个细胞：太密互相重叠数不准，先稀释；太疏泊松误差大，加大取样格数或降低稀释。
          本页浓度已含稀释倍数还原，直接就是原悬液浓度。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">传代稀释怎么算取液量？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2 font-mono bg-muted/50 rounded-lg p-3 break-all">
          总需活细胞 = 目标接种密度 × 每瓶体积 × 瓶数；取母液 = 总需 ÷ 当前悬液浓度；补液 = 总体积 − 取母液
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          例：浓度 4.5×10⁶ cells/mL，按 2×10⁵ cells/mL 接种 10 mL × 5 瓶：总需 = 2×10⁵ × 10 × 5 = 1×10⁷ 活细胞，
          取母液 = 1×10⁷ ÷ 4.5×10⁶ ≈ 2.22 mL，补培养基到 50 mL。取液体积太小（&lt;50 μL）时建议先稀释母液提高移液精度。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">T25 转 T75 怎么等密度扩瓶？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          贴壁细胞按"每平方厘米细胞数"维持状态：T25 生长面积约 25 cm²、T75 约 75 cm²，面积比 ≈3，
          所以一瓶长满的 T25（如 1.5×10⁶ cells）正好按相同密度扩 1 瓶 T75（≈4.5×10⁶ cells）。
          同理 6 孔板单孔（≈9.6 cm²）转 T25 约需 ×2.6。面积换算只保证密度一致，实际还要结合倍增时间与实验目的调整。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">压线的细胞算不算？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              统一规则"数上不数下、数左不数右"：只把压在上边线和左边线的细胞计入格内，压下边线与右边线的不计，
              保证相邻格之间不重不漏。团块按 1 个计并在记录中注明成团率。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">要数多少个格子才够准？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              计数误差近似 1/√N：每大格 100 个细胞时约 ±10%，20 个时约 ±22%。常规建议每份悬液数 4 大格、总数 ≥100 个细胞；
              密度低时可数中央大格全部 25 中格或双板平行取均值。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">台盼蓝怎么用？活率怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              0.4% 台盼蓝与悬液等体积（1:1）混匀，2–3 分钟内上板计数：死细胞被染成蓝色，活细胞拒染。
              活率 = 活细胞数 ÷（活 + 死）×100%。染液放置超过 10–15 分钟会让活细胞也开始着色，导致活率偏低。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">自动细胞计数仪的浓度和手数差很多？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              先核对三点：稀释倍数是否一致、死细胞是否计入、计数腔深度是否同样按 0.1 mm。
              仪器把团块拆成多个细胞或把碎片误判为死细胞都会造成偏差；以手工镜检为仲裁，本页可按仪器口径填格均值复算核对。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'cell-count-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Microscope, Grid3x3, Droplets, FlaskRound, ArrowUpRight,
  TriangleAlert, CheckCircle, ChevronUp, ChevronDown, Play, RefreshCw, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '细胞计数与接种密度计算器 - 血球计数板浓度与传代稀释 | 有条工具',
  description: '免费在线细胞计数计算器：血球计数板 4 大格/5 中格两种口径由各格细胞数与稀释倍数算细胞浓度（cells/mL = 平均每大格 × 稀释 × 10⁴），台盼蓝活率与活细胞浓度、传代取母液与补液体积、T25 转 T75 扩瓶面积比换算，纯浏览器本地计算。',
  keywords: '细胞计数计算,血球计数板 稀释倍数,细胞浓度 cells/ml,接种密度计算,cell counting hemocytometer,传代稀释',
  author: '有条工具',
  ogTitle: '细胞计数与接种密度计算器 - 血球计数板与传代稀释 | 有条工具',
  ogDescription: '血球计数板浓度换算、台盼蓝活率、传代取液补液体积与 T25 转 T75 扩瓶口径，一键算清。',
  ogUrl: 'https://www.util.cn/tools/cell-count-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
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
          name: '细胞计数与接种密度计算器',
          url: 'https://www.util.cn/tools/cell-count-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['血球计数板 4 大格 / 5 中格两种口径浓度换算', '多格输入自动取平均', '台盼蓝活率与活细胞浓度', '传代取母液与补液体积反推', 'T25→T75 等容器面积比扩瓶换算', '计数结果一键复制']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '细胞计数与接种密度计算器', item: 'https://www.util.cn/tools/cell-count-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '血球计数板细胞浓度怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '0.1 mm 深标准板每个 1 mm² 大格容积 0.1 mm³ = 10⁻⁴ mL，细胞浓度 = 平均每大格细胞数 × 稀释倍数 × 10⁴。如 4 大格平均 45、稀释 10×，浓度 = 4.5×10⁶ cells/mL。' }
            },
            {
              '@type': 'Question',
              name: '稀释倍数怎么定？',
              acceptedAnswer: { '@type': 'Answer', text: '计数前所有稀释连乘：台盼蓝 1:1 等体积混匀为 2×，10 μL 细胞 + 90 μL 液体为 10×。理想密度为每大格 20–100 个细胞，太密先稀释，太疏加计格数。' }
            },
            {
              '@type': 'Question',
              name: '台盼蓝活率怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '活率 = 活细胞数 ÷（活细胞 + 死细胞）×100%，死细胞被台盼蓝染蓝、活细胞拒染，混匀后 2–3 分钟内计数完毕，久置会使活细胞着色导致活率偏低。' }
            },
            {
              '@type': 'Question',
              name: '传代稀释取多少母液？',
              acceptedAnswer: { '@type': 'Answer', text: '总需活细胞 = 目标接种密度 × 每瓶体积 × 瓶数；取母液 = 总需 ÷ 当前悬液浓度，剩余用培养基补足。如 4.5×10⁶ cells/mL 按 2×10⁵/mL 接 10 mL × 5 瓶，取约 2.22 mL 补至 50 mL。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 宽松数值解析：接受 "4500000" / "4,500,000" / "4.5e6"
function toNum(raw) {
  const s = String(raw == null ? '' : raw).trim().replace(/,/g, '')
  if (!s) return NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

// 小数尾零裁剪：2.20 → 2.2；50.00 → 50
function trimNum(x, digits) {
  let s = x.toFixed(digits)
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '')
  return s
}

// 千分位整数：4500000 → 4,500,000
function fmtComma(x) {
  return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 上标数字（科学计数法展示）
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
function supNum(n) {
  return String(n).split('').map((c) => SUP[c] || c).join('')
}

// 科学计数法文本：4.5e6 → "4.5×10⁶"；1e7 → "1×10⁷"；小于 10⁴ 用千分位
function fmtSci(v) {
  if (!Number.isFinite(v) || v <= 0) return '—'
  const exp = Math.floor(Math.log10(v))
  if (exp >= 4 && exp <= 12) {
    const m = trimNum(v / Math.pow(10, exp), 2)
    return `${m}×10${supNum(exp)}`
  }
  return fmtComma(v)
}

// 多格取平均：只统计有效非负值，无有效值返回 null
function avgOf(arr) {
  const vals = (arr || []).map((x) => toNum(x)).filter((n) => Number.isFinite(n) && n >= 0)
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

// 计数板核心：浓度 = 平均每大格 × 稀释倍数 × 10⁴（0.1 mm 深口径）
// 5 中格口径：平均每大格 = 平均每中格 × 25（中央大格共 25 中格）
function concPerMl(perLarge, dilution) {
  return perLarge * dilution * 1e4
}

// 活率：活 ÷（活 + 死）
function viabilityOf(liveAvg, deadAvg) {
  if (liveAvg == null) return null
  if (deadAvg == null || deadAvg <= 0) return 1
  return liveAvg / (liveAvg + deadAvg)
}

// 传代：总需 = 密度 × 体积 × 瓶数；取母液 = 总需 ÷ 浓度；补液 = 总体积 − 取母液
function passagePlan(conc, density, vessels, volPerVessel) {
  const totalMedium = vessels * volPerVessel
  const totalCells = density * volPerVessel * vessels
  const takeMl = totalCells / conc
  return { totalMedium, totalCells, takeMl, topupMl: totalMedium - takeMl }
}

// 扩瓶：面积比换算，同 cells/cm² 接种密度
function scaleCells(fromCells, fromArea, toArea) {
  return fromCells * (toArea / fromArea)
}

// 手算断言参考（详见页尾自测）：
//   avgOf(['45','44','46','45']) = 45；concPerMl(45, 10) = 4.5×10⁶ cells/mL
//   viabilityOf(45, 5) = 0.9 → 活细胞浓度 4.05×10⁶ cells/mL
//   avgOf(['18','20','19','21','22']) = 20 → 每大格 20×25 = 500
//   passagePlan(4.5e6, 2e5, 5, 10)：totalCells = 1×10⁷，takeMl ≈ 2.22，topupMl ≈ 47.78
//   scaleCells(1.5e6, 25, 75) = 4.5×10⁶（面积比 ×3）

// ---------- 常量 ----------
const COUNT_MODES = [
  {
    id: 'large4',
    name: '4 大格平均',
    slots: 4,
    unitName: '1 mm² 大格',
    liveDefaults: ['45', '44', '46', '45'],
    deadDefaults: ['5', '4', '6', '5'],
    hint: '常规口径：计数板四角 4 个 1 mm² 大格（每格 16 中格），平均后 × 稀释倍数 × 10⁴。适合大多数细胞悬液。'
  },
  {
    id: 'medium5',
    name: '5 中格 ×25 折算',
    slots: 5,
    unitName: '中格（16 小格）',
    liveDefaults: ['18', '20', '19', '21', '22'],
    deadDefaults: ['', '', '', '', ''],
    hint: '精密口径：中央大格划为 25 个中格，常规数四角 + 中心 5 个中格，平均每中格 × 25 折算每大格，再 × 稀释倍数 × 10⁴（红细胞法口径）。'
  }
]

// 常见培养容器典型生长面积（Corning / Falcon 等厂家参考值）
const VESSELS = [
  { id: 'w24', name: '24 孔板 · 单孔', area: 1.9 },
  { id: 'w12', name: '12 孔板 · 单孔', area: 3.8 },
  { id: 'w6', name: '6 孔板 · 单孔', area: 9.6 },
  { id: 'd6', name: '6 cm 培养皿', area: 21 },
  { id: 't25', name: 'T25 培养瓶', area: 25 },
  { id: 'd10', name: '10 cm 培养皿', area: 55 },
  { id: 't75', name: 'T75 培养瓶', area: 75 },
  { id: 'd15', name: '15 cm 培养皿', area: 150 },
  { id: 't175', name: 'T175 培养瓶', area: 175 }
]

// ---------- 状态与交互 ----------
const state = reactive({
  mode: 'large4',
  live: ['45', '44', '46', '45'],
  dead: ['5', '4', '6', '5'],
  dilution: '10',
  conc: '4500000',
  density: '200000',
  vessels: '5',
  volPerVessel: '10',
  fromVessel: 't25',
  toVessel: 't75',
  fromCells: '1500000'
})

const seoContentVisible = ref(true)
const copied = ref(false)
const copyText = ref('')

const modeInfo = computed(() => COUNT_MODES.find((m) => m.id === state.mode) || COUNT_MODES[0])

const dilNum = computed(() => toNum(state.dilution))

const liveAvg = computed(() => avgOf(state.live))
const deadAvg = computed(() => avgOf(state.dead))

const perLarge = computed(() => {
  if (liveAvg.value == null) return null
  return state.mode === 'medium5' ? liveAvg.value * 25 : liveAvg.value
})

const totalConc = computed(() => {
  if (perLarge.value == null || !(dilNum.value > 0)) return null
  return concPerMl(perLarge.value, dilNum.value)
})

const viability = computed(() => viabilityOf(liveAvg.value, deadAvg.value))

const liveConc = computed(() => {
  if (totalConc.value == null || viability.value == null) return null
  return totalConc.value * viability.value
})

const countWarn = computed(() => {
  if (liveAvg.value == null) return '请至少填写一个格子的活细胞数。'
  if (!(dilNum.value > 0)) return '稀释倍数需大于 0（原液不稀释填 1）。'
  return ''
})

const hasCount = computed(() => !countWarn.value)

const lowViability = computed(() => viability.value != null && viability.value < 0.7)

const countRes = computed(() => {
  if (!hasCount.value || totalConc.value == null) return null
  const deadFilled = deadAvg.value != null && deadAvg.value > 0
  const pct = viability.value != null ? viability.value * 100 : null
  let viabilityLine = ''
  if (pct != null && deadFilled) {
    const liveText = fmtSci(liveAvg.value) === '—' ? String(liveAvg.value) : fmtSci(liveAvg.value)
    viabilityLine = `活率 = ${trimNum(liveAvg.value, 1)} ÷（${trimNum(liveAvg.value, 1)} + ${trimNum(deadAvg.value, 1)}）= ${trimNum(pct, 1)}%；` +
      `活细胞浓度 = ${fmtSci(totalConc.value)} × ${trimNum(pct, 1)}% = ${fmtSci(liveConc.value)} cells/mL（liveAvg：${liveText} 格均值）`
  }
  return {
    concSci: fmtSci(totalConc.value),
    concComma: fmtComma(totalConc.value),
    liveConcSci: liveConc.value != null ? fmtSci(liveConc.value) : '',
    viabilityPctText: pct != null && deadFilled ? `${trimNum(pct, 1)}%` : '',
    viabilityClass: pct != null && pct >= 90 ? 'text-green-600 dark:text-green-400' : 'text-amber-600',
    deadNote: deadFilled ? `死细胞均值 ${trimNum(deadAvg.value, 1)}/格` : '未填死细胞，按 100% 计',
    perLargeText: perLarge.value != null ? trimNum(perLarge.value, 1) : '—',
    slotsUsedText: `${state.live.filter((x) => String(x).trim() !== '' && Number.isFinite(toNum(x))).length}`
  }
})

const countFormulaLine = computed(() => {
  if (countRes.value == null) return ''
  if (state.mode === 'medium5') {
    return `浓度 = 平均每中格 ${trimNum(liveAvg.value, 1)} × 25 = 每大格 ${trimNum(perLarge.value, 1)}；` +
      `浓度 = ${trimNum(perLarge.value, 1)} × 稀释 ${trimNum(dilNum.value, 2)} × 10⁴ = ${countRes.value.concSci} cells/mL`
  }
  return `浓度 = 平均每大格 ${trimNum(liveAvg.value, 1)} × 稀释 ${trimNum(dilNum.value, 2)} × 10⁴ = ${countRes.value.concComma} cells/mL（${countRes.value.concSci}）`
})

async function copyCountResult() {
  if (countRes.value == null) return
  const lines = [
    `【细胞计数】口径：${modeInfo.value.name}（0.1 mm 深标准板）`,
    `活细胞各格：${state.live.join('/')}，死细胞各格：${state.dead.map((x) => (String(x).trim() === '' ? '—' : x)).join('/')}`,
    `稀释倍数：${trimNum(dilNum.value, 2)}`,
    `细胞浓度：${countRes.value.concSci} cells/mL（${countRes.value.concComma}）`,
    countRes.value.viabilityPctText ? `活率：${countRes.value.viabilityPctText}，活细胞浓度：${countRes.value.liveConcSci} cells/mL` : '活率：未计死细胞'
  ]
  const text = lines.join('\n')
  copyText.value = text
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (e) {
    // 剪贴板不可用（非安全上下文等）时静默降级
  }
}

// ---------- 传代稀释 ----------
const concNum = computed(() => toNum(state.conc))
const densityNum = computed(() => toNum(state.density))
const vesselsNum = computed(() => toNum(state.vessels))
const volNum = computed(() => toNum(state.volPerVessel))

const passageWarn = computed(() => {
  if (!(concNum.value > 0)) return '请填写大于 0 的当前悬液细胞浓度（cells/mL）。'
  if (!(densityNum.value > 0)) return '请填写大于 0 的目标接种密度（cells/mL）。'
  if (!(vesselsNum.value >= 1)) return '培养容器数至少为 1。'
  if (!(volNum.value > 0)) return '请填写大于 0 的每容器培养体积（mL）。'
  return ''
})

const passageRes = computed(() => {
  if (passageWarn.value) return null
  const p = passagePlan(concNum.value, densityNum.value, vesselsNum.value, volNum.value)
  return {
    takeText: trimNum(p.takeMl, 2),
    topupText: trimNum(Math.max(0, p.topupMl), 2),
    totalMediumText: trimNum(p.totalMedium, 2),
    totalCellsSci: fmtSci(p.totalCells),
    densitySci: fmtSci(densityNum.value),
    volText: trimNum(volNum.value, 2),
    vesselsText: trimNum(vesselsNum.value, 0),
    takeTooMuch: p.takeMl > p.totalMedium
  }
})

const passageFormulaLine = computed(() => {
  if (passageRes.value == null) return ''
  const p = passagePlan(concNum.value, densityNum.value, vesselsNum.value, volNum.value)
  return `总需 = ${fmtSci(densityNum.value)} × ${trimNum(volNum.value, 2)} × ${trimNum(vesselsNum.value, 0)} = ${fmtSci(p.totalCells)}；` +
    `取母液 = ${fmtSci(p.totalCells)} ÷ ${fmtSci(concNum.value)} ≈ ${trimNum(p.takeMl, 2)} mL；` +
    `补液 = ${trimNum(p.totalMedium, 2)} − ${trimNum(p.takeMl, 2)} = ${trimNum(p.topupMl, 2)} mL`
})

function bringInCount() {
  addRecentTool('cell-count-calculator')
  if (liveConc.value != null && liveConc.value > 0) {
    state.conc = String(Math.round(liveConc.value))
  }
}

// ---------- 扩瓶换算 ----------
const fromVessel = computed(() => VESSELS.find((v) => v.id === state.fromVessel) || VESSELS[0])
const toVessel = computed(() => VESSELS.find((v) => v.id === state.toVessel) || VESSELS[0])
const fromCellsNum = computed(() => toNum(state.fromCells))

const scaleRes = computed(() => {
  if (!(fromCellsNum.value > 0)) return null
  const ratio = toVessel.value.area / fromVessel.value.area
  const target = scaleCells(fromCellsNum.value, fromVessel.value.area, toVessel.value.area)
  return {
    ratioText: trimNum(ratio, 2),
    fromName: fromVessel.value.name,
    toName: toVessel.value.name,
    fromArea: fromVessel.value.area,
    toArea: toVessel.value.area,
    perCm2: trimNum(fromCellsNum.value / fromVessel.value.area, 0),
    targetSci: fmtSci(target)
  }
})

// ---------- 交互 ----------
function setMode(id) {
  if (state.mode === id) return
  state.mode = id
  const m = COUNT_MODES.find((x) => x.id === id)
  state.live = m.liveDefaults.slice()
  state.dead = m.deadDefaults.slice()
  addRecentTool('cell-count-calculator')
}

function applyCountDemo() {
  addRecentTool('cell-count-calculator')
  state.mode = 'large4'
  state.live = ['45', '44', '46', '45']
  state.dead = ['5', '4', '6', '5']
  state.dilution = '10'
}

function clearCountInputs() {
  addRecentTool('cell-count-calculator')
  const n = modeInfo.value.slots
  state.live = new Array(n).fill('')
  state.dead = new Array(n).fill('')
  state.dilution = '1'
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('cell-count-calculator')
})
</script>
