<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BatteryCharging class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电容储能与放电计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">E=½CV² 储能、RC 恒阻放电时间与超容备份速算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        一页算清电容「存了多少电、能放多久」：① 按 E = ½CV² 计算电容储能，焦耳（J）与毫瓦时（mWh）双口径显示，容量支持 µF / F / 超容 F 档；② 恒阻放电按 τ = RC 给出放电对照表——放到 50% 电压、用掉 50% / 90% 可用能量各需多久，以及放到任意阈值电压 Vth 的时间 t = RC·ln(V0/Vth)，并单独拆解「放电到一半电压，能量只剩四分之一」这条物理账；③ 超级电容备份场景卡：RTC 备份、掉电保存写入时间的维持时间估算，支持按目标维持时间反推所需容量。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 储能计算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 储能计算 E = ½CV²
          </h2>

          <!-- 容量 C -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">电容容量 C</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="p in cPresets"
                :key="p.label"
                @click="cVal = p.val; cUnit = p.unit"
                :class="cVal === p.val && cUnit === p.unit ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >{{ p.label }}</button>
            </div>
            <div class="flex gap-2">
              <input
                v-model.number="cVal"
                type="number"
                min="0"
                step="any"
                class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="如 100（µF）、1（F）"
              />
              <div class="grid grid-cols-3 gap-1 w-44">
                <button
                  v-for="u in cUnits"
                  :key="u.key"
                  @click="cUnit = u.key"
                  :class="cUnit === u.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-xs font-medium transition-all"
                >{{ u.label }}</button>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">µF 档：常规电解 / 瓷片；F 档：超级电容（法拉电容），常见 0.1~100 F。</p>
          </div>

          <!-- 电压 V0 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">起始电压 V0（V）</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="v in vPresets"
                :key="v"
                @click="v0 = v"
                :class="v0 === v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >{{ v }} V</button>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model.number="v0"
                type="number"
                min="0"
                step="any"
                class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="电容两端起始电压"
              />
              <span class="text-sm text-muted-foreground">V</span>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">注意别超额定耐压，电解电容建议留 20% 余量。</p>
          </div>

          <!-- 储能结果 -->
          <div v-if="eJ !== null" class="space-y-3">
            <div class="bg-primary/10 rounded-lg p-5 text-center">
              <p class="text-xs text-muted-foreground mb-1">储存能量 E = ½ C V²</p>
              <p class="text-3xl font-bold text-primary">{{ fmtEnergy(eJ) }}</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground mb-0.5">毫瓦时口径</p>
                <p class="text-lg font-bold text-foreground">{{ fmtSig(mwh, 3) }} mWh</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground mb-0.5">瓦时口径</p>
                <p class="text-lg font-bold text-foreground">{{ fmtSig(wh, 3) }} Wh</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              计算式：E = 0.5 × {{ fmt(cF, 4) }} F × {{ fmt(v0, 2) }}² V = {{ fmtEnergy(eJ) }}。换算口径：1 J = 1/3600 Wh，即 1 J ≈ 0.2778 mWh。
            </p>
          </div>
          <div v-else class="p-6 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
            请输入有效的容量（大于 0）与电压（不小于 0）。
          </div>
        </div>

        <!-- 恒阻放电 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Hourglass class="w-5 h-5 mr-2 text-primary" /> 恒阻放电时间（电阻负载）
          </h2>

          <!-- 电阻 R -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">放电电阻 R</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="p in rPresets"
                :key="p.label"
                @click="rVal = p.val; rUnit = p.unit"
                :class="rVal === p.val && rUnit === p.unit ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >{{ p.label }}</button>
            </div>
            <div class="flex gap-2">
              <input
                v-model.number="rVal"
                type="number"
                min="0"
                step="any"
                class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="如 10（kΩ）、100（Ω）"
              />
              <div class="grid grid-cols-3 gap-1 w-44">
                <button
                  v-for="u in rUnits"
                  :key="u.key"
                  @click="rUnit = u.key"
                  :class="rUnit === u.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-xs font-medium transition-all"
                >{{ u.label }}</button>
              </div>
            </div>
          </div>

          <div v-if="tau !== null" class="space-y-5">
            <!-- 时间常数 -->
            <div class="bg-primary/10 rounded-lg p-5 text-center">
              <p class="text-xs text-muted-foreground mb-1">时间常数 τ = R × C</p>
              <p class="text-3xl font-bold text-primary">{{ fmtTime(tau) }}</p>
              <p class="text-xs text-muted-foreground mt-1.5">每过一个 τ，电压再降剩余值的 63.2%（剩 36.8%）。</p>
            </div>

            <!-- 物理账：单独展示 -->
            <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div class="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                <p class="font-bold mb-1">物理账：放电到一半电压，能量只剩四分之一</p>
                <p>能量 E ∝ V²，所以电压掉一半，能量只剩 25%（不是一半）。反过来看口径：想<strong>用掉一半可用能量</strong>，电压要放到 70.7%（√½）；想<strong>用掉 90%</strong>，电压要放到 31.6%（√0.1）——下面对照表已按两种口径列出。</p>
              </div>
            </div>

            <!-- 放电对照表 -->
            <div>
              <h3 class="text-sm font-medium text-foreground mb-2 flex items-center">
                <Table class="w-4 h-4 mr-2 text-primary" /> 恒阻放电对照表（从 V0 = {{ fmt(v0, 2) }} V 开始）
              </h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-muted-foreground text-xs border-b border-border">
                      <th class="text-left py-2 pr-4 font-medium">电压降到</th>
                      <th class="text-right py-2 px-3 font-medium">耗时（τ 倍数）</th>
                      <th class="text-right py-2 px-3 font-medium">实际时间</th>
                      <th class="text-right py-2 px-3 font-medium">剩余能量</th>
                      <th class="text-left py-2 pl-4 font-medium">口径注记</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in ratioRows" :key="row.v" class="border-b border-border/50">
                      <td class="py-2.5 pr-4 font-medium text-foreground">{{ row.label }}</td>
                      <td class="py-2.5 px-3 text-right text-muted-foreground">×{{ fmt(row.mult, 3) }}</td>
                      <td class="py-2.5 px-3 text-right font-medium text-foreground">{{ fmtTime(row.t) }}</td>
                      <td class="py-2.5 px-3 text-right text-muted-foreground">{{ fmt(row.remaining * 100, 1) }}%</td>
                      <td class="py-2.5 pl-4 text-xs text-muted-foreground">{{ row.note }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 阈值电压 -->
            <div class="border border-border rounded-lg p-4 space-y-3">
              <h3 class="text-sm font-medium text-foreground flex items-center">
                <Target class="w-4 h-4 mr-2 text-primary" /> 放电到阈值电压 Vth
              </h3>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="vth"
                  type="number"
                  min="0"
                  step="any"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="阈值电压（0 < Vth < V0）"
                />
                <span class="text-sm text-muted-foreground">V</span>
              </div>
              <div v-if="vthResult" class="bg-muted/50 rounded-lg p-3 text-sm leading-relaxed">
                t = RC·ln(V0/Vth) = {{ fmtTime(tau) }} × ln({{ fmt(v0, 2) }}/{{ fmt(vth, 2) }}) = <span class="text-primary font-bold">{{ fmtTime(vthResult.t) }}</span>
                （×{{ fmt(vthResult.mult, 3) }} τ），此时剩余能量 {{ fmt(vthResult.remaining * 100, 1) }}%，已用掉 {{ fmt((1 - vthResult.remaining) * 100, 1) }}%。
              </div>
              <p v-else class="text-xs text-amber-600 dark:text-amber-400">Vth 需满足 0 &lt; Vth &lt; V0 = {{ fmt(v0, 2) }} V，才能计算放电时间。</p>
            </div>
          </div>
          <div v-else class="p-6 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
            请先在储能区填写有效的容量与电压，并输入大于 0 的放电电阻。
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 超容备份场景卡 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 class="text-base font-semibold text-foreground flex items-center">
            <Timer class="w-4 h-4 mr-2 text-primary" /> 超容备份场景速算
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            按恒流负载估算维持时间 t = C·(V0−Vmin)/I，沿用上方容量 C 与起始电压 V0。适用 RTC 备份、掉电检测后保存数据等场景。
          </p>

          <!-- 维持电流 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">维持电流 I</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="p in iPresets"
                :key="p.label"
                @click="iVal = p.val; iUnit = p.unit"
                :class="iVal === p.val && iUnit === p.unit ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >{{ p.label }}</button>
            </div>
            <div class="flex gap-2">
              <input
                v-model.number="iVal"
                type="number"
                min="0"
                step="any"
                class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="备份 / 维持电流"
              />
              <div class="grid grid-cols-2 gap-1 w-32">
                <button
                  v-for="u in iUnits"
                  :key="u.key"
                  @click="iUnit = u.key"
                  :class="iUnit === u.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-xs font-medium transition-all"
                >{{ u.label }}</button>
              </div>
            </div>
          </div>

          <!-- 最低维持电压 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">最低维持电压 Vmin（V）</label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="vmin"
                type="number"
                min="0"
                step="any"
                class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="负载还能工作的最低电压"
              />
              <span class="text-sm text-muted-foreground">V</span>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">RTC 常见 1.8~2.5 V 仍可走时；MCU 保存数据看其复位电压。</p>
          </div>

          <div v-if="holdTime !== null" class="bg-muted/50 rounded-lg p-3 text-sm leading-relaxed">
            可维持 <span class="text-primary font-bold">{{ fmtDur(holdTime) }}</span>
            <span class="text-xs text-muted-foreground">（≈ {{ fmtTime(holdTime) }}）</span>
            ：t = {{ fmtSig(cF, 3) }} F × ({{ fmt(v0, 2) }} − {{ fmt(vmin, 2) }}) V ÷ {{ fmtSig(iA, 3) }} A。
          </div>
          <p v-else class="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
            需要容量 C &gt; 0、电流 I &gt; 0，且 Vmin &lt; V0 = {{ fmt(v0, 2) }} V，才能计算维持时间。
          </p>

          <!-- 目标维持时间反推 -->
          <div class="border border-border rounded-lg p-3 space-y-2">
            <p class="text-xs font-medium text-foreground">按目标维持时间反推所需容量</p>
            <div class="flex gap-2">
              <input
                v-model.number="targetVal"
                type="number"
                min="0"
                step="any"
                class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="目标维持时间"
              />
              <div class="grid grid-cols-3 gap-1 w-36">
                <button
                  v-for="u in targetUnits"
                  :key="u.key"
                  @click="targetUnit = u.key"
                  :class="targetUnit === u.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded-lg text-xs font-medium transition-all"
                >{{ u.label }}</button>
              </div>
            </div>
            <div v-if="cNeedResult" class="text-xs leading-relaxed" :class="cNeedResult.enough ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">
              目标 {{ fmtDur(targetSeconds) }} 需要至少 <span class="font-bold">{{ fmtSig(cNeedResult.need, 3) }} F</span>。
              {{ cNeedResult.enough
                ? '当前容量充足，余量 ×' + fmt(cF / cNeedResult.need, 1) + '。'
                : '当前容量不足，还差 ' + fmtSig(cNeedResult.need - cF, 3) + ' F，或降低 Vmin / 减小维持电流。' }}
            </div>
            <p v-else class="text-xs text-muted-foreground">填入有效的目标时间后自动反推所需容量。</p>
          </div>

          <ul class="text-xs text-muted-foreground leading-relaxed space-y-1.5 list-disc pl-4">
            <li>RTC 备份：典型维持电流 0.3~3 µA，1 F 超容可顶数周量级。</li>
            <li>掉电保存：MCU 写 Flash/EEPROM 约 10~30 mA、需 10~100 ms，按写入总电荷折算即可。</li>
            <li>该式为恒流口径；恒功率负载（DC-DC 前级）放电更快，实际按 0.7 系数保守取。</li>
          </ul>
        </div>

        <!-- 快速自核示例 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <FlaskConical class="w-4 h-4 mr-2 text-primary" /> 快速自核示例
          </h2>
          <div class="space-y-2">
            <button
              @click="loadExample('a')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              C=1F、V=5V → <span class="text-foreground font-medium">E=12.5 J = 3.47 mWh</span>
            </button>
            <button
              @click="loadExample('b')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              C=100µF、V=9V → <span class="text-foreground font-medium">E=4.05 mJ</span>
            </button>
            <button
              @click="loadExample('c')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              R=10kΩ、C=100µF → <span class="text-foreground font-medium">τ=1 s，放到 10%V0 需 2.303 s</span>
            </button>
            <button
              @click="loadExample('d')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              超容 1F、5V→3V、I=1µA → <span class="text-foreground font-medium">可维持 ≈ 23.1 天</span>
            </button>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>电容储能与放电原理</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <h3 class="text-lg font-semibold text-foreground">为什么放电到一半电压，能量只剩四分之一？</h3>
          <p>
            电容储能 E = ½CV²，能量与电压是<strong>平方关系</strong>而不是线性关系。电压降到起始值的一半时，E = ½C(V0/2)² = ¼·½CV0²，只剩原来的四分之一；电压降到 70.7%（即 √½）时能量才正好用掉一半。这就是「电压口径」和「能量口径」的错位：按电压线性直觉估算续航会系统性高估。对恒阻放电来说，电压按指数衰减，每过一个时间常数 τ 剩 36.8%，而能量剩 13.5%（36.8% 的平方）——放到 3τ 时电压剩 5%，能量只剩 0.25%，基本可以认为放完了。
          </p>
          <h3 class="text-lg font-semibold text-foreground">超容 vs 电池：各自擅长什么</h3>
          <p>
            超级电容（EDLC）储能密度低（约 0.01~0.1 Wh/kg，锂电池的 1/100 量级）但功率密度高，循环寿命 50 万次以上、不怕深放、低温性能好、可快充。它适合的角色是「秒级到分钟级的功率型补位」：RTC 备份、掉电时抢出几十毫秒写完 Flash、平抑电机启动的功率尖峰、能量回收缓冲。电池适合「小时级的能量型供电」。两者不是替代关系——需要既久又稳的备电，常见做法是超容顶瞬时 + 电池扛长时。
          </p>
          <h3 class="text-lg font-semibold text-foreground">漏电流与自放电：为什么充好的电容会「跑电」</h3>
          <p>
            电解质与介质并非理想绝缘，电容始终有一个微安级的漏电流 I_leak（规格书常标 20℃ 下 ≤ 0.01·C·V 或 3~5 µA 取大者），表现为「自放电」：充到 5V 放几天，开路电压会自己往下掉。对备份场景这意味着维持时间要比理想公式打折扣——超容备份电路常串一只几百欧限流电阻并给漏电流留出余量；长期浮充时实际电压也会停在「充电电流 = 漏电流」的平衡点。挑选超容时，漏电流和内阻（ESR）与容量同样重要。
          </p>
          <h3 class="text-lg font-semibold text-foreground">法拉电容（超级电容）选型要点</h3>
          <p>
            四步走：① 按维持时间算容量下限 C ≥ I·t/(V0−Vmin)（恒流口径，恒功率负载再除以效率并留余量）；② 耐压留余量——单节额定 2.7 V，5 V 系统要两串并加均压电阻，串联会「容量减半、内阻翻倍」；③ 看 ESR 与目标电流的压降 I×ESR 是否吃掉了可用电压窗口；④ 确认漏电流与工作温度（高温下漏电流和寿命都会明显变差）。规格书里「标称容量 −20% 容差 + 高温再降额」是常态，按最坏情况选型。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么放电到一半电压，能量只剩四分之一？</span>因为 E = ½CV² 是平方关系：电压减半后 E = ½C(V0/2)² = 原来的 25%。想用掉一半能量要放到 70.7% 电压，用掉 90% 要放到 31.6%。</li>
            <li><span class="text-foreground font-medium">1F 电容能顶多久电池？</span>1F @ 5V 只存 12.5 J ≈ 3.47 mWh，而一节 CR2032 约 220 mAh×3V ≈ 660 mWh——差近 200 倍。超容适合秒~分钟级高功率补位，不适合长时供能。</li>
            <li><span class="text-foreground font-medium">放电到 10% 电压要多久？</span>恒阻放电 t = RC·ln(V0/Vth)，Vth = 0.1·V0 时 t = RC·ln10 ≈ 2.303·τ。例如 R=10kΩ、C=100µF，τ=1s，放到 10% 约 2.3 秒。</li>
            <li><span class="text-foreground font-medium">超容备份为什么要串电阻？</span>一是上电瞬间限制浪涌电流（超容 ESR 很低，直连会把电源拉垮或触发限流）；二是与漏电流匹配设定浮充工作点。取值需兼顾充电时间与压降损耗。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'capacitor-energy'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { BatteryCharging, Calculator, Hourglass, Timer, AlertTriangle, Table, Target, FlaskConical, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '电容储能与放电计算器 - E=½CV²/RC放电时间/超容备电在线计算 | Util工具箱',
  description: '在线电容储能计算器：按 E=½CV² 计算储能（J/mWh 双口径），恒阻放电时间常数 τ=RC、放电到 50%/90% 可用能量与阈值电压 Vth 的时间 t=RC·ln(V0/Vth)，超级电容 RTC 备份与掉电保存维持时间估算，纯本地计算',
  keywords: '电容储能, 电容储能计算, 电容放电时间, RC放电, 时间常数, 超级电容, 法拉电容, 超容备份, RTC备份, capacitor energy calculator',
  author: 'Util工具箱',
  ogTitle: '电容储能与放电计算器 - E=½CV²/RC放电时间',
  ogDescription: '储能 J/mWh 双口径、RC 放电对照表、超容备份维持时间速算',
  ogUrl: 'https://www.util.cn/tools/capacitor-energy',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '电容储能与放电计算器',
  twitterDescription: 'E=½CV² 储能、RC 恒阻放电时间与超容备份速算'
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
          name: '电容储能与放电计算器',
          url: 'https://www.util.cn/tools/capacitor-energy',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['E=½CV² 储能计算', '焦耳/毫瓦时双口径显示', 'RC 时间常数与放电对照表', '阈值电压放电时间 t=RC·ln(V0/Vth)', '50%/90% 可用能量口径换算', '超容备份维持时间与所需容量反推']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '电容储能与放电计算器', item: 'https://www.util.cn/tools/capacitor-energy' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么放电到一半电压，能量只剩四分之一？',
              acceptedAnswer: { '@type': 'Answer', text: '因为 E = ½CV² 是平方关系：电压减半后 E = ½C(V0/2)² = 原来的 25%。想用掉一半能量要放到 70.7% 电压，用掉 90% 能量要放到 31.6% 电压。' }
            },
            {
              '@type': 'Question',
              name: '1F 电容能顶多久电池？',
              acceptedAnswer: { '@type': 'Answer', text: '1F @ 5V 只存 12.5 J ≈ 3.47 mWh，而一节 CR2032 约 660 mWh，差近 200 倍。超容适合秒到分钟级的高功率补位，不适合长时供能。' }
            },
            {
              '@type': 'Question',
              name: '放电到 10% 电压要多久？',
              acceptedAnswer: { '@type': 'Answer', text: '恒阻放电 t = RC·ln(V0/Vth)，Vth = 0.1·V0 时 t = RC·ln10 ≈ 2.303·τ。例如 R=10kΩ、C=100µF，τ=1s，放到 10% 约 2.3 秒。' }
            },
            {
              '@type': 'Question',
              name: '超容备份为什么要串电阻？',
              acceptedAnswer: { '@type': 'Answer', text: '一是限制上电浪涌电流（超容 ESR 很低，直连会把电源拉垮）；二是与漏电流匹配设定浮充工作点，取值需兼顾充电时间与压降损耗。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'capacitor-energy'
const STORE_KEY = TOOL_ID + ':inputs'
const tool = tools.find(t => t.id === TOOL_ID)

// ==== PURE-FNS-START（纯计算函数，供单测逐行校验）====
const ceOk = (x) => typeof x === 'number' && isFinite(x)

// 容量单位换算表（µF / mF / F 三档，F 档覆盖超级电容）
const CE_CAP_UNITS = { uF: 1e-6, mF: 1e-3, F: 1 }
const ceCapFarads = (val, unit) => {
  const k = CE_CAP_UNITS[unit]
  if (!ceOk(val) || !(val > 0) || !k) return NaN
  return val * k
}

// 电阻单位换算（Ω / kΩ / MΩ）
const CE_RES_UNITS = { R: 1, k: 1e3, M: 1e6 }
const ceResOhms = (val, unit) => {
  const k = CE_RES_UNITS[unit]
  if (!ceOk(val) || !(val > 0) || !k) return NaN
  return val * k
}

// 储能 E = ½CV²（焦耳）
const ceEnergyJ = (cF, v) => {
  if (!ceOk(cF) || !ceOk(v) || !(cF > 0) || v < 0) return NaN
  return 0.5 * cF * v * v
}

// J → mWh：1 Wh = 3600 J → mWh = J / 3.6
const ceJToMwh = (j) => {
  if (!ceOk(j)) return NaN
  return j / 3.6
}
// J → Wh
const ceJToWh = (j) => {
  if (!ceOk(j)) return NaN
  return j / 3600
}

// RC 时间常数 τ = RC（秒）
const ceTau = (rOhm, cF) => {
  if (!ceOk(rOhm) || !ceOk(cF) || !(rOhm > 0) || !(cF > 0)) return NaN
  return rOhm * cF
}

// 恒阻放电：电压降到 V0 的 ratio 倍所需时间 t = τ·ln(1/ratio)，0 < ratio < 1
const ceTimeToVoltage = (tau, ratio) => {
  if (!ceOk(tau) || !ceOk(ratio) || !(tau > 0) || !(ratio > 0) || ratio >= 1) return NaN
  return tau * Math.log(1 / ratio)
}

// 电压比 → 剩余能量比（E ∝ V²）：放到一半电压，能量剩 ¼
const ceRemainingEnergyRatio = (vRatio) => {
  if (!ceOk(vRatio) || vRatio < 0 || vRatio > 1) return NaN
  return vRatio * vRatio
}

// 已用掉的能量比 → 对应电压比 v = √(1 − used)：用掉一半能量时电压剩 70.7%
const ceVoltageAtUsedEnergy = (used) => {
  if (!ceOk(used) || used < 0 || used >= 1) return NaN
  return Math.sqrt(1 - used)
}

// 用掉 used 比例的可用能量所需时间 t = τ·ln(1/√(1−used))
const ceTimeForUsedEnergy = (tau, used) => {
  const vRatio = ceVoltageAtUsedEnergy(used)
  if (!ceOk(vRatio)) return NaN
  return ceTimeToVoltage(tau, vRatio)
}

// 超容恒流维持时间 t = C·(V0 − Vmin) / I（秒）
const ceHoldupTime = (cF, v0, vmin, iA) => {
  if (!ceOk(cF) || !ceOk(v0) || !ceOk(vmin) || !ceOk(iA)) return NaN
  if (!(cF > 0) || !(iA > 0) || !(v0 > vmin)) return NaN
  return cF * (v0 - vmin) / iA
}

// 目标维持时间所需最小容量 C = I·t / (V0 − Vmin)（法拉）
const ceRequiredCap = (iA, tS, v0, vmin) => {
  if (!ceOk(iA) || !ceOk(tS) || !ceOk(v0) || !ceOk(vmin)) return NaN
  if (!(iA > 0) || !(tS > 0) || !(v0 > vmin)) return NaN
  return iA * tS / (v0 - vmin)
}
// ==== PURE-FNS-END ====

// ---------- 状态 ----------
const cVal = ref(100)
const cUnit = ref('uF')
const v0 = ref(9)
const rVal = ref(10)
const rUnit = ref('k')
const vth = ref(0.9)
const iVal = ref(1)
const iUnit = ref('uA')
const vmin = ref(3)
const targetVal = ref(24)
const targetUnit = ref('h')

const cPresets = [
  { label: '100 µF', val: 100, unit: 'uF' },
  { label: '470 µF', val: 470, unit: 'uF' },
  { label: '1 mF', val: 1, unit: 'mF' },
  { label: '1 F', val: 1, unit: 'F' },
  { label: '10 F', val: 10, unit: 'F' }
]
const cUnits = [
  { key: 'uF', label: 'µF' },
  { key: 'mF', label: 'mF' },
  { key: 'F', label: 'F' }
]
const vPresets = [1.8, 3.3, 5, 9, 12, 24]
const rPresets = [
  { label: '100 Ω', val: 100, unit: 'R' },
  { label: '1 kΩ', val: 1, unit: 'k' },
  { label: '10 kΩ', val: 10, unit: 'k' },
  { label: '100 kΩ', val: 100, unit: 'k' },
  { label: '1 MΩ', val: 1, unit: 'M' }
]
const rUnits = [
  { key: 'R', label: 'Ω' },
  { key: 'k', label: 'kΩ' },
  { key: 'M', label: 'MΩ' }
]
const iPresets = [
  { label: '1 µA（RTC）', val: 1, unit: 'uA' },
  { label: '10 µA', val: 10, unit: 'uA' },
  { label: '1 mA', val: 1, unit: 'mA' },
  { label: '20 mA（写入）', val: 20, unit: 'mA' }
]
const iUnits = [
  { key: 'uA', label: 'µA' },
  { key: 'mA', label: 'mA' }
]
const targetUnits = [
  { key: 'min', label: '分钟', sec: 60 },
  { key: 'h', label: '小时', sec: 3600 },
  { key: 'd', label: '天', sec: 86400 }
]

// 交互记录与输入持久化（SSR 安全：localStorage 仅在客户端执行）
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_KEY) : null
    if (raw) {
      const s = JSON.parse(raw)
      const nums = { cVal, v0, rVal, vth, iVal, vmin, targetVal }
      for (const k of Object.keys(nums)) if (typeof s[k] === 'number') nums[k].value = s[k]
      const strs = { cUnit, rUnit, iUnit, targetUnit }
      for (const k of Object.keys(strs)) if (typeof s[k] === 'string') strs[k].value = s[k]
    }
  } catch (e) { /* 忽略恢复失败 */ }
})

const persist = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      cVal: cVal.value, cUnit: cUnit.value, v0: v0.value,
      rVal: rVal.value, rUnit: rUnit.value, vth: vth.value,
      iVal: iVal.value, iUnit: iUnit.value, vmin: vmin.value,
      targetVal: targetVal.value, targetUnit: targetUnit.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}
watch([cVal, cUnit, v0, rVal, rUnit, vth, iVal, iUnit, vmin, targetVal, targetUnit], persist)

// ---------- 数字格式化（避免浮点尾差） ----------
const fmt = (v, digits = 2) => {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  return Number(v.toFixed(digits)).toLocaleString('zh-CN', { maximumFractionDigits: digits })
}
const fmtSig = (v, sig = 3) => {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  if (v === 0) return '0'
  const digits = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(v))))
  return Number(v.toFixed(Math.min(digits, 20))).toLocaleString('zh-CN', { maximumFractionDigits: 20 })
}
const fmtEnergy = (j) => {
  if (typeof j !== 'number' || !isFinite(j)) return '—'
  if (j >= 1) return fmt(j, 3) + ' J'
  if (j >= 1e-3) return fmt(j * 1e3, 3) + ' mJ'
  if (j >= 1e-6) return fmt(j * 1e6, 3) + ' µJ'
  return fmt(j * 1e9, 3) + ' nJ'
}
const fmtTime = (s) => {
  if (typeof s !== 'number' || !isFinite(s)) return '—'
  if (s >= 1) return fmt(s, 3) + ' s'
  if (s >= 1e-3) return fmt(s * 1e3, 3) + ' ms'
  if (s >= 1e-6) return fmt(s * 1e6, 3) + ' µs'
  return fmt(s * 1e9, 3) + ' ns'
}
const fmtDur = (s) => {
  if (typeof s !== 'number' || !isFinite(s)) return '—'
  if (s < 120) return fmt(s, 1) + ' 秒'
  if (s < 7200) return fmt(s / 60, 1) + ' 分钟'
  if (s < 172800) return fmt(s / 3600, 1) + ' 小时'
  return fmt(s / 86400, 1) + ' 天'
}

// ---------- 计算态 ----------
const cF = computed(() => ceCapFarads(cVal.value, cUnit.value))
const rOhm = computed(() => ceResOhms(rVal.value, rUnit.value))
const iA = computed(() => (iUnit.value === 'mA' ? iVal.value * 1e-3 : iVal.value * 1e-6))

const eJ = computed(() => {
  const e = ceEnergyJ(cF.value, v0.value)
  return isFinite(e) ? e : null
})
const mwh = computed(() => (eJ.value !== null ? ceJToMwh(eJ.value) : NaN))
const wh = computed(() => (eJ.value !== null ? ceJToWh(eJ.value) : NaN))

const tau = computed(() => {
  const t = ceTau(rOhm.value, cF.value)
  return isFinite(t) && isFinite(v0.value) && v0.value > 0 ? t : null
})

// 放电对照表：电压口径 + 可用能量口径并列
const ratioRows = computed(() => {
  if (tau.value === null) return []
  const rows = [
    { v: 0.9, label: '90% V0', note: '' },
    { v: Math.SQRT1_2, label: '70.7% V0（√½）', note: '已用掉一半可用能量' },
    { v: 0.5, label: '50% V0', note: '能量只剩 ¼（平方关系）' },
    { v: Math.sqrt(0.1), label: '31.6% V0（√0.1）', note: '已用掉 90% 可用能量' },
    { v: 0.1, label: '10% V0', note: '能量只剩 1%' }
  ]
  return rows.map(r => {
    const t = ceTimeToVoltage(tau.value, r.v)
    return { ...r, mult: Math.log(1 / r.v), t, remaining: ceRemainingEnergyRatio(r.v) }
  })
})

const vthResult = computed(() => {
  if (tau.value === null) return null
  if (!ceOk(vth.value) || !(vth.value > 0) || !(vth.value < v0.value)) return null
  const ratio = vth.value / v0.value
  const t = ceTimeToVoltage(tau.value, ratio)
  if (!isFinite(t)) return null
  return { t, mult: Math.log(1 / ratio), remaining: ceRemainingEnergyRatio(ratio) }
})

const holdTime = computed(() => {
  const t = ceHoldupTime(cF.value, v0.value, vmin.value, iA.value)
  return isFinite(t) ? t : null
})

const targetSeconds = computed(() => {
  const u = targetUnits.find(x => x.key === targetUnit.value)
  if (!u || !ceOk(targetVal.value) || !(targetVal.value > 0)) return NaN
  return targetVal.value * u.sec
})

const cNeedResult = computed(() => {
  const tS = targetSeconds.value
  if (!isFinite(tS)) return null
  const need = ceRequiredCap(iA.value, tS, v0.value, vmin.value)
  if (!isFinite(need)) return null
  return { need, enough: cF.value >= need }
})

// ---------- 交互 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const loadExample = (kind) => {
  if (kind === 'a') {
    cVal.value = 1; cUnit.value = 'F'; v0.value = 5
  } else if (kind === 'b') {
    cVal.value = 100; cUnit.value = 'uF'; v0.value = 9
  } else if (kind === 'c') {
    cVal.value = 100; cUnit.value = 'uF'; v0.value = 9
    rVal.value = 10; rUnit.value = 'k'; vth.value = 0.9
  } else if (kind === 'd') {
    cVal.value = 1; cUnit.value = 'F'; v0.value = 5
    iVal.value = 1; iUnit.value = 'uA'; vmin.value = 3
  }
}
</script>
