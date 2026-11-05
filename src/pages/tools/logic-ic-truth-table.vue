<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Cpu class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">74/4000系列速查</h1>
          <p class="text-sm text-muted-foreground mt-1">常用 74 系与 4000 系逻辑芯片速查：真值表、DIP 引脚图、功能说明、三态/边沿/施密特备注与代换提示</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线逻辑芯片速查表：内置 {{ IC_DB.length }} 个最常用型号（7400 门类、7474/7473 触发器、7490/4017/4040/4060 计数器、
        74138/74151/4511 译码选择、74244/74245/4066 缓冲开关、74121/74123 单稳态与 555 定时器），
        每个型号提供功能一句话、DIP 参数化顶视引脚图、引脚定义表（含 VCC/GND 位置）、真值表/功能表与交互演示
        （点击输入格切换 H/L/X 实时看输出，多路复用器附数据输入口演示态），附 LS/HC/HCT/F 后缀家族对比与 4000↔74 系代换对照。
        全部数据本地渲染，不上传任何数据。
      </p>
    </div>

    <!-- 数据口径与免责（显著位置） -->
    <div class="p-3 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs leading-relaxed flex items-start gap-2">
      <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>
        <strong>引脚与真值表仅供快速参考，设计以原厂 datasheet 为准。</strong>
        同一型号不同厂商/后缀（LS/HC/HCT 等）在电源脚位置、边沿方向、驱动能力上可能存在差异（本页已对 7473/7475/7490/555
        等特殊电源脚单独标注）；关键电路请下载对应厂商的 PDF 规格书交叉核对后再投板。
      </span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧主列 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 搜索 + 分类过滤 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Search class="w-5 h-5 mr-2 text-primary" /> 型号检索
          </h2>
          <input
            v-model="query"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="输入型号或关键词，如 7400、4017、施密特、计数器、三态"
            class="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="c in CATS" :key="c.id"
              @click="catFilter = c.id"
              :class="catFilter === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            >{{ c.name }}<span v-if="c.id !== 'all'" class="ml-1 text-[10px] opacity-70">{{ countByCat(c.id) }}</span></button>
          </div>
          <!-- 型号列表 -->
          <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
            <button
              v-for="ic in filteredIcs" :key="ic.id"
              @click="selectIc(ic.id)"
              class="text-left px-3 py-2 rounded-lg border transition-all"
              :class="selectedId === ic.id ? 'border-primary bg-primary/10' : 'border-border bg-muted/40 hover:bg-muted'"
            >
              <p class="font-mono font-bold text-sm" :class="selectedId === ic.id ? 'text-primary' : 'text-foreground'">{{ ic.id }}</p>
              <p class="text-[11px] text-muted-foreground mt-0.5 leading-tight">{{ ic.name }}</p>
            </button>
            <p v-if="!filteredIcs.length" class="col-span-full text-sm text-muted-foreground py-4 text-center">
              没有匹配「{{ query }}」的型号，试试更短的关键词。
            </p>
          </div>
        </div>

        <!-- 详情卡 -->
        <div v-if="selectedIc" class="bg-card border border-border rounded-lg p-6 space-y-5">
          <!-- 头部 -->
          <div class="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-2xl font-bold font-mono text-foreground">{{ selectedIc.id }}</h2>
                <span class="px-2 py-0.5 rounded text-[10px] font-medium" :class="seriesBadgeCls(selectedIc.series)">{{ seriesLabel(selectedIc.series) }}</span>
                <span class="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">DIP-{{ selectedIc.pins }}</span>
              </div>
              <p class="text-sm text-foreground mt-1">{{ selectedIc.name }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">{{ selectedIc.brief }}</p>
            </div>
            <div class="text-right text-xs text-muted-foreground leading-relaxed">
              <p>电源：<span class="font-mono text-foreground">{{ selectedIc.power.vccName }}={{ selectedIc.power.vccPin }}</span> ·
                 <span class="font-mono text-foreground">{{ selectedIc.power.gndName }}={{ selectedIc.power.gndPin }}</span></p>
              <p v-if="selectedIc.powerNote" class="text-amber-600 dark:text-amber-400 mt-0.5 max-w-[220px]">{{ selectedIc.powerNote }}</p>
            </div>
          </div>

          <!-- DIP SVG + 引脚表 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="bg-muted/40 border border-border rounded-lg p-4">
              <p class="text-sm font-medium text-foreground mb-2">DIP-{{ selectedIc.pins }} 顶视引脚图</p>
              <svg :viewBox="`0 0 300 ${dipHeight}`" class="w-full max-w-[320px] mx-auto" role="img" :aria-label="`${selectedIc.id} DIP-${selectedIc.pins} 顶视引脚图`">
                <rect :x="64" y="20" width="172" :height="dipBodyH" rx="7" class="fill-muted stroke-border" stroke-width="1.6" />
                <path :d="`M ${140} 20 A 11 11 0 0 1 ${162} 20`" class="fill-card stroke-border" stroke-width="1.6" />
                <circle cx="78" cy="34" r="4" class="fill-current text-muted-foreground" />
                <text x="150" :y="dipBodyH / 2 + 4" font-size="13" text-anchor="middle" font-family="monospace" font-weight="bold" class="fill-current text-foreground">{{ selectedIc.id }}</text>
                <template v-for="p in dipLeftPins" :key="p.n">
                  <rect x="34" :y="p.y" width="30" height="12" rx="2.5"
                    class="stroke-border" stroke-width="1.2"
                    :class="pinFillCls(p)" />
                  <text x="30" :y="p.y + 9.5" font-size="9.5" text-anchor="end" class="fill-current text-muted-foreground">{{ p.n }}</text>
                  <text x="118" :y="p.y + 9.5" font-size="10" text-anchor="end" :class="pinTextCls(p)">{{ p.label }}</text>
                </template>
                <template v-for="p in dipRightPins" :key="p.n">
                  <rect x="236" :y="p.y" width="30" height="12" rx="2.5"
                    class="stroke-border" stroke-width="1.2"
                    :class="pinFillCls(p)" />
                  <text x="270" :y="p.y + 9.5" font-size="9.5" class="fill-current text-muted-foreground">{{ p.n }}</text>
                  <text x="182" :y="p.y + 9.5" font-size="10" :class="pinTextCls(p)">{{ p.label }}</text>
                </template>
              </svg>
              <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                顶视图、缺口与圆点在左上（1 脚）。左列自上而下为 1~{{ selectedIc.pins / 2 }}，右列自下而上为 {{ selectedIc.pins / 2 + 1 }}~{{ selectedIc.pins }}。
                <span class="whitespace-nowrap"><span class="inline-block w-2.5 h-2.5 rounded-sm bg-red-500/30 align-middle" /> 电源</span> ·
                <span class="whitespace-nowrap"><span class="inline-block w-2.5 h-2.5 rounded-sm bg-zinc-500/30 align-middle" /> 地</span> ·
                <span class="whitespace-nowrap"><span class="inline-block w-2.5 h-2.5 rounded-sm bg-muted-foreground/10 align-middle" /> 信号 / NC</span>
              </p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-4">
              <p class="text-sm font-medium text-foreground mb-2">引脚定义（{{ selectedIc.pins }} 脚）</p>
              <div class="grid grid-cols-2 gap-x-4 gap-y-1">
                <div v-for="p in selectedIc.pinout" :key="p.n" class="flex items-center gap-2 text-xs border-b border-border/40 py-1">
                  <span class="font-mono text-muted-foreground w-6 text-right">{{ p.n }}</span>
                  <span class="font-mono font-medium" :class="pinLabelCls(p)">{{ pinDisplay(p) }}</span>
                  <span class="text-muted-foreground ml-auto">{{ dirLabel(p.d) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 真值表 / 功能表 -->
          <div class="bg-muted/40 border border-border rounded-lg p-4 space-y-3">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <p class="text-sm font-medium text-foreground">
                {{ selectedIc.truth.kind === 'comb' ? '真值表' : '功能表' }}
                <span class="text-xs text-muted-foreground font-normal">（{{ selectedIc.truth.kind === 'comb' ? '输入组合 → 输出' : '模式表：H=高 L=低 X=任意 ↑/↓=边沿 q=保持' }}）</span>
              </p>
              <p v-if="demoActive" class="text-xs text-muted-foreground">点击输入格切换 H → L → X，输出实时计算 <span v-if="selectedIc.truth.demoNote" class="text-primary">{{ selectedIc.truth.demoNote }}</span></p>
            </div>

            <!-- 交互演示条 -->
            <div v-if="demoActive" class="rounded-lg border border-primary/30 bg-primary/10 p-3 overflow-x-auto">
              <div class="flex items-center gap-2 min-w-max">
                <span class="text-xs text-muted-foreground whitespace-nowrap">演示：</span>
                <button
                  v-for="(cell, i) in demoState" :key="'d' + i"
                  @click="cycleDemo(i)"
                  class="px-2.5 py-1 rounded font-mono text-xs font-bold min-w-[2.2rem] transition-all"
                  :class="cellCls(cell)"
                  :title="demoInsLabels[i] + '：点击切换'"
                >{{ cell }}</button>
                <span class="text-muted-foreground">→</span>
                <span
                  v-for="(out, j) in demoOutputs" :key="'o' + j"
                  class="px-2.5 py-1 rounded font-mono text-xs font-bold min-w-[2.2rem]"
                  :class="cellCls(out)"
                >{{ out }}</span>
              </div>
              <p class="text-[11px] text-muted-foreground mt-2">
                输入：{{ demoInsLabels.join(' · ') }}　输出：{{ demoOutLabels.join(' · ') }}
              </p>
            </div>

            <!-- 静态表 -->
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-muted-foreground">
                    <th class="text-left py-1.5 pr-2 font-medium whitespace-nowrap">#</th>
                    <th v-for="(h, i) in selectedIc.truth.ins" :key="'ih' + i" class="px-2 py-1.5 font-mono font-medium whitespace-nowrap" :class="{ 'overline-cell': isLowIn(selectedIc, i) }">{{ h }}</th>
                    <th class="px-2 text-muted-foreground/50">→</th>
                    <th v-for="(h, j) in selectedIc.truth.outs" :key="'oh' + j" class="px-2 py-1.5 font-mono font-medium whitespace-nowrap" :class="{ 'overline-cell': isLowOut(selectedIc, j) }">{{ h }}</th>
                    <th v-if="rowNoteExists" class="px-2 py-1.5 font-medium">说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(r, ri) in selectedIc.truth.rows" :key="ri"
                    class="border-t border-border/50"
                  >
                    <td class="py-1.5 pr-2 text-muted-foreground/70">{{ ri + 1 }}</td>
                    <td v-for="(cell, ci) in r.i" :key="'i' + ci" class="px-2 py-1.5 font-mono" :class="cellCls(cell)">{{ cell }}</td>
                    <td class="px-2 text-muted-foreground/50">→</td>
                    <td v-for="(cell, co) in r.o" :key="'o' + co" class="px-2 py-1.5 font-mono" :class="cellCls(cell)">{{ cell }}</td>
                    <td v-if="rowNoteExists" class="px-2 py-1.5 text-muted-foreground">{{ (r.note || '') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="selectedIc.truth.note" class="text-xs text-muted-foreground leading-relaxed">{{ selectedIc.truth.note }}</p>
          </div>

          <!-- 备注 -->
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">要点与代换</p>
            <div v-for="(n, ni) in selectedIc.notes" :key="ni" class="flex items-start gap-2 bg-muted/60 border border-border rounded-lg px-3 py-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p class="text-xs text-muted-foreground leading-relaxed">{{ n }}</p>
            </div>
            <NuxtLink
              v-if="selectedIc.id === 'NE555'"
              to="/tools/timer-555-calculator"
              class="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              需要计算 555 频率/占空比？→ 555定时器计算器（含 SVG 电路图）
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 后缀家族说明 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Layers class="w-5 h-5 mr-2 text-primary" /> 74 系后缀家族对比
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-muted-foreground border-b border-border">
                  <th class="text-left py-1.5 pr-2 font-medium">后缀</th>
                  <th class="text-left py-1.5 pr-2 font-medium">速度（典型 tpd）</th>
                  <th class="text-left py-1.5 pr-2 font-medium">电源</th>
                  <th class="text-left py-1.5 font-medium">输入电平/功耗趋势</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in SUFFIX_ROWS" :key="f.name" class="border-b border-border/50 last:border-0">
                  <td class="py-2 pr-2 font-mono font-bold text-primary whitespace-nowrap">{{ f.name }}</td>
                  <td class="py-2 pr-2 text-foreground">{{ f.speed }}</td>
                  <td class="py-2 pr-2 text-foreground whitespace-nowrap">{{ f.supply }}</td>
                  <td class="py-2 text-muted-foreground">{{ f.level }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            速度/功耗为量级趋势（典型 5V 下的门延迟），精确值以各厂 datasheet 为准。
            HC 与 LS 的输入阈值不同（HC 按 VCC 比例，LS 按 TTL 固定阈值），混用 3.3V 系统时选 HCT/LVT 或确认 VIH 兼容。
          </p>
        </div>

        <!-- 40 ↔ 74 代换对照 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Repeat2 class="w-5 h-5 mr-2 text-primary" /> 4000 系 ↔ 74 系常用代换
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-muted-foreground border-b border-border">
                  <th class="text-left py-1.5 pr-2 font-medium">4000 系</th>
                  <th class="text-left py-1.5 pr-2 font-medium">74 系</th>
                  <th class="text-left py-1.5 font-medium">备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in CROSS_ROWS" :key="r.a" class="border-b border-border/50 last:border-0">
                  <td class="py-2 pr-2 font-mono text-foreground whitespace-nowrap">{{ r.a }}</td>
                  <td class="py-2 pr-2 font-mono text-foreground whitespace-nowrap">{{ r.b }}</td>
                  <td class="py-2 text-muted-foreground">{{ r.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            CD4000 系可在 3~15V 宽压工作但输入阈值高（VIH ≈ 0.7×VDD，5V 时约 3.5V），<span class="text-foreground">不能直接被 3.3V 逻辑或 LS 输出可靠驱动</span>；
            74HC 与 CD4000 电平兼容且引脚大多一致（见上表功能对应），但 4001 与 7402 这类"功能相同、引脚不同"的组合务必核对引脚再接线。
          </p>
        </div>

        <!-- 相关工具 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 相关工具
          </h2>
          <ul class="space-y-2 text-sm">
            <li>
              <NuxtLink to="/tools/timer-555-calculator" class="text-primary hover:underline">555定时器计算器</NuxtLink>
              <span class="text-muted-foreground text-xs"> — 555 引脚图互链，频率/占空比/定时正反算与电路图</span>
            </li>
            <li>
              <NuxtLink to="/tools/ic-marking-decoder" class="text-primary hover:underline">IC丝印解读器</NuxtLink>
              <span class="text-muted-foreground text-xs"> — 芯片丝印 date code 解读与厂商前缀速查</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 免责条 -->
    <div class="flex items-start gap-2 p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
        免责声明：本页数据为快速参考性质，覆盖 40 余年、多厂商、多工艺的常见型号，个别厂商版本可能存在引脚或时序差异；
        生产设计请务必以所选具体厂商型号的 datasheet（含 AC/DC 参数、驱动能力、时序）为准。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>74/4000 系列逻辑芯片速查指南</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          7400 系列（TTL，1965 年由 TI 提出）是数字逻辑的"通用词汇表"——7400 与非、7404 反相、7474 D 触发器这些编号五十年来被
          TTL、LS、HC、HCT、F、AHC 等历代工艺沿用，功能与引脚保持了惊人的一致性；CD4000 系列（RCA，CMOS）则是它的低压低功耗兄弟，
          宽压 3~15V、微瓦级静态功耗，编号自成体系但功能大量对应。本页收录 {{ IC_DB.length }} 个最高频型号，按门类、触发/锁存、
          计数/移位、译码/选择、缓冲/开关、定时与其他六类组织，支持型号与关键词检索。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">真值表怎么读</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          真值表把每种输入组合对应的输出逐行列出：组合逻辑（门、译码器、多路选择器）输出只由当前输入决定，
          每一行都是一种完整输入状态；时序逻辑（触发器、计数器、移位寄存器）的表叫功能表，行为依赖时钟边沿与前一状态，
          所以用 ↑/↓ 表示边沿、q 表示"保持前值"。带使能/清零的器件优先看控制列——控制信号不满足时，
          数据列写什么都不会生效，这正是"X = 任意（不影响结果）"的用法。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">X 态与 Z 态是两回事</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          <span class="text-foreground font-medium">X（don't care）</span>是设计层面的"任意/无关"——该输入取 H 或 L 都不影响输出，
          常见于被使能屏蔽的输入列，读表时可以直接忽略。<span class="text-foreground font-medium">Z（高阻）</span>是物理层面的第三态——
          输出级被关断，引脚既不输出高也不输出低，像从总线上"拔掉"了一样，允许其他器件接管总线；
          74373/74374/74244/74245/74125 的 OE 无效时输出即进入 Z。把 X 当成 Z 或反过来都会造成设计错误：
          X 是"你不关心"，Z 是"它不驱动"。多器件共总线时，同一时刻只允许一个输出方处于驱动态，其余必须 Z，否则打架。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">三态输出与开漏输出</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          三态（3-state）在推挽输出级上加了一路"全关"控制，由 OE 脚控制，能主动输出高、低或高阻，
          是总线复用的标准手段；上拉/下拉电阻只能决定悬空时的默认电平。开漏（OD/OC）输出则只有下拉管——
          自身只能输出低或高阻，输出高必须靠外部上拉电阻，好处是天然支持"线与"、可以电平转换（上拉到任意电压）
          并适合 I²C 这类多主总线；代价是上升沿被上拉电阻拖慢。74 系三态件（373/374/244/245/125）与开漏件
          （7406/7407 等）不能混为一谈，代换时先看输出结构。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">代换注意事项（后缀字母含义务）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          型号中间的字母是工艺承诺：74LS00、74HC00、74HCT00、74F00、74AHC00 功能相同，但
          <span class="text-foreground font-medium">速度、输入阈值、电源范围、驱动电流都不相同</span>，不能只看"7400"三个数字就随便换。
          快速判断：LS→HC 需确认输入电平（HC 阈值随 VCC 走）；LS→HCT 通常可直接替换（TTL 兼容输入）；
          3.3V 与 5V 混系统选 LVC/AHC 这类明确标注电压范围的家族；CD40xx 与 74HC 多数可按功能互代，
          但电源范围与驱动能力不同，个别（4001↔7402）引脚根本不同。另外 7473/7475/7490 这类"电源脚不在 14/7（或 16/8）"
          的老编号，换任何后缀都要重新核对电源脚——这是翻车率最高的地方。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">真值表里的 X 是什么意思？和 Z 有什么区别？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              X（don't care）表示该输入取高取低都不影响输出，是"无关项"；Z 表示输出处于高阻态、不驱动任何电平，
              是三态器件被禁用时的物理状态。设计时 X 用来简化表项，Z 用来规划总线；两者互不相干，混用会导致总线冲突或逻辑错误。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">74HC 和 74LS 能直接互相代换吗？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              功能与引脚基本一致，但电平与驱动不同：LS 是 TTL 阈值（VIH≈2V），HC 是 CMOS 阈值（VIH≈0.7×VCC，5V 时约 3.5V）。
              LS 输出驱动 HC 输入处于临界（LS VOH≈3.4V 勉强达标），推荐用 HCT（TTL 兼容输入的 HC）做桥接；
              反向 HC 驱动 LS 一般没问题但要注意 HC ±4mA 的驱动能力。电源范围也不同（LS 5V±0.25，HC 2~6V）。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">4000 系和 74 系怎么互代？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              按功能对号：4011↔7400（与非）、4001↔7402（或非）、4069↔7404（反相）、4070↔7486（异或）、4071↔7432（或）。
              74HC00 等现代 HC 件是两系之间的最佳桥梁（CMOS 工艺、宽压 2~6V、引脚与 74 系一致）。
              注意原始 CD4000 系输入阈值高、不能被 3.3V 逻辑直接驱动；4001 与 7402 引脚排列并不相同，接线前必须核对。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么有些 74 系芯片的 VCC/GND 不在 14/7 脚？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              早期 TTL 编号（7473、7475、7490/7492/7493 等）定义时封装规则尚未统一，电源脚被安排在了非标准位置：
              7473 是 4(VCC)/11(GND)、7475 是 5(VCC)/12(GND)、7490 是 5(VCC)/10(GND)。
              后来 74 系家族扩展统一为 14 脚件 14/7、16 脚件 16/8、20 脚件 20/10，但这几个老编号的"传统"被保留了下来——
              本页详情卡对这类型号在电源行下有黄色单独标注，接线前务必先看电源行。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'logic-ic-truth-table'" :category="'others'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Cpu, Search, Info, CheckCircle, TriangleAlert, ChevronUp, ChevronDown, Layers, Repeat2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

/* ===== 纯函数区开始（node 单测直接复用本段，勿混入 Vue 响应式或浏览器 API） ===== */

// 电平三值逻辑：H / L / X（X = 任意，保守传播）
type Lev = 'H' | 'L' | 'X' | 'Z'

function inv(v: Lev): Lev {
  if (v === 'H') return 'L'
  if (v === 'L') return 'H'
  return 'X'
}
function nand3(a: Lev, b: Lev): Lev { if (a === 'X' || b === 'X') return 'X'; return (a === 'H' && b === 'H') ? 'L' : 'H' }
function nor3(a: Lev, b: Lev): Lev { if (a === 'X' || b === 'X') return 'X'; return (a === 'L' && b === 'L') ? 'H' : 'L' }
function and3(a: Lev, b: Lev): Lev { if (a === 'X' || b === 'X') return 'X'; return (a === 'H' && b === 'H') ? 'H' : 'L' }
function or3(a: Lev, b: Lev): Lev { if (a === 'X' || b === 'X') return 'X'; return (a === 'H' || b === 'H') ? 'H' : 'L' }
function xor3(a: Lev, b: Lev): Lev { if (a === 'X' || b === 'X') return 'X'; return a !== b ? 'H' : 'L' }
function xnor3(a: Lev, b: Lev): Lev { if (a === 'X' || b === 'X') return 'X'; return a === b ? 'H' : 'L' }
function not3(a: Lev): Lev { return a === 'X' ? 'X' : (a === 'H' ? 'L' : 'H') }

// 4511 BCD → 七段（共阴，高有效）：0~9 字形，10~15 熄灭
function seg4511(n0: number): Lev[] {
  const MAP: Record<number, number[]> = {
    0: [1, 1, 1, 1, 1, 1, 0],
    1: [0, 1, 1, 0, 0, 0, 0],
    2: [1, 1, 0, 1, 1, 0, 1],
    3: [1, 1, 1, 1, 0, 0, 1],
    4: [0, 1, 1, 0, 0, 1, 1],
    5: [1, 0, 1, 1, 0, 1, 1],
    6: [1, 0, 1, 1, 1, 1, 1],
    7: [1, 1, 1, 0, 0, 0, 0],
    8: [1, 1, 1, 1, 1, 1, 1],
    9: [1, 1, 1, 1, 0, 1, 1]
  }
  const m = MAP[n0]
  return m.map(x => (x ? 'H' : 'L') as Lev)
}

// 引脚定义紧凑格式 → 对象（d: i 输入 o 输出 io 双向 p 电源 g 地 x 空脚）
interface Pin { n: number; name: string; d: 'i' | 'o' | 'io' | 'p' | 'g' | 'x'; low?: boolean }
function PINS(rows: [number, string, ('i' | 'o' | 'io' | 'p' | 'g' | 'x')?, boolean?][]): Pin[] {
  return rows.map(r => ({ n: r[0], name: r[1], d: r[2] || 'i', low: r[3] || false }))
}

// 通用四门布局（7400 式）：输入 (1,2)→3、(4,5)→6、(9,10)→8、(12,13)→11
function quadGatePins(prefix: string[]): Pin[] {
  return PINS([
    [1, prefix[0] + '1', 'i'], [2, prefix[1] + '1', 'i'], [3, 'Y1', 'o'],
    [4, prefix[0] + '2', 'i'], [5, prefix[1] + '2', 'i'], [6, 'Y2', 'o'],
    [7, 'GND', 'g'], [8, 'Y3', 'o'],
    [9, prefix[0] + '3', 'i'], [10, prefix[1] + '3', 'i'], [11, 'Y4', 'o'],
    [12, prefix[0] + '4', 'i'], [13, prefix[1] + '4', 'i'], [14, 'VCC', 'p']
  ])
}

// 标准电源脚：14 脚 14/7，16 脚 16/8，20 脚 20/10
function stdPower(pins: number, hi: string = 'VCC', lo: string = 'GND') {
  const map: Record<number, [number, number]> = { 14: [14, 7], 16: [16, 8], 20: [20, 10], 8: [8, 1] }
  const m = map[pins] || [pins, pins / 2]
  return { vccPin: m[0], gndPin: m[1], vccName: hi, gndName: lo }
}

interface TruthRow { i: Lev[]; o: (Lev | string)[]; note?: string }
interface Truth {
  kind: 'comb' | 'func'
  ins: string[]
  outs: string[]
  lowIn?: number[]     // 低有效输入列索引（表头加划线）
  lowOut?: number[]    // 低有效输出列索引
  rows: TruthRow[]
  note?: string
  evalFn?: (...a: Lev[]) => (Lev | string)[]
  demoIns?: string[]
  demoInit?: Lev[]
  demoNote?: string
}
interface Ic {
  id: string
  name: string
  series: '74' | '40' | '555'
  cat: 'gate' | 'ff' | 'counter' | 'decoder' | 'buffer' | 'misc'
  brief: string
  pins: number
  pinout: Pin[]
  power: { vccPin: number; gndPin: number; vccName: string; gndName: string }
  powerNote?: string
  truth: Truth
  notes: string[]
}

// ---------- 门类 ----------
const GATE_COMB = (fn: (a: Lev, b: Lev) => Lev): Truth => ({
  kind: 'comb',
  ins: ['A', 'B'],
  outs: ['Y'],
  rows: [
    { i: ['L', 'L'], o: [fn('L', 'L')] },
    { i: ['L', 'H'], o: [fn('L', 'H')] },
    { i: ['H', 'L'], o: [fn('H', 'L')] },
    { i: ['H', 'H'], o: [fn('H', 'H')] }
  ],
  evalFn: (a: Lev, b: Lev) => [fn(a, b)]
})

const IC_DB: Ic[] = [
  // ===== 门类 =====
  {
    id: '7400', name: '四路2输入与非门（NAND）', series: '74', cat: 'gate',
    brief: '四个独立 2 输入与非门，74 系最通用门：两输入同为高才输出低。',
    pins: 14, pinout: quadGatePins(['A', 'B']), power: stdPower(14),
    truth: { ...GATE_COMB(nand3) },
    notes: ['后缀家族：74LS00（TTL 电平、约 10ns）、74HC00（2~6V、CMOS 阈值）、74HCT00（TTL 兼容输入）等，功能与引脚一致，电气参数不同。', '代换：4011 为 CMOS 对应（引脚兼容）；HC↔HCT 电平差异见侧栏家族表。', '未用门的输入应接确定电平（CMOS 悬空易受干扰振荡）。']
  },
  {
    id: '7402', name: '四路2输入或非门（NOR）', series: '74', cat: 'gate',
    brief: '四个独立 2 输入或非门。引脚布局与 7400 不同：输出在 1、4、10、13。',
    pins: 14, pinout: PINS([
      [1, 'Y1', 'o'], [2, 'A1', 'i'], [3, 'B1', 'i'], [4, 'Y2', 'o'], [5, 'A2', 'i'], [6, 'B2', 'i'],
      [7, 'GND', 'g'], [8, 'A3', 'i'], [9, 'B3', 'i'], [10, 'Y3', 'o'], [11, 'A4', 'i'], [12, 'B4', 'i'], [13, 'Y4', 'o'],
      [14, 'VCC', 'p']
    ]),
    power: stdPower(14),
    truth: { ...GATE_COMB(nor3) },
    notes: ['注意：输出脚位置（1/4/10/13）与 7400 式布局不同，这是 74 系唯一"镜像引脚"的四门件。', 'CMOS 对应 4001 的引脚是 7400 式布局——4001 与 7402 功能相同但引脚不兼容，不可直接互换。']
  },
  {
    id: '7404', name: '六反相器（NOT）', series: '74', cat: 'gate',
    brief: '六个独立反相器，做缓冲、取反、整形的最常用件。',
    pins: 14, pinout: PINS([
      [1, 'A1', 'i'], [2, 'Y1', 'o'], [3, 'A2', 'i'], [4, 'Y2', 'o'], [5, 'A3', 'i'], [6, 'Y3', 'o'],
      [7, 'GND', 'g'], [8, 'Y4', 'o'], [9, 'A4', 'i'], [10, 'Y5', 'o'], [11, 'A5', 'i'], [12, 'Y6', 'o'], [13, 'A6', 'i'],
      [14, 'VCC', 'p']
    ]),
    power: stdPower(14),
    truth: {
      kind: 'comb', ins: ['A'], outs: ['Y'],
      rows: [{ i: ['L'], o: ['H'] }, { i: ['H'], o: ['L'] }],
      evalFn: (a: Lev) => [not3(a)]
    },
    notes: ['CMOS 对应 4069（引脚兼容）。', '开漏版本是 7405/7406/7407（输出结构不同，勿按 7404 接线）。', '74HC14 为施密特反相器（引脚兼容），慢边沿整形首选。']
  },
  {
    id: '7408', name: '四路2输入与门（AND）', series: '74', cat: 'gate',
    brief: '四个独立 2 输入与门，两输入同为高输出才为高。',
    pins: 14, pinout: quadGatePins(['A', 'B']), power: stdPower(14),
    truth: { ...GATE_COMB(and3) },
    notes: ['引脚布局与 7400/7432/7486 完全一致。', '三输入与门是 7411，四输入是 7421。']
  },
  {
    id: '7432', name: '四路2输入或门（OR）', series: '74', cat: 'gate',
    brief: '四个独立 2 输入或门，任一输入为高输出即高。',
    pins: 14, pinout: quadGatePins(['A', 'B']), power: stdPower(14),
    truth: { ...GATE_COMB(or3) },
    notes: ['引脚布局与 7400/7408/7486 完全一致。', 'CMOS 对应 4071（引脚兼容）。']
  },
  {
    id: '7486', name: '四路2输入异或门（XOR）', series: '74', cat: 'gate',
    brief: '四个独立 2 输入异或门：输入不同输出高。加法器、奇偶校验、码变换的基础件。',
    pins: 14, pinout: quadGatePins(['A', 'B']), power: stdPower(14),
    truth: { ...GATE_COMB(xor3) },
    notes: ['CMOS 对应 4070（引脚兼容）。', '四输入异或是 74180（9 位奇偶发生器为 74280）。', '一端接 VCC/GND 可作可控反相器：B=H 时 Y=A 反相，B=L 时 Y=A 同相。']
  },
  {
    id: '4001', name: '四路2输入或非门（NOR，CMOS）', series: '40', cat: 'gate',
    brief: 'CD4001：宽压 3~15V 的四或非门，引脚为 7400 式布局（输出 3/4/10/11）。',
    pins: 14, pinout: quadGatePins(['A', 'B']), power: stdPower(14, 'VDD', 'VSS'),
    truth: { ...GATE_COMB(nor3) },
    notes: ['注意：引脚为 7400 式布局（输出 3/4/10/11），与 7402（输出 1/4/10/13）不兼容。', '电源 VDD 3~15V（极限 18V）；输入阈值 VIH ≈ 0.7×VDD，5V 时约 3.5V，不能被 3.3V 逻辑直接驱动。', '74HC02 引脚为 7402 式布局，功能等价但引脚不同——跨系代换务必核对。']
  },
  {
    id: '4011', name: '四路2输入与非门（NAND，CMOS）', series: '40', cat: 'gate',
    brief: 'CD4011：宽压 3~15V 的四与非门，引脚与 7400 兼容，RC 振荡/互锁的经典选择。',
    pins: 14, pinout: quadGatePins(['A', 'B']), power: stdPower(14, 'VDD', 'VSS'),
    truth: { ...GATE_COMB(nand3) },
    notes: ['引脚与 7400/74HC00 兼容，是 4000↔74 系互代最常用的组合。', '两只与非门 + RC 可搭无稳态振荡器（约 1/(2.2RC)），与 555 方案互有取舍。', '输出驱动约 ±1mA@5V（4000 系标准），直接驱动 LED 需限流电阻并接受低亮度。']
  },
  {
    id: '4069', name: '六反相器（NOT，CMOS）', series: '40', cat: 'gate',
    brief: 'CD4069UB：宽压 3~15V 的六反相器，引脚与 7404 兼容。',
    pins: 14, pinout: PINS([
      [1, 'A1', 'i'], [2, 'Y1', 'o'], [3, 'A2', 'i'], [4, 'Y2', 'o'], [5, 'A3', 'i'], [6, 'Y3', 'o'],
      [7, 'VSS', 'g'], [8, 'Y4', 'o'], [9, 'A4', 'i'], [10, 'Y5', 'o'], [11, 'A5', 'i'], [12, 'Y6', 'o'], [13, 'A6', 'i'],
      [14, 'VDD', 'p']
    ]),
    power: stdPower(14, 'VDD', 'VSS'),
    truth: {
      kind: 'comb', ins: ['A'], outs: ['Y'],
      rows: [{ i: ['L'], o: ['H'] }, { i: ['H'], o: ['L'] }],
      evalFn: (a: Lev) => [not3(a)]
    },
    notes: ['引脚与 7404/74HC04 兼容。', 'UB = 未缓冲（单级），增益低但适合线性应用（RC 晶振、放大）；缓冲版 4049/4050 或 74HC04 更适合逻辑。', '一个反相器 + 电阻 + 晶体可搭皮尔斯振荡器（无源晶振方案，见晶振负载电容计算器）。']
  },
  {
    id: '4070', name: '四路2输入异或门（XOR，CMOS）', series: '40', cat: 'gate',
    brief: 'CD4070：宽压 3~15V 的四异或门，引脚与 7486 兼容。',
    pins: 14, pinout: quadGatePins(['A', 'B']), power: stdPower(14, 'VDD', 'VSS'),
    truth: { ...GATE_COMB(xor3) },
    notes: ['引脚与 7486/74HC86 兼容。', '同相输出版本（同或 XNOR）是 4077，引脚一致可直接互换并反相逻辑含义。']
  },
  {
    id: '4093', name: '四路2输入施密特与非门', series: '40', cat: 'gate',
    brief: 'CD4093：带施密特触发输入的四与非门，慢边沿/RC 延时整形神器。',
    pins: 14, pinout: quadGatePins(['A', 'B']), power: stdPower(14, 'VDD', 'VSS'),
    truth: { ...GATE_COMB(nand3), note: '输入带施密特滞回（阈值随 VDD 变化，典型 0.3~0.7×VDD），普通与非门的逻辑表不变，但对慢边沿输入有确定行为。' },
    notes: ['施密特输入：RC 延时、光耦/比较器慢边沿、按键去抖的整形首选。', '74 系对应 74132（引脚不同，7400 式布局但为施密特）。', '单门 + RC 可做长延时整形：迟滞窗口让慢充放电的翻转点确定、抗抖。']
  },
  {
    id: '4071', name: '四路2输入或门（OR，CMOS）', series: '40', cat: 'gate',
    brief: 'CD4071：宽压 3~15V 的四或门，引脚与 7432 兼容。',
    pins: 14, pinout: quadGatePins(['A', 'B']), power: stdPower(14, 'VDD', 'VSS'),
    truth: { ...GATE_COMB(or3) },
    notes: ['引脚与 7432/74HC32 兼容。']
  },
  {
    id: '4077', name: '四路2输入同或门（XNOR，CMOS）', series: '40', cat: 'gate',
    brief: 'CD4077：四同或门（异或非），引脚与 4070/7486 一致。',
    pins: 14, pinout: quadGatePins(['A', 'B']), power: stdPower(14, 'VDD', 'VSS'),
    truth: { ...GATE_COMB(xnor3) },
    notes: ['输入相同输出高——比较器/一致性检测的基础门。', '74 系同或是 74266（开漏输出，引脚不同）。']

  },

  // ===== 触发器 / 锁存 =====
  {
    id: '7474', name: '双D触发器（上升沿）', series: '74', cat: 'ff',
    brief: '两个带异步预置/清零的 D 触发器，CP 上升沿把 D 打入 Q；分频、同步、去抖基础件。',
    pins: 14, pinout: PINS([
      [1, '1CLR', 'i', true], [2, '1D', 'i'], [3, '1CP', 'i'], [4, '1PR', 'i', true], [5, '1Q', 'o'], [6, '1Q', 'o', true],
      [7, 'GND', 'g'], [8, '2Q', 'o', true], [9, '2Q', 'o'], [10, '2PR', 'i', true], [11, '2CP', 'i'], [12, '2D', 'i'], [13, '2CLR', 'i', true],
      [14, 'VCC', 'p']
    ]),
    power: stdPower(14),
    truth: {
      kind: 'func',
      ins: ['PR', 'CLR', 'CP', 'D'],
      lowIn: [0, 1],
      outs: ['Q', 'Q'],
      lowOut: [1],
      rows: [
        { i: ['L', 'H', 'X', 'X'], o: ['H', 'L'], note: '异步预置（PR 优先）' },
        { i: ['H', 'L', 'X', 'X'], o: ['L', 'H'], note: '异步清零' },
        { i: ['L', 'L', 'X', 'X'], o: ['H', 'H'], note: '非法组合，两边同时撤除后输出不定' },
        { i: ['H', 'H', '↑', 'H'], o: ['H', 'L'], note: '上升沿采样 D=H' },
        { i: ['H', 'H', '↑', 'L'], o: ['L', 'H'], note: '上升沿采样 D=L' },
        { i: ['H', 'H', 'H', 'X'], o: ['q', 'q'], note: '无边沿，保持（CP=L 或 ↓ 同理）' }
      ],
      note: 'PR/CLR 异步、低有效且互斥；CP 上升沿有效。Q 与 Q 互补输出。'
    },
    notes: ['上升沿触发（与 7473 的下降沿相反，同一块板混用时注意时钟极性）。', '二分频接法：Q 接回 D，每个 CP 上升沿翻转一次，输出频率为输入一半。', 'CMOS 对应 74HC74 引脚一致。']
  },
  {
    id: '7473', name: '双JK触发器（下降沿）', series: '74', cat: 'ff',
    brief: '两个带异步清零的 JK 触发器，CP 下降沿按 J/K 规则翻转；含异步低有效清零。',
    pins: 14, pinout: PINS([
      [1, '1CP', 'i'], [2, '1CLR', 'i', true], [3, '1K', 'i'], [4, 'VCC', 'p'], [5, '2CP', 'i'], [6, '2CLR', 'i', true], [7, '2J', 'i'],
      [8, '2Q', 'o', true], [9, '2Q', 'o'], [10, '2K', 'i'], [11, 'GND', 'g'], [12, '1Q', 'o'], [13, '1Q', 'o', true], [14, '1J', 'i']
    ]),
    power: { vccPin: 4, gndPin: 11, vccName: 'VCC', gndName: 'GND' },
    powerNote: '电源脚为特殊位置：VCC=4、GND=11（非 14/7）。TTL 与 74HC73 均如此，接线前务必核对。',
    truth: {
      kind: 'func',
      ins: ['CLR', 'CP', 'J', 'K'],
      lowIn: [0],
      outs: ['Q', 'Q'],
      lowOut: [1],
      rows: [
        { i: ['L', 'X', 'X', 'X'], o: ['L', 'H'], note: '异步清零（低有效、优先）' },
        { i: ['H', '↓', 'L', 'L'], o: ['q', 'q'], note: '保持' },
        { i: ['H', '↓', 'L', 'H'], o: ['L', 'H'], note: '复位' },
        { i: ['H', '↓', 'H', 'L'], o: ['H', 'L'], note: '置位' },
        { i: ['H', '↓', 'H', 'H'], o: ['q', 'q'], note: '翻转（Q 取反）' },
        { i: ['H', '↑', 'X', 'X'], o: ['q', 'q'], note: '时钟高电平期间输入被锁定，不动作' }
      ],
      note: '下降沿触发。TTL 7473 无异步预置（需要预置用 7476，但 7476 电源脚同样特殊：VCC=5/GND=13）。'
    },
    notes: ['电源脚特殊：VCC=4、GND=11。', 'J=K=1 时为翻转模式，接成二分频计数器。', '下降沿触发——与 7474 混用同一时钟时注意极性差。', '74HC73 引脚与本表一致（Nexperia datasheet 核对）。']
  },
  {
    id: '7475', name: '四D锁存器（透明型）', series: '74', cat: 'ff',
    brief: '四个透明 D 锁存器：LE 高电平期间 Q 跟随 D，LE 变低锁存；两组分别使能。',
    pins: 16, pinout: PINS([
      [1, '1Q', 'o', true], [2, '1D', 'i'], [3, '2D', 'i'], [4, 'LE34', 'i'], [5, 'VCC', 'p'], [6, '3D', 'i'], [7, '4D', 'i'],
      [8, '4Q', 'o', true], [9, '4Q', 'o'], [10, '3Q', 'o'], [11, '3Q', 'o', true], [12, 'GND', 'g'], [13, 'LE12', 'i'],
      [14, '2Q', 'o', true], [15, '2Q', 'o'], [16, '1Q', 'o']
    ]),
    power: { vccPin: 5, gndPin: 12, vccName: 'VCC', gndName: 'GND' },
    powerNote: '电源脚为特殊位置：VCC=5、GND=12（"居中"排布，非 16/8）。TTL 74LS75 与 74HC75 均如此。',
    truth: {
      kind: 'func',
      ins: ['LE', 'D'],
      outs: ['Q', 'Q'],
      lowOut: [1],
      rows: [
        { i: ['H', 'H'], o: ['H', 'L'], note: '透明：Q 跟随 D' },
        { i: ['H', 'L'], o: ['L', 'H'], note: '透明：Q 跟随 D' },
        { i: ['L', 'X'], o: ['q', 'q'], note: '锁存：LE 下降沿前的 D 被保持' }
      ],
      note: 'LE12（13 脚）控制锁存器 1/2，LE34（4 脚）控制锁存器 3/4。'
    },
    notes: ['电源脚特殊：VCC=5、GND=12。', '透明锁存器不是边沿触发：LE=H 期间 D 的任何变化都会穿透到 Q，做总线锁存时要在数据稳定后才拉低 LE。', '后继型号 74373 为三态八位版本。']
  },
  {
    id: '74373', name: '八D锁存器（三态）', series: '74', cat: 'ff',
    brief: '八位透明锁存器 + 三态输出：LE 高透明、低锁存，OE 无效时输出高阻，总线锁存标准件。',
    pins: 20, pinout: PINS([
      [1, 'OE', 'i', true], [2, '1Q', 'o'], [3, '1D', 'i'], [4, '2D', 'i'], [5, '2Q', 'o'], [6, '3Q', 'o'], [7, '3D', 'i'], [8, '4D', 'i'], [9, '4Q', 'o'],
      [10, 'GND', 'g'], [11, 'LE', 'i'], [12, '5Q', 'o'], [13, '5D', 'i'], [14, '6D', 'i'], [15, '6Q', 'o'], [16, '7Q', 'o'], [17, '7D', 'i'], [18, '8D', 'i'], [19, '8Q', 'o'],
      [20, 'VCC', 'p']
    ]),
    power: stdPower(20),
    truth: {
      kind: 'func',
      ins: ['OE', 'LE', 'D'],
      lowIn: [0],
      outs: ['Q'],
      rows: [
        { i: ['L', 'H', 'H'], o: ['H'], note: '透明' },
        { i: ['L', 'H', 'L'], o: ['L'], note: '透明' },
        { i: ['L', 'L', 'X'], o: ['q'], note: '锁存保持' },
        { i: ['H', 'X', 'X'], o: ['Z'], note: '输出高阻，总线让出' }
      ],
      note: 'OE 低有效。LE=H 期间输出穿透变化，做地址锁存时在地址稳定后拉低 LE（8051 ALE 口径）。'
    },
    notes: ['三态输出：OE 无效时 8 位全部高阻。', '74573 为功能等价（输入输出同侧排布、LE/OE 低有效口径同），PCB 布线更方便。', '对应边沿版本是 74374（下条）。']
  },
  {
    id: '74374', name: '八D触发器（三态，上升沿）', series: '74', cat: 'ff',
    brief: '八位 D 触发器 + 三态输出：CP 上升沿统一打入，OE 无效输出高阻；总线寄存标准件。',
    pins: 20, pinout: PINS([
      [1, 'OE', 'i', true], [2, '1Q', 'o'], [3, '1D', 'i'], [4, '2D', 'i'], [5, '2Q', 'o'], [6, '3Q', 'o'], [7, '3D', 'i'], [8, '4D', 'i'], [9, '4Q', 'o'],
      [10, 'GND', 'g'], [11, 'CP', 'i'], [12, '5Q', 'o'], [13, '5D', 'i'], [14, '6D', 'i'], [15, '6Q', 'o'], [16, '7Q', 'o'], [17, '7D', 'i'], [18, '8D', 'i'], [19, '8Q', 'o'],
      [20, 'VCC', 'p']
    ]),
    power: stdPower(20),
    truth: {
      kind: 'func',
      ins: ['OE', 'CP', 'D'],
      lowIn: [0],
      outs: ['Q'],
      rows: [
        { i: ['L', '↑', 'H'], o: ['H'], note: '上升沿打入 D=H' },
        { i: ['L', '↑', 'L'], o: ['L'], note: '上升沿打入 D=L' },
        { i: ['L', 'H', 'X'], o: ['q'], note: '无上升沿，保持（CP=L 或 ↓ 同理）' },
        { i: ['H', 'X', 'X'], o: ['Z'], note: '输出高阻' }
      ],
      note: '与 74373 的差别：本件为 CP 上升沿触发的边沿寄存器，373 为电平透明锁存器——引脚相同（11 脚功能名不同），代换要看时序需求。'
    },
    notes: ['上升沿触发：所有 8 位在同一时钟沿统一切换，输出组内天然同步。', '三态输出：OE 无效时全部高阻。', '74574 为功能等价的同侧排布版本。']
  },

  // ===== 计数 / 移位 =====
  {
    id: '7490', name: '十进制计数器（÷2+÷5）', series: '74', cat: 'counter',
    brief: '二-五-十进制异步计数器：CKA÷2、CKB÷5，Q0 接 CKB 即成 BCD 十进制；带清零与置 9。',
    pins: 14, pinout: PINS([
      [1, 'CP1', 'i'], [2, 'R0(1)', 'i'], [3, 'R0(2)', 'i'], [4, 'NC', 'x'], [5, 'VCC', 'p'], [6, 'R9(1)', 'i'], [7, 'R9(2)', 'i'],
      [8, 'Q2', 'o'], [9, 'Q1', 'o'], [10, 'GND', 'g'], [11, 'Q3', 'o'], [12, 'Q0', 'o'], [13, 'NC', 'x'], [14, 'CP0', 'i']
    ]),
    power: { vccPin: 5, gndPin: 10, vccName: 'VCC', gndName: 'GND' },
    powerNote: '电源脚为特殊位置：VCC=5、GND=10（7490/7492/7493 家族共用此排布）。',
    truth: {
      kind: 'func',
      ins: ['R0(1)', 'R0(2)', 'R9(1)', 'R9(2)', 'CK'],
      outs: ['输出'],
      rows: [
        { i: ['H', 'H', 'L', 'L', 'X'], o: ['0000'], note: '异步清零' },
        { i: ['L', 'L', 'H', 'H', 'X'], o: ['1001'], note: '异步置 9（Q3 Q2 Q1 Q0 = 1001）' },
        { i: ['L', 'L', 'L', 'L', '↓'], o: ['计数'], note: '下降沿计数：CKA 使 Q0 翻转，CKB 驱动 Q1~Q3' }
      ],
      note: 'BCD 接法：时钟入 CP0（14），Q0（12）接 CP1（1），从 Q3~Q0 读出 8421 码。下降沿触发。R9 与 R0 同时有效时以 R9 为准。'
    },
    notes: ['电源脚特殊：VCC=5、GND=10。', '下降沿触发（与 74161 的上升沿相反）。', '÷6：CKA 入、Q1 接 R0(1)、Q2 接 R0(2)；÷10（二五混合输出）：CKB 入、Q3 接 R0(1)、Q0 接 R0(2) 可得 ÷10 的 5421 码。', '74HC90 引脚一致。']
  },
  {
    id: '74161', name: '4位二进制同步计数器', series: '74', cat: 'counter',
    brief: '带同步预置与异步清零的 4 位同步计数器，CEP/CET 双使能、RCO 级联输出；上升沿计数。',
    pins: 16, pinout: PINS([
      [1, 'CLR', 'i', true], [2, 'CP', 'i'], [3, 'D0', 'i'], [4, 'D1', 'i'], [5, 'D2', 'i'], [6, 'D3', 'i'], [7, 'CEP', 'i'],
      [8, 'GND', 'g'], [9, 'PE', 'i', true], [10, 'CET', 'i'], [11, 'Q3', 'o'], [12, 'Q2', 'o'], [13, 'Q1', 'o'], [14, 'Q0', 'o'], [15, 'TCO', 'o'],
      [16, 'VCC', 'p']
    ]),
    power: stdPower(16),
    truth: {
      kind: 'func',
      ins: ['CLR', 'PE', 'CEP', 'CET', 'CP'],
      lowIn: [0, 1],
      outs: ['行为'],
      rows: [
        { i: ['L', 'X', 'X', 'X', 'X'], o: ['异步清零'], note: 'Q0~Q3 全 L（不受 CP 影响）' },
        { i: ['H', 'L', 'X', 'X', '↑'], o: ['同步预置'], note: '上升沿把 D0~D3 打入 Q' },
        { i: ['H', 'H', 'H', 'H', '↑'], o: ['加1计数'], note: '0000→1111 循环' },
        { i: ['H', 'H', 'X', 'L', 'X'], o: ['保持'], note: 'CET=L：保持且 TCO=L' },
        { i: ['H', 'H', 'L', 'X', 'X'], o: ['保持'], note: 'CEP=L：保持（TCO 仍可用）' }
      ],
      note: 'TCO（15）= Q0·Q1·Q2·Q3·CET，计到 1111 且 CET=H 时为高，用于多片级联（TCO→下一级 CEP/CET）。'
    },
    notes: ['上升沿触发。清零为异步（74163 为同步清零版本，其余相同）。', '级联：低位 TCO 接高位 CET（或 CEP），同步级联所有片共用 CP。', '10 进制版本是 74160（BCD 计数），引脚一致。']
  },
  {
    id: '74164', name: '8位移位寄存器（串入并出）', series: '74', cat: 'counter',
    brief: '8 位串入并出移位寄存器：串行输入 A·B 经与门，CP 上升沿逐位右移，带异步清零。',
    pins: 14, pinout: PINS([
      [1, 'DSA', 'i'], [2, 'DSB', 'i'], [3, 'Q0', 'o'], [4, 'Q1', 'o'], [5, 'Q2', 'o'], [6, 'Q3', 'o'],
      [7, 'GND', 'g'], [8, 'CP', 'i'], [9, 'MR', 'i', true], [10, 'Q4', 'o'], [11, 'Q5', 'o'], [12, 'Q6', 'o'], [13, 'Q7', 'o'],
      [14, 'VCC', 'p']
    ]),
    power: stdPower(14),
    truth: {
      kind: 'func',
      ins: ['MR', 'CP', 'DSA·DSB'],
      lowIn: [0],
      outs: ['Q0~Q7'],
      rows: [
        { i: ['L', 'X', 'X'], o: ['全L'], note: '异步清零' },
        { i: ['H', '↑', 'H'], o: ['右移'], note: 'Q0←A·B=H，其余各位依次右移' },
        { i: ['H', '↑', 'L'], o: ['右移'], note: 'Q0←A·B=L' },
        { i: ['H', 'H', 'X'], o: ['保持'], note: '无上升沿不动作（CP=L 或 ↓ 同理）' }
      ],
      note: '串行输入为 A 与 B 的与：不用的那一路接 VCC 即可。单片机 GPIO 扩展输出用 Q0~Q7（3~6、10~13 脚），级联时 Q7（13）接下一片串入。'
    },
    notes: ['上升沿移位；输入 = A·B（与门）。', '驱动 595 类输出锁存前，本片是"直出"型：移位过程 Q 全程可见。', '配 74HC595（带锁存）更适合 LED 静态显示。']
  },
  {
    id: '74165', name: '8位并行加载移位寄存器（并入串出）', series: '74', cat: 'counter',
    brief: '8 位并入串出移位寄存器：SH/LD 低异步并行装入，高电平下 CP 上升沿向 QH 右移；带时钟禁止。',
    pins: 16, pinout: PINS([
      [1, 'SH/LD', 'i', true], [2, 'CP', 'i'], [3, 'E', 'i'], [4, 'F', 'i'], [5, 'G', 'i'], [6, 'H', 'i'], [7, 'QH', 'o', true],
      [8, 'GND', 'g'], [9, 'QH', 'o'], [10, 'SER', 'i'], [11, 'A', 'i'], [12, 'B', 'i'], [13, 'C', 'i'], [14, 'D', 'i'], [15, 'CLK INH', 'i'],
      [16, 'VCC', 'p']
    ]),
    power: stdPower(16),
    truth: {
      kind: 'func',
      ins: ['SH/LD', 'CLK INH', 'CP'],
      lowIn: [0],
      outs: ['行为'],
      rows: [
        { i: ['L', 'X', 'X'], o: ['并行装入'], note: 'A~H 异步装入各级（与 CLK 无关）' },
        { i: ['H', '↑', 'L'], o: ['右移'], note: 'SER 进入首级，各位向 QH 移动' },
        { i: ['H', 'X', 'H'], o: ['保持'], note: 'CLK INH=H 禁止时钟' },
        { i: ['H', 'H/L', 'X'], o: ['保持'], note: '无上升沿不动作' }
      ],
      note: '并行输入按 A~H 命名：A=11、B=12、C=13、D=14、E=3、F=4、G=5、H=6。串出 QH=9（互补 QH=7）。CLK 与 CLK INH 功能可互换，但 CLK INH 只能在 CP=H 时拉高。'
    },
    notes: ['并行装载是异步的（SH/LD=L 立即生效），装载后拉高再给时钟即串行移出。', '单片机 GPIO 扩展输入的标准件；级联时 QH→下一片 SER。', '引脚经 TI SN74HC165 datasheet 核对：SER=10、CLK INH=15、QH=9、QH=7。']
  },
  {
    id: '74393', name: '双4位二进制纹波计数器', series: '74', cat: 'counter',
    brief: '两个独立 4 位二进制纹波计数器（负沿计数、高有效 MR），级联可成 8 位。',
    pins: 14, pinout: PINS([
      [1, '1CP', 'i'], [2, '1MR', 'i'], [3, '1Q0', 'o'], [4, '1Q1', 'o'], [5, '1Q2', 'o'], [6, '1Q3', 'o'],
      [7, 'GND', 'g'], [8, '2Q3', 'o'], [9, '2Q2', 'o'], [10, '2Q1', 'o'], [11, '2Q0', 'o'], [12, '2MR', 'i'], [13, '2CP', 'i'],
      [14, 'VCC', 'p']
    ]),
    power: stdPower(14),
    truth: {
      kind: 'func',
      ins: ['MR', 'CP'],
      outs: ['Q0~Q3'],
      rows: [
        { i: ['H', 'X'], o: ['全L'], note: '异步主复位（高有效）' },
        { i: ['L', '↓'], o: ['加1'], note: '下降沿纹波计数 0000→1111 循环' },
        { i: ['L', '↑'], o: ['保持'], note: '上升沿不计数' }
      ],
      note: '第二组输出排布镜像（8=2Q3 … 11=2Q0）。级联：1Q3（6 脚）接 2CP（13 脚）即得 8 位分频。'
    },
    notes: ['下降沿计数、MR 高有效——与 74161（上升沿、CLR 低有效）全相反，混用注意。', '纹波（异步）计数：各级输出有传播延迟，高速同步场合用 74161/74163。', '74HC393 与本表一致（Nexperia/ON 半导体 datasheet 核对）。']
  },
  {
    id: '4017', name: '十进制约翰逊计数器（10路译码输出）', series: '40', cat: 'counter',
    brief: 'CD4017：10 个顺序译码输出 Q0~Q9 依次变高，LED 流水灯/顺序控制经典件；带 CO 级联输出。',
    pins: 16, pinout: PINS([
      [1, 'Q5', 'o'], [2, 'Q1', 'o'], [3, 'Q0', 'o'], [4, 'Q2', 'o'], [5, 'Q6', 'o'], [6, 'Q7', 'o'], [7, 'Q3', 'o'],
      [8, 'VSS', 'g'], [9, 'Q8', 'o'], [10, 'Q4', 'o'], [11, 'Q9', 'o'], [12, 'CO', 'o'], [13, 'CLK INH', 'i', true], [14, 'CP', 'i'], [15, 'MR', 'i'],
      [16, 'VDD', 'p']
    ]),
    power: stdPower(16, 'VDD', 'VSS'),
    truth: {
      kind: 'func',
      ins: ['MR', 'CP', 'CLK INH'],
      outs: ['输出'],
      rows: [
        { i: ['H', 'X', 'X'], o: ['复位'], note: 'Q0=H，Q1~Q9=L（MR 高有效）' },
        { i: ['L', '↑', 'L'], o: ['计数'], note: 'Q0→Q1→…→Q9→Q0 依次循环，每次只有一个输出为高' },
        { i: ['L', 'X', 'H'], o: ['保持'], note: 'CLK INH=H 禁止计数' }
      ],
      note: 'CO（12 脚）为 ÷10 对称方波（前半周期高、后半周期低），可作下一级时钟实现十进制级联。CP 上升沿计数；CLK INH 低有效，其上升沿（CP=H 时）亦计数。'
    },
    notes: ['输出顺序为 Q0,Q2,Q1,Q3,Q4,Q5,Q6,Q7,Q8,Q9 对应引脚 3,4,2,7,10,1,5,6,9,11——接线时按引脚表核对。', 'MR 高有效（15 脚），与 74 系多数低有效清零相反。', '供电 3~15V；驱动 LED 建议每路加限流电阻，输出拉电流约 ±1mA@5V~10mA@15V。']
  },
  {
    id: '4040', name: '12级二进制纹波计数器', series: '40', cat: 'counter',
    brief: 'CD4040：12 位纹波分频器（Q1~Q12 全部引出），分频比 2~4096，时钟/定时分频经典件。',
    pins: 16, pinout: PINS([
      [1, 'Q12', 'o'], [2, 'Q6', 'o'], [3, 'Q5', 'o'], [4, 'Q7', 'o'], [5, 'Q4', 'o'], [6, 'Q3', 'o'], [7, 'Q2', 'o'],
      [8, 'VSS', 'g'], [9, 'Q1', 'o'], [10, 'CP', 'i'], [11, 'MR', 'i'], [12, 'Q9', 'o'], [13, 'Q8', 'o'], [14, 'Q10', 'o'], [15, 'Q11', 'o'],
      [16, 'VDD', 'p']
    ]),
    power: stdPower(16, 'VDD', 'VSS'),
    truth: {
      kind: 'func',
      ins: ['MR', 'CP'],
      outs: ['Q1~Q12'],
      rows: [
        { i: ['H', 'X'], o: ['全L'], note: '异步复位（高有效）' },
        { i: ['L', '↓'], o: ['纹波加1'], note: '下降沿计数，Qn 频率 = CP/2ⁿ' },
        { i: ['L', '↑'], o: ['保持'], note: '上升沿不计数' }
      ],
      note: '输出引脚顺序"乱序"（Q1=9、Q2=7、Q3=6、Q4=5、Q5=3、Q6=2、Q7=4、Q8=13、Q9=12、Q10=14、Q11=15、Q12=1），接线按表核对。Nexperia HEF4040B 的 Q0~Q11 与 TI CD4040B 的 Q1~Q12 为同一物理引脚、编号差 1。'
    },
    notes: ['下降沿计数、MR 高有效。', 'Q1=CP/2、Q2=CP/4 …… Q12=CP/4096，是长分频与秒脉冲生成的常客。', '需要振荡器一体化的用 4060（14 级 + RC 振荡）。']
  },
  {
    id: '4060', name: '14级纹波计数器 + RC振荡器', series: '40', cat: 'counter',
    brief: 'CD4060：14 级分频 + 内置 RC 振荡器，接 R/C 即自激；秒级长定时的经典时钟源。',
    pins: 16, pinout: PINS([
      [1, 'Q12', 'o'], [2, 'Q13', 'o'], [3, 'Q14', 'o'], [4, 'Q6', 'o'], [5, 'Q5', 'o'], [6, 'Q7', 'o'], [7, 'Q4', 'o'],
      [8, 'VSS', 'g'], [9, 'CTC', 'io'], [10, 'RTC', 'io'], [11, 'RS', 'i'], [12, 'MR', 'i'], [13, 'Q10', 'o'], [14, 'Q9', 'o'], [15, 'Q8', 'o'],
      [16, 'VDD', 'p']
    ]),
    power: stdPower(16, 'VDD', 'VSS'),
    truth: {
      kind: 'func',
      ins: ['MR', 'CP(11脚)'],
      outs: ['Q 输出'],
      rows: [
        { i: ['H', 'X'], o: ['全L'], note: '异步复位（高有效）' },
        { i: ['L', '↓'], o: ['纹波加1'], note: '下降沿计数；RC 自激时内部时钟自动供给' }
      ],
      note: 'RC 振荡接法：定时电阻接 10（RTC）、定时电容接 9（CTC）、公共端接 11（RS），自激频率约 1/(2.3×R×C)（量级估算，以 datasheet 为准）；也可外部时钟直接驱动 11 脚。可用输出为 Q4~Q10、Q12~Q14（TI CD4060B 命名），Nexperia HEF4060B 将同名引脚标为 Q3~Q9、Q11~Q13（编号差 1，物理引脚一致）。'
    },
    notes: ['Q11（TI 命名）与 Q13 未引出；最低可用分频为 ÷16（Q4，7 脚）。', '下降沿计数、MR 高有效（12 脚）。', '振荡电阻建议 10k~1MΩ、电容 ≥100pF（低于此杂散电容误差占比大）；走晶振时把 R 换成晶体 + 补偿电容接 10/11 脚。']
  },

  // ===== 译码 / 选择 =====
  {
    id: '74138', name: '3-8线译码器（低有效输出）', series: '74', cat: 'decoder',
    brief: '3 位输入译码 8 路低有效输出，三路使能（G1 + G2A/G2B）可级联成 4-16 译码；地址译码经典件。',
    pins: 16, pinout: PINS([
      [1, 'A', 'i'], [2, 'B', 'i'], [3, 'C', 'i'], [4, 'G2A', 'i', true], [5, 'G2B', 'i', true], [6, 'G1', 'i'], [7, 'Y7', 'o', true],
      [8, 'GND', 'g'], [9, 'Y6', 'o', true], [10, 'Y5', 'o', true], [11, 'Y4', 'o', true], [12, 'Y3', 'o', true], [13, 'Y2', 'o', true], [14, 'Y1', 'o', true], [15, 'Y0', 'o', true],
      [16, 'VCC', 'p']
    ]),
    power: stdPower(16),
    truth: {
      kind: 'comb',
      ins: ['G1', 'G2A', 'G2B', 'C', 'B', 'A'],
      lowIn: [1, 2],
      outs: ['Y0', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7'],
      lowOut: [0, 1, 2, 3, 4, 5, 6, 7],
      rows: [
        { i: ['L', 'X', 'X', 'X', 'X', 'X'], o: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], note: 'G1=L 禁止' },
        { i: ['H', 'H', 'X', 'X', 'X', 'X'], o: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], note: 'G2A=H 禁止' },
        { i: ['H', 'X', 'H', 'X', 'X', 'X'], o: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], note: 'G2B=H 禁止' },
        { i: ['H', 'L', 'L', 'L', 'L', 'L'], o: ['L', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], note: 'CBA=000 → Y0' },
        { i: ['H', 'L', 'L', 'L', 'L', 'H'], o: ['H', 'L', 'H', 'H', 'H', 'H', 'H', 'H'], note: 'CBA=001 → Y1' },
        { i: ['H', 'L', 'L', 'L', 'H', 'L'], o: ['H', 'H', 'L', 'H', 'H', 'H', 'H', 'H'], note: 'CBA=010 → Y2' },
        { i: ['H', 'L', 'L', 'L', 'H', 'H'], o: ['H', 'H', 'H', 'L', 'H', 'H', 'H', 'H'], note: 'CBA=011 → Y3' },
        { i: ['H', 'L', 'L', 'H', 'L', 'L'], o: ['H', 'H', 'H', 'H', 'L', 'H', 'H', 'H'], note: 'CBA=100 → Y4' },
        { i: ['H', 'L', 'L', 'H', 'L', 'H'], o: ['H', 'H', 'H', 'H', 'H', 'L', 'H', 'H'], note: 'CBA=101 → Y5' },
        { i: ['H', 'L', 'L', 'H', 'H', 'L'], o: ['H', 'H', 'H', 'H', 'H', 'H', 'L', 'H'], note: 'CBA=110 → Y6' },
        { i: ['H', 'L', 'L', 'H', 'H', 'H'], o: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'L'], note: 'CBA=111 → Y7' }
      ],
      evalFn: (g1: Lev, g2a: Lev, g2b: Lev, c: Lev, b: Lev, a: Lev) => {
        if (g1 === 'L' || g2a === 'H' || g2b === 'H') return ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H']
        if (c === 'X' || b === 'X' || a === 'X') return ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X']
        const sel = (c === 'H' ? 4 : 0) + (b === 'H' ? 2 : 0) + (a === 'H' ? 1 : 0)
        return [0, 1, 2, 3, 4, 5, 6, 7].map(i => (i === sel ? 'L' : 'H') as Lev)
      },
      note: '使能条件：G1=H 且 G2A=G2B=L。输出低有效。'
    },
    notes: ['级联 4-16：两片的 A/B/C 并接，G1 与 G2 互接第四位地址即可（一片使能奇数半区、另一片偶数半区）。', 'CMOS 对应 74HC138 引脚一致；4000 系对应 4028（BCD 译码，输出高有效、引脚不同）。', '两片 138 + 反相器亦可作 3-8 的"去毛刺"使能扩展。']
  },
  {
    id: '74139', name: '双2-4线译码器（低有效输出）', series: '74', cat: 'decoder',
    brief: '两个独立 2 位译码器，各带低有效使能；输出低有效。地址译码/片选分配常用。',
    pins: 16, pinout: PINS([
      [1, '1G', 'i', true], [2, '1A0', 'i'], [3, '1A1', 'i'], [4, '1Y0', 'o', true], [5, '1Y1', 'o', true], [6, '1Y2', 'o', true], [7, '1Y3', 'o', true],
      [8, 'GND', 'g'], [9, '2Y3', 'o', true], [10, '2Y2', 'o', true], [11, '2Y1', 'o', true], [12, '2Y0', 'o', true], [13, '2A1', 'i'], [14, '2A0', 'i'], [15, '2G', 'i', true],
      [16, 'VCC', 'p']
    ]),
    power: stdPower(16),
    truth: {
      kind: 'comb',
      ins: ['1G', '1A1', '1A0'],
      lowIn: [0],
      outs: ['1Y0', '1Y1', '1Y2', '1Y3'],
      lowOut: [0, 1, 2, 3],
      rows: [
        { i: ['H', 'X', 'X'], o: ['H', 'H', 'H', 'H'], note: '使能无效（第二半同构：2G=15、2A0=14、2A1=13、输出 9~12）' },
        { i: ['L', 'L', 'L'], o: ['L', 'H', 'H', 'H'], note: 'A1A0=00 → Y0' },
        { i: ['L', 'L', 'H'], o: ['H', 'L', 'H', 'H'], note: 'A1A0=01 → Y1' },
        { i: ['L', 'H', 'L'], o: ['H', 'H', 'L', 'H'], note: 'A1A0=10 → Y2' },
        { i: ['L', 'H', 'H'], o: ['H', 'H', 'H', 'L'], note: 'A1A0=11 → Y3' }
      ],
      evalFn: (e: Lev, b: Lev, a: Lev) => {
        if (e === 'H') return ['H', 'H', 'H', 'H']
        if (b === 'X' || a === 'X') return ['X', 'X', 'X', 'X']
        const sel = (b === 'H' ? 2 : 0) + (a === 'H' ? 1 : 0)
        return [0, 1, 2, 3].map(i => (i === sel ? 'L' : 'H') as Lev)
      },
      note: '表中为第一半；两半结构相同。使能 G 低有效。'
    },
    notes: ['输出低有效，可直接驱动片选。', '74155 为输出高/低可选的双 2-4 译码（引脚不同）。']
  },
  {
    id: '74153', name: '双4选1数据选择器', series: '74', cat: 'decoder',
    brief: '两个 4 选 1 多路选择器共享选择端 A/B，各自带低有效选通；输出非三态（禁止时为低）。',
    pins: 16, pinout: PINS([
      [1, '1G', 'i', true], [2, 'B(S1)', 'i'], [3, '1I3', 'i'], [4, '1I2', 'i'], [5, '1I1', 'i'], [6, '1I0', 'i'], [7, '1Y', 'o'],
      [8, 'GND', 'g'], [9, '2Y', 'o'], [10, '2I0', 'i'], [11, '2I1', 'i'], [12, '2I2', 'i'], [13, '2I3', 'i'], [14, 'A(S0)', 'i'], [15, '2G', 'i', true],
      [16, 'VCC', 'p']
    ]),
    power: stdPower(16),
    truth: {
      kind: 'func',
      ins: ['1G', 'B', 'A'],
      lowIn: [0],
      outs: ['1Y'],
      rows: [
        { i: ['H', 'X', 'X'], o: ['L'], note: '选通无效，输出强制低（非高阻）' },
        { i: ['L', 'L', 'L'], o: ['1I0'], note: 'BA=00 选择 I0' },
        { i: ['L', 'L', 'H'], o: ['1I1'], note: 'BA=01 选择 I1' },
        { i: ['L', 'H', 'L'], o: ['1I2'], note: 'BA=10 选择 I2' },
        { i: ['L', 'H', 'H'], o: ['1I3'], note: 'BA=11 选择 I3' }
      ],
      demoIns: ['1G', 'B', 'A', '1I0', '1I1', '1I2', '1I3'],
      demoInit: ['L', 'H', 'L', 'L', 'H', 'L', 'H'],
      demoNote: '数据口演示态可点击切换',
      evalFn: (e: Lev, b: Lev, a: Lev, i0: Lev, i1: Lev, i2: Lev, i3: Lev) => {
        if (e === 'H') return ['L']
        if (e === 'X' || b === 'X' || a === 'X') return ['X']
        const sel = (b === 'H' ? 2 : 0) + (a === 'H' ? 1 : 0)
        const d = [i0, i1, i2, i3][sel]
        return [d]
      },
      note: '第二半同构：2G=15、A=14、数据 2I0~2I3=10~13、输出 2Y=9。禁止时输出为低电平（不是三态）。'
    },
    notes: ['两半共享 A/B 选择端，适合双路同步切换（如左右声道）。', '8 选 1 是 74151，16 选 1 是 74150。', '级联成 8 选 1：两半数据错位接、输出经与门合并需注意禁止态为低的特性。']
  },
  {
    id: '74151', name: '8选1数据选择器（带反相输出）', series: '74', cat: 'decoder',
    brief: '8 选 1 多路选择器：选择 CBA，输出 Y 与反相 W；选通无效时 Y=L、W=H。',
    pins: 16, pinout: PINS([
      [1, 'D3', 'i'], [2, 'D2', 'i'], [3, 'D1', 'i'], [4, 'D0', 'i'], [5, 'Y', 'o'], [6, 'W', 'o', true], [7, 'G', 'i', true],
      [8, 'GND', 'g'], [9, 'C', 'i'], [10, 'B', 'i'], [11, 'A', 'i'], [12, 'D7', 'i'], [13, 'D6', 'i'], [14, 'D5', 'i'], [15, 'D4', 'i'],
      [16, 'VCC', 'p']
    ]),
    power: stdPower(16),
    truth: {
      kind: 'func',
      ins: ['G', 'C', 'B', 'A'],
      lowIn: [0, 5],
      outs: ['Y', 'W'],
      lowOut: [1],
      rows: [
        { i: ['H', 'X', 'X', 'X'], o: ['L', 'H'], note: '选通无效' },
        { i: ['L', 'L', 'L', 'L'], o: ['D0', 'D0'], note: 'CBA=000' },
        { i: ['L', 'L', 'L', 'H'], o: ['D1', 'D1'], note: 'CBA=001' },
        { i: ['L', 'L', 'H', 'L'], o: ['D2', 'D2'], note: 'CBA=010' },
        { i: ['L', 'L', 'H', 'H'], o: ['D3', 'D3'], note: 'CBA=011' },
        { i: ['L', 'H', 'L', 'L'], o: ['D4', 'D4'], note: 'CBA=100' },
        { i: ['L', 'H', 'L', 'H'], o: ['D5', 'D5'], note: 'CBA=101' },
        { i: ['L', 'H', 'H', 'L'], o: ['D6', 'D6'], note: 'CBA=110' },
        { i: ['L', 'H', 'H', 'H'], o: ['D7', 'D7'], note: 'CBA=111' }
      ],
      demoIns: ['G', 'C', 'B', 'A', 'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
      demoInit: ['L', 'H', 'L', 'H', 'H', 'L', 'H', 'L', 'H', 'L', 'H', 'L'],
      demoNote: '数据输入口 D0~D7 为演示态，可点击切换后看 Y/W',
      evalFn: (e: Lev, c: Lev, b: Lev, a: Lev, d0: Lev, d1: Lev, d2: Lev, d3: Lev, d4: Lev, d5: Lev, d6: Lev, d7: Lev) => {
        if (e === 'H') return ['L', 'H']
        if (e === 'X' || c === 'X' || b === 'X' || a === 'X') return ['X', 'X']
        const sel = (c === 'H' ? 4 : 0) + (b === 'H' ? 2 : 0) + (a === 'H' ? 1 : 0)
        const d = [d0, d1, d2, d3, d4, d5, d6, d7][sel]
        return [d, inv(d)]
      },
      note: 'W = Y 的反相输出（低有效表示）。禁止（G=H）时 Y 强制低、W 强制高。'
    },
    notes: ['用 Y+W 可同时拿到信号与反相信号，省一路反相器。', '16 选 1 用 74150；两片 151 + 153 可级联出 16 选 1。', '常用于把并行状态压缩成串行扫描（轮询）或查表输出。']
  },
  {
    id: '74247', name: 'BCD-七段译码器（OC输出，共阳）', series: '74', cat: 'decoder',
    brief: 'BCD 码译为七段低有效输出（经 7447 同族），带灯测试/灭灯/消隐级联；直接灌电流驱动共阳数码管。',
    pins: 16, pinout: PINS([
      [1, 'B', 'i'], [2, 'C', 'i'], [3, 'LT', 'i', true], [4, 'BI/RBO', 'io', true], [5, 'RBI', 'i', true], [6, 'D', 'i'], [7, 'A', 'i'],
      [8, 'GND', 'g'], [9, 'e', 'o', true], [10, 'd', 'o', true], [11, 'c', 'o', true], [12, 'b', 'o', true], [13, 'a', 'o', true], [14, 'g', 'o', true], [15, 'f', 'o', true],
      [16, 'VCC', 'p']
    ]),
    power: stdPower(16),
    truth: {
      kind: 'func',
      ins: ['BI', 'LT', 'RBI', 'DCBA'],
      lowIn: [0, 1, 2],
      outs: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      lowOut: [0, 1, 2, 3, 4, 5, 6],
      rows: [
        { i: ['L', 'X', 'X', 'XXXX'], o: ['H', 'H', 'H', 'H', 'H', 'H', 'H'], note: '灭灯：BI=L 全灭' },
        { i: ['H', 'L', 'X', 'XXXX'], o: ['L', 'L', 'L', 'L', 'L', 'L', 'L'], note: '灯测试：全亮' },
        { i: ['H', 'H', 'L', '0000'], o: ['H', 'H', 'H', 'H', 'H', 'H', 'H'], note: '高位零消隐（RBI=L 且数为 0）' },
        { i: ['H', 'H', 'H', '0000'], o: ['L', 'L', 'L', 'L', 'L', 'L', 'H'], note: '0' },
        { i: ['H', 'H', 'H', '0001'], o: ['H', 'L', 'L', 'H', 'H', 'H', 'H'], note: '1' },
        { i: ['H', 'H', 'H', '0010'], o: ['L', 'L', 'H', 'L', 'L', 'H', 'L'], note: '2' },
        { i: ['H', 'H', 'H', '0011'], o: ['L', 'L', 'L', 'L', 'H', 'H', 'L'], note: '3' },
        { i: ['H', 'H', 'H', '0100'], o: ['H', 'L', 'L', 'H', 'H', 'L', 'L'], note: '4' },
        { i: ['H', 'H', 'H', '0101'], o: ['L', 'H', 'L', 'L', 'H', 'L', 'L'], note: '5' },
        { i: ['H', 'H', 'H', '0110'], o: ['L', 'H', 'L', 'L', 'L', 'L', 'L'], note: '6（字形与 7447 略异，带尾）' },
        { i: ['H', 'H', 'H', '0111'], o: ['L', 'L', 'L', 'H', 'H', 'H', 'H'], note: '7' },
        { i: ['H', 'H', 'H', '1000'], o: ['L', 'L', 'L', 'L', 'L', 'L', 'L'], note: '8' },
        { i: ['H', 'H', 'H', '1001'], o: ['L', 'L', 'L', 'L', 'H', 'L', 'L'], note: '9（字形与 7447 略异，带尾）' },
        { i: ['H', 'H', 'H', '1010~1111'], o: ['X', 'X', 'X', 'X', 'X', 'X', 'X'], note: '10~15 显示特殊符号，字形以 datasheet 为准（本页从略）' }
      ],
      note: '输出为低有效、开集电极型（灌电流），需配共阳数码管 + 段限流电阻。表中 H=段灭、L=段亮。'
    },
    notes: ['7447 同族引脚一致；区别在 6/9 的字形笔画（247 带尾）。', 'BI/RBO 为双向脚：作输入低有效灭灯，作输出用于多位零消隐级联（高位 RBO 接低位 RBI）。', '共阴方案用 7448/4511（高有效输出）。']
  },
  {
    id: '4511', name: 'BCD-七段锁存译码驱动（共阴）', series: '40', cat: 'decoder',
    brief: 'CD4511：BCD 锁存 + 七段译码 + 高有效源电流输出（约 25mA/段），直接驱动共阴 LED 数码管。',
    pins: 16, pinout: PINS([
      [1, 'B', 'i'], [2, 'C', 'i'], [3, 'LT', 'i', true], [4, 'BI', 'i', true], [5, 'LE', 'i'], [6, 'D', 'i'], [7, 'A', 'i'],
      [8, 'VSS', 'g'], [9, 'e', 'o'], [10, 'd', 'o'], [11, 'c', 'o'], [12, 'b', 'o'], [13, 'a', 'o'], [14, 'g', 'o'], [15, 'f', 'o'],
      [16, 'VDD', 'p']
    ]),
    power: stdPower(16, 'VDD', 'VSS'),
    truth: {
      kind: 'func',
      ins: ['LT', 'BI', 'LE', 'DCBA'],
      lowIn: [0, 1],
      outs: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      rows: [
        { i: ['L', 'X', 'X', 'XXXX'], o: ['H', 'H', 'H', 'H', 'H', 'H', 'H'], note: '灯测试：全亮（优先级最高）' },
        { i: ['H', 'L', 'X', 'XXXX'], o: ['L', 'L', 'L', 'L', 'L', 'L', 'L'], note: '灭灯' },
        { i: ['H', 'H', 'L', '0000'], o: ['H', 'H', 'H', 'H', 'H', 'H', 'L'], note: '0' },
        { i: ['H', 'H', 'L', '0001'], o: ['L', 'H', 'H', 'L', 'L', 'L', 'L'], note: '1' },
        { i: ['H', 'H', 'L', '0010'], o: ['H', 'H', 'L', 'H', 'H', 'L', 'H'], note: '2' },
        { i: ['H', 'H', 'L', '0011'], o: ['H', 'H', 'H', 'H', 'L', 'L', 'H'], note: '3' },
        { i: ['H', 'H', 'L', '0100'], o: ['L', 'H', 'H', 'L', 'L', 'H', 'H'], note: '4' },
        { i: ['H', 'H', 'L', '0101'], o: ['H', 'L', 'H', 'H', 'L', 'H', 'H'], note: '5' },
        { i: ['H', 'H', 'L', '0110'], o: ['H', 'L', 'H', 'H', 'H', 'H', 'H'], note: '6' },
        { i: ['H', 'H', 'L', '0111'], o: ['H', 'H', 'H', 'L', 'L', 'L', 'L'], note: '7' },
        { i: ['H', 'H', 'L', '1000'], o: ['H', 'H', 'H', 'H', 'H', 'H', 'H'], note: '8' },
        { i: ['H', 'H', 'L', '1001'], o: ['H', 'H', 'H', 'H', 'L', 'H', 'H'], note: '9' },
        { i: ['H', 'H', 'L', '1010~1111'], o: ['L', 'L', 'L', 'L', 'L', 'L', 'L'], note: '非法 BCD：全灭（消隐）' },
        { i: ['H', 'H', 'H', 'XXXX'], o: ['q', 'q', 'q', 'q', 'q', 'q', 'q'], note: '锁存：LE 上升沿前的 BCD 被保持' }
      ],
      demoIns: ['LT', 'BI', 'LE', 'D', 'C', 'B', 'A'],
      demoInit: ['H', 'H', 'L', 'L', 'H', 'H', 'L'],
      demoNote: '点击 BCD/控制位实时看段输出',
      evalFn: (lt: Lev, bi: Lev, le: Lev, dd: Lev, cc: Lev, bb: Lev, aa: Lev) => {
        if (lt === 'L') return ['H', 'H', 'H', 'H', 'H', 'H', 'H']
        if (bi === 'L') return ['L', 'L', 'L', 'L', 'L', 'L', 'L']
        if (le === 'H') return ['q', 'q', 'q', 'q', 'q', 'q', 'q']
        if (dd === 'X' || cc === 'X' || bb === 'X' || aa === 'X') return ['X', 'X', 'X', 'X', 'X', 'X', 'X']
        const n = (dd === 'H' ? 8 : 0) + (cc === 'H' ? 4 : 0) + (bb === 'H' ? 2 : 0) + (aa === 'H' ? 1 : 0)
        if (n > 9) return ['L', 'L', 'L', 'L', 'L', 'L', 'L']
        return seg4511(n)
      },
      note: '输出高有效、源电流型（点亮 = 输出 H），配共阴数码管 + 段限流电阻；LE=H 锁存，LT/BI 低有效。'
    },
    notes: ['输出可源约 25mA/段（VDD=5V 时约 10mA 稳妥），段电流按 (VDD-Vf-VOL)/R 估算。', '引脚与 7447 族兼容（同为 7=A、1=B、2=C、6=D），但输出极性相反、驱动方式不同，74247 与 4511 不可直接互换。', '大于 9 的输入全灭，不会显示乱字形——做十进制显示很省心。']
  },

  // ===== 缓冲 / 收发 / 开关 =====
  {
    id: '74244', name: '八缓冲/线驱动（三态，两组使能）', series: '74', cat: 'buffer',
    brief: '八位三态非反相缓冲，两组（1~4 与 11~18）各自独立 OE；总线隔离/驱动增强标准件。',
    pins: 20, pinout: PINS([
      [1, '1OE', 'i', true], [2, '1A1', 'i'], [3, '2Y4', 'o'], [4, '1A2', 'i'], [5, '2Y3', 'o'], [6, '1A3', 'i'], [7, '2Y2', 'o'], [8, '1A4', 'i'], [9, '2Y1', 'o'],
      [10, 'GND', 'g'], [11, '2A1', 'i'], [12, '1Y4', 'o'], [13, '2A2', 'i'], [14, '1Y3', 'o'], [15, '2A3', 'i'], [16, '1Y2', 'o'], [17, '2A4', 'i'], [18, '1Y1', 'o'], [19, '2OE', 'i', true],
      [20, 'VCC', 'p']
    ]),
    power: stdPower(20),
    truth: {
      kind: 'func',
      ins: ['OE', 'A'],
      lowIn: [0],
      outs: ['Y'],
      rows: [
        { i: ['L', 'H'], o: ['H'], note: '透明输出' },
        { i: ['L', 'L'], o: ['L'], note: '透明输出' },
        { i: ['H', 'X'], o: ['Z'], note: '输出高阻' }
      ],
      demoIns: ['1OE', '1A1', '1A2', '1A3', '1A4'],
      demoInit: ['L', 'H', 'L', 'H', 'L'],
      demoNote: '以第 1 组（1A1~1A4）演示',
      evalFn: (oe: Lev, a1: Lev, a2: Lev, a3: Lev, a4: Lev) => {
        if (oe === 'L') return [a1, a2, a3, a4]
        return ['Z', 'Z', 'Z', 'Z']
      },
      note: 'OE 低有效、每组 4 位独立控制；输入输出交错排布（1 脚 OE 紧邻输入）。'
    },
    notes: ['引脚为"输入输出交错"布局，布线短但画原理图时容易搞错方向，接线按表核对。', '输入输出同侧的等价件是 74541；反相版本 74240。', '常用于 MCU 总线隔离与驱动能力增强（HC 版约 ±4~6mA，LVC 版更强）。']
  },
  {
    id: '74245', name: '八总线收发器（三态，双向）', series: '74', cat: 'buffer',
    brief: '八位双向总线收发：DIR 定方向、OE 总开关；A/B 总线互转的标准件。',
    pins: 20, pinout: PINS([
      [1, 'DIR', 'i'], [2, 'A1', 'io'], [3, 'A2', 'io'], [4, 'A3', 'io'], [5, 'A4', 'io'], [6, 'A5', 'io'], [7, 'A6', 'io'], [8, 'A7', 'io'], [9, 'A8', 'io'],
      [10, 'GND', 'g'], [11, 'B8', 'io'], [12, 'B7', 'io'], [13, 'B6', 'io'], [14, 'B5', 'io'], [15, 'B4', 'io'], [16, 'B3', 'io'], [17, 'B2', 'io'], [18, 'B1', 'io'], [19, 'OE', 'i', true],
      [20, 'VCC', 'p']
    ]),
    power: stdPower(20),
    truth: {
      kind: 'func',
      ins: ['OE', 'DIR'],
      lowIn: [0],
      outs: ['传输'],
      rows: [
        { i: ['L', 'L'], o: ['B→A'], note: 'B 侧数据传向 A 侧' },
        { i: ['L', 'H'], o: ['A→B'], note: 'A 侧数据传向 B 侧' },
        { i: ['H', 'X'], o: ['Z / Z'], note: '双侧全部高阻，总线隔离' }
      ],
      demoIns: ['OE', 'DIR', 'A1', 'A2', 'A3', 'A4'],
      demoInit: ['L', 'H', 'H', 'L', 'H', 'L'],
      demoNote: '以 DIR=A→B 时 B1~B4 的取值演示',
      evalFn: (oe: Lev, dir: Lev, a1: Lev, a2: Lev, a3: Lev, a4: Lev) => {
        if (oe !== 'L') return ['Z', 'Z', 'Z', 'Z']
        if (dir === 'H') return [a1, a2, a3, a4]
        if (dir === 'L') return ['B→A', 'B→A', 'B→A', 'B→A']
        return ['X', 'X', 'X', 'X']
      },
      note: 'OE 低有效。DIR=H 时 A 为输入、B 为输出；DIR=L 反之。'
    },
    notes: ['双向件的关键纪律：切换 DIR 前确保两侧没有别的驱动方，否则总线冲突。', '3.3V↔5V 电平转换不能用普通 245（VCC 单电源），要选 LVC/LVT 或 74LVC4245 这类双电源件。', '反相版本 74243，四位的收发是 74243/74125 组合更常用。']
  },
  {
    id: '74125', name: '四路三态缓冲（独立使能，低有效）', series: '74', cat: 'buffer',
    brief: '四路独立使能的三态缓冲：每个通道自带 OE，多路"线或"汇流到一根线的标准做法。',
    pins: 14, pinout: PINS([
      [1, '1OE', 'i', true], [2, '1A', 'i'], [3, '1Y', 'o'], [4, '2OE', 'i', true], [5, '2A', 'i'], [6, '2Y', 'o'],
      [7, 'GND', 'g'], [8, '3Y', 'o'], [9, '3A', 'i'], [10, '3OE', 'i', true], [11, '4Y', 'o'], [12, '4A', 'i'], [13, '4OE', 'i', true],
      [14, 'VCC', 'p']
    ]),
    power: stdPower(14),
    truth: {
      kind: 'func',
      ins: ['OE', 'A'],
      lowIn: [0],
      outs: ['Y'],
      rows: [
        { i: ['L', 'H'], o: ['H'], note: '使能，透明输出' },
        { i: ['L', 'L'], o: ['L'], note: '使能，透明输出' },
        { i: ['H', 'X'], o: ['Z'], note: '输出高阻' }
      ],
      demoIns: ['1OE', '1A'],
      demoInit: ['L', 'H'],
      evalFn: (oe: Lev, a: Lev) => [oe === 'L' ? a : 'Z'],
      note: '每通道独立使能（与 74126 为高有效使能版本相区别）。'
    },
    notes: ['把四个 Y 并到一根线上可做多路复用，但同一时刻只能使能一路，其余必须 Z。', '与 74126（使能高有效）引脚一致、使能极性相反，替换时特别注意。', '74HC125 引脚一致。']
  },
  {
    id: '4066', name: '四路双向模拟开关', series: '40', cat: 'buffer',
    brief: 'CD4066：四路独立控制的双向模拟开关（传输门），可传模拟信号；导通电阻约百欧级。',
    pins: 14, pinout: PINS([
      [1, 'A1', 'io'], [2, 'A1', 'io'], [3, 'A2', 'io'], [4, 'A2', 'io'], [5, 'CTRL2', 'i'], [6, 'CTRL3', 'i'],
      [7, 'VSS', 'g'], [8, 'A3', 'io'], [9, 'A3', 'io'], [10, 'A4', 'io'], [11, 'A4', 'io'], [12, 'CTRL4', 'i'], [13, 'CTRL1', 'i'],
      [14, 'VDD', 'p']
    ]),
    power: stdPower(14, 'VDD', 'VSS'),
    truth: {
      kind: 'func',
      ins: ['CTRL'],
      outs: ['开关'],
      rows: [
        { i: ['H'], o: ['通'], note: '开关导通，双向传输（信号范围 0~VDD）' },
        { i: ['L'], o: ['断'], note: '开关关断，高阻隔离' }
      ],
      demoIns: ['CTRL1'],
      demoInit: ['H'],
      evalFn: (c: Lev) => [c === 'H' ? '通' : (c === 'L' ? '断' : 'X')],
      note: '开关 1：1/2 脚 + 控制 13；开关 2：3/4 + 控制 5；开关 3：8/9 + 控制 6；开关 4：10/11 + 控制 12。'
    },
    notes: ['双向：任一脚都可作输入或输出，可切换音频/模拟信号。', '导通电阻随 VDD 变化（约 400Ω@5V、100Ω@15V 量级），串联大电流负载不合适，多路复用小信号合适。', '控制电平必须达到 VDD 口径：3.3V 逻辑控制 12V 供电的 4066 需电平移位（否则导不彻底）。', '4051/4052/4053 为带地址译码的模拟多路开关家族。']
  },

  // ===== 定时 / 其他 =====
  {
    id: '74121', name: '单稳态触发器（不可重触发）', series: '74', cat: 'misc',
    brief: '单路不可重触发单稳态：A1/A2 下降沿或 B 上升沿触发，输出固定宽度脉冲（RC 定宽）。',
    pins: 14, pinout: PINS([
      [1, 'Q', 'o', true], [2, 'NC', 'x'], [3, 'A1', 'i', true], [4, 'A2', 'i', true], [5, 'B', 'i'], [6, 'Q', 'o'],
      [7, 'GND', 'g'], [8, 'NC', 'x'], [9, 'Rint', 'io'], [10, 'Cext', 'io'], [11, 'Rext/Cext', 'io'], [12, 'NC', 'x'], [13, 'NC', 'x'],
      [14, 'VCC', 'p']
    ]),
    power: stdPower(14),
    truth: {
      kind: 'func',
      ins: ['A1', 'A2', 'B'],
      lowIn: [0, 1],
      outs: ['Q'],
      rows: [
        { i: ['↓', 'H', 'H'], o: ['脉冲'], note: 'A1 下降沿触发' },
        { i: ['H', '↓', 'H'], o: ['脉冲'], note: 'A2 下降沿触发' },
        { i: ['H', 'H', '↑'], o: ['脉冲'], note: 'B 上升沿触发（施密特输入）' },
        { i: ['H', 'H', 'L'], o: ['L'], note: '无触发条件，Q 保持低' }
      ],
      note: '触发条件三种：任一 A 下降沿（另一 A 与 B 均为 H）或 B 上升沿（两 A 均为 H）。输出脉宽 tW ≈ 0.7×Rext×Cext（Rext 接 11~VCC、Cext 接 10~11；或 9 脚接 VCC 用内部 2kΩ，约 30ns 窄脉冲）。'
    },
    notes: ['不可重触发：脉冲期间的新触发被忽略；需要重触发用 74123。', 'B 输入为施密特结构，可直接接受慢边沿。', '脉宽公式为量级估算，精确值与 R/C 范围以 datasheet 为准（Rext 2k~40kΩ、Cext 0~1000µF）。']
  },
  {
    id: '74123', name: '双可重触发单稳态（带清零）', series: '74', cat: 'misc',
    brief: '两路可重触发单稳态：A 下降沿/B 上升沿触发，CLR 低有效复位，脉冲期间可重触发展宽。',
    pins: 16, pinout: PINS([
      [1, '1A', 'i', true], [2, '1B', 'i'], [3, '1CLR', 'i', true], [4, '1Q', 'o', true], [5, '2Q', 'o'], [6, '2Cext', 'io'], [7, '2Rext/Cext', 'io'],
      [8, 'GND', 'g'], [9, '2A', 'i', true], [10, '2B', 'i'], [11, '2CLR', 'i', true], [12, '2Q', 'o', true], [13, '1Q', 'o'], [14, '1Cext', 'io'], [15, '1Rext/Cext', 'io'],
      [16, 'VCC', 'p']
    ]),
    power: stdPower(16),
    truth: {
      kind: 'func',
      ins: ['CLR', 'A', 'B'],
      lowIn: [0, 2],
      outs: ['Q'],
      rows: [
        { i: ['L', 'X', 'X'], o: ['L'], note: '异步复位：脉冲被终止' },
        { i: ['H', '↓', 'H'], o: ['脉冲'], note: 'A 下降沿触发' },
        { i: ['H', 'L', '↑'], o: ['脉冲'], note: 'B 上升沿触发' },
        { i: ['H', 'H', 'X'], o: ['q'], note: '不满足触发条件，Q 保持' }
      ],
      note: '可重触发：脉冲期间再次触发则重新计时（脉宽展宽）。第一半：A=1、B=2、CLR=3、Q=13、Cext=14、Rext/Cext=15；第二半：A=9、B=10、CLR=11、Q=5、Cext=6、Rext/Cext=7。脉宽由 R/C 决定，公式与范围以 datasheet 为准。'
    },
    notes: ['引脚排布不对称（Q 与 Q 位置左右交错），接线按表核对——本件是"引脚排布坑"排行榜常客。', '重触发特性适合"看门狗/超时展宽"；要固定窄脉冲用 74121。', '74HC123 引脚与本表一致。']
  },
  {
    id: 'NE555', name: '555 定时器（8脚）', series: '555', cat: 'misc',
    brief: '经典定时器：内部 3×5kΩ 分压 + 双比较器；无稳态振荡与单稳态定时两用，555/7555 引脚兼容。',
    pins: 8, pinout: PINS([
      [1, 'GND', 'g'], [2, 'TRIG', 'i'], [3, 'OUT', 'o'], [4, 'RST', 'i', true], [5, 'CTRL', 'i'], [6, 'THR', 'i'], [7, 'DIS', 'o'], [8, 'VCC', 'p']
    ]),
    power: stdPower(8),
    powerNote: '8 脚件供电惯例：VCC=8、GND=1 对角排布；电源极性接反会损坏器件。',
    truth: {
      kind: 'func',
      ins: ['TRIG(2)', 'THR(6)', 'RST(4)'],
      lowIn: [2],
      outs: ['OUT(3)', 'DIS(7)'],
      rows: [
        { i: ['<1/3VCC', '任意', 'H'], o: ['H', '截止'], note: '触发：输出变高，放电管关断' },
        { i: ['>1/3VCC', '>2/3VCC', 'H'], o: ['L', '导通'], note: '阈值：输出变低，放电管导通' },
        { i: ['>1/3VCC', '<2/3VCC', 'H'], o: ['保持', '保持'], note: '两阈值之间输出维持' },
        { i: ['任意', '任意', 'L'], o: ['L', '导通'], note: '复位优先（不用时上拉到 VCC）' }
      ],
      note: '无稳态：R1(VCC→7)、R2(7→6)、C(6→GND)，2 脚并 6 脚；单稳态：R(VCC→6/7)、C(6→GND)、2 脚触发。频率/占空比请用本站 555 定时器计算器。'
    },
    notes: ['引脚图与电路接法详见本站 555定时器计算器（SVG 电路图随参数重绘）。', '双极型 NE555 驱动约 200mA；CMOS 版 7555/ICM7555/TLC555 引脚兼容、功耗低但驱动弱。', '5 脚 CTRL 可改阈值做压控，不用时接 0.01µF 到地。']
  }
]

// 数据完整性自检（供交付报告引用；页面端用守卫取值，不因缺字段崩溃）
function icHealthCheck() {
  return IC_DB.map(ic => ({
    id: ic.id,
    ok: !!(ic.id && ic.name && ic.brief && ic.pins && Array.isArray(ic.pinout) &&
      ic.pinout.length === ic.pins && ic.power && ic.truth && Array.isArray(ic.truth.rows) && ic.truth.rows.length > 0)
  }))
}
/* ===== 纯函数区结束 ===== */

// ---------- SEO ----------
useSeoMeta({
  title: '74/4000系列逻辑芯片速查 - 真值表、DIP引脚图与代换对照',
  description: `在线 74 系/4000 系逻辑芯片速查表：${'7400/7402/7404/7474/7473/7490/74138/74151/74244/74245/4017/4040/4060/4511/4066/74121/74123'} 等 30+ 常用型号的真值表、DIP 参数化引脚图、三态/边沿/施密特备注、LS/HC/HCT/F 后缀家族对比与 4000↔74 系代换提示，交互演示输入状态实时看输出，纯本地运行。`,
  keywords: '74系列真值表,7400引脚图,7474引脚,4017真值表,4060引脚图,74138译码器,74245引脚图,74hc代换,逻辑芯片查询,4000系列',
  author: '有条工具',
  ogTitle: '74/4000系列速查 - 真值表与DIP引脚图 | 有条工具',
  ogDescription: '30+ 常用逻辑芯片真值表、引脚图与代换对照，交互演示输入状态。',
  ogUrl: 'https://www.util.cn/tools/logic-ic-truth-table',
  ogType: 'website',
  twitterCard: 'summary_large_image'
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
          name: '74/4000系列速查',
          url: 'https://www.util.cn/tools/logic-ic-truth-table',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            `${IC_DB.length} 个常用 74/4000 系型号数据（门类/触发锁存/计数移位/译码选择/缓冲开关/定时）`,
            'DIP 参数化顶视引脚图（电源脚高亮、特殊电源位单独标注）',
            '真值表与功能表，X/Z 态含义标注',
            '交互演示：点击输入格切换 H/L/X 实时看输出，多路复用器带数据口演示态',
            'LS/HC/HCT/F/AHC 后缀家族速度电平对比',
            '4000 系与 74 系互代对照（含引脚不兼容警示）',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '74/4000系列速查', item: 'https://www.util.cn/tools/logic-ic-truth-table/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '真值表里的 X 是什么意思？和 Z 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'X（don\'t care）表示该输入取高取低都不影响输出，是设计层面的无关项；Z 表示三态器件被禁用时输出高阻、不驱动任何电平，是物理状态。X 是"你不关心"，Z 是"它不驱动"，混用会导致总线冲突或逻辑错误。' }
            },
            {
              '@type': 'Question',
              name: '74HC 和 74LS 能直接互相代换吗？',
              acceptedAnswer: { '@type': 'Answer', text: '功能与引脚基本一致但电平与驱动不同：LS 是 TTL 阈值（VIH≈2V），HC 是 CMOS 阈值（VIH≈0.7×VCC）。LS 驱动 HC 临界，推荐 HCT 桥接；HC 驱动 LS 注意 ±4mA 驱动能力；电源范围也不同（LS 5V±0.25、HC 2~6V）。' }
            },
            {
              '@type': 'Question',
              name: '4000 系和 74 系怎么互代？',
              acceptedAnswer: { '@type': 'Answer', text: '按功能对号：4011↔7400、4001↔7402、4069↔7404、4070↔7486、4071↔7432；74HC 系列是最佳桥梁。注意原始 CD4000 输入阈值高不能被 3.3V 逻辑直接驱动，且 4001 与 7402 引脚排列不同，接线前必须核对。' }
            },
            {
              '@type': 'Question',
              name: '为什么有些 74 系芯片的 VCC/GND 不在 14/7 脚？',
              acceptedAnswer: { '@type': 'Answer', text: '早期 TTL 编号定义时封装规则未统一：7473 是 4/11、7475 是 5/12、7490/7492/7493 是 5/10，这些老编号的传统被保留下来。换任何后缀都要重新核对电源脚，这是接线翻车率最高的地方。' }
            }
          ]
        }
      ]
    })
  }]
})

const STORAGE_KEY = 'logic-ic-truth-table:state'

onMounted(() => {
  addRecentTool('logic-ic-truth-table')
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      if (saved && typeof saved === 'object') {
        if (typeof saved.query === 'string') query.value = saved.query
        if (typeof saved.catFilter === 'string' && CATS.some(c => c.id === saved.catFilter)) catFilter.value = saved.catFilter
        if (typeof saved.selectedId === 'string' && IC_DB.some(i => i.id === saved.selectedId)) selectIc(saved.selectedId)
      }
    }
  } catch {
    // 本地存储不可用或内容损坏时忽略，使用默认值
  }
  watch(
    [query, catFilter, selectedId],
    () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          query: query.value,
          catFilter: catFilter.value,
          selectedId: selectedId.value
        }))
      } catch {
        // 忽略写入失败（隐私模式等）
      }
    }
  )
})

// ---------- 交互状态 ----------
const CATS = [
  { id: 'all', name: '全部' },
  { id: 'gate', name: '门类' },
  { id: 'ff', name: '触发/锁存' },
  { id: 'counter', name: '计数/移位' },
  { id: 'decoder', name: '译码/选择' },
  { id: 'buffer', name: '缓冲/开关' },
  { id: 'misc', name: '定时/其他' }
]

const query = ref('')
const catFilter = ref('all')
const selectedId = ref('7400')
const demoState = ref<Lev[]>([])
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const filteredIcs = computed(() => {
  const q = query.value.trim().toLowerCase()
  return IC_DB.filter(ic => {
    if (catFilter.value !== 'all' && ic.cat !== catFilter.value) return false
    if (!q) return true
    const hay = [ic.id, ic.name, ic.brief, ic.series, ...(ic.notes || [])].join(' ').toLowerCase()
    return hay.includes(q)
  })
})

function countByCat(cat: string): number {
  return cat === 'all' ? IC_DB.length : IC_DB.filter(i => i.cat === cat).length
}

function selectIc(id: string) {
  if (!IC_DB.some(i => i.id === id)) return
  selectedId.value = id
}

const selectedIc = computed<Ic | null>(() => IC_DB.find(i => i.id === selectedId.value) || null)

// 演示状态初始化（优先 truth.demoInit，其次 comb 表第一行输入）
function initDemo(ic: Ic | null) {
  if (!ic) { demoState.value = []; return }
  const t = ic.truth
  if (t.demoInit && t.demoInit.length) { demoState.value = [...t.demoInit]; return }
  if (t.evalFn && t.rows.length && t.rows[0].i.every(x => x === 'H' || x === 'L')) {
    demoState.value = [...t.rows[0].i]
    return
  }
  demoState.value = t.ins.map(() => 'L' as Lev)
}

watch(selectedId, () => initDemo(selectedIc.value), { immediate: true })

const demoActive = computed(() => {
  const ic = selectedIc.value
  if (!ic) return false
  const t = ic.truth
  return !!(t.evalFn && demoState.value.length === (t.demoIns || t.ins).length && demoState.value.length > 0)
})

const demoInsLabels = computed(() => {
  const ic = selectedIc.value
  if (!ic) return []
  return (ic.truth.demoIns || ic.truth.ins)
})
const demoOutLabels = computed(() => {
  const ic = selectedIc.value
  if (!ic) return []
  return ic.truth.outs
})

const demoOutputs = computed<(Lev | string)[]>(() => {
  const ic = selectedIc.value
  if (!ic || !demoActive.value || !ic.truth.evalFn) return []
  try {
    const r = ic.truth.evalFn(...demoState.value)
    return Array.isArray(r) && r.length === ic.truth.outs.length ? r : []
  } catch {
    return []
  }
})

function cycleDemo(i: number) {
  const order: Lev[] = ['L', 'H', 'X']
  const cur = demoState.value[i]
  if (!order.includes(cur as Lev)) return
  demoState.value[i] = order[(order.indexOf(cur as Lev) + 1) % order.length] as Lev
}

const rowNoteExists = computed(() => {
  const ic = selectedIc.value
  return !!ic && ic.truth.rows.some(r => r.note)
})

function isLowIn(ic: Ic, i: number): boolean { return Array.isArray(ic.truth.lowIn) && ic.truth.lowIn.includes(i) }
function isLowOut(ic: Ic, j: number): boolean { return Array.isArray(ic.truth.lowOut) && ic.truth.lowOut.includes(j) }

// ---------- 展示辅助 ----------
const SUFFIX_ROWS = [
  { name: 'STD(74)', speed: '约 10 ns', supply: '5V±0.25', level: 'TTL 阈值 · 功耗最高（毫瓦/门级），已淘汰' },
  { name: 'LS', speed: '约 10 ns', supply: '5V±0.25', level: 'TTL 阈值 · 低功耗肖特基，老设备维修常见' },
  { name: 'HC', speed: '约 8~10 ns', supply: '2~6V', level: 'CMOS 阈值（VIH≈0.7VCC）· 静态功耗极低，驱动 ±4mA' },
  { name: 'HCT', speed: '约 10 ns', supply: '4.5~5.5V', level: 'TTL 兼容输入 · LS 系统直接替换 HC 的桥梁' },
  { name: 'F', speed: '约 3~4 ns', supply: '5V±0.25', level: 'TTL 阈值 · Fast 高速，功耗中高' },
  { name: 'AHC/VHC', speed: '约 3~5 ns', supply: '2?/4.5~5.5V（看子系）', level: 'CMOS/TTL 兼容选项 · 新设计高速主流之一' },
  { name: 'LVC', speed: '约 3~5 ns', supply: '1.65~3.6V', level: '低电压家族 · 3.3V/混压系统首选，多数 5V 耐受输入' }
]

const CROSS_ROWS = [
  { a: '4011', b: '7400', note: '与非，引脚兼容，最常用互代' },
  { a: '4001', b: '7402', note: '或非，功能同但引脚不同（4001 为 7400 式排布）' },
  { a: '4069', b: '7404', note: '六反相，引脚兼容' },
  { a: '4070', b: '7486', note: '异或，引脚兼容' },
  { a: '4071', b: '7432', note: '或门，引脚兼容' },
  { a: '4093', b: '74132', note: '施密特与非，引脚不同，核对后替换' },
  { a: '4066', b: '—', note: '模拟开关无 74 直代（74HC4066 即 HC 版 4066）' },
  { a: '4511', b: '7448/4511', note: '共阴驱动；74247 为共阳低有效方案，极性相反不可直换' }
]

function seriesLabel(s: string): string {
  if (s === '74') return '74 系列'
  if (s === '40') return '4000 系列（CMOS）'
  return '555 定时器'
}
function seriesBadgeCls(s: string): string {
  if (s === '74') return 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
  if (s === '40') return 'bg-green-500/15 text-green-600 dark:text-green-400'
  return 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
}

const DIR_LABELS: Record<string, string> = { i: '输入', o: '输出', io: '双向', p: '电源', g: '地', x: '空脚' }
function dirLabel(d: string): string { return DIR_LABELS[d] || '' }

function pinDisplay(p: Pin): string { return p.low ? p.name + '\u0305' : p.name }
function pinLabelCls(p: Pin): string {
  if (p.d === 'p') return 'text-red-500 dark:text-red-400'
  if (p.d === 'g') return 'text-zinc-500 dark:text-zinc-400'
  if (p.d === 'x') return 'text-muted-foreground/60'
  return 'text-foreground'
}
function pinFillCls(p: Pin): string {
  if (p.d === 'p') return 'fill-red-500/20'
  if (p.d === 'g') return 'fill-zinc-500/25'
  if (p.d === 'x') return 'fill-muted'
  return 'fill-muted'
}
function pinTextCls(p: Pin): string {
  if (p.d === 'p') return 'fill-current text-red-500 dark:text-red-400'
  if (p.d === 'g') return 'fill-current text-zinc-500 dark:text-zinc-400'
  if (p.d === 'x') return 'fill-current text-muted-foreground/50'
  return 'fill-current text-foreground'
}

function cellCls(v: string): string {
  if (v === 'H') return 'bg-green-500/15 text-green-600 dark:text-green-400'
  if (v === 'L') return 'bg-red-500/15 text-red-600 dark:text-red-400'
  if (v === 'X') return 'bg-muted text-muted-foreground'
  if (v === 'Z') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
  return 'bg-muted/60 text-muted-foreground'
}

// DIP SVG 几何（参数化引脚数）
const dipLeftPins = computed(() => {
  const ic = selectedIc.value
  if (!ic) return []
  return ic.pinout.slice(0, ic.pins / 2).map((p, i) => ({ ...p, y: 30 + i * 24 }))
})
const dipRightPins = computed(() => {
  const ic = selectedIc.value
  if (!ic) return []
  return ic.pinout.slice(ic.pins / 2).map((p, i) => ({ ...p, y: 30 + (ic.pins / 2 - 1 - i) * 24 }))
})
const dipBodyH = computed(() => {
  const ic = selectedIc.value
  if (!ic) return 100
  return (ic.pins / 2) * 24 + 16
})
const dipHeight = computed(() => {
  const ic = selectedIc.value
  if (!ic) return 140
  return dipBodyH.value + 36
})
</script>

<style scoped>
.overline-cell {
  text-decoration: overline;
}
</style>
