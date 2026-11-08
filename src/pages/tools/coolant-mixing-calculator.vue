<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ThermometerSnowflake class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">防冻液冰点配比计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">乙二醇浓度 ↔ 冰点双向对照，两种浓度混合配比，整车容量换算母液与加水量</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线防冻液冰点配比工具：按乙二醇-水溶液的体积分数口径，做浓度与冰点的双向互查；
        支持把两种不同浓度的防冻液按体积混合出目标冰点，以及按冷却系统容量换算"母液 + 水"各需多少升。
        浓度过高（约 65% 附近为冰点最低点）后冰点反而回升，本页对照表完整覆盖回升段。
        全部计算在浏览器本地完成，不采集任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        口径说明：本页表值为<span class="text-foreground font-medium">纯乙二醇-水溶液（体积分数）</span>的冰点，
        综合三份公开工程图表（Engineering ToolBox、CoreChem、Nu-Calgon）取值，来源间最大分歧约 3°C；
        65%~75% 一段为实测锚点间的内插估值（该段各资料口径差异最大）。
        商品防冻液含缓蚀剂等添加剂，实际冰点以<span class="text-foreground font-medium">冰点计 / 折射仪实测</span>为准；
        换液与补液标准以<span class="text-foreground font-medium">车辆说明书</span>为准。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左列：三个计算卡 -->
      <div class="space-y-6">
        <!-- 双向互查 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ArrowLeftRight class="w-5 h-5 mr-2 text-primary" /> 浓度 ↔ 冰点双向互查
          </h2>

          <div class="flex gap-2">
            <button
              @click="dir = 'c2f'"
              :class="['px-4 py-2 rounded-lg text-sm transition', dir === 'c2f' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground']"
            >浓度 → 冰点</button>
            <button
              @click="dir = 'f2c'"
              :class="['px-4 py-2 rounded-lg text-sm transition', dir === 'f2c' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground']"
            >冰点 → 浓度</button>
          </div>

          <!-- 浓度 → 冰点 -->
          <div v-if="dir === 'c2f'" class="space-y-3">
            <div>
              <label for="cmc-conc" class="block text-sm font-medium text-foreground mb-1.5">乙二醇体积分数（%）</label>
              <input
                id="cmc-conc"
                v-model.number="concInput"
                type="number"
                min="0"
                max="100"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 50"
              >
              <div class="flex flex-wrap gap-2 mt-2">
                <button
                  v-for="preset in concPresets"
                  :key="preset"
                  @click="concInput = preset"
                  class="px-3 py-1.5 rounded-lg text-xs bg-muted hover:bg-muted/80 text-muted-foreground transition"
                >{{ preset }}%</button>
              </div>
            </div>
            <div v-if="c2fResult" class="p-4 rounded-lg border border-border bg-muted/50">
              <p class="text-sm text-muted-foreground">冰点（约）</p>
              <p class="text-3xl font-bold text-foreground mt-1">{{ c2fResult.fp }} <span class="text-sm font-normal text-muted-foreground">°C</span></p>
              <p v-if="c2fResult.warn" class="text-xs mt-2 text-amber-600 dark:text-amber-400 font-medium">{{ c2fResult.warn }}</p>
            </div>
            <p v-else class="text-xs text-muted-foreground">输入 0~100 之间的浓度开始查询。</p>
          </div>

          <!-- 冰点 → 浓度 -->
          <div v-else class="space-y-3">
            <div>
              <label for="cmc-fp" class="block text-sm font-medium text-foreground mb-1.5">目标冰点（°C）</label>
              <input
                id="cmc-fp"
                v-model.number="fpInput"
                type="number"
                max="0"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 -35"
              >
              <div class="flex flex-wrap gap-2 mt-2">
                <button
                  v-for="preset in fpPresets"
                  :key="preset"
                  @click="fpInput = preset"
                  class="px-3 py-1.5 rounded-lg text-xs bg-muted hover:bg-muted/80 text-muted-foreground transition"
                >{{ preset }}°C</button>
              </div>
            </div>
            <div v-if="f2cResult && f2cResult.conc !== null" class="p-4 rounded-lg border border-border bg-muted/50">
              <p class="text-sm text-muted-foreground">所需乙二醇浓度（体积分数，约）</p>
              <p class="text-3xl font-bold text-foreground mt-1">{{ f2cResult.conc }} <span class="text-sm font-normal text-muted-foreground">%</span></p>
              <p class="text-xs text-muted-foreground mt-2">配到这个浓度冰点即约 {{ freezePointOf(f2cResult.conc) }} °C；请确认它比当地极端低温再低 10°C 左右，不够就把目标冰点再往下调。</p>
            </div>
            <div v-else-if="f2cResult && f2cResult.conc === null" class="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
              <p class="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">目标冰点超出乙二醇体系可达范围</p>
              <p class="text-xs text-amber-700/90 dark:text-amber-400/90">乙二醇-水溶液冰点最低约 {{ minFp }} °C（浓度 {{ minConc }}% 附近），再浓只会回升。这个目标需要换更低温型产品或电加热等方案，不是加浓能解决的。</p>
            </div>
            <p v-else class="text-xs text-muted-foreground">输入不高于 0°C 的目标冰点开始反查。</p>
          </div>
        </div>

        <!-- 两种浓度混合 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Blend class="w-5 h-5 mr-2 text-primary" /> 两种浓度混合计算
          </h2>
          <p class="text-xs text-muted-foreground">按体积加权平均：c = (c₁×v₁ + c₂×v₂) ÷ (v₁ + v₂)。应急补液时，先测出两种液的浓度再算配比。</p>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="cmc-c1" class="block text-sm font-medium text-foreground mb-1.5">液体 A 浓度（%）</label>
              <input id="cmc-c1" v-model.number="mix.c1" type="number" min="0" max="100" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 25">
            </div>
            <div>
              <label for="cmc-v1" class="block text-sm font-medium text-foreground mb-1.5">体积 A（升）</label>
              <input id="cmc-v1" v-model.number="mix.v1" type="number" min="0" step="0.1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 1">
            </div>
            <div>
              <label for="cmc-c2" class="block text-sm font-medium text-foreground mb-1.5">液体 B 浓度（%）</label>
              <input id="cmc-c2" v-model.number="mix.c2" type="number" min="0" max="100" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 50">
            </div>
            <div>
              <label for="cmc-v2" class="block text-sm font-medium text-foreground mb-1.5">体积 B（升）</label>
              <input id="cmc-v2" v-model.number="mix.v2" type="number" min="0" step="0.1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 1">
            </div>
          </div>

          <div v-if="mixResult" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="p-4 rounded-lg border border-border bg-muted/50">
              <p class="text-sm text-muted-foreground">混合后浓度</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ mixResult.mixC }}%</p>
            </div>
            <div class="p-4 rounded-lg border border-border bg-muted/50">
              <p class="text-sm text-muted-foreground">混合后冰点（约）</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ mixResult.mixFp }}°C</p>
            </div>
          </div>
          <p v-else class="text-xs text-amber-600 dark:text-amber-400">请填写两种液体的浓度（0~100%）与大于 0 的体积。</p>
        </div>

        <!-- 整车换算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Car class="w-5 h-5 mr-2 text-primary" /> 整车容量换算：母液 + 水 各需多少
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="cmc-cap" class="block text-sm font-medium text-foreground mb-1.5">冷却系统容量（升）</label>
              <input id="cmc-cap" v-model.number="car.capacity" type="number" min="1" step="0.5" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 5.5">
              <div class="flex flex-wrap gap-1.5 mt-2">
                <button
                  v-for="preset in capacityPresets"
                  :key="preset"
                  @click="car.capacity = preset"
                  class="px-2.5 py-1 rounded-md text-xs bg-muted hover:bg-muted/80 text-muted-foreground transition"
                >{{ preset }}L</button>
              </div>
              <p class="text-xs text-muted-foreground mt-1">家用车常见 4~8L，以说明书为准</p>
            </div>
            <div>
              <label for="cmc-stock" class="block text-sm font-medium text-foreground mb-1.5">母液浓度（%）</label>
              <input id="cmc-stock" v-model.number="car.stockC" type="number" min="0" max="100" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 100">
              <p class="text-xs text-muted-foreground mt-1">商品浓缩液常见 92%~96%，按瓶身标注填</p>
            </div>
            <div>
              <label for="cmc-target" class="block text-sm font-medium text-foreground mb-1.5">目标浓度（%）</label>
              <input id="cmc-target" v-model.number="car.targetC" type="number" min="0" max="100" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 50">
              <div class="flex flex-wrap gap-1.5 mt-2">
                <button
                  v-for="chip in targetChips"
                  :key="chip.fp"
                  @click="applyTargetChip(chip)"
                  class="px-2.5 py-1 rounded-md text-xs bg-muted hover:bg-muted/80 text-muted-foreground transition"
                  :title="'目标冰点 ' + chip.fp + '°C'"
                >冰点{{ chip.fp }}°C→{{ chip.c }}%</button>
              </div>
            </div>
          </div>

          <div v-if="volResult" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-4 rounded-lg border border-border bg-muted/50">
              <p class="text-sm text-muted-foreground">需母液</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ volResult.v1 }} <span class="text-sm font-normal text-muted-foreground">升</span></p>
            </div>
            <div class="p-4 rounded-lg border border-border bg-muted/50">
              <p class="text-sm text-muted-foreground">需加水</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ volResult.v2 }} <span class="text-sm font-normal text-muted-foreground">升</span></p>
            </div>
            <div class="p-4 rounded-lg border border-border bg-muted/50">
              <p class="text-sm text-muted-foreground">配好后冰点（约）</p>
              <p class="text-2xl font-bold text-foreground mt-1">{{ volResult.fp }}°C</p>
            </div>
          </div>
          <p v-else class="text-xs text-amber-600 dark:text-amber-400">请填写容量（&gt;0）、母液与目标浓度（0~100%，且目标不高于母液浓度）。</p>

          <p class="text-xs leading-relaxed text-muted-foreground">
            注：加注量以说明书标称容量为准，膨胀水壶只加到刻度线之间，冷却液受热膨胀需要空间；
            加注后怠速运转几分钟排气，液面下降再补到线，冷车复检。
          </p>
        </div>
      </div>

      <!-- 右列：对照表 + 诚实卡 -->
      <div class="space-y-6">
        <!-- 对照表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Table class="w-5 h-5 mr-2 text-primary" /> 乙二醇浓度-冰点对照表（体积分数）
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">乙二醇浓度</th>
                  <th class="py-2 pr-3 font-medium">冰点（约）</th>
                  <th class="py-2 font-medium">注记</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in tableRows"
                  :key="row.c"
                  class="border-b border-border/50 hover:bg-muted/40 cursor-pointer transition-colors"
                  @click="pickFromTable(row.c)"
                >
                  <td class="py-2 pr-3 font-semibold text-foreground">{{ row.c }}%</td>
                  <td class="py-2 pr-3 text-muted-foreground">{{ row.fp }} °C</td>
                  <td class="py-2 text-xs text-muted-foreground">{{ row.note }}</td>
                </tr>
              </tbody>
            </table>
            <p class="text-xs text-muted-foreground mt-2">点击任意一行可把该浓度填入"浓度 → 冰点"查询。</p>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            表值为纯乙二醇-水溶液口径；65%~75% 一段为内插估值。乙二醇-水在低浓度下先析出冰晶成"冰泥"，
            实际使用应让冰点比预计最低气温低 10°C 以上（口径参考，以说明书为准）。
          </p>
        </div>

        <!-- 诚实卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ShieldAlert class="w-5 h-5 mr-2 text-primary" /> 换液前必读的安全与口径提示
          </h2>
          <ul class="space-y-3 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">不建议不同品牌混用：</span>各品牌缓蚀剂配方（硅酸盐型 / OAT 长效型等）体系不同，混合后冰点虽可按本页估算，但添加剂可能相互反应失效甚至析出沉淀。应急补液优先同品牌同型号，实在没有可少量补蒸馏水并尽快整体更换。</span>
            </li>
            <li class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">乙二醇有毒：</span>有甜味，务必防止儿童与宠物误饮；操作时戴手套，接触皮肤用大量清水冲洗；废液勿倒入下水道或土壤，交由维修店或回收点处理。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">实测为准：</span>本页是纯乙二醇-水口径的估算，商品液含添加剂。冷车从膨胀壶取样，用冰点计或折射仪实测现有冰点再决定补多少。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">冰点不是沸点：</span>冰点合格不代表开锅不会发生。开锅优先查散热器堵塞、节温器、水泵与风扇，靠加浓防冻液解决不了散热问题。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">浓度不超过 60%：</span>约 65% 浓度冰点最低（本表约 {{ minFp }}°C），继续加浓冰点回升、比热下降换热变差、低温粘度增大。常规区间 40%~60% 足够绝大多数场景。</span>
            </li>
          </ul>
        </div>

        <!-- 免责 -->
        <div class="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
            免责声明：本页计算为通用工程口径的估算，不构成维修建议。冰点、容量与换液周期以车辆说明书、防冻液产品标注与实测仪器读数为准。
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>防冻液冰点与乙二醇配比是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          汽车防冻液的主流体系是<span class="text-foreground font-medium">乙二醇 + 水 + 缓蚀剂</span>：
          乙二醇负责降低冰点、抬高沸点，缓蚀剂负责保护缸体、水箱与水管。
          冰点只取决于乙二醇与水的比例（体积分数）：纯水 0°C，30% 左右约 -14°C，50% 左右约 -35°C，
          60% 左右约 -50°C；浓度继续升高，冰点反而在 65% 附近触底后回升——纯乙二醇自己的熔点只有约 -13°C。
          所以"越浓越防冻"是错的，配比计算的意义在于<span class="text-foreground font-medium">用刚好够的浓度拿到目标冰点</span>，
          兼顾换热效率与成本。本页对照表按纯乙二醇-水溶液（体积分数）口径给出，并做双向互查。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>什么时候需要算冰点配比？</h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li>入冬前检查：冷车实测现有冰点，离当地极端低温余量不足 10°C 就该补浓或换液</li>
          <li>应急补液后复配：补过水或混过不同浓度余液，需要算混合后到底还有多少冰点保护</li>
          <li>买母液自己兑：按目标冰点换算母液与蒸馏水各需多少升，不再整桶买预混液</li>
          <li>二手车接手：冷却液状态不明，先测冰点判断是否整体更换</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>如何使用本工具？</h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>查冰点：在"浓度 ↔ 冰点"卡输入乙二醇浓度，直接读出对应冰点</li>
          <li>反查浓度：切换到"冰点 → 浓度"，输入目标冰点，得到所需浓度（自动只选更省液的那一支解）</li>
          <li>混合估算：在"混合计算"卡填两种液的浓度与体积，看混合后的浓度与冰点</li>
          <li>整车换算：填冷却系统容量、母液浓度与目标浓度，得到母液与加水升数</li>
          <li>冷车实测复核：加注后循环排气再复检，以折射仪/冰点计读数为准</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>浓度为什么不能无限加？</h2>
        <p class="text-sm text-muted-foreground mb-6 leading-relaxed">
          乙二醇-水溶液的冰点曲线是<span class="text-foreground font-medium">先降后升</span>的：约 65% 浓度时最低（本表约 {{ minFp }}°C），
          再往上纯乙二醇占比太高，冰点反而向纯乙二醇的 -13°C 回升。
          同时浓度越高，溶液比热越低（50% 时比水低约 20%）、低温下粘度越大，水泵负担与流动换热都变差。
          所以高寒地区也不是把浓度拉满，而是选 55%~60% 配比或直接选标称更低冰点的成品液。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">防冻液冰点选多少合适？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              通用口径是让冰点比所在地区极端最低气温再低 10°C 以上，留出冰泥缓冲余量。
              多数地区 40%~50% 浓度（约 -23°C ~ -35°C）已够用；东北等严寒地区取 55%~60%。
              具体以车辆说明书与当地气象口径为准，本页不替你做死数据承诺。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">不同品牌的防冻液能混加吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不建议。冰点可以按乙二醇占比估算，但各品牌缓蚀剂体系（硅酸盐型、OAT 长效型等）不同，
              混合后可能相互中和甚至析出沉淀，腐蚀防护形同虚设。应急优先同品牌同型号；
              确实找不到时少量补蒸馏水撑到维修店，之后尽快整体换新。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">直接加纯乙二醇会不会更防冻？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不会。纯乙二醇熔点约 -13°C，比 60% 浓度的溶液高得多；而且比热低、流动性差。
              乙二醇必须和水配合才有效，浓度控制在 40%~60% 最合理。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">怎么测现有防冻液的冰点？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              冷车时从膨胀水壶用吸管取样，用冰点折射仪（几元到几十元的手持折射仪即可）或电子冰点计读数；
              也可用服务站的标准流程。热车取样温度高，折射仪读数会失真，务必冷车测。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">乙二醇有毒吗？误饮了怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              乙二醇对人体低毒但危害实在：代谢产物会损伤肾脏与神经系统，且有甜味容易被儿童宠物误当饮料。
              存放要盖紧放高处，洒漏及时用清水冲净。一旦误饮立即就医并说明是乙二醇，不要催吐等待。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'coolant-mixing-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  ThermometerSnowflake, ArrowLeftRight, Blend, Car, Table, ShieldAlert,
  Info, AlertTriangle, CheckCircle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 乙二醇-水溶液冰点对照表（体积分数 % → 冰点 °C）。
// 取值综合三份公开工程图表（体积分数口径）：
//   ET   = Engineering ToolBox "Ethylene Glycol Heat-Transfer Fluid"（10% 步进 + 80/90% 近似值）
//   CC   = CoreChem GlycoChill Freeze Point Chart（5% 步进，65%~75% 一段标 "< -49"）
//   NC   = Nu-Calgon Freez-Therm 乙二醇稀释表（30%~60% 步进）
// 同一浓度多源时取算术平均（保留 0.1）；65/70/75 三行为实测锚点间内插估值。
const EG_FREEZE_TABLE = [
  { c: 0, fp: 0 },
  { c: 5, fp: -1.4 },
  { c: 10, fp: -3.3 },
  { c: 15, fp: -5.4 },
  { c: 20, fp: -7.9 },
  { c: 25, fp: -10.7 },
  { c: 30, fp: -14.3 },
  { c: 35, fp: -17.9 },
  { c: 40, fp: -23.0 },
  { c: 45, fp: -28.2 },
  { c: 50, fp: -35.0 },
  { c: 55, fp: -41.3 },
  { c: 60, fp: -49.8 },
  { c: 65, fp: -51.5 },
  { c: 70, fp: -51.0 },
  { c: 75, fp: -49.3 },
  { c: 80, fp: -46.4 },
  { c: 85, fp: -36.9 },
  { c: 90, fp: -29.9 },
  { c: 95, fp: -19.4 },
  { c: 100, fp: -12.8 }
]
// 冰点最低点所在行下标（c=65）。invertConcentration 只在下降段反查。
const EG_MIN_INDEX = 13

function round(v, d) {
  if (!Number.isFinite(v)) return null
  const m = Math.pow(10, d)
  return Math.round((v + Number.EPSILON) * m) / m
}

// 浓度（体积分数 0~100）→ 冰点 °C；相邻锚点线性插值，非法输入返回 null
function freezePointOf(conc) {
  const c = Number(conc)
  if (!Number.isFinite(c) || c < 0 || c > 100) return null
  const t = EG_FREEZE_TABLE
  for (let i = 0; i < t.length; i++) {
    if (t[i].c === c) return t[i].fp
  }
  for (let i = 1; i < t.length; i++) {
    if (c < t[i].c) {
      const a = t[i - 1]
      const b = t[i]
      return round(a.fp + (b.fp - a.fp) * ((c - a.c) / (b.c - a.c)), 1)
    }
  }
  return t[t.length - 1].fp
}

// 冰点 °C → 所需浓度（体积分数）。只搜下降段（0% → 最低点行）：
// 同一冰点在高浓度回升段还有一支解，但那支更费液、换热更差，不是工程答案。
// 目标高于 0°C 或低于曲线最低点时返回 null（后者 = 乙二醇体系物理上不可达）。
function invertConcentration(fp) {
  const f = Number(fp)
  if (!Number.isFinite(f) || f > 0) return null
  if (f === 0) return 0
  const minFp = EG_FREEZE_TABLE[EG_MIN_INDEX].fp
  if (f < minFp) return null
  if (f === minFp) return EG_FREEZE_TABLE[EG_MIN_INDEX].c
  for (let i = 1; i <= EG_MIN_INDEX; i++) {
    const a = EG_FREEZE_TABLE[i - 1]
    const b = EG_FREEZE_TABLE[i]
    if (f <= a.fp && f >= b.fp) {
      return round(a.c + (b.c - a.c) * ((a.fp - f) / (a.fp - b.fp)), 1)
    }
  }
  return null
}

// 两种浓度按体积加权平均：c = (c1*v1 + c2*v2) / (v1+v2)。非法输入返回 null。
function mixConcentration(c1, v1, c2, v2) {
  const a = Number(c1)
  const b = Number(c2)
  const x = Number(v1)
  const y = Number(v2)
  if (![a, b, x, y].every(Number.isFinite)) return null
  if (a < 0 || a > 100 || b < 0 || b > 100 || x <= 0 || y <= 0) return null
  return round((a * x + b * y) / (x + y), 1)
}

// 配出 target 浓度共 totalL 升，需要两种液体各多少升。
// 目标落在两浓度区间之外、或两浓度相同而目标不同时无解，返回 null。
function solveMixVolumes(c1, c2, target, totalL) {
  const a = Number(c1)
  const b = Number(c2)
  const t = Number(target)
  const L = Number(totalL)
  if (![a, b, t, L].every(Number.isFinite)) return null
  if (a < 0 || a > 100 || b < 0 || b > 100 || t < 0 || t > 100 || L <= 0) return null
  if (a === b) return t === a ? { v1: L, v2: 0 } : null
  const v1 = L * (t - b) / (a - b)
  const v2 = L - v1
  if (v1 < 0 || v2 < 0) return null
  return { v1: round(v1, 2), v2: round(v2, 2) }
}

// 母液兑水：即 solveMixVolumes(母液浓度, 0, 目标浓度, 总量) 的特例
function stockDilution(stockC, targetC, totalL) {
  return solveMixVolumes(stockC, 0, targetC, totalL)
}

// 手算断言参考（开发期逐条在 node 中对已发布文件跑过，详见交付报告）：
//   freezePointOf(0)=0；freezePointOf(50)=-35∈[-40,-34]；freezePointOf(60)=-49.8∈[-55,-48]
//   freezePointOf(20)=-7.9；freezePointOf(30)=-14.3；freezePointOf(40)=-23.0；freezePointOf(80)=-46.4；freezePointOf(100)=-12.8
//   最低点 freezePointOf(65)=-51.5，80% 高于 65%（回升段成立）；5%~65% 单调下降；25% 落在 20%/30% 之间（插值）
//   invertConcentration(0)=0；invert(freezePointOf(c))≈c（c=5..60 步进 5，±0.1）
//   invertConcentration(-52)=null（低于最低点不可达）；invertConcentration(-51)=63.5（下降段，非回升段 ~94%）；invertConcentration(5)=null
//   mixConcentration(40,1,60,1)=50（规格指定断言）；(25,2,50,1)=33.3；(50,2,50,3)=50；(150,1,50,1)=null
//   solveMixVolumes(100,0,50,8)={v1:4,v2:4}；(25,50,40,6)={v1:2.4,v2:3.6} 回代=40；(25,50,60,6)=null；(50,50,40,6)=null
//   stockDilution(96,50,5.6)={v1:2.92,v2:2.68} 回代≈50
// ==== PURE-FNS-END ====

// SEO
useSeoMeta({
  title: '防冻液冰点配比计算器 - 乙二醇浓度与冰点对照 | 有条工具',
  description: '在线防冻液冰点配比计算器：乙二醇浓度与冰点双向对照（50%≈-35°C、60%≈-50°C），两种浓度防冻液混合配比，冷却系统容量换算母液与加水量，附浓度-冰点对照表、跨品牌混用与乙二醇毒性安全提示，纯本地计算。',
  keywords: '防冻液冰点,乙二醇冰点表,防冻液配比,冷却液冰点,防冻液混合,防冻液兑水比例,乙二醇浓度',
  author: '有条工具',
  ogTitle: '防冻液冰点配比计算器',
  ogDescription: '乙二醇浓度与冰点双向对照，混合配比与整车容量换算，附安全提示',
  ogUrl: 'https://www.util.cn/tools/coolant-mixing-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '防冻液冰点配比计算器',
  twitterDescription: '乙二醇浓度 ↔ 冰点双向对照，混合配比与整车换算，纯本地计算'
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
          name: '防冻液冰点配比计算器',
          url: 'https://www.util.cn/tools/coolant-mixing-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '乙二醇浓度 → 冰点正向查询（线性插值）',
            '目标冰点 → 所需浓度反查',
            '两种浓度防冻液混合配比计算',
            '冷却系统容量换算母液与加水量',
            '乙二醇浓度-冰点对照表（含回升段）',
            '跨品牌混用与乙二醇毒性安全提示'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '防冻液冰点配比计算器', item: 'https://www.util.cn/tools/coolant-mixing-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '防冻液冰点选多少合适？',
              acceptedAnswer: { '@type': 'Answer', text: '通用口径是冰点比所在地区极端最低气温再低 10°C 以上。多数地区 40%~50% 浓度（约 -23°C ~ -35°C）够用，严寒地区取 55%~60%，具体以车辆说明书为准。' }
            },
            {
              '@type': 'Question',
              name: '不同品牌的防冻液能混加吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不建议。冰点虽可按乙二醇占比估算，但各品牌缓蚀剂体系不同，混合后可能失效甚至析出沉淀；应急优先同品牌同型号，否则少量补蒸馏水并尽快整体更换。' }
            },
            {
              '@type': 'Question',
              name: '直接加纯乙二醇会不会更防冻？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。纯乙二醇熔点约 -13°C，比 60% 浓度的溶液高得多，且比热低、流动性差；乙二醇必须与水配合，浓度控制在 40%~60% 最合理。' }
            },
            {
              '@type': 'Question',
              name: '怎么测现有防冻液的冰点？',
              acceptedAnswer: { '@type': 'Answer', text: '冷车时从膨胀水壶取样，用冰点折射仪或电子冰点计读数；热车取样温度高会使折射仪读数失真，务必冷车测。' }
            },
            {
              '@type': 'Question',
              name: '乙二醇有毒吗？',
              acceptedAnswer: { '@type': 'Answer', text: '乙二醇低毒且有甜味，须防儿童宠物误饮；操作戴手套，接触皮肤用清水冲洗，废液交维修店或回收点处理，误饮立即就医并说明是乙二醇。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'coolant-mixing-calculator'
const SETTINGS_KEY = 'coolant-mixing-calculator-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 状态 ----------
const dir = ref('c2f')
const concInput = ref(50)
const fpInput = ref(-25)
const mix = ref({ c1: 25, v1: 1, c2: 50, v2: 1 })
const car = ref({ capacity: 5, stockC: 100, targetC: 50 })

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const concPresets = [30, 40, 50, 60]
const fpPresets = [-15, -25, -35, -45]
const capacityPresets = [4, 5, 6, 8]

const minConc = EG_FREEZE_TABLE[EG_MIN_INDEX].c
const minFp = EG_FREEZE_TABLE[EG_MIN_INDEX].fp

// ---------- 双向互查 ----------
const c2fResult = computed(() => {
  const fp = freezePointOf(concInput.value)
  if (fp === null) return null
  let warn = ''
  const c = Number(concInput.value)
  if (Number.isFinite(c) && c > 60) {
    warn = '浓度已超过 60%：冰点接近或越过最低点，换热变差，通常没有必要加这么浓。'
  } else if (Number.isFinite(c) && c < 25) {
    warn = '浓度偏低：冰点余量小，仅适合轻寒区或应急，入冬前建议复核。'
  }
  return { fp, warn }
})

const f2cResult = computed(() => {
  const f = Number(fpInput.value)
  if (!Number.isFinite(f)) return null
  return { conc: invertConcentration(f) }
})

const targetChips = computed(() => fpPresets.map(fp => {
  const c = invertConcentration(fp)
  return { fp, c: c === null ? '—' : c }
}))

function applyTargetChip(chip) {
  if (chip.c !== '—') car.value.targetC = chip.c
}

// ---------- 混合 ----------
const mixResult = computed(() => {
  const m = mix.value
  const mixC = mixConcentration(m.c1, m.v1, m.c2, m.v2)
  if (mixC === null) return null
  return { mixC, mixFp: freezePointOf(mixC) }
})

// ---------- 整车换算 ----------
const volResult = computed(() => {
  const k = car.value
  const v = stockDilution(k.stockC, k.targetC, k.capacity)
  if (!v) return null
  const fp = freezePointOf(k.targetC)
  return { v1: v.v1, v2: v.v2, fp }
})

// ---------- 对照表 ----------
const TABLE_NOTES = {
  0: '纯水，无防冻能力',
  20: '轻防护 / 南方应急',
  30: '轻寒区常用',
  40: '四季通用常见',
  50: '北方冬季常见',
  60: '实用上限附近',
  65: '曲线最低区（内插）',
  80: '过浓，冰点回升',
  100: '纯乙二醇（约 -13°C）'
}
const tableRows = computed(() => EG_FREEZE_TABLE.map(row => ({
  c: row.c,
  fp: row.fp,
  note: TABLE_NOTES[row.c] || ''
})))

function pickFromTable(c) {
  dir.value = 'c2f'
  concInput.value = c
}

// ---------- 设置持久化（localStorage，仅 onMounted/交互回调触达，SSR 安全） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (s.dir === 'c2f' || s.dir === 'f2c') dir.value = s.dir
    if (Number.isFinite(s.concInput)) concInput.value = s.concInput
    if (Number.isFinite(s.fpInput)) fpInput.value = s.fpInput
    if (s.mix && [s.mix.c1, s.mix.v1, s.mix.c2, s.mix.v2].every(Number.isFinite)) mix.value = s.mix
    if (s.car && [s.car.capacity, s.car.stockC, s.car.targetC].every(Number.isFinite)) car.value = s.car
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([dir, concInput, fpInput, mix, car], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      dir: dir.value,
      concInput: concInput.value,
      fpInput: fpInput.value,
      mix: mix.value,
      car: car.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
}, { deep: true })
</script>
