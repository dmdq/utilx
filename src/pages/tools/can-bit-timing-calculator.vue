<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Cable class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">CAN 位定时计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">时钟 × 波特率求 BRP/TSEG1/TSEG2/SJW 与采样点，经典 CAN 与 CAN FD 双相位</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 CAN 位定时计算器：按 CAN 时钟频率与目标波特率枚举分频系数 BRP 与位时间 Tq 数（Ntq），
        输出误差最小的 TSEG1/TSEG2/SJW 分配、实际采样点位置与波特率误差（百分比 + ppm 双显），
        附按「误差 → 采样点偏差 → Tq 数」排序的备选方案 Top5；CAN FD 模式下仲裁相位与数据相位两套参数分别求解。
        输出通用 Tq 时序参数（不做各家 IP 的寄存器位段编码），全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        位时序口径：1 位 = 同步段 SYNC_SEG（固定 1 Tq）+ TSEG1 + TSEG2，即 Ntq = 1 + TSEG1 + TSEG2；
        采样点 SP = (1 + TSEG1) ÷ Ntq，波特率 = CAN 时钟 ÷（BRP × Ntq）。
        搜索算法：枚举 BRP（1..512）× Ntq（4..385 合理域），|实际波特率 − 目标| 最小者优先，并列时取采样点偏差最小，
        再并列取 Ntq 更大者（Tq 粒度更细）；约束 TSEG1 ≥ 1、TSEG2 ≥ 1、TSEG1 ≥ TSEG2（惯例），SJW = min(TSEG2, 4)。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器列 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 位定时求解
          </h2>

          <!-- 模式切换 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">模式</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="setMode('classic')"
                :class="mode === 'classic' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >经典 CAN（单相位）</button>
              <button
                @click="setMode('fd')"
                :class="mode === 'fd' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >CAN FD（仲裁 + 数据双相位）</button>
            </div>
          </div>

          <!-- CAN 时钟 -->
          <div>
            <label for="cbt-clk" class="block text-sm font-medium text-foreground mb-1.5">CAN 时钟（MHz）</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="c in CLK_PRESETS"
                :key="c"
                @click="clkMhz = c"
                :class="clkMhz === c ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              >{{ c }} MHz</button>
            </div>
            <input
              id="cbt-clk"
              v-model.number="clkMhz"
              type="number"
              min="0.1"
              step="0.5"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 8"
            >
            <p class="text-xs text-muted-foreground mt-1">多数 MCU 的 CAN 外设挂在 APB/PCLK 下，常见 8/16/20/24/40/48/80 MHz；预设之外可直接输入</p>
          </div>

          <!-- 仲裁相位（经典 CAN）目标波特率 -->
          <div>
            <label for="cbt-baud" class="block text-sm font-medium text-foreground mb-1.5">{{ mode === 'fd' ? '仲裁相位波特率（kbps）' : '目标波特率（kbps）' }}</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="p in BAUD_PRESETS"
                :key="p.label"
                @click="baudKbps = p.kbps"
                :class="baudKbps !== null && Math.abs(baudKbps - p.kbps) < 1e-9 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              >{{ p.label }}</button>
            </div>
            <input
              id="cbt-baud"
              v-model.number="baudKbps"
              type="number"
              min="0.1"
              step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 500"
            >
          </div>

          <!-- 仲裁相位采样点 -->
          <div>
            <label for="cbt-sp" class="block text-sm font-medium text-foreground mb-1.5">{{ mode === 'fd' ? '仲裁相位采样点目标（%）' : '采样点目标（%）' }}</label>
            <input
              id="cbt-sp"
              v-model.number="spArbPct"
              type="number"
              min="50"
              max="95"
              step="0.5"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 87.5"
            >
            <p class="text-xs text-muted-foreground mt-1">经典 CAN 常见 75%~87.5%（CiA 惯例 87.5%）；采样点越靠后对长线传播延迟越宽容</p>
          </div>

          <!-- CAN FD 数据相位 -->
          <div v-if="mode === 'fd'" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/50">
            <div>
              <label for="cbt-fdbaud" class="block text-sm font-medium text-foreground mb-1.5">数据相位波特率（kbps）</label>
              <input
                id="cbt-fdbaud"
                v-model.number="fdBaudKbps"
                type="number"
                min="0.1"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 2000"
              >
              <p class="text-xs text-muted-foreground mt-1">常取仲裁相位的 2~8 倍（如 500k / 2000k 组合）</p>
            </div>
            <div>
              <label for="cbt-fdsp" class="block text-sm font-medium text-foreground mb-1.5">数据相位采样点目标（%）</label>
              <input
                id="cbt-fdsp"
                v-model.number="spDataPct"
                type="number"
                min="50"
                max="95"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 75"
              >
              <p class="text-xs text-muted-foreground mt-1">数据相位惯例 70%~80%（默认 75%）</p>
            </div>
          </div>

          <!-- 结果卡：经典 / 仲裁 + 数据（按相位渲染） -->
          <template v-for="ph in phases" :key="'res-' + ph.key">
            <div v-if="ph.sol" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
              <p class="text-sm font-medium text-foreground">{{ ph.label }}最优解</p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <p class="text-xs text-muted-foreground mb-1">BRP 分频</p>
                  <p class="text-xl font-bold text-foreground">{{ ph.sol.best.brp }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground mb-1">Ntq 每位 Tq 数</p>
                  <p class="text-xl font-bold text-foreground">{{ ph.sol.best.ntq }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground mb-1">TSEG1（Tq）</p>
                  <p class="text-xl font-bold text-foreground">{{ ph.sol.best.tseg1 }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground mb-1">TSEG2（Tq）</p>
                  <p class="text-xl font-bold text-foreground">{{ ph.sol.best.tseg2 }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground mb-1">SJW（Tq）</p>
                  <p class="text-xl font-bold text-foreground">{{ ph.sol.best.sjw }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground mb-1">实际采样点</p>
                  <p class="text-xl font-bold text-foreground">{{ fmtPct(ph.sol.best.sp) }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground mb-1">实际波特率</p>
                  <p class="text-xl font-bold text-foreground">{{ fmt(ph.sol.best.baud, 2) }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground mb-1">波特率误差</p>
                  <p class="text-xl font-bold" :class="errCls(ph.sol.best.errPct)">{{ errPctText(ph.sol.best.errPct) }}</p>
                  <p class="text-[11px] text-muted-foreground">{{ errPpmText(ph.sol.best.errPpm) }}</p>
                </div>
              </div>

              <!-- 位时序条（SYNC / TSEG1 / TSEG2，采样点在 TSEG1 末尾） -->
              <div class="pt-3 border-t border-primary/20 space-y-1.5">
                <div class="flex h-4 rounded overflow-hidden">
                  <div class="bg-primary/80" :style="{ width: (1 / ph.sol.best.ntq * 100) + '%' }"></div>
                  <div class="bg-primary/40" :style="{ width: (ph.sol.best.tseg1 / ph.sol.best.ntq * 100) + '%' }"></div>
                  <div class="bg-border" :style="{ width: (ph.sol.best.tseg2 / ph.sol.best.ntq * 100) + '%' }"></div>
                </div>
                <p class="text-[11px] text-muted-foreground">
                  SYNC_SEG 1 Tq ｜ TSEG1 {{ ph.sol.best.tseg1 }} Tq ｜ TSEG2 {{ ph.sol.best.tseg2 }} Tq——采样点在 TSEG1 结束处（{{ fmtPct(ph.sol.best.sp) }}），实际波特率 = {{ fmt(clkMhz, 4) }} MHz ÷（{{ ph.sol.best.brp }} × {{ ph.sol.best.ntq }}）
                </p>
              </div>
              <p class="text-xs text-muted-foreground leading-relaxed">
                共扫描 {{ ph.sol.total }} 组 BRP×Ntq 可行组合，按「波特率误差 → 采样点偏差 → Ntq 更大」排序取本组为最优。
              </p>
            </div>
            <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium text-foreground">{{ ph.label }}暂无法求解</p>
                <p class="text-xs text-muted-foreground mt-1">
                  请检查：CAN 时钟 &gt; 0、波特率 &gt; 0、采样点目标在 0~100% 之间；
                  若时钟相对波特率过高（超出 512 × 385 倍），搜索域内无解。
                </p>
              </div>
            </div>
          </template>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-border/50">
            <p class="text-xs leading-relaxed text-muted-foreground">
              本页输出通用 Tq 参数，不做芯片寄存器位段编码——bxCAN / M_CAN / FlexCAN 位段宽度与「写值 −1」口径各不相同，落寄存器请按所用 IP 手册换算。
            </p>
            <button
              @click="copyResult"
              class="px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition whitespace-nowrap"
            >
              <CheckCircle v-if="copyStatus === 'ok'" class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" />
              {{ copyStatus === 'ok' ? '已复制' : '复制参数 TSV' }}
            </button>
          </div>
        </div>

        <!-- 备选方案 Top5（按相位各一张表） -->
        <div v-for="ph in phases" :key="'alt-' + ph.key" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Table class="w-5 h-5 mr-2 text-primary" /> 备选方案 Top5 · {{ ph.label }}
          </h2>
          <div v-if="ph.sol" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-muted-foreground">
                  <th class="text-left py-2 pr-3 font-medium">方案</th>
                  <th class="text-right py-2 px-3 font-medium">BRP</th>
                  <th class="text-right py-2 px-3 font-medium">Ntq</th>
                  <th class="text-right py-2 px-3 font-medium">TSEG1</th>
                  <th class="text-right py-2 px-3 font-medium">TSEG2</th>
                  <th class="text-right py-2 px-3 font-medium">SJW</th>
                  <th class="text-right py-2 px-3 font-medium">采样点</th>
                  <th class="text-right py-2 px-3 font-medium">实际波特率</th>
                  <th class="text-right py-2 pr-1 font-medium">误差</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(a, i) in ph.sol.alts"
                  :key="a.brp + '-' + a.ntq"
                  class="border-t border-border/50"
                  :class="i === 0 ? 'bg-green-500/10' : ''"
                >
                  <td class="py-2.5 pr-3 font-medium text-foreground whitespace-nowrap">
                    {{ i === 0 ? '最优' : '备选 ' + i }}
                  </td>
                  <td class="py-2.5 px-3 text-right text-foreground">{{ a.brp }}</td>
                  <td class="py-2.5 px-3 text-right text-foreground">{{ a.ntq }}</td>
                  <td class="py-2.5 px-3 text-right text-foreground">{{ a.tseg1 }}</td>
                  <td class="py-2.5 px-3 text-right text-foreground">{{ a.tseg2 }}</td>
                  <td class="py-2.5 px-3 text-right text-foreground">{{ a.sjw }}</td>
                  <td class="py-2.5 px-3 text-right text-foreground">{{ fmtPct(a.sp) }}</td>
                  <td class="py-2.5 px-3 text-right text-muted-foreground">{{ fmt(a.baud, 2) }}</td>
                  <td class="py-2.5 pr-1 text-right font-semibold" :class="errCls(a.errPct)">{{ errPpmText(a.errPpm) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-sm text-muted-foreground">暂无可列方案，请先完善上方参数。</p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            排序口径：|波特率误差| 升序 → 采样点偏差升序 → Ntq 更大优先。若最优解的 Ntq 超出你所用控制器上限
            （如 bxCAN 最多 25 Tq），可直接从本表挑选 Ntq 合规的备选行——误差通常同为零或同一量级。
          </p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 位时序结构 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Layers class="w-5 h-5 mr-2 text-primary" /> 位时序结构
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <p><span class="text-foreground font-medium">SYNC_SEG</span>：同步段，固定 1 Tq，起始位边沿对齐的基准；</p>
            <p><span class="text-foreground font-medium">TSEG1</span>：传播段 + 相位缓冲段 1，采样点在其结束处；</p>
            <p><span class="text-foreground font-medium">TSEG2</span>：相位缓冲段 2，采样后到下一位开始的缓冲。</p>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            位时间 = SYNC_SEG（1 Tq）+ TSEG1 + TSEG2，采样点 SP = (1 + TSEG1) ÷ Ntq。
            TSEG1 吸收信号传播延迟与边沿抖动，TSEG2 留给再同步补偿——两者此消彼长，这就是采样点百分比的物理含义。
            SJW（再同步跳跃宽度）规定每个位边沿最多可加长/缩短多少个 Tq 来追踪偏差，按惯例取 min(TSEG2, 4)。
          </p>
        </div>

        <!-- 为什么不给寄存器值 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <CircuitBoard class="w-5 h-5 mr-2 text-primary" /> 为什么不给寄存器值
          </h2>
          <p class="text-xs leading-relaxed text-muted-foreground">
            各家 CAN IP 的位段宽度与上限不同：如 STM32 bxCAN 的位时间最多 1+16+8 = 25 Tq（BRP 可到 1024），
            M_CAN / m_can 系列可到 1+256+128 = 385 Tq，且普遍存在「寄存器写值 = 实际值 − 1」的口径
            （TSEG1 写 12 表示 13 Tq）。本页给通用 Tq 参数，写寄存器时按手册位段宽度与偏移口径换算即可；
            Ntq 超上限时从备选表选合规行，或调整时钟重算。
          </p>
        </div>

        <!-- 实用提示 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 实用提示
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">误差与采样点谁优先：</span>CAN 对波特率误差比 UART 宽容（时钟容差约 ±0.5% 量级），同一误差档里优先挑采样点更接近目标的方案。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">误差换算心智：</span>0.1% = 1000 ppm、0.01% = 100 ppm；ppm 口径在晶振数据手册里更常见，对照时直接用本页 ppm 列。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">CAN FD 数据相位：</span>速率高、位长短，收发器与环路延迟占比大，采样点取 70%~80% 并核对收发器延迟补偿（TDC）是否开启。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">多节点同网：</span>各节点按同一套 Tq 参数配置；时钟不同的节点允许 BRP/Ntq 不同，但实际波特率与采样点要对齐。</span>
            </li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是 CAN 位定时</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          CAN 总线没有单独的时钟线，每个节点用自己的 CAN 时钟把「一位」切成若干个最小时间单位——时间量子 Tq（Time Quantum），
          Tq = BRP ÷ CAN 时钟，BRP（Baud Rate Prescaler）是分频系数。一位由三段组成：
          <span class="text-foreground font-medium">同步段 SYNC_SEG（固定 1 Tq）+ TSEG1 + TSEG2</span>，
          即每位的 Tq 数 Ntq = 1 + TSEG1 + TSEG2，波特率 = CAN 时钟 ÷（BRP × Ntq）。
          采样点位于 TSEG1 结束处，采样点位置 SP = (1 + TSEG1) ÷ Ntq——SP = 87.5%、Ntq = 16 时对应 TSEG1 = 13、TSEG2 = 2。
          位定时配置的本质就是：给定时钟与目标波特率，选出误差最小、采样点合适的 BRP/Ntq/TSEG1/TSEG2 组合。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">TSEG1 与 TSEG2 是怎么分工的</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          经典教科书把 TSEG1 拆成传播段（PROP_SEG）与相位缓冲段 1（PHASE_SEG1），TSEG2 即相位缓冲段 2（PHASE_SEG2）。
          采样点之前的 TSEG1 必须覆盖「发送节点输出驱动器延迟 + 总线传播延迟 + 接收节点输入比较器延迟」之和的两倍
          （往返才能看到别的节点的边沿），所以长线、中继多的网络依赖靠后的采样点；采样点之后的 TSEG2 是留给
          再同步与下一位准备的缓冲。约束 TSEG1 ≥ TSEG2 是工程惯例：保证采样点不早于 50%，给边沿重同步留出空间。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">采样点为什么常设在 87.5%</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          CiA 与多数芯片默认档把经典 CAN 采样点定在 87.5%：够靠后，吸收长网络的传播延迟与边沿抖动；
          又留出约 12.5% 的 TSEG2 做再同步补偿。工程常见区间是 75%~87.5%——短网络、底板互联可以取 75%~80%，
          把 TSEG2 留厚一些、抗振荡器漂移；长距离、大衰减的网络取 87.5% 甚至更高。CAN FD 数据相位因为位时间短、
          收发器环路延迟占比大，惯例取 70%~80%（本页默认 75%），并需要检查收发器延迟补偿（TDC）。
          采样点改变时会直接改写 TSEG1/TSEG2 的分配，本页把它作为目标条件参与求解。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">SJW 与再同步是怎么工作的</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          CAN 靠数据位的边沿做再同步：接收方在预期位置没等到边沿（慢了）或提前等到边沿（快了）时，
          把当前位的 TSEG1 加长或 TSEG2 缩短来追平偏差，每次最多补偿 SJW 个 Tq。SJW 太小追不上累计漂移，
          太大又可能在噪声边沿上把位时序拽过头——所以惯例取 SJW = min(TSEG2, 4)：不超过 TSEG2，
          保证补偿不会吃掉下一位。本页直接按该惯例输出 SJW，个别芯片允许独立配置时可在该值附近调整。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么本页不输出寄存器值</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          位定时参数最终要写进芯片的位时序寄存器，但各家 IP 位段宽度不同：STM32 bxCAN 的 TSEG1 最多 16 Tq、
          TSEG2 最多 8 Tq（位时间上限 25 Tq），而 M_CAN 体系的 TSEG1 可到 256、TSEG2 可到 128（上限 385 Tq）；
          BRP 的上限也从 64 到 1024 不等，且几乎都有「寄存器值 = 实际值 − 1」的写法。
          统一输出通用 Tq 参数（BRP / Ntq / TSEG1 / TSEG2 / SJW）再按手册换算，比替某一款芯片硬编码更不容易出错。
          CiA 601-2 建议位时间可编程 5~385 Tq，本页按通用合理域 4~385 Tq 搜索；若最优解的 Ntq 超出你的芯片上限，
          从备选表挑合规行即可。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">BRP、TSEG1、TSEG2 算出来之后怎么填进寄存器？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              按芯片手册找到位时序寄存器（bxCAN 的 BTR、M_CAN 的 NBTP/DBTP 等），把本页的 BRP/TSEG1/TSEG2/SJW
              按「寄存器值 = 实际值 − 1」写进对应位段；同时确认实际值不超过该位段上限。若 Ntq 超上限，
              从备选方案表里换一行 Ntq 合规的组合，误差通常同为零或同一量级。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">采样点设多少合适？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              经典 CAN 常见 75%~87.5%，CiA 与多数默认档取 87.5%；短网络可降到 75%~80% 换取更厚的再同步余量，
              长线网络偏向 87.5%。CAN FD 数据相位取 70%~80%（常用 75%），并确认收发器延迟补偿（TDC）已启用。
              同一网络所有节点的采样点应保持一致或接近。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">CAN FD 为什么要仲裁相位和数据相位各算一套？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              CAN FD 在仲裁段用慢速率保证鲁棒性、在数据段提速（常见 2~8 倍），两段各有一套独立的位时序寄存器
              （NBTP 与 DBTP），采样点惯例也不同（仲裁 ~87.5%、数据 ~75%）。本页 FD 模式对两相位分别求解，
              时钟共用、目标波特率与采样点独立输入。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">波特率误差多少可以接受？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              经典 CAN 对时钟容差的要求约 ±0.5% 量级（比 UART 宽松，且靠边沿再同步不断修正），因此本页把
              ±0.5% 内标为可用。多数「CAN 时钟 ÷ 波特率」组合都能搜到零误差或 ppm 级方案，误差通常不是瓶颈，
              采样点位置反而更值得核对。更多串行链路的误差口径可参考
              <NuxtLink to="/tools/uart-baud-error" class="text-primary hover:underline">波特率误差计算器</NuxtLink>。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'can-bit-timing-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Cable, Calculator, Table, Info, AlertTriangle, ChevronUp, ChevronDown,
  Copy, CheckCircle, Layers, CircuitBoard
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 通用数字清洗：Number / 字符串 → 有限数或 null（空输入、NaN → null）
function num(v) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) ? n : null
}

// 按 Ntq 与目标采样点分配 TSEG1/TSEG2：
// TSEG1 + TSEG2 = Ntq - 1；SP = (1 + TSEG1) / Ntq 随 TSEG1 单调增，
// 取离目标 SP 最近的合法 TSEG1；约束 TSEG1 >= 1、TSEG2 >= 1、TSEG1 >= TSEG2；SJW = min(TSEG2, 4)
function splitSegs(ntq, targetSp) {
  const tseg2Max = Math.floor((ntq - 1) / 2)      // TSEG1 >= TSEG2 → TSEG2 <= floor((Ntq-1)/2)
  const tseg1Min = ntq - 1 - tseg2Max             // 即 ceil((Ntq-1)/2)，天然 >= 1（Ntq >= 3）
  const tseg1 = Math.min(Math.max(Math.round(targetSp * ntq - 1), tseg1Min), ntq - 2)
  const tseg2 = ntq - 1 - tseg1
  return { tseg1, tseg2, sp: (1 + tseg1) / ntq, sjw: Math.min(tseg2, 4) }
}

// CAN 位定时求解（单相位）：枚举 BRP（1..maxBrp）与 Ntq（minNtq..maxNtq），
// 每个 Ntq 只需检查理想分频 ideal = fclk/(baud·Ntq) 的 floor/ceil（波特率随 BRP 单调减，最近者必在其中）。
// 排序：|实际波特率 − 目标| 升序 → |实际SP − 目标SP| 升序 → Ntq 更大优先（Tq 粒度更细）→ BRP 更小优先。
// 返回 { best, alts(前5), total } 或 null。
function solveCanTiming(fclkHz, targetBaud, targetSp, minNtq = 4, maxNtq = 385, maxBrp = 512) {
  if (!Number.isFinite(fclkHz) || !(fclkHz > 0)) return null
  if (!Number.isFinite(targetBaud) || !(targetBaud > 0)) return null
  if (!Number.isFinite(targetSp) || !(targetSp > 0) || !(targetSp < 1)) return null
  const cands = []
  for (let ntq = minNtq; ntq <= maxNtq; ntq++) {
    const ideal = fclkHz / (targetBaud * ntq)
    let brps
    if (ideal <= 1) {
      brps = [1]
    } else if (ideal > maxBrp) {
      brps = [maxBrp]
    } else {
      const lo = Math.floor(ideal)
      const hi = Math.ceil(ideal)
      brps = lo === hi ? [lo] : [lo, hi]
    }
    const segs = splitSegs(ntq, targetSp)
    for (const brp of brps) {
      const baud = fclkHz / (brp * ntq)
      const relErr = (baud - targetBaud) / targetBaud
      cands.push({
        brp, ntq, tseg1: segs.tseg1, tseg2: segs.tseg2, sjw: segs.sjw,
        sp: segs.sp, baud,
        errBps: baud - targetBaud,
        errPct: relErr * 100,
        errPpm: relErr * 1e6,
        spDev: Math.abs(segs.sp - targetSp)
      })
    }
  }
  if (!cands.length) return null
  cands.sort((a, b) =>
    Math.abs(a.errBps) - Math.abs(b.errBps) ||
    a.spDev - b.spDev ||
    b.ntq - a.ntq ||
    a.brp - b.brp
  )
  return { best: cands[0], alts: cands.slice(0, 5), total: cands.length }
}

// 误差档位：≈0 → 零误差（绿）；≤0.5% 可用（绿）；0.5%~2% 临界（黄）；>2% 需重算（红）
function judgeCanErr(errPct) {
  if (!Number.isFinite(errPct)) return null
  const a = Math.abs(errPct)
  if (a < 1e-9) return 'zero'
  if (a <= 0.5) return 'ok'
  if (a <= 2) return 'warn'
  return 'bad'
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: 'CAN位定时计算器 - BRP/TSEG1/TSEG2/SJW与采样点速算',
  description: '在线CAN位定时计算器：按CAN时钟与目标波特率枚举BRP与Ntq，输出误差最小的TSEG1/TSEG2/SJW与采样点，误差以%与ppm双显，附备选方案Top5；支持CAN FD仲裁相位+数据相位双相位分别求解，输出通用Tq参数不做寄存器编码，纯本地计算。',
  keywords: 'can位定时计算, can波特率计算, 采样点设置, can fd位时序, tseg1 tseg2, brp分频, sjw再同步, can位时间',
  author: '有条工具',
  ogTitle: 'CAN位定时计算器 - BRP/TSEG1/TSEG2/SJW与采样点速算 | 有条工具',
  ogDescription: '按CAN时钟与波特率求BRP/TSEG/SJW与采样点，误差%+ppm双显，经典CAN与CAN FD双相位，备选方案Top5。',
  ogUrl: 'https://www.util.cn/tools/can-bit-timing-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'CAN位定时计算器',
  twitterDescription: 'CAN 时钟与波特率求 BRP/TSEG/SJW 与采样点，经典 CAN 与 CAN FD 双相位求解。'
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
          name: 'CAN位定时计算器',
          url: 'https://www.util.cn/tools/can-bit-timing-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '经典 CAN / CAN FD（仲裁+数据）双模式位定时求解',
            '枚举 BRP 与 Ntq，按误差→采样点→Tq 数排序取最优',
            '输出 BRP/Ntq/TSEG1/TSEG2/SJW 与实际采样点',
            '波特率误差百分比与 ppm 双显',
            '备选方案 Top5 对照表',
            '位时序结构（SYNC_SEG/TSEG1/TSEG2）与再同步科普',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: 'CAN位定时计算器', item: 'https://www.util.cn/tools/can-bit-timing-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'BRP、TSEG1、TSEG2 算出来之后怎么填进寄存器？',
              acceptedAnswer: { '@type': 'Answer', text: '按芯片手册找到位时序寄存器（如 bxCAN 的 BTR、M_CAN 的 NBTP/DBTP），把通用 Tq 参数按「寄存器值 = 实际值 − 1」写进对应位段，并确认不超过位段上限；Ntq 超上限时从备选表换合规组合。' }
            },
            {
              '@type': 'Question',
              name: '采样点设多少合适？',
              acceptedAnswer: { '@type': 'Answer', text: '经典 CAN 常见 75%~87.5%，CiA 惯例 87.5%；短网络可取 75%~80%，长线网络偏向 87.5%。CAN FD 数据相位取 70%~80%（常用 75%），并启用收发器延迟补偿（TDC）。' }
            },
            {
              '@type': 'Question',
              name: 'CAN FD 为什么要仲裁相位和数据相位各算一套？',
              acceptedAnswer: { '@type': 'Answer', text: 'CAN FD 仲裁段慢、数据段提速 2~8 倍，两段各有一套独立位时序寄存器（NBTP/DBTP），采样点惯例也不同（仲裁约 87.5%、数据约 75%），需分别求解。' }
            },
            {
              '@type': 'Question',
              name: 'CAN 波特率误差多少可以接受？',
              acceptedAnswer: { '@type': 'Answer', text: 'CAN 靠边沿再同步修正偏差，时钟容差要求约 ±0.5% 量级，比 UART 宽松；多数组合能搜到零误差或 ppm 级方案，采样点位置更值得核对。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'can-bit-timing-calculator'
const SETTINGS_KEY = 'can-bit-timing-calculator-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 常量 ----------
const CLK_PRESETS = [8, 16, 20, 24, 40, 48, 80]
const BAUD_PRESETS = [
  { label: '1000k', kbps: 1000 },
  { label: '500k', kbps: 500 },
  { label: '250k', kbps: 250 },
  { label: '125k', kbps: 125 },
  { label: '100k', kbps: 100 },
  { label: '83.333k', kbps: 1000 / 12 }   // CiA 标准档 83.333 kbit/s = 10^6/12
]

// ---------- 状态 ----------
const mode = ref('classic')        // 'classic' 经典 CAN | 'fd' CAN FD
const clkMhz = ref(8)
const baudKbps = ref(500)
const spArbPct = ref(87.5)
const fdBaudKbps = ref(2000)
const spDataPct = ref(75)
const copyStatus = ref('idle')
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化 ----------
const fmt = (v, d = 2) => (Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—')
const fmtPct = (sp) => (Number.isFinite(sp) ? (parseFloat((sp * 100).toFixed(3)) + '%') : '—')
const errPctText = (e) => {
  if (!Number.isFinite(e)) return '—'
  if (Math.abs(e) < 1e-9) return '0%'
  return (e > 0 ? '+' : '') + parseFloat(e.toFixed(4)) + '%'
}
const errPpmText = (e) => {
  if (!Number.isFinite(e)) return '—'
  if (Math.abs(e) < 1e-6) return '0 ppm'
  return (e > 0 ? '+' : '') + parseFloat(e.toFixed(1)) + ' ppm'
}
const errCls = (e) => {
  const j = judgeCanErr(e)
  if (j === 'zero' || j === 'ok') return 'text-green-600 dark:text-green-400'
  if (j === 'warn') return 'text-amber-600 dark:text-amber-400'
  if (j === 'bad') return 'text-red-600 dark:text-red-400'
  return 'text-muted-foreground'
}

// ---------- 主计算 ----------
const clkHz = computed(() => {
  const m = num(clkMhz.value)
  if (m === null || !(m > 0)) return null
  return Math.round(m * 1e6)
})

// 仲裁相位（经典 CAN 同此）：时钟 + 波特率 + 采样点目标 → 最优解与备选
const arbSol = computed(() => {
  const hz = clkHz.value
  const kb = num(baudKbps.value)
  const sp = num(spArbPct.value)
  if (hz === null || kb === null || !(kb > 0) || sp === null || !(sp > 0) || !(sp < 100)) return null
  return solveCanTiming(hz, kb * 1000, sp / 100, 4, 385, 512)
})

// CAN FD 数据相位：第二波特率 + 第二采样点目标
const dataSol = computed(() => {
  const hz = clkHz.value
  const kb = num(fdBaudKbps.value)
  const sp = num(spDataPct.value)
  if (hz === null || kb === null || !(kb > 0) || sp === null || !(sp > 0) || !(sp < 100)) return null
  return solveCanTiming(hz, kb * 1000, sp / 100, 4, 385, 512)
})

// 按模式装配相位列表（经典 1 个相位，FD 2 个），结果卡与备选表按相位渲染
const arbPhase = computed(() => ({
  key: 'arb',
  label: mode.value === 'fd' ? '仲裁相位' : '经典 CAN',
  sol: arbSol.value,
  targetKbps: num(baudKbps.value),
  targetSpPct: num(spArbPct.value)
}))
const dataPhase = computed(() => ({
  key: 'data',
  label: '数据相位',
  sol: dataSol.value,
  targetKbps: num(fdBaudKbps.value),
  targetSpPct: num(spDataPct.value)
}))
const phases = computed(() => (mode.value === 'fd' ? [arbPhase.value, dataPhase.value] : [arbPhase.value]))

// ---------- 交互 ----------
function setMode(m) {
  if (mode.value === m) return
  mode.value = m
  if (m === 'fd') trackEvent('工具使用', '切换FD模式', TOOL_ID)
}

// ---------- 复制 TSV（clipboard + alert 反馈） ----------
function buildTsv() {
  const lines = ['CAN位定时参数\t（有条工具 · 本地计算）']
  lines.push(`模式\t${mode.value === 'fd' ? 'CAN FD' : '经典CAN'}`)
  lines.push(`CAN时钟\t${fmt(num(clkMhz.value), 4)} MHz`)
  for (const ph of phases.value) {
    lines.push('')
    if (!ph.sol) {
      lines.push(`${ph.label}\t无解（请检查时钟/波特率/采样点参数）`)
      continue
    }
    lines.push(`${ph.label}\t目标 ${fmt(ph.targetKbps, 4)} kbps\t目标采样点 ${fmt(ph.targetSpPct, 3)}%`)
    const rows = [ph.sol.best, ...ph.sol.alts.slice(1)]
    rows.forEach((b, i) => {
      const tag = i === 0 ? '最优' : `备选${i}`
      lines.push(`${tag}\tBRP=${b.brp}\tNtq=${b.ntq}\tTSEG1=${b.tseg1}\tTSEG2=${b.tseg2}\tSJW=${b.sjw}\tSP=${fmtPct(b.sp)}\t实际波特率=${fmt(b.baud, 2)}bps\t误差=${errPpmText(b.errPpm)}`)
    })
  }
  return lines.join('\n')
}

let copyTimer = null
async function copyResult() {
  const text = buildTsv()
  try {
    await navigator.clipboard.writeText(text)
    copyStatus.value = 'ok'
    trackEvent('工具结果', '复制', TOOL_ID)
  } catch (err) {
    copyStatus.value = 'fail'
    alert('复制失败：浏览器未授权剪贴板，请手动记录参数。')
  }
  if (copyTimer !== null) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copyStatus.value = 'idle'; copyTimer = null }, 1600)
}

// ---------- 设置持久化（localStorage，键前缀=工具 id，仅 onMounted/交互回调内触碰） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (s.mode === 'classic' || s.mode === 'fd') mode.value = s.mode
    if (Number.isFinite(s.clkMhz) && s.clkMhz > 0) clkMhz.value = s.clkMhz
    if (Number.isFinite(s.baudKbps) && s.baudKbps > 0) baudKbps.value = s.baudKbps
    if (Number.isFinite(s.spArbPct) && s.spArbPct > 0 && s.spArbPct < 100) spArbPct.value = s.spArbPct
    if (Number.isFinite(s.fdBaudKbps) && s.fdBaudKbps > 0) fdBaudKbps.value = s.fdBaudKbps
    if (Number.isFinite(s.spDataPct) && s.spDataPct > 0 && s.spDataPct < 100) spDataPct.value = s.spDataPct
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([mode, clkMhz, baudKbps, spArbPct, fdBaudKbps, spDataPct], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      mode: mode.value,
      clkMhz: clkMhz.value,
      baudKbps: baudKbps.value,
      spArbPct: spArbPct.value,
      fdBaudKbps: fdBaudKbps.value,
      spDataPct: spDataPct.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
