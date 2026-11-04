<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Target class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">安全库存与再订货点计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按服务水平定 Z 值算安全库存 SS，给出补货触发水位 ROP——固定 / 波动两种提前期模式，附 90/95/99 三档敏感度与库存资金占用测算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线安全库存与再订货点（Reorder Point, ROP）计算器：电商运营、采购计划、门店库存都在回答同一个问题——「库存跌到多少就必须下单」。
        本工具按 SS = Z × σd × √L（固定提前期）或复合波动公式 SS = Z × √(L·σd² + d̄²·σL²)（提前期也不稳定时）算出安全库存，
        再叠上提前期内的预期消耗 d̄·L 得到再订货点 ROP；同时直显缺货概率（1 − 服务水平），换算「到货后约多少天回落到 ROP」，
        并把服务水平从 95% 提到 99% 多压的库存折算成资金。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <div class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6">
      <Info class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">需求按正态近似、提前期给'固定天数'或'标准差'两种模式；促销脉冲和长尾慢动品用本模型会低估风险，建议结合 ABC 分类。</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左列：参数输入 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Target class="w-5 h-5 mr-2 text-primary" /> 参数输入
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5" for="rop-d">平均日需求 d̄（件/天）</label>
            <input
              id="rop-d"
              v-model="dInput"
              type="text"
              inputmode="decimal"
              placeholder="如 100（近 30~90 天日均，剔除大促）"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p class="text-[11px] text-muted-foreground mt-1">取日常动销均值即可；直播 / 活动脉冲量请剔除后单独排计划，不要混进 d̄。</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5" for="rop-sigmad">日需求标准差 σd（件/天）</label>
            <input
              id="rop-sigmad"
              v-model="sigmaDInput"
              type="text"
              inputmode="decimal"
              placeholder="如 25（日销 75~125 飘动就约 25）"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p class="text-[11px] text-muted-foreground mt-1">Excel 里 STDEV(日销量列) 直接得到；没有历史数据时可按「日均 × 0.2~0.3」粗估。</p>
          </div>

          <div>
            <p class="text-sm font-medium text-foreground mb-1.5">提前期模式</p>
            <div class="grid grid-cols-2 gap-2" role="group" aria-label="提前期模式">
              <button
                v-for="mode in LEAD_MODES"
                :key="mode.id"
                type="button"
                class="px-3 py-1.5 rounded-lg border text-sm font-medium transition"
                :class="leadMode === mode.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
                @click="leadMode = mode.id"
              >
                {{ mode.label }}
              </button>
            </div>
            <label class="block text-sm font-medium text-foreground mt-3 mb-1.5" for="rop-l">提前期 L（天，平均 / 计划值）</label>
            <input
              id="rop-l"
              v-model="LInput"
              type="text"
              inputmode="decimal"
              placeholder="如 7（下单到到货天数）"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div v-show="leadMode === 'variable'" class="mt-3 space-y-1">
              <label class="block text-sm font-medium text-foreground mb-1.5" for="rop-sigmal">提前期标准差 σL（天）</label>
              <input
                id="rop-sigmal"
                v-model="sigmaLInput"
                type="text"
                inputmode="decimal"
                placeholder="如 3（供应商到货 7±3 天就填 3）"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                进阶展开：交期忽早忽晚也要备保险。σL 填 0 时复合公式自动退化为固定提前期的 Z×σd×√L。
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5" for="rop-level">服务水平（决定 Z 值）</label>
            <select
              id="rop-level"
              v-model="serviceKey"
              class="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="lv in SERVICE_LEVELS" :key="lv.key" :value="lv.key">{{ lv.label }}（Z = {{ lv.z }}）</option>
              <option :value="CUSTOM_KEY">自定义 Z</option>
            </select>
            <div v-show="serviceKey === CUSTOM_KEY" class="mt-3 space-y-1">
              <label class="block text-sm font-medium text-foreground mb-1.5" for="rop-z">自定义 Z 值</label>
              <input
                id="rop-z"
                v-model="zCustomInput"
                type="text"
                inputmode="decimal"
                placeholder="如 2.05（对应约 98% 服务水平）"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p class="text-[11px] text-muted-foreground">填 Z 后缺货概率由标准正态累积分布反推显示。</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5" for="rop-q">单次到货量 Q（件，选填）</label>
              <input
                id="rop-q"
                v-model="qInput"
                type="text"
                inputmode="decimal"
                placeholder="如 700"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5" for="rop-price">单价（元/件，选填）</label>
              <input
                id="rop-price"
                v-model="priceInput"
                type="text"
                inputmode="decimal"
                placeholder="如 10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed -mt-2">
            Q 填每次补货批量（不知道订多少可先用 EOQ 算），结果区给出「到货后约多少天回落到 ROP」；单价用于把敏感度表的 ΔSS 折算成多占用的库存资金。
          </p>

          <p
            class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5"
            :class="checkResult.ok ? '' : 'bg-red-500/10'"
          >
            <TriangleAlert v-if="!checkResult.ok" class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <CheckCircle v-else class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{{ checkResult.msg }}</span>
          </p>
        </div>

        <!-- 快速预设 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-sm font-semibold text-foreground">快速预设</h2>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in PRESETS"
              :key="preset.id"
              type="button"
              @click="applyPreset(preset)"
              class="px-2.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition"
            >
              <Play class="w-3 h-3 inline mr-1 -mt-0.5 text-primary" />{{ preset.label }}
            </button>
            <button
              type="button"
              @click="resetAll"
              class="px-2.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition"
            >
              <RefreshCw class="w-3 h-3 inline mr-1 -mt-0.5" />重置
            </button>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            预设①爆款：日销 100、σd 25、固定提前期 7 天、95% 服务水平 → SS≈110 件、ROP≈810 件；
            预设②提前期波动：d̄ 50、σd 10、L 10 天、σL 3 天、95% → SS≈253 件、ROP≈753 件。
          </p>
        </div>
      </div>

      <!-- 右列：结果区（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 结论卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Package class="w-5 h-5 mr-2 text-primary" /> 再订货点与构成
          </h2>

          <div v-if="!ready" class="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 leading-relaxed">
            <TriangleAlert class="w-4 h-4 inline text-amber-500 mr-1 -mt-0.5" />
            {{ checkResult.msg }}补齐后此处立即显示 ROP 触发水位与安全库存构成。
          </div>

          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
              <div class="sm:col-span-2 bg-primary/10 rounded-lg p-5 text-center">
                <p class="text-xs text-muted-foreground mb-1">再订货点 ROP（库存跌破就下单）</p>
                <p class="text-5xl font-bold text-primary leading-tight">{{ ropUnits }}</p>
                <p class="text-xs text-muted-foreground mt-1.5">件 · 向上取整</p>
              </div>
              <div class="sm:col-span-3 space-y-3">
                <div class="flex h-9 w-full overflow-hidden rounded-lg border border-border bg-muted/30">
                  <div class="bg-primary/70 transition-all" :style="{ width: barWidth.cycle + '%' }"></div>
                  <div class="bg-amber-500/70 transition-all" :style="{ width: barWidth.ss + '%' }"></div>
                </div>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span class="flex items-center gap-1.5"><i class="w-2.5 h-2.5 rounded-full bg-primary/70 inline-block"></i>提前期内消耗 d̄·L = <span class="font-mono text-foreground">{{ cycleDemandText }}</span> 件</span>
                  <span class="flex items-center gap-1.5"><i class="w-2.5 h-2.5 rounded-full bg-amber-500/70 inline-block"></i>安全库存 SS（保险）= <span class="font-mono text-foreground">{{ ssUnitsText }}</span> 件</span>
                </div>
                <p class="text-[11px] text-muted-foreground leading-relaxed">构成条读法：ROP 里<span class="text-foreground">蓝色段是「一定会卖掉的」</span>（交期内的平均消耗），<span class="text-foreground">琥珀色段才是真正花钱押着的保险</span>——保险段占比越高，说明需求 / 交期越飘或服务水平要求越高。</p>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">安全库存 SS</p>
                <p class="text-xl font-bold text-foreground">{{ ssUnits }}</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">件（向上取整）</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">平均周期需求 d̄·L</p>
                <p class="text-xl font-bold text-foreground">{{ cycleDemandIntText }}</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">件（提前期内预期卖掉）</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">缺货概率</p>
                <p class="text-xl font-bold text-foreground">{{ stockoutText }}</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">= 1 − 服务水平</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">保险覆盖天数</p>
                <p class="text-xl font-bold text-foreground">{{ ssCoverDaysText }}</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">天（SS ÷ d̄）</p>
              </div>
            </div>

            <p class="text-[11px] text-muted-foreground text-center font-mono leading-relaxed">{{ ssFormulaLine }}</p>
            <p class="text-[11px] text-muted-foreground text-center font-mono leading-relaxed">{{ ropFormulaLine }}</p>

            <!-- 到货后回落 ROP -->
            <div v-if="qState.kind === 'ok'" class="rounded-lg p-4 bg-green-500/10 border border-green-500/30 text-sm text-foreground leading-relaxed">
              <CheckCircle class="w-4 h-4 inline text-green-600 mr-1.5 -mt-0.5" />
              每次到货后（峰值 ≈ 余量 SS + 批量 {{ qState.qText }} 件），按日均 {{ qState.coverText }} 天的消耗速度，约 <span class="font-bold text-primary">{{ qState.daysText }} 天</span>回落到 ROP——也就是下一次触发下单的时间，下单后还要等 L = {{ leadTimeText }} 天到货。
            </div>
            <div v-else-if="qState.kind === 'small'" class="rounded-lg p-4 bg-amber-500/10 border border-amber-500/30 text-sm text-foreground leading-relaxed">
              <TriangleAlert class="w-4 h-4 inline text-amber-600 mr-1.5 -mt-0.5" />
              {{ qState.warnText }}
            </div>
            <div v-else class="rounded-lg p-4 bg-muted/50 border border-border text-xs text-muted-foreground leading-relaxed">
              在左侧填「单次到货量 Q」，这里会给出每次到货后库存约多少天回落到 ROP（即下一次该下单的时间）。不知道每次补多少？先用 <NuxtLink to="/tools/eoq-calculator" class="text-primary font-medium hover:underline">EOQ 计算器</NuxtLink> 定批量。
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed border-t border-border pt-4">
              执行口径：每天（或每次出库后）核对库存，<span class="text-foreground font-medium">跌破 {{ ropUnits }} 件立即下单</span>；理想情况下到货瞬间库存恰好落在 SS ≈ {{ ssUnits }} 件附近，需求超预期时 SS 吸收缺口。
            </p>
          </template>
        </div>

        <!-- 敏感度表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Zap class="w-5 h-5 mr-2 text-primary" /> 服务水平敏感度：90% / 95% / 99% 三档对比
          </h2>
          <div v-if="sensRows.length" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-4 font-medium">服务水平</th>
                  <th class="py-2 pr-4 font-medium">Z 值</th>
                  <th class="py-2 pr-4 font-medium">安全库存 SS</th>
                  <th class="py-2 pr-4 font-medium">再订货点 ROP</th>
                  <th class="py-2 pr-4 font-medium">SS 占用资金</th>
                  <th class="py-2 font-medium">与当前选择差</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in sensRows"
                  :key="row.key"
                  class="border-b border-border/60 last:border-0"
                  :class="row.isCurrent ? 'bg-primary/5' : ''"
                >
                  <td class="py-2 pr-4 font-medium text-foreground">{{ row.label }}{{ row.isCurrent ? '（当前）' : '' }}</td>
                  <td class="py-2 pr-4 font-mono">{{ row.zText }}</td>
                  <td class="py-2 pr-4 font-mono">{{ row.ssText }} 件</td>
                  <td class="py-2 pr-4 font-mono">{{ row.ropText }} 件</td>
                  <td class="py-2 pr-4 font-mono">{{ row.capitalText }}</td>
                  <td class="py-2 font-mono" :class="row.deltaClass">{{ row.deltaText }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">参数有效后显示三档服务水平的 SS / ROP 与资金占用对照。</p>
          <p v-if="ready" class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground">{{ uplift95to99Text }}</p>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            占用资金 = SS × 单价（安全库存常年压着的那部分）；「与当前选择差」= (该档 SS − 当前 SS) × 单价，负数说明降档可以放出来的现金。三档固定用 90/95/99 的标准 Z 值对照，与上方当前选择无关。
          </p>
        </div>

        <!-- EOQ 联动卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center">
            <Package class="w-5 h-5 mr-2 text-primary" /> 「何时补」与「补多少」配对使用
          </h2>
          <p class="text-sm text-muted-foreground leading-relaxed mt-2">
            本页 ROP 回答<span class="text-foreground font-medium">库存跌到多少就下单</span>；每次下单补多少件，则由
            <NuxtLink to="/tools/eoq-calculator" class="text-primary font-medium hover:underline">经济订货量 EOQ 计算器</NuxtLink>
            按「订货成本 ÷ 持有成本」权衡批量。两者合起来就是定量补货（连续盘点）策略的完整答案：EOQ 定批量、ROP 定触发水位，回落到 ROP 就按 EOQ 批量下单。
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        type="button"
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>安全库存与再订货点是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          安全库存（Safety Stock, SS）是为吸收「提前期内需求超预期、交期忽早忽晚」而常年压着不动的那部分库存；
          再订货点（Reorder Point, ROP）是一个触发水位：<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">ROP = 平均日需求 d̄ × 提前期 L + 安全库存 SS</code>。
          库存一跌破 ROP 就必须下单补货，因为接下来 L 天里平均还要卖掉 d̄·L 件，剩下的 SS 用来扛波动。
          本工具支持固定提前期（SS = Z × σd × √L）与波动提前期（SS = Z × √(L·σd² + d̄²·σL²)）两种口径，
          按目标服务水平给出 Z 值、缺货概率、ROP 构成条、到货后回落天数，以及 90% / 95% / 99% 三档对比和资金占用测算。全部计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">安全库存公式怎么读：Z × 波动 × √时间，三因子里各管什么</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          固定提前期公式 <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">SS = Z × σd × √L</code> 是三个因子相乘，各管一件事：
          <span class="text-foreground font-medium">σd（需求波动）</span>管「卖得快慢有多飘」——日销越不稳定，越要多备保险，SS 与 σd 成正比，翻倍就翻倍；
          <span class="text-foreground font-medium">√L（时间放大）</span>管「要多扛几天」——提前期内 L 天的波动按方差相加（独立日叠加），所以总波动是 σd×√L，交期从 4 天变 16 天，SS 只翻 2 倍而不是 4 倍；
          <span class="text-foreground font-medium">Z（服务水平）</span>管「你要求多大概率不断货」——Z 是标准正态上分位，服务水平越高 Z 越大、保险越厚。
          三者相乘的含义：SS 就是「目标概率下，L 天内需求可能超出平均值 d̄·L 的那部分量」。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">95% 和 99% 服务水平差多少库存：线性 Z、平方根时间的敏感度直觉</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          SS 对 Z 是<span class="text-foreground font-medium">线性</span>的：Z 从 1.65（95%）升到 2.33（99%），安全库存直接多约 41%；对提前期是<span class="text-foreground font-medium">平方根</span>的：交期翻倍 SS 只增约 41%（√2）。
          但断货收益却是<span class="text-foreground font-medium">指数递减</span>的：缺货概率从 5% 降到 1% 再降到 0.1%，每提一档要付的库存资金却一档比一档贵——这就是「服务水平不是越高越好」的数学原因。
          实务折中：A 类（高毛利、高周转）取 95%~99%，B 类 90%~95%，C 类长尾 85%~90% 甚至接受断货按需采购。
          在敏感度表里填入单价即可看到：爆款日均 100、σd 25、L 7 天的话，从 95% 提到 99% 要多压约 45 件库存，单价 10 元就是多占约 450 元资金。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Z 值哪来的：标准正态上分位，Φ(Z) = 服务水平</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Z 是标准正态分布的<span class="text-foreground font-medium">单侧上分位</span>：满足「P(标准正态 ≤ Z) = 服务水平」的数。
          90% → 1.28、95% → 1.65、97.5% → 1.96、99% → 2.33、99.9% → 3.09（Excel 里 <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">=NORM.S.INV(0.95)</code> 直接得到）。
          注意是单侧——只有「需求高于均值」才会吃掉库存，向下飘不会缺货，所以 95% 服务水平对应的是单尾 1.65 而不是双侧的 1.96。
          本工具的下拉就是这张 Z 值表（纯常量），自定义 Z 时缺货概率由 Φ(Z) 反推显示。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">提前期比需求更不稳时怎么办：复合波动公式</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          跨境、进口、供应商产能紧张的品类，常见「日销很稳、到货没准」——这时只按固定提前期算会严重低估风险。
          改用复合波动公式 <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">SS = Z × √(L·σd² + d̄²·σL²)</code>：
          根号下两项是提前期总波动的两个来源方差——需求波动项 L·σd²（L 天独立波动累加）与提前期波动项 d̄²·σL²（交期每偏差 1 天 ≈ 多消耗或少消耗约 d̄ 件，一阶近似）。
          交期波动是被 d̄（平均日需求）平方放大的：日均卖 100 件的爆款，交期每飘 1 天等于需求飘 100 件。
          预设②的例子最直观：d̄ 50、σd 10、L 10、σL 3、95% 服务水平，若忽略交期波动 SS 只要约 53 件，计入后跳到约 253 件——提前期方差项占了九成。治本方案永远是先压 σL（锁产能、双供应商、改海运为快船）而不是无限加库存。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">呆滞库存和缺货哪个亏</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两种病的算法不同：<span class="text-foreground font-medium">缺货</span>亏的是「当期毛利 + 长期资产」——丢单只损失毛利率 × 客单价，但链接权重下滑、搜索降权、顾客流向竞品是慢变量，爆款断货一周可能要用一个月广告费救回来；
          <span class="text-foreground font-medium">呆滞</span>亏的是「资金 + 空间 + 残值」——货款压仓的利息（年化 6%~10%）、仓租、临期打折清仓的跌价损失，慢销品最容易出现「备一次货、卖一年」。
          判法：高毛利快周转 A 品按「缺货更亏」设高服务水平（98%~99%）；低毛利慢动 C 品按「呆滞更亏」压到 90% 甚至不设 SS、有单再采。
          安全库存公式本身不区分这两笔钱，服务水平怎么选才是策略核心。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">ROP 和 EOQ 怎么配合</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一句话：ROP 管「什么时候下这一单」，EOQ 管「这一单下多少」。库存跌破 ROP 触发下单，批量按
          <NuxtLink to="/tools/eoq-calculator" class="text-primary font-medium hover:underline">EOQ（√(2DS/H)）</NuxtLink>
          执行；到货后库存抬升约一个批量，消耗「批量 ÷ 日均」天再回落到 ROP，形成稳定循环。本页的「到货后回落天数」正是把这两者的衔接节奏显性化——如果算出的回落天数离谱（批量撑不过交期消耗），说明 EOQ 批量偏小或提前期太长，要回头修参数。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">安全库存和再订货点怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">固定提前期用 SS = Z × σd × √L：Z 由服务水平定（95% 取 1.65），σd 是日需求标准差，L 是提前期天数。例如日均 100 件、σd 25、L 7 天、95% 服务水平：SS = 1.65 × 25 × √7 ≈ 109.1 件，向上取整 110 件；再订货点 ROP = d̄ × L + SS = 700 + 109 ≈ 810 件，库存跌破 810 就下单。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">95% 和 99% 服务水平差多少库存？</h3>
            <p class="text-sm text-muted-foreground mt-1">安全库存与 Z 成正比：Z 从 1.65 升到 2.33，SS 约多 41%。上例中 SS 从约 110 件升到约 155 件，多压的 45 件按单价即可折成资金。缺货概率虽从 5% 降到 1%，但每提一档花的库存钱线性涨、省的断货钱指数缩，所以 A 类品取 95%~99%、C 类长尾 90% 左右更经济。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">提前期比需求本身还不稳怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">改用复合波动公式 SS = Z × √(L·σd² + d̄²·σL²)，把提前期标准差 σL 经 d̄² 平方放大后计入。例如 d̄ 50、σd 10、L 10、σL 3、95%：SS = 1.65 × √23500 ≈ 253 件，远大于忽略交期波动时的约 53 件。同时优先压 σL（锁定产能、双供应商），比堆库存治本。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。需求、标准差、提前期、服务水平与单价折算全部在你的浏览器中即时计算，不发送任何网络请求，刷新页面即恢复默认输入。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'reorder-point-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Target, Package, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Zap
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '安全库存与再订货点计算器 - 服务水平Z值/ROP补货触发水位在线测算',
  description: '免费在线安全库存与再订货点（ROP）计算器：按服务水平取 Z 值，固定提前期 SS=Z×σd×√L、波动提前期 SS=Z×√(L·σd²+d̄²σL²) 两种口径，直出 ROP 触发水位、缺货概率、ROP 构成条、到货后回落天数与 90/95/99 三档敏感度资金占用测算，电商运营、采购计划、门店库存本地运行不上传',
  keywords: '安全库存计算,再订货点公式,库存服务水平,z 值,缺货概率',
  author: '有条工具',
  ogTitle: '安全库存与再订货点计算器 - 服务水平Z值/ROP补货触发水位在线测算 | 有条工具',
  ogDescription: '按服务水平定 Z 值算安全库存，叠加提前期消耗得到再订货点 ROP，附三档敏感度与多占用的库存资金。',
  ogUrl: 'https://www.util.cn/tools/reorder-point-calculator',
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
          name: '安全库存与再订货点计算器',
          url: 'https://www.util.cn/tools/reorder-point-calculator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['SS=Z×σd×√L 固定提前期', '复合波动公式（提前期含标准差）', '90%~99.9% 服务水平 Z 值表与自定义 Z', 'ROP=d̄·L+SS 触发水位与构成条', '缺货概率直显', '到货后回落 ROP 天数', '90/95/99 三档敏感度与资金占用', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '安全库存与再订货点计算器', item: 'https://www.util.cn/tools/reorder-point-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '安全库存和再订货点怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '固定提前期用 SS = Z × σd × √L：Z 由服务水平定（95% 取 1.65），σd 是日需求标准差，L 是提前期天数。例如日均 100 件、σd 25、L 7 天、95%：SS ≈ 109.1 件取整 110 件；再订货点 ROP = d̄×L + SS = 700 + 109 ≈ 810 件，库存跌破 810 就下单。' }
            },
            {
              '@type': 'Question',
              name: '95%和99%服务水平差多少库存？',
              acceptedAnswer: { '@type': 'Answer', text: '安全库存与 Z 成正比：Z 从 1.65 升到 2.33，SS 约多 41%。上例中 SS 从约 110 件升到约 155 件，多压的 45 件按单价即可折成资金。缺货概率从 5% 降到 1%，但每提一档花的库存钱线性涨、省的断货钱指数缩，A 类品取 95%~99%、C 类长尾 90% 左右更经济。' }
            },
            {
              '@type': 'Question',
              name: '提前期比需求本身还不稳怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '改用复合波动公式 SS = Z × √(L·σd² + d̄²·σL²)，把提前期标准差 σL 经 d̄² 放大后计入。例如 d̄ 50、σd 10、L 10、σL 3、95%：SS = 1.65 × √23500 ≈ 253 件，远大于忽略交期波动时的约 53 件。同时优先压 σL（锁定产能、双供应商），比堆库存治本。' }
            },
            {
              '@type': 'Question',
              name: '计算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。需求、标准差、提前期、服务水平与单价折算全部在浏览器中即时计算，不发送任何网络请求，刷新页面即恢复默认输入。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 服务水平 → Z 值表：标准正态上分位（单侧），满足 P(N(0,1) ≤ Z) = 服务水平
// 90%→1.28、95%→1.65、97.5%→1.96、99%→2.33、99.9%→3.09；Excel 可用 NORM.S.INV(服务水平) 核对
const SERVICE_LEVELS = [
  { key: '90', label: '90%', z: 1.28 },
  { key: '95', label: '95%', z: 1.65 },
  { key: '97.5', label: '97.5%', z: 1.96 },
  { key: '99', label: '99%', z: 2.33 },
  { key: '99.9', label: '99.9%', z: 3.09 }
]
const CUSTOM_KEY = 'custom'
const SENS_KEYS = ['90', '95', '99'] // 敏感度表固定三档
const LEAD_MODES = [
  { id: 'fixed', label: '固定提前期' },
  { id: 'variable', label: '波动提前期（进阶）' }
]

function zForServiceKey(key) {
  const hit = SERVICE_LEVELS.find((lv) => lv.key === key)
  return hit ? hit.z : null
}

// 误差函数近似（Abramowitz & Stegun 7.1.26，|误差| < 1.5e-7），供自定义 Z 反推服务水平
function erf(x) {
  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * ax)
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-ax * ax)
  return sign * y
}
// 标准正态累积分布 Φ(x)
function normalCdf(x) {
  return 0.5 * (1 + erf(x / Math.SQRT2))
}

// 空串按未填处理（Number('') === 0 会误判为合法），非法输入统一 NaN
function toNum(v) {
  if (v === '' || v === null || v === undefined) return NaN
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

// 参数校验：返回 { ok, msg }
function validateModel({ dBar, sigmaD, leadMode, L, sigmaL, z }) {
  if (!Number.isFinite(dBar)) return { ok: false, msg: '请填写平均日需求 d̄（数字，件/天）。' }
  if (dBar <= 0) return { ok: false, msg: '平均日需求 d̄ 必须大于 0。' }
  if (!Number.isFinite(sigmaD)) return { ok: false, msg: '请填写日需求标准差 σd（无波动可填 0）。' }
  if (sigmaD < 0) return { ok: false, msg: '日需求标准差 σd 不能为负。' }
  if (!Number.isFinite(L)) return { ok: false, msg: '请填写提前期 L（下单到到货的天数）。' }
  if (L <= 0) return { ok: false, msg: '提前期 L 必须大于 0。' }
  if (leadMode === 'variable') {
    if (!Number.isFinite(sigmaL)) return { ok: false, msg: '波动提前期模式需填提前期标准差 σL（填 0 可退化为固定式）。' }
    if (sigmaL < 0) return { ok: false, msg: '提前期标准差 σL 不能为负。' }
  }
  if (!Number.isFinite(z)) return { ok: false, msg: '自定义 Z 需要填数字（常用值见下拉：95% 对应 1.65）。' }
  if (z <= 0) return { ok: false, msg: 'Z 值必须大于 0（服务水平 50% 以下没有备货意义）。' }
  return { ok: true, msg: '参数有效，右侧实时给出安全库存、再订货点与三档敏感度对照。' }
}

// 提前期总需求波动的标准差 σ_LT：
// 固定提前期：L 天独立同分布日需求方差相加 ⇒ σ_LT = σd·√L
// 波动提前期（复合，一阶泰勒近似）：σ_LT² = L·σd² + d̄²·σL²
//   前者是需求波动在 L 天内的累积；后者是交期偏差 ΔL 天 ⇒ 额外消耗 ≈ d̄·ΔL 件，方差 (d̄·σL)²；两源独立、方差可加。
function leadTimeSigma({ dBar, sigmaD, leadMode, L, sigmaL }) {
  if (leadMode === 'variable') {
    return Math.sqrt(L * sigmaD * sigmaD + dBar * dBar * sigmaL * sigmaL)
  }
  return sigmaD * Math.sqrt(L)
}

// 安全库存 SS = Z × σ_LT；σL = 0 时复合式自动退化为固定提前期的 Z×σd×√L
function safetyStock(m) {
  return m.z * leadTimeSigma(m)
}

// 再订货点 ROP = 提前期内预期消耗 d̄·L + 安全库存 SS
function reorderPoint(m) {
  return m.dBar * m.L + safetyStock(m)
}

// 件数向上取整：安全库存取整取少了等于没达标服务水平；容差 1e-9 防浮点尾巴（700 → 700 而非 701）
function ceilUnit(x) {
  return Math.max(0, Math.ceil(x - 1e-9))
}

// 到货后回落到 ROP 的天数：峰值 ≈ SS + Q，跌到 ROP = d̄·L + SS 需 (Q − d̄·L)/d̄ = Q/d̄ − L 天
function daysBackToRop(Q, dBar, L) {
  return Q / dBar - L
}

// 敏感度表：固定 90% / 95% / 99% 三档，在当前波动口径下重算 SS 与 ROP
function sensitivityRows(m) {
  return SENS_KEYS.map((key) => {
    const lv = SERVICE_LEVELS.find((l) => l.key === key)
    const mm = { ...m, z: lv.z }
    const ss = safetyStock(mm)
    return { key, label: lv.label, z: lv.z, ss, rop: m.dBar * m.L + ss }
  })
}

// 资金视角：多压 / 少压的库存折算成现金
function deltaCapital(price, ssFrom, ssTo) {
  return (ssTo - ssFrom) * price
}

// 预设（与页面「快速预设」按钮一一对应；数值可被纯函数复算）
const PRESETS = [
  {
    id: 'hot', label: '爆款 95%',
    data: { d: '100', sigmaD: '25', leadMode: 'fixed', L: '7', sigmaL: '', serviceKey: '95', zCustom: '', q: '', price: '' }
  },
  {
    id: 'ltvar', label: '提前期波动（σL）',
    data: { d: '50', sigmaD: '10', leadMode: 'variable', L: '10', sigmaL: '3', serviceKey: '95', zCustom: '', q: '', price: '' }
  }
]

// 显示格式化（非算法核心，纯展示）
function fmt1(x) { return Number.isFinite(x) ? String(Math.round(x * 10) / 10) : '—' }
function fmt2(x) { return Number.isFinite(x) ? String(Math.round(x * 100) / 100) : '—' }
function fmtInt(x) {
  if (!Number.isFinite(x)) return '—'
  return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// ---------- 输入状态 ----------
const dInput = ref('')
const sigmaDInput = ref('')
const LInput = ref('')
const sigmaLInput = ref('')
const leadMode = ref('fixed')
const serviceKey = ref('95')
const zCustomInput = ref('')
const qInput = ref('')
const priceInput = ref('')
const seoContentVisible = ref(true)

const currentZ = computed(() =>
  serviceKey.value === CUSTOM_KEY ? toNum(zCustomInput.value) : zForServiceKey(serviceKey.value)
)

const model = computed(() => ({
  dBar: toNum(dInput.value),
  sigmaD: toNum(sigmaDInput.value),
  leadMode: leadMode.value,
  L: toNum(LInput.value),
  sigmaL: toNum(sigmaLInput.value),
  z: currentZ.value
}))

const checkResult = computed(() => validateModel(model.value))
const ready = computed(() => checkResult.value.ok)

// ---------- 派生结果 ----------
const ssRaw = computed(() => (ready.value ? safetyStock(model.value) : NaN))
const ropRaw = computed(() => (ready.value ? reorderPoint(model.value) : NaN))
const cycleDemand = computed(() => (ready.value ? model.value.dBar * model.value.L : NaN))

const ropUnits = computed(() => (ready.value ? ceilUnit(ropRaw.value) : '—'))
const ssUnits = computed(() => (ready.value ? ceilUnit(ssRaw.value) : '—'))
const ssUnitsText = computed(() => (ready.value ? String(ceilUnit(ssRaw.value)) : '—'))
const cycleDemandText = computed(() => fmt1(cycleDemand.value))
const cycleDemandIntText = computed(() => (ready.value ? fmtInt(cycleDemand.value) : '—'))
const leadTimeText = computed(() => fmt1(model.value.L))

// 服务水平与缺货概率：预设档用 (1 − SL)；自定义 Z 用 Φ(Z) 反推（≈ 显示）
const serviceProb = computed(() => {
  if (!ready.value) return NaN
  if (serviceKey.value === CUSTOM_KEY) return normalCdf(currentZ.value)
  return Number(serviceKey.value) / 100
})
const stockoutText = computed(() => {
  if (!ready.value) return '—'
  const p = (1 - serviceProb.value) * 100
  return `${p < 1 ? p.toFixed(1) : p.toFixed(1)}%`
})
const ssCoverDaysText = computed(() => (ready.value ? fmt1(ssRaw.value / model.value.dBar) : '—'))

const barWidth = computed(() => {
  if (!ready.value) return { cycle: 0, ss: 0 }
  const total = cycleDemand.value + ssRaw.value
  if (total <= 0) return { cycle: 100, ss: 0 }
  const ssPct = Math.min(100, Math.max(0, (ssRaw.value / total) * 100))
  return { cycle: 100 - ssPct, ss: ssPct }
})

const ssFormulaLine = computed(() => {
  if (!ready.value) return ''
  const m = model.value
  if (m.leadMode === 'variable') {
    const varD = m.L * m.sigmaD * m.sigmaD
    const varL = m.dBar * m.dBar * m.sigmaL * m.sigmaL
    return `SS = ${fmt2(m.z)} × √(${fmt1(m.L)}×${fmt1(m.sigmaD)}² + ${fmt1(m.dBar)}²×${fmt1(m.sigmaL)}²) = ${fmt2(m.z)} × √(${fmtInt(varD)} + ${fmtInt(varL)}) ≈ ${fmt1(ssRaw.value)} → ${ssUnits.value} 件`
  }
  return `SS = ${fmt2(m.z)} × ${fmt1(m.sigmaD)} × √${fmt1(m.L)} ≈ ${fmt1(ssRaw.value)} → ${ssUnits.value} 件`
})
const ropFormulaLine = computed(() => {
  if (!ready.value) return ''
  const m = model.value
  return `ROP = d̄ × L + SS = ${fmt1(m.dBar)} × ${fmt1(m.L)} + ${fmt1(ssRaw.value)} = ${fmt1(ropRaw.value)} → ${ropUnits.value} 件`
})

// 到货后回落到 ROP
const qNum = computed(() => toNum(qInput.value))
const priceNum = computed(() => toNum(priceInput.value))
const qState = computed(() => {
  if (!ready.value) return { kind: 'none' }
  const m = model.value
  const q = qNum.value
  if (!Number.isFinite(q) || q <= 0) return { kind: 'empty' }
  const days = daysBackToRop(q, m.dBar, m.L)
  if (days <= 0) {
    return {
      kind: 'small',
      warnText: `单次到货量 ${fmt1(q)} 件撑不过提前期消耗 ${fmt1(m.dBar * m.L)} 件（Q ÷ d̄ 要大于 L）——这种批量到货即回落、几乎天天要下单，请参照 EOQ 放大批量。`
    }
  }
  return { kind: 'ok', daysText: fmt1(days), qText: fmt1(q), coverText: fmt1(q / m.dBar) }
})

// 敏感度表（固定 90/95/99 三档）
const sensRows = computed(() => {
  if (!ready.value) return []
  const m = model.value
  const price = priceNum.value
  const priceOk = Number.isFinite(price) && price > 0
  return sensitivityRows(m).map((r) => {
    const isCurrent = serviceKey.value === r.key
    let deltaText = '—'
    let deltaClass = 'text-muted-foreground'
    if (priceOk) {
      if (isCurrent) {
        deltaText = '基准'
        deltaClass = 'text-primary'
      } else {
        const d = deltaCapital(price, ssRaw.value, r.ss)
        if (Math.abs(d) < 0.5) {
          deltaText = '≈持平'
        } else {
          deltaText = `${d > 0 ? '+' : '−'}${fmtInt(Math.abs(d))} 元`
          deltaClass = d > 0 ? 'text-amber-600' : 'text-green-600'
        }
      }
    } else if (isCurrent) {
      deltaText = '基准'
      deltaClass = 'text-primary'
    }
    return {
      key: r.key,
      label: r.label,
      isCurrent,
      zText: fmt2(r.z),
      ssText: String(ceilUnit(r.ss)),
      ropText: String(ceilUnit(r.rop)),
      capitalText: priceOk ? `${fmtInt(r.ss * price)} 元` : '—',
      deltaText,
      deltaClass
    }
  })
})

// 「95% → 99% 多压多少库存」结论（SS 对 Z 线性；波动标准差 σ_LT = SS ÷ Z 反推）
const uplift95to99Text = computed(() => {
  if (!ready.value) return ''
  const z95 = zForServiceKey('95')
  const z99 = zForServiceKey('99')
  const sigmaLT = ssRaw.value / model.value.z
  const dSS = deltaCapital(1, sigmaLT * z95, sigmaLT * z99)
  const ratioPct = Math.round((z99 / z95 - 1) * 100)
  let text = `从 95% 提到 99%：Z 从 1.65 → 2.33，安全库存约多 ${ratioPct}%（本参数下约多 ${fmtInt(Math.abs(dSS))} 件）`
  const price = priceNum.value
  if (Number.isFinite(price) && price > 0) {
    text += `，按单价 ${fmt1(price)} 元折合多占用约 ${fmtInt(deltaCapital(price, sigmaLT * z95, sigmaLT * z99))} 元资金`
  } else {
    text += '；在左侧填单价可折成多占用的现金'
  }
  return text + '。'
})

// ---------- 预设与重置 ----------
function applyPreset(preset) {
  const d = preset.data
  dInput.value = d.d
  sigmaDInput.value = d.sigmaD
  leadMode.value = d.leadMode
  LInput.value = d.L
  sigmaLInput.value = d.sigmaL || ''
  serviceKey.value = d.serviceKey
  zCustomInput.value = ''
  qInput.value = d.q || ''
  priceInput.value = d.price || ''
}

function resetAll() {
  dInput.value = ''
  sigmaDInput.value = ''
  LInput.value = ''
  sigmaLInput.value = ''
  leadMode.value = 'fixed'
  serviceKey.value = '95'
  zCustomInput.value = ''
  qInput.value = ''
  priceInput.value = ''
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('reorder-point-calculator')
})
</script>
