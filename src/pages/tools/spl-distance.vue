<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Volume2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">声压级距离衰减计算器（SPL）</h1>
          <p class="text-sm text-muted-foreground mt-1">逆平方定律 · 双倍距离 -6dB 口径 · 反推最大距离 · 功率补偿视角</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线声压级距离衰减计算工具：输入参考距离与其声压级 SPL1，按点声源逆平方定律计算任意距离处的衰减量与 SPL2；
        也支持反向「给定目标声压级，求最远可达距离」。附带点/线/面声源三种口径对照、功率翻倍 +3dB 补偿视角与常见场景声压级锚点表。
        适用于扩声调试、音箱选型、噪声预测与听力保护评估；全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <div class="flex items-start gap-2 bg-muted/60 border border-border rounded-lg p-3 mb-6 text-xs text-muted-foreground leading-relaxed">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>本工具按点声源（球面波）自由场口径计算：每倍距离衰减 6dB（精确值 6.02dB）。线声源约 -3dB、面声源近场约 0dB，室内因混响场衰减会更慢——口径差异见下方对照卡。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：输入面板（侧栏） -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 计算参数
        </h2>

        <!-- 计算模式 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">计算模式</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="m in MODES" :key="m.id"
              @click="setMode(m.id)"
              class="px-3 py-2 rounded-lg border text-sm font-medium transition"
              :class="mode === m.id ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'"
            >{{ m.name }}</button>
          </div>
        </div>

        <!-- 参考声源 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">参考声源 SPL1（dB）</p>
          <div class="flex items-center gap-2">
            <input v-model="spl1In" type="number" step="0.1" min="-10" max="200" @change="saveState" class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 100" />
            <span class="text-xs text-muted-foreground flex-shrink-0">dB @ r₁</span>
          </div>
          <p v-if="spl1Error" class="text-xs text-red-500 mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {{ spl1Error }}
          </p>
        </div>

        <!-- 参考距离 r1 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">参考距离 r₁（m）</p>
          <input v-model="r1In" type="number" step="0.1" min="0.01" max="10000" @change="saveState" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="默认 1 m" />
          <p v-if="r1Error" class="text-xs text-red-500 mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {{ r1Error }}
          </p>
          <p class="text-[10px] text-muted-foreground mt-1.5">音箱灵敏度口径即为 1W·1m：SPL1 直接填灵敏度值（如 96dB）即可估算不同功率与距离下的声压级。</p>
        </div>

        <!-- 正向：目标距离 -->
        <div v-if="mode === 'forward'">
          <p class="text-sm font-medium text-foreground mb-2">目标距离 r₂（m）</p>
          <input v-model="r2In" type="number" step="0.1" min="0.01" max="10000" @change="saveState" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 16" />
          <p v-if="r2Error" class="text-xs text-red-500 mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {{ r2Error }}
          </p>
          <div class="flex flex-wrap gap-2 mt-2">
            <button
              v-for="preset in R2_PRESETS" :key="preset"
              @click="applyR2(preset)"
              class="px-2.5 py-1 rounded-lg border text-xs font-medium transition bg-muted/40 border-border text-muted-foreground hover:text-foreground"
            >{{ preset }} m</button>
          </div>
        </div>

        <!-- 反向：目标声压级 -->
        <div v-else>
          <p class="text-sm font-medium text-foreground mb-2">目标声压级 SPL2（dB）</p>
          <input v-model="spl2In" type="number" step="0.1" min="-10" max="200" @change="saveState" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 85" />
          <p v-if="spl2Error" class="text-xs text-red-500 mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {{ spl2Error }}
          </p>
          <p v-else-if="spl2NotBelow" class="text-xs text-amber-600 mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> 目标声级需低于 SPL1（距离只会衰减不会升），才会存在最大距离
          </p>
          <div class="flex flex-wrap gap-2 mt-2">
            <button
              v-for="t in SPL2_PRESETS" :key="t.value"
              @click="applySpl2(t.value)"
              class="px-2.5 py-1 rounded-lg border text-xs font-medium transition bg-muted/40 border-border text-muted-foreground hover:text-foreground"
            >{{ t.label }}</button>
          </div>
        </div>

        <button
          @click="resetAll"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置全部参数
        </button>
      </div>

      <!-- 右：结果面板（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 结论卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 计算结果
          </h2>

          <!-- 正向结果 -->
          <div v-if="mode === 'forward'">
            <div v-if="att !== null && spl2 !== null" class="bg-muted/40 border border-border rounded-lg p-5">
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-card border border-border rounded-lg p-4 text-center">
                  <p class="text-xs text-muted-foreground mb-1">距离衰减量</p>
                  <p class="text-4xl font-bold text-red-500">-{{ fmt(att, 2) }}<span class="text-lg font-semibold text-muted-foreground">dB</span></p>
                  <p class="text-[10px] text-muted-foreground mt-1 font-mono">ΔL = 20·log₁₀(r₂/r₁)</p>
                </div>
                <div class="bg-card border border-border rounded-lg p-4 text-center">
                  <p class="text-xs text-muted-foreground mb-1">{{ fmt(r2, 2) }} m 处声压级</p>
                  <p class="text-4xl font-bold text-primary">{{ fmt(spl2, 2) }}<span class="text-lg font-semibold text-muted-foreground">dB</span></p>
                  <p class="text-[10px] text-muted-foreground mt-1 font-mono">SPL₂ = SPL₁ − ΔL</p>
                </div>
              </div>
              <p class="text-xs text-muted-foreground text-center mt-3">
                {{ fmt(spl1, 1) }} dB @ {{ fmt(r1, 2) }} m → {{ fmt(spl2, 2) }} dB @ {{ fmt(r2, 2) }} m（距离比 ×{{ fmt(ratio, 2) }}）
              </p>
            </div>
            <div v-else class="p-8 text-center text-sm text-muted-foreground bg-muted/40 border border-border rounded-lg">
              请填写有效的 SPL1 与两个距离（0.01–10000 m）开始计算
            </div>
          </div>

          <!-- 反向结果 -->
          <div v-else>
            <div v-if="rMax !== null" class="bg-muted/40 border border-border rounded-lg p-5">
              <div class="bg-card border border-border rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">声压级不低于 {{ fmt(spl2Target, 1) }} dB 的最远距离</p>
                <p class="text-4xl font-bold text-primary">{{ fmt(rMax, 2) }}<span class="text-lg font-semibold text-muted-foreground">m</span></p>
                <p class="text-[10px] text-muted-foreground mt-1 font-mono">r₂ = r₁ × 10^((SPL₁−SPL₂)/20)</p>
              </div>
              <p class="text-xs text-muted-foreground text-center mt-3">
                注记：SPL1 每提高 6 dB，同一目标声级的可达距离约翻倍；反之每降 6 dB 距离减半。
              </p>
            </div>
            <div v-else class="p-8 text-center text-sm text-muted-foreground bg-muted/40 border border-border rounded-lg">
              请填写有效的 SPL1（高于目标声级）与两个声级值
            </div>
          </div>
        </div>

        <!-- 口径警示卡：双倍距离 -6dB -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <TriangleAlert class="w-5 h-5 text-amber-500" /> 口径警示：「双倍距离 -6dB」不是万能公式
          </h2>
          <p class="text-sm text-muted-foreground leading-relaxed">
            -6dB 是<strong class="text-foreground">点声源在自由场（室外开阔地）</strong>的口径。声源类型与环境不同，衰减斜率完全不同：
          </p>
          <div class="space-y-2">
            <div
              v-for="m in sourceRows" :key="m.id"
              class="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-lg"
            >
              <span class="text-sm text-foreground flex-1 min-w-0">{{ m.name }}</span>
              <span class="text-xs font-mono text-muted-foreground flex-shrink-0 hidden sm:inline">{{ m.formula }}</span>
              <span
                class="text-sm font-bold font-mono flex-shrink-0 w-24 text-right"
                :class="m.dropDb === null ? 'text-muted-foreground' : 'text-amber-600'"
              >{{ m.dropDb === null ? '—' : `${m.dropDb > 0 ? '+' : ''}${fmt(m.dropDb, 2)} dB` }}</span>
            </div>
          </div>
          <p v-if="sourceRowsHaveRatio" class="text-[10px] text-muted-foreground leading-relaxed">
            右列为当前距离比 ×{{ fmt(ratio, 2) }}（{{ fmt(r1, 2) }} m → {{ fmt(r2, 2) }} m）下各口径的衰减量。室内混响场衰减介于「点声源」与「面声源」之间，详见底部说明。
          </p>
        </div>

        <!-- 功率视角卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Power class="w-5 h-5 mr-2 text-primary" /> 功率视角：W 翻倍只 +3dB
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div v-for="s in POWER_STEPS" :key="s.mult" class="bg-muted/50 border border-border rounded-lg p-3 text-center">
              <p class="text-sm font-bold text-foreground font-mono">{{ s.mult }}</p>
              <p class="text-xs text-primary font-semibold mt-0.5 font-mono">{{ s.db }}</p>
            </div>
          </div>
          <div v-if="powerCompensate !== null" class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-400 leading-relaxed flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              要用功率补回当前 {{ fmt(att, 2) }} dB 的距离衰减，需要 <strong>{{ fmt(powerCompensate, 0) }} 倍功率</strong>
              （以 {{ fmt(powerWattsFrom, 0) }} W 为基准 → 约 {{ fmt(powerWattsTo, 0) }} W）。功率每翻倍只 +3dB，而距离每翻倍 -6dB——
              所以「距离翻倍要 4 倍功率才补得回来」，能挪音箱就别堆功率。
            </span>
          </div>
          <p class="text-[10px] text-muted-foreground leading-relaxed">
            口径：功率增减按 10·log₁₀(W₂/W₁)，声压按 20·log₁₀(r₂/r₁)。两者都以 dB 表述但系数不同——这是能量量与场量的区别。
          </p>
        </div>

        <!-- 常见场景锚点表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Target class="w-5 h-5 mr-2 text-primary" /> 常见场景声压级锚点
          </h2>
          <table class="w-full text-sm">
            <thead class="text-[10px] text-muted-foreground">
              <tr class="border-b border-border">
                <th class="text-left py-1.5 font-medium">场景</th>
                <th class="text-right py-1.5 font-medium">典型声压级</th>
                <th class="text-left py-1.5 font-medium pl-3">量级参考</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in ANCHORS" :key="a.name" class="border-b border-border/50 last:border-0">
                <td class="py-1.5 text-foreground">{{ a.name }}</td>
                <td class="py-1.5 text-right font-mono text-primary font-semibold">{{ a.level }}</td>
                <td class="py-1.5 pl-3 text-xs text-muted-foreground">{{ a.note }}</td>
              </tr>
            </tbody>
          </table>
          <p class="text-[10px] text-muted-foreground leading-relaxed">
            上表均为<strong class="text-foreground">量级参考</strong>，非测量标准值：同一场景随测量位置、距离与设备差异可达 ±10dB 以上。精确数值请用分贝仪实测（见相关工具）后再代入本工具换算。
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>逆平方定律：为什么距离越远声压级越低？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          点声源（可近似为一点的音箱、人声）向四周均匀辐射球面波，声强随距离按 <strong class="text-foreground">1/r²（逆平方定律）</strong> 衰减：
          距离翻倍，同样的能量摊到 4 倍的球面积上，声强变为 1/4。声压级是场量，按 20·log₁₀(r₂/r₁) 换算——距离翻倍精确衰减
          6.02dB，工程上四舍五入为「双倍距离 -6dB」。反过来，距离缩短一半，声压级 +6dB。
          本工具的衰减公式即 ΔL = 20·log₁₀(r₂/r₁)，SPL₂ = SPL₁ − ΔL。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">点声源、线声源、面声源：同一个「-6dB」为什么对不上？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          衰减斜率取决于声源的几何形状：点声源（球面波）每倍距离 -6dB；线声源（列车、长距离声屏障、公路车流）柱面波辐射，能量只摊到圆柱面上，
          每倍距离约 -3dB；面声源（大墙面、工厂立面）在近场内几乎不衰减（约 0dB），直到走出数倍于声源尺寸的远场后才回落到点声源口径。
          所以用「双倍距离 -6dB」去套列车噪声或大厂房墙边测点，会明显高估衰减量。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么室外和室内不一样？（混响场）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          逆平方定律成立的前提是自由场——只有直达声、没有反射。室外开阔地接近自由场，-6dB 口径基本成立；
          室内除了直达声还有墙面、天花、地面的反射叠加形成的<strong class="text-foreground">混响场</strong>：离声源足够远后，
          反射声主导，声压级趋于一个几乎不随距离变化的稳态值，衰减远慢于 -6dB。
          直达声与混响声相等的距离叫<strong class="text-foreground">临界距离</strong>（吸声越差房间越小），听音位通常就在临界距离之外，
          所以「室内加倍距离远掉不了 6dB」，这既解释了为什么小房间音箱不用开很大声，也解释了为什么室内噪声治理要靠吸声而不是拉开距离。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">多只音箱叠加为什么只 +3dB？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两只播放相同信号的音箱，总声功率翻倍，声功率级与声压级（能量平均意义下）+3dB（10·log₁₀2）——注意这与距离翻倍的 -6dB 不是一回事：
          前者是能量量叠加，后者是场量随距离的几何扩散。理想同相位、在同一点的相干声源在某些频段最多可到 +6dB，但常规扩声布局按 +3dB 估算才是稳妥口径。
          以此类推：10 只同样的音箱 ≈ +10dB，100 只 ≈ +20dB。想靠加音箱抵消距离衰减，距离翻倍需要数量翻 4 倍，远不如提高单箱灵敏度或缩短听音距离划算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">与分贝仪实测配合使用</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          最可靠的流程是：先用分贝仪在参考距离（如 1m）实测 SPL1，再用本工具按逆平方定律外推其他位置的声压级；
          音箱选型时也可直接用灵敏度口径——灵敏度本身就是「1W·1m 的 SPL1」，加上 10·log₁₀(功率倍数)、减去 20·log₁₀(距离倍数) 即为估算声压级。
          室内使用时记得实测值会高于本工具的外推值（混响场贡献），偏保守的听力保护评估建议以实测为准。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">双倍距离一定是 -6dB 吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">只在点声源自由场（室外开阔地）成立，精确值 6.02dB。线声源（列车、车流）约 -3dB，面声源近场约 0dB，室内混响场也明显小于 6dB。按声源类型与现场条件选口径，本工具的对照卡会同时给出三种结果。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">SPL1=100dB@1m，16m 处还剩多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">按点声源口径：衰减 20·log₁₀(16) ≈ 24.08dB，16m 处约 75.92dB。这也是本工具的默认示例，可直接改距离试算。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">功率加倍能补偿距离衰减吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">补偿不了多少：功率翻倍只有 +3dB，距离翻倍要损失 6dB，需要 4 倍功率才能补回。要把 1m 处 100dB 的声音在 16m 维持住需要约 256 倍功率，所以扩声设计优先考虑灵敏度、布局与听音距离，而不是堆功放。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">怎么得到可靠的 SPL1？</h3>
            <p class="text-sm text-muted-foreground mt-1">用分贝仪（手机 App 亦可粗测）在参考距离实测；音箱则用厂商标称灵敏度（1W·1m）。实测比理论估算可靠，尤其是室内混响明显时，外推值应视为下限。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有公式都在浏览器本地计算，不记录、不发送任何输入内容，参数仅保存在本机浏览器中用于下次恢复。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'spl-distance'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Volume2, Calculator, RefreshCw, Info, TriangleAlert,
  ChevronUp, ChevronDown, Ruler, Power, Target
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '声压级距离衰减计算器 SPL - 逆平方定律与双倍距离-6dB 在线计算',
  description: '免费在线声压级距离衰减计算：按逆平方定律 20·log₁₀(r₂/r₁) 计算 SPL 随距离的衰减与任意距离声压级，反向求最大可达距离，点/线/面声源口径对照，功率翻倍+3dB 补偿视角与常见场景声压级锚点表，纯浏览器本地运行不上传',
  keywords: '声压级距离衰减,逆平方定律,双倍距离-6dB,SPL计算,音箱声压计算',
  author: '有条工具',
  ogTitle: '声压级距离衰减计算器 SPL - 逆平方定律与双倍距离-6dB 在线计算 | 有条工具',
  ogDescription: '逆平方定律 SPL 距离衰减计算，反推最大距离，点/线/面声源口径对照与功率补偿视角。',
  ogUrl: 'https://www.util.cn/tools/spl-distance',
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
          name: '声压级距离衰减计算器 SPL',
          url: 'https://www.util.cn/tools/spl-distance',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['逆平方定律距离衰减计算', '任意距离声压级 SPL2 换算', '反推目标声级最大可达距离', '点/线/面声源口径对照', '功率翻倍+3dB 补偿视角', '常见场景声压级锚点表', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '声压级距离衰减计算器 SPL', item: 'https://www.util.cn/tools/spl-distance' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '双倍距离一定是 -6dB 吗？',
              acceptedAnswer: { '@type': 'Answer', text: '只在点声源自由场（室外开阔地）成立，精确值 6.02dB。线声源约 -3dB，面声源近场约 0dB，室内混响场也明显小于 6dB。' }
            },
            {
              '@type': 'Question',
              name: 'SPL1=100dB@1m，16m 处还剩多少？',
              acceptedAnswer: { '@type': 'Answer', text: '按点声源口径：衰减 20·log₁₀(16) ≈ 24.08dB，16m 处约 75.92dB。' }
            },
            {
              '@type': 'Question',
              name: '功率加倍能补偿距离衰减吗？',
              acceptedAnswer: { '@type': 'Answer', text: '补偿不了多少：功率翻倍只有 +3dB，距离翻倍损失 6dB，需要 4 倍功率才能补回。扩声设计优先考虑灵敏度、布局与听音距离。' }
            },
            {
              '@type': 'Question',
              name: '怎么得到可靠的 SPL1？',
              acceptedAnswer: { '@type': 'Answer', text: '用分贝仪在参考距离实测；音箱则用厂商标称灵敏度（1W·1m）。室内混响明显时外推值应视为下限。' }
            },
            {
              '@type': 'Question',
              name: '计算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有公式都在浏览器本地计算，不记录、不发送任何输入内容，参数仅保存在本机浏览器中用于下次恢复。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const R_MAX = 10000   // 距离输入上限 m
const SPL_MIN = -10   // 声压级输入下限 dB
const SPL_MAX = 200   // 声压级输入上限 dB

// 数值解析：字符串/数字 → 有限数或 null
function toNum(v) {
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

// 点声源逆平方定律：距离衰减 ΔL = 20·log₁₀(r₂/r₁)，非正距离返回 null
// 验证：attenuationDb(1,16) ≈ 24.08（SPL1=100@1m、r2=16m → SPL2 ≈ 75.92）；
//       attenuationDb(1,2) ≈ 6.02（双倍距离 -6dB 口径的精确值）
function attenuationDb(r1, r2) {
  if (!(r1 > 0) || !(r2 > 0)) return null
  return 20 * Math.log10(r2 / r1)
}

// 目标距离声压级：SPL₂ = SPL₁ − ΔL；输入无效返回 null
function splAtDistance(spl1, r1, r2) {
  const att = attenuationDb(r1, r2)
  if (att === null || !Number.isFinite(spl1)) return null
  return spl1 - att
}

// 反向：SPL₁、目标 SPL₂ → 最大可达距离 r₂ = r₁·10^((SPL₁−SPL₂)/20)
// 目标 ≥ SPL1 时距离无意义（距离只会衰减），返回 null
// 验证：maxDistance(100, 80, 1) = 10；maxDistance(100, splAtDistance(100,1,16), 1) ≈ 16（往返闭合）
function maxDistance(spl1, spl2, r1) {
  if (!Number.isFinite(spl1) || !Number.isFinite(spl2) || !(r1 > 0)) return null
  if (spl2 >= spl1) return null
  return r1 * Math.pow(10, (spl1 - spl2) / 20)
}

// 功率视角：功率比 → dB = 10·log₁₀(W₂/W₁)（功率翻倍 +3dB，精确 3.01）
function powerDb(w1, w2) {
  if (!(w1 > 0) || !(w2 > 0)) return null
  return 10 * Math.log10(w2 / w1)
}

// 补偿 attDb 衰减所需的功率倍数 = 10^(attDb/10)
// 验证：powerMultipleFor(attenuationDb(1,16)) ≈ 256（100W 量级 → 25.6kW 量级）
function powerMultipleFor(attDb) {
  if (attDb === null || !Number.isFinite(attDb)) return null
  return Math.pow(10, attDb / 10)
}

// 各声源模型的衰减：点声源 20·log₁₀(倍率)、线声源 10·log₁₀(倍率)、面声源近场 0
function modelDropDb(modelId, ratio) {
  if (!(ratio > 0)) return null
  if (modelId === 'point') return 20 * Math.log10(ratio)
  if (modelId === 'line') return 10 * Math.log10(ratio)
  return 0
}

// 显示格式化：null / 非数值 → '—'
function fmt(v, digits) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return v.toFixed(digits)
}

// ---------- 常量与基础数据 ----------
const MODES = [
  { id: 'forward', name: '正向：算 SPL2' },
  { id: 'reverse', name: '反向：算最大距离' }
]

const R2_PRESETS = [2, 4, 8, 16, 32]
const SPL2_PRESETS = [
  { value: 85, label: '85 dB（听力保护线）' },
  { value: 70, label: '70 dB（办公背景）' },
  { value: 60, label: '60 dB（正常交谈）' }
]

// 常见场景声压级锚点（量级参考，非测量标准值）
const ANCHORS = [
  { name: '安静卧室 / 图书馆', level: '30–40 dB', note: '背景量级，可作睡眠基线' },
  { name: '正常交谈（1 m）', level: '≈60 dB', note: '对话基准，长时间无碍' },
  { name: '办公室 / 教室', level: '55–70 dB', note: '持续暴露可累积剂量' },
  { name: '地铁车厢 / 进站', level: '85–95 dB', note: '已达职业暴露口径，通勤注意累计' },
  { name: '电锯 / 风镐（1 m）', level: '≈100 dB', note: '按 3dB 交换率约 15 min 达日剂量' },
  { name: '演唱会 / 音乐节前排', level: '100–110 dB', note: '数分钟至十几分钟即达日剂量' },
  { name: '痛阈 / 喷气引擎近旁', level: '120–130 dB', note: '即时性听损伤风险' }
]

// 功率对照速览（功率翻倍 +3dB）
const POWER_STEPS = [
  { mult: '×2', db: '+3.01 dB' },
  { mult: '×4', db: '+6.02 dB' },
  { mult: '×10', db: '+10 dB' },
  { mult: '×100', db: '+20 dB' }
]

// 三种声源口径（衰减斜率不同）
const SOURCE_MODELS = [
  { id: 'point', name: '点声源（音箱 / 人声，球面波）', formula: '−20·log₁₀(r₂/r₁)' },
  { id: 'line', name: '线声源（列车 / 长声屏障，柱面波）', formula: '−10·log₁₀(r₂/r₁)' },
  { id: 'plane', name: '面声源（大平面近场）', formula: '近场内 ≈ 0' }
]

const DEFAULTS = { mode: 'forward', spl1: '100', r1: '1', r2: '16', spl2: '85' }
const STORAGE_PREFIX = 'spl-distance'

// ---------- UI 状态 ----------
const mode = ref(DEFAULTS.mode)
const spl1In = ref(DEFAULTS.spl1)
const r1In = ref(DEFAULTS.r1)
const r2In = ref(DEFAULTS.r2)
const spl2In = ref(DEFAULTS.spl2)
const seoContentVisible = ref(true)

// 校验
const r1 = computed(() => toNum(r1In.value))
const spl1 = computed(() => toNum(spl1In.value))
const r2 = computed(() => toNum(r2In.value))
const spl2Target = computed(() => toNum(spl2In.value))
const validDist = (d) => d !== null && d > 0 && d <= R_MAX
const validSpl = (s) => s !== null && s >= SPL_MIN && s <= SPL_MAX
const r1Error = computed(() => (!validDist(r1.value) ? `参考距离需在 0.01–${R_MAX} m 之间` : ''))
const r2Error = computed(() => (mode.value === 'forward' && !validDist(r2.value) ? `目标距离需在 0.01–${R_MAX} m 之间` : ''))
const spl1Error = computed(() => (!validSpl(spl1.value) ? `声压级需在 ${SPL_MIN}–${SPL_MAX} dB 之间` : ''))
const spl2Error = computed(() => (mode.value === 'reverse' && !validSpl(spl2Target.value) ? `目标声压级需在 ${SPL_MIN}–${SPL_MAX} dB 之间` : ''))
const spl2NotBelow = computed(() => (mode.value === 'reverse' && validSpl(spl1.value) && validSpl(spl2Target.value) && spl2Target.value >= spl1.value))

// 正向结果
const att = computed(() => (validDist(r1.value) && validDist(r2.value) ? attenuationDb(r1.value, r2.value) : null))
const spl2 = computed(() => (att.value !== null && validSpl(spl1.value) ? spl1.value - att.value : null))
const ratio = computed(() => (validDist(r1.value) && validDist(r2.value) ? r2.value / r1.value : null))

// 反向结果
const rMax = computed(() => {
  if (!validDist(r1.value) || !validSpl(spl1.value) || !validSpl(spl2Target.value)) return null
  if (spl2Target.value >= spl1.value) return null
  return maxDistance(spl1.value, spl2Target.value, r1.value)
})

// 功率补偿（正向有衰减结果时展示）：以 100W 基准演示所需功率放大倍数
const powerCompensate = computed(() => (att.value !== null && att.value > 0 ? powerMultipleFor(att.value) : null))
const powerWattsFrom = computed(() => (powerCompensate.value !== null ? 100 : null))
const powerWattsTo = computed(() => (powerCompensate.value !== null ? 100 * powerCompensate.value : null))

// 口径对照行（有距离比时给出各口径衰减量）
const sourceRows = computed(() =>
  SOURCE_MODELS.map((m) => ({ ...m, dropDb: ratio.value !== null ? modelDropDb(m.id, ratio.value) : null }))
)
const sourceRowsHaveRatio = computed(() => ratio.value !== null)

// ---------- 交互 ----------
function setMode(id) {
  mode.value = id
  saveState()
}

function applyR2(v) {
  r2In.value = String(v)
  saveState()
}

function applySpl2(v) {
  spl2In.value = String(v)
  saveState()
}

function resetAll() {
  mode.value = DEFAULTS.mode
  spl1In.value = DEFAULTS.spl1
  r1In.value = DEFAULTS.r1
  r2In.value = DEFAULTS.r2
  spl2In.value = DEFAULTS.spl2
  saveState()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 本地持久化：键前缀 = 工具 id；仅在交互回调与 onMounted 中读写
function saveState() {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}.mode`, mode.value)
    localStorage.setItem(`${STORAGE_PREFIX}.spl1`, spl1In.value)
    localStorage.setItem(`${STORAGE_PREFIX}.r1`, r1In.value)
    localStorage.setItem(`${STORAGE_PREFIX}.r2`, r2In.value)
    localStorage.setItem(`${STORAGE_PREFIX}.spl2`, spl2In.value)
  } catch (e) { /* 隐私模式等场景静默降级 */ }
}

function restoreState() {
  try {
    const m = localStorage.getItem(`${STORAGE_PREFIX}.mode`)
    if (m === 'forward' || m === 'reverse') mode.value = m
    const spl1Saved = localStorage.getItem(`${STORAGE_PREFIX}.spl1`)
    if (spl1Saved !== null && toNum(spl1Saved) !== null) spl1In.value = spl1Saved
    const r1Saved = localStorage.getItem(`${STORAGE_PREFIX}.r1`)
    if (r1Saved !== null && toNum(r1Saved) !== null) r1In.value = r1Saved
    const r2Saved = localStorage.getItem(`${STORAGE_PREFIX}.r2`)
    if (r2Saved !== null && toNum(r2Saved) !== null) r2In.value = r2Saved
    const spl2Saved = localStorage.getItem(`${STORAGE_PREFIX}.spl2`)
    if (spl2Saved !== null && toNum(spl2Saved) !== null) spl2In.value = spl2Saved
  } catch (e) { /* 静默降级 */ }
}

onMounted(() => {
  addRecentTool('spl-distance')
  restoreState()
})
</script>
