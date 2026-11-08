<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Flame class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">阶梯燃气费计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">一 / 二 / 三档年阶梯分档计费，月均用量换算年账单，档量与价格可编辑</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线阶梯燃气费计算器：按户年用气量分三档超额累进计费，输入年用气量（或月均用量 × 12 换算），
        即时给出每档用量 × 单价的分段明细、年总费用与月均费用，并对比「全部按一档价计」的理想账单，
        看清阶梯加价差了多少。内置通用示例档与北京 / 上海 / 广州常见示例（可编辑），附节气小贴士。
        核心算法全部为可独立单测的纯函数，计算在浏览器本地完成，参数暂存本机，不上传任何数据。
      </p>
    </div>

    <!-- 显著口径提示 -->
    <div class="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-2">
      <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
      <p class="text-sm leading-relaxed text-amber-600">
        各市档量与价格不同，以当地燃气公司公示为准。页内城市档量仅为常见公示参考示例（可能随调价变化），请在下方档位设置中核对并修改为本地的实际数字。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Flame class="w-5 h-5 mr-2 text-primary" /> 用气量与档位
        </h2>

        <!-- 城市示例 -->
        <div>
          <label for="gas-city" class="block text-sm font-medium text-foreground mb-2">城市示例（填入后可修改）</label>
          <select
            id="gas-city"
            v-model="cityKey"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="preset in cityPresets" :key="preset.key" :value="preset.key">{{ preset.label }}</option>
          </select>
          <p class="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>仅作填写参考，不构成对现行价格的承诺；请以当地燃气公司最新公示为准</span>
          </p>
        </div>

        <!-- 用量口径 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">用气量口径</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="usageMode = 'year'"
              class="px-3 py-2 rounded-lg border text-sm cursor-pointer transition"
              :class="usageMode === 'year' ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-foreground hover:bg-muted/50'"
            >
              按年用气量
            </button>
            <button
              @click="usageMode = 'month'"
              class="px-3 py-2 rounded-lg border text-sm cursor-pointer transition"
              :class="usageMode === 'month' ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-foreground hover:bg-muted/50'"
            >
              按月均用量 × 12
            </button>
          </div>
          <div class="mt-3">
            <label v-if="usageMode === 'year'" for="gas-annual" class="block text-xs text-muted-foreground mb-1.5">年用气量（m³）</label>
            <input
              v-if="usageMode === 'year'"
              id="gas-annual"
              v-model.number="annualUsageInput"
              type="number"
              min="0"
              step="10"
              placeholder="如 400"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <label v-if="usageMode === 'month'" for="gas-monthly" class="block text-xs text-muted-foreground mb-1.5">月均用气量（m³/月）</label>
            <input
              v-if="usageMode === 'month'"
              id="gas-monthly"
              v-model.number="monthlyUsageInput"
              type="number"
              min="0"
              step="1"
              placeholder="如 33"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p v-if="usageMode === 'month'" class="text-xs text-muted-foreground mt-1.5">
              按月均 {{ fmtQty(monthlyNum) }} m³ × 12 个月 ≈ 年 {{ fmtQty(annualUsage) }} m³ 估算；阶梯按年累计，冬夏用气差异大时仅为近似。
            </p>
          </div>
        </div>

        <!-- 档位设置（可编辑） -->
        <div class="space-y-3 pt-1 border-t border-border">
          <p class="text-sm font-medium text-foreground">档位设置（年阶梯，可编辑）</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="gas-l1" class="block text-xs text-muted-foreground mb-1.5">一档上限（m³，0 至此量）</label>
              <input
                id="gas-l1"
                v-model.number="limit1Input"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label for="gas-p1" class="block text-xs text-muted-foreground mb-1.5">一档价格（元/m³）</label>
              <input
                id="gas-p1"
                v-model.number="price1Input"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label for="gas-l2" class="block text-xs text-muted-foreground mb-1.5">二档上限（m³）</label>
              <input
                id="gas-l2"
                v-model.number="limit2Input"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label for="gas-p2" class="block text-xs text-muted-foreground mb-1.5">二档价格（元/m³）</label>
              <input
                id="gas-p2"
                v-model.number="price2Input"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <p class="block text-xs text-muted-foreground mb-1.5">三档区间</p>
              <p class="px-3 py-2 bg-muted/60 border border-border rounded-lg text-sm text-muted-foreground text-right">{{ fmtQty(normLimits[1]) }} m³ 以上</p>
            </div>
            <div>
              <label for="gas-p3" class="block text-xs text-muted-foreground mb-1.5">三档价格（元/m³）</label>
              <input
                id="gas-p3"
                v-model.number="price3Input"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>阶梯为超额累进：每档只对「段内气量」按该档单价计费，不是全量按高档价。若二档上限小于一档上限，将自动按一档上限处理。</span>
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

      <!-- 右侧：结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 年账单测算
        </h2>

        <!-- 结论卡：年总费用（特大） -->
        <div class="bg-primary/10 rounded-lg p-5 text-center">
          <p class="text-xs text-muted-foreground mb-1">年燃气费合计（按 {{ usageMode === 'year' ? '年用气量' : '月均用量 × 12' }} 口径）</p>
          <p class="text-4xl sm:text-5xl font-bold text-primary leading-tight break-all">
            {{ formatMoney2(breakdown.total) }}<span class="text-base font-normal text-muted-foreground ml-1.5">元</span>
          </p>
          <p class="text-xs text-muted-foreground mt-2">
            年用气 {{ fmtQty(breakdown.usage) }} m³ · 月均费用约 {{ formatMoney2(monthlyAvgCost) }} 元
          </p>
        </div>

        <!-- 小卡：总用气量 / 月均用气量 / 月均费用 -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground mb-1">年用气量</p>
            <p class="text-lg font-bold text-foreground">{{ fmtQty(breakdown.usage) }}<span class="text-xs font-normal text-muted-foreground ml-1">m³</span></p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground mb-1">月均用气</p>
            <p class="text-lg font-bold text-foreground">{{ fmtQty(breakdown.usage / 12) }}<span class="text-xs font-normal text-muted-foreground ml-1">m³</span></p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground mb-1">月均费用</p>
            <p class="text-lg font-bold text-foreground">{{ formatMoney2(monthlyAvgCost) }}<span class="text-xs font-normal text-muted-foreground ml-1">元</span></p>
          </div>
        </div>

        <!-- 分段计费明细表 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-foreground">分段计费明细</h3>
            <span class="text-xs text-muted-foreground">单位：元 / m³</span>
          </div>
          <div class="overflow-x-auto rounded-lg border border-border">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-muted/50 text-muted-foreground">
                  <th class="px-3 py-2 text-left font-medium">档位</th>
                  <th class="px-3 py-2 text-left font-medium">年用气量区间</th>
                  <th class="px-3 py-2 text-right font-medium">本档用量</th>
                  <th class="px-3 py-2 text-right font-medium">单价</th>
                  <th class="px-3 py-2 text-right font-medium">本档金额</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="row in tierRows" :key="row.key" :class="row.qty > 0 ? '' : 'opacity-50'">
                  <td class="px-3 py-2 text-foreground" :class="row.qty > 0 ? 'font-semibold' : ''">{{ row.label }}</td>
                  <td class="px-3 py-2 text-muted-foreground whitespace-nowrap">{{ row.rangeText }}</td>
                  <td class="px-3 py-2 text-right font-mono text-foreground">{{ fmtQty(row.qty) }} m³</td>
                  <td class="px-3 py-2 text-right font-mono text-foreground">{{ row.price.toFixed(2) }}</td>
                  <td class="px-3 py-2 text-right font-mono text-foreground font-semibold">{{ formatMoney2(row.amount) }}</td>
                </tr>
                <tr class="bg-primary/5">
                  <td class="px-3 py-2 font-semibold text-foreground">合计</td>
                  <td class="px-3 py-2 text-muted-foreground">—</td>
                  <td class="px-3 py-2 text-right font-mono text-foreground font-semibold">{{ fmtQty(breakdown.usage) }} m³</td>
                  <td class="px-3 py-2 text-right text-muted-foreground">—</td>
                  <td class="px-3 py-2 text-right font-mono text-primary font-bold">{{ formatMoney2(breakdown.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 对比小卡：阶梯「惩罚」可视化 -->
        <div class="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
          <h3 class="text-sm font-semibold text-foreground">对比：如果全部按一档价计</h3>
          <template v-if="stepPenalty > 0.005">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-background border border-border rounded-lg p-3 text-center">
                <p class="text-xs text-muted-foreground mb-1">全部按一档 {{ fmtPrice(price1Num) }} 元/m³</p>
                <p class="text-xl font-bold text-foreground">{{ formatMoney2(flatCost) }}<span class="text-xs font-normal text-muted-foreground ml-1">元</span></p>
              </div>
              <div class="bg-background border border-amber-500/30 rounded-lg p-3 text-center">
                <p class="text-xs text-muted-foreground mb-1">阶梯实际多收</p>
                <p class="text-xl font-bold text-amber-600">+{{ formatMoney2(stepPenalty) }}<span class="text-xs font-normal text-muted-foreground ml-1">元</span></p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              超出一档的 {{ fmtQty(overTier1Usage) }} m³ 按更高档价计费，比全按一档价多 {{ penaltyPctText }}——这就是阶梯气价「用得越多、越往后越贵」的加价部分。
            </p>
          </template>
          <p v-else class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-green-600" />
            <span>当前年用气量未超一档上限（{{ fmtQty(normLimits[0]) }} m³），全部按一档价计费，暂无阶梯加价。</span>
          </p>
        </div>

        <!-- 节气提示 -->
        <div class="rounded-lg border border-border p-4">
          <h3 class="text-sm font-semibold text-foreground mb-2">节气小贴士</h3>
          <ul class="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <li class="flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
              <span><span class="text-foreground">热水器温度设置</span>：燃气热水器出水温度设 40–45°C 够用即可，设定越高混冷水越多、管路散热损耗越大；冬季壁挂炉采暖建议 18–20°C，每调高 1°C 都明显多耗气。</span>
            </li>
            <li class="flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
              <span><span class="text-foreground">灶具火焰颜色</span>：正常火焰应为蓝色；火焰发黄、发红说明燃烧不充分（多为风门失调或灶头积碳），既费气又有一氧化碳隐患，可调节风门或清理灶头火孔。</span>
            </li>
            <li class="flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
              <span><span class="text-foreground">用气习惯</span>：煮炖类盖紧锅盖中小火即可，水开后转小火；定期检查燃气软管老化，既安全也避免慢漏多计气量。</span>
            </li>
          </ul>
        </div>

        <!-- 免责声明（固定） -->
        <p class="text-[11px] leading-relaxed text-muted-foreground/80 border-t border-border pt-3">
          {{ DISCLAIMER }}
        </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>阶梯燃气费计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          阶梯燃气费计算器是一款按「超额累进」口径拆解燃气账单的在线工具。多数城市把居民管道天然气按<span class="text-foreground">户年用气量</span>分为三档：
          一档覆盖基本炊事与生活热水用量、价格最低，二档、三档依次上浮。你只需输入年用气量（或月均用量 × 12 换算），
          工具会把气量切到各档内，逐段给出「本档用量 × 本档单价」的明细表，再汇总年总费用与月均费用；
          同时对比「全部按一档价计」的理想账单，直观看到阶梯加价差了多少。
          页面内置通用示例档与北京 / 上海 / 广州常见示例，档量与价格全部可编辑——
          <span class="text-foreground">各市档量与价格不同，请以当地燃气公司公示为准</span>。
          全部计算在浏览器本地完成，参数暂存本机 localStorage，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么时候会用到？</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed mb-4">
          <li><strong class="text-foreground">看懂账单</strong>：账单金额和「用量 × 单价」对不上时，多半是阶梯加价在起作用，用分段明细逐档核对。</li>
          <li><strong class="text-foreground">预估年账单</strong>：换季或搬新家前，按月均用量 × 12 估算全年气费与月均开支。</li>
          <li><strong class="text-foreground">判断是否越档</strong>：看年用量离二档、三档上限还差多少，心里有数再安排采暖、热水器的使用强度。</li>
          <li><strong class="text-foreground">找节气空间</strong>：结合节气小贴士，把用量压回低档位，省的就是档位差价。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">阶梯气价怎么算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          阶梯气价是「超额累进」：把年用气量切成几段，每段只用自己段内的单价，各段金额相加即年总费用。
          以通用示例档（一档 0–300 m³ @2.6 元、二档 300–600 m³ @2.8 元、三档 600 m³ 以上 @3.3 元）为例：
          年用 400 m³ → 300 × 2.6 + 100 × 2.8 = 1,060.00 元；
          年用 660 m³ → 300 × 2.6 + 300 × 2.8 + 60 × 3.3 = 780 + 840 + 198 = 1,818.00 元。
          注意不是「全量按高档价」，也不是「全量按均价」，只是超出部分按高档单价计费。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed">
          月均用量口径：月均 × 12 折算为年用量后再分档。阶梯按「年」累计，但冬夏用气差异大的家庭（如冬季壁挂炉采暖），
          简单按月均折算可能与真实累计有偏差，结果仅作参考。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div v-for="(faq, index) in faqs" :key="index">
            <h3 class="text-base font-semibold text-foreground">{{ faq.q }}</h3>
            <p class="text-sm text-muted-foreground mt-1">{{ faq.a }}</p>
          </div>
        </div>

        <p class="text-xs leading-relaxed text-muted-foreground/80 border-t border-border mt-8 pt-3">
          {{ DISCLAIMER }}
        </p>
      </div>
    </div>

    <RelatedTools :currentToolId="'gas-bill-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Flame, Calculator, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const DISCLAIMER = '页内档量与价格仅为常见公示参考示例，可能随调价变化，实际以当地燃气公司公示为准；本页为数学演算，不构成任何收费依据。'

// ---------- FAQ（页面 SEO 区与 JSON-LD FAQPage 共用） ----------
const faqs = [
  {
    q: '阶梯燃气费怎么算？',
    a: '超额累进：把年用气量按档量切段，每段只按自己段内的单价计费，再相加。例：一档 0–300 m³ @2.6 元、二档 300–600 @2.8 元、三档 600 以上 @3.3 元时，年用 400 m³ = 300 × 2.6 + 100 × 2.8 = 1,060.00 元。'
  },
  {
    q: '为什么我的账单和算出来的不一样？',
    a: '常见原因：抄表 / 结算周期与自然年不完全对齐，阶梯按燃气公司的结算年度执行；账单内可能还包含表具维护等代收项目；一户多人口家庭可申请增加气量基数；预付费 IC 卡表按购气时点计档。请以当地燃气公司规则为准。'
  },
  {
    q: '一档、二档、三档是什么意思？',
    a: '按户年用气量划分的三档气量区间：一档覆盖基本生活用气、价格最低；二档、三档为超出的部分，单价依次上浮（常见二档约为 1.2 倍、三档约 1.5 倍）。各市档量与价格差异较大，请以当地燃气公司公示为准。'
  },
  {
    q: '月均用量怎么换算成年用量？',
    a: '月均用量 × 12 即为年用量估算。本工具的「按月均用量 × 12」口径就是这个换算；但阶梯按年累计，冬夏用气差异大的家庭（如冬季采暖）月均折算只是近似，更准的办法是看燃气公司年度累计用气量。'
  },
  {
    q: '哪里查当地的档量和价格？',
    a: '最可靠的三条路：当地燃气公司官网或营业厅公示、燃气费账单附页的价格说明、以及 12345 / 发改委价格公示目录。本页内置的通用示例档与北京、上海、广州示例仅供填写参考，使用前请核对并修改为本地的实际数字。'
  }
]

// ---------- SEO ----------
useSeoMeta({
  title: '阶梯燃气费计算器 - 分档气价年账单与月均在线测算 | 有条工具',
  description: '免费在线阶梯燃气费计算器：一/二/三档年阶梯超额累进分档计费，输入年用气量或月均用量×12，逐档给出用量×单价明细、年总费用与月均费用，对比全按一档价差多少；档量价格可编辑，附北京上海广州示例与节气贴士，本地运行不上传',
  keywords: '燃气费计算,阶梯气价,天然气价格,燃气费怎么算,燃气账单',
  author: '有条工具',
  ogTitle: '阶梯燃气费计算器 - 分档气价年账单与月均在线测算 | 有条工具',
  ogDescription: '一/二/三档年阶梯分档计费，月均用量换算年账单，当地档量价格可编辑。',
  ogUrl: 'https://www.util.cn/tools/gas-bill-calculator',
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
          name: '阶梯燃气费计算器',
          url: 'https://www.util.cn/tools/gas-bill-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['一二三档年阶梯超额累进分档计费', '年用气量 / 月均用量×12 双口径', '分段计费明细表（每档用量×单价）', '年总费用与月均费用', '全按一档价对比（阶梯加价可视化）', '档量与价格可编辑，附北京/上海/广州示例', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '阶梯燃气费', item: 'https://www.util.cn/tools/gas-bill-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a }
          }))
        }
      ]
    })
  }]
})

/* ==== 纯函数（node 自测提取区）begin ==== */
// 约定：气量单位 m³，金额单位元；档量 l1/l2 为年用气量分界；价格单位 元/m³。
// 本区不依赖 Vue / 浏览器 API，可原样抽入测试。

// 输入归一化：非有限数按 0
function numOr0(v) {
  const n = Number(v)
  return isFinite(n) ? n : 0
}

// 档量归一化：l1 = max(l1, 0)，l2 = max(l2, l1)，保证二档区间非负（二档上限小于一档时退化为一档直接跳三档）
function normalizedLimits(l1, l2) {
  const a = Math.max(numOr0(l1), 0)
  const b = Math.max(numOr0(l2), a)
  return [a, b]
}

// 阶梯分档计费（超额累进）：每段只对段内气量按该档单价计费。
// 返回 { limits:[l1,l2], rows:[{key,from,to,toOpen,qty,price,amount}], usage, total }
function tierBreakdown(usage, l1, l2, p1, p2, p3) {
  const u = Math.max(0, numOr0(usage))
  const [a, b] = normalizedLimits(l1, l2)
  const r1 = Math.max(0, numOr0(p1))
  const r2 = Math.max(0, numOr0(p2))
  const r3 = Math.max(0, numOr0(p3))
  const q1 = Math.min(u, a)
  const q2 = Math.min(Math.max(u - a, 0), b - a)
  const q3 = Math.max(u - b, 0)
  const rows = [
    { key: 't1', from: 0, to: a, toOpen: false, qty: q1, price: r1, amount: q1 * r1 },
    { key: 't2', from: a, to: b, toOpen: false, qty: q2, price: r2, amount: q2 * r2 },
    { key: 't3', from: b, to: null, toOpen: true, qty: q3, price: r3, amount: q3 * r3 }
  ]
  const total = rows.reduce((s, r) => s + r.amount, 0)
  return { limits: [a, b], rows, usage: u, total }
}

// 「全部按一档价」的理想账单，用于阶梯加价对比
function flatFirstTierCost(usage, p1) {
  return Math.max(0, numOr0(usage)) * Math.max(0, numOr0(p1))
}

// 月均用量 → 年用量（×12）
function annualUsageFromMonthly(m) {
  return Math.max(0, numOr0(m)) * 12
}

// 自测断言集（锚点两例 / 档内 / 跨三档 / 边界 / 负数 / 非法档量 / 价格异常）
function runGasBillSelfTests() {
  const t = []
  const eq = (name, got, want, tol) => {
    const e = typeof tol === 'number' ? tol : 1e-9
    const ok = (got === null || want === null) ? got === want : Math.abs(got - want) <= e
    t.push({ name, got, want, pass: ok })
  }
  const mk = (usage) => tierBreakdown(usage, 300, 600, 2.6, 2.8, 3.3)
  // 锚点一：年 400 m³ → 300×2.6 + 100×2.8 = 1060.00
  const a1 = mk(400)
  eq('锚点1·年总费用 1060.00', a1.total, 1060)
  eq('锚点1·一档用量 300', a1.rows[0].qty, 300)
  eq('锚点1·一档金额 780', a1.rows[0].amount, 780)
  eq('锚点1·二档用量 100', a1.rows[1].qty, 100)
  eq('锚点1·二档金额 280', a1.rows[1].amount, 280)
  eq('锚点1·三档用量 0', a1.rows[2].qty, 0)
  // 锚点二：年 660 m³ → 780 + 840 + 60×3.3 = 1818.00
  const a2 = mk(660)
  eq('锚点2·年总费用 1818.00', a2.total, 1818)
  eq('锚点2·三档用量 60', a2.rows[2].qty, 60)
  eq('锚点2·三档金额 198', a2.rows[2].amount, 198)
  eq('锚点2·二档金额 840', a2.rows[1].amount, 840)
  // 档内：250 m³ 全在一档
  const a3 = mk(250)
  eq('档内·250m³ 总费用 650', a3.total, 650)
  eq('档内·250m³ 二档用量 0', a3.rows[1].qty, 0)
  // 边界：300 整 / 600 整
  eq('边界·300整 一档封顶 780', mk(300).total, 780)
  eq('边界·300整 二档用量 0', mk(300).rows[1].qty, 0)
  eq('边界·600整 780+840=1620', mk(600).total, 1620)
  eq('边界·600整 三档用量 0', mk(600).rows[2].qty, 0)
  // 跨三档：800 → 780 + 840 + 200×3.3 = 2280
  eq('跨三档·800m³ 总费用 2280', mk(800).total, 2280)
  // 负数 / 零
  eq('负数·-50m³ 归 0', mk(-50).total, 0)
  eq('零·0m³ 总费用 0', mk(0).total, 0)
  // 月均换算与月均费用
  eq('月均·33.33×12≈400m³', annualUsageFromMonthly(400 / 12), 400)
  eq('月均·1060/12 月均费用 88.33', 1060 / 12, 88.333333, 0.001)
  // 对比：全按一档价的差额
  eq('对比·400m³ 全一档 1040', flatFirstTierCost(400, 2.6), 1040)
  eq('对比·400m³ 阶梯多收 20', mk(400).total - flatFirstTierCost(400, 2.6), 20)
  eq('对比·660m³ 阶梯多收 102', mk(660).total - flatFirstTierCost(660, 2.6), 102)
  // 非法档量：二档上限 < 一档上限 → 退化处理
  const bad = tierBreakdown(600, 500, 300, 2.6, 2.8, 3.3)
  eq('非法档量·l2<l1 退化后一档 500', bad.limits[0], 500)
  eq('非法档量·退化后总费 1300+330', bad.total, 1630)
  // 价格异常：NaN → 0
  eq('异常·一档价 NaN 归 0', tierBreakdown(400, 300, 600, NaN, 2.8, 3.3).total, 280)
  return t
}
/* ==== 纯函数（node 自测提取区）end ==== */

// ---------- 城市示例（参考口径，可编辑，不构成承诺） ----------
const cityPresets = [
  { key: 'general', label: '通用示例档（300/600，2.60/2.80/3.30）', l1: 300, l2: 600, p1: 2.6, p2: 2.8, p3: 3.3 },
  { key: 'beijing', label: '北京示例（350/500，2.61/2.83/4.25）', l1: 350, l2: 500, p1: 2.61, p2: 2.83, p3: 4.25 },
  { key: 'shanghai', label: '上海示例（310/520，3.00/3.30/4.20）', l1: 310, l2: 520, p1: 3.0, p2: 3.3, p3: 4.2 },
  { key: 'guangzhou', label: '广州示例（320/400，3.45/4.14/5.18）', l1: 320, l2: 400, p1: 3.45, p2: 4.14, p3: 5.18 }
]

// ---------- 输入状态 ----------
// 隐私说明：用量与档价仅暂存本机 localStorage，不上传；读写全程 try/catch，
// 浏览器 API 只在 onMounted 与事件回调内使用，SSR 安全。
const STORAGE_KEY = 'util-gas-bill-calculator'
const DEFAULTS = { mode: 'year', annual: 400, monthly: 33, l1: 300, p1: 2.6, l2: 600, p2: 2.8, p3: 3.3, city: 'general' }
const EXAMPLE = { mode: 'year', annual: 400, monthly: 33, l1: 300, p1: 2.6, l2: 600, p2: 2.8, p3: 3.3, city: 'general' }

const usageMode = ref(EXAMPLE.mode)
const annualUsageInput = ref(EXAMPLE.annual)
const monthlyUsageInput = ref(EXAMPLE.monthly)
const limit1Input = ref(EXAMPLE.l1)
const price1Input = ref(EXAMPLE.p1)
const limit2Input = ref(EXAMPLE.l2)
const price2Input = ref(EXAMPLE.p2)
const price3Input = ref(EXAMPLE.p3)
const cityKey = ref(EXAMPLE.city)
const seoContentVisible = ref(true)

// ---------- 归一化 ----------
const annualUsage = computed(() => (
  usageMode.value === 'year'
    ? Math.max(0, numOr0(annualUsageInput.value))
    : annualUsageFromMonthly(monthlyUsageInput.value)
))
const monthlyNum = computed(() => Math.max(0, numOr0(monthlyUsageInput.value)))
const price1Num = computed(() => Math.max(0, numOr0(price1Input.value)))

// ---------- 核心计算 ----------
const breakdown = computed(() => tierBreakdown(
  annualUsage.value,
  limit1Input.value, limit2Input.value,
  price1Input.value, price2Input.value, price3Input.value
))
const normLimits = computed(() => normalizedLimits(limit1Input.value, limit2Input.value))
const monthlyAvgCost = computed(() => breakdown.value.total / 12)

// 明细表行（区间文案在视图层拼装，纯函数只出数字）
const tierRows = computed(() => breakdown.value.rows.map((row) => ({
  ...row,
  rangeText: row.toOpen
    ? `${fmtQty(row.from)} m³ 以上`
    : `${fmtQty(row.from)}–${fmtQty(row.to)} m³`
})))

// 对比：全按一档价 vs 阶梯实际
const flatCost = computed(() => flatFirstTierCost(annualUsage.value, price1Input.value))
const stepPenalty = computed(() => breakdown.value.total - flatCost.value)
const overTier1Usage = computed(() => Math.max(0, annualUsage.value - normLimits.value[0]))
const penaltyPctText = computed(() => {
  if (flatCost.value <= 0) return '—'
  return `${((stepPenalty.value / flatCost.value) * 100).toFixed(2)}%`
})

// ---------- 格式化 ----------
function formatMoney2(v) {
  const n = Number(v)
  if (!isFinite(n)) return '—'
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtQty(v) {
  const n = Number(v)
  if (!isFinite(n)) return '0'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}
function fmtPrice(v) {
  const n = Number(v)
  if (!isFinite(n)) return '0.00'
  return n.toFixed(2)
}

// ---------- 输入越界提示 ----------
const inputWarning = computed(() => {
  const checks = [
    [usageMode.value === 'year' ? annualUsageInput.value : monthlyUsageInput.value, 0, Infinity],
    [limit1Input.value, 0, Infinity],
    [limit2Input.value, 0, Infinity],
    [price1Input.value, 0, Infinity],
    [price2Input.value, 0, Infinity],
    [price3Input.value, 0, Infinity]
  ]
  const bad = checks.some(([v, min, max]) => {
    if (v === '' || v === null || v === undefined) return false
    const n = Number(v)
    return !isFinite(n) || n < min || n > max
  })
  return bad ? '部分输入超出允许范围，已按 0 参与计算（用量、档量与价格需为非负数）。' : ''
})

// ---------- 操作 ----------
function applyPreset(key) {
  const preset = cityPresets.find((p) => p.key === key)
  if (!preset) return
  limit1Input.value = preset.l1
  limit2Input.value = preset.l2
  price1Input.value = preset.p1
  price2Input.value = preset.p2
  price3Input.value = preset.p3
}

function loadExample() {
  usageMode.value = EXAMPLE.mode
  annualUsageInput.value = EXAMPLE.annual
  monthlyUsageInput.value = EXAMPLE.monthly
  cityKey.value = EXAMPLE.city
  applyPreset(EXAMPLE.city)
}

function resetAll() {
  usageMode.value = DEFAULTS.mode
  annualUsageInput.value = DEFAULTS.annual
  monthlyUsageInput.value = DEFAULTS.monthly
  cityKey.value = DEFAULTS.city
  applyPreset(DEFAULTS.city)
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 本机持久化（SSR 安全，try/catch） ----------
function saveState() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: usageMode.value,
      annual: annualUsageInput.value,
      monthly: monthlyUsageInput.value,
      l1: limit1Input.value,
      p1: price1Input.value,
      l2: limit2Input.value,
      p2: price2Input.value,
      p3: price3Input.value,
      city: cityKey.value
    }))
  } catch (e) { /* 隐私模式 / 配额溢出，忽略 */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const s = JSON.parse(raw)
    if (!s || typeof s !== 'object') return
    if (s.mode === 'year' || s.mode === 'month') usageMode.value = s.mode
    if (typeof s.annual === 'number') annualUsageInput.value = s.annual
    if (typeof s.monthly === 'number') monthlyUsageInput.value = s.monthly
    if (typeof s.l1 === 'number') limit1Input.value = s.l1
    if (typeof s.p1 === 'number') price1Input.value = s.p1
    if (typeof s.l2 === 'number') limit2Input.value = s.l2
    if (typeof s.p2 === 'number') price2Input.value = s.p2
    if (typeof s.p3 === 'number') price3Input.value = s.p3
    if (cityPresets.some((p) => p.key === s.city)) cityKey.value = s.city
  } catch (e) { /* 解析失败，保持默认 */ }
}

watch(
  [usageMode, annualUsageInput, monthlyUsageInput, limit1Input, price1Input, limit2Input, price2Input, price3Input],
  () => saveState()
)

onMounted(() => {
  loadState()
  addRecentTool('gas-bill-calculator')
  // 城市示例切换：仅在用户主动操作时填充档位（loadState 已恢复用户自己的档位）
  watch(cityKey, (key) => applyPreset(key), { flush: 'post' })
  // 纯函数自测（锚点 / 档内 / 跨三档 / 边界 / 负数 / 非法档量 / 异常价格），仅控制台输出
  const results = runGasBillSelfTests()
  const failed = results.filter((r) => !r.pass)
  if (failed.length > 0) {
    console.warn(`[gas-bill-calculator] 自测 ${failed.length}/${results.length} 条未通过`, failed)
  } else {
    console.info(`[gas-bill-calculator] 自测通过 ${results.length}/${results.length} 条断言`)
  }
})
</script>
