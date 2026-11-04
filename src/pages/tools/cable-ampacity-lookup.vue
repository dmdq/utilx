<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Cable class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电缆载流量速查</h1>
          <p class="text-sm text-muted-foreground mt-1">铜铝电线安全载流量表、截面正查反查、根数温度修正、空气开关档位匹配，家装与店铺选型速查</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线电缆载流量速查工具：内置 1.0-120mm² 常见铜芯 PVC 绝缘电线经验载流量表（明敷 / 穿管双列 + 铝芯 ×0.78 换算列），
        支持「选截面查电流」正查与「选电流 / 功率反推线径」反查双模式，自动叠加多管并行 ×0.8、35℃/40℃ 高温 ×0.9/×0.85 修正，
        并给出单相 / 三相可带功率参考与配套空开、漏保档位建议（标准档位 6/10/16/20/25/32/40/63A 吸附）。
        全部计算在浏览器本地完成，不上传任何数据，适合出租屋接线、商铺进户线、设备选型等场景快速核对。
      </p>
    </div>

    <!-- 显著免责条 -->
    <div class="mb-6 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <TriangleAlert class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <p class="text-sm leading-relaxed text-foreground">
        表内数值为常见 PVC 绝缘电线/电缆在 25-30℃ 环境下的经验参考值（综合国标口径与电工手册），不同敷设方式、温度、并行根数差异很大；正式工程以 GB/T 标准值与设计规范为准，本工具用于家庭与店铺场景快速选型。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 查询设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Cable class="w-5 h-5 mr-2 text-primary" /> 查询设置
        </h2>

        <!-- 模式切换 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="mode = 'forward'"
            class="px-3 py-2 rounded-lg border text-sm font-medium transition"
            :class="mode === 'forward' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
          >
            正查 · 截面→电流
          </button>
          <button
            @click="mode = 'reverse'"
            class="px-3 py-2 rounded-lg border text-sm font-medium transition"
            :class="mode === 'reverse' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
          >
            反查 · 电流→线
          </button>
        </div>

        <!-- 正查：截面积 -->
        <div v-if="mode === 'forward'">
          <p class="text-sm font-medium text-foreground mb-2">导线截面积（铜芯 / 铝芯 PVC 绝缘）</p>
          <select
            v-model.number="section"
            class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="row in AMPACITY_TABLE" :key="row.section" :value="row.section">
              {{ row.label }} mm²（铜明敷 {{ row.cuOpen }}A / 铜穿管 {{ row.cuPipe }}A）
            </option>
          </select>
        </div>

        <!-- 反查：电流 / 功率 -->
        <div v-else class="space-y-3">
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="revKind = 'current'"
              class="px-3 py-1.5 rounded-lg border text-xs font-medium transition"
              :class="revKind === 'current' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
            >
              输入负载电流 A
            </button>
            <button
              @click="revKind = 'power'"
              class="px-3 py-1.5 rounded-lg border text-xs font-medium transition"
              :class="revKind === 'power' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
            >
              输入功率 kW
            </button>
          </div>
          <div v-if="revKind === 'current'">
            <p class="text-sm font-medium text-foreground mb-2">负载电流（A）</p>
            <input
              v-model="revCurrentText"
              type="text"
              inputmode="decimal"
              placeholder="例如 18"
              class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div v-else class="space-y-2">
            <p class="text-sm font-medium text-foreground">负载功率（kW）</p>
            <input
              v-model="revPowerText"
              type="text"
              inputmode="decimal"
              placeholder="例如 15"
              class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="opt in PHASE_OPTIONS"
                :key="opt.id"
                @click="revPhase = opt.id"
                class="px-3 py-1.5 rounded-lg border text-xs font-medium transition"
                :class="revPhase === opt.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
              >
                {{ opt.label }}
              </button>
            </div>
            <p class="text-[10px] text-muted-foreground leading-relaxed">
              按 cosφ = 0.85 估算：单相 I = P ÷ (220×0.85)，三相 I = P ÷ (√3×380×0.85)。
              电机类负载请再考虑 4-7 倍启动冲击（选线按运行电流，空开选 D 型或加大一档）。
            </p>
          </div>
        </div>

        <div class="border-t border-border pt-3 space-y-3">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">敷设与修正（两模式共用）</p>

          <!-- 导体材质 -->
          <div>
            <p class="text-xs text-muted-foreground mb-1.5">导体材质</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="opt in MATERIAL_OPTIONS"
                :key="opt.id"
                @click="material = opt.id"
                class="px-3 py-1.5 rounded-lg border text-xs font-medium transition"
                :class="material === opt.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- 敷设方式 -->
          <div>
            <p class="text-xs text-muted-foreground mb-1.5">敷设方式</p>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="opt in WIRING_OPTIONS"
                :key="opt.id"
                @click="wiring = opt.id"
                class="px-2 py-1.5 rounded-lg border text-xs font-medium transition"
                :class="wiring === opt.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
              >
                {{ opt.label }}
              </button>
            </div>
            <p class="text-[10px] text-muted-foreground mt-1">埋地散热受土壤积聚限制，保守按穿管口径计。</p>
          </div>

          <!-- 并行根数 -->
          <div>
            <p class="text-xs text-muted-foreground mb-1.5">同管并行回路</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="opt in PARALLEL_OPTIONS"
                :key="opt.id"
                @click="parallel = opt.id"
                class="px-2 py-1.5 rounded-lg border text-xs font-medium transition"
                :class="parallel === opt.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- 环境温度 -->
          <div>
            <p class="text-xs text-muted-foreground mb-1.5">环境温度修正</p>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="opt in TEMP_OPTIONS"
                :key="opt.id"
                @click="temp = opt.id"
                class="px-2 py-1.5 rounded-lg border text-xs font-medium transition"
                :class="temp === opt.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>

        <button
          @click="resetAll"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置默认设置
        </button>
      </div>

      <!-- 结果区（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <!-- 正查结果 -->
        <div v-if="mode === 'forward'" class="space-y-4">
          <div class="bg-primary/10 rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">
              {{ MATERIAL_LABELS[material] }} {{ fmtLabel(section) }} mm² · {{ WIRING_LABELS[wiring] }}{{ parallel === 'bundle' ? ' · 2-4 根并行' : '' }} · {{ TEMP_LABELS[temp] }}
            </p>
            <p class="text-4xl font-bold text-primary">{{ forwardAmp }}<span class="text-lg font-semibold ml-1">A</span></p>
            <p class="text-xs text-muted-foreground mt-2 font-mono">{{ forwardChainText }}</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">可带功率参考 · 单相 220V（×0.9）</p>
              <p class="text-xl font-bold text-foreground">{{ forwardPower.singleKw }} kW</p>
              <p class="text-[10px] text-muted-foreground mt-1">约 {{ Math.round(forwardPower.singleKw * 1000 / 220) }} A 阻性负载上限</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">可带功率参考 · 三相 380V（√3×0.9）</p>
              <p class="text-xl font-bold text-foreground">{{ forwardPower.threeKw }} kW</p>
              <p class="text-[10px] text-muted-foreground mt-1">按 cosφ≈0.9 电机类负载估算</p>
            </div>
          </div>

          <p class="text-xs leading-relaxed p-3 rounded-lg bg-muted/60 text-foreground flex items-start gap-2">
            <CheckCircle v-if="forwardBreaker !== null" class="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <TriangleAlert v-else class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>
              <template v-if="forwardBreaker !== null">配套空开：额定不得大于修正后载流量，建议 C{{ forwardBreaker }}（≤ {{ forwardAmp }}A），插座 / 潮湿回路加 30mA 漏保。</template>
              <template v-else>修正后载流量不足 6A，已低于最小标准空开档位：请加大截面积或改善敷设条件。</template>
            </span>
          </p>
          <p v-if="forwardAmp > 63" class="text-xs text-muted-foreground leading-relaxed">
            提示：{{ forwardAmp }}A 已超出本工具 6-63A 微型断路器档位表，工程上应改用塑壳断路器（MCCB）并复核短路分断能力。
          </p>
        </div>

        <!-- 反查结果 -->
        <div v-else class="space-y-4">
          <div v-if="revRequiredA <= 0" class="bg-muted/50 rounded-lg p-5 text-center">
            <Info class="w-6 h-6 text-muted-foreground/60 mx-auto mb-2" />
            <p class="text-sm text-muted-foreground">在左侧输入负载电流（A）或功率（kW），即可反推最小截面积档、留余量建议与配套空开档位。</p>
          </div>

          <div v-else-if="revResult === null" class="rounded-lg p-5 bg-red-500/10 border border-red-500/20">
            <p class="text-sm font-medium text-foreground flex items-start gap-2">
              <TriangleAlert class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              所需 {{ revRequiredA }}A 已超出 120mm² 在当前敷设与修正下的载流量（{{ fmtLabel(120) }}mm² 修正后 {{ maxTableAmp }}A）：应改用汇流排、多缆并联并交专业电气设计核算。
            </p>
          </div>

          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-[10px] text-muted-foreground mb-1">最小满足档</p>
                <p class="text-2xl font-bold text-primary">{{ revResult.row.label }} mm²</p>
                <p class="text-[10px] text-muted-foreground mt-1">修正后 {{ revResult.amp }}A ≥ {{ revRequiredA }}A</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-[10px] text-muted-foreground mb-1">留余量上一档</p>
                <p class="text-2xl font-bold text-foreground">{{ revResult.next ? revResult.next.row.label + ' mm²' : '—' }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">{{ revResult.next ? '修正后 ' + revResult.next.amp + 'A，抗温升/启动更稳' : '已到表内最大档' }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-[10px] text-muted-foreground mb-1">配套空开建议</p>
                <p class="text-2xl font-bold" :class="revAdvise.insufficient ? 'text-red-500' : 'text-foreground'">
                  {{ revAdvise.rating === null ? '—' : 'C' + revAdvise.rating }}
                </p>
                <p class="text-[10px] text-muted-foreground mt-1">≥ {{ revRequiredA }}A 负载 且 ≤ 线载流量</p>
              </div>
            </div>

            <p class="text-xs leading-relaxed p-3 rounded-lg bg-muted/60 text-foreground flex items-start gap-2">
              <CheckCircle v-if="!revAdvise.useNext && !revAdvise.insufficient" class="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <TriangleAlert v-else class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span v-if="revAdvise.useNext">
                按最小档 {{ revResult.row.label }}mm² 吸附不出「≥ 负载电流且 ≤ 载流量」的标准档位，建议直接采用上一档 {{ revResult.next ? revResult.next.row.label : '' }}mm² 配 C{{ revAdvise.rating }}，避免负载满额时空开频繁跳闸。
              </span>
              <span v-else-if="revAdvise.insufficient">
                标准 6-63A 档位无法同时满足「≥ {{ revRequiredA }}A 负载」与「≤ 载流量」，请加大线径选用 C80 及以上塑壳断路器方案，或复核负载是否需要全部同时投运（需用系数）。
              </span>
              <span v-else>
                {{ revResult.row.label }}mm² 载流量 {{ revResult.amp }}A，选 C{{ revAdvise.rating }} 空开（落在 [{{ revRequiredA }}A, {{ revResult.amp }}A] 区间）：既能带住负载，又能在导线过载发热前跳闸保护线路。
              </span>
            </p>

            <p
              v-if="revRequiredA >= 5 && revResult.row.section <= 1.5"
              class="text-xs leading-relaxed p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-foreground flex items-start gap-2"
            >
              <Info class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              载流量上 {{ revResult.row.label }}mm² 够用，但空调、压缩机等电机类 / 插座分支回路按家装惯例应采用 2.5mm² 以上专线（兼顾机械强度、压降与启动冲击），空开配 C16-C20。
            </p>
            <p class="text-xs text-muted-foreground leading-relaxed">
              漏保提醒：插座回路、卫生间、室外及店铺营业场所建议在该空开下加装 30mA 剩余电流动作保护器；照明回路可不带漏保但建议双极断开。
            </p>
          </template>
        </div>

        <!-- 常见场景预设 -->
        <div class="border-t border-border pt-4">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">常见场景预设</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="p in PRESETS"
              :key="p.id"
              @click="applyPreset(p)"
              class="px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition"
            >
              <Play class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" /> {{ p.label }}<span class="text-muted-foreground">（{{ p.hint }}）</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 载流量速查表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 class="text-lg font-semibold flex items-center">
          <ListChecks class="w-5 h-5 mr-2 text-primary" /> 载流量速查表（铜芯 PVC · 25-30℃）
        </h2>
        <div class="relative">
          <Search class="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            v-model="tableSearch"
            type="text"
            inputmode="decimal"
            placeholder="过滤截面，如 2.5 / 10 / 95"
            class="w-full sm:w-60 pl-8 pr-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-muted-foreground border-b border-border">
              <th class="py-2 pr-4 font-medium">截面积</th>
              <th class="py-2 pr-4 font-medium">铜芯明敷</th>
              <th class="py-2 pr-4 font-medium">铜芯穿管</th>
              <th class="py-2 pr-4 font-medium">铝芯明敷（×0.78）</th>
              <th class="py-2 pr-4 font-medium">常用搭配</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in filteredRows"
              :key="row.section"
              @click="pickSectionFromTable(row.section)"
              class="border-b border-border/50 cursor-pointer hover:bg-muted/50 transition"
              :class="row.section === activeSection ? 'bg-primary/10' : ''"
            >
              <td class="py-2.5 pr-4 font-semibold text-foreground">
                {{ row.label }} mm²
                <span v-if="row.section === activeSection" class="ml-2 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium">当前查询</span>
              </td>
              <td class="py-2.5 pr-4 font-mono text-foreground">{{ row.cuOpen }} A</td>
              <td class="py-2.5 pr-4 font-mono text-foreground">{{ row.cuPipe }} A</td>
              <td class="py-2.5 pr-4 font-mono text-muted-foreground">{{ row.aluOpen }} A</td>
              <td class="py-2.5 pr-4 text-xs text-muted-foreground">{{ row.usageNote }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="filteredRows.length === 0" class="text-xs text-muted-foreground py-4 text-center">
          没有匹配「{{ tableSearch }}」的截面积档，试试 1.5、2.5、10、120 等数字。
        </p>
      </div>

      <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
        穿管列已含散热受限折减（约明敷 ×0.72），同管 2-4 路并行与高温修正请再在查询设置里叠加；点击任意行会带着该截面跳到正查模式。铝芯列为铜值 ×0.78 的经验换算。
      </p>
    </div>

    <!-- 口诀卡 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold mb-3 flex items-center">
        <Info class="w-5 h-5 mr-2 text-primary" /> 载流量估算口诀（铝线基准）
      </h2>
      <div class="bg-muted/50 rounded-lg p-4 mb-4 text-sm leading-7 text-foreground font-medium">
        <p>二点五下乘以九，往上减一顺号走；</p>
        <p>三十五乘三点五，五十为三、七十两点五；</p>
        <p>九十五上再减半，铜线升级算截面；</p>
        <p>穿管温度八九折，条件有变加折算。</p>
      </div>
      <ul class="list-disc list-inside space-y-1.5 text-xs text-muted-foreground leading-relaxed">
        <li>「二点五下乘以九」：铝芯绝缘线 2.5mm² 及以下按 截面×9 估（2.5→22.5A），「往上减一顺号走」即 4×8、6×7、10×6、16×5、25×4。</li>
        <li>「三十五乘三点五」：35mm² 按 ×3.5（约 122A）；50 按 ×3、70/95 按 ×2.5，更大截面系数再降。</li>
        <li>「铜线升级算」：同截面铜线约为铝线的 1.25 倍，工程口诀直接把铜线按上一档铝线算（铜 2.5 ≈ 铝 4 口径），本表铜明敷 2.5mm² 的 28A 即由此修订而来。</li>
        <li>「穿管温度八九折」：穿管散热差打八折左右，35℃/40℃ 高温环境打九折/八五折，与本工具修正链一致。</li>
        <li>注意：口诀为经验近似，用于心里有数；本表数值已综合 GB/T 口径与电工手册修订，精确选型以本表与正式规范为准。</li>
      </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>电缆载流量速查是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          电缆载流量速查是一面向家庭装修、出租屋接线与店铺电工的选型工具。它内置 1.0-120mm² 常见 PVC 绝缘电线的经验载流量表，
          提供两种查询方向：正查是给定截面积，叠加敷设方式（明敷/穿管/埋地）、同管并行根数与环境温度修正后，得到修正后安全载流量与可带功率参考；
          反查是给定负载电流或用功率（单相 220V / 三相 380V，cosφ=0.85）换算出的电流，反推最小满足的截面档，同时给出留余量的上一档建议，
          并按「额定 ≥ 负载电流且 ≤ 导线载流量」的口径在 6/10/16/20/25/32/40/63A 标准档位中吸附出配套空气开关。所有计算纯本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">载流量口诀怎么背？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          先记住铝线基准：2.5mm² 及以下乘 9，往上每档系数减 1（4×8、6×7、10×6、16×5、25×4），35 乘 3.5，50 乘 3，70/95 乘 2.5。
          铜线用「升级算」：同截面铜约为铝的 1.25 倍，口头上直接按上一档铝线取值。最后再打折扣：穿管约八折、35℃ 九折、40℃ 八五折，即「穿管温度八九折」。
          口诀只保证数量级正确，具体数字请回查本页速查表。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么穿管比明敷小？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          导线通电发热全靠表面向空气散热。明敷时空气自由对流，散热最好；穿入 PVC 管后热量积聚在管内，散热条件骤降，同等温升下允许电流大约只剩明敷的 72%；
          同一根管里再穿 2-4 路回路时，多根导线互相「烘」，还要再乘 0.8。埋地时土壤散热同样受限，保守按穿管口径计。温度越高，散热温差越小，所以 35℃、40℃ 还要再打九折、八五折。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">空气开关到底保护谁？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          空开保护的是导线，不是电器。选线顺序是：先按负载电流选出「载流量 ≥ 负载电流」的导线，再选一个额定电流不大于该导线载流量的空开——
          这样导线过载发热时，空开会先于绝缘层损坏跳闸。如果空开选得比线载流量大（例如 2.5mm² 穿管配 C32），跳闸前烧的会是墙里的线。
          反过来空开也不能小于负载电流，否则一开空调就跳。本工具反查模式就是按「≥ 负载、≤ 载流量」的区间在标准档位里吸附。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">铜线铝线怎么换算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          同截面下铝芯约为铜芯载流量的 0.78 倍（换个说法：铜比铝「大两成半」，或铜线按上一档铝线算）。
          例如铜 2.5mm² 明敷 28A，铝同档约 28×0.78≈22A；反过来铝 4mm² 大约相当于铜 2.5-3mm² 的口径。
          注意铝线接头易氧化发热，家装已很少用铝干线，临时延长线或入户旧线核查时按本表铝芯列估算即可。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">地线和零线选多粗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一句话规则：相线截面 ≤16mm² 时保护地线（PE）与零线同截面；16-35mm² 区间 PE 取 16mm²；大于 35mm² 时 PE 取相线的一半，单相回路零线始终与相线同截面，三相平衡回路的中性线可减小但不应低于上述规则。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">2.5 平方铜线能带多大电流？</h3>
            <p class="text-sm text-muted-foreground mt-1">本表口径：2.5mm² 铜芯 PVC 线明敷约 28A、穿管约 20A；若同管并 2-4 路再乘 0.8、35℃/40℃ 再乘 0.9/0.85，最严苛可降到 14A 左右。家用插座回路按穿管 20A 配 C20 空开是常见做法。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">空开和电线应该怎么互相匹配？</h3>
            <p class="text-sm text-muted-foreground mt-1">两步：先按负载电流选线，保证导线修正后载流量 ≥ 负载电流；再选额定 ≤ 导线载流量且 ≥ 负载电流的标准空开（6/10/16/20/25/32/40/63A）。反查模式下若最小档吸附不出合格档位，工具会直接建议上一档线材与对应空开。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">三相 15kW 设备用什么线？</h3>
            <p class="text-sm text-muted-foreground mt-1">按 cosφ=0.85 估算运行电流约 26.8A（15000 ÷ (√3×380×0.85)）。穿管单回路时 4mm²（25A）不够，6mm²（35A）满足，配套空开吸附 C32；若同管并行多路或夏季高温，请再按修正链复核，本工具「三相 15kW 设备」预设可一键验算。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">表里的数据能直接用于正式工程吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不能。本表为 25-30℃ 环境下的经验参考值（综合国标口径与电工手册），电缆型号（YJV/BV/BVR）、成束方式、土壤热阻等都会明显改变载流量；正式工程必须按 GB/T 40663、GB 50217 等标准值与设计规范核算，本工具用于家庭与店铺场景快速选型。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'cable-ampacity-lookup'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Cable, Search, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, ListChecks
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '电缆载流量速查 - 铜铝电线安全载流量表与空开匹配工具',
  description: '免费在线电缆载流量速查工具，铜芯PVC电线明敷/穿管安全载流量表，1.0-120mm²正查反查双模式，根数温度修正、电流功率互推、空气开关漏保档位匹配，家装店铺选型参考，纯浏览器本地运行不上传',
  keywords: '电缆载流量,电线安全电流,载流量表,铜线载流量,空气开关匹配',
  author: '有条工具',
  ogTitle: '电缆载流量速查 - 铜铝电线安全载流量表与空开匹配工具 | 有条工具',
  ogDescription: '铜铝电线载流量表，正查截面出电流、反查电流功率选线径，自动根数温度修正并匹配空开档位。',
  ogUrl: 'https://www.util.cn/tools/cable-ampacity-lookup',
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
          name: '电缆载流量速查',
          url: 'https://www.util.cn/tools/cable-ampacity-lookup',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['铜芯明敷/穿管与铝芯换算三列速查表', '截面→载流量正查与根数温度修正链', '电流/功率→最小截面档反查', '空开标准档位吸附与漏保提示', '单相三相可带功率参考', '常见场景一键预设', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '电缆载流量速查', item: 'https://www.util.cn/tools/cable-ampacity-lookup' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '2.5平方铜线能带多大电流？',
              acceptedAnswer: { '@type': 'Answer', text: '本表口径：2.5mm²铜芯PVC线明敷约28A、穿管约20A；同管并2-4路再乘0.8、35℃/40℃再乘0.9/0.85，最严苛可降到14A左右。家用插座回路按穿管20A配C20空开是常见做法。' }
            },
            {
              '@type': 'Question',
              name: '空气开关和电线应该怎么互相匹配？',
              acceptedAnswer: { '@type': 'Answer', text: '先按负载电流选线，保证导线修正后载流量不小于负载电流；再选额定不大于导线载流量且不小于负载电流的标准空开（6/10/16/20/25/32/40/63A）。空开保护的是导线而不是电器，档位大于载流量时先烧的是墙里的线。' }
            },
            {
              '@type': 'Question',
              name: '三相15kW设备用什么线？',
              acceptedAnswer: { '@type': 'Answer', text: '按cosφ=0.85估算运行电流约26.8A（15000÷(√3×380×0.85)）。穿管单回路时4mm²（25A）不够，6mm²（35A）满足，配套空开吸附C32；同管并行或高温环境请按修正链再复核。' }
            },
            {
              '@type': 'Question',
              name: '表里的数据能直接用于正式工程吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。表内数值为25-30℃环境下的经验参考值（综合国标口径与电工手册），电缆型号、成束方式、土壤热阻等都会明显改变载流量；正式工程须按GB/T标准值与设计规范核算，本工具用于家庭与店铺场景快速选型。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 数据构建逻辑（注释即口径）：
//   Step 1 铝基准：按口诀「二点五下乘以九，往上减一顺号走；三十五乘三点五，五十为三、七十两点五」估铝芯绝缘线明敷载流量
//          （铝 2.5 = 2.5×9 = 22.5A、铝 10 = 10×6 = 60A、铝 25 = 25×4 = 100A、铝 35 = 35×3.5 ≈ 122A…）；
//   Step 2 铜升级：同截面铜约为铝的 1.25 倍（口诀「铜线升级算」），22.5×1.25 ≈ 28 —— 即「2.5mm² 铜明敷 28A」的由来；
//   Step 3 PVC 修订：PVC 绝缘耐温与散热工况劣于口诀适用的橡胶/油纸类，中大截面按电工手册铜芯常用值下修
//          （铜 10mm² 65A、95mm² 240A、120mm² 280A 等），整表保证严格单调递增。
//   派生列：铜穿管 = 铜明敷 × 0.72（穿管散热受限折减，四舍五入），铝芯列 = 铜明敷 × 0.78（任务规定的铜铝换算口径）。
const PIPE_FACTOR = 0.72      // 穿管（含埋地保守口径）相对明敷的散热折减
const ALU_FACTOR = 0.78       // 同截面铝芯 ≈ 铜芯 × 0.78
const PARALLEL_FACTOR = 0.8   // 同管 2-4 根并行附加折减
const TEMP_FACTORS = { t30: 1.0, t35: 0.9, t40: 0.85 }
const BREAKER_RATINGS = [6, 10, 16, 20, 25, 32, 40, 63]  // 微型断路器标准档位
const SQRT3 = 1.7320508

// 铜芯明敷基准锚点（构建逻辑见上），label 为展示口径
const COPPER_OPEN_ANCHORS = [
  { section: 1, label: '1.0', cuOpen: 15 },
  { section: 1.5, label: '1.5', cuOpen: 20 },
  { section: 2.5, label: '2.5', cuOpen: 28 },
  { section: 4, label: '4', cuOpen: 35 },
  { section: 6, label: '6', cuOpen: 48 },
  { section: 10, label: '10', cuOpen: 65 },
  { section: 16, label: '16', cuOpen: 91 },
  { section: 25, label: '25', cuOpen: 115 },
  { section: 35, label: '35', cuOpen: 135 },
  { section: 50, label: '50', cuOpen: 165 },
  { section: 70, label: '70', cuOpen: 205 },
  { section: 95, label: '95', cuOpen: 240 },
  { section: 120, label: '120', cuOpen: 280 }
]

const USAGE_NOTES = [
  '照明/信号线', '照明主线', '插座专线 · C20', '厨房/空调专线', '即热热水器',
  '进户分支 · C40-C50', '商铺进户线', '小动力回路', '三相设备干线',
  '配电支线', '柜线主干', '低压主干', '大负荷进户'
]

function buildAmpacityTable() {
  return COPPER_OPEN_ANCHORS.map((r, i) => ({
    section: r.section,
    label: r.label,
    cuOpen: r.cuOpen,
    cuPipe: Math.round(r.cuOpen * PIPE_FACTOR),
    aluOpen: Math.round(r.cuOpen * ALU_FACTOR),
    usageNote: USAGE_NOTES[i]
  }))
}

const AMPACITY_TABLE = buildAmpacityTable()

function findRow(sec) {
  return AMPACITY_TABLE.find((r) => r.section === Number(sec)) || null
}

function fmtLabel(sec) {
  const row = findRow(sec)
  return row ? row.label : String(sec)
}

function round1(x) {
  return Math.round(x * 10) / 10
}

// 基础载流量（未叠加根数/温度修正）；wiring: 'open' | 'pipe'（埋地已归一到 pipe）
function baseAmpacityOf(sec, wiring, material) {
  const row = findRow(sec)
  if (!row) return 0
  if (material === 'alu') {
    return wiring === 'open' ? row.aluOpen : Math.round(row.cuPipe * ALU_FACTOR)
  }
  return wiring === 'open' ? row.cuOpen : row.cuPipe
}

function correctionFactorOf(parallel, temp) {
  return (parallel ? PARALLEL_FACTOR : 1) * (TEMP_FACTORS[temp] === undefined ? 1 : TEMP_FACTORS[temp])
}

// 修正后载流量：基础值 × 根数系数 × 温度系数（保留 1 位小数）
function correctedAmpacityOf(sec, ctx) {
  const base = baseAmpacityOf(sec, ctx.wiring, ctx.material)
  return round1(base * correctionFactorOf(ctx.parallel, ctx.temp))
}

function rowAfterRow(row) {
  const idx = AMPACITY_TABLE.indexOf(row)
  return idx >= 0 && idx < AMPACITY_TABLE.length - 1 ? AMPACITY_TABLE[idx + 1] : null
}

// 反查：给定所需电流与敷设上下文，返回最小满足档 + 上一档（留余量），超出表上限返回 null
function lookupSectionByCurrent(requiredA, ctx) {
  if (!(requiredA > 0)) return null
  for (const row of AMPACITY_TABLE) {
    const amp = correctedAmpacityOf(row.section, ctx)
    if (amp >= requiredA) {
      const nextRow = rowAfterRow(row)
      return {
        row,
        amp,
        next: nextRow ? { row: nextRow, amp: correctedAmpacityOf(nextRow.section, ctx) } : null
      }
    }
  }
  return null
}

// 空开档位吸附：取「额定 ≤ 导线载流量」的最大标准档位（载流量 ≥ 额定），低于 6A 无档返回 null
function pickBreakerOf(ampacity) {
  let best = null
  for (const r of BREAKER_RATINGS) {
    if (r <= ampacity && (best === null || r > best)) best = r
  }
  return best
}

// 配套建议：优先最小档（不升档），吸不出「≥ 负载且 ≤ 载流量」的档位时尝试上一档，仍不行标记 insufficient
function adviseBreaker(minAmp, nextAmp, requiredA) {
  const r = pickBreakerOf(minAmp)
  if (r !== null && r >= requiredA) return { rating: r, useNext: false, insufficient: false }
  if (nextAmp !== null) {
    const rn = pickBreakerOf(nextAmp)
    if (rn !== null && rn >= requiredA) return { rating: rn, useNext: true, insufficient: false }
  }
  return { rating: r === null ? nextAmp === null ? null : pickBreakerOf(nextAmp) : r, useNext: false, insufficient: true }
}

// 功率 → 电流（cosφ 0.85）：单相 220V / 三相 √3×380V
function currentFromPower(powerKw, phase) {
  if (!(powerKw > 0)) return 0
  const p = powerKw * 1000
  const COS_PHI = 0.85
  return phase === 'three'
    ? round1(p / (SQRT3 * 380 * COS_PHI))
    : round1(p / (220 * COS_PHI))
}

// 电流 → 可带功率参考：单相 220×A×0.9，三相 √3×380×A×0.9（kW，1 位小数）
function powerFromAmpacity(amp) {
  return {
    singleKw: round1((220 * amp * 0.9) / 1000),
    threeKw: round1((SQRT3 * 380 * amp * 0.9) / 1000)
  }
}

function parsePositive(text) {
  const n = Number(String(text).trim())
  return Number.isFinite(n) && n > 0 ? n : 0
}

function filterTableRows(query) {
  const q = String(query || '').trim()
  if (!q) return AMPACITY_TABLE
  return AMPACITY_TABLE.filter((r) => r.label.includes(q))
}

function isMonotonic(values) {
  for (let i = 1; i < values.length; i++) {
    if (!(values[i] > values[i - 1])) return false
  }
  return true
}
// ---------- 纯逻辑结束 ----------

// ---------- 选项常量 ----------
const WIRING_OPTIONS = [
  { id: 'open', label: '明敷' },
  { id: 'pipe', label: '穿管' },
  { id: 'direct', label: '埋地' }
]
const MATERIAL_OPTIONS = [
  { id: 'cu', label: '铜芯' },
  { id: 'alu', label: '铝芯' }
]
const PARALLEL_OPTIONS = [
  { id: 'single', label: '单回路 ×1.0' },
  { id: 'bundle', label: '2-4 根并行 ×0.8' }
]
const TEMP_OPTIONS = [
  { id: 't30', label: '≤30℃ ×1.0' },
  { id: 't35', label: '35℃ ×0.9' },
  { id: 't40', label: '40℃ ×0.85' }
]
const PHASE_OPTIONS = [
  { id: 'single', label: '单相 220V' },
  { id: 'three', label: '三相 380V' }
]
const WIRING_LABELS = { open: '明敷', pipe: '穿管', direct: '埋地（按穿管）' }
const MATERIAL_LABELS = { cu: '铜芯', alu: '铝芯' }
const TEMP_LABELS = { t30: '≤30℃', t35: '35℃', t40: '40℃' }

// ---------- 场景预设（期望值均已手算并进入断言） ----------
const PRESETS = [
  {
    id: 'rent-ac',
    label: '出租屋空调 1.5 匹',
    hint: '≈6A 穿管',
    settings: { mode: 'reverse', revKind: 'current', revCurrent: '6', revPower: '', revPhase: 'single', wiring: 'pipe', material: 'cu', parallel: 'single', temp: 't30' }
    // 手算：铜 1.0mm² 穿管 11A ≥ 6A → 最小档 1.0（11A），上一档 1.5；pickBreakerOf(11)=10 ≥ 6 → C10（UI 附电机类升档 2.5 提醒）
  },
  {
    id: 'shop-main',
    label: '商铺总闸 40A',
    hint: '进户线反查',
    settings: { mode: 'reverse', revKind: 'current', revCurrent: '40', revPower: '', revPhase: 'single', wiring: 'pipe', material: 'cu', parallel: 'single', temp: 't30' }
    // 手算：6mm² 穿管 35A < 40A，10mm² 穿管 47A ≥ 40A → 最小档 10（47A），上一档 16；pickBreakerOf(47)=40 ≥ 40 → C40
  },
  {
    id: 'three-15kw',
    label: '三相 15kW 设备',
    hint: '选线+空开',
    settings: { mode: 'reverse', revKind: 'power', revCurrent: '', revPower: '15', revPhase: 'three', wiring: 'pipe', material: 'cu', parallel: 'single', temp: 't30' }
    // 手算：I = 15000/(√3×380×0.85) ≈ 26.8A；4mm² 25A < 26.8A，6mm² 35A ≥ → 最小档 6；pickBreakerOf(35)=32 ≥ 26.8 → C32
  }
]

// ---------- 响应式状态 ----------
const mode = ref('forward')            // 'forward' | 'reverse'
const section = ref(2.5)               // 正查截面积 mm²
const wiring = ref('pipe')             // 'open' | 'pipe' | 'direct'
const material = ref('cu')             // 'cu' | 'alu'
const parallel = ref('single')         // 'single' | 'bundle'
const temp = ref('t30')                // 't30' | 't35' | 't40'
const revKind = ref('current')         // 'current' | 'power'
const revCurrentText = ref('')
const revPowerText = ref('')
const revPhase = ref('single')         // 'single' | 'three'
const tableSearch = ref('')
const seoContentVisible = ref(true)

// 两模式共用的敷设修正上下文（埋地归一到穿管口径）
const ampCtx = computed(() => ({
  wiring: wiring.value === 'open' ? 'open' : 'pipe',
  material: material.value,
  parallel: parallel.value === 'bundle',
  temp: temp.value
}))

// ---------- 正查派生 ----------
const forwardBase = computed(() => baseAmpacityOf(section.value, ampCtx.value.wiring, ampCtx.value.material))
const forwardAmp = computed(() => correctedAmpacityOf(section.value, ampCtx.value))
const forwardChainText = computed(() => {
  const parts = [`${forwardBase.value}A`]
  if (ampCtx.value.parallel) parts.push('×0.8(并行)')
  if (temp.value !== 't30') parts.push(`×${TEMP_FACTORS[temp.value]}(温度)`)
  return parts.join(' ') + ` = ${forwardAmp.value}A`
})
const forwardPower = computed(() => powerFromAmpacity(forwardAmp.value))
const forwardBreaker = computed(() => pickBreakerOf(forwardAmp.value))

// ---------- 反查派生 ----------
const revRequiredA = computed(() =>
  revKind.value === 'current'
    ? parsePositive(revCurrentText.value)
    : currentFromPower(parsePositive(revPowerText.value), revPhase.value)
)
const revResult = computed(() => lookupSectionByCurrent(revRequiredA.value, ampCtx.value))
const revAdvise = computed(() => {
  const fallback = { rating: null, useNext: false, insufficient: true }
  if (!revResult.value) return fallback
  return adviseBreaker(
    revResult.value.amp,
    revResult.value.next ? revResult.value.next.amp : null,
    revRequiredA.value
  )
})
const maxTableAmp = computed(() => correctedAmpacityOf(120, ampCtx.value))

// ---------- 速查表派生 ----------
const filteredRows = computed(() => filterTableRows(tableSearch.value))
const activeSection = computed(() =>
  mode.value === 'forward' ? section.value : revResult.value ? revResult.value.row.section : null
)

// ---------- 交互 ----------
function pickSectionFromTable(sec) {
  mode.value = 'forward'
  section.value = sec
}

function applyPreset(p) {
  mode.value = p.settings.mode
  revKind.value = p.settings.revKind
  revCurrentText.value = p.settings.revCurrent
  revPowerText.value = p.settings.revPower
  revPhase.value = p.settings.revPhase
  wiring.value = p.settings.wiring
  material.value = p.settings.material
  parallel.value = p.settings.parallel
  temp.value = p.settings.temp
}

function resetAll() {
  mode.value = 'forward'
  section.value = 2.5
  wiring.value = 'pipe'
  material.value = 'cu'
  parallel.value = 'single'
  temp.value = 't30'
  revKind.value = 'current'
  revCurrentText.value = ''
  revPowerText.value = ''
  revPhase.value = 'single'
  tableSearch.value = ''
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('cable-ampacity-lookup')
})
</script>
