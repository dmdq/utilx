<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Flame class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">陶艺收缩率计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按目标成品尺寸反推湿坯制作尺寸，干燥+烧成复合收缩，黏土档案选择与多件套一次性换算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线陶艺收缩率计算工具：黏土从湿坯到出窑要经历脱水干燥收缩与高温玻璃相致密化的烧成收缩，
        复合关系为 1−s总 = (1−s干燥)×(1−s烧成)。工具内置瓷泥 / 炻器 / 粗陶 / 纸黏土等常见收缩率档案（各泥料以厂家实测为准），
        支持自定义收缩率与「仅知总收缩时按经验口径分解干燥/烧成」估算；
        正向按 成品 ÷ (1−总收缩率) 反推湿坯尺寸，反向由实测湿坯与成品尺寸反算实际收缩率，多件套表格一次性全算。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 说明条 -->
    <div class="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 mb-6 text-sm text-foreground leading-relaxed">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>收缩率口径为「(湿坯−成品)/湿坯」线收缩率；同一泥料不同批次、不同烧成温度曲线差异可达 ±2%，做盖子、套装与教具前强烈建议用同批泥料烧一支标尺试片实测校准。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <!-- 模式切换 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="mode = 'forward'"
            class="px-3 py-2 rounded-lg text-sm font-medium border transition"
            :class="mode === 'forward' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
          >正向：成品 → 湿坯</button>
          <button
            @click="mode = 'reverse'"
            class="px-3 py-2 rounded-lg text-sm font-medium border transition"
            :class="mode === 'reverse' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
          >反向：实测 → 收缩率</button>
        </div>

        <!-- 黏土档案 -->
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Database class="w-5 h-5 mr-2 text-primary" /> ① 黏土收缩率档案
          </h2>
          <div class="space-y-2">
            <label
              v-for="a in CLAY_ARCHIVES"
              :key="a.id"
              class="flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition"
              :class="clayId === a.id ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:bg-muted/60'"
            >
              <input type="radio" name="clay" :value="a.id" v-model="clayId" class="mt-1 accent-[var(--primary,#6366f1)]" />
              <span class="text-sm">
                <span class="font-medium text-foreground">{{ a.label }}</span>
                <span class="block text-xs text-muted-foreground">总收缩 {{ a.range[0] }}–{{ a.range[1] }}% · 默认 {{ a.def }}% · {{ a.note }}</span>
              </span>
            </label>
            <label
              class="flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition"
              :class="clayId === 'custom' ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:bg-muted/60'"
            >
              <input type="radio" name="clay" value="custom" v-model="clayId" class="mt-1 accent-[var(--primary,#6366f1)]" />
              <span class="text-sm font-medium text-foreground">自定义收缩率</span>
            </label>
            <div v-if="clayId === 'custom'" class="pl-1 pt-1">
              <label class="text-sm text-muted-foreground block">
                总收缩率（%）
                <input
                  v-model.number="customShrink"
                  type="number" min="0" max="40" step="0.1" placeholder="如 12.5"
                  class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </label>
              <p class="text-xs text-muted-foreground mt-1">测法：搓 10cm 直线泥条烧后量长度，(10−烧后)/10×100%。常见泥料 5–16%。</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>档案为常见参考带，各泥料以厂家实测为准——同品牌不同批次也会浮动。</span>
          </p>
        </div>

        <hr class="border-border" />

        <!-- 干燥/烧成分解 -->
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Split class="w-5 h-5 mr-2 text-primary" /> ② 干燥 / 烧成分解（可选）
          </h2>
          <div class="grid grid-cols-3 gap-2 mb-3">
            <button
              @click="splitMode = 'none'"
              class="px-2 py-2 rounded-lg text-xs font-medium border transition"
              :class="splitMode === 'none' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
            >不分解</button>
            <button
              @click="splitMode = 'half'"
              class="px-2 py-2 rounded-lg text-xs font-medium border transition"
              :class="splitMode === 'half' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
            >对半分（通行）</button>
            <button
              @click="splitMode = 'custom'"
              class="px-2 py-2 rounded-lg text-xs font-medium border transition"
              :class="splitMode === 'custom' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
            >自定义分解</button>
          </div>
          <div v-if="splitMode === 'custom'" class="grid grid-cols-2 gap-2">
            <label class="text-sm text-muted-foreground">
              干燥收缩（%）
              <input
                v-model.number="dryShrink"
                type="number" min="0" max="20" step="0.1" placeholder="如 5"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="text-sm text-muted-foreground">
              烧成收缩（%）
              <input
                v-model.number="fireShrink"
                type="number" min="0" max="20" step="0.1" placeholder="如 8"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <p class="col-span-2 text-xs text-muted-foreground">复合总收缩 = 1−(1−干燥%)×(1−烧成%)，两段相乘而非相加。</p>
          </div>
          <p class="text-xs text-muted-foreground">仅知总收缩时的分解为估算口径：通行说法约「干燥一半 + 烧成一半」（也有按 1/3 干燥 + 2/3 烧成估的口径），仅用于分阶段把握尺寸，精确请实测。</p>
        </div>

        <hr class="border-border" />

        <!-- 尺寸输入 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold flex items-center">
              <Ruler class="w-5 h-5 mr-2 text-primary" /> ③ 尺寸（{{ mode === 'forward' ? '目标成品' : '实测尺寸' }}）
            </h2>
            <div class="inline-flex rounded-lg border border-border bg-muted p-0.5">
              <button
                @click="unit = 'mm'"
                class="px-2.5 py-1 rounded-md text-xs font-medium transition"
                :class="unit === 'mm' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
              >mm</button>
              <button
                @click="unit = 'cm'"
                class="px-2.5 py-1 rounded-md text-xs font-medium transition"
                :class="unit === 'cm' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
              >cm</button>
            </div>
          </div>

          <!-- 反向模式 -->
          <div v-if="mode === 'reverse'" class="grid grid-cols-2 gap-2">
            <label class="text-sm text-muted-foreground">
              湿坯实测（{{ unit }}）
              <input
                v-model.number="revWet"
                type="number" min="0" step="0.1" placeholder="如 113.6"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="text-sm text-muted-foreground">
              烧成后实测（{{ unit }}）
              <input
                v-model.number="revFinal"
                type="number" min="0" step="0.1" placeholder="如 100"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
          </div>

          <!-- 正向多件套 -->
          <template v-else>
            <div class="grid grid-cols-[1fr_92px_28px] gap-1.5 text-[10px] text-muted-foreground mb-1 px-1">
              <span>部位 / 件名</span><span>成品尺寸（{{ unit }}）</span><span></span>
            </div>
            <div class="space-y-1.5">
              <div v-for="row in rows" :key="row.key" class="grid grid-cols-[1fr_92px_28px] gap-1.5 items-center">
                <input
                  v-model="row.name"
                  class="min-w-0 border border-border bg-background rounded-md px-2 py-1.5 text-foreground text-xs"
                  aria-label="部位名称"
                />
                <input
                  v-model.number="row.size"
                  type="number" min="0" step="0.1"
                  class="w-full border border-border bg-background rounded-md px-2 py-1.5 text-foreground text-xs"
                  aria-label="成品尺寸"
                />
                <button
                  @click="removeRow(row.key)"
                  class="text-muted-foreground hover:text-red-500 text-sm leading-none"
                  aria-label="删除该行"
                >×</button>
              </div>
            </div>
            <div class="flex items-center justify-between mt-2">
              <button @click="addRow" class="text-xs text-primary hover:underline">+ 加一行</button>
              <button @click="applySetPreset" class="text-xs text-muted-foreground hover:text-foreground">恢复示例（马克杯套件）</button>
            </div>
          </template>
        </div>
      </div>

      <!-- 右侧：结果区 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 正向结果 -->
        <template v-if="mode === 'forward'">
          <div class="bg-card border border-border rounded-lg p-6">
            <h2 class="text-lg font-semibold flex items-center mb-4">
              <CheckCircle v-if="fwdValid" class="w-5 h-5 mr-2 text-green-500" />
              <TriangleAlert v-else class="w-5 h-5 mr-2 text-amber-500" />
              湿坯放样结果
            </h2>
            <div v-if="fwdValid" class="bg-primary/10 rounded-lg p-5 text-center mb-4">
              <p class="text-xs text-muted-foreground mb-1">收缩率口径：总收缩 {{ fmt1(effTotalShrink) }}%（{{ clayLabel }}）· 放大系数 ×{{ fmt3(shrinkFactor) }}</p>
              <p class="text-5xl font-bold text-primary tabular-nums">
                {{ fmt2(focusWet) }}<span class="text-lg font-semibold ml-1">{{ unit }}</span>
              </p>
              <p class="text-sm text-muted-foreground mt-2">核心算式：湿坯 = 成品 ÷ (1 − 总收缩率) = {{ fmt2(focusFinal) }} ÷ {{ fmt3(1 - effTotalShrink / 100) }}</p>
            </div>
            <p v-else class="text-sm text-muted-foreground p-3 bg-muted/50 rounded-xl mb-4">
              先选择泥料档案（或填自定义收缩率），并在表格中给至少一行填上成品尺寸。
            </p>

            <!-- 多件套换算表 -->
            <div v-if="fwdValid" class="overflow-x-auto rounded-lg border border-border">
              <table class="w-full text-sm">
                <thead class="bg-muted/60 text-muted-foreground text-xs">
                  <tr>
                    <th class="px-3 py-2 text-left font-medium">部位</th>
                    <th class="px-3 py-2 text-right font-medium">成品（{{ unit }}）</th>
                    <th class="px-3 py-2 text-right font-medium">湿坯制作（{{ unit }}）</th>
                    <th class="px-3 py-2 text-right font-medium">干燥后≈（{{ unit }}）</th>
                    <th class="px-3 py-2 text-right font-medium">烧成后（{{ unit }}）</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in fwdTable" :key="r.key" class="border-t border-border tabular-nums">
                    <td class="px-3 py-2 font-medium text-foreground">{{ r.name }}</td>
                    <td class="px-3 py-2 text-right text-muted-foreground">{{ fmt2(r.final) }}</td>
                    <td class="px-3 py-2 text-right font-semibold text-primary">{{ fmt2(r.wet) }}</td>
                    <td class="px-3 py-2 text-right text-foreground">{{ r.boneDry === null ? '—' : fmt2(r.boneDry) }}</td>
                    <td class="px-3 py-2 text-right text-foreground">{{ fmt2(r.final) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 分解口径说明 -->
            <div v-if="fwdValid && splitMode !== 'none'" class="mt-3 bg-muted/50 rounded-xl p-4 text-sm text-foreground">
              <p class="font-medium mb-1">分阶段尺寸链（{{ splitLabel }}，估算）</p>
              <p class="text-xs text-muted-foreground leading-relaxed">
                干燥收缩 ≈ {{ fmt1(splitDry) }}%：{{ fmt2(focusWet) }} → {{ fmt2(focusBoneDry) }}（骨干燥终点）；
                烧成收缩 ≈ {{ fmt1(splitFire) }}%：{{ fmt2(focusBoneDry) }} → {{ fmt2(focusFinal) }}（出窑）。
                复合校验 1−(1−{{ fmt1(splitDry) }}%)×(1−{{ fmt1(splitFire) }}%) = {{ fmt1(effTotalShrink) }}%。
              </p>
            </div>

            <p class="text-xs text-muted-foreground mt-3 flex items-start gap-1.5 p-2.5 rounded bg-amber-500/10">
              <TriangleAlert class="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>拉坯与修坯余量另计：需要留精修量的部位（口沿、底足）在湿坯尺寸上再放大 2–5%；釉烧对尺寸影响一般小于 0.5%（薄釉），厚釉部位可按釉层厚度另放。</span>
            </p>
          </div>
        </template>

        <!-- 反向结果 -->
        <template v-else>
          <div class="bg-card border border-border rounded-lg p-6">
            <h2 class="text-lg font-semibold flex items-center mb-4">
              <CheckCircle v-if="revValid" class="w-5 h-5 mr-2 text-green-500" />
              <TriangleAlert v-else class="w-5 h-5 mr-2 text-amber-500" />
              实测收缩率反算
            </h2>
            <div v-if="revValid" class="bg-primary/10 rounded-lg p-5 text-center mb-4">
              <p class="text-xs text-muted-foreground mb-1">口径：(湿坯 − 成品) ÷ 湿坯 × 100%</p>
              <p class="text-5xl font-bold text-primary tabular-nums">{{ fmt2(revShrink) }}<span class="text-lg font-semibold ml-1">%</span></p>
              <p class="text-sm text-muted-foreground mt-2">({{ fmt2(revWetEff) }} − {{ fmt2(revFinalEff) }}) ÷ {{ fmt2(revWetEff) }} = {{ fmt2(revShrink) }}% · 下次放样放大系数 ×{{ fmt3(1 / (1 - revShrink / 100)) }}</p>
            </div>
            <p v-else class="text-sm text-muted-foreground p-3 bg-muted/50 rounded-xl">
              填入湿坯与烧成后的实测尺寸（同单位同部位），湿坯需大于成品。
            </p>
            <div v-if="revValid" class="bg-muted/50 rounded-xl p-4 text-sm text-foreground">
              <p>对照档案：实测 {{ fmt2(revShrink) }}% 落在
                <span class="font-medium">{{ nearestArchive }}</span>
                区间{{ revInRange ? '内' : '外，偏差较大——复测验尺或确认是否烧成温度到位（欠烧收缩偏小，过烧可能变形）' }}。
              </p>
            </div>
          </div>
        </template>

        <!-- 档案速查表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Database class="w-5 h-5 mr-2 text-primary" /> 常见黏土收缩率档案（总收缩·线收缩）
          </h2>
          <div class="overflow-x-auto rounded-lg border border-border">
            <table class="w-full text-sm">
              <thead class="bg-muted/60 text-muted-foreground text-xs">
                <tr>
                  <th class="px-3 py-2 text-left font-medium">泥料</th>
                  <th class="px-3 py-2 text-center font-medium">常见总收缩带</th>
                  <th class="px-3 py-2 text-center font-medium">默认取值</th>
                  <th class="px-3 py-2 text-left font-medium">100mm 成品湿坯应做</th>
                  <th class="px-3 py-2 text-left font-medium">特点备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in archiveRows" :key="a.id" class="border-t border-border tabular-nums">
                  <td class="px-3 py-2 font-medium text-foreground">{{ a.label }}</td>
                  <td class="px-3 py-2 text-center text-muted-foreground">{{ a.range[0] }}–{{ a.range[1] }}%</td>
                  <td class="px-3 py-2 text-center text-foreground">{{ a.def }}%</td>
                  <td class="px-3 py-2 text-right font-semibold text-primary">{{ fmt2(wetFromFinal(100, a.def)) }} mm</td>
                  <td class="px-3 py-2 text-left text-xs text-muted-foreground">{{ a.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground mt-2">带值为常见参考（两源交叉：Digitalfire 泥料百科与国内陶艺教程口径），各泥料以厂家实测为准；烧成温度越高、玻化越充分收缩越大。</p>
        </div>
      </div>
    </div>

    <!-- 可折叠 SEO 内容区（details/summary） -->
    <details open class="bg-card border border-border rounded-lg mb-8">
      <summary class="px-6 py-4 cursor-pointer select-none text-xl font-bold text-foreground flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>陶艺收缩率计算器：原理、公式与常见问题</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground" />
      </summary>
      <div class="px-6 pb-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h3 class="text-lg font-semibold text-foreground">为什么坯体会缩？</h3>
        <p>
          收缩分两段。第一段是<b class="text-foreground">干燥收缩</b>：湿坯里的自由水排出，黏土颗粒在水的表面张力作用下互相靠拢，从「湿坯」缩到「骨干燥（bone dry）」状态，颗粒间只剩吸附水；第二段是<b class="text-foreground">烧成收缩</b>：升温阶段先烧掉有机物与结晶水，高温下颗粒间出现液相玻璃相并互相熔填孔隙（玻化致密化），坯体进一步收紧密实。两段是先后发生的乘法关系：1 − s总 = (1 − s干燥) × (1 − s烧成)，例如干燥 5% + 烧成 8% 的复合总收缩 = 1 − 0.95×0.92 = 12.6%，而不是简单相加的 13%。本工具按这一口径复合，反向分解时用的是同一公式。
        </p>

        <h3 class="text-lg font-semibold text-foreground">放样公式</h3>
        <p>
          设总收缩率为 s（小数），成品目标尺寸 F、湿坯制作尺寸 W：烧成后 F = W×(1−s)，所以
          <b class="text-foreground">W = F ÷ (1−s)</b>。例如总收缩 12% 时，100mm 成品的湿坯 = 100÷0.88 = 113.64mm。
          反算实际收缩率则用 s = (W实测 − F实测) ÷ W实测 × 100%——收缩率以「原湿坯」为基准，而不是以成品为基准，两者会差出一个量级（113.64→100 两种基准分别是 12% 与 13.6%），查档案、报数据时务必统一口径。
        </p>

        <h3 class="text-lg font-semibold text-foreground">干燥/烧成怎么分解？</h3>
        <p>
          仅知总收缩时的分解只是估算口径：通行说法是干燥与烧成大约<b class="text-foreground">各占一半</b>（瓷泥因玻化充分烧成段可略多，约 5.5:4.5），也有按 1/3 干燥 + 2/3 烧成估算的教材口径。本工具默认「对半分」并允许自定义，结果仅用于把握「干燥到什么程度还剩多少余量」，不影响湿坯放样尺寸——湿坯只由总收缩决定。需要精确分段（比如做卡口、嵌套结构）请用同批泥料分别量骨干燥与出窑尺寸实测。
        </p>

        <h3 class="text-lg font-semibold text-foreground">釉料对尺寸有影响吗？</h3>
        <p>
          影响很小：常规器物施釉层厚 0.2–0.5mm，釉在高温下熔融铺展并部分渗入坯体，尺寸变化通常小于 0.5%，一般不需要为釉层放样。但三种情况要另考虑：厚釉或多层釉的口沿、盖口配合面可能「吃釉」变小半毫米，精配的盖子宁可留到出窑后研磨；釉的始熔温度过高、坯体玻化太强时可能出现釉层开裂或剥落，那不是尺寸问题；素烧后再釉烧的器物按素烧后尺寸二次放样更稳。
        </p>

        <h3 class="text-lg font-semibold text-foreground">为什么盖子和套装最容易翻车？</h3>
        <p>
          收缩是比例而非绝对值：直径 100mm 缩 12% 是 12mm，直径 30mm 只缩 3.6mm。盖与壶若在同一批泥、同一窑位烧成，按同一收缩率放样通常能配上；但泥料批次不同、窑内上下温差、盖子放置的支撑方式不同都会造成收缩差，出窑后「盖子掉进去」或「盖不上」都是常见事故。稳妥做法：盖钮、盖口留研磨余量各 0.5–1mm，成套器物用同一批泥一次烧成，教具场景先烧标尺试片定收缩率再批量放样。
        </p>

        <h3 class="text-lg font-semibold text-foreground">常见问题 (FAQ)</h3>
        <ul class="list-disc pl-5 space-y-2">
          <li><b class="text-foreground">湿坯尺寸怎么算？</b>湿坯 = 成品 ÷ (1−总收缩率)。总收缩 12% 时 100mm 成品 → 113.64mm；选好泥料档案后多件套表格会一次算出所有部位。</li>
          <li><b class="text-foreground">收缩率 12% 是以什么为基准？</b>行业口径以湿坯原尺寸为基准：(湿坯−成品)/湿坯。以成品为基准的「扩大系数」写法（湿坯 = 成品×1.136）数值会略大，采购泥料标卡时注意区分。</li>
          <li><b class="text-foreground">为什么我按 12% 放样还是小了一圈？</b>常见原因：档案值与实际泥料不符（换批次、换厂）、烧成温度未到设定玻化点（欠烧收缩小但没瓷化）、测量时机（半干≠湿坯）。烧一支 10cm 标尺试片实测最可靠。</li>
          <li><b class="text-foreground">手捏和拉坯收缩一样吗？</b>同一种泥料最终线收缩基本一致，但拉坯/泥板成型的密度与干燥均匀性不同，干燥阶段变形风险不同——薄厚不均的部位会向厚的方向弯，放样之外还要控制壁厚均匀。</li>
          <li><b class="text-foreground">同为手工尺寸换算，十字绣格数与成品尺寸的换算见</b>
            <NuxtLink to="/tools/cross-stitch-calculator" class="text-primary hover:underline">十字绣计算器</NuxtLink>，同样建议先留余量再裁布。</li>
          <li><b class="text-foreground">数据会上传吗？</b>不会。所有计算在浏览器本地完成，刷新即清空。</li>
        </ul>

        <p class="text-xs pt-3 border-t border-border/50">
          来源与口径注记：总收缩率区间两源交叉自 Digitalfire Ceramics Glossary（Firing/Shrinkage 各泥料条目）与国内陶艺教程/泥料商档案（瓷泥 12–15%、炻器 10–13%、粗陶 5–8% 口径）；干燥/烧成分解为通行经验说法（对半分或 1/3+2/3），仅作估算。以现行厂家实测档案为准，本页不替代试片实测。
        </p>
      </div>
    </details>

    <RelatedTools :currentToolId="'pottery-shrinkage-calculator'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Flame, Ruler, Info, CheckCircle, TriangleAlert, Database, Split, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '陶艺收缩率计算器 - 湿坯尺寸反推/黏土收缩率档案在线工具',
  description: '免费在线陶艺收缩率计算：按目标成品尺寸反推湿坯制作尺寸，瓷泥/炻器/粗陶/纸黏土收缩率档案与自定义，干燥+烧成复合收缩（1−(1−干燥)×(1−烧成)），反算实测收缩率，多件套表格一次全算，纯浏览器本地运行。',
  keywords: '陶艺收缩率计算,陶瓷收缩率,湿坯尺寸计算,烧成收缩,干燥收缩,黏土收缩率,陶泥放样',
  author: '有条工具',
  ogTitle: '陶艺收缩率计算器 - 湿坯尺寸反推/黏土收缩率档案 | 有条工具',
  ogDescription: '成品尺寸反推湿坯，瓷泥/炻器/粗陶档案，干燥+烧成复合收缩，多件套一次全算。',
  ogUrl: 'https://www.util.cn/tools/pottery-shrinkage-calculator',
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
          name: '陶艺收缩率计算器',
          url: 'https://www.util.cn/tools/pottery-shrinkage-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['成品尺寸反推湿坯制作尺寸', '瓷泥/炻器/粗陶/纸黏土收缩率档案与自定义', '干燥+烧成复合收缩换算', '反算实测收缩率', '多件套表格一次全算', 'mm/cm 单位切换', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others' },
            { '@type': 'ListItem', position: 3, name: '陶艺收缩率计算器', item: 'https://www.util.cn/tools/pottery-shrinkage-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '湿坯尺寸怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '湿坯 = 成品 ÷ (1−总收缩率)。总收缩 12% 时 100mm 成品 → 100÷0.88 = 113.64mm。选好泥料档案后，多件套表格会一次算出所有部位的湿坯制作尺寸。' }
            },
            {
              '@type': 'Question',
              name: '干燥收缩和烧成收缩怎么复合？',
              acceptedAnswer: { '@type': 'Answer', text: '两段先后发生，按乘法复合：1−总收缩 = (1−干燥收缩)×(1−烧成收缩)。例如干燥 5% + 烧成 8% 的复合总收缩 = 1−0.95×0.92 = 12.6%，不是简单相加的 13%。' }
            },
            {
              '@type': 'Question',
              name: '收缩率以什么为基准？',
              acceptedAnswer: { '@type': 'Answer', text: '行业口径以湿坯原尺寸为基准：(湿坯−成品)/湿坯×100%。湿坯 113.6mm 烧成 100mm 的收缩率为 12.0%；若以成品为基准则约 13.6%，查档案与报数据时要统一口径。' }
            },
            {
              '@type': 'Question',
              name: '釉料对成品尺寸有影响吗？',
              acceptedAnswer: { '@type': 'Answer', text: '常规 0.2–0.5mm 釉层对尺寸影响一般小于 0.5%，不需专门放样；厚釉配合面（盖口、口沿）可能吃釉变小半毫米，精配盖子建议留研磨余量。' }
            },
            {
              '@type': 'Question',
              name: '为什么做盖子和套装容易翻车？',
              acceptedAnswer: { '@type': 'Answer', text: '收缩是比例不是绝对值，且批次、窑位、支撑方式都会造成收缩差。建议盖口留 0.5–1mm 研磨余量，成套器物用同一批泥一次烧成，批量前先烧标尺试片实测收缩率。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 数值解析：空/非法/负数记 0，避免输入抖动产生 NaN
function num(v) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}
function fmt2(v) { return Number.isFinite(v) ? v.toFixed(2) : '—' }
function fmt3(v) { return Number.isFinite(v) ? v.toFixed(3) : '—' }
function fmt1(v) { return Number.isFinite(v) ? v.toFixed(1) : '—' }

// 黏土收缩率档案（总收缩·线收缩，%）：常见参考带，各泥料以厂家实测为准
const CLAY_ARCHIVES = [
  { id: 'porcelain', label: '瓷泥（高白/玻化）', range: [12, 15], def: 13, note: '玻化充分，收缩最大，大件易变形' },
  { id: 'stoneware', label: '炻器泥（中温/细陶石）', range: [10, 13], def: 11, note: '日用器主力，强度与致密度兼顾' },
  { id: 'earthenware', label: '粗陶（低温陶/建水陶胚）', range: [5, 8], def: 7, note: '孔隙率高，收缩最小，低温烧成' },
  { id: 'paperclay', label: '纸黏土（掺纤维增强）', range: [8, 11], def: 9, note: '纤维抑制干燥开裂，烧后纤维灰化' }
]

// 正向：湿坯 = 成品 / (1 − 总收缩率)
function wetFromFinal(finalSize, shrinkPct) {
  const f = num(finalSize), s = num(shrinkPct)
  if (!f || s <= 0 || s >= 100) return null
  return f / (1 - s / 100)
}

// 复合总收缩（%）：1 − (1−干燥%)×(1−烧成%)；两段乘法而非相加
function compositeShrinkPct(dryPct, firePct) {
  const d = num(dryPct), f = num(firePct)
  if (!d || !f) return null
  return (1 - (1 - d / 100) * (1 - f / 100)) * 100
}

// 反向：实测收缩率（%）= (湿坯 − 成品) / 湿坯 × 100，收缩率以湿坯为基准
function actualShrinkPct(wetSize, finalSize) {
  const w = num(wetSize), f = num(finalSize)
  if (!w || !f || f > w) return null
  return ((w - f) / w) * 100
}

// 分解估算口径（乘法自洽，保证 (1−d)×(1−f) 复合回总收缩）：
//   对半分（通行说法）：1−d = √(1−s) → d = f = 1−√(1−s)
//   1/3 干燥 + 2/3 烧成（教材口径，备查）：解 2d²−3d+s=0 取小根，f 由复合式回代
function splitFromTotal(totalPct, mode) {
  const s = num(totalPct) / 100
  if (!s || s >= 1) return null
  if (mode === 'third') {
    const disc = 9 - 8 * s
    const d = (3 - Math.sqrt(disc)) / 4
    const f = 1 - (1 - s) / (1 - d)
    return { dry: d * 100, fire: f * 100 }
  }
  const d = 1 - Math.sqrt(1 - s)
  return { dry: d * 100, fire: d * 100 }
}

// ---------- 页面状态 ----------
const mode = ref('forward') // forward 成品→湿坯 | reverse 实测→收缩率
const clayId = ref('stoneware')
const customShrink = ref(12.5)
const splitMode = ref('none') // none | half | custom
const dryShrink = ref(5)
const fireShrink = ref(8)
const unit = ref('mm') // mm | cm（内部统一按输入单位展示，比例计算与单位无关）
const revWet = ref(113.6)
const revFinal = ref(100)

const SET_PRESET_ROWS = [
  { name: '盘子直径', size: 260 },
  { name: '杯口直径', size: 85 },
  { name: '杯底直径', size: 55 },
  { name: '杯身高度', size: 95 },
  { name: '碗口直径', size: 150 }
]
const rows = ref(SET_PRESET_ROWS.map((r, i) => ({ key: `set-${i}`, ...r })))
let rowSeq = rows.value.length

// ---------- 派生计算 ----------
const currentArchive = computed(() => CLAY_ARCHIVES.find((a) => a.id === clayId.value) || null)
const clayLabel = computed(() => {
  if (clayId.value === 'custom') return `自定义 ${fmt1(num(customShrink.value))}%`
  return currentArchive.value ? currentArchive.value.label : '—'
})

// 有效总收缩（%）：档案默认值 / 自定义 / 自定义分解复合
const effTotalShrink = computed(() => {
  if (clayId.value === 'custom') {
    if (splitMode.value === 'custom') return compositeShrinkPct(dryShrink.value, fireShrink.value)
    return num(customShrink.value) || null
  }
  if (!currentArchive.value) return null
  if (splitMode.value === 'custom') return compositeShrinkPct(dryShrink.value, fireShrink.value)
  return currentArchive.value.def
})

// 分解口径标签与两段值（不分解时不展示）
const splitLabel = computed(() => (splitMode.value === 'custom' ? '自定义分解' : '通行说法·对半分'))
const splitDry = computed(() => {
  if (splitMode.value === 'custom') return num(dryShrink.value) || 0
  const s = splitFromTotal(effTotalShrink.value, 'half')
  return s ? s.dry : 0
})
const splitFire = computed(() => {
  if (splitMode.value === 'custom') return num(fireShrink.value) || 0
  const s = splitFromTotal(effTotalShrink.value, 'half')
  return s ? s.fire : 0
})

const shrinkFactor = computed(() => {
  const s = effTotalShrink.value
  return s && s < 100 ? 1 / (1 - s / 100) : null
})

const fwdValid = computed(() => Boolean(effTotalShrink.value) && rows.value.some((r) => num(r.size) > 0))

const focusRow = computed(() => rows.value.find((r) => num(r.size) > 0) || null)
const focusFinal = computed(() => (focusRow.value ? num(focusRow.value.size) : null))
const focusWet = computed(() =>
  fwdValid.value && focusFinal.value ? wetFromFinal(focusFinal.value, effTotalShrink.value) : null
)
const focusBoneDry = computed(() => {
  if (!focusWet.value) return null
  const afterDry = focusWet.value * (1 - splitDry.value / 100)
  return afterDry
})

// 多件套换算表（湿坯只由总收缩决定；分解列仅估算参考）
const fwdTable = computed(() =>
  rows.value.map((r) => {
    const f = num(r.size)
    const wet = f ? wetFromFinal(f, effTotalShrink.value) : null
    return {
      key: r.key,
      name: r.name || '未命名',
      final: f,
      wet,
      boneDry: wet ? wet * (1 - splitDry.value / 100) : null
    }
  })
)

// 反向
const revValid = computed(() => actualShrinkPct(revWet.value, revFinal.value) !== null)
const revWetEff = computed(() => num(revWet.value))
const revFinalEff = computed(() => num(revFinal.value))
const revShrink = computed(() => (revValid.value ? actualShrinkPct(revWetEff.value, revFinalEff.value) : null))
const nearestArchive = computed(() => {
  const s = revShrink.value
  if (!s) return '—'
  let best = CLAY_ARCHIVES[0]
  let bestDist = Infinity
  for (const a of CLAY_ARCHIVES) {
    const mid = (a.range[0] + a.range[1]) / 2
    const dist = Math.abs(mid - s)
    if (dist < bestDist) { best = a; bestDist = dist }
  }
  return `${best.label}（${best.range[0]}–${best.range[1]}%）`
})
const revInRange = computed(() => {
  const s = revShrink.value
  if (!s) return false
  return CLAY_ARCHIVES.some((a) => s >= a.range[0] - 1 && s <= a.range[1] + 1)
})

// 档案速查表行
const archiveRows = computed(() =>
  CLAY_ARCHIVES.map((a) => ({ ...a, wet100: wetFromFinal(100, a.def) }))
)

// ---------- 事件 ----------
function addRow() {
  rowSeq += 1
  rows.value = rows.value.concat({ key: `row-${rowSeq}`, name: '自定义部位', size: 100 })
}
function removeRow(key) {
  rows.value = rows.value.filter((r) => r.key !== key)
}
function applySetPreset() {
  rows.value = SET_PRESET_ROWS.map((r, i) => ({ key: `set-${i}`, ...r }))
  rowSeq = SET_PRESET_ROWS.length
}

onMounted(() => {
  addRecentTool('pottery-shrinkage-calculator')
})
</script>
