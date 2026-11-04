<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sun class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">ND 减光镜快门计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">基准快门 × ND 档数即时换算长曝光时长，1 档 ×2 阶梯表、B 门实际拍摄时长与反查基准、互易律失效提示、溪流瀑布海面车轨场景预设</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线 ND 减光镜快门计算器：风光慢门玩家的核心换算工具。输入无滤镜时的正确曝光（基准快门），选择 ND 镜档位（ND2 一档到 ND1000 十档、Haida 常见 ND40000 约 15.6 档，或自定义档数），
        按「每加一档、快门 ×2」即时算出装上滤镜后的新快门；再按目标画面效果（丝滑河流、雾化瀑布、拉丝海面、日间车轨）反查该配哪档镜、基准快门该测到多少。
        附带 B 门按住时长、互易律失效提示与超 30 分钟的光绘堆栈拆分建议。全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Aperture class="w-5 h-5 mr-2 text-primary" /> 拍摄参数
        </h2>

        <!-- 基准快门 -->
        <div>
          <label for="nd-base" class="block text-sm font-medium text-foreground mb-1.5">基准快门（无滤镜时的正确曝光）</label>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <button
              v-for="c in BASE_CHIPS"
              :key="c.label"
              type="button"
              @click="baseInput = c.sec; baseUnit = 's'"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="baseSec === c.sec ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >{{ c.label }}</button>
          </div>
          <div class="flex items-center gap-2">
            <input id="nd-base" v-model.number="baseInput" type="number" step="0.001" min="0" class="flex-1 px-2 py-1.5 bg-muted/50 border border-border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <div class="flex rounded-lg border border-border overflow-hidden">
              <button
                v-for="u in SHUTTER_UNITS"
                :key="u"
                type="button"
                @click="baseUnit = u"
                class="px-3 py-1.5 text-xs font-medium"
                :class="baseUnit === u ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'"
              >{{ u }}</button>
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">
            秒 / 分 / 时三单位输入；如 1/100s 填 0.01 + s。当前基准
            <span class="font-mono text-foreground">{{ baseText }}</span>。
          </p>
        </div>

        <!-- ND 档位 -->
        <div>
          <label for="nd-select" class="block text-sm font-medium text-foreground mb-1.5">ND 减光镜档位（1 档 = 进光量减半 = 快门 ×2）</label>
          <select id="nd-select" v-model="ndChoice" class="w-full px-3 py-2 bg-muted/50 border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option v-for="o in ND_OPTIONS" :key="o.id" :value="o.id">{{ o.label }}</option>
          </select>
          <div v-if="isCustomStops" class="flex items-center gap-2 mt-2">
            <input v-model.number="customStops" type="number" step="0.1" min="0" max="15.6" class="w-28 px-2 py-1.5 bg-muted/50 border border-border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-xs text-muted-foreground">档（0 ~ 15.6）</span>
          </div>
          <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            光学密度 D = 0.3 × 档数（ND1000 ≈ D3.0 = 10 档）；当前 <span class="font-mono text-foreground">{{ stopsText }} 档</span>。
          </p>
        </div>

        <!-- 预设 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">快速预设</p>
          <div class="space-y-2">
            <button
              v-for="p in PRESETS"
              :key="p.id"
              type="button"
              @click="applyPreset(p)"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-left transition"
            >
              <Play class="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span class="text-xs text-foreground">{{ p.label }}</span>
            </button>
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

      <!-- 右：结果与辅助 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 结果特大卡 -->
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Sun class="w-5 h-5 mr-2 text-primary" /> 换算结果
          </h2>
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono">
            <span class="text-xl text-foreground">{{ baseText }}</span>
            <span class="text-sm text-muted-foreground">+</span>
            <span class="text-xl text-foreground">{{ ndMeta.name }}</span>
            <span class="text-xs text-muted-foreground">（{{ stopsText }} 档）</span>
            <span class="text-2xl text-primary">→</span>
            <span class="text-4xl lg:text-5xl font-bold text-primary break-all">{{ resultText }}</span>
          </div>
          <p v-if="result && result.over" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>已超 99 小时上限，仅显示 99 h+；超过 60 分钟请用间隔拍摄合成。</span>
          </p>
          <p v-if="reciprocityOn && resultWarning" class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-amber-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ resultWarning }}</span>
          </p>
          <p v-else-if="result && resultWarning === null" class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
            <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ resultText }} ≤ 30 秒，互易律失效可忽略，按此值直接曝光。</span>
          </p>
          <div v-if="resultInterval" class="p-3 rounded-lg bg-muted/60 border border-border text-xs text-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>目标时长超 30 分钟：{{ resultInterval.text }}，比单张长曝热噪更可控。</span>
          </div>
        </div>

        <!-- B 门辅助卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Moon class="w-5 h-5 mr-2 text-primary" /> B 门辅助（目标新快门 → 实际拍摄时长）
          </h2>
          <div>
            <label for="nd-target" class="block text-sm font-medium text-foreground mb-1.5">目标新快门（想要的画面效果时长）</label>
            <div class="flex items-center gap-2">
              <input id="nd-target" v-model.number="targetInput" type="number" step="1" min="0" class="flex-1 px-2 py-1.5 bg-muted/50 border border-border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <div class="flex rounded-lg border border-border overflow-hidden">
                <button
                  v-for="u in SHUTTER_UNITS"
                  :key="'t-' + u"
                  type="button"
                  @click="targetUnit = u"
                  class="px-3 py-1.5 text-xs font-medium"
                  :class="targetUnit === u ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'"
                >{{ u }}</button>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">B 门需按住（快门线计时）</p>
              <p class="text-2xl lg:text-3xl font-bold text-primary font-mono break-all">{{ targetText }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">当前 {{ ndMeta.name }}（{{ stopsText }} 档）下反查基准快门</p>
              <p class="text-2xl lg:text-3xl font-bold text-foreground font-mono break-all">{{ reverseBaseText }}</p>
              <p class="text-[10px] text-muted-foreground mt-1">把机内测光 / M 档调到该基准，装镜后即为目标时长</p>
            </div>
          </div>
          <label class="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input v-model="reciprocityOn" type="checkbox" class="accent-primary" />
            对超过 30 秒的曝光提示互易律失效（胶卷才明显，数码基本可忽略）
          </label>
          <p v-if="reciprocityOn && targetWarning" class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-amber-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ targetWarning }}</span>
          </p>
          <div v-if="targetInterval" class="p-3 rounded-lg bg-muted/60 border border-border text-xs text-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{{ targetInterval.text }}（风光圈「光绘堆栈」口径：多张短曝后期平均，比单张更干净）。</span>
          </div>
        </div>

        <!-- 档位阶梯表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Info class="w-5 h-5 mr-2 text-primary" /> 档位阶梯（每加 1 档快门 ×2）
          </h2>
          <p class="text-xs text-muted-foreground mb-3">基于当前基准 {{ baseText }} 逐档换算，0 ~ 15 档可横向滚动；高亮为最接近当前 {{ stopsText }} 档的位置。</p>
          <div class="overflow-x-auto">
            <div class="flex min-w-max gap-1.5">
              <div
                v-for="row in stepsRows"
                :key="row.stops"
                class="w-16 px-1 py-2 rounded-lg border text-center"
                :class="row.stops === activeStep ? 'border-primary bg-primary/10' : 'border-border bg-muted/40'"
              >
                <p class="text-[10px] text-muted-foreground">{{ row.stops }} 档</p>
                <p class="text-[11px] font-mono mt-0.5 break-all" :class="row.stops === activeStep ? 'text-primary font-bold' : 'text-foreground'">{{ row.text }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 场景目标快门 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Sun class="w-5 h-5 mr-2 text-primary" /> 场景目标快门（点击反查基准 / ND 组合）
          </h2>
          <p class="text-xs text-muted-foreground mb-3 leading-relaxed">点击场景会把目标快门填入上方 B 门辅助，按当前 ND 档数反查无滤镜基准快门；换一档 ND 再点一次，就能看到「同一片溪水该配哪档镜」。</p>
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
              <p class="text-xs text-primary font-mono mt-0.5">{{ s.rangeText }}</p>
              <p class="text-[10px] text-muted-foreground mt-1 leading-relaxed">{{ s.tip }}</p>
            </button>
          </div>
        </div>

        <!-- 选购常识 + 景深互链 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="bg-card border border-border rounded-lg p-5">
            <h2 class="text-sm font-semibold flex items-center mb-2">
              <Info class="w-4 h-4 mr-1.5 text-primary" /> 滤镜选购常识
            </h2>
            <ul class="list-disc list-inside space-y-1.5 text-xs text-muted-foreground leading-relaxed">
              <li>方形系统（100 / 150mm 支架）可叠渐变镜、方便黑卡刷天空，风光主力；圆形旋入轻便便宜、密封防漏光，适合入门定档慢门。</li>
              <li>低价大档数减光普遍偏品红 / 偏青，需手动白平衡或后期校色；镀膜好的玻璃镜偏色可控，对风光长曝值得投入。</li>
              <li>超 10 档取景器会黑到无法构图：先对焦构图再装镜，或用实时取景提 ISO 预览。</li>
            </ul>
          </div>
          <div class="bg-card border border-border rounded-lg p-5 flex flex-col">
            <h2 class="text-sm font-semibold flex items-center mb-2">
              <Aperture class="w-4 h-4 mr-1.5 text-primary" /> 配合景深工具使用
            </h2>
            <p class="text-xs text-muted-foreground leading-relaxed flex-1">
              长曝光常配 f/8 ~ f/11 换全景深：先用景深工具确认光圈、对焦距离与超焦距，再回到本页把基准快门和 ND 档位钉死，一套风光慢门参数就闭环了。
            </p>
            <NuxtLink to="/tools/depth-of-field-calculator" class="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary hover:underline">
              <Aperture class="w-4 h-4" /> 打开景深超焦距计算器 →
            </NuxtLink>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>ND 减光镜快门计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款面向风光 / 慢门摄影的在线 ND 减光镜换算工具。核心只有一条物理规律：ND 镜每增加 1 档（进光量减半），
          正确曝光的快门时间就要乘以 2。所以「1/100s 的基准曝光 + ND1000（10 档）= 0.01 × 2¹⁰ ≈ 10.2s」。
          本页把这条换算做成正向（基准 + 档位 → 新快门）与反向（目标时长 + 档位 → 该测的基准）两个方向，
          并附 B 门按住时长、互易律失效提示、超 30 分钟的堆栈拆分建议与 0 ~ 15 档阶梯速查表，全部在浏览器本地计算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">ND 档位数字是什么意思？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一套口径讲透：ND 后面的数字是「透光率的倒数」。ND2 只透过 1/2 的光、ND8 透过 1/8、ND1000 透过 1/1000；
          摄影上把「进光量减半」定义为 1 档（EV），所以 ND2 = 1 档、ND8 = 3 档、ND64 = 6 档、ND1000 = 10 档。
          滤镜厂商标的「光学密度 D」是同一条曲线的另一种刻度：D = log10(ND)，恰好 ≈ 0.3 × 档数——
          ND1000 的 D = 3.0 就是 10 档，Haida 等品牌的 ND100000 / 标注 15.6 档的镜子 D ≈ 4.7。
          记住「档数 ×2 累乘」即可：快门 = 基准快门 × 2^档数，非整数档（如 15.6）也一样套公式。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么长曝光还要黑卡或渐变镜？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          整片均匀减光的 ND 解决的是「总进光量」，解决不了「光比」：日出日落时天空比地面亮 4 ~ 6 档，
          按地面曝光天空就过曝死白。渐变镜（上浓下透）压天空、或 B 门期间用黑卡上下刷遮天空若干秒，
          等于给画面不同区域配不同档数——先用本工具算出总时长，再按光比把天空部分遮住 1/3 ~ 1/2 时间即可。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">10 档和 15 档什么时候需要？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          经验分界：晴天白天想拍 30s 级海面拉丝 / 流云，1/125 的基准大约要 10 档（ND1000）；
          正午强光想直接上分钟级（雾化大瀑布、消人于无形），才需要 15 档级（ND40000 / 两片叠加）。
          15 档以上取景全黑、自动对焦失效、偏色更重，能不用就不用；多数场景「10 档 + f/16 + ISO 50」已经能把白天压到 30 秒开外。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">数码要担心互易律失效吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          互易律失效指曝光超过一定时长后「时间翻倍、密度不翻倍」，需要额外加曝光且常伴随色彩偏移——这是胶卷（尤其黑白负片 / 反转片）在 1 秒级以上明显存在的问题。
          现代数码传感器在分钟级内基本遵守互易律，最长可以直拍后看长曝噪点。本工具默认对 >30 秒的结果给出提示开关：拍胶卷请开启并按厂商互易律表加补偿，拍数码可以关掉、放心按计算值曝光。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">三脚架、快门线与防误触</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          秒级曝光必备脚架，中轴别升太高、挂钩挂配重；用电子快门线或 2 秒延时 + 反光镜预升避开按快门那一下的震动，风大时给机身挂袋配重，长曝中途不碰脚架。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">10 档 ND 怎么调参数？</h3>
            <p class="text-sm text-muted-foreground mt-1">先不给滤镜正常测光（如 1/100s f/8 ISO100），快门时间 ×2¹⁰ = ×1024：1/100s 变约 10.2s；本页把「基准 + 档数 → 新快门」一键算好，也支持反向：想拍 30s 配 10 档镜，基准快门就该测在 1/34s。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么我拍的河流不够丝滑？</h3>
            <p class="text-sm text-muted-foreground mt-1">溪流出丝滑一般需要 1/2s ~ 2s、瀑布雾化 1 ~ 4s，白天直拍只有 1/200s 时就得靠 ND 补差；用本页场景卡反查：例如目标 2s、基准 1/200s，约需 7 档（ND128），再按水流速度微调。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">超过 30 分钟的曝光怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">不建议单张 B 门硬拍：热噪和坏点明显，还需有人计时。风光圈通行做法是「光绘堆栈」——拆成多张 30s 短曝（本工具自动给出张数），后期用平均 / 最大值模式合成，等效时长相同、画质更干净。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。快门换算、阶梯表与反查全部在你的浏览器内用纯算术即时完成，无网络请求，参数不被保存或上传。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'nd-filter-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Sun, Moon, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Aperture
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'ND 减光镜快门计算器 - 长曝光档位快门换算在线工具',
  description: '免费在线 ND 减光镜计算器：基准快门×2^档数即时换算长曝光新快门，ND2 到 ND1000 及 15.6 档全谱、B 门实际拍摄时长与目标反查基准、互易律失效提示、超 30 分钟堆栈拆分建议、溪流瀑布海面车轨场景预设，纯浏览器本地计算不上传',
  keywords: 'ND 减光镜计算器,减光镜档位快门换算,长曝光 河流丝滑,10 档 ND 怎么调,慢门参数',
  author: '有条工具',
  ogTitle: 'ND 减光镜快门计算器 - 长曝光档位快门换算在线工具 | 有条工具',
  ogDescription: '输入基准快门与 ND 档位，即时换算长曝光新快门；支持目标时长反查基准、B 门按住计时与堆栈拆分建议。',
  ogUrl: 'https://www.util.cn/tools/nd-filter-calculator',
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
          name: 'ND 减光镜快门计算器',
          url: 'https://www.util.cn/tools/nd-filter-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['ND2 至 ND40000 档位全谱与自定义档数', '基准快门×2^档数正向换算', '目标快门反查基准曝光', 'B 门实际拍摄时长与快门线计时', '互易律失效提示开关', '超 30 分钟光绘堆栈拆分建议', '0~15 档阶梯速查表', '溪流瀑布海面车轨场景预设', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: 'ND 减光镜快门计算器', item: 'https://www.util.cn/tools/nd-filter-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '10 档 ND 怎么调参数？',
              acceptedAnswer: { '@type': 'Answer', text: '先不给滤镜正常测光（如 1/100s f/8 ISO100），快门时间乘以 2 的 10 次方（1024）：1/100s 变约 10.2 秒。本工具支持正向与反向两种换算，也可按想要的效果时长反查该测到的基准快门。' }
            },
            {
              '@type': 'Question',
              name: '为什么我拍的河流不够丝滑？',
              acceptedAnswer: { '@type': 'Answer', text: '溪流丝滑一般需要 0.5 到 2 秒、瀑布雾化 1 到 4 秒；白天直拍只有 1/200 秒时就要靠 ND 补档差。用场景卡反查：目标 2 秒、基准 1/200 秒约需 7 档（ND128），再按水流速度微调。' }
            },
            {
              '@type': 'Question',
              name: '超过 30 分钟的曝光怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '不建议单张 B 门硬拍，热噪坏点明显且需人肉计时。通行做法是光绘堆栈：拆成多张 30 秒短曝，后期平均/最大值合成，等效时长相同、画面更干净。本工具对超 30 分钟的结果自动给出拆分支数。' }
            },
            {
              '@type': 'Question',
              name: '计算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。快门换算、阶梯表与反查全部在浏览器内用纯算术即时完成，无网络请求，参数不会被保存或上传。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 单位约定：时长一律用秒（s）。核心规律：每加 1 档进光量减半 → 快门时间 ×2，新快门 = 基准 × 2^档数。

const MAX_SHUTTER_SEC = 99 * 3600 // 显示上限 99 小时，超出标注 99 h+（超 60 分钟即建议间隔堆栈）
const RECIPROCITY_THRESHOLD_SEC = 30 // 互易律失效提示阈值（仅胶卷需要当真）
const STACK_TRIGGER_SEC = 1800 // 超过 30 分钟给堆栈拆分建议
const STACK_PER_FRAME_SEC = 30 // 堆栈每支建议时长：风光圈「光绘堆栈」常用 30s

// ND 值 → 档数纯常量映射表。档数 = log2(ND)；光学密度 D = log10(ND) ≈ 0.3 × 档数。
// 表内为市售常见整数档 / 代表值；未收录的 ND 数（如 ND3）按 log2 兜底换算。
const ND_STOPS_TABLE = {
  2: 1, 4: 2, 8: 3, 16: 4, 32: 5, 64: 6, 128: 7, 256: 8, 500: 9, 1000: 10,
  2000: 11, 4000: 12, 8000: 13, 16000: 14, 32000: 15, 40000: 15.6
}

// ND 值 → 档数：命中常量表优先；否则按 log2(ND) 保留 2 位小数；非法返回 null
function stopsOf(ndValue) {
  const n = Number(ndValue)
  if (!Number.isFinite(n) || n < 1) return null
  if (ND_STOPS_TABLE[n] !== undefined) return ND_STOPS_TABLE[n]
  return Math.round(Math.log2(n) * 100) / 100
}

// EV 偏移 ↔ 时长换算：time = baseSec × 2^ev（ev>0 加长曝光，ev<0 缩短）；非法输入返回 null
function evToTimeOf(baseSec, ev) {
  if (!Number.isFinite(baseSec) || baseSec <= 0) return null
  if (!Number.isFinite(ev)) return null
  return baseSec * Math.pow(2, ev)
}

// 解析快门输入：value + 单位（s / min / h）→ 秒；非法返回 null
function parseShutter(value, unit) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  const factor = unit === 'min' ? 60 : unit === 'h' ? 3600 : 1
  return n * factor
}

// 自适应格式化：s / min / h，1 位小数；<1s 写成 1/N；超 99 小时上限标 99 h+
function formatShutter(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return '—'
  if (sec > MAX_SHUTTER_SEC) return '99 h+'
  if (sec < 1) return `1/${Math.max(2, Math.round(1 / sec))} s`
  if (sec < 60) return `${+sec.toFixed(1)} s`
  if (sec < 3600) return `${+(sec / 60).toFixed(1)} min`
  return `${+(sec / 3600).toFixed(1)} h`
}

// 正向核心：基准快门 + 档数 → 新快门对象 { sec, over, text }；sec 为真实值，over 标记是否超 99h
function newShutterOf(baseSec, stops) {
  const sec = evToTimeOf(baseSec, stops)
  if (sec === null) return null
  return { sec, over: sec > MAX_SHUTTER_SEC, text: formatShutter(sec) }
}

// 反向：目标时长 + 档数 → 需要的无滤镜基准快门（秒）；非法返回 null
function baseForTargetOf(targetSec, stops) {
  return evToTimeOf(targetSec, -stops)
}

// 互易律失效提示：>30 秒返回提示文本（含「胶卷才明显，数码基本可忽略」诚实注记），否则 null
function reciprocityWarningOf(sec) {
  if (!Number.isFinite(sec) || sec <= RECIPROCITY_THRESHOLD_SEC) return null
  return `曝光已达 ${formatShutter(sec)}，超过 30 秒：胶卷会有明显互易律失效（需额外加曝光且偏色），数码传感器基本可忽略，按计算值直拍即可。`
}

// 堆栈拆分建议：>30 分钟返回 { frames, perFrameSec, text }，否则 null
function intervalOf(sec) {
  if (!Number.isFinite(sec) || sec <= STACK_TRIGGER_SEC) return null
  const frames = Math.ceil(sec / STACK_PER_FRAME_SEC)
  return {
    frames,
    perFrameSec: STACK_PER_FRAME_SEC,
    text: `建议拆成 ${frames} 张 × ${STACK_PER_FRAME_SEC}s 堆栈合成`
  }
}

function clampNum(v, lo, hi) {
  const n = Number(v)
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, n))
}

// 滤镜目录：ND 值 + 光学密度（0.3×档数）口径统一进下拉表
const ND_OPTIONS = [
  { id: 'nd2', name: 'ND2', label: 'ND2 · 1 档（密度 0.3）', stops: 1 },
  { id: 'nd4', name: 'ND4', label: 'ND4 · 2 档（密度 0.6）', stops: 2 },
  { id: 'nd8', name: 'ND8', label: 'ND8 · 3 档（密度 0.9）', stops: 3 },
  { id: 'nd16', name: 'ND16', label: 'ND16 · 4 档（密度 1.2）', stops: 4 },
  { id: 'nd32', name: 'ND32', label: 'ND32 · 5 档（密度 1.5）', stops: 5 },
  { id: 'nd64', name: 'ND64', label: 'ND64 · 6 档（密度 1.8）', stops: 6 },
  { id: 'nd128', name: 'ND128', label: 'ND128 · 7 档（密度 2.1）', stops: 7 },
  { id: 'nd256', name: 'ND256', label: 'ND256 · 8 档（密度 2.4）', stops: 8 },
  { id: 'nd500', name: 'ND500', label: 'ND500 · 9 档（密度 2.7）', stops: 9 },
  { id: 'nd1000', name: 'ND1000', label: 'ND1000 · 10 档（密度 3.0）', stops: 10 },
  { id: 'nd40000', name: 'ND40000', label: 'ND40000 · 15.6 档（密度 4.7 · Haida 常见）', stops: 15.6 },
  { id: 'custom', name: '自定义', label: '自定义档数…（0 ~ 15.6）', stops: null, custom: true }
]

// 场景目标快门：风光玩家经验区间（点击设定目标，反查基准 / ND 组合）
const SCENES = [
  { id: 'stream', name: '溪流丝滑', rangeText: '1/2 ~ 2 s', targetSec: 1, tip: '入门档位：水面起雾但保留纹理' },
  { id: 'waterfall', name: '瀑布雾化', rangeText: '1 ~ 4 s', targetSec: 2.5, tip: '落差大的瀑布 2s 左右雾感最强' },
  { id: 'sea', name: '海面拉丝', rangeText: '30 ~ 120 s', targetSec: 60, tip: '浪完全抹平、云开始拖尾' },
  { id: 'cloud', name: '流云', rangeText: '10 ~ 60 s', targetSec: 30, tip: '风大取 10s，缓云取 60s' },
  { id: 'cartrail', name: '日间车轨', rangeText: '15 ~ 30 s', targetSec: 20, tip: '白天压出连续车轨至少 15s' },
  { id: 'portrait', name: '人像慢门', rangeText: '≈ 1/15 s', targetSec: 0.0667, tip: '弱 ND（ND2/ND4）留动感不糊脸' },
  { id: 'removepeople', name: '消路人', rangeText: '2 ~ 4 s', targetSec: 3, tip: '广场走动游客 3s 基本消失' },
  { id: 'lightning', name: '闪电堆栈', rangeText: '无需 ND', targetSec: null, tip: 'B 门连拍多张，后期堆栈叠闪电' }
]

// 常用基准快门速贴（秒，取整到 4 位小数便于高亮比对）
const BASE_CHIPS = [
  { label: '1/250s', sec: 0.004 },
  { label: '1/125s', sec: 0.008 },
  { label: '1/100s', sec: 0.01 },
  { label: '1/60s', sec: 0.0167 },
  { label: '1/30s', sec: 0.0333 }
]

const SHUTTER_UNITS = ['s', 'min', 'h']

// 正向预设：基准 + ND 组合直接落在场景经验区间内
const PRESETS = [
  { id: 'waterfall', label: '瀑布雾化：基准 1/50s + ND64 → 约 1.3s', base: 0.02, ndId: 'nd64' },
  { id: 'sea', label: '海面拉丝：基准 1/30s + ND1000 → 约 34s', base: 0.0333, ndId: 'nd1000' },
  { id: 'cartrail', label: '日间车轨：基准 1/60s + ND1000 → 约 17s', base: 0.0167, ndId: 'nd1000' }
]

const STEPS_RANGE = Array.from({ length: 16 }, (_, i) => i) // 阶梯表覆盖 0 ~ 15 档

// ---------- 响应式参数 ----------
const baseInput = ref(0.01)
const baseUnit = ref('s')
const ndChoice = ref('nd1000')
const customStops = ref(10)
const targetInput = ref(30)
const targetUnit = ref('s')
const reciprocityOn = ref(true)
const activeSceneId = ref('')
const seoContentVisible = ref(true)

const ndMeta = computed(() => ND_OPTIONS.find((o) => o.id === ndChoice.value) || ND_OPTIONS[0])
const isCustomStops = computed(() => !!ndMeta.value.custom)
const stops = computed(() => (isCustomStops.value ? clampNum(customStops.value, 0, 15.6) : ndMeta.value.stops))
const stopsText = computed(() => (Number.isInteger(stops.value) ? String(stops.value) : stops.value.toFixed(1)))
const baseSec = computed(() => parseShutter(baseInput.value, baseUnit.value))
const baseText = computed(() => (baseSec.value === null ? '—' : formatShutter(baseSec.value)))

// ---------- 计算结果 ----------
const result = computed(() => (baseSec.value === null ? null : newShutterOf(baseSec.value, stops.value)))
const resultText = computed(() => (result.value ? result.value.text : '—'))
const resultWarning = computed(() => (result.value ? reciprocityWarningOf(result.value.sec) : null))
const resultInterval = computed(() => (result.value ? intervalOf(result.value.sec) : null))

const targetSec = computed(() => parseShutter(targetInput.value, targetUnit.value))
const targetText = computed(() => (targetSec.value === null ? '—' : formatShutter(targetSec.value)))
const reverseBaseSec = computed(() => (targetSec.value === null ? null : baseForTargetOf(targetSec.value, stops.value)))
const reverseBaseText = computed(() => (reverseBaseSec.value === null ? '—' : formatShutter(reverseBaseSec.value)))
const targetWarning = computed(() => (targetSec.value === null ? null : reciprocityWarningOf(targetSec.value)))
const targetInterval = computed(() => (targetSec.value === null ? null : intervalOf(targetSec.value)))

const stepsRows = computed(() => {
  if (baseSec.value === null) return []
  return STEPS_RANGE.map((i) => ({ stops: i, text: formatShutter(evToTimeOf(baseSec.value, i)) }))
})
const activeStep = computed(() => Math.min(15, Math.floor(stops.value)))

const validationIssues = computed(() => {
  const list = []
  if (baseSec.value === null) list.push('基准快门需为大于 0 的数值（如 1/100s 填 0.01 + s）')
  else if (baseSec.value > MAX_SHUTTER_SEC) list.push(`基准快门已超 99 小时，换算意义有限，请检查输入单位`)
  if (isCustomStops.value) {
    const raw = Number(customStops.value)
    if (!Number.isFinite(raw) || raw < 0 || raw > 15.6) list.push(`自定义档数限 0 ~ 15.6，已按 ${stops.value.toFixed(1)} 档计算`)
  }
  if (targetSec.value === null && String(targetInput.value) !== '') list.push('目标新快门需为大于 0 的数值')
  return list
})

// ---------- 交互动作 ----------
function applyPreset(p) {
  baseInput.value = p.base
  baseUnit.value = 's'
  ndChoice.value = p.ndId
  activeSceneId.value = ''
}

function applyScene(scene) {
  activeSceneId.value = scene.id
  if (scene.targetSec === null) return
  targetInput.value = scene.targetSec
  targetUnit.value = 's'
}

function resetAll() {
  baseInput.value = 0.01
  baseUnit.value = 's'
  ndChoice.value = 'nd1000'
  customStops.value = 10
  targetInput.value = 30
  targetUnit.value = 's'
  reciprocityOn.value = true
  activeSceneId.value = ''
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('nd-filter-calculator')
})
</script>
