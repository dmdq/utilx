<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BatteryCharging class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电池串联并联计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">锂电池组 S 串 P 并电压容量换算、组阵图示、目标反查与 BMS 选档，电动车/储能/航模/UPS 玩家必备</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线电池组串并联计算器：选择单体类型（三元锂 / 磷酸铁锂 / 钛酸锂 / 自定义电压容量），拖动串联数 S 与并联数 P，
        即时算出组电压（标称 / 满电 / 截止三值）、总容量 Ah 与总能量 Wh，并用 S×P 网格图一眼看清 13S4P 到底长什么样；
        还提供常用组合一键载入、目标电压容量反查串并、BMS 安培档推荐与度电成本估算。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 安全提示条（显著） -->
    <div class="bg-red-500/10 border border-red-500/25 rounded-lg p-4 mb-6 flex items-start gap-3">
      <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <p class="text-sm text-foreground font-medium leading-relaxed">
        组电池涉及短路/过放/均衡风险：本工具只做数学换算；组装请配 BMS（保护板）并按容量匹配均衡，锂电事故不可逆，新手先学后玩。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 单体与串并配置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <BatteryCharging class="w-5 h-5 mr-2 text-primary" /> 单体与组阵
        </h2>

        <div>
          <label class="text-sm font-medium text-foreground block mb-1.5">单体类型</label>
          <select
            v-model="cellType"
            @change="onCellTypeChange"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="nmc">三元锂 NMC（3.7V · 满电 4.2V）</option>
            <option value="lfp">磷酸铁锂 LFP（3.2V · 满电 3.65V）</option>
            <option value="lto">钛酸锂 LTO（2.4V · 循环上万次）</option>
            <option value="custom">自定义电压 / 容量</option>
          </select>
        </div>

        <div v-if="cellType === 'custom'" class="grid grid-cols-3 gap-2">
          <div>
            <label class="text-xs text-muted-foreground block mb-1">标称 V</label>
            <input v-model.number="customVoltages.nominal" type="number" step="0.01" min="0.5" max="10"
              class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs text-muted-foreground block mb-1">满电 V</label>
            <input v-model.number="customVoltages.full" type="number" step="0.01" min="0.5" max="10"
              class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs text-muted-foreground block mb-1">截止 V</label>
            <input v-model.number="customVoltages.cutoff" type="number" step="0.01" min="0.5" max="10"
              class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        <div>
          <label class="text-sm font-medium text-foreground block mb-1.5">单体容量 Ah<span class="text-xs text-muted-foreground font-normal ml-1.5">（18650 常见 2.6Ah）</span></label>
          <input v-model.number="cellAh" type="number" step="0.1" min="0.1"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-foreground">串联数 S（升电压）</label>
            <span class="text-sm font-bold text-primary font-mono">{{ effSeries }} 串</span>
          </div>
          <input v-model.number="series" type="range" min="1" max="24" step="1" class="w-full accent-[var(--primary,#2563eb)]" />
          <p v-if="series !== effSeries" class="text-xs text-red-600 mt-1">串联数超出范围，已钳制为 {{ effSeries }}（合法 1–24）</p>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-foreground">并联数 P（升容量）</label>
            <span class="text-sm font-bold text-primary font-mono">{{ effParallel }} 并</span>
          </div>
          <input v-model.number="parallel" type="range" min="1" max="16" step="1" class="w-full accent-[var(--primary,#2563eb)]" />
          <p v-if="parallel !== effParallel" class="text-xs text-red-600 mt-1">并联数超出范围，已钳制为 {{ effParallel }}（合法 1–16）</p>
        </div>

        <button
          @click="applyDefaults"
          class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认 13S4P 三元
        </button>
      </div>

      <!-- 计算结果 + 组阵图示（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Grid3x3 class="w-5 h-5 mr-2 text-primary" /> {{ effSeries }}S{{ effParallel }}P 电池组结果
        </h2>

        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="bg-primary/10 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">标称组电压</p>
            <p class="text-xl font-bold text-primary font-mono">{{ packVolts.nominal }} V</p>
          </div>
          <div class="bg-green-500/10 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">满电电压</p>
            <p class="text-xl font-bold text-green-600 font-mono">{{ packVolts.full }} V</p>
          </div>
          <div class="bg-amber-500/10 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">截止（欠压保护）</p>
            <p class="text-xl font-bold text-amber-600 font-mono">{{ packVolts.cutoff }} V</p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">总容量</p>
            <p class="text-xl font-bold text-foreground font-mono">{{ totalAh }} Ah</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">总能量</p>
            <p class="text-xl font-bold text-foreground font-mono">{{ totalWh }} Wh</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">单体节数</p>
            <p class="text-xl font-bold text-foreground font-mono">{{ cellCount }} 节</p>
          </div>
        </div>
        <p class="text-[11px] text-muted-foreground -mt-2">※ 能量按标称电压计（总能量 = 标称组电压 × 总容量）；满电/截止电压为常见 BMS 整定值参考。</p>

        <div class="border border-border rounded-lg p-3 bg-background overflow-x-auto">
          <div v-html="packSvgHtml"></div>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          组阵图示：纵向每行是一串（串联升压），横向每格与同行其余格并联（并联升容）。上限绘制 8 串 × 12 并，超出部分以「省略」注记代替。
        </p>
      </div>
    </div>

    <!-- 常用组合卡 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold mb-3 flex items-center">
        <Play class="w-5 h-5 mr-2 text-primary" /> 常用组合（点击载入）
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          v-for="preset in PRESET_PACKS"
          :key="preset.name"
          @click="loadPreset(preset)"
          class="bg-muted/40 hover:bg-muted/70 border border-border rounded-lg p-3 text-left transition"
        >
          <p class="text-sm font-semibold text-foreground">{{ preset.name }}</p>
          <p class="text-[11px] text-muted-foreground mt-1 leading-snug">{{ preset.use }}</p>
          <p class="text-[11px] text-primary font-mono mt-1.5">{{ preset.cellLabel }} · {{ preset.s }}S{{ preset.p }}P</p>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 目标反查卡（核心） -->
      <div class="lg:col-span-1 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Info class="w-5 h-5 mr-2 text-primary" /> 目标反查：要多串多并？
        </h2>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-muted-foreground block mb-1">目标电压 V</label>
            <input v-model.number="targetVoltage" type="number" step="0.1"
              class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs text-muted-foreground block mb-1">目标容量 Ah</label>
            <input v-model.number="targetAh" type="number" step="0.1"
              class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>
        <div>
          <label class="text-xs text-muted-foreground block mb-1">反查用单体</label>
          <select
            v-model="reverseCellKey"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="opt in reverseCellOptions" :key="opt.key" :value="opt.key">{{ opt.label }}</option>
          </select>
        </div>

        <div v-if="reverseResult" class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">推荐方案（S=round，P=ceil）</p>
          <p class="text-2xl font-bold text-primary font-mono">{{ reverseResult.s }}S{{ reverseResult.p }}P</p>
          <p class="text-xs text-muted-foreground mt-1.5">
            实际达成 {{ reverseResult.nominalV }} V / {{ reverseResult.totalAh }} Ah，
            偏差 {{ reverseResult.vDevPct > 0 ? '+' : '' }}{{ reverseResult.vDevPct }}%（电压）· {{ reverseResult.ahDevPct > 0 ? '+' : '' }}{{ reverseResult.ahDevPct }}%（容量）
          </p>
          <p v-if="reverseResult.pClamped" class="text-xs text-amber-600 mt-1">并联已到 16 上限，容量仍不足——请换更大容量单体。</p>
        </div>

        <div v-if="reversePlans.length">
          <p class="text-xs text-muted-foreground font-medium mb-1.5">电压容差 ±1 串对比</p>
          <div class="space-y-1.5">
            <div
              v-for="plan in reversePlans"
              :key="plan.s"
              class="flex items-center justify-between text-sm px-3 py-2 rounded-lg border"
              :class="plan.best ? 'bg-green-500/10 border-green-500/25' : 'bg-muted/40 border-border'"
            >
              <span class="font-mono text-foreground">{{ plan.s }}S → {{ plan.v }} V</span>
              <span class="flex items-center gap-1.5 text-xs font-mono" :class="plan.best ? 'text-green-600' : 'text-muted-foreground'">
                <CheckCircle v-if="plan.best" class="w-3.5 h-3.5" />
                {{ plan.dev > 0 ? '+' : '' }}{{ plan.dev }}%
              </span>
            </div>
          </div>
        </div>
        <p class="text-[11px] text-muted-foreground leading-relaxed">口径：S 取四舍五入最接近目标电压；P 向上取整保证容量不低于目标（宁大勿小）。</p>
      </div>

      <!-- BMS 建议卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Zap class="w-5 h-5 mr-2 text-primary" /> BMS 保护板选档
        </h2>
        <div>
          <label class="text-xs text-muted-foreground block mb-1">负载功率 W</label>
          <input v-model.number="loadWatts" type="number" step="10" min="0"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label class="text-xs text-muted-foreground block mb-1">组电压 V（默认跟随上方结果）</label>
          <div class="flex gap-2">
            <input v-model.number="bmsVoltage" type="number" step="0.1" min="1" @input="bmsVoltageManual = true"
              class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <button
              @click="syncBmsVoltage"
              class="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm text-foreground transition"
              title="取当前组标称电压"
            >
              <Zap class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="bmsResult" class="bg-muted/50 rounded-lg p-4 space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">持续电流 I = P ÷ V</span>
            <span class="font-bold font-mono text-foreground">{{ bmsResult.currentA }} A</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">推荐下限 ≥1.5×I（吸附标准档位）</span>
            <span class="font-mono text-foreground">{{ bmsResult.requiredA }} A</span>
          </div>
          <div class="pt-2 border-t border-border">
            <p v-if="bmsResult.tier" class="text-lg font-bold text-primary flex items-center gap-2">
              <CheckCircle class="w-5 h-5" /> 建议 BMS {{ bmsResult.tier }}A 档
            </p>
            <p v-else class="text-sm font-semibold text-red-600 flex items-start gap-1.5">
              <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" /> 超过 200A 标准序列上限：请改多组并联 BMS 或直接按控制器峰值选工业保护。
            </p>
          </div>
        </div>
        <p class="text-[11px] text-muted-foreground leading-relaxed">
          同口：充放电共用一个端口，接线简单，电动车常见；分口：充电与放电各走一路，适合大电流并联充电的储能场景。连续电流按 I=P÷V 估算，短时峰值另计。
        </p>
      </div>

      <!-- 能量费用小卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 度电成本估算
        </h2>
        <div class="bg-muted/50 rounded-lg p-3 flex items-center justify-between text-sm">
          <span class="text-muted-foreground">本组总能量</span>
          <span class="font-bold font-mono text-foreground">{{ totalWh }} Wh</span>
        </div>
        <div>
          <label class="text-xs text-muted-foreground block mb-1">循环次数（默认按类型联动）</label>
          <input v-model.number="cycles" type="number" step="50" min="1"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label class="text-xs text-muted-foreground block mb-1">电池组价格 元</label>
          <input v-model.number="packPrice" type="number" step="10" min="0"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>

        <div v-if="costResult" class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">全生命周期总放电</p>
          <p class="text-lg font-bold text-foreground font-mono">{{ costResult.totalKwh }} kWh</p>
          <p class="text-xs text-muted-foreground mt-2 mb-1">度电成本</p>
          <p class="text-2xl font-bold text-primary font-mono">{{ costResult.costPerKwh }} 元/kWh</p>
        </div>
        <p v-else class="text-xs text-muted-foreground">填入价格与循环次数即可估算度电成本。</p>
        <p class="text-[11px] text-muted-foreground leading-relaxed">旁注：粗估口径 = 价格 ÷（总能量 × 循环次数），不含衰减与放电深度（DOD）修正，实际寿命内放电量通常更低。</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>电池串联并联计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          锂电池组由「串联（S）升压、并联（P）升容」两种基本组合构成：N 个单体串联，电压相加、容量不变；
          M 组再并联，容量相加、电压不变。本工具把 S、P 两个自由度交给滑块，实时输出组电压三值（标称 / 满电 / 截止）、总容量与总能量，
          并用 S×P 网格把 13S4P、16S5P 这类术语直接画出来——纵向 13 行是 13 串，横向 4 列是 4 并，每格就是一个带电压色块的单体。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">串联升压、并联升容（配合图示理解）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一句话：串联是「电池首尾相接，电压叠加」，并联是「同名端并排连接，容量叠加」。看图时记住网格的方向约定——一行（纵向一串）电压是单体的 S 倍，
          同一行里的每一格都能独立通过电流，所以横向的 P 决定容量。48V 电动车常见的 13S4P 用 2.6Ah 的 18650，就是 3.7×13=48.1V、2.6×4=10.4Ah。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">锂电池电压平台为什么不是「标称」？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          锂电池的放电曲线中段很平，厂商标称值取的是平台电压（三元 3.7V、铁锂 3.2V、钛酸 2.4V），而不是最高或最低：满电电压（4.2 / 3.65 / 2.85V）是充电上限，
          超过就析锂、鼓包；截止电压（三元组常整定在每串 3.0–3.2V，本工具按电动车 BMS 常见的 3.2V 口径给出）是放电下限，继续放会过放报废。
          所以「48V 锂电池」实际工作在约 41.6V–54.6V 区间，配控制器、充电器都要按这个区间核对。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">BMS（保护板）为什么必须？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          多串电池组里没有任何一节单体天生和邻居一致：内阻、容量、自放电都有差异，充放久了就会有一节先过充或先过放。
          BMS 的均衡功能把每串电压拉回同一水平，过充 / 过放 / 过流 / 短路 / 温度五道保护则是在异常时直接切断回路。
          选档先看持续电流：I≈功率÷组电压，再按 1.5 倍余量吸附标准档位序列（20/30/40/60/80/100/150/200A）。不装 BMS 的组电池相当于一颗没有保险丝的炸弹。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">18650 组电池常见容量偏差与分容</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          拆机 18650 或同型号新电芯，实际容量常有 ±5%–15% 偏差，内阻差异更大。木桶效应：并联组里最小的一节决定整组表现，
          所以组装前要做「分容」——逐节放电容量化分档，同档同组使用；焊接用镍片、点焊而非锡焊（大电流发热损伤电芯封胶），
          单体之间留散热间隙并热缩成排。旧电芯重组的组电池能量、循环都要打折看待。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">磷酸铁锂和三元怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          三元锂能量密度高（同体积更轻、电压平台 3.7V 串数少）、低温表现好，适合电动车、航模等对重量敏感的场合；
          磷酸铁锂循环寿命长（2000 次以上）、热稳定性好、便宜，适合储能、UPS、太阳能等按空间不按克重计的场景；
          钛酸锂循环上万次、宽温大倍率，但能量密度最低且贵。本工具循环次数默认值（三元 500 / 铁锂 2000 / 钛酸 10000）正是度电成本差异的主因。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">13S4P 用 2.6Ah 单体，电压容量是多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">13 串×3.7V＝48.1V 标称，满电 54.6V、截止 41.6V；4 并×2.6Ah＝10.4Ah；总能量按标称口径约 48.1×10.4≈500Wh。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">想配 48V 20Ah，该选多少串多少并？</h3>
            <p class="text-sm text-muted-foreground mt-1">用 3.7V/2.6Ah 单体：串数 round(48÷3.7)=13，并数 ceil(20÷2.6)=8，即 13S8P，实际达成 48.1V / 20.8Ah（容量宁大勿小，向上取整）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">BMS 安培数怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1">先算持续电流 I≈负载功率÷组电压，再取 ≥1.5×I 的档位并按 20/30/40/60/80/100/150/200A 序列向上吸附；电动车 500W/48V 约 10.4A，1.5 倍为 15.6A，选 20A 档即可起步。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'battery-pack-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  BatteryCharging, Zap, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Grid3x3
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '电池串联并联计算器 - 锂电池组串并电压容量在线计算',
  description: '免费在线电池串联并联计算器：三元/铁锂/钛酸/自定义单体，S 串 P 并即时算组电压（标称/满电/截止）、总容量与 Wh 能量，13S4P 组阵图示、常用组合载入、目标电压容量反查、BMS 安培档推荐与度电成本估算，纯浏览器本地运行不上传',
  keywords: '电池串联并联,锂电池组计算,18650 组电池,电池包容量计算,串并电压容量',
  author: '有条工具',
  ogTitle: '电池串联并联计算器 - 锂电池组串并电压容量在线计算 | 有条工具',
  ogDescription: 'S 串 P 并电压容量换算、组阵图示、目标反查、BMS 选档与度电成本估算，电动车/储能/航模/UPS 玩家必备。',
  ogUrl: 'https://www.util.cn/tools/battery-pack-calculator',
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
          name: '电池串联并联计算器',
          url: 'https://www.util.cn/tools/battery-pack-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['S/P 串并组电压三值与容量能量计算', 'S×P 组阵 SVG 网格图示', '8 组常用电池组合一键载入', '目标电压容量反查串并方案', 'BMS 安培档推荐（≥1.5×I 吸附）', '度电成本估算', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '电池串联并联计算器', item: 'https://www.util.cn/tools/battery-pack-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '13S4P 用 2.6Ah 单体，电压容量是多少？',
              acceptedAnswer: { '@type': 'Answer', text: '13 串×3.7V=48.1V 标称，满电 54.6V、截止 41.6V；4 并×2.6Ah=10.4Ah；总能量按标称口径约 48.1×10.4≈500Wh。' }
            },
            {
              '@type': 'Question',
              name: '想配 48V 20Ah，该选多少串多少并？',
              acceptedAnswer: { '@type': 'Answer', text: '用 3.7V/2.6Ah 单体：串数 round(48÷3.7)=13，并数 ceil(20÷2.6)=8，即 13S8P，实际达成 48.1V/20.8Ah（容量宁大勿小，向上取整）。' }
            },
            {
              '@type': 'Question',
              name: 'BMS 安培数怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '先算持续电流 I≈负载功率÷组电压，再取不小于 1.5×I 的档位，按 20/30/40/60/80/100/150/200A 序列向上吸附；电动车 500W/48V 约 10.4A，1.5 倍为 15.6A，选 20A 档起步。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const round2 = (x) => Math.round(x * 100) / 100
const round1 = (x) => Math.round(x * 10) / 10

// 输入钳制：非数字回落到下限，越界钳到边界（S:1-24 / P:1-16 统一口径）
function clampInt(v, min, max) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

// 单体类型常量：cutoff 取电动车 BMS 常见整定口径（三元 3.2V/节，13S 即 41.6V）
const CELL_TYPES = {
  nmc: { id: 'nmc', name: '三元锂 NMC', nominal: 3.7, full: 4.2, cutoff: 3.2, ah: 2.6, cycles: 500 },
  lfp: { id: 'lfp', name: '磷酸铁锂 LFP', nominal: 3.2, full: 3.65, cutoff: 2.5, ah: 2.8, cycles: 2000 },
  lto: { id: 'lto', name: '钛酸锂 LTO', nominal: 2.4, full: 2.85, cutoff: 1.7, ah: 5.0, cycles: 10000 },
  custom: { id: 'custom', name: '自定义单体', nominal: 3.7, full: 4.2, cutoff: 3.0, ah: 2.6, cycles: 500 }
}

// 非法/空输入消毒：电压 0.5–10V、容量 0.1–200Ah，并保证 满电≥标称≥截止
function sanitizeCell(cell) {
  const v = (x, d) => {
    const n = Number(x)
    return Number.isFinite(n) ? Math.min(10, Math.max(0.5, n)) : d
  }
  const nominal = v(cell.nominal, 3.7)
  const full = Math.max(nominal, v(cell.full, 4.2))
  const cutoff = Math.min(nominal, v(cell.cutoff, 3.0))
  const nAh = Number(cell.ah)
  const ah = Number.isFinite(nAh) ? Math.min(200, Math.max(0.1, nAh)) : 2.6
  return { nominal, full, cutoff, ah }
}

// 组电压三值：串联相加
function packVoltage(s, cell) {
  const n = clampInt(s, 1, 24)
  return {
    nominal: round2(n * cell.nominal),
    full: round2(n * cell.full),
    cutoff: round2(n * cell.cutoff)
  }
}

// 总容量：并联相加
function packCapacity(p, cell) {
  return round2(clampInt(p, 1, 16) * cell.ah)
}

// 总能量（Wh）：能量按标称电压计 = 标称组电压 × 总容量
function packEnergyWh(s, p, cell) {
  return round2(clampInt(s, 1, 24) * cell.nominal * clampInt(p, 1, 16) * cell.ah)
}

// 目标反查：S=round(目标V/单体标称)，P=ceil(目标Ah/单体Ah)（容量宁大勿小），并给出达成值与偏差
function suggestPack(targetV, targetAh, cell) {
  const v = Number(targetV)
  const a = Number(targetAh)
  if (!Number.isFinite(v) || !Number.isFinite(a) || v <= 0 || a <= 0) return null
  const s = clampInt(Math.round(v / cell.nominal), 1, 24)
  const pRaw = Math.ceil(a / cell.ah)
  const p = clampInt(pRaw, 1, 16)
  const nominalV = round2(s * cell.nominal)
  const totalAh = round2(p * cell.ah)
  return {
    s,
    p,
    pClamped: pRaw > 16,
    nominalV,
    totalAh,
    vDevPct: round1((nominalV - v) / v * 100),
    ahDevPct: round1((totalAh - a) / a * 100)
  }
}

// 电压容差 ±1 串对比：取 S0-1 / S0 / S0+1 中合法的方案，标注最接近目标者
function voltagePlans(targetV, cell) {
  const v = Number(targetV)
  if (!Number.isFinite(v) || v <= 0) return []
  const s0 = clampInt(Math.round(v / cell.nominal), 1, 24)
  const plans = []
  for (let s = Math.max(1, s0 - 1); s <= Math.min(24, s0 + 1); s++) {
    const nv = round2(s * cell.nominal)
    plans.push({ s, v: nv, dev: round1((nv - v) / v * 100) })
  }
  const minAbs = Math.min(...plans.map((p) => Math.abs(p.dev)))
  return plans.map((p) => ({ ...p, best: Math.abs(p.dev) === minAbs }))
}

// BMS 标准档位序列（A）
const BMS_TIERS = [20, 30, 40, 60, 80, 100, 150, 200]
// 推荐档位吸附口径：持续电流 I=负载W/组V，取 ≥1.5×I 的最小标准档（1.5 倍留短时过载/峰值余量）
function pickBmsAmps(loadWatts, voltage) {
  const w = Number(loadWatts)
  const v = Number(voltage)
  if (!Number.isFinite(w) || !Number.isFinite(v) || w <= 0 || v <= 0) return null
  const current = w / v
  const required = current * 1.5
  const tier = BMS_TIERS.find((t) => t >= required) ?? null
  return { currentA: round1(current), requiredA: round1(required), tier }
}

// 度电成本：价格 ÷（总Wh × 循环次数 ÷ 1000）；不含衰减与 DOD 修正
function energyCost(whTotal, cycleTimes, priceYuan) {
  const wh = Number(whTotal)
  const c = Number(cycleTimes)
  const price = Number(priceYuan)
  if (!Number.isFinite(wh) || !Number.isFinite(c) || !Number.isFinite(price)) return null
  if (wh <= 0 || c <= 0 || price <= 0) return null
  const totalKwh = (wh * c) / 1000
  return { totalKwh: round2(totalKwh), costPerKwh: round2(price / totalKwh) }
}

// XML/SVG 文本转义：单体标签等外部字符串进入 SVG 前必须过一遍
function escapeXml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]))
}

// 单体色块颜色：按标称电压区间区分类型（LTO 紫 / LFP 青 / NMC 蓝 / 其余红警示）
function cellFillColor(nominal) {
  const n = Number(nominal)
  if (!Number.isFinite(n)) return '#64748b'
  if (n < 2.9) return '#8b5cf6'
  if (n < 3.45) return '#0d9488'
  if (n < 3.95) return '#2563eb'
  return '#dc2626'
}

// 组阵上限：超出即简化为「省略」注记，防止 SVG 过大
const SVG_MAX_ROWS = 8   // 最多画 8 串
const SVG_MAX_COLS = 12  // 最多画 12 并

// S×P 组阵图示：纵向=串联（每行一串），横向=并联（每格一节），返回转义安全的 SVG 字符串
function packSvg(sRaw, pRaw, cellLabel) {
  const s = clampInt(sRaw, 1, 24)
  const p = clampInt(pRaw, 1, 16)
  const rows = Math.min(s, SVG_MAX_ROWS)
  const cols = Math.min(p, SVG_MAX_COLS)
  const label = escapeXml(cellLabel == null || cellLabel === '' ? '单体' : cellLabel)
  const labelNum = /([\d.]+)/.exec(String(cellLabel))
  const color = cellFillColor(labelNum ? labelNum[1] : null)

  const cw = 52
  const ch = 26
  const gx = 6
  const gy = 8
  const padL = 62
  const padT = 24
  const padR = 14
  const padB = 40
  const width = padL + cols * (cw + gx) - gx + padR
  const height = padT + rows * (ch + gy) - gy + padB

  const aria = escapeXml(s + 'S' + p + 'P 组阵图示')
  const parts = []
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="${aria}">`)
  parts.push(`<text x="${padL}" y="15" font-size="11" fill="#64748b">横向 ${p} 并 · 纵向 ${s} 串</text>`)
  if (p > cols) parts.push(`<text x="${width - padR}" y="15" font-size="11" fill="#94a3b8" text-anchor="end">⋯省略 ${p - cols} 并</text>`)

  for (let r = 0; r < rows; r++) {
    const y = padT + r * (ch + gy)
    parts.push(`<text x="6" y="${y + ch / 2 + 4}" font-size="10" fill="#64748b">第 ${r + 1} 串</text>`)
    for (let c = 0; c < cols; c++) {
      const x = padL + c * (cw + gx)
      parts.push(`<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="4" fill="${color}" fill-opacity="0.16" stroke="${color}" stroke-width="1.2"/>`)
      parts.push(`<text x="${x + cw / 2}" y="${y + ch / 2 + 4}" font-size="11" fill="${color}" text-anchor="middle">${label}</text>`)
    }
  }

  const footerY = padT + rows * (ch + gy) - gy + 18
  if (s > rows) parts.push(`<text x="${padL}" y="${footerY}" font-size="11" fill="#94a3b8">⋯省略 ${s - rows} 串</text>`)
  parts.push(`<text x="${padL}" y="${height - 8}" font-size="11" fill="#64748b">共 ${s}S${p}P = ${s * p} 节 · 色块=单体电压</text>`)
  parts.push('</svg>')
  return parts.join('')
}

// 常用组合（纯常量）：点击载入类型 + S + P；电压为标称口径手算值
const PRESET_PACKS = [
  { name: '13S4P · 48V', use: '新国标电动自行车 48V 锂电', cell: 'nmc', s: 13, p: 4, cellLabel: '三元 3.7V/2.6Ah' },
  { name: '14S4P · 52V', use: '电摩提速常见 52V 组', cell: 'nmc', s: 14, p: 4, cellLabel: '三元 3.7V/2.6Ah' },
  { name: '16S5P · 60V', use: '电动三轮车 60V 铅改锂', cell: 'nmc', s: 16, p: 5, cellLabel: '三元 3.7V/2.6Ah' },
  { name: '4S8P · 12V', use: '太阳能/房车 12V 铅酸替代', cell: 'lfp', s: 4, p: 8, cellLabel: '铁锂 3.2V/2.8Ah' },
  { name: '8S4P · 24V', use: '24V 储能与基站备电', cell: 'lfp', s: 8, p: 4, cellLabel: '铁锂 3.2V/2.8Ah' },
  { name: '15S8P · 48V', use: '家储逆变器 48V 平台', cell: 'lfp', s: 15, p: 8, cellLabel: '铁锂 3.2V/2.8Ah' },
  { name: '6S2P · 22.2V', use: 'FPV 穿越机 6S 高倍率', cell: 'nmc', s: 6, p: 2, cellLabel: '三元 3.7V/2.6Ah' },
  { name: '10S10P · 37V', use: '机架式 UPS ≈36V 铅酸等效', cell: 'nmc', s: 10, p: 10, cellLabel: '三元 3.7V/2.6Ah' }
]

// 反查预设单体（key → 标称电压/容量），'link' 联动主计算器当前单体
const REVERSE_CELLS = [
  { key: 'nmc26', label: '三元 3.7V / 2.6Ah（18650）', nominal: 3.7, ah: 2.6 },
  { key: 'nmc30', label: '三元 3.7V / 3.0Ah（21700）', nominal: 3.7, ah: 3.0 },
  { key: 'lfp28', label: '铁锂 3.2V / 2.8Ah', nominal: 3.2, ah: 2.8 },
  { key: 'lto50', label: '钛酸锂 2.4V / 5.0Ah', nominal: 2.4, ah: 5.0 }
]

// ---------- 响应式状态 ----------
const cellType = ref('nmc')
const cellAh = ref(CELL_TYPES.nmc.ah)
const customVoltages = ref({ nominal: 3.7, full: 4.2, cutoff: 3.0 })
const series = ref(13)
const parallel = ref(4)
const seoContentVisible = ref(true)

const targetVoltage = ref(48)
const targetAh = ref(20)
const reverseCellKey = ref('nmc26')
const loadWatts = ref(500)
const bmsVoltage = ref(48.1)
const bmsVoltageManual = ref(false)
const packPrice = ref(1000)
const cycles = ref(CELL_TYPES.nmc.cycles)

// ---------- 计算属性 ----------
const effSeries = computed(() => clampInt(series.value, 1, 24))
const effParallel = computed(() => clampInt(parallel.value, 1, 16))

const currentCell = computed(() => {
  const base = CELL_TYPES[cellType.value] || CELL_TYPES.custom
  if (cellType.value === 'custom') {
    return sanitizeCell({ nominal: customVoltages.value.nominal, full: customVoltages.value.full, cutoff: customVoltages.value.cutoff, ah: cellAh.value })
  }
  return sanitizeCell({ nominal: base.nominal, full: base.full, cutoff: base.cutoff, ah: cellAh.value })
})

const packVolts = computed(() => packVoltage(effSeries.value, currentCell.value))
const totalAh = computed(() => packCapacity(effParallel.value, currentCell.value))
const totalWh = computed(() => packEnergyWh(effSeries.value, effParallel.value, currentCell.value))
const cellCount = computed(() => effSeries.value * effParallel.value)

const packSvgHtml = computed(() => packSvg(effSeries.value, effParallel.value, `${currentCell.value.nominal}V`))

const reverseCellOptions = computed(() =>
  REVERSE_CELLS.map((c) => ({ key: c.key, label: c.label })).concat([{ key: 'link', label: '联动上方当前单体' }])
)

const reverseCell = computed(() => {
  if (reverseCellKey.value === 'link') return currentCell.value
  const found = REVERSE_CELLS.find((c) => c.key === reverseCellKey.value) || REVERSE_CELLS[0]
  return { nominal: found.nominal, full: found.nominal, cutoff: found.nominal, ah: found.ah }
})

const reverseResult = computed(() => suggestPack(targetVoltage.value, targetAh.value, reverseCell.value))
const reversePlans = computed(() => voltagePlans(targetVoltage.value, reverseCell.value))

const bmsResult = computed(() => pickBmsAmps(loadWatts.value, bmsVoltage.value))
const costResult = computed(() => energyCost(totalWh.value, cycles.value, packPrice.value))

// BMS 电压默认跟随组标称电压，用户手动编辑后不再覆盖
watch(() => packVolts.value.nominal, (v) => {
  if (!bmsVoltageManual.value) bmsVoltage.value = v
})

// ---------- 交互 ----------
function onCellTypeChange() {
  const t = CELL_TYPES[cellType.value] || CELL_TYPES.custom
  cellAh.value = t.ah
  cycles.value = t.cycles
}

function loadPreset(preset) {
  cellType.value = preset.cell
  const t = CELL_TYPES[preset.cell] || CELL_TYPES.custom
  cellAh.value = t.ah
  cycles.value = t.cycles
  series.value = preset.s
  parallel.value = preset.p
}

function applyDefaults() {
  cellType.value = 'nmc'
  cellAh.value = CELL_TYPES.nmc.ah
  customVoltages.value = { nominal: 3.7, full: 4.2, cutoff: 3.0 }
  series.value = 13
  parallel.value = 4
  cycles.value = CELL_TYPES.nmc.cycles
}

function syncBmsVoltage() {
  bmsVoltage.value = packVolts.value.nominal
  bmsVoltageManual.value = false // 重新跟随组电压联动
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('battery-pack-calculator')
})
</script>
