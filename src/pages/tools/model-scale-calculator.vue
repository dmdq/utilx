<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Box class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">模型比例换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">实物↔模型尺寸双向换算、1:72→1:48 比例互查、HO/OO/N/TT/Z 轨距对照，军模航模车模铁模高达玩家备坑参考</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线模型比例换算工具：输入实物尺寸选比例即得模型尺寸（毫米精确到 0.01，并换算英寸、给出"约手掌宽"式体感类比）；
        支持反向"模型→实物"，以及比例互查——"1:72 的喷火做好了是 15cm，改 1:48 该多大？"先反推实物再换算目标比例，两步一条链、中间实物尺寸可见。
        内置 1:35 / 1:48 / 1:72 / 1:144 / 1:87 / 1:700 等 18 档常用比例与虎式坦克、大和舰、埃菲尔铁塔等场景库，附铁模轨距专区解释 HO 与 OO 为什么共用 16.5mm 轨道。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左列：参数设置 + 场景库 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ArrowLeftRight class="w-5 h-5 mr-2 text-primary" /> 换算模式
          </h2>

          <div class="grid grid-cols-3 gap-1.5 p-1.5 bg-muted/50 rounded-lg">
            <button
              v-for="m in modeDefs"
              :key="m.id"
              @click="switchMode(m.id)"
              class="px-1 py-2 rounded-md text-xs font-medium transition text-center leading-tight"
              :class="mode === m.id ? 'bg-card border border-primary text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground border border-transparent'"
            >{{ m.label }}</button>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">{{ valueLabel }}</label>
            <div class="flex gap-2">
              <input
                v-model="value"
                @input="userEdited = true"
                type="text"
                inputmode="decimal"
                class="flex-1 min-w-0 px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                :placeholder="valuePlaceholder"
              />
              <select
                v-model="unit"
                class="w-28 px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option v-for="u in UNITS" :key="u.id" :value="u.id">{{ u.label }}</option>
              </select>
            </div>
          </div>

          <!-- 单比例选择（real2model / model2real） -->
          <div v-if="mode !== 'chain'">
            <label class="block text-sm font-medium text-foreground mb-1.5">模型比例</label>
            <select
              v-model="scaleSel"
              class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="s in SCALES" :key="s.denom" :value="String(s.denom)">{{ s.label }}</option>
              <option value="custom">自定义 1:X…</option>
            </select>
            <div v-if="scaleSel === 'custom'" class="mt-2 flex items-center gap-2">
              <span class="text-sm text-muted-foreground font-mono">1 :</span>
              <input
                v-model="customDenom"
                type="text"
                inputmode="decimal"
                placeholder="如 64"
                class="flex-1 min-w-0 px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <CheckCircle v-if="activeDenom" class="w-4 h-4 text-green-500 flex-shrink-0" />
            </div>
          </div>

          <!-- 双比例选择（chain） -->
          <div v-else class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">现有比例</label>
              <select v-model="srcSel" class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option v-for="s in SCALES" :key="s.denom" :value="String(s.denom)">{{ s.label }}</option>
                <option value="custom">自定义…</option>
              </select>
              <input
                v-if="srcSel === 'custom'"
                v-model="srcCustom"
                type="text"
                inputmode="decimal"
                placeholder="1 : X 的分母 X"
                class="mt-2 w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">目标比例</label>
              <select v-model="tgtSel" class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option v-for="s in SCALES" :key="s.denom" :value="String(s.denom)">{{ s.label }}</option>
                <option value="custom">自定义…</option>
              </select>
              <input
                v-if="tgtSel === 'custom'"
                v-model="tgtCustom"
                type="text"
                inputmode="decimal"
                placeholder="1 : X 的分母 X"
                class="mt-2 w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <p v-if="mode === 'chain'" class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>互查示例：1:72 的喷火模型按翼展约 15cm，选 1:72 → 1:48，先看反推的实物，再看新比例下的模型尺寸。</span>
          </p>

          <div>
            <p class="text-sm font-medium text-foreground mb-2">快速示例（场景库前三）</p>
            <div class="grid grid-cols-1 gap-1.5">
              <button
                v-for="p in SUBJECT_PRESETS.slice(0, 3)"
                :key="p.id"
                @click="applyPreset(p)"
                class="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted/80 hover:border-primary/40 transition text-left"
              >
                <Play class="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span class="text-sm text-foreground truncate">{{ p.name }}</span>
                <span class="text-xs text-muted-foreground font-mono ml-auto flex-shrink-0">{{ p.meters }} m · 1:{{ p.scale }}</span>
              </button>
            </div>
          </div>

          <button
            @click="resetAll"
            class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认 / 清空
          </button>
        </div>

        <!-- 场景库 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 场景库（点击填入实物尺寸）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-1.5">
            <button
              v-for="p in SUBJECT_PRESETS"
              :key="p.id"
              @click="applyPreset(p)"
              class="px-2.5 py-2 rounded-lg border text-left transition"
              :class="activePresetId === p.id ? 'border-primary bg-primary/10' : 'border-border bg-muted/40 hover:bg-muted/80'"
            >
              <p class="text-xs font-medium text-foreground truncate">{{ p.name }}</p>
              <p class="text-[10px] text-muted-foreground font-mono mt-0.5">{{ p.dim }} {{ p.meters }} m · 常配 1:{{ p.scale }}</p>
            </button>
          </div>
          <p class="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>尺寸取自公开资料近似值，实际商品以盒装标注为准。</span>
          </p>
        </div>
      </div>

      <!-- 右列：结果 + 速查 + 标尺 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 换算结果
          </h2>

          <p v-if="inputError" class="text-xs leading-relaxed p-3 rounded-lg bg-red-500/10 text-foreground flex items-start gap-1.5">
            <TriangleAlert class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{{ inputError }}</span>
          </p>
          <p v-else-if="!calc" class="text-sm text-muted-foreground py-8 text-center">在左侧输入尺寸后，结果与体感类比会显示在这里。</p>

          <template v-else>
            <div class="bg-primary/10 rounded-lg p-5 text-center space-y-1">
              <p class="text-xs text-muted-foreground">{{ primaryLabel }}</p>
              <p class="text-5xl font-bold text-primary font-mono break-all">
                {{ formatMmText(calc.primaryMm) }}<span class="text-lg font-normal ml-1">mm</span>
              </p>
              <p class="text-sm text-muted-foreground font-mono">
                ≈ {{ mmToInches(calc.primaryMm).toFixed(2) }} in<span v-if="calc.primaryMm >= 1000"> · ≈ {{ (calc.primaryMm / 1000).toFixed(2) }} m</span>
              </p>
              <p class="text-sm text-foreground">{{ analogyOf(calc.primaryMm) }}</p>
            </div>

            <!-- 链式互查：两步展示 -->
            <div v-if="calc.kind === 'chain'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-xs text-muted-foreground mb-1">第一步 · 按 1:{{ calc.srcDenom }} 反推实物</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ formatMmText(calc.realMm) }} mm</p>
                <p class="text-xs text-muted-foreground font-mono mt-1">= {{ (calc.realMm / 1000).toFixed(3) }} m（模型本身 {{ formatMmText(calc.inputMm) }} mm）</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-xs text-muted-foreground mb-1">第二步 · 换成 1:{{ calc.tgtDenom }} 的模型</p>
                <p class="text-lg font-bold text-primary font-mono">{{ formatMmText(calc.modelMm) }} mm</p>
                <p class="text-xs text-muted-foreground font-mono mt-1">≈ {{ mmToInches(calc.modelMm).toFixed(2) }} in · {{ analogyOf(calc.modelMm) }}</p>
              </div>
            </div>

            <div v-else class="grid grid-cols-2 gap-3 text-center">
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">{{ calc.kind === 'real2model' ? '实物尺寸' : '模型尺寸' }}</p>
                <p class="text-sm font-bold text-foreground font-mono">{{ formatMmText(calc.kind === 'real2model' ? calc.realMm : calc.modelMm) }} mm</p>
                <p class="text-[10px] text-muted-foreground font-mono mt-0.5">输入 {{ value || '—' }} {{ UNITS.find(u => u.id === unit)?.label }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">{{ calc.kind === 'real2model' ? '模型尺寸' : '实物尺寸' }}</p>
                <p class="text-sm font-bold text-primary font-mono">{{ formatMmText(calc.kind === 'real2model' ? calc.modelMm : calc.realMm) }} mm</p>
                <p class="text-[10px] text-muted-foreground font-mono mt-0.5">比例 1:{{ calc.denom }}</p>
              </div>
            </div>

            <!-- 比例尺速查表：同一实物多比例并排 -->
            <div>
              <p class="text-sm font-medium text-foreground mb-2">比例尺速查 · 同一实物（{{ formatMmText(calc.realMm) }} mm）并排对比</p>
              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="row in tableRows"
                  :key="row.denom"
                  class="rounded-lg p-3 text-center border"
                  :class="row.current ? 'border-primary bg-primary/10' : 'border-border bg-muted/40'"
                >
                  <p class="text-xs text-muted-foreground mb-1 font-mono">1:{{ row.denom }}</p>
                  <p class="text-base sm:text-lg font-bold text-foreground font-mono break-all">{{ formatMmText(row.modelMm) }}<span class="text-[10px] font-normal"> mm</span></p>
                  <p class="text-[10px] text-muted-foreground font-mono mt-0.5">{{ mmToInches(row.modelMm).toFixed(2) }} in</p>
                  <p v-if="row.current" class="text-[10px] text-primary mt-1">当前</p>
                </div>
              </div>
            </div>

            <!-- SVG 标尺示意：模型长 vs 成人手掌 18cm -->
            <div>
              <p class="text-sm font-medium text-foreground mb-2">标尺示意（与成人手掌长 180 mm 对比）</p>
              <div class="bg-muted/30 rounded-lg p-2">
                <svg v-if="svgBars" viewBox="0 0 600 148" class="w-full" role="img" aria-label="模型尺寸与手掌对比示意图">
                  <rect x="16" :y="30" :width="svgBars.modelW" height="22" rx="4" class="text-primary" fill="currentColor" />
                  <text x="16" y="22" font-size="12" class="text-muted-foreground" fill="currentColor">{{ primaryLabel }}</text>
                  <text :x="svgBars.modelLabelX" y="46" font-size="12" font-family="monospace" class="text-foreground" fill="currentColor">{{ formatMmText(calc.primaryMm) }} mm</text>

                  <rect x="16" :y="80" :width="svgBars.handW" height="22" rx="4" class="text-muted-foreground" fill="currentColor" opacity="0.55" />
                  <text x="16" y="72" font-size="12" class="text-muted-foreground" fill="currentColor">成人手掌（约 180 mm）</text>
                  <text :x="svgBars.handLabelX" y="96" font-size="12" font-family="monospace" class="text-muted-foreground" fill="currentColor">180 mm</text>

                  <line x1="16" y1="124" :x2="16 + TRACK_W" stroke-width="1.5" class="text-border" stroke="currentColor" />
                  <line
                    v-for="t in svgTicks"
                    :key="t.i"
                    :x1="16 + TRACK_W * t.f" :y1="124"
                    :x2="16 + TRACK_W * t.f" :y2="t.i % 4 === 0 ? 114 : 119"
                    stroke-width="1" class="text-border" stroke="currentColor"
                  />
                  <text x="16" y="142" font-size="10" font-family="monospace" class="text-muted-foreground" fill="currentColor">0</text>
                  <text :x="16 + TRACK_W - 60" y="142" font-size="10" font-family="monospace" class="text-muted-foreground" fill="currentColor">{{ svgBars.refText }}</text>
                </svg>
              </div>
              <p class="text-[11px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
                <Info class="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>条长按 {{ svgBars ? svgBars.refNote : '当前主结果与 180mm 取较大者' }} 等比缩放，仅供直观感受，精确值以上方毫米数为准。</span>
              </p>
            </div>
          </template>
        </div>

        <!-- 铁模专区 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-lg font-semibold flex items-center">
              <Ruler class="w-5 h-5 mr-2 text-primary" /> 铁道模型专区 · 轨距对照
            </h2>
            <div class="flex items-center gap-2">
              <label class="text-xs text-muted-foreground flex-shrink-0">真实轨距 (mm)</label>
              <input
                v-model="railGauge"
                type="text"
                inputmode="decimal"
                class="w-28 px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="1435"
              />
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-2 font-medium">档次</th>
                  <th class="py-2 pr-2 font-medium">比例</th>
                  <th class="py-2 pr-2 font-medium">理论轨距</th>
                  <th class="py-2 pr-2 font-medium">市面常用</th>
                  <th class="py-2 font-medium">判定 / 说明</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in railRows" :key="row.id" class="border-b border-border/50 last:border-0">
                  <td class="py-2 pr-2 font-bold text-foreground">{{ row.id }}</td>
                  <td class="py-2 pr-2 font-mono text-muted-foreground">1:{{ row.denom }}</td>
                  <td class="py-2 pr-2 font-mono text-foreground">{{ row.theoryText }}</td>
                  <td class="py-2 pr-2 font-mono text-muted-foreground">{{ row.gauge }} mm</td>
                  <td class="py-2">
                    <span v-if="row.status === 'match'" class="inline-flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle class="w-3.5 h-3.5" /> 与理论一致
                    </span>
                    <span v-else-if="row.status === 'fake'" class="inline-flex items-center gap-1 text-xs text-amber-600">
                      <TriangleAlert class="w-3.5 h-3.5" /> 假轨距：{{ row.note }}
                    </span>
                    <span v-else class="text-xs text-muted-foreground">{{ row.theoryText === '—' ? '请输入有效轨距' : '偏离理论值' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              以标准轨 1435 mm 为例：HO(1:87)、N(1:160)、TT(1:120)、Z(1:220) 的市面轨距都落在理论值 ±0.1 mm 内；
              唯独 OO 按 1:76 理论应为 18.9 mm，却沿用 HO 的 16.5 mm 轨道——二战后英国厂商为与欧洲 HO 零件互通直接改用 16.5 mm 轨，车身更宽、轨道显得更窄，史称「假轨距」，也因此 HO 与 OO 的轨道、轮对配件可以通用。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>模型比例换算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          模型比例换算器是面向军模、航模、车模、舰模、铁道模型与高达玩家的在线尺寸换算工具。模型比例写作 1:N，含义是「模型上的 1 单位 = 实物世界的 N 单位」，
          所以实物尺寸换算模型尺寸只需除以分母 N：虎式坦克全长 8.45 m（8450 mm）在 1:35 下就是 8450 ÷ 35 ≈ 241.43 mm。
          本工具支持三种方向：实物→模型、模型→实物，以及「比例互查」——给定某比例下的模型尺寸，先反推实物、再换算到目标比例，
          例如 1:72 喷火（翼展按模型约 15 cm）换成 1:48 是多大：150 mm × 72 = 10800 mm（实物 10.8 m），再 ÷ 48 = 225 mm。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">1:72 和 1:48 怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          同一架 15 m 长的喷气战斗机，1:72 出来约 208 mm、1:48 约 312 mm——1:48 大出一半，代价是陈列空间翻倍。
          1:72 省地方、单价低、欧洲厂商题材极全（二战机尤其多），适合机库墙与桌面展示；
          1:48 是美国市场主流，细节、蚀刻片、树脂改件、座舱人物等第三方配件生态最肥，适合想深挖旧化与场景的玩家。
          新手建议先用 1:72 试手感，确定喜欢的题材再升 1:48。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">高达 HG / RG / MG / PG 对应什么比例？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          万代高达拼装线按等级固定比例：HG 为 1:144，RG 同为 1:144 但采用一体成型骨架与高密度细节分割，MG 为 1:100，PG 为 1:60。
          以 RX-78-2 设定身高 18 m 计算：HG/RG ≈ 125 mm、MG ≈ 180 mm、PG ≈ 300 mm，正好差出一个"手掌"的体量。
          注意不同机体设定高度不同（如扎古约 17.5 m），且各等级产品线时有调整，具体请以万代官方公告为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">铁模 HO 和 OO 为什么轨距一样？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          HO 是 1:87（约 3.5 mm:1 ft），OO 是 1:76（4 mm:1 ft），两者理论轨距本应不同：标准轨 1435 mm 下 HO 约 16.5 mm、OO 约 18.9 mm。
          但二战后英国厂商为与欧洲大陆 HO 体系共用轨道、轮对与电机零件，直接让 1:76 的车身跑 16.5 mm 轨道，
          车壳更宽、轨道看起来更窄，形成所谓「OO 假轨距」。今天除少数 4mm/FT 考据玩家外，OO 与 HO 共用 16.5 mm 轨道已成事实标准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么比例数字越大，模型反而越小？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          1:N 本质是分数 1/N：分母越大，分数越小。所以 1:72 的模型比 1:48 小（同样的实物除以更大的数），1:144 又只有 1:72 的一半。
          容易混淆的是铁模档次名（HO/OO/N/TT/Z）不体现数字，需要查比例：HO=1:87、OO=1:76、N=1:160、TT=1:120、Z=1:220。
          本工具的场景库与速查表就是为了让"除完之后的物理尺寸"直观可见——埃菲尔铁塔 300 m 在 1:87 下是 3.45 m，比一个成年人还高，这就是 HO 场景很少收入整塔的原因。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">模型下水、入沙盘，比例怎么配套？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          原则是「同场景主体同比例」：军舰水线船体 1:700 就配 1:700 的海面底座与弹射飞机；坦克 1:35 就配 1:35 的兵人、树木与 1:35 地台。
          铁模场景里轨道是硬约束（HO 场景所有机车车辆必须 16.5 mm 轨距），建筑与地形配件按 1:87/HO 标注销售；
          若想"显大"，常见手法是背景用更小比例（更远）做强制透视，主体保持标准比例。跨比例混搭（如 1:72 飞机停 1:35 甲板）会被考据玩家一眼看穿，慎用于比赛作品。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">1:35 的虎式坦克模型有多大？</h3>
            <p class="text-sm text-muted-foreground mt-1">虎式坦克全长约 8.45 m（8450 mm），8450 ÷ 35 ≈ 241.43 mm，约 24.1 cm，比手掌长出一截，加炮管前伸实际占地更大，1:35 单台地台通常按 30 cm 见方预留。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">「1:72 做好的模型是 15 cm，换成 1:48 该切多大」怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">切到「比例互查」模式：输入模型尺寸 15 cm，现有比例选 1:72、目标比例选 1:48，工具先反推实物 150 × 72 = 10800 mm（10.8 m），再除以 48 得到目标模型 225 mm，两步过程与中间实物值都会展示。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">HO 和 OO 都是 16.5 mm 轨距，配件能混用吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">轨道、轮对、电机等基础设施可以通用，这正是历史上英国 OO 改用 HO 轨道的目的；但车身按 1:76（OO）与 1:87（HO）比例不同，同场景混跑会看出车体尺寸差异，考据场景建议同比例成套收集。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'model-scale-calculator'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Box, ArrowLeftRight, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Ruler
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '模型比例换算器 - 1:72/1:48/1:35 实物模型尺寸在线对照 | 有条工具',
  description: '免费在线模型比例换算器：实物↔模型双向尺寸换算、1:72→1:48 比例互查两步链、HO/OO/N/TT/Z 铁模轨距对照、虎式坦克/大和舰/高达 RX-78 场景库与 1:72/48/35 速查表，纯浏览器本地计算不上传',
  keywords: '模型比例换算,1 72 1 48 尺寸对照,火车模型 HO OO 比例,高达模型尺寸,比例尺计算器',
  author: '有条工具',
  ogTitle: '模型比例换算器 - 1:72/1:48/1:35 实物模型尺寸在线对照 | 有条工具',
  ogDescription: '实物与模型尺寸双向换算、比例互查、HO/OO 轨距对照，军模航模车模铁模高达玩家备坑参考。',
  ogUrl: 'https://www.util.cn/tools/model-scale-calculator',
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
          name: '模型比例换算器',
          url: 'https://www.util.cn/tools/model-scale-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '实物↔模型双向尺寸换算',
            '1:72→1:48 比例互查两步链（含中间实物尺寸）',
            '18 档常用模型比例与自定义 1:X',
            '虎式坦克/大和舰/高达 RX-78 等场景库一键填入',
            'HO/OO/N/TT/Z 铁道模型轨距对照',
            '毫米/英寸结果与 7 档体感类比',
            '1:72/1:48/1:35 速查表与 SVG 标尺示意',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others' },
            { '@type': 'ListItem', position: 3, name: '模型比例换算器', item: 'https://www.util.cn/tools/model-scale-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1:35 的虎式坦克模型有多大？',
              acceptedAnswer: { '@type': 'Answer', text: '虎式坦克全长约8.45m（8450mm），8450÷35≈241.43mm，约24.1cm，比手掌长出一截，加炮管前伸实际占地更大，1:35 单台地台通常按 30cm 见方预留。' }
            },
            {
              '@type': 'Question',
              name: '1:72 做好的模型是 15cm，换成 1:48 该切多大怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '切到比例互查模式：输入模型尺寸15cm，现有比例选1:72、目标比例选1:48，工具先反推实物150×72=10800mm（10.8m），再除以48得到目标模型225mm，两步过程与中间实物值都会展示。' }
            },
            {
              '@type': 'Question',
              name: 'HO 和 OO 都是 16.5mm 轨距，配件能混用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '轨道、轮对、电机等基础设施可以通用，这正是历史上英国OO改用HO轨道的目的；但车身按1:76（OO）与1:87（HO）比例不同，同场景混跑会看出车体尺寸差异，考据场景建议同比例成套收集。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const UNIT_TO_MM = { m: 1000, cm: 10, mm: 1, ft: 304.8 }
const MM_PER_INCH = 25.4

const UNITS = [
  { id: 'm', label: '米 (m)', toMm: 1000 },
  { id: 'cm', label: '厘米 (cm)', toMm: 10 },
  { id: 'mm', label: '毫米 (mm)', toMm: 1 },
  { id: 'ft', label: '英尺 (ft)', toMm: 304.8 }
]

// 常用模型比例（含铁模档次与自定义入口），1:150 为欧洲早期 N 档历史比例
const SCALES = [
  { denom: 8, label: '1:8 · 大型重机/雕像' },
  { denom: 18, label: '1:18 · 汽车模型主流' },
  { denom: 24, label: '1:24 · 汽车模型/美式皮卡' },
  { denom: 32, label: '1:32 · 拖拉机/一战机' },
  { denom: 35, label: '1:35 · 军模主流（坦克）' },
  { denom: 43, label: '1:43 · 汽车模型（欧标）' },
  { denom: 48, label: '1:48 · 飞机（美军主流）' },
  { denom: 60, label: '1:60 · PG 高达' },
  { denom: 72, label: '1:72 · 飞机（欧日主流）' },
  { denom: 76, label: '1:76 · OO 轨铁模（英标）' },
  { denom: 87, label: '1:87 · HO 轨铁模' },
  { denom: 100, label: '1:100 · MG 高达/舰模' },
  { denom: 120, label: '1:120 · TT 轨铁模' },
  { denom: 144, label: '1:144 · HG/RG 高达·日系航模' },
  { denom: 150, label: '1:150 · 欧洲早期 N 轨' },
  { denom: 160, label: '1:160 · N 轨铁模（现主流）' },
  { denom: 220, label: '1:220 · Z 轨铁模' },
  { denom: 350, label: '1:350 · 舰模全船体' },
  { denom: 400, label: '1:400 · 民航客机模型' },
  { denom: 700, label: '1:700 · 舰模水线船体' }
]

// 速查表固定三档
const QUICK_SCALES = [72, 48, 35]

// 场景库：dim 标注维度，meters 为公开资料近似实物尺寸，scale 为常配比例
const SUBJECT_PRESETS = [
  { id: 'tiger', name: '虎式坦克（全长）', dim: '长', meters: 8.45, scale: 35 },
  { id: 'spitfire', name: '喷火战斗机（翼展）', dim: '翼展', meters: 11.23, scale: 72 },
  { id: 'f16', name: 'F-16 战隼（全长）', dim: '长', meters: 15, scale: 48 },
  { id: 'eiffel', name: '埃菲尔铁塔（塔尖高）', dim: '高', meters: 300, scale: 87 },
  { id: 'gundam', name: 'RX-78-2 高达（头顶高）', dim: '高', meters: 18, scale: 144 },
  { id: 'n700', name: '新干线 N700（16 辆编成）', dim: '长', meters: 400, scale: 87 },
  { id: 'yamato', name: '大和号战列舰（全长）', dim: '长', meters: 263, scale: 700 },
  { id: 'b747', name: '波音 747（全长）', dim: '长', meters: 76, scale: 400 },
  { id: 'a380', name: '空客 A380（全长）', dim: '长', meters: 73, scale: 400 },
  { id: 'statue', name: '自由女神像（含基座）', dim: '高', meters: 93, scale: 100 },
  { id: 'bigben', name: '大本钟（伊丽莎白塔）', dim: '高', meters: 96, scale: 87 },
  { id: 'goldengate', name: '金门大桥（含引桥总长）', dim: '长', meters: 2737, scale: 87 }
]

// 铁模档次：比例分母 + 市面常用轨距(mm) + 假轨距注记
const RAIL_GAUGES = [
  { id: 'HO', denom: 87, gauge: 16.5, note: '' },
  { id: 'OO', denom: 76, gauge: 16.5, note: '英标假轨距：1:76 车身沿用 HO 的 16.5 mm 轨道（战后为与欧陆 HO 零件互通），理论应为 18.9 mm' },
  { id: 'N', denom: 160, gauge: 9, note: '' },
  { id: 'TT', denom: 120, gauge: 12, note: '' },
  { id: 'Z', denom: 220, gauge: 6.5, note: '' }
]
const GAUGE_TOLERANCE_MM = 0.1
const HAND_MM = 180 // 成人手掌长约 18cm，体感锚定用

// 数值解析：>0 的纯数字，非法返回 null
function parseNum(raw) {
  const s = String(raw == null ? '' : raw).trim()
  if (!/^\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return n > 0 ? n : null
}

// 解析自定义比例：接受 "64" / "1:64" / "1：64"，非法返回 null
function parseDenom(raw) {
  const s = String(raw == null ? '' : raw).trim().replace(/^1\s*[:：]\s*/, '')
  return parseNum(s)
}

// 单位 → 毫米
function toMm(value, unitId) {
  const f = UNIT_TO_MM[unitId]
  return f === undefined ? null : value * f
}

// 实物毫米 → 模型毫米：除以比例分母
function realToModelMm(realMm, denom) {
  return realMm / denom
}

// 模型毫米 → 实物毫米：乘以比例分母
function modelToRealMm(modelMm, denom) {
  return modelMm * denom
}

// 比例互查链：模型(源比例) → 反推实物 → 目标比例模型
function chainConvertMm(modelMm, srcDenom, tgtDenom) {
  const realMm = modelToRealMm(modelMm, srcDenom)
  return { realMm, modelMm: realToModelMm(realMm, tgtDenom) }
}

function mmToInches(mm) {
  return mm / MM_PER_INCH
}

// 毫米文本：保留 2 位小数 + 千分位（手写正则，避免 toLocaleString 环境差异）
function formatMmText(mm) {
  if (!Number.isFinite(mm)) return '—'
  const s = (Math.round(mm * 100) / 100).toFixed(2)
  const parts = s.split('.')
  return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1]
}

// 7 档体感类比（静态映射，锚定手掌 18cm / 半米等日常参照）
const ANALOGY_TIERS = [
  { max: 1, text: '比一根头发粗不了多少，得用镊子' },
  { max: 25, text: '一枚一元硬币都不到，塞口袋' },
  { max: 100, text: '约成人手掌那么宽' },
  { max: 200, text: '比手掌长（掌长约 18 cm）' },
  { max: 500, text: '接近半米，得整张书桌才摊得下' },
  { max: 1500, text: '比五岁小孩还高，落地陈列' },
  { max: Infinity, text: '超过一个成年人，家里得给它腾房间' }
]
function analogyOf(mm) {
  const tier = ANALOGY_TIERS.find((t) => mm < t.max)
  return tier ? tier.text : ANALOGY_TIERS[ANALOGY_TIERS.length - 1].text
}

// 理论轨距 = 真实轨距 ÷ 比例分母
function railTheoryGaugeMm(realGaugeMm, denom) {
  return realGaugeMm / denom
}

// 市面轨距与理论值是否一致（±0.1mm 内视为一致）
function gaugeMatches(theoryMm, commonMm) {
  return Math.abs(theoryMm - commonMm) <= GAUGE_TOLERANCE_MM
}

// 标尺示意条宽（轨道总长 TRACK_W px，按 max(主结果, 手掌180mm) 定标）
const TRACK_W = 568
function barGeometry(primaryMm) {
  const refMm = Math.max(primaryMm, HAND_MM, 1)
  const scale = TRACK_W / refMm
  const modelW = Math.max(2, primaryMm * scale)
  const handW = Math.max(2, HAND_MM * scale)
  return {
    modelW,
    handW,
    modelLabelX: Math.min(16 + modelW + 6, 600 - 96),
    handLabelX: Math.min(16 + handW + 6, 600 - 56),
    refText: formatMmText(refMm) + ' mm',
    refNote: `主结果与手掌长取较大者（${refMm >= 1000 ? (refMm / 1000).toFixed(2) + ' m' : formatMmText(refMm) + ' mm'}）`
  }
}

// ---------- 交互状态 ----------
const mode = ref('real2model') // real2model | model2real | chain
const value = ref('8.45')
const unit = ref('m')
const scaleSel = ref('35')
const customDenom = ref('')
const srcSel = ref('72')
const srcCustom = ref('')
const tgtSel = ref('48')
const tgtCustom = ref('')
const railGauge = ref('1435')
const activePresetId = ref(null)
const userEdited = ref(false)
const seoContentVisible = ref(true)

const modeDefs = [
  { id: 'real2model', label: '实物 → 模型' },
  { id: 'model2real', label: '模型 → 实物' },
  { id: 'chain', label: '比例互查' }
]

const activeDenom = computed(() =>
  scaleSel.value === 'custom' ? parseDenom(customDenom.value) : Number(scaleSel.value)
)
const srcDenom = computed(() =>
  srcSel.value === 'custom' ? parseDenom(srcCustom.value) : Number(srcSel.value)
)
const tgtDenom = computed(() =>
  tgtSel.value === 'custom' ? parseDenom(tgtCustom.value) : Number(tgtSel.value)
)

const valueLabel = computed(() => {
  if (mode.value === 'real2model') return '实物尺寸'
  return mode.value === 'model2real' ? '模型尺寸' : '现有模型尺寸（比例互查起点）'
})
const valuePlaceholder = computed(() => {
  if (mode.value === 'real2model') return '如 8.45'
  return mode.value === 'model2real' ? '如 241.43' : '如 15'
})

const inputError = computed(() => {
  if (value.value.trim() === '') return null
  if (parseNum(value.value) === null) return '请输入大于 0 的纯数字尺寸（单位请在右侧下拉选择，英尺请填小数如 5.5）'
  if (mode.value === 'chain') {
    if (!srcDenom.value) return '现有比例的自定义分母无效：请输入大于 0 的数字（如 48）'
    if (!tgtDenom.value) return '目标比例的自定义分母无效：请输入大于 0 的数字（如 48）'
  } else if (!activeDenom.value) {
    return '自定义比例无效：请输入大于 0 的分母（如 1:64 就填 64）'
  }
  return null
})

// 核心换算结果：null 表示尚未形成有效输入
const calc = computed(() => {
  const v = parseNum(value.value)
  if (v === null) return null
  const inMm = toMm(v, unit.value)
  if (inMm === null) return null
  if (mode.value === 'chain') {
    const s = srcDenom.value
    const t = tgtDenom.value
    if (!s || !t) return null
    const chain = chainConvertMm(inMm, s, t)
    return { kind: 'chain', inputMm: inMm, srcDenom: s, tgtDenom: t, realMm: chain.realMm, modelMm: chain.modelMm, primaryMm: chain.modelMm }
  }
  const d = activeDenom.value
  if (!d) return null
  if (mode.value === 'real2model') {
    return { kind: 'real2model', denom: d, realMm: inMm, modelMm: realToModelMm(inMm, d), primaryMm: realToModelMm(inMm, d) }
  }
  return { kind: 'model2real', denom: d, modelMm: inMm, realMm: modelToRealMm(inMm, d), primaryMm: modelToRealMm(inMm, d) }
})

const primaryLabel = computed(() => {
  if (!calc.value) return ''
  if (calc.value.kind === 'real2model') return `模型尺寸（实物按 1:${calc.value.denom} 缩小）`
  if (calc.value.kind === 'model2real') return `实物尺寸（模型按 1:${calc.value.denom} 还原）`
  return `目标比例 1:${calc.value.tgtDenom} 下的模型尺寸`
})

// 速查表：固定 1:72/1:48/1:35 三列并排，若当前比例不在其中则追加一列
const tableRows = computed(() => {
  if (!calc.value) return []
  const realMm = calc.value.realMm
  const current = calc.value.kind === 'chain'
    ? [calc.value.srcDenom, calc.value.tgtDenom]
    : [calc.value.denom]
  const seen = new Set()
  const dens = []
  for (const d of QUICK_SCALES.concat(current)) {
    if (!seen.has(d)) {
      seen.add(d)
      dens.push(d)
    }
  }
  return dens.map((d) => ({ denom: d, modelMm: realToModelMm(realMm, d), current: current.includes(d) }))
})

const svgBars = computed(() => (calc.value ? barGeometry(calc.value.primaryMm) : null))
const svgTicks = computed(() =>
  Array.from({ length: 9 }, (_, i) => ({ i, f: i / 8 }))
)

// 铁模轨距行：以用户输入的真实轨距算理论值，判定一致性
const railRows = computed(() => {
  const g = parseNum(railGauge.value)
  return RAIL_GAUGES.map((r) => {
    if (g === null) {
      return { ...r, theoryText: '—', status: 'none' }
    }
    const theory = railTheoryGaugeMm(g, r.denom)
    const status = gaugeMatches(theory, r.gauge) ? 'match' : (r.note ? 'fake' : 'off')
    return { ...r, theoryText: theory.toFixed(2) + ' mm', status }
  })
})

// ---------- 事件处理（SSR 安全：仅同步状态更新） ----------
function applyPreset(p) {
  mode.value = 'real2model'
  value.value = String(p.meters)
  unit.value = 'm'
  if (SCALES.some((s) => s.denom === p.scale)) {
    scaleSel.value = String(p.scale)
    customDenom.value = ''
  } else {
    scaleSel.value = 'custom'
    customDenom.value = String(p.scale)
  }
  activePresetId.value = p.id
  userEdited.value = true
}

// 切换模式时：若用户尚未手动改过数字，填入该模式的演示默认值
function switchMode(m) {
  const pristine = !userEdited.value
  mode.value = m
  if (pristine) {
    if (m === 'real2model') {
      value.value = '8.45'
      unit.value = 'm'
      scaleSel.value = '35'
      customDenom.value = ''
    } else if (m === 'model2real') {
      value.value = '241.43'
      unit.value = 'mm'
      scaleSel.value = '35'
      customDenom.value = ''
    } else {
      value.value = '15'
      unit.value = 'cm'
      srcSel.value = '72'
      srcCustom.value = ''
      tgtSel.value = '48'
      tgtCustom.value = ''
    }
  }
}

function resetAll() {
  mode.value = 'real2model'
  value.value = '8.45'
  unit.value = 'm'
  scaleSel.value = '35'
  customDenom.value = ''
  srcSel.value = '72'
  srcCustom.value = ''
  tgtSel.value = '48'
  tgtCustom.value = ''
  railGauge.value = '1435'
  activePresetId.value = null
  userEdited.value = false
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('model-scale-calculator')
})
</script>
