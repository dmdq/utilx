<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <CircuitBoard class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">PCB线宽载流计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">IPC-2221 线宽-载流-温升三向计算，外层/内层系数、铜厚联动与过孔载流在线计算器</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        按 IPC-2221 经验公式 I = k×ΔT^0.44×A^0.725（k=0.048 外层 / 0.024 内层，A 为铜截面积 mil²）三向计算：已知电流与允许温升求最小线宽、已知线宽与温升求载流、已知电流与线宽求实际温升。铜厚以 oz 联动（1oz≈1.37mil），附过孔载流估算与大电流过孔阵列建议。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径注记卡 -->
    <div class="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
      <Info class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <p class="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
        口径注记：IPC-2152 为更保守的现行标准（考虑板材/层位/真空度），本工具按 IPC-2221 快速估算，正式电源设计建议留 10~20% 裕量并参照 2152 核验。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 走线三向计算（IPC-2221）
        </h2>

        <!-- 模式切换 Tab -->
        <div class="grid grid-cols-3 gap-2">
          <button
            @click="mode = 'width'"
            :class="mode === 'width' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2.5 rounded-lg text-sm font-medium transition-all"
          >① 已知电流+温升 → 线宽</button>
          <button
            @click="mode = 'current'"
            :class="mode === 'current' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2.5 rounded-lg text-sm font-medium transition-all"
          >② 已知线宽+温升 → 载流</button>
          <button
            @click="mode = 'deltat'"
            :class="mode === 'deltat' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2.5 rounded-lg text-sm font-medium transition-all"
          >③ 已知电流+线宽 → 温升</button>
        </div>

        <!-- 共享输入：层位与铜厚 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">层位系数 k</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="layer = 'ext'"
                :class="layer === 'ext' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >外层 k=0.048</button>
              <button
                @click="layer = 'int'"
                :class="layer === 'int' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >内层 k=0.024</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">内层夹在 FR4 中散热差，系数减半（更保守）</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">铜厚</label>
            <select
              v-model="copperOz"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="o in copperOptions" :key="o.key" :value="o.key">{{ o.label }}</option>
            </select>
            <p class="text-xs text-muted-foreground mt-1.5">1oz ≈ 1.37mil ≈ 35µm（行业名义值），当前 {{ fmt(thickMil, 3) }} mil</p>
          </div>
        </div>

        <!-- 模式① 电流+温升 → 线宽 -->
        <div v-if="mode === 'width'" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">工作电流 I（A）</label>
              <input
                v-model.number="currentA"
                type="number"
                min="0"
                step="0.5"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p class="text-xs text-muted-foreground mt-1.5">走线持续载流，脉冲电流可按 RMS 折算</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">允许温升 ΔT（℃）</label>
              <input
                v-model.number="deltaT"
                type="number"
                min="0"
                step="5"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p class="text-xs text-muted-foreground mt-1.5">常用 10~20℃；还需叠加最高环境温度</p>
            </div>
          </div>

          <div v-if="resWidth" class="space-y-3">
            <div class="bg-primary/10 rounded-lg p-5 text-center">
              <p class="text-xs text-muted-foreground mb-1">A = (I / (k×ΔT^0.44))^(1/0.725)，线宽 = A / 铜厚</p>
              <p class="text-4xl font-bold text-primary">{{ fmt(resWidth.widthMil, 1) }} <span class="text-lg">mil</span></p>
              <p class="text-sm text-foreground mt-1 font-medium">= {{ fmt(resWidth.widthMm, 3) }} mm</p>
              <p class="text-xs text-muted-foreground mt-1.5">最小截面积 A = {{ fmt(resWidth.area, 1) }} mil²（{{ fmt(thickMil, 3) }} mil 铜厚 × {{ fmt(resWidth.widthMil, 1) }} mil 宽）</p>
            </div>
            <div class="p-4 bg-muted/50 rounded-lg">
              <p class="text-sm font-medium text-foreground">工艺圆整建议：按 5mil 网格向上取整 → {{ fmt(resWidth.roundedMil, 0) }} mil（{{ fmt(resWidth.roundedMm, 3) }} mm）</p>
              <p class="text-xs text-muted-foreground mt-1">IPC-2221 为理论最小值，实际请叠加板厂工艺能力与 10~20% 裕量；长走线或高可靠场景建议再加大。</p>
            </div>
            <button
              @click="copyResult"
              class="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Clipboard class="w-3.5 h-3.5" /> 复制计算结果
            </button>
          </div>
          <div v-else class="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            请输入大于 0 的电流与允许温升。
          </div>
        </div>

        <!-- 模式② 线宽+温升 → 载流 -->
        <div v-else-if="mode === 'current'" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">线宽</label>
              <div class="flex gap-2">
                <input
                  v-model.number="widthInput"
                  type="number"
                  min="0"
                  step="5"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                  v-model="widthUnit"
                  class="w-20 px-2 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="mil">mil</option>
                  <option value="mm">mm</option>
                </select>
              </div>
              <p class="text-xs text-muted-foreground mt-1.5">当前 {{ fmt(widthMilEff, 1) }} mil（{{ fmt(widthMilEff * 0.0254, 3) }} mm）</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">允许温升 ΔT（℃）</label>
              <input
                v-model.number="deltaT"
                type="number"
                min="0"
                step="5"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p class="text-xs text-muted-foreground mt-1.5">载流能力 ∝ ΔT^0.44（20℃ 比 10℃ 高约 1.36 倍）</p>
            </div>
          </div>

          <div v-if="resCurrent" class="space-y-3">
            <div class="bg-primary/10 rounded-lg p-5 text-center">
              <p class="text-xs text-muted-foreground mb-1">I = k×ΔT^0.44×A^0.725，A = 线宽 × 铜厚</p>
              <p class="text-4xl font-bold text-primary">{{ fmt(resCurrent.i, 2) }} <span class="text-lg">A</span></p>
              <p class="text-xs text-muted-foreground mt-1.5">截面积 A = {{ fmt(resCurrent.area, 1) }} mil²（{{ fmt(widthMilEff, 1) }} mil × {{ fmt(thickMil, 3) }} mil）</p>
            </div>
            <div class="p-4 bg-muted/50 rounded-lg">
              <p class="text-xs text-muted-foreground leading-relaxed">以上为 IPC-2221 估算值：正式电源设计建议按载流留 10~20% 裕量使用（即按 ≤ {{ fmt(resCurrent.i * 0.85, 2) }} A 设计），并参照 IPC-2152 核验。</p>
            </div>
            <button
              @click="copyResult"
              class="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Clipboard class="w-3.5 h-3.5" /> 复制计算结果
            </button>
          </div>
          <div v-else class="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            请输入大于 0 的线宽与允许温升。
          </div>
        </div>

        <!-- 模式③ 电流+线宽 → 温升 -->
        <div v-else class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">工作电流 I（A）</label>
              <input
                v-model.number="currentA"
                type="number"
                min="0"
                step="0.5"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p class="text-xs text-muted-foreground mt-1.5">持续工作电流</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">线宽</label>
              <div class="flex gap-2">
                <input
                  v-model.number="widthInput"
                  type="number"
                  min="0"
                  step="5"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                  v-model="widthUnit"
                  class="w-20 px-2 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="mil">mil</option>
                  <option value="mm">mm</option>
                </select>
              </div>
              <p class="text-xs text-muted-foreground mt-1.5">当前 {{ fmt(widthMilEff, 1) }} mil（{{ fmt(widthMilEff * 0.0254, 3) }} mm）</p>
            </div>
          </div>

          <div v-if="resDeltaT" class="space-y-3">
            <div :class="['rounded-lg p-5 text-center', resDeltaT.tier.bg]">
              <p class="text-xs text-muted-foreground mb-1">ΔT = (I / (k×A^0.725))^(1/0.44)</p>
              <p :class="['text-4xl font-bold', resDeltaT.tier.cls]">{{ fmt(resDeltaT.dt, 1) }} <span class="text-lg">℃</span></p>
              <div class="mt-2">
                <span :class="['px-2.5 py-0.5 rounded-full font-medium text-sm', resDeltaT.tier.cls, resDeltaT.tier.bg]">{{ resDeltaT.tier.label }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-2">{{ resDeltaT.tier.note }}</p>
            </div>
            <div class="text-sm space-y-1">
              <div class="flex justify-between py-1.5 border-b border-border/50">
                <span class="text-muted-foreground">截面积 A</span>
                <span class="text-foreground font-medium">{{ fmt(resDeltaT.area, 1) }} mil²</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-border/50">
                <span class="text-muted-foreground">叠加工况提醒</span>
                <span class="text-foreground font-medium">板温 ≈ 环境温度 + {{ fmt(resDeltaT.dt, 1) }}℃</span>
              </div>
            </div>
            <button
              @click="copyResult"
              class="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Clipboard class="w-3.5 h-3.5" /> 复制计算结果
            </button>
          </div>
          <div v-else class="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            请输入大于 0 的电流与线宽。
          </div>
        </div>

        <!-- 走线截面示意图 -->
        <div class="border-t border-border/50 pt-4">
          <h3 class="text-sm font-medium text-foreground mb-2">走线截面示意（铜箔宽度 × 铜厚，贴于 FR4 之上）</h3>
          <svg viewBox="0 0 680 150" class="w-full h-auto" role="img" aria-label="走线截面示意图，标注线宽与铜厚">
            <!-- FR4 板材 -->
            <rect x="60" y="96" width="560" height="34" rx="4" class="text-muted-foreground" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-opacity="0.4" stroke-width="1" />
            <text x="340" y="118" font-size="11" text-anchor="middle" class="fill-current text-muted-foreground">FR4 基材</text>

            <!-- 铜箔走线（宽度随输入按比例收缩） -->
            <rect
              :x="640 - traceRect.w - 20" y="82" :width="traceRect.w" height="14" rx="1"
              class="text-primary" fill="currentColor" fill-opacity="0.75"
            />
            <!-- 线宽标注 -->
            <g class="text-muted-foreground" stroke="currentColor" stroke-width="1">
              <line :x1="640 - traceRect.w - 20" y1="72" :x2="640 - traceRect.w - 20" y2="94" stroke-opacity="0.7" />
              <line :x1="620" y1="72" :x2="620" y2="94" stroke-opacity="0.7" />
              <line :x1="640 - traceRect.w - 20" y1="76" x2="620" y2="76" stroke-opacity="0.7" marker-end="url(#pcb-arrow)" />
              <line x1="620" y1="76" :x2="640 - traceRect.w - 20" y2="76" stroke-opacity="0.7" marker-end="url(#pcb-arrow)" />
            </g>
            <text x="340" y="66" font-size="11" text-anchor="middle" class="fill-current text-foreground" font-weight="bold">
              线宽 {{ widthLabel }} · 铜厚 {{ fmt(thickMil, 2) }} mil（{{ copperLabel }}）
            </text>
            <text x="340" y="40" font-size="11" text-anchor="middle" class="fill-current text-primary">
              {{ resultLabel }}
            </text>
            <!-- 电流方向 -->
            <g class="text-muted-foreground" stroke-width="1.5">
              <line x1="120" y1="20" x2="180" y2="20" stroke="currentColor" marker-end="url(#pcb-arrow)" />
            </g>
            <text x="150" y="12" font-size="10" text-anchor="middle" class="fill-current text-muted-foreground">电流方向</text>
            <defs>
              <marker id="pcb-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" class="text-muted-foreground" />
              </marker>
            </defs>
          </svg>
          <p class="text-xs text-muted-foreground mt-1">
            载流能力取决于铜箔截面积 A = 线宽 × 铜厚；同样线宽下厚铜（2oz/3oz）载流近似按面积比提升，图中铜箔宽度随输入示意缩放。
          </p>
        </div>

        <!-- 过孔载流小节 -->
        <div class="border-t border-border/50 pt-4 space-y-4">
          <h3 class="text-sm font-medium text-foreground flex items-center">
            <CircleDot class="w-4 h-4 mr-2 text-primary" /> 过孔载流估算（孔壁镀铜，按 IPC-2221 同口径折算）
          </h3>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">孔径 d</label>
              <div class="flex gap-2">
                <input
                  v-model.number="viaDrill"
                  type="number"
                  min="0"
                  step="0.05"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                  v-model="viaUnit"
                  class="w-20 px-2 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="mm">mm</option>
                  <option value="mil">mil</option>
                </select>
              </div>
              <p class="text-xs text-muted-foreground mt-1.5">钻孔直径，常见 0.2~0.5mm</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">孔壁铜厚</label>
              <select
                v-model="viaWallOz"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option v-for="o in viaWallOptions" :key="o.key" :value="o.key">{{ o.label }}</option>
              </select>
              <p class="text-xs text-muted-foreground mt-1.5">默认 1oz；环径 D 按 d+2×壁厚自动推算 = {{ fmt(viaRingOuter, 2) }} mil</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">允许温升 ΔT（℃）</label>
              <input
                v-model.number="viaDeltaT"
                type="number"
                min="0"
                step="5"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">过孔总电流 I（A）</label>
              <input
                v-model.number="viaTotalI"
                type="number"
                min="0"
                step="0.5"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div v-if="resVia" class="space-y-3">
            <div class="grid grid-cols-3 gap-2">
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground mb-1">等效截面积</p>
                <p class="text-sm font-bold text-foreground">{{ fmt(resVia.area, 1) }} mil²</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">π×(D−d)/2×d</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground mb-1">等效壁厚 (D−d)/2</p>
                <p class="text-sm font-bold text-foreground">{{ fmt(resVia.wallMil, 2) }} mil</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">≈ {{ fmt(resVia.wallMil * 25.4, 0) }} µm</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground mb-1">单孔载流（ΔT {{ fmt(viaDeltaT, 0) }}℃）</p>
                <p class="text-sm font-bold text-foreground">{{ fmt(resVia.iPerVia, 2) }} A</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">外层系数 k=0.048</p>
              </div>
            </div>
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-sm text-foreground font-medium">
                总电流 {{ fmt(viaTotalI, 2) }} A：单孔仅 {{ fmt(resVia.iPerVia, 2) }} A（按 50% 降额），建议过孔阵列 ≥
                <span class="text-primary font-bold">{{ resVia.count ?? '—' }}</span> 个
              </p>
              <p class="text-xs text-muted-foreground mt-1">建议孔数 = ceil(总电流 / 单孔载流 × 2)，即按单孔载流打五折使用；大电流务必用过孔阵列并均匀布放，避免单孔成为瓶颈。</p>
            </div>
          </div>
          <div v-else class="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            请输入大于 0 的孔径与温升（环径需大于孔径）。
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 温升判定档位 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Gauge class="w-4 h-4 mr-2 text-primary" /> 走线温升判定档位
          </h2>
          <div class="space-y-2.5 text-sm">
            <div class="flex gap-2.5 items-start">
              <span class="mt-1 w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></span>
              <div>
                <p class="text-green-600 dark:text-green-400 font-medium">ΔT ≤ 10℃ · 从容</p>
                <p class="text-xs text-muted-foreground">模拟、电源与功耗敏感场景的推荐区间。</p>
              </div>
            </div>
            <div class="flex gap-2.5 items-start">
              <span class="mt-1 w-2.5 h-2.5 rounded-full bg-yellow-500 flex-shrink-0"></span>
              <div>
                <p class="text-yellow-600 dark:text-yellow-400 font-medium">10~30℃ · 需核算</p>
                <p class="text-xs text-muted-foreground">一般数字板可接受，注意叠加环境温度与邻近热源。</p>
              </div>
            </div>
            <div class="flex gap-2.5 items-start">
              <span class="mt-1 w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"></span>
              <div>
                <p class="text-red-600 dark:text-red-400 font-medium">&gt; 30℃ · 偏紧</p>
                <p class="text-xs text-muted-foreground">加宽走线、加厚铜箔或铺铜散热，并按 IPC-2152 复核。</p>
              </div>
            </div>
          </div>
        </div>

        <!-- IPC-2221 常数参考 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Sigma class="w-4 h-4 mr-2 text-primary" /> IPC-2221 常数速查
          </h2>
          <div class="text-sm space-y-1.5">
            <div class="flex justify-between items-center py-1 border-b border-border/50">
              <span class="text-muted-foreground">公式</span>
              <span class="text-foreground font-medium">I = k·ΔT^0.44·A^0.725</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-border/50">
              <span class="text-muted-foreground">外层系数 k</span>
              <span class="text-foreground font-medium">0.048</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-border/50">
              <span class="text-muted-foreground">内层系数 k</span>
              <span class="text-foreground font-medium">0.024（减半）</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-border/50">
              <span class="text-muted-foreground">截面积 A</span>
              <span class="text-foreground font-medium">mil²（线宽×铜厚）</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-border/50">
              <span class="text-muted-foreground">铜厚换算</span>
              <span class="text-foreground font-medium">1oz ≈ 1.37mil ≈ 35µm</span>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3">A 的单位是 mil² 而非线宽，1oz/40mil 走线的 A=54.8mil²，按公式在 10℃ 温升下其实可载约 2.4A——经验法则 1A 已隐含数倍裕量。</p>
        </div>

        <!-- 快速自核示例 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <FlaskConical class="w-4 h-4 mr-2 text-primary" /> 快速自核示例
          </h2>
          <div class="space-y-2">
            <button
              @click="loadExampleWidth"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              外层 1oz、ΔT=10℃、I=1A → 最小线宽 <span class="text-foreground font-medium">≈11.9mil（0.302mm）</span>，内层同参数约 30.9mil（约为外层 2.6 倍）
            </button>
            <button
              @click="loadExampleVia"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              孔径 0.254mm（10mil）、孔壁 1oz、ΔT=10℃ → 单孔 <span class="text-foreground font-medium">≈2.02A</span>；过 5A 建议 ≥5 孔阵列
            </button>
          </div>
        </div>

        <!-- 免责声明 -->
        <div class="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            IPC-2221 为经验图表拟合公式，未考虑板材热阻、层位叠层、真空度与邻近发热器件；成品铜厚通常薄于基铜标称。关键电源设计请按 IPC-2152 核验并实测温升。
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
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-8">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>PCB线宽载流计算器原理与用法</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <h3 class="text-lg font-semibold text-foreground">IPC-2221 与 IPC-2152 的关系</h3>
          <p>
            IPC-2221（2003）中的载流图表给出了外层/内层两组曲线，被拟合为 I = k×ΔT^0.44×A^0.725，因形式简单至今仍是快速估算的主力；但它只区分内外层两个口径，不包含板材热阻、铜厚跨层、板厚、真空度等变量。IPC-2152（2011，修订版 2152A）是替代它的现行标准：基于大量实测数据，按板材、层位、铜厚、环境（对流/真空）查曲线，总体结果比 2221 更保守也更精细。工程实践中的合理用法是：概念设计与布局预估用 2221（本工具），正式电源设计用 2152 复核并留 10~20% 裕量，最后上板实测温升。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么内层系数减半</h3>
          <p>
            外层走线一面朝空气（或阻焊层），可靠对流与辐射散热，另一面贴板材；内层走线则完全被 FR4 包裹——FR4 的导热率只有约 0.3 W/(m·K)，热量只能沿板材横向缓慢传导到板边或过孔，散热路径显著更差。同样截面积、同样电流下内层温升明显更高，因此 IPC-2221 图表给内层的曲线整体右移，拟合为 k=0.024，恰为外层 0.048 的一半；代入公式意味着同样条件下内层需要约 2.6 倍截面积（2^(1/0.725)）才能达到相同温升。
          </p>
          <h3 class="text-lg font-semibold text-foreground">铜厚 oz 是什么单位</h3>
          <p>
            oz（盎司）本为重量单位，PCB 行业用它表示「每平方英尺铜箔的重量」：1oz 铜即 1 平方英尺面积上摊 1 盎司（28.35g）铜。按铜密度 8.96g/cm³ 折算，均匀厚度约 34.1µm（1.34mil）；行业名义值取 35µm，即 1oz≈1.37mil——本工具按 1.37mil 口径换算。由此 0.5oz≈0.69mil（17.5µm）、2oz≈2.74mil（70µm）、3oz≈4.11mil（105µm）。注意基铜与成品铜的区别：蚀刻侧蚀与压合会让成品铜厚略薄于基铜标称，厚铜板还常电镀加厚。
          </p>
          <h3 class="text-lg font-semibold text-foreground">过孔载流为什么弱于走线</h3>
          <p>
            过孔的载流导体是孔壁镀铜层，等效截面积按薄环近似 π×(D−d)/2×d（D 为环径、d 为孔径，(D−d)/2 即等效壁厚；壁厚 1oz、孔径 10mil 时约 43mil²，只相当于 31mil 宽的 1oz 走线）。更不利的是孔壁完全埋在 FR4 与内层之间，散热比外层走线更差，且镀铜厚度工艺波动大、高纵横比深孔镀层不均匀。因此大电流换层时不要指望单孔：用过孔阵列分摊电流，本工具建议孔数按单孔载流打五折（×2 余量）计算，并均匀布放、尽量靠近焊盘/铺铜。
          </p>
          <h3 class="text-lg font-semibold text-foreground">经验法则 1oz/40mil≈1A 的适用性</h3>
          <p>
            「1oz 铜厚下每 40mil 线宽走 1A」是老工程师的口算法则。按 IPC-2221 精算，40mil×1.37mil=54.8mil² 截面积在 10℃ 温升下其实允许约 2.4A——也就是说这条法则自带 2 倍以上的裕量，覆盖了内层口径、成品铜厚偏差、长走线、批量波动与可靠性降额。它适合布局时快速划线：低压数字与一般信号完全够用；但大电流电源路径应该按公式（本工具）或 IPC-2152 精算，再叠加 10~20% 裕量，高温密闭环境与高可靠产品还要进一步降额。
          </p>
          <h3 class="text-lg font-semibold text-foreground">相关工具</h3>
          <p>
            铜厚 oz/mil/mm/µm 的完整换算与 AWG 线规对照见 <NuxtLink to="/tools/copper-thickness-converter" class="text-primary hover:underline">铜厚与线规换算器</NuxtLink>；功率器件与走线的热校核可配合 <NuxtLink to="/tools/heatsink-calculator" class="text-primary hover:underline">散热热阻计算器</NuxtLink>；开关电源功率回路选型可参考 <NuxtLink to="/tools/buck-inductor-calculator" class="text-primary hover:underline">BUCK电感选型计算器</NuxtLink>。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">温升限值 ΔT 取多少合适？</span>常用 10~20℃：功耗敏感与密闭环境取 10℃，一般数字板可放宽到 20~30℃；注意最终板温 = 环境温度 + ΔT，要叠加最恶劣环境工况。</li>
            <li><span class="text-foreground font-medium">为什么板厂要求的线宽比算出来的大？</span>IPC-2221 是理论最小值；板厂还要考虑成品铜厚偏差、蚀刻能力、批量一致性与可靠性寿命，通常按经验再放大并圆整到工艺网格，属正常保守化。</li>
            <li><span class="text-foreground font-medium">2oz 铜的载流是 1oz 的两倍吗？</span>近似但不精确：载流 ∝ A^0.725，面积翻倍载流只增加 2^0.725≈1.65 倍（同温升下）；因此加厚铜的收益不如等比加宽线，但厚铜在同线宽下仍显著提升载流。</li>
            <li><span class="text-foreground font-medium">计算结果要不要圆整？</span>要。建议向上圆整到板厂工艺网格（常见 5mil/0.127mm）并叠加 10~20% 裕量；本工具模式①已给出 5mil 网格的圆整建议。</li>
          </ul>
          <p class="text-xs pt-2 border-t border-border/50">
            口径注记：IPC-2152 为更保守的现行标准（考虑板材/层位/真空度），本工具按 IPC-2221 快速估算，正式电源设计建议留 10~20% 裕量并参照 2152 核验。
          </p>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pcb-trace-width-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { CircuitBoard, Calculator, Gauge, Sigma, FlaskConical, AlertTriangle, Clipboard, ChevronUp, ChevronDown, Info, CircleDot } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ===== PURE-FUNCTIONS-START（自核单测直接提取执行，勿在此块引入 Vue/浏览器 API） =====
// oz → mil 换算口径：1oz ≈ 1.37mil ≈ 35µm（行业名义值；物理精确值 1oz/ft² ≈ 1.344mil ≈ 34.1µm）
const OZ_TO_MIL = 1.37
// IPC-2221 层位系数
const IPC_K = { ext: 0.048, int: 0.024 }

// 已知电流+温升 → 最小截面积（mil²）
function ipcAreaFromCurrent(i, dt, k) {
  return Math.pow(i / (k * Math.pow(dt, 0.44)), 1 / 0.725)
}
// 已知截面积+温升 → 载流（A）
function ipcCurrentFromArea(a, dt, k) {
  return k * Math.pow(dt, 0.44) * Math.pow(a, 0.725)
}
// 已知电流+截面积 → 实际温升（℃）
function ipcDeltaT(i, a, k) {
  return Math.pow(i / (k * Math.pow(a, 0.725)), 1 / 0.44)
}
// 走线截面积（mil²）= 线宽 × 铜厚
function traceAreaMil2(widthMil, thickMil) {
  return widthMil * thickMil
}
function milToMm(mil) {
  return mil * 0.0254
}
function mmToMil(mm) {
  return mm / 0.0254
}
// 过孔环径推算：D = d + 2×壁厚
function viaRingOuterMil(drillMil, wallMil) {
  return drillMil + 2 * wallMil
}
// 过孔等效截面积（mil²）= π×(D−d)/2×d（薄环近似；当 D=d+2t 时即 π·d·t）
function viaBarrelAreaMil2(drillMil, ringOuterMil) {
  return Math.PI * (ringOuterMil - drillMil) / 2 * drillMil
}
// 大电流过孔阵列建议孔数：单孔载流打五折（×2 裕量）
function viaCount(totalI, perViaI) {
  if (!(perViaI > 0) || !(totalI > 0)) return null
  return Math.max(1, Math.ceil((totalI / perViaI) * 2))
}
// ===== PURE-FUNCTIONS-END =====

// SEO
useSeoMeta({
  title: 'PCB线宽载流计算器 - IPC-2221 线宽/载流/温升三向计算 | Util工具箱',
  description: '在线 PCB 线宽载流计算器：按 IPC-2221 公式 I=k·ΔT^0.44·A^0.725 三向计算最小线宽、载流能力与实际温升，外层/内层系数与铜厚 oz 联动，附过孔载流估算与过孔阵列建议、IPC-2152 口径注记，纯本地计算',
  keywords: 'PCB线宽计算, 线宽载流, IPC-2221, IPC-2152, 走线宽度, 过孔载流, 铜厚oz, 载流能力计算, 温升计算, pcb trace width calculator, pcb走线电流',
  author: 'Util工具箱',
  ogTitle: 'PCB线宽载流计算器 - IPC-2221 三向计算',
  ogDescription: 'IPC-2221 线宽-载流-温升三向计算，外层/内层系数与过孔载流，附 2152 注记',
  ogUrl: 'https://www.util.cn/tools/pcb-trace-width-calculator',
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
          name: 'PCB线宽载流计算器',
          url: 'https://www.util.cn/tools/pcb-trace-width-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['IPC-2221 三向计算（线宽/载流/温升）', '外层/内层系数切换', '铜厚 oz 联动换算', 'mil 与 mm 双显示', '过孔载流与过孔阵列建议', 'IPC-2152 口径注记']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: 'PCB线宽载流计算器', item: 'https://www.util.cn/tools/pcb-trace-width-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'PCB 走线的温升限值 ΔT 取多少合适？',
              acceptedAnswer: { '@type': 'Answer', text: '常用 10~20℃：功耗敏感与密闭环境取 10℃，一般数字板可放宽到 20~30℃；最终板温等于环境温度加 ΔT，需叠加最恶劣环境工况核算。' }
            },
            {
              '@type': 'Question',
              name: 'IPC-2221 和 IPC-2152 该用哪个？',
              acceptedAnswer: { '@type': 'Answer', text: 'IPC-2221 公式简单适合快速估算；IPC-2152 是更保守的现行标准，考虑板材、层位与真空度等变量。快速预估用 2221，正式电源设计按 2152 核验并留 10~20% 裕量。' }
            },
            {
              '@type': 'Question',
              name: '为什么内层走线需要更宽？',
              acceptedAnswer: { '@type': 'Answer', text: '内层完全被 FR4 包裹，导热系数只有约 0.3W/(m·K)，散热远差于朝向空气的外层；IPC-2221 将内层系数减半（k=0.024），同样条件下内层需要约 2.6 倍截面积。' }
            },
            {
              '@type': 'Question',
              name: '大电流为什么要用过孔阵列？',
              acceptedAnswer: { '@type': 'Answer', text: '单孔载流导体只有孔壁镀铜层（1oz 壁厚、10mil 孔径约 43mil²），且埋在板材中散热差、工艺波动大；建议按单孔载流打五折计算并使用多个过孔均匀分摊电流。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'pcb-trace-width-calculator'
const STORE_KEY = TOOL_ID + ':inputs'
const tool = tools.find(t => t.id === TOOL_ID)

// ---------- 状态 ----------
const mode = ref('width') // width 线宽 / current 载流 / deltat 温升
const layer = ref('ext')
const copperOz = ref('1')
const currentA = ref(1)
const deltaT = ref(10)
const widthInput = ref(40)
const widthUnit = ref('mil')
// 过孔
const viaDrill = ref(0.254)
const viaUnit = ref('mm')
const viaWallOz = ref('1')
const viaDeltaT = ref(10)
const viaTotalI = ref(5)

// 交互记录与输入持久化（SSR 安全：localStorage 仅在客户端执行）
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_KEY) : null
    if (raw) {
      const s = JSON.parse(raw)
      if (typeof s.mode === 'string') mode.value = s.mode
      if (typeof s.layer === 'string') layer.value = s.layer
      if (typeof s.copperOz === 'string') copperOz.value = s.copperOz
      if (typeof s.currentA === 'number') currentA.value = s.currentA
      if (typeof s.deltaT === 'number') deltaT.value = s.deltaT
      if (typeof s.widthInput === 'number') widthInput.value = s.widthInput
      if (typeof s.widthUnit === 'string') widthUnit.value = s.widthUnit
      if (typeof s.viaDrill === 'number') viaDrill.value = s.viaDrill
      if (typeof s.viaUnit === 'string') viaUnit.value = s.viaUnit
      if (typeof s.viaWallOz === 'string') viaWallOz.value = s.viaWallOz
      if (typeof s.viaDeltaT === 'number') viaDeltaT.value = s.viaDeltaT
      if (typeof s.viaTotalI === 'number') viaTotalI.value = s.viaTotalI
    }
  } catch (e) { /* 忽略恢复失败 */ }
})

const persist = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      mode: mode.value, layer: layer.value, copperOz: copperOz.value,
      currentA: currentA.value, deltaT: deltaT.value,
      widthInput: widthInput.value, widthUnit: widthUnit.value,
      viaDrill: viaDrill.value, viaUnit: viaUnit.value, viaWallOz: viaWallOz.value,
      viaDeltaT: viaDeltaT.value, viaTotalI: viaTotalI.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}
watch([mode, layer, copperOz, currentA, deltaT, widthInput, widthUnit, viaDrill, viaUnit, viaWallOz, viaDeltaT, viaTotalI], persist)

const num = (v) => (typeof v === 'number' && isFinite(v) ? v : NaN)

const copperOptions = [
  { key: '0.5', label: '0.5 oz（≈0.69mil / 17.5µm）', oz: 0.5 },
  { key: '1', label: '1 oz（≈1.37mil / 35µm）', oz: 1 },
  { key: '2', label: '2 oz（≈2.74mil / 70µm）', oz: 2 },
  { key: '3', label: '3 oz（≈4.11mil / 105µm）', oz: 3 }
]
const copperMap = {}
for (const o of copperOptions) copperMap[o.key] = o.oz

const viaWallOptions = [
  { key: '0.5', label: '0.5 oz（≈0.69mil）', oz: 0.5 },
  { key: '1', label: '1 oz（≈1.37mil，默认）', oz: 1 },
  { key: '2', label: '2 oz（≈2.74mil，电镀加厚）', oz: 2 }
]
const viaWallMap = {}
for (const o of viaWallOptions) viaWallMap[o.key] = o.oz

// ---------- 数字格式化（避免浮点尾差） ----------
const fmt = (v, digits = 2) => {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  return Number(v.toFixed(digits)).toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

const kEff = computed(() => (layer.value === 'int' ? IPC_K.int : IPC_K.ext))
const thickMil = computed(() => num(copperMap[copperOz.value]) * OZ_TO_MIL)
const widthMilEff = computed(() => {
  const w = num(widthInput.value)
  if (!(w > 0)) return NaN
  return widthUnit.value === 'mm' ? mmToMil(w) : w
})

// ---------- 模式① 电流+温升 → 线宽 ----------
const resWidth = computed(() => {
  const i = num(currentA.value), dt = num(deltaT.value), t = num(thickMil.value), k = num(kEff.value)
  if (!(i > 0) || !(dt > 0) || !(t > 0)) return null
  const area = ipcAreaFromCurrent(i, dt, k)
  const widthMil = area / t
  if (!(widthMil > 0) || !isFinite(widthMil)) return null
  const roundedMil = Math.ceil(widthMil / 5) * 5
  return {
    area,
    widthMil,
    widthMm: milToMm(widthMil),
    roundedMil,
    roundedMm: milToMm(roundedMil)
  }
})

// ---------- 模式② 线宽+温升 → 载流 ----------
const resCurrent = computed(() => {
  const w = num(widthMilEff.value), dt = num(deltaT.value), t = num(thickMil.value), k = num(kEff.value)
  if (!(w > 0) || !(dt > 0) || !(t > 0)) return null
  const area = traceAreaMil2(w, t)
  const i = ipcCurrentFromArea(area, dt, k)
  if (!(i > 0) || !isFinite(i)) return null
  return { i, area }
})

// ---------- 模式③ 电流+线宽 → 温升 ----------
const dtTier = (dt) => {
  if (dt <= 10) {
    return {
      label: '从容',
      cls: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10',
      note: '≤10℃：模拟、电源与功耗敏感场景的推荐区间。'
    }
  }
  if (dt <= 30) {
    return {
      label: '需核算',
      cls: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-500/10',
      note: '10~30℃：一般数字板可接受，注意叠加环境温度与邻近热源。'
    }
  }
  return {
    label: '偏紧',
    cls: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
    note: '>30℃：建议加宽走线、加厚铜箔或铺铜散热，并按 IPC-2152 复核。'
  }
}

const resDeltaT = computed(() => {
  const i = num(currentA.value), w = num(widthMilEff.value), t = num(thickMil.value), k = num(kEff.value)
  if (!(i > 0) || !(w > 0) || !(t > 0)) return null
  const area = traceAreaMil2(w, t)
  const dt = ipcDeltaT(i, area, k)
  if (!(dt > 0) || !isFinite(dt)) return null
  return { dt, area, tier: dtTier(dt) }
})

// ---------- 过孔 ----------
const viaDrillMil = computed(() => {
  const d = num(viaDrill.value)
  if (!(d > 0)) return NaN
  return viaUnit.value === 'mm' ? mmToMil(d) : d
})
const viaWallMil = computed(() => num(viaWallMap[viaWallOz.value]) * OZ_TO_MIL)
const viaRingOuter = computed(() => {
  const d = num(viaDrillMil.value), t = num(viaWallMil.value)
  if (!(d > 0) || !(t > 0)) return NaN
  return viaRingOuterMil(d, t)
})

const resVia = computed(() => {
  const d = num(viaDrillMil.value), dop = num(viaRingOuter.value), dt = num(viaDeltaT.value), ti = num(viaTotalI.value)
  if (!(d > 0) || !(dop > d) || !(dt > 0)) return null
  const area = viaBarrelAreaMil2(d, dop)
  const iPerVia = ipcCurrentFromArea(area, dt, IPC_K.ext)
  if (!(iPerVia > 0) || !isFinite(iPerVia)) return null
  const count = viaCount(ti, iPerVia)
  return {
    area,
    wallMil: (dop - d) / 2,
    iPerVia,
    count: count === null ? null : count
  }
})

// ---------- 示意图标注 ----------
const traceRect = computed(() => {
  const w = num(widthMilEff.value)
  // 宽度按 5~400mil 映射到 24~420px，超出夹取
  const clamped = isFinite(w) ? Math.min(Math.max(w, 5), 400) : 40
  return { w: 24 + (clamped - 5) / (400 - 5) * (420 - 24) }
})

const widthLabel = computed(() => {
  if (mode.value !== 'current' && mode.value !== 'deltat') {
    return resWidth.value ? fmt(resWidth.value.widthMil, 1) + 'mil（' + fmt(resWidth.value.widthMm, 3) + 'mm）' : '—'
  }
  return isFinite(widthMilEff.value) ? fmt(widthMilEff.value, 1) + 'mil（' + fmt(widthMilEff.value * 0.0254, 3) + 'mm）' : '—'
})

const copperLabel = computed(() => {
  const o = copperMap[copperOz.value]
  return o ? o + 'oz' : '—'
})

const resultLabel = computed(() => {
  if (mode.value === 'width' && resWidth.value) {
    return '① 最小线宽 ' + fmt(resWidth.value.widthMil, 1) + 'mil（' + fmt(resWidth.value.widthMm, 3) + 'mm），圆整建议 ' + fmt(resWidth.value.roundedMil, 0) + 'mil'
  }
  if (mode.value === 'current' && resCurrent.value) {
    return '② 载流能力 ' + fmt(resCurrent.value.i, 2) + 'A（ΔT ' + fmt(deltaT.value, 0) + '℃）'
  }
  if (mode.value === 'deltat' && resDeltaT.value) {
    return '③ 实际温升 ' + fmt(resDeltaT.value.dt, 1) + '℃（' + resDeltaT.value.tier.label + '）'
  }
  return '请输入有效参数开始计算'
})

// ---------- 交互 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const loadExampleWidth = () => {
  mode.value = 'width'; layer.value = 'ext'; copperOz.value = '1'; currentA.value = 1; deltaT.value = 10
}

const loadExampleVia = () => {
  viaDrill.value = 0.254; viaUnit.value = 'mm'; viaWallOz.value = '1'; viaDeltaT.value = 10; viaTotalI.value = 5
}

const copyResult = async () => {
  const layerLabel = layer.value === 'int' ? '内层' : '外层'
  const lines = []
  lines.push('【PCB线宽载流（IPC-2221）】')
  lines.push('层位=' + layerLabel + '（k=' + fmt(kEff.value, 3) + '）, 铜厚=' + copperLabel.value + '（' + fmt(thickMil.value, 3) + 'mil）')
  if (mode.value === 'width') {
    if (!resWidth.value) { alert('当前输入不完整，无法复制'); return }
    lines.push('模式①：I=' + fmt(currentA.value, 2) + 'A, ΔT=' + fmt(deltaT.value, 0) + '℃ → 最小线宽 ' + fmt(resWidth.value.widthMil, 1) + 'mil（' + fmt(resWidth.value.widthMm, 3) + 'mm），5mil 圆整 ' + fmt(resWidth.value.roundedMil, 0) + 'mil')
  } else if (mode.value === 'current') {
    if (!resCurrent.value) { alert('当前输入不完整，无法复制'); return }
    lines.push('模式②：线宽 ' + fmt(widthMilEff.value, 1) + 'mil, ΔT=' + fmt(deltaT.value, 0) + '℃ → 载流 ' + fmt(resCurrent.value.i, 2) + 'A（建议按 ≤ ' + fmt(resCurrent.value.i * 0.85, 2) + 'A 留裕量）')
  } else {
    if (!resDeltaT.value) { alert('当前输入不完整，无法复制'); return }
    lines.push('模式③：I=' + fmt(currentA.value, 2) + 'A, 线宽 ' + fmt(widthMilEff.value, 1) + 'mil → 实际温升 ' + fmt(resDeltaT.value.dt, 1) + '℃（' + resDeltaT.value.tier.label + '）')
  }
  if (resVia.value) {
    lines.push('过孔：孔径 ' + fmt(viaDrillMil.value, 1) + 'mil → 单孔 ' + fmt(resVia.value.iPerVia, 2) + 'A（ΔT ' + fmt(viaDeltaT.value, 0) + '℃），总电流 ' + fmt(viaTotalI.value, 2) + 'A 建议孔数 ≥ ' + resVia.value.count)
  }
  lines.push('注：IPC-2152 为更保守的现行标准，正式电源设计建议留 10~20% 裕量')
  lines.push('—— 来自 Util工具箱·PCB线宽载流计算器')
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    alert('已复制到剪贴板')
  } catch (e) {
    alert('复制失败，请手动选择文本复制')
  }
}
</script>
