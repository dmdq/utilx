<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Disc class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">驻波比换算计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">SWR ↔ 反射系数 Γ ↔ 反射功率 % ↔ 失配损耗 dB 多向联动换算与判定</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线驻波比（SWR/VSWR）换算计算器：输入 SWR、反射系数 Γ、反射功率百分比或 Z/Z0（实数口径）任意一个，
        联动换算其余指标——Γ = (SWR−1)/(SWR+1)、反射功率 = Γ²×100%、失配损耗 = −10·log₁₀(1−Γ²)、
        线上电压峰/谷系数（1±Γ），并按 1.0~1.5 优秀 / 1.5~2 良好 / 2~3 警惕 / &gt;3 停发检查给出判定；
        附 SWR 1.1/1.5/2/3 典型值锚点表。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        计算口径：SWR ≥ 1；Γ = (SWR−1)/(SWR+1)；反射功率 % = Γ²×100；失配损耗 dB = −10·log₁₀(1−Γ²)。
        Z/Z0 换算仅适用<span class="text-foreground font-medium">实数阻抗（纯阻性）</span>：SWR = max(Z/Z0, Z0/Z)；
        复阻抗（含电抗分量）请用天线分析仪或矢量网络分析仪读取后再评估。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器列 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 三向联动换算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 多向联动换算
          </h2>

          <!-- 输入口径 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">以哪个量为输入</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                @click="mode = 'swr'"
                :class="mode === 'swr' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >SWR</button>
              <button
                @click="mode = 'gamma'"
                :class="mode === 'gamma' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >反射系数 Γ</button>
              <button
                @click="mode = 'power'"
                :class="mode === 'power' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >反射功率 %</button>
              <button
                @click="mode = 'z'"
                :class="mode === 'z' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >Z / Z0</button>
            </div>
          </div>

          <!-- 输入：SWR -->
          <div v-if="mode === 'swr'">
            <label for="swr-swr" class="block text-sm font-medium text-foreground mb-1.5">驻波比 SWR（≥ 1）</label>
            <input
              id="swr-swr"
              v-model.number="swrIn"
              type="number"
              min="1"
              step="0.1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 2"
            >
            <p class="text-xs text-muted-foreground mt-1">物理下限为 1.0（完全匹配）；仪表读数低于 1 视为测量误差</p>
          </div>

          <!-- 输入：Γ -->
          <div v-else-if="mode === 'gamma'">
            <label for="swr-gamma" class="block text-sm font-medium text-foreground mb-1.5">反射系数 Γ（0~1）</label>
            <input
              id="swr-gamma"
              v-model.number="gammaIn"
              type="number"
              min="0"
              max="0.999"
              step="0.01"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 0.3333"
            >
            <p class="text-xs text-muted-foreground mt-1">电压反射系数的模：0 = 全匹配，→1 = 全反射；Γ ≥ 1 物理上不成立</p>
          </div>

          <!-- 输入：反射功率 -->
          <div v-else-if="mode === 'power'">
            <label for="swr-power" class="block text-sm font-medium text-foreground mb-1.5">反射功率占比（0~100%）</label>
            <input
              id="swr-power"
              v-model.number="powerIn"
              type="number"
              min="0"
              max="99.9"
              step="0.1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 11.11"
            >
            <p class="text-xs text-muted-foreground mt-1">功率计/网络分析仪读出的反射功率占入射功率的百分比，Γ = √(P_ref/P_fwd)</p>
          </div>

          <!-- 输入：Z/Z0 -->
          <div v-else>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="swr-z" class="block text-sm font-medium text-foreground mb-1.5">负载阻抗 Z（Ω，实数）</label>
                <input
                  id="swr-z"
                  v-model.number="zIn"
                  type="number"
                  min="0.1"
                  step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 75"
                >
              </div>
              <div>
                <label for="swr-z0" class="block text-sm font-medium text-foreground mb-1.5">系统阻抗 Z0（Ω，实数）</label>
                <input
                  id="swr-z0"
                  v-model.number="z0In"
                  type="number"
                  min="0.1"
                  step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 50"
                >
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              仅适用实数（纯阻性）口径：SWR = 大者/小者。复阻抗 Z = R ± jX 请用天线分析仪/矢网测量；
              λ/4 单极子约 36Ω、偶极子约 73Ω，都是先有"谷点频率"再谈阻抗的例子（参见
              <NuxtLink to="/tools/antenna-length" class="text-primary hover:underline">天线长度计算</NuxtLink>）
            </p>
          </div>

          <!-- 换算结果 -->
          <div v-if="result" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <p class="text-xs text-muted-foreground mb-1">驻波比 SWR</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(result.swr, 4) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">反射系数 Γ</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(result.gamma, 4) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">反射功率</p>
                <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ fmt(result.reflPct, 2) }} <span class="text-sm">%</span></p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">失配损耗</p>
                <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ fmt(result.lossDb, 4) }} <span class="text-sm">dB</span></p>
              </div>
            </div>
            <div class="pt-3 border-t border-primary/20 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div class="text-center sm:text-left">
                <span class="text-muted-foreground">反射电压（相对入射）：</span>
                <span class="font-semibold text-foreground">{{ fmt(result.gamma * 100, 1) }}%</span>
              </div>
              <div class="text-center">
                <span class="text-muted-foreground">电压峰值系数：</span>
                <span class="font-semibold text-foreground">1+Γ = {{ fmt(result.vmax, 4) }} × 入射</span>
              </div>
              <div class="text-center sm:text-right">
                <span class="text-muted-foreground">电压谷值系数：</span>
                <span class="font-semibold text-foreground">1−Γ = {{ fmt(result.vmin, 4) }} × 入射</span>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              送到负载的有用功率占 {{ fmt((1 - result.gamma * result.gamma) * 100, 2) }}%（{{ fmt(result.lossDb, 4) }} dB 失配损耗）。
              线上电压在波峰处被抬到入射的 {{ fmt(result.vmax, 3) }} 倍、波谷处压到 {{ fmt(result.vmin, 3) }} 倍——
              SWR 越高，这个电压摆动越大，对功放输出级和天线开关的威胁也越大。
            </p>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">
                请检查输入范围：SWR ≥ 1；Γ 在 0~1 之间；反射功率 0~100%；Z、Z0 &gt; 0。
              </p>
            </div>
          </div>
        </div>

        <!-- 典型值锚点表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Table class="w-5 h-5 mr-2 text-primary" /> 典型值锚点表
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-muted-foreground">
                  <th class="text-left py-2 pr-3 font-medium">SWR</th>
                  <th class="text-right py-2 px-3 font-medium">Γ</th>
                  <th class="text-right py-2 px-3 font-medium">反射功率</th>
                  <th class="text-right py-2 px-3 font-medium">失配损耗</th>
                  <th class="text-right py-2 px-3 font-medium">电压峰系数 1+Γ</th>
                  <th class="text-center py-2 pr-1 font-medium">判定</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in anchorTable"
                  :key="row.swr"
                  class="border-t border-border/50"
                  :class="result && Math.abs(result.swr - row.swr) < 1e-9 ? 'bg-primary/10' : ''"
                >
                  <td class="py-2.5 pr-3 font-medium text-foreground">{{ row.swr }}</td>
                  <td class="py-2.5 px-3 text-right text-muted-foreground">{{ fmt(row.gamma, 4) }}</td>
                  <td class="py-2.5 px-3 text-right font-medium text-foreground">{{ fmt(row.reflPct, 2) }}%</td>
                  <td class="py-2.5 px-3 text-right font-medium text-foreground">{{ fmt(row.lossDb, 4) }} dB</td>
                  <td class="py-2.5 px-3 text-right text-muted-foreground">{{ fmt(row.vmax, 4) }}</td>
                  <td class="py-2.5 pr-1 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-medium" :class="judgePillCls(row.band.cls)">{{ row.band.label }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            记住这四行就能心算读数：SWR 1.1 几乎无损（反射 0.23%）；SWR 1.5 反射 4%、损耗约 0.18 dB——已经"够好"；
            SWR 2 反射 11.1%、损耗约 0.51 dB；SWR 3 反射 25%、损耗 1.25 dB，同时电压峰值系数 1.5，
            很多发射机的功放保护从这里开始降功率。表内数值由与上方计算器同一组函数生成。
          </p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 判定卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> 当前判定
          </h2>
          <div v-if="result" class="rounded-lg p-4 text-center" :class="judgeBgCls(judgeBand.cls)">
            <p class="text-3xl font-bold" :class="judgeTextCls(judgeBand.cls)">{{ judgeBand.label }}</p>
            <p class="text-xs mt-2 leading-relaxed" :class="judgeTextCls(judgeBand.cls)">{{ judgeBand.hint }}</p>
          </div>
          <p v-else class="text-xs text-muted-foreground">输入有效数值后显示判定。</p>
          <ul class="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">1.0~1.5 优秀：</span>反射功率 ≤4%，失配损耗 ≤0.18 dB，放手用。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">1.5~2 良好：</span>反射 ≤11.1%，损耗 ≤0.51 dB，常规应用无需焦虑。</span>
            </li>
            <li class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">2~3 警惕：</span>功放保护阈值区，多数发射机开始降功率、驻波告警；先查连接器与馈线。</span>
            </li>
            <li class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">&gt;3 停发检查：</span>反射 ≥25%、电压峰值系数 ≥1.5，继续发射可能损坏输出级——先停发排查开路/短路/接头进水。</span>
            </li>
          </ul>
        </div>

        <!-- 经验提示卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 实用提示
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">SWR 是"系统读数"：</span>它包含天线、馈线、巴伦与接头的总和；SWR 差不一定是天线剪错了，接头氧化、馈线进水同样拉高读数。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">低 ≠ 好：</span>SWR 1.0 只说明阻抗匹配，不代表天线效率高——加感短天线配上匹配网络也能 SWR 1.0，但大部分功率耗在线圈和电阻里。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">先长度后匹配：</span>先用
                <NuxtLink to="/tools/antenna-length" class="text-primary hover:underline">天线长度计算</NuxtLink>
                剪到谐振（SWR 谷点落在目标频率），再处理阻抗，顺序别反。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">功率台账：</span>把反射损耗换算成实际送达功率做链路预算，用
                <NuxtLink to="/tools/dbm-watts" class="text-primary hover:underline">dBm 瓦特换算</NuxtLink>
                直接对 dBm 口径。</span>
            </li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是驻波比</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          驻波比（SWR/VSWR）衡量发射馈线与天线之间的阻抗匹配程度：馈线上入射波与反射波叠加，
          形成电压波峰与波谷交替的"驻波"，SWR = 电压最大值 ÷ 电压最小值。完全匹配时没有反射、SWR = 1；
          失配越严重反射越强，波峰波谷差距越大，SWR 越高。它是一个"系统读数"——天线、馈线、巴伦、
          接头乃至馈线长度都包含在内，所以 SWR 差不一定是天线本身的问题。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">SWR 表怎么读</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          四个数字建立直觉：<span class="text-foreground font-medium">SWR 1.1</span> 反射功率只有 0.23%、
          失配损耗不到 0.01 dB，近乎完美；<span class="text-foreground font-medium">SWR 1.5</span> 反射 4%、
          损耗 0.18 dB，"良好"档的分界；<span class="text-foreground font-medium">SWR 2</span> 反射 11.1%、
          损耗 0.51 dB，对多数应用仍可接受，但已经是"良好"的边缘；
          <span class="text-foreground font-medium">SWR 3</span> 反射 25%、损耗 1.25 dB、电压峰值系数 1.5，
          功放保护普遍从这里触发。注意 SWR 的刻度是非线性的：从 1.5 涨到 2 损耗只多 0.33 dB，
          从 2 涨到 3 却多 0.74 dB——越高越"贵"。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么功放怕高 SWR：反射电压，不只是功率损耗</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          很多人以为高 SWR 只是"功率被反射浪费了"，真正的威胁是<span class="text-foreground font-medium">电压</span>：
          反射波与入射波同相位叠加处，线上电压被抬到入射的 (1+Γ) 倍。SWR 3 时峰值电压是匹配态的 1.5 倍，
          SWR 5 时接近 1.67 倍、SWR →∞ 时可达 2 倍——输出晶体管、天线开关二极管、收发切换电路的耐压就是按匹配态设计的，
          高电压节点可能击穿输出级或烧掉切换二极管。同时反射波回到功放输出端表现为"不想要的负载"，
          输出管的工作点被拉偏，电流波形畸变、发热加剧；现代电台的应对是检测反射、自动降功率甚至切断输出
          ——这就是"2~3 警惕（保护阈值区）、&gt;3 停发检查"的由来。反射功率并没有消失，
          它在馈线里来回跑，一部分耗在馈线损耗上，一部分回到功放端制造上述麻烦。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">匹配与效率的区别</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          匹配解决的是"<span class="text-foreground font-medium">功率能不能送过去</span>"：SWR 2 意味着 11% 的功率被反射、
          0.51 dB 失配损耗——听起来不多；效率解决的是"<span class="text-foreground font-medium">送过去的功率有多少真的辐射出去</span>"：
          一根 1 米长的加感短天线在 27MHz 即使被匹配网络调到 SWR 1.0，线圈与损耗电阻可能吃掉大半功率，
          辐射效率远低于全尺寸天线。反过来，SWR 1.8 的全尺寸偶极子可能比 SWR 1.0 的小环天线辐射得远好。
          所以调台的完整顺序是：<NuxtLink to="/tools/antenna-length" class="text-primary hover:underline">先把天线修到谐振、结构尽量全尺寸</NuxtLink>，
          再做匹配；不要只盯着 SWR 逼近 1。发射功率与损耗的量化换算见
          <NuxtLink to="/tools/dbm-watts" class="text-primary hover:underline">dBm 瓦特换算</NuxtLink>。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">SWR 2 损失多少功率，值得折腾吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              失配损耗 0.51 dB，反射功率 11.1%，送达负载 88.9%——比 SWR 1.0 只少半挡。
              对接收、短距离通信完全可以接受；但发射场景还要看功放保护阈值与电压峰值（1+Γ = 1.5 倍），
              以及 SWR 随频率漂移的带宽问题。如果 SWR 2 是天线剪短了导致的，修长度就能改善，值得折腾；
              如果是结构阻抗本来就偏（如 73Ω 偶极子），做匹配网络即可。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">反射的功率去哪了？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              它不会"消失"在负载上：反射波沿馈线往回走，一部分被馈线损耗耗成热，剩余的到达发射机输出端。
              功放面对失配负载输出能力下降、发热增加；部分能量在入射/反射往返中被馈线反复衰减。
              系统里没有单独一个"反射功率堆"，这正是为什么长馈线 + 高 SWR 的组合损耗特别大（失配损耗还要叠加馈线衰减）。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么天线分析仪测的是复阻抗而 SWR 表只给 SWR？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              SWR 只反映反射的"大小"，丢失了相位信息；天线分析仪给出 Z = R + jX 复阻抗，
              能告诉你失配是电阻偏了（改阻抗）还是电抗没谐振（改长度）——这正是"先长度后匹配"的判断依据。
              本工具的 Z/Z0 口径仅适用实数阻抗；拿到分析仪的 R、X 后，请以矢网/分析仪自带的 SWR 或 Γ 读数为准。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">SWR 读数 1.0 一定好吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不一定。SWR 1.0 只代表阻抗匹配，不代表辐射效率高：假负载也是 SWR 1.0；
              加感短线配好匹配网络同样能读 1.0，但效率可能只有百分之几十。
              另外 SWR 表在强电台谐波、共模电流下会给出假读数。把 SWR 当"匹配体检项"，
              而不是"天线好坏的唯一标准"。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'swr-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Disc, Calculator, Table, Gauge, Info, CheckCircle, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// Γ = (SWR−1)/(SWR+1)，要求 SWR ≥ 1
function gammaFromSwr(swr) {
  if (!Number.isFinite(swr) || swr < 1) return null
  return (swr - 1) / (swr + 1)
}

// SWR = (1+Γ)/(1−Γ)，要求 0 ≤ Γ < 1
function swrFromGamma(gamma) {
  if (!Number.isFinite(gamma) || gamma < 0 || gamma >= 1) return null
  return (1 + gamma) / (1 - gamma)
}

// 由反射功率占比（0~100）反求 SWR：Γ = √(P_ref/P_fwd)
function swrFromReflPct(pct) {
  if (!Number.isFinite(pct) || pct < 0 || pct >= 100) return null
  return swrFromGamma(Math.sqrt(pct / 100))
}

// 实数阻抗口径：SWR = max(Z/Z0, Z0/Z)，Z、Z0 > 0（复阻抗需天线分析仪）
function swrFromRealZ(z, z0) {
  if (!Number.isFinite(z) || !Number.isFinite(z0) || !(z > 0) || !(z0 > 0)) return null
  return z >= z0 ? z / z0 : z0 / z
}

// 反射功率占比：Γ² × 100
function reflPowerPct(gamma) {
  if (!Number.isFinite(gamma)) return null
  return gamma * gamma * 100
}

// 失配损耗：−10·log₁₀(1−Γ²)（dB）；Γ = 0 时为 0
function mismatchLossDb(gamma) {
  if (!Number.isFinite(gamma)) return null
  if (gamma < 0 || gamma >= 1) return null
  if (gamma === 0) return 0
  return -10 * Math.log10(1 - gamma * gamma)
}

// 驻波电压峰/谷系数（相对入射电压）：峰值 1+Γ、谷值 1−Γ、反射电压系数 Γ
function voltageFactors(gamma) {
  if (!Number.isFinite(gamma) || gamma < 0 || gamma >= 1) return null
  return { vmax: 1 + gamma, vmin: 1 - gamma, refl: gamma }
}

// 判定：1.0~1.5 优秀 / 1.5~2 良好 / 2~3 警惕（功放保护阈值区）/ >3 停发检查
function swrJudge(swr) {
  if (!Number.isFinite(swr) || swr < 1) return null
  if (swr <= 1.5) return 'excellent'
  if (swr <= 2) return 'good'
  if (swr <= 3) return 'caution'
  return 'danger'
}
// ==== PURE-FNS-END ====

// SEO
useSeoMeta({
  title: '驻波比换算计算器 - SWR、反射系数与失配损耗换算',
  description: '在线驻波比换算计算器：SWR、反射系数 Γ、反射功率百分比与失配损耗 dB 多向联动换算，支持 Z/Z0 实数口径，1.0~1.5 优秀 / 1.5~2 良好 / 2~3 警惕 / >3 停发判定，典型值锚点表，纯本地计算。',
  keywords: '驻波比计算, swr 换算, 反射系数, 失配损耗, 反射功率, vswr, 天线匹配, swr calculator',
  author: '有条工具',
  ogTitle: '驻波比换算计算器 - SWR、反射系数与失配损耗换算 | 有条工具',
  ogDescription: 'SWR ↔ Γ ↔ 反射功率 ↔ 失配损耗多向联动换算与红黄绿判定。',
  ogUrl: 'https://www.util.cn/tools/swr-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '驻波比换算计算器',
  twitterDescription: 'SWR、反射系数、反射功率与失配损耗多向换算。'
})

// JSON-LD 结构化数据（SoftwareApplication + FAQPage + BreadcrumbList）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '驻波比换算计算器',
          url: 'https://www.util.cn/tools/swr-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'SWR ↔ Γ ↔ 反射功率 % ↔ 失配损耗 dB 多向联动',
            'Z/Z0 实数阻抗口径求 SWR',
            '驻波电压峰/谷系数（1±Γ）与反射电压系数',
            '1.0~1.5 优秀 / 1.5~2 良好 / 2~3 警惕 / >3 停发判定',
            'SWR 1.1/1.5/2/3 典型值锚点表',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '驻波比换算计算器', item: 'https://www.util.cn/tools/swr-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'SWR 2 损失多少功率？',
              acceptedAnswer: { '@type': 'Answer', text: '反射功率 11.1%，失配损耗 0.51 dB，送达负载 88.9%；同时电压峰值系数 1.5，发射场景还要考虑功放保护与带宽。' }
            },
            {
              '@type': 'Question',
              name: '为什么功放怕高 SWR？',
              acceptedAnswer: { '@type': 'Answer', text: '反射波与入射波叠加把线上电压抬到入射的 (1+Γ) 倍，高电压节点可能击穿输出级与天线开关；反射波回到功放端造成失配负载、发热与降功率保护，不只是"功率损耗"。' }
            },
            {
              '@type': 'Question',
              name: '匹配与效率有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '匹配解决功率能否送过去（失配损耗），效率决定送过去的功率有多少真正辐射；加感短天线可以 SWR 1.0 但效率很低，调台的完整顺序是先修长度谐振、再做匹配。' }
            },
            {
              '@type': 'Question',
              name: 'Z/Z0 求 SWR 什么时候适用？',
              acceptedAnswer: { '@type': 'Answer', text: '仅适用实数（纯阻性）阻抗：SWR = 大者/小者，如 75Ω/50Ω = 1.5；复阻抗 Z = R±jX 需用天线分析仪或矢量网络分析仪测量。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'swr-calculator'
const SETTINGS_KEY = 'swr-calculator-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 常量 ----------
const ANCHOR_SWRS = [1.1, 1.5, 2, 3]
const BANDS = {
  excellent: { label: '优秀', cls: 'green', hint: '反射功率 ≤4%、失配损耗 ≤0.18 dB，可直接使用。' },
  good: { label: '良好', cls: 'green', hint: '反射 ≤11.1%、损耗 ≤0.51 dB，常规应用无需焦虑。' },
  caution: { label: '警惕', cls: 'amber', hint: '功放保护阈值区：多数发射机开始降功率、驻波告警，先查连接器与馈线。' },
  danger: { label: '停发检查', cls: 'red', hint: '反射 ≥25%、电压峰值系数 ≥1.5，继续发射可能损坏输出级，先排查开路/短路/接头进水。' }
}

// ---------- 状态 ----------
const mode = ref('swr')            // 'swr' | 'gamma' | 'power' | 'z'
const swrIn = ref(2)
const gammaIn = ref(0.3333)
const powerIn = ref(11.11)
const zIn = ref(75)
const z0In = ref(50)
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化 ----------
const fmt = (v, d = 2) => (Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—')
const judgeTextCls = (cls) => cls === 'green'
  ? 'text-green-600 dark:text-green-400'
  : cls === 'amber'
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400'
const judgePillCls = (cls) => cls === 'green'
  ? 'bg-green-500/15 text-green-600 dark:text-green-400'
  : cls === 'amber'
    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
    : 'bg-red-500/15 text-red-600 dark:text-red-400'
const judgeBgCls = (cls) => cls === 'green'
  ? 'bg-green-500/10 border border-green-500/20'
  : cls === 'amber'
    ? 'bg-amber-500/10 border border-amber-500/20'
    : 'bg-red-500/10 border border-red-500/20'

// ---------- 主计算：多向联动 ----------
const result = computed(() => {
  // 按当前输入口径先归一到 SWR，再统一换算 Γ 及其余指标
  let swr = null
  if (mode.value === 'swr') {
    if (!Number.isFinite(swrIn.value) || swrIn.value < 1) return null
    swr = swrIn.value
  } else if (mode.value === 'gamma') {
    swr = swrFromGamma(gammaIn.value)
  } else if (mode.value === 'power') {
    swr = swrFromReflPct(powerIn.value)
  } else {
    swr = swrFromRealZ(zIn.value, z0In.value)
  }
  if (swr === null) return null

  const gamma = gammaFromSwr(swr)
  const vf = voltageFactors(gamma)
  const pct = reflPowerPct(gamma)
  const loss = mismatchLossDb(gamma)
  if (gamma === null || !vf || pct === null || loss === null) return null
  const bandKey = swrJudge(swr)
  return {
    swr,
    gamma,
    reflPct: pct,
    lossDb: loss,
    vmax: vf.vmax,
    vmin: vf.vmin,
    band: BANDS[bandKey] || BANDS.good
  }
})

// 当前判定（侧栏卡）
const judgeBand = computed(() => (result.value ? result.value.band : null))

// ---------- 典型值锚点表 ----------
const anchorTable = ANCHOR_SWRS.map(s => {
  const g = gammaFromSwr(s)
  const vf = voltageFactors(g)
  return {
    swr: s,
    gamma: g,
    reflPct: reflPowerPct(g),
    lossDb: mismatchLossDb(g),
    vmax: vf.vmax,
    band: BANDS[swrJudge(s)]
  }
})

// ---------- 设置持久化（localStorage，键前缀用工具 id） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (['swr', 'gamma', 'power', 'z'].includes(s.mode)) mode.value = s.mode
    if (Number.isFinite(s.swrIn) && s.swrIn >= 1) swrIn.value = s.swrIn
    if (Number.isFinite(s.gammaIn) && s.gammaIn >= 0 && s.gammaIn < 1) gammaIn.value = s.gammaIn
    if (Number.isFinite(s.powerIn) && s.powerIn >= 0 && s.powerIn < 100) powerIn.value = s.powerIn
    if (Number.isFinite(s.zIn) && s.zIn > 0) zIn.value = s.zIn
    if (Number.isFinite(s.z0In) && s.z0In > 0) z0In.value = s.z0In
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([mode, swrIn, gammaIn, powerIn, zIn, z0In], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      mode: mode.value,
      swrIn: swrIn.value,
      gammaIn: gammaIn.value,
      powerIn: powerIn.value,
      zIn: zIn.value,
      z0In: z0In.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
