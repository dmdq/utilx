<template>
  <div class="max-w-8xl mx-auto rebar-print-root">
    <!-- Hero 头部 -->
    <div class="mb-6 rebar-print-hidden">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Ruler class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">钢筋每米重量换算</h1>
          <p class="text-sm text-muted-foreground mt-1">Φ6-Φ40 螺纹钢/圆钢理论米速查，米数算总重、重量反推米数、多规格下料清单汇总分吨，导出 CSV 并打印小票清单</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线钢筋理论重量计算器：按公称直径与密度 7.85 g/cm³ 导出每米重量公式 W = 0.00617·d²，覆盖工地收料、预算抽料、材料员吨位汇总与装修备料场景。
        支持「单规格正查」（直径 + 总米数 → 公斤/吨，重量反推米数）与「下料清单」（逐行录入 规格×根数×单根长 → 分规格吨位 + CSV 导出 + 打印），
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <div class="flex items-start gap-2 px-3 py-2.5 mb-6 rounded-lg bg-muted/60 border border-border text-xs leading-relaxed text-foreground rebar-print-hidden">
      <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span>理论重量按密度 7.85 g/cm³ 圆钢截面积计算（W=0.00617·d²，d 为公称直径 mm）；螺纹钢实际米重与公称存在轧制偏差（±4% 级），过磅计价请按合同口径。</span>
    </div>

    <!-- 模式切换 + 预设场景 -->
    <div class="flex flex-wrap items-center gap-3 mb-6 rebar-print-hidden">
      <div class="inline-flex rounded-lg border border-border bg-muted p-1">
        <button
          @click="mode = 'single'"
          class="px-3.5 py-1.5 rounded-md text-sm font-medium transition"
          :class="mode === 'single' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
        >
          单规格正查
        </button>
        <button
          @click="mode = 'list'"
          class="px-3.5 py-1.5 rounded-md text-sm font-medium transition"
          :class="mode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
        >
          下料清单
        </button>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          @click="applyPresetFrame"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/60 text-xs text-foreground transition"
        >
          <Play class="w-3 h-3 text-primary" /> 预设① 构造柱：Φ12×200m + Φ6×150m
        </button>
        <button
          @click="applyPresetTenTon"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/60 text-xs text-foreground transition"
        >
          <Play class="w-3 h-3 text-primary" /> 预设② 10 吨 Φ25 能下多少米
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 rebar-print-hidden">
      <!-- 输入控制区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <template v-if="mode === 'single'">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 规格与总米数
          </h2>
          <div>
            <label class="block text-sm font-medium text-foreground">钢筋直径（公称）</label>
            <select
              v-model="selD"
              class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="s in tableSizes" :key="s" :value="s">Φ{{ s }} · {{ weightPerMeterOf(s).toFixed(3) }} kg/m</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground">总米数（m）</label>
            <input
              v-model.number="totalMInput"
              type="number"
              min="0"
              step="0.1"
              class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 200"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground">已知总重反推米数（kg）</label>
            <input
              v-model.number="reverseKgInput"
              type="number"
              min="0"
              step="100"
              class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 10000"
            />
            <p class="text-[11px] text-muted-foreground mt-1.5">1000 = 一吨；工地常按「这批过磅 N 吨 ≈ 多少米 Φd」核料。</p>
          </div>
        </template>
        <template v-else>
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 下料清单（按行录入）
          </h2>
          <div class="grid grid-cols-[1fr_56px_64px_28px] gap-2 text-[10px] text-muted-foreground">
            <span>规格</span><span>根数</span><span>单根长m</span><span></span>
          </div>
          <div class="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            <div v-for="(piece, idx) in pieces" :key="idx" class="grid grid-cols-[1fr_56px_64px_28px] gap-2 items-center">
              <select v-model="piece.d" class="px-2 py-1.5 bg-background border border-border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option v-for="s in tableSizes" :key="s" :value="s">Φ{{ s }}</option>
              </select>
              <input v-model.number="piece.count" type="number" min="0" class="w-full px-2 py-1.5 bg-background border border-border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="根" />
              <input v-model.number="piece.lengthM" type="number" min="0" step="0.1" class="w-full px-2 py-1.5 bg-background border border-border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="m" />
              <button @click="removePiece(idx)" class="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition" aria-label="删除该行">
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <button
            @click="addPiece"
            class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <Plus class="w-4 h-4" /> 加一行
          </button>
          <p class="text-xs text-muted-foreground leading-relaxed">直条默认 9 m/根；箍筋按单根下料长（如 1.2 m/个）填写根数即可。</p>
        </template>
      </div>

      <!-- 结果区 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <template v-if="mode === 'single'">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle v-if="fwd" class="w-5 h-5 mr-2 text-green-500" />
            <TriangleAlert v-else class="w-5 h-5 mr-2 text-amber-500" />
            {{ fwd ? '计算结果' : '请检查输入（直径 5-100mm、米数≥0）' }}
          </h2>

          <!-- 特大重量卡 -->
          <div class="bg-primary/10 rounded-lg p-6 text-center">
            <p class="text-xs text-muted-foreground mb-1">Φ{{ selD }} × {{ fmtNum(totalMInput, '—') }} 米 = 理论总重</p>
            <p class="text-5xl font-bold text-primary tabular-nums">
              {{ fwd ? fwd.kg.toFixed(3) : '—' }}<span class="text-lg font-semibold ml-1.5">kg</span>
            </p>
            <p class="text-sm text-muted-foreground mt-2 tabular-nums">≈ {{ fwd ? fwd.tons.toFixed(2) : '—' }} 吨</p>
          </div>

          <!-- 公式代入行 -->
          <div class="bg-muted/50 rounded-lg p-3.5">
            <p class="text-[10px] text-muted-foreground mb-1">理论米重公式代入（精确系数 π/4×7.85/1000 = 0.00616538）</p>
            <p class="text-sm font-mono text-foreground leading-relaxed break-all">{{ formulaSubText }}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-[10px] text-muted-foreground mb-1">反推 · 重量 → 米数</p>
              <p class="text-xl font-bold text-foreground tabular-nums">
                {{ fmtNum(reverseKgInput, 1000) }} kg ≈ {{ revMeters === null ? '—' : revMeters.toFixed(2) }} 米 Φ{{ selD }}
              </p>
              <p class="text-[11px] text-muted-foreground mt-1">一吨 Φ{{ selD }} 约 {{ perTonMeters === null ? '—' : perTonMeters.toFixed(2) }} 米</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-[10px] text-muted-foreground mb-1">材料构成（圆钢截面积 × 密度）</p>
              <p class="text-xl font-bold text-foreground tabular-nums">{{ section ? section.areaMm2.toFixed(2) : '—' }} <span class="text-xs font-normal text-muted-foreground">mm² 截面</span></p>
              <p class="text-[11px] text-muted-foreground mt-1">每米体积 {{ section ? section.volumeCm3PerM.toFixed(2) : '—' }} cm³/m × 7.85 g/cm³</p>
            </div>
          </div>

          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>本卡按公称直径理计。螺纹钢带肋、允许轧制偏差（±4% 级）且市场常有「负公差」，过磅实重普遍低于理论米重——按吨采购 / 结算时以合同口径（理计或磅计）为准。</span>
          </p>
        </template>

        <template v-else>
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle v-if="listSum.rows.length && !listSum.hasError" class="w-5 h-5 mr-2 text-green-500" />
            <TriangleAlert v-else-if="listSum.hasError" class="w-5 h-5 mr-2 text-amber-500" />
            <Ruler v-else class="w-5 h-5 mr-2 text-primary" />
            清单合计
          </h2>
          <p v-if="listSum.hasError" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>存在无效行（规格/根数/单根长缺失或为负）：无效行不计入合计，请补全后再看吨位。</span>
          </p>

          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-[10px] text-muted-foreground mb-1">总米数</p>
              <p class="text-2xl font-bold text-foreground tabular-nums">{{ listSum.totalM.toFixed(2) }}<span class="text-xs font-normal text-muted-foreground ml-0.5">m</span></p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-[10px] text-muted-foreground mb-1">总重量</p>
              <p class="text-2xl font-bold text-foreground tabular-nums">{{ listSum.totalKg.toFixed(3) }}<span class="text-xs font-normal text-muted-foreground ml-0.5">kg</span></p>
            </div>
            <div class="bg-primary/10 rounded-lg p-4">
              <p class="text-[10px] text-muted-foreground mb-1">总吨位</p>
              <p class="text-2xl font-bold text-primary tabular-nums">{{ listSum.totalTons.toFixed(2) }}<span class="text-xs font-normal text-muted-foreground ml-0.5">t</span></p>
            </div>
          </div>

          <div>
            <p class="text-sm font-medium text-foreground mb-2">分规格吨位（钢材采购按规格分开算吨）</p>
            <div class="overflow-x-auto rounded-lg border border-border">
              <table class="w-full text-sm">
                <thead class="bg-muted/60 text-muted-foreground text-xs">
                  <tr><th class="px-3 py-2 text-left font-medium">规格</th><th class="px-3 py-2 text-right font-medium">米数</th><th class="px-3 py-2 text-right font-medium">重量 kg</th><th class="px-3 py-2 text-right font-medium">吨位 t</th></tr>
                </thead>
                <tbody>
                  <tr v-for="row in listSum.bySpec" :key="row.d" class="border-t border-border tabular-nums">
                    <td class="px-3 py-2 font-medium text-foreground">Φ{{ row.d }}</td>
                    <td class="px-3 py-2 text-right text-muted-foreground">{{ row.meters.toFixed(2) }}</td>
                    <td class="px-3 py-2 text-right text-foreground">{{ row.kg.toFixed(3) }}</td>
                    <td class="px-3 py-2 text-right font-semibold text-primary">{{ row.tons.toFixed(2) }}</td>
                  </tr>
                  <tr v-if="!listSum.bySpec.length" class="border-t border-border">
                    <td colspan="4" class="px-3 py-3 text-center text-muted-foreground text-xs">清单为空，先添加行或使用预设①</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              @click="exportCsv"
              class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
            >
              <Download class="w-4 h-4" /> 导出 CSV
            </button>
            <button
              @click="printList"
              class="inline-flex items-center gap-1.5 px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              打印小票清单
            </button>
            <span v-if="exportHint" class="inline-flex items-center gap-1 text-xs text-green-600">
              <CheckCircle class="w-3.5 h-3.5" /> {{ exportHint }}
            </span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">CSV 含 BOM（Excel 直接双击打开不乱码），列：规格,根数,单根长,总长,总重；打印走系统打印对话框，页面只输出小票式清单。</p>
        </template>
      </div>
    </div>

    <!-- 理论重量速查表（静态常驻） -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8 rebar-print-hidden">
      <h2 class="text-lg font-semibold mb-1 flex items-center">
        <Info class="w-5 h-5 mr-2 text-primary" /> 钢筋理论重量速查表（Φ6-Φ40）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">点击任意行，把该直径带入「单规格正查」；备注为通俗用途常识，仅供参考。</p>
      <div class="overflow-x-auto rounded-lg border border-border">
        <table class="w-full text-sm">
          <thead class="bg-muted/60 text-muted-foreground text-xs">
            <tr>
              <th class="px-3 py-2 text-left font-medium">规格</th>
              <th class="px-3 py-2 text-right font-medium">每米重量 kg/m</th>
              <th class="px-3 py-2 text-right font-medium">一吨约米数</th>
              <th class="px-3 py-2 text-left font-medium">常用作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in tableRows"
              :key="row.d"
              @click="pickSize(row.d)"
              class="border-t border-border cursor-pointer hover:bg-primary/5 transition tabular-nums"
              :class="selD === row.d && mode === 'single' ? 'bg-primary/10' : ''"
            >
              <td class="px-3 py-2 font-medium text-foreground">Φ{{ row.d }}</td>
              <td class="px-3 py-2 text-right font-semibold text-primary">{{ row.w.toFixed(3) }}</td>
              <td class="px-3 py-2 text-right text-muted-foreground">{{ row.tonM.toFixed(2) }} m</td>
              <td class="px-3 py-2 text-left text-xs text-muted-foreground">{{ row.note }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 打印小票式清单（屏幕隐藏，仅打印输出） -->
    <div class="rebar-print-only font-mono text-[12px] leading-relaxed text-black">
      <template v-if="listSum.rows.length">
        <p class="text-center text-[15px] font-bold mb-1">钢筋下料清单</p>
        <p class="text-center mb-2">打印时间 {{ printTime || '（点「打印小票清单」按钮生成）' }}</p>
        <p>──────────────────────────</p>
        <p v-for="(row, i) in listSum.rows" :key="i">Φ{{ row.d }} ×{{ row.count }}根 ×{{ row.lengthM }}m ＝ {{ row.rowM.toFixed(2) }}m ≈ {{ row.rowKg.toFixed(3) }}kg{{ row.ok ? '' : '（行无效，未计入）' }}</p>
        <p>──────────────────────────</p>
        <p v-for="row in listSum.bySpec" :key="`spec-${row.d}`">Φ{{ row.d }}：{{ row.meters.toFixed(2) }}m / {{ row.kg.toFixed(3) }}kg / {{ row.tons.toFixed(2) }}t</p>
        <p class="font-bold mt-1">合计：{{ listSum.totalM.toFixed(2) }} m ｜ {{ listSum.totalKg.toFixed(3) }} kg ｜ {{ listSum.totalTons.toFixed(2) }} t</p>
        <p class="mt-2">口径：理论重量 W=0.00617·d²（ρ=7.85g/cm³），实际过磅存在 ±4% 级轧制偏差，结算以合同为准。</p>
      </template>
      <p v-else>（下料清单为空：切到「下料清单」模式录入规格行后再打印）</p>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative rebar-print-hidden">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>钢筋每米重量换算是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          钢筋每米重量换算是一款在线钢材理论重量工具。把钢筋按圆钢处理：公称直径 d（mm）的截面积为 π/4×d²，乘以长度 1 米与钢的密度 7.85 g/cm³，
          化简便得每米重量公式 W = 0.00617·d²（kg/m，工程惯例取 0.00617，精确系数 0.00616538，两者差异小于 0.1%）。
          页面提供 Φ6-Φ40 常用档理论米重速查、米数与重量的双向换算，以及多规格下料清单的根数×单根长汇总、分规格吨位统计、CSV 导出与打印，
          适合施工员下料、预算员抽量、材料员对磅单和装修业主核对用钢量。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">钢筋重量公式是怎么来的？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          每米重量 = 截面积 × 长度 × 密度。截面积 A = π/4 × d²（mm²）；取长度 1 m（1000 mm）、钢密度 7.85 g/cm³，
          则 W = π/4 × d² × 1000 × 7.85 ÷ 10⁶ g/m，化为千克即 W = (π/4 × 7.85 ÷ 1000) × d² = 0.00616538 × d²，工程上手算习惯记作 0.00617 × d²。
          例如 Φ25：0.00616538 × 625 ≈ 3.853 kg/m（速查表常写 3.85）。一个有趣的巧合：截面积 mm² 数值上恰等于每米体积 cm³/m，再乘 7.85 即得米重克数。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么理论重量和过磅对不上？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两个原因叠加：一是国标允许热轧钢筋按实际重量或理论重量交货，同规格的重量偏差按等级约 ±4%～±7%（直径越小允许偏差越大），轧制时公差带内浮动是常态；
          二是螺纹钢表面肋的面积并不完全等于公称圆截面，名义按公称直径理计，实际每米偏轻或偏重都可能出现。
          因此本工具算的是「理计值」：下料、预算抽量用理计没问题，进场对磅单、按吨结算则必须以过磅单或合同约定的口径为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">「负公差」是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          市场俗语。钢厂在国标允许的公差带内把钢筋往「轻」的一边轧（直径取下限、肋高偏小），按理论重量计价卖给工地时，同一吨数实际比标准理计多出若干米——中间的差价即「负公差收益」，
          于是不同钢厂、不同规格报价不同，俗称「下差」。提醒：按理计吨下单时务必约定可接受的下差范围，收货抽几支过磅，超出约定值（比如理论 3.85 的 Φ25 只称到 3.6）就应按磅计结算或扣差，这是最常见的结算坑。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">直条和盘圆怎么计价？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          大直径（一般 Φ12 及以上）多为 9 m/12 m 直条定尺，习惯按支数×理计支重报价，或按吨理计；小直径（Φ6-Φ10）常以盘圆（盘条）供货，按吨磅计居多，工地开料按支数不好点，多用「过磅 ÷ 每米重量 ≈ 展开米数」反推——本页反推卡就是干这个的。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">理计和磅计结算的差别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一句话：理计按「公称截面×理论密度×米数」折算重量，方但双方都要接受轧制偏差；磅计按地磅实际称量重量结算，公但受锈皮、水分、磅差影响且多一道过磅成本——合同里写清按哪种口径、下差超过多少改按磅计，即可避免扯皮。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">钢筋每米重量怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">公式 W = 0.00617·d²（d 为公称直径 mm），由截面积 π/4·d² 乘密度 7.85 g/cm³ 导出。如 Φ16 = 0.00617×256 ≈ 1.58 kg/m，Φ25 ≈ 3.85 kg/m。本页速查表按精确系数 0.00616538 保留三位小数。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">10 吨 Φ25 螺纹钢大概有多少米？</h3>
            <p class="text-sm text-muted-foreground mt-1">10000 kg ÷ 3.853 kg/m ≈ 2595 米。实际因负公差可能更多一点；点「预设②」可一键反推任意重量对应的米数。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">下料清单能导出吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">可以。清单模式支持逐行增删「规格×根数×单根长」，自动汇总总米数、总重与分规格吨位，一键导出带 BOM 的 CSV（Excel 直接打开），也可打印小票式清单随车、随料单流转。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。米重、吨位换算与清单汇总全部在你的浏览器本地完成，不发送任何网络请求，关闭页面即清空。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="rebar-print-hidden">
      <RelatedTools :currentToolId="'rebar-weight-calculator'" :category="'calculate'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Ruler, Plus, X, Download, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '钢筋每米重量换算 - 螺纹钢理论米重表/下料重量计算工具',
  description: '免费在线钢筋理论重量换算：Φ6-Φ40 每米重量速查（W=0.00617·d²）、米数与吨位双向换算、多规格下料清单汇总分吨、CSV 导出与打印小票清单，工地/预算/材料员实用，纯浏览器本地计算不上传',
  keywords: '钢筋理论重量,钢筋每米多重,钢筋重量表,螺纹钢理论米重,下料长度计算',
  author: '有条工具',
  ogTitle: '钢筋每米重量换算 - 螺纹钢理论米重表/下料重量计算工具 | 有条工具',
  ogDescription: '理论米重速查、米重双向换算、下料清单分吨汇总，支持 CSV 导出与打印，工地算量好帮手。',
  ogUrl: 'https://www.util.cn/tools/rebar-weight-calculator',
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
          name: '钢筋每米重量换算',
          url: 'https://www.util.cn/tools/rebar-weight-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['Φ6-Φ40 理论米重速查', '米数算总重与吨位', '重量反推米数', '多规格下料清单合计', '分规格吨位汇总', 'CSV 导出与打印小票清单', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '钢筋每米重量换算', item: 'https://www.util.cn/tools/rebar-weight-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '钢筋每米重量怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '公式 W=0.00617·d²（d 为公称直径 mm），由截面积 π/4·d² 乘钢的密度 7.85 g/cm³ 导出。如 Φ16=0.00617×256≈1.58 kg/m，Φ25≈3.85 kg/m。本工具速查表按精确系数 0.00616538 计算并保留三位小数。' }
            },
            {
              '@type': 'Question',
              name: '10 吨 Φ25 螺纹钢大概有多少米？',
              acceptedAnswer: { '@type': 'Answer', text: '10000 kg ÷ 3.853 kg/m ≈ 2595 米。实际因轧制负公差可能略多；页面支持任意重量反推米数。' }
            },
            {
              '@type': 'Question',
              name: '为什么理论重量和过磅重量对不上？',
              acceptedAnswer: { '@type': 'Answer', text: '国标允许热轧钢筋存在约 ±4%～±7% 的重量偏差，且螺纹钢按公称直径理计、表面肋形与实际截面存在差异；加上市场常见的「负公差」轧法，过磅实重普遍低于理计值。按吨结算务必以合同口径（理计或磅计）为准。' }
            },
            {
              '@type': 'Question',
              name: '下料清单可以导出或打印吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以。清单模式逐行录入规格、根数、单根长后自动汇总总米数、总重量与分规格吨位，支持导出带 BOM 的 CSV（列：规格、根数、单根长、总长、总重）并打印小票式清单，全程在浏览器本地完成。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 钢筋理论米重系数：W = π/4 × d² × ρ(7.85 g/cm³) ÷ 1000（kg/m，d 为公称直径 mm）
// 两个口径说明：
//   工程普及口径 W ≈ 0.00617·d²（π/4 取 0.785 手算系数，查表常用）；
//   精确口径     W = 0.00616538·d²（π/4×7.85/1000 原始导出，本实现用精确式，结果保留 3 位小数）。
// 两者差异 <0.1%，按 2 位小数查表结果一致（如 Φ16：0.00617→1.5795、精确→1.5783，查表同为 1.58）。
const STEEL_DENSITY_G_CM3 = 7.85 // 普通碳钢/低合金钢理论密度
const WEIGHT_COEFF = ((Math.PI / 4) * STEEL_DENSITY_G_CM3) / 1000 // ≈ 0.0061653756
const LEGACY_COEFF = 0.00617 // 普及口径系数（仅用于对照展示与说明）
const VALID_D_MIN = 5 // 常用档为 6-40；校验留边界，低于 5mm 属铁丝、高于 100mm 非普通钢筋
const VALID_D_MAX = 100

function round2(v) { return Math.round(v * 100) / 100 }
function round3(v) { return Math.round(v * 1000) / 1000 }
function isValidDiameter(d) {
  return Number.isFinite(d) && d >= VALID_D_MIN && d <= VALID_D_MAX
}
function isNonNegative(v) {
  return Number.isFinite(v) && v >= 0
}

// 每米理论重量 kg/m（3 位小数）；直径越界/非数值返回 null
function weightPerMeterOf(dMm) {
  if (!isValidDiameter(dMm)) return null
  return round3(WEIGHT_COEFF * dMm * dMm)
}

// 未取整的精确米重（清单/合计内部连续量，避免逐行取整误差累积）
function exactPerMeterKg(dMm) {
  return WEIGHT_COEFF * dMm * dMm
}

// 总米数 → 总重量：kg 3 位小数、吨 2 位小数；非法输入返回 null
function metersWeightOf(dMm, totalM) {
  if (!isValidDiameter(dMm) || !isNonNegative(totalM)) return null
  const kg = round3(exactPerMeterKg(dMm) * totalM)
  return { kg, tons: round2(kg / 1000) }
}

// 总重量 kg → 反推总米数（2 位小数）；重量须为正数
function countFromWeight(dMm, weightKg) {
  if (!isValidDiameter(dMm) || !Number.isFinite(weightKg) || weightKg <= 0) return null
  return round2(weightKg / exactPerMeterKg(dMm))
}

// 材料构成小卡：截面积 mm² 与每米体积 cm³/m（数值相等：A mm² × 1000 mm = A cm³）
function sectionAreaOf(dMm) {
  if (!isValidDiameter(dMm)) return null
  const areaMm2 = round2((Math.PI / 4) * dMm * dMm)
  return { areaMm2, volumeCm3PerM: areaMm2 }
}

// 下料清单合计：pieces = [{ d, count, lengthM }]（每规格 根数 × 单根长）
// 返回逐行归一化结果 + 按规格合并的吨位 + 总量；无效行 ok=false 计零
function pieceListSumOf(pieces) {
  const rows = (Array.isArray(pieces) ? pieces : []).map((p) => {
    const ok = isValidDiameter(p.d) && isNonNegative(p.count) && isNonNegative(p.lengthM)
    const rowM = ok ? round3(p.count * p.lengthM) : 0
    const rowKg = ok ? round3(exactPerMeterKg(p.d) * p.count * p.lengthM) : 0
    return { d: p.d, count: p.count, lengthM: p.lengthM, ok, perMeterKg: ok ? weightPerMeterOf(p.d) : null, rowM, rowKg }
  })
  const metersBySpec = {}
  const exactKgBySpec = {}
  rows.forEach((r) => {
    if (!r.ok) return
    metersBySpec[r.d] = (metersBySpec[r.d] || 0) + r.rowM
    exactKgBySpec[r.d] = (exactKgBySpec[r.d] || 0) + exactPerMeterKg(r.d) * r.count * r.lengthM
  })
  const bySpec = Object.keys(metersBySpec)
    .map(Number)
    .sort((a, b) => a - b)
    .map((d) => {
      const kg = round3(exactKgBySpec[d])
      return { d, meters: round3(metersBySpec[d]), kg, tons: round2(kg / 1000) }
    })
  const totalM = round3(rows.reduce((s, r) => s + r.rowM, 0))
  const totalKg = round3(rows.reduce((s, r) => s + (r.ok ? exactPerMeterKg(r.d) * r.count * r.lengthM : 0), 0))
  return { rows, bySpec, totalM, totalKg, totalTons: round2(totalKg / 1000), hasError: rows.some((r) => !r.ok) }
}

// 清单 → CSV 文本（带 BOM，列：规格,根数,单根长,总长,总重 + 合计行）
function csvTextOf(pieces) {
  const sum = pieceListSumOf(pieces)
  const lines = ['规格,根数,单根长,总长,总重']
  sum.rows.forEach((r) => {
    lines.push(
      r.ok
        ? `Φ${r.d},${r.count},${r.lengthM},${r.rowM.toFixed(3)},${r.rowKg.toFixed(3)}`
        : `无效行,${r.count ?? ''},${r.lengthM ?? ''},,`
    )
  })
  lines.push(`合计,,,${sum.totalM.toFixed(3)},${sum.totalKg.toFixed(3)}`)
  return '\ufeff' + lines.join('\n')
}

// ---------- 速查表与备注 ----------
const tableSizes = [6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32, 36, 40]
const sizeNotes = {
  6: '轻载箍筋、板分布筋',
  8: '常用作箍筋、板面负筋',
  10: '板筋、箍筋（小构件主筋）',
  12: '板筋主筋、构造柱主筋',
  14: '板筋、小梁主筋',
  16: '构造柱/圈梁主筋、小梁筋',
  18: '梁筋、柱筋常用',
  20: '梁筋、柱筋主力',
  22: '中大梁主筋、柱筋',
  25: '大梁主筋、柱筋、桩笼',
  28: '大梁主筋、转换梁',
  32: '大跨度重载主筋',
  36: '重型结构主筋（民用少见）',
  40: '大直径主筋（小工程少用）'
}
const tableRows = tableSizes.map((d) => ({
  d,
  w: weightPerMeterOf(d),
  tonM: countFromWeight(d, 1000),
  note: sizeNotes[d] || '通用'
}))

// ---------- 页面状态 ----------
const mode = ref('single')
const selD = ref(16)
const totalMInput = ref(100)
const reverseKgInput = ref(1000)
const pieces = ref([{ d: 16, count: 50, lengthM: 9 }])
const exportHint = ref('')
const printTime = ref('')
const seoContentVisible = ref(true)

// ---------- 派生计算 ----------
const perMeter = computed(() => weightPerMeterOf(selD.value))
const fwd = computed(() => metersWeightOf(selD.value, totalMInput.value))
const revMeters = computed(() => countFromWeight(selD.value, reverseKgInput.value))
const perTonMeters = computed(() => countFromWeight(selD.value, 1000))
const section = computed(() => sectionAreaOf(selD.value))
const listSum = computed(() => pieceListSumOf(pieces.value))

const formulaSubText = computed(() => {
  if (perMeter.value === null) return '直径超出 5-100 mm 有效范围'
  const d2 = selD.value * selD.value
  return `W = π/4 × ${selD.value}² × 7.85 ÷ 1000 = 0.00616538 × ${d2} = ${perMeter.value.toFixed(3)} kg/m ｜ 普及口径 0.00617 × ${d2} ≈ ${(LEGACY_COEFF * d2).toFixed(3)}`
})

function fmtNum(v, fallback) {
  return Number.isFinite(v) ? v : fallback
}

// ---------- 交互（浏览器 API 仅出现在回调中，SSR 安全） ----------
function pickSize(d) {
  selD.value = d
  mode.value = 'single'
}

function addPiece() {
  pieces.value.push({ d: 16, count: 1, lengthM: 9 })
}

function removePiece(idx) {
  pieces.value.splice(idx, 1)
}

function applyPresetFrame() {
  mode.value = 'list'
  exportHint.value = ''
  pieces.value = [
    { d: 12, count: 100, lengthM: 2 }, // Φ12 主筋：100 根 × 2m = 200 m
    { d: 6, count: 150, lengthM: 1 }  // Φ6 箍筋：150 根 × 1m = 150 m
  ]
}

function applyPresetTenTon() {
  mode.value = 'single'
  exportHint.value = ''
  selD.value = 25
  reverseKgInput.value = 10000
}

function exportCsv() {
  const blob = new Blob([csvTextOf(pieces.value)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '钢筋下料清单.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  exportHint.value = '已导出 CSV（含 BOM，Excel 双击可开）'
  setTimeout(() => { exportHint.value = '' }, 4000)
}

function printList() {
  printTime.value = new Date().toLocaleString('zh-CN', { hour12: false })
  mode.value = 'list'
  window.print()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('rebar-weight-calculator')
})
</script>

<style scoped>
/* 屏幕下隐藏打印区；打印时只输出小票清单 */
.rebar-print-only {
  display: none;
}
@media print {
  .rebar-print-hidden {
    display: none !important;
  }
  .rebar-print-only {
    display: block !important;
  }
}
</style>
