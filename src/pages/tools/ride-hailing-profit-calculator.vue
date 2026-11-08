<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Car class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">网约车流水核算</h1>
          <p class="text-sm text-muted-foreground mt-1">抽成、油电费、租金、保险折旧逐项扣，算出真实时薪，再和当地最低工资对一对</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        跑网约车别只看流水：平台抽成 20%~30%，油电费吃掉一大块，租车租金、保险保养折旧还得摊到每天。
        本工具按「日净收入 = 日流水 ×（1 − 抽成%）− 能耗成本 − 日固定成本 − 年摊日均」逐项递减，最后除以在线时长得到真实时薪，
        支持油车/电车两种能耗模式，并与当地最低小时工资对比给出提示。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 收入与成本参数
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">日流水（元/天）</label>
          <input
            v-model.number="revenueInput"
            type="number"
            min="0"
            step="10"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">按整月流水 ÷ 出车天数填平均值更准，别拿高峰日的好数据骗自己</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">平台抽成（%）</label>
          <input
            v-model.number="rateInput"
            type="number"
            min="0"
            max="100"
            step="1"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">各平台 20-30% 区间，以账单为准</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">日出车里程（km）</label>
          <input
            v-model.number="kmInput"
            type="number"
            min="0"
            step="10"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">空驶也算：以车辆总里程表/车主 App 里程为准，别只填订单里程</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">能耗模式</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="mode = 'fuel'"
              :class="[
                'px-4 py-2 rounded-lg transition text-sm flex items-center gap-1.5',
                mode === 'fuel'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground border border-border'
              ]"
            >
              <Fuel class="w-4 h-4" /> 油车（加油）
            </button>
            <button
              @click="mode = 'electric'"
              :class="[
                'px-4 py-2 rounded-lg transition text-sm flex items-center gap-1.5',
                mode === 'electric'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground border border-border'
              ]"
            >
              <BatteryCharging class="w-4 h-4" /> 电车（充电）
            </button>
          </div>
        </div>

        <div v-if="mode === 'fuel'" class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">油耗（L/100km）</label>
            <input
              v-model.number="fuelPer100Input"
              type="number"
              min="0"
              step="0.5"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">油价（元/L）</label>
            <input
              v-model.number="fuelPriceInput"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div v-else class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">电耗（kWh/100km）</label>
            <input
              v-model.number="elecPer100Input"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">电车一般 12-18，跑得猛会更高</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">电价（元/kWh）</label>
            <input
              v-model.number="elecPriceInput"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">按常用充电桩价格填，低谷慢充更便宜</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">日固定成本（元/天）</label>
          <input
            v-model.number="dailyRentInput"
            type="number"
            min="0"
            step="10"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">租车租金按天折算填这里，自有车填 0</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">年摊成本（元/年）</label>
            <input
              v-model.number="annualTotalInput"
              type="number"
              min="0"
              step="1000"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">保险 + 保养 + 折旧的年总额</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">年出车天数（天）</label>
            <input
              v-model.number="workingDaysInput"
              type="number"
              min="0"
              step="10"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">年摊日均 = 年摊成本 ÷ 年出车天数</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">在线时长（小时/天）</label>
            <input
              v-model.number="hoursInput"
              type="number"
              min="0"
              max="24"
              step="0.5"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">含等单、找充电桩的挂网时间</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">当地最低时薪（元/小时）</label>
            <input
              v-model.number="minWageInput"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">各地不同，按当地标准填，用于对比徽章</p>
          </div>
        </div>

        <div v-if="inputWarning" class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
          <TriangleAlert class="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-red-600 leading-relaxed">{{ inputWarning }}</p>
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

      <!-- 右侧：结果 -->
      <div class="space-y-6">
        <!-- 时薪结论卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> 真实时薪
          </h2>

          <template v-if="canCompute">
            <div class="bg-primary/10 rounded-lg p-6 text-center">
              <p class="text-xs text-muted-foreground mb-1">时薪（日净收入 ÷ 在线时长）</p>
              <p class="text-5xl font-bold leading-none" :class="hourlyWage !== null && hourlyWage < 0 ? 'text-red-600' : 'text-primary'">
                {{ fmtNum(hourlyWage) }}
              </p>
              <p class="text-sm font-medium text-primary mt-2">元/小时</p>
              <span
                v-if="wageBadge"
                class="inline-block mt-3 px-3 py-1 rounded-full border text-xs font-medium"
                :class="wageBadge.chipClass"
              >{{ wageBadge.label }}</span>
            </div>
            <p v-if="wageBadge" class="text-xs leading-relaxed flex items-start gap-1.5" :class="wageBadge.key === 'loss' ? 'text-red-600' : 'text-muted-foreground'">
              <TriangleAlert v-if="wageBadge.key !== 'ok'" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <CheckCircle v-else class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ wageBadge.desc }}</span>
            </p>

            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">日净收入</p>
                <p class="text-lg font-bold font-mono" :class="dailyNet !== null && dailyNet < 0 ? 'text-red-600' : 'text-foreground'">{{ fmtNum(dailyNet) }} 元</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">年净收入估算</p>
                <p class="text-lg font-bold font-mono" :class="annualNet !== null && annualNet < 0 ? 'text-red-600' : 'text-foreground'">{{ fmtNum(annualNet) }} 元</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">单公里能耗</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ perKmText }} 元</p>
              </div>
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>口径：日净 = 日流水 ×（1 − 抽成%）− 能耗 − 日固定成本 − 年摊日均；年净 = 日净 × 年出车天数。社保、事故风险与休息日成本未计入，结果供跑车决策参考。</span>
            </p>
          </template>
          <div v-else class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-red-600 leading-relaxed">{{ inputWarning }}</p>
          </div>
        </div>

        <!-- 流水拆解卡 -->
        <div v-if="canCompute" class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Wallet class="w-5 h-5 mr-2 text-primary" /> 一天流水的去向（逐项扣减）
          </h2>

          <div>
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <span class="text-sm text-muted-foreground">日流水</span>
              <span class="text-sm font-medium text-foreground font-mono">{{ fmtNum(revenue) }} 元</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <span class="text-sm text-muted-foreground">− 平台抽成（{{ rate }}%）</span>
              <span class="text-sm font-medium text-red-600 font-mono">−{{ fmtNum(commissionAmount) }} 元</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border/50 bg-muted/30 rounded px-2">
              <span class="text-sm font-medium text-foreground">= 到手流水</span>
              <span class="text-sm font-bold text-primary font-mono">{{ fmtNum(takeHome) }} 元</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <span class="text-sm text-muted-foreground">− 能耗成本（{{ mode === 'fuel' ? '油车' : '电车' }}）</span>
              <span class="text-sm font-medium text-red-600 font-mono">−{{ fmtNum(energyCost) }} 元</span>
            </div>
            <p class="text-[11px] text-muted-foreground pl-2 pb-1">{{ energyDetailText }}</p>
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <span class="text-sm text-muted-foreground">− 日固定成本（{{ dailyRent > 0 ? '租车租金' : '自有车填 0' }}）</span>
              <span class="text-sm font-medium text-red-600 font-mono">−{{ fmtNum(dailyRent) }} 元</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <span class="text-sm text-muted-foreground">− 年摊日均{{ amortDetailText }}</span>
              <span class="text-sm font-medium text-red-600 font-mono">−{{ fmtNum(dailyAmort) }} 元</span>
            </div>
            <div class="flex items-center justify-between py-2.5 bg-muted/30 rounded px-2 mt-1">
              <span class="text-sm font-medium text-foreground">= 日净收入</span>
              <span class="text-base font-bold font-mono" :class="dailyNet !== null && dailyNet < 0 ? 'text-red-600' : 'text-green-600'">{{ fmtNum(dailyNet) }} 元</span>
            </div>
          </div>
        </div>

        <!-- 疲劳驾驶提醒 -->
        <div
          v-if="canCompute && fatigueHint"
          class="rounded-lg p-4 flex items-start gap-2 border"
          :class="fatigueHint.level === 'danger' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'"
        >
          <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" :class="fatigueHint.level === 'danger' ? 'text-red-600' : 'text-amber-600'" />
          <p class="text-xs leading-relaxed" :class="fatigueHint.level === 'danger' ? 'text-red-600' : 'text-amber-600'">{{ fatigueHint.text }}</p>
        </div>

        <!-- 诚实卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <TriangleAlert class="w-5 h-5 mr-2 text-amber-600" /> 诚实卡：算完先看这四条
          </h2>
          <div class="space-y-3">
            <div class="flex items-start gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
              <p class="text-xs text-muted-foreground leading-relaxed">
                <span class="text-foreground font-medium">高峰/平峰流水差异大：</span>早晚高峰、雨天、节假日流水可能是平峰的 2~3 倍，别按最好的一天填流水，按整月流水 ÷ 出车天数取平均才有参考价值。
              </p>
            </div>
            <div class="flex items-start gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
              <p class="text-xs text-muted-foreground leading-relaxed">
                <span class="text-foreground font-medium">空驶里程要算进总里程：</span>接单赶场的空驶、找充电桩/加油站的里程同样耗油耗电，里程以车辆总里程表或车主 App 为准，只填订单里程会把能耗成本低估两成以上。
              </p>
            </div>
            <div class="flex items-start gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></span>
              <p class="text-xs text-muted-foreground leading-relaxed">
                <span class="text-red-600 font-medium">疲劳驾驶红线：</span>连续驾驶 4 小时应停车休息至少 20 分钟，每日在线建议不超过 10 小时（本工具超时会自动提醒）。时薪是拿健康换的，安全永远比流水优先。
              </p>
            </div>
            <div class="flex items-start gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
              <p class="text-xs text-muted-foreground leading-relaxed">
                <span class="text-foreground font-medium">保险与资质别漏算：</span>合规网约车需要双证与营运保险，私家车按非营运保险跑营运，出险可能被拒赔——这一项风险成本差异巨大，务必按实际情况填年摊成本。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>网约车流水核算是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          网约车流水核算是给网约车司机的本地账本工具：输入日流水、平台抽成、日出车里程与能耗模式（油车按百公里油耗 × 油价，电车按百公里电耗 × 电价），
          再填日固定成本（租车租金/天）、年摊成本（保险 + 保养 + 折旧的年总额 ÷ 年出车天数）与在线时长，工具按
          「日净收入 = 日流水 ×（1 − 抽成%）− 能耗成本 − 日固定成本 − 年摊日均」逐项递减算出每天真正剩下的钱，
          再除以在线时长得到真实时薪，并与当地最低小时工资对比给出徽章提示，还会在在线超时（>10 小时/天）时给出疲劳驾驶提醒。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">适用场景</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-4">
          <li>想入行跑网约车：先按预估流水和租金算一遍，看扣完成本后时薪能不能接受，再决定签合同</li>
          <li>在职司机算真实账：抽成、油电、租金、保险折旧全扣完，看这单生意到底值不值</li>
          <li>油车换电车对比：同样的里程和流水，切换能耗模式看每天能省多少，估算换车回本周期</li>
          <li>租车还是自有车：两种成本结构分别填一遍，比比哪种方式时薪更高</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">计算公式与口径</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-4">
          <li>平台抽成额 = 日流水 × 抽成%</li>
          <li>到手流水 = 日流水 − 平台抽成额</li>
          <li>能耗成本 = 日里程 ÷ 100 × 百公里油耗（或电耗）× 油价（或电价）</li>
          <li>年摊日均 = （保险 + 保养 + 折旧的年总额）÷ 年出车天数</li>
          <li>日净收入 = 到手流水 − 能耗成本 − 日固定成本 − 年摊日均</li>
          <li>时薪 = 日净收入 ÷ 在线时长（与当地最低小时工资对比）</li>
        </ul>
        <p class="text-sm text-muted-foreground leading-relaxed">
          示例：日流水 600 元、抽成 25%，到手 450 元；油车跑 300 公里，8L/100km × 7.8 元/L 的能耗约 187.2 元；
          租车租金 150 元/天，保险保养折旧年摊 100 元/天，日净收入 12.8 元；在线 10 小时，时薪约 1.28 元——低于当地最低工资，
          说明要么流水还有空间、要么成本该降了。
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

    <RelatedTools :currentToolId="'ride-hailing-profit-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Car, Fuel, BatteryCharging, Gauge, Wallet, Calculator, Info,
  TriangleAlert, CheckCircle, RefreshCw, Play, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '网约车流水核算计算器 - 抽成/油电费/真实时薪在线计算',
  description: '免费在线网约车流水核算工具：输入日流水、平台抽成、里程与油电能耗，逐项扣除抽成、能耗、租金、保险折旧，算出真实日净收入与时薪，并与当地最低工资对比，纯本地计算不上传数据',
  keywords: '网约车流水,网约车时薪,跑滴滴赚钱吗,司机成本核算,网约车抽成,油车电车成本对比',
  author: '有条工具',
  ogTitle: '网约车流水核算 - 抽成/油电费/真实时薪在线计算 | 有条工具',
  ogDescription: '抽成、油电费、租金、保险折旧逐项扣，算出跑网约车的真实时薪，并与当地最低工资对比。',
  ogUrl: 'https://www.util.cn/tools/ride-hailing-profit-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '网约车流水核算计算器',
  twitterDescription: '逐项扣除抽成、能耗、租金与折旧，算出跑网约车的真实时薪。'
})

// 常见问题（与页面 SEO 区、JSON-LD FAQPage 保持一致）
const faqs = [
  {
    q: '网约车时薪怎么算？',
    a: '时薪 = 日净收入 ÷ 在线时长。日净收入 = 日流水 ×（1 − 平台抽成%）− 能耗成本 − 日固定成本 − 年摊日均。例：日流水 600 元、抽成 25%，到手 450 元；油车跑 300 公里按 8L/100km、7.8 元/L 约耗 187.2 元；租车租金 150 元/天，保险保养折旧年摊 100 元/天，日净收入 12.8 元；在线 10 小时，时薪约 1.28 元。'
  },
  {
    q: '平台抽成一般有多少？',
    a: '主流平台每单抽成大致在 20%~30% 区间，不同城市、不同订单类型会有差异，部分订单还叠加信息服务费。精确比例以司机端账单为准：用日流水 × 抽成比例应能对上账单里的平台服务费合计，对不上就按账单实际比例填。'
  },
  {
    q: '租车跑和开自有车，成本怎么填？',
    a: '租车跑：日租金折算进「日固定成本」，年摊成本只填自己承担的保险等项；自有车：「日固定成本」填 0，但保险、保养、折旧必须折算进「年摊成本」（年总额 ÷ 年出车天数），否则时薪会虚高。折旧可按购车价 ÷ 预计跑车年限粗估。'
  },
  {
    q: '为什么算出来的时薪比最低工资还低？',
    a: '常见原因：流水按高峰日虚填、里程只填订单里程漏了空驶、漏算保险折旧等年摊成本。先按整月流水 ÷ 出车天数填平均流水，把空驶算进里程重算；若时薪仍然偏低，优先考虑换电车降能耗、谈低租金、减少空驶与无效在线时长。'
  },
  {
    q: '一天在线多久合适？连续出车有时长红线吗？',
    a: '建议每日在线不超过 10 小时，连续驾驶 4 小时应停车休息至少 20 分钟，本工具在在线时长超过 10 小时会给出疲劳提醒、超过 12 小时给出红色警告。疲劳驾驶反应速度明显下降、事故率成倍上升，赶上高峰也别硬撑，安全永远比流水优先。'
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
          name: '网约车流水核算',
          url: 'https://www.util.cn/tools/ride-hailing-profit-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['平台抽成与到手流水计算', '油车/电车能耗成本对比', '租金与年摊成本（保险/保养/折旧）折算', '日净收入与真实时薪', '最低工资对比徽章', '疲劳驾驶时长提醒', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '网约车流水核算', item: 'https://www.util.cn/tools/ride-hailing-profit-calculator/' }
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
const FATIGUE_WARN_HOURS = 10   // 每日在线超过该值给出疲劳提醒
const FATIGUE_DANGER_HOURS = 12 // 每日在线超过该值给出红色警告

function round2(v) {
  return Math.round(v * 100) / 100
}

// 平台抽成额 = 日流水 × 抽成%；流水为负或抽成超出 [0,100] 视为非法
function commissionAmountOf(revenue, rate) {
  if (!isFinite(revenue) || revenue < 0) return null
  if (!isFinite(rate) || rate < 0 || rate > 100) return null
  return round2((revenue * rate) / 100)
}

// 到手流水 = 日流水 − 平台抽成额
function takeHomeOf(revenue, rate) {
  const fee = commissionAmountOf(revenue, rate)
  if (fee === null) return null
  return round2(revenue - fee)
}

// 能耗成本 = 里程 ÷ 100 × 百公里消耗 × 单价；任一输入非法返回 null
function energyCostOf(km, per100, unitPrice) {
  if (!isFinite(km) || km < 0) return null
  if (!isFinite(per100) || per100 < 0) return null
  if (!isFinite(unitPrice) || unitPrice < 0) return null
  return round2((km / 100) * per100 * unitPrice)
}

// 年摊日均 = 年摊成本 ÷ 年出车天数；出车天数 ≤ 0 为除零，返回 null
function dailyAmortOf(annualTotal, workingDays) {
  if (!isFinite(annualTotal) || annualTotal < 0) return null
  if (!isFinite(workingDays) || workingDays <= 0) return null
  return round2(annualTotal / workingDays)
}

// 日净收入 = 到手 − 能耗 − 日固定 − 年摊日均；任一项无效返回 null
function dailyNetOf(takeHome, energyCost, dailyFixed, dailyAmort) {
  const parts = [takeHome, energyCost, dailyFixed, dailyAmort]
  if (parts.some(v => v === null || v === undefined || !isFinite(v) || v < 0)) return null
  return round2(takeHome - energyCost - dailyFixed - dailyAmort)
}

// 时薪 = 日净收入 ÷ 在线时长；时长 ≤ 0 为除零，返回 null
function hourlyWageOf(dailyNet, hours) {
  if (dailyNet === null || dailyNet === undefined || !isFinite(dailyNet)) return null
  if (!isFinite(hours) || hours <= 0) return null
  return round2(dailyNet / hours)
}

// 年净收入估算 = 日净收入 × 年出车天数
function annualNetOf(dailyNet, workingDays) {
  if (dailyNet === null || dailyNet === undefined || !isFinite(dailyNet)) return null
  if (!isFinite(workingDays) || workingDays <= 0) return null
  return round2(dailyNet * workingDays)
}

// 单公里能耗成本（元/km）
function perKmCostOf(km, cost) {
  if (!isFinite(km) || km <= 0) return null
  if (cost === null || cost === undefined || !isFinite(cost)) return null
  return round2(cost / km)
}

// 时薪与当地最低工资对比徽章：亏损（红）/ 低于最低工资（黄）/ 达标（绿）
function wageBadgeOf(hourly, minWage) {
  if (hourly === null || hourly === undefined || !isFinite(hourly)) return null
  if (!isFinite(minWage) || minWage <= 0) return null
  if (hourly < 0) {
    return {
      key: 'loss',
      label: '日均亏损',
      chipClass: 'bg-red-500/10 text-red-600 border-red-500/20',
      desc: '扣完成本后每天还倒贴钱：先降能耗与固定成本、核实流水是否填对，跑得越多亏得越多。'
    }
  }
  if (hourly < minWage) {
    return {
      key: 'below',
      label: '低于最低工资',
      chipClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      desc: '时薪低于当地最低小时工资标准：先核对流水与成本有没有漏填，再考虑换电车、谈低租金、减少空驶。'
    }
  }
  return {
    key: 'ok',
    label: '达到/超过最低工资',
    chipClass: 'bg-green-500/10 text-green-600 border-green-500/20',
    desc: '时薪达到或超过当地最低小时工资标准；注意这是毛时薪口径，社保、事故风险与休息日成本尚未计入。'
  }
}

// 疲劳驾驶提醒：>10 小时黄色提醒，>12 小时红色警告；连续驾驶红线为 4 小时
function fatigueHintOf(hours) {
  if (!isFinite(hours) || hours <= 0) return null
  if (hours > FATIGUE_DANGER_HOURS) {
    return {
      level: 'danger',
      text: `在线时长 ${hours} 小时已超过 12 小时：疲劳驾驶状态下事故风险成倍上升。红线是连续驾驶 4 小时必须休息 20 分钟以上，请立即压缩在线时长。`
    }
  }
  if (hours > FATIGUE_WARN_HOURS) {
    return {
      level: 'warn',
      text: `在线时长 ${hours} 小时超过 10 小时建议上限：连续驾驶 4 小时应停车休息至少 20 分钟。久坐与熬夜会明显拉低反应速度，健康亏空比流水亏空更难补。`
    }
  }
  return null
}

// ---------- 输入状态 ----------
const DEFAULTS = {
  revenue: 600, rate: 25, km: 300, mode: 'fuel',
  fuelPer100: 8, fuelPrice: 7.8, elecPer100: 15, elecPrice: 1.0,
  dailyRent: 150, annualTotal: 36000, workingDays: 360, hours: 10, minWage: 22
}
// 示例：电车自有车司机，成本结构更轻，时薪明显更高（与默认油车租车场景对照）
const EXAMPLE = {
  revenue: 650, rate: 25, km: 300, mode: 'electric',
  fuelPer100: 8, fuelPrice: 7.8, elecPer100: 15, elecPrice: 1.0,
  dailyRent: 0, annualTotal: 12000, workingDays: 300, hours: 9, minWage: 22
}

const revenueInput = ref(DEFAULTS.revenue)
const rateInput = ref(DEFAULTS.rate)
const kmInput = ref(DEFAULTS.km)
const mode = ref(DEFAULTS.mode)
const fuelPer100Input = ref(DEFAULTS.fuelPer100)
const fuelPriceInput = ref(DEFAULTS.fuelPrice)
const elecPer100Input = ref(DEFAULTS.elecPer100)
const elecPriceInput = ref(DEFAULTS.elecPrice)
const dailyRentInput = ref(DEFAULTS.dailyRent)
const annualTotalInput = ref(DEFAULTS.annualTotal)
const workingDaysInput = ref(DEFAULTS.workingDays)
const hoursInput = ref(DEFAULTS.hours)
const minWageInput = ref(DEFAULTS.minWage)
const seoContentVisible = ref(true)

// 空输入/非法输入统一按 0 处理
function numOf(v) {
  const n = Number(v)
  return isFinite(n) ? n : 0
}

const revenue = computed(() => Math.max(0, numOf(revenueInput.value)))
const rate = computed(() => Math.min(100, Math.max(0, numOf(rateInput.value))))
const km = computed(() => Math.max(0, numOf(kmInput.value)))
const fuelPer100 = computed(() => Math.max(0, numOf(fuelPer100Input.value)))
const fuelPrice = computed(() => Math.max(0, numOf(fuelPriceInput.value)))
const elecPer100 = computed(() => Math.max(0, numOf(elecPer100Input.value)))
const elecPrice = computed(() => Math.max(0, numOf(elecPriceInput.value)))
const dailyRent = computed(() => Math.max(0, numOf(dailyRentInput.value)))
const annualTotal = computed(() => Math.max(0, numOf(annualTotalInput.value)))
const workingDays = computed(() => numOf(workingDaysInput.value))
const hours = computed(() => numOf(hoursInput.value))
const minWage = computed(() => Math.max(0, numOf(minWageInput.value)))

const inputWarning = computed(() => {
  if (revenue.value <= 0) return '请先填写大于 0 的日流水（元/天），按整月流水 ÷ 出车天数填平均更准。'
  if (hours.value <= 0) return '请填写大于 0 的在线时长（小时/天），否则无法折算时薪。'
  if (annualTotal.value > 0 && workingDays.value <= 0) return '年摊成本大于 0 时需填写大于 0 的年出车天数；若没有保险/折旧等年成本，请把年摊成本填 0。'
  return ''
})
const canCompute = computed(() => inputWarning.value === '')

// ---------- 派生计算 ----------
const commissionAmount = computed(() => commissionAmountOf(revenue.value, rate.value))
const takeHome = computed(() => takeHomeOf(revenue.value, rate.value))
const energyCost = computed(() =>
  mode.value === 'fuel'
    ? energyCostOf(km.value, fuelPer100.value, fuelPrice.value)
    : energyCostOf(km.value, elecPer100.value, elecPrice.value)
)
// 年摊成本填 0 时无需出车天数即可视为 0；大于 0 时才要求年出车天数有效
const dailyAmort = computed(() =>
  annualTotal.value > 0 ? dailyAmortOf(annualTotal.value, workingDays.value) : 0
)
const dailyNet = computed(() => dailyNetOf(takeHome.value, energyCost.value, dailyRent.value, dailyAmort.value))
const hourlyWage = computed(() => hourlyWageOf(dailyNet.value, hours.value))
const wageBadge = computed(() => wageBadgeOf(hourlyWage.value, minWage.value))
const annualNet = computed(() => annualNetOf(dailyNet.value, workingDays.value))
const perKmCost = computed(() => perKmCostOf(km.value, energyCost.value))
const fatigueHint = computed(() => fatigueHintOf(hours.value))

const energyDetailText = computed(() => {
  if (mode.value === 'fuel') {
    return `${fmtNum(km.value)} km ÷ 100 × ${fmtNum(fuelPer100.value)} L/100km × ${fmtNum(fuelPrice.value)} 元/L`
  }
  return `${fmtNum(km.value)} km ÷ 100 × ${fmtNum(elecPer100.value)} kWh/100km × ${fmtNum(elecPrice.value)} 元/kWh`
})
const amortDetailText = computed(() =>
  annualTotal.value > 0 ? `（${fmtNum(annualTotal.value)} ÷ ${fmtNum(workingDays.value)} 天）` : '（无年摊成本）'
)
const perKmText = computed(() => (perKmCost.value === null ? '—' : fmtNum(perKmCost.value)))

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
  revenueInput.value = EXAMPLE.revenue
  rateInput.value = EXAMPLE.rate
  kmInput.value = EXAMPLE.km
  mode.value = EXAMPLE.mode
  fuelPer100Input.value = EXAMPLE.fuelPer100
  fuelPriceInput.value = EXAMPLE.fuelPrice
  elecPer100Input.value = EXAMPLE.elecPer100
  elecPriceInput.value = EXAMPLE.elecPrice
  dailyRentInput.value = EXAMPLE.dailyRent
  annualTotalInput.value = EXAMPLE.annualTotal
  workingDaysInput.value = EXAMPLE.workingDays
  hoursInput.value = EXAMPLE.hours
  minWageInput.value = EXAMPLE.minWage
}
function resetInputs() {
  revenueInput.value = DEFAULTS.revenue
  rateInput.value = DEFAULTS.rate
  kmInput.value = DEFAULTS.km
  mode.value = DEFAULTS.mode
  fuelPer100Input.value = DEFAULTS.fuelPer100
  fuelPriceInput.value = DEFAULTS.fuelPrice
  elecPer100Input.value = DEFAULTS.elecPer100
  elecPriceInput.value = DEFAULTS.elecPrice
  dailyRentInput.value = DEFAULTS.dailyRent
  annualTotalInput.value = DEFAULTS.annualTotal
  workingDaysInput.value = DEFAULTS.workingDays
  hoursInput.value = DEFAULTS.hours
  minWageInput.value = DEFAULTS.minWage
}
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('ride-hailing-profit-calculator')
})
</script>
