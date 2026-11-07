<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Wallet class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">债务还款计划器</h1>
          <p class="text-sm text-muted-foreground mt-1">多笔债务雪球法（余额从小到大）与雪崩法（利率从高到低）双策略逐月模拟，总利息与清债时间一屏对比</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线债务还款计划器：录入多笔债务（余额、年利率、最低月供）与每月总还款预算，逐月迭代模拟两种经典清债策略——
        <b>雪球法</b>（先还清余额最小的债，靠心理正反馈坚持）与<b>雪崩法</b>（先还清利率最高的债，数学上最省利息），
        输出清债总月数、总利息、每笔债的清偿月份时间线与两策略利息差 / 时间差对比条；
        月利率按年利率 ÷ 12 的单利口径计息（每月利息 = 余额 × 月利率），金额全程按 0.01 元定点计算。
        预算低于最低月供之和时自动红色告警。全部计算在浏览器本地完成，不上传任何债务数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Wallet class="w-5 h-5 mr-2 text-primary" /> 债务清单与预算
        </h2>

        <!-- 债务列表 -->
        <div class="space-y-3">
          <div
            v-for="(d, i) in debts"
            :key="d.id"
            class="border border-border rounded-lg p-3 space-y-2 bg-muted/20"
          >
            <div class="flex items-center gap-2">
              <input
                v-model="d.name"
                type="text"
                :placeholder="'债务 ' + (i + 1) + ' 名称（如花呗）'"
                class="flex-1 min-w-0 px-2.5 py-1.5 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                @click="removeDebt(i)"
                :disabled="debts.length <= 1"
                class="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="删除该笔债务"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="text-[10px] text-muted-foreground mb-1 block">余额（元）</label>
                <input
                  v-model.number="d.balance"
                  type="number"
                  min="0"
                  step="100"
                  class="w-full px-2 py-1.5 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label class="text-[10px] text-muted-foreground mb-1 block">年利率 %（APR）</label>
                <input
                  v-model.number="d.apr"
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-2 py-1.5 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label class="text-[10px] text-muted-foreground mb-1 block">最低月供（元）</label>
                <input
                  v-model.number="d.minPay"
                  type="number"
                  min="0"
                  step="50"
                  class="w-full px-2 py-1.5 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          @click="addDebt"
          :disabled="debts.length >= 8"
          class="w-full px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus class="w-4 h-4 inline mr-1 -mt-0.5" /> 添加一笔债务（最多 8 笔）
        </button>

        <!-- 每月预算 -->
        <div>
          <label for="dp-budget" class="block text-sm font-medium text-foreground mb-2">每月总还款预算 B</label>
          <div class="flex items-center gap-2">
            <input
              id="dp-budget"
              v-model.number="budget"
              type="number"
              min="0"
              step="100"
              placeholder="如 800"
              class="flex-1 min-w-0 px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元 / 月</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>每月先按各笔最低月供还款，剩余部分全部投向策略排序后的第一笔债（还清后顺延下一笔）。计息口径：月利率 = 年利率 ÷ 12，每月利息 = 余额 × 月利率（单利简化）。</span>
          </p>
        </div>

        <!-- 月供可行性校验 -->
        <p
          v-if="!feasible && budgetWarning"
          class="text-xs leading-relaxed text-red-500 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-1.5"
        >
          <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{{ budgetWarning }}</span>
        </p>

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
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 双策略清债模拟
          </h2>
          <button
            v-if="canCalc && snowball.feasible && avalanche.feasible"
            @click="copyResult"
            class="text-xs px-2.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-foreground transition"
          >
            <Copy class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 复制结果
          </button>
        </div>

        <template v-if="canCalc && snowball.feasible && avalanche.feasible">
          <!-- 策略对比卡 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="rounded-xl border p-4" :class="snowballWins.interest ? 'border-primary bg-primary/10' : 'border-border bg-muted/40'">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-semibold text-foreground">❄️ 雪球法（余额从小到大）</p>
                <span v-if="snowballWins.interest" class="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">省利息</span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-center">
                <div class="bg-muted/50 rounded-lg p-2.5">
                  <p class="text-[10px] text-muted-foreground">清债总月数</p>
                  <p class="text-xl font-bold text-foreground">{{ snowball.months }}<span class="text-xs font-normal"> 个月</span></p>
                </div>
                <div class="bg-muted/50 rounded-lg p-2.5">
                  <p class="text-[10px] text-muted-foreground">总利息</p>
                  <p class="text-xl font-bold text-foreground">¥{{ fmtMoney(snowball.totalInterest) }}</p>
                </div>
              </div>
              <p class="text-[11px] text-muted-foreground mt-2">清偿顺序：{{ snowball.order.map((d) => d.name).join(' → ') }}</p>
            </div>
            <div class="rounded-xl border p-4" :class="!snowballWins.interest ? 'border-primary bg-primary/10' : 'border-border bg-muted/40'">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-semibold text-foreground">🏔️ 雪崩法（利率从高到低）</p>
                <span v-if="!snowballWins.interest" class="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">省利息</span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-center">
                <div class="bg-muted/50 rounded-lg p-2.5">
                  <p class="text-[10px] text-muted-foreground">清债总月数</p>
                  <p class="text-xl font-bold text-foreground">{{ avalanche.months }}<span class="text-xs font-normal"> 个月</span></p>
                </div>
                <div class="bg-muted/50 rounded-lg p-2.5">
                  <p class="text-[10px] text-muted-foreground">总利息</p>
                  <p class="text-xl font-bold text-foreground">¥{{ fmtMoney(avalanche.totalInterest) }}</p>
                </div>
              </div>
              <p class="text-[11px] text-muted-foreground mt-2">清偿顺序：{{ avalanche.order.map((d) => d.name).join(' → ') }}</p>
            </div>
          </div>

          <!-- 差异高亮条 -->
          <div class="bg-muted/50 rounded-xl p-4">
            <p class="text-sm font-semibold text-foreground mb-2">策略对比</p>
            <div class="flex flex-wrap gap-2 text-xs">
              <span class="px-2.5 py-1.5 rounded-lg bg-background border border-border text-foreground">
                利息差：¥{{ fmtMoney(Math.abs(snowball.totalInterest - avalanche.totalInterest)) }}
                <span :class="snowballWins.interest ? 'text-green-600 font-semibold' : 'text-muted-foreground'">（{{ snowballWins.interest ? '雪球省' : snowballWins.interestTie ? '持平' : '雪崩省' }}）</span>
              </span>
              <span class="px-2.5 py-1.5 rounded-lg bg-background border border-border text-foreground">
                时间差：{{ Math.abs(snowball.months - avalanche.months) }} 个月
                <span :class="snowballWins.time ? 'text-green-600 font-semibold' : 'text-muted-foreground'">（{{ snowballWins.time ? '雪球快' : snowballWins.timeTie ? '持平' : '雪崩快' }}）</span>
              </span>
              <span class="px-2.5 py-1.5 rounded-lg bg-background border border-border text-muted-foreground">
                数学最优是雪崩，心理最优是雪球——能坚持的那个才是好策略
              </span>
            </div>
          </div>

          <!-- 清债时间线 -->
          <div class="border border-border rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-muted/40 border-b border-border">
              <p class="text-sm font-semibold text-foreground">清债时间线（每笔债在哪个月还清）</p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-xs text-muted-foreground border-b border-border bg-background">
                    <th class="px-4 py-2 text-left font-medium">债务</th>
                    <th class="px-4 py-2 text-right font-medium">余额</th>
                    <th class="px-4 py-2 text-right font-medium">年利率</th>
                    <th class="px-4 py-2 text-right font-medium">雪球还清</th>
                    <th class="px-4 py-2 text-right font-medium">雪崩还清</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in timelineRows" :key="row.id" class="border-b border-border/40 last:border-0">
                    <td class="px-4 py-2 text-foreground font-medium whitespace-nowrap">{{ row.name }}</td>
                    <td class="px-4 py-2 text-right font-mono text-muted-foreground">¥{{ fmtMoney(row.balance) }}</td>
                    <td class="px-4 py-2 text-right font-mono text-muted-foreground">{{ row.apr }}%</td>
                    <td class="px-4 py-2 text-right font-mono whitespace-nowrap" :class="row.snowMonth <= 12 ? 'text-green-600' : 'text-foreground'">第 {{ row.snowMonth }} 个月</td>
                    <td class="px-4 py-2 text-right font-mono whitespace-nowrap" :class="row.avaMonth <= 12 ? 'text-green-600' : 'text-foreground'">第 {{ row.avaMonth }} 个月</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed px-4 py-2.5 border-t border-border bg-muted/30">
              逐月模拟口径：每月先计息（余额 × 年利率 ÷ 12），再扣各笔最低月供，剩余预算按策略顺序集中投向第一笔活跃债务；
              若某笔债的最低月供低于其月利息，仅靠最低供将永远还不完，需靠预算结余清偿。
            </p>
          </div>
        </template>

        <!-- 预算不足 / 输入不完整 -->
        <div v-else class="text-center text-muted-foreground py-16">
          <TriangleAlert class="w-10 h-10 mx-auto mb-3" :class="budgetWarning ? 'text-red-500' : 'text-yellow-500'" />
          <p class="text-sm">{{ budgetWarning || ('请先完善左侧输入：' + inputErrors.join('；') + '。') }}</p>
          <p class="text-xs text-muted-foreground/70 mt-1">也可以点击「载入示例」先看一条完整模拟：三笔债共 27000 元、预算 800 元 / 月。</p>
        </div>
      </div>
    </div>

    <!-- 免责声明（页面固定） -->
    <p class="text-xs text-muted-foreground leading-relaxed mb-8 px-0 flex items-start gap-1.5">
      <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <span>
        本工具为清债策略的教学模拟：月利率按年利率 ÷ 12 单利简化，实际信用卡 / 消费贷的计息日、违约金、
        分期手续费与宽限期规则以金融机构合同为准；模拟结果不构成任何财务或法律建议。
        若已无力偿还，可主动联系银行协商个性化分期或展期（依《商业银行信用卡业务监督管理办法》第 70 条，最长可协商 60 期），比以贷养贷更可控。
      </span>
    </p>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg mb-12 group">
      <summary class="flex items-center justify-between cursor-pointer select-none px-6 py-4">
        <span class="text-lg font-semibold text-foreground"><span class="text-primary mr-2">#</span>雪球法 vs 雪崩法：公式、选择与常见问题</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div class="px-6 pb-6 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">计算公式</h3>
          <div class="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed space-y-2">
            <p><strong>每月利息</strong> = 当前余额 ×（年利率 ÷ 12）；月利率按单利口径简化（不逐日复利）。</p>
            <p><strong>逐月迭代</strong>：当月余额 = 上月余额 + 当月利息 − 当月还款；每月还款 = Σ最低月供 + 全部剩余预算，剩余预算按策略顺序集中投向第一笔活跃债务。</p>
            <p><strong>雪球法排序</strong>：余额从小到大；<strong>雪崩法排序</strong>：年利率从高到低（同利率按余额小者优先）。</p>
            <p><strong>可行性校验</strong>：每月预算 B &lt; Σ最低月供时无法维持最低还款，触发红色告警；某笔债「月利息 &gt; 最低月供」时该债单靠最低供永远还不完。</p>
            <p>例：单笔 12000 元、年利率 18%（月利率 1.5%）、月供 500 元，理论期数 n = −ln(1 − 12000×0.015÷500) ÷ ln(1.015) ≈ 29.97 → 30 个月还清（末期部分还款），总利息约 2988 元。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">雪球法和雪崩法怎么选？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            两者每月投入的钱完全一样，区别只在「多余的钱先砸哪笔债」：
            <b class="text-foreground">雪崩法</b>永远先消灭利率最高的债，数学上总利息最低——两笔债利率差距越大，省得越多；
            <b class="text-foreground">雪球法</b>先消灭余额最小的债，让你最快看到「少一笔债」的正反馈，
            行为金融学上更容易坚持到底。研究与实践都指向同一个结论：<b class="text-foreground">能坚持的那个才是最优策略</b>——
            半途而废的雪崩，不如走完全程的雪球。拿不准时可以用本页对比条看看两者利息差：
            差距只有几十块就选顺手的，差距上千块就认真考虑雪崩。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">还不上了怎么办？协商展期提示</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            出现还款困难时，第一原则是<b class="text-foreground">停止以贷养贷</b>：新贷款的利率只会让雪球滚得更快。
            更可控的路径：① 盘点所有债务（本页工具可直接用），按利率排序；② 主动联系发卡行 / 贷款机构说明困难，
            申请协商还款——《商业银行信用卡业务监督管理办法》第 70 条规定，特殊情况下确认还款能力不足但仍有还款意愿的，
            可与持卡人平等协商个性化分期还款协议，<b class="text-foreground">最长不超过 5 年（60 期）</b>；
            ③ 优先保住上征信、利率高的债务，将预算从低息债挪向高息债；④ 警惕「反催收」中介，
            正规协商只面向银行本人办理、不收前置费用。站内配套工具：
            <a href="/tools/compound-interest-calculator/" class="text-primary hover:underline">复利计算器</a>（看清利率的时间威力）。
          </p>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">雪球法和雪崩法哪个省利息？</h3>
            <p class="text-sm text-muted-foreground mt-1">雪崩法（先还利率最高的债）在数学上总利息最低或持平，永远不会比雪球更差；雪球法的优势是更快见到「清掉一笔」的心理反馈，更容易坚持。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">12000 元、年利率 18%、每月还 500，要多久？</h3>
            <p class="text-sm text-muted-foreground mt-1">月利率 1.5%，理论期数 n = −ln(1 − 180/500) ÷ ln(1.015) ≈ 30 个月（末期部分还款），总利息约 2988 元——利息约占本金的四分之一，延长还款期的代价很直观。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么我的最低月供越还越多？</h3>
            <p class="text-sm text-muted-foreground mt-1">若最低月供低于当月利息，余额不降反升（负摊销）；本工具会提示该债务需靠预算结余偿还，否则永远还不完。信用卡「最低还款」通常按账单 10% 计且利息全额计息，长期使用成本很高。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">每月预算怎么定才合理？</h3>
            <p class="text-sm text-muted-foreground mt-1">预算必须 ≥ Σ最低月供（否则触发本页红色告警）；理想值是「收入 − 刚性支出 − 应急金」后能稳定拿出的最大值。预算每多 100 元，总利息都会明显下降，可以在本页直接改预算对比。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">可以先把高利率债转成低利率债吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">可以，这就是「债务整合」：用低利率贷款（如银行消费贷）置换高利率信用卡分期。但要注意手续费、提前还款违约金与新贷款期限，整合后别重新透支旧额度，否则债务只会翻倍。</p>
          </div>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'debt-payoff-planner'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Wallet, Calculator, Info, TriangleAlert, ChevronDown,
  RefreshCw, Copy, Plus, Trash2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '债务还款计划器 - 雪球法/雪崩法清债策略在线模拟',
  description: '免费在线债务还款计划器：多笔债务逐月模拟雪球法（余额从小到大）与雪崩法（利率从高到低），输出清债总月数、总利息、每笔债清偿时间线与两策略对比，月利率=年利率/12、0.01元定点计算，预算不足自动红色告警，纯浏览器本地计算不上传',
  keywords: '债务还款计划,雪球还款法,雪崩还款法,负债整合计算,提前还债策略,还款计划表,清债计算器',
  author: '有条工具',
  ogTitle: '债务还款计划器 - 雪球法/雪崩法清债策略在线模拟 | 有条工具',
  ogDescription: '多笔债务双策略逐月模拟，总利息与清债时间一屏对比，预算不足自动告警。',
  ogUrl: 'https://www.util.cn/tools/debt-payoff-planner',
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
          name: '债务还款计划器',
          url: 'https://www.util.cn/tools/debt-payoff-planner',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['多笔债务列表编辑（最多 8 笔）', '雪球法 / 雪崩法双策略逐月模拟', '清债总月数与总利息对比', '每笔债清偿月份时间线', '利息差 / 时间差高亮对比条', '月供可行性校验（预算不足红色告警）', '0.01 元定点计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '债务还款计划器', item: 'https://www.util.cn/tools/debt-payoff-planner/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '雪球法和雪崩法哪个省利息？',
              acceptedAnswer: { '@type': 'Answer', text: '雪崩法（先还利率最高的债）在数学上总利息最低或持平，永远不会比雪球更差；雪球法的优势是更快见到「清掉一笔」的心理反馈，更容易坚持。' }
            },
            {
              '@type': 'Question',
              name: '12000 元、年利率 18%、每月还 500，要多久？',
              acceptedAnswer: { '@type': 'Answer', text: '月利率 1.5%，理论期数 n = −ln(1 − 180/500) ÷ ln(1.015) ≈ 30 个月（末期部分还款），总利息约 2988 元。' }
            },
            {
              '@type': 'Question',
              name: '为什么我的最低月供越还越多？',
              acceptedAnswer: { '@type': 'Answer', text: '若最低月供低于当月利息，余额不降反升（负摊销）；该债务需靠预算结余偿还，否则永远还不完。' }
            },
            {
              '@type': 'Question',
              name: '每月预算怎么定才合理？',
              acceptedAnswer: { '@type': 'Answer', text: '预算必须 ≥ Σ最低月供；理想值是「收入 − 刚性支出 − 应急金」后能稳定拿出的最大值，预算越高总利息越低。' }
            },
            {
              '@type': 'Question',
              name: '可以先把高利率债转成低利率债吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以（债务整合），但要注意手续费、提前还款违约金与新贷款期限，整合后不要重新透支旧额度。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 口径约定：全部金额以「分」为整数单位参与运算（0.01 元定点），避免浮点累加误差；
// 月利率 = 年利率 APR ÷ 12（单利简化口径，页面已注明），每月利息 = 余额（分）× apr/1200，四舍五入到分。
// 策略：snowball 余额升序；avalanche 年利率降序（同利率按余额升序）。

const MAX_MONTHS = 600 // 模拟上限（50 年）：仍未清完视为「按当前节奏无法清偿」

// 单一策略模拟：返回 { feasible, reason, months, totalInterest(元), order: [{seq, name, month, interest}], stalled }
function simulatePayoff(debtsInput, budgetYuan, strategy) {
  const list = (Array.isArray(debtsInput) ? debtsInput : [])
    .map((d, idx) => ({
      seq: d && d.id !== undefined ? d.id : idx,
      name: String((d && d.name) || '') || '未命名',
      bal: Math.round((Number(d && d.balance) || 0) * 100),
      apr: Math.max(0, Number(d && d.apr) || 0),
      minPay: Math.round((Number(d && d.minPay) || 0) * 100),
      interestPaid: 0,
      clearedMonth: null
    }))
    .filter((d) => d.bal > 0)

  const budget = Math.round((Number(budgetYuan) || 0) * 100)
  if (!list.length) return { feasible: false, reason: 'empty', months: 0, totalInterest: 0, order: [], stalled: false }

  const sumMin = list.reduce((s, d) => s + Math.min(d.minPay, d.bal), 0)
  if (budget < sumMin) {
    return { feasible: false, reason: 'budget', months: 0, totalInterest: 0, order: [], stalled: false, sumMin }
  }

  // 策略排序：返回当前活跃债务的引用数组
  const orderedActive = (snapshot) => {
    const active = snapshot.filter((d) => d.bal > 0)
    if (strategy === 'avalanche') {
      active.sort((a, b) => b.apr - a.apr || a.bal - b.bal)
    } else {
      active.sort((a, b) => a.bal - b.bal || b.apr - a.apr)
    }
    return active
  }

  let month = 0
  let totalInterestCents = 0
  while (month < MAX_MONTHS) {
    const active = orderedActive(list)
    if (!active.length) break
    month += 1
    // 1) 计息
    for (const d of active) {
      if (d.apr > 0) {
        const interest = Math.round(d.bal * d.apr / 1200)
        d.bal += interest
        d.interestPaid += interest
        totalInterestCents += interest
      }
    }
    // 2) 最低月供
    let available = budget
    for (const d of active) {
      if (available <= 0) break
      const pay = Math.min(d.minPay, d.bal, available)
      if (pay > 0) {
        d.bal -= pay
        available -= pay
      }
    }
    // 3) 结余集中投向策略顺序第一笔（逐笔顺延）
    for (const d of active) {
      if (available <= 0) break
      const pay = Math.min(available, d.bal)
      if (pay > 0) {
        d.bal -= pay
        available -= pay
      }
    }
    // 4) 记录清偿月份
    for (const d of active) {
      if (d.bal === 0 && d.clearedMonth === null) d.clearedMonth = month
    }
  }

  const allCleared = list.every((d) => d.bal === 0)
  const order = list
    .filter((d) => d.clearedMonth !== null)
    .sort((a, b) => a.clearedMonth - b.clearedMonth)
    .map((d) => ({ seq: d.seq, name: d.name, month: d.clearedMonth, interest: d.interestPaid / 100 }))
  return {
    feasible: true,
    reason: 'ok',
    months: allCleared ? month : MAX_MONTHS,
    totalInterest: totalInterestCents / 100,
    order,
    stalled: !allCleared,
    sumMin
  }
}

// 金额展示：千分位 + 固定 2 位小数
function fmtMoney(n) {
  const v = Math.round((Number(n) || 0) * 100) / 100
  const sign = v < 0 ? '-' : ''
  const parts = Math.abs(v).toFixed(2).split('.')
  return sign + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1]
}

// ---------- 页面状态 ----------
let nextId = 1
function makeDebt(name, balance, apr, minPay) {
  return { id: nextId++, name, balance, apr, minPay }
}

const debts = ref([
  makeDebt('信用卡', 12000, 18, 500)
])
const budget = ref(800)

const debtWarnings = computed(() => {
  const warns = []
  for (const d of debts.value) {
    const bal = Number(d.balance) || 0
    const apr = Number(d.apr) || 0
    const minPay = Number(d.minPay) || 0
    if (bal > 0 && apr > 0 && minPay > 0 && minPay < (bal * apr / 1200)) {
      warns.push(`「${d.name}」的最低月供低于其月利息，仅靠最低供永远还不完（负摊销）`)
    }
  }
  return [...new Set(warns)]
})

const inputErrors = computed(() => {
  const errs = []
  for (const d of debts.value) {
    if (!(Number(d.balance) > 0)) errs.push(`「${d.name || '未命名'}」余额需大于 0`)
    if (!(Number(d.minPay) > 0)) errs.push(`「${d.name || '未命名'}」最低月供需大于 0`)
  }
  return [...new Set(errs)]
})

const budgetWarning = computed(() => {
  const b = Number(budget.value) || 0
  const sumMin = debts.value.reduce((s, d) => s + (Number(d.balance) > 0 ? (Number(d.minPay) || 0) : 0), 0)
  if (b <= 0) return '请填写每月总还款预算 B。'
  if (b < sumMin) return `预算不足：每月预算 ${fmtMoney(b)} 元低于各笔最低月供之和 ${fmtMoney(sumMin)} 元，按此预算将无法维持最低还款，债务无法清偿。请提高预算或与银行协商减免 / 展期。`
  return ''
})

const canCalc = computed(() => inputErrors.value.length === 0 && Number(budget.value) > 0)
const feasible = computed(() => canCalc.value && !budgetWarning.value)

const snowball = computed(() => simulatePayoff(debts.value, budget.value, 'snowball'))
const avalanche = computed(() => simulatePayoff(debts.value, budget.value, 'avalanche'))

// 哪个策略省利息 / 更快（严格更优才标胜利，打平显示「持平」）
const snowballWins = computed(() => {
  const s = snowball.value
  const a = avalanche.value
  if (!s.feasible || !a.feasible) return { interest: false, interestTie: true, time: false, timeTie: true }
  return {
    interest: s.totalInterest < a.totalInterest - 0.005,
    interestTie: Math.abs(s.totalInterest - a.totalInterest) <= 0.005,
    time: s.months < a.months,
    timeTie: s.months === a.months
  }
})

const timelineRows = computed(() => {
  const s = snowball.value
  const a = avalanche.value
  return debts.value
    .filter((d) => Number(d.balance) > 0)
    .map((d) => {
      const sItem = (s.order || []).find((x) => x.seq === d.id)
      const aItem = (a.order || []).find((x) => x.seq === d.id)
      return {
        id: d.id,
        name: d.name || '未命名',
        balance: Number(d.balance) || 0,
        apr: Number(d.apr) || 0,
        snowMonth: sItem ? sItem.month : '—',
        avaMonth: aItem ? aItem.month : '—'
      }
    })
})

// 复制结果（navigator.clipboard + alert）
function copyResult() {
  const lines = ['【债务清债双策略模拟】']
  debts.value.forEach((d) => {
    if (Number(d.balance) > 0) lines.push(`· ${d.name || '未命名'}：余额 ${fmtMoney(Number(d.balance) || 0)} 元 / 年利率 ${Number(d.apr) || 0}% / 最低月供 ${fmtMoney(Number(d.minPay) || 0)} 元`)
  })
  lines.push(`每月预算：${fmtMoney(Number(budget.value) || 0)} 元`)
  lines.push(`雪球法：${snowball.value.months} 个月，总利息 ${fmtMoney(snowball.value.totalInterest)} 元（${snowball.value.order.map((x) => x.name).join(' → ')}）`)
  lines.push(`雪崩法：${avalanche.value.months} 个月，总利息 ${fmtMoney(avalanche.value.totalInterest)} 元（${avalanche.value.order.map((x) => x.name).join(' → ')}）`)
  lines.push(`利息差：${fmtMoney(Math.abs(snowball.value.totalInterest - avalanche.value.totalInterest))} 元；时间差：${Math.abs(snowball.value.months - avalanche.value.months)} 个月`)
  lines.push('口径：月利率 = 年利率 ÷ 12 单利简化；仅供参考，以金融机构合同为准。')
  navigator.clipboard.writeText(lines.join('\n')).then(() => alert('已复制')).catch(() => alert('复制失败，请手动复制'))
}

// ---------- 操作 ----------
function addDebt() {
  if (debts.value.length < 8) debts.value.push(makeDebt('', '', '', ''))
}

function removeDebt(i) {
  if (debts.value.length > 1) debts.value.splice(i, 1)
}

function loadExample() {
  debts.value = [
    makeDebt('信用卡（20%）', 10000, 20, 200),
    makeDebt('消费贷（10%）', 8000, 10, 200),
    makeDebt('亲友借款（5%）', 5000, 5, 100)
  ]
  budget.value = 800
}

function resetAll() {
  debts.value = [makeDebt('', '', '', '')]
  budget.value = ''
}

onMounted(() => {
  addRecentTool('debt-payoff-planner')
})
</script>
