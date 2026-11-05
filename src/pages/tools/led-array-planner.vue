<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Lightbulb class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">LED 串并联规划器</h1>
          <p class="text-sm text-muted-foreground mt-1">串长 / 串数 / 限流电阻一页算清，每串独立限流</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入电源电压、灯珠压降（红 / 黄 / 绿 / 蓝 / 白预设 + 自定义）、灯珠电流与总颗数，自动给出：最大串长（按电源电压的 90% 计，给限流电阻留 10% 余量）、串并联结构（几串几并）、每串限流电阻的阻值与功耗（含最近 E24 标称阻值建议与电阻功率档建议）、总电流与电源功率建议（×1.5 余量）；尾串颗数不足时单独给出尾串电阻。附「每串必须独立限流」警示卡，以及反向计算——给定电源电流预算，最多能带多少颗灯珠。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 输入 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 输入参数
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 电源电压 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">电源电压 Vs（V）</label>
              <div class="flex flex-wrap gap-1.5 mb-2">
                <button
                  v-for="v in vsPresets"
                  :key="v"
                  @click="vs = v"
                  :class="vs === v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                >{{ v }} V</button>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="vs"
                  type="number"
                  min="0"
                  step="any"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="供电电压"
                />
                <span class="text-sm text-muted-foreground">V</span>
              </div>
            </div>
            <!-- 灯珠电流 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">单颗灯珠电流 If（mA）</label>
              <div class="flex flex-wrap gap-1.5 mb-2">
                <button
                  v-for="i in ifPresets"
                  :key="i"
                  @click="ifMa = i"
                  :class="ifMa === i ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                >{{ i }} mA</button>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="ifMa"
                  type="number"
                  min="0"
                  step="any"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="如 20"
                />
                <span class="text-sm text-muted-foreground">mA</span>
              </div>
            </div>
          </div>

          <!-- 灯珠压降 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">灯珠正向压降 Vf（V）</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="p in vfPresets"
                :key="p.key"
                @click="vfKey = p.key"
                :class="vfKey === p.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >{{ p.label }} {{ p.vf }} V</button>
              <button
                @click="vfKey = 'custom'"
                :class="vfKey === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >自定义</button>
            </div>
            <div v-if="vfKey === 'custom'" class="flex items-center gap-2">
              <input
                v-model.number="vfCustom"
                type="number"
                min="0"
                step="any"
                class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="从规格书取典型 Vf"
              />
              <span class="text-sm text-muted-foreground">V</span>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              Vf 随电流和温度变化（约 −2mV/℃），同批次也有 ±0.1~0.2 V 离散——这正是并联要独立限流的原因。选离规格书典型值最近的一档。
            </p>
          </div>

          <!-- 总颗数 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">灯珠总数 N（颗）</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="n in nPresets"
                :key="n"
                @click="beadCount = n"
                :class="beadCount === n ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >{{ n }} 颗</button>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model.number="beadCount"
                type="number"
                min="0"
                step="1"
                class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="如 60"
              />
              <span class="text-sm text-muted-foreground">颗</span>
            </div>
          </div>
        </div>

        <!-- 规划结果 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <CircuitBoard class="w-5 h-5 mr-2 text-primary" /> 规划结果
          </h2>

          <!-- 电压不足 -->
          <div v-if="plan === null" class="p-6 text-center text-sm bg-amber-500/10 rounded-lg text-amber-700 dark:text-amber-400 leading-relaxed">
            <p class="font-bold mb-1">电源电压不足以串起哪怕 1 颗灯珠</p>
            <p v-if="vf > 0">即使 1 颗也需要 Vs ≥ Vf / 0.9 ≈ {{ fmt(vf / 0.9, 2) }} V（留 10% 电阻余量）。当前 Vs = {{ fmt(vs, 2) }} V、Vf = {{ fmt(vf, 2) }} V。建议：升高电源电压，或改用升压型恒流驱动。</p>
            <p v-else>请填写有效的电源电压、压降 Vf（大于 0）与灯珠电流。</p>
          </div>

          <div v-else class="space-y-4">
            <!-- 结构总览 -->
            <div class="bg-primary/10 rounded-lg p-5 text-center">
              <p class="text-xs text-muted-foreground mb-1">串并联结构</p>
              <p class="text-2xl font-bold text-primary">
                每串 {{ plan.len }} 颗 × {{ plan.strings }} 串并联
              </p>
              <p class="text-xs text-muted-foreground mt-1.5">
                最大串长 = ⌊Vs×0.9 / Vf⌋ = ⌊{{ fmt(vs, 2) }}×0.9 / {{ fmt(vf, 2) }}⌋ = {{ plan.len }}，串数 = ⌈{{ beadCount }} / {{ plan.len }}⌉ = {{ plan.strings }}
              </p>
            </div>

            <!-- 每串限流电阻 -->
            <div v-if="mainRes" class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">每串限流电阻（满串 {{ plan.len }} 颗）</p>
                <p class="text-xl font-bold text-primary">{{ fmt(mainRes.r, 1) }} Ω</p>
                <p class="text-[10px] text-muted-foreground mt-1">= ({{ fmt(vs, 2) }} − {{ plan.len }}×{{ fmt(vf, 2) }}) / {{ fmt(ifA * 1000, 1) }} mA</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">E24 标称建议（≥ 计算值）</p>
                <p class="text-xl font-bold text-foreground">{{ fmt(mainRes.std, 1) }} Ω</p>
                <p class="text-[10px] text-muted-foreground mt-1">取标称偏大，实际电流 ≈ {{ fmt(mainRes.actualI * 1000, 1) }} mA</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">电阻功耗 / 功率档建议</p>
                <p class="text-xl font-bold text-foreground">{{ fmtPower(mainRes.p) }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">按 2 倍降额 → 选 ≥ {{ fmt(mainRes.rating, 2) }} W 档</p>
              </div>
            </div>

            <!-- 尾串 -->
            <div v-if="tailRes" class="border border-border rounded-lg p-4 text-sm leading-relaxed text-muted-foreground">
              <span class="text-foreground font-medium">尾串只有 {{ plan.remainder }} 颗</span>（{{ plan.full }} 串满串 + 1 串尾串）：尾串压降小，电阻要单独取
              <span class="text-primary font-bold">{{ fmt(tailRes.r, 1) }} Ω</span>
              （E24 取 {{ fmt(tailRes.std, 1) }} Ω，功耗 {{ fmtPower(tailRes.p) }}），不能与满串共用同值电阻，否则尾串电流偏大。
            </div>

            <!-- 总电流与电源 -->
            <div v-if="totals" class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">总电流（{{ plan.strings }} 串 × {{ fmt(ifA * 1000, 1) }} mA）</p>
                <p class="text-xl font-bold text-foreground">{{ fmtCurrent(totals.current) }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">负载功率 Vs × I_total</p>
                <p class="text-xl font-bold text-foreground">{{ fmt(totals.power, 2) }} W</p>
              </div>
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">电源功率建议（×1.5 余量）</p>
                <p class="text-xl font-bold text-primary">≥ {{ fmt(totals.recommend, 2) }} W</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              ×0.9 的含义：给限流电阻留出至少 10% 电源电压的压降，电阻压降太小时电流会随 Vf 的离散与温漂剧烈变化。若算出的电阻压降恰好压在 10% 线上，实际还要核对 Vf 上限（高温 / 大电流时 Vf 降低，电流会进一步上浮）。
            </p>
          </div>
        </div>

        <!-- 每串独立限流警示卡 -->
        <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5 flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div class="text-sm leading-relaxed text-amber-700 dark:text-amber-400">
            <p class="font-bold mb-1">警示：每串必须独立限流，严禁多串共用一只电阻</p>
            <p>
              多串并联共用一个限流电阻时，各串电流完全靠灯珠 Vf 的离散度「自行分配」：Vf 偏低的一串会抢走远超额定的电流，越热 Vf 越低、越抢越多，正反馈轻则亮度不均、重则连锁烧珠，坏一颗后剩余串的电流进一步失衡。正确做法：每串一只独立限流电阻（本工具按串给出阻值），或整串采用恒流驱动 / 每珠一颗恒流 IC。
            </p>
          </div>
        </div>

        <!-- 反向：电源最多带多少颗 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Undo2 class="w-5 h-5 mr-2 text-primary" /> 反向：电源最多带多少颗
          </h2>
          <div class="flex flex-wrap items-center gap-2">
            <label class="text-sm font-medium text-foreground">电源电流预算</label>
            <input
              v-model.number="iMaxMa"
              type="number"
              min="0"
              step="any"
              class="w-32 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 500"
            />
            <span class="text-sm text-muted-foreground">mA</span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="i in iMaxPresets"
                :key="i"
                @click="iMaxMa = i"
                :class="iMaxMa === i ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >{{ i }} mA</button>
            </div>
          </div>
          <div v-if="maxPlan" class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">最多串数 ⌊I_max / If⌋</p>
              <p class="text-xl font-bold text-foreground">{{ maxPlan.strings }} 串</p>
            </div>
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">最多灯珠（{{ maxPlan.len }} 颗/串）</p>
              <p class="text-xl font-bold text-primary">{{ maxPlan.beads }} 颗</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">对应电源功率</p>
              <p class="text-xl font-bold text-foreground">{{ fmt(maxPlan.power, 2) }} W</p>
              <p class="text-[10px] text-muted-foreground mt-1">按 ×1.5 余量选 ≥ {{ fmt(maxPlan.recommend, 2) }} W</p>
            </div>
          </div>
          <p v-else class="text-xs text-muted-foreground leading-relaxed">
            填入大于 0 的电流预算后自动计算：串数受 ⌊I_max/If⌋ 限制，每串 {{ maxSeriesLen }} 颗。若预算电流不够点亮一串（I_max &lt; If），需加大预算或改用恒流升压驱动。
          </p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
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
              Vs=12、Vf=3.2、20mA → <span class="text-foreground font-medium">串长 3，R=120 Ω，P=48 mW</span>
            </button>
            <button
              @click="loadExample('b')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              N=60 → <span class="text-foreground font-medium">20 串每串 3 颗，总电流 400 mA，电源 ≥ 7.2 W</span>
            </button>
            <button
              @click="loadExample('c')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              N=62 → <span class="text-foreground font-medium">21 串，尾串 2 颗用 280 Ω</span>
            </button>
            <button
              @click="loadExample('d')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              12V、预算 500 mA → <span class="text-foreground font-medium">最多 25 串 × 3 = 75 颗</span>
            </button>
          </div>
        </div>

        <!-- 常见灯珠规格 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Table class="w-4 h-4 mr-2 text-primary" /> 常见灯珠规格速查
          </h2>
          <ul class="text-xs text-muted-foreground leading-relaxed space-y-2 list-disc pl-4">
            <li>直插 3/5 mm：20 mA；Vf 红/黄 ≈ 2.0~2.1 V，绿 ≈ 2.2 V，蓝/白 ≈ 3.0~3.4 V。</li>
            <li>贴片 2835（0.2 W）：60 mA，白光 Vf ≈ 3.0~3.4 V；0.5 W 款 150 mA。</li>
            <li>贴片 5050：内部 3 颗芯片并联引脚，每芯约 20 mA——三芯要各自限流，不能共一只电阻。</li>
            <li>1 W 大功率：350 mA、Vf ≈ 3.0~3.6 V，发热显著，建议直接上恒流驱动 + 铝基板散热。</li>
            <li>红黄光的 Vf 明显低于蓝白光：混合配色时按颜色分组各自规划串长。</li>
          </ul>
        </div>

        <!-- 电阻限流 vs 恒流 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Zap class="w-4 h-4 mr-2 text-primary" /> 电阻限流 vs 恒流驱动
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            电阻限流：便宜、无噪声，适合小电流（≤30 mA/串）、串数少、电源电压稳定的场景；缺点是效率损失在电阻上、Vf 离散直接反映为亮度差。恒流驱动：电流不受 Vf 漂移影响，适合大功率珠、长串、一致性要求高或电源电压波动大的场景——串数多到大电流时，即使电阻方案也建议按「每串独立」原则布线。
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>LED 串并联结构与限流原理</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <h3 class="text-lg font-semibold text-foreground">为什么要每串独立限流？</h3>
          <p>
            LED 的 Vf（正向压降）不是精密常数：同批次离散 ±0.1~0.2 V，温度每升 1℃ 降约 2 mV，电流越大 Vf 还会变。多串并联只挂一只总电阻时，各串的电流分配完全取决于每串「哪串 Vf 更低」——Vf 低的那串分到远超额定的电流，发热更大、温度更高、Vf 更低，正反馈循环（热失控）轻则亮度不均、重则第一串烧毁后剩余串电流再失衡连锁烧珠。独立限流电阻把每串的电流「钉」在自己的 I-V 曲线上，互相不抢；恒流驱动则是从原理上消灭了抢电流的可能。
          </p>
          <h3 class="text-lg font-semibold text-foreground">串联 vs 并联：坏一颗珠会发生什么？</h3>
          <p>
            串联的失效行为：一颗<strong>开路</strong>整串熄灭（其余串不受影响，前提是独立限流）；一颗<strong>短路</strong>则该串电阻压降变大、电流略升，串还亮但电阻更热。并联的失效行为更危险：一颗短路会把同组所有珠并联短路、电流全部灌进故障点；一颗开路则它原来的电流重新分配到剩余珠上，每颗电流变大、加速老化——「一灭全亮再全灭」就是并联灯珠的典型死亡链条。所以工程实践是「先串够电压，再并联扩流，并联的每一串独立限流」。
          </p>
          <h3 class="text-lg font-semibold text-foreground">恒流驱动什么时候必要？</h3>
          <p>
            三个信号出现就该上恒流：① 单珠功率 ≥ 0.5 W（电流上百 mA，电阻损耗和发热难以接受）；② 串长长到电阻压降占比小于 20%，Vf 漂移对电流的放大效应显著；③ 对亮度一致性 / 寿命有要求（照明、背光）。恒流 IC（线性恒流或开关型）把「电流由电阻决定」改成「电流被环路闭环钉死」，Vf 离散、温漂、电源波动都不再影响亮度。装饰彩灯、指示灯这类小电流场景，电阻限流依旧是最便宜可靠的方案。
          </p>
          <h3 class="text-lg font-semibold text-foreground">和电池组（battery-pack）的结构思想对比</h3>
          <p>
            LED 阵列和电池组是同一套「串并联拓扑」的两个镜像：电池<strong>串联升压、并联扩容</strong>，LED <strong>串联分压、并联扩流</strong>。两者都怕「不均衡」——电池组怕串联中的落后单体被过充过放（需要均衡电路），LED 阵列怕并联中的低 Vf 支路抢电流（需要独立限流）；两者都在并联侧出事会连锁（电池热失控扩散、LED 抢电流烧珠）。解法也同构：每串独立管理（电池的均衡/保护板 ⇋ LED 的独立限流电阻或恒流），先串后并、并联数尽量多而串内一致性好。规划电池串并联时可以用 <NuxtLink to="/tools/battery-pack-calculator" class="text-primary hover:underline">电池组串并联计算器</NuxtLink> 交叉验证结构思想。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么要每串独立限流？</span>Vf 有离散和负温度系数，共用电阻时低 Vf 串抢电流、越热越抢形成热失控；独立电阻把每串电流钉死，互不影响。</li>
            <li><span class="text-foreground font-medium">串联好还是并联好？</span>优先串联（电流小、效率高、各串天然均流），电压不够升压或减串长；并联只用于扩流，且必须每串独立限流。纯并联（珠并珠不限流）最不可靠。</li>
            <li><span class="text-foreground font-medium">算出的电阻没有对应标称值怎么办？</span>取 E24 序列中不小于计算值的一档（电流略小于额定，安全方向）；电阻额定功率按实际功耗 ×2 以上选取，贴片 0805 约 0.125 W、1206 约 0.25 W。</li>
            <li><span class="text-foreground font-medium">12V 能串几颗白光 LED？</span>白光 Vf≈3.2 V：⌊12×0.9/3.2⌋ = 3 颗，串压降 9.6 V，电阻压降 2.4 V，20 mA 时取 R = 2.4/0.02 = 120 Ω、功耗 48 mW。电源电压的 10% 留给电阻是稳定工作的底线。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'led-array-planner'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Lightbulb, Calculator, CircuitBoard, Undo2, AlertTriangle, Table, Zap, FlaskConical, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'LED串并联规划器 - 限流电阻/串数并数在线计算 | Util工具箱',
  description: '在线 LED 串并联规划：按 Vs×0.9/Vf 算最大串长、串数并数、每串独立限流电阻阻值与功耗、E24 标称建议、总电流与电源功率建议（×1.5 余量），尾串单独取阻，反向计算电源最多带多少颗灯珠，附每串独立限流警示，纯本地计算',
  keywords: 'led串并联, led限流电阻, 限流电阻计算, 灯珠串联, led驱动, 串数并数, led分流电阻, led array calculator, led resistor',
  author: 'Util工具箱',
  ogTitle: 'LED串并联规划器 - 限流电阻/串数并数',
  ogDescription: '串长/串数/限流电阻/电源功率一页算清，每串独立限流',
  ogUrl: 'https://www.util.cn/tools/led-array-planner',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'LED串并联规划器',
  twitterDescription: '串长/串数/限流电阻/电源功率一页算清'
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
          name: 'LED串并联规划器',
          url: 'https://www.util.cn/tools/led-array-planner',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['最大串长计算（10% 电阻余量）', '串并联结构规划（几串几并）', '每串限流电阻阻值与功耗', 'E24 标称阻值与功率档建议', '总电流与电源功率建议（×1.5）', '反向：电源最多带灯珠数']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: 'LED串并联规划器', item: 'https://www.util.cn/tools/led-array-planner' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么要每串独立限流？',
              acceptedAnswer: { '@type': 'Answer', text: '灯珠 Vf 有离散和负温度系数，多串共用电阻时低 Vf 串会抢电流、越热越抢形成热失控；独立限流电阻把每串电流钉死，互不影响。' }
            },
            {
              '@type': 'Question',
              name: '串联好还是并联好？',
              acceptedAnswer: { '@type': 'Answer', text: '优先串联（电流小、效率高、天然均流），电压不够时升压或减串长；并联只用于扩流且必须每串独立限流。纯并联（珠并珠不限流）最不可靠。' }
            },
            {
              '@type': 'Question',
              name: '算出的电阻没有对应标称值怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '取 E24 序列中不小于计算值的一档（电流略小于额定，属安全方向）；电阻额定功率按实际功耗的 2 倍以上选取。' }
            },
            {
              '@type': 'Question',
              name: '12V 能串几颗白光 LED？',
              acceptedAnswer: { '@type': 'Answer', text: '白光 Vf≈3.2V 时最多 3 颗（12×0.9/3.2≈3.4 取整）：串压降 9.6V，电阻压降 2.4V，20mA 取 R=120Ω、功耗 48mW。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'led-array-planner'
const STORE_KEY = TOOL_ID + ':inputs'
const tool = tools.find(t => t.id === TOOL_ID)

// ==== PURE-FNS-START（纯计算函数，供单测逐行校验）====
const laOk = (x) => typeof x === 'number' && isFinite(x)

// 灯珠压降预设（V）
const LA_VF_PRESETS = [
  { key: 'red', label: '红', vf: 2.0 },
  { key: 'yellow', label: '黄', vf: 2.1 },
  { key: 'green', label: '绿', vf: 2.2 },
  { key: 'blue', label: '蓝', vf: 3.2 },
  { key: 'white', label: '白', vf: 3.2 }
]

// E24 标称序列（1.0~9.1）
const LA_E24 = [1, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2, 2.2, 2.4, 2.7, 3, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1]

// 电阻额定功率档（W）
const LA_RATINGS = [0.125, 0.25, 0.5, 1, 2, 3, 5]

// 最大串长 = ⌊Vs×0.9 / Vf⌋，留 10% 电源电压给限流电阻；不可行时返回 0
const laMaxSeries = (vs, vf) => {
  if (!laOk(vs) || !laOk(vf) || !(vs > 0) || !(vf > 0)) return 0
  const len = Math.floor((vs * 0.9) / vf)
  return len >= 1 ? len : 0
}

// 每串限流电阻 R = (Vs − 串长×Vf) / If；电阻压降 ≤ 0 时无解返回 null
const laStringResistor = (vs, vf, len, ifA) => {
  if (!laOk(vs) || !laOk(vf) || !laOk(len) || !laOk(ifA)) return null
  if (!(len >= 1) || !(ifA > 0) || len !== Math.floor(len)) return null
  const head = vs - len * vf
  if (!(head > 0)) return null
  return head / ifA
}

// 电阻功耗 P = (Vs − 串长×Vf) × If（W）
const laResistorPower = (vs, vf, len, ifA) => {
  if (!laOk(vs) || !laOk(vf) || !laOk(len) || !laOk(ifA)) return null
  if (!(len >= 1) || !(ifA > 0) || len !== Math.floor(len)) return null
  const head = vs - len * vf
  if (!(head > 0)) return null
  return head * ifA
}

// 不小于计算值的最小 E24 标称阻值（电流不超额定的安全方向）
const laNearestE24 = (r) => {
  if (!laOk(r) || !(r > 0)) return null
  const dec = Math.floor(Math.log10(r))
  for (let d = dec - 1; d <= dec + 1; d++) {
    for (const base of LA_E24) {
      const v = base * Math.pow(10, d)
      if (v >= r - 1e-9) return Number(v.toPrecision(2))
    }
  }
  return null
}

// 电阻额定功率档：不小于 2 倍实际功耗的最小标准档；超出序列返回最大档
const laResistorRating = (pW) => {
  if (!laOk(pW) || !(pW >= 0)) return null
  const need = pW * 2
  for (const r of LA_RATINGS) {
    if (r >= need - 1e-12) return r
  }
  return LA_RATINGS[LA_RATINGS.length - 1]
}

// 串并联规划：N 颗、每串最多 len 颗 → 满串数 / 尾串颗数 / 总串数
const laPlanStrings = (n, len) => {
  if (!laOk(n) || !laOk(len) || !(n >= 1) || !(len >= 1)) return null
  if (n !== Math.floor(n) || len !== Math.floor(len)) return null
  const full = Math.floor(n / len)
  const remainder = n % len
  return {
    full,
    remainder,
    strings: Math.ceil(n / len),
    lastLen: remainder > 0 ? remainder : len
  }
}

// 反向：电源电流预算最多带多少颗 → { len, strings, beads }
const laMaxBeads = (vs, vf, ifA, iMax) => {
  const len = laMaxSeries(vs, vf)
  if (!laOk(ifA) || !laOk(iMax) || !(ifA > 0) || !(iMax > 0) || len < 1) {
    return { len, strings: 0, beads: 0 }
  }
  const strings = Math.floor(iMax / ifA)
  return { len, strings, beads: len * strings }
}

// 总电流（A）
const laTotalCurrent = (strings, ifA) => {
  if (!laOk(strings) || !laOk(ifA) || !(strings >= 1) || !(ifA > 0)) return NaN
  return strings * ifA
}

// 电源功率 = Vs × 总电流（W），建议值 ×1.5
const laSupplyPower = (vs, totalI) => {
  if (!laOk(vs) || !laOk(totalI) || !(vs > 0) || !(totalI > 0)) return NaN
  return vs * totalI
}
const laRecommendedPower = (pW) => {
  if (!laOk(pW) || !(pW > 0)) return NaN
  return pW * 1.5
}
// ==== PURE-FNS-END ====

// ---------- 状态 ----------
const vs = ref(12)
const vfKey = ref('blue')
const vfCustom = ref(3.2)
const ifMa = ref(20)
const beadCount = ref(60)
const iMaxMa = ref(500)

const vsPresets = [3.3, 5, 9, 12, 24]
const ifPresets = [5, 10, 20, 30, 60]
const nPresets = [10, 30, 60, 100]
const iMaxPresets = [100, 200, 500, 1000]

// 交互记录与输入持久化（SSR 安全：localStorage 仅在客户端执行）
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_KEY) : null
    if (raw) {
      const s = JSON.parse(raw)
      const nums = { vs, vfCustom, ifMa, beadCount, iMaxMa }
      for (const k of Object.keys(nums)) if (typeof s[k] === 'number') nums[k].value = s[k]
      if (typeof s.vfKey === 'string') vfKey.value = s.vfKey
    }
  } catch (e) { /* 忽略恢复失败 */ }
})

const persist = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      vs: vs.value, vfKey: vfKey.value, vfCustom: vfCustom.value,
      ifMa: ifMa.value, beadCount: beadCount.value, iMaxMa: iMaxMa.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}
watch([vs, vfKey, vfCustom, ifMa, beadCount, iMaxMa], persist)

// ---------- 数字格式化（避免浮点尾差） ----------
const fmt = (v, digits = 2) => {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  return Number(v.toFixed(digits)).toLocaleString('zh-CN', { maximumFractionDigits: digits })
}
const fmtPower = (w) => {
  if (typeof w !== 'number' || !isFinite(w)) return '—'
  if (w >= 1) return fmt(w, 3) + ' W'
  if (w >= 1e-3) return fmt(w * 1e3, 3) + ' mW'
  return fmt(w * 1e6, 3) + ' µW'
}
const fmtCurrent = (a) => {
  if (typeof a !== 'number' || !isFinite(a)) return '—'
  if (a >= 1) return fmt(a, 3) + ' A'
  return fmt(a * 1e3, 3) + ' mA'
}

// ---------- 计算态 ----------
const vf = computed(() => {
  if (vfKey.value === 'custom') return typeof vfCustom.value === 'number' ? vfCustom.value : NaN
  const p = LA_VF_PRESETS.find(x => x.key === vfKey.value)
  return p ? p.vf : NaN
})
const ifA = computed(() => (typeof ifMa.value === 'number' ? ifMa.value / 1000 : NaN))

const plan = computed(() => {
  const len = laMaxSeries(vs.value, vf.value)
  if (len < 1) return null
  const p = laPlanStrings(beadCount.value, len)
  return p ? { len, ...p } : null
})

const maxSeriesLen = computed(() => laMaxSeries(vs.value, vf.value))

// 每串电阻（满串）
const mainRes = computed(() => {
  if (!plan.value) return null
  const r = laStringResistor(vs.value, vf.value, plan.value.len, ifA.value)
  const p = laResistorPower(vs.value, vf.value, plan.value.len, ifA.value)
  if (r === null || p === null) return null
  const std = laNearestE24(r)
  return {
    r,
    p,
    std,
    actualI: std ? (vs.value - plan.value.len * vf.value) / std : ifA.value,
    rating: laResistorRating(p)
  }
})

// 尾串电阻（颗数不足时单独取值）
const tailRes = computed(() => {
  if (!plan.value || plan.value.remainder === 0) return null
  const r = laStringResistor(vs.value, vf.value, plan.value.remainder, ifA.value)
  const p = laResistorPower(vs.value, vf.value, plan.value.remainder, ifA.value)
  if (r === null || p === null) return null
  const std = laNearestE24(r)
  return { r, p, std }
})

// 总电流与电源功率
const totals = computed(() => {
  if (!plan.value) return null
  const current = laTotalCurrent(plan.value.strings, ifA.value)
  const power = laSupplyPower(vs.value, current)
  if (!isFinite(power)) return null
  return { current, power, recommend: laRecommendedPower(power) }
})

// 反向：最多带多少颗
const maxPlan = computed(() => {
  if (!laOk(iMaxMa.value) || !(iMaxMa.value > 0)) return null
  const m = laMaxBeads(vs.value, vf.value, ifA.value, iMaxMa.value / 1000)
  if (m.strings < 1) return null
  const power = laSupplyPower(vs.value, m.strings * ifA.value)
  return {
    len: m.len,
    strings: m.strings,
    beads: m.beads,
    power,
    recommend: isFinite(power) ? laRecommendedPower(power) : NaN
  }
})

// ---------- 交互 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const loadExample = (kind) => {
  if (kind === 'a') {
    vs.value = 12; vfKey.value = 'blue'; ifMa.value = 20
  } else if (kind === 'b') {
    vs.value = 12; vfKey.value = 'blue'; ifMa.value = 20; beadCount.value = 60
  } else if (kind === 'c') {
    vs.value = 12; vfKey.value = 'blue'; ifMa.value = 20; beadCount.value = 62
  } else if (kind === 'd') {
    vs.value = 12; vfKey.value = 'blue'; ifMa.value = 20; iMaxMa.value = 500
  }
}
</script>
