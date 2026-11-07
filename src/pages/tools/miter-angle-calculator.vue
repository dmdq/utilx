<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Triangle class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">斜切角计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">任意墙角对切、正多边形拼接、两段墙角分配三种模式，锯切角与斜切锯基准换算一步到位</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线斜切角计算器：装踢脚线、贴石膏线、拼画框遇到不是 90° 的墙角怎么办？三种模式全覆盖——
        ①任意墙角对切：实测墙角角度 θ，每边对切角 = θ/2，支持三边测量法（量三段距离用余弦定理求角）；
        ②正多边形拼接：边数 3~12，内角 =(n−2)×180/n、每边切内角的一半（正五边形 108° 切 54°、六边形切 60°、方形画框切 45°）；
        ③两段墙角分配：不方正墙 α+β≠180° 时按均分或按边长比把角分给两根料。输出同时给出
        「对切角（端面与工件边线的夹角）」和常见斜切锯 0° 基准的刻度设定值，并提醒先试切废料。
        全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Triangle class="w-5 h-5 mr-2 text-primary" /> 计算模式与参数
        </h2>

        <!-- 模式选择 -->
        <div class="grid grid-cols-3 gap-2" role="group" aria-label="计算模式">
          <button
            v-for="m in MODES"
            :key="m.id"
            type="button"
            class="px-2 py-2 rounded-lg border text-xs font-medium transition"
            :class="mode === m.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            @click="mode = m.id"
          >{{ m.label }}</button>
        </div>

        <!-- 模式①：任意墙角 -->
        <div v-if="mode === 'corner'" class="space-y-4">
          <div class="flex items-center gap-3">
            <label for="ma-theta" class="text-sm text-foreground whitespace-nowrap">墙角实测角 θ</label>
            <input
              id="ma-theta"
              v-model.number="theta"
              type="number"
              min="1"
              max="359"
              step="0.5"
              class="w-28 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <span class="text-sm text-muted-foreground">°（90° 方正，>90° 或 <90° 为不方正）</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="t in THETA_CHIPS"
              :key="t"
              type="button"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="theta === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="theta = t"
            >{{ t }}°</button>
          </div>

          <!-- 三边法辅助 -->
          <div class="border-t border-border pt-4">
            <p class="text-sm font-medium text-foreground mb-1">三边测量法求角（不方便量角度时）</p>
            <p class="text-[11px] text-muted-foreground mb-2 leading-relaxed">
              从墙角沿两面墙各量一段 a、b（建议取 500mm），再量 a、b 端点连线 c，按余弦定理求出墙角。
            </p>
            <div class="flex flex-wrap items-center gap-2">
              <input
                v-model.number="triA"
                type="number"
                min="1"
                step="any"
                aria-label="边 a"
                class="w-20 border border-border bg-background rounded-lg px-2 py-1.5 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <span class="text-xs text-muted-foreground">a</span>
              <input
                v-model.number="triB"
                type="number"
                min="1"
                step="any"
                aria-label="边 b"
                class="w-20 border border-border bg-background rounded-lg px-2 py-1.5 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <span class="text-xs text-muted-foreground">b</span>
              <input
                v-model.number="triC"
                type="number"
                min="1"
                step="any"
                aria-label="边 c"
                class="w-20 border border-border bg-background rounded-lg px-2 py-1.5 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <span class="text-xs text-muted-foreground">c（mm 同单位即可）</span>
              <button
                type="button"
                class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition"
                @click="applyTriangle"
              >求角并带入</button>
            </div>
            <p v-if="triNote" class="text-xs mt-2" :class="triOk ? 'text-green-600' : 'text-red-500'">{{ triNote }}</p>
          </div>
        </div>

        <!-- 模式②：正多边形 -->
        <div v-if="mode === 'polygon'" class="space-y-4">
          <div>
            <p class="text-sm font-medium text-foreground mb-1.5">边数 n（3~12）</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="n in POLY_NS"
                :key="n"
                type="button"
                class="px-3 py-1.5 rounded-md text-xs font-medium border transition"
                :class="polyN === n ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
                @click="polyN = n"
              >{{ n }} 边</button>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            画框/镜框拼接 = 4 边正方形口径（每边 45°）；蜂巢造型、六边形搁板 = 6 边；五边形展柜 = 5 边。
            相邻两根料的端面各切内角的一半，拼起来正好是内角。
          </p>
        </div>

        <!-- 模式③：两段墙角 -->
        <div v-if="mode === 'twoSeg'" class="space-y-4">
          <p class="text-xs text-muted-foreground leading-relaxed">
            两段墙各与基准线（或借用直尺桥）实测夹角 α、β，墙角总角 Θ = α + β（不方正墙 α+β 常不为 180°）。
            两根料在墙角对接，把总角分给两边。
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <label for="ma-alpha" class="text-sm text-foreground">α</label>
            <input
              id="ma-alpha"
              v-model.number="alpha"
              type="number"
              min="1"
              max="350"
              step="0.5"
              class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <label for="ma-beta" class="text-sm text-foreground">β</label>
            <input
              id="ma-beta"
              v-model.number="beta"
              type="number"
              min="1"
              max="350"
              step="0.5"
              class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <span class="text-sm text-muted-foreground">°，总角 Θ = <span class="font-mono text-foreground">{{ fmt(sumAngle) }}°</span></span>
          </div>
          <div>
            <p class="text-sm font-medium text-foreground mb-1.5">分配方式</p>
            <div class="grid grid-cols-2 gap-2" role="group" aria-label="分配方式">
              <button
                type="button"
                class="px-3 py-2 rounded-lg border text-sm font-medium transition"
                :class="alloc === 'even' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
                @click="alloc = 'even'"
              >
                均分（各 Θ/2）
                <span class="block text-[10px] font-normal mt-0.5" :class="alloc === 'even' ? 'text-primary-foreground/80' : 'text-muted-foreground'">接缝在角平分线上</span>
              </button>
              <button
                type="button"
                class="px-3 py-2 rounded-lg border text-sm font-medium transition"
                :class="alloc === 'length' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
                @click="alloc = 'length'"
              >
                按边长比分配
                <span class="block text-[10px] font-normal mt-0.5" :class="alloc === 'length' ? 'text-primary-foreground/80' : 'text-muted-foreground'">长边多担角、短边少担角</span>
              </button>
            </div>
          </div>
          <div v-if="alloc === 'length'" class="flex flex-wrap items-center gap-3">
            <label for="ma-l1" class="text-sm text-foreground">料①长</label>
            <input
              id="ma-l1"
              v-model.number="len1"
              type="number"
              min="0.1"
              step="any"
              class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <label for="ma-l2" class="text-sm text-foreground">料②长</label>
            <input
              id="ma-l2"
              v-model.number="len2"
              type="number"
              min="0.1"
              step="any"
              class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <span class="text-xs text-muted-foreground">mm（只影响比例，单位一致即可）</span>
          </div>
        </div>

        <div v-if="validationIssues.length" class="space-y-1.5">
          <p v-for="issue in validationIssues" :key="issue" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ issue }}</span>
          </p>
        </div>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-4">
        <!-- 结果大卡 -->
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Scissors class="w-5 h-5 mr-2 text-primary" /> 锯切角结果
          </h2>
          <div v-if="result" class="space-y-3">
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-xs text-muted-foreground mb-1">{{ result.modeLabel }}</p>
              <p class="text-3xl lg:text-4xl font-bold text-primary font-mono leading-tight">{{ result.line1 }}</p>
              <p class="text-xs text-muted-foreground mt-2">{{ result.line2 }}</p>
            </div>
            <div v-if="result.rows && result.rows.length" class="space-y-2">
              <div
                v-for="row in result.rows"
                :key="row.label"
                class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-muted/40 px-4 py-3"
              >
                <span class="text-sm font-semibold text-foreground">{{ row.label }}</span>
                <span class="text-sm font-mono text-primary">对切角 {{ fmt(row.cut) }}°</span>
                <span class="text-sm font-mono text-muted-foreground">锯设定(0°基准) {{ fmt(row.saw) }}°</span>
              </div>
            </div>
            <div class="p-3 rounded-lg bg-muted/40 border border-border text-xs text-foreground leading-relaxed flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>基准换算说明：对切角是端面与工件边线的夹角（θ/2 口径）；常见斜切锯 0° 刻度是"垂直切断"，此时刻度设定 = |90° − 对切角|。两种口径在 45°（方正角）时恰好相同，其余角度务必按你的锯的刻度基准换算，并先试切废料验证。</span>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>实操提示：先在废料上按计算角度切两小段对接检查（拼缝对齐、夹角贴合），再切正式料；两根料各切一半角，误差各担一半比一根料全担更宽容。</span>
            </p>
            <button
              type="button"
              class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
              @click="copyResult"
            >
              <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制锯切参数文本
            </button>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">参数无效</p>
              <p class="text-xs text-muted-foreground mt-1">角度需在 1°~359°（墙角口径）；两段模式 α+β 需在 1°~359°；边长需为正数。</p>
            </div>
          </div>
        </div>

        <!-- 常用速查卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Table class="w-5 h-5 mr-2 text-primary" /> 正多边形速查表（内角 / 对切角 / 锯设定）
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">边数</th>
                  <th class="py-2 pr-3 font-medium">内角</th>
                  <th class="py-2 pr-3 font-medium">对切角（内角/2）</th>
                  <th class="py-2 font-medium">锯设定（0° 基准）</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="n in POLY_NS"
                  :key="n"
                  class="border-b border-border/60"
                  :class="polyN === n ? 'bg-primary/5' : ''"
                >
                  <td class="py-2 pr-3 font-medium text-foreground cursor-pointer" @click="polyN = n">{{ n }} 边</td>
                  <td class="py-2 pr-3 font-mono text-foreground">{{ fmt(polygonOf(n).interior) }}°</td>
                  <td class="py-2 pr-3 font-mono text-primary">{{ fmt(polygonOf(n).cut) }}°</td>
                  <td class="py-2 font-mono text-muted-foreground">{{ fmt(polygonOf(n).saw) }}°</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground mt-3">方形画框每边切 45°；正五边形内角 108°、每边切 54°；正六边形内角 120°、切 60°。锯设定按 0°=垂直切断基准 = 90° − 对切角。</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-6" open>
      <summary class="text-base font-semibold text-foreground cursor-pointer select-none mb-4">公式推导、阴阳角区别与常见问题</summary>

      <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>斜切角计算器是什么？</h2>
      <p class="text-sm text-muted-foreground leading-relaxed mb-4">
        两根线材/型材在角落对接时，端面各切一半的角，拼起来正好等于墙角或造型角，这就是"对切"。
        本工具覆盖三种现场场景：任意墙角（实测角 θ，每边 θ/2）、正多边形（边数 n，内角 =(n−2)×180/n，每边切一半）、
        两段墙角（不方正墙 α+β≠180°，把总角均分或按边长比分给两根料）。核心公式：
        <strong class="text-foreground">对切角 = 拼角 ÷ 2</strong>；正多边形内角 =(n−2)×180/n；
        两段分配时料①角 = Θ×L₁/(L₁+L₂)、料②角 = Θ×L₂/(L₁+L₂)。
        输出同时给出常见斜切锯 0° 基准的刻度值，避免两种角度口径差 90° 的经典翻车。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">锯切补偿：0° 基准 vs 端面角口径</h3>
      <p class="text-sm text-muted-foreground leading-relaxed">
        本页"对切角"指<strong class="text-foreground">端面与工件边线的夹角</strong>（几何口径）：墙角 θ=100° 每边对切 50°，
        正五边形内角 108° 每边切 54°，方形画框 45°。而国内常见斜切锯/角向磨机的刻度盘 <strong class="text-foreground">0° 是垂直切断</strong>，
        刻度 = 90° − 端面角，所以 θ=100° 墙角实际把锯摆到 40°、正五边形摆到 36°、六边形摆到 30°、画框摆到 45°（恰好相同）。
        也有少数锯以工件边为 0°（端面角直读）。拿到一台不熟悉的锯，先用废料切 45° 试拼一个直角验证刻度口径，
        再按本页数值换算，比记住"该切多少"更保险。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">踢脚线阴阳角怎么处理？</h3>
      <p class="text-sm text-muted-foreground leading-relaxed">
        <strong class="text-foreground">阳角</strong>（凸角，两墙向外张开）用对切：两根踢脚线端面各切一半角（方正阳角各切 45°）拼成 90°，
        拼缝朝向房间内侧；不方正阳角按实测角各切一半。<strong class="text-foreground">阴角</strong>（凹角，两墙向内收）
        装修通行两种做法：一是同样对切（各切一半拼内角）；二是更宽容的"45° 搭切"——一根料切齐顶到墙，另一根端面切 45° 斜口
        扣搭在第一根上（45° 斜搭），墙角再歪缝也不容易张开，是最常用的现场兜底手法。
        石膏线、收口条同理：先看阴阳角，再决定对切还是搭切。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">不方正墙的三边测量法</h3>
      <p class="text-sm text-muted-foreground leading-relaxed">
        角度尺在窄角落经常放不进、读不出，现场常用三边法：从墙角沿两面墙各量一段 a 和 b（建议 500mm 或 1000mm），
        再量两段端点的直线距离 c，用余弦定理 cosθ=(a²+b²−c²)/(2ab) 求出墙角 θ。
        例：a=500、b=500、c=707 时 cosθ≈0.002 → θ≈90°；c=620 时 θ≈77.6°，说明墙角比直角"尖"了 12° 多。
        本页模式①内置该换算，填三个数即可求角并带入计算。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">搭配工具</h3>
      <p class="text-sm text-muted-foreground leading-relaxed">
        需要在度与弧度、度分秒之间换算（图纸标注常出现弧度或 DMS），用本站角度单位转换器：
        <NuxtLink to="/tools/angle-unit-converter/" class="text-primary font-medium hover:underline">/tools/angle-unit-converter/</NuxtLink>。
      </p>

      <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-semibold text-foreground">100° 的不方正墙角，踢脚线每边切多少？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            对切口径：每边端面与工件边线的夹角 = 100°÷2 = 50°。若你的斜切锯 0° 刻度是垂直切断，则摆到 90°−50° = 40°。
            先在废料上试切验证拼缝，再切正式料。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">正五边形和六边形造型每边切几度？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            正五边形内角 (5−2)×180÷5 = 108°，每边对切 54°（0° 基准锯设定 36°）；正六边形内角 120°、每边对切 60°（锯设定 30°）；
            方形画框内角 90°、每边对切 45°（锯设定 45°）。速查表见交互区。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">两段墙加起来不是 180° 怎么分配？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            墙角总角 Θ = α+β（不方正墙常见 176°~184° 或更偏）。均分时每根料切 Θ/2；
            两根料长短差很多或其中一根要精确落到门套边时，选按边长比分配：料①切 Θ×L₁/(L₁+L₂)、料②切 Θ×L₂/(L₁+L₂)，
            把偏差更多地让给长料。切完先干拼检查再打胶固定。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">为什么我按 45° 切，拼出来角却不是 90°？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            三种常见原因：①墙角本身不方正（用三边法量一下，多数老房不是 90°）；②锯的刻度基准不是你以为的口径
            （0° 基准与端面角差 90°）；③切的是"锯盘偏转角"而工件没靠紧挡板产生滑动误差。先用本页算出理论角，
            再按"先试切废料、逐步修正"的流程校准。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">数据会上传吗？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            不会。角度换算全部在你的浏览器内用三角函数即时完成，无网络请求，输入不被保存或上传。
          </p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'miter-angle-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Triangle, Scissors, Info, CheckCircle, TriangleAlert, Copy, Table
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '斜切角计算器 - 墙角对切/多边形拼接/两段墙角分配 | 有条工具',
  description: '免费在线斜切角计算器：任意墙角实测角对切（每边 θ/2，含三边测量法余弦定理求角）、正多边形拼接内角=(n−2)×180/n 每边切一半、两段不方正墙角均分或按边长比分配，附斜切锯 0° 基准与端面角口径换算、阴阳角处理说明与先试切废料提示，纯浏览器本地计算',
  keywords: '斜切角计算器,墙角切角计算,踢脚线切角,多边形拼接角度,画框45度切角',
  author: '有条工具',
  ogTitle: '斜切角计算器 - 墙角对切/多边形拼接/两段墙角 | 有条工具',
  ogDescription: '三种模式算锯切角：任意墙角 θ/2、正多边形内角一半、两段墙角分配，附锯基准换算与试切提示。',
  ogUrl: 'https://www.util.cn/tools/miter-angle-calculator',
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
          name: '斜切角计算器',
          url: 'https://www.util.cn/tools/miter-angle-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '任意墙角实测角对切（每边 θ/2）',
            '三边测量法余弦定理求角',
            '正多边形 3~12 边内角与对切角速查',
            '两段不方正墙角均分/按边长比分配',
            '对切角与斜切锯 0° 基准刻度双口径输出',
            '阴阳角处理与先试切废料提示',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '斜切角计算器', item: 'https://www.util.cn/tools/miter-angle-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '100° 的不方正墙角，踢脚线每边切多少？',
              acceptedAnswer: { '@type': 'Answer', text: '对切口径：每边端面与工件边线的夹角 = 100°÷2 = 50°；常见斜切锯 0° 为垂直切断基准，刻度摆到 90°−50° = 40°。先试切废料验证拼缝。' }
            },
            {
              '@type': 'Question',
              name: '正五边形和六边形造型每边切几度？',
              acceptedAnswer: { '@type': 'Answer', text: '正五边形内角 108°，每边对切 54°（0° 基准锯设定 36°）；正六边形内角 120°、每边对切 60°（锯设定 30°）；方形画框内角 90°、每边对切 45°。' }
            },
            {
              '@type': 'Question',
              name: '踢脚线阴阳角分别怎么处理？',
              acceptedAnswer: { '@type': 'Answer', text: '阳角通行对切：两根各切实测角的一半拼合；阴角可对切，也可用更宽容的 45° 搭切（一根切齐顶墙、另一根切 45° 斜口扣搭），墙角不方正时缝不易张开。' }
            },
            {
              '@type': 'Question',
              name: '两段墙加起来不是 180° 怎么分配切角？',
              acceptedAnswer: { '@type': 'Answer', text: '总角 Θ=α+β：均分时每根料切 Θ/2；按边长比分配时料①切 Θ×L₁/(L₁+L₂)、料②切 Θ×L₂/(L₁+L₂)，把偏差更多让给长料，切完先干拼检查。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 口径约定：对切角 = 端面与工件边线的夹角 = 拼角的一半；斜切锯 0° 基准（垂直切断）刻度 = |90° − 对切角|。
/* TESTABLE-START */
const DEG = 180 / Math.PI

// 任意墙角对切：θ ∈ (0, 360)；返回 { cut, saw }，非法返回 null
function miterFromCorner(theta) {
  const t = Number(theta)
  if (!Number.isFinite(t) || t <= 0 || t >= 360) return null
  const cut = t / 2
  const saw = Math.abs(90 - cut)
  return { cut, saw, theta: t }
}

// 三边测量法求角（余弦定理）：a、b 为角两侧邻边，c 为对边；返回角度（0~180）或 null
function threeSideAngle(a, b, c) {
  const A = Number(a), B = Number(b), C = Number(c)
  if (!Number.isFinite(A) || !Number.isFinite(B) || !Number.isFinite(C) || A <= 0 || B <= 0 || C <= 0) return null
  if (A + B <= C || A + C <= B || B + C <= A) return null
  const cos = (A * A + B * B - C * C) / (2 * A * B)
  const clamped = Math.min(1, Math.max(-1, cos))
  return Math.acos(clamped) * DEG
}

// 正多边形：n ∈ [3, 12]；内角 = (n−2)×180/n，对切角 = 内角/2，锯设定 = 90 − 内角/2 = 180/n
function polygonOf(n) {
  const N = Number(n)
  if (!Number.isInteger(N) || N < 3 || N > 12) return null
  const interior = ((N - 2) * 180) / N
  const cut = interior / 2
  const saw = 90 - cut
  return { n: N, interior, cut, saw }
}

// 两段墙角分配：总角 Θ = α+β ∈ (0, 360)；alloc='even' 均分，'length' 按 L1:L2 分配
// 返回 { theta, cuts: [c1, c2], saws: [s1, s2] }，非法返回 null
function twoSegmentCorners(alpha, beta, l1, l2, alloc) {
  const A = Number(alpha), B = Number(beta)
  if (!Number.isFinite(A) || !Number.isFinite(B) || A <= 0 || B <= 0) return null
  const theta = A + B
  if (theta <= 0 || theta >= 360) return null
  let c1, c2
  if (alloc === 'length') {
    const L1 = Number(l1), L2 = Number(l2)
    if (!Number.isFinite(L1) || !Number.isFinite(L2) || L1 <= 0 || L2 <= 0) return null
    c1 = theta * L1 / (L1 + L2)
    c2 = theta * L2 / (L1 + L2)
  } else {
    c1 = theta / 2
    c2 = theta / 2
  }
  return {
    theta,
    cuts: [c1, c2],
    saws: [Math.abs(90 - c1), Math.abs(90 - c2)]
  }
}

function roundTo(v, digits) {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  const p = Math.pow(10, digits)
  return Math.round(n * p) / p
}
/* TESTABLE-END */

function fmt(v) {
  const r = roundTo(v, 1)
  return r === null ? '—' : String(r)
}

// ---------- 静态数据 ----------
const MODES = [
  { id: 'corner', label: '任意墙角对切' },
  { id: 'polygon', label: '正多边形拼接' },
  { id: 'twoSeg', label: '两段墙角分配' }
]

const THETA_CHIPS = [45, 60, 87.5, 90, 92.5, 100, 120, 135, 270]

const POLY_NS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// ---------- 响应式参数 ----------
const mode = ref('corner')
const theta = ref(100)
const triA = ref(500)
const triB = ref(500)
const triC = ref(707)
const polyN = ref(5)
const alpha = ref(95)
const beta = ref(85)
const alloc = ref('even')
const len1 = ref(2000)
const len2 = ref(1000)

const sumAngle = computed(() => {
  const a = Number(alpha.value), b = Number(beta.value)
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null
  return a + b
})

// 三边法求角反馈
const triAngle = computed(() => threeSideAngle(triA.value, triB.value, triC.value))
const triOk = computed(() => triAngle.value !== null)
const triNote = computed(() => {
  if (triAngle.value === null) return '三边无法构成三角形（不满足两边之和大于第三边）或数值无效。'
  return `求得墙角约 ${fmt(triAngle.value)}°，已可点击"求角并带入"。`
})

const validationIssues = computed(() => {
  const list = []
  if (mode.value === 'corner') {
    const t = Number(theta.value)
    if (!Number.isFinite(t) || t <= 0 || t >= 360) list.push('墙角 θ 需在 1°~359° 之间')
  }
  if (mode.value === 'twoSeg') {
    if (sumAngle.value === null) list.push('α、β 需为正数')
    else if (sumAngle.value <= 0 || sumAngle.value >= 360) list.push('α+β 需在 1°~359° 之间')
    if (alloc.value === 'length') {
      const l1 = Number(len1.value), l2 = Number(len2.value)
      if (!Number.isFinite(l1) || !Number.isFinite(l2) || l1 <= 0 || l2 <= 0) list.push('两根料长度需为正数')
    }
  }
  return list
})

// ---------- 计算结果 ----------
const result = computed(() => {
  if (validationIssues.value.length) return null
  if (mode.value === 'corner') {
    const r = miterFromCorner(theta.value)
    if (!r) return null
    const shapeNote = r.theta === 90
      ? '方正直角：每边切 45°，锯设定（0° 基准）也是 45°。'
      : `墙角 ${fmt(r.theta)}°：每边对切 ${fmt(r.cut)}°；常见斜切锯 0° 基准设定 ${fmt(r.saw)}°。`
    return {
      modeLabel: '任意墙角对切（每边 θ/2）',
      line1: `每边对切 ${fmt(r.cut)}°`,
      line2: shapeNote,
      rows: [{ label: '料① 与 料②', cut: r.cut, saw: r.saw }]
    }
  }
  if (mode.value === 'polygon') {
    const p = polygonOf(polyN.value)
    if (!p) return null
    return {
      modeLabel: `正 ${p.n} 边形拼接（每边切内角的一半）`,
      line1: `每边对切 ${fmt(p.cut)}°`,
      line2: `内角 ${fmt(p.interior)}° = (${p.n}−2)×180÷${p.n}；每边对切 ${fmt(p.cut)}°；锯设定（0° 基准）${fmt(p.saw)}°。`,
      rows: [{ label: `全部 ${p.n} 根料`, cut: p.cut, saw: p.saw }]
    }
  }
  const t = twoSegmentCorners(alpha.value, beta.value, len1.value, len2.value, alloc.value)
  if (!t) return null
  const allocLabel = alloc.value === 'length'
    ? `按边长比分配（${len1.value} : ${len2.value}）`
    : '均分（各 Θ/2，接缝在角平分线）'
  return {
    modeLabel: `两段墙角分配（总角 Θ = ${fmt(t.theta)}°）`,
    line1: `料① ${fmt(t.cuts[0])}° / 料② ${fmt(t.cuts[1])}°`,
    line2: `总角 Θ = ${fmt(t.theta)}°（${t.theta >= 179.5 && t.theta <= 180.5 ? '接近 180°，基本方正' : '与 180° 偏差 ' + fmt(Math.abs(180 - t.theta)) + '°，不方正墙'}）；两段对切角之和 = Θ。`,
    rows: [
      { label: '料①', cut: t.cuts[0], saw: t.saws[0] },
      { label: '料②', cut: t.cuts[1], saw: t.saws[1] }
    ]
  }
})

// ---------- 交互动作 ----------
function applyTriangle() {
  if (triAngle.value !== null) {
    theta.value = roundTo(triAngle.value, 1)
  }
}

function resultText() {
  if (!result.value) return ''
  const r = result.value
  const rows = (r.rows || []).map((row) => `${row.label}: 对切角 ${fmt(row.cut)}° / 锯设定(0°基准) ${fmt(row.saw)}°`).join('\n')
  return `斜切角计算（${r.modeLabel}）\n${r.line1}\n${r.line2}\n${rows}\n提示：先在废料上试切验证拼缝，再切正式料。`
}

async function copyResult() {
  const text = resultText()
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
  } catch {
    alert('复制失败，请手动记录数值')
  }
}

onMounted(() => {
  addRecentTool('miter-angle-calculator')
})
</script>
