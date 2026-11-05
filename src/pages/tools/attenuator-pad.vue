<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sliders class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">衰减器计算器 - π 型 / T 型电阻衰减网络</h1>
          <p class="text-sm text-muted-foreground mt-1">输入系统阻抗与目标衰减量，精算 π 型 / T 型四颗电阻值，E96 吸附回验 + 每颗电阻功率分配</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        射频匹配衰减器设计工具：按 K = 10^(A/20)（电压比口径）精算 50Ω / 75Ω 系统下 π 型（两并联臂 + 一串联臂）
        与 T 型（两串联臂 + 一并联臂）衰减网络的全部电阻值，吸附 E96 标称档后按 ABCD 网络回验实际衰减量与输入回波损耗；
        输入链路最大通过功率可进一步给出每颗电阻承受的功率分配与建议额定档（π 型输入端并联臂吃大头）。
        全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        采用等阻抗匹配口径（源端 = 负载端 = Z0），K 为电压比 10^(A/20)：π 型并联臂 R1 = R3 = Z0×(K+1)/(K−1)、串联臂 R2 = Z0×(K²−1)/(2K)；
        T 型为其对偶网络（串联↔并联、阻抗取倒数关系）。E96 吸附按对数（几何）最近档、同距取低档；
        回验按吸附后电阻的 ABCD 级联矩阵计算实际 S21 衰减与输入回波损耗。
        功率分配按「源端匹配 + 输入额定通过功率」静态口径推导，建议额定 ≥ 2×（长期可靠性 4×）。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 输入与网络 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">系统阻抗 Z0</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  v-for="z in [50, 75]"
                  :key="z"
                  @click="z0 = z"
                  :class="z0 === z ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-sm font-medium transition-all"
                >{{ z }} Ω{{ z === 75 ? '（CATV）' : '（射频）' }}</button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">网络类型</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  v-for="p in padTypes"
                  :key="p.k"
                  @click="padType = p.k"
                  :class="padType === p.k ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-sm font-medium transition-all"
                >{{ p.label }}</button>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="atten-in" class="block text-sm font-medium text-foreground mb-1.5">目标衰减量 A（dB）</label>
              <input
                id="atten-in"
                v-model.number="attenDb"
                type="number"
                step="1"
                min="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 10"
              >
            </div>
            <div>
              <label for="pin-in" class="block text-sm font-medium text-foreground mb-1.5">链路最大通过功率（W，可选）</label>
              <input
                id="pin-in"
                v-model.number="pinW"
                type="number"
                step="0.1"
                min="0"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 10"
              >
              <p class="text-xs text-muted-foreground mt-1">填入后给出每颗电阻的功率分配与额定档建议</p>
            </div>
          </div>

          <!-- 电路示意 -->
          <div class="bg-muted/50 border border-border rounded-lg p-4 flex justify-center">
            <svg v-if="padType === 'pi'" viewBox="0 0 420 130" class="w-full max-w-md" role="img" aria-label="π 型衰减网络电路示意：输入端并联臂 R1、串联臂 R2、输出端并联臂 R3">
              <g stroke="currentColor" class="text-muted-foreground" fill="none" stroke-width="1.5">
                <path d="M10 60 H130" />
                <path d="M190 60 H230" />
                <path d="M230 60 H410" />
                <path d="M70 60 V66 M70 88 V92" />
                <path d="M230 60 V66 M230 88 V92" />
                <path d="M70 92 H230" />
                <path d="M150 92 V98" />
                <path d="M142 98 H158 M146 102 H154 M149 106 H151" />
              </g>
              <g fill="currentColor" class="text-muted-foreground">
                <circle cx="70" cy="60" r="2.5" />
                <circle cx="230" cy="60" r="2.5" />
              </g>
              <g font-family="monospace" font-size="12" fill="currentColor">
                <rect x="130" y="52" width="60" height="16" rx="3" class="fill-green-500/10 stroke-green-500/40" stroke-width="1.5" />
                <text x="160" y="47" text-anchor="middle" class="text-foreground">R2 串联臂</text>
                <rect x="62" y="66" width="16" height="22" rx="3" class="fill-green-500/10 stroke-green-500/40" stroke-width="1.5" />
                <text x="48" y="80" text-anchor="end" class="text-foreground">R1</text>
                <rect x="222" y="66" width="16" height="22" rx="3" class="fill-green-500/10 stroke-green-500/40" stroke-width="1.5" />
                <text x="252" y="80" text-anchor="start" class="text-foreground">R3</text>
                <text x="10" y="52" class="text-foreground">IN</text>
                <text x="410" y="52" text-anchor="end" class="text-foreground">OUT</text>
                <text x="368" y="110" class="text-muted-foreground">Z0 口径：源=负载={{ z0 }}Ω</text>
              </g>
            </svg>
            <svg v-else viewBox="0 0 420 130" class="w-full max-w-md" role="img" aria-label="T 型衰减网络电路示意：输入端串联臂 R1、并联臂 R2、输出端串联臂 R3">
              <g stroke="currentColor" class="text-muted-foreground" fill="none" stroke-width="1.5">
                <path d="M10 60 H60" />
                <path d="M96 60 H208" />
                <path d="M208 60 H320" />
                <path d="M356 60 H410" />
                <path d="M208 60 V66 M208 88 V92" />
                <path d="M208 92 V98" />
                <path d="M200 98 H216 M204 102 H212 M207 106 H209" />
              </g>
              <g fill="currentColor" class="text-muted-foreground">
                <circle cx="208" cy="60" r="2.5" />
              </g>
              <g font-family="monospace" font-size="12" fill="currentColor">
                <rect x="60" y="52" width="36" height="16" rx="3" class="fill-green-500/10 stroke-green-500/40" stroke-width="1.5" />
                <text x="78" y="47" text-anchor="middle" class="text-foreground">R1</text>
                <rect x="320" y="52" width="36" height="16" rx="3" class="fill-green-500/10 stroke-green-500/40" stroke-width="1.5" />
                <text x="338" y="47" text-anchor="middle" class="text-foreground">R3</text>
                <rect x="200" y="66" width="16" height="22" rx="3" class="fill-green-500/10 stroke-green-500/40" stroke-width="1.5" />
                <text x="224" y="80" text-anchor="start" class="text-foreground">R2 并联臂</text>
                <text x="10" y="52" class="text-foreground">IN</text>
                <text x="410" y="52" text-anchor="end" class="text-foreground">OUT</text>
                <text x="368" y="110" class="text-muted-foreground">Z0 口径：源=负载={{ z0 }}Ω</text>
              </g>
            </svg>
          </div>

          <template v-if="padResult">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">{{ armLabel }}</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ fmtOhm(padResult.r1Exact) }}</div>
                <div class="text-xs text-muted-foreground mt-0.5">E96 {{ fmtOhm(padResult.r1Snap) }}（{{ fmtDevPct(padResult.r1Dev) }}）</div>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">{{ midLabel }}</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ fmtOhm(padResult.r2Exact) }}</div>
                <div class="text-xs text-muted-foreground mt-0.5">E96 {{ fmtOhm(padResult.r2Snap) }}（{{ fmtDevPct(padResult.r2Dev) }}）</div>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">{{ armLabel }}（输出端）</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ fmtOhm(padResult.r3Exact) }}</div>
                <div class="text-xs text-muted-foreground mt-0.5">E96 {{ fmtOhm(padResult.r3Snap) }}（{{ fmtDevPct(padResult.r3Dev) }}）</div>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="bg-green-500/5 border border-green-500/30 rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">目标衰减量</div>
                <div class="font-mono text-lg font-semibold text-green-600 dark:text-green-400">{{ fmtNum(attenNum) }} dB</div>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">E96 实际衰减量</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ fmtNum(padResult.attenActual) }} dB</div>
                <div class="text-xs text-muted-foreground mt-0.5">ABCD 回验</div>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">输入回波损耗</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ fmtNum(padResult.rlDb) }} dB</div>
                <div class="text-xs text-muted-foreground mt-0.5">吸附后失配</div>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <div class="text-xs text-muted-foreground mb-1">电压比 K</div>
                <div class="font-mono text-lg font-semibold text-foreground">{{ fmtNum(padResult.k) }}</div>
                <div class="text-xs text-muted-foreground mt-0.5">K = 10^(A/20)</div>
              </div>
            </div>

            <div class="bg-muted/50 border border-border rounded-lg p-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
              <p v-if="padType === 'pi'">
                回验口径：R1 = R3 = Z0×(K+1)/(K−1) = {{ fmtOhm(padResult.r1Exact) }}（并联臂），R2 = Z0×(K²−1)/(2K) = {{ fmtOhm(padResult.r2Exact) }}（串联臂）。
                吸附 E96 后按 ABCD 级联矩阵回验：实际衰减 {{ fmtNum(padResult.attenActual) }} dB（目标 {{ fmtNum(attenNum) }} dB），输入回波损耗 {{ fmtNum(padResult.rlDb) }} dB。
              </p>
              <p v-else>
                回验口径：R1 = R3 = Z0×(K−1)/(K+1) = {{ fmtOhm(padResult.r1Exact) }}（串联臂），R2 = Z0×2K/(K²−1) = {{ fmtOhm(padResult.r2Exact) }}（并联臂）。
                T 型为 π 型的对偶网络（串联臂↔并联臂）。吸附 E96 后按 ABCD 级联矩阵回验：实际衰减 {{ fmtNum(padResult.attenActual) }} dB，输入回波损耗 {{ fmtNum(padResult.rlDb) }} dB。
              </p>
              <p>衰减量相同时 π 型两臂阻抗更高、T 型更对称；同一网络 E96 吸附偏差主要来自中值电阻（±1% 级），对衰减量的影响一般 <0.1 dB。</p>
            </div>
            <div class="flex justify-end">
              <button
                @click="copyPad"
                class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
              >
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
            </div>
          </template>
          <div v-else class="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            输入大于 0 的目标衰减量（dB），计算 {{ z0 }}Ω 系统 {{ padType === 'pi' ? 'π' : 'T' }} 型衰减器电阻值
          </div>
        </div>

        <!-- 电阻功率分配 -->
        <div v-if="powerResult" class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="font-semibold text-foreground">电阻功率分配（通过功率 {{ fmtW(powerResult.pin) }}）</h2>
          <p class="text-xs text-muted-foreground">
            口径：源端匹配、输入 {{ fmtW(powerResult.pin) }} 满功率通过，按网络分流/分压推导的静态分配
            （π 型输入端并联臂吃大头，T 型输入端串联臂吃大头——对偶网络分配比例相同）。
          </p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-4">电阻</th>
                  <th class="py-2 pr-4">位置（{{ padType === 'pi' ? 'π 型' : 'T 型' }}）</th>
                  <th class="py-2 pr-4">承受功率</th>
                  <th class="py-2 pr-4">占比</th>
                  <th class="py-2">建议额定（≥2×）</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border/60">
                  <td class="py-1.5 pr-4 font-mono font-semibold text-foreground">R1</td>
                  <td class="py-1.5 pr-4 text-muted-foreground">输入端 {{ padType === 'pi' ? '并联臂' : '串联臂' }}</td>
                  <td class="py-1.5 pr-4 font-mono text-red-600 dark:text-red-400 font-semibold">{{ fmtW(powerResult.pIn) }}</td>
                  <td class="py-1.5 pr-4 font-mono text-muted-foreground">{{ (powerResult.pIn / powerResult.pin * 100).toFixed(1) }}%</td>
                  <td class="py-1.5 font-mono text-muted-foreground">{{ ratingFor(powerResult.pIn) }}</td>
                </tr>
                <tr class="border-b border-border/60">
                  <td class="py-1.5 pr-4 font-mono font-semibold text-foreground">R2</td>
                  <td class="py-1.5 pr-4 text-muted-foreground">{{ padType === 'pi' ? '串联臂' : '并联臂' }}</td>
                  <td class="py-1.5 pr-4 font-mono text-foreground font-semibold">{{ fmtW(powerResult.pMid) }}</td>
                  <td class="py-1.5 pr-4 font-mono text-muted-foreground">{{ (powerResult.pMid / powerResult.pin * 100).toFixed(1) }}%</td>
                  <td class="py-1.5 font-mono text-muted-foreground">{{ ratingFor(powerResult.pMid) }}</td>
                </tr>
                <tr class="border-b border-border/60">
                  <td class="py-1.5 pr-4 font-mono font-semibold text-foreground">R3</td>
                  <td class="py-1.5 pr-4 text-muted-foreground">输出端 {{ padType === 'pi' ? '并联臂' : '串联臂' }}</td>
                  <td class="py-1.5 pr-4 font-mono text-foreground font-semibold">{{ fmtW(powerResult.pOut) }}</td>
                  <td class="py-1.5 pr-4 font-mono text-muted-foreground">{{ (powerResult.pOut / powerResult.pin * 100).toFixed(1) }}%</td>
                  <td class="py-1.5 font-mono text-muted-foreground">{{ ratingFor(powerResult.pOut) }}</td>
                </tr>
                <tr>
                  <td class="py-1.5 pr-4 text-muted-foreground">负载</td>
                  <td class="py-1.5 pr-4 text-muted-foreground">衰减后输出</td>
                  <td class="py-1.5 pr-4 font-mono text-green-600 dark:text-green-400 font-semibold">{{ fmtW(powerResult.load) }}</td>
                  <td class="py-1.5 pr-4 font-mono text-muted-foreground">{{ (powerResult.load / powerResult.pin * 100).toFixed(1) }}%</td>
                  <td class="py-1.5 text-muted-foreground text-xs">= 通过功率 × 10^(−A/10)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            三颗电阻合计耗散 {{ fmtW(powerResult.pIn + powerResult.pMid + powerResult.pOut) }} = 通过功率 × (1 − 10^(−A/10))，
            其余 {{ fmtW(powerResult.load) }} 送达负载。功率衰减器贵的根源正在这里：R1 需选大功率/无感/低温漂封装（常为平板或绕线电阻），
            额定建议 ≥2×（长期可靠性建议 4×），且三颗电阻阻值温度系数需匹配，否则衰减量随温升漂移。
          </p>
        </div>

        <!-- 等衰减最小衰减量提示 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-2">
          <h2 class="font-semibold text-foreground">最小衰减量约束说明</h2>
          <p class="text-xs leading-relaxed text-muted-foreground">
            本工具实现口径为<strong class="text-foreground">等阻抗匹配衰减器（源端 = 负载端 = Z0）</strong>：
            对任意 A &gt; 0，π 型与 T 型的四颗电阻均为有限正值（A→0 时并联臂→∞、串联臂→0，只是工程上不再有意义），
            因此该口径下<strong class="text-foreground">不存在由 Z0 与 R2&gt;0 引出的理论最小衰减量限制</strong>。
            「最小衰减量（minimum loss pad）」约束出现在源端/负载端阻抗不相等的阻抗变换衰减器中——
            两阻抗不等时网络必须同时完成匹配与衰减，存在由 Z0 与 ZL 决定的损耗下限（如 50Ω→75Ω 约 5.7 dB）。
            实际选型的下限更多来自工程口径：衰减量小于 1 dB 时电阻值对容差极敏感，通常用 0.5/1/2/3/6/10 dB 标准衰减片组合。
          </p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <Lightbulb class="w-4 h-4 mr-2 text-primary" /> 使用要点
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2 leading-relaxed list-disc pl-4">
            <li>π 型两臂阻抗高、便于挂接与测量，是射频面板最常见封装；T 型中值电阻低，适合大功率与低阻系统。</li>
            <li>衰减器必须两端匹配：先确认系统口径（50Ω 射频 / 75Ω CATV）再选电阻，口径错了衰减量与失配全错。</li>
            <li>吸附 E96 后衰减量偏差通常 &lt;0.1 dB，但小衰减量（≤1 dB）时电阻容差影响放大，建议 ±1% 以内精度。</li>
            <li>功率电阻优先无感（金属平板 / 绕线低感）、同批同温漂；R1 承受功率最大，额定 ≥2× 起步，可靠性场景 4×。</li>
            <li>级联两只衰减器总衰减 = 衰减量直接相加（dB 域），失配回损则按网络级联复算。</li>
          </ul>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <CheckCircle class="w-4 h-4 mr-2 text-primary" /> 口径与自检锚点
          </h3>
          <ul class="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <li>• 50Ω / 10 dB π 型：R1=R3 = 96.25 Ω → E96 95.3 Ω，R2 = 71.15 Ω → E96 71.5 Ω，回验衰减 10.07 dB、回损 53.8 dB</li>
            <li>• 50Ω / 6 dB T 型：R1=R3 = 16.61 Ω → E96 16.5 Ω，R2 = 66.93 Ω → E96 66.5 Ω，回验衰减 6.00 dB、回损 52.0 dB</li>
            <li>• 50Ω / 10 dB 功率分配：输入臂 51.9%、中间臂 32.9%、输出臂 5.2%（合计 90%，余 10% 送达负载）</li>
            <li>• 吸附策略：E96 对数最近档，同距取低档</li>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>为什么需要衰减器？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          衰减器（pad）是一只「故意损耗、但两端仍然匹配」的电阻网络，射频工程里主要干四件事：
          ① <strong class="text-foreground">保护接收机</strong>——频谱仪、接收前端在强信号下会过载或烧毁，前置 6~20 dB 衰减是最常规的防呆；
          ② <strong class="text-foreground">改善匹配</strong>——衰减器的回波损耗约等于「2×衰减量 + 10 dB」量级，
          一只 10 dB 衰减器能把源端失配从回损 10 dB 拉到 30 dB，是天线/器件测试的标准「缓冲垫」；
          ③ <strong class="text-foreground">校准电平</strong>——把发射功率精确压到标准测试电平（如传导测试的限值电平）；
          ④ <strong class="text-foreground">稳定放大器</strong>——放大器输入/输出加衰减可以抑制失配引起的增益纹波与自激。
          它的代价是直流/射频功率变成热：衰减量越大、通过功率越大，电阻功率分配越苛刻，这就是功率衰减器体积大、价格高的原因。
          换算衰减前后的绝对电平可用<NuxtLink to="/tools/dbm-watts" class="text-primary hover:underline">dBm 瓦特换算</NuxtLink>核对。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>π 型 vs T 型怎么选？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          两者在等阻抗系统中衰减特性完全等价（互为对偶网络，功率分配比例也相同），选择依据是电阻值分布与工程便利：
          <strong class="text-foreground">π 型</strong>的串联臂居中、两并联臂阻抗较高（如 50Ω/10 dB 时 96.2 Ω），对地挂接、
          与同轴连接器的地结构天然契合，是商品同轴衰减器与 PCB 上最常见的选择；
          <strong class="text-foreground">T 型</strong>的并联臂居中、串联臂阻抗低（50Ω/10 dB 时 26.0 Ω），适合低阻系统与大功率场景——
          低值大功率电阻比高值大功率电阻更容易做到无感与低温漂；衰减量很大时（≥20 dB）π 型的并联臂趋于无穷接近系统阻抗、
          串联臂趋于无穷大，此时常用两只 10 dB π 型级联（衰减 dB 直接相加）代替单只 20 dB，失配与功率应力也更友好。
          另有桥接 T 型（bridged-T），两只臂恒为 Z0，只调并/桥臂，适合可切换步进衰减器。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>功率衰减器为什么贵？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          因为「匹配 + 精度 + 功率」三个约束同时压在几只电阻上：① <strong class="text-foreground">功率密度</strong>——
          50Ω/10 dB 衰减器通过 100 W 时，输入端那颗电阻要独自吃掉约 51.9 W 并在几毫秒内把热散出去，
          商品件用铍氧化铍/氮化铝基板上的薄膜/厚膜电阻阵，热设计与材料成本极高；
          ② <strong class="text-foreground">无感性</strong>——绕线电阻的寄生电感在 GHz 级毁掉匹配，必须用薄膜/平板结构；
          ③ <strong class="text-foreground">温漂与老化</strong>——阻值随温度漂移会直接改变衰减量与回损，
          高端件用同批次溅射膜并做功率老化筛选；④ <strong class="text-foreground">频率上限</strong>——
          从 DC 到 18/40 GHz 都要保持 VSWR&lt;1.2，结构是分布参数设计而非「三颗电阻」。
          所以同衰减量下，2 W 件几十元、100 W 件数千元是常态。自制冷板衰减器时，R1/R2 的额定按本工具分配表 ≥2× 起步选型。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>级联衰减：dB 直接相加</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          多只匹配衰减器级联时，总衰减量就是各只衰减量的代数和：6 dB + 10 dB = 16 dB，
          因为 dB 本就是对数比值，级联即相乘、对数域即相加（与链路预算口径一致，
          可在<NuxtLink to="/tools/dbm-watts" class="text-primary hover:underline">dBm 瓦特换算</NuxtLink>里用链路加减法逐级累计）。
          注意两点：① 每只衰减器自身要匹配，级联后回波损耗由整个网络复算，不能简单相加；
          ② 功率应力逐只递减——信号先过第一只，第一只承受的功率最大，所以级联时把额定功率大的那只放在靠近源端的位置。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">50Ω 系统 10 dB π 型衰减器电阻是多少？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              K = 10^(10/20) ≈ 3.162。π 型并联臂 R1 = R3 = Z0×(K+1)/(K−1) ≈ 96.25 Ω，串联臂 R2 = Z0×(K²−1)/(2K) ≈ 71.15 Ω。
              吸附 E96 取 95.3 Ω / 71.5 Ω，按 ABCD 回验实际衰减约 10.07 dB（S21 = −10.07 dB）。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">π 型和 T 型衰减器电阻公式有什么关系？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              两者互为对偶网络：π 的并联臂公式 Z0×(K+1)/(K−1) 与 T 的串联臂公式 Z0×(K−1)/(K+1) 互为「阻抗取倒数」关系
              （精确说满足 Z_π·Z_T = Z0² 的一一对应），π 的串联臂 Z0×(K²−1)/(2K) 对应对偶后 T 的并联臂 Z0×2K/(K²−1)。
              等阻抗系统中两网络的衰减、匹配与功率分配比例完全相同。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">每颗电阻的额定功率怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              按通过功率 P 与衰减量 A：输入端电阻吃掉约 (K−1)/(K+1)（10 dB 时 51.9%）、中间臂约 2(K−1)/(K(K+1))（32.9%）、
              输出端臂约 5.2%，三颗合计 = P×(1−10^(−A/10))。额定按 ≥2× 实际承受功率起步（长期可靠性建议 4×），
              并选无感、同温漂系列的功率电阻。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">衰减器有最小衰减量限制吗？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              等阻抗匹配口径（源=负载=Z0）下没有：任意 A&gt;0 都有正电阻解。最小衰减量约束只出现在源/负载阻抗不等的
              阻抗变换衰减器（minimum loss pad，如 50Ω↔75Ω 约 5.7 dB 下限）。工程上 A&lt;1 dB 时电阻容差敏感，一般用标准衰减片组合。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :current-tool-id="'attenuator-pad'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Sliders, Info, Lightbulb, CheckCircle, Link as LinkIcon,
  ChevronUp, ChevronDown, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'attenuator-pad'
const STORAGE_KEY = 'attenuator-pad.inputs'

// SEO
useSeoMeta({
  title: '衰减器计算器 - π 型/T 型电阻衰减网络与 E96 吸附回验',
  description: '在线衰减器计算工具：50Ω/75Ω 系统下 π 型与 T 型衰减网络电阻值精算（K=10^(A/20) 口径），E96 标称档吸附、ABCD 网络回验实际衰减与回波损耗，含每颗电阻功率分配与额定功率建议，纯本地计算',
  keywords: '衰减器计算, pi型衰减器, t型衰减器, 衰减电阻计算, attenuator calculator, pi attenuator, t attenuator, 射频衰减, 功率衰减器',
  author: 'Util工具箱',
  ogTitle: '衰减器计算器 - 有条工具',
  ogDescription: 'π 型 / T 型衰减网络电阻精算，E96 吸附回验与电阻功率分配',
  ogUrl: 'https://www.util.cn/tools/attenuator-pad',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '衰减器计算器',
  twitterDescription: 'π/T 型衰减器电阻值计算、E96 吸附回验与功率分配'
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
          name: '衰减器计算器',
          url: 'https://www.util.cn/tools/attenuator-pad',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'π 型衰减网络电阻精算（并联臂 Z0×(K+1)/(K−1)、串联臂 Z0×(K²−1)/(2K)）',
            'T 型对偶网络电阻精算',
            '50Ω/75Ω 系统阻抗切换',
            'E96 标称档吸附与 ABCD 回验（实际衰减 + 回波损耗）',
            '每颗电阻功率分配与额定功率建议'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '衰减器计算器', item: 'https://www.util.cn/tools/attenuator-pad/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '50Ω 系统 10 dB π 型衰减器电阻是多少？',
              acceptedAnswer: { '@type': 'Answer', text: 'K = 10^(10/20) ≈ 3.162；并联臂 R1=R3 = Z0×(K+1)/(K−1) ≈ 96.25 Ω，串联臂 R2 = Z0×(K²−1)/(2K) ≈ 71.15 Ω；吸附 E96 取 95.3 Ω / 71.5 Ω，按 ABCD 回验实际衰减约 10.07 dB（S21 = −10.07 dB）。' }
            },
            {
              '@type': 'Question',
              name: 'π 型和 T 型衰减器电阻公式有什么关系？',
              acceptedAnswer: { '@type': 'Answer', text: '两者互为对偶网络：π 并联臂 Z0×(K+1)/(K−1) 与 T 串联臂 Z0×(K−1)/(K+1) 互为倒数关系，π 串联臂 Z0×(K²−1)/(2K) 对偶为 T 并联臂 Z0×2K/(K²−1)；等阻抗系统中衰减、匹配与功率分配比例完全相同。' }
            },
            {
              '@type': 'Question',
              name: '每颗电阻的额定功率怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '按通过功率 P：输入端电阻约 (K−1)/(K+1)（10 dB 时 51.9%）、中间臂 2(K−1)/(K(K+1))（32.9%）、输出端臂 (K−1)/(K²(K+1))（5.2%），合计 = P×(1−10^(−A/10))；额定按 ≥2× 起步、可靠性场景 4×，选无感同温漂功率电阻。' }
            },
            {
              '@type': 'Question',
              name: '衰减器有最小衰减量限制吗？',
              acceptedAnswer: { '@type': 'Answer', text: '等阻抗匹配口径（源=负载=Z0）下任意 A>0 都有正电阻解，无理论最小衰减量；最小衰减约束仅出现在源/负载阻抗不等的阻抗变换衰减器（如 50Ω↔75Ω 约 5.7 dB 下限）。' }
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
      if (s.z0 === 50 || s.z0 === 75) z0.value = s.z0
      if (s.padType === 'pi' || s.padType === 't') padType.value = s.padType
      if (typeof s.attenDb === 'number' && s.attenDb > 0) attenDb.value = s.attenDb
      if (typeof s.pinW === 'number' && s.pinW >= 0) pinW.value = s.pinW
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})

// __PURE_FNS_START__
// ---------- E96 标称值吸附（IEC 60063，每 decade ×10ⁿ 跨档复用） ----------
const E96 = [10, 10.2, 10.5, 10.7, 11, 11.3, 11.5, 11.8, 12.1, 12.4, 12.7, 13, 13.3, 13.7, 14, 14.3, 14.7, 15, 15.4, 15.8, 16.2, 16.5, 16.9, 17.4, 17.8, 18.2, 18.7, 19.1, 19.6, 20, 20.5, 21, 21.5, 22.1, 22.6, 23.2, 23.7, 24.3, 24.9, 25.5, 26.1, 26.7, 27.4, 28, 28.7, 29.4, 30.1, 30.9, 31.6, 32.4, 33.2, 34, 34.8, 35.7, 36.5, 37.4, 38.3, 39.2, 40.2, 41.2, 42.2, 43.2, 44.2, 45.3, 46.4, 47.5, 48.7, 49.9, 51.1, 52.3, 53.6, 54.9, 56.2, 57.6, 59, 60.4, 61.9, 63.4, 64.9, 66.5, 68.1, 69.8, 71.5, 73.2, 75, 76.8, 78.7, 80.6, 82.5, 84.5, 86.6, 88.7, 90.9, 93.1, 95.3, 97.6]
const norm = (v) => Number(v.toPrecision(12))
// 最近标准值：E96 为等比数列，按对数（几何）距离取最近，同距取较低档
const snapE96 = (target) => {
  let best = null
  let bestDist = Infinity
  for (let k = -3; k <= 7; k++) {
    const f = Math.pow(10, k)
    for (const m of E96) {
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

// ---------- 衰减网络公式（等阻抗匹配口径，K = 10^(A/20) 电压比） ----------
const padK = (aDb) => Math.pow(10, aDb / 20)
// π 型：并联臂（输入/输出）Z0×(K+1)/(K−1)，串联臂 Z0×(K²−1)/(2K)
const piPad = (z0, aDb) => {
  const k = padK(aDb)
  const rShunt = z0 * (k + 1) / (k - 1)
  const rSeries = z0 * (k * k - 1) / (2 * k)
  return { r1: rShunt, r2: rSeries, r3: rShunt }
}
// T 型：π 的对偶网络，串联臂 Z0×(K−1)/(K+1)，并联臂 Z0×2K/(K²−1)
const tPad = (z0, aDb) => {
  const k = padK(aDb)
  const rSeries = z0 * (k - 1) / (k + 1)
  const rShunt = z0 * 2 * k / (k * k - 1)
  return { r1: rSeries, r2: rShunt, r3: rSeries }
}

// ---------- ABCD 级联矩阵 → S 参数回验 ----------
const abcdSeries = (z) => [[1, z], [0, 1]]
const abcdShunt = (z) => [[1, 0], [1 / z, 1]]
const abcdMul = (a, b) => [
  [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
  [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]]
]
const abcdOfPad = (type, r1, r2, r3) => (
  type === 'pi'
    ? abcdMul(abcdMul(abcdShunt(r1), abcdSeries(r2)), abcdShunt(r3))
    : abcdMul(abcdMul(abcdSeries(r1), abcdShunt(r2)), abcdSeries(r3))
)
const sParamsOf = (m, z0) => {
  const d = m[0][0] + m[0][1] / z0 + m[1][0] * z0 + m[1][1]
  return {
    s21: 2 / d,
    s11: (m[0][0] + m[0][1] / z0 - m[1][0] * z0 - m[1][1]) / d
  }
}
const attenDbOf = (s21) => -20 * Math.log10(Math.abs(s21))
const rlDbOf = (s11) => -20 * Math.log10(Math.abs(s11))

// ---------- 电阻功率分配（源端匹配 + 满功率通过，网络分流/分压推导） ----------
// π 与 T 为对偶网络，分配比例相同：输入臂 (K−1)/(K+1)，中间臂 2(K−1)/(K(K+1))，输出臂 (K−1)/(K²(K+1))
const padPowerSplit = (aDb, pinW) => {
  const k = padK(aDb)
  return {
    pin: pinW,
    pIn: pinW * (k - 1) / (k + 1),
    pMid: pinW * 2 * (k - 1) / (k * (k + 1)),
    pOut: pinW * (k - 1) / (k * k * (k + 1)),
    load: pinW / (k * k)
  }
}

// ---------- 额定功率档建议（≥2× 实际功耗） ----------
const RATING_LADDER = [0.25, 0.5, 1, 2, 3, 5, 10, 25, 50, 100]
const ratingFor = (p) => {
  const need = p * 2
  const hit = RATING_LADDER.find(r => r >= need)
  return hit ? hit + ' W' : (Math.ceil(need) + ' W 及以上（多颗串并分摊）')
}

// ---------- 格式化（避免浮点尾差） ----------
const trimZeros = (s) => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s)
const fmtOhm = (v) => {
  if (!isFinite(v) || v <= 0) return '—'
  if (v >= 1e6) return trimZeros((v / 1e6).toPrecision(4)) + ' MΩ'
  if (v >= 1e3) return trimZeros((v / 1e3).toPrecision(4)) + ' kΩ'
  return trimZeros(v.toPrecision(4)) + ' Ω'
}
const fmtW = (p) => {
  if (!isFinite(p)) return '—'
  if (p >= 1) return trimZeros(p.toPrecision(4)) + ' W'
  if (p >= 1e-3) return trimZeros((p * 1e3).toPrecision(4)) + ' mW'
  return trimZeros((p * 1e6).toPrecision(4)) + ' µW'
}
const fmtNum = (v) => (!isFinite(v) ? '—' : trimZeros(Number(v.toPrecision(6)).toString()))
const fmtDevPct = (dev) => (dev >= 0 ? '+' : '') + (dev * 100).toFixed(2) + '%'
// __PURE_FNS_END__

// ---------- 状态 ----------
const padTypes = [
  { k: 'pi', label: 'π 型' },
  { k: 't', label: 'T 型' }
]
const padType = ref('pi')
const z0 = ref(50)
const attenDb = ref(10)
const pinW = ref(1)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const attenNum = computed(() => Number(attenDb.value))
const armLabel = computed(() => padType.value === 'pi' ? 'R1 / R3（并联臂）' : 'R1 / R3（串联臂）')
const midLabel = computed(() => padType.value === 'pi' ? 'R2（串联臂）' : 'R2（并联臂）')

// 计算结果：精算 + E96 吸附 + ABCD 回验
const padResult = computed(() => {
  const z = Number(z0.value)
  const a = Number(attenDb.value)
  if (!(z > 0) || !(a > 0)) return null
  const k = padK(a)
  const net = padType.value === 'pi' ? piPad(z, a) : tPad(z, a)
  const r1Snap = snapE96(net.r1)
  const r2Snap = snapE96(net.r2)
  const r3Snap = snapE96(net.r3)
  const m = abcdOfPad(padType.value, r1Snap, r2Snap, r3Snap)
  const sp = sParamsOf(m, z)
  return {
    k,
    r1Exact: net.r1,
    r2Exact: net.r2,
    r3Exact: net.r3,
    r1Snap,
    r2Snap,
    r3Snap,
    r1Dev: r1Snap / net.r1 - 1,
    r2Dev: r2Snap / net.r2 - 1,
    r3Dev: r3Snap / net.r3 - 1,
    attenActual: attenDbOf(sp.s21),
    rlDb: rlDbOf(sp.s11)
  }
})

// 功率分配
const powerResult = computed(() => {
  const a = Number(attenDb.value)
  const p = Number(pinW.value)
  if (!(a > 0) || !(p > 0)) return null
  return padPowerSplit(a, p)
})

// ---------- 复制结果（clipboard + alert） ----------
const copyText = (text) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制计算结果到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动选择文本复制')
    })
  } else {
    alert('当前环境不支持剪贴板，请手动选择文本复制')
  }
}
const copyPad = () => {
  const r = padResult.value
  if (!r) return
  const a = Number(attenDb.value)
  copyText(`${padType.value === 'pi' ? 'π' : 'T'} 型衰减器：Z0=${z0.value}Ω、A=${fmtNum(a)}dB → R1=R3 精确 ${fmtOhm(r.r1Exact)}（E96 ${fmtOhm(r.r1Snap)}），R2 精确 ${fmtOhm(r.r2Exact)}（E96 ${fmtOhm(r.r2Snap)}），吸附后实际衰减 ${fmtNum(r.attenActual)}dB、输入回损 ${fmtNum(r.rlDb)}dB`)
}

// ---------- 输入持久化（键前缀为工具 id，仅交互回调写入） ----------
watch([padType, z0, attenDb, pinW], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      padType: padType.value,
      z0: z0.value,
      attenDb: attenDb.value,
      pinW: pinW.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
})

// ---------- 相关工具 ----------
const relatedLinks = computed(() => ['dbm-watts', 'eseries-resistor-finder', 'swr-calculator', 'ohms-law-calculator']
  .map((id) => tools.find((t) => t.id === id))
  .filter(Boolean))
</script>
