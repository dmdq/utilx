<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ClipboardCheck class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">病假工资计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">医疗期 3–24 个月对照 + 工龄比例折算病假工资，自动校验「不低于最低工资 80%」法定下限并高亮补足</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线病假工资计算器：输入月工资、本单位连续工龄与累计总工龄，先按《企业职工患病或非因工负伤医疗期规定》
        查出你的法定医疗期时长（3～24 个月矩阵），再按所选地区口径折算月病假工资——
        上海工龄分档模式（60%／70%／80%／90%／100%，历史示例口径）、深圳「本人标准工资 60%」模式，
        并统一按《关于贯彻执行〈劳动法〉若干问题的意见》第 59 条校验<b>不得低于当地最低工资标准 80%</b> 的法定下限，
        低于下限自动提到下限并高亮提示；附按天折算（÷21.75）与地区口径差异说明。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <ClipboardCheck class="w-5 h-5 mr-2 text-primary" /> 工资与工龄信息
        </h2>

        <!-- 月工资 -->
        <div>
          <label for="slp-wage" class="block text-sm font-medium text-foreground mb-2">月工资（病假前正常出勤口径）</label>
          <div class="flex items-center gap-2">
            <input
              id="slp-wage"
              v-model.number="monthlyWage"
              type="number"
              min="0"
              step="100"
              placeholder="如 6000"
              class="flex-1 min-w-0 px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元 / 月</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>部分地区（如上海历史口径）对「本人工资」基数另有细化折算规则，以当地规定为准；本工具按你填写的数值直接代入。</span>
          </p>
        </div>

        <!-- 工龄 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="slp-unit-years" class="block text-sm font-medium text-foreground mb-2">本单位连续工龄（年）</label>
            <input
              id="slp-unit-years"
              v-model.number="unitYears"
              type="number"
              min="0"
              step="0.5"
              placeholder="如 5"
              class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label for="slp-total-years" class="block text-sm font-medium text-foreground mb-2">累计总工龄（年）</label>
            <input
              id="slp-total-years"
              v-model.number="totalYears"
              type="number"
              min="0"
              step="0.5"
              placeholder="如 8"
              class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed -mt-2 flex items-start gap-1">
          <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span>总工龄决定医疗期矩阵的大档（实际工作年限 10 年以下 / 以上），本单位工龄决定细分档；不足整年的按工龄区间判断。</span>
        </p>

        <!-- 当地口径 -->
        <div>
          <label for="slp-mode" class="block text-sm font-medium text-foreground mb-2">当地规定口径</label>
          <select
            id="slp-mode"
            v-model="modeId"
            class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="m in MODES" :key="m.id" :value="m.id">{{ m.label }}</option>
          </select>
          <p class="text-xs leading-relaxed mt-2 p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{{ activeMode.desc }}</span>
          </p>
        </div>

        <!-- 最低工资 -->
        <div>
          <label for="slp-minwage" class="block text-sm font-medium text-foreground mb-2">当地月最低工资标准（用于下限校验）</label>
          <div class="flex items-center gap-2">
            <input
              id="slp-minwage"
              v-model.number="minWage"
              type="number"
              min="0"
              step="10"
              placeholder="如 2740"
              class="flex-1 min-w-0 px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元</span>
          </div>
          <p class="text-[10px] text-muted-foreground/80 leading-relaxed mt-1">
            默认 2740 元仅为示例量级（2025 年上海口径），请以当地人社部门公布的现行标准为准；不填则跳过下限校验。
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
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 病假待遇测算结果
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
          <!-- 医疗期卡 -->
          <div class="bg-primary/10 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs text-muted-foreground mb-1">法定医疗期时长（《企业职工患病或非因工负伤医疗期规定》第三条）</p>
              <p class="text-2xl font-bold text-foreground">{{ medicalLeave.months }} 个月</p>
              <p class="text-xs text-muted-foreground mt-1">{{ medicalLeave.note }}</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-muted-foreground mb-1">折算口径</p>
              <p class="text-sm font-semibold text-primary">{{ activeMode.short }}</p>
            </div>
          </div>

          <!-- 下限校验徽章 -->
          <p
            v-if="result.adjusted"
            class="text-xs leading-relaxed p-3 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20 flex items-start gap-1.5"
          >
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              触发法定下限：按口径折算的 {{ fmtMoney(result.raw) }} 元低于当地最低工资标准的 80%（{{ fmtMoney(result.floor) }} 元）。
              病假工资<b>不得低于最低工资标准的 80%</b>（劳部发〔1995〕309 号第 59 条口径），已自动提到 {{ fmtMoney(result.monthly) }} 元 / 月。
            </span>
          </p>
          <p
            v-else-if="minWageNum > 0"
            class="text-xs leading-relaxed p-3 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 flex items-start gap-1.5"
          >
            <CheckCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>下限校验通过：折算结果 {{ fmtMoney(result.monthly) }} 元 ≥ 法定下限（最低工资 80%）{{ fmtMoney(result.floor) }} 元。</span>
          </p>

          <!-- 主结果卡 -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">月病假工资{{ result.adjusted ? '（已提至下限）' : '' }}</p>
              <p class="text-2xl font-bold" :class="result.adjusted ? 'text-red-600' : 'text-primary'">¥{{ fmtMoney(result.monthly) }}</p>
              <p class="text-[11px] text-muted-foreground mt-1">{{ result.formula }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">按天折算（÷ 21.75）</p>
              <p class="text-2xl font-bold text-foreground">¥{{ fmtMoney(result.daily) }}</p>
              <p class="text-[11px] text-muted-foreground mt-1">月计薪天数 21.75 天（(365 − 104) ÷ 12，工资折算现行口径）</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">相当于正常工资的</p>
              <p class="text-2xl font-bold text-foreground">{{ result.ratio }}%</p>
              <p class="text-[11px] text-muted-foreground mt-1">法定下限为最低工资的 80%</p>
            </div>
          </div>

          <!-- 地区口径差异说明卡 -->
          <div class="border border-border rounded-lg p-4 bg-muted/30">
            <p class="text-sm font-semibold text-foreground mb-2">各地口径差异（示例对比，非全国标准）</p>
            <div class="overflow-x-auto rounded-lg border border-border bg-background">
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-muted-foreground border-b border-border bg-muted/40">
                    <th class="px-3 py-1.5 text-left font-medium">地区</th>
                    <th class="px-3 py-1.5 text-left font-medium">病假工资口径</th>
                    <th class="px-3 py-1.5 text-left font-medium">法定托底线</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-border/40 last:border-0">
                    <td class="px-3 py-1.5 text-foreground font-medium">全国（劳部发〔1995〕309 号第 59 条）</td>
                    <td class="px-3 py-1.5 text-muted-foreground">按有关规定支付，可低于最低工资</td>
                    <td class="px-3 py-1.5 text-foreground">不低于最低工资标准的 80%</td>
                  </tr>
                  <tr class="border-b border-border/40 last:border-0">
                    <td class="px-3 py-1.5 text-foreground font-medium">上海（沪劳保发〔1995〕83 号，已于 2026-08-15 到期失效）</td>
                    <td class="px-3 py-1.5 text-muted-foreground">连续工龄 &lt;2 年 60%／2–4 年 70%／4–6 年 80%／6–8 年 90%／≥8 年 100%（连续休假超 6 个月另有疾病救济费口径）</td>
                    <td class="px-3 py-1.5 text-foreground">不低于最低工资标准的 80%</td>
                  </tr>
                  <tr class="border-b border-border/40 last:border-0">
                    <td class="px-3 py-1.5 text-foreground font-medium">深圳（《深圳市员工工资支付条例》第 23 条）</td>
                    <td class="px-3 py-1.5 text-muted-foreground">不低于本人标准工资的 60%（修订讨论中有「正常工作时间工资」表述调整，以最新文本为准）</td>
                    <td class="px-3 py-1.5 text-foreground">不得低于最低工资的 80%</td>
                  </tr>
                  <tr class="border-b border-border/40 last:border-0">
                    <td class="px-3 py-1.5 text-foreground font-medium">北京（《北京市工资支付规定》第 21 条）</td>
                    <td class="px-3 py-1.5 text-muted-foreground">按劳动合同、集体合同约定或国家规定支付</td>
                    <td class="px-3 py-1.5 text-foreground">不得低于本市最低工资标准的 80%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed mt-2">
              上海 83 号文经沪人社规〔2021〕6 号延长有效期至 2026 年 8 月 15 日后已到期，上海现行模式转为「劳动合同 / 规章制度约定优先、
              不得低于最低工资 80%」；本页上海模式仅作历史口径与教学示例。
            </p>
          </div>
        </template>

        <!-- 空状态 -->
        <div v-else class="text-center text-muted-foreground py-16">
          <TriangleAlert class="w-10 h-10 mx-auto mb-3 text-yellow-500" />
          <p class="text-sm">请先完善左侧输入：{{ inputErrors.join('；') }}。</p>
          <p class="text-xs text-muted-foreground/70 mt-1">也可以点击「载入示例」先看一条完整测算：月工资 6000 元、本单位工龄 5 年、总工龄 8 年、上海历史口径。</p>
        </div>
      </div>
    </div>

    <!-- 法条与免责声明（页面固定） -->
    <div class="border border-border bg-muted/30 rounded-lg p-4 mb-8 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        计算依据：《企业职工患病或非因工负伤医疗期规定》（劳部发〔1994〕479 号）第三条；劳动部《关于贯彻执行〈中华人民共和国劳动法〉
        若干问题的意见》（劳部发〔1995〕309 号）第 59 条（病假工资不得低于当地最低工资标准的 80%）；
        上海市、深圳市、北京市地方规定（详见差异表）。本页已对照政府/人社系统公开原文逐字核对，
        <b class="text-foreground">一切以现行法规原文与当地人社部门口径为准</b>；本工具仅供教育参考，不构成法律意见。
      </p>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg mb-12 group">
      <summary class="flex items-center justify-between cursor-pointer select-none px-6 py-4">
        <span class="text-lg font-semibold text-foreground"><span class="text-primary mr-2">#</span>医疗期时长、病假工资比例与常见问题</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div class="px-6 pb-6 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">计算公式</h3>
          <div class="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed space-y-2">
            <p><strong>医疗期时长</strong>（劳部发〔1994〕479 号第三条矩阵）：实际工作年限 10 年以下——本单位 5 年以下 3 个月、5 年以上 6 个月；实际工作年限 10 年以上——本单位 5 年以下 6 个月、5–10 年 9 个月、10–15 年 12 个月、15–20 年 18 个月、20 年以上 24 个月。</p>
            <p><strong>上海历史模式</strong>：月病假工资 = 本人工资 × 工龄比例（连续工龄 &lt;2 年 60%、2–4 年 70%、4–6 年 80%、6–8 年 90%、≥8 年 100%），连续休假超过 6 个月的按疾病救济费口径另行处理。</p>
            <p><strong>深圳模式</strong>：月病假工资 = max（本人标准工资 × 60%，当地最低工资 × 80%）。</p>
            <p><strong>法定下限校验</strong>：任何口径下，病假工资不得低于当地月最低工资标准 × 80%。</p>
            <p><strong>按天折算</strong>：日病假工资 = 月病假工资 ÷ 21.75（月计薪天数 =（365 − 104）÷ 12，源自《关于职工全年月平均工作时间和工资折算问题的通知》——原劳社部发〔2008〕3 号确立、2025 年 1 月起人社部同名通知沿用，数值不变）。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">病假与工伤停工留薪有什么区别？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            两者都「不上班、有收入」，但法律性质完全不同：病假（患病或非因工负伤）适用医疗期制度，工资按地区口径打折、
            受「最低工资 80%」下限约束，医疗期满不能从事原工作也不能从事另行安排工作的，单位可依法解除并支付经济补偿；
            工伤停工留薪期（一般不超过 12 个月，伤情严重可延长不超过 12 个月）期间<b class="text-foreground">原工资福利待遇不变</b>、
            由所在单位按月支付（停工留薪期按原工资足额发，不是打折），另享有工伤医疗、伤残等级鉴定等工伤待遇。
            简单记：病假打折有下限，工伤停工留薪不打折。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">医疗期结束了怎么办？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            医疗期是法律给员工的「解雇保护期」：医疗期内单位不得依《劳动合同法》第 40、41 条解除合同。
            医疗期满后，若员工不能从事原工作、也不能从事单位另行安排的工作，单位可以解除合同（第 40 条第 1 项），
            但需提前 30 日书面通知或额外支付一个月工资，并支付经济补偿（N）；
            合同期满时医疗期尚未结束的，合同应顺延至医疗期满。终止/解除时部分地区还要求支付不低于 6 个月工资的医疗补助费
            （有地方规章的以当地规定为准）。
          </p>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">病假工资可以低于最低工资吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">可以低于最低工资标准本身，但不得低于最低工资标准的 80%（劳部发〔1995〕309 号第 59 条）。劳动合同或规章制度约定了更高标准的，从其约定。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">月工资 6000、工龄 5 年，病假工资多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">按上海历史口径（连续工龄 4–6 年为 80%）：6000 × 80% = 4800 元/月，按天 4800 ÷ 21.75 ≈ 220.69 元/天；只要不低于当地最低工资 80% 即合规。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">医疗期有多长？</h3>
            <p class="text-sm text-muted-foreground mt-1">3～24 个月：总工龄 10 年以下，本单位 5 年以下 3 个月、5 年以上 6 个月；总工龄 10 年以上，按本单位工龄 5 年以下 / 5–10 / 10–15 / 15–20 / 20 年以上分别为 6 / 9 / 12 / 18 / 24 个月。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">上海工龄分档规则还在用吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">沪劳保发〔1995〕83 号文经延长有效期后已于 2026 年 8 月 15 日到期。此后上海病假工资转为合同 / 规章制度约定优先、不得低于最低工资 80% 的口径，本页的工龄分档仅作历史示例。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">病假期间社保谁交？</h3>
            <p class="text-sm text-muted-foreground mt-1">劳动关系存续期间单位仍应为员工缴纳社保，个人部分从病假工资中代扣；医疗期内单位解除合同属违法解除，可主张 2N 赔偿。</p>
          </div>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'sick-leave-pay-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ClipboardCheck, Calculator, Info, TriangleAlert, CheckCircle,
  ChevronDown, RefreshCw, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '病假工资计算器 - 医疗期时长与病假工资比例在线计算',
  description: '免费在线病假工资计算器：按劳部发1994年479号查医疗期（3-24个月矩阵），按工龄比例（60%-100%）折算病假工资、÷21.75 按天折算，自动校验「不低于最低工资80%」法定下限并高亮补足，附上海/深圳/北京口径差异表，纯浏览器本地计算不上传',
  keywords: '病假工资计算,医疗期规定,病假工资比例,病假工资低于最低工资,医疗期时长,病假工资80%,病假按天计算',
  author: '有条工具',
  ogTitle: '病假工资计算器 - 医疗期时长与病假工资比例在线计算 | 有条工具',
  ogDescription: '医疗期 3-24 个月矩阵 + 工龄比例折算，最低工资 80% 下限自动校验补足。',
  ogUrl: 'https://www.util.cn/tools/sick-leave-pay-calculator',
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
          name: '病假工资计算器',
          url: 'https://www.util.cn/tools/sick-leave-pay-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['医疗期 3-24 个月矩阵查询', '工龄比例病假工资折算（60%-100%）', '不低于最低工资 80% 法定下限校验与自动补足', '按天折算（÷21.75）', '上海/深圳/北京口径差异对照', '病假与工伤停工留薪区别说明', '纯本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '病假工资计算器', item: 'https://www.util.cn/tools/sick-leave-pay-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '病假工资可以低于最低工资吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以低于最低工资标准本身，但不得低于最低工资标准的 80%（劳部发〔1995〕309 号第 59 条）。劳动合同或规章制度约定更高标准的，从其约定。' }
            },
            {
              '@type': 'Question',
              name: '月工资 6000、工龄 5 年，病假工资多少？',
              acceptedAnswer: { '@type': 'Answer', text: '按上海历史口径（连续工龄 4-6 年为 80%）：6000 × 80% = 4800 元/月，按天 4800 ÷ 21.75 ≈ 220.69 元/天。' }
            },
            {
              '@type': 'Question',
              name: '医疗期有多长？',
              acceptedAnswer: { '@type': 'Answer', text: '3～24 个月：总工龄 10 年以下，本单位 5 年以下 3 个月、5 年以上 6 个月；总工龄 10 年以上，按本单位工龄分别为 6/9/12/18/24 个月。' }
            },
            {
              '@type': 'Question',
              name: '上海工龄分档规则还在用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '沪劳保发〔1995〕83 号文经延长有效期后已于 2026 年 8 月 15 日到期，上海现行口径转为合同约定优先、不得低于最低工资 80%。' }
            },
            {
              '@type': 'Question',
              name: '病假期间社保谁交？',
              acceptedAnswer: { '@type': 'Answer', text: '劳动关系存续期间单位仍应缴纳社保，个人部分从病假工资中代扣；医疗期内解除合同属违法解除。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 条款依据（两源逐字核对：政府规章库/人社系统公开原文）：
// - 医疗期（劳部发〔1994〕479 号第三条）：
//   实际工作年限 10 年以下：本单位 5 年以下 3 个月、5 年以上 6 个月；
//   实际工作年限 10 年以上：本单位 5 年以下 6 个月、5-10 年 9 个月、10-15 年 12 个月、15-20 年 18 个月、20 年以上 24 个月。
// - 病假工资下限（劳部发〔1995〕309 号第 59 条）：可以低于当地最低工资标准支付，但不能低于最低工资标准的 80%。
// - 上海历史口径（沪劳保发〔1995〕83 号，2026-08-15 到期失效）：连续工龄 <2 年 60%、2-4 年 70%、4-6 年 80%、6-8 年 90%、≥8 年 100%。
// - 深圳（《深圳市员工工资支付条例》第 23 条）：不低于本人标准工资 60%，且不得低于最低工资 80%。
// 金额 0.01 元定点收敛（round2），按天折算分母固定 21.75。

function round2(x) {
  return Math.round((Number(x) || 0) * 100) / 100
}

const MONTHS_PER_PAYDAY = 21.75

// 医疗期矩阵（总工龄 10 年以下 / 以上 × 本单位工龄分档）
function medicalLeaveMonthsOf(totalYears, unitYears) {
  const t = Math.max(0, Number(totalYears) || 0)
  const u = Math.max(0, Number(unitYears) || 0)
  if (t < 10) {
    return u < 5 ? { months: 3, bucket: '实际工作年限 10 年以下、本单位 5 年以下' } : { months: 6, bucket: '实际工作年限 10 年以下、本单位 5 年以上' }
  }
  if (u < 5) return { months: 6, bucket: '实际工作年限 10 年以上、本单位 5 年以下' }
  if (u < 10) return { months: 9, bucket: '实际工作年限 10 年以上、本单位 5–10 年' }
  if (u < 15) return { months: 12, bucket: '实际工作年限 10 年以上、本单位 10–15 年' }
  if (u < 20) return { months: 18, bucket: '实际工作年限 10 年以上、本单位 15–20 年' }
  return { months: 24, bucket: '实际工作年限 10 年以上、本单位 20 年以上' }
}

// 上海历史口径：连续工龄 → 病假工资比例（休假 6 个月以内档）
function shanghaiRateOf(unitYears) {
  const u = Math.max(0, Number(unitYears) || 0)
  if (u < 2) return 0.6
  if (u < 4) return 0.7
  if (u < 6) return 0.8
  if (u < 8) return 0.9
  return 1
}

// 法定下限：当地最低工资 × 80%
function sickPayFloorOf(minWage) {
  const m = Math.max(0, Number(minWage) || 0)
  return m > 0 ? round2(m * 0.8) : 0
}

// 各口径月病假工资（未做下限校验前的折算值）：
// - shanghai：本人工资 × 工龄比例（历史示例口径）
// - shenzhen：本人标准工资 × 60%
// - floor：仅法定下限口径（合同约定优先，按 80% 最低工资托底展示）
function sickPayOf(modeId, monthlyWage, unitYears) {
  const w = Math.max(0, Number(monthlyWage) || 0)
  if (modeId === 'shanghai') return round2(w * shanghaiRateOf(unitYears))
  if (modeId === 'shenzhen') return round2(w * 0.6)
  return 0
}

// 下限校验：低于下限自动提到下限并标记 adjusted
function applyFloor(raw, minWage) {
  const floor = sickPayFloorOf(minWage)
  const r = round2(raw)
  if (floor > 0 && r < floor) return { monthly: floor, floor, adjusted: true }
  return { monthly: r, floor, adjusted: false }
}

// 按天折算（÷21.75，0.01 元定点）
function dailyOf(monthlyPay) {
  return round2((Number(monthlyPay) || 0) / MONTHS_PER_PAYDAY)
}

// 三种地区口径元数据
const MODES = [
  {
    id: 'shanghai',
    label: '上海模式：连续工龄分档 60%~100%（历史示例口径，2026-08-15 已失效）',
    short: '上海历史口径（83 号文，已失效）',
    desc: '沪劳保发〔1995〕83 号：连续工龄 <2 年 60%、2–4 年 70%、4–6 年 80%、6–8 年 90%、≥8 年 100%，并托底最低工资 80%。注意：该文件已于 2026 年 8 月 15 日到期失效，仅作教学示例；上海现行按合同约定 + 最低工资 80% 托底。'
  },
  {
    id: 'shenzhen',
    label: '深圳模式：本人标准工资 60% 托底最低工资 80%',
    short: '深圳口径（工资支付条例第 23 条）',
    desc: '《深圳市员工工资支付条例》第 23 条：医疗期内按不低于本人标准工资的 60% 支付病伤假期工资，且不得低于最低工资的 80%（条例修订中的表述调整以最新文本为准）。'
  },
  {
    id: 'floor',
    label: '法定下限口径：仅看「不低于最低工资 80%」托底线（北京等多地）',
    short: '法定下限口径（309 号文第 59 条）',
    desc: '劳部发〔1995〕309 号第 59 条：病假工资可以低于当地最低工资标准支付，但不能低于最低工资标准的 80%。北京等地按劳动合同/集体合同约定支付、受该下限约束，本档仅展示法定托底金额。'
  }
]

function modeOf(id) {
  return MODES.find((m) => m.id === id) || MODES[0]
}

// 金额展示：千分位 + 固定 2 位小数
function fmtMoney(n) {
  const v = round2(n)
  const sign = v < 0 ? '-' : ''
  const parts = Math.abs(v).toFixed(2).split('.')
  return sign + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1]
}

// ---------- 页面状态 ----------
const monthlyWage = ref(6000)
const unitYears = ref(5)
const totalYears = ref(8)
const modeId = ref('shanghai')
const minWage = ref(2740)

const activeMode = computed(() => modeOf(modeId.value))
const minWageNum = computed(() => Math.max(0, Number(minWage.value) || 0))

const inputErrors = computed(() => {
  const errs = []
  if (!(Number(monthlyWage.value) > 0)) errs.push('月工资需大于 0')
  if (unitYears.value === '' || unitYears.value === null || !isFinite(Number(unitYears.value))) errs.push('请填写本单位连续工龄')
  if (totalYears.value === '' || totalYears.value === null || !isFinite(Number(totalYears.value))) errs.push('请填写累计总工龄')
  return errs
})

const canCalc = computed(() => inputErrors.value.length === 0)

// ---------- 计算与展示派生 ----------
const medicalLeave = computed(() => {
  const m = medicalLeaveMonthsOf(totalYears.value, unitYears.value)
  return { months: m.months, note: `${m.bucket}（劳部发〔1994〕479 号第三条）；医疗期含休息日、法定节假日，按自然日连续计算` }
})

const result = computed(() => {
  const raw = sickPayOf(modeId.value, monthlyWage.value, unitYears.value)
  const floored = applyFloor(raw, minWageNum.value)
  const wage = Math.max(0, Number(monthlyWage.value) || 0)
  let formula
  if (modeId.value === 'shanghai') {
    const rate = shanghaiRateOf(unitYears.value)
    formula = `${fmtMoney(wage)} × ${Math.round(rate * 100)}%（连续工龄 ${unitYears.value} 年档）`
  } else if (modeId.value === 'shenzhen') {
    formula = `${fmtMoney(wage)} × 60%（本人标准工资口径）`
  } else {
    formula = '法定托底线（合同约定优先，最低工资 80%）'
  }
  return {
    raw,
    monthly: floored.monthly,
    floor: floored.floor,
    adjusted: floored.adjusted,
    daily: dailyOf(floored.monthly),
    ratio: wage > 0 ? String(Math.round((floored.monthly / wage) * 1000) / 10) : '0',
    formula
  }
})

// 复制结果（navigator.clipboard + alert）
function copyResult() {
  const lines = [
    '【病假工资测算】',
    `医疗期：${medicalLeave.value.months} 个月`,
    `口径：${activeMode.value.short}`,
    `月病假工资：${fmtMoney(result.value.monthly)} 元（${result.value.formula}）`,
    `按天折算：${fmtMoney(result.value.daily)} 元 / 天（÷21.75）`,
    `下限校验：${result.value.adjusted ? '低于最低工资 80%，已提到' : '通过'}（法定下限 ${fmtMoney(result.value.floor)} 元）`,
    '免责：仅供参考，以现行法规原文与当地人社部门口径为准。'
  ].join('\n')
  navigator.clipboard.writeText(lines).then(() => alert('已复制')).catch(() => alert('复制失败，请手动复制'))
}

function loadExample() {
  monthlyWage.value = 6000
  unitYears.value = 5
  totalYears.value = 8
  modeId.value = 'shanghai'
  minWage.value = 2740
}

function resetAll() {
  monthlyWage.value = ''
  unitYears.value = ''
  totalYears.value = ''
  modeId.value = 'shanghai'
  minWage.value = ''
}

onMounted(() => {
  addRecentTool('sick-leave-pay-calculator')
})
</script>
