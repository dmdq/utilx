<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Triangle class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">运放增益计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">反相 / 同相 / 跟随器 / 差分 / 仪表放大五种拓扑，倍数与 dB 双显示、输出摆幅与 GBW 校验、E 系列电阻吸附联动</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线运放增益计算器：按拓扑直接算增益——反相 A = −Rf/Ri、同相 A = 1 + Rf/Rg、跟随器固定 1 倍、差分 Vout = (Rf/Ri)×(V2−V1)、
        三运放仪表放大器 G = 1 + 49.4kΩ/RG；增益倍数与 20·log₁₀|A| dB 双显示，反相拓扑标注相位反转 180°；
        可选输入 Vin 与供电轨做输出摆幅校验与饱和警告，GBW 栏校验最大可用增益与余量倍数，
        并把增益比吸附到 E24/E96 标准阻值回验实际增益与偏差。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        口径说明：增益公式均为理想运放（虚短虚断、开环增益无穷）下的教科书公式；仪表放大器增益常数取 49.4kΩ（AD620 口径，
        INA128 为 50kΩ、INA333 为 100kΩ，<span class="text-foreground font-medium">以所选型号手册为准</span>）。
        输出摆幅按对称双电源 ±Vs、单边裕量 headroom 估算，Rail-to-Rail 型可将裕量设为接近 0；
        GBW 校验为单极点近似（闭环带宽 ≈ GBW / 增益）。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 模块①：增益计算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 增益计算
          </h2>

          <!-- 拓扑切换 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">放大拓扑</label>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
              <button
                v-for="t in TOPOS"
                :key="t.k"
                @click="topo = t.k"
                :class="topo === t.k ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >{{ t.label }}</button>
            </div>
          </div>

          <!-- 公式行 -->
          <p class="text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg p-2.5 font-mono">
            {{ formulaText }}
          </p>

          <!-- 电阻单位 -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">电阻单位</span>
            <div class="flex gap-1.5">
              <button
                v-for="u in R_UNITS"
                :key="u.k"
                @click="rUnit = u.k"
                :class="rUnit === u.k ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              >{{ u.k }}</button>
            </div>
          </div>

          <!-- 按拓扑输入 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- 反相 -->
            <template v-if="topo === 'inverting'">
              <div>
                <label for="opamp-ri" class="block text-sm font-medium text-foreground mb-1.5">输入电阻 Ri</label>
                <input id="opamp-ri" v-model.number="ri" type="number" min="0" step="1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              </div>
              <div>
                <label for="opamp-rf-inv" class="block text-sm font-medium text-foreground mb-1.5">反馈电阻 Rf</label>
                <input id="opamp-rf-inv" v-model.number="rf" type="number" min="0" step="1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              </div>
              <div>
                <label for="opamp-vin-inv" class="block text-sm font-medium text-foreground mb-1.5">输入电压 Vin（V，可选）</label>
                <input id="opamp-vin-inv" v-model.number="vin" type="number" step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              </div>
            </template>

            <!-- 同相 -->
            <template v-else-if="topo === 'noninverting'">
              <div>
                <label for="opamp-rg" class="block text-sm font-medium text-foreground mb-1.5">下臂电阻 Rg</label>
                <input id="opamp-rg" v-model.number="rg" type="number" min="0" step="1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              </div>
              <div>
                <label for="opamp-rf-ni" class="block text-sm font-medium text-foreground mb-1.5">反馈电阻 Rf</label>
                <input id="opamp-rf-ni" v-model.number="rf" type="number" min="0" step="1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              </div>
              <div>
                <label for="opamp-vin-ni" class="block text-sm font-medium text-foreground mb-1.5">输入电压 Vin（V，可选）</label>
                <input id="opamp-vin-ni" v-model.number="vin" type="number" step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              </div>
            </template>

            <!-- 跟随器 -->
            <template v-else-if="topo === 'follower'">
              <div class="sm:col-span-2 p-3 rounded-lg bg-muted/50 border border-border text-xs leading-relaxed text-muted-foreground">
                跟随器（电压缓冲）是同相放大的特例：Rf = 0、输出 100% 直接反馈到反相端，增益固定 1 倍（0 dB），
                只需输入 Vin 查看输出摆幅。用途是阻抗变换——同相端输入阻抗极高，几乎不取信号源电流。
              </div>
              <div>
                <label for="opamp-vin-fol" class="block text-sm font-medium text-foreground mb-1.5">输入电压 Vin（V，可选）</label>
                <input id="opamp-vin-fol" v-model.number="vin" type="number" step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              </div>
            </template>

            <!-- 差分 -->
            <template v-else-if="topo === 'differential'">
              <div>
                <label for="opamp-ri-df" class="block text-sm font-medium text-foreground mb-1.5">输入电阻 Ri（R1 = R2）</label>
                <input id="opamp-ri-df" v-model.number="ri" type="number" min="0" step="1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              </div>
              <div>
                <label for="opamp-rf-df" class="block text-sm font-medium text-foreground mb-1.5">反馈电阻 Rf（R3 = R4）</label>
                <input id="opamp-rf-df" v-model.number="rf" type="number" min="0" step="1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              </div>
              <div>
                <label for="opamp-v1" class="block text-sm font-medium text-foreground mb-1.5">V1（V，反相侧输入）</label>
                <input id="opamp-v1" v-model.number="v1" type="number" step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              </div>
              <div>
                <label for="opamp-v2" class="block text-sm font-medium text-foreground mb-1.5">V2（V，同相侧输入）</label>
                <input id="opamp-v2" v-model.number="v2" type="number" step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              </div>
              <div class="sm:col-span-2 text-xs leading-relaxed text-muted-foreground bg-muted/50 border border-border rounded-lg p-3">
                匹配前提：四臂电阻须满足 <span class="font-mono text-foreground">R4/R2 = Rf/Ri</span>（即 R1=Ri、R2=Ri、R3=Rf、R4=Rf 成比例）。
                失配会直接劣化共模抑制——1% 失配时 CMRR 上限约 (1+G)/4÷1%，共模干扰会窜进输出。
              </div>
            </template>

            <!-- 仪表放大器 -->
            <template v-else>
              <div>
                <label for="opamp-rgina" class="block text-sm font-medium text-foreground mb-1.5">增益电阻 RG</label>
                <input id="opamp-rgina" v-model.number="rgIna" type="number" min="0" step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <p class="text-xs text-muted-foreground mt-1">G = 1 + 49.4kΩ/RG，RG 越小增益越高；以所选型号手册常数为准</p>
              </div>
              <div>
                <label for="opamp-v1-ina" class="block text-sm font-medium text-foreground mb-1.5">V1（V，差分负端）</label>
                <input id="opamp-v1-ina" v-model.number="v1" type="number" step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              </div>
              <div>
                <label for="opamp-v2-ina" class="block text-sm font-medium text-foreground mb-1.5">V2（V，差分正端）</label>
                <input id="opamp-v2-ina" v-model.number="v2" type="number" step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              </div>
            </template>
          </div>

          <!-- 输出摆幅校验（供电轨） -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label for="opamp-vs" class="block text-sm font-medium text-foreground mb-1.5">供电轨 ±Vs（V）</label>
              <input id="opamp-vs" v-model.number="vsRail" type="number" min="0" step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            </div>
            <div>
              <label for="opamp-hr" class="block text-sm font-medium text-foreground mb-1.5">输出裕量 headroom（V）</label>
              <input id="opamp-hr" v-model.number="headroom" type="number" min="0" step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <p class="text-xs text-muted-foreground mt-1">默认 1V；Rail-to-Rail 型可接近 0</p>
            </div>
          </div>

          <!-- 结果 -->
          <div v-if="gainResult" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">电压增益 A{{ topo === 'inverting' ? '（含符号）' : '（倍）' }}</p>
                <p class="text-2xl font-bold text-primary">
                  {{ gainResult.gainText }} <span class="text-sm font-medium">倍</span>
                </p>
                <p v-if="topo === 'inverting'" class="text-xs mt-1 text-muted-foreground">
                  相位反转 180°（输出与输入反相）
                </p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">增益 dB（20·log₁₀|A|）</p>
                <p class="text-2xl font-bold text-foreground">{{ gainResult.dbText }}</p>
              </div>
            </div>

            <div v-if="gainResult.vout !== null" class="pt-3 border-t border-primary/20 space-y-2 text-sm">
              <p class="text-muted-foreground">
                输出 Vout = <span class="font-semibold text-foreground">{{ gainResult.voutText }}</span>
                <span class="text-xs font-mono">（{{ gainResult.voutExpr }}）</span>
              </p>
              <p v-if="gainResult.saturated === false" class="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-medium">
                <CheckCircle class="w-4 h-4" />
                摆幅校验通过：|Vout| ≤ Vs − headroom = {{ gainResult.limitText }}
              </p>
              <div v-else-if="gainResult.saturated === true" class="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-xs font-medium text-foreground">饱和警告：|Vout| = {{ gainResult.voutAbsText }} 超出可用摆幅 {{ gainResult.limitText }}</p>
                  <p class="text-[11px] text-muted-foreground mt-0.5">输出将被削顶失真，实际幅度卡在轨附近；请减小输入幅度、降低增益或提高供电轨。</p>
                </div>
              </div>
            </div>

            <p v-if="gainResult.cmrrText" class="text-xs leading-relaxed text-muted-foreground pt-3 border-t border-primary/20">
              {{ gainResult.cmrrText }}
            </p>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">
                请检查参数：电阻须大于 0（0.1 Ω ~ 100 MΩ）；同相 / 仪表拓扑目标增益应大于 1；Vs &gt; 0，headroom ≥ 0。
              </p>
            </div>
          </div>
        </div>

        <!-- 模块②：GBW 校验 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Activity class="w-5 h-5 mr-2 text-primary" /> GBW 校验（增益带宽积）
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label for="opamp-gbw" class="block text-sm font-medium text-foreground mb-1.5">运放 GBW（MHz）</label>
              <input id="opamp-gbw" v-model.number="gbwMhz" type="number" min="0" step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            </div>
            <div>
              <label for="opamp-bw" class="block text-sm font-medium text-foreground mb-1.5">信号带宽</label>
              <input id="opamp-bw" v-model.number="bwVal" type="number" min="0" step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">带宽单位</label>
              <select v-model="bwUnit" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="Hz">Hz</option>
                <option value="kHz">kHz</option>
                <option value="MHz">MHz</option>
              </select>
            </div>
          </div>

          <div v-if="gbwResult" class="p-4 rounded-lg border border-border bg-muted/50 space-y-2.5">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div>
                <p class="text-xs text-muted-foreground mb-1">最大可用增益（GBW/带宽）</p>
                <p class="text-xl font-bold text-foreground">{{ gbwResult.maxText }} 倍</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">目标增益 {{ gbwResult.targetText }} 倍时的余量</p>
                <p class="text-xl font-bold" :class="gbwResult.marginCls">{{ gbwResult.marginText }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">目标增益下的闭环带宽</p>
                <p class="text-xl font-bold text-foreground">{{ gbwResult.clBwText }}</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              单极点口径：闭环带宽 ≈ GBW / 增益。余量 = 最大可用增益 / 目标增益，
              <span class="text-foreground font-medium">建议 ≥10×</span>——余量不足时高频段增益跌落、相位裕度变小、失真上升；
              余量 &lt;1× 表示带宽内增益撑不住，需要换高 GBW 型号或降增益分级放大。
            </p>
            <p class="text-xs font-medium" :class="gbwResult.verdictCls">{{ gbwResult.verdict }}</p>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">请检查参数：GBW 与信号带宽均须大于 0，且上方增益模块的电阻参数有效。</p>
          </div>
        </div>

        <!-- 模块③：E 系列吸附联动 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Table class="w-5 h-5 mr-2 text-primary" /> E 系列吸附联动（增益比 → 推荐电阻对）
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            按当前拓扑把增益换算成反馈电阻精确值，再吸附 E24 / E96 标准档并回验实际增益。
            吸附口径（对数距离取最近档）与
            <NuxtLink to="/tools/eseries-resistor-finder" class="text-primary hover:underline">E系列标准阻值查找</NuxtLink>
            完全一致。
          </p>

          <div v-if="topo === 'follower'" class="p-3 rounded-lg bg-muted/50 border border-border text-xs leading-relaxed text-muted-foreground">
            跟随器增益固定 1 倍，无反馈分压网络，不需要选型电阻。
          </div>

          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="opamp-snapg" class="block text-sm font-medium text-foreground mb-1.5">
                  目标增益{{ topo === 'noninverting' || topo === 'ina' ? '（须大于 1）' : '' }}
                </label>
                <input id="opamp-snapg" v-model.number="snapTarget" type="number" min="0" step="1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <p v-if="topo === 'inverting'" class="text-xs text-muted-foreground mt-1">输入增益幅值（如 10 代表 −10 倍反相）</p>
              </div>
              <div v-if="topo !== 'ina'">
                <label for="opamp-snapb" class="block text-sm font-medium text-foreground mb-1.5">
                  {{ topo === 'noninverting' ? '下臂电阻 Rg' : '输入电阻 Ri' }}（{{ rUnit }}）
                </label>
                <input id="opamp-snapb" v-model.number="snapBase" type="number" min="0" step="1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              </div>
              <div v-else class="text-xs leading-relaxed text-muted-foreground bg-muted/50 border border-border rounded-lg p-3 self-end">
                仪表放大器由增益反算：RG 精确值 = 49.4kΩ / (G − 1)，再吸附标准档回验。
              </div>
            </div>

            <div v-if="snapRows.length" class="border border-border rounded-lg overflow-hidden">
              <div class="grid grid-cols-4 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                <span>系列</span>
                <span>精确值 → 吸附档</span>
                <span class="text-right">实际增益回验</span>
                <span class="text-right">与目标偏差</span>
              </div>
              <div
                v-for="row in snapRows"
                :key="row.series"
                class="grid grid-cols-4 px-3 py-2.5 text-sm border-t border-border/50 items-center"
              >
                <span class="font-mono font-medium text-foreground">{{ row.series }}</span>
                <span class="font-mono text-xs text-foreground">
                  {{ row.exactText }} → <span class="text-primary font-semibold">{{ row.snapText }}</span>
                </span>
                <span class="text-right font-mono text-foreground">{{ row.actualText }}</span>
                <span class="text-right font-mono" :class="row.devCls">{{ row.devText }}</span>
              </div>
            </div>

            <p v-if="snapNote" class="text-xs text-muted-foreground leading-relaxed">{{ snapNote }}</p>
          </template>
        </div>

        <!-- 模块④：SVG 示意图 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> 拓扑示意图（随参数重绘）
          </h2>
          <p class="text-xs text-muted-foreground">电阻标注为当前输入的实时数值；三角形为运放符号，− / + 为反相 / 同相输入端。</p>

          <div class="text-muted-foreground">
            <!-- 反相放大 -->
            <svg v-if="topo === 'inverting'" viewBox="0 0 480 230" class="w-full max-w-lg mx-auto" role="img" aria-label="反相放大器电路示意图">
              <g stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round">
                <line x1="30" y1="95" x2="70" y2="95" />
                <rect x="70" y="87" width="40" height="16" rx="2" />
                <line x1="110" y1="95" x2="175" y2="95" />
                <line x1="175" y1="95" x2="210" y2="95" />
                <line x1="175" y1="95" x2="175" y2="45" />
                <line x1="175" y1="45" x2="320" y2="45" />
                <line x1="320" y1="45" x2="320" y2="115" />
                <rect x="195" y="37" width="40" height="16" rx="2" />
                <polygon points="210,75 210,155 290,115" />
                <line x1="290" y1="115" x2="320" y2="115" />
                <line x1="320" y1="115" x2="430" y2="115" />
                <line x1="210" y1="135" x2="120" y2="135" />
                <line x1="108" y1="143" x2="132" y2="143" />
                <line x1="114" y1="149" x2="126" y2="149" />
                <line x1="118" y1="155" x2="122" y2="155" />
                <circle cx="30" cy="95" r="3" fill="currentColor" stroke="none" />
                <circle cx="430" cy="115" r="3" fill="currentColor" stroke="none" />
                <circle cx="175" cy="95" r="3" fill="currentColor" stroke="none" />
                <circle cx="320" cy="115" r="3" fill="currentColor" stroke="none" />
              </g>
              <g fill="currentColor" font-size="12">
                <text x="30" y="80" text-anchor="middle">Vin</text>
                <text x="196" y="99" text-anchor="end">−</text>
                <text x="196" y="139" text-anchor="end">+</text>
                <text x="90" y="78" text-anchor="middle">Ri</text>
                <text x="90" y="120" text-anchor="middle" class="text-primary">{{ fmtR(riOhm) }}</text>
                <text x="215" y="28" text-anchor="middle">Rf</text>
                <text x="215" y="70" text-anchor="middle" class="text-primary">{{ fmtR(rfOhm) }}</text>
                <text x="120" y="172" text-anchor="middle" font-size="10">GND</text>
                <text x="430" y="100" text-anchor="middle">Vout</text>
              </g>
            </svg>

            <!-- 同相放大 -->
            <svg v-else-if="topo === 'noninverting'" viewBox="0 0 480 230" class="w-full max-w-lg mx-auto" role="img" aria-label="同相放大器电路示意图">
              <g stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round">
                <line x1="30" y1="135" x2="210" y2="135" />
                <line x1="210" y1="95" x2="175" y2="95" />
                <line x1="175" y1="95" x2="175" y2="45" />
                <line x1="175" y1="45" x2="320" y2="45" />
                <line x1="320" y1="45" x2="320" y2="115" />
                <rect x="195" y="37" width="40" height="16" rx="2" />
                <line x1="175" y1="95" x2="175" y2="185" />
                <rect x="167" y="115" width="16" height="40" rx="2" />
                <polygon points="210,75 210,155 290,115" />
                <line x1="290" y1="115" x2="320" y2="115" />
                <line x1="320" y1="115" x2="430" y2="115" />
                <line x1="163" y1="193" x2="187" y2="193" />
                <line x1="169" y1="199" x2="181" y2="199" />
                <line x1="173" y1="205" x2="177" y2="205" />
                <circle cx="30" cy="135" r="3" fill="currentColor" stroke="none" />
                <circle cx="430" cy="115" r="3" fill="currentColor" stroke="none" />
                <circle cx="175" cy="95" r="3" fill="currentColor" stroke="none" />
                <circle cx="320" cy="115" r="3" fill="currentColor" stroke="none" />
              </g>
              <g fill="currentColor" font-size="12">
                <text x="30" y="120" text-anchor="middle">Vin</text>
                <text x="196" y="99" text-anchor="end">−</text>
                <text x="196" y="139" text-anchor="end">+</text>
                <text x="215" y="28" text-anchor="middle">Rf</text>
                <text x="215" y="70" text-anchor="middle" class="text-primary">{{ fmtR(rfOhm) }}</text>
                <text x="195" y="128" text-anchor="start">Rg</text>
                <text x="195" y="144" text-anchor="start" class="text-primary">{{ fmtR(rgOhm) }}</text>
                <text x="175" y="222" text-anchor="middle" font-size="10">GND</text>
                <text x="430" y="100" text-anchor="middle">Vout</text>
              </g>
            </svg>

            <!-- 跟随器 -->
            <svg v-else-if="topo === 'follower'" viewBox="0 0 480 230" class="w-full max-w-lg mx-auto" role="img" aria-label="电压跟随器电路示意图">
              <g stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round">
                <line x1="30" y1="135" x2="210" y2="135" />
                <polygon points="210,75 210,155 290,115" />
                <line x1="290" y1="115" x2="320" y2="115" />
                <line x1="320" y1="115" x2="430" y2="115" />
                <line x1="320" y1="115" x2="320" y2="45" />
                <line x1="320" y1="45" x2="150" y2="45" />
                <line x1="150" y1="45" x2="150" y2="95" />
                <line x1="150" y1="95" x2="210" y2="95" />
                <circle cx="30" cy="135" r="3" fill="currentColor" stroke="none" />
                <circle cx="430" cy="115" r="3" fill="currentColor" stroke="none" />
                <circle cx="320" cy="115" r="3" fill="currentColor" stroke="none" />
                <circle cx="320" cy="45" r="3" fill="currentColor" stroke="none" />
              </g>
              <g fill="currentColor" font-size="12">
                <text x="30" y="120" text-anchor="middle">Vin</text>
                <text x="196" y="99" text-anchor="end">−</text>
                <text x="196" y="139" text-anchor="end">+</text>
                <text x="235" y="28" text-anchor="middle">100% 负反馈（Rf = 0）</text>
                <text x="430" y="100" text-anchor="middle">Vout</text>
                <text x="235" y="205" text-anchor="middle" class="text-primary">Vout = Vin（增益 1 倍 / 0 dB）</text>
              </g>
            </svg>

            <!-- 差分放大 -->
            <svg v-else-if="topo === 'differential'" viewBox="0 0 520 270" class="w-full max-w-lg mx-auto" role="img" aria-label="差分放大器电路示意图">
              <g stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round">
                <line x1="30" y1="60" x2="60" y2="60" />
                <rect x="60" y="52" width="44" height="16" rx="2" />
                <line x1="104" y1="60" x2="160" y2="60" />
                <line x1="160" y1="60" x2="160" y2="100" />
                <line x1="160" y1="100" x2="210" y2="100" />
                <line x1="210" y1="100" x2="250" y2="100" />
                <line x1="210" y1="100" x2="210" y2="30" />
                <line x1="210" y1="30" x2="400" y2="30" />
                <line x1="400" y1="30" x2="400" y2="120" />
                <rect x="240" y="22" width="44" height="16" rx="2" />
                <line x1="30" y1="180" x2="60" y2="180" />
                <rect x="60" y="172" width="44" height="16" rx="2" />
                <line x1="104" y1="180" x2="160" y2="180" />
                <line x1="160" y1="180" x2="160" y2="140" />
                <line x1="160" y1="140" x2="210" y2="140" />
                <line x1="210" y1="140" x2="250" y2="140" />
                <line x1="210" y1="140" x2="210" y2="225" />
                <rect x="202" y="165" width="16" height="44" rx="2" />
                <polygon points="250,80 250,160 330,120" />
                <line x1="330" y1="120" x2="400" y2="120" />
                <line x1="400" y1="120" x2="470" y2="120" />
                <line x1="198" y1="233" x2="222" y2="233" />
                <line x1="204" y1="239" x2="216" y2="239" />
                <line x1="208" y1="245" x2="212" y2="245" />
                <circle cx="30" cy="60" r="3" fill="currentColor" stroke="none" />
                <circle cx="30" cy="180" r="3" fill="currentColor" stroke="none" />
                <circle cx="470" cy="120" r="3" fill="currentColor" stroke="none" />
                <circle cx="210" cy="100" r="3" fill="currentColor" stroke="none" />
                <circle cx="210" cy="140" r="3" fill="currentColor" stroke="none" />
                <circle cx="400" cy="120" r="3" fill="currentColor" stroke="none" />
              </g>
              <g fill="currentColor" font-size="12">
                <text x="30" y="45" text-anchor="middle">V1</text>
                <text x="30" y="165" text-anchor="middle">V2</text>
                <text x="240" y="104" text-anchor="end">−</text>
                <text x="240" y="144" text-anchor="end">+</text>
                <text x="82" y="44" text-anchor="middle">Ri</text>
                <text x="82" y="88" text-anchor="middle" class="text-primary">{{ fmtR(riOhm) }}</text>
                <text x="82" y="164" text-anchor="middle">Ri</text>
                <text x="82" y="208" text-anchor="middle" class="text-primary">{{ fmtR(riOhm) }}</text>
                <text x="262" y="14" text-anchor="middle">Rf</text>
                <text x="262" y="56" text-anchor="middle" class="text-primary">{{ fmtR(rfOhm) }}</text>
                <text x="196" y="185" text-anchor="end">Rf</text>
                <text x="196" y="202" text-anchor="end" class="text-primary">{{ fmtR(rfOhm) }}</text>
                <text x="210" y="262" text-anchor="middle" font-size="10">GND</text>
                <text x="470" y="105" text-anchor="middle">Vout</text>
                <text x="330" y="215" text-anchor="middle" font-size="11">匹配前提：R4/R2 = Rf/Ri</text>
              </g>
            </svg>

            <!-- 仪表放大器 -->
            <svg v-else viewBox="0 0 560 300" class="w-full max-w-xl mx-auto" role="img" aria-label="三运放仪表放大器电路示意图">
              <g stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round">
                <line x1="45" y1="75" x2="120" y2="75" />
                <polygon points="120,60 120,120 170,90" />
                <line x1="170" y1="90" x2="200" y2="90" />
                <line x1="200" y1="90" x2="200" y2="40" />
                <line x1="200" y1="40" x2="85" y2="40" />
                <line x1="85" y1="40" x2="85" y2="105" />
                <rect x="77" y="55" width="16" height="32" rx="2" />
                <line x1="85" y1="105" x2="120" y2="105" />
                <line x1="85" y1="105" x2="85" y2="225" />
                <rect x="77" y="150" width="16" height="32" rx="2" />
                <line x1="45" y1="195" x2="120" y2="195" />
                <polygon points="120,180 120,240 170,210" />
                <line x1="170" y1="210" x2="200" y2="210" />
                <line x1="200" y1="210" x2="200" y2="270" />
                <line x1="200" y1="270" x2="85" y2="270" />
                <line x1="85" y1="270" x2="85" y2="225" />
                <rect x="77" y="236" width="16" height="34" rx="2" />
                <line x1="200" y1="90" x2="235" y2="90" />
                <rect x="235" y="82" width="40" height="16" rx="2" />
                <line x1="275" y1="90" x2="285" y2="90" />
                <line x1="285" y1="90" x2="310" y2="90" />
                <line x1="200" y1="210" x2="235" y2="210" />
                <rect x="235" y="202" width="40" height="16" rx="2" />
                <line x1="275" y1="210" x2="285" y2="210" />
                <line x1="285" y1="210" x2="285" y2="130" />
                <line x1="285" y1="130" x2="310" y2="130" />
                <polygon points="310,70 310,150 360,110" />
                <line x1="285" y1="90" x2="285" y2="25" />
                <line x1="285" y1="25" x2="400" y2="25" />
                <line x1="400" y1="25" x2="400" y2="110" />
                <rect x="310" y="17" width="40" height="16" rx="2" />
                <line x1="300" y1="130" x2="300" y2="175" />
                <rect x="292" y="138" width="16" height="34" rx="2" />
                <line x1="288" y1="183" x2="312" y2="183" />
                <line x1="294" y1="189" x2="306" y2="189" />
                <line x1="298" y1="195" x2="302" y2="195" />
                <line x1="360" y1="110" x2="400" y2="110" />
                <line x1="400" y1="110" x2="490" y2="110" />
                <circle cx="45" cy="75" r="3" fill="currentColor" stroke="none" />
                <circle cx="45" cy="195" r="3" fill="currentColor" stroke="none" />
                <circle cx="200" cy="90" r="3" fill="currentColor" stroke="none" />
                <circle cx="200" cy="210" r="3" fill="currentColor" stroke="none" />
                <circle cx="85" cy="105" r="3" fill="currentColor" stroke="none" />
                <circle cx="85" cy="225" r="3" fill="currentColor" stroke="none" />
                <circle cx="285" cy="90" r="3" fill="currentColor" stroke="none" />
                <circle cx="285" cy="130" r="3" fill="currentColor" stroke="none" />
                <circle cx="300" cy="130" r="3" fill="currentColor" stroke="none" />
                <circle cx="400" cy="110" r="3" fill="currentColor" stroke="none" />
                <circle cx="490" cy="110" r="3" fill="currentColor" stroke="none" />
              </g>
              <g fill="currentColor" font-size="12">
                <text x="45" y="60" text-anchor="middle">V1</text>
                <text x="45" y="180" text-anchor="middle">V2</text>
                <text x="112" y="79" text-anchor="end">+</text>
                <text x="112" y="109" text-anchor="end">−</text>
                <text x="112" y="199" text-anchor="end">+</text>
                <text x="112" y="229" text-anchor="end">−</text>
                <text x="302" y="94" text-anchor="end">−</text>
                <text x="302" y="134" text-anchor="end">+</text>
                <text x="66" y="68" text-anchor="end">R</text>
                <text x="66" y="160" text-anchor="end">RG</text>
                <text x="66" y="176" text-anchor="end" class="text-primary">{{ fmtR(rgInaOhm) }}</text>
                <text x="66" y="250" text-anchor="end">R</text>
                <text x="255" y="74" text-anchor="middle">R</text>
                <text x="255" y="196" text-anchor="middle">R</text>
                <text x="330" y="10" text-anchor="middle">R</text>
                <text x="286" y="158" text-anchor="end">R</text>
                <text x="300" y="214" text-anchor="middle" font-size="10">GND</text>
                <text x="490" y="95" text-anchor="middle">Vout</text>
                <text x="280" y="292" text-anchor="middle" font-size="11">第一级 G1 = 1 + 2R/RG，末级为 R 同值匹配的差分级，总增益 G = (1 + 2R/RG) × 1</text>
              </g>
            </svg>
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
            <li>先选拓扑再填参数：反相输入阻抗约等于 Ri（信号经 Ri 进虚地），同相输入阻抗极高（虚断），弱信号源优先同相或仪表放大器。</li>
            <li>增益精度由电阻容差决定：1% 电阻最坏约 ±2%（反相为 ±2δ；同相约 ±2×(G−1)/G），要更稳请用 E96 + 0.1% 精度档。</li>
            <li>GBW 余量建议 ≥10×：余量不足时高频增益跌落、相位裕度恶化；不够就降增益分级放大或换高 GBW 型号。</li>
            <li>仪表放大器 RG 与增益呈双曲线关系，高增益时 RG 很小，注意用 E96 细分档并核对型号手册的增益常数。</li>
            <li>输出摆幅校验按对称双电源 ±Vs 与单边 headroom 估算，Rail-to-Rail 型可把裕量设到接近 0；单电源应用按实际轨折算。</li>
          </ul>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <CheckCircle class="w-4 h-4 mr-2 text-primary" /> 口径与自检锚点
          </h3>
          <ul class="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <li>• 反相 −10 倍、Ri=10k → Rf=100k，E24/E96 均精确命中（偏差 0%）</li>
            <li>• 同相 100 倍、Rg=1k → Rf 精确 99k；E24/E96 最近档均为 100k → 实际 101 倍（+1.00%）</li>
            <li>• dB：100 倍 = 40 dB、10 倍 = 20 dB、跟随器 = 0 dB</li>
            <li>• GBW 1MHz、带宽 10kHz → 最大 100 倍；目标 10 倍时余量 10×（达标）</li>
            <li>• INA（49.4k 口径）RG=4.99k → G ≈ 10.90 倍</li>
            <li>• ±12V 轨、1V 裕量 → |Vout| ≤ 11V；100 倍 × 0.2V 输入触发饱和警告</li>
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

    <!-- 免责条 -->
    <div class="flex items-start gap-2 p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
        免责声明：本页为理想运放一阶口径的快速估算，未计入输入失调电压、偏置电流、共模抑制与压摆率等非理想因素；
        仪表放大器增益常数、输出摆幅与 GBW 参数以所选型号数据手册为准，精密设计请以实测与仿真复核。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>虚短与虚断：所有增益公式的根基</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          理想运放分析只靠两条口诀。<span class="text-foreground font-medium">虚断</span>：运放输入阻抗极大，流进两个输入端的电流近似为零，
          所以反馈网络里 Rf 与 Ri 流过同一个电流；<span class="text-foreground font-medium">虚短</span>：深度负反馈把两个输入端电压"钳"在一起（V+ ≈ V−），
          反相组态的反相端因此被称为虚地。把两条口诀代入基尔霍夫定律：反相流过 Ri 的电流 = 流过 Rf 的电流，
          即 Vin/Ri = −Vout/Rf，整理即得 A = −Rf/Ri；同相组态则是 Rg 上的分压等于 Vin，得 A = 1 + Rf/Rg。
          所有"教科书公式"都只在环路增益足够大（GBW 余量充足）时成立。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>为什么同相输入阻抗高、反相输入阻抗约等于 Ri</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          同相组态的信号直接进同相输入端，从信号源看进去就是运放自身的输入阻抗（FET 输入型可达 TΩ 级），几乎不取电流；
          而反相组态的信号要经过 Ri 流入"虚地"节点，输入阻抗就是 Ri 本身——Ri 取 1k 时信号源要带得动 1k 负载。
          所以弱信号源（高内阻传感器、光电二极管）优先选同相或仪表放大器；反相组态的优势则是没有共模电压、
          噪声与失真表现更干净，且方便多路信号在虚地处求和。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>差分放大的电阻匹配与 CMRR</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          四电阻差分放大器靠 Rf/Ri 与 R4/R2 完全成比例来抵消共模电压：理想匹配时共模增益为零，
          输出只剩 (Rf/Ri)×(V2−V1)。实际失配会让一部分共模信号漏到输出，最坏情况 CMRR 近似为
          (1+G)/(4×失配率)：G=10、电阻 1% 失配时 CMRR 上限约 48.8 dB，0.1% 失配才能抬到约 68.8 dB。
          这也是差分放大器对电阻精度极其敏感、而仪表放大器（片内激光调阻匹配）在精密采集里更常用的原因。
          需要精密基准分压时可配合 <NuxtLink to="/tools/eseries-resistor-finder" class="text-primary hover:underline">E系列标准阻值查找</NuxtLink>
          选档，用 <NuxtLink to="/tools/tl431-feedback-calculator" class="text-primary hover:underline">稳压反馈电阻计算器</NuxtLink>
          处理基准源一侧的反馈网络。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>仪表放大器的三级结构与增益常数</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          经典三运放仪表放大器分两级：第一级两只运放各自接成同相缓冲，增益电阻 RG 跨接在两个反相节点之间，
          差分增益 G1 = 1 + 2R/RG——RG 只改变增益、不影响输入阻抗，且两输入端阻抗都极高；第二级是同值匹配的差分减法器，
          把两路信号相减并抑制共模。增益公式里的常数由片内激光调阻电阻决定：AD620 为 49.4kΩ（本工具口径），
          INA128 为 50kΩ、INA333 为 100kΩ，<span class="text-foreground font-medium">务必以所选型号手册为准</span>。
          RG 太小时增益噪声增益上升、精度下降，一般把最大增益留给专用高增益档位。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>GBW 与带宽的取舍</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          电压反馈运放的增益带宽积（GBW）近似恒定：闭环带宽 ≈ GBW / 增益，增益越高带宽越窄。
          本工具按 GBW / 信号带宽给出"最大可用增益"，并对比目标增益给出余量倍数——建议 ≥10×，
          因为余量接近 1× 时不仅高频增益跌落，环路相位裕度也会恶化，阶跃响应出现过冲振铃甚至不稳定；
          余量充足时闭环响应更平坦、失真更低。要 100 倍、20kHz 带宽，理论上 GBW ≥ 2MHz 即可，
          工程上选 ≥20MHz 才有健康的裕度。跨过电压反馈的局限可以考虑电流反馈型（CFB）或分解增益级联。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>1% 电阻带来的增益误差有多大</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          把 ΔR/R = δ 代入增益公式可得最坏相对误差：反相 A = Rf/Ri 时误差 ≈ ±(δf + δi)，两只 1% 电阻最坏 ±2%；
          同相 A = 1 + Rf/Rg 时误差 ≈ ±2δ×(G−1)/G——G=2 时约 ±1%，G=100 时趋近 ±2%。
          换成 E96 + 0.1% 精度档可把最坏误差压到 ±0.2%，这是反馈网络选料的常规做法；
          注意吸附到标准档本身还会带来"标称偏差"（如 99k 吸附 100k 后实际增益 101 倍，+1%），两层误差要分开看：
          标称偏差可通过换档位或串并联凑值消除，容差误差只能靠精度等级压低。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">运放增益的 dB 怎么换算？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              dB = 20 × log₁₀|A|。100 倍 = 40 dB，10 倍 = 20 dB，2 倍 ≈ 6.02 dB，跟随器 1 倍 = 0 dB，
              0.707 倍（半功率点）≈ −3 dB。反相放大器增益为负只表示相位反转 180°，取绝对值后换算 dB。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">反相放大器输出为什么是负的？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              反相端是虚地，输入电流 Vin/Ri 只能流向反馈电阻 Rf，为维持虚地平衡输出必须提供 −(Rf/Ri)×Vin，
              即增益 −Rf/Ri，输出与输入反相 180°。负号是相位信息而不是"衰减"，|A| 可以远大于 1。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">99k 电阻买不到怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              目标 100 倍、Rg=1k 需要 Rf=99k，它不在 E24/E96 表内（98.8k 属 E192）：E96 最近档 100k → 实际增益 101 倍（+1.00%）。
              要更准可以串联合成 97.6k + 1.2k = 98.8k（两只均 E96）→ 99.8 倍，或换 Rg 用 E96 细分档凑比例；
              批量一致性要求高时直接用 0.1% 精度电阻并接受标称偏差。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">100 倍增益需要多大 GBW？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              闭环带宽 = GBW/增益：要 100 倍、20kHz 带宽，GBW 至少 2MHz（余量 1×，贴着极限）；
              按 ≥10× 余量原则建议选 ≥20MHz，或把 100 倍拆成两级 10 倍级联（每级 GBW 需求大幅下降，总带宽更宽）。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'opamp-gain-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Triangle, Calculator, Activity, Table, Info, Lightbulb,
  CheckCircle, Link as LinkIcon, ChevronUp, ChevronDown, AlertTriangle, Gauge
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'opamp-gain-calculator'
const STORAGE_KEY = 'opamp-gain-calculator.inputs'

// SEO
useSeoMeta({
  title: '运放增益计算器 - 反相/同相/差分/仪表放大五种拓扑与 dB 换算',
  description: '在线运放增益计算器：反相、同相、跟随器、差分、仪表放大器五种拓扑增益计算，倍数与 dB 双显示、输出摆幅饱和校验、GBW 增益带宽校验、E24/E96 电阻吸附回验，纯本地计算',
  keywords: '运放增益计算, 反相放大器增益, 同相放大器计算, 仪表放大器增益, 差分放大计算, 运放dB换算, op amp gain calculator, GBW计算',
  author: 'Util工具箱',
  ogTitle: '运放增益计算器 - 有条工具',
  ogDescription: '五种运放拓扑增益计算、dB 双显示、摆幅与 GBW 校验、E 系列电阻吸附回验',
  ogUrl: 'https://www.util.cn/tools/opamp-gain-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '运放增益计算器',
  twitterDescription: '反相/同相/差分/仪表放大增益计算，倍数与 dB 双显示，E 系列吸附回验'
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
          name: '运放增益计算器',
          url: 'https://www.util.cn/tools/opamp-gain-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '反相/同相/跟随器/差分/仪表放大五种拓扑',
            '增益倍数与 dB（20·log₁₀|A|）双显示',
            '可选 Vin 与 ±Vs 输出摆幅校验与饱和警告',
            'GBW 最大可用增益与余量倍数校验',
            '增益比 E24/E96 标准阻值吸附与实际增益回验',
            '随参数重绘的拓扑 SVG 示意图'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '运放增益计算器', item: 'https://www.util.cn/tools/opamp-gain-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '运放增益的 dB 怎么换算？',
              acceptedAnswer: { '@type': 'Answer', text: 'dB = 20 × log₁₀|A|：100 倍 = 40 dB，10 倍 = 20 dB，跟随器 1 倍 = 0 dB；反相增益的负号表示相位反转 180°，取绝对值换算。' }
            },
            {
              '@type': 'Question',
              name: '反相放大器输出为什么是负的？',
              acceptedAnswer: { '@type': 'Answer', text: '反相端虚地下输入电流流经反馈电阻，输出必须提供 −(Rf/Ri)×Vin 维持平衡，即增益 −Rf/Ri、相位反转 180°；负号是相位信息而非衰减。' }
            },
            {
              '@type': 'Question',
              name: '99k 电阻买不到怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: 'E96 最近档 100k 使 1k+100k 实际增益 101 倍（+1.00%）；可串联合成 97.6k+1.2k=98.8k（均 E96）得 99.8 倍，或用 0.1% 精度档。' }
            },
            {
              '@type': 'Question',
              name: '100 倍增益需要多大 GBW？',
              acceptedAnswer: { '@type': 'Answer', text: '闭环带宽 = GBW/增益，100 倍、20kHz 带宽理论 GBW ≥ 2MHz；按 ≥10× 余量原则建议 ≥20MHz，或拆两级 10 倍级联。' }
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
  restoreInputs()
})

// __PURE_FNS_START__
// ---------- IEC 60063 基准表（每 decade，×10ⁿ 跨档复用） ----------
const E24 = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91]
const E96 = [10, 10.2, 10.5, 10.7, 11, 11.3, 11.5, 11.8, 12.1, 12.4, 12.7, 13, 13.3, 13.7, 14, 14.3, 14.7, 15, 15.4, 15.8, 16.2, 16.5, 16.9, 17.4, 17.8, 18.2, 18.7, 19.1, 19.6, 20, 20.5, 21, 21.5, 22.1, 22.6, 23.2, 23.7, 24.3, 24.9, 25.5, 26.1, 26.7, 27.4, 28, 28.7, 29.4, 30.1, 30.9, 31.6, 32.4, 33.2, 34, 34.8, 35.7, 36.5, 37.4, 38.3, 39.2, 40.2, 41.2, 42.2, 43.2, 44.2, 45.3, 46.4, 47.5, 48.7, 49.9, 51.1, 52.3, 53.6, 54.9, 56.2, 57.6, 59, 60.4, 61.9, 63.4, 64.9, 66.5, 68.1, 69.8, 71.5, 73.2, 75, 76.8, 78.7, 80.6, 82.5, 84.5, 86.6, 88.7, 90.9, 93.1, 95.3, 97.6]

const SERIES_TABLES = { E24, E96 }
const DECADE_MIN = -3
const DECADE_MAX = 7

// 仪表放大器增益常数（AD620 口径；INA128=50k、INA333=100k，以所选型号手册为准）
const INA_RCONST = 49400

// 浮点清理（46.4×10 → 464）
const norm = (v) => Number(v.toPrecision(12))

// 最近标准值：E 系列为等比数列，按对数（几何）距离取最近，同距取较低档
const snapSeries = (series, target) => {
  const base = SERIES_TABLES[series] || E96
  if (!Number.isFinite(target) || !(target > 0)) return null
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

// ---------- 五拓扑增益 ----------
// 反相：|A| = Rf/Ri（输出反相，负号由展示层添加）
const gainInverting = (rf, ri) => {
  if (!Number.isFinite(rf) || !Number.isFinite(ri) || !(rf > 0) || !(ri > 0)) return null
  return rf / ri
}
// 同相：A = 1 + Rf/Rg
const gainNonInverting = (rf, rg) => {
  if (!Number.isFinite(rf) || !Number.isFinite(rg) || !(rf >= 0) || !(rg > 0)) return null
  return 1 + rf / rg
}
// 跟随器：固定 1 倍
const gainFollower = () => 1
// 差分增益：G = Rf/Ri（匹配 R4/R2 = Rf/Ri 前提下 Vout = G×(V2−V1)）
const gainDifferential = (rf, ri) => gainInverting(rf, ri)
const diffVout = (g, v2, v1) => {
  if (!Number.isFinite(g) || !Number.isFinite(v2) || !Number.isFinite(v1)) return null
  return g * (v2 - v1)
}
// 仪表放大器：G = 1 + Rconst/RG
const gainIna = (rg, rconst = INA_RCONST) => {
  if (!Number.isFinite(rg) || !Number.isFinite(rconst) || !(rg > 0) || !(rconst > 0)) return null
  return 1 + rconst / rg
}

// ---------- dB 与校验 ----------
// dB = 20·log₁₀|A|
const toDb = (a) => {
  if (!Number.isFinite(a) || a === 0) return null
  return 20 * Math.log10(Math.abs(a))
}
// 最大可用增益 = GBW / 信号带宽
const gbwMaxGain = (gbwHz, bwHz) => {
  if (!Number.isFinite(gbwHz) || !Number.isFinite(bwHz) || !(gbwHz > 0) || !(bwHz > 0)) return null
  return gbwHz / bwHz
}
// 输出摆幅上限 = Vs − headroom（对称双电源单边口径）
const swingLimit = (vs, headroom) => {
  if (!Number.isFinite(vs) || !Number.isFinite(headroom) || !(vs > 0) || !(headroom >= 0)) return null
  return vs - headroom
}
// 差分放大电阻失配的 CMRR 上限：≈ (1+G)/(4δ)，δ 为失配率（小数）
const diffCmrrDb = (g, mismatch = 0.01) => {
  if (!Number.isFinite(g) || !(g > 0) || !Number.isFinite(mismatch) || !(mismatch > 0)) return null
  return 20 * Math.log10((1 + g) / (4 * mismatch))
}

// ---------- 增益 → 电阻吸附回验 ----------
// topo: 'inverting' | 'noninverting' | 'differential' | 'ina'（follower 固定 1 倍无电阻）
const snapForGain = (topo, targetGain, baseOhm, series) => {
  if (!Number.isFinite(targetGain) || !(targetGain > 0)) return null
  let exact = null
  let actualOf = null
  if (topo === 'inverting' || topo === 'differential') {
    if (!Number.isFinite(baseOhm) || !(baseOhm > 0)) return null
    exact = targetGain * baseOhm
    actualOf = (rf) => rf / baseOhm
  } else if (topo === 'noninverting') {
    if (!(targetGain > 1)) return null
    if (!Number.isFinite(baseOhm) || !(baseOhm > 0)) return null
    exact = (targetGain - 1) * baseOhm
    actualOf = (rf) => 1 + rf / baseOhm
  } else if (topo === 'ina') {
    if (!(targetGain > 1)) return null
    exact = INA_RCONST / (targetGain - 1)
    actualOf = (rg) => 1 + INA_RCONST / rg
  } else {
    return null
  }
  if (!Number.isFinite(exact) || !(exact > 0)) return null
  const snap = snapSeries(series, exact)
  if (snap === null) return null
  const actual = actualOf(snap)
  return {
    exact,
    snap,
    actual,
    devPct: (actual / targetGain - 1) * 100
  }
}

// ---------- 展示格式化（避免浮点尾差） ----------
const trimZeros = (s) => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s)
const fmtNum = (v, sig = 4) => {
  if (!Number.isFinite(v)) return '—'
  const s = parseFloat(v.toPrecision(sig)).toString()
  return trimZeros(s)
}
const fmtR = (v) => {
  if (!Number.isFinite(v) || v <= 0) return '—'
  if (v >= 1e6) return trimZeros((v / 1e6).toPrecision(4)) + ' MΩ'
  if (v >= 1e3) return trimZeros((v / 1e3).toPrecision(4)) + ' kΩ'
  return trimZeros(v.toPrecision(4)) + ' Ω'
}
const fmtV = (v) => (!Number.isFinite(v) ? '—' : trimZeros(v.toPrecision(4)) + ' V')
const fmtDevPct = (p) => (!Number.isFinite(p) ? '—' : (p >= 0 ? '+' : '') + p.toFixed(2) + '%')
const devClsOf = (p) => {
  if (!Number.isFinite(p)) return ''
  const abs = Math.abs(p)
  if (abs <= 1) return 'text-green-600 dark:text-green-400'
  if (abs <= 5) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}
// __PURE_FNS_END__

// ---------- 状态 ----------
const TOPOS = [
  { k: 'inverting', label: '反相放大' },
  { k: 'noninverting', label: '同相放大' },
  { k: 'follower', label: '跟随器' },
  { k: 'differential', label: '差分放大' },
  { k: 'ina', label: '仪表放大器' }
]
const R_UNITS = [
  { k: 'Ω', f: 1 },
  { k: 'kΩ', f: 1e3 },
  { k: 'MΩ', f: 1e6 }
]
const BW_UNITS = { Hz: 1, kHz: 1e3, MHz: 1e6 }

const topo = ref('inverting')
const rUnit = ref('kΩ')
const ri = ref(10)
const rf = ref(100)
const rg = ref(10)
const rgIna = ref(4.99)
const vin = ref(0.1)
const v1 = ref(0)
const v2 = ref(0.1)
const vsRail = ref(12)
const headroom = ref(1)
const gbwMhz = ref(1)
const bwVal = ref(10)
const bwUnit = ref('kHz')
const snapTarget = ref(100)
const snapBase = ref(10)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const unitFactor = (k) => {
  const u = R_UNITS.find((x) => x.k === k)
  return u ? u.f : 1
}
// 有限数值或 null（空输入时不做摆幅校验）
const numOrNull = (v) => (Number.isFinite(v) ? v : null)

// 换算到 Ω
const riOhm = computed(() => ri.value * unitFactor(rUnit.value))
const rfOhm = computed(() => rf.value * unitFactor(rUnit.value))
const rgOhm = computed(() => rg.value * unitFactor(rUnit.value))
const rgInaOhm = computed(() => rgIna.value * unitFactor(rUnit.value))

const R_MIN = 0.1
const R_MAX = 1e8
const rOk = (x) => Number.isFinite(x) && x >= R_MIN && x <= R_MAX

// ---------- 公式行 ----------
const formulaText = computed(() => {
  switch (topo.value) {
    case 'inverting': return 'A = −Rf / Ri（反相，相位反转 180°）'
    case 'noninverting': return 'A = 1 + Rf / Rg（同相）'
    case 'follower': return 'A = 1（Rf = 0，输出 100% 直接反馈）'
    case 'differential': return 'Vout = (Rf/Ri) × (V2 − V1)，前提 R4/R2 = Rf/Ri'
    case 'ina': return 'G = 1 + 49.4kΩ / RG（三运放 INA 口径，以所选型号手册为准）'
    default: return ''
  }
})

// ---------- 模块①：增益结果 ----------
const gainResult = computed(() => {
  const t = topo.value
  let gainMag = null
  let vout = null
  let voutExpr = ''
  let phaseInverted = false

  if (t === 'follower') {
    gainMag = gainFollower()
    const vinV = numOrNull(vin.value)
    vout = vinV
    voutExpr = 'Vout = Vin'
  } else if (t === 'inverting') {
    if (!rOk(riOhm.value) || !rOk(rfOhm.value)) return null
    gainMag = gainInverting(rfOhm.value, riOhm.value)
    if (gainMag === null) return null
    phaseInverted = true
    const vinV = numOrNull(vin.value)
    if (vinV !== null) {
      vout = -gainMag * vinV
      voutExpr = `Vout = −(Rf/Ri)×Vin = −${fmtNum(gainMag, 4)}×${fmtNum(vinV, 4)} V`
    }
  } else if (t === 'noninverting') {
    if (!rOk(rgOhm.value) || !rOk(rfOhm.value)) return null
    gainMag = gainNonInverting(rfOhm.value, rgOhm.value)
    if (gainMag === null) return null
    const vinV = numOrNull(vin.value)
    if (vinV !== null) {
      vout = gainMag * vinV
      voutExpr = `Vout = A×Vin = ${fmtNum(gainMag, 4)}×${fmtNum(vinV, 4)} V`
    }
  } else if (t === 'differential') {
    if (!rOk(riOhm.value) || !rOk(rfOhm.value)) return null
    gainMag = gainDifferential(rfOhm.value, riOhm.value)
    if (gainMag === null) return null
    if (Number.isFinite(v1.value) && Number.isFinite(v2.value)) {
      vout = diffVout(gainMag, v2.value, v1.value)
      voutExpr = `Vout = (Rf/Ri)×(V2−V1) = ${fmtNum(gainMag, 4)}×(${fmtNum(v2.value, 4)}−${fmtNum(v1.value, 4)}) V`
    }
  } else if (t === 'ina') {
    if (!rOk(rgInaOhm.value)) return null
    gainMag = gainIna(rgInaOhm.value)
    if (gainMag === null) return null
    if (Number.isFinite(v1.value) && Number.isFinite(v2.value)) {
      vout = diffVout(gainMag, v2.value, v1.value)
      voutExpr = `Vout = G×(V2−V1) = ${fmtNum(gainMag, 4)}×(${fmtNum(v2.value, 4)}−${fmtNum(v1.value, 4)}) V`
    }
  } else {
    return null
  }

  const db = toDb(gainMag)
  if (db === null) return null

  // 输出摆幅校验
  let saturated = null
  let limitV = null
  const vs = numOrNull(vsRail.value)
  const hr = numOrNull(headroom.value)
  if (vout !== null && vs !== null) {
    limitV = swingLimit(vs, hr === null ? 1 : hr)
    if (limitV !== null && limitV >= 0) {
      saturated = Math.abs(vout) > limitV
    }
  }

  // 差分拓扑附 CMRR 注记
  const cmrr = t === 'differential' ? diffCmrrDb(gainMag) : null
  const cmrrText = cmrr !== null
    ? `CMRR 注记：电阻按 R2=Ri、R4=Rf 匹配时，1% 失配的共模抑制上限约 ${fmtNum(cmrr, 3)} dB（实际还受运放自身 CMRR 限制），0.1% 档可抬升约 20 dB。`
    : ''

  const gainText = (phaseInverted ? '−' : '') + fmtNum(gainMag, 4)
  return {
    gainMag,
    phaseInverted,
    gainText,
    dbText: db.toFixed(2) + ' dB',
    vout,
    voutText: fmtV(vout),
    voutAbsText: fmtV(Math.abs(vout)),
    voutExpr,
    saturated,
    limitText: '≤ ' + fmtV(limitV),
    cmrrText
  }
})

// ---------- 模块②：GBW 校验 ----------
const gbwResult = computed(() => {
  const gbwHz = gbwMhz.value * 1e6
  const bwHz = bwVal.value * (BW_UNITS[bwUnit.value] || 1)
  const maxGain = gbwMaxGain(gbwHz, bwHz)
  if (maxGain === null) return null
  const gr = gainResult.value
  const target = gr ? Math.abs(gr.gainMag) : null
  if (target === null || !(target > 0)) return null
  const margin = maxGain / target
  const clBwHz = gbwHz / target
  let marginCls = 'text-red-600 dark:text-red-400'
  let verdict = '余量不足：带宽内增益撑不住，请换更高 GBW 型号或降低增益分级放大。'
  let verdictCls = 'text-red-600 dark:text-red-400'
  if (margin >= 10) {
    marginCls = 'text-green-600 dark:text-green-400'
    verdict = '余量充足（≥10×）：闭环带宽内增益平坦、相位裕度健康。'
    verdictCls = 'text-green-600 dark:text-green-400'
  } else if (margin >= 1) {
    marginCls = 'text-yellow-600 dark:text-yellow-400'
    verdict = '余量偏紧（1~10×）：高频段增益开始跌落、失真上升，建议 ≥10×。'
    verdictCls = 'text-yellow-600 dark:text-yellow-400'
  }
  return {
    maxText: fmtNum(maxGain, 4),
    targetText: fmtNum(target, 4),
    marginText: fmtNum(margin, 3) + '×',
    marginCls,
    clBwText: fmtFreq(clBwHz),
    verdict,
    verdictCls
  }
})

const fmtFreq = (hz) => {
  if (!Number.isFinite(hz) || hz <= 0) return '—'
  if (hz >= 1e6) return trimZeros((hz / 1e6).toPrecision(4)) + ' MHz'
  if (hz >= 1e3) return trimZeros((hz / 1e3).toPrecision(4)) + ' kHz'
  return trimZeros(hz.toPrecision(4)) + ' Hz'
}

// ---------- 模块③：E 系列吸附联动 ----------
const snapRows = computed(() => {
  const t = topo.value
  if (t === 'follower') return []
  const target = snapTarget.value
  const base = snapBase.value * unitFactor(rUnit.value)
  const out = []
  for (const series of ['E24', 'E96']) {
    const r = snapForGain(t, target, t === 'ina' ? null : base, series)
    if (!r) continue
    const actualText = (t === 'inverting' ? '−' : '') + fmtNum(r.actual, 5) + ' 倍'
    out.push({
      series,
      exactText: fmtR(r.exact),
      snapText: fmtR(r.snap),
      actualText,
      devText: fmtDevPct(r.devPct),
      devCls: devClsOf(r.devPct)
    })
  }
  return out
})

const snapNote = computed(() => {
  const t = topo.value
  if (t === 'follower') return ''
  const target = snapTarget.value
  if (!Number.isFinite(target) || !(target > 0)) return ''
  if ((t === 'noninverting' || t === 'ina') && !(target > 1)) {
    return '该拓扑增益恒大于 1（同相含 +1 项），目标增益需大于 1。'
  }
  return '吸附口径：对数距离取最近档，与 E 系列查找工具一致；吸附偏差（标称）与电阻容差（分布）是两层独立误差。'
})

// ---------- 输入持久化（键前缀为工具 id） ----------
const restoreInputs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const s = JSON.parse(raw)
    const num = (v) => Number.isFinite(v) ? v : null
    if (TOPOS.some((t) => t.k === s.topo)) topo.value = s.topo
    if (R_UNITS.some((u) => u.k === s.rUnit)) rUnit.value = s.rUnit
    for (const [key, refv, lo, hi] of [
      ['ri', ri, R_MIN, R_MAX], ['rf', rf, R_MIN, R_MAX], ['rg', rg, R_MIN, R_MAX],
      ['rgIna', rgIna, R_MIN, R_MAX], ['vin', vin, -1000, 1000],
      ['v1', v1, -1000, 1000], ['v2', v2, -1000, 1000],
      ['vsRail', vsRail, 0.1, 1000], ['headroom', headroom, 0, 100],
      ['gbwMhz', gbwMhz, 0.001, 10000], ['bwVal', bwVal, 0.001, 1e9],
      ['snapTarget', snapTarget, 0, 1e6], ['snapBase', snapBase, R_MIN, R_MAX]
    ]) {
      const v = num(s[key])
      if (v !== null && v >= lo && v <= hi) refv.value = v
    }
    if (Object.keys(BW_UNITS).includes(s.bwUnit)) bwUnit.value = s.bwUnit
  } catch (e) { /* localStorage 不可用时忽略 */ }
}

watch([topo, rUnit, ri, rf, rg, rgIna, vin, v1, v2, vsRail, headroom, gbwMhz, bwVal, bwUnit, snapTarget, snapBase], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      topo: topo.value, rUnit: rUnit.value, ri: ri.value, rf: rf.value, rg: rg.value,
      rgIna: rgIna.value, vin: vin.value, v1: v1.value, v2: v2.value,
      vsRail: vsRail.value, headroom: headroom.value,
      gbwMhz: gbwMhz.value, bwVal: bwVal.value, bwUnit: bwUnit.value,
      snapTarget: snapTarget.value, snapBase: snapBase.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
})

// ---------- 相关工具 ----------
const relatedLinks = computed(() => ['eseries-resistor-finder', 'tl431-feedback-calculator', 'ohms-law-calculator']
  .map((id) => tools.find((t) => t.id === id))
  .filter(Boolean))
</script>
