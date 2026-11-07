<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Triangle class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">焊缝强度计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">角焊缝（0.7K 有效厚度）与对接焊缝承载校核，GB 50017 设计值口径，焊脚与焊缝长度反算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线焊缝强度计算工具：角焊缝按等腰直角三角形的 0.7 倍焊脚为有效厚度 h_e=0.7K，承载 N = h_e×l_w×f_fw（正面焊缝静力荷载乘 β_f=1.22 增大系数）；
        对接焊缝按母材等强 N = t×l_w×f（三级检验抗拉按 0.85 折减口径取表值）。内置 Q235/Q355 钢材与 E43/E50/E55 焊材强度设计值（GB 50017-2017 口径），
        支持正算承载与反算最小焊脚 K / 最小焊缝长度 l_w。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 说明条 -->
    <div class="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 mb-6 text-sm text-foreground leading-relaxed">
      <TriangleAlert class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <span>本工具仅教学演示与概念估算，不替代设计：实际焊接连接由注册结构工程师按 GB 50017-2017 及专项规范设计，考虑连接构造、疲劳、延性、施焊空间与检验等级等综合因素。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <!-- 模式切换 -->
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Wrench class="w-5 h-5 mr-2 text-primary" /> ① 计算模式
          </h2>
          <div class="grid grid-cols-3 gap-2">
            <button
              @click="mode = 'fillet'"
              class="px-2 py-2 rounded-lg text-xs font-medium border transition"
              :class="mode === 'fillet' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
            >角焊缝正算</button>
            <button
              @click="mode = 'butt'"
              class="px-2 py-2 rounded-lg text-xs font-medium border transition"
              :class="mode === 'butt' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
            >对接正算</button>
            <button
              @click="mode = 'reverse'"
              class="px-2 py-2 rounded-lg text-xs font-medium border transition"
              :class="mode === 'reverse' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
            >反算 K / L</button>
          </div>
        </div>

        <!-- 钢材与焊材 -->
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Layers class="w-5 h-5 mr-2 text-primary" /> ② 钢材 / 焊材
          </h2>
          <label class="text-sm text-muted-foreground block">
            钢材牌号（板厚 ≤16mm 档）
            <select
              v-model.number="steelId"
              class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="s in STEELS" :key="s.id" :value="s.id">{{ s.label }}</option>
            </select>
          </label>
          <p class="text-xs text-muted-foreground mt-2">
            {{ steel.note }}。焊缝强度设计值：角焊缝 f_fw={{ steel.ffw }} N/mm²（{{ steel.electrode }}），对接 f={{ steel.f }} N/mm²，抗剪 f_v={{ steel.fv }} N/mm²。
          </p>
        </div>

        <hr class="border-border" />

        <!-- 角焊缝输入 -->
        <div v-if="mode === 'fillet' || mode === 'reverse'">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> ③ 角焊缝参数
          </h2>
          <div class="grid grid-cols-2 gap-2">
            <label class="text-sm text-muted-foreground">
              {{ mode === 'reverse' ? '设计荷载 N（kN）' : '焊脚 K（mm）' }}
              <input
                v-if="mode === 'reverse'"
                v-model.number="designKna"
                type="number" min="0" step="1" placeholder="如 60"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                v-else
                v-model.number="legK"
                type="number" min="0" step="1" placeholder="如 6"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="text-sm text-muted-foreground">
              焊缝计算长度 l_w（mm）
              <input
                v-model.number="weldLen"
                type="number" min="0" step="5" :placeholder="mode === 'reverse' ? '如 200' : '如 100'"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
          </div>
          <div class="grid grid-cols-2 gap-2 mt-2">
            <label class="text-sm text-muted-foreground">
              焊缝方位
              <select
                v-model="filletSide"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option :value="'side'">侧面焊缝（受剪，β=1.0）</option>
                <option :value="'end'">正面焊缝（β 按下档）</option>
              </select>
            </label>
            <label class="text-sm text-muted-foreground">
              荷载类型
              <select
                v-model="loadType"
                :disabled="filletSide !== 'end'"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              >
                <option :value="'static'">静力 / 间接动力（β=1.22）</option>
                <option :value="'dynamic'">直接动力（β=1.0）</option>
              </select>
            </label>
          </div>
          <p class="text-xs text-muted-foreground mt-2">
            有效厚度 h_e = 0.7K（等腰直角角焊缝 45° 喉深）；计算长度 = 实际长度减 2K 起灭弧影响后按规范取值，此处按给定 l_w 直算。
          </p>
        </div>

        <!-- 对接焊缝输入 -->
        <div v-if="mode === 'butt'">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> ③ 对接焊缝参数
          </h2>
          <div class="grid grid-cols-2 gap-2">
            <label class="text-sm text-muted-foreground">
              板厚 t（mm）
              <input
                v-model.number="buttT"
                type="number" min="0" step="1" placeholder="如 10"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="text-sm text-muted-foreground">
              焊缝长度 l_w（mm）
              <input
                v-model.number="weldLen"
                type="number" min="0" step="5" placeholder="如 100"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="text-sm text-muted-foreground">
              受力类型
              <select
                v-model="buttStress"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option :value="'tension'">受拉</option>
                <option :value="'compression'">受压</option>
                <option :value="'shear'">受剪</option>
              </select>
            </label>
            <label class="text-sm text-muted-foreground">
              质量等级
              <select
                v-model="buttGrade"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option :value="1">一级 / 二级</option>
                <option :value="3">三级</option>
              </select>
            </label>
          </div>
          <p class="text-xs text-muted-foreground mt-2">
            一、二级对接焊缝与母材等强；三级焊缝受拉按 0.85 口径折减（Q235 取 185、Q355 取 260 N/mm²），受压与受剪不折减。无垫板单面施焊另按 0.85 折减。
          </p>
        </div>

        <!-- 反算参数 -->
        <div v-if="mode === 'reverse'" class="grid grid-cols-2 gap-2">
          <label class="text-sm text-muted-foreground">
            假定焊脚 K（mm）
            <input
              v-model.number="legK"
              type="number" min="0" step="1" placeholder="如 6"
              class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <div class="text-sm text-muted-foreground">反算结果口径
            <div class="mt-1 text-xs text-foreground leading-snug">K 向上取整到 1mm，l_w 向上取整到 10mm</div>
          </div>
        </div>
      </div>

      <!-- 右侧：结果区 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 角焊缝正算 -->
        <div v-if="mode === 'fillet'" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CheckCircle v-if="filletRes" class="w-5 h-5 mr-2 text-green-500" />
            <TriangleAlert v-else class="w-5 h-5 mr-2 text-amber-500" />
            角焊缝承载校核
          </h2>
          <div v-if="filletRes" class="bg-primary/10 rounded-lg p-5 text-center mb-4">
            <p class="text-xs text-muted-foreground mb-1">K={{ fmt1(legK) }}mm · l_w={{ fmt1(weldLen) }}mm · {{ filletRes.sideLabel }} · {{ steel.label }}/{{ steel.electrode }}</p>
            <p class="text-5xl font-bold text-primary tabular-nums">
              {{ fmt1(filletRes.allowKn) }}<span class="text-lg font-semibold ml-1">kN</span>
            </p>
            <p class="text-sm text-muted-foreground mt-2 tabular-nums">
              N = h_e×l_w×f_fw×β = 0.7×{{ fmt1(legK) }}×{{ fmt1(weldLen) }}×{{ steel.ffw }}×{{ fmt2(filletRes.beta) }} = {{ fmt0(filletRes.allowN) }} N
            </p>
          </div>
          <p v-else class="text-sm text-muted-foreground p-3 bg-muted/50 rounded-xl mb-4">填入大于 0 的焊脚与焊缝长度。</p>
          <div v-if="filletRes" class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-4">
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-[10px] text-muted-foreground mb-1">有效厚度 h_e</p>
              <p class="text-sm font-bold text-foreground tabular-nums">{{ fmt2(filletRes.he) }} mm</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-[10px] text-muted-foreground mb-1">有效面积 A_w</p>
              <p class="text-sm font-bold text-foreground tabular-nums">{{ fmt0(filletRes.areaMm2) }} mm²</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-[10px] text-muted-foreground mb-1">β_f 系数</p>
              <p class="text-sm font-bold text-foreground tabular-nums">{{ fmt2(filletRes.beta) }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-[10px] text-muted-foreground mb-1">单位长承载</p>
              <p class="text-sm font-bold text-primary tabular-nums">{{ fmt2(filletRes.perMeterKn) }} kN/m</p>
            </div>
          </div>
          <button
            v-if="filletRes"
            @click="copyFillet"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition"
          >
            <Clipboard class="w-4 h-4" /> 复制校核结果
          </button>
        </div>

        <!-- 对接焊缝正算 -->
        <div v-if="mode === 'butt'" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CheckCircle v-if="buttRes" class="w-5 h-5 mr-2 text-green-500" />
            <TriangleAlert v-else class="w-5 h-5 mr-2 text-amber-500" />
            对接焊缝承载校核
          </h2>
          <div v-if="buttRes" class="bg-primary/10 rounded-lg p-5 text-center mb-4">
            <p class="text-xs text-muted-foreground mb-1">t={{ fmt1(buttT) }}mm · l_w={{ fmt1(weldLen) }}mm · {{ buttRes.stressLabel }} · {{ steel.label }} · {{ buttGrade === 3 ? '三级' : '一/二级' }}</p>
            <p class="text-5xl font-bold text-primary tabular-nums">
              {{ fmt1(buttRes.allowKn) }}<span class="text-lg font-semibold ml-1">kN</span>
            </p>
            <p class="text-sm text-muted-foreground mt-2 tabular-nums">
              N = t×l_w×f_{{ buttRes.stressKey }} = {{ fmt1(buttT) }}×{{ fmt1(weldLen) }}×{{ buttRes.fUsed }} = {{ fmt0(buttRes.allowN) }} N
            </p>
          </div>
          <p v-else class="text-sm text-muted-foreground p-3 bg-muted/50 rounded-xl mb-4">填入大于 0 的板厚与焊缝长度。</p>
          <div v-if="buttRes" class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-[10px] text-muted-foreground mb-1">取用设计值</p>
              <p class="text-sm font-bold text-foreground tabular-nums">{{ buttRes.fUsed }} N/mm²</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">{{ buttRes.note }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-[10px] text-muted-foreground mb-1">有效截面 t×l_w</p>
              <p class="text-sm font-bold text-foreground tabular-nums">{{ fmt0(buttRes.areaMm2) }} mm²</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-[10px] text-muted-foreground mb-1">与母材等强度比</p>
              <p class="text-sm font-bold text-primary tabular-nums">{{ fmt0(buttRes.pctOfBase) }}%</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">相对 f={{ steel.f }}</p>
            </div>
          </div>
        </div>

        <!-- 反算 -->
        <div v-if="mode === 'reverse'" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CheckCircle v-if="revRes" class="w-5 h-5 mr-2 text-green-500" />
            <TriangleAlert v-else class="w-5 h-5 mr-2 text-amber-500" />
            反算最小焊脚 / 最小焊缝长度
          </h2>
          <div v-if="revRes" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="bg-primary/10 rounded-lg p-5 text-center">
              <p class="text-xs text-muted-foreground mb-1">给定 l_w={{ fmt1(revRes.lw) }}mm → 最小焊脚</p>
              <p class="text-4xl font-bold text-primary tabular-nums">{{ fmt1(revRes.kMin) }}<span class="text-base font-semibold ml-1">mm</span></p>
              <p class="text-xs text-muted-foreground mt-2 tabular-nums">精确 {{ fmt2(revRes.kExact) }} mm，工程圆整 {{ fmt1(revRes.kMin) }} mm（{{ revRes.sideLabel }}，β={{ fmt2(revRes.beta) }}）</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-5 text-center">
              <p class="text-xs text-muted-foreground mb-1">给定 K={{ fmt1(revRes.k) }}mm → 最小焊缝长度</p>
              <p class="text-4xl font-bold text-foreground tabular-nums">{{ fmt0(revRes.lMin) }}<span class="text-base font-semibold ml-1">mm</span></p>
              <p class="text-xs text-muted-foreground mt-2 tabular-nums">精确 {{ fmt2(revRes.lExact) }} mm，工程圆整 {{ fmt0(revRes.lMin) }} mm</p>
            </div>
            <p class="sm:col-span-2 text-xs text-muted-foreground leading-relaxed p-2.5 rounded bg-muted/60">
              提示：角焊缝最小焊脚还受构造要求约束（GB 50017：不宜小于 1.5√t 且 ≥4mm；板厚薄侧不宜大于较薄件 1.2 倍等），反算值偏小时按构造取；侧面焊缝过长还受 60h_e 长度限制。
            </p>
          </div>
          <p v-else class="text-sm text-muted-foreground p-3 bg-muted/50 rounded-xl">填入大于 0 的设计荷载、焊缝长度与假定焊脚。</p>
        </div>

        <!-- 设计值速查 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Layers class="w-5 h-5 mr-2 text-primary" /> 强度设计值速查（GB 50017-2017 口径，板厚 ≤16mm）
          </h2>
          <div class="overflow-x-auto rounded-lg border border-border">
            <table class="w-full text-sm">
              <thead class="bg-muted/60 text-muted-foreground text-xs">
                <tr>
                  <th class="px-3 py-2 text-left font-medium">钢材</th>
                  <th class="px-3 py-2 text-center font-medium">焊材</th>
                  <th class="px-3 py-2 text-right font-medium">对接 f（拉/压/弯）</th>
                  <th class="px-3 py-2 text-right font-medium">对接 f_v（剪）</th>
                  <th class="px-3 py-2 text-right font-medium">角焊缝 f_fw</th>
                  <th class="px-3 py-2 text-right font-medium">三级抗拉 f*_t</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in STEELS" :key="s.id" class="border-t border-border tabular-nums" :class="s.id === steelId ? 'bg-primary/5' : ''">
                  <td class="px-3 py-2 font-medium text-foreground">{{ s.label }}</td>
                  <td class="px-3 py-2 text-center text-muted-foreground">{{ s.electrode }}</td>
                  <td class="px-3 py-2 text-right text-foreground">{{ s.f }}</td>
                  <td class="px-3 py-2 text-right text-foreground">{{ s.fv }}</td>
                  <td class="px-3 py-2 text-right font-semibold text-primary">{{ s.ffw }}</td>
                  <td class="px-3 py-2 text-right text-muted-foreground">{{ s.ft3 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground mt-2">板厚 &gt;16mm 分档设计值按 GB 50017-2017 表 4.4.1 / 表 4.4.5 递减，本页统一取 ≤16mm 档；动载结构、疲劳验算与负温工况另行专项考虑。</p>
        </div>
      </div>
    </div>

    <!-- 可折叠 SEO 内容区 -->
    <details open class="bg-card border border-border rounded-lg mb-8">
      <summary class="px-6 py-4 cursor-pointer select-none text-xl font-bold text-foreground flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>焊缝计算原理、公式与常见问题</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground" />
      </summary>
      <div class="px-6 pb-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h3 class="text-lg font-semibold text-foreground">为什么角焊缝按 0.7K 与受剪算？</h3>
        <p>
          角焊缝的截面近似等腰直角三角形，焊脚为 K，从焊根到焊缝表面的最薄弱截面是 45° 方向的「喉部」，有效厚度 h_e = 0.7×K（精确值 K×sin45° = 0.707K，规范取 0.7）。破坏试验表明角焊缝大多沿这一最小截面剪断或拉断，且受力复杂、应力分布不均，所以规范把它简化为「有效厚度截面上的均匀剪应力」校核：N ≤ h_e × l_w × f_fw。f_fw（角焊缝强度设计值，GB 50017-2017 表 4.4.5）本质上是按焊缝抗剪给的综合设计值：E43 配 Q235 取 160 N/mm²，E50 配 Q355 取 200，E55 配 Q390/Q420 取 220。这正是「焊脚翻倍、承载力翻倍」线性关系的来源——想要多一倍承载，加长焊缝或加高焊脚都是等价的，但加长更划算（省焊材、变形小）。
        </p>

        <h3 class="text-lg font-semibold text-foreground">正面焊缝的 1.22 系数还在吗？</h3>
        <p>
          在。正面（端面）角焊缝受力方向垂直于焊缝长度，破坏截面处于拉剪复合应力状态，试验破坏荷载比侧面焊缝高约 35%，因此 GB 50017 对承受静力荷载或间接动力荷载的结构，正面角焊缝乘增大系数 β_f = 1.22；直接承受动力荷载的结构因正面焊缝刚度大、塑性变形能力差，不考虑提高，取 β_f = 1.0。GB 50017-2017 延续了 2003 规范的这一处理，并未取消 1.22。本工具按焊缝方位与荷载类型两个下拉自动取值。
        </p>

        <h3 class="text-lg font-semibold text-foreground">对接焊缝为什么与母材等强？</h3>
        <p>
          对接焊缝（坡口焊）截面就是母材截面 t×l_w，焊材（E43/E50/E55）熔敷金属强度与母材匹配，一、二级检验的对接焊缝缺陷少，规范直接按母材强度设计值取用：Q235 f=215、Q355 f=305 N/mm²（≤16mm 档）。三级检验的对接焊缝允许一定缺陷，受拉时按 0.85 口径折减（表值 Q235 取 185、Q355 取 260），受压与受剪不折减——因为缺陷对受压影响小、抗剪本就按 f_v 取。这就是焊缝质量等级直接影响承载的原因：重要受拉对接焊缝必须一级或二级（100% 超声/射线探伤口径），三级只能用于次要连接。
        </p>

        <h3 class="text-lg font-semibold text-foreground">焊缝质量等级与检验要求</h3>
        <p>
          GB 50017 按受力重要性与荷载性质把对接焊缝分为一、二、三级：一级要求 100% 探伤（超声/射线）且评定等级最严，二级 20% 探伤，三级仅外观检查。受拉对接焊缝设计值：一、二级取母材 f，三级取 0.85f 口径表值；受压均为 f、受剪均为 f_v。角焊缝不分级探伤，按外观检查与尺寸偏差控制，因此其设计值只有一档 f_fw。工程上「吊车梁受拉翼缘拼接」等动载关键焊缝必须一级，一般建筑静载对接可二级，次要构件三级即可——等级每升一级，检验成本显著上升，按需选取。
        </p>

        <h3 class="text-lg font-semibold text-foreground">反算焊脚时的构造约束</h3>
        <p>
          反算出的最小焊脚还要满足构造要求：GB 50017 规定角焊缝焊脚不宜小于 1.5×√t（t 为较薄件厚度，mm）且不小于 4mm——太薄的焊缝冷却快、易开裂；同时不宜大于较薄件厚度 1.2 倍（薄板会烧穿）；侧面焊缝计算长度不宜大于 60×h_e（超出部分应力不均匀，超长部分不计承载贡献）；最小计算长度不低于 8h_e 且 40mm。所以反算结果「偏小」时按构造值取，且永远以正式设计为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground">相关工具</h3>
        <p>
          钢材用量的理论重量换算见 <NuxtLink to="/tools/rebar-weight-calculator" class="text-primary hover:underline">钢筋每米重量换算</NuxtLink>（同按钢材密度 7.85 g/cm³ 口径）；螺栓连接与焊缝是钢结构两类基本连接，概念设计阶段建议两者都校核。
        </p>

        <h3 class="text-lg font-semibold text-foreground">常见问题 (FAQ)</h3>
        <ul class="list-disc pl-5 space-y-2">
          <li><b class="text-foreground">K=6、L=100 的角焊缝能承受多少？</b>侧面焊缝、Q235/E43：0.7×6×100×160 = 67200 N ≈ 67.2 kN；正面焊缝静载乘 1.22 约 82.0 kN。两面施焊（两条焊缝）承载力翻倍。</li>
          <li><b class="text-foreground">t=10、L=100 的对接焊缝呢？</b>一/二级、Q235：10×100×215 = 215000 N = 215 kN（受压受拉同值）；三级受拉 10×100×185 = 185 kN。</li>
          <li><b class="text-foreground">60 kN 荷载用多长焊缝？</b>K=6、侧面焊缝、E43：l_w = 60000/(0.7×6×160) ≈ 89.3mm，圆整 90mm（每条）；两面焊可各减半。用「反算 K / L」模式自动算。</li>
          <li><b class="text-foreground">计算长度和实际长度差多少？</b>每条角焊缝两端各减 K（起灭弧缺陷），或采用引弧板焊后切除磨平则不折减。本页按输入的 l_w 直算，l_w 建议自行扣除。</li>
          <li><b class="text-foreground">本工具能用于正式设计吗？</b>不能。仅教学演示与概念估算；正式焊接连接由注册结构工程师按 GB 50017-2017 及专项规范设计并签章。</li>
        </ul>

        <p class="text-xs pt-3 border-t border-border/50">
          来源与口径注记：设计值两源交叉自 GB 50017-2017《钢结构设计标准》表 4.4.1（钢材 f/fv：Q235 215/125、Q355 305/175）与表 4.4.5（焊缝 f_fw：E43 160、E50 200、E55 220），β_f=1.22（静力/间接动力，正面角焊缝）与三级对接受拉 0.85 折减口径自条文及配套设计手册复核，现行规范口径为准。本页不替代工程设计。
        </p>
      </div>
    </details>

    <RelatedTools :currentToolId="'weld-strength-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Triangle, Info, CheckCircle, TriangleAlert, Layers, Ruler, Wrench, ChevronDown, Clipboard
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '焊缝强度计算器 - 角焊缝/对接焊缝承载力与焊脚反算在线工具',
  description: '免费在线焊缝强度计算：角焊缝 h_e=0.7K 有效厚度 N=h_e·l_w·f_fw（正面焊缝 β=1.22），对接焊缝 N=t·l_w·f，Q235/Q355 与 E43/E50/E55 设计值（GB 50017-2017 口径），反算最小焊脚与焊缝长度，附焊缝质量等级说明，纯浏览器本地运行。',
  keywords: '焊缝强度计算,角焊缝计算,焊脚尺寸,对接焊缝,钢结构焊缝,焊缝承载力,GB50017',
  author: '有条工具',
  ogTitle: '焊缝强度计算器 - 角焊缝/对接焊缝承载力校核 | 有条工具',
  ogDescription: '角焊缝 0.7K 与对接等强校核，Q235/Q355 设计值，反算最小焊脚与焊缝长度。',
  ogUrl: 'https://www.util.cn/tools/weld-strength-calculator',
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
          name: '焊缝强度计算器',
          url: 'https://www.util.cn/tools/weld-strength-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['角焊缝 0.7K 有效厚度承载校核', '正面焊缝 β_f=1.22/1.0 分档', '对接焊缝拉/压/剪与质量等级分档', 'Q235/Q355/E43/E50/E55 设计值速查', '反算最小焊脚 K 与焊缝长度', '构造约束提示（1.5√t、60h_e 等）', '教学演示免责声明', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '焊缝强度计算器', item: 'https://www.util.cn/tools/weld-strength-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'K=6、L=100 的角焊缝能承受多少？',
              acceptedAnswer: { '@type': 'Answer', text: '侧面焊缝、Q235 钢配 E43 焊条：0.7×6×100×160=67200N≈67.2kN；正面焊缝静力荷载乘 β_f=1.22 约 82.0kN；两面施焊承载力翻倍。' }
            },
            {
              '@type': 'Question',
              name: '正面角焊缝的 1.22 系数取消了吗？',
              acceptedAnswer: { '@type': 'Answer', text: '没有。GB 50017-2017 延续原规范：承受静力荷载和间接动力荷载时正面角焊缝乘 β_f=1.22；直接承受动力荷载取 1.0（正面焊缝刚度大、塑性差）。' }
            },
            {
              '@type': 'Question',
              name: '焊缝质量等级怎么影响承载力？',
              acceptedAnswer: { '@type': 'Answer', text: '对接焊缝一、二级与母材等强（Q235 f=215、Q355 f=305 N/mm²），三级受拉按 0.85 口径折减（表值 185/260），受压受剪不折减；一级 100% 探伤、二级 20%、三级外观检查。角焊缝不分级，按外观与尺寸控制。' }
            },
            {
              '@type': 'Question',
              name: '60kN 荷载需要多长焊缝？',
              acceptedAnswer: { '@type': 'Answer', text: 'K=6 侧面焊缝、E43（f_fw=160）：l_w=60000/(0.7×6×160)≈89.3mm，圆整 90mm（每条），两面焊各减半；反算值还须满足最小焊脚 1.5√t 且 ≥4mm 等构造要求。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
function num(v) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}
function fmt0(v) { return Number.isFinite(v) ? Math.round(v).toLocaleString('en-US') : '—' }
function fmt1(v) { return Number.isFinite(v) ? v.toFixed(1) : '—' }
function fmt2(v) { return Number.isFinite(v) ? v.toFixed(2) : '—' }

// 钢材 / 焊材设计值（GB 50017-2017 表 4.4.1 / 4.4.5，板厚 ≤16mm 档）
const STEELS = [
  { id: 235, label: 'Q235', electrode: 'E43 型', f: 215, fv: 125, ffw: 160, ft3: 185, note: '低碳钢，普通钢结构最常用' },
  { id: 355, label: 'Q355', electrode: 'E50 型', f: 305, fv: 175, ffw: 200, ft3: 260, note: '低合金高强度钢，梁柱主力（原 Q345）' },
  { id: 390, label: 'Q390', electrode: 'E55 型', f: 350, fv: 205, ffw: 220, ft3: 295, note: '高层重载结构，焊接工艺要求高' }
]
const BETA_END_STATIC = 1.22 // 正面角焊缝 静力/间接动力荷载增大系数
const BETA_END_DYNAMIC = 1.0 // 直接动力荷载不考虑提高

// 角焊缝：h_e=0.7K，N = h_e×l_w×f_fw×β（N）
function filletCapacity(legK, lenLw, ffw, beta) {
  const k = num(legK), l = num(lenLw), f = num(ffw), b = num(beta)
  if (!k || !l || !f || !b) return null
  const he = 0.7 * k
  const n = he * l * f * b
  return { he, areaMm2: he * l, allowN: n, allowKn: n / 1000 }
}
// β 取值：侧面 1.0；正面 静力/间接动力 1.22、直接动力 1.0
function filletBeta(side, loadType) {
  if (side === 'end') return loadType === 'dynamic' ? BETA_END_DYNAMIC : BETA_END_STATIC
  return 1.0
}
// 单位长度承载（N/mm）
function filletPerMm(legK, ffw, beta) {
  const k = num(legK), f = num(ffw), b = num(beta)
  if (!k || !f || !b) return null
  return 0.7 * k * f * b
}

// 对接焊缝：N = t×l_w×f_used；三级受拉按 0.85 口径表值 ft3，受压取 f，受剪取 fv
function buttCapacity(t, lenLw, fUsed) {
  const tV = num(t), l = num(lenLw), f = num(fUsed)
  if (!tV || !l || !f) return null
  const n = tV * l * f
  return { areaMm2: tV * l, allowN: n, allowKn: n / 1000 }
}
function buttDesignValue(steel, stress, grade) {
  if (stress === 'shear') return { fUsed: steel.fv, key: 'v', note: '抗剪设计值 f_v' }
  if (stress === 'compression') return { fUsed: steel.f, key: 'c', note: '抗压与母材等强（各级同）' }
  if (grade === 3) return { fUsed: steel.ft3, key: 't', note: '三级受拉按 0.85 口径表值' }
  return { fUsed: steel.f, key: 't', note: '一/二级与母材等强' }
}

// 反算：给定 N → 最小焊脚（l_w 已知）与最小焊缝长度（K 已知）
function minLegK(forceN, lenLw, ffw, beta) {
  const n = num(forceN), l = num(lenLw), f = num(ffw), b = num(beta)
  if (!n || !l || !f || !b) return null
  const kExact = n / (0.7 * l * f * b)
  return { kExact, kMin: Math.ceil(kExact - 1e-9) }
}
function minWeldLen(forceN, legK, ffw, beta) {
  const n = num(forceN), k = num(legK), f = num(ffw), b = num(beta)
  if (!n || !k || !f || !b) return null
  const lExact = n / (0.7 * k * f * b)
  return { lExact, lMin: Math.ceil(lExact / 10 - 1e-9) * 10 }
}

// ---------- 页面状态 ----------
const mode = ref('fillet') // fillet | butt | reverse
const steelId = ref(235)
const legK = ref(6)
const weldLen = ref(100)
const filletSide = ref('side')
const loadType = ref('static')
const buttT = ref(10)
const buttStress = ref('tension')
const buttGrade = ref(1)
const designKna = ref(60)

// ---------- 派生计算 ----------
const steel = computed(() => STEELS.find((s) => s.id === steelId.value) || STEELS[0])
const betaEff = computed(() => filletBeta(filletSide.value, loadType.value))

const filletRes = computed(() => {
  const r = filletCapacity(legK.value, weldLen.value, steel.value.ffw, betaEff.value)
  if (!r) return null
  const perMm = filletPerMm(legK.value, steel.value.ffw, betaEff.value)
  return {
    ...r,
    beta: betaEff.value,
    sideLabel: filletSide.value === 'end' ? '正面焊缝' : '侧面焊缝',
    perMeterKn: (perMm || 0) / 1000
  }
})

const buttRes = computed(() => {
  const dv = buttDesignValue(steel.value, buttStress.value, buttGrade.value)
  const r = buttCapacity(buttT.value, weldLen.value, dv.fUsed)
  if (!r) return null
  const stressLabel = buttStress.value === 'shear' ? '受剪' : buttStress.value === 'compression' ? '受压' : '受拉'
  return {
    ...r,
    fUsed: dv.fUsed,
    stressKey: dv.key,
    note: dv.note,
    stressLabel,
    pctOfBase: (dv.fUsed / steel.value.f) * 100
  }
})

const revRes = computed(() => {
  const n = num(designKna.value) * 1000 // kN → N
  const kR = minLegK(n, weldLen.value, steel.value.ffw, betaEff.value)
  const lR = minWeldLen(n, legK.value, steel.value.ffw, betaEff.value)
  if (!kR || !lR) return null
  return {
    ...kR,
    ...lR,
    k: legK.value,
    lw: weldLen.value,
    beta: betaEff.value,
    sideLabel: filletSide.value === 'end' ? '正面焊缝' : '侧面焊缝'
  }
})

// ---------- 事件 ----------
function copyFillet() {
  const r = filletRes.value
  if (!r) { alert('当前输入不完整'); return }
  const text = `【角焊缝承载】K=${legK.value}mm, l_w=${weldLen.value}mm, ${r.sideLabel}（β=${r.beta}）, ${steel.value.label}/${steel.value.electrode}: N≤${r.allowKn.toFixed(1)}kN（h_e=${r.he.toFixed(2)}mm）`
  navigator.clipboard.writeText(text).then(() => alert('已复制'), () => alert('复制失败，请手动复制'))
}

onMounted(() => {
  addRecentTool('weld-strength-calculator')
})
</script>
