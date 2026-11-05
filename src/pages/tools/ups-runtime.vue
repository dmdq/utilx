<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <PlugZap class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">UPS 续航估算</h1>
          <p class="text-sm text-muted-foreground mt-1">VA×功率因数→可用功率，电池组 Wh 经 Peukert 修正与逆变器损耗→放电分钟数</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 UPS 续航计算器：输入 UPS 额定 VA 与功率因数得到实际可用有功功率（W = VA × PF），
        按负载判断是否超容量；再由 12V 电池节数与单体 Ah 汇总电池组能量，铅酸电池按放电小时率做 Peukert
        容量折减（1C 放电实际容量约为 20h 率标称的 60%~70%），扣除逆变器效率后给出预计放电分钟数。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        口径说明：电池标称 Ah 默认按 <span class="text-foreground font-medium">20 小时率（C20）</span>给出，
        大电流放电下铅酸实际可用容量会明显缩水——1C 放电约为标称的 0.6~0.7，本工具按放电小时率对数插值；
        锂电池无 Peukert 效应不折减。功率因数 PF：<span class="text-foreground font-medium">老机型（工频/后备式）按 0.6~0.7，新机型（高频在线式）按 0.8~0.9</span>，
        以 UPS 铭牌为准。结果为理论估算，未计入电池老化，2 年以上旧电池建议把 Ah 按标称的 80% 代入。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 输入与计算
        </h2>

        <!-- UPS 与负载 -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label for="ups-va" class="block text-sm font-medium text-foreground mb-1.5">UPS 额定容量（VA）</label>
            <input
              id="ups-va"
              v-model.number="vaUps"
              type="number"
              min="1"
              step="100"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 1000"
            >
          </div>
          <div>
            <label for="ups-load" class="block text-sm font-medium text-foreground mb-1.5">实际负载功率（W）</label>
            <input
              id="ups-load"
              v-model.number="loadW"
              type="number"
              min="0"
              step="10"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 300"
            >
            <p class="text-xs text-muted-foreground mt-1">设备铭牌/实测功耗之和</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">功率因数 PF</label>
            <div class="grid grid-cols-4 gap-1">
              <button
                v-for="p in PF_PRESETS"
                :key="p"
                @click="pf = p"
                :class="pf === p ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ p.toFixed(1) }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1">老机 0.6~0.7，新机 0.8~0.9</p>
          </div>
        </div>

        <!-- 电池规格 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">电池节数（12V/节）</label>
            <div class="grid grid-cols-3 gap-1">
              <button
                v-for="c in CELL_OPTIONS"
                :key="c.value"
                @click="cells = c.value"
                :class="cells === c.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ c.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1">常见小 UPS 为 2 节（24V），1kVA 以上多为 4 节（48V）</p>
          </div>
          <div>
            <label for="ups-ah" class="block text-sm font-medium text-foreground mb-1.5">单体容量 Ah（12V 同规格串联）</label>
            <div class="grid grid-cols-5 gap-1 mb-2">
              <button
                v-for="a in AH_PRESETS"
                :key="a"
                @click="applyAh(a)"
                :class="ah === a && !ahCustom ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ a }}</button>
            </div>
            <input
              id="ups-ah"
              v-model.number="ahCustom"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="其他值直接填写，如 7.5"
            >
          </div>
        </div>

        <!-- 电池类型与放电率口径 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">电池类型</label>
            <div class="grid grid-cols-2 gap-1">
              <button
                v-for="c in CHEM_OPTIONS"
                :key="c.value"
                @click="chemistry = c.value"
                :class="chemistry === c.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ c.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1">{{ chemistryNote }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">标称容量放电率口径</label>
            <div class="grid grid-cols-3 gap-1">
              <button
                v-for="r in RATED_HOUR_OPTIONS"
                :key="r.value"
                @click="ratedHour = r.value"
                :class="ratedHour === r.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ r.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1">UPS 小电池标称多为 20h 率；部分工业电池按 10h 率</p>
          </div>
        </div>

        <!-- 逆变器效率 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            逆变器效率：<span class="text-primary">{{ Math.round(inverterEff * 100) }}%</span>
          </label>
          <input v-model.number="inverterEff" type="range" min="0.85" max="0.95" step="0.01" class="w-full accent-primary" />
          <p class="text-xs text-muted-foreground mt-1">0.85~0.95 常见，默认 90%；电池侧放电功率 = 负载 ÷ 效率</p>
        </div>

        <!-- 计算过程 -->
        <div v-if="inputsValid" class="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border font-mono leading-relaxed">
          可用功率 = {{ fmt(vaUps, 0) }}VA × {{ pf.toFixed(2) }} = <span class="text-foreground font-semibold">{{ fmt(usable, 0) }}W</span><br>
          电池组 = {{ cells }} 节 × 12V × {{ fmt(ahEff, 2) }}Ah = {{ fmt(packWhVal, 0) }}Wh（{{ fmt(packV, 0) }}V）<br>
          放电电流 I = {{ fmt(loadW, 0) }}W ÷ {{ Math.round(inverterEff * 100) }}% ÷ {{ fmt(packV, 0) }}V = {{ fmt(currentA, 2) }}A
          （{{ fmt(hourRate, 2) }}h 率 ≈ {{ fmt(cRate, 2) }}C）<br>
          Peukert 可用容量系数 = <span class="text-foreground font-semibold">×{{ fmt(capFactor, 3) }}</span>{{ chemistry === 'lead' ? '（按放电小时率插值）' : '（锂电无此效应）' }}
        </div>

        <!-- 结果 -->
        <div v-if="inputsValid" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
            <p class="text-sm font-medium text-foreground mb-2">预计续航</p>
            <p class="text-3xl font-bold text-primary">{{ fmt(runtimeMin, 1) }} <span class="text-base">分钟</span></p>
            <p class="text-xs text-muted-foreground mt-1">≈ {{ fmt(runtimeHour, 2) }} 小时（{{ hoursText(runtimeMin) }}）</p>
          </div>
          <div class="p-4 rounded-lg border border-border bg-muted/50 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">可用功率（VA×PF）</span>
              <span class="text-sm font-semibold text-foreground">{{ fmt(usable, 0) }} W</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">当前负载</span>
              <span class="text-sm font-semibold" :class="overloaded ? 'text-red-600 dark:text-red-400' : 'text-foreground'">{{ fmt(loadW, 0) }} W</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">电池组总能量</span>
              <span class="text-sm font-semibold text-foreground">{{ fmt(packWhVal, 0) }} Wh</span>
            </div>
          </div>
        </div>

        <!-- 超容量与参数告警 -->
        <div v-if="inputsValid && overloaded" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-foreground">负载超过 UPS 可用容量（{{ fmt(loadRatio, 0) }}%）</p>
            <p class="text-xs text-muted-foreground mt-1">
              负载 {{ fmt(loadW, 0) }}W &gt; 可用 {{ fmt(usable, 0) }}W。超载时多数 UPS 会在数秒~数十秒内告警并切断输出，
              续航估算不再有意义，请先减载或更换更大容量 UPS。短时浪涌（电机/压缩机启动）可按 2~3 倍额定冲击考虑。
            </p>
          </div>
        </div>
        <div v-else-if="!inputsValid" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-foreground">暂无法计算</p>
            <p class="text-xs text-muted-foreground mt-1">请检查参数：VA &gt; 0，负载 &gt; 0，单体 Ah &gt; 0。</p>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 结果速读 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Timer class="w-5 h-5 mr-2 text-primary" /> 结果速读
          </h2>
          <div v-if="inputsValid" class="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">预计续航</span>
              <span class="font-semibold text-foreground">{{ fmt(runtimeMin, 1) }} 分钟</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">负载占可用功率</span>
              <span class="font-semibold text-foreground">{{ fmt(loadPct, 0) }}%</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">放电倍率</span>
              <span class="font-semibold text-foreground">{{ fmt(cRate, 2) }} C</span>
            </div>
          </div>
          <p v-else class="text-xs text-muted-foreground">填写左侧参数后这里给出速读摘要。</p>
          <p class="text-[11px] leading-relaxed text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border">
            想要更久续航：负载减半大约翻倍续航；串联节数只升电压不增容量，加大单体 Ah 才是加能量；
            同规格换磷酸铁锂可消除 Peukert 折减，但需确认 UPS 充电参数兼容。
          </p>
        </div>

        <!-- 电池健康 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <BatteryCharging class="w-5 h-5 mr-2 text-primary" /> 电池健康与更换
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>UPS 铅酸电池寿命一般 <span class="text-foreground font-medium">3~5 年</span>，浮充环境高温每升 10℃ 寿命约减半，到期建议整组同批更换。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>老化电池容量衰减，估算时把 Ah 按标称 <span class="text-foreground font-medium">×0.8</span> 代入更接近实际。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>串联使用务必同品牌同规格同批次，新旧混配会让弱电池提前反极拖垮整组。</span>
            </li>
          </ul>
        </div>

        <!-- 免责 -->
        <div class="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
            免责声明：本页为工程估算，未计入电池老化、温度、单体离散与机型放电曲线差异；
            供电保障方案请以 UPS 厂商放电曲线表与实测为准。
          </p>
        </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>VA 和 W 有什么区别？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          VA（伏安）是<span class="text-foreground font-medium">视在功率</span>，W（瓦）是<span class="text-foreground font-medium">有功功率</span>，
          两者比值就是功率因数 PF。UPS 按惯例用 VA 标容量（如 1000VA），而设备功耗是 W，
          所以可带负载要用 W = VA × PF 换算：老机型 PF 约 0.6~0.7，1000VA 只能带 600~700W；
          新机型 PF 可到 0.8~0.9，1000VA 能带 800~900W。反过来 300W 的设备在 PF=0.7 的机器上，
          至少需要 300 ÷ 0.7 ≈ 430VA 的 UPS。选型时还要留 20%~30% 余量给浪涌与未来扩容。

        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>Peukert 修正是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          铅酸电池的标称容量按 20 小时率（C20）标定：比如 9Ah 表示以 9÷20 = 0.45A 放 20 小时。
          放电电流一大，极板化学反应来不及充分进行，实际可放出的容量明显缩水——
          这就是 Peukert 效应。经验规律：<span class="text-foreground font-medium">1C 放电（1 小时放完）实际容量约为标称的 60%~70%</span>，
          5h 率约 82%~85%，10h 率约 90%~93%。UPS 断电时往往几分钟内就要放掉大部分电量（2C~5C），
          所以直接拿标称 Wh 除以负载 W 会严重高估续航。本工具按实际放电小时率在
          「20h 率 = 100%」与「1h 率 = 65%」之间做对数插值折减；锂电池没有这一效应，不折减。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>为什么 UPS 电池 3~5 年就要换？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          UPS 里的铅酸电池长期处于<span class="text-foreground font-medium">浮充</span>状态（满电恒压涓流），
          板栅腐蚀与电解液失水持续进行，容量逐年衰减；环境温度每升高 10℃，寿命大约减半。
          衰减到标称容量 80% 以下就应更换——此时按标称算出的续航已有两成以上水分，且衰减会加速。
          建议：每年做一次放电自检（部分机型有电池自检功能）；更换时整组同批换，
          不新旧混用；机房/机柜注意通风降温。锂电 UPS 循环寿命长得多，但成本也高，且要确认充电管理兼容。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>在线式与后备式 UPS 有什么区别？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          <span class="text-foreground font-medium">后备式（Offline/Standby）</span>：市电正常时设备直接用市电，
          停电才切到电池逆变，切换时间约 4~10ms，结构简单、效率高、便宜，适合台式机、NAS 等不太敏感的负载；
          <span class="text-foreground font-medium">在线式（Online 双变换）</span>：市电先整流再逆变，设备始终由逆变器供电，
          零切换时间且输出频率电压纯净，适合服务器、精密仪器，但全程双变换效率约 85%~94%（这正是本工具逆变器效率的取值范围），价格与发热也更高。
          介于两者之间的还有在线互动式（Line-Interactive），对电压波动可经变压器粗调，切换时间更短，是家用与办公折中方案。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">1000VA 的 UPS 能带多少 W？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              取决于功率因数：PF=0.6（老机）带 600W，PF=0.7 带 700W，PF=0.8 带 800W，PF=0.9（新机）带 900W。
              看铭牌标注的 PF 值最准；没标就按 0.6~0.7 保守估算并留余量。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么标称 216Wh 的电池组带 300W 算不出 43 分钟？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              因为大电流放电下铅酸实际容量只有标称的六成上下（Peukert 效应），再扣掉逆变器约 10% 的损耗，
              2×12V×9Ah 带 300W 实际约 20~25 分钟。直接用 216Wh ÷ 300W 会高估近一倍。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">串联节数增加能延长续航吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不能。串联只提高电压（功率 = 电压 × 电流），放电电流相应变小，单片电池的工作 burden 不变，
              续航基本不变；想让续航翻倍要用同规格电池先并一组（并联增容量），或直接换更大 Ah 的电池。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">可以用汽车启动电池或锂电给 UPS 吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              汽车启动电池面向瞬间大电流短放电，不适合 UPS 的浮充与中小电流长放电工况，寿命会很短；
              应选深循环或 UPS 专用铅酸。换锂电则必须确认 UPS 的浮充电压与充电曲线兼容磷酸铁锂，
              且原机为两段式铅酸充电逻辑时可能长期欠充或过充，不建议盲目替换。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ups-runtime'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  PlugZap, Calculator, Timer, Info, CheckCircle, AlertTriangle,
  ChevronUp, ChevronDown, BatteryCharging
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 电池单体标称电压（V）：UPS 常见 12V 铅酸/同压锂电单体
const MONO_V = 12

// 实际可用有功功率：W = VA × PF
function usableActiveWatts(va, pf) {
  if (!Number.isFinite(va) || !Number.isFinite(pf)) return null
  if (!(va > 0) || !(pf > 0) || pf > 1) return null
  return va * pf
}

// 负载占可用功率比例（>1 即超容量），返回小数
function loadRatioOf(loadW, va, pf) {
  const usable = usableActiveWatts(va, pf)
  if (usable === null || usable <= 0) return null
  if (!Number.isFinite(loadW) || loadW < 0) return null
  return loadW / usable
}

// 电池组总能量：Wh = 节数 × 12V × Ah（串联电流处处相等，组容量 Ah 不变）
function packWh(cells, ah) {
  if (!Number.isInteger(cells) || cells <= 0) return null
  if (!Number.isFinite(ah) || !(ah > 0)) return null
  return cells * MONO_V * ah
}

// 电池组直流放电电流：I = 负载 ÷ 逆变器效率 ÷ 组电压
function dischargeCurrentA(loadW, invEff, cells) {
  if (!Number.isFinite(loadW) || !(loadW > 0)) return null
  if (!Number.isFinite(invEff) || !(invEff > 0) || invEff > 1) return null
  if (!Number.isInteger(cells) || cells <= 0) return null
  return loadW / invEff / (cells * MONO_V)
}

// 放电小时率：h = 标称 Ah ÷ 放电电流（h 越小放电越猛，1h 即 1C）
function hourRateH(ah, currentA) {
  if (!Number.isFinite(ah) || !(ah > 0)) return null
  if (!Number.isFinite(currentA) || !(currentA > 0)) return null
  return ah / currentA
}

// 铅酸 Peukert 容量折减系数：标称按 ratedHour 小时率给出（常见 20h），
// 1h 率（1C）实际容量 ≈ 标称 × 0.65（0.6~0.7 中值），按放电小时率对数插值：
// f = 0.65 + 0.35 × ln(h) / ln(ratedHour)；h ≥ ratedHour 取 1，快速放电外推下限 0.35
function leadAcidCapacityFactor(h, ratedHour) {
  if (!Number.isFinite(h) || !(h > 0)) return null
  if (!Number.isFinite(ratedHour) || !(ratedHour > 1)) return null
  if (h >= ratedHour) return 1
  const f = 0.65 + 0.35 * (Math.log(h) / Math.log(ratedHour))
  return Math.min(1, Math.max(0.35, f))
}

// 预计续航（分钟）：串联电流处处相等，按单体口径 t = Ah × f ÷ I；
// 锂电无 Peukert 效应 f=1；逆变器效率已折进放电电流 I
function packRuntimeMinutes(loadW, invEff, cells, ah, chemistry, ratedHour) {
  const i = dischargeCurrentA(loadW, invEff, cells)
  if (i === null) return null
  if (!Number.isFinite(ah) || !(ah > 0)) return null
  let f = 1
  if (chemistry === 'lead') {
    f = leadAcidCapacityFactor(hourRateH(ah, i), ratedHour)
    if (f === null) return null
  }
  return (ah * f / i) * 60
}
// ==== PURE-FNS-END ====

// SEO
useSeoMeta({
  title: 'UPS续航估算 - 在线UPS能用多久计算器',
  description: '在线 UPS 续航计算器：VA×功率因数换算可用功率并判断超载，12V 电池节数×单体 Ah 汇总电池组能量，铅酸按放电小时率做 Peukert 容量折减（1C 约为标称 0.6~0.7），扣除逆变器效率后给出放电分钟数，纯本地计算。',
  keywords: 'UPS续航,UPS能用多久,VA换算W,Peukert,UPS电池计算,后备电源时间,UPS电池更换',
  author: '有条工具',
  ogTitle: 'UPS续航估算 - 有条工具',
  ogDescription: 'VA×PF→可用功率，电池 Wh 经 Peukert 修正与逆变器损耗→放电分钟数',
  ogUrl: 'https://www.util.cn/tools/ups-runtime',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'UPS续航估算',
  twitterDescription: '负载、电池节数与 Ah→UPS 放电分钟数，含 Peukert 修正与超载判断'
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
          name: 'UPS续航估算',
          url: 'https://www.util.cn/tools/ups-runtime',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'VA×功率因数换算可用功率',
            '负载超容量判断',
            '电池组 Wh 汇总（12V×节数×Ah）',
            '铅酸 Peukert 放电小时率插值折减',
            '锂电无 Peukert 效应注记',
            '逆变器效率 0.85~0.95 可调',
            '续航分钟/小时双显示'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: 'UPS续航估算', item: 'https://www.util.cn/tools/ups-runtime' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1000VA 的 UPS 能带多少 W？',
              acceptedAnswer: { '@type': 'Answer', text: '取决于功率因数：PF=0.6 带 600W，0.7 带 700W，0.8 带 800W，0.9 带 900W，以 UPS 铭牌标注的 PF 为准。' }
            },
            {
              '@type': 'Question',
              name: 'Peukert 修正是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '铅酸电池大电流放电实际可用容量低于标称：1C 放电约为 20h 率标称的 60%~70%，本工具按放电小时率对数插值折减；锂电池无此效应。' }
            },
            {
              '@type': 'Question',
              name: '为什么 UPS 电池 3~5 年就要换？',
              acceptedAnswer: { '@type': 'Answer', text: '浮充环境下板栅腐蚀与失水持续进行，容量逐年衰减，到标称 80% 以下应整组更换；高温每升 10℃ 寿命约减半。' }
            },
            {
              '@type': 'Question',
              name: '在线式与后备式 UPS 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '后备式停电才切换（4~10ms），便宜高效；在线式零切换、输出纯净，适合服务器，但双变换效率约 85%~94%。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'ups-runtime'
const SETTINGS_KEY = 'ups-runtime-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 状态 ----------
const vaUps = ref(1000)
const loadW = ref(300)
const pf = ref(0.7)
const cells = ref(2)
const ahPreset = ref(9)
const ahCustom = ref(null)   // 自定义 Ah 时有值
const chemistry = ref('lead')
const ratedHour = ref(20)
const inverterEff = ref(0.9)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const PF_PRESETS = [0.6, 0.7, 0.8, 0.9]
const CELL_OPTIONS = [
  { value: 1, label: '1 节（12V 机）' },
  { value: 2, label: '2 节（24V 机）' },
  { value: 4, label: '4 节（48V 机）' }
]
const AH_PRESETS = [7, 9, 12, 26, 100]
const CHEM_OPTIONS = [
  { value: 'lead', label: '铅酸（UPS 常见）' },
  { value: 'li', label: '锂电 / 磷酸铁锂' }
]
const RATED_HOUR_OPTIONS = [
  { value: 20, label: '20h 率（常见）' },
  { value: 10, label: '10h 率' },
  { value: 5, label: '5h 率' }
]
const CHEM_NOTES = {
  lead: '铅酸：大电流放电按 Peukert 折减实际容量',
  li: '锂电：无 Peukert 效应，容量基本按标称放出'
}
const chemistryNote = computed(() => CHEM_NOTES[chemistry.value] || '')

function applyAh(a) {
  ahPreset.value = a
  ahCustom.value = null
}

// 单体 Ah：预设或自定义
const ahEff = computed(() => {
  const c = Number(ahCustom.value)
  if (Number.isFinite(c) && c > 0) return c
  return ahPreset.value
})

// ---------- 计算联动 ----------
const inputsValid = computed(() => {
  const usable = usableActiveWatts(Number(vaUps.value), Number(pf.value))
  return usable !== null &&
    Number.isFinite(loadW.value) && loadW.value > 0 &&
    packWh(cells.value, ahEff.value) !== null
})

const usable = computed(() => usableActiveWatts(Number(vaUps.value), Number(pf.value)))
const packWhVal = computed(() => packWh(cells.value, ahEff.value))
const packV = computed(() => (packWhVal.value === null ? null : cells.value * MONO_V))
const currentA = computed(() => dischargeCurrentA(Number(loadW.value), Number(inverterEff.value), cells.value))
const hourRate = computed(() => (currentA.value === null ? null : hourRateH(ahEff.value, currentA.value)))
const cRate = computed(() => (hourRate.value && hourRate.value > 0 ? 1 / hourRate.value : null))
const capFactor = computed(() => {
  if (chemistry.value !== 'lead') return 1
  if (hourRate.value === null) return null
  return leadAcidCapacityFactor(hourRate.value, Number(ratedHour.value))
})
const runtimeMin = computed(() => packRuntimeMinutes(
  Number(loadW.value), Number(inverterEff.value), cells.value, ahEff.value,
  chemistry.value, Number(ratedHour.value)
))
const runtimeHour = computed(() => (runtimeMin.value === null ? null : runtimeMin.value / 60))
const loadRatio = computed(() => loadRatioOf(Number(loadW.value), Number(vaUps.value), Number(pf.value)))
const overloaded = computed(() => loadRatio.value !== null && loadRatio.value > 1)
const loadPct = computed(() => (loadRatio.value === null ? null : loadRatio.value * 100))

// ---------- 格式化 ----------
function fmt(v, d = 2) {
  return Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—'
}
function hoursText(minutes) {
  if (!Number.isFinite(minutes) || !(minutes > 0)) return '—'
  const total = Math.round(minutes)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return m + ' 分钟'
  return h + ' 小时 ' + m + ' 分'
}

// ---------- 设置持久化（localStorage，键前缀用工具 id，仅 onMounted/交互回调触达） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (Number.isFinite(s.vaUps) && s.vaUps > 0) vaUps.value = s.vaUps
    if (Number.isFinite(s.loadW) && s.loadW > 0) loadW.value = s.loadW
    if (PF_PRESETS.includes(s.pf)) pf.value = s.pf
    if ([1, 2, 4].includes(s.cells)) cells.value = s.cells
    if (Number.isFinite(s.ahCustom) && s.ahCustom > 0) ahCustom.value = s.ahCustom
    if (AH_PRESETS.includes(s.ahPreset)) ahPreset.value = s.ahPreset
    if (s.chemistry === 'lead' || s.chemistry === 'li') chemistry.value = s.chemistry
    if (RATED_HOUR_OPTIONS.some(o => o.value === s.ratedHour)) ratedHour.value = s.ratedHour
    if (Number.isFinite(s.inverterEff) && s.inverterEff >= 0.85 && s.inverterEff <= 0.95) inverterEff.value = s.inverterEff
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([vaUps, loadW, pf, cells, ahPreset, ahCustom, chemistry, ratedHour, inverterEff], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      vaUps: vaUps.value,
      loadW: loadW.value,
      pf: pf.value,
      cells: cells.value,
      ahPreset: ahPreset.value,
      ahCustom: ahCustom.value,
      chemistry: chemistry.value,
      ratedHour: ratedHour.value,
      inverterEff: inverterEff.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
