<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Timer class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">HIIT 间歇计时器</h1>
          <p class="text-sm text-muted-foreground mt-1">Tabata / EMOM / 循环训练四阶段计时，阶段提示音与最后 3 秒倒计时，后台切走不漂移</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 HIIT 间歇计时器：按「准备 → 运动 → 休息 → 组间休息」四阶段把训练方案展开成精确到毫秒的时间线，
        内置 Tabata（20/10×8）、HIIT 常规（40/20×10）、EMOM（60/0×10）与 30 分钟循环四个预设，全部参数 5-600 秒可编辑；
        计时引擎基于 performance.now() 差值整段反推而非定时器逐步累加，切后台、锁屏、电脑卡顿都不会累积漂移；
        WebAudio 在浏览器本地合成阶段提示音与段尾倒计时哔，切后台时可选系统通知兜底；
        自定义方案命名保存在本机浏览器（最多 5 个），零上传、零第三方依赖。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：方案设置面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Info class="w-5 h-5 mr-2 text-primary" /> 方案设置
        </h2>

        <!-- 预设方案一键载入 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">快速选择预设</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="p in PRESET_META"
              :key="p.id"
              @click="loadPreset(p)"
              :disabled="running"
              class="px-3 py-2.5 rounded-lg border text-left transition disabled:opacity-50 disabled:cursor-not-allowed"
              :class="activePresetId === p.id ? 'border-primary bg-primary/10' : 'border-border bg-muted/40 hover:bg-muted/70'"
            >
              <span class="block text-sm font-semibold text-foreground">{{ p.name }}</span>
              <span class="block text-[10px] text-muted-foreground mt-0.5">总时长 {{ p.totalText }}</span>
              <span class="block text-[10px] text-muted-foreground/80 mt-0.5 leading-snug">{{ p.desc }}</span>
            </button>
          </div>
        </div>

        <!-- 全部参数编辑 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">方案参数</p>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label for="cfg-prepare" class="text-xs text-muted-foreground">准备时长（秒）</label>
              <input
                id="cfg-prepare"
                v-model.number="config.prepare"
                type="number"
                min="5" max="600" step="1"
                :disabled="running"
                class="w-full h-10 px-2.5 bg-background border border-border border-border rounded-lg text-sm font-bold text-foreground font-mono text-center disabled:opacity-50"
                @change="applyTimeField('prepare', 5)"
              />
            </div>
            <div class="space-y-1">
              <label for="cfg-work" class="text-xs text-muted-foreground">运动时长（秒）</label>
              <input
                id="cfg-work"
                v-model.number="config.work"
                type="number"
                min="5" max="600" step="1"
                :disabled="running"
                class="w-full h-10 px-2.5 bg-background border border-border border-border rounded-lg text-sm font-bold text-foreground font-mono text-center disabled:opacity-50"
                @change="applyTimeField('work', 5)"
              />
            </div>
            <div class="space-y-1">
              <label for="cfg-rest" class="text-xs text-muted-foreground">组内休息（秒）</label>
              <input
                id="cfg-rest"
                v-model.number="config.rest"
                type="number"
                min="0" max="600" step="1"
                :disabled="running"
                class="w-full h-10 px-2.5 bg-background border border-border border-border rounded-lg text-sm font-bold text-foreground font-mono text-center disabled:opacity-50"
                @change="applyTimeField('rest', 0)"
              />
            </div>
            <div class="space-y-1">
              <label for="cfg-sets" class="text-xs text-muted-foreground">组内轮数</label>
              <input
                id="cfg-sets"
                v-model.number="config.sets"
                type="number"
                min="1" max="50" step="1"
                :disabled="running"
                class="w-full h-10 px-2.5 bg-background border border-border border-border rounded-lg text-sm font-bold text-foreground font-mono text-center disabled:opacity-50"
                @change="applyCountField('sets', SETS_MAX)"
              />
            </div>
            <div class="space-y-1">
              <label for="cfg-rest-between" class="text-xs text-muted-foreground">组间休息（秒）</label>
              <input
                id="cfg-rest-between"
                v-model.number="config.restBetween"
                type="number"
                min="0" max="600" step="1"
                :disabled="running"
                class="w-full h-10 px-2.5 bg-background border border-border border-border rounded-lg text-sm font-bold text-foreground font-mono text-center disabled:opacity-50"
                @change="applyTimeField('restBetween', 0)"
              />
            </div>
            <div class="space-y-1">
              <label for="cfg-cycles" class="text-xs text-muted-foreground">循环组数</label>
              <input
                id="cfg-cycles"
                v-model.number="config.cycles"
                type="number"
                min="1" max="20" step="1"
                :disabled="running"
                class="w-full h-10 px-2.5 bg-background border border-border border-border rounded-lg text-sm font-bold text-foreground font-mono text-center disabled:opacity-50"
                @change="applyCountField('cycles', CYCLES_MAX)"
              />
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            口径：准备/运动/休息 5-600 秒（休息与组间休息可设 0 表示无，如 EMOM）；轮数 1-50、组数 1-20。
            结构为「准备 →（运动 → 休息）×轮数 → 组间休息 →（下一组）→ 结束」。运行中参数锁定；
            未运行时修改任意参数会把计时归位到起点重新开始。
          </p>
        </div>

        <!-- 提示音：音量 + 静音 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label for="volume-range" class="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Volume2 class="w-4 h-4 text-primary" /> 提示音音量
            </label>
            <span class="text-xs text-muted-foreground font-mono">{{ volume }}%</span>
          </div>
          <input
            id="volume-range"
            v-model.number="volume"
            type="range"
            min="0"
            max="100"
            step="1"
            class="w-full accent-primary"
          />
          <button
            @click="muted = !muted"
            class="w-full px-4 py-2 rounded-lg border text-sm font-medium transition flex items-center justify-center gap-2"
            :class="muted ? 'bg-muted border-border text-muted-foreground' : 'bg-primary/10 border-primary/40 text-primary'"
            :aria-pressed="muted"
          >
            <Volume2 class="w-4 h-4" />
            {{ muted ? '已静音（点击开启提示音）' : '提示音开启（点击静音）' }}
          </button>
          <p class="text-xs text-muted-foreground leading-relaxed">
            阶段提示音口径：运动开始 = 880Hz 双短哔，休息/组间 = 440Hz 单长哔，准备 = 660Hz 单短哔；
            每段最后 3 秒逐秒短哔（3/2/1），全部完成时三连上行音。声音由 WebAudio 实时合成，无音频文件。
          </p>
        </div>

        <!-- 后台系统通知（可选增强） -->
        <div v-if="notifySupported" class="space-y-2 p-3 bg-muted/40 border border-border rounded-lg">
          <p class="text-xs text-muted-foreground leading-relaxed">
            可选增强：切到后台标签页时，浏览器可能拦截网页声音。授权系统通知后，后台切段会弹出通知提醒（前台仍以提示音为准）。
          </p>
          <button
            v-if="notifyPermission !== 'granted'"
            @click="requestNotifyPermission"
            class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            开启后台系统通知
          </button>
          <p v-else class="text-xs text-green-600 flex items-center gap-1.5">
            <CheckCircle class="w-3.5 h-3.5 flex-shrink-0" />
            已开启：后台切段将以系统通知提醒
          </p>
          <p v-if="notifyPermission === 'denied'" class="text-xs text-muted-foreground">
            通知权限已被拒绝，可在浏览器地址栏站点设置中重新允许后刷新页面。
          </p>
        </div>

        <!-- 自定义方案：localStorage 保存 / 载入 / 删除 -->
        <div class="space-y-2">
          <label for="plan-name" class="text-sm font-medium text-foreground">自定义方案（本机保存，最多 5 个）</label>
          <div class="flex gap-2">
            <input
              id="plan-name"
              v-model="planName"
              type="text"
              maxlength="20"
              placeholder="方案名称，如：晚间燃脂"
              class="flex-1 min-w-0 h-10 px-2.5 bg-background border border-border border-border rounded-lg text-sm text-foreground"
              @keyup.enter="saveCurrentPlan"
            />
            <button
              @click="saveCurrentPlan"
              class="px-3 h-10 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-sm font-medium transition whitespace-nowrap"
            >
              保存当前
            </button>
          </div>
          <p v-if="planError" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ planError }}</span>
          </p>
          <p v-else-if="planOk" class="text-xs leading-relaxed p-2 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
            <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ planOk }}</span>
          </p>
          <ul v-if="savedPlans.length" class="space-y-1.5">
            <li
              v-for="(plan, i) in savedPlans"
              :key="plan.name + '-' + i"
              class="flex items-center gap-2 px-2.5 py-2 bg-muted/40 border border-border rounded-lg"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-foreground truncate">{{ plan.name }}</p>
                <p class="text-[10px] text-muted-foreground font-mono truncate">{{ planSummaryOf(plan.config) }}</p>
              </div>
              <button
                @click="loadPlan(plan)"
                :disabled="running"
                class="px-2.5 py-1 text-xs bg-primary/10 border border-primary/30 text-primary rounded hover:bg-primary/20 transition disabled:opacity-50"
              >
                载入
              </button>
              <button
                @click="deletePlan(i)"
                class="px-2.5 py-1 text-xs bg-muted border border-border text-muted-foreground rounded hover:bg-muted/80 transition"
              >
                删除
              </button>
            </li>
          </ul>
          <p v-else class="text-xs text-muted-foreground">
            还没有保存的方案：调好参数后命名保存，下次打开一键载入，数据只存在你的浏览器里。
          </p>
        </div>

        <!-- 热身提醒 -->
        <div class="flex items-start gap-2 p-3 rounded bg-amber-500/10 text-xs text-foreground leading-relaxed">
          <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>
            训练前先做 5-10 分钟动态热身（关节活动 + 低强度有氧），把心率与体温提上来再按开始；
            运动中若出现头晕、胸闷、关节刺痛，立即停止。全程保持呼吸节奏，不要憋气。
          </span>
        </div>
      </div>

      <!-- 右：大计时面板（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Timer class="w-5 h-5 mr-2 text-primary" /> 计时面板
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

        <!-- 大计时区：整区背景色随阶段（准备黄 / 运动绿 / 休息蓝 / 组间紫） -->
        <div
          class="relative h-[400px] rounded-xl border-2 transition-colors duration-300 flex flex-col items-center justify-center select-none overflow-hidden"
          :class="phaseMeta.area"
        >
          <p class="flex items-center gap-2 text-2xl font-bold tracking-[0.3em]" :class="phaseMeta.accent">
            <CheckCircle v-if="runState === 'finished'" class="w-7 h-7" />
            {{ phaseMeta.name }}
          </p>
          <p class="text-7xl sm:text-8xl font-bold font-mono tabular-nums leading-none mt-4" :class="phaseMeta.accent">
            {{ clockText }}
          </p>
          <p class="text-sm text-muted-foreground mt-4">{{ roundCycleText }}</p>
          <p class="text-xs text-muted-foreground/80 mt-1">{{ nextSegText }}</p>
          <!-- 总进度条 -->
          <div class="absolute bottom-5 inset-x-6 space-y-1.5">
            <div class="flex justify-between text-[10px] text-muted-foreground">
              <span>总进度 {{ progressPercent }}%</span>
              <span class="font-mono">{{ elapsedClock }} / {{ totalClock }}</span>
            </div>
            <div class="h-2.5 rounded-full bg-background/70 border border-border/60 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-150"
                :class="phaseMeta.bar"
                :style="{ width: progressPercent + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 操作：开始/暂停、跳过当前段、重置 -->
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
            @click="skipSegment"
            :disabled="finished"
            class="px-4 py-3.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-sm font-medium text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            跳过当前段
          </button>
          <button
            @click="resetTimer"
            class="px-4 py-3.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw class="w-4 h-4" /> 重置
          </button>
        </div>

        <p v-if="audioError" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ audioError }}</span>
        </p>

        <!-- 阶段时间线预览：静态条，色块长度 ∝ 段时长 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>方案结构预览（色块长度 ∝ 时长，描边高亮为当前段）</span>
            <span class="font-mono">总时长 {{ totalClock }}</span>
          </div>
          <div class="flex h-7 rounded-lg overflow-hidden border border-border bg-muted/30">
            <div
              v-for="blk in previewBlocks"
              :key="blk.key"
              class="min-w-[3px]"
              :class="[blk.color, blk.current ? 'ring-2 ring-inset ring-foreground/70' : 'opacity-75']"
              :style="{ flexGrow: blk.durMs, flexBasis: '0%' }"
              :title="blk.title"
            ></div>
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
            <span v-if="segmentCounts.prepare" class="flex items-center gap-1">
              <i class="w-2 h-2 rounded-sm inline-block bg-amber-400"></i>准备 ×{{ segmentCounts.prepare }}
            </span>
            <span v-if="segmentCounts.work" class="flex items-center gap-1">
              <i class="w-2 h-2 rounded-sm inline-block bg-green-500"></i>运动 ×{{ segmentCounts.work }}
            </span>
            <span v-if="segmentCounts.rest" class="flex items-center gap-1">
              <i class="w-2 h-2 rounded-sm inline-block bg-blue-500"></i>休息 ×{{ segmentCounts.rest }}
            </span>
            <span v-if="segmentCounts.restBetween" class="flex items-center gap-1">
              <i class="w-2 h-2 rounded-sm inline-block bg-purple-500"></i>组间休息 ×{{ segmentCounts.restBetween }}
            </span>
            <span>共 {{ timeline.length - 1 }} 段</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>HIIT 间歇计时器是什么？适合谁？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          HIIT（High-Intensity Interval Training，高强度间歇训练）把训练切成「全力运动 + 短休息」反复交替的循环，
          用更短的总时长换来接近甚至超过匀速有氧的消耗与心肺刺激。本工具把一个方案建模为四阶段时间线：
          准备（就位倒计时）→（运动 → 组内休息）× 轮数 → 组间休息 →（下一组）→ 结束，
          运行时按时间线精确切段，每段开始用不同音色的 WebAudio 提示音播报、段尾 3 秒逐秒倒计时，
          你只需要抬头看大字或听声音，不用一直盯着手表掐秒。
        </p>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground mb-4">
          <li>居家徒手训练：波比跳、开合跳、深蹲跳、登山跑等自重动作的间歇编排。</li>
          <li>跑步机 / 椭圆机 / 动感单车：冲刺与慢摇交替的变速有氧。</li>
          <li>Tabata 4 分钟快速燃脂：20 秒全力 + 10 秒休息 ×8 轮，碎片时间练心肺。</li>
          <li>力量房循环训练：多个动作按固定秒数轮换，组间休息自动掐表不摸鱼。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Tabata 的 20/10 口径来历</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          1996 年日本运动生理学家田畑泉（Izumi Tabata）在《Medicine &amp; Science in Sports &amp; Exercise》发表研究：
          让速度滑冰选手以「20 秒极限冲刺 + 10 秒休息」连续 8 轮、共 4 分钟为一个课表，每周训练数次，
          6 周后受试者的最大摄氧量与无氧能力同时显著提升——「20/10×8」从此成为 Tabata 协议的固定口径。
          需要注意：研究中的运动强度是约 170% 最大摄氧量的极限强度，普通训练者以中等强度按 20/10 练，
          得到的是「Tabata 形式」的间歇训练，效果接近高强度有氧，但与严格意义的 Tabata 研究结论并不等价。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">组间休息多久合适？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>以减脂、心肺刺激为主：组内休息 10-30 秒，保持心率在较高区间不回落太多。</li>
          <li>动作包含爆发或力量元素（跳跃、负重）：休息 40-90 秒，优先保证下一次的动作质量与安全。</li>
          <li>EMOM 类「每分钟整点开新动作」：休息=0，完成动作后剩余时间就是你的休息，节奏自调节。</li>
          <li>组间休息（完成一整组轮次之后）：建议 1-3 分钟，参考标准是心率大致回落到最大心率的 60%-65% 再开始下一组。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么网页计时器要防后台漂移？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一句话口径：浏览器会把后台标签页的 setInterval 节流到每秒 1 次甚至更久，若计时靠「每次回调累加一个固定步长」，
          节流期间少累加的步数就变成永久误差。本工具的引擎只在每次轮询时用 performance.now() 与起点的差值整段反推已耗时
          （elapsed = 冻结基准 + (now - 恢复时刻)），轮询频率只影响刷新密度、不影响时间基准；从后台回到前台时按时间线
          一次性大步定位到当前段并只对落点段发一声提示（不逐段补发错过的提示音），从机制上消除累计漂移。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">训练前热身提醒</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          正式按开始之前：先做 5-10 分钟动态热身（颈肩髋膝踝依次活动 + 1-2 分钟低强度有氧），微微出汗、心率略升再进入准备段；
          把音量调到训练位置能听清的程度，或提前授权系统通知；水、毛巾放在训练位一步之内；
          跳跃类动作建议铺垫子、穿缓震鞋保护膝踝。训练中注意呼吸节奏（发力呼气、还原吸气），
          出现头晕、胸闷、心悸或关节刺痛时立即停止，必要时就医——任何方案都应建立在你当前体能允许的前提下。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">Tabata 的 20/10 是什么意思？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              指每个循环「20 秒全力运动 + 10 秒休息」，连续 8 轮共 4 分钟，出自田畑泉 1996 年对速度滑冰选手的间歇研究；
              该研究使用的是约 170% 最大摄氧量的极限强度，普通训练者以中等强度按 20/10 练属于 Tabata 形式的间歇训练。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">组间休息多久合适？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              以减脂心肺为主休息 10-30 秒；含爆发或负重动作休息 40-90 秒保证动作质量；一整组轮次之间的组间休息建议 1-3 分钟，
              以心率回落到最大心率的 60%-65% 左右为参考。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">切到后台或锁屏后，计时和提醒还准吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              计时准：引擎按 performance.now() 与起点的真实时间差整段反推，浏览器后台节流只影响轮询频率、不累积误差，
              回到前台会按时间线直接定位到当前段。提醒方面，后台标签页的声音可能被浏览器拦截，
              建议点击「开启后台系统通知」，用系统通知兜底切段提醒。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">自定义方案保存在哪里？会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              保存在你本机浏览器的 localStorage 中（最多 5 个命名方案，可删除），不上传任何服务器；
              清除站点数据或使用隐私模式后保存的方案会消失，提示音与计时全部在浏览器本地完成。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'interval-timer'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Timer, Play, Pause, Volume2, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '间歇计时器 - 在线 HIIT/Tabata 训练计时工具',
  description: '免费在线 HIIT 间歇计时器：内置 Tabata 20/10、HIIT 常规、EMOM、循环训练四预设，准备/运动/休息/组间四阶段时间线精确切段，WebAudio 合成阶段提示音与最后 3 秒倒计时，performance.now 差值计时后台切走不漂移，可选系统通知，自定义方案本地保存，纯浏览器运行零上传',
  keywords: '间歇计时器,HIIT计时,tabata 计时器,训练计时,运动计时器',
  author: '有条工具',
  ogTitle: '间歇计时器 - 在线 HIIT/Tabata 训练计时工具 | 有条工具',
  ogDescription: '四阶段间歇计时引擎，Tabata/EMOM 预设一键载入，阶段提示音与倒计时哔，后台运行不漂移。',
  ogUrl: 'https://www.util.cn/tools/interval-timer',
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
          name: '间歇计时器（HIIT / Tabata）',
          url: 'https://www.util.cn/tools/interval-timer',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['准备/运动/休息/组间四阶段时间线引擎', 'Tabata、HIIT 常规、EMOM、循环训练四预设一键载入', '全部参数 5-600 秒可编辑（休息可为 0）', 'WebAudio 合成阶段提示音与最后 3 秒倒计时', 'performance.now 差值计时防后台节流漂移', '阶段时间线结构预览与总进度条', '自定义方案本地保存（最多 5 个）', '跳过当前段、系统通知后台提醒（可选）']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '健康工具', item: 'https://www.util.cn/health/' },
            { '@type': 'ListItem', position: 3, name: '间歇计时器', item: 'https://www.util.cn/tools/interval-timer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Tabata 的 20/10 是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '指每个循环「20 秒全力运动 + 10 秒休息」，连续 8 轮共 4 分钟，出自田畑泉 1996 年对速度滑冰选手的间歇研究；该研究使用约 170% 最大摄氧量的极限强度，普通训练者以中等强度按 20/10 练属于 Tabata 形式的间歇训练。' }
            },
            {
              '@type': 'Question',
              name: '组间休息多久合适？',
              acceptedAnswer: { '@type': 'Answer', text: '以减脂心肺为主休息 10-30 秒；含爆发或负重动作休息 40-90 秒保证动作质量；一整组轮次之间的组间休息建议 1-3 分钟，以心率回落到最大心率的 60%-65% 左右为参考。' }
            },
            {
              '@type': 'Question',
              name: '切到后台或锁屏后，计时和提醒还准吗？',
              acceptedAnswer: { '@type': 'Answer', text: '计时准：引擎按 performance.now() 与起点的真实时间差整段反推，浏览器后台节流只影响轮询频率、不累积误差，回到前台会按时间线直接定位到当前段。后台声音可能被拦截，可开启系统通知兜底切段提醒。' }
            },
            {
              '@type': 'Question',
              name: '自定义方案保存在哪里？会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '保存在本机浏览器的 localStorage 中（最多 5 个命名方案，可删除），不上传任何服务器；清除站点数据后保存的方案会消失，提示音与计时全部在浏览器本地完成。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const TIME_MIN_SEC = 5    // 准备/运动时长下限（秒）
const REST_MIN_SEC = 0    // 休息类时长下限：0 合法（EMOM 无休息）
const TIME_MAX_SEC = 600  // 所有时长上限（秒）
const SETS_MAX = 50       // 组内轮数上限
const CYCLES_MAX = 20     // 循环组数上限
const DEFAULT_CONFIG = { prepare: 10, work: 30, rest: 30, sets: 8, restBetween: 60, cycles: 1 }

// 整数收敛：非有限数回落 fallback，否则四舍五入并夹到 [min, max]
function clampIntOf(v, min, max, fallback) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

// 方案配置收敛：逐字段夹取到合法区间，非法输入回落默认值
function normalizeConfigOf(raw, fallback = DEFAULT_CONFIG) {
  const src = raw && typeof raw === 'object' ? raw : {}
  return {
    prepare: clampIntOf(src.prepare, TIME_MIN_SEC, TIME_MAX_SEC, fallback.prepare),
    work: clampIntOf(src.work, TIME_MIN_SEC, TIME_MAX_SEC, fallback.work),
    rest: clampIntOf(src.rest, REST_MIN_SEC, TIME_MAX_SEC, fallback.rest),
    sets: clampIntOf(src.sets, 1, SETS_MAX, fallback.sets),
    restBetween: clampIntOf(src.restBetween, REST_MIN_SEC, TIME_MAX_SEC, fallback.restBetween),
    cycles: clampIntOf(src.cycles, 1, CYCLES_MAX, fallback.cycles)
  }
}

// 训练方案 → 扁平时间线：prepare → [work → rest]×sets → restBetween（组与组之间）→ …×cycles → done。
// - done 为 0 长度结束标记段（startMs === endMs === 总时长），供 phaseAtOf 判定「已超尾」；
// - 时长 ≤0 的段直接跳过不生成（rest=0 合法，EMOM 即没有休息段）；
// - 相邻段首尾相接（seg[i].startMs === seg[i-1].endMs），总时长 = 所有实段之和 = done.startMs。
function buildTimeline(rawConfig) {
  const c = normalizeConfigOf(rawConfig)
  const segs = []
  let t = 0
  const push = (phase, cycle, set, seconds) => {
    const durMs = Math.round(seconds * 1000)
    if (durMs <= 0) return
    segs.push({ phase, cycle, set, startMs: t, endMs: t + durMs })
    t += durMs
  }
  push('prepare', 0, 0, c.prepare)
  for (let cycle = 1; cycle <= c.cycles; cycle++) {
    for (let set = 1; set <= c.sets; set++) {
      push('work', cycle, set, c.work)
      push('rest', cycle, set, c.rest)
    }
    // 组间休息只出现在两组之间（最后一组后直接进入 done）
    if (cycle < c.cycles) push('restBetween', cycle, c.sets, c.restBetween)
  }
  segs.push({ phase: 'done', cycle: c.cycles, set: c.sets, startMs: t, endMs: t })
  return segs
}

// 总时长 = 末段（done 标记）的 endMs，即所有实段时长之和
function totalMsOf(timeline) {
  if (!Array.isArray(timeline) || timeline.length === 0) return 0
  return timeline[timeline.length - 1].endMs
}

// 定位 elapsed 所在段：返回 { index, phase, remainingMs, seg }。
// 二分查找「startMs <= elapsed 的最后一个段」：段尾边界（elapsed === 段 endMs）归下一段；
// elapsed >= 总时长（含 done.startMs）落 done 标记段，remainingMs 收敛为 0；elapsed < 0 视为 0。
function phaseAtOf(timeline, elapsedMs) {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    return { index: -1, phase: 'done', remainingMs: 0, seg: null }
  }
  const t = Math.max(0, Number(elapsedMs) || 0)
  let lo = 0
  let hi = timeline.length - 1
  let ans = timeline.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (timeline[mid].startMs <= t) {
      ans = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  const seg = timeline[ans]
  return { index: ans, phase: seg.phase, remainingMs: Math.max(0, seg.endMs - t), seg }
}

// 总进度 [0,1]：total<=0 或 elapsed 越界时收敛到边界值
function progressOf(elapsedMs, totalMs) {
  if (!(totalMs > 0)) return 0
  const p = elapsedMs / totalMs
  return Math.min(1, Math.max(0, p))
}

function pad2Of(n) {
  return String(n).padStart(2, '0')
}

// 毫秒 → "mm:ss"（向上取整：剩余显示最后 1 秒不会提前归零；分钟数不设上限）
function formatClockOf(ms) {
  const totalSec = Math.max(0, Math.ceil((Number(ms) || 0) / 1000))
  const mm = Math.floor(totalSec / 60)
  const ss = totalSec % 60
  return `${pad2Of(mm)}:${pad2Of(ss)}`
}

// 静态方案表：id 固定用于高亮比对；rest=0 合法（EMOM 每分钟整点开新动作，无休息段）
function presetsOf() {
  return [
    {
      id: 'tabata',
      name: 'Tabata',
      desc: '20s 全力 + 10s 休息 ×8 轮（4 分钟经典）',
      config: { prepare: 10, work: 20, rest: 10, sets: 8, restBetween: 60, cycles: 1 }
    },
    {
      id: 'hiit40',
      name: 'HIIT 常规',
      desc: '40s 运动 + 20s 休息 ×10 轮',
      config: { prepare: 10, work: 40, rest: 20, sets: 10, restBetween: 60, cycles: 1 }
    },
    {
      id: 'emom',
      name: 'EMOM',
      desc: '每分钟 60s 动作 ×10 轮（休息 0）',
      config: { prepare: 10, work: 60, rest: 0, sets: 10, restBetween: 0, cycles: 1 }
    },
    {
      id: 'circuit30',
      name: '30 分钟循环',
      desc: '45s 运动 + 15s 休息 ×20 轮 ×2 组',
      config: { prepare: 10, work: 45, rest: 15, sets: 20, restBetween: 60, cycles: 2 }
    }
  ]
}

// 跳段定位：跳过当前段 = 前进到下一段起点；已在末段（done）时保持原位；index 非法回落首段
function nextIndexOf(timeline, index) {
  if (!Array.isArray(timeline) || timeline.length === 0) return -1
  if (index < 0) return 0
  return Math.min(index + 1, timeline.length - 1)
}

// ---------- 阶段展示元信息（纯静态表） ----------
const PHASE_META = {
  prepare: {
    name: '准备',
    accent: 'text-amber-600 dark:text-amber-400',
    area: 'bg-amber-500/10 border-amber-500/50',
    bar: 'bg-amber-500',
    block: 'bg-amber-400'
  },
  work: {
    name: '运动',
    accent: 'text-green-600 dark:text-green-400',
    area: 'bg-green-500/10 border-green-500/50',
    bar: 'bg-green-500',
    block: 'bg-green-500'
  },
  rest: {
    name: '休息',
    accent: 'text-blue-600 dark:text-blue-400',
    area: 'bg-blue-500/10 border-blue-500/50',
    bar: 'bg-blue-500',
    block: 'bg-blue-500'
  },
  restBetween: {
    name: '组间休息',
    accent: 'text-purple-600 dark:text-purple-400',
    area: 'bg-purple-500/10 border-purple-500/50',
    bar: 'bg-purple-500',
    block: 'bg-purple-500'
  },
  done: {
    name: '已完成',
    accent: 'text-green-600 dark:text-green-400',
    area: 'bg-green-500/10 border-green-500/50',
    bar: 'bg-green-500',
    block: 'bg-green-500'
  }
}

// 后台系统通知文案（按段类型；空串表示不发通知）
const NOTIFY_TEXT = {
  prepare: '准备开始，就位！',
  work: '运动开始，全力输出！',
  rest: '休息一下，调整呼吸',
  restBetween: '本组完成，组间休息开始'
}

// 运行状态徽标
const STATUS_META = {
  idle: { label: '未开始', cls: 'bg-muted border-border text-muted-foreground' },
  running: { label: '计时中', cls: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' },
  paused: { label: '已暂停', cls: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' },
  finished: { label: '已完成', cls: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' }
}

// ---------- 页面状态 ----------
const seoContentVisible = ref(true)
const config = reactive({ ...DEFAULT_CONFIG })
const audioError = ref('')
const volume = ref(80)
const muted = ref(false)
const planName = ref('')
const planError = ref('')
const planOk = ref('')
const savedPlans = ref([])
const notifySupported = ref(false)
const notifyPermission = ref('default')

// 预设静态元信息（一次性计算，非响应式）
const PRESET_META = presetsOf().map((p) => ({
  ...p,
  totalText: formatClockOf(totalMsOf(buildTimeline(p.config)))
}))

// 时间线与派生展示（配置变化即重建；运行中参数已锁定，不会中途换表）
const timeline = computed(() => buildTimeline({ ...config }))
const totalMs = computed(() => totalMsOf(timeline.value))
const currentInfo = computed(() => phaseAtOf(timeline.value, elapsedMs.value))
const phaseMeta = computed(() => PHASE_META[currentInfo.value.phase] || PHASE_META.done)
const clockText = computed(() => formatClockOf(currentInfo.value.remainingMs))
const elapsedClock = computed(() => formatClockOf(elapsedMs.value))
const totalClock = computed(() => formatClockOf(totalMs.value))
const progressPercent = computed(() => Math.round(progressOf(elapsedMs.value, totalMs.value) * 100))

// 轮次 / 组次文案（prepare 的 seg.set=0 表示「即将开始第 1 轮」）
const roundCycleText = computed(() => {
  const info = currentInfo.value
  const seg = info.seg
  if (!seg || info.phase === 'done') return `共 ${config.cycles} 组 × ${config.sets} 轮，全部完成`
  if (info.phase === 'prepare') return `即将开始 · 第 1 / ${config.sets} 轮 · 第 1 / ${config.cycles} 组`
  if (info.phase === 'restBetween') return `第 ${config.sets} / ${config.sets} 轮已完成 · 第 ${seg.cycle} / ${config.cycles} 组`
  return `本组第 ${seg.set} / ${config.sets} 轮 · 第 ${seg.cycle} / ${config.cycles} 组`
})

// 下一段预告
const nextSegText = computed(() => {
  const info = currentInfo.value
  if (info.phase === 'done') return ''
  const tl = timeline.value
  const next = tl[nextIndexOf(tl, info.index)]
  if (!next || next.phase === 'done') return '下一段：训练结束'
  const name = PHASE_META[next.phase].name
  const durText = formatClockOf(next.endMs - next.startMs)
  const who = next.phase === 'work' || next.phase === 'rest' ? `（第 ${next.set} / ${config.sets} 轮）` : ''
  return `下一段：${name} ${durText}${who}`
})

// 时间线预览色块：过滤 0 长度段（done / rest=0），宽度按时长比例伸展（flexGrow ∝ durMs）
const previewBlocks = computed(() =>
  timeline.value
    .map((seg, idx) => ({ seg, idx }))
    .filter((x) => x.seg.endMs > x.seg.startMs)
    .map((x) => ({
      key: x.idx,
      durMs: x.seg.endMs - x.seg.startMs,
      current: x.idx === currentInfo.value.index && currentInfo.value.phase !== 'done',
      color: PHASE_META[x.seg.phase].block,
      title: `${PHASE_META[x.seg.phase].name} ${formatClockOf(x.seg.endMs - x.seg.startMs)}${
        x.seg.phase === 'work' || x.seg.phase === 'rest' ? ` · 第 ${x.seg.set}/${config.sets} 轮` : ''
      }`
    }))
)

// 图例计数：各阶段实际生成的段数（0 长度段不计）
const segmentCounts = computed(() => {
  const c = normalizeConfigOf({ ...config })
  return {
    prepare: c.prepare > 0 ? 1 : 0,
    work: c.sets * c.cycles,
    rest: c.rest > 0 ? c.sets * c.cycles : 0,
    restBetween: c.restBetween > 0 ? c.cycles - 1 : 0
  }
})

// 当前配置命中的预设 id（用于预设卡高亮；自定义配置返回空）
const activePresetId = computed(() => {
  const cur = JSON.stringify(normalizeConfigOf({ ...config }))
  const hit = PRESET_META.find((p) => JSON.stringify(normalizeConfigOf(p.config)) === cur)
  return hit ? hit.id : ''
})

// 方案摘要（保存列表 / 载入按钮下方的一行说明）
function planSummaryOf(cfg) {
  const c = normalizeConfigOf(cfg)
  return `总 ${formatClockOf(totalMsOf(buildTimeline(c)))} · ${c.work}s 运动 / ${c.rest}s 休息 ×${c.sets} 轮 ×${c.cycles} 组`
}

// ---------- 计时引擎（performance.now() 差值反推，防后台节流漂移） ----------
// 为什么不用 setInterval 累加：后台标签页会把定时器节流到 ≥1s 一次，若每轮回调「elapsed += 100ms」，
// 节流期间少加的步数会永久丢失，几十分钟的长方案能慢出好几十秒（累计漂移）。
// 这里只把 100ms 轮询当「刷新泵」：每轮用真实时钟差整段反推 elapsed = baseElapsedMs + (now - runStartTs)，
// 时间基准永远正确；后台错过的段由 phaseAtOf 按 timeline 一次性大步定位（只对落点段发一声提示，
// 不逐段补发错过的提示音——口径见 syncState），从机制上消除漂移。
const TICK_MS = 100   // 前台轮询周期：100ms 刷新显示与提示音判定
const COUNTDOWN_S = 3 // 段尾倒计时哔秒数：3/2/1 各一短

let tickTimer = null    // setInterval 句柄
let runStartTs = 0      // 本次连续计时段的 performance.now() 起点
let baseElapsedMs = 0   // 暂停/跳段时冻结的已耗时（时间基准）
let lastSegIndex = -1   // 上次同步到的段下标（切段检测）
let lastCountSec = null // 上次已哔的倒计时秒数（同一秒不重复哔）

const running = ref(false)
const finished = ref(false)
const hasStarted = ref(false)
const elapsedMs = ref(0)

function currentElapsed() {
  return running.value ? baseElapsedMs + (performance.now() - runStartTs) : baseElapsedMs
}

// 把 elapsed 同步到响应式状态：切段 → 阶段提示音 + 后台通知；段尾 3 秒 → 逐秒倒计时哔。
// silent=true 时只推进状态不发声（暂停中跳段定位用），保证跳段不会连环响。
function syncState(el, silent) {
  elapsedMs.value = el
  const info = phaseAtOf(timeline.value, el)
  if (info.index !== lastSegIndex) {
    lastSegIndex = info.index
    lastCountSec = null
    if (info.seg.phase === 'done') {
      finishTimer(silent)
      return
    }
    if (!silent) {
      playPhaseCue(info.seg)
      pushNotification(NOTIFY_TEXT[info.seg.phase] || '')
    }
  }
  if (!silent && info.seg.phase !== 'done') {
    const secLeft = Math.ceil(info.remainingMs / 1000)
    if (secLeft >= 1 && secLeft <= COUNTDOWN_S && secLeft !== lastCountSec) {
      lastCountSec = secLeft
      playCountdownTick()
    }
  }
}

function tick() {
  if (!running.value) return
  syncState(baseElapsedMs + (performance.now() - runStartTs), false)
}

function startTimer() {
  if (finished.value) resetTimer() // 已完成后按开始 = 从头再练一轮
  // AudioContext 仅在用户手势回调中创建/恢复（SSR 与自动播放策略安全）
  const ctx = ensureAudio()
  if (!ctx) {
    audioError.value = '当前浏览器不支持 WebAudio，阶段提示音不可用；计时不受影响，仍将正常进行。'
  } else {
    audioError.value = ''
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    applyMasterGain()
  }
  runStartTs = performance.now()
  running.value = true
  finished.value = false
  hasStarted.value = true
  if (tickTimer === null) tickTimer = setInterval(tick, TICK_MS)
  tick() // 立即同步一次：开播瞬间即有准备段提示音与段状态
}

function pauseTimer() {
  if (!running.value) return
  baseElapsedMs = baseElapsedMs + (performance.now() - runStartTs) // 冻结已耗时，恢复时以此为基准
  elapsedMs.value = baseElapsedMs
  running.value = false
  if (tickTimer !== null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

function resetTimer() {
  running.value = false
  finished.value = false
  hasStarted.value = false
  if (tickTimer !== null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
  baseElapsedMs = 0
  runStartTs = 0
  elapsedMs.value = 0
  lastSegIndex = -1
  lastCountSec = null
}

// 跳过当前段：按时间线定位到下一段起点（含 done 标记段）
function skipSegment() {
  if (finished.value) return
  const tl = timeline.value
  const info = phaseAtOf(tl, currentElapsed())
  seekTo(tl[nextIndexOf(tl, info.index)].startMs)
}

function seekTo(ms) {
  hasStarted.value = true
  if (running.value) {
    baseElapsedMs = ms
    runStartTs = performance.now()
    tick() // 运行中跳段：立刻同步，落点段发一声提示
  } else {
    baseElapsedMs = ms
    syncState(ms, true) // 未开始/暂停中跳段：静默推进，不发声
  }
}

function toggleRun() {
  if (running.value) pauseTimer()
  else startTimer()
}

function finishTimer(silent) {
  running.value = false
  finished.value = true
  if (tickTimer !== null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
  baseElapsedMs = totalMsOf(timeline.value)
  elapsedMs.value = baseElapsedMs
  if (!silent) {
    playDoneCue()
    pushNotification('训练完成，辛苦了！')
  }
}

const runState = computed(() => {
  if (finished.value) return 'finished'
  if (running.value) return 'running'
  if (hasStarted.value) return 'paused'
  return 'idle'
})

const runButtonLabel = computed(() => {
  if (running.value) return '暂停'
  if (finished.value) return '再来一次'
  if (hasStarted.value) return '继续'
  return '开始训练'
})

// 参数编辑入口：时间字段（min 因字段而异，休息类允许 0）与计数字段分别收敛
function applyTimeField(field, min) {
  config[field] = clampIntOf(config[field], min, TIME_MAX_SEC, DEFAULT_CONFIG[field])
}

function applyCountField(field, max) {
  config[field] = clampIntOf(config[field], 1, max, DEFAULT_CONFIG[field])
}

function loadPreset(preset) {
  Object.assign(config, normalizeConfigOf(preset.config))
}

// 参数即方案：未运行时修改任意参数 / 载入预设或方案，把计时归位到起点（运行中输入已锁定）
watch(config, () => {
  if (!running.value) resetTimer()
})

// ---------- WebAudio 提示音（零依赖实时合成，仅用户回调 / tick 中触碰，SSR 安全） ----------
let audioCtx = null
let masterGain = null

function ensureAudio() {
  if (audioCtx) return audioCtx
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  audioCtx = new Ctx()
  masterGain = audioCtx.createGain()
  masterGain.connect(audioCtx.destination)
  applyMasterGain()
  return audioCtx
}

function applyMasterGain() {
  if (!masterGain) return
  const v = clampIntOf(volume.value, 0, 100, 80) / 100
  masterGain.gain.value = muted.value ? 0 : v
}

watch([volume, muted], applyMasterGain)

// 单个短音：振荡器 → 指数包络 → 主增益（peak 为峰值增益，type 为波形）
function beepAt(freq, startAt, durSec, peak, type = 'sine') {
  if (!audioCtx || !masterGain) return
  const osc = audioCtx.createOscillator()
  const env = audioCtx.createGain()
  osc.type = type
  osc.frequency.value = freq
  env.gain.setValueAtTime(0.001, startAt)
  env.gain.exponentialRampToValueAtTime(Math.max(0.002, peak), startAt + 0.01)
  env.gain.exponentialRampToValueAtTime(0.001, startAt + durSec)
  osc.connect(env)
  env.connect(masterGain)
  osc.start(startAt)
  osc.stop(startAt + durSec + 0.05)
}

// 阶段切换提示音：work=880Hz 双短哔；rest/restBetween=440Hz 单长哔；prepare=660Hz 单短哔
function playPhaseCue(seg) {
  if (!audioCtx || muted.value) return
  const t = audioCtx.currentTime + 0.02
  if (seg.phase === 'work') {
    beepAt(880, t, 0.09, 0.3, 'square')
    beepAt(880, t + 0.15, 0.09, 0.3, 'square')
  } else if (seg.phase === 'rest' || seg.phase === 'restBetween') {
    beepAt(440, t, 0.5, 0.5, 'sine')
  } else {
    beepAt(660, t, 0.15, 0.4, 'sine')
  }
}

// 段尾最后 3 秒倒计时：3/2/1 各一声短促高音（同一秒只哔一次，由 lastCountSec 去重）
function playCountdownTick() {
  if (!audioCtx || muted.value) return
  beepAt(1200, audioCtx.currentTime + 0.02, 0.06, 0.2, 'square')
}

// 结束：C5 → E5 → G5 三连上行音
function playDoneCue() {
  if (!audioCtx || muted.value) return
  const t = audioCtx.currentTime + 0.02
  beepAt(523.25, t, 0.18, 0.5, 'sine')
  beepAt(659.25, t + 0.2, 0.18, 0.5, 'sine')
  beepAt(783.99, t + 0.4, 0.3, 0.5, 'sine')
}

// ---------- 系统通知（可选增强，全程 try/catch，失败静默） ----------
async function requestNotifyPermission() {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      notifySupported.value = false
      return
    }
    const res = await Notification.requestPermission()
    notifyPermission.value = res
  } catch {
    notifyPermission.value = 'denied'
  }
}

// 只在页面不可见时发通知（前台以提示音为准），避免双重打扰
function pushNotification(body) {
  try {
    if (!body) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted' || !document.hidden) return
    const n = new Notification('HIIT 间歇计时器', { body, tag: 'interval-timer', silent: false })
    setTimeout(() => {
      try { n.close() } catch { /* 已自动关闭则忽略 */ }
    }, 8000)
  } catch {
    /* 通知构造失败时静默忽略 */
  }
}

// 页面可见性变化：回到前台立即同步一次（轮询恢复后按 timeline 大步跳段定位，不逐段补提示音）
function handleVisibilityChange() {
  if (running.value) tick()
}

// ---------- localStorage 方案持久化（最多 5 个命名方案，try/catch 兜底） ----------
const STORAGE_KEY = 'interval-timer-plans'
const MAX_SAVED_PLANS = 5

function persistPlans() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPlans.value))
  } catch {
    /* 写入失败（隐私模式 / 配额满）时静默忽略 */
  }
}

function loadSavedPlans() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return
    savedPlans.value = arr
      .filter((p) => p && typeof p.name === 'string' && p.config && typeof p.config === 'object')
      .slice(0, MAX_SAVED_PLANS)
      .map((p) => ({ name: p.name.slice(0, 20), config: normalizeConfigOf(p.config) }))
  } catch {
    /* 数据损坏时忽略，使用空列表 */
  }
}

function saveCurrentPlan() {
  planError.value = ''
  planOk.value = ''
  const name = planName.value.trim().slice(0, 20)
  if (!name) {
    planError.value = '请先在输入框填写方案名称（最多 20 字）。'
    return
  }
  const others = savedPlans.value.filter((p) => p.name !== name) // 同名覆盖更新
  if (others.length >= MAX_SAVED_PLANS) {
    planError.value = `最多保存 ${MAX_SAVED_PLANS} 个方案，请先删除不再需要的方案再保存。`
    return
  }
  savedPlans.value = [...others, { name, config: normalizeConfigOf({ ...config }) }]
  planName.value = ''
  planOk.value = `已保存「${name}」，可在下方一键载入。`
  persistPlans()
}

function loadPlan(plan) {
  Object.assign(config, plan.config)
  planError.value = ''
  planOk.value = `已载入「${plan.name}」。`
}

function deletePlan(index) {
  savedPlans.value = savedPlans.value.filter((_, i) => i !== index)
  persistPlans()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  loadSavedPlans()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  try {
    notifySupported.value = 'Notification' in window
    if (notifySupported.value) notifyPermission.value = Notification.permission
  } catch {
    notifySupported.value = false
  }
  addRecentTool('interval-timer')
})

onBeforeUnmount(() => {
  // 1) 停止 100ms 轮询计时器（clearInterval）
  if (tickTimer !== null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
  running.value = false
  // 2) 移除页面可见性监听
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  // 3) 关闭并释放 AudioContext（连带主 GainNode 引用置空）
  masterGain = null
  if (audioCtx) {
    try { audioCtx.close() } catch { /* 已关闭则忽略 */ }
    audioCtx = null
  }
})
</script>
