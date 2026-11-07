<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BookOpen class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">阅读速度测试</h1>
          <p class="text-sm text-muted-foreground mt-1">中文按字计速（字/分钟），结合理解度换算有效速度，历史成绩本地留存</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线中文阅读速度测试工具：粘贴一篇文章（建议 500-2000 字）或选用内置科普短文，点击「开始阅读」后正文隐藏、计时开始，读完点「我读完了」；
        内置短文配套 3 道理解题，自贴文本用 1-5 星自评理解度。结果给出阅读速度（字/分钟，汉字口径）、理解度系数（5 星 = 100%）、
        有效速度 = 速度 × 理解系数，并对照中文成人阅读水平区间（平均默读约 300-500 字/分钟）给出训练建议；历史成绩以纯 SVG 折线本地保存，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <p class="flex items-start gap-2 text-xs leading-relaxed bg-primary/10 border border-primary/20 text-foreground rounded-lg p-3 mb-6">
      <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span>测试口径：以「开始阅读」到「我读完了」的真实间隔计时，正文阅读期间会隐藏，请按平时默读节奏读，不要跳读也不要回读。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左栏：准备与设置 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 第一步 · 准备文本
          </h2>

          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="switchSource('sample')"
              :disabled="phase !== 'prep'"
              class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              :class="sourceMode === 'sample' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            >内置示例短文</button>
            <button
              @click="switchSource('custom')"
              :disabled="phase !== 'prep'"
              class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              :class="sourceMode === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            >自贴文章</button>
          </div>

          <!-- 内置示例选择 -->
          <div v-if="sourceMode === 'sample'" class="space-y-1.5">
            <button
              v-for="(s, idx) in BUILTIN_SAMPLES"
              :key="s.id"
              @click="sampleIndex = idx"
              :disabled="phase !== 'prep'"
              class="w-full text-left px-3 py-2 rounded-lg text-xs transition-all border disabled:cursor-not-allowed"
              :class="sampleIndex === idx
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border hover:border-primary/40 hover:bg-muted/30 text-muted-foreground'"
            >
              <span class="font-medium">{{ s.title }}</span>
              <span class="ml-1 text-muted-foreground">约 {{ countCharsOf(s.text) }} 字 · 配 3 道理解题</span>
            </button>
            <button
              @click="randomSample"
              :disabled="phase !== 'prep'"
              class="w-full px-3 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition disabled:cursor-not-allowed"
            >
              <Shuffle class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 随机取一段站内示例文本
            </button>
          </div>

          <!-- 自贴文本 -->
          <div v-else>
            <textarea
              v-model="customText"
              rows="8"
              :disabled="phase !== 'prep'"
              placeholder="粘贴一段 500-2000 字的文章（去除多余空行效果更好），科普、新闻、散文均可"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
            ></textarea>
            <p class="text-xs text-muted-foreground mt-1">
              当前 {{ customCount }} 字{{ customCount > 0 && (customCount < 500 || customCount > 2000) ? ' · 建议控制在 500-2000 字之间' : '' }}
            </p>
          </div>

          <div class="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground">
            本次测试文本：<span class="text-foreground font-medium">{{ activeTitle }}</span> · {{ activeCount }} 字
          </div>

          <button
            @click="startReading"
            :disabled="phase === 'reading' || activeCount < MIN_CHARS"
            class="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
          >
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 开始阅读
          </button>
          <p v-if="activeCount < MIN_CHARS" class="text-xs text-red-500/90">文本至少需要 {{ MIN_CHARS }} 字才能开始计时测试</p>
        </div>

        <!-- 历史记录 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <TrendingUp class="w-5 h-5 mr-2 text-primary" /> 历史有效速度
            </h2>
            <template v-if="history.length">
              <button
                v-if="confirmClearHistory"
                @click="clearHistory"
                class="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition"
              >确认清空</button>
              <button
                v-else
                @click="confirmClearHistory = true"
                class="px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted text-xs text-muted-foreground transition"
              >清空记录</button>
            </template>
          </div>

          <div v-if="history.length >= 2">
            <svg viewBox="0 0 300 120" class="w-full h-32" role="img" aria-label="历史有效速度折线图">
              <line x1="16" y1="104" x2="284" y2="104" stroke="currentColor" class="text-border" stroke-width="1" />
              <polyline
                :points="chart.points"
                fill="none"
                stroke="currentColor"
                class="text-primary"
                stroke-width="2"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
              <circle
                v-for="(dot, i) in chart.dots"
                :key="i"
                :cx="dot.x"
                :cy="dot.y"
                r="3"
                fill="currentColor"
                class="text-primary"
              />
            </svg>
            <p class="text-[10px] text-muted-foreground text-center mt-1">最近 {{ chart.dots.length }} 次测试的有效速度（字/分钟）</p>
          </div>

          <div v-if="history.length" class="space-y-1.5 max-h-56 overflow-y-auto">
            <div
              v-for="(rec, i) in history"
              :key="rec.ts"
              class="flex items-center gap-2 text-xs bg-muted/50 rounded-lg px-3 py-2"
            >
              <span class="text-muted-foreground w-20 flex-shrink-0">{{ rec.date }}</span>
              <span class="text-foreground font-medium tabular-nums">{{ rec.wpm }} 字/分</span>
              <span class="text-muted-foreground">理解 {{ Math.round(rec.coeff * 100) }}%</span>
              <span class="ml-auto text-primary font-medium tabular-nums">{{ rec.effective }}</span>
              <button
                @click="removeRecord(i)"
                class="text-muted-foreground hover:text-red-500 transition"
                aria-label="删除这条记录"
              ><X class="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <p v-else class="text-xs text-muted-foreground text-center py-3">暂无记录，完成第一次测试后自动保存（最多保留 50 条）。</p>
        </div>
      </div>

      <!-- 右栏：阅读区与结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 阅读区 -->
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <BookOpen class="w-5 h-5 mr-2 text-primary" /> 第二步 · 计时默读
            </h2>
            <span
              class="text-xs px-2 py-1 rounded-full"
              :class="phase === 'reading' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'"
            >
              {{ phase === 'reading' ? '阅读中（正文已隐藏）' : phase === 'quiz' ? '待自评理解度' : '准备就绪' }}
            </span>
          </div>

          <div class="p-6">
            <!-- 准备阶段：预览 -->
            <template v-if="phase === 'prep'">
              <div v-if="activeCount" class="max-h-72 overflow-y-auto bg-muted/30 border border-border rounded-lg p-4 text-base leading-loose text-foreground whitespace-pre-wrap">
                {{ activeText }}
              </div>
              <div v-else class="py-10 text-center text-sm text-muted-foreground">
                选择一篇内置示例短文，或粘贴自己的文章，然后点「开始阅读」。
              </div>
              <p class="text-xs text-muted-foreground mt-3">
                预览仅供确认内容（不代表真实阅读时长）；点击「开始阅读」后正文会隐藏并开始计时，读完点「我读完了」。
              </p>
            </template>

            <!-- 阅读阶段：隐藏正文，显示计时 -->
            <template v-else-if="phase === 'reading'">
              <div class="py-10 text-center">
                <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                  <EyeOff class="w-8 h-8 text-primary" />
                </div>
                <p class="text-4xl font-bold text-foreground font-mono tabular-nums mb-2">{{ elapsedText }}</p>
                <p class="text-sm text-muted-foreground mb-6">正文已隐藏，请开始默读（实时速度 ≈ {{ liveSpeed }} 字/分钟）</p>
                <button
                  @click="finishReading"
                  class="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-base font-medium transition"
                >
                  <CheckCircle class="w-5 h-5 inline mr-2 -mt-0.5" /> 我读完了
                </button>
                <button
                  @click="abortReading"
                  class="ml-2 px-4 py-3 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-sm transition"
                >放弃本次</button>
              </div>
            </template>

            <!-- 理解度自评 -->
            <template v-else>
              <div class="bg-muted/50 rounded-xl p-4 mb-4">
                <p class="text-sm text-muted-foreground">
                  用时 <span class="text-foreground font-medium">{{ readSeconds }} 秒</span> ·
                  文本 <span class="text-foreground font-medium">{{ activeCount }} 字</span> ·
                  先回答理解度，再出成绩
                </p>
              </div>

              <!-- 内置短文：3 道选择题 -->
              <div v-if="sourceMode === 'sample' && activeSample" class="space-y-5">
                <div v-for="(q, qi) in activeSample.questions" :key="qi">
                  <p class="text-sm font-medium text-foreground mb-2">{{ qi + 1 }}. {{ q.q }}</p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <button
                      v-for="(opt, oi) in q.options"
                      :key="oi"
                      @click="quizAnswers[qi] = oi"
                      class="text-left px-3 py-2 rounded-lg text-xs border transition"
                      :class="quizAnswers[qi] === oi
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/40'"
                    >{{ String.fromCharCode(65 + oi) }}. {{ opt }}</button>
                  </div>
                </div>
                <button
                  @click="submitQuiz"
                  class="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
                >
                  <CheckCircle class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 提交答案，查看成绩
                </button>
              </div>

              <!-- 自贴文本：1-5 星自评 -->
              <div v-else class="space-y-4">
                <p class="text-sm text-foreground">自评理解度：这篇文章你读懂了几成？</p>
                <div class="flex items-center gap-2">
                  <button
                    v-for="s in 5"
                    :key="s"
                    @click="stars = s"
                    class="p-1 transition"
                    :aria-label="`${s} 星`"
                  >
                    <Star
                      class="w-8 h-8"
                      :class="s <= stars ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/40'"
                    />
                  </button>
                  <span class="ml-2 text-sm text-muted-foreground">{{ starsText }}</span>
                </div>
                <button
                  @click="submitQuiz"
                  :disabled="stars === 0"
                  class="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                >
                  <CheckCircle class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 提交自评，查看成绩
                </button>
              </div>
            </template>
          </div>
        </div>

        <!-- 成绩卡 -->
        <div v-if="result" class="bg-card border border-primary rounded-lg p-6 space-y-5">
          <div class="flex items-center gap-2">
            <CheckCircle class="w-5 h-5 text-primary" />
            <h2 class="text-lg font-semibold text-foreground">第三步 · 测试成绩</h2>
            <span class="text-xs text-muted-foreground">已存入历史记录</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-3xl font-bold text-foreground font-mono tabular-nums">{{ result.wpm }}</p>
              <p class="text-xs text-muted-foreground mt-1">阅读速度（字/分钟）</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-3xl font-bold text-foreground font-mono tabular-nums">{{ Math.round(result.coeff * 100) }}%</p>
              <p class="text-xs text-muted-foreground mt-1">理解度系数</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-3xl font-bold text-primary font-mono tabular-nums">{{ result.effective }}</p>
              <p class="text-xs text-muted-foreground mt-1">有效速度</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-3xl font-bold text-foreground font-mono tabular-nums">{{ result.seconds }}</p>
              <p class="text-xs text-muted-foreground mt-1">用时（秒）</p>
            </div>
          </div>

          <!-- 建议卡 -->
          <div class="p-4 rounded-lg border" :class="result.coeff < 0.6 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-primary/10 border-primary/30'">
            <p class="text-sm font-medium" :class="result.coeff < 0.6 ? 'text-amber-600' : 'text-foreground'">
              <Info class="w-4 h-4 inline mr-1.5 -mt-0.5" />{{ result.advice }}
            </p>
          </div>

          <!-- 水平对照表 -->
          <div>
            <p class="text-sm font-medium text-foreground mb-2">中文阅读水平对照（字/分钟）</p>
            <div class="overflow-x-auto border border-border rounded-lg">
              <table class="w-full text-xs">
                <thead>
                  <tr class="bg-muted text-left">
                    <th class="px-3 py-2 font-medium text-foreground whitespace-nowrap">区间</th>
                    <th class="px-3 py-2 font-medium text-foreground whitespace-nowrap">速度</th>
                    <th class="px-3 py-2 font-medium text-foreground">说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(lv, i) in LEVELS"
                    :key="lv.name"
                    :class="[
                      'border-t border-border',
                      i === result.levelIndex ? 'bg-primary/5 font-medium' : ''
                    ]"
                  >
                    <td class="px-3 py-2 text-foreground whitespace-nowrap">
                      {{ lv.name }}<span v-if="i === result.levelIndex" class="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-primary text-primary-foreground">你在这里</span>
                    </td>
                    <td class="px-3 py-2 text-muted-foreground whitespace-nowrap tabular-nums">{{ lv.rangeText }}</td>
                    <td class="px-3 py-2 text-muted-foreground">{{ lv.desc }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-[11px] text-muted-foreground mt-2">
              区间来源：综合公开认知心理学教材（如王甬、汪安圣《认知心理学》）与中文阅读速度研究的常见口径整理——成人平均默读约 300-500 字/分钟、精读约 200-300、快速略读约 600-800；均为约数，非严格标准，仅供粗略对照。
            </p>
          </div>

          <button
            @click="resetAll"
            class="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-sm font-medium transition"
          >
            <RotateCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 再测一次
          </button>
        </div>

        <div v-if="!result && phase !== 'reading' && phase !== 'quiz'" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 测试流程与计分规则
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 第一步选文本（内置短文约 600 字、配理解题；自贴文本建议 500-2000 字）</li>
            <li>• 第二步点「开始阅读」，正文隐藏并计时，读完点「我读完了」——按真实间隔计时</li>
            <li>• 第三步评理解度：内置短文答 3 道选择题，自贴文本打 1-5 星</li>
            <li>• 阅读速度 = 字数 ÷ 用时（分钟），汉字口径；有效速度 = 阅读速度 × 理解度系数（5 星 = 100%）</li>
            <li>• 理解度不足三星会建议降速：没有理解支撑的速度没有意义</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12 no-print">
      <summary class="text-xl font-bold text-foreground cursor-pointer select-none flex items-center">
        <span class="text-primary mr-2">#</span> 阅读速度怎么测才准？WPM 口径与速读法（FAQ）
      </summary>

      <div class="mt-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          阅读速度测试是一款纯本地的中文阅读测速工具。它把「读了多快」和「读懂了多少」合并成一个指标：先以真实间隔计时测出
          阅读速度（字/分钟，汉字口径），再通过理解题或星级自评得到理解度系数（5 星 = 100%），两者相乘得到有效速度——
          一分钟扫过 800 字但只读懂一半，有效速度不过 400，并不比稳稳读懂 400 字更快。历史成绩保存在本机浏览器并绘制折线，方便观察训练效果。
        </p>

        <h3 class="text-lg font-semibold text-foreground">WPM 的中英文口径差异</h3>
        <p>
          英文阅读速度惯用 WPM（Words Per Minute，词/分钟），因为英文以词为天然单位，成人平均阅读约 200-250 WPM；
          中文则以「字」为单位，习惯说「字/分钟」，成人平均默读约 300-500 字/分钟。两者不能直接比大小——
          一个英文词平均约含 5 个字符，折算信息量也不与汉字一一对应。网上有些工具把中文的字数直接标成 WPM，
          容易让人误以为中文阅读慢了一半；本工具明确采用汉字口径，标签写「字/分钟」，不与英文 WPM 混用。
        </p>

        <h3 class="text-lg font-semibold text-foreground">速读法简介：提速先提质</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">按意群读，不逐字读</span>：把「的、了、是」交给余光，视线在词组和短语上停顿，每行停留次数从 5-6 次降到 2-3 次。</li>
          <li><span class="text-foreground font-medium">减少回读</span>：回读是最大的隐形减速，用手指或笔尖引导视线向前，能有效压住「往回看」的冲动。</li>
          <li><span class="text-foreground font-medium">压住默念</span>：心里逐字念出声是慢读的根源，练习时提醒自己「看意思，不读音」。</li>
          <li><span class="text-foreground font-medium">分层阅读</span>：先读标题、首尾段建立框架，再决定哪些段精读、哪些段扫过——速读的本意是分配注意力，不是处处快。</li>
        </ul>
        <p>
          提醒一句：速读只适合信息密度低的材料（新闻、资讯、找资料），教材、论文、合同该慢就慢。
          每次提速后先用本工具的理解题验一下，理解度掉到三星以下就退回来。
        </p>

        <h2 class="text-2xl font-bold text-foreground pt-2">常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h4 class="text-base font-semibold text-foreground">为什么阅读时要把正文藏起来？</h4>
            <p class="mt-1">
              计时测试的心理暗示会让人不自觉地加速「扫完」，把正文隐藏、只留计时器，是为了让你按平时真实的默读节奏读完，
              而不是表演速读。读完立刻点「我读完了」，间隔以毫秒计，误差可以忽略。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">自贴文本没有理解题，结果可信吗？</h4>
            <p class="mt-1">
              自评会有主观偏差，所以用「有效速度」兜底：5 星自评才按 100% 计入，评得越保守折得越多。
              想要客观口径，可以选内置短文——它配有 3 道理解题，答对几题得几成系数。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">成绩会保存吗？存在哪里？</h4>
            <p class="mt-1">
              每次完成测试自动存入本机浏览器的 localStorage（最多 50 条），折线图展示最近的有效速度走势；
              清除浏览器数据会清空记录，数据不上传、不同步设备。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">多少字/分钟算快？</h4>
            <p class="mt-1">
              一般难度中文材料，成人平均默读约 300-500 字/分钟；200-300 属精读区间（教材、深度文章的正常速度）；
              600-800 已是快速略读，能抓住要点即可。想练输入端的手速，可以去 <a href="/tools/typing-test/" class="text-primary hover:underline">打字速度测试</a> 测一下每分钟能敲多少字。
            </p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground">来源与延伸</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>水平区间：综合公开认知心理学教材（王甬、汪安圣《认知心理学》等）与中文阅读速度研究的常见口径整理，均为约数，非临床或学术严格标准。</li>
          <li>英文 WPM 参考口径：成人平均约 200-250 WPM（Bryant 大学阅读与学习中心等公开教学材料的通行范围）。</li>
          <li>理解度系数为本工具的简化设计（5 星 = 100%，每星 20%；理解题按答对比例计），用于提示「速度需以理解为前提」，非标准化量表。</li>
        </ul>
      </div>
    </details>

    <RelatedTools :currentToolId="'reading-speed-test'" :category="'others'" class="no-print" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  BookOpen, Play, CheckCircle, EyeOff, Star, Info, RotateCw,
  Settings2, Shuffle, TrendingUp, X
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '阅读速度测试 - 在线中文阅读速度与理解度测评（字/分钟）',
  description: '免费在线阅读速度测试：粘贴文章或用内置科普短文，计时默读后答理解题或星级自评，测算阅读速度（字/分钟）与有效速度，附中文成人阅读水平对照表与速读训练建议，历史成绩本地折线保存',
  keywords: '阅读速度测试, 字每分钟, WPM, 速读训练, 阅读效率, 理解度测试',
  author: '有条工具',
  ogTitle: '阅读速度测试 - 在线中文阅读速度与理解度测评 | 有条工具',
  ogDescription: '计时默读测字/分钟，理解度换算有效速度，附水平对照表与速读法建议。',
  ogUrl: 'https://www.util.cn/tools/reading-speed-test',
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
          name: '阅读速度测试',
          url: 'https://www.util.cn/tools/reading-speed-test',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['真实间隔计时默读', '内置科普短文与配套理解题', '自贴文本星级自评理解度', '字/分钟汉字口径计速', '有效速度 = 速度 × 理解度系数', '中文阅读水平对照表', '历史成绩 SVG 折线本地保存']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others' },
            { '@type': 'ListItem', position: 3, name: '阅读速度测试', item: 'https://www.util.cn/tools/reading-speed-test' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'WPM 的中英文口径有什么差异？',
              acceptedAnswer: { '@type': 'Answer', text: '英文按词计（WPM，成人平均约 200-250），中文按字计（成人平均默读约 300-500 字/分钟），两者单位不同不能直接比较。本工具采用汉字口径，标签为字/分钟。' }
            },
            {
              '@type': 'Question',
              name: '为什么阅读时要把正文藏起来？',
              acceptedAnswer: {'@type': 'Answer', text: '为了让用户按平时真实的默读节奏读完，而不是看着文本表演速读。点击开始后正文隐藏并计时，读完点「我读完了」按真实间隔计秒。' }
            },
            {
              '@type': 'Question',
              name: '什么是有效速度？',
              acceptedAnswer: { '@type': 'Answer', text: '有效速度 = 阅读速度 × 理解度系数（5 星 = 100%，理解题按答对比例计）。一分钟扫 800 字只懂一半，有效速度只有 400，提醒速度需以理解为前提。' }
            },
            {
              '@type': 'Question',
              name: '成绩会保存吗？存在哪里？',
              acceptedAnswer: { '@type': 'Answer', text: '每次完成测试自动存入本机浏览器 localStorage（最多 50 条），以 SVG 折线展示最近走势；清浏览器数据会清空，不上传不同步。' }
            }
          ]
        }
      ]
    })
  }]
})

onMounted(() => {
  addRecentTool('reading-speed-test')
  todayIso.value = localDateIso()
  history.value = loadHistory()
})

onUnmounted(() => stopTick())

// ---------- 纯逻辑（单测区开始） ----------
const MIN_CHARS = 100
const MAX_HISTORY = 50
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// 中文水平对照区间（字/分钟，约数口径）
const LEVELS = [
  { min: 0, max: 199, name: '逐字慢读', rangeText: '< 200', desc: '低于常见精读区间：可能逐字默念或文本生涩，先练按词组成块视读' },
  { min: 200, max: 299, name: '精读区间', rangeText: '200-299', desc: '教材、论文、合同等需要逐句消化的材料，这个速度是正常的' },
  { min: 300, max: 499, name: '成人平均默读', rangeText: '300-499', desc: '多数成年人默读一般难度中文材料的常见速度区间' },
  { min: 500, max: 799, name: '快速略读', rangeText: '500-799', desc: '抓关键词与段旨的扫读，适合新闻资讯、快速找重点' },
  { min: 800, max: Infinity, name: '极速扫描', rangeText: '800+', desc: '目录式检索速度，几乎不逐字读，仅适合低信息密度文本' }
]

// 字数口径：去除所有空白字符后计数（汉字口径）
function countCharsOf(text) {
  return String(text || '').replace(/\s+/g, '').length
}

// 阅读速度 = 字数 ÷ 用时（分钟）；600 字 / 90 秒 = 400 字/分钟
function speedOf(chars, seconds) {
  const c = Number(chars)
  const s = Number(seconds)
  if (!Number.isFinite(c) || c <= 0 || !Number.isFinite(s) || s <= 0) return 0
  return Math.round(c / (s / 60))
}

// 理解度系数：5 星 = 100%
function coeffOfStars(stars) {
  const n = Number(stars)
  if (!Number.isFinite(n)) return 0
  return Math.min(5, Math.max(0, n)) / 5
}

// 理解度系数：答题口径（答对数 / 总题数）
function coeffOfQuiz(correct, total) {
  const t = Number(total)
  const c = Number(correct)
  if (!Number.isFinite(t) || t <= 0 || !Number.isFinite(c)) return 0
  return Math.min(1, Math.max(0, c / t))
}

// 有效速度 = 速度 × 理解系数；400 × 0.8 = 320
function effectiveSpeedOf(wpm, coeff) {
  const w = Number(wpm)
  const k = Number(coeff)
  if (!Number.isFinite(w) || w <= 0) return 0
  if (!Number.isFinite(k) || k <= 0) return 0
  return Math.round(w * Math.min(1, k))
}

// 水平档位
function levelOf(wpm) {
  const v = Number(wpm)
  const idx = LEVELS.findIndex((l) => v >= l.min && v <= l.max)
  return { index: idx < 0 ? 0 : idx, level: LEVELS[idx < 0 ? 0 : idx] }
}

// 建议卡文案
function adviceOf(wpm, coeff) {
  if (coeff < 0.6) return '理解度不足三星：速度再快也白读，建议降速 20%-30% 重测，先保证理解，再谈提速。'
  if (wpm >= 500 && coeff < 0.8) return '已进入略读区间但理解有折损：略读的目标是抓重点，抓不到就退回平均速度再练。'
  if (coeff >= 0.8 && wpm < 300) return '理解扎实、速度偏稳：试着按意群阅读、减少回视，速度通常还有提升空间。'
  return '速度与理解比较均衡：保持当前节奏，想提速优先减少回读和逐字默念。'
}

// 历史折线：值序列 → SVG 点串（viewBox 内坐标），返回 points 与 dots
function polylinePointsOf(values, width, height, pad) {
  const vs = (Array.isArray(values) ? values : []).filter((v) => Number.isFinite(v) && v >= 0)
  if (!vs.length) return { points: '', dots: [] }
  const max = Math.max(...vs, 1)
  const innerW = width - pad * 2
  const innerH = height - pad * 2
  const step = vs.length > 1 ? innerW / (vs.length - 1) : 0
  const dots = vs.map((v, i) => ({
    x: Math.round(pad + i * step),
    y: Math.round(height - pad - (v / max) * innerH),
    v: Math.round(v)
  }))
  return { points: dots.map((d) => `${d.x},${d.y}`).join(' '), dots }
}

// 单条记录清洗
function normalizeRecord(raw) {
  if (!raw || typeof raw !== 'object') return null
  const wpm = Math.round(Number(raw.wpm))
  const coeff = Number(raw.coeff)
  if (!Number.isFinite(wpm) || wpm <= 0 || !Number.isFinite(coeff)) return null
  return {
    ts: Number.isFinite(Number(raw.ts)) ? Number(raw.ts) : 0,
    date: typeof raw.date === 'string' && ISO_DATE_RE.test(raw.date) ? raw.date : '',
    chars: Math.max(0, Math.round(Number(raw.chars) || 0)),
    seconds: Math.max(0, Math.round(Number(raw.seconds) || 0)),
    wpm,
    coeff: Math.min(1, Math.max(0, coeff)),
    effective: Math.max(0, Math.round(Number(raw.effective) || 0)),
    source: raw.source === 'custom' ? 'custom' : 'sample'
  }
}

function normalizeRecords(list) {
  if (!Array.isArray(list)) return []
  return list.map(normalizeRecord).filter(Boolean).slice(0, MAX_HISTORY)
}

// 内置示例短文（自写科普，各约 600 字，配 3 道理解题）
const BUILTIN_SAMPLES = [
  {
    id: 'sky-blue',
    title: '天空为什么是蓝色的',
    text: '抬头看晴朗的白昼，天空是一片澄澈的蓝色；到了黄昏，西边又烧起漫天红霞。同一个大气层，颜色为什么会变来变去？答案藏在阳光与空气分子的互动里。\n太阳光看起来是白色的，其实由红、橙、黄、绿、蓝、靛、紫等各种单色光混合而成，不同颜色的光波长不同：红光波长最长，蓝紫光波长最短。当阳光进入大气层，会撞上数量巨大的气体分子和微小颗粒。这些粒子的尺寸远小于光的波长，于是光被散射向四面八方。物理学家瑞利在十九世纪找到了规律：散射强度与波长的四次方成反比。也就是说，波长越短，被散射得越厉害；蓝光的散射强度大约是红光的五倍以上。于是蓝光被空气分子撒满整个天空，无论我们朝哪个方向看，都能接收到被散射而来的蓝光，天空自然呈现蓝色。顺带一提，海洋和冰川的蓝是另一回事：那里主要是水面对蓝光的反射与选择性吸收，和天空的散射原理并不相同。\n有人会追问：紫光波长更短，散射更强，天为什么不是紫色的？原因有二：一是到达地面的阳光里，紫光成分本来就比蓝光少；二是人眼对蓝光的敏感度远高于紫光。两种因素叠加，眼睛看到的天空便是熟悉的蓝色。\n那晚霞为什么发红？黄昏时太阳位置很低，阳光要斜斜穿过得厚得多的大气层，蓝光在途中几乎被散射殆尽，剩下红光、橙光直达眼底，天边便被染成温暖的红色。同样的道理，雾霾天里散射颗粒增多，天空显得灰白；而在没有大气的月球上，哪怕太阳当空，天空仍是一片漆黑。下次抬头看天，你就知道：这片蓝色不是天的颜色，而是阳光在空气里留下的签名。',
    questions: [
      { q: '天空呈现蓝色，最主要的原因是？', options: ['大气分子对阳光的散射，且短波长的蓝光散射更强', '海洋把蓝色反射到了天上', '太阳光本身就是蓝色的', '臭氧层把其他颜色都吸收了'], answer: 0 },
      { q: '按瑞利散射规律，散射强度与光波长的关系是？', options: ['波长越长散射越强', '与波长的四次方成反比', '与波长完全无关', '与波长的平方成正比'], answer: 1 },
      { q: '黄昏的太阳与晚霞看起来偏红，是因为？', options: ['太阳在傍晚释放的光变成了红色', '晚霞云层把太阳染红了', '阳光斜穿过更厚的大气，蓝光几乎被散射掉，红橙光直达眼睛', '人眼在傍晚对红色更敏感'], answer: 2 }
    ]
  },
  {
    id: 'sleep-memory',
    title: '睡眠如何帮大脑整理记忆',
    text: '白天学的东西，为什么睡一觉之后反而更清楚？这不是错觉。睡眠并不是大脑的关机时间，而是它整理信息的另一个工作时段。\n一晚的睡眠由多个周期组成，每个周期约九十分钟，其间交替出现两个重要阶段。一个是深睡眠：脑电波缓慢而巨大，身体分泌生长激素、修复组织，免疫系统也在加紧工作。另一个是快速眼动睡眠，简称 REM 睡眠：眼球在眼皮下快速转动，大脑的活跃程度接近清醒，大多数生动清晰的梦发生在这一阶段，而全身肌肉张力却降到极低，身体像被暂时锁住，避免把梦里的动作真做出来。\n对学习而言，睡眠扮演的是归档员。白天，海马体像一块临时白板，匆匆记下大量新信息；进入深睡眠后，海马体会把白天的记忆回放一遍，把重要的部分逐步转存到大脑皮层，变成长期记忆。实验发现，学完知识后正常睡一晚的人，第二天的回忆成绩明显高于同样清醒时长却没有睡的人。REM 睡眠则更擅长把新知识与旧经验联系起来，这也是为什么灵感常常出现在一夜好梦之后。\n那么睡多久才够？对多数成年人来说，七到九小时是常见区间，个体差异真实存在：有人睡六小时就精神，有人非要九小时才缓过来。判断标准不是时长本身，而是白天的状态——如果上午就频频犯困、注意力涣散，多半说明睡眠债在累积，周末猛补一天并不能一次还清。\n这也解释了熬夜复习为什么得不偿失：牺牲睡眠多背下的内容，会因为缺乏巩固而大量流失，第二天的注意力还会明显下降。想学得牢，顺序其实很朴素——先认真学，再好好睡。',
    questions: [
      { q: '大多数生动清晰的梦发生在哪个阶段？', options: ['深睡眠阶段', '快速眼动（REM）睡眠阶段', '刚入睡的迷糊期', '浅睡打盹阶段'], answer: 1 },
      { q: '进入深睡眠后，海马体的主要工作是？', options: ['把白天的记忆回放并转存为长期记忆', '清空所有旧记忆', '让全身肌肉张力升高', '分泌生长激素'], answer: 0 },
      { q: '文章认为熬夜复习得不偿失，主要理由是？', options: ['夜晚灯光太暗伤眼睛', '熬夜会让人发胖', '缺乏睡眠巩固，记下的内容大量流失，次日注意力也下降', '熬夜后就再也做不了梦'], answer: 2 }
    ]
  }
]
// ---------- 纯逻辑（单测区结束） ----------

// ---------- 页面状态 ----------
const STORAGE_KEY = 'reading-speed-history-v1'
const todayIso = ref('')
const sourceMode = ref('sample')
const sampleIndex = ref(0)
const customText = ref('')
const phase = ref('prep') // prep | reading | quiz
const startTime = ref(0)
const elapsedSec = ref(0)
const readSeconds = ref(0)
const quizAnswers = ref([null, null, null])
const stars = ref(0)
const result = ref(null)
const history = ref([])
const confirmClearHistory = ref(false)
let tickTimer = null

// 浏览器本地日历日（仅 onMounted 调用）
function localDateIso() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// ---------- 存取（读只在 onMounted，写只在事件回调） ----------
function loadHistory() {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return normalizeRecords(JSON.parse(raw))
  } catch (e) {
    return []
  }
}

function persistHistory() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value.slice(0, MAX_HISTORY)))
  } catch (e) { /* 忽略 */ }
}

// ---------- 派生 ----------
const activeSample = computed(() => (sourceMode.value === 'sample' ? BUILTIN_SAMPLES[sampleIndex.value] : null))
const activeText = computed(() => (sourceMode.value === 'sample' ? activeSample.value.text : customText.value))
const activeTitle = computed(() => (sourceMode.value === 'sample' ? activeSample.value.title : '自贴文章'))
const activeCount = computed(() => countCharsOf(activeText.value))
const customCount = computed(() => countCharsOf(customText.value))
const starsText = computed(() => (stars.value === 0 ? '点星星评分' : `${stars.value} 星 · 系数 ${coeffOfStars(stars.value) * 100}%`))

const elapsedText = computed(() => {
  const m = Math.floor(elapsedSec.value / 60)
  const s = elapsedSec.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

const liveSpeed = computed(() => speedOf(activeCount.value, Math.max(1, elapsedSec.value)))

const chart = computed(() => {
  // 折线按时间正序（旧 → 新），展示最近 12 条的有效速度
  const asc = history.value.slice(0, 12).slice().reverse()
  return polylinePointsOf(asc.map((r) => r.effective), 300, 120, 16)
})

// ---------- 计时与流程 ----------
function stopTick() {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

function startReading() {
  if (activeCount.value < MIN_CHARS) return
  readSeconds.value = 0
  quizAnswers.value = [null, null, null]
  stars.value = 0
  result.value = null
  startTime.value = Date.now()
  elapsedSec.value = 0
  phase.value = 'reading'
  stopTick()
  tickTimer = setInterval(() => {
    elapsedSec.value = Math.floor((Date.now() - startTime.value) / 1000)
  }, 250)
}

function finishReading() {
  stopTick()
  readSeconds.value = Math.max(1, Math.round((Date.now() - startTime.value) / 1000))
  phase.value = 'quiz'
}

function abortReading() {
  stopTick()
  phase.value = 'prep'
  result.value = null
}

function submitQuiz() {
  let coeff = 0
  if (sourceMode.value === 'sample' && activeSample.value) {
    if (quizAnswers.value.some((a) => a === null)) {
      alert('还有题目未作答')
      return
    }
    const correct = activeSample.value.questions.reduce(
      (sum, q, i) => sum + (quizAnswers.value[i] === q.answer ? 1 : 0), 0)
    coeff = coeffOfQuiz(correct, activeSample.value.questions.length)
  } else {
    if (stars.value === 0) {
      alert('请先点星星自评理解度')
      return
    }
    coeff = coeffOfStars(stars.value)
  }
  const wpm = speedOf(activeCount.value, readSeconds.value)
  const effective = effectiveSpeedOf(wpm, coeff)
  const lv = levelOf(effective)
  const record = {
    ts: Date.now(),
    date: todayIso.value,
    chars: activeCount.value,
    seconds: readSeconds.value,
    wpm,
    coeff,
    effective,
    source: sourceMode.value === 'sample' ? 'sample' : 'custom'
  }
  result.value = {
    wpm,
    coeff,
    effective,
    seconds: readSeconds.value,
    levelIndex: lv.index,
    level: lv.level,
    advice: adviceOf(wpm, coeff)
  }
  history.value = [record].concat(history.value).slice(0, MAX_HISTORY)
  persistHistory()
  phase.value = 'prep'
}

function removeRecord(index) {
  history.value = history.value.filter((_, i) => i !== index)
  persistHistory()
}

function clearHistory() {
  confirmClearHistory.value = false
  history.value = []
  persistHistory()
}

function switchSource(mode) {
  if (phase.value !== 'prep') return
  sourceMode.value = mode
}

function randomSample() {
  if (BUILTIN_SAMPLES.length < 2) return
  let idx = sampleIndex.value
  while (idx === sampleIndex.value) {
    idx = Math.floor(Math.random() * BUILTIN_SAMPLES.length)
  }
  sampleIndex.value = idx
  sourceMode.value = 'sample'
}

function resetAll() {
  phase.value = 'prep'
  result.value = null
  readSeconds.value = 0
  elapsedSec.value = 0
}
</script>
