<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Zap class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电压降计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">电缆压降 / 线路损耗 / 最小截面积反算，电工安装、农网延线、店铺布线常用的选型核对工具</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线电压降计算器：输入系统制式（单相 220V / 三相 380V）、导线材质、截面积、单程线路长度与负载，按常用阻抗法估算线路末端压降、压降百分比与末端电压，
        并估算线损发热、年耗电量与电费；超限时自动反算能达标的最小截面积并吸附到标准档位。同时给出「简化式（纯阻）」与「精确式（含电抗 0.08 Ω/km）」两种口径对照。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 诚实口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        本工具按常用阻抗法估算（电抗默认取经验值可关闭），选型结论请对照 GB 标准载流量表与供电部门要求；三相不平衡、谐波场景不适用。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：输入参数 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 线路参数
        </h2>

        <div>
          <p class="text-sm font-medium text-foreground">系统制式</p>
          <div class="flex rounded-lg border border-border overflow-hidden mt-1.5" role="group" aria-label="系统制式">
            <button
              type="button"
              @click="pickSystem('single')"
              class="flex-1 px-3 py-1.5 text-xs font-medium transition"
              :class="system === 'single' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              单相 220V
            </button>
            <button
              type="button"
              @click="pickSystem('three')"
              class="flex-1 px-3 py-1.5 text-xs font-medium transition"
              :class="system === 'three' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              三相 380V
            </button>
          </div>
          <label :for="uid + '-v'" class="block text-sm font-medium text-foreground mt-3">额定电压 U（V）</label>
          <input
            :id="uid + '-v'"
            v-model.number="voltage"
            type="number"
            min="100"
            max="1000"
            step="1"
            class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
          <p class="text-xs text-muted-foreground mt-1">100–1000V 可自定义：切换制式默认填 220/380，也可改 110、660 等</p>
        </div>

        <div>
          <p class="text-sm font-medium text-foreground">导线材质（电阻率 ρ，20℃ 口径）</p>
          <div class="flex rounded-lg border border-border overflow-hidden mt-1.5" role="group" aria-label="导线材质">
            <button
              type="button"
              @click="material = 'copper'"
              class="flex-1 px-3 py-1.5 text-xs font-medium transition"
              :class="material === 'copper' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              铜 ρ=0.0175
            </button>
            <button
              type="button"
              @click="material = 'aluminum'"
              class="flex-1 px-3 py-1.5 text-xs font-medium transition"
              :class="material === 'aluminum' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              铝 ρ=0.0283
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-1 leading-relaxed">
            单位 Ω·mm²/m（20℃）。温度修正：铜电阻温度系数约 0.0039/℃，50℃ 时阻值约 +12%（0.0175 → 约 0.0196），长期满载发热线路请按高温阻值复核。
          </p>
        </div>

        <div>
          <label :for="uid + '-area'" class="block text-sm font-medium text-foreground">导线截面积 S（mm²）</label>
          <select
            :id="uid + '-area'"
            v-model="areaChoice"
            class="w-full mt-1.5 px-2.5 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="s in STD_AREAS" :key="s" :value="s">{{ s }} mm²（常用档）</option>
            <option value="custom">自定义…</option>
          </select>
          <div v-if="areaChoice === 'custom'">
            <input
              v-model.number="areaCustom"
              type="number"
              min="0.5"
              max="500"
              step="0.5"
              class="w-full mt-2 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
          </div>
        </div>

        <div>
          <label :for="uid + '-len'" class="block text-sm font-medium text-foreground">线路长度 L（m，单程）</label>
          <input
            :id="uid + '-len'"
            v-model.number="lengthM"
            type="number"
            min="1"
            max="5000"
            step="1"
            class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
          <p class="text-xs leading-relaxed mt-1.5 px-2.5 py-1.5 rounded bg-primary/10 text-foreground">
            <strong>显著提醒：这里填「单程」长度。</strong>单相线路去、回两根导线都承载电流，往返 ×2 已自动含在公式内（买线长度才要乘 2）；三相平衡时按相线计，不乘 2。
          </p>
        </div>

        <div>
          <p class="text-sm font-medium text-foreground">负载输入方式</p>
          <div class="flex rounded-lg border border-border overflow-hidden mt-1.5" role="group" aria-label="负载输入方式">
            <button
              type="button"
              @click="loadMode = 'power'"
              class="flex-1 px-3 py-1.5 text-xs font-medium transition"
              :class="loadMode === 'power' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              按功率 kW 反算
            </button>
            <button
              type="button"
              @click="loadMode = 'current'"
              class="flex-1 px-3 py-1.5 text-xs font-medium transition"
              :class="loadMode === 'current' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              直接填电流 A
            </button>
          </div>
          <div class="grid grid-cols-2 gap-3 mt-3">
            <div v-if="loadMode === 'power'">
              <label :for="uid + '-p'" class="block text-sm font-medium text-foreground">负载功率 P（kW）</label>
              <input
                :id="uid + '-p'"
                v-model.number="powerKw"
                type="number"
                min="0.01"
                max="500"
                step="0.1"
                class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
            </div>
            <div v-if="loadMode === 'current'">
              <label :for="uid + '-i'" class="block text-sm font-medium text-foreground">线路电流 I（A）</label>
              <input
                :id="uid + '-i'"
                v-model.number="currentA"
                type="number"
                min="0.1"
                max="1000"
                step="0.1"
                class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
            </div>
            <div>
              <label :for="uid + '-cos'" class="block text-sm font-medium text-foreground">功率因数 cosφ</label>
              <input
                :id="uid + '-cos'"
                v-model.number="cosPhi"
                type="number"
                min="0.3"
                max="1"
                step="0.01"
                class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <p class="text-xs text-muted-foreground mt-1">电机 0.8–0.85、LED/电器 0.9+、纯阻 1.0</p>
            </div>
          </div>
          <p v-if="loadMode === 'power'" class="text-xs text-muted-foreground mt-2">
            反算电流 {{ three ? 'I = P / (√3·U·cosφ)' : 'I = P / (U·cosφ)' }} ≈ <span class="font-mono font-semibold text-foreground">{{ n1(effCurrent) }} A</span>
          </p>
        </div>

        <div>
          <p class="text-sm font-medium text-foreground">负载性质（仅影响「建议绿线」）</p>
          <div class="flex rounded-lg border border-border overflow-hidden mt-1.5" role="group" aria-label="负载性质">
            <button
              type="button"
              @click="loadType = 'power'"
              class="flex-1 px-3 py-1.5 text-xs font-medium transition"
              :class="loadType === 'power' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              动力
            </button>
            <button
              type="button"
              @click="loadType = 'lighting'"
              class="flex-1 px-3 py-1.5 text-xs font-medium transition"
              :class="loadType === 'lighting' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              照明
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-1">照明对电压波动更敏感（建议绿线 2.5%，动力 3%）；两者合格上限同为 5%。</p>
        </div>

        <div>
          <p class="text-sm font-medium text-foreground">电抗模式</p>
          <div class="flex rounded-lg border border-border overflow-hidden mt-1.5" role="group" aria-label="电抗模式">
            <button
              type="button"
              @click="xMode = 'simple'"
              class="flex-1 px-3 py-1.5 text-xs font-medium transition"
              :class="xMode === 'simple' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              简化（X=0 纯阻）
            </button>
            <button
              type="button"
              @click="xMode = 'exact'"
              class="flex-1 px-3 py-1.5 text-xs font-medium transition"
              :class="xMode === 'exact' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              精确（X=0.08 Ω/km）
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-1">X=0.08 Ω/km 为低压电缆经验电抗值（单选注明，架空线会有出入），右侧对照行两种口径并排展示。</p>
        </div>

        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">场景预设（期望值已手算核对）</p>
          <div class="space-y-2">
            <button
              v-for="p in presets"
              :key="p.name"
              type="button"
              @click="applyPreset(p)"
              class="w-full text-left px-3 py-2 bg-muted/50 hover:bg-muted border border-border rounded-lg text-xs transition"
            >
              <Play class="w-3.5 h-3.5 inline mr-1.5 text-primary -mt-0.5" />
              <span class="font-medium text-foreground">{{ p.name }}</span>
              <span class="text-muted-foreground"> · {{ p.desc }} · 预期 {{ p.expect }}</span>
            </button>
          </div>
        </div>

        <button
          @click="resetInputs"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置默认参数
        </button>
      </div>

      <!-- 右：结果区（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 结论卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 电压降判定
          </h2>

          <div v-if="inputsValid" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="rounded-lg p-4 text-center border" :class="verdictMeta.box">
                <p class="text-xs text-muted-foreground mb-1">压降百分比（{{ xMode === 'exact' ? '精确式' : '简化式' }}）</p>
                <p class="text-5xl font-bold leading-tight" :class="verdictMeta.text">{{ n2(activeDrop.dropPct) }}<span class="text-xl">%</span></p>
                <p class="text-xs text-muted-foreground mt-1.5">压降 ΔU ≈ {{ n2(activeDrop.dropV) }} V</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">末端电压（U − ΔU）</p>
                <p class="text-2xl font-bold text-foreground mt-2">{{ n1(endVoltage) }} V</p>
                <p class="text-xs text-muted-foreground mt-1.5">额定 {{ n1(voltage) }} V · 偏差 −{{ n1(activeDrop.dropV) }} V</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">线路电流</p>
                <p class="text-2xl font-bold text-foreground mt-2">{{ n1(effCurrent) }} A</p>
                <p class="text-xs text-muted-foreground mt-1.5">{{ systemLabel }} · {{ materialLabel }} {{ n2(area) }} mm² · 单程 {{ n1(lengthM) }} m</p>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">ρ = {{ n2(rho) }} Ω·mm²/m</span>
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">cosφ = {{ n2(cosPhi) }}</span>
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">{{ three ? '三相：按相线计，不乘 2' : '单相：往返 ×2 已含公式内' }}</span>
            </div>

            <p class="text-xs leading-relaxed p-3 rounded-lg border flex items-start gap-1.5" :class="verdictMeta.box">
              <TriangleAlert v-if="verdict !== 'ok'" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" :class="verdictMeta.text" />
              <CheckCircle v-else class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <span class="text-foreground">{{ verdictHint }}</span>
            </p>
          </div>

          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">请检查参数：电压 100–1000V，长度 &gt;0，截面积 &gt;0，负载（功率或电流）&gt;0，cosφ 在 0.3–1 之间。</p>
            </div>
          </div>
        </div>

        <!-- 建议卡：反算最小合格截面积 -->
        <div
          v-if="inputsValid && verdict === 'fail'"
          class="bg-card border border-red-500/30 rounded-lg p-5"
        >
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <div class="flex-1">
              <p class="text-sm font-semibold text-foreground flex items-center">
                <TriangleAlert class="w-4 h-4 text-red-500 mr-1.5" />
                超限：最小合格截面积
                <span class="mx-1 font-mono text-red-500">{{ minArea5 === null ? '—' : minArea5 + ' mm²' }}</span>
              </p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">
                <template v-if="minArea5 !== null">按 5% 参考上限反算并吸附标准档：从 {{ n2(area) }} 换 {{ minArea5 }}（{{ systemLabel }} · 单程 {{ n1(lengthM) }} m · {{ n1(effCurrent) }} A）。</template>
                <template v-else>即使 240 mm² 也无法压回 5%，请缩短单程长度、提高供电电压等级或在负荷侧就近取电。</template>
              </p>
            </div>
            <button
              v-if="minArea5 !== null"
              type="button"
              @click="applySuggestedArea(minArea5)"
              class="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition whitespace-nowrap"
            >
              <ArrowLeftRight class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 一键应用 {{ minArea5 }} mm²
            </button>
          </div>
        </div>
        <div
          v-else-if="inputsValid && verdict === 'warn' && minAreaGreen !== null && minAreaGreen !== area"
          class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
        >
          <Info class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-foreground leading-relaxed">
            压降在 5% 限内但高于 {{ greenPct }}% 建议线（{{ loadType === 'lighting' ? '照明' : '动力' }}）。若想压回建议线，可换
            <span class="font-mono font-semibold">{{ minAreaGreen }} mm²</span>
            <button type="button" @click="applySuggestedArea(minAreaGreen)" class="ml-2 text-primary hover:underline">
              <ArrowLeftRight class="w-3.5 h-3.5 inline -mt-0.5" /> 应用
            </button>
          </p>
        </div>

        <!-- 对照行：简化式 vs 精确式 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Info class="w-5 h-5 mr-2 text-primary" /> 两种口径对照（电抗影响）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="rounded-lg p-4 border" :class="xMode === 'simple' ? 'border-primary/50 bg-primary/10' : 'border-border bg-muted/50'">
              <p class="text-xs text-muted-foreground mb-1">简化式（纯阻 X=0）</p>
              <p class="text-2xl font-bold text-foreground">{{ inputsValid ? n2(dropSimple.dropPct) + ' %' : '—' }}</p>
              <p class="text-xs text-muted-foreground mt-1">ΔU = {{ inputsValid ? n2(dropSimple.dropV) : '—' }} V</p>
            </div>
            <div class="rounded-lg p-4 border" :class="xMode === 'exact' ? 'border-primary/50 bg-primary/10' : 'border-border bg-muted/50'">
              <p class="text-xs text-muted-foreground mb-1">精确式（X=0.08 Ω/km）</p>
              <p class="text-2xl font-bold text-foreground">{{ inputsValid ? n2(dropExact.dropPct) + ' %' : '—' }}</p>
              <p class="text-xs text-muted-foreground mt-1">ΔU = {{ inputsValid ? n2(dropExact.dropV) : '—' }} V</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            {{ reactanceDiffText }}
          </p>
        </div>

        <!-- 线损卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Zap class="w-5 h-5 mr-2 text-primary" /> 线路损耗估算
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">回路总电阻</p>
              <p class="text-lg font-bold text-foreground font-mono">{{ inputsValid ? n2(lossTotalR) + ' Ω' : '—' }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">线损发热</p>
              <p class="text-lg font-bold text-foreground font-mono">{{ inputsValid ? n0(loss.w) + ' W' : '—' }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">年损耗电量</p>
              <p class="text-lg font-bold text-foreground font-mono">{{ inputsValid ? n0(loss.kwh) + ' kWh' : '—' }}</p>
            </div>
            <div class="bg-primary/10 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">年损耗电费</p>
              <p class="text-lg font-bold text-primary font-mono">{{ inputsValid ? n0(lossCost) + ' 元' : '—' }}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label :for="uid + '-h'" class="block text-sm font-medium text-foreground">年使用小时数（h）</label>
              <input
                :id="uid + '-h'"
                v-model.number="annualHours"
                type="number"
                min="0"
                max="8760"
                step="100"
                class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <p class="text-xs text-muted-foreground mt-1">默认 2000h（农用排灌/间歇负载），连续运行可到 8760</p>
            </div>
            <div>
              <label :for="uid + '-price'" class="block text-sm font-medium text-foreground">电价（元/kWh）</label>
              <input
                :id="uid + '-price'"
                v-model.number="priceKwh"
                type="number"
                min="0"
                max="3"
                step="0.01"
                class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <p class="text-xs text-muted-foreground mt-1">默认 0.6 元，按当地目录电价修改</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            线损口径：发热 = I² × 回路总电阻；单相总电阻 = 2 × 相线电阻，三相平衡 = 3 × 相线电阻（中性线电流约 0）。损耗只计线路发热，不含变压器与负载自身损耗。
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
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>电压降公式怎么来的？单相为何要 ×2？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          电流从电源出发必须「出去再回来」才成回路。单相两线制里，相线和中性线（或两根相线）都流过同一个电流，各自都产生压降，
          所以回路电阻 = 2 × 单程电阻，压降 ΔU = 2 · I · L · (ρ/S · cosφ + X · sinφ)——这就是「长度填单程、公式自动乘 2」的原因。
          三相平衡负载时三相电流矢量和为零，中性线几乎不过电流，压降按「线电压」折算为 ΔU = √3 · I · L · (R₀cosφ + X₀sinφ)，不再乘 2。
          式中 R₀ = ρ/S 是每米电阻（本工具用常用阻抗法近似，忽略末端电压与首端电压相角差）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">5% 这个数是谁规定的？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          「5%」是低压配电设计里被广泛采用的参考上限口径（GB 50052《供配电系统设计规范》与 GB 50054《低压配电设计规范》的电压偏差与线路压降要求在工程设计中通常按不超过 5% 掌握），
          它不是一条孤立的硬性数字：对电压质量另有运行偏差限值，具体到项目应以设计文件、当地供电部门要求为准。本工具把 ≤3%（照明 2.5%）标绿、3–5% 标黄、&gt;5% 标红，仅作快速核对参考。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么线能带多少负载，和电压降什么关系？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          选导线要过两道独立的关卡：一是<strong>载流量</strong>（发热关，决定线会不会烧——看 GB 载流量表，与敷设方式、环境温度强相关）；
          二是<strong>电压降</strong>（压降关，决定末端设备电压够不够）。短距离时载流量说了算，「什么线能带多大功率」查表即可；
          但线路一长，压降往往先于发热成为控制因素——比如 6mm² 铜线带 7kW 明明不发热，拉线 100 米后末端电压却可能不够。这就是为什么延线要先算压降。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">铝线换铜线（或反之）有什么经验？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          同为压降等效时，电阻率之比就是截面积之比：0.0283 / 0.0175 ≈ 1.62，即<strong>铝线截面积要取铜线的约 1.6 倍</strong>——经验说法「铝线比铜线大一到两档」由此而来：
          2.5mm² 铜线约等效 4mm² 铝线，6mm² 铜线约等效 10mm² 铝线。另注意铝线机械强度差、接头易氧化，明敷大档距与端子处要按规范处理。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么要算线损？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          线损 = I²R，是白白变成热的电费：一条 200A 级主干线每 0.01Ω 回路电阻就常年发热 400W；农网长支线按年 2000 小时折算，
          多一档线径增的钱可能两三年就从电费里省回来。线损还影响末端电压与设备寿命，接头处局部电阻过大更是电气火灾的常见诱因——
          算线损既是算钱，也是安全核对。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">线路长度填单程还是往返？</h3>
            <p class="text-sm text-muted-foreground mt-1">填单程。单相线路的去、回两根导线都承载电流，本工具已在公式里自动 ×2；三相平衡线路按相线计不乘 2。买线时的下料长度才需要自己乘 2（单相）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">压降 5% 上限是谁规定的？</h3>
            <p class="text-sm text-muted-foreground mt-1">「5%」是低压配电设计的常用参考口径（GB 50052、GB 50054 相关要求的工程惯用掌握值），并非孤立硬规则；具体以设计文件与供电部门要求为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">选电线只看电压降就够了吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不够。电压降管「末端电压够不够」，载流量管「线会不会过热」，两道关卡要都过：短线路按载流量选，长线路压降往往先超标，本工具建议卡给出的最小截面积仅解决压降一侧。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">什么时候要考虑电抗 X？</h3>
            <p class="text-sm text-muted-foreground mt-1">低压电缆电抗约 0.08 Ω/km，小截面、高 cosφ 的线路里通常只差零点零几到零点几个百分点，可用简化式；大截面长线路、电机类低功率因数负载建议开精确式。三相不平衡与谐波场景本工具不适用。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'voltage-drop-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Zap, Calculator, CheckCircle, TriangleAlert, Info,
  RefreshCw, Play, ArrowLeftRight, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '电压降计算器 - 电缆压降/线路损耗/电线截面积选择工具',
  description: '免费在线电压降计算器，单相220V/三相380V线路压降与末端电压估算，铜铝电缆截面积选择、最小合格截面反算，简化式与含电抗精确式对照，线损发热与年电费估算，农网延线、店铺布线必备，纯浏览器本地运行不上传',
  keywords: '电压降计算,电压降计算器,电缆压降,线路损耗计算,电线截面积选择',
  author: '有条工具',
  ogTitle: '电压降计算器 - 电缆压降/线路损耗/电线截面积选择工具 | 有条工具',
  ogDescription: '输入线路参数即估算压降、末端电压与线损电费，超限自动反算最小合格截面积，纯阻与含电抗双口径对照。',
  ogUrl: 'https://www.util.cn/tools/voltage-drop-calculator',
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
          name: '电压降计算器',
          url: 'https://www.util.cn/tools/voltage-drop-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['单相/三相线路压降与末端电压估算', '铜/铝导线与标准截面选档', '简化式（纯阻）与精确式（X=0.08Ω/km）双口径对照', '最小合格截面积反算并一键应用', '线损发热、年耗电量与电费估算', '招牌/水泵/充电桩场景预设', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '电压降计算器', item: 'https://www.util.cn/tools/voltage-drop-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '线路长度填单程还是往返？',
              acceptedAnswer: { '@type': 'Answer', text: '填单程。单相线路的去、回两根导线都承载电流，本工具已在公式里自动 ×2；三相平衡线路按相线计不乘 2。买线时的下料长度才需要自己乘 2（单相）。' }
            },
            {
              '@type': 'Question',
              name: '压降 5% 上限是谁规定的？',
              acceptedAnswer: { '@type': 'Answer', text: '「5%」是低压配电设计的常用参考口径（GB 50052、GB 50054 相关要求的工程惯用掌握值），并非孤立硬规则；具体以设计文件与供电部门要求为准。' }
            },
            {
              '@type': 'Question',
              name: '选电线只看电压降就够了吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不够。电压降管末端电压够不够，载流量管线会不会过热，两道关卡都要过：短线路按载流量选，长线路压降往往先超标。' }
            },
            {
              '@type': 'Question',
              name: '什么时候要考虑电抗 X？',
              acceptedAnswer: { '@type': 'Answer', text: '低压电缆电抗约 0.08Ω/km，小截面高功率因数线路影响常不足 0.1 个百分点，可用简化式；大截面长线路或低 cosφ 电机负载建议用精确式。三相不平衡与谐波场景不适用本工具。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 电阻率口径：20℃。铜 0.0175 / 铝 0.0283 Ω·mm²/m。
// 温度修正说明：铜电阻温度系数约 0.0039/℃，50℃ 时阻值约 +12%（0.0175 → 约 0.0196）；
// 本工具按 20℃ 口径计算，长期满载发热线路请以高温阻值复核或预留压降余量。
const RHO = { copper: 0.0175, aluminum: 0.0283 }
const SQRT3 = Math.sqrt(3)
const X_EXACT = 0.08 // Ω/km，低压电缆电抗经验值（精确式选项）
const STD_AREAS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240] // 常用标准档

// 由功率反算电流：单相 I = P / (U·cosφ)，三相 I = P / (√3·U·cosφ)，P 单位 kW → A
function currentOf(powerKw, voltage, three, cosPhi) {
  if (!(voltage > 0) || !(cosPhi > 0) || cosPhi > 1) return 0
  const p = powerKw * 1000
  return three ? p / (SQRT3 * voltage * cosPhi) : p / (voltage * cosPhi)
}

// 导线电阻：R = ρ·lenM / S。口径注明：
// - 单相：去/回两根导线均流过负载电流，调用方应传「2 × 单程长度」（回程已含）；
// - 三相：平衡负载中性线电流≈0，按单程相线长度传入，不乘 2。
function resistanceOf(rho, lenM, areaMm2) {
  if (!(areaMm2 > 0) || !(lenM >= 0)) return 0
  return (rho * lenM) / areaMm2
}

// 常用阻抗法（近似压降公式，忽略相角差）：
//   ΔU = C · I · L · (ρ/S·cosφ + x·sinφ)，x = X_km/1000（Ω/m）
//   单相 C = 2（往返回程已含），三相 C = √3（线电压折算，按相线长计）
// voltage 为额定线电压（可选第 8 参）：传入才计算 dropPct，否则为 null。
function voltageDropOf(current, lenM, rho, areaMm2, cosPhi, xOhmPerKm, three, voltage) {
  if (!(current > 0) || !(lenM > 0) || !(areaMm2 > 0) || !(cosPhi > 0) || cosPhi > 1) {
    return { dropV: 0, dropPct: null }
  }
  const sinPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi))
  const rPerM = rho / areaMm2
  const xPerM = (xOhmPerKm || 0) / 1000
  const factor = three ? SQRT3 : 2
  const dropV = factor * current * lenM * (rPerM * cosPhi + xPerM * sinPhi)
  const dropPct = voltage > 0 ? (dropV / voltage) * 100 : null
  return { dropV, dropPct }
}

// 压降判定：合格上限对照明/动力通用 —— ≤5% 黄线以内、>5% 红线（一般按 GB 供配电设计 5% 参考口径，具体以设计为准）。
// 绿线为建议舒适值：照明 2.5%（视觉敏感）、动力 3%。返回 'ok' | 'warn' | 'fail'。
function judgeDropOf(pct, loadType = 'power') {
  if (!(pct >= 0)) return 'warn'
  if (pct > 5) return 'fail'
  if (pct > (loadType === 'lighting' ? 2.5 : 3)) return 'warn'
  return 'ok'
}

// 反算满足 targetPct 的最小截面积，并吸附到 STD_AREAS 标准档；240 仍不达标返回 null
function minAreaOf(targetPct, current, lenM, rho, cosPhi, xOhmPerKm, three, voltage) {
  if (!(targetPct > 0)) return null
  for (const s of STD_AREAS) {
    const { dropPct } = voltageDropOf(current, lenM, rho, s, cosPhi, xOhmPerKm, three, voltage)
    if (dropPct !== null && dropPct > 0 && dropPct <= targetPct) return s
  }
  return null
}

// 线损：w = I²·R_total（R_total 为全部载流导线电阻：单相 2×R、三相 3×R，由调用方按口径传入）；
// 年耗电 kWh = w × hours / 1000，hours 默认 2000（可选）
function lossOf(current, rTotal, hours = 2000) {
  const w = current * current * Math.max(0, rTotal)
  return { w, kwh: (w * Math.max(0, hours)) / 1000 }
}

// ---------- 状态与交互 ----------
const DEFAULTS = {
  system: 'single', voltage: 220, material: 'copper',
  areaChoice: 6, areaCustom: 6, lengthM: 50,
  loadMode: 'power', powerKw: 7, currentA: 32, cosPhi: 0.85,
  loadType: 'power', xMode: 'exact', annualHours: 2000, priceKwh: 0.6
}

const uid = 'vd'
const system = ref(DEFAULTS.system)          // 'single' | 'three'
const voltage = ref(DEFAULTS.voltage)        // 可自定义 100–1000V
const material = ref(DEFAULTS.material)      // 'copper' | 'aluminum'
const areaChoice = ref(DEFAULTS.areaChoice)  // 数值档 或 'custom'
const areaCustom = ref(DEFAULTS.areaCustom)
const lengthM = ref(DEFAULTS.lengthM)        // 单程长度 m
const loadMode = ref(DEFAULTS.loadMode)      // 'power' | 'current'
const powerKw = ref(DEFAULTS.powerKw)
const currentA = ref(DEFAULTS.currentA)
const cosPhi = ref(DEFAULTS.cosPhi)
const loadType = ref(DEFAULTS.loadType)      // 'power' | 'lighting'
const xMode = ref(DEFAULTS.xMode)            // 'simple' | 'exact'
const annualHours = ref(DEFAULTS.annualHours)
const priceKwh = ref(DEFAULTS.priceKwh)
const seoContentVisible = ref(true)

const three = computed(() => system.value === 'three')
const rho = computed(() => RHO[material.value])
const area = computed(() => areaChoice.value === 'custom' ? Number(areaCustom.value) : Number(areaChoice.value))
const systemLabel = computed(() => three.value ? '三相' : '单相')
const materialLabel = computed(() => material.value === 'copper' ? '铜' : '铝')

const effCurrent = computed(() =>
  loadMode.value === 'power'
    ? currentOf(Number(powerKw.value), Number(voltage.value), three.value, Number(cosPhi.value))
    : Number(currentA.value)
)

const inputsValid = computed(() => {
  const v = Number(voltage.value), l = Number(lengthM.value), c = Number(cosPhi.value)
  return v >= 100 && v <= 1000 && l > 0 && area.value > 0 && c > 0 && c <= 1 && Number.isFinite(effCurrent.value) && effCurrent.value > 0
})

// 简化式（X=0）与精确式（X=0.08Ω/km）两种口径并存，右侧对照行展示电抗影响
const dropSimple = computed(() =>
  voltageDropOf(effCurrent.value, Number(lengthM.value), rho.value, area.value, Number(cosPhi.value), 0, three.value, Number(voltage.value))
)
const dropExact = computed(() =>
  voltageDropOf(effCurrent.value, Number(lengthM.value), rho.value, area.value, Number(cosPhi.value), X_EXACT, three.value, Number(voltage.value))
)
const activeDrop = computed(() => (xMode.value === 'exact' ? dropExact.value : dropSimple.value))

const greenPct = computed(() => (loadType.value === 'lighting' ? 2.5 : 3))
const verdict = computed(() => judgeDropOf(activeDrop.value.dropPct ?? -1, loadType.value))

const verdictMeta = computed(() => ({
  ok: { text: 'text-green-600', box: 'bg-green-500/10 border-green-500/20' },
  warn: { text: 'text-amber-500', box: 'bg-amber-500/10 border-amber-500/20' },
  fail: { text: 'text-red-500', box: 'bg-red-500/10 border-red-500/20' }
}[verdict.value]))

const verdictHint = computed(() => {
  const pct = n2(activeDrop.value.dropPct)
  if (verdict.value === 'fail') return `压降 ${pct}% 超过 5% 参考上限（GB 供配电设计常用口径），末端电压偏低，建议增大截面或缩短线路。`
  if (verdict.value === 'warn') return `压降 ${pct}% 在 5% 限内合格，但高于 ${greenPct.value}% 的${loadType.value === 'lighting' ? '照明' : '动力'}建议线，长期满载或电机类负载可考虑加大一档。`
  return `压降 ${pct}% 低于 ${greenPct.value}% 建议线且在 5% 参考上限内，合格。`
})

const endVoltage = computed(() => Number(voltage.value) - activeDrop.value.dropV)

const curX = computed(() => (xMode.value === 'exact' ? X_EXACT : 0))
const minArea5 = computed(() =>
  minAreaOf(5, effCurrent.value, Number(lengthM.value), rho.value, Number(cosPhi.value), curX.value, three.value, Number(voltage.value))
)
const minAreaGreen = computed(() =>
  minAreaOf(greenPct.value, effCurrent.value, Number(lengthM.value), rho.value, Number(cosPhi.value), curX.value, three.value, Number(voltage.value))
)

// 线损：单相回路 2×R、三相 3×R（口径见 resistanceOf 注释）
const lossTotalR = computed(() =>
  three.value ? 3 * resistanceOf(rho.value, Number(lengthM.value), area.value) : 2 * resistanceOf(rho.value, Number(lengthM.value), area.value)
)
const loss = computed(() => lossOf(effCurrent.value, lossTotalR.value, Number(annualHours.value) || 0))
const lossCost = computed(() => loss.value.kwh * (Number(priceKwh.value) || 0))

const reactanceDiffText = computed(() => {
  if (!inputsValid.value) return '参数有效后，此处并排给出纯阻简化式与含电抗精确式的压降百分比。'
  const d = dropExact.value.dropPct - dropSimple.value.dropPct
  if (Math.abs(d) < 0.01) return `本工况下电抗项贡献约 ${n2(Math.abs(d))} 个百分点：cosφ 越高、线径越小，X=0.08 Ω/km 的影响越可以忽略。`
  return `电抗项使精确式比简化式高约 ${n2(d)} 个百分点：低 cosφ 或大截面长线时占比明显，cosφ=1 时电抗项为零、两式相同。`
})

// ---------- 场景预设（期望值为 20℃ 铜 ρ=0.0175、精确式口径下的手算值） ----------
const presets = [
  {
    name: '① 店铺招牌',
    desc: '单相220V · 10m · 铜2.5mm² · 8kW · cosφ0.85',
    expect: 'ΔU≈5.13V / 2.33%',
    values: { system: 'single', voltage: 220, material: 'copper', areaChoice: 2.5, lengthM: 10, loadMode: 'power', powerKw: 8, cosPhi: 0.85, loadType: 'lighting', xMode: 'exact' }
  },
  {
    name: '② 农网水泵',
    desc: '三相380V · 200m · 铜10mm² · 5.5kW · cosφ0.85',
    expect: 'ΔU≈5.21V / 1.37%',
    values: { system: 'three', voltage: 380, material: 'copper', areaChoice: 10, lengthM: 200, loadMode: 'power', powerKw: 5.5, cosPhi: 0.85, loadType: 'power', xMode: 'exact' }
  },
  {
    name: '③ 家用充电桩',
    desc: '单相220V · 50m · 铜6mm² · 7kW · cosφ1.0',
    expect: 'ΔU≈9.28V / 4.22%',
    values: { system: 'single', voltage: 220, material: 'copper', areaChoice: 6, lengthM: 50, loadMode: 'power', powerKw: 7, cosPhi: 1, loadType: 'power', xMode: 'exact' }
  }
]

function applyPreset(p) {
  const v = p.values
  system.value = v.system
  voltage.value = v.voltage
  material.value = v.material
  areaChoice.value = v.areaChoice
  lengthM.value = v.lengthM
  loadMode.value = v.loadMode
  if (v.powerKw !== undefined) powerKw.value = v.powerKw
  if (v.currentA !== undefined) currentA.value = v.currentA
  cosPhi.value = v.cosPhi
  loadType.value = v.loadType
  xMode.value = v.xMode
}

function pickSystem(s) {
  system.value = s
  voltage.value = s === 'three' ? 380 : 220
}

function applySuggestedArea(s) {
  if (!s) return
  if (STD_AREAS.includes(s)) {
    areaChoice.value = s
  } else {
    areaChoice.value = 'custom'
    areaCustom.value = s
  }
}

function resetInputs() {
  system.value = DEFAULTS.system
  voltage.value = DEFAULTS.voltage
  material.value = DEFAULTS.material
  areaChoice.value = DEFAULTS.areaChoice
  areaCustom.value = DEFAULTS.areaCustom
  lengthM.value = DEFAULTS.lengthM
  loadMode.value = DEFAULTS.loadMode
  powerKw.value = DEFAULTS.powerKw
  currentA.value = DEFAULTS.currentA
  cosPhi.value = DEFAULTS.cosPhi
  loadType.value = DEFAULTS.loadType
  xMode.value = DEFAULTS.xMode
  annualHours.value = DEFAULTS.annualHours
  priceKwh.value = DEFAULTS.priceKwh
}

// ---------- 展示格式化 ----------
const n2 = (v) => (Number.isFinite(v) ? v.toFixed(2) : '—')
const n1 = (v) => (Number.isFinite(v) ? v.toFixed(1) : '—')
const n0 = (v) => (Number.isFinite(v) ? Math.round(v).toString() : '—')

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('voltage-drop-calculator')
})
</script>
