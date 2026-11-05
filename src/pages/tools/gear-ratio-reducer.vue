<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部区 -->
    <div class="mb-6">
      <div class="flex items-start gap-3 mb-3">
        <div class="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <component :is="toolIcon" class="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground mb-1">减速比计算器 - 齿轮减速比与转速扭矩级联换算</h1>
          <p class="text-muted-foreground">单级速比 i = Z₂/Z₁ 一键换算输出转速与扭矩（含效率 η），多级级联自动连乘总速比与总效率，反向由目标转速求所需减速比，纯本地计算。</p>
        </div>
      </div>
      <p class="text-sm text-muted-foreground">功率不变视角：P = T×n/9550 守恒扣损耗，减速增扭不增功率；附常见减速器档位（单级 ≤10、两级 ≤60、蜗轮 100+）与自锁注记。</p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        口径：速比 i = 从动齿数 Z₂ / 主动齿数 Z₁（即转速比 n₁/n₂）；扭矩 T₂ = T₁×i×η，单级齿轮效率按 0.95~0.98 取值；
        功率 P(kW) = T(N·m)×n(rpm)/9550。级联时总速比 = 各级连乘、总效率 = 各级相乘（损耗独立叠加）。
        链轮、同步带轮速比同样按齿数比计算；齿条为旋转转直线，不适用速比。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 计算模式
        </h2>

        <!-- 模式切换 -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          <button
            @click="mode = 'single'"
            :class="mode === 'single' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-sm font-medium transition-all"
          >单级传动</button>
          <button
            @click="mode = 'cascade'"
            :class="mode === 'cascade' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-sm font-medium transition-all"
          >多级级联</button>
          <button
            @click="mode = 'reverse'"
            :class="mode === 'reverse' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-sm font-medium transition-all"
          >反向求速比</button>
        </div>

        <!-- 模式一：单级传动 -->
        <template v-if="mode === 'single'">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label for="gr-z1" class="block text-sm font-medium text-foreground mb-1.5">主动齿数 Z₁</label>
              <input
                id="gr-z1"
                v-model.number="z1"
                type="number"
                min="5"
                max="500"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 20"
              >
            </div>
            <div>
              <label for="gr-z2" class="block text-sm font-medium text-foreground mb-1.5">从动齿数 Z₂</label>
              <input
                id="gr-z2"
                v-model.number="z2"
                type="number"
                min="5"
                max="500"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 80"
              >
            </div>
            <div>
              <label for="gr-n1" class="block text-sm font-medium text-foreground mb-1.5">输入转速 n₁（rpm）</label>
              <input
                id="gr-n1"
                v-model.number="n1"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 1440"
              >
            </div>
            <div>
              <label for="gr-t1" class="block text-sm font-medium text-foreground mb-1.5">输入扭矩 T₁（N·m）</label>
              <input
                id="gr-t1"
                v-model.number="t1"
                type="number"
                min="0"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 5"
              >
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label for="gr-eta" class="block text-sm font-medium text-foreground">单级效率 η</label>
              <span class="text-sm font-mono text-primary font-semibold">{{ fmtNum(singleEta, 3) }}</span>
            </div>
            <input
              id="gr-eta"
              v-model.number="singleEta"
              type="range"
              min="0.95"
              max="0.98"
              step="0.005"
              class="w-full accent-primary"
            >
            <div class="flex justify-between text-[11px] text-muted-foreground">
              <span>0.95</span>
              <span>单级圆柱齿轮典型 0.95~0.98（斜齿取高值）</span>
              <span>0.98</span>
            </div>
          </div>

          <div v-if="singleResult" class="space-y-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <p class="text-sm text-muted-foreground mb-1">速比 i = Z₂/Z₁（减速为 i&gt;1）</p>
              <p class="text-3xl font-bold text-primary font-mono">{{ fmtNum(singleResult.i, 4) }}</p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div class="p-2.5 rounded-lg bg-muted/60">
                <p class="text-[11px] text-muted-foreground mb-0.5">输出转速 n₂ = n₁/i</p>
                <p class="font-mono text-sm text-foreground">{{ fmtNum(singleResult.n2, 2) }} rpm</p>
              </div>
              <div class="p-2.5 rounded-lg bg-muted/60">
                <p class="text-[11px] text-muted-foreground mb-0.5">输出扭矩 T₂ = T₁·i·η</p>
                <p class="font-mono text-sm text-foreground">{{ fmtNum(singleResult.t2, 3) }} N·m</p>
              </div>
              <div class="p-2.5 rounded-lg bg-muted/60">
                <p class="text-[11px] text-muted-foreground mb-0.5">输入功率 P₁ = T₁n₁/9550</p>
                <p class="font-mono text-sm text-foreground">{{ fmtNum(singleResult.p1, 3) }} kW</p>
              </div>
              <div class="p-2.5 rounded-lg bg-muted/60">
                <p class="text-[11px] text-muted-foreground mb-0.5">输出功率 P₂ = η·P₁</p>
                <p class="font-mono text-sm text-foreground">{{ fmtNum(singleResult.p2, 3) }} kW</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed p-2.5 rounded-lg bg-muted/50">
              功率不变视角：T×n 守恒扣损耗——转速降为 1/{{ fmtNum(singleResult.i, 2) }}，扭矩放大 {{ fmtNum(singleResult.i, 2) }} 倍再乘 η；
              损耗功率 {{ fmtNum(singleResult.p1 - singleResult.p2, 3) }} kW 转化为发热与摩擦，这就是减速器需要润滑的原因。
            </p>
          </div>
          <div v-else class="p-8 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
            请输入 5~500 之间的整数齿数
          </div>
        </template>

        <!-- 模式二：多级级联 -->
        <template v-else-if="mode === 'cascade'">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="gr-c-n1" class="block text-sm font-medium text-foreground mb-1.5">输入转速 n₁（rpm）</label>
              <input
                id="gr-c-n1"
                v-model.number="n1"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 1440"
              >
            </div>
            <div>
              <label for="gr-c-t1" class="block text-sm font-medium text-foreground mb-1.5">输入扭矩 T₁（N·m）</label>
              <input
                id="gr-c-t1"
                v-model.number="t1"
                type="number"
                min="0"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 5"
              >
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-foreground">各级传动（齿数对 + 每级效率）</label>
              <div class="flex gap-2">
                <button
                  @click="loadCascadeExample"
                  class="px-2.5 py-1 rounded-lg text-xs bg-muted hover:bg-muted/80 text-muted-foreground transition"
                >示例：两级 4×5</button>
                <button
                  @click="addStage"
                  class="px-2.5 py-1 rounded-lg text-xs bg-primary text-primary-foreground hover:opacity-90 transition"
                >+ 添加一级</button>
              </div>
            </div>
            <div class="space-y-2">
              <div
                v-for="(stage, idx) in stages"
                :key="idx"
                class="flex items-center gap-2"
              >
                <span class="text-xs text-muted-foreground w-12 flex-shrink-0">第 {{ idx + 1 }} 级</span>
                <input
                  v-model.number="stage.zA"
                  type="number"
                  min="5"
                  max="500"
                  step="1"
                  :aria-label="`第 ${idx + 1} 级主动齿数`"
                  class="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="主动 Z"
                >
                <span class="text-xs text-muted-foreground">:</span>
                <input
                  v-model.number="stage.zB"
                  type="number"
                  min="5"
                  max="500"
                  step="1"
                  :aria-label="`第 ${idx + 1} 级从动齿数`"
                  class="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="从动 Z"
                >
                <input
                  v-model.number="stage.eta"
                  type="number"
                  min="0.5"
                  max="1"
                  step="0.01"
                  :aria-label="`第 ${idx + 1} 级效率`"
                  class="w-20 px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  title="该级效率 η"
                >
                <span class="text-xs text-muted-foreground flex-shrink-0">i={{ stageRatioText(stage) }}</span>
                <button
                  v-if="stages.length > 1"
                  @click="removeStage(idx)"
                  class="w-7 h-7 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition flex-shrink-0"
                  :aria-label="`删除第 ${idx + 1} 级`"
                  title="删除该级"
                >×</button>
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground mt-1.5">每行 = 一级齿轮副（主动 : 从动）+ 该级效率；总速比 = 各级 i 连乘，总效率 = 各级 η 相乘。</p>
          </div>

          <div v-if="cascadeResult" class="space-y-3">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div class="p-3 rounded-lg border border-primary/30 bg-primary/10">
                <p class="text-[11px] text-muted-foreground mb-0.5">总速比 Πi</p>
                <p class="font-mono text-xl font-bold text-primary">{{ fmtNum(cascadeResult.totalRatio, 4) }}</p>
              </div>
              <div class="p-3 rounded-lg border border-border bg-muted/50">
                <p class="text-[11px] text-muted-foreground mb-0.5">总效率 Πη</p>
                <p class="font-mono text-xl font-bold text-foreground">{{ fmtNum(cascadeResult.totalEta, 4) }}</p>
              </div>
              <div class="p-3 rounded-lg border border-border bg-muted/50">
                <p class="text-[11px] text-muted-foreground mb-0.5">末级输出转速</p>
                <p class="font-mono text-xl font-bold text-foreground">{{ fmtNum(cascadeResult.outRpm, 2) }} <span class="text-xs">rpm</span></p>
              </div>
              <div class="p-3 rounded-lg border border-border bg-muted/50">
                <p class="text-[11px] text-muted-foreground mb-0.5">末级输出扭矩</p>
                <p class="font-mono text-xl font-bold text-foreground">{{ fmtNum(cascadeResult.outTorque, 2) }} <span class="text-xs">N·m</span></p>
              </div>
            </div>
            <div v-if="cascadeResult.stageLines.length" class="text-xs text-muted-foreground p-2.5 rounded-lg bg-muted/50 font-mono leading-relaxed">
              <p v-for="(line, idx) in cascadeResult.stageLines" :key="idx">{{ line }}</p>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              级联越多总效率越低（每级都要打一次折），所以能用两级不要用三级；大速比需求可对比蜗轮方案（单级 10~100+，但效率 0.7~0.9 且大速比时易自锁）。
            </p>
          </div>
          <div v-else class="p-8 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
            请至少输入一组 5~500 之间的整数齿数对
          </div>
        </template>

        <!-- 模式三：反向求速比 -->
        <template v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="gr-r-motor" class="block text-sm font-medium text-foreground mb-1.5">电机转速 n₁（rpm）</label>
              <input
                id="gr-r-motor"
                v-model.number="revMotor"
                type="number"
                min="1"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 1440"
              >
              <p class="text-xs text-muted-foreground mt-1">4 极异步电机满载约 1440，伺服按额定取</p>
            </div>
            <div>
              <label for="gr-r-target" class="block text-sm font-medium text-foreground mb-1.5">目标输出转速 n₂（rpm）</label>
              <input
                id="gr-r-target"
                v-model.number="revTarget"
                type="number"
                min="0.1"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 60"
              >
            </div>
          </div>

          <div v-if="reverseResult" class="space-y-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <p class="text-sm text-muted-foreground mb-1">所需总速比 i = n₁/n₂</p>
              <p class="text-3xl font-bold text-primary font-mono">{{ fmtNum(reverseResult.i, 4) }} : 1</p>
            </div>
            <div class="p-3 rounded-lg bg-muted/60 text-sm text-foreground leading-relaxed">
              {{ reverseResult.hint }}
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed p-2.5 rounded-lg bg-muted/50">
              拿到总速比后按"多级级联"拆分到各级（尽量让各级速比接近，如 i=20 拆成 4×5），
              再回单级模式核算末级转速与扭矩。齿轮几何（模数、中心距）用
              <NuxtLink to="/tools/gear-module-calculator" class="text-primary hover:underline">齿轮模数计算器</NuxtLink>。
            </p>
          </div>
          <div v-else class="p-8 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
            请输入大于 0 的电机转速与目标转速
          </div>
        </template>

        <!-- 复制结果 -->
        <div class="pt-1">
          <button
            v-if="copyText"
            @click="copyResults"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition"
          >
            <Copy v-if="!copied" class="w-3.5 h-3.5" />
            <Check v-else class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            {{ copied ? '已复制' : '复制结果' }}
          </button>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 常见减速器档位 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Gauge class="w-4 h-4 text-primary mr-1.5" /> 常见减速器档位口径
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-muted-foreground border-b border-border">
                  <th class="text-left py-2 pr-2 font-medium">形式</th>
                  <th class="text-right py-2 px-2 font-medium">常用速比</th>
                  <th class="text-right py-2 pl-2 font-medium">单级效率</th>
                </tr>
              </thead>
              <tbody class="text-foreground">
                <tr class="border-b border-border/60">
                  <td class="py-1.5 pr-2">单级圆柱齿轮</td>
                  <td class="text-right px-2 font-mono">i ≤ 10</td>
                  <td class="text-right pl-2 font-mono">0.95~0.98</td>
                </tr>
                <tr class="border-b border-border/60">
                  <td class="py-1.5 pr-2">两级圆柱齿轮</td>
                  <td class="text-right px-2 font-mono">i ≤ 60</td>
                  <td class="text-right pl-2 font-mono">0.90~0.96 总</td>
                </tr>
                <tr class="border-b border-border/60">
                  <td class="py-1.5 pr-2">行星 / 摆线</td>
                  <td class="text-right px-2 font-mono">单级 3~10</td>
                  <td class="text-right pl-2 font-mono">0.90~0.97</td>
                </tr>
                <tr>
                  <td class="py-1.5 pr-2">蜗轮蜗杆</td>
                  <td class="text-right px-2 font-mono">10~100+</td>
                  <td class="text-right pl-2 font-mono">0.7~0.9</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed mt-3">
            超出单级能力再级联；蜗轮大速比（单头蜗杆）具有自锁倾向——只能蜗杆带蜗轮、不能反驱，卷扬与升降设备利用这一点防坠落，但效率明显偏低。
          </p>
        </div>

        <!-- 链轮 / 齿条同式口径 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Link2 class="w-4 h-4 text-primary mr-1.5" /> 链轮 / 齿条同式口径
          </h3>
          <ul class="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <li>• 链轮速比同式：i = Z₂/Z₁（齿数比），效率约 0.95~0.97/级，多排链承载更高；链传动几何用
              <NuxtLink to="/tools/chain-sprocket" class="text-primary hover:underline">链条长度计算</NuxtLink>。</li>
            <li>• 同步带轮：i = Z₂/Z₁（齿数比），效率 0.94~0.98，同步无滑动。</li>
            <li>• 齿轮齿条：旋转转直线，无速比概念，直线速度 v = π·d·n/60000（m/s，d 为小齿轮分度圆直径 mm）。</li>
          </ul>
        </div>

        <!-- 伺服选型视角 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Target class="w-4 h-4 text-primary mr-1.5" /> 伺服选型视角
          </h3>
          <ul class="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <li>• 先定速比 i = n电机 / n负载，再校核折算扭矩 T折 = T负载/(i·η) ≤ 电机额定；</li>
            <li>• 加速段要算惯量：负载惯量/i² 与电机转子惯量之比建议 ≤ 10（高动态 ≤ 3~5）；</li>
            <li>• 伺服配行星减速器优先（回隙小），i 取 3~10/级；</li>
            <li>• 选型余量：额定扭矩留 1.5~2 倍过载覆盖加减速。</li>
          </ul>
          <NuxtLink to="/tools/gear-module-calculator" class="inline-flex items-center gap-1 mt-3 text-xs text-primary hover:underline">
            齿轮模数计算器（几何尺寸） <ArrowRight class="w-3 h-3" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="seoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <HelpCircle v-else class="w-5 h-5" />
      </button>

      <div v-show="seoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是减速比计算器
        </h2>
        <p class="text-muted-foreground mb-4">
          减速比计算器面向机械传动选型与速算：输入主动/从动齿数即得速比 i = Z₂/Z₁，自动换算输出转速 n₂ = n₁/i 与输出扭矩 T₂ = T₁×i×η
          （单级效率 0.95~0.98 滑杆可调），并用功率不变视角 P = T×n/9550 展示损耗去向。多级级联支持动态增删传动级，
          总速比 = 各级连乘、总效率 = 各级相乘；反向模式由电机转速与目标输出转速求所需总速比，并给出单级（i≤10）、
          两级（≤60）、蜗轮（100+）档位提示与自锁注记。全部计算在浏览器本地完成。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>单级：填 Z₁、Z₂、n₁、T₁，拖 η 滑杆，读 n₂ / T₂ / P₁ / P₂；</li>
          <li>多级：点"添加一级"逐级填齿数对与每级效率，读总速比、总效率与末级输出；</li>
          <li>反向：填电机转速与目标转速，得所需总速比与档位提示，再拆分到各级；</li>
          <li>点"复制结果"把摘要粘贴到选型记录或工单。</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          减速比计算公式
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>速比</strong>：i = Z₂/Z₁ = n₁/n₂（从动/主动），i&gt;1 为减速；</li>
          <li><strong>输出转速</strong>：n₂ = n₁/i；<strong>输出扭矩</strong>：T₂ = T₁×i×η（η 单级 0.95~0.98）；</li>
          <li><strong>功率不变视角</strong>：P = T×n/9550（kW），P₂ = η·P₁，转速降多少扭矩就升多少再扣损耗；</li>
          <li><strong>级联</strong>：i总 = i₁×i₂×…×iₖ，η总 = η₁×η₂×…×ηₖ，末级 n = n₁/i总、T = T₁×i总×η总。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4 mb-6">
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么减速就能增扭？</h3>
            <p class="text-muted-foreground mt-1">
              因为功率 P = T×n/9550（kW）在传动里近似守恒（只有摩擦损耗）：转速 n 降到 1/i，扭矩 T 就放大 i 倍再乘效率 η。
              例：电机 1440 rpm、5 N·m，经 i=4、η=0.96 减速后输出 360 rpm、19.2 N·m——转速降为 1/4，扭矩升到 3.84 倍，
              功率从 0.754 kW 变为 0.724 kW，差值就是发热损耗。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">级联时效率为什么要连乘？</h3>
            <p class="text-muted-foreground mt-1">
              每一级的损耗都独立发生在该级啮合面上：第二级接收的已经是第一级输出（打了折）的功率，所以总效率 = η₁×η₂×…。
              0.96² = 0.9216，两级已经损失约 8%；级联越多损耗叠加越多，因此满足速比需求的前提下级数越少越好，
              大速比也可对比蜗轮（单级可达 100+，但效率只有 0.7~0.9）。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">蜗轮自锁是什么？什么时候用？</h3>
            <p class="text-muted-foreground mt-1">
              单头蜗杆的螺旋升角很小时，摩擦角大于升角，蜗轮无法反向带动蜗杆——这就是自锁。速比大（常在 i≥40~50 的单头蜗杆）时自锁倾向明显，
              卷扬机、升降机利用它防止负载坠落反转。代价是效率低（0.7~0.9 甚至更低）与发热，且自锁只是工程判断，
              安全要求高的场合仍要加抱闸。注意：自锁减速器不能被负载反驱，需要反向运动时不能用。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">伺服选型怎么定减速比？</h3>
            <p class="text-muted-foreground mt-1">
              三步：① 按转速定 i = n电机/n负载；② 按扭矩校核 T负载/(i·η) ≤ 电机额定扭矩，并留 1.5~2 倍加减速过载；
              ③ 按惯量匹配校核 负载惯量/i² ≤ 10×转子惯量（高动态 ≤ 3~5 倍）。三者取最大者为最终速比，
              优先用行星减速器（回隙小、单级 i 3~10）。几何尺寸（模数、中心距）用
              <NuxtLink to="/tools/gear-module-calculator" class="text-primary hover:underline">齿轮模数计算器</NuxtLink> 速查。
            </p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          相关工具
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground">
          <li><NuxtLink to="/tools/gear-module-calculator" class="text-primary hover:underline">齿轮模数计算器</NuxtLink>：分度圆、齿顶圆与中心距几何速算；</li>
          <li><NuxtLink to="/tools/chain-sprocket" class="text-primary hover:underline">链条长度计算</NuxtLink>：链轮齿数、中心距与节距求链条节数；</li>
          <li><NuxtLink to="/tools/torque-unit-converter" class="text-primary hover:underline">扭矩单位换算器</NuxtLink>：N·m、kgf·m、lb-ft、lb-in 互算；</li>
          <li><NuxtLink to="/tools/motor-rpm-calculator" class="text-primary hover:underline">电机转速计算</NuxtLink>：同步转速与转差速算。</li>
        </ul>
      </div>
    </div>

    <!-- 相关推荐 -->
    <RelatedTools :current-tool-id="'gear-ratio-reducer'" :category="'calculate'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Cog, Calculator, Info, Gauge, Link2, Target, ArrowRight,
  Copy, Check, ChevronUp, HelpCircle
} from 'lucide-vue-next'
import { addRecentTool } from '~/composables/useTools'
import { resolveToolIcon } from '~/utils/toolIcons'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'gear-ratio-reducer'
const STORAGE_KEY = 'gear-ratio-reducer.inputs'

// SEO配置
useSeoMeta({
  title: '减速比计算器 - 齿轮减速比与转速扭矩级联换算 | 有条工具',
  description: '免费在线减速比计算器：i=Z2/Z1 速比换算输出转速 n2=n1/i 与扭矩 T2=T1·i·η（单级效率0.95~0.98），多级级联总速比总效率连乘，反向由目标转速求所需减速比并提示单级/两级/蜗轮档位与自锁条件，功率不变视角 T×n 守恒扣损耗，纯本地计算。',
  keywords: '减速比计算,齿轮速比,传动比计算,减速器选型,扭矩转速换算,级联效率,蜗轮自锁,gear ratio calculator,减速增扭',
  author: '有条工具',
  ogTitle: '减速比计算器 - 齿轮减速比与转速扭矩级联换算',
  ogDescription: '单级/多级减速比速算：转速扭矩换算含效率，级联连乘，反向求速比带档位提示，纯本地计算。',
  ogUrl: 'https://www.util.cn/tools/gear-ratio-reducer',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '减速比计算器 - 机械传动速算',
  twitterDescription: 'i=Z2/Z1 速比、n2/T2 换算、多级级联与反向求速比。'
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
          name: '减速比计算器',
          url: 'https://www.util.cn/tools/gear-ratio-reducer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '单级速比 i = Z2/Z1，输出转速 n2 = n1/i',
            '输出扭矩 T2 = T1×i×η，单级效率 0.95~0.98 滑杆',
            '功率不变视角 P = T×n/9550，损耗可视化',
            '多级级联：总速比连乘、总效率相乘、末级输出',
            '反向求速比：单级 i≤10 / 两级 ≤60 / 蜗轮 100+ 档位提示与自锁注记',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '减速比计算器', item: 'https://www.util.cn/tools/gear-ratio-reducer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么减速就能增扭？',
              acceptedAnswer: { '@type': 'Answer', text: '功率 P = T×n/9550 在传动里近似守恒：转速降到 1/i，扭矩放大 i 倍再乘效率 η。如电机 1440rpm、5N·m 经 i=4、η=0.96 减速后输出 360rpm、19.2N·m，功率差即损耗。' }
            },
            {
              '@type': 'Question',
              name: '级联时效率为什么要连乘？',
              acceptedAnswer: { '@type': 'Answer', text: '每级损耗独立发生在本级啮合面，第二级接收的已是打折扣的功率，所以总效率 = η₁×η₂×…。0.96²=0.9216，两级已损失约 8%，级数越少越好。' }
            },
            {
              '@type': 'Question',
              name: '蜗轮自锁是什么？什么时候用？',
              acceptedAnswer: { '@type': 'Answer', text: '单头蜗杆螺旋升角小于摩擦角时蜗轮不能反向驱动蜗杆，即自锁，常出现在大速比（约 i≥40~50）单头蜗杆；卷扬与升降设备用它防坠落，但效率低（0.7~0.9），高安全场合仍需抱闸，且需要反向运动时不能用。' }
            },
            {
              '@type': 'Question',
              name: '伺服选型怎么定减速比？',
              acceptedAnswer: { '@type': 'Answer', text: '① i = n电机/n负载；② 校核 T负载/(i·η) ≤ 电机额定并留 1.5~2 倍过载；③ 校核负载惯量/i² ≤ 10×转子惯量（高动态 ≤3~5 倍），三者取最大，优先行星减速器。' }
            }
          ]
        }
      ]
    })
  }]
})

const trackToolUsage = () => { addRecentTool(TOOL_ID) }
onMounted(() => {
  trackToolUsage()
  loadInputs()
})

const toolIcon = resolveToolIcon('Cog', 'calculate')

// ==== PURE-FNS-START ====
// 单级速比：i = Z2/Z1（从动/主动）
function singleRatio(z1: number, z2: number): number | null {
  if (!Number.isInteger(z1) || !Number.isInteger(z2) || z1 < 1 || z2 < 1) return null
  return z2 / z1
}

// 输出转速：n2 = n1 / i
function outputSpeedRpm(n1: number, i: number): number | null {
  if (!Number.isFinite(n1) || !Number.isFinite(i) || n1 < 0 || i <= 0) return null
  return n1 / i
}

// 输出扭矩：T2 = T1 × i × η
function outputTorqueNm(t1Nm: number, i: number, eta: number): number | null {
  if (!Number.isFinite(t1Nm) || !Number.isFinite(i) || !Number.isFinite(eta)) return null
  if (t1Nm < 0 || i <= 0 || eta <= 0 || eta > 1) return null
  return t1Nm * i * eta
}

// 功率（kW）：P = T(N·m) × n(rpm) / 9550
function powerKw(tNm: number, rpm: number): number | null {
  if (!Number.isFinite(tNm) || !Number.isFinite(rpm) || tNm < 0 || rpm < 0) return null
  return tNm * rpm / 9550
}

interface RatioStage {
  zA: number
  zB: number
  eta: number
}

// 级联：总速比连乘、总效率相乘、末级输出转速/扭矩
function cascadeResultOf(stages: RatioStage[], n1: number, t1: number):
  { totalRatio: number, totalEta: number, outRpm: number, outTorque: number, stageRatios: number[] } | null {
  if (!Array.isArray(stages) || stages.length === 0 || !Number.isFinite(n1) || !Number.isFinite(t1)) return null
  if (n1 < 0 || t1 < 0) return null
  let totalRatio = 1
  let totalEta = 1
  const stageRatios: number[] = []
  for (const s of stages) {
    if (!Number.isInteger(s?.zA) || !Number.isInteger(s?.zB) || s.zA < 1 || s.zB < 1) return null
    if (!Number.isFinite(s?.eta) || s.eta <= 0 || s.eta > 1) return null
    const r = s.zB / s.zA
    stageRatios.push(r)
    totalRatio *= r
    totalEta *= s.eta
  }
  const outRpm = n1 / totalRatio
  const outTorque = t1 * totalRatio * totalEta
  return { totalRatio, totalEta, outRpm, outTorque, stageRatios }
}

// 反向：所需总速比 i = n电机 / n目标
function requiredRatio(nMotor: number, nTarget: number): number | null {
  if (!Number.isFinite(nMotor) || !Number.isFinite(nTarget) || nMotor <= 0 || nTarget <= 0) return null
  return nMotor / nTarget
}

// 修剪浮点尾差的展示格式（纯函数，供档位提示内嵌数值使用）
function fmtNumOf(x: number, digits: number): string {
  if (!Number.isFinite(x)) return '—'
  const fixed = x.toFixed(digits)
  if (fixed.includes('.')) {
    return fixed.replace(/0+$/, '').replace(/\.$/, '')
  }
  return fixed
}

// 档位提示：单级 i≤10、两级 ≤60、三级/蜗轮 ≤100、蜗轮 100+
function ratioStageHint(i: number): string {
  if (!Number.isFinite(i) || i <= 0) return ''
  if (i <= 1) return 'i ≤ 1：这是增速布置（Z₂ < Z₁），无需减速器；注意增速传动的效率与振动特性需单独校核。'
  if (i <= 10) return 'i ≤ 10：单级圆柱齿轮减速器（或行星减速器）即可覆盖，效率最高。'
  if (i <= 60) return `10 < i ≤ 60：推荐两级圆柱齿轮减速器；i=${fmtNumOf(i, 2)} 可拆成两级接近的速比（如 √i×√i）以均衡各级负荷。`
  if (i <= 100) return '60 < i ≤ 100：三级圆柱齿轮，或单级蜗轮蜗杆（效率 0.7~0.9，换紧凑性）。'
  return `i > 100：单级蜗轮蜗杆可达 100+，或多级组合；大速比单头蜗杆具有自锁倾向（不能反驱），用于防坠落场合，但效率明显偏低。`
}
// ==== PURE-FNS-END ====

// ---------- 状态 ----------
const mode = ref<'single' | 'cascade' | 'reverse'>('single')
const seoContentVisible = ref(true)
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const z1 = ref<number | null>(20)
const z2 = ref<number | null>(80)
const n1 = ref<number | null>(1440)
const t1 = ref<number | null>(5)
const singleEta = ref<number>(0.96)

interface StageRow { zA: number | null, zB: number | null, eta: number | null }
const stages = ref<StageRow[]>([
  { zA: 20, zB: 80, eta: 0.96 },
  { zA: 20, zB: 100, eta: 0.96 }
])

const revMotor = ref<number | null>(1440)
const revTarget = ref<number | null>(60)

// ---------- 单级结果 ----------
const singleResult = computed(() => {
  const a = Number(z1.value)
  const b = Number(z2.value)
  const i = singleRatio(a, b)
  if (i === null) return null
  const speed = Number(n1.value)
  const torque = Number(t1.value)
  const eta = Number(singleEta.value)
  const n2 = outputSpeedRpm(speed, i)
  const t2 = outputTorqueNm(torque, i, eta)
  const p1 = powerKw(torque, speed)
  if (n2 === null || t2 === null || p1 === null) return null
  const p2 = powerKw(t2, n2) as number
  return { i, n2, t2, p1, p2 }
})

// ---------- 级联结果 ----------
const cascadeRes = computed(() => {
  const cleaned = stages.value.map(s => ({
    zA: Number(s.zA),
    zB: Number(s.zB),
    eta: Number(s.eta)
  }))
  const speed = Number(n1.value)
  const torque = Number(t1.value)
  return cascadeResultOf(cleaned, speed, torque)
})

const cascadeResult = computed(() => {
  const r = cascadeRes.value
  if (!r) return null
  const lines: string[] = []
  r.stageRatios.forEach((ratio, idx) => {
    lines.push(`第 ${idx + 1} 级：i = ${fmtNum(ratio, 4)}`)
  })
  lines.push(`合计：i总 = ${fmtNum(r.totalRatio, 4)}，η总 = ${fmtNum(r.totalEta, 4)}`)
  return {
    totalRatio: r.totalRatio,
    totalEta: r.totalEta,
    outRpm: r.outRpm,
    outTorque: r.outTorque,
    stageLines: lines
  }
})

function stageRatioText(stage: StageRow): string {
  const a = Number(stage.zA)
  const b = Number(stage.zB)
  const i = singleRatio(a, b)
  return i === null ? '—' : fmtNum(i, 2)
}

function addStage() {
  if (stages.value.length >= 6) return
  stages.value.push({ zA: 20, zB: 60, eta: 0.96 })
  trackToolUsage()
}

function removeStage(idx: number) {
  if (stages.value.length <= 1) return
  stages.value.splice(idx, 1)
}

function loadCascadeExample() {
  stages.value = [
    { zA: 20, zB: 80, eta: 0.96 },
    { zA: 20, zB: 100, eta: 0.96 }
  ]
  mode.value = 'cascade'
  trackToolUsage()
}

// ---------- 反向结果 ----------
const reverseResult = computed(() => {
  const motor = Number(revMotor.value)
  const target = Number(revTarget.value)
  const i = requiredRatio(motor, target)
  if (i === null) return null
  return { i, hint: ratioStageHint(i) }
})

// ---------- 复制 ----------
const copyText = computed(() => {
  if (mode.value === 'single' && singleResult.value) {
    const r = singleResult.value
    return `单级减速：Z1=${trimNum(Number(z1.value))}→Z2=${trimNum(Number(z2.value))}，i=${fmtNum(r.i, 4)}，n1=${trimNum(Number(n1.value))}→n2=${fmtNum(r.n2, 2)}rpm，T1=${trimNum(Number(t1.value))}N·m→T2=${fmtNum(r.t2, 3)}N·m（η=${trimNum(Number(singleEta.value))}），P1=${fmtNum(r.p1, 3)}kW，P2=${fmtNum(r.p2, 3)}kW`
  }
  if (mode.value === 'cascade' && cascadeResult.value) {
    const r = cascadeResult.value
    return `多级减速：i总=${fmtNum(r.totalRatio, 4)}，η总=${fmtNum(r.totalEta, 4)}，n1=${trimNum(Number(n1.value))}→末级 ${fmtNum(r.outRpm, 2)}rpm，T1=${trimNum(Number(t1.value))}→末级 ${fmtNum(r.outTorque, 2)}N·m；${r.stageLines.join('；')}`
  }
  if (mode.value === 'reverse' && reverseResult.value) {
    return `反向求速比：n1=${trimNum(Number(revMotor.value))}rpm → n2=${trimNum(Number(revTarget.value))}rpm，所需总速比 i=${fmtNum(reverseResult.value.i, 4)}:1；${reverseResult.value.hint}`
  }
  return ''
})

const copyResults = async () => {
  const text = copyText.value
  if (!text) return
  trackToolUsage()
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    if (copyTimer !== null) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
    alert('当前环境不支持剪贴板，请手动选择文本复制')
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 输入持久化（键前缀为工具 id，仅 onMounted 读取 / watch 写入） ----------
const refMap = { z1, z2, n1, t1, singleEta, revMotor, revTarget }

function persistInputs() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: mode.value,
      z1: z1.value,
      z2: z2.value,
      n1: n1.value,
      t1: t1.value,
      singleEta: singleEta.value,
      stages: stages.value,
      revMotor: revMotor.value,
      revTarget: revTarget.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}

function loadInputs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (data && typeof data === 'object') {
      if (data.mode === 'single' || data.mode === 'cascade' || data.mode === 'reverse') mode.value = data.mode
      for (const k of Object.keys(refMap) as Array<keyof typeof refMap>) {
        const v = data[k]
        if (typeof v === 'number' && Number.isFinite(v)) {
          (refMap[k] as unknown as { value: number }).value = v
        }
      }
      if (Array.isArray(data.stages) && data.stages.length >= 1 && data.stages.length <= 6) {
        const restored: StageRow[] = []
        for (const s of data.stages) {
          if (s && typeof s === 'object' && typeof s.zA === 'number' && typeof s.zB === 'number' && typeof s.eta === 'number') {
            restored.push({ zA: s.zA, zB: s.zB, eta: s.eta })
          }
        }
        if (restored.length >= 1) stages.value = restored
      }
    }
  } catch (e) { /* 忽略解析失败 */ }
}

watch([mode, z1, z2, n1, t1, singleEta, stages, revMotor, revTarget], () => {
  persistInputs()
}, { deep: true })

// ---------- 格式化 ----------
function trimNum(x: number): string {
  if (!Number.isFinite(x)) return '—'
  const fixed = (Math.round(x * 1000) / 1000).toFixed(3)
  return fixed.replace(/0+$/, '').replace(/\.$/, '')
}

function fmtNum(x: number, digits = 2): string {
  if (!Number.isFinite(x)) return '—'
  const fixed = x.toFixed(digits)
  if (fixed.includes('.')) {
    return fixed.replace(/0+$/, '').replace(/\.$/, '')
  }
  return fixed
}
</script>
