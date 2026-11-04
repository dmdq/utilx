<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Atom class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">分子量计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">支持嵌套括号与水合物点号的摩尔质量计算，附元素质量分数占比、物质的量换算与多式对比</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线分子量计算器（摩尔质量计算器）：输入化学式即刻得到摩尔质量（g/mol）与相对分子质量，支持 Ca(OH)2、Fe2(SO4)3、K4[Fe(CN)6] 这类括号嵌套分组，
        也支持 CuSO4·5H2O、CuSO4.5H2O、CuSO4*5H2O 三种水合物点号写法（点号后的数字为结晶水倍数），元素符号严格区分大小写——Co 是钴而 CO 是一氧化碳；
        同时给出每种元素的质量贡献与质量分数占比横条，可添加多个化学式并排对比同分异构体或不同水合度，选填质量 g 即可按 n = m / M 换算物质的量。
        相对原子质量按 IUPAC 通行值，全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Scale class="w-5 h-5 mr-2 text-primary" /> 输入化学式
        </h2>

        <template v-for="(input, idx) in formulaInputs" :key="input.id">
          <div>
            <label :for="'molar-formula-' + input.id" class="block text-sm font-medium text-foreground mb-1.5">
              {{ idx === 0 ? '主化学式' : '对比化学式 ' + idx }}
            </label>
            <div class="flex gap-2">
              <input
                :id="'molar-formula-' + input.id"
                v-model="input.text"
                type="text"
                placeholder="如 CuSO4·5H2O"
                spellcheck="false"
                autocomplete="off"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              <button
                v-if="formulaInputs.length > 1"
                @click="removeFormula(input.id)"
                title="移除该化学式"
                class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-red-600 transition flex-shrink-0"
              >
                移除
              </button>
            </div>
            <p v-if="formulaRows[idx] && formulaRows[idx].error" class="mt-1.5 text-xs text-red-500 flex items-start gap-1">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ formulaRows[idx].error.error }}（第 {{ formulaRows[idx].error.pos + 1 }} 个字符）</span>
            </p>
          </div>
        </template>

        <!-- 操作按钮 -->
        <div class="flex gap-2">
          <button
            @click="addFormula"
            :disabled="formulaInputs.length >= MAX_FORMULAS"
            class="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
          >
            <Play class="w-4 h-4" /> 添加对比化学式（{{ formulaInputs.length }}/{{ MAX_FORMULAS }}）
          </button>
          <button
            @click="resetAll"
            title="清空输入与结果"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4" />
          </button>
        </div>

        <!-- 内置示例 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">内置示例（点击填入主化学式）</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="ex in examples"
              :key="ex.formula"
              @click="applyExample(ex)"
              class="px-2.5 py-1.5 rounded-md border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 text-xs font-mono text-foreground transition"
            >
              {{ ex.label }}
            </button>
          </div>
        </div>

        <!-- 语法说明 -->
        <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
          <span>语法：元素符号大小写敏感（Co 是钴，CO 是一氧化碳）；小括号与中括号均可嵌套分组，如 Ca(OH)2、K4[Fe(CN)6]；水合物点号支持 ·、.、* 三种写法，倍数写在点号之后，如 CuSO4·5H2O、CuSO4.5H2O、CuSO4*5H2O。</span>
        </p>

        <!-- 多式对比说明 -->
        <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
          <span>多式对比：点击「添加对比化学式」再加一行即可并排比较，例如同分异构的葡萄糖与果糖（都是 C6H12O6）、无水 CuSO4 与胆矾 CuSO4·5H2O，最多 5 个。</span>
        </p>
      </div>

      <!-- 右：结果面板 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Atom class="w-5 h-5 mr-2 text-primary" /> 计算结果
        </h2>

        <!-- 空状态 -->
        <div v-if="!primaryRow && !errorRows.length" class="flex flex-col items-center justify-center py-16 text-center">
          <Atom class="w-10 h-10 text-primary/30 mb-3" />
          <p class="text-sm font-medium text-muted-foreground">在左侧输入化学式，实时计算摩尔质量</p>
          <p class="text-xs text-muted-foreground/70 mt-1">支持括号嵌套与水合物点号，也可以点击任一内置示例一键体验</p>
        </div>

        <!-- 错误卡：没有任何可计算结果 -->
        <div v-else-if="!primaryRow" class="rounded-lg border border-red-500/30 bg-red-500/5 p-4 space-y-2.5">
          <p class="flex items-center gap-1.5 text-sm font-medium text-red-600">
            <TriangleAlert class="w-4 h-4" /> 输入有误
          </p>
          <p class="text-sm text-muted-foreground">化学式「{{ firstErrorRow.text }}」解析失败：{{ firstErrorRow.error.error }}（第 {{ firstErrorRow.error.pos + 1 }} 个字符）</p>
          <div class="text-xs">
            <p class="text-muted-foreground mb-1">出错位置（高亮处为第 {{ firstErrorRow.error.pos + 1 }} 个字符）：</p>
            <p class="font-mono bg-muted/60 border border-border rounded p-2 break-all whitespace-pre-wrap">
              {{ firstErrorRow.text.slice(0, firstErrorRow.error.pos) }}<span class="bg-red-500/20 text-red-600 rounded px-0.5">{{ firstErrorRow.text.slice(firstErrorRow.error.pos, firstErrorRow.error.pos + 1) || '（末尾）' }}</span>{{ firstErrorRow.text.slice(firstErrorRow.error.pos + 1) }}
            </p>
          </div>
        </div>

        <!-- 结果 -->
        <template v-else>
          <!-- 部分化学式解析失败提示 -->
          <div v-if="errorRows.length" class="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-1.5 text-sm text-amber-600">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>另有 {{ errorRows.length }} 个化学式未能解析：{{ errorRows.map((r) => '「' + r.text + '」' + r.error.error).join('；') }}，已从结果中排除。</span>
          </div>

          <!-- 大结果卡 -->
          <div class="bg-primary/5 border border-primary/20 rounded-lg p-5">
            <div class="flex items-center justify-between gap-3 mb-4">
              <p class="text-2xl sm:text-3xl font-bold font-mono text-foreground leading-relaxed break-words"><span v-html="primaryRow.html"></span></p>
              <button
                @click="copyResult"
                class="px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-muted/60 text-xs font-medium text-muted-foreground hover:text-foreground transition flex items-center gap-1 flex-shrink-0"
              >
                <CheckCircle v-if="copied" class="w-3.5 h-3.5 text-green-500" />
                <Copy v-else class="w-3.5 h-3.5" />
                {{ copied ? '已复制' : '复制结果' }}
              </button>
            </div>
            <div class="flex items-end gap-2 flex-wrap">
              <span class="text-5xl sm:text-6xl font-bold text-primary leading-none">{{ primaryRow.mass.toFixed(3) }}</span>
              <span class="text-lg text-muted-foreground mb-1">g/mol</span>
            </div>
            <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
              上式为 <span class="font-mono text-foreground">{{ primaryRow.text }}</span> 的摩尔质量 M；相对分子质量 Mr 与它数值完全相同——Mr 以碳-12 原子质量的 1/12 为基准、无量纲，M 以 g/mol 为单位，两者读数可直接互换。
            </p>
          </div>

          <!-- 元素构成表 -->
          <div>
            <p class="text-sm font-medium text-foreground mb-2">元素构成与质量分数</p>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-xs text-muted-foreground border-b border-border">
                    <th class="py-2 pr-4 font-medium">元素</th>
                    <th class="py-2 pr-4 font-medium">原子个数</th>
                    <th class="py-2 pr-4 font-medium">质量贡献（g/mol）</th>
                    <th class="py-2 font-medium min-w-[160px]">质量分数</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="f in primaryRow.fractions" :key="f.element" class="border-b border-border/60">
                    <td class="py-2 pr-4 font-mono font-semibold text-foreground">
                      {{ f.element }}<span v-if="isRadioactiveElement(f.element)" class="text-amber-600 ml-1 cursor-help" title="放射性元素，无稳定同位素，取最稳定同位素质量数近似">※</span>
                    </td>
                    <td class="py-2 pr-4 font-mono text-muted-foreground">{{ f.count }}</td>
                    <td class="py-2 pr-4 font-mono text-muted-foreground">{{ f.mass.toFixed(3) }}</td>
                    <td class="py-2">
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-2 bg-muted rounded-full overflow-hidden min-w-[80px]">
                          <div class="h-full bg-primary/70 rounded-full" :style="{ width: Math.min(100, f.pct) + '%' }"></div>
                        </div>
                        <span class="font-mono text-xs text-foreground w-16 text-right flex-shrink-0">{{ f.pct.toFixed(2) }}%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 多式对比 -->
          <div v-if="validRows.length > 1">
            <p class="text-sm font-medium text-foreground mb-2">多式对比（共 {{ validRows.length }} 个）</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <div
                v-for="row in validRows"
                :key="row.id"
                class="rounded-lg border p-3.5 space-y-1.5"
                :class="row.id === primaryRow.id ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/40'"
              >
                <p class="font-mono font-bold text-foreground break-words"><span v-html="row.html"></span></p>
                <p class="text-lg font-bold" :class="row.id === primaryRow.id ? 'text-primary' : 'text-foreground'">
                  {{ row.mass.toFixed(3) }}<span class="text-xs font-normal text-muted-foreground ml-1">g/mol</span>
                </p>
                <p class="text-xs text-muted-foreground">
                  最重元素：<span class="font-mono text-foreground">{{ row.heaviest.element }}</span>（{{ row.heaviest.mass.toFixed(3) }} g/mol · {{ row.heaviest.pct.toFixed(2) }}%）
                </p>
                <p v-if="row.id === primaryRow.id" class="text-[10px] text-primary font-medium">主结果（元素构成见上表）</p>
              </div>
            </div>
          </div>

          <!-- 摩尔换算 -->
          <div class="bg-muted/40 border border-border rounded-lg p-4 space-y-3">
            <p class="text-sm font-medium text-foreground flex items-center">
              <Scale class="w-4 h-4 mr-1.5 text-primary" /> 摩尔换算（选填质量，换算物质的量）
            </p>
            <div class="flex flex-wrap items-center gap-2">
              <label for="molar-mass-g" class="text-sm text-muted-foreground">质量 m =</label>
              <input
                id="molar-mass-g"
                v-model="massInput"
                type="number"
                min="0"
                step="any"
                placeholder="如 36"
                class="w-36 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              <span class="text-sm text-muted-foreground">g</span>
            </div>
            <p v-if="molesResult" class="text-sm text-foreground">
              <span class="font-mono">n = m ÷ M = {{ molesResult.mass }} g ÷ {{ primaryRow.mass.toFixed(3) }} g/mol =</span>
              <span class="font-mono font-bold text-primary text-base"> {{ molesResult.moles.toFixed(3) }}</span>
              <span class="font-mono"> mol</span>
            </p>
            <p v-else class="text-xs text-muted-foreground">填入质量后自动按 n = m / M 换算当前主化学式的物质的量（结果保留 3 位小数），例如 36 g 水约 1.998 mol。</p>
          </div>

          <!-- 页脚小字 -->
          <p class="text-xs text-muted-foreground/80 leading-relaxed">相对原子质量按 IUPAC 通行值（四舍五入至常用精度）；放射性元素取最稳定同位素。结果表中带 ※ 标记的元素即取同位素质量数近似。</p>
        </template>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>分子量计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          分子量计算器是一款在线摩尔质量计算工具：输入化学式，工具先用递归下降解析器把它拆成每种元素的原子个数（支持 Ca(OH)2、Fe2(SO4)3、K4[Fe(CN)6] 这类括号嵌套分组，
          以及 CuSO4·5H2O、CuSO4.5H2O、CuSO4*5H2O 三种水合物点号写法，元素符号严格区分大小写），再按 IUPAC 通行相对原子质量逐项求和得到摩尔质量（g/mol），
          同时列出每种元素的质量贡献与质量分数占比横条。添加多个化学式可以并排对比同分异构体或不同水合度的摩尔质量差异；选填质量 g 还能按 n = m / M 换算物质的量。
          全部计算在浏览器本地完成，不上传任何数据。
        </p>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          以胆矾 <span class="font-mono text-foreground">CuSO4·5H2O</span> 为例：点号后的 5 表示每个硫酸铜单元带 5 个结晶水，展开就是 Cu + S + 4O + 5×(2H + O)，
          合计 Cu 1、S 1、O 9、H 10，摩尔质量 = 63.546 + 32.06 + 9×15.999 + 10×1.008 = <span class="font-mono text-foreground">249.677 g/mol</span>；
          其中氧的质量分数最高，占 57.67%。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">摩尔质量和相对分子质量的区别</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两者数值完全相同，差别只在量纲（单位）。相对分子质量（Mr）以碳-12 原子质量的 1/12 为基准，是一个无量纲的纯数，例如 H2O 的 Mr ≈ 18.015；
          摩尔质量（M）表示每摩尔物质的质量，单位是 g/mol，例如 H2O 的 M ≈ 18.015 g/mol。二者通过阿伏伽德罗常数 NA ≈ 6.022×10²³ /mol 联系起来：
          1 mol 水分子的质量是 18.015 g，含 6.022×10²³ 个水分子。习惯上查表说的「分子量」指 Mr，实验室称量计算用 M；
          本页结果卡的读数两者通用，把 g/mol 单位隐去、当作纯数读即为相对分子质量。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">水合物怎么算（·nH2O 的处理）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          结晶水合物的化学式写作「盐 · n 水」，点号后的 n 是结晶水分子的倍数：CuSO4·5H2O = CuSO4 + 5×H2O，即点号两侧各自按普通化学式解析，
          再把 n 乘到后续所有原子的个数上。本工具支持中点 ·、英文句点 . 与星号 * 三种写法（键盘打不出中点时用 . 或 * 即可，全角字符会自动转换），
          n 必须是写在点号之后的正整数（如 CuSO4·10H2O 也支持多位倍数），KCl·MgCl2·6H2O 这类多段复盐也能逐段累加解析。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">质量分数有什么用（实验配液）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          元素质量分数指某元素占化合物总质量的比例，是配液与投料计算的常用依据。例如配制 0.1 mol 的生理盐水需要 NaCl 5.844 g，
          其中钠元素占 39.34%（2.299 g）、氯元素占 60.66%（3.545 g）；化肥袋标上的养分含量（尿素含氮约 46.65%）、矿石品位、
          以及分析化学里由实验百分含量反推经验式，用的都是同一套数据。本页元素构成表直接给出每个元素的质量贡献与占比横条，可据此核对配比。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么要区分大小写（Co 钴 vs CO 一氧化碳）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          元素符号的规范是「一个大写字母开头 + 零到两个小写字母」，大小写不同含义完全不同：Co 是钴元素（58.933 g/mol），
          CO 是一氧化碳分子（12.011 + 15.999 = 28.010 g/mol），两者相差一倍多。类似的还有 Ho（钬）与 HO、Nb（铌）与 NB 等常见混淆。
          本工具与站内化学方程式配平器采用同一套解析口径：大写字母开头、其后连续小写字母整体识别为一个元素符号，
          所以输入 Co 与 CO 会得到不同的结果——这是刻意设计，不是 bug。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">计算依据的数据来源</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          相对原子质量按 IUPAC 通行值计算（即 IUPAC 2021 标准相对原子质量四舍五入至常用精度，如 H 1.008、C 12.011、O 15.999、Cl 35.45），
          收录 1–118 号全部元素。放射性元素（如 Tc、Pm 以及 Po 之后的大多数元素）没有稳定同位素，取其最稳定同位素的质量数作为近似值
          （如 Tc 98、Ra 226、Og 294），结果表中以 ※ 标出。由于四舍五入口径不同，结果与部分教科书或高精度手册可能在第三位小数上相差 0.01 以内
          （例如 NaCl 本页算得 58.440 g/mol，采用氯 35.453 旧值的手册则给出 58.443），属于正常精度差异；课堂速算用整数近似（H 1、C 12、O 16）即可。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">摩尔质量和相对分子质量有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">数值完全相同，量纲不同：相对分子质量以碳-12 原子质量的 1/12 为基准、无量纲；摩尔质量以 g/mol 为单位，表示每摩尔物质的质量。结果卡的读数两者通用。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">CuSO4·5H2O 这类水合物怎么输入？</h3>
            <p class="text-sm text-muted-foreground mt-1">点号支持 ·、.、* 三种写法：CuSO4·5H2O、CuSO4.5H2O、CuSO4*5H2O 完全等价。倍数 n 写在点号之后（必须为正整数），工具会把 n 乘到后续所有原子个数上，多段复盐如 KCl·MgCl2·6H2O 也能解析。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么输入 Co 和 CO 的结果完全不同？</h3>
            <p class="text-sm text-muted-foreground mt-1">元素符号大小写敏感：Co 是钴（58.933 g/mol），CO 是一氧化碳（28.010 g/mol）。解析时大写字母开头、后续小写字母整体算一个元素符号，与化学书写规范一致。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么各元素的质量分数加起来不是精确的 100%？</h3>
            <p class="text-sm text-muted-foreground mt-1">每个元素的质量分数四舍五入到 2 位小数会产生尾差，合计与 100% 的偏差不超过 0.05%。占比本身按未舍入的质量计算，误差只出现在显示层，不影响摩尔质量结果。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'molar-mass-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Atom, Copy, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, Scale
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '分子量计算器 - 在线摩尔质量/相对分子质量计算工具',
  description: '免费在线分子量计算器：输入化学式即时计算摩尔质量与相对分子质量，支持嵌套括号 Ca(OH)2、中括号 K4[Fe(CN)6] 与水合物 CuSO4·5H2O（·/./ * 三种写法等价），元素大小写敏感，附元素质量分数占比、物质的量 n=m/M 换算与多式对比，按 IUPAC 标准相对原子质量本地计算不上传',
  keywords: '分子量计算器,摩尔质量,相对分子质量,化学式计算,元素质量分数',
  author: '有条工具',
  ogTitle: '分子量计算器 - 在线摩尔质量/相对分子质量计算工具 | 有条工具',
  ogDescription: '输入化学式实时计算摩尔质量与质量分数，支持括号嵌套与水合物点号（·/./ *），多式并排对比，纯本地计算。',
  ogUrl: 'https://www.util.cn/tools/molar-mass-calculator',
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
          name: '分子量计算器',
          url: 'https://www.util.cn/tools/molar-mass-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['化学式解析为元素计数（大小写敏感，Co 与 CO 区分）', '支持小括号与中括号嵌套分组（Ca(OH)2、K4[Fe(CN)6]）', '水合物点号倍乘（CuSO4·5H2O / CuSO4.5H2O / CuSO4*5H2O）', '摩尔质量与相对分子质量计算（3 位小数）', '逐元素质量贡献与质量分数占比横条', '多化学式并排对比（同分异构 / 水合对比）', '物质的量换算 n = m / M', 'IUPAC 通行相对原子质量 1-118 号']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '分子量计算器', item: 'https://www.util.cn/tools/molar-mass-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '摩尔质量和相对分子质量有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '数值完全相同，量纲不同：相对分子质量以碳-12 原子质量的 1/12 为基准、无量纲；摩尔质量以 g/mol 为单位，表示每摩尔物质的质量。结果卡的读数两者通用。' }
            },
            {
              '@type': 'Question',
              name: 'CuSO4·5H2O 这类水合物怎么输入？',
              acceptedAnswer: { '@type': 'Answer', text: '点号支持 ·、.、* 三种写法，完全等价。倍数 n 写在点号之后（必须为正整数），工具会把 n 乘到后续所有原子个数上，多段复盐如 KCl·MgCl2·6H2O 也能解析。' }
            },
            {
              '@type': 'Question',
              name: '为什么输入 Co 和 CO 的结果完全不同？',
              acceptedAnswer: { '@type': 'Answer', text: '元素符号大小写敏感：Co 是钴（58.933 g/mol），CO 是一氧化碳（28.010 g/mol）。解析时大写字母开头、后续小写字母整体算一个元素符号，与化学书写规范一致。' }
            },
            {
              '@type': 'Question',
              name: '为什么各元素的质量分数加起来不是精确的 100%？',
              acceptedAnswer: { '@type': 'Answer', text: '每个元素的质量分数四舍五入到 2 位小数会产生尾差，合计与 100% 的偏差不超过 0.05%。占比本身按未舍入的质量计算，误差只出现在显示层，不影响摩尔质量结果。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 全角字符（U+FF01–FF5E：Ｃ→C、４→4、·→不变 等）统一转半角，再去首尾空白
function normalizeInput(text) {
  return String(text ?? '')
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .trim()
}

// HTML 转义（& < > " '），保证 v-html 注入安全
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 水合物点号分隔字符：·（U+00B7）、•、・、英文句点 .、星号 * —— CuSO4·5H2O 的三种通行写法等价支持
const HYDRATE_DOTS = ['·', '•', '・', '.', '*']

// 1-118 号元素相对原子质量表 { symbol: mass }
// 按 IUPAC 2021 标准相对原子质量四舍五入至常用精度；无稳定同位素的放射性元素取最稳定同位素的质量数（见 RADIOACTIVE_ELEMENTS 与页脚注明）
const ATOMIC_MASSES = {
  H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122,         // 1-4
  B: 10.81, C: 12.011, N: 14.007, O: 15.999,          // 5-8
  F: 18.998, Ne: 20.180, Na: 22.990, Mg: 24.305,      // 9-12
  Al: 26.982, Si: 28.085, P: 30.974, S: 32.06,        // 13-16
  Cl: 35.45, Ar: 39.95, K: 39.098, Ca: 40.078,        // 17-20
  Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996,      // 21-24
  Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693,     // 25-28
  Cu: 63.546, Zn: 65.38, Ga: 69.723, Ge: 72.630,      // 29-32
  As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798,     // 33-36
  Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224,       // 37-40
  Nb: 92.906, Mo: 95.95, Tc: 98, Ru: 101.07,          // 41-44
  Rh: 102.91, Pd: 106.42, Ag: 107.87, Cd: 112.41,     // 45-48
  In: 114.82, Sn: 118.71, Sb: 121.76, Te: 127.60,     // 49-52
  I: 126.90, Xe: 131.29, Cs: 132.91, Ba: 137.33,      // 53-56
  La: 138.91, Ce: 140.12, Pr: 140.91, Nd: 144.24,     // 57-60
  Pm: 145, Sm: 150.36, Eu: 151.96, Gd: 157.25,        // 61-64
  Tb: 158.93, Dy: 162.50, Ho: 164.93, Er: 167.26,     // 65-68
  Tm: 168.93, Yb: 173.05, Lu: 174.97, Hf: 178.49,     // 69-72
  Ta: 180.95, W: 183.84, Re: 186.21, Os: 190.23,      // 73-76
  Ir: 192.22, Pt: 195.08, Au: 196.97, Hg: 200.59,     // 77-80
  Tl: 204.38, Pb: 207.2, Bi: 208.98, Po: 209,         // 81-84
  At: 210, Rn: 222, Fr: 223, Ra: 226,                 // 85-88
  Ac: 227, Th: 232.04, Pa: 231.04, U: 238.03,         // 89-92
  Np: 237, Pu: 244, Am: 243, Cm: 247,                 // 93-96
  Bk: 247, Cf: 251, Es: 252, Fm: 257,                 // 97-100
  Md: 258, No: 259, Lr: 266, Rf: 267,                 // 101-104
  Db: 268, Sg: 269, Bh: 270, Hs: 269,                 // 105-108
  Mt: 278, Ds: 281, Rg: 282, Cn: 285,                 // 109-112
  Nh: 286, Fl: 289, Mc: 290, Lv: 293,                 // 113-116
  Ts: 294, Og: 294                                    // 117-118
}

// 无稳定同位素的放射性元素（取最稳定同位素质量数作为相对原子质量，页脚已注明）
const RADIOACTIVE_ELEMENTS = new Set([
  'Tc', 'Pm', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Np', 'Pu', 'Am', 'Cm',
  'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs',
  'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og'
])

function isRadioactiveElement(el) {
  return RADIOACTIVE_ELEMENTS.has(el)
}

// 解析单个化学式为 { 元素: 数量 }，如 'Fe2(SO4)3' → { Fe: 2, S: 3, O: 12 }、'CuSO4·5H2O' → { Cu: 1, S: 1, O: 9, H: 10 }
// 递归下降处理 () / [] 嵌套（语义相同、须各自配对）；水合物点号（·/./ *）引出新的水合段，段前整数（如 ·5）为该段倍数；
// 大小写敏感：大写字母开头、其后连续小写字母整体为一种元素（'Co' 是钴，'CO' 是碳+氧）。
// 失败返回 { error, pos }（pos 为出错字符下标，0 起），不抛异常——与站内化学方程式配平器同款口径。
function parseFormula(formula) {
  const s = String(formula)
  if (!s.length) return { error: '化学式为空', pos: 0 }

  const total = {}        // 各水合段合计
  const levels = [{}]     // 当前水合段：每层括号一个计数对象，栈顶为当前层
  const openBrackets = [] // 未闭合括号：{ ch, pos }
  let segTimes = 1        // 当前水合段的点号前缀倍数（·5H2O 中的 5）

  const mergeSegment = () => {
    for (const el of Object.keys(levels[0])) {
      total[el] = (total[el] || 0) + levels[0][el] * segTimes
    }
  }

  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (c === '(' || c === '[') {
      levels.push({})
      openBrackets.push({ ch: c, pos: i })
      i++
      continue
    }
    if (c === ')' || c === ']') {
      if (!openBrackets.length) return { error: `多余的「${c}」`, pos: i }
      const open = openBrackets[openBrackets.length - 1]
      const expect = open.ch === '(' ? ')' : ']'
      if (c !== expect) return { error: `括号不匹配：此处应为「${expect}」`, pos: i }
      openBrackets.pop()
      const group = levels.pop()
      let j = i + 1
      let num = ''
      while (j < s.length && s[j] >= '0' && s[j] <= '9') {
        num += s[j]
        j++
      }
      const times = num ? parseInt(num, 10) : 1
      const top = levels[levels.length - 1]
      for (const el of Object.keys(group)) {
        top[el] = (top[el] || 0) + group[el] * times
      }
      i = j
      continue
    }
    if (HYDRATE_DOTS.includes(c)) {
      if (openBrackets.length) return { error: '水合物点号不能出现在括号内', pos: i }
      if (!Object.keys(levels[0]).length) return { error: `多余的「${c}」（点号左侧没有化学式）`, pos: i }
      mergeSegment()
      levels[0] = {}
      let j = i + 1
      let num = ''
      while (j < s.length && s[j] >= '0' && s[j] <= '9') {
        num += s[j]
        j++
      }
      if (j >= s.length) return { error: '水合物点号后缺少化学式', pos: i }
      const next = s[j]
      if (!((next >= 'A' && next <= 'Z') || next === '(' || next === '[')) {
        return { error: '水合物点号倍数后应紧跟元素或括号', pos: j }
      }
      if (num && parseInt(num, 10) <= 0) return { error: '水合物点号倍数应为正整数', pos: i + 1 }
      segTimes = num ? parseInt(num, 10) : 1
      i = j
      continue
    }
    if (c >= 'A' && c <= 'Z') {
      let j = i + 1
      while (j < s.length && s[j] >= 'a' && s[j] <= 'z') j++
      const el = s.slice(i, j)
      let k = j
      let num = ''
      while (k < s.length && s[k] >= '0' && s[k] <= '9') {
        num += s[k]
        k++
      }
      const n = num ? parseInt(num, 10) : 1
      const top = levels[levels.length - 1]
      top[el] = (top[el] || 0) + n
      i = k
      continue
    }
    if (c === ' ' || c === '\t') {
      return { error: '化学式中间不能有空格', pos: i }
    }
    return { error: `非法字符「${c}」`, pos: i }
  }

  if (openBrackets.length) {
    const open = openBrackets[openBrackets.length - 1]
    return { error: `「${open.ch}」未闭合`, pos: open.pos }
  }
  mergeSegment()
  return total
}

// 判断解析结果是否为错误对象（成功时是元素计数对象，错误时是 { error, pos }）
function isParseError(result) {
  return typeof result === 'object' && result !== null && 'error' in result
}

// 找出不在相对原子质量表中的元素符号（拼错 / 不存在），按出现顺序返回
function unknownElementsOf(counts) {
  return Object.keys(counts).filter((el) => !(el in ATOMIC_MASSES))
}

// 摩尔质量 M = Σ 相对原子质量 × 原子个数（g/mol），四舍五入保留 3 位小数
// 表外元素按 0 计（调用前应先用 unknownElementsOf 拦截）
function molarMassOf(counts) {
  let sum = 0
  for (const el of Object.keys(counts)) {
    sum += (ATOMIC_MASSES[el] || 0) * counts[el]
  }
  return Math.round(sum * 1000) / 1000
}

// 元素质量分数列表 [{ element, count, mass, pct }]，按化学式中首次出现顺序
// mass 为该元素质量贡献（g/mol，3 位小数），pct 为质量分数（%，2 位小数）
// 因逐项四舍五入，pct 合计与 100 的偏差不超过 0.05
function massFractionsOf(counts) {
  const total = molarMassOf(counts)
  if (total <= 0) return []
  return Object.keys(counts).map((el) => {
    const mass = Math.round((ATOMIC_MASSES[el] || 0) * counts[el] * 1000) / 1000
    const pct = Math.round((mass / total) * 10000) / 100
    return { element: el, count: counts[el], mass, pct }
  })
}

// 物质的量 n = m / M（m 单位 g，M 单位 g/mol），四舍五入保留 3 位小数；参数非法返回 null
function molesOf(mass, molarMass) {
  const m = Number(mass)
  const M = Number(molarMass)
  if (!isFinite(m) || !isFinite(M) || m <= 0 || M <= 0) return null
  return Math.round((m / M) * 1000) / 1000
}

// 质量贡献最大的元素（多式对比卡的「最重元素」），空列表返回 null
function heaviestElementOf(fractions) {
  let best = null
  for (const f of fractions) {
    if (!best || f.mass > best.mass) best = f
  }
  return best
}

// 化学式 → 带下标的 HTML：'CuSO4·5H2O' → 'CuSO<sub>4</sub>·5H<sub>2</sub>O'
// 逐字符先转义再包 <sub>，避免注入；水合物点号后的数字是结晶水倍数，按化学书写惯例保持正常字号
function formulaToHtml(formula) {
  let out = ''
  let inSub = false
  let afterDot = false
  for (const ch of String(formula)) {
    if (HYDRATE_DOTS.includes(ch)) {
      if (inSub) {
        out += '</sub>'
        inSub = false
      }
      out += escapeHtml(ch)
      afterDot = true
      continue
    }
    if (ch >= '0' && ch <= '9') {
      if (afterDot) {
        out += escapeHtml(ch)
      } else {
        if (!inSub) {
          out += '<sub>'
          inSub = true
        }
        out += ch
      }
      continue
    }
    afterDot = false
    if (inSub) {
      out += '</sub>'
      inSub = false
    }
    out += escapeHtml(ch)
  }
  if (inSub) out += '</sub>'
  return out
}

// ---------- 页面状态与交互 ----------

const MAX_FORMULAS = 5
let inputSeq = 1

const formulaInputs = ref([{ id: inputSeq, text: 'H2O' }])
const massInput = ref('')
const copied = ref(false)
const seoContentVisible = ref(true)
let copyTimer = null

// 内置示例：label 用于按钮显示（数值与页内计算口径一致），formula 填入主化学式
const examples = [
  { label: 'H2O（18.015）', formula: 'H2O' },
  { label: 'NaCl（58.440）', formula: 'NaCl' },
  { label: 'Ca(OH)2（74.092）', formula: 'Ca(OH)2' },
  { label: 'CuSO4·5H2O（249.677）', formula: 'CuSO4·5H2O' },
  { label: 'C6H12O6（180.156）', formula: 'C6H12O6' },
  { label: 'K4[Fe(CN)6]（368.345）', formula: 'K4[Fe(CN)6]' }
]

// 逐行解析（与 formulaInputs 一一对应）：empty / error / counts 三态
const formulaRows = computed(() =>
  formulaInputs.value.map((input) => {
    const base = { id: input.id, text: '', empty: false, error: null, counts: null }
    const text = normalizeInput(input.text)
    if (!text) return { ...base, empty: true }
    const parsed = parseFormula(text)
    if (isParseError(parsed)) return { ...base, text, error: parsed }
    const unknown = unknownElementsOf(parsed)
    if (unknown.length) {
      return {
        ...base,
        text,
        error: {
          error: `未知元素「${unknown[0]}」：请检查拼写与大小写（如 Co 是钴、CO 是一氧化碳）`,
          pos: text.indexOf(unknown[0])
        }
      }
    }
    const mass = molarMassOf(parsed)
    const fractions = massFractionsOf(parsed)
    return {
      ...base,
      text,
      counts: parsed,
      mass,
      fractions,
      heaviest: heaviestElementOf(fractions),
      html: formulaToHtml(text)
    }
  })
)

const validRows = computed(() => formulaRows.value.filter((r) => r.counts))
const errorRows = computed(() => formulaRows.value.filter((r) => r.error))
const firstErrorRow = computed(() => errorRows.value[0] || null)
const primaryRow = computed(() => validRows.value[0] || null)

// 摩尔换算：n = m / M（主化学式），质量非法或未填时返回 null
const molesResult = computed(() => {
  const row = primaryRow.value
  if (!row) return null
  const m = Number(normalizeInput(massInput.value))
  if (!isFinite(m) || m <= 0) return null
  const moles = molesOf(m, row.mass)
  if (moles === null) return null
  return { mass: m, moles }
})

function addFormula() {
  if (formulaInputs.value.length >= MAX_FORMULAS) return
  inputSeq += 1
  formulaInputs.value.push({ id: inputSeq, text: '' })
}

function removeFormula(id) {
  if (formulaInputs.value.length <= 1) return
  formulaInputs.value = formulaInputs.value.filter((row) => row.id !== id)
}

function applyExample(ex) {
  formulaInputs.value[0].text = ex.formula
}

function resetAll() {
  inputSeq += 1
  formulaInputs.value = [{ id: inputSeq, text: '' }]
  massInput.value = ''
}

// 复制结果（仅在用户点击回调中访问剪贴板，SSR 安全；剪贴板不可用时 alert 提示）
async function copyResult() {
  const row = primaryRow.value
  if (!row) return
  const text = `${row.text} 的摩尔质量为 ${row.mass.toFixed(3)} g/mol`
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
      copyTimer = null
    }, 2000)
  } catch {
    alert('复制失败，请手动选中结果复制。')
  }
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

onMounted(() => {
  addRecentTool('molar-mass-calculator')
})

onBeforeUnmount(() => {
  if (copyTimer) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
})
</script>
