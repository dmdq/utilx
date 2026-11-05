<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BarChart3 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Cpk过程能力计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">短期 Cp/Cpk 与长期 Pp/Ppk 双口径、直方图叠加规格线、Z 值预计不良 PPM</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴数值序列（逗号 / 空格 / 换行宽容解析）或手填 μ/σ，立即得到双口径过程能力指数：
        短期 σ_st 用组内极差 R̄/d₂（分组模式）或 s/c₄ 近似（无分组，注明局限），长期 σ 用全体样本标准差（n−1）；
        单侧规格只算 Cpk/Ppk。直方图 10~15 箱叠加 USL/LSL 规格线（红 dashed）与 μ±3σ 区间，
        按 Cpk &lt;1.0 不足 / 1.0~1.33 有条件 / ≥1.33 充足 / ≥1.67 优秀四档判定，并用正态 CDF（Abramowitz-Stegun 自实现）
        估算两侧预计不良 PPM。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        双口径的含义：短期 σ（组内变差）回答「过程潜力有多大」，长期 σ（全体变差）回答「现在实际干得怎么样」。
        Ppk 显著低于 Cpk 是批次间漂移的信号。测量系统本身要先过关——建议先用
        <NuxtLink to="/tools/grr-msa-calculator" class="text-primary hover:underline">GR&R 测量系统分析</NuxtLink> 确认量具可用。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 模块①：数据输入 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-lg font-semibold flex items-center">
              <Ruler class="w-5 h-5 mr-2 text-primary" /> 数据输入
            </h2>
            <div class="flex items-center gap-1.5">
              <button
                @click="inputMode = 'paste'"
                :class="inputMode === 'paste' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition"
              >粘贴数据</button>
              <button
                @click="inputMode = 'manual'"
                :class="inputMode === 'manual' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition"
              >手填 μ/σ</button>
              <button
                @click="loadDemo"
                class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
              >
                <Sparkles class="w-3.5 h-3.5" /> 载入示例
              </button>
            </div>
          </div>

          <!-- 粘贴模式 -->
          <template v-if="inputMode === 'paste'">
            <textarea
              v-model="pasteText"
              rows="5"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="粘贴数值序列，支持逗号 / 空格 / 换行 / 分号 / 顿号分隔，如：100.2 99.8 100.5 …（按生产时间顺序输入便于分组）"
            ></textarea>
            <p class="text-xs text-muted-foreground">
              已识别 <span class="text-foreground font-medium">{{ values.length }}</span> 个数值<template v-if="invalidTokenCount > 0">（剔除 {{ invalidTokenCount }} 个无法解析的词）</template>
              <button @click="pasteText = ''" class="ml-2 text-muted-foreground hover:text-foreground underline">清空</button>
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="cpk-k" class="block text-sm font-medium text-foreground mb-1.5">每组样本数 k（分组极差法，2~10）</label>
                <select
                  id="cpk-k"
                  v-model.number="groupK"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option v-for="n in 9" :key="n" :value="n + 1">{{ n + 1 }}</option>
                </select>
              </div>
              <div>
                <label for="cpk-m" class="block text-sm font-medium text-foreground mb-1.5">分组数 m（0 = 自动取满）</label>
                <input
                  id="cpk-m"
                  v-model.number="groupM"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="0 = 自动取满"
                >
              </div>
            </div>
            <p v-if="groupRes" class="text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg p-2.5">
              极差法分组：每组 {{ groupRes.k }} 个 × {{ groupRes.groups }} 组，R̄ = {{ fmtNum(groupRes.rbar, 4) }}，
              σ_st = R̄ / d₂({{ groupRes.k }}) = {{ fmtNum(sigmaSt, 4) }}<template v-if="groupRes.dropped > 0">；尾部 {{ groupRes.dropped }} 个不足一组的样本已忽略</template>。
              数据需按生产时间顺序排列，否则组内极差不代表组内变差。
            </p>
            <p v-else class="text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg p-2.5">
              样本不足一组（少于 {{ groupK }} 个）：短期 σ 采用 s/c₄ 近似。局限：全体样本标准差已包含批次间变差，
              会高估组内 σ，使 Cp 与 Pp 几乎相同——建议凑齐按时间顺序的分组数据（推荐 ≥25 组）再用极差法。
            </p>
          </template>

          <!-- 手填模式 -->
          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="cpk-mu" class="block text-sm font-medium text-foreground mb-1.5">过程均值 μ</label>
                <input
                  id="cpk-mu"
                  v-model.number="manualMu"
                  type="number"
                  step="0.001"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 100"
                >
              </div>
              <div>
                <label for="cpk-sigma" class="block text-sm font-medium text-foreground mb-1.5">标准差 σ</label>
                <input
                  id="cpk-sigma"
                  v-model.number="manualSigma"
                  type="number"
                  step="0.001"
                  min="0"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 2"
                >
              </div>
            </div>
            <p class="text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg p-2.5">
              手填 μ/σ 模式只有一个 σ，短期与长期口径相同（Cp = Pp、Cpk = Ppk），无法诊断批次间漂移；
              想做双口径对比请用「粘贴数据」模式并分组。
            </p>
          </template>

          <!-- 规格限 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50">
            <div>
              <label for="cpk-usl" class="block text-sm font-medium text-foreground mb-1.5">USL 上规格限（可留空）</label>
              <input
                id="cpk-usl"
                v-model.number="usl"
                type="number"
                step="0.001"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 106"
              >
            </div>
            <div>
              <label for="cpk-lsl" class="block text-sm font-medium text-foreground mb-1.5">LSL 下规格限（可留空）</label>
              <input
                id="cpk-lsl"
                v-model.number="lsl"
                type="number"
                step="0.001"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 94"
              >
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            规格限可只填一侧（单侧规格场景，如平面度只有上限、强度只有下限）：此时只计算 Cpk/Ppk，Cp/Pp 显示「—」。
          </p>
        </div>

        <!-- 模块②：直方图 -->
        <template v-if="histView">
          <div class="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 class="text-lg font-semibold flex items-center">
              <BarChart3 class="w-5 h-5 mr-2 text-primary" /> 直方图（{{ hist.bins }} 箱，叠加规格线与 μ±3σ）
            </h2>
            <svg :viewBox="'0 0 ' + histView.W + ' ' + histView.H" class="w-full h-auto" role="img" aria-label="数据直方图与规格线">
              <!-- μ±3σ 区间 -->
              <rect
                v-if="histView.bandW > 0"
                :x="histView.bandX1"
                :y="histView.padT"
                :width="histView.bandW"
                :height="histView.plotH"
                fill="currentColor"
                class="text-primary"
                fill-opacity="0.07"
              />
              <line
                v-if="histView.bandW > 0"
                :x1="histView.bandX1" :y1="histView.padT" :x2="histView.bandX1" :y2="histView.baseY"
                stroke="currentColor" class="text-primary" stroke-width="1" stroke-dasharray="3 4" opacity="0.4"
              />
              <line
                v-if="histView.bandW > 0"
                :x1="histView.bandX2" :y1="histView.padT" :x2="histView.bandX2" :y2="histView.baseY"
                stroke="currentColor" class="text-primary" stroke-width="1" stroke-dasharray="3 4" opacity="0.4"
              />
              <!-- 水平网格线 -->
              <g v-for="(gl, i) in histView.gridLines" :key="'g' + i">
                <line
                  :x1="histView.padL" :y1="gl.y" :x2="histView.W - histView.padR" :y2="gl.y"
                  stroke="currentColor" class="text-muted-foreground" stroke-width="1" stroke-dasharray="4 5" opacity="0.3"
                />
                <text :x="histView.padL - 6" :y="gl.y + 3" text-anchor="end" font-size="10" class="fill-current text-muted-foreground">{{ gl.label }}</text>
              </g>
              <!-- 频数柱 -->
              <rect
                v-for="(b, i) in histView.bars"
                :key="'b' + i"
                :x="b.x"
                :y="b.y"
                :width="b.w"
                :height="b.h"
                fill="currentColor"
                :class="b.out ? 'text-red-500' : 'text-primary'"
                fill-opacity="0.8"
              />
              <!-- 基线 -->
              <line
                :x1="histView.padL" :y1="histView.baseY" :x2="histView.W - histView.padR" :y2="histView.baseY"
                stroke="currentColor" class="text-muted-foreground" stroke-width="1"
              />
              <!-- μ 线 -->
              <line
                v-if="histView.muX"
                :x1="histView.muX" :y1="histView.padT" :x2="histView.muX" :y2="histView.baseY"
                stroke="currentColor" class="text-foreground" stroke-width="1.5"
              />
              <text v-if="histView.muX" :x="histView.muX" :y="histView.padT - 4" text-anchor="middle" font-size="10" class="fill-current text-foreground">μ</text>
              <!-- 规格线（红 dashed） -->
              <g v-if="histView.uslX">
                <line
                  :x1="histView.uslX" :y1="histView.padT" :x2="histView.uslX" :y2="histView.baseY"
                  stroke="currentColor" class="text-red-500" stroke-width="1.5" stroke-dasharray="6 4"
                />
                <text :x="histView.uslX" :y="histView.padT - 4" text-anchor="middle" font-size="10" class="fill-current text-red-500">USL {{ fmtNum(uslNum, 2) }}</text>
              </g>
              <g v-if="histView.lslX">
                <line
                  :x1="histView.lslX" :y1="histView.padT" :x2="histView.lslX" :y2="histView.baseY"
                  stroke="currentColor" class="text-red-500" stroke-width="1.5" stroke-dasharray="6 4"
                />
                <text :x="histView.lslX" :y="histView.padT - 4" text-anchor="middle" font-size="10" class="fill-current text-red-500">LSL {{ fmtNum(lslNum, 2) }}</text>
              </g>
              <!-- X 轴刻度 -->
              <g v-for="(tk, i) in histView.ticks" :key="'t' + i">
                <line
                  :x1="tk.x" :y1="histView.baseY" :x2="tk.x" :y2="histView.baseY + 4"
                  stroke="currentColor" class="text-muted-foreground" stroke-width="1"
                />
                <text :x="tk.x" :y="histView.baseY + 15" text-anchor="middle" font-size="10" class="fill-current text-muted-foreground">{{ tk.label }}</text>
              </g>
            </svg>
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-primary inline-block"></span>频数柱</span>
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-red-500 inline-block"></span>完全落在规格外的箱</span>
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-foreground inline-block"></span>μ 线</span>
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-primary/20 inline-block"></span>μ±3σ 区间</span>
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-red-500/40 inline-block"></span>USL / LSL 规格线</span>
            </div>
          </div>
        </template>
        <div v-else-if="inputMode === 'paste' && values.length < 3" class="bg-card border border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
          粘贴至少 3 个数值后自动绘制直方图（10~15 箱）
        </div>

        <!-- 模块③：能力指数结果 -->
        <template v-if="stCap && ltCap">
          <div class="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Calculator class="w-5 h-5 mr-2 text-primary" /> 过程能力指数（双口径）
            </h2>

            <!-- 数据摘要 -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-xs text-muted-foreground">样本数 n</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ inputMode === 'paste' ? values.length : '—' }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-xs text-muted-foreground">过程均值 μ</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ fmtNum(mu, 4) }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-xs text-muted-foreground">短期 σ_st（{{ sigmaStSrcLabel }}）</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ fmtNum(sigmaSt, 4) }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-xs text-muted-foreground">长期 σ_lt（s，n−1）</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ fmtNum(sigmaLt, 4) }}</p>
              </div>
            </div>

            <!-- Cp/Cpk 与 Pp/Ppk -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="rounded-lg p-4 border" :class="stJudgeCls">
                <p class="text-xs text-muted-foreground mb-1">短期（组内）σ_st</p>
                <p class="text-3xl font-bold">Cpk = {{ fmtNum(stCap.cpk, 2) }}</p>
                <p class="text-sm font-medium mt-1">{{ stJudge.label }} — {{ stJudge.desc }}</p>
                <p class="text-xs text-muted-foreground mt-1.5">
                  <template v-if="stCap.hasU && stCap.hasL">Cp = {{ fmtNum(stCap.cp, 2) }}（只看公差宽度，不含偏心）</template>
                  <template v-else>Cp = —（单侧规格下 Cp 无定义，只算 Cpk）</template>
                </p>
              </div>
              <div class="rounded-lg p-4 border" :class="ltJudgeCls">
                <p class="text-xs text-muted-foreground mb-1">长期（全体）σ_lt</p>
                <p class="text-3xl font-bold">Ppk = {{ fmtNum(ltCap.cpk, 2) }}</p>
                <p class="text-sm font-medium mt-1">{{ ltJudge.label }} — {{ ltJudge.desc }}</p>
                <p class="text-xs text-muted-foreground mt-1.5">
                  <template v-if="ltCap.hasU && ltCap.hasL">Pp = {{ fmtNum(ltCap.cp, 2) }}（长期口径的宽度指数）</template>
                  <template v-else>Pp = —（单侧规格下 Pp 无定义，只算 Ppk）</template>
                </p>
              </div>
            </div>

            <!-- 单侧规格说明 -->
            <div v-if="!stCap.hasU || !stCap.hasL" class="flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-lg p-3">
              <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p class="text-xs leading-relaxed text-muted-foreground">
                当前为单侧规格：只计算 Cpk / Ppk 与有规格一侧的 Z 值、预计不良 PPM。Cp / Pp 衡量的是公差带宽度与过程分散的比值，
                单侧规格没有「带宽」概念，因此不定义（显示「—」）。
              </p>
            </div>

            <!-- Ppk vs Cpk 漂移提示 -->
            <div v-if="driftHint" class="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <AlertTriangle class="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <p class="text-xs leading-relaxed text-yellow-700 dark:text-yellow-300">
                Ppk 显著低于 Cpk（差 {{ fmtNum(driftHint.diff, 2) }}）：长期变差明显大于组内变差，批次间存在漂移——
                优先排查换料 / 换班 / 治具磨损、刀具寿命、批次混料等系统性因素，而不是继续收窄组内分布。
              </p>
            </div>

            <!-- Z 值与预计不良 -->
            <div>
              <p class="text-sm font-medium text-foreground mb-2">Z 值与预计不良（正态 CDF：Abramowitz-Stegun 自实现）</p>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-xs text-muted-foreground border-b border-border">
                      <th class="py-2 pr-3 font-medium">口径</th>
                      <th class="py-2 px-3 font-medium">Z_USL = (USL−μ)/σ</th>
                      <th class="py-2 px-3 font-medium">Z_LSL = (μ−LSL)/σ</th>
                      <th class="py-2 pl-3 font-medium text-right">预计不良 PPM</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-border/50">
                      <td class="py-2 pr-3 text-muted-foreground whitespace-nowrap">短期 σ_st</td>
                      <td class="py-2 px-3 font-mono text-foreground">{{ stCap.hasU ? fmtNum(stCap.zU, 3) : '—' }}</td>
                      <td class="py-2 px-3 font-mono text-foreground">{{ stCap.hasL ? fmtNum(stCap.zL, 3) : '—' }}</td>
                      <td class="py-2 pl-3 text-right font-mono font-bold text-foreground">{{ fmtNum(stCap.ppm, 1) }}</td>
                    </tr>
                    <tr>
                      <td class="py-2 pr-3 text-muted-foreground whitespace-nowrap">长期 σ_lt</td>
                      <td class="py-2 px-3 font-mono text-foreground">{{ ltCap.hasU ? fmtNum(ltCap.zU, 3) : '—' }}</td>
                      <td class="py-2 px-3 font-mono text-foreground">{{ ltCap.hasL ? fmtNum(ltCap.zL, 3) : '—' }}</td>
                      <td class="py-2 pl-3 text-right font-mono font-bold text-foreground">{{ fmtNum(ltCap.ppm, 1) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="text-xs text-muted-foreground mt-2 bg-muted/50 border border-border rounded-lg p-2.5">
                PPM = [1−Φ(Z_USL)] × 10⁶ + [1−Φ(Z_LSL)] × 10⁶（未填一侧不计）。预计不良仅在过程稳定且近似正态时有效；
                与实测不良对比可反查分布假设（见 <NuxtLink to="/tools/dppm-yield-calculator" class="text-primary hover:underline">DPPM 良率计算器</NuxtLink> 的实测口径）。
              </p>
            </div>

            <button
              @click="copyResult"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
            >
              <Copy class="w-3.5 h-3.5" /> 复制过程能力结论
            </button>
          </div>
        </template>
        <div v-else class="bg-card border border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
          <template v-if="inputMode === 'paste' && values.length < 2">粘贴至少 2 个数值，并填写至少一侧规格限</template>
          <template v-else-if="inputMode === 'manual' && !(isFinite(Number(manualMu)) && Number(manualSigma) > 0)">填写 μ 与大于 0 的 σ</template>
          <template v-else>填写至少一侧规格限（USL 或 LSL）后自动计算能力指数</template>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 判定档 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <CheckCircle class="w-4 h-4 mr-2 text-primary" /> Cpk 判定档
          </h3>
          <div class="space-y-2">
            <div
              v-for="band in judgeBands"
              :key="band.key"
              class="px-3 py-2 rounded-lg border text-xs leading-relaxed transition"
              :class="stJudge && stJudge.key === band.key ? band.activeCls : 'border-border/60 text-muted-foreground'"
            >
              <p class="font-medium">{{ band.range }}</p>
              <p>{{ band.desc }}</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            当前 Cpk = {{ stCap ? fmtNum(stCap.cpk, 2) : '—' }}，Ppk = {{ ltCap ? fmtNum(ltCap.cpk, 2) : '—' }}，Ppk 同口径分档。
          </p>
        </div>

        <!-- 系数速查 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <Sigma class="w-4 h-4 mr-2 text-primary" /> d₂ / c₄ 系数速查
          </h3>
          <div class="grid grid-cols-3 gap-1.5 text-xs">
            <div
              v-for="n in 9"
              :key="n"
              class="px-2 py-1.5 rounded-lg bg-muted/50 text-center"
              :class="groupK === n + 1 ? 'ring-1 ring-primary' : ''"
            >
              <span class="text-muted-foreground">d₂({{ n + 1 }})</span>
              <span class="block font-mono text-foreground">{{ fmtNum(D2[n + 1], 3) }}</span>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            σ_st = R̄ / d₂（分组极差法，X̄-R 控制图口径）；未分组时 σ_st ≈ s / c₄，
            c₄(n) = √(2/(n−1)) · Γ(n/2) / Γ((n−1)/2)，用 Lanczos 对数伽马自实现（如 c₄(2)=0.7979、c₄(5)=0.9400、c₄(10)=0.9727）。
          </p>
        </div>

        <!-- 相关工具 -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>Cpk 是什么？Cp 与 Cpk 的区别</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          Cp 与 Cpk 都是「过程能力指数」：把过程的分散（6σ）与公差带（USL−LSL）做比较。Cp = (USL−LSL)/(6σ) 只看宽度，
          完全不管均值 μ 停在哪里；Cpk = min(USL−μ, μ−LSL)/(3σ) 同时考虑宽度与偏心，取距离规格中心更近那一侧的「余量」。
          所以 Cp ≥ Cpk 恒成立（双侧规格时），两者差距就是偏心损失：数据分布再瘦，中心偏离规格中心，Cpk 一样掉。
          改善顺序也因此明确：先把 Cpk 提上来（对中、调机），再谈收窄 σ。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>短期 σ 与长期 σ：R̄/d₂ 与样本标准差</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          短期 σ_st 应该只包含「组内」的瞬时变差：分组模式下用各组极差的均值 R̄ 除以 d₂ 系数（σ_st = R̄/d₂，k 为每组样本量，
          d₂(2)=1.128、d₂(3)=1.693、d₂(4)=2.059、d₂(5)=2.326、d₂(6)=2.534、d₂(7)=2.704、d₂(8)=2.847、d₂(9)=2.970、d₂(10)=3.078）。
          长期 σ_lt 就是全体样本标准差（除以 n−1），它额外包含批次间漂移、换料换班、刀具磨损等时间性因素。
          因此 σ_st ≤ σ_lt 恒成立（数据真实分组时）。没有分组数据时，本工具用 s/c₄ 近似短期 σ——但这只是无奈之举：
          全体 s 已经含批次间变差，算出的 Cp 会接近 Pp，失去「潜力 vs 现状」的对比意义，请尽量按时间顺序分组（推荐 25 组以上）。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>1.33 这个门槛从哪来？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          Cpk = 1.33 意味着规格限到 μ 的距离是 4σ（4 ÷ 3 ≈ 1.33）。正态分布下单侧超出 4σ 的概率约 31.7 PPM，
          双侧合计约 63 PPM——「±4σ 过程」是汽车行业（IATF 16949 / AIAG SPC 手册）给供应商定下的通用门槛：
          再留出 1.5σ 的均值漂移余量后，实际不良仍在千分之几量级，成本与风险平衡。
          Cpk = 1.0 对应 ±3σ（双侧约 2,700 PPM），只算勉强能用；Cpk ≥ 1.67（±5σ，双侧约 0.57 PPM）用于安全件与关键特性。
          判定档对应的 PPM 数字可以直接从本工具的「预计不良」列读出。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>单侧规格怎么办？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          平面度、圆度、粗糙度、泄漏率只有上限（USL），拉伸强度、寿命只有下限（LSL）——单侧规格下 Cp/Pp 没有意义
          （公差带不存在），只计算有规格那一侧：Cpk = (USL−μ)/(3σ) 或 (μ−LSL)/(3σ)，Z 值与预计不良也只算该侧。
          本工具允许 USL/LSL 只填一侧，另一侧留空即可，结果区会明确标注「单侧规格」。
          另外多数单侧特性不服从正态（如平面度右偏），此时建议先做正态性检查或做对数变换，再解读 Cpk。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>Cpk 与 Ppk 差异诊断</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          同一组数据：Ppk ≤ Cpk 恒成立（长期 σ 含组内变差）。两者接近（差 &lt; 0.15 左右）说明过程稳定、批次间漂移小；
          Ppk 显著低于 Cpk 则是「组内很稳、批间在漂」的典型信号——逐项排查：换料（来料批次差异）、换班（操作者手法）、
          治具/刀具磨损（随时间的系统性漂移）、温度与环境节律。诊断前先确认测量系统可用：
          <NuxtLink to="/tools/grr-msa-calculator" class="text-primary hover:underline">GR&R 测量系统分析</NuxtLink> 是前置步骤，
          实测不良与预计不良的对比可用 <NuxtLink to="/tools/dppm-yield-calculator" class="text-primary hover:underline">DPPM 良率计算器</NuxtLink>。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">Cpk 1.0 意味着多少不良率？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              Cpk = 1.0 表示规格限距 μ 3σ：正态下单侧超出 3σ 约 1,350 PPM，双侧合计约 2,700 PPM（千分之 2.7）。
              这只是「勉强可用」，量产通常要求 ≥1.33（双侧约 63 PPM）、关键特性 ≥1.67。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">Cp 一样、Cpk 不同说明什么？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              Cp 只由 σ 与公差带宽度决定，σ 没变则 Cp 不变；Cpk 额外受均值位置影响。两组数据 Cp 相同而 Cpk 不同，
              说明分散程度一样但偏心程度不同——Cpk 低的那组均值更靠近规格限。改善动作是「对中」（调机、工装定位），而不是收窄 σ。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么我的 Cp 和 Pp 几乎一样？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              多半是没分组：没有分组数据时短期 σ 只能用全体样本的 s/c₄ 近似，它和长期 σ（同为全体 s）自然几乎相同。
              按「每组 5 个、连续抽取 25 组以上」的时间顺序重新采样分组，Cpk 才能反映组内潜力，与 Ppk 拉开差距。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">算 Cpk 要多少个数据？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              常规推荐：至少 25 个分组 × 每组 4~5 个（约 100~125 个按时间顺序的个体），且过程处于统计受控状态、近似正态。
              数据太少时 σ 的估计波动大，Cpk 的小数点后两位没有意义；单侧或偏态特性先验证正态性再做结论。
            </p>
          </div>
        </div>

        <p class="text-xs text-muted-foreground mt-8 pt-4 border-t border-border/60">
          口径与局限声明：短期 σ 的 s/c₄ 近似仅适用于无分组数据时的粗估；d₂ 表覆盖每组 2~10 个样本；正态 CDF 采用
          Abramowitz-Stegun 近似（误差 ≤1.5×10⁻⁷）。正式过程能力研究以 AIAG SPC 手册与统计软件为准。
        </p>
      </div>
    </div>

    <RelatedTools :currentToolId="'cpk-process-capability'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  BarChart3, Info, Ruler, Calculator, Sigma, CheckCircle, AlertTriangle,
  Copy, Sparkles, ChevronUp, ChevronDown, Link as LinkIcon
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'cpk-process-capability'
const STORAGE_KEY = 'cpk-process-capability.inputs'

// SEO
useSeoMeta({
  title: 'Cpk过程能力在线计算器 - Cp/Cpk、Pp/Ppk、直方图与预计不良PPM | Util工具箱',
  description: '在线 Cpk 计算器：粘贴数据或手填 μ/σ，短期 Cp/Cpk（R̄/d₂ 或 s/c₄）与长期 Pp/Ppk 双口径，直方图叠加 USL/LSL 规格线与 μ±3σ，1.33 判定档、Z 值与预计不良 PPM，纯本地计算',
  keywords: 'cpk计算, cpk计算器, 过程能力指数, cpk与ppk区别, ppk cpk, 直方图, spc分析, 短期长期过程能力, cpk calculator, process capability',
  author: 'Util工具箱',
  ogTitle: 'Cpk过程能力在线计算器',
  ogDescription: '短期 Cp/Cpk 与长期 Pp/Ppk 双口径、直方图叠加规格线、Z 值预计不良 PPM',
  ogUrl: 'https://www.util.cn/tools/cpk-process-capability',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Cpk过程能力在线计算器',
  twitterDescription: 'Cp/Cpk、Pp/Ppk 双口径过程能力分析，直方图与规格线'
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
          name: 'Cpk过程能力在线计算器',
          url: 'https://www.util.cn/tools/cpk-process-capability',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '粘贴数值宽容解析（逗号/空格/换行）或手填 μ/σ',
            '短期 Cp/Cpk：组内极差 R̄/d₂ 或 s/c₄ 近似',
            '长期 Pp/Ppk：全体样本标准差（n−1）',
            '单侧规格只算 Cpk/Ppk',
            'SVG 直方图叠加 USL/LSL 规格线与 μ±3σ 区间',
            'Cpk 1.0/1.33/1.67 四档判定与 Ppk 漂移提示',
            'Z 值与两侧预计不良 PPM（正态 CDF 自实现）'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: 'Cpk过程能力计算器', item: 'https://www.util.cn/tools/cpk-process-capability/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Cpk 1.0 意味着多少不良率？',
              acceptedAnswer: { '@type': 'Answer', text: 'Cpk = 1.0 对应规格限距 μ 3σ，正态下双侧预计不良约 2,700 PPM；量产通用门槛是 Cpk ≥ 1.33（双侧约 63 PPM），关键特性 ≥ 1.67。' }
            },
            {
              '@type': 'Question',
              name: 'Cp 一样、Cpk 不同说明什么？',
              acceptedAnswer: { '@type': 'Answer', text: 'Cp 只看分散（6σ 与公差带宽之比），Cpk 还看均值偏心。Cp 相同而 Cpk 不同，说明 σ 一样但均值位置不同，改善动作是对中而不是收窄 σ。' }
            },
            {
              '@type': 'Question',
              name: '为什么我的 Cp 和 Pp 几乎一样？',
              acceptedAnswer: { '@type': 'Answer', text: '多半是数据没有按时间顺序分组：未分组时短期 σ 只能用全体 s/c₄ 近似，与长期 σ 几乎相同。按每组 5 个、25 组以上重新分组采样即可拉开差距。' }
            },
            {
              '@type': 'Question',
              name: '算 Cpk 要多少个数据？',
              acceptedAnswer: { '@type': 'Answer', text: '常规推荐至少 25 组 × 每组 4~5 个（约 100~125 个按时间顺序的个体），过程受控且近似正态；数据太少时 σ 估计波动大，Cpk 小数点后两位无意义。' }
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
      if (s.inputMode === 'paste' || s.inputMode === 'manual') inputMode.value = s.inputMode
      if (typeof s.pasteText === 'string') pasteText.value = s.pasteText
      if (typeof s.groupK === 'number' && s.groupK >= 2 && s.groupK <= 10) groupK.value = s.groupK
      if (typeof s.groupM === 'number' && s.groupM >= 0) groupM.value = s.groupM
      if (typeof s.manualMu === 'number' && isFinite(s.manualMu)) manualMu.value = s.manualMu
      if (typeof s.manualSigma === 'number' && isFinite(s.manualSigma)) manualSigma.value = s.manualSigma
      if (typeof s.usl === 'number' && isFinite(s.usl)) usl.value = s.usl
      if (typeof s.lsl === 'number' && isFinite(s.lsl)) lsl.value = s.lsl
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})

// __PURE_FNS_START__
// ---------- 过程能力纯函数（无外部依赖） ----------
// d₂ 系数表（AIAG/SPC 手册 X̄-R 口径，每组样本量 2~10，已对照手册核对）
const D2 = { 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078 }

// Lanczos 近似（g=7，9 系数）对数伽马 → c₄(n) = √(2/(n−1)) · Γ(n/2) / Γ((n−1)/2)
const LG_C = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
]
const logGamma = (x) => {
  if (x < 0.5) {
    // 反射公式：Γ(x)Γ(1−x) = π / sin(πx)
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  }
  const xx = x - 1
  let a = LG_C[0]
  const t = xx + 7.5
  for (let i = 1; i < 9; i++) a += LG_C[i] / (xx + i)
  return 0.5 * Math.log(2 * Math.PI) + (xx + 0.5) * Math.log(t) - t + Math.log(a)
}
const c4Of = (n) => {
  const nn = Number(n)
  if (!(nn >= 2)) return NaN
  return Math.sqrt(2 / (nn - 1)) * Math.exp(logGamma(nn / 2) - logGamma((nn - 1) / 2))
}

// 正态 CDF：erf 的 Abramowitz-Stegun 7.1.26 近似（|ε| ≤ 1.5×10⁻⁷）
const normalCdf = (z) => {
  const zz = Number(z)
  if (!isFinite(zz)) return NaN
  if (zz === 0) return 0.5
  const sign = zz < 0 ? -1 : 1
  const x = Math.abs(zz) / Math.SQRT2
  const t = 1 / (1 + 0.3275911 * x)
  const poly = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t
  const y = 1 - poly * Math.exp(-x * x)
  return 0.5 * (1 + sign * y)
}

// 宽容解析：逗号/中文逗号/空格/换行/分号/顿号/制表符
const parseNumbers = (text) => String(text || '')
  .split(/[\s,，;；、]+/)
  .map(s => s.trim())
  .filter(s => s.length > 0)
  .map(Number)
  .filter(v => isFinite(v))

// 基础统计
const meanOf = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length
const stdOf = (arr) => {
  const n = arr.length
  if (n < 2) return NaN
  const m = meanOf(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) * (v - m), 0) / (n - 1))
}

// 短期 σ（分组极差法）：σ_st = R̄ / d₂(k)
// values 按时间顺序排列；mOverride > 0 时只取前 m 组；返回 null 表示无法分组
const sigmaByRange = (values, k, mOverride) => {
  const kk = Number(k)
  if (!values || !values.length || !D2[kk]) return null
  const total = Math.floor(values.length / kk)
  if (total < 1) return null
  let groups = total
  const mNum = Number(mOverride)
  if (isFinite(mNum) && mNum > 0) groups = Math.min(Math.floor(mNum), total)
  let rsum = 0
  for (let g = 0; g < groups; g++) {
    let mn = Infinity
    let mx = -Infinity
    for (let i = g * kk; i < (g + 1) * kk; i++) {
      if (values[i] < mn) mn = values[i]
      if (values[i] > mx) mx = values[i]
    }
    rsum += mx - mn
  }
  const rbar = rsum / groups
  return { sigma: rbar / D2[kk], k: kk, groups, used: groups * kk, dropped: values.length - groups * kk, rbar }
}

// 能力指数核心：μ、σ 与规格限 → Cp/Cpk/Z/PPM
// usl / lsl 传 null 表示该侧未提供（单侧规格）
const capabilityOf = (mu, sigma, usl, lsl) => {
  if (!isFinite(mu) || !(isFinite(sigma) && sigma > 0)) return null
  const hasU = usl !== null && usl !== undefined && isFinite(usl)
  const hasL = lsl !== null && lsl !== undefined && isFinite(lsl)
  if (!hasU && !hasL) return null
  const zU = hasU ? (usl - mu) / sigma : null
  const zL = hasL ? (mu - lsl) / sigma : null
  const cpk = hasU && hasL
    ? Math.min(usl - mu, mu - lsl) / (3 * sigma)
    : (hasU ? (usl - mu) / (3 * sigma) : (mu - lsl) / (3 * sigma))
  const cp = hasU && hasL ? (usl - lsl) / (6 * sigma) : NaN
  const ppmAbove = hasU ? (1 - normalCdf(zU)) * 1e6 : 0
  const ppmBelow = hasL ? (1 - normalCdf(zL)) * 1e6 : 0
  return { cp, cpk, zU, zL, hasU, hasL, ppm: ppmAbove + ppmBelow, ppmAbove, ppmBelow }
}

// Cpk 四档判定：<1.0 不足 / 1.0~1.33 有条件 / 1.33~1.67 充足 / ≥1.67 优秀
const cpkJudge = (v) => {
  if (v === null || v === undefined || !isFinite(v)) return null
  if (v < 1) return { key: 'bad', label: '能力不足', desc: '预计不良偏高，建议全检或过程整改' }
  if (v < 1.33) return { key: 'cond', label: '有条件', desc: '勉强满足规格，需加强监控与抽检' }
  if (v < 1.67) return { key: 'adequate', label: '充足', desc: '过程能力满足要求（通用门槛 1.33）' }
  return { key: 'great', label: '优秀', desc: '能力充裕，可考虑收紧公差或降低成本' }
}

// 直方图分箱：10~15 箱（默认 √n 取整后夹取）；返回 edges/counts
const histogramBins = (values, binCount) => {
  if (!values || values.length < 3) return null
  const n = values.length
  const bins = Math.min(15, Math.max(10, binCount || Math.round(Math.sqrt(n))))
  const mn = Math.min.apply(null, values)
  const mx = Math.max.apply(null, values)
  if (!(mx > mn)) {
    // 常数数据：单箱
    return { bins: 1, edges: [mn - 0.5, mx + 0.5], counts: [n], maxCount: n, min: mn, max: mx }
  }
  const w = (mx - mn) / bins
  const counts = new Array(bins).fill(0)
  for (const v of values) {
    let idx = Math.floor((v - mn) / w)
    if (idx >= bins) idx = bins - 1
    if (idx < 0) idx = 0
    counts[idx]++
  }
  const edges = []
  for (let i = 0; i <= bins; i++) edges.push(mn + i * w)
  return { bins, edges, counts, maxCount: Math.max.apply(null, counts), min: mn, max: mx }
}

// 确定性伪随机（示例数据用，mulberry32 + Box-Muller）
const mulberry32 = (seed) => {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 示例数据：N(100, 2) 的 100 个读数（保留 2 位），对应 USL=106 / LSL=94 时理论 Cpk = 1.0
const generateCpkDemo = (seed, n, mu, sigma) => {
  const rnd = mulberry32(seed === undefined ? 20261105 : seed)
  let spare = null
  const gauss = () => {
    if (spare !== null) { const s = spare; spare = null; return s }
    let u = 0
    let v = 0
    while (u === 0) u = rnd()
    while (v === 0) v = rnd()
    const mag = Math.sqrt(-2 * Math.log(u))
    spare = mag * Math.sin(2 * Math.PI * v)
    return mag * Math.cos(2 * Math.PI * v)
  }
  const count = n || 100
  const center = mu === undefined ? 100 : mu
  const sd = sigma === undefined ? 2 : sigma
  const out = []
  for (let i = 0; i < count; i++) {
    out.push(Math.round((center + gauss() * sd) * 100) / 100)
  }
  return out.join(', ')
}

// 空 / 非法输入 → null（保留合法的 0）
const numOrNull = (v) => {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return isFinite(n) ? n : null
}

// 展示格式化（先按位数四舍五入，避免浮点尾差）
const fmtNum = (v, digits) => {
  if (v === null || v === undefined || !isFinite(v)) return '—'
  const d = digits === undefined ? 4 : digits
  const m = Math.pow(10, d)
  return String(Math.round(v * m) / m)
}
// __PURE_FNS_END__

// ---------- 状态 ----------
const inputMode = ref('paste')
const pasteText = ref('')
const groupK = ref(5)
const groupM = ref('')
const manualMu = ref(100)
const manualSigma = ref(2)
const usl = ref('')
const lsl = ref('')

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 输入持久化（键前缀为工具 id）
watch([inputMode, pasteText, groupK, groupM, manualMu, manualSigma, usl, lsl], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      inputMode: inputMode.value,
      pasteText: pasteText.value,
      groupK: groupK.value,
      groupM: groupM.value,
      manualMu: manualMu.value,
      manualSigma: manualSigma.value,
      usl: usl.value,
      lsl: lsl.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}, { deep: true })

const loadDemo = () => {
  inputMode.value = 'paste'
  pasteText.value = generateCpkDemo()
  groupK.value = 5
  groupM.value = ''
  // 已知 μ=100、σ=2、USL=106 / LSL=94 → 理论 Cpk = 1.0
  usl.value = 106
  lsl.value = 94
}

// ---------- 解析与统计 ----------
const values = computed(() => (inputMode.value === 'paste' ? parseNumbers(pasteText.value) : []))
const invalidTokenCount = computed(() => {
  if (inputMode.value !== 'paste') return 0
  const tokens = String(pasteText.value || '').split(/[\s,，;；、]+/).map(s => s.trim()).filter(s => s.length > 0)
  return tokens.filter(s => !isFinite(Number(s))).length
})

const uslNum = computed(() => numOrNull(usl.value))
const lslNum = computed(() => numOrNull(lsl.value))

const mu = computed(() => {
  if (inputMode.value === 'manual') return Number(manualMu.value)
  return values.value.length >= 2 ? meanOf(values.value) : NaN
})
const sigmaLt = computed(() => {
  if (inputMode.value === 'manual') return Number(manualSigma.value)
  return values.value.length >= 2 ? stdOf(values.value) : NaN
})
const groupRes = computed(() => {
  if (inputMode.value !== 'paste') return null
  return sigmaByRange(values.value, groupK.value, groupM.value)
})
const sigmaSt = computed(() => {
  if (inputMode.value === 'manual') return sigmaLt.value
  if (groupRes.value && isFinite(groupRes.value.sigma) && groupRes.value.sigma > 0) return groupRes.value.sigma
  const n = values.value.length
  if (n >= 2 && isFinite(sigmaLt.value) && sigmaLt.value > 0) return sigmaLt.value / c4Of(n)
  return NaN
})
const sigmaStSrcLabel = computed(() => {
  if (inputMode.value === 'manual') return '手填 σ'
  if (groupRes.value && sigmaSt.value === groupRes.value.sigma) return 'R̄/d₂'
  return 's/c₄ 近似'
})

// ---------- 能力指数 ----------
const stCap = computed(() => capabilityOf(mu.value, sigmaSt.value, uslNum.value, lslNum.value))
const ltCap = computed(() => capabilityOf(mu.value, sigmaLt.value, uslNum.value, lslNum.value))

const stJudge = computed(() => cpkJudge(stCap.value ? stCap.value.cpk : NaN))
const ltJudge = computed(() => cpkJudge(ltCap.value ? ltCap.value.cpk : NaN))

const judgeClsMap = {
  bad: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
  cond: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
  adequate: 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300',
  great: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
}
const judgeBands = [
  { key: 'bad', range: 'Cpk < 1.0', desc: '能力不足：预计不良偏高，建议全检或过程整改', activeCls: judgeClsMap.bad },
  { key: 'cond', range: '1.0 ≤ Cpk < 1.33', desc: '有条件：勉强满足规格，加强监控与抽检', activeCls: judgeClsMap.cond },
  { key: 'adequate', range: '1.33 ≤ Cpk < 1.67', desc: '充足：满足通用要求（汽车行业 1.33）', activeCls: judgeClsMap.adequate },
  { key: 'great', range: 'Cpk ≥ 1.67', desc: '优秀：能力充裕，可考虑收紧公差或降本', activeCls: judgeClsMap.great }
]
const stJudgeCls = computed(() => (stJudge.value ? judgeClsMap[stJudge.value.key] : ''))
const ltJudgeCls = computed(() => (ltJudge.value ? judgeClsMap[ltJudge.value.key] : ''))

// Ppk 显著低于 Cpk → 批次间漂移提示（差 ≥ 0.15 视为显著）
const driftHint = computed(() => {
  if (!stCap.value || !ltCap.value) return null
  const diff = stCap.value.cpk - ltCap.value.cpk
  if (isFinite(diff) && diff >= 0.15) return { diff }
  return null
})

// ---------- 直方图 ----------
const hist = computed(() => histogramBins(values.value))
const histView = computed(() => {
  if (!hist.value) return null
  const { edges, counts, maxCount } = hist.value
  const W = 640
  const H = 280
  const padL = 48
  const padR = 16
  const padT = 22
  const padB = 34
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const baseY = padT + plotH

  // 域：数据范围 ∪ 规格限 ∪ μ±3σ
  let lo = edges[0]
  let hi = edges[edges.length - 1]
  const muV = mu.value
  const sigLt = sigmaLt.value
  if (uslNum.value !== null) {
    lo = Math.min(lo, uslNum.value)
    hi = Math.max(hi, uslNum.value)
  }
  if (lslNum.value !== null) {
    lo = Math.min(lo, lslNum.value)
    hi = Math.max(hi, lslNum.value)
  }
  if (isFinite(muV) && isFinite(sigLt) && sigLt > 0) {
    lo = Math.min(lo, muV - 3 * sigLt)
    hi = Math.max(hi, muV + 3 * sigLt)
  }
  if (!(hi > lo)) { lo -= 1; hi += 1 }
  const pad = (hi - lo) * 0.04
  lo -= pad
  hi += pad

  const xOf = (v) => padL + ((v - lo) / (hi - lo)) * plotW
  const yOf = (c) => padT + plotH - (c / maxCount) * plotH

  const bars = counts.map((c, i) => {
    const x0 = edges[i]
    const x1 = edges[i + 1]
    const bx = xOf(x0)
    const bx1 = xOf(x1)
    const out = (uslNum.value !== null && x0 >= uslNum.value) || (lslNum.value !== null && x1 <= lslNum.value)
    return { x: bx, w: Math.max(1, bx1 - bx - 1.5), y: yOf(c), h: baseY - yOf(c), out }
  })

  // 水平网格线
  const gridLines = []
  const marks = [maxCount, Math.floor(maxCount / 2)]
  const seen = new Set()
  for (const c of marks) {
    if (c > 0 && !seen.has(c)) {
      seen.add(c)
      gridLines.push({ y: yOf(c), label: String(c) })
    }
  }

  // μ±3σ 区间（夹取到绘图区）
  let bandX1 = 0
  let bandX2 = 0
  if (isFinite(muV) && isFinite(sigLt) && sigLt > 0) {
    bandX1 = Math.max(padL, xOf(muV - 3 * sigLt))
    bandX2 = Math.min(padL + plotW, xOf(muV + 3 * sigLt))
  }
  const bandW = Math.max(0, bandX2 - bandX1)

  // X 轴刻度
  const ticks = []
  for (let i = 0; i < 5; i++) {
    const v = lo + (hi - lo) * i / 4
    ticks.push({ x: xOf(v), label: fmtNum(v, 2) })
  }

  return {
    W, H, padL, padR, padT, plotH, baseY,
    bars, gridLines,
    bandX1, bandX2, bandW,
    muX: isFinite(muV) ? xOf(muV) : null,
    uslX: uslNum.value !== null ? xOf(uslNum.value) : null,
    lslX: lslNum.value !== null ? xOf(lslNum.value) : null,
    ticks
  }
})

const copyResult = () => {
  if (!stCap.value || !ltCap.value) return
  const st = stCap.value
  const lt = ltCap.value
  const lines = [
    '过程能力分析（双口径）',
    `n = ${inputMode.value === 'paste' ? values.value.length : '—'}，μ = ${fmtNum(mu.value, 4)}`,
    `短期 σ_st = ${fmtNum(sigmaSt.value, 4)}（${sigmaStSrcLabel.value}）→ Cp = ${fmtNum(st.cp, 2)}，Cpk = ${fmtNum(st.cpk, 2)}（${stJudge.value ? stJudge.value.label : '—'}）`,
    `长期 σ_lt = ${fmtNum(sigmaLt.value, 4)}（s, n−1）→ Pp = ${fmtNum(lt.cp, 2)}，Ppk = ${fmtNum(lt.cpk, 2)}（${ltJudge.value ? ltJudge.value.label : '—'}）`,
    `Z_USL = ${st.hasU ? fmtNum(st.zU, 3) : '—'}，Z_LSL = ${st.hasL ? fmtNum(st.zL, 3) : '—'}`,
    `预计不良 PPM：短期 ${fmtNum(st.ppm, 1)}，长期 ${fmtNum(lt.ppm, 1)}`,
    driftHint.value ? `注意：Ppk 显著低于 Cpk（差 ${fmtNum(driftHint.value.diff, 2)}），批次间存在漂移` : 'Ppk 与 Cpk 差异未达显著（<0.15）'
  ]
  const text = lines.join('\n')
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制过程能力结论到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动选择文本复制')
    })
  } else {
    alert('当前环境不支持剪贴板，请手动选择文本复制')
  }
}

// ---------- 相关工具 ----------
const relatedLinks = computed(() => ['grr-msa-calculator', 'dppm-yield-calculator', 'aql-sampling-calculator']
  .map(id => tools.find(t => t.id === id))
  .filter(Boolean))
</script>
