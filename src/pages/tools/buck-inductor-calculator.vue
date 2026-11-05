<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BatteryCharging class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">BUCK电感选型计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">Buck 电路电感感值计算、纹波率回验、CCM/DCM 判定与峰值电流校验在线计算器</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        按纹波率法计算 Buck 变换器电感：L = (Vin−Vout)×D / (fs×ΔI_L)，其中 D = Vout/Vin、ΔI_L = r×Iout。给出推荐标准感值档并回验实际纹波率，输出峰值电流 I_pk、RMS 电流与「饱和电流需 ≥ 1.2×I_pk」校验提示。全部计算在浏览器本地完成，纹波率 r 取 20~40% 为工程常规区间。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 电感感值与电流应力计算
        </h2>

        <!-- 输入区 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">输入电压 Vin（V）</label>
            <input
              v-model.number="vin"
              type="number"
              min="0"
              step="0.5"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">Buck 为降压拓扑，需满足 Vin &gt; Vout</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">输出电压 Vout（V）</label>
            <input
              v-model.number="vout"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">占空比 D ≈ Vout / Vin（忽略损耗）</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">输出电流 Iout（A）</label>
            <input
              v-model.number="iout"
              type="number"
              min="0"
              step="0.5"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">满载电流，IL 平均值 ≈ Iout</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">开关频率 fs</label>
            <select
              v-model="fsPreset"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="o in fsOptions" :key="o.key" :value="o.key">{{ o.label }}</option>
            </select>
            <div v-if="fsPreset === 'custom'" class="mt-2">
              <input
                v-model.number="fsCustomKhz"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="自定义开关频率（kHz）"
              />
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">频率越高电感越小，但开关损耗越大</p>
          </div>
        </div>

        <!-- 纹波率滑杆 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground">纹波率 r = ΔI_L / Iout</label>
            <span class="text-sm font-bold text-primary">{{ rPercent }}%</span>
          </div>
          <input
            v-model.number="rPercent"
            type="range"
            min="10"
            max="80"
            step="1"
            class="w-full accent-current"
          />
          <div class="flex justify-between text-xs text-muted-foreground mt-1">
            <span>10%（小纹波，电感偏大）</span>
            <span>20~40% 工程常规</span>
            <span>80%（紧凑，纹波偏大）</span>
          </div>
        </div>

        <!-- 输入校验提示 -->
        <div v-if="inputError" class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-600 dark:text-red-400">
          {{ inputError }}
        </div>

        <!-- 结果区 -->
        <div v-if="buck" class="space-y-4">
          <!-- 推荐感值主卡 -->
          <div class="bg-primary/10 rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">L = (Vin−Vout)×D / (fs×ΔI_L)，ΔI_L = r×Iout</p>
            <p class="text-4xl font-bold text-primary">
              {{ snapL ? fmt(snapL, snapL < 10 ? 1 : 0) : '>1000' }} <span class="text-lg">µH</span>
            </p>
            <p v-if="snapL" class="text-sm text-foreground mt-2 font-medium">
              计算值 {{ fmt(buck.L_uH, 3) }} µH → 吸附 E 系列标准档 {{ fmt(snapL, snapL < 10 ? 1 : 0) }} µH
            </p>
            <p v-else class="text-sm text-foreground mt-2 font-medium">
              计算值 {{ fmt(buck.L_uH, 1) }} µH 已超出常见标准档上限（1000 µH）：建议降低开关频率、增大纹波率或改多相并联
            </p>
            <p v-if="verify" class="text-xs text-muted-foreground mt-1.5">
              回验：选 {{ fmt(snapL, snapL < 10 ? 1 : 0) }} µH 后实际纹波 ΔI_L = {{ fmt(verify.dIL, 3) }} A，实际纹波率 ≈ {{ fmt(verify.rActual * 100, 1) }}%（设计目标 {{ rPercent }}%）
            </p>
          </div>

          <!-- 电流应力三卡 -->
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">峰值电流 I_pk</p>
              <p class="text-sm font-bold text-foreground">{{ fmt(buck.ipk, 2) }} A</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">Iout×(1+r/2)</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">RMS 电流 I_L,rms</p>
              <p class="text-sm font-bold text-foreground">{{ fmt(buck.irms, 2) }} A</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">Iout×√(1+r²/12)</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">占空比 D</p>
              <p class="text-sm font-bold text-foreground">{{ fmt(buck.D * 100, 1) }}%</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">Vout / Vin</p>
            </div>
          </div>

          <!-- 选型提示 -->
          <div class="space-y-2 text-sm">
            <div class="flex justify-between py-1.5 border-b border-border/50">
              <span class="text-muted-foreground">饱和电流校验（防磁饱和）</span>
              <span class="text-foreground font-medium">Isat 需 ≥ 1.2×I_pk = {{ fmt(buck.ipk * 1.2, 2) }} A</span>
            </div>
            <div v-if="verify" class="flex justify-between py-1.5 border-b border-border/50">
              <span class="text-muted-foreground">按选型实际纹波的峰值电流</span>
              <span class="text-foreground font-medium">{{ fmt(verify.ipkActual, 2) }} A（Isat ≥ {{ fmt(verify.ipkActual * 1.2, 2) }} A）</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-border/50">
              <span class="text-muted-foreground">温升电流校验（防过热）</span>
              <span class="text-foreground font-medium">Irms 额定需 ≥ {{ fmt(buck.irms, 2) }} A</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-border/50">
              <span class="text-muted-foreground">CCM/DCM 判定（r=200% 为临界）</span>
              <span :class="buck.ccm ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'" class="font-medium">
                {{ buck.ccm ? 'CCM · 电感电流连续' : '接近临界' }}
              </span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-border/50">
              <span class="text-muted-foreground">临界电感 L_crit（r=200% 时，低于此值进 DCM）</span>
              <span class="text-foreground font-medium">{{ fmt(buck.lCrit_uH, 3) }} µH</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-border/50">
              <span class="text-muted-foreground">输出电容纹波注记 ΔV_out ≈ ESR×ΔI_L</span>
              <span class="text-foreground font-medium">{{ fmt(buck.dIL, 2) }} A × ESR（ESR=50mΩ → {{ fmt(buck.dIL * 0.05 * 1000, 0) }} mV）</span>
            </div>
          </div>

          <!-- 模式注记 -->
          <p class="text-xs text-muted-foreground leading-relaxed">
            判定口径：纹波率 r = ΔI_L / Iout，r = 2（200%）为 CCM/DCM 临界点，r &lt; 2 即 CCM。本工具纹波率滑杆范围为 10~80%，故结果恒为 CCM；实际应用中当负载电流降到 ΔI_L/2 以下（本例约 {{ fmt(buck.dIL / 2, 2) }} A）才会进入 DCM。
          </p>

          <button
            @click="copyResult"
            class="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <Clipboard class="w-3.5 h-3.5" /> 复制计算结果
          </button>
        </div>
        <div v-else class="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          请输入有效的 Vin、Vout、Iout 与开关频率（需满足 Vin &gt; Vout，各值大于 0）。
        </div>

        <!-- Buck 拓扑示意图 -->
        <div class="border-t border-border/50 pt-4">
          <h3 class="text-sm font-medium text-foreground mb-2">Buck 拓扑示意（开关管 → 续流二极管 → 电感 → 输出电容/负载）</h3>
          <svg viewBox="0 0 680 250" class="w-full h-auto" role="img" aria-label="Buck 变换器拓扑示意图，标注电感电流与纹波">
            <defs>
              <marker id="bk-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
              </marker>
            </defs>

            <!-- 主回路走线 -->
            <g class="text-muted-foreground" stroke="currentColor" stroke-width="1.5" fill="none">
              <!-- Vin 正端到开关管上轨 -->
              <polyline points="60,98 60,40 150,40" />
              <!-- 开关管到 SW 节点 -->
              <polyline points="210,40 250,40" />
              <!-- SW 节点向下接二极管 -->
              <polyline points="250,40 250,78" />
              <!-- 二极管下端到地 -->
              <polyline points="250,122 250,180" />
              <!-- 电感到输出 -->
              <polyline points="410,40 470,40" />
              <polyline points="470,40 580,40" />
              <!-- 输出节点向下接电容 -->
              <polyline points="470,40 470,92" />
              <!-- 电容下端到地 -->
              <polyline points="470,112 470,180" />
              <!-- 负载支路 -->
              <polyline points="580,40 580,92" />
              <polyline points="580,140 580,180" />
              <!-- 地线母排与 Vin 负端 -->
              <polyline points="60,126 60,180" />
              <polyline points="60,180 620,180" />
            </g>

            <!-- 输入电压源 -->
            <g class="text-muted-foreground">
              <circle cx="60" cy="112" r="14" fill="none" stroke="currentColor" stroke-width="1.5" />
              <text x="60" y="110" font-size="10" text-anchor="middle" class="fill-current">+</text>
              <text x="60" y="122" font-size="10" text-anchor="middle" class="fill-current">−</text>
              <text x="24" y="117" font-size="12" class="fill-current">Vin</text>
            </g>

            <!-- 开关管 Q1 -->
            <g>
              <rect x="150" y="26" width="60" height="28" rx="4" class="text-primary" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.2" />
              <text x="180" y="44" font-size="11" text-anchor="middle" class="fill-current text-primary" font-weight="bold">Q1 开关管</text>
              <text x="180" y="70" font-size="10" text-anchor="middle" class="fill-current text-muted-foreground">D = {{ buck ? fmt(buck.D * 100, 1) : '—' }}%</text>
            </g>

            <!-- SW 节点标注 -->
            <circle cx="250" cy="40" r="3" class="text-muted-foreground fill-current" />
            <text x="250" y="20" font-size="11" text-anchor="middle" class="fill-current text-muted-foreground">SW</text>

            <!-- 续流二极管（阳极接地侧，导通方向向上） -->
            <g class="text-muted-foreground">
              <polygon points="238,120 262,120 250,96" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.2" />
              <line x1="236" y1="96" x2="264" y2="96" stroke="currentColor" stroke-width="1.5" />
              <text x="282" y="112" font-size="11" class="fill-current">续流二极管</text>
            </g>

            <!-- 电感线圈 -->
            <g class="text-muted-foreground" stroke="currentColor" stroke-width="1.8" fill="none">
              <path d="M250,40 a10,10 0 0 1 20,0 a10,10 0 0 1 20,0 a10,10 0 0 1 20,0 a10,10 0 0 1 20,0 a10,10 0 0 1 20,0 a10,10 0 0 1 20,0 a10,10 0 0 1 20,0 a10,10 0 0 1 20,0" />
            </g>
            <circle cx="250" cy="40" r="3" class="text-muted-foreground fill-current" />
            <circle cx="410" cy="40" r="3" class="text-muted-foreground fill-current" />
            <!-- 电感标注 IL 与 ΔI -->
            <g class="fill-current" text-anchor="middle">
              <text x="330" y="20" font-size="12" class="text-primary" font-weight="bold">
                L = {{ snapL ? fmt(snapL, snapL < 10 ? 1 : 0) : '—' }} µH
              </text>
              <text x="330" y="70" font-size="11" class="text-muted-foreground">
                IL_avg = {{ buck ? fmt(iout, 2) : '—' }} A · ΔI_L = {{ dispDiText }}
              </text>
              <text x="330" y="86" font-size="10" class="text-muted-foreground">
                （纹波率 {{ verify ? fmt(verify.rActual * 100, 1) : (buck ? fmt(rPercent, 0) : '—') }}%）
              </text>
            </g>

            <!-- 电流方向箭头 -->
            <g class="text-muted-foreground" stroke-width="1.5">
              <line x1="104" y1="40" x2="140" y2="40" stroke="currentColor" marker-end="url(#bk-arrow)" />
              <line x1="500" y1="40" x2="540" y2="40" stroke="currentColor" marker-end="url(#bk-arrow)" />
            </g>
            <text x="120" y="30" font-size="10" text-anchor="middle" class="fill-current text-muted-foreground">I_in = D×Iout</text>
            <text x="520" y="30" font-size="10" text-anchor="middle" class="fill-current text-muted-foreground">Iout</text>

            <!-- 输出电容 -->
            <g class="text-muted-foreground" stroke="currentColor" stroke-width="1.8">
              <line x1="452" y1="94" x2="488" y2="94" />
              <line x1="452" y1="110" x2="488" y2="110" />
            </g>
            <text x="500" y="106" font-size="11" class="fill-current text-muted-foreground">Cout</text>

            <!-- 负载 -->
            <g>
              <rect x="566" y="92" width="28" height="48" rx="4" class="text-muted-foreground" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.2" />
              <text x="580" y="120" font-size="10" text-anchor="middle" class="fill-current text-muted-foreground">负载</text>
              <text x="580" y="134" font-size="10" text-anchor="middle" class="fill-current text-muted-foreground">{{ buck ? fmt(iout, 1) + 'A' : '' }}</text>
            </g>

            <!-- Vout 标注 -->
            <text x="636" y="34" font-size="12" class="fill-current text-muted-foreground">Vout</text>
            <text x="636" y="50" font-size="11" class="fill-current text-primary" font-weight="bold">{{ voutValid ? fmt(vout, 1) + 'V' : '—' }}</text>

            <!-- 接地符号 -->
            <g class="text-muted-foreground" stroke="currentColor" stroke-width="1.5">
              <line x1="330" y1="180" x2="330" y2="192" />
              <line x1="312" y1="192" x2="348" y2="192" />
              <line x1="319" y1="198" x2="341" y2="198" />
              <line x1="325" y1="204" x2="335" y2="204" />
            </g>
            <text x="330" y="222" font-size="10" text-anchor="middle" class="fill-current text-muted-foreground">GND</text>
          </svg>
          <p class="text-xs text-muted-foreground mt-1">
            开关闭合时电感充磁（Vin−Vout 施加于 L），开关断开时二极管续流放磁；ΔI_L = (Vin−Vout)×D / (fs×L)。图中标注为选型后的实际值。
          </p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 纹波率参考区间 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Gauge class="w-4 h-4 mr-2 text-primary" /> 纹波率参考区间
          </h2>
          <div class="space-y-2.5 text-sm">
            <div class="flex gap-2.5 items-start">
              <span class="mt-1 w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0"></span>
              <div>
                <p class="text-blue-600 dark:text-blue-400 font-medium">10~20% · 小纹波</p>
                <p class="text-xs text-muted-foreground">输出纹波与峰值电流小，但电感体积、DCR 与成本明显上升，动态响应变慢。</p>
              </div>
            </div>
            <div class="flex gap-2.5 items-start">
              <span class="mt-1 w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></span>
              <div>
                <p class="text-green-600 dark:text-green-400 font-medium">20~40% · 工程常规（推荐）</p>
                <p class="text-xs text-muted-foreground">体积、损耗、纹波与动态性能的折中区间，多数数据手册参考设计取此档。</p>
              </div>
            </div>
            <div class="flex gap-2.5 items-start">
              <span class="mt-1 w-2.5 h-2.5 rounded-full bg-yellow-500 flex-shrink-0"></span>
              <div>
                <p class="text-yellow-600 dark:text-yellow-400 font-medium">40~80% · 紧凑设计</p>
                <p class="text-xs text-muted-foreground">电感小、成本低，但输出纹波大、Cout 的 ESR 压力大、轻载易进 DCM。</p>
              </div>
            </div>
            <div class="flex gap-2.5 items-start">
              <span class="mt-1 w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"></span>
              <div>
                <p class="text-red-600 dark:text-red-400 font-medium">200% · CCM/DCM 临界</p>
                <p class="text-xs text-muted-foreground">r = 2 时电感电流谷值恰好为 0；r &lt; 2 即 CCM，r &gt; 2 为 DCM。</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 标准感值档位 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <ListChecks class="w-4 h-4 mr-2 text-primary" /> 常用标准感值档（µH）
          </h2>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="s in stdL"
              :key="s"
              :class="snapL === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'"
              class="px-2 py-0.5 rounded text-xs font-medium transition"
            >{{ s }}</span>
          </div>
          <p class="text-xs text-muted-foreground mt-3">推荐结果取「≥ 计算值的最小标准档」，吸附后回验实际纹波率，避免漂在两档之间。</p>
        </div>

        <!-- 快速自核示例 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <FlaskConical class="w-4 h-4 mr-2 text-primary" /> 快速自核示例
          </h2>
          <div class="space-y-2">
            <button
              @click="loadExample"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              Vin=12V、Vout=3.3V、Iout=2A、fs=500kHz、r=30% → D=27.5%、ΔI_L=0.6A、L=7.975µH → 吸附 <span class="text-foreground font-medium">10µH</span>（回验实际纹波率 ≈23.9%），I_pk=<span class="text-foreground font-medium">2.3A</span>
            </button>
          </div>
        </div>

        <!-- 免责声明 -->
        <div class="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            本工具管公式与设计空间，具体料号请用厂商选型工具（MPS/Coilcraft/TDK 等）查现货：Isat、Irms、DCR、损耗曲线与降额随批次和工况变化，以厂商数据手册与仿真为准。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>BUCK电感选型计算器原理与用法</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <h3 class="text-lg font-semibold text-foreground">纹波率为什么取 20~40%</h3>
          <p>
            纹波率 r = ΔI_L / Iout 是 Buck 电感设计的核心权衡旋钮。r 取小值（&lt;20%）需要更大的感值：电感体积、绕组电阻 DCR、成本都随感值近似线性上升，且负载阶跃时电感电流变化慢，动态响应变差；r 取大值（&gt;40%）虽然电感更小更便宜，但流进输出电容的纹波电流大，Cout 的 ESR 损耗与输出纹波随之增大，I_pk 也更靠近磁饱和边界。20~40% 恰好是体积、成本、损耗与动态性能的折中点，因此成为数据手册参考设计与多数工程师的默认取值。本工具默认 30%，滑杆范围 10~80%。
          </p>
          <h3 class="text-lg font-semibold text-foreground">CCM 与 DCM：r = 2 是分水岭</h3>
          <p>
            电感电流是在 Iout 上下、幅度 ±ΔI_L/2 的三角波。当 ΔI_L = 2×Iout（即 r = 2，200%）时，电流谷值恰好触零，这就是 CCM（电流连续）/DCM（电流断续）的临界点：r &lt; 2 即 CCM，r &gt; 2 即 DCM。对应存在一个临界电感 L_crit = (Vin−Vout)×D / (2×fs×Iout)，感值低于它必然进 DCM。本工具按满载设计，纹波率滑杆 10~80% 恒为 CCM；但要注意实际负载降低到 ΔI_L/2 以下时会自然进入 DCM——这通常是允许的，只是 DCM 下传递函数改变，补偿网络需按 CCM 设计。
          </p>
          <h3 class="text-lg font-semibold text-foreground">饱和电流 vs 温升电流：两个都要看</h3>
          <p>
            电感数据手册给两个电流额定：Isat（饱和电流）指电感量跌落一定比例（常见 10% 或 30%）时的电流，超了会磁饱和——感值骤降、电流飙升、开关管过流损坏，因此要求 Isat ≥ 1.2×I_pk（1.2 为降额系数，本工具按设计峰值 Iout×(1+r/2) 校验）；Irms（温升电流）指绕组温升达到限定值（常见 40℃）的 RMS 电流，超了只是发热老化而非立即失效，要求 Irms ≥ I_L,rms = Iout×√(1+r²/12)。小电感常常 Isat 先卡死，大电感常常 Irms 先卡死，两个约束都要满足。
          </p>
          <h3 class="text-lg font-semibold text-foreground">感值大了、小了各什么症状</h3>
          <p>
            感值偏大的症状：体积与成本超标、DCR 大导致满载压降与效率劣化、负载阶跃时输出电压跌落更深且恢复更慢（电感电流爬升速率被 Vin−Vout 限死）、Buck 过流保护阈值更难整定。感值偏小的症状：输出纹波与输出电容纹波电流增大、I_pk 逼近开关管限流与电感饱和点、轻载提前进入 DCM、EMI 频谱幅度增大。如果你「算出来 7.9µH 选了 4.7µH 也能用」，代价通常就藏在这些隐性指标里。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么不能只看感值选电感</h3>
          <p>
            感值只决定了纹波率这一个维度。同一感值下，不同料号的 Isat/Irms、DCR、磁芯损耗（与频率和纹波幅度强相关）、屏蔽结构（EMI）、尺寸与价格差异巨大：非屏蔽绕线电感便宜但 EMI 强，一体成型合金电感 EMI 与损耗表现好但成本高；高 fs 下磁芯损耗可能超过铜损成为主要发热源。正确流程是：本工具定感值与电流规格 → 按_Isat ≥ 1.2×I_pk、Irms ≥ I_L,rms、DCR、尺寸、成本过滤 → 用厂商选型工具（MPS/Coilcraft/TDK 等）查现货并核对损耗曲线 → 上板实测温升与纹波。
          </p>
          <h3 class="text-lg font-semibold text-foreground">相关工具</h3>
          <p>
            定好电感电流后，功率回路走线宽度可用 <NuxtLink to="/tools/pcb-trace-width-calculator" class="text-primary hover:underline">PCB线宽载流计算器</NuxtLink> 按 IPC-2221 校核；铜厚 oz 与 mil/mm 的换算见 <NuxtLink to="/tools/copper-thickness-converter" class="text-primary hover:underline">铜厚与线规换算器</NuxtLink>。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">纹波率取多少合适？</span>20~40% 是体积、成本、损耗与动态响应的折中区间；对输出纹波敏感取 20% 上下，对体积成本敏感可到 50~80%，但需复核 Cout ESR 损耗与饱和裕量。</li>
            <li><span class="text-foreground font-medium">Isat 和 Irms 到底看哪个？</span>都要看：Isat 防磁饱和（硬失效，取 ≥1.2×I_pk），Irms 防过热（软失效，取 ≥ I_L,rms），取两者更严的那条作为选型约束。</li>
            <li><span class="text-foreground font-medium">我算出来一定是 CCM 吗？</span>按满载与 10~80% 纹波率设计时恒为 CCM（r &lt; 2）；只有实际负载电流低于 ΔI_L/2 或感值低于 L_crit 时才进 DCM。</li>
            <li><span class="text-foreground font-medium">吸附到标准档后纹波率为什么变了？</span>标准档 ≥ 计算值，感值偏大则实际纹波 ΔI_L = (Vin−Vout)×D/(fs×L) 按比例缩小，本工具在结果卡中给出回验后的实际纹波率。</li>
          </ul>
          <p class="text-xs pt-2 border-t border-border/50">
            本工具管公式与设计空间，具体料号请用厂商选型工具（MPS/Coilcraft/TDK 等）查现货；Isat、Irms、损耗以厂商数据手册为准，本工具为快速估算。
          </p>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'buck-inductor-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { BatteryCharging, Calculator, Gauge, ListChecks, FlaskConical, AlertTriangle, Clipboard, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ===== PURE-FUNCTIONS-START（自核单测直接提取执行，勿在此块引入 Vue/浏览器 API） =====
// 常用标准感值档（µH）
const BUCK_STD_L_UH = [1, 1.5, 2.2, 3.3, 4.7, 6.8, 10, 15, 22, 33, 47, 68, 100, 150, 220, 330, 470, 680, 1000]

// Buck 电感设计核心计算（r 为小数，0.3 = 30%）
function buckDesign({ vin, vout, iout, fs, r }) {
  const D = vout / vin
  const dIL = r * iout // 纹波电流 A
  const L_uH = ((vin - vout) * D) / (fs * dIL) * 1e6
  const ipk = iout * (1 + r / 2) // 峰值电流 A
  const irms = iout * Math.sqrt(1 + (r * r) / 12) // 电感 RMS 电流 A
  const lCrit_uH = ((vin - vout) * D) / (fs * 2 * iout) * 1e6 // r=2 临界电感
  return { D, dIL, L_uH, ipk, irms, lCrit_uH, ccm: r < 2 }
}

// 吸附标准感值档：取 ≥ 计算值的最小档
function buckSnapStd(L_uH) {
  return BUCK_STD_L_UH.find(s => s >= L_uH) ?? null
}

// 按选定感值回验实际纹波
function buckVerifyWithL({ vin, vout, iout, fs, lUH }) {
  const dIL = ((vin - vout) * (vout / vin)) / (fs * lUH * 1e-6)
  return { dIL, rActual: dIL / iout, ipkActual: iout + dIL / 2 }
}
// ===== PURE-FUNCTIONS-END =====

// SEO
useSeoMeta({
  title: 'BUCK电感选型计算器 - Buck 电感感值/纹波/峰值电流在线计算 | Util工具箱',
  description: '在线 BUCK 电感选型计算器：按纹波率法 L=(Vin−Vout)×D/(fs×ΔI_L) 计算感值并吸附标准档回验，输出占空比、纹波电流、峰值电流 I_pk 与饱和电流 1.2 倍校验、RMS 温升电流、CCM/DCM 判定，纯本地计算',
  keywords: 'BUCK电感计算, 电感选型, 纹波率, 纹波电流, 峰值电流, 饱和电流, CCM DCM, 临界电感, buck inductor calculator, 开关电源电感, DC-DC电感计算',
  author: 'Util工具箱',
  ogTitle: 'BUCK电感选型计算器 - Buck 电感感值/纹波/峰值电流在线计算',
  ogDescription: '纹波率法计算 Buck 电感感值，吸附标准档回验，CCM/DCM 判定与峰值电流校验',
  ogUrl: 'https://www.util.cn/tools/buck-inductor-calculator',
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
          name: 'BUCK电感选型计算器',
          url: 'https://www.util.cn/tools/buck-inductor-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['纹波率法感值计算', '标准感值档吸附与回验', '峰值电流与饱和电流校验', 'RMS 温升电流提示', 'CCM/DCM 临界判定', 'Buck 拓扑示意图']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: 'BUCK电感选型计算器', item: 'https://www.util.cn/tools/buck-inductor-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Buck 电感的纹波率取多少合适？',
              acceptedAnswer: { '@type': 'Answer', text: '工程常规取 20~40%，这是电感体积成本与输出纹波、动态响应之间的折中区间；对纹波敏感取 20% 附近，对体积敏感可放宽到 50~80% 并复核输出电容 ESR 损耗。' }
            },
            {
              '@type': 'Question',
              name: '电感的 Isat 和 Irms 分别看哪个？',
              acceptedAnswer: { '@type': 'Answer', text: '两者都要满足：Isat 防磁饱和属硬失效，需 ≥1.2×峰值电流 I_pk=Iout×(1+r/2)；Irms 防绕组过热属软失效，需 ≥ 电感 RMS 电流 Iout×√(1+r²/12)。' }
            },
            {
              '@type': 'Question',
              name: '什么情况下 Buck 会进入 DCM？',
              acceptedAnswer: { '@type': 'Answer', text: '纹波率 r=ΔI_L/Iout 达到 2（200%）为 CCM/DCM 临界；实际负载电流低于 ΔI_L/2，或感值低于临界电感 L_crit=(Vin−Vout)×D/(2×fs×Iout) 时进入 DCM。' }
            },
            {
              '@type': 'Question',
              name: '为什么不能只按感值选电感？',
              acceptedAnswer: { '@type': 'Answer', text: '感值只决定纹波率；还需核对饱和电流、温升电流、DCR、磁芯损耗、屏蔽结构与尺寸成本，同一感值不同料号差异巨大，最终应使用厂商选型工具查现货并实测验证。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'buck-inductor-calculator'
const STORE_KEY = TOOL_ID + ':inputs'
const tool = tools.find(t => t.id === TOOL_ID)

// ---------- 状态 ----------
const vin = ref(12)
const vout = ref(3.3)
const iout = ref(2)
const fsPreset = ref('500k')
const fsCustomKhz = ref(500)
const rPercent = ref(30)

// 交互记录与输入持久化（SSR 安全：localStorage 仅在客户端执行）
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_KEY) : null
    if (raw) {
      const s = JSON.parse(raw)
      if (typeof s.vin === 'number') vin.value = s.vin
      if (typeof s.vout === 'number') vout.value = s.vout
      if (typeof s.iout === 'number') iout.value = s.iout
      if (typeof s.fsPreset === 'string') fsPreset.value = s.fsPreset
      if (typeof s.fsCustomKhz === 'number') fsCustomKhz.value = s.fsCustomKhz
      if (typeof s.rPercent === 'number') rPercent.value = s.rPercent
    }
  } catch (e) { /* 忽略恢复失败 */ }
})

const persist = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      vin: vin.value, vout: vout.value, iout: iout.value,
      fsPreset: fsPreset.value, fsCustomKhz: fsCustomKhz.value, rPercent: rPercent.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}
watch([vin, vout, iout, fsPreset, fsCustomKhz, rPercent], persist)

const fsOptions = [
  { key: '50k', label: '50 kHz', value: 5e4 },
  { key: '100k', label: '100 kHz', value: 1e5 },
  { key: '200k', label: '200 kHz', value: 2e5 },
  { key: '500k', label: '500 kHz', value: 5e5 },
  { key: '1M', label: '1 MHz', value: 1e6 },
  { key: 'custom', label: '自定义…', value: null }
]
const fsMap = {}
for (const o of fsOptions) if (o.value !== null) fsMap[o.key] = o.value

const stdL = BUCK_STD_L_UH

const num = (v) => (typeof v === 'number' && isFinite(v) ? v : NaN)

const fsHz = computed(() => (fsPreset.value === 'custom' ? num(fsCustomKhz.value) * 1e3 : fsMap[fsPreset.value]))
const rRatio = computed(() => num(rPercent.value) / 100)
const voutValid = computed(() => num(vout.value) > 0)

// 输入校验
const inputError = computed(() => {
  const vi = num(vin.value), vo = num(vout.value), io = num(iout.value), fs = num(fsHz.value), r = rRatio.value
  if (!(vi > 0) || !(vo > 0) || !(io > 0) || !(fs > 0)) return ''
  if (vo >= vi) return 'Buck 为降压拓扑，需满足 Vin > Vout；若需升压请使用 Boost 拓扑公式。'
  if (!(r > 0)) return ''
  return ''
})

// ---------- 主计算链 ----------
const buck = computed(() => {
  const vi = num(vin.value), vo = num(vout.value), io = num(iout.value), fs = num(fsHz.value), r = rRatio.value
  if (!(vi > 0) || !(vo > 0) || !(io > 0) || !(fs > 0) || !(r > 0) || vo >= vi) return null
  return buckDesign({ vin: vi, vout: vo, iout: io, fs, r })
})

const snapL = computed(() => (buck.value ? buckSnapStd(buck.value.L_uH) : null))

const verify = computed(() => {
  const vi = num(vin.value), vo = num(vout.value), io = num(iout.value), fs = num(fsHz.value), l = snapL.value
  if (!buck.value || !l || !(vi > 0) || !(vo > 0) || !(io > 0) || !(fs > 0)) return null
  return buckVerifyWithL({ vin: vi, vout: vo, iout: io, fs, lUH: l })
})

// SVG 标注用纹波值：选型后实际值优先，否则设计值
const dispDiText = computed(() => {
  if (verify.value) return fmt(verify.value.dIL, 2) + ' A'
  if (buck.value) return fmt(buck.value.dIL, 2) + ' A'
  return '—'
})

// ---------- 数字格式化（避免浮点尾差，如 7.974999999999999 → 7.975） ----------
const fmt = (v, digits = 2) => {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  return Number(v.toFixed(digits)).toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

// ---------- 交互 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const loadExample = () => {
  vin.value = 12; vout.value = 3.3; iout.value = 2; fsPreset.value = '500k'; rPercent.value = 30
}

const copyResult = async () => {
  if (!buck.value) { alert('当前输入不完整，无法复制'); return }
  const lines = []
  lines.push('【BUCK电感选型】')
  lines.push('Vin=' + fmt(vin.value, 1) + 'V, Vout=' + fmt(vout.value, 1) + 'V, Iout=' + fmt(iout.value, 2) + 'A, fs=' + fmt(fsHz.value / 1e3, 0) + 'kHz, r=' + rPercent.value + '%')
  lines.push('D=' + fmt(buck.value.D * 100, 1) + '%, ΔI_L=' + fmt(buck.value.dIL, 2) + 'A, L计算=' + fmt(buck.value.L_uH, 3) + 'µH')
  if (snapL.value && verify.value) {
    lines.push('选型：' + fmt(snapL.value, snapL.value < 10 ? 1 : 0) + 'µH（回验实际纹波率 ' + fmt(verify.value.rActual * 100, 1) + '%）')
  } else {
    lines.push('选型：超出常见标准档，建议调整频率或纹波率')
  }
  lines.push('I_pk=' + fmt(buck.value.ipk, 2) + 'A（Isat 需 ≥ ' + fmt(buck.value.ipk * 1.2, 2) + 'A）, I_RMS=' + fmt(buck.value.irms, 2) + 'A')
  lines.push('工作模式：' + (buck.value.ccm ? 'CCM' : '接近临界') + '，L_crit=' + fmt(buck.value.lCrit_uH, 3) + 'µH')
  lines.push('—— 来自 Util工具箱·BUCK电感选型计算器')
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    alert('已复制到剪贴板')
  } catch (e) {
    alert('复制失败，请手动选择文本复制')
  }
}
</script>
