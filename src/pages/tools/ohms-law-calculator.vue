<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Activity class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">欧姆定律计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">U / I / R / P 四量互算，任意两个已知量求其余，含 LED 限流电阻与 E24 标准阻值选取</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线欧姆定律计算器：给出电压 U、电流 I、电阻 R、功率 P 中的任意两个量，工具立即用 P = U×I 与 U = I×R 联立求出另外两个，
        输入直接支持 mV / kV、mA / µA、kΩ / MΩ、mW / kW 等单位前缀（也认 2.2k、4k7 这类电子写法），结果自动挑选最易读的前缀显示。
        右侧魔轮图会高亮当前真正生效的两条公式，并给出代入过程与自检恒等式。另附 LED 限流电阻模块：按供电电压与 LED 压降算出理论阻值，
        再就近上档到 E24 标准系列，并给出电阻实际功耗与推荐功率档位。全部计算在你的浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：计算区 -->
      <div class="space-y-4">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <!-- 模式切换 -->
          <div class="flex gap-2">
            <button
              @click="mode = 'main'"
              :class="[
                'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5',
                mode === 'main' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >
              <Calculator class="w-4 h-4" /> 四量互算
            </button>
            <button
              @click="mode = 'led'"
              :class="[
                'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5',
                mode === 'led' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >
              <Lightbulb class="w-4 h-4" /> LED 限流
            </button>
          </div>

          <!-- 四量互算 -->
          <div v-if="mode === 'main'" class="space-y-4">
            <div>
              <h2 class="text-lg font-semibold flex items-center mb-2">
                <Zap class="w-5 h-5 mr-2 text-primary" /> 选择已知量
              </h2>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="p in pairDefs"
                  :key="p.key"
                  @click="selectPair(p.key)"
                  :class="[
                    'px-2 py-2 rounded-lg text-sm font-mono transition border',
                    pairKey === p.key
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                  ]"
                >
                  {{ p.label }}
                </button>
              </div>
              <p class="text-xs text-muted-foreground mt-2">{{ activePair.note }}</p>
            </div>

            <!-- 2×2 电参量卡片：两个已知量可填，其余两个自动求解 -->
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="q in quantityDefs"
                :key="q.key"
                class="rounded-lg border p-3 space-y-1.5"
                :class="isKnown(q.key) ? 'border-border bg-muted/40' : 'border-primary/40 bg-primary/5'"
              >
                <div class="flex items-center justify-between gap-1">
                  <span class="text-xs font-medium text-foreground whitespace-nowrap">{{ q.cn }}</span>
                  <span
                    class="text-[10px] px-1.5 py-0.5 rounded-full border whitespace-nowrap"
                    :class="isKnown(q.key)
                      ? 'bg-muted text-muted-foreground border-border'
                      : 'bg-primary/10 text-primary border-primary/20'"
                  >
                    {{ isKnown(q.key) ? '已知量' : '自动求解' }}
                  </span>
                </div>

                <template v-if="isKnown(q.key)">
                  <input
                    v-model="texts[q.key]"
                    type="text"
                    inputmode="decimal"
                    autocomplete="off"
                    spellcheck="false"
                    :placeholder="q.placeholder"
                    class="w-full px-2.5 py-2 rounded-md border border-border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                  <p
                    class="text-[10px] font-mono leading-tight"
                    :class="inputFoot(q.key).tone"
                  >{{ inputFoot(q.key).text }}</p>
                </template>

                <template v-else>
                  <p class="text-xl font-bold font-mono text-primary break-all leading-tight">{{ solvedText(q.key) }}</p>
                  <p class="text-[10px] font-mono text-muted-foreground break-all">{{ solvedBaseText(q.key) }}</p>
                </template>
              </div>
            </div>

            <!-- 求解状态 -->
            <p
              class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5"
              :class="solveState.class"
            >
              <component :is="solveState.icon" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ solveState.text }}</span>
            </p>

            <button
              @click="resetMain"
              class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 清空重填
            </button>
          </div>

          <!-- LED 限流电阻 -->
          <div v-else class="space-y-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Lightbulb class="w-5 h-5 mr-2 text-primary" /> LED 串联限流电阻
            </h2>

            <div>
              <label class="block text-sm font-medium mb-2 text-foreground">供电电压（V）</label>
              <div class="flex flex-wrap gap-2 mb-2">
                <button
                  v-for="s in supplyPresets"
                  :key="s"
                  @click="ledSupply = String(s)"
                  :class="[
                    'px-3 py-1.5 rounded-lg text-xs font-mono transition',
                    String(ledSupply) === String(s) ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  ]"
                >
                  {{ s }} V
                </button>
              </div>
              <input
                v-model="ledSupply"
                type="number"
                step="0.1"
                min="0"
                placeholder="可自定义，如 3.3 / 48"
                class="w-full px-3 py-2 rounded-md border border-border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-2 text-foreground">LED 颜色（决定正向压降 Vf）</label>
              <select
                v-model="ledColor"
                class="w-full px-3 py-2 rounded-md border border-border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option v-for="c in ledColorDefs" :key="c.id" :value="c.id">
                  {{ c.name }}（典型 Vf {{ c.vf }} V）
                </option>
              </select>
              <p class="text-xs text-muted-foreground mt-1">压降取的是常见指示 LED 标称值，实际以 datasheet 为准；大电流下 Vf 会上浮 0.2-0.5 V</p>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2 text-foreground">目标工作电流（mA）</label>
              <input
                v-model="ledCurrent"
                type="number"
                step="1"
                min="1"
                max="30"
                placeholder="默认 20"
                class="w-full px-3 py-2 rounded-md border border-border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
              <p class="text-xs text-muted-foreground mt-1">普通 3mm / 5mm 指示 LED 常用 5-20 mA，建议区间 1-30 mA</p>
            </div>

            <button
              @click="resetLed"
              class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复 5 V / 红 / 20 mA
            </button>
          </div>
        </div>

        <!-- 预设案例 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Play class="w-5 h-5 mr-2 text-primary" /> 一键载入典型案例
          </h2>
          <div class="space-y-2">
            <button
              v-for="p in presetDefs"
              :key="p.id"
              @click="applyPreset(p)"
              :class="[
                'w-full text-left px-3 py-2.5 rounded-lg border text-sm transition',
                activePresetId === p.id ? 'border-primary bg-primary/5' : 'border-border bg-muted/40 hover:bg-muted'
              ]"
            >
              <span class="font-medium text-foreground">{{ p.label }}</span>
              <span class="block text-xs text-muted-foreground mt-0.5">{{ p.summary }}</span>
            </button>
          </div>
          <p
            v-if="activePresetNote"
            class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5"
          >
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{{ activePresetNote }}</span>
          </p>
        </div>
      </div>

      <!-- 右侧：图解区（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 图解卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <template v-if="mode === 'main'">
            <h2 class="text-lg font-semibold flex items-center">
              <Zap class="w-5 h-5 mr-2 text-primary" /> UIRP 公式魔轮（当前组合的公式已高亮）
            </h2>
            <svg viewBox="0 0 400 400" class="w-full max-w-[420px] mx-auto" role="img" aria-label="欧姆定律四象限公式魔轮">
              <circle cx="200" cy="200" r="190" fill="none" class="stroke-border" stroke-width="2" />
              <line x1="12" y1="200" x2="388" y2="200" class="stroke-border" stroke-width="1.5" stroke-dasharray="4 4" />
              <line x1="200" y1="12" x2="200" y2="388" class="stroke-border" stroke-width="1.5" stroke-dasharray="4 4" />
              <circle cx="200" cy="200" r="46" class="fill-background stroke-border" stroke-width="1.5" />
              <text x="200" y="193" text-anchor="middle" font-size="10" class="fill-muted-foreground">欧姆定律</text>
              <text x="200" y="211" text-anchor="middle" font-size="12.5" font-weight="600" class="fill-primary">P = U × I</text>

              <g v-for="quad in wheelQuads" :key="quad.id">
                <rect
                  :x="quad.x - 58"
                  :y="quad.y - 40"
                  width="116"
                  height="80"
                  rx="10"
                  class="fill-card stroke-border"
                  stroke-width="1.5"
                />
                <text :x="quad.x" :y="quad.y - 27" text-anchor="middle" font-size="10.5" class="fill-muted-foreground">{{ quad.title }}</text>
                <g v-for="(f, idx) in quad.rows" :key="f.id">
                  <rect
                    :x="quad.x - 53"
                    :y="quad.y - 21 + idx * 19"
                    width="106"
                    height="18"
                    rx="4"
                    fill="currentColor"
                    class="text-primary"
                    :opacity="f.pair === pairKey ? 0.16 : 0"
                  />
                  <text
                    :x="quad.x"
                    :y="quad.y - 8 + idx * 19"
                    text-anchor="middle"
                    font-size="12.5"
                    :class="f.pair === pairKey ? 'fill-primary' : 'fill-foreground'"
                    :font-weight="f.pair === pairKey ? 700 : 400"
                  >{{ f.text }}</text>
                </g>
              </g>
            </svg>

            <div class="flex flex-wrap gap-2">
              <span
                v-for="f in activeFormulas"
                :key="f.id"
                class="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary"
              >{{ f.text }}</span>
              <span class="px-2.5 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground">
                其余 {{ wheelFormulaTotal - activeFormulas.length }} 条为等价变形，可交叉验算
              </span>
            </div>
          </template>

          <template v-else>
            <h2 class="text-lg font-semibold flex items-center">
              <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 限流电路示意（电源 → 电阻 → LED 串联）
            </h2>
            <svg viewBox="0 0 420 200" class="w-full max-w-[460px] mx-auto" role="img" aria-label="LED 串联限流电阻电路示意">
              <path
                :d="circuitWirePath"
                fill="none"
                class="stroke-foreground"
                stroke-width="2"
                stroke-opacity="0.6"
                stroke-linecap="round"
              />
              <polyline
                points="135,60 143,46 157,74 171,46 185,74 199,46 205,60"
                fill="none"
                class="stroke-primary"
                stroke-width="2.5"
              />
              <text x="170" y="32" text-anchor="middle" font-size="12" class="fill-primary" font-weight="600">R = {{ ledView.rE24Text }}</text>
              <polygon
                points="265,44 265,76 290,60"
                :class="ledView.ledFillClass"
                fill="currentColor"
                fill-opacity="0.25"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <line x1="290" y1="44" x2="290" y2="76" class="stroke-foreground" stroke-width="2" stroke-opacity="0.7" />
              <line x1="296" y1="40" x2="312" y2="24" class="stroke-yellow-500" stroke-width="1.5" />
              <line x1="304" y1="48" x2="320" y2="32" class="stroke-yellow-500" stroke-width="1.5" />
              <text x="277" y="100" text-anchor="middle" font-size="11" class="fill-muted-foreground">LED {{ ledView.vfText }}</text>
              <line x1="207" y1="130" x2="207" y2="170" class="stroke-foreground" stroke-width="2.5" stroke-opacity="0.7" />
              <line x1="219" y1="140" x2="219" y2="160" class="stroke-foreground" stroke-width="2.5" stroke-opacity="0.7" />
              <text x="185" y="190" text-anchor="middle" font-size="11" class="fill-muted-foreground">供电 {{ ledView.supplyText }}</text>
              <text x="352" y="36" text-anchor="middle" font-size="11" class="fill-primary" font-weight="600">I ≈ {{ ledView.iRealText }}</text>
              <text x="150" y="120" text-anchor="middle" font-size="11" class="fill-muted-foreground">Vr = {{ ledView.vrText }}</text>
            </svg>

            <!-- 压降分配条 -->
            <div>
              <div class="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>压降分配</span>
                <span>电阻承担 {{ ledView.vrShareText }} · LED 承担 {{ ledView.vfShareText }}</span>
              </div>
              <div class="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                <div class="bg-primary/70 h-full" :style="{ width: ledView.vrSharePercent }"></div>
                <div class="bg-yellow-500/70 h-full" :style="{ width: ledView.vfSharePercent }"></div>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div v-for="item in ledStats" :key="item.label" class="bg-muted/40 border border-border rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">{{ item.label }}</p>
                <p class="text-base font-bold font-mono" :class="item.tone">{{ item.value }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">{{ item.note }}</p>
              </div>
            </div>

            <p class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5" :class="ledHint.class">
              <component :is="ledHint.icon" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ ledHint.text }}</span>
            </p>
          </template>
        </div>

        <!-- 求解过程 / 结果解读 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <template v-if="mode === 'main'">
            <h2 class="text-lg font-semibold flex items-center">
              <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 代入过程
            </h2>
            <ol v-if="steps.length" class="space-y-2">
              <li
                v-for="(line, i) in steps"
                :key="i"
                class="px-3 py-2 rounded-md bg-muted/50 border border-border text-sm font-mono text-foreground break-all"
              >{{ line }}</li>
            </ol>
            <p v-else class="text-sm text-muted-foreground">把上方两个已知量填好（可直接写 2.2k、20mA 这类带前缀的值），这里就会出现逐步代入式。</p>

            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">恒等式自检（验证求解是否自洽）</h3>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div
                  v-for="c in consistency"
                  :key="c.label"
                  class="px-2.5 py-2 rounded-md border text-xs"
                  :class="c.ok ? 'border-green-500/20 bg-green-500/5' : 'border-border bg-muted/40'"
                >
                  <p class="font-mono text-muted-foreground">{{ c.label }}</p>
                  <p class="font-semibold mt-0.5" :class="c.ok ? 'text-green-600' : 'text-muted-foreground'">{{ c.text }}</p>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <h2 class="text-lg font-semibold flex items-center">
              <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 选型说明与电阻档位建议
            </h2>
            <div class="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>
                计算式：<span class="font-mono text-foreground">R = (Vs − Vf) ÷ I</span>，
                本例 <span class="font-mono text-foreground">{{ ledView.formulaLine }}</span>。
                理论值 {{ ledView.rRawText }} 落到 E24 系列后取 <span class="font-mono text-primary">{{ ledView.rE24Text }}</span>
                （就近上档，实际电流只会略小于目标值，LED 更安全）。
              </p>
              <p>
                电阻功耗：<span class="font-mono text-foreground">PR = I² × R</span> =
                <span class="font-mono text-foreground">{{ ledView.prText }}</span>；
                按 50% 降额（实际耗散不超过额定值一半）建议选择
                <span class="font-mono text-primary font-semibold">{{ ledView.ratingText }}</span> 档位。
              </p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div
                v-for="r in ratingDefs"
                :key="r.value"
                class="px-2.5 py-2 rounded-md border text-xs"
                :class="r.value === activeRatingValue
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border bg-muted/40 text-muted-foreground'"
              >
                <p class="font-mono">{{ r.label }}</p>
                <p class="text-[10px] mt-0.5 font-normal">{{ r.pack }}</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              多个 LED 串联时把每个 Vf 相加后同样代入公式（例如 3 个白光 LED 串 12 V：R = (12 − 9.6) ÷ 0.02 = 120 Ω）；
              并联则每条支路各自串一只电阻，不要共用一只，否则电流会偏向压降最低的那一路。
            </p>
          </template>

          <!-- 静态提示条 -->
          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>AC 场景本工具按阻抗模值简化计算；含变压器 / 整流 / 感性负载请以实测为准。</span>
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-4">
          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>
              单位前缀写法：m = 毫（10⁻³）、µ / u = 微（10⁻⁶）、k = 千（10³）、M = 兆（10⁶），可与单位字母任意组合，如
              <span class="font-mono text-foreground">18mV</span>、<span class="font-mono text-foreground">20mA</span>、
              <span class="font-mono text-foreground">4k7</span>（= 4.7kΩ）、<span class="font-mono text-foreground">2.2M</span>；
              只写前缀不写单位字母（如 <span class="font-mono text-foreground">2.2k</span>）时按该栏位的单位理解。
            </span>
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
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>欧姆定律计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          欧姆定律计算器是一款在线电参量互算工具。它把电压 U（伏 V）、电流 I（安 A）、电阻 R（欧 Ω）、功率 P（瓦 W）四个量的关系
          收进一个「四量互算」表：你只要给出其中任意两个量（U+I、U+R、U+P、I+R、I+P、R+P 六种组合），
          工具就用 P = U×I 与 U = I×R 两条基本式联立消元，立即求出另外两个量，并给出代入过程与恒等式自检。
          输入端做了单位前缀自动换算，写 2.2k、20mA、4k7、500µA 都能识别；输出端会自动挑选最易读的档位显示（2200 Ω 会写成 2.2 kΩ）。
          页面另附 LED 限流电阻模块，直接算出该串多大的电阻、要取 E24 系列里哪一档、电阻上会烧掉多少功率、该选 1/8 W 还是 1/4 W。
          全部计算在浏览器本地完成，不联网、不上传，也不写入任何本地存储。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">欧姆定律三个公式怎么互相推（变形口诀）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          只要记住两条基本式就能推出全部十二条：<span class="font-mono">U = I × R</span>（欧姆定律本体）与
          <span class="font-mono">P = U × I</span>（电功率定义式）。把前者代入后者消掉 U 得
          <span class="font-mono">P = I² × R</span>，消掉 I 得 <span class="font-mono">P = U² ÷ R</span>；
          再把它们各自反解，就得到 R = U÷I、R = U²÷P、R = P÷I²、I = U÷R、I = P÷U、I = √(P÷R)、U = P÷I、U = √(P×R)。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed">
          变形口诀：<span class="font-semibold text-foreground">「求 U 用乘（I×R），求 I 用除（U÷R），求 R 用 U 除 I」</span>；
          再记一句 <span class="font-semibold text-foreground">「功率等于电压乘电流，知二求二先补 P = UI」</span>。
          实操时还有一个防错习惯：算完把结果代回 P = U×I 与 U = I×R 各查一遍，本页的恒等式自检就是在替你走这两步。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">LED 为什么要串电阻</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          LED 是电流型器件，它的伏安曲线极其陡峭：正向电压越过导通压降后，电压只涨 0.1 V，电流可能翻好几倍。
          把一个红 LED（Vf ≈ 1.8 V）直接接到 5 V 上，等于让电源「裸奔」，电流瞬间冲到几十甚至上百毫安，芯片过热后光衰、开路甚至炸裂。
          串联一只电阻的作用，是让电阻承担多余的压差 Vs − Vf，并把这个压差与电流牢牢锁在一起：R = (Vs − Vf) ÷ I。
          以 5 V 供红 LED、目标 20 mA 为例：R = (5 − 1.8) ÷ 0.02 = 160 Ω，E24 系列里正好有 160 Ω 这一档；
          电阻上会消耗 3.2 V × 20 mA = 64 mW，约占整机电功率的 42%，所以限流电阻是「确定但昂贵」的方案。
          需要省电或电池供电时，改用恒流驱动或开关降压；只要简单可靠、成本低时，串电阻仍然是最常用的做法。
          另外注意：多个 LED 串联时把各自的 Vf 相加，并联时每条支路都要各串一只电阻，不能共用。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">电阻功率怎么选（1/8、1/4、1/2 是什么意思）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          这些分数指的是电阻的额定耗散功率：1/8 W = 0.125 W、1/4 W = 0.25 W、1/2 W = 0.5 W，再往上还有 1 W、2 W、5 W（绕线 / 水泥电阻）。
          实际耗散按 <span class="font-mono">PR = I² × R</span> 计算，与电阻两端压降的平方成正比。
          经验做法是留一倍余量（降额 50%）：算出 64 mW，就选 1/4 W 而不是 1/8 W，因为 1/8 W 电阻长时间贴近额定值工作时表面温度会升到 100 °C 以上，
          阻值漂移加快、寿命大幅缩短，还可能烫坏 PCB 与 nearby 塑料件。常见对应关系：0603 约 1/10 W、0805 约 1/8 W、1206 约 1/4 W、
          插件 0207（0.5 W 金属膜）约 1/2 W；空间紧张时宁可换成更大封装或多只并联分压，也不要贴额定值使用。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么 220 V 100 W 白炽灯冷态电阻只有几十欧</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          用本工具按 U = 220 V、P = 100 W 求解，得到热态电阻 R = U² ÷ P = 484 Ω、工作电流 454.5 mA。
          但用万用表量同一只未点亮的灯泡，两脚之间往往只有 20-60 Ω，差了十几倍。这不是算错，也不是表不准，而是钨丝电阻的「温度系数」：
          钨的电阻温度系数约 +0.0045 / °C，灯丝正常工作温度 2300-2600 °C，冷态到热态电阻升高约 12-15 倍，
          484 Ω ÷ 15 ≈ 32 Ω 正是常见的冷态读数。也正因为冷态电阻这么小，刚接通瞬间的浪涌电流可达 6-10 A（稳态仅 0.45 A），
          灯丝最细处被反复热冲击，白炽灯绝大多数时候都是「开灯那一瞬间」烧断的。
          同一原理也解释了为什么开关电源、适配器上电瞬间会打保险、跳空开：冷态的滤波电解与 NTC 抑制电阻同样是低阻状态。
          诚实提醒：本页只做纯阻性计算，不会自动替你乘这个温度系数；需要冷态估算请按 R_cold ≈ R_hot ÷ 12~15 修正，或直接用万用表 / 微欧计实测。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">一句电工口诀</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          <span class="font-semibold text-foreground">「串联分压、并联分流；功率等于电压乘电流。选线先算电流数，一平方铜线跑五安。」</span>
          前半句是欧姆定律在拓扑上的直接推论（同一路电流乘阻抗得分压，同一节点电压除阻抗得分流），后半句是配线时的经验安全载流量，
          算出电流后再决定导线截面与保护器件，才是完整的计算闭环。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">欧姆定律计算器怎么用？</h3>
            <p class="text-sm text-muted-foreground mt-1">在「选择已知量」里点出你手上有的两个量（如 U + R），然后在对应卡片里填数值，可直接带单位前缀（220、2.2k、20mA、4k7 都能识别），另外两个卡片会即时给出结果与代入过程。若某栏算出负电阻或两个已知量同时为 0，工具会明确报错而不是给出无意义数字。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">LED 限流电阻怎么算，为什么要取 E24 系列？</h3>
            <p class="text-sm text-muted-foreground mt-1">先算 R = (供电电压 − LED 压降) ÷ 目标电流，例如 5 V 供红 LED、20 mA 得 160 Ω；现实中电阻阻值是按 E24 等比系列生产的（100、110、120、130、150、160…），买不到任意精度值，所以工具把理论值就近上档到 E24，再用取整后的阻值回算实际电流与功耗。上档会让电流略小于目标值，LED 只会稍暗一点，不会烧毁。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">算出的电阻该选多大功率的？</h3>
            <p class="text-sm text-muted-foreground mt-1">按 PR = I² × R 算出电阻实际耗散，再选额定值不小于耗散功率 2 倍（50% 降额）的档位。20 mA 串 160 Ω 时耗散约 0.064 W，理论 1/8 W 够用，但按降额原则建议选 1/4 W（0805 贴片约 1/8 W，1206 约 1/4 W，插件 0207 约 1/2 W）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">交流电（AC）能用这个计算器吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">可以按阻抗模值做估算：把 R 一栏填成阻抗大小（单位仍是 Ω），U 用有效值，算出的 I 也是有效值，P 为阻性负载的有功功率。但含变压器、整流桥、开关电源、电机等感性 / 容性负载时，电压与电流存在相位差，实际功率还要乘功率因数（P = U I cosφ），请以功率计或钳表实测为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么算出的电阻和实际量到的不一样？</h3>
            <p class="text-sm text-muted-foreground mt-1">三个常见原因：一是温度系数（灯丝、电机绕组冷热态可差 10 倍以上）；二是数字万用表在低阻档本身有 0.2-0.5 Ω 表笔与接触电阻，测几十欧以下要减掉相对读数；三是电阻精度等级（碳膜 ±5%，E24 系列标称值本就允许 ±5% 偏差）。若是 LED、芯片等非线性器件，则不存在固定电阻，只能用本工具算等效阻值。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ohms-law-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Activity, Zap, Calculator, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Lightbulb
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '欧姆定律计算器 - U I R P 四量互算与 LED 限流电阻在线工具',
  description: '免费在线欧姆定律计算器，任意两个量求电压电流电阻功率，支持 mV/kV、mA/µA、kΩ/MΩ、mW/kW 单位前缀自动换算，内置 LED 限流电阻与 E24 标准阻值就近上档、电阻功耗与功率档位建议，纯浏览器本地计算不上传',
  keywords: '欧姆定律计算器,U I R P 计算,电压电流电阻功率,LED 限流电阻,电烙铁功率',
  author: '有条工具',
  ogTitle: '欧姆定律计算器 - U I R P 四量互算与 LED 限流电阻在线工具 | 有条工具',
  ogDescription: '填任意两个量即求电压、电流、电阻、功率，支持单位前缀自动换算，附 LED 限流电阻与 E24 取档。',
  ogUrl: 'https://www.util.cn/tools/ohms-law-calculator',
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
          name: '欧姆定律计算器',
          url: 'https://www.util.cn/tools/ohms-law-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'U I R P 四量互算（6 种已知量组合）',
            'mV / kV / mA / µA / kΩ / MΩ / mW / kW 前缀自动换算',
            '结果自动选择最易读单位档位',
            'UIRP 公式魔轮图解并高亮生效公式',
            '代入过程与恒等式自检',
            'LED 限流电阻计算与 E24 标准阻值就近上档',
            '电阻功耗与 1/8、1/4、1/2 W 功率档位建议',
            '本地计算不上传数据'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '欧姆定律计算器', item: 'https://www.util.cn/tools/ohms-law-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '欧姆定律计算器怎么用？',
              acceptedAnswer: { '@type': 'Answer', text: '在选择已知量里点出你手上有的两个量（如 U + R），然后在对应卡片填数值，可直接带单位前缀（220、2.2k、20mA、4k7 都能识别），另外两个卡片会即时给出结果与代入过程。若某栏算出负电阻或两个已知量同时为 0，工具会明确报错而不是给出无意义数字。' }
            },
            {
              '@type': 'Question',
              name: 'LED 限流电阻怎么算，为什么要取 E24 系列？',
              acceptedAnswer: { '@type': 'Answer', text: '先算 R = (供电电压 − LED 压降) ÷ 目标电流，例如 5V 供红 LED、20mA 得 160Ω；电阻阻值按 E24 等比系列生产（100、110、120、130、150、160…），买不到任意精度值，所以工具把理论值就近上档到 E24，再用取整后的阻值回算实际电流与功耗。上档让电流略小于目标值，LED 只会稍暗，不会烧毁。' }
            },
            {
              '@type': 'Question',
              name: '算出的电阻该选多大功率的？',
              acceptedAnswer: { '@type': 'Answer', text: '按 PR = I²R 算出电阻实际耗散，再选额定值不小于耗散功率 2 倍（50% 降额）的档位。20mA 串 160Ω 时耗散约 0.064W，理论 1/8W 够用，但按降额原则建议选 1/4W。0603 约 1/10W、0805 约 1/8W、1206 约 1/4W、插件 0207 约 1/2W。' }
            },
            {
              '@type': 'Question',
              name: '交流电（AC）能用这个计算器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以按阻抗模值估算：R 栏填阻抗大小，U 用有效值，算出的 I 也是有效值，P 为阻性负载有功功率。含变压器、整流桥、开关电源、电机等感性或容性负载时电压电流存在相位差，实际功率还要乘功率因数（P = UIcosφ），请以功率计或钳表实测为准。' }
            },
            {
              '@type': 'Question',
              name: '为什么 220V 100W 灯泡冷态电阻只有几十欧？',
              acceptedAnswer: { '@type': 'Answer', text: '按 U=220V、P=100W 求得的是热态电阻 484Ω。钨电阻温度系数约 +0.0045/℃，灯丝正常工作 2300-2600℃，冷态到热态阻值升高约 12-15 倍，484÷15 约 32Ω，正是万用表常读到的 20-60Ω。也因此开灯瞬间浪涌电流可达 6-10A，白炽灯多在开灯瞬间烧断。本工具只做纯阻性计算，冷态需自行按温度系数修正或实测。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 有效数字取整，消除浮点尾差（如 3.2 / 0.02 = 160.00000000000003 → 160）
function roundSig(x, precision) {
  const n = Number(x)
  if (!Number.isFinite(n)) return n
  return Number(n.toPrecision(precision || 12))
}

// 数字文本：最多 4 位有效数字，过大 / 过小转科学计数
function fmtNum(x) {
  const n = roundSig(x, 4)
  if (!Number.isFinite(n)) return '—'
  if (n !== 0 && (Math.abs(n) >= 1e21 || Math.abs(n) < 1e-4)) return n.toExponential(2)
  return String(n)
}

// 单位前缀因子（区分大小写：m 毫 / M 兆 / k 千 / K 千 / µ 微）
const PREFIX_OF = { m: 1e-3, u: 1e-6, 'µ': 1e-6, 'μ': 1e-6, n: 1e-9, k: 1e3, K: 1e3, M: 1e6, G: 1e9 }

// 单位字母（大小写不敏感）→ 物理量符号
const UNIT_LETTER_TO_QUANTITY = {
  v: 'V', '伏': 'V',
  a: 'A', '安': 'A',
  w: 'W', '瓦': 'W',
  'ω': 'Ω', 'Ω': 'Ω', r: 'Ω', '欧': 'Ω', ohm: 'Ω'
}

// 各物理量可选显示档位（因子由大到小，保证首位数字 ≥ 1）
const UNIT_SCALES = {
  V: [['k', 1e3], ['', 1], ['m', 1e-3]],
  A: [['', 1], ['m', 1e-3], ['µ', 1e-6]],
  'Ω': [['M', 1e6], ['k', 1e3], ['', 1]],
  W: [['k', 1e3], ['', 1], ['m', 1e-3]]
}

const UNIT_LABEL = { V: '电压', A: '电流', 'Ω': '电阻', W: '功率' }

// 解析「数值 + 单位前缀」文本 → { value(SI 基本单位), unit, factor, raw, error? }
// 支持：220、2.2k、18mV、20mA、500µA、4.7kΩ、4k7（=4.7k）、1.8 伏
function parseWithUnitOf(input, hint) {
  const fallbackUnit = UNIT_SCALES[hint] ? hint : ''
  const raw = String(input === null || input === undefined ? '' : input).trim().replace(/\s+/g, '')
  if (!raw) return { value: null, unit: fallbackUnit, factor: 1, error: '待输入' }

  // 电子常用简写仅用于电阻：10k5 → 10.5k、4k7 → 4.7k
  const shorthand = raw.match(/^(\d+)([kKmMµu])(\d)$/)
  if (shorthand && (!fallbackUnit || fallbackUnit === 'Ω')) {
    const factor = PREFIX_OF[shorthand[2]]
    return { value: Number(`${shorthand[1]}.${shorthand[3]}`) * factor, unit: fallbackUnit, factor, raw: Number(`${shorthand[1]}.${shorthand[3]}`) }
  }

  const matched = raw.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)(.*)$/)
  if (!matched) return { value: null, unit: fallbackUnit, factor: 1, error: `无法识别「${raw}」，请输入数字（可带 m/k/M/µ 前缀）` }
  const num = Number(matched[1])
  const suffix = matched[2]
  if (!Number.isFinite(num)) return { value: null, unit: fallbackUnit, factor: 1, error: '数值超出可处理范围' }
  if (!suffix) return { value: num, unit: fallbackUnit, factor: 1, raw: num }

  const firstChar = suffix.charAt(0)
  let factor = 1
  let letters = suffix
  if (PREFIX_OF[firstChar] !== undefined) {
    factor = PREFIX_OF[firstChar]
    letters = suffix.slice(1)
  }
  if (!letters) return { value: num * factor, unit: fallbackUnit, factor, raw: num }

  const quantity = UNIT_LETTER_TO_QUANTITY[letters.toLowerCase()]
  if (!quantity) {
    return { value: null, unit: fallbackUnit, factor, error: `无法识别单位「${suffix}」（支持 m / k / M / µ 前缀与 V A W Ω）` }
  }
  if (fallbackUnit && quantity !== fallbackUnit) {
    return { value: null, unit: fallbackUnit, factor, error: `这一栏是${UNIT_LABEL[fallbackUnit]}（${fallbackUnit}），收到的单位是 ${letters}` }
  }
  return { value: num * factor, unit: quantity, factor, raw: num }
}

// 数值（SI）→ 最易读前缀文本，如 0.023 A → 「23 mA」、2200 Ω → 「2.2 kΩ」
function formatWithUnitOf(value, unit) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  const scales = UNIT_SCALES[unit] || [['', 1]]
  if (n === 0) return `0 ${unit}`
  const abs = Math.abs(n)
  let chosen = scales[scales.length - 1]
  for (const scale of scales) {
    if (abs / scale[1] >= 1) {
      chosen = scale
      break
    }
  }
  const prefix = chosen[0]
  const mantissa = fmtNum(n / chosen[1])
  return `${mantissa} ${prefix}${unit}`
}

// E24 标准阻值尾数（含 1-10-100 量级由 nearestE24Of 自动扩展）
const E24_DIGITS = [100, 110, 120, 130, 150, 160, 180, 200, 220, 240, 270, 300, 330, 360, 390, 430, 470, 510, 560, 620, 680, 750, 820, 910]

// 就近上档：返回 ≥ r 的最小 E24 标准值（r 已是标准值时原样返回）
function nearestE24Of(r) {
  const n = Number(r)
  if (!Number.isFinite(n) || n <= 0) return null
  const k = Math.floor(Math.log10(n) - 2 + 1e-12)
  const mantissa = roundSig(n / Math.pow(10, k), 12)
  const hit = E24_DIGITS.find((d) => d >= mantissa - 1e-9)
  if (hit === undefined) return roundSig(100 * Math.pow(10, k + 1), 10)
  return roundSig(hit * Math.pow(10, k), 10)
}

// 电阻额定功率档（E 系列常用功率等级）
const POWER_RATINGS = [
  { value: 0.125, label: '1/8 W', pack: '0805 贴片 / 10W 小型插件' },
  { value: 0.25, label: '1/4 W', pack: '1206 贴片 / 0204 插件' },
  { value: 0.5, label: '1/2 W', pack: '2512 贴片 / 0207 金属膜' },
  { value: 1, label: '1 W', pack: '绕线 / 大功率贴片' },
  { value: 2, label: '2 W', pack: '水泥电阻 / 铝壳' },
  { value: 5, label: '5 W', pack: '水泥电阻 / 接线端子' }
]

// 按 50% 降额（实际耗散 ≤ 额定值一半）挑选功率档
function pickPowerRatingOf(pr) {
  const n = Number(pr)
  if (!Number.isFinite(n) || n <= 0) return POWER_RATINGS[1]
  const want = n * 2
  return POWER_RATINGS.find((r) => r.value >= want - 1e-12) || POWER_RATINGS[POWER_RATINGS.length - 1]
}

// 四种电参量的定义（2×2 卡片顺序：U I / R P）
const QUANTITY_DEFS = [
  { key: 'U', unit: 'V', cn: 'U 电压（V）', placeholder: '如 220 / 12 / 1.8V', prefixTip: 'V · mV · kV' },
  { key: 'I', unit: 'A', cn: 'I 电流（A）', placeholder: '如 0.5 / 20mA', prefixTip: 'A · mA · µA' },
  { key: 'R', unit: 'Ω', cn: 'R 电阻（Ω）', placeholder: '如 484 / 2.2k / 4k7', prefixTip: 'Ω · kΩ · MΩ' },
  { key: 'P', unit: 'W', cn: 'P 功率（W）', placeholder: '如 100 / 500mW', prefixTip: 'W · mW · kW' }
]

// 6 种已知量组合（a、b 按 key 中字母顺序传入 solveOf）
const PAIR_DEFS = [
  { key: 'UI', label: 'U + I', unknown: ['R', 'P'], note: '最常用：测得负载两端电压与电流，反推等效电阻与耗散功率' },
  { key: 'UR', label: 'U + R', unknown: ['I', 'P'], note: '已知供电电压与负载电阻，求工作电流与功率（电阻需为热态 / 标称值）' },
  { key: 'UP', label: 'U + P', unknown: ['I', 'R'], note: '看铭牌电压与功率，估算工作电流与等效电阻，用于配线选保险' },
  { key: 'IR', label: 'I + R', unknown: ['U', 'P'], note: '已知电流与电阻，求该电阻上的压降与发热功率' },
  { key: 'IP', label: 'I + P', unknown: ['U', 'R'], note: '已知电流与功率，反推所需电压与等效电阻（恒流源选型常用）' },
  { key: 'RP', label: 'R + P', unknown: ['U', 'I'], note: '已知电阻与允许功耗，反推最多加多大电压、流过多大电流' }
]

// UIRP 魔轮的 12 条公式（每条标注属于哪种已知量组合，驱动图解高亮）
const WHEEL_FORMULAS = [
  { id: 'U_ir', quad: 'U', text: 'U = I × R', pair: 'IR' },
  { id: 'U_pi', quad: 'U', text: 'U = P ÷ I', pair: 'IP' },
  { id: 'U_sqrt', quad: 'U', text: 'U = √(P × R)', pair: 'RP' },
  { id: 'I_ur', quad: 'I', text: 'I = U ÷ R', pair: 'UR' },
  { id: 'I_pu', quad: 'I', text: 'I = P ÷ U', pair: 'UP' },
  { id: 'I_sqrt', quad: 'I', text: 'I = √(P ÷ R)', pair: 'RP' },
  { id: 'R_ui', quad: 'R', text: 'R = U ÷ I', pair: 'UI' },
  { id: 'R_up', quad: 'R', text: 'R = U² ÷ P', pair: 'UP' },
  { id: 'R_pi', quad: 'R', text: 'R = P ÷ I²', pair: 'IP' },
  { id: 'P_ui', quad: 'P', text: 'P = U × I', pair: 'UI' },
  { id: 'P_i2r', quad: 'P', text: 'P = I² × R', pair: 'IR' },
  { id: 'P_u2r', quad: 'P', text: 'P = U² ÷ R', pair: 'UR' }
]

// 四象限位置（SVG 坐标，顺时针 U → I → R → P）
const WHEEL_QUADS = [
  { id: 'U', quad: 'U', title: '求电压 U（伏）', x: 118, y: 118 },
  { id: 'I', quad: 'I', title: '求电流 I（安）', x: 282, y: 118 },
  { id: 'R', quad: 'R', title: '求电阻 R（欧）', x: 282, y: 282 },
  { id: 'P', quad: 'P', title: '求功率 P（瓦）', x: 118, y: 282 }
]

const DOUBLE_ZERO_ERROR = '两个已知量同时为 0，其余量无法唯一确定：请换一组已知量，或补一个非 0 的量'

// 核心求解：solveOf('UI', U, I) → { U, I, R, P }（SI 基本单位）或 { error }
function solveOf(pairKey, a, b) {
  const key = String(pairKey || '').toUpperCase()
  if (!/^(UI|UR|UP|IR|IP|RP)$/.test(key)) return { error: '未知的已知量组合' }
  const known = {}
  known[key.charAt(0)] = Number(a)
  known[key.charAt(1)] = Number(b)

  for (const symbol of key.split('')) {
    if (!Number.isFinite(known[symbol])) return { error: `${symbol} 不是有效数值，请检查输入` }
  }
  if (known.R !== undefined && known.R < 0) return { error: '电阻 R 不能为负（无源负载 R ≥ 0），请检查是否把有源两端网络当电阻代入' }
  if (known.P !== undefined && known.P < 0) return { error: '功率 P 不能为负：本工具按负载吸收功率计算，回馈 / 发电场景请改取绝对值并另标方向' }
  if (key.split('').every((symbol) => known[symbol] === 0)) return { error: DOUBLE_ZERO_ERROR }

  let out
  if (key === 'UI') {
    out = known.I === 0
      ? { error: 'I = 0 属开路状态，R = U ÷ I 趋于无穷；要估漏电流请用高阻表 / 兆欧表实测' }
      : { U: known.U, I: known.I, R: known.U / known.I, P: known.U * known.I }
  } else if (key === 'UR') {
    out = known.R === 0
      ? { error: 'R = 0 属短路状态，I = U ÷ R 趋于无穷；请先确认电源内阻、导线电阻与保险规格' }
      : { U: known.U, I: known.U / known.R, R: known.R, P: (known.U * known.U) / known.R }
  } else if (key === 'UP') {
    if (known.U === 0) return { error: 'U = 0 时 I = P ÷ U 无意义（全部压降落在电源内阻或导线上）' }
    out = known.P === 0
      ? { error: 'P = 0 且 U ≠ 0 为空载：I = 0、R 趋于无穷，请改测实际漏电流' }
      : { U: known.U, I: known.P / known.U, R: (known.U * known.U) / known.P, P: known.P }
  } else if (key === 'IR') {
    out = { U: known.I * known.R, I: known.I, R: known.R, P: known.I * known.I * known.R }
  } else if (key === 'IP') {
    out = known.I === 0
      ? { error: 'I = 0 时 U = P ÷ I 无意义（开路），无法由电流与功率反推电压' }
      : { U: known.P / known.I, I: known.I, R: known.P / (known.I * known.I), P: known.P }
  } else {
    out = known.R === 0
      ? { error: 'R = 0 时 I = √(P ÷ R) 无意义（短路），请先串入限流元件再算' }
      : { U: Math.sqrt(known.P * known.R), I: Math.sqrt(known.P / known.R), R: known.R, P: known.P }
  }

  if (out.error) return out
  out = {
    U: roundSig(out.U, 12),
    I: roundSig(out.I, 12),
    R: roundSig(out.R, 12),
    P: roundSig(out.P, 12)
  }
  if (![out.U, out.I, out.R, out.P].every((n) => Number.isFinite(n))) {
    return { error: '结果超出可表示范围（数值过大或过小），请检查输入量级或换一组已知量' }
  }
  if (out.R < 0) return { error: `求得 R = ${fmtNum(out.R)} Ω 为负值，请检查 U 与 I 的参考方向是否相反` }
  if (out.P < 0) return { error: `求得 P = ${fmtNum(out.P)} W 为负值，说明该元件在输出功率（电源 / 反电动势），本工具只算负载吸收功率` }
  return out
}

// 代入过程文本（由已求解的四个量生成两条生效公式的代入式）
function stepsOf(pairKey, s) {
  const key = String(pairKey || '').toUpperCase()
  if (!s || s.error) return []
  const v = (value, unit) => formatWithUnitOf(value, unit)
  const lines = {
    UI: [
      `R = U ÷ I = ${v(s.U, 'V')} ÷ ${v(s.I, 'A')} = ${v(s.R, 'Ω')}`,
      `P = U × I = ${v(s.U, 'V')} × ${v(s.I, 'A')} = ${v(s.P, 'W')}`
    ],
    UR: [
      `I = U ÷ R = ${v(s.U, 'V')} ÷ ${v(s.R, 'Ω')} = ${v(s.I, 'A')}`,
      `P = U² ÷ R = (${v(s.U, 'V')})² ÷ ${v(s.R, 'Ω')} = ${v(s.P, 'W')}`
    ],
    UP: [
      `I = P ÷ U = ${v(s.P, 'W')} ÷ ${v(s.U, 'V')} = ${v(s.I, 'A')}`,
      `R = U² ÷ P = (${v(s.U, 'V')})² ÷ ${v(s.P, 'W')} = ${v(s.R, 'Ω')}`
    ],
    IR: [
      `U = I × R = ${v(s.I, 'A')} × ${v(s.R, 'Ω')} = ${v(s.U, 'V')}`,
      `P = I² × R = (${v(s.I, 'A')})² × ${v(s.R, 'Ω')} = ${v(s.P, 'W')}`
    ],
    IP: [
      `U = P ÷ I = ${v(s.P, 'W')} ÷ ${v(s.I, 'A')} = ${v(s.U, 'V')}`,
      `R = P ÷ I² = ${v(s.P, 'W')} ÷ (${v(s.I, 'A')})² = ${v(s.R, 'Ω')}`
    ],
    RP: [
      `U = √(P × R) = √(${v(s.P, 'W')} × ${v(s.R, 'Ω')}) = ${v(s.U, 'V')}`,
      `I = √(P ÷ R) = √(${v(s.P, 'W')} ÷ ${v(s.R, 'Ω')}) = ${v(s.I, 'A')}`
    ]
  }
  return lines[key] || []
}

// 恒等式自检：把求得的结果代回基本式，验证是否自洽
function consistencyOf(s) {
  if (!s || s.error) return []
  const checks = [
    { label: 'P = U × I', lhs: s.P, rhs: s.U * s.I },
    { label: 'U = I × R', lhs: s.U, rhs: s.I * s.R },
    { label: 'P = I² × R', lhs: s.P, rhs: s.I * s.I * s.R },
    { label: 'P = U² ÷ R', lhs: s.P, rhs: s.R === 0 ? Infinity : (s.U * s.U) / s.R }
  ]
  return checks.map((c) => {
    if (!Number.isFinite(c.rhs)) return { label: c.label, text: '该式在此量级下不适用', ok: false }
    const diff = Math.abs(c.lhs - c.rhs)
    const base = Math.max(Math.abs(c.lhs), Math.abs(c.rhs), 1e-15)
    const rel = diff / base
    if (rel < 1e-9) return { label: c.label, text: '完全一致', ok: true }
    return { label: c.label, text: `偏差 ${(rel * 100).toPrecision(2)}%`, ok: false }
  })
}

// LED 颜色 → 典型正向压降 Vf（V）
const LED_COLORS = [
  { id: 'red', name: '红', vf: 1.8 },
  { id: 'green', name: '绿（普绿）', vf: 2.0 },
  { id: 'yellow', name: '黄', vf: 2.0 },
  { id: 'blue', name: '蓝', vf: 3.0 },
  { id: 'white', name: '白（暖白 / 冷白）', vf: 3.2 }
]
const LED_SUPPLY_PRESETS = [3.7, 5, 12, 24]

// LED 限流电阻求解：R = (Vs − Vf) ÷ I，并回算 E24 取档后的实际电流与功耗
function solveLedOf(options) {
  const opts = options || {}
  const supply = Number(opts.supply)
  const vf = Number(opts.vf)
  const currentA = Number(opts.currentA)
  if (!Number.isFinite(supply) || supply <= 0) return { error: '请输入大于 0 的供电电压（V）' }
  if (!Number.isFinite(vf) || vf <= 0) return { error: '请选择 LED 颜色以确定正向压降 Vf' }
  if (!Number.isFinite(currentA) || currentA <= 0) return { error: '请输入工作电流（建议 1-30 mA）' }
  const vr = supply - vf
  if (vr <= 0) {
    return { error: `供电电压 ${fmtNum(supply)} V 不高于 LED 压降 ${fmtNum(vf)} V，无压差可限流：请提高供电、改用低压降 LED 或多个串联` }
  }
  const rRaw = roundSig(vr / currentA, 12)
  const rE24 = nearestE24Of(rRaw)
  if (!rE24) return { error: '理论阻值超出 E24 系列范围，请检查输入量级' }
  const iReal = roundSig(vr / rE24, 12)
  const pr = roundSig(iReal * iReal * rE24, 12)
  return { vr, rRaw, rE24, iReal, pr, rating: pickPowerRatingOf(pr) }
}

// ---------- 纯逻辑结束 ----------

const quantityDefs = QUANTITY_DEFS
const pairDefs = PAIR_DEFS
const ledColorDefs = LED_COLORS
const supplyPresets = LED_SUPPLY_PRESETS
const ratingDefs = POWER_RATINGS
const wheelFormulaTotal = WHEEL_FORMULAS.length

const seoContentVisible = ref(true)
const mode = ref('main')
const pairKey = ref('UI')
const texts = ref({ U: '220', I: '0.5', R: '', P: '' })

const ledSupply = ref('5')
const ledColor = ref('red')
const ledCurrent = ref('20')

const activePresetId = ref('')
const activePresetNote = ref('')

const unitOf = (key) => (QUANTITY_DEFS.find((q) => q.key === key) || {}).unit || ''

const activePair = computed(() => PAIR_DEFS.find((p) => p.key === pairKey.value) || PAIR_DEFS[0])
const knownKeys = computed(() => activePair.value.key.split(''))

function isKnown(key) {
  return knownKeys.value.includes(key)
}

// 已知量的解析结果（含单位前缀换算）
const parsedKnown = computed(() => {
  const out = {}
  knownKeys.value.forEach((key) => {
    out[key] = parseWithUnitOf(texts.value[key], unitOf(key))
  })
  return out
})

function inputFoot(key) {
  const parsed = parsedKnown.value[key]
  if (!parsed) return { text: '', tone: 'text-muted-foreground' }
  if (parsed.error) {
    if (parsed.error === '待输入') return { text: unitOf(key) ? `单位 ${unitOf(key)}，可带前缀` : '', tone: 'text-muted-foreground' }
    return { text: parsed.error, tone: 'text-red-500' }
  }
  return { text: `= ${fmtNum(parsed.value)} ${unitOf(key)}`, tone: 'text-muted-foreground' }
}

const solved = computed(() => {
  const parsed = parsedKnown.value
  for (const key of knownKeys.value) {
    const item = parsed[key]
    if (!item) return { error: '请输入有效数值' }
    if (item.error && item.error !== '待输入') return { error: item.error }
    if (item.value === null || item.value === undefined) return null
  }
  const values = knownKeys.value.map((key) => parsed[key].value)
  return solveOf(pairKey.value, values[0], values[1])
})

const steps = computed(() => stepsOf(pairKey.value, solved.value))
const consistency = computed(() => consistencyOf(solved.value))

const solveState = computed(() => {
  const result = solved.value
  if (result === null) {
    return { tone: 'warn', text: `请在「${knownKeys.value.join(' + ')}」两栏里各填一个数值（可直接写 2.2k、20mA 这类带前缀形式）。`, icon: Info, class: 'bg-muted/60 text-foreground' }
  }
  if (result.error) {
    return { tone: 'error', text: result.error, icon: TriangleAlert, class: 'bg-red-500/10 text-red-600' }
  }
  return {
    tone: 'ok',
    text: `已求得 ${activePair.value.unknown.join(' 与 ')}：${formatWithUnitOf(result[activePair.value.unknown[0]], unitOf(activePair.value.unknown[0]))}、${formatWithUnitOf(result[activePair.value.unknown[1]], unitOf(activePair.value.unknown[1]))}。`,
    icon: CheckCircle,
    class: 'bg-green-500/10 text-green-600'
  }
})

function solvedText(key) {
  const result = solved.value
  if (!result || result.error) return '—'
  return formatWithUnitOf(result[key], unitOf(key))
}

function solvedBaseText(key) {
  const result = solved.value
  if (!result || result.error) return '等待两个已知量'
  return `SI：${fmtNum(result[key])} ${unitOf(key)}`
}

// 魔轮四象限数据（常量表驱动，当前组合的公式高亮）
const wheelQuads = computed(() =>
  WHEEL_QUADS.map((quad) => ({
    ...quad,
    rows: WHEEL_FORMULAS.filter((f) => f.quad === quad.quad)
  }))
)
const activeFormulas = computed(() => WHEEL_FORMULAS.filter((f) => f.pair === pairKey.value))

// ---------- LED 模块 ----------
const ledVf = computed(() => {
  const color = LED_COLORS.find((c) => c.id === ledColor.value)
  return color ? color.vf : 0
})

const ledSolved = computed(() =>
  solveLedOf({
    supply: Number(ledSupply.value),
    vf: ledVf.value,
    currentA: Number(ledCurrent.value) / 1000
  })
)

const ledCurrentMa = computed(() => Number(ledCurrent.value))

const ledView = computed(() => {
  const r = ledSolved.value
  const supply = Number(ledSupply.value)
  const vf = ledVf.value
  const ok = !!r && !r.error
  const vrShare = ok && supply > 0 ? Math.min(100, Math.max(0, Math.round((r.vr / supply) * 100))) : 0
  return {
    ok,
    supplyText: ok ? formatWithUnitOf(supply, 'V') : `${fmtNum(supply)} V`,
    vfText: ok ? formatWithUnitOf(vf, 'V') : `${fmtNum(vf)} V`,
    vrText: ok ? formatWithUnitOf(r.vr, 'V') : '—',
    rRawText: ok ? formatWithUnitOf(r.rRaw, 'Ω') : '—',
    rE24Text: ok ? formatWithUnitOf(r.rE24, 'Ω') : '—',
    iRealText: ok ? formatWithUnitOf(r.iReal, 'A') : '—',
    prText: ok ? formatWithUnitOf(r.pr, 'W') : '—',
    ratingText: ok ? `${r.rating.label}（额定 ${r.rating.value} W）` : '—',
    formulaLine: ok
      ? `R = (${fmtNum(supply)} − ${fmtNum(vf)}) ÷ ${fmtNum(Number(ledCurrent.value) / 1000)} = ${fmtNum(r.rRaw)} Ω`
      : '待输入',
    vrSharePercent: `${vrShare}%`,
    vfSharePercent: `${100 - vrShare}%`,
    vrShareText: ok ? `${vrShare}%` : '—',
    vfShareText: ok ? `${100 - vrShare}%` : '—',
    ledFillClass: ok ? 'text-yellow-500' : 'text-muted-foreground'
  }
})

// 当前建议的功率档（用于下方档位卡片高亮）
const activeRatingValue = computed(() => {
  const r = ledSolved.value
  return r && !r.error ? r.rating.value : null
})

const ledStats = computed(() => {
  const r = ledSolved.value
  const ok = r && !r.error
  const base = { tone: 'text-foreground' }
  if (!ok) {
    return [
      { ...base, label: '电阻压降 Vr', value: '—', note: '等待有效输入' },
      { ...base, label: '理论阻值 R', value: '—', note: 'R = (Vs − Vf) ÷ I' },
      { ...base, label: 'E24 取档', value: '—', note: '就近上档' },
      { ...base, label: '实际电流', value: '—', note: '按取档值回算' },
      { ...base, label: '电阻功耗 PR', value: '—', note: 'PR = I² × R' },
      { ...base, label: '建议功率档', value: '—', note: '按 50% 降额' }
    ]
  }
  return [
    { ...base, label: '电阻压降 Vr', value: formatWithUnitOf(r.vr, 'V'), note: `占供电 ${Math.round((r.vr / Number(ledSupply.value)) * 100)}%` },
    { ...base, label: '理论阻值 R', value: formatWithUnitOf(r.rRaw, 'Ω'), note: 'R = (Vs − Vf) ÷ I' },
    { tone: 'text-primary', label: 'E24 取档（就近上档）', value: formatWithUnitOf(r.rE24, 'Ω'), note: r.rE24 === r.rRaw ? '正好是标准值' : '买得到的最接近档' },
    { ...base, label: '实际电流', value: formatWithUnitOf(r.iReal, 'A'), note: `目标 ${fmtNum(ledCurrentMa.value)} mA` },
    { ...base, label: '电阻功耗 PR', value: formatWithUnitOf(r.pr, 'W'), note: 'PR = I² × R' },
    { tone: 'text-green-600', label: '建议功率档', value: r.rating.label, note: r.rating.pack }
  ]
})

const ledHint = computed(() => {
  const r = ledSolved.value
  if (!r || r.error) {
    return { icon: TriangleAlert, text: r && r.error ? r.error : '请填写供电电压与目标电流。', class: 'bg-red-500/10 text-red-600' }
  }
  const ma = ledCurrentMa.value
  if (ma > 30) {
    return { icon: TriangleAlert, text: `目标电流 ${fmtNum(ma)} mA 已超普通指示 LED 的 30 mA 上限，长时间易光衰烧毁；请改 20 mA 以下或换大功率 LED 并用恒流驱动。`, class: 'bg-red-500/10 text-red-600' }
  }
  if (ma < 1) {
    return { icon: Info, text: `目标电流 ${fmtNum(ma)} mA 很小，普通 LED 在 1 mA 以下肉眼亮度已明显下降，但依然能亮；电池供电设备常用 1-5 mA 省电。`, class: 'bg-muted/60 text-foreground' }
  }
  if (r.rE24 / r.rRaw > 1.1) {
    return { icon: Info, text: `取档后阻值比理论值大 ${Math.round((r.rE24 / r.rRaw - 1) * 100)}%，实际电流降到 ${formatWithUnitOf(r.iReal, 'A')}，LED 略暗。想要更准可串并联组合（如 2 × 330 Ω 并联 = 165 Ω）或改用 E96 系列。`, class: 'bg-muted/60 text-foreground' }
  }
  return { icon: CheckCircle, text: `建议选 ${r.rating.label} ${r.rating.pack}：实际耗散 ${formatWithUnitOf(r.pr, 'W')}，按 50% 降额后仍留有余量，温升与长期阻值漂移都可控。`, class: 'bg-green-500/10 text-green-600' }
})

// 串联回路导线：在电阻、LED、电池三处留断口（M/L 分段）
const circuitWirePath = 'M50,150 L50,60 L135,60 M205,60 L265,60 M290,60 L370,60 L370,150 L219,150 M207,150 L50,150'

// ---------- 预设案例 ----------
const presetDefs = [
  {
    id: 'bulb',
    label: '220 V / 100 W 白炽灯',
    summary: '由铭牌求热态电阻与工作电流（484 Ω / 454.5 mA）',
    mode: 'main',
    pair: 'UP',
    values: { U: '220', P: '100' },
    note: '求得的是热态电阻 484 Ω。刚通电瞬间钨丝只有 20-60 °C 到 2500 °C 之间的爬坡过程，冷态电阻约 484 ÷ 12~15 ≈ 32-40 Ω，浪涌电流可达 6-10 A（稳态仅 0.45 A）——这就是白炽灯总在开灯瞬间烧断、开关与保险要按浪涌选的原因。'
  },
  {
    id: 'led',
    label: '5 V 供红 LED 20 mA',
    summary: '经典限流例：(5 − 1.8) ÷ 0.02 = 160 Ω（E24 正好有）',
    mode: 'led',
    supply: '5',
    color: 'red',
    current: '20',
    note: '电阻承担 3.2 V 压差，取 E24 的 160 Ω 档；实际电流 20 mA、功耗 64 mW（占整机 42%），按降额建议选 1/4 W。若嫌 42% 太浪费，改恒流驱动或让多个 LED 串联分摊压差。'
  },
  {
    id: 'strip',
    label: '12 V 灯带 24 W',
    summary: '整卷功率估工作电流：I = 2 A、等效 R = 6 Ω',
    mode: 'main',
    pair: 'UP',
    values: { U: '12', P: '24' },
    note: '求得满载电流 2 A，电源要按 20-30% 余量选 12 V / 3 A 以上；等效阻值 6 Ω 只是整卷平均，实际是许多串并联 LED 支路加限流电阻。压降校验：0.5 mm² 导线 5 m 双线约 0.34 Ω，末端电流分走约 5%，长距离灯带建议两端注入供电。'
  }
]

function applyPreset(preset) {
  activePresetId.value = preset.id
  activePresetNote.value = preset.note
  if (preset.mode === 'led') {
    mode.value = 'led'
    ledSupply.value = preset.supply
    ledColor.value = preset.color
    ledCurrent.value = preset.current
    return
  }
  mode.value = 'main'
  pairKey.value = preset.pair
  texts.value = { U: '', I: '', R: '', P: '', ...preset.values }
}

function resetMain() {
  texts.value = { U: '', I: '', R: '', P: '' }
  pairKey.value = 'UI'
  activePresetId.value = ''
  activePresetNote.value = ''
}

function resetLed() {
  ledSupply.value = '5'
  ledColor.value = 'red'
  ledCurrent.value = '20'
  activePresetId.value = ''
  activePresetNote.value = ''
}

// 切换已知量组合时清掉非当前组合的残留输入，避免误解
function selectPair(key) {
  pairKey.value = key
  activePresetId.value = ''
  activePresetNote.value = ''
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('ohms-law-calculator')
})
</script>
