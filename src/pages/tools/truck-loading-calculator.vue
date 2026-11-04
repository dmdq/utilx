<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Truck class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">货车车厢装载计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">纸箱装车数量测算 · 车厢体积与载重双约束 · 一车到底能装多少件</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线测算一辆货车 / 集装箱能装多少件货：按车厢内净尺寸与单件货物长宽高，枚举整箱旋转的 6 个摆放朝向，取轴对齐网格的最优件数，
        再与车辆载重上限取小，输出最大可装件数、约束来源（体积先用满还是载重先到）、体积利用率与俯视网格示意；
        内置面包车、4.2 米厢货到 17.5 米大板、20GP / 40HQ 集装箱等常用车型预设。适合电商发货、批发市场整车配货与搬家估算，全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <!-- 说明条 -->
    <div class="flex items-start gap-2 rounded-lg border border-border bg-muted/60 px-4 py-3 mb-6">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-foreground">
        装量按规则正交摆放（长宽高对齐车厢轴）估算，允许整箱旋转 6 个朝向取最优；不计算堆码承重极限与缝隙填充——重货请叠加载重与堆码层数校验（本工具已含载重上限核对）。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Truck class="w-5 h-5 mr-2 text-primary" /> 车型预设
          </h2>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="p in TRUCK_PRESETS"
              :key="p.id"
              @click="selectPreset(p)"
              class="text-left px-3 py-2 rounded-lg border text-xs transition"
              :class="selectedId === p.id
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-background hover:bg-accent text-muted-foreground'"
            >
              <span class="block font-semibold text-foreground truncate">{{ p.name }}</span>
              <span class="block mt-0.5 font-mono">{{ p.L }}×{{ p.W }}×{{ p.H }}m</span>
              <span class="block font-mono">载重 {{ fmtKg(p.limitKg) }}</span>
            </button>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-foreground mb-2">车厢内净尺寸（米）与载重上限（kg）</h3>
          <div class="grid grid-cols-2 gap-2">
            <label class="block">
              <span class="text-[10px] text-muted-foreground">内长 m</span>
              <input v-model="tL" @input="selectedId = 'custom'" type="number" min="0" step="0.01" placeholder="4.2"
                class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
            <label class="block">
              <span class="text-[10px] text-muted-foreground">内宽 m</span>
              <input v-model="tW" @input="selectedId = 'custom'" type="number" min="0" step="0.01" placeholder="2.0"
                class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
            <label class="block">
              <span class="text-[10px] text-muted-foreground">内高 m</span>
              <input v-model="tH" @input="selectedId = 'custom'" type="number" min="0" step="0.01" placeholder="2.1"
                class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
            <label class="block">
              <span class="text-[10px] text-muted-foreground">载重 kg</span>
              <input v-model="tLimit" @input="selectedId = 'custom'" type="number" min="0" step="50" placeholder="2000"
                class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
          </div>
        </div>

        <div>
          <h2 class="text-lg font-semibold flex items-center mb-2">
            <Package class="w-5 h-5 mr-2 text-primary" /> 单件货物
          </h2>
          <p class="text-[10px] text-muted-foreground mb-2">件数不设上限，工具直接算这车最多能装多少件；单件毛重选填，填了才核对载重。</p>
          <div class="grid grid-cols-2 gap-2">
            <label class="block">
              <span class="text-[10px] text-muted-foreground">长 cm</span>
              <input v-model="bL" type="number" min="0" step="1" placeholder="60"
                class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
            <label class="block">
              <span class="text-[10px] text-muted-foreground">宽 cm</span>
              <input v-model="bW" type="number" min="0" step="1" placeholder="40"
                class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
            <label class="block">
              <span class="text-[10px] text-muted-foreground">高 cm</span>
              <input v-model="bH" type="number" min="0" step="1" placeholder="40"
                class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
            <label class="block">
              <span class="text-[10px] text-muted-foreground">单件毛重 kg（选填）</span>
              <input v-model="bKg" type="number" min="0" step="0.1" placeholder="10"
                class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            @click="applyDemo"
            class="px-3 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 载入示例
          </button>
          <button
            @click="resetAll"
            class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RotateCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
          </button>
        </div>
        <p class="text-[10px] text-muted-foreground leading-relaxed">
          示例：4.2 米厢货装 60×40×40cm 电商纸箱，单件 10kg。
        </p>
      </div>

      <!-- 结果面板（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 输入不合法提示 -->
        <div
          v-if="!dimsValid"
          class="bg-card border border-border rounded-lg p-4 flex items-start gap-2 bg-red-500/10"
        >
          <TriangleAlert class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p class="text-sm text-foreground">{{ invalidText }}</p>
        </div>

        <template v-else>
          <!-- 结果卡 -->
          <div class="bg-card border border-border rounded-lg p-6 space-y-4">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <h2 class="text-lg font-semibold flex items-center">
                <Package class="w-5 h-5 mr-2 text-primary" /> {{ truckNameText }} · {{ boxText }}cm 货
              </h2>
              <span
                class="inline-block px-2.5 py-1 rounded-full border text-xs font-medium"
                :class="weight.binding === '重量'
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  : 'bg-green-500/10 text-green-600 border-green-500/20'"
              >
                {{ weight.binding === '重量' ? '载重先到' : '体积先用满' }}
              </span>
            </div>

            <div class="bg-primary/10 rounded-lg p-5 text-center">
              <p class="text-xs text-muted-foreground mb-1">最大可装件数</p>
              <p class="text-5xl font-bold text-primary leading-none">
                {{ weight.final }}<span class="text-base font-normal text-muted-foreground ml-1">件</span>
              </p>
              <p class="text-xs text-muted-foreground mt-2">
                按体积可装 {{ pack.count }} 件{{ weight.countByWeight === Infinity ? '' : ` × 按载重可装 ${weight.countByWeight} 件` }}，双约束取小
              </p>
            </div>

            <div>
              <div class="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>体积利用率（{{ weight.final }} 件实占）</span>
                <span class="font-mono text-foreground">{{ utilPct }}%</span>
              </div>
              <div class="h-2 bg-muted rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full transition-all" :style="{ width: Math.min(utilPct, 100) + '%' }"></div>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">摆放朝向（长×宽×高）</p>
                <p class="text-sm font-bold font-mono text-foreground">{{ pack.boxOrient ? orientText(pack.boxOrient) : '—' }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">长×宽×高 格数</p>
                <p class="text-sm font-bold font-mono text-foreground">{{ pack.perDim.nx }}×{{ pack.perDim.ny }}×{{ pack.perDim.nz }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">边角空隙</p>
                <p class="text-sm font-bold font-mono text-foreground">{{ pack.deadSpacePct }}%</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">总重核对</p>
                <p class="text-sm font-bold font-mono text-foreground">{{ totalKgText }}</p>
              </div>
            </div>

            <div
              class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5"
              :class="pack.count > 0 ? '' : 'bg-red-500/10'"
            >
              <CheckCircle v-if="pack.count > 0" class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <TriangleAlert v-else class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{{ remainText }}</span>
            </div>

            <p class="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <RefreshCw class="w-3 h-3" /> 参数改动即时重算；轴对齐网格未优化交错码放，现场骑缝/交错通常还能多装 5-15%。
            </p>
          </div>

          <!-- 俯视网格示意 + 操作 -->
          <div v-if="topView" class="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Truck class="w-5 h-5 mr-2 text-primary" /> 俯视摆放示意（{{ truckNameText }} 平面）
            </h2>
            <svg
              :viewBox="`0 0 ${topView.viewW} ${topView.viewH}`"
              class="w-full h-auto text-primary max-h-80"
              role="img"
              :aria-label="`俯视网格示意：长向 ${topView.nx} 格、宽向 ${topView.ny} 格`"
            >
              <rect x="0" y="0" :width="topView.viewW" :height="topView.viewH" fill="currentColor" fill-opacity="0.07" stroke="currentColor" stroke-width="3" />
              <line
                v-for="(x, i) in topView.vlines"
                :key="'v' + i"
                :x1="x" y1="0" :x2="x" :y2="topView.viewH"
                stroke="currentColor" stroke-opacity="0.45" stroke-width="1"
              />
              <line
                v-for="(y, i) in topView.hlines"
                :key="'h' + i"
                x1="0" :y1="y" :x2="topView.viewW" :y2="y"
                stroke="currentColor" stroke-opacity="0.45" stroke-width="1"
              />
              <text :x="topView.viewW / 2" :y="topView.viewH - 8" text-anchor="middle" font-size="16" fill="currentColor" fill-opacity="0.85">{{ topView.labelL }}</text>
              <text x="10" :y="topView.viewH / 2" font-size="16" fill="currentColor" fill-opacity="0.85">{{ topView.labelW }}</text>
            </svg>
            <p class="text-xs text-muted-foreground">
              底面网格 {{ topView.nx }}×{{ topView.ny }}（{{ pack.boxOrient ? orientText(pack.boxOrient) : '' }}），往上共 {{ pack.perDim.nz }} 层；网格过密时按抽稀绘制，仅示意排布方向。
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                @click="copyManifest"
                class="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
              >
                <CheckCircle v-if="copied" class="w-4 h-4 inline mr-1.5 -mt-0.5" />
                {{ copied ? '配载单已复制' : '复制配载单' }}
              </button>
            </div>
          </div>
          <div v-else class="bg-card border border-border rounded-lg p-6">
            <p class="text-sm text-muted-foreground">单件货任意一边超过车厢对应内尺寸时无法正交装入，请调整货物尺寸或改车型。</p>
          </div>

          <!-- 车型对比表 -->
          <div class="bg-card border border-border rounded-lg p-6 space-y-3">
            <h2 class="text-lg font-semibold flex items-center">
              <Package class="w-5 h-5 mr-2 text-primary" /> 同一件货在常用车型下的最大件数
            </h2>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-xs text-muted-foreground border-b border-border">
                    <th class="py-2 pr-3 font-medium">车型</th>
                    <th class="py-2 pr-3 font-medium">内尺寸</th>
                    <th class="py-2 pr-3 font-medium">载重</th>
                    <th class="py-2 pr-3 font-medium">体积可装</th>
                    <th class="py-2 pr-3 font-medium">最大件数</th>
                    <th class="py-2 font-medium">先到约束</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in compareRows"
                    :key="row.id"
                    @click="selectPreset(row)"
                    class="border-b border-border/60 cursor-pointer transition"
                    :class="row.active ? 'bg-primary/10' : 'hover:bg-accent'"
                  >
                    <td class="py-2 pr-3 font-medium text-foreground whitespace-nowrap">{{ row.name }}</td>
                    <td class="py-2 pr-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{{ row.dimsText }}</td>
                    <td class="py-2 pr-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{{ row.limitText }}</td>
                    <td class="py-2 pr-3 font-mono text-xs text-muted-foreground">{{ row.countByVolume }} 件</td>
                    <td class="py-2 pr-3 font-bold text-foreground">{{ row.count }} 件</td>
                    <td class="py-2">
                      <span
                        class="inline-block px-2 py-0.5 rounded-full border text-[10px] font-medium whitespace-nowrap"
                        :class="row.binding === '重量'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : 'bg-green-500/10 text-green-600 border-green-500/20'"
                      >{{ row.binding === '重量' ? '载重' : '体积' }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-[10px] text-muted-foreground">点击任意行载入该车型；件数已按当前货物尺寸与单件毛重（若已填）双约束取小。</p>
          </div>
        </template>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>货车车厢装载计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          货车车厢装载计算器是一款在线整车装量估算工具。它把车厢内净尺寸（米）与单件货物尺寸（厘米）换算到同一单位后，
          枚举整箱旋转得到的 6 个摆放朝向，对每个朝向按「长向 × 宽向 × 高向各向下取整」计算轴对齐网格可装件数，取最大方案；
          再叠加车辆载重上限（填了单件毛重才参与），体积与重量双约束取小，得到最大可装件数、哪个约束先到、体积利用率、剩余空间三维尺寸与俯视摆放示意，
          并可一键复制配载单。全部计算在浏览器本地完成，不上传货物与车型信息。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">适合哪些场景？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>电商 / 工厂发货：报价前先算一票纸箱货走 4.2 米还是 6.8 米划算。</li>
          <li>批发市场整车配货：现场快速核对「这车按 60×40×40 的箱规最多拉多少件」。</li>
          <li>搬家估算：家电、编织袋按体积粗算一台面包车 / 厢货够不够。</li>
          <li>外贸订柜：20GP / 40HQ 按货箱实测尺寸核对装量，和货代的理论值互相印证。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么「车厢体积 ÷ 箱子体积」算不准？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          体积除法假设货物可以像液体一样填满空间，但整箱正交摆放时，车厢长宽高与箱规几乎不可能成整倍数：2.0 米内宽放 3 排 65cm 纸箱只剩 5cm 缝，
          这条缝一个整箱都塞不进。本工具按 6 个朝向逐轴 floor 取最优，把这个损耗显性化为「边角空隙」。
          注意它是轴对齐估算，不模拟交错码放——现场骑缝交错、半箱补缝通常还能多装 5-15%，算出的数是下限口径，宁少勿多。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">重货和抛货，哪个先到限？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          取决于货物密度：饮料、五金这类重货往往载重先到——体积还空着，吨位已经顶格；棉服、泡沫、大件包装这类抛货往往体积先到——装满也远没到载重。
          本工具用「件数 = min(体积可装件数, 载重上限 ÷ 单件毛重)」双约束取小，并用徽章明确标出先到的是体积还是重量。
          如果你关心的是「这票货按体积重要收多少钱」而不是装车件数，可配合站内体积重计算工具一起用（常见抛比 1:6000 / 1:5000）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">装车现场技巧</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>下重上轻：重箱、密度大的货打底，耐压差的纸箱上层，避免底层被压溃。</li>
          <li>交错补缝：按本工具算完后剩余边角，用编织袋、软包、气泡膜等可变形货物填充，防止刹车时整排倒塌。</li>
          <li>先算高度方向：内高 2.1 米装 40cm 高的箱只有 5 层余量，层高往往是最先卡死的维度，优先把最长边放平。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">20 柜 / 40 高柜能装多少，为什么和铭牌不同？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          集装箱铭牌/理论容积（20GP 约 33 方、40HQ 约 76 方）按箱体最大内尺寸计算，而实际单开门框处内宽约 2.34 米、内高有公差，
          托盘高度与箱门收口还会吃掉顶部边角；本工具 20GP 采用 5.9×2.35×2.39m、40HQ 采用 12.03×2.35×2.69m 的常用净内尺寸并按你的箱规正交摆放核算，
          结果通常比「容积除箱体积」更接近现场。载重也同理：20GP 铭牌 payload 约 28 吨但国内公路按车核载，实际远吃不满，重货先查公路限重再谈铭牌。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">回程车配货常识</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          回程车（配货车）报价低是因为司机本来就要返回，愿意接受「只装半车」的货；此时按体积议价，抛货占满空间但远不到载重、重货反之。
          用本工具先算清「我的货占满这型车百分之多少空间、多重」，再判断该按体积还是按重量谈价、要不要找零担拼车，是比较回程车报价的实用口径。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">一车能装多少件是怎么算出来的？</h3>
            <p class="text-sm text-muted-foreground mt-1">把车厢内净尺寸与单件货物长宽高统一到厘米，枚举整箱旋转的 6 个朝向，对每个朝向下三个方向分别取整除（放不下半个箱），得到网格件数取最大方案；若填了单件毛重，再与「载重上限 ÷ 单件毛重」取小，即为最大可装件数。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么结果比实际能装的少？</h3>
            <p class="text-sm text-muted-foreground mt-1">本工具按规则正交摆放计算，不计算交错码放与缝隙填充，属于保守下限口径；现场骑缝交错码放、用软货补缝通常可多装 5-15%，压装小件还依赖捆扎与人工塞缝，实际以装车为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">载重上限可以直接按预设值用吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">预设值按公开常见标称填写（如 20GP 约 28200kg、40HQ 约 26500kg），仅用于估算。正式配载请核对该车行驶证/集装箱铭牌核定载重、当地公路限重与轴荷分配，17.5 米大板等需办理超限运输证。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">货物数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。车型、箱规与计算全部在你的浏览器本地完成，不发送任何网络请求，复制配载单也是浏览器剪贴板行为。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'truck-loading-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Truck, Package, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, RotateCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '货车车厢装载计算器 - 在线纸箱装车数量与车厢体积测算工具',
  description: '免费在线货车装载计算器：按车厢内净尺寸与纸箱长宽高，6 朝向轴对齐取最优件数，体积与载重双约束核对，输出体积利用率、剩余空间与俯视摆放示意，内置面包车/4.2米/6.8米/9.6米/13米/17.5米/20GP/40HQ 预设，物流发货与搬家配货必备，纯浏览器本地计算不上传',
  keywords: '货车装货计算,纸箱装车数量,车厢体积计算,物流整箱测算,一车装多少件',
  author: '有条工具',
  ogTitle: '货车车厢装载计算器 - 一车能装多少件？ | 有条工具',
  ogDescription: '车厢净尺寸 × 单件箱规，6 朝向轴对齐枚举 + 载重双约束，算出最大装车件数与体积利用率。',
  ogUrl: 'https://www.util.cn/tools/truck-loading-calculator',
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
          name: '货车车厢装载计算器',
          url: 'https://www.util.cn/tools/truck-loading-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['8 种常用车型与集装箱预设', '6 朝向轴对齐网格最优件数', '体积与载重双约束取小', '体积利用率与剩余空间提示', '俯视摆放网格示意', '车型对比表与配载单复制', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '货车车厢装载计算器', item: 'https://www.util.cn/tools/truck-loading-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '一车能装多少件是怎么算出来的？',
              acceptedAnswer: { '@type': 'Answer', text: '把车厢内净尺寸与单件货物长宽高统一到厘米，枚举整箱旋转的6个朝向，对每个朝向下三个方向分别向下取整，得到网格件数取最大方案；若填了单件毛重，再与「载重上限÷单件毛重」取小，即为最大可装件数。' }
            },
            {
              '@type': 'Question',
              name: '为什么计算结果比实际能装的少？',
              acceptedAnswer: { '@type': 'Answer', text: '本工具按规则正交摆放计算，不模拟交错码放与缝隙填充，属于保守下限口径；现场骑缝交错码放、用软货补缝通常可多装5-15%，实际以装车为准。' }
            },
            {
              '@type': 'Question',
              name: '预设载重上限可以直接作为配载依据吗？',
              acceptedAnswer: { '@type': 'Answer', text: '预设值按公开常见标称填写（如20GP约28200kg、40HQ约26500kg），仅用于估算。正式配载请核对该车行驶证或集装箱铭牌核定载重、当地公路限重与轴荷分配，17.5米大板等需办理超限运输证。' }
            },
            {
              '@type': 'Question',
              name: '货物数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。车型、箱规与计算全部在浏览器本地完成，不发送任何网络请求，复制配载单也是浏览器剪贴板行为。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 车型预设：L/W/H 为车厢内净尺寸（米），limitKg 为公开常见标称载重（千克），
// 仅作估算口径，正式配载以铭牌与法规为准；tip 为该车型的常见补充说明。
const TRUCK_PRESETS = [
  { id: 'van', name: '面包车', L: 2.5, W: 1.5, H: 1.3, limitKg: 800, tip: '载物区净高受轮拱影响' },
  { id: 'box42', name: '4.2 米厢货', L: 4.2, W: 2.0, H: 2.1, limitKg: 2000, tip: '蓝牌轻卡常见厢内尺寸' },
  { id: 'box68', name: '6.8 米厢货', L: 6.8, W: 2.4, H: 2.6, limitKg: 8000, tip: '' },
  { id: 'box96', name: '9.6 米厢货', L: 9.6, W: 2.4, H: 2.6, limitKg: 15000, tip: '' },
  { id: 'semi13', name: '13 米半挂', L: 13, W: 2.7, H: 2.8, limitKg: 30000, tip: '' },
  { id: 'flat175', name: '17.5 米大板', L: 17.5, W: 3.0, H: 2.85, limitKg: 30000, tip: '需办超限运输证' },
  { id: 'gp20', name: '集装箱 20GP', L: 5.9, W: 2.35, H: 2.39, limitKg: 28200, tip: '重货常先顶公路限重' },
  { id: 'hq40', name: '集装箱 40HQ', L: 12.03, W: 2.35, H: 2.69, limitKg: 26500, tip: '高柜净高 2.69m' }
]

const toNum = (v) => (typeof v === 'number' ? v : parseFloat(v))
const isValidLen = (v) => Number.isFinite(v) && v > 0

// 整箱旋转得到的 6 个摆放朝向（长宽高在三轴上的全部排列，显式赋值避免对象简写不换值）
function orientationsOf(box) {
  const { l, w, h } = box
  return [
    { l, w, h },
    { l, w: h, h: w },
    { l: w, w: l, h },
    { l: w, w: h, h: l },
    { l: h, w: l, h: w },
    { l: h, w, h: l }
  ]
}

const EMPTY_PACK = Object.freeze({
  boxOrient: null,
  perDim: { nx: 0, ny: 0, nz: 0 },
  count: 0,
  usedVolPct: 0,
  deadSpacePct: 100
})

// 三层轴对齐网格摆放枚举：6 朝向 × 逐轴 floor 取整，取件数最大方案。
// 注意：只做正交轴对齐（nx×ny×nz 网格），不优化交错/骑缝码放——现场交错补缝实测可多 5-15%。
// truck 与 box 需同一单位（本工具统一用 cm）；任一尺寸非法返回零方案。
function packCount(truck, box) {
  const L = toNum(truck.L)
  const W = toNum(truck.W)
  const H = toNum(truck.H)
  const bl = toNum(box.l)
  const bw = toNum(box.w)
  const bh = toNum(box.h)
  if (![L, W, H, bl, bw, bh].every(isValidLen)) return { ...EMPTY_PACK }

  let best = null
  for (const o of orientationsOf({ l: bl, w: bw, h: bh })) {
    const nx = Math.floor(L / o.l)
    const ny = Math.floor(W / o.w)
    const nz = Math.floor(H / o.h)
    const count = nx * ny * nz
    if (count > 0 && (!best || count > best.count)) best = { o, nx, ny, nz, count }
  }
  if (!best) return { ...EMPTY_PACK }

  const truckVol = L * W * H
  const usedVolPct = Math.round((best.count * bl * bw * bh) / truckVol * 1000) / 10
  return {
    boxOrient: { l: best.o.l, w: best.o.w, h: best.o.h },
    perDim: { nx: best.nx, ny: best.ny, nz: best.nz },
    count: best.count,
    usedVolPct,
    deadSpacePct: Math.round((100 - usedVolPct) * 10) / 10
  }
}

// 体积利用率（%），按实际装填件数计，保留 1 位小数
function volumeUtilOf(count, box, truck) {
  const dims = [count, toNum(box.l), toNum(box.w), toNum(box.h), toNum(truck.L), toNum(truck.W), toNum(truck.H)]
  if (!Number.isFinite(count) || count < 0 || !dims.slice(1).every(isValidLen)) return 0
  return Math.round((count * box.l * box.w * box.h) / (truck.L * truck.W * truck.H) * 1000) / 10
}

// 双约束取小：体积可装 count 件 vs 载重 ÷ 单件毛重。
// unitKg 非正数（未填）时不做载重核对，binding 恒为「体积」。
function weightLimitOf(count, unitKg, truckLimitKg) {
  const c = toNum(count)
  const kg = toNum(unitKg)
  const limit = toNum(truckLimitKg)
  const byWeight = isValidLen(kg) && isValidLen(limit) ? Math.floor(limit / kg) : Infinity
  const final = Math.min(c, byWeight)
  return {
    countByWeight: byWeight,
    countByVolume: c,
    final,
    binding: byWeight < c ? '重量' : '体积'
  }
}

// 最优方案下沿三轴的余量（cm）：车厢内尺寸减去整箱占用的长度
function remainingOf(truck, pack) {
  if (!pack || !pack.boxOrient) return null
  const o = pack.boxOrient
  return {
    a: Math.round(toNum(truck.L) - pack.perDim.nx * o.l),
    b: Math.round(toNum(truck.W) - pack.perDim.ny * o.w),
    c: Math.round(toNum(truck.H) - pack.perDim.nz * o.h)
  }
}

// 剩余空间「还能塞什么」提示（按余量档位给经验建议）
function fillHintOf(rem) {
  if (!rem) return ''
  const [x, y, z] = [rem.a, rem.b, rem.c].sort((p, q) => q - p)
  if (x < 8 && y < 8 && z < 8) return '基本装满，缝隙用气泡膜/编织袋等软货塞实防倒塌即可。'
  if (x >= 60 && z >= 40) {
    return `还能塞什么：最大整条余量约 ${x}×${y}cm、高余 ${z}cm，可放行李箱、折叠桌或立放编织袋等可变形货补位。`
  }
  return `还能塞什么：余量长 ${x}cm / 宽 ${y}cm / 高 ${z}cm，整箱放不下，适合软包、编织袋补缝。`
}

// SVG 文本转义（示意内出现的全部是数字格式化字符串，此函数提供无注入面的保险口径）
function svgEsc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
}

// 俯视网格示意模型：车厢平面长×宽，底面 nx×ny 格；格线过密时抽稀，返回纯数值坐标
function topViewOf(truckCm, pack) {
  if (!pack || !pack.boxOrient) return null
  const L = toNum(truckCm.L)
  const W = toNum(truckCm.W)
  const nx = pack.perDim.nx
  const ny = pack.perDim.ny
  if (!isValidLen(L) || !isValidLen(W) || nx <= 0 || ny <= 0) return null

  const viewW = 660
  const viewH = Math.max(140, Math.round((viewW * W) / L))
  const sx = viewW / L
  const sy = viewH / W
  const gx = Math.max(1, Math.ceil(nx / 48))
  const gy = Math.max(1, Math.ceil(ny / 36))
  const vlines = []
  for (let i = gx; i < nx; i += gx) vlines.push(Math.round(i * pack.boxOrient.l * sx))
  const hlines = []
  for (let j = gy; j < ny; j += gy) hlines.push(Math.round(j * (sy * pack.boxOrient.w)))
  return {
    viewW,
    viewH,
    vlines,
    hlines,
    nx,
    ny,
    labelL: svgEsc(`${Math.round(L)}cm`),
    labelW: svgEsc(`${Math.round(W)}cm`)
  }
}

// 载重友好显示：≥1 吨换算成吨
function fmtKg(kg) {
  const v = toNum(kg)
  if (!isValidLen(v)) return '—'
  return v >= 1000 ? `${Math.round((v / 1000) * 100) / 100}t` : `${v}kg`
}

// 配载单文本（复制用），全部由计算结果拼装
function manifestTextOf(truckName, truckCm, boxCm, unitKg, pack, weight, rem) {
  const lines = [
    `【配载单】${truckName} · ${Math.round(truckCm.L)}×${Math.round(truckCm.W)}×${Math.round(truckCm.H)}cm，载重上限 ${truckCm.limitKg ? fmtKg(truckCm.limitKg) : '未设置'}`,
    `货物：${boxCm.l}×${boxCm.w}×${boxCm.h}cm${isValidLen(toNum(unitKg)) ? ` × ${toNum(unitKg)}kg/件` : ''}`
  ]
  if (pack.boxOrient) {
    lines.push(`方案：长向${pack.perDim.nx} × 宽向${pack.perDim.ny} × ${pack.perDim.nz} 层 = 体积可装 ${pack.count} 件（朝向 ${pack.boxOrient.l}×${pack.boxOrient.w}×${pack.boxOrient.h}）`)
  } else {
    lines.push('方案：任一朝向均无法正交装入，最大 0 件')
  }
  lines.push(`最大件数：${weight.final} 件（${weight.binding === '重量' ? `载重先到：按载重仅可装 ${weight.countByWeight} 件` : '体积约束'}）`)
  lines.push(`体积利用率：${volumeUtilOf(weight.final, boxCm, truckCm)}%，轴对齐估算未含交错补缝`)
  if (rem) lines.push(`余量：长${rem.a}cm · 宽${rem.b}cm · 高${rem.c}cm`)
  lines.push('提示：正式装车请复核堆码承重、轴荷分布与铭牌核定载重。')
  return lines.join('\n')
}

// ---------- 输入状态（文本模型，解析集中在 computed） ----------
const seoContentVisible = ref(true)
const selectedId = ref('box42')
const tL = ref('4.2')
const tW = ref('2.0')
const tH = ref('2.1')
const tLimit = ref('2000')
const bL = ref('')
const bW = ref('')
const bH = ref('')
const bKg = ref('')
const copied = ref(false)
let copyTimer = null

const truckCm = computed(() => ({
  L: toNum(tL.value) * 100,
  W: toNum(tW.value) * 100,
  H: toNum(tH.value) * 100,
  limitKg: toNum(tLimit.value)
}))
const boxCm = computed(() => ({ l: toNum(bL.value), w: toNum(bW.value), h: toNum(bH.value) }))

const dimsValid = computed(() => {
  const t = truckCm.value
  const b = boxCm.value
  if (![t.L, t.W, t.H].every(isValidLen)) return false
  return [b.l, b.w, b.h].every(isValidLen)
})

const invalidText = computed(() => {
  const t = truckCm.value
  const b = boxCm.value
  if (![t.L, t.W, t.H].every(isValidLen)) return '车厢内长/宽/高必须是大于 0 的数（单位米），载重可留空或填正数。'
  if (![b.l, b.w, b.h].every(isValidLen)) return '单件货物的长/宽/高必须都是大于 0 的数（单位厘米）。可点左下「载入示例」快速体验。'
  return '请检查输入。'
})

const pack = computed(() => (dimsValid.value ? packCount(truckCm.value, boxCm.value) : { ...EMPTY_PACK }))
const weight = computed(() => weightLimitOf(pack.value.count, toNum(bKg.value), truckCm.value.limitKg))
const utilPct = computed(() => (dimsValid.value ? volumeUtilOf(weight.value.final, boxCm.value, truckCm.value) : 0))
const rem = computed(() => remainingOf(truckCm.value, pack.value))
const topView = computed(() => (dimsValid.value ? topViewOf(truckCm.value, pack.value) : null))

const truckNameText = computed(() => {
  const p = TRUCK_PRESETS.find((x) => x.id === selectedId.value)
  return p ? p.name : '自定义车厢'
})
const boxText = computed(() => {
  const b = boxCm.value
  return [b.l, b.w, b.h].every(isValidLen) ? `${b.l}×${b.w}×${b.h}` : '—'
})

const orientText = (o) => `${o.l}×${o.w}×${o.h}`

const totalKgText = computed(() => {
  const kg = toNum(bKg.value)
  const limit = truckCm.value.limitKg
  if (!isValidLen(kg)) return '未填毛重'
  const total = Math.round(weight.value.final * kg * 10) / 10
  if (!isValidLen(limit)) return `${total}kg（未设上限）`
  return `${total}kg / ${fmtKg(limit)}`
})

const remainText = computed(() => {
  if (pack.value.count <= 0) return '单件货在 6 个朝向下都无法正交放入当前车厢，最大 0 件——请缩小货物尺寸或换更大的车。'
  if (weight.value.binding === '重量') {
    return `体积还能装 ${pack.value.count} 件，但载重先到上限：最多 ${weight.value.final} 件。剩余空间可考虑搭配轻抛货。`
  }
  return fillHintOf(rem.value)
})

const compareRows = computed(() => {
  if (dimsValid.value === false) return []
  const b = boxCm.value
  const kg = toNum(bKg.value)
  return TRUCK_PRESETS.map((p) => {
    const t = { L: p.L * 100, W: p.W * 100, H: p.H * 100 }
    const pk = packCount(t, b)
    const w = weightLimitOf(pk.count, kg, p.limitKg)
    return {
      ...p,
      dimsText: `${p.L}×${p.W}×${p.H}m`,
      limitText: fmtKg(p.limitKg),
      countByVolume: pk.count,
      count: w.final,
      binding: w.binding,
      active: selectedId.value === p.id
    }
  })
})

const manifestText = computed(() =>
  manifestTextOf(
    truckNameText.value,
    { L: truckCm.value.L, W: truckCm.value.W, H: truckCm.value.H, limitKg: toNum(tLimit.value) },
    boxCm.value,
    toNum(bKg.value),
    pack.value,
    weight.value,
    rem.value
  )
)

// ---------- 交互 ----------
function selectPreset(p) {
  selectedId.value = p.id
  tL.value = String(p.L)
  tW.value = String(p.W)
  tH.value = String(p.H)
  tLimit.value = String(p.limitKg)
}

function applyDemo() {
  const demo = TRUCK_PRESETS.find((p) => p.id === 'box42')
  if (demo) selectPreset(demo)
  bL.value = '60'
  bW.value = '40'
  bH.value = '40'
  bKg.value = '10'
  copied.value = false
}

function resetAll() {
  const init = TRUCK_PRESETS.find((p) => p.id === 'box42')
  if (init) selectPreset(init)
  bL.value = ''
  bW.value = ''
  bH.value = ''
  bKg.value = ''
  copied.value = false
}

async function copyManifest() {
  const text = manifestText.value
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = true
  } catch {
    copied.value = false
    window.prompt('复制失败，请手动全选配载单文本：', text)
  }
  if (copyTimer !== null) window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    copied.value = false
    copyTimer = null
  }, 2500)
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('truck-loading-calculator')
})

onBeforeUnmount(() => {
  if (copyTimer !== null) window.clearTimeout(copyTimer)
})
</script>
