<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Magnet class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电感标号读取器</h1>
          <p class="text-sm text-muted-foreground mt-1">色环电感四环解读 / 目标感量反查组合 / 贴片三位码与 R 记法双向换算，口径统一 µH</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线电感标号读取器：色环电感长得像电阻却按 µH 读数，本工具把「两位有效数字 + 乘数环 + 误差环」的四环规则做成双向查询——
        正着选四个环立即得到感量与误差区间（含老件金×0.1 小感量档），反着输入目标 µH 也能给出该绕哪套色环组合；
        贴片电感的三位数字码（101 = 100µH）、R 小数记法（4R7 = 4.7µH）与少见的 nH 记法（n10 = 0.01µH）同样支持正读反查，
        并附 H/mH/µH/nH 四档联动换算与常用感量「色环 + 贴片码」并排速查表。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <p class="text-xs leading-relaxed p-3 rounded-lg bg-muted/60 border border-border text-muted-foreground flex items-start gap-2 mb-6">
      <Info class="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
      <span>本工具感量口径统一为 µH（微亨）。色环电感环序：误差环通常在最末且离前三环稍远；金 / 银出现在第三位时是乘数环（老件金 = ×0.1），不在第四位。识别结果仅供维修参考，精密电路以元件规格书为准。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：模式切换 + 输入 -->
      <div class="space-y-4">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <!-- 四模式 tab -->
          <div class="grid grid-cols-4 gap-1 p-1 bg-muted/50 rounded-lg">
            <button
              v-for="t in modeTabs"
              :key="t.key"
              @click="mode = t.key"
              :class="[
                'px-1 py-2 rounded-md text-xs font-medium transition',
                mode === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              ]"
            >
              {{ t.label }}
            </button>
          </div>

          <!-- 模式一：色环正向 -->
          <template v-if="mode === 'band'">
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium mb-1.5 text-foreground">第一环（十位数字）</label>
                  <select v-model.number="band1" class="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option v-for="c in DIGIT_COLORS" :key="c.digit" :value="c.digit">{{ c.name }}（{{ c.digit }}）</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5 text-foreground">第二环（个位数字）</label>
                  <select v-model.number="band2" class="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option v-for="c in DIGIT_COLORS" :key="c.digit" :value="c.digit">{{ c.name }}（{{ c.digit }}）</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5 text-foreground">第三环（乘数）</label>
                  <select v-model="bandMult" class="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option v-for="m in MULTIPLIERS" :key="m.key" :value="m.key">{{ m.name }}环 ×{{ m.factorLabel }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5 text-foreground">第四环（误差）</label>
                  <select v-model="bandTol" class="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option v-for="t in TOLERANCES" :key="t.key" :value="t.key">{{ t.name }}环 {{ t.text }}</option>
                  </select>
                </div>
              </div>
              <!-- 色环示意条 -->
              <div class="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2.5">
                <span class="text-[10px] text-muted-foreground mr-1 leading-tight">示意<br>（第一环端）</span>
                <span
                  v-for="(b, i) in bandSwatches"
                  :key="i"
                  class="w-7 h-10 rounded-sm border border-border flex-shrink-0"
                  :style="{ backgroundColor: b.hex, opacity: b.hex ? 1 : 0.35 }"
                  :title="b.name"
                ></span>
                <span class="text-xs text-muted-foreground ml-1">{{ bandSwatches.map(b => b.name).join(' · ') }}</span>
              </div>
              <p class="text-xs leading-relaxed text-muted-foreground">
                环序识别：误差环一般在末尾且离前三个环稍远；金 / 银作乘数时出现在第三位（老件金 = ×0.1，读出的感量会小十倍）。
              </p>
            </div>
          </template>

          <!-- 模式二：色环反查 -->
          <template v-else-if="mode === 'bandRev'">
            <div>
              <label class="block text-sm font-medium mb-1.5 text-foreground">目标电感值（µH）</label>
              <input
                v-model="bandRevText"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                spellcheck="false"
                placeholder="如 4.7、22、100"
                class="w-full px-3 py-2 rounded-md border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
              <p class="text-xs leading-relaxed text-muted-foreground mt-2">
                四环组合按「两位有效数字 × 乘数」编码，误差环推荐金环 ±5%。无精确组合时给最近标称值并标出偏差。
              </p>
            </div>
          </template>

          <!-- 模式三：贴片码正向 -->
          <template v-else-if="mode === 'smd'">
            <div>
              <label class="block text-sm font-medium mb-1.5 text-foreground">贴片电感标号</label>
              <input
                v-model="smdCode"
                type="text"
                autocomplete="off"
                spellcheck="false"
                placeholder="如 101、220、4R7、R47、n10"
                class="w-full px-3 py-2 rounded-md border border-border bg-background text-sm font-mono uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
              <p class="text-xs leading-relaxed text-muted-foreground mt-2">
                三位数字码：前两位有效数字 + 第三位零的个数，<span class="font-medium text-foreground">单位 µH</span>（101 = 100µH，与电容 101 = 100pF 口径不同）。
                R 小数记法：4R7 = 4.7µH、R47 = 0.47µH、0R5 = 0.5µH；n 前缀 nH 记法（n10 = 10nH = 0.01µH）少见，仅供参考。
              </p>
            </div>
          </template>

          <!-- 模式四：贴片码反查 -->
          <template v-else>
            <div>
              <label class="block text-sm font-medium mb-1.5 text-foreground">电感值（µH）</label>
              <input
                v-model="smdRevText"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                spellcheck="false"
                placeholder="如 4.7、100、0.47"
                class="w-full px-3 py-2 rounded-md border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
              <p class="text-xs leading-relaxed text-muted-foreground mt-2">
                同时给出标准三位数字码与 R 小数记法两种标注（超出该记法范围的显示为不可标），小感量附 nH 记法提示。
              </p>
            </div>
          </template>

          <button
            @click="resetAll"
            class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置全部输入
          </button>
        </div>

        <!-- 手算验证预设 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Play class="w-5 h-5 mr-2 text-primary" /> 手算验证预设
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
              <span class="block font-medium text-foreground">{{ p.label }}</span>
              <span class="block text-xs mt-1 font-mono text-muted-foreground">{{ p.summary }}</span>
            </button>
          </div>
          <p v-if="activePresetNote" class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{{ activePresetNote }}</span>
          </p>
        </div>

        <!-- 单位换算辅助条 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ArrowLeftRight class="w-5 h-5 mr-2 text-primary" /> 电感单位换算（改任意框其余联动）
          </h2>
          <div class="grid grid-cols-2 gap-3">
            <div v-for="f in convFields" :key="f.key" class="bg-muted/40 border border-border rounded-lg p-3">
              <label class="block text-xs font-medium text-foreground mb-1.5">{{ f.label }}</label>
              <input
                :value="f.text"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                spellcheck="false"
                @input="onConvInput(f.key, $event)"
                class="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
              <p class="text-[10px] text-muted-foreground mt-1.5">{{ f.hint }}</p>
            </div>
          </div>
          <p v-if="convOk" class="text-xs text-muted-foreground">换算链：1 H = 1000 mH、1 mH = 1000 µH、1 µH = 1000 nH。</p>
          <p v-else class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>该框内容无法解析为数字（支持 1000、0.47、1e3 等写法）。</span>
          </p>
        </div>
      </div>

      <!-- 右侧：结果 + 速查表（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 结果卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <h2 class="text-lg font-semibold flex items-center">
              <CheckCircle class="w-5 h-5 mr-2 text-primary" />
              {{ mode === 'band' ? '色环解读结果' : mode === 'bandRev' ? '反查色环组合' : mode === 'smd' ? '贴片码解读结果' : '反查贴片标注' }}
            </h2>
            <button
              v-if="currentSummaryText"
              @click="copyResult"
              class="px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-xs text-muted-foreground transition flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制读数
            </button>
          </div>

          <!-- 色环正向结果 -->
          <template v-if="mode === 'band'">
            <template v-if="bandForward.ok">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1 font-mono">{{ bandForward.bandNamesText }}</p>
                <p class="text-3xl font-bold text-primary font-mono">{{ bandForward.formatted }} µH</p>
                <p class="text-xs text-muted-foreground mt-1 font-mono">
                  {{ bandForward.sigText }} · 误差 {{ bandForward.tolText }}
                </p>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="bg-muted/40 border border-border rounded-lg p-3">
                  <p class="text-[10px] text-muted-foreground mb-1">有效数字</p>
                  <p class="text-sm font-bold font-mono text-foreground">{{ bandForward.sigText }}</p>
                </div>
                <div class="bg-muted/40 border border-border rounded-lg p-3">
                  <p class="text-[10px] text-muted-foreground mb-1">乘数环</p>
                  <p class="text-sm font-bold font-mono text-foreground">{{ bandForward.multText }}</p>
                </div>
                <div class="bg-muted/40 border border-border rounded-lg p-3">
                  <p class="text-[10px] text-muted-foreground mb-1">误差环</p>
                  <p class="text-sm font-bold font-mono text-foreground">{{ bandForward.tolText }}</p>
                </div>
                <div class="bg-muted/40 border border-border rounded-lg p-3">
                  <p class="text-[10px] text-muted-foreground mb-1">实际区间（µH）</p>
                  <p class="text-sm font-bold font-mono text-primary">{{ bandForward.minText }} ~ {{ bandForward.maxText }}</p>
                </div>
              </div>
              <p v-if="bandForward.oldGold" class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-amber-600 flex items-start gap-1.5">
                <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>金环在第三位是老件的 ×0.1 乘数用法，读数比 ×1 小十倍；若结果与电路预期差十倍，先核对第三环是乘数金还是误差金。</span>
              </p>
            </template>
            <p v-else class="text-sm text-muted-foreground leading-relaxed">{{ bandForward.error }}</p>
          </template>

          <!-- 色环反查结果 -->
          <template v-else-if="mode === 'bandRev'">
            <template v-if="bandReverse && bandReverse.ok">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1 font-mono">
                  目标 {{ bandReverse.targetText }} µH · {{ bandReverse.exact ? '有精确组合' : '无精确组合，最近标称' }}
                </p>
                <p class="text-3xl font-bold text-primary font-mono">{{ bandReverse.comboText }}</p>
                <p class="text-xs text-muted-foreground mt-1 font-mono">
                  回读 {{ bandReverse.reprText }} µH<span v-if="!bandReverse.exact">（偏差 {{ bandReverse.deviationText }}）</span> · 误差环推荐金 {{ bandReverse.tolText }}
                </p>
              </div>
              <div class="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2.5">
                <span class="text-[10px] text-muted-foreground mr-1 leading-tight">第一环端</span>
                <span
                  v-for="(b, i) in bandReverse.swatches"
                  :key="i"
                  class="w-7 h-10 rounded-sm border border-border flex-shrink-0"
                  :style="{ backgroundColor: b.hex, opacity: b.hex ? 1 : 0.35 }"
                  :title="b.name"
                ></span>
                <span class="text-xs text-muted-foreground ml-1">{{ bandReverse.comboText }}</span>
              </div>
              <p
                class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5"
                :class="bandReverse.exact ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'"
              >
                <component :is="bandReverse.exact ? CheckCircle : TriangleAlert" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span v-if="bandReverse.exact">
                  {{ bandReverse.targetText }} µH 可被四环精确编码：{{ bandReverse.comboText }}，标称体系覆盖两位有效数字 ×（×1 / ×10 / ×100 / 老件 ×0.1）。
                </span>
                <span v-else>
                  {{ bandReverse.targetText }} µH 不在四环标称体系内（两位有效数字 × 四档乘数）：最近 {{ bandReverse.reprText }} µH（{{ bandReverse.comboText }}，偏差 {{ bandReverse.deviationText }}）。小感量请改用贴片 R 记法（左侧贴片反查）。
                </span>
              </p>
            </template>
            <p v-else-if="bandReverse && bandReverse.error" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ bandReverse.error }}</span>
            </p>
            <p v-else class="text-sm text-muted-foreground leading-relaxed">在左侧输入目标感量（如 <span class="font-mono">4.7</span>、<span class="font-mono">22</span>），这里给出该用哪四道色环。</p>
          </template>

          <!-- 贴片正向结果 -->
          <template v-else-if="mode === 'smd'">
            <template v-if="smdForward.ok">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1 font-mono">{{ smdForward.kindLabel }}</p>
                <p class="text-3xl font-bold text-primary font-mono">{{ smdForward.formatted }} µH</p>
                <p class="text-xs text-muted-foreground mt-1 font-mono">
                  {{ smdForward.sigText }}
                </p>
              </div>
              <p
                v-if="smdForward.rare"
                class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-amber-600 flex items-start gap-1.5"
              >
                <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>n 前缀是 nH 记法（少见记法，仅供参考）：{{ smdForward.norm }} = {{ smdForward.sigText }}。同值更常见标法见「贴片反查」。</span>
              </p>
              <p v-else-if="smdForward.kind === '3digit'" class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
                <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <span>三位码口径是 µH 而不是电容的 pF、电阻的 Ω：101 = 100µH、220 = 22µH、470 = 47µH。同一串数字在三种元件上是三个量纲，换料时务必先分清元件类型。</span>
              </p>
            </template>
            <p v-else-if="smdForward.error && smdForward.error !== '待输入'" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ smdForward.error }}</span>
            </p>
            <p v-else class="text-sm text-muted-foreground leading-relaxed">在左侧输入贴片标号（如 <span class="font-mono">101</span>、<span class="font-mono">4R7</span>、<span class="font-mono">R47</span>），这里立即给出 µH 读数。</p>
          </template>

          <!-- 贴片反查结果 -->
          <template v-else>
            <template v-if="smdReverse && smdReverse.ok">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  class="rounded-lg p-4 text-center border transition"
                  :class="smdReverse.threeDigit ? 'border-primary bg-primary/10' : 'border-border bg-muted/40'"
                >
                  <p class="text-[10px] text-muted-foreground mb-1">标准三位码</p>
                  <template v-if="smdReverse.threeDigit">
                    <p class="text-2xl font-bold text-primary font-mono">{{ smdReverse.threeDigit }}</p>
                    <p class="text-[11px] text-muted-foreground mt-1 font-mono">{{ smdReverse.threeDigitSigText }}</p>
                  </template>
                  <p v-else class="text-xs text-muted-foreground leading-relaxed py-2">无标准三位码<br>（该值需负乘数 / 非两位有效）</p>
                </div>
                <div
                  class="rounded-lg p-4 text-center border transition"
                  :class="smdReverse.rCode ? 'border-primary bg-primary/10' : 'border-border bg-muted/40'"
                >
                  <p class="text-[10px] text-muted-foreground mb-1">R 小数记法</p>
                  <template v-if="smdReverse.rCode">
                    <p class="text-2xl font-bold text-primary font-mono">{{ smdReverse.rCode }}</p>
                    <p class="text-[11px] text-muted-foreground mt-1 font-mono">R = 小数点</p>
                  </template>
                  <p v-else class="text-xs text-muted-foreground leading-relaxed py-2">不适用 R 记法<br>（R 记法覆盖 0.01 ~ 10µH 附近）</p>
                </div>
                <div
                  class="rounded-lg p-4 text-center border transition"
                  :class="smdReverse.nhCode ? 'border-primary bg-primary/10' : 'border-border bg-muted/40'"
                >
                  <p class="text-[10px] text-muted-foreground mb-1">nH 记法（少见）</p>
                  <template v-if="smdReverse.nhCode">
                    <p class="text-2xl font-bold text-primary font-mono">{{ smdReverse.nhCode }}</p>
                    <p class="text-[11px] text-muted-foreground mt-1 font-mono">n = nH 前缀</p>
                  </template>
                  <p v-else class="text-xs text-muted-foreground leading-relaxed py-2">不适用<br>（小感量整 nH 值才用）</p>
                </div>
              </div>
              <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
                <CheckCircle class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{{ smdReverse.targetText }} µH 的板上标注：优先写 {{ smdReverse.preferredText }}。两种记法读回都是同一个值，可与「贴片码解读」模式互核。</span>
              </p>
            </template>
            <p v-else-if="smdReverse && smdReverse.error" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ smdReverse.error }}</span>
            </p>
            <p v-else class="text-sm text-muted-foreground leading-relaxed">在左侧输入 µH 值（如 <span class="font-mono">4.7</span>、<span class="font-mono">100</span>），这里给出板上该印的标号。</p>
          </template>
        </div>

        <!-- 常见感量速查表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <CircleDot class="w-5 h-5 mr-2 text-primary" /> 常见感量速查（色环与贴片码同源生成，两种标法读回同值）
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">标称感量</th>
                  <th class="py-2 pr-3 font-medium">色环（第一环 → 误差环）</th>
                  <th class="py-2 pr-3 font-medium">色环示意</th>
                  <th class="py-2 pr-3 font-medium">贴片三位码</th>
                  <th class="py-2 font-medium">R 记法</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in quickRows" :key="row.valueKey" class="border-b border-border/50 last:border-0">
                  <td class="py-2.5 pr-3 font-mono font-bold text-primary">{{ row.valueText }} µH</td>
                  <td class="py-2.5 pr-3 text-foreground font-mono text-xs">{{ row.bandsText }}</td>
                  <td class="py-2.5 pr-3">
                    <span class="inline-flex gap-1">
                      <span
                        v-for="(b, i) in row.swatches"
                        :key="i"
                        class="w-4 h-6 rounded-sm border border-border inline-block"
                        :style="{ backgroundColor: b.hex, opacity: b.hex ? 1 : 0.35 }"
                        :title="b.name"
                      ></span>
                    </span>
                  </td>
                  <td class="py-2.5 pr-3 font-mono text-foreground">{{ row.threeDigit }}</td>
                  <td class="py-2.5 font-mono text-foreground">{{ row.rCode }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <CheckCircle class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>表内色环组合与贴片码由同一套函数生成并回读校验：每行两种标法解码后都还原为左列标称值。1µH、2.2µH、4.7µH 这类小值贴片用 R 记法（1R0 / 2R2 / 4R7），10µH 及以上用三位码（100 = 10µH 起）。</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 同族工具互链 -->
    <section class="mb-8">
      <h2 class="text-xl font-bold text-foreground mb-3">同族工具：电阻色环与电容标号</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NuxtLink
          to="/tools/resistor-color-code"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <Zap class="w-5 h-5 text-primary" />
            <span class="font-medium text-foreground">电阻色环计算器</span>
          </div>
          <p class="text-sm text-muted-foreground">四 / 五环电阻阻值解读与反查。色环规则同源但口径是 Ω，误差环档位更多（金 ±5%、银 ±10%、棕 ±1%、红 ±2%），体色多为米黄 / 蓝 / 灰，而色环电感口径是 µH、体色常见绿 / 灰。</p>
        </NuxtLink>
        <NuxtLink
          to="/tools/capacitor-code-reader"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <CircleDot class="w-5 h-5 text-primary" />
            <span class="font-medium text-foreground">电容标号读取器</span>
          </div>
          <p class="text-sm text-muted-foreground">三位数代码 104 秒读 0.1µF、直标值反查标号、pF/nF/µF 联动换算。贴片电容的三位码规则与贴片电感同构但口径是 pF（104 = 100nF 而不是 100µH），并排对照最防换错料。</p>
        </NuxtLink>
      </div>
    </section>

    <RelatedTools :currentToolId="'inductor-code-reader'" :category="'calculate'" />

    <!-- SEO 内容区 -->
    <div class="relative mt-8">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>电感标号读取器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          电感标号读取器是一款面向电子维修、硬件爱好者和学生的在线电感读数工具。插件色环电感的外形和四道色环与电阻几乎一样，
          但读数口径是 µH（微亨）而不是 Ω；贴片电感上只印得下「101」「4R7」这样的短标号，分别对应 100µH 与 4.7µH。
          本工具把两套标号体系做成双向查询：色环正读给出感量与误差区间（含老件金×0.1 档与环序识别提示），
          目标感量反查给出色环组合；贴片三位数字码、R 小数记法与少见 nH 记法同样正读反查，并附单位换算与常用感量速查表。
          全部计算在浏览器本地完成，不联网、不上传。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">色环电感和色环电阻怎么区分</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          三个线索：<span class="font-medium text-foreground">一是单位</span>——同样「棕黑黑金」，电阻读 10Ω ±5%，电感读 10µH ±5%，量纲完全不同；
          <span class="font-medium text-foreground">二是体色</span>——色环电阻体色多为米黄、蓝、灰，色环电感为绕线 / 工字形磁芯，体色常见深绿、灰绿或灰黑，能看到两端引线从同一个工字芯两端引出；
          <span class="font-medium text-foreground">三是环序档位</span>——电阻乘数环常到金 ×0.1、五环精密码常见，色环电感乘数只到红 ×100，且金在第三位属老件 ×0.1 特殊用法。拆下元件用万用表二极管 / 电阻档交叉验证最稳：电感直流电阻接近 0 到几欧，电阻则读出标称阻值。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么贴片电感用三位码</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          贴片电感功率电感常见 0603 / 0805 / 1210 等封装，顶面面积印不下「100µH」这样的完整字符，
          行业沿用电容 / 电阻的三位数缩写：<span class="font-medium text-foreground">前两位有效数字 + 第三位零的个数，口径 µH</span>。
          例如 101 = 10 后补 1 个零 = 100µH，220 = 22 × 1 = 22µH，470 = 47µH；小于 10µH 的值第三位补不出负指数，
          改用 R 小数记法：4R7 = 4.7µH、R47 = 0.47µH、0R5 = 0.5µH。注意别与电容码混淆——电容的口径是 pF（104 = 100nF），
          电感的口径是 µH（101 = 100µH），同一串数字在两类元件上差好几个数量级。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">磁芯与感量的关系</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          感量 L 与匝数 N 的平方成正比、与磁路磁导率成正比：同样的匝数，空心线圈感量最小；
          加入铁氧体、锰锌 / 镍锌磁环或铁粉芯后磁导率提高几个数量级，感量成倍上升——这就是色环电感用一个工字磁芯就能做到 µH 到 mH 级的原因。
          铁氧体磁导率高但饱和磁通密度低，适合高频小信号与开关电源变压器；铁粉芯饱和电流大、软饱和特性温和，常用在大电流功率电感。
          选型时除了感量还要看额定电流与饱和电流：电感一旦磁饱和，感量骤降，开关电源会瞬间过流。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">电感在电源里的作用</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground mb-4 leading-relaxed">
          <li><strong class="text-foreground">储能</strong>：电感以磁场形式储存能量（E = ½LI²），是开关电源（Buck / Boost / DC-DC）的能量传输核心——开关管导通时储能、关断时向输出释放。</li>
          <li><strong class="text-foreground">滤波</strong>：LC 滤波利用电感「通直流、阻交流」的特性抑制纹波；电源输出端与整流后的 π 型滤波都靠它平滑。</li>
          <li><strong class="text-foreground">限流与扼流</strong>：共模扼流圈抑制 EMI，差模电感限制 di/dt；工频应用里镇流器、浪涌抑制也依赖感抗 XL = 2πfL 随频率上升的特性。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">色环电感和色环电阻怎么区分？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              看三点：单位口径不同（电阻 Ω、电感 µH）；体色不同（电阻多为米黄 / 蓝 / 灰，电感是工字磁芯绕线，体色常见绿 / 灰 / 灰黑，且两端可见磁芯结构）；
              环序档位不同（电感乘数只到红 ×100，金在第三位是老件 ×0.1 用法）。最直接的验证是万用表测直流电阻：电感接近 0Ω 到几欧，电阻则等于标称阻值。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">101 是多大电感？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              贴片电感标号 101 = 前两位「10」× 10 的 1 次方 = 100µH。同一套三位码规则下，220 = 22µH、470 = 47µH、102 = 1000µH = 1mH。
              注意电容的 101 是 100pF、电阻的 101 是 100Ω——数字相同、口径不同，换料前先确认元件类型。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">色环顺序怎么判断？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              三条经验：误差环通常在最末且与前三环的间距稍大；金 / 银色环若出现在第三位，它是乘数环（老件金 = ×0.1），不是误差环；
              第一环一般更靠近元件端部或体色收尾一侧。若按某顺序读出的值不在常见标称系列（如 1.0 / 2.2 / 4.7 / 10 / 22 / 47 / 100… 的邻域），多半是方向读反了，倒过来再读一次。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">贴片电感 4R7、R47、n10 分别是多大？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              4R7 = 4.7µH、R47 = 0.47µH、0R5 = 0.5µH——R 就是小数点，这是小于 10µH 值的主要标法。
              n10 是 nH 前缀记法（10nH = 0.01µH），只在超小感量射频件上偶尔见到，属少见记法仅供参考，遇到时以规格书为准。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  Magnet, RefreshCw, Play, ArrowLeftRight, Info, Copy, CheckCircle,
  TriangleAlert, ChevronUp, ChevronDown, CircleDot, Zap
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '电感标号读取器 - 色环电感读法与贴片电感代码在线解读工具',
  description: '免费在线电感标号读取器：色环电感四环正读感量与误差区间（含老件金×0.1），目标 µH 反查色环组合；贴片电感三位码 101=100µH、R 记法 4R7=4.7µH、nH 记法双向换算，附 H/mH/µH/nH 联动换算与常用感量速查表，纯浏览器本地计算不上传',
  keywords: '色环电感读法,贴片电感标号,电感代码查询,色码电感,4R7 电感,101 电感,电感单位换算',
  author: '有条工具',
  ogTitle: '电感标号读取器 - 色环电感读法与贴片电感代码在线解读 | 有条工具',
  ogDescription: '色环电感四环正读反查、贴片三位码与 R 记法双向换算，口径统一 µH，含单位换算与常用感量速查表，纯本地运行。',
  ogUrl: 'https://www.util.cn/tools/inductor-code-reader',
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
          name: '电感标号读取器',
          url: 'https://www.util.cn/tools/inductor-code-reader',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '色环电感四环正读（µH 口径，含老件金×0.1 乘数）',
            '目标感量反查色环组合，无精确组合给最近标称与偏差',
            '贴片电感三位数字码解读（101=100µH）',
            'R 小数记法与少见 nH 记法支持（4R7 / R47 / n10）',
            '贴片标号反查：三位码与 R 记法两种标注',
            'H/mH/µH/nH 四档联动换算',
            '常用感量色环与贴片码并排速查表',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '电感标号读取器', item: 'https://www.util.cn/tools/inductor-code-reader/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '色环电感和色环电阻怎么区分？',
              acceptedAnswer: { '@type': 'Answer', text: '单位口径不同（电阻读 Ω、电感读 µH）；体色不同（电阻多为米黄/蓝/灰，色环电感是工字磁芯绕线，体色常见绿/灰/灰黑）；环序档位不同（电感乘数只到红×100，金在第三位是老件×0.1 用法）。万用表测直流电阻可最终验证：电感接近 0 到几欧，电阻等于标称阻值。' }
            },
            {
              '@type': 'Question',
              name: '贴片电感 101 是多大电感？',
              acceptedAnswer: { '@type': 'Answer', text: '101 = 前两位有效数字 10 × 10 的 1 次方 = 100µH。同规则下 220 = 22µH、470 = 47µH、102 = 1mH。注意电容的 101 是 100pF、电阻的 101 是 100Ω，数字相同口径不同，换料前先确认元件类型。' }
            },
            {
              '@type': 'Question',
              name: '色环电感的色环顺序怎么判断？',
              acceptedAnswer: { '@type': 'Answer', text: '误差环通常在最末且离前三个环稍远；金/银出现在第三位时是乘数环（老件金=×0.1）而不是误差环；第一环一般更靠近元件端部。若读出的值不在 1.0/2.2/4.7/10/22/47/100 标称系列邻域，多半方向读反，倒过来再读。' }
            },
            {
              '@type': 'Question',
              name: '贴片电感 4R7、R47、n10 分别是多大？',
              acceptedAnswer: { '@type': 'Answer', text: '4R7 = 4.7µH、R47 = 0.47µH、0R5 = 0.5µH，R 是小数点，是小于 10µH 值的主要标法。n10 是 nH 前缀记法（10nH = 0.01µH），只在超小感量射频件上偶尔见到，属少见记法仅供参考。' }
            }
          ]
        }
      ]
    })
  }]
})

/* ===== 纯函数区开始（node 单测直接复用本段，勿混入 Vue 响应式或浏览器 API） ===== */

// 数值净化：保留 sig 位有效数字，消除浮点尾差
function roundSig(n, sig) {
  if (!Number.isFinite(n)) return NaN
  if (n === 0) return 0
  const v = parseFloat(Number(n).toPrecision(sig))
  return v
}

// µH 展示文本：消除浮点尾差；10 以下非整数保留应有小数、10 以下整数补一位 .0（1 → 1.0）
function fmtMicroH(n) {
  const v = roundSig(n, 10)
  if (!Number.isFinite(v)) return '—'
  let s = String(v)
  if (!s.includes('.') && Math.abs(v) < 10) s += '.0'
  return s
}

// 通用数字文本（换算条用）：清理浮点尾差
function fmtNum(n) {
  const v = roundSig(n, 10)
  if (!Number.isFinite(v)) return '—'
  return String(v)
}

// 通用输入解析：支持 1000 / 0.47 / 1e3 / 千分位逗号；返回 null 表示无法解析
function parseNumText(text) {
  const raw = String(text === null || text === undefined ? '' : text).trim().replace(/,/g, '')
  if (!raw) return null
  const m = raw.match(/^(\d+(\.\d+)?|\.\d+)(?:e([+-]?\d+))?$/i)
  if (!m) return null
  const v = Number(raw)
  return Number.isFinite(v) ? v : null
}

// 数字环：黑0 ~ 白9
const DIGIT_COLORS = [
  { digit: 0, name: '黑', hex: '#1f2937' },
  { digit: 1, name: '棕', hex: '#78350f' },
  { digit: 2, name: '红', hex: '#dc2626' },
  { digit: 3, name: '橙', hex: '#ea580c' },
  { digit: 4, name: '黄', hex: '#eab308' },
  { digit: 5, name: '绿', hex: '#16a34a' },
  { digit: 6, name: '蓝', hex: '#2563eb' },
  { digit: 7, name: '紫', hex: '#7c3aed' },
  { digit: 8, name: '灰', hex: '#6b7280' },
  { digit: 9, name: '白', hex: '#e5e7eb' }
]

// 乘数环：黑×1、棕×10、红×100、金×0.1（老件）。factorTenths = 乘数 × 10，整数运算避免浮点尾差
const MULTIPLIERS = [
  { key: 'x1', name: '黑', hex: '#1f2937', factorTenths: 10, factorLabel: '1', oldGold: false },
  { key: 'x10', name: '棕', hex: '#78350f', factorTenths: 100, factorLabel: '10', oldGold: false },
  { key: 'x100', name: '红', hex: '#dc2626', factorTenths: 1000, factorLabel: '100', oldGold: false },
  { key: 'x01', name: '金', hex: '#d4af37', factorTenths: 1, factorLabel: '0.1', oldGold: true }
]

// 误差环：金±5% 银±10% 红±2% 棕±1%，无环 ±20%
const TOLERANCES = [
  { key: 't5', name: '金', hex: '#d4af37', percent: 5, text: '±5%' },
  { key: 't10', name: '银', hex: '#c0c4c9', percent: 10, text: '±10%' },
  { key: 't2', name: '红', hex: '#dc2626', percent: 2, text: '±2%' },
  { key: 't1', name: '棕', hex: '#78350f', percent: 1, text: '±1%' },
  { key: 't20', name: '无环', hex: null, percent: 20, text: '±20%（未印误差环）' }
]

function multOf(key) {
  return MULTIPLIERS.find(m => m.key === key) || MULTIPLIERS[0]
}
function tolOf(key) {
  return TOLERANCES.find(t => t.key === key) || TOLERANCES[0]
}
function digitColorOf(d) {
  return DIGIT_COLORS.find(c => c.digit === d) || DIGIT_COLORS[0]
}

// 色环正向核心：(d1 d2) × 乘数 → µH + 误差区间
function decodeColorBands(d1, d2, multKey, tolKey) {
  const a = Number(d1)
  const b = Number(d2)
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || a > 9 || b < 0 || b > 9) {
    return { ok: false, error: '数字环取值须为 0~9（黑0 ~ 白9）' }
  }
  const m = multOf(multKey)
  const t = tolOf(tolKey)
  const sig = a * 10 + b
  if (sig === 0) {
    return { ok: false, error: '前两环全为黑（00）不构成有效电感：两位有效数字至少一位非零' }
  }
  const uH = roundSig((sig * m.factorTenths) / 10, 12)
  const min = roundSig(uH * (1 - t.percent / 100), 8)
  const max = roundSig(uH * (1 + t.percent / 100), 8)
  const bands = [digitColorOf(a), digitColorOf(b), m, t]
  return {
    ok: true,
    uH,
    formatted: fmtMicroH(uH),
    sigText: `${a} ${b}`,
    bandNamesText: `${DIGIT_COLORS[a].name} ${DIGIT_COLORS[b].name} ${m.name} ${t.name}`,
    multText: `${m.name} ×${m.factorLabel}`,
    tolText: t.text,
    minText: fmtMicroH(min),
    maxText: fmtMicroH(max),
    oldGold: m.oldGold,
    swatches: bands.map(x => ({ name: x.name, hex: x.hex }))
  }
}

// 色环反查核心：目标 µH → 推荐四环组合。乘数优先 ×1/×10/×100，老件 ×0.1 兜底；误差环固定推荐金 ±5%
function encodeColorBands(targetUH) {
  const target = roundSig(Number(targetUH), 12)
  if (!Number.isFinite(target) || target <= 0) {
    return { ok: false, error: '目标感量需为大于 0 的数字（单位 µH），如 4.7、22、100' }
  }
  const tol = tolOf('t5')
  const order = ['x1', 'x10', 'x100', 'x01']
  // 精确路径
  for (const key of order) {
    const m = multOf(key)
    const sig = roundSig((target * 10) / m.factorTenths, 10)
    if (Number.isInteger(sig) && sig >= 10 && sig <= 99) {
      return buildBandEncode(target, sig, m, tol, true, 0)
    }
  }
  // 最近值路径：遍历 sig 10~99 × 四档乘数，取相对偏差最小者
  let best = null
  for (const key of order) {
    const m = multOf(key)
    for (let sig = 10; sig <= 99; sig++) {
      const repr = roundSig((sig * m.factorTenths) / 10, 12)
      const dev = Math.abs(repr - target) / target
      if (!best || dev < best.dev - 1e-12) best = { sig, m, dev, repr }
    }
  }
  return buildBandEncode(target, best.sig, best.m, tol, false, roundSig(best.dev * 100, 4))
}

function buildBandEncode(target, sig, m, tol, exact, devPercent) {
  const d1 = Math.floor(sig / 10)
  const d2 = sig % 10
  const repr = roundSig((sig * m.factorTenths) / 10, 12)
  const decode = decodeColorBands(d1, d2, m.key, tol.key)
  const c1 = digitColorOf(d1)
  return {
    ok: true,
    exact,
    targetText: fmtMicroH(target),
    comboText: `${c1.name} ${DIGIT_COLORS[d2].name} ${m.name} ${tol.name}`,
    reprText: fmtMicroH(repr),
    deviationText: `${fmtNum(devPercent)}%`,
    tolText: tol.text,
    uH: repr,
    swatches: decode.ok ? decode.swatches : [],
    roundTripOk: decode.ok && roundSig(decode.uH, 8) === roundSig(repr, 8)
  }
}

// 贴片电感标号正向核心：三位数字码 / R 小数记法 / nH 记法 → µH
function decodeSmdInductor(raw) {
  const s = String(raw === null || raw === undefined ? '' : raw).trim().toUpperCase().replace(/\s+/g, '')
  if (!s) return { ok: false, error: '待输入' }

  // nH 记法（少见）：n10 = 10nH = 0.01µH
  const nh = s.match(/^N(\d{1,4})$/)
  if (nh) {
    const nH = Number(nh[1])
    if (nH === 0) return { ok: false, error: '「n0」不含信息：nH 记法应写非零 nH 值，如 n10 = 10nH' }
    const uH = roundSig(nH / 1000, 12)
    return {
      ok: true,
      kind: 'nh',
      rare: true,
      norm: s.toLowerCase(),
      kindLabel: 'nH 前缀记法（少见，仅供参考）',
      uH,
      formatted: fmtMicroH(uH),
      sigText: `${nH} nH = ${fmtMicroH(uH)} µH`
    }
  }

  // R 小数记法：4R7 = 4.7µH、R47 = 0.47µH、0R5 = 0.5µH
  const rLead = s.match(/^R(\d{1,2})$/)
  if (rLead) {
    const digits = rLead[1].padEnd(2, '0')
    const uH = roundSig(Number(digits) / 100, 12)
    return {
      ok: true,
      kind: 'r',
      rare: false,
      norm: s,
      kindLabel: 'R 小数记法（R = 小数点）',
      uH,
      formatted: fmtMicroH(uH),
      sigText: `${s} = ${fmtMicroH(uH)} µH`
    }
  }
  const rMid = s.match(/^(\d)R(\d{1,2})$/)
  if (rMid) {
    const digits = rMid[2].padEnd(2, '0')
    const uH = roundSig(Number(`${rMid[1]}.${digits}`), 12)
    return {
      ok: true,
      kind: 'r',
      rare: false,
      norm: s,
      kindLabel: 'R 小数记法（R = 小数点）',
      uH,
      formatted: fmtMicroH(uH),
      sigText: `${s} = ${fmtMicroH(uH)} µH`
    }
  }

  // 三位数字码：前两位有效数字 × 第三位 10 的幂，口径 µH
  const tri = s.match(/^(\d)(\d)(\d)$/)
  if (tri) {
    const sig = Number(tri[1]) * 10 + Number(tri[2])
    const zeros = Number(tri[3])
    if (sig === 0) return { ok: false, error: `「${s}」前两位全零不构成有效电感：三位码前两位须为 01~99` }
    const uH = roundSig(sig * Math.pow(10, zeros), 12)
    return {
      ok: true,
      kind: '3digit',
      rare: false,
      norm: s,
      kindLabel: '三位数字码（µH 口径）',
      uH,
      formatted: fmtMicroH(uH),
      sigText: `${tri[1]} ${tri[2]} × 10^${zeros}`
    }
  }

  // 全部形态不匹配：明确报错而不是静默 0
  if (/\d/.test(s) && /[A-Z]/.test(s) && !/^R/.test(s) && !/^\dR/.test(s)) {
    return { ok: false, error: `「${s}」不是有效贴片电感标号：R 只能出现在开头（R47 = 0.47µH）或个位之后（4R7 = 4.7µH），请检查 R 的位置` }
  }
  return {
    ok: false,
    error: `「${s}」不是有效贴片电感标号：合法形态为 三位数字码（101 = 100µH）、R 小数记法（4R7 / R47 / 0R5）或少见 nH 记法（n10）；三位码中间不能插字母`
  }
}

// 贴片反查核心：µH → 标准三位码 / R 记法 / nH 记法（超出该记法范围的项为 null）
function encodeSmdInductor(targetUH) {
  const v = roundSig(Number(targetUH), 12)
  if (!Number.isFinite(v) || v <= 0) {
    return { ok: false, error: '电感值需为大于 0 的数字（单位 µH），如 4.7、100' }
  }
  let threeDigit = null
  let threeDigitSigText = ''
  for (let z = 0; z <= 9; z++) {
    const q = roundSig(v / Math.pow(10, z), 10)
    if (Number.isInteger(q) && q >= 10 && q <= 99) {
      threeDigit = `${q}${z}`
      threeDigitSigText = `${Math.floor(q / 10)} ${q % 10} × 10^${z}`
      break
    }
  }
  let rCode = null
  if (v >= 0.01 && v < 1) {
    const scale2 = roundSig(v * 100, 8)
    const scale1 = roundSig(v * 10, 8)
    if (Number.isInteger(scale1) && scale1 >= 1 && scale1 <= 9) {
      rCode = `0R${scale1}`
    } else if (Number.isInteger(scale2) && scale2 >= 10 && scale2 <= 99) {
      rCode = `R${scale2}`
    }
  } else if (v >= 1 && v < 10) {
    const scale1 = roundSig(v * 10, 8)
    if (Number.isInteger(scale1)) {
      rCode = `${Math.floor(scale1 / 10)}R${scale1 % 10}`
    }
  }
  let nhCode = null
  if (v > 0 && v < 1) {
    const nH = roundSig(v * 1000, 8)
    if (Number.isInteger(nH) && nH >= 1 && nH <= 9999) nhCode = `n${nH}`
  }
  const preferred = threeDigit || rCode || nhCode
  return {
    ok: true,
    threeDigit,
    threeDigitSigText,
    rCode,
    nhCode,
    preferredText: preferred ? `「${preferred}」` : '规格书标注',
    targetText: fmtMicroH(v)
  }
}

// 常见感量速查表：色环与贴片码由同一套函数生成，两模式读回同值（往返一致）
const QUICK_VALUES = [1, 2.2, 4.7, 10, 22, 47, 100, 220, 470, 1000]

function buildQuickRows() {
  return QUICK_VALUES.map((v) => {
    const bands = encodeColorBands(v)
    const smd = encodeSmdInductor(v)
    return {
      valueKey: String(v),
      valueText: fmtMicroH(v),
      bandsText: bands.ok ? bands.comboText : '—',
      swatches: bands.ok ? bands.swatches : [],
      threeDigit: smd.ok && smd.threeDigit ? smd.threeDigit : '—',
      rCode: smd.ok && smd.rCode ? smd.rCode : '—',
      roundTripOk:
        bands.ok && bands.roundTripOk &&
        smd.ok &&
        ((smd.threeDigit && roundSig(decodeSmdInductor(smd.threeDigit).uH, 8) === roundSig(v, 8)) ||
          (smd.rCode && roundSig(decodeSmdInductor(smd.rCode).uH, 8) === roundSig(v, 8)))
    }
  })
}

/* ===== 纯函数区结束 ===== */

// ---------- 交互状态 ----------
const seoContentVisible = ref(true)
const mode = ref('band') // band | bandRev | smd | smdRev
const modeTabs = [
  { key: 'band', label: '色环解读' },
  { key: 'bandRev', label: '反查色环' },
  { key: 'smd', label: '贴片解码' },
  { key: 'smdRev', label: '贴片反查' }
]

const band1 = ref(1)
const band2 = ref(0)
const bandMult = ref('x1')
const bandTol = ref('t5')
const bandRevText = ref('4.7')
const smdCode = ref('101')
const smdRevText = ref('100')

const activePresetId = ref('')
const activePresetNote = ref('')

const STORAGE_KEY = 'inductor-code-reader:state'

// ---------- 计算结果 ----------
const bandSwatches = computed(() => [
  digitColorOf(band1.value),
  digitColorOf(band2.value),
  multOf(bandMult.value),
  tolOf(bandTol.value)
].map(b => ({ name: b.name, hex: b.hex })))

const bandForward = computed(() => decodeColorBands(band1.value, band2.value, bandMult.value, bandTol.value))

const bandReverse = computed(() => {
  const v = parseNumText(bandRevText.value)
  if (v === null) {
    return { ok: false, error: bandRevText.value.trim() ? `「${bandRevText.value.trim()}」无法解析为数字（支持 4.7、1e2 等写法）` : '' }
  }
  return encodeColorBands(v)
})

const smdForward = computed(() => decodeSmdInductor(smdCode.value))

const smdReverse = computed(() => {
  const v = parseNumText(smdRevText.value)
  if (v === null) {
    return { ok: false, error: smdRevText.value.trim() ? `「${smdRevText.value.trim()}」无法解析为数字（支持 4.7、100 等写法）` : '' }
  }
  return encodeSmdInductor(v)
})

// ---------- 单位换算（H/mH/µH/nH 联动） ----------
const CONV_UNITS = [
  { key: 'h', label: 'H（亨利）', toUH: 1e6, hint: '1 H = 1000 mH' },
  { key: 'mh', label: 'mH（毫亨）', toUH: 1e3, hint: '1 mH = 1000 µH' },
  { key: 'uh', label: 'µH（微亨）', toUH: 1, hint: '功率电感常用档' },
  { key: 'nh', label: 'nH（纳亨）', toUH: 1e-3, hint: '1 µH = 1000 nH' }
]

const convState = ref({ h: '0.001', mh: '1', uh: '1000', nh: '1000000' })
const activeConvKey = ref('uh')

const convFields = computed(() => CONV_UNITS.map(u => ({ ...u, text: convState.value[u.key] })))
const convOk = computed(() => parseNumText(convState.value[activeConvKey.value]) !== null)

function onConvInput(key, e) {
  const text = e.target.value
  activeConvKey.value = key
  const v = parseNumText(text)
  const next = { ...convState.value, [key]: text }
  if (v !== null && v >= 0) {
    const uH = roundSig(v * CONV_UNITS.find(u => u.key === key).toUH, 12)
    for (const u of CONV_UNITS) {
      if (u.key !== key) next[u.key] = fmtNum(roundSig(uH / u.toUH, 10))
    }
  }
  convState.value = next
}

// ---------- 速查表 ----------
const quickRows = computed(() => buildQuickRows())

// ---------- 预设（与自核测试向量同源） ----------
const presetDefs = [
  {
    id: 'p-brown-black-gold-silver',
    mode: 'band',
    setup: { band1: 1, band2: 0, bandMult: 'x01', bandTol: 't10' },
    label: '棕 黑 金 银 → 1.0µH ±10%',
    summary: '10 × 0.1（老件金乘数）= 1.0µH，银环 ±10%',
    note: '金在第三位是老件的 ×0.1 乘数用法：棕黑两环组成 10，乘 0.1 得 1.0µH；第四位银 = ±10%。若把第三位金误当误差环、第四位银无法作乘数，整套读数就不成立——这正是判断环序的线索。'
  },
  {
    id: 'p-red-red-black-gold',
    mode: 'band',
    setup: { band1: 2, band2: 2, bandMult: 'x1', bandTol: 't5' },
    label: '红 红 黑 金 → 22µH ±5%',
    summary: '22 × 1 = 22µH，金环 ±5%',
    note: '黑环作乘数 = ×1 不补零；22µH 是开关电源与功放输出级最常见功率电感档位之一。'
  },
  {
    id: 'p-brown-black-gold-gold',
    mode: 'band',
    setup: { band1: 1, band2: 0, bandMult: 'x01', bandTol: 't5' },
    label: '棕 黑 金 金 → 1.0µH ±5%',
    summary: '10 × 0.1 = 1.0µH，金环 ±5%',
    note: '两道金环同色别慌：离前三环稍远的末位金是误差 ±5%，第三位金是乘数 ×0.1。金 / 银同时出现时几乎总是「乘数 + 误差」各占一位。'
  },
  {
    id: 'p-smd-101',
    mode: 'smd',
    code: '101',
    label: '贴片 101 → 100µH',
    summary: '10 × 10^1 = 100µH（µH 口径）',
    note: '同一串 101 在电容上是 100pF、在贴片电感上是 100µH——三位码规则同构、口径差六个数量级，换料前先认元件。'
  },
  {
    id: 'p-smd-4r7',
    mode: 'smd',
    code: '4R7',
    label: '贴片 4R7 → 4.7µH',
    summary: 'R 即小数点：4.7µH',
    note: '小于 10µH 的值第三位补不出负指数，改用 R 记法。4R7 与 101（100µH）是维修换料时最容易拿混的相邻档位。'
  },
  {
    id: 'p-smd-r47',
    mode: 'smd',
    code: 'R47',
    label: '贴片 R47 → 0.47µH',
    summary: 'R 开头：0.47µH',
    note: 'R 开头表示整数为 0：R47 = 0.47µH = 470nH。0R5 = 0.5µH 同理。'
  },
  {
    id: 'p-rev-4r7',
    mode: 'smdRev',
    value: '4.7',
    label: '反查 4.7µH → 4R7',
    summary: '三位码无解（需负乘数），R 记法 4R7',
    note: '4.7µH 用三位码写不出（10 的负 1 次方不存在），板上应印 4R7；反查模式会同时给出两种标注的可标性。'
  }
]

function applyPreset(p) {
  activePresetId.value = p.id
  activePresetNote.value = p.note
  mode.value = p.mode
  if (p.mode === 'band') {
    band1.value = p.setup.band1
    band2.value = p.setup.band2
    bandMult.value = p.setup.bandMult
    bandTol.value = p.setup.bandTol
  } else if (p.mode === 'smd') {
    smdCode.value = p.code
  } else if (p.mode === 'smdRev') {
    smdRevText.value = p.value
  }
}

function resetAll() {
  mode.value = 'band'
  band1.value = 1
  band2.value = 0
  bandMult.value = 'x1'
  bandTol.value = 't5'
  bandRevText.value = '4.7'
  smdCode.value = '101'
  smdRevText.value = '100'
  convState.value = { h: '0.001', mh: '1', uh: '1000', nh: '1000000' }
  activeConvKey.value = 'uh'
  activePresetId.value = ''
  activePresetNote.value = ''
}

// ---------- 复制（剪贴板 API 仅在事件回调中使用，反馈用 alert，SSR 安全） ----------
const currentSummaryText = computed(() => {
  if (mode.value === 'band' && bandForward.value.ok) {
    const r = bandForward.value
    return `${r.bandNamesText}（色环电感）= ${r.formatted} µH，误差 ${r.tolText}，区间 ${r.minText}~${r.maxText} µH`
  }
  if (mode.value === 'bandRev' && bandReverse.value && bandReverse.value.ok) {
    const r = bandReverse.value
    return `${r.targetText} µH → 色环组合 ${r.comboText}${r.exact ? '' : `（最近标称 ${r.reprText} µH，偏差 ${r.deviationText}）`}`
  }
  if (mode.value === 'smd' && smdForward.value.ok) {
    const r = smdForward.value
    return `${r.norm}（贴片电感）= ${r.formatted} µH`
  }
  if (mode.value === 'smdRev' && smdReverse.value && smdReverse.value.ok) {
    const r = smdReverse.value
    const parts = []
    if (r.threeDigit) parts.push(`三位码 ${r.threeDigit}`)
    if (r.rCode) parts.push(`R 记法 ${r.rCode}`)
    if (r.nhCode) parts.push(`nH 记法 ${r.nhCode}`)
    return `${r.targetText} µH → ${parts.join(' / ') || '无标准标号'}`
  }
  return ''
})

function copyResult() {
  const text = currentSummaryText.value
  if (!text) return
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => { alert('已复制到剪贴板：\n' + text) },
        () => { alert('复制失败，请手动选择文本复制') }
      )
    } else {
      alert('当前环境不支持自动复制，请手动选择文本')
    }
  } catch {
    alert('复制失败，请手动选择文本复制')
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 本地持久化（localStorage 仅在 onMounted 内访问，SSR 安全） ----------
onMounted(() => {
  addRecentTool('inductor-code-reader')
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      if (saved && typeof saved === 'object') {
        if (modeTabs.some(t => t.key === saved.mode)) mode.value = saved.mode
        if (Number.isInteger(saved.band1) && saved.band1 >= 0 && saved.band1 <= 9) band1.value = saved.band1
        if (Number.isInteger(saved.band2) && saved.band2 >= 0 && saved.band2 <= 9) band2.value = saved.band2
        if (MULTIPLIERS.some(m => m.key === saved.bandMult)) bandMult.value = saved.bandMult
        if (TOLERANCES.some(t => t.key === saved.bandTol)) bandTol.value = saved.bandTol
        if (typeof saved.bandRevText === 'string') bandRevText.value = saved.bandRevText
        if (typeof saved.smdCode === 'string') smdCode.value = saved.smdCode
        if (typeof saved.smdRevText === 'string') smdRevText.value = saved.smdRevText
        if (saved.convState && typeof saved.convState === 'object') {
          const c = saved.convState
          convState.value = {
            h: typeof c.h === 'string' ? c.h : convState.value.h,
            mh: typeof c.mh === 'string' ? c.mh : convState.value.mh,
            uh: typeof c.uh === 'string' ? c.uh : convState.value.uh,
            nh: typeof c.nh === 'string' ? c.nh : convState.value.nh
          }
        }
      }
    }
  } catch {
    // 本地存储不可用或内容损坏时忽略，使用默认值
  }
  watch(
    [mode, band1, band2, bandMult, bandTol, bandRevText, smdCode, smdRevText, convState],
    () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          mode: mode.value,
          band1: band1.value,
          band2: band2.value,
          bandMult: bandMult.value,
          bandTol: bandTol.value,
          bandRevText: bandRevText.value,
          smdCode: smdCode.value,
          smdRevText: smdRevText.value,
          convState: convState.value
        }))
      } catch {
        // 忽略写入失败（隐私模式等）
      }
    },
    { deep: true }
  )
})
</script>
