<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <CircleDot class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电阻色环计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">四环 / 五环色环即选即读阻值与误差范围，输入 4k7、4.7k、4700 反查该有哪些颜色，SVG 色环图 + E24 标准值校验</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线电阻色环计算器：正着选颜色读阻值——每环一个下拉（附色块预览），实时给出标称阻值、±误差值与允许区间，自动换算成 470 Ω / 4.7 kΩ / 1 MΩ 这类易读单位；
        反过来输入阻值查颜色——解析 4k7 / 4.7k / 4700 等混写，优先给出标准 4 环方案并校验是否 E24 标准值，非标准值自动给 5 环精确或 4 环近似方案。
        色环方案以 SVG 绘制并可翻转读取方向对照实物，另附常用阻值色环速查表与「如何辨认第一环」三步法。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入控制区 -->
      <div class="space-y-4">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <!-- 双向模式切换 -->
          <div class="flex gap-2">
            <button
              @click="mode = 'forward'"
              :class="[
                'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition',
                mode === 'forward' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >
              选颜色读阻值
            </button>
            <button
              @click="mode = 'reverse'"
              :class="[
                'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5',
                mode === 'reverse' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >
              <ArrowLeftRight class="w-4 h-4" /> 输阻值查颜色
            </button>
          </div>

          <!-- 正向：逐环下拉 -->
          <template v-if="mode === 'forward'">
            <div class="flex gap-2">
              <button
                v-for="n in [4, 5]"
                :key="n"
                @click="setBandCount(n)"
                :class="[
                  'flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition border',
                  f.bandCount === n
                    ? 'bg-primary/10 border-primary text-primary font-semibold'
                    : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                ]"
              >
                {{ n }} 环电阻
              </button>
            </div>

            <div class="space-y-2.5">
              <div v-for="def in bandDefs" :key="def.key" class="flex items-center gap-2">
                <span class="w-24 flex-shrink-0 text-xs text-muted-foreground leading-tight">{{ def.label }}</span>
                <i class="w-5 h-5 flex-shrink-0 rounded-full inline-block border border-black/20" :style="{ backgroundColor: colorHex(f[def.key]) }"></i>
                <select
                  v-model="f[def.key]"
                  class="flex-1 min-w-0 px-2.5 py-1.5 rounded-md border border-border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option v-for="opt in def.options" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
                </select>
              </div>
            </div>

            <p
              v-if="forwardResult.ok === false"
              class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5 bg-red-500/10 text-red-600"
            >
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ forwardResult.error }}</span>
            </p>
            <p v-else class="text-xs text-muted-foreground leading-relaxed">
              提示：改任一下拉，右侧 SVG 色环图实时跟随；第一环不能是黑色（0 开头无意义），选错时上方会提示并转到反查。
            </p>
          </template>

          <!-- 反向：阻值输入 + 误差环选择 -->
          <template v-else>
            <div>
              <label class="block text-sm font-medium mb-2 text-foreground">目标阻值</label>
              <input
                v-model="rText"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                spellcheck="false"
                placeholder="支持 4k7 / 4.7k / 4700 / 4.7kΩ / 4M7 / 0R47"
                class="w-full px-3 py-2 rounded-md border border-border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
              <p class="text-[10px] font-mono mt-1 leading-tight" :class="reverseParsed.error && reverseParsed.error !== '待输入' ? 'text-red-500' : 'text-muted-foreground'">
                {{ reverseParsed.ohms === null
                  ? (reverseParsed.error === '待输入' ? '输入一个阻值即可出色环方案' : reverseParsed.error)
                  : `解析为 ${formatResistanceOf(reverseParsed.ohms)}` }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2 text-foreground">误差环（最后一环）</label>
              <div class="flex items-center gap-2">
                <i class="w-5 h-5 flex-shrink-0 rounded-full inline-block border border-black/20" :style="{ backgroundColor: colorHex(rTol) }"></i>
                <select
                  v-model="rTol"
                  class="flex-1 min-w-0 px-2.5 py-1.5 rounded-md border border-border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option v-for="opt in rTolOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
                </select>
              </div>
              <p class="text-xs text-muted-foreground mt-1">金 ±5% 对应普通碳膜 / E24 金属膜，棕 ±1% 对应五环精密电阻。</p>
            </div>

            <p v-if="reverseResult && reverseResult.error" class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5 bg-red-500/10 text-red-600">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ reverseResult.error }}</span>
            </p>
          </template>

          <button
            @click="resetAll"
            class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置为 1 kΩ（棕黑红金）
          </button>
        </div>

        <!-- 预设案例 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Play class="w-5 h-5 mr-2 text-primary" /> 手算验证预设
          </h2>
          <div class="space-y-2">
            <button
              v-for="p in presetDefs"
              :key="p.id"
              @click="applyPreset(p)"
              :class="[
                'w-full text-left px-3 py-2.5 rounded-lg border text-sm transition',
                activePresetId === p.id ? 'border-primary bg-primary/5' : 'border-border bg-muted/40 hover:bg-muted'
              ]"
            >
              <span class="flex items-center gap-1 flex-wrap">
                <i v-for="(id, bi) in p.ids" :key="bi" class="w-3.5 h-3.5 rounded-sm inline-block border border-black/20" :style="{ backgroundColor: colorHex(id) }"></i>
                <span class="text-xs text-muted-foreground ml-1">{{ namesOf(p.ids) }}</span>
              </span>
              <span class="block text-xs mt-1 font-mono text-foreground">{{ p.summary }}</span>
            </button>
          </div>
          <p v-if="activePresetNote" class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{{ activePresetNote }}</span>
          </p>
        </div>
      </div>

      <!-- 右侧：可视化 + 结果（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- SVG 色环图 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <h2 class="text-lg font-semibold flex items-center">
              <CircleDot class="w-5 h-5 mr-2 text-primary" /> 色环示意图
            </h2>
            <div class="flex items-center gap-2">
              <button
                @click="toggleDirection"
                class="px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-xs text-muted-foreground transition flex items-center gap-1.5"
              >
                <ArrowLeftRight class="w-3.5 h-3.5" /> 翻转为{{ direction === 'ltr' ? '自右向左' : '自左向右' }}
              </button>
              <button
                v-if="svgOk"
                @click="copyScheme"
                class="px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-xs text-muted-foreground transition flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> {{ copyState }}
              </button>
            </div>
          </div>

          <div v-if="svgOk" v-html="currentSvg"></div>
          <p v-else class="text-sm text-muted-foreground py-10 text-center bg-muted/30 rounded-lg border border-dashed border-border">
            {{ svgErrorText }}
          </p>

          <div class="flex items-center justify-between gap-2 flex-wrap">
            <p class="text-sm font-mono text-muted-foreground">{{ svgCaption }}</p>
            <p v-if="currentSchemeText" class="text-sm font-mono text-foreground">{{ currentSchemeText }}</p>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed">
            屏幕色值为便于辨认的近似印刷色（如棕 #8B4513 这一级），与实物色漆存在色差，以色名与数字为准；金 / 银环按惯例以金属色绘制。
          </p>
        </div>

        <!-- 计算结果 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <template v-if="mode === 'forward'">
            <h2 class="text-lg font-semibold flex items-center">
              <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 读数结果
            </h2>
            <template v-if="forwardResult.ok">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">{{ forwardResult.bandCount }} 环标称阻值</p>
                <p class="text-3xl font-bold text-primary font-mono">{{ forwardResult.formatted }}</p>
                <p class="text-xs text-muted-foreground mt-1 font-mono">{{ forwardResult.sigText }}</p>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div v-for="item in forwardStats" :key="item.label" class="bg-muted/40 border border-border rounded-lg p-3">
                  <p class="text-[10px] text-muted-foreground mb-1">{{ item.label }}</p>
                  <p class="text-sm font-bold font-mono" :class="item.tone">{{ item.value }}</p>
                </div>
              </div>
              <p
                class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5"
                :class="forwardResult.e24 ? 'bg-green-500/10 text-green-600' : 'bg-muted/60 text-foreground'"
              >
                <component :is="forwardResult.e24 ? CheckCircle : Info" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{{ forwardResult.e24 ? `${forwardResult.formatted} 是 E24 标准系列值，市面上随手可得。` : `${forwardResult.formatted} 不在 E24（±5%）系列中——多为 5 环精密电阻（E96）或非标准定制值。` }}</span>
              </p>
            </template>
            <p v-else class="text-sm text-muted-foreground leading-relaxed">
              把左侧色环选完整即可实时读数。四环 = 数字 数字 ×倍率 ±误差；五环 = 数字 数字 数字 ×倍率 ±误差。
            </p>
          </template>

          <template v-else>
            <h2 class="text-lg font-semibold flex items-center">
              <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 反查方案
            </h2>
            <template v-if="reverseResult && reverseResult.ok">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">{{ reverseResult.bandCount }} 环方案</p>
                <p class="text-3xl font-bold text-primary font-mono">
                  {{ reverseResult.exact ? '' : '≈ ' }}{{ formatResistanceOf(reverseResult.repr) }}
                </p>
                <p class="text-xs text-muted-foreground mt-1 font-mono">
                  {{ reverseResult.sigText }} · {{ namesOf(reverseResult.bandIds) }}
                </p>
              </div>
              <p
                class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5"
                :class="reverseBadge.tone"
              >
                <component :is="reverseBadge.icon" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{{ reverseBadge.text }}</span>
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div v-for="item in reverseStats" :key="item.label" class="bg-muted/40 border border-border rounded-lg p-3">
                  <p class="text-[10px] text-muted-foreground mb-1">{{ item.label }}</p>
                  <p class="text-sm font-bold font-mono" :class="item.tone">{{ item.value }}</p>
                </div>
              </div>
            </template>
            <p v-else class="text-sm text-muted-foreground leading-relaxed">
              在左侧输入阻值（如 <span class="font-mono">4k7</span>、<span class="font-mono">4.7k</span>、<span class="font-mono">4700</span>），这里会给出最优色环方案与 E24 校验。
            </p>
          </template>
        </div>

        <!-- 常用阻值速查表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 常用电阻色环速查（四环 ±5%）
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              v-for="row in quickRows"
              :key="row.value"
              @click="applyQuickRow(row)"
              class="text-left px-3 py-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted transition space-y-1.5"
              title="点击载入到正读模式"
            >
              <p class="text-sm font-bold font-mono text-foreground">{{ row.valueText }}</p>
              <div class="flex items-center gap-1">
                <i v-for="(id, bi) in row.bandIds" :key="bi" class="w-3.5 h-3.5 rounded-full inline-block border border-black/20" :style="{ backgroundColor: colorHex(id) }"></i>
              </div>
              <p class="text-[10px] text-muted-foreground font-mono">{{ row.namesText }}</p>
            </button>
          </div>
          <p class="text-xs text-muted-foreground">点击任意卡片，把该色环组合载入左侧「选颜色读阻值」模式核对。</p>
        </div>

        <!-- 如何辨认第一环 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <CircleDot class="w-5 h-5 mr-2 text-primary" /> 如何辨认第一环（三步法）
          </h2>
          <ol class="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              <span class="font-medium text-foreground">先找误差环：</span>金、银色几乎只会出现在误差环（±5% / ±10%），且它与前一片色环的间距明显更大——找到靠边、孤立的金银环，从另一端开始读。
            </li>
            <li>
              <span class="font-medium text-foreground">看间距分组：</span>有效数字环与倍率环间距均匀地挤在一侧，误差环独自分居另一侧；两端都没有金银环时，读两端间距，密的一端是第一位。
            </li>
            <li>
              <span class="font-medium text-foreground">用数值合理性反验：</span>第一环永远不会是黑色（0 开头无意义），也不存在 0 Ω 色环电阻；两个方向各读一遍，落在 0.1 Ω ~ 10 MΩ 常见范围内的才是正确读法，或直接用本页反查模式核对。
            </li>
          </ol>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>电阻色环计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          电阻色环计算器是一款面向电子爱好者、学生与维修师傅的在线色环读数工具。插件电阻（碳膜 / 金属膜）体积太小印不下数字，
          业界用一圈圈色环来表示阻值与误差：本工具把这套约定做成双向查询——正着选颜色立即得到标称阻值、±误差值与允许区间（如「黄紫红金 = 4.7 kΩ ±5%，范围 4.465 kΩ ~ 4.935 kΩ」），
          反着输入 4k7、4.7k、4700 等任意写法，工具会优先给出标准 4 环方案、校验它是否 E24 标准值，非标准值则给出 5 环精确方案或 4 环近似方案，并用 SVG 把电阻本体和色环画出来。
          全部逻辑在浏览器本地计算，不联网、不上传、不写入任何本地存储。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">四环 / 五环电阻怎么读（逐环讲解）</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li><span class="font-medium text-foreground">四环电阻（普通 ±5%）：</span>第一环、第二环是有效数字，第三环是倍率（10 的几次方，金 = ×0.1、银 = ×0.01），第四环是误差。例：黄紫红金 = 4、7、×100、±5% → 4.7 kΩ ±5%。</li>
          <li><span class="font-medium text-foreground">五环电阻（精密 ±1% / ±2%）：</span>前三环都是有效数字，第四环倍率，第五环误差。例：棕黑黑红棕 = 1、0、0、×100、±1% → 10 kΩ ±1%。</li>
          <li><span class="font-medium text-foreground">数字 → 颜色口诀：</span>黑 0 棕 1 红 2 橙 3 黄 4 绿 5 蓝 6 紫 7 灰 8 白 9（「黑棕红橙黄绿蓝紫灰白」）。</li>
          <li><span class="font-medium text-foreground">读取方向：</span>从靠电阻端头、且彼此间距密的那组环开始读，独自靠边、间距大的最后一环是误差环。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么第一环没有黑色？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          黑色代表数字 0。若第一环是黑色，有效数字以 0 开头（如 0、7、×100 = 0700），前面这个 0 不携带任何信息，等价于少一位数的色环，
          而标准色环体系不存在「三位当两位用」的编码；现实中也不存在标称 0 Ω 的色环电阻（0 Ω 跳线通常以单条黑环或印字表示，不占完整编码位）。
          因此第一环从棕色（1）起步——但黑色在其它位置完全合法：100 Ω 的标准四环读法「棕黑红金」里，黑是第二位数字；10 Ω 的「棕黑黑金」里，第三环黑色是 ×1 倍率。
          本工具在正向模式里选到第一环黑色会明确提示，避免读出一串不存在的阻值。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">金和银在倍率环与误差环的不同身份</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          同一个金色环或银色环，出现在不同位置含义完全不同：<span class="font-medium text-foreground">当倍率环（倒数第二位）</span>时，金 = ×0.1、银 = ×0.01，
          用来表示小数阻值，例如棕黑金金 = 10 × 0.1 = 1 Ω、红紫金银可表示 27 × 1 = 27 Ω 里的银只是误差；<span class="font-medium text-foreground">当误差环（最后一位）</span>时，
          金 = ±5%、银 = ±10%，碳膜电阻几乎都挂金环误差。判别方法就是位置 + 间距：误差环总独自靠边且间距大；若金 / 银环紧跟在数字环群组后面、另一侧还有更靠边的环，那它是倍率。
          所以「两端各有一枚金银环」的画法（棕黑金金 = 1 Ω）里，只有最右那枚是误差。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">E24 标准电阻系列是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          电阻不可能做成任意阻值，厂家按等比数列在每个十进制量级里生产固定档位——这就是 E 系列。
          <span class="font-medium text-foreground">E24</span> 每十倍频 24 档：1.0、1.1、1.2、1.3、1.5、1.6、1.8、2.0、2.2、2.4、2.7、3.0、3.3、3.6、3.9、4.3、4.7、5.1、5.6、6.2、6.8、7.5、8.2、9.1，
          相邻档位相差约 10%，恰好覆盖 ±5%（金环）误差档，所以普通四环电阻的两位有效数字必然是这 24 组之一（本工具的反查模式会直接帮你校验）。
          更精密的 ±1% / ±2% 五环电阻走 <span class="font-medium text-foreground">E96</span>（每十倍频 96 档，三位有效数字）；
          遇到 4.75 kΩ 这类 E96 值，四环画不出来，就要用 5 环方案「黄紫绿棕 + 棕误差环 = 4、7、5、×10、±1%」精确表达，这也是反查模式里非 E24 值的默认输出。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">色环看不清 / 烧黑了，怎么用手机查？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          旧板子上的电阻常被助焊剂熏黑、被高温烤到色环褪色，肉眼辨色完全不可靠。流程是：先用万用表（电阻档）量出实际阻值，
          再打开本页「输阻值查颜色」模式，把读数写成 4k7、4.7k、4700、0R47 任意一种熟悉的格式输入，工具即给出标准色环组合与 E24 校验结论，
          照方案采购或补画标记即可。注意万用表在路测量会受并联支路影响（读数偏小），关键位置请拆下一脚再量；
          反查得到的「近似」方案（偏差已标注）只适合应急替换，信号采样、基准分压等精密场合请按原理图原值更换。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">四环电阻的色环怎么读成阻值？</h3>
            <p class="text-sm text-muted-foreground mt-1">从靠近端头、间距密的一侧起读：第一、二环是有效数字，第三环是倍率（颜色对应 10 的几次方，金 ×0.1、银 ×0.01），第四环是误差。例如黄紫红金 = 4、7、×100、±5%，即 4.7 kΩ，允许范围 4.465 kΩ ~ 4.935 kΩ。五环只是多一位有效数字。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么第一环不可能是黑色？</h3>
            <p class="text-sm text-muted-foreground mt-1">黑色代表 0，以 0 开头的有效数字不携带信息（0700 等价于 700），标准色环体系没有这种编码，也不存在标称 0 Ω 的完整色环电阻。但黑色可以出现在第二位（棕黑红金 = 100 Ω）或作为 ×1 倍率（棕黑黑金 = 10 Ω）。选错时本页会直接提示。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">金色、银色环到底是倍率还是误差？</h3>
            <p class="text-sm text-muted-foreground mt-1">看位置与间距：独自靠边、与前环间距明显更大的是误差环（金 ±5%、银 ±10%）；紧跟数字环群组之后的那枚是倍率环（金 ×0.1、银 ×0.01），用于小于 10 Ω 的阻值，如棕黑金金 = 1 Ω。分不清时把两端读数都算一遍，落在 0.1 Ω ~ 10 MΩ 合理范围的为正确读法。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">色环烧糊看不清了怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">用万用表量出实际阻值（在路测量可能偏小，关键位置拆一脚再量），然后切到「输阻值查颜色」模式，输入 4k7 / 4.7k / 4700 任意写法，即可得到标准色环组合与 E24 是否标准值的结论，按方案补画色环标记或照单采购。应急替换非标准值时注意工具标注的偏差。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'resistor-color-code'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  CircleDot, ArrowLeftRight, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '电阻色环计算器 - 四环五环色环电阻读数与阻值反查工具',
  description: '免费在线电阻色环计算器，逐环选色实时读出四环/五环电阻的标称阻值、±误差值与允许区间，支持输入 4k7、4.7k、4700 反查色环组合并校验 E24 标准值，SVG 色环可视化，附常用阻值色环速查表与辨认第一环三步法，纯浏览器本地计算不上传',
  keywords: '电阻色环计算器,色环电阻读数,四环五环电阻,电阻读数器,色环对照表',
  author: '有条工具',
  ogTitle: '电阻色环计算器 - 四环五环色环电阻读数与阻值反查工具 | 有条工具',
  ogDescription: '选颜色读阻值、输阻值查颜色双向计算，SVG 色环图 + E24 标准值校验 + 误差区间，纯本地运行。',
  ogUrl: 'https://www.util.cn/tools/resistor-color-code',
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
          name: '电阻色环计算器',
          url: 'https://www.util.cn/tools/resistor-color-code',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '四环 / 五环色环即选即读阻值',
            '误差 ± 值与允许区间自动换算',
            '输入 4k7 / 4.7k / 4700 反查色环方案',
            'E24 标准值校验与非标准值近似方案',
            'SVG 色环可视化并可翻转读取方向',
            '常用阻值色环速查表',
            '辨认第一环三步法图解',
            '本地计算不上传数据'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '电阻色环计算器', item: 'https://www.util.cn/tools/resistor-color-code/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '四环电阻的色环怎么读成阻值？',
              acceptedAnswer: { '@type': 'Answer', text: '从靠近端头、间距密的一侧起读：第一、二环是有效数字，第三环是倍率（颜色对应10的几次方，金×0.1、银×0.01），第四环是误差。例如黄紫红金=4、7、×100、±5%，即4.7kΩ，允许范围4.465kΩ~4.935kΩ。五环只是多一位有效数字。' }
            },
            {
              '@type': 'Question',
              name: '为什么第一环不可能是黑色？',
              acceptedAnswer: { '@type': 'Answer', text: '黑色代表0，以0开头的有效数字不携带信息（0700等价于700），标准色环体系没有这种编码，也不存在标称0Ω的完整色环电阻。但黑色可以出现在第二位（棕黑红金=100Ω）或作为×1倍率（棕黑黑金=10Ω）。' }
            },
            {
              '@type': 'Question',
              name: '金色、银色环到底是倍率还是误差？',
              acceptedAnswer: { '@type': 'Answer', text: '看位置与间距：独自靠边、与前环间距明显更大的是误差环（金±5%、银±10%）；紧跟数字环群组之后的那枚是倍率环（金×0.1、银×0.01），用于小于10Ω的阻值，如棕黑金金=1Ω。' }
            },
            {
              '@type': 'Question',
              name: '色环烧糊看不清了怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '用万用表量出实际阻值（在路测量可能偏小，关键位置拆一脚再量），然后切换到本工具的「输阻值查颜色」模式，输入4k7、4.7k、4700任意写法，即可得到标准色环组合与E24是否标准值的结论，按方案补画色环或照单采购。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 色环颜色总表：黑 0 / 棕 1 / 红 2 / 橙 3 / 黄 4 / 绿 5 / 蓝 6 / 紫 7 / 灰 8 / 白 9。
// hex 为屏幕辨识用的近似印刷色（棕色取 #8B4513 这一级），与实物色漆存在色差，仅作辨认参考；
// 一切计算以 code / factor / percent 数字字段为准。
const COLOR_BANDS = {
  black:  { name: '黑', code: 0, hex: '#1F1F1F' },
  brown:  { name: '棕', code: 1, hex: '#8B4513' },
  red:    { name: '红', code: 2, hex: '#C0392B' },
  orange: { name: '橙', code: 3, hex: '#E67E22' },
  yellow: { name: '黄', code: 4, hex: '#F1C40F' },
  green:  { name: '绿', code: 5, hex: '#1E8449' },
  blue:   { name: '蓝', code: 6, hex: '#2471A3' },
  purple: { name: '紫', code: 7, hex: '#7D3C98' },
  gray:   { name: '灰', code: 8, hex: '#7F8C8D' },
  white:  { name: '白', code: 9, hex: '#F2F3F4' },
  gold:   { name: '金', code: null, hex: '#C9A227', factor: 0.1, percent: 5 },
  silver: { name: '银', code: null, hex: '#A7AEB3', factor: 0.01, percent: 10 },
  none:   { name: '无色', code: null, hex: null, percent: 20 }
}
const DIGIT_IDS = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray', 'white']
const MULT_EXTRA_IDS = ['gold', 'silver']
const TOL_IDS = ['brown', 'red', 'gold', 'silver', 'none']

// E24 两位有效数字尾数集（±5% 系列，对应 100~910 共 24 档）
const E24_SIGS = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91]

// 首位黑提示文案（正向模式校验；单测断言用）
const FIRST_BLACK_HINT = '首位无黑，选错了？点反向查找：黑（0）不能做第一环，0 开头不携带任何信息，标准色环不存在这种编码'

function roundSig(x, precision) {
  const n = Number(x)
  if (!Number.isFinite(n)) return n
  return Number(n.toPrecision(precision || 12))
}

function colorById(id) {
  return COLOR_BANDS[id] || null
}

function colorName(id) {
  return (COLOR_BANDS[id] || {}).name || String(id)
}

// 倍率指数：数字色 = 其 code；金 = -1（×0.1）；银 = -2（×0.01）
function multExpOf(id) {
  const c = COLOR_BANDS[id]
  if (!c) return null
  if (c.code !== null && c.code !== undefined) return c.code
  if (id === 'gold') return -1
  if (id === 'silver') return -2
  return null
}

// 倍率因子 = 10^指数
function multiplierFactorOf(id) {
  const exp = multExpOf(id)
  return exp === null ? null : Math.pow(10, exp)
}

// 误差百分比：棕 ±1 / 红 ±2 / 金 ±5 / 银 ±10 / 无色 ±20
function tolerancePercentOf(id) {
  const c = COLOR_BANDS[id]
  if (!c) return null
  if (id === 'brown') return 1
  if (id === 'red') return 2
  return typeof c.percent === 'number' ? c.percent : null
}

// 指数 → 倍率环 id
function multIdForExponent(exp) {
  if (exp === -1) return 'gold'
  if (exp === -2) return 'silver'
  if (exp >= 0 && exp <= 9) return DIGIT_IDS[exp]
  return null
}

// 倍率显示文本：-2 ×0.01 / -1 ×0.1 / 0 ×1 / 2 ×100 / 3 ×1 k / 9 ×1 G
function fmtMultText(exponent) {
  const e = Number(exponent)
  if (!Number.isFinite(e)) return '×?'
  if (e === -1) return '×0.1'
  if (e === -2) return '×0.01'
  if (e < -2 || e > 11) return `×1e${e}`
  const f = Math.pow(10, e)
  if (f >= 1e9) return `×${roundSig(f / 1e9, 4)} G`
  if (f >= 1e6) return `×${roundSig(f / 1e6, 4)} M`
  if (f >= 1e3) return `×${roundSig(f / 1e3, 4)} k`
  return `×${roundSig(f, 4)}`
}

// 阻值（Ω）→ 自动选档文本：1000 → "1 kΩ"；820 → "820 Ω"；1e6 → "1 MΩ"；4700 → "4.7 kΩ"
function formatResistanceOf(ohms) {
  const n = Number(ohms)
  if (!Number.isFinite(n)) return '—'
  if (n === 0) return '0 Ω'
  const abs = Math.abs(n)
  let prefix = ''
  let scale = 1
  if (abs >= 1e6) { prefix = 'M'; scale = 1e6 } else if (abs >= 1e3) { prefix = 'k'; scale = 1e3 }
  return `${roundSig(n / scale, 6)} ${prefix}Ω`
}

// 是否 E24 标准值（可被两位有效数字精确编码且在 24 档集合内）
function isE24ValueOf(ohms) {
  const n = Number(ohms)
  if (!Number.isFinite(n) || n <= 0) return false
  let e0 = Math.floor(Math.log10(n) + 1e-9)
  let m = roundSig(n / Math.pow(10, e0), 10)
  if (m >= 10) { e0 += 1; m = roundSig(m / 10, 10) }
  const sig = roundSig(m * 10, 10)
  return Number.isInteger(sig) && sig >= 10 && sig < 100 && E24_SIGS.indexOf(sig) !== -1
}

// 正向核心求解：色环 id 数组 [数字×2|3, 倍率, 误差] → 阻值 / 误差 / 区间
function solveFromBandsOf(bandIds) {
  const ids = (bandIds || []).filter((id) => !!id)
  const sigCount = ids.length - 2
  if (sigCount < 2 || sigCount > 3) return { ok: false, error: '色环数量应为 4 或 5 环' }
  for (let i = 0; i < sigCount; i++) {
    const c = colorById(ids[i])
    if (!c || c.code === null || c.code === undefined) return { ok: false, error: `第 ${i + 1} 环应是数字色（黑 ~ 白）` }
  }
  if (colorById(ids[0]).code === 0) return { ok: false, error: FIRST_BLACK_HINT }
  const multExp = multExpOf(ids[sigCount])
  if (multExp === null) return { ok: false, error: '倍率环颜色无效' }
  const tolPercent = tolerancePercentOf(ids[ids.length - 1])
  if (tolPercent === null) return { ok: false, error: '误差环颜色无效（可选 棕 / 红 / 金 / 银 / 无色）' }

  let digitsValue = 0
  for (let i = 0; i < sigCount; i++) digitsValue = digitsValue * 10 + colorById(ids[i]).code
  const ohms = roundSig(digitsValue * Math.pow(10, multExp), 10)
  if (!Number.isFinite(ohms) || ohms <= 0) return { ok: false, error: '阻值超出可表示范围' }
  const tolValue = roundSig((ohms * tolPercent) / 100, 6)
  const digitsText = ids.slice(0, sigCount).map((id) => colorById(id).code).join(' ')

  return {
    ok: true,
    bandCount: ids.length,
    bandIds: ids,
    digits: digitsText,
    multId: ids[sigCount],
    tolId: ids[ids.length - 1],
    tolPercent,
    sigText: `${digitsText} ${fmtMultText(multExp)}`,
    ohms,
    formatted: formatResistanceOf(ohms),
    tolValue,
    min: roundSig(ohms - tolValue, 8),
    max: roundSig(ohms + tolValue, 8),
    e24: isE24ValueOf(ohms)
  }
}

// 反向输入解析：4k7 / 4.7k / 4700 / 4.7kΩ / 4M7 / 0R47 / 2R2 → { ohms, error }
// 电阻解析口径与站内欧姆定律计算器一致（k/M/µ/m 前缀 + 电子惯用中缀写法）
function parseResistanceInputOf(input) {
  const raw = String(input === null || input === undefined ? '' : input).trim().replace(/\s+/g, '')
  if (!raw) return { ohms: null, error: '待输入' }

  // 电子惯用中缀：4k7 → 4.7k、0R47 → 0.47、4M7 → 4.7M、2R2 → 2.2
  const mid = raw.match(/^(\d*)([kKmMuµRr])(\d+)$/)
  if (mid) {
    const whole = mid[1] === '' ? 0 : Number(mid[1])
    const letter = mid[2]
    let factor = 1
    if (letter === 'k') factor = 1e3
    else if (letter === 'K') factor = 1e3
    else if (letter === 'M') factor = 1e6
    else if (letter === 'm') factor = 1e-3
    else if (letter === 'u' || letter === 'µ') factor = 1e-6
    const value = Number(`${whole}.${mid[3]}`) * (letter === 'R' || letter === 'r' ? 1 : factor)
    if (!Number.isFinite(value) || value <= 0) return { ohms: null, error: '阻值需大于 0（0 Ω 跳线通常只画一条黑环）' }
    return { ohms: roundSig(value, 10), error: null }
  }

  const matched = raw.match(/^(\d+\.?\d*|\.\d+)([kKmMuµ]?)(?:Ω|ω|欧|[rR]|ohm)?$/)
  if (!matched) return { ohms: null, error: `无法识别「${raw}」，试试 4k7 / 4.7k / 4700` }
  const num = Number(matched[1])
  if (!Number.isFinite(num)) return { ohms: null, error: '数值超出可处理范围' }
  let value = num
  const prefix = matched[2]
  if (prefix === 'k' || prefix === 'K') value = num * 1e3
  else if (prefix === 'M') value = num * 1e6
  else if (prefix === 'm') value = num * 1e-3
  else if (prefix === 'u' || prefix === 'µ') value = num * 1e-6
  if (value <= 0) return { ohms: null, error: '阻值需大于 0（0 Ω 跳线通常只画一条黑环）' }
  return { ohms: roundSig(value, 10), error: null }
}

// 就近两位有效数字：取 |sig×10^(e0-1) − n| 更小的一档，平局取较小档（保证 4.75k → 4 7 ×100 而非 4 8）
function nearestSig2Of(m, e0, n) {
  const base = Math.pow(10, e0 - 1)
  const lo = Math.max(10, Math.floor(m * 10))
  const hi = lo + 1
  const devLo = Math.abs(lo * base - n)
  const devHi = Math.abs(hi * base - n)
  let sig = devHi < devLo ? hi : lo
  let exp = e0 - 1
  if (sig >= 100) { sig = 10; exp = e0 }
  return { sig, exp }
}

// 反向核心求解：阻值 + 误差环 id → 最优色环方案（优先标准 4 环；三位有效走 5 环；更细走 4 环近似）
function reverseSolveOf(ohms, tolId) {
  const n = Number(ohms)
  if (!Number.isFinite(n) || n <= 0) return { ok: false, error: '阻值需大于 0，请输入如 4k7 / 4.7k / 4700' }
  const tol = tolerancePercentOf(tolId)
  if (tol === null) return { ok: false, error: '误差环颜色无效' }

  let e0 = Math.floor(Math.log10(n) + 1e-9)
  let m = roundSig(n / Math.pow(10, e0), 12)
  if (m >= 10) { e0 += 1; m = roundSig(m / 10, 12) }

  const sig2 = roundSig(m * 10, 10)
  const sig3 = roundSig(m * 100, 12)
  let digitCodes
  let multExp
  let exact
  let alt = null

  if (Number.isInteger(sig2) && sig2 >= 10 && sig2 < 100) {
    // 两位有效数字：标准 4 环方案
    digitCodes = [Math.floor(sig2 / 10), sig2 % 10]
    multExp = e0 - 1
    exact = true
  } else if (Number.isInteger(sig3) && sig3 >= 100 && sig3 < 1000) {
    // 三位有效数字：5 环精确方案，另附 4 环就近近似
    digitCodes = [Math.floor(sig3 / 100), Math.floor(sig3 / 10) % 10, sig3 % 10]
    multExp = e0 - 2
    exact = true
    const near = nearestSig2Of(m, e0, n)
    const altSig2 = near.sig
    const altExp = near.exp
    const altMultId = multIdForExponent(altExp)
    if (altMultId) {
      const altRepr = roundSig(altSig2 * Math.pow(10, altExp), 10)
      alt = {
        bandIds: [DIGIT_IDS[Math.floor(altSig2 / 10)], DIGIT_IDS[altSig2 % 10], altMultId, tolId],
        sigText: `${Math.floor(altSig2 / 10)} ${altSig2 % 10} ${fmtMultText(altExp)}`,
        repr: altRepr,
        deviation: roundSig(((altRepr - n) / n) * 100, 4)
      }
    }
  } else {
    // 无法精确编码：4 环就近到两位有效数字
    const near = nearestSig2Of(m, e0, n)
    digitCodes = [Math.floor(near.sig / 10), near.sig % 10]
    multExp = near.exp
    exact = false
  }

  const multId = multIdForExponent(multExp)
  if (!multId) return { ok: false, error: '该阻值超出色环倍率可表示范围（约 0.01 Ω ~ 1 GΩ 以上量级请分段核对）' }

  const digitIds = digitCodes.map((c) => DIGIT_IDS[c])
  const bandIds = [...digitIds, multId, tolId]
  const repr = roundSig(Number(digitCodes.join('')) * Math.pow(10, multExp), 10)
  const e24 = exact && E24_SIGS.indexOf(Number(digitCodes.join(''))) !== -1

  return {
    ok: true,
    target: n,
    bandCount: bandIds.length,
    bandIds,
    digitIds,
    multId,
    tolId,
    tolPercent: tol,
    exact,
    e24,
    repr,
    deviation: roundSig(((repr - n) / n) * 100, 4),
    sigText: `${digitCodes.join(' ')} ${fmtMultText(multExp)}`,
    alt
  }
}

// 转义 XML 文本 / 属性（bandsToSvg 对外来字符串的安全底线）
function escapeXmlText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// SVG 绘制：色环 id 数组 [数字×N, 倍率, 误差] → 电阻本体 + 色带图形字符串（零第三方依赖）。
// 4/5 环标准间距：数字环与倍率环等距成组，误差环独自靠边且间距加大；
// direction：'ltr' 色序自左向右（误差环靠右）/ 'rtl' 镜像（误差环靠左）。
function bandsToSvg(bandIds, options) {
  const opts = options || {}
  const direction = opts.direction === 'ltr' ? 'ltr' : 'rtl'
  const ids = (bandIds || []).filter((id) => !!colorById(id))
  const sigCount = ids.length - 2
  const W = 324
  const H = 96
  const bodyX = 60
  const bodyW = 204
  const bodyX2 = bodyX + bodyW
  const bodyY = 28
  const bodyH = 40
  const bandW = 12
  const leadY = bodyY + bodyH / 2
  const step = 31

  const parts = []
  parts.push(`<svg viewBox="0 0 ${W} ${H}" class="w-full max-w-[420px] mx-auto" role="img" aria-label="${escapeXmlText(opts.ariaLabel || '电阻色环示意图')}">`)
  parts.push(`<line x1="0" y1="${leadY}" x2="${bodyX}" y2="${leadY}" stroke="#9AA3AF" stroke-width="5" stroke-linecap="round" />`)
  parts.push(`<line x1="${bodyX2}" y1="${leadY}" x2="${W}" y2="${leadY}" stroke="#9AA3AF" stroke-width="5" stroke-linecap="round" />`)
  parts.push(`<rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="16" fill="#EFE3C8" stroke="#C8B98F" stroke-width="1.5" />`)

  let tolX = null
  let multX = null
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    const c = colorById(id)
    const role = i < sigCount ? 'digit' : i === sigCount ? 'mult' : 'tol'
    let x
    if (role === 'tol') {
      x = direction === 'rtl' ? bodyX + 16 : bodyX2 - 16 - bandW
      tolX = x
    } else {
      const offset = 18 + i * step
      x = direction === 'rtl' ? bodyX2 - offset - bandW : bodyX + offset
      if (role === 'mult') multX = x
    }
    const label = `${c.name} · ${role === 'digit' ? '数字' : role === 'mult' ? '倍率' : '误差'}`
    if (id === 'none') {
      parts.push(`<rect x="${x}" y="${bodyY + 2}" width="${bandW}" height="${bodyH - 4}" rx="2" fill="none" stroke="#B9AB89" stroke-width="1" stroke-dasharray="3 3"><title>${escapeXmlText(label)}</title></rect>`)
    } else {
      const hex = /^#[0-9A-Fa-f]{3,8}$/.test(c.hex || '') ? c.hex : '#9CA3AF'
      parts.push(`<rect class="rc-band" x="${x}" y="${bodyY + 2}" width="${bandW}" height="${bodyH - 4}" rx="2" fill="${hex}" stroke="rgba(0,0,0,0.25)" stroke-width="0.5"><title>${escapeXmlText(label)}</title></rect>`)
    }
  }

  // 误差环大间距的图解标注
  if (tolX !== null && multX !== null) {
    const gapFrom = direction === 'rtl' ? tolX + bandW + 4 : multX + bandW + 4
    const gapTo = direction === 'rtl' ? multX - 4 : tolX - 4
    if (gapTo - gapFrom > 8) {
      parts.push(`<line x1="${gapFrom}" y1="${bodyY - 6}" x2="${gapTo}" y2="${bodyY - 6}" stroke="#94A3B8" stroke-width="1" opacity="0.7" />`)
      parts.push(`<text x="${roundSig((gapFrom + gapTo) / 2, 4)}" y="${bodyY - 10}" text-anchor="middle" font-size="9" fill="#94A3B8">间距大 = 误差环</text>`)
    }
  }
  parts.push('</svg>')
  return parts.join('')
}

// ---------- 纯逻辑结束 ----------

// ---------- 选项表（由纯逻辑常量派生） ----------
const digitOptions = DIGIT_IDS.map((id) => ({ id, label: `${COLOR_BANDS[id].name}（${COLOR_BANDS[id].code}）` }))
const multOptions = DIGIT_IDS.map((id, code) => ({ id, label: `${COLOR_BANDS[id].name} ×${fmtMultText(code)}` }))
  .concat(MULT_EXTRA_IDS.map((id) => ({ id, label: `${COLOR_BANDS[id].name} ×${fmtMultText(id === 'gold' ? -1 : -2)}` })))
const tolOptions = TOL_IDS.map((id) => ({ id, label: `${COLOR_BANDS[id].name} ±${tolerancePercentOf(id)}%` }))
const rTolOptions = ['brown', 'red', 'gold', 'silver'].map((id) => ({ id, label: `${COLOR_BANDS[id].name} ±${tolerancePercentOf(id)}%` }))
const QUICK_VALUES = [100, 1000, 2200, 4700, 10000, 22000, 47000, 100000]

// ---------- 交互状态 ----------
const seoContentVisible = ref(true)
const mode = ref('forward')          // forward = 选颜色读阻值；reverse = 输阻值查颜色
const direction = ref('ltr')         // SVG 绘制方向：误差环默认靠右，可翻转对照实物摆放
const f = ref({ bandCount: 4, d1: 'brown', d2: 'black', d3: 'black', mult: 'red', tol: 'gold' })
const rText = ref('4k7')
const rTol = ref('gold')
const activePresetId = ref('')
const activePresetNote = ref('')
const copyState = ref('复制方案')

function colorHex(id) {
  const c = colorById(id)
  return c ? (c.hex || '#9CA3AF') : '#9CA3AF'
}

function namesOf(ids) {
  return (ids || []).map(colorName).join(' ')
}

const bandDefs = computed(() => {
  const defs = [
    { key: 'd1', label: '第一环 · 数字', options: digitOptions },
    { key: 'd2', label: '第二环 · 数字', options: digitOptions }
  ]
  if (f.value.bandCount === 5) defs.push({ key: 'd3', label: '第三环 · 数字', options: digitOptions })
  defs.push(
    { key: 'mult', label: `第${f.value.bandCount - 1}环 · 倍率`, options: multOptions },
    { key: 'tol', label: `第${f.value.bandCount}环 · 误差`, options: tolOptions }
  )
  return defs
})

const forwardBandIds = computed(() => {
  const ids = [f.value.d1, f.value.d2]
  if (f.value.bandCount === 5) ids.push(f.value.d3)
  ids.push(f.value.mult, f.value.tol)
  return ids
})

const forwardResult = computed(() => solveFromBandsOf(forwardBandIds.value))

const forwardStats = computed(() => {
  const s = forwardResult.value
  if (!s.ok) return []
  return [
    { label: '标称阻值', value: s.formatted, tone: 'text-primary' },
    { label: `容差 ±${s.tolPercent}%`, value: `± ${formatResistanceOf(s.tolValue)}`, tone: 'text-foreground' },
    { label: '允许下限', value: formatResistanceOf(s.min), tone: 'text-foreground' },
    { label: '允许上限', value: formatResistanceOf(s.max), tone: 'text-foreground' }
  ]
})

const reverseParsed = computed(() => parseResistanceInputOf(rText.value))
const reverseResult = computed(() => {
  const p = reverseParsed.value
  if (p.ohms === null) return null
  return reverseSolveOf(p.ohms, rTol.value)
})

const reverseBadge = computed(() => {
  const r = reverseResult.value
  if (!r || !r.ok) return { icon: Info, tone: 'bg-muted/60 text-foreground', text: '' }
  const targetText = formatResistanceOf(r.target)
  if (r.exact && r.e24) {
    return { icon: CheckCircle, tone: 'bg-green-500/10 text-green-600', text: `${targetText} 是 E24 标准值，${r.bandCount === 4 ? '标准 4 环方案' : '五环方案'}直接可用，市面随手可得。` }
  }
  if (r.exact && r.bandCount === 5) {
    const altText = r.alt ? `若手头只有 4 环电阻可就近用「${r.alt.sigText}」= ${formatResistanceOf(r.alt.repr)}（偏差 ${Number(r.alt.deviation.toFixed(2))}%）` : '无法降级为 4 环'
    return { icon: Info, tone: 'bg-muted/60 text-foreground', text: `非 E24 标准值，给出 5 环 3 位有效精确方案（常见于 ±1% / ±2% 精密电阻）；${altText}。` }
  }
  if (r.exact) {
    return { icon: Info, tone: 'bg-muted/60 text-foreground', text: `${targetText} 可用 4 环精确表示，但不在 E24（±5%）标准 24 档中，采购可能不易拿到该档位。` }
  }
  return {
    icon: TriangleAlert,
    tone: 'bg-red-500/10 text-red-600',
    text: `非标准值，给出近似色环 ${r.sigText}（实际 ${formatResistanceOf(r.repr)}，偏差 ${Number(r.deviation.toFixed(2))}%）：色环无法精确编码该阻值，应急替换可用，精密场合请按原理图原值更换。`
  }
})

const reverseStats = computed(() => {
  const r = reverseResult.value
  if (!r || !r.ok) return []
  return [
    { label: '输入阻值', value: formatResistanceOf(r.target), tone: 'text-foreground' },
    { label: '色环表示值', value: `${r.exact ? '' : '≈ '}${formatResistanceOf(r.repr)}`, tone: r.exact ? 'text-foreground' : 'text-red-600' },
    { label: '误差环方案', value: `±${r.tolPercent}%`, tone: 'text-foreground' },
    { label: 'E24 校验', value: r.e24 ? '是' : '否', tone: r.e24 ? 'text-green-600' : 'text-muted-foreground' }
  ]
})

// ---------- SVG 渲染（正向 / 反向共用） ----------
const svgOk = computed(() => (mode.value === 'forward' ? forwardResult.value.ok : !!(reverseResult.value && reverseResult.value.ok)))
const svgBandIds = computed(() => (mode.value === 'forward' ? forwardBandIds.value : (reverseResult.value && reverseResult.value.ok ? reverseResult.value.bandIds : [])))
const svgErrorText = computed(() => {
  if (mode.value === 'forward') return (forwardResult.value && forwardResult.value.error) || ''
  const p = reverseParsed.value
  if (p.ohms === null) return p.error === '待输入' ? '在左侧输入阻值（如 4k7 / 4.7k / 4700），色环图自动出现' : p.error
  return (reverseResult.value && reverseResult.value.error) || ''
})
const currentSvg = computed(() => {
  if (!svgOk.value) return ''
  return bandsToSvg(svgBandIds.value, {
    direction: direction.value,
    ariaLabel: `${namesOf(svgBandIds.value)} 电阻色环示意图`
  })
})
const svgCaption = computed(() =>
  direction.value === 'ltr' ? '读取方向：自左向右（误差环靠右）' : '读取方向：自右向左（镜像视图，误差环靠左）'
)
const currentSchemeText = computed(() => {
  if (!svgOk.value) return ''
  const s = mode.value === 'forward' ? forwardResult.value : reverseResult.value
  const valueText = mode.value === 'forward' ? s.formatted : formatResistanceOf(s.repr)
  return `${namesOf(s.bandIds)} → ${s.exact === false ? '≈ ' : ''}${valueText} ±${s.tolPercent}%`
})

// ---------- 速查表（由反查纯函数生成） ----------
const quickRows = computed(() =>
  QUICK_VALUES.map((v) => {
    const r = reverseSolveOf(v, 'gold')
    return {
      value: v,
      valueText: formatResistanceOf(v),
      bandIds: r.ok ? r.bandIds : [],
      namesText: r.ok ? namesOf(r.bandIds) : '',
      sigText: r.ok ? r.sigText : ''
    }
  })
)

function applyQuickRow(row) {
  if (!row.bandIds.length) return
  mode.value = 'forward'
  const ids = row.bandIds.slice()
  const tol = ids.pop()
  const mult = ids.pop()
  f.value = { bandCount: row.bandIds.length, d1: ids[0], d2: ids[1], d3: ids[2] || f.value.d3, mult, tol }
  activePresetId.value = ''
  activePresetNote.value = ''
}

// ---------- 预设（手算断言见自测） ----------
const presetDefs = [
  {
    id: 'p1k',
    ids: ['brown', 'black', 'red', 'gold'],
    summary: '1 0 ×100 = 1 kΩ ±5%（四环经典）',
    note: '棕黑红金：前两环 1、0 组成 10，红环倍率 ×100 → 1000 Ω；金环 = ±5%，允许区间 950 Ω ~ 1.05 kΩ。'
  },
  {
    id: 'p27k',
    ids: ['red', 'purple', 'orange', 'gold'],
    summary: '2 7 ×1 k = 27 kΩ ±5%（红紫橙是 27 k，不是 2.7 k）',
    note: '红紫定 27，橙环 = ×10³ → 27 kΩ。想要 2.7 kΩ 应选红紫红金（×100）——倍率环差一档，阻值差十倍，是新手最常犯的读数错误。'
  },
  {
    id: 'p47',
    ids: ['yellow', 'purple', 'red', 'gold'],
    summary: '4 7 ×100 = 4.7 kΩ ±5%（E24 标准值）',
    note: '黄紫红金：4.7 kΩ 落在 E24 系列的 47 档，是上拉 / 下拉电阻的常客；±5% 金环为四环普通金属膜常见配置。'
  },
  {
    id: 'p47k1',
    ids: ['yellow', 'purple', 'black', 'brown', 'brown'],
    summary: '4 7 0 ×10 = 4.7 kΩ ±1%（五环精密）',
    note: '五环 4.7 kΩ ±1%：三位有效数字 4、7、0 + 棕 ×10 + 棕 ±1%，允许区间 4.653 kΩ ~ 4.747 kΩ。与四环黄紫红金同值不同精度；注意黄紫黑红棕其实是 47 kΩ。'
  }
]

function applyPreset(p) {
  activePresetId.value = p.id
  activePresetNote.value = p.note
  mode.value = 'forward'
  const ids = p.ids.slice()
  const tol = ids.pop()
  const mult = ids.pop()
  f.value = { bandCount: p.ids.length, d1: ids[0], d2: ids[1], d3: ids[2] || f.value.d3, mult, tol }
}

function setBandCount(n) {
  f.value.bandCount = n
  activePresetId.value = ''
  activePresetNote.value = ''
}

function resetAll() {
  f.value = { bandCount: 4, d1: 'brown', d2: 'black', d3: 'black', mult: 'red', tol: 'gold' }
  rText.value = '4k7'
  rTol.value = 'gold'
  direction.value = 'ltr'
  activePresetId.value = ''
  activePresetNote.value = ''
  copyState.value = '复制方案'
}

function toggleDirection() {
  direction.value = direction.value === 'ltr' ? 'rtl' : 'ltr'
}

// ---------- 复制（剪贴板 API 仅在事件回调中使用，SSR 安全） ----------
async function copyScheme() {
  const text = currentSchemeText.value
  if (!text) return
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      copyState.value = '已复制 ✓'
    } else {
      copyState.value = '该环境不支持自动复制'
    }
  } catch {
    copyState.value = '复制失败，请手动选择'
  }
  setTimeout(() => { copyState.value = '复制方案' }, 1600)
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('resistor-color-code')
})
</script>
