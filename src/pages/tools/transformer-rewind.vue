<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Box class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">变压器重绕计算</h1>
          <p class="text-sm text-muted-foreground mt-1">每伏匝数（数原绕组 / 按铁芯截面）、次级匝数与压降补偿、线径选择与窗口校验</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线变压器重绕计算器：优先按拆机数出的原初级匝数 N1 与原初级电压反推每伏匝数（最准口径），
        无原绕组数据时按铁芯净截面 Sc 用 45/Sc 经验式估算；输出重绕初级匝数、各次级匝数（含 5~10% 压降补偿滑杆）、
        按电流密度 2.5~3A/mm² 的绕线线径，并按窗口填充系数校验初级+次级总铜面积是否放得下、估算铁芯功率。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        计算口径：每伏匝数 TV = N1/V1（数原绕组，对应原铁芯的真实 B 值与 50Hz 工况，最准）或 TV = K/Sc（K=45 为常规硅钢片口径，
        约对应 Bm≈1.0T；铁芯质量差取 50~55）。V = 4.44·f·N·Bm·Sc 推得 K = 45.05/Bm，故 45/Sc 即按 Bm≈1.0T 的保守设计。
        次级匝数 N2 = TV×V2×(1+压降补偿)；线径 d = 1.13·√(I/J)（1.13 为 √(4/π)≈1.128 的工程圆整，裸铜线径）；
        窗口校验为"总裸铜面积 ≤ 填充系数 × 窗口面积"的必要条件口径。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器列 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 每伏匝数 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 每伏匝数
          </h2>

          <!-- 模式二选一 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">每伏匝数来源</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="tvMode = 'counted'"
                :class="tvMode === 'counted' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >数原绕组（推荐·最准）</button>
              <button
                @click="tvMode = 'core'"
                :class="tvMode === 'core' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >按铁芯截面估算</button>
            </div>
          </div>

          <!-- 数原绕组模式 -->
          <div v-if="tvMode === 'counted'" class="grid grid-cols-2 gap-3">
            <div>
              <label for="tr-n1" class="block text-sm font-medium text-foreground mb-1.5">原初级匝数 N1</label>
              <input
                id="tr-n1"
                v-model.number="n1Counted"
                type="number"
                min="1"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="拆机数出的匝数，如 880"
              >
              <p class="text-xs text-muted-foreground mt-1">拆初级时边拆边数，数层数×每层匝数更可靠</p>
            </div>
            <div>
              <label for="tr-v1" class="block text-sm font-medium text-foreground mb-1.5">原初级电压 V1（V）</label>
              <input
                id="tr-v1"
                v-model.number="v1"
                type="number"
                min="1"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 220"
              >
              <p class="text-xs text-muted-foreground mt-1">铭牌或标称输入电压</p>
            </div>
          </div>

          <!-- 按铁芯模式 -->
          <div v-if="tvMode === 'core'" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="tr-sc" class="block text-sm font-medium text-foreground mb-1.5">铁芯净截面 Sc（cm²）</label>
                <input
                  id="tr-sc"
                  v-model.number="scCm2"
                  type="number"
                  min="0.1"
                  step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 12.5"
                >
                <p class="text-xs text-muted-foreground mt-1">中柱叠厚 × 中柱舌宽，按净叠厚（扣除漆膜与不平度）计</p>
              </div>
              <div>
                <label for="tr-v1c" class="block text-sm font-medium text-foreground mb-1.5">初级电压 V1（V）</label>
                <input
                  id="tr-v1c"
                  v-model.number="v1"
                  type="number"
                  min="1"
                  step="1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 220"
                >
                <p class="text-xs text-muted-foreground mt-1">用于反推重绕初级匝数</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">铁芯质量口径 K（TV = K/Sc）</label>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="opt in CORE_K_OPTIONS"
                  :key="opt.k"
                  @click="coreK = opt.k"
                  :class="coreK === opt.k ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                >{{ opt.label }}</button>
              </div>
              <p class="text-xs text-muted-foreground mt-1">K 越大匝数越多、磁密越低：常规冷轧硅钢片取 45，片材老旧或来源不明取 50~55</p>
            </div>
          </div>

          <!-- TV 结果 -->
          <div v-if="tvResult && tvResult.ok" class="p-4 rounded-lg border border-primary/30 bg-primary/10">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">每伏匝数 TV</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(tvResult.tv, 2) }} <span class="text-sm">匝/V</span></p>
                <p class="text-xs text-muted-foreground mt-1">{{ tvResult.source }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">重绕初级匝数 N1'（{{ fmt(v1, 0) }} V）</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(tvResult.n1p, 0) }} <span class="text-sm">匝</span></p>
                <p class="text-xs mt-1" :class="tvMode === 'counted' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'">
                  {{ tvMode === 'counted' ? '与实测 N1 一致（口径自洽）' : 'N1\' = TV × V1，取整' }}
                </p>
              </div>
            </div>
          </div>
          <div v-else-if="tvResult && !tvResult.ok" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">
              {{ tvMode === 'counted' ? '请输入大于 0 的原初级匝数与电压。' : '请输入大于 0 的铁芯截面与初级电压。' }}
            </p>
          </div>
        </div>

        <!-- 次级绕组 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Zap class="w-5 h-5 mr-2 text-primary" /> 次级绕组
          </h2>

          <!-- 压降补偿与电流密度 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="tr-comp" class="block text-sm font-medium text-foreground mb-1.5">
                压降补偿：<span class="text-primary">{{ fmt(compPct, 1) }}%</span>
              </label>
              <input
                id="tr-comp"
                v-model.number="compPct"
                type="range"
                min="5"
                max="10"
                step="0.5"
                class="w-full border border-border rounded-lg accent-primary"
              >
              <p class="text-xs text-muted-foreground mt-1">满载压降补偿 5~10%，小功率取大值、大功率取小值；补偿越大空载电压越高</p>
            </div>
            <div>
              <label for="tr-j" class="block text-sm font-medium text-foreground mb-1.5">
                电流密度 J：<span class="text-primary">{{ fmt(jDensity, 1) }} A/mm²</span>
              </label>
              <input
                id="tr-j"
                v-model.number="jDensity"
                type="range"
                min="2.5"
                max="3"
                step="0.1"
                class="w-full border border-border rounded-lg accent-primary"
              >
              <p class="text-xs text-muted-foreground mt-1">2.5~3 A/mm² 常规口径，散热差/连续满载取 2.5，短时工作可取 3</p>
            </div>
          </div>

          <!-- 次级绕组 1 -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label for="tr-v2" class="block text-sm font-medium text-foreground mb-1.5">次级 1 电压 V2（V）</label>
              <input
                id="tr-v2"
                v-model.number="v2"
                type="number"
                min="0.1"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 12"
              >
            </div>
            <div>
              <label for="tr-i2" class="block text-sm font-medium text-foreground mb-1.5">次级 1 电流 I2（A）</label>
              <input
                id="tr-i2"
                v-model.number="i2"
                type="number"
                min="0.01"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 2"
              >
            </div>
          </div>

          <!-- 第二绕组开关 -->
          <div class="flex items-center gap-2">
            <input
              v-model="sec3Enabled"
              type="checkbox"
              id="tr-sec3"
              class="w-4 h-4 rounded border border-border"
            >
            <label for="tr-sec3" class="text-sm text-foreground">启用第二组次级绕组</label>
          </div>
          <div v-if="sec3Enabled" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label for="tr-v3" class="block text-sm font-medium text-foreground mb-1.5">次级 2 电压 V3（V）</label>
              <input
                id="tr-v3"
                v-model.number="v3"
                type="number"
                min="0.1"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 24"
              >
            </div>
            <div>
              <label for="tr-i3" class="block text-sm font-medium text-foreground mb-1.5">次级 2 电流 I3（A）</label>
              <input
                id="tr-i3"
                v-model.number="i3"
                type="number"
                min="0.01"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 1"
              >
            </div>
          </div>

          <!-- 次级结果 -->
          <div v-if="secResults" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
            <div v-for="(s, idx) in secResults" :key="idx" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">次级 {{ idx + 1 }} 匝数（{{ fmt(s.v, 1) }} V）</p>
                <p class="text-2xl font-bold text-primary">{{ s.rounded }} <span class="text-sm">匝</span></p>
                <p class="text-xs text-muted-foreground mt-1">精确 {{ fmt(s.exact, 1) }} 匝 = TV×V×(1+{{ fmt(compPct, 1) }}%)，四舍五入取整</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">裸线线径</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(s.dMm, 2) }} <span class="text-sm">mm</span></p>
                <p class="text-xs text-muted-foreground mt-1">d = 1.13·√(I/J)，精确 {{ fmt(s.dMm, 3) }} mm</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">绕组铜面积</p>
                <p class="text-sm font-medium text-foreground pt-1.5">{{ fmt(s.copperMm2, 1) }} mm²（{{ s.rounded }} 匝 × {{ fmt(s.areaMm2, 3) }} mm²）</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground pt-2 border-t border-primary/20 leading-relaxed">
              线径为裸铜外径，选购漆包线时漆膜外径略粗（约 +5~15%）；绕线按层排布，每层匝数 ≈ 可绕宽度 / 漆膜外径，
              层间垫 0.05mm 左右绝缘纸。补偿只在次级加，初级匝数不加补偿。
            </p>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">请先在上方得出每伏匝数，并输入大于 0 的次级电压与电流。</p>
          </div>
        </div>

        <!-- 窗口校验 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Package class="w-5 h-5 mr-2 text-primary" /> 窗口校验
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label for="tr-eta" class="block text-sm font-medium text-foreground mb-1.5">变压器效率 η</label>
              <input
                id="tr-eta"
                v-model.number="eta"
                type="number"
                min="0.5"
                max="1"
                step="0.05"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <p class="text-xs text-muted-foreground mt-1">小功率 EI 取 0.8~0.9，默认 0.85</p>
            </div>
            <div>
              <label for="tr-ww" class="block text-sm font-medium text-foreground mb-1.5">窗口宽（mm）</label>
              <input
                id="tr-ww"
                v-model.number="winW"
                type="number"
                min="1"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="中柱与外柱间距"
              >
            </div>
            <div>
              <label for="tr-wh" class="block text-sm font-medium text-foreground mb-1.5">窗口高（mm）</label>
              <input
                id="tr-wh"
                v-model.number="winH"
                type="number"
                min="1"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="叠片窗口有效高度"
              >
            </div>
            <div>
              <label for="tr-fill" class="block text-sm font-medium text-foreground mb-1.5">窗口填充系数</label>
              <input
                id="tr-fill"
                v-model.number="fillFactor"
                type="number"
                min="0.2"
                max="0.9"
                step="0.05"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <p class="text-xs text-muted-foreground mt-1">默认 0.8（裸铜口径上限）</p>
            </div>
          </div>

          <!-- 校验结果 -->
          <div v-if="windowResult" class="space-y-3">
            <div :class="windowResult.fits ? 'p-4 rounded-lg border border-green-500/30 bg-green-500/10' : 'p-4 rounded-lg bg-red-500/10 border border-red-500/20'">
              <div class="flex items-center gap-2 mb-2">
                <CheckCircle v-if="windowResult.fits" class="w-5 h-5 text-green-600 dark:text-green-400" />
                <AlertTriangle v-else class="w-5 h-5 text-red-500" />
                <p class="text-base font-bold" :class="windowResult.fits ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                  {{ windowResult.fits ? '放得下' : '放不下' }}
                </p>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p class="text-xs text-muted-foreground mb-0.5">初级电流估算 I1</p>
                  <p class="font-semibold text-foreground">{{ fmt(windowResult.i1, 3) }} A</p>
                  <p class="text-xs text-muted-foreground mt-0.5">I1 = Σ(Vi·Ii)/(η·V1)</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground mb-0.5">初级线径 d1</p>
                  <p class="font-semibold text-foreground">{{ fmt(windowResult.d1Mm, 2) }} mm</p>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ fmt(windowResult.n1p, 0) }} 匝 × {{ fmt(windowResult.a1Mm2, 2) }} mm²</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground mb-0.5">总铜面积</p>
                  <p class="font-semibold text-foreground">{{ fmt(windowResult.totalCopperMm2, 1) }} mm²</p>
                  <p class="text-xs text-muted-foreground mt-0.5">需用窗口 {{ fmt(windowResult.requiredMm2, 1) }} mm²（÷{{ fmt(fillFactor, 2) }}）</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground mb-0.5">窗口占用</p>
                  <p class="font-semibold" :class="windowResult.fits ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ fmt(windowResult.occupancyPct, 1) }}%
                  </p>
                  <p class="text-xs text-muted-foreground mt-0.5">上限 {{ fmt(fillFactor * 100, 0) }}%（{{ fmt(winW * winH, 0) }} mm²）</p>
                </div>
              </div>
            </div>
            <p class="text-xs leading-relaxed text-muted-foreground">
              判定口径：总裸铜面积 ≤ 填充系数 × 窗口面积，默认 0.8 为裸铜占比上限的<b>必要条件</b>——
              漆膜外径、层间绝缘纸、骨架壁厚与绕制松紧会额外占空间，实际手绕裸铜填充率通常只有 0.3~0.5，
              占用超过 60% 时建议按实际线径与层间绝缘试排布，或换大一号铁芯。
            </p>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">请完成每伏匝数与次级参数，并输入大于 0 的窗口尺寸。</p>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 铁芯功率估算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> 铁芯功率估算
          </h2>
          <div v-if="tvMode === 'core'">
            <label class="block text-sm font-medium text-foreground mb-1.5">铁芯净截面 Sc（cm²）</label>
            <input
              :value="fmt(scCm2, 2)"
              type="text"
              readonly
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-muted-foreground"
            >
            <p class="text-xs text-muted-foreground mt-1">沿用上方"按铁芯"模式的截面</p>
          </div>
          <div v-else>
            <label for="tr-scp" class="block text-sm font-medium text-foreground mb-1.5">铁芯净截面 Sc（cm²，可选）</label>
            <input
              id="tr-scp"
              v-model.number="scPowerCm2"
              type="number"
              min="0.1"
              step="0.1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="中柱舌宽 × 叠厚"
            >
          </div>

          <div v-if="powerResult" class="bg-muted/50 rounded-lg p-3 border border-border">
            <div class="grid grid-cols-2 gap-3 text-center">
              <div>
                <p class="text-xs text-muted-foreground mb-1">窗口面积</p>
                <p class="text-lg font-bold text-foreground">{{ fmt(powerResult.winCm2, 2) }} cm²</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">铁芯面积积 Ap</p>
                <p class="text-lg font-bold text-foreground">{{ fmt(powerResult.ap, 2) }} cm⁴</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-3 text-center">Ap = Sc × 窗口面积</p>
            <p class="text-2xl font-bold text-primary text-center mt-1">≈ {{ fmt(powerResult.powerVa, 0) }} VA</p>
            <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
              经验口径 P ≈ 1.66×Ap（VA）：按 50Hz、Bm≈1.0T（与 45/Sc 一致）、J=2.5A/mm²、
              窗口整体填充率 0.3（含漆膜/绝缘/骨架）推得 4.44·f·Bm·J·Kw = 1.66。
              好铁芯（Bm 1.2T 以上）可上浮 ~20%，差铁芯下调；<span class="text-foreground font-medium">以铁芯质量与牌号为准</span>，
              本值仅供重绕容量参考。
            </p>
          </div>
          <p v-else class="text-xs text-muted-foreground">输入铁芯截面后显示 Ap 与功率估算（"按铁芯"模式自动沿用）。</p>
        </div>

        <!-- 实用提示 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 重绕实用提示
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">拆线先记账：</span>拆初级前记层数与每层匝数、拍照叠片方向与引出头位置；数原绕组是最准的每伏匝数来源。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">叠片按原样：</span>E、I 片交错方向与每叠片数照原样装回，装错会增大气隙、空载电流猛增并发出嗡嗡声。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">绝缘不省料：</span>骨架、层间纸、初次级屏蔽层（如原机有）与出线端绝缘按原样恢复，耐压与温升都靠它。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">浸漆定型：</span>绕好浸绝缘漆并烘干，可降噪、防潮、改善散热；未浸漆的绕组松散，容易产生交流声。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">整流后电压：</span>桥式整流+电容滤波的直流空载电压 ≈ V2×1.414，重绕时别把次级电压与直流需求直接划等号；
              线性供电与压差选型可参考 <NuxtLink to="/tools/ldo-dropout" class="text-primary hover:underline">LDO 压差计算器</NuxtLink>。</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 免责条 -->
    <div class="flex items-start gap-2 p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
        免责声明：本页为 50Hz 硅钢片 EI 型变压器的重绕估算口径，环牛、C 型、高频变压器不适用；
        实际耐压、温升与空载电流须以绕后实测为准，市电 220V 绕制存在触电风险，请由具备资质的人员操作。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是变压器重绕</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          重绕是修复烧毁或改制电压的老式 EI 硅钢片变压器的经典手段：拆掉损坏绕组、保留铁芯与骨架，
          按每伏匝数重新绕线。核心参数是每伏匝数 TV——初级匝数 = TV×V1，次级匝数 = TV×V2×(1+压降补偿)。
          最准的 TV 来源是拆机时数出的原初级匝数 N1 与铭牌电压 V1 之比，因为它天然包含了原铁芯的磁密、
          叠厚与质量信息；实在没有原绕组数据时才退而按铁芯净截面用 TV = 45/Sc 估算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么空载电压偏高</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          变压器满载时，电流在初级电阻、次级电阻与漏抗上产生压降，次级电压会比空载低 5~10%（小功率变压器更明显）。
          设计者因此在次级多绕几匝（压降补偿），让满载电压落在标称值上——代价是空载时没有这些压降，
          空载电压天然比标称高 5~10% 左右，叠加电网电压 ±5~10% 的波动，空载测得 +10~20% 属正常现象，
          不是绕错了。判断方法：带额定负载再测，若满载电压接近标称即补偿合理；若空载高得离谱、
          空载电流也异常大，则要怀疑匝数不足（磁密过饱和）或叠片气隙问题。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">叠片方向与气隙</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          EI 铁芯靠 E 片与 I 片交错叠装形成闭合磁路，硅钢片有轧向：沿轧向磁导率高、铁损低，
          裁片方向装反会使励磁电流增大、温升变差。交错方式（如 2 片 E + 2 片 I 交替、或 4+4）决定等效气隙：
          交错越碎气隙越小、空载电流越低，但叠装越费工。重绕装片时必须按原叠法交错回装，
          切口毛刺要清理，避免局部短路环与残留气隙——气隙哪怕 0.1mm 也会让励磁电流明显增大并发出嗡嗡声。
          装好后可先测空载电流（约为额定工作电流的 5~15% 为正常）再浸漆。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">浸漆与噪音</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          变压器噪音来自 100Hz（50Hz 电源两倍频）的电磁力：漏磁让铁芯叠片、绕组互相吸引振动。
          松散的叠片与未固定的绕组像琴弦一样放大这种振动。重绕后浸绝缘漆并烘干（约 100~120°C 数小时），
          漆固化后把叠片、线匝、骨架黏成整体，可显著降噪、防潮并改善散热；装配时在铁芯与骨架、
          铁芯与夹件之间垫缓冲，紧固螺钉加弹簧垫也有帮助。若浸漆后仍啸叫，多为叠片未压紧或气隙过大。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">环牛 vs EI：重绕视角</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          环形变压器（环牛）绕组均匀环布、磁路闭合无气隙，漏磁小、效率高、外形扁平，但绕线需要环形绕线机、
          手工重绕困难，且对直流磁化（半波整流不对称负载）更敏感；EI 变压器成本低、好拆好绕、
          屏蔽与安装灵活，漏磁与空载噪音偏大，是手工重绕的主战场。二者重绕口径一致（每伏匝数、线径、
          窗口校验），但环牛没有"窗口"概念，需按环形截面与内径计算。重绕后的电源若需稳压，
          可配合 <NuxtLink to="/tools/ldo-dropout" class="text-primary hover:underline">LDO 压差计算器</NuxtLink>
          核算整流滤波后与稳压输出的压差余量。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">每伏匝数为什么按数原绕组算最准？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              TV = N1/V1 直接来自原变压器的真实设计点：原铁芯的磁密选择、叠片质量、甚至设计余量都体现在 N1 里。
              而 45/Sc 只是按 Bm≈1.0T 的统计口径，不知道原铁芯的真实质量——若原设计磁密更低（例如音响用低噪音变压器），
              按铁芯估算会少绕匝数、磁密超标、空载电流变大。所以数得清就一定数。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">重绕后空载电压偏高正常吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              正常。次级按 5~10% 压降补偿多绕了匝数，空载时没有负载压降，电压自然偏高；再叠加电网电压波动，
              空载高 10~20% 通常在正常范围。以额定负载下的电压为准；若满载仍明显偏高，则是补偿过头或匝数偏多。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">线径能选粗一号吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              可以且通常有利：铜损 I²R 与线径平方成反比，粗一号能降损耗与温升，但受窗口与绕制工艺限制——
              粗线绕不进、排线困难、层间电容增大。先用窗口校验确认总铜面积放得下，再尽量选粗一档；
              高频噪声耦合敏感的场合注意初次级间加静电屏蔽层。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">窗口校验放不下怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              按优先级：核对窗口尺寸与线径是否按漆膜外径计算（别用裸径低估占用）→ 适当提高电流密度（如 3A/mm²）
              减小线径 → 检查是否过度补偿 → 换大一号铁芯或改双骨架/双线并绕方案。硬塞会导致绕不下或压伤绝缘，
              耐压与温升都出问题。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'transformer-rewind'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Box, Calculator, Zap, Package, Gauge, Info, CheckCircle, AlertTriangle,
  ChevronUp, ChevronDown, Lightbulb
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 每伏匝数：数原绕组口径 TV = N1/V1（最准）
function tvFromCounted(n1, v1) {
  if (!Number.isFinite(n1) || !Number.isFinite(v1) || !(n1 > 0) || !(v1 > 0)) return null
  return n1 / v1
}

// 每伏匝数：铁芯口径 TV = K/Sc（Sc 为铁芯净截面 cm²；K=45 常规硅钢、50~55 差铁芯）
function tvFromCore(scCm2, k) {
  if (!Number.isFinite(scCm2) || !Number.isFinite(k) || !(scCm2 > 0) || !(k > 0)) return null
  return k / scCm2
}

// 次级匝数（含压降补偿）：精确值 = TV×V2×(1+comp/100)，工程值四舍五入
function secondaryTurns(tv, v2, compPct) {
  if (!Number.isFinite(tv) || !Number.isFinite(v2) || !Number.isFinite(compPct) || !(tv > 0) || !(v2 > 0)) return null
  const exact = tv * v2 * (1 + compPct / 100)
  return { exact, rounded: Math.round(exact) }
}

// 裸线线径：d = 1.13·√(I/J)（mm），1.13 为 √(4/π)≈1.1284 的工程圆整
function wireDiaMm(iA, jAmm2) {
  if (!Number.isFinite(iA) || !Number.isFinite(jAmm2) || !(iA > 0) || !(jAmm2 > 0)) return null
  return 1.13 * Math.sqrt(iA / jAmm2)
}

// 裸铜截面积：A = πd²/4（mm²）
function copperAreaMm2(dMm) {
  if (!Number.isFinite(dMm) || !(dMm > 0)) return null
  return Math.PI * dMm * dMm / 4
}

// 初级电流估算：I1 = Σ(Vi×Ii)/(η·V1)
function primaryCurrent(v1, loads, eta) {
  if (!Number.isFinite(v1) || !(v1 > 0) || !Array.isArray(loads) || !Number.isFinite(eta) || !(eta > 0)) return null
  let secPower = 0
  for (const ld of loads) {
    if (!Number.isFinite(ld.v) || !Number.isFinite(ld.i) || !(ld.v > 0) || !(ld.i > 0)) return null
    secPower += ld.v * ld.i
  }
  return secPower / (eta * v1)
}

// 窗口校验：放得下 ⟺ 总裸铜面积 ≤ 填充系数 × 窗口面积
function windowCheck(totalCopperMm2, winMm2, fill) {
  if (!Number.isFinite(totalCopperMm2) || !Number.isFinite(winMm2) || !Number.isFinite(fill) ||
    !(totalCopperMm2 > 0) || !(winMm2 > 0) || !(fill > 0) || fill > 1) return null
  return {
    fits: totalCopperMm2 <= fill * winMm2,
    requiredMm2: totalCopperMm2 / fill,
    occupancyPct: (totalCopperMm2 / winMm2) * 100
  }
}

// 铁芯功率估算：P ≈ 1.665×Ap（VA），Ap = Sc(cm²) × 窗口(cm²)
// 口径：50Hz、Bm≈1.0T（与 45/Sc 一致）、J=2.5A/mm²、窗口整体填充 0.3 → 4.44·f·Bm·J·Kw×1e-8 = 1.665
function corePowerVa(scCm2, winCm2) {
  if (!Number.isFinite(scCm2) || !Number.isFinite(winCm2) || !(scCm2 > 0) || !(winCm2 > 0)) return null
  return 1.665 * scCm2 * winCm2
}
// ==== PURE-FNS-END ====

// SEO
useSeoMeta({
  title: '变压器重绕计算 - 每伏匝数、线径与窗口校验',
  description: '在线变压器重绕计算器：按数原绕组 N1/V1 或铁芯截面 45/Sc 得每伏匝数，次级匝数含 5~10% 压降补偿，线径按电流密度 2.5~3A/mm²，窗口填充校验放得下/放不下，铁芯 Ap 功率估算，纯本地计算。',
  keywords: '变压器重绕, 每伏匝数, 变压器匝数计算, 铁芯截面, 线径选择, 压降补偿, 窗口校验, 环牛, EI变压器',
  author: '有条工具',
  ogTitle: '变压器重绕计算 - 每伏匝数、线径与窗口校验 | 有条工具',
  ogDescription: '每伏匝数双口径、压降补偿、线径选择与窗口填充校验。',
  ogUrl: 'https://www.util.cn/tools/transformer-rewind',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '变压器重绕计算',
  twitterDescription: '每伏匝数、压降补偿、线径与窗口校验。'
})

// JSON-LD 结构化数据（SoftwareApplication + FAQPage + BreadcrumbList）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '变压器重绕计算',
          url: 'https://www.util.cn/tools/transformer-rewind',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '每伏匝数双口径：数原绕组 N1/V1（推荐）与铁芯 45/Sc（50~55 可选）',
            '次级匝数含 5~10% 压降补偿滑杆',
            '线径 d = 1.13·√(I/J)，电流密度 2.5~3A/mm² 滑杆',
            '初级电流按次级功率与效率反推',
            '窗口填充校验（总铜面积 vs 填充系数×窗口面积）',
            '铁芯面积积 Ap 功率估算',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '每伏匝数为什么按数原绕组算最准？',
              acceptedAnswer: { '@type': 'Answer', text: 'TV = N1/V1 包含原铁芯的真实磁密与质量信息；45/Sc 只是 Bm≈1.0T 的统计口径，原设计磁密更低时会少绕匝数、空载电流变大。' }
            },
            {
              '@type': 'Question',
              name: '重绕后空载电压偏高正常吗？',
              acceptedAnswer: { '@type': 'Answer', text: '正常。次级按 5~10% 压降补偿多绕了匝数，空载时无负载压降，电压天然偏高，叠加电网波动空载高 10~20% 属正常，以满载电压为准。' }
            },
            {
              '@type': 'Question',
              name: '线径能选粗一号吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，铜损与温升都会降低，但先用窗口校验确认放得下；受窗口与排线工艺限制，硬塞会压伤绝缘。' }
            },
            {
              '@type': 'Question',
              name: '窗口校验放不下怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '先按漆膜外径复核占用，再适当提高电流密度减小线径、检查补偿是否过度，最后换大一号铁芯。' }
            }
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '变压器重绕计算', item: 'https://www.util.cn/tools/transformer-rewind' }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'transformer-rewind'
const SETTINGS_KEY = 'transformer-rewind-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 常量 ----------
const CORE_K_OPTIONS = [
  { k: 45, label: '45（常规硅钢片）' },
  { k: 50, label: '50（质量偏差）' },
  { k: 55, label: '55（差铁芯）' }
]

// ---------- 状态 ----------
const tvMode = ref('counted')   // 'counted' | 'core'
const n1Counted = ref(880)      // 原初级匝数
const v1 = ref(220)             // 初级电压
const scCm2 = ref(12.5)         // 铁芯净截面 cm²
const coreK = ref(45)           // 铁芯口径 K
const v2 = ref(12)              // 次级 1 电压
const i2 = ref(2)               // 次级 1 电流
const sec3Enabled = ref(false)  // 第二绕组
const v3 = ref(24)              // 次级 2 电压
const i3 = ref(1)               // 次级 2 电流
const compPct = ref(7)          // 压降补偿 %
const jDensity = ref(2.5)       // 电流密度 A/mm²
const eta = ref(0.85)           // 效率
const winW = ref(20)            // 窗口宽 mm
const winH = ref(30)            // 窗口高 mm
const fillFactor = ref(0.8)     // 窗口填充系数
const scPowerCm2 = ref(null)    // 功率估算用截面（数绕组模式可选）

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化 ----------
const fmt = (v, d = 2) => (Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—')

// ---------- 每伏匝数 ----------
const tvResult = computed(() => {
  if (tvMode.value === 'counted') {
    const tv = tvFromCounted(n1Counted.value, v1.value)
    if (tv === null) return { ok: false }
    return { ok: true, tv, n1p: n1Counted.value, source: `TV = N1/V1 = ${fmt(n1Counted.value, 0)}/${fmt(v1.value, 0)}` }
  }
  const tv = tvFromCore(scCm2.value, coreK.value)
  if (tv === null) return { ok: false }
  return {
    ok: true,
    tv,
    n1p: Math.round(tv * v1.value),
    source: `TV = ${coreK.value}/Sc = ${coreK.value}/${fmt(scCm2.value, 2)}（铁芯口径）`
  }
})

// ---------- 次级绕组 ----------
const secResults = computed(() => {
  const t = tvResult.value
  if (!t || !t.ok) return null
  const out = []
  const specs = [{ v: v2.value, i: i2.value }]
  if (sec3Enabled.value) specs.push({ v: v3.value, i: i3.value })
  for (const s of specs) {
    const n = secondaryTurns(t.tv, s.v, compPct.value)
    const d = wireDiaMm(s.i, jDensity.value)
    if (!n || !d) return null
    const area = copperAreaMm2(d)
    out.push({ v: s.v, i: s.i, exact: n.exact, rounded: n.rounded, dMm: d, areaMm2: area, copperMm2: n.rounded * area })
  }
  return out
})

// ---------- 窗口校验 ----------
const windowResult = computed(() => {
  const t = tvResult.value
  const secs = secResults.value
  if (!t || !t.ok || !secs) return null
  const winMm2 = winW.value * winH.value
  if (!Number.isFinite(winMm2) || !(winMm2 > 0)) return null

  const n1p = t.n1p
  const i1 = primaryCurrent(v1.value, secs.map(s => ({ v: s.v, i: s.i })), eta.value)
  if (i1 === null) return null
  const d1 = wireDiaMm(i1, jDensity.value)
  if (d1 === null) return null
  const a1Unit = copperAreaMm2(d1)
  if (a1Unit === null) return null
  const a1Mm2 = n1p * a1Unit

  const totalCopperMm2 = a1Mm2 + secs.reduce((acc, s) => acc + s.copperMm2, 0)
  const chk = windowCheck(totalCopperMm2, winMm2, fillFactor.value)
  if (chk === null) return null
  return {
    i1, d1Mm: d1, n1p, a1Mm2, totalCopperMm2,
    requiredMm2: chk.requiredMm2,
    occupancyPct: chk.occupancyPct,
    fits: chk.fits
  }
})

// ---------- 铁芯功率估算 ----------
const powerResult = computed(() => {
  const winMm2 = winW.value * winH.value
  if (!Number.isFinite(winMm2) || !(winMm2 > 0)) return null
  const winCm2 = winMm2 / 100
  const sc = tvMode.value === 'core' ? scCm2.value : scPowerCm2.value
  const p = corePowerVa(sc, winCm2)
  if (p === null) return null
  return { winCm2, ap: sc * winCm2, powerVa: p }
})

// ---------- 设置持久化（localStorage，键前缀用工具 id） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (s.tvMode === 'counted' || s.tvMode === 'core') tvMode.value = s.tvMode
    if (Number.isFinite(s.n1Counted) && s.n1Counted > 0) n1Counted.value = s.n1Counted
    if (Number.isFinite(s.v1) && s.v1 > 0) v1.value = s.v1
    if (Number.isFinite(s.scCm2) && s.scCm2 > 0) scCm2.value = s.scCm2
    if ([45, 50, 55].includes(s.coreK)) coreK.value = s.coreK
    if (Number.isFinite(s.v2) && s.v2 > 0) v2.value = s.v2
    if (Number.isFinite(s.i2) && s.i2 > 0) i2.value = s.i2
    if (typeof s.sec3Enabled === 'boolean') sec3Enabled.value = s.sec3Enabled
    if (Number.isFinite(s.v3) && s.v3 > 0) v3.value = s.v3
    if (Number.isFinite(s.i3) && s.i3 > 0) i3.value = s.i3
    if (Number.isFinite(s.compPct) && s.compPct >= 5 && s.compPct <= 10) compPct.value = s.compPct
    if (Number.isFinite(s.jDensity) && s.jDensity >= 2.5 && s.jDensity <= 3) jDensity.value = s.jDensity
    if (Number.isFinite(s.eta) && s.eta > 0 && s.eta <= 1) eta.value = s.eta
    if (Number.isFinite(s.winW) && s.winW > 0) winW.value = s.winW
    if (Number.isFinite(s.winH) && s.winH > 0) winH.value = s.winH
    if (Number.isFinite(s.fillFactor) && s.fillFactor > 0 && s.fillFactor <= 1) fillFactor.value = s.fillFactor
    if (s.scPowerCm2 === null || (Number.isFinite(s.scPowerCm2) && s.scPowerCm2 > 0)) scPowerCm2.value = s.scPowerCm2
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([tvMode, n1Counted, v1, scCm2, coreK, v2, i2, sec3Enabled, v3, i3, compPct, jDensity, eta, winW, winH, fillFactor, scPowerCm2], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      tvMode: tvMode.value,
      n1Counted: n1Counted.value,
      v1: v1.value,
      scCm2: scCm2.value,
      coreK: coreK.value,
      v2: v2.value,
      i2: i2.value,
      sec3Enabled: sec3Enabled.value,
      v3: v3.value,
      i3: i3.value,
      compPct: compPct.value,
      jDensity: jDensity.value,
      eta: eta.value,
      winW: winW.value,
      winH: winH.value,
      fillFactor: fillFactor.value,
      scPowerCm2: scPowerCm2.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
