<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Layers class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">铜厚与线规换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">PCB 铜厚 oz / mil / mm / µm 四向换算、基铜与成品铜口径对照、AWG 线规全表与铜厚×线宽载流速查</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        四个模块一站式覆盖铜厚与线规选型：① oz / mil / mm / µm 任意输入四向联动换算，0.5~4 oz 常用档位整表；
        ② 基铜（lamination）→ 成品铜（finished）估算，电镀加厚、HAL 喷锡、表面处理增量口径可选；
        ③ AWG 4/0~40 完整线规表（直径、截面积、每 km 电阻、裸铜载流经验值），按标准 AWG 定义生成并过锚点自检；
        ④ 「1 oz / 40 mil ≈ 1 A」经验法则下 1 A / 3 A / 5 A 建议线宽速查，附 IPC-2221 外层 10℃ 温升对照。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        锚点口径：1 oz 铜铺满 1 ft² 的厚度，本工具取工程惯例值 <span class="font-mono text-foreground">34.8 µm = 1.37 mil</span>（两值自洽，偏差 0.006%），
        2.5 oz → 87 µm 与常用工程口径一致；IPC-4562 箔材厚度表对 1 oz 电解铜箔给出的最低厚度口径约 34.3 µm，做精确阻抗计算时请以板厂层叠表为准。
        AWG 直径按标准定义 d(inch) = 0.005 × 92^((36−n)/39) 生成，AWG 10 / 20 / 40 三个锚点与公布值偏差均 &lt; 0.05%。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 模块①：四向换算 + 档位表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ArrowLeftRight class="w-5 h-5 mr-2 text-primary" /> 铜厚四向换算（oz ↔ mil ↔ mm ↔ µm）
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="copper-val" class="block text-sm font-medium text-foreground mb-1.5">铜厚数值</label>
              <input
                id="copper-val"
                v-model.number="convVal"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 1"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">输入单位</label>
              <div class="grid grid-cols-4 gap-1.5">
                <button
                  v-for="u in convUnits"
                  :key="u.k"
                  @click="convUnit = u.k"
                  :class="convUnit === u.k ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-sm font-medium transition-all"
                >{{ u.label }}</button>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="text-muted-foreground">示例：</span>
            <button @click="fillConv(0.5, 'oz')" class="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition">0.5 oz</button>
            <button @click="fillConv(1, 'oz')" class="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition">1 oz</button>
            <button @click="fillConv(2, 'oz')" class="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition">2 oz</button>
            <button @click="fillConv(35, 'um')" class="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition">35 µm</button>
          </div>

          <template v-if="convValid">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div v-for="u in convUnits" :key="u.k" class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">{{ u.label }}</div>
                <div class="font-mono text-lg font-semibold text-foreground break-all">{{ fmtSig(convRows[u.k], 4) }}</div>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              换算链以 µm 为基准：1 oz = 34.8 µm（工程惯例锚点），mil / mm 按 1 mil = 25.4 µm 精确换算，无中间舍入误差。
            </p>
          </template>
          <div v-else class="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            输入大于 0 的铜厚数值，四向联动换算
          </div>

          <!-- 常用档位整表 -->
          <div class="pt-2">
            <h3 class="text-sm font-semibold text-foreground mb-2">常用铜厚档位整表（0.5 ~ 4 oz）</h3>
            <div class="border border-border rounded-lg overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-muted/50 text-xs font-medium text-muted-foreground">
                    <th class="px-3 py-2 text-left">铜厚（oz）</th>
                    <th class="px-3 py-2 text-right">µm</th>
                    <th class="px-3 py-2 text-right">mm</th>
                    <th class="px-3 py-2 text-right">mil</th>
                    <th class="px-3 py-2 text-right hidden sm:table-cell">口径</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in ozStepRows" :key="row.oz" class="border-t border-border/50">
                    <td class="px-3 py-2 font-mono font-medium text-foreground">{{ row.oz }} oz</td>
                    <td class="px-3 py-2 text-right font-mono text-foreground">{{ fmtSig(row.um, 4) }}</td>
                    <td class="px-3 py-2 text-right font-mono text-foreground">{{ fmtSig(row.mm, 4) }}</td>
                    <td class="px-3 py-2 text-right font-mono text-foreground">{{ fmtSig(row.mil, 3) }}</td>
                    <td class="px-3 py-2 text-right text-xs text-muted-foreground hidden sm:table-cell">{{ row.note }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 模块②：基铜 → 成品铜 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 基铜 → 成品铜估算
          </h2>
          <p class="text-xs leading-relaxed text-muted-foreground">
            基铜（基材压合前的光箔）与成品铜（蚀刻后线路的实际铜厚）的差值来自外层电镀加厚与表面处理镀层。
            内层线路无电镀加厚，成品铜厚 ≈ 基铜；外层按下方口径估算。
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="copper-base" class="block text-sm font-medium text-foreground mb-1.5">基铜厚度（oz）</label>
              <input
                id="copper-base"
                v-model.number="baseOz"
                type="number"
                min="0"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 1"
              >
              <div class="flex flex-wrap gap-1.5 mt-2">
                <button
                  v-for="s in OZ_STEPS"
                  :key="s"
                  @click="baseOz = s"
                  :class="baseOz === s ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-2 py-1 rounded text-xs font-medium transition-all"
                >{{ s }} oz</button>
              </div>
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-medium text-foreground">工艺增量（通用参考，以各厂工艺为准）</label>
              <label class="flex items-center gap-2 text-sm text-muted-foreground">
                <input v-model="usePlating" type="checkbox" class="w-4 h-4 rounded border border-border">
                图形电镀加厚 +20~40%（相对基铜）
              </label>
              <label class="flex items-center gap-2 text-sm text-muted-foreground">
                <input v-model="useHal" type="checkbox" class="w-4 h-4 rounded border border-border">
                HAL 喷锡 +15~20 µm
              </label>
              <label class="flex items-center gap-2 text-sm text-muted-foreground">
                <input v-model="useImmersion" type="checkbox" class="w-4 h-4 rounded border border-border">
                沉铜 / 化学表面处理 +5 µm 量级
              </label>
            </div>
          </div>

          <template v-if="finished">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">基铜</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ fmtSig(finished.baseUm, 4) }} <span class="text-xs font-normal">µm</span></div>
                <div class="text-xs text-muted-foreground mt-0.5">≈ {{ fmtSig(finished.baseUm / OZ_TO_UM, 3) }} oz</div>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">成品下限</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ fmtSig(finished.low, 4) }} <span class="text-xs font-normal">µm</span></div>
                <div class="text-xs text-muted-foreground mt-0.5">≈ {{ fmtSig(finished.low / OZ_TO_UM, 3) }} oz</div>
              </div>
              <div class="bg-green-500/5 border border-green-500/30 rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">成品典型（中值）</div>
                <div class="font-mono text-lg font-semibold text-green-600 dark:text-green-400">{{ fmtSig(finished.mid, 4) }} <span class="text-xs font-normal">µm</span></div>
                <div class="text-xs text-muted-foreground mt-0.5">≈ {{ fmtSig(finished.mid / OZ_TO_UM, 3) }} oz</div>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">成品上限</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ fmtSig(finished.high, 4) }} <span class="text-xs font-normal">µm</span></div>
                <div class="text-xs text-muted-foreground mt-0.5">≈ {{ fmtSig(finished.high / OZ_TO_UM, 3) }} oz</div>
              </div>
            </div>
            <p class="text-xs leading-relaxed text-muted-foreground bg-muted/50 border border-border rounded-lg p-2.5">
              <AlertTriangle class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-primary" />
              {{ finishedNote }}
            </p>
          </template>
          <div v-else class="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            输入基铜厚度（oz）并勾选工艺增量，估算成品铜厚范围
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <Lightbulb class="w-4 h-4 mr-2 text-primary" /> 使用要点
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2 leading-relaxed list-disc pl-4">
            <li>算载流用成品铜厚（外层 = 基铜 ×1.2~1.4 + 镀层增量；内层 ≈ 基铜），算阻抗用板厂层叠表的成品口径，别拿基铜直接套。</li>
            <li>厚铜（≥2 oz）板线路蚀刻侧蚀占比更大，线宽补偿由板厂控制；走线间距与载流要按成品铜核。</li>
            <li>AWG 编号越大线越细：每 +3 号截面积约减半，每 +6 号直径约减半；1.5 mm² ≈ AWG 16、2.5 mm² ≈ AWG 14、4 mm² ≈ AWG 12。</li>
            <li>AWG 表载流列为「700 圆密耳/安」保守经验口径，机内配线另可按 3~5 A/mm² 电流密度校核，安规场合以标准为准。</li>
          </ul>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <CheckCircle class="w-4 h-4 mr-2 text-primary" /> 口径与自检锚点
          </h3>
          <ul class="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <li>• 1 oz = 34.8 µm = 0.0348 mm ≈ 1.370 mil</li>
            <li>• 2.5 oz = 87.0 µm（命中工程口径）</li>
            <li>• AWG 10 → 直径 2.588 mm（偏差 +0.01%）</li>
            <li>• AWG 20 → 0.8118 mm、AWG 40 → 0.0799 mm</li>
            <li>• AWG 12 → 2.052 mm、AWG 24 → 0.511 mm</li>
            <li>• AWG 10 → 5.26 mm²、3.28 Ω/km、≈15 A（经验）</li>
            <li>• 1 oz · 1 A → 经验线宽 1.016 mm（40 mil）</li>
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

    <!-- 模块③：AWG 线规全表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Table class="w-5 h-5 mr-2 text-primary" /> AWG 线规全表（4/0 ~ 40）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">
        按标准 AWG 定义生成：直径 d(inch) = 0.005 × 92^((36−n)/39)；截面积 A = πd²/4；
        每 km 电阻按 20℃ 退火铜电阻率 0.017241 Ω·mm²/m（100% IACS）计算；
        载流经验值按「700 圆密耳/安」法则生成——以铜线、30℃ 温升、开放空气为参考，实际按安规与绝缘口径。
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="(half, hi) in awgHalves" :key="hi" class="border border-border rounded-lg overflow-x-auto">
          <table class="w-full text-xs sm:text-sm">
            <thead>
              <tr class="bg-muted/50 text-xs font-medium text-muted-foreground">
                <th class="px-2.5 py-2 text-left">AWG</th>
                <th class="px-2.5 py-2 text-right">直径 mm</th>
                <th class="px-2.5 py-2 text-right">直径 inch</th>
                <th class="px-2.5 py-2 text-right">截面 mm²</th>
                <th class="px-2.5 py-2 text-right">Ω/km</th>
                <th class="px-2.5 py-2 text-right">载流 A</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in half" :key="row.label" class="border-t border-border/50">
                <td class="px-2.5 py-1.5 font-mono font-medium text-foreground">{{ row.label }}</td>
                <td class="px-2.5 py-1.5 text-right font-mono text-foreground">{{ fmtSig(row.dmm, 4) }}</td>
                <td class="px-2.5 py-1.5 text-right font-mono text-muted-foreground">{{ fmtSig(row.din, 3) }}</td>
                <td class="px-2.5 py-1.5 text-right font-mono text-foreground">{{ fmtSig(row.area, 3) }}</td>
                <td class="px-2.5 py-1.5 text-right font-mono text-foreground">{{ fmtSig(row.ohm, 3) }}</td>
                <td class="px-2.5 py-1.5 text-right font-mono text-foreground">{{ fmtAmp(row.amp) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p class="text-xs text-muted-foreground leading-relaxed mt-3">
        载流列口径补充：700 圆密耳/安（cmil = 直径 mil²）为裸铜单线、开放空气的保守经验值，短时与成束、绝缘、密闭线槽场景差异显著，
        实际选型按 UL / IEC 安规与绝缘耐温口径；跳线、飞线估流详见下方说明区。
      </p>
    </div>

    <!-- 模块④：铜厚 × 线宽载流速查 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Ruler class="w-5 h-5 mr-2 text-primary" /> 铜厚 × 线宽载流速查（1 oz / 40 mil ≈ 1 A）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">
        经验法则：1 oz 铜厚下每 1 A 电流建议 40 mil（≈1.02 mm）线宽，线宽与电流成正比、与铜厚成反比。下表同时给出 IPC-2221 外层 10℃ 温升公式的对照值。
      </p>

      <div class="border border-border rounded-lg overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-muted/50 text-xs font-medium text-muted-foreground">
              <th class="px-3 py-2 text-left" rowspan="2">铜厚</th>
              <th class="px-3 py-1.5 text-center border-l border-border/50" colspan="2">1 A 线宽（mm）</th>
              <th class="px-3 py-1.5 text-center border-l border-border/50" colspan="2">3 A 线宽（mm）</th>
              <th class="px-3 py-1.5 text-center border-l border-border/50" colspan="2">5 A 线宽（mm）</th>
            </tr>
            <tr class="bg-muted/50 text-xs font-medium text-muted-foreground">
              <th class="px-3 py-1.5 text-right border-l border-border/50">经验 40mil/A</th>
              <th class="px-3 py-1.5 text-right">IPC-2221</th>
              <th class="px-3 py-1.5 text-right border-l border-border/50">经验 40mil/A</th>
              <th class="px-3 py-1.5 text-right">IPC-2221</th>
              <th class="px-3 py-1.5 text-right border-l border-border/50">经验 40mil/A</th>
              <th class="px-3 py-1.5 text-right">IPC-2221</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in widthRows" :key="row.oz" class="border-t border-border/50">
              <td class="px-3 py-2 font-mono font-medium text-foreground">{{ row.oz }} oz</td>
              <template v-for="(a, ai) in row.rule" :key="ai">
                <td class="px-3 py-2 text-right font-mono text-foreground border-l border-border/50">{{ fmtSig(a, 3) }}</td>
                <td class="px-3 py-2 text-right font-mono text-muted-foreground">{{ fmtSig(row.ipc[ai], 3) }}</td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-muted-foreground leading-relaxed mt-3">
        口径说明：「1 oz / 40 mil ≈ 1 A」是偏保守的电源走线经验法则（1 oz 下 1 A / 3 A / 5 A 分别约 1.02 / 3.05 / 5.08 mm）；
        IPC-2221 外层 10℃ 温升公式给出的宽度更小（1 oz 下约 0.30 / 1.38 / 2.78 mm），两者相差约 3 倍——快速估算用经验法则，
        正式设计按温升、电压降与工艺能力计算，见
        <NuxtLink to="/tools/pcb-trace-width-calculator" class="text-primary hover:underline">PCB线宽载流计算器</NuxtLink>
        （IPC-2221 / IPC-2152 完整口径）。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>oz 是什么单位？1 oz 铜到底多厚？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          oz（盎司）来自铜箔行业按「重量」计价与验收的传统：把 1 盎司（约 28.35 g）的铜均匀铺满 1 平方英尺，得到的铜箔厚度就是「1 oz 铜厚」，
          所以 oz 本质是面密度单位（oz/ft²）。按铜密度约 8.9 g/cm³ 折算，1 oz ≈ 34.3~35 µm；工程惯例普遍取
          <span class="font-mono text-foreground">1 oz = 34.8 µm = 1.37 mil = 0.0348 mm</span>，
          本工具即采用这一口径（与 1.37 mil 自洽，且 2.5 oz → 87 µm 等常用换算正好落在整数上）。
          IPC-4562 对电解铜箔给出的 1 oz「最低厚度」口径约 34.3 µm，与工程惯例相差不到 1.5%——常规设计用 34.8 即可，
          做精确阻抗或层叠设计时以板厂层叠表的成品铜厚为准。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>基铜和成品铜为什么差 20%？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          基铜（lamination / base copper）是覆铜板压合时那层光箔的厚度；成品铜（finished copper）是板子做完、蚀刻出线路后导线的实际铜厚。
          外层工艺顺序是：压合基铜 → 钻孔 → 孔金属化与整板镀铜 → 图形电镀（线路被加厚）→ 蚀刻 → 表面处理。
          图形电镀要把孔铜镀到位，同时导线也会被镀上约 20~40% 的增量，这是「成品比基铜厚 20%」的主要来源；
          HAL 喷锡、沉金等表面处理还会在铜面上再覆盖 15~20 µm 或 5 µm 量级的镀层（口径为通用参考，具体以各厂工艺为准）。
          内层没有电镀加厚，成品铜厚基本等于基铜。因此：算载流时外层要用成品铜厚，算内层用基铜；
          报板厂「1 oz 成品」时通常指基铜 1 oz、外层成品约 1.2~1.4 oz + 镀层。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>厚铜板用在哪里？</h2>
        <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground leading-relaxed mb-4">
          <li><span class="text-foreground font-medium">电源与功率模块：</span>2~4 oz 及以上的厚铜板承担大电流母线与功率地，减少铺铜开窗与加锡强化。</li>
          <li><span class="text-foreground font-medium">汽车电子：</span>ECU、车灯驱动、BMS 等对振动、温升与大电流长期可靠性敏感，普遍用厚铜 + 高 Tg 基材。</li>
          <li><span class="text-foreground font-medium">散热：</span>厚铜同时是横向导热通道，把热点热量摊到大面积铺铜或金属基板上。</li>
        </ul>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          厚铜的代价是线距能力变差（蚀刻深、侧蚀大）、阻抗控制公差变宽，所以信号层与电源层常分开选型：信号层 1 oz 内层或 0.5 oz 外层，
          电源层局部 2 oz 以上厚铜。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>AWG 与公制怎么对照？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          AWG（American Wire Gauge）按「拉丝次数」定义：编号越大、线越细。标准定义下直径 d(inch) = 0.005 × 92^((36−n)/39)，
          由此每 +3 号截面积约减半、每 +6 号直径约减半。常用对照：AWG 12 ≈ 2.05 mm / 3.31 mm²（≈ 国标 4 mm²），
          AWG 14 ≈ 1.63 mm / 2.08 mm²（≈ 2.5 mm²），AWG 16 ≈ 1.29 mm / 1.31 mm²（≈ 1.5 mm²），AWG 18 ≈ 1.02 mm / 0.82 mm²（≈ 0.75~1 mm²）。
          多股绞线的等效截面与单股相同，但外径更大、柔性好；本表按单股裸铜（实心）口径生成。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>跳线 / 飞线的载流怎么估？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          杜邦跳线多为 26~28 AWG（0.13~0.14 mm² 级），按本表 700 圆密耳/安的保守口径只有 0.2~0.4 A，
          实际短距离、开放空气下常按 1 A 量级使用；成束、穿管或靠大发热件时应减半再减半。
          机内导线可按 3~5 A/mm² 电流密度快速估算：22 AWG（0.33 mm²）≈ 1~1.6 A，18 AWG（0.82 mm²）≈ 2.5~4 A，
          大电流供电建议 18 AWG 以上或按压降与温升重新核算。PCB 上的走线载流另见
          <NuxtLink to="/tools/pcb-trace-width-calculator" class="text-primary hover:underline">PCB线宽载流计算器</NuxtLink>。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">1 oz 铜厚等于多少 µm / mm？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              工程惯例口径：1 oz = 34.8 µm = 0.0348 mm ≈ 1.37 mil。IPC-4562 箔材最低厚度口径约 34.3 µm，差异不到 1.5%；
              常规设计与本工具均取 34.8，精确阻抗计算以板厂层叠表为准。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">2.5 oz 铜厚是多少 mm？成品会有多厚？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              基铜 2.5 oz = 87 µm = 0.087 mm。若为外层，加上图形电镀 20~40% 后成品铜约 104~122 µm，
              再含 HAL 喷锡等表面处理还会更厚；内层无加厚，成品 ≈ 基铜 87 µm。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">AWG 14 相当于多少平方毫米？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              AWG 14 直径 1.628 mm、截面积 2.08 mm²，最接近国标 2.5 mm² 档（略小）。对照关系：AWG 12 ≈ 3.31 mm²（≈4 mm²）、
              AWG 16 ≈ 1.31 mm²（≈1.5 mm²）、AWG 18 ≈ 0.82 mm²（≈0.75~1 mm²）。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">算走线载流按基铜还是成品铜？线宽怎么定？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              截面积 = 线宽 × 成品铜厚：外层用成品铜厚（基铜 ×1.2~1.4 + 镀层），内层用基铜。
              定线宽时先用本页「铜厚 × 线宽速查」快速估，正式设计按 IPC-2221 / IPC-2152 的温升与电压降口径计算，
              见 PCB线宽载流计算器。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'copper-thickness-converter'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Layers, ArrowLeftRight, Calculator, Table, Ruler, Info, Lightbulb,
  CheckCircle, Link as LinkIcon, ChevronUp, ChevronDown, AlertTriangle
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'copper-thickness-converter'
const STORAGE_KEY = 'copper-thickness-converter.inputs'

// SEO
useSeoMeta({
  title: '铜厚与线规换算器 - oz/mil/mm/µm 换算与 AWG 线规表',
  description: '在线 PCB 铜厚换算工具：oz/mil/mm/µm 四向换算与 0.5~4 oz 档位表，基铜与成品铜口径对照（电镀加厚/HAL/表面处理增量），AWG 4/0~40 完整线规表（直径、截面积、Ω/km、载流经验值），铜厚×线宽载流速查，纯本地计算',
  keywords: '铜厚换算, 1oz多少um, oz mil mm 换算, 基铜成品铜, AWG线规表, awg对照表, 铜箔厚度, 厚铜板, copper thickness converter',
  author: 'Util工具箱',
  ogTitle: '铜厚与线规换算器 - 有条工具',
  ogDescription: 'PCB 铜厚 oz/mil/mm/µm 四向换算、基铜成品铜口径对照、AWG 线规全表与载流速查',
  ogUrl: 'https://www.util.cn/tools/copper-thickness-converter',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '铜厚与线规换算器',
  twitterDescription: 'oz/mil/mm/µm 换算、基铜与成品铜口径、AWG 线规全表'
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
          name: '铜厚与线规换算器',
          url: 'https://www.util.cn/tools/copper-thickness-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'oz/mil/mm/µm 四向铜厚换算',
            '0.5~4 oz 常用档位整表',
            '基铜→成品铜估算（电镀加厚/HAL/表面处理增量）',
            'AWG 4/0~40 完整线规表（直径/截面积/Ω/km/载流）',
            '铜厚×线宽 1A/3A/5A 载流速查（经验法则 + IPC-2221 对照）'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '铜厚与线规换算器', item: 'https://www.util.cn/tools/copper-thickness-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1 oz 铜厚等于多少 µm / mm？',
              acceptedAnswer: { '@type': 'Answer', text: '工程惯例口径 1 oz = 34.8 µm = 0.0348 mm ≈ 1.37 mil；IPC-4562 箔材最低厚度口径约 34.3 µm，差异不到 1.5%，精确阻抗计算以板厂层叠表为准。' }
            },
            {
              '@type': 'Question',
              name: '2.5 oz 铜厚是多少 mm？',
              acceptedAnswer: { '@type': 'Answer', text: '基铜 2.5 oz = 87 µm = 0.087 mm；外层加电镀 20~40% 后成品铜约 104~122 µm，内层无加厚成品约等于基铜。' }
            },
            {
              '@type': 'Question',
              name: 'AWG 14 相当于多少平方毫米？',
              acceptedAnswer: { '@type': 'Answer', text: 'AWG 14 直径 1.628 mm、截面积 2.08 mm²，最接近国标 2.5 mm² 档；AWG 12 ≈ 3.31 mm²、AWG 16 ≈ 1.31 mm²、AWG 18 ≈ 0.82 mm²。' }
            },
            {
              '@type': 'Question',
              name: '算走线载流按基铜还是成品铜？',
              acceptedAnswer: { '@type': 'Answer', text: '截面积 = 线宽 × 成品铜厚；外层用成品铜厚（基铜×1.2~1.4 加镀层增量），内层用基铜。线宽可先用「1 oz/40 mil ≈ 1 A」经验法则估算，正式设计按 IPC-2221/IPC-2152 计算。' }
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
      if (typeof s.convVal === 'number') convVal.value = s.convVal
      if (typeof s.convUnit === 'string') convUnit.value = s.convUnit
      if (typeof s.baseOz === 'number') baseOz.value = s.baseOz
      if (typeof s.usePlating === 'boolean') usePlating.value = s.usePlating
      if (typeof s.useHal === 'boolean') useHal.value = s.useHal
      if (typeof s.useImmersion === 'boolean') useImmersion.value = s.useImmersion
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})

// __PURE_FNS_START__
// ---------- 铜厚换算（锚点：1 oz = 34.8 µm 工程惯例口径；mil 按 25.4 µm/in 精确换算） ----------
const OZ_TO_UM = 34.8
const UM_PER_MIL = 25.4

const UM_FACTORS = { oz: OZ_TO_UM, mil: UM_PER_MIL, mm: 1000, um: 1 }

const toUm = (v, unit) => v * (UM_FACTORS[unit] || 1)
const fromUm = (um, unit) => um / (UM_FACTORS[unit] || 1)

// 3 位以上有效数字展示（避免浮点尾差）
const trimZeros = (s) => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s)
const fmtSig = (v, p = 4) => {
  if (!isFinite(v)) return '—'
  if (v === 0) return '0'
  return trimZeros(v.toPrecision(p))
}

// ---------- AWG 线规（标准定义：d(inch) = 0.005 × 92^((36−n)/39)，n = −3(4/0) ~ 40） ----------
const awgDiameterInch = (n) => 0.005 * Math.pow(92, (36 - n) / 39)
const awgDiameterMm = (n) => awgDiameterInch(n) * 25.4
const awgAreaMm2 = (n) => (Math.PI / 4) * Math.pow(awgDiameterMm(n), 2)
// 20℃ 退火铜电阻率 0.017241 Ω·mm²/m（100% IACS）→ Ω/km = 17241 / A(mm²)
const CU_RHO = 0.017241
const awgOhmPerKm = (n) => (CU_RHO * 1000) / awgAreaMm2(n)
// 载流经验值：700 圆密耳/安 法则（裸铜、开放空气、30℃ 温升量级）
const awgAmpacity = (n) => {
  const dMil = awgDiameterInch(n) * 1000
  return (dMil * dMil) / 700
}
const awgLabel = (n) => (n === -3 ? '4/0' : n === -2 ? '3/0' : n === -1 ? '2/0' : n === 0 ? '1/0' : String(n))

const AWG_N_MIN = -3
const AWG_N_MAX = 40
const buildAwgRows = () => {
  const rows = []
  for (let n = AWG_N_MIN; n <= AWG_N_MAX; n++) {
    rows.push({
      n,
      label: awgLabel(n),
      din: awgDiameterInch(n),
      dmm: awgDiameterMm(n),
      area: awgAreaMm2(n),
      ohm: awgOhmPerKm(n),
      amp: awgAmpacity(n)
    })
  }
  return rows
}

// ---------- 基铜 → 成品铜（通用参考口径，以各厂工艺为准） ----------
const estimateFinishedUm = (baseUm, opts) => {
  let pctL = 0
  let pctH = 0
  let addL = 0
  let addH = 0
  if (opts && opts.plating) { pctL = 0.20; pctH = 0.40 } // 图形电镀加厚 +20~40%（相对基铜）
  if (opts && opts.hal) { addL += 15; addH += 20 }       // HAL 喷锡 +15~20 µm
  if (opts && opts.immersion) { addL += 5; addH += 5 }   // 沉铜 / 化学表面处理 +5 µm 量级
  return {
    low: baseUm * (1 + pctL) + addL,
    mid: baseUm * (1 + (pctL + pctH) / 2) + (addL + addH) / 2,
    high: baseUm * (1 + pctH) + addH
  }
}

// ---------- 铜厚 × 线宽载流 ----------
// 经验法则：1 oz / 40 mil ≈ 1 A，线宽 ∝ I / 铜厚
const WIDTH_RULE_MIL_PER_A = 40
const ruleWidthMm = (amps, oz) => (amps * WIDTH_RULE_MIL_PER_A * UM_PER_MIL) / 1000 / oz
// IPC-2221 外层：I = 0.048 × ΔT^0.44 × A^0.725（A 单位 mil²）；线宽 = A / 铜厚(mil)
const ipcAreaMils2 = (amps, dT) => Math.pow(amps / (0.048 * Math.pow(dT, 0.44)), 1 / 0.725)
const ipcWidthMm = (amps, dT, oz) => (ipcAreaMils2(amps, dT) * UM_PER_MIL) / 1000 / (oz * OZ_TO_UM / UM_PER_MIL)

// 载流展示：<1 A 保留 2 位有效数字，其余 3 位
const fmtAmp = (v) => {
  if (!isFinite(v) || v <= 0) return '—'
  if (v >= 100) return String(Math.round(v))
  return trimZeros(v.toPrecision(v >= 1 ? 3 : 2))
}
// __PURE_FNS_END__

// ---------- 状态 ----------
const convUnits = [
  { k: 'oz', label: 'oz' },
  { k: 'mil', label: 'mil' },
  { k: 'mm', label: 'mm' },
  { k: 'um', label: 'µm' }
]
const OZ_STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 4]
const OZ_STEP_NOTES = {
  0.5: '内层信号常见',
  1: '最常用基准档',
  1.5: '电源层常用',
  2: '厚铜起点',
  2.5: '厚铜板常见',
  3: '大电流电源',
  4: '汽车/功率级'
}

const convVal = ref(1)
const convUnit = ref('oz')
const baseOz = ref(1)
const usePlating = ref(true)
const useHal = ref(false)
const useImmersion = ref(false)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const fillConv = (v, unit) => {
  convVal.value = v
  convUnit.value = unit
}

// 输入持久化（键前缀为工具 id）
watch([convVal, convUnit, baseOz, usePlating, useHal, useImmersion], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      convVal: convVal.value,
      convUnit: convUnit.value,
      baseOz: baseOz.value,
      usePlating: usePlating.value,
      useHal: useHal.value,
      useImmersion: useImmersion.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
})

// ---------- 模块①：四向换算 ----------
const convValid = computed(() => isFinite(convVal.value) && convVal.value > 0)
const convRows = computed(() => {
  if (!convValid.value) return { oz: 0, mil: 0, mm: 0, um: 0 }
  const um = toUm(convVal.value, convUnit.value)
  return {
    oz: fromUm(um, 'oz'),
    mil: fromUm(um, 'mil'),
    mm: fromUm(um, 'mm'),
    um
  }
})

const ozStepRows = computed(() => OZ_STEPS.map((oz) => {
  const um = toUm(oz, 'oz')
  return {
    oz,
    um,
    mm: fromUm(um, 'mm'),
    mil: fromUm(um, 'mil'),
    note: OZ_STEP_NOTES[oz] || ''
  }
}))

// ---------- 模块②：基铜 → 成品铜 ----------
const finished = computed(() => {
  const b = toUm(Number(baseOz.value) || 0, 'oz')
  if (!(b > 0)) return null
  return {
    baseUm: b,
    ...estimateFinishedUm(b, { plating: usePlating.value, hal: useHal.value, immersion: useImmersion.value })
  }
})

const finishedNote = computed(() => {
  const any = usePlating.value || useHal.value || useImmersion.value
  if (!any) {
    return '未勾选任何工艺增量：成品铜厚 ≈ 基铜（内层口径）。外层请至少勾选「图形电镀加厚」。'
  }
  const parts = []
  if (usePlating.value) parts.push('图形电镀 +20~40%')
  if (useHal.value) parts.push('HAL 喷锡 +15~20 µm')
  if (useImmersion.value) parts.push('沉铜/化学处理 +5 µm 量级')
  return `口径：${parts.join(' + ')}。均为通用参考值，实际以各厂工艺与层叠表为准；载流校核建议取下限值。`
})

// ---------- 模块③：AWG 全表 ----------
const awgRows = computed(() => buildAwgRows())
const awgHalves = computed(() => {
  const rows = awgRows.value
  const cut = 22 // 4/0~18 与 19~40 各 22 行
  return [rows.slice(0, cut), rows.slice(cut)]
})

// ---------- 模块④：铜厚 × 线宽 ----------
const widthRows = computed(() => OZ_STEPS.map((oz) => ({
  oz,
  rule: [1, 3, 5].map((a) => ruleWidthMm(a, oz)),
  ipc: [1, 3, 5].map((a) => ipcWidthMm(a, 10, oz))
})))

// ---------- 相关工具 ----------
const relatedLinks = computed(() => ['pcb-trace-width-calculator', 'eseries-resistor-finder', 'ohms-law-calculator']
  .map((id) => tools.find((t) => t.id === id))
  .filter(Boolean))
</script>
