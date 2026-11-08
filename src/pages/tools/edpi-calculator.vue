<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Crosshair class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">eDPI 灵敏度换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">DPI × 游戏内灵敏度即时算 eDPI，CS2 / 无畏契约 / Apex / OW2 互转，360° 旋转距离 cm 与 inch 双显，本地计算</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线 eDPI 灵敏度换算工具：输入鼠标 DPI 与各游戏内灵敏度，即时得到 eDPI（DPI × 灵敏度）与真正决定手感的 360° 旋转距离（英寸 / 厘米双显）。
        内置各游戏引擎 yaw 常数口径（CS2 0.022、无畏契约 0.07、Apex 0.022、OW2 0.0066 °/count），支持同一鼠标在两游戏之间按「同手感」互算灵敏度：
        sens B = sens A × yaw A ÷ yaw B。换算全程只依赖乘除，数值不经任何网络请求——全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：DPI 与各游戏灵敏度输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Mouse class="w-5 h-5 mr-2 text-primary" /> 鼠标与灵敏度
        </h2>

        <!-- DPI -->
        <div>
          <label for="edpi-dpi" class="block text-sm font-medium text-foreground mb-1.5">鼠标 DPI（驱动 / 游戏内一致）</label>
          <input
            id="edpi-dpi"
            v-model.number="dpi"
            type="number"
            step="50"
            min="0"
            class="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="如 800"
          />
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="d in DPI_CHIPS"
              :key="d"
              type="button"
              @click="dpi = d"
              class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
              :class="dpi === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >{{ d }}</button>
          </div>
        </div>

        <!-- 各游戏灵敏度输入（点击行选择主游戏） -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">各游戏灵敏度（点击行 = 选为主游戏，右侧大卡随之切换）</p>
          <div class="space-y-2">
            <div
              v-for="row in gameRows"
              :key="row.id"
              role="button"
              tabindex="0"
              @click="selectedGameId = row.id"
              @keydown.enter="selectedGameId = row.id"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition cursor-pointer"
              :class="selectedGameId === row.id ? 'border-primary bg-primary/10' : 'border-border bg-muted/40 hover:bg-muted'"
            >
              <span class="w-40 flex-shrink-0">
                <span class="block text-sm font-medium text-foreground">{{ row.name }}</span>
                <span class="block text-[10px] text-muted-foreground">yaw {{ row.yaw }} °/count</span>
              </span>
              <input
                v-model.number="sensByGame[row.id]"
                type="number"
                step="0.01"
                min="0"
                class="w-24 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                :placeholder="'灵敏度'"
              />
              <span class="ml-auto text-right">
                <span class="block text-xs text-muted-foreground">eDPI <span class="font-mono text-foreground">{{ fmtNum(row.edpi, 2) }}</span></span>
                <span class="block text-[10px] text-muted-foreground">360° = {{ fmtNum(row.distCm, 2) }} cm</span>
              </span>
            </div>
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

      <!-- 右：eDPI 大卡 + 360° 距离卡 -->
      <div class="space-y-6">
        <div class="bg-card border border-primary/40 rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Gamepad2 class="w-5 h-5 mr-2 text-primary" /> eDPI（{{ mainRow ? mainRow.name : '—' }}）
          </h2>
          <div v-if="mainRow && mainRow.edpi !== null">
            <p class="text-5xl lg:text-6xl font-bold text-primary font-mono break-all">{{ fmtNum(mainRow.edpi, 2) }}</p>
            <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
              eDPI = DPI × 游戏内灵敏度 = <span class="font-mono text-foreground">{{ dpi }}</span> × <span class="font-mono text-foreground">{{ fmtNum(mainRow.sens, 4) }}</span>。
              eDPI 只在同一个游戏内可比——跨游戏请看下方 360° 距离。
            </p>
          </div>
          <p v-else class="p-8 text-center text-sm text-muted-foreground">填写 DPI 与灵敏度后显示 eDPI</p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Crosshair class="w-5 h-5 mr-2 text-primary" /> 360° 旋转距离（真正决定手感）
          </h2>
          <div v-if="mainRow && mainRow.distIn !== null">
            <div class="flex flex-wrap items-baseline gap-x-6 gap-y-2 font-mono">
              <span class="text-3xl lg:text-4xl font-bold text-foreground">{{ fmtNum(mainRow.distCm, 2) }} <span class="text-base text-muted-foreground">cm</span></span>
              <span class="text-xl lg:text-2xl font-semibold text-muted-foreground">{{ fmtNum(mainRow.distIn, 2) }} <span class="text-xs">in</span></span>
            </div>
            <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
              360° 距离 = 360 ÷ (yaw × eDPI)，即鼠标在垫子上滑动多少距离角色恰好转身一圈（1 in = 2.54 cm）；数值越小越「灵敏」。
            </p>
            <p v-if="feelNote" class="text-xs leading-relaxed mt-2 p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ feelNote }}</span>
            </p>
          </div>
          <p v-else class="p-8 text-center text-sm text-muted-foreground">填写 DPI 与灵敏度后显示 360° 距离</p>
        </div>
      </div>
    </div>

    <!-- 两游戏互转双栏 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <ArrowLeftRight class="w-5 h-5 mr-2 text-primary" /> 两游戏灵敏度互转（同一鼠标 · 同 DPI）
      </h2>
      <p class="text-xs text-muted-foreground mb-4 leading-relaxed">
        换算公式 sens B = sens A × yaw A ÷ yaw B，两侧都可直接修改、另一侧自动同步；换算保证 360° 距离不变（同 DPI 前提）。
        例：CS2 2.0 → 无畏契约 2.0 × 0.022 ÷ 0.07 ≈ 0.6286。
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-center">
        <div class="p-4 rounded-lg border border-border bg-muted/40 space-y-2">
          <select
            :value="convGameAId"
            @change="setConvGameA($event.target.value)"
            class="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="g in GAMES" :key="g.id" :value="g.id">{{ g.name }}（yaw {{ g.yaw }}）</option>
          </select>
          <div class="flex items-center gap-2">
            <input
              :value="convSensA ?? ''"
              @input="setConvSensA($event.target.value)"
              type="number"
              step="0.01"
              min="0"
              class="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="游戏 A 灵敏度"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">灵敏度</span>
          </div>
          <p v-if="convEdpiA !== null" class="text-[11px] text-muted-foreground">eDPI <span class="font-mono text-foreground">{{ fmtNum(convEdpiA, 2) }}</span></p>
        </div>

        <div class="flex justify-center">
          <button
            type="button"
            @click="swapConv"
            title="交换两侧游戏与灵敏度"
            class="w-10 h-10 flex items-center justify-center rounded-full border border-border bg-muted hover:bg-muted/80 text-foreground transition"
          >
            <ArrowLeftRight class="w-4 h-4" />
          </button>
        </div>

        <div class="p-4 rounded-lg border border-border bg-muted/40 space-y-2">
          <select
            :value="convGameBId"
            @change="setConvGameB($event.target.value)"
            class="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="g in GAMES" :key="g.id" :value="g.id">{{ g.name }}（yaw {{ g.yaw }}）</option>
          </select>
          <div class="flex items-center gap-2">
            <input
              :value="convSensB ?? ''"
              @input="setConvSensB($event.target.value)"
              type="number"
              step="0.01"
              min="0"
              class="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="游戏 B 灵敏度"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">灵敏度</span>
          </div>
          <p v-if="convEdpiB !== null" class="text-[11px] text-muted-foreground">eDPI <span class="font-mono text-foreground">{{ fmtNum(convEdpiB, 2) }}</span></p>
        </div>
      </div>
      <p v-if="convGameAId === convGameBId" class="text-xs leading-relaxed mt-3 p-2.5 rounded bg-amber-500/10 text-amber-600 flex items-start gap-1.5">
        <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>两侧是同一个游戏，yaw 相同，灵敏度数值换算后不变。</span>
      </p>
      <p v-if="convCm360 !== null" class="text-xs text-muted-foreground mt-3">
        按当前 DPI <span class="font-mono text-foreground">{{ dpi }}</span>：两侧 360° 距离一致，均为
        <span class="font-mono text-primary">{{ fmtNum(convCm360, 2) }} cm</span>（{{ fmtNum(convIn360, 2) }} in）——同手感换算的物理保证。
      </p>
      <p v-else class="text-xs text-muted-foreground mt-3">填写左侧 DPI 与任一侧灵敏度后，这里显示两侧共同的 360° 距离。</p>
    </div>

    <!-- 职业 eDPI 区间参考 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-2">
        <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 常见职业选手 eDPI 区间（CS 系口径参考）
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div class="p-4 rounded-lg bg-muted/50 border border-border text-center">
          <p class="text-2xl font-bold text-primary font-mono">600–1200</p>
          <p class="text-xs text-muted-foreground mt-1">职业选手 eDPI 常见区间</p>
        </div>
        <div class="p-4 rounded-lg bg-muted/50 border border-border text-center">
          <p class="text-2xl font-bold text-primary font-mono">≈ 990</p>
          <p class="text-xs text-muted-foreground mt-1">社区抽样平均 eDPI（平均 DPI ≈ 584 × 平均灵敏度 ≈ 1.69）</p>
        </div>
        <div class="p-4 rounded-lg bg-muted/50 border border-border text-center">
          <p class="text-2xl font-bold text-primary font-mono">35–70 cm</p>
          <p class="text-xs text-muted-foreground mt-1">该区间对应的 360° 距离（yaw 0.022）</p>
        </div>
      </div>
      <p class="text-xs text-muted-foreground leading-relaxed">
        以上为范围性统计口径：社区抽样（r/GlobalOffensive 讨论，结合 Liquipedia 鼠标设置表交叉核对）显示约三分之二 CS 职业选手使用 400 DPI，
        平均 eDPI 落在 900–1000 一带，其中 600–1000 最密集；AWP 手与预瞄型选手倾向区间下沿，突破手略高。
        本工具不做具体选手数值罗列，个别选手实时数据以 Liquipedia 鼠标设置页为准。手腕流之外，多数玩家从 800 DPI × 1.0（CS2 口径，约 52 cm/360）附近开始微调是常见起点。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>eDPI 灵敏度换算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款面向 FPS 玩家的鼠标灵敏度换算工具。eDPI（effective DPI，有效 DPI）= 鼠标 DPI × 游戏内灵敏度，是衡量「同一游戏内手感大小」的通行指标；
          但跨游戏比较时 eDPI 会失真，因为各游戏引擎的 yaw 常数不同——真正决定手感的是 360° 旋转距离：
          鼠标在垫子上滑动多少距离、角色恰好转身一圈。本页把两套口径都算给你：eDPI 大卡看同游戏横比，
          360° 距离（cm / inch 双显）看跨游戏手感，再用 yaw 口径互算任意两游戏的灵敏度。全部在浏览器本地完成，无网络请求，输入不会被保存或上传。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">eDPI 公式与 360° 距离公式</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          <li><strong class="text-foreground">eDPI</strong>：eDPI = DPI × 游戏内灵敏度（如 800 DPI × CS2 1.0 = 800 eDPI）。</li>
          <li><strong class="text-foreground">360° 距离（英寸）</strong>：360 ÷ (yaw × eDPI)；换算厘米再 ×2.54（1 in = 2.54 cm）。</li>
          <li><strong class="text-foreground">跨游戏换算</strong>：sens B = sens A × yaw A ÷ yaw B（前提：两游戏同一鼠标 DPI）。</li>
          <li>例：CS2 eDPI 800 → 360 ÷ (0.022 × 800) ≈ 20.45 英寸 ≈ 51.95 厘米。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">各游戏 yaw 常数与来源口径</h3>
        <p class="text-sm text-muted-foreground mb-3 leading-relaxed">
          yaw 是「每个鼠标 count 使视角转动多少度」的引擎常数，灵敏度换算与 360° 距离都建立在其上。本页采用社区换算工具通行口径：
        </p>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          <li><strong class="text-foreground">CS2 / CS:GO：0.022 °/count</strong> —— Source 引擎 m_yaw 默认值，Liquipedia 鼠标设置页与多数换算站一致。</li>
          <li><strong class="text-foreground">无畏契约 Valorant：0.07 °/count</strong> —— Riot 文档口径，各灵敏度换算站（Keymap 等）标注「Verified」的通行值。</li>
          <li><strong class="text-foreground">Apex 英雄：0.022 °/count</strong> —— 与 CS 系相同，源自 Source 系引擎传统。</li>
          <li><strong class="text-foreground">守望先锋 2：0.0066 °/count</strong> —— OW 系专用常数，SensLab、frameratetest 等换算站口径；因此 CS2 → OW2 要乘约 3.33 而不是 1:1。</li>
        </ul>
        <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
          注：社区偶有「Valorant 实际 yaw 并非恰好 0.07」的考据帖，但 0.07 是 Riot 文档口径与主流换算工具共同采用的标准值，按它换算即可与其他玩家对齐口径。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">如何使用本工具</h3>
        <ol class="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4">
          <li>填写鼠标 DPI（驱动与游戏内保持一致；常用 400 / 800 / 1600）。</li>
          <li>在各游戏行填入你当前的灵敏度，点击行把它选为「主游戏」。</li>
          <li>右侧看主游戏的 eDPI 与 360° 距离（cm / inch），判断手感大小是否合适。</li>
          <li>用互转双栏把灵敏度带到另一个游戏：改任意一侧，另一侧自动按 yaw 比例同步。</li>
          <li>对照职业 eDPI 区间与 cm/360 常见带，微调到自己的定位精度与转身速度平衡点。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">适用场景</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          <li>从 CS2 转战无畏契约 / Apex / OW2，想把手感原样带过去。</li>
          <li>换鼠标或改 DPI 后，想知道灵敏度该怎么等比重设。</li>
          <li>和朋友、队友、职业选手对齐「你用多少」——比 eDPI 更公平的是 cm/360。</li>
          <li>评估自己的灵敏度落在高速还是低速区间，决定要不要换更大的鼠标垫。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">eDPI 是什么，怎么计算？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              eDPI（有效 DPI）= 鼠标 DPI × 游戏内灵敏度。例如 800 DPI、CS2 灵敏度 1.0，就是 800 eDPI；同一游戏里，400 DPI × 2.0 与 800 DPI × 1.0 的 eDPI 相同、手感基本一致（仅引擎插值细节略有差别）。它是同游戏内交流手感的最低成本口径。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么 eDPI 不能跨游戏直接比较？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              因为各游戏 yaw 不同：同样是 eDPI 800，CS2（yaw 0.022）的 360° 距离约 51.95 cm，而无畏契约（yaw 0.07）只有约 16.33 cm——数字一样、手感天差地别。跨游戏请比较 360° 距离（cm/360），或直接用本页按 yaw 比例互算灵敏度。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">CS2 灵敏度 2.0 换到无畏契约是多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              同 DPI 下乘以 yaw 比例：2.0 × 0.022 ÷ 0.07 ≈ 0.6286。反向换算：无畏契约 0.5 → CS2 为 0.5 × 0.07 ÷ 0.022 ≈ 1.5909。换算后两游戏的 360° 距离完全相同，物理手感一致。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">职业选手一般用多少 eDPI？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              CS 系职业选手常见区间约 600–1200 eDPI（换算约 35–70 cm/360）：社区抽样平均 DPI ≈ 584、平均灵敏度 ≈ 1.69，平均 eDPI 约 990，约三分之二选手用 400 DPI。这是范围性统计口径，具体选手数值以 Liquipedia 鼠标设置页为准；休闲玩家按自己的定位精度与转身速度平衡来选即可。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">换算过去后为什么手感仍有一点差别？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              换算只保证 360° 距离一致；各游戏视野（FOV）、镜头畸变、引擎对鼠标输入的取整与采样、驱动加速设置等都会带来细微差别。先按换算值设置，再以 ±5% 幅度实机微调即可对齐。所有计算均在本页本地完成，输入不会被保存或上传。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'edpi-calculator'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Crosshair, Mouse, Gamepad2, ArrowLeftRight, Lightbulb,
  RefreshCw, ChevronUp, ChevronDown, TriangleAlert, CheckCircle
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'eDPI 灵敏度换算器 - CS2/无畏契约灵敏度互转与 360° 距离计算 | 有条工具',
  description: '免费在线 eDPI 计算器：鼠标 DPI × 游戏内灵敏度即时算 eDPI，CS2/无畏契约/Apex/OW2 按 yaw 口径互转灵敏度，360° 旋转距离 cm 与 inch 双显，职业选手常见区间参考，纯浏览器本地计算不上传',
  keywords: 'edpi计算,灵敏度换算,cs2灵敏度,无畏契约灵敏度,360度距离,cm360,apex灵敏度,ow2灵敏度',
  author: '有条工具',
  ogTitle: 'eDPI 灵敏度换算器 - CS2/无畏契约灵敏度互转 | 有条工具',
  ogDescription: 'DPI × 灵敏度即时算 eDPI，两游戏同手感互转，360° 旋转距离 cm/inch 双显，本地计算。',
  ogUrl: 'https://www.util.cn/tools/edpi-calculator',
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
          name: 'eDPI 灵敏度换算器',
          url: 'https://www.util.cn/tools/edpi-calculator',
          applicationCategory: 'GameApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['eDPI = DPI × 灵敏度即时计算', 'CS2/无畏契约/Apex/OW2 yaw 口径', '同手感跨游戏灵敏度互转', '360° 旋转距离 cm/inch 双显', '职业选手常见 eDPI 区间参考', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: 'eDPI 灵敏度换算器', item: 'https://www.util.cn/tools/edpi-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'eDPI 是什么，怎么计算？',
              acceptedAnswer: { '@type': 'Answer', text: 'eDPI（有效 DPI）= 鼠标 DPI × 游戏内灵敏度。例如 800 DPI、CS2 灵敏度 1.0，就是 800 eDPI；同一游戏里 400 DPI × 2.0 与 800 DPI × 1.0 的 eDPI 相同、手感基本一致。' }
            },
            {
              '@type': 'Question',
              name: '为什么 eDPI 不能跨游戏直接比较？',
              acceptedAnswer: { '@type': 'Answer', text: '各游戏 yaw 常数不同：同样是 eDPI 800，CS2（yaw 0.022）的 360° 距离约 51.95 cm，无畏契约（yaw 0.07）只有约 16.33 cm。跨游戏请比较 360° 距离（cm/360），或按 yaw 比例互算灵敏度。' }
            },
            {
              '@type': 'Question',
              name: 'CS2 灵敏度 2.0 换到无畏契约是多少？',
              acceptedAnswer: { '@type': 'Answer', text: '同 DPI 下 2.0 × 0.022 ÷ 0.07 ≈ 0.6286；反向：无畏契约 0.5 → CS2 为 0.5 × 0.07 ÷ 0.022 ≈ 1.5909。换算后两游戏 360° 距离完全相同。' }
            },
            {
              '@type': 'Question',
              name: '职业选手一般用多少 eDPI？',
              acceptedAnswer: { '@type': 'Answer', text: 'CS 系职业常见区间约 600–1200 eDPI（约 35–70 cm/360）：社区抽样平均 DPI ≈ 584、平均灵敏度 ≈ 1.69，平均 eDPI 约 990，约三分之二选手用 400 DPI。具体选手数值以 Liquipedia 鼠标设置页为准。' }
            },
            {
              '@type': 'Question',
              name: '换算过去后为什么手感仍有一点差别？',
              acceptedAnswer: { '@type': 'Answer', text: '换算只保证 360° 距离一致；各游戏 FOV、引擎取整采样与驱动设置会带来细微差别，先按换算值设置再以 ±5% 幅度实机微调即可。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 口径：eDPI = DPI × 游戏内灵敏度；360° 距离（英寸）= 360 / (yaw × eDPI)；跨游戏 sensB = sensA × yawA / yawB。
// yaw 值为社区换算工具通行口径：CS2 0.022（Source m_yaw 默认，Liquipedia）、Valorant 0.07（Riot 文档口径）、
// Apex 0.022、OW2 0.0066（SensLab / frameratetest 等换算站口径）。

const GAMES = [
  { id: 'cs2', name: 'CS2 / CS:GO', yaw: 0.022, yawNote: 'Source 引擎 m_yaw 默认值' },
  { id: 'valorant', name: '无畏契约 Valorant', yaw: 0.07, yawNote: 'Riot 文档口径' },
  { id: 'apex', name: 'Apex 英雄', yaw: 0.022, yawNote: '与 CS 系一致' },
  { id: 'ow2', name: '守望先锋 2', yaw: 0.0066, yawNote: 'OW 系引擎常数' }
]

// eDPI：DPI × 灵敏度；输入非正数 / 非数字返回 null
function edpiOf(dpi, sens) {
  const d = Number(dpi)
  const s = Number(sens)
  if (!Number.isFinite(d) || d <= 0 || !Number.isFinite(s) || s <= 0) return null
  return d * s
}

// 游戏 id → yaw（°/count）；未知返回 null
function yawOf(gameId) {
  const g = GAMES.find(x => x.id === gameId)
  return g ? g.yaw : null
}

// 跨游戏灵敏度换算：sensB = sensA × yawA / yawB；非法输入返回 null
function convertSens(sensA, yawA, yawB) {
  const s = Number(sensA)
  if (!Number.isFinite(s) || s <= 0 || !Number.isFinite(yawA) || yawA <= 0 || !Number.isFinite(yawB) || yawB <= 0) return null
  return (s * yawA) / yawB
}

// 360° 旋转距离（英寸）= 360 / (yaw × eDPI)；非法返回 null
function dist360InOf(yaw, edpi) {
  if (!Number.isFinite(yaw) || yaw <= 0 || !Number.isFinite(edpi) || edpi <= 0) return null
  return 360 / (yaw * edpi)
}

// 英寸 → 厘米（1 in = 2.54 cm）
function inToCm(inches) {
  if (!Number.isFinite(inches)) return null
  return inches * 2.54
}

// 数值格式化：保留 digits 位小数并去掉尾零；null / undefined / 空串 / 非数字返回 '—'
function fmtNum(x, digits = 2) {
  if (x === null || x === undefined || x === '') return '—'
  const v = Number(x)
  if (!Number.isFinite(v)) return '—'
  return String(parseFloat(v.toFixed(digits)))
}

// ---------- 响应式参数 ----------
const DPI_CHIPS = [400, 800, 1200, 1600, 3200]
const dpi = ref(800)
const selectedGameId = ref('cs2')
// 默认四行同为「同一手感」（CS2 800 DPI × 1.0 ≈ 51.95 cm/360 的等价灵敏度）
const sensByGame = reactive({ cs2: 1, valorant: 0.3143, apex: 1, ow2: 3.3333 })
const seoContentVisible = ref(true)

// ---------- 每游戏行计算 ----------
const gameRows = computed(() => GAMES.map((g) => {
  const sens = Number(sensByGame[g.id])
  const edpi = edpiOf(dpi.value, sens)
  const distIn = dist360InOf(g.yaw, edpi)
  return { ...g, sens, edpi, distIn, distCm: inToCm(distIn) }
}))

const mainRow = computed(() => gameRows.value.find(r => r.id === selectedGameId.value) || gameRows.value[0])

// 手感速评（范围性、带前提的描述）
const feelNote = computed(() => {
  const cm = mainRow.value && mainRow.value.distCm
  if (!Number.isFinite(cm)) return null
  if (cm < 30) return `${fmtNum(cm, 2)} cm：低于常见区间（30–70 cm）下沿，偏高速「手腕流」，近距离反应快、远距离定位更难稳。`
  if (cm <= 70) return `${fmtNum(cm, 2)} cm：落在多数 FPS 玩家与 CS 职业选手的常见区间（约 30–70 cm/360），兼顾定位与转身。`
  return `${fmtNum(cm, 2)} cm：高于常见区间上沿，偏低速「手臂流」，定位稳但转身幅度大，注意鼠标垫空间。`
})

// ---------- 互转双栏 ----------
const convGameAId = ref('cs2')
const convGameBId = ref('valorant')
const convSensA = ref(2)
const convSensB = ref(0.6286) // 2 × 0.022 / 0.07 ≈ 0.6286（4 位小数锚点）

function setConvGameA(v) { convGameAId.value = v; syncConvB() }
function setConvGameB(v) { convGameBId.value = v; syncConvA() }
function setConvSensA(raw) {
  convSensA.value = raw === '' ? null : Number(raw)
  syncConvB()
}
function setConvSensB(raw) {
  convSensB.value = raw === '' ? null : Number(raw)
  syncConvA()
}
function syncConvB() {
  const out = convertSens(convSensA.value, yawOf(convGameAId.value), yawOf(convGameBId.value))
  convSensB.value = out === null ? null : parseFloat(out.toFixed(4))
}
function syncConvA() {
  const out = convertSens(convSensB.value, yawOf(convGameBId.value), yawOf(convGameAId.value))
  convSensA.value = out === null ? null : parseFloat(out.toFixed(4))
}
function swapConv() {
  const g = convGameAId.value
  const s = convSensA.value
  convGameAId.value = convGameBId.value
  convSensA.value = convSensB.value
  convGameBId.value = g
  convSensB.value = s
}

const convEdpiA = computed(() => edpiOf(dpi.value, convSensA.value))
const convEdpiB = computed(() => edpiOf(dpi.value, convSensB.value))
const convIn360 = computed(() => dist360InOf(yawOf(convGameAId.value), convEdpiA.value))
const convCm360 = computed(() => inToCm(convIn360.value))

// ---------- 校验与交互 ----------
const validationIssues = computed(() => {
  const list = []
  const d = Number(dpi.value)
  if (!Number.isFinite(d) || d <= 0) list.push('鼠标 DPI 需为大于 0 的数值（常见 400 / 800 / 1600）')
  GAMES.forEach((g) => {
    const s = Number(sensByGame[g.id])
    if (!Number.isFinite(s) || s <= 0) list.push(`${g.name} 的灵敏度需为大于 0 的数值`)
  })
  return list
})

function resetAll() {
  dpi.value = 800
  selectedGameId.value = 'cs2'
  sensByGame.cs2 = 1
  sensByGame.valorant = 0.3143
  sensByGame.apex = 1
  sensByGame.ow2 = 3.3333
  convGameAId.value = 'cs2'
  convGameBId.value = 'valorant'
  convSensA.value = 2
  convSensB.value = 0.6286
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('edpi-calculator')
})
</script>
