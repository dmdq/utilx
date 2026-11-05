<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Fan class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电机电容选型器</h1>
          <p class="text-sm text-muted-foreground mt-1">单相电机启动/运转电容容量计算，公式轨 + 无铭牌经验轨双口径，标准容值吸附与耐压建议</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线单相电机电容计算器：已知电流或功率任选其一，按公式轨 C_run = 1950×I/(U×cosφ)、C_start = 3500×I/(U×cosφ)
        计算运转与启动电容（双值电容方案），同时给出无铭牌时的经验轨「每 100W 取 4~6µF」区间与中值；
        计算值自动吸附到 CBB60 常见标称档位并显示偏差百分比，附耐压建议、维修更换提示与 PSC/双值电容接线示意图。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        公式轨系数 1950 / 3500 为国内维修资料常用的工程近似口径（50Hz、µF），不同手册存在 ±5% 左右的变体；
        经验轨适用于完全无铭牌无参数的场景。两轨结果都请对照电机铭牌与原厂电容标称值核对后再动手更换。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 输入与双轨计算
        </h2>

        <!-- 已知量二选一 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">已知量（二选一）</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="mode = 'current'"
              :class="mode === 'current' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >已知电流 I（实测/铭牌）</button>
            <button
              @click="mode = 'power'"
              :class="mode === 'power' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >已知功率 P（铭牌/估计）</button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label for="mcs-u" class="block text-sm font-medium text-foreground mb-1.5">电压 U（V）</label>
            <input
              id="mcs-u"
              v-model.number="voltage"
              type="number"
              min="1"
              step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 220"
            >
          </div>
          <div v-if="mode === 'current'">
            <label for="mcs-i" class="block text-sm font-medium text-foreground mb-1.5">电流 I（A）</label>
            <input
              id="mcs-i"
              v-model.number="currentA"
              type="number"
              min="0.01"
              step="0.1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 1.5"
            >
            <p class="text-xs text-muted-foreground mt-1">钳形表实测或铭牌额定电流</p>
          </div>
          <div v-if="mode === 'power'">
            <label for="mcs-p" class="block text-sm font-medium text-foreground mb-1.5">功率 P（W）</label>
            <input
              id="mcs-p"
              v-model.number="powerW"
              type="number"
              min="1"
              step="10"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 750"
            >
            <p class="text-xs text-muted-foreground mt-1">铭牌额定功率，空压机/风机按轴功率估</p>
          </div>
          <div>
            <label for="mcs-cos" class="block text-sm font-medium text-foreground mb-1.5">功率因数 cosφ</label>
            <input
              id="mcs-cos"
              v-model.number="cosPhi"
              type="number"
              min="0.1"
              max="1"
              step="0.05"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="默认 0.8"
            >
            <p class="text-xs text-muted-foreground mt-1">单相电机常见 0.75~0.85，未知取 0.8</p>
          </div>
        </div>

        <!-- 折算电流提示 -->
        <div v-if="inputsValid" class="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border font-mono">
          <template v-if="mode === 'power'">
            I = P/(U×cosφ) = {{ fmt(powerW, 0) }} / ({{ fmt(voltage, 0) }} × {{ fmt(cosPhi, 2) }}) = {{ fmt(effectiveI, 2) }} A
          </template>
          <template v-else>
            经验轨折算功率 P ≈ U×I×cosφ = {{ fmt(voltage, 0) }} × {{ fmt(currentA, 2) }} × {{ fmt(cosPhi, 2) }} ≈ {{ fmt(effectiveP, 0) }} W
          </template>
        </div>

        <!-- 双轨并列结果 -->
        <div v-if="inputsValid" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- 公式轨 -->
          <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
            <p class="text-sm font-medium text-foreground mb-3">公式轨（1950 / 3500 系数）</p>
            <div class="mb-3">
              <p class="text-xs text-muted-foreground mb-0.5">运转电容 C_run</p>
              <p class="text-2xl font-bold text-primary">{{ fmt(cRun, 2) }} <span class="text-sm">µF</span></p>
              <p class="text-xs text-muted-foreground mt-1">
                最近档：<span class="font-semibold text-foreground">{{ runNearest ? fmt(runNearest.step, 1) + ' µF' : '—' }}</span>
                <span v-if="runNearest" :class="devCls(runNearest.devPct)">（{{ devText(runNearest.devPct) }}）</span>
              </p>
            </div>
            <div class="pt-3 border-t border-primary/20">
              <p class="text-xs text-muted-foreground mb-0.5">启动电容 C_start（双值电容方案用）</p>
              <p class="text-2xl font-bold text-foreground">{{ fmt(cStart, 2) }} <span class="text-sm">µF</span></p>
              <p class="text-xs text-muted-foreground mt-1">
                最近档：<span class="font-semibold text-foreground">{{ startNearest ? fmt(startNearest.step, 1) + ' µF' : '—' }}</span>
                <span v-if="startNearest" :class="devCls(startNearest.devPct)">（{{ devText(startNearest.devPct) }}）</span>
              </p>
            </div>
            <p class="text-[11px] leading-relaxed text-muted-foreground mt-3">
              C_run = 1950×I/(U×cosφ)，C_start = 3500×I/(U×cosφ)；1950/3500 为常用工程近似系数，启动电容仅在双值电容（CSCR）方案中需要。
            </p>
          </div>

          <!-- 经验轨 -->
          <div class="p-4 rounded-lg border border-border bg-muted/50">
            <p class="text-sm font-medium text-foreground mb-3">经验轨（无铭牌估算）</p>
            <p class="text-xs text-muted-foreground mb-1">按折算功率 {{ fmt(effectiveP, 0) }} W · 每 100W 取 4~6µF</p>
            <p class="text-2xl font-bold text-foreground">{{ fmt(empRange.low, 1) }} <span class="text-sm">~</span> {{ fmt(empRange.high, 1) }} <span class="text-sm">µF</span></p>
            <p class="text-xs text-muted-foreground mt-1">
              中值 <span class="font-semibold text-foreground">{{ fmt(empRange.mid, 1) }} µF</span>
              <template v-if="midNearest">（最近档 {{ fmt(midNearest.step, 1) }} µF，{{ devText(midNearest.devPct) }}）</template>
            </p>
            <p class="text-xs text-muted-foreground mt-3">
              区间两端就近取档：{{ fmt(lowNearest.step, 1) }} ~ {{ fmt(highNearest.step, 1) }} µF 均为常见实物档位，
              可在此区间现场试选（风扇/水泵类负载一般取中值附近）。
            </p>
          </div>
        </div>

        <!-- 参数无效提示 -->
        <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-foreground">暂无法计算</p>
            <p class="text-xs text-muted-foreground mt-1">请检查参数：电压 &gt; 0，电流 / 功率 &gt; 0，cosφ 在 0.1~1 之间。</p>
          </div>
        </div>

        <!-- 偏差提示 -->
        <p v-if="inputsValid" class="text-xs leading-relaxed text-muted-foreground">
          容值吸附说明：电容实物只有标称档位，选最近档即可；偏差在 ±10% 内一般可接受。若相邻两档都接近，
          运转电容宁小勿大——容量偏大会使副绕组电流增大、电容与绕组发热。
        </p>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 耐压建议 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Zap class="w-5 h-5 mr-2 text-primary" /> 耐压建议
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border">
            <p class="text-xs text-muted-foreground">按 ≥1.5~2.2×U 取耐压</p>
            <p class="text-lg font-bold text-foreground mt-1">
              {{ voltageValid ? '≥ ' + Math.ceil(voltage * 1.5) + '~' + Math.ceil(voltage * 2.2) + ' V' : '—' }}
            </p>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            <span class="text-foreground font-medium">220V 场景：</span>常选 <span class="text-foreground font-medium">450V AC</span> 的
            CBB60（圆柱形）或 CBB61（方形）自愈式电容，耐压余量充足、寿命长。
          </p>
          <p class="text-xs leading-relaxed text-muted-foreground">
            <span class="text-foreground font-medium">380V 场景：</span>（如三相电机改单相运行串电容）请选
            <span class="text-foreground font-medium">630V DC</span> 标称或交流等级更高的电容规格，并核对允许的交流电流与持续工作方式。
          </p>
        </div>

        <!-- 维修提示卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Wrench class="w-5 h-5 mr-2 text-primary" /> 维修更换提示
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>容量偏差 <span class="text-foreground font-medium">&gt; ±10%</span>：用万用表电容档实测确认，建议更换同标称值电容。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">鼓包 / 漏液</span>：电容已失效，立即更换，不要等待实测。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">运转电容持续发热偏大</span>：说明容量选大了，副绕组电流偏高，按计算值换小一档。</span>
            </li>
          </ul>
          <p class="text-[11px] text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border">
            拆旧电容前先放电（电阻短接数秒），并记下原电容标称容量与耐压——原厂标称值优先级高于任何经验公式。
          </p>
        </div>
      </div>
    </div>

    <!-- 接线示意 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- PSC 单电容 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center mb-4">
          <Zap class="w-5 h-5 mr-2 text-primary" /> 单电容 PSC 接线（永久分相电容）
        </h2>
        <div class="text-foreground">
          <svg viewBox="0 0 340 180" class="w-full max-w-sm mx-auto" role="img" aria-label="单相电机 PSC 接线示意图">
            <g stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round">
              <!-- 电源引线 -->
              <line x1="30" y1="30" x2="30" y2="150" />
              <!-- 上母线 / 下母线 -->
              <line x1="30" y1="30" x2="250" y2="30" />
              <line x1="30" y1="150" x2="250" y2="150" />
              <!-- 主绕组支路 -->
              <line x1="120" y1="30" x2="120" y2="52" />
              <path d="M120 52 a9 9 0 1 1 0 18 a9 9 0 1 1 0 18 a9 9 0 1 1 0 18 a9 9 0 1 1 0 18" />
              <line x1="120" y1="124" x2="120" y2="150" />
              <!-- 副绕组 + 运转电容支路 -->
              <line x1="230" y1="30" x2="230" y2="52" />
              <path d="M230 52 a9 9 0 1 1 0 18 a9 9 0 1 1 0 18 a9 9 0 1 1 0 18 a9 9 0 1 1 0 18" />
              <line x1="230" y1="124" x2="230" y2="136" />
              <line x1="216" y1="136" x2="244" y2="136" />
              <line x1="216" y1="144" x2="244" y2="144" />
              <line x1="230" y1="144" x2="230" y2="150" />
            </g>
            <g fill="currentColor" stroke="none">
              <circle cx="120" cy="30" r="2.5" />
              <circle cx="120" cy="150" r="2.5" />
              <circle cx="230" cy="30" r="2.5" />
              <circle cx="230" cy="150" r="2.5" />
            </g>
            <g fill="currentColor" font-size="11">
              <text x="22" y="20" class="text-muted-foreground">~220V</text>
              <text x="134" y="92">主绕组</text>
              <text x="244" y="92">副绕组</text>
              <text x="248" y="144">运转电容</text>
            </g>
          </svg>
        </div>
        <p class="text-xs leading-relaxed text-muted-foreground mt-3">
          运转绕组直接接电源；副绕组与运转电容串联后并联接入，电容移相约 90° 产生旋转磁场。结构简单、长期运行，风扇、水泵常用。
        </p>
      </div>

      <!-- 双值电容 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center mb-4">
          <Zap class="w-5 h-5 mr-2 text-primary" /> 双值电容接线（启动电容 + 离心开关）
        </h2>
        <div class="text-foreground">
          <svg viewBox="0 0 360 210" class="w-full max-w-sm mx-auto" role="img" aria-label="双值电容电机接线示意图">
            <g stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round">
              <!-- 电源引线与母线 -->
              <line x1="30" y1="30" x2="30" y2="180" />
              <line x1="30" y1="30" x2="300" y2="30" />
              <line x1="30" y1="180" x2="300" y2="180" />
              <!-- 主绕组支路 -->
              <line x1="105" y1="30" x2="105" y2="52" />
              <path d="M105 52 a9 9 0 1 1 0 18 a9 9 0 1 1 0 18 a9 9 0 1 1 0 18 a9 9 0 1 1 0 18" />
              <line x1="105" y1="124" x2="105" y2="180" />
              <!-- 副绕组支路 -->
              <line x1="300" y1="30" x2="300" y2="50" />
              <path d="M300 50 a8 8 0 1 1 0 16 a8 8 0 1 1 0 16 a8 8 0 1 1 0 16 a8 8 0 1 1 0 16" />
              <line x1="300" y1="114" x2="300" y2="124" />
              <!-- 运转电容支路（右侧直通） -->
              <line x1="300" y1="124" x2="300" y2="132" />
              <line x1="286" y1="132" x2="314" y2="132" />
              <line x1="286" y1="140" x2="314" y2="140" />
              <line x1="300" y1="140" x2="300" y2="168" />
              <!-- 启动电容 + 离心开关支路（左侧并联） -->
              <line x1="300" y1="124" x2="210" y2="124" />
              <line x1="210" y1="124" x2="210" y2="130" />
              <line x1="210" y1="132" x2="200" y2="146" />
              <line x1="210" y1="148" x2="210" y2="152" />
              <line x1="196" y1="152" x2="224" y2="152" />
              <line x1="196" y1="160" x2="224" y2="160" />
              <line x1="210" y1="160" x2="210" y2="168" />
              <line x1="210" y1="168" x2="300" y2="168" />
              <line x1="300" y1="168" x2="300" y2="180" />
            </g>
            <g fill="currentColor" stroke="none">
              <circle cx="105" cy="30" r="2.5" />
              <circle cx="105" cy="180" r="2.5" />
              <circle cx="300" cy="30" r="2.5" />
              <circle cx="300" cy="124" r="2.5" />
              <circle cx="210" cy="132" r="2" />
              <circle cx="210" cy="148" r="2" />
              <circle cx="300" cy="168" r="2.5" />
              <circle cx="300" cy="180" r="2.5" />
            </g>
            <g fill="currentColor" font-size="11">
              <text x="22" y="20" class="text-muted-foreground">~220V</text>
              <text x="119" y="92">主绕组</text>
              <text x="314" y="86">副绕组</text>
              <text x="306" y="157">运转电容</text>
              <text x="192" y="142" text-anchor="end">离心开关</text>
              <text x="192" y="159" text-anchor="end">启动电容</text>
            </g>
          </svg>
        </div>
        <p class="text-xs leading-relaxed text-muted-foreground mt-3">
          启动电容经离心开关与运转电容并联，启动时两电容同时参与、启动转矩大；转速达约 75% 后离心开关断开启动支路，
          只留运转电容工作。空压机、冰箱压缩机等重载启动设备常用。
        </p>
      </div>
    </div>

    <!-- 显著免责条 -->
    <div class="flex items-start gap-2 p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
        免责声明：本页 1950 / 3500 系数与「每 100W 取 4~6µF」均为经验公式，仅供维修选型参考；最终以电机铭牌与原厂电容标称值为准，更换后请试测电流与温升确认。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>启动电容与运转电容的区别</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          启动电容（C_start）只在电机启动瞬间参与工作：容量大（通常是运转电容的 1.5~2.5 倍以上）、短时工作，
          转速上来后被离心开关或启动继电器切除，多用电解启动电容（CD60）或大容量 CBB；
          运转电容（C_run）长期并联在副绕组回路里持续工作，容量较小、要求耐久，常用油浸或干式 CBB60 / CBB61。
          两者的失效率标准、耐压裕量与散热要求因此完全不同，不能用启动电容长期顶替运转电容。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么单相电机需要电容？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          单相电源本身只产生脉振磁场，不产生旋转磁场，电机启动无力。副绕组串联电容后，电流相位相对主绕组前移接近 90°，
          两个绕组在时间上错开、空间上正交，合成旋转磁场（裂相/移相启动），转子才能获得启动转矩。
          电容容量决定移相角度与副绕组电流：容量过小启动无力，过大则副绕组发热、甚至绕组烧毁。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">电容坏了电机会有什么症状？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          典型症状有三类：<span class="text-foreground font-medium">嗡嗡响但不转</span>——启动电容失效或开路，电机只有脉振磁场、
          卡在任意位置抖动；<span class="text-foreground font-medium">转速偏慢、出力下降</span>——运转电容容量衰减，移相不足；
          <span class="text-foreground font-medium">反转启动无力或转向不定</span>——启动转矩不足，转子随机方向启动。
          外观上鼓包、漏液、引线腐蚀几乎可以直接判死刑。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">双值电容电机（CSCR）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          双值电容电机在副绕组回路里同时挂两路电容：启动电容串离心开关负责启动段，运转电容负责运行段，
          兼顾大启动转矩与高运行效率，常见于水泵、空压机、冰箱压缩机等重载启动设备。
          接线时两个电容的位置不能装反，离心开关失灵（不断开）会让启动电容长期通电而爆裂。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">启动电容和运转电容能互换吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不能长期互换。启动电容按短时工作制设计，长期通电会过热爆裂；运转电容容量小、拿去当启动电容会启动无力。
              应急时可用同耐压、容量接近的运转电容临时替代启动电容，但修复后应按标称值恢复。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">没有铭牌怎么估电容大小？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              用本工具经验轨：按电机功率每 100W 取 4~6µF。例如 750W 潜水泵约 30~45µF（中值 37.5µF，实物常取 35 或 40µF）。
              风扇类轻载取小值，空压机类重载取大值；装上后测运行电流不超过铭牌/绕组额定即可。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">电容容量选大一点行不行？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              偏差 ±10% 以内一般可以；再大就不建议。运转电容偏大时副绕组电流增大、电容与绕组持续发热，轻则缩短电容寿命，
              重则烧副绕组；启动电容过大则启动电流冲击大、齿轮类负载还可能受机械冲击。运转电容宁小勿大。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">万用表怎么判断电容好坏？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              断电并放电后，用万用表电容档实测：读数与标称值偏差超过 ±10%、显示 OL（开路）或明显偏低都建议更换；
              同时检查外观是否鼓包漏液。注意电解启动电容容量衰减快，风扇/水泵的运转电容多为受潮漏电失效。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'motor-capacitor-sizer'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Fan, Calculator, Zap, Wrench, Info, CheckCircle, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// CBB60/61 常见标称容值档位（µF）
const CBB_STEPS = [1, 1.2, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 75, 100, 120, 150, 200, 250, 300, 350, 400, 450]

// 功率模式折算电流：I = P/(U×cosφ)
function currentFromPower(p, u, cosPhi) {
  if (!Number.isFinite(p) || !Number.isFinite(u) || !Number.isFinite(cosPhi)) return null
  if (!(p > 0) || !(u > 0) || !(cosPhi > 0) || cosPhi > 1) return null
  return p / (u * cosPhi)
}

// 公式轨：C_run = 1950×I/(U×cosφ)，C_start = 3500×I/(U×cosφ)（µF，工程近似系数）
function runCapUf(i, u, cosPhi) {
  if (!Number.isFinite(i) || !Number.isFinite(u) || !Number.isFinite(cosPhi)) return null
  if (!(i > 0) || !(u > 0) || !(cosPhi > 0) || cosPhi > 1) return null
  return (1950 * i) / (u * cosPhi)
}

function startCapUf(i, u, cosPhi) {
  if (!Number.isFinite(i) || !Number.isFinite(u) || !Number.isFinite(cosPhi)) return null
  if (!(i > 0) || !(u > 0) || !(cosPhi > 0) || cosPhi > 1) return null
  return (3500 * i) / (u * cosPhi)
}

// 经验轨：每 100W 取 4~6µF，中值 5µF
function empiricalRange(p) {
  if (!Number.isFinite(p) || !(p > 0)) return null
  return { low: (p / 100) * 4, high: (p / 100) * 6, mid: (p / 100) * 5 }
}

// 标准容值吸附：最近档 + 偏差百分比
function nearestStep(c) {
  if (!Number.isFinite(c) || !(c > 0)) return null
  let best = CBB_STEPS[0]
  for (const s of CBB_STEPS) {
    if (Math.abs(s - c) < Math.abs(best - c)) best = s
  }
  return { step: best, devPct: ((best - c) / c) * 100 }
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '电机电容选型器 - 单相电机启动/运转电容在线计算',
  description: '在线单相电机电容选型计算器：已知电流或功率，按 1950/3500 工程系数计算运转电容与启动电容，附无铭牌经验法（每100W 4~6µF）区间中值、CBB60 标准容值吸附与偏差百分比、450V AC 耐压建议、维修更换提示与 PSC/双值电容接线图，纯本地计算。',
  keywords: '电机电容选型,启动电容计算,运转电容计算,单相电机电容,风扇电容配多大,水泵电容,CBB60,1950系数,电机电容计算器',
  author: '有条工具',
  ogTitle: '电机电容选型器 - 单相电机启动/运转电容在线计算 | 有条工具',
  ogDescription: '公式轨 + 经验轨双口径计算启动/运转电容，标准容值吸附、耐压建议与接线示意图。',
  ogUrl: 'https://www.util.cn/tools/motor-capacitor-sizer',
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
          name: '电机电容选型器',
          url: 'https://www.util.cn/tools/motor-capacitor-sizer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '电流/功率双模式输入',
            '运转电容 C_run=1950×I/(U×cosφ) 计算',
            '启动电容 C_start=3500×I/(U×cosφ) 计算',
            '无铭牌经验法每100W 4~6µF 区间与中值',
            'CBB60 标准容值吸附与偏差百分比',
            '耐压 1.5~2.2×U 建议与维修提示',
            'PSC/双值电容接线示意图',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '电机电容选型器', item: 'https://www.util.cn/tools/motor-capacitor-sizer' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '启动电容和运转电容能互换吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能长期互换。启动电容按短时工作制设计，长期通电会过热爆裂；运转电容容量小，拿去启动会启动无力。' }
            },
            {
              '@type': 'Question',
              name: '没有铭牌怎么估电容大小？',
              acceptedAnswer: { '@type': 'Answer', text: '按电机功率每 100W 取 4~6µF 估算，如 750W 约 30~45µF，风扇取小值、空压机取大值，装后测运行电流确认。' }
            },
            {
              '@type': 'Question',
              name: '电容容量选大一点行不行？',
              acceptedAnswer: { '@type': 'Answer', text: '偏差 ±10% 内一般可以；过大时副绕组电流增大、电容与绕组发热，运转电容宁小勿大。' }
            },
            {
              '@type': 'Question',
              name: '万用表怎么判断电容好坏？',
              acceptedAnswer: { '@type': 'Answer', text: '断电放电后用电容档实测：偏差超过 ±10%、开路或明显偏低建议更换；鼓包漏液直接更换。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'motor-capacitor-sizer'
const SETTINGS_KEY = 'motor-capacitor-sizer-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 状态 ----------
const mode = ref('current')      // 'current' 已知电流 | 'power' 已知功率
const voltage = ref(220)
const currentA = ref(1.5)
const powerW = ref(750)
const cosPhi = ref(0.8)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化 ----------
const fmt = (v, d = 2) => (Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—')
const devText = (devPct) => (Number.isFinite(devPct) ? (devPct >= 0 ? '+' : '') + devPct.toFixed(1) + '%' : '—')
const devCls = (devPct) => {
  if (!Number.isFinite(devPct)) return ''
  const abs = Math.abs(devPct)
  return abs <= 10
    ? 'text-green-600 dark:text-green-400'
    : 'text-amber-600 dark:text-amber-400'
}

// ---------- 计算联动 ----------
const voltageValid = computed(() => Number.isFinite(voltage.value) && voltage.value > 0)
const inputsValid = computed(() =>
  voltageValid.value &&
  Number.isFinite(cosPhi.value) && cosPhi.value > 0 && cosPhi.value <= 1 &&
  Number.isFinite(mode.value === 'current' ? currentA.value : powerW.value) &&
  (mode.value === 'current' ? currentA.value : powerW.value) > 0
)

// 统一折算：两种模式都归一到 I 与 P
const effectiveI = computed(() => {
  if (!inputsValid.value) return null
  return mode.value === 'current'
    ? currentA.value
    : currentFromPower(powerW.value, voltage.value, cosPhi.value)
})
const effectiveP = computed(() => {
  if (!inputsValid.value || effectiveI.value === null) return null
  return mode.value === 'power'
    ? powerW.value
    : voltage.value * effectiveI.value * cosPhi.value
})

// 公式轨
const cRun = computed(() => (effectiveI.value === null ? null : runCapUf(effectiveI.value, voltage.value, cosPhi.value)))
const cStart = computed(() => (effectiveI.value === null ? null : startCapUf(effectiveI.value, voltage.value, cosPhi.value)))
const runNearest = computed(() => nearestStep(cRun.value))
const startNearest = computed(() => nearestStep(cStart.value))

// 经验轨
const empRange = computed(() => empiricalRange(effectiveP.value) || { low: null, high: null, mid: null })
const lowNearest = computed(() => nearestStep(empRange.value.low))
const highNearest = computed(() => nearestStep(empRange.value.high))
const midNearest = computed(() => nearestStep(empRange.value.mid))

// ---------- 设置持久化（localStorage，键前缀用工具 id） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (s.mode === 'current' || s.mode === 'power') mode.value = s.mode
    if (Number.isFinite(s.voltage) && s.voltage > 0) voltage.value = s.voltage
    if (Number.isFinite(s.currentA) && s.currentA > 0) currentA.value = s.currentA
    if (Number.isFinite(s.powerW) && s.powerW > 0) powerW.value = s.powerW
    if (Number.isFinite(s.cosPhi) && s.cosPhi > 0 && s.cosPhi <= 1) cosPhi.value = s.cosPhi
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([mode, voltage, currentA, powerW, cosPhi], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      mode: mode.value,
      voltage: voltage.value,
      currentA: currentA.value,
      powerW: powerW.value,
      cosPhi: cosPhi.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
