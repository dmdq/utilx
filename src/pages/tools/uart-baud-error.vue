<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Radio class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">波特率误差计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">UART 分频系数与实际波特率误差判定、全波特率扫描与零误差时钟反查</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 UART 波特率误差计算器：按时钟频率 = 分频值 × 过采样倍数 × 波特率的反推口径，
        计算理论分频值（含小数）、取整后的实际波特率与波特率误差百分比，按单端 ±2% / 总预算 ±4.5% 红黄绿判定；
        附当前时钟下 8 档标准波特率的逐行误差扫描表，以及"给定波特率反查哪些常用时钟零误差"——
        解释 11.0592MHz 为什么被称为串口神石。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        计算口径：分频值 = fosc ÷（过采样倍数 × 目标波特率），四舍五入取整后实际波特率 = fosc ÷（过采样倍数 × 取整分频）。
        16x 过采样是 16550 系 UART 的经典口径（每位 16 个采样点），8x 为低分频余量不足时的常见替代。
        误差判定：单端 ≤±2% 绿（安全）、±2%~±4.5% 黄（临界，需实测）、&gt;±4.5% 红（大概率乱码）——
        总容差约 ±4.5% = 收发两端各 ±2% + 中点采样窗口余量。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器列 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 分频与误差计算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 分频与误差计算
          </h2>

          <!-- 时钟频率 -->
          <div>
            <label for="ube-fosc" class="block text-sm font-medium text-foreground mb-1.5">时钟频率 fosc（MHz）</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="p in FOSC_PRESETS"
                :key="p.hz"
                @click="foscMhz = p.mhz"
                :class="foscHz === p.hz ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              >{{ p.label }}</button>
            </div>
            <input
              id="ube-fosc"
              v-model.number="foscMhz"
              type="number"
              min="0.1"
              step="0.0001"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 11.0592"
            >
            <p class="text-xs text-muted-foreground mt-1">当前换算为 {{ fmt(foscHz, 0) }} Hz；预设之外可直接输入，晶振/内部 RC 均可</p>
          </div>

          <!-- 目标波特率 -->
          <div>
            <label for="ube-baud" class="block text-sm font-medium text-foreground mb-1.5">目标波特率（bps）</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="b in BAUD_PRESETS"
                :key="b"
                @click="baud = b"
                :class="baud === b ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              >{{ b }}</button>
            </div>
            <input
              id="ube-baud"
              v-model.number="baud"
              type="number"
              min="1"
              step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 115200"
            >
          </div>

          <!-- 过采样口径 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">过采样口径</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="oversample = 16"
                :class="oversample === 16 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >16x（经典 UART，每位 16 采样）</button>
              <button
                @click="oversample = 8"
                :class="oversample === 8 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >8x（分频余量翻倍）</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1">常见 MCU/UART IP 为 16x；部分低功耗型号或高波特率场景用 8x，分频粒度更细、误差减半量级</p>
          </div>

          <!-- 结果 -->
          <div v-if="mainResult" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <p class="text-xs text-muted-foreground mb-1">理论分频值（含小数）</p>
                <p class="text-xl font-bold text-foreground">{{ mainResult.theo.toFixed(4) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">实际取整分频</p>
                <p class="text-xl font-bold text-foreground">{{ mainResult.div }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">实际波特率</p>
                <p class="text-xl font-bold text-foreground">{{ fmt(mainResult.actual, 2) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">波特率误差</p>
                <p class="text-xl font-bold" :class="errCls(mainResult.judge)">
                  {{ devText(mainResult.errPct) }}
                </p>
              </div>
            </div>
            <div class="pt-3 border-t border-primary/20 text-sm flex items-center justify-between flex-wrap gap-2">
              <p class="text-muted-foreground">
                实际波特率 = {{ fmt(foscHz, 0) }} ÷（{{ oversample }} × {{ mainResult.div }}），
                理论分频 {{ mainResult.theo.toFixed(4) }} 取整为 {{ mainResult.div }}
              </p>
              <span class="px-2.5 py-1 rounded-full text-xs font-medium" :class="errPillCls(mainResult.judge)">
                {{ judgeText(mainResult.judge) }}
              </span>
            </div>
            <p v-if="mainResult.judge !== 'green'" class="text-xs leading-relaxed" :class="errCls(mainResult.judge)">
              {{ judgeAdvice(mainResult.judge) }}
            </p>
            <p class="text-xs text-muted-foreground leading-relaxed">
              判定口径：单端误差 ≤±2% 为安全区；收发两端各留 ±2%，加上起始位检测与中点采样的位时序余量，
              整条链路总预算约 ±4.5%——超过总预算的误差会在一帧内累积出半位偏移，采到最后一位时错位成乱码。
            </p>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">请检查参数：时钟频率 &gt; 0，目标波特率 &gt; 0。</p>
            </div>
          </div>

          <p class="text-xs leading-relaxed text-muted-foreground">
            说明：取整按四舍五入（误差最小化）；个别 UART 外设为"向下取整再减 1"的寄存器口径（如 AVR 的 UBRR），
            误差会略大于本表，寄存器写值时请按手册换算。理论分频恰为整数时误差为 0，即"零误差"组合。
          </p>
        </div>

        <!-- 全波特率扫描表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Table class="w-5 h-5 mr-2 text-primary" /> 全波特率扫描表（{{ fmt(foscMhz, 4) }} MHz · {{ oversample }}x 口径）
          </h2>
          <div v-if="mainResult" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-muted-foreground">
                  <th class="text-left py-2 pr-3 font-medium">目标波特率</th>
                  <th class="text-right py-2 px-3 font-medium">理论分频</th>
                  <th class="text-right py-2 px-3 font-medium">取整分频</th>
                  <th class="text-right py-2 px-3 font-medium">实际波特率</th>
                  <th class="text-right py-2 px-3 font-medium">误差</th>
                  <th class="text-center py-2 pr-1 font-medium">判定</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in baudScan"
                  :key="row.baud"
                  class="border-t border-border/50"
                  :class="row.judge === 'green' ? 'bg-green-500/10' : ''"
                >
                  <td class="py-2.5 pr-3 font-medium text-foreground whitespace-nowrap">
                    {{ row.baud }}
                    <span v-if="row.exact" class="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-600/15 text-green-600 dark:text-green-400">零误差</span>
                  </td>
                  <td class="py-2.5 px-3 text-right text-muted-foreground">{{ row.theo.toFixed(4) }}</td>
                  <td class="py-2.5 px-3 text-right text-foreground">{{ row.div }}</td>
                  <td class="py-2.5 px-3 text-right text-foreground">{{ fmt(row.actual, 2) }}</td>
                  <td class="py-2.5 px-3 text-right font-semibold" :class="errCls(row.judge)">{{ devText(row.errPct) }}</td>
                  <td class="py-2.5 pr-1 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-medium" :class="errPillCls(row.judge)">{{ judgeText(row.judge) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            绿色行为甜点档（单端误差 ≤±2%），可直接放心使用；黄色为临界档，建议实测两端通信；红色档大概率乱码。
            表中数值与上方计算器由同一组函数生成。同一时钟下波特率越低、分频越大，取整带来的相对误差越小——
            这也是"降波特率救乱码"的数学原因。
          </p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 反向查时钟 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Search class="w-5 h-5 mr-2 text-primary" /> 反向查零误差时钟
          </h2>
          <p class="text-xs text-muted-foreground">
            目标波特率 <span class="text-foreground font-medium">{{ fmt(baud, 0) }} bps</span>（{{ oversample }}x 口径）下，
            常用时钟按 |误差| 从小到大排列：
          </p>
          <div v-if="clockScan.length" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-muted-foreground">
                  <th class="text-left py-1.5 pr-2 font-medium">时钟</th>
                  <th class="text-right py-1.5 px-2 font-medium">分频</th>
                  <th class="text-right py-1.5 pr-1 font-medium">误差</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in clockScan"
                  :key="row.label"
                  class="border-t border-border/50"
                  :class="row.exact ? 'bg-green-500/10' : ''"
                >
                  <td class="py-1.5 pr-2 font-medium text-foreground whitespace-nowrap">
                    {{ row.label }}
                    <span v-if="row.exact" class="ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-600/15 text-green-600 dark:text-green-400">零误差</span>
                  </td>
                  <td class="py-1.5 px-2 text-right text-muted-foreground">{{ row.theo.toFixed(4) }}</td>
                  <td class="py-1.5 pr-1 text-right font-semibold" :class="errCls(row.judge)">{{ devText(row.errPct) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="exactClockCount > 0" class="text-sm text-green-600 dark:text-green-400 font-medium">
            {{ exactClockCount }} 款常用时钟在该波特率下零误差，优先选用。
          </p>
          <div class="rounded-lg bg-muted/50 border border-border p-3 text-xs leading-relaxed text-muted-foreground">
            <p class="text-foreground font-medium mb-1">11.0592MHz 为什么是"串口神石"？</p>
            <p>
              11.0592MHz ÷ 16 = 691.2 kHz，恰是 9600 的 72 倍、115200 的 6 倍——它等于 115200 × 96、
              也是 1.8432MHz 的 6 倍（3.6864 / 7.3728 / 14.7456 / 18.432 / 22.1184M 同属这一家族）。
              因此 16x 口径下 9600~230400 档档零误差；460800 要用 8x 口径（分频 1.5 非整数），
              或升级 22.1184M（460800 仍零误差）。而 8 / 12 / 16 / 24MHz 这类整 MHz 时钟在任何档位都很难整除，
              误差只能"挑最好的那档"。
            </p>
          </div>
        </div>

        <!-- 经验提示卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 实用提示
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">乱码先查误差：</span>两端波特率误差之和超过约 ±4.5% 就会乱码；一端 +8.5%、另一端 0% 也救不回来。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">8MHz 跑 115200：</span>16x 口径分频 4.34→4，实际 125000（+8.5%），是内部 RC + 高波特率翻车的经典组合——换 11.0592M 或降波特率。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">误差可以"对冲"：</span>一端 +1.6%、一端 −1.6% 时相对误差互相抵消，比两端同号更安全；但也别指望长期稳定。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">寄存器口径：</span>部分 MCU 是"分频值 − 1 后写入"（如 AVR UBRR），本页给出的是真实分频，写寄存器时按手册换算。</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是波特率误差</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          UART 没有独立的时钟线，收发双方各自用自己的时钟把每一位切成若干采样点、独立恢复出 0/1。
          两边的"每秒位数"不可能完全一致，这个不一致就是波特率误差。误差小，一帧（10 位左右）采完还在位边界内；
          误差大，偏差会沿着 10 个位一路累积，采到最后一位时已经偏出半位，数据就错成乱码。
          本工具按 fosc ÷（过采样 × 波特率）= 分频值的标准口径，把"晶振频率和目标波特率不整除"造成的误差算出来并给出红黄绿判定。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么 11.0592MHz 被称为串口神石</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          标准波特率是 300×2ⁿ 这条 2 的幂链条（9600、19200、…、115200）。
          一个时钟要"整除"出这些波特率，就必须是 16 × 波特率的整数倍。11.0592MHz = 115200 × 96 = 1.8432MHz × 6，
          它的 1/16（691.2kHz）同时是 9600 的 72 倍、19200 的 36 倍、38400 的 18 倍、57600 的 12 倍、115200 的 6 倍、230400 的 3 倍——
          <span class="text-foreground font-medium">16x 口径下从 9600 到 230400 档档零误差</span>。
          3.6864 / 7.3728 / 14.7456 / 18.432 / 22.1184MHz 都是 1.8432MHz 的整数倍，同属"神石家族"，
          频率越高支持的零误差波特率越高（22.1184M 到 460800 仍零误差）。
          反观 8 / 12 / 16 / 24 / 72MHz 这类整 MHz 时钟，除以 16×9600 都不是整数，只能靠取整凑近似——
          这就是老工程师串口项目默认上 11.0592M 的数学原因。USB 时代串口多由 USB-CDC 虚拟出来，时钟精度不再是瓶颈，
          但两个 MCU 直连 UART、GPS 模块、蓝牙透传模块等场景依然适用这套规则。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">16x 过采样是怎么来的</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          经典 UART（如 16550 系列）把每一位的时间切成 16 份：检测到起始位下降沿后等 8 个采样点落到位中央再采样，
          后续每位也在中央采样，中间的采样点可以做多数表决滤波、检测帧错误。
          <span class="text-foreground font-medium">过采样倍数越高，位中央定位越准、抗毛刺越强，但分频值也要除以更大的数，取整误差随之变大</span>。
          8x 口径把分频分母减半，同样的时钟下分频余量翻倍、误差约减半，代价是采样窗口变粗、抗噪能力下降。
          本工具两种口径都支持，实际倍数以你用的 UART 外设手册为准（多数 ARM MCU 的 UART/USART 是 16x 或可配 8x 过采样）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">±2% 的容差是怎么算出来的</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一帧 10 位（1 起始 + 8 数据 + 1 停止）时，停止位在中点附近被采样，累计相位偏移 = 9.5 × 每位误差。
          要让最后一位仍落在位中央附近，累计偏移必须小于半位（0.5 位），反推单端误差的理论上限约 5%；
          扣除起始位检测毛刺、时钟抖动与边沿斜率的余量后，工程惯例取<span class="text-foreground font-medium">单端 ±2%</span>。
          收发两端各 ±2%，再加上起始位对齐的采样窗口消耗，整条链路的总预算约 ±4.5%——
          超过它，一帧还没采完相位就偏出半位，采到的"停止位"其实是数据位，帧错误和乱码随之而来。
          两端误差符号相反时（如一端 +1.6%、一端 −1.6%）会互相抵消，链路比"误差绝对值相加"更宽容。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">内部 RC 振荡器的温漂风险</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          很多 MCU 出厂校准的内部 RC 振荡器（如 HSI/IRC）在 25°C 只有 ±1~2% 的精度，跨全温范围（−40~+85°C）会漂到 ±5% 甚至更多，
          电压波动再叠加 1~2%。常温下"能通"的串口，进高低温箱或上电发热后就可能开始乱码——
          尤其 8MHz 内部 RC 跑 115200 这种本就 +8.5% 的组合，是"实验室好好的、现场就翻车"的经典案例。
          串口要用高波特率时优先上外部晶振或神石频率；不得不跑内部 RC 时，降低波特率（误差随分频值增大而缩小）、
          或用双方都实测过的组合。逻辑电平、驱动能力等接口层问题可参考
          <NuxtLink to="/tools/logic-ic-truth-table" class="text-primary hover:underline">74/4000 系列速查</NuxtLink>。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">波特率误差多少算安全？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              单端 ≤±2% 是安全区（绿色）；±2%~±4.5% 为临界区，建议两端实测；超过 ±4.5% 大概率乱码。
              判定时要用"两端误差之和"看链路：一端 +1%、一端 +3.5% 合计 4.5%，已经贴着总预算的边。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">8MHz 晶振能跑 115200 吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              16x 口径下理论分频 4.34、取整 4，实际波特率 125000，误差 +8.5%，红色报警——单靠这一端就超出 ±4.5% 总预算，不可靠。
              换 11.0592MHz（零误差）或降到 57600（8M 时 −3.55%，仍偏高）以外更低的档位（9600 只有 +0.16%）。
              若双方都从 8MHz 类时钟分出来且误差同向，实测偶发可用，但不建议量产依赖。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">16MHz 跑 9600 只有 +0.16%，是不是随便用 16M 就行？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              低波特率确实没问题，但误差随波特率升高而恶化：16MHz 下 57600 误差 +2.12%（黄色）、
              115200 为 −3.55%（黄色）、230400 达 +8.51%（红色）。16MHz 跑 115200 的 −3.5% 在实验室常温往往"能通"，
              但加上另一端误差后就贴着总预算了。需要 115200 及以上时，11.0592M 或 18.432M 是更稳的选择。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">8x 和 16x 口径差在哪？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              分频公式只差一个系数：分频值 = fosc ÷（倍数 × 波特率）。8x 的分母小一半，同样时钟下理论分频翻倍、
              取整造成的相对误差约减半（如 8M 跑 115200：16x 分频 4.34 误差 +8.5%；8x 分频 8.68 取整 9，误差 −3.55%），
              代价是每位只有 8 个采样点、位中央定位与抗噪能力变差。先确认你的 UART 外设支持哪种过采样，再按本工具核对误差。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'uart-baud-error'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Radio, Calculator, Table, Search, Info, CheckCircle, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 理论分频值：fosc ÷（过采样倍数 × 目标波特率），foscHz 为整数 Hz
function theoreticalDiv(foscHz, baud, oversample) {
  if (!Number.isFinite(foscHz) || !Number.isFinite(baud) || !Number.isFinite(oversample)) return null
  if (!(foscHz > 0) || !(baud > 0) || !(oversample > 0)) return null
  return foscHz / (oversample * baud)
}

// 取整分频：四舍五入，最小为 1
function roundDiv(theo) {
  if (!Number.isFinite(theo)) return null
  return Math.max(1, Math.round(theo))
}

// 实际波特率：fosc ÷（过采样倍数 × 取整分频）
function actualBaud(foscHz, div, oversample) {
  if (!Number.isFinite(foscHz) || !Number.isFinite(div) || !Number.isFinite(oversample)) return null
  if (!(foscHz > 0) || !(div >= 1) || !(oversample > 0)) return null
  return foscHz / (oversample * div)
}

// 误差百分比：(实际 − 目标) ÷ 目标 × 100（有符号）
function errPct(actual, target) {
  if (!Number.isFinite(actual) || !Number.isFinite(target) || !(target > 0)) return null
  return ((actual - target) / target) * 100
}

// 判定：|e| ≤ 2 绿 / ≤ 4.5 黄 / > 4.5 红（单端 ±2%、链路总预算约 ±4.5%）
function judgeErr(e) {
  if (!Number.isFinite(e)) return null
  const a = Math.abs(e)
  if (a <= 2) return 'green'
  if (a <= 4.5) return 'amber'
  return 'red'
}

// 是否零误差：理论分频值在 1e-9 容差内为整数
function isExact(theo) {
  if (!Number.isFinite(theo)) return false
  return Math.abs(theo - Math.round(theo)) < 1e-9
}

// 全波特率扫描：给定时钟（Hz）与口径，对标准波特率列表逐行计算
function scanBauds(foscHz, oversample, baudList) {
  if (!Number.isFinite(foscHz) || !(foscHz > 0) || !Array.isArray(baudList)) return []
  return baudList.map(b => {
    const theo = theoreticalDiv(foscHz, b, oversample)
    if (theo === null) return { baud: b, theo: NaN, div: null, actual: NaN, errPct: NaN, judge: null, exact: false }
    const div = roundDiv(theo)
    const actual = actualBaud(foscHz, div, oversample)
    const e = errPct(actual, b)
    return { baud: b, theo, div, actual, errPct: e, judge: judgeErr(e), exact: isExact(theo) }
  })
}

// 反向扫描：给定波特率与口径，在常用时钟列表（[{label, hz}]）中按 |误差| 升序排列
function scanClocks(baud, oversample, clockList) {
  if (!Number.isFinite(baud) || !(baud > 0) || !Array.isArray(clockList)) return []
  return clockList
    .map(c => {
      const theo = theoreticalDiv(c.hz, baud, oversample)
      if (theo === null) return { label: c.label, theo: NaN, errPct: NaN, judge: null, exact: false }
      const div = roundDiv(theo)
      const actual = actualBaud(c.hz, div, oversample)
      const e = errPct(actual, baud)
      return { label: c.label, theo, errPct: e, judge: judgeErr(e), exact: isExact(theo) }
    })
    .sort((a, b) => Math.abs(a.errPct) - Math.abs(b.errPct))
}
// ==== PURE-FNS-END ====

// SEO
useSeoMeta({
  title: '波特率误差计算器 - UART 分频与串口容差判定',
  description: '在线 UART 波特率误差计算器：按 fosc/(16×baud) 口径计算理论分频值、实际波特率与误差百分比，±2%/±4.5% 红黄绿判定，全波特率扫描表与零误差时钟反查，解释 11.0592MHz 串口神石，纯本地计算。',
  keywords: '波特率误差, uart 波特率, 串口分频计算, 11.0592mhz, 波特率计算器, 115200 误差, 过采样, baud rate error',
  author: '有条工具',
  ogTitle: '波特率误差计算器 - UART 分频与串口容差判定 | 有条工具',
  ogDescription: 'UART 分频误差判定、全波特率扫描表与零误差时钟反查，解释 11.0592MHz 为什么是串口神石。',
  ogUrl: 'https://www.util.cn/tools/uart-baud-error',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '波特率误差计算器',
  twitterDescription: 'UART 分频误差判定、全波特率扫描与零误差时钟反查。'
})

// JSON-LD 结构化数据（SoftwareApplication + FAQPage + BreadcrumbList）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '波特率误差计算器',
          url: 'https://www.util.cn/tools/uart-baud-error',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '16x / 8x 过采样两种口径',
            '理论分频值、取整分频、实际波特率与误差百分比',
            '±2% 单端 / ±4.5% 总预算红黄绿判定',
            '8 档标准波特率逐行误差扫描表',
            '给定波特率反查常用时钟零误差组合',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '波特率误差计算器', item: 'https://www.util.cn/tools/uart-baud-error' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '波特率误差多少算安全？',
              acceptedAnswer: { '@type': 'Answer', text: '单端 ≤±2% 是安全区；±2%~±4.5% 为临界区需实测；超过 ±4.5% 大概率乱码。链路要看两端误差之和，总预算约 ±4.5%。' }
            },
            {
              '@type': 'Question',
              name: '8MHz 晶振能跑 115200 吗？',
              acceptedAnswer: { '@type': 'Answer', text: '16x 口径下理论分频 4.34、取整 4，实际 125000 bps，误差 +8.5%，超出 ±4.5% 总预算，不可靠；建议换 11.0592MHz 或降低波特率。' }
            },
            {
              '@type': 'Question',
              name: '为什么 11.0592MHz 是串口神石？',
              acceptedAnswer: { '@type': 'Answer', text: '11.0592MHz ÷ 16 = 691.2kHz，恰为 9600 的 72 倍、115200 的 6 倍，16x 口径下 9600~230400 档档零误差；1.8432MHz 整数倍家族（3.6864/7.3728/14.7456/18.432/22.1184M）同理。' }
            },
            {
              '@type': 'Question',
              name: '8x 和 16x 过采样口径差在哪？',
              acceptedAnswer: { '@type': 'Answer', text: '分频公式只差系数：分频值 = fosc ÷（倍数 × 波特率）。8x 分母小一半、误差约减半，但每位采样点从 16 降到 8，位中央定位与抗噪能力变差。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'uart-baud-error'
const SETTINGS_KEY = 'uart-baud-error-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 常量 ----------
const FOSC_PRESETS = [
  { label: '8 MHz', mhz: 8, hz: 8000000 },
  { label: '11.0592 MHz', mhz: 11.0592, hz: 11059200 },
  { label: '16 MHz', mhz: 16, hz: 16000000 },
  { label: '20 MHz', mhz: 20, hz: 20000000 },
  { label: '72 MHz', mhz: 72, hz: 72000000 }
]
const BAUD_PRESETS = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600]
const CLOCKS = [
  { label: '1.8432 MHz', hz: 1843200 },
  { label: '3.6864 MHz', hz: 3686400 },
  { label: '4 MHz', hz: 4000000 },
  { label: '6 MHz', hz: 6000000 },
  { label: '7.3728 MHz', hz: 7372800 },
  { label: '8 MHz', hz: 8000000 },
  { label: '11.0592 MHz', hz: 11059200 },
  { label: '12 MHz', hz: 12000000 },
  { label: '14.7456 MHz', hz: 14745600 },
  { label: '16 MHz', hz: 16000000 },
  { label: '18.432 MHz', hz: 18432000 },
  { label: '20 MHz', hz: 20000000 },
  { label: '22.1184 MHz', hz: 22118400 },
  { label: '24 MHz', hz: 24000000 },
  { label: '27 MHz', hz: 27000000 },
  { label: '32 MHz', hz: 32000000 },
  { label: '48 MHz', hz: 48000000 },
  { label: '72 MHz', hz: 72000000 }
]

// ---------- 状态 ----------
const foscMhz = ref(11.0592)
const baud = ref(115200)
const oversample = ref(16)
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化 ----------
const fmt = (v, d = 2) => (Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—')
const devText = (e) => (Number.isFinite(e) ? (e >= 0 ? '+' : '') + e.toFixed(2) + '%' : '—')
const errCls = (judge) => judge === 'green'
  ? 'text-green-600 dark:text-green-400'
  : judge === 'amber'
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400'
const errPillCls = (judge) => judge === 'green'
  ? 'bg-green-500/15 text-green-600 dark:text-green-400'
  : judge === 'amber'
    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
    : 'bg-red-500/15 text-red-600 dark:text-red-400'
const judgeText = (judge) => judge === 'green' ? '安全' : judge === 'amber' ? '临界' : '红警'
const judgeAdvice = (judge) => judge === 'amber'
  ? '误差处于临界区：单端已超 ±2%，链路余量不足，建议换时钟、换波特率档位或两端实测确认。'
  : '误差超出 ±4.5% 总预算：一帧内相位会偏出半位，大概率乱码。请换零误差时钟（如 11.0592M）、降低波特率或改用 8x 口径。'

// ---------- 主计算 ----------
const foscHz = computed(() => {
  const m = Number(foscMhz.value)
  if (!Number.isFinite(m) || !(m > 0)) return null
  return Math.round(m * 1e6)
})

const mainResult = computed(() => {
  const hz = foscHz.value
  const b = Number(baud.value)
  if (hz === null || !Number.isFinite(b) || !(b > 0)) return null
  const theo = theoreticalDiv(hz, b, oversample.value)
  if (theo === null) return null
  const div = roundDiv(theo)
  const actual = actualBaud(hz, div, oversample.value)
  const e = errPct(actual, b)
  return { theo, div, actual, errPct: e, judge: judgeErr(e), exact: isExact(theo) }
})

// ---------- 全波特率扫描表 ----------
const baudScan = computed(() => {
  const hz = foscHz.value
  if (hz === null) return []
  return scanBauds(hz, oversample.value, BAUD_PRESETS)
})

// ---------- 反向查时钟 ----------
const clockScan = computed(() => {
  const b = Number(baud.value)
  if (!Number.isFinite(b) || !(b > 0)) return []
  return scanClocks(b, oversample.value, CLOCKS)
})

const exactClockCount = computed(() => clockScan.value.filter(r => r.exact).length)

// ---------- 设置持久化（localStorage，键前缀用工具 id） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (Number.isFinite(s.foscMhz) && s.foscMhz > 0) foscMhz.value = s.foscMhz
    if (Number.isFinite(s.baud) && s.baud > 0) baud.value = s.baud
    if (s.oversample === 8 || s.oversample === 16) oversample.value = s.oversample
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([foscMhz, baud, oversample], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      foscMhz: foscMhz.value,
      baud: baud.value,
      oversample: oversample.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
