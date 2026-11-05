<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Magnet class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">空芯电感计算</h1>
          <p class="text-sm text-muted-foreground mt-1">Wheeler 公式单层空芯线圈：L / 匝数 / 长度 / 直径四向互算、密绕模式与线径建议</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线空芯电感计算器：按 Wheeler 单层螺线管公式计算无磁芯线圈的电感量，支持给定 L/d/l 求匝数、n/d/l 验算电感、
        n/d/L 反求线圈长度、n/l/L 反求线圈直径四向互算；密绕模式按 l = 匝数 × 线径 自动折算绕线长度，
        并按电流密度 2~3A/mm² 给出裸线线径与最近 AWG 线规。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        计算口径：Wheeler（1928）单层空芯螺线管经验式，英寸原式 L(µH) = n²r²/(9r + 10l)（r 为半径、l 为绕线长度，英寸），
        换算成公制（d、l 单位 mm）为 L(µH) = d²·n²×10⁻³ / (0.4572·d + 1.016·l)。
        适用范围：单层空芯、圆截面螺线管；绕线长度大于 0.4 倍线圈直径（l/D &gt; 0.4）时误差约 1% 以内，
        线圈过短（l/D ≤ 0.4）误差增大；多层线圈、环形线圈不适用。d 按绕组中径（骨架外径 + 一根线径）取值。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器列 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 四向互算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 四向互算
          </h2>

          <!-- 求解对象 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">求解对象</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                @click="mode = 'n'"
                :class="mode === 'n' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >求匝数 n</button>
              <button
                @click="mode = 'L'"
                :class="mode === 'L' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >求电感 L</button>
              <button
                @click="mode = 'l'"
                :class="mode === 'l' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >求长度 l</button>
              <button
                @click="mode = 'd'"
                :class="mode === 'd' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >求直径 d</button>
            </div>
          </div>

          <!-- 密绕模式 -->
          <div v-if="mode !== 'l'" class="flex items-start gap-2">
            <input
              v-model="closeWound"
              type="checkbox"
              id="aci-close-wound"
              class="w-4 h-4 mt-0.5 rounded border border-border"
            >
            <label for="aci-close-wound" class="text-sm text-foreground">
              密绕模式（绕线长度 l = 匝数 × 线径，自动折算）
              <span class="block text-xs text-muted-foreground mt-0.5">
                求长度模式下密绕无意义（l 本身是未知量），该模式下按开绕输入实际绕线长度
              </span>
            </label>
          </div>

          <!-- 输入区 -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div v-if="mode !== 'd'">
              <label for="aci-d" class="block text-sm font-medium text-foreground mb-1.5">线圈中径 d（mm）</label>
              <input
                id="aci-d"
                v-model.number="coilD"
                type="number"
                min="0.1"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 10"
              >
              <p class="text-xs text-muted-foreground mt-1">骨架外径 + 一根线径</p>
            </div>
            <div v-if="mode === 'n' || mode === 'd' || (mode === 'L' && !closeWound)">
              <label for="aci-l" class="block text-sm font-medium text-foreground mb-1.5">
                {{ closeWound ? '绕线长度 l（密绕自动）' : '绕线长度 l（mm）' }}
              </label>
              <input
                v-if="!closeWound"
                id="aci-l"
                v-model.number="coilL"
                type="number"
                min="0.1"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 10"
              >
              <input
                v-else
                :value="closeLenText"
                type="text"
                readonly
                class="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-muted-foreground"
              >
            </div>
            <div v-if="mode !== 'n'">
              <label for="aci-n" class="block text-sm font-medium text-foreground mb-1.5">匝数 n</label>
              <input
                id="aci-n"
                v-model.number="turns"
                type="number"
                min="1"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 10"
              >
            </div>
            <div v-if="mode !== 'L'">
              <label for="aci-lt" class="block text-sm font-medium text-foreground mb-1.5">目标电感 L（µH）</label>
              <input
                id="aci-lt"
                v-model.number="targetL"
                type="number"
                min="0.0001"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 1"
              >
            </div>
            <div v-if="closeWound && mode !== 'l'">
              <label for="aci-dw" class="block text-sm font-medium text-foreground mb-1.5">裸线线径（mm）</label>
              <input
                id="aci-dw"
                v-model.number="wireD"
                type="number"
                min="0.01"
                step="0.01"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 0.5"
              >
              <p class="text-xs text-muted-foreground mt-1">裸铜外径，可由下方线径建议填充</p>
            </div>
          </div>

          <!-- 结果：开绕求匝数 -->
          <div v-if="mainResult && mainResult.kind === 'n-open'" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">匝数（精确值）</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(mainResult.nExact, 2) }} <span class="text-sm">匝</span></p>
                <p class="text-xs text-muted-foreground mt-1">n = √(L·(0.4572d + 1.016l)) / (0.0316·d)（d、l 单位 mm）</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">取整后实际电感（{{ mainResult.nRound }} 匝）</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(mainResult.lAtRound, 3) }} <span class="text-sm">µH</span></p>
                <p class="text-xs mt-1" :class="roundDevCls(mainResult)">
                  目标 {{ fmt(targetL, 2) }} µH，偏差 {{ fmt(mainResult.roundDevPct, 1) }}%
                </p>
              </div>
            </div>
            <p v-if="shapeNote(mainResult)" class="text-xs" :class="shapeNote(mainResult).cls">{{ shapeNote(mainResult).text }}</p>
          </div>

          <!-- 结果：密绕求匝数 -->
          <div v-if="mainResult && mainResult.kind === 'n-cw'" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">匝数（精确值，密绕 l = n × {{ fmt(wireD, 2) }} mm）</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(mainResult.nExact, 2) }} <span class="text-sm">匝</span></p>
                <p class="text-xs text-muted-foreground mt-1">密绕下 l 随 n 增长，方程为二次式，直接解得 n</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">取整 {{ mainResult.nRound }} 匝后的实际电感</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(mainResult.lAtRound, 3) }} <span class="text-sm">µH</span></p>
                <p class="text-xs text-muted-foreground mt-1">此时绕线长度 l = {{ fmt(mainResult.lMm, 2) }} mm</p>
              </div>
            </div>
            <p v-if="shapeNote(mainResult)" class="text-xs" :class="shapeNote(mainResult).cls">{{ shapeNote(mainResult).text }}</p>
          </div>

          <!-- 结果：求电感 -->
          <div v-if="mainResult && mainResult.kind === 'L'" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">电感量</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(mainResult.luH, 4) }} <span class="text-sm">µH</span></p>
                <p class="text-xs text-muted-foreground mt-1">即 {{ fmt(mainResult.nH, 1) }} nH</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">代入参数</p>
                <p class="text-sm font-medium text-foreground pt-1.5">
                  d = {{ fmt(mainResult.dMm, 2) }} mm，l = {{ fmt(mainResult.lMm, 2) }} mm，n = {{ fmt(turns, 0) }} 匝
                </p>
                <p class="text-xs text-muted-foreground mt-1">
                  <span v-if="closeWound">密绕：l = n × 线径 = {{ fmt(turns, 0) }} × {{ fmt(wireD, 2) }} mm</span>
                  <span v-else>开绕：l 为实际绕线长度</span>
                </p>
              </div>
            </div>
            <p v-if="shapeNote(mainResult)" class="text-xs" :class="shapeNote(mainResult).cls">{{ shapeNote(mainResult).text }}</p>
          </div>

          <!-- 结果：求长度 -->
          <div v-if="mainResult && mainResult.kind === 'l'" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">所需绕线长度</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(mainResult.lMm, 2) }} <span class="text-sm">mm</span></p>
                <p class="text-xs text-muted-foreground mt-1">l = (d²n²×10⁻³/L − 0.4572d) / 1.016（mm）</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">绕法建议</p>
                <p class="text-sm font-medium text-foreground pt-1.5">
                  <span v-if="mainResult.lMm / mainResult.dMm > 0.9">密绕可能放不下，建议间绕拉开匝距</span>
                  <span v-else-if="mainResult.lMm / mainResult.dMm > 0.45">接近密绕上限，可密绕或轻微间绕</span>
                  <span v-else>可密绕，注意 l/D 是否大于 0.4</span>
                </p>
              </div>
            </div>
            <p v-if="shapeNote(mainResult)" class="text-xs" :class="shapeNote(mainResult).cls">{{ shapeNote(mainResult).text }}</p>
          </div>

          <!-- 结果：求直径 -->
          <div v-if="mainResult && mainResult.kind === 'd'" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">所需线圈中径</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(mainResult.dMm, 2) }} <span class="text-sm">mm</span></p>
                <p class="text-xs text-muted-foreground mt-1">
                  骨架外径 ≈ 中径 − 线径{{ closeWound ? ' = ' + fmt(mainResult.dMm - wireD, 2) + ' mm' : '（按实际线径扣除）' }}
                </p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">代入参数</p>
                <p class="text-sm font-medium text-foreground pt-1.5">
                  n = {{ fmt(turns, 0) }} 匝，L = {{ fmt(targetL, 2) }} µH，l = {{ fmt(mainResult.lMm, 2) }} mm
                </p>
                <p class="text-xs text-muted-foreground mt-1">方程 10⁻³n²d² − 0.4572Ld − 1.016Ll = 0 的正根</p>
              </div>
            </div>
            <p v-if="shapeNote(mainResult)" class="text-xs" :class="shapeNote(mainResult).cls">{{ shapeNote(mainResult).text }}</p>
          </div>

          <!-- 无解提示 -->
          <div v-if="mainResult && mainResult.kind === 'l-invalid'" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">无解：所需绕线长度为负</p>
              <p class="text-xs text-muted-foreground mt-1">
                在 d = {{ fmt(coilD, 2) }} mm、n = {{ fmt(turns, 0) }} 匝下，匝数贡献的电感下限已超过目标
                {{ fmt(targetL, 2) }} µH——即使绕成一匝贴一匝也达不到。请减小匝数、加大电感目标或增大直径后重算。
              </p>
            </div>
          </div>

          <!-- 参数无效 -->
          <div v-if="!mainResult" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">
              请检查参数：直径、长度、匝数、电感均须为正数；密绕模式还需线径大于 0。
            </p>
          </div>

          <p class="text-xs leading-relaxed text-muted-foreground">
            d 取绕组中径（骨架外径 + 一根裸线外径）；密绕时实际外径略大，漆包线外径约比裸线大 5~15%，
            匝距按漆膜外径排布会使 l 略增，电感随之略增，工程上通常按裸线径估算即可。
          </p>
        </div>

        <!-- 线径建议 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 线径建议（按电流密度）
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label for="aci-i" class="block text-sm font-medium text-foreground mb-1.5">线圈工作电流（A）</label>
              <input
                id="aci-i"
                v-model.number="workCurrent"
                type="number"
                min="0.01"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 1"
              >
            </div>
            <div>
              <label for="aci-j" class="block text-sm font-medium text-foreground mb-1.5">
                电流密度 J：<span class="text-primary">{{ fmt(currentDensity, 1) }} A/mm²</span>
              </label>
              <input
                id="aci-j"
                v-model.number="currentDensity"
                type="range"
                min="2"
                max="3"
                step="0.1"
                class="w-full border border-border rounded-lg accent-primary mt-2"
              >
              <p class="text-xs text-muted-foreground mt-1">2~3 A/mm² 常规口径，短时间工作可放宽</p>
            </div>
            <div class="flex items-end">
              <button
                v-if="wireSuggestion && mainResult && (mainResult.kind === 'n-cw' || mainResult.kind === 'L')"
                @click="wireD = parseFloat(wireSuggestion.dMm.toFixed(3))"
                class="w-full py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all"
              >用作密绕线径</button>
            </div>
          </div>

          <div v-if="wireSuggestion" class="p-4 rounded-lg border border-border bg-muted/50">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div>
                <p class="text-xs text-muted-foreground mb-1">建议裸线线径</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(wireSuggestion.dMm, 2) }} <span class="text-sm">mm</span></p>
                <p class="text-xs text-muted-foreground mt-1">d = 1.13·√(I/J)，精确 {{ fmt(wireSuggestion.dMm, 3) }} mm</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">最近 AWG 线规</p>
                <p class="text-2xl font-bold text-foreground">AWG {{ wireSuggestion.awg }}</p>
                <p class="text-xs text-muted-foreground mt-1">标称裸径 {{ fmt(wireSuggestion.awgDiameter, 3) }} mm</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">截面 / 电流校验</p>
                <p class="text-sm font-medium text-foreground pt-1.5">{{ fmt(wireSuggestion.areaMm2, 3) }} mm²，实际密度 {{ fmt(wireSuggestion.realJ, 2) }} A/mm²</p>
                <p class="text-xs text-muted-foreground mt-1">按 AWG 标称径回算</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
              AWG 由裸径换算：AWG = 36 − 39·ln(d/0.127)/ln(92) 四舍五入；漆包线外径（含漆膜）约比裸径大 5~15%，
              密绕排线与窗口校核应按外径计。高频大电流时还需结合趋肤效应校核有效截面，
              PCB 铜箔载流与铜厚换算可用 <NuxtLink to="/tools/copper-thickness-converter" class="text-primary hover:underline">铜厚与线规换算器</NuxtLink>。
            </p>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">请输入大于 0 的工作电流（电流密度 2~3 A/mm²）。</p>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- Wheeler 口径 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> Wheeler 公式口径
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border text-sm space-y-1.5">
            <p class="text-muted-foreground">英寸原式（1928）</p>
            <p class="font-semibold text-foreground">L(µH) = n²r² / (9r + 10l)</p>
            <p class="text-xs text-muted-foreground">r = 半径、l = 绕线长度，单位英寸</p>
            <p class="text-muted-foreground pt-1">公制换算（本页采用）</p>
            <p class="font-semibold text-foreground">L(µH) = d²n²×10⁻³ / (0.4572d + 1.016l)</p>
            <p class="text-xs text-muted-foreground">d、l 单位 mm；系数 0.4572 = 18/39.3701，1.016 = 40/39.3701，由英寸式精确换算而来</p>
          </div>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">精度条件：</span>绕线长度大于 0.4 倍直径（l/D &gt; 0.4）时误差约 1% 以内；线圈过短误差增大，短线圈建议用数值法或分段公式。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">适用对象：</span>单层空芯圆螺线管。多层线圈、环形（toroidal）、带磁芯线圈均不适用。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">密绕 vs 实测：</span>密绕只是估算 l 的方式，公式对密绕、间绕同样成立，关键是 l 用真实绕线长度。</span>
            </li>
          </ul>
        </div>

        <!-- 实用提示 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 实用提示
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">电感量微调：</span>匝数对电感是平方关系，L ∝ n²，匝数 ±1% 电感约 ±2%；微调优先增减半匝到一匝。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">引线与焊盘：</span>引线长度计入电感（约 1nH/mm 量级），高频应用尽量短；引线从同一点出线可减小寄生电感耦合。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">附近金属：</span>线圈靠近金属板/屏蔽罩会降低电感并拉低 Q，保持距离 ≥ 1 倍直径。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">固定方式：</span>用低损耗胶（热熔胶、硅橡胶）固定线匝，避免普通含溶剂胶水影响高频损耗。</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 免责条 -->
    <div class="flex items-start gap-2 p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
        免责声明：Wheeler 公式为经验近似，未计入引线电感、匝间分布电容与邻近效应；批量生产或精密应用请以 LCR 表/电桥实测为准微调匝距与匝数。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是空芯电感</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          空芯电感（air core inductor）指绕在非磁性骨架（塑料、陶瓷、空气）上的线圈，磁路介质磁导率 μr ≈ 1。
          它的单位体积电感量远低于铁氧体/磁芯电感，但没有磁饱和问题、电感量不随偏置电流漂移、高频损耗低，
          因此广泛用于射频谐振回路、滤波器、天线匹配、扼流等场景。工程上最常用 Wheeler 单层螺线管经验公式估算：
          L(µH) = d²n²×10⁻³/(0.4572d + 1.016l)（d、l 单位 mm），绕线长度大于 0.4 倍直径时误差约 1%。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么空芯线圈不会磁饱和</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          磁饱和是磁性材料特有的现象：铁氧体、硅钢等铁磁材料的 B-H 曲线在磁通密度超过饱和磁通密度 Bs（铁氧体约 0.3~0.5T，
          硅钢约 1.5~2T）后趋于水平，磁导率急剧下降，表现为电感量随电流增大而塌陷。空芯线圈的介质是空气/塑料，
          磁导率恒为 μ₀ 且 B-H 严格线性，无论通多大电流电感量都保持不变，也不存在温升导致的磁导率漂移。
          这使空芯线圈特别适合大直流偏置的扼流、射频功放的谐振回路等对线性度敏感的场合；
          代价是要达到同样电感量必须更多的匝数和更大的体积，铜损也更可观。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Q 值与趋肤效应</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          线圈品质因数 Q = ωL/ESR，其中 ESR 是绕线电阻、介质损耗与辐射损耗的等效串联电阻。高频下趋肤效应使电流集中在导线表面：
          铜的趋肤深度 δ ≈ 66/√f(mm)（f 单位 Hz），1MHz 时约 0.066mm，10MHz 时仅 0.021mm——当趋肤深度明显小于线径时，
          有效导电截面锐减、交流电阻远高于直流电阻，Q 随频率先升后降。提高 Q 的常用手段：
          按 δ 的 2~3 倍选多股利兹线或扁铜带、镀银线、增大线圈直径与匝距（降低邻近效应）、
          采用低损耗骨架。邻近效应在密绕多层时尤其严重，这也是单层间绕线圈 Q 更高的原因之一。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">骨架介电常数的影响</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          骨架并非"看不见"的材料：它与线匝构成分布电容，介电常数 εr 决定了这部分电容的大小，
          并通过介质损耗角正切 tanδ 直接消耗能量。聚四氟乙烯（εr≈2.1，tanδ 极小）、聚苯乙烯、陶瓷骨架高频损耗最低；
          PLA/ABS/亚克力（εr≈2.5~3.5）在短波以下尚可，VHF 以上 Q 损失开始显著；纸质、酚醛骨架损耗更大且受潮后恶化。
          高 Q 谐振线圈应选低损耗骨架、骨架尽量薄（线圈贴近空气），并避免骨架开槽积尘受潮。
          骨架对电感量的影响很小（百分之几量级），主要影响的是 Q 与自谐振频率。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">密绕 vs 间绕</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          密绕（匝贴匝）绕线紧凑、容易绕制，是中短波线圈的传统做法；但相邻匝之间的分布电容大，
          自谐振频率（SRF）偏低，高频下电感有效值下降。间绕（按节距拉开匝距，常见骨架带螺纹槽）分布电容小、
          Q 更高、参数一致性更好，是 VHF 及以上和精密谐振回路的做法。对 Wheeler 公式而言两种绕法没有区别——
          公式只关心真实绕线长度 l，密绕时 l ≈ 匝数 × 漆膜外径，间绕时 l = 匝距 × (n − 1) + 线径。
          需要计算天线谐振长度时，配合 <NuxtLink to="/tools/antenna-length" class="text-primary hover:underline">天线长度计算器</NuxtLink>
          按工作频段估算波长与谐振尺寸。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">Wheeler 公式适用于什么范围？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              单层空芯圆螺线管，绕线长度大于 0.4 倍线圈直径（l/D &gt; 0.4）时误差约 1% 以内；线圈过短（扁平状）误差增大。
              多层线圈、环形线圈、带磁芯线圈都不适用。d 应取绕组中径（骨架外径 + 一根线径），l 用实际绕线长度。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">密绕和间绕算出来的电感一样吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              只要绕线长度 l 相同，电感量基本相同——公式不区分绕法。区别在寄生参数：密绕匝间电容大、自谐振频率低、
              邻近效应损耗大；间绕电容小、Q 高。同匝数下间绕因 l 更长电感会略大，属于正常现象。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">多层线圈怎么算电感？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              本页公式只针对单层。多层线圈可用 Wheeler 多层经验式（L = 0.8a²n²/(6a+9b+10c) 英寸口径，a 平均半径、
              b 绕组高度、c 绕组厚度）粗估，或用数值方法（如 Maxwell 电感积分）计算；多层绕组邻近效应显著，
              高频应用建议改单层间绕或利兹线，最后以实测为准。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">线径怎么选？要考虑趋肤效应吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              按电流密度 2~3 A/mm² 选裸线线径（d = 1.13·√(I/J)），再取最近的 AWG 或国标线规。
              数百 kHz 以上时检查趋肤深度：δ ≈ 66/√f(mm)，若 δ 明显小于线径，实际交流电阻按趋肤截面估算，
              大电流谐振回路可改多股利兹线。绕制时漆膜外径决定匝距，密绕按外径排布。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'air-core-inductor'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Magnet, Calculator, Ruler, Info, CheckCircle, AlertTriangle,
  ChevronUp, ChevronDown, Lightbulb
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// Wheeler 单层空芯螺线管公式的公制系数（由英寸式 L = n²r²/(9r+10l) 精确换算）
// L(µH) = d²n²×1e-3 / (0.4572·d + 1.016·l)，d、l 单位 mm
const WHEELER_A = 0.4572  // = 18/39.3701，直径系数
const WHEELER_B = 1.016   // = 40/39.3701，长度系数

function isPos(v) {
  return Number.isFinite(v) && v > 0
}

// 正算电感（µH）
function wheelerLuH(dMm, lMm, n) {
  if (!isPos(dMm) || !isPos(lMm) || !isPos(n)) return null
  const den = WHEELER_A * dMm + WHEELER_B * lMm
  if (!(den > 0)) return null
  return (dMm * dMm * n * n * 1e-3) / den
}

// 由 L 求匝数：n = √(L·(0.4572d + 1.016l) / (1e-3·d²))
function solveTurns(dMm, lMm, luH) {
  if (!isPos(dMm) || !isPos(lMm) || !isPos(luH)) return null
  const val = (luH * (WHEELER_A * dMm + WHEELER_B * lMm)) / (1e-3 * dMm * dMm)
  if (!(val > 0)) return null
  return Math.sqrt(val)
}

// 由 L 求绕线长度：l = (1e-3·d²·n²/L − 0.4572d) / 1.016，无解返回 null
function solveLength(dMm, n, luH) {
  if (!isPos(dMm) || !isPos(n) || !isPos(luH)) return null
  const l = (1e-3 * dMm * dMm * n * n / luH - WHEELER_A * dMm) / WHEELER_B
  return l > 0 ? l : null
}

// 由 L 求直径：1e-3·n²·d² − 0.4572·L·d − 1.016·L·l = 0 的正根
function solveDiameter(n, lMm, luH) {
  if (!isPos(n) || !isPos(lMm) || !isPos(luH)) return null
  const a = 1e-3 * n * n
  const b = -WHEELER_A * luH
  const c = -WHEELER_B * luH * lMm
  const disc = b * b - 4 * a * c
  if (!(disc > 0)) return null
  return (-b + Math.sqrt(disc)) / (2 * a)
}

// 密绕模式由 L 求匝数（l = n·dw）：1e-3·d²·n² − 1.016·L·dw·n − 0.4572·L·d = 0 的正根
function solveTurnsCloseWound(dMm, wireDmm, luH) {
  if (!isPos(dMm) || !isPos(wireDmm) || !isPos(luH)) return null
  const a = 1e-3 * dMm * dMm
  const b = -WHEELER_B * luH * wireDmm
  const c = -WHEELER_A * luH * dMm
  const disc = b * b - 4 * a * c
  if (!(disc > 0)) return null
  return (-b + Math.sqrt(disc)) / (2 * a)
}

// 密绕模式由 L 求直径：1e-3·n²·d² − 0.4572·L·d − 1.016·L·n·dw = 0 的正根
function solveDiameterCloseWound(n, wireDmm, luH) {
  if (!isPos(n) || !isPos(wireDmm) || !isPos(luH)) return null
  const a = 1e-3 * n * n
  const b = -WHEELER_A * luH
  const c = -WHEELER_B * luH * n * wireDmm
  const disc = b * b - 4 * a * c
  if (!(disc > 0)) return null
  return (-b + Math.sqrt(disc)) / (2 * a)
}

// 形状系数：l/D > 0.4 时 Wheeler 误差约 1% 以内
function shapeRatio(lMm, dMm) {
  if (!isPos(lMm) || !isPos(dMm)) return null
  return lMm / dMm
}

// 裸线线径：d = 1.13·√(I/J)（mm），1.13 为 √(4/π)≈1.1284 的工程圆整
function wireDiameterMm(iA, jAmm2) {
  if (!isPos(iA) || !isPos(jAmm2)) return null
  return 1.13 * Math.sqrt(iA / jAmm2)
}

// 最近 AWG 线规：AWG = 36 − 39·ln(d/0.127)/ln(92) 四舍五入，返回 { awg, awgDiameter }
function nearestAwg(dMm) {
  if (!isPos(dMm)) return null
  const raw = 36 - (39 * Math.log(dMm / 0.127)) / Math.log(92)
  const awg = Math.round(raw)
  if (awg < 0 || awg > 40) return null
  return { awg, awgDiameter: 0.127 * Math.pow(92, (36 - awg) / 39) }
}
// ==== PURE-FNS-END ====

// SEO
useSeoMeta({
  title: '空芯电感计算 - Wheeler 公式线圈电感与匝数计算',
  description: '在线空芯电感计算器：Wheeler 单层螺线管公式计算电感量，支持 L/匝数/长度/直径四向互算、密绕模式按线径折算绕线长度、按电流密度给出裸线线径与 AWG 线规，纯本地计算。',
  keywords: '空芯电感计算, 线圈电感, wheeler公式, 空芯线圈匝数, 电感量计算, air core inductor, 密绕, 间绕, AWG线径',
  author: '有条工具',
  ogTitle: '空芯电感计算 - Wheeler 公式线圈电感与匝数计算 | 有条工具',
  ogDescription: 'Wheeler 公式空芯线圈电感计算：四向互算、密绕模式、线径与 AWG 建议。',
  ogUrl: 'https://www.util.cn/tools/air-core-inductor',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '空芯电感计算',
  twitterDescription: 'Wheeler 公式空芯线圈电感计算：四向互算、密绕模式、线径建议。'
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
          name: '空芯电感计算',
          url: 'https://www.util.cn/tools/air-core-inductor',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'Wheeler 单层空芯螺线管公式（公制系数）',
            '电感/匝数/长度/直径四向互算',
            '密绕模式 l = 匝数 × 线径 自动折算',
            '按电流密度 2~3A/mm² 的裸线线径建议',
            '最近 AWG 线规换算与截面校验',
            'l/D 形状系数精度提示',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Wheeler 公式适用于什么范围？',
              acceptedAnswer: { '@type': 'Answer', text: '单层空芯圆螺线管，绕线长度大于 0.4 倍线圈直径（l/D > 0.4）时误差约 1% 以内；多层、环形、磁芯线圈不适用。d 取绕组中径，l 用实际绕线长度。' }
            },
            {
              '@type': 'Question',
              name: '密绕和间绕算出来的电感一样吗？',
              acceptedAnswer: { '@type': 'Answer', text: '绕线长度 l 相同则电感基本相同，公式不区分绕法；区别在匝间电容与 Q：密绕分布电容大、自谐振频率低，间绕 Q 更高。' }
            },
            {
              '@type': 'Question',
              name: '多层线圈怎么算电感？',
              acceptedAnswer: { '@type': 'Answer', text: '单层公式不适用，可用 Wheeler 多层经验式或数值方法粗估；高频应用建议改单层间绕或利兹线，并以实测为准。' }
            },
            {
              '@type': 'Question',
              name: '线径怎么选？要考虑趋肤效应吗？',
              acceptedAnswer: { '@type': 'Answer', text: '按电流密度 2~3A/mm² 取 d = 1.13·√(I/J)，再取最近 AWG；数百 kHz 以上校核趋肤深度 δ ≈ 66/√f(mm)，大电流谐振回路可用利兹线。' }
            }
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '空芯电感计算', item: 'https://www.util.cn/tools/air-core-inductor' }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'air-core-inductor'
const SETTINGS_KEY = 'air-core-inductor-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 状态 ----------
const mode = ref('n')           // 'n' | 'L' | 'l' | 'd'
const closeWound = ref(false)   // 密绕模式
const coilD = ref(10)           // 线圈中径 mm
const coilL = ref(10)           // 绕线长度 mm
const turns = ref(10)           // 匝数
const targetL = ref(1)          // 目标电感 µH
const wireD = ref(0.5)          // 裸线线径 mm
const workCurrent = ref(1)      // 工作电流 A
const currentDensity = ref(2.5) // 电流密度 A/mm²

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化 ----------
const fmt = (v, d = 2) => (Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—')

// ---------- 主计算 ----------
const closeLenText = computed(() => {
  const n = turns.value
  const dw = wireD.value
  if (!Number.isFinite(n) || !(n > 0) || !Number.isFinite(dw) || !(dw > 0)) return '—'
  return fmt(n * dw, 2)
})

const mainResult = computed(() => {
  const d = coilD.value
  const n = turns.value
  const l = coilL.value
  const L = targetL.value
  const dw = wireD.value
  const cw = closeWound.value

  const shape = (lMm) => {
    const r = shapeRatio(lMm, d)
    if (r === null) return null
    return { ratio: r, ok: r > 0.4 }
  }

  if (mode.value === 'n') {
    if (!cw) {
      if (!isPos(d) || !isPos(l) || !isPos(L)) return null
      const nExact = solveTurns(d, l, L)
      if (nExact === null) return null
      const nRound = Math.max(1, Math.round(nExact))
      const lAtRound = wheelerLuH(d, l, nRound)
      if (lAtRound === null) return null
      return {
        kind: 'n-open', nExact, nRound, lAtRound,
        roundDevPct: ((lAtRound - L) / L) * 100,
        shape: shape(l)
      }
    }
    if (!isPos(d) || !isPos(dw) || !isPos(L)) return null
    const nExact = solveTurnsCloseWound(d, dw, L)
    if (nExact === null) return null
    const nRound = Math.max(1, Math.round(nExact))
    const lMm = nRound * dw
    const lAtRound = wheelerLuH(d, lMm, nRound)
    if (lAtRound === null) return null
    return { kind: 'n-cw', nExact, nRound, lMm, lAtRound, shape: shape(lMm) }
  }

  if (mode.value === 'L') {
    if (!isPos(d) || !isPos(n) || !isPos(dw)) return null
    const lMm = cw ? n * dw : l
    if (!isPos(lMm)) return null
    const luH = wheelerLuH(d, lMm, n)
    if (luH === null) return null
    return { kind: 'L', luH, nH: luH * 1000, dMm: d, lMm, shape: shape(lMm) }
  }

  if (mode.value === 'l') {
    if (!isPos(d) || !isPos(n) || !isPos(L)) return null
    const lMm = solveLength(d, n, L)
    if (lMm === null) return { kind: 'l-invalid' }
    return { kind: 'l', lMm, shape: shape(lMm) }
  }

  // 求直径
  if (!isPos(n) || !isPos(L)) return null
  let dMm = null
  let lMm = null
  if (cw) {
    if (!isPos(dw)) return null
    dMm = solveDiameterCloseWound(n, dw, L)
    lMm = dMm === null ? null : n * dw
  } else {
    if (!isPos(l)) return null
    dMm = solveDiameter(n, l, L)
    lMm = l
  }
  if (dMm === null) return null
  return { kind: 'd', dMm, lMm, shape: shape(lMm) }
})

// 取整偏差样式
const roundDevCls = (r) => {
  if (!Number.isFinite(r.roundDevPct)) return ''
  return Math.abs(r.roundDevPct) <= 5
    ? 'text-green-600 dark:text-green-400'
    : 'text-amber-600 dark:text-amber-400'
}

// l/D 形状提示
const shapeNote = (r) => {
  if (!r || !r.shape) return null
  const t = r.shape.ratio
  if (r.shape.ok) {
    return { text: `形状系数 l/D = ${fmt(t, 2)} > 0.4，Wheeler 公式误差约 1% 以内`, cls: 'text-green-600 dark:text-green-400' }
  }
  return {
    text: `形状系数 l/D = ${fmt(t, 2)} ≤ 0.4，线圈偏短，Wheeler 公式误差增大（可能超过数个百分点），建议间绕加长 l 或以实测为准`,
    cls: 'text-amber-600 dark:text-amber-400'
  }
}

// ---------- 线径建议 ----------
const wireSuggestion = computed(() => {
  const dMm = wireDiameterMm(workCurrent.value, currentDensity.value)
  if (dMm === null) return null
  const awg = nearestAwg(dMm)
  if (!awg) return { dMm, awg: null, awgDiameter: null, areaMm2: null, realJ: null }
  const areaMm2 = Math.PI * awg.awgDiameter * awg.awgDiameter / 4
  return { dMm, awg: awg.awg, awgDiameter: awg.awgDiameter, areaMm2, realJ: workCurrent.value / areaMm2 }
})

// ---------- 设置持久化（localStorage，键前缀用工具 id） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (['n', 'L', 'l', 'd'].includes(s.mode)) mode.value = s.mode
    if (typeof s.closeWound === 'boolean') closeWound.value = s.closeWound
    if (Number.isFinite(s.coilD) && s.coilD > 0) coilD.value = s.coilD
    if (Number.isFinite(s.coilL) && s.coilL > 0) coilL.value = s.coilL
    if (Number.isFinite(s.turns) && s.turns > 0) turns.value = s.turns
    if (Number.isFinite(s.targetL) && s.targetL > 0) targetL.value = s.targetL
    if (Number.isFinite(s.wireD) && s.wireD > 0) wireD.value = s.wireD
    if (Number.isFinite(s.workCurrent) && s.workCurrent > 0) workCurrent.value = s.workCurrent
    if (Number.isFinite(s.currentDensity) && s.currentDensity >= 2 && s.currentDensity <= 3) currentDensity.value = s.currentDensity
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([mode, closeWound, coilD, coilL, turns, targetL, wireD, workCurrent, currentDensity], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      mode: mode.value,
      closeWound: closeWound.value,
      coilD: coilD.value,
      coilL: coilL.value,
      turns: turns.value,
      targetL: targetL.value,
      wireD: wireD.value,
      workCurrent: workCurrent.value,
      currentDensity: currentDensity.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
