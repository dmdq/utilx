<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Cog class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">步进电机计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">步距角/细分/脉冲频率/转速/导程五参联算，丝杠与滚轮两种线速度口径</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线步进电机计算器：由步距角与细分算每转脉冲数 PPR，在脉冲频率、转速之间任意改一项反算其余（最后编辑的为准），
        再按丝杠导程（或滚轮直径圆周口径）折算直线速度，附 3D 打印 / 直线模组 / 雕刻机场景预设与 steps/mm 输出；
        页内附「高频转矩下降、细分只是平滑不是精度提升」的原理说明。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        换算口径：每转脉冲数 PPR = (360° ÷ 步距角) × 细分；每秒转数 rev/s = 脉冲频率 f ÷ PPR；转速 rpm = rev/s × 60；
        线速度 = rpm ÷ 60 × 丝杠导程（滚轮口径 = rpm ÷ 60 × π × 滚轮直径，即按圆周线速度折算）。
        五个输入互相联动、最后编辑的为准：改步距角或细分时，保留你最近一次设置的「脉冲频率」或「转速」，另一个自动反算。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器列 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 场景预设 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Zap class="w-5 h-5 mr-2 text-primary" /> 场景预设
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <button
              v-for="s in SCENARIOS"
              :key="s.id"
              @click="applyScenario(s)"
              class="text-left px-4 py-3 rounded-lg border bg-background hover:border-primary/50 hover:bg-primary/5 transition"
              :class="scenarioActive(s) ? 'border-primary bg-primary/10' : 'border-border'"
            >
              <p class="text-sm font-medium text-foreground">{{ s.label }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ s.desc }}</p>
            </button>
          </div>
          <p class="text-xs text-muted-foreground">点击按当前脉冲频率重算转速与线速度；机械口径（丝杠/滚轮）随场景自动切换。</p>
        </div>

        <!-- 五参输入 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 五参联动输入
          </h2>

          <!-- 步距角 -->
          <div>
            <label for="spc-angle" class="block text-sm font-medium text-foreground mb-1.5">步距角（°）</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="a in ANGLE_PRESETS"
                :key="a"
                @click="pickStepAngle(a)"
                :class="stepAngle !== null && Math.abs(stepAngle - a) < 1e-9 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              >{{ a }}°</button>
            </div>
            <input
              id="spc-angle"
              v-model.number="stepAngle"
              type="number"
              min="0.1"
              step="0.1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 1.8"
              @input="rederiveFromDrive"
            >
          </div>

          <!-- 细分 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">细分（驱动器微步档位）</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="m in MICROSTEPS"
                :key="m"
                @click="pickMicrostep(m)"
                :class="microstep === m ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all"
              >{{ m }}</button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- 脉冲频率 -->
            <div>
              <label for="spc-freq" class="block text-sm font-medium text-foreground mb-1.5">脉冲频率（Hz）</label>
              <input
                id="spc-freq"
                v-model.number="freqHz"
                type="number"
                min="0"
                step="100"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 8000"
                @input="onFreqInput"
              >
              <p class="text-xs text-muted-foreground mt-1">控制器发出的脉冲速率（STEP 引脚频率）</p>
            </div>
            <!-- 转速 -->
            <div>
              <label for="spc-rpm" class="block text-sm font-medium text-foreground mb-1.5">转速（rpm）</label>
              <input
                id="spc-rpm"
                v-model.number="rpm"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 300"
                @input="onRpmInput"
              >
              <p class="text-xs text-muted-foreground mt-1">改这里会反算脉冲频率，两者最后编辑者生效</p>
            </div>
          </div>

          <!-- 机械口径 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">机械口径（线速度折算方式）</label>
            <div class="grid grid-cols-2 gap-1.5 mb-2">
              <button
                @click="mechMode = 'lead'"
                :class="mechMode === 'lead' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >丝杠导程（mm/圈）</button>
              <button
                @click="mechMode = 'roller'"
                :class="mechMode === 'roller' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >滚轮直径（圆周口径）</button>
            </div>
            <div v-if="mechMode === 'lead'">
              <label for="spc-lead" class="sr-only">丝杠导程（mm）</label>
              <input
                id="spc-lead"
                v-model.number="leadMm"
                type="number"
                min="0.1"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 8"
              >
              <p class="text-xs text-muted-foreground mt-1">丝杠导程 = 螺母转一圈前进的距离；T8 丝杠常见 2/8 mm，联轴器直连无减速</p>
            </div>
            <div v-else>
              <label for="spc-roller" class="sr-only">滚轮直径（mm）</label>
              <input
                id="spc-roller"
                v-model.number="rollerDia"
                type="number"
                min="0.1"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 50"
              >
              <p class="text-xs text-muted-foreground mt-1">送料轮/摩擦轮口径：线速度 = rpm ÷ 60 × π × 直径（圆周线速度）</p>
            </div>
          </div>
        </div>

        <!-- 结果面板 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 换算结果
          </h2>

          <div v-if="mainValid" class="space-y-4">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <p class="text-sm text-muted-foreground mb-1">每转脉冲数 PPR = (360° ÷ {{ fmt(stepAngle, 2) }}°) × {{ microstep }} 细分</p>
              <p class="text-3xl font-bold text-primary">
                {{ fmt(pprC, 6) }} <span class="text-sm font-normal">脉冲/圈</span>
              </p>
              <p v-if="pprC !== null && pprC !== Math.round(pprC)" class="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                PPR 为非整数——该步距角 × 细分组合在物理上不可实现，请调整步距角或细分档位。
              </p>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div class="p-3 rounded-lg bg-muted/50 border border-border">
                <p class="text-xs text-muted-foreground mb-1">每秒转数</p>
                <p class="text-xl font-bold text-foreground">{{ fmt(revsC, 4) }} <span class="text-xs font-normal">rev/s</span></p>
              </div>
              <div class="p-3 rounded-lg bg-muted/50 border border-border">
                <p class="text-xs text-muted-foreground mb-1">转速</p>
                <p class="text-xl font-bold text-foreground">{{ fmt(rpmDisp, 2) }} <span class="text-xs font-normal">rpm</span></p>
              </div>
              <div class="p-3 rounded-lg bg-muted/50 border border-border">
                <p class="text-xs text-muted-foreground mb-1">{{ mechMode === 'lead' ? '线速度（丝杠口径）' : '线速度（圆周口径）' }}</p>
                <p class="text-xl font-bold text-foreground">{{ fmt(linearC, 2) }} <span class="text-xs font-normal">mm/s</span></p>
              </div>
              <div class="p-3 rounded-lg bg-muted/50 border border-border">
                <p v-if="mechMode === 'lead'" class="text-xs text-muted-foreground mb-1">每毫米脉冲</p>
                <p v-else class="text-xs text-muted-foreground mb-1">滚轮周长</p>
                <p class="text-xl font-bold text-foreground">
                  {{ mechMode === 'lead' ? fmt(stepsPerMmC, 4) : fmt(circC, 2) }}
                  <span class="text-xs font-normal">{{ mechMode === 'lead' ? '脉冲/mm' : 'mm' }}</span>
                </p>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p class="text-xs text-muted-foreground leading-relaxed">
                链路：PPR → 脉冲频率 ÷ PPR = 每秒转数 → ×60 = rpm → ÷60 × {{ mechMode === 'lead' ? '导程' : '滚轮周长' }} = 线速度。
                「每毫米脉冲」即 3D 打印 / GRBL 固件里的 steps/mm 口径（不含减速机构）。
              </p>
              <button
                @click="copyResult"
                class="px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition whitespace-nowrap"
              >
                <CheckCircle v-if="copyStatus === 'ok'" class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-green-600" />
                <Copy v-else class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" />
                {{ copyStatus === 'ok' ? '已复制' : '复制参数 TSV' }}
              </button>
            </div>
          </div>

          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">请检查：步距角 &gt; 0、脉冲频率 ≥ 0、导程或滚轮直径 &gt; 0。改任意一项即可联动重算。</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 联动规则 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> 五参怎么联动
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <p><span class="text-foreground font-medium">步距角 × 细分</span> → 决定 PPR（每转要多少个脉冲）</p>
            <p><span class="text-foreground font-medium">脉冲频率 ↔ 转速</span> → rpm = 60 × f ÷ PPR，两者一一对应</p>
            <p><span class="text-foreground font-medium">转速 × 导程/周长</span> → 线速度（mm/s）</p>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            任意改一项，其余自动反算，最后编辑的为准。改「步距角」或「细分」时，PPR 变了而链路只能保留一个量——
            本页保留你最近一次设置的「脉冲频率」或「转速」：最后设的是频率就保持频率重算转速（驱动器换细分档、
            控制器脉冲不变的物理口径），最后设的是转速就保持转速重算频率。
          </p>
        </div>

        <!-- 高频转矩下降 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <TrendingDown class="w-5 h-5 mr-2 text-primary" /> 为什么频率高了转矩会掉
          </h2>
          <p class="text-xs leading-relaxed text-muted-foreground">
            步进电机绕组是电感性负载：电流建立需要时间（时间常数 L/R）。脉冲频率越高、每相通电时间越短，
            电流来不及爬升到额定值就要换相，有效电流变小，输出转矩随转速近似单调下降——这就是 datasheet
            里「牵出转矩—频率」曲线整体下坠的成因（定性：本页不做曲线）。频率高到转矩带不动负载时就是
            <span class="text-foreground font-medium">失步</span>。工程对策：加减速要给斜坡（不能直接满速启动）、
            适当提高驱动电压、必要时降速或换大电机。
          </p>
        </div>

        <!-- 细分本质 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 细分是平滑，不是精度
          </h2>
          <p class="text-xs leading-relaxed text-muted-foreground">
            细分把一个整步的电流变成多级微步阶梯，收益是低速更平稳、噪声和共振明显改善；但它不会让转子"停在更细的位置"——
            实际定位精度仍受齿槽转矩、摩擦力矩与机械背隙主导，微步相角与转子实际位移是非线性关系
            （相邻两个微步走出来的距离并不相等，整步边界附近最明显）。所以「16 细分」不等于定位精度提升 16 倍，
            精度要看整步角 + 机构刚性 + 负载工况；细分的正确预期是<span class="text-foreground font-medium">平滑与降振</span>。
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>步进电机五参数怎么换算</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          步进电机的运动链路只有四个公式：每转脉冲数 PPR = (360° ÷ 步距角) × 细分；每秒转数 = 脉冲频率 ÷ PPR；
          转速 rpm = 每秒转数 × 60；直线机构的线速度 = rpm ÷ 60 × 导程（滚轮类机构用圆周口径：rpm ÷ 60 × π × 直径）。
          以最常见的 1.8° 电机为例：不细分时每圈 360 ÷ 1.8 = 200 步，8 细分后 PPR = 200 × 8 = 1600 脉冲/圈；
          给 8000 Hz 脉冲就是 8000 ÷ 1600 = 5 圈/秒 = 300 rpm；配 8 mm 导程丝杠时线速度 = 300 ÷ 60 × 8 = 40 mm/s。
          反过来，想要 300 rpm 就能反推出需要 8000 Hz 脉冲——五个量里任意改一个，其余四个都能确定，这就是本页联动反算的依据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么脉冲频率高了转矩会下降</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          步进电机的转矩来自绕组电流，而绕组是电感性负载，电流按时间常数 L/R 指数爬升。静止或低速时，每相通电时间长，
          电流能到额定值，转矩充足；脉冲频率升高后每相通电窗口变短，电流刚爬到一半就换相，有效电流与磁势随之减小，
          转矩近似随转速单调下降——厂商手册里的「矩频特性曲线」就是这条下坠曲线。当工作点超出曲线（牵出转矩 < 负载转矩），
          转子跟不上磁场就失步。定性对策：给加减速斜坡、提高母线电压让电流爬得更快、降低细分外的无谓损耗，
          或在频率与负载之间留出 50% 以上的转矩余量。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">细分只是平滑，不是精度提升</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          细分（微步）把一个整步的相电流分成多级阶梯，让转子以更小的"电角度"增量移动，直接收益是低速平稳、
          噪声与共振显著改善。但它不等于定位精度提升：微步指令角与转子实际位移是非线性的——离整步平衡点越远，
          同样的微步增量对应的实际位移越难保证，电流矢量误差、齿槽转矩和摩擦力矩都会"吃掉"细分增量；
          机械背隙与联轴器间隙更是与细分无关。因此 16 细分不能理解为"分辨率提高 16 倍"：
          分辨率的上限仍由整步角与机构决定，细分买到的是<span class="text-foreground font-medium">平滑、降噪、减振</span>。
          需要真正的高分辨率定位时，应考虑 0.9° 电机、减速机构或闭环伺服。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">steps/mm 在 3D 打印与 GRBL 里怎么用</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          「每毫米脉冲数」steps/mm = PPR ÷ 导程，是固件把"走 1 mm"换算成"发多少个脉冲"的标定常数：
          本页例子 1.8° / 8 细分 / 8 mm 导程下 steps/mm = 1600 ÷ 8 = 200——Marlin 的 default_axis_steps_per_unit、
          GRBL 的 $100 步进参数都是这个口径。注意两点：若电机与丝杠之间有减速带轮，要再乘减速比（PPR 按末级折算）；
          标定误差会直接线性放大成"走 100 mm 实际 99 mm"的尺寸偏差，可用"指令 100 mm 实测差值"反推修正系数。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">细分是不是设得越大越好？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不是。细分超过 16~32 后平滑改善已经边际递减，PPR 却成倍变大：同样的最高转速需要成倍的脉冲频率
              （256 细分时 1.8° 电机每圈要 51200 脉冲，300 rpm 就要 256 kHz），控制器脉冲输出与驱动器响应都可能跟不上，
              转矩也随频率下降。常规建议：噪声/共振敏感场景 8~32，普通定位 4~8，追求极限平滑再往上调。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">步进电机为什么会失步？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              失步的本质是负载转矩超过当前频率下的输出转矩：要么脉冲频率升得太陡（没有加减速斜坡，转子跟不上磁场）、
              要么工作点已越过矩频曲线（高频转矩不足）、要么机械卡滞/负载突增。对策：给加减速斜坡并留转矩余量、
              降速或加大驱动电流（不超过额定）、检查机械阻力；重要场合用闭环步进/伺服直接消除失步。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">8000 Hz 脉冲对应多少转速？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              看细分：1.8° 电机 8 细分时 PPR = 1600，8000 ÷ 1600 = 5 圈/秒 = 300 rpm；16 细分时 PPR = 3200，
              同样 8000 Hz 只有 150 rpm；不细分时 PPR = 200，8000 Hz 可到 2400 rpm。所以"给多少频率"必须连同
              步距角与细分一起算——这也是本页把五个参数做成联动的原因。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">0.9° 和 1.8° 电机怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              0.9° 每圈 400 整步，同样细分下 PPR 翻倍、定位分辨率与低速平稳性更好，但最高转速上限约低一半
              （同样频率下转速减半），常用于雕刻、扫描、显微镜等低速高分辨场合；1.8° 每圈 200 整步，
              转速上限高、惯性匹配更容易，是 3D 打印与通用自动化的默认选择。没想清楚就先用 1.8°。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'stepper-pulse-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Cog, Calculator, Info, AlertTriangle, ChevronUp, ChevronDown,
  Copy, CheckCircle, Settings2, Gauge, TrendingDown, Zap
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 通用数字清洗：Number / 字符串 → 有限数或 null（空输入、NaN → null）
function num(v) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) ? n : null
}

// 保留 6 位小数（消除 360/1.8=199.999... 一类浮点尾差，PPR 实际物理量为整数）
function round6(v) {
  return Math.round(v * 1e6) / 1e6
}

// 每转脉冲数 PPR = (360 / 步距角) × 细分
function pprOf(stepAngleDeg, microstep) {
  const a = num(stepAngleDeg)
  const m = num(microstep)
  if (a === null || !(a > 0) || m === null || !(m >= 1)) return null
  return round6((360 / a) * m)
}

// 每秒转数 rev/s = f / PPR
function revPerSec(freqHz, ppr) {
  const f = num(freqHz)
  const p = num(ppr)
  if (f === null || !(f >= 0) || p === null || !(p > 0)) return null
  return f / p
}

// 转速 rpm = rev/s × 60 = 60f / PPR
function rpmOf(freqHz, ppr) {
  const r = revPerSec(freqHz, ppr)
  if (r === null) return null
  return r * 60
}

// 反算脉冲频率 f = rpm × PPR / 60
function freqOfRpm(rpm, ppr) {
  const r = num(rpm)
  const p = num(ppr)
  if (r === null || !(r >= 0) || p === null || !(p > 0)) return null
  return (r * p) / 60
}

// 线速度 mm/s（丝杠口径）= rpm / 60 × 导程
function linearSpeedMmS(rpm, leadMm) {
  const r = num(rpm)
  const l = num(leadMm)
  if (r === null || !(r >= 0) || l === null || !(l > 0)) return null
  return (r / 60) * l
}

// 滚轮周长 mm = π × 直径
function rollerCircumferenceMm(diameterMm) {
  const d = num(diameterMm)
  if (d === null || !(d > 0)) return null
  return Math.PI * d
}

// 线速度 mm/s（滚轮圆周口径）= rpm / 60 × π × 直径
function linearSpeedRollerMmS(rpm, diameterMm) {
  const r = num(rpm)
  const c = rollerCircumferenceMm(diameterMm)
  if (r === null || !(r >= 0) || c === null) return null
  return (r / 60) * c
}

// 每毫米脉冲数 steps/mm = PPR / 导程（3D 打印 / GRBL 口径）
function pulsesPerMm(ppr, leadMm) {
  const p = num(ppr)
  const l = num(leadMm)
  if (p === null || !(p > 0) || l === null || !(l > 0)) return null
  return p / l
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '步进电机计算器 - 步距角/细分/脉冲频率/转速/导程五参联算',
  description: '在线步进电机计算器：步距角、细分、脉冲频率、转速、丝杠导程（或滚轮直径）五参联动换算，任意改一项反算其余；PPR=(360/步距角)×细分，附3D打印/直线模组/雕刻机场景预设、steps/mm输出与高频转矩下降、细分平滑本质说明，纯本地计算。',
  keywords: '步进电机计算, 脉冲频率转转速, 步进细分, 丝杠线速度, stepper calculator, ppr计算, steps/mm, 步进电机转速',
  author: '有条工具',
  ogTitle: '步进电机计算器 - 五参联算 | 有条工具',
  ogDescription: '步距角/细分/脉冲频率/转速/导程五参联动反算，丝杠与滚轮两种线速度口径，附场景预设与原理科普。',
  ogUrl: 'https://www.util.cn/tools/stepper-pulse-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '步进电机计算器',
  twitterDescription: '步进电机五参联算：步距角、细分、脉冲频率、转速、导程任意改一项反算其余。'
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
          name: '步进电机计算器',
          url: 'https://www.util.cn/tools/stepper-pulse-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '步距角/细分/脉冲频率/转速/导程五参联动，最后编辑为准',
            'PPR = (360°/步距角) × 细分，rev/s、rpm、线速度一键换算',
            '丝杠导程与滚轮直径（圆周口径）两种线速度折算',
            'steps/mm（每毫米脉冲）输出，3D 打印 / GRBL 口径',
            '3D 打印 / 直线模组 / 雕刻机场景预设',
            '高频转矩下降与细分平滑本质科普',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '步进电机计算器', item: 'https://www.util.cn/tools/stepper-pulse-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '细分是不是设得越大越好？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。超过 16~32 细分后平滑改善边际递减，而 PPR 成倍变大：同样的转速需要成倍脉冲频率，控制器与驱动器可能跟不上，转矩也随频率下降。常规 8~32 细分即可。' }
            },
            {
              '@type': 'Question',
              name: '步进电机为什么会失步？',
              acceptedAnswer: { '@type': 'Answer', text: '负载转矩超过当前频率下的输出转矩：升速太陡没有斜坡、工作点越过矩频曲线（高频转矩不足）或机械卡滞。对策是加减速斜坡、留转矩余量、降速或用闭环。' }
            },
            {
              '@type': 'Question',
              name: '8000 Hz 脉冲对应多少转速？',
              acceptedAnswer: { '@type': 'Answer', text: '取决于步距角与细分：1.8° 电机 8 细分时 PPR=1600，8000Hz = 5 圈/秒 = 300 rpm；16 细分时 PPR=3200 只有 150 rpm；不细分时 PPR=200 可到 2400 rpm。' }
            },
            {
              '@type': 'Question',
              name: '0.9° 和 1.8° 步进电机怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '0.9° 每圈 400 整步，分辨率与低速平稳性更好但同样频率下转速减半，适合雕刻/扫描等低速高分辨场合；1.8° 转速上限高、是通用与 3D 打印的默认选择。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'stepper-pulse-calculator'
const SETTINGS_KEY = 'stepper-pulse-calculator-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 常量 ----------
const ANGLE_PRESETS = [0.9, 1.8]
const MICROSTEPS = [1, 2, 4, 8, 16, 32, 64, 128, 256]
const SCENARIOS = [
  { id: '3dprint', label: '3D 打印', desc: '1.8° · 16 细分 · 导程 8mm', stepAngle: 1.8, microstep: 16, mech: 'lead', lead: 8, roller: 50 },
  { id: 'linear', label: '直线模组', desc: '1.8° · 8 细分 · 导程 5mm', stepAngle: 1.8, microstep: 8, mech: 'lead', lead: 5, roller: 50 },
  { id: 'cnc', label: '雕刻机', desc: '1.8° · 32 细分 · 滚轮 φ50mm', stepAngle: 1.8, microstep: 32, mech: 'roller', lead: 8, roller: 50 }
]

// ---------- 状态 ----------
const stepAngle = ref(1.8)
const microstep = ref(8)
const freqHz = ref(8000)
const rpm = ref(300)
const mechMode = ref('lead')        // 'lead' 丝杠导程 | 'roller' 滚轮直径
const leadMm = ref(8)
const rollerDia = ref(50)
const driveSource = ref('freq')     // 脉冲频率/转速中最近一次编辑的量（联动保留项）
const copyStatus = ref('idle')
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化 ----------
const fmt = (v, d = 2) => (Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—')

// ---------- 派生量（统一从 脉冲频率 出发换算，与输入联动保持一致） ----------
const pprC = computed(() => pprOf(stepAngle.value, microstep.value))

const revsC = computed(() => revPerSec(freqHz.value, pprC.value))
const rpmDisp = computed(() => {
  const r = revsC.value
  return r === null ? null : r * 60
})
const circC = computed(() => (mechMode.value === 'roller' ? rollerCircumferenceMm(rollerDia.value) : null))
const linearC = computed(() => {
  const r = rpmDisp.value
  if (r === null) return null
  if (mechMode.value === 'lead') return linearSpeedMmS(r, leadMm.value)
  return linearSpeedRollerMmS(r, rollerDia.value)
})
const stepsPerMmC = computed(() => (mechMode.value === 'lead' ? pulsesPerMm(pprC.value, leadMm.value) : null))

const mainValid = computed(() => pprC.value !== null && revsC.value !== null && linearC.value !== null)

// ---------- 联动逻辑（最后编辑者为准） ----------
// 改步距角 / 细分：PPR 变化，按最近一次编辑的「脉冲频率」或「转速」保留并反算另一个
function rederiveFromDrive() {
  const p = pprOf(stepAngle.value, microstep.value)
  if (p === null) return
  if (driveSource.value === 'rpm') {
    const r = num(rpm.value)
    if (r !== null && r >= 0) freqHz.value = round6(freqOfRpm(r, p))
  } else {
    const f = num(freqHz.value)
    if (f !== null && f >= 0) rpm.value = round6(rpmOf(f, p))
  }
}

function onFreqInput() {
  driveSource.value = 'freq'
  const p = pprC.value
  const f = num(freqHz.value)
  if (p !== null && f !== null && f >= 0) rpm.value = round6(rpmOf(f, p))
}

function onRpmInput() {
  driveSource.value = 'rpm'
  const p = pprC.value
  const r = num(rpm.value)
  if (p !== null && r !== null && r >= 0) freqHz.value = round6(freqOfRpm(r, p))
}

function pickStepAngle(a) {
  stepAngle.value = a
  rederiveFromDrive()
}

function pickMicrostep(m) {
  microstep.value = m
  rederiveFromDrive()
}

// 场景预设：沿用当前脉冲频率，重算转速与线速度
function applyScenario(s) {
  stepAngle.value = s.stepAngle
  microstep.value = s.microstep
  mechMode.value = s.mech
  leadMm.value = s.lead
  rollerDia.value = s.roller
  rederiveFromDrive()
  trackEvent('工具结果', '载入示例', TOOL_ID)
}

function scenarioActive(s) {
  const angleOk = stepAngle.value !== null && Math.abs(stepAngle.value - s.stepAngle) < 1e-9
  const mechOk = mechMode.value === s.mech &&
    (s.mech === 'lead'
      ? (leadMm.value !== null && Math.abs(leadMm.value - s.lead) < 1e-9)
      : (rollerDia.value !== null && Math.abs(rollerDia.value - s.roller) < 1e-9))
  return angleOk && mechOk && microstep.value === s.microstep
}

// ---------- 复制 TSV（clipboard + alert 反馈） ----------
function buildTsv() {
  const p = pprC.value
  const f = num(freqHz.value)
  const r = rpmDisp.value
  const lines = ['步进电机参数\t（有条工具 · 本地计算）']
  lines.push(`步距角\t${fmt(stepAngle.value, 2)}°`)
  lines.push(`细分\t${microstep.value}`)
  lines.push(`每转脉冲数PPR\t${p === null ? '—' : fmt(p, 6)}`)
  lines.push(`脉冲频率\t${f === null ? '—' : fmt(f, 2)}Hz`)
  lines.push(`转速\t${r === null ? '—' : fmt(r, 2)}rpm`)
  lines.push(`传动\t${mechMode.value === 'lead' ? `丝杠导程 ${fmt(leadMm.value, 2)}mm` : `滚轮直径 ${fmt(rollerDia.value, 2)}mm（周长 ${fmt(circC.value, 2)}mm）`}`)
  lines.push(`线速度\t${linearC.value === null ? '—' : fmt(linearC.value, 2)}mm/s`)
  lines.push(`每毫米脉冲\t${stepsPerMmC.value === null ? '—' : fmt(stepsPerMmC.value, 4)}`)
  return lines.join('\n')
}

let copyTimer = null
async function copyResult() {
  const text = buildTsv()
  try {
    await navigator.clipboard.writeText(text)
    copyStatus.value = 'ok'
    trackEvent('工具结果', '复制', TOOL_ID)
  } catch (err) {
    copyStatus.value = 'fail'
    alert('复制失败：浏览器未授权剪贴板，请手动记录参数。')
  }
  if (copyTimer !== null) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copyStatus.value = 'idle'; copyTimer = null }, 1600)
}

// ---------- 设置持久化（localStorage，键前缀=工具 id，仅 onMounted/交互回调内触碰） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (Number.isFinite(s.stepAngle) && s.stepAngle > 0) stepAngle.value = s.stepAngle
    if (MICROSTEPS.includes(s.microstep)) microstep.value = s.microstep
    if (Number.isFinite(s.freqHz) && s.freqHz >= 0) freqHz.value = s.freqHz
    if (Number.isFinite(s.rpm) && s.rpm >= 0) rpm.value = s.rpm
    if (s.mechMode === 'lead' || s.mechMode === 'roller') mechMode.value = s.mechMode
    if (Number.isFinite(s.leadMm) && s.leadMm > 0) leadMm.value = s.leadMm
    if (Number.isFinite(s.rollerDia) && s.rollerDia > 0) rollerDia.value = s.rollerDia
    if (s.driveSource === 'freq' || s.driveSource === 'rpm') driveSource.value = s.driveSource
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([stepAngle, microstep, freqHz, rpm, mechMode, leadMm, rollerDia, driveSource], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      stepAngle: stepAngle.value,
      microstep: microstep.value,
      freqHz: freqHz.value,
      rpm: rpm.value,
      mechMode: mechMode.value,
      leadMm: leadMm.value,
      rollerDia: rollerDia.value,
      driveSource: driveSource.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
