<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Ear class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">音程听辨训练</h1>
          <p class="text-sm text-muted-foreground mt-1">视唱练耳入门：八度内 13 种音程随机出题、固定调/相对调双模式、歌曲锚点辅助记忆与分音程准确率统计</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线音程听辨训练（练耳）工具：八度内 13 种音程随机出题，支持固定调（根音固定 C4）与相对调（根音随机）两种模式、
        「先根音后音程音」与「和弦式同时」两种播放方式；答错自动显示正确答案与中文歌曲记忆锚点（如纯五度对应《义勇军进行曲》"起来"句），
        不限次复听、连击计数、分音程准确率统计并自动标记最弱三项「重点训练」，训练统计保存在本机浏览器。
        声音由 WebAudio 本地实时合成，零上传零第三方依赖，每天 10 分钟即可系统提升音程听辨能力。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：训练设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Music class="w-5 h-5 mr-2 text-primary" /> 训练设置
        </h2>

        <!-- 音程范围 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">音程范围（题库池）</p>
          <div class="grid grid-cols-2 gap-1.5">
            <label
              v-for="iv in checkableIntervals"
              :key="iv.semitones"
              class="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs cursor-pointer transition"
              :class="enabledSet.has(iv.semitones) ? 'bg-primary/10 border-primary/30 text-foreground' : 'bg-muted/40 border-border text-muted-foreground'"
            >
              <input
                type="checkbox"
                class="accent-primary flex-shrink-0"
                :checked="enabledSet.has(iv.semitones)"
                @change="toggleSemi(iv.semitones)"
              />
              <span class="font-medium truncate">{{ iv.name }}</span>
              <span class="ml-auto font-mono text-[10px] text-muted-foreground flex-shrink-0">{{ iv.semitones }}</span>
            </label>
          </div>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="p in PRESETS"
              :key="p.key"
              @click="applyPreset(p)"
              :title="p.desc"
              class="px-2 py-1.5 rounded-lg border text-xs font-medium transition"
              :class="isPresetActive(p) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted hover:bg-muted/80 border-border text-foreground'"
            >
              {{ p.label }}
            </button>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            默认勾选除纯一度外的全部 12 个音程；建议先只勾 3-5 个入门（用上方预设），稳定到 80% 以上再扩池。纯一度与根音相同、无需听辨，不进入题库。
          </p>
        </div>

        <!-- 根音模式 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">根音模式</p>
          <label
            v-for="opt in ROOT_MODES"
            :key="opt.value"
            class="flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition"
            :class="rootMode === opt.value ? 'bg-primary/10 border-primary/30' : 'bg-muted/40 border-border hover:border-primary/20'"
          >
            <input
              type="radio"
              name="root-mode"
              :value="opt.value"
              v-model="rootMode"
              class="mt-1 accent-primary flex-shrink-0"
            />
            <span>
              <span class="block text-sm font-medium text-foreground">{{ opt.label }}</span>
              <span class="block text-xs text-muted-foreground mt-0.5">{{ opt.desc }}</span>
            </span>
          </label>
        </div>

        <!-- 播放模式 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">播放模式</p>
          <label
            v-for="opt in PLAY_MODES"
            :key="opt.value"
            class="flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition"
            :class="playMode === opt.value ? 'bg-primary/10 border-primary/30' : 'bg-muted/40 border-border hover:border-primary/20'"
          >
            <input
              type="radio"
              name="play-mode"
              :value="opt.value"
              v-model="playMode"
              class="mt-1 accent-primary flex-shrink-0"
            />
            <span>
              <span class="block text-sm font-medium text-foreground">{{ opt.label }}</span>
              <span class="block text-xs text-muted-foreground mt-0.5">{{ opt.desc }}</span>
            </span>
          </label>
        </div>

        <!-- 每轮题数 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">每轮题数</p>
          <div class="grid grid-cols-3 gap-1.5">
            <label
              v-for="opt in ROUND_SIZES"
              :key="opt.value"
              class="flex items-center justify-center gap-1.5 p-2.5 rounded-lg border cursor-pointer transition text-sm font-medium"
              :class="roundSize === opt.value ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/40 border-border text-muted-foreground'"
            >
              <input
                type="radio"
                name="round-size"
                :value="opt.value"
                v-model="roundSize"
                class="accent-primary"
              />
              {{ opt.label }}
            </label>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">调整任意设置会重置本轮进度（历史统计保留）。</p>
        </div>

        <!-- 音量 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label for="et-volume" class="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Volume2 class="w-4 h-4 text-primary" /> 音量
            </label>
            <span class="text-xs text-muted-foreground font-mono">{{ volume }}%</span>
          </div>
          <input
            id="et-volume"
            v-model.number="volume"
            type="range"
            min="0"
            max="100"
            step="1"
            class="w-full accent-primary"
          />
        </div>
      </div>

      <!-- 右：答题区 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Music class="w-5 h-5 mr-2 text-primary" /> 听音答题
          </h2>
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-600">
            <Trophy class="w-3.5 h-3.5" /> 连击 {{ streak }} · 最佳 {{ bestStreak }}
          </span>
        </div>

        <!-- 本轮进度 -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>本轮进度：{{ roundIndex }} / {{ roundSizeText }}（答对 {{ roundCorrect }}）</span>
            <span class="hidden sm:inline">{{ rootModeLabel }} · {{ playModeLabel }}</span>
          </div>
          <div v-if="roundSize > 0" class="h-1.5 bg-muted rounded-full overflow-hidden" aria-hidden="true">
            <div class="h-full bg-primary/60 rounded-full transition-all" :style="{ width: roundProgress + '%' }"></div>
          </div>
        </div>

        <!-- 播放 / 复听 -->
        <div class="flex gap-2">
          <button
            @click="primaryAction"
            :disabled="phase === 'played' || !enabledPool.length"
            class="flex-1 px-4 py-3 rounded-lg text-base font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            :class="phase === 'played' ? 'bg-muted border border-border text-muted-foreground' : 'bg-primary text-primary-foreground hover:opacity-90'"
          >
            <Play class="w-5 h-5" /> {{ primaryLabel }}
          </button>
          <button
            @click="replayQuestion"
            :disabled="!current"
            class="w-32 px-4 py-3 rounded-lg border text-sm font-semibold transition flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 border-border text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Volume2 class="w-5 h-5" /> 复听
          </button>
        </div>

        <p v-if="audioError" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ audioError }}</span>
        </p>

        <!-- 状态 / 判定反馈 -->
        <div v-if="phase === 'idle'" class="text-sm leading-relaxed p-3 rounded-lg bg-muted/50 border border-border text-muted-foreground flex items-start gap-2">
          <Info class="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
          <span>调好左侧设置，点击「播放题目」开始：{{ playMode === 'seq' ? '先听根音 1 秒，再听音程音 1 秒' : '两音同时响起' }}，然后从下方选出你听到的音程。</span>
        </div>
        <div v-else-if="phase === 'played'" class="text-sm leading-relaxed p-3 rounded-lg bg-primary/10 border border-primary/30 text-foreground flex items-start gap-2">
          <Info class="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
          <span>题目已播放（根音 <span class="font-semibold font-mono">{{ currentRootName }}</span>）。凭第一记忆从下方选择音程，拿不准可点「复听」再确认。</span>
        </div>
        <div v-else-if="phase === 'answered' && lastJudge && lastJudge.correct" class="text-sm leading-relaxed p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 space-y-1">
          <p class="flex items-start gap-2 font-semibold">
            <CheckCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>回答正确！是{{ correctAnswerText }}（根音 {{ currentRootName }}）· 当前连击 {{ streak }} 次</span>
          </p>
          <p class="text-xs text-muted-foreground flex items-start gap-1.5 pl-6">
            <Music class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>记忆锚点：{{ feedbackAnchor }}</span>
          </p>
        </div>
        <div v-else-if="phase === 'answered'" class="text-sm leading-relaxed p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 space-y-1 animate-flash-red">
          <p class="flex items-start gap-2 font-semibold">
            <Info class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>答错了，正确答案是{{ correctAnswerText }}（根音 {{ currentRootName }}）· 连击中断</span>
          </p>
          <p class="text-xs text-muted-foreground flex items-start gap-1.5 pl-6">
            <Music class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>记忆锚点：{{ feedbackAnchor }}。点「复听」对照一遍，再进入下一题。</span>
          </p>
        </div>
        <div v-else class="text-sm leading-relaxed p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-foreground flex items-start gap-2">
          <Trophy class="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
          <span>本轮完成：答对 {{ roundCorrect }} / {{ roundIndex }}（正确率 {{ roundAccText }}）。保持节奏，点「开始新一轮」继续训练。</span>
        </div>

        <!-- 音程按钮网格（答题） -->
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          <button
            v-for="iv in intervalButtons"
            :key="iv.semitones"
            @click="answer(iv.semitones)"
            :disabled="!canAnswer || !iv.enabled"
            :title="iv.enabled ? '' : (iv.semitones === 0 ? '纯一度与根音相同，不进入题库' : '未勾选，可在左侧音程范围中启用')"
            class="rounded-lg border p-3 text-center transition select-none"
            :class="answerClassOf(iv)"
          >
            <p class="text-sm font-semibold truncate">{{ iv.name }}</p>
            <p class="text-[10px] font-mono text-muted-foreground mt-0.5">{{ iv.semitones }} 半音</p>
          </button>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>记忆锚点是习惯用法，以实际歌曲为准；无统一锚点的音程（如三全音、七度）建议结合色彩与推算记忆。</span>
        </p>

        <!-- 统计面板 -->
        <div class="border-t border-border pt-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold flex items-center">
              <Music class="w-4 h-4 mr-2 text-primary" /> 统计面板
            </h3>
            <button
              @click="clearHistory"
              class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition"
            >
              <RefreshCw class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 历史清空
            </button>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">本轮进度</p>
              <p class="text-lg font-bold text-foreground">{{ roundIndex }} / {{ roundSizeText }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">本轮答对</p>
              <p class="text-lg font-bold text-foreground">{{ roundCorrect }} 题</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">总正确率</p>
              <p class="text-lg font-bold" :class="sessionStats.acc === null ? 'text-muted-foreground' : 'text-primary'">
                {{ totalAccText }}
              </p>
              <p class="text-[10px] text-muted-foreground">累计 {{ sessionStats.total }} 题</p>
            </div>
          </div>

          <div v-if="tableRows.length" class="space-y-1.5">
            <div v-for="row in tableRows" :key="row.semitones" class="flex items-center gap-2 text-xs">
              <span class="w-16 flex-shrink-0 font-medium text-foreground truncate">{{ row.name }}</span>
              <div class="flex-1 h-2 bg-muted rounded-full overflow-hidden" aria-hidden="true">
                <div class="h-full bg-primary/70 rounded-full" :style="{ width: row.acc + '%' }"></div>
              </div>
              <span class="w-24 flex-shrink-0 text-right font-mono text-muted-foreground">{{ row.correct }}/{{ row.total }} · {{ row.acc }}%</span>
              <span
                v-if="row.weak"
                class="flex-shrink-0 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-600 text-[10px] font-medium"
              >重点训练</span>
              <span v-else class="flex-shrink-0 w-[52px]"></span>
            </div>
          </div>
          <p v-else class="text-xs text-muted-foreground leading-relaxed">
            暂无答题记录：完成第一题后，这里会按准确率从低到高列出各音程表现，最弱三项自动标记「重点训练」。统计保存在本机浏览器，不会上传。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>音程听辨训练是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          音程听辨训练（俗称「练耳」）是视唱练耳的基础科目：播放两个音，凭听觉判断它们之间的距离（音程）。本工具用浏览器 WebAudio 接口本地合成音源，
          在八度内 13 种音程中按你勾选的范围随机出题，根音可固定 C4（固定调模式）或在 C3-B4 区间随机（相对调模式）；
          播放方式支持「先根音 1 秒、再音程音 1 秒」的顺序模式与「两音同时」的和弦模式；答错时显示正确答案与歌曲记忆锚点，答对累计连击；
          并按音程维度统计准确率，自动把最弱三项标记为「重点训练」。全部计算与发声都在本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么是音程？为什么用半音数定义？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          音程（Interval）指两个音之间的听觉距离。在十二平均律里，一个八度被均分为 12 个半音，相邻半音的频率比恒为 2^(1/12) ≈ 1.0595，
          因此音程可以用「半音数」精确度量：0 个半音是纯一度（两音相同），7 个半音是纯五度，12 个半音是纯八度。
          本工具按 0-12 半音对应八度内 13 种音程出题，频率按 A4=440Hz 的 440×2^(n/12) 公式计算，与钢琴等十二平均律乐器完全一致。
          13 种音程与常用记忆锚点对照如下（<span class="font-semibold text-foreground">锚点是习惯用法，以实际歌曲为准</span>）：
        </p>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground mt-2">
          <li v-for="iv in INTERVALS" :key="iv.semitones">
            <span class="font-semibold text-foreground">{{ iv.name }}（{{ iv.semitones }} 半音）</span>：{{ iv.anchor }}
          </li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">听音怎么练？锚点歌记忆法（每天 10 分钟）</h3>
        <ol class="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>先用「入门组」预设（大小二度、大小三度、纯四度、纯五度共 6 个音程），根音选固定 C、播放选顺序模式。</li>
          <li>听题时在心里把第二个音「唱」出来，再哼唱锚点歌的开头两句比对：能贴合就是该音程。例如听到空旷稳定的距离，哼《义勇军进行曲》"起来"句对得上，就是纯五度。</li>
          <li>答错先看正确答案与锚点，点「复听」对照一遍再进下一题，让耳朵把"错的距离"修正成"对的距离"。</li>
          <li>每天 10 分钟（可拆成早晚各 5 分钟）比周末突击 1 小时有效得多：音程感是短期记忆叠加出来的，频率比时长更重要。</li>
          <li>某组准确率稳定在 80% 以上后，用「进阶组」加入六度、七度扩池；统计面板里被标「重点训练」的音程优先补练。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">固定调与首调（相对调）的区别</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          固定调（Fixed Do）以绝对音高为参照：无论什么调，C 就是 C。本工具的「固定 C」模式根音始终是 C4，适合初学者先建立一个稳定参照系，
          把"距离感"先练熟。首调/相对调（Movable Do）以相对关系为参照：只关心两音之间的距离，不关心绝对音高。
          「随机根音」模式根音在 C3-B4 区间随机，逼着你只听相对距离，这才是实际视奏、扒歌时用到的能力。
          建议路径：入门用固定 C 建立信心，准确率稳定后切换随机根音练习真正的相对音感。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么先练纯四度、纯五度和大三度？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          因为它们是调性音乐里最"稳定、最有辨识度"的距离：纯四度与纯五度听感空旷而贯通（不完满但很安定），是音阶与和弦的骨架；
          大三度直接决定一个和弦"明亮（大调）还是暗淡（小调）"的色彩，是区分大小调听觉的第一把尺子。
          先把这三种距离练到脱口而出，再听大二度的级进感、小二度的紧涩感，最后攻六度、七度这些"大距离"，
          难度曲线最平滑。这也是本工具「入门组」预设默认包含大小二度、大小三度与纯四五度的原因——二度练线条、三度练色彩、四五度练空间，正好覆盖旋律与和声的基本原料。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">和视唱练耳课的关系</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本工具是课堂的课外陪练，不能替代系统课程：视唱练耳课除了听辨，还有视唱（看着谱唱准）、构唱（按要求唱出音程）、
          节奏与旋律记忆等科目，并且老师能当场纠正发声与概念。合理用法是「课前热身 + 课后巩固」：
          上课前用 5 分钟把当堂要讲的音程听热，课后用统计面板盯住薄弱音程加练。课下用乐器（钢琴/吉他）校验锚点歌的实际音高也很重要——
          工具的音源是标准十二平均律，但你对"锚点"的记忆最终要落到自己能唱出来才算真正掌握。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">零基础怎么开始音程听辨？</h3>
            <p class="text-sm text-muted-foreground mt-1">点左侧「入门组」预设（大小二度、大小三度、纯四度、纯五度），根音选固定 C、播放选顺序模式，每天 10 分钟。听到题目先在心里哼第二个音，再用锚点歌（如纯五度哼《义勇军进行曲》"起来"句）比对作答；答错看锚点、点复听对照，稳定 80% 以上再扩池。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">固定调（固定 C）和相对调（随机根音）怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1">初学选固定 C：根音永远是 C4，参照系稳定，先练熟"距离感"；准确率稳定后切到随机根音，只辨相对距离——这才是扒歌、视奏时真正用到的相对音感。两种模式随时切换，统计互不丢失。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">每天练多久才有效果？</h3>
            <p class="text-sm text-muted-foreground mt-1">每天 10 分钟（可拆早晚各 5 分钟）即可，关键是连续坚持：多数人 2-4 周能把入门组 6 个音程练到 80% 以上（因人而异）。宁可短而频繁，不要长而稀疏。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">复听不限次，会不会变成"作弊"？</h3>
            <p class="text-sm text-muted-foreground mt-1">练习场景允许复听——本工具定位是训练而非考试。建议先凭第一记忆作答，答错或拿不准再用复听验证；若每题都反复重听再答，练的就不是听辨而是"试错比对"，效果会打折。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ear-training-trainer'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Ear, Play, Volume2, CheckCircle,
  ChevronUp, ChevronDown, Info, RefreshCw, Music, Trophy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '音程听辨训练 - 在线练耳与视唱练耳音程训练工具',
  description: '免费在线音程听辨训练工具：八度内 13 种音程随机出题，固定调/相对调双模式，顺序或和弦式播放，中文歌曲锚点辅助记忆，连击计数与分音程准确率统计（最弱三项重点训练标记），WebAudio 本地合成零上传，视唱练耳入门每天 10 分钟练耳必备。',
  keywords: '音程听辨,练耳,ear training,视唱练耳,音程训练,在线练耳工具,音程记忆锚点,相对音感',
  author: '有条工具',
  ogTitle: '音程听辨训练 - 在线练耳与视唱练耳音程训练工具 | 有条工具',
  ogDescription: '八度内 13 种音程随机出题，歌曲锚点辅助记忆，分音程准确率统计，每天 10 分钟练出好耳力。',
  ogUrl: 'https://www.util.cn/tools/ear-training-trainer',
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
          name: '音程听辨训练',
          url: 'https://www.util.cn/tools/ear-training-trainer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['八度内 13 种音程随机出题', '入门/进阶/全部三档音程预设与自选范围', '固定调（固定 C4）与相对调（随机根音）双模式', '顺序播放与和弦式同时播放', '复听不限次', '连击与最佳纪录', '分音程准确率统计与最弱三项重点训练标记', '中文歌曲记忆锚点辅助', 'WebAudio 本地合成零上传，统计存本机']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '音程听辨训练', item: 'https://www.util.cn/tools/ear-training-trainer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '零基础怎么开始音程听辨？',
              acceptedAnswer: { '@type': 'Answer', text: '选入门组预设（大小二度、大小三度、纯四度、纯五度），根音固定 C、顺序播放，每天 10 分钟：听到题目先在心里哼第二个音，再用锚点歌（如纯五度哼国歌"起来"句）比对作答，答错看锚点并复听对照，稳定 80% 以上再扩池。' }
            },
            {
              '@type': 'Question',
              name: '固定调（固定 C）和相对调（随机根音）怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '初学选固定 C：根音永远是 C4，参照系稳定，先练熟距离感；准确率稳定后切到随机根音，只辨相对距离，这是扒歌、视奏时真正用到的相对音感。' }
            },
            {
              '@type': 'Question',
              name: '每天练多久才有效果？',
              acceptedAnswer: { '@type': 'Answer', text: '每天 10 分钟（可拆早晚各 5 分钟）即可，关键是连续坚持：多数人 2-4 周能把入门组 6 个音程练到 80% 以上，因人而异。宁可短而频繁，不要长而稀疏。' }
            },
            {
              '@type': 'Question',
              name: '复听不限次，会不会变成作弊？',
              acceptedAnswer: { '@type': 'Answer', text: '练习场景允许复听，本工具定位是训练而非考试。建议先凭第一记忆作答，答错或拿不准再用复听验证；若每题都反复重听再答，练的就不再是听辨而是试错比对，效果会打折。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// mulberry32 伪随机数生成器：返回 () => [0,1) 均匀分布函数，同种子序列完全一致（同种子同题可单测）
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 随机根音区间：midi 48-71（C3-B4 常用听辨音区，含 C4-B4；固定调模式取 C4 = midi 60）
const ROOT_MIN = 48
const ROOT_MAX = 71

// 音名表（C=0 口径：pitch class 0 为 C）
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// 八度内 13 种音程：半音数 0-12 + 名称 + 歌曲记忆锚点（锚点为习惯用法，以实际歌曲为准）
const INTERVALS = [
  { semitones: 0, name: '纯一度', anchor: '《小星星》开头"一闪"——同音反复，无距离感' },
  { semitones: 1, name: '小二度', anchor: '《卷珠帘》类古风拖腔的半音游移（风格提示），色彩紧涩不协和' },
  { semitones: 2, name: '大二度', anchor: '《生日快乐》开头"祝你"（sol→la），级进的上行台阶感' },
  { semitones: 3, name: '小三度', anchor: '《茉莉花》"好一朵"句（mi→sol），暗淡的小调色彩' },
  { semitones: 4, name: '大三度', anchor: '《两只老虎》开头旋律跨距（习惯口径），明亮的大调色彩' },
  { semitones: 5, name: '纯四度', anchor: '《歌唱祖国》开头起句，空旷而贯通的悬浮感' },
  { semitones: 6, name: '三全音', anchor: '中文歌少有稳定锚点，可参考《辛普森一家》片头曲开头，记"悬浮不安定"色彩' },
  { semitones: 7, name: '纯五度', anchor: '《义勇军进行曲》开头"起来"句，空旷而稳定' },
  { semitones: 8, name: '小六度', anchor: '常以《教父》主题开头为参考（国际常用），暗淡而宽广' },
  { semitones: 9, name: '大六度', anchor: '常以《My Bonnie》起句为参考（国际常用），明亮而开阔' },
  { semitones: 10, name: '小七度', anchor: '常以《Somewhere》（西区故事）起句为参考（国际常用），暗淡、待解决' },
  { semitones: 11, name: '大七度', anchor: '少见旋律锚点，可记"强烈倾向主音"，≈纯八度收缩一个半音' },
  { semitones: 12, name: '纯八度', anchor: '《绿野仙踪》Over the Rainbow 开头"Somewhere"跨八度，同一音的高八度' }
]

// 半音数 → 音程定义（找不到返回 null）
function intervalBySemitones(semi) {
  return INTERVALS.find((iv) => iv.semitones === semi) || null
}

// 题库池清洗：仅保留 1-12 半音、去重、升序（纯一度 0 不进题库——与根音相同无听辨价值）
function normalizeEnabled(list) {
  return [...new Set((Array.isArray(list) ? list : []).filter((n) => Number.isInteger(n) && n >= 1 && n <= 12))].sort((a, b) => a - b)
}

// 半音数 → 频率：以 A4=440Hz 为基准的十二平均律公式 440×2^(n/12)，n 为相对 A4 的半音数
function freqOf(semitonesFromA4) {
  return 440 * Math.pow(2, semitonesFromA4 / 12)
}

// midi 编号 → "C4" 式音名（C=0 口径：midi 60 = C4，八度号 = floor(midi/12) - 1）
function midiNameOf(midi) {
  const pc = ((midi % 12) + 12) % 12
  return NOTE_NAMES[pc] + (Math.floor(midi / 12) - 1)
}

// 出题：根音默认在 midi 48-71 均匀随机（fixedRootMidi 传整数则固定），音程从启用池等概率抽取。
// rng 为 mulberry32 风格函数——同种子同启用池必得同一题（可单测）；池为空或 rng 非函数返回 null。
function genQuestion(enabledIntervals, rng, fixedRootMidi = null) {
  const pool = normalizeEnabled(enabledIntervals)
  if (!pool.length || typeof rng !== 'function') return null
  const rootMidi = (Number.isInteger(fixedRootMidi) && fixedRootMidi >= ROOT_MIN && fixedRootMidi <= ROOT_MAX)
    ? fixedRootMidi
    : ROOT_MIN + Math.floor(rng() * (ROOT_MAX - ROOT_MIN + 1))
  const semitones = pool[Math.floor(rng() * pool.length)]
  return { rootMidi, interval: intervalBySemitones(semitones), semitones }
}

// 判定：answer / truth 均为半音数；返回是否答对与正确答案名称
function judgeOf(answer, truth) {
  const info = intervalBySemitones(truth)
  return { correct: answer === truth, correctName: info ? info.name : '' }
}

// 统计：history 为 [{semitones, correct}] 记录数组。
// acc 为百分数（保留 1 位小数，无样本为 null）；byInterval 仅含已作答的音程，按准确率升序（最弱在前，
// 准确率相同则答题数多者在前——样本更大更可信），调用方取前三项标记「重点训练」。
function statsOf(history) {
  const records = Array.isArray(history) ? history : []
  const total = records.length
  const correct = records.reduce((s, r) => s + (r && r.correct ? 1 : 0), 0)
  const acc = total ? Math.round((correct / total) * 1000) / 10 : null
  const map = new Map()
  for (const r of records) {
    if (!r || !Number.isInteger(r.semitones)) continue
    const e = map.get(r.semitones) || { semitones: r.semitones, total: 0, correct: 0 }
    e.total += 1
    if (r.correct) e.correct += 1
    map.set(r.semitones, e)
  }
  const byInterval = [...map.values()]
    .map((e) => {
      const info = intervalBySemitones(e.semitones)
      return { semitones: e.semitones, name: info ? info.name : `未知(${e.semitones})`, total: e.total, correct: e.correct, acc: Math.round((e.correct / e.total) * 1000) / 10 }
    })
    .sort((a, b) => a.acc - b.acc || b.total - a.total)
  return { total, correct, acc, byInterval }
}

// ---------- 预设与选项 ----------
const PRESETS = [
  { key: 'starter', label: '入门组', semArrayCheck: [1, 2, 3, 4, 5, 7], desc: '大小二度、大小三度、纯四纯五' },
  { key: 'advanced', label: '进阶组', semArrayCheck: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11], desc: '入门组 + 大小六度与大小七度' },
  { key: 'all', label: '全部', semArrayCheck: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], desc: '除纯一度外全部 12 个音程' }
]

const ROOT_MODES = [
  { value: 'fixed', label: '固定 C（固定调模式）', desc: '根音固定为 C4，建立稳定参照系，入门推荐' },
  { value: 'random', label: '随机根音（相对调模式）', desc: '根音在 C3-B4（midi 48-71）随机，只辨相对距离' }
]

const PLAY_MODES = [
  { value: 'seq', label: '先根音后音程音', desc: '根音 1 秒 → 音程音 1 秒顺序播放，入门推荐' },
  { value: 'chord', label: '和弦式同时', desc: '两音同时响起 1.3 秒，更接近和声听感，进阶' }
]

const ROUND_SIZES = [
  { value: 10, label: '10 题' },
  { value: 20, label: '20 题' },
  { value: 0, label: '无限' }
]

// ---------- 页面状态 ----------
const seoContentVisible = ref(true)
const enabledSemis = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) // 默认全 12 个勾选
const rootMode = ref('fixed')
const playMode = ref('seq')
const roundSize = ref(10)
const volume = ref(80)

const current = ref(null)      // 当前题 { rootMidi, interval, semitones }，null = 未开题
const phase = ref('idle')      // idle 未开题 | played 待作答 | answered 已判定 | roundDone 本轮结束
const selectedSemi = ref(null) // 本次作答选择的半音数
const lastJudge = ref(null)    // 最近一次判定 { correct, correctName }

const streak = ref(0)       // 当前连击
const bestStreak = ref(0)   // 历史最佳连击（持久化）
const roundIndex = ref(0)   // 本轮已答题数
const roundCorrect = ref(0) // 本轮答对数
const history = ref([])     // 累计答题记录 [{semitones, correct}]（持久化，上限 2000 条）
const audioError = ref('')

// ---------- 派生量 ----------
const enabledPool = computed(() => normalizeEnabled(enabledSemis.value))
const enabledSet = computed(() => new Set(enabledPool.value))
const checkableIntervals = INTERVALS.filter((iv) => iv.semitones >= 1)
const intervalButtons = computed(() =>
  INTERVALS.map((iv) => ({ ...iv, enabled: enabledSet.value.has(iv.semitones) }))
)
const sessionStats = computed(() => statsOf(history.value))
const tableRows = computed(() => sessionStats.value.byInterval.map((e, i) => ({ ...e, weak: i < 3 })))
const canAnswer = computed(() => phase.value === 'played')
const isRoundDone = computed(() => roundSize.value > 0 && roundIndex.value >= roundSize.value)
const roundSizeText = computed(() => (roundSize.value === 0 ? '∞' : String(roundSize.value)))
const roundProgress = computed(() =>
  roundSize.value > 0 ? Math.min(100, Math.round((roundIndex.value / roundSize.value) * 100)) : 0
)
const roundAccText = computed(() =>
  roundIndex.value ? Math.round((roundCorrect.value / roundIndex.value) * 1000) / 10 + '%' : '—'
)
const totalAccText = computed(() =>
  sessionStats.value.acc === null ? '—' : sessionStats.value.acc + '%'
)
const currentRootName = computed(() => (current.value ? midiNameOf(current.value.rootMidi) : '—'))
const correctAnswerText = computed(() => {
  if (!current.value || !current.value.interval) return ''
  return `${current.value.interval.name}（${current.value.semitones} 半音）`
})
const feedbackAnchor = computed(() =>
  current.value && current.value.interval ? current.value.interval.anchor : ''
)

function optionLabelOf(list, v) {
  const found = list.find((o) => o.value === v)
  return found ? found.label : String(v)
}
const rootModeLabel = computed(() => optionLabelOf(ROOT_MODES, rootMode.value))
const playModeLabel = computed(() => optionLabelOf(PLAY_MODES, playMode.value))

const primaryLabel = computed(() => {
  if (phase.value === 'played') return '请作答…'
  if (phase.value === 'answered') return isRoundDone.value ? '查看本轮小结' : '下一题'
  if (phase.value === 'roundDone') return '开始新一轮'
  return '播放题目'
})

// 音程按钮样式：未启用置灰 / 答对的目标绿 / 答错的所选红闪 / 待作答高亮 / 其余收敛
function answerClassOf(iv) {
  if (!iv.enabled) return 'bg-muted/30 border-border/60 text-muted-foreground/40 cursor-not-allowed'
  if (phase.value === 'answered' && current.value && iv.semitones === current.value.semitones) {
    return 'bg-green-500/15 border-green-500/50 text-green-600 ring-1 ring-green-500/30'
  }
  if (
    phase.value === 'answered' &&
    lastJudge.value && !lastJudge.value.correct &&
    selectedSemi.value === iv.semitones
  ) {
    return 'bg-red-500/15 border-red-500/50 text-red-600 animate-flash-red'
  }
  if (phase.value === 'played') {
    return 'bg-background border-border text-foreground hover:bg-primary/10 hover:border-primary/40 cursor-pointer'
  }
  return 'bg-muted/40 border-border text-muted-foreground cursor-default'
}

function isPresetActive(p) {
  return enabledPool.value.length === p.semArrayCheck.length && p.semArrayCheck.every((n) => enabledSet.value.has(n))
}

// ---------- 设置操作 ----------
function toggleSemi(semi) {
  if (enabledSemis.value.includes(semi)) {
    if (enabledSemis.value.length <= 1) return // 至少保留 1 个音程才能出题
    enabledSemis.value = enabledSemis.value.filter((n) => n !== semi)
  } else {
    enabledSemis.value = [...enabledSemis.value, semi]
  }
}

function applyPreset(p) {
  enabledSemis.value = [...p.semArrayCheck]
}

// 调整任意训练设置：重置本轮（历史统计保留）
watch([enabledSemis, rootMode, playMode, roundSize], () => {
  phase.value = 'idle'
  current.value = null
  selectedSemi.value = null
  lastJudge.value = null
  roundIndex.value = 0
  roundCorrect.value = 0
})

// ---------- WebAudio 资源（非响应式，仅在用户回调中触碰，SSR 安全） ----------
let audioCtx = null
let masterGain = null
let activeOscs = [] // 已排程未结束的振荡器，卸载时统一停止

function ensureAudioContext() {
  if (audioCtx) return audioCtx
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  audioCtx = new Ctx() // 仅在用户点击回调中创建（SSR / 自动播放策略安全）
  masterGain = audioCtx.createGain()
  masterGain.gain.value = volume.value / 100
  masterGain.connect(audioCtx.destination)
  return audioCtx
}

function applyVolume() {
  if (masterGain) masterGain.gain.value = volume.value / 100
}
watch(volume, applyVolume)

// 单音：TriangleWave + GainNode 包络（15ms 起音 → 保持 → 尾部 80ms 指数释放）
function playTone(freq, startAt, duration) {
  if (!audioCtx || !masterGain) return
  const osc = audioCtx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.value = freq
  const env = audioCtx.createGain()
  env.gain.setValueAtTime(0.0001, startAt)
  env.gain.exponentialRampToValueAtTime(0.3, startAt + 0.015)
  env.gain.setValueAtTime(0.3, Math.max(startAt + 0.015, startAt + duration - 0.08))
  env.gain.exponentialRampToValueAtTime(0.001, startAt + duration)
  osc.connect(env)
  env.connect(masterGain)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.05)
  activeOscs.push(osc)
  osc.onended = () => {
    const i = activeOscs.indexOf(osc)
    if (i >= 0) activeOscs.splice(i, 1)
  }
}

// 播放当前题：顺序模式根音 1s → 音程音 1s；同时模式两音齐鸣 1.3s（复听不限次）
function scheduleQuestionAudio() {
  const q = current.value
  if (!q) return false
  const ctx = ensureAudioContext()
  if (!ctx) {
    audioError.value = '当前浏览器不支持 WebAudio（缺少 AudioContext），请更换最新版 Chrome / Edge / Safari / Firefox。'
    return false
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  const rootFreq = freqOf(q.rootMidi - 69)      // midi 69 = A4 = 440Hz
  const topFreq = freqOf(q.rootMidi + q.semitones - 69)
  const t0 = ctx.currentTime + 0.08
  if (playMode.value === 'chord') {
    playTone(rootFreq, t0, 1.3)
    playTone(topFreq, t0, 1.3)
  } else {
    playTone(rootFreq, t0, 1.0)
    playTone(topFreq, t0 + 1.0, 1.0)
  }
  return true
}

// ---------- 训练动作 ----------
function playQuestion() {
  audioError.value = ''
  if (!enabledPool.value.length) {
    audioError.value = '请至少勾选 1 个音程再开始训练（左侧「音程范围」）。'
    return
  }
  const rng = mulberry32((Math.random() * 4294967296) >>> 0) // 每题随机种子，训练不可预测；同种子可复现用于测试
  current.value = genQuestion(enabledPool.value, rng, rootMode.value === 'fixed' ? 60 : null)
  selectedSemi.value = null
  lastJudge.value = null
  if (!scheduleQuestionAudio()) return
  phase.value = 'played'
}

function replayQuestion() {
  if (!current.value) return
  audioError.value = ''
  scheduleQuestionAudio()
}

function answer(semi) {
  if (phase.value !== 'played' || !current.value) return
  if (!enabledSet.value.has(semi)) return
  const j = judgeOf(semi, current.value.semitones)
  lastJudge.value = j
  selectedSemi.value = semi
  history.value.push({ semitones: semi, correct: j.correct })
  if (history.value.length > 2000) history.value.splice(0, history.value.length - 2000)
  roundIndex.value += 1
  if (j.correct) {
    streak.value += 1
    roundCorrect.value += 1
    if (streak.value > bestStreak.value) bestStreak.value = streak.value
  } else {
    streak.value = 0
  }
  phase.value = 'answered'
  saveStats()
}

function nextQuestion() {
  if (isRoundDone.value) {
    phase.value = 'roundDone'
    return
  }
  playQuestion()
}

function startRound() {
  roundIndex.value = 0
  roundCorrect.value = 0
  playQuestion()
}

function primaryAction() {
  if (phase.value === 'played') return
  if (phase.value === 'answered') return nextQuestion()
  if (phase.value === 'roundDone') return startRound()
  playQuestion()
}

function clearHistory() {
  history.value = []
  streak.value = 0
  bestStreak.value = 0
  roundIndex.value = 0
  roundCorrect.value = 0
  phase.value = 'idle'
  current.value = null
  selectedSemi.value = null
  lastJudge.value = null
  saveStats()
}

// ---------- localStorage 持久化（训练统计，try/catch 兜底） ----------
const STORAGE_KEY = 'ear-training-trainer-stats'

function loadStats() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (saved && typeof saved === 'object') {
      if (Array.isArray(saved.history)) {
        history.value = saved.history
          .filter((r) => r && Number.isInteger(r.s) && (r.c === 0 || r.c === 1))
          .map((r) => ({ semitones: r.s, correct: r.c === 1 }))
          .slice(-2000)
      }
      if (Number.isInteger(saved.bestStreak) && saved.bestStreak >= 0) bestStreak.value = saved.bestStreak
    }
  } catch {
    /* localStorage 不可用或数据损坏时忽略，使用默认值 */
  }
}

function saveStats() {
  try {
    const compact = history.value.slice(-2000).map((r) => ({ s: r.semitones, c: r.correct ? 1 : 0 }))
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ history: compact, bestStreak: bestStreak.value }))
  } catch {
    /* 写入失败（隐私模式 / 配额满）时静默忽略 */
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  loadStats()
  addRecentTool('ear-training-trainer')
})

onBeforeUnmount(() => {
  // 1) 停掉所有仍在发声 / 已排程的振荡器（停音）
  const oscs = activeOscs.splice(0, activeOscs.length)
  for (const o of oscs) {
    try { o.stop() } catch { /* 已停止则忽略 */ }
  }
  // 2) 断开并释放主增益节点
  if (masterGain) {
    try { masterGain.disconnect() } catch { /* 已断开则忽略 */ }
    masterGain = null
  }
  // 3) 关闭并释放 AudioContext
  if (audioCtx) {
    try { audioCtx.close() } catch { /* 已关闭则忽略 */ }
    audioCtx = null
  }
})
</script>

<style scoped>
/* 答错的红色闪动：仅播放一次（红底 + 红色光晕渐隐），提示但不刺眼 */
.animate-flash-red {
  animation: flash-red 0.6s ease-out 1;
}
@keyframes flash-red {
  0% {
    background-color: rgba(239, 68, 68, 0.35);
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25);
  }
  100% {
    background-color: rgba(239, 68, 68, 0.1);
    box-shadow: none;
  }
}
</style>
