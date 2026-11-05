<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Target class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">E系列标准阻值查找</h1>
          <p class="text-sm text-muted-foreground mt-1">E6~E96 最近标准值匹配、偏差评级与两电阻串并联组合替代搜索</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        三个模块一站式解决阻值选型：① 输入任意阻值，在 E6/E12/E24/E48/E96 五个系列中找出最近标准值并按偏差 ≤±1%、±1~5%、>5% 三档评级；
        ② 组合替代搜索——在两个 decade 窗口内穷举两只库存电阻的串联与并联，按误差升序给出 Top 10 方案（如 4.9 kΩ 可用 200 Ω + 4.7 kΩ 串联精确实现）；
        ③ E6~E96 全系列每 decade 速查表。阻值口径遵循 IEC 60063，覆盖 0.1 Ω ~ 10 MΩ，全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        系列口径：E48/E96 与 10^(n/N) 取 3 位有效数字的几何级数完全一致；E6/E12/E24 采用 IEC 60063 公布值（历史沿用，与纯公式在个别档位略有差异，如公式给 46.4 而公布值为 47）。
        E192 因官方表存在舍入特例未内置。基准表每 decade 一组、跨 decade（×10ⁿ，n = −2 ~ 6）复用，覆盖 0.1 Ω ~ 10 MΩ。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 模块①：最近标准值查找 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Search class="w-5 h-5 mr-2 text-primary" /> 最近标准值查找
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="esr-value" class="block text-sm font-medium text-foreground mb-1.5">目标阻值</label>
              <input
                id="esr-value"
                v-model.number="nearVal"
                type="number"
                min="0.1"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 4.9"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">单位</label>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="u in units"
                  :key="u.k"
                  @click="nearUnit = u.k"
                  :class="nearUnit === u.k ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-sm font-medium transition-all"
                >{{ u.k }}</button>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="text-muted-foreground">示例：</span>
            <button @click="fillNear(4.9, 'kΩ')" class="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition">4.9 kΩ</button>
            <button @click="fillNear(100, 'Ω')" class="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition">100 Ω</button>
            <button @click="fillNear(2.2, 'MΩ')" class="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition">2.2 MΩ</button>
          </div>

          <template v-if="nearValid">
            <div class="border border-border rounded-lg overflow-hidden">
              <div class="grid grid-cols-4 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                <span>系列</span><span>最近标准值</span><span class="text-right">偏差</span><span class="text-right">评级</span>
              </div>
              <div
                v-for="row in nearestRows"
                :key="row.name"
                class="grid grid-cols-4 px-3 py-2.5 text-sm border-t border-border/50 items-center"
              >
                <span class="font-mono font-medium text-foreground">{{ row.name }}</span>
                <span class="font-mono text-foreground">{{ row.text }}</span>
                <span class="text-right font-mono" :class="devClass(row.level)">{{ fmtDevPct(row.dev) }}</span>
                <span class="text-right">
                  <span :class="['px-1.5 py-0.5 rounded text-xs', devChipClass(row.level)]">{{ row.label }}</span>
                </span>
              </div>
            </div>

            <label class="flex items-center gap-2 text-sm text-muted-foreground">
              <input v-model="showSceneHint" type="checkbox" class="w-4 h-4 rounded border border-border">
              按分压 / 限流场景评估 E24 偏差影响
            </label>
            <p v-if="showSceneHint" class="text-xs leading-relaxed text-muted-foreground bg-muted/50 border border-border rounded-lg p-3">
              {{ sceneHint }}
            </p>
          </template>
          <div v-else class="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            输入 0.1 Ω ~ 10 MΩ 范围内的目标阻值，查看五个系列的最近标准值
          </div>
        </div>

        <!-- 模块②：组合替代搜索 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 组合替代搜索（两电阻串 / 并联）
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="esr-combo" class="block text-sm font-medium text-foreground mb-1.5">目标阻值</label>
              <input
                id="esr-combo"
                v-model.number="comboVal"
                type="number"
                min="0.1"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 4.9"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">单位 / 库存系列</label>
              <div class="flex gap-1.5">
                <button
                  v-for="u in units"
                  :key="u.k"
                  @click="comboUnit = u.k"
                  :class="comboUnit === u.k ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-2.5 py-2 rounded-lg text-sm font-medium transition-all"
                >{{ u.k }}</button>
                <span class="w-px bg-border mx-0.5"></span>
                <button
                  v-for="lib in libs"
                  :key="lib"
                  @click="comboLib = lib"
                  :class="comboLib === lib ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="flex-1 px-2 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                >{{ lib }}</button>
              </div>
            </div>
          </div>

          <template v-if="comboValid && comboResult.items.length">
            <p class="text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg p-2.5">
              每只电阻在 目标/25 ~ 目标×10 窗口内取值（下界覆盖串联微调所需小阻值，上界保证并联可下探），共
              {{ comboResult.windowCount }} 个基准值、穷举 {{ comboResult.total.toLocaleString('zh-CN') }} 个候选，按 |误差| 升序取 Top 10。
            </p>

            <div class="border border-border rounded-lg overflow-hidden">
              <div class="grid grid-cols-12 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                <span class="col-span-1">#</span>
                <span class="col-span-6">组合式</span>
                <span class="col-span-2 text-center">接法</span>
                <span class="col-span-1 text-right">实际值</span>
                <span class="col-span-2 text-right">误差</span>
              </div>
              <div
                v-for="(c, idx) in comboResult.items"
                :key="idx"
                class="grid grid-cols-12 px-3 py-2.5 text-sm border-t border-border/50 items-center"
              >
                <span class="col-span-1 text-muted-foreground">{{ idx + 1 }}</span>
                <span class="col-span-6 font-mono text-foreground text-xs sm:text-sm break-all">
                  {{ fmtR(c.a) }} {{ c.type === 'series' ? '+' : '∥' }} {{ fmtR(c.b) }}
                  <template v-if="comboLib === 'mix'">
                    <span :class="['ml-1 px-1 py-px rounded text-[10px] align-middle', c.ea ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground']">{{ c.ea ? '24' : '96' }}</span><span :class="['ml-0.5 px-1 py-px rounded text-[10px] align-middle', c.eb ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground']">{{ c.eb ? '24' : '96' }}</span>
                  </template>
                </span>
                <span class="col-span-2 text-center">
                  <span class="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">{{ c.type === 'series' ? '串联' : '并联' }}</span>
                </span>
                <span class="col-span-1 text-right font-mono text-xs text-foreground whitespace-nowrap">{{ fmtR(c.value) }}</span>
                <span class="col-span-2 text-right font-mono text-xs whitespace-nowrap" :class="devClass(devLevel(c.dev))">{{ fmtDevPct(c.dev) }}</span>
              </div>
            </div>

            <div class="flex items-center justify-between gap-2">
              <p class="text-xs text-muted-foreground leading-relaxed">
                <AlertTriangle class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-primary" />
                组合误差只是标称值误差：两只 1% 电阻组合的最坏合成容差约 ±2%（串联近似算术叠加），
                要稳定做到 ≤0.5% 匹配应选 0.1% 精度电阻，而不是靠更多组合筛选。
              </p>
              <button
                @click="copyCombo"
                class="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
              >
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
            </div>
          </template>
          <div v-else class="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            输入 0.1 Ω ~ 10 MΩ 范围内的目标阻值，搜索库存系列内的两电阻串 / 并联替代方案
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <Lightbulb class="w-4 h-4 mr-2 text-primary" /> 使用要点
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2 leading-relaxed list-disc pl-4">
            <li>优先选单只最近值：偏差 ≤±1% 可直接替换；±1~5% 需评估电路敏感度；>5% 建议走组合替代。</li>
            <li>组合替代先看串联（好买好算），再看并联（功率分担更均衡）；R1 ≤ R2 已去重，同值并联 R∥R = R/2 也是常用套路。</li>
            <li>E24×E96 混选会优先展示含 E24 档位的组合（更便宜易得），误差并列时排在前面。</li>
            <li>上拉 / 下拉、限流等场景对精度不敏感，E24 足够；取样分压、基准分压建议 E96 + 0.1% 精度。</li>
          </ul>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <CheckCircle class="w-4 h-4 mr-2 text-primary" /> 口径与自检锚点
          </h3>
          <ul class="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <li>• E24 基准表第 17 项 = 47、第 24 项 = 91</li>
            <li>• 4.9 kΩ → E24 最近 5.1 kΩ（+4.08%）、E96 最近 4.87 kΩ（−0.61%）</li>
            <li>• 100 Ω → E24 精确命中（0%）</li>
            <li>• 4.9 kΩ E24 组合最优：200 Ω + 4.7 kΩ 串联 = 4.9 kΩ（0%）</li>
            <li>• 12 kΩ ∥ 8.2 kΩ = 4.871 kΩ（−0.59%）</li>
          </ul>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <LinkIcon class="w-4 h-4 mr-2 text-primary" /> 相关工具
          </h3>
          <div class="space-y-2">
            <NuxtLink
              v-for="t in relatedLinks"
              :key="t.id"
              :to="'/tools/' + t.id"
              class="block px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm text-foreground transition"
            >{{ t.name }}</NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- 模块③：全系列速查表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Table class="w-5 h-5 mr-2 text-primary" /> E6~E96 全系列速查表
      </h2>
      <p class="text-xs text-muted-foreground mb-4">每系列一个 decade 的基准值（Ω 口径），乘以 10ⁿ（n = −2 ~ 6）即得 0.1 Ω ~ 10 MΩ 全档位，如 E24 基准 47 → 4.7 Ω / 470 Ω / 4.7 kΩ / 47 kΩ / 4.7 MΩ。</p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div v-for="s in quickSmall" :key="s.name" class="bg-muted/50 border border-border rounded-lg p-4">
          <div class="flex items-center justify-between mb-2.5">
            <span class="font-mono font-semibold text-foreground">{{ s.name }}</span>
            <span class="text-xs text-muted-foreground">{{ s.values.length }} 值 / decade</span>
          </div>
          <div class="flex flex-wrap gap-1">
            <span v-for="(v, i) in s.values" :key="i" class="px-1.5 py-0.5 rounded bg-card border border-border/50 font-mono text-xs text-foreground">{{ fmtMantissa(v) }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="s in quickLarge" :key="s.name" class="bg-muted/50 border border-border rounded-lg p-4">
          <div class="flex items-center justify-between mb-2.5">
            <span class="font-mono font-semibold text-foreground">{{ s.name }}</span>
            <span class="text-xs text-muted-foreground">{{ s.values.length }} 值 / decade</span>
          </div>
          <div class="grid grid-cols-2 gap-x-6">
            <ol class="space-y-0.5">
              <li v-for="(v, i) in s.values.slice(0, Math.ceil(s.values.length / 2))" :key="i" class="flex justify-between text-xs border-b border-border/40 py-0.5">
                <span class="text-muted-foreground">{{ i + 1 }}</span>
                <span class="font-mono text-foreground">{{ fmtMantissa(v) }}</span>
              </li>
            </ol>
            <ol class="space-y-0.5">
              <li v-for="(v, i) in s.values.slice(Math.ceil(s.values.length / 2))" :key="i" class="flex justify-between text-xs border-b border-border/40 py-0.5">
                <span class="text-muted-foreground">{{ Math.ceil(s.values.length / 2) + i + 1 }}</span>
                <span class="font-mono text-foreground">{{ fmtMantissa(v) }}</span>
              </li>
            </ol>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是 E 系列标准阻值？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          E 系列是 IEC 60063 定义的电子元件优先数系（E 系列标准阻值），用「E N」表示每个十倍程（decade）内均匀分布 N 个标称值：
          E6、E12、E24 主要对应 ±20%、±10%、±5% 容差电阻，E48、E96 对应 ±2%、±1% 精密电阻。每个系列的值按等比数列生成——
          第 n 个值为 10 的 n/N 次幂再取有效数字，例如 E96 的第 66 项 10^(66/96) ≈ 4.870，即常用的 4.87 kΩ、487 Ω、4.87 MΩ 等一整套档位。
          同一套基准值乘以 10 的任意整数次幂跨 decade 复用，所以记住一张 24 行的 E24 表就能覆盖全部数量级。
          （E192 系列因官方公布表存在舍入特例，本工具未内置。）
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>为什么用几何级数而不是等差数列？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          电阻的误差是「相对误差」：±5% 的 100 Ω 覆盖 95~105 Ω，±5% 的 1 kΩ 覆盖 950~1050 Ω。相邻档位的比值若恒定（E24 相邻比约 1.10~1.21），
          低档的上公差带与高档的下公差带恰好无缝衔接，任意阻值到最近档位的相对偏差都不超过容差的一半左右——等差数列做不到这一点：
          在小阻值端档位太疏、大阻值端档位又太密。这正是工程优先数系（Renard 系列）的设计思想，E 系列是它在电阻领域的落地。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>E24 和 E96 什么时候用？</h2>
        <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground leading-relaxed mb-4">
          <li><span class="text-foreground font-medium">E24（±5%）：</span>上拉 / 下拉电阻、限流电阻、滤波偏置等对绝对精度不敏感的场景，便宜且好买，优先考虑。</li>
          <li><span class="text-foreground font-medium">E96（±1%）：</span>取样分压（反馈网络）、电流检测、基准设定、有源滤波器增益网络等误差会直接进入传递函数的场景。</li>
          <li><span class="text-foreground font-medium">经验法则：</span>先查 E24 有没有可接受的最近值；偏差超过 ±1~2% 再升级 E96；E96 仍不达标（如要凑 4.9 kΩ 这种非标准值）就用两只电阻串并联组合替代。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>串并联替代的精度乘数效应</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          组合替代解决的是「标称值凑不出」，但它会引入容差叠加：串联 R1+R2 的最坏相对误差近似为两只电阻容差的算术和（两只 ±1% → 约 ±2%）；
          并联 R1·R2/(R1+R2) 的误差介于算术和与两者之差之间，通常略优于串联但不再有解析闭式。也就是说，
          用两只 1% 电阻凑出标称误差 0% 的 4.9 kΩ，实际批量分布仍可能偏离 ±2% 左右——如果电路真的需要 ≤0.5% 的匹配精度，
          正确做法是选 0.1% 精度电阻（贴片 E96 系列普遍提供 0.1% 档），组合搜索只是「手头只有库存料」时的替代手段。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>贴片三位码与 E 系列的关系</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          常见贴片电阻的三位数码 = 两位有效数字 + 十的幂次：104 = 10 × 10⁴ = 100 kΩ、472 = 47 × 10² = 4.7 kΩ、220 并不是 220 Ω 而是 22 × 10⁰ = 22 Ω。
          前两位有效数字正是从 E 系列表里取的——你不会看到 104 之外的「106」以外乱码，因为有效数字组合必须落在某个系列的基准表内
          （±5% 料用 E24 的两位数、±1% 料用 E96 的三位码，四位码如 1002 = 100 × 10² = 10 kΩ）。
          看到陌生丝印时可以用 <NuxtLink to="/tools/resistor-color-code" class="text-primary hover:underline">电阻色环计算器</NuxtLink>
          对照直插色环编码，两类编码的有效数字都源自同一张 E 系列基准表。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">4.9k 电阻怎么凑？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              最简单：200 Ω + 4.7 kΩ 串联 = 精确 4.9 kΩ（两只都是 E24 常见料）。并联方案：5.6 kΩ ∥ 39 kΩ ≈ 4.897 kΩ（−0.06%），
              12 kΩ ∥ 8.2 kΩ ≈ 4.871 kΩ（−0.59%）。若 E96 料可接受，4.87 kΩ 单只即 −0.61%。
              注意串联方案的容差叠加约为两只容差之和，批量精度要求高时选 0.1% 档。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">E24 和 E96 有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              E24 每 decade 有 24 个档位、对应 ±5% 容差；E96 每 decade 有 96 个档位、对应 ±1% 容差。
              档位密度提高 4 倍，任意阻值到最近 E96 档的最大偏差约 ±0.5%（E24 约 ±2%），代价是价格与采购便利性。
              例：目标 4.9 kΩ，E24 最近 5.1 kΩ 偏 +4.08%，E96 最近 4.87 kΩ 仅偏 −0.61%。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">两只电阻并联怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              并联公式 R = R1 × R2 / (R1 + R2)，即倒数相加 1/R = 1/R1 + 1/R2。技巧：两只相同阻值并联得一半（R∥R = R/2），
              一大一小并联时结果略小于小阻值那只（如 8.2 kΩ ∥ 120 kΩ ≈ 7.68 kΩ）。本工具的组合搜索会自动穷举窗口内所有
              R1 ≤ R2 的串并联组合并按误差排序。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">组合替代会影响电路精度吗？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              分两层看：标称值层面，组合可以做到比单只 E24 更准（甚至 0%）；容差层面，两只电阻的误差会叠加，
              串联最坏约 ±(t1+t2)。因此「标称 0% 但 ±2% 容差」的组合未必优于「标称 +4% 但 ±1% 容差」的单只精密电阻，
              要结合电路对分布（而不只是典型值）的敏感度决策。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'eseries-resistor-finder'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Target, Search, Calculator, Table, Info, Lightbulb,
  CheckCircle, Link as LinkIcon, ChevronUp, ChevronDown, Copy, AlertTriangle
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'eseries-resistor-finder'
const STORAGE_KEY = 'eseries-resistor-finder.inputs'

// SEO
useSeoMeta({
  title: 'E系列标准阻值查找 - E6/E12/E24/E48/E96 最近值与串并联组合替代',
  description: '在线 E 系列标准阻值查找器：任意阻值在 E6~E96 五个系列中的最近标准值与偏差评级，两电阻串并联组合替代搜索（Top 10 误差排序），E6~E96 全系列速查表，IEC 60063 口径，纯本地计算',
  keywords: 'E24标准阻值表, E96阻值表, 最接近标准电阻, 电阻串并联替代, 标准阻值计算器, e series resistor, resistor combination, IEC 60063',
  author: 'Util工具箱',
  ogTitle: 'E系列标准阻值查找 - 有条工具',
  ogDescription: 'E6~E96 最近标准值匹配、偏差评级与两电阻串并联组合替代搜索',
  ogUrl: 'https://www.util.cn/tools/eseries-resistor-finder',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'E系列标准阻值查找',
  twitterDescription: '最近标准值匹配与串并联组合替代搜索，IEC 60063 口径'
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
          name: 'E系列标准阻值查找',
          url: 'https://www.util.cn/tools/eseries-resistor-finder',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'E6/E12/E24/E48/E96 五系列最近值匹配',
            '偏差三档评级（≤±1% / ±1~5% / >5%）',
            '两电阻串并联组合替代 Top 10',
            'E24/E96/E24×E96 库存系列可选',
            '全系列每 decade 速查表'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: 'E系列标准阻值查找', item: 'https://www.util.cn/tools/eseries-resistor-finder/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '4.9k 电阻怎么凑？',
              acceptedAnswer: { '@type': 'Answer', text: '200 Ω + 4.7 kΩ 串联 = 精确 4.9 kΩ（均为 E24 常见料）；并联可用 5.6 kΩ ∥ 39 kΩ ≈ 4.897 kΩ（−0.06%）。批量精度要求高时选 0.1% 精度电阻。' }
            },
            {
              '@type': 'Question',
              name: 'E24 和 E96 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'E24 每 decade 24 个档位对应 ±5% 容差，E96 每 decade 96 个档位对应 ±1% 容差；目标 4.9 kΩ 时 E24 最近 5.1 kΩ 偏 +4.08%，E96 最近 4.87 kΩ 仅偏 −0.61%。' }
            },
            {
              '@type': 'Question',
              name: '两只电阻并联怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: 'R = R1 × R2 / (R1 + R2)，即倒数相加；两只相同阻值并联得一半阻值。' }
            },
            {
              '@type': 'Question',
              name: '组合替代会影响电路精度吗？',
              acceptedAnswer: { '@type': 'Answer', text: '组合可让标称值更准，但两只电阻容差会叠加（串联最坏约 ±t1+t2），需要分布精度时应选 0.1% 精度电阻而不是更多组合筛选。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === TOOL_ID)
onMounted(() => {
  addRecentTool(TOOL_ID)
  // 恢复上次输入
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (typeof s.nearVal === 'number') nearVal.value = s.nearVal
      if (typeof s.nearUnit === 'string') nearUnit.value = s.nearUnit
      if (typeof s.comboVal === 'number') comboVal.value = s.comboVal
      if (typeof s.comboUnit === 'string') comboUnit.value = s.comboUnit
      if (typeof s.comboLib === 'string') comboLib.value = s.comboLib
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})

// __PURE_FNS_START__
// ---------- IEC 60063 官方基准表（每 decade，×10ⁿ 跨档复用） ----------
const ESERIES = {
  E6: [10, 15, 22, 33, 47, 68],
  E12: [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82],
  E24: [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91],
  E48: [10, 10.5, 11, 11.5, 12.1, 12.7, 13.3, 14, 14.7, 15.4, 16.2, 16.9, 17.8, 18.7, 19.6, 20.5, 21.5, 22.6, 23.7, 24.9, 26.1, 27.4, 28.7, 30.1, 31.6, 33.2, 34.8, 36.5, 38.3, 40.2, 42.2, 44.2, 46.4, 48.7, 51.1, 53.6, 56.2, 59, 61.9, 64.9, 68.1, 71.5, 75, 78.7, 82.5, 86.6, 90.9, 95.3],
  E96: [10, 10.2, 10.5, 10.7, 11, 11.3, 11.5, 11.8, 12.1, 12.4, 12.7, 13, 13.3, 13.7, 14, 14.3, 14.7, 15, 15.4, 15.8, 16.2, 16.5, 16.9, 17.4, 17.8, 18.2, 18.7, 19.1, 19.6, 20, 20.5, 21, 21.5, 22.1, 22.6, 23.2, 23.7, 24.3, 24.9, 25.5, 26.1, 26.7, 27.4, 28, 28.7, 29.4, 30.1, 30.9, 31.6, 32.4, 33.2, 34, 34.8, 35.7, 36.5, 37.4, 38.3, 39.2, 40.2, 41.2, 42.2, 43.2, 44.2, 45.3, 46.4, 47.5, 48.7, 49.9, 51.1, 52.3, 53.6, 54.9, 56.2, 57.6, 59, 60.4, 61.9, 63.4, 64.9, 66.5, 68.1, 69.8, 71.5, 73.2, 75, 76.8, 78.7, 80.6, 82.5, 84.5, 86.6, 88.7, 90.9, 93.1, 95.3, 97.6]
}

const R_MIN = 0.1
const R_MAX = 1e7

// 3 位有效数字取整（验证口径：与 10^(n/N) 生成法在 E48/E96 完全一致）
const sig3 = (x) => {
  if (x === 0) return 0
  const e = Math.floor(Math.log10(Math.abs(x)))
  const m = x / Math.pow(10, e)
  return Math.round(m * 100) / 100 * Math.pow(10, e)
}

// 某系列在 [min, max] 内的全部标准值（升序）
const buildSeriesValues = (name, min, max) => {
  const base = ESERIES[name] || []
  const out = []
  for (let k = -2; k <= 7; k++) {
    const f = Math.pow(10, k)
    for (const b of base) {
      const v = b * f
      if (v >= min && v <= max) out.push(v)
    }
  }
  return out.sort((a, b) => a - b)
}

// 最近标准值（按相对/对数距离度量：几何级数与 ±% 容差带的自然口径，
// 算术正中点如 4900∈[4700,5100] 归 5100，与其 ±4.08% 容差带语义一致；同距取较低档）
const findNearest = (values, target) => {
  let best = null
  let bestDist = Infinity
  for (const v of values) {
    const dist = Math.abs(Math.log(v / target))
    if (dist < bestDist) {
      best = v
      bestDist = dist
    }
  }
  return best === null ? null : { value: best, dev: best / target - 1 }
}

// 库存系列取值（mix = E24 ∪ E96 去重，e24 标记用于「更简单」排序）
const buildLibValues = (lib, min, max) => {
  const map = new Map()
  const push = (name, e24) => {
    for (const v of buildSeriesValues(name, min, max)) {
      const key = v.toPrecision(12)
      const cur = map.get(key)
      if (cur) {
        if (e24) cur.e24 = true
      } else {
        map.set(key, { v, e24 })
      }
    }
  }
  if (lib === 'E24' || lib === 'mix') push('E24', true)
  if (lib === 'E96' || lib === 'mix') push('E96', false)
  return [...map.values()].sort((a, b) => a.v - b.v)
}

// 组合替代穷举：R1 ≤ R2 去重，串联 R1+R2 与并联 R1·R2/(R1+R2)，
// 按 |误差| 升序；误差并列时优先含 E24 档位（更简单易得）、串联优先、小阻值在前
const searchCombinations = (lib, target, topN) => {
  const min = target / 25
  const max = target * 10
  const libVals = buildLibValues(lib, min, max)
  const n = libVals.length
  const out = []
  for (let i = 0; i < n; i++) {
    const a = libVals[i].v
    for (let j = i; j < n; j++) {
      const b = libVals[j].v
      const s = a + b
      const p = (a * b) / (a + b)
      out.push({ type: 'series', a, b, ea: libVals[i].e24, eb: libVals[j].e24, value: s, dev: s / target - 1 })
      out.push({ type: 'parallel', a, b, ea: libVals[i].e24, eb: libVals[j].e24, value: p, dev: p / target - 1 })
    }
  }
  const simpleScore = (c) => ((c.ea ? 0 : 1) + (c.eb ? 0 : 1)) + (c.type === 'series' ? 0 : 0.5)
  const seriesFirst = (c) => (c.type === 'series' ? 0 : 1)
  out.sort((x, y) => {
    const dx = Math.abs(x.dev)
    const dy = Math.abs(y.dev)
    if (Math.abs(dx - dy) > 1e-12) return dx - dy
    const sx = simpleScore(x)
    const sy = simpleScore(y)
    if (sx !== sy) return sx - sy
    const fx = seriesFirst(x)
    const fy = seriesFirst(y)
    if (fx !== fy) return fx - fy
    if (x.a !== y.a) return x.a - y.a
    if (x.b !== y.b) return x.b - y.b
    return 0
  })
  return { items: out.slice(0, topN), windowCount: n, total: out.length }
}

// 展示格式化（避免浮点尾差）
const trimZeros = (s) => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s)
const fmtR = (v) => {
  if (!isFinite(v) || v <= 0) return '—'
  if (v >= 1e6) return trimZeros((v / 1e6).toPrecision(4)) + ' MΩ'
  if (v >= 1e3) return trimZeros((v / 1e3).toPrecision(4)) + ' kΩ'
  return trimZeros(v.toPrecision(4)) + ' Ω'
}
const fmtMantissa = (v) => String(Number(v.toFixed(2)))
const fmtDevPct = (dev) => (dev >= 0 ? '+' : '') + (dev * 100).toFixed(2) + '%'
const devLevel = (dev) => {
  const abs = Math.abs(dev) * 100
  if (abs <= 1) return 'ok'
  if (abs <= 5) return 'warn'
  return 'bad'
}
const devClass = (level) => (level === 'ok'
  ? 'text-green-600 dark:text-green-400'
  : level === 'warn' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400')
const devChipClass = (level) => (level === 'ok'
  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
  : level === 'warn' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' : 'bg-red-500/10 text-red-600 dark:text-red-400')
// __PURE_FNS_END__

// ---------- 状态 ----------
const units = [
  { k: 'Ω', f: 1 },
  { k: 'kΩ', f: 1e3 },
  { k: 'MΩ', f: 1e6 }
]
const libs = ['E24', 'E96', 'E24×E96']

const nearVal = ref(4.9)
const nearUnit = ref('kΩ')
const showSceneHint = ref(true)
const comboVal = ref(4.9)
const comboUnit = ref('kΩ')
const comboLib = ref('E24')

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const unitFactor = (k) => {
  const u = units.find((x) => x.k === k)
  return u ? u.f : 1
}

// 输入持久化（键前缀为工具 id）
watch([nearVal, nearUnit, comboVal, comboUnit, comboLib], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      nearVal: nearVal.value,
      nearUnit: nearUnit.value,
      comboVal: comboVal.value,
      comboUnit: comboUnit.value,
      comboLib: comboLib.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
})

const fillNear = (v, unit) => {
  nearVal.value = v
  nearUnit.value = unit
}

// ---------- 模块①：最近标准值 ----------
const nearOhms = computed(() => nearVal.value * unitFactor(nearUnit.value))
const nearValid = computed(() => isFinite(nearOhms.value) && nearOhms.value >= R_MIN && nearOhms.value <= R_MAX)

const SERIES_NAMES = ['E6', 'E12', 'E24', 'E48', 'E96']
const LEVEL_LABELS = { ok: '优 ≤±1%', warn: '可用 ±1~5%', bad: '偏离 >5%' }

const nearestRows = computed(() => {
  if (!nearValid.value) return []
  const t = nearOhms.value
  return SERIES_NAMES.map((name) => {
    const values = buildSeriesValues(name, R_MIN, R_MAX)
    const hit = findNearest(values, t)
    const level = devLevel(hit.dev)
    return { name, value: hit.value, dev: hit.dev, level, label: LEVEL_LABELS[level], text: fmtR(hit.value) }
  })
})

const e24Row = computed(() => nearestRows.value.find((r) => r.name === 'E24') || null)

const sceneHint = computed(() => {
  const row = e24Row.value
  if (!row) return ''
  const devPct = row.dev * 100
  if (Math.abs(devPct) < 0.005) {
    return `E24 已含 ${fmtR(row.value)} 精确档位（偏差 0%），无需替代，直接选用即可。`
  }
  const curDev = -devPct
  const worstDiv = Math.abs(devPct) * 2
  return `若接受 E24 最近值 ${row.text}（${fmtDevPct(row.dev)}）：限流场景电流约偏 ${curDev >= 0 ? '+' : ''}${curDev.toFixed(2)}%（I ∝ 1/R）；分压场景的分压比偏移取决于另一臂的偏差方向，两臂同为 E24 时最坏约 ±${worstDiv.toFixed(2)}%——对精度敏感的分压/取样网络建议改用 E96 档位。`
})

// ---------- 模块②：组合替代搜索 ----------
const comboOhms = computed(() => comboVal.value * unitFactor(comboUnit.value))
const comboValid = computed(() => isFinite(comboOhms.value) && comboOhms.value >= R_MIN && comboOhms.value <= R_MAX)

const comboResult = computed(() => {
  if (!comboValid.value) return { items: [], windowCount: 0, total: 0 }
  return searchCombinations(comboLib.value, comboOhms.value, 10)
})

const copyCombo = () => {
  const lines = comboResult.value.items.map((c, i) =>
    `${i + 1}. ${fmtR(c.a)} ${c.type === 'series' ? '+' : '∥'} ${fmtR(c.b)} = ${fmtR(c.value)}（${fmtDevPct(c.dev)}）`
  )
  const text = `目标 ${fmtR(comboOhms.value)}（${comboLib.value} 库存）串并联替代 Top10：\n${lines.join('\n')}`
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制组合替代结果到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动选择文本复制')
    })
  } else {
    alert('当前环境不支持剪贴板，请手动选择文本复制')
  }
}

// ---------- 速查表 ----------
const quickSmall = computed(() => [
  { name: 'E6', values: ESERIES.E6 },
  { name: 'E12', values: ESERIES.E12 },
  { name: 'E24', values: ESERIES.E24 }
])
const quickLarge = computed(() => [
  { name: 'E48', values: ESERIES.E48 },
  { name: 'E96', values: ESERIES.E96 }
])

// ---------- 相关工具 ----------
const relatedLinks = computed(() => ['resistor-color-code', 'ohms-law-calculator', 'capacitor-code-reader']
  .map((id) => tools.find((t) => t.id === id))
  .filter(Boolean))
</script>
