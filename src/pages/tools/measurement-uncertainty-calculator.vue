<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Ruler class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">测量不确定度评定</h1>
          <p class="text-sm text-muted-foreground mt-1">A 类/B 类分量评定 → 合成 uc → 有效自由度 νeff → 包含因子 k → 扩展不确定度 U = k·uc（JJF 1059.1 / GUM 口径）</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线测量不确定度评定计算器：粘贴重复测量列自动完成 A 类评定（贝塞尔实验标准差 s、uA = s/√n、自由度 νA = n−1），
        B 类分量按来源逐行录入（半宽 a 或直接给 u，正态 k=2 / k=3、均匀矩形 k=√3、三角 k=√6 四种分布），
        按 uc = √(Σuᵢ²) 合成，用 Welch–Satterthwaite 公式算有效自由度 νeff，查内置 t0.975 表得包含因子 k，
        输出扩展不确定度 U = k·uc、相对不确定度 E = U/|x̄|×100% 与结果表达式 X = (x̄ ± U) 单位。
        适合实验室期间核查、比对试验、校准结果表达与计量认证考核。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          以 <span class="font-semibold">JJF 1059.1 与 GUM 为准，本页按「各分量互不相关」假设合成</span>：
          分量间存在显著相关时应改用协方差合成；νeff &gt; 100 或 ∞ 时按工程惯例取 k = 2.00（略保守于 t(∞)=1.960）。
          正式报告的 U 通常修约至 1~2 位有效数字，本页展示 4 位有效数字便于核对。
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主区：A类 + B类 + 结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- A 类输入 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ListChecks class="w-5 h-5 mr-2 text-primary" /> 输入区一：测量列（A 类评定）
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            粘贴等精度重复测量的原始读数，支持多行 / 空格 / 逗号 / 分号 / 制表符分隔。n≥2 时按贝塞尔公式算实验标准差 s（除以 n−1）。
          </p>
          <textarea
            v-model="seriesText"
            rows="4"
            spellcheck="false"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="10.01&#10;9.99&#10;10.00&#10;10.02&#10;9.98"
          ></textarea>
          <div v-if="aInfo" class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="bg-muted/50 rounded-lg p-2.5 text-center">
              <p class="text-[10px] text-muted-foreground">n（次数）</p>
              <p class="text-base font-bold text-foreground font-mono">{{ aInfo.n }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-2.5 text-center">
              <p class="text-[10px] text-muted-foreground">均值 x̄</p>
              <p class="text-base font-bold text-foreground font-mono">{{ fmtSig(aInfo.mean, 6) }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-2.5 text-center">
              <p class="text-[10px] text-muted-foreground">s（贝塞尔 n−1）</p>
              <p class="text-base font-bold text-foreground font-mono">{{ aInfo.s === null ? '—' : fmtSig(aInfo.s, 6) }}</p>
            </div>
            <div class="bg-primary/10 rounded-lg p-2.5 text-center">
              <p class="text-[10px] text-muted-foreground">uA = s/√n（νA = {{ aInfo.nuA }}）</p>
              <p class="text-base font-bold text-primary font-mono">{{ aInfo.uA === null ? '—' : fmtSig(aInfo.uA, 6) }}</p>
            </div>
          </div>
          <p v-if="seriesInvalid.length" class="text-xs text-amber-600 dark:text-amber-400">
            已忽略无法识别的输入：{{ seriesInvalid.join('、') }}
          </p>
        </div>

        <!-- B 类分量表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Layers class="w-5 h-5 mr-2 text-primary" /> 输入区二：B 类分量表
            </h2>
            <button
              @click="addBRow"
              class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
            >
              <Plus class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 加一行
            </button>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            每行一个不确定度来源：选「半宽 a」时 u = a/k（k 由分布定）；选「直接 u」时按已评定标准不确定度取值。
            估计自由度 ν 留空表示 ∞（贡献 0 到 νeff 分母）。
          </p>

          <div class="hidden sm:grid grid-cols-[1.4fr_0.9fr_1fr_1.3fr_0.9fr_2rem] gap-2 px-1 text-[11px] font-medium text-muted-foreground">
            <span>来源名称</span><span>输入模式</span><span>半宽 a / u 值</span><span>分布</span><span>自由度 ν</span><span></span>
          </div>

          <div
            v-for="(b, bi) in bComps"
            :key="bi"
            class="grid grid-cols-2 sm:grid-cols-[1.4fr_0.9fr_1fr_1.3fr_0.9fr_2rem] gap-2 items-center px-1"
          >
            <input
              v-model="b.name"
              type="text"
              class="col-span-2 sm:col-span-1 px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              :placeholder="'来源 ' + (bi + 1) + '（如分辨力）'"
            />
            <select
              v-model="b.mode"
              class="px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="a">半宽 a</option>
              <option value="u">直接 u</option>
            </select>
            <input
              v-if="b.mode === 'a'"
              v-model="b.a"
              type="number"
              min="0"
              step="any"
              class="px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 0.01"
            />
            <input
              v-else
              v-model="b.u"
              type="number"
              min="0"
              step="any"
              class="px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 0.006"
            />
            <select
              v-model="b.dist"
              :disabled="b.mode === 'u'"
              class="px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-40"
            >
              <option v-for="d in B_DISTRIBUTIONS" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
            <input
              v-model="b.nu"
              type="number"
              min="1"
              step="1"
              class="px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="∞"
            />
            <button
              @click="removeBRow(bi)"
              class="justify-self-end p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition"
              :aria-label="'删除第' + (bi + 1) + '行'"
              title="删除本行"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 评定结果 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Calculator class="w-5 h-5 mr-2 text-primary" /> 评定结果
            </h2>
            <div class="flex gap-2">
              <button
                @click="loadExample"
                class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition"
              >
                <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 载入示例
              </button>
              <button
                @click="copyReport"
                :disabled="!result"
                class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle v-if="copyStatus === 'ok'" class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-green-600" />
                <Copy v-else class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" />
                {{ copyStatus === 'ok' ? '已复制' : '复制报告' }}
              </button>
            </div>
          </div>

          <template v-if="result">
            <!-- 分量表 -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-xs text-muted-foreground border-b border-border">
                    <th class="py-2 pr-3 font-medium">分量来源</th>
                    <th class="py-2 pr-3 font-medium">类型</th>
                    <th class="py-2 pr-3 font-medium">分布 / k</th>
                    <th class="py-2 pr-3 font-medium">标准不确定度 uᵢ</th>
                    <th class="py-2 font-medium">自由度 νᵢ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(c, ci) in result.comps" :key="ci" class="border-b border-border/50">
                    <td class="py-2 pr-3 text-foreground">{{ c.label }}</td>
                    <td class="py-2 pr-3">
                      <span
                        class="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        :class="c.type === 'A' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'"
                      >{{ c.type }} 类</span>
                    </td>
                    <td class="py-2 pr-3 text-xs text-muted-foreground">{{ c.distText }}</td>
                    <td class="py-2 pr-3 font-mono text-foreground">{{ fmtSig(c.u, 6) }}</td>
                    <td class="py-2 font-mono text-foreground">{{ Number.isFinite(c.nu) ? c.nu : '∞' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 合成与扩展 -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground">合成 uc = √(Σuᵢ²)</p>
                <p class="text-lg font-bold text-foreground font-mono mt-1">{{ fmtSig(result.uc, 6) }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground">有效自由度 νeff</p>
                <p class="text-lg font-bold text-foreground font-mono mt-1">{{ Number.isFinite(result.nuEff) ? fmtSig(result.nuEff, 4) : '∞' }}</p>
                <p v-if="Number.isFinite(result.nuEff)" class="text-[10px] text-muted-foreground mt-0.5">向下取整 → {{ Math.max(1, Math.floor(result.nuEff)) }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground">包含因子 k（t0.975）</p>
                <p class="text-lg font-bold text-foreground font-mono mt-1">{{ result.kText }}</p>
              </div>
              <div class="bg-primary/10 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground">扩展不确定度 U = k·uc</p>
                <p class="text-lg font-bold text-primary font-mono mt-1">± {{ fmtSig(result.U, 4) }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground">相对不确定度 E = U/|x̄| × 100%</p>
                <p class="text-lg font-bold text-foreground font-mono mt-1">{{ result.relPct === null ? '—（x̄ 为 0 或无测量列）' : fmtSig(result.relPct, 3) + '%' }}</p>
              </div>
              <div class="bg-primary/10 rounded-lg p-3 text-center">
                <p class="text-[10px] text-muted-foreground">结果表达式（单位自填）</p>
                <p class="text-lg font-bold text-primary font-mono mt-1">X = ({{ result.meanText }} ± {{ fmtSig(result.U, 4) }}) {{ unit || '单位' }}</p>
              </div>
            </div>

            <div>
              <label for="muc-unit" class="block text-xs text-muted-foreground mb-1">结果单位（自填，仅用于表达式显示）</label>
              <input
                id="muc-unit"
                v-model="unit"
                type="text"
                class="w-full sm:w-64 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 mm、g、°C"
              />
            </div>

            <p class="text-[11px] leading-relaxed text-muted-foreground">
              口径说明：各分量按互不相关合成；νeff 由 Welch–Satterthwaite 公式 uc⁴/Σ(uᵢ⁴/νᵢ) 计算（ν=∞ 的分量贡献 0，全 ∞ 时 νeff=∞）；
              νeff 有效且 ≤100 时查 t0.975 表并向下取整（保守），落在 30~40、40~50、50~100 区间时取较小 ν 档的 t 值；
              νeff=∞ 或 &gt;100 时取 k=2.00。正式报告建议将 U 修约至 1~2 位有效数字（如本例 U=0.02009 可报 0.021 或 0.02）。
            </p>
          </template>

          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法合成</p>
              <p class="text-xs text-muted-foreground mt-1">请在上方至少提供一个有效分量：测量列（n≥2）或 B 类半宽 a / u 值。</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 公式卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Sigma class="w-5 h-5 mr-2 text-primary" /> 全套公式速查
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border space-y-2 text-xs font-mono text-foreground leading-relaxed">
            <p>s = √( Σ(xᵢ−x̄)² / (n−1) )　贝塞尔</p>
            <p>uA = s / √n　　νA = n−1</p>
            <p>uB = a / k　　νB = 估计自由度</p>
            <p>uc = √( Σuᵢ² )　　（不相关）</p>
            <p>νeff = uc⁴ / Σ( uᵢ⁴/νᵢ )</p>
            <p>U = k · uc　　E = U/|x̄| × 100%</p>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            B 类的 k 由假设分布定：正态 k=2 或 3、均匀矩形 k=√3≈1.732、三角 k=√6≈2.449。分辨率/量化误差类来源几乎总是均匀分布。
          </p>
        </div>

        <!-- 分布怎么选 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> B 类分布怎么选
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">均匀矩形 k=√3</span>：数字仪表分辨力（半宽=半个分度值）、量化/舍入误差、只知上下限不知分布的容差。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">正态 k=2 / k=3</span>：制造厂证书给出扩展不确定度 U=k·ua 时按其 k 反算；容差按 ±3σ 口径给时用 k=3。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">三角 k=√6</span>：两个独立均匀分布合成（如手动居中读数）、渐变过程的限值。</span>
            </li>
          </ul>
        </div>

        <!-- 常见坑 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <AlertTriangle class="w-5 h-5 mr-2 text-amber-500" /> 评定红线
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">s 必须除以 n−1</span>：除以 n 是总体标准差口径，A 类评定必须用贝塞尔公式（n−1）。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">分辨力别漏</span>：数显仪器即使读数完全不动，分辨力带来的均匀分布分量仍然存在。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">相关分量不能这样合成</span>：强相关的分量（同源温度漂移等）应先合并或按协方差处理。</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 显著免责条 -->
    <div class="flex items-start gap-2 p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
        免责声明：本页按 JJF 1059.1 / GUM 通用口径实现，仅供学习、比对与内审估算；正式校准证书、CNAS 认可与验收评审请以现行标准文本和实验室质量体系要求为准。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>测量不确定度评定是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          测量不确定度评定是对「测量结果有多可信」的定量描述：真值以一定包含概率落在 (x̄ − U, x̄ + U) 区间内。
          评定按 JJF 1059.1《测量不确定度评定与表示》与 ISO GUM 的框架进行，把不确定度拆成若干分量——
          由重复测量统计得到的 A 类分量，和由经验、说明书、证书等信息估计的 B 类分量——先各自换算成标准不确定度 uᵢ，
          再按 uc = √(Σuᵢ²) 合成，最后乘包含因子 k 得到扩展不确定度 U。结果表达为 X = (x̄ ± U) 单位，
          例如 (10.00 ± 0.02) mm（k=2）。本页从测量列和 B 类分量表出发，一步算到 U 与相对不确定度，全部计算在浏览器本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">A 类与 B 类的区别</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          A 类分量来自统计：对同一量做 n 次独立重复测量，用贝塞尔公式算实验标准差 s = √(Σ(xᵢ−x̄)²/(n−1))，
          均值的标准不确定度 uA = s/√n，自由度 νA = n−1。注意必须除以 n−1——除以 n 得到的是单次读数的总体口径，
          会把不确定度低估。B 类分量来自非统计信息：仪器分辨力、最大允许误差、标准器证书值、温度波动等，
          按「分布 + 半宽」换算 uB = a/k：均匀（矩形）分布 k=√3，三角分布 k=√6，正态分布 k=2 或 3。
          两类分量只是信息来源不同，在合成公式里地位完全平等——都是标准不确定度 uᵢ，都带各自的自由度 νᵢ。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">GUM 与 JJF 1059.1 的关系</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          GUM（Guide to the Expression of Uncertainty in Measurement，ISO/IEC Guide 98-3）是国际上不确定度评定的总纲，
          确立了「分量—合成—扩展」的框架与报告方式。JJF 1059.1《测量不确定度评定与表示》是我国的计量技术规范，
          在 GUM 框架下结合国内计量实际细化了 A/B 类评定的操作细节、有效自由度取舍与结果表达规则，
          是 CNAS 实验室与计量检定/校准工作的依据口径。两者在常用场景下结论一致：合成用方和根（不相关假设），
          扩展用 t 分布包含因子或 k=2 惯例，报告时 U 修约 1~2 位有效数字、x̄ 与 U 的末位对齐。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Welch–Satterthwaite 公式与 νeff 向下取整</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          合成后的 uc 需要知道「它服从什么分布」才能定包含因子 k。Welch–Satterthwaite 公式用各分量的自由度加权估计合成自由度：
          νeff = uc⁴ / Σ(uᵢ⁴/νᵢ)。分母里 ν=∞ 的分量（如分辨力，通常按 ∞ 处理）贡献为 0；若所有分量自由度都是 ∞，则 νeff=∞。
          得到 νeff 后查 t 分布 t0.975（双侧 95%）表得 k。本页取「向下取整」的保守口径：νeff=11.11 → 取 t(11)；
          νeff 落在 30~40、40~50、50~100 之间时取较小 ν 档的 t 值（t 随 ν 减小而增大，取小 ν 即取大 k，偏保守）；
          νeff &gt; 100 或 ∞ 时按工程惯例直接取 k=2.00（略保守于 t(∞)=1.960，且与大多数证书的 k=2 表达兼容）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">内置 t0.975 表（双侧 95%）</h3>
        <div class="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-1.5 mt-3">
          <div v-for="row in T_TABLE_ROWS" :key="'t' + row[0]" class="bg-muted/50 border border-border rounded-md px-2 py-1.5 text-center">
            <p class="text-[10px] text-muted-foreground">ν = {{ row[0] === Infinity ? '∞' : row[0] }}</p>
            <p class="text-xs font-mono font-semibold text-foreground">{{ row[1].toFixed(3) }}</p>
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
          自核锚点：t(1)=12.706、t(4)=2.776、t(10)=2.228、t(11)=2.201、t(∞)=1.960。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">k=2 一定对应 95% 包含概率吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">只有当合成分布足够接近正态（自由度→∞）时，k=2 才对应约 95.45%。自由度有限时应查 t 表：如 νeff=11 时 k=2.201，νeff=4 时 k=2.776——自由度越小，同样的「95%」要乘越大的 k。本工具在 νeff≤100 时自动查表，νeff&gt;100 或 ∞ 时按惯例取 2.00。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">B 类分布不知道该怎么选怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">经验法则：数字仪表分辨力、量化误差、只知上下限的容差选均匀（k=√3，最保守常用）；证书/手册给出扩展不确定度时按其 k 反算（通常 k=2）；两个独立均匀因素叠加或手动居中读数选三角（k=√6）。拿不准时选 k 更小的分布（均匀）会让结果偏保守。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">我的测量数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。测量列与 B 类分量全部在你的浏览器本地计算与保存（设置仅存在本地 localStorage），不发送任何网络请求，刷新页面可恢复上次输入。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'measurement-uncertainty-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Ruler, Info, AlertTriangle, ChevronUp, ChevronDown,
  Copy, CheckCircle, Play, Plus, Trash2, ListChecks, Sigma, Calculator, Layers
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// ---------- t 分布双侧 95%（t0.975）临界值表：ν=1..30,40,50,100（JJF 1059.1 / GUM 附录口径） ----------
// 自核锚点：t(1)=12.706、t(4)=2.776、t(10)=2.228、t(11)=2.201、t(∞)=1.960（正态极限）
const T_TABLE_975 = {
  1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306,
  9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
  16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086, 21: 2.080, 22: 2.074,
  23: 2.069, 24: 2.064, 25: 2.060, 26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045,
  30: 2.042, 40: 2.021, 50: 2.009, 100: 1.984
}
const T_TABLE_INF = 1.960
// 展示用行数组（含 ∞ 行，仅作信息展示；νeff=∞ 时工程惯例 k=2.00）
const T_TABLE_ROWS = Object.keys(T_TABLE_975)
  .map((k) => [Number(k), T_TABLE_975[k]])
  .concat([[Infinity, T_TABLE_INF]])

// ---------- B 类分布：k 因子 ----------
const B_DISTRIBUTIONS = [
  { id: 'normal2', name: '正态（k=2）', k: 2 },
  { id: 'normal3', name: '正态（k=3）', k: 3 },
  { id: 'rect', name: '均匀矩形（k=√3）', k: Math.sqrt(3) },
  { id: 'tri', name: '三角（k=√6）', k: Math.sqrt(6) }
]

// 解析测量列：多行 / 空格 / 逗号 / 分号 / 制表符（含中文逗号顿号）分隔
function parseSeriesText(text) {
  if (typeof text !== 'string') return { values: [], invalid: [] }
  const tokens = text.split(/[\s,;，；、]+/).filter((t) => t !== '')
  const values = []
  const invalid = []
  for (const tk of tokens) {
    const v = Number(tk)
    if (Number.isFinite(v)) values.push(v)
    else invalid.push(tk)
  }
  return { values, invalid }
}

// A 类评定：n、均值 x̄、贝塞尔实验标准差 s（除以 n−1）、uA = s/√n、自由度 νA = n−1
function classAStats(values) {
  const n = values.length
  if (n === 0) return null
  let sum = 0
  for (const v of values) sum += v
  const mean = sum / n
  if (n < 2) return { n, mean, s: null, uA: null, nuA: null }
  let ss = 0
  for (const v of values) {
    const d = v - mean
    ss += d * d
  }
  const s = Math.sqrt(ss / (n - 1)) // 贝塞尔公式（n−1）
  const uA = s / Math.sqrt(n)
  return { n, mean, s, uA, nuA: n - 1 }
}

// 单个 B 类分量 → { u, nu }：半宽模式 u=a/k；直接模式 u=输入值。ν 空/非法 → ∞
// 注意 Number('') === 0，空字符串必须显式判为无效（否则空行会混进 u=0 的假分量）
function classBU(comp) {
  const nuRaw = Number(comp.nu)
  const nu = comp.nu === '' || comp.nu === null || comp.nu === undefined || !Number.isFinite(nuRaw) || nuRaw <= 0
    ? Infinity
    : Math.floor(nuRaw)
  if (comp.mode === 'u') {
    if (comp.u === '' || comp.u === null || comp.u === undefined) return null
    const u = Number(comp.u)
    if (!Number.isFinite(u) || u < 0) return null
    return { u, nu }
  }
  if (comp.a === '' || comp.a === null || comp.a === undefined) return null
  const a = Number(comp.a)
  if (!Number.isFinite(a) || a < 0) return null
  const dist = B_DISTRIBUTIONS.find((d) => d.id === comp.dist) || B_DISTRIBUTIONS[2]
  return { u: a / dist.k, nu }
}

// 合成：uc = √(Σuᵢ²)（不相关假设）；Welch–Satterthwaite νeff = uc⁴/Σ(uᵢ⁴/νᵢ)，ν=∞ 项贡献 0，全 ∞ → νeff=∞
function combineComponents(us) {
  let ss = 0
  let sumQuart = 0
  let hasFiniteNu = false
  for (const c of us) {
    if (!(c.u > 0)) continue
    ss += c.u * c.u
    if (Number.isFinite(c.nu) && c.nu > 0) {
      hasFiniteNu = true
      sumQuart += (c.u ** 4) / c.nu
    }
  }
  const uc = Math.sqrt(ss)
  if (!(uc > 0)) return { uc: 0, nuEff: Infinity }
  const nuEff = hasFiniteNu && sumQuart > 0 ? (uc ** 4) / sumQuart : Infinity
  return { uc, nuEff }
}

// 包含因子 k：νeff 有效且 ≤100 → 查 t0.975 表（向下取整，落在表间断档取较小 ν 档，保守）；
// νeff=∞ 或 >100 → k=2.00（工程惯例，略保守于 t(∞)=1.960）
function kFromNuEff(nuEff) {
  if (!Number.isFinite(nuEff) || nuEff > 100) return 2.00
  const v = Math.max(1, Math.floor(nuEff))
  if (v === 100) return 1.984
  if (v >= 51) return T_TABLE_975[50]
  if (v >= 41) return T_TABLE_975[40]
  if (v >= 31) return T_TABLE_975[30]
  return T_TABLE_975[v] || 2.00
}

// 完整评定：A 类（可选）+ B 类分量表 → 分量清单、uc、νeff、k、U、E
function evaluateUncertainty(values, bComps) {
  const a = classAStats(values)
  const comps = []
  if (a && a.uA !== null) {
    comps.push({ label: '测量列重复性', type: 'A', u: a.uA, nu: a.nuA, distText: '正态（统计）' })
  }
  const ignored = []
  bComps.forEach((b, i) => {
    const r = classBU(b)
    if (r === null) {
      if (b.mode === 'a' ? b.a !== '' : b.u !== '') ignored.push(i + 1)
      return
    }
    const dist = B_DISTRIBUTIONS.find((d) => d.id === b.dist) || B_DISTRIBUTIONS[2]
    const kText = b.mode === 'u' ? '直接给定' : `k=${Number(dist.k.toFixed(4))}`
    comps.push({ label: b.name || `B类分量 ${i + 1}`, type: 'B', u: r.u, nu: r.nu, distText: kText })
  })
  const used = comps.filter((c) => c.u > 0)
  const { uc, nuEff } = combineComponents(used)
  const valid = uc > 0
  const k = valid ? kFromNuEff(nuEff) : 2.00
  const U = k * uc
  const mean = a ? a.mean : null
  const relPct = valid && mean !== null && mean !== 0 ? (U / Math.abs(mean)) * 100 : null
  const kText = (!Number.isFinite(nuEff) || nuEff > 100) ? '2.00（惯例）' : String(k)
  const meanText = mean === null ? 'x̄' : String(Number(mean.toPrecision(6)))
  return { a, comps, ignored, uc, nuEff, k, U, mean, relPct, valid, kText, meanText }
}

// 有效数字格式化（展示用）
function fmtSig(v, sig = 6) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  return String(Number(v.toPrecision(sig)))
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '测量不确定度评定计算器 - A类B类分量·合成uc·扩展不确定度U在线计算',
  description: '在线测量不确定度评定工具：粘贴测量列自动算A类（贝塞尔s、uA=s/√n、νA=n−1），B类分量按正态k=2/3、均匀√3、三角√6分布换算，合成标准不确定度uc、Welch-Satterthwaite有效自由度νeff、t0.975表包含因子k与扩展不确定度U=k·uc、相对不确定度E，JJF 1059.1/GUM口径，纯浏览器本地运行。',
  keywords: '测量不确定度评定,不确定度计算,A类不确定度,B类不确定度,合成标准不确定度,扩展不确定度,JJF1059.1,有效自由度,包含因子,Welch-Satterthwaite',
  author: '有条工具',
  ogTitle: '测量不确定度评定计算器 - A类B类分量·合成·扩展不确定度 | 有条工具',
  ogDescription: 'A类/B类分量评定到合成 uc、有效自由度 νeff、包含因子 k 与扩展不确定度 U，JJF 1059.1/GUM 口径，内置 t0.975 表。',
  ogUrl: 'https://www.util.cn/tools/measurement-uncertainty-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '测量不确定度评定计算器',
  twitterDescription: 'A类/B类分量评定到合成 uc、νeff、k 与扩展不确定度 U，JJF 1059.1/GUM 口径。'
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
          name: '测量不确定度评定计算器',
          url: 'https://www.util.cn/tools/measurement-uncertainty-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'A 类评定：测量列粘贴→n、x̄、贝塞尔 s、uA=s/√n、νA=n−1',
            'B 类分量表：半宽 a 或直接 u，正态 k=2/3、均匀 k=√3、三角 k=√6',
            '合成标准不确定度 uc=√(Σuᵢ²)（不相关假设）',
            'Welch-Satterthwaite 有效自由度 νeff 与向下取整保守口径',
            '内置 t0.975 表（ν=1..30,40,50,100,∞）自动定包含因子 k',
            '扩展不确定度 U=k·uc、相对不确定度 E 与结果表达式',
            '评定报告一键复制，本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '测量不确定度评定', item: 'https://www.util.cn/tools/measurement-uncertainty-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'k=2 一定对应 95% 包含概率吗？',
              acceptedAnswer: { '@type': 'Answer', text: '只有合成分布接近正态（自由度→∞）时 k=2 才对应约 95.45%。自由度有限时应查 t 表：νeff=11 时 k=2.201，νeff=4 时 k=2.776。本工具在 νeff≤100 时自动查 t0.975 表，νeff>100 或 ∞ 时按工程惯例取 k=2.00。' }
            },
            {
              '@type': 'Question',
              name: 'B 类分布不知道该怎么选怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '经验法则：数字仪表分辨力、量化误差、只知上下限的容差选均匀矩形（k=√3）；证书/手册给出扩展不确定度时按其 k 反算（通常 k=2）；两个独立均匀因素叠加或手动居中读数选三角（k=√6）。拿不准时选 k 更小的均匀分布结果偏保守。' }
            },
            {
              '@type': 'Question',
              name: '我的测量数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。测量列与 B 类分量全部在浏览器本地计算，设置仅保存在本地 localStorage，不发送任何网络请求。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'measurement-uncertainty-calculator'
const SETTINGS_KEY = `${TOOL_ID}-settings`

// ---------- 状态 ----------
const seriesText = ref('10.01\n9.99\n10.00\n10.02\n9.98')
const unit = ref('mm')
const bComps = ref([
  { name: 'B类示例', mode: 'a', a: '0.01', u: '', dist: 'rect', nu: '' }
])
const copyStatus = ref('idle')
const seoContentVisible = ref(true)

// ---------- 计算链 ----------
const parsedSeries = computed(() => parseSeriesText(seriesText.value))
const seriesInvalid = computed(() => parsedSeries.value.invalid)
const aInfo = computed(() => classAStats(parsedSeries.value.values))

const result = computed(() => {
  const r = evaluateUncertainty(parsedSeries.value.values, bComps.value)
  return r.valid ? r : null
})

function addBRow() {
  bComps.value.push({ name: '', mode: 'a', a: '', u: '', dist: 'rect', nu: '' })
}
function removeBRow(i) {
  bComps.value.splice(i, 1)
}
function loadExample() {
  seriesText.value = '10.01\n9.99\n10.00\n10.02\n9.98'
  bComps.value = [{ name: 'B类示例', mode: 'a', a: '0.01', u: '', dist: 'rect', nu: '' }]
  unit.value = 'mm'
  trackEvent('工具结果', '载入示例', TOOL_ID)
}

// ---------- 复制报告（clipboard + 状态条，浏览器 API 仅在回调中） ----------
function buildReportText() {
  const r = result.value
  if (!r) return ''
  const lines = []
  lines.push('测量不确定度评定报告（JJF 1059.1 / GUM 口径）')
  lines.push(`测量列：${parsedSeries.value.values.join(', ')}`)
  if (r.a) {
    lines.push(`A类：n=${r.a.n}，x̄=${fmtSig(r.a.mean, 6)}，s=${r.a.s === null ? '—' : fmtSig(r.a.s, 6)}，uA=${r.a.uA === null ? '—' : fmtSig(r.a.uA, 6)}，νA=${r.a.nuA}`)
  }
  for (const c of r.comps) {
    if (c.type === 'B') lines.push(`B类[${c.label}]：u=${fmtSig(c.u, 6)}，ν=${Number.isFinite(c.nu) ? c.nu : '∞'}（${c.distText}）`)
  }
  lines.push(`合成 uc=${fmtSig(r.uc, 6)}；νeff=${Number.isFinite(r.nuEff) ? fmtSig(r.nuEff, 4) : '∞'}；k=${r.kText}`)
  lines.push(`扩展 U=k·uc=± ${fmtSig(r.U, 4)} ${unit.value}；E=${r.relPct === null ? '—' : fmtSig(r.relPct, 3) + '%'}`)
  lines.push(`结果表达式：X = (${r.meanText} ± ${fmtSig(r.U, 4)}) ${unit.value}`)
  return lines.join('\n')
}

let copyTimer = null
async function copyReport() {
  const text = buildReportText()
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copyStatus.value = 'ok'
    trackEvent('工具结果', '复制', TOOL_ID)
  } catch (err) {
    copyStatus.value = 'fail'
    alert('复制失败：浏览器未授权剪贴板，请手动选择结果复制。')
  }
  if (copyTimer !== null) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copyStatus.value = 'idle'; copyTimer = null }, 1600)
}

// ---------- SEO 折叠 ----------
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 设置持久化（localStorage 仅 onMounted / 用户交互回调触达，SSR 安全） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (typeof s.seriesText === 'string') seriesText.value = s.seriesText
    if (typeof s.unit === 'string') unit.value = s.unit
    if (Array.isArray(s.bComps)) {
      const rows = s.bComps
        .filter((b) => b && typeof b === 'object')
        .map((b) => ({
          name: typeof b.name === 'string' ? b.name : '',
          mode: b.mode === 'u' ? 'u' : 'a',
          a: typeof b.a === 'string' || typeof b.a === 'number' ? String(b.a) : '',
          u: typeof b.u === 'string' || typeof b.u === 'number' ? String(b.u) : '',
          dist: B_DISTRIBUTIONS.some((d) => d.id === b.dist) ? b.dist : 'rect',
          nu: typeof b.nu === 'string' || typeof b.nu === 'number' ? String(b.nu) : ''
        }))
      if (rows.length) bComps.value = rows
    }
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([seriesText, unit, bComps], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      seriesText: seriesText.value,
      unit: unit.value,
      bComps: bComps.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
}, { deep: true })

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})
</script>
