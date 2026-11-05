<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <PlugZap class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">保险丝选型计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">UL / IEC 双口径额定电流、温度降额折算、浪涌 I²t 校验与快断/慢断指引四步流程</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        四步算清保险丝选型：① 额定电流——工作电流按 UL（In ≥ I/0.75）与 IEC（In ≥ I）双口径放大，叠加环境温度降额后吸附常见额定档；
        ② 脉冲 I²t 校验——矩形 / 指数两种波形口径算浪涌 I²t，对比公称熔化 I²t 与可调裕量系数，给通过判定与裕量；
        ③ 快断/慢断指引——按负载类型对照静态决策卡，附方向选错的两个典型症状；④ 校验清单——分断能力、额定电压、认证口径、换件不放大四项确认。
        全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        选型结论为工程估算，正式设计以保险丝厂商 datasheet 与安规要求为准；UL 248 与 IEC 60127/60269 口径不要混用替换。
        自核锚点：10 A×10 ms 矩形波 → I²t = 1 A²s；I_peak = 20 A、τ = 5 ms 指数波 → 20²×0.005/2 = 1 A²s；I = 3 A 时 UL 口径需求恰为 4 A。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主流程区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 第一步：额定电流与温度降额 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Zap class="w-5 h-5 mr-2 text-primary" /> 第一步 · 额定电流与温度降额
            </h2>
            <span class="text-xs text-muted-foreground">步骤 1 / 4</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="fs-i" class="block text-sm font-medium text-foreground mb-1.5">工作电流 I（A）</label>
              <input
                id="fs-i"
                v-model.number="workI"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 3"
              >
            </div>
            <div>
              <label for="fs-t" class="block text-sm font-medium text-foreground mb-1.5">环境温度 T（℃）</label>
              <input
                id="fs-t"
                v-model.number="envT"
                type="number"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 40"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">降额速率（每 10℃）</label>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="r in derateRates"
                  :key="r"
                  @click="derateRate = r"
                  :class="derateRate === r ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-sm font-medium transition-all"
                >{{ r }}%</button>
              </div>
            </div>
          </div>

          <template v-if="step1Valid">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="bg-primary/10 rounded-lg p-4">
                <p class="text-xs text-muted-foreground mb-1">UL 口径：In ≥ I / 0.75</p>
                <p class="text-xl font-bold text-primary">建议额定档 {{ snapUl === null ? '—' : fmtA(snapUl) }} A</p>
                <p class="text-xs text-muted-foreground mt-1">
                  I/0.75 = {{ fmtA(ulReq) }} A → 温度修正 ÷{{ fmtNum(derate, 3) }} = {{ fmtA(ulReqT) }} A → 吸附标准档
                </p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-xs text-muted-foreground mb-1">IEC 口径：In ≥ I</p>
                <p class="text-xl font-bold text-foreground">建议额定档 {{ snapIec === null ? '—' : fmtA(snapIec) }} A</p>
                <p class="text-xs text-muted-foreground mt-1">
                  I = {{ fmtA(workI) }} A → 温度修正 ÷{{ fmtNum(derate, 3) }} = {{ fmtA(iecReqT) }} A → 吸附标准档
                </p>
              </div>
            </div>
            <p v-if="snapUl === null || snapIec === null" class="text-xs text-yellow-600 dark:text-yellow-400">
              计算值超出常见档上限 30 A，请查中 / 大电流熔断器系列或并联分路
            </p>

            <div class="overflow-x-auto">
              <table class="w-full text-xs border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr class="bg-muted/50 text-muted-foreground">
                    <th class="px-2 py-1.5 text-left font-medium">温度（℃）</th>
                    <th v-for="r in derateTable" :key="'h' + r.t" class="px-2 py-1.5 text-right font-medium">{{ r.t }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="px-2 py-1.5 text-muted-foreground">可用电流占额定（{{ derateRate }}%/10℃）</td>
                    <td
                      v-for="r in derateTable"
                      :key="r.t"
                      class="px-2 py-1.5 text-right"
                      :class="r.t === nearestT ? 'text-primary font-bold' : 'text-foreground'"
                    >{{ fmtNum(r.f * 100, 3) }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex items-start gap-2 bg-muted/50 border border-border rounded-lg p-3">
              <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p class="text-xs leading-relaxed text-muted-foreground">
                以所选保险丝厂商温度降额曲线为准，此处为通用工程近似（25℃ 基准、每 10℃ 降 {{ derateRate }}%、冷态不给增益、系数下限 0.5）。
                机箱内局部温度常比环温高 15~25℃，按保险丝周围实际温度取值；温度降额与 UL 0.75 同时作用偏保守，最终以厂商曲线复核。
              </p>
            </div>
          </template>
          <div v-else class="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            输入工作电流（&gt; 0）后给出双口径建议额定档
          </div>
        </div>

        <!-- 第二步：脉冲 I²t 校验 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Activity class="w-5 h-5 mr-2 text-primary" /> 第二步 · 浪涌脉冲 I²t 校验
            </h2>
            <span class="text-xs text-muted-foreground">步骤 2 / 4</span>
          </div>

          <div class="grid grid-cols-2 gap-1.5 max-w-md">
            <button
              @click="wave = 'rect'"
              :class="wave === 'rect' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >矩形波 I×t</button>
            <button
              @click="wave = 'exp'"
              :class="wave === 'exp' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >指数衰减（电容充电简化）</button>
          </div>

          <template v-if="wave === 'rect'">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="fs-ri" class="block text-sm font-medium text-foreground mb-1.5">脉冲电流 I（A）</label>
                <input
                  id="fs-ri"
                  v-model.number="rectI"
                  type="number"
                  min="0"
                  step="any"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 10"
                >
              </div>
              <div>
                <label for="fs-rt" class="block text-sm font-medium text-foreground mb-1.5">脉冲宽度 t（ms）</label>
                <input
                  id="fs-rt"
                  v-model.number="rectMs"
                  type="number"
                  min="0"
                  step="any"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 10"
                >
              </div>
            </div>
            <p class="text-xs text-muted-foreground">矩形口径直接积分：I²t = I² × t（自核：10 A × 10 ms → 10²×0.01 = 1 A²s）</p>
          </template>
          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="fs-ipk" class="block text-sm font-medium text-foreground mb-1.5">峰值电流 I_peak（A）</label>
                <input
                  id="fs-ipk"
                  v-model.number="expIpk"
                  type="number"
                  min="0"
                  step="any"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 20"
                >
              </div>
              <div>
                <label for="fs-tau" class="block text-sm font-medium text-foreground mb-1.5">时间常数 τ（ms）</label>
                <input
                  id="fs-tau"
                  v-model.number="expTauMs"
                  type="number"
                  min="0"
                  step="any"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 5"
                >
              </div>
            </div>
            <p class="text-xs text-muted-foreground">
              简化口径：I²t ≈ I_peak² × τ / 2（自核：20 A、τ = 5 ms → 20²×0.005/2 = 1 A²s）；此为电容充电 / RL 浪涌的工程简化式，
              精确值按波形逐段积分或对照厂商脉冲承受曲线核定。
            </p>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="fs-nom" class="block text-sm font-medium text-foreground mb-1.5">公称熔化 I²t（A²s，查手册）</label>
              <input
                id="fs-nom"
                v-model.number="nomI2t"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 2"
              >
            </div>
            <div>
              <label for="fs-margin" class="block text-sm font-medium text-foreground mb-1.5">裕量系数（浪涌 ≤ 系数 × 公称）</label>
              <div class="flex flex-wrap items-center gap-1.5">
                <button
                  v-for="m in marginOptions"
                  :key="m"
                  @click="margin = m"
                  :class="Number(margin) === m ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                >{{ m }}</button>
                <input
                  id="fs-margin"
                  v-model.number="margin"
                  type="number"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  class="w-20 px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
                  aria-label="自定义裕量系数"
                >
              </div>
            </div>
          </div>

          <template v-if="i2tRes">
            <div class="rounded-lg p-4 text-center" :class="i2tRes.pass ? 'bg-primary/10' : 'bg-red-500/10'">
              <div class="flex items-center justify-center gap-2">
                <CheckCircle v-if="i2tRes.pass" class="w-5 h-5 text-primary" />
                <AlertTriangle v-else class="w-5 h-5 text-red-600 dark:text-red-400" />
                <p class="text-lg font-bold" :class="i2tRes.pass ? 'text-primary' : 'text-red-600 dark:text-red-400'">
                  {{ i2tRes.pass ? '通过' : '不通过' }}
                </p>
              </div>
              <p class="text-xs text-muted-foreground mt-1.5">
                浪涌 I²t = {{ fmtI2t(surgeI2t) }} A²s；允许上限 = {{ fmtNum(margin, 3) }} × 公称 {{ fmtI2t(nomI2t) }} = {{ fmtI2t(i2tRes.limit) }} A²s；
                裕量 {{ fmtNum(i2tRes.marginPct, 3) }}%（负值即超限）
              </p>
            </div>
            <p v-if="!i2tRes.pass" class="text-xs leading-relaxed text-muted-foreground bg-muted/50 border border-border rounded-lg p-2.5">
              不通过的三个方向：放大一档额定（公称熔化 I²t 随之增大）、改用慢断型号（同额定下 I²t 更大）、电路侧抑制浪涌（NTC / 软启动）；
              放大额定后回第一步复核温升与载流。
            </p>
          </template>
          <div v-else class="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            填写脉冲参数与公称熔化 I²t（均 &gt; 0）后校验
          </div>
        </div>

        <!-- 第三步：快断/慢断指引 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Timer class="w-5 h-5 mr-2 text-primary" /> 第三步 · 快断 / 慢断指引
            </h2>
            <span class="text-xs text-muted-foreground">步骤 3 / 4</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="rounded-lg p-3 bg-muted/50 border border-border">
              <p class="text-sm font-medium text-foreground">选慢断（T / Time-lag）</p>
              <ul class="list-disc pl-5 mt-1.5 space-y-1 text-xs text-muted-foreground leading-relaxed">
                <li>容性输入：整流桥后大电容充电浪涌可达稳态电流数十倍</li>
                <li>电机：启动浪涌持续数十 ms 到秒级</li>
                <li>变压器励磁浪涌：合闸瞬间磁化电流尖峰</li>
              </ul>
            </div>
            <div class="rounded-lg p-3 bg-muted/50 border border-border">
              <p class="text-sm font-medium text-foreground">选快断（F / Fast-acting）</p>
              <ul class="list-disc pl-5 mt-1.5 space-y-1 text-xs text-muted-foreground leading-relaxed">
                <li>半导体器件：过载耐受毫秒级，要求快速切断</li>
                <li>精密线路 / 小电流电子：保护阈值低、怕热</li>
                <li>无浪涌的阻性负载</li>
              </ul>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">你的负载类型（用于第四步汇总建议）</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              <button
                v-for="o in loadOptions"
                :key="o.v"
                @click="loadType = o.v"
                :class="loadType === o.v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >{{ o.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              对应结论：{{ loadKind === 'T' ? '慢断（T）型——熔体带 M-effect / 热延迟结构，扛得住浪涌且浪涌后不失额定载流' : '快断（F）型——细丝直通结构，毫秒级熔断保护半导体与精密线路' }}
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex items-start gap-2 rounded-lg p-3 bg-red-500/5 border border-red-400/30">
              <AlertTriangle class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p class="text-xs leading-relaxed text-muted-foreground">
                <span class="text-foreground font-medium">症状一：频繁「无故」熔断。</span>
                把快断用在容性输入 / 电机上，上电浪涌每次都把熔体「误杀」——是选型错了，不是保险丝质量差。
              </p>
            </div>
            <div class="flex items-start gap-2 rounded-lg p-3 bg-red-500/5 border border-red-400/30">
              <AlertTriangle class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p class="text-xs leading-relaxed text-muted-foreground">
                <span class="text-foreground font-medium">症状二：保险丝没断、下游先坏。</span>
                把慢断用在半导体 / 精密线路上，过流时熔断太慢，IC、细铜箔或精密电阻先于保险丝损坏——保护形同虚设。
              </p>
            </div>
          </div>
        </div>

        <!-- 第四步：校验清单 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <ListChecks class="w-5 h-5 mr-2 text-primary" /> 第四步 · 校验清单
            </h2>
            <span class="text-xs text-muted-foreground">步骤 4 / 4</span>
          </div>
          <p class="text-xs text-muted-foreground">逐项勾选确认（状态本地记忆）；任何一项不满足都不能下发 BOM。</p>
          <div class="space-y-2">
            <label
              v-for="(c, idx) in checkItems"
              :key="idx"
              class="flex items-start gap-2.5 rounded-lg p-3 bg-muted/50 border border-border cursor-pointer hover:bg-muted/70 transition"
            >
              <input
                v-model="checks[idx]"
                type="checkbox"
                class="mt-0.5 w-4 h-4 rounded border border-border flex-shrink-0"
              >
              <span class="text-xs leading-relaxed text-muted-foreground">
                <span class="text-foreground font-medium">{{ c.title }}</span>{{ c.desc }}
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 结果汇总卡 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <ClipboardCheck class="w-4 h-4 mr-2 text-primary" /> 选型结果汇总
          </h3>
          <div class="space-y-2 text-xs">
            <div class="flex gap-2 items-start">
              <span class="flex-shrink-0 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">① 额定</span>
              <p class="text-muted-foreground leading-relaxed">{{ step1Line || '待填写工作电流与环境温度' }}</p>
            </div>
            <div class="flex gap-2 items-start">
              <span class="flex-shrink-0 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">② I²t</span>
              <p class="text-muted-foreground leading-relaxed">{{ step2Line || '待填写脉冲参数与公称熔化 I²t' }}</p>
            </div>
            <div class="flex gap-2 items-start">
              <span class="flex-shrink-0 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">③ 特性</span>
              <p class="text-muted-foreground leading-relaxed">{{ step3Line || '待选择负载类型（第三步）' }}</p>
            </div>
            <div class="flex gap-2 items-start">
              <span class="flex-shrink-0 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">④ 清单</span>
              <p class="text-muted-foreground leading-relaxed">{{ step4Line }}</p>
            </div>
          </div>
          <div class="bg-primary/10 rounded-lg p-3">
            <p class="text-xs leading-relaxed text-foreground">{{ advice }}</p>
          </div>
          <button
            @click="copySummary"
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
          >
            <Copy class="w-3.5 h-3.5" /> 复制选型汇总
          </button>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>I²t 的物理含义：熔化热容量</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          I²t（焦耳积分）= ∫i²dt，单位 A²s，衡量脉冲电流给熔体注入的热量。公称熔化 I²t（nominal melting I²t）是让熔体恰好达到熔化所需的最小积分，
          手册以表格或脉冲承受曲线（Pulse Cycle Ability Chart）给出。工程口径要求浪涌脉冲的 I²t 不超过公称熔化 I²t 的 70~80%
          （本工具裕量系数默认 0.75、可在 0.7~0.8 间调整），否则反复脉冲会让熔体在近熔点反复老化、寿命骤降。
          矩形波直接 I²t = I²·t；指数衰减（电容充电、RL 浪涌）常用简化式 I²t = I_peak²·τ/2，精确口径应按波形逐段积分或对照厂商 paired-pulse 曲线。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>UL 口径 0.75 降额的由来</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          UL 248 要求保险丝在 100% 额定电流下持续承载不熔断，但长期贴近 100% 运行时熔体处于近熔化热平衡，温升与寿命都不可控，
          所以工程口径要求工作电流不超过额定值的 75%，即 In ≥ I/0.75。IEC 60127 / 60269 的试验条件与时间-电流特性口径不同，
          允许 In ≥ I 直选。两套口径不能混用：UL 认证的保险丝按 IEC 口径选会偏小一档，IEC 件按 UL 口径选则偏大一档，
          整机认证要什么口径就按什么口径选与替换。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>快断与慢断的区别：熔体结构决定响应速度</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          快断（F，Fast-acting）熔体是细丝直通结构，数倍过载几十毫秒内熔断，适合半导体、精密线路等「怕热」对象。
          慢断（T，Time-lag / 慢熔）在熔体上叠加 M-effect 合金段或热延迟结构，专门扛住电容充电、电机启动、变压器励磁这类毫秒到秒级浪涌，
          浪涌过后仍保持额定载流；同额定下慢断的公称熔化 I²t 也更大。选反了有两个典型症状：
          快断用在容性 / 电机上「上电即误杀」频繁熔断；慢断用在半导体上过流时保护太慢，下游 IC 与铜箔先坏。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>为什么换件不许放大额定值</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          保险丝保护的不只是它自己，更是上游线缆与 PCB 铜箔的载流余量：安规按额定电流匹配了线径与绝缘。把 3 A 换成 5 A 后，
          短路时保险丝熔断时间变长，故障能量先超过线缆承载上限——先烧线不烧保险，轻则烧板重则起火。
          同理额定电压与分断能力也不许降格：分断能力低于安装点预期短路电流时，熔断瞬间电弧无法熄灭，可能续流甚至爆裂。
          换件只许「同规格或原厂认可替代」，不许放大任何一档。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>温度降额曲线怎么看</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          厂商 datasheet 的温度降额曲线横轴是环境温度（注意是保险丝周围的局部温度，不是机箱外的室温），
          纵轴是该温度下可持续承载的电流占额定值的百分比。本工具用「每 10℃ 降 3~5%」的通用近似（可选 3 / 4 / 5）：
          25℃ 基准、冷态不给增益、系数下限 0.5。机箱内靠近变压器 / 功率电阻的位置局部温度常比环温高 15~25℃，
          应按局部温度取值；同一型号在不同厂商的曲线差异不小，最终以所选厂商曲线复核。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">保险丝额定电流怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              工作电流 I 先按口径放大：UL 口径 In ≥ I/0.75，IEC 口径 In ≥ I；再按环境温度降额折算（通用近似每 10℃ 降 3~5%，以厂商曲线为准），
              最后吸附到厂商常见额定档，并核对第二步的浪涌 I²t 与第四步清单。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">I²t 校验不通过怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              三个方向：放大一档额定（公称熔化 I²t 随之增大）、改用慢断型号（同额定下 I²t 更大）、或在电路侧抑制浪涌（NTC / 软启动）。
              注意放大额定后要回第一步复核温升与载流，且换件时额定值不许放大只对「维修替换」生效，新设计选型不受此限。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">快断（F）和慢断（T）保险丝怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              有毫秒级以上浪涌且必须扛过去的负载（容性输入、电机、变压器励磁）选慢断 T；
              半导体、精密线路、无浪涌的阻性负载选快断 F。方向选错的两个症状：频繁无故熔断（快断扛浪涌）与下游先坏（慢断保护慢）。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">更换保险丝时能不能换大一号？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              不能。额定电流、电压、分断能力、I²t 都不得放大——保险丝与上游线缆 / PCB 铜箔载流是安规配套设计，
              放大额定后短路时先烧线不烧保险；分断能力不足时电弧无法熄灭。换件只许同规格或原厂认可替代。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'fuse-selector'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  PlugZap, Zap, Activity, Timer, ListChecks, ClipboardCheck, Info,
  AlertTriangle, CheckCircle, ChevronUp, ChevronDown, Copy, Link as LinkIcon
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'fuse-selector'
const STORAGE_KEY = 'fuse-selector.inputs'

// SEO
useSeoMeta({
  title: '保险丝选型计算器 - UL/IEC双口径、温度降额与浪涌I²t校验',
  description: '在线保险丝选型计算器：工作电流按 UL（In≥I/0.75）与 IEC（In≥I）双口径选额定档，环境温度降额折算，浪涌脉冲 I²t 校验（矩形/指数波形）与快断慢断指引，附校验清单，纯本地计算',
  keywords: '保险丝选型, 熔断器选择, 额定电流计算, i2t计算, 温度降额, 快断慢断, ul iec保险丝, fuse selector calculator',
  author: 'Util工具箱',
  ogTitle: '保险丝选型计算器 - 有条工具',
  ogDescription: 'UL/IEC 双口径额定电流、温度降额与浪涌 I²t 校验四步选型',
  ogUrl: 'https://www.util.cn/tools/fuse-selector',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '保险丝选型计算器',
  twitterDescription: '额定电流、温度降额、I²t 校验与快断慢断四步选型，纯本地计算'
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
          name: '保险丝选型计算器',
          url: 'https://www.util.cn/tools/fuse-selector',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'UL / IEC 双口径额定电流选型',
            '环境温度降额折算与常见额定档吸附',
            '矩形 / 指数两种浪涌 I²t 校验与裕量分析',
            '快断 / 慢断负载类型指引',
            '分断能力与额定电压校验清单'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '保险丝选型计算器', item: 'https://www.util.cn/tools/fuse-selector/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '保险丝额定电流怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: 'UL 口径 In≥I/0.75，IEC 口径 In≥I；再按环境温度降额折算（通用近似每 10℃ 降 3~5%，以厂商曲线为准），最后吸附常见额定档并核对浪涌 I²t。' }
            },
            {
              '@type': 'Question',
              name: 'I²t 校验不通过怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '放大一档额定、改用慢断型号（同额定下 I²t 更大）或在电路侧抑制浪涌（NTC/软启动）；放大额定后需回第一步复核温升与载流。' }
            },
            {
              '@type': 'Question',
              name: '快断（F）和慢断（T）保险丝怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '容性输入、电机、变压器励磁等有浪涌的负载选慢断 T；半导体、精密线路、阻性负载选快断 F。选错症状：频繁无故熔断或下游先坏。' }
            },
            {
              '@type': 'Question',
              name: '更换保险丝时能不能换大一号？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。额定电流、电压、分断能力、I²t 都不得放大，保险丝与上游线缆载流是安规配套设计，放大后短路时先烧线不烧保险。' }
            }
          ]
        }
      ]
    })
  }]
})

// __PURE_FNS_START__
// ---------- 保险丝选型纯函数（无外部依赖） ----------
// 常见额定档（A）：吸附用
const FUSE_RATINGS = [0.125, 0.25, 0.375, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6.3, 8, 10, 12, 15, 20, 25, 30]

// 吸附：取 ≥ x 的最小标准档；超出 30 A 返回 null（提示查中/大电流系列）
const snapRating = (x) => {
  if (!isFinite(x) || x <= 0) return null
  for (const r of FUSE_RATINGS) {
    if (r >= x - 1e-9) return r
  }
  return null
}

// UL 口径：连续承载不超过额定 75% → In ≥ I/0.75
const ulRequired = (i) => (isFinite(i) && i > 0 ? i / 0.75 : NaN)

// 温度降额：25℃ 基准、每 10℃ 降 rate%（rate=3/4/5），冷态不给增益，系数下限 0.5。
// 通用工程近似，实际以所选厂商温度降额曲线为准。
const derateFactor = (t, ratePer10C) => {
  if (!isFinite(t) || !isFinite(ratePer10C) || ratePer10C <= 0) return NaN
  if (t <= 25) return 1
  return Math.max(0.5, 1 - (t - 25) * ratePer10C / 1000)
}

// 矩形波：I²t = I² × t（t 单位 ms → /1000）
const i2tRect = (i, tMs) => (isFinite(i) && i > 0 && isFinite(tMs) && tMs > 0 ? i * i * tMs / 1000 : NaN)

// 指数衰减（电容充电简化口径）：I²t ≈ I_peak² × τ / 2（τ 单位 ms → /2000）
const i2tExp = (ipk, tauMs) => (isFinite(ipk) && ipk > 0 && isFinite(tauMs) && tauMs > 0 ? ipk * ipk * tauMs / 2000 : NaN)

// I²t 校验：浪涌 ≤ margin × 公称熔化 I²t，裕量 = 允许上限/浪涌 − 1
const i2tCheck = (surge, nominal, margin) => {
  if (!isFinite(surge) || surge <= 0 || !isFinite(nominal) || nominal <= 0 || !isFinite(margin) || margin <= 0 || margin >= 1) return null
  const limit = nominal * margin
  return { limit, pass: surge <= limit, marginPct: (limit / surge - 1) * 100 }
}

// 展示格式化（避免浮点尾差）
const fmtA = (v, sig = 4) => (isFinite(v) && v > 0 ? Number(v.toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '—')
const fmtI2t = (v, sig = 4) => (isFinite(v) && v > 0 ? Number(v.toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '—')
const fmtNum = (v, sig = 4) => (isFinite(v) ? Number(v.toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '—')
// __PURE_FNS_END__

// ---------- 状态 ----------
const derateRates = [3, 4, 5]
const workI = ref(3)
const envT = ref(40)
const derateRate = ref(4)

const wave = ref('rect')
const rectI = ref(10)
const rectMs = ref(10)
const expIpk = ref(20)
const expTauMs = ref(5)
const nomI2t = ref(2)
const marginOptions = [0.7, 0.75, 0.8]
const margin = ref(0.75)

const loadOptions = [
  { v: 'cap', label: '容性输入', kind: 'T' },
  { v: 'motor', label: '电机 / 变压器励磁', kind: 'T' },
  { v: 'semi', label: '半导体 / 精密线路', kind: 'F' }
]
const loadType = ref('cap')

const checkItems = [
  { title: '分断能力 ≥ 预期短路电流。', desc: '查安装点最大预期短路电流（常见 35 A / 50 A / 100 A / 300 A / 1,500 A 档）；分断能力不足时熔断瞬间电弧无法熄灭，轻则续流重则爆裂。' },
  { title: '额定电压 ≥ 电路电压。', desc: ' AC 与 DC 口径分开看，同一只保险丝的 DC 分断能力通常远低于 AC；DC 场景按厂商 DC 曲线复核。' },
  { title: '认证口径不混用。', desc: ' UL 248 与 IEC 60127/60269 试验条件不同，UL 认证件不能按 IEC 口径直接替换，反之亦然；整机认证要什么口径就选什么口径。' },
  { title: '换件不许放大额定值。', desc: ' 额定电流、电压、分断能力、I²t 都不得放大——保险丝与上游线缆 / PCB 铜箔载流是安规配套设计，放大后短路时先烧线不烧保险。' }
]
const checks = ref([false, false, false, false])

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 输入持久化（键前缀为工具 id）
watch([workI, envT, derateRate, wave, rectI, rectMs, expIpk, expTauMs, nomI2t, margin, loadType, checks], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      workI: workI.value,
      envT: envT.value,
      derateRate: derateRate.value,
      wave: wave.value,
      rectI: rectI.value,
      rectMs: rectMs.value,
      expIpk: expIpk.value,
      expTauMs: expTauMs.value,
      nomI2t: nomI2t.value,
      margin: margin.value,
      loadType: loadType.value,
      checks: checks.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}, { deep: true })

onMounted(() => {
  addRecentTool(TOOL_ID)
  // 恢复上次输入
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      const num = (v, min, max) => (typeof v === 'number' && isFinite(v) && (min === undefined || v >= min) && (max === undefined || v <= max) ? v : null)
      const wi = num(s.workI, 0)
      if (wi !== null) workI.value = wi
      const et = num(s.envT, -100)
      if (et !== null) envT.value = et
      if (derateRates.includes(s.derateRate)) derateRate.value = s.derateRate
      if (s.wave === 'rect' || s.wave === 'exp') wave.value = s.wave
      const ri = num(s.rectI, 0)
      if (ri !== null) rectI.value = ri
      const rt = num(s.rectMs, 0)
      if (rt !== null) rectMs.value = rt
      const ipk = num(s.expIpk, 0)
      if (ipk !== null) expIpk.value = ipk
      const tau = num(s.expTauMs, 0)
      if (tau !== null) expTauMs.value = tau
      const nom = num(s.nomI2t, 0)
      if (nom !== null) nomI2t.value = nom
      const mg = num(s.margin, 0.01, 0.99)
      if (mg !== null) margin.value = mg
      if (loadOptions.some((o) => o.v === s.loadType)) loadType.value = s.loadType
      if (Array.isArray(s.checks) && s.checks.length === 4) checks.value = s.checks.map(Boolean)
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})

// ---------- 第一步：额定电流与温度降额 ----------
const derate = computed(() => derateFactor(Number(envT.value), Number(derateRate.value)))
const step1Valid = computed(() => isFinite(Number(workI.value)) && Number(workI.value) > 0 && isFinite(derate.value) && derate.value > 0)
const ulReq = computed(() => (step1Valid.value ? ulRequired(Number(workI.value)) : NaN))
const ulReqT = computed(() => (step1Valid.value ? ulReq.value / derate.value : NaN))
const iecReqT = computed(() => (step1Valid.value ? Number(workI.value) / derate.value : NaN))
const snapUl = computed(() => (step1Valid.value ? snapRating(ulReqT.value) : null))
const snapIec = computed(() => (step1Valid.value ? snapRating(iecReqT.value) : null))

const DERATE_TEMPS = [25, 40, 55, 70, 85, 100]
const derateTable = computed(() => DERATE_TEMPS.map((t) => ({ t, f: derateFactor(t, Number(derateRate.value)) })))
const nearestT = computed(() => (isFinite(Number(envT.value)) ? DERATE_TEMPS.reduce((a, b) => (Math.abs(b - Number(envT.value)) < Math.abs(a - Number(envT.value)) ? b : a)) : 25))

// ---------- 第二步：脉冲 I²t 校验 ----------
const surgeI2t = computed(() => (wave.value === 'rect' ? i2tRect(Number(rectI.value), Number(rectMs.value)) : i2tExp(Number(expIpk.value), Number(expTauMs.value))))
const step2Valid = computed(() => isFinite(surgeI2t.value) && surgeI2t.value > 0 && isFinite(Number(nomI2t.value)) && Number(nomI2t.value) > 0 && isFinite(Number(margin.value)) && Number(margin.value) > 0 && Number(margin.value) < 1)
const i2tRes = computed(() => (step2Valid.value ? i2tCheck(surgeI2t.value, Number(nomI2t.value), Number(margin.value)) : null))

// ---------- 第三步：快断/慢断 ----------
const loadKind = computed(() => {
  const o = loadOptions.find((x) => x.v === loadType.value)
  return o ? o.kind : null
})
const loadLabel = computed(() => {
  const o = loadOptions.find((x) => x.v === loadType.value)
  return o ? o.label : ''
})

// ---------- 第四步：校验清单 ----------
const checksDone = computed(() => checks.value.filter(Boolean).length)

// ---------- 结果汇总 ----------
const step1Line = computed(() => {
  if (!step1Valid.value) return null
  const ulTxt = snapUl.value === null ? `UL 需 ${fmtA(ulReqT.value)} A（超常见档）` : `UL 选 ≥ ${fmtA(snapUl.value)} A`
  const iecTxt = snapIec.value === null ? `IEC 需 ${fmtA(iecReqT.value)} A（超常见档）` : `IEC 选 ≥ ${fmtA(snapIec.value)} A`
  return `${ulTxt} / ${iecTxt}（${fmtNum(envT.value)}℃ 降额 ${fmtNum(derate.value * 100, 3)}%）`
})
const step2Line = computed(() => {
  if (!i2tRes.value) return null
  const head = `浪涌 ${fmtI2t(surgeI2t.value)} A²s vs 允许 ${fmtI2t(i2tRes.value.limit)} A²s`
  return i2tRes.value.pass ? `${head}，通过（裕量 ${fmtNum(i2tRes.value.marginPct, 3)}%）` : `${head}，不通过`
})
const step3Line = computed(() => (loadKind.value ? `负载为${loadLabel.value}，选${loadKind.value === 'T' ? '慢断（T）' : '快断（F）'}型` : null))
const step4Line = computed(() => `校验清单已确认 ${checksDone.value}/4 项`)

const advice = computed(() => {
  const parts = []
  if (step1Valid.value && snapUl.value !== null && snapIec.value !== null) {
    parts.push(`额定档：UL 口径 ${fmtA(snapUl.value)} A、IEC 口径 ${fmtA(snapIec.value)} A（${fmtNum(envT.value)}℃、降额 ${fmtNum(derate.value * 100, 3)}%）`)
  } else if (step1Valid.value) {
    parts.push(`额定需求 ${fmtA(ulReqT.value)} A（UL）/ ${fmtA(iecReqT.value)} A（IEC），超出 30 A 常见档，查中 / 大电流系列`)
  }
  if (i2tRes.value) {
    parts.push(i2tRes.value.pass
      ? `浪涌 I²t ${fmtI2t(surgeI2t.value)} A²s 校验通过，裕量 ${fmtNum(i2tRes.value.marginPct, 3)}%，无需为浪涌放大档位`
      : `浪涌 I²t ${fmtI2t(surgeI2t.value)} A²s 超出允许上限，需放大一档、改慢断型号或电路侧抑制浪涌`)
  }
  if (loadKind.value) parts.push(`负载为${loadLabel.value}，选${loadKind.value === 'T' ? '慢断（T）' : '快断（F）'}型`)
  if (checksDone.value < 4) parts.push(`校验清单尚有 ${4 - checksDone.value} 项未确认`)
  return (parts.length ? parts.join('；') + '。' : '按四步填写后此处给出综合建议。') + '选型结论为工程估算，正式设计以保险丝厂商 datasheet 与安规要求为准。'
})

const copySummary = () => {
  const lines = [
    `① 额定：${step1Line.value || '待填写'}`,
    `② I²t：${step2Line.value || '待填写'}`,
    `③ 特性：${step3Line.value || '待选择负载类型'}`,
    `④ 清单：${step4Line.value}`,
    `综合建议：${advice.value}`
  ]
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      alert('已复制选型汇总到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动选择文本复制')
    })
  } else {
    alert('当前环境不支持剪贴板，请手动选择文本复制')
  }
}

// ---------- 相关工具 ----------
const relatedLinks = computed(() => ['voltage-drop-calculator', 'cable-ampacity-lookup', 'psu-wattage-calculator']
  .map((id) => tools.find((t) => t.id === id))
  .filter(Boolean))
</script>
