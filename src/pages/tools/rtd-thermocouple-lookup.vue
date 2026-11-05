<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ThermometerSnowflake class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">PT100热电偶换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">PT100/PT1000 分度正反算与 K 型热电偶 mV 换算，含冷端补偿</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        两个模块一站式算清工业测温换算：① PT100/PT1000 按 IEC 60751 Callendar-Van Dusen 方程正反算（正温区解二次方程、负温区牛顿迭代，收敛阈 1e-9，超 −200~850℃ 自动警示）；② K 型热电偶按 NIST ITS-90 标准系数正反算（正函数十阶多项式 + 高斯指数项、逆函数分段多项式），mV 反查温度内置冷端补偿栏（实测 mV + 冷端 mV 后反查，默认 25℃ 可改 0）。附 PT100/PT1000 每 50℃ 分度表与 K 型每 100℃ mV 对照表，全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 双向换算
        </h2>

        <!-- 子工具切换 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="activeTab = 'pt'"
            :class="activeTab === 'pt' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2.5 rounded-lg text-sm font-medium transition-all"
          >PT100 / PT1000 铂电阻</button>
          <button
            @click="activeTab = 'tc'"
            :class="activeTab === 'tc' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2.5 rounded-lg text-sm font-medium transition-all"
          >K 型热电偶（ITS-90）</button>
        </div>

        <!-- PT100/PT1000 -->
        <div v-if="activeTab === 'pt'" class="space-y-4">
          <div class="p-4 bg-muted/50 rounded-lg space-y-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">传感器类型 R0</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="r0Type = 'pt100'"
                  :class="r0Type === 'pt100' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-xs font-medium transition-all"
                >PT100（R0 = 100 Ω）</button>
                <button
                  @click="r0Type = 'pt1000'"
                  :class="r0Type === 'pt1000' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-xs font-medium transition-all"
                >PT1000（R0 = 1000 Ω）</button>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              按 IEC 60751 Callendar-Van Dusen 方程计算，系数 A = 3.9083×10⁻³、B = −5.775×10⁻⁷、C = −4.183×10⁻¹²（C 项仅在 t &lt; 0 时使用）。有效范围 −200~850℃，超范围会警示。
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 温度 -> 阻值 -->
            <div class="border border-border rounded-lg p-4 space-y-3">
              <h3 class="text-sm font-medium text-foreground">温度 → 阻值</h3>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="ptT"
                  type="number"
                  step="1"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="温度 ℃"
                />
                <span class="text-sm text-muted-foreground">℃</span>
              </div>
              <div v-if="ptForward !== null" class="bg-primary/10 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground mb-1">R = R0 × (1 + At + Bt² + C(t−100)t³)</p>
                <p class="text-xl font-bold text-primary">{{ fmt(ptForward.r, 2) }} Ω</p>
              </div>
              <p v-else class="text-xs text-muted-foreground">请输入温度数值。</p>
              <p v-if="ptForward !== null && ptForward.warn" class="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                {{ ptForward.warn }}
              </p>
            </div>
            <!-- 阻值 -> 温度 -->
            <div class="border border-border rounded-lg p-4 space-y-3">
              <h3 class="text-sm font-medium text-foreground">阻值 → 温度</h3>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="ptR"
                  type="number"
                  step="0.1"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="阻值 Ω"
                />
                <span class="text-sm text-muted-foreground">Ω</span>
              </div>
              <div v-if="ptInverse !== null" class="bg-primary/10 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground mb-1">t≥0 解二次方程取正根；t&lt;0 牛顿迭代（收敛阈 1e-9）</p>
                <p class="text-xl font-bold text-primary">{{ fmt(ptInverse.t, 3) }} ℃</p>
              </div>
              <p v-else class="text-xs text-muted-foreground">请输入大于 0 的阻值。</p>
              <p v-if="ptInverse !== null && ptInverse.warn" class="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                {{ ptInverse.warn }}
              </p>
            </div>
          </div>
        </div>

        <!-- K 型热电偶 -->
        <div v-else class="space-y-4">
          <!-- 模式切换 -->
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="tcMode = 't2mv'"
              :class="tcMode === 't2mv' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >温度 → mV</button>
            <button
              @click="tcMode = 'mv2t'"
              :class="tcMode === 'mv2t' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >mV → 温度（含冷端补偿）</button>
          </div>

          <!-- 温度 -> mV -->
          <div v-if="tcMode === 't2mv'" class="space-y-4">
            <div class="border border-border rounded-lg p-4 space-y-3">
              <h3 class="text-sm font-medium text-foreground">热端温度 → 热电势</h3>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="tcT"
                  type="number"
                  step="1"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="热端温度 ℃"
                />
                <span class="text-sm text-muted-foreground">℃</span>
              </div>
              <div v-if="tcForward !== null" class="bg-primary/10 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground mb-1">NIST ITS-90 正函数：E = Σcᵢtⁱ + a0·exp(a1(t−a2)²)（t ≥ 0 段）</p>
                <p class="text-xl font-bold text-primary">{{ fmt(tcForward.mv, 4) }} mV</p>
                <p class="text-xs text-muted-foreground mt-1">{{ fmt(tcForward.mv * 1000, 1) }} µV</p>
              </div>
              <p v-else class="text-xs text-muted-foreground">请输入温度数值。</p>
              <p v-if="tcForward !== null && tcForward.warn" class="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                {{ tcForward.warn }}
              </p>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              负温区（−200~0℃）使用 ITS-90 十阶多项式，正温区（0~1372℃）使用九阶多项式 + 高斯指数修正项，分段点 0℃ 处两段函数连续。
            </p>
          </div>

          <!-- mV -> 温度（含冷端补偿） -->
          <div v-else class="space-y-4">
            <div class="border border-border rounded-lg p-4 space-y-4">
              <h3 class="text-sm font-medium text-foreground">实测 mV + 冷端补偿 → 热端温度</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-2">实测热电势 E_meas（mV）</label>
                  <div class="flex items-center gap-2">
                    <input
                      v-model.number="tcMv"
                      type="number"
                      step="0.01"
                      class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="万用表 / 模块读数 mV"
                    />
                    <span class="text-sm text-muted-foreground">mV</span>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-2">冷端（参考端）温度（℃）</label>
                  <div class="flex items-center gap-2">
                    <input
                      v-model.number="coldT"
                      type="number"
                      step="1"
                      class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="冷端温度 ℃"
                    />
                    <button
                      @click="coldT = 25"
                      class="px-2.5 py-2 rounded bg-background border border-border hover:bg-muted text-xs text-muted-foreground transition"
                    >25</button>
                    <button
                      @click="coldT = 0"
                      class="px-2.5 py-2 rounded bg-background border border-border hover:bg-muted text-xs text-muted-foreground transition"
                    >0</button>
                  </div>
                  <p class="text-xs text-muted-foreground mt-1.5">默认 25℃（室温），冰点法时改 0。</p>
                </div>
              </div>

              <div v-if="tcInverse !== null" class="space-y-2">
                <div class="grid grid-cols-3 gap-2">
                  <div class="bg-muted/50 rounded-lg p-2.5 text-center">
                    <p class="text-[10px] text-muted-foreground mb-1">冷端电势 E(冷端)</p>
                    <p class="text-sm font-bold text-foreground">{{ fmt(tcInverse.eColdMv, 4) }} mV</p>
                  </div>
                  <div class="bg-muted/50 rounded-lg p-2.5 text-center">
                    <p class="text-[10px] text-muted-foreground mb-1">总电势 E_total</p>
                    <p class="text-sm font-bold text-foreground">{{ fmt(tcInverse.eTotalMv, 4) }} mV</p>
                  </div>
                  <div class="bg-primary/10 rounded-lg p-2.5 text-center">
                    <p class="text-[10px] text-muted-foreground mb-1">热端温度</p>
                    <p class="text-sm font-bold text-primary">{{ fmt(tcInverse.t, 2) }} ℃</p>
                  </div>
                </div>
                <p class="text-[10px] text-muted-foreground leading-relaxed">
                  冷端补偿链条：E_total = E_meas + E(冷端温度)，再按 ITS-90 逆函数分段反查热端温度（逆函数输入单位 mV，分段点 −5.891 / 0 / 20.644 / 54.806 mV）。
                </p>
              </div>
              <p v-else class="text-xs text-muted-foreground">请输入实测 mV 数值。</p>
              <p v-if="tcInverse !== null && tcInverse.warn" class="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                {{ tcInverse.warn }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 使用建议 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 使用建议
          </h2>
          <ul class="text-xs text-muted-foreground leading-relaxed space-y-2 list-disc pl-4">
            <li>先确认探头是 PT100 还是 PT1000（万用表测 0℃ 附近约 100Ω / 1KΩ 可判），选错 R0 结果差 10 倍。</li>
            <li>K 型接采集模块时若模块已做冷端补偿（如 MAX6675/MAX31855），实测 mV 反查请把冷端温度改 0，避免二次补偿。</li>
            <li>热电偶 mV 读数很小（40 µV/℃ 量级），导线接触电势、焊点差异都能引入数℃误差，测量时保持接线一致。</li>
            <li>PT100 激励电流建议 ≤1mA 防自热；两线制接线要把导线电阻从读数中扣除，或直接上三/四线制。</li>
          </ul>
        </div>

        <!-- 快速自核示例 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <FlaskConical class="w-4 h-4 mr-2 text-primary" /> 快速自核示例
          </h2>
          <div class="space-y-2">
            <button
              @click="loadExample('pt100')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              PT100：100℃ → <span class="text-foreground font-medium">138.51 Ω</span>（−200℃ → ≈18.52 Ω）
            </button>
            <button
              @click="loadExample('pt100rev')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              反算：138.51 Ω → <span class="text-foreground font-medium">≈100.00 ℃</span>；100 Ω → 0 ℃
            </button>
            <button
              @click="loadExample('k1000')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              K 型：1000℃ → <span class="text-foreground font-medium">≈41.276 mV</span>（100℃ → ≈4.096 mV）
            </button>
            <button
              @click="loadExample('kcold')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              冷端补偿：实测 40.394 mV、冷端 25℃ → <span class="text-foreground font-medium">≈1003 ℃</span>（热端）
            </button>
          </div>
        </div>

        <!-- 免责声明 -->
        <div class="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            本工具按 IEC 60751（PT100/PT1000）与 NIST ITS-90（K 型）标准系数纯数学换算，未计入探头公差等级（如 A 级 ±0.15℃+0.002×|t|）、导线电阻、绝缘泄漏与接触电势。计量与工艺控制场合请以校准证书为准。
          </p>
        </div>
      </div>
    </div>

    <!-- 换算表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Table class="w-5 h-5 mr-2 text-primary" /> 分度 / mV 对照表
        </h2>
        <div class="flex gap-2">
          <button
            @click="copyPtTable"
            class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition flex items-center gap-1.5"
          >
            <Copy class="w-3.5 h-3.5" /> 复制 {{ r0Type.toUpperCase() }} 表
          </button>
          <button
            @click="copyKTable"
            class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition flex items-center gap-1.5"
          >
            <Copy class="w-3.5 h-3.5" /> 复制 K 型表
          </button>
        </div>
      </div>
      <p class="text-xs text-muted-foreground mb-4">两张表均由上方同一组换算函数生成：PT100/PT1000 每 50℃ 一行（−200~850℃，共 22 行）；K 型每 100℃ 一行（−200~1300℃，共 16 行）。</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- PT 表 -->
        <div>
          <h3 class="text-sm font-medium text-foreground mb-2">{{ r0Type === 'pt100' ? 'PT100' : 'PT1000' }} 铂电阻分度表（Ω）</h3>
          <div class="overflow-x-auto max-h-96 overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-card">
                <tr class="text-muted-foreground text-xs border-b border-border">
                  <th class="text-left py-2 pr-4 font-medium">温度（℃）</th>
                  <th class="text-right py-2 font-medium">阻值（Ω）</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in ptTableRows" :key="row.t" class="border-b border-border/50">
                  <td class="py-2 pr-4 text-foreground">{{ row.t }}</td>
                  <td class="py-2 text-right text-foreground">{{ fmt(row.r, 2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <!-- K 型表 -->
        <div>
          <h3 class="text-sm font-medium text-foreground mb-2">K 型热电偶 mV 对照表</h3>
          <div class="overflow-x-auto max-h-96 overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-card">
                <tr class="text-muted-foreground text-xs border-b border-border">
                  <th class="text-left py-2 pr-4 font-medium">温度（℃）</th>
                  <th class="text-right py-2 px-3 font-medium">热电势（mV）</th>
                  <th class="text-right py-2 font-medium">（µV）</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in kTableRows" :key="row.t" class="border-b border-border/50">
                  <td class="py-2 pr-4 text-foreground">{{ row.t }}</td>
                  <td class="py-2 px-3 text-right text-foreground">{{ fmt(row.mv, 3) }}</td>
                  <td class="py-2 text-right text-muted-foreground">{{ fmt(row.mv * 1000, 0) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground mt-2 leading-relaxed">冷端 0℃ 口径的绝对热电势；−200~0℃ 段为负值递增到 0。</p>
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
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-8">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>PT100 / 热电偶测温原理与选型</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <h3 class="text-lg font-semibold text-foreground">PT100 与 PT1000 的区别：引线电阻影响</h3>
          <p>
            PT100 与 PT1000 用同一种铂丝与同一组 CVD 系数，只是 0℃ 标称阻值差 10 倍。真正差别在引线：两线制接法下导线电阻直接串进读数，1Ω 的导线电阻对 PT100 意味着约 +2.5℃ 的虚高（1Ω ÷ 0.385Ω/℃ ≈ 2.6℃），对 PT1000 同样 1Ω 只差约 0.26℃——阻值大 10 倍，引线误差就小 10 倍。所以长导线、两线制、低成本场合优先 PT1000；配三/四线制变送器的工业场合 PT100 更常见、探头选型也更丰富。
          </p>
          <h3 class="text-lg font-semibold text-foreground">两线制 / 三线制 / 四线制怎么选</h3>
          <p>
            两线制把激励、测量和引线全走一根回路，导线电阻 100% 计入误差，只适合短距离、粗导线或不重要的温度显示；三线制假设两根引线阻值相等，在其中一根上做减法抵消，是工业 PLC/变送器最常见配置，残余误差来自两线不平衡（一般 &lt;0.1℃）；四线制用两根独立电位测量线，测量回路几乎不取电流，引线电阻被完全消除，精度最高，适合实验室计量与高精度校验，代价是多两根线。经验：显示用途两线够用，控制回路三线起步，标定对比四线制。
          </p>
          <h3 class="text-lg font-semibold text-foreground">Callendar-Van Dusen 方程的来历</h3>
          <p>
            CVD 方程由 Hugh K. Callendar（卡诺循环 Callendar 的后人圈里著名的物理学家）与 V. H. Dusente 于 19 世纪末~20 世纪初拟合铂电阻的微小非线性而来：铂的阻温曲线整体接近直线（每℃ 约 +0.385%），但在宽温区有轻微抛物线弯曲，于是用 R = R0(1 + At + Bt²) 描述正温区，再补一个 C(t−100)t³ 项描述 0℃ 以下曲率上翘。IEC 60751 把 A = 3.9083×10⁻³、B = −5.775×10⁻⁷、C = −4.183×10⁻¹² 写成了国际标准，全球所有符合 IEC 的 PT100/PT1000 探头都可以用同一组系数换算，这正是「分度表」能标准化的原因。
          </p>
          <h3 class="text-lg font-semibold text-foreground">冷端补偿为什么必须</h3>
          <p>
            热电偶测的是「热端与冷端两个接点的温差电势」，不是热端温度本身——万用表读到的 mV 只反映热端−冷端之差。要得到热端温度，必须知道冷端温度并把 E(冷端) 加回总电势再反查（E_total = E_meas + E_cold），这就是冷端补偿。冰点法把冷端放进 0℃ 冰水混合物，是「物理补偿」；现代模块（MAX6675/MAX31855、采集卡端子排）用内置温度传感器测接线端子温度做「电子补偿」。若冷端在 25℃ 却按 0℃ 口径查表，读数会偏低约 25℃（K 型约 1.0 mV），误差几乎等于冷端温度本身——这是热电偶测温最常见的系统性错误。
          </p>
          <h3 class="text-lg font-semibold text-foreground">K 型为什么最常用</h3>
          <p>
            K 型（镍铬-镍硅/镍铝）是覆盖范围、线性度、成本、耐用性平衡最好的通用热电偶：−200~1300℃ 的量程覆盖绝大多数工业场景，塞贝克系数约 41 µV/℃ 在常用热电偶里较大（读数好分辨），两根镍基合金丝均匀性和稳定性好、不易像铂铑类那么脆，价格只有 S 型的几十分之一。加上它是最早被做成廉价数字模块（MAX6675/MAX31855）的型号，K 型探头+模块成了创客与工业通用的默认选择。注意它不适合还原性气氛长期裸露使用，408~850℃ 区间存在可逆的短程有序化漂移（约 ±1℃ 量级）。
          </p>
          <h3 class="text-lg font-semibold text-foreground">热电偶 vs RTD（铂电阻）选型</h3>
          <p>
            要精度、稳定性、小量程选 RTD：PT100 在 −30~200℃ 可以做到 ±0.1~0.3℃，几乎不漂移，但量程上限约 850℃、需要恒流激励和三/四线制、响应慢一点。要量程、耐震动、快响应选热电偶：K 型能到 1300℃、探头是细丝响应快、无需激励，但精度一般 ±1~2.5℃、必须冷端补偿、长线容易引入噪声。一句话：测准用 PT100，测得「更热更快更抗造」用热电偶；中间再按成本与现有采集模块接口定。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">138.51Ω 是多少度？</span>PT100 在 138.51Ω 对应约 100℃（IEC 60751 系数下 100℃ 的精确阻值为 138.5055Ω，138.51Ω 反算约 100.01℃）。这也是快速判断 PT100 探头是否正常的最常用检查点：室温下应约 108~110Ω，100℃ 沸水约 138.5Ω。</li>
            <li><span class="text-foreground font-medium">K 型热电偶 mV 对照怎么看？</span>先确认表的冷端口径（本表为 0℃ 冷端），在表中找到实测 mV 所在行线性内插即可；若冷端不是 0℃，先算出冷端温度对应的 mV 并与实测相加，再用总和查表或用本工具 mV → 温度模式直接反查。</li>
            <li><span class="text-foreground font-medium">冷端补偿漏了会怎样？</span>读数会偏低约等于冷端温度的数值：25℃ 环境下漏补偿，K 型读数低约 24~25℃（约 1.0 mV）；用带内置补偿的模块时又手动补偿一次，则会双重补偿使读数偏高同样量级。补偿方向搞反或漏做，误差远大于热电偶本身的精度等级。</li>
            <li><span class="text-foreground font-medium">PT100 和 PT1000 怎么选？</span>看导线与采集端：长导线、两线制、低功耗电池场合选 PT1000（引线电阻影响小 10 倍）；接工业三/四线制变送器、备件通用性优先选 PT100。两者精度等级与温区完全一致。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'rtd-thermocouple-lookup'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ThermometerSnowflake, Calculator, Info, FlaskConical, AlertTriangle, Table, Copy, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'PT100热电偶换算器 - PT100/PT1000分度表与K型热电偶mV对照 | Util工具箱',
  description: '在线PT100热电偶换算器：PT100/PT1000 按 IEC 60751 Callendar-Van Dusen 方程温度阻值正反算，K 型热电偶按 NIST ITS-90 系数 mV 与温度双向换算并支持冷端补偿，附分度表与 mV 对照表，纯本地计算',
  keywords: 'pt100分度表, pt100阻值对照, pt1000计算, k型热电偶mv对照, 热电偶计算, 冷端补偿, callendar van dusen, its90, rtd温度换算, 138.51欧姆',
  author: 'Util工具箱',
  ogTitle: 'PT100热电偶换算器 - 分度正反算与K型mV换算',
  ogDescription: 'PT100/PT1000 CVD 正反算 + K 型热电偶 ITS-90 mV 换算，含冷端补偿与分度表',
  ogUrl: 'https://www.util.cn/tools/rtd-thermocouple-lookup',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'PT100热电偶换算器',
          url: 'https://www.util.cn/tools/rtd-thermocouple-lookup',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['PT100/PT1000 CVD 正反算', '负温区牛顿迭代反演', 'K 型热电偶 ITS-90 正反算', '冷端补偿换算', '分度表/mV 对照表生成', '超量程警示']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: 'PT100热电偶换算器', item: 'https://www.util.cn/tools/rtd-thermocouple-lookup' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '138.51Ω 是多少度？',
              acceptedAnswer: { '@type': 'Answer', text: 'PT100 在 138.51Ω 对应约 100℃（IEC 60751 系数下 100℃ 精确阻值为 138.5055Ω，138.51Ω 反算约 100.01℃）。室温下 PT100 应约 108~110Ω，100℃ 沸水约 138.5Ω。' }
            },
            {
              '@type': 'Question',
              name: 'K 型热电偶 mV 对照怎么看？',
              acceptedAnswer: { '@type': 'Answer', text: '先确认对照表的冷端口径（本表为 0℃ 冷端），用实测 mV 查表内插即可；冷端不为 0℃ 时，先算出冷端温度对应的 mV 与实测相加，再用总和反查热端温度。' }
            },
            {
              '@type': 'Question',
              name: '冷端补偿漏了会怎样？',
              acceptedAnswer: { '@type': 'Answer', text: '读数会偏低约等于冷端温度本身：25℃ 环境下 K 型读数低约 24~25℃（约 1.0 mV）；若模块已内置补偿再手动补偿一次，则会双重补偿使读数偏高同样量级。' }
            },
            {
              '@type': 'Question',
              name: 'PT100 和 PT1000 怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '两者精度与温区一致，差别在引线电阻敏感度：长导线、两线制、电池供电场合选 PT1000（引线影响小 10 倍）；接工业三/四线制变送器、备件通用性优先选 PT100。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'rtd-thermocouple-lookup'
const STORE_KEY = TOOL_ID + ':inputs'
const tool = tools.find(t => t.id === TOOL_ID)

// ==== PURE-FNS-START（纯计算函数，供单测逐行校验）====
// ---------- PT100/PT1000：IEC 60751 Callendar-Van Dusen ----------
const CVD_A = 3.9083e-3
const CVD_B = -5.775e-7
const CVD_C = -4.183e-12

// 正向 t(℃) → R(Ω)：t≥0 用 R0(1+At+Bt²)，t<0 追加 C(t−100)t³
const cvdForward = (t, r0) => {
  if (!isFinite(t) || !(r0 > 0)) return NaN
  const base = 1 + CVD_A * t + CVD_B * t * t
  const cTerm = t < 0 ? CVD_C * (t - 100) * t * t * t : 0
  return r0 * (base + cTerm)
}

// 反向 R(Ω) → t(℃)：t≥0 解二次方程取正根；t<0 牛顿迭代（初值取正根近似夹回负温区），失败退二分
const cvdInverse = (r, r0) => {
  if (!isFinite(r) || !(r > 0) || !(r0 > 0)) return NaN
  const ratio = r / r0
  const disc = CVD_A * CVD_A - 4 * CVD_B * (1 - ratio)
  if (disc < 0) return NaN
  const tQuad = (-CVD_A + Math.sqrt(disc)) / (2 * CVD_B)
  if (ratio >= 1) return tQuad
  // 负温区：f(t) = R0(1+At+Bt²+C(t−100)t³) − r，在 [−200, 0] 单调递增
  const f = (t) => r0 * (1 + CVD_A * t + CVD_B * t * t + CVD_C * (t - 100) * t * t * t) - r
  const df = (t) => r0 * (CVD_A + 2 * CVD_B * t + CVD_C * (4 * t * t * t - 300 * t * t))
  let t = Math.min(0, tQuad)
  let ok = false
  for (let i = 0; i < 200; i++) {
    const d = df(t)
    if (!isFinite(d) || d === 0) break
    const nt = Math.max(-200, Math.min(0, t - f(t) / d))
    if (Math.abs(nt - t) < 1e-9) { t = nt; ok = true; break }
    t = nt
  }
  if (!ok) {
    // 二分兜底
    let lo = -200
    let hi = 0
    if (f(lo) > 0 || f(hi) < 0) return NaN
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2
      if (f(mid) < 0) lo = mid; else hi = mid
      if (hi - lo < 1e-9) break
    }
    t = (lo + hi) / 2
  }
  return t
}

// ---------- K 型热电偶：NIST ITS-90 标准系数（E 单位 mV） ----------
// 负温区 −200~0℃：E = Σ cᵢtⁱ（c0..c10）
const K_C_NEG = [0, 0.0394501280250, 2.36223735980e-5, -3.28589067840e-7, -4.99048287770e-9, -6.75090591730e-11, -5.74103274280e-13, -3.10888728940e-15, -1.04516093650e-17, -1.98892668780e-20, -1.63226974860e-23]
// 正温区 0~1372℃：E = Σ cᵢtⁱ（c0..c9）+ a0·exp(a1(t−a2)²)
const K_C_POS = [-0.0176004136860, 0.0389212049750, 1.85587700320e-5, -9.94575928740e-8, 3.18409457190e-10, -5.60728448890e-13, 5.60750590590e-16, -3.20207200030e-19, 9.71511471520e-23, -1.21047212750e-26]
const K_EXP_A0 = 0.1185976
const K_EXP_A1 = -1.183432e-4
const K_EXP_A2 = 126.9686
// 逆函数 t = Σ dᵢEⁱ（E 单位 mV），分段：E<0 / 0~20.644 / 20.644~54.806
const K_D_NEG = [0, 25.173462, -1.1662878, -1.0833638, -0.8977354, -0.37342377, -0.086632643, -0.010450598, -0.00051920577, 0]
const K_D_MID = [0, 25.08355, 0.07860106, -0.2503131, 0.0831527, -0.01228034, 0.0009804036, -4.413030e-5, 1.057734e-6, -1.052755e-8]
const K_D_HI = [-131.8058, 48.30222, -1.646031, 0.05464731, -9.650715e-4, 8.802193e-6, -3.110810e-8, 0, 0, 0]

const polyval = (c, x) => {
  let s = 0
  for (let i = c.length - 1; i >= 0; i--) s = s * x + c[i]
  return s
}

// 正向 t(℃) → E(mV)
const typeKForwardMv = (t) => {
  if (!isFinite(t)) return NaN
  if (t < 0) return polyval(K_C_NEG, t)
  return polyval(K_C_POS, t) + K_EXP_A0 * Math.exp(K_EXP_A1 * (t - K_EXP_A2) ** 2)
}

// 逆向 E(mV) → t(℃)
const typeKInverseMv = (mv) => {
  if (!isFinite(mv)) return NaN
  const c = mv < 0 ? K_D_NEG : (mv < 20.644 ? K_D_MID : K_D_HI)
  return polyval(c, mv)
}

// ---------- 换算表生成（页面表格与单测共用同一函数） ----------
const buildPtTable = (r0) => {
  const rows = []
  for (let t = -200; t <= 850; t += 50) rows.push({ t, r: cvdForward(t, r0) })
  return rows
}
const buildKTable = () => {
  const rows = []
  for (let t = -200; t <= 1300; t += 100) rows.push({ t, mv: typeKForwardMv(t) })
  return rows
}
// ==== PURE-FNS-END ====

// ---------- 状态 ----------
const activeTab = ref('pt') // pt / tc
const r0Type = ref('pt100') // pt100 / pt1000
const ptT = ref(100)
const ptR = ref(138.51)
const tcMode = ref('t2mv') // t2mv / mv2t
const tcT = ref(1000)
const tcMv = ref(40.394)
const coldT = ref(25)

const r0 = computed(() => (r0Type.value === 'pt100' ? 100 : 1000))

// 交互记录与输入持久化（SSR 安全：localStorage 仅在客户端执行）
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_KEY) : null
    if (raw) {
      const s = JSON.parse(raw)
      const nums = { ptT, ptR, tcT, tcMv, coldT }
      for (const k of Object.keys(nums)) if (typeof s[k] === 'number') nums[k].value = s[k]
      if (typeof s.activeTab === 'string' && ['pt', 'tc'].includes(s.activeTab)) activeTab.value = s.activeTab
      if (typeof s.r0Type === 'string' && ['pt100', 'pt1000'].includes(s.r0Type)) r0Type.value = s.r0Type
      if (typeof s.tcMode === 'string' && ['t2mv', 'mv2t'].includes(s.tcMode)) tcMode.value = s.tcMode
    }
  } catch (e) { /* 忽略恢复失败 */ }
})

const persist = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      activeTab: activeTab.value, r0Type: r0Type.value, tcMode: tcMode.value,
      ptT: ptT.value, ptR: ptR.value, tcT: tcT.value, tcMv: tcMv.value, coldT: coldT.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}
watch([activeTab, r0Type, tcMode, ptT, ptR, tcT, tcMv, coldT], persist)

// ---------- 数字格式化（避免浮点尾差） ----------
const fmt = (v, digits = 2) => {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  return Number(v.toFixed(digits)).toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

// ---------- PT100/PT1000 计算态 ----------
const PT_T_MIN = -200
const PT_T_MAX = 850

const ptForward = computed(() => {
  const t = ptT.value
  if (typeof t !== 'number' || !isFinite(t)) return null
  const r = cvdForward(t, r0.value)
  if (!isFinite(r)) return null
  let warn = ''
  if (t < PT_T_MIN || t > PT_T_MAX) warn = `温度超出 IEC 60751 有效范围（−200~850℃），结果仅作数学外推参考。`
  return { r, warn }
})

const ptInverse = computed(() => {
  const r = ptR.value
  if (typeof r !== 'number' || !isFinite(r) || !(r > 0)) return null
  const t = cvdInverse(r, r0.value)
  if (!isFinite(t)) return null
  let warn = ''
  if (t < PT_T_MIN || t > PT_T_MAX) warn = `反算温度超出有效范围（−200~850℃），请检查阻值是否为 ${r0Type.value === 'pt100' ? 'PT100' : 'PT1000'} 口径。`
  return { t, warn }
})

// ---------- K 型计算态 ----------
const K_T_MIN = -200
const K_T_MAX = 1372
const K_MV_MIN = -5.891
const K_MV_MAX = 54.806

const tcForward = computed(() => {
  const t = tcT.value
  if (typeof t !== 'number' || !isFinite(t)) return null
  const mv = typeKForwardMv(t)
  if (!isFinite(mv)) return null
  let warn = ''
  if (t < K_T_MIN || t > K_T_MAX) warn = '温度超出 K 型 ITS-90 标准范围（−200~1372℃），结果仅作数学外推参考。'
  return { mv, warn }
})

const tcInverse = computed(() => {
  const eMeas = tcMv.value
  const cold = coldT.value
  if (typeof eMeas !== 'number' || !isFinite(eMeas)) return null
  if (typeof cold !== 'number' || !isFinite(cold)) return null
  const eColdMv = typeKForwardMv(cold)
  if (!isFinite(eColdMv)) return null
  const eTotalMv = eMeas + eColdMv
  const t = typeKInverseMv(eTotalMv)
  if (!isFinite(t)) return null
  let warn = ''
  if (eTotalMv < K_MV_MIN || eTotalMv > K_MV_MAX) warn = `总电势 ${fmt(eTotalMv, 3)} mV 超出 K 型逆函数有效范围（−5.891~54.806 mV），结果仅作外推参考。`
  if (cold < 0 || cold > 150) warn = (warn ? warn + ' ' : '') + '冷端温度不在常见环境范围（0~150℃），请确认接线端实测温度。'
  return { eColdMv, eTotalMv, t, warn }
})

// ---------- 换算表（与单测共用同一生成函数） ----------
const ptTableRows = computed(() => buildPtTable(r0.value))
const kTableRows = buildKTable()

// ---------- 复制表格（clipboard + alert） ----------
const copyPtTable = async () => {
  try {
    const lines = ['温度(℃)\t' + r0Type.value.toUpperCase() + '(Ω)']
    for (const row of ptTableRows.value) lines.push(`${row.t}\t${row.r.toFixed(2)}`)
    await navigator.clipboard.writeText(lines.join('\n'))
    alert('已复制到剪贴板')
  } catch (e) {
    alert('复制失败，请手动选择表格内容复制')
  }
}

const copyKTable = async () => {
  try {
    const lines = ['温度(℃)\tmV\tµV']
    for (const row of kTableRows) lines.push(`${row.t}\t${row.mv.toFixed(3)}\t${(row.mv * 1000).toFixed(0)}`)
    await navigator.clipboard.writeText(lines.join('\n'))
    alert('已复制到剪贴板')
  } catch (e) {
    alert('复制失败，请手动选择表格内容复制')
  }
}

// ---------- 交互 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const loadExample = (kind) => {
  if (kind === 'pt100') {
    activeTab.value = 'pt'
    r0Type.value = 'pt100'
    ptT.value = 100
  } else if (kind === 'pt100rev') {
    activeTab.value = 'pt'
    r0Type.value = 'pt100'
    ptR.value = 138.51
  } else if (kind === 'k1000') {
    activeTab.value = 'tc'
    tcMode.value = 't2mv'
    tcT.value = 1000
  } else if (kind === 'kcold') {
    activeTab.value = 'tc'
    tcMode.value = 'mv2t'
    tcMv.value = 40.394
    coldT.value = 25
  }
}
</script>
