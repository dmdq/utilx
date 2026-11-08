<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Aperture class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">闪光灯曝光计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">GN 指数与光圈距离互算：f = GN ÷ 距离、最远距离 = GN ÷ f，ISO 与功率档修正，试光不再靠猜</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线闪光灯 GN（闪光指数）计算工具：以「GN = 距离(m) × 光圈值(f)（ISO 100 口径）」为核心公式，支持双向换算——已知距离求该用多大光圈、已知光圈求能打多远。
        再按实际拍摄条件修正：ISO 变化按 GN × √(ISO/100)（每翻一档 ×1.414），功率档按 √功率（M 1/2 ×0.707、M 1/4 ×0.5、M 1/8 ×0.354、M 1/16 ×0.25）折减。
        附 TTL 与 M 的关系、跳闪折损经验值与灯背 GN 口径提示。全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：闪光灯与条件 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Zap class="w-5 h-5 mr-2 text-primary" /> 闪光灯与拍摄条件
        </h2>

        <!-- GN 输入 -->
        <div>
          <label for="flash-gn" class="block text-sm font-medium text-foreground mb-1.5">闪光灯 GN 指数（米制 · ISO 100 · 全功率 · 灯背标称）</label>
          <input
            id="flash-gn"
            v-model.number="gn"
            type="number"
            step="0.1"
            min="0"
            class="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="如 36"
          />
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="g in GN_CHIPS"
              :key="g"
              type="button"
              @click="gn = g"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="gn === g ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >GN {{ g }}</button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">变焦灯头不同焦端的 GN 不同，请按你实际焦段的灯背标称值填写（详见下方口径说明）。</p>
        </div>

        <!-- 模式切换 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">换算方向</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="mode = 'aperture'"
              class="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition"
              :class="mode === 'aperture' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >
              <Ruler class="w-4 h-4" /> 已知距离 → 求光圈
            </button>
            <button
              type="button"
              @click="mode = 'distance'"
              class="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition"
              :class="mode === 'distance' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >
              <Aperture class="w-4 h-4" /> 已知光圈 → 求最大距离
            </button>
          </div>
        </div>

        <!-- 距离输入 -->
        <div v-if="mode === 'aperture'">
          <label for="flash-dist" class="block text-sm font-medium text-foreground mb-1.5">灯到被摄体的距离（米，直射距离）</label>
          <div class="flex items-center gap-2">
            <input
              id="flash-dist"
              v-model.number="dist"
              type="number"
              step="0.1"
              min="0"
              class="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 3"
            />
            <span class="text-sm text-muted-foreground flex-shrink-0">m</span>
          </div>
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="d in DIST_CHIPS"
              :key="d"
              type="button"
              @click="dist = d"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="dist === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >{{ d }} m</button>
          </div>
        </div>

        <!-- 光圈输入 -->
        <div v-else>
          <label for="flash-f" class="block text-sm font-medium text-foreground mb-1.5">目标光圈值（f 值）</label>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground flex-shrink-0">f/</span>
            <input
              id="flash-f"
              v-model.number="fstop"
              type="number"
              step="0.1"
              min="0"
              class="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 4"
            />
          </div>
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="f in F_CHIPS"
              :key="f"
              type="button"
              @click="fstop = f"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="fstop === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >f/{{ f }}</button>
          </div>
        </div>

        <!-- ISO -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">ISO（GN × √(ISO/100)，每翻一档 ×1.414）</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="v in ISO_CHIPS"
              :key="v"
              type="button"
              @click="iso = v"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="iso === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >{{ v }}</button>
          </div>
        </div>

        <!-- 功率 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">手动功率档（GN × √功率）</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="p in POWERS"
              :key="p.value"
              type="button"
              @click="power = p.value"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="power === p.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >{{ p.label }} ×{{ p.factorText }}</button>
          </div>
        </div>

        <button type="button" @click="resetAll" class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition">
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认参数
        </button>

        <div v-if="validationIssues.length" class="space-y-1.5">
          <p v-for="issue in validationIssues" :key="issue" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ issue }}</span>
          </p>
        </div>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-6">
        <div class="bg-card border border-primary/40 rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Camera class="w-5 h-5 mr-2 text-primary" /> 曝光结果
          </h2>

          <!-- 修正链 -->
          <p class="text-xs text-muted-foreground mb-3 font-mono leading-relaxed">
            GN {{ fmtNum(gn, 1) }} × {{ isoFactorText }}（ISO {{ iso }}）× {{ powerFactorText }}（{{ powerLabel }}）= 有效 GN
            <span class="text-foreground font-bold">{{ fmtNum(effGn, 2) }}</span>
          </p>

          <div v-if="mode === 'aperture' && answerF !== null">
            <p class="text-sm text-muted-foreground mb-1">距离 {{ fmtNum(dist, 2) }} m 下建议光圈</p>
            <p class="text-4xl lg:text-5xl font-bold text-primary font-mono break-all">f/{{ fmtNum(answerF, 2) }}</p>
            <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
              公式 f = 有效 GN ÷ 距离 = {{ fmtNum(effGn, 2) }} ÷ {{ fmtNum(dist, 2) }}。
              <span v-if="nearestStop">最接近的整档是 f/{{ nearestStop }}：机身支持 1/3 档步进可直接按 {{ fmtNum(answerF, 2) }} 设置，整档环则先按最近整档试拍，过亮 / 过暗用闪光补偿或半档光圈微调。</span>
            </p>
          </div>

          <div v-else-if="mode === 'distance' && answerD !== null">
            <p class="text-sm text-muted-foreground mb-1">光圈 f/{{ fmtNum(fstop, 2) }} 下最大有效距离</p>
            <p class="text-4xl lg:text-5xl font-bold text-primary font-mono break-all">{{ fmtNum(answerD, 2) }} <span class="text-xl text-muted-foreground">m</span></p>
            <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
              公式 最大距离 = 有效 GN ÷ 光圈 = {{ fmtNum(effGn, 2) }} ÷ {{ fmtNum(fstop, 2) }}。超过该距离开始欠曝；
              实战建议把布光距离控制在结果的九成以内（约 {{ fmtNum(answerD * 0.9, 1) }} m），给跳闪、柔光罩等折损留余量。
            </p>
          </div>

          <p v-else class="p-8 text-center text-sm text-muted-foreground">填写 GN 与距离（或光圈）后显示曝光结果</p>

          <p v-if="effGn !== null && (mode === 'aperture' ? answerF !== null : answerD !== null)" class="text-xs leading-relaxed mt-3 p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
            <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>按 ISO 100 米制口径计算；实拍先试一张看直方图，再 ±1/3 档微调最稳。</span>
          </p>
        </div>

        <!-- 场景速查 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Play class="w-5 h-5 mr-2 text-primary" /> 场景示例（点击代入）
          </h2>
          <p class="text-xs text-muted-foreground mb-3 leading-relaxed">例如室内人像 f/4、距离 2 m 只需要 GN ≥ 8（ISO 100 全功率口径）：主流 GN 24–36 的灯即使 M 1/8 功率（GN 36 × 0.354 ≈ 12.7）也绰绰有余——算 GN 的意义常常是「该收到几分之一功率」。</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              v-for="s in SCENES"
              :key="s.id"
              type="button"
              @click="applyScene(s)"
              class="text-left p-3 rounded-lg border transition"
              :class="activeSceneId === s.id ? 'border-primary bg-primary/10' : 'border-border bg-muted/40 hover:bg-muted'"
            >
              <p class="text-sm font-medium text-foreground">{{ s.name }}</p>
              <p class="text-[11px] text-muted-foreground mt-1 leading-relaxed">{{ s.desc }}</p>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 小知识卡 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
      <div class="bg-card border border-border rounded-lg p-5">
        <h3 class="text-sm font-semibold flex items-center mb-2">
          <Lightbulb class="w-4 h-4 mr-1.5 text-primary" /> TTL 与 M 的关系
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">
          TTL 是相机发射预闪、现场测光后自动决定输出功率，方便但不稳定（构图变化、反光率不同都会让输出波动）；M 档是固定功率输出，稳定可复现。
          本工具算的是 M 档口径：TTL 用户也可以用它预估「该用什么光圈 / 距离组合」，锁定构图与布光后切到 M 固定下来——影室与固定机位的主流做法。
        </p>
      </div>
      <div class="bg-card border border-border rounded-lg p-5">
        <h3 class="text-sm font-semibold flex items-center mb-2">
          <Zap class="w-4 h-4 mr-1.5 text-primary" /> 跳闪对距离的折损（经验值）
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">
          灯头朝天花板或侧面墙打（跳闪 / bounce）时，光要多走一段路并被反射面吸收一部分，直射公式不再直接适用。
          经验做法是把「灯到被摄体」的等效距离乘 1.5～2 再代入公式（相当于可用光圈降 1.5～2 档左右）。
          这是经验值而非物理常数，白色矮天花板接近 ×1.5，高天花板或深色墙面折损更大，以试拍为准。
        </p>
      </div>
      <div class="bg-card border border-border rounded-lg p-5">
        <h3 class="text-sm font-semibold flex items-center mb-2">
          <Info class="w-4 h-4 mr-1.5 text-primary" /> 变焦灯头的 GN：以灯背标称为准
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">
          同一支灯 24mm 广角端与 105mm 长焦端的 GN 不同（长焦端光束更集中、GN 更大），各家差异幅度也不一样。
          本工具不做编造的「焦端 GN 对照表」——请按你实际使用的焦段，查看灯背铭牌或说明书上的标称 GN 填入，口径立刻对齐。
        </p>
      </div>
      <div class="bg-card border border-border rounded-lg p-5">
        <h3 class="text-sm font-semibold flex items-center mb-2">
          <TriangleAlert class="w-4 h-4 mr-1.5 text-primary" /> GN 口径陷阱：单位与测试条件
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">
          厂商标称 GN 通常是「ISO 100 · 全功率 · 长焦端」的米制值；也有厂商用英尺口径——英尺 GN ÷ 3.28 ≈ 米制 GN（GN 58 ft 其实只有约 GN 17.7 m，差近 3 档）。
          另外柔光罩、雷达罩、色片都会吃掉 0.5～1 档以上的光。对不上号时，先核对这三件事再怀疑灯。
        </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>闪光灯曝光计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款面向闪光灯摄影的 GN（闪光指数 / Guide Number）计算工具。GN 描述灯的输出能力，通行口径是 ISO 100、米制、全功率：
          <strong class="text-foreground">GN = 拍摄距离(m) × 光圈值(f)</strong>。所以 GN 36 的灯在 3 m 需要光圈 f/12，f/4 下最远能打 9 m。
          本页把这一个公式做成两个使用方向（已知距离求光圈、已知光圈求最远距离），再加上两件实拍必做的修正——ISO 与功率档——并给出室内人像、户外补光、合影、跳闪等常见场景的代入示例。
          全部换算在浏览器本地用纯算术完成，无网络请求，输入不会被保存或上传。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">一个公式，三个方向</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          <li><strong class="text-foreground">求光圈</strong>：f = GN ÷ 距离。GN 36、3 m → f/12。</li>
          <li><strong class="text-foreground">求最远距离</strong>：距离 = GN ÷ f。GN 32、f/4 → 8 m，超出即欠曝。</li>
          <li><strong class="text-foreground">反推灯的能力</strong>：GN = 距离 × f。想在某距离用某光圈，就知道需要多大 GN 的灯。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">ISO 与功率修正怎么算</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          <li><strong class="text-foreground">ISO 修正</strong>：GN' = GN × √(ISO/100)。ISO 每翻一档（×2），GN ×1.414：GN 36 在 ISO 200 → 50.9，ISO 400 → 72，ISO 800 → 101.8。</li>
          <li><strong class="text-foreground">功率修正</strong>：GN' = GN × √功率。M 1/2 ×0.707、M 1/4 ×0.5、M 1/8 ×0.354、M 1/16 ×0.25：GN 36 半功率 → 25.46，1/8 功率 → 12.73。</li>
          <li>两者叠加按乘法组合：GN 36、ISO 400、M 1/8 → 36 × 2 × 0.354 ≈ 25.46，等效于 ISO 100 全功率的 GN 36 在一半距离上的曝光。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">如何使用本工具</h3>
        <ol class="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4">
          <li>查灯背铭牌 / 说明书的标称 GN（ISO 100、米制、对应你实际焦段），填入 GN。</li>
          <li>选方向：已知拍摄距离求光圈，或已知目标光圈求能打多远。</li>
          <li>按实际条件选 ISO 与功率档，结果自动修正为「有效 GN」。</li>
          <li>按结果设置相机，试拍一张看直方图，±1/3 档微调。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">适用场景</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          <li>室内人像 / 活动跟拍：按 2–3 m 布光距离快速定光圈与功率组合。</li>
          <li>户外补光：压日光需要大功率，算一算 GN 是否够用、该收几档功率。</li>
          <li>团体合影：f/8 想覆盖 4–5 m 纵深，反推需要多大 GN、要不要双灯。</li>
          <li>跳闪布光：把跳闪折损代入后再定曝光，减少试拍次数。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">闪光灯 GN（闪光指数）是什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              GN（Guide Number）衡量闪光灯输出能力，通行口径为 ISO 100、米制、全功率：GN = 拍摄距离 × 光圈值。
              GN 36 表示 ISO 100 全功率下「1 m 用 f/36、3 m 用 f/12、10 m 用 f/3.6」都能正确曝光。GN 是同口径下比较两支灯强弱的最简指标。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">GN 36 的灯在 3 米该用什么光圈？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              f = GN ÷ 距离 = 36 ÷ 3 = f/12（ISO 100 全功率）。若收半功率则有效 GN 25.46，3 m 对应 f/8.5 左右；
              收到 1/8 功率（GN × 0.354 ≈ 12.73）则约 f/4.2。用本页选好功率档即可自动算出。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">ISO 400 拍，GN 怎么修正？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              GN' = GN × √(ISO/100)：ISO 每翻一档 GN ×1.414。GN 36 在 ISO 400 修正为 36 × √4 = 72，ISO 800 为 101.8，ISO 1600 为 144。
              也就是说机内 ISO 翻档可以等价换成「距离更远」或「光圈更小」。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">功率调到 M 1/8 后，GN 和距离怎么变？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              GN' = GN × √功率：M 1/2 ×0.707、M 1/4 ×0.5、M 1/8 ×0.354、M 1/16 ×0.25。GN 36 的灯收到 1/8 功率后有效 GN ≈ 12.73，
              f/4 下最大距离 ≈ 3.2 m（12.73 ÷ 4）——回电更快、更省电，但能打的范围按比例缩短。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么实拍总比算出来的暗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              常见四个原因：一是跳闪或柔光罩折损（跳闪经验折损：等效距离 ×1.5～2）；二是灯背 GN 是长焦端口径而你在广角端拍；
              三是厂商用英尺口径（英尺 GN ÷ 3.28 ≈ 米制）；四是 TTL 预闪与实际输出的差异。全程用 M 档 + 按实际焦段标称 GN 填写，结果就能对上。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'flash-exposure-guide'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Aperture, Zap, Camera, Ruler, Play, Lightbulb, Info,
  RefreshCw, ChevronUp, ChevronDown, TriangleAlert, CheckCircle
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '闪光灯曝光计算器 - GN 指数光圈距离换算与 ISO 功率修正 | 有条工具',
  description: '免费在线闪光灯 GN 计算器：GN = 距离 × 光圈 双向换算（已知距离求光圈、已知光圈求最大距离），ISO 修正 ×√(ISO/100)、功率档修正 ×√功率（1/2→0.707、1/8→0.354），跳闪折损与 TTL/M 说明，纯浏览器本地计算不上传',
  keywords: '闪光灯gn,闪光灯距离,gn指数换算,闪光灯光圈,摄影布光计算,跳闪,闪光灯功率',
  author: '有条工具',
  ogTitle: '闪光灯曝光计算器 - GN 指数光圈距离换算 | 有条工具',
  ogDescription: 'GN = 距离 × 光圈双向换算，ISO 与功率档自动修正，跳闪折损与口径提示，试光不再靠猜。',
  ogUrl: 'https://www.util.cn/tools/flash-exposure-guide',
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
          name: '闪光灯曝光计算器',
          url: 'https://www.util.cn/tools/flash-exposure-guide',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['GN = 距离 × 光圈 双向换算', '已知距离求光圈 / 已知光圈求最大距离', 'ISO 修正 GN × √(ISO/100)', '功率档修正 M1/2 ×0.707 至 M1/16 ×0.25', '常见 GN 快捷与人像合影跳闪场景示例', 'TTL/M 与跳闪折损说明', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '闪光灯曝光计算器', item: 'https://www.util.cn/tools/flash-exposure-guide' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '闪光灯 GN（闪光指数）是什么？',
              acceptedAnswer: { '@type': 'Answer', text: 'GN（Guide Number）衡量闪光灯输出能力，通行口径为 ISO 100、米制、全功率：GN = 拍摄距离 × 光圈值。GN 36 表示 ISO 100 全功率下 1 m 用 f/36、3 m 用 f/12、10 m 用 f/3.6 都能正确曝光。' }
            },
            {
              '@type': 'Question',
              name: 'GN 36 的灯在 3 米该用什么光圈？',
              acceptedAnswer: { '@type': 'Answer', text: 'f = GN ÷ 距离 = 36 ÷ 3 = f/12（ISO 100 全功率）。半功率有效 GN 25.46 对应约 f/8.5，1/8 功率有效 GN 12.73 对应约 f/4.2。' }
            },
            {
              '@type': 'Question',
              name: 'ISO 400 拍，GN 怎么修正？',
              acceptedAnswer: { '@type': 'Answer', text: 'GN\' = GN × √(ISO/100)：ISO 每翻一档 GN ×1.414。GN 36 在 ISO 400 修正为 72，ISO 800 为 101.8，ISO 1600 为 144。' }
            },
            {
              '@type': 'Question',
              name: '功率调到 M 1/8 后，GN 和距离怎么变？',
              acceptedAnswer: { '@type': 'Answer', text: 'GN\' = GN × √功率：M 1/2 ×0.707、M 1/4 ×0.5、M 1/8 ×0.354、M 1/16 ×0.25。GN 36 收到 1/8 功率后有效 GN ≈ 12.73，f/4 下最大距离约 3.2 m。' }
            },
            {
              '@type': 'Question',
              name: '为什么实拍总比算出来的暗？',
              acceptedAnswer: { '@type': 'Answer', text: '常见原因：跳闪或柔光罩折损（跳闪经验折损为等效距离 ×1.5～2）、灯背 GN 是长焦端口径而实际用广角端、厂商用英尺口径（英尺 GN ÷ 3.28 ≈ 米制）、TTL 预闪与实际输出差异。用 M 档并按实际焦段标称 GN 填写即可对上。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 口径：GN 为 ISO 100、米制、全功率标称值。GN = 距离(m) × 光圈(f)；
// ISO 修正 GN' = GN × √(ISO/100)；功率修正 GN' = GN × √功率。

// 功率档因子：√功率；功率需在 (0, 1]，非法返回 null
function powerFactor(power) {
  const p = Number(power)
  if (!Number.isFinite(p) || p <= 0 || p > 1) return null
  return Math.sqrt(p)
}

// ISO 修正因子：√(ISO/100)；非法返回 null
function isoFactor(iso) {
  const v = Number(iso)
  if (!Number.isFinite(v) || v <= 0) return null
  return Math.sqrt(v / 100)
}

// 有效 GN = 标称 GN × ISO 因子 × 功率因子；非法返回 null
function effectiveGnOf(gn, iso, power) {
  const g = Number(gn)
  const f = isoFactor(iso)
  const pf = powerFactor(power)
  if (!Number.isFinite(g) || g <= 0 || f === null || pf === null) return null
  return g * f * pf
}

// 已知距离求光圈：f = GN ÷ 距离；非法返回 null
function apertureForDistance(gn, dist) {
  const g = Number(gn)
  const d = Number(dist)
  if (!Number.isFinite(g) || g <= 0 || !Number.isFinite(d) || d <= 0) return null
  return g / d
}

// 已知光圈求最大距离：d = GN ÷ f；非法返回 null
function maxDistanceOf(gn, fstop) {
  const g = Number(gn)
  const f = Number(fstop)
  if (!Number.isFinite(g) || g <= 0 || !Number.isFinite(f) || f <= 0) return null
  return g / f
}

// 数值格式化：保留 digits 位小数并去掉尾零；null / undefined / 空串 / 非数字返回 '—'
function fmtNum(x, digits = 2) {
  if (x === null || x === undefined || x === '') return '—'
  const v = Number(x)
  if (!Number.isFinite(v)) return '—'
  return String(parseFloat(v.toFixed(digits)))
}

// ---------- 常量目录 ----------
const GN_CHIPS = [24, 32, 36, 58]
const DIST_CHIPS = [1, 2, 3, 5, 10]
const F_CHIPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16]
const ISO_CHIPS = [100, 200, 400, 800, 1600, 3200]
const POWERS = [
  { value: 1, label: 'M 1/1', factorText: '1.00' },
  { value: 0.5, label: 'M 1/2', factorText: '0.707' },
  { value: 0.25, label: 'M 1/4', factorText: '0.50' },
  { value: 0.125, label: 'M 1/8', factorText: '0.354' },
  { value: 0.0625, label: 'M 1/16', factorText: '0.25' }
]
const FULL_STOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22]

// 场景示例：点击代入参数（结果与描述文字已按口径核算）
const SCENES = [
  { id: 'portrait', name: '室内人像', desc: 'GN 32 · ISO 100 · M 1/8 · 2 m → 约 f/5.6', set: { gn: 32, iso: 100, power: 0.125, mode: 'aperture', dist: 2 } },
  { id: 'outdoor', name: '户外补光', desc: 'GN 36 · ISO 400 · M 1/1 · 5 m → 约 f/14', set: { gn: 36, iso: 400, power: 1, mode: 'aperture', dist: 5 } },
  { id: 'group', name: '团体合影', desc: 'GN 58 · ISO 200 · M 1/4 · 4 m → 约 f/10', set: { gn: 58, iso: 200, power: 0.25, mode: 'aperture', dist: 4 } },
  { id: 'bounce', name: '跳闪（往上打）', desc: 'GN 36 · ISO 800 · M 1/2 · 6 m → 约 f/12，跳闪再 ×1.5~2 折损', set: { gn: 36, iso: 800, power: 0.5, mode: 'aperture', dist: 6 } }
]

// ---------- 响应式参数 ----------
const gn = ref(36)
const mode = ref('aperture') // 'aperture' | 'distance'
const dist = ref(3)
const fstop = ref(4)
const iso = ref(100)
const power = ref(1)
const activeSceneId = ref('')
const seoContentVisible = ref(true)

// ---------- 计算结果 ----------
const effGn = computed(() => effectiveGnOf(gn.value, iso.value, power.value))
const answerF = computed(() => (mode.value === 'aperture' && effGn.value !== null ? apertureForDistance(effGn.value, dist.value) : null))
const answerD = computed(() => (mode.value === 'distance' && effGn.value !== null ? maxDistanceOf(effGn.value, fstop.value) : null))

const isoFactorText = computed(() => fmtNum(isoFactor(iso.value), 3))
const powerFactorText = computed(() => fmtNum(powerFactor(power.value), 3))
const powerLabel = computed(() => {
  const p = POWERS.find(x => x.value === power.value)
  return p ? p.label : '自定义'
})

// 光圈模式下：最接近的整档光圈（按 log2 距离）
const nearestStop = computed(() => {
  if (answerF.value === null) return null
  const f = answerF.value
  return FULL_STOPS.reduce((a, b) => (Math.abs(Math.log2(b) - Math.log2(f)) < Math.abs(Math.log2(a) - Math.log2(f)) ? b : a))
})

// ---------- 校验与交互 ----------
const validationIssues = computed(() => {
  const list = []
  const g = Number(gn.value)
  if (!Number.isFinite(g) || g <= 0) list.push('GN 需为大于 0 的数值（灯背标称，如 24 / 32 / 36 / 58）')
  if (mode.value === 'aperture') {
    const d = Number(dist.value)
    if (!Number.isFinite(d) || d <= 0) list.push('距离需为大于 0 的数值（米）')
  } else {
    const f = Number(fstop.value)
    if (!Number.isFinite(f) || f <= 0) list.push('光圈值需为大于 0 的数值（如 4 表示 f/4）')
  }
  return list
})

function applyScene(scene) {
  gn.value = scene.set.gn
  iso.value = scene.set.iso
  power.value = scene.set.power
  mode.value = scene.set.mode
  dist.value = scene.set.dist
  activeSceneId.value = scene.id
}

function resetAll() {
  gn.value = 36
  mode.value = 'aperture'
  dist.value = 3
  fstop.value = 4
  iso.value = 100
  power.value = 1
  activeSceneId.value = ''
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('flash-exposure-guide')
})
</script>
