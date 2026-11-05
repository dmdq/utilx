<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BarChart2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">dBm 瓦特换算 - 射频功率计算工具</h1>
          <p class="text-sm text-muted-foreground mt-1">dBm ↔ W/mW ↔ 50Ω/75Ω 系统 RMS 电压与 Vpp 三向联动，锚点速查表与增益链路加减法</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        以 0 dBm = 1 mW 为基准的射频功率换算器：dBm、瓦特/毫瓦、50Ω（可切 75Ω CATV）系统下的 RMS 电压与峰峰值电压三向联动换算，
        并反向支持「输入功率求 dBm」「输入电压求 dBm」。内置 −20 ~ +50 dBm 锚点速查表与增益链路加减法小算器（信号 + 增益 − 损耗序列 → 末级 dBm），
        用于链路预算、发射功率台账与示波器电压口径核对。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        基准锚点：0 dBm = 1 mW、30 dBm = 1 W、60 dBm = 1 kW（每 +10 dB ×10，每 −10 dB ÷10）。
        电压口径：P = V²/R → V<sub>rms</sub> = √(P×R)，V<sub>pp</sub> = 2√2 × V<sub>rms</sub>（正弦波）；
        默认 R = 50Ω（射频同轴口径），可切换 75Ω（CATV / 有线电视口径）——同一 dBm 在两种阻抗下的电压不同，换算前先确认系统口径。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 三向联动换算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <h2 class="font-semibold text-foreground">三向联动换算</h2>
            <div class="flex items-center gap-1.5 text-xs">
              <span class="text-muted-foreground">系统阻抗：</span>
              <button
                v-for="r in [50, 75]"
                :key="r"
                @click="setR(r)"
                :class="sysR === r ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-2.5 py-1 rounded font-medium transition-all"
              >{{ r }} Ω{{ r === 75 ? '（CATV）' : '（射频）' }}</button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="dbm-in" class="block text-sm font-medium text-foreground mb-1.5">功率电平（dBm）</label>
              <input
                id="dbm-in"
                v-model="dbmIn"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 20"
                @input="recomputeFrom('dbm')"
              >
            </div>
            <div>
              <label for="w-in" class="block text-sm font-medium text-foreground mb-1.5">功率（W）</label>
              <input
                id="w-in"
                v-model="wIn"
                type="number"
                step="0.001"
                min="0"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 0.1（=100 mW）"
                @input="recomputeFrom('w')"
              >
            </div>
            <div>
              <label for="v-in" class="block text-sm font-medium text-foreground mb-1.5">RMS 电压 V<sub>rms</sub>（V）</label>
              <input
                id="v-in"
                v-model="vIn"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 1"
                @input="recomputeFrom('v')"
              >
            </div>
          </div>
          <p class="text-xs text-muted-foreground">任一格输入即反向联动其余两格（输入 W 求 dBm、输入电压求 dBm 均可直接反算）。</p>

          <template v-if="result">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="bg-green-500/5 border border-green-500/30 rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">功率电平</div>
                <div class="font-mono text-lg font-semibold text-green-600 dark:text-green-400">{{ fmtDbm(result.dbm) }}</div>
                <div class="text-xs text-muted-foreground mt-0.5">dBm</div>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">功率（线性值）</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ fmtPower(result.w) }}</div>
                <div class="text-xs text-muted-foreground mt-0.5">= {{ fmtMw(result.mw) }}</div>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">RMS 电压（{{ sysR }}Ω）</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ fmtVolt(result.vrms) }}</div>
                <div class="text-xs text-muted-foreground mt-0.5">V<sub>rms</sub> = √(P×R)</div>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">峰峰值电压</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ fmtVolt(result.vpp) }}</div>
                <div class="text-xs text-muted-foreground mt-0.5">V<sub>pp</sub> = 2√2×V<sub>rms</sub></div>
              </div>
            </div>
            <div class="bg-muted/50 border border-border rounded-lg p-3 text-xs leading-relaxed text-muted-foreground">
              回验：P(W) = 10^(({{ fmtNum(result.dbm) }}−30)/10) = {{ sigNum(result.w) }} W（{{ fmtPower(result.w) }}）；V<sub>rms</sub> = √({{ sigNum(result.w) }} W × {{ sysR }} Ω) = {{ fmtVolt(result.vrms) }}；V<sub>pp</sub> = 2√2 × {{ fmtVolt(result.vrms) }} = {{ fmtVolt(result.vpp) }}。
            </div>
            <div class="flex justify-end">
              <button
                @click="copyMain"
                class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
              >
                <Copy class="w-3.5 h-3.5" /> 复制结果
              </button>
            </div>
          </template>
          <div v-else class="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            输入 dBm、功率（W）或 RMS 电压三者之一开始换算
          </div>
        </div>

        <!-- 锚点速查表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="font-semibold text-foreground">锚点速查表（{{ sysR }}Ω 口径）</h2>
          <p class="text-xs text-muted-foreground">−20 ~ +50 dBm 常用锚点逐行换算；记住 0 dBm = 1 mW，每 +10 dB 功率 ×10、每 +3 dB ×2。</p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-4">dBm</th>
                  <th class="py-2 pr-4">功率（线性值）</th>
                  <th class="py-2 pr-4">V<sub>rms</sub>（{{ sysR }}Ω）</th>
                  <th class="py-2">V<sub>pp</sub>（{{ sysR }}Ω）</th>
                </tr>
              </thead>
              <tbody class="font-mono">
                <tr
                  v-for="row in anchorRows"
                  :key="row.dbm"
                  class="border-b border-border/60 last:border-0"
                >
                  <td class="py-1.5 pr-4 text-foreground font-semibold">{{ row.dbm }} dBm</td>
                  <td class="py-1.5 pr-4 text-muted-foreground">{{ fmtPower(row.w) }}</td>
                  <td class="py-1.5 pr-4 text-muted-foreground">{{ fmtVolt(row.vrms) }}</td>
                  <td class="py-1.5 text-muted-foreground">{{ fmtVolt(row.vpp) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 增益链路加减法小算器 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="font-semibold text-foreground">增益链路加减法小算器</h2>
          <p class="text-xs text-muted-foreground">链路预算口径：末级 dBm = 起始信号 dBm + Σ增益 − Σ损耗（dB 与 dBm 直接加减，级联衰减 dB 相加同理）。</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="chain-start" class="block text-sm font-medium text-foreground mb-1.5">起始信号（dBm）</label>
              <input
                id="chain-start"
                v-model.number="chainStart"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 10"
              >
            </div>
            <div class="flex items-end">
              <button
                @click="addChainRow"
                class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm text-foreground transition"
              >
                <Plus class="w-4 h-4" /> 添加一级增益 / 损耗
              </button>
            </div>
          </div>

          <div v-if="chainRows.length" class="space-y-2">
            <div
              v-for="(row, idx) in chainRows"
              :key="row.id"
              class="flex items-center gap-2"
            >
              <span class="text-xs text-muted-foreground w-12 flex-shrink-0">#{{ idx + 1 }}</span>
              <button
                @click="row.type = row.type === 'gain' ? 'loss' : 'gain'"
                :class="row.type === 'gain'
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'"
                class="px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex-shrink-0"
              >{{ row.type === 'gain' ? '+ 增益' : '− 损耗' }}</button>
              <input
                v-model.number="row.db"
                type="number"
                step="0.5"
                class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="dB"
              >
              <span class="text-xs text-muted-foreground font-mono w-24 text-right flex-shrink-0">→ {{ fmtDbm(chainLevelsArr[idx]) }} dBm</span>
              <button
                @click="removeChainRow(row.id)"
                class="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition flex-shrink-0"
                aria-label="删除该行"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <template v-if="chainResult">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">总增益 / 损耗净值</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ chainNet > 0 ? '+' : '' }}{{ fmtNum(chainNet) }} dB</div>
              </div>
              <div class="bg-green-500/5 border border-green-500/30 rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">末级电平</div>
                <div class="font-mono text-lg font-semibold text-green-600 dark:text-green-400">{{ fmtDbm(chainResult.finalDbm) }} dBm</div>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">末级功率</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ fmtPower(chainResult.finalW) }}</div>
              </div>
            </div>
            <div class="bg-muted/50 border border-border rounded-lg p-3 text-xs leading-relaxed text-muted-foreground">
              <span v-if="chainResult.finalDbm > 30">
                <AlertTriangle class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-yellow-600 dark:text-yellow-400" />
                末级超过 30 dBm（1 W）：核对末级器件的 1 dB 压缩点 P1dB 与功率容量，通常需留 3~6 dB 回退。
              </span>
              <span v-else>
                末级 {{ fmtDbm(chainResult.finalDbm) }} dBm = {{ fmtPower(chainResult.finalW) }}，链路各器件按其实际承受电平核对 P1dB / 功率容量。
              </span>
            </div>
            <div class="flex justify-end">
              <button
                @click="copyChain"
                class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
              >
                <Copy class="w-3.5 h-3.5" /> 复制链路
              </button>
            </div>
          </template>
          <div v-else class="p-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            输入起始电平并添加增益 / 损耗级，逐级累计末级 dBm
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
            <li>记住三个锚点即可心算全表：0 dBm = 1 mW、30 dBm = 1 W、60 dBm = 1 kW；+3 dB ×2、−3 dB ÷2、+10 dB ×10、−10 dB ÷10。</li>
            <li>dBm 只能加减（dB），不能与线性值相乘；链路预算一律在 dBm/dB 域做加减法，最后一步再转瓦特。</li>
            <li>电压换算必须先确认阻抗口径：同 0 dBm 在 50Ω 是 0.224 V<sub>rms</sub>、在 75Ω 是 0.274 V<sub>rms</sub>，示波器读 V<sub>pp</sub> 时再乘 2√2。</li>
            <li>75Ω 口径用于 CATV / 有线电视与部分监控视频链路；Wi-Fi、微波、 amateur radio 同轴系统几乎都是 50Ω。</li>
          </ul>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <CheckCircle class="w-4 h-4 mr-2 text-primary" /> 口径与自检锚点
          </h3>
          <ul class="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <li>• 0 dBm = 1 mW；30 dBm = 1 W；60 dBm = 1 kW</li>
            <li>• 10 dBm = 10 mW；40 dBm = 10 W；−3 dBm = 0.501 mW（≈0.5 mW）</li>
            <li>• 0 dBm @ 50Ω → V<sub>rms</sub> = 0.2236 V，V<sub>pp</sub> = 0.6325 V</li>
            <li>• 0 dBm @ 75Ω → V<sub>rms</sub> = 0.2739 V</li>
            <li>• 换算式：P(W) = 10^((dBm−30)/10)，dBm = 10·lg(P_mW)</li>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>为什么射频工程用 dBm——链路预算的加减法</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          一条射频链路是「发射机 → 线缆 → 滤波器 → 放大器 → 天线」的串级结构，每一级要么贡献增益（dB）、
          要么引入损耗（dB）。功率的线性值（瓦特）在这一串乘除法里会变成 10<sup>±n</sup> 的天文数字或小数，
          而 dBm 把它们全部拉进对数域：瓦特的乘除变成 dB 的加减，一条 20 级的链路预算用一台计算器加减就能算完，
          且每一级的绝对电平（dBm）与相对变化（dB）天然分层——这就是「dBm 与 dB 直接加减」的链路预算口径。
          例如发射机 20 dBm，经 3 dB 线缆损耗、+15 dB 放大器、2 dB 衰减器后：
          20 − 3 + 15 − 2 = 30 dBm = 1 W。级联衰减器的衰减量也是直接相加：
          6 dB + 10 dB 两只衰减器串起来就是 16 dB（参见<NuxtLink to="/tools/attenuator-pad" class="text-primary hover:underline">衰减器计算</NuxtLink>）。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>dB 与 dBm 的区别</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          <strong class="text-foreground">dB 是相对量（比值）</strong>：表示两个功率的比，如「放大器增益 +15 dB」表示输出是输入的 31.6 倍，
          本身不携带任何绝对电平信息；<strong class="text-foreground">dBm 是绝对量</strong>：以 1 mW 为基准的功率电平，
          0 dBm = 1 mW、30 dBm = 1 W，写死了一根「1 mW 的尺子」。两者的关系是「尺子与刻度差」：
          dBm 只能与 dB 相加减得到新的 dBm（30 dBm − 3 dB = 27 dBm），dB 只能与 dB 相加减得到新的 dB（增益串联相加）；
          两个 dBm 相减得到 dB（电平差），两个 dBm 相加则是无意义操作。dBW（以 1 W 为基准）与 dBm 相差整 30 dB。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>50Ω 的来历</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          同轴射频系统选 50Ω 是两个最优的折中：空气介质同轴线的<strong class="text-foreground">耐压最优外/内径比约 60Ω</strong>（b/a = e ≈ 2.718，击穿场强最小），
          而<strong class="text-foreground">传输损耗最小的外/内径比约 30Ω</strong>（b/a ≈ 3.59，考虑铜损与介质损的衰减常数最小）。
          早期工程在「耐功率」与「低损耗」之间取了几何中间值 √(60×30) ≈ 42Ω 附近的工程圆整，最终收敛到 50Ω——
          既兼顾功率容量与损耗，又让聚乙烯（εr ≈ 2.25）填充的实心缆恰好落在 b/a ≈ 2.3 附近便于制造。
          有线电视（CATV）网络系统内容量低、距离长、优先低损耗，于是采用 75Ω 口径（77Ω 是聚乙烯缆的损耗最优点）。
          所以「50Ω 射频 / 75Ω 视频」是历史与工程折中的双口径，换算电压前必须先确认自己在哪个口径里。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>Vpp 与示波器口径</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          示波器屏幕上最容易读到的是<strong class="text-foreground">峰峰值 V<sub>pp</sub></strong>（波形最高点到最低点），
          而功率公式里用的是<strong class="text-foreground">有效值 V<sub>rms</sub></strong>。对正弦波：
          V<sub>rms</sub> = V<sub>pp</sub> / (2√2) ≈ V<sub>pp</sub> / 2.828，反向 V<sub>pp</sub> = 2√2 × V<sub>rms</sub>。
          例：0 dBm @ 50Ω → V<sub>rms</sub> = √(0.001×50) = 0.2236 V，V<sub>pp</sub> = 0.6325 V——示波器上看到约 632 mV 峰峰值的 50Ω 端接正弦波，
          就是 0 dBm。两个易错点：① 示波器默认 1 MΩ 探头高阻接入，读数是「开路电压」；只有用 50Ω 直通端接（或 50Ω 挡）时
          读数才等于同轴线里的行波电压，高阻探头直接探 50Ω 缆会因反射读出约 2 倍电压；② V<sub>pp</sub>/V<sub>rms</sub> = 2√2
          仅对正弦波成立，方波、调制信号的比值（波峰因数）不同，此时应按 RMS 读数或频域功率核对。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">30 dBm 是多少瓦？0 dBm 呢？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              30 dBm = 1 W、0 dBm = 1 mW，中间每 +3 dB ×2：3 dBm = 2 mW、10 dBm = 10 mW、20 dBm = 100 mW。
              换算式 P(W) = 10^((dBm−30)/10)。反向 dBm = 10·lg(P_mW)，例如 5 W = 5000 mW → 10·lg(5000) ≈ 37 dBm。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么用 dBm 而不用瓦特做链路预算？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              因为链路是串级的乘除结构，dBm 把乘除变成加减：末级 dBm = 起始 dBm + Σ增益 − Σ损耗，
              每级器件只需一张「增益/损耗 dB」卡片即可逐级累加；用瓦特则每级都要做一次乘除，数量级横跨 10<sup>−12</sup>~10<sup>2</sup> 极易出错。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">50Ω 和 75Ω 系统电压差多少？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              V<sub>rms</sub> = √(P×R)，电压与阻抗的平方根成正比：√(75/50) ≈ 1.225，即同一 dBm 下 75Ω 口径的 RMS 电压是 50Ω 的 1.225 倍。
              例：0 dBm 在 50Ω 是 0.2236 V<sub>rms</sub>、在 75Ω 是 0.2739 V<sub>rms</sub>。CATV 系统常直接用 dBmV（以 1 mV@75Ω 为基准），
              dBmV = dBm + 48.75（75Ω 口径换算关系）。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">示波器量到的 Vpp 怎么对应 dBm？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              先把 V<sub>pp</sub> 除以 2√2 得 V<sub>rms</sub>（正弦波），再按 P = V²<sub>rms</sub>/R 求功率、dBm = 10·lg(P_mW)。
              例：50Ω 端接、示波器读 2.0 V<sub>pp</sub> → V<sub>rms</sub> = 0.7071 V → P = 0.01 W = 10 mW → 10 dBm。
              注意探头口径：高阻探头读数需确认端接方式，50Ω 直通才是缆内行波电压。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :current-tool-id="'dbm-watts'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  BarChart2, Info, Lightbulb, CheckCircle, Link as LinkIcon,
  ChevronUp, ChevronDown, Copy, AlertTriangle, Plus, Trash2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'dbm-watts'
const STORAGE_KEY = 'dbm-watts.inputs'

// SEO
useSeoMeta({
  title: 'dBm 瓦特换算 - dBm/W/mW/电压三向换算与 50Ω 系统口径',
  description: '在线 dBm 瓦特换算工具：dBm ↔ W/mW ↔ 50Ω/75Ω 系统 RMS 电压与 Vpp 三向联动，反向输入功率或电压求 dBm，内置 −20~+50dBm 锚点速查表与增益链路加减法小算器，纯本地计算',
  keywords: 'dbm换算, dbm to watt, 瓦特换算, dbm to voltage, 射频功率计算, 50欧姆电压, vpp换算, 链路预算, dbm calculator',
  author: 'Util工具箱',
  ogTitle: 'dBm 瓦特换算 - 有条工具',
  ogDescription: 'dBm ↔ W/mW ↔ 50Ω RMS 电压/Vpp 三向联动换算，锚点速查表与链路加减法',
  ogUrl: 'https://www.util.cn/tools/dbm-watts',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'dBm 瓦特换算',
  twitterDescription: 'dBm、瓦特、50Ω 系统 RMS 电压与 Vpp 三向换算，增益链路加减法'
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
          name: 'dBm 瓦特换算',
          url: 'https://www.util.cn/tools/dbm-watts',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'dBm ↔ W/mW 双向换算（0 dBm = 1 mW 基准）',
            '50Ω/75Ω 系统 RMS 电压与 Vpp 换算',
            '反向输入功率或电压求 dBm',
            '−20~+50 dBm 锚点速查表',
            '增益链路加减法小算器（信号+增益−损耗）'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: 'dBm 瓦特换算', item: 'https://www.util.cn/tools/dbm-watts/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '30 dBm 是多少瓦？0 dBm 呢？',
              acceptedAnswer: { '@type': 'Answer', text: '30 dBm = 1 W、0 dBm = 1 mW，每 +3 dB 功率 ×2。换算式 P(W) = 10^((dBm−30)/10)，反向 dBm = 10·lg(P_mW)。例：5 W = 5000 mW ≈ 37 dBm。' }
            },
            {
              '@type': 'Question',
              name: '为什么用 dBm 而不用瓦特做链路预算？',
              acceptedAnswer: { '@type': 'Answer', text: '链路是串级乘除结构，dBm 把功率乘除变成 dB 加减：末级 dBm = 起始 dBm + Σ增益 − Σ损耗，逐级累加即可，避免线性值跨数量级乘除出错。' }
            },
            {
              '@type': 'Question',
              name: '50Ω 和 75Ω 系统电压差多少？',
              acceptedAnswer: { '@type': 'Answer', text: 'Vrms = √(P×R)，与阻抗平方根成正比，√(75/50) ≈ 1.225。同一 0 dBm 在 50Ω 是 0.2236 Vrms、在 75Ω 是 0.2739 Vrms；CATV 常用 dBmV（dBmV = dBm + 48.75）。' }
            },
            {
              '@type': 'Question',
              name: '示波器量到的 Vpp 怎么对应 dBm？',
              acceptedAnswer: { '@type': 'Answer', text: '正弦波 Vpp ÷ 2√2 = Vrms，再按 P = V²rms/R 与 dBm = 10·lg(P_mW) 换算。例：50Ω 端接读 2.0 Vpp → 0.7071 Vrms → 10 mW → 10 dBm。注意高阻探头与 50Ω 端接的口径差异。' }
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
  // 恢复上次输入
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s.sysR === 50 || s.sysR === 75) sysR.value = s.sysR
      if (typeof s.lastField === 'string') lastField.value = s.lastField
      if (typeof s.dbmIn === 'string') dbmIn.value = s.dbmIn
      if (typeof s.wIn === 'string') wIn.value = s.wIn
      if (typeof s.vIn === 'string') vIn.value = s.vIn
      if (typeof s.chainStart === 'number') chainStart.value = s.chainStart
      if (Array.isArray(s.chainRows)) {
        const rows = s.chainRows
          .filter(r => r && (r.type === 'gain' || r.type === 'loss') && isFinite(Number(r.db)))
          .map(r => ({ id: nextRowId(), type: r.type, db: Number(r.db) }))
        chainRows.value = rows.slice(0, 24)
      }
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
  recomputeFrom(lastField.value)
})

// __PURE_FNS_START__
// ---------- 核心换算公式 ----------
// dBm → 瓦特：P(W) = 10^((dBm−30)/10)，0 dBm = 1 mW
const dbmToWatt = (dbm) => Math.pow(10, (dbm - 30) / 10)
// 瓦特 → dBm：dBm = 10·lg(P_mW) = 10·lg(P_W) + 30
const wattToDbm = (w) => 10 * Math.log10(w) + 30
// 功率 → RMS 电压：P = V²/R → Vrms = √(P×R)
const powerToVrms = (pW, ohm) => Math.sqrt(pW * ohm)
// RMS 电压 → 功率：P = V²/R
const vrmsToPower = (vrms, ohm) => (vrms * vrms) / ohm
// RMS 电压 → 峰峰值（正弦波口径）：Vpp = 2√2 × Vrms
const vrmsToVpp = (vrms) => 2 * Math.SQRT2 * vrms
// dBm 直接求 Vpp
const dbmToVpp = (dbm, ohm) => vrmsToVpp(powerToVrms(dbmToWatt(dbm), ohm))

// ---------- 增益链路加减法 ----------
// steps: [{ dir: 1|-1, db }] → 逐级电平数组 + 末级 dBm（dB 与 dBm 直接加减）
const chainLevels = (startDbm, steps) => {
  const levels = []
  let level = startDbm
  for (const s of steps) {
    level = level + (s.dir === -1 ? -Math.abs(s.db) : Math.abs(s.db))
    levels.push(level)
  }
  return { levels, final: level }
}

// ---------- 格式化（避免浮点尾差） ----------
const trimZeros = (s) => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s)
const fmtNum = (v) => {
  if (!isFinite(v)) return '—'
  return trimZeros(Number(v.toPrecision(6)).toString())
}
// 有效数字展开为普通小数（避免科学计数法与浮点尾差）
const sigNum = (x, sig = 6) => {
  if (!isFinite(x) || x === 0) return x === 0 ? '0' : ''
  const exp = Math.floor(Math.log10(Math.abs(x)))
  if (exp >= -12 && exp < 15) {
    const decimals = Math.min(Math.max(sig - 1 - exp, 0), 15)
    return trimZeros(x.toFixed(decimals))
  }
  return x.toExponential(3).replace('e', 'e')
}
const fmtPower = (w) => {
  if (!isFinite(w)) return '—'
  const aw = Math.abs(w)
  if (aw >= 1000) return trimZeros((w / 1000).toPrecision(4)) + ' kW'
  if (aw >= 1) return trimZeros(w.toPrecision(4)) + ' W'
  if (aw >= 1e-3) return trimZeros((w * 1e3).toPrecision(4)) + ' mW'
  return trimZeros((w * 1e6).toPrecision(4)) + ' µW'
}
const fmtMw = (mw) => trimZeros(mw.toPrecision(4)) + ' mW'
const fmtVolt = (v) => {
  if (!isFinite(v)) return '—'
  const av = Math.abs(v)
  if (av >= 1) return trimZeros(v.toPrecision(4)) + ' V'
  if (av >= 1e-3) return trimZeros((v * 1e3).toPrecision(4)) + ' mV'
  return trimZeros((v * 1e6).toPrecision(4)) + ' µV'
}
const fmtDbm = (d) => (!isFinite(d) ? '—' : trimZeros(Number(d.toPrecision(6)).toString()))

// ---------- 锚点速查表 ----------
const ANCHOR_DBM = [-20, -10, 0, 3, 10, 13, 17, 20, 27, 30, 33, 37, 40, 43, 47, 50]
const anchorRow = (dbm, ohm) => {
  const w = dbmToWatt(dbm)
  const vrms = powerToVrms(w, ohm)
  return { dbm, w, mw: w * 1000, vrms, vpp: vrmsToVpp(vrms) }
}
// __PURE_FNS_END__

// ---------- 状态 ----------
const sysR = ref(50)
const lastField = ref('dbm')
const dbmIn = ref('20')
const wIn = ref('')
const vIn = ref('')

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 三向联动：任一字段输入即反算其余两格（事件驱动，无循环回写）
const recomputeFrom = (field) => {
  lastField.value = field
  const R = Number(sysR.value)
  if (field === 'dbm') {
    const d = parseFloat(dbmIn.value)
    if (!isFinite(d)) { wIn.value = ''; vIn.value = ''; return }
    const p = dbmToWatt(d)
    wIn.value = sigNum(p)
    vIn.value = sigNum(powerToVrms(p, R))
  } else if (field === 'w') {
    const w = parseFloat(wIn.value)
    if (!isFinite(w) || w <= 0) {
      dbmIn.value = ''
      vIn.value = ''
      return
    }
    dbmIn.value = sigNum(wattToDbm(w))
    vIn.value = sigNum(powerToVrms(w, R))
  } else {
    const v = parseFloat(vIn.value)
    if (!isFinite(v) || v <= 0) {
      dbmIn.value = ''
      wIn.value = ''
      return
    }
    const p = vrmsToPower(v, R)
    dbmIn.value = sigNum(wattToDbm(p))
    wIn.value = sigNum(p)
  }
}

const setR = (r) => {
  sysR.value = r
  recomputeFrom(lastField.value)
}

// 主换算结果（由当前活跃字段驱动）
const result = computed(() => {
  const R = Number(sysR.value)
  if (lastField.value === 'dbm') {
    const d = parseFloat(dbmIn.value)
    if (!isFinite(d)) return null
    const w = dbmToWatt(d)
    const vrms = powerToVrms(w, R)
    return { dbm: d, w, mw: w * 1000, vrms, vpp: vrmsToVpp(vrms) }
  }
  if (lastField.value === 'w') {
    const w = parseFloat(wIn.value)
    if (!isFinite(w) || w <= 0) return null
    const vrms = powerToVrms(w, R)
    return { dbm: wattToDbm(w), w, mw: w * 1000, vrms, vpp: vrmsToVpp(vrms) }
  }
  const v = parseFloat(vIn.value)
  if (!isFinite(v) || v <= 0) return null
  const w = vrmsToPower(v, R)
  return { dbm: wattToDbm(w), w, mw: w * 1000, vrms: v, vpp: vrmsToVpp(v) }
})

// 锚点表（响应阻抗切换）
const anchorRows = computed(() => ANCHOR_DBM.map((d) => anchorRow(d, Number(sysR.value))))

// ---------- 增益链路 ----------
let rowSeq = 0
const nextRowId = () => ++rowSeq
const chainStart = ref(10)
const chainRows = ref([
  { id: nextRowId(), type: 'gain', db: 10 },
  { id: nextRowId(), type: 'loss', db: 3 }
])

const addChainRow = () => {
  if (chainRows.value.length >= 24) return
  chainRows.value.push({ id: nextRowId(), type: 'gain', db: 6 })
}
const removeChainRow = (id) => {
  chainRows.value = chainRows.value.filter(r => r.id !== id)
}

const chainNet = computed(() => chainRows.value.reduce(
  (s, r) => s + (r.type === 'loss' ? -Math.abs(Number(r.db) || 0) : Math.abs(Number(r.db) || 0)), 0
))

const chainLevelsArr = computed(() => {
  const start = Number(chainStart.value)
  if (!isFinite(start)) return []
  const steps = chainRows.value.map(r => ({ dir: r.type === 'loss' ? -1 : 1, db: Math.abs(Number(r.db) || 0) }))
  return chainLevels(start, steps).levels
})

const chainResult = computed(() => {
  const start = Number(chainStart.value)
  if (!isFinite(start)) return null
  const steps = chainRows.value.map(r => ({ dir: r.type === 'loss' ? -1 : 1, db: Math.abs(Number(r.db) || 0) }))
  const { final } = chainLevels(start, steps)
  return { finalDbm: final, finalW: dbmToWatt(final) }
})

// ---------- 复制结果（clipboard + alert） ----------
const copyText = (text) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制换算结果到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动选择文本复制')
    })
  } else {
    alert('当前环境不支持剪贴板，请手动选择文本复制')
  }
}
const copyMain = () => {
  const r = result.value
  if (!r) return
  copyText(`dBm 换算：${fmtDbm(r.dbm)} dBm = ${fmtPower(r.w)}（${fmtMw(r.mw)}）@ ${sysR.value}Ω → Vrms=${fmtVolt(r.vrms)}、Vpp=${fmtVolt(r.vpp)}`)
}
const copyChain = () => {
  const r = chainResult.value
  if (!r) return
  const parts = chainRows.value.map((row, i) => `${row.type === 'gain' ? '+' : '−'}${Math.abs(Number(row.db) || 0)}dB(→${fmtDbm(chainLevelsArr.value[i])}dBm)`)
  copyText(`链路预算：起始 ${fmtDbm(Number(chainStart.value))} dBm ${parts.join(' ')} = 末级 ${fmtDbm(r.finalDbm)} dBm = ${fmtPower(r.finalW)}`)
}

// ---------- 输入持久化（键前缀为工具 id，仅交互回调写入） ----------
watch([sysR, lastField, dbmIn, wIn, vIn, chainStart, chainRows], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sysR: sysR.value,
      lastField: lastField.value,
      dbmIn: dbmIn.value,
      wIn: wIn.value,
      vIn: vIn.value,
      chainStart: chainStart.value,
      chainRows: chainRows.value.map(r => ({ type: r.type, db: Number(r.db) }))
    }))
  } catch (e) { /* 忽略写入失败 */ }
}, { deep: true })

// ---------- 相关工具 ----------
const relatedLinks = computed(() => ['swr-calculator', 'attenuator-pad', 'ohms-law-calculator']
  .map((id) => tools.find((t) => t.id === id))
  .filter(Boolean))
</script>
