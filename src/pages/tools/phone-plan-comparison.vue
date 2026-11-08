<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Smartphone class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">话费套餐对比</h1>
          <p class="text-sm text-muted-foreground mt-1">两套套餐按实际用量算月费，超出单价差异年度化，还有流量等价点分析，换套餐不再拍脑袋</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        只看月租比套餐很容易被骗：月租 59 元含 30GB 的套餐，用量一大就按超出单价往上加钱，未必比 79 元的大流量套餐便宜。
        本工具把两套套餐的「月租 + 免费流量/通话额度 + 超出单价」和你的实际月用量填进来，算出各自真实月费、差额与年度化差额，
        并给出流量维度的等价点（交点）分析——用量在交点之下选谁、之上选谁一目了然。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="space-y-6">
        <!-- 套餐 A -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Smartphone class="w-5 h-5 mr-2 text-primary" /> 套餐 A
          </h2>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">月租（元/月）</label>
              <input
                v-model.number="aRentInput"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">免费流量（GB）</label>
              <input
                v-model.number="aGbInput"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p class="text-xs text-muted-foreground mt-1.5">填通用流量，定向流量别算进来</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">流量超出（元/GB）</label>
              <input
                v-model.number="aOverGbInput"
                type="number"
                min="0"
                step="0.5"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">免费通话（分钟）</label>
              <input
                v-model.number="aMinInput"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">通话超出（元/分钟）</label>
              <input
                v-model.number="aOverMinInput"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <!-- 套餐 B -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Smartphone class="w-5 h-5 mr-2 text-primary" /> 套餐 B
          </h2>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">月租（元/月）</label>
              <input
                v-model.number="bRentInput"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">免费流量（GB）</label>
              <input
                v-model.number="bGbInput"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p class="text-xs text-muted-foreground mt-1.5">填通用流量，定向流量别算进来</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">流量超出（元/GB）</label>
              <input
                v-model.number="bOverGbInput"
                type="number"
                min="0"
                step="0.5"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">免费通话（分钟）</label>
              <input
                v-model.number="bMinInput"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">通话超出（元/分钟）</label>
              <input
                v-model.number="bOverMinInput"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <!-- 实际用量 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> 实际月用量
          </h2>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">月流量（GB）</label>
              <input
                v-model.number="usageGbInput"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p class="text-xs text-muted-foreground mt-1.5">按运营商 App 月度账单填，取近 3 个月平均更稳</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">月通话（分钟）</label>
              <input
                v-model.number="usageMinInput"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p class="text-xs text-muted-foreground mt-1.5">套餐外主叫分钟数，以账单为准</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              @click="loadExample"
              class="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5"
            >
              <Play class="w-4 h-4" /> 载入示例
            </button>
            <button
              @click="resetInputs"
              class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border text-foreground rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw class="w-4 h-4" /> 重置
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：结果 -->
      <div class="space-y-6">
        <!-- 月费对比 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Scale class="w-5 h-5 mr-2 text-primary" /> 月费对比
          </h2>

          <template v-if="canCompute">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-lg p-4 text-center border border-border">
                <p class="text-xs text-muted-foreground mb-1">套餐 A 月费</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ fmtNum(feeA) }}<span class="text-sm font-medium"> 元</span></p>
                <span
                  v-if="conclusion === 'A'"
                  class="inline-block mt-2 px-2 py-0.5 rounded-full border text-[10px] font-medium bg-green-500/10 text-green-600 border-green-500/20"
                >更省</span>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center border border-border">
                <p class="text-xs text-muted-foreground mb-1">套餐 B 月费</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ fmtNum(feeB) }}<span class="text-sm font-medium"> 元</span></p>
                <span
                  v-if="conclusion === 'B'"
                  class="inline-block mt-2 px-2 py-0.5 rounded-full border text-[10px] font-medium bg-green-500/10 text-green-600 border-green-500/20"
                >更省</span>
              </div>
            </div>

            <div v-if="conclusionBadge" class="text-center">
              <span
                class="inline-block px-3 py-1 rounded-full border text-xs font-medium"
                :class="conclusionBadge.chipClass"
              >{{ conclusionBadge.label }}</span>
              <p class="text-xs text-muted-foreground mt-2">{{ conclusionBadge.desc }}</p>
            </div>

            <div class="bg-primary/10 rounded-lg p-6 text-center">
              <p class="text-xs text-muted-foreground mb-1">年度化差额（月费差额 × 12）</p>
              <p class="text-5xl font-bold text-primary leading-none">{{ fmtNum(annualDiff === null ? null : Math.abs(annualDiff)) }}</p>
              <p class="text-sm font-medium text-primary mt-2">元/年</p>
              <p v-if="annualText" class="text-xs text-muted-foreground mt-2">{{ annualText }}</p>
            </div>
          </template>
          <p v-else class="text-sm text-muted-foreground">请先填写两套套餐的月租与免费额度。</p>

          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>口径：月费 = 月租 + max(0, 流量用量 − 免费流量) × 流量超出单价 + max(0, 通话用量 − 免费通话) × 通话超出单价；免费额度内月费即月租。</span>
          </p>
        </div>

        <!-- 费用拆解 -->
        <div v-if="canCompute" class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 月费拆解（按当前用量）
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">项目</th>
                  <th class="py-2 pr-3 font-medium text-right">套餐 A</th>
                  <th class="py-2 font-medium text-right">套餐 B</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border/50">
                  <td class="py-2 pr-3 text-muted-foreground whitespace-nowrap">月租</td>
                  <td class="py-2 pr-3 text-right text-foreground font-mono">{{ fmtNum(planA.rent) }}</td>
                  <td class="py-2 text-right text-foreground font-mono">{{ fmtNum(planB.rent) }}</td>
                </tr>
                <tr class="border-b border-border/50">
                  <td class="py-2 pr-3 text-muted-foreground whitespace-nowrap">流量超出费</td>
                  <td class="py-2 pr-3 text-right">
                    <span class="font-mono" :class="aBreakdown.dataOver > 0 ? 'text-red-600' : 'text-foreground'">{{ fmtNum(aBreakdown.dataOver) }}</span>
                    <span class="block text-[10px] text-muted-foreground">{{ aBreakdown.dataOverText }}</span>
                  </td>
                  <td class="py-2 text-right">
                    <span class="font-mono" :class="bBreakdown.dataOver > 0 ? 'text-red-600' : 'text-foreground'">{{ fmtNum(bBreakdown.dataOver) }}</span>
                    <span class="block text-[10px] text-muted-foreground">{{ bBreakdown.dataOverText }}</span>
                  </td>
                </tr>
                <tr class="border-b border-border/50">
                  <td class="py-2 pr-3 text-muted-foreground whitespace-nowrap">通话超出费</td>
                  <td class="py-2 pr-3 text-right">
                    <span class="font-mono" :class="aBreakdown.callOver > 0 ? 'text-red-600' : 'text-foreground'">{{ fmtNum(aBreakdown.callOver) }}</span>
                    <span class="block text-[10px] text-muted-foreground">{{ aBreakdown.callOverText }}</span>
                  </td>
                  <td class="py-2 text-right">
                    <span class="font-mono" :class="bBreakdown.callOver > 0 ? 'text-red-600' : 'text-foreground'">{{ fmtNum(bBreakdown.callOver) }}</span>
                    <span class="block text-[10px] text-muted-foreground">{{ bBreakdown.callOverText }}</span>
                  </td>
                </tr>
                <tr>
                  <td class="py-2 pr-3 font-medium text-foreground whitespace-nowrap">月费合计</td>
                  <td class="py-2 pr-3 text-right font-bold text-foreground font-mono">{{ fmtNum(feeA) }}</td>
                  <td class="py-2 text-right font-bold text-foreground font-mono">{{ fmtNum(feeB) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 交叉点分析 -->
        <div v-if="canCompute && crossoverInfo" class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ArrowRightLeft class="w-5 h-5 mr-2 text-primary" /> 等价点分析：用量多少时两套餐一样贵
          </h2>
          <div class="bg-muted/50 rounded-lg p-5 text-center border border-border">
            <p class="text-xs text-muted-foreground mb-1">流量等价点（两套餐月费相等的用量）</p>
            <p class="text-3xl font-bold text-primary">{{ crossoverInfo.headline }}</p>
          </div>
          <p class="text-sm text-muted-foreground leading-relaxed">{{ crossoverInfo.text }}</p>
          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>求交口径：月费(x) = 月租 + max(0, x − 免费流量) × 流量超出单价，仅按流量维度线性求解；通话差额未计入，最终结论以月费对比为准。</span>
          </p>
        </div>

        <!-- 诚实卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <TriangleAlert class="w-5 h-5 mr-2 text-amber-600" /> 诚实卡：这些条款算不进模型
          </h2>
          <div class="space-y-3">
            <div class="flex items-start gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
              <p class="text-xs text-muted-foreground leading-relaxed">
                <span class="text-foreground font-medium">定向流量不是通用流量：</span>很多「大流量」套餐的大头是定向 App 流量，微信、抖音之外的场景照样按通用流量计费，免费流量请只填通用部分，超出单价以账单为准。
              </p>
            </div>
            <div class="flex items-start gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></span>
              <p class="text-xs text-muted-foreground leading-relaxed">
                <span class="text-red-600 font-medium">先看合约违约金再换：</span>合约期内提前解约或降档可能要交违约金，把违约金摊进月费差额里，看几个月才能「回本」，再决定换不换——本工具算不出违约金。
              </p>
            </div>
            <div class="flex items-start gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
              <p class="text-xs text-muted-foreground leading-relaxed">
                <span class="text-foreground font-medium">副卡与增值服务没算进模型：</span>副卡月功能费、彩铃、视频会员等固定费用，请手动加进对应套餐的月租里再对比。
              </p>
            </div>
            <div class="flex items-start gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
              <p class="text-xs text-muted-foreground leading-relaxed">
                <span class="text-foreground font-medium">优惠期价格不是长期价：</span>前 6-12 个月的折扣价到期会跳回原价，按合约期结束后的原价对比才靠得住。
              </p>
            </div>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>话费套餐对比是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          话费套餐对比是一款按「实际用量」算账的套餐比较工具：分别填入两套套餐的月租、免费流量（GB）、流量超出单价、免费通话分钟数与通话超出单价，
          再填入你每月实际使用的流量与通话分钟，工具按「月费 = 月租 + 超出流量 × 单价 + 超出通话 × 单价」算出两套套餐的真实月费、
          月费差额与年度化差额（差额 × 12），并给出结论徽章（A 更省 / B 更省 / 持平）；还提供流量维度的等价点分析——
          解出两套餐月费相等的用量交点，用量在交点之下与之上分别选哪套更省一目了然。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">适用场景</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-4">
          <li>老套餐要涨价/到期，纠结换不换：按自己近 3 个月平均用量算一算，月费差乘 12 看一年差多少</li>
          <li>营业厅推荐「大流量套餐」：先算等价点，看自己用量在交点之上还是之下，别为用不到的流量多掏月租</li>
          <li>全家多张卡逐一比价：每张卡按各自用量算一遍，用量小的卡可能降档更划算</li>
          <li>学生卡/工作卡二选一：把超出单价差异年度化，用一年的钱衡量该选哪张</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">计算公式</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-4">
          <li>月费 = 月租 + max(0, 月流量 − 免费流量) × 流量超出单价 + max(0, 月通话 − 免费通话) × 通话超出单价</li>
          <li>月费差额 = 套餐 A 月费 − 套餐 B 月费（正数代表 A 更贵）</li>
          <li>年度化差额 = 月费差额 × 12</li>
          <li>流量等价点：解月租A + (x − 免费流量A) × 超出单价A = 月租B + (x − 免费流量B) × 超出单价B 中的 x</li>
        </ul>
        <p class="text-sm text-muted-foreground leading-relaxed">
          等价点示例：A 套餐 59 元含 30GB、超出 3 元/GB；B 套餐 79 元含 60GB。令 59 + 3×(x − 30) = 79，解得 x ≈ 36.67GB——
          月流量低于 36.67GB 时 A 更省，高于 36.67GB 时 B 更省。用量波动大就取几个月的平均值，落在交点附近就选条款更友好的那套。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div v-for="(faq, index) in faqs" :key="index">
            <h3 class="text-base font-semibold text-foreground">{{ faq.q }}</h3>
            <p class="text-sm text-muted-foreground mt-1">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'phone-plan-comparison'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Smartphone, Gauge, Scale, Calculator, ArrowRightLeft, Info,
  TriangleAlert, RefreshCw, Play, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '话费套餐对比计算器 - 两套餐月费/流量交点/年度差额在线测算',
  description: '免费在线话费套餐对比工具：两套套餐按实际流量与通话用量算真实月费，超出单价差异年度化，附流量等价点（交点）分析，换套餐前先算再换，纯本地计算不上传数据',
  keywords: '话费套餐对比,流量套餐选择,手机资费,套餐月费计算,哪家套餐划算,套餐等价点',
  author: '有条工具',
  ogTitle: '话费套餐对比计算器 - 月费/交点/年度差额在线测算 | 有条工具',
  ogDescription: '两套套餐按实际用量算月费，差额年度化，还有流量等价点分析，换套餐不再拍脑袋。',
  ogUrl: 'https://www.util.cn/tools/phone-plan-comparison',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '话费套餐对比计算器',
  twitterDescription: '按实际用量算两套套餐的真实月费与年度差额，附流量等价点分析。'
})

// 常见问题（与页面 SEO 区、JSON-LD FAQPage 保持一致）
const faqs = [
  {
    q: '话费套餐怎么对比才准？',
    a: '按「实际用量」算月费，而不是只看月租：把运营商 App 里近几个月的流量 GB 数与通话分钟数填进来，两套套餐按各自免费额度与超出单价算出真实月费，差额乘以 12 看一年差多少。月租低的套餐如果经常超量，总费可能反而更高。'
  },
  {
    q: '什么是套餐等价点（交点）？',
    a: '指两套套餐月费相等的用量。例：A 套餐 59 元含 30GB、超出 3 元/GB；B 套餐 79 元含 60GB。令 59 + 3×(x − 30) = 79，解得 x ≈ 36.67GB：月流量低于 36.67GB 时 A 更省，高于 36.67GB 时 B 更省。用量波动大时取几个月的平均值估算。'
  },
  {
    q: '定向流量算进对比吗？',
    a: '不算。定向流量只限特定 App 使用，且免流范围（广告、弹幕、第三方链接是否免流）各不相同，本工具统一按通用流量口径计算。定向流量用得多的用户，请把「免费流量」只填通用部分，超出单价按账单实际值填写。'
  },
  {
    q: '换套餐前还要看什么条款？',
    a: '至少三样：一是合约期与提前解约/降档的违约金（先看违约金再换，把它摊进月费差额看几个月回本）；二是优惠期折扣价到期后跳回的原价；三是副卡功能费、增值服务等固定费用，手动加进月租再对比。这些条款都不在本工具的模型内。'
  },
  {
    q: '免费额度内为什么还要对比？',
    a: '免费额度内月费就是月租本身。若两套套餐的免费额度都够你用，比的就是月租差额乘以 12 个月的年度差；月租看似只差十几二十元，一年下来就是两三百元，再加上超出单价的差异，差距可能更大。'
  }
]

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '话费套餐对比',
          url: 'https://www.util.cn/tools/phone-plan-comparison',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['两套餐按实际用量算月费', '超出免费额度按单价累加', '月费差额与年度化差额', '流量维度等价点（交点）分析', '更省套餐结论徽章', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '话费套餐对比', item: 'https://www.util.cn/tools/phone-plan-comparison/' }
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

// ---------- 纯逻辑（可独立单测） ----------
function round2(v) {
  return Math.round(v * 100) / 100
}

// 套餐参数合法性：月租/免费流量/超出单价/免费分钟/通话超出单价均为非负有限数
function validPlan(p) {
  return !!p
    && isFinite(p.rent) && p.rent >= 0
    && isFinite(p.freeGb) && p.freeGb >= 0
    && isFinite(p.overGb) && p.overGb >= 0
    && isFinite(p.freeMin) && p.freeMin >= 0
    && isFinite(p.overMin) && p.overMin >= 0
}

// 单套餐月费 = 月租 + max(0, 用量 − 免费流量) × 流量超出单价 + max(0, 通话 − 免费分钟) × 通话超出单价
function planFeeOf(plan, gb, minutes) {
  if (!validPlan(plan)) return null
  if (!isFinite(gb) || gb < 0) return null
  if (!isFinite(minutes) || minutes < 0) return null
  const dataOver = Math.max(0, gb - plan.freeGb) * plan.overGb
  const callOver = Math.max(0, minutes - plan.freeMin) * plan.overMin
  return round2(plan.rent + dataOver + callOver)
}

// 月费差额 = A − B（正数代表 A 更贵）；任一月费无效返回 null
function feeDiffOf(feeA, feeB) {
  if (feeA === null || feeA === undefined || !isFinite(feeA)) return null
  if (feeB === null || feeB === undefined || !isFinite(feeB)) return null
  return round2(feeA - feeB)
}

// 年度化差额 = 月费差额 × 12
function annualizedOf(diff) {
  if (diff === null || diff === undefined || !isFinite(diff)) return null
  return round2(diff * 12)
}

// 结论：'A'（A 更省）/ 'B'（B 更省）/ 'tie'（持平）；无效返回 null
function conclusionOf(feeA, feeB) {
  if (feeA === null || feeA === undefined || !isFinite(feeA)) return null
  if (feeB === null || feeB === undefined || !isFinite(feeB)) return null
  if (feeA < feeB) return 'A'
  if (feeA > feeB) return 'B'
  return 'tie'
}

// 等价点只依赖流量维度参数（月租/免费流量/超出单价），通话维度字段不参与校验
function validDataPlan(p) {
  return !!p
    && isFinite(p.rent) && p.rent >= 0
    && isFinite(p.freeGb) && p.freeGb >= 0
    && isFinite(p.overGb) && p.overGb >= 0
}

// 流量维度等价点（GB）：月费(x) = 月租 + max(0, x − 免费流量) × 流量超出单价
// 对两条分段线性月费曲线求首个交点；曲线平行无交点返回 null，全程同价返回 0
function crossoverGb(a, b) {
  if (!validDataPlan(a) || !validDataPlan(b)) return null
  const fee = (p, x) => p.rent + Math.max(0, x - p.freeGb) * p.overGb
  const diff = (x) => fee(a, x) - fee(b, x)
  // 分段点：0 与两套餐的免费流量额度
  const pts = [0, a.freeGb, b.freeGb]
    .sort((x, y) => x - y)
    .filter((v, i, arr) => i === 0 || v > arr[i - 1])
  for (let i = 0; i < pts.length - 1; i++) {
    const lo = pts[i]
    const hi = pts[i + 1]
    const dlo = diff(lo)
    const dhi = diff(hi)
    if (dlo === 0) return round2(lo)
    // 区间两端异号 → 线性求根（分母 dhi − dlo 必不为 0，无除零风险）
    if (dlo * dhi < 0) {
      return round2(lo + ((hi - lo) * -dlo) / (dhi - dlo))
    }
  }
  // 末段无界区间 [last, ∞)：斜率 = 超出单价之差
  const last = pts[pts.length - 1]
  const dlo = diff(last)
  if (dlo === 0) return round2(last)
  const slope = a.overGb - b.overGb
  if (slope !== 0) {
    const root = last - dlo / slope
    if (root > last) return round2(root)
  }
  return null
}

// ---------- 输入状态 ----------
const DEFAULTS = {
  a: { rent: 59, freeGb: 30, overGb: 3, freeMin: 100, overMin: 0.15 },
  b: { rent: 79, freeGb: 60, overGb: 2, freeMin: 200, overMin: 0.1 },
  usageGb: 38, usageMin: 150
}
// 示例：用量更大的用户（45GB/300 分钟），大流量套餐 B 的优势被放大
const EXAMPLE = {
  a: { rent: 59, freeGb: 30, overGb: 3, freeMin: 100, overMin: 0.15 },
  b: { rent: 79, freeGb: 60, overGb: 2, freeMin: 200, overMin: 0.1 },
  usageGb: 45, usageMin: 300
}

const aRentInput = ref(DEFAULTS.a.rent)
const aGbInput = ref(DEFAULTS.a.freeGb)
const aOverGbInput = ref(DEFAULTS.a.overGb)
const aMinInput = ref(DEFAULTS.a.freeMin)
const aOverMinInput = ref(DEFAULTS.a.overMin)
const bRentInput = ref(DEFAULTS.b.rent)
const bGbInput = ref(DEFAULTS.b.freeGb)
const bOverGbInput = ref(DEFAULTS.b.overGb)
const bMinInput = ref(DEFAULTS.b.freeMin)
const bOverMinInput = ref(DEFAULTS.b.overMin)
const usageGbInput = ref(DEFAULTS.usageGb)
const usageMinInput = ref(DEFAULTS.usageMin)
const seoContentVisible = ref(true)

// 空输入/非法输入统一按 0 处理
function numOf(v) {
  const n = Number(v)
  return isFinite(n) ? n : 0
}

const planA = computed(() => ({
  rent: Math.max(0, numOf(aRentInput.value)),
  freeGb: Math.max(0, numOf(aGbInput.value)),
  overGb: Math.max(0, numOf(aOverGbInput.value)),
  freeMin: Math.max(0, numOf(aMinInput.value)),
  overMin: Math.max(0, numOf(aOverMinInput.value))
}))
const planB = computed(() => ({
  rent: Math.max(0, numOf(bRentInput.value)),
  freeGb: Math.max(0, numOf(bGbInput.value)),
  overGb: Math.max(0, numOf(bOverGbInput.value)),
  freeMin: Math.max(0, numOf(bMinInput.value)),
  overMin: Math.max(0, numOf(bOverMinInput.value))
}))
const usageGb = computed(() => Math.max(0, numOf(usageGbInput.value)))
const usageMin = computed(() => Math.max(0, numOf(usageMinInput.value)))

// ---------- 派生计算 ----------
const feeA = computed(() => planFeeOf(planA.value, usageGb.value, usageMin.value))
const feeB = computed(() => planFeeOf(planB.value, usageGb.value, usageMin.value))
const diff = computed(() => feeDiffOf(feeA.value, feeB.value))
const annualDiff = computed(() => annualizedOf(diff.value))
const conclusion = computed(() => conclusionOf(feeA.value, feeB.value))
const crossover = computed(() => crossoverGb(planA.value, planB.value))
const canCompute = computed(() => feeA.value !== null && feeB.value !== null)

const conclusionBadge = computed(() => {
  if (conclusion.value === null) return null
  const saving = diff.value === null ? null : Math.abs(diff.value)
  if (conclusion.value === 'A') {
    return {
      label: 'A 套餐更省',
      chipClass: 'bg-green-500/10 text-green-600 border-green-500/20',
      desc: `按当前用量，套餐 A 每月比套餐 B 少花 ${fmtNum(saving)} 元`
    }
  }
  if (conclusion.value === 'B') {
    return {
      label: 'B 套餐更省',
      chipClass: 'bg-green-500/10 text-green-600 border-green-500/20',
      desc: `按当前用量，套餐 B 每月比套餐 A 少花 ${fmtNum(saving)} 元`
    }
  }
  return {
    label: '两套餐月费持平',
    chipClass: 'bg-primary/10 text-primary border-primary/20',
    desc: '按当前用量两套餐月费相同，可再对比定向流量、合约期等条款做选择'
  }
})

const annualText = computed(() => {
  if (annualDiff.value === null) return ''
  if (annualDiff.value === 0) return '两套餐按当前用量全年费用相同'
  return annualDiff.value > 0
    ? `套餐 B 全年少花 ${fmtNum(annualDiff.value)} 元`
    : `套餐 A 全年少花 ${fmtNum(-annualDiff.value)} 元`
})

// 月费拆解（展示用中间项）
function breakdownOf(plan, gb, minutes) {
  const dataOver = round2(Math.max(0, gb - plan.freeGb) * plan.overGb)
  const callOver = round2(Math.max(0, minutes - plan.freeMin) * plan.overMin)
  return {
    dataOver,
    callOver,
    dataOverText: gb > plan.freeGb
      ? `超出 ${fmtNum(gb - plan.freeGb)} GB × ${fmtNum(plan.overGb)} 元`
      : '免费额度内',
    callOverText: minutes > plan.freeMin
      ? `超出 ${fmtNum(minutes - plan.freeMin)} 分钟 × ${fmtNum(plan.overMin)} 元`
      : '免费额度内'
  }
}
const aBreakdown = computed(() => breakdownOf(planA.value, usageGb.value, usageMin.value))
const bBreakdown = computed(() => breakdownOf(planB.value, usageGb.value, usageMin.value))

// 等价点解读
const crossoverInfo = computed(() => {
  const cross = crossover.value
  if (cross === null) {
    const base = round2(planA.value.rent - planB.value.rent)
    const cheaper = base < 0 ? 'A' : 'B'
    return {
      kind: 'parallel',
      headline: '无交点',
      text: `两套餐月费曲线平行，不存在等价点：月费差固定 ${fmtNum(Math.abs(base))} 元，套餐 ${cheaper} 在任何流量用量下都更省，直接选它即可。`
    }
  }
  if (cross === 0) {
    if (planA.value.overGb === planB.value.overGb) {
      return {
        kind: 'same',
        headline: '0 GB',
        text: '两套餐流量计费参数完全相同（月租、免费流量、超出单价一致），月费将始终持平，按其他条款任选其一即可。'
      }
    }
    const cheaperOver = planA.value.overGb < planB.value.overGb ? 'A' : 'B'
    return {
      kind: 'same',
      headline: '0 GB',
      text: `两套餐月租相同：免费流量额度内月费一致，超出免费额度后按各自超出单价累加，超出单价更低的套餐 ${cheaperOver} 在用量越大时优势越明显。`
    }
  }
  const cheaperBelow = planA.value.rent < planB.value.rent ? 'A' : 'B'
  const cheaperAbove = cheaperBelow === 'A' ? 'B' : 'A'
  let position = ''
  if (usageGb.value > cross) position = `当前月流量 ${fmtNum(usageGb.value)} GB 位于交点之上`
  else if (usageGb.value < cross) position = `当前月流量 ${fmtNum(usageGb.value)} GB 位于交点之下`
  else position = `当前月流量恰好等于交点`
  return {
    kind: 'cross',
    headline: `${fmtNum(cross)} GB`,
    text: `月流量用量低于 ${fmtNum(cross)} GB 时，套餐 ${cheaperBelow} 更省；高于 ${fmtNum(cross)} GB 时，套餐 ${cheaperAbove} 更省（按流量维度线性测算，未含通话差额）。${position}。`
  }
})

// ---------- 展示工具 ----------
function fmtNum(v) {
  if (v === null || v === undefined || !isFinite(v)) return '—'
  const r = Math.round(v * 100) / 100
  return Number.isInteger(r)
    ? r.toLocaleString('zh-CN')
    : r.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
}

// ---------- 操作 ----------
function loadExample() {
  aRentInput.value = EXAMPLE.a.rent
  aGbInput.value = EXAMPLE.a.freeGb
  aOverGbInput.value = EXAMPLE.a.overGb
  aMinInput.value = EXAMPLE.a.freeMin
  aOverMinInput.value = EXAMPLE.a.overMin
  bRentInput.value = EXAMPLE.b.rent
  bGbInput.value = EXAMPLE.b.freeGb
  bOverGbInput.value = EXAMPLE.b.overGb
  bMinInput.value = EXAMPLE.b.freeMin
  bOverMinInput.value = EXAMPLE.b.overMin
  usageGbInput.value = EXAMPLE.usageGb
  usageMinInput.value = EXAMPLE.usageMin
}
function resetInputs() {
  aRentInput.value = DEFAULTS.a.rent
  aGbInput.value = DEFAULTS.a.freeGb
  aOverGbInput.value = DEFAULTS.a.overGb
  aMinInput.value = DEFAULTS.a.freeMin
  aOverMinInput.value = DEFAULTS.a.overMin
  bRentInput.value = DEFAULTS.b.rent
  bGbInput.value = DEFAULTS.b.freeGb
  bOverGbInput.value = DEFAULTS.b.overGb
  bMinInput.value = DEFAULTS.b.freeMin
  bOverMinInput.value = DEFAULTS.b.overMin
  usageGbInput.value = DEFAULTS.usageGb
  usageMinInput.value = DEFAULTS.usageMin
}
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('phone-plan-comparison')
})
</script>
