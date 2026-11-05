<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Wind class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">气缸推力计算</h1>
          <p class="text-sm text-muted-foreground mt-1">推/拉双向力 F=P×A×η、行程时间与耗气量折算，目标力反算缸径吸附标准档（ISO 15552 口径）</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线气缸推力计算器：按缸径（6-200mm 标准档）、供气压力（0.2-1.0 MPa 滑杆）与效率 η（默认 0.85）计算
        无杆腔推力与有杆腔拉力——理论推力 F = P×A、实际推力 ×η，双向并排对比并说明「拉力小因为杆占面积」；
        附行程时间 t = 行程÷(Q/A) 与耗气量按自由空气折算，以及「给目标力求最小缸径」的反算吸附标准档功能。
        适合气动回路设计、夹紧机构选型与维修替换速算。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        口径说明：P 为<span class="text-foreground font-medium">表压（MPa，1 MPa = 1 N/mm²）</span>；
        效率 η 默认 0.85（0.8~0.95 可调），覆盖密封摩擦、内泄漏与排气背压，低速轻载取 0.9+、侧向载荷或低速爬行取 0.8；
        杆径默认按 <span class="text-foreground font-medium">0.3×缸径</span> 经验值（可改）；
        耗气量按自由空气折算（1 atm ≈ 0.101 MPa 绝压口径）。缸径标准档：≤25mm 为 ISO 6432 微型缸系列、
        32~200mm 为 ISO 15552/VDMA 系列口径。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 推力计算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> 推力计算（双向对比）
          </h2>

          <!-- 缸径 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">缸径 D（mm）</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="b in BORES"
                :key="b"
                @click="selectBore(b)"
                class="px-2.5 py-1 rounded-lg border text-xs font-mono font-medium transition"
                :class="Number(cylD) === b ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
              >
                {{ b }}
              </button>
            </div>
            <input
              id="pnc-d"
              v-model.number="cylD"
              type="number"
              min="1"
              step="1"
              class="w-full sm:w-40 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="缸径 mm，如 40"
            >
          </div>

          <!-- 压力 / 效率滑杆 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div class="flex items-center justify-between mb-1">
                <label for="pnc-p" class="block text-sm font-medium text-foreground">供气压力 P（表压）</label>
                <span class="text-sm font-mono text-primary font-semibold">{{ fmt(P, 2) }} MPa</span>
              </div>
              <input
                id="pnc-p"
                v-model.number="P"
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                class="w-full accent-primary"
              >
              <div class="flex justify-between text-[10px] text-muted-foreground mt-0.5"><span>0.2</span><span>0.6 常用</span><span>1.0</span></div>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label for="pnc-eta" class="block text-sm font-medium text-foreground">效率 η</label>
                <span class="text-sm font-mono text-primary font-semibold">{{ fmt(eta, 2) }}</span>
              </div>
              <input
                id="pnc-eta"
                v-model.number="eta"
                type="range"
                min="0.8"
                max="0.95"
                step="0.01"
                class="w-full accent-primary"
              >
              <div class="flex justify-between text-[10px] text-muted-foreground mt-0.5"><span>0.8 低速/侧载</span><span>0.85 默认</span><span>0.95 理想</span></div>
            </div>
          </div>

          <!-- 杆径与腔向 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="pnc-rod" class="block text-sm font-medium text-foreground mb-1.5">活塞杆直径 d（mm）</label>
              <div class="flex gap-2">
                <input
                  id="pnc-rod"
                  v-model="rodRaw"
                  type="number"
                  min="0"
                  step="0.5"
                  class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  :placeholder="'留空按 0.3D = ' + fmt1(0.3 * (cylD > 0 ? cylD : 0)) + ' mm'"
                >
                <button
                  @click="rodRaw = ''"
                  class="px-3 py-2 rounded-lg border border-border bg-background hover:border-primary/50 text-xs font-medium text-foreground transition whitespace-nowrap"
                >
                  0.3D
                </button>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-foreground mb-1.5">当前工作腔（高亮输出）</p>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="side = 'push'"
                  :class="side === 'push' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
                  class="py-2 rounded-lg border text-sm font-medium transition-all"
                >无杆腔 · 推</button>
                <button
                  @click="side = 'pull'"
                  :class="side === 'pull' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
                  class="py-2 rounded-lg border text-sm font-medium transition-all"
                >有杆腔 · 拉</button>
              </div>
            </div>
          </div>

          <!-- 双向对比结果 -->
          <div v-if="inputsValid" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              class="p-4 rounded-lg border transition"
              :class="side === 'push' ? 'border-primary/40 bg-primary/10' : 'border-border bg-muted/50'"
            >
              <p class="text-sm font-medium text-foreground mb-2">推 · 无杆腔 <span v-if="side === 'push'" class="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium">当前</span></p>
              <p class="text-xs text-muted-foreground">受压面积 A = {{ fmt1(pushArea) }} mm²</p>
              <p class="text-2xl font-bold mt-1" :class="side === 'push' ? 'text-primary' : 'text-foreground'">
                {{ fmt0(pushReal) }} <span class="text-sm font-normal">N</span>
                <span class="text-sm font-semibold">实际</span>
              </p>
              <p class="text-xs text-muted-foreground mt-1">理论 {{ fmt0(pushTheo) }} N × η{{ fmt(eta, 2) }}</p>
            </div>
            <div
              class="p-4 rounded-lg border transition"
              :class="side === 'pull' ? 'border-primary/40 bg-primary/10' : 'border-border bg-muted/50'"
            >
              <p class="text-sm font-medium text-foreground mb-2">拉 · 有杆腔 <span v-if="side === 'pull'" class="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium">当前</span></p>
              <p class="text-xs text-muted-foreground">受压面积 A−A<sub>杆</sub> = {{ fmt1(pullArea) }} mm²（杆占 {{ fmt1(rodAreaPct) }}%）</p>
              <p class="text-2xl font-bold mt-1" :class="side === 'pull' ? 'text-primary' : 'text-foreground'">
                {{ fmt0(pullReal) }} <span class="text-sm font-normal">N</span>
                <span class="text-sm font-semibold">实际</span>
              </p>
              <p class="text-xs text-muted-foreground mt-1">理论 {{ fmt0(pullTheo) }} N × η{{ fmt(eta, 2) }}</p>
            </div>
            <p class="text-xs text-muted-foreground sm:col-span-2 leading-relaxed">
              拉力恒小于推力：活塞杆占去一部分有杆腔受压面积（0.3D 杆径约占 9%），所以回程力小、
              同流量下回程速度反而更快。需要等力往返时选双活塞杆缸或按拉力侧校核。
            </p>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">请检查：缸径 D &gt; 0；杆径需小于缸径（留空按 0.3D）。</p>
            </div>
          </div>
        </div>

        <!-- 行程时间与耗气量 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Timer class="w-5 h-5 mr-2 text-primary" /> 行程时间与耗气量（按{{ side === 'push' ? '推' : '拉' }}程）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="pnc-l" class="block text-sm font-medium text-foreground mb-1.5">行程 L（mm）</label>
              <input
                id="pnc-l"
                v-model.number="strokeL"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 200"
              >
            </div>
            <div>
              <label for="pnc-q" class="block text-sm font-medium text-foreground mb-1.5">供气流量 Q（L/min，自由空气）</label>
              <input
                id="pnc-q"
                v-model.number="flowQ"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 150"
              >
            </div>
          </div>
          <div v-if="motionValid" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-3 rounded-lg bg-muted/50 border border-border">
              <p class="text-xs text-muted-foreground">速度 v = Q / A</p>
              <p class="text-lg font-bold text-foreground mt-1">{{ fmt(speedMms / 1000, 2) }} m/s</p>
            </div>
            <div class="p-3 rounded-lg bg-muted/50 border border-border">
              <p class="text-xs text-muted-foreground">行程时间 t = L / v</p>
              <p class="text-lg font-bold text-foreground mt-1">{{ fmt(strokeT, 2) }} s</p>
            </div>
            <div class="p-3 rounded-lg bg-muted/50 border border-border">
              <p class="text-xs text-muted-foreground">耗气量（自由空气，单行程）</p>
              <p class="text-lg font-bold text-foreground mt-1">{{ fmt(freeAirL, 2) }} L</p>
            </div>
          </div>
          <p v-if="motionValid" class="text-xs text-muted-foreground leading-relaxed">
            耗气量 = A×L×(P+1atm)/1atm 折算到自由空气：{{ side === 'push' ? '推' : '拉' }}程一次约 {{ fmt(freeAirL, 2) }} L，
            往返一个循环 ≈ ×2（回程腔面积不同略有出入）。理论速度按流量全额进入腔体计算，实际受排气节流阀与管路限制，
            调速一般装在排气侧（排气节流更稳）。
          </p>
          <p v-else class="text-xs text-muted-foreground">填入行程与流量后显示速度、行程时间与耗气量。</p>
        </div>

        <!-- 缸径反算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ArrowLeftRight class="w-5 h-5 mr-2 text-primary" /> 缸径反算（给目标力选最小标准缸径）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="pnc-ft" class="block text-sm font-medium text-foreground mb-1.5">目标力（N）</label>
              <input
                id="pnc-ft"
                v-model.number="forceTarget"
                type="number"
                min="0"
                step="50"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 5000"
              >
            </div>
            <div>
              <p class="text-sm font-medium text-foreground mb-1.5">受力方向</p>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="reqSide = 'push'"
                  :class="reqSide === 'push' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
                  class="py-2 rounded-lg border text-sm font-medium transition-all"
                >推（无杆腔）</button>
                <button
                  @click="reqSide = 'pull'"
                  :class="reqSide === 'pull' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
                  class="py-2 rounded-lg border text-sm font-medium transition-all"
                >拉（有杆腔）</button>
              </div>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            按当前压力 {{ fmt(P, 2) }} MPa、效率 {{ fmt(eta, 2) }}、拉向按杆径 0.3D（受压面积为 0.91A）口径反算。
          </p>

          <div v-if="boreReq && boreReq.snapped" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-3 rounded-lg bg-muted/50 border border-border">
              <p class="text-xs text-muted-foreground">最小需求缸径</p>
              <p class="text-lg font-bold text-foreground mt-1">{{ fmt1(boreReq.dMin) }} mm</p>
            </div>
            <div class="p-3 rounded-lg border border-primary/30 bg-primary/10">
              <p class="text-xs text-muted-foreground">吸附标准档</p>
              <p class="text-lg font-bold text-primary mt-1">⌀{{ boreReq.snapped }} mm</p>
            </div>
            <div class="p-3 rounded-lg bg-muted/50 border border-border">
              <p class="text-xs text-muted-foreground">该档实际输出</p>
              <p class="text-lg font-bold text-foreground mt-1">{{ fmt0(boreReq.realN) }} N</p>
            </div>
          </div>
          <p v-else-if="hasForceInput" class="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
            {{ boreReq && !boreReq.snapped
              ? '目标力超出 ⌀200 标准档能力：考虑加大压力、改用气液增压器，或多缸并联分担载荷。'
              : '请检查目标力、压力与效率输入（均需大于 0）。' }}
          </p>
          <p v-else class="text-xs text-muted-foreground">填入目标力后自动反算最小缸径并吸附到标准档（向上取档，不留 0 余量）。</p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 标准缸径档 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 标准缸径档（ISO 口径）
          </h2>
          <div class="grid grid-cols-4 gap-1.5">
            <span
              v-for="b in BORES"
              :key="'side-' + b"
              class="px-1 py-1 rounded-lg bg-muted/50 border border-border text-center text-xs font-mono text-foreground"
            >{{ b }}</span>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            缸径不是连续任取：≤25 mm 对应 ISO 6432 微型缸系列（8/10/12/16/20/25），32~200 mm 对应
            ISO 15552（VDMA）系列口径——63/80/100 这几个「尖数」实际是老 VDMA 24565 的传承档位。
            选型向上吸附最近标准档，密封件与安装件才有现成供应。
          </p>
        </div>

        <!-- 知识卡：理论推力为什么打折 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 理论推力为什么打折
          </h2>
          <p class="text-xs leading-relaxed text-muted-foreground">
            P×A 是「压强×面积」的理论值，实际出力要乘效率 η（默认 0.85）：密封件摩擦（唇形密封/格莱圈随压力与速度变化）、
            内泄漏、以及最重要却常被忽略的<span class="text-foreground font-medium">排气背压</span>——
            排气侧节流阀没开大时，背压会直接抵消一部分推力。低速爬行工况摩擦占比更大，取 0.8 甚至更低；
            充分润滑、大缸径高压力工况可取 0.9+。夹紧类应用请按实际力需求再留 25% 以上余量。
          </p>
        </div>

        <!-- 气液增力一句话 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Zap class="w-5 h-5 mr-2 text-primary" /> 气液增力一句话
          </h2>
          <p class="text-xs leading-relaxed text-muted-foreground">
            压力不够上<span class="text-foreground font-medium">气液增压器</span>：气缸推油缸，增力比 = 气缸面积 ÷ 油缸面积——
            面积差多大、油压就放大多少倍（帕斯卡原理），用 0.6 MPa 的气轻松得到几十 MPa 的油压，
            高压小流量只够「压紧」用，大行程还得靠气缸本身完成快进。
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>气缸推力计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          气缸推力计算器面向气动回路设计与维修选型：输入缸径（6~200mm 标准档预设）、供气压力与效率 η，
          同时给出无杆腔推力与有杆腔拉力（理论 F=P×A、实际 ×η）双向对比；附行程时间（按流量 Q 与受压面积算速度）
          与耗气量自由空气折算，以及「给目标力反算最小缸径并吸附 ISO 15552 标准档」的选型功能。
          全部计算在浏览器本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">理论推力为什么要打折扣（效率 η）？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          F = P×A 是理想气体的「压强×面积」，实际气缸出力要打 85% 左右的折扣，损失主要来自四处：
          ① 密封件摩擦——活塞与活塞杆上的唇形密封/格莱圈始终在刮缸壁，低速时静摩擦还会造成爬行；
          ② 排气背压——排气侧节流阀开度小时背压直接顶住活塞，这是实际调试中最常见的一笔「暗账」；
          ③ 内泄漏与外泄漏；④ 管路与阀件的沿程损失（表现为实际到达缸口的压力低于减压阀设定值）。
          本工具默认 η=0.85，低速轻载/侧向载荷取 0.8，理想工况取 0.9~0.95；夹紧应用建议按实际需求再留 25% 余量。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">无杆腔与有杆腔：为什么拉力比推力小？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          无杆腔（推程进气侧）受压面积是完整的活塞面积 A=πD²/4；有杆腔（拉程进气侧）被活塞杆占去一块，
          受压面积只剩 A−A<sub>杆</sub>。杆径按经验 0.3D 时，杆面积约占总面积的 9%，拉力就比推力小约 9%
          ——缸径越小、杆越粗差距越大（带大杆径缸可达 20% 以上）。同样的供气流量下，有杆腔面积小、
          排程速度反而更快，所以「回程比工进快」是单杆缸的天然属性；需要推拉等力时选双活塞杆缸，
          或把受力方向按拉力侧（较小值）校核。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">气液增力是怎么回事？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一句话：气缸推油缸，增力比等于两缸面积比（帕斯卡原理）。气液增压器里低压大面积的气缸活塞
          推高压小面积的油缸柱塞，油压按面积比放大——面积差 50 倍，0.6 MPa 的气就能输出 30 MPa 的油压。
          它解决的是「气缸出力不够、又不想上整套液压站」的场合：工件压印、铆接、过盈压装这类需要高压小行程的工序。
          注意增力缸高压侧流量极小，只能完成最后的加压段，快速接近阶段仍由气缸驱动。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">标准缸径档位从哪来？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          缸径不是连续任取的：8~25 mm 来自 ISO 6432（微型圆缸系列），32~200 mm 来自 ISO 15552/VDMA 系列
          （32/40/50/63/80/100/125/160/200），6 mm 属微型缸/紧凑缸口径。这批档位沿用了欧洲气动工业几十年的
          密封件与安装件体系，向上吸附最近标准档选型，替换密封、浮动接头、耳环安装件才有现成供应。
          反算出的最小缸径落在两档之间时，永远取大的一档——气缸没有「小半号」的密封件。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">⌀40 气缸 0.6 MPa 能出多大力？</h3>
            <p class="text-sm text-muted-foreground mt-1">无杆腔受压面积 A = π×40²/4 ≈ 1256.6 mm²，理论推力 0.6×1256.6 ≈ 754 N，按效率 0.85 实际约 641 N；拉向按 0.3D 杆径约 583 N。夹紧应用建议按需求再留 25% 余量。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么气缸回程比工进快？</h3>
            <p class="text-sm text-muted-foreground mt-1">回程是有杆腔进气，受压面积比无杆腔小（0.3D 杆径约占 9%）。同样流量下 v=Q/A，面积小速度就快；同时拉力也更小。想要工进快回程慢可以反过来接，或在回程侧加节流。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">耗气量怎么折算成自由空气？</h3>
            <p class="text-sm text-muted-foreground mt-1">气缸消耗的是「压缩后体积」，空压机标的是「自由空气」：V 自由 = A×L×(P+1atm)/1atm，即先算腔体几何容积，再按绝对压比放大。⌀40 缸行程 200mm、0.6 MPa 表压时单行程约 1.74 L 自由空气，往返约 3.5 L。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">缸径算出来在两档之间怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">向上吸附标准档（本工具反算已自动吸附）：气缸密封件、缸筒、安装件都按标准档供货，选小一档力量不够、非标件交期与成本都吃亏。若超出 ⌀200，考虑多缸并联、提高压力或改用气液增力。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pneumatic-cylinder'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Wind, Ruler, Timer, Gauge, Info, Zap, AlertTriangle, ChevronUp, ChevronDown,
  ArrowLeftRight
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 标准缸径档：≤25 为 ISO 6432 微型缸系列，32~200 为 ISO 15552/VDMA 系列，6 为微型/紧凑缸口径
const BORES = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200]
const ATM_MPA = 0.1013  // 1 标准大气压（MPa，绝压口径）
const ROD_RATIO = 0.3   // 杆径经验默认：0.3×缸径

// 面积（mm²）
function pistonArea(dMm) {
  if (!(dMm > 0)) return null
  return (Math.PI * dMm * dMm) / 4
}
function rodArea(rodMm) {
  if (!(rodMm > 0)) return null
  return (Math.PI * rodMm * rodMm) / 4
}
// 有效受压面积：push 无杆腔 = A；pull 有杆腔 = A − A_杆
function effectiveArea(dMm, rodMm, side) {
  const a = pistonArea(dMm)
  if (a === null) return null
  if (side === 'push') return a
  const ar = rodArea(rodMm)
  if (ar === null || ar >= a) return null
  return a - ar
}

// 力（N）：P 表压 MPa（=N/mm²），η 效率
function theoreticalForceN(pMpa, areaMm2) {
  if (!(pMpa > 0) || !(areaMm2 > 0)) return null
  return pMpa * areaMm2
}
function realForceN(pMpa, areaMm2, eta) {
  const t = theoreticalForceN(pMpa, areaMm2)
  if (t === null || !(eta > 0)) return null
  return t * eta
}

// 速度 v = Q/A（Q L/min 自由空气 → mm³/s；A mm²）→ mm/s
function speedMmS(qLmin, areaMm2) {
  if (!(qLmin > 0) || !(areaMm2 > 0)) return null
  return (qLmin * 1e6) / 60 / areaMm2
}
// 行程时间 t = L/v（s）
function strokeTimeS(lMm, qLmin, areaMm2) {
  const v = speedMmS(qLmin, areaMm2)
  if (v === null || !(lMm > 0)) return null
  return lMm / v
}
// 耗气量（自由空气）：V = A×L×(P+1atm)/1atm，cm³；A mm²、L mm、P 表压 MPa
function freeAirCm3(areaMm2, lMm, pMpa) {
  if (!(areaMm2 > 0) || !(lMm > 0) || pMpa === null || pMpa < 0) return null
  return ((areaMm2 * lMm) / 1000) * ((pMpa + ATM_MPA) / ATM_MPA)
}

// 缸径反算：给目标力 F、压力 P、效率 η，拉向按杆径 0.3D（受压面积 = 0.91A）闭式求解并吸附标准档
// （(0.3D)² = 0.09D² → A_杆 = 0.09A，故 A_eff = 0.91A，为精确闭式而非近似）
function boreFromForce(targetN, pMpa, eta, side) {
  if (!(targetN > 0) || !(pMpa > 0) || !(eta > 0)) return null
  const areaRatio = side === 'pull' ? 1 - ROD_RATIO * ROD_RATIO : 1  // 0.91 : 1
  const aReq = targetN / (pMpa * eta * areaRatio)
  const dMin = Math.sqrt((4 * aReq) / Math.PI)
  const snapped = BORES.find((b) => b >= dMin) || null
  let realN = null
  if (snapped !== null) {
    const a = pistonArea(snapped)
    const aEff = a * areaRatio
    realN = realForceN(pMpa, aEff, eta)
  }
  return { aReq, dMin, snapped, realN }
}

// 显示：通用位数（<1 → 3 位，<10 → 2 位，否则 1 位），避免浮点尾差
function fmt(v, d = 2) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return String(parseFloat(v.toFixed(d)))
}
function fmt1(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return String(Math.round(v * 10) / 10)
}
function fmt0(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return String(Math.round(v))
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '气缸推力计算器 - 缸径×压力×效率推拉力与耗气量在线计算',
  description: '在线气缸推力计算器：输入缸径(6-200标准档)、供气压力(0.2-1.0MPa)与效率η(默认0.85)，无杆腔推力与有杆腔拉力双向对比（F=P×A×η，拉力小因为杆占面积），附行程时间t=行程/(Q/A)、耗气量自由空气折算与目标力反算缸径吸附ISO 15552标准档，气液增力与背压注记，纯浏览器本地计算。',
  keywords: '气缸推力计算,气缸选型,缸径计算,气缸拉力推力,气动计算器,耗气量计算,ISO 15552,气液增力',
  author: '有条工具',
  ogTitle: '气缸推力计算器 - 缸径×压力×效率推拉力与耗气量在线计算 | 有条工具',
  ogDescription: '推/拉双向 F=P×A×η 对比、行程时间与耗气量折算、目标力反算缸径吸附标准档。',
  ogUrl: 'https://www.util.cn/tools/pneumatic-cylinder',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '气缸推力计算器',
  twitterDescription: '推/拉双向力、行程时间与耗气量、缸径反算标准档。'
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
          name: '气缸推力计算器',
          url: 'https://www.util.cn/tools/pneumatic-cylinder',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '无杆腔推力与有杆腔拉力双向对比（F=P×A×η）',
            '缸径 6-200mm 标准档预设与自定义输入',
            '压力 0.2-1.0MPa、效率 η 0.8-0.95 滑杆调节',
            '杆径默认 0.3D 可自定义',
            '行程时间 t=行程/(Q/A) 与耗气量自由空气折算',
            '目标力反算最小缸径吸附 ISO 15552 标准档',
            '气液增力、排气背压与选型余量注记',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '气缸推力计算', item: 'https://www.util.cn/tools/pneumatic-cylinder' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '40 缸径气缸 0.6 MPa 能出多大力？',
              acceptedAnswer: { '@type': 'Answer', text: '无杆腔受压面积 A=π×40²/4≈1256.6mm²，理论推力约 754N，按效率 0.85 实际约 641N；拉向按 0.3D 杆径约 583N。夹紧应用建议再留 25% 余量。' }
            },
            {
              '@type': 'Question',
              name: '为什么气缸回程比工进快？',
              acceptedAnswer: { '@type': 'Answer', text: '回程是有杆腔进气，受压面积比无杆腔小（0.3D 杆径约占 9%），同样流量下 v=Q/A 面积小速度就快；同时拉力也更小。需要工进快可调排气节流。' }
            },
            {
              '@type': 'Question',
              name: '耗气量怎么折算成自由空气？',
              acceptedAnswer: { '@type': 'Answer', text: 'V 自由 = A×L×(P+1atm)/1atm：先算腔体几何容积，再按绝对压比放大。40 缸行程 200mm、0.6MPa 表压时单行程约 1.74L 自由空气，往返约 3.5L。' }
            },
            {
              '@type': 'Question',
              name: '缸径算出来在两档之间怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '向上吸附标准档（ISO 6432 ≤25mm、ISO 15552 32-200mm 口径）：密封件与安装件按标准档供货，选小一档力量不够，非标件交期成本都吃亏；超出 200 考虑多缸并联或气液增力。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'pneumatic-cylinder'
const SETTINGS_KEY = 'pneumatic-cylinder-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 状态 ----------
const cylD = ref(40)
const P = ref(0.6)
const eta = ref(0.85)
const side = ref('push')             // 'push' 推 | 'pull' 拉
const rodRaw = ref('')               // 空串 = 按 0.3D
const strokeL = ref(200)
const flowQ = ref(150)
const forceTarget = ref(5000)
const reqSide = ref('push')
const seoContentVisible = ref(true)

// ---------- 派生 ----------
const rodEff = computed(() => {
  const n = Number(String(rodRaw.value).trim())
  if (Number.isFinite(n) && n > 0) return n
  return cylD.value > 0 ? ROD_RATIO * cylD.value : null
})
const pushArea = computed(() => pistonArea(cylD.value))
const pullArea = computed(() => (rodEff.value === null ? null : effectiveArea(cylD.value, rodEff.value, 'pull')))
const rodAreaPct = computed(() => {
  if (pushArea.value === null || pullArea.value === null) return null
  return ((pushArea.value - pullArea.value) / pushArea.value) * 100
})
const pushTheo = computed(() => realTheo(pushArea.value))
const pullTheo = computed(() => realTheo(pullArea.value))
function realTheo(a) {
  const t = theoreticalForceN(P.value, a)
  return t === null ? null : t
}
const pushReal = computed(() => (pushTheo.value === null ? null : pushTheo.value * eta.value))
const pullReal = computed(() => (pullTheo.value === null ? null : pullTheo.value * eta.value))
const inputsValid = computed(() =>
  cylD.value > 0 &&
  P.value > 0 &&
  eta.value > 0 &&
  pushArea.value !== null &&
  (side.value === 'push' || pullArea.value !== null)
)

const activeArea = computed(() => (side.value === 'push' ? pushArea.value : pullArea.value))
const motionValid = computed(() =>
  strokeL.value > 0 && flowQ.value > 0 && activeArea.value !== null
)
const speedMms = computed(() => (motionValid.value ? speedMmS(flowQ.value, activeArea.value) : null))
const strokeT = computed(() => (motionValid.value ? strokeTimeS(strokeL.value, flowQ.value, activeArea.value) : null))
const freeAirL = computed(() => {
  const cm3 = motionValid.value ? freeAirCm3(activeArea.value, strokeL.value, P.value) : null
  return cm3 === null ? null : cm3 / 1000
})

const hasForceInput = computed(() => Number.isFinite(forceTarget.value) && forceTarget.value > 0)
const boreReq = computed(() => {
  if (!hasForceInput.value) return undefined   // 未输入：显示提示行
  return boreFromForce(forceTarget.value, P.value, eta.value, reqSide.value)
})

// ---------- 交互 ----------
function selectBore(b) {
  cylD.value = b
}
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 设置持久化（localStorage，键前缀=工具 id，仅 onMounted/交互回调） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (Number.isFinite(s.cylD) && s.cylD > 0) cylD.value = s.cylD
    if (Number.isFinite(s.P) && s.P >= 0.2 && s.P <= 1.0) P.value = s.P
    if (Number.isFinite(s.eta) && s.eta >= 0.8 && s.eta <= 0.95) eta.value = s.eta
    if (s.side === 'push' || s.side === 'pull') side.value = s.side
    if (typeof s.rodRaw === 'string') rodRaw.value = s.rodRaw
    if (Number.isFinite(s.strokeL) && s.strokeL > 0) strokeL.value = s.strokeL
    if (Number.isFinite(s.flowQ) && s.flowQ > 0) flowQ.value = s.flowQ
    if (Number.isFinite(s.forceTarget) && s.forceTarget > 0) forceTarget.value = s.forceTarget
    if (s.reqSide === 'push' || s.reqSide === 'pull') reqSide.value = s.reqSide
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([cylD, P, eta, side, rodRaw, strokeL, flowQ, forceTarget, reqSide], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      cylD: cylD.value,
      P: P.value,
      eta: eta.value,
      side: side.value,
      rodRaw: rodRaw.value,
      strokeL: strokeL.value,
      flowQ: flowQ.value,
      forceTarget: forceTarget.value,
      reqSide: reqSide.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
