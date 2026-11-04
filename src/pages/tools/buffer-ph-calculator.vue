<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FlaskConical class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">缓冲液 pH 配制计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">Henderson-Hasselbalch 反推酸碱组分体积与毫摩尔数，Tris 温度修正，经典配方速查</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线缓冲液配制计算工具：选定缓冲体系（内置 Tris-HCl、PBS 磷酸盐、醋酸钠、碳酸盐、硼酸五组 pKa），
        输入目标 pH、总浓度、总体积与母液浓度，按 Henderson-Hasselbalch 公式（pH = pKa + lg([共轭碱]/[共轭酸])）
        反推共轭碱与共轭酸的取液体积与毫摩尔数；Tris 支持按 ΔpKa/℃ ≈ −0.028 做工作温度修正，目标 pH 超出 pKa±1 时提示换体系，
        并附 1 M Tris-HCl pH 8.0、PBS pH 7.4 等经典工作液配方速查。全部计算在你的浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面提示条 -->
    <div class="mb-6 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
      <TriangleAlert class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-sm leading-relaxed text-foreground font-medium">
        本页按理想稀溶液的 Henderson-Hasselbalch 公式计算理论配比：实际 pH 受离子强度（活度效应）与温度影响，
        尤其高浓度磷酸盐体系理论值与经验配方表会有可见偏差——定容后请用 pH 计实测微调；Tris 温度敏感，室温配制、4℃ 或 37℃ 使用请开启温度修正。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 配制参数
        </h2>

        <!-- 缓冲体系 -->
        <div>
          <label for="buf-system" class="block text-sm font-medium text-foreground mb-1.5">缓冲体系</label>
          <select
            id="buf-system"
            v-model="state.system"
            class="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="s in BUFFER_SYSTEMS" :key="s.id" :value="s.id">{{ s.label }}</option>
          </select>
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            有效缓冲范围 pH {{ rangeLowText }}–{{ rangeHighText }}（pKa±1）· 酸组分 {{ sys.acidName }} / 碱组分 {{ sys.baseName }} · {{ sys.note }}
          </p>
        </div>

        <!-- 目标 pH -->
        <div>
          <label for="buf-ph" class="block text-sm font-medium text-foreground mb-1.5">目标 pH（0–14）</label>
          <input
            id="buf-ph"
            v-model="state.ph"
            type="number"
            step="0.1"
            min="0"
            max="14"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="例如 8.0"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- 总浓度 -->
          <div>
            <label for="buf-total-c" class="block text-sm font-medium text-foreground mb-1.5">总浓度（mol/L）</label>
            <input
              id="buf-total-c"
              v-model="state.totalC"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="例如 0.1"
            />
          </div>
          <!-- 总体积 -->
          <div>
            <label for="buf-vol" class="block text-sm font-medium text-foreground mb-1.5">总体积（mL）</label>
            <input
              id="buf-vol"
              v-model="state.volume"
              type="number"
              step="10"
              min="0"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="例如 100"
            />
          </div>
        </div>

        <!-- 母液浓度 -->
        <div>
          <label for="buf-stock-c" class="block text-sm font-medium text-foreground mb-1.5">母液浓度（mol/L，酸/碱母液等浓度）</label>
          <input
            id="buf-stock-c"
            v-model="state.stockC"
            type="number"
            step="0.01"
            min="0"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="留空或填 0 = 与总浓度相同"
          />
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            等浓度母液简化：母液浓度 = 总浓度时，两母液按比例直接混合定容即可；母液更浓时按毫摩尔数折算取液体积再补水。
          </p>
        </div>

        <!-- 温度修正 -->
        <div class="p-3 bg-muted/50 border border-border rounded-lg space-y-2.5">
          <div class="flex items-center gap-2">
            <input
              id="buf-temp-corr"
              v-model="state.tempCorr"
              type="checkbox"
              class="w-4 h-4 rounded border border-border"
            />
            <label for="buf-temp-corr" class="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Thermometer class="w-4 h-4 text-primary" /> 按工作温度修正 pKa
            </label>
          </div>
          <div v-if="state.tempCorr">
            <label for="buf-temp" class="block text-sm font-medium text-foreground mb-1.5">工作温度（℃）</label>
            <input
              id="buf-temp"
              v-model="state.temp"
              type="number"
              step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="例如 37"
            />
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            {{ tempNote }}
          </p>
        </div>

        <!-- 校验提示 -->
        <p
          v-if="inputWarn"
          class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5"
        >
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ inputWarn }}</span>
        </p>
        <p v-else-if="rangeWarn" class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-amber-600 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ rangeWarn }}</span>
        </p>
        <p v-else class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-700 flex items-start gap-1.5">
          <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>参数正常：目标 pH 在 pKa±1 有效缓冲范围内，体系可提供足够缓冲能力。</span>
        </p>

        <div class="space-y-2">
          <button
            @click="applyTrisDemo"
            class="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 rounded-lg text-sm font-medium text-primary-foreground transition"
          >
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 示例：0.1 M Tris-HCl pH 8.0 / 100 mL
          </button>
          <button
            @click="applyPbsDemo"
            class="w-full px-4 py-2.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-sm font-medium text-primary transition"
          >
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 示例：0.1 M 磷酸盐 pH 7.4 / 100 mL
          </button>
          <button
            @click="resetInputs"
            class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 清空重填
          </button>
        </div>
      </div>

      <!-- 右：结果与速查 -->
      <div class="space-y-6">
        <!-- 结果卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <FlaskConical class="w-5 h-5 mr-2 text-primary" /> 配制结果
            </h2>
            <span class="text-xs text-muted-foreground font-mono px-2 py-1 rounded bg-muted/60">
              {{ sys.short }} · pKa {{ pKaText }}{{ pKaBasisText }}
            </span>
          </div>

          <template v-if="res">
            <div class="bg-primary/10 rounded-lg p-6 text-center">
              <p class="text-xs text-muted-foreground mb-2">碱组分（{{ sys.baseName }}）取液体积</p>
              <p class="text-5xl font-extrabold text-primary font-mono">
                {{ res.vBaseText }}<span class="text-xl font-bold ml-1.5">mL</span>
              </p>
              <p class="text-xs text-muted-foreground mt-2">占总体积 {{ res.pctBaseText }}% · 酸组分（{{ sys.acidName }}）{{ res.vAcidText }} mL</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">碱组分 {{ sys.baseName }}</p>
                <p class="text-xl font-bold text-foreground font-mono">{{ res.vBaseText }} mL</p>
                <p class="text-xs text-muted-foreground mt-1">{{ res.nBaseText }} mmol</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">酸组分 {{ sys.acidName }}</p>
                <p class="text-xl font-bold text-foreground font-mono">{{ res.vAcidText }} mL</p>
                <p class="text-xs text-muted-foreground mt-1">{{ res.nAcidText }} mmol</p>
              </div>
            </div>

            <p class="text-sm font-mono bg-muted/50 rounded-lg p-3 leading-relaxed text-foreground break-all">
              {{ formulaLine }}
            </p>

            <!-- 母液更浓时的取液折算 -->
            <div v-if="!res.stockEqual" class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-1.5">
              <p class="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Beaker class="w-4 h-4 text-primary" /> 母液 {{ trimNum(stockUsed, 2) }} mol/L（浓于总浓度）取液折算
              </p>
              <div class="text-sm text-muted-foreground space-y-1 font-mono">
                <p>取碱母液 {{ res.stockVBaseText }} mL + 取酸母液 {{ res.stockVAcidText }} mL</p>
                <p>补水 {{ res.waterText }} mL 定容至 {{ res.vText }} mL（毫摩尔数与等浓度混法一致）</p>
              </div>
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed">
              操作建议：两母液按上述体积混匀后补水定容至总体积，再用 pH 计实测微调（偏酸补碱组分、偏碱补酸组分）。
              {{ rangeWarn ? '当前 pH 远离 pKa，配比的微小误差会被放大，实测微调尤为重要。' : '' }}
            </p>
          </template>

          <div v-else class="p-8 text-center text-muted-foreground">
            填写目标 pH、总浓度与总体积后，这里显示酸碱组分取液体积与毫摩尔数。
          </div>
        </div>

        <!-- 经典配方速查卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Table2 class="w-5 h-5 mr-2 text-primary" /> 常见工作液经典配方速查
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">工作液</th>
                  <th class="py-2 pr-3 font-medium">配方（定容量）</th>
                  <th class="py-2 font-medium">用途 / 备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in RECIPES" :key="row.id" class="border-b border-border/60 last:border-0 align-top">
                  <td class="py-2.5 pr-3 text-foreground font-medium whitespace-nowrap">{{ row.name }}</td>
                  <td class="py-2.5 pr-3 text-muted-foreground leading-relaxed">{{ row.formula }}</td>
                  <td class="py-2.5 text-xs text-muted-foreground leading-relaxed">{{ row.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>
              配方表为文献经典经验配方（已包含活度效应，以 pH 计实测为准）；本页计算器按理想稀溶液公式给出理论配比，
              两者在离子强度较高时（尤其 0.1 M 磷酸盐）会有可见偏差，属正常现象。
            </span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>缓冲液 pH 配制计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          缓冲液 pH 配制计算器是面向细胞培养、分子克隆、蛋白纯化与电泳等实验的在线配液工具。它解决一件事：
          手上只有酸组分与碱组分两份母液（如 Tris 碱与 Tris-HCl、NaH₂PO₄ 与 Na₂HPO₄），要配出目标 pH 的一定体积缓冲液，
          两种母液各取多少。工具按 Henderson-Hasselbalch 公式由目标 pH 与 pKa 反推共轭碱/共轭酸的摩尔比，
          再折算成取液体积与毫摩尔数，并给出 pKa±1 有效范围提示、Tris 工作温度修正与经典配方速查。计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Henderson-Hasselbalch 公式怎么用？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          pH = pKa + lg([共轭碱]/[共轭酸])。两边取指数得共轭碱摩尔分数：
          r = 10^(pH−pKa)，碱占比 = r ÷ (1+r)，酸占比 = 1 ÷ (1+r)。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          等浓度母液简化：当酸/碱母液浓度相同（且等于目标总浓度）时，摩尔比就是体积比——
          V(碱) = V总 × 10^(pH−pKa) ÷ (1 + 10^(pH−pKa))，V(酸) = V总 − V(碱)。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          例：0.1 M Tris-HCl pH 8.0 @25℃，r = 10^(8−8.06) = 0.871，碱占比 = 0.871 ÷ 1.871 ≈ 46.6%，
          配 100 mL 取 Tris 碱 46.6 mL + Tris-HCl 53.4 mL，对应 4.66 mmol 碱组分与 5.34 mmol 酸组分。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么算出的配比和经典配方表对不上？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          H-H 公式用的是浓度，而 pH 计测的是活度。离子强度越高，活度系数偏离 1 越多，"表观 pKa" 会明显移动：
          以 0.1 M 磷酸盐 pH 7.4 为例，按 pKa₂ = 7.21 的理想计算得碱组分约 61%，而 Promega 等经验配方表给约 81 : 19
          （0.2 M Na₂HPO₄ 40.5 mL + 0.2 M NaH₂PO₄ 9.5 mL 定容 100 mL），差异来自活度校正与 Na⁺/K⁺ 组成。
          低离子强度（≤0.01 M）时两者接近；高浓度体系请以经验表或 pH 计实测微调为准，本页理论值适合作为起点与量级核对。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Tris 的温度效应：为什么 25℃ 配好、37℃ 就不是这个 pH？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          Tris 的 ΔpKa/℃ ≈ −0.028（Sigma-Aldrich 生物缓冲剂表实测值），温度每升 1℃，pKa 降约 0.028。
          25℃ 调至 pH 8.0 的 Tris，37℃ 使用时 pKa ≈ 8.06 + (37−25)×(−0.028) = 7.72，实测 pH 会掉到约 7.7——
          所以细胞培养相关实验常在使用温度下调 pH，或干脆改用 HEPES（ΔpKa/℃ ≈ −0.014，更不敏感）。
          本页开启温度修正后按工作温度反算配比；其余体系内置数据不足，仍按 25℃ 口径标注。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">五大体系与有效缓冲范围</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-4">
          <li><strong>Tris-HCl（pKa 8.06 @25℃）</strong>：有效 pH 7.0–9.0，电泳液、蛋白实验主力；温度敏感，见上。</li>
          <li><strong>磷酸盐 PBS（pKa₂ 7.21 @25℃）</strong>：有效 pH 6.2–8.2，细胞培养、免疫染色常用；避免与 Ca²⁺/Mg²⁺ 共存（生成沉淀），且会抑制部分酶活。</li>
          <li><strong>醋酸-醋酸钠（pKa 4.76 @25℃）</strong>：有效 pH 3.8–5.8，核酸沉淀（3 M NaOAc pH 5.2）、酸性蛋白实验。</li>
          <li><strong>碳酸-碳酸盐（pKa₂ 10.33 @25℃）</strong>：有效 pH 9.3–11.3，ELISA 包被液（pH 9.6）经典体系；敞口放置会吸收 CO₂ 漂移。</li>
          <li><strong>硼酸-硼酸盐（pKa 9.24 @25℃）</strong>：有效 pH 8.2–10.2，DNA 电泳 TBE、糖类衍生化；与多元醇、部分生物分子络合，细胞实验慎用。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">目标 pH 离 pKa 太远会怎样？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          缓冲能力来自酸/碱共轭对的"库存"：pH = pKa 时两者各半、缓冲容量最大；偏离 1 个 pH 单位时 minority 组分只剩约 9%，
          加入少量酸碱 pH 就会大幅漂移。本页在 |pH − pKa| &gt; 1 时提示"缓冲能力弱，建议换体系"——
          例如要配 pH 6.5 就别用 Tris（pKa 8.06），换 MES 或磷酸盐；配 pH 8.8 的 TBE 用硼酸+Tris 才对路。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">缓冲液 pH 怎么配制？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              三步：①选体系（目标 pH 落在 pKa±1 内）；②把目标 pH、总浓度、总体积填进本页，得到酸/碱组分取液体积与毫摩尔数；
              ③按比例混匀母液、补水定容，最后用 pH 计实测微调。偏酸补碱组分、偏碱补酸组分，每次少量。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">母液浓度和总浓度不一样怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              把实际母液浓度填进"母液浓度"栏：工具仍按目标总浓度算出各组分毫摩尔数，再除以母液浓度折算取液体积，
              差额用补水补齐。例如要 0.1 M / 100 mL 而手上是 1 M 母液，则各取约十分之一体积再补水定容，配比不变。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">Tris-HCl 1 M pH 8.0 怎么配？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              经典配方（Sambrook《分子克隆》）：Tris 碱 121.1 g 溶于约 800 mL 水，用浓盐酸约 42 mL 调至 pH 8.0，
              定容至 1 L。pH 7.6 与 7.4 分别约需 60 mL 与 70 mL 浓盐酸。注意 Tris 的 pH 随温度明显变化，调 pH 时应在目标使用温度附近校准。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">PBS pH 7.4 怎么配？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              常用 0.01 M PBS（含 137 mM NaCl）：每升定容取 NaCl 8.0 g、KCl 0.2 g、Na₂HPO₄ 1.44 g、KH₂PO₄ 0.24 g。
              若只需 0.1 M 磷酸盐组分，按经验表 0.2 M Na₂HPO₄ 40.5 mL + 0.2 M NaH₂PO₄ 9.5 mL 定容至 100 mL（pH 7.4 @25℃）。
              含钙镁的培养基用 PBS 需注意磷酸盐与二价阳离子沉淀问题。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'buffer-ph-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  FlaskConical, Calculator, Thermometer, TriangleAlert, CheckCircle,
  ChevronUp, ChevronDown, Info, Play, RefreshCw, Table2, Beaker
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '缓冲液 pH 配制计算器 - Tris/PBS/醋酸钠配比在线计算 | 有条工具',
  description: '免费在线缓冲液配制计算器：Henderson-Hasselbalch 公式由目标 pH 与 pKa 反推酸碱组分取液体积与毫摩尔数，内置 Tris-HCl、PBS 磷酸盐、醋酸钠、碳酸盐、硼酸五大体系与 Tris 温度修正，附 1M Tris-HCl pH8.0、PBS pH7.4 经典配方速查，纯浏览器本地计算。',
  keywords: '缓冲液配制计算,Tris-HCl 配方,PBS pH 7.4 配制,Henderson-Hasselbalch,buffer preparation calculator,缓冲液配比',
  author: '有条工具',
  ogTitle: '缓冲液 pH 配制计算器 - Tris/PBS 配比在线计算 | 有条工具',
  ogDescription: 'Henderson-Hasselbalch 反推酸碱取液体积与毫摩尔数，五大体系 pKa 内置，Tris 温度修正与经典配方速查。',
  ogUrl: 'https://www.util.cn/tools/buffer-ph-calculator',
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
          name: '缓冲液 pH 配制计算器',
          url: 'https://www.util.cn/tools/buffer-ph-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['Henderson-Hasselbalch 反推酸碱组分体积与毫摩尔数', '五大常用缓冲体系内置 pKa', 'Tris ΔpKa/℃ 工作温度修正', 'pKa±1 有效缓冲范围提示', '母液浓度不同时的取液与补水折算', '经典工作液配方速查表']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '缓冲液 pH 配制计算器', item: 'https://www.util.cn/tools/buffer-ph-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '缓冲液 pH 怎么配制？',
              acceptedAnswer: { '@type': 'Answer', text: '选体系（目标 pH 落在 pKa±1 内），按 Henderson-Hasselbalch 公式 pH = pKa + lg([共轭碱]/[共轭酸]) 反推酸碱摩尔比折算取液体积，混匀定容后用 pH 计实测微调。' }
            },
            {
              '@type': 'Question',
              name: '为什么算出的配比和文献配方表不一样？',
              acceptedAnswer: { '@type': 'Answer', text: 'H-H 公式用浓度而 pH 计测活度，离子强度越高表观 pKa 移动越大。如 0.1 M 磷酸盐 pH 7.4 理想计算碱组分约 61%，经验表约 81:19，属活度效应，高浓度体系以经验表或 pH 计实测为准。' }
            },
            {
              '@type': 'Question',
              name: 'Tris 在 37℃ 使用要注意什么？',
              acceptedAnswer: { '@type': 'Answer', text: 'Tris 的 ΔpKa/℃ ≈ −0.028：25℃ 配的 pH 8.0，37℃ 时 pKa 降至约 7.72，实际 pH 明显下降。应在使用温度下调 pH 或开启本页温度修正，敏感实验可改用 HEPES。' }
            },
            {
              '@type': 'Question',
              name: '目标 pH 离 pKa 太远会怎样？',
              acceptedAnswer: { '@type': 'Answer', text: '偏离 pKa 超过 1 个 pH 单位时共轭对 minority 组分不足约 9%，缓冲能力弱，少量酸碱即引起 pH 大幅漂移，建议更换缓冲体系。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 宽松数值解析
function toNum(raw) {
  const s = String(raw == null ? '' : raw).trim().replace(/,/g, '')
  if (!s) return NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

// 小数尾零裁剪：46.60 → 46.6；8.00 → 8
function trimNum(x, digits) {
  let s = x.toFixed(digits)
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '')
  return s
}

// 千分位
function withCommas(x) {
  const s = String(x)
  const parts = s.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

// Henderson-Hasselbalch 反推：r = 10^(pH−pKa)，碱摩尔分数 = r/(1+r)
function baseFractionOf(ph, pKa) {
  const r = Math.pow(10, ph - pKa)
  return { r, frac: r / (1 + r) }
}

// 等浓度母液简化取液体积（mL）
function mixVolumes(totalC, volumeMl, stockC, ph, pKa) {
  const { r, frac } = baseFractionOf(ph, pKa)
  const nTotal = totalC * volumeMl          // mmol（C: mol/L，V: mL）
  const nBase = nTotal * frac
  const nAcid = nTotal - nBase
  const vBase = volumeMl * frac             // 等浓度母液简化：体积比 = 摩尔比
  const vAcid = volumeMl - vBase
  const stockEqual = !Number.isFinite(stockC) || stockC <= 0 || Math.abs(stockC - totalC) < 1e-9
  const stockVBase = stockEqual ? vBase : nBase / stockC   // mmol ÷ (mmol/mL)
  const stockVAcid = stockEqual ? vAcid : nAcid / stockC
  const water = Math.max(0, volumeMl - stockVBase - stockVAcid)
  return { r, frac, nTotal, nBase, nAcid, vBase, vAcid, stockEqual, stockVBase, stockVAcid, water }
}

// Tris 温度修正：pKa(T) = pKa25 + (T − 25) × ΔpKa/℃
function correctedPka(pKa25, dPkadt, tempC) {
  return pKa25 + (tempC - 25) * dPkadt
}

// 手算断言参考（详见页尾自测）：
//   correctedPka(8.06, -0.028, 37) = 8.06 + 12×(−0.028) = 7.724 → 7.72
//   mixVolumes(0.1, 100, 0.1, 8, 8.06): r = 0.8710，frac = 0.46553
//     vBase = 46.55 mL（46.6±0.3 内）、vAcid = 53.45 mL、nBase = 4.66 mmol、nAcid = 5.34 mmol
//   mixVolumes(0.1, 100, 1.0, 8, 8.06): stockVBase = 4.66 mL，water = 90.69 mL

// 常用缓冲体系（pKa 与 ΔpKa/dT 取自 Sigma-Aldrich 生物缓冲剂参考表，25℃ 口径）
const BUFFER_SYSTEMS = [
  {
    id: 'tris',
    label: 'Tris-HCl（三羟甲基氨基甲烷，pKa 8.06）',
    short: 'Tris-HCl',
    pKa: 8.06,
    dPkadt: -0.028,
    acidName: 'TrisH⁺',
    baseName: 'Tris 碱',
    note: '温度敏感（ΔpKa/℃ ≈ −0.028），建议开启修正'
  },
  {
    id: 'phosphate',
    label: '磷酸盐 PBS（pKa₂ 7.21）',
    short: 'PBS 磷酸盐',
    pKa: 7.21,
    dPkadt: null,
    acidName: 'H₂PO₄⁻',
    baseName: 'HPO₄²⁻',
    note: '避免与 Ca²⁺/Mg²⁺ 长期共存；高浓度时以经验表为准'
  },
  {
    id: 'acetate',
    label: '醋酸-醋酸钠（pKa 4.76）',
    short: '醋酸钠',
    pKa: 4.76,
    dPkadt: null,
    acidName: 'HAc',
    baseName: 'Ac⁻',
    note: '核酸沉淀（3 M NaOAc pH 5.2）与酸性体系常用'
  },
  {
    id: 'carbonate',
    label: '碳酸-碳酸盐（pKa₂ 10.33）',
    short: '碳酸盐',
    pKa: 10.33,
    dPkadt: null,
    acidName: 'HCO₃⁻',
    baseName: 'CO₃²⁻',
    note: 'ELISA 包被液（pH 9.6）体系；敞口易吸收 CO₂ 漂移'
  },
  {
    id: 'borate',
    label: '硼酸-硼酸盐（pKa 9.24）',
    short: '硼酸盐',
    pKa: 9.24,
    dPkadt: null,
    acidName: 'H₃BO₃',
    baseName: 'B(OH)₄⁻',
    note: 'TBE 电泳液体系；与多元醇络合，细胞实验慎用'
  }
]

// 经典工作液配方速查（文献经验配方，已含活度效应）
const RECIPES = [
  {
    id: 'tris-1m-ph80',
    name: '1 M Tris-HCl，pH 8.0',
    formula: 'Tris 碱 121.1 g 溶于约 800 mL 水，浓 HCl ≈42 mL 调 pH，定容 1 L',
    note: 'Sambrook《分子克隆》经典配方；pH 7.6 / 7.4 分别约 60 / 70 mL 浓 HCl'
  },
  {
    id: 'pbs-001-ph74',
    name: '0.01 M PBS，pH 7.4（含 137 mM NaCl）',
    formula: 'NaCl 8.0 g + KCl 0.2 g + Na₂HPO₄ 1.44 g + KH₂PO₄ 0.24 g，定容 1 L',
    note: '细胞培养、免疫实验最常用工作液，无需高压灭菌可 0.22 μm 过滤'
  },
  {
    id: 'pb-01-ph74',
    name: '0.1 M 磷酸盐缓冲液，pH 7.4',
    formula: '0.2 M Na₂HPO₄ 40.5 mL + 0.2 M NaH₂PO₄ 9.5 mL，加水定容至 100 mL',
    note: 'Promega 配方表经验值（含活度校正），与本页理想计算值有意料内偏差'
  },
  {
    id: 'carbonate-005-ph96',
    name: '0.05 M 碳酸盐缓冲液，pH 9.6',
    formula: 'Na₂CO₃ 1.59 g + NaHCO₃ 2.93 g，定容 1 L',
    note: 'ELISA 包被液经典配方；密封保存，敞口吸收 CO₂ 后 pH 下移'
  },
  {
    id: 'naac-3m-ph52',
    name: '3 M 醋酸钠，pH 5.2',
    formula: 'NaOAc·3H₂O 40.81 g 溶于约 80 mL 水，冰醋酸调 pH 5.2，定容 100 mL',
    note: '核酸沉淀常规试剂（1/10 体积加样）'
  }
]

// ---------- 状态与交互 ----------
const state = reactive({
  system: 'tris',
  ph: '8.0',
  totalC: '0.1',
  volume: '100',
  stockC: '0.1',
  tempCorr: false,
  temp: '25'
})

const seoContentVisible = ref(true)

const sys = computed(() => BUFFER_SYSTEMS.find((s) => s.id === state.system) || BUFFER_SYSTEMS[0])

const phNum = computed(() => toNum(state.ph))
const totalCNum = computed(() => toNum(state.totalC))
const volumeNum = computed(() => toNum(state.volume))
const stockCNum = computed(() => toNum(state.stockC))
const tempNum = computed(() => toNum(state.temp))

// 有效 pKa：温度修正仅对有 ΔpKa/dT 数据的体系（Tris）生效
const pKaEff = computed(() => {
  const s = sys.value
  if (state.tempCorr && s.dPkadt != null && Number.isFinite(tempNum.value)) {
    return { value: correctedPka(s.pKa, s.dPkadt, tempNum.value), basis: 'corrected' }
  }
  return { value: s.pKa, basis: '25C' }
})

const pKaText = computed(() => trimNum(pKaEff.value.value, 2))
const pKaBasisText = computed(() => {
  if (pKaEff.value.basis === 'corrected') {
    return `（${trimNum(tempNum.value, 0)}℃ 修正，ΔpKa/℃ ${sys.value.dPkadt}）`
  }
  return '（25℃ 口径）'
})

const tempNote = computed(() => {
  if (sys.value.dPkadt == null) {
    return `${sys.value.short}暂无可靠温度系数数据，仍按 25℃ pKa 口径计算，请在使用温度下用 pH 计校准。`
  }
  if (!Number.isFinite(tempNum.value)) return '请填写工作温度（如 4、25、37），修正公式：pKa(T) = pKa25 + (T−25)×ΔpKa/℃。'
  return `修正公式：pKa(T) = ${sys.value.pKa} + (${trimNum(tempNum.value, 0)}−25)×(${sys.value.dPkadt}) = ${trimNum(pKaEff.value.value, 2)}。25℃ 调好的 Tris 放到 37℃ 用，pH 会明显下降。`
})

const rangeLowText = computed(() => trimNum(sys.value.pKa - 1, 2))
const rangeHighText = computed(() => trimNum(sys.value.pKa + 1, 2))

const inputWarn = computed(() => {
  if (!Number.isFinite(phNum.value) || phNum.value < 0 || phNum.value > 14) return '请填写 0–14 之间的目标 pH。'
  if (!(totalCNum.value > 0)) return '请填写大于 0 的缓冲液总浓度（mol/L），常见 0.01–0.5。'
  if (!(volumeNum.value > 0)) return '请填写大于 0 的总体积（mL）。'
  if (state.stockC !== '' && Number.isFinite(stockCNum.value) && stockCNum.value <= 0) return '母液浓度需大于 0（留空则按与总浓度相同处理）。'
  if (state.tempCorr && sys.value.dPkadt != null && !Number.isFinite(tempNum.value)) return '已开启温度修正，请填写工作温度。'
  return ''
})

const rangeWarn = computed(() => {
  if (inputWarn.value || !hasResult.value) return ''
  if (Math.abs(phNum.value - pKaEff.value.value) > 1) {
    return `目标 pH 距 pKa 超过 1 个单位（有效缓冲范围 ${rangeLowText.value}–${rangeHighText.value}），缓冲能力弱，建议换体系。`
  }
  return ''
})

const hasResult = computed(() =>
  Number.isFinite(phNum.value) && phNum.value >= 0 && phNum.value <= 14 &&
  totalCNum.value > 0 && volumeNum.value > 0 &&
  (!Number.isFinite(stockCNum.value) || stockCNum.value > 0)
)

const res = computed(() => {
  if (!hasResult.value) return null
  const m = mixVolumes(totalCNum.value, volumeNum.value, stockCNum.value, phNum.value, pKaEff.value.value)
  return {
    vBaseText: trimNum(m.vBase, 1),
    vAcidText: trimNum(m.vAcid, 1),
    pctBaseText: trimNum(m.frac * 100, 1),
    nBaseText: trimNum(m.nBase, 2),
    nAcidText: trimNum(m.nAcid, 2),
    vText: trimNum(volumeNum.value, 2),
    stockEqual: m.stockEqual,
    stockVBaseText: trimNum(m.stockVBase, 2),
    stockVAcidText: trimNum(m.stockVAcid, 2),
    waterText: trimNum(m.water, 2)
  }
})

const formulaLine = computed(() => {
  if (!hasResult.value) return '填写参数后，这里显示 Henderson-Hasselbalch 公式的数字代入过程。'
  const m = mixVolumes(totalCNum.value, volumeNum.value, stockCNum.value, phNum.value, pKaEff.value.value)
  const rText = trimNum(m.r, 3)
  return `pH = pKa + lg([A⁻]/[HA]) → 10^(${trimNum(phNum.value, 2)}−${trimNum(pKaEff.value.value, 2)}) = ${rText}；` +
    `V(碱) = ${trimNum(volumeNum.value, 2)} × ${rText} ÷ (1 + ${rText}) = ${trimNum(m.vBase, 1)} mL，` +
    `V(酸) = ${trimNum(volumeNum.value, 2)} − ${trimNum(m.vBase, 1)} = ${trimNum(m.vAcid, 1)} mL`
})

// 母液浓度显示口径（供结果卡说明）
const stockUsed = computed(() => (Number.isFinite(stockCNum.value) && stockCNum.value > 0 ? stockCNum.value : totalCNum.value))

function applyTrisDemo() {
  addRecentTool('buffer-ph-calculator')
  state.system = 'tris'
  state.ph = '8.0'
  state.totalC = '0.1'
  state.volume = '100'
  state.stockC = '0.1'
  state.tempCorr = false
  state.temp = '25'
}

function applyPbsDemo() {
  addRecentTool('buffer-ph-calculator')
  state.system = 'phosphate'
  state.ph = '7.4'
  state.totalC = '0.1'
  state.volume = '100'
  state.stockC = '0.1'
  state.tempCorr = false
  state.temp = '25'
}

function resetInputs() {
  addRecentTool('buffer-ph-calculator')
  state.system = 'tris'
  state.ph = ''
  state.totalC = ''
  state.volume = ''
  state.stockC = ''
  state.tempCorr = false
  state.temp = '25'
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('buffer-ph-calculator')
})
</script>
