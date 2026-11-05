<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <PieChart class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">PWM 占空比换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">占空比 ↔ 平均电压 / RMS 有效值 / 脉宽 三向换算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入电源电压、频率与占空比，一次给出三向并列换算：平均电压 Vavg = D×Vcc、有效值 Vrms = Vcc×√D，以及交流分量注记；负载视角按「平均口径 vs RMS 口径」双列对照，注明各自适用场景——LED 调光看平均、加热/白炽按发热走 RMS；时序换算给出周期、导通时间 t_on = D/f 与关断时间；并支持反向求解：想要目标平均电压，反推所需占空比。附 PWM 频率选择速查与 buck 关系说明，全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 输入与三向换算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 输入与三向换算
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Vcc -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">电源电压 Vcc（V）</label>
              <div class="flex flex-wrap gap-1.5 mb-2">
                <button
                  v-for="v in vccPresets"
                  :key="v"
                  @click="vcc = v"
                  :class="vcc === v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                >{{ v }} V</button>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="vcc"
                  type="number"
                  min="0"
                  step="any"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="PWM 高电平幅值"
                />
                <span class="text-sm text-muted-foreground">V</span>
              </div>
            </div>
            <!-- 频率 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">PWM 频率 f（Hz）</label>
              <div class="flex flex-wrap gap-1.5 mb-2">
                <button
                  v-for="p in fPresets"
                  :key="p.val"
                  @click="freq = p.val"
                  :class="freq === p.val ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                >{{ p.label }}</button>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="freq"
                  type="number"
                  min="0"
                  step="any"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="如 1000"
                />
                <span class="text-sm text-muted-foreground">Hz</span>
              </div>
            </div>
          </div>

          <!-- 占空比滑杆 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">占空比 D（%）：高电平时间占整个周期的比例</label>
            <div class="flex items-center gap-3">
              <input
                v-model.number="dPct"
                type="range"
                min="0"
                max="100"
                step="1"
                class="flex-1 cursor-pointer accent-primary"
              />
              <input
                v-model.number="dPct"
                type="number"
                min="0"
                max="100"
                step="0.1"
                class="w-24 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span class="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <!-- 三向并列结果 -->
          <div v-if="duty !== null" class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">平均电压 Vavg = D × Vcc</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(vavg, 3) }} V</p>
                <p class="text-[10px] text-muted-foreground mt-1">万用表直流档读到的值</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">有效值 Vrms = Vcc × √D</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(vrms, 3) }} V</p>
                <p class="text-[10px] text-muted-foreground mt-1">发热等效的直流电压</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">交流分量 V_ac(rms)</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(vac, 3) }} V</p>
                <p class="text-[10px] text-muted-foreground mt-1">= √(Vrms² − Vavg²)，峰峰恒为 Vcc</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              波形在 0 与 {{ fmt(vcc, 2) }} V 之间高速开关：交流分量有效值 = Vcc×√(D(1−D))，D=50% 时最大（Vcc/2 = {{ fmt(vcc / 2, 2) }} V），D→0% 或 100% 时趋于 0；隔直电容后只剩这个交流分量。计算式：Vavg = {{ fmt(duty, 3) }} × {{ fmt(vcc, 2) }} = {{ fmt(vavg, 3) }} V；Vrms = {{ fmt(vcc, 2) }} × √{{ fmt(duty, 3) }} = {{ fmt(vrms, 3) }} V。
            </p>
          </div>
          <div v-else class="p-6 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
            请输入有效的电源电压（大于 0）；占空比在 0~100% 之间。
          </div>
        </div>

        <!-- 负载视角：双口径 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Split class="w-5 h-5 mr-2 text-primary" /> 负载视角：平均口径 vs RMS 口径
          </h2>
          <div v-if="duty !== null" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="border border-border rounded-lg p-4 space-y-2">
              <p class="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center">
                <Lightbulb class="w-4 h-4 mr-1.5" /> 平均口径：等效直流 {{ fmt(vavg, 2) }} V
              </p>
              <p class="text-xs text-muted-foreground leading-relaxed">
                负载按「一段时间的平均电压 / 平均电流」响应。占空比即平均电压比例：D={{ fmt(dPct, 1) }}% → Vavg = {{ fmt(vavg, 3) }} V，相当于接到 {{ fmt(vavg, 3) }} V 直流。
              </p>
              <ul class="text-xs text-muted-foreground leading-relaxed list-disc pl-4 space-y-1">
                <li>LED 调光：平均电流决定亮度，近似线性（人眼再对数一次）</li>
                <li>平均电流 / 平均功耗预算、电镀与电解的平均量</li>
                <li>有源器件的静态工作点估算</li>
              </ul>
            </div>
            <div class="border border-border rounded-lg p-4 space-y-2">
              <p class="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center">
                <Flame class="w-4 h-4 mr-1.5" /> RMS 口径：等效发热 {{ fmt(vrms, 2) }} V
              </p>
              <p class="text-xs text-muted-foreground leading-relaxed">
                发热功率按 P = Vrms²/R = D × Vcc²/R 走：D={{ fmt(dPct, 1) }}% 时发热是满开的 {{ fmt(duty * 100, 1) }}%，相当于接到 {{ fmt(vrms, 3) }} V 直流（注意是 √D 不是 D）。
              </p>
              <ul class="text-xs text-muted-foreground leading-relaxed list-disc pl-4 space-y-1">
                <li>加热器 / 白炽灯：热惯性大，按瞬时功率积分发热，跟 RMS 走</li>
                <li>电阻负载功耗、保险丝与线缆的温升校核</li>
                <li>电机铜损等 I²R 类损耗估算</li>
              </ul>
            </div>
          </div>
          <p v-if="duty !== null" class="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3">
            对纯电阻负载，两种口径算出的功率一致（都是 D × 满载功率），差别在负载「感受」的是哪个电压：LED 看平均电流，热惯性负载看发热等效。两个口径都列出，按负载类型对号入座。
          </p>
        </div>

        <!-- 时序与反向 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Timer class="w-5 h-5 mr-2 text-primary" /> 时序换算与反向求解
          </h2>

          <div v-if="duty !== null && period !== null" class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">周期 T = 1/f</p>
              <p class="text-xl font-bold text-foreground">{{ fmtTime(period) }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">导通时间 t_on = D/f</p>
              <p class="text-xl font-bold text-primary">{{ fmtTime(tOn) }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">关断时间 t_off = (1−D)/f</p>
              <p class="text-xl font-bold text-foreground">{{ fmtTime(tOff) }}</p>
            </div>
          </div>

          <!-- 反向：目标 Vavg 求 D -->
          <div class="border border-border rounded-lg p-4 space-y-3">
            <h3 class="text-sm font-medium text-foreground flex items-center">
              <Undo2 class="w-4 h-4 mr-2 text-primary" /> 反向：目标平均电压 → 占空比
            </h3>
            <div class="flex items-center gap-2">
              <input
                v-model.number="vavgTarget"
                type="number"
                min="0"
                step="any"
                class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="想要的平均电压（V）"
              />
              <span class="text-sm text-muted-foreground">V</span>
            </div>
            <div v-if="reverseResult" class="bg-muted/50 rounded-lg p-3 text-sm leading-relaxed">
              D = V目标 / Vcc = {{ fmt(vavgTarget, 2) }} / {{ fmt(vcc, 2) }} = <span class="text-primary font-bold">{{ fmt(reverseResult.duty * 100, 2) }}%</span>，
              对应 Vrms = {{ fmt(reverseResult.vrms, 3) }} V、t_on = {{ fmtTime(reverseResult.tOn) }}。
            </div>
            <p v-else class="text-xs text-amber-600 dark:text-amber-400">
              目标平均电压需满足 0 ≤ V目标 ≤ Vcc = {{ fmt(vcc, 2) }} V（PWM 平均电压不可能超过电源电压；想要更高请看 buck 降压/升压拓扑）。
            </p>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 快速自核示例 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <FlaskConical class="w-4 h-4 mr-2 text-primary" /> 快速自核示例
          </h2>
          <div class="space-y-2">
            <button
              @click="loadExample('a')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              Vcc=12V、D=25% → <span class="text-foreground font-medium">Vavg=3 V、Vrms=6 V</span>
            </button>
            <button
              @click="loadExample('b')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              f=1kHz、D=25% → <span class="text-foreground font-medium">t_on=250 µs、t_off=750 µs</span>
            </button>
            <button
              @click="loadExample('c')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              12V 电源想要 3V 平均 → <span class="text-foreground font-medium">D=25%</span>
            </button>
            <button
              @click="loadExample('d')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              Vcc=12V、D=50% → <span class="text-foreground font-medium">Vrms=8.49 V、交流分量最大 6 V</span>
            </button>
          </div>
        </div>

        <!-- PWM 频率速查 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Gauge class="w-4 h-4 mr-2 text-primary" /> PWM 频率选择速查
          </h2>
          <ul class="text-xs text-muted-foreground leading-relaxed space-y-2 list-disc pl-4">
            <li>LED 调光：≥200 Hz 起步（避开人眼可感频闪），摄影场景再拉高避免卷帘快门条纹。</li>
            <li>Arduino 硬件 PWM：D5/D6 约 980 Hz，D9/D10 约 490 Hz（analogWrite 默认）。</li>
            <li>风扇 / 无感电机：20~25 kHz，搬到人耳音频之外消除啸叫。</li>
            <li>加热 / 白炽：几十 Hz 足够，热惯性天然滤波；频率过高反而增加开关损耗。</li>
            <li>buck 开关电源：100 kHz~2 MHz，频率越高电感越小但开关损耗越大。</li>
          </ul>
        </div>

        <!-- 一句话原理 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 一句话原理
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            PWM 不调电压幅值，只调「开」的时间比例：引脚在 0 与 Vcc 之间高速开关，占空比 D 就是高电平占比。对惯性负载（眼睛、灯丝、加热体、配合 LC 的电源）来说，效果等效于一个 D 或 √D 比例的直流——这就是用开关管省掉线性调压发热的全部秘密。
          </p>
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
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-8">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>PWM 占空比原理与口径</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <h3 class="text-lg font-semibold text-foreground">PWM 是什么？一句话原理</h3>
          <p>
            PWM（脉冲宽度调制）就是用全幅值的方波高速开关，通过改<strong>高电平时间占整个周期的比例（占空比 D）</strong>来控制等效输出：电压幅值永远只有 0 和 Vcc 两档，但惯性负载感受到的是 D×Vcc 的平均效果。它比线性调压（LDO、电阻分压）高效得多——开关管要么全开（压降近零）要么全关（电流为零），自身几乎不发热。这也是它和 buck 降压的共同基因：buck 就是「PWM + 开关管 + LC 滤波」，把开关波形滤回连续直流；不接 LC 滤波、直接交给负载，就是本工具计算的裸 PWM。想进一步算 buck 的电感与纹波，可以用 <NuxtLink to="/tools/buck-inductor-calculator" class="text-primary hover:underline">buck 电感计算器</NuxtLink>。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么 RMS 和平均不一样？</h3>
          <p>
            平均值回答「一段时间里等效叠了多少直流」，RMS（方均根）回答「同样的发热能力对应多大的直流」——它对电压平方求平均再开根，天生偏袒大数值。0/12V 方波在 D=25% 时：平均值 = 0.25×12 = 3 V，但 RMS = 12×√0.25 = 6 V，因为开着的 25% 时间里功率是满开的（P=V²/R，平方放大）。两者只在恒定直流时相等，PWM 下 Vrms = √D×Vcc 恒大于 Vavg = D×Vcc（0&lt;D&lt;1），差值就是交流分量 √(Vrms²−Vavg²) = Vcc×√(D(1−D))。
          </p>
          <h3 class="text-lg font-semibold text-foreground">LED 调光用平均、加热用 RMS</h3>
          <p>
            LED 亮度由正向电流对时间的平均决定（光通量近似随平均电流线性），所以调光看 D×Vcc 的平均口径；白炽灯和加热器是电阻发热，瞬时功率 P(t)=V(t)²/R 由 RMS 决定，热惯性把开关波动积分掉，体感温度跟 Vrms=√D×Vcc 走。选错口径会差很多：D=25% 时 LED 大约 25% 亮度，但接「12V 的 25%」若误按 3V 去估算加热器功率会差 √ 倍关系——发热等效其实是 6V。电机介于两者之间：平均转矩看平均电流，铜损看 RMS 电流。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">万用表测 PWM 测到的是 Vavg 还是 Vrms？</span>直流档测的是平均值（D×Vcc），真有效值表的交流档测的是交流分量，交流+直流档才接近 Vrms。没有真有效值表时，直接按本工具公式换算更可靠。</li>
            <li><span class="text-foreground font-medium">为什么加热器说「发热按 √D 口径」？</span>发热等效直流电压是 Vrms = √D×Vcc——D=25% 时等效 6V 而不是 3V；功率比才是 D（Vrms²/Vcc² = D）。电压按 √D、功率按 D，两个说法不矛盾。</li>
            <li><span class="text-foreground font-medium">占空比 50% 时交流分量为什么最大？</span>V_ac = Vcc×√(D(1−D))，D=0.5 时取最大值 Vcc/2（12V 系统即 6V）；D 趋向 0% 或 100% 时波形趋近恒定直流，交流分量趋于 0。隔直后看纹波、算耦合电容都按这个量级估。</li>
            <li><span class="text-foreground font-medium">PWM 和 buck 是什么关系？</span>buck 就是 PWM 加开关管再加 LC 低通滤波：把 0/Vcc 方波滤成连续的 D×Vcc 直流，纹波由 L 和 C 决定。裸 PWM 没有 LC，靠负载自身惯性「滤波」。需要算电感选型时参见 buck-inductor-calculator。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'duty-cycle-converter'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { PieChart, Calculator, Timer, Split, Lightbulb, Flame, Undo2, Gauge, Info, FlaskConical, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'PWM占空比换算器 - 平均电压/RMS/脉宽在线计算 | Util工具箱',
  description: '在线 PWM 占空比换算：Vavg=D×Vcc 平均电压、Vrms=Vcc×√D 有效值、交流分量注记，周期与脉宽 t_on=D/f 换算，平均 vs RMS 双负载口径对照（LED 看平均、加热看 RMS），支持目标平均电压反推占空比，纯本地计算',
  keywords: 'pwm占空比, 占空比换算, 平均电压, rms有效值, 脉宽计算, pwm调光, led调光, pwm加热, duty cycle calculator, pwm计算',
  author: 'Util工具箱',
  ogTitle: 'PWM占空比换算器 - 平均电压/RMS/脉宽',
  ogDescription: '占空比 ↔ 平均电压 / RMS / 脉宽三向换算，双负载口径对照',
  ogUrl: 'https://www.util.cn/tools/duty-cycle-converter',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'PWM占空比换算器',
  twitterDescription: '占空比 ↔ 平均电压 / RMS / 脉宽三向换算'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'PWM占空比换算器',
          url: 'https://www.util.cn/tools/duty-cycle-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['占空比 → 平均电压 Vavg=D×Vcc', '占空比 → 有效值 Vrms=Vcc×√D', '交流分量 Vcc×√(D(1−D)) 注记', '周期 / 脉宽 t_on=D/f 换算', '目标平均电压反推占空比', '平均 vs RMS 负载口径对照']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: 'PWM占空比换算器', item: 'https://www.util.cn/tools/duty-cycle-converter' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '万用表测 PWM 测到的是 Vavg 还是 Vrms？',
              acceptedAnswer: { '@type': 'Answer', text: '直流档测的是平均值（D×Vcc），真有效值表交流档测的是交流分量，交流+直流档才接近 Vrms。没有真有效值表时直接按公式换算更可靠。' }
            },
            {
              '@type': 'Question',
              name: '为什么加热器说发热按 √D 口径？',
              acceptedAnswer: { '@type': 'Answer', text: '发热等效直流电压是 Vrms = √D×Vcc（D=25% 时等效 6V 而非 3V），功率比则是 D（Vrms²/Vcc²=D）。电压按 √D、功率按 D，两个说法不矛盾。' }
            },
            {
              '@type': 'Question',
              name: '占空比 50% 时交流分量为什么最大？',
              acceptedAnswer: { '@type': 'Answer', text: 'V_ac = Vcc×√(D(1−D))，D=0.5 时取最大值 Vcc/2；D 趋向 0% 或 100% 时波形趋近恒定直流，交流分量趋于 0。' }
            },
            {
              '@type': 'Question',
              name: 'PWM 和 buck 是什么关系？',
              acceptedAnswer: { '@type': 'Answer', text: 'buck 就是 PWM 加开关管再加 LC 低通滤波，把 0/Vcc 方波滤成连续的 D×Vcc 直流；裸 PWM 不带 LC，靠负载自身惯性滤波。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'duty-cycle-converter'
const STORE_KEY = TOOL_ID + ':inputs'
const tool = tools.find(t => t.id === TOOL_ID)

// ==== PURE-FNS-START（纯计算函数，供单测逐行校验）====
const dcOk = (x) => typeof x === 'number' && isFinite(x)

// 占空比有效性：0 ≤ D ≤ 1（duty 传入小数口径）
const dcValidDuty = (d) => dcOk(d) && d >= 0 && d <= 1

// 平均电压 Vavg = D × Vcc
const dcVavg = (vcc, d) => {
  if (!dcOk(vcc) || !(vcc > 0) || !dcValidDuty(d)) return NaN
  return vcc * d
}

// 有效值 Vrms = Vcc × √D
const dcVrms = (vcc, d) => {
  if (!dcOk(vcc) || !(vcc > 0) || !dcValidDuty(d)) return NaN
  return vcc * Math.sqrt(d)
}

// 交流分量有效值 V_ac = Vcc × √(D(1−D))，D=50% 时最大 Vcc/2
const dcVacRms = (vcc, d) => {
  if (!dcOk(vcc) || !(vcc > 0) || !dcValidDuty(d)) return NaN
  return vcc * Math.sqrt(d * (1 - d))
}

// 周期 T = 1/f（秒）
const dcPeriod = (f) => {
  if (!dcOk(f) || !(f > 0)) return NaN
  return 1 / f
}

// 导通时间 t_on = D / f（秒）
const dcTOn = (f, d) => {
  if (!dcOk(f) || !(f > 0) || !dcValidDuty(d)) return NaN
  return d / f
}

// 关断时间 t_off = (1 − D) / f（秒）
const dcTOff = (f, d) => {
  if (!dcOk(f) || !(f > 0) || !dcValidDuty(d)) return NaN
  return (1 - d) / f
}

// 反向：目标平均电压 → 占空比 D = V目标 / Vcc（0 ≤ V目标 ≤ Vcc）
const dcDutyFromVavg = (vcc, vavg) => {
  if (!dcOk(vcc) || !(vcc > 0) || !dcOk(vavg) || vavg < 0 || vavg > vcc) return NaN
  return vavg / vcc
}

// 电阻负载功率比（相对满开 D=100%）：P/P_full = D，发热等效电压是 √D 口径
const dcResistivePowerRatio = (d) => {
  if (!dcValidDuty(d)) return NaN
  return d
}
// ==== PURE-FNS-END ====

// ---------- 状态 ----------
const vcc = ref(12)
const freq = ref(1000)
const dPct = ref(25)
const vavgTarget = ref(3)

const vccPresets = [3.3, 5, 12, 24]
const fPresets = [
  { label: '50 工频', val: 50 },
  { label: '490 Arduino', val: 490 },
  { label: '1k', val: 1000 },
  { label: '10k', val: 10000 },
  { label: '25k 风扇', val: 25000 }
]

// 交互记录与输入持久化（SSR 安全：localStorage 仅在客户端执行）
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_KEY) : null
    if (raw) {
      const s = JSON.parse(raw)
      const nums = { vcc, freq, dPct, vavgTarget }
      for (const k of Object.keys(nums)) if (typeof s[k] === 'number') nums[k].value = s[k]
    }
  } catch (e) { /* 忽略恢复失败 */ }
})

const persist = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      vcc: vcc.value, freq: freq.value, dPct: dPct.value, vavgTarget: vavgTarget.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}
watch([vcc, freq, dPct, vavgTarget], persist)

// ---------- 数字格式化（避免浮点尾差） ----------
const fmt = (v, digits = 2) => {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  return Number(v.toFixed(digits)).toLocaleString('zh-CN', { maximumFractionDigits: digits })
}
const fmtTime = (s) => {
  if (typeof s !== 'number' || !isFinite(s)) return '—'
  if (s >= 1) return fmt(s, 3) + ' s'
  if (s >= 1e-3) return fmt(s * 1e3, 3) + ' ms'
  if (s >= 1e-6) return fmt(s * 1e6, 3) + ' µs'
  return fmt(s * 1e9, 3) + ' ns'
}

// ---------- 计算态 ----------
const duty = computed(() => {
  const d = typeof dPct.value === 'number' ? dPct.value / 100 : NaN
  return dcValidDuty(d) && dcOk(vcc.value) && vcc.value > 0 ? d : null
})

const vavg = computed(() => (duty.value !== null ? dcVavg(vcc.value, duty.value) : NaN))
const vrms = computed(() => (duty.value !== null ? dcVrms(vcc.value, duty.value) : NaN))
const vac = computed(() => (duty.value !== null ? dcVacRms(vcc.value, duty.value) : NaN))

const period = computed(() => {
  const t = dcPeriod(freq.value)
  return isFinite(t) ? t : null
})
const tOn = computed(() => (duty.value !== null ? dcTOn(freq.value, duty.value) : NaN))
const tOff = computed(() => (duty.value !== null ? dcTOff(freq.value, duty.value) : NaN))

const reverseResult = computed(() => {
  const d = dcDutyFromVavg(vcc.value, vavgTarget.value)
  if (!isFinite(d)) return null
  return { duty: d, vrms: dcVrms(vcc.value, d), tOn: dcTOn(freq.value, d) }
})

// ---------- 交互 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const loadExample = (kind) => {
  if (kind === 'a') {
    vcc.value = 12; dPct.value = 25
  } else if (kind === 'b') {
    freq.value = 1000; dPct.value = 25
  } else if (kind === 'c') {
    vcc.value = 12; vavgTarget.value = 3; dPct.value = 25
  } else if (kind === 'd') {
    vcc.value = 12; dPct.value = 50
  }
}
</script>
