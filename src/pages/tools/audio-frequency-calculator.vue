<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Waves class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">音频频率波长计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按环境温度算声速，频率 ↔ 波长互算，波长 / 半波长 / 四分之一波长、周期 ms、1/3 倍频带中心频、MIDI 音名与音分偏差一站输出</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线音频频率波长换算工具：面向音响工程、调音、乐器 DIY 与低音炮选型场景。输入频率即时得到声速修正后的波长 λ=c/f、半波长、四分之一波长（倒相管 / 低频陷阱厚度）、周期毫秒数、
        最近 ISO 1/3 倍频带中心频率与 A4=440 基准下的 MIDI 音名和音分偏差；反向可由波长（m/cm）求频率，并附倒相孔亥姆霍兹调谐与房间轴向驻波基频速算。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左列：输入面板 -->
      <div class="space-y-6">
        <!-- 温度与声速 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 环境温度与声速
          </h2>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">环境温度（℃）</label>
            <input
              v-model="tempInput"
              type="text"
              inputmode="decimal"
              placeholder="如 20 或 -5"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div class="bg-primary/10 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">当前声速 c = 331.3 + 0.606·T</p>
            <p class="text-2xl font-bold text-primary font-mono">{{ soundSpeed.toFixed(2) }}<span class="text-sm font-normal text-muted-foreground ml-1">m/s</span></p>
            <p class="text-xs text-muted-foreground mt-1">{{ tempC === 20 ? '标准室温口径（约 343 m/s）' : `按 ${tempC}℃ 修正` }}</p>
          </div>
          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>湿度对声速影响 &lt;1%，已忽略。参考：0℃→331.3、20℃→343.4、35℃→352.5 m/s。</span>
          </p>
        </div>

        <!-- 正向：频率输入 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Waves class="w-5 h-5 mr-2 text-primary" /> 频率 → 波长（正向）
          </h2>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">频率（Hz，1–20000，支持 1e3 科学计数）</label>
            <div class="relative">
              <input
                v-model="freqInput"
                type="text"
                inputmode="decimal"
                placeholder="如 440 或 1e3"
                class="w-full px-3 py-2 pr-12 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Hz</span>
            </div>
          </div>
          <div>
            <p class="text-xs text-muted-foreground mb-2">波段快选</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="chip in bandChips"
                :key="chip.id"
                @click="applyBand(chip)"
                class="px-2.5 py-1 rounded-full border text-xs font-medium transition"
                :class="freqInput === chip.value ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:bg-muted'"
              >
                {{ chip.label }}
              </button>
            </div>
          </div>
          <p
            v-if="!freqValid"
            class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5"
          >
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ freqMsg }}</span>
          </p>
          <p v-else class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
            <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ freqHint }}</span>
          </p>
          <div>
            <p class="text-xs text-muted-foreground mb-2">快速预设</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in presets"
                :key="preset.id"
                @click="applyPreset(preset)"
                class="px-2.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition"
              >
                <Play class="w-3 h-3 inline mr-1 -mt-0.5 text-primary" />{{ preset.label }}
              </button>
              <button
                @click="resetAll"
                class="px-2.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition"
              >
                <RefreshCw class="w-3 h-3 inline mr-1 -mt-0.5" />重置
              </button>
            </div>
          </div>
        </div>

        <!-- 反向：波长输入 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 波长 → 频率（反向）
          </h2>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">波长</label>
            <div class="flex gap-2">
              <input
                v-model="revInput"
                type="text"
                inputmode="decimal"
                placeholder="如 1 或 34.3"
                class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                @click="toggleRevUnit"
                class="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center"
                aria-label="切换米/厘米单位"
              >
                <ArrowLeftRight class="w-4 h-4 mr-1.5 text-primary" />{{ revUnit }}
              </button>
            </div>
          </div>
          <div class="bg-primary/10 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">对应频率 f = c ÷ λ</p>
            <p class="text-2xl font-bold text-primary font-mono">{{ revFreqText }}</p>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            典型尺寸参考（{{ tempC }}℃）：1 m ↔ {{ hzText(frequencyOfWavelength(1, soundSpeed)) }}，10 cm ↔ {{ hzText(frequencyOfWavelength(0.1, soundSpeed)) }}，1 cm ↔ {{ hzText(frequencyOfWavelength(0.01, soundSpeed)) }}。
          </p>
        </div>
      </div>

      <!-- 右列：结果与图解（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <!-- SVG 波形图解 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Waves class="w-5 h-5 mr-2 text-primary" /> 波形示意（λ/2 与 λ/4 标注）
          </h2>
          <div class="bg-muted/40 rounded-lg border border-border p-2">
            <svg viewBox="0 0 600 160" class="w-full h-auto block" role="img" aria-label="正弦波按当前频率等比压缩或拉伸的示意图">
              <line x1="0" y1="80" x2="600" y2="80" class="stroke-border" stroke-width="1" />
              <path :d="wavePath" fill="none" stroke="currentColor" stroke-width="2.5" class="text-primary" />
              <line :x1="waveGeom.q" y1="24" :x2="waveGeom.q" y2="136" class="stroke-border" stroke-width="1.5" stroke-dasharray="4 3" />
              <line :x1="waveGeom.h" y1="24" :x2="waveGeom.h" y2="136" class="stroke-border" stroke-width="1.5" stroke-dasharray="4 3" />
              <line :x1="waveGeom.l" y1="24" :x2="waveGeom.l" y2="136" class="stroke-border" stroke-width="1.5" stroke-dasharray="4 3" />
              <text :x="waveGeom.q" y="18" class="fill-current text-muted-foreground" font-size="12" text-anchor="middle">λ/4</text>
              <text :x="waveGeom.h" y="18" class="fill-current text-muted-foreground" font-size="12" text-anchor="middle">λ/2</text>
              <text :x="waveGeom.l" y="18" class="fill-current text-muted-foreground" font-size="12" text-anchor="middle">λ</text>
            </svg>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            示意图按 {{ waveCycles }} 个波长等比铺满 600px 视场：频率越高波形越密（波峰间距 = λ = {{ calc ? formatWavelengthText(calc.lambda) : '—' }}）。虚线标出一个周期内的四分之一、半与全波长位置；实际波形随时间传播，此处为某一时刻的静态切片。
          </p>
        </div>

        <!-- 六卡结果 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 计算结果（{{ freqInput || '—' }} Hz 全参数）
          </h2>
          <div v-if="calc" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div class="bg-muted/40 border border-border rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">波长 λ = c ÷ f</p>
              <p class="text-lg font-bold text-foreground font-mono">{{ formatWavelengthText(calc.lambda) }}</p>
              <p class="text-[10px] text-muted-foreground mt-1">一个完整周期的空间长度</p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">半波长 λ/2</p>
              <p class="text-lg font-bold text-foreground font-mono">{{ formatWavelengthText(calc.half) }}</p>
              <p class="text-[10px] text-muted-foreground mt-1">驻波相邻波节间距</p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">四分之一波长 λ/4</p>
              <p class="text-lg font-bold text-foreground font-mono">{{ formatWavelengthText(calc.quarter) }}</p>
              <p class="text-[10px] text-muted-foreground mt-1">低频陷阱 / 吸音板厚度、四分之一波长共振管口径</p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">周期 T = 1000 ÷ f</p>
              <p class="text-lg font-bold text-foreground font-mono">{{ calc.periodMs.toFixed(calc.periodMs >= 100 ? 1 : 3) }}<span class="text-xs font-normal text-muted-foreground ml-0.5">ms</span></p>
              <p class="text-[10px] text-muted-foreground mt-1">一次完整振动耗时</p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">1/3 倍频带中心频</p>
              <p class="text-lg font-bold text-foreground font-mono">{{ calc.third ? calc.third + ' Hz' : '—' }}</p>
              <p class="text-[10px] text-muted-foreground mt-1">{{ calc.third ? 'ISO 标准中心频率（所属带）' : '超出 20–20000 Hz 标准带' }}</p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">音名 / MIDI（A4=440）</p>
              <p v-if="calc.note && !calc.hint" class="text-lg font-bold text-foreground font-mono">{{ calc.note.letter }}{{ calc.note.octave }}<span class="text-xs font-normal text-muted-foreground ml-1">/ {{ calc.note.alias }}{{ calc.note.octave }}</span></p>
              <p v-else class="text-lg font-bold text-foreground">{{ calc.hint || '—' }}</p>
              <p v-if="calc.note && !calc.hint" class="text-[10px] text-muted-foreground mt-1">偏差 {{ signed(calc.note.cents, 1) }} 音分（MIDI {{ calc.note.midi }}）</p>
              <p v-else-if="calc.hint" class="text-[10px] text-muted-foreground mt-1">该频率不做音高判定</p>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground flex items-start gap-1.5 py-4">
            <TriangleAlert class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{{ freqMsg }}。修正后可查看波长、半波长、四分之一波长、周期、1/3 倍频带与音名六项参数。</span>
          </p>
        </div>

        <!-- 箱体 / 房间速算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 箱体 / 房间速算
          </h2>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-foreground">倒相孔调谐（亥姆霍兹共振）</h3>
            <p class="text-xs text-muted-foreground font-mono bg-muted/60 rounded px-2 py-1.5">f_b = c ÷ 2π × √( A ÷ (V · L) )</p>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-[10px] text-muted-foreground mb-1">端口面积 A（cm²）</label>
                <input v-model="portAreaInput" type="text" inputmode="decimal" class="w-full min-w-0 px-2 py-1.5 bg-background border border-border rounded text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label class="block text-[10px] text-muted-foreground mb-1">箱体容积 V（L）</label>
                <input v-model="boxVolumeInput" type="text" inputmode="decimal" class="w-full min-w-0 px-2 py-1.5 bg-background border border-border rounded text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label class="block text-[10px] text-muted-foreground mb-1">端口净长 L（cm）</label>
                <input v-model="portLengthInput" type="text" inputmode="decimal" class="w-full min-w-0 px-2 py-1.5 bg-background border border-border rounded text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs text-muted-foreground">调谐频率 f_b ≈</span>
              <span class="text-lg font-bold text-primary font-mono">{{ portTuning ? portTuning.toFixed(1) + ' Hz' : '—' }}</span>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              口径说明：经验公式按净长 L 计算，省略端口两端的空气柱末端修正（每端约 0.6~0.85 倍端口半径），实测调谐频率通常略低于此值；箱体净容积以吸音棉填充后折算。例：30 cm² 端口 + 20 L 箱体 + 15 cm 管长 ≈ 54.7 Hz（{{ tempC }}℃）。
            </p>
          </div>

          <div class="border-t border-border pt-4 space-y-3">
            <h3 class="text-sm font-semibold text-foreground">房间轴向驻波基频</h3>
            <p class="text-xs text-muted-foreground font-mono bg-muted/60 rounded px-2 py-1.5">f₁ = c ÷ 2L（两墙面之间恰为半波长）</p>
            <div class="grid grid-cols-2 gap-2 items-end">
              <div>
                <label class="block text-[10px] text-muted-foreground mb-1">房间边长 L（m）</label>
                <input v-model="roomLengthInput" type="text" inputmode="decimal" class="w-full px-2 py-1.5 bg-background border border-border rounded text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <p class="text-xs text-muted-foreground">基频 f₁ = <span class="font-mono font-bold text-foreground">{{ roomModes ? roomModes[0].toFixed(1) + ' Hz' : '—' }}</span></p>
            </div>
            <div v-if="roomModes" class="flex flex-wrap gap-2">
              <span
                v-for="(mode, i) in roomModes"
                :key="'mode-' + (i + 1)"
                class="px-2.5 py-1 rounded-full border border-border bg-muted/50 text-xs font-mono text-foreground"
              >
                {{ i + 1 }} 阶 {{ mode.toFixed(1) }} Hz
              </span>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              例：长 5 m 的房间轴向驻波基频约 {{ tempC === 20 ? '34.3' : roomModes ? roomModes[0].toFixed(1) : '—' }} Hz，倍频依次叠加；低频陷阱宜摆在波节最强的墙角，厚度参考上方 λ/4。
            </p>
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
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>音频频率波长计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款面向音响工程、调音师、乐器 DIY 与低音炮玩家的在线声学换算工具。它以 <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">c = 331.3 + 0.606·T</code> 按环境温度修正声速，
          再由 <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">λ = c ÷ f</code> 输出波长、半波长、四分之一波长、周期毫秒数、最近 ISO 1/3 倍频带中心频与 A4=440 基准下的 MIDI 音名与音分偏差；
          反向输入波长（米或厘米）即可求频率。页面还内置倒相孔亥姆霍兹调谐与房间轴向驻波基频两张速算卡，全部在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">波长与频率的换算公式</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>声速随温度变化：<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">c = 331.3 + 0.606 × T(℃)</code> m/s，20℃ 时约 343.42 m/s。</li>
          <li>波长 <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">λ = c ÷ f</code>；周期 <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">T = 1000 ÷ f</code> ms。</li>
          <li>直观口径：20℃ 下 1 米波长对应约 343 Hz，1 厘米对应约 34.3 kHz。</li>
          <li>湿度对声速影响小于 1%，一般工程估算可忽略。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么低音炮这么占空间？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          波长决定声音如何与墙面、箱体等障碍物相互作用。50 Hz 声音在 20℃ 空气中波长约 6.9 m，30 Hz 约 11.4 m——与房间尺度同量级，因此低频轻易衍射绕过障板、沿墙面耦合到整间屋子，
          难以用薄吸音板控制；要有效辐射或吸收低频，扬声器冲程、箱体容积与吸音层厚度都必须往波长尺度上靠，这正是低音炮体积大、低频陷阱做得厚的根本原因。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">倒相孔与吸音板为什么按 1/4 波长算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          声波碰到刚性闭端反射后往返多走半个波长、相位反转。厚 λ/4 的多孔吸音层背后留空腔时，入射与反射声波在板面叠加形成质点速度最大值，吸收效率在该频率最高，所以低频陷阱厚度常按目标频率的四分之一波长估算（严格按 λ/4，30 Hz 需要近 2.9 m 厚，实践中以空腔深度与膜共振等效补偿）。
          倒相孔（亥姆霍兹共振器）同理利用管内空气柱与箱体弹簧的共振，本工具给的调谐公式 <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">f_b = c/2π·√(A/(V·L))</code> 按净长 L 计算，省略每端约 0.6~0.85 倍半径的末端修正，实调频率略低。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">房间驻波基频怎么算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两个平行墙面之间形成驻波的条件是腔长恰为半波长的整数倍，故某一边长 L 对应的轴向基频为 <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">f₁ = c ÷ 2L</code>。
          长 5 m 的房间 20℃ 下基频约 34.3 Hz，二阶 68.7 Hz、三阶 103 Hz 依次叠加。驻波造成某些低频被房间「放大」或「抵消」，摆位与低频陷阱布局都应先算这几个频率。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">音高与频率对照（A4=440）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本工具以 A4=440 Hz 为基准（1939 年伦敦会议建议、1955 年由 ISO 16 确认为国际标准），按十二平均律 <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">n = 69 + 12·log₂(f/440)</code> 取最近半音（MIDI 音号），
          剩余偏差以音分（1 半音 = 100 音分）显示。440 Hz 即 A4 ±0 音分；415 Hz 距 G#4/A♭4 仅约 −1.3 音分，听感上就是低一个半音的「巴洛克音高」近似。低于 20 Hz 标为次声波，高于 20 kHz 标为超声波，不做音高判定。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">声音波长怎么计算？和光波一样吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">同样用 λ = c ÷ f，但声速 c 取空气中约 343 m/s（20℃，随温度按 331.3 + 0.606·T 修正），比光速小六个数量级，所以可听声波长从 17 mm（20 kHz）一直延伸到 17 m（20 Hz），与房间、箱体同尺度——这正是声学换算必须带温度的原因。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">倒相孔调谐频率怎么估算？</h3>
            <p class="text-sm text-muted-foreground mt-1">用亥姆霍兹经验公式 f_b = c/2π × √(A ÷ (V·L))：A 为端口截面积、V 为箱体净容积、L 为端口净长。例如 30 cm² 端口、20 L 箱体、15 cm 管长在 20℃ 下调谐约 54.7 Hz。公式省略端口两端各约 0.6~0.85 倍半径的末端空气柱，实际调谐略低，可在成品上用扫频微调。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">房间驻波基频是什么？影响多大？</h3>
            <p class="text-sm text-muted-foreground mt-1">轴向驻波基频 f₁ = c ÷ 2L，L 为某一边长。5 m 的房间基频约 34 Hz，其整数倍频依次出现。基频及低阶倍频处声压沿房间大幅起伏，直接影响混音判断与低音炮摆位，一般优先用墙角低频陷阱（厚度参考 λ/4）处理。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。声速修正、波长换算、音名判定与箱体驻波速算全部在你的浏览器中即时完成，不发送任何网络请求，刷新页面即恢复默认输入。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'audio-frequency-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Waves, Ruler, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, ArrowLeftRight
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '音频频率波长计算器 - 声音波长/周期/四分之一波长/倒相孔调谐在线计算',
  description: '免费在线音频频率波长计算器：按环境温度修正声速，频率与波长互算，输出波长、半波长、四分之一波长、周期ms、1/3倍频带中心频与MIDI音名音分，附倒相孔调谐与房间驻波基频速算，纯浏览器本地运行不上传',
  keywords: '频率波长换算,声音波长计算器,Hz ms 周期,四分之一波长,低音炮箱体尺寸',
  author: '有条工具',
  ogTitle: '音频频率波长计算器 - 声音波长/周期/四分之一波长/倒相孔调谐在线计算 | 有条工具',
  ogDescription: '按温度算声速，频率↔波长互算，输出 λ、λ/2、λ/4、周期、1/3 倍频带与音名音分，附倒相孔与驻波速算。',
  ogUrl: 'https://www.util.cn/tools/audio-frequency-calculator',
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
          name: '音频频率波长计算器',
          url: 'https://www.util.cn/tools/audio-frequency-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['按环境温度修正声速', '频率↔波长互算（支持科学计数）', '波长/半波长/四分之一波长输出', '周期毫秒与1/3倍频带中心频', 'MIDI音名与音分偏差', '倒相孔亥姆霍兹调谐速算', '房间轴向驻波基频速算', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '音频频率波长计算器', item: 'https://www.util.cn/tools/audio-frequency-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '声音波长怎么计算？',
              acceptedAnswer: { '@type': 'Answer', text: '用 λ=c÷f，声速按环境温度修正 c=331.3+0.606·T（20℃约343.4m/s）。可听声波长从20Hz的约17m到20kHz的约17mm，与房间和箱体同尺度，因此声学估算必须带温度。' }
            },
            {
              '@type': 'Question',
              name: '倒相孔调谐频率怎么估算？',
              acceptedAnswer: { '@type': 'Answer', text: '用亥姆霍兹经验公式 f_b=c/2π×√(A÷(V·L))，A为端口面积、V为箱体净容积、L为端口净长。例如30cm²端口、20L箱体、15cm管长在20℃下约54.7Hz；公式省略每端约0.6~0.85倍半径的末端修正，实调频率略低。' }
            },
            {
              '@type': 'Question',
              name: '房间驻波基频是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '两平行墙面间腔长为半波长整数倍时形成轴向驻波，基频f₁=c÷2L。5m房间20℃下基频约34.3Hz，其倍频依次出现，直接影响低频听感均衡与低音炮摆位。' }
            },
            {
              '@type': 'Question',
              name: '计算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。声速修正、波长换算、音名判定与箱体驻波速算全部在浏览器本地即时完成，不发送任何网络请求，刷新页面即恢复默认。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const C0 = 331.3        // 0℃ 声速 m/s
const C_K = 0.606       // 每℃ 声速增量 m/s
const A4 = 440          // 音名基准
const NOTE_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTE_FLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']
// ISO 标准 1/3 倍频带中心频率（20 Hz – 20 kHz）
const THIRD_OCTAVE_CENTERS = [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000]

// 解析输入数字：空串/非法返回 null，支持 1e3 等科学计数
function parseNum(text) {
  const s = String(text ?? '').trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// 声速随温度修正：0℃→331.3、20℃→343.42、35℃→352.51
function soundSpeedOf(tCelsius) {
  const t = Number.isFinite(tCelsius) ? tCelsius : 20
  return C0 + C_K * t
}

// 波长 λ = c ÷ f（米）
function wavelengthOf(freqHz, c) {
  return freqHz > 0 && c > 0 ? c / freqHz : null
}

// 反向：由波长求频率 f = c ÷ λ
function frequencyOfWavelength(lambdaM, c) {
  return lambdaM > 0 && c > 0 ? c / lambdaM : null
}

// 周期（毫秒）T = 1000 ÷ f
function periodOfMs(freqHz) {
  return freqHz > 0 ? 1000 / freqHz : null
}

// 最近标准 1/3 倍频带中心频：按对数距离取所属带，超出标准带返回 null
function thirdOctaveOf(freqHz) {
  if (!Number.isFinite(freqHz) || freqHz < 20 || freqHz > 20000) return null
  let best = THIRD_OCTAVE_CENTERS[0]
  for (const center of THIRD_OCTAVE_CENTERS) {
    if (Math.abs(Math.log(freqHz / center)) < Math.abs(Math.log(freqHz / best))) best = center
  }
  return best
}

// A4=440 基准取最近半音：n = 69 + 12·log2(f/440)，四舍五入定音，小数×100 为音分
function noteOf(freqHz) {
  if (!Number.isFinite(freqHz) || freqHz <= 0) return null
  const n = 69 + 12 * Math.log2(freqHz / A4)
  const midi = Math.round(n)
  const cents = Math.round((n - midi) * 1000) / 10
  const idx = ((midi % 12) + 12) % 12
  return { midi, letter: NOTE_SHARP[idx], alias: NOTE_FLAT[idx], octave: Math.floor(midi / 12) - 1, cents }
}

// 可听域判定：<20Hz 次声波、>20kHz 超声波、之间返回 null
function audibilityHintOf(freqHz) {
  if (!Number.isFinite(freqHz)) return null
  if (freqHz < 20) return '低于可听域（次声波）'
  if (freqHz > 20000) return '超声波'
  return null
}

// 倒相孔亥姆霍兹调谐：f_b = c/(2π)·√(A/(V·L))，A 用 cm²、V 用 L、L 用 cm，省略端修正
function helmholtzTuningOf(areaCm2, volumeLiters, lengthCm, c) {
  const A = areaCm2 * 1e-4 // cm² → m²
  const V = volumeLiters * 1e-3 // L → m³
  const L = lengthCm * 1e-2 // cm → m
  if (!(A > 0 && V > 0 && L > 0 && c > 0)) return null
  return (c / (2 * Math.PI)) * Math.sqrt(A / (V * L))
}

// 房间轴向驻波：f₁ = c ÷ 2L，返回前 count 阶倍频
function roomModesOf(lengthM, c, count = 3) {
  if (!(lengthM > 0 && c > 0)) return null
  const f1 = c / (2 * lengthM)
  return Array.from({ length: count }, (_, i) => f1 * (i + 1))
}

// 波长智能格式化：≥10m 一位小数、≥1m 两位、≥1cm 用 cm、更短用 mm
function formatWavelengthText(m) {
  if (!Number.isFinite(m) || m <= 0) return '—'
  if (m >= 10) return `${m.toFixed(1)} m`
  if (m >= 1) return `${m.toFixed(2)} m`
  if (m >= 0.01) return `${(m * 100).toFixed(1)} cm`
  return `${(m * 1000).toFixed(1)} mm`
}

// 正弦波 SVG 路径：cycles 个波长铺满 width×height 视场（静态帧）
function sineWavePath(width, height, cycles) {
  const mid = height / 2
  const amp = height * 0.3
  const samples = Math.min(720, cycles * 40)
  let d = `M 0 ${mid.toFixed(1)}`
  for (let i = 1; i <= samples; i++) {
    const p = i / samples
    d += ` L ${(p * width).toFixed(1)} ${(mid - amp * Math.sin(p * cycles * Math.PI * 2)).toFixed(1)}`
  }
  return d
}

// 波形示意周期数：频率越高越密，1–24 夹取
function waveCyclesOf(freqHz) {
  if (!Number.isFinite(freqHz) || freqHz <= 0) return 3
  return Math.max(1, Math.min(24, Math.round(1 + 2 * Math.log2(freqHz / 20))))
}

// 频率展示文本：≥1kHz 用 kHz，否则保留一位小数
function hzText(n) {
  if (!Number.isFinite(n) || n <= 0) return '—'
  return n >= 1000 ? `${(n / 1000).toFixed(2)} kHz` : `${n.toFixed(1)} Hz`
}

// ---------- 常量与配置 ----------
const bandChips = [
  { id: 'sub', label: '次低频 30Hz', value: '30' },
  { id: 'bass', label: '低音 60Hz', value: '60' },
  { id: 'voice', label: '人声 200Hz', value: '200' },
  { id: 'gtr', label: '吉他 A4 440Hz', value: '440' },
  { id: 'mid', label: '中频 1kHz', value: '1000' },
  { id: 'cym', label: '镲片 8kHz', value: '8000' }
]

const presets = [
  { id: 'sub40', label: '40Hz 次低频', freq: '40', temp: '20' },
  { id: 'a440', label: 'A4 标准音 440', freq: '440', temp: '20' },
  { id: 'port', label: '倒相孔 30cm²/20L/15cm', freq: '440', temp: '20', portArea: '30', boxVolume: '20', portLength: '15' }
]

const DEFAULTS = { temp: '20', freq: '440', rev: '1', revUnit: 'm', portArea: '30', boxVolume: '20', portLength: '15', room: '5' }

// ---------- 页面状态 ----------
const tempInput = ref(DEFAULTS.temp)
const freqInput = ref(DEFAULTS.freq)
const revInput = ref(DEFAULTS.rev)
const revUnit = ref(DEFAULTS.revUnit)
const portAreaInput = ref(DEFAULTS.portArea)
const boxVolumeInput = ref(DEFAULTS.boxVolume)
const portLengthInput = ref(DEFAULTS.portLength)
const roomLengthInput = ref(DEFAULTS.room)
const seoContentVisible = ref(true)

const tempC = computed(() => {
  const t = parseNum(tempInput.value)
  return t === null ? 20 : Math.max(-60, Math.min(60, t))
})
const soundSpeed = computed(() => soundSpeedOf(tempC.value))

const freqNum = computed(() => parseNum(freqInput.value))
const freqValid = computed(() => freqNum.value !== null && freqNum.value >= 1 && freqNum.value <= 20000)
const freqMsg = computed(() => {
  if (freqNum.value === null) return '请输入有效数字（支持 1e3 等科学计数法）'
  return '频率需介于 1–20000 Hz 之间'
})
const freqHint = computed(() => {
  const hint = audibilityHintOf(freqNum.value)
  if (hint) return `当前频率 ${hint}，波长与周期照常计算，音高判定不适用。`
  return '频率在可听域内，六项参数见右侧结果卡。'
})

const calc = computed(() => {
  if (!freqValid.value) return null
  const f = freqNum.value
  const c = soundSpeed.value
  const lambda = wavelengthOf(f, c)
  return {
    f,
    lambda,
    half: lambda / 2,
    quarter: lambda / 4,
    periodMs: periodOfMs(f),
    third: thirdOctaveOf(f),
    note: noteOf(f),
    hint: audibilityHintOf(f)
  }
})

const revLenM = computed(() => {
  const n = parseNum(revInput.value)
  if (n === null || n <= 0) return null
  return revUnit.value === 'cm' ? n / 100 : n
})
const revFreq = computed(() => (revLenM.value === null ? null : frequencyOfWavelength(revLenM.value, soundSpeed.value)))
const revFreqText = computed(() => hzText(revFreq.value))

const portTuning = computed(() => {
  const a = parseNum(portAreaInput.value)
  const v = parseNum(boxVolumeInput.value)
  const l = parseNum(portLengthInput.value)
  if (a === null || v === null || l === null) return null
  return helmholtzTuningOf(a, v, l, soundSpeed.value)
})

const roomModes = computed(() => {
  const L = parseNum(roomLengthInput.value)
  if (L === null) return null
  return roomModesOf(L, soundSpeed.value, 3)
})

const waveCycles = computed(() => waveCyclesOf(freqValid.value ? freqNum.value : NaN))
const wavePath = computed(() => sineWavePath(600, 160, waveCycles.value))
const waveGeom = computed(() => {
  const one = 600 / waveCycles.value
  return { q: +(one / 4).toFixed(1), h: +(one / 2).toFixed(1), l: +one.toFixed(1) }
})

// ---------- 展示格式化 ----------
function signed(n, digits) {
  const v = Number(n).toFixed(digits)
  return n > 0 ? `+${v}` : v
}

// ---------- 交互处理 ----------
function applyBand(chip) {
  freqInput.value = chip.value
}
function applyPreset(p) {
  freqInput.value = p.freq
  tempInput.value = p.temp
  if (p.portArea) {
    portAreaInput.value = p.portArea
    boxVolumeInput.value = p.boxVolume
    portLengthInput.value = p.portLength
  }
}
function toggleRevUnit() {
  revUnit.value = revUnit.value === 'm' ? 'cm' : 'm'
}
function resetAll() {
  tempInput.value = DEFAULTS.temp
  freqInput.value = DEFAULTS.freq
  revInput.value = DEFAULTS.rev
  revUnit.value = DEFAULTS.revUnit
  portAreaInput.value = DEFAULTS.portArea
  boxVolumeInput.value = DEFAULTS.boxVolume
  portLengthInput.value = DEFAULTS.portLength
  roomLengthInput.value = DEFAULTS.room
}
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('audio-frequency-calculator')
})
</script>
