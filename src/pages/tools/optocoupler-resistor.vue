<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部区 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Cable class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">光耦电阻计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">输入侧限流电阻与输出侧上拉电阻双向校验，CTR 电流传输比与饱和裕量核算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        两端协同算清光耦信号链：模式一输入侧按 If = (Vin − Vf) / Rin 算 LED 正向电流（Vf 预设 1.2 通用 / 1.5 口径）；
        模式二输出侧按上拉电阻、Vcc 与 CTR（PC817 四档 50~600% 分档口径）反推饱和所需的最小 LED 电流，
        再回推 Rin 上限并核对 If ≤ 50 mA 常见上限。两端共用同一组 Vin / Vf / Rin，一次填写即可判定整条隔离链路。
        全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        CTR 为电流传输比 Ic/If，随批次档位（rank）、温度与老化年限下降——工业设计规则按寿命终点 CTR 降至初始 50% 核算，
        本工具默认饱和裕量系数 2 即覆盖该降额。自核锚点：Vcc = 5 V、Rp = 10 kΩ、CTR = 100%、裕量 2 → 需求 If = 1 mA；
        Vin = 5 V、Vf = 1.2 V、Rin = 1 kΩ → If = 3.8 mA ≥ 1 mA ✓。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主流程区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 模式一：输入侧 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Zap class="w-5 h-5 mr-2 text-primary" /> 模式一 · 输入侧（LED 限流电阻）
            </h2>
            <span class="text-xs text-muted-foreground">If = (Vin − Vf) / Rin</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="oc-vin" class="block text-sm font-medium text-foreground mb-1.5">驱动电压 Vin（V）</label>
              <input
                id="oc-vin"
                v-model.number="vin"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 5"
              >
              <p class="text-xs text-muted-foreground mt-1">MCU / 逻辑电平输出</p>
            </div>
            <div>
              <label for="oc-vf" class="block text-sm font-medium text-foreground mb-1.5">LED 正向压降 Vf（V）</label>
              <div class="flex flex-wrap items-center gap-1.5">
                <button
                  v-for="o in vfOptions"
                  :key="o.v"
                  @click="vf = o.v"
                  :class="Number(vf) === o.v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                >{{ o.label }}</button>
                <input
                  id="oc-vf"
                  v-model.number="vf"
                  type="number"
                  min="0"
                  step="any"
                  class="w-20 px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
                  aria-label="自定义正向压降"
                >
              </div>
              <p class="text-xs text-muted-foreground mt-1">1.2 V 通用红外 LED 口径 / 1.5 V 部分型号</p>
            </div>
            <div>
              <label for="oc-rin" class="block text-sm font-medium text-foreground mb-1.5">限流电阻 Rin（Ω）</label>
              <input
                id="oc-rin"
                v-model.number="rin"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 1000"
              >
            </div>
          </div>

          <template v-if="ifActualMa !== null">
            <div class="bg-primary/10 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">LED 正向电流</p>
              <p class="text-xl font-bold text-primary">If = {{ fmtMa(ifActualMa) }} mA</p>
              <p class="text-xs text-muted-foreground mt-1">（{{ fmtV(vin) }} − {{ fmtV(vf) }}）V ÷ {{ fmtOhm(rin) }}{{ ifActualMa === 0 ? '；Vin ≤ Vf，LED 不导通' : '' }}</p>
            </div>
          </template>
          <div v-else class="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            填写 Vin、Vf 与 Rin（均 &gt; 0）后计算 LED 电流
          </div>

          <!-- 反推：目标 If → Rin -->
          <div class="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
            <p class="text-sm font-medium text-foreground">反推：按目标 If 定 Rin 上限（模式一）</p>
            <div class="flex flex-wrap items-center gap-2">
              <label for="oc-target" class="text-xs text-muted-foreground">目标 If（mA）</label>
              <input
                id="oc-target"
                v-model.number="targetIfMa"
                type="number"
                min="0"
                step="any"
                class="w-24 px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <span class="text-xs text-muted-foreground">→</span>
              <span v-if="targetRin !== null" class="text-sm text-foreground font-medium">
                Rin ≤ {{ fmtOhm(targetRin) }}，E24 向下取 {{ targetRinE24 === null ? '—' : fmtOhm(targetRinE24) }}
              </span>
              <span v-else class="text-xs text-muted-foreground">填写目标 If（&gt; 0）后反推</span>
            </div>
            <p class="text-xs text-muted-foreground">反推口径 Rin = (Vin − Vf) / 目标 If；吸附 E24 时向下取值，保证实装 If ≥ 目标。</p>
          </div>
        </div>

        <!-- 模式二：输出侧 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <GitBranch class="w-5 h-5 mr-2 text-primary" /> 模式二 · 输出侧（上拉电阻与 CTR）
            </h2>
            <span class="text-xs text-muted-foreground">需求 If = (Vcc/Rp) × 裕量 ÷ CTR</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="oc-vcc" class="block text-sm font-medium text-foreground mb-1.5">输出侧电源 Vcc（V）</label>
              <input
                id="oc-vcc"
                v-model.number="vcc"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 5"
              >
            </div>
            <div>
              <label for="oc-rp" class="block text-sm font-medium text-foreground mb-1.5">上拉电阻 Rp（Ω）</label>
              <input
                id="oc-rp"
                v-model.number="rp"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 10000"
              >
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">CTR 档位（PC817 分档，按档下限设计）</label>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="r in ctrRanks"
                  :key="r.rank"
                  @click="ctrPct = r.min"
                  :class="Number(ctrPct) === r.min ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                >{{ r.rank }}：{{ r.min }}%</button>
                <input
                  id="oc-ctr"
                  v-model.number="ctrPct"
                  type="number"
                  min="0"
                  step="any"
                  class="w-20 px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
                  aria-label="自定义 CTR 百分比"
                >
              </div>
              <p class="text-xs text-muted-foreground mt-1.5">
                PC817 分档口径：A 50~100% / B 100~200% / C 200~300% / D 300~600%。
                同型号不同档位 CTR 差一倍以上，采购与 BOM 必须带档位后缀；设计按档下限取值（保守），
                CTR 越高档位速度越慢，选型见下方说明。
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">饱和裕量系数</label>
              <div class="flex flex-wrap items-center gap-1.5">
                <button
                  v-for="m in marginOptions"
                  :key="m"
                  @click="marginK = m"
                  :class="Number(marginK) === m ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                >{{ m }}</button>
                <input
                  id="oc-margin"
                  v-model.number="marginK"
                  type="number"
                  min="1"
                  step="any"
                  class="w-20 px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
                  aria-label="自定义饱和裕量系数"
                >
              </div>
              <p class="text-xs text-muted-foreground mt-1.5">
                默认 2：需求电流按 2 倍设计，覆盖 CTR 老化降额（50% 设计规则）、温度与批次离散；
                快速开关或工业现场可取 3。
              </p>
            </div>
          </div>

          <template v-if="ifRequiredMa !== null">
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">饱和所需最小 LED 电流</p>
              <p class="text-xl font-bold text-foreground">需求 If ≥ {{ fmtMa(ifRequiredMa) }} mA</p>
              <p class="text-xs text-muted-foreground mt-1">
                Vcc / Rp = {{ fmtV(vcc) }} V ÷ {{ fmtOhm(rp) }} = {{ fmtMa(pullDownMa) }} mA，× 裕量 {{ fmtNum(marginK, 4) }} ÷ CTR {{ fmtNum(ctrPct, 4) }}%
              </p>
            </div>
          </template>
          <div v-else class="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            填写 Vcc、Rp、CTR（均 &gt; 0）后反推需求 If
          </div>
        </div>

        <!-- 校验汇总 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <ListChecks class="w-5 h-5 mr-2 text-primary" /> 链路校验汇总
            </h2>
            <span class="text-xs text-muted-foreground">输入侧 × 输出侧</span>
          </div>

          <template v-if="verdict">
            <div class="rounded-lg p-4 text-center" :class="verdict.linkOk ? 'bg-primary/10' : 'bg-red-500/10'">
              <div class="flex items-center justify-center gap-2">
                <CheckCircle v-if="verdict.linkOk" class="w-5 h-5 text-primary" />
                <XCircle v-else class="w-5 h-5 text-red-600 dark:text-red-400" />
                <p class="text-lg font-bold" :class="verdict.linkOk ? 'text-primary' : 'text-red-600 dark:text-red-400'">
                  {{ verdict.linkOk ? '链路通过' : '链路不通过' }}
                </p>
              </div>
              <p class="text-xs text-muted-foreground mt-1.5">{{ verdict.headline }}</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-xs text-muted-foreground mb-1">Rin 上限（满足需求 If）</p>
                <p class="text-xl font-bold text-foreground">{{ verdict.rinMax === null ? '—' : fmtOhm(verdict.rinMax) }}</p>
                <p class="text-xs text-muted-foreground mt-1">（{{ fmtV(vin) }} − {{ fmtV(vf) }}）V ÷ {{ fmtMa(ifRequiredMa) }} mA，E24 向下取 {{ verdict.rinMaxE24 === null ? '—' : fmtOhm(verdict.rinMaxE24) }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-xs text-muted-foreground mb-1">If 上限校验（50 mA 常见绝对最大值）</p>
                <p class="text-xl font-bold" :class="verdict.overIfMax ? 'text-red-600 dark:text-red-400' : 'text-foreground'">
                  {{ verdict.overIfMax ? '超出' : '满足' }}
                </p>
                <p class="text-xs text-muted-foreground mt-1">If = {{ fmtMa(ifActualMa) }} mA，上限 50 mA{{ verdict.overIfMax ? '，需加大 Rin 限流' : '' }}</p>
              </div>
            </div>

            <p class="text-xs leading-relaxed text-muted-foreground bg-muted/50 border border-border rounded-lg p-3">
              输出侧饱和压降按 VCE(sat) ≈ 0.1~0.3 V 估算，上拉电流大时以 datasheet VCE(sat)–Ic 曲线复核；
              输出为集电极开路，逻辑「导通 = 拉低」。以上为工程估算，参数以所选光耦 datasheet 为准。
            </p>
          </template>
          <div v-else class="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            两端参数齐全后给出链路判定与 Rin 上限
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 结果汇总卡 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <ClipboardCheck class="w-4 h-4 mr-2 text-primary" /> 信号链汇总
          </h3>
          <div class="space-y-2 text-xs">
            <div class="flex gap-2 items-start">
              <span class="flex-shrink-0 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">输入</span>
              <p class="text-muted-foreground leading-relaxed">{{ summaryInput }}</p>
            </div>
            <div class="flex gap-2 items-start">
              <span class="flex-shrink-0 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">输出</span>
              <p class="text-muted-foreground leading-relaxed">{{ summaryOutput }}</p>
            </div>
            <div class="flex gap-2 items-start">
              <span class="flex-shrink-0 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">校验</span>
              <p class="text-muted-foreground leading-relaxed">{{ summaryCheck }}</p>
            </div>
            <div class="flex gap-2 items-start">
              <span class="flex-shrink-0 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Rin</span>
              <p class="text-muted-foreground leading-relaxed">{{ summaryRin }}</p>
            </div>
          </div>
          <div class="bg-primary/10 rounded-lg p-3">
            <p class="text-xs leading-relaxed text-foreground">{{ advice }}</p>
          </div>
          <button
            @click="copySummary"
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
          >
            <Copy class="w-3.5 h-3.5" /> 复制信号链汇总
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>输入侧与输出侧：两条公式一条链</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          光耦两端电气隔离，电阻要分别算再合起来校验。<strong>输入侧</strong>是 LED 回路：限流电阻 Rin = (Vin − Vf) / If，
          LED 正向压降 Vf 按红外发射结取 1.2 V（通用口径，部分型号 1.5 V），电流越大光越强、CTR 越接近 datasheet 测试条件。
          <strong>输出侧</strong>是光敏三极管回路：集电极开路 + 上拉电阻 Rp，导通时要能把输出拉到逻辑低电平，
          需要的光敏管电流 Ic ≥ Vcc / Rp；而 Ic = If × CTR，倒推出需求 If = (Vcc / Rp) × 裕量系数 ÷ CTR。
          最后把需求 If 代回输入侧公式得到 Rin 上限（(Vin − Vf) / 需求 If），实际 Rin 必须不大于该值，
          同时 If 不得超过 50 mA 这类常见绝对最大额定值。两条公式首尾相接，就是一条完整的隔离信号链。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>CTR 老化降额与 50% 设计规则</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          CTR（电流传输比 = Ic / If × 100%）是光耦最核心也最「会老」的参数：LED 发光效率随工作时间单调下降，
          高温加速衰减，PC817 类通用光耦工作数年后 CTR 可能跌到初始值的一半甚至更低。
          工业设计规则是按<strong>寿命终点 CTR 降至初始 50%</strong> 核算——本工具默认饱和裕量系数 2 正是覆盖这一降额，
          再叠加批次档位（rank）离散：PC817 按 CTR 分 A（50~100%）/ B（100~200%）/ C（200~300%）/ D（300~600%）四档，
          同型号不同档差一倍以上，设计必须按档下限取值，BOM 与采购必须带档位后缀。
          若按「典型 CTR」贴着阈值设计，设备运行几年后会在毫无征兆中批量误码、丢信号——这是光耦链路最常见的隐性失效。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>光耦速率与 CTR 的权衡</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          光耦的速度和 CTR 天生是一对矛盾：光敏三极管的集电结电容与存储电荷随芯片面积增大，CTR 越高的档位（D 档）饱和越深、
          退出饱和越慢，上升 / 下降沿从几 µs 到上百 µs，PC817 类通用光耦实际可用速率通常只有几十 kbps；
          要 Mbps 级以上就得换高速光耦（6N137 / HCPL 系列，内部含光敏二极管 + 放大与整形电路，CTR 标称只有几百 µA 级传输比但沿快）。
          电路侧也有杠杆：Rp 越小沿越快但需求 If 越大；并接基极-发射极电阻（3~6 脚光耦）可加快退出饱和但吃 CTR。
          设计顺序：先定速率需求，再选光耦类型，最后按本工具的 CTR 口径核电阻——反过来先按 CTR 配电阻、再发现跑不快，
          就要整条链返工。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>为什么光耦输出常用施密特触发整形</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          光耦输出是集电极开路 + 上拉的结构，经光耦传输后边沿本来就不陡，再加上 CTR 随温度老化漂移、
          LED 电流接近阈值时输出沿会「爬」——一个缓慢变化的电平直接送进 MCU / 逻辑门时，
          信号在阈值附近徘徊会造成多次翻转、抖动甚至自激振荡。施密特触发器（如 74HC14）的正反阈值迟滞
          把缓沿「一刀两断」成干净方波，是光耦数字隔离链路的标准后级；
          6N137 等高速光耦内部自带施密特，无需外接。整形器件与逻辑电平的匹配可用
          <NuxtLink to="/tools/logic-ic-truth-table" class="text-primary hover:underline">74/4000系列速查</NuxtLink>
          核对功能与引脚；与继电器配合的隔离驱动见
          <NuxtLink to="/tools/relay-driver-calc" class="text-primary hover:underline">继电器驱动电阻计算器</NuxtLink>。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">光耦电阻怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              输入侧 Rin = (Vin − Vf) / If，Vf 取 1.2 V（通用口径）；输出侧先算上拉电流 Vcc/Rp，
              乘饱和裕量（默认 2）除以 CTR 得需求 If，再回推 Rin 上限 = (Vin − Vf) / 需求 If。
              例：Vcc = 5 V、Rp = 10 kΩ、CTR = 100%、裕量 2 → 需求 If = 1 mA；Vin = 5 V、Vf = 1.2 V → Rin 上限 3.8 kΩ。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">CTR 选多少才保险？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              按 rank 档位下限取值（A 档 50%、B 档 100%……），再乘 2 倍饱和裕量覆盖老化降额（寿命终点按初始 50% 设计）
              与温度、批次离散。不要用 datasheet 典型值直算，那是全新器件、25 ℃ 下的理想数。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么光耦输出要加施密特触发？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              集电极开路输出边沿缓、阈值附近易抖动，直接进逻辑会多次翻转。施密特触发器的迟滞特性把缓沿整形成干净方波，
              是光耦数字链路的标准后级；高速光耦（6N137 类）内部已集成，无需外加。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">If 是不是越大越好？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              不是。If 超过 50 mA 这类绝对最大值会直接损坏 LED；长期大电流还会加速 LED 光衰、缩短 CTR 寿命。
              满足需求 If 加裕量即可（常见 5~20 mA 区间），要更快的沿靠减小 Rp 或换高速光耦，而不是猛灌 LED。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'optocoupler-resistor'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Cable, Zap, GitBranch, ListChecks, ClipboardCheck, Info,
  CheckCircle, XCircle, ChevronUp, ChevronDown, Copy, Link as LinkIcon
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'optocoupler-resistor'
const STORAGE_KEY = 'optocoupler-resistor.inputs'

// SEO
useSeoMeta({
  title: '光耦电阻计算器 - 输入限流与输出上拉电阻、CTR 电流传输比校验',
  description: '在线光耦电阻计算器：输入侧 If=(Vin−Vf)/Rin 限流电阻计算（Vf 1.2/1.5 口径），输出侧按 Vcc、上拉 Rp 与 CTR（PC817 四档分档口径）反推饱和需求 If 与 Rin 上限，50mA 上限校验与 CTR 老化降额注记，纯本地计算',
  keywords: '光耦电阻, ctr计算, 光耦上拉, optocoupler calculator, 光耦限流, pc817, 施密特触发',
  author: 'Util工具箱',
  ogTitle: '光耦电阻计算器 - 有条工具',
  ogDescription: '输入侧限流电阻与输出侧上拉电阻双向校验，CTR 电流传输比与饱和裕量核算',
  ogUrl: 'https://www.util.cn/tools/optocoupler-resistor',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '光耦电阻计算器',
  twitterDescription: '光耦限流 / 上拉电阻与 CTR 校验，隔离信号链配置，纯本地计算'
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
          name: '光耦电阻计算器',
          url: 'https://www.util.cn/tools/optocoupler-resistor',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '输入侧 LED 限流电阻计算（If=(Vin−Vf)/Rin）',
            '输出侧上拉电阻与 CTR 反推需求 If',
            'PC817 四档 CTR 分档口径与档下限设计',
            'Rin 上限反推与 E24 吸附',
            'If ≤ 50 mA 上限校验与 CTR 老化降额注记'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '光耦电阻计算器', item: 'https://www.util.cn/tools/optocoupler-resistor/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '光耦电阻怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '输入侧 Rin=(Vin−Vf)/If，Vf 取 1.2V 通用口径；输出侧按上拉电流 Vcc/Rp 乘饱和裕量（默认 2）除以 CTR 得需求 If，再回推 Rin 上限=(Vin−Vf)/需求 If，同时 If 不得超过 50mA 常见上限。' }
            },
            {
              '@type': 'Question',
              name: 'CTR 选多少才保险？',
              acceptedAnswer: { '@type': 'Answer', text: '按 rank 档位下限取值（PC817：A 50~100% / B 100~200% / C 200~300% / D 300~600%），再乘 2 倍饱和裕量覆盖 CTR 老化降额（寿命终点按初始 50% 设计）与温度、批次离散。' }
            },
            {
              '@type': 'Question',
              name: '为什么光耦输出要加施密特触发？',
              acceptedAnswer: { '@type': 'Answer', text: '集电极开路输出边沿缓、阈值附近易抖动，直接进逻辑会多次翻转。施密特触发器的迟滞特性把缓沿整形成干净方波；6N137 等高速光耦内部已集成施密特。' }
            },
            {
              '@type': 'Question',
              name: '光耦 LED 电流 If 是不是越大越好？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。超过 50mA 绝对最大值会损坏 LED，长期大电流加速光衰缩短 CTR 寿命。满足需求 If 加裕量即可（常见 5~20mA），提速靠减小 Rp 或换高速光耦。' }
            }
          ]
        }
      ]
    })
  }]
})

// __PURE_FNS_START__
// ---------- 光耦电阻计算纯函数（无外部依赖） ----------
// 输入侧 LED 电流：If = (Vin − Vf) / Rin（A）；Vin ≤ Vf 时不导通，If = 0
const ifLedA = (vin, vf, rin) => {
  const v = Number(vin), f = Number(vf), r = Number(rin)
  if (!isFinite(v) || v <= 0 || !isFinite(f) || f < 0 || !isFinite(r) || r <= 0) return NaN
  if (v <= f) return 0
  return (v - f) / r
}

// 反推 Rin：Rin = (Vin − Vf) / 目标 If（Ω）
const rinForIf = (vin, vf, ifTargetA) => {
  const v = Number(vin), f = Number(vf), i = Number(ifTargetA)
  if (!isFinite(v) || !isFinite(f) || !isFinite(i) || i <= 0 || v <= f) return NaN
  return (v - f) / i
}

// PC817 CTR 分档口径（按档下限设计）
const CTR_RANKS = [
  { rank: 'A', min: 50, max: 100 },
  { rank: 'B', min: 100, max: 200 },
  { rank: 'C', min: 200, max: 300 },
  { rank: 'D', min: 300, max: 600 }
]

// 输出侧需求 If：(Vcc / Rp) × 裕量系数 ÷ CTR（A；CTR 以 % 传入）
const ifRequiredA = (vcc, rp, ctrPct, marginK) => {
  const v = Number(vcc), r = Number(rp), c = Number(ctrPct), m = Number(marginK)
  if (!isFinite(v) || v <= 0 || !isFinite(r) || r <= 0 || !isFinite(c) || c <= 0 || !isFinite(m) || m <= 0) return NaN
  return (v / r) * m / (c / 100)
}

// Rin 上限：(Vin − Vf) / 需求 If（Ω）
const rinMaxOhm = (vin, vf, ifReqA) => {
  const v = Number(vin), f = Number(vf), i = Number(ifReqA)
  if (!isFinite(v) || !isFinite(f) || !isFinite(i) || i <= 0 || v <= f) return NaN
  return (v - f) / i
}

// E24 标称值系列（1Ω~9.1MΩ）
const E24_MANTISSAS = [1, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2, 2.2, 2.4, 2.7, 3, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1]

// 吸附 E24：向下取（≤ x 的最大标称值），保证实装 If ≥ 目标；低于最小档取 1Ω
const snapE24Down = (x) => {
  const v = Number(x)
  if (!isFinite(v) || v <= 0) return null
  let best = null
  for (let d = 6; d >= 0; d--) {
    for (const m of E24_MANTISSAS) {
      const val = m * Math.pow(10, d)
      if (val <= v + 1e-9 && (best === null || val > best)) best = val
    }
  }
  return best
}

// If 上限校验（50 mA 常见绝对最大值）
const IF_MAX_A = 0.05
const overIfMax = (ifA) => {
  const i = Number(ifA)
  if (!isFinite(i) || i < 0) return null
  return i > IF_MAX_A
}

// 展示格式化（避免浮点尾差）
const fmtNum = (v, sig = 4) => (isFinite(v) ? Number(v.toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '—')
const fmtV = (v, sig = 4) => (isFinite(v) && v > 0 ? Number(v.toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '—')
const fmtMa = (v, sig = 4) => (isFinite(v) && v >= 0 ? Number(v.toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '—')
const fmtOhm = (v, sig = 4) => {
  if (!isFinite(v) || v <= 0) return '—'
  const n = Number(v.toPrecision(sig))
  if (n >= 1e6) return `${Number((n / 1e6).toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 })} MΩ`
  if (n >= 1e3) return `${Number((n / 1e3).toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 })} kΩ`
  return `${n.toLocaleString('zh-CN', { maximumFractionDigits: 4 })} Ω`
}
// __PURE_FNS_END__

// ---------- 状态 ----------
const vfOptions = [
  { v: 1.2, label: '1.2 V 通用' },
  { v: 1.5, label: '1.5 V' }
]
const marginOptions = [1.5, 2, 3]

const vin = ref(5)
const vf = ref(1.2)
const rin = ref(1000)
const targetIfMa = ref(5)
const vcc = ref(5)
const rp = ref(10000)
const ctrPct = ref(100)
const marginK = ref(2)

const ctrRanks = CTR_RANKS

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 输入持久化（键前缀为工具 id）
watch([vin, vf, rin, targetIfMa, vcc, rp, ctrPct, marginK], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      vin: vin.value,
      vf: vf.value,
      rin: rin.value,
      targetIfMa: targetIfMa.value,
      vcc: vcc.value,
      rp: rp.value,
      ctrPct: ctrPct.value,
      marginK: marginK.value
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
      const vi = num(s.vin, 0)
      if (vi !== null) vin.value = vi
      const vf2 = num(s.vf, 0)
      if (vf2 !== null) vf.value = vf2
      const ri = num(s.rin, 0)
      if (ri !== null) rin.value = ri
      const ti = num(s.targetIfMa, 0)
      if (ti !== null) targetIfMa.value = ti
      const vc = num(s.vcc, 0)
      if (vc !== null) vcc.value = vc
      const rpx = num(s.rp, 0)
      if (rpx !== null) rp.value = rpx
      const cp = num(s.ctrPct, 0)
      if (cp !== null) ctrPct.value = cp
      const mk = num(s.marginK, 0)
      if (mk !== null) marginK.value = mk
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})

// ---------- 计算 ----------
const ifActualA = computed(() => {
  const i = ifLedA(vin.value, vf.value, rin.value)
  return isFinite(i) ? i : null
})
const ifActualMa = computed(() => (ifActualA.value === null ? null : ifActualA.value * 1000))

const targetRin = computed(() => {
  const r = rinForIf(vin.value, vf.value, Number(targetIfMa.value) / 1000)
  return isFinite(r) ? r : null
})
const targetRinE24 = computed(() => (targetRin.value === null ? null : snapE24Down(targetRin.value)))

const pullDownMa = computed(() => {
  const v = Number(vcc.value), r = Number(rp.value)
  if (!isFinite(v) || v <= 0 || !isFinite(r) || r <= 0) return null
  return (v / r) * 1000
})
const ifRequiredMa = computed(() => {
  const i = ifRequiredA(vcc.value, rp.value, ctrPct.value, marginK.value)
  return isFinite(i) ? i * 1000 : null
})

const verdict = computed(() => {
  if (ifActualA.value === null || ifRequiredMa.value === null) return null
  const reqA = ifRequiredMa.value / 1000
  const linkOk = ifActualA.value >= reqA - 1e-12
  const over = overIfMax(ifActualA.value)
  const rinMax = rinMaxOhm(vin.value, vf.value, reqA)
  const rinMaxE24 = isFinite(rinMax) ? snapE24Down(rinMax) : null
  const headline = `输入侧 If = ${fmtMa(ifActualMa.value)} mA vs 需求 If = ${fmtMa(ifRequiredMa.value)} mA（Vcc/Rp = ${pullDownMa.value === null ? '—' : fmtMa(pullDownMa.value)} mA × 裕量 ${fmtNum(marginK.value, 4)} ÷ CTR ${fmtNum(ctrPct.value, 4)}%），${linkOk ? '饱和裕量充足' : '光敏管无法拉低输出，饱和不足'}`
  return { linkOk, headline, rinMax: isFinite(rinMax) ? rinMax : null, rinMaxE24, overIfMax: over === true }
})

// ---------- 汇总 ----------
const summaryInput = computed(() => {
  if (ifActualMa.value === null) return '待填写 Vin / Vf / Rin'
  return `Vin ${fmtV(vin.value)} V − Vf ${fmtV(vf.value)} V，Rin ${fmtOhm(rin.value)} → If = ${fmtMa(ifActualMa.value)} mA`
})
const summaryOutput = computed(() => {
  if (ifRequiredMa.value === null) return '待填写 Vcc / Rp / CTR'
  return `Vcc ${fmtV(vcc.value)} V、Rp ${fmtOhm(rp.value)} → 需求 If ≥ ${fmtMa(ifRequiredMa.value)} mA（CTR ${fmtNum(ctrPct.value, 4)}%、裕量 ${fmtNum(marginK.value, 4)}）`
})
const summaryCheck = computed(() => {
  if (!verdict.value) return '待两端参数齐全'
  const over = verdict.value.overIfMax ? '；If 超出 50 mA 上限，需加大 Rin' : '；If 在 50 mA 上限内'
  return `${verdict.value.linkOk ? '通过' : '不通过'}：${verdict.value.linkOk ? '实装 If 覆盖需求' : '饱和不足'}${over}`
})
const summaryRin = computed(() => {
  if (!verdict.value || verdict.value.rinMax === null) return '待反推'
  return `上限 ${fmtOhm(verdict.value.rinMax)}，E24 向下取 ${verdict.value.rinMaxE24 === null ? '—' : fmtOhm(verdict.value.rinMaxE24)}（现值 ${fmtOhm(rin.value)}）`
})

const advice = computed(() => {
  const parts = []
  if (verdict.value) {
    if (verdict.value.linkOk) {
      parts.push(`链路成立：实装 If ${fmtMa(ifActualMa.value)} mA ≥ 需求 ${fmtMa(ifRequiredMa.value)} mA，Rin 可在 ${verdict.value.rinMaxE24 === null ? fmtOhm(verdict.value.rinMax) : fmtOhm(verdict.value.rinMaxE24)}（E24）以内取值。`)
    } else {
      parts.push(`链路不成立：实装 If 低于需求，把 Rin 减小到 ${verdict.value.rinMaxE24 === null ? fmtOhm(verdict.value.rinMax) : fmtOhm(verdict.value.rinMaxE24)}（E24）以内，或降低 Rp / 选更高 CTR 档。`)
    }
    if (verdict.value.overIfMax) parts.push('If 超出 50 mA 常见上限，必须加大 Rin 限流。')
    else if (ifActualMa.value !== null && ifActualMa.value > 0 && ifActualMa.value < 1) parts.push('If 低于 1 mA 时 CTR 明显下降，建议加大 If 或核对低电流 CTR 曲线。')
    if (Number(marginK.value) < 2) parts.push('裕量系数低于 2 时不覆盖 CTR 老化降额（50% 设计规则），工业场景慎用。')
  }
  return (parts.length ? parts.join(' ') : '按两端填写后此处给出综合建议。') + '结论为工程估算，参数以所选光耦 datasheet 为准。'
})

const copySummary = () => {
  const lines = [
    '光耦信号链汇总',
    `输入侧：${summaryInput.value}`,
    `输出侧：${summaryOutput.value}`,
    `校验：${summaryCheck.value}`,
    `Rin：${summaryRin.value}`,
    `综合建议：${advice.value}`
  ]
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      alert('已复制信号链汇总到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动选择文本复制')
    })
  } else {
    alert('当前环境不支持剪贴板，请手动选择文本复制')
  }
}

// ---------- 相关工具 ----------
const relatedLinks = computed(() => ['relay-driver-calc', 'tvs-selector', 'logic-ic-truth-table']
  .map((id) => tools.find((t) => t.id === id))
  .filter(Boolean))
</script>
