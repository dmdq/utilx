<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Cable class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">I2C上拉电阻计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">Rp 取值区间（下限×灌电流 / 上限×上升时间）、E24 推荐值吸附与标准/快速/FM+ 三档速览</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 I2C 上拉电阻计算器：按 TI SLVA689 与 NXP UM10204 口径计算 Rp(min) = (VDD − VOL)/IOL 与
        Rp(max) = tr/(0.8473×Cb)，输出取值区间、区间有效性判定与 E24 推荐值，并回验推荐值下的实际上升时间；
        支持标准模式（100kbps）/快速模式（400kbps）/快速模式+（1Mbps）三档切换与当前 VDD 三档速览表，
        附总线电容估算助手（器件数×10pF + 走线×30pF/m）。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        公式口径：Rp(min) = (VDD−VOL)/IOL 与 Rp(max) = tr/(0.8473×Cb) 参照 TI SLVA689，IOL 与各档 tr(max)、
        总线电容上限参照 NXP UM10204（标准/快速模式 IOL=3mA，FM+ IOL=20mA）。
        0.8473 = ln(7/3)，为上升时间按 VDD 的 30%→70% 定义的 RC 系数；
        单位推导：tr 用 ns、Cb 用 pF 时 Rp(max) = tr/(0.8473×Cb) 直接得出 kΩ（ns/pF = 10⁻⁹/10⁻¹² = 10³ → Ω×10³ = kΩ）。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器列 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 输入与区间计算
          </h2>

          <!-- 速率档位 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">速率档位</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="(m, key) in SPEED_MODES"
                :key="key"
                @click="speedKey = key"
                :class="speedKey === key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >{{ m.shortLabel }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              当前档：tr(max) = {{ modeSpec.trMaxNs }} ns，IOL = {{ modeSpec.iolMa }} mA，总线电容上限 {{ modeSpec.cbMaxPf }} pF
            </p>
          </div>

          <!-- VDD / VOL / Cb -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">总线电压 VDD（V）</label>
              <div class="flex flex-wrap gap-1.5 mb-2">
                <button
                  v-for="v in VDD_PRESETS"
                  :key="v"
                  @click="vdd = v"
                  :class="vdd === v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                >{{ v }}V</button>
              </div>
              <input
                id="i2c-vdd"
                v-model.number="vdd"
                type="number"
                min="0.9"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 3.3"
              >
            </div>
            <div>
              <label for="i2c-vol" class="block text-sm font-medium text-foreground mb-1.5">输出低电平 VOL（V）</label>
              <input
                id="i2c-vol"
                v-model.number="vol"
                type="number"
                min="0"
                step="0.05"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <p class="text-xs text-muted-foreground mt-1">规范默认 0.4V（灌电流下的 VOL(max)），可改</p>
            </div>
            <div>
              <label for="i2c-cb" class="block text-sm font-medium text-foreground mb-1.5">总线电容 Cb（pF）</label>
              <input
                id="i2c-cb"
                v-model.number="cbPf"
                type="number"
                min="1"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <p class="text-xs text-muted-foreground mt-1">规范上限 {{ modeSpec.cbMaxPf }} pF（FM+ 为 550pF，其余 400pF）</p>
            </div>
          </div>

          <!-- 总线电容估算助手 -->
          <div class="bg-muted/50 border border-border rounded-lg p-4 space-y-2.5">
            <p class="text-xs font-medium text-foreground">总线电容估算助手：器件数 × 10pF（每个 I2C 器件输入/引脚电容典型值）+ 走线长度 × 30pF/m（经验口径，范围 20~50pF/m）</p>
            <div class="grid grid-cols-3 gap-2 items-end">
              <div>
                <label for="i2c-dev" class="block text-xs text-muted-foreground mb-1">挂载器件数</label>
                <input
                  id="i2c-dev"
                  v-model.number="devCount"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
              </div>
              <div>
                <label for="i2c-len" class="block text-xs text-muted-foreground mb-1">走线长度（m）</label>
                <input
                  id="i2c-len"
                  v-model.number="traceM"
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
              </div>
              <button
                @click="applyBusCap"
                :disabled="estCap === null"
                class="py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
              >填入主输入</button>
            </div>
            <p class="text-xs text-muted-foreground">
              估算：{{ fmt(devCount, 0) }} × 10 + {{ fmt(traceM, 1) }} × 30 =
              <span class="font-semibold text-foreground">{{ estCap === null ? '—' : fmt(estCap, 1) + ' pF' }}</span>
              （示例：5 器件 0.5m → 50 + 15 = 65pF）
            </p>
          </div>

          <!-- 参数无效 -->
          <div v-if="paramsInvalid" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">请检查参数：VDD &gt; 0，0 ≤ VOL &lt; VDD，Cb &gt; 0。</p>
            </div>
          </div>

          <!-- 无解判定 -->
          <div v-else-if="noSolution" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">该速率/电容组合无解</p>
              <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Rp 下限（{{ fmtOhm(rpMin) }}，由灌电流决定）已高于 Rp 上限（{{ fmtOhm(rpMaxOhm) }}，由上升时间决定）：
                需降低速率档或减小总线电容（缩短走线、减少器件或加总线缓冲器分段）。
              </p>
            </div>
          </div>

          <!-- 结果区 -->
          <template v-else>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-lg p-3 border border-border text-center">
                <p class="text-xs text-muted-foreground mb-1">Rp 下限（灌电流约束）</p>
                <p class="text-xl font-bold text-foreground">{{ fmtOhm(rpMin) }}</p>
                <p class="text-[11px] text-muted-foreground mt-1">({{ fmt(vdd, 1) }} − {{ fmt(vol, 2) }}) V ÷ {{ modeSpec.iolMa }} mA</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3 border border-border text-center">
                <p class="text-xs text-muted-foreground mb-1">Rp 上限（上升时间约束）</p>
                <p class="text-xl font-bold text-foreground">{{ fmtOhm(rpMaxOhm) }}</p>
                <p class="text-[11px] text-muted-foreground mt-1">{{ modeSpec.trMaxNs }} ns ÷ (0.8473 × {{ fmt(cbPf, 0) }} pF)</p>
              </div>
            </div>

            <div v-if="recommended" class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p class="text-xs text-muted-foreground mb-0.5">E24 推荐值（取区间几何中点最近档）</p>
                  <p class="text-2xl font-bold text-primary">{{ fmtOhm(recommended) }}</p>
                  <p class="text-xs text-muted-foreground mt-1">常见相邻取值 {{ modeSpec.iolMa <= 3 ? '2.2k / 3.3k / 4.7k' : '470Ω / 510Ω / 560Ω' }} 均可对照区间核验</p>
                </div>
                <div class="sm:border-l sm:border-primary/20 sm:pl-3">
                  <p class="text-xs text-muted-foreground mb-0.5">回验：推荐值下实际上升时间</p>
                  <p class="text-2xl font-bold text-foreground">
                    {{ trReal === null ? '—' : fmt(trReal, 1) }} <span class="text-sm">ns</span>
                  </p>
                  <p class="text-xs mt-1" :class="trRatioOk ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">
                    tr(max) {{ modeSpec.trMaxNs }} ns 的 {{ fmt(trRatio, 0) }}%，满足规范
                  </p>
                </div>
              </div>
              <p class="text-[11px] leading-relaxed text-muted-foreground mt-3">
                区间内任一 E24 档位都满足规范；推荐值取几何中点附近的档位，为灌电流裕度与上升速度之间的折中。
              </p>
            </div>

            <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400">
                区间内没有 E24 标称档位（区间窄于档位间距）。可改用两只电阻串/并联凑出区间中值，或换精密电阻（E96/E192）。
              </p>
            </div>
          </template>

          <!-- Cb 超限警示 -->
          <div v-if="cbOverLimit && !paramsInvalid" class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
              总线电容 {{ fmt(cbPf, 0) }} pF 已超过当前档规范上限 {{ modeSpec.cbMaxPf }} pF：
              即使算出的区间有解，也建议缩短走线、减少挂载器件或加总线缓冲器分段后重新核算。
            </p>
          </div>
        </div>

        <!-- 当前 VDD 三档速览表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Activity class="w-5 h-5 mr-2 text-primary" /> 当前 VDD 三档速率速览
          </h2>
          <p class="text-xs text-muted-foreground mb-3">VDD = {{ fmt(vdd, 1) }} V，VOL = {{ fmt(vol, 2) }} V，Cb = {{ fmt(cbPf, 0) }} pF（与上方输入联动，同一组函数生成）</p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-muted-foreground">
                  <th class="text-left py-2 pr-3 font-medium">档位</th>
                  <th class="text-right py-2 px-3 font-medium">Rp(min)</th>
                  <th class="text-right py-2 px-3 font-medium">Rp(max)</th>
                  <th class="text-right py-2 px-3 font-medium">E24 推荐</th>
                  <th class="text-right py-2 pl-3 font-medium">判定</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in modeTable" :key="row.key" class="border-t border-border/50" :class="row.key === speedKey ? 'bg-primary/5' : ''">
                  <td class="py-2.5 pr-3 font-medium text-foreground whitespace-nowrap">{{ row.label }}</td>
                  <td class="py-2.5 px-3 text-right text-foreground">{{ fmtOhm(row.min) }}</td>
                  <td class="py-2.5 px-3 text-right text-foreground">{{ fmtOhm(row.max) }}</td>
                  <td class="py-2.5 px-3 text-right font-semibold text-primary">{{ row.rec === null ? '—' : fmtOhm(row.rec) }}</td>
                  <td class="py-2.5 pl-3 text-right whitespace-nowrap">
                    <span v-if="row.ok" class="text-green-600 dark:text-green-400">有解</span>
                    <span v-else class="text-red-500">无解</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            同一总线电容下，档位越高 tr(max) 越紧、Rp 上限越低；FM+ 因灌电流规格提高到 20mA，下限也随之大幅下降。
          </p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 规范参数速览 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <BookOpen class="w-5 h-5 mr-2 text-primary" /> 规范参数速览
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-muted-foreground">
                  <th class="text-left py-1.5 font-medium">档位</th>
                  <th class="text-right py-1.5 px-2 font-medium">tr(max)</th>
                  <th class="text-right py-1.5 px-2 font-medium">IOL</th>
                  <th class="text-right py-1.5 pl-2 font-medium">Cb 上限</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(m, key) in SPEED_MODES" :key="key" class="border-t border-border/50">
                  <td class="py-1.5 font-medium text-foreground">{{ m.shortLabel }}</td>
                  <td class="py-1.5 px-2 text-right text-foreground">{{ m.trMaxNs }} ns</td>
                  <td class="py-1.5 px-2 text-right text-foreground">{{ m.iolMa }} mA</td>
                  <td class="py-1.5 pl-2 text-right text-foreground">{{ m.cbMaxPf }} pF</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] leading-relaxed text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border">
            IOL 为 VOL = 0.4V 下规范允许的最大灌电流：标准/快速模式 3mA、FM+ 20mA（NXP UM10204 口径，TI SLVA689 同）。
            0.8473 = ln(7/3)，对应上升时间按 VDD 的 30%→70% 定义的 RC 充电系数。
          </p>
        </div>

        <!-- 工程实践 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Wrench class="w-5 h-5 mr-2 text-primary" /> 多器件 / 长走线实践
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">总电容超标：</span>用总线缓冲器（如 P82B715、TCA9617B）把系统分段，每段电容独立核算。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">无解时降档：</span>先把速率降到快速模式或标准模式重算，多数无解都来自 FM+ 长总线。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">走线规则：</span>SDA/SCL 尽量短、等长并行、避免分支残桩；长线可用双绞并靠近地线。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">多点上拉：</span>总线上多处上拉按并联计算（等效电阻变小），不要叠加导致低于 Rp(min)。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">电平转换：</span>两侧 VDD 不同时，各自按本侧 VDD 与器件 VOL 核算下限，不能用单一电阻公式套全链路。</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 静态参考表：VDD × 三档（Cb=100pF） -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-4">
        <Table class="w-5 h-5 mr-2 text-primary" /> 静态参考表：VDD 3.3V / 5.0V × 三档速率（Cb = 100pF，VOL = 0.4V）
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-muted-foreground">
              <th class="text-left py-2 pr-3 font-medium">VDD</th>
              <th class="text-left py-2 px-3 font-medium">档位</th>
              <th class="text-right py-2 px-3 font-medium">Rp(min)</th>
              <th class="text-right py-2 px-3 font-medium">Rp(max)</th>
              <th class="text-right py-2 pl-3 font-medium">E24 推荐</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in staticTable" :key="row.vdd + row.key" class="border-t border-border/50">
              <td class="py-2.5 pr-3 font-medium text-foreground whitespace-nowrap">{{ row.vdd }} V</td>
              <td class="py-2.5 px-3 text-foreground whitespace-nowrap">{{ row.label }}</td>
              <td class="py-2.5 px-3 text-right text-foreground">{{ fmtOhm(row.min) }}</td>
              <td class="py-2.5 px-3 text-right text-foreground">{{ fmtOhm(row.max) }}</td>
              <td class="py-2.5 pl-3 text-right font-semibold text-primary">{{ row.rec === null ? '—（无解）' : fmtOhm(row.rec) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
        本表按固定 Cb = 100pF 预生成；实际总线电容不同时请以上方计算器为准。示例：3.3V 快速模式下推荐 1.8kΩ
        （区间 966.7Ω ~ 3.54kΩ），常被简记为「3.3V/400kHz 取 2.2k 左右」——那是几何中点 1.85kΩ 与工程偏好的折中说法。
      </p>
    </div>

    <!-- 免责条 -->
    <div class="flex items-start gap-2 p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
        免责声明：本页按 TI SLVA689 与 NXP UM10204 公式口径静态计算，未计入器件 VOL 差异、多处上拉并联叠加与重复起始信号时序余量等动态条件；
        实际选型请结合主控/从机手册的灌电流能力与示波器实测上升时间确认。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>为什么 I2C 必须上拉</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          I2C 的 SDA 与 SCL 都是<span class="text-foreground font-medium">开漏（开集）输出</span>：器件内部只有下拉管、没有上拉管，
          只能"灌电流"把总线拉到低电平，而高电平必须靠上拉电阻把总线从 VDD 拉起来。没有上拉，总线释放后悬浮、电平不定，
          通信完全无法建立。上拉电阻因此承担两个互相制约的角色：阻值太小，器件拉低时要灌入的电流过大；
          阻值太大，总线电容充电太慢、上升沿爬不上去。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">上下限的物理含义</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          <span class="text-foreground font-medium">下限由灌电流决定：</span>Rp(min) = (VDD − VOL)/IOL。电阻太小，器件灌电流超过
          3mA（标准/快速）或 20mA（FM+），输出管脱离饱和、VOL 抬升甚至超规范，长期还可能损坏输出级。
          <span class="text-foreground font-medium">上限由 RC 上升时间决定：</span>Rp(max) = tr/(0.8473×Cb)。释放总线后 VDD 经电阻给总线电容充电，
          时间常数 Rp×Cb；规范要求上升沿从 30% 爬到 70% 的时间不超过 tr(max)，0.8473 = ln(7/3) 正是这一区间的对数系数。
          两个约束夹出的区间就是可选范围：区间无解说明这一速率与总线电容组合需要降速或减容。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么快速模式要更小的上拉</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          速率越高位宽越短，规范允许的最大上升时间从标准模式 1000ns 收紧到快速模式 300ns、FM+ 120ns。
          同样的总线电容下 Rp(max) 与 tr(max) 成正比，档位越高上限越低，必须换更小的上拉电阻才能"赶得上"位时序——
          这就是 400kHz/1MHz 总线常用 1k~2.2k、而 100kHz 老总线用 4.7k~10k 的原因。
          FM+ 同时把灌电流规格提高到 20mA，把下限也压低，给小电阻留出空间。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">总线电容是怎么来的</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Cb 是挂在总线上的所有电容之和：每个 I2C 器件的输入/引脚电容（典型 5~10pF，常用 10pF/个估算）、
          PCB 走线对地电容（经验 20~50pF/m，30pF/m 是常用中值，短走线四层板可按 20~30、长线或外接排线按 40~50）、
          以及连接器、TVS/ESR 保护管与过孔的附加电容。估算助手按"器件数×10pF + 走线长度×30pF/m"给出初值，
          精确值应结合 PCB 叠层与实际布局用工具（如 TDR 仿真或 LCR 表实测）确认。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">多器件 / 长走线的工程实践</h3>
        <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><span class="text-foreground font-medium">电容分段：</span>用 I2C 总线缓冲器（P82B715、TCA9617B、PCA9617 等）把长总线拆成几段，每段电容独立满足规范。</li>
          <li><span class="text-foreground font-medium">降速兜底：</span>无解组合先降速率档（FM+→FM→SM），tr(max) 放宽后上限抬高，多数场景立刻有解。</li>
          <li><span class="text-foreground font-medium">布线规则：</span>SDA/SCL 短而等长、避免分支残桩，长线双绞并伴地线；过孔与连接器都计入电容。</li>
          <li><span class="text-foreground font-medium">上拉位置：</span>通常在主控端就近上拉一次；多点上拉等效电阻并联变小，需重新核对不低于 Rp(min)。</li>
          <li><span class="text-foreground font-medium">电平转换：</span>1.8V/3.3V 混压时用专用电平转换方案，两侧分别按各自 VDD 与器件 VOL 核算下限。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">I2C 上拉一般用多大？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              经验口径：3.3V 系统在 100k~400kHz、总线电容不大（≤100pF）时常用 2.2k~4.7k；5V 系统 4.7k~10k 常见；
              1.8V 系统因下限抬高常用 1k~2.2k。精确取值请按本工具区间计算——先算上下限，再取区间内 E24 档位。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">4.7k 在 400kHz 行不行？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              看总线电容。快速模式要求 tr ≤ 300ns：tr = 0.8473 × 4.7kΩ × Cb，可算出 Cb ≤ 约 75pF 才达标；
              Cb = 100pF 时 tr ≈ 398ns 已超规范。所以 4.7k 只适合器件少、走线短的 400kHz 总线，
              电容偏大时应降到 2.2k~3.3k 并核对不低于 Rp(min)（3.3V 下约 966.7Ω）。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">总线电容超了会怎样？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              上升沿随电容增大而变缓，接收端可能在位采样点读到未建立的高电平，表现为 NACK、随机误码或整段读数错乱；
              电容超过规范上限后，即使减小上拉电阻也会先撞到 Rp 下限约束（灌电流超标）而"无解"。
              处理办法：缩短走线、减少挂载器件、加总线缓冲器分段，或直接降低速率档。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">FM+ 为什么用 20mA 口径？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              1Mbps 的上升时间窗只有 120ns，需要很小的上拉电阻，若仍按 3mA 灌电流口径，下限会高到与上限打架。
              NXP UM10204 因此规定 FM+ 下 VOL = 0.4V 时灌电流能力提升到 20mA，Rp(min) 降到原来的 1/6.7 左右，
              给小电阻留出合规空间——前提是总线上所有器件的输出级都支持该电流规格。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'i2c-pullup-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Cable, Calculator, Activity, BookOpen, Table, Wrench, Info, CheckCircle,
  AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// E24 电阻标称系列基数（×10^n 展开）
const E24_BASE = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91]

// 三档速率规范参数（TI SLVA689 / NXP UM10204 口径）
// trMaxNs：规范允许最大上升时间（ns）；iolMa：VOL=0.4V 下最大灌电流（mA）；cbMaxPf：总线电容上限（pF）
const SPEED_MODES = {
  sm:   { shortLabel: 'SM 100k', label: '标准模式 SM（100 kbps）', trMaxNs: 1000, iolMa: 3,  cbMaxPf: 400 },
  fm:   { shortLabel: 'FM 400k', label: '快速模式 FM（400 kbps）', trMaxNs: 300,  iolMa: 3,  cbMaxPf: 400 },
  fmpp: { shortLabel: 'FM+ 1M',  label: '快速模式+ FM+（1 Mbps）', trMaxNs: 120,  iolMa: 20, cbMaxPf: 550 }
}

// Rp 下限（Ω）：Rp(min) = (VDD − VOL)/IOL
function rpMinOhm(vdd, vol, iolMa) {
  if (!Number.isFinite(vdd) || !Number.isFinite(vol) || !Number.isFinite(iolMa)) return null
  if (!(vdd > 0) || !(iolMa > 0) || vol < 0 || vol >= vdd) return null
  return (vdd - vol) / (iolMa / 1000)
}

// Rp 上限（kΩ）：Rp(max) = tr/(0.8473×Cb)
// 单位推导：tr[ns]×1e-9 / (0.8473 × Cb[pF]×1e-12) Ω = (tr/Cb)×1e3 Ω = tr/(0.8473×Cb) kΩ
function rpMaxKohm(trNs, cbPf) {
  if (!Number.isFinite(trNs) || !Number.isFinite(cbPf)) return null
  if (!(trNs > 0) || !(cbPf > 0)) return null
  return trNs / (0.8473 * cbPf)
}

// 实际上升时间回验（ns）：tr = 0.8473 × Rp[kΩ] × Cb[pF]
function riseTimeNs(rpKohm, cbPf) {
  if (!Number.isFinite(rpKohm) || !Number.isFinite(cbPf)) return null
  if (!(rpKohm > 0) || !(cbPf > 0)) return null
  return 0.8473 * rpKohm * cbPf
}

// 区间内 E24 推荐（Ω）：取区间几何中点最近的档位；区间内无档位返回 null
function recommendE24(minOhm, maxOhm) {
  if (!Number.isFinite(minOhm) || !Number.isFinite(maxOhm) || !(minOhm > 0) || !(maxOhm >= minOhm)) return null
  const mid = Math.sqrt(minOhm * maxOhm)
  let best = null
  for (let decade = 1; decade <= 10000000; decade *= 10) {
    for (const b of E24_BASE) {
      const v = b * decade
      if (v >= minOhm && v <= maxOhm && (best === null || Math.abs(v - mid) < Math.abs(best - mid))) best = v
    }
  }
  return best
}

// 总线电容估算（pF）：器件数×10pF + 走线长度×30pF/m
function estimateBusCap(devices, meters) {
  if (!Number.isFinite(devices) || !Number.isFinite(meters) || !(devices >= 0) || !(meters >= 0)) return null
  return devices * 10 + meters * 30
}
// ==== PURE-FNS-END ====

// SEO
useSeoMeta({
  title: 'I2C上拉电阻计算器 - 取值区间与三档速率速览',
  description: '在线 I2C 上拉电阻计算器：按 TI SLVA689 / NXP UM10204 口径计算 Rp(min)与 Rp(max)，输出取值区间、无解判定、E24 推荐值与实际上升时间回验，支持标准/快速/FM+ 三档速览与总线电容估算助手，纯本地计算。',
  keywords: 'i2c上拉电阻, iic上拉取值, i2c总线电容, 上拉电阻计算, i2c pull-up calculator, i2c pullup resistor, 上升时间, 4.7k',
  author: '有条工具',
  ogTitle: 'I2C上拉电阻计算器 - 取值区间与三档速率速览 | 有条工具',
  ogDescription: 'Rp 上下限区间、E24 推荐值、上升时间回验与 SM/FM/FM+ 三档速览。',
  ogUrl: 'https://www.util.cn/tools/i2c-pullup-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'I2C上拉电阻计算器',
  twitterDescription: 'Rp 上下限区间、E24 推荐值与三档速率速览。'
})

// JSON-LD 结构化数据（SoftwareApplication + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'I2C上拉电阻计算器',
          url: 'https://www.util.cn/tools/i2c-pullup-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'Rp(min) = (VDD−VOL)/IOL 下限计算',
            'Rp(max) = tr/(0.8473×Cb) 上限计算',
            '区间有效性判定与无解提示',
            'E24 推荐值吸附与上升时间回验',
            '标准/快速/FM+ 三档速率速览表',
            '总线电容估算助手（器件数×10pF + 走线×30pF/m）',
            'VDD 3.3V/5.0V 静态参考表',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'I2C 上拉一般用多大？',
              acceptedAnswer: { '@type': 'Answer', text: '3.3V 系统 100k~400kHz、Cb≤100pF 时常用 2.2k~4.7k；5V 系统 4.7k~10k；精确值按 Rp 上下限区间取 E24 档位。' }
            },
            {
              '@type': 'Question',
              name: '4.7k 在 400kHz 行不行？',
              acceptedAnswer: { '@type': 'Answer', text: '看总线电容：400kHz 要求 tr≤300ns，4.7kΩ 只允许 Cb≤约75pF；Cb=100pF 时 tr≈398ns 超规范，应降到 2.2k~3.3k。' }
            },
            {
              '@type': 'Question',
              name: '总线电容超了会怎样？',
              acceptedAnswer: { '@type': 'Answer', text: '上升沿变缓导致 NACK 与误码；超上限后减小上拉会先撞到灌电流下限而无解，需缩短走线、加缓冲器分段或降速。' }
            },
            {
              '@type': 'Question',
              name: 'FM+ 为什么用 20mA 口径？',
              acceptedAnswer: { '@type': 'Answer', text: '1Mbps 上升时间窗仅 120ns，需要更小上拉；NXP UM10204 将 FM+ 灌电流规格提高到 20mA，把 Rp(min) 压低约 6.7 倍以留出空间。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'i2c-pullup-calculator'
const SETTINGS_KEY = 'i2c-pullup-calculator-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 常量 ----------
const VDD_PRESETS = [3.3, 5.0, 2.5, 1.8]
const STATIC_CB_PF = 100

// ---------- 状态 ----------
const speedKey = ref('fm')     // 'sm' | 'fm' | 'fmpp'
const vdd = ref(3.3)
const vol = ref(0.4)
const cbPf = ref(100)
const devCount = ref(5)
const traceM = ref(0.5)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化 ----------
const fmt = (v, d = 2) => (Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—')
const fmtOhm = (v) => {
  if (!Number.isFinite(v)) return '—'
  if (v >= 1e6) return (v / 1e6).toFixed(2) + ' MΩ'
  if (v >= 1000) return (v / 1000).toFixed(2) + ' kΩ'
  return v.toFixed(1) + ' Ω'
}

// ---------- 主计算 ----------
const modeSpec = computed(() => SPEED_MODES[speedKey.value] || SPEED_MODES.fm)

const rpMin = computed(() => rpMinOhm(vdd.value, vol.value, modeSpec.value.iolMa))
const rpMaxOhm = computed(() => {
  const k = rpMaxKohm(modeSpec.value.trMaxNs, cbPf.value)
  return k === null ? null : k * 1000
})

const paramsInvalid = computed(() => rpMin.value === null || rpMaxOhm.value === null)
const noSolution = computed(() => !paramsInvalid.value && rpMaxOhm.value < rpMin.value)

// E24 推荐 + 上升时间回验
const recommended = computed(() => {
  if (paramsInvalid.value || noSolution.value) return null
  return recommendE24(rpMin.value, rpMaxOhm.value)
})

const trReal = computed(() => {
  if (recommended.value === null) return null
  return riseTimeNs(recommended.value / 1000, cbPf.value)
})

const trRatio = computed(() => {
  if (trReal.value === null) return null
  return (trReal.value / modeSpec.value.trMaxNs) * 100
})

const trRatioOk = computed(() => Number.isFinite(trRatio.value) && trRatio.value <= 100)

const cbOverLimit = computed(() => Number.isFinite(cbPf.value) && cbPf.value > modeSpec.value.cbMaxPf)

// 总线电容估算
const estCap = computed(() => estimateBusCap(devCount.value, traceM.value))

const applyBusCap = () => {
  if (estCap.value !== null && estCap.value > 0) cbPf.value = Math.round(estCap.value * 10) / 10
}

// ---------- 当前 VDD 三档速览（同一组函数生成） ----------
const modeTable = Object.keys(SPEED_MODES).map(key => {
  const m = SPEED_MODES[key]
  const min = rpMinOhm(vdd.value, vol.value, m.iolMa)
  const maxK = rpMaxKohm(m.trMaxNs, cbPf.value)
  const max = maxK === null ? null : maxK * 1000
  const ok = min !== null && max !== null && max >= min
  return {
    key,
    label: m.label,
    min,
    max,
    ok,
    rec: ok ? recommendE24(min, max) : null
  }
})

// ---------- 静态参考表：VDD × 三档（Cb=100pF，同一组函数生成） ----------
const staticTable = [3.3, 5.0].reduce((rows, v) => {
  Object.keys(SPEED_MODES).forEach(key => {
    const m = SPEED_MODES[key]
    const min = rpMinOhm(v, 0.4, m.iolMa)
    const maxK = rpMaxKohm(m.trMaxNs, STATIC_CB_PF)
    const max = maxK === null ? null : maxK * 1000
    const ok = min !== null && max !== null && max >= min
    rows.push({
      vdd: v,
      key,
      label: m.shortLabel,
      min,
      max,
      rec: ok ? recommendE24(min, max) : null
    })
  })
  return rows
}, [])

// ---------- 设置持久化（localStorage，键前缀用工具 id） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (s.speedKey && Object.prototype.hasOwnProperty.call(SPEED_MODES, s.speedKey)) speedKey.value = s.speedKey
    if (Number.isFinite(s.vdd) && s.vdd > 0) vdd.value = s.vdd
    if (Number.isFinite(s.vol) && s.vol >= 0) vol.value = s.vol
    if (Number.isFinite(s.cbPf) && s.cbPf > 0) cbPf.value = s.cbPf
    if (Number.isFinite(s.devCount) && s.devCount >= 0) devCount.value = s.devCount
    if (Number.isFinite(s.traceM) && s.traceM >= 0) traceM.value = s.traceM
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([speedKey, vdd, vol, cbPf, devCount, traceM], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      speedKey: speedKey.value,
      vdd: vdd.value,
      vol: vol.value,
      cbPf: cbPf.value,
      devCount: devCount.value,
      traceM: traceM.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
