<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6 print:hidden">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <TestTube class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">梯度稀释计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">单步稀释 C1V1=C2V2、等比多管系列逐管加样表、储存液倍数反推，附移液可行性建议与方案一键复制</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线梯度稀释计算器（serial dilution calculator）：三种模式覆盖实验室常见稀释场景——按 C1V1 = C2V2 做单步稀释、
        按固定稀释因子排 2-12 管等比系列（经典 9 mL + 1 mL 的 1:10 系列）、从 1000× 母液反推取液量与补溶剂量；
        逐管表给出每管应加入的上管液体积、稀释液体积与终浓度，并对照移液枪量程标注加样量是否可精确定量，
        方案文本可一键复制到实验记录本。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 说明条 -->
    <div class="mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2 print:hidden">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-foreground">结果按体积可量取精度给出移液建议（&lt;10µL 提示换大体积配方），实验前请复核；无菌/细胞实验以实验室 SOP 为准。</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 print:block">
      <!-- 左：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 print:hidden">
        <h2 class="text-lg font-semibold flex items-center">
          <Beaker class="w-5 h-5 mr-2 text-primary" /> 稀释参数
        </h2>

        <!-- 模式切换 -->
        <div class="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-lg">
          <button
            v-for="tab in modeTabs"
            :key="tab.id"
            @click="mode = tab.id"
            class="px-2 py-2 rounded-md text-xs font-medium transition"
            :class="mode === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
          >
            {{ tab.name }}
          </button>
        </div>

        <!-- 模式一：单步稀释 -->
        <div v-if="mode === 'single'" class="space-y-3">
          <div>
            <label for="sdc-c1" class="block text-sm font-medium text-foreground mb-1.5">起始浓度 C1</label>
            <div class="flex gap-2">
              <input id="sdc-c1" v-model="single.c1" type="text" inputmode="decimal" placeholder="如 1" class="sdc-input" />
              <select v-model="single.unit" class="sdc-select" aria-label="C1 浓度单位">
                <option v-for="u in CONC_UNITS" :key="u" :value="u">{{ u }}</option>
              </select>
            </div>
          </div>
          <div>
            <label for="sdc-c2" class="block text-sm font-medium text-foreground mb-1.5">目标浓度 C2（须低于 C1）</label>
            <div class="flex gap-2">
              <input id="sdc-c2" v-model="single.c2" type="text" inputmode="decimal" placeholder="如 0.05" class="sdc-input" />
              <select v-model="single.unit2" class="sdc-select" aria-label="C2 浓度单位">
                <option v-for="u in CONC_UNITS" :key="'s2' + u" :value="u">{{ u }}</option>
              </select>
            </div>
          </div>
          <div>
            <label for="sdc-v2" class="block text-sm font-medium text-foreground mb-1.5">目标体积 V2</label>
            <div class="flex gap-2">
              <input id="sdc-v2" v-model="single.v2" type="text" inputmode="decimal" placeholder="如 10" class="sdc-input" />
              <select v-model="single.vUnit" class="sdc-select" aria-label="体积单位">
                <option value="µL">µL</option>
                <option value="mL">mL</option>
              </select>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">V1 = C2 × V2 ÷ C1，溶剂取 V2 − V1；C1 与 C2 须为同一单位。</p>
        </div>

        <!-- 模式二：等比多管 -->
        <div v-else-if="mode === 'serial'" class="space-y-3">
          <div>
            <label for="sdc-c0" class="block text-sm font-medium text-foreground mb-1.5">起始（原液）浓度</label>
            <div class="flex gap-2">
              <input id="sdc-c0" v-model="ser.c0" type="text" inputmode="decimal" placeholder="如 1" class="sdc-input" />
              <select v-model="ser.unit" class="sdc-select" aria-label="起始浓度单位">
                <option v-for="u in CONC_UNITS" :key="'se' + u" :value="u">{{ u }}</option>
              </select>
            </div>
          </div>
          <div>
            <label for="sdc-f" class="block text-sm font-medium text-foreground mb-1.5">稀释因子（终体积 ÷ 加样体积，1.1 - 100）</label>
            <div class="flex gap-2 mb-1.5">
              <button
                v-for="chip in FACTOR_CHIPS"
                :key="chip"
                @click="ser.factor = String(chip)"
                class="flex-1 px-2 py-1.5 rounded-md border text-xs font-medium transition"
                :class="ser.factor === String(chip) ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'"
              >
                1:{{ chip }}
              </button>
            </div>
            <input id="sdc-f" v-model="ser.factor" type="text" inputmode="decimal" placeholder="自定义，如 5" class="sdc-input" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="sdc-n" class="block text-sm font-medium text-foreground mb-1.5">管数（2-12）</label>
              <input id="sdc-n" v-model="ser.tubes" type="text" inputmode="numeric" class="sdc-input" />
            </div>
            <div>
              <label for="sdc-vol" class="block text-sm font-medium text-foreground mb-1.5">每管终体积</label>
              <div class="flex gap-1.5">
                <input id="sdc-vol" v-model="ser.volume" type="text" inputmode="decimal" class="sdc-input" />
                <select v-model="ser.vUnit" class="sdc-select w-20" aria-label="每管体积单位">
                  <option value="µL">µL</option>
                  <option value="mL">mL</option>
                </select>
              </div>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">每管先加稀释液（终体积 − 加样体积），再从上一管吸取加样体积混匀；第 1 管吸取原液。</p>
        </div>

        <!-- 模式三：储存液反推 -->
        <div v-else class="space-y-3">
          <div>
            <label for="sdc-sf" class="block text-sm font-medium text-foreground mb-1.5">储存液浓度 / 倍数</label>
            <div class="flex gap-2">
              <input id="sdc-sf" v-model="stock.c1" type="text" inputmode="decimal" placeholder="如 1000" class="sdc-input" />
              <select v-model="stock.unit" class="sdc-select" aria-label="储存液单位">
                <option v-for="u in CONC_UNITS" :key="'st' + u" :value="u">{{ u }}</option>
              </select>
            </div>
          </div>
          <div>
            <label for="sdc-wf" class="block text-sm font-medium text-foreground mb-1.5">工作液浓度 / 倍数</label>
            <div class="flex gap-2">
              <input id="sdc-wf" v-model="stock.c2" type="text" inputmode="decimal" placeholder="如 1" class="sdc-input" />
              <select v-model="stock.unit2" class="sdc-select" aria-label="工作液单位">
                <option v-for="u in CONC_UNITS" :key="'st2' + u" :value="u">{{ u }}</option>
              </select>
            </div>
          </div>
          <div>
            <label for="sdc-fv" class="block text-sm font-medium text-foreground mb-1.5">需要的终体积</label>
            <div class="flex gap-2">
              <input id="sdc-fv" v-model="stock.v" type="text" inputmode="decimal" placeholder="如 20" class="sdc-input" />
              <select v-model="stock.vUnit" class="sdc-select" aria-label="终体积单位">
                <option value="µL">µL</option>
                <option value="mL">mL</option>
              </select>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">常用例：1000× 抗母液配工作液，终体积 10 mL 时取 10 µL 母液 + 9.99 mL 稀释剂。</p>
        </div>

        <!-- 预设 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">快速预设</p>
          <div class="space-y-2">
            <button
              v-for="p in presetDefs"
              :key="p.id"
              @click="applyPreset(p.id)"
              class="w-full px-3 py-2 bg-muted/60 hover:bg-muted border border-border rounded-lg text-xs font-medium text-foreground transition flex items-center gap-2 text-left"
            >
              <Play class="w-3.5 h-3.5 text-primary flex-shrink-0" /> {{ p.label }}
            </button>
          </div>
        </div>

        <button
          @click="resetInputs"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
        >
          <RefreshCw class="w-4 h-4" /> 恢复默认参数
        </button>
      </div>

      <!-- 右：结果面板（打印时保留） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4 print:w-full print:border-0 print:p-0">
        <h2 class="text-lg font-semibold flex items-center">
          <TestTube class="w-5 h-5 mr-2 text-primary" /> 稀释方案
        </h2>

        <!-- 单步稀释结果 -->
        <div v-if="mode === 'single'" class="space-y-4">
          <p v-if="!singleResult.ok" class="text-sm text-red-500 flex items-start gap-1.5">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ singleResult.error }}
          </p>
          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">吸取原液 V1</p>
                <p class="text-xl font-bold text-primary">{{ fmtVol(singleResult.v1ul) }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">加溶剂</p>
                <p class="text-xl font-bold text-foreground">{{ fmtVol(singleResult.solventul) }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">稀释倍数</p>
                <p class="text-xl font-bold text-foreground">{{ fmtNum(singleResult.factor) }} 倍</p>
              </div>
            </div>
            <p class="text-sm text-foreground">
              操作：吸取 <b>{{ fmtNum(singleResult.c1) }} {{ singleResult.unit }}</b> 原液 {{ fmtVol(singleResult.v1ul) }}，
              加溶剂 {{ fmtVol(singleResult.solventul) }} 定容至 {{ fmtVol(singleResult.finalUl) }}，混匀后即得 {{ fmtNum(singleResult.c2) }} {{ singleResult.unit }}。
            </p>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 flex items-start gap-1.5" :class="pipetteHintSingle.level === 'warn' || pipetteHintSingle.level === 'bad' ? 'bg-red-500/10' : ''">
              <TriangleAlert v-if="pipetteHintSingle.level !== 'ok'" class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
              <CheckCircle v-else class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{{ pipetteHintSingle.text }}</span>
            </p>
          </template>
        </div>

        <!-- 等比多管结果 -->
        <div v-else-if="mode === 'serial'" class="space-y-4">
          <p v-if="!serialResult.ok" class="text-sm text-red-500 flex items-start gap-1.5">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ serialResult.error }}
          </p>
          <template v-else>
            <p class="text-sm text-foreground">
              按 <b>1:{{ fmtNum(serialResult.factor) }}</b> 系列排 {{ serialResult.tubes }} 管：每管终体积 {{ fmtVol(serialResult.volumeUl) }}，
              逐管加样 原液/上管液 <b>{{ fmtVol(serialResult.transferUl) }}</b> + 稀释液 <b>{{ fmtVol(serialResult.diluentUl) }}</b>，每管换枪头。
            </p>

            <div class="overflow-x-auto">
              <table class="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr class="bg-muted/60 text-xs text-muted-foreground">
                    <th class="px-3 py-2 text-left font-medium">管号</th>
                    <th class="px-3 py-2 text-left font-medium">终浓度（{{ serialResult.unit }}）</th>
                    <th class="px-3 py-2 text-left font-medium">加入原液/上管液</th>
                    <th class="px-3 py-2 text-left font-medium">稀释液</th>
                    <th class="px-3 py-2 text-left font-medium">可行性</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in serialResult.rows" :key="row.n" class="border-t border-border">
                    <td class="px-3 py-2 font-medium text-foreground">{{ row.n }}</td>
                    <td class="px-3 py-2 font-mono text-foreground">{{ fmtNum(row.conc) }}</td>
                    <td class="px-3 py-2 font-mono text-foreground">
                      <span class="text-muted-foreground text-xs mr-1">自{{ row.fromLabel }}</span>{{ fmtVol(row.transferUl) }}
                    </td>
                    <td class="px-3 py-2 font-mono text-foreground">{{ fmtVol(row.diluentUl) }}</td>
                    <td class="px-3 py-2">
                      <span v-if="row.feasible" class="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle class="w-3.5 h-3.5" /> 可行
                      </span>
                      <span v-else class="inline-flex items-center gap-1 text-xs text-red-500">
                        <TriangleAlert class="w-3.5 h-3.5" /> {{ row.suggestText }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 试管排图示 -->
            <div class="bg-muted/30 border border-border rounded-lg p-4" v-html="tubesSvgHtml"></div>
          </template>
        </div>

        <!-- 储存液反推结果 -->
        <div v-else class="space-y-4">
          <p v-if="!stockResult.ok" class="text-sm text-red-500 flex items-start gap-1.5">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ stockResult.error }}
          </p>
          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">取储存液</p>
                <p class="text-xl font-bold text-primary">{{ fmtVol(stockResult.v1ul) }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">补溶剂</p>
                <p class="text-xl font-bold text-foreground">{{ fmtVol(stockResult.solventul) }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">稀释倍数</p>
                <p class="text-xl font-bold text-foreground">{{ fmtNum(stockResult.factor) }} 倍</p>
              </div>
            </div>
            <p class="text-sm text-foreground">
              操作：取储存液 {{ fmtVol(stockResult.v1ul) }} + 稀释剂 {{ fmtVol(stockResult.solventul) }} → 终体积 {{ fmtVol(stockResult.finalUl) }}（{{ fmtNum(stockResult.c2) }} {{ stockResult.unit }} 工作液）。
            </p>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 flex items-start gap-1.5" :class="pipetteHintStock.level === 'warn' || pipetteHintStock.level === 'bad' ? 'bg-red-500/10' : ''">
              <TriangleAlert v-if="pipetteHintStock.level !== 'ok'" class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
              <CheckCircle v-else class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{{ pipetteHintStock.text }}</span>
            </p>
          </template>
        </div>

        <!-- 导出操作 -->
        <div class="flex flex-wrap gap-2 items-center pt-2 border-t border-border print:hidden">
          <button
            @click="copyPlan"
            :disabled="!planText"
            class="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle v-if="copied" class="w-4 h-4" />
            <Copy v-else class="w-4 h-4" />
            {{ copied ? '已复制方案' : '复制方案文本' }}
          </button>
          <p class="text-xs text-muted-foreground">打印请用浏览器打印（⌘/Ctrl + P），打印版只保留方案表。</p>
        </div>
      </div>
    </div>

    <!-- 质量浓度换算附加卡 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:hidden">
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Beaker class="w-5 h-5 mr-2 text-primary" /> 质量浓度换算（mg/mL ↔ µg/mL ↔ ng/µL）
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label for="sdc-mg" class="block text-sm font-medium text-foreground mb-1.5">mg/mL</label>
            <input id="sdc-mg" v-model="mass.mg" type="text" inputmode="decimal" @input="onMassInput('mg')" class="sdc-input" />
          </div>
          <div>
            <label for="sdc-ug" class="block text-sm font-medium text-foreground mb-1.5">µg/mL</label>
            <input id="sdc-ug" v-model="mass.ug" type="text" inputmode="decimal" @input="onMassInput('ug')" class="sdc-input" />
          </div>
          <div>
            <label for="sdc-ng" class="block text-sm font-medium text-foreground mb-1.5">ng/µL</label>
            <input id="sdc-ng" v-model="mass.ng" type="text" inputmode="decimal" @input="onMassInput('ng')" class="sdc-input" />
          </div>
        </div>
        <p class="text-xs text-muted-foreground">换算链：1 mg/mL = 1000 µg/mL；1 µg/mL = 1 ng/µL（每 mL 恰含 1000 µL，数值 1:1 对应）。</p>
        <p v-if="massError" class="text-xs text-red-500 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {{ massError }}
        </p>
      </div>
      <div class="bg-card border border-border rounded-lg p-6 space-y-3">
        <h3 class="text-sm font-semibold text-foreground flex items-center">
          <Info class="w-4 h-4 mr-1.5 text-primary" /> 换算口径提醒
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">
          质量浓度互转不含摩尔换算：mg/mL ↔ µM 需要溶质的分子量，请用站内
          <NuxtLink to="/tools/molar-mass-calculator" class="text-primary hover:underline">分子量计算器</NuxtLink>
          先求得摩尔质量再按 c = (mg/mL × 1000) ÷ M 换算。
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative print:hidden">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>梯度稀释计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          梯度稀释计算器是一款面向生物、医学、化学实验室的在线稀释计算工具。它内置三种模式：单步稀释按 C1V1 = C2V2
          求出需要吸取的原液体积、补加的溶剂体积与稀释倍数；等比多管模式按固定稀释因子逐管推算 2-12 管系列的每管终浓度、
          每管应加入的上管液体积与稀释液体积（即经典「9 mL 稀释液 + 1 mL 样品」的 1:10 系列排法），并对照移液枪量程标注可行性；
          储存液反推模式从 N× 浓缩母液直接算出配指定终体积工作液的取液量。结果方案可一键复制成可抄进实验记录本的文字，
          打印时只保留方案表。全部计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">稀释因子和稀释倍数是一个意思吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          多数文献里二者混用，但「1:10」这个记法有真实歧义：微生物学的通行约定是 1 份样品 + 9 份稀释液、总体积 10 份，
          稀释因子 = 终体积 ÷ 样品体积 = 10；而少数配方文本把 1:10 写成「1 份样 + 10 份液」的体积比，实际因子是 11。
          本工具一律按「体积终 ÷ 原样」口径计算：稀释因子 = 每管终体积 ÷ 加样体积 = C1 ÷ C2，输入 1:10 系列时填 10 即 100 µL + 900 µL。
          读他人 SOP 时务必先看它用的是哪种记法。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么要做系列稀释？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          菌落计数（平板涂布/倾注法）要求单皿长出 30-300 个菌落才具统计意义：原液动辄 10⁷-10⁹ CFU/mL，直接涂板会长成蔓延的一片，
          无法计数；而一步稀释到可数范围往往需要吸取不到 1 µL 的体积，超出移液枪精度。等比系列稀释（10⁻¹、10⁻²……）
          让每一步加样量都保持在量程内，再各取末几位稀释度涂板，就能落在 30-300 CFU 的可数区间。本工具的逐管表就是为排这种系列设计的。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">移液枪量程怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          原则是用「能覆盖目标体积的最小量程枪」，并在其量程的中上部使用（量程下限附近相对误差急剧增大）：P10 取 1-10 µL、
          P20/P200 取 20-200 µL、P1000 取 100-1000 µL。本页对所有加样量做可行性标注：当每管需吸取的体积 &lt; 10 µL 时给出红字提示，
          建议把每管终体积整体放大（例如从 100 µL 放大到因子×10 µL）或改用分刻度移液枪，而不是硬用小量程枪吸接近下限的体积。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">每管终体积怎么定？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          按下游用途倒推并留余量：涂布平板每稀释度至少取 0.1 mL，通常每管备 ≥ 1 mL 才够做多支稀释度和复孔；
          96 孔板检测按孔体积 × 孔数加 20% 蒸发/死体积余量；只做比色读取 100-200 µL/管 即可。终体积越大，
          同因子下的加样体积越接近移液枪量程中部，系列越可精确复核——这也是小体积系列被建议整体放大的原因。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">无菌操作提示</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一句话：每换一管必换新枪头、在酒精灯火焰旁或生物安全柜内操作、管口与盖内面过火灭菌，稀释液（生理盐水或缓冲液）须与样品无菌等效。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">1:10 稀释到底加多少稀释液？</h3>
            <p class="text-sm text-muted-foreground mt-1">按本工具的「体积终 ÷ 原样」口径，1:10 表示终体积是样品的 10 倍：1 mL 样品要加 9 mL 稀释液（100 µL + 900 µL 同理）。若你的实验手册把 1:10 定义为体积比（1 份样 + 10 份液），因子应填 11。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">每管只需要吸 5 µL，还能做吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不建议：低于 10 µL 已进入多数移液枪的误差放大区，逐管误差还会沿系列累积放大。把每管终体积按因子倍数整体放大（表内红字会给出建议体积），或改用分刻度移液枪，精度会显著改善。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">mg/mL 能换算成 µM 吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">本工具只做同单位与质量浓度链（mg/mL ↔ µg/mL ↔ ng/µL）的数值换算，不做摩尔换算——那需要分子量：先用站内分子量计算器求得摩尔质量 M，再按 µM = mg/mL × 10⁶ ÷ M 换算。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算结果可以直接用于无菌实验吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">数值可以直接抄用，但无菌/细胞实验的关键步骤（培养基、血清、胰酶等热敏感组分与活菌计数场景）以实验室 SOP 和质控为准，本工具按体积量取精度给出提示，不能替代复核。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="print:hidden">
      <RelatedTools :currentToolId="'serial-dilution-calculator'" :category="'calculate'" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  TestTube, Beaker, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '梯度稀释计算器 - 在线系列稀释/稀释倍数/菌液梯度换算工具',
  description: '免费在线梯度稀释计算器：单步稀释 C1V1C2V2、1:10 等比多管系列逐管加样表、1000× 储存液反推取液量，移液量程可行性提示与方案一键复制，纯浏览器本地运行不上传',
  keywords: '梯度稀释计算,serial dilution,菌液稀释倍数,溶液稀释计算器,稀释倍数换算',
  author: '有条工具',
  ogTitle: '梯度稀释计算器 - 在线系列稀释/稀释倍数/菌液梯度换算工具 | 有条工具',
  ogDescription: '单步稀释、等比多管系列逐管表、储存液倍数反推，附移液可行性建议，方案文本一键复制到记录本。',
  ogUrl: 'https://www.util.cn/tools/serial-dilution-calculator',
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
          name: '梯度稀释计算器',
          url: 'https://www.util.cn/tools/serial-dilution-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['单步稀释 C1V1=C2V2 计算', '等比多管系列逐管加样表', '1000× 储存液反推取液量', '移液量程可行性提示', '质量浓度换算链', '方案文本一键复制与打印']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '梯度稀释计算器', item: 'https://www.util.cn/tools/serial-dilution-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1:10 稀释到底加多少稀释液？',
              acceptedAnswer: { '@type': 'Answer', text: '按本站「体积终 ÷ 原样」口径，1:10 表示终体积是样品的 10 倍：1 mL 样品要加 9 mL 稀释液（100 µL + 900 µL 同理）。若你的实验手册把 1:10 定义为体积比（1 份样 + 10 份液），稀释因子应填 11。' }
            },
            {
              '@type': 'Question',
              name: '每管只需要吸 5 µL，还能做吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不建议：低于 10 µL 已进入多数移液枪的误差放大区，逐管误差还会沿系列累积放大。应把每管终体积按因子倍数整体放大（结果表红字会给出建议体积），或改用分刻度移液枪。' }
            },
            {
              '@type': 'Question',
              name: 'mg/mL 能换算成 µM 吗？',
              acceptedAnswer: { '@type': 'Answer', text: '本工具只做同单位数值换算与质量浓度链（mg/mL ↔ µg/mL ↔ ng/µL，1 mg/mL = 1000 µg/mL = 1000 ng/µL），不做摩尔换算——那需要溶质的分子量，可先用站内分子量计算器求得摩尔质量 M，再按 µM = mg/mL × 10⁶ ÷ M 换算。' }
            },
            {
              '@type': 'Question',
              name: '为什么要做梯度（系列）稀释？',
              acceptedAnswer: { '@type': 'Answer', text: '菌落计数要求单皿长出 30-300 个菌落才有统计意义：原液常达 10⁷-10⁹ CFU/mL，直接涂板会蔓延成片；一步到位又需要吸取不足 1 µL 的超量程体积。等比系列稀释让每步加样量都在移液枪量程内，再取合适稀释度涂板即可落在可数区间。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const CONC_UNITS = ['mg/mL', 'µg/mL', 'µM', 'mM', '%', '×']
const FACTOR_CHIPS = [2, 5, 10]
const MIN_PIPETTE_UL = 10   // 低于此加样量给红字可行性提示

// 宽松数值解析：接受 "1" / "0.05" / "1e-6"（含科学计数法）
function toNum(raw) {
  const s = String(raw == null ? '' : raw).trim().replace(',', '.')
  if (!s) return NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

// 体积统一换算为 µL；非法返回 NaN
function volToUltraliter(value, unit) {
  const v = toNum(value)
  if (!Number.isFinite(v) || v <= 0) return NaN
  if (unit === 'mL') return v * 1000
  if (unit === 'µL' || unit === 'uL') return v
  return NaN
}

// 浓度/倍数通用格式化：<1e-4 或 ≥1e6 用科学计数，其余 4 位有效数字去尾零
function fmtNum(x) {
  if (!Number.isFinite(x)) return '—'
  if (x === 0) return '0'
  const abs = Math.abs(x)
  if (abs >= 1e6 || abs < 1e-4) return x.toExponential(2)
  let s = x.toPrecision(4)
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '')
  return s
}

// 体积显示：≥1000 µL 折成 mL
function fmtVol(ul) {
  if (!Number.isFinite(ul)) return '—'
  if (ul >= 1000) return `${fmtNum(Math.round((ul / 1000) * 1000) / 1000)} mL`
  return `${fmtNum(Math.round(ul * 100) / 100)} µL`
}

// 单步稀释：V1 = C2·V2/C1，溶剂 = V2 − V1，稀释倍数 = C1/C2；要求同单位且 C2 < C1
function singleStep(c1Raw, c1Unit, c2Raw, c2Unit, v2Raw, v2Unit) {
  if (c1Unit !== c2Unit) return { ok: false, error: 'C1 与 C2 必须使用同一浓度单位（本工具按纯数值换算，不做跨单位折算）' }
  const c1 = toNum(c1Raw)
  const c2 = toNum(c2Raw)
  const v2ul = volToUltraliter(v2Raw, v2Unit)
  if (!Number.isFinite(c1) || c1 <= 0) return { ok: false, error: '起始浓度 C1 需为大于 0 的数值' }
  if (!Number.isFinite(c2) || c2 <= 0) return { ok: false, error: '目标浓度 C2 需为大于 0 的数值' }
  if (!Number.isFinite(v2ul)) return { ok: false, error: '体积无效：请填写正数，单位仅支持 µL / mL' }
  if (c2 >= c1) return { ok: false, error: '目标浓度需低于起始浓度（C2 < C1），反向请交换输入' }
  const v1ul = (c2 * v2ul) / c1
  return { ok: true, unit: c1Unit, c1, c2, v1ul, solventul: v2ul - v1ul, factor: c1 / c2, finalUl: v2ul }
}

// 储存液反推：按倍比 ×（如 1000× → 1×）复用单步逻辑
function stockStep(stockRaw, workRaw, vRaw, vUnit) {
  const r = singleStep(stockRaw, '×', workRaw, '×', vRaw, vUnit)
  if (!r.ok) return r
  return { ...r, takeUl: r.v1ul, addUl: r.solventul }
}

// 加样量不足 10 µL 时，建议的每管终体积（向上取整到 100 µL，上限 10 mL）
function suggestVolumeFor(factor) {
  const need = Math.ceil((MIN_PIPETTE_UL * factor) / 100) * 100
  return Math.min(10000, Math.max(200, need))
}

// 等比多管系列：逐管浓度 c_i = c0 / factor^i；每管加样 V/factor + 稀释液 V − V/factor
function serialPlan(c0Raw, c0Unit, fRaw, nRaw, volRaw, volUnit) {
  const c0 = toNum(c0Raw)
  const f = toNum(fRaw)
  const n = toNum(nRaw)
  const vol = volToUltraliter(volRaw, volUnit)
  if (!Number.isFinite(c0) || c0 <= 0) return { ok: false, error: '起始浓度需为大于 0 的数值' }
  if (!Number.isFinite(f) || f < 1.1 || f > 100) return { ok: false, error: '稀释因子需在 1.1 - 100 之间（1:10 系列填 10）' }
  if (!Number.isInteger(n) || n < 2 || n > 12) return { ok: false, error: '管数需为 2 - 12 的整数' }
  if (!Number.isFinite(vol) || vol < 100 || vol > 10000) return { ok: false, error: '每管终体积需在 100 µL - 10 mL 之间' }
  const transferUl = vol / f
  const diluentUl = vol - transferUl
  const feasible = transferUl >= MIN_PIPETTE_UL
  const suggestUl = suggestVolumeFor(f)
  const suggestText = feasible ? '' : (suggestUl / f >= MIN_PIPETTE_UL
    ? `建议放大终体积至 ${fmtVol(suggestUl)} 或换分度移液枪`
    : '放大体积仍超 10 mL 上限，请换分度移液枪')
  const rows = []
  let conc = c0
  for (let i = 1; i <= n; i++) {
    conc = conc / f
    rows.push({
      n: i,
      conc,
      transferUl,
      diluentUl,
      fromLabel: i === 1 ? '原液' : `管${i - 1}`,
      feasible,
      suggestText
    })
  }
  return { ok: true, c0, unit: c0Unit, factor: f, tubes: n, volumeUl: vol, transferUl, diluentUl, feasible, suggestUl, rows }
}

// XML 文本转义，保证 v-html 注入安全
function escXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// 试管排图示：等液面高度、按管序渐淡的着色；concText / transferText 均已转义
function tubesSvg(rows) {
  const n = Array.isArray(rows) ? rows.length : 0
  if (!n) return ''
  const tw = 40, gap = 20, pad = 24, top = 58, tubeH = 128
  const w = pad * 2 + n * tw + (n - 1) * gap
  const h = top + tubeH + 40
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" class="w-full max-w-xl mx-auto" role="img" aria-label="试管系列图示">`
  ]
  rows.forEach((r, i) => {
    const x = pad + i * (tw + gap)
    const cx = x + tw / 2
    const alpha = Math.max(0.15, 1 - i * 0.16).toFixed(2)
    parts.push(`<g data-tube="${i + 1}">`)
    parts.push(`<path d="M ${x} ${top} v ${tubeH - 14} q 0 14 14 14 h ${tw - 28} q 14 0 14 -14 V ${top}" fill="none" style="stroke:hsl(var(--border))" stroke-width="2" />`)
    parts.push(`<path d="M ${x + 2} ${top + 44} v ${tubeH - 58} q 0 12 12 12 h ${tw - 32} q 12 0 12 -12 V ${top + 44}" style="fill:hsl(var(--primary))" opacity="${alpha}" />`)
    parts.push(`<text x="${cx}" y="${top - 24}" text-anchor="middle" font-size="10" style="fill:hsl(var(--muted-foreground))">${escXml(r.transferText)}</text>`)
    parts.push(`<text x="${cx}" y="${top - 9}" text-anchor="middle" font-size="12" font-weight="600" style="fill:hsl(var(--foreground))">管${escXml(r.n)}</text>`)
    parts.push(`<text x="${cx}" y="${top + tubeH + 20}" text-anchor="middle" font-size="10" style="fill:hsl(var(--muted-foreground))">${escXml(r.concText)}</text>`)
    parts.push('</g>')
    if (i < n - 1) {
      const x1 = x + tw + 2
      const x2 = x + tw + gap - 2
      parts.push(`<path d="M ${x1} ${top - 16} h ${x2 - x1 - 4} l 3 -3 m -3 3 l 3 3" fill="none" style="stroke:hsl(var(--muted-foreground))" stroke-width="1.5" />`)
    }
  })
  parts.push('</svg>')
  return parts.join('')
}

// 质量浓度换算链：1 mg/mL = 1000 µg/mL = 1000 ng/µL（µg/mL 与 ng/µL 数值 1:1）
function massChain(raw, from) {
  const v = toNum(raw)
  if (!Number.isFinite(v) || v < 0) return null
  let ug
  if (from === 'mg') ug = v * 1000
  else if (from === 'ug') ug = v
  else if (from === 'ng') ug = v
  else return null
  return { mgPerMl: ug / 1000, ugPerMl: ug, ngPerUl: ug }
}

// 移液可行性/量程建议：<1µL 基本不可行；<10µL 警告；其余推荐对应量程枪
function suggestPipette(ul) {
  if (!Number.isFinite(ul) || ul <= 0) return { level: 'bad', text: '体积无效' }
  if (ul < 1) return { level: 'bad', text: `吸取量 ${fmtVol(ul)} 低于 P2 移液枪下限（约 1 µL），误差极大：请把整个配方体积放大 10 倍以上` }
  if (ul < MIN_PIPETTE_UL) return { level: 'warn', text: `吸取量 ${fmtVol(ul)} < 10 µL，接近量程下限：建议按大体积配方放大（如 1:100 改为 1 mL 原液 + 99 mL 溶剂）或改用分度移液枪` }
  if (ul < 2) return { level: 'ok', text: `推荐 P2 量程移液枪吸取 ${fmtVol(ul)}` }
  if (ul < 10) return { level: 'ok', text: `推荐 P10 量程移液枪吸取 ${fmtVol(ul)}` }
  if (ul < 20) return { level: 'ok', text: `推荐 P20 量程移液枪吸取 ${fmtVol(ul)}` }
  if (ul < 200) return { level: 'ok', text: `推荐 P200 量程移液枪吸取 ${fmtVol(ul)}` }
  if (ul < 1000) return { level: 'ok', text: `推荐 P1000 量程移液枪吸取 ${fmtVol(ul)}` }
  return { level: 'ok', text: `体积 ${fmtVol(ul)} 超出单枪量程：用 P1000/P5000 分次吸取或用刻度量筒量取` }
}

// 生成可抄进记录本 / 可打印的方案文本
function buildPlanText(mode, result) {
  if (!result || !result.ok) return ''
  const head = {
    single: '【单步稀释方案】',
    serial: `【等比多管系列】因子 1:${fmtNum(result.factor)}，${result.tubes} 管，每管终体积 ${fmtVol(result.volumeUl)}（单位 ${result.unit}）`,
    stock: '【储存液→工作液方案】'
  }[mode]
  const lines = [head]
  if (mode === 'serial') {
    for (const row of result.rows) {
      lines.push(
        `管${row.n}：吸取${row.fromLabel} ${fmtVol(row.transferUl)} + 稀释液 ${fmtVol(row.diluentUl)}，混匀` +
        `（终浓度 ${fmtNum(row.conc)} ${result.unit}${row.feasible ? '' : ' ⚠' + row.suggestText}）`
      )
    }
    lines.push('无菌操作：每管更换枪头，火焰旁操作。')
  } else {
    lines.push(
      `吸取${mode === 'stock' ? '储存液' : '原液'} ${fmtVol(result.v1ul)} + 溶剂 ${fmtVol(result.solventul)}，` +
      `定容至 ${fmtVol(result.finalUl)}，混匀`
    )
    lines.push(`稀释倍数：${fmtNum(result.factor)} 倍；目标浓度 ${fmtNum(result.c2)} ${result.unit}`)
  }
  lines.push('本方案由在线梯度稀释计算器生成，结果按体积量取精度给出，实验前请复核。')
  return lines.join('\n')
}

// ---------- 页面状态 ----------
const mode = ref('single')
const modeTabs = [
  { id: 'single', name: '单步稀释' },
  { id: 'serial', name: '等比多管' },
  { id: 'stock', name: '储存液反推' }
]

const DEFAULTS = {
  single: { c1: '1', unit: 'mg/mL', c2: '0.05', unit2: 'mg/mL', v2: '10', vUnit: 'mL' },
  ser: { c0: '1', unit: 'mg/mL', factor: '10', tubes: '6', volume: '1000', vUnit: 'µL' },
  stock: { c1: '1000', unit: '×', c2: '1', unit2: '×', v: '20', vUnit: 'mL' }
}

const single = reactive({ ...DEFAULTS.single })
const ser = reactive({ ...DEFAULTS.ser })
const stock = reactive({ ...DEFAULTS.stock })

const mass = reactive({ mg: '1', ug: '1000', ng: '1000' })
const massError = ref('')

const copied = ref(false)
let copyTimer = null
const seoContentVisible = ref(true)

// ---------- 派生结果 ----------
const singleResult = computed(() =>
  singleStep(single.c1, single.unit, single.c2, single.unit2, single.v2, single.vUnit)
)
const stockResult = computed(() => stockStep(stock.c1, stock.c2, stock.v, stock.vUnit))
const serialResult = computed(() =>
  serialPlan(ser.c0, ser.unit, ser.factor, ser.tubes, ser.volume, ser.vUnit)
)

const pipetteHintSingle = computed(() =>
  singleResult.value.ok ? suggestPipette(singleResult.value.v1ul) : { level: 'bad', text: '' }
)
const pipetteHintStock = computed(() =>
  stockResult.value.ok ? suggestPipette(stockResult.value.takeUl) : { level: 'bad', text: '' }
)

const tubesSvgHtml = computed(() => {
  if (!serialResult.value.ok) return ''
  const rows = serialResult.value.rows.map((r) => ({
    n: r.n,
    concText: `${fmtNum(r.conc)} ${serialResult.value.unit}`,
    transferText: `取 ${fmtVol(r.transferUl)}`
  }))
  return tubesSvg(rows)
})

const planText = computed(() => {
  if (mode.value === 'serial') return buildPlanText('serial', serialResult.value)
  if (mode.value === 'stock') return buildPlanText('stock', stockResult.value)
  return buildPlanText('single', singleResult.value)
})

// ---------- 预设（Play 3） ----------
const presetDefs = [
  { id: 'series10x6', label: '1:10 六管系列 · 起始 1 mg/mL · 每管 1 mL' },
  { id: 'stock1000', label: '1000× 抗母液配 20 mL 工作液（取 20 µL）' },
  { id: 'micro5x4', label: '菌液 5 倍系列 · 4 管（每管 1 mL）' }
]

function applyPreset(id) {
  if (id === 'series10x6') {
    mode.value = 'serial'
    Object.assign(ser, DEFAULTS.ser)
  } else if (id === 'stock1000') {
    mode.value = 'stock'
    Object.assign(stock, DEFAULTS.stock)
  } else if (id === 'micro5x4') {
    mode.value = 'serial'
    Object.assign(ser, { c0: '1', unit: '×', factor: '5', tubes: '4', volume: '1000', vUnit: 'µL' })
  }
}

function resetInputs() {
  mode.value = 'single'
  Object.assign(single, DEFAULTS.single)
  Object.assign(ser, DEFAULTS.ser)
  Object.assign(stock, DEFAULTS.stock)
  Object.assign(mass, { mg: '1', ug: '1000', ng: '1000' })
  massError.value = ''
}

// ---------- 交互回调（仅浏览器环境，SSR 安全） ----------
function onMassInput(which) {
  const chain = massChain(mass[which], which)
  if (!chain) {
    massError.value = which === 'mg' ? 'mg/mL 栏请输入非负数值' : which === 'ug' ? 'µg/mL 栏请输入非负数值' : 'ng/µL 栏请输入非负数值'
    return
  }
  massError.value = ''
  mass.mg = fmtNum(chain.mgPerMl)
  mass.ug = fmtNum(chain.ugPerMl)
  mass.ng = fmtNum(chain.ngPerUl)
}

async function copyPlan() {
  const text = planText.value
  if (!text || !navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2000)
  } catch {
    copied.value = false
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('serial-dilution-calculator')
})
</script>

<style scoped>
.sdc-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: hsl(var(--foreground));
}
.sdc-input:focus {
  outline: none;
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.4);
}
.sdc-select {
  padding: 0.625rem 0.5rem;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: hsl(var(--foreground));
  flex-shrink: 0;
}
</style>
