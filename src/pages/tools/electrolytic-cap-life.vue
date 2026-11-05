<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Hourglass class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电解电容寿命估算器</h1>
          <p class="text-sm text-muted-foreground mt-1">10℃ 法则寿命估算、纹波电流修正与温度-寿命对照表</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        三步算清电解电容还能用多久：① 按 10℃ 法则 L = L0 × 2^((T0−T)/10) 从规格书寿命与额定温度推算实际工作温度下的剩余寿命（小时 / 万小时 / 年三口径）；② 可选纹波电流修正——按 ΔT = ΔT_rated × r² 算出实际温升，用核心温度替代环境温度代入，纹波超额定自动警示；③ 生成 40~105℃ 温度-寿命对照表，直观看到「每 +10℃ 减半、每 −10℃ 翻倍」的分界。附换件速查卡，全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 寿命估算
        </h2>

        <!-- 规格书寿命 L0 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">规格书寿命 L0（小时，额定温度下）</label>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <button
              v-for="p in l0Presets"
              :key="p"
              @click="l0 = p"
              :class="l0 === p ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            >{{ p.toLocaleString('zh-CN') }} h</button>
          </div>
          <input
            v-model.number="l0"
            type="number"
            min="1"
            step="100"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="自定义寿命小时数（如 3000）"
          />
          <p class="text-xs text-muted-foreground mt-1.5">规格书「Load Life / Endurance」栏常见写法：105℃ 2000h、85℃ 1000h 等。</p>
        </div>

        <!-- 额定温度 / 工作温度 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">额定温度 T0（℃）</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="t in t0Options"
                :key="t"
                @click="t0 = t"
                :class="t0 === t ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ t }}℃ 型</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">与 L0 配套：写「105℃ 2000h」就选 105℃ 型。</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">实际工作温度 T（℃，−40~125）</label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="tAmb"
                type="number"
                min="-40"
                max="125"
                step="1"
                class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="实测环境 / 机内温度"
              />
              <span class="text-sm text-muted-foreground">℃</span>
            </div>
            <p v-if="tAmbWarn" class="text-xs text-amber-600 dark:text-amber-400 mt-1.5 leading-relaxed">{{ tAmbWarn }}</p>
            <p v-else class="text-xs text-muted-foreground mt-1.5">默认 45℃：消费电器机内常见值；变频/电源板建议实测。</p>
          </div>
        </div>

        <!-- 纹波电流修正 -->
        <div class="border border-border rounded-lg p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-foreground flex items-center">
              <Zap class="w-4 h-4 mr-2 text-primary" /> 纹波电流修正（可选）
            </h3>
            <button
              @click="rippleOn = !rippleOn"
              :class="rippleOn ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            >{{ rippleOn ? '已启用' : '未启用' }}</button>
          </div>

          <div v-if="rippleOn" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">额定温升 ΔT_rated（℃）</label>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="d in dtRatedOptions"
                  :key="d"
                  @click="dtRated = d"
                  :class="dtRated === d ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-xs font-medium transition-all"
                >{{ d }}℃</button>
              </div>
              <p class="text-xs text-muted-foreground mt-1.5">规格书常见 ±5 / 10 / 20℃，默认 10℃。</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">纹波电流比 r = I_actual / I_rated（0~2.0）</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="rippleRatio"
                  type="number"
                  min="0"
                  max="2"
                  step="0.05"
                  class="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="如 1.2"
                />
              </div>
              <p class="text-xs text-muted-foreground mt-1.5">开关电源输出电容常在 0.8~1.5；实测电流 ÷ 规格书额定纹波电流。</p>
            </div>

            <div v-if="coreTemp !== null" class="md:col-span-2 bg-muted/50 rounded-lg p-3 text-sm leading-relaxed">
              实际温升 ΔT = {{ fmt(dtRated, 0) }} × r²（r={{ fmt(rippleRatio, 2) }}）= <span class="text-foreground font-medium">{{ fmt(deltaT, 1) }}℃</span>，
              核心温度 T_core = T_amb + ΔT = <span class="text-primary font-bold">{{ fmt(coreTemp, 1) }}℃</span>，将以 T_core 代入寿命公式。
            </div>
            <div v-if="rippleWarn" class="md:col-span-2 bg-amber-500/10 rounded-lg p-3 text-xs leading-relaxed flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <span class="text-amber-600 dark:text-amber-400 font-medium">纹波超额定，寿命加速衰减：发热按 r² 增长，r=1.2 时寿命已约为额定纹波下的一半。</span>
            </div>
            <div v-else-if="rippleGood" class="md:col-span-2 bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
              纹波降额合理：r ≤ 0.8，实际温升低于额定设计值，寿命余量充足。
            </div>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed">
            纹波修正为简化模型（ΔT = ΔT_rated × r²），精确模型含电压应力项（各厂口径不同），关键设计请用厂商寿命计算工具。
          </p>
        </div>

        <!-- 结果 -->
        <div v-if="life !== null" class="space-y-3">
          <div class="bg-primary/10 rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">预期寿命（{{ lifeBasis }}）</p>
            <p class="text-3xl font-bold text-primary">{{ fmtHours(life) }} 小时</p>
            <div class="grid grid-cols-2 gap-3 mt-3">
              <div class="bg-card/60 rounded-lg p-2.5">
                <p class="text-[10px] text-muted-foreground mb-0.5">万小时</p>
                <p class="text-lg font-bold text-foreground">{{ fmt(life / 10000, 2) }} 万h</p>
              </div>
              <div class="bg-card/60 rounded-lg p-2.5">
                <p class="text-[10px] text-muted-foreground mb-0.5">年（按 8760 h/年）</p>
                <p class="text-lg font-bold text-foreground">{{ fmt(life / 8760, 1) }} 年</p>
              </div>
            </div>
          </div>
          <div class="rounded-lg p-4 text-center border" :class="tier.style">
            <p class="text-xs opacity-80 mb-0.5">维护判定</p>
            <p class="text-lg font-bold">{{ tier.label }}</p>
            <p class="text-xs opacity-80 mt-1">{{ tier.hint }}</p>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            计算式：L = {{ fmt(l0, 0) }} × 2^(({{ fmt(t0, 0) }} − {{ fmt(effTemp, 1) }})/10) = {{ fmt(l0, 0) }} × 2^{{ fmt((t0 - effTemp) / 10, 2) }}。
            温度每 +10℃ 寿命减半、每 −10℃ 寿命翻倍。
          </p>
        </div>
        <div v-else class="p-6 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
          请先填写有效的规格书寿命 L0（大于 0）。
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 换件速查卡 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Wrench class="w-4 h-4 mr-2 text-primary" /> 换件速查卡
          </h2>
          <ul class="text-xs text-muted-foreground leading-relaxed space-y-2 list-disc pl-4">
            <li>耐压只高不低：替换件额定电压 ≥ 原件，且留 20% 余量更稳。</li>
            <li>容差 ±10% 内：容量差太多会影响纹波吸收与输出纹波电压。</li>
            <li>105℃ 型优先于 85℃ 型：同寿命指标下实际寿命差 4 倍（20℃ × 2倍/10℃）。</li>
            <li>ESR 低的换上去更好（开关电源）：发热更低、纹波更小；个别靠 ESR 阻尼稳定环路的老设计，换超低 ESR 后需观察有无振荡。</li>
            <li>鼓包 / 漏液立即换：电解液已干涸或外泄，容量与 ESR 已劣化，继续用可能爆裂。</li>
            <li>尺寸装不下时优先保直径（散热面），高度可妥协；卧装比立装散热差，估算寿命再降一档。</li>
          </ul>
        </div>

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
              105℃ / 2000h @ 45℃ → <span class="text-foreground font-medium">128,000 h ≈ 14.6 年</span>
            </button>
            <button
              @click="loadExample('b')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              105℃ / 2000h @ 85℃ → <span class="text-foreground font-medium">8,000 h</span>（+40℃ 减半两次）
            </button>
            <button
              @click="loadExample('c')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              85℃ / 1000h @ 45℃ → <span class="text-foreground font-medium">16,000 h</span>
            </button>
            <button
              @click="loadExample('d')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              纹波：ΔT_rated=10、r=1.2、T_amb=40 → <span class="text-foreground font-medium">T_core=54.4℃</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 显著免责条 -->
    <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
        免责声明：10℃ 法则为 Arrhenius 简化估算，寿命与整机设计强相关，关键场合以厂商精确模型与实测为准。
      </p>
    </div>

    <!-- 温度-寿命对照表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Table class="w-5 h-5 mr-2 text-primary" /> 温度-寿命对照表（40~105℃）
        </h2>
        <button
          @click="copyTable"
          class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition flex items-center gap-1.5"
        >
          <Copy class="w-3.5 h-3.5" /> 复制表格
        </button>
      </div>
      <p class="text-xs text-muted-foreground mb-4">
        按当前 L0 = {{ fmt(l0, 0) }}h / T0 = {{ fmt(t0, 0) }}℃{{ rippleOn ? '，含当前纹波修正（r=' + fmt(rippleRatio, 2) + '，ΔT=' + fmt(deltaT, 1) + '℃）' : '' }}生成，每 5℃ 一行。分界感：表内任意一行向上移两行（−10℃）寿命翻倍，向下移两行（+10℃）寿命减半。
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-muted-foreground text-xs border-b border-border">
              <th class="text-left py-2 pr-4 font-medium">环境温度 T（℃）</th>
              <th class="text-right py-2 px-3 font-medium">代入温度（℃）</th>
              <th class="text-right py-2 px-3 font-medium">相对 L0</th>
              <th class="text-right py-2 px-3 font-medium">预期寿命（h）</th>
              <th class="text-right py-2 px-3 font-medium">万小时</th>
              <th class="text-right py-2 px-3 font-medium">年</th>
              <th class="text-left py-2 pl-4 font-medium">判定</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in capTableRows"
              :key="row.t"
              class="border-b border-border/50"
              :class="tAmb === row.t ? 'bg-primary/5' : ''"
            >
              <td class="py-2.5 pr-4 font-medium text-foreground">
                {{ row.t }}℃<span v-if="tAmb === row.t" class="text-primary text-xs ml-1">← 当前</span>
              </td>
              <td class="py-2.5 px-3 text-right text-muted-foreground">{{ fmt(row.tEff, 1) }}</td>
              <td class="py-2.5 px-3 text-right text-muted-foreground">×{{ fmt(row.ratio, 1) }}</td>
              <td class="py-2.5 px-3 text-right font-medium text-foreground">{{ fmtHours(row.hours) }}</td>
              <td class="py-2.5 px-3 text-right text-muted-foreground">{{ fmt(row.hours / 10000, 2) }}</td>
              <td class="py-2.5 px-3 text-right text-muted-foreground">{{ fmt(row.hours / 8760, 1) }}</td>
              <td class="py-2.5 pl-4">
                <span class="text-xs px-2 py-0.5 rounded" :class="tierOf(row.hours).style">{{ tierOf(row.hours).label }}</span>
              </td>
            </tr>
          </tbody>
        </table>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>电解电容寿命原理与维护</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <h3 class="text-lg font-semibold text-foreground">10℃ 法则的原理：Arrhenius 与电解液蒸发</h3>
          <p>
            铝电解电容的寿命由电解液通过封口橡胶垫的蒸发损耗速度决定，而蒸发是热激活过程，遵循 Arrhenius 定律——反应速率随温度指数变化。工程师把化学上「每升高 10K 反应速率约翻倍」的经验规律直接搬过来，就是 L = L0 × 2^((T0−T)/10)：额定温度 T0 下寿命 L0，温度每降 10℃ 寿命翻倍、每升 10℃ 减半。它不是厂商拍脑袋，而是对 Arrhenius 指数在 35~105℃ 区间的二阶近似，误差通常在 ±25% 内——对「能用几年」这种量级判断完全够用，对可靠性指标计算则需要厂商精确模型。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么电解电容总是最先坏</h3>
          <p>
            一块电源板上的半导体、电阻、瓷片电容几乎都是「半永久」器件，唯有铝电解电容自带一个内置化学电池式的消耗机制：电解液既是阴极又是散热介质，它一边工作一边通过橡胶密封垫缓慢挥发，容量随之缓慢下降、ESR 随之上升，到达规格书定义的寿命终点（容量 −20% 或 tanδ 超标）就判失效。加上它通常是板上体积最大、离发热源最近的元件，核心温度往往比室温高 10~20℃，双重因素叠加让它成为维修中「优先怀疑对象」——修显示器、电源、功放，第一眼先看电容。
          </p>
          <h3 class="text-lg font-semibold text-foreground">纹波电流与 ESR 发热：P = I² × ESR</h3>
          <p>
            流过电容 ESR 的纹波电流按 P = I² × ESR 持续发热，使核心温度高于环境温度。温升与电流近似平方关系（ΔT ≈ ΔT_rated × r²），所以纹波超额定 20%（r=1.2）温升就到 1.44 倍，寿命约减半；反过来降额到 r=0.7，温升只有一半，寿命约翻倍。这也是「低 ESR 电容更耐用」的底层原因：同样电流下发热更少、核心温度更低。选电源 replacement 电容时，额定纹波电流（100kHz/105℃ 口径）应不低于原件。
          </p>
          <h3 class="text-lg font-semibold text-foreground">85℃ 型 vs 105℃ 型</h3>
          <p>
            同等寿命指标（比如都是 2000h）下，105℃ 型在 45℃ 环境用 10℃ 法则能算出 128,000h，85℃ 型只有 32,000h——差 4 倍，这就是「105℃ 型优先」的原因。但注意两点：一是同容量同尺寸下 105℃ 型往往纹波电流能力更强、ESR 略高；二是 85℃ 型在低温大纹波场景并不必然更差，比较寿命要综合 L0、T0、纹波三个参数，而不是只看温度角标。工控、户外、车内环境一律 105℃ 型起步。
          </p>
          <h3 class="text-lg font-semibold text-foreground">电源 / 功放里鼓包电容的诊断与处理</h3>
          <p>
            鼓包、漏液是电容寿命终结的外部可见形态：电解液汽化使铝壳内压升高，顶部防爆阀（K 字或十字压痕）隆起甚至开裂。诊断顺序：目检鼓包 → 用电容表测容量（低于标称 80% 判失效）→ 用 ESR 表测 ESR（明显高于同容量正常值判失效）。处理原则：全部同批同位置的一起换（老化程度相近，换一只等于给其他「减负」却留下隐患）；同时检查同支路的整流/开关器件有无连带损伤；换后老练（低压预热）再满载。显示器「开机慢、画面抖动变好」、功放「嗡嗡交流声变大」，九成是滤波电解排的事。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">105℃ 2000 小时能用几年？</span>取决于实际温度：45℃ 环境约 128,000h ≈ 14.6 年；65℃ 约 32,000h ≈ 3.7 年；85℃ 约 8,000h ≈ 0.9 年。机内实测温度是唯一关键变量，用它代入本工具即可。</li>
            <li><span class="text-foreground font-medium">电容鼓包还能用吗？</span>不建议。鼓包说明电解液已汽化外泄，容量下降、ESR 升高且会继续恶化，轻则滤波变差出现纹波噪声，重则爆裂漏液腐蚀电路板。立即更换，并优先整批同位置更换。</li>
            <li><span class="text-foreground font-medium">纹波电流怎么看？</span>规格书「Ripple Current」栏（注意口径：常标 100kHz、105℃、20℃ 温升条件）；实际值需用串电阻采样或电流探头在满载下测。没有条件实测时，开关电源输出滤波按 r≈1.0~1.3、工频整流滤波按 r≈0.6~0.8 经验取值，再用本工具试算寿命区间。</li>
            <li><span class="text-foreground font-medium">估算 20 年是不是意味着真能用 20 年？</span>不一定。10℃ 法则只覆盖热老化这一种失效机制，实际寿命还受电压应力、反压、振动、干涸不均与整机开机率影响。估算结果适合做「相对比较」与「换件优先级排序」，绝对值请保守看待（打个对折再心里定价）。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'electrolytic-cap-life'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Hourglass, Calculator, Zap, Wrench, FlaskConical, AlertTriangle, Table, Copy, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '电解电容寿命估算器 - 10℃法则/纹波电流修正在线计算 | Util工具箱',
  description: '在线电解电容寿命估算器：按 10℃ 法则 L = L0 × 2^((T0−T)/10) 计算剩余寿命（小时/万小时/年），支持纹波电流温升修正与核心温度代入，附温度-寿命对照表与换件速查卡，维修换件判断参考，纯本地计算',
  keywords: '电解电容寿命, 电容寿命计算, 105℃ 2000小时, 电容寿命估算, 10℃法则, 纹波电流修正, 电容鼓包, esr发热, 电解电容选型, capacito life calculator',
  author: 'Util工具箱',
  ogTitle: '电解电容寿命估算器 - 10℃法则/纹波修正',
  ogDescription: '10℃ 法则寿命估算、纹波电流温升修正与温度-寿命对照表',
  ogUrl: 'https://www.util.cn/tools/electrolytic-cap-life',
  ogType: 'website',
  twitterCard: 'summary_large_image'
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
          name: '电解电容寿命估算器',
          url: 'https://www.util.cn/tools/electrolytic-cap-life',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['10℃ 法则寿命估算', '小时/万小时/年三口径输出', '纹波电流温升修正', '核心温度代入计算', '温度-寿命对照表生成', '维护判定三档提示']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '电解电容寿命估算器', item: 'https://www.util.cn/tools/electrolytic-cap-life' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '105℃ 2000 小时能用几年？',
              acceptedAnswer: { '@type': 'Answer', text: '取决于实际温度：45℃ 环境约 128,000h ≈ 14.6 年；65℃ 约 32,000h ≈ 3.7 年；85℃ 约 8,000h ≈ 0.9 年。机内实测温度代入 10℃ 法则即可估算。' }
            },
            {
              '@type': 'Question',
              name: '电容鼓包还能用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不建议。鼓包说明电解液已汽化外泄，容量下降、ESR 升高且继续恶化，轻则纹波噪声，重则爆裂漏液腐蚀电路板，应立即更换并优先整批同位置更换。' }
            },
            {
              '@type': 'Question',
              name: '纹波电流怎么看？',
              acceptedAnswer: { '@type': 'Answer', text: '规格书「Ripple Current」栏常标 100kHz / 105℃ / 20℃ 温升口径；实际值用电流探头或串阻采样满载实测。无法实测时，开关电源输出滤波按 r≈1.0~1.3、工频整流按 r≈0.6~0.8 取值试算。' }
            },
            {
              '@type': 'Question',
              name: '估算 20 年是不是真能用 20 年？',
              acceptedAnswer: { '@type': 'Answer', text: '不一定。10℃ 法则只覆盖热老化机制，实际寿命还受电压应力、振动、开机率等影响，估算结果适合相对比较与换件优先级排序，绝对值请保守看待。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'electrolytic-cap-life'
const STORE_KEY = TOOL_ID + ':inputs'
const tool = tools.find(t => t.id === TOOL_ID)

// ==== PURE-FNS-START（纯计算函数，供单测逐行校验）====
const CAP_L0_PRESETS = [1000, 2000, 4000, 5000, 8000, 10000]
const CAP_T0_OPTIONS = [85, 105, 125]
const CAP_DT_RATED_OPTIONS = [5, 10, 20]

// 10℃ 法则：L = L0 × 2^((T0−T)/10)
const capLifeHours = (l0, t0, t) => {
  if (!(l0 > 0) || !isFinite(l0) || !isFinite(t0) || !isFinite(t)) return NaN
  return l0 * Math.pow(2, (t0 - t) / 10)
}

// 纹波修正：实际温升 ΔT = ΔT_rated × r²，核心温度 = 环境温度 + ΔT
const capRippleDeltaT = (dtRated, r) => {
  if (!isFinite(dtRated) || !isFinite(r)) return NaN
  return dtRated * r * r
}
const capCoreTemp = (tAmb, dtRated, r) => {
  const dt = capRippleDeltaT(dtRated, r)
  if (!isFinite(tAmb) || !isFinite(dt)) return NaN
  return tAmb + dt
}

// 三档判定：<1 万 h 计划换件 / 1~5 万 h 观察使用 / >5 万 h 放心用
const capTier = (hours) => {
  if (!isFinite(hours) || hours < 10000) {
    return { key: 'replace', label: '计划换件', hint: '预期寿命不足 1 万小时，建议列入换件计划。', style: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' }
  }
  if (hours <= 50000) {
    return { key: 'watch', label: '观察使用', hint: '预期寿命 1~5 万小时，定期开壳目检鼓包与容量。', style: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400' }
  }
  return { key: 'ok', label: '放心用', hint: '预期寿命超过 5 万小时，正常巡检即可。', style: 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' }
}

// 温度-寿命对照表：环境温度 40~105℃ 每 5℃ 一行，含纹波修正后的代入温度
const buildCapTable = (l0, t0, rippleOn, dtRated, r) => {
  const rows = []
  for (let t = 40; t <= 105; t += 5) {
    const tEff = rippleOn ? capCoreTemp(t, dtRated, r) : t
    const ratio = Math.pow(2, (t0 - tEff) / 10)
    rows.push({ t, tEff, ratio, hours: capLifeHours(l0, t0, tEff) })
  }
  return rows
}
// ==== PURE-FNS-END ====

// ---------- 状态 ----------
const l0 = ref(2000)
const t0 = ref(105)
const tAmb = ref(45)
const rippleOn = ref(false)
const dtRated = ref(10)
const rippleRatio = ref(1.0)

const l0Presets = CAP_L0_PRESETS
const t0Options = CAP_T0_OPTIONS
const dtRatedOptions = CAP_DT_RATED_OPTIONS

// 交互记录与输入持久化（SSR 安全：localStorage 仅在客户端执行）
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_KEY) : null
    if (raw) {
      const s = JSON.parse(raw)
      const nums = { l0, t0, tAmb, dtRated, rippleRatio }
      for (const k of Object.keys(nums)) if (typeof s[k] === 'number') nums[k].value = s[k]
      if (typeof s.rippleOn === 'boolean') rippleOn.value = s.rippleOn
    }
  } catch (e) { /* 忽略恢复失败 */ }
})

const persist = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      l0: l0.value, t0: t0.value, tAmb: tAmb.value,
      rippleOn: rippleOn.value, dtRated: dtRated.value, rippleRatio: rippleRatio.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}
watch([l0, t0, tAmb, rippleOn, dtRated, rippleRatio], persist)

// ---------- 数字格式化（避免浮点尾差） ----------
const fmt = (v, digits = 2) => {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  return Number(v.toFixed(digits)).toLocaleString('zh-CN', { maximumFractionDigits: digits })
}
const fmtHours = (v) => {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  return Math.round(v).toLocaleString('zh-CN')
}

// ---------- 计算态 ----------
const tAmbWarn = computed(() => {
  const t = tAmb.value
  if (typeof t !== 'number' || !isFinite(t)) return '请输入有效温度数值。'
  if (t < -40 || t > 125) return '温度超出建议输入范围（−40~125℃），结果仅作数学外推参考。'
  return ''
})

const deltaT = computed(() => (rippleOn.value ? capRippleDeltaT(dtRated.value, rippleRatio.value) : 0))
const coreTemp = computed(() => {
  if (!rippleOn.value) return null
  const t = capCoreTemp(tAmb.value, dtRated.value, rippleRatio.value)
  return isFinite(t) ? t : null
})
const effTemp = computed(() => (rippleOn.value && isFinite(deltaT.value) ? tAmb.value + deltaT.value : tAmb.value))

const life = computed(() => {
  const l = l0.value
  if (typeof l !== 'number' || !(l > 0)) return null
  const h = capLifeHours(l, t0.value, effTemp.value)
  return isFinite(h) ? h : null
})

const lifeBasis = computed(() => (rippleOn.value ? `按核心温度 ${fmt(effTemp.value, 1)}℃` : `按工作温度 ${fmt(effTemp.value, 1)}℃`))

const tier = computed(() => capTier(life.value))

const rippleWarn = computed(() => rippleOn.value && typeof rippleRatio.value === 'number' && rippleRatio.value > 1.0)
const rippleGood = computed(() => rippleOn.value && typeof rippleRatio.value === 'number' && rippleRatio.value > 0 && rippleRatio.value <= 0.8)

const tierOf = (hours) => capTier(hours)

// ---------- 温度-寿命对照表（与单测共用同一生成函数） ----------
const capTableRows = computed(() => buildCapTable(l0.value, t0.value, rippleOn.value, dtRated.value, rippleRatio.value))

// ---------- 复制表格（clipboard + alert） ----------
const copyTable = async () => {
  try {
    const lines = ['环境温度(℃)\t代入温度(℃)\t相对L0\t寿命(h)\t年']
    for (const row of capTableRows.value) {
      lines.push(`${row.t}\t${row.tEff.toFixed(1)}\t×${row.ratio.toFixed(1)}\t${Math.round(row.hours)}\t${(row.hours / 8760).toFixed(1)}`)
    }
    await navigator.clipboard.writeText(lines.join('\n'))
    alert('已复制到剪贴板')
  } catch (e) {
    alert('复制失败，请手动选择表格内容复制')
  }
}

// ---------- 交互 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const loadExample = (kind) => {
  rippleOn.value = false
  if (kind === 'a') {
    l0.value = 2000; t0.value = 105; tAmb.value = 45
  } else if (kind === 'b') {
    l0.value = 2000; t0.value = 105; tAmb.value = 85
  } else if (kind === 'c') {
    l0.value = 1000; t0.value = 85; tAmb.value = 45
  } else if (kind === 'd') {
    rippleOn.value = true
    l0.value = 2000; t0.value = 105; tAmb.value = 40; dtRated.value = 10; rippleRatio.value = 1.2
  }
}
</script>
