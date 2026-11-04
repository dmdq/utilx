<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Gauge class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电容标号读取器</h1>
          <p class="text-sm text-muted-foreground mt-1">三位数代码 104 秒读 0.1µF、直标值反查标号、贴片电容 / 电阻双解、pF/nF/µF 三框联动换算、J K M Z 误差码对照</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线电容标号读取器：瓷片电容、贴片 MLCC 上只印着「104」「223」「101」这样的小数字，本工具把这套三位数代码正着读——按「前两位有效数字 + 第三位零的个数（口径 pF）」
        即时换算成 100 nF / 0.1 µF 这类看得懂的值，并附带 J / K / M / Z 误差字母与允许区间；反过来输入 100nF、0.1µF、4.7µF 也能生成该印哪三个数字（0.1µF → 104）。
        贴片封装电容与电阻代码同构但口径不同，还提供电阻 / 电容双解模式、pF–nF–µF 单位链联动换算、去耦常用标号速查表与电解 / 钽 / 薄膜电容的直标和极性科普。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：模式切换 + 输入 + 预设 -->
      <div class="space-y-4">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <!-- 三合一模式 tab -->
          <div class="grid grid-cols-3 gap-1.5 p-1 bg-muted/50 rounded-lg">
            <button
              @click="mode = 'forward'"
              :class="[
                'px-2 py-2 rounded-md text-sm font-medium transition',
                mode === 'forward' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              ]"
            >
              代码读数
            </button>
            <button
              @click="mode = 'reverse'"
              :class="[
                'px-2 py-2 rounded-md text-sm font-medium transition',
                mode === 'reverse' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              ]"
            >
              直标反查
            </button>
            <button
              @click="mode = 'smd'"
              :class="[
                'px-2 py-2 rounded-md text-sm font-medium transition',
                mode === 'smd' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              ]"
            >
              贴片双解
            </button>
          </div>

          <!-- 模式一：三位数代码 -->
          <template v-if="mode === 'forward'">
            <div>
              <label class="block text-sm font-medium mb-2 text-foreground">电容标号代码</label>
              <input
                v-model="fCode"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                spellcheck="false"
                placeholder="如 104、223K、470、1003"
                class="w-full px-3 py-2 rounded-md border border-border border-border bg-background text-sm font-mono uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
              <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
                前 {{ fCodeDigits.length === 4 ? '三' : '两' }} 位是有效数字，末位数字是 0 的个数，<span class="font-medium text-foreground">单位 pF</span>；后缀字母是误差码（可不填）。
              </p>
              <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                <span class="text-xs text-muted-foreground mr-1">误差字母：</span>
                <button
                  v-for="letter in tolChipLetters"
                  :key="letter"
                  @click="setTolLetter(letter)"
                  :class="[
                    'px-2.5 py-1 rounded-md border text-xs font-mono transition',
                    fCodeSuffix === letter
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                  ]"
                >
                  {{ letter }}
                </button>
                <button
                  @click="clearTolLetter"
                  :class="[
                    'px-2.5 py-1 rounded-md border text-xs transition',
                    fCodeSuffix === ''
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                  ]"
                >
                  无
                </button>
              </div>
              <p class="text-[11px] text-muted-foreground mt-2">
                {{ fCodeSuffix ? `当前后缀 ${fCodeSuffix} = ${fCodeSuffixInfo ? fCodeSuffixInfo.text : '未知字母'}` : '未标误差字母时，瓷片电容一般按 ±20%（M 档）对待。' }}
              </p>
            </div>

            <p
              v-if="!forwardResult.ok && forwardResult.error !== '待输入'"
              class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5 bg-red-500/10 text-red-600"
            >
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ forwardResult.error }}</span>
            </p>
          </template>

          <!-- 模式二：直标反查 -->
          <template v-else-if="mode === 'reverse'">
            <div>
              <label class="block text-sm font-medium mb-2 text-foreground">已知容量（带单位）</label>
              <input
                v-model="rText"
                type="text"
                autocomplete="off"
                spellcheck="false"
                placeholder="如 100nF / 0.1µF / 22p / 4.7uF / 1e5pF"
                class="w-full px-3 py-2 rounded-md border border-border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
              <p class="text-[10px] font-mono mt-1 leading-tight" :class="reverseParsed.error && reverseParsed.error !== '待输入' ? 'text-red-500' : 'text-muted-foreground'">
                {{ reverseParsed.pF === null
                  ? (reverseParsed.error === '待输入' ? '输入一个带单位的容量即可反查标号' : reverseParsed.error)
                  : `解析为 ${formatCapOf(reverseParsed.pF)} = ${fmtCapNumber(reverseParsed.pF)} pF` }}
              </p>
              <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
                支持 µF / uF、nF、pF（可省略 F）与科学计数法；单位必须写——「104」这种纯数字请先切到「代码读数」。
              </p>
            </div>
          </template>

          <!-- 模式三：贴片双解 -->
          <template v-else>
            <div>
              <label class="block text-sm font-medium mb-2 text-foreground">三位数贴片代码</label>
              <input
                v-model="sCode"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                spellcheck="false"
                placeholder="如 103、475、220"
                class="w-full px-3 py-2 rounded-md border border-border border-border bg-background text-sm font-mono uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
              <div class="flex items-center gap-1.5 mt-3">
                <span class="text-xs text-muted-foreground mr-1">主单位后缀：</span>
                <button
                  @click="sUnit = 'cap'"
                  :class="[
                    'px-3 py-1.5 rounded-md border text-xs font-medium transition',
                    sUnit === 'cap' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                  ]"
                >
                  pF（电容）
                </button>
                <button
                  @click="sUnit = 'res'"
                  :class="[
                    'px-3 py-1.5 rounded-md border text-xs font-medium transition',
                    sUnit === 'res' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                  ]"
                >
                  Ω（电阻）
                </button>
              </div>
              <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
                同一串数字，装在电容上按 pF 口径读、装在电阻上按 Ω 口径读——数字规则完全相同。右侧两栏同时给出双解，选中项高亮。
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

        <!-- 预设案例 -->
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
      </div>

      <!-- 右侧：读数结果 + 换算 + 速查 + 科普（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 计算结果 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <h2 class="text-lg font-semibold flex items-center">
              <CheckCircle class="w-5 h-5 mr-2 text-primary" />
              {{ mode === 'forward' ? '读数结果' : mode === 'reverse' ? '反查标号' : '电容 / 电阻双解' }}
            </h2>
            <button
              v-if="currentSummaryText"
              @click="copyResult"
              class="px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-xs text-muted-foreground transition flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> {{ copyState }}
            </button>
          </div>

          <!-- 正读 -->
          <template v-if="mode === 'forward'">
            <template v-if="forwardResult.ok">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1 font-mono">{{ forwardResult.norm }} · {{ forwardResult.sigText }}</p>
                <p class="text-3xl font-bold text-primary font-mono">{{ forwardResult.formatted }}</p>
                <p class="text-xs text-muted-foreground mt-1 font-mono">
                  = {{ forwardResult.pfText }} pF = {{ fmtNumText(forwardResult.nF) }} nF = {{ fmtNumText(forwardResult.uF) }} µF
                </p>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div v-for="item in forwardStats" :key="item.label" class="bg-muted/40 border border-border rounded-lg p-3">
                  <p class="text-[10px] text-muted-foreground mb-1">{{ item.label }}</p>
                  <p class="text-sm font-bold font-mono" :class="item.tone">{{ item.value }}</p>
                </div>
              </div>
              <p
                class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5"
                :class="forwardResult.tol ? 'bg-green-500/10 text-green-600' : 'bg-muted/60 text-foreground'"
              >
                <component :is="forwardResult.tol ? CheckCircle : Info" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span v-if="forwardResult.tol">
                  {{ forwardResult.tol.letter }} = {{ forwardResult.tol.text }}，允许区间 {{ fmtCapNumber(forwardResult.min) }} ~ {{ fmtCapNumber(forwardResult.max) }} pF（{{ forwardResult.tol.use }}）。
                </span>
                <span v-else>未标误差字母：瓷片 / MLCC 小容量件常省略后缀，按 ±20%（M 档）对待即可；精密场合以 Datasheet 为准。</span>
              </p>
              <p v-if="forwardResult.direct" class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
                <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <span>1~2 位标号是「数字即 pF」的直标形态（常见于小容量瓷片，如「22」= 22pF、「47」= 47pF），不走乘零规则。</span>
              </p>
              <p v-if="forwardResult.four" class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
                <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <span>4 位标号 = 前三位有效数字 + 末位零个数，是部分贴片 / 薄膜电容的三位有效版本（如 1003 = 100000pF = 100nF）。</span>
              </p>
            </template>
            <p v-else class="text-sm text-muted-foreground leading-relaxed">
              {{ forwardResult.error === '待输入' ? '在左侧输入 3 位标号（如 104），或点速查表任意一行，这里立即给出 pF / nF / µF 三档读数。' : forwardResult.error }}
            </p>
          </template>

          <!-- 反查 -->
          <template v-else-if="mode === 'reverse'">
            <template v-if="reverseResult && reverseResult.ok">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1 font-mono">{{ reverseResult.sigText }}（{{ reverseResult.exact ? '精确' : '就近取两位有效' }}）</p>
                <p class="text-3xl font-bold text-primary font-mono">{{ reverseResult.code }}</p>
                <p class="text-xs text-muted-foreground mt-1 font-mono">
                  {{ reverseResult.exact ? '' : '≈ ' }}编码回读 = {{ formatCapOf(reverseResult.repr) }} · 输入 {{ formatCapOf(reverseParsed.pF) }}
                </p>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div v-for="item in reverseStats" :key="item.label" class="bg-muted/40 border border-border rounded-lg p-3">
                  <p class="text-[10px] text-muted-foreground mb-1">{{ item.label }}</p>
                  <p class="text-sm font-bold font-mono" :class="item.tone">{{ item.value }}</p>
                </div>
              </div>
              <p
                class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5"
                :class="reverseBadge.tone"
              >
                <component :is="reverseBadge.icon" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{{ reverseBadge.text }}</span>
              </p>
            </template>
            <p v-else-if="reverseParsed.error && reverseParsed.error !== '待输入'" class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5 bg-red-500/10 text-red-600">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ reverseParsed.error }}</span>
            </p>
            <p v-else class="text-sm text-muted-foreground leading-relaxed">
              在左侧输入容量（如 <span class="font-mono">100nF</span>、<span class="font-mono">0.1µF</span>、<span class="font-mono">4.7µF</span>），这里给出板上该印的三位标号。
            </p>
          </template>

          <!-- 双解 -->
          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                class="rounded-lg p-4 text-center border transition"
                :class="sUnit === 'cap' ? 'border-primary bg-primary/10' : 'border-border bg-muted/40'"
              >
                <p class="text-[10px] text-muted-foreground mb-1">按电容读（pF 口径）</p>
                <template v-if="smdCap.ok">
                  <p class="text-2xl font-bold text-primary font-mono">{{ smdCap.formatted }}</p>
                  <p class="text-[11px] text-muted-foreground mt-1 font-mono">
                    {{ smdCap.sigText }} = {{ smdCap.pfText }} pF = {{ fmtNumText(smdCap.uF) }} µF
                  </p>
                </template>
                <p v-else class="text-xs text-red-600 leading-relaxed py-2">{{ smdCap.error }}</p>
              </div>
              <div
                class="rounded-lg p-4 text-center border transition"
                :class="sUnit === 'res' ? 'border-primary bg-primary/10' : 'border-border bg-muted/40'"
              >
                <p class="text-[10px] text-muted-foreground mb-1">按电阻读（Ω 口径）</p>
                <template v-if="smdRes.ok">
                  <p class="text-2xl font-bold" :class="sUnit === 'res' ? 'text-primary' : 'text-foreground font-mono'">{{ smdRes.formatted }}</p>
                  <p class="text-[11px] text-muted-foreground mt-1 font-mono">{{ smdRes.sigText }}</p>
                </template>
                <p v-else class="text-xs text-red-600 leading-relaxed py-2">{{ smdRes.error }}</p>
              </div>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>读数规则同构、只是口径不同：103 = 电容 10nF = 电阻 10kΩ；475 = 电容 4.7µF = 电阻 4.7MΩ。「000」只在电阻上出现，是 0Ω 跳线；「数字+字母」（如 68C）属 EIA-96 精密码，不在本模式口径内，详见下方说明。</span>
            </p>
          </template>
        </div>

        <!-- pF / nF / µF 单位换算卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CircleDot class="w-5 h-5 mr-2 text-primary" /> 电容单位换算（改任意框，其余自动联动）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div v-for="field in convFields" :key="field.key" class="bg-muted/40 border border-border rounded-lg p-3">
              <label class="block text-xs font-medium text-foreground mb-1.5">{{ field.label }}</label>
              <input
                :value="field.text"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                spellcheck="false"
                @input="onConvInput(field.key, $event)"
                class="w-full px-2.5 py-1.5 rounded-md border border-border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
              <p class="text-[10px] text-muted-foreground mt-1.5">{{ field.hint }}</p>
            </div>
          </div>
          <p v-if="convResult.ok" class="text-sm font-mono text-center bg-primary/10 rounded-lg p-3 text-primary">
            {{ fmtCapNumber(convResult.pF) }} pF = {{ fmtNumText(convResult.nF) }} nF = {{ fmtNumText(convResult.uF) }} µF<span v-if="convResult.codeHint" class="text-muted-foreground"> · 对应标号 {{ convResult.codeHint }}</span>
          </p>
          <p v-else class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>该框内容无法解析为数字（支持 100000、0.1、1e5 等写法，可带千分位逗号）。</span>
          </p>
          <p class="text-xs text-muted-foreground">换算链：1 µF = 1000 nF = 1,000,000 pF；µF 写作 u 也可识别。</p>
        </div>

        <!-- 常见标号速查表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 常见电容标号速查
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              v-for="row in quickRows"
              :key="row.code"
              @click="applyQuickRow(row)"
              class="text-left px-3 py-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted transition"
              title="点击载入「代码读数」模式核对"
            >
              <p class="text-sm font-bold font-mono" :class="row.code === '104' ? 'text-primary' : 'text-foreground'">{{ row.code }}</p>
              <p class="text-xs font-mono text-foreground mt-1">{{ row.formatted }}</p>
              <p class="text-[10px] text-muted-foreground font-mono mt-0.5">{{ row.pfText }} pF</p>
            </button>
          </div>
          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <CheckCircle class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>去耦常用 104 = 100nF = 0.1µF：数字电路每个 IC 电源引脚旁那颗「小黄片 / 小蓝块」几乎都是它。原理图标 100nF、料单写 0.1µF、丝印 104，是同一个东西的三种写法。</span>
          </p>
        </div>

        <!-- 科普卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CircleDot class="w-5 h-5 mr-2 text-primary" /> 电容类别、极性与误差字母速记
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="t in typeRows" :key="t.name" class="bg-muted/40 border border-border rounded-lg p-3 space-y-1.5">
              <p class="text-sm font-medium text-foreground">{{ t.name }}</p>
              <p class="text-xs text-muted-foreground font-mono">{{ t.marks }}</p>
              <p class="text-xs text-foreground leading-relaxed">{{ t.tip }}</p>
            </div>
          </div>
          <div>
            <p class="text-sm font-medium text-foreground mb-2">误差字母对照</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div v-for="t in tolRows" :key="t.letter" class="bg-muted/40 border border-border rounded-lg px-3 py-2">
                <p class="text-xs font-mono font-bold text-foreground">{{ t.letter }} = {{ t.text }}</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">{{ t.use }}</p>
              </div>
            </div>
          </div>
          <div>
            <p class="text-sm font-medium text-foreground mb-2">耐压常怎么标（贴片 / 插件小表）</p>
            <div class="space-y-1.5">
              <div v-for="v in voltageRows" :key="v.kind" class="flex items-start gap-2 text-xs bg-muted/40 border border-border rounded-lg px-3 py-2">
                <span class="w-28 flex-shrink-0 text-muted-foreground">{{ v.kind }}</span>
                <span class="text-foreground">{{ v.marks }}</span>
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground mt-2">提示：贴片小容量 MLCC 大多不印耐压，按封装默认 50V 对待再结合料号核对；电解 / 钽的耐压一律直标，替换时耐压只可取高不可取低。</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>电容标号读取器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          电容标号读取器是一款面向电子维修、硬件爱好者和学生的在线电容读数工具。瓷片电容、贴片 MLCC 体积太小印不下「0.1µF」这样的完整字样，
          行业约定用三位数字代替：前两位是有效数字、第三位是末尾零的个数、基准单位是 pF。本工具把这套约定做成双向查询——
          正着输入 104 / 223 / 101 立即得到 pF、nF、µF 三档读数和误差区间，反着输入 100nF、0.1µF、4.7µF 也能生成该印哪三位数字，
          并提供贴片电容与电阻的同码双解、单位换算联动、常见标号速查与电解 / 钽 / 薄膜电容的极性科普。全部计算在浏览器本地完成，不联网、不上传、不写入任何本地存储。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">电容三位数怎么读（与电阻口径不同在 pF）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          规则只有一句话：<span class="font-medium text-foreground">前两位有效数字 + 第三位补零个数，单位 pF</span>。例如「104」= 1、0 后面补 4 个零 = 100000 pF；
          「223」= 22000 pF = 22 nF；第三位是 0 也合法，表示 ×1 不补零，如「470」= 47 pF。注意别和电阻丝印混淆：电阻的三位数代码规则相同但口径是 Ω（103 = 10kΩ），
          电容的口径是 pF（103 = 10nF）——同一串数字在不同元件上是十倍量级差别的两回事，贴片双解模式就是为对照这一口而设。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两个容易手算翻车的边界：<span class="font-medium text-foreground">「101」是 100 pF 而不是 10 pF</span>（前两位 10 本身就要保留，末尾再补一个 0）；
          小容量瓷片常直接印 1~2 位数字（「22」就是 22 pF、「4」就是 4 pF），这种直标形态不补零，本工具会明确区分标注。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么 104 是 0.1µF（单位推导）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          104 → 10 × 10⁴ = 100,000 pF。而 1 µF = 10⁶ pF，所以 100,000 ÷ 1,000,000 = 0.1 µF；中间档 1 nF = 10³ pF，故也是 100 nF。
          同理可推：105 = 1,000,000 pF = 1 µF；475 = 4,700,000 pF = 4.7 µF；223 = 22,000 pF = 22 nF = 0.022 µF。
          反查方向则是把容量先化成整皮法，再写成「两位有效数字 × 10 的幂」：0.1 µF = 100000 pF → 「10」+ 4 个零 → 104；4.7 µF = 4700000 pF → 「47」+ 5 个零 → 475。
          若容量换算成 pF 后不是整数或超过两位有效（如 123 pF），三位数代码只能就近取两位有效（121 ≈ 120 pF），工具会标注偏差。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">误差字母 J / K / M / Z 对照</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          代码后面的单个字母只说误差、不改容量：F ±1%、G ±2%、J ±5%、K ±10%、M ±20%、Z 为 +80% / −20%（高介电常数瓷片专用，只往下掉不往上超太多以外的方向看，实际容量普遍偏大）。
          所以 104K 与 104J 都是 0.1µF，只是 ±10% 与 ±5% 的区别；大量便宜的瓷片电容干脆不印字母，按 ±20% 对待即可。
          薄膜电容常印「104J63V」连写：代码 + 误差 + 耐压三段信息挤在一行，识别方法见下方「直标和代码并存怎么认」。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">EIA-96 码和三位数码的区别</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          严格意义的 EIA-96 是精密贴片电阻用的「两位数字 + 一位字母」：两位数字不是有效数字本身，而是 E96 表（每十倍频 96 档）的序号，字母代表倍率
          （A=×1、B=×10、C=×100、D=×1000、E=×10⁴、F=×10⁵，更小倍率用历史字母 Z/X/Y）。例如「68C」查表得有效数 499、倍率 ×100 = 49.9 kΩ。
          而三位数纯数字码（104、475）是两位有效 + 补零，精度一般只覆盖 E24（±5%）档位，电容丝印几乎全部用这套纯数字约定。
          本工具的贴片双解模式读的是纯数字码；遇到「数字 + 字母」的贴片电阻（01A、68C、10X 之类）请查 EIA-96 表，工具会明确提示而不是硬读。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">直标和代码并存怎么认</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一眼分三档：<span class="font-medium text-foreground">印着 µF / pF / n 字样或带小数点的</span>（470µF 16V、1µF 50V、4.7p）是直标，直接读；
          <span class="font-medium text-foreground">只有 1~3 位纯数字的</span>按代码读（1~2 位 = 直标 pF，3 位 = 补零规则），默认单位 pF；
          <span class="font-medium text-foreground">代码后紧跟字母再跟电压的连写</span>（104J63V、223K2KV）是薄膜 / 瓷片的混合标法，拆成「代码 + 误差 + 耐压」三段。
          极性方面：电解电容新件长脚为正、壳体白条一侧为负；钽电容恰好相反，带横线（色块）的一端是正极——接反电解会鼓包爆浆，接反钽可能直接冒烟，务必先确认再上电。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">电容上印的 104 是多少？怎么读出来的？</h3>
            <p class="text-sm text-muted-foreground mt-1">是 100nF，也就是 0.1µF。三位数代码按「前两位有效数字 + 第三位零的个数、单位 pF」读：104 → 10 后面补 4 个零 → 100000pF；因 1µF = 10⁶pF，故合 0.1µF。它是数字电路 IC 电源引脚旁最常见的去耦电容。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">电容和电阻的三位数代码一样吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">规则同构（前两位有效数字 + 第三位补零），但口径不同：电阻以 Ω 为单位，电容以 pF 为单位。同一串「103」，电阻是 10kΩ，电容是 10nF。看错元件类型会差出十倍以上的量，用本页「贴片双解」模式对照最稳。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">代码后面的字母 J / K / M 是什么意思？</h3>
            <p class="text-sm text-muted-foreground mt-1">是允许偏差：J ±5%、K ±10%、M ±20%，精密薄膜还有 F ±1%、G ±2%；Z 表示 +80%/−20% 的高介电档。误差字母不改变标称容量，104K 与 104J 都是 0.1µF，只是替换时对精度的要求不同。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么 101 是 100pF 不是 10pF？</h3>
            <p class="text-sm text-muted-foreground mt-1">前两位「10」整体是有效数字，第三位只是末尾零的个数：10 × 10¹ = 100pF。若想要 10pF，应看 1~2 位直标形态（板上直接印「10」），或选择误差更宽的高介电容差件。手算时把第三位当成「总位数」是最常见的读错方式。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'capacitor-code-reader'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Gauge, CircleDot, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '电容标号读取器 - 电容104读数/贴片电容代码反查与单位换算工具',
  description: '免费在线电容标号读取器，三位数代码 104/223/101 秒读容量并换算 pF/nF/µF，输入 0.1µF、100nF 反查丝印标号，贴片电容电阻同码双解，J K M Z 误差字母对照，附去耦常用 104 速查表与电容极性科普，纯浏览器本地计算不上传',
  keywords: '电容读数,电容标号 104,贴片电容代码,瓷片电容读数,电容单位换算',
  author: '有条工具',
  ogTitle: '电容标号读取器 - 电容104读数/贴片电容代码反查与单位换算工具 | 有条工具',
  ogDescription: '104=0.1µF 三位数代码正读反查，pF/nF/µF 联动换算，电容电阻同码双解，误差字母对照，纯本地运行。',
  ogUrl: 'https://www.util.cn/tools/capacitor-code-reader',
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
          name: '电容标号读取器',
          url: 'https://www.util.cn/tools/capacitor-code-reader',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '104 / 223 / 101 三位数代码即读容量',
            '输入 0.1µF / 100nF 反查丝印标号',
            'pF / nF / µF 三框联动单位换算',
            'J K M Z 误差字母与允许区间',
            '贴片电容 / 电阻同码双解对照',
            '去耦常用标号速查表',
            '电解 / 钽 / 薄膜类别与极性科普',
            '本地计算不上传数据'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '电容标号读取器', item: 'https://www.util.cn/tools/capacitor-code-reader/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '电容上印的104是多少？怎么读出来的？',
              acceptedAnswer: { '@type': 'Answer', text: '是100nF，也就是0.1µF。三位数代码按「前两位有效数字+第三位零的个数、单位pF」读：104 → 10 后面补4个零 → 100000pF；因1µF=10⁶pF，故合0.1µF。它是数字电路IC电源引脚旁最常见的去耦电容。' }
            },
            {
              '@type': 'Question',
              name: '电容和电阻的三位数代码一样吗？',
              acceptedAnswer: { '@type': 'Answer', text: '规则同构（前两位有效数字+第三位补零），但口径不同：电阻以Ω为单位，电容以pF为单位。同一串103，电阻是10kΩ，电容是10nF。看错元件类型会差出十倍以上的量，可用本工具的贴片双解模式对照。' }
            },
            {
              '@type': 'Question',
              name: '代码后面的字母J/K/M是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '是允许偏差：J ±5%、K ±10%、M ±20%，精密薄膜还有F ±1%、G ±2%；Z表示+80%/−20%的高介电档。误差字母不改变标称容量，104K与104J都是0.1µF，只是精度等级不同。' }
            },
            {
              '@type': 'Question',
              name: '为什么101是100pF不是10pF？',
              acceptedAnswer: { '@type': 'Answer', text: '前两位「10」整体是有效数字，第三位只是末尾零的个数：10×10¹=100pF。想要10pF应看板上直接印「10」的1~2位直标形态。手算时把第三位当成「总位数」是最常见的读错方式。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 消浮点噪声：1e5 / 1e3 之类的除法结果统一按有效位取整
function roundSig(x, precision) {
  const n = Number(x)
  if (!Number.isFinite(n)) return n
  return Number(n.toPrecision(precision || 12))
}

// 通用数字解析：千分位逗号 / 科学计数法均可，失败返回 null
function toNum(text) {
  const s = String(text === null || text === undefined ? '' : text).trim().replace(/,/g, '').replace(/^=/, '')
  if (!s) return null
  if (!/^(\d+(\.\d+)?|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// 数字 → 输入框友好文本（去浮点尾数，极端量级走指数）
function fmtNumText(x) {
  const n = roundSig(x, 10)
  if (!Number.isFinite(n)) return '—'
  if (n !== 0 && (Math.abs(n) >= 1e21 || Math.abs(n) < 1e-6)) return String(n.toExponential(4))
  return String(n)
}

// pF 口径数字带千分位：100000 → "100,000"；小数退回 fmtNumText
function fmtCapNumber(x) {
  const n = roundSig(x, 12)
  if (!Number.isFinite(n)) return '—'
  if (!Number.isInteger(n)) return fmtNumText(n)
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US')
  return String(n)
}

// 指数上标文本：×10⁴（4.7µF 反查即 47 ×10⁵ → 475）
const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
function supDigits(num) {
  return String(num).split('').map((ch) => (ch === '-' ? '⁻' : SUP[Number(ch)])).join('')
}
function fmtExpText(z) {
  return `×10${supDigits(Number(z))}`
}

// 容量（pF）→ 自动选档文本：100000 → "100 nF"；4.7e6 → "4.7 µF"；47 → "47 pF"
function formatCapOf(pF) {
  const n = Number(pF)
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n >= 1e6) return `${fmtNumText(roundSig(n / 1e6, 6))} µF`
  if (n >= 1e3) return `${fmtNumText(roundSig(n / 1e3, 6))} nF`
  return `${fmtNumText(n)} pF`
}

// 阻值（Ω）→ 自动选档文本（贴片双解用）
function formatResOf(ohms) {
  const n = Number(ohms)
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n >= 1e6) return `${fmtNumText(roundSig(n / 1e6, 6))} MΩ`
  if (n >= 1e3) return `${fmtNumText(roundSig(n / 1e3, 6))} kΩ`
  return `${fmtNumText(n)} Ω`
}

// 误差字母表：percent 为对称误差档，Z 为非对称（+80/−20）用 min/maxFactor 表达
const TOL_LETTERS = {
  F: { letter: 'F', percent: 1, text: '±1%', minFactor: 0.99, maxFactor: 1.01, use: '精密薄膜' },
  G: { letter: 'G', percent: 2, text: '±2%', minFactor: 0.98, maxFactor: 1.02, use: '精密薄膜' },
  J: { letter: 'J', percent: 5, text: '±5%', minFactor: 0.95, maxFactor: 1.05, use: '高频瓷片 / 薄膜（104J）' },
  K: { letter: 'K', percent: 10, text: '±10%', minFactor: 0.9, maxFactor: 1.1, use: 'MLCC 常见后缀（104K）' },
  M: { letter: 'M', percent: 20, text: '±20%', minFactor: 0.8, maxFactor: 1.2, use: '普通瓷片（无后缀多为该档）' },
  Z: { letter: 'Z', percent: null, text: '+80% / −20%', minFactor: 0.8, maxFactor: 1.8, use: '高介电常数（Y5V 类）' }
}
// 误差码查询：命中返回表项，未知字母返回 null
function tolOf(letter) {
  const L = String(letter === null || letter === undefined ? '' : letter).trim().toUpperCase()
  return TOL_LETTERS[L] || null
}

// 正向核心：电容标号 → { pF, nF, uF, 误差, 区间 }
// 口径：3 位 = 前两位有效 + 第三位零个数（pF）；4 位 = 前三位有效 + 末位零个数；
// 1~2 位 = 「数字即 pF」直标；第三位（或末位）为 0 合法：×1，如 470 → 47pF；
// 101 = 10 + 1 个零 = 100pF（非 10pF）；后缀字母为可选误差码。
function codeToCapOf(code) {
  const raw = String(code === null || code === undefined ? '' : code).trim().toUpperCase().replace(/\s+/g, '')
  if (!raw) return { ok: false, error: '待输入' }
  const m = raw.match(/^(\d{1,4})([A-Z])?$/)
  if (!m) {
    return { ok: false, error: `无法读「${raw}」：需 3 位数字（可带 J/K/M/Z/F/G 误差后缀），如 104K；出现「10K4 / 2R2」这类写法的通常是电阻值而不是电容标号` }
  }
  const digits = m[1]
  const letter = m[2] || null
  if (/^0+$/.test(digits)) {
    return { ok: false, error: `「${digits}」是贴片电阻 0Ω 跳线的标法，电容上不存在该代码` }
  }
  if (digits[0] === '0') {
    return { ok: false, error: `「${digits}」首位为 0 不携带信息，3 位代码首位须为 1~9（如 47pF 印 470）` }
  }
  let sig, zeros, direct = false, four = false
  if (digits.length === 3) { sig = Number(digits.slice(0, 2)); zeros = Number(digits[2]) }
  else if (digits.length === 4) { sig = Number(digits.slice(0, 3)); zeros = Number(digits[3]); four = true }
  else { sig = Number(digits); zeros = 0; direct = true }

  const pF = roundSig(sig * Math.pow(10, zeros), 12)
  if (!Number.isFinite(pF) || pF <= 0) return { ok: false, error: '容量超出可处理范围' }

  let tol = null
  if (letter) {
    tol = tolOf(letter)
    if (!tol) return { ok: false, error: `「${letter}」不是有效误差字母（支持 F / G / J / K / M / Z）` }
  }
  const sigText = direct
    ? `${digits} pF（数字即容量）`
    : `${String(sig).split('').join(' ')} ${fmtExpText(zeros)}`

  return {
    ok: true,
    norm: digits + (letter || ''),
    digits,
    sig,
    zeros,
    direct,
    four,
    pF,
    nF: roundSig(pF / 1e3, 12),
    uF: roundSig(pF / 1e6, 12),
    pfText: fmtCapNumber(pF),
    formatted: formatCapOf(pF),
    sigText,
    tol,
    min: tol ? roundSig(pF * tol.minFactor, 10) : null,
    max: tol ? roundSig(pF * tol.maxFactor, 10) : null
  }
}

// 反向核心：容量（pF 数值）→ 三位标号
// 精确路径：找 z 使 n / 10^z 为 [10,99] 的整数 → 该两位数 + z；
// 无法精确编码（多位有效且非整十倍数，如 123pF）时就近取两位有效并给出偏差；
// 4.7µF = 4700000pF → 「47」+ ×10⁵ → 475。
function capToCodeOf(pFValue) {
  const n = roundSig(Number(pFValue), 10)
  if (!Number.isFinite(n) || n <= 0) return { ok: false, error: '容量需大于 0，请输入如 100nF / 0.1µF' }
  if (n < 10) {
    return { ok: false, error: `${fmtNumText(n)} pF 不足 10pF，无法用「两位有效 + 零个数」编码（4.7pF 这类小值业界直接印「4.7」）` }
  }
  for (let z = 0; z <= 15; z++) {
    const q = roundSig(n / Math.pow(10, z), 12)
    if (Number.isInteger(q) && q >= 10 && q <= 99) {
      return {
        ok: true, exact: true, code: `${q}${z}`, sig: q, zeros: z,
        pF: n, repr: n, deviation: 0,
        sigText: `${String(q).split('').join(' ')} ${fmtExpText(z)}`
      }
    }
  }
  let e = Math.floor(Math.log10(n) + 1e-9)
  if (e < 1) e = 1
  const sig = Math.min(99, Math.max(10, Math.round(roundSig(n / Math.pow(10, e - 1), 12))))
  const zeros = e - 1
  const repr = roundSig(sig * Math.pow(10, zeros), 12)
  return {
    ok: true, exact: false, code: `${sig}${zeros}`, sig, zeros,
    pF: n, repr, deviation: roundSig(((repr - n) / n) * 100, 4),
    sigText: `${String(sig).split('').join(' ')} ${fmtExpText(zeros)}`
  }
}

// 直标输入解析：100nF / 0.1µF / 0.1uF / 22p / 1e5pF（大小写不限，必须带单位）
function parseCapInputOf(input) {
  const raw = String(input === null || input === undefined ? '' : input)
    .trim().toLowerCase().replace(/\s+/g, '').replace(/μ|µ/g, 'u')
  if (!raw) return { pF: null, error: '待输入' }
  const m = raw.match(/^(\d+(\.\d+)?|\.\d+)(?:e(-?\d+))?(pf|nf|uf|p|n|u)f?$/)
  if (!m) {
    return { pF: null, error: `无法识别「${raw}」：请带单位 pF / nF / µF（uF 亦可），如 100nF、0.1uF、22p；想输入丝印代码请切到「代码读数」` }
  }
  const base = Number(m[1]) * Math.pow(10, m[3] === undefined ? 0 : Number(m[3]))
  const unit = m[4]
  const factor = unit === 'p' || unit === 'pf' ? 1 : unit === 'n' || unit === 'nf' ? 1e3 : 1e6
  const pF = roundSig(base * factor, 12)
  if (!Number.isFinite(pF) || pF <= 0) return { pF: null, error: '容量需大于 0' }
  return { pF, error: null }
}

// 单位换算链（1 nF = 1000 pF = 0.001 µF）：给定 pF → 三档数值
function capConvert(pFValue) {
  const n = roundSig(Number(pFValue), 12)
  return {
    pF: Number.isFinite(n) ? n : null,
    nF: Number.isFinite(n) ? roundSig(n / 1e3, 12) : null,
    uF: Number.isFinite(n) ? roundSig(n / 1e6, 12) : null
  }
}

// 电阻口径同构读数（贴片双解用）：3 位 = 两位有效 × 10^末位；2 位直标；4 位三位有效；000 = 0Ω 跳线
function codeToResOf(code) {
  const raw = String(code === null || code === undefined ? '' : code).trim().toUpperCase().replace(/\s+/g, '')
  if (!raw) return { ok: false, error: '待输入' }
  if (/^[A-Z]/.test(raw) || /\d{2}[A-Z]$/.test(raw)) {
    return { ok: false, error: '「两位数字 + 字母」（如 68C、01A）是 EIA-96 精密码，需查 96 档表，不在本模式纯数字口径内' }
  }
  if (!/^\d{2,4}$/.test(raw)) return { ok: false, error: '需 2~4 位纯数字（如 103、475）：3 位 = 两位有效 + 零个数' }
  if (/^0+$/.test(raw)) return { ok: true, jumper: true, direct: false, ohms: 0, formatted: '0 Ω（跳线）', sigText: `「${raw}」= 0Ω 跳线，仅电阻存在` }
  if (raw[0] === '0') return { ok: false, error: `「${raw}」首位为 0 不携带信息（0Ω 跳线的标法是「00」或「000」）` }
  let sig, zeros, direct = false
  if (raw.length === 2) { sig = Number(raw); zeros = 0; direct = true }
  else if (raw.length === 3) { sig = Number(raw.slice(0, 2)); zeros = Number(raw[2]) }
  else { sig = Number(raw.slice(0, 3)); zeros = Number(raw[3]) }
  const ohms = roundSig(sig * Math.pow(10, zeros), 12)
  if (!Number.isFinite(ohms) || ohms <= 0) return { ok: false, error: '阻值超出可处理范围' }
  return {
    ok: true, jumper: false, direct, ohms, formatted: formatResOf(ohms),
    sigText: direct ? `${raw} Ω（数字即阻值）` : `${String(sig).split('').join(' ')} ${fmtExpText(zeros)}`
  }
}

// ---------- 纯逻辑结束 ----------

// ---------- 静态数据 ----------
const tolChipLetters = ['J', 'K', 'M', 'Z', 'F', 'G']
const QUICK_CODES = ['101', '102', '103', '104', '105', '222', '223', '331', '471', '473']

const tolRows = [
  { letter: 'F', text: '±1%', use: '精密薄膜' },
  { letter: 'G', text: '±2%', use: '精密薄膜' },
  { letter: 'J', text: '±5%', use: '高频瓷片 / 薄膜（104J）' },
  { letter: 'K', text: '±10%', use: 'MLCC 常见后缀（104K）' },
  { letter: 'M', text: '±20%', use: '普通瓷片（无后缀多为此档）' },
  { letter: 'Z', text: '+80% / −20%', use: '高介电常数（Y5V 类）' }
]

const typeRows = [
  { name: '瓷片 / 陶瓷（含独石 MLCC）', marks: '三位数代码（pF 口径）：104、223；1~2 位数字即 pF', tip: '独石电容本质就是多层陶瓷（MLCC），与瓷片同套代码' },
  { name: '电解（铝电解）', marks: 'µF 值 + 耐压 + 温度直标：470µF 16V 105°C', tip: '极性：新件长脚为正；壳面白色窄条一侧为负，绝不可反接' },
  { name: '钽电容', marks: 'µF + 耐压直标：10µF 10V', tip: '极性与电解相反：带横线 / 色块标记的一端是正极' },
  { name: '薄膜电容', marks: '混合标法连写：104J 100V（代码 + 误差 + 耐压）', tip: '涤纶（Mylar）金属化膜最常见，读数按三段拆开' }
]

const voltageRows = [
  { kind: '贴片 / 瓷片小容量', marks: '通常不标：0402~0805 默认 50V，大容量档位降到 16V / 25V' },
  { kind: '圆瓷片（插件）', marks: '常直标：50V / 100V / 250V / 500V / 1kV' },
  { kind: '独石电容', marks: '常直标：50V ~ 100V，中压类 400V / 630V' },
  { kind: '薄膜电容', marks: '直标：63V / 100V / 160V / 250V / 400V / 630V' },
  { kind: '电解 / 固态', marks: '直标：6.3 / 10 / 16 / 25 / 35 / 50 / 63 / 100V …' },
  { kind: '钽珠 / 贴片钽', marks: '直标：常见 10 / 16 / 25 / 35V' }
]

// ---------- 交互状态 ----------
const seoContentVisible = ref(true)
const mode = ref('forward') // forward = 代码读数；reverse = 直标反查；smd = 贴片双解
const fCode = ref('104')
const rText = ref('0.1µF')
const sCode = ref('103')
const sUnit = ref('cap')
const activePresetId = ref('')
const activePresetNote = ref('')
const copyState = ref('复制读数')

// ---------- 正向：三位数代码 ----------
const forwardResult = computed(() => codeToCapOf(fCode.value))
const fCodeDigits = computed(() => (String(fCode.value).match(/^\d+/) || [''])[0])
const fCodeSuffix = computed(() => (String(fCode.value).match(/[A-Z]+$/i) || [''])[0].toUpperCase())
const fCodeSuffixInfo = computed(() => tolOf(fCodeSuffix.value))

function setTolLetter(letter) {
  if (!fCodeDigits.value) return
  fCode.value = fCodeDigits.value + letter
  activePresetId.value = ''
  activePresetNote.value = ''
}
function clearTolLetter() {
  if (!fCodeDigits.value) return
  fCode.value = fCodeDigits.value
}

const forwardStats = computed(() => {
  const r = forwardResult.value
  if (!r.ok) return []
  return [
    { label: 'pF（皮法）', value: r.pfText, tone: 'text-primary' },
    { label: 'nF（纳法）', value: fmtNumText(r.nF), tone: 'text-foreground' },
    { label: 'µF（微法）', value: fmtNumText(r.uF), tone: 'text-foreground' },
    { label: '误差后缀', value: r.tol ? `${r.tol.letter} ${r.tol.text}` : '未标', tone: r.tol ? 'text-green-600' : 'text-muted-foreground' }
  ]
})

// ---------- 反向：直标 → 标号 ----------
const reverseParsed = computed(() => parseCapInputOf(rText.value))
const reverseResult = computed(() => {
  const p = reverseParsed.value
  if (p.pF === null) return null
  return capToCodeOf(p.pF)
})

const reverseStats = computed(() => {
  const r = reverseResult.value
  if (!r || !r.ok) return []
  const c = capConvert(r.pF)
  return [
    { label: '输入 pF', value: fmtCapNumber(c.pF), tone: 'text-foreground' },
    { label: '合 nF', value: fmtNumText(c.nF), tone: 'text-foreground' },
    { label: '合 µF', value: fmtNumText(c.uF), tone: 'text-foreground' },
    { label: '编码回读', value: formatCapOf(r.repr), tone: r.exact ? 'text-green-600' : 'text-amber-600' }
  ]
})

const reverseBadge = computed(() => {
  const r = reverseResult.value
  if (!r || !r.ok) return { icon: Info, tone: 'bg-muted/60 text-foreground', text: '' }
  if (r.exact) {
    return { icon: CheckCircle, tone: 'bg-green-500/10 text-green-600', text: `${formatCapOf(r.pF)} 可被三位数代码精确编码：「${String(r.sig).split('').join(' ')}」+ ${r.zeros} 个零 = ${r.code}，板上就该印这三位。` }
  }
  return {
    icon: TriangleAlert,
    tone: 'bg-amber-500/10 text-amber-600',
    text: `该容量换算成 pF 后有 3 位以上有效数字，三位数代码只能取两位有效：标 ${r.code} 实际 = ${formatCapOf(r.repr)}（偏差 ${fmtNumText(roundSig(r.deviation, 3))}%）。容量本就不在标准档位，请核对是否选错标称值。`
  }
})

// ---------- 贴片双解 ----------
const smdCap = computed(() => codeToCapOf(sCode.value))
const smdRes = computed(() => codeToResOf(sCode.value))

// ---------- 单位换算卡 ----------
const convFactors = { pf: 1, nf: 1e3, uf: 1e6 }
const convState = ref({ pf: '100000', nf: '100', uf: '0.1' })
const activeConvKey = ref('pf')

const convFields = computed(() => [
  { key: 'pf', label: 'pF（皮法）', hint: '1 pF = 10⁻¹² F', text: convState.value.pf },
  { key: 'nf', label: 'nF（纳法）', hint: '1 nF = 10³ pF', text: convState.value.nf },
  { key: 'uf', label: 'µF（微法）', hint: '1 µF = 10⁶ pF', text: convState.value.uf }
])

const convResult = computed(() => {
  const v = toNum(convState.value[activeConvKey.value])
  if (v === null || v < 0) return { ok: false }
  const pF = roundSig(v * convFactors[activeConvKey.value], 12)
  const c = capConvert(pF)
  const enc = capToCodeOf(pF)
  return { ok: true, pF: c.pF, nF: c.nF, uF: c.uF, codeHint: enc.ok && enc.exact ? enc.code : '' }
})

function onConvInput(key, e) {
  const v = e.target.value
  activeConvKey.value = key
  const next = { ...convState.value, [key]: v }
  const n = toNum(v)
  if (n !== null && n >= 0) {
    const c = capConvert(roundSig(n * convFactors[key], 12))
    next.pf = key === 'pf' ? v : fmtNumText(c.pF)
    next.nf = key === 'nf' ? v : fmtNumText(c.nF)
    next.uf = key === 'uf' ? v : fmtNumText(c.uF)
  }
  convState.value = next
}

// ---------- 速查表（由正读纯函数生成） ----------
const quickRows = computed(() =>
  QUICK_CODES.map((code) => {
    const r = codeToCapOf(code)
    return { code, formatted: r.ok ? r.formatted : '—', pfText: r.ok ? r.pfText : '—' }
  })
)

function applyQuickRow(row) {
  mode.value = 'forward'
  fCode.value = row.code
  activePresetId.value = ''
  activePresetNote.value = ''
}

// ---------- 预设（手算断言见自测） ----------
const presetDefs = [
  {
    id: 'p104',
    mode: 'forward',
    code: '104',
    label: '104 → 读数（去耦之王）',
    summary: '10 ×10⁴ = 100000 pF = 0.1 µF',
    note: '数字电路每个 IC 电源脚旁的旁路电容几乎全是 104 = 100nF = 0.1µF；加上误差后缀的 104K / 104J 也还是它。'
  },
  {
    id: 'p22p',
    mode: 'reverse',
    value: '22pF',
    label: '22p → 反查标号',
    summary: '22 pF = 22 ×10⁰ → 印「220」',
    note: '晶振负载电容常用 22pF。小于 100pF 的瓷片实际板上更常见直接印「22」的直标形态——第三位补 0 的「220」与直标「22」都等于 22pF，别当成 220pF。'
  },
  {
    id: 'p047',
    mode: 'reverse',
    value: '0.47µF',
    label: '0.47µF → 反查标号',
    summary: '470000 pF = 47 ×10⁴ → 印「474」',
    note: '0.47µF 是 LDO 输出、复位脚延时的常客，代码 474；再大一档 4.7µF 是 475（47 + 5 个零）——一位零个数差十倍容量，是换料时最容易看漏的地方。'
  }
]

function applyPreset(p) {
  activePresetId.value = p.id
  activePresetNote.value = p.note
  if (p.mode === 'forward') {
    mode.value = 'forward'
    fCode.value = p.code
  } else {
    mode.value = 'reverse'
    rText.value = p.value
  }
}

function resetAll() {
  mode.value = 'forward'
  fCode.value = '104'
  rText.value = '0.1µF'
  sCode.value = '103'
  sUnit.value = 'cap'
  convState.value = { pf: '100000', nf: '100', uf: '0.1' }
  activeConvKey.value = 'pf'
  activePresetId.value = ''
  activePresetNote.value = ''
  copyState.value = '复制读数'
}

// ---------- 复制（剪贴板 API 仅在事件回调中使用，SSR 安全） ----------
const currentSummaryText = computed(() => {
  if (mode.value === 'forward') {
    const r = forwardResult.value
    if (!r.ok) return ''
    return `${r.norm} = ${r.formatted} = ${r.pfText} pF${r.tol ? `（${r.tol.letter} ${r.tol.text}）` : ''}`
  }
  if (mode.value === 'reverse') {
    const r = reverseResult.value
    if (!r || !r.ok) return ''
    return `${rText.value} → 标号 ${r.code}${r.exact ? '' : `（近似，回读 ${formatCapOf(r.repr)}）`}`
  }
  const parts = []
  if (smdCap.value.ok) parts.push(`电容口径 ${smdCap.value.formatted}`)
  if (smdRes.value.ok) parts.push(`电阻口径 ${smdRes.value.formatted}`)
  return parts.length ? `${sCode.value}：${parts.join(' / ')}` : ''
})

async function copyResult() {
  const text = currentSummaryText.value
  if (!text) return
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      copyState.value = '已复制 ✓'
    } else {
      copyState.value = '该环境不支持自动复制'
    }
  } catch {
    copyState.value = '复制失败，请手动选择'
  }
  setTimeout(() => { copyState.value = '复制读数' }, 1600)
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('capacitor-code-reader')
})
</script>
