<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sprout class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">肥料养分计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">折纯量 · 目标反推 · 氮磷钾三肥自动组合，把商品肥换算成纯 N、P₂O₅、K₂O 养分量</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线肥料养分计算器：按肥料包装标称品位（N-P₂O₅-K₂O 三个数字）把尿素、磷酸二铵、氯化钾等商品肥折算成折纯量，
        支持按目标养分量反推需肥量（如需纯 N 8 kg 要施多少尿素），并按「先磷酸二铵满足磷、再尿素补氮、最后氯化钾补钾」
        自动生成三肥组合方案，标注各肥用量、实际折纯与富余量。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面提示条 -->
    <div class="mb-6 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
      <TriangleAlert class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-sm leading-relaxed text-foreground font-medium">
        施肥请以测土配方与当地农技推荐用量为准，本工具只做品位与用量的数学换算；计算用品位以肥料包装标识为准，实际养分含量以质检报告为准。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 计算参数
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

        <!-- 模式一：折纯量 -->
        <div v-if="mode === 'pure'" class="space-y-3">
          <div>
            <label for="fc-pure-fert" class="block text-sm font-medium text-foreground mb-1.5">选择肥料（标称品位 N-P₂O₅-K₂O）</label>
            <select id="fc-pure-fert" v-model="pure.fertId" :class="selectCls" aria-label="选择肥料">
              <option v-for="f in FERTILIZERS" :key="'pf' + f.id" :value="f.id">{{ f.label }}</option>
            </select>
          </div>
          <div v-if="pure.fertId === 'custom'" class="grid grid-cols-3 gap-2">
            <div>
              <label for="fc-pure-cn" class="block text-xs text-muted-foreground mb-1">N %</label>
              <input id="fc-pure-cn" v-model="custom.n" type="text" inputmode="decimal" placeholder="如 15" :class="inputCls" />
            </div>
            <div>
              <label for="fc-pure-cp" class="block text-xs text-muted-foreground mb-1">P₂O₅ %</label>
              <input id="fc-pure-cp" v-model="custom.p" type="text" inputmode="decimal" placeholder="如 15" :class="inputCls" />
            </div>
            <div>
              <label for="fc-pure-ck" class="block text-xs text-muted-foreground mb-1">K₂O %</label>
              <input id="fc-pure-ck" v-model="custom.k" type="text" inputmode="decimal" placeholder="如 15" :class="inputCls" />
            </div>
          </div>
          <div>
            <label for="fc-pure-weight" class="block text-sm font-medium text-foreground mb-1.5">亩用量（商品肥，kg）</label>
            <input id="fc-pure-weight" v-model="pure.weight" type="text" inputmode="decimal" placeholder="如 10" :class="inputCls" />
          </div>
          <p class="text-xs text-muted-foreground">
            品位说明：包装上的三个数字按 N、P₂O₅、K₂O 顺序标注各养分的百分含量——15-15-15 表示每 100 kg 该肥料含纯 N 15 kg、P₂O₅ 15 kg、K₂O 15 kg。
          </p>
        </div>

        <!-- 模式二：目标反推 -->
        <div v-else-if="mode === 'reverse'" class="space-y-3">
          <div>
            <label for="fc-rev-fert" class="block text-sm font-medium text-foreground mb-1.5">选择肥料</label>
            <select id="fc-rev-fert" v-model="rev.fertId" :class="selectCls" aria-label="选择肥料">
              <option v-for="f in FERTILIZERS" :key="'rf' + f.id" :value="f.id">{{ f.label }}</option>
            </select>
          </div>
          <div v-if="rev.fertId === 'custom'" class="grid grid-cols-3 gap-2">
            <div>
              <label for="fc-rev-cn" class="block text-xs text-muted-foreground mb-1">N %</label>
              <input id="fc-rev-cn" v-model="custom.n" type="text" inputmode="decimal" placeholder="如 15" :class="inputCls" />
            </div>
            <div>
              <label for="fc-rev-cp" class="block text-xs text-muted-foreground mb-1">P₂O₅ %</label>
              <input id="fc-rev-cp" v-model="custom.p" type="text" inputmode="decimal" placeholder="如 15" :class="inputCls" />
            </div>
            <div>
              <label for="fc-rev-ck" class="block text-xs text-muted-foreground mb-1">K₂O %</label>
              <input id="fc-rev-ck" v-model="custom.k" type="text" inputmode="decimal" placeholder="如 15" :class="inputCls" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="fc-rev-nutrient" class="block text-sm font-medium text-foreground mb-1.5">目标养分</label>
              <select id="fc-rev-nutrient" v-model="rev.nutrient" :class="selectCls" aria-label="目标养分">
                <option value="n">纯 N（氮）</option>
                <option value="p">P₂O₅（磷）</option>
                <option value="k">K₂O（钾）</option>
              </select>
            </div>
            <div>
              <label for="fc-rev-amount" class="block text-sm font-medium text-foreground mb-1.5">目标养分量（kg）</label>
              <input id="fc-rev-amount" v-model="rev.amount" type="text" inputmode="decimal" placeholder="如 8" :class="inputCls" />
            </div>
          </div>
          <p class="text-xs text-muted-foreground">需肥量 = 目标养分量 ÷ 养分品位%。所选肥料同时含其他养分时会一并算出「带入量」，避免重复施肥。</p>
        </div>

        <!-- 模式三：组合方案 -->
        <div v-else class="space-y-3">
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label for="fc-mix-tn" class="block text-sm font-medium text-foreground mb-1.5">目标 N（kg）</label>
              <input id="fc-mix-tn" v-model="mix.tN" type="text" inputmode="decimal" placeholder="如 8" :class="inputCls" />
            </div>
            <div>
              <label for="fc-mix-tp" class="block text-sm font-medium text-foreground mb-1.5">目标 P₂O₅（kg）</label>
              <input id="fc-mix-tp" v-model="mix.tP" type="text" inputmode="decimal" placeholder="如 4" :class="inputCls" />
            </div>
            <div>
              <label for="fc-mix-tk" class="block text-sm font-medium text-foreground mb-1.5">目标 K₂O（kg）</label>
              <input id="fc-mix-tk" v-model="mix.tK" type="text" inputmode="decimal" placeholder="如 4" :class="inputCls" />
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            固定三肥组合：磷酸二铵（18-46-0）先满足磷并带入氮 → 尿素（46-0-0）补足剩余氮 → 氯化钾（0-0-60）补钾。
            若二铵带入的氮已超过目标氮，则不再补尿素、氮出现富余；忌氯作物请把氯化钾换成等钾量的硫酸钾（用量 = 目标 K₂O ÷ 0.50）。
          </p>
        </div>

        <!-- 示例预设 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">示例预设（口径自测）</p>
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

      <!-- 右：结果面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Sprout class="w-5 h-5 mr-2 text-primary" /> 计算结果
        </h2>

        <!-- 折纯量结果 -->
        <div v-if="mode === 'pure'" class="space-y-4">
          <p v-if="!pureResult.ok" class="text-sm text-red-500 flex items-start gap-1.5">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ pureResult.error }}
          </p>
          <template v-else>
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">折纯 N</p>
                <p class="text-2xl font-bold text-primary">{{ pureResult.nText }} kg</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">折纯 P₂O₅</p>
                <p class="text-2xl font-bold text-foreground">{{ pureResult.pText }} kg</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">折纯 K₂O</p>
                <p class="text-2xl font-bold text-foreground">{{ pureResult.kText }} kg</p>
              </div>
            </div>
            <p class="text-sm text-foreground">
              {{ pureResult.fertName }} {{ pureResult.gradeText }}，亩施 {{ pureResult.weightText }} kg，
              折纯养分合计 {{ pureResult.totalText }} kg。折纯量 = 商品肥用量 × 养分品位%，即 {{ pureResult.weightText }} ×
              {{ pureResult.nShow }}% = {{ pureResult.nText }} kg 纯 N（其余两位同理）。
            </p>
            <p class="text-xs text-muted-foreground">品位为 0 的养分折纯量为 0；需要补足的养分可在「目标反推」或「组合方案」里换肥计算。</p>
          </template>
        </div>

        <!-- 目标反推结果 -->
        <div v-else-if="mode === 'reverse'" class="space-y-4">
          <p v-if="!revResult.ok" class="text-sm text-red-500 flex items-start gap-1.5">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ revResult.error }}
          </p>
          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">需肥料量</p>
                <p class="text-3xl font-bold text-primary">{{ revResult.kgText }}</p>
                <p class="text-xs text-muted-foreground mt-1">kg 商品肥</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">所用品位</p>
                <p class="text-xl font-bold text-foreground">{{ revResult.gradeValueText }}%</p>
                <p class="text-xs text-muted-foreground mt-1">{{ revResult.nutrientLabel }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">折纯合计</p>
                <p class="text-xl font-bold text-foreground">{{ revResult.totalPureText }} kg</p>
                <p class="text-xs text-muted-foreground mt-1">含目标养分 {{ revResult.targetText }} kg</p>
              </div>
            </div>
            <p class="text-sm text-foreground">
              算式：{{ revResult.targetText }} kg ÷ {{ revResult.gradeValueText }}% = {{ revResult.kgText }} kg {{ revResult.fertName }}。
              {{ revResult.sideText }}
            </p>
          </template>
        </div>

        <!-- 组合方案结果 -->
        <div v-else class="space-y-4">
          <p v-if="!mixResult.ok" class="text-sm text-red-500 flex items-start gap-1.5">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ mixResult.error }}
          </p>
          <template v-else>
            <div class="overflow-x-auto">
              <table class="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr class="bg-muted/60 text-xs text-muted-foreground">
                    <th class="px-3 py-2 text-left font-medium">肥料</th>
                    <th class="px-3 py-2 text-right font-medium">用量</th>
                    <th class="px-3 py-2 text-right font-medium">折纯 N</th>
                    <th class="px-3 py-2 text-right font-medium">折纯 P₂O₅</th>
                    <th class="px-3 py-2 text-right font-medium">折纯 K₂O</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in mixResult.rows" :key="row.key" class="border-t border-border">
                    <td class="px-3 py-2 text-foreground">{{ row.name }}</td>
                    <td class="px-3 py-2 text-right font-mono font-semibold text-primary">{{ row.kgText }} kg</td>
                    <td class="px-3 py-2 text-right font-mono text-muted-foreground">{{ row.nText }}</td>
                    <td class="px-3 py-2 text-right font-mono text-muted-foreground">{{ row.pText }}</td>
                    <td class="px-3 py-2 text-right font-mono text-muted-foreground">{{ row.kText }}</td>
                  </tr>
                  <tr class="border-t border-border bg-muted/40">
                    <td class="px-3 py-2 font-medium text-foreground">实际合计（目标 {{ mixResult.targetText }}）</td>
                    <td class="px-3 py-2 text-right font-mono font-bold text-foreground">{{ mixResult.totalKgText }} kg</td>
                    <td class="px-3 py-2 text-right font-mono font-bold text-foreground">{{ mixResult.aNText }}</td>
                    <td class="px-3 py-2 text-right font-mono font-bold text-foreground">{{ mixResult.aPText }}</td>
                    <td class="px-3 py-2 text-right font-mono font-bold text-foreground">{{ mixResult.aKText }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-sm text-foreground">{{ mixResult.logicText }}</p>
            <div v-if="mixResult.surplusTexts.length" class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p class="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                <TriangleAlert class="w-4 h-4 text-amber-500" /> 富余提示
              </p>
              <p v-for="s in mixResult.surplusTexts" :key="s" class="text-sm text-foreground">{{ s }}</p>
            </div>
          </template>
        </div>

        <!-- 复制施肥单 -->
        <div class="flex flex-wrap gap-2 items-center pt-2 border-t border-border">
          <button
            @click="copyResult"
            :disabled="!copyText"
            class="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle v-if="copied" class="w-4 h-4" />
            <Copy v-else class="w-4 h-4" />
            {{ copied ? '已复制施肥单' : '复制施肥单' }}
          </button>
          <p class="text-xs text-muted-foreground">施肥单含肥料、品位、用量与折纯明细，可发到种植群或记入田间台账。</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>肥料养分计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          肥料养分计算器是面向种植户、农资店与基层农技员的在线施肥换算工具。肥料包装上标注的是「品位」（N-P₂O₅-K₂O 三个百分数），
          而测土配方与施肥建议给出的往往是「纯养分量」（需要多少 kg 纯 N、P₂O₅、K₂O），两者之间差一步换算。
          本工具提供三种口径：按商品肥用量算折纯量、按目标养分量反推需肥量、按 N-P₂O₅-K₂O 三元目标自动生成
          磷酸二铵 + 尿素 + 氯化钾的组合配比方案，并标注富余量。全部计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">品位是什么意思？15-15-15 表示什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一句话：品位就是肥料包装上 N-P₂O₅-K₂O 的三个百分数，按氮、五氧化二磷、氧化钾的顺序排列——15-15-15
          表示每 100 kg 该肥料含纯 N 15 kg、P₂O₅ 15 kg、K₂O 15 kg，即三种养分各占 15%。
          尿素 46-0-0 就是只含氮 46%、不含磷钾；磷酸二铵 18-46-0 含氮 18%、含磷（P₂O₅）46%。
          注意磷以 P₂O₅、钾以 K₂O 折算，这是国际通行的肥料养分开径，不是元素磷、元素钾的质量。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">折纯量与需肥量怎么算？</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-4">
          <li><strong>折纯量</strong>：折纯量（kg）= 商品肥用量（kg）× 养分品位%。尿素 10 kg × 46% = 4.6 kg 纯 N。</li>
          <li><strong>目标反推</strong>：需肥量（kg）= 目标养分量（kg）÷ 养分品位%。目标纯 N 8 kg ÷ 46% ≈ 17.39 kg 尿素。</li>
          <li><strong>组合配比</strong>：先磷酸二铵满足磷（18-46-0，同时带入氮）→ 尿素补足剩余氮（46-0-0）→ 氯化钾补钾（0-0-60）。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">组合方案为什么会出现富余？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          因为磷酸二铵是「磷氮双养分」肥料：先按目标磷配二铵时，它带入的氮可能已经超过目标氮。
          例如目标 2-10-0，二铵要施 10 ÷ 46% ≈ 21.74 kg，同时带入纯 N ≈ 3.91 kg，超过目标氮 2 kg——
          此时尿素为 0，方案显示氮富余约 1.91 kg。富余部分不必刻意扣减，但追肥时应把这部分氮算进去；
          若想精确贴合目标，可改用低氮磷肥（如过磷酸钙 0-16-0）单独供磷。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见肥料标称品位速查</h3>
        <div class="overflow-x-auto mb-4">
          <table class="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr class="bg-muted/60 text-xs text-muted-foreground">
                <th class="px-3 py-2 text-left font-medium">肥料</th>
                <th class="px-3 py-2 text-right font-medium">N %</th>
                <th class="px-3 py-2 text-right font-medium">P₂O₅ %</th>
                <th class="px-3 py-2 text-right font-medium">K₂O %</th>
                <th class="px-3 py-2 text-left font-medium">特点</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in gradeTable" :key="f.name" class="border-t border-border">
                <td class="px-3 py-2 font-medium text-foreground">{{ f.name }}</td>
                <td class="px-3 py-2 text-right font-mono text-muted-foreground">{{ f.n }}</td>
                <td class="px-3 py-2 text-right font-mono text-muted-foreground">{{ f.p }}</td>
                <td class="px-3 py-2 text-right font-mono text-muted-foreground">{{ f.k }}</td>
                <td class="px-3 py-2 text-muted-foreground">{{ f.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-muted-foreground mb-4">上表为常见标称品位，用于估算；不同厂家批次略有差异，精确计算以包装标识为准，复合肥可选「自定义品位」输入。</p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">折纯量和商品量有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              商品量是称出来的肥料重量（如一袋 50 kg 尿素），折纯量是其中真正含的养分量（50 × 46% = 23 kg 纯 N）。
              测土配方给的施肥建议通常是纯养分量，买肥、称肥时必须折回商品量——同样 23 kg 纯 N，
              用 46-0-0 尿素要 50 kg，用 21-0-0 硫酸铵则要近 110 kg。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么组合方案先配二铵再配尿素？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              组合里只有二铵含磷，所以先用它把目标磷补齐；二铵带进的氮从目标氮里扣除，不够的部分再用尿素补；
              钾只由氯化钾提供，直接按目标钾除以 60% 配入。这个顺序能让磷、氮同时尽量贴合目标，避免多配或漏配。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">氯化钾和硫酸钾怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              两者钾品位常用 0-0-60 与 0-0-50。氯化钾便宜，适合大多数大田粮食作物；
              烟草、马铃薯、葡萄、茶树等忌氯（对氯敏感）作物建议改用硫酸钾，此时钾肥用量按 目标 K₂O ÷ 50% 计算，
              比氯化钾多用约两成。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">复合肥 15-15-15 一亩地施多少，怎么算纯养分？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              若测土建议为每亩纯 N、P₂O₅、K₂O 各 1.5 kg，按 15-15-15 品位反推：1.5 ÷ 15% = 10 kg/亩，
              三个养分正好同时满足。若建议是 2-1-1，则 15-15-15 会把磷钾施超——可在本工具「折纯量」模式输入亩用量，
              先看三个折纯数，再用「组合方案」按目标精确配平。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-8">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          <p class="text-sm text-muted-foreground line-clamp-2 mt-1">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Sprout, Calculator, TriangleAlert, RefreshCw, Play, Copy, CheckCircle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { tools } from '~/data/tools'

// ---------- SEO ----------
useSeoMeta({
  title: '肥料养分计算器 - 尿素折纯量/施肥量/NPK配比计算工具 | 有条工具',
  description: '免费在线肥料养分计算器：按品位把尿素、磷酸二铵、氯化钾等商品肥折算成纯 N、P₂O₅、K₂O 折纯量，支持目标养分量反推需肥量与氮磷钾三肥自动组合配比（含富余量提示），附常见肥料品位表，纯浏览器本地计算不上传数据。',
  keywords: '肥料养分计算,尿素折纯量,施肥量计算,NPK 配比计算,复合肥用量,fertilizer calculator',
  author: '有条工具',
  ogTitle: '肥料养分计算器 - 尿素折纯量/施肥量/NPK配比计算工具 | 有条工具',
  ogDescription: '折纯量、目标反推、三肥组合配比三种口径，把肥料包装品位换算成纯 N、P₂O₅、K₂O 养分量。',
  ogUrl: 'https://www.util.cn/tools/fertilizer-calculator',
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
          name: '肥料养分计算器',
          url: 'https://www.util.cn/tools/fertilizer-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['商品肥折纯量计算（N/P₂O₅/K₂O）', '目标养分量反推需肥量', '磷酸二铵+尿素+氯化钾三肥自动组合配比', '富余量提示', '复合肥自定义品位', '常见肥料品位速查表']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '肥料养分计算器', item: 'https://www.util.cn/tools/fertilizer-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '折纯量和商品量有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '商品量是称出来的肥料重量，折纯量是其中真正含的养分量：50 kg 尿素 × 46% = 23 kg 纯 N。测土配方建议通常是纯养分量，买肥称肥时必须按品位折回商品量。' }
            },
            {
              '@type': 'Question',
              name: '复合肥 15-15-15 是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '品位即包装上 N-P₂O₅-K₂O 三个百分数：15-15-15 表示每 100 kg 该肥料含纯 N 15 kg、P₂O₅ 15 kg、K₂O 15 kg。磷以 P₂O₅、钾以 K₂O 折算是国际通行的肥料养分开径。' }
            },
            {
              '@type': 'Question',
              name: '组合方案为什么会出现富余？',
              acceptedAnswer: { '@type': 'Answer', text: '磷酸二铵是磷氮双养分肥料：先按目标磷配二铵时带入的氮可能已超过目标氮，此时尿素为 0、氮出现富余。富余部分追肥时应计入；想精确贴合目标可改用过磷酸钙等低氮磷肥单独供磷。' }
            },
            {
              '@type': 'Question',
              name: '氯化钾和硫酸钾怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '氯化钾品位常用 0-0-60、价格低，适合大多数大田作物；烟草、马铃薯、葡萄、茶树等忌氯作物建议用硫酸钾（0-0-50），用量按目标 K₂O ÷ 50% 计算，比氯化钾多用约两成。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 常见肥料标称品位（N-P₂O₅-K₂O，%）
const FERTILIZERS = [
  { id: 'urea', name: '尿素', grade: { n: 46, p: 0, k: 0 }, label: '尿素 46-0-0' },
  { id: 'dap', name: '磷酸二铵', grade: { n: 18, p: 46, k: 0 }, label: '磷酸二铵 18-46-0' },
  { id: 'kcl', name: '氯化钾', grade: { n: 0, p: 0, k: 60 }, label: '氯化钾 0-0-60' },
  { id: 'k2so4', name: '硫酸钾', grade: { n: 0, p: 0, k: 50 }, label: '硫酸钾 0-0-50' },
  { id: 'ssp', name: '过磷酸钙', grade: { n: 0, p: 16, k: 0 }, label: '过磷酸钙 0-16-0' },
  { id: 'as', name: '硫酸铵', grade: { n: 21, p: 0, k: 0 }, label: '硫酸铵 21-0-0' },
  { id: 'an', name: '硝酸铵', grade: { n: 34, p: 0, k: 0 }, label: '硝酸铵 34-0-0' },
  { id: 'custom', name: '复合肥（自定义）', grade: null, label: '复合肥（自定义品位）' }
]

// 组合方案固定三肥
const MIX_DAP = { n: 18, p: 46, k: 0 }
const MIX_UREA = { n: 46, p: 0, k: 0 }
const MIX_KCL = { n: 0, p: 0, k: 60 }

// 宽松数值解析：接受 "10" / "1,500"（千分位逗号容错）
function toNum(raw) {
  const s = String(raw == null ? '' : raw).trim().replace(/,/g, '')
  if (!s) return NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

// 小数尾零裁剪：4.60 → 4.6；8.00 → 8
function trimNum(x, digits) {
  let s = x.toFixed(digits)
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '')
  return s
}

// 千分位整数：12345 → 12,345
function fmtThousand(x) {
  return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 品位显示：46-0-0
function gradeText(g) {
  return `${trimNum(g.n, 2)}-${trimNum(g.p, 2)}-${trimNum(g.k, 2)}`
}

// 校验品位三元组：均为 0-100 的数字且至少一个 > 0
function validGrade(g) {
  if (!g) return false
  const parts = [g.n, g.p, g.k]
  if (parts.some(v => !Number.isFinite(v) || v < 0 || v > 100)) return false
  return parts.some(v => v > 0)
}

// 按所选肥料 id 解析品位（custom 走自定义输入）；返回 { grade, name } 或 { error }
function resolveGrade(fertId, custom) {
  const f = FERTILIZERS.find(x => x.id === fertId)
  if (!f) return { error: '请选择肥料' }
  if (f.id === 'custom') {
    const g = { n: toNum(custom.n), p: toNum(custom.p), k: toNum(custom.k) }
    if (!validGrade(g)) return { error: '自定义品位需为 0-100 的数字，且至少一个养分大于 0（如 15-15-15 各填 15）' }
    return { grade: g, name: `复合肥 ${gradeText(g)}` }
  }
  return { grade: { ...f.grade }, name: `${f.name} ${gradeText(f.grade)}` }
}

// 模式一：折纯量 = 亩用量 × 品位%（逐养分）
function pureBreakdown(weightKg, grade) {
  return {
    n: (weightKg * grade.n) / 100,
    p: (weightKg * grade.p) / 100,
    k: (weightKg * grade.k) / 100
  }
}

// 模式二：需肥量 = 目标养分量 ÷ 品位%；同时算带入的其他养分
function reverseNeed(targetKg, grade, nutrientKey) {
  const pct = grade[nutrientKey]
  if (pct <= 0) return { error: `所选肥料不含该养分（品位为 0），请换用含此养分的肥料` }
  const kg = targetKg / (pct / 100)
  const sides = ['n', 'p', 'k']
    .filter(key => key !== nutrientKey && grade[key] > 0)
    .map(key => ({ key, kg: (kg * grade[key]) / 100 }))
  return { kg, sides }
}

// 模式三：先二铵满足磷（带入氮）→ 尿素补氮 → 氯化钾补钾
function mixPlan(tN, tP, tK) {
  const dap = tP > 0 ? tP / (MIX_DAP.p / 100) : 0
  const nFromDap = (dap * MIX_DAP.n) / 100
  const nRemain = Math.max(0, tN - nFromDap)
  const urea = nRemain > 0 ? nRemain / (MIX_UREA.n / 100) : 0
  const kcl = tK > 0 ? tK / (MIX_KCL.k / 100) : 0
  const aN = nFromDap + (urea * MIX_UREA.n) / 100
  const aP = (dap * MIX_DAP.p) / 100
  const aK = (kcl * MIX_KCL.k) / 100
  return {
    dap, nFromDap, urea, kcl,
    aN, aP, aK,
    sN: Math.max(0, aN - tN),
    sP: Math.max(0, aP - tP),
    sK: Math.max(0, aK - tK)
  }
}

// ---------- 页面状态 ----------
const mode = ref('pure')
const modeTabs = [
  { id: 'pure', name: '折纯量' },
  { id: 'reverse', name: '目标反推' },
  { id: 'mix', name: '组合方案' }
]

const DEFAULTS = {
  pure: { fertId: 'urea', weight: '10' },
  rev: { fertId: 'urea', nutrient: 'n', amount: '8' },
  mix: { tN: '8', tP: '4', tK: '4' },
  custom: { n: '15', p: '15', k: '15' }
}

const pure = reactive({ ...DEFAULTS.pure })
const rev = reactive({ ...DEFAULTS.rev })
const mix = reactive({ ...DEFAULTS.mix })
const custom = reactive({ ...DEFAULTS.custom })

// 统一输入样式（双主题 token，不写死灰白色值）
const inputCls = 'w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
const selectCls = 'w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'

const NUTRIENT_LABELS = { n: '纯 N（氮）', p: 'P₂O₅（磷）', k: 'K₂O（钾）' }

const seoContentVisible = ref(true)
const copied = ref(false)
let copyTimer = null

// ---------- 派生结果 ----------
const pureResult = computed(() => {
  const r = resolveGrade(pure.fertId, custom)
  if (r.error) return { ok: false, error: r.error }
  const w = toNum(pure.weight)
  if (!Number.isFinite(w) || w <= 0) return { ok: false, error: '亩用量需为大于 0 的数字（kg，商品肥重量）' }
  const b = pureBreakdown(w, r.grade)
  const total = b.n + b.p + b.k
  return {
    ok: true,
    fertName: r.name.replace(/ [\d.-]+$/, ''),
    gradeText: gradeText(r.grade),
    weightText: trimNum(w, 2),
    nShow: trimNum(r.grade.n, 2),
    nText: trimNum(b.n, 2),
    pText: trimNum(b.p, 2),
    kText: trimNum(b.k, 2),
    totalText: trimNum(total, 2)
  }
})

const revResult = computed(() => {
  const r = resolveGrade(rev.fertId, custom)
  if (r.error) return { ok: false, error: r.error }
  const amount = toNum(rev.amount)
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: '目标养分量需为大于 0 的数字（kg，按纯养分计）' }
  const nutrientLabel = NUTRIENT_LABELS[rev.nutrient] || '纯 N（氮）'
  const need = reverseNeed(amount, r.grade, rev.nutrient)
  if (need.error) return { ok: false, error: `${need.error}：${r.name} 的 ${nutrientLabel} 品位为 0` }
  const totalPure = (need.kg * (r.grade.n + r.grade.p + r.grade.k)) / 100
  const sideText = need.sides.length
    ? '同时带入其他养分：' + need.sides.map(s => `${NUTRIENT_LABELS[s.key]} ${trimNum(s.kg, 2)} kg`).join('、') + '（追肥时请把这部分算进去，不要重复施）。'
    : '该肥料只含这一种养分，无带入问题。'
  return {
    ok: true,
    fertName: r.name.replace(/ [\d.-]+$/, ''),
    gradeValueText: trimNum(r.grade[rev.nutrient], 2),
    nutrientLabel,
    targetText: trimNum(amount, 2),
    kgText: trimNum(need.kg, 2),
    totalPureText: trimNum(totalPure, 2),
    sideText
  }
})

const mixResult = computed(() => {
  const tN = toNum(mix.tN)
  const tP = toNum(mix.tP)
  const tK = toNum(mix.tK)
  const inputs = [tN, tP, tK]
  if (inputs.some(v => !Number.isFinite(v) || v < 0)) return { ok: false, error: '三个目标养分量需为不小于 0 的数字（kg，按纯养分计，不需要的填 0）' }
  if (!inputs.some(v => v > 0)) return { ok: false, error: '请至少填写一个大于 0 的目标养分量' }
  const plan = mixPlan(tN, tP, tK)
  const surplusTexts = []
  if (plan.sN > 0.01) surplusTexts.push(`氮富余 ${trimNum(plan.sN, 2)} kg：磷酸二铵带入的纯 N（${trimNum(plan.nFromDap, 2)} kg）已超过目标氮，不再补尿素；追肥时把这部分氮计入。`)
  if (plan.sP > 0.01) surplusTexts.push(`磷富余 ${trimNum(plan.sP, 2)} kg。`)
  if (plan.sK > 0.01) surplusTexts.push(`钾富余 ${trimNum(plan.sK, 2)} kg。`)
  const targetText = `${trimNum(tN, 2)}-${trimNum(tP, 2)}-${trimNum(tK, 2)}`
  return {
    ok: true,
    targetText,
    rows: [
      {
        key: 'dap',
        name: `磷酸二铵 ${gradeText(MIX_DAP)}`,
        kgText: trimNum(plan.dap, 2),
        nText: trimNum(plan.nFromDap, 2),
        pText: trimNum(plan.aP, 2),
        kText: '0'
      },
      {
        key: 'urea',
        name: `尿素 ${gradeText(MIX_UREA)}`,
        kgText: trimNum(plan.urea, 2),
        nText: trimNum((plan.urea * MIX_UREA.n) / 100, 2),
        pText: '0',
        kText: '0'
      },
      {
        key: 'kcl',
        name: `氯化钾 ${gradeText(MIX_KCL)}`,
        kgText: trimNum(plan.kcl, 2),
        nText: '0',
        pText: '0',
        kText: trimNum(plan.aK, 2)
      }
    ],
    totalKgText: trimNum(plan.dap + plan.urea + plan.kcl, 2),
    aNText: trimNum(plan.aN, 2),
    aPText: trimNum(plan.aP, 2),
    aKText: trimNum(plan.aK, 2),
    logicText: `配比逻辑：先用磷酸二铵满足目标磷 ${trimNum(tP, 2)} kg（${trimNum(plan.dap, 2)} kg，带入纯 N ${trimNum(plan.nFromDap, 2)} kg），再用尿素补氮 ${trimNum(Math.max(0, tN - plan.nFromDap), 2)} kg，最后氯化钾补钾 ${trimNum(tK, 2)} kg。忌氯作物请把氯化钾换成硫酸钾（用量 = 目标 K₂O ÷ 50%）。`,
    surplusTexts
  }
})

// ---------- 施肥单文本 ----------
const copyText = computed(() => {
  if (mode.value === 'pure' && pureResult.value.ok) {
    const r = pureResult.value
    return [
      '【施肥单 · 折纯量】',
      `肥料：${r.fertName} ${r.gradeText} · 亩用量 ${r.weightText} kg`,
      `折纯：N ${r.nText} kg / P₂O₅ ${r.pText} kg / K₂O ${r.kText} kg（合计 ${r.totalText} kg）`,
      '提醒：以测土配方与农技推荐用量为准，品位以肥料包装标识为准'
    ].join('\n')
  }
  if (mode.value === 'reverse' && revResult.value.ok) {
    const r = revResult.value
    return [
      '【施肥单 · 目标反推】',
      `目标养分：${r.nutrientLabel} ${r.targetText} kg`,
      `需肥料：${r.fertName}（品位 ${r.gradeValueText}%）→ ${r.kgText} kg`,
      r.sideText,
      '提醒：以测土配方与农技推荐用量为准'
    ].join('\n')
  }
  if (mode.value === 'mix' && mixResult.value.ok) {
    const r = mixResult.value
    return [
      '【施肥单 · 三肥组合方案】',
      `目标 N-P₂O₅-K₂O：${r.targetText} kg`,
      ...r.rows.map(row => `${row.name}：${row.kgText} kg`),
      `实际折纯：N ${r.aNText} / P₂O₅ ${r.aPText} / K₂O ${r.aKText} kg`,
      ...(r.surplusTexts.length ? ['富余：' + r.surplusTexts.join(' ')] : []),
      '提醒：忌氯作物把氯化钾换成硫酸钾；以测土配方与农技推荐为准'
    ].join('\n')
  }
  return ''
})

// ---------- 预设（自测锚点口径） ----------
const presetDefs = [
  { id: 'pureUrea', label: '尿素 10 kg → 折纯 N 4.6 kg' },
  { id: 'revN8', label: '目标纯 N 8 kg → 尿素约 17.39 kg' },
  { id: 'mix844', label: '组合目标 8-4-4 → 二铵 8.70 + 尿素 13.99 + 氯化钾 6.67 kg' }
]

function applyPreset(id) {
  addRecentTool('fertilizer-calculator')
  if (id === 'pureUrea') {
    mode.value = 'pure'
    Object.assign(pure, { fertId: 'urea', weight: '10' })
  } else if (id === 'revN8') {
    mode.value = 'reverse'
    Object.assign(rev, { fertId: 'urea', nutrient: 'n', amount: '8' })
  } else if (id === 'mix844') {
    mode.value = 'mix'
    Object.assign(mix, { tN: '8', tP: '4', tK: '4' })
  }
}

function resetInputs() {
  addRecentTool('fertilizer-calculator')
  mode.value = 'pure'
  Object.assign(pure, DEFAULTS.pure)
  Object.assign(rev, DEFAULTS.rev)
  Object.assign(mix, DEFAULTS.mix)
  Object.assign(custom, DEFAULTS.custom)
}

// ---------- 交互回调（仅浏览器环境，SSR 安全） ----------
async function copyResult() {
  addRecentTool('fertilizer-calculator')
  const text = copyText.value
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

// 品位速查表（SEO 区静态展示）
const gradeTable = FERTILIZERS.filter(f => f.grade).map(f => ({
  name: f.name,
  n: trimNum(f.grade.n, 0),
  p: trimNum(f.grade.p, 0),
  k: trimNum(f.grade.k, 0),
  note: f.id === 'dap' ? '磷氮双养分，组合方案先配它' : (f.id === 'kcl' ? '忌氯作物换硫酸钾' : (f.id === 'urea' ? '最常用的单氮肥' : (f.id === 'ssp' ? '低氮磷肥，可精确供磷' : '单养分氮肥')))
}))

// 相关工具（引用注册表真实条目）
const relatedTools = computed(() => {
  const ids = ['pesticide-dilution-calculator', 'unit-converter', 'proportion-calculator', 'percentage-calculator']
  return ids.map(id => tools.find(t => t.id === id)).filter(Boolean)
})

onMounted(() => {
  addRecentTool('fertilizer-calculator')
})

onBeforeUnmount(() => {
  if (copyTimer) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
})
</script>
