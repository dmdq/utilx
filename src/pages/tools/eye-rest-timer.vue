<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sun class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">护眼提醒器（20-20-20 法则）</h1>
          <p class="text-sm text-muted-foreground mt-1">工作 20 分钟提醒远眺 20 秒，内置 20-20-20 / 45-10 / 自定义循环，全屏休息遮罩与防漂移计时</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线护眼提醒器：把「工作一段 → 休息一段」的循环展开成精确到毫秒的时间线，工作段安静计时不刷屏，
        休息段进入时弹出全屏遮罩——半透明深色背景、看向 6 米外的大字提示、环形倒计时与双短哔提示音（可静音），
        休息结束自动进入下一轮并累计今日打卡；内置 20-20-20（20 分钟工作 + 20 秒远眺）与 45-10 两个预设，
        也可自定义工作 5-120 分钟、休息 5-60 分钟、固定 1-50 轮或无限循环。
        计时引擎基于 performance.now() 绝对差值反推，标签页切到后台被节流也不漂移；全部数据只存本机浏览器，零上传、零第三方依赖。
      </p>
    </div>

    <!-- 诚实边界说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-foreground leading-relaxed">
      <Info class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <span>提醒只在页面开着时工作——这是浏览器的边界（工具无法在后台弹窗打扰你）。标签页保留在后台时计时不漂移，回到前台会按实际时间补提醒。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：设置卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Info class="w-5 h-5 mr-2 text-primary" /> 提醒设置
        </h2>

        <!-- 模式预设 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">模式预设</p>
          <div class="space-y-2">
            <button
              v-for="preset in MODE_PRESETS"
              :key="preset.id"
              @click="selectMode(preset)"
              :disabled="running"
              class="w-full px-3 py-2.5 rounded-lg border text-left transition disabled:opacity-50 disabled:cursor-not-allowed"
              :class="modeId === preset.id ? 'border-primary bg-primary/10' : 'border-border bg-muted/40 hover:bg-muted/70'"
            >
              <span class="block text-sm font-semibold text-foreground">{{ preset.name }}</span>
              <span class="block text-[10px] text-muted-foreground mt-0.5 leading-snug">{{ preset.desc }}</span>
            </button>
          </div>
        </div>

        <!-- 自定义参数 -->
        <div v-if="modeId === 'custom'" class="space-y-3 p-3 bg-muted/40 border border-border rounded-lg">
          <p class="text-sm font-medium text-foreground">自定义参数</p>
          <div class="grid grid-cols-3 gap-2">
            <div class="space-y-1">
              <label for="cfg-work-min" class="text-xs text-muted-foreground">工作（分钟）</label>
              <input
                id="cfg-work-min"
                v-model.number="custom.workMin"
                type="number"
                min="5" max="120" step="1"
                :disabled="running"
                class="w-full h-10 px-2 bg-background border border-border border-border rounded-lg text-sm font-bold text-foreground font-mono text-center disabled:opacity-50"
                @change="applyCustomField('workMin')"
              />
            </div>
            <div class="space-y-1">
              <label for="cfg-rest-min" class="text-xs text-muted-foreground">休息（分钟）</label>
              <input
                id="cfg-rest-min"
                v-model.number="custom.restMin"
                type="number"
                min="5" max="60" step="1"
                :disabled="running"
                class="w-full h-10 px-2 bg-background border border-border border-border rounded-lg text-sm font-bold text-foreground font-mono text-center disabled:opacity-50"
                @change="applyCustomField('restMin')"
              />
            </div>
            <div class="space-y-1">
              <label for="cfg-cycles" class="text-xs text-muted-foreground">循环次数</label>
              <input
                id="cfg-cycles"
                v-model.number="custom.cycles"
                type="number"
                min="1" max="50" step="1"
                :disabled="running || custom.infinite"
                class="w-full h-10 px-2 bg-background border border-border border-border rounded-lg text-sm font-bold text-foreground font-mono text-center disabled:opacity-50"
                @change="applyCustomField('cycles')"
              />
            </div>
          </div>
          <button
            @click="custom.infinite = !custom.infinite"
            :disabled="running"
            class="w-full px-4 py-2 rounded-lg border text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
            :class="custom.infinite ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted border-border text-muted-foreground'"
            :aria-pressed="custom.infinite"
          >
            <RefreshCw class="w-4 h-4" />
            {{ custom.infinite ? '无限循环（直到手动停止）· 点击改为固定次数' : '固定循环次数 · 点击切换为无限循环' }}
          </button>
          <p class="text-xs text-muted-foreground leading-relaxed">
            口径：工作 5-120 分钟、休息 5-60 分钟、循环 1-50 次或无限；无限模式按 24 小时自动延展计划。
            运行中参数锁定；未运行时修改任意参数会把计时归位到起点重新开始。
          </p>
        </div>

        <!-- 声音开关 -->
        <div class="space-y-2">
          <button
            @click="soundOn = !soundOn"
            class="w-full px-4 py-2 rounded-lg border text-sm font-medium transition flex items-center justify-center gap-2"
            :class="soundOn ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted border-border text-muted-foreground'"
            :aria-pressed="soundOn"
          >
            <Bell class="w-4 h-4" />
            {{ soundOn ? '休息提示音开启（点击静音）' : '已静音（点击开启提示音）' }}
          </button>
          <p class="text-xs text-muted-foreground leading-relaxed">
            提示音口径：进入休息段时 660Hz 双短哔（WebAudio 实时合成，无音频文件）；工作段安静计时不打扰。
          </p>
        </div>

        <!-- 当前计划摘要 -->
        <div class="p-3 bg-muted/40 border border-border rounded-lg space-y-1">
          <p class="text-xs text-muted-foreground">当前计划</p>
          <p class="text-sm font-medium text-foreground">
            每轮：工作 {{ settings.workMin }} 分钟 + 休息 {{ restText }}
          </p>
          <p class="text-xs text-muted-foreground font-mono">
            {{ settings.infinite ? '无限循环（24 小时延展，手动停止）' : `${settings.cycles} 轮 · 计划总长 ${formatClockOf(totalMs)}` }}
          </p>
        </div>

        <!-- 清空今日统计 -->
        <div class="space-y-2">
          <button
            @click="clearTodayStats"
            class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <TriangleAlert class="w-4 h-4 text-muted-foreground" /> 清空今日统计
          </button>
          <p v-if="statsMsg" class="text-xs leading-relaxed p-2 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
            <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ statsMsg }}</span>
          </p>
        </div>
      </div>

      <!-- 右：当前状态主卡（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5 relative overflow-hidden">
        <!-- 顶部细进度条（当前段进度） -->
        <div class="absolute top-0 inset-x-0 h-1 bg-muted/60">
          <div
            class="h-full transition-all duration-200"
            :class="current.phase === 'rest' ? 'bg-emerald-500' : 'bg-primary'"
            :style="{ width: segProgressPct + '%' }"
          ></div>
        </div>

        <div class="flex items-center justify-between pt-1">
          <h2 class="text-lg font-semibold flex items-center">
            <Eye class="w-5 h-5 mr-2 text-primary" /> 当前状态
          </h2>
          <span
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium"
            :class="STATUS_META[runState].cls"
          >
            <CheckCircle v-if="runState === 'running' || runState === 'finished'" class="w-3.5 h-3.5" />
            <Info v-else class="w-3.5 h-3.5" />
            {{ STATUS_META[runState].label }}
          </span>
        </div>

        <!-- 大计时区：背景色随阶段（工作主色 / 休息绿 / 完成绿） -->
        <div
          class="rounded-xl border-2 transition-colors duration-300 flex flex-col items-center justify-center select-none py-8 px-4"
          :class="phaseAreaClass"
        >
          <p class="flex items-center gap-2 text-xl font-bold tracking-[0.2em]" :class="phaseAccentClass">
            <Eye class="w-5 h-5" />
            {{ phaseNameText }}
          </p>
          <p class="text-6xl sm:text-7xl font-bold font-mono tabular-nums leading-none mt-4" :class="phaseAccentClass">
            {{ clockText }}
          </p>
          <p class="text-sm text-muted-foreground mt-4">{{ cycleText }}</p>
          <p class="text-xs text-muted-foreground/80 mt-1">{{ nextSegText }}</p>
        </div>

        <!-- 今日统计两格 -->
        <div class="grid grid-cols-2 gap-3 text-center">
          <div class="bg-muted/50 rounded-lg p-4">
            <p class="text-xs text-muted-foreground mb-1">今日已完成轮次</p>
            <p class="text-2xl font-bold text-primary">{{ todayStats.cyclesDone }} 轮</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-4">
            <p class="text-xs text-muted-foreground mb-1">今日累计休息</p>
            <p class="text-2xl font-bold text-primary">{{ todayStats.restTakenMin }} 分钟</p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            @click="toggleRun"
            class="col-span-2 px-4 py-3.5 rounded-lg text-base font-semibold transition flex items-center justify-center gap-2"
            :class="running ? 'bg-muted hover:bg-muted/80 border border-border text-foreground' : 'bg-primary text-primary-foreground hover:opacity-90'"
          >
            <Pause v-if="running" class="w-5 h-5" />
            <Play v-else class="w-5 h-5" />
            {{ runButtonLabel }}
          </button>
          <button
            @click="requestSkipRest"
            :disabled="current.phase !== 'rest' || finished"
            class="px-4 py-3.5 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed border flex items-center justify-center gap-1.5"
            :class="skipArmed ? 'bg-red-500/10 border-red-500/40 text-red-600' : 'bg-muted hover:bg-muted/80 border-border text-foreground'"
          >
            <TriangleAlert v-if="skipArmed" class="w-4 h-4" />
            {{ skipArmed ? '确认跳过？（不记统计）' : '跳过休息' }}
          </button>
          <button
            @click="resetTimer"
            class="px-4 py-3.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw class="w-4 h-4" /> 重置
          </button>
        </div>

        <!-- 内联反馈条 -->
        <p v-if="welcomeMsg" class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
          <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ welcomeMsg }}</span>
        </p>
        <p v-if="audioError" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ audioError }}</span>
        </p>
        <p v-if="!hasStarted && !running" class="text-xs text-muted-foreground leading-relaxed">
          点「开始护眼循环」后进入安静工作段；到点会弹出全屏休息遮罩并响两声提示音，遮罩里跟着倒计时看远处即可。
        </p>

        <!-- 今日打卡时间线 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span class="font-medium text-foreground">今日打卡时间线</span>
            <span class="font-mono">{{ todayTimeline.length ? `共 ${todayTimeline.length} 次休息` : '暂无记录' }}</span>
          </div>
          <div v-if="todayTimeline.length" class="flex flex-wrap gap-2">
            <span
              v-for="item in todayTimeline"
              :key="item.key"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-mono bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
              :title="item.title"
            >
              <CheckCircle class="w-3 h-3" />
              {{ item.text }}
            </span>
          </div>
          <p v-else class="text-xs text-muted-foreground">
            完成一次休息段会在这里留下一个时刻点（本机保存、跨日自动重置），今天还没开始。
          </p>
        </div>
      </div>
    </div>

    <!-- 全屏休息遮罩 -->
    <div
      v-if="showRestOverlay"
      class="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center select-none px-6 text-center"
    >
      <p class="text-emerald-300 text-sm font-semibold tracking-[0.4em] mb-6 flex items-center gap-2">
        <Eye class="w-4 h-4" /> 休息中
      </p>
      <p class="text-white text-3xl sm:text-5xl font-bold leading-snug">
        看向 6 米外 {{ restText }}
      </p>
      <p class="text-white/60 text-sm mt-3 mb-8">{{ cycleText }} · 眨眨眼，放松肩颈</p>

      <!-- 环形倒计时（stroke-dashoffset 进度） -->
      <div class="relative w-64 h-64">
        <svg viewBox="0 0 280 280" class="w-full h-full -rotate-90">
          <circle cx="140" cy="140" r="110" fill="none" stroke-width="10" class="stroke-white/15" />
          <circle
            cx="140" cy="140" r="110" fill="none" stroke-width="10" stroke-linecap="round"
            class="stroke-emerald-400 transition-all duration-200"
            :stroke-dasharray="RING_C.toFixed(2)"
            :stroke-dashoffset="restRingOffset.toFixed(2)"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <p class="text-white text-5xl font-bold font-mono tabular-nums">{{ clockText }}</p>
          <p class="text-white/50 text-xs mt-2 font-mono">剩余时间</p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-3 mt-10">
        <button
          @click="requestSkipRest"
          class="px-5 py-2.5 rounded-lg text-sm font-medium border transition flex items-center gap-1.5"
          :class="skipArmed ? 'bg-red-500/20 border-red-400/50 text-red-200' : 'bg-white/10 border-white/25 text-white hover:bg-white/20'"
        >
          <TriangleAlert v-if="skipArmed" class="w-4 h-4" />
          {{ skipArmed ? '确认跳过本次休息？（不记统计）' : '跳过本次休息' }}
        </button>
        <p class="text-white/40 text-xs">休息结束将自动进入下一轮工作段</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>20-20-20 法则是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          20-20-20 是眼科与视光领域流传最广的用眼休息口诀：每近距离用眼约 20 分钟，抬头看向 20 英尺（约 6 米）以外的目标，
          持续至少 20 秒。看近时睫状肌需要持续收缩让晶状体变凸来对焦，长时间不放松就会积累调节紧张与酸胀感；
          6 米以外的距离已接近人眼的调节静息点，看向远处时睫状肌基本松弛，配合有意识地多眨眼，
          让泪膜重新铺匀，能在一定程度上缓解眼干、酸胀与聚焦迟缓。它不是治疗近视的方法，而是给高强度屏幕使用设定「强制喘息节奏」的行为工具。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么网页提醒器管不住后台标签页？（诚实边界）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          浏览器出于性能、隐私与防骚扰考虑，不允许网页在后台标签页弹窗或随意发出声音：后台标签页的定时器会被节流到每秒一次甚至更久，
          音频播放可能被拦截，全屏遮罩也只有页面在前台时才看得见。所以任何网页护眼提醒都只能覆盖「这个标签页开着」的时间。
          本工具的做法是把能做到的部分做扎实：计时引擎基于 performance.now() 与起点的真实时间差整段反推，
          节流只影响刷新密度、不影响时间基准，所以切走期间计时不漂移；回到前台时按时间线直接定位到当前段——
          休息到点就进遮罩，休息已经过完就轻提示「休息已结束，欢迎回来」并直接进入下一段工作。
          如果你需要跨应用的系统级提醒，请求助操作系统的提醒事项或专门的桌面 App。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">多久休息一次更有效？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          20 分钟一档源自口诀的传播便利，并非唯一最优解。视光与工效学文献里同样支持更长的节奏：
          多项研究把「连续用眼不超过 45-50 分钟、随后休息 5-10 分钟」作为对学生和办公室人群的推荐口径，
          这与课堂课时、番茄工作法的粒度也更吻合——频繁中断在深度工作场景里反而难以执行。
          结论是：与其纠结 20 还是 45，不如选一个你真能坚持的节奏。本工具内置 20-20-20 与 45-10 两个预设，
          并允许自定义工作 5-120 分钟、休息 5-60 分钟，先跑起来比选哪个数字更重要。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">闭眼和远眺哪个好？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两者放松的靶点不同，可以都做。远眺（看 6 米外）针对的是睫状肌——解除调节紧张，这是屏幕性视疲劳的主因；
          闭眼针对的是眼表——眨眼暂停时泪膜蒸发减缓，配合轻轻闭合让眼轮匝肌与眼球「停机」，对干涩更对症。
          短休息（20-30 秒）优先远眺，不中断手头节奏；长休息（几分钟）建议直接闭眼或离开屏幕。
          本工具休息遮罩里的「看向 6 米外」提示，你也可以替换成闭眼执行，计时同样有效。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">关于干眼与就医提醒</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一句话：专注盯屏时人的眨眼频率会降到平时的一半甚至更低，泪膜破裂加速，这是屏幕干眼的主要机制，有意识地多眨眼是成本最低的对策。
          若休息节奏调整一两周后仍持续眼干刺痛、视物模糊、畏光流泪，或伴头痛、看东西重影，请不要指望提醒器自愈——
          及时到眼科或正规视光门诊检查，排除干眼症、屈光问题或其他眼病。本工具是行为习惯辅助，不构成任何诊疗建议。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">20-20-20 法则是什么意思？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              每近距离用眼约 20 分钟，看向 20 英尺（约 6 米）以外 20 秒。看远时睫状肌从持续收缩的调节状态松弛下来，
              配合多眨眼让泪膜重新铺匀，缓解眼干酸胀。它是行为节奏工具，不能治疗近视。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">标签页切到后台了，提醒还有效吗？计时会不会不准？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              计时不会漂移：引擎按 performance.now() 与起点的真实时间差整段反推，浏览器节流只影响刷新密度。
              但遮罩和提示音只有页面在前台时才打扰得到你，这是浏览器的边界；回到前台会按实际时间补提醒，
              若休息已在后台过完，则轻提示「休息已结束，欢迎回来」并直接进入下一段工作。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">工作 45-50 分钟再休息，和 20 分钟一次哪个更科学？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              两种口径都有文献支持：20 分钟一档便于执行，45-50 分钟一档与课时、深度工作的节奏更契合。
              与其纠结数字，不如选一个能坚持的节奏——本工具两个预设都有，也可自定义工作 5-120 分钟、休息 5-60 分钟。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">统计数据和设置会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不会。模式、自定义参数与今日打卡记录都存在本机浏览器 localStorage 中（只保留最近 7 天，跨日自动重置当日统计），
              不发送任何网络请求；清除站点数据或使用隐私模式后记录会消失，随时可一键清空今日统计。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'eye-rest-timer'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Sun, Eye, Play, Pause, Bell, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '护眼提醒器 - 在线 20-20-20 法则眼睛休息提醒工具',
  description: '免费在线护眼提醒器：20-20-20 法则与 45-10 预设，工作段安静计时、休息段全屏遮罩倒计时与提示音，自定义工作 5-120 分钟与循环次数，performance.now 差值计时后台切走不漂移，今日打卡统计本机保存零上传',
  keywords: '护眼提醒,20 20 20 法则,眼睛疲劳,休息提醒,屏幕时间',
  author: '有条工具',
  ogTitle: '护眼提醒器 - 在线 20-20-20 法则眼睛休息提醒工具 | 有条工具',
  ogDescription: '20-20-20 法则护眼循环提醒：到点全屏遮罩带你远眺休息，后台计时不漂移，今日打卡本机统计。',
  ogUrl: 'https://www.util.cn/tools/eye-rest-timer',
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
          name: '护眼提醒器（20-20-20 法则）',
          url: 'https://www.util.cn/tools/eye-rest-timer',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['20-20-20 / 45-10 / 自定义三种循环模式', '工作段安静计时与顶部细进度条', '休息段全屏遮罩 + 环形倒计时 + WebAudio 提示音', 'performance.now 差值计时防后台节流漂移', '今日打卡时间线与累计休息统计（本机保存）', '跳过休息两段式确认', '无限循环或固定 1-50 轮']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '健康工具', item: 'https://www.util.cn/health/' },
            { '@type': 'ListItem', position: 3, name: '护眼提醒器', item: 'https://www.util.cn/tools/eye-rest-timer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '20-20-20 法则是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '每近距离用眼约 20 分钟，看向 20 英尺（约 6 米）以外 20 秒。看远时睫状肌从持续收缩的调节状态松弛下来，配合多眨眼让泪膜重新铺匀，缓解眼干酸胀。它是行为节奏工具，不能治疗近视。' }
            },
            {
              '@type': 'Question',
              name: '标签页切到后台了，提醒还有效吗？计时会不会不准？',
              acceptedAnswer: { '@type': 'Answer', text: '计时不会漂移：引擎按 performance.now() 与起点的真实时间差整段反推，浏览器节流只影响刷新密度。但遮罩和提示音只有页面在前台时才打扰得到你；回到前台会按实际时间补提醒，若休息已在后台过完，则轻提示「休息已结束，欢迎回来」并直接进入下一段工作。' }
            },
            {
              '@type': 'Question',
              name: '工作 45-50 分钟再休息，和 20 分钟一次哪个更科学？',
              acceptedAnswer: { '@type': 'Answer', text: '两种口径都有文献支持：20 分钟一档便于执行，45-50 分钟一档与课时、深度工作的节奏更契合。与其纠结数字，不如选一个能坚持的节奏——本工具两个预设都有，也可自定义工作 5-120 分钟、休息 5-60 分钟。' }
            },
            {
              '@type': 'Question',
              name: '统计数据和设置会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。模式、参数与打卡记录都存本机浏览器 localStorage（只保留最近 7 天，跨日自动重置当日统计），不发送任何网络请求，随时可一键清空今日统计。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const CUSTOM_WORK = { min: 5, max: 120, fallback: 20 }   // 自定义工作分钟区间
const CUSTOM_REST = { min: 5, max: 60, fallback: 10 }    // 自定义休息分钟区间
const CUSTOM_CYCLES = { min: 1, max: 50, fallback: 3 }   // 固定循环次数区间
const DAY_MS = 24 * 60 * 60 * 1000                       // 无限模式的计划延展地平线
const INFINITE_MAX_CYCLES = 1000                          // 无限模式的轮数硬上限（防超大数组）
const STATS_KEEP_DAYS = 7                                 // 打卡记录保留天数
const STATS_MAX_RECORDS = 500                             // 打卡记录条数上限

// 整数收敛：非有限数回落 fallback，否则四舍五入并夹到 [min, max]
function clampIntOf(v, min, max, fallback) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

// 数值收敛（允许小数）：非有限数回落 fallback，否则夹到 [min, max]
function clampNumOf(v, min, max, fallback) {
  const n = Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

// 自定义参数收敛：逐字段夹取到合法区间，非法输入回落默认值
function normalizeCustomOf(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  return {
    workMin: clampIntOf(src.workMin, CUSTOM_WORK.min, CUSTOM_WORK.max, CUSTOM_WORK.fallback),
    restMin: clampIntOf(src.restMin, CUSTOM_REST.min, CUSTOM_REST.max, CUSTOM_REST.fallback),
    cycles: clampIntOf(src.cycles, CUSTOM_CYCLES.min, CUSTOM_CYCLES.max, CUSTOM_CYCLES.fallback),
    infinite: src.infinite === true
  }
}

// 模式预设（纯常量）：restMin 可为小数（20 秒 = 20/60 分钟）；预设固定无限循环
const MODE_PRESETS = [
  { id: 'p202020', name: '20-20-20', desc: '工作 20 分钟 → 远眺休息 20 秒，经典口诀', workMin: 20, restMin: 20 / 60, infinite: true },
  { id: 'p4510', name: '45-10', desc: '工作 45 分钟 → 休息 10 分钟，课时级节奏', workMin: 45, restMin: 10, infinite: true },
  { id: 'custom', name: '自定义', desc: '工作 5-120 分钟 · 休息 5-60 分钟 · 1-50 轮或无限', workMin: 20, restMin: 10, infinite: false }
]

// 生效设置：预设直接取常量，自定义走 clamp；统一为 { workMin, restMin, cycles, infinite }
function effectiveSettingsOf(modeId, custom) {
  const preset = MODE_PRESETS.find((p) => p.id === modeId)
  if (preset && preset.id !== 'custom') {
    return { workMin: preset.workMin, restMin: preset.restMin, cycles: CUSTOM_CYCLES.fallback, infinite: preset.infinite }
  }
  const c = normalizeCustomOf(custom)
  return { workMin: c.workMin, restMin: c.restMin, cycles: c.cycles, infinite: c.infinite }
}

// 循环方案 → 扁平时间线：[工作 → 休息] × cycles。
// - workMin / restMin 单位为分钟（可为小数，内部按毫秒取整，20 秒 = 20000ms 精确）；
// - 仅当 infinite=true 或显式传 cycles=Infinity 时轮数自动延展到总时长覆盖 DAY_MS（上限 INFINITE_MAX_CYCLES）；
//   其余非法 cycles（NaN/负数/超上限）走 clamp，回落默认 3 轮；
// - 相邻段首尾相接（seg[i].startMs === seg[i-1].endMs）；0 长度段跳过；
// - 与 interval-timer 的时间线同构（二分定位、防漂移口径一致），但独立实现、无 done 哨兵段：
//   超出末段 endMs 由 phaseAtOf 直接判 done。
function buildCyclePlan(workMin, restMin, cycles, infinite = false) {
  const workMs = Math.max(0, Math.round(clampNumOf(workMin, 0, Infinity, 0) * 60000))
  const restMs = Math.max(0, Math.round(clampNumOf(restMin, 0, Infinity, 0) * 60000))
  const cycleDurMs = workMs + restMs
  if (cycleDurMs <= 0) return []
  let n
  if (infinite === true || cycles === Infinity) {
    n = Math.min(INFINITE_MAX_CYCLES, Math.max(1, Math.ceil(DAY_MS / cycleDurMs)))
  } else {
    n = clampIntOf(cycles, 1, CUSTOM_CYCLES.max, CUSTOM_CYCLES.fallback)
  }
  const plan = []
  let t = 0
  for (let i = 1; i <= n; i++) {
    if (workMs > 0) {
      plan.push({ phase: 'work', cycle: i, startMs: t, endMs: t + workMs })
      t += workMs
    }
    if (restMs > 0) {
      plan.push({ phase: 'rest', cycle: i, startMs: t, endMs: t + restMs })
      t += restMs
    }
  }
  return plan
}

// 总时长 = 末段 endMs（所有实段之和）
function totalMsOf(plan) {
  if (!Array.isArray(plan) || plan.length === 0) return 0
  return plan[plan.length - 1].endMs
}

// 定位 elapsed 所在段：返回 { phase, remainingMs, index }。
// - 二分查找「startMs <= elapsed 的最后一个段」，段尾边界（elapsed === endMs）归下一段；
// - elapsed >= 总时长（超尾）→ { phase: 'done', remainingMs: 0, index: plan.length }；
// - elapsed < 0 或非有限数视为 0；空计划返回 done/0/0。
function phaseAtOf(plan, elapsedMs) {
  if (!Array.isArray(plan) || plan.length === 0) {
    return { phase: 'done', remainingMs: 0, index: 0 }
  }
  const t = Math.max(0, Number(elapsedMs) || 0)
  if (t >= plan[plan.length - 1].endMs) {
    return { phase: 'done', remainingMs: 0, index: plan.length }
  }
  let lo = 0
  let hi = plan.length - 1
  let ans = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (plan[mid].startMs <= t) {
      ans = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  const seg = plan[ans]
  return { phase: seg.phase, remainingMs: seg.endMs - t, index: ans }
}

// 环形倒计时描边偏移：pct ∈ [0,100]（已过去进度，越界收敛），offset = C × (1 - pct/100)。
// pct=0 → C（整环留白），pct=100 → 0（整环描满）；circumference 非有限回落 0。
function ringDashOf(pct, circumference) {
  const p = clampNumOf(pct, 0, 100, 0)
  const c = clampNumOf(circumference, 0, Infinity, 0)
  return c * (1 - p / 100)
}

function pad2Of(n) {
  return String(n).padStart(2, '0')
}

// 本地日键：'YYYY-MM-DD'（跨日重置的判定口径）
function dayKeyOf(input) {
  const d = input instanceof Date ? input : new Date(Number(input) || Date.now())
  return `${d.getFullYear()}-${pad2Of(d.getMonth() + 1)}-${pad2Of(d.getDate())}`
}

// 今日统计：records = [{ day, restMin, tsMs }]，按 dayKey 过滤 → { cyclesDone, restTakenMin }（分钟，1 位小数）。
// 跨日记录不计入（当日自动「清零」），restMin 非法按 0 累加。
function todayStatsOf(records, dayKey) {
  const list = Array.isArray(records) ? records : []
  let cyclesDone = 0
  let sumMin = 0
  for (const r of list) {
    if (r && r.day === dayKey) {
      cyclesDone += 1
      sumMin += clampNumOf(r.restMin, 0, Infinity, 0)
    }
  }
  return { cyclesDone, restTakenMin: Math.round(sumMin * 10) / 10 }
}

// 毫秒 → "mm:ss"（向上取整：剩余显示最后 1 秒不会提前归零；分钟数不设上限，120 分钟显示 120:00）
function formatClockOf(ms) {
  const totalSec = Math.max(0, Math.ceil((Number(ms) || 0) / 1000))
  return `${pad2Of(Math.floor(totalSec / 60))}:${pad2Of(totalSec % 60)}`
}

// 休息时长文案：<60 秒显示秒，否则显示分钟
function restTextOf(restMin) {
  const sec = Math.round(clampNumOf(restMin, 0, Infinity, 0) * 60)
  return sec < 60 ? `${sec} 秒` : `${Math.round(sec / 60)} 分钟`
}

// 打卡记录裁剪：只保留最近 keepDays 天、最多 maxRecords 条（防 localStorage 膨胀）
function pruneRecordsOf(records, nowMs, keepDays = STATS_KEEP_DAYS, maxRecords = STATS_MAX_RECORDS) {
  const list = Array.isArray(records) ? records : []
  const cutoff = dayKeyOf(Number(nowMs) - (keepDays - 1) * DAY_MS)
  return list
    .filter((r) => r && typeof r.day === 'string' && r.day >= cutoff && Number.isFinite(r.tsMs))
    .slice(-maxRecords)
}

// 段内进度 [0,100]：done / 空段 / 非法时长收敛到边界
function segProgressOf(seg, elapsedMs) {
  if (!seg) return 0
  const dur = seg.endMs - seg.startMs
  if (!(dur > 0)) return 0
  return Math.min(100, Math.max(0, (((Number(elapsedMs) || 0) - seg.startMs) / dur) * 100))
}

// ---------- 展示常量（纯静态表） ----------
const STATUS_META = {
  idle: { label: '未开始', cls: 'bg-muted border-border text-muted-foreground' },
  running: { label: '护眼中', cls: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' },
  paused: { label: '已暂停', cls: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' },
  finished: { label: '全部完成', cls: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' }
}

const PHASE_AREA = {
  work: { name: '专注工作', accent: 'text-primary', area: 'bg-primary/10 border-primary/40' },
  rest: { name: '远眺休息', accent: 'text-emerald-600 dark:text-emerald-400', area: 'bg-emerald-500/10 border-emerald-500/50' },
  done: { name: '计划完成', accent: 'text-emerald-600 dark:text-emerald-400', area: 'bg-emerald-500/10 border-emerald-500/50' }
}

const RING_R = 110                                  // 遮罩环形倒计时半径
const RING_C = 2 * Math.PI * RING_R                 // 周长：stroke-dasharray 基准

// ---------- 页面状态 ----------
const seoContentVisible = ref(true)
const modeId = ref('p202020')
const custom = reactive({ workMin: 20, restMin: 10, cycles: 3, infinite: false })
const soundOn = ref(true)
const audioError = ref('')
const welcomeMsg = ref('')
const statsMsg = ref('')
const statsRecords = ref([])

const settings = computed(() => effectiveSettingsOf(modeId.value, custom))
const plan = computed(() => buildCyclePlan(settings.value.workMin, settings.value.restMin, settings.value.cycles, settings.value.infinite))
const totalMs = computed(() => totalMsOf(plan.value))
const elapsedMs = ref(0)
const current = computed(() => phaseAtOf(plan.value, elapsedMs.value))
const currentSeg = computed(() => {
  const idx = current.value.index
  return idx >= 0 && idx < plan.value.length ? plan.value[idx] : null
})

const restText = computed(() => restTextOf(settings.value.restMin))
const clockText = computed(() => formatClockOf(current.value.remainingMs))
const phaseMeta = computed(() => PHASE_AREA[current.value.phase] || PHASE_AREA.done)
const phaseNameText = computed(() => phaseMeta.value.name)
const phaseAccentClass = computed(() => phaseMeta.value.accent)
const phaseAreaClass = computed(() => phaseMeta.value.area)
const segProgressPct = computed(() => segProgressOf(currentSeg.value, elapsedMs.value))
const restRingOffset = computed(() => ringDashOf(segProgressPct.value, RING_C))
const showRestOverlay = computed(() => current.value.phase === 'rest' && hasStarted.value && !finished.value)

const cycleText = computed(() => {
  const c = current.value
  if (c.phase === 'done') return settings.value.infinite ? '今日计划已全部走完' : `${settings.value.cycles} 轮全部完成`
  const seg = currentSeg.value
  const suffix = settings.value.infinite ? '（无限循环）' : ` / ${settings.value.cycles}`
  return seg ? `第 ${seg.cycle}${suffix} 轮` : ''
})

const nextSegText = computed(() => {
  const c = current.value
  const idx = c.index
  if (c.phase === 'done' || idx + 1 >= plan.value.length) {
    return settings.value.infinite ? '按计划继续，直到你按下停止' : '下一段：循环结束'
  }
  const next = plan.value[idx + 1]
  const name = next.phase === 'work' ? '工作' : '休息'
  return `下一段：${name} ${formatClockOf(next.endMs - next.startMs)}`
})

// 今日统计与时间线（records 变化即重算；跨日由 dayKey 过滤自然「重置」）
const todayStats = computed(() => todayStatsOf(statsRecords.value, dayKeyOf(Date.now())))
const todayTimeline = computed(() => {
  const key = dayKeyOf(Date.now())
  return statsRecords.value
    .filter((r) => r.day === key)
    .slice(-40)
    .map((r, i) => {
      const d = new Date(r.tsMs)
      return {
        key: `${r.tsMs}-${i}`,
        text: `${pad2Of(d.getHours())}:${pad2Of(d.getMinutes())}`,
        title: `第 ${i + 1} 次休息完成于 ${pad2Of(d.getHours())}:${pad2Of(d.getMinutes())}（${restTextOf(r.restMin)}）`
      }
    })
})

// ---------- 计时引擎（performance.now() 绝对差值反推，防后台节流漂移） ----------
// 与 interval-timer 同口径：轮询只是「刷新泵」，每轮用真实时钟差整段反推
// elapsed = baseElapsedMs + (now - runStartTs)；后台错过的段由 phaseAtOf 一次性大步定位，
// 从机制上消除 setInterval 节流带来的累计漂移。
const TICK_MS = 250 // 前台刷新周期：工作段 250ms 足够平滑，休息段环形进度同频

let tickTimer = null       // setInterval 句柄
let skipArmTimer = null    // 跳过休息两段式确认的自动解除 timeout
let welcomeTimer = null    // 「欢迎回来」轻提示的自动消失 timeout
let statsMsgTimer = null   // 「已清空统计」反馈的自动消失 timeout
let runStartTs = 0         // 本次连续计时段的 performance.now() 起点
let baseElapsedMs = 0      // 暂停/跳段时冻结的已耗时（时间基准）
let lastSegIndex = -1      // 上次同步到的段下标（切段检测）
let wasRestWhenHidden = false // 页面隐藏瞬间是否处于休息段
let skipRecordExempt = -1  // 本次切段中免于记统计的休息段下标（跳过休息用）

const running = ref(false)
const finished = ref(false)
const hasStarted = ref(false)
const skipArmed = ref(false)

function currentElapsed() {
  return running.value ? baseElapsedMs + (performance.now() - runStartTs) : baseElapsedMs
}

// 完成一次自然结束的休息段：记一条打卡（跨日由 todayStatsOf 过滤，无需手动清零）
function recordRestDone() {
  const nowMs = Date.now()
  const rec = { day: dayKeyOf(nowMs), restMin: settings.value.restMin, tsMs: nowMs }
  statsRecords.value = pruneRecordsOf(statsRecords.value.concat(rec), nowMs)
  persistStats()
}

// 把 elapsed 同步到响应式状态：切段 → 检测完成的休息段记打卡、进入休息发提示音、越过末段收尾。
// silent=true 只推进状态不发声（暂停中跳段定位）；skipIdx 免于记统计（跳过休息）。
function syncState(el, silent = false, skipIdx = -1) {
  elapsedMs.value = el
  const info = phaseAtOf(plan.value, el)
  if (info.index === lastSegIndex) return
  const prev = lastSegIndex
  lastSegIndex = info.index
  // 跨越了 (prev, index] 之间的段：其中「整段被跨过且已收尾」的休息段算自然完成
  if (prev >= 0 && !silent) {
    for (let i = prev; i < info.index && i < plan.value.length; i++) {
      if (plan.value[i].phase === 'rest' && plan.value[i].endMs <= el && i !== skipIdx) {
        recordRestDone()
      }
    }
  }
  if (info.phase === 'done') {
    finishTimer(silent)
    return
  }
  if (!silent && info.phase === 'rest' && plan.value[info.index].startMs <= el) {
    playRestBeep() // 进入休息段：双短哔（后台可能被浏览器拦截，属已知边界）
  }
}

function tick() {
  if (!running.value) return
  syncState(baseElapsedMs + (performance.now() - runStartTs))
}

function startTimer() {
  if (finished.value) resetTimer() // 已完成后按开始 = 从头再走一轮
  // AudioContext 仅在用户手势回调中创建/恢复（SSR 与自动播放策略安全）
  const ctx = ensureAudio()
  if (!ctx) {
    audioError.value = '当前浏览器不支持 WebAudio，休息提示音不可用；遮罩与计时不受影响，仍将正常进行。'
  } else {
    audioError.value = ''
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  }
  runStartTs = performance.now()
  running.value = true
  finished.value = false
  hasStarted.value = true
  if (tickTimer === null) tickTimer = setInterval(tick, TICK_MS)
  tick() // 立即同步一次：开播瞬间即有段状态
}

function pauseTimer() {
  if (!running.value) return
  baseElapsedMs = baseElapsedMs + (performance.now() - runStartTs) // 冻结已耗时，恢复时以此为基准
  elapsedMs.value = baseElapsedMs
  running.value = false
  stopTick()
  disarmSkip()
}

function stopTick() {
  if (tickTimer !== null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

function resetTimer() {
  running.value = false
  finished.value = false
  hasStarted.value = false
  stopTick()
  disarmSkip()
  baseElapsedMs = 0
  runStartTs = 0
  elapsedMs.value = 0
  lastSegIndex = -1
}

// 跳到目标毫秒：运行中立即同步（落点段照常处理），暂停/未开始静默推进
function seekTo(ms, silent, skipIdx = -1) {
  hasStarted.value = true
  if (running.value) {
    baseElapsedMs = ms
    runStartTs = performance.now()
    syncState(ms, silent === true, skipIdx)
  } else {
    baseElapsedMs = ms
    syncState(ms, true, skipIdx)
  }
}

// 跳过休息：两段式确认（第一次点击武装 5 秒，第二次真跳；本次休息不计入统计）
function requestSkipRest() {
  if (finished.value) return
  const info = phaseAtOf(plan.value, currentElapsed())
  if (info.phase !== 'rest') return
  if (!skipArmed.value) {
    skipArmed.value = true
    skipArmTimer = setTimeout(disarmSkip, 5000)
    return
  }
  disarmSkip()
  const restIdx = info.index
  const nextIdx = restIdx + 1
  const target = nextIdx < plan.value.length ? plan.value[nextIdx].startMs : totalMsOf(plan.value)
  seekTo(target, false, restIdx)
}

function disarmSkip() {
  if (skipArmTimer !== null) {
    clearTimeout(skipArmTimer)
    skipArmTimer = null
  }
  skipArmed.value = false
}

function finishTimer(silent) {
  running.value = false
  finished.value = true
  stopTick()
  disarmSkip()
  baseElapsedMs = totalMsOf(plan.value)
  elapsedMs.value = baseElapsedMs
  if (!silent && plan.value.length > 0) playRestBeep() // 全部完成：再来一声双短哔收尾
}

function toggleRun() {
  if (running.value) pauseTimer()
  else startTimer()
}

const runState = computed(() => {
  if (finished.value) return 'finished'
  if (running.value) return 'running'
  if (hasStarted.value) return 'paused'
  return 'idle'
})

const runButtonLabel = computed(() => {
  if (running.value) return '暂停'
  if (finished.value) return '再来一轮'
  if (hasStarted.value) return '继续'
  return '开始护眼循环'
})

// ---------- 设置交互 ----------
function selectMode(preset) {
  modeId.value = preset.id
}

function applyCustomField(field) {
  const spec = field === 'workMin' ? CUSTOM_WORK : field === 'restMin' ? CUSTOM_REST : CUSTOM_CYCLES
  custom[field] = clampIntOf(custom[field], spec.min, spec.max, spec.fallback)
}

// 参数即方案：未运行时修改任意参数 / 切换模式，把计时归位到起点（运行中输入已锁定）
watch([modeId, custom], () => {
  if (!running.value) resetTimer()
  persistSettings()
})

function showWelcome() {
  welcomeMsg.value = '休息已结束，欢迎回来——已按实际时间直接进入工作段。'
  if (welcomeTimer !== null) clearTimeout(welcomeTimer)
  welcomeTimer = setTimeout(() => {
    welcomeMsg.value = ''
    welcomeTimer = null
  }, 6000)
}

function clearTodayStats() {
  const key = dayKeyOf(Date.now())
  const before = statsRecords.value.length
  statsRecords.value = statsRecords.value.filter((r) => r.day !== key)
  persistStats()
  const removed = before - statsRecords.value.length
  statsMsg.value = removed > 0 ? `已清空今日 ${removed} 条打卡记录（往日记录保留）。` : '今日还没有打卡记录。'
  if (statsMsgTimer !== null) clearTimeout(statsMsgTimer)
  statsMsgTimer = setTimeout(() => {
    statsMsg.value = ''
    statsMsgTimer = null
  }, 4000)
}

// ---------- WebAudio 提示音（零依赖实时合成，仅在用户手势回调 / tick 中触碰，SSR 安全） ----------
let audioCtx = null
let masterGain = null

function ensureAudio() {
  if (audioCtx) return audioCtx
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  audioCtx = new Ctx()
  masterGain = audioCtx.createGain()
  masterGain.gain.value = 0.8
  masterGain.connect(audioCtx.destination)
  return audioCtx
}

function beepAt(freq, startAt, durSec, peak) {
  if (!audioCtx || !masterGain) return
  const osc = audioCtx.createOscillator()
  const env = audioCtx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  env.gain.setValueAtTime(0.001, startAt)
  env.gain.exponentialRampToValueAtTime(Math.max(0.002, peak), startAt + 0.01)
  env.gain.exponentialRampToValueAtTime(0.001, startAt + durSec)
  osc.connect(env)
  env.connect(masterGain)
  osc.start(startAt)
  osc.stop(startAt + durSec + 0.05)
}

// 进入休息：660Hz 双短哔（约 0.12s × 2，间隔 0.2s）
function playRestBeep() {
  if (!audioCtx || !soundOn.value) return
  const t = audioCtx.currentTime + 0.02
  beepAt(660, t, 0.12, 0.4)
  beepAt(660, t + 0.2, 0.12, 0.4)
}

// ---------- 页面可见性：回前台按真实时间补同步；休息已在后台过完则轻提示 ----------
function handleVisibilityChange() {
  if (typeof document === 'undefined') return
  if (document.hidden) {
    wasRestWhenHidden = running.value && phaseAtOf(plan.value, currentElapsed()).phase === 'rest'
    return
  }
  const hadRestInFlight = wasRestWhenHidden
  wasRestWhenHidden = false
  if (!running.value) return
  const info = phaseAtOf(plan.value, currentElapsed())
  syncState(baseElapsedMs + (performance.now() - runStartTs))
  if (hadRestInFlight && info.phase !== 'rest' && hasStarted.value) {
    showWelcome()
  }
}

// ---------- localStorage（设置 + 今日统计；读写全程 try/catch，读只在 onMounted） ----------
const SETTINGS_KEY = 'eye-rest-timer-settings'
const STATS_KEY = 'eye-rest-timer-stats'

function persistSettings() {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ modeId: modeId.value, custom: { ...custom }, soundOn: soundOn.value })
    )
  } catch {
    /* 写入失败（隐私模式 / 配额满）时静默忽略 */
  }
}

function persistStats() {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STATS_KEY, JSON.stringify(statsRecords.value))
  } catch {
    /* 写入失败时静默忽略 */
  }
}

watch(soundOn, persistSettings)

function loadSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) return
    const s = JSON.parse(raw)
    if (!s || typeof s !== 'object') return
    if (MODE_PRESETS.some((p) => p.id === s.modeId)) modeId.value = s.modeId
    Object.assign(custom, normalizeCustomOf(s.custom))
    soundOn.value = s.soundOn !== false
  } catch {
    /* 数据损坏时忽略，使用默认设置 */
  }
}

function loadStats() {
  try {
    const raw = window.localStorage.getItem(STATS_KEY)
    if (!raw) return
    const arr = JSON.parse(raw)
    statsRecords.value = pruneRecordsOf(Array.isArray(arr) ? arr : [], Date.now())
  } catch {
    /* 数据损坏时忽略，使用空记录 */
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  loadSettings()
  loadStats()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  addRecentTool('eye-rest-timer')
})

onBeforeUnmount(() => {
  // 1) 停止 250ms 轮询计时器（clearInterval）
  stopTick()
  running.value = false
  // 2) 解除跳过休息两段式确认的 timeout
  if (skipArmTimer !== null) {
    clearTimeout(skipArmTimer)
    skipArmTimer = null
  }
  // 3) 清除「欢迎回来」轻提示的 timeout
  if (welcomeTimer !== null) {
    clearTimeout(welcomeTimer)
    welcomeTimer = null
  }
  // 3b) 清除「已清空统计」反馈的 timeout
  if (statsMsgTimer !== null) {
    clearTimeout(statsMsgTimer)
    statsMsgTimer = null
  }
  // 4) 移除页面可见性监听
  if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', handleVisibilityChange)
  // 5) 关闭并释放 AudioContext（主增益引用置空）
  masterGain = null
  if (audioCtx) {
    try { audioCtx.close() } catch { /* 已关闭则忽略 */ }
    audioCtx = null
  }
})
</script>
