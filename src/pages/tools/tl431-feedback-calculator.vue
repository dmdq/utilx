<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sliders class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">稳压反馈电阻计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">TL431 分压电阻、LM317 输出电压、稳压管限流电阻三模式计算，E24/E96 吸附与实际输出回验</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        三种最常见的「电阻定输出电压」场景一站式计算：① TL431 可编程基准——输入目标 Vout 与下分压电阻 R2，按 Vout = Vref×(1+R1/R2) 求 R1，
        并给出 Ika≥1mA 口径下的 R2 取值校验；② LM317 三端稳压器——按 Vout = 1.25×(1+R2/R1) 求 R2，含最小负载电流与 R1 上限口径；
        ③ 稳压管限流电阻——R = (Vin−Vz)/(Iz+Iload)，校验限流电阻与稳压管功耗。三种模式统一「吸附 E24/E96 + 回验实际输出 + 偏差%」，
        全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        吸附口径：E24/E96 基准值按等比数列分布，最近档按对数（几何）距离取，同距取较低档；吸附后按实际档位回验输出电压并给出偏差%。
        基准口径：TL431 Vref 取 2.495 V（典型值，可切换 2.500 V），LM317 Vref 取 1.25 V；
        电阻功耗与偏置校验均为静态估算，批量精度取决于电阻容差与器件基准公差（TL431 分 ±0.5%/1%/2% 级）。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 模式切换 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="m in modes"
              :key="m.k"
              @click="mode = m.k"
              :class="mode === m.k ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2.5 rounded-lg text-sm font-medium transition-all"
            >{{ m.label }}</button>
          </div>

          <!-- E 系列吸附选择（三模式共用） -->
          <div class="flex items-center gap-2 text-xs">
            <span class="text-muted-foreground">电阻吸附系列：</span>
            <button
              v-for="s in ['E24', 'E96']"
              :key="s"
              @click="series = s"
              :class="series === s ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-2.5 py-1 rounded text-xs font-medium transition-all"
            >{{ s }}</button>
          </div>

          <!-- 模式①：TL431 -->
          <template v-if="mode === 'tl431'">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label for="tl-vout" class="block text-sm font-medium text-foreground mb-1.5">目标输出 Vout（V）</label>
                <input
                  id="tl-vout"
                  v-model.number="tlVout"
                  type="number"
                  min="0"
                  step="0.5"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 5"
                >
              </div>
              <div>
                <label for="tl-r2" class="block text-sm font-medium text-foreground mb-1.5">下分压电阻 R2（kΩ）</label>
                <input
                  id="tl-r2"
                  v-model.number="tlR2k"
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="默认 10"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">基准电压 Vref</label>
                <div class="grid grid-cols-2 gap-1.5">
                  <button
                    v-for="v in [2.495, 2.5]"
                    :key="v"
                    @click="tlVref = v"
                    :class="tlVref === v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                    class="py-2 rounded-lg text-sm font-mono font-medium transition-all"
                  >{{ v }} V</button>
                </div>
              </div>
            </div>

            <template v-if="tlResult">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="bg-muted/50 border border-border rounded-lg p-3">
                  <div class="text-xs text-muted-foreground mb-1">R1 精确值</div>
                  <div class="font-mono text-lg font-semibold text-foreground">{{ fmtOhm(tlResult.r1Exact) }}</div>
                </div>
                <div class="bg-green-500/5 border border-green-500/30 rounded-lg p-3">
                  <div class="text-xs text-muted-foreground mb-1">R1 吸附档位（{{ series }}）</div>
                  <div class="font-mono text-lg font-semibold text-green-600 dark:text-green-400">{{ fmtOhm(tlResult.r1Snap) }}</div>
                </div>
                <div class="bg-muted/50 border border-border rounded-lg p-3">
                  <div class="text-xs text-muted-foreground mb-1">实际输出 Vout</div>
                  <div class="font-mono text-lg font-semibold text-foreground">{{ fmtV(tlResult.voutAct) }}</div>
                </div>
                <div class="bg-muted/50 border border-border rounded-lg p-3">
                  <div class="text-xs text-muted-foreground mb-1">输出偏差</div>
                  <div class="font-mono text-lg font-semibold" :class="devClass(tlResult.dev)">{{ fmtDevPct(tlResult.dev) }}</div>
                </div>
              </div>

              <div class="bg-muted/50 border border-border rounded-lg p-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                <p>回验：Vout = {{ tlVref }} V × (1 + {{ fmtOhm(tlResult.r1Snap) }} / {{ fmtOhm(tlR2k * 1000) }}) = {{ fmtV(tlResult.voutAct) }}（R1 吸附偏差 {{ fmtDevPct(tlResult.r1Dev) }}）。</p>
                <p>分压器电流 I(R1+R2) = {{ fmtMa(tlResult.iDiv) }}，R2 支路电流 Vref/R2 = {{ fmtMa(tlResult.iR2) }}。</p>
                <p>
                  <CheckCircle v-if="tlResult.biasOk" class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-green-600 dark:text-green-400" />
                  <AlertTriangle v-else class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-yellow-600 dark:text-yellow-400" />
                  Ika ≥ 1 mA 口径：若分压器电流就是 TL431 阴极偏置的唯一来源，需 R2 ≤ Vref/1 mA = {{ fmtOhm(tlResult.r2MaxConservative) }}（当前 {{ fmtOhm(tlR2k * 1000) }}{{ tlResult.biasOk ? '，满足' : '，不满足' }}）。
                  R2 较大时需阴极另有 ≥1 mA 偏置能力（上拉电阻 / 光耦电流常见），仅需保证 Vref/R2 ≫ REF 输入漏电流（µA 级）即可可靠工作。
                </p>
              </div>

              <div class="flex justify-end">
                <button
                  @click="copyTl"
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
                >
                  <Copy class="w-3.5 h-3.5" /> 复制
                </button>
              </div>
            </template>
            <div v-else class="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
              输入高于 Vref（{{ tlVref }} V）的目标输出与 R2，计算上分压电阻 R1
            </div>
          </template>

          <!-- 模式②：LM317 -->
          <template v-else-if="mode === 'lm317'">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="lm-vout" class="block text-sm font-medium text-foreground mb-1.5">目标输出 Vout（V）</label>
                <input
                  id="lm-vout"
                  v-model.number="lmVout"
                  type="number"
                  min="0"
                  step="0.5"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 5"
                >
              </div>
              <div>
                <label for="lm-r1" class="block text-sm font-medium text-foreground mb-1.5">R1（Ω，OUT–ADJ）</label>
                <input
                  id="lm-r1"
                  v-model.number="lmR1"
                  type="number"
                  min="0"
                  step="10"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="默认 240"
                >
              </div>
            </div>

            <template v-if="lmResult">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="bg-muted/50 border border-border rounded-lg p-3">
                  <div class="text-xs text-muted-foreground mb-1">R2 精确值</div>
                  <div class="font-mono text-lg font-semibold text-foreground">{{ fmtOhm(lmResult.r2Exact) }}</div>
                </div>
                <div class="bg-green-500/5 border border-green-500/30 rounded-lg p-3">
                  <div class="text-xs text-muted-foreground mb-1">R2 吸附档位（{{ series }}）</div>
                  <div class="font-mono text-lg font-semibold text-green-600 dark:text-green-400">{{ fmtOhm(lmResult.r2Snap) }}</div>
                </div>
                <div class="bg-muted/50 border border-border rounded-lg p-3">
                  <div class="text-xs text-muted-foreground mb-1">实际输出 Vout</div>
                  <div class="font-mono text-lg font-semibold text-foreground">{{ fmtV(lmResult.voutAct) }}</div>
                </div>
                <div class="bg-muted/50 border border-border rounded-lg p-3">
                  <div class="text-xs text-muted-foreground mb-1">输出偏差</div>
                  <div class="font-mono text-lg font-semibold" :class="devClass(lmResult.dev)">{{ fmtDevPct(lmResult.dev) }}</div>
                </div>
              </div>

              <div class="bg-muted/50 border border-border rounded-lg p-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                <p>回验：Vout = 1.25 V × (1 + {{ fmtOhm(lmResult.r2Snap) }} / {{ fmtOhm(lmR1) }}) = {{ fmtV(lmResult.voutAct) }}（R2 吸附偏差 {{ fmtDevPct(lmResult.r2Dev) }}）。</p>
                <p>
                  <CheckCircle v-if="lmResult.r1Ok" class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-green-600 dark:text-green-400" />
                  <AlertTriangle v-else class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-yellow-600 dark:text-yellow-400" />
                  最小负载电流口径：R1 上电流 = 1.25 V / R1 = {{ fmtMa(lmResult.iR1) }}。R1 ≤ 240 Ω 时 ≥5.2 mA（覆盖典型 3.5~5 mA 口径）；
                  若按 10 mA 最坏口径选型，R1 上限为 125 Ω。当前 R1 = {{ fmtOhm(lmR1) }}{{ lmResult.r1Ok ? '，满足 240 Ω 口径' : '，大于 240 Ω，轻载时输出可能上飘' }}。
                </p>
                <p>R2 功耗 ≈ (Vout − 1.25 V)² / R2，选型时按 1/8 W 以上留余量即可（电流仅 mA 级）。</p>
              </div>

              <div class="flex justify-end">
                <button
                  @click="copyLm"
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
                >
                  <Copy class="w-3.5 h-3.5" /> 复制
                </button>
              </div>
            </template>
            <div v-else class="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
              输入高于 1.25 V 的目标输出与 R1，计算 ADJ 下地电阻 R2
            </div>
          </template>

          <!-- 模式③：稳压管限流 -->
          <template v-else>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label for="z-vin" class="block text-sm font-medium text-foreground mb-1.5">输入 Vin（V）</label>
                <input
                  id="z-vin"
                  v-model.number="zVin"
                  type="number"
                  min="0"
                  step="0.5"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 12"
                >
              </div>
              <div>
                <label for="z-vz" class="block text-sm font-medium text-foreground mb-1.5">稳压值 Vz（V）</label>
                <input
                  id="z-vz"
                  v-model.number="zVz"
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 5.1"
                >
              </div>
              <div>
                <label for="z-iz" class="block text-sm font-medium text-foreground mb-1.5">目标 Iz（mA）</label>
                <input
                  id="z-iz"
                  v-model.number="zIz"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="默认 5"
                >
              </div>
              <div>
                <label for="z-il" class="block text-sm font-medium text-foreground mb-1.5">负载 Iload（mA）</label>
                <input
                  id="z-il"
                  v-model.number="zIload"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 10"
                >
              </div>
            </div>

            <template v-if="zenerResult">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="bg-muted/50 border border-border rounded-lg p-3">
                  <div class="text-xs text-muted-foreground mb-1">限流电阻 R</div>
                  <div class="font-mono text-lg font-semibold text-foreground">{{ fmtOhm(zenerResult.rExact) }}</div>
                  <div class="text-xs text-muted-foreground mt-0.5">吸附 {{ series }} {{ fmtOhm(zenerResult.rSnap) }}（{{ fmtDevPct(zenerResult.rDev) }}）</div>
                </div>
                <div class="bg-muted/50 border border-border rounded-lg p-3">
                  <div class="text-xs text-muted-foreground mb-1">电阻功耗 PR</div>
                  <div class="font-mono text-lg font-semibold text-foreground">{{ fmtW(zenerResult.pr) }}</div>
                  <div class="text-xs text-muted-foreground mt-0.5">建议额定 ≥ {{ powerRating(zenerResult.pr) }}</div>
                </div>
                <div class="bg-muted/50 border border-border rounded-lg p-3">
                  <div class="text-xs text-muted-foreground mb-1">稳压管功耗（空载最坏）</div>
                  <div class="font-mono text-lg font-semibold text-foreground">{{ fmtW(zenerResult.pzWorst) }}</div>
                  <div class="text-xs text-muted-foreground mt-0.5">满载 {{ fmtW(zenerResult.pzFull) }}</div>
                </div>
                <div class="bg-muted/50 border border-border rounded-lg p-3">
                  <div class="text-xs text-muted-foreground mb-1">实际电流</div>
                  <div class="font-mono text-lg font-semibold text-foreground">总 {{ fmtMa(zenerResult.itot) }}</div>
                  <div class="text-xs text-muted-foreground mt-0.5">满载管流 {{ fmtMa(zenerResult.izFull) }}</div>
                </div>
              </div>

              <div class="bg-muted/50 border border-border rounded-lg p-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                <p>回验：R = ({{ zVin }} V − {{ zVz }} V) / ({{ fmtMa(zIz / 1000) }} + {{ fmtMa(zIload / 1000) }}) = {{ fmtOhm(zenerResult.rExact) }}，吸附 {{ series }} 后 I(总) = {{ fmtMa(zenerResult.itot) }}。</p>
                <p>
                  <CheckCircle v-if="zenerResult.izFullOk" class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-green-600 dark:text-green-400" />
                  <AlertTriangle v-else class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-red-600 dark:text-red-400" />
                  满载时稳压管电流 {{ fmtMa(zenerResult.izFull) }}{{ zenerResult.izFullOk ? '（保持调整能力，空载时全部电流流过稳压管，功耗见上）' : '：吸附档位偏大导致满载时管流耗尽，需减小 R 或加大目标 Iz' }}。
                </p>
                <p>功耗校验口径：PR = (Vin−Vz)²/R；稳压管最坏功耗出现在空载（Pz = Vz × I(总)），建议额定档位 ≥ 2× 实际功耗；本工具按 0.25 W / 0.5 W / 1 W 常用额定档提示。</p>
              </div>

              <div class="flex justify-end">
                <button
                  @click="copyZener"
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
                >
                  <Copy class="w-3.5 h-3.5" /> 复制
                </button>
              </div>
            </template>
            <div v-else class="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
              输入高于 Vz 的输入电压、目标管流与负载电流，计算限流电阻与功耗
            </div>
          </template>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <Lightbulb class="w-4 h-4 mr-2 text-primary" /> 使用要点
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2 leading-relaxed list-disc pl-4">
            <li>取样 / 反馈分压优先 E96 + 0.1% 精度：TL431 基准公差 ±0.5~2% 已占去大半预算，电阻别再引入 ±5% 误差。</li>
            <li>输出偏高换小一档 R1（TL431）/ R2（LM317），偏低换大一档；微调用一只大电阻并联在分压臂上精调。</li>
            <li>稳压管限流电阻的额定功率按 ≥2×PR 选，空载工况下稳压管功耗最大，校额定值时别只看满载。</li>
            <li>LM317 的 R1 取 240 Ω（或 125 Ω 最坏口径）是「让最小负载电流达标」的设计，不要随意加大 R1。</li>
          </ul>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <CheckCircle class="w-4 h-4 mr-2 text-primary" /> 口径与自检锚点
          </h3>
          <ul class="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <li>• Vout 5 V、R2 10 kΩ、Vref 2.495 V → R1 = 10.040 kΩ → E96 10.0 kΩ → 实际 4.99 V（−0.20%）</li>
            <li>• Vout 12 V、R2 10 kΩ → R1 = 38.096 kΩ → E96 38.3 kΩ → 12.05 V（+0.42%）</li>
            <li>• LM317 5 V、R1 240 Ω → R2 = 720 Ω → E24 750 Ω → 5.16 V（+3.13%）；E96 715 Ω → 4.97 V（−0.52%）</li>
            <li>• 稳压管 12→5.1 V、Iz 5 mA + 负载 10 mA → R = 460 Ω → E24 470 Ω → PR = 0.101 W</li>
            <li>• 吸附策略：对数距离最近档，同距取低档</li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>TL431 内部是什么结构？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          TL431 是「可编程并联基准 / 误差放大器」，三个引脚为阴极 K、阳极 A、参考端 REF。内部由三部分组成：
          约 2.495 V 的带隙基准（2.5 V 标称留出制造余量的典型值口径）、把 REF 分压点与基准比较的误差放大器、
          以及受放大器驱动的输出三极管（集电极即阴极 K、发射极即阳极 A）。当 REF 电压高于 2.495 V 时三极管导通加剧、
          阴极电流增大，把 REF 拉回基准值——闭环下 REF 恒等于 Vref，于是分压比就「编程」了输出电压：
          Vout = Vref × (1 + R1/R2)。它不是一只稳压二极管，而是一个带精密基准的小型控制系统，
          这也是它比普通稳压管精度高、温漂低一个量级的原因。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>为什么 R2 常取 10 kΩ？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          R2 取 10 kΩ 时，R2 支路电流 Vref/R2 ≈ 0.25 mA：一方面远大于 REF 端 µA 级的输入漏电流，
          分压点不受漏电与噪声扰动（阻值太大时 PCB 受潮漏电阻会明显干扰取样点）；另一方面又不过分耗电。
          「偏置口径」要分两种情况：若 TL431 阴极偏置全部经分压器提供（最简单的并联稳压接法），
          需满足 Ika ≥ 1 mA，即 R2 ≤ Vref/1 mA ≈ 2.5 kΩ；而开关电源反馈、光耦偏置等阴极另有供电通路的场景，
          分压器只需满足「远大于漏电流」的口径，10 kΩ 是精度与功耗的平衡点，也是资料中最常见的取值。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>LM317 的最小负载电流与 R1 口径</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          LM317 的调整端 ADJ 电流约 50 µA，输出电压 = 1.25 V × (1 + R2/R1)。数据手册规定器件有 3.5~10 mA 的最小负载电流
          （维持调整能力的最低工作点），经典做法是让 R1 自身流过足够电流来兜底：R1 = 1.25 V / 240 Ω ≈ 5.2 mA，
          覆盖典型 3.5~5 mA 口径——这就是「R1 上限 240 Ω」的来历；部分厂商按 10 mA 最坏规格要求 R1 ≤ 125 Ω。
          R1 一旦超过上限，轻载（负载断开）时输出会向上飘，稳压失效；用 125 Ω 的代价是 R1 功耗增大
          （如输出 10 V 时 1.25 V/125 Ω 支路恒耗约 12.5 mW × Vout 倍数关系，需按 1/4 W 以上选取）。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>稳压管与 TL431 / LM317 的精度差异</h2>
        <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground leading-relaxed mb-4">
          <li><span class="text-foreground font-medium">稳压管（齐纳）：</span>±2~5% 初始公差，动态电阻大（电流变化输出跟着变），小电流段温度系数可能为负、大电流段转正，5~6 V 附近温漂最小；适合基准不敏感的钳位、保护与粗稳压。</li>
          <li><span class="text-foreground font-medium">TL431：</span>基准公差 ±0.5%（精密级）~±2%，温漂约 50 ppm/℃ 量级，闭环工作不受动态电阻拖累；输出精度主要由基准公差 + 分压电阻容差决定，选 0.1% 电阻可做到 ±1% 以内。</li>
          <li><span class="text-foreground font-medium">LM317：</span>基准 1.25 V 公差约 ±1%~±4%（分等级），加上电阻容差后整体输出精度 ±2~4% 量级；胜在耐久、便宜、输出电流大，适合电源粗调而非精密基准。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>光耦反馈场景一句话</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          隔离电源（反激 / 正激）中，副级用 TL431 对输出分压取样，误差放大后直接驱动光耦 LED，
          光耦三极管把误差电流传回原边控制芯片（如 384x / 反激控制器）的反馈脚——「TL431 + 光耦」就是跨初次级隔离壁垒的标准恒压环，
          此时 R2 取 10 kΩ 量级、TL431 的偏置由光耦支路与偏置电阻共同保证。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">TL431 分压电阻怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              Vout = Vref × (1 + R1/R2)，Vref 取 2.495 V。先定 R2（常用 10 kΩ），再算 R1 = R2 × (Vout/Vref − 1)。
              例：目标 5 V、R2 = 10 kΩ → R1 = 10.040 kΩ，吸附 E96 最近档 10.0 kΩ，实际输出 4.99 V（−0.20%）。
              阴极偏置全靠分压器供电时还需 R2 ≤ 2.5 kΩ（Ika ≥ 1 mA 口径）。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">LM317 输出 5 V 时 R2 取多少？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              R2 = R1 × (Vout/1.25 − 1)。R1 = 240 Ω 时输出 5 V 需 R2 = 720 Ω：E24 最近 750 Ω（实际 5.16 V，+3.13%），
              E96 最近 715 Ω（实际 4.97 V，−0.52%），对精度有要求选 E96 档或用 720 Ω 精密电阻。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">稳压管限流电阻的功率怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              电阻功耗 PR = (Vin − Vz)²/R，额定档按 ≥2×PR 选（0.25 W / 0.5 W / 1 W）；
              稳压管自身最坏功耗在空载时出现，Pz = Vz × (Vin − Vz)/R，同样按 ≥2× 校核额定值。
              例：12 V → 5.1 V、管流目标 5 mA + 负载 10 mA → R = 460 Ω → E24 470 Ω，PR ≈ 0.101 W（0.25 W 档可用）。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">TL431 输出比目标偏高 / 偏低怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              先看吸附偏差方向：偏高说明 R1 吸附档偏大，换小一档或与一只大电阻并联微调（如 R1 上并 1 MΩ 量级）；
              偏低反之在 R2 上并联大电阻。若偏差超过 ±2%，检查 Vref 取值（2.495 vs 2.5）、电阻容差等级与 R2 偏置口径是否满足。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'tl431-feedback-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Sliders, Info, Lightbulb, CheckCircle, Link as LinkIcon,
  ChevronUp, ChevronDown, Copy, AlertTriangle
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'tl431-feedback-calculator'
const STORAGE_KEY = 'tl431-feedback-calculator.inputs'

// SEO
useSeoMeta({
  title: '稳压反馈电阻计算器 - TL431/LM317/稳压管三模式与 E24/E96 吸附回验',
  description: '在线稳压反馈电阻计算工具：TL431 分压电阻（Vref 2.495V/2.5V）、LM317 输出电压（R1 240Ω 口径）、稳压管限流电阻三模式计算，E24/E96 最近档吸附、实际输出回验与偏差%，含 Ika≥1mA 与功耗额定档校验，纯本地计算',
  keywords: 'tl431分压电阻, lm317输出电压计算, lm317电阻计算, 稳压管限流电阻, 反馈电阻计算, tl431 calculator, lm317 resistor calculator, 齐纳限流电阻',
  author: 'Util工具箱',
  ogTitle: '稳压反馈电阻计算器 - 有条工具',
  ogDescription: 'TL431/LM317/稳压管三模式反馈电阻计算，E24/E96 吸附与实际输出回验',
  ogUrl: 'https://www.util.cn/tools/tl431-feedback-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '稳压反馈电阻计算器',
  twitterDescription: 'TL431 分压电阻、LM317 输出电压、稳压管限流电阻三模式计算'
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
          name: '稳压反馈电阻计算器',
          url: 'https://www.util.cn/tools/tl431-feedback-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'TL431 分压电阻计算（Vref 2.495V/2.5V 可切）',
            'LM317 输出电压计算（R1 240Ω/125Ω 口径）',
            '稳压管限流电阻与功耗校验',
            'E24/E96 最近档吸附与实际输出回验',
            'Ika≥1mA 偏置口径与额定功率提示'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '稳压反馈电阻计算器', item: 'https://www.util.cn/tools/tl431-feedback-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'TL431 分压电阻怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: 'Vout = Vref × (1 + R1/R2)，Vref 取 2.495 V；R2 常取 10 kΩ，R1 = R2 × (Vout/Vref − 1)。例：目标 5 V、R2 = 10 kΩ → R1 = 10.040 kΩ，取 E96 10.0 kΩ 实际输出 4.99 V。' }
            },
            {
              '@type': 'Question',
              name: 'LM317 输出 5 V 时 R2 取多少？',
              acceptedAnswer: { '@type': 'Answer', text: 'R2 = R1 × (Vout/1.25 − 1)；R1 = 240 Ω 时需 R2 = 720 Ω，E24 最近 750 Ω（实际 5.16 V），E96 最近 715 Ω（实际 4.97 V）。' }
            },
            {
              '@type': 'Question',
              name: '稳压管限流电阻的功率怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: 'PR = (Vin − Vz)²/R，额定按 ≥2×PR 选；稳压管最坏功耗出现在空载，Pz = Vz × (Vin − Vz)/R，同样按 ≥2× 校核 0.25 W / 0.5 W / 1 W 额定档。' }
            },
            {
              '@type': 'Question',
              name: 'TL431 和稳压管哪个精度高？',
              acceptedAnswer: { '@type': 'Answer', text: 'TL431 基准公差 ±0.5~2%、温漂约 50 ppm/℃ 且闭环工作，精度远高于 ±2~5%、动态电阻大的普通稳压管；输出精度主要由基准公差与分压电阻容差决定。' }
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
      if (typeof s.mode === 'string') mode.value = s.mode
      if (typeof s.series === 'string') series.value = s.series
      if (typeof s.tlVout === 'number') tlVout.value = s.tlVout
      if (typeof s.tlR2k === 'number') tlR2k.value = s.tlR2k
      if (typeof s.tlVref === 'number') tlVref.value = s.tlVref
      if (typeof s.lmVout === 'number') lmVout.value = s.lmVout
      if (typeof s.lmR1 === 'number') lmR1.value = s.lmR1
      if (typeof s.zVin === 'number') zVin.value = s.zVin
      if (typeof s.zVz === 'number') zVz.value = s.zVz
      if (typeof s.zIz === 'number') zIz.value = s.zIz
      if (typeof s.zIload === 'number') zIload.value = s.zIload
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})

// __PURE_FNS_START__
// ---------- IEC 60063 基准表（每 decade，×10ⁿ 跨档复用） ----------
const E24 = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91]
const E96 = [10, 10.2, 10.5, 10.7, 11, 11.3, 11.5, 11.8, 12.1, 12.4, 12.7, 13, 13.3, 13.7, 14, 14.3, 14.7, 15, 15.4, 15.8, 16.2, 16.5, 16.9, 17.4, 17.8, 18.2, 18.7, 19.1, 19.6, 20, 20.5, 21, 21.5, 22.1, 22.6, 23.2, 23.7, 24.3, 24.9, 25.5, 26.1, 26.7, 27.4, 28, 28.7, 29.4, 30.1, 30.9, 31.6, 32.4, 33.2, 34, 34.8, 35.7, 36.5, 37.4, 38.3, 39.2, 40.2, 41.2, 42.2, 43.2, 44.2, 45.3, 46.4, 47.5, 48.7, 49.9, 51.1, 52.3, 53.6, 54.9, 56.2, 57.6, 59, 60.4, 61.9, 63.4, 64.9, 66.5, 68.1, 69.8, 71.5, 73.2, 75, 76.8, 78.7, 80.6, 82.5, 84.5, 86.6, 88.7, 90.9, 93.1, 95.3, 97.6]

const SERIES_TABLES = { E24, E96 }
const DECADE_MIN = -3
const DECADE_MAX = 7

// 浮点清理（46.4×10 → 464）
const norm = (v) => Number(v.toPrecision(12))

// 最近标准值：E 系列为等比数列，按对数（几何）距离取最近，同距取较低档
const snapSeries = (series, target) => {
  const base = SERIES_TABLES[series] || E96
  let best = null
  let bestDist = Infinity
  for (let k = DECADE_MIN; k <= DECADE_MAX; k++) {
    const f = Math.pow(10, k)
    for (const m of base) {
      const v = norm(m * f)
      const dist = Math.abs(Math.log(v / target))
      if (dist < bestDist) {
        best = v
        bestDist = dist
      }
    }
  }
  return best
}

// ---------- 三模式公式 ----------
// TL431：Vout = Vref × (1 + R1/R2)
const tl431R1 = (vout, r2, vref) => r2 * (vout / vref - 1)
const tl431Vout = (r1, r2, vref) => vref * (1 + r1 / r2)
// LM317：Vout = Vref × (1 + R2/R1)
const lm317R2 = (vout, r1, vref) => r1 * (vout / vref - 1)
const lm317Vout = (r1, r2, vref) => vref * (1 + r2 / r1)
// 稳压管限流：R = (Vin − Vz)/(Iz + Iload)
const zenerR = (vin, vz, iz, iload) => (vin - vz) / (iz + iload)
const zenerPr = (vin, vz, r) => Math.pow(vin - vz, 2) / r
// 稳压管功耗：空载最坏 Pz = Vz × (Vin − Vz)/R；满载 Pz = Vz × ((Vin − Vz)/R − Iload)
const zenerPzWorst = (vin, vz, r) => vz * (vin - vz) / r
const zenerPzFull = (vin, vz, r, iload) => vz * ((vin - vz) / r - iload)

// ---------- 展示格式化（避免浮点尾差） ----------
const trimZeros = (s) => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s)
const fmtOhm = (v) => {
  if (!isFinite(v) || v <= 0) return '—'
  if (v >= 1e6) return trimZeros((v / 1e6).toPrecision(4)) + ' MΩ'
  if (v >= 1e3) return trimZeros((v / 1e3).toPrecision(4)) + ' kΩ'
  return trimZeros(v.toPrecision(4)) + ' Ω'
}
const fmtV = (v) => (!isFinite(v) ? '—' : trimZeros(v.toPrecision(4)) + ' V')
const fmtMa = (a) => {
  if (!isFinite(a)) return '—'
  if (a >= 1e-3) return trimZeros((a * 1000).toPrecision(3)) + ' mA'
  return trimZeros((a * 1e6).toPrecision(3)) + ' µA'
}
const fmtW = (p) => {
  if (!isFinite(p)) return '—'
  if (p >= 0.1) return trimZeros(p.toPrecision(3)) + ' W'
  return trimZeros((p * 1000).toPrecision(3)) + ' mW'
}
const fmtDevPct = (dev) => (dev >= 0 ? '+' : '') + (dev * 100).toFixed(2) + '%'
const devClass = (dev) => {
  const abs = Math.abs(dev) * 100
  if (abs <= 1) return 'text-green-600 dark:text-green-400'
  if (abs <= 5) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}
// 额定功率档提示（建议额定 ≥ 2× 实际功耗）
const powerRating = (p) => {
  if (!(p > 0)) return '—'
  if (p <= 0.125) return '0.25 W'
  if (p <= 0.25) return '0.5 W'
  return '1 W 及以上'
}
// __PURE_FNS_END__

// ---------- 状态 ----------
const modes = [
  { k: 'tl431', label: 'TL431 分压' },
  { k: 'lm317', label: 'LM317 输出' },
  { k: 'zener', label: '稳压管限流' }
]

const mode = ref('tl431')
const series = ref('E96')

const tlVref = ref(2.495)
const tlVout = ref(5)
const tlR2k = ref(10)

const lmVout = ref(5)
const lmR1 = ref(240)

const zVin = ref(12)
const zVz = ref(5.1)
const zIz = ref(5)     // mA
const zIload = ref(10) // mA

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 输入持久化（键前缀为工具 id）
watch([mode, series, tlVref, tlVout, tlR2k, lmVout, lmR1, zVin, zVz, zIz, zIload], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: mode.value,
      series: series.value,
      tlVref: tlVref.value,
      tlVout: tlVout.value,
      tlR2k: tlR2k.value,
      lmVout: lmVout.value,
      lmR1: lmR1.value,
      zVin: zVin.value,
      zVz: zVz.value,
      zIz: zIz.value,
      zIload: zIload.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
})

// ---------- 模式①：TL431 ----------
const tlResult = computed(() => {
  const vref = Number(tlVref.value)
  const vout = Number(tlVout.value)
  const r2 = Number(tlR2k.value) * 1000
  if (!(vref > 0) || !(r2 > 0) || !(vout > vref)) return null
  const r1Exact = tl431R1(vout, r2, vref)
  const r1Snap = snapSeries(series.value, r1Exact)
  const voutAct = tl431Vout(r1Snap, r2, vref)
  const iR2 = vref / r2
  return {
    r1Exact,
    r1Snap,
    voutAct,
    dev: voutAct / vout - 1,
    r1Dev: r1Snap / r1Exact - 1,
    iDiv: voutAct / (r1Snap + r2),
    iR2,
    r2MaxConservative: vref / 0.001,
    biasOk: iR2 >= 0.001
  }
})

// ---------- 模式②：LM317 ----------
const lmResult = computed(() => {
  const vout = Number(lmVout.value)
  const r1 = Number(lmR1.value)
  if (!(r1 > 0) || !(vout > 1.25)) return null
  const r2Exact = lm317R2(vout, r1, 1.25)
  const r2Snap = snapSeries(series.value, r2Exact)
  const voutAct = lm317Vout(r1, r2Snap, 1.25)
  return {
    r2Exact,
    r2Snap,
    voutAct,
    dev: voutAct / vout - 1,
    r2Dev: r2Snap / r2Exact - 1,
    iR1: 1.25 / r1,
    r1Ok: r1 <= 240
  }
})

// ---------- 模式③：稳压管限流 ----------
const zenerResult = computed(() => {
  const vin = Number(zVin.value)
  const vz = Number(zVz.value)
  const iz = Number(zIz.value) / 1000
  const il = Number(zIload.value) / 1000
  if (!(vin > vz) || !(vz > 0) || !(iz + il > 0)) return null
  const rExact = zenerR(vin, vz, iz, il)
  const rSnap = snapSeries(series.value, rExact)
  const itot = (vin - vz) / rSnap
  const izFull = itot - il
  return {
    rExact,
    rSnap,
    rDev: rSnap / rExact - 1,
    itot,
    izFull,
    izFullOk: izFull > 0,
    pr: zenerPr(vin, vz, rSnap),
    pzWorst: zenerPzWorst(vin, vz, rSnap),
    pzFull: Math.max(zenerPzFull(vin, vz, rSnap, il), 0)
  }
})

// ---------- 复制结果（clipboard + alert） ----------
const copyText = (text) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制计算结果到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动选择文本复制')
    })
  } else {
    alert('当前环境不支持剪贴板，请手动选择文本复制')
  }
}
const copyTl = () => {
  const r = tlResult.value
  if (!r) return
  copyText(`TL431 反馈电阻：Vout=${tlVout.value}V、R2=${fmtOhm(Number(tlR2k.value) * 1000)}、Vref=${tlVref.value}V → R1 精确 ${fmtOhm(r.r1Exact)}，${series.value} 吸附 ${fmtOhm(r.r1Snap)}，实际输出 ${fmtV(r.voutAct)}（${fmtDevPct(r.dev)}），I(R2)=${fmtMa(r.iR2)}`)
}
const copyLm = () => {
  const r = lmResult.value
  if (!r) return
  copyText(`LM317 输出设定：Vout=${lmVout.value}V、R1=${fmtOhm(Number(lmR1.value))} → R2 精确 ${fmtOhm(r.r2Exact)}，${series.value} 吸附 ${fmtOhm(r.r2Snap)}，实际输出 ${fmtV(r.voutAct)}（${fmtDevPct(r.dev)}）`)
}
const copyZener = () => {
  const r = zenerResult.value
  if (!r) return
  copyText(`稳压管限流电阻：Vin=${zVin.value}V、Vz=${zVz.value}V、Iz=${zIz.value}mA、Iload=${zIload.value}mA → R 精确 ${fmtOhm(r.rExact)}，${series.value} 吸附 ${fmtOhm(r.rSnap)}，PR=${fmtW(r.pr)}（建议额定 ≥${powerRating(r.pr)}），空载 Pz=${fmtW(r.pzWorst)}`)
}

// ---------- 相关工具 ----------
const relatedLinks = computed(() => ['eseries-resistor-finder', 'opamp-gain-calculator', 'ohms-law-calculator']
  .map((id) => tools.find((t) => t.id === id))
  .filter(Boolean))
</script>
