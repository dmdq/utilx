<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Flame class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">FIRE 提前退休计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按 4% 法则算出你的财务自由数字、预计达成年龄与储蓄率敏感度，看清提前退休还差几年</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 FIRE 计算器（Financial Independence, Retire Early）：录入当前年龄、年支出、年储蓄与已有投资资产，按 4% / 3.5% / 3% 提取率即时测算 FIRE 数字（年支出 × 25）、
        距离财务自由还差多少年、预计退休年龄与当前储蓄率；附每 5 年资产增长快照、储蓄率 30% / 50% / 70% / 85% 四档敏感度对比与提取率差异对照。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Flame class="w-5 h-5 mr-2 text-primary" /> 收支与资产设置
        </h2>

        <!-- 当前年龄 -->
        <div>
          <label for="fire-age" class="block text-sm font-medium text-foreground mb-2">当前年龄（岁）</label>
          <input
            id="fire-age"
            v-model.number="ageInput"
            type="number"
            min="0"
            max="120"
            step="1"
            placeholder="如 30"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <!-- 当前年支出 -->
        <div>
          <label for="fire-expense" class="block text-sm font-medium text-foreground mb-2">当前年支出（万元）</label>
          <input
            id="fire-expense"
            v-model.number="expenseInput"
            type="number"
            min="0"
            step="0.5"
            placeholder="如 12"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">全家庭口径：房贷 / 房租、吃喝、教育、医疗自付等都算进去</p>
        </div>

        <!-- 当前年储蓄 -->
        <div>
          <label for="fire-saving" class="block text-sm font-medium text-foreground mb-2">当前年储蓄（万元）</label>
          <input
            id="fire-saving"
            v-model.number="savingInput"
            type="number"
            step="0.5"
            placeholder="如 12"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">年储蓄 = 税后年收入 − 年支出，可为负（入不敷出）</p>
        </div>

        <!-- 已有投资资产 -->
        <div>
          <label for="fire-asset" class="block text-sm font-medium text-foreground mb-2">已有投资资产（万元）</label>
          <input
            id="fire-asset"
            v-model.number="assetInput"
            type="number"
            min="0"
            step="1"
            placeholder="如 20"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">指可长期投资的金融资产，不含自住房与应急现金</p>
        </div>

        <!-- 投资年化收益率 -->
        <div>
          <label for="fire-return" class="block text-sm font-medium text-foreground mb-2">投资年化收益率（%）</label>
          <input
            id="fire-return"
            v-model.number="realReturnInput"
            type="number"
            min="0"
            max="15"
            step="0.5"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>通胀后实际收益口径，默认取名义 7% 减通胀 2% 的近似；范围 0-15</span>
          </p>
        </div>

        <!-- 提取率 -->
        <div>
          <label for="fire-withdrawal" class="block text-sm font-medium text-foreground mb-2">提取率</label>
          <select
            id="fire-withdrawal"
            v-model.number="withdrawalInput"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option :value="4">4%（经典 FIRE）</option>
            <option :value="3.5">3.5%（保守）</option>
            <option :value="3">3%（极保守）</option>
            <option :value="4.5">4.5%（激进）</option>
          </select>
          <p class="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>提取率 = 退休首年从投资组合中取用的比例，越低越抗跌，但所需的 FIRE 数字越大</span>
          </p>
        </div>

        <!-- 退休后年支出变化 -->
        <div>
          <label for="fire-delta" class="block text-sm font-medium text-foreground mb-2">退休后年支出变化（%）</label>
          <input
            id="fire-delta"
            v-model.number="deltaInput"
            type="number"
            min="-30"
            max="30"
            step="5"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
            <TrendingDown class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>有人退休后花得更少：通勤与应酬减少，但医疗可能增加；范围 -30 ~ +30</span>
          </p>
          <p v-if="expenseNum > 0" class="text-xs text-muted-foreground mt-1">
            退休后年支出 ≈ <span class="font-mono text-foreground">{{ formatWan(retirementExpense) }}</span> 万元
          </p>
        </div>

        <!-- 输入异常提示 -->
        <p v-if="inputWarning" class="text-xs leading-relaxed text-red-500 p-2 rounded bg-red-500/10 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ inputWarning }}</span>
        </p>

        <!-- 操作按钮 -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            @click="loadExample"
            class="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-sm font-medium text-primary transition"
          >
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 载入示例
          </button>
          <button
            @click="resetAll"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
          </button>
        </div>
      </div>

      <!-- 右侧：结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> FIRE 测算结果
        </h2>

        <!-- 结论卡一：FIRE 数字（特大显示） -->
        <div class="bg-primary/10 rounded-lg p-5 text-center">
          <p class="text-xs text-muted-foreground mb-1">你的 FIRE 数字（退休后年支出 × {{ multiplierText }}）</p>
          <p class="text-4xl sm:text-5xl font-bold text-primary leading-tight">
            {{ fireNumberText }}<span class="text-base font-normal text-muted-foreground ml-1.5">万元</span>
          </p>
          <p class="text-xs text-muted-foreground mt-2">{{ fireNumberSub }}</p>
        </div>

        <!-- 结论卡二 / 三 -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-muted/50 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">预计达成年龄</p>
            <p class="text-2xl font-bold" :class="reachAgeText === '—' ? 'text-muted-foreground' : 'text-foreground'">{{ reachAgeText }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ reachAgeSub }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">当前储蓄率</p>
            <p class="text-2xl font-bold" :class="savingsRateNum > 0 ? 'text-green-600' : savingsRateNum < 0 ? 'text-red-600' : 'text-foreground'">
              {{ savingsRateText }}
            </p>
            <p class="text-xs text-muted-foreground mt-1">年储蓄 ÷ 年收入（支出 + 储蓄）</p>
          </div>
        </div>

        <!-- 状态提示条 -->
        <p class="text-xs leading-relaxed p-3 rounded-lg border flex items-start gap-1.5" :class="statusView.cls">
          <component :is="statusView.icon" class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{{ statusView.text }}</span>
        </p>

        <!-- 达成路径快照表 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-foreground">达成路径快照（每 5 年一行）</h3>
            <span class="text-xs text-muted-foreground">单位：万元</span>
          </div>
          <div v-if="expenseNum > 0" class="overflow-x-auto rounded-lg border border-border">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-muted/50 text-muted-foreground">
                  <th class="px-3 py-2 text-left font-medium">年份</th>
                  <th class="px-3 py-2 text-right font-medium">年龄</th>
                  <th class="px-3 py-2 text-right font-medium">年末资产</th>
                  <th class="px-3 py-2 text-right font-medium">距 FIRE 数字</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="row in pathRows" :key="row.year" :class="row.hit ? 'bg-primary/5' : ''">
                  <td class="px-3 py-2 text-muted-foreground whitespace-nowrap">{{ row.year }} 年</td>
                  <td class="px-3 py-2 text-right text-muted-foreground">{{ row.age }} 岁</td>
                  <td class="px-3 py-2 text-right font-mono">{{ row.assetText }}</td>
                  <td class="px-3 py-2 text-right font-mono whitespace-nowrap" :class="row.reached ? 'text-green-600 font-semibold' : 'text-foreground'">
                    <template v-if="row.reached">
                      <CheckCircle class="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-green-500" />已达成
                    </template>
                    <template v-else>{{ row.gapText }}</template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-xs text-muted-foreground p-3 rounded-lg border border-border bg-muted/60 flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>先在左侧填入当前年支出与储蓄，或点击「载入示例」查看演示数据。</span>
          </p>
          <p v-if="expenseNum > 0" class="text-xs text-muted-foreground leading-relaxed mt-2 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>资产口径：实际收益复利 + 年储蓄不变（通胀后实际值）；高亮行为预计达成所在年份。达成后仍按当前储蓄习惯推演，仅作方向参考。</span>
          </p>
        </div>

        <!-- 储蓄率敏感度条 -->
        <div>
          <h3 class="text-sm font-semibold text-foreground mb-1 flex items-center">
            <TrendingDown class="w-4 h-4 mr-1.5 text-primary" /> 储蓄率敏感度：决定退休年龄的是储蓄率，不是收入
          </h3>
          <p class="text-xs text-muted-foreground mb-3">
            从零资产起步、按当前提取率 {{ withdrawalNum }}% 与实际收益 {{ realReturnNum }}% 推算，储蓄率对应的自由年限：
          </p>
          <div class="space-y-2.5">
            <div v-for="tier in sensitivityTiers" :key="tier.rate">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-foreground font-medium">储蓄率 {{ tier.rate }}%</span>
                <span class="font-mono" :class="tier.textCls">{{ tier.yearsText }}</span>
              </div>
              <div class="h-2.5 bg-muted rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all" :class="tier.cls" :style="{ width: tier.width + '%' }"></div>
              </div>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-3">
            同一个人，储蓄率从 30% 提到 70%，自由年限从约 {{ sensitivityTiers[0].years === null ? '—' : Math.round(sensitivityTiers[0].years) }} 年缩到约
            {{ sensitivityTiers[2].years === null ? '—' : Math.round(sensitivityTiers[2].years) }} 年——收入翻倍未必做得到，储蓄率翻倍只取决于你自己。
          </p>
        </div>

        <!-- 提取率对照小卡 -->
        <div>
          <h3 class="text-sm font-semibold text-foreground mb-2">提取率对照（按当前年支出 {{ formatWan(expenseNum) }} 万代入）</h3>
          <div v-if="expenseNum > 0" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              v-for="card in rateCards"
              :key="card.rate"
              class="rounded-lg border p-3 text-center"
              :class="card.active ? 'border-primary/40 bg-primary/10' : 'border-border bg-muted/40'"
            >
              <p class="text-xs text-muted-foreground mb-1">提取率 {{ card.label }}</p>
              <p class="text-xl font-bold" :class="card.active ? 'text-primary' : 'text-foreground'">{{ card.fireText }}<span class="text-xs font-normal text-muted-foreground ml-0.5">万</span></p>
              <p class="text-[10px] text-muted-foreground mt-1">{{ card.diffText }}</p>
            </div>
          </div>
          <p v-else class="text-xs text-muted-foreground p-3 rounded-lg border border-border bg-muted/60 flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>填入当前年支出后，这里会对比 4% / 3.5% / 3% 三档提取率下 FIRE 数字的差异。</span>
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed mt-2">
            提取率每降 0.5 个百分点，FIRE 数字就放大一截：3% 比 4% 多存 33.3%，3.5% 比 4% 多存 14.3%——保守是有价格的。
          </p>
        </div>

        <!-- 中国语境提示条（静态） -->
        <p class="text-xs leading-relaxed p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 text-foreground flex items-start gap-1.5">
          <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
          <span>FIRE 数字未含住房自有、医保与养老险覆盖、大额医疗与子女教育等中国语境变量；先把这个数字当成方向感，而不是截止日期。</span>
        </p>

        <!-- 免责声明（固定） -->
        <p class="text-[11px] leading-relaxed text-muted-foreground/80 border-t border-border pt-3">
          免责声明：4% 法则是基于美国历史数据的经验法则（Trinity Study），国内市场收益与通胀结构不同，结果仅供理解概念与长期规划参考，不构成投资建议。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>FIRE 提前退休计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          FIRE 提前退休计算器是一款在线财务自由测算工具。它以 4% 法则（Trinity Study）为核心：录入当前年龄、年支出、年储蓄与已有投资资产，
          用「退休后年支出 × (100 ÷ 提取率)」算出你的 FIRE 数字，再按「实际收益复利 + 年储蓄不变」的口径逐年迭代，得出距离财务自由的年数与预计达成年龄；
          同时给出当前储蓄率、每 5 年一行的资产增长快照、储蓄率 30% / 50% / 70% / 85% 四档自由年限对比与提取率差异对照。
          全部计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">FIRE 是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          FIRE（Financial Independence, Retire Early，财务独立、提早退休）是一种通过高储蓄率积累投资资产、让被动收益覆盖生活支出，
          从而获得「工作可选权」的生活方式：当投资组合大到每年提取 3%–4% 就能覆盖全部开销时，工作就从「必须」变成了「选择」。
          它不鼓励所有人辞职，而是把「什么时候可以不工作」从模糊的感觉变成一个可以计算的数字。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">4% 法则怎么来的？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          1994 年美国规划师 William Bengen 首次研究「安全提取率」，1998 年美国 Trinity 大学三位教授（即著名的 Trinity Study）用 1926–1995 年美股美债历史数据回测：
          从任一年份退休、按 50/50 股债配置、首年提取组合的 4%、之后每年按通胀上调提取额，30 年后钱没有花完的比例约 95%。
          于是「年支出 × 25」成为 FIRE 社群的黄金公式。但要注意三点：它是历史回测的经验值而非保证；美股过去百年的长期牛市难以复制；
          「30 年不花完」对提前退休动辄 40–60 年的退役期来说偏短——所以保守派用 3%–3.5%，对应「年支出 × 33 甚至 × 28」。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">中国版 FIRE 数字要打几折？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          诚实地说，这个数字不能简单打折，要分项讨论：医疗——国内退休后有医保与养老险覆盖基础开销，但大额自费医疗与长期护理仍是缺口，
          建议在 FIRE 数字之外单独预留一笔医疗缓冲；社保——国内养老金是与当地工资水平挂钩的终身现金流，相当于天然覆盖了退休后支出的一部分，
          可以按「养老金能覆盖的比例」对 FIRE 数字做等比扣减；房价——自有住房是最大的隐性资产，若退休时已无房贷，
          FIRE 数字里就不必包含房租，这一项的影响往往比 4% 法则本身还大。综合看，把工具算出的数字当作「毛估估的上限」，
          再按自身社保与住房情况做减法，比机械套用 25 倍更靠谱。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">储蓄率为什么比收入重要？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          FIRE 时间几乎只由储蓄率决定：收入 20 万存 10 万（50%），和收入 100 万存 50 万（50%），自由年限完全一样——
          因为 FIRE 数字随支出同步放大，收入提高时目标也水涨船高。按 4% 提取率、5% 实际收益口径：
          储蓄率 30% 大约要 28 年，50% 约 17 年，70% 约 9 年，85% 只要 4 年。收入决定储蓄的「绝对额」，
          储蓄率决定「到达年份」，而后者才是退休时间表。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">多少岁存够多少钱可以退休？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          用本工具的口径回答：第一步，估退休后年支出（一般取当前支出的七到九折），乘以 25（4% 提取率）得到 FIRE 数字；
          第二步，按当前储蓄与 5% 实际收益逐年迭代，得到所需年数，加上当前年龄就是预计退休年龄。例如 30 岁、年支出 12 万、年储蓄 12 万、现有 20 万：
          FIRE 数字 300 万，约 15 年后 45 岁达成；若把储蓄率提到 70%（年存 28 万），同样数字约 8 年多就能达成。
          反过来，如果算出的达成年龄超过 100 岁（工具会用「—」提示），说明当前口径下这条路走不通，
          需要提高储蓄率、降低支出预期，或接受更保守前提下的弹性退休方案。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">FIRE 是什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">FIRE（Financial Independence, Retire Early）指通过高储蓄率积累投资资产，让被动收益覆盖生活支出，从而获得「工作可选权」；当组合大到每年提取 3%–4% 就能覆盖开销时，工作就从必须变成了选择。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">4% 法则怎么来的？</h3>
            <p class="text-sm text-muted-foreground mt-1">源于 1998 年 Trinity 大学的历史回测：50/50 股债组合、首年提取 4%、之后按通胀上调，30 年不花完的概率约 95%，因此 FIRE 数字 = 年支出 × 25。它是经验值而非保证，提前退役期更长时保守派会用 3%–3.5%。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">中国版 FIRE 数字要打几折？</h3>
            <p class="text-sm text-muted-foreground mt-1">不能简单打折：医保与养老险覆盖了基础开销但大额医疗是缺口，社保养老金是可扣减的终身现金流，自有住房则可能直接把房租从支出里拿掉。建议把工具结果当上限，再按自身社保与住房情况做减法。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">储蓄率为什么比收入重要？</h3>
            <p class="text-sm text-muted-foreground mt-1">收入提高时 FIRE 数字随支出同步放大，所以自由年限几乎只由储蓄率决定：4% 法则、5% 实际收益下，储蓄率 30% 约 28 年、50% 约 17 年、70% 约 9 年、85% 约 4 年。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">多少岁存够多少钱可以退休？</h3>
            <p class="text-sm text-muted-foreground mt-1">用本工具口径：退休后年支出 × 25 = FIRE 数字；再按当前储蓄与实际收益逐年迭代得所需年数，加上当前年龄即预计退休年龄。例如 30 岁、年支出 12 万、年储蓄 12 万、现有 20 万，FIRE 数字 300 万，约 45 岁达成；储蓄率提到 70% 则约 38 岁达成。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'fire-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Flame, Calculator, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, TrendingDown, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'FIRE 提前退休计算器 - 财务自由数字 / 4% 法则在线测算',
  description: '免费在线 FIRE 计算器：录入年龄、年支出、年储蓄与已有投资资产，按 4% 法则（年支出×25）秒算财务自由数字、预计达成年龄与当前储蓄率，附每 5 年资产快照、储蓄率敏感度对比与提取率差异对照，看清提前退休还差几年，纯浏览器本地运行不上传',
  keywords: 'FIRE 计算器,提前退休,4%法则,财务自由,储蓄率',
  author: '有条工具',
  ogTitle: 'FIRE 提前退休计算器 - 财务自由数字 / 4% 法则在线测算 | 有条工具',
  ogDescription: '按 4% 法则秒算你的 FIRE 数字、预计达成年龄与储蓄率敏感度。',
  ogUrl: 'https://www.util.cn/tools/fire-calculator',
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
          name: 'FIRE 提前退休计算器',
          url: 'https://www.util.cn/tools/fire-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['4% 法则 FIRE 数字测算', '预计达成年龄迭代推演', '当前储蓄率计算', '每 5 年资产增长快照', '储蓄率四档自由年限敏感度', '提取率差异对照', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: 'FIRE 提前退休计算器', item: 'https://www.util.cn/tools/fire-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'FIRE 是什么？',
              acceptedAnswer: { '@type': 'Answer', text: 'FIRE（Financial Independence, Retire Early）指通过高储蓄率积累投资资产，让被动收益覆盖生活支出，从而获得工作可选权；当组合大到每年提取 3%–4% 就能覆盖开销时，工作就从必须变成了选择。' }
            },
            {
              '@type': 'Question',
              name: '4% 法则怎么来的？',
              acceptedAnswer: { '@type': 'Answer', text: '源于 1998 年 Trinity 大学的历史回测：50/50 股债组合、首年提取 4%、之后按通胀上调，30 年不花完的概率约 95%，因此 FIRE 数字 = 年支出 × 25。它是经验值而非保证，提前退役期更长时保守派会用 3%–3.5%。' }
            },
            {
              '@type': 'Question',
              name: '中国版 FIRE 数字要打几折？',
              acceptedAnswer: { '@type': 'Answer', text: '不能简单打折：医保与养老险覆盖了基础开销但大额医疗是缺口，社保养老金是可扣减的终身现金流，自有住房则可能直接把房租从支出里拿掉。建议把工具结果当上限，再按自身社保与住房情况做减法。' }
            },
            {
              '@type': 'Question',
              name: '储蓄率为什么比收入重要？',
              acceptedAnswer: { '@type': 'Answer', text: '收入提高时 FIRE 数字随支出同步放大，所以自由年限几乎只由储蓄率决定：4% 法则、5% 实际收益下，储蓄率 30% 约 28 年、50% 约 17 年、70% 约 9 年、85% 约 4 年。' }
            },
            {
              '@type': 'Question',
              name: '多少岁存够多少钱可以退休？',
              acceptedAnswer: { '@type': 'Answer', text: '用本工具口径：退休后年支出 × 25 = FIRE 数字；再按当前储蓄与实际收益逐年迭代得所需年数，加上当前年龄即预计退休年龄。例如 30 岁、年支出 12 万、年储蓄 12 万、现有 20 万，FIRE 数字 300 万，约 45 岁达成；储蓄率提到 70% 则约 38 岁达成。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 口径约定：金额单位一律为「万元」；提取率 / 储蓄率 / 收益率等比率参数一律用百分数
// （如 4 表示 4%、5 表示 5%），函数内部自行 ÷100，避免小数与百分数混用出错。

const MAX_PROJECTION_YEARS = 80 // 达成年数兜底上限：超过 80 年视为「按当前节奏走不通」

// 输入归一化：非有限数按 0 处理
function numOr0(v) {
  const n = Number(v)
  return isFinite(n) ? n : 0
}

// 输入归一化：非有限数按下限，其余夹紧到 [min, max]
function clampNum(v, min, max) {
  const n = Number(v)
  if (!isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

// FIRE 数字 = 退休后年支出 × (100 / 提取率)。
// 推导：4% 法则下退休首年从组合中提取 4%，此后每年按通胀上调提取额；
// 设组合为 P、退休后年支出为 E，需 P × 4% ≥ E 恒成立 → P ≥ E / 0.04 = E × 25。
// 推广到任意提取率 w（百分数）：P = E × 100 / w。结果保留 2 位小数消除浮点噪声。
function fireNumberOf(annualExpense, withdrawalRate) {
  if (!isFinite(annualExpense) || annualExpense <= 0 || !isFinite(withdrawalRate) || withdrawalRate <= 0) return 0
  return Math.round(((annualExpense * 100) / withdrawalRate) * 100) / 100
}

// 达成 FIRE 所需年数（逐年迭代）：年末资产 = 上年末资产 × (1 + 实际收益) + 年储蓄。
// 口径：收益率取「通胀后实际收益」，年储蓄也按实际口径保持不变（即储蓄随收入与通胀同步增长、
// 支出同比例增长后相互抵消），两者相容，因此无需再单独引入通胀变量。
// - fireNumber ≤ 当前资产 → 已达成，返回 0（增长注水判定：别把已达成的目标再算一遍）
// - 无净储蓄（储蓄 ≤ 0）且资产无法靠自身增值追上目标（收益 ≤ 0，或负储蓄下几何级数不收敛）→ 返回 null
// - 正常迭代，超过 maxYears 仍未达成 → 返回 maxYears（80 年兜底）
function yearsToFIRE(currentAsset, annualSaving, fireNumber, realReturn, maxYears = MAX_PROJECTION_YEARS) {
  if (!isFinite(fireNumber) || fireNumber <= currentAsset) return 0
  const r = isFinite(realReturn) ? realReturn / 100 : 0
  const s = isFinite(annualSaving) ? annualSaving : 0
  if (s <= 0 && (r <= 0 || currentAsset + s / r <= 0)) return null
  let asset = currentAsset
  for (let year = 1; year <= maxYears; year++) {
    asset = asset * (1 + r) + s
    if (asset >= fireNumber) return year
  }
  return maxYears
}

// 储蓄率 = 年储蓄 ÷ (年支出 + 年储蓄)（年收入 = 支出 + 储蓄），保留 1 位小数；
// 分母 ≤ 0（无收入口径）时按 0 处理。储蓄为负（入不敷出）会得到负储蓄率，保留以提示风险。
function savingsRateOf(annualExpense, annualSaving) {
  const income = annualExpense + annualSaving
  if (!isFinite(income) || income <= 0) return 0
  return Math.round((annualSaving / income) * 1000) / 10
}

// 储蓄率 → 自由年限（经典曲线）：
// 设年收入为 1（实际口径），储蓄率 s → 每年储蓄 s、支出 1 − s；FIRE 数字 = (1 − s) / w（w 为提取率小数）。
// 从 0 资产起步，每年年末资产 A_n = A_{n−1}(1 + r) + s → A_n = s·((1+r)^n − 1) / r，
// 令 A_n ≥ (1 − s)/w 得 (1+r)^n ≥ 1 + r(1 − s)/(w·s)，解析解 n = ln(1 + r(1 − s)/(w·s)) / ln(1 + r)。
// r = 0 时退化为线性累积：n = (1 − s) / (w·s)；r < 0 或参数无效时返回 null。结果保留 1 位小数。
function yearsFromSavingsRate(savingsRate, realReturn, withdrawalRate = 4) {
  const s = savingsRate / 100
  const w = withdrawalRate / 100
  if (!isFinite(s) || s <= 0 || !isFinite(w) || w <= 0) return null
  if (s >= 1) return 0
  const r = isFinite(realReturn) ? realReturn / 100 : 0
  if (r < 0) return null
  if (r === 0) {
    return Math.round(((1 - s) / (w * s)) * 10) / 10
  }
  const ratio = 1 + (r * (1 - s)) / (w * s)
  return Math.round((Math.log(ratio) / Math.log(1 + r)) * 10) / 10
}

// 首年可提取金额 = FIRE 数字 × 提取率，保留 2 位小数
function withdrawalYearlyOf(fireNumber, withdrawalRate) {
  if (!isFinite(fireNumber) || !isFinite(withdrawalRate) || withdrawalRate <= 0) return 0
  return Math.round(fireNumber * (withdrawalRate / 100) * 100) / 100
}

// 退休后年支出 = 当前年支出 × (1 + 变化百分比)，保留 2 位小数消除浮点噪声
function retirementExpenseOf(annualExpense, changePercent) {
  if (!isFinite(annualExpense) || annualExpense <= 0) return 0
  const c = isFinite(changePercent) ? changePercent : 0
  return Math.round(annualExpense * (1 + c / 100) * 100) / 100
}

// 达成路径快照：每 step 年一行（年份 / 年龄 / 年末资产 / 距 FIRE 缺口），最多 maxRows 行
function assetSnapshots(currentAsset, annualSaving, realReturn, fireNumber, currentYear, currentAge, step = 5, maxRows = 15) {
  const r = isFinite(realReturn) ? realReturn / 100 : 0
  const s = isFinite(annualSaving) ? annualSaving : 0
  const rows = []
  let asset = currentAsset
  const totalYears = step * maxRows
  for (let y = 1; y <= totalYears; y++) {
    asset = asset * (1 + r) + s
    if (y % step === 0) {
      rows.push({
        year: currentYear + y,
        age: currentAge + y,
        asset,
        gap: Math.max(0, fireNumber - asset),
        reached: fireNumber <= asset
      })
    }
  }
  return rows
}

// 金额格式化：千分位 + 最多 digits 位小数（默认 1 位）
function formatWan(wan, digits = 1) {
  const n = Number(wan)
  if (!isFinite(n)) return '—'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

// ---------- 输入状态 ----------
// 隐私说明：金额属于敏感财务信息，本工具不写入 localStorage、不做任何持久化；
// 页面无浏览器 API 依赖（年份取自 Date，SSR / 客户端均安全），仅在 onMounted 记录最近使用。
const DEFAULTS = { age: 30, expense: 0, saving: 0, asset: 0, realReturn: 5, withdrawal: 4, delta: 0 }
const EXAMPLE = { age: 30, expense: 12, saving: 12, asset: 20, realReturn: 5, withdrawal: 4, delta: 0 }

const ageInput = ref(EXAMPLE.age)
const expenseInput = ref(EXAMPLE.expense)
const savingInput = ref(EXAMPLE.saving)
const assetInput = ref(EXAMPLE.asset)
const realReturnInput = ref(EXAMPLE.realReturn)
const withdrawalInput = ref(EXAMPLE.withdrawal)
const deltaInput = ref(EXAMPLE.delta)
const seoContentVisible = ref(true)

// ---------- 归一化与核心计算 ----------
const ageNum = computed(() => Math.round(clampNum(ageInput.value, 0, 120)))
const expenseNum = computed(() => Math.max(0, numOr0(expenseInput.value)))
const savingNum = computed(() => numOr0(savingInput.value)) // 允许负数（入不敷出）
const assetNum = computed(() => Math.max(0, numOr0(assetInput.value)))
const realReturnNum = computed(() => clampNum(realReturnInput.value, 0, 15))
const withdrawalNum = computed(() => withdrawalInput.value) // 下拉固定选项，无需夹紧
const deltaNum = computed(() => clampNum(deltaInput.value, -30, 30))

const retirementExpense = computed(() => retirementExpenseOf(expenseNum.value, deltaNum.value))
const fireNumber = computed(() => fireNumberOf(retirementExpense.value, withdrawalNum.value))
const yearsToFire = computed(() => yearsToFIRE(assetNum.value, savingNum.value, fireNumber.value, realReturnNum.value))
const targetAge = computed(() =>
  yearsToFire.value === null ? null : ageNum.value + yearsToFire.value
)
const savingsRateNum = computed(() => savingsRateOf(expenseNum.value, savingNum.value))

const currentYear = computed(() => new Date().getFullYear())
const pathRows = computed(() =>
  assetSnapshots(assetNum.value, savingNum.value, realReturnNum.value, fireNumber.value, currentYear.value, ageNum.value)
    .map((row) => ({
      year: row.year,
      age: row.age,
      assetText: formatWan(row.asset),
      gapText: formatWan(row.gap),
      reached: row.reached,
      hit: yearsToFire.value > 0 && yearsToFire.value < MAX_PROJECTION_YEARS && row.age === targetAge.value
    }))
)

const SENSITIVITY_TIERS = [30, 50, 70, 85]
const sensitivityTiers = computed(() => {
  const values = SENSITIVITY_TIERS.map((rate) => yearsFromSavingsRate(rate, realReturnNum.value, withdrawalNum.value))
  const valid = values.filter((v) => v !== null)
  const max = valid.length ? Math.max(...valid) : 1
  return SENSITIVITY_TIERS.map((rate, i) => {
    const years = values[i]
    return {
      rate,
      years,
      yearsText: years === null ? '—' : `约 ${years} 年`,
      width: years === null ? 0 : Math.max(4, Math.round((years / max) * 100)),
      cls: years === null ? 'bg-muted-foreground/40' : years <= 10 ? 'bg-green-500' : years <= 20 ? 'bg-amber-500' : 'bg-red-500',
      textCls: years === null ? 'text-muted-foreground' : years <= 10 ? 'text-green-600' : years <= 20 ? 'text-amber-600' : 'text-red-600'
    }
  })
})

const rateCards = computed(() => {
  if (expenseNum.value <= 0) return []
  return [4, 3.5, 3].map((rate) => {
    const fire = fireNumberOf(expenseNum.value, rate)
    const extra = Math.round((4 / rate - 1) * 1000) / 10 // 相对 4% 需多存的百分比
    return {
      rate,
      label: `${rate}%`,
      fireText: formatWan(fire, 2),
      diffText: rate === 4 ? '基准（Trinity Study 口径）' : `比 4% 多存 ${extra}%`,
      active: withdrawalNum.value === rate
    }
  })
})

// ---------- 展示视图 ----------
const multiplierText = computed(() => (100 / withdrawalNum.value).toLocaleString('zh-CN', { maximumFractionDigits: 1 }))

const fireNumberText = computed(() => (expenseNum.value > 0 ? formatWan(fireNumber.value, 2) : '—'))

const fireNumberSub = computed(() => {
  if (expenseNum.value <= 0) return '先在左侧填入当前年支出'
  return `退休后年支出 ${formatWan(retirementExpense.value)} 万 × ${multiplierText.value} 倍`
})

const reachAgeText = computed(() => {
  if (expenseNum.value <= 0) return '—'
  if (targetAge.value === null) return '—'
  if (targetAge.value > 100) return '—'
  return `${targetAge.value} 岁`
})

const reachAgeSub = computed(() => {
  if (expenseNum.value <= 0) return '先在左侧填入当前年支出'
  if (yearsToFire.value === null) return '当前储蓄与收益口径下无法达成'
  if (yearsToFire.value === 0) return '投资资产已覆盖 FIRE 数字'
  if (yearsToFire.value >= MAX_PROJECTION_YEARS) return `超过 ${MAX_PROJECTION_YEARS} 年仍未达成`
  return `当前 ${ageNum.value} 岁 + ${yearsToFire.value} 年`
})

const savingsRateText = computed(() => `${savingsRateNum.value > 0 ? '+' : ''}${savingsRateNum.value.toFixed(1)}%`)

const statusView = computed(() => {
  if (expenseNum.value <= 0) {
    return {
      icon: Info,
      cls: 'border-border bg-muted/60 text-muted-foreground',
      text: '先在左侧填入当前年支出与储蓄，或点击「载入示例」查看演示数据。'
    }
  }
  if (yearsToFire.value === null) {
    return {
      icon: TriangleAlert,
      cls: 'border-red-500/20 bg-red-500/10 text-red-600',
      text: '按当前口径无法达成：没有净储蓄，资产也无法靠增值追上 FIRE 数字。先把储蓄率做正，再看年数。'
    }
  }
  if (yearsToFire.value === 0) {
    return {
      icon: CheckCircle,
      cls: 'border-green-500/20 bg-green-500/10 text-green-600',
      text: '当前投资资产已覆盖 FIRE 数字，按此口径你已处于财务自由状态。'
    }
  }
  if (yearsToFire.value >= MAX_PROJECTION_YEARS) {
    return {
      icon: TriangleAlert,
      cls: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
      text: `按当前节奏 ${MAX_PROJECTION_YEARS} 年仍未达成：FIRE 数字过大或储蓄过少，试着降低支出预期或提高储蓄率。`
    }
  }
  return {
    icon: Info,
    cls: 'border-primary/20 bg-primary/10 text-foreground',
    text: `按当前口径约 ${yearsToFire.value} 年后达成（${reachAgeText.value}）。决定快慢的是储蓄率与支出，而不是收入本身。`
  }
})

const inputWarning = computed(() => {
  const checks = [
    [ageInput.value, 0, 120],
    [expenseInput.value, 0, Infinity],
    [assetInput.value, 0, Infinity],
    [realReturnInput.value, 0, 15],
    [deltaInput.value, -30, 30]
  ]
  const bad = checks.some(([v, min, max]) => {
    if (v === '' || v === null || v === undefined) return false
    const n = Number(v)
    return !isFinite(n) || n < min || n > max
  })
  return bad ? '部分输入超出允许范围，已自动夹紧到有效区间参与计算。' : ''
})

// ---------- 操作 ----------
function loadExample() {
  ageInput.value = EXAMPLE.age
  expenseInput.value = EXAMPLE.expense
  savingInput.value = EXAMPLE.saving
  assetInput.value = EXAMPLE.asset
  realReturnInput.value = EXAMPLE.realReturn
  withdrawalInput.value = EXAMPLE.withdrawal
  deltaInput.value = EXAMPLE.delta
}

function resetAll() {
  ageInput.value = DEFAULTS.age
  expenseInput.value = DEFAULTS.expense
  savingInput.value = DEFAULTS.saving
  assetInput.value = DEFAULTS.asset
  realReturnInput.value = DEFAULTS.realReturn
  withdrawalInput.value = DEFAULTS.withdrawal
  deltaInput.value = DEFAULTS.delta
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('fire-calculator')
})
</script>
