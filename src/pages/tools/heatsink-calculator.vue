<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Thermometer class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">散热热阻计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">功率器件结温正反算、散热器选型与热阻链可视化在线计算器</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        按热阻串联模型 Tj = Ta + Pd × (Rjc + Rcs + Rsa) 计算：正算模式输入散热器热阻求结温与各段温升；反算模式由目标结温反推散热器热阻上限 Rsa_max，并给出散热器档位选型提示。全部计算在浏览器本地完成，Rjc 等参数以器件数据手册为准，本工具为快速估算。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 结温 / 散热器热阻计算
        </h2>

        <!-- 模式切换 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="mode = 'forward'"
            :class="mode === 'forward' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2.5 rounded-lg text-sm font-medium transition-all"
          >正算 · 已知散热器求结温</button>
          <button
            @click="mode = 'reverse'"
            :class="mode === 'reverse' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2.5 rounded-lg text-sm font-medium transition-all"
          >反算 · 目标结温选散热器</button>
        </div>

        <!-- 共享输入 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">功耗 Pd（W）</label>
            <input
              v-model.number="pd"
              type="number"
              min="0"
              step="0.5"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">器件实际耗散功率（不是电源电压×总电流）</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">环境温度 Ta（℃）</label>
            <input
              v-model.number="taVal"
              type="number"
              step="1"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">机箱内夏季工况建议按 40~50℃ 取</p>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground">结-壳热阻 Rjc（℃/W）</label>
            <div class="flex gap-1.5">
              <button
                v-for="p in rjcPresets"
                :key="p.name"
                @click="rjc = p.value"
                class="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
                :title="p.hint"
              >{{ p.name }}</button>
            </div>
          </div>
          <input
            v-model.number="rjc"
            type="number"
            min="0"
            step="0.1"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">取数据手册 θJC：TO-220 典型 1.5~4、TO-247 0.7~1、DFN 5~40，DFN/QFN 封装差异大，务必按手册填写</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">壳-散热器界面热阻 Rcs（℃/W）</label>
          <select
            v-model="rcsPreset"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="o in rcsOptions" :key="o.key" :value="o.key">{{ o.label }}</option>
          </select>
          <div v-if="rcsPreset === 'custom'" class="mt-2">
            <input
              v-model.number="rcsCustom"
              type="number"
              min="0"
              step="0.05"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="自定义 Rcs（℃/W）"
            />
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">装散热器必须计入界面材料热阻；干接触（不涂硅脂）同样有 0.5~1℃/W</p>
        </div>

        <!-- 正算结果 -->
        <div v-if="mode === 'forward'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">散热器热阻 Rsa（℃/W）</label>
            <input
              v-model.number="rsa"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">散热器规格书标注的 Rsa（自然对流典型 2~6，风冷可到 1 以下）</p>
          </div>

          <div v-if="fwd" class="space-y-3">
            <div :class="['rounded-lg p-5 text-center', fwd.tier.bg]">
              <p class="text-xs text-muted-foreground mb-1">结温 Tj = Ta + Pd × (Rjc + Rcs + Rsa)</p>
              <p :class="['text-4xl font-bold', fwd.tier.cls]">{{ fmt(fwd.tj, 1) }} ℃</p>
              <div class="mt-2 flex items-center justify-center gap-2 text-sm">
                <span :class="['px-2.5 py-0.5 rounded-full font-medium', fwd.tier.cls, fwd.tier.bg]">{{ fwd.tier.label }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-2">{{ fwd.tier.note }}</p>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground mb-1">结→壳温升</p>
                <p class="text-sm font-bold text-foreground">+{{ fmt(fwd.dtJc, 1) }} ℃</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">Pd×Rjc</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground mb-1">界面温升</p>
                <p class="text-sm font-bold text-foreground">+{{ fmt(fwd.dtCs, 1) }} ℃</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">Pd×Rcs</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground mb-1">散热器温升</p>
                <p class="text-sm font-bold text-foreground">+{{ fmt(fwd.dtSa, 1) }} ℃</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">Pd×Rsa</p>
              </div>
            </div>

            <div class="text-sm space-y-1">
              <div class="flex justify-between py-1.5 border-b border-border/50">
                <span class="text-muted-foreground">壳温 Tc = Ta + Pd×(Rcs + Rsa)</span>
                <span class="text-foreground font-medium">{{ fmt(fwd.tc, 1) }} ℃</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-border/50">
                <span class="text-muted-foreground">散热器温度 Ts = Ta + Pd×Rsa</span>
                <span class="text-foreground font-medium">{{ fmt(fwd.ts, 1) }} ℃</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-border/50">
                <span class="text-muted-foreground">总热阻 Rjc+Rcs+Rsa</span>
                <span class="text-foreground font-medium">{{ fmt(fwd.total, 2) }} ℃/W</span>
              </div>
            </div>

            <button
              @click="copyResult"
              class="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Clipboard class="w-3.5 h-3.5" /> 复制计算结果
            </button>
          </div>
          <div v-else class="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            请输入大于 0 的功耗 Pd 及有效的热阻参数。
          </div>
        </div>

        <!-- 反算结果 -->
        <div v-else class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">目标结温 Tj（℃）</label>
            <input
              v-model.number="targetTj"
              type="number"
              step="5"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">通用硅器件按 125℃ 设计（上限 150~175℃ 以手册为准），碳化硅可放宽</p>
          </div>

          <div v-if="rev" class="space-y-3">
            <div v-if="rev.ok" class="bg-primary/10 rounded-lg p-5 text-center">
              <p class="text-xs text-muted-foreground mb-1">Rsa_max = (Tj − Ta) / Pd − Rjc − Rcs</p>
              <p class="text-4xl font-bold text-primary">{{ fmt(rev.rsaMax, 2) }} <span class="text-lg">℃/W</span></p>
              <p class="text-sm text-foreground mt-2 font-medium">结论：散热器热阻需小于 {{ fmt(rev.rsaMax, 2) }} ℃/W</p>
              <p class="text-xs text-muted-foreground mt-1">留 20% 裕量建议按 Rsa ≤ {{ fmt(rev.rec, 2) }} ℃/W 选型</p>
            </div>
            <div v-else class="bg-red-500/10 rounded-lg p-5 text-center">
              <p class="text-4xl font-bold text-red-600 dark:text-red-400">无解</p>
              <p class="text-sm text-muted-foreground mt-2">
                Rsa_max = {{ fmt(rev.rsaMax, 2) }} ℃/W ≤ 0：壳侧热阻（Rjc+Rcs={{ fmt(rjc + rcsEff, 2) }}℃/W）已吃掉全部温升预算，仅靠散热器无法把结温压到 {{ fmt(targetTj, 0) }}℃，需降功耗 / 降环境温度 / 并联器件或改液冷。
              </p>
            </div>

            <div class="p-4 bg-muted/50 rounded-lg">
              <p class="text-sm font-medium text-foreground mb-1">散热器档位提示：{{ rev.hint.label }}</p>
              <p class="text-xs text-muted-foreground leading-relaxed">{{ rev.hint.text }}</p>
            </div>

            <button
              @click="copyResult"
              class="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Clipboard class="w-3.5 h-3.5" /> 复制计算结果
            </button>
          </div>
          <div v-else class="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            请输入大于 0 的功耗 Pd。
          </div>
        </div>

        <!-- 热阻链可视化 -->
        <div class="border-t border-border/50 pt-4">
          <h3 class="text-sm font-medium text-foreground mb-2">热阻链可视化（结 → 壳 → 界面材料 → 散热器 → 环境）</h3>
          <svg viewBox="0 0 680 200" class="w-full h-auto" role="img" aria-label="热阻链与温度刻度示意图">
            <defs>
              <marker id="hs-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
              </marker>
            </defs>

            <!-- 连接箭头 -->
            <g class="text-muted-foreground" stroke-width="1.5">
              <line :x1="116" y1="82" :x2="144" y2="82" stroke="currentColor" marker-end="url(#hs-arrow)" />
              <line :x1="254" y1="82" :x2="282" y2="82" stroke="currentColor" marker-end="url(#hs-arrow)" />
              <line :x1="392" y1="82" :x2="420" y2="82" stroke="currentColor" marker-end="url(#hs-arrow)" />
              <line :x1="530" y1="82" :x2="558" y2="82" stroke="currentColor" marker-end="url(#hs-arrow)" />
            </g>

            <!-- 段标注：热阻与温升 -->
            <g class="fill-current text-muted-foreground" font-size="11" text-anchor="middle">
              <text :x="130" y="44">Rjc {{ fmt(chain.rjc, 2) }}℃/W</text>
              <text :x="130" y="126">ΔT {{ fmt(chain.dtJc, 1) }}℃</text>
              <text :x="337" y="44">Rcs {{ fmt(chain.rcs, 2) }}℃/W</text>
              <text :x="337" y="126">ΔT {{ fmt(chain.dtCs, 1) }}℃</text>
              <text :x="547" y="44">Rsa {{ fmt(chain.rsa, 2) }}℃/W</text>
              <text :x="547" y="126">ΔT {{ fmt(chain.dtSa, 1) }}℃</text>
            </g>

            <!-- 五个节点 -->
            <g v-for="b in chainBoxes" :key="b.name">
              <rect
                :x="b.x" y="56" width="104" height="52" rx="8"
                fill="currentColor" fill-opacity="0.1"
                stroke="currentColor" stroke-opacity="0.45" stroke-width="1"
                class="text-muted-foreground"
              />
              <text :x="b.x + 52" y="78" font-size="12" text-anchor="middle" :class="'fill-current ' + b.textCls">{{ b.name }}</text>
              <text :x="b.x + 52" y="97" font-size="12" font-weight="bold" text-anchor="middle" :class="'fill-current ' + b.textCls">{{ b.temp }}</text>
            </g>

            <!-- 温度刻度轴 Ta → Ts → Tc → Tj -->
            <g class="text-muted-foreground">
              <line x1="20" y1="166" x2="660" y2="166" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.5" />
              <g v-for="t in axisTicks" :key="t.label">
                <line :x1="t.x" y1="161" :x2="t.x" y2="171" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" />
                <text :x="t.x" y="188" font-size="11" text-anchor="middle" class="fill-current">{{ t.label }}</text>
              </g>
            </g>
          </svg>
          <p class="text-xs text-muted-foreground mt-1">
            各段温升 = Pd × R；温度沿热流方向从 Tj 逐段降向 Ta{{ mode === 'reverse' && rev && rev.ok ? '（反算模式按 Rsa = Rsa_max 绘制）' : '' }}。
          </p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 判定档位 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Gauge class="w-4 h-4 mr-2 text-primary" /> 结温判定档位
          </h2>
          <div class="space-y-2.5 text-sm">
            <div class="flex gap-2.5 items-start">
              <span class="mt-1 w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></span>
              <div>
                <p class="text-green-600 dark:text-green-400 font-medium">Tj &lt; 125℃ · 保守安全</p>
                <p class="text-xs text-muted-foreground">留足裕量，长寿命与降额设计的推荐区间。</p>
              </div>
            </div>
            <div class="flex gap-2.5 items-start">
              <span class="mt-1 w-2.5 h-2.5 rounded-full bg-yellow-500 flex-shrink-0"></span>
              <div>
                <p class="text-yellow-600 dark:text-yellow-400 font-medium">125 ~ 150℃ · 可用但需降额</p>
                <p class="text-xs text-muted-foreground">需按数据手册降额曲线核实，评估最高环境温度工况。</p>
              </div>
            </div>
            <div class="flex gap-2.5 items-start">
              <span class="mt-1 w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"></span>
              <div>
                <p class="text-red-600 dark:text-red-400 font-medium">&gt; 150℃ · 不可</p>
                <p class="text-xs text-muted-foreground">通用硅上限 150~175℃（以手册为准），超限必须加大散热或降功耗。</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 典型封装 θJC -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Cpu class="w-4 h-4 mr-2 text-primary" /> 典型封装 θJC 参考
          </h2>
          <div class="text-sm space-y-1.5">
            <div v-for="p in rjcPresets" :key="p.name" class="flex justify-between items-center py-1 border-b border-border/50">
              <span class="text-muted-foreground">{{ p.name }}</span>
              <span class="text-foreground font-medium">{{ p.hint }}</span>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3">以上为经验范围，同一封装不同器件差异可达数倍，Rjc 等参数以器件数据手册为准，本工具为快速估算。</p>
        </div>

        <!-- 自核示例 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <FlaskConical class="w-4 h-4 mr-2 text-primary" /> 快速自核示例
          </h2>
          <div class="space-y-2">
            <button
              @click="loadExample('forward')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              正算：Pd=10W、Rjc=1.5、Rcs=0.4、Rsa=2.5、Ta=40℃ → Tj = 40 + 10×4.4 = <span class="text-foreground font-medium">84℃</span>
            </button>
            <button
              @click="loadExample('reverse')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              反算：Pd=20W、Rjc=0.8、Rcs=0.4、Ta=50℃、目标 Tj=125℃ → Rsa_max = 3.75 − 1.2 = <span class="text-foreground font-medium">2.55℃/W</span>
            </button>
          </div>
        </div>

        <!-- 免责声明 -->
        <div class="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            本工具按一维热阻串联模型快速估算，未计入辐射散热、邻近热源、PCB 铺铜并联散热与接触面平整度等实际因素。关键设计请以器件数据手册热特性与实测温升为准。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>散热热阻计算器原理与用法</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <h3 class="text-lg font-semibold text-foreground">热阻串联模型</h3>
          <p>
            热量从结（Junction）流向环境（Ambient）要依次经过「结→壳→界面材料→散热器→环境」，每一段都有热阻，串联相加：Tj = Ta + Pd × (Rjc + Rcs + Rsa)。它与欧姆定律完全同构——功耗 Pd 相当于电流，温差相当于电压，热阻相当于电阻，因此各段温升就是 Pd × R：结-壳温升 Pd×Rjc、界面温升 Pd×Rcs、散热器温升 Pd×Rsa。本计算器上方的热阻链示意图即按此逐段标注。
          </p>
          <h3 class="text-lg font-semibold text-foreground">θJA 与 θJC 的区别</h3>
          <p>
            θJA 是「无散热器、标准测试板」下结到环境的全链路热阻，只适合自然散热、不装散热器时的粗估：Tj ≈ Ta + Pd × θJA（如 TO-220 裸装约 50~60℃/W）。一旦装散热器，芯片到环境的路径被散热器并联改写，θJA 不再适用，必须改用 θJC + Rcs + Rsa 的串联链来算——这正是本工具的模型。θJC 只描述结到封装壳这一段，与外部散热条件无关，所以它是散热器设计中的固定输入。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么按 125℃ 设计</h3>
          <p>
            通用硅器件的结温绝对上限多为 150~175℃（以数据手册为准），但这是"不损坏"的边界而非"可长期工作"的点。结温越高，漏电越大、老化越快、寿命越短，且机箱内夏季环境温度可能远高于常温。工程惯例按 Tj ≤ 125℃ 设计，相当于预留 25℃ 以上裕量；本工具的判定档位即按 125℃ / 150℃ 两道线划分。
          </p>
          <h3 class="text-lg font-semibold text-foreground">导热硅脂厚度的影响</h3>
          <p>
            界面热阻 Rcs ≈ t / (k × A)，即涂层越薄、导热率 k 越高、接触面积 A 越大，Rcs 越小。薄而均匀的 0.02~0.1mm 硅脂膜对应典型 0.2~0.5℃/W；涂得过厚反而把低导热的油脂变成了主要热阻，效果退化到接近干接触（0.5~1℃/W）。目标是刚好填满金属表面的微观凹坑，而不是越厚越保险。
          </p>
          <h3 class="text-lg font-semibold text-foreground">风冷降 Rsa 有多狠</h3>
          <p>
            同一只型材散热器，自然对流下 Rsa 通常 2~6℃/W；加风扇形成 1~2 m/s 的强迫风冷后可降到 0.5~1℃/W 量级，即热阻降低约 2~5 倍。因此当反算出的 Rsa_max &lt; 1℃/W 时，靠"更大的自然对流散热器"往往不现实，直接上风扇是更小、更便宜的解；继续往下走是水冷（可低于 0.2℃/W）。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">θJA 能用来算带散热器的结温吗？</span>不能。θJA 已把壳到空气的路径固定在"无散热器"工况，装散热器后必须用 θJC + Rcs + Rsa 重新串联，否则结果会严重偏保守或失真。</li>
            <li><span class="text-foreground font-medium">结温限值看 150℃ 还是 175℃？</span>以所用电体数据手册的绝对最大结温为准（通用硅常见 150 或 175℃），但设计目标仍建议 ≤125℃，把上限当红线而非工作点。</li>
            <li><span class="text-foreground font-medium">硅脂是不是涂得越多越好？</span>不是。Rcs ≈ 厚度/(导热率×面积)，厚涂层反而增大热阻；薄而均匀、刚好填满微观空隙最佳。</li>
            <li><span class="text-foreground font-medium">反算出 Rsa_max &lt; 1℃/W 怎么办？</span>自然对流散热器已到极限：改风扇强迫风冷（热阻可降 2~5 倍）、水冷，或从源头降功耗/并联器件分摊热流。</li>
          </ul>
          <p class="text-xs pt-2 border-t border-border/50">Rjc 等参数以器件数据手册为准，本工具为快速估算。</p>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'heatsink-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Thermometer, Calculator, Gauge, Cpu, FlaskConical, AlertTriangle, Clipboard, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '散热热阻计算器 - 结温/散热器选型在线计算器 | Util工具箱',
  description: '在线散热热阻计算器：按 Tj = Ta + Pd×(Rjc+Rcs+Rsa) 正算结温与各段温升，反算散热器热阻上限 Rsa_max 并给出选型档位提示，热阻链可视化，判定结温安全档，纯本地计算',
  keywords: '散热热阻计算器, 结温计算, 热阻计算, 散热器选型, Rsa, θJC, Tj 结温, 导热硅脂热阻, 风冷散热, 功率器件散热, MOS管散热计算',
  author: 'Util工具箱',
  ogTitle: '散热热阻计算器 - 结温/散热器选型在线计算器',
  ogDescription: '功率器件结温正反算、散热器热阻上限求解与热阻链可视化',
  ogUrl: 'https://www.util.cn/tools/heatsink-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
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
          name: '散热热阻计算器',
          url: 'https://www.util.cn/tools/heatsink-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['结温正算 Tj', '散热器热阻反算 Rsa_max', '各段温升分解', '热阻链可视化', '结温安全判定', '典型封装 θJC 参考']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '散热热阻计算器', item: 'https://www.util.cn/tools/heatsink-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'θJA 和 θJC 有什么区别？什么时候用哪个？',
              acceptedAnswer: { '@type': 'Answer', text: 'θJA 是无散热器时结到环境的全链热阻，只适合自然散热粗估；带散热器必须用 θJC + Rcs + Rsa 串联计算，因为散热器改写了壳到环境的路径。' }
            },
            {
              '@type': 'Question',
              name: '结温按多少设计才安全？',
              acceptedAnswer: { '@type': 'Answer', text: '通用硅器件绝对上限 150~175℃（以手册为准），但那是损坏边界；工程上按 Tj ≤ 125℃ 设计，预留降额与寿命裕量。' }
            },
            {
              '@type': 'Question',
              name: '导热硅脂是不是涂得越多越好？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。界面热阻约等于厚度除以（导热率×面积），涂层过厚反而增大热阻；薄而均匀、刚好填满微观空隙最佳，典型 0.2~0.5℃/W。' }
            },
            {
              '@type': 'Question',
              name: '反算出的散热器热阻小于 1℃/W 怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '自然对流已到极限，应改用风扇强迫风冷（散热器热阻可降 2~5 倍）或水冷，也可从源头降低功耗或并联器件分摊热流。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'heatsink-calculator'
const STORE_KEY = TOOL_ID + ':inputs'
const tool = tools.find(t => t.id === TOOL_ID)

// ---------- 状态 ----------
const mode = ref('forward') // forward 正算 / reverse 反算
const pd = ref(10)
const rjc = ref(1.5)
const rcsPreset = ref('grease')
const rcsCustom = ref(0.3)
const taVal = ref(40)
const rsa = ref(2.5)
const targetTj = ref(125)

// 交互记录与输入持久化（SSR 安全：localStorage 仅在客户端执行）
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_KEY) : null
    if (raw) {
      const s = JSON.parse(raw)
      if (typeof s.pd === 'number') pd.value = s.pd
      if (typeof s.rjc === 'number') rjc.value = s.rjc
      if (typeof s.rcsPreset === 'string') rcsPreset.value = s.rcsPreset
      if (typeof s.rcsCustom === 'number') rcsCustom.value = s.rcsCustom
      if (typeof s.ta === 'number') taVal.value = s.ta
      if (typeof s.rsa === 'number') rsa.value = s.rsa
      if (typeof s.targetTj === 'number') targetTj.value = s.targetTj
    }
  } catch (e) { /* 忽略恢复失败 */ }
})

const persist = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      pd: pd.value, rjc: rjc.value, rcsPreset: rcsPreset.value, rcsCustom: rcsCustom.value,
      ta: taVal.value, rsa: rsa.value, targetTj: targetTj.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}
watch([pd, rjc, rcsPreset, rcsCustom, taVal, rsa, targetTj], persist)

const rjcPresets = [
  { name: 'TO-220', value: 1.5, hint: '1.5~4 ℃/W' },
  { name: 'TO-247', value: 0.8, hint: '0.7~1 ℃/W' },
  { name: 'DFN/QFN', value: 8, hint: '5~40 ℃/W，按手册' }
]

const rcsOptions = [
  { key: 'grease', label: '导热硅脂（0.2~0.5，典型 0.4）', value: 0.4 },
  { key: 'pad', label: '导热垫（0.5~2，典型 1.0）', value: 1.0 },
  { key: 'dry', label: '干接触（0.5~1，典型 0.8）', value: 0.8 },
  { key: 'custom', label: '自定义…', value: null }
]

const rcsMap = {}
for (const o of rcsOptions) if (o.value !== null) rcsMap[o.key] = o.value

const num = (v) => (typeof v === 'number' && isFinite(v) ? v : NaN)

const rcsEff = computed(() => (rcsPreset.value === 'custom' ? num(rcsCustom.value) : rcsMap[rcsPreset.value]))

// ---------- 数字格式化（避免浮点尾差，如 84.00000000000001 → 84） ----------
const fmt = (v, digits = 2) => {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  return Number(v.toFixed(digits)).toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

// ---------- 判定档 ----------
const judge = (tj) => {
  if (tj < 125) {
    return {
      label: '保守安全',
      cls: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10',
      note: '低于 125℃，留有裕量，长寿命与降额设计的推荐区间。'
    }
  }
  if (tj <= 150) {
    return {
      label: '可用但需降额',
      cls: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-500/10',
      note: '已进入降额区，请按数据手册降额曲线核实，并评估最高环境温度工况。'
    }
  }
  return {
    label: '不可（超通用硅上限）',
    cls: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
    note: '超过通用硅 150~175℃ 上限（以手册为准），必须加大散热或降低功耗。'
  }
}

const sinkTier = (r) => {
  if (!(r > 0)) {
    return { label: '无法达成', text: '目标结温不高于环境温度或壳侧热阻已超预算，仅靠散热器无解：需降低功耗、降低环境温度、并联器件或改液冷。' }
  }
  if (r < 1) {
    return { label: '需风扇强迫风冷', text: 'Rsa < 1℃/W 已超出自然对流极限，需风扇强迫风冷（风冷可将散热器热阻降 2~5 倍），极限工况考虑水冷。' }
  }
  if (r < 2) {
    return { label: '叉指型 / 大体积型材', text: 'Rsa < 2℃/W 需叉指型散热器或大体积高密度型材，注意竖直安装方向与自然对流通道，勿被外壳阻挡。' }
  }
  if (r < 4) {
    return { label: '常见型材散热器', text: '常见铝挤压型材散热器即可满足，按安装空间与重量选型，接触面平整度照常处理。' }
  }
  return { label: '普通板式 / 小翼片', text: '普通板式或小翼片散热器即可满足，自然对流工况下注意散热器肋片竖直放置。' }
}

// ---------- 正算 ----------
const fwd = computed(() => {
  const p = num(pd.value), rj = num(rjc.value), rc = num(rcsEff.value), rs = num(rsa.value), ta = num(taVal.value)
  if (!(p > 0) || !(rj >= 0) || !(rc >= 0) || !(rs >= 0) || !isFinite(ta)) return null
  const dtJc = p * rj
  const dtCs = p * rc
  const dtSa = p * rs
  const tj = ta + dtJc + dtCs + dtSa
  return {
    tj, tc: ta + dtCs + dtSa, ts: ta + dtSa, dtJc, dtCs, dtSa,
    total: rj + rc + rs,
    tier: judge(tj)
  }
})

// ---------- 反算 ----------
const rev = computed(() => {
  const p = num(pd.value), rj = num(rjc.value), rc = num(rcsEff.value), ta = num(taVal.value), tjT = num(targetTj.value)
  if (!(p > 0) || !(rj >= 0) || !(rc >= 0) || !isFinite(ta) || !isFinite(tjT)) return null
  const rsaMax = (tjT - ta) / p - rj - rc
  return { rsaMax, ok: rsaMax > 0, rec: rsaMax > 0 ? rsaMax * 0.8 : null, hint: sinkTier(rsaMax) }
})

// ---------- 热阻链可视化数据 ----------
const chainRsa = computed(() => {
  if (mode.value === 'reverse' && rev.value && rev.value.ok) return rev.value.rsaMax
  const rs = num(rsa.value)
  return rs >= 0 && isFinite(rs) ? rs : 0
})

const chain = computed(() => {
  const p = Math.max(num(pd.value) || 0, 0)
  const rj = Math.max(num(rjc.value) || 0, 0)
  const rc = Math.max(num(rcsEff.value) || 0, 0)
  const rs = Math.max(chainRsa.value, 0)
  const ta = isFinite(num(taVal.value)) ? num(taVal.value) : 25
  const dtJc = p * rj, dtCs = p * rc, dtSa = p * rs
  return {
    rjc: rj, rcs: rc, rsa: rs, dtJc, dtCs, dtSa, ta,
    tj: ta + dtJc + dtCs + dtSa,
    tc: ta + dtCs + dtSa,
    ts: ta + dtSa,
    span: dtJc + dtCs + dtSa
  }
})

const chainBoxes = computed(() => {
  const c = chain.value
  return [
    { name: '结 Tj', temp: fmt(c.tj, 1) + '℃', x: 12, textCls: 'text-red-600 dark:text-red-400' },
    { name: '壳 Tc', temp: fmt(c.tc, 1) + '℃', x: 150, textCls: 'text-orange-600 dark:text-orange-400' },
    { name: '界面材料', temp: '≈' + fmt(c.ts, 1) + '℃', x: 288, textCls: 'text-amber-600 dark:text-amber-400' },
    { name: '散热器 Ts', temp: fmt(c.ts, 1) + '℃', x: 426, textCls: 'text-sky-600 dark:text-sky-400' },
    { name: '环境 Ta', temp: fmt(c.ta, 1) + '℃', x: 564, textCls: 'text-blue-600 dark:text-blue-400' }
  ]
})

const axisTicks = computed(() => {
  const c = chain.value
  const marks = [
    { label: 'Ta ' + fmt(c.ta, 1) + '℃', v: c.ta },
    { label: 'Ts ' + fmt(c.ts, 1) + '℃', v: c.ts },
    { label: 'Tc ' + fmt(c.tc, 1) + '℃', v: c.tc },
    { label: 'Tj ' + fmt(c.tj, 1) + '℃', v: c.tj }
  ]
  const x0 = 30, x1 = 650
  return marks.map((m, i) => ({
    ...m,
    x: c.span > 0.01 ? x0 + (x1 - x0) * (m.v - c.ta) / c.span : x0 + (x1 - x0) * i / 3
  }))
})

// ---------- 交互 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const loadExample = (m) => {
  mode.value = m
  if (m === 'forward') {
    pd.value = 10; rjc.value = 1.5; rcsPreset.value = 'grease'; taVal.value = 40; rsa.value = 2.5
  } else {
    pd.value = 20; rjc.value = 0.8; rcsPreset.value = 'grease'; taVal.value = 50; targetTj.value = 125
  }
}

const copyResult = async () => {
  const lines = []
  lines.push('【散热热阻计算】')
  lines.push('Pd=' + fmt(pd.value, 1) + 'W, Rjc=' + fmt(rjc.value, 2) + ', Rcs=' + fmt(rcsEff.value, 2) + ', Ta=' + fmt(taVal.value, 1) + '℃')
  if (mode.value === 'forward') {
    if (!fwd.value) { alert('当前输入不完整，无法复制'); return }
    lines.push('正算结果：Tj=' + fmt(fwd.value.tj, 1) + '℃（' + fwd.value.tier.label + '）')
    lines.push('温升：结-壳 +' + fmt(fwd.value.dtJc, 1) + '℃, 界面 +' + fmt(fwd.value.dtCs, 1) + '℃, 散热器 +' + fmt(fwd.value.dtSa, 1) + '℃')
    lines.push('Tc=' + fmt(fwd.value.tc, 1) + '℃, Ts=' + fmt(fwd.value.ts, 1) + '℃')
  } else {
    if (!rev.value) { alert('当前输入不完整，无法复制'); return }
    if (rev.value.ok) {
      lines.push('反算结果：散热器热阻需小于 Rsa_max=' + fmt(rev.value.rsaMax, 2) + '℃/W（建议留 20% 裕量取 ' + fmt(rev.value.rec, 2) + '）')
      lines.push('档位提示：' + rev.value.hint.label)
    } else {
      lines.push('反算结果：Rsa_max=' + fmt(rev.value.rsaMax, 2) + '℃/W ≤ 0，仅靠散热器无解')
    }
  }
  lines.push('—— 来自 Util工具箱·散热热阻计算器')
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    alert('已复制到剪贴板')
  } catch (e) {
    alert('复制失败，请手动选择文本复制')
  }
}
</script>
