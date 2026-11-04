<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Ship class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">体积重运费计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">国际快递 / 跨境物流估费：体积折算体积重、实重体积重取大计费，首重续重与单价两种模式，一票多件合计一目了然</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线体积重运费计算器：输入每件包裹的长宽高与实重，自动按抛比系数（5000/6000/7000/8000/12000）把体积折算成体积重，与实重取大得到计费重，
        再按「首重续重」或「每公斤单价」模式估算基础运费，叠加燃油附加费与其他杂费得出合计；支持一票多件按件取大求和、五档抛比敏感度对比与省运费建议。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：包裹与渠道参数 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 包裹与渠道参数
        </h2>

        <!-- 多件包裹输入 -->
        <div class="space-y-3">
          <div
            v-for="(p, idx) in pieces"
            :key="p.id"
            class="rounded-lg border bg-muted/30 p-3 space-y-2"
            :class="pieceIssues[idx] ? 'border-red-400/60' : 'border-border'"
          >
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-muted-foreground">第 {{ idx + 1 }} 件</p>
              <button
                v-if="pieces.length > 1"
                @click="removePiece(idx)"
                class="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition"
                :aria-label="`删除第 ${idx + 1} 件`"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label class="block">
                <span class="text-[10px] text-muted-foreground">长 (cm)</span>
                <input v-model.number="p.l" type="number" min="1" max="200" step="0.1" class="w-full mt-0.5 px-2 py-1.5 bg-background border border-border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </label>
              <label class="block">
                <span class="text-[10px] text-muted-foreground">宽 (cm)</span>
                <input v-model.number="p.w" type="number" min="1" max="200" step="0.1" class="w-full mt-0.5 px-2 py-1.5 bg-background border border-border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </label>
              <label class="block">
                <span class="text-[10px] text-muted-foreground">高 (cm)</span>
                <input v-model.number="p.h" type="number" min="1" max="200" step="0.1" class="w-full mt-0.5 px-2 py-1.5 bg-background border border-border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </label>
              <label class="block">
                <span class="text-[10px] text-muted-foreground">实重 (kg)</span>
                <input v-model.number="p.weight" type="number" min="0.1" max="500" step="0.1" class="w-full mt-0.5 px-2 py-1.5 bg-background border border-border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </label>
            </div>
          </div>
        </div>

        <p
          v-if="hasPieceIssue"
          class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-foreground flex items-start gap-1.5"
        >
          <TriangleAlert class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          <span>存在超出范围的输入：长 / 宽 / 高限 1-200cm，实重限 0.1-500kg；越界或空缺值会按边界值参与计算。</span>
        </p>

        <button
          v-if="pieces.length < PIECE_LIMIT"
          @click="addPiece"
          class="w-full px-3 py-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition flex items-center justify-center"
        >
          <Plus class="w-4 h-4 mr-1.5" /> 添加一件（最多 {{ PIECE_LIMIT }} 件）
        </button>

        <!-- 抛比系数 -->
        <div>
          <label for="factor-select" class="text-sm font-medium text-foreground block mb-1">抛比系数（cm³/kg）</label>
          <select
            id="factor-select"
            v-model="factor"
            class="w-full px-3 py-2 bg-background border border-border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option v-for="f in FACTORS" :key="f" :value="f">{{ f }} · {{ FACTOR_LABELS[f] }}</option>
          </select>
          <p class="text-[11px] text-muted-foreground mt-1.5 flex items-start gap-1">
            <Info class="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>各渠道口径差异大，以货代报价为准</span>
          </p>
        </div>

        <!-- 计费模式 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">计费模式</p>
          <div class="grid grid-cols-2 gap-2">
            <label
              class="flex items-center justify-center px-3 py-2 rounded-lg border text-sm cursor-pointer transition"
              :class="mode === 'firstHeavy' ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border text-muted-foreground hover:border-primary/40'"
            >
              <input v-model="mode" type="radio" value="firstHeavy" class="sr-only" />
              首重 + 续重
            </label>
            <label
              class="flex items-center justify-center px-3 py-2 rounded-lg border text-sm cursor-pointer transition"
              :class="mode === 'unitPrice' ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border text-muted-foreground hover:border-primary/40'"
            >
              <input v-model="mode" type="radio" value="unitPrice" class="sr-only" />
              单价模式
            </label>
          </div>
        </div>

        <!-- 模式参数 -->
        <div v-if="mode === 'firstHeavy'" class="grid grid-cols-2 gap-2">
          <label class="block">
            <span class="text-[10px] text-muted-foreground">首重 (kg)</span>
            <input v-model.number="firstWeight" type="number" min="0.1" max="1000" step="0.5" class="w-full mt-0.5 px-2 py-1.5 bg-background border border-border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </label>
          <label class="block">
            <span class="text-[10px] text-muted-foreground">首重费 (元)</span>
            <input v-model.number="firstFee" type="number" min="0" step="1" class="w-full mt-0.5 px-2 py-1.5 bg-background border border-border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </label>
          <label class="block">
            <span class="text-[10px] text-muted-foreground">续重单位 (kg)</span>
            <input v-model.number="unitWeight" type="number" min="0.1" max="1000" step="0.5" class="w-full mt-0.5 px-2 py-1.5 bg-background border border-border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </label>
          <label class="block">
            <span class="text-[10px] text-muted-foreground">续重单价 (元/单位)</span>
            <input v-model.number="unitPrice" type="number" min="0" step="1" class="w-full mt-0.5 px-2 py-1.5 bg-background border border-border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </label>
        </div>
        <div v-else>
          <label class="block">
            <span class="text-xs text-muted-foreground">每公斤单价 (元/kg)</span>
            <input v-model.number="pricePerKg" type="number" min="0" step="0.5" class="w-full mt-0.5 px-2 py-1.5 bg-background border border-border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </label>
        </div>

        <!-- 附加费用 -->
        <div class="grid grid-cols-2 gap-2">
          <label class="block">
            <span class="text-xs text-muted-foreground">燃油附加费（%，0-30）</span>
            <input v-model.number="fuelPct" type="number" min="0" max="30" step="0.5" class="w-full mt-0.5 px-2 py-1.5 bg-background border border-border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </label>
          <label class="block">
            <span class="text-xs text-muted-foreground">其他杂费（元，选填）</span>
            <input v-model.number="extraFee" type="number" min="0" step="0.01" class="w-full mt-0.5 px-2 py-1.5 bg-background border border-border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </label>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            @click="loadExample"
            class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 载入示例
          </button>
          <button
            @click="resetAll"
            class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            重置
          </button>
        </div>
      </div>

      <!-- 右：估算结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Ship class="w-5 h-5 mr-2 text-primary" /> 估算结果
          </h2>
          <span class="text-xs text-muted-foreground">抛比系数 {{ factorValue }} · {{ modeLabel }}</span>
        </div>

        <!-- 三大卡：体积重 / 实重 / 计费重 -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="bg-muted/50 border border-border rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">总体积重</p>
            <p class="text-2xl font-bold text-foreground">{{ fmtNum(totals.totalVolumetric) }}<span class="text-xs font-normal text-muted-foreground ml-1">kg</span></p>
            <p class="text-[10px] text-muted-foreground mt-1">Σ 长×宽×高 ÷ {{ factorValue }}</p>
          </div>
          <div class="bg-muted/50 border border-border rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">总实重</p>
            <p class="text-2xl font-bold text-foreground">{{ fmtNum(totals.totalActual) }}<span class="text-xs font-normal text-muted-foreground ml-1">kg</span></p>
            <p class="text-[10px] text-muted-foreground mt-1">各件称重之和</p>
          </div>
          <div class="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
            <p class="text-xs text-primary mb-1">计费重（取大）</p>
            <p class="text-2xl font-bold text-primary">{{ fmtNum(totals.totalBilled) }}<span class="text-xs font-normal text-primary/70 ml-1">kg</span></p>
            <p class="text-[10px] text-primary/80 mt-1">{{ billedNote }}</p>
          </div>
        </div>
        <p class="text-xs text-muted-foreground -mt-2">
          多件口径：多数渠道按「每件各自取大后求和」计费，因此整票计费重不一定等于总体积重与总实重的较大者。{{ heavierText }}
        </p>

        <!-- 费用明细 -->
        <div class="rounded-lg border border-border overflow-hidden">
          <div class="px-4 py-2.5 bg-muted/50 border-b border-border text-sm font-medium text-foreground flex items-center">
            <Calculator class="w-4 h-4 mr-1.5 text-primary" /> 费用明细
          </div>
          <div class="px-4 text-sm divide-y divide-border/60">
            <div class="flex items-center justify-between py-2.5">
              <span class="text-muted-foreground">基础运费（计费重 {{ fmtNum(totals.totalBilled) }} kg）</span>
              <span class="font-medium text-foreground font-mono">{{ fmtMoney(baseFee) }}</span>
            </div>
            <div class="flex items-center justify-between py-2.5">
              <span class="text-muted-foreground">燃油附加费（{{ fuelPctValue }}%）</span>
              <span class="font-medium text-foreground font-mono">{{ fmtMoney(fuelFee) }}</span>
            </div>
            <div class="flex items-center justify-between py-2.5">
              <span class="text-muted-foreground">其他杂费</span>
              <span class="font-medium text-foreground font-mono">{{ fmtMoney(extraValue) }}</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="font-medium text-foreground">预估合计</span>
              <span class="text-lg font-bold text-primary font-mono">{{ fmtMoney(totalFee) }}</span>
            </div>
          </div>
          <div class="px-4 py-2 bg-muted/30 text-[11px] text-muted-foreground leading-relaxed">
            {{ baseFeeExplain }}
          </div>
        </div>

        <!-- 多件明细表（>1 件时显示） -->
        <div v-if="pieces.length > 1" class="rounded-lg border border-border overflow-hidden">
          <div class="px-4 py-2.5 bg-muted/50 border-b border-border text-sm font-medium text-foreground">件明细（按件取大）</div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground bg-muted/40">
                  <th class="px-3 py-2 font-medium">件</th>
                  <th class="px-3 py-2 font-medium">尺寸 (cm)</th>
                  <th class="px-3 py-2 font-medium text-right">实重 (kg)</th>
                  <th class="px-3 py-2 font-medium text-right">体积重 (kg)</th>
                  <th class="px-3 py-2 font-medium text-right">计费重 (kg)</th>
                  <th class="px-3 py-2 font-medium">依据</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border/60">
                <tr v-for="d in pieceDetails" :key="d.index">
                  <td class="px-3 py-2 text-muted-foreground">#{{ d.index }}</td>
                  <td class="px-3 py-2 font-mono text-xs text-foreground">{{ d.size }}</td>
                  <td class="px-3 py-2 text-right font-mono text-foreground">{{ fmtNum(d.actual) }}</td>
                  <td class="px-3 py-2 text-right font-mono text-foreground">{{ fmtNum(d.volumetric) }}</td>
                  <td class="px-3 py-2 text-right font-mono font-medium text-primary">{{ fmtNum(d.billed) }}</td>
                  <td class="px-3 py-2">
                    <span
                      class="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      :class="d.heavier === 'volumetric' ? 'bg-amber-500/10 text-amber-600' : 'bg-green-500/10 text-green-600'"
                    >{{ d.heavier === 'volumetric' ? '体积重' : '实重' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 抛比敏感度对比 -->
        <div class="rounded-lg border border-border overflow-hidden">
          <div class="px-4 py-2.5 bg-muted/50 border-b border-border text-sm font-medium text-foreground flex items-center">
            <Info class="w-4 h-4 mr-1.5 text-primary" /> 抛比敏感度：同一包裹在五档系数下的总体积重
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground bg-muted/40">
                  <th class="px-3 py-2 font-medium">系数 (cm³/kg)</th>
                  <th class="px-3 py-2 font-medium">常见渠道</th>
                  <th class="px-3 py-2 font-medium text-right">总体积重 (kg)</th>
                  <th class="px-3 py-2 font-medium text-right">对比当前档</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border/60">
                <tr v-for="row in sensitivity" :key="row.factor" :class="row.isCurrent ? 'bg-primary/5' : ''">
                  <td class="px-3 py-2 font-mono text-foreground">
                    {{ row.factor }}
                    <span v-if="row.isCurrent" class="ml-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">当前</span>
                  </td>
                  <td class="px-3 py-2 text-xs text-muted-foreground">{{ row.label }}</td>
                  <td class="px-3 py-2 text-right font-mono text-foreground">{{ fmtNum(row.totalVolumetric) }}</td>
                  <td class="px-3 py-2 text-right font-mono text-xs" :class="row.isCurrent ? 'text-primary' : 'text-muted-foreground'">
                    {{ row.deltaPct === null ? '当前档' : (row.deltaPct > 0 ? '+' : '') + row.deltaPct + '%' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="px-4 py-2 bg-muted/30 text-[11px] text-muted-foreground">
            抛比系数越大，体积重越小，越可能省运费；换渠道比价前先确认对方的抛比口径。
          </div>
        </div>

        <!-- 省运费提示条 -->
        <div class="flex items-start gap-2 rounded-lg p-3 text-sm leading-relaxed" :class="saveHintClass">
          <TriangleAlert v-if="whichHeavier === 'volumetric'" class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <CheckCircle v-else-if="whichHeavier === 'actual'" class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <Info v-else class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{{ saveHint }}</span>
        </div>

        <!-- 免责小字 -->
        <p class="text-[11px] text-muted-foreground/80 leading-relaxed flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>各渠道对抛比、燃油、偏远附加费、计费进位规则不同，结果仅供比价参考，以货代账单为准。</span>
        </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>体积重运费计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          体积重运费计算器是一款面向国际快递与跨境物流的在线估费工具。它把每件包裹的长×宽×高（cm³）除以抛比系数折算成体积重，与实重取较大者作为计费重，
          再按「首重 + 续重」或「每公斤单价」两种常见模式算出基础运费，叠加燃油附加费与其他杂费得到预估合计；一票多件按「每件取大后求和」的通行口径合计，
          并对比同一包裹在 5000/6000/7000/8000/12000 五档系数下的体积重差异，帮你判断自己的货是泡货还是重货、换渠道能不能省钱。所有计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">体积重是什么？怎么来的？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          航空货运的运力同时受两个天花板限制：飞机的载重上限和货舱容积。一票棉花和一票铁块即使同样 100kg，棉花会先把舱位塞满而载重远未到顶，
          航空公司却为它付出了同样的舱位成本。为了让「占地方」的轻泡货也覆盖空间成本，行业（IATA 口径）把包裹占用的体积按固定比率折算成一个「虚拟重量」——体积重，
          抛比系数（cm³/kg）就是折算比率：体积重 = 长×宽×高 ÷ 抛比系数。计费时与实重取较大者，这就是「取大计费」的由来。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">5000、6000、8000 抛比系数有什么区别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          系数的含义是「每多少立方厘米折算 1 公斤」，数字越大，同样尺寸折出的体积重越小，对发货人越划算。同一个 40×35×30cm 的箱子：
          按 5000 算出 8.4kg、按 6000 算出 7kg、按 8000 只算 5.25kg、按 12000 更是只有 3.5kg。5000 是 DHL/FedEx/UPS 等国际商业快递的常见口径；
          6000 多见于部分空运专线；8000 常见于海运专线（海运舱位以容积约束为主）；12000 见于 EMS 部分渠道。同一票货换渠道比价前，务必先核对抛比口径再比单价。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么实重和体积重要取大？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          因为货舱同时被「重量」和「容积」两种资源约束：重货先压垮载重上限、泡货先塞满舱容。若只按实重收费，泡货占用的舱位成本无人支付；
          若只按体积重收费，密实的重货又会被大幅加价。取两者较大者计费，让每票货物分摊的运费与其真正占用的资源相匹配——这是国际航空运输协会推荐、
          各大快递与货代普遍沿用的口径，也是同一票货「有时按重量算、有时按体积算」的原因。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">一票多件怎么计算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          主流口径是「按件取大、再求和」：每一件先单独算体积重并与该件实重取大，得到这一件的计费重，再把各件计费重相加，套用首重续重或单价模式。
          注意这与「整票取大」不同：重货与泡货混装时，按件取大的结果会大于总体积重与总实重中较大者。例如 A 件实重 10kg / 体积重 8.4kg、
          B 件实重 8kg / 体积重 8.4kg，按件取大计费重为 10 + 8.4 = 18.4kg，而整票取大只有 max(18, 16.8) = 18kg。少数渠道按整票取大，出货前与货代确认口径。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么把体积重降下来？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>压缩外箱尺寸：体积按长宽高连乘，每边减 2cm 效果显著，体积重可能直接降一档。</li>
          <li>软货真空压缩：衣物、床上用品、毛绒玩具抽真空后体积往往能减半。</li>
          <li>去掉多余包装：商品彩盒、礼盒与过量填充物经常是泡货的主要来源。</li>
          <li>大件拆分成多件小箱：注意按件取大的口径，拆分要真正减少总体积才有意义。</li>
          <li>换更大抛比系数的渠道：泡货明显时改走专线 / 海运（8000）或 EMS（12000），往往比任何打包技巧都直接有效。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">什么是体积重？怎么计算？</h3>
            <p class="text-sm text-muted-foreground mt-1">体积重是把包裹占用舱位的空间折算成的虚拟重量：体积重 = 长×宽×高（cm³）÷ 抛比系数（cm³/kg）。系数 5000 表示每 5000 立方厘米折算 1 公斤，40×35×30cm 的箱子按 5000 算是 8.4kg。计费时体积重与实重取较大者。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">首重续重是怎么进位的？</h3>
            <p class="text-sm text-muted-foreground mt-1">超过首重的部分按续重单位向上取整：超出 1.8kg、续重单位 0.5kg 时，1.8÷0.5 = 3.6，向上进位为 4 个续重单位；恰好整除时不再进位。运费 = 首重费 + 续重单位数 × 续重单价。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算结果和货代账单为什么不一样？</h3>
            <p class="text-sm text-muted-foreground mt-1">各渠道对抛比系数、燃油附加费率、偏远附加费、超长超重附加费与计费进位规则（如按 0.5kg 进位）各不相同，且价格随航线与时效浮动。本工具按通用口径估算，结果仅供比价参考，以货代账单为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">包裹信息会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有尺寸、重量与费用计算都在浏览器本地完成，不发送任何网络请求，刷新或离开页面后数据自动清空。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'shipping-fee-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Ship, CheckCircle, TriangleAlert, RefreshCw,
  ChevronUp, ChevronDown, Info, Plus, X, Calculator
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '体积重运费计算器 - 国际快递抛比/计费重在线估算工具',
  description: '免费在线体积重运费计算器：输入长宽高与实重，按 5000/6000/7000/8000/12000 抛比系数自动算体积重，实重体积重取大计费，支持首重续重与单价模式、燃油附加费、一票多件按件取大，跨境物流比价必备，纯浏览器本地运行不上传',
  keywords: '体积重计算,运费计算器,抛比计算,体积重,计费重,国际快递运费,跨境物流,首重续重,泡货,重货',
  author: '有条工具',
  ogTitle: '体积重运费计算器 - 国际快递抛比/计费重在线估算工具 | 有条工具',
  ogDescription: '体积重与实重取大计费，支持多件、首重续重、燃油附加，跨境发货运费一目了然。',
  ogUrl: 'https://www.util.cn/tools/shipping-fee-calculator',
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
          name: '体积重运费计算器',
          url: 'https://www.util.cn/tools/shipping-fee-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['体积重自动计算（长×宽×高÷抛比系数）', '实重与体积重取大计费', '5000-12000 五档抛比敏感度对比', '首重续重与每公斤单价两种计费模式', '燃油附加费与其他杂费合计', '一票多件按件取大求和', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '体积重运费计算器', item: 'https://www.util.cn/tools/shipping-fee-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '什么是体积重？怎么计算？',
              acceptedAnswer: { '@type': 'Answer', text: '体积重是把包裹占用舱位的空间折算成的虚拟重量：体积重=长×宽×高（cm³）÷抛比系数（cm³/kg）。系数5000表示每5000立方厘米折算1公斤，40×35×30cm的箱子按5000算是8.4kg。计费时体积重与实重取较大者。' }
            },
            {
              '@type': 'Question',
              name: '首重续重是怎么进位的？',
              acceptedAnswer: { '@type': 'Answer', text: '超过首重的部分按续重单位向上取整：超出1.8kg、续重单位0.5kg时，1.8÷0.5=3.6，向上进位为4个续重单位；恰好整除时不再进位。运费=首重费+续重单位数×续重单价。' }
            },
            {
              '@type': 'Question',
              name: '计算结果和货代账单为什么不一样？',
              acceptedAnswer: { '@type': 'Answer', text: '各渠道对抛比系数、燃油附加费率、偏远附加费、超长超重附加费与计费进位规则（如按0.5kg进位）各不相同，且价格随航线与时效浮动。本工具按通用口径估算，结果仅供比价参考，以货代账单为准。' }
            },
            {
              '@type': 'Question',
              name: '包裹信息会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有尺寸、重量与费用计算都在浏览器本地完成，不发送任何网络请求，刷新或离开页面后数据自动清空。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 保留 2 位（kg / 元统一口径）：Math.round(x*100)/100
function round2(x) {
  return Math.round(x * 100) / 100
}

// 输入夹取：非法（NaN / 空串）回退 fallback，越界裁剪到 [min, max]
function clampNum(v, min, max, fallback) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

const PIECE_LIMIT = 20   // 一票最多件数
const DIM_MIN = 1        // 单边最小 cm
const DIM_MAX = 200      // 单边最大 cm
const WEIGHT_MIN = 0.1   // 单件最小 kg
const WEIGHT_MAX = 500   // 单件最大 kg
const FUEL_MIN = 0       // 燃油附加费下限 %
const FUEL_MAX = 30      // 燃油附加费上限 %

// 单件输入规整：尺寸 1-200cm，实重 0.1-500kg
function sanitizePiece(p) {
  return {
    l: clampNum(p.l, DIM_MIN, DIM_MAX, DIM_MIN),
    w: clampNum(p.w, DIM_MIN, DIM_MAX, DIM_MIN),
    h: clampNum(p.h, DIM_MIN, DIM_MAX, DIM_MIN),
    weight: clampNum(p.weight, WEIGHT_MIN, WEIGHT_MAX, WEIGHT_MIN)
  }
}

// 体积重（kg）= 长×宽×高（cm³）÷ 抛比系数（cm³/kg）
// 口径：抛比系数表示「每 1kg 计费重允许占用的体积」，5000 即每 5000cm³ 折 1kg（IATA 折算口径）
function volumetricWeight(l, w, h, factor) {
  return round2((l * w * h) / factor)
}

// 计费重取大：实重与体积重取较大者计费；两者相等按实重口径归入 'actual'
function billedWeightOf(actual, volumetric) {
  if (volumetric > actual) return { billed: volumetric, heavier: 'volumetric' }
  return { billed: actual, heavier: 'actual' }
}

// 一票多件：多数渠道按「每件各自取大后求和」计费（而非整票取大），本工具采用该口径
function multiPieceSum(pieces, factor) {
  let totalActual = 0
  let totalVolumetric = 0
  let totalBilled = 0
  for (const raw of pieces) {
    const p = sanitizePiece(raw)
    const vol = volumetricWeight(p.l, p.w, p.h, factor)
    const { billed } = billedWeightOf(p.weight, vol)
    totalActual += p.weight
    totalVolumetric += vol
    totalBilled += billed
  }
  return {
    totalActual: round2(totalActual),
    totalVolumetric: round2(totalVolumetric),
    totalBilled: round2(totalBilled)
  }
}

// 基础运费：
// 首重续重模式 → billed ≤ 首重收首重费，否则首重费 + ⌈超出 ÷ 续重单位⌉ × 续重单价（超出部分向上进位）
// 单价模式 → billed × 每kg单价四舍五入到分（简化口径：不做 0.5kg 进位，部分渠道有进位规则，以货代账单为准）
function feeOf(billed, mode) {
  if (mode.type === 'unitPrice') {
    return round2(billed * mode.pricePerKg)
  }
  if (billed <= mode.firstWeight) return round2(mode.firstFee)
  const units = Math.ceil((billed - mode.firstWeight) / mode.unitWeight)
  return round2(mode.firstFee + units * mode.unitPrice)
}

// 燃油附加费金额 = 基础运费 × 百分比（保留 2 位）
function fuelFeeOf(baseFee, fuelPct) {
  return round2((baseFee * fuelPct) / 100)
}

// 合计 = (基础运费 × (1 + 燃油%) + 杂费)，取整分
function totalFeeOf(baseFee, fuelPct, extra) {
  return round2(baseFee * (1 + fuelPct / 100) + extra)
}

// 两数差距百分比：大者相对小者大多少（%），分母 ≤ 0 返回 0
function heavierGapPct(a, b) {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  if (lo <= 0) return 0
  return round2(((hi - lo) / lo) * 100)
}

// 敏感度对比：同一票包裹在各档抛比系数下的总体积重
function factorSensitivity(pieces, factors) {
  return factors.map((factor) => ({
    factor,
    totalVolumetric: multiPieceSum(pieces, factor).totalVolumetric
  }))
}

// ---------- 渠道元信息 ----------
const FACTORS = [5000, 6000, 7000, 8000, 12000]
const FACTOR_LABELS = {
  5000: '国际快递 DHL/FedEx/UPS 常见',
  6000: '部分专线',
  7000: '通用折中',
  8000: '海运专线常见',
  12000: 'EMS 部分渠道'
}

// ---------- 展示格式化 ----------
function fmtNum(x) {
  return Number(x).toFixed(2)
}

function fmtMoney(x) {
  return `¥${Number(x).toFixed(2)}`
}

// ---------- 工具状态 ----------
let pieceUid = 0

function makePiece(l, w, h, weight) {
  pieceUid += 1
  return { id: pieceUid, l, w, h, weight }
}

const pieces = ref([makePiece(40, 35, 30, 8)]) // 默认 1 件预填示例
const factor = ref(5000)
const mode = ref('firstHeavy') // 'firstHeavy' | 'unitPrice'
const firstWeight = ref(0.5)
const firstFee = ref(25)
const unitWeight = ref(0.5)
const unitPrice = ref(15)
const pricePerKg = ref(20)
const fuelPct = ref(0)
const extraFee = ref(0)
const seoContentVisible = ref(true)

// ---------- 计算派生 ----------
const factorValue = computed(() => (FACTORS.includes(factor.value) ? factor.value : 5000))

const sanitizedPieces = computed(() => pieces.value.map(sanitizePiece))

const totals = computed(() => multiPieceSum(pieces.value, factorValue.value))

const pieceDetails = computed(() =>
  sanitizedPieces.value.map((p, i) => {
    const vol = volumetricWeight(p.l, p.w, p.h, factorValue.value)
    const { billed, heavier } = billedWeightOf(p.weight, vol)
    return { index: i + 1, size: `${p.l}×${p.w}×${p.h}`, actual: p.weight, volumetric: vol, billed, heavier }
  })
)

const modeConfig = computed(() => {
  if (mode.value === 'unitPrice') {
    return { type: 'unitPrice', pricePerKg: clampNum(pricePerKg.value, 0, 1000000, 0) }
  }
  return {
    type: 'firstHeavy',
    firstWeight: clampNum(firstWeight.value, 0.1, 1000, 0.5),
    firstFee: clampNum(firstFee.value, 0, 1000000, 0),
    unitWeight: clampNum(unitWeight.value, 0.1, 1000, 0.5),
    unitPrice: clampNum(unitPrice.value, 0, 1000000, 0)
  }
})

const fuelPctValue = computed(() => clampNum(fuelPct.value, FUEL_MIN, FUEL_MAX, 0))
const extraValue = computed(() => clampNum(extraFee.value, 0, 1000000, 0))

const baseFee = computed(() => feeOf(totals.value.totalBilled, modeConfig.value))
const fuelFee = computed(() => fuelFeeOf(baseFee.value, fuelPctValue.value))
const totalFee = computed(() => totalFeeOf(baseFee.value, fuelPctValue.value, extraValue.value))

const modeLabel = computed(() => (mode.value === 'unitPrice' ? '单价模式' : '首重续重'))

const gapPct = computed(() => heavierGapPct(totals.value.totalActual, totals.value.totalVolumetric))

// 哪个更大：'volumetric' | 'actual' | 'equal'
const whichHeavier = computed(() => {
  const a = totals.value.totalActual
  const v = totals.value.totalVolumetric
  if (v > a) return 'volumetric'
  if (a > v) return 'actual'
  return 'equal'
})

const billedNote = computed(() => {
  if (whichHeavier.value === 'volumetric') return '按体积重计费'
  if (whichHeavier.value === 'actual') return '按实重计费'
  return '两者相等'
})

const heavierText = computed(() => {
  if (whichHeavier.value === 'volumetric') {
    return `本单体积重比实重大 ${gapPct.value}%，属于「泡货」，运费吃抛比的亏。`
  }
  if (whichHeavier.value === 'actual') {
    return `本单实重比体积重大 ${gapPct.value}%，属于「重货」，运费按实重走。`
  }
  return '本单体积重与实重相等。'
})

const baseFeeExplain = computed(() => {
  const m = modeConfig.value
  if (m.type === 'unitPrice') {
    return `单价模式：计费重 ${fmtNum(totals.value.totalBilled)} kg × ${m.pricePerKg} 元/kg，未做 0.5kg 进位，以货代账单为准。`
  }
  const billed = totals.value.totalBilled
  if (billed <= m.firstWeight) {
    return `计费重未超首重 ${m.firstWeight} kg，按首重 ${fmtMoney(m.firstFee)} 计。`
  }
  const units = Math.ceil((billed - m.firstWeight) / m.unitWeight)
  return `首重 ${m.firstWeight} kg 收 ${fmtMoney(m.firstFee)}；超出 ${fmtNum(billed - m.firstWeight)} kg 按 ${m.unitWeight} kg 进位：⌈${fmtNum(billed - m.firstWeight)} ÷ ${m.unitWeight}⌉ = ${units} 个续重单位 × ${m.unitPrice} 元。`
})

// 敏感度：五档系数下的总体积重对比
const sensitivity = computed(() => {
  const current = totals.value.totalVolumetric
  return factorSensitivity(pieces.value, FACTORS).map((row) => ({
    ...row,
    label: FACTOR_LABELS[row.factor] || '',
    isCurrent: row.factor === factorValue.value,
    deltaPct: row.factor === factorValue.value || current <= 0
      ? null
      : Math.round((row.totalVolumetric / current - 1) * 1000) / 10
  }))
})

// 省运费提示（按当前取大方向静态展示）
const saveHint = computed(() => {
  if (whichHeavier.value === 'volumetric') {
    return '体积重大于实重：这时压缩包装尺寸比给包裹减重更有效——外箱每边减 2cm，体积重可能直接降一档；也可以换用抛比系数更大的渠道（如专线 / 海运 8000）来降低计费重。'
  }
  if (whichHeavier.value === 'actual') {
    return '实重大于体积重：计费按实重走，继续压缩体积省不了运费；比价时重点对比每公斤单价与燃油附加费，重货也可以考虑分批发运。'
  }
  return '体积重与实重持平：外箱任一边再压缩 2cm 以上，计费口径就可能切回实重，包装上还有优化空间。'
})

const saveHintClass = computed(() => {
  if (whichHeavier.value === 'volumetric') return 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
  if (whichHeavier.value === 'actual') return 'bg-green-500/10 text-green-700 dark:text-green-400'
  return 'bg-muted/60 text-foreground'
})

// ---------- 输入校验 ----------
const pieceIssues = computed(() =>
  pieces.value.map((p) =>
    !(Number(p.l) >= DIM_MIN && Number(p.l) <= DIM_MAX) ||
    !(Number(p.w) >= DIM_MIN && Number(p.w) <= DIM_MAX) ||
    !(Number(p.h) >= DIM_MIN && Number(p.h) <= DIM_MAX) ||
    !(Number(p.weight) >= WEIGHT_MIN && Number(p.weight) <= WEIGHT_MAX)
  )
)

const hasPieceIssue = computed(() => pieceIssues.value.some(Boolean))

// ---------- 操作 ----------
function addPiece() {
  if (pieces.value.length >= PIECE_LIMIT) return
  pieces.value.push(makePiece(30, 25, 20, 3))
}

function removePiece(idx) {
  if (pieces.value.length <= 1) return
  pieces.value.splice(idx, 1)
}

// 载入示例：一票两件（重货 + 泡货），展示多件取大与燃油、杂费
function loadExample() {
  pieces.value = [makePiece(40, 35, 30, 8), makePiece(60, 50, 40, 5)]
  factor.value = 6000
  mode.value = 'firstHeavy'
  firstWeight.value = 0.5
  firstFee.value = 25
  unitWeight.value = 0.5
  unitPrice.value = 15
  pricePerKg.value = 20
  fuelPct.value = 10
  extraFee.value = 8
}

function resetAll() {
  pieces.value = [makePiece(40, 35, 30, 8)]
  factor.value = 5000
  mode.value = 'firstHeavy'
  firstWeight.value = 0.5
  firstFee.value = 25
  unitWeight.value = 0.5
  unitPrice.value = 15
  pricePerKg.value = 20
  fuelPct.value = 0
  extraFee.value = 0
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('shipping-fee-calculator')
})
</script>
