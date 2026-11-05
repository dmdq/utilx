<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ArrowLeftRight class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">4-20mA信号换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">工程量 ↔ 电流 ↔ 电压 ↔ PLC 数字量四向实时互算，支持正负量程与流量开方</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 4-20mA 信号换算计算器：输入工程量、电流（mA）、电压（V）或 PLC 数字量中任意一个，其余三区实时联动换算。
        电压制式覆盖 1-5V（250Ω 采样电阻）、0-5V、0-10V、±5V、±10V；数字量支持西门子 S7（0-27648）、三菱 FX、欧姆龙、通用 0-10000 与 12 位 ADC 原始码；
        量程可自定义（支持 -40~80 这类负量程），并内置差压流量开方口径与 NAMUR 信号故障速查表。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        本工具按线性变送器口径换算：工程值 = 下限 + (I−4)/16 × (上限−下限)。勾选「差压开方」后按开方器口径 流量 = 上限 × √((I−4)/16) 计算，
        适用于孔板/文丘里差压流量已开方的 4-20mA 信号。PLC 数字量以所选档位满码线性映射（西门子按 I/20×27648 四舍五入，4mA→5530），
        标定以实际模块手册为准。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器：量程 + 四方联 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 双向换算四方联
        </h2>

        <!-- 量程设定 -->
        <div class="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="slc-preset" class="block text-sm font-medium text-foreground mb-1.5">量程预设</label>
              <select
                id="slc-preset"
                v-model="presetKey"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option v-for="p in rangePresets" :key="p.key" :value="p.key">{{ p.label }}</option>
              </select>
            </div>
            <div>
              <label for="slc-min" class="block text-sm font-medium text-foreground mb-1.5">量程下限</label>
              <input
                id="slc-min"
                v-model.number="rangeMin"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                @input="markCustom"
              >
            </div>
            <div>
              <label for="slc-max" class="block text-sm font-medium text-foreground mb-1.5">
                量程上限<span v-if="unitLabel">（{{ unitLabel }}）</span>
              </label>
              <input
                id="slc-max"
                v-model.number="rangeMax"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                @input="markCustom"
              >
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input v-model="sqrtMode" type="checkbox" class="w-4 h-4 rounded border border-border">
              差压流量开方模式
            </label>
            <span
              v-if="isFlowPreset"
              class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30"
            >当前为流量量程，可启用开方</span>
            <span v-if="sqrtMode" class="text-xs text-muted-foreground">
              开方口径：流量 = 上限 × √((I−4)/16)；反向 I = 4 + 16 × (Q/上限)²。信号未开方（原始差压）请勿勾选。
            </span>
          </div>
        </div>

        <!-- 四方联 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- 工程值 -->
          <div class="p-4 bg-muted/50 rounded-lg border border-border">
            <div class="flex items-center justify-between mb-1.5">
              <label for="slc-eng" class="text-sm font-medium text-foreground">工程值{{ unitLabel ? '（' + unitLabel + '）' : '' }}</label>
              <span v-if="sqrtMode" class="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">开方口径</span>
            </div>
            <input
              id="slc-eng"
              :value="engText"
              type="number"
              step="0.01"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="输入工程量"
              @input="onEngInput"
            >
            <p class="text-xs text-muted-foreground mt-1.5">对应 4mA→{{ fmt(rangeMin, 2) }}、20mA→{{ fmt(rangeMax, 2) }}</p>
          </div>

          <!-- 电流 -->
          <div class="p-4 bg-muted/50 rounded-lg border border-border">
            <div class="flex items-center justify-between mb-1.5">
              <label for="slc-ma" class="text-sm font-medium text-foreground">电流（mA）</label>
              <span v-if="statusChip" :class="['text-xs font-medium', statusChip.cls]">{{ statusChip.text }}</span>
            </div>
            <input
              id="slc-ma"
              :value="maText"
              type="number"
              step="0.01"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 12"
              @input="onMaInput"
            >
            <p class="text-xs text-muted-foreground mt-1.5">4-20mA 活零点，NAMUR 正常区 3.8-20.5mA</p>
          </div>

          <!-- 电压 -->
          <div class="p-4 bg-muted/50 rounded-lg border border-border">
            <label for="slc-volt" class="block text-sm font-medium text-foreground mb-1.5">电压（V）· {{ voltageModeLabel }}</label>
            <input
              id="slc-volt"
              :value="voltText"
              type="number"
              step="0.01"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 3"
              @input="onVoltInput"
            >
            <p class="text-xs text-muted-foreground mt-1.5">{{ voltageModeHint }}</p>
          </div>

          <!-- PLC 数字量 -->
          <div class="p-4 bg-muted/50 rounded-lg border border-border">
            <label for="slc-raw" class="block text-sm font-medium text-foreground mb-1.5">PLC 数字量 · {{ plcModeLabel }}</label>
            <input
              id="slc-raw"
              :value="rawText"
              type="number"
              step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 16589"
              @input="onRawInput"
            >
            <p class="text-xs text-muted-foreground mt-1.5">{{ plcModeHint }}</p>
          </div>
        </div>

        <!-- 当前口径公式 -->
        <div class="p-3 bg-muted/50 rounded-lg border border-border">
          <p class="text-xs leading-relaxed text-muted-foreground font-mono break-all">
            <template v-if="!sqrtMode">
              工程值 = 下限 + (I−4)/16 × (上限−下限)&nbsp;&nbsp;|&nbsp;&nbsp;I = 4 + (工程值−下限)/(上限−下限) × 16
            </template>
            <template v-else>
              流量 Q = 上限 × √((I−4)/16)&nbsp;&nbsp;|&nbsp;&nbsp;I = 4 + 16 × (Q/上限)²
            </template>
          </p>
        </div>

        <!-- 数字量标定显著注明 -->
        <div class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
            数字量标定以实际模块手册为准：同一品牌不同型号的量程组态、偏置与报警码可能不同，投运前请按模块手册核对满码与零码。
          </p>
        </div>
      </div>

      <!-- 侧栏：电压制式 / PLC 档位 / 状态速查 -->
      <div class="space-y-6">
        <!-- 电压制式 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> 电压制式
          </h2>
          <div>
            <label for="slc-vmode" class="block text-sm font-medium text-foreground mb-1.5">4-20mA 对应电压</label>
            <select
              id="slc-vmode"
              v-model="voltageMode"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="m in voltageModes" :key="m.key" :value="m.key">{{ m.label }}</option>
            </select>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border">
            {{ voltageModeHint }}
            <span v-if="voltageMode === 'v15'">
              即 250Ω 精密采样电阻联动换算：V = I × 0.25，12mA → 3V。DCS/PLC 模拟量输入卡常用此口径把电流转成 1-5V 进 ADC。
            </span>
          </p>
        </div>

        <!-- PLC 数字量档位 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ListChecks class="w-5 h-5 mr-2 text-primary" /> PLC 数字量档位
          </h2>
          <div>
            <label for="slc-plc" class="block text-sm font-medium text-foreground mb-1.5">模块数字量量程</label>
            <select
              id="slc-plc"
              v-model="plcType"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="p in plcTypes" :key="p.key" :value="p.key">{{ p.label }}</option>
            </select>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border">
            {{ plcModeHint }}
          </p>
        </div>

        <!-- 读数状态色例 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 读数状态速记
          </h2>
          <div class="space-y-1.5 text-xs">
            <p class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-green-500"></span><span class="text-muted-foreground">3.8~20.5mA：NAMUR 正常工作区</span></p>
            <p class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-amber-500"></span><span class="text-muted-foreground">3.6~3.8 / 20.5~21mA：可配置坏值区（NAMUR NE 43）</span></p>
            <p class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-red-500"></span><span class="text-muted-foreground">&lt;3.6mA 断线/欠量程；≈0mA 回路断路；&gt;21mA 超程</span></p>
          </div>
        </div>
      </div>
    </div>

    <!-- 故障速查小节 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-4">
        <AlertTriangle class="w-5 h-5 mr-2 text-primary" /> 信号故障速查表
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left py-2 pr-4 text-foreground font-medium whitespace-nowrap">电流读数</th>
              <th class="text-left py-2 pr-4 text-foreground font-medium">典型原因</th>
              <th class="text-left py-2 text-foreground font-medium">排查建议</th>
            </tr>
          </thead>
          <tbody class="text-muted-foreground">
            <tr class="border-b border-border/50">
              <td class="py-2.5 pr-4 text-foreground whitespace-nowrap font-mono">I ≈ 0mA</td>
              <td class="py-2.5 pr-4">回路断路：接线脱落、电缆断芯、电源未上电或保险熔断</td>
              <td class="py-2.5">断电后测回路通断与负载电阻，检查 24V 电源与端子紧固</td>
            </tr>
            <tr class="border-b border-border/50">
              <td class="py-2.5 pr-4 text-foreground whitespace-nowrap font-mono">I &lt; 3.6mA</td>
              <td class="py-2.5 pr-4">断线/欠量程报警区（NAMUR NE 43，3.6-21mA 可配置为坏值）</td>
              <td class="py-2.5">检查接线与组态；在 DCS/PLC 中按 NAMUR 口径组态坏值报警，勿当作正常零点</td>
            </tr>
            <tr class="border-b border-border/50">
              <td class="py-2.5 pr-4 text-foreground whitespace-nowrap font-mono">I &gt; 20mA</td>
              <td class="py-2.5 pr-4">超程：实际值超上限、量程组态不符或变送器故障</td>
              <td class="py-2.5">核对变送器量程与系统组态是否一致，实测被测量确认</td>
            </tr>
            <tr>
              <td class="py-2.5 pr-4 text-foreground whitespace-nowrap font-mono">3.6~3.8 / 20.5~21mA</td>
              <td class="py-2.5 pr-4">NAMUR 过渡坏值区，可能是测量异常的边缘信号</td>
              <td class="py-2.5">可在系统中组态为「保持最后有效值」或触发质量坏点标志</td>
            </tr>
          </tbody>
        </table>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是 4-20mA 电流环？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          4-20mA 电流环是工业过程控制中最常用的模拟量传输标准：变送器把温度、压力、液位、流量等被测量线性调制为 4~20mA 的直流电流，
          4mA 对应量程下限、20mA 对应量程上限，中间按比例线性对应。同一对电缆既给两线制变送器供电，又传输信号，
          因此接线简单、传输距离远（可达上千米），是 DCS、PLC 模拟量输入的事实标准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么用电流不用电压？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          电流信号在回路中处处相等，不受线路电阻与接触电阻压降的影响，长距离传输不会衰减；
          而电压信号（如 0-10V）经过长电缆会因线路压降产生测量误差，且更容易受共模干扰。
          电流环的接收端只需一个精密采样电阻（如 250Ω）即可把电流转成电压进 ADC，抗干扰能力显著更强。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">活零点 4mA 的意义</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          零点选在 4mA 而不是 0mA，称为「活零点」：一是 0mA 可以明确表示断线、断电等故障状态，与量程零点（4mA）天然区分；
          二是 4mA 的静态电流恰好为两线制变送器的内部电路供电（通常需要 ≥3.5mA 才能维持工作），省去独立供电线。
          NAMUR NE 43 标准进一步定义 3.8~20.5mA 为正常工作区，3.6~3.8mA 与 20.5~21mA 为可配置坏值区，
          &lt;3.6mA 为断线/欠量程、&gt;21mA 为超程报警。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">两线制与四线制</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两线制：供电与信号共用一对线，24V 电源、变送器、采样电阻串成回路，变送器从信号电流中取电，接线最省，是现场变送器的主流形态。
          四线制：变送器独立供电（220V AC 或 24V DC），信号输出单独一对线，多见于大功率、电气隔离或老式仪表；
          接入 PLC 时注意输入通道是电流型还是电压型，必要时经隔离放大器或信号隔离器转换。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">250Ω 采样电阻与 1-5V</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          很多 DCS/PLC 模拟量输入卡在内部用 250Ω 精密电阻把 4-20mA 转成电压再进 ADC：V = I × 250Ω / 1000，
          即 4mA→1V、12mA→3V、20mA→5V，这就是「1-5V」电压制式的由来——它保留了活零点特性（0V 仍可表示断线）。
          其他常见制式如 0-5V、0-10V、±5V、±10V 则是模拟量输出板卡或信号隔离器的线性映射口径，本工具全部支持换算。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">12mA 对应量程的一半吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              线性口径下是的：(12−4)/16 = 50%，12mA 正好对应量程中点。但如果信号经过差压流量开方（本工具的开方模式），
              12mA 对应的是满量程流量的 √0.5 ≈ 70.7%——开方口径下「半格电流」不再是「半量程流量」，读数前先确认是否启用了开方器。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">西门子 27648 是什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              27648（=0x6C00）是西门子 S7 系列 PLC 模拟量的额定满码值：0-20mA、0-10V 等单极性量程的 100% 对应 27648，
              4-20mA 输入时 4mA 对应 5530（27648×4/20）。它不是 16 位有符号数的上限（32767），而是预留了约 15% 的过冲区，
              用于容纳超调与诊断信息。本工具按 I/20×27648 四舍五入换算。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">断线时系统读到多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              回路彻底断开时电流为 0，通道读数接近 0 码；若只是欠量程，读数会落在 3.6mA 以下的报警区。
              按 NAMUR NE 43 组态的系统会把 3.6~3.8mA 与 20.5~21mA 判为坏值并置质量位报警，而不会把它当成正常测量值参与控制。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">0-10V 和 4-20mA 该选哪个？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              长距离、强干扰、需要断线诊断的场景选 4-20mA；短距离、布线简单、传感器只输出电压（如热电偶直接出 mV、电位器分压）的场景可用 0-10V。
              两者可用本工具按制式互相换算，但注意 0-10V 没有活零点，无法区分「量程零」与「断线」。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'signal-loop-converter'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  ArrowLeftRight, Calculator, Gauge, Info, ListChecks, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 线性 / 开方口径：工程值 ↔ 电流（mA）
function engToMa(eng, min, max, sqrtMode) {
  if (!Number.isFinite(eng) || !Number.isFinite(min) || !Number.isFinite(max) || max === min) return null
  if (sqrtMode) {
    if (!(max > 0)) return null
    const p = Math.max(0, eng / max)
    return 4 + 16 * p * p
  }
  return 4 + ((eng - min) / (max - min)) * 16
}

function maToEng(I, min, max, sqrtMode) {
  if (!Number.isFinite(I) || !Number.isFinite(min) || !Number.isFinite(max) || max === min) return null
  if (sqrtMode) {
    if (!(max > 0)) return null
    const frac = Math.max(0, (I - 4) / 16)
    return max * Math.sqrt(frac)
  }
  return min + ((I - 4) / 16) * (max - min)
}

// 电流 ↔ 电压（五种制式）
function maToVolt(I, mode) {
  if (!Number.isFinite(I)) return null
  switch (mode) {
    case 'v15': return I / 4                       // 1-5V：250Ω 采样电阻，V = I×0.25
    case 'v05': return ((I - 4) / 16) * 5          // 4mA→0V, 20mA→5V
    case 'v010': return ((I - 4) / 16) * 10        // 4mA→0V, 20mA→10V
    case 'pm5': return ((I - 4) / 16) * 10 - 5     // 4mA→-5V, 12mA→0V, 20mA→+5V
    case 'pm10': return ((I - 4) / 16) * 20 - 10   // 4mA→-10V, 12mA→0V, 20mA→+10V
    default: return null
  }
}

function voltToMa(v, mode) {
  if (!Number.isFinite(v)) return null
  switch (mode) {
    case 'v15': return v * 4
    case 'v05': return 4 + (v / 5) * 16
    case 'v010': return 4 + (v / 10) * 16
    case 'pm5': return 4 + ((v + 5) / 10) * 16
    case 'pm10': return 4 + ((v + 10) / 20) * 16
    default: return null
  }
}

// PLC 数字量档位（西门子按 I/20×27648 满码，其余按 4mA→0、20mA→满码）
const PLC_SCALES = {
  s7:     { max: 27648, liveZero: false },
  fx:     { max: 4000,  liveZero: true },
  omron:  { max: 4000,  liveZero: true },
  gen10k: { max: 10000, liveZero: true },
  adc12:  { max: 4095,  liveZero: true }
}

function maToRaw(I, plc) {
  const s = PLC_SCALES[plc]
  if (!s || !Number.isFinite(I)) return null
  const v = s.liveZero ? ((I - 4) / 16) * s.max : (I / 20) * s.max
  return Math.round(Math.min(s.max, Math.max(0, v)))
}

function rawToMa(raw, plc) {
  const s = PLC_SCALES[plc]
  if (!s || !Number.isFinite(raw)) return null
  const r = Math.min(s.max, Math.max(0, raw))
  return s.liveZero ? 4 + (r / s.max) * 16 : (r / s.max) * 20
}

// NAMUR 读数状态判定
function maStatus(I) {
  if (!Number.isFinite(I)) return null
  if (I < 0.5) return { text: '≈0：回路断路', tone: 'red' }
  if (I < 3.6) return { text: '<3.6mA：断线/欠量程', tone: 'red' }
  if (I < 3.8) return { text: '3.6~3.8mA：坏值区', tone: 'amber' }
  if (I <= 20.5) return { text: '正常工作区', tone: 'green' }
  if (I <= 21) return { text: '20.5~21mA：坏值区', tone: 'amber' }
  return { text: '>21mA：超程', tone: 'red' }
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '4-20mA信号换算器 - 工程量/电压/PLC数字量在线换算计算器',
  description: '在线4-20mA信号换算器：工程量、电流mA、电压(1-5V/0-5V/0-10V/±5V/±10V)与PLC数字量(西门子27648/三菱FX/欧姆龙/12位ADC)四向实时互算，支持自定义正负量程、250Ω采样电阻换算与差压流量开方口径，附NAMUR信号故障速查表，纯浏览器本地计算。',
  keywords: '4-20mA换算,4-20ma计算器,模拟量换算,plc数字量换算,西门子27648,1-5V,250Ω采样电阻,0-10V转换,流量开方,变送器信号,NAMUR',
  author: '有条工具',
  ogTitle: '4-20mA信号换算器 - 工程量/电压/PLC数字量在线换算 | 有条工具',
  ogDescription: '工程量、电流、电压、PLC 数字量四向实时互算，支持正负量程与流量开方，附故障速查。',
  ogUrl: 'https://www.util.cn/tools/signal-loop-converter',
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
          name: '4-20mA信号换算器',
          url: 'https://www.util.cn/tools/signal-loop-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '工程量/电流/电压/PLC数字量四向实时换算',
            '1-5V(250Ω)、0-5V、0-10V、±5V、±10V 电压制式',
            '西门子S7/三菱FX/欧姆龙/通用/12位ADC数字量档位',
            '自定义正负量程与常用量程预设',
            '差压流量开方口径换算',
            'NAMUR信号故障速查表',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '4-20mA信号换算器', item: 'https://www.util.cn/tools/signal-loop-converter' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '12mA 对应量程的一半吗？',
              acceptedAnswer: { '@type': 'Answer', text: '线性口径下是的：(12−4)/16=50%。但差压流量开方口径下 12mA 对应满量程流量的 √0.5≈70.7%。' }
            },
            {
              '@type': 'Question',
              name: '西门子 27648 是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '27648 是西门子 S7 模拟量额定满码值，0-20mA 对应 0-27648，4mA 即 5530，预留了过冲区。本工具按 I/20×27648 换算。' }
            },
            {
              '@type': 'Question',
              name: '断线时系统读到多少？',
              acceptedAnswer: { '@type': 'Answer', text: '回路断开时读数接近 0；欠量程落在 3.6mA 以下报警区。NAMUR NE 43 定义 3.6~3.8mA 与 20.5~21mA 为可配置坏值区。' }
            },
            {
              '@type': 'Question',
              name: '0-10V 和 4-20mA 该选哪个？',
              acceptedAnswer: { '@type': 'Answer', text: '长距离、强干扰、需要断线诊断选 4-20mA；短距离、传感器直接输出电压可用 0-10V，但无活零点、不能区分量程零与断线。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'signal-loop-converter'
const SETTINGS_KEY = 'signal-loop-converter-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 选项表 ----------
const rangePresets = [
  { key: 'temp', label: '温度 -40~80 ℃', min: -40, max: 80, unit: '℃' },
  { key: 'pressure', label: '压力 0~1.0 MPa', min: 0, max: 1, unit: 'MPa' },
  { key: 'level', label: '液位 0~5 m', min: 0, max: 5, unit: 'm' },
  { key: 'flow', label: '流量 0~100 m³/h', min: 0, max: 100, unit: 'm³/h' },
  { key: 'custom', label: '自定义', min: null, max: null, unit: null }
]

const voltageModes = [
  { key: 'v15', label: '1-5V（250Ω 采样电阻）', hint: '4mA→1V、12mA→3V、20mA→5V' },
  { key: 'v05', label: '0-5V', hint: '线性映射：4mA→0V、12mA→2.5V、20mA→5V' },
  { key: 'v010', label: '0-10V', hint: '线性映射：4mA→0V、12mA→5V、20mA→10V' },
  { key: 'pm5', label: '±5V（-5~+5V）', hint: '双极性映射：4mA→-5V、12mA→0V、20mA→+5V' },
  { key: 'pm10', label: '±10V（-10~+10V）', hint: '双极性映射：4mA→-10V、12mA→0V、20mA→+10V' }
]

const plcTypes = [
  { key: 's7', label: '西门子 S7（0-27648）', hint: 'I/20×27648 四舍五入：4mA→5530、12mA→16589、20mA→27648；0-20mA 满码口径，预留过冲区' },
  { key: 'fx', label: '三菱 FX（0-4000）', hint: '4mA→0、12mA→2000、20mA→4000（FX 系列模拟量模块常用 4-20mA 档口径）' },
  { key: 'omron', label: '欧姆龙（0-4000）', hint: '4mA→0、12mA→2000、20mA→4000（4-20mA 量程档，分辨率随单元型号而异）' },
  { key: 'gen10k', label: '通用 0-10000', hint: '4mA→0、12mA→5000、20mA→10000（常见于组态软件百分比×100 口径）' },
  { key: 'adc12', label: '12位 ADC raw（0-4095）', hint: '4mA→0、12mA→2048（2047.5 四舍五入）、20mA→4095' }
]

// ---------- 状态 ----------
const presetKey = ref('temp')
const rangeMin = ref(-40)
const rangeMax = ref(80)
const unitLabel = ref('℃')
const voltageMode = ref('v15')
const plcType = ref('s7')
const sqrtMode = ref(false)

// 四方联文本态：以 mA 为锚点联动
const engText = ref('20')
const maText = ref('12')
const voltText = ref('3')
const rawText = ref('16589')

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化（toFixed + 去尾零，避免浮点尾差） ----------
const fmt = (v, d = 2) => (Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—')

const isFlowPreset = computed(() => presetKey.value === 'flow')
const voltageModeLabel = computed(() => (voltageModes.find(m => m.key === voltageMode.value) || {}).label || '')
const voltageModeHint = computed(() => (voltageModes.find(m => m.key === voltageMode.value) || {}).hint || '')
const plcModeLabel = computed(() => (plcTypes.find(p => p.key === plcType.value) || {}).label || '')
const plcModeHint = computed(() => (plcTypes.find(p => p.key === plcType.value) || {}).hint || '')
const statusChip = computed(() => {
  const s = maStatus(parseFloat(maText.value))
  if (!s) return null
  const cls = s.tone === 'red'
    ? 'text-red-600 dark:text-red-400'
    : s.tone === 'amber'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-green-600 dark:text-green-400'
  return { text: s.text, cls }
})

// ---------- 量程预设 ----------
function applyPreset(key) {
  const p = rangePresets.find(x => x.key === key)
  if (!p || key === 'custom') return
  rangeMin.value = p.min
  rangeMax.value = p.max
  unitLabel.value = p.unit
}
watch(presetKey, applyPreset)

function markCustom() {
  if (presetKey.value !== 'custom') presetKey.value = 'custom'
}

// ---------- 四方联联动（任一输入变化，其余三区实时更新） ----------
function onEngInput(e) {
  engText.value = e.target.value
  const I = engToMa(parseFloat(engText.value), rangeMin.value, rangeMax.value, sqrtMode.value)
  if (I === null) return
  maText.value = fmt(I, 3)
  voltText.value = fmt(maToVolt(I, voltageMode.value), 4)
  rawText.value = fmt(maToRaw(I, plcType.value), 0)
}

function onMaInput(e) {
  maText.value = e.target.value
  resyncFromMa()
}

function onVoltInput(e) {
  voltText.value = e.target.value
  const I = voltToMa(parseFloat(voltText.value), voltageMode.value)
  if (I === null) return
  maText.value = fmt(I, 3)
  const eng = maToEng(I, rangeMin.value, rangeMax.value, sqrtMode.value)
  if (eng !== null) engText.value = fmt(eng, 3)
  rawText.value = fmt(maToRaw(I, plcType.value), 0)
}

function onRawInput(e) {
  rawText.value = e.target.value
  const I = rawToMa(parseFloat(rawText.value), plcType.value)
  if (I === null) return
  maText.value = fmt(I, 3)
  const eng = maToEng(I, rangeMin.value, rangeMax.value, sqrtMode.value)
  if (eng !== null) engText.value = fmt(eng, 3)
  voltText.value = fmt(maToVolt(I, voltageMode.value), 4)
}

// 以 mA 为锚点重算其余三区
function resyncFromMa() {
  const I = parseFloat(maText.value)
  if (!Number.isFinite(I)) return
  const eng = maToEng(I, rangeMin.value, rangeMax.value, sqrtMode.value)
  if (eng !== null) engText.value = fmt(eng, 3)
  voltText.value = fmt(maToVolt(I, voltageMode.value), 4)
  rawText.value = fmt(maToRaw(I, plcType.value), 0)
}

// 制式 / 档位 / 量程 / 开方变化 → 从 mA 重新联动
watch([rangeMin, rangeMax, voltageMode, plcType, sqrtMode], resyncFromMa)

// ---------- 设置持久化（localStorage，键前缀用工具 id） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (rangePresets.some(p => p.key === s.presetKey)) presetKey.value = s.presetKey
    if (Number.isFinite(s.rangeMin)) rangeMin.value = s.rangeMin
    if (Number.isFinite(s.rangeMax)) rangeMax.value = s.rangeMax
    if (typeof s.unitLabel === 'string') unitLabel.value = s.unitLabel
    if (voltageModes.some(m => m.key === s.voltageMode)) voltageMode.value = s.voltageMode
    if (PLC_SCALES[s.plcType]) plcType.value = s.plcType
    if (typeof s.sqrtMode === 'boolean') sqrtMode.value = s.sqrtMode
    resyncFromMa()
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([presetKey, rangeMin, rangeMax, unitLabel, voltageMode, plcType, sqrtMode], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      presetKey: presetKey.value,
      rangeMin: rangeMin.value,
      rangeMax: rangeMax.value,
      unitLabel: unitLabel.value,
      voltageMode: voltageMode.value,
      plcType: plcType.value,
      sqrtMode: sqrtMode.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
