<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <HeartHandshake class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">工伤赔偿计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按《工伤保险条例》第 35–39 条口径估算 1–10 级伤残与工亡待遇，本人工资 60%~300% 封顶保底自动判定，参数透明可查</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线工伤赔偿计算器：选择伤残等级（1–10 级）或工亡情形，输入本人月工资与统筹地区上年度职工月平均工资，
        按《工伤保险条例》第 35–39 条统一口径估算一次性伤残补助金（27/25/23/21、18/16、13/11/9/7 个月）、
        伤残津贴（一至四级 90%/85%/80%/75% 按月）、丧葬补助金、供养亲属抚恤金与一次性工亡补助金，
        并自动完成本人工资「低于社平 60% 按 60%、高于社平 300% 按 300%」（第 64 条）的调整判定。
        五至十级解除劳动合同的一次性工伤医疗补助金与一次性伤残就业补助金各省标准不同，本页给说明卡与省市示例。
      </p>
    </div>

    <!-- 强免责卡（置顶） -->
    <div class="border-2 border-red-500/30 bg-red-500/5 rounded-xl p-4 mb-6 flex items-start gap-3">
      <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div class="min-w-0">
        <p class="text-sm font-bold text-red-600">重要：本工具仅为《工伤保险条例》条款的教学演示，不构成任何法律意见</p>
        <p class="text-xs text-muted-foreground leading-relaxed mt-1">
          工伤待遇的实际金额以<b class="text-foreground">社会保险经办机构依法核定</b>为准，受统筹地区具体政策、本人缴费工资、
          劳动能力鉴定结论与地方实施办法影响；各地差异较大。建议拨打当地人社服务热线
          <b class="text-foreground">12333</b> 或咨询专业律师后，以核定结果为最终依据。
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <HeartHandshake class="w-5 h-5 mr-2 text-primary" /> 情形与参数
        </h2>

        <!-- 模式切换 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">待遇情形</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              @click="mode = 'disability'"
              class="py-2.5 rounded-lg text-sm font-medium border transition"
              :class="mode === 'disability' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >伤残待遇（1–10 级）</button>
            <button
              type="button"
              @click="mode = 'death'"
              class="py-2.5 rounded-lg text-sm font-medium border transition"
              :class="mode === 'death' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >工亡待遇（三项）</button>
          </div>
        </div>

        <template v-if="mode === 'disability'">
          <!-- 伤残等级 -->
          <div>
            <label for="wic-level" class="block text-sm font-medium text-foreground mb-2">劳动能力鉴定伤残等级</label>
            <select
              id="wic-level"
              v-model.number="level"
              class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="l in 10" :key="l" :value="l">{{ LEVEL_NAMES[l] }}</option>
            </select>
            <p class="text-xs text-muted-foreground leading-relaxed mt-1.5">
              一次性伤残补助金 = 本人工资 × <b class="text-foreground">{{ DISABILITY_MONTHS[level] }} 个月</b>（第 {{ level <= 4 ? 35 : level <= 6 ? 36 : 37 }} 条）。
            </p>
          </div>

          <!-- 本人月工资 -->
          <div>
            <label for="wic-wage" class="block text-sm font-medium text-foreground mb-2">本人月工资（受伤前 12 个月平均月缴费工资）</label>
            <div class="flex items-center gap-2">
              <input
                id="wic-wage"
                v-model.number="wage"
                type="number"
                min="0"
                step="100"
                placeholder="如 8000"
                class="flex-1 min-w-0 px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span class="text-xs text-muted-foreground flex-shrink-0">元</span>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed mt-1.5 flex items-start gap-1">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>「本人工资」受社平工资上下限约束：高于统筹地区职工月平均工资 300% 的按 300% 计，低于 60% 的按 60% 计（第 64 条）。填入社平工资后自动判定。</span>
            </p>
          </div>
        </template>

        <template v-else>
          <!-- 工亡参数 -->
          <div>
            <label for="wic-death-wage" class="block text-sm font-medium text-foreground mb-2">工亡职工本人月工资（供养亲属抚恤金基数）</label>
            <div class="flex items-center gap-2">
              <input
                id="wic-death-wage"
                v-model.number="deathWage"
                type="number"
                min="0"
                step="100"
                placeholder="如 8000"
                class="flex-1 min-w-0 px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span class="text-xs text-muted-foreground flex-shrink-0">元</span>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label for="wic-spouse" class="block text-xs text-muted-foreground mb-1.5">配偶（人）</label>
              <select id="wic-spouse" v-model.number="spouseCount" class="w-full px-2 py-2 border border-border bg-background rounded-lg text-foreground text-sm">
                <option :value="0">0</option>
                <option :value="1">1</option>
              </select>
            </div>
            <div>
              <label for="wic-others" class="block text-xs text-muted-foreground mb-1.5">其他亲属（人）</label>
              <select id="wic-others" v-model.number="otherCount" class="w-full px-2 py-2 border border-border bg-background rounded-lg text-foreground text-sm">
                <option v-for="n in 9" :key="n" :value="n - 1">{{ n - 1 }}</option>
              </select>
            </div>
            <div>
              <label for="wic-lonely" class="block text-xs text-muted-foreground mb-1.5">其中孤寡/孤儿（人）</label>
              <select id="wic-lonely" v-model.number="lonelyCount" class="w-full px-2 py-2 border border-border bg-background rounded-lg text-foreground text-sm">
                <option v-for="n in 10" :key="n" :value="n - 1">{{ n - 1 }}</option>
              </select>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>供养亲属抚恤金：配偶每月 40%、其他亲属每人每月 30%、孤寡老人或孤儿在上述基础上每人每月加 10%；核定之和不得超过工亡职工生前本人工资（第 39 条）。亲属资格（无劳动能力、主要生活来源等）由经办机构核定。</span>
          </p>
        </template>

        <!-- 统筹地区月平均工资 -->
        <div>
          <label for="wic-avg" class="block text-sm font-medium text-foreground mb-2">
            统筹地区上年度职工月平均工资（{{ mode === 'death' ? '丧葬补助金基数' : '用于 60%~300% 上下限判定，可填' }}）
          </label>
          <div class="flex items-center gap-2">
            <input
              id="wic-avg"
              v-model.number="avgWage"
              type="number"
              min="0"
              step="100"
              :placeholder="mode === 'death' ? '如 8000' : '如 8000（选填）'"
              class="flex-1 min-w-0 px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5">
            以当地人社部门公布的口径为准；不填时伤残模式不做上下限调整、工亡模式无法算丧葬补助金。
          </p>
        </div>

        <!-- 工亡：上年度全国城镇居民人均可支配收入 -->
        <div v-if="mode === 'death'">
          <label for="wic-income" class="block text-sm font-medium text-foreground mb-2">上年度全国城镇居民人均可支配收入（一次性工亡补助金基数）</label>
          <div class="flex items-center gap-2">
            <input
              id="wic-income"
              v-model.number="nationalIncome"
              type="number"
              min="0"
              step="1"
              class="flex-1 min-w-0 px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元</span>
          </div>
          <p class="text-[10px] text-muted-foreground/80 leading-relaxed mt-1">
            默认 56502 元：国家统计局《2025 年国民经济和社会发展统计公报》（2026-02-28 发布）公布的 2025 年全国城镇居民人均可支配收入；
            一次性工亡补助金 = 该收入 × 20（第 39 条），以每年公布的新数值为准。
          </p>
        </div>

        <!-- 操作 -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            @click="loadExample"
            class="px-3 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            载入示例
          </button>
          <button
            @click="resetAll"
            class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1 -mt-0.5" /> 重置
          </button>
        </div>
      </div>

      <!-- 右侧：结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> {{ mode === 'death' ? '工亡待遇测算' : '伤残待遇测算' }}
          </h2>
          <button
            v-if="canCalc"
            @click="copyResult"
            class="text-xs px-2.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-foreground transition"
          >
            <Copy class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 复制结果
          </button>
        </div>

        <template v-if="canCalc">
          <!-- 工资调整卡 -->
          <div v-if="mode === 'disability'" class="bg-primary/10 rounded-lg p-4 space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="text-xs text-muted-foreground mb-1">本人工资（第 64 条调整后计发基数）</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ fmtMoney(result.base) }} 元 / 月</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-muted-foreground mb-1">伤残等级</p>
                <p class="text-2xl font-bold text-primary">{{ LEVEL_NAMES[level] }}</p>
              </div>
            </div>
            <p v-if="result.clamp !== 'none'" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ result.clampNote }}</span>
            </p>
            <p v-else class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>本人工资处于统筹地区社平工资 60%~300% 区间内，按实际工资计发。</span>
            </p>
          </div>

          <!-- 伤残结果卡 -->
          <template v-if="mode === 'disability'">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">一次性伤残补助金（解除劳动关系即可领取，一次性）</p>
                <p class="text-2xl font-bold text-primary font-mono">¥{{ fmtMoney(result.lumpSum) }}</p>
                <p class="text-[11px] text-muted-foreground mt-1">{{ result.base }} × {{ DISABILITY_MONTHS[level] }} 个月（第 {{ level <= 4 ? 35 : level <= 6 ? 36 : 37 }} 条）</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <template v-if="level <= 4">
                  <p class="text-xs text-muted-foreground mb-1">伤残津贴（按月发放至退休/国家规定）</p>
                  <p class="text-2xl font-bold text-foreground font-mono">¥{{ fmtMoney(result.allowance) }}<span class="text-xs font-normal"> / 月</span></p>
                  <p class="text-[11px] text-muted-foreground mt-1">{{ result.base }} × {{ Math.round(ALLOWANCE_RATE[level] * 100) }}%（第 35 条）</p>
                </template>
                <template v-else>
                  <p class="text-xs text-muted-foreground mb-1">伤残津贴</p>
                  <p class="text-base font-semibold text-foreground mt-2">不适用按月伤残津贴</p>
                  <p class="text-[11px] text-muted-foreground mt-1">{{ level <= 6 ? '五至六级：保留劳动关系、难以安排工作的由单位按月发给 70% / 60% 伤残津贴（第 36 条），并由单位缴纳社保' : '七至十级：无按月伤残津贴，一次性补助金 + 解除时两项一次性补助金（第 37 条）' }}</p>
                </template>
              </div>
            </div>

            <!-- 5-10 级：解除合同两项补助金说明卡 -->
            <div v-if="level >= 5" class="border border-amber-500/20 bg-amber-500/10 rounded-lg p-4 flex items-start gap-2">
              <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div class="min-w-0">
                <p class="text-sm font-semibold text-foreground">解除/终止劳动合同时还有两项「一次性补助金」——各省标准不同，本页不放全国死表</p>
                <p class="text-xs text-muted-foreground leading-relaxed mt-1">
                  五至十级职工本人提出解除或合同期满终止的，由工伤保险基金支付<b class="text-foreground">一次性工伤医疗补助金</b>、
                  用人单位支付<b class="text-foreground">一次性伤残就业补助金</b>，具体月数/金额由各省实施办法规定
                  （第 36、37 条授权），领取后终结工伤保险关系。<b class="text-foreground">以本省现行规定为准</b>，以下仅为示例：
                </p>
                <ul class="text-xs text-muted-foreground leading-relaxed mt-1.5 space-y-1 list-disc list-inside">
                  <li><b class="text-foreground">广东</b>（示例，非全国标准）：一次性工伤医疗补助金十级 4 个月、九级 7 个月本人工资；一次性伤残就业补助金十级 8 个月、九级 12 个月本人工资（《广东省工伤保险条例》）。</li>
                  <li><b class="text-foreground">江苏</b>（示例，非全国标准）：2015 年起改按固定金额计发，如十级一次性工伤医疗补助金 3 万元（就业补助金另有固定标准）（《江苏省实施〈工伤保险条例〉办法》）。</li>
                </ul>
              </div>
            </div>
          </template>

          <!-- 工亡结果卡 -->
          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">① 丧葬补助金</p>
                <p class="text-xl font-bold text-foreground font-mono">¥{{ fmtMoney(result.funeral) }}</p>
                <p class="text-[11px] text-muted-foreground mt-1">6 个月 × 统筹地区上年度职工月平均工资（第 39 条）</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">② 供养亲属抚恤金</p>
                <p class="text-xl font-bold text-foreground font-mono">¥{{ fmtMoney(result.pension) }}<span class="text-xs font-normal"> / 月</span></p>
                <p class="text-[11px] text-muted-foreground mt-1">
                  {{ result.pensionDetail }}
                  <template v-if="result.pensionCapped">，<b class="text-red-500">已按本人工资封顶</b></template>
                </p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">③ 一次性工亡补助金</p>
                <p class="text-xl font-bold text-primary font-mono">¥{{ fmtMoney(result.deathLump) }}</p>
                <p class="text-[11px] text-muted-foreground mt-1">全国城镇居民人均可支配收入 {{ fmtMoney(nationalIncomeNum) }} × 20（第 39 条）</p>
              </div>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>三项待遇均从工伤保险基金支付（未参保的由用人单位承担）；供养亲属抚恤金为按月发放的长期待遇，亲属资格与具体金额以经办机构核定为准。</span>
            </p>
          </template>

          <!-- 明细过程表 -->
          <div class="border border-border rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-muted/40 border-b border-border">
              <p class="text-sm font-semibold text-foreground">计算明细（公式代入过程）</p>
            </div>
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-muted-foreground border-b border-border">
                  <th class="px-4 py-2 text-left font-medium w-32">步骤</th>
                  <th class="px-4 py-2 text-left font-medium">公式代入</th>
                  <th class="px-4 py-2 text-right font-medium">结果</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(st, i) in detailSteps" :key="i" class="border-b border-border/40 last:border-0">
                  <td class="px-4 py-2 text-foreground font-medium align-top">{{ st.label }}</td>
                  <td class="px-4 py-2 text-muted-foreground align-top">{{ st.formula }}</td>
                  <td class="px-4 py-2 text-right font-mono text-foreground align-top whitespace-nowrap">{{ st.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- 空状态 -->
        <div v-else class="text-center text-muted-foreground py-16">
          <TriangleAlert class="w-10 h-10 mx-auto mb-3 text-yellow-500" />
          <p class="text-sm">请先完善左侧输入：{{ inputErrors.join('；') }}。</p>
          <p class="text-xs text-muted-foreground/70 mt-1">也可以点击「载入示例」先看一条完整测算：十级伤残、本人月工资 8000 元、社平 8000 元。</p>
        </div>
      </div>
    </div>

    <!-- 法条与免责声明（页面固定） -->
    <div class="border border-border bg-muted/30 rounded-lg p-4 mb-8 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        计算依据：《工伤保险条例》（国务院令第 586 号修订）第 35、36、37、39、64 条；一次性工亡补助金基数取国家统计局公布的
        上年度全国城镇居民人均可支配收入（2025 年为 56502 元，对应 2026 年度口径）。本页已对照政府官网原文逐字核对条款月数与比例，
        <b class="text-foreground">一切以现行法规原文与社保经办机构核定为准</b>；本工具仅供教育参考，不构成法律意见，
        涉及实际工伤待遇请咨询当地人社部门（12333）。
      </p>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg mb-12 group">
      <summary class="flex items-center justify-between cursor-pointer select-none px-6 py-4">
        <span class="text-lg font-semibold text-foreground"><span class="text-primary mr-2">#</span>工伤赔偿标准、认定流程与常见问题</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div class="px-6 pb-6 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">计算公式与全国统一标准（第 35–37、39 条）</h3>
          <div class="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed space-y-2">
            <p><strong>一次性伤残补助金</strong> = 本人工资 × 月数：一级 27 / 二级 25 / 三级 23 / 四级 21；五级 18 / 六级 16；七级 13 / 八级 11 / 九级 9 / 十级 7 个月。</p>
            <p><strong>伤残津贴</strong>（一至四级，按月发放）：一级 90% / 二级 85% / 三级 80% / 四级 75% 本人工资；实际金额低于当地最低工资标准的由基金补足差额。五至六级难以安排工作的，由单位按月发给 70% / 60% 伤残津贴并缴纳社保。</p>
            <p><strong>丧葬补助金</strong> = 6 个月 × 统筹地区上年度职工月平均工资；<strong>供养亲属抚恤金</strong>：配偶每月 40%、其他亲属每人每月 30%、孤寡老人/孤儿每人每月加 10%，核定之和 ≤ 本人工资；<strong>一次性工亡补助金</strong> = 上一年度全国城镇居民人均可支配收入 × 20（2026 年度口径：56502 × 20 = 1,130,040 元）。</p>
            <p><strong>本人工资</strong>：受伤前 12 个月平均月缴费工资，高于统筹地区职工月平均工资 300% 的按 300% 计、低于 60% 的按 60% 计（第 64 条）。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">工伤认定流程 4 步（含关键时限）</h3>
          <div class="space-y-2">
            <div class="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
              <p class="text-sm text-muted-foreground leading-relaxed"><b class="text-foreground">事故发生与救治</b>：事故伤害发生后及时就医并保留病历、劳动关系与工资证据。</p>
            </div>
            <div class="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
              <p class="text-sm text-muted-foreground leading-relaxed"><b class="text-foreground">30 日内单位申报</b>：所在单位应自事故伤害发生之日或被诊断、鉴定为职业病之日起 30 日内，向统筹地区社会保险行政部门申请工伤认定（第 17 条）；单位未按时申报的，期间发生的符合规定的工伤待遇费用由单位负担。</p>
            </div>
            <div class="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">3</span>
              <p class="text-sm text-muted-foreground leading-relaxed"><b class="text-foreground">个人 1 年内兜底申请</b>：单位不申请的，工伤职工或其近亲属、工会组织可在 1 年内直接申请；社保行政部门自受理之日起 60 日内作出认定决定（事实清楚、权利义务明确的 15 日内）。</p>
            </div>
            <div class="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">4</span>
              <p class="text-sm text-muted-foreground leading-relaxed"><b class="text-foreground">劳动能力鉴定</b>：伤情相对稳定后存在残疾、影响劳动能力的，向设区的市级劳动能力鉴定委员会申请伤残等级鉴定（1–10 级）；对结论不服可申请再次鉴定。</p>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">工伤与交通事故竞合怎么办？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            上下班途中受到非本人主要责任的交通事故（或城市轨道交通、客运轮渡、火车事故）伤害的，属工伤（第 14 条）。
            第三人侵权与工伤保险可以<b class="text-foreground">双重主张</b>：除医疗费用等实际支出项目原则上不重复获偿外，
            一次性伤残补助金等工伤待遇与民事人身损害赔偿（残疾赔偿金、误工费等）在多数地区可分别主张；
            先获民事赔偿仍可申请工伤待遇，具体差额扣减规则各地司法口径不同，建议咨询当地律师或 12333。
          </p>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">十级工伤能赔多少钱？</h3>
            <p class="text-sm text-muted-foreground mt-1">全国统一部分：一次性伤残补助金 = 本人工资 × 7 个月（如月工资 8000 元即 56000 元）。解除合同时的一次性工伤医疗补助金与就业补助金由各省规定（如广东十级为 4 个月 + 8 个月本人工资），以本省现行标准为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">一次性工亡补助金 2026 年是多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">上一年度（2025 年）全国城镇居民人均可支配收入 56502 元 × 20 = 1,130,040 元。该数值每年随统计公报更新，以国家统计局最新公布数为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">「本人工资」是实发工资吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">是受伤前 12 个月的平均月缴费工资，且受「社平 60%~300%」封顶保底：低于统筹地区职工月平均工资 60% 的按 60% 计、高于 300% 的按 300% 计（条例第 64 条）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">单位没缴工伤保险怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">应由工伤保险基金支付的各项待遇改由用人单位按条例规定的项目和标准支付；未参保期间发生工伤的，待遇与参保职工一致，由单位承担。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">伤残津贴和一次性补助金能都拿吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">一至四级伤残：一次性伤残补助金 + 按月伤残津贴（保留劳动关系退出岗位）；五至十级：一次性伤残补助金，解除合同时再按省规定领取两项一次性补助金；五至六级难以安排工作的还有按月伤残津贴。</p>
          </div>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'work-injury-compensation'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  HeartHandshake, Calculator, Info, TriangleAlert, CheckCircle,
  ChevronDown, RefreshCw, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '工伤赔偿计算器 - 1-10级伤残等级赔偿标准与工亡待遇在线估算',
  description: '免费在线工伤赔偿计算器：按《工伤保险条例》第35-39条估算一次性伤残补助金（27/25/…/9/7个月）、伤残津贴（90%-75%）、丧葬补助金、供养亲属抚恤金与一次性工亡补助金（上年度全国城镇居民人均可支配收入×20），本人工资60%-300%上下限自动判定，附工伤认定流程与各省补助金说明，纯本地计算',
  keywords: '工伤赔偿计算器,伤残等级赔偿标准,一次性伤残补助金,工伤津贴计算,工亡赔偿金额,一次性工伤医疗补助金,供养亲属抚恤金',
  author: '有条工具',
  ogTitle: '工伤赔偿计算器 - 1-10级伤残等级赔偿标准与工亡待遇在线估算 | 有条工具',
  ogDescription: '按《工伤保险条例》35-39条估算伤残与工亡待遇，工资上下限自动判定，参数透明可查。',
  ogUrl: 'https://www.util.cn/tools/work-injury-compensation',
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
          name: '工伤赔偿计算器',
          url: 'https://www.util.cn/tools/work-injury-compensation',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['1-10 级一次性伤残补助金（27…7 个月）估算', '一至四级伤残津贴 90%-75% 按月测算', '本人工资社平 60%-300% 上下限自动判定', '工亡三项：丧葬补助金 / 供养亲属抚恤金 / 一次性工亡补助金', '各省一次性医疗/就业补助金说明与省市示例', '工伤认定 4 步流程与交通事故竞合提示', '纯本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '工伤赔偿计算器', item: 'https://www.util.cn/tools/work-injury-compensation/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '十级工伤能赔多少钱？',
              acceptedAnswer: { '@type': 'Answer', text: '全国统一部分：一次性伤残补助金 = 本人工资 × 7 个月（如月工资 8000 元即 56000 元）。解除合同时的一次性工伤医疗补助金与就业补助金由各省规定，以本省现行标准为准。' }
            },
            {
              '@type': 'Question',
              name: '一次性工亡补助金 2026 年是多少？',
              acceptedAnswer: { '@type': 'Answer', text: '上一年度（2025 年）全国城镇居民人均可支配收入 56502 元 × 20 = 1,130,040 元。该数值每年随统计公报更新，以国家统计局最新公布数为准。' }
            },
            {
              '@type': 'Question',
              name: '「本人工资」是实发工资吗？',
              acceptedAnswer: { '@type': 'Answer', text: '是受伤前 12 个月的平均月缴费工资，且受「社平 60%~300%」封顶保底：低于统筹地区职工月平均工资 60% 的按 60% 计、高于 300% 的按 300% 计（条例第 64 条）。' }
            },
            {
              '@type': 'Question',
              name: '单位没缴工伤保险怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '应由工伤保险基金支付的各项待遇改由用人单位按条例规定的项目和标准支付，待遇与参保职工一致。' }
            },
            {
              '@type': 'Question',
              name: '伤残津贴和一次性补助金能都拿吗？',
              acceptedAnswer: { '@type': 'Answer', text: '一至四级伤残：一次性伤残补助金 + 按月伤残津贴；五至十级：一次性伤残补助金，解除合同时再按省规定领取一次性工伤医疗补助金与一次性伤残就业补助金。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 条款依据（两源逐字核对：《工伤保险条例》司法部/上海市政府官网全文 + 地方人社解读）：
// - 第 35 条：一至四级，一次性伤残补助金 27/25/23/21 个月；伤残津贴 90%/85%/80%/75%。
// - 第 36 条：五至六级，一次性伤残补助金 18/16 个月；难以安排工作的按月伤残津贴 70%/60%。
// - 第 37 条：七至十级，一次性伤残补助金 13/11/9/7 个月；解除时两项一次性补助金（各省标准）。
// - 第 39 条：丧葬补助金 6 个月统筹地区上年度职工月平均工资；供养亲属抚恤金配偶 40%/其他 30%/孤寡孤儿 +10%，
//   之和不超过本人工资；一次性工亡补助金 = 上年度全国城镇居民人均可支配收入 × 20。
// - 第 64 条：本人工资高于统筹地区职工平均工资 300% 的按 300% 计，低于 60% 的按 60% 计。

// 金额 0.01 元定点收敛
function round2(x) {
  return Math.round((Number(x) || 0) * 100) / 100
}

// 一次性伤残补助金月数（第 35/36/37 条，1-10 级）
const DISABILITY_MONTHS = { 1: 27, 2: 25, 3: 23, 4: 21, 5: 18, 6: 16, 7: 13, 8: 11, 9: 9, 10: 7 }

// 一至四级按月伤残津贴比例（第 35 条）
const ALLOWANCE_RATE = { 1: 0.9, 2: 0.85, 3: 0.8, 4: 0.75 }

const LEVEL_NAMES = {
  1: '一级伤残', 2: '二级伤残', 3: '三级伤残', 4: '四级伤残', 5: '五级伤残',
  6: '六级伤残', 7: '七级伤残', 8: '八级伤残', 9: '九级伤残', 10: '十级伤残'
}

// 2026 年度口径：2025 年全国城镇居民人均可支配收入（国家统计局 2025 年统计公报，2026-02-28 发布）
const DEFAULT_NATIONAL_INCOME = 56502

// 本人工资按社平 60%~300% 上下限调整（第 64 条）：avg>0 才判定
function clampWageOf(wage, avg) {
  const w = Math.max(0, Number(wage) || 0)
  const a = Math.max(0, Number(avg) || 0)
  if (a <= 0) return { base: round2(w), clamp: 'none' }
  const lower = round2(a * 0.6)
  const upper = round2(a * 3)
  if (w < lower) return { base: lower, clamp: 'lower' }
  if (w > upper) return { base: upper, clamp: 'upper' }
  return { base: round2(w), clamp: 'none' }
}

// 一次性伤残补助金 = 调整后本人工资 × 月数
function lumpSumOf(base, level) {
  const months = DISABILITY_MONTHS[level] || 0
  return round2(base * months)
}

// 一至四级伤残津贴（按月）= 调整后本人工资 × 比例；五至十级为 0
function allowanceOf(base, level) {
  const rate = ALLOWANCE_RATE[level]
  if (!rate) return 0
  return round2(base * rate)
}

// 丧葬补助金 = 6 个月 × 统筹地区上年度职工月平均工资
function funeralOf(avg) {
  const a = Math.max(0, Number(avg) || 0)
  return a > 0 ? round2(a * 6) : 0
}

// 供养亲属抚恤金（按月）：配偶 40% + 其他每人 30% + 孤寡老人/孤儿每人加 10%，
// 核定之和不超过工亡职工生前本人工资（第 39 条）。返回 { rate, pension, capped }
function dependentsPensionOf(wage, spouse, others, lonely) {
  const w = Math.max(0, Number(wage) || 0)
  const s = Math.min(1, Math.max(0, Number(spouse) || 0))
  const o = Math.max(0, Number(others) || 0)
  const l = Math.max(0, Number(lonely) || 0)
  const rawRate = s * 0.4 + o * 0.3 + l * 0.1
  if (w <= 0 || rawRate <= 0) return { rate: 0, pension: 0, capped: false }
  const capped = rawRate > 1
  const rate = capped ? 1 : rawRate
  return { rate: Math.round(rate * 100) / 100, pension: round2(w * rate), capped }
}

// 一次性工亡补助金 = 上年度全国城镇居民人均可支配收入 × 20
function deathLumpOf(nationalIncome) {
  const inc = Math.max(0, Number(nationalIncome) || 0)
  return inc > 0 ? round2(inc * 20) : 0
}

// 金额展示：千分位 + 固定 2 位小数
function fmtMoney(n) {
  const v = round2(n)
  const sign = v < 0 ? '-' : ''
  const parts = Math.abs(v).toFixed(2).split('.')
  return sign + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1]
}

// ---------- 页面状态 ----------
const mode = ref('disability')
const level = ref(10)
const wage = ref(8000)
const avgWage = ref(8000)
const deathWage = ref(8000)
const spouseCount = ref(1)
const otherCount = ref(1)
const lonelyCount = ref(0)
const nationalIncome = ref(DEFAULT_NATIONAL_INCOME)

const nationalIncomeNum = computed(() => Math.max(0, Number(nationalIncome.value) || 0))

const inputErrors = computed(() => {
  const errs = []
  if (mode.value === 'disability' && !(Number(wage.value) > 0)) errs.push('本人月工资需大于 0')
  if (mode.value === 'death') {
    if (!(Number(deathWage.value) > 0)) errs.push('工亡职工本人月工资需大于 0')
    if (!(Number(avgWage.value) > 0)) errs.push('统筹地区上年度职工月平均工资需大于 0（丧葬补助金基数）')
    if (!(nationalIncomeNum.value > 0)) errs.push('上年度全国城镇居民人均可支配收入需大于 0')
  }
  return errs
})

const canCalc = computed(() => inputErrors.value.length === 0)

// ---------- 计算与展示派生 ----------
const result = computed(() => {
  if (mode.value === 'disability') {
    const clamped = clampWageOf(wage.value, avgWage.value)
    const clampNote = clamped.clamp === 'lower'
      ? `本人工资低于社平 60%，已按 ${fmtMoney(clamped.base)} 元（社平 × 60%）计发（第 64 条）。`
      : clamped.clamp === 'upper'
        ? `本人工资高于社平 300%，已按 ${fmtMoney(clamped.base)} 元（社平 × 300%）封顶（第 64 条）。`
        : ''
    return {
      base: clamped.base,
      clamp: clamped.clamp,
      clampNote,
      lumpSum: lumpSumOf(clamped.base, level.value),
      allowance: allowanceOf(clamped.base, level.value)
    }
  }
  const pen = dependentsPensionOf(deathWage.value, spouseCount.value, otherCount.value, lonelyCount.value)
  const parts = []
  if (spouseCount.value > 0) parts.push('配偶 40%')
  if (otherCount.value > 0) parts.push(`其他亲属 ${otherCount.value} 人 × 30%`)
  if (lonelyCount.value > 0) parts.push(`孤寡/孤儿加发 ${lonelyCount.value} × 10%`)
  return {
    base: 0,
    funeral: funeralOf(avgWage.value),
    pension: pen.pension,
    pensionCapped: pen.capped,
    pensionDetail: (parts.join(' + ') || '无符合条件的供养亲属') + `，合计比例 ${Math.round(pen.rate * 100)}%`
  }
})

const detailSteps = computed(() => {
  const steps = []
  if (mode.value === 'disability') {
    const r = result.value
    steps.push({
      label: '本人工资调整',
      formula: avgWage.value > 0
        ? `申报工资 ${fmtMoney(Number(wage.value) || 0)} 元，社平上下限 ${fmtMoney(avgWage.value * 0.6)} ~ ${fmtMoney(avgWage.value * 3)} 元（第 64 条）`
        : `按申报工资 ${fmtMoney(Number(wage.value) || 0)} 元计（未填社平，不做上下限调整）`,
      value: `${fmtMoney(r.base)} 元 / 月`
    })
    steps.push({
      label: '一次性伤残补助金',
      formula: `${fmtMoney(r.base)} × ${DISABILITY_MONTHS[level.value]} 个月（${LEVEL_NAMES[level.value]}，第 ${level.value <= 4 ? 35 : level.value <= 6 ? 36 : 37} 条）`,
      value: `${fmtMoney(r.lumpSum)} 元`
    })
    if (level.value <= 4) {
      steps.push({
        label: '伤残津贴',
        formula: `${fmtMoney(r.base)} × ${Math.round(ALLOWANCE_RATE[level.value] * 100)}%（按月发放，低于当地最低工资由基金补差）`,
        value: `${fmtMoney(r.allowance)} 元 / 月`
      })
    } else if (level.value <= 6) {
      steps.push({
        label: '伤残津贴（如难以安排工作）',
        formula: `由用人单位按月发给本人工资的 ${level.value === 5 ? '70' : '60'}%（第 36 条）`,
        value: `${fmtMoney(level.value === 5 ? r.base * 0.7 : r.base * 0.6)} 元 / 月`
      })
    }
  } else {
    const r = result.value
    steps.push({
      label: '① 丧葬补助金',
      formula: `6 个月 × 统筹地区上年度职工月平均工资 ${fmtMoney(Number(avgWage.value) || 0)} 元（第 39 条）`,
      value: `${fmtMoney(r.funeral)} 元`
    })
    steps.push({
      label: '② 供养亲属抚恤金',
      formula: `${r.pensionDetail} × 本人工资 ${fmtMoney(Number(deathWage.value) || 0)} 元${r.pensionCapped ? '（超过 100% 部分不支付）' : ''}（第 39 条）`,
      value: `${fmtMoney(r.pension)} 元 / 月`
    })
    steps.push({
      label: '③ 一次性工亡补助金',
      formula: `上年度全国城镇居民人均可支配收入 ${fmtMoney(nationalIncomeNum.value)} × 20（第 39 条）`,
      value: `${fmtMoney(deathLumpOf(nationalIncomeNum.value))} 元`
    })
  }
  return steps
})

// 复制结果（navigator.clipboard + alert）
function copyResult() {
  const lines = [`【工伤待遇测算 — ${mode.value === 'death' ? '工亡三项' : LEVEL_NAMES[level.value]}】`]
  detailSteps.value.forEach((st) => lines.push(`${st.label}：${st.value}（${st.formula}）`))
  lines.push('免责：仅为《工伤保险条例》条款教学演示，实际以社保经办机构核定为准，建议咨询当地人社 12333。')
  navigator.clipboard.writeText(lines.join('\n')).then(() => alert('已复制')).catch(() => alert('复制失败，请手动复制'))
}

function loadExample() {
  mode.value = 'disability'
  level.value = 10
  wage.value = 8000
  avgWage.value = 8000
}

function resetAll() {
  mode.value = 'disability'
  level.value = 10
  wage.value = ''
  avgWage.value = ''
  deathWage.value = ''
  spouseCount.value = 1
  otherCount.value = 1
  lonelyCount.value = 0
  nationalIncome.value = DEFAULT_NATIONAL_INCOME
}

onMounted(() => {
  addRecentTool('work-injury-compensation')
})
</script>
