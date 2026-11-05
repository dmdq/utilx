<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Thermometer class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">NTC热敏电阻计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">B 值 / Steinhart-Hart 双模型正反算 + ADC 分压测温在线计算器</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        三个模式一站式算清 NTC 测温：① B 值模型温度↔阻值双向换算；② Steinhart-Hart 三系数正反算，支持三点标定自动拟合 A/B/C（高斯消元）并回验误差；③ ADC 分压测温联动——上拉/下拉电路、ADC 码值↔温度双向换算与灵敏度估算。附常用型号速查表，全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> NTC 换算与测温计算
        </h2>

        <!-- 模式切换 -->
        <div class="grid grid-cols-3 gap-2">
          <button
            @click="mode = 'b'"
            :class="mode === 'b' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2.5 rounded-lg text-sm font-medium transition-all"
          >B 值模型</button>
          <button
            @click="mode = 'sh'"
            :class="mode === 'sh' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2.5 rounded-lg text-sm font-medium transition-all"
          >Steinhart-Hart</button>
          <button
            @click="mode = 'adc'"
            :class="mode === 'adc' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2.5 rounded-lg text-sm font-medium transition-all"
          >ADC 分压测温</button>
        </div>

        <!-- 共享参数：R25 / B（模式一、模式三共用） -->
        <div v-if="mode !== 'sh'" class="p-4 bg-muted/50 rounded-lg space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">标称阻值 R25（Ω）</label>
              <input
                v-model.number="r25"
                type="number"
                min="1"
                step="100"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">B 值 B25/85（K）</label>
              <input
                v-model.number="bValue"
                type="number"
                min="1"
                step="5"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label class="block text-xs text-muted-foreground mb-1.5">R25 预设</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="p in r25Presets"
                :key="p"
                @click="r25 = p"
                class="px-2.5 py-1 rounded bg-background border border-border hover:bg-muted text-xs text-muted-foreground transition"
              >{{ fmtOhm(p) }}</button>
            </div>
          </div>
          <div>
            <label class="block text-xs text-muted-foreground mb-1.5">B 值预设</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="p in bPresets"
                :key="p"
                @click="bValue = p"
                class="px-2.5 py-1 rounded bg-background border border-border hover:bg-muted text-xs text-muted-foreground transition"
              >{{ p }}</button>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            B 值口径注记：B 有 B25/85、B25/50、B25/100 等不同标定口径，同一只器件数值并不相等（B25/50≈3435 与 B25/85≈3950 是常见的同族标注）。口径混用会使 85℃ 阻值偏差达 20% 以上，计算前请与规格书核对口径。
          </p>
        </div>

        <!-- 模式一：B 值模型双向 -->
        <div v-if="mode === 'b'" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 温度 -> 阻值 -->
            <div class="border border-border rounded-lg p-4 space-y-3">
              <h3 class="text-sm font-medium text-foreground">温度 → 阻值</h3>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="tToR"
                  type="number"
                  step="1"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="温度 ℃"
                />
                <span class="text-sm text-muted-foreground">℃</span>
              </div>
              <div v-if="bRt !== null" class="bg-primary/10 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground mb-1">Rt = R25 × exp(B × (1/T − 1/T25))</p>
                <p class="text-xl font-bold text-primary">{{ fmtOhm(bRt) }}</p>
              </div>
              <p v-else class="text-xs text-muted-foreground">请输入有效温度（R25、B 需大于 0）。</p>
            </div>
            <!-- 阻值 -> 温度 -->
            <div class="border border-border rounded-lg p-4 space-y-3">
              <h3 class="text-sm font-medium text-foreground">阻值 → 温度</h3>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="rToT"
                  type="number"
                  min="0"
                  step="100"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="阻值 Ω"
                />
                <span class="text-sm text-muted-foreground">Ω</span>
              </div>
              <div v-if="bT !== null" class="bg-primary/10 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground mb-1">T = 1 / (1/T25 + ln(R/R25)/B) − 273.15</p>
                <p class="text-xl font-bold text-primary">{{ fmt(bT, 2) }} ℃</p>
              </div>
              <p v-else class="text-xs text-muted-foreground">请输入大于 0 的阻值（B 不允许为 0）。</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            B 值模型在 20~100℃ 区间误差一般在 ±1℃ 内；宽温区（-40~125℃ 及以外）建议用「Steinhart-Hart」页签。
          </p>
        </div>

        <!-- 模式二：Steinhart-Hart -->
        <div v-else-if="mode === 'sh'" class="space-y-4">
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">系数 A</label>
              <input
                v-model.number="shA"
                type="number"
                step="any"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">系数 B</label>
              <input
                v-model.number="shB"
                type="number"
                step="any"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">系数 C</label>
              <input
                v-model.number="shC"
                type="number"
                step="any"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            1/T = A + B·lnR + C·(lnR)³（T 为开尔文）。系数来源：规格书直接给出，或用下方三点标定拟合。
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- R -> T -->
            <div class="border border-border rounded-lg p-4 space-y-3">
              <h3 class="text-sm font-medium text-foreground">阻值 → 温度</h3>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="shR"
                  type="number"
                  min="0"
                  step="100"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="阻值 Ω"
                />
                <span class="text-sm text-muted-foreground">Ω</span>
              </div>
              <div v-if="shT !== null" class="bg-primary/10 rounded-lg p-3 text-center">
                <p class="text-xl font-bold text-primary">{{ fmt(shT, 3) }} ℃</p>
              </div>
              <p v-else class="text-xs text-muted-foreground">请输入大于 0 的阻值与有效系数。</p>
            </div>
            <!-- T -> R -->
            <div class="border border-border rounded-lg p-4 space-y-3">
              <h3 class="text-sm font-medium text-foreground">温度 → 阻值（牛顿迭代解 lnR）</h3>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="shTin"
                  type="number"
                  step="1"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="温度 ℃"
                />
                <span class="text-sm text-muted-foreground">℃</span>
              </div>
              <div v-if="shRout !== null" class="bg-primary/10 rounded-lg p-3 text-center">
                <p class="text-xl font-bold text-primary">{{ fmtOhm(shRout) }}</p>
              </div>
              <p v-else class="text-xs text-muted-foreground">请输入有效温度与有效系数。</p>
            </div>
          </div>

          <!-- 三点标定拟合 -->
          <div class="border border-border rounded-lg p-4 space-y-3">
            <h3 class="text-sm font-medium text-foreground">三点标定拟合（自动解出 A/B/C）</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              输入三组实测 (温度, 阻值)，把 lnR 代入 1/T = A + B·lnR + C·(lnR)³ 构造 3×3 线性方程组，高斯消元求解。建议三点取测温范围的两端与中间（如 0/25/85℃）。
            </p>
            <div class="space-y-2">
              <div v-for="(row, i) in calRows" :key="i" class="flex items-center gap-2">
                <span class="text-xs text-muted-foreground w-14">点 {{ i + 1 }}</span>
                <input
                  v-model.number="row.t"
                  type="number"
                  step="1"
                  class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="温度 ℃"
                />
                <span class="text-xs text-muted-foreground">℃</span>
                <input
                  v-model.number="row.r"
                  type="number"
                  min="0"
                  step="10"
                  class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="阻值 Ω"
                />
                <span class="text-xs text-muted-foreground">Ω</span>
              </div>
            </div>
            <button
              @click="doFit"
              class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
            >拟合 A/B/C 并回填</button>
            <p v-if="fitMsg" class="text-xs leading-relaxed" :class="fitOk ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ fitMsg }}
            </p>
            <div v-if="fitErrors" class="text-xs">
              <div class="grid grid-cols-3 gap-2 text-muted-foreground mb-1">
                <span>标定点</span>
                <span class="text-center">回算温度</span>
                <span class="text-right">误差（℃）</span>
              </div>
              <div v-for="(e, i) in fitErrors" :key="i" class="grid grid-cols-3 gap-2 text-muted-foreground py-1 border-t border-border/50">
                <span>{{ e.t }}℃ / {{ fmtOhm(e.r) }}</span>
                <span class="text-center text-foreground">{{ fmt(e.back, 4) }}℃</span>
                <span class="text-right text-foreground">{{ fmtErr(e.err) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 模式三：ADC 分压测温 -->
        <div v-else class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">电路接法</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="circuit = 'pullup'"
                  :class="circuit === 'pullup' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-xs font-medium transition-all"
                >上拉<br /><span class="text-[10px]">NTC 接地 · R_pull 接 Vref</span></button>
                <button
                  @click="circuit = 'pulldown'"
                  :class="circuit === 'pulldown' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-xs font-medium transition-all"
                >下拉<br /><span class="text-[10px]">NTC 接 Vref · R_fixed 接地</span></button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">参考电压 Vref（V）</label>
              <select
                v-model.number="vref"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option :value="3.3">3.3 V</option>
                <option :value="5.0">5.0 V</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">ADC 位数</label>
              <select
                v-model.number="bits"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option :value="10">10 bit（0~1023）</option>
                <option :value="12">12 bit（0~4095）</option>
                <option :value="16">16 bit（0~65535）</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">{{ circuit === 'pullup' ? '上拉电阻 R_pull' : '固定电阻 R_fixed' }}（Ω）</label>
            <input
              v-model.number="rPull"
              type="number"
              min="1"
              step="100"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">建议取 ≈R25（默认 10K）：25℃ 时分压最居中、灵敏度最大。温度换算使用「B 值模型」中的 R25/B（当前 {{ fmtOhm(r25) }} / B={{ fmt(bValue, 0) }}）。</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- ADC -> 温度 -->
            <div class="border border-border rounded-lg p-4 space-y-3">
              <h3 class="text-sm font-medium text-foreground">ADC 读数 → 温度</h3>
              <input
                v-model.number="adcCode"
                type="number"
                min="0"
                :max="adcMax - 1"
                step="1"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="ADC 码值（0 ~ 满量程）"
              />
              <div v-if="adcChain !== null" class="space-y-2">
                <div class="grid grid-cols-3 gap-2">
                  <div class="bg-muted/50 rounded-lg p-2.5 text-center">
                    <p class="text-[10px] text-muted-foreground mb-1">电压</p>
                    <p class="text-sm font-bold text-foreground">{{ fmt(adcChain.v, 3) }} V</p>
                  </div>
                  <div class="bg-muted/50 rounded-lg p-2.5 text-center">
                    <p class="text-[10px] text-muted-foreground mb-1">NTC 阻值</p>
                    <p class="text-sm font-bold text-foreground">{{ fmtOhm(adcChain.r) }}</p>
                  </div>
                  <div class="bg-primary/10 rounded-lg p-2.5 text-center">
                    <p class="text-[10px] text-muted-foreground mb-1">温度</p>
                    <p class="text-sm font-bold text-primary">{{ fmt(adcChain.t, 2) }} ℃</p>
                  </div>
                </div>
              </div>
              <p v-else class="text-xs text-muted-foreground">ADC 读数需在 1 ~ {{ adcMax - 1 }} 之间（0 与满量程无法反解阻值）。</p>
            </div>
            <!-- 温度 -> ADC -->
            <div class="border border-border rounded-lg p-4 space-y-3">
              <h3 class="text-sm font-medium text-foreground">温度 → ADC 码值</h3>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="tToCode"
                  type="number"
                  step="1"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="温度 ℃"
                />
                <span class="text-sm text-muted-foreground">℃</span>
              </div>
              <div v-if="codeChain !== null" class="grid grid-cols-3 gap-2">
                <div class="bg-muted/50 rounded-lg p-2.5 text-center">
                  <p class="text-[10px] text-muted-foreground mb-1">NTC 阻值</p>
                  <p class="text-sm font-bold text-foreground">{{ fmtOhm(codeChain.r) }}</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-2.5 text-center">
                  <p class="text-[10px] text-muted-foreground mb-1">采样电压</p>
                  <p class="text-sm font-bold text-foreground">{{ fmt(codeChain.v, 3) }} V</p>
                </div>
                <div class="bg-primary/10 rounded-lg p-2.5 text-center">
                  <p class="text-[10px] text-muted-foreground mb-1">ADC 码值</p>
                  <p class="text-sm font-bold text-primary">{{ codeChain.code }}</p>
                </div>
              </div>
              <p v-else class="text-xs text-muted-foreground">请输入有效温度（R25、B 需大于 0）。</p>
            </div>
          </div>

          <div v-if="sensitivity !== null" class="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground leading-relaxed">
            灵敏度提示：25℃ 附近每 ℃ 对应约 <span class="text-foreground font-medium">{{ fmt(sensitivity, 0) }} 个 LSB</span>（{{ bits }} bit、{{ circuit === 'pullup' ? '上拉' : '下拉' }} {{ fmtOhm(rPull) }} 时）。该值在 R_pull ≈ R25 处最大，随温度升高（NTC 阻值下降）而减小；若整个测温区间的码值跨度太大/太小，优先调整 R_pull。
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
            <li>B 值模型适合 20~100℃ 快速估算（误差 ±1℃ 内）；宽温区、高精度场景用 Steinhart-Hart 拟合。</li>
            <li>三点标定的三点取测温范围两端加中间，误差分布最均匀；标定点阻值建议用四位半以上万用表实测。</li>
            <li>ADC 电路的上拉/固定电阻取 ≈R25，25℃ 处码值居中、灵敏度最大；3.3V MCU 用 3.3V Vref 可省一次量程换算。</li>
            <li>实际电路加 RC 滤波并多次采样取均值，可显著抑制 ADC 抖动；高精度场景对 Vref 与 R_pull 做校准。</li>
          </ul>
        </div>

        <!-- 自核示例 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <FlaskConical class="w-4 h-4 mr-2 text-primary" /> 快速自核示例
          </h2>
          <div class="space-y-2">
            <button
              @click="loadExample('b')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              B 值：R25=10K、B=3950、85℃ → R = <span class="text-foreground font-medium">≈1086.7Ω</span>（0℃ 时 ≈33.62KΩ）
            </button>
            <button
              @click="loadExample('adc')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              ADC：上拉 10K + NTC 接地、3.3V、12bit、25℃ → <span class="text-foreground font-medium">ADC ≈ 2048</span>
            </button>
            <button
              @click="loadExample('sh')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              三点拟合：10K/3950 在 0/25/85℃ 标定 → 解出 A/B/C，三点回算误差 <span class="text-foreground font-medium">&lt; 0.01℃</span>
            </button>
          </div>
        </div>

        <!-- 免责声明 -->
        <div class="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            本工具按理想分压电路与纯热敏模型计算，未计入导线电阻、自热效应（测温电流尽量压到 0.2mA 以下）、Vref 偏差与 ADC 非线性。批量应用前请以规格书参数与实物标定为准。
          </p>
        </div>
      </div>
    </div>

    <!-- 常用型号速查表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold text-foreground mb-1 flex items-center">
        <Table class="w-5 h-5 mr-2 text-primary" /> 常用型号速查表
      </h2>
      <p class="text-xs text-muted-foreground mb-4">按 B 值模型 Rt = R25 × exp(B×(1/T − 1/T25)) 生成，标准点 25℃ / B25/85 口径。</p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-muted-foreground text-xs border-b border-border">
              <th class="text-left py-2 pr-4 font-medium">型号组合</th>
              <th class="text-right py-2 px-3 font-medium">0℃</th>
              <th class="text-right py-2 px-3 font-medium">25℃</th>
              <th class="text-right py-2 px-3 font-medium">50℃</th>
              <th class="text-right py-2 px-3 font-medium">85℃</th>
              <th class="text-left py-2 pl-4 font-medium">典型应用</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in lookupTable" :key="row.name" class="border-b border-border/50">
              <td class="py-2.5 pr-4 font-medium text-foreground">{{ row.name }}</td>
              <td class="py-2.5 px-3 text-right text-foreground">{{ row.vals[0] }}</td>
              <td class="py-2.5 px-3 text-right text-foreground">{{ row.vals[1] }}</td>
              <td class="py-2.5 px-3 text-right text-foreground">{{ row.vals[2] }}</td>
              <td class="py-2.5 px-3 text-right text-foreground">{{ row.vals[3] }}</td>
              <td class="py-2.5 pl-4 text-muted-foreground text-xs">{{ row.use }}</td>
            </tr>
          </tbody>
        </table>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>NTC 热敏电阻原理与选型</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <h3 class="text-lg font-semibold text-foreground">NTC 负温度系数原理</h3>
          <p>
            NTC（Negative Temperature Coefficient）由锰、钴、镍、铜等过渡金属氧化物烧结成的半导体陶瓷制成。温度升高时载流子浓度指数式增加，阻值指数式下降——这就是"负温度系数"。指数关系决定了它天然非线性：25℃ 附近每 1℃ 约变化 -4% 左右（B≈3950 时），比金属铂电阻灵敏一个数量级。
          </p>
          <h3 class="text-lg font-semibold text-foreground">B 值模型 vs Steinhart-Hart：精度差异</h3>
          <p>
            B 值模型 Rt = R25 × exp(B×(1/T − 1/T25)) 只用两个点定义，是对 lnR-1/T 曲线的线性近似；在 20~100℃ 区间误差一般在 ±1℃ 以内，够绝大多数消费场景使用。Steinhart-Hart 用 1/T = A + B·lnR + C·(lnR)³ 补上了曲率，宽温区（-40~125℃ 全程）误差可做到 ±0.05℃ 量级——精度取决于标定点的准确度。口径提醒：B25/85、B25/50、B25/100 数值不同，跨口径混用会把 85℃ 阻值算错 20% 以上。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么上拉电阻取 R25</h3>
          <p>
            ADC 分压电路的电压-温度斜率在 R_pull ≈ NTC 当前阻值时最大。取 R_pull = R25 意味着 25℃（测温区间最常用的标称点）处两个阻值相等、采样电压恰为 Vref/2、ADC 码值居中：向上向下各有一半量程余量，且整个常用温区的码值跨度利用率最高。如果测温热点远离 25℃（如只测 60~90℃ 的水温），把 R_pull 改到该区间中部阻值会更灵敏。
          </p>
          <h3 class="text-lg font-semibold text-foreground">热敏 vs PT100 怎么选</h3>
          <p>
            NTC 便宜（几毛到几块钱）、灵敏度高（每℃ 变化约 -4%）、阻值大抗导线电阻，但非线性强、个体差异大（±1~5%）、互换性靠 B 值分档。PT100 铂电阻线性好、精度高（A级 ±0.15℃@0℃）、长期稳定、符合 IEC 60751 标准互换，但灵敏度低（每℃ 仅 +0.385%）、需要恒流激励与三/四线制消导线电阻，价格贵数倍。经验法则：家电与消费测温选 NTC，工业计量、宽温区高精度选 PT100；中间地带看成本预算与标定能力。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">B25/85 与 B25/50 有什么区别？</span>两者用不同温度对定义同一只 NTC，数值不相等（B25/100 &gt; B25/85 &gt; B25/50）。计算时必须用与规格书一致的口径，否则高温段阻值可偏差 20% 以上。</li>
            <li><span class="text-foreground font-medium">B 值模型误差有多大？</span>20~100℃ 区间一般在 ±1℃ 内；超出该温区误差快速增大，宽温区请改用 Steinhart-Hart 或实测标定。</li>
            <li><span class="text-foreground font-medium">为什么我的 ADC 读数跳动很大？</span>常见原因：NTC 自热（激励电流过大）、走线引入噪声、Vref 不稳。加大分压总阻值、加 RC 滤波、多次采样均值可显著改善。</li>
            <li><span class="text-foreground font-medium">NTC 与 PT100 该怎么选？</span>要便宜、灵敏、耐导线电阻选 NTC；要线性、高精度、标准互换性选 PT100，代价是激励电路与成本。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ntc-thermistor-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Thermometer, Calculator, Info, FlaskConical, AlertTriangle, Table, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'NTC热敏电阻计算器 - B值/Steinhart-Hart/ADC测温在线计算器 | Util工具箱',
  description: '在线NTC热敏电阻计算器：B 值模型温度与阻值双向换算、Steinhart-Hart 三系数正反算与三点标定自动拟合、ADC 分压测温码值联动与灵敏度提示，附 10K3950 等常用型号速查表，纯本地计算',
  keywords: 'ntc计算器, 热敏电阻b值, 10k3950阻值表, ntc温度换算, steinhart hart, adc测温计算, ntc阻值表, 热敏电阻测温, 100k热敏电阻, 上拉电阻选型',
  author: 'Util工具箱',
  ogTitle: 'NTC热敏电阻计算器 - B值/Steinhart-Hart/ADC测温在线计算器',
  ogDescription: 'NTC B 值与 Steinhart-Hart 双模型正反算，三点标定拟合，ADC 分压测温联动',
  ogUrl: 'https://www.util.cn/tools/ntc-thermistor-calculator',
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
          name: 'NTC热敏电阻计算器',
          url: 'https://www.util.cn/tools/ntc-thermistor-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['B 值模型双向换算', 'Steinhart-Hart 正反算', '三点标定拟合 A/B/C', 'ADC 分压测温双向换算', '上拉/下拉电路支持', '常用型号速查表']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: 'NTC热敏电阻计算器', item: 'https://www.util.cn/tools/ntc-thermistor-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'B25/85 与 B25/50 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '两者用不同温度对定义同一只 NTC，数值不相等（B25/100 > B25/85 > B25/50）。计算时必须与规格书口径一致，否则高温段阻值可偏差 20% 以上。' }
            },
            {
              '@type': 'Question',
              name: 'B 值模型误差有多大？',
              acceptedAnswer: { '@type': 'Answer', text: '20~100℃ 区间一般在 ±1℃ 内；超出该温区误差快速增大，宽温区请改用 Steinhart-Hart 三系数模型或实测标定。' }
            },
            {
              '@type': 'Question',
              name: '为什么上拉电阻建议取 R25？',
              acceptedAnswer: { '@type': 'Answer', text: '分压斜率在 R_pull 等于 NTC 当前阻值处最大：取 R25 时 25℃ 采样电压为 Vref/2、ADC 码值居中，常用温区量程利用率最高。' }
            },
            {
              '@type': 'Question',
              name: 'NTC 与 PT100 该怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: 'NTC 便宜灵敏但非线性、互换性靠分档，适合家电与消费测温；PT100 线性精准、符合 IEC 60751 互换标准，但需恒流激励且成本高，适合工业计量与宽温区高精度场景。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'ntc-thermistor-calculator'
const STORE_KEY = TOOL_ID + ':inputs'
const tool = tools.find(t => t.id === TOOL_ID)

// ---------- 状态 ----------
const mode = ref('b') // b / sh / adc
const circuit = ref('pullup') // pullup: NTC 接地、R_pull 接 Vref / pulldown: NTC 接 Vref、R_fixed 接地

const r25 = ref(10000)
const bValue = ref(3950)
const r25Presets = [1000, 2000, 5000, 10000, 20000, 50000, 100000]
const bPresets = [3435, 3470, 3550, 3800, 3950, 4100]

const tToR = ref(85)
const rToT = ref(1087)

const shA = ref(0.0010215437)
const shB = ref(0.00025327938)
const shC = ref(-4.051645e-10)
const shR = ref(1087)
const shTin = ref(85)
const calRows = ref([
  { t: 0, r: 33621 },
  { t: 25, r: 10000 },
  { t: 85, r: 1087 }
])
const fitErrors = ref(null)
const fitMsg = ref('')
const fitOk = ref(false)

const vref = ref(3.3)
const rPull = ref(10000)
const bits = ref(12)
const adcCode = ref(2048)
const tToCode = ref(25)

const adcMax = computed(() => 2 ** bits.value)

// 交互记录与输入持久化（SSR 安全：localStorage 仅在客户端执行）
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_KEY) : null
    if (raw) {
      const s = JSON.parse(raw)
      const nums = { r25, bValue, tToR, rToT, shA, shB, shC, shR, shTin, vref, rPull, bits, adcCode, tToCode }
      for (const k of Object.keys(nums)) if (typeof s[k] === 'number') nums[k].value = s[k]
      if (typeof s.mode === 'string' && ['b', 'sh', 'adc'].includes(s.mode)) mode.value = s.mode
      if (typeof s.circuit === 'string' && ['pullup', 'pulldown'].includes(s.circuit)) circuit.value = s.circuit
      if (Array.isArray(s.calRows) && s.calRows.length === 3) {
        s.calRows.forEach((row, i) => {
          if (row && typeof row.t === 'number') calRows.value[i].t = row.t
          if (row && typeof row.r === 'number') calRows.value[i].r = row.r
        })
      }
    }
  } catch (e) { /* 忽略恢复失败 */ }
})

const persist = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      mode: mode.value, circuit: circuit.value,
      r25: r25.value, bValue: bValue.value, tToR: tToR.value, rToT: rToT.value,
      shA: shA.value, shB: shB.value, shC: shC.value, shR: shR.value, shTin: shTin.value,
      calRows: calRows.value.map(r => ({ t: r.t, r: r.r })),
      vref: vref.value, rPull: rPull.value, bits: bits.value,
      adcCode: adcCode.value, tToCode: tToCode.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}
watch([mode, circuit, r25, bValue, tToR, rToT, shA, shB, shC, shR, shTin, calRows, vref, rPull, bits, adcCode, tToCode], persist, { deep: true })

// ---------- 数字格式化（避免浮点尾差） ----------
const num = (v) => (typeof v === 'number' && isFinite(v) ? v : NaN)

const fmt = (v, digits = 2) => {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  return Number(v.toFixed(digits)).toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

const fmtOhm = (v) => {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  if (v >= 1e6) return (v / 1e6).toPrecision(4) + ' MΩ'
  if (v >= 1000) return (v / 1000).toPrecision(4) + ' KΩ'
  return v.toPrecision(4) + ' Ω'
}

const fmtErr = (e) => {
  if (typeof e !== 'number' || !isFinite(e)) return '—'
  return e < 1e-4 ? e.toExponential(1) : e.toFixed(5)
}

// ---------- B 值模型 ----------
const bvalR = (tC, R25, B) => {
  if (!(R25 > 0) || !(B > 0) || !isFinite(tC)) return NaN
  const T = tC + 273.15
  return R25 * Math.exp(B * (1 / T - 1 / 298.15))
}
const bvalT = (r, R25, B) => {
  if (!(r > 0) || !(R25 > 0) || !B) return NaN
  return 1 / (1 / 298.15 + Math.log(r / R25) / B) - 273.15
}

const bRt = computed(() => {
  const t = num(tToR.value)
  if (!isFinite(t)) return null
  const r = bvalR(t, num(r25.value), num(bValue.value))
  return isFinite(r) ? r : null
})

const bT = computed(() => {
  const r = num(rToT.value)
  if (!(r > 0)) return null
  const t = bvalT(r, num(r25.value), num(bValue.value))
  return isFinite(t) ? t : null
})

// ---------- Steinhart-Hart ----------
const shCoefOk = computed(() => {
  const A = num(shA.value), B = num(shB.value), C = num(shC.value)
  return isFinite(A) && isFinite(B) && isFinite(C) && B > 0
})

const shT = computed(() => {
  const r = num(shR.value)
  if (!(r > 0) || !shCoefOk.value) return null
  const A = num(shA.value), B = num(shB.value), C = num(shC.value)
  const t = 1 / (A + B * Math.log(r) + C * Math.log(r) ** 3) - 273.15
  return isFinite(t) ? t : null
})

// T -> R：牛顿迭代解 A + B·x + C·x³ = 1/T（x = lnR），x 限幅 [-30, 30] 保证收敛域
const shRfromT = (tC, A, B, C) => {
  const y = 1 / (tC + 273.15)
  let x = Math.max(-30, Math.min(30, (y - A) / B))
  for (let i = 0; i < 80; i++) {
    const f = A + B * x + C * x ** 3 - y
    const d = B + 3 * C * x * x
    if (!isFinite(d) || d === 0) return NaN
    const nx = x - f / d
    if (!isFinite(nx)) return NaN
    if (Math.abs(nx - x) < 1e-12) { x = nx; break }
    x = Math.max(-30, Math.min(30, nx))
  }
  return Math.exp(x)
}

const shRout = computed(() => {
  const t = num(shTin.value)
  if (!isFinite(t) || !shCoefOk.value) return null
  const r = shRfromT(t, num(shA.value), num(shB.value), num(shC.value))
  return isFinite(r) && r > 0 ? r : null
})

// 三点标定拟合：把 lnR 代入构造 3×3 线性方程组，高斯消元求解
const gaussSolve = (A, b) => {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let i = 0; i < n; i++) {
    let p = i
    for (let j = i + 1; j < n; j++) if (Math.abs(M[j][i]) > Math.abs(M[p][i])) p = j
    if (Math.abs(M[p][i]) < 1e-300) return null
    ;[M[i], M[p]] = [M[p], M[i]]
    for (let j = i + 1; j < n; j++) {
      const f = M[j][i] / M[i][i]
      for (let k = i; k <= n; k++) M[j][k] -= f * M[i][k]
    }
  }
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n]
    for (let k = i + 1; k < n; k++) s -= M[i][k] * x[k]
    x[i] = s / M[i][i]
  }
  return x
}

const doFit = () => {
  const pts = calRows.value.map(r => ({ t: num(r.t), r: num(r.r) }))
  if (pts.some(p => !isFinite(p.t) || !(p.r > 0))) {
    fitOk.value = false
    fitMsg.value = '请输入完整的三组标定点（温度有效，阻值大于 0）。'
    return
  }
  const rows = pts.map(p => { const x = Math.log(p.r), y = 1 / (p.t + 273.15); return [1, x, x * x * x, y] })
  const sol = gaussSolve(rows.map(r => r.slice(0, 3)), rows.map(r => r[3]))
  if (!sol || sol.some(v => !isFinite(v))) {
    fitOk.value = false
    fitMsg.value = '方程组无解或奇异：请检查三点是否重复或阻值差异过小。'
    return
  }
  shA.value = Number(sol[0].toPrecision(8))
  shB.value = Number(sol[1].toPrecision(8))
  shC.value = Number(sol[2].toExponential(6))
  // 复验：三个标定点回算温度误差
  const back = pts.map(p => {
    const t = 1 / (shA.value + shB.value * Math.log(p.r) + shC.value * Math.log(p.r) ** 3) - 273.15
    return { t: p.t, r: p.r, back: t, err: Math.abs(t - p.t) }
  })
  fitErrors.value = back
  const maxErr = Math.max(...back.map(e => e.err))
  fitOk.value = maxErr < 0.01
  fitMsg.value = fitOk.value
    ? '拟合完成，A/B/C 已回填系数框；三点复验最大误差 ' + fmtErr(maxErr) + '℃，通过（< 0.01℃）。'
    : '拟合完成，但三点复验最大误差 ' + fmtErr(maxErr) + '℃ 超过 0.01℃，请检查标定数据或改用 S-H 全系数标定。'
}

// ---------- ADC 分压 ----------
// 上拉：V = Vref × R/(R+Rp)；下拉：V = Vref × Rf/(Rf+R)
const codeChain = computed(() => {
  const t = num(tToCode.value)
  const R25 = num(r25.value), B = num(bValue.value), rp = num(rPull.value)
  if (!isFinite(t) || !(R25 > 0) || !(B > 0) || !(rp > 0)) return null
  const r = bvalR(t, R25, B)
  if (!isFinite(r)) return null
  const ratio = circuit.value === 'pullup' ? r / (r + rp) : rp / (rp + r)
  const v = vref.value * ratio
  return { r, v, code: Math.round(adcMax.value * ratio) }
})

const adcChain = computed(() => {
  const c = num(adcCode.value)
  const R25 = num(r25.value), B = num(bValue.value), rp = num(rPull.value)
  if (!isFinite(c) || c <= 0 || c >= adcMax.value || !(R25 > 0) || !(B > 0) || !(rp > 0)) return null
  const r = circuit.value === 'pullup' ? rp * c / (adcMax.value - c) : rp * (adcMax.value - c) / c
  if (!(r > 0)) return null
  const t = bvalT(r, R25, B)
  if (!isFinite(t)) return null
  const ratio = circuit.value === 'pullup' ? r / (r + rp) : rp / (rp + r)
  return { r, t, v: vref.value * ratio }
})

// 灵敏度：25℃ 附近 dADC/dT（LSB/℃）
const sensitivity = computed(() => {
  const R25 = num(r25.value), B = num(bValue.value), rp = num(rPull.value)
  if (!(R25 > 0) || !(B > 0) || !(rp > 0)) return null
  const T = 298.15
  const dRdT = R25 * (-B / (T * T)) // Ω/℃，负值
  return Math.abs(adcMax.value * rp * dRdT / ((R25 + rp) ** 2))
})

// ---------- 常用型号速查表（B 值模型生成，已按公式自核） ----------
const lookupTable = [
  { name: '10K / B=3435', use: '空调/热水器探头通用款', vals: ['28.70 KΩ', '10.00 KΩ', '4.101 KΩ', '1.451 KΩ'] },
  { name: '10K / B=3950', use: '最常见的 3950 系列（电源/电池/空调）', vals: ['33.62 KΩ', '10.00 KΩ', '3.588 KΩ', '1.087 KΩ'] },
  { name: '100K / B=3950', use: '3D 打印机热敏（热端/热床通用）', vals: ['336.2 KΩ', '100.0 KΩ', '35.88 KΩ', '10.87 KΩ'] },
  { name: '5K / B=3470', use: '车用/工业水温探头常见', vals: ['14.51 KΩ', '5.000 KΩ', '2.032 KΩ', '711.5 Ω'] }
]

// ---------- 交互 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const loadExample = (m) => {
  mode.value = m
  if (m === 'b') {
    r25.value = 10000; bValue.value = 3950; tToR.value = 85; rToT.value = 1087
  } else if (m === 'adc') {
    circuit.value = 'pullup'; vref.value = 3.3; rPull.value = 10000; bits.value = 12
    adcCode.value = 2048; tToCode.value = 25; r25.value = 10000; bValue.value = 3950
  } else {
    calRows.value = [{ t: 0, r: 33621 }, { t: 25, r: 10000 }, { t: 85, r: 1087 }]
    shR.value = 1087; shTin.value = 85
    doFit()
  }
}
</script>
