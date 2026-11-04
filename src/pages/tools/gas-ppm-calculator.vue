<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Wind class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">气体 ppm 与 mg/m³ 换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">职业卫生 / 环境烟气 / 新装修甲醛检测的体积浓度与质量浓度互算，支持 25℃ 与 0℃ 两档标准状态与 14 种常见气体</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线气体浓度换算工具：ppm（体积百万分比）与 mg/m³（质量浓度）之间随摩尔质量与温度换算，C(mg/m³) = ppm × M ÷ Vm。
        职业卫生（IH）常用 25℃/101.325kPa 口径（Vm=24.45），环保烟气常用 0℃ 标况口径（Vm=22.4）。
        内置甲醛、苯、甲苯、二甲苯、CO、CO₂、SO₂、NO₂、NH₃、Cl₂、H₂S、O₃、TVOC 等常见气体的标准摩尔质量与职业接触限值参考卡，
        换算后自动与限值线比对给出超标/接近/合格判定。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 text-xs leading-relaxed bg-muted/60 border border-border rounded-lg p-3 mb-6">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span class="text-foreground">换算基于理想气体状态方程（标准状态 25℃/101.325kPa 或 0℃ 两档），高压、高湿、非理想气体有偏差；职业限值以 GBZ 2.1 现行文本为准。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5 h-fit">
        <h2 class="text-lg font-semibold flex items-center">
          <Wind class="w-5 h-5 mr-2 text-primary" /> 换算输入
        </h2>

        <!-- 双向切换 -->
        <div>
          <div class="grid grid-cols-2 gap-1 bg-muted rounded-lg p-1">
            <button
              @click="setDirection('ppm2mg')"
              class="px-3 py-2 rounded-md text-sm font-medium transition"
              :class="direction === 'ppm2mg' ? 'bg-card border border-border text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'"
            >ppm → mg/m³</button>
            <button
              @click="setDirection('mg2ppm')"
              class="px-3 py-2 rounded-md text-sm font-medium transition"
              :class="direction === 'mg2ppm' ? 'bg-card border border-border text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'"
            >mg/m³ → ppm</button>
          </div>
          <button
            @click="toggleDirection"
            class="w-full mt-2 px-3 py-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
          >⇄ 快速交换输入方向</button>
        </div>

        <!-- 数值输入 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">{{ inputLabelText }}</label>
          <input
            v-model="rawInput"
            @change="recordCurrent"
            type="number"
            step="any"
            min="0"
            inputmode="decimal"
            class="w-full px-3 py-2.5 rounded-lg border border-border border-border bg-background text-foreground text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            :placeholder="direction === 'ppm2mg' ? '例如 0.08' : '例如 30'"
          />
        </div>

        <!-- 气体选择 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">气体种类</label>
          <select
            v-model="gasId"
            @change="recordCurrent"
            class="w-full px-3 py-2 rounded-lg border border-border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="g in GASES" :key="g.id" :value="g.id">{{ g.name }}（{{ g.formula }}，M={{ g.m }} g/mol）</option>
          </select>
          <p v-if="currentGas.note" class="text-xs text-muted-foreground mt-1.5 leading-relaxed">{{ currentGas.note }}</p>
          <div class="mt-2">
            <label class="block text-xs text-muted-foreground mb-1">自定义摩尔质量 M（g/mol，留空则用上表标准值）</label>
            <input
              v-model="customM"
              @change="recordCurrent"
              type="number"
              step="any"
              min="0"
              inputmode="decimal"
              class="w-full px-3 py-2 rounded-lg border border-border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="混合气 / 其他气体才需要填"
            />
          </div>
        </div>

        <!-- 温度档 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-1.5 flex items-center">
            <Thermometer class="w-4 h-4 mr-1.5 text-primary" /> 标准状态口径
          </p>
          <div class="space-y-2">
            <button
              v-for="t in TEMP_OPTIONS"
              :key="t.id"
              @click="setTemp(t.id)"
              class="w-full text-left px-3 py-2.5 rounded-lg border transition"
              :class="tempId === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'"
            >
              <span class="block text-sm font-medium text-foreground">{{ t.label }}</span>
              <span class="block text-xs text-muted-foreground mt-0.5">{{ t.desc }}</span>
            </button>
          </div>
        </div>

        <!-- 预设 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">常用示例</p>
          <div class="space-y-2">
            <button
              v-for="p in PRESETS"
              :key="p.id"
              @click="applyPreset(p)"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted border border-border text-sm text-foreground transition text-left"
            >
              <Play class="w-3.5 h-3.5 text-primary flex-shrink-0" /> {{ p.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：结果 + 限值 + 小卡 + 历史 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 换算结果 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 换算结果
            </h2>
            <button
              @click="copyResult"
              class="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
            >
              <Copy class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 复制结果
            </button>
          </div>

          <p v-if="copyHint" class="text-xs text-green-600">{{ copyHint }}</p>

          <template v-if="result">
            <div class="bg-primary/5 rounded-lg p-5 text-center">
              <p class="text-xs text-muted-foreground mb-1">{{ outUnit }} 结果</p>
              <p class="text-4xl sm:text-5xl font-bold text-primary font-mono break-all">
                {{ resultText }}<span class="text-lg font-normal text-muted-foreground ml-2">{{ outUnit }}</span>
              </p>
              <p class="text-xs text-muted-foreground mt-2">
                双向对照：{{ fmt(ppmValue) }} ppm ⇌ {{ fmt(mg3Value) }} mg/m³（{{ currentGas.name }}<span v-if="usingCustomM">·自定义 M</span>，{{ tempOption.label }}）
              </p>
            </div>

            <!-- 公式代入行 -->
            <div class="bg-muted/50 rounded-lg p-3 font-mono text-sm text-foreground break-all">
              {{ result.formula }}
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              换算依据：C(mg/m³) = ppm × M ÷ Vm。本条取 M = {{ molarMass }} g/mol，Vm = {{ tempOption.vm }} L/mol（{{ tempOption.kelvin }}K / 101.325 kPa 理想气体摩尔体积）。
            </p>
          </template>
          <p v-else class="text-sm text-muted-foreground py-6 text-center">
            输入一个 {{ inUnit }} 数值后，这里会实时给出换算结果与判定徽章。
          </p>
        </div>

        <!-- 职业接触限值参考卡 + 判定徽章 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> {{ currentGas.name }} 职业接触限值参考
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-[10px] text-muted-foreground mb-1">限值类型与数值（mg/m³）</p>
              <p class="text-xl font-bold text-foreground">{{ limitCardTitle }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ limitCardSource }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-[10px] text-muted-foreground mb-1">与参考线比对（以本气体限值为基准）</p>
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium" :class="judgmentMeta.class">
                <CheckCircle v-if="judgment.state === 'ok'" class="w-4 h-4" />
                <TriangleAlert v-else-if="judgment.state === 'near' || judgment.state === 'over'" class="w-4 h-4" />
                <Info v-else class="w-4 h-4" />
                {{ judgmentMeta.label }}
              </span>
              <p class="text-xs text-muted-foreground mt-2 leading-relaxed">{{ judgment.hint }}</p>
            </div>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed">
            判定口径：以换算出的质量浓度与限值数值比较，超过限值为「超标」，达到限值 80%~100% 为「接近限值」，低于 80% 为「合格」；{{ currentGas.name }}在表内无数值限限时显示「无参考线」。
            限值仅为常见公开口径的静态参考（GBZ 2.1 工作场所有害因素职业接触限值；TVOC 一栏为 GB/T 18883 室内空气质量口径），是否合规以现行标准文本与原检测报告的计量方式为准。
          </p>
        </div>

        <!-- 知识小卡 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="bg-card border border-border rounded-lg p-5 space-y-2">
            <h3 class="text-sm font-semibold text-foreground flex items-center">
              <Thermometer class="w-4 h-4 mr-1.5 text-primary" /> 为什么 22.4 和 24.45 不一样？
            </h3>
            <ol class="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground leading-relaxed">
              <li>理想气体状态方程 pV = nRT ⇒ 摩尔体积 Vm = RT ÷ p，只随温度（与压力）变化。</li>
              <li>0℃（273.15K）、101.325kPa：Vm = 22.414 ≈ <span class="font-mono text-foreground">22.4</span> L/mol，环保烟气「标准状态」沿用此口径。</li>
              <li>25℃（298.15K）、101.325kPa：Vm = 0.08206 × 298.15 ≈ <span class="font-mono text-foreground">24.45</span> L/mol（精确 24.465），职业卫生 / IH 文献约定值。</li>
            </ol>
            <p class="text-xs text-muted-foreground">同一 ppm 换算成 mg/m³，用 22.4（分母更小）会比用 24.45 大出约 9%（24.45÷22.4≈1.0915），报告口径不同临界结论可能相反，必须注明温度档。</p>
          </div>

          <div class="bg-card border border-border rounded-lg p-5 space-y-2">
            <h3 class="text-sm font-semibold text-foreground flex items-center">
              <TriangleAlert class="w-4 h-4 mr-1.5 text-red-500" /> 家用甲醛自测盒的单位提醒
            </h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              甲醛自测盒 / 化验报告通常直接读 <span class="font-mono text-foreground">mg/m³</span>（国标 GB/T 18883 限值 0.08 mg/m³ 也是这个单位），
              而不少电化学传感器检测仪默认显示 <span class="font-mono text-foreground">ppb</span>。1 ppm = 1000 ppb，单位看错一档就是 1000 倍的误读；
              以甲醛计 0.08 mg/m³ ≈ 65 ppb ≈ 0.065 ppm，若仪器显示「65」而你以为单位是 mg/m³，就会把达标误判成严重超标。
              读数前先确认仪器单位与温度口径，再用本工具换算比对。
            </p>
          </div>
        </div>

        <!-- 换算历史链 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">换算记录（最近 {{ HISTORY_MAX }} 条）</h2>
            <button
              v-if="history.length"
              @click="clearHistory"
              class="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition"
            >
              <RefreshCw class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 清空记录
            </button>
          </div>
          <p v-if="!history.length" class="text-sm text-muted-foreground">
            修改数值、切换气体 / 温度 / 方向或点示例时会自动留一行记录，方便甲醛、苯逐项排查时来回对照。
          </p>
          <ul v-else class="divide-y divide-border">
            <li v-for="(h, i) in history" :key="`${h.gasName}-${h.inputRaw}-${h.inUnit}-${h.tempVm}-${i}`" class="py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span class="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground flex-shrink-0">{{ h.gasName }}</span>
              <span class="font-mono text-foreground">{{ h.inputRaw }} {{ h.inUnit }}</span>
              <span class="text-muted-foreground">×</span>
              <span class="font-mono text-xs text-muted-foreground">M{{ h.m }}÷{{ h.tempVm }}</span>
              <span class="font-mono font-semibold text-primary">{{ fmt(h.ppm) }} ppm ⇌ {{ fmt(h.mg3) }} mg/m³</span>
            </li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>气体 ppm 和 mg/m³ 到底怎么换算？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          ppm 是体积浓度：一百万份空气里占几份该气体（1 ppm = 10⁻⁶ 体积分数）；mg/m³ 是质量浓度：每立方米空气里含几毫克该气体。
          两者之间隔着两个物理量——该气体的摩尔质量 M（g/mol）和空气的状态（温度、压力决定 1 mol 气体占多大体积）。
          按理想气体状态方程，标准大气压下 1 mol 气体占 Vm 升（0℃ 为 22.4 L、25℃ 为 24.45 L），
          于是 1 ppm 的气体在每立方米空气中占 10⁻⁶ m³，即 10⁻³/Vm mol，乘以 M 并换算成毫克，化简后就是：
        </p>
        <div class="bg-muted/50 rounded-lg p-3 font-mono text-sm text-foreground mb-4">
          C (mg/m³) = ppm × M ÷ 22.4（0℃）　或　C (mg/m³) = ppm × M ÷ 24.45（25℃）<br />
          ppm = C (mg/m³) × Vm ÷ M
        </div>
        <p class="text-sm text-muted-foreground leading-relaxed">
          例：新装修房间测得甲醛 0.08 ppm（25℃ 口径），C = 0.08 × 30.03 ÷ 24.45 ≈ 0.098 mg/m³，比室内国标限值 0.08 mg/m³ 略高；
          同一份苯 5 ppm 报告换算成质量浓度约 15.97 mg/m³，已远超职业接触限值 6 mg/m³（PC-TWA）。单位与口径一致，结论才可比。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">22.4 什么时候用，24.45 什么时候用？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>24.45（25℃/101.325kPa）：职业卫生检测、工作场所空气、室内空气质量领域通行口径，美国 IH 与多数 GBZ 配套检测方法均按此换算。</li>
          <li>22.4（0℃/101.325kPa，即「标准状态 / 标况」）：环境空气、固定源烟气监测的传统口径，烟尘烟气排放标准、环评报告多按标况体积计。</li>
          <li>拿到一份检测报告先看采样/计算条件写的是 25℃ 还是 0℃（或「标况」「工况」），用错分母结果差约 9%，临界值判定可能被翻转。</li>
          <li>少数企业或旧文献用 20℃（Vm≈24.0）或 273K+101.325kPa 之外的压力口径，务必按报告附注的常数代入。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么换一种气体要改摩尔质量？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          ppm 只描述「分子个数占比」，与分子多重无关；mg/m³ 则把分子重量算进来了。同样 1 ppm，CO₂（M=44.01）每立方米约 1.8 mg（25℃），
          而 NH₃（M=17.03）只有约 0.7 mg——摩尔质量越大，同一 ppm 对应的质量浓度越大。因此换算必须按被测气体取各自 M：
          甲醛 30.03、苯 78.11、甲苯 92.14、二甲苯 106.17、CO 28.01、SO₂ 64.07、NO₂ 46.01、Cl₂ 70.9、H₂S 34.08、O₃ 48 等。
          TVOC 是「总挥发性有机物」，没有单一分子与摩尔质量，工程上常近似按甲苯 92.14 折算，只能作量级估计，不能当精确值。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">ppb 和 ppm 是什么关系？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          都是体积分数单位，1 ppm = 1000 ppb（百万分之一 vs 十亿分之一）。换算公式不变，只是 ppm 数值要除以 1000：
          C (mg/m³) = ppb × M ÷ Vm ÷ 1000。家用甲醛检测仪常以 ppb 显示（甲醛限值 0.08 mg/m³ ≈ 65 ppb），
          自测盒则以 mg/m³ 比色读数——两者相差 1000 倍的读数口径是家庭检测最常见的误读来源，读数前先确认单位。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">家用检测仪和实验室方法差在哪？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          实验室按标准方法采样分析（甲醛用酚试剂分光光度法 / AHMT 高效液相色谱法，苯系物用活性炭管吸附-热解吸气相色谱法），
          有流量校准、空白对照与不确定度控制，结果可直接对表限值。家用电化学仪与自测盒受温湿度、酒精、香水、烹调用 VOC 交叉干扰明显，
          漂移大、重复性差，只适合定性筛查与趋势观察。判断「能不能入住 / 车间是否合规」应以有 CMA 资质的实验室报告为准，
          本工具负责把两边的单位与口径换算到同一条基准线上。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">甲醛报告写 0.08 ppm，限值 0.08 mg/m³，到底超没超？</h3>
            <p class="text-sm text-muted-foreground mt-1">单位不同不能直接比数值。按 25℃ 口径 0.08 ppm × 30.03 ÷ 24.45 ≈ 0.098 mg/m³，高于 0.08 mg/m³ 的室内限值，属于轻度超标；若按 0℃ 的 22.4 口径则为 0.107 mg/m³。先确认报告温度口径再判定。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">换算用 22.4 还是 24.45？</h3>
            <p class="text-sm text-muted-foreground mt-1">看领域惯例：职业卫生、室内空气质量检测用 24.45（25℃/101.325kPa），环境烟气、排放监测的标况体积用 22.4（0℃/101.325kPa）。用错分母结果相差约 9%，接近限值时可能直接翻转达标结论。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">TVOC 为什么没有准确的摩尔质量？</h3>
            <p class="text-sm text-muted-foreground mt-1">TVOC 是非甲烷性挥发性有机物的总量，成分随环境变化，没有单一分子量。本工具近似取甲苯的 92.14 g/mol 折算，只用于量级估计；TVOC 限值（如 GB/T 18883 的 0.60 mg/m³）本身就是按色谱总面积折算的质量口径，应直接以 mg/m³ 对表，不做 ppm 精确换算。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'gas-ppm-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Wind, Thermometer, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '气体 ppm 与 mg/m³ 换算器 - 在线气体浓度换算工具（25℃/0℃ 双口径）',
  description: '免费在线气体浓度换算工具，ppm 与 mg/m³ 双向互算，内置甲醛、苯、甲苯、CO、CO₂、SO₂、NH₃ 等 14 种常见气体摩尔质量与职业接触限值参考，24.45/22.4 两档标准状态口径，自动判定超标/接近/合格，纯浏览器本地计算不上传',
  keywords: 'ppm 换算 mg/m3,气体浓度换算,甲醛 ppm,职业接触限值换算,烟气浓度',
  author: '有条工具',
  ogTitle: '气体 ppm 与 mg/m³ 换算器 | 有条工具',
  ogDescription: 'ppm 与 mg/m³ 双向换算，25℃/0℃ 两档口径，14 种常见气体摩尔质量与职业限值参考卡，换算后自动判定超标。',
  ogUrl: 'https://www.util.cn/tools/gas-ppm-calculator',
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
          name: '气体 ppm 与 mg/m³ 换算器',
          url: 'https://www.util.cn/tools/gas-ppm-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['ppm 与 mg/m³ 双向换算', '25℃(24.45) 与 0℃(22.4) 两档标准状态', '14 种常见气体摩尔质量预设', '自定义摩尔质量', '职业接触限值参考卡与超标判定', '换算记录对照链', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '气体 ppm 与 mg/m³ 换算器', item: 'https://www.util.cn/tools/gas-ppm-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '甲醛报告写 0.08 ppm，限值 0.08 mg/m³，到底超没超？',
              acceptedAnswer: { '@type': 'Answer', text: '单位不同不能直接比数值。按 25℃ 口径 0.08 ppm × 30.03 ÷ 24.45 ≈ 0.098 mg/m³，高于 0.08 mg/m³ 的室内限值，属轻度超标；若按 0℃ 的 22.4 口径则为 0.107 mg/m³。先确认报告温度口径再判定，职业限值以 GBZ 2.1 现行文本为准。' }
            },
            {
              '@type': 'Question',
              name: '换算用 22.4 还是 24.45？',
              acceptedAnswer: { '@type': 'Answer', text: '看领域惯例：职业卫生与室内空气质量检测用 24.45（25℃/101.325kPa），环境烟气、排放监测的标况体积用 22.4（0℃/101.325kPa）。用错分母结果相差约 9%，接近限值时可能直接翻转达标结论。' }
            },
            {
              '@type': 'Question',
              name: 'TVOC 为什么没有准确的摩尔质量？',
              acceptedAnswer: { '@type': 'Answer', text: 'TVOC 是挥发性有机物总量，成分随环境变化，没有单一分子量。本工具近似按甲苯 92.14 g/mol 折算，只用于量级估计；TVOC 限值本身按质量口径（如 GB/T 18883 的 0.60 mg/m³）直接对表，不做 ppm 精确换算。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
//
// 推导（理想气体）：
//   pV = nRT  ⇒  摩尔体积 Vm = RT/p
//     0℃ (273.15 K) / 101.325 kPa：Vm = 8.314 × 273.15 / 101.325 ≈ 22.414 → 常数取 22.4 L/mol（环保标况口径）
//     25℃ (298.15 K) / 101.325 kPa：Vm = 8.314 × 298.15 / 101.325 ≈ 24.465 → 常数取 24.45 L/mol（职业卫生/IH 约定值）
//   ppm 为体积百万分比：1 ppm 表示每 1 m³ 空气含 10⁻⁶ m³ 待测气体，
//   其物质的量 = 10⁻³ L ÷ Vm(L/mol) = 10⁻³/Vm mol，质量 = 10⁻³/Vm × M g = M/Vm mg（每 m³ 空气），
//   故一般式：C(mg/m³) = ppm × M ÷ Vm；逆变换：ppm = C(mg/m³) × Vm ÷ M。
//   （ppb 口径：C = ppb × M ÷ Vm ÷ 1000，因 1 ppm = 1000 ppb。）

const MOLAR_VOLUME_0C = 22.4    // 0℃ 标况摩尔体积 L/mol（精确 22.414，环保烟气惯用口径）
const MOLAR_VOLUME_25C = 24.45  // 25℃ 摩尔体积 L/mol（精确 24.465，职业卫生/IH 惯用口径）
const HISTORY_MAX = 10
const NEAR_RATIO = 0.8          // 达到限值 80% 即判定「接近限值」

const TEMP_OPTIONS = [
  {
    id: 't25', label: '25℃ / 101.325 kPa（职业卫生常用）', vm: MOLAR_VOLUME_25C, kelvin: '298.15',
    desc: 'Vm = 24.45 L/mol（精确 24.465），IH 与 GBZ 配套检测方法的约定分母'
  },
  {
    id: 't0', label: '0℃ / 101.325 kPa（环保烟气标况）', vm: MOLAR_VOLUME_0C, kelvin: '273.15',
    desc: 'Vm = 22.4 L/mol（精确 22.414），烟尘烟气排放监测「标准状态」口径'
  }
]

// 常见气体：M 为标准摩尔质量（g/mol，IUPAC 原子量合成）；limit.value 为常见公开口径的职业/室内限值（mg/m³），
// 仅静态参考，判定前须以 GBZ 2.1（工作场所）或 GB/T 18883（室内）现行文本为准。
const GASES = [
  { id: 'formaldehyde', name: '甲醛', formula: 'CH₂O', m: 30.03, note: '', limit: { type: 'MAC', value: 0.5, source: 'GBZ 2.1 甲醛（以现行文本为准）' } },
  { id: 'benzene', name: '苯', formula: 'C₆H₆', m: 78.11, note: '', limit: { type: 'PC-TWA', value: 6, source: 'GBZ 2.1 苯（以现行文本为准）' } },
  { id: 'toluene', name: '甲苯', formula: 'C₇H₈', m: 92.14, note: '', limit: { type: 'PC-TWA', value: 50, source: 'GBZ 2.1 甲苯（以现行文本为准）' } },
  { id: 'xylene', name: '二甲苯', formula: 'C₈H₁₀', m: 106.17, note: '', limit: { type: 'PC-TWA', value: 50, source: 'GBZ 2.1 二甲苯（以现行文本为准）' } },
  { id: 'carbon-monoxide', name: '一氧化碳', formula: 'CO', m: 28.01, note: '', limit: { type: 'PC-TWA', value: 20, source: 'GBZ 2.1 一氧化碳（以现行文本为准）' } },
  { id: 'carbon-dioxide', name: '二氧化碳', formula: 'CO₂', m: 44.01, note: '', limit: { type: 'MAC', value: 9000, source: 'GBZ 2.1 二氧化碳（以现行文本为准）' } },
  { id: 'sulfur-dioxide', name: '二氧化硫', formula: 'SO₂', m: 64.07, note: '环境烟气核算常用 22.4（0℃）口径', limit: { type: 'PC-TWA', value: 5, source: 'GBZ 2.1 二氧化硫（以现行文本为准）' } },
  { id: 'nitrogen-dioxide', name: '二氧化氮', formula: 'NO₂', m: 46.01, note: '环境烟气核算常用 22.4（0℃）口径', limit: null },
  { id: 'nitric-oxide', name: '一氧化氮', formula: 'NO', m: 30.01, note: '', limit: null },
  { id: 'ammonia', name: '氨', formula: 'NH₃', m: 17.03, note: '', limit: { type: 'PC-TWA', value: 20, source: 'GBZ 2.1 氨（以现行文本为准）' } },
  { id: 'chlorine', name: '氯气', formula: 'Cl₂', m: 70.9, note: '', limit: { type: 'MAC', value: 1, source: 'GBZ 2.1 氯（以现行文本为准）' } },
  { id: 'hydrogen-sulfide', name: '硫化氢', formula: 'H₂S', m: 34.08, note: '', limit: { type: 'MAC', value: 10, source: 'GBZ 2.1 硫化氢（以现行文本为准）' } },
  { id: 'ozone', name: '臭氧', formula: 'O₃', m: 48, note: '', limit: { type: 'PC-TWA', value: 0.3, source: 'GBZ 2.1 臭氧（以现行文本为准）' } },
  { id: 'tvoc', name: 'TVOC', formula: '≈C₇H₈', m: 92.14, note: 'TVOC 无单一摩尔质量，此处近似按甲苯（92.14）折算，仅供量级估计', limit: { type: '室内限值', value: 0.6, source: 'GB/T 18883 室内空气质量标准（近似甲苯口径）' } }
]

// ppm → mg/m³：C = ppm × M ÷ Vm
function ppmToMg3(ppm, molarMass, molarVolume) {
  return (ppm * molarMass) / molarVolume
}

// mg/m³ → ppm：ppm = C × Vm ÷ M
function mg3ToPpm(mg3, molarMass, molarVolume) {
  return (mg3 * molarVolume) / molarMass
}

// 输入解析：非负有限数，空串/非法返回 null
function parseInput(text) {
  const s = String(text).trim()
  if (s === '') return null
  const n = Number(s)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

// 有效摩尔质量：自定义值优先（须为正有限数），否则用气体表标准值
function effectiveMolarMass(gas, customMText) {
  const c = Number(String(customMText).trim())
  if (Number.isFinite(c) && c > 0) return { m: c, custom: true }
  return { m: gas.m, custom: false }
}

// 展示格式化：按数量级取有效位，0 → "0"
function fmt(n) {
  if (!Number.isFinite(n)) return '—'
  const a = Math.abs(n)
  if (a === 0) return '0'
  if (a >= 1000) return n.toFixed(0)
  if (a >= 100) return n.toFixed(1)
  if (a >= 1) return n.toFixed(2)
  if (a >= 0.01) return n.toFixed(3)
  return n.toExponential(2)
}

// 公式左侧原始数值：去多余小数尾零的紧凑写法
function trimNum(n) {
  if (!Number.isFinite(n)) return '—'
  return String(Number(n.toPrecision(6)))
}

// 双向换算 + 公式代入行；输入非法返回 null
function convert(rawInput, direction, molarMass, molarVolume) {
  const v = parseInput(rawInput)
  if (v === null || !(molarMass > 0)) return null
  if (direction === 'ppm2mg') {
    const out = ppmToMg3(v, molarMass, molarVolume)
    return {
      inUnit: 'ppm', outUnit: 'mg/m³', value: out, ppm: v, mg3: out,
      formula: `${trimNum(v)} ppm × ${molarMass} ÷ ${molarVolume} = ${fmt(out)} mg/m³`
    }
  }
  const out = mg3ToPpm(v, molarMass, molarVolume)
  return {
    inUnit: 'mg/m³', outUnit: 'ppm', value: out, ppm: out, mg3: v,
    formula: `${trimNum(v)} mg/m³ × ${molarVolume} ÷ ${molarMass} = ${fmt(out)} ppm`
  }
}

// 限值判定：over 超标 / near 接近(≥80%) / ok 合格 / none 无参考线
function judgeVsLimit(mg3, limit) {
  if (!limit || !(limit.value > 0)) return { state: 'none', ratio: null }
  const ratio = mg3 / limit.value
  if (ratio > 1) return { state: 'over', ratio }
  if (ratio >= NEAR_RATIO) return { state: 'near', ratio }
  return { state: 'ok', ratio }
}

// 历史链：新记录置顶，连续同键去重，最多 HISTORY_MAX 条
function historyKey(e) {
  return [e.gasName, e.inputRaw, e.inUnit, e.tempVm].join('|')
}
function appendHistory(list, entry) {
  if (list.length && historyKey(list[0]) === historyKey(entry)) return list
  return [entry].concat(list).slice(0, HISTORY_MAX)
}

// 预设（手算基准，25℃ 口径）：
//   甲醛 0.08 ppm → 0.08×30.03÷24.45 ≈ 0.098 mg/m³
//   苯   5 ppm    → 5×78.11÷24.45   ≈ 15.97 mg/m³
//   CO   30 mg/m³ → 30×24.45÷28.01  ≈ 26.2 ppm（公式精确值；旧笔记 26.8 为误记）
const PRESETS = [
  { id: 'p1', label: '甲醛 0.08 ppm → mg/m³（≈0.098）', gasId: 'formaldehyde', direction: 'ppm2mg', input: '0.08', tempId: 't25' },
  { id: 'p2', label: '苯 5 ppm → mg/m³（≈15.97）', gasId: 'benzene', direction: 'ppm2mg', input: '5', tempId: 't25' },
  { id: 'p3', label: 'CO 30 mg/m³ → ppm（≈26.2）', gasId: 'carbon-monoxide', direction: 'mg2ppm', input: '30', tempId: 't25' }
]

// ---------- 响应式状态 ----------
const direction = ref('ppm2mg')           // 'ppm2mg' | 'mg2ppm'
const rawInput = ref('')
const gasId = ref('formaldehyde')
const tempId = ref('t25')
const customM = ref('')
const history = ref([])
const seoContentVisible = ref(true)
const copyHint = ref('')

const currentGas = computed(() => GASES.find((g) => g.id === gasId.value) || GASES[0])
const tempOption = computed(() => TEMP_OPTIONS.find((t) => t.id === tempId.value) || TEMP_OPTIONS[0])
const molarMassInfo = computed(() => effectiveMolarMass(currentGas.value, customM.value))
const usingCustomM = computed(() => molarMassInfo.value.custom)

const result = computed(() => convert(rawInput.value, direction.value, molarMassInfo.value.m, tempOption.value.vm))
const inUnit = computed(() => (result.value ? result.value.inUnit : direction.value === 'ppm2mg' ? 'ppm' : 'mg/m³'))
const outUnit = computed(() => (result.value ? result.value.outUnit : direction.value === 'ppm2mg' ? 'mg/m³' : 'ppm'))
const inputLabelText = computed(() => (direction.value === 'ppm2mg' ? '待换算的 ppm 值' : '待换算的 mg/m³ 值'))
const resultText = computed(() => (result.value ? fmt(result.value.value) : '—'))
const ppmValue = computed(() => (result.value ? result.value.ppm : 0))
const mg3Value = computed(() => (result.value ? result.value.mg3 : 0))

const limitCardTitle = computed(() => {
  const l = currentGas.value.limit
  return l ? `${l.type} ${fmt(l.value)} mg/m³` : '表内无数值限'
})
const limitCardSource = computed(() => {
  const l = currentGas.value.limit
  return l ? `${l.source}；是否合规以现行标准文本为准` : `本工具未收录 ${currentGas.value.name} 的公开限值口径，判定返回「无参考线」`
})

const judgment = computed(() => {
  if (!result.value) return { state: 'none', ratio: null, hint: '输入数值后按当前气体限值线自动判定。' }
  const j = judgeVsLimit(result.value.mg3, currentGas.value.limit)
  const l = currentGas.value.limit
  const pct = j.ratio === null ? '' : `（为限值的 ${fmt(j.ratio * 100)}%）`
  const hint = {
    over: `换算出的 ${fmt(result.value.mg3)} mg/m³ 已超过 ${l.type} ${fmt(l.value)} mg/m³ 参考线${pct}。`,
    near: `换算出的 ${fmt(result.value.mg3)} mg/m³ 已达 ${l.type} ${fmt(l.value)} mg/m³ 参考线的 80% 以上${pct}，接近限值。`,
    ok: `换算出的 ${fmt(result.value.mg3)} mg/m³ 低于 ${l.type} ${fmt(l.value)} mg/m³ 参考线${pct}。判定仅为口径对照，合规性以实验室报告为准。`,
    none: `「${currentGas.value.name}」在本工具常量表中无数值限，返回「无参考线」；可对照 GBZ 2.1 现行文本自行取限值。`
  }
  return { state: j.state, ratio: j.ratio, hint: hint[j.state] }
})

const judgmentMeta = {
  over: { label: '超过参考线', class: 'bg-red-500/10 text-red-600 border-red-500/20' },
  near: { label: '接近限值', class: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  ok: { label: '低于参考线', class: 'bg-green-500/10 text-green-600 border-green-500/20' },
  none: { label: '无参考线', class: 'bg-muted text-muted-foreground border-border' }
}

// ---------- 交互方法 ----------
function snapshotEntry() {
  const r = convert(rawInput.value, direction.value, molarMassInfo.value.m, tempOption.value.vm)
  if (!r) return null
  return {
    gasName: currentGas.value.name + (usingCustomM.value ? '（自定义M）' : ''),
    inputRaw: trimNum(Number(String(rawInput.value).trim())),
    inUnit: r.inUnit,
    m: molarMassInfo.value.m,
    tempVm: tempOption.value.vm,
    ppm: r.ppm,
    mg3: r.mg3
  }
}

function recordCurrent() {
  const e = snapshotEntry()
  if (e) history.value = appendHistory(history.value, e)
  copyHint.value = ''
}

function setDirection(d) {
  if (direction.value === d) return
  direction.value = d
  recordCurrent()
}

function toggleDirection() {
  setDirection(direction.value === 'ppm2mg' ? 'mg2ppm' : 'ppm2mg')
}

function setTemp(id) {
  if (tempId.value === id) return
  tempId.value = id
  recordCurrent()
}

function applyPreset(p) {
  direction.value = p.direction
  rawInput.value = p.input
  gasId.value = p.gasId
  tempId.value = p.tempId
  customM.value = ''
  copyHint.value = ''
  const e = snapshotEntry()
  if (e) history.value = appendHistory(history.value, e)
}

function clearHistory() {
  history.value = []
}

function copyResult() {
  if (!result.value || !navigator.clipboard) return
  const text = `${trimNum(result.value.ppm)} ppm = ${fmt(result.value.mg3)} mg/m³（${currentGas.value.name}，M=${molarMassInfo.value.m}，${tempOption.value.label}）`
  navigator.clipboard.writeText(text).then(
    () => {
      copyHint.value = '已复制到剪贴板'
      setTimeout(() => { copyHint.value = '' }, 2000)
    },
    () => { copyHint.value = '复制失败，请手动选中文本' }
  )
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('gas-ppm-calculator')
})
</script>
