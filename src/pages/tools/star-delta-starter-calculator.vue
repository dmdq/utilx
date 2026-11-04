<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Triangle class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">星三角启动计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">Y-△ 启动电流 / 接触器与热继电器选型 / 适用性判断，风机、水泵类降压启动回路快速核算工具</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线星三角启动计算器：输入电机额定功率、电压与功率因数、效率，反算额定电流 IN（也可直接填写铭牌电流），
        按 K 倍启动电流估算直接启动电流与 Y-△ 降压启动电流（约为直接启动的 1/3），并给出主接触器、△接触器、Y 接触器与热继电器的选型电流
        （主/△/Y 按 1.0 / 0.58 / 0.58 ×IN 估算，0.58 ≈ 1/√3）与 Y 接相电压。附适用性提示与转换时间说明。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 诚实口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        本工具按 380V △接法电机、启动倍数 K 的工程常用口径估算，接触器按 AC-3 使用类别选型时请对照厂家样本的额定工作电流；
        实际启动电流与倍数随电机型号、负载惯量与端电压有明显出入（K 通常 5.5–7.5），选型结论请以电机铭牌、接触器样本和保护整定计算书为准。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：输入参数 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 电机参数
        </h2>

        <div>
          <label :for="uid + '-p'" class="block text-sm font-medium text-foreground">额定功率 P（kW）</label>
          <input
            :id="uid + '-p'"
            v-model.number="powerKw"
            type="number"
            min="0.1"
            max="1000"
            step="0.1"
            class="w-full mt-1.5 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="如 15"
          >
        </div>

        <div>
          <label :for="uid + '-u'" class="block text-sm font-medium text-foreground">额定电压 U（V）</label>
          <input
            :id="uid + '-u'"
            v-model.number="voltage"
            type="number"
            min="100"
            max="10000"
            step="1"
            class="w-full mt-1.5 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
          <p class="text-xs text-muted-foreground mt-1">Y-△ 启动默认按 380V △接法口径，也可改 660V 等线电压</p>
        </div>

        <div>
          <p class="text-sm font-medium text-foreground">额定电流 IN 输入方式</p>
          <div class="flex rounded-lg border border-border overflow-hidden mt-1.5" role="group" aria-label="额定电流输入方式">
            <button
              type="button"
              @click="inMode = 'calc'"
              class="flex-1 px-3 py-1.5 text-xs font-medium transition"
              :class="inMode === 'calc' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              按功率反算
            </button>
            <button
              type="button"
              @click="inMode = 'manual'"
              class="flex-1 px-3 py-1.5 text-xs font-medium transition"
              :class="inMode === 'manual' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              直接填铭牌电流
            </button>
          </div>
        </div>

        <div v-if="inMode === 'calc'" class="grid grid-cols-2 gap-3">
          <div>
            <label :for="uid + '-cos'" class="block text-sm font-medium text-foreground">功率因数 cosφ</label>
            <input
              :id="uid + '-cos'"
              v-model.number="cosPhi"
              type="number"
              min="0.5"
              max="1"
              step="0.01"
              class="w-full mt-1.5 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <p class="text-xs text-muted-foreground mt-1">默认 0.85，以铭牌为准</p>
          </div>
          <div>
            <label :for="uid + '-eta'" class="block text-sm font-medium text-foreground">效率 η</label>
            <input
              :id="uid + '-eta'"
              v-model.number="efficiency"
              type="number"
              min="0.5"
              max="1"
              step="0.01"
              class="w-full mt-1.5 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <p class="text-xs text-muted-foreground mt-1">默认 0.9，以铭牌为准</p>
          </div>
        </div>
        <div v-else>
          <label :for="uid + '-in'" class="block text-sm font-medium text-foreground">额定电流 IN（A）</label>
          <input
            :id="uid + '-in'"
            v-model.number="ratedCurrent"
            type="number"
            min="0.1"
            max="5000"
            step="0.1"
            class="w-full mt-1.5 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="如 29.8"
          >
          <p class="text-xs text-muted-foreground mt-1">铭牌额定电流最准，优先采用</p>
        </div>

        <div>
          <label :for="uid + '-k'" class="block text-sm font-medium text-foreground">直接启动电流倍数 K</label>
          <div class="flex gap-2 mt-1.5">
            <input
              :id="uid + '-k'"
              v-model.number="startMultiplier"
              type="number"
              min="4"
              max="10"
              step="0.1"
              class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <span class="flex items-center px-1 text-sm text-muted-foreground">× IN</span>
          </div>
          <p class="text-xs text-muted-foreground mt-1">笼型电机全压启动常用 6–7 倍，默认 7；铭牌标注 Ip/IN 时按铭牌填</p>
        </div>

        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">场景预设（期望值已手算核对）</p>
          <div class="space-y-2">
            <button
              v-for="p in presets"
              :key="p.name"
              type="button"
              @click="applyPreset(p)"
              class="w-full text-left px-3 py-2 bg-muted/50 hover:bg-muted border border-border rounded-lg text-xs transition"
            >
              <Play class="w-3.5 h-3.5 inline mr-1.5 text-primary -mt-0.5" />
              <span class="font-medium text-foreground">{{ p.name }}</span>
              <span class="text-muted-foreground"> · {{ p.desc }} · 预期 {{ p.expect }}</span>
            </button>
          </div>
        </div>

        <button
          @click="onCompute"
          class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 计算启动电流与选型
        </button>

        <button
          @click="resetInputs"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          重置默认参数
        </button>
      </div>

      <!-- 右：结果区 -->
      <div class="space-y-4">
        <!-- 核心结果卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 启动电流对比
          </h2>

          <div v-if="inputsValid" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">额定电流 IN</p>
                <p class="text-2xl font-bold text-foreground">{{ n1(ratedCurrentEff) }}<span class="text-base"> A</span></p>
                <p class="text-xs text-muted-foreground mt-1.5">{{ inModeLabel }}</p>
              </div>
              <div class="bg-red-500/10 rounded-lg p-4 text-center border border-red-500/20">
                <p class="text-xs text-muted-foreground mb-1">直接启动电流（{{ n1(startMultiplier) }}×IN）</p>
                <p class="text-2xl font-bold text-foreground">{{ n0(directStartCurrent) }}<span class="text-base"> A</span></p>
                <p class="text-xs text-muted-foreground mt-1.5">全压启动冲击</p>
              </div>
              <div class="bg-primary/10 rounded-lg p-4 text-center border border-primary/30">
                <p class="text-xs text-muted-foreground mb-1">Y-△ 启动电流</p>
                <p class="text-3xl font-bold leading-tight text-primary">{{ n1(ydStartCurrent) }}<span class="text-lg"> A</span></p>
                <p class="text-xs text-muted-foreground mt-1.5">为直接启动的 1/3（{{ n1(startMultiplier / 3) }}×IN）</p>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">Y 接相电压 = U/√3 ≈ {{ n1(phaseVoltageY) }} V</span>
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">启动电流降低 {{ n1((1 - 1 / 3) * 100) }}%</span>
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">启动转矩同样降至 1/3</span>
            </div>

            <p class="text-xs leading-relaxed p-3 rounded-lg bg-muted/50 border border-border text-foreground">
              <strong>转换方式一句话：</strong>星→角采用断电开路转换，转换间隔 50–100ms、待转速升至约 80% 额定再切入△接，
              可避免转换瞬间二次冲击电流；带过渡电阻的闭路转换冲击更小，但回路更复杂。
            </p>
          </div>

          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">请检查参数：功率 &gt;0、电压 &gt;0，cosφ 与 η 在 0.5–1 之间，或直接填写额定电流 &gt;0。</p>
            </div>
          </div>
        </div>

        <!-- 适用性提示卡 -->
        <div v-if="inputsValid" class="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p class="text-xs leading-relaxed text-foreground">
            <strong>适用性提示：</strong>Y-△ 启动仅适用于正常运行时 △ 接法、380V（或所选线电压）的电机，Y 接铭牌电机不适用；
            启动转矩只有直接启动的 1/3，风机、水泵类轻载启动合适，重载或需要长时间启动的设备（空压机满载、输送带带料启动）不宜采用，
            此时应考虑软启动器或变频器。
          </p>
        </div>

        <!-- 选型表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Package class="w-5 h-5 mr-2 text-primary" /> 三接触器与热继电器选型
          </h2>
          <p class="text-xs text-muted-foreground mb-4">△、Y 接触器与 △ 侧热继电器按 1/√3 ≈ 0.58 ×IN 估算（绕组相电流口径）；主接触器与主侧热继电器按 1.0×IN。</p>

          <div v-if="inputsValid" class="space-y-2">
            <div class="grid grid-cols-3 gap-2 text-xs text-muted-foreground px-3">
              <span>器件</span>
              <span class="text-center">估算电流</span>
              <span class="text-right">整定口径</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-sm text-foreground">主接触器 KM1</span>
              <span class="text-sm font-mono font-semibold text-foreground">{{ n1(ratedCurrentEff) }} A</span>
              <span class="text-xs text-muted-foreground">1.0×IN · AC-3</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-sm text-foreground">△ 接触器 KM2</span>
              <span class="text-sm font-mono font-semibold text-foreground">{{ n1(deltaContactor) }} A</span>
              <span class="text-xs text-muted-foreground">0.58×IN · 绕组侧</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-sm text-foreground">Y 接触器 KM3</span>
              <span class="text-sm font-mono font-semibold text-foreground">{{ n1(starContactor) }} A</span>
              <span class="text-xs text-muted-foreground">0.58×IN · 仅短时通断</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-sm text-foreground">热继电器（装△侧）</span>
              <span class="text-sm font-mono font-semibold text-foreground">{{ n1(deltaContactor) }} A</span>
              <span class="text-xs text-muted-foreground">0.58×IN · 推荐</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-sm text-foreground">热继电器（装主侧）</span>
              <span class="text-sm font-mono font-semibold text-foreground">{{ n1(ratedCurrentEff) }} A</span>
              <span class="text-xs text-muted-foreground">1.0×IN</span>
            </div>
            <p class="text-xs leading-relaxed text-muted-foreground mt-2">
              热继电器整定值取计算值附近可调范围即可；装在△绕组回路时按相电流 0.58×IN 整定更灵敏（推荐），
              装主回路则按 1.0×IN。选接触器时额定工作电流应不小于估算值并留一档余量，Y 接触器虽仅短时通电，也建议同规格以便互换。
            </p>
          </div>
          <div v-else class="p-4 text-center text-sm text-muted-foreground">输入有效参数后展示选型表</div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>星三角启动为什么能把电流降到 1/3？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          星三角（Y-△）启动在启动阶段把正常运行时△接的绕组改接成 Y 接：此时每相绕组承受的电压从线电压 U 降为相电压 U/√3（380V 系统约 219V），
          绕组电流也降为 1/√3；而线电流又是绕组电流的 1/√3，两个 1/√3 相乘，启动线电流只有全压直接启动的 1/3（约 33%）。
          需要注意的是，启动转矩与相电压平方成正比，同样降到直接启动的 1/3——这就是「降压启动」省电流的代价。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">IN 怎么算？铭牌电流优先</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          额定电流可用 IN = P / (√3·U·cosφ·η) 反算（P 用瓦、U 用伏）：以 15kW、380V、cosφ=0.85、η=0.9 为例，
          IN = 15000 / (1.732×380×0.85×0.9) ≈ 29.8A。但功率因数与效率随负载和电机型号变化，估算值常有 ±5% 出入，
          所以有铭牌时优先直接填铭牌额定电流，再用本工具做启动电流与选型估算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">三个接触器各按多大电流选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          主接触器 KM1 流过线电流，按 1.0×IN 选；△接触器 KM2 与 Y 接触器 KM3 串在绕组回路，流过的是相电流 IN/√3 ≈ 0.58×IN，
          按 0.58×IN 估算即可（本工具口径：按 1/√3 ≈ 0.58 估算）。热继电器装在△绕组回路时按 0.58×IN 整定（推荐，对缺相更灵敏），
          装在主回路则按 1.0×IN。接触器按 AC-3 使用类别（笼型电机启动与运行分断）选型，样本电流应不小于估算值。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么样的电机不适合 Y-△ 启动？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          三个硬条件：一是正常运行必须是△接法（Y 接铭牌电机没有降压器可切）；二是启动转矩只有 1/3，必须空载或轻载启动——
          风机（关风门）、水泵（关阀）类最合适，带料启动的输送机、满载空压机不适用；三是切换瞬间有二次电流冲击，
          惯量大、加速时间长的负载在转速未爬到约 80% 额定前不宜切换。不满足时改用软启动器、自耦减压或变频器。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">转换时间设多少合适？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              星→角转换采用断电开路转换，星接断开后延时 50–100ms 再合△接，给电弧熄灭和磁场衰减留时间，
              避免两接触器同时吸合造成相间短路；时间继电器一般按负载加速时间整定（几秒到十几秒），切换点以转速接近额定为准。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">开路转换和闭路转换有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              开路转换（星断开→延时→角合上）接线简单但切换瞬间有电流冲击；闭路转换在切换过程中经过渡电阻把绕组短暂保持通电，
              冲击更小、更适合惯量大的负载，但多一套电阻和接触器回路。常规风机水泵用开路转换即可。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">660V 电机能用本工具吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              可以。把额定电压改成 660V（电机铭牌 △接 660V、Y 接 380V 的双电压电机启动时接成 Y 用 380V 供电的口径另论），
              IN 反算与电流比公式不变，Y 接相电压相应变为 660/√3 ≈ 381V。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">算出的接触器电流要不要留余量？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              要。估算值是热校核下限，实际选型在样本中取不小于该值的一档，并考虑安装环境温度、操作频率与预期寿命；
              Y 接触器虽只短时通电，工程上通常与△接触器同规格，便于备件互换。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'star-delta-starter-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Triangle, Calculator, CheckCircle, TriangleAlert, Info,
  RefreshCw, Play, ChevronUp, ChevronDown, Package
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '星三角启动计算器 - Y-△启动电流与接触器选型在线计算',
  description: '免费在线星三角启动计算器：输入电机功率、电压、cosφ/η 反算额定电流 IN，按启动倍数估算直接启动电流与 Y-△ 降压启动电流（1/3），给出主接触器 1.0×IN、△/Y 接触器与△侧热继电器 0.58×IN 选型电流及 Y 接相电压，附适用性提示与转换时间说明，纯浏览器本地运行不上传',
  keywords: '星三角启动电流,Y-△启动 接触器选型,电机降压启动计算,star delta starter current,接触器选型',
  author: '有条工具',
  ogTitle: '星三角启动计算器 - Y-△启动电流与接触器选型在线计算 | 有条工具',
  ogDescription: '输入功率即得额定电流、直接与 Y-△ 启动电流对比及三接触器/热继电器选型电流，0.58=1/√3 口径，本地计算。',
  ogUrl: 'https://www.util.cn/tools/star-delta-starter-calculator',
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
          name: '星三角启动计算器',
          url: 'https://www.util.cn/tools/star-delta-starter-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['额定电流 IN 按功率反算或直接填写', '直接启动电流与 Y-△ 启动电流（1/3）对比', 'Y 接相电压 U/√3 计算', '主/△/Y 接触器 1.0/0.58/0.58×IN 选型估算', '热继电器△侧 0.58×IN 与主侧 1.0×IN 整定', '适用性提示与转换时间说明', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '星三角启动计算器', item: 'https://www.util.cn/tools/star-delta-starter-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '星三角启动为什么能把电流降到 1/3？',
              acceptedAnswer: { '@type': 'Answer', text: 'Y 接时绕组电压降为 U/√3、电流降为 1/√3，线电流再降 1/√3，相乘后启动线电流只有直接启动的 1/3，启动转矩同样降为 1/3。' }
            },
            {
              '@type': 'Question',
              name: '三个接触器各按多大电流选？',
              acceptedAnswer: { '@type': 'Answer', text: '主接触器按 1.0×IN，△接触器与 Y 接触器串在绕组回路按 0.58×IN（1/√3）估算，热继电器装△侧按 0.58×IN、装主侧按 1.0×IN。' }
            },
            {
              '@type': 'Question',
              name: '转换时间设多少合适？',
              acceptedAnswer: { '@type': 'Answer', text: '断电开路转换延时 50–100ms 再切入△接，避免相间短路；切换点以转速升至约 80% 额定为准。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const SQRT3 = Math.sqrt(3)
// 绕组侧估算系数：精确值 1/√3 ≈ 0.577，工程惯例取 0.58（本工具按 0.58×IN 口径估算，略保守）
const WINDING_FACTOR = 0.58

// 额定电流反算：IN = P / (√3·U·cosφ·η)，P 为 kW → 返回 A
function ratedCurrentOf(pKw, u, cosPhi, eta) {
  if (!(pKw > 0) || !(u > 0) || !(cosPhi > 0) || cosPhi > 1 || !(eta > 0) || eta > 1) return 0
  return (pKw * 1000) / (SQRT3 * u * cosPhi * eta)
}

// 直接启动电流 = K×IN；Y-△ 启动电流 = K×IN/3（线电流口径）
function startCurrents(inA, k) {
  if (!(inA > 0) || !(k > 0)) return { direct: 0, yd: 0 }
  return { direct: k * inA, yd: (k * inA) / 3 }
}

// 接触器/热继电器估算：主侧 1.0×IN，绕组侧（△、Y、△装热继）0.58×IN（1/√3≈0.58）
function sizingCurrents(inA) {
  if (!(inA > 0)) return { main: 0, winding: 0 }
  return { main: inA, winding: WINDING_FACTOR * inA }
}

// ---------- 状态与交互 ----------
const DEFAULTS = {
  powerKw: 15, voltage: 380, inMode: 'calc',
  cosPhi: 0.85, efficiency: 0.9, ratedCurrent: 29.8, startMultiplier: 7
}

const uid = 'sd'
const powerKw = ref(DEFAULTS.powerKw)
const voltage = ref(DEFAULTS.voltage)
const inMode = ref(DEFAULTS.inMode)          // 'calc' | 'manual'
const cosPhi = ref(DEFAULTS.cosPhi)
const efficiency = ref(DEFAULTS.efficiency)
const ratedCurrent = ref(DEFAULTS.ratedCurrent)
const startMultiplier = ref(DEFAULTS.startMultiplier)
const seoContentVisible = ref(true)

const inModeLabel = computed(() => inMode.value === 'calc' ? '按 P/(√3·U·cosφ·η) 反算' : '铭牌直填')

const inputsValid = computed(() => {
  if (!(Number(powerKw.value) > 0) || !(Number(voltage.value) > 0)) return false
  if (!(Number(startMultiplier.value) > 0)) return false
  if (inMode.value === 'calc') {
    return Number(cosPhi.value) > 0 && Number(cosPhi.value) <= 1 &&
      Number(efficiency.value) > 0 && Number(efficiency.value) <= 1
  }
  return Number(ratedCurrent.value) > 0
})

const ratedCurrentEff = computed(() =>
  inMode.value === 'calc'
    ? ratedCurrentOf(Number(powerKw.value), Number(voltage.value), Number(cosPhi.value), Number(efficiency.value))
    : Number(ratedCurrent.value)
)

const directStartCurrent = computed(() => startCurrents(ratedCurrentEff.value, Number(startMultiplier.value)).direct)
const ydStartCurrent = computed(() => startCurrents(ratedCurrentEff.value, Number(startMultiplier.value)).yd)
const phaseVoltageY = computed(() => Number(voltage.value) > 0 ? Number(voltage.value) / SQRT3 : 0)

const mainContactor = computed(() => sizingCurrents(ratedCurrentEff.value).main)
const deltaContactor = computed(() => sizingCurrents(ratedCurrentEff.value).winding)
const starContactor = computed(() => sizingCurrents(ratedCurrentEff.value).winding)

// ---------- 场景预设（期望值按 K 倍与 1/√3 口径手算核对） ----------
const presets = [
  {
    name: '① 15kW 风机',
    desc: '380V · cosφ 0.85 · η 0.9 · K=7',
    expect: 'IN≈29.8A / 直接≈208A / Y-△≈69.5A',
    values: { powerKw: 15, voltage: 380, inMode: 'calc', cosPhi: 0.85, efficiency: 0.9, ratedCurrent: 29.8, startMultiplier: 7 }
  },
  {
    name: '② 7.5kW 水泵',
    desc: '380V · cosφ 0.85 · η 0.9 · K=7',
    expect: 'IN≈14.9A / 直接≈104A / Y-△≈34.7A',
    values: { powerKw: 7.5, voltage: 380, inMode: 'calc', cosPhi: 0.85, efficiency: 0.9, ratedCurrent: 14.9, startMultiplier: 7 }
  },
  {
    name: '③ 55kW 铭牌直填',
    desc: '380V · IN=102A（铭牌）· K=6.5',
    expect: '直接≈663A / Y-△≈221A',
    values: { powerKw: 55, voltage: 380, inMode: 'manual', cosPhi: 0.85, efficiency: 0.9, ratedCurrent: 102, startMultiplier: 6.5 }
  }
]

function applyPreset(p) {
  powerKw.value = p.values.powerKw
  voltage.value = p.values.voltage
  inMode.value = p.values.inMode
  cosPhi.value = p.values.cosPhi
  efficiency.value = p.values.efficiency
  ratedCurrent.value = p.values.ratedCurrent
  startMultiplier.value = p.values.startMultiplier
}

function resetInputs() {
  powerKw.value = DEFAULTS.powerKw
  voltage.value = DEFAULTS.voltage
  inMode.value = DEFAULTS.inMode
  cosPhi.value = DEFAULTS.cosPhi
  efficiency.value = DEFAULTS.efficiency
  ratedCurrent.value = DEFAULTS.ratedCurrent
  startMultiplier.value = DEFAULTS.startMultiplier
}

// 主计算按钮：本地即时重算 + 记录最近使用
function onCompute() {
  addRecentTool('star-delta-starter-calculator')
}

// ---------- 展示格式化 ----------
const n0 = (v) => (Number.isFinite(v) ? Math.round(v).toString() : '—')
const n1 = (v) => (Number.isFinite(v) ? v.toFixed(1) : '—')

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('star-delta-starter-calculator')
})
</script>
