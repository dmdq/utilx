<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Wine class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">酒精降度勾兑计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">白酒降度加水量、高低度酒互配体积比、95%→75% 消毒酒精配方与两桶勾兑反推，自酿果酒泡酒快速估算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线酒精稀释/勾兑计算工具：按体积守恒 C1V1 = C2V2 计算降度加水量（如 50 度 5L 降到 42 度需加水约 0.952L）；
        两种度数的酒互配目标度时给出「取 A 几份 + B 几份」的最简体积比与按目标总量的具体用量；
        医用 95% 酒精配 75% 消毒液支持按原液量或按配出总量两种口径并互换方向；另有两桶勾混反推各桶用量与酒精贡献、果酒加烈（Fortification）提升酒度小工具。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <p class="bg-muted/60 border border-border rounded-lg p-3 mb-6 text-xs leading-relaxed text-muted-foreground flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>按体积守恒 C1V1=C2V2 理想混合计算；酒精与水混合存在体积收缩（最高约 3-4%），高精度场景请用酒精计实测微调；本工具适合自酿与家庭泡酒快速估算。理性饮酒。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 参数输入卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Droplet class="w-5 h-5 mr-2 text-primary" /> 计算参数
        </h2>

        <!-- 模式切换 -->
        <div class="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-lg">
          <button
            v-for="tab in modeTabs"
            :key="tab.id"
            @click="mode = tab.id"
            class="px-2 py-2 rounded-md text-xs font-medium transition"
            :class="mode === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
          >
            {{ tab.name }}
          </button>
        </div>

        <!-- 模式一：降度加水 -->
        <div v-if="mode === 'dilute'" class="space-y-3">
          <div>
            <label for="adc-c1" class="block text-sm font-medium mb-1">原酒度（%vol）</label>
            <input id="adc-c1" v-model="dilute.c1" type="text" inputmode="decimal" placeholder="如 50" class="adc-input" />
          </div>
          <div>
            <label for="adc-v1" class="block text-sm font-medium mb-1">原酒体积（L）</label>
            <input id="adc-v1" v-model="dilute.v1" type="text" inputmode="decimal" placeholder="如 5" class="adc-input" />
          </div>
          <div>
            <label for="adc-c2" class="block text-sm font-medium mb-1">目标酒度（%vol，需低于原酒度）</label>
            <input id="adc-c2" v-model="dilute.c2" type="text" inputmode="decimal" placeholder="如 42" class="adc-input" />
          </div>
        </div>

        <!-- 模式二：高度兑低度互配 -->
        <div v-if="mode === 'blend'" class="space-y-3">
          <div>
            <label for="adc-a" class="block text-sm font-medium mb-1">A 桶酒度（高度侧，%vol）</label>
            <input id="adc-a" v-model="blend.a" type="text" inputmode="decimal" placeholder="如 52" class="adc-input" />
          </div>
          <div>
            <label for="adc-b" class="block text-sm font-medium mb-1">B 桶酒度（低度侧，%vol）</label>
            <input id="adc-b" v-model="blend.b" type="text" inputmode="decimal" placeholder="如 38" class="adc-input" />
          </div>
          <div>
            <label for="adc-t" class="block text-sm font-medium mb-1">目标酒度 T（介于两者之间，%vol）</label>
            <input id="adc-t" v-model="blend.t" type="text" inputmode="decimal" placeholder="如 45" class="adc-input" />
          </div>
          <div>
            <label for="adc-bt" class="block text-sm font-medium mb-1">目标总量（L，选填，用于换算具体用量）</label>
            <input id="adc-bt" v-model="blend.total" type="text" inputmode="decimal" placeholder="如 10" class="adc-input" />
          </div>
        </div>

        <!-- 模式三：消毒酒精配制 -->
        <div v-if="mode === 'disinfect'" class="space-y-3">
          <div class="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div>
              <label for="adc-src" class="block text-sm font-medium mb-1">原液浓度</label>
              <select id="adc-src" v-model="disinfect.source" class="adc-input">
                <option v-for="opt in strengthOptions" :key="'s' + opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <button
              @click="swapDisinfectDirection"
              class="px-2.5 py-2 mb-0.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-muted-foreground hover:text-foreground transition"
              title="互换原液与目标方向（75% ↔ 95%）"
            >
              <ArrowLeftRight class="w-4 h-4" />
            </button>
            <div>
              <label for="adc-tgt" class="block text-sm font-medium mb-1">目标浓度</label>
              <select id="adc-tgt" v-model="disinfect.target" class="adc-input">
                <option v-for="opt in strengthOptions" :key="'t' + opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-lg">
            <button
              v-for="basis in basisTabs"
              :key="basis.id"
              @click="disinfect.basis = basis.id"
              class="px-2 py-1.5 rounded-md text-xs font-medium transition"
              :class="disinfect.basis === basis.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
            >
              {{ basis.name }}
            </button>
          </div>
          <div>
            <label for="adc-amt" class="block text-sm font-medium mb-1">{{ disinfect.basis === 'source' ? '取原液体积（mL）' : '配出总体积（mL）' }}</label>
            <input id="adc-amt" v-model="disinfect.amount" type="text" inputmode="decimal" placeholder="如 500" class="adc-input" />
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            用凉开水或纯净水稀释，现配现用；75% 浓度仅用于皮肤/物体表面消毒，不可饮用。
          </p>
        </div>

        <!-- 预设试算 -->
        <div>
          <p class="text-sm font-medium mb-1.5">预设试算</p>
          <div class="space-y-1.5">
            <button
              v-for="preset in presets"
              :key="preset.label"
              @click="applyPreset(preset)"
              class="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted/80 border border-border rounded-lg text-xs text-foreground transition text-left"
            >
              <Play class="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span class="truncate">{{ preset.label }}</span>
            </button>
          </div>
        </div>

        <button
          @click="resetCurrentMode"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置当前模式
        </button>
      </div>

      <!-- 结果卡（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <CheckCircle v-if="mainResult.ok" class="w-5 h-5 mr-2 text-green-500" />
          <TriangleAlert v-else class="w-5 h-5 mr-2 text-red-500" />
          {{ modeTabs[modeTabIndex].name }} · 计算结果
        </h2>

        <p v-if="!mainResult.ok" class="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3 leading-relaxed">
          {{ mainResult.error }}
        </p>

        <!-- 降度加水结果 -->
        <div v-if="mainResult.ok && mode === 'dilute'" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div class="bg-primary/10 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">需加水量</p>
              <p class="text-2xl font-bold text-primary">{{ fmt(diluteResult.water) }} <span class="text-sm font-normal">L</span></p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">出水后总体积（理论）</p>
              <p class="text-2xl font-bold text-foreground">{{ fmt(diluteResult.total) }} <span class="text-sm font-normal">L</span></p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">守恒复核</p>
              <p class="text-2xl font-bold text-foreground">{{ fmt(diluteResult.recheck, 2) }} <span class="text-sm font-normal">°</span></p>
            </div>
          </div>
          <p class="text-xs font-mono text-muted-foreground bg-muted/40 rounded p-2.5 leading-relaxed">
            V水 = V1 × (C1/C2 − 1) = {{ fmt(diluteParsed.v1) }} × ({{ fmt(diluteParsed.c1, 2) }}/{{ fmt(diluteParsed.c2, 2) }} − 1) ≈ {{ fmt(diluteResult.water) }} L
          </p>
          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>先测后补：酒精与水混合会放热并收缩体积（最高约 3-4%），理论加水量偏保守。建议先加计算量的九成，搅匀静置回温到 20℃ 左右，用酒精计复核后再少量补足，一次加满容易降过头。</span>
          </p>
        </div>

        <!-- 互配结果 -->
        <div v-if="mainResult.ok && mode === 'blend'" class="space-y-4">
          <div class="bg-primary/10 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">体积配比（A : B）</p>
            <p class="text-3xl font-bold text-primary">{{ fmt(blendResult.partA) }} : {{ fmt(blendResult.partB) }}
              <span v-if="blendResult.ratio && (blendResult.ratio.a !== blendResult.partA || blendResult.ratio.b !== blendResult.partB)" class="text-base font-semibold">（最简 {{ blendResult.ratio.a }}:{{ blendResult.ratio.b }}）</span>
            </p>
            <p class="text-xs text-muted-foreground mt-1">即取 A 桶 {{ fmt(blendResult.partA) }} 份 + B 桶 {{ fmt(blendResult.partB) }} 份混匀</p>
          </div>
          <div v-if="blendResult.volA !== null" class="grid grid-cols-2 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">A（{{ fmt(blendParsed.a, 1) }}°）取</p>
              <p class="text-2xl font-bold text-foreground">{{ fmt(blendResult.volA) }} <span class="text-sm font-normal">L</span></p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">B（{{ fmt(blendParsed.b, 1) }}°）取</p>
              <p class="text-2xl font-bold text-foreground">{{ fmt(blendResult.volB) }} <span class="text-sm font-normal">L</span></p>
            </div>
          </div>
          <p class="text-xs font-mono text-muted-foreground bg-muted/40 rounded p-2.5 leading-relaxed">
            推导：T(x+y)=Ax+By ⇒ x(A−T)=y(T−B) ⇒ A:B = (T−B):(A−T)；复核混合度 = {{ fmt(blendResult.blendCheck, 2) }}°
          </p>
          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>勾兑按「高度酒倒入低度酒」方向混合更均匀；两次少量互兑、静置融合几天再定型，新勾的酒口感会偏「生」。</span>
          </p>
        </div>

        <!-- 消毒酒精结果 -->
        <div v-if="mainResult.ok && mode === 'disinfect'" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">{{ disinfect.source }}% 原液</p>
              <p class="text-2xl font-bold text-foreground">{{ fmt(disinfectResult.sourceVol) }} <span class="text-sm font-normal">mL</span></p>
            </div>
            <div class="bg-primary/10 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">加水至总量</p>
              <p class="text-2xl font-bold text-primary">{{ fmt(disinfectResult.water) }} <span class="text-sm font-normal">mL（约）</span></p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">配出总体积（理论）</p>
              <p class="text-2xl font-bold text-foreground">{{ fmt(disinfectResult.total) }} <span class="text-sm font-normal">mL</span></p>
            </div>
          </div>
          <p class="text-xs font-mono text-muted-foreground bg-muted/40 rounded p-2.5 leading-relaxed">
            复核：{{ fmt(disinfectResult.sourceVol) }} mL × {{ disinfect.source }}% ÷ {{ fmt(disinfectResult.total) }} mL ≈ {{ fmt(disinfectResult.recheck, 1) }} %vol（手算口径：取 100mL 95% 配 75% 需加水 100×(95/75−1) ≈ 26.7mL，总量 126.7，95×100÷126.7 ≈ 75 ✓）
          </p>
          <p class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <span>消毒酒精配制注意：因混合体积收缩，「原液 + 水直接相加」会略欠量，精确配方请向量筒/容量瓶定容到目标刻度；现配现用、远离明火、通风存放，标注浓度与日期；75% 仅供外用消毒，不可饮用。</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 反向推算卡 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-4">
        <Droplet class="w-5 h-5 mr-2 text-primary" /> 两桶勾混反推（已知两桶酒度、勾后度数与总量，解二元一次方程组）
      </h2>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="space-y-3">
          <div>
            <label for="adc-r-a" class="block text-sm font-medium mb-1">A 桶酒度（%vol）</label>
            <input id="adc-r-a" v-model="reverse.a" type="text" inputmode="decimal" placeholder="如 60" class="adc-input" />
          </div>
          <div>
            <label for="adc-r-b" class="block text-sm font-medium mb-1">B 桶酒度（%vol）</label>
            <input id="adc-r-b" v-model="reverse.b" type="text" inputmode="decimal" placeholder="如 30" class="adc-input" />
          </div>
        </div>
        <div class="space-y-3">
          <div>
            <label for="adc-r-t" class="block text-sm font-medium mb-1">实测混合酒度（%vol）</label>
            <input id="adc-r-t" v-model="reverse.t" type="text" inputmode="decimal" placeholder="如 45" class="adc-input" />
          </div>
          <div>
            <label for="adc-r-v" class="block text-sm font-medium mb-1">混合总体积（L）</label>
            <input id="adc-r-v" v-model="reverse.total" type="text" inputmode="decimal" placeholder="如 10" class="adc-input" />
          </div>
        </div>
        <div class="bg-muted/40 rounded-lg p-4 space-y-2">
          <p v-if="!reverseResult.ok" class="text-sm text-red-600 leading-relaxed">{{ reverseResult.error }}</p>
          <template v-else>
            <p class="text-sm"><span class="text-muted-foreground">A 桶用量：</span><span class="font-bold text-foreground">{{ fmt(reverseResult.volA) }} L（占体积 {{ fmt(reverseResult.volShareA * 100, 1) }}%）</span></p>
            <p class="text-sm"><span class="text-muted-foreground">B 桶用量：</span><span class="font-bold text-foreground">{{ fmt(reverseResult.volB) }} L（占体积 {{ fmt(reverseResult.volShareB * 100, 1) }}%）</span></p>
            <p class="text-xs text-muted-foreground leading-relaxed">酒精贡献：A 桶约 {{ fmt(reverseResult.alcShareA * 100, 1) }}% · B 桶约 {{ fmt(reverseResult.alcShareB * 100, 1) }}%（复核混合度 {{ fmt(reverseResult.check, 2) }}°）</p>
            <p class="text-xs font-mono text-muted-foreground leading-relaxed">x + y = V；Ax + By = TV ⇒ x = V(T−B)/(A−B)</p>
          </template>
        </div>
      </div>
    </div>

    <!-- 自酿实用附卡 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 果酒加烈计算 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-3">
        <h2 class="text-lg font-semibold flex items-center">
          <Wine class="w-5 h-5 mr-2 text-primary" /> 果酒加烈（Fortification）
        </h2>
        <p class="text-xs text-muted-foreground leading-relaxed">自酿果酒发酵结束后偏淡，想加 95% 原酒（白兰地/伏特加同理）提升到目标酒度，复用同一线性混合方程：</p>
        <div>
          <label for="adc-f-v" class="block text-sm font-medium mb-1">果酒体积（L）</label>
          <input id="adc-f-v" v-model="fortify.v1" type="text" inputmode="decimal" placeholder="如 5" class="adc-input" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="adc-f-c" class="block text-sm font-medium mb-1">现有酒度 °</label>
            <input id="adc-f-c" v-model="fortify.c1" type="text" inputmode="decimal" placeholder="如 12" class="adc-input" />
          </div>
          <div>
            <label for="adc-f-t" class="block text-sm font-medium mb-1">目标酒度 °</label>
            <input id="adc-f-t" v-model="fortify.t" type="text" inputmode="decimal" placeholder="如 18" class="adc-input" />
          </div>
        </div>
        <div>
          <label for="adc-f-s" class="block text-sm font-medium mb-1">加入烈酒度数（%vol）</label>
          <input id="adc-f-s" v-model="fortify.spirit" type="text" inputmode="decimal" placeholder="如 95" class="adc-input" />
        </div>
        <div class="bg-muted/40 rounded-lg p-3 space-y-1">
          <p v-if="!fortifyResult.ok" class="text-sm text-red-600 leading-relaxed">{{ fortifyResult.error }}</p>
          <template v-else>
            <p class="text-sm"><span class="text-muted-foreground">需加 {{ fortifySpiritLabel }}：</span><span class="font-bold text-primary">{{ fmt(fortifyResult.spiritVol) }} L</span></p>
            <p class="text-xs text-muted-foreground">加烈后总量约 {{ fmt(fortifyResult.total) }} L，复核 {{ fmt(fortifyResult.recheck, 2) }}°（公式 V烈 = V1(T−C1)/(烈度−T)）</p>
          </template>
        </div>
      </div>

      <!-- 泡酒糖酒比常识 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-3">
        <h2 class="text-lg font-semibold flex items-center">
          <Droplet class="w-5 h-5 mr-2 text-primary" /> 泡酒糖酒比常识
        </h2>
        <ul class="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <li class="flex items-start gap-2">
            <span class="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
            <span><span class="text-foreground font-medium">青梅酒：</span>青梅 : 白酒 : 冰糖 ≈ 1 : 1 : 0.5，选 40-50 度清香型白酒，密封 3 个月起饮，半年到一年风味更佳。</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
            <span><span class="text-foreground font-medium">桑葚 / 杨梅等浆果：</span>汁多含水高，果 : 酒 : 糖 ≈ 1 : 1.2 : 0.3，用 45 度左右更耐存放。</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
            <span><span class="text-foreground font-medium">通用原则：</span>泡果酒常用 30-50 度清香型白酒——低于 30 度抑菌力弱需冷藏快饮，高于 55 度会抑制果香浸出且刺激感重。冰糖用量约为果量的三到五成，主要平衡酸涩并助酯香。</span>
          </li>
        </ul>
      </div>

      <!-- 酒度单位卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-3">
        <h2 class="text-lg font-semibold flex items-center">
          <Info class="w-5 h-5 mr-2 text-primary" /> 酒的「度」是什么意思
        </h2>
        <ul class="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <li>酒精强度 %vol（简称「度」）定义为 <span class="text-foreground font-medium">20℃ 时 100mL 酒液中所含乙醇的毫升数</span>：50 度即每 100mL 含 50mL 乙醇，是体积分数而非质量分数。</li>
          <li>乙醇密度约 0.789 g/mL，故 50 度酒按质量算酒精约 44%；换算重量时别忘了这个系数。</li>
          <li>酒精计读数以 20℃ 标定：样品温度偏高时读数虚高，经验上每高 1℃ 约需减去 0.3 度，测前务必回温。</li>
        </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>酒精降度勾兑计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款面向自酿果酒、泡酒、白酒降度与消毒酒精配制场景的在线计算工具。核心原理是体积守恒的理想混合公式 C1V1 = C2V2：
          降度加水时加水量 V水 = V1 × (C1/C2 − 1)；两种酒互配目标度时由 T(x+y) = Ax + By 解出体积比 A:B = (T−B):(A−T)；
          95% 医用酒精配 75% 消毒液按同样公式换算，并支持按原液量或按配出总量两种口径。所有计算在浏览器本地完成，不上传数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">酒度数的定义（%vol）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          我国与国际通用的「酒精度」是体积分数 %vol：在 20℃ 标准温度下，100mL 酒液中含有多少 mL 乙醇就是多少度，例如 53 度白酒即 100mL 含 53mL 乙醇。
          它不同于质量分数（乙醇密度 0.789，53 度约折合 45.6% 质量分数），标签上的 vol 字样即体积浓度。本工具全部按 %vol 计算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么加水会发热、体积会缩小？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          乙醇与水分子之间会形成氢键，混合时释放热量并使分子排列更紧密——这就是加水发热、总体积收缩（最高约 3-4%，在 40-60%vol 区间附近最明显）的原因，
          所以按体积相加的理论配方实际会略欠量。降度后应搅匀、静置回温到 20℃ 左右再用酒精计复核微调，这也是「先测后补」的由来。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">降度后为什么会浑浊？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          白酒中的高级脂肪酸酯（棕榈酸乙酯、油酸乙酯、亚油酸乙酯等）溶于高浓度酒精但难溶于水，降度使酒精对它们的溶解力下降而析出，酒体呈乳白浑浊、低温下更明显。
          这恰恰是纯粮固态酒的常见现象，并非变质；过滤或加香勾调过的酒精酒反而不浑。自酿果酒降度后轻微失光则多为果胶析出，静置或皂土澄清即可。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">自酿怎么知道现在多少度？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          最可靠的是用 20℃ 标定的酒精计加温度计实测（取液澄清后测量，回温读数）；没有酒精计时可用沸点法粗测——乙醇 78.3℃ 沸点，酒液沸点越接近 78℃ 酒度越高，接近 100℃ 则几乎无酒精，误差较大仅供参考。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">降度对风味的影响</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          酒精不只是刺激物，更是香气物质的溶剂：降度过快或过低会让酯香、陈香「散掉」，口感变水、变寡，高级脂肪酸酯析出还可能带来油哈味。
          实务上建议分次小幅降度（每次 2-3 度）、加纯净水而非矿泉水（避免离子促沉）、降度后静置融合数天再品评定型；高度酒风味更「聚」，低度酒更「柔」，按饮用习惯选目标度即可。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">50 度白酒 5L 降到 42 度需要加多少水？</h3>
            <p class="text-sm text-muted-foreground mt-1">按公式 V水 = V1(C1/C2 − 1) = 5 × (50/42 − 1) ≈ 0.952L，出水后理论总体积约 5.952L。注意实际混合会收缩 1-3%，建议先加九成、静置回温后用酒精计复核再补足。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">38 度和 52 度的酒怎么互配成 45 度？</h3>
            <p class="text-sm text-muted-foreground mt-1">体积比 A:B = (T−B):(A−T) = (45−38):(52−45) = 7:7，即两桶各一半：要 10L 就各取 5L。同理 60 度配 30 度取 45 度中间偏低时（如目标 51 度）为 7:3，本工具会自动给出最简份数和具体用量。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">用 95% 医用酒精配 500mL 的 75% 消毒液怎么配？</h3>
            <p class="text-sm text-muted-foreground mt-1">理论取 95% 原液 500×75/95 ≈ 394.7mL，加水约 105.3mL；手算口径验：取 100mL 95% 加水 26.7mL 得总量 126.7mL，复核 100×95÷126.7 ≈ 75 度。因体积收缩，讲究的做法是原液入量筒后直接定容到 500mL 刻度。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">降度后酒变浑浊是不是假的？</h3>
            <p class="text-sm text-muted-foreground mt-1">大概率相反：纯粮酒中的高级脂肪酸酯溶于高酒精、难溶于低酒精，降度后析出致浑，是粮食酒的常见特征。判断需结合口感与香气，浑浊本身不代表变质，密封静置即可。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'alcohol-dilution-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Wine, Droplet, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, ArrowLeftRight
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '酒精降度勾兑计算器 - 白酒降度加水量/互配比例/消毒酒精配制工具',
  description: '免费在线酒精稀释计算：白酒降度加水量公式 C1V1=C2V2 一键算（50度5L降42度加水0.952L），高低度酒互配体积比、95%配75%消毒酒精配方、两桶勾混反推、果酒加烈提度，自酿泡酒必备，本地运行不上传',
  keywords: '白酒降度计算,勾兑加水量,酒的度数换算,果酒降度,酒精稀释公式',
  author: '有条工具',
  ogTitle: '酒精降度勾兑计算器 - 白酒降度加水量/互配比例/消毒酒精配制 | 有条工具',
  ogDescription: '降度加水量、高低度互配体积比、95→75%消毒酒精配方，C1V1=C2V2 本地快速估算。',
  ogUrl: 'https://www.util.cn/tools/alcohol-dilution-calculator',
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
          name: '酒精降度勾兑计算器',
          url: 'https://www.util.cn/tools/alcohol-dilution-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['降度加水量计算（C1V1=C2V2）', '高低度酒互配最简体积比', '95%→75%消毒酒精配方', '两桶勾混反推各桶用量与贡献', '果酒加烈提升酒度', '预设一键试算', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '酒精降度勾兑计算器', item: 'https://www.util.cn/tools/alcohol-dilution-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '50度白酒5L降到42度需要加多少水？',
              acceptedAnswer: { '@type': 'Answer', text: '按公式V水=V1(C1/C2−1)=5×(50/42−1)≈0.952L，出水后理论总体积约5.952L。注意实际混合会收缩1-3%，建议先加九成、静置回温后用酒精计复核再补足。' }
            },
            {
              '@type': 'Question',
              name: '38度和52度的酒怎么互配成45度？',
              acceptedAnswer: { '@type': 'Answer', text: '体积比A:B=(T−B):(A−T)=(45−38):(52−45)=7:7，即两桶各一半：要10L就各取5L。工具会自动给出最简份数与按目标总量的具体用量。' }
            },
            {
              '@type': 'Question',
              name: '用95%医用酒精配500mL的75%消毒液怎么配？',
              acceptedAnswer: { '@type': 'Answer', text: '理论取95%原液500×75/95≈394.7mL，加水约105.3mL；取100mL95%加水26.7mL得总量126.7mL可复核约75度。因混合体积收缩，讲究的做法是原液入量筒后直接定容到500mL刻度。' }
            },
            {
              '@type': 'Question',
              name: '降度后酒变浑浊是不是假的？',
              acceptedAnswer: { '@type': 'Answer', text: '大概率相反：纯粮酒中的高级脂肪酸酯溶于高酒精、难溶于低酒精，降度后析出致浑，是粮食酒的常见特征，并不代表变质，密封静置即可。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 宽松数值解析：接受 "50" / "42.5" / "1,000"，非法返回 NaN
function toNum(raw) {
  const s = String(raw == null ? '' : raw).trim().replace(/,/g, '')
  if (!s) return NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

// 显示精度：默认保留 3 位小数
function fmt(x, digits = 3) {
  if (!Number.isFinite(x)) return '—'
  const p = Math.pow(10, digits)
  return String(Math.round(x * p) / p)
}

function gcdInt(a, b) {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b) { const t = b; b = a % b; a = t }
  return a || 1
}

// 份数化为最简整数比：先找 1/10/100/1000 倍使其成整数，再除以最大公约数
function reduceParts(pa, pb) {
  let k = 1000
  for (const cand of [1, 10, 100, 1000]) {
    if (Math.abs(pa * cand - Math.round(pa * cand)) < 1e-6 && Math.abs(pb * cand - Math.round(pb * cand)) < 1e-6) { k = cand; break }
  }
  let a = Math.round(pa * k)
  let b = Math.round(pb * k)
  if (a < 0 && b < 0) { a = -a; b = -b } // A、B 输入顺序颠倒时份数同为负，取绝对值
  const g = gcdInt(a, b)
  return { a: a / g, b: b / g }
}

// 降度加水：体积守恒 C1·V1 = C2·V2 ⇒ V2 = V1·C1/C2，V水 = V1(C1/C2 − 1)
// 校验目标度必须低于原酒度（C2 < C1），并给出复核浓度（应恰好等于 C2）
function diluteWater(c1, v1, c2) {
  if (!Number.isFinite(c1) || !Number.isFinite(v1) || !Number.isFinite(c2)) return { ok: false, error: '请填写原酒度、原体积与目标酒度三个数值' }
  if (!(c1 > 0) || !(v1 > 0) || !(c2 > 0)) return { ok: false, error: '酒度与体积均需大于 0' }
  if (c1 > 96 || c2 > 96) return { ok: false, error: '乙醇约 95.6%vol 即为常压共沸上限，市售最高 95% 左右，请检查输入' }
  if (!(c2 < c1)) return { ok: false, error: '目标酒度必须低于原酒度（C2 < C1）：这是降度；想提度请用「互配」或「果酒加烈」' }
  const total = v1 * c1 / c2
  const water = total - v1
  return { ok: true, sourceVol: v1, water, total, recheck: (v1 * c1) / total }
}

// 高度兑低度互配（代数推导）：目标度 T 满足 T(x+y) = Ax + By
// ⇒ x(A − T) = y(T − B) ⇒ A:B 份数 = (T − B) : (A − T)
//（若按 B:A 书写则恰为题面常见的 (A−T):(T−B)，二者等价，本函数按 A:B 输出）
function blendParts(a, b, t) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(t)) return { ok: false, error: '请填写 A、B 两桶酒度与目标酒度 T' }
  if (a > 96 || b > 96 || t > 96) return { ok: false, error: '酒度不能超过 96%vol（乙醇共沸上限附近）' }
  if (!(a > 0) || !(b > 0) || !(t > 0)) return { ok: false, error: '酒度需大于 0' }
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  if (!(t > lo && t < hi)) return { ok: false, error: '目标酒度必须介于两桶之间（B < T < A 或 A < T < B）' }
  let partA = t - b
  let partB = a - t
  if (partA < 0 && partB < 0) { partA = -partA; partB = -partB } // A、B 输入顺序颠倒时份数同负，比值与体积解不变，展示取正
  const ratio = reduceParts(partA, partB)
  const blendCheck = (ratio.a * a + ratio.b * b) / (ratio.a + ratio.b)
  return { ok: true, partA, partB, ratio, blendCheck }
}

// 互配按目标总量换算具体体积：x = 总量 × A份/(A份+B份)
function blendVolumes(a, b, t, total) {
  const r = blendParts(a, b, t)
  if (!r.ok) return r
  if (!Number.isFinite(total) || total <= 0) return { ...r, volA: null, volB: null }
  const volA = (total * r.partA) / (r.partA + r.partB)
  return { ...r, volA, volB: total - volA }
}

// 反向推算：已知两桶酒度 A、B，实测混合度 T 与总量 V，解二元一次方程组
//   x + y = V
//   A·x + B·y = T·V        ⇒  x = V(T − B)/(A − B)，y = V − x
// 另给出体积占比与各自的纯酒精贡献占比
function reverseBlend(a, b, t, v) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(t) || !Number.isFinite(v)) return { ok: false, error: '请填写两桶酒度、混合度数与总体积' }
  if (!(v > 0)) return { ok: false, error: '总体积需大于 0' }
  if (a === b) return { ok: false, error: '两桶酒度相等（A = B），方程组无唯一解，混合度应与之相同' }
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  if (!(t > lo && t < hi)) return { ok: false, error: '混合度数必须介于两桶酒度之间（低 < T < 高），否则该组合不可能' }
  const volA = (v * (t - b)) / (a - b)
  const volB = v - volA
  if (!(volA >= 0) || !(volB >= 0)) return { ok: false, error: '解出的体积为负，请检查输入' }
  const alcA = (volA * a) / 100
  const alcB = (volB * b) / 100
  const alcTotal = alcA + alcB
  return {
    ok: true,
    volA,
    volB,
    volShareA: volA / v,
    volShareB: volB / v,
    alcShareA: alcTotal > 0 ? alcA / alcTotal : 0,
    alcShareB: alcTotal > 0 ? alcB / alcTotal : 0,
    check: alcTotal > 0 ? (alcA + alcB) / v * 100 : NaN
  }
}

// 消毒酒精配方·按取原液量：加水 V水 = V原(C原/C目标 − 1)，复核 = V原·C原/总量
function diluteToVolume(sourcePct, targetPct, sourceVol) {
  return diluteWater(sourcePct, sourceVol, targetPct)
}

// 消毒酒精配方·按配出总量定容：原液 = 总量×C目标/C原，水 = 总量 − 原液
function targetVolumeRecipe(sourcePct, targetPct, total) {
  if (!Number.isFinite(sourcePct) || !Number.isFinite(targetPct) || !Number.isFinite(total)) return { ok: false, error: '请填写原液浓度、目标浓度与配出总量' }
  if (!(sourcePct > 0) || !(targetPct > 0) || !(total > 0)) return { ok: false, error: '浓度与总量均需大于 0' }
  if (!(targetPct < sourcePct)) return { ok: false, error: '目标浓度必须低于原液浓度（消毒稀释方向）' }
  const sourceVol = (total * targetPct) / sourcePct
  const water = total - sourceVol
  return { ok: true, sourceVol, water, total, recheck: (sourceVol * sourcePct) / total }
}

// 果酒加烈（Fortification）：T = (V1·C1 + s·S)/(V1 + s) ⇒ s = V1(T − C1)/(S − T)
//（与降度同一线性方程的正向解，T 高于现度、低于烈酒度）
function fortify(v1, c1, t, spirit) {
  if (!Number.isFinite(v1) || !Number.isFinite(c1) || !Number.isFinite(t) || !Number.isFinite(spirit)) return { ok: false, error: '请填写果酒体积、现度、目标度与烈酒度数' }
  if (!(v1 > 0) || !(c1 >= 0) || !(t > 0) || !(spirit > 0)) return { ok: false, error: '体积与酒度均需为非负数值，且目标度、烈酒度大于 0' }
  if (spirit > 96) return { ok: false, error: '烈酒度数不能超过 96%vol' }
  if (!(t > c1) || !(t < spirit)) return { ok: false, error: '目标酒度必须介于现度与烈酒度之间（C1 < T < 烈度）' }
  const spiritVol = (v1 * (t - c1)) / (spirit - t)
  const total = v1 + spiritVol
  return { ok: true, spiritVol, total, recheck: (v1 * c1 + spiritVol * spirit) / total }
}

// ---------- 预设与选项 ----------
const modeTabs = [
  { id: 'dilute', name: '降度加水' },
  { id: 'blend', name: '高度兑低度互配' },
  { id: 'disinfect', name: '消毒酒精配制' }
]
const basisTabs = [
  { id: 'source', name: '按取原液量' },
  { id: 'total', name: '按配出总量定容' }
]
const strengthOptions = [
  { value: '95', label: '95%（试剂/医用原液）' },
  { value: '90', label: '90%' },
  { value: '84', label: '84%' },
  { value: '80', label: '80%' },
  { value: '78', label: '78%' },
  { value: '75', label: '75%（皮肤消毒常用）' },
  { value: '70', label: '70%（物体表面常用）' },
  { value: '65', label: '65%' },
  { value: '60', label: '60%' }
]

// 预设断言口径（手算）：5×(50/42−1)=0.952L；(45−38):(52−45)=7:7→1:1；500×75/95=394.7mL
const presets = [
  { label: '50度白酒 5L 降 42 度（加水 ≈0.952L）', mode: 'dilute', patch: { c1: '50', v1: '5', c2: '42' } },
  { label: '38 度与 52 度互配 45 度（1:1，共 10L）', mode: 'blend', patch: { a: '52', b: '38', t: '45', total: '10' } },
  { label: '95% 原液配 75% 共 500mL（394.7+105.3）', mode: 'disinfect', patch: { source: '95', target: '75', basis: 'total', amount: '500' } }
]

const DEFAULTS = {
  dilute: { c1: '50', v1: '5', c2: '42' },
  blend: { a: '52', b: '38', t: '45', total: '10' },
  disinfect: { source: '95', target: '75', basis: 'total', amount: '500' },
  reverse: { a: '60', b: '30', t: '45', total: '10' },
  fortify: { v1: '5', c1: '12', t: '18', spirit: '95' }
}

// ---------- 响应式状态 ----------
const mode = ref('dilute')
const dilute = reactive({ ...DEFAULTS.dilute })
const blend = reactive({ ...DEFAULTS.blend })
const disinfect = reactive({ ...DEFAULTS.disinfect })
const reverse = reactive({ ...DEFAULTS.reverse })
const fortifyForm = reactive({ ...DEFAULTS.fortify })
const seoContentVisible = ref(true)

const modeTabIndex = computed(() => Math.max(0, modeTabs.findIndex((m) => m.id === mode.value)))

// ---------- 派生结果（纯函数的响应式封装） ----------
const diluteParsed = computed(() => ({ c1: toNum(dilute.c1), v1: toNum(dilute.v1), c2: toNum(dilute.c2) }))
const diluteResult = computed(() => diluteWater(diluteParsed.value.c1, diluteParsed.value.v1, diluteParsed.value.c2))

const blendParsed = computed(() => ({ a: toNum(blend.a), b: toNum(blend.b), t: toNum(blend.t), total: toNum(blend.total) }))
const blendResult = computed(() => blendVolumes(blendParsed.value.a, blendParsed.value.b, blendParsed.value.t, blendParsed.value.total))

const disinfectResult = computed(() => {
  const s = toNum(disinfect.source)
  const t = toNum(disinfect.target)
  const amt = toNum(disinfect.amount)
  return disinfect.basis === 'source'
    ? diluteToVolume(s, t, amt)
    : targetVolumeRecipe(s, t, amt)
})

const reverseResult = computed(() => reverseBlend(toNum(reverse.a), toNum(reverse.b), toNum(reverse.t), toNum(reverse.total)))

const fortifyResult = computed(() =>
  fortify(toNum(fortifyForm.v1), toNum(fortifyForm.c1), toNum(fortifyForm.t), toNum(fortifyForm.spirit))
)

const mainResult = computed(() => {
  if (mode.value === 'dilute') return diluteResult.value
  if (mode.value === 'blend') return blendResult.value
  return disinfectResult.value
})

const fortifySpiritLabel = computed(() => `${fortifyForm.spirit || '95'}% 烈酒`)

// ---------- 交互 ----------
function swapDisinfectDirection() {
  const s = disinfect.source
  disinfect.source = disinfect.target
  disinfect.target = s
}

function applyPreset(preset) {
  mode.value = preset.mode
  if (preset.mode === 'dilute') Object.assign(dilute, DEFAULTS.dilute, preset.patch)
  else if (preset.mode === 'blend') Object.assign(blend, DEFAULTS.blend, preset.patch)
  else Object.assign(disinfect, DEFAULTS.disinfect, preset.patch)
}

function resetCurrentMode() {
  if (mode.value === 'dilute') Object.assign(dilute, DEFAULTS.dilute)
  else if (mode.value === 'blend') Object.assign(blend, DEFAULTS.blend)
  else Object.assign(disinfect, DEFAULTS.disinfect)
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('alcohol-dilution-calculator')
})
</script>

<style scoped>
.adc-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: hsl(var(--foreground));
}
.adc-input:focus {
  outline: none;
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.4);
}
</style>
