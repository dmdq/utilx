<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部区 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Zap class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">继电器驱动电阻计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">线圈电流、NPN 基极电阻 / MOSFET 门极电阻计算，饱和口径与续流二极管校验</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        三步算清继电器驱动：① 线圈参数——按线圈电压与电阻（或直接给线圈电流）算出吸合电流；
        ② 驱动器件——NPN 按强制 β（默认 10，深度饱和口径）算基极电流与基极电阻并吸附 E24，校验 Vin 驱动裕量；
        N-MOSFET 给门极电阻（100Ω~1k 权衡注记）与 Vgs 导通校验，3.3V 驱动提示 Logic-level 型；
        ③ 续流二极管——必加提示与 1N4148 / 1N4007 口径选择。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        基极电流按深度饱和口径强制 β ≈ 10 取值（经验上过驱动 2~5 倍即可饱和，10 倍是留足余量的惯例；越大 VCE(sat) 越低但关断越慢）。
        自核锚点：12 V / 400 Ω 线圈 → Ic = 30 mA；强制 β = 10 → Ib = 3 mA；Vin = 5 V → Rb = 4.3 V / 3 mA ≈ 1.433 kΩ → 吸附 E24 1.5 kΩ。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主流程区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 第一步：线圈参数 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Gauge class="w-5 h-5 mr-2 text-primary" /> 第一步 · 线圈参数与吸合电流
            </h2>
            <span class="text-xs text-muted-foreground">步骤 1 / 3</span>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">线圈电压 Vcoil（V）</label>
            <div class="flex flex-wrap items-center gap-1.5">
              <button
                v-for="v in vcoilOptions"
                :key="v"
                @click="vcoil = v"
                :class="Number(vcoil) === v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >{{ v }} V</button>
              <input
                id="rd-vcoil"
                v-model.number="vcoil"
                type="number"
                min="0"
                step="any"
                class="w-24 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
                aria-label="自定义线圈电压"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">线圈参数输入方式</label>
            <div class="grid grid-cols-2 gap-1.5 max-w-md">
              <button
                @click="coilMode = 'r'"
                :class="coilMode === 'r' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >线圈电阻 Rcoil</button>
              <button
                @click="coilMode = 'i'"
                :class="coilMode === 'i' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >线圈电流 Icoil</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              {{ coilMode === 'r' ? '线圈电阻用万用表直流档实测（几 V 档继电器常见几十 Ω~几 kΩ）。' : '按 datasheet「Coil Rating / 吸合电流」直接填写，无需再除电阻。' }}
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-if="coilMode === 'r'">
              <label for="rd-rcoil" class="block text-sm font-medium text-foreground mb-1.5">线圈电阻 Rcoil（Ω）</label>
              <input
                id="rd-rcoil"
                v-model.number="rcoil"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 400"
              >
            </div>
            <div v-else>
              <label for="rd-icoil" class="block text-sm font-medium text-foreground mb-1.5">线圈电流 Icoil（mA）</label>
              <input
                id="rd-icoil"
                v-model.number="icoilMa"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 30"
              >
            </div>
            <div v-if="coilCurrentA !== null" class="bg-primary/10 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">吸合电流（即集电极 / 漏极负载电流）</p>
              <p class="text-xl font-bold text-primary">Ic = {{ fmtMa(coilCurrentA * 1000) }} mA</p>
              <p class="text-xs text-muted-foreground mt-1">
                {{ coilMode === 'r' ? `Vcoil ${fmtV(vcoil)} V ÷ Rcoil ${fmtOhm(rcoil)}` : '按 datasheet 线圈电流直取' }}
              </p>
            </div>
          </div>
        </div>

        <!-- 第二步：驱动器件 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Cpu class="w-5 h-5 mr-2 text-primary" /> 第二步 · 驱动器件与电阻
            </h2>
            <span class="text-xs text-muted-foreground">步骤 2 / 3</span>
          </div>

          <div class="grid grid-cols-2 gap-1.5 max-w-md">
            <button
              @click="device = 'npn'"
              :class="device === 'npn' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >NPN 三极管（低边）</button>
            <button
              @click="device = 'mosfet'"
              :class="device === 'mosfet' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >N-MOSFET（低边）</button>
          </div>

          <!-- NPN 模式 -->
          <template v-if="device === 'npn'">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label for="rd-hfe" class="block text-sm font-medium text-foreground mb-1.5">hFE 直流增益</label>
                <input
                  id="rd-hfe"
                  v-model.number="hfe"
                  type="number"
                  min="1"
                  step="any"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 100"
                >
              </div>
              <div>
                <label for="rd-beta" class="block text-sm font-medium text-foreground mb-1.5">强制 β（饱和口径）</label>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="b in forcedBetaOptions"
                    :key="b"
                    @click="forcedBeta = b"
                    :class="Number(forcedBeta) === b ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                    class="px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
                  >{{ b }}</button>
                  <input
                    id="rd-beta"
                    v-model.number="forcedBeta"
                    type="number"
                    min="1"
                    step="any"
                    class="w-16 px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
                    aria-label="自定义强制β"
                  >
                </div>
                <p class="text-xs text-muted-foreground mt-1">默认 10 为深度饱和惯例</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1.5">驱动电压 Vin（V）</label>
                <div class="flex flex-wrap items-center gap-1.5">
                  <button
                    v-for="v in vinOptions"
                    :key="v"
                    @click="vin = v"
                    :class="Number(vin) === v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                    class="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  >{{ v }} V</button>
                  <input
                    id="rd-vin"
                    v-model.number="vin"
                    type="number"
                    min="0"
                    step="any"
                    class="w-20 px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
                    aria-label="自定义驱动电压"
                  >
                </div>
                <p class="text-xs text-muted-foreground mt-1">MCU / 逻辑电平输出</p>
              </div>
            </div>

            <template v-if="npnResult">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="bg-muted/50 rounded-lg p-4">
                  <p class="text-xs text-muted-foreground mb-1">基极电流 Ib = Ic / 强制 β</p>
                  <p class="text-xl font-bold text-primary">{{ fmtMa(npnResult.ibA * 1000) }} mA</p>
                  <p class="text-xs text-muted-foreground mt-1">{{ fmtMa(npnResult.icA * 1000) }} mA ÷ {{ fmtNum(forcedBeta, 4) }}</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-4">
                  <p class="text-xs text-muted-foreground mb-1">计算值 Rb = (Vin − 0.7) / Ib</p>
                  <p class="text-xl font-bold text-foreground">{{ fmtOhm(npnResult.rbExact) }}</p>
                  <p class="text-xs text-muted-foreground mt-1">（{{ fmtV(vin) }} − 0.7）V ÷ {{ fmtMa(npnResult.ibA * 1000) }} mA</p>
                </div>
                <div class="bg-primary/10 rounded-lg p-4">
                  <p class="text-xs text-muted-foreground mb-1">吸附 E24 标称值</p>
                  <p class="text-xl font-bold text-primary">{{ npnResult.rbE24 === null ? '—' : fmtOhm(npnResult.rbE24) }}</p>
                  <p class="text-xs text-muted-foreground mt-1">实装 Ib ≈ {{ fmtMa(npnResult.ibActual * 1000) }} mA，Rb 功耗 ≈ {{ fmtMw(npnResult.prbW * 1000) }} mW</p>
                </div>
              </div>
              <p class="text-xs leading-relaxed text-muted-foreground bg-muted/50 border border-border rounded-lg p-3">
                过驱动系数口径：当前等效过驱动 = hFE ÷ 强制 β = {{ fmtNum(npnResult.overdrive, 4) }} 倍。
                经验上按 hFE 过驱动 2~5 倍即可进入饱和（对 hFE = {{ fmtNum(hfe, 4) }} 相当于强制 β ≈ {{ fmtNum(hfe / 5, 3) }}~{{ fmtNum(hfe / 2, 3) }}），
                强制 β = 10 是留足余量的深饱和惯例——VCE(sat) 更低更稳，但基极存储电荷更多、关断变慢，驱动功耗也更大，按开关频率权衡。
                吸附到 E24 后若取更小一档（如 {{ npnResult.rbDown === null ? '—' : fmtOhm(npnResult.rbDown) }}），Ib 更大、饱和更稳；取更大一档则需复核饱和深度。
              </p>
              <div
                class="flex items-start gap-2 rounded-lg p-3 border"
                :class="vinCheck.level === 'ok' ? 'bg-muted/50 border-border' : vinCheck.level === 'warn' ? 'bg-yellow-500/5 border-yellow-400/30' : 'bg-red-500/5 border-red-400/30'"
              >
                <AlertTriangle v-if="vinCheck.level === 'warn'" class="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <XCircle v-else-if="vinCheck.level === 'fail'" class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <CheckCircle v-else class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p class="text-xs leading-relaxed text-muted-foreground">
                  <span class="text-foreground font-medium">Vin 口径校验：</span>{{ vinCheck.text }}
                </p>
              </div>
            </template>
            <div v-else class="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
              先在第一步得到吸合电流，再填写 hFE、强制 β 与 Vin（均 &gt; 0）
            </div>
          </template>

          <!-- MOSFET 模式 -->
          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="rd-rg" class="block text-sm font-medium text-foreground mb-1.5">门极电阻 Rg（Ω）</label>
                <input
                  id="rd-rg"
                  v-model.number="rg"
                  type="number"
                  min="0"
                  step="any"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 100"
                >
                <p class="text-xs text-muted-foreground mt-1">常用 100Ω~1kΩ</p>
              </div>
              <div>
                <label for="rd-vgsth" class="block text-sm font-medium text-foreground mb-1.5">Vgs(th) 阈值电压（V）</label>
                <input
                  id="rd-vgsth"
                  v-model.number="vgsTh"
                  type="number"
                  min="0"
                  step="any"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 2"
                >
                <p class="text-xs text-muted-foreground mt-1">查 datasheet VGS(th) 档</p>
              </div>
            </div>

            <template v-if="mosfetResult">
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-xs text-muted-foreground mb-1">门极电阻取值口径（开关速度 vs 栅极环路）</p>
                <p class="text-xl font-bold text-primary">Rg = {{ fmtOhm(rg) }}</p>
                <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  常用 100Ω~1kΩ：Rg 小则开关沿快、开关损耗低，但栅极环路电感与 Ciss 容易振铃、EMI 变差；
                  Rg 大则沿变缓、继电器吸合沿拖长、开关损耗上升。与驱动器峰值电流和栅极环路布局折中，继电器这类慢负载取中间值即可。
                </p>
              </div>
              <div
                class="flex items-start gap-2 rounded-lg p-3 border"
                :class="mosfetResult.vgsOk ? 'bg-muted/50 border-border' : 'bg-yellow-500/5 border-yellow-400/30'"
              >
                <CheckCircle v-if="mosfetResult.vgsOk" class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <AlertTriangle v-else class="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p class="text-xs leading-relaxed text-muted-foreground">
                  <span class="text-foreground font-medium">Vgs 校验：</span>{{ mosfetResult.vgsText }}
                </p>
              </div>
              <p class="text-xs leading-relaxed text-muted-foreground bg-muted/50 border border-border rounded-lg p-3">
                Vgs(th) 只是开始导通的门槛（通常在 250 µA 下定义），不代表低内阻导通——请按 datasheet 在 Vgs = Vin 下的 RDS(on) 与转移特性曲线复核：
                保证 Vgs = Vin 时漏极电流 ≥ 吸合电流且 RDS(on) 引入的压降与温升可接受。继电器为慢负载，MOSFET 导通电阻发热可按 Id² × RDS(on) 估算。
              </p>
            </template>
            <div v-else class="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
              先在第一步得到吸合电流，再填写 Rg 与 Vgs(th)（均 &gt; 0）
            </div>
          </template>
        </div>

        <!-- 第三步：续流二极管 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <AlertTriangle class="w-5 h-5 mr-2 text-primary" /> 第三步 · 续流二极管（必加）
            </h2>
            <span class="text-xs text-muted-foreground">步骤 3 / 3</span>
          </div>

          <div class="flex items-start gap-2 rounded-lg p-3 bg-red-500/5 border border-red-400/30">
            <XCircle class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p class="text-xs leading-relaxed text-muted-foreground">
              <span class="text-foreground font-medium">没有续流二极管，驱动管必坏：</span>
              线圈是感性负载，关断瞬间 dI/dt 极大，线圈两端反向感应电压可达数十至数百伏，
              直接击穿 NPN 的 C-E 或 MOSFET 的 D-S。必须在线圈两端反并联一只二极管（阴极接 +Vcoil），为关断电流提供续流路径。
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="rounded-lg p-3 bg-muted/50 border border-border">
              <p class="text-sm font-medium text-foreground">1N4148（小信号口径）</p>
              <ul class="list-disc pl-5 mt-1.5 space-y-1 text-xs text-muted-foreground leading-relaxed">
                <li>线圈电流 ≤ 约 100 mA 的小信号继电器（如干簧管、超小型信号继电器）</li>
                <li>开关频繁、要求释放沿快的场合（结电容与恢复特性好）</li>
                <li>平均正向电流 150~200 mA 档，勿用于 12V/30mA 以上功率继电器长期吸放</li>
              </ul>
            </div>
            <div class="rounded-lg p-3 bg-muted/50 border border-border">
              <p class="text-sm font-medium text-foreground">1N4007（整流口径）</p>
              <ul class="list-disc pl-5 mt-1.5 space-y-1 text-xs text-muted-foreground leading-relaxed">
                <li>常见 5 / 12 / 24 V 功率继电器（线圈电流几十 mA 到几百 mA）的默认选择</li>
                <li>1 A 平均正向电流、1000 V 反向耐压，余量大、成本低</li>
                <li>更大电流 / 更快释放可换肖特基（如 SS34）或稳压管串联方案</li>
              </ul>
            </div>
          </div>

          <p class="text-xs leading-relaxed text-muted-foreground bg-muted/50 border border-border rounded-lg p-3">
            释放时间注记：并联续流二极管后线圈电流缓慢衰减，继电器释放时间会变长（常开触点断开沿拖尾、触点寿命与安全联锁需评估）；
            要求快释放时改用「二极管 + 稳压管串联」或二极管 + TVS 抬高关断钳位（钳位越高释放越快，但驱动管承受电压越高，需核对 VCEO / VDS），
            或选自带高压钳位续流的驱动 IC。触点侧的灭弧与防护可配合
            <NuxtLink to="/tools/tvs-selector" class="text-primary hover:underline">TVS选型校验器</NuxtLink> 核算。
          </p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 结果汇总卡 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <ClipboardCheck class="w-4 h-4 mr-2 text-primary" /> 驱动方案汇总
          </h3>
          <div class="space-y-2 text-xs">
            <div class="flex gap-2 items-start">
              <span class="flex-shrink-0 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">线圈</span>
              <p class="text-muted-foreground leading-relaxed">{{ summaryCoil }}</p>
            </div>
            <div class="flex gap-2 items-start">
              <span class="flex-shrink-0 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">驱动</span>
              <p class="text-muted-foreground leading-relaxed">{{ summaryDrive }}</p>
            </div>
            <div class="flex gap-2 items-start">
              <span class="flex-shrink-0 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">校验</span>
              <p class="text-muted-foreground leading-relaxed">{{ summaryCheck }}</p>
            </div>
            <div class="flex gap-2 items-start">
              <span class="flex-shrink-0 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">续流</span>
              <p class="text-muted-foreground leading-relaxed">{{ summaryFlyback }}</p>
            </div>
          </div>
          <div class="bg-primary/10 rounded-lg p-3">
            <p class="text-xs leading-relaxed text-foreground">{{ advice }}</p>
          </div>
          <button
            @click="copySummary"
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
          >
            <Copy class="w-3.5 h-3.5" /> 复制驱动方案
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>为什么必须加续流二极管</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          继电器线圈是感性负载，电感电流不能突变。驱动管关断的瞬间线圈电流没有别的去处，dI/dt 在线圈两端感应出反向电动势
          V = L·dI/dt——几十 mH 的线圈在几 µs 内被切断时，反电动势轻松上百伏，远超 NPN 的 VCEO（常见 40~80 V）
          或 MOSFET 的 VDS 击穿值，驱动管当场雪崩损坏。在线圈两端反并联一只二极管（阴极接电源正、阳极接驱动管集电极 / 漏极），
          关断时线圈电流经二极管续流缓慢衰减，反电动势被钳在「电源电压 + 二极管压降」附近。
          口径：小信号继电器（≤100 mA）用 1N4148，常见功率继电器用 1N4007（1 A 整流口径），
          更大电流换肖特基或按 datasheet 复核。代价是释放时间变长，要求快释放用二极管 + 稳压管串联抬高钳位。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>饱和区与线性区：强制 β 口径的由来</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          NPN 开关继电器要工作在<strong>深度饱和区</strong>：基极电流足够大时 VCE(sat) 只有 0.1~0.3 V，
          管子功耗 ≈ Ic × VCE(sat)，30 mA 吸合电流下不到 10 mW，几乎不发热。若只按 hFE 给基极电流（如 Ic/100），
          管子停在放大区（线性区），VCE 可能高达数伏，功耗 Ic × VCE 翻几十倍，管子发热甚至烧毁——「按 hFE 算 Ib」是开关应用最常见的错误。
          工程惯例按<strong>强制 β ≈ 10</strong>取基极电流（相当于按 hFE 过驱动 2~5 倍以上，hFE = 100 时强制 β = 10 即过驱动 10 倍），
          保证任何温度、任何批次下都饱和。强制 β 越大饱和越深越稳，但基极超量存储电荷越多、关断存储时间越长，
          高频开关场景要权衡；继电器属毫秒级慢负载，取 10 即可。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>低电平与高电平触发</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          继电器接哪一端决定了驱动拓扑。<strong>低边开关</strong>：继电器线圈接电源正，NPN / N-MOSFET 在线圈与地之间，
          MCU 输出高电平吸合——NPN 发射极接地、基极电阻一端接 MCU，电平关系简单，是最常用拓扑，本工具即按低边 NPN / NMOS 计算。
          <strong>高边开关</strong>：线圈接地，开关管在电源正与线圈之间——用 PNP / P-MOSFET 时控制电平「拉低吸合」（低电平触发），
          且基极 / 门极要上拉到电源保证关断；电源高于 MCU 电压时不能直驱，需加一级 NPN 电平移位，或用集成高边驱动 / 自举驱动。
          选错拓扑的典型症状：PNP 高边管关不死（漏电流吸合）、或电源电压高于 MCU 时基极反向偏置失效。另外注意继电器线圈额定电压：
          欠压吸合会触点抖动、寿命骤降，不能为省电随意降压驱动。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>达林顿阵列 ULN2003：多路继电器的省事方案</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          需要驱动多路继电器时，ULN2003（7 路 NPN 达林顿）把基极电阻、续流二极管一次配齐：内置约 2.7 kΩ 基极串联电阻，
          5 V 甚至 3.3 V 逻辑可直接推，无需外算 Rb；各通道续流二极管共阳引出到 COM 脚，接上线圈电源即完成续流配置；
          单通道额定 500 mA，多通道并联可扩流。代价是达林顿结构饱和压降高（约 0.9~1.2 V），线圈实际得到的电压是电源减去这一截，
          5 V 继电器配 5 V 电源时余量偏紧，宜选 6 V 线圈或提高供电。类似器件还有 ULN2803（8 路）。
          驱动逻辑与引脚速查可用
          <NuxtLink to="/tools/logic-ic-truth-table" class="text-primary hover:underline">74/4000系列速查</NuxtLink>，
          光耦隔离驱动见
          <NuxtLink to="/tools/optocoupler-resistor" class="text-primary hover:underline">光耦电阻计算</NuxtLink>。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">继电器驱动基极电阻怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              先算吸合电流 Ic = Vcoil / Rcoil（或按 datasheet 直取），再按强制 β ≈ 10 取 Ib = Ic / 10，
              最后 Rb = (Vin − 0.7) / Ib 并吸附 E24 标称值。例：12 V / 400 Ω 线圈 → Ic = 30 mA，Ib = 3 mA，
              Vin = 5 V → Rb ≈ 1.43 kΩ → 取 E24 1.5 kΩ。要求更稳饱和可取小一档。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">续流二极管怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              线圈电流 ≤100 mA 的小信号继电器用 1N4148；常见 5/12/24 V 功率继电器用 1N4007（1 A 整流口径）。
              二极管反向耐压需高于线圈电源电压，正向电流需覆盖线圈电流。要加快释放可用二极管 + 稳压管串联抬高钳位，
              但需核对驱动管的耐压。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">3.3 V 单片机能直接驱动继电器吗？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              GPIO 直灌不行——继电器线圈电流几十 mA 起，远超 IO 能力，必须加驱动级。3.3 V 电平下 NPN 基极驱动裕量尚可
              （本工具 Vin 口径校验会提示），大电流线圈建议改用 Logic-level MOSFET（Vgs(th) ≤ 1~2 V、查 Vgs = 3.3 V 下的 RDS(on)）
              或 ULN2003 达林顿阵列。3.3 V 驱动 MOSFET 必须选 Logic-level 型，普通阈值管在 3.3 V 下导通不充分会发热。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么继电器加了续流二极管后释放变慢？</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              续流回路把线圈电流钳成缓慢衰减，衔铁要等电流降到释放值以下才弹开。要求快释放时用二极管 + 稳压管串联
              （或 TVS）抬高关断钳位、加快电流衰减，或在触点逻辑上容忍这段延时；钳位越高释放越快，但驱动管承受电压越高。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'relay-driver-calc'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Zap, Gauge, Cpu, ClipboardCheck, Info, AlertTriangle, CheckCircle, XCircle,
  ChevronUp, ChevronDown, Copy, Link as LinkIcon
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'relay-driver-calc'
const STORAGE_KEY = 'relay-driver-calc.inputs'

// SEO
useSeoMeta({
  title: '继电器驱动电阻计算器 - 线圈电流与NPN基极/MOSFET门极电阻',
  description: '在线继电器驱动计算器：线圈吸合电流 Ic=Vcoil/Rcoil，NPN 按强制 β=10 饱和口径算基极电阻并吸附 E24，MOSFET 门极电阻与 Vgs 导通校验，续流二极管 1N4148/1N4007 必加提示，纯本地计算',
  keywords: '继电器驱动, 基极电阻计算, 线圈电流, 续流二极管, relay driver calculator, 强制beta, uln2003',
  author: 'Util工具箱',
  ogTitle: '继电器驱动电阻计算器 - 有条工具',
  ogDescription: '线圈电流、基极电阻与门极电阻计算，饱和口径与续流二极管校验',
  ogUrl: 'https://www.util.cn/tools/relay-driver-calc',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '继电器驱动电阻计算器',
  twitterDescription: 'NPN / MOSFET 继电器驱动电阻计算与续流二极管校验，纯本地计算'
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
          name: '继电器驱动电阻计算器',
          url: 'https://www.util.cn/tools/relay-driver-calc',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '线圈吸合电流计算（电阻 / 电流两种输入）',
            'NPN 基极电阻计算（强制 β=10 饱和口径）与 E24 吸附',
            'MOSFET 门极电阻与 Vgs 导通校验',
            '3.3V 驱动 Logic-level 提示',
            '续流二极管 1N4148 / 1N4007 口径指引'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '继电器驱动电阻计算器', item: 'https://www.util.cn/tools/relay-driver-calc/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '继电器驱动基极电阻怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: 'Ic = Vcoil/Rcoil，按强制 β≈10 取 Ib = Ic/10（深度饱和口径），Rb = (Vin − 0.7)/Ib 并吸附 E24。例：12V/400Ω 线圈 → Ic=30mA，Ib=3mA，Vin=5V → Rb≈1.43kΩ → 取 1.5kΩ。' }
            },
            {
              '@type': 'Question',
              name: '为什么继电器线圈必须加续流二极管？',
              acceptedAnswer: { '@type': 'Answer', text: '线圈是感性负载，关断瞬间 dI/dt 感应出数十至数百伏反电动势会击穿驱动管。需在线圈两端反并联二极管提供续流路径：小信号继电器用 1N4148，常见功率继电器用 1N4007（1A 整流口径）。' }
            },
            {
              '@type': 'Question',
              name: '3.3V 单片机能直接驱动继电器吗？',
              acceptedAnswer: { '@type': 'Answer', text: 'GPIO 不能直灌，需加驱动级。小电流线圈可用 NPN（校验 Vin 口径）；大电流建议 Logic-level MOSFET 或 ULN2003 达林顿阵列。3.3V 驱动 MOSFET 必须选 Logic-level 型。' }
            },
            {
              '@type': 'Question',
              name: '为什么加了续流二极管后继电器释放变慢？',
              acceptedAnswer: { '@type': 'Answer', text: '续流回路把线圈电流钳成缓慢衰减，衔铁要等电流降到释放值以下才弹开。要快释放可用二极管+稳压管串联抬高关断钳位，钳位越高释放越快，但驱动管承受电压越高。' }
            }
          ]
        }
      ]
    })
  }]
})

// __PURE_FNS_START__
// ---------- 继电器驱动计算纯函数（无外部依赖） ----------
// 吸合电流：Ic = Vcoil / Rcoil（A）
const coilCurrentFromR = (vcoil, rcoil) => {
  const v = Number(vcoil), r = Number(rcoil)
  if (!isFinite(v) || v <= 0 || !isFinite(r) || r <= 0) return NaN
  return v / r
}

// 基极电流：Ib = Ic / 强制β（A）；强制β=10 为深度饱和口径
const baseCurrentA = (icA, forcedBeta) => {
  const i = Number(icA), b = Number(forcedBeta)
  if (!isFinite(i) || i <= 0 || !isFinite(b) || b <= 0) return NaN
  return i / b
}

// 基极电阻：Rb = (Vin − VBE) / Ib（VBE 取 0.7 V 硅结口径）
const rbOhm = (vin, ibA, vbe = 0.7) => {
  const v = Number(vin), i = Number(ibA), vb = Number(vbe)
  if (!isFinite(v) || v <= 0 || !isFinite(i) || i <= 0 || !isFinite(vb)) return NaN
  if (v <= vb) return NaN
  return (v - vb) / i
}

// E24 标称值系列（1Ω~9.1MΩ）
const E24_MANTISSAS = [1, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2, 2.2, 2.4, 2.7, 3, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1]

// 吸附 E24：取数值最接近的标称值；超出 9.1MΩ 取上限档
const snapE24Nearest = (x) => {
  const v = Number(x)
  if (!isFinite(v) || v <= 0) return null
  let best = null
  let bestDiff = Infinity
  for (let d = 0; d <= 6; d++) {
    for (const m of E24_MANTISSAS) {
      const val = m * Math.pow(10, d)
      const diff = Math.abs(val - v)
      if (diff < bestDiff - 1e-12) { bestDiff = diff; best = val }
    }
  }
  return best
}

// 吸附后实装参数：实装 Ib 与 Rb 功耗
const ibWithRb = (vin, rb, vbe = 0.7) => {
  const v = Number(vin), r = Number(rb), vb = Number(vbe)
  if (!isFinite(v) || !isFinite(r) || r <= 0 || v <= vb) return NaN
  return (v - vb) / r
}
const prbWatt = (vin, ibA, vbe = 0.7) => {
  const v = Number(vin), i = Number(ibA), vb = Number(vbe)
  if (!isFinite(v) || !isFinite(i) || i <= 0) return NaN
  return (v - vb) * i
}

// 过驱动系数 = hFE / 强制β
const overdrive = (h, b) => {
  const hh = Number(h), bb = Number(b)
  if (!isFinite(hh) || hh <= 0 || !isFinite(bb) || bb <= 0) return NaN
  return hh / bb
}

// E24 向下一档（数值更小且不等于吸附值的最近档）
const e24Below = (x) => {
  const v = Number(x)
  if (!isFinite(v) || v <= 0) return null
  let best = null
  let bestDiff = Infinity
  for (let d = 0; d <= 6; d++) {
    for (const m of E24_MANTISSAS) {
      const val = m * Math.pow(10, d)
      if (val < v - 1e-9 && v - val < bestDiff) { bestDiff = v - val; best = val }
    }
  }
  return best
}

// Vin 口径校验（NPN）：Vin 需显著高于 VBE 才有驱动裕量
const vinCheckLevel = (vin) => {
  const v = Number(vin)
  if (!isFinite(v) || v <= 0) return null
  if (v <= 0.7) return 'fail'
  if (v <= 2.5) return 'warn'
  return 'ok'
}

// MOSFET Vgs 校验：Vin ≥ 2×Vgs(th) 视为阈值裕量充足
const vgsCheck = (vin, vgsTh) => {
  const v = Number(vin), t = Number(vgsTh)
  if (!isFinite(v) || v <= 0 || !isFinite(t) || t <= 0) return null
  return { ratio: v / t, ok: v >= 2 * t }
}

// 展示格式化（避免浮点尾差）
const fmtNum = (v, sig = 4) => (isFinite(v) ? Number(v.toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '—')
const fmtV = (v, sig = 4) => (isFinite(v) && v > 0 ? Number(v.toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '—')
const fmtMa = (v, sig = 4) => (isFinite(v) && v > 0 ? Number(v.toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '—')
const fmtMw = (v, sig = 4) => (isFinite(v) && v > 0 ? Number(v.toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '—')
const fmtOhm = (v, sig = 4) => {
  if (!isFinite(v) || v <= 0) return '—'
  const n = Number(v.toPrecision(sig))
  if (n >= 1e6) return `${Number((n / 1e6).toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 })} MΩ`
  if (n >= 1e3) return `${Number((n / 1e3).toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 })} kΩ`
  return `${n.toLocaleString('zh-CN', { maximumFractionDigits: 4 })} Ω`
}
// __PURE_FNS_END__

// ---------- 状态 ----------
const vcoilOptions = [5, 12, 24]
const vinOptions = [3.3, 5, 12]
const forcedBetaOptions = [10, 20, 50]

const vcoil = ref(12)
const coilMode = ref('r')
const rcoil = ref(400)
const icoilMa = ref(30)
const device = ref('npn')
const hfe = ref(100)
const forcedBeta = ref(10)
const vin = ref(5)
const rg = ref(100)
const vgsTh = ref(2)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 输入持久化（键前缀为工具 id）
watch([vcoil, coilMode, rcoil, icoilMa, device, hfe, forcedBeta, vin, rg, vgsTh], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      vcoil: vcoil.value,
      coilMode: coilMode.value,
      rcoil: rcoil.value,
      icoilMa: icoilMa.value,
      device: device.value,
      hfe: hfe.value,
      forcedBeta: forcedBeta.value,
      vin: vin.value,
      rg: rg.value,
      vgsTh: vgsTh.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  // 恢复上次输入
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      const num = (v, min) => (typeof v === 'number' && isFinite(v) && v > (min === undefined ? -Infinity : min) ? v : null)
      const vc = num(s.vcoil, 0)
      if (vc !== null) vcoil.value = vc
      if (s.coilMode === 'r' || s.coilMode === 'i') coilMode.value = s.coilMode
      const rc = num(s.rcoil, 0)
      if (rc !== null) rcoil.value = rc
      const im = num(s.icoilMa, 0)
      if (im !== null) icoilMa.value = im
      if (s.device === 'npn' || s.device === 'mosfet') device.value = s.device
      const hf = num(s.hfe, 0)
      if (hf !== null) hfe.value = hf
      const fb = num(s.forcedBeta, 0)
      if (fb !== null) forcedBeta.value = fb
      const vi = num(s.vin, 0)
      if (vi !== null) vin.value = vi
      const g = num(s.rg, 0)
      if (g !== null) rg.value = g
      const vt = num(s.vgsTh, 0)
      if (vt !== null) vgsTh.value = vt
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})

// ---------- 计算 ----------
const coilCurrentA = computed(() => {
  if (coilMode.value === 'r') {
    const i = coilCurrentFromR(vcoil.value, rcoil.value)
    return isFinite(i) ? i : null
  }
  const i = Number(icoilMa.value) / 1000
  return isFinite(i) && i > 0 ? i : null
})

const npnResult = computed(() => {
  if (coilCurrentA.value === null) return null
  const icA = coilCurrentA.value
  const ibA = baseCurrentA(icA, forcedBeta.value)
  if (!isFinite(ibA)) return null
  const rbExact = rbOhm(vin.value, ibA)
  if (!isFinite(rbExact)) return null
  const rbE24 = snapE24Nearest(rbExact)
  const ibActual = rbE24 !== null ? ibWithRb(vin.value, rbE24) : NaN
  const prbW = prbWatt(vin.value, ibA)
  const od = overdrive(hfe.value, forcedBeta.value)
  const rbDown = e24Below(rbExact)
  return { icA, ibA, rbExact, rbE24, ibActual, prbW, overdrive: od, rbDown }
})

const vinCheck = computed(() => {
  const level = vinCheckLevel(vin.value)
  if (!level) return { level: 'ok', text: '待填写 Vin' }
  const headroom = Number(vin.value) - 0.7
  if (level === 'fail') {
    return { level, text: `Vin = ${fmtV(vin.value)} V 未高于 VBE(0.7 V)，NPN 无法可靠导通，请提高驱动电压或改用 MOSFET / 达林顿。` }
  }
  if (level === 'warn') {
    return { level, text: `Vin = ${fmtV(vin.value)} V，驱动裕量（Vin − 0.7 = ${fmtV(headroom)} V）偏小，大电流线圈时基极电流受限、饱和深度不足；核对实装 Ib 是否仍满足强制 β 口径，必要时改用 MOSFET 或达林顿。` }
  }
  return { level, text: `Vin = ${fmtV(vin.value)} V，驱动裕量（Vin − 0.7 = ${fmtV(headroom)} V）常规口径可用${Number(vin.value) <= 3.3 ? '；3.3 V 逻辑驱动时基极电流上限较低，大电流线圈建议 Logic-level MOSFET 或达林顿。' : '。'}` }
})

const mosfetResult = computed(() => {
  if (coilCurrentA.value === null) return null
  const chk = vgsCheck(vin.value, vgsTh.value)
  if (!chk) return null
  const vgsText = chk.ok
    ? `Vgs = ${fmtV(vin.value)} V ≥ 2 × Vgs(th)（${fmtV(vgsTh.value)} V），阈值裕量 ${fmtNum(chk.ratio, 3)} 倍${Number(vin.value) <= 3.3 ? '；3.3 V 驱动必须选 Logic-level 型（Vgs(th) ≤ 1~2 V），并按 Vgs = 3.3 V 下的 RDS(on) 曲线复核导通电阻。' : '。'}`
    : `Vgs = ${fmtV(vin.value)} V 仅 ${fmtNum(chk.ratio, 3)} 倍 Vgs(th)（${fmtV(vgsTh.value)} V），阈值裕量不足。${Number(vin.value) <= 3.3 ? '3.3 V 驱动需选 Logic-level 型（Vgs(th) 典型 1~2 V）' : '请换低阈值管或提高驱动电压'}，并按 datasheet 在 Vgs = Vin 下的转移特性确认漏极电流覆盖吸合电流。`
  return { idA: coilCurrentA.value, vgsOk: chk.ok, vgsText }
})

// ---------- 汇总 ----------
const summaryCoil = computed(() => {
  if (coilCurrentA.value === null) return '待填写线圈电压与电阻 / 电流'
  return `Vcoil ${fmtV(vcoil.value)} V，Ic = ${fmtMa(coilCurrentA.value * 1000)} mA（${coilMode.value === 'r' ? `Rcoil ${fmtOhm(rcoil.value)}` : '按 datasheet 电流'}）`
})
const summaryDrive = computed(() => {
  if (device.value === 'npn') {
    if (!npnResult.value) return 'NPN：待填写 hFE / 强制 β / Vin'
    const r = npnResult.value
    return `NPN：Ib = ${fmtMa(r.ibA * 1000)} mA（强制 β ${fmtNum(forcedBeta.value, 4)}），Rb ${r.rbE24 === null ? '—' : fmtOhm(r.rbE24)}（计算 ${fmtOhm(r.rbExact)} → E24）`
  }
  if (!mosfetResult.value) return 'N-MOSFET：待填写 Rg / Vgs(th)'
  return `N-MOSFET：Rg ${fmtOhm(rg.value)}，Id = ${fmtMa(mosfetResult.value.idA * 1000)} mA`
})
const summaryCheck = computed(() => {
  if (device.value === 'npn') {
    const level = vinCheck.value.level
    const ok = level === 'ok'
    return `Vin ${fmtV(vin.value)} V 口径${ok ? '可用' : level === 'warn' ? '偏紧（裕量小）' : '不足（≤VBE）'}；等效过驱动 ${npnResult.value && isFinite(npnResult.value.overdrive) ? fmtNum(npnResult.value.overdrive, 4) : '—'} 倍`
  }
  if (!mosfetResult.value) return '待填写 Vgs(th)'
  return mosfetResult.value.vgsOk ? 'Vgs 阈值裕量充足' : 'Vgs 阈值裕量不足，需 Logic-level 型'
})
const summaryFlyback = computed(() => {
  if (coilCurrentA.value === null) return '待定（先算吸合电流）'
  const icMa = coilCurrentA.value * 1000
  return `必加：${icMa <= 100 ? '1N4148（小信号口径）' : '1N4007（整流口径）'}，反并联于线圈两端（阴极接 +Vcoil）`
})

const advice = computed(() => {
  const parts = []
  if (coilCurrentA.value !== null) {
    parts.push(`吸合电流 ${fmtMa(coilCurrentA.value * 1000)} mA。`)
    if (device.value === 'npn') {
      if (npnResult.value) {
        const r = npnResult.value
        parts.push(`NPN 低边驱动：Rb 取 ${r.rbE24 === null ? '—' : fmtOhm(r.rbE24)}（实装 Ib ≈ ${fmtMa(r.ibActual * 1000)} mA，强制 β ${fmtNum(forcedBeta.value, 4)} 深饱和口径）。`)
      }
      if (vinCheck.value.level === 'fail') parts.push('Vin 不足以导通 NPN，先解决驱动电平。')
      else if (vinCheck.value.level === 'warn') parts.push('Vin 驱动裕量偏小，优先考虑 MOSFET 或达林顿方案。')
    } else if (mosfetResult.value) {
      parts.push(`N-MOSFET 低边驱动：Rg ${fmtOhm(rg.value)}，${mosfetResult.value.vgsOk ? 'Vgs 裕量充足' : 'Vgs 裕量不足，换 Logic-level 型'}。`)
    }
    parts.push(`续流二极管必加（${coilCurrentA.value * 1000 <= 100 ? '1N4148' : '1N4007'} 口径）。`)
  }
  return (parts.length ? parts.join(' ') : '按三步填写后此处给出综合建议。') + '结论为工程估算，正式设计以器件 datasheet 为准。'
})

const copySummary = () => {
  const lines = [
    '继电器驱动方案汇总',
    `线圈：${summaryCoil.value}`,
    `驱动：${summaryDrive.value}`,
    `校验：${summaryCheck.value}`,
    `续流：${summaryFlyback.value}`,
    `综合建议：${advice.value}`
  ]
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      alert('已复制驱动方案到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动选择文本复制')
    })
  } else {
    alert('当前环境不支持剪贴板，请手动选择文本复制')
  }
}

// ---------- 相关工具 ----------
const relatedLinks = computed(() => ['optocoupler-resistor', 'tvs-selector', 'logic-ic-truth-table']
  .map((id) => tools.find((t) => t.id === id))
  .filter(Boolean))
</script>
