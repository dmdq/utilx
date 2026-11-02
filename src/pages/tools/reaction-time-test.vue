<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Zap class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">反应速度测试</h1>
          <p class="text-sm text-muted-foreground mt-1">5 轮视觉简单反应测试，毫秒级计时、平均/最佳/最差统计与等级评定，看看你的手速离电竞选手有多远</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线反应速度测试（reaction time test）工具：测试区先变红进入随机 1.2-4.5 秒的等待期，变绿的一瞬间立刻点击（或按空格），
        工具用「点击事件时间戳 − 变绿帧时间戳」计算毫秒级反应时间，共 5 轮取平均并给出最佳、最差与等级评定。
        提前点击判为抢跑作废重测，绿灯后 3 秒未点击判为超时重测，防作弊防误计；历史成绩只保存在本机浏览器，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：统计面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Timer class="w-5 h-5 mr-2 text-primary" /> 测试统计
        </h2>

        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">本轮进度</p>
          <p class="text-2xl font-bold text-primary">{{ completedCount }} / {{ TOTAL_ROUNDS }} 轮</p>
          <p class="text-xs text-muted-foreground mt-1">{{ sessionStateText }}</p>
        </div>

        <div class="grid grid-cols-2 gap-2 text-center">
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">本轮平均</p>
            <p class="text-sm font-bold text-foreground tabular-nums">{{ sessionAvgText }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">本轮最佳</p>
            <p class="text-sm font-bold text-foreground tabular-nums">{{ sessionBestText }}</p>
          </div>
        </div>

        <!-- 历史记录卡 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-foreground">历史记录（最近 {{ HISTORY_LIMIT }} 组）</p>
            <button
              @click="clearHistory"
              :disabled="!history.length"
              class="text-xs text-muted-foreground hover:text-red-500 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-muted-foreground"
            >
              清空
            </button>
          </div>
          <div v-if="history.length" class="space-y-1.5 max-h-56 overflow-y-auto">
            <div
              v-for="(h, i) in history"
              :key="h.t + '-' + i"
              class="flex items-center justify-between gap-2 text-xs bg-muted/40 rounded px-2.5 py-1.5"
            >
              <span class="text-muted-foreground tabular-nums">{{ formatHistoryTime(h.t) }}</span>
              <span class="font-semibold text-foreground tabular-nums">平均 {{ h.avg.toFixed(1) }} ms</span>
              <span class="text-muted-foreground tabular-nums">最佳 {{ h.best }} ms</span>
            </div>
          </div>
          <p v-else class="text-xs text-muted-foreground bg-muted/40 rounded px-2.5 py-2 leading-relaxed">
            还没有历史记录。完成一组 5 轮测试后，平均成绩会自动保存在本机浏览器的 localStorage 中，清除浏览器数据才会删除。
          </p>
        </div>

        <p
          class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5"
          :class="earlyStreak >= EARLY_WARN_STREAK ? 'bg-red-500/10' : ''"
        >
          <TriangleAlert v-if="earlyStreak >= EARLY_WARN_STREAK" class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          <Info v-else class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span>{{ panelHint }}</span>
        </p>
      </div>

      <!-- 右：大测试区（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Zap class="w-5 h-5 mr-2 text-primary" /> 反应测试区
          </h2>
          <span class="inline-block px-2.5 py-0.5 rounded-full border text-xs font-medium" :class="phaseMeta[phase].class">
            {{ phaseMeta[phase].label }}
          </span>
        </div>

        <!-- 大块状态区：红=等待 绿=可点击，全区域可点击（键盘空格/回车亦可） -->
        <div
          ref="areaRef"
          class="relative w-full h-[380px] rounded-xl border-2 select-none touch-none outline-none transition-colors duration-150 cursor-pointer"
          :class="areaClass"
          tabindex="0"
          role="button"
          aria-label="反应速度测试区：变绿后立即点击或按空格"
        >
          <!-- idle：待开始 -->
          <div v-if="phase === 'idle'" class="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
            <Play class="w-12 h-12 text-primary/40" />
            <p class="text-xl font-bold text-foreground">{{ interrupted && completedCount > 0 ? '页面切走，本轮已中止' : '准备好了吗？' }}</p>
            <p class="text-sm text-muted-foreground max-w-md leading-relaxed">
              点击「开始测试」后区域变红、随机 1.2-4.5 秒后变绿，变绿的瞬间立刻点击（按空格 / 回车也可以）。
              共 {{ TOTAL_ROUNDS }} 轮取平均，提前点击视为抢跑。
            </p>
            <button
              @click="startTest"
              @pointerdown.stop
              class="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-base font-semibold hover:opacity-90 transition flex items-center gap-2"
            >
              <Play class="w-5 h-5" /> {{ idleButtonLabel }}
            </button>
          </div>

          <!-- waiting：等待变绿（红 muted） -->
          <div v-else-if="phase === 'waiting'" class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
            <Timer class="w-12 h-12 text-red-500/70" />
            <p class="text-3xl sm:text-4xl font-extrabold text-red-600">等待变绿…</p>
            <p class="text-sm font-medium text-red-600/80">不要提前点击！提前点击本轮作废重测</p>
          </div>

          <!-- ready：立刻点击（绿） -->
          <div v-else-if="phase === 'ready'" class="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Zap class="w-14 h-14 text-green-600" />
            <p class="text-5xl sm:text-6xl font-extrabold text-green-600">现在！</p>
            <p class="text-sm font-medium text-green-700/80">立刻点击 / 按空格</p>
          </div>

          <!-- result：本轮结果（有效成绩显示特大数字） -->
          <div v-else-if="phase === 'result'" class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
            <template v-if="lastResult && lastResult.kind === 'valid'">
              <p class="text-xs text-muted-foreground">本次反应时间</p>
              <p class="text-7xl font-extrabold text-foreground tabular-nums leading-none">
                {{ lastResult.ms }}<span class="text-2xl font-bold text-muted-foreground ml-2">ms</span>
              </p>
              <p class="text-sm text-muted-foreground">等级：{{ gradeOf(lastResult.ms) }}</p>
            </template>
            <template v-else-if="lastResult && lastResult.kind === 'early'">
              <TriangleAlert class="w-12 h-12 text-amber-500" />
              <p class="text-3xl font-extrabold text-amber-600">太早了！重来</p>
              <p class="text-sm text-muted-foreground">绿灯亮起前点击视为抢跑，本轮不计成绩，即将重测第 {{ attemptSlot + 1 }} 轮</p>
              <p v-if="earlyStreak >= EARLY_WARN_STREAK" class="text-sm font-medium text-red-600">疑似刷分，请认真测试（连续抢跑不会得到任何成绩）</p>
            </template>
            <template v-else>
              <Timer class="w-12 h-12 text-amber-500" />
              <p class="text-3xl font-extrabold text-amber-600">超时了！该轮重测</p>
              <p class="text-sm text-muted-foreground">绿灯亮起后 {{ READY_TIMEOUT_MS / 1000 }} 秒内没有点击，本轮作废，即将重测</p>
            </template>
          </div>

          <!-- summary：本组完成 -->
          <div v-else class="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-center px-6 overflow-y-auto py-3">
            <p class="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle class="w-4 h-4 text-green-500" /> {{ TOTAL_ROUNDS }} 轮测试完成，成绩已存入历史记录
            </p>
            <p class="text-5xl font-extrabold text-primary tabular-nums leading-none">
              {{ summaryView.avgText }}<span class="text-xl font-bold text-muted-foreground ml-2">ms</span>
            </p>
            <span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full border text-sm font-semibold bg-primary/10 text-primary border-primary/20">
              <Trophy class="w-3.5 h-3.5" /> {{ summaryView.grade }}
            </span>
            <p class="text-xs text-muted-foreground">最佳 {{ summaryView.best }} ms · 最差 {{ summaryView.worst }} ms</p>
            <div class="w-full max-w-sm">
              <p class="text-[10px] text-muted-foreground mb-1">5 轮成绩分布（柱越矮反应越快）</p>
              <div class="flex items-end justify-center gap-3 h-16">
                <div v-for="(b, i) in summaryView.bars" :key="i" class="flex flex-col items-center justify-end h-full">
                  <span class="text-[10px] text-muted-foreground tabular-nums mb-0.5">{{ b.ms }}</span>
                  <div class="w-8 rounded-t bg-primary/70" :style="{ height: b.pct + '%' }"></div>
                  <span class="text-[10px] text-muted-foreground mt-1">R{{ i + 1 }}</span>
                </div>
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground max-w-md leading-relaxed">{{ summaryView.note }}</p>
            <button
              @click="startTest"
              @pointerdown.stop
              class="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition flex items-center gap-2"
            >
              <RefreshCw class="w-4 h-4" /> 重新开始
            </button>
          </div>
        </div>

        <!-- 进度点 + 每轮结果 chips -->
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted-foreground">
            已完成 <span class="font-semibold text-foreground tabular-nums">{{ completedCount }}</span> / {{ TOTAL_ROUNDS }} 轮
          </p>
          <div class="flex items-center gap-1.5">
            <span v-for="(r, i) in roundResults" :key="'dot-' + i" class="w-2.5 h-2.5 rounded-full" :class="dotClass(i)"></span>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(r, i) in roundResults"
            :key="'chip-' + i"
            class="px-2 py-0.5 rounded-full border text-xs font-medium tabular-nums"
            :class="chipClassOf(r)"
          >
            第{{ i + 1 }}轮 · {{ chipLabelOf(r) }}
          </span>
        </div>

        <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span>屏幕刷新率与显示器延迟会影响结果约 5-20ms；无线鼠标接收器延迟也会叠加。要刷新纪录请固定设备多次测试。</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>反应速度测试是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          反应速度测试（reaction time test）是一款在线视觉简单反应测试工具。点击开始后，测试区先显示红色进入等待期（随机持续 1.2-4.5 秒），
          在不可预测的瞬间变成绿色并开始计时；你点击（或按空格）的一刻，工具用「点击事件时间戳 − 变绿帧时间戳」计算间隔，精确到毫秒。
          共测 5 轮取平均值，并给出最佳、最差与等级评定。提前点击会被判为抢跑作废重测，绿灯后 3 秒未点击判为超时重测，
          连续抢跑会收到认真测试的提示。所有过程在浏览器本地完成，历史成绩只保存在你自己的设备上。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">反应速度怎么测？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本工具测的是「视觉简单反应时」：单一刺激（屏幕变绿）、单一反应（点击），中间不涉及选择与判断。完整的通路是：
          视网膜接收到颜色变化 → 信号传入大脑视觉皮层 → 确认「变了」 → 运动皮层下发指令 → 手部肌肉按下按键，
          这条神经通路的固有传导约需 150-250ms，因此它是衡量人机反应能力的经典口径。测试时建议盯住测试区中央、手悬停在鼠标上方、
          屏幕亮度适中，5 轮取平均可以抵消单次抖动；连续多组测试时组间休息几秒，避免注意力涣散拉高成绩。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">人的平均反应时间是多少？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          参考口径：健康成年人对视觉刺激的简单反应平均约 250-270ms，多数人落在 200-300ms 之间。年龄有影响——青少年与二十多岁通常最快，
          之后随年龄缓慢上升；睡眠不足会显著拖慢反应（连续熬夜的下降幅度相当可观）；适量咖啡因摄入后约 30 分钟可小幅改善，过量反而手抖变慢。
          本工具把 ≤310ms 判为「平均水平」，就是围绕这个口径并给设备延迟留了余量。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">电竞选手反应多少？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          参考口径：职业电竞选手（FPS / MOBA 项目）的视觉简单反应常见在 150-200ms，顶尖选手状态好时可逼近 140-150ms，
          本工具把 ≤180ms 判为「电竞级」。但要注意：比赛中的真实操作包含选择反应与决策时间，远比简单反应慢；
          职业选手的优势更多来自数千小时专项训练形成的预判与肌肉记忆，而不只是先天手速，普通玩家不必用职业口径苛求自己。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么提高反应速度？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>睡眠优先：保证 7-9 小时规律睡眠。缺觉是拖慢反应最快的因素，补足睡眠往往比任何练习见效都快。</li>
          <li>规律运动：每周 3 次以上中等强度有氧运动，改善神经传导与专注力，长期坚持通常能看到可感知的提升。</li>
          <li>减少设备延迟：换有线鼠标或 1000Hz 回报率设备、使用高刷新率（120Hz 以上）显示器、关闭多余的画面处理，能白捡 10-40ms 的「硬件反应」。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">测试结果受什么设备影响？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          影响从大到小：显示器——60Hz 屏幕每帧 16.7ms，从变绿指令到像素发光平均有约 8-25ms 延迟，高刷新率屏幕明显更低；
          鼠标——无线 125Hz 回报率平均增加约 4ms，蓝牙可达 10ms 以上，有线 1000Hz 约 1ms；
          浏览器与系统——后台高负载时主线程阻塞会让结果偏大。因此同一台设备上的多次对比才有意义，跨设备比较请固定显示器与鼠标。
          本工具用事件时间戳计时，已消除 JS 主线程阻塞带来的大部分误差。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">反应速度测试怎么测才准？</h3>
            <p class="text-sm text-muted-foreground mt-1">盯住测试区中央、手保持悬停，环境安静、坐姿放松，连测几组取平均。变绿前抢跑或绿灯后 3 秒未点击的轮次会被自动作废重测，不会污染成绩；换设备前后成绩不可直接比较。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">人的平均反应时间是多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">健康成年人对视觉刺激的简单反应平均约 250-270ms，多数人在 200-300ms 之间；睡眠不足、疲劳与年龄增长都会拖慢，职业电竞选手常见 150-200ms。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么我的成绩波动很大？</h3>
            <p class="text-sm text-muted-foreground mt-1">单次反应本来就有 ±20-40ms 的自然波动，叠加眨眼、分心与设备延迟差异。请看 5 轮平均而不是单轮最好成绩，并在固定设备、固定时段多次测试后再下结论。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">测试数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。计时与统计全部在浏览器本地完成，历史成绩只保存在你设备浏览器的 localStorage 中，点击「清空」或清除浏览器数据即可删除。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'reaction-time-test'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Zap, Timer, Trophy, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '反应速度测试 - 在线反应时间/手速测试工具',
  description: '免费在线反应速度测试工具，5 轮视觉简单反应测试、毫秒级精准计时、平均/最佳/最差统计与等级评定，对比人类平均 250-270ms 与电竞选手 150-200ms 参考口径，抢跑超时自动判定，纯浏览器本地运行不上传',
  keywords: '反应速度测试,reaction time test,反应时间,手速测试,反应时间测试,视觉反应测试,电竞反应速度,reaction time',
  author: '有条工具',
  ogTitle: '反应速度测试 - 在线反应时间/手速测试工具 | 有条工具',
  ogDescription: '5 轮视觉简单反应测试，毫秒级计时与等级评定，测测你的手速离电竞选手有多远。',
  ogUrl: 'https://www.util.cn/tools/reaction-time-test',
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
          name: '反应速度测试',
          url: 'https://www.util.cn/tools/reaction-time-test',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['5 轮视觉简单反应测试', '毫秒级精准计时（事件时间戳口径）', '抢跑与超时自动判定重测', '平均/最佳/最差统计与等级评定', '5 轮成绩分布图', '本地历史记录（最近 20 组）', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '反应速度测试', item: 'https://www.util.cn/tools/reaction-time-test/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '反应速度测试怎么测才准？',
              acceptedAnswer: { '@type': 'Answer', text: '盯住测试区中央、手保持悬停，环境安静、坐姿放松，连测几组取平均。变绿前抢跑或绿灯后3秒未点击的轮次会被自动作废重测，不会污染成绩；换设备前后成绩不可直接比较。' }
            },
            {
              '@type': 'Question',
              name: '人的平均反应时间是多少？',
              acceptedAnswer: { '@type': 'Answer', text: '健康成年人对视觉刺激的简单反应平均约250-270ms，多数人在200-300ms之间；睡眠不足、疲劳与年龄增长都会拖慢，职业电竞选手常见150-200ms。' }
            },
            {
              '@type': 'Question',
              name: '为什么我的成绩波动很大？',
              acceptedAnswer: { '@type': 'Answer', text: '单次反应本来就有±20-40ms的自然波动，叠加眨眼、分心与设备延迟差异。请看5轮平均而不是单轮最好成绩，并在固定设备、固定时段多次测试后再下结论。' }
            },
            {
              '@type': 'Question',
              name: '测试数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。计时与统计全部在浏览器本地完成，历史成绩只保存在你设备浏览器的localStorage中，点击清空或清除浏览器数据即可删除。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const TOTAL_ROUNDS = 5        // 每组测试轮数
const DELAY_MIN = 1200        // 变绿前随机延迟下限（ms）
const DELAY_MAX = 4500        // 变绿前随机延迟上限（ms）
const READY_TIMEOUT_MS = 3000 // 绿灯后未点击判超时的阈值（ms）
const EARLY_WARN_STREAK = 3   // 连续抢先多少次提示疑似刷分
const RESULT_PAUSE_MS = 1400  // 单轮结果展示时长，之后自动进入下一轮
const HISTORY_LIMIT = 20      // 本地最多保存的历史组数
const STORAGE_KEY = 'reaction-time-test'

// [min, max] 闭区间随机整数（注入 rand 便于单测）
function delayInRange(min, max, rand = Math.random) {
  if (max < min) return min
  return min + Math.floor(rand() * (max - min + 1))
}

// 一组成绩的统计：平均（1 位小数）/最佳（最小）/最差（最大）/有效轮数
function statsOf(times) {
  const list = (Array.isArray(times) ? times : []).filter((ms) => typeof ms === 'number' && isFinite(ms))
  if (!list.length) return { avg: null, best: null, worst: null, count: 0 }
  const sum = list.reduce((s, ms) => s + ms, 0)
  return {
    avg: Math.round((sum / list.length) * 10) / 10,
    best: Math.min(...list),
    worst: Math.max(...list),
    count: list.length
  }
}

// 等级评定（对单轮成绩或平均成绩均可）
function gradeOf(ms) {
  if (typeof ms !== 'number' || !isFinite(ms)) return null
  if (ms <= 180) return '电竞级'
  if (ms <= 220) return '优秀'
  if (ms <= 260) return '良好'
  if (ms <= 310) return '平均水平'
  return '偏慢'
}

// 按平均成绩生成一段对照文案（旁注口径：人类视觉简单反应平均约 250-270ms）
function benchmarkNoteOf(avg) {
  if (typeof avg !== 'number' || !isFinite(avg)) return ''
  if (avg <= 180) return '已达职业电竞选手常见的 150-200ms 区间，视觉通路与手部动作都非常快，保持作息即可。'
  if (avg <= 220) return '明显快于人类 250-270ms 的平均口径，处于同龄人中的优秀水平，适合竞速类游戏。'
  if (avg <= 260) return '略快于 250-270ms 的平均口径，属于正常偏好的水平，规律作息与练习还能再快一点。'
  if (avg <= 310) return '基本落在人类 250-270ms 平均口径附近（含设备延迟），属于平均水平，睡眠充足时通常会有提升。'
  return '慢于 250-270ms 的平均口径较多，先排查设备延迟（无线鼠标 / 60Hz 屏幕），再检查是否疲劳或分心。'
}

// 点击发生时按状态机状态判定该次点击的性质：waiting=抢跑、ready=有效、其余状态忽略
function classifyClick(phase) {
  if (phase === 'waiting') return 'early'
  if (phase === 'ready') return 'valid'
  return 'ignore'
}

// 是否抢跑（由状态机状态唯一决定）
function isEarly(phase) {
  return classifyClick(phase) === 'early'
}

// 计时口径说明：为什么用「事件 e.timeStamp」而不是在处理器里重新调 performance.now()？
// e.timeStamp 在事件被生成（入队）的那一刻就打上了时间戳，与 performance.now() / rAF 时间戳同属
// time origin 时钟基准；而处理器里重取 performance.now() 得到的是「处理器真正开始执行」的时刻，
// 中间隔着浏览器主线程的事件排队与阻塞——页面卡顿时这段误差可达几十毫秒，会把卡顿误算进反应时间。
// 用 t0（变绿那一帧的 rAF 时间戳）与 e.timeStamp 做差，得到的是两次「硬件时刻」的真实间隔。
// 反应时间 = 点击事件时间戳 − 变绿时间戳，取整且至少 1ms（防御时钟抖动）
function reactionMsOf(t0, eventTs) {
  if (typeof t0 !== 'number' || typeof eventTs !== 'number') return null
  return Math.max(1, Math.round(eventTs - t0))
}

// 5 轮分布柱高（占组内最大值的百分比，钳制在 8-88%，给柱顶数字留空间）
function barPercents(times) {
  const list = (Array.isArray(times) ? times : []).filter((ms) => typeof ms === 'number' && isFinite(ms))
  if (!list.length) return []
  const max = Math.max(...list) || 1
  return list.map((ms) => ({
    ms,
    pct: Math.max(8, Math.min(88, Math.round((ms / max) * 100)))
  }))
}

// 历史记录时间格式化：YYYY-MM-DD HH:mm（本地时区）
function formatHistoryTime(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ---------- 状态机状态 ----------
// idle → waiting（红，随机延迟）→ ready（绿，记 t0）→ result（展示/抢跑/超时）→ 下一轮 → summary
const phase = ref('idle')
const roundResults = ref(new Array(TOTAL_ROUNDS).fill(null)) // 每个槽位最近一次尝试：{ kind: 'valid'|'early'|'timeout', ms }
const roundTimes = ref([])   // 有效的 5 轮成绩（ms）
const attemptSlot = ref(0)   // 当前进行到的轮次槽位（0 起）
const lastResult = ref(null) // result 阶段展示的最近一次结果
const earlyStreak = ref(0)   // 连续抢跑次数（有效轮完成即清零）
const interrupted = ref(false) // 页面切走导致回合中止
const history = ref([])      // 历史记录（只读自 localStorage，见 onMounted）
const seoContentVisible = ref(true)

// 非响应式内部计时句柄
let pendingTimer = null   // waiting → ready 的随机延迟
let readyTimer = null     // ready 后 3 秒超时
let advanceTimer = null   // result 展示后自动推进
let rafId = null          // 捕获变绿帧时间戳的 rAF
let t0 = null             // 变绿那一帧的时间戳（rAF 入参）
let readyFallbackTs = null // 兜底：rAF 回调前就被点击时，用 setTimeout 时刻

const phaseMeta = {
  idle: { label: '待开始', class: 'bg-muted text-muted-foreground border-border' },
  waiting: { label: '等待变绿', class: 'bg-red-500/10 text-red-600 border-red-500/20' },
  ready: { label: '点击！', class: 'bg-green-500/10 text-green-600 border-green-500/20' },
  result: { label: '本轮结束', class: 'bg-primary/10 text-primary border-primary/20' },
  summary: { label: '测试完成', class: 'bg-green-500/10 text-green-600 border-green-500/20' }
}

const completedCount = computed(() => roundTimes.value.length)

const sessionStats = computed(() => statsOf(roundTimes.value))
const sessionAvgText = computed(() => {
  const s = sessionStats.value
  return s.count ? s.avg.toFixed(1) + ' ms' : '—'
})
const sessionBestText = computed(() => {
  const s = sessionStats.value
  return s.count ? s.best + ' ms' : '—'
})
const sessionStateText = computed(() => {
  if (phase.value === 'summary') return '本组已完成，成绩已入历史'
  if (phase.value === 'idle') return interrupted.value ? '回合已中止，可继续或重开' : '点击「开始测试」开始'
  return `第 ${Math.min(attemptSlot.value + 1, TOTAL_ROUNDS)} 轮进行中`
})

const summaryView = computed(() => {
  if (phase.value !== 'summary') return null
  const s = statsOf(roundTimes.value)
  if (s.count === 0) return null
  return {
    avgText: s.avg.toFixed(1),
    best: s.best,
    worst: s.worst,
    grade: gradeOf(s.avg),
    note: benchmarkNoteOf(s.avg),
    bars: barPercents(roundTimes.value)
  }
})

const areaClass = computed(() => {
  switch (phase.value) {
    case 'waiting':
      return 'bg-red-500/10 border-red-500/40'
    case 'ready':
      return 'bg-green-500/20 border-green-500/60'
    case 'result':
      return lastResult.value && lastResult.value.kind === 'valid'
        ? 'bg-primary/5 border-primary/30'
        : 'bg-amber-500/10 border-amber-500/40'
    case 'summary':
      return 'bg-muted/40 border-border'
    default:
      return 'bg-background border-primary/40 border-dashed'
  }
})

const idleButtonLabel = computed(() =>
  interrupted.value && completedCount.value > 0 ? '继续测试' : '开始测试'
)

const panelHint = computed(() => {
  if (earlyStreak.value >= EARLY_WARN_STREAK) {
    return `已连续抢先 ${earlyStreak.value} 次，疑似刷分，请认真测试。连续抢跑不会得到任何成绩，只会浪费时间。`
  }
  return '抢跑与超时的轮次不计入成绩、自动重测；绿灯亮起前保持放松，看到绿色再点击。'
})

// ---------- 状态机流转 ----------
function clearAllTimers() {
  if (pendingTimer !== null) { clearTimeout(pendingTimer); pendingTimer = null }
  if (readyTimer !== null) { clearTimeout(readyTimer); readyTimer = null }
  if (advanceTimer !== null) { clearTimeout(advanceTimer); advanceTimer = null }
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
}

function resetSession() {
  clearAllTimers()
  roundResults.value = new Array(TOTAL_ROUNDS).fill(null)
  roundTimes.value = []
  attemptSlot.value = 0
  earlyStreak.value = 0
  lastResult.value = null
  t0 = null
  readyFallbackTs = null
}

// 开始/重新开始：页面切走中止过且有已完成轮次时，保留进度从当前轮继续
function startTest() {
  if (interrupted.value && roundTimes.value.length > 0) {
    interrupted.value = false
    if (roundTimes.value.length >= TOTAL_ROUNDS) { finishTest(); return } // 第 5 轮已记完，直接结算
    startWaiting()
    return
  }
  resetSession()
  interrupted.value = false
  startWaiting()
}

function startWaiting() {
  clearAllTimers()
  phase.value = 'waiting'
  t0 = null
  readyFallbackTs = null
  pendingTimer = setTimeout(flipToReady, delayInRange(DELAY_MIN, DELAY_MAX))
}

function flipToReady() {
  pendingTimer = null
  // 变绿瞬间：setTimeout 回调只是逻辑上切状态，绿色真正「被看到」要等下一帧绘制。
  // requestAnimationFrame 的回调在该帧绘制之前执行，其入参时间戳就是这一帧的 vsync 时刻，
  // 与像素真正变绿的时刻几乎重合，比 setTimeout 回调里的 performance.now() 更接近「看到绿色」的物理时刻。
  readyFallbackTs = performance.now() // 兜底：极端阻塞下 rAF 尚未回调就被点击，退化为定时器触发时刻
  phase.value = 'ready'
  rafId = requestAnimationFrame((ts) => {
    t0 = ts
    rafId = null
  })
  readyTimer = setTimeout(markTimeout, READY_TIMEOUT_MS)
}

// 有效点击：e.timeStamp − t0（见 reactionMsOf 上方注释）
function recordReaction(eventTs) {
  if (readyTimer !== null) { clearTimeout(readyTimer); readyTimer = null }
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
  const base = t0 !== null ? t0 : readyFallbackTs
  const ms = reactionMsOf(base, eventTs)
  if (ms === null) { markTimeout(); return } // 防御：拿不到起始时间视为该轮超时重测
  earlyStreak.value = 0
  roundTimes.value = [...roundTimes.value, ms]
  setResult({ kind: 'valid', ms })
}

function markEarly() {
  if (pendingTimer !== null) { clearTimeout(pendingTimer); pendingTimer = null }
  earlyStreak.value += 1
  setResult({ kind: 'early', ms: null })
}

function markTimeout() {
  readyTimer = null
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
  setResult({ kind: 'timeout', ms: null })
}

function setResult(marker) {
  roundResults.value = roundResults.value.map((v, i) => (i === attemptSlot.value ? marker : v))
  lastResult.value = marker
  phase.value = 'result'
  advanceTimer = setTimeout(advanceAfterResult, RESULT_PAUSE_MS)
}

function advanceAfterResult() {
  advanceTimer = null
  if (roundTimes.value.length >= TOTAL_ROUNDS) { finishTest(); return }
  if (lastResult.value && lastResult.value.kind === 'valid') {
    attemptSlot.value = roundTimes.value.length
  }
  startWaiting()
}

function finishTest() {
  phase.value = 'summary'
  attemptSlot.value = TOTAL_ROUNDS
  const s = statsOf(roundTimes.value)
  if (s.count > 0) {
    history.value = [{ t: Date.now(), avg: s.avg, best: s.best }, ...history.value].slice(0, HISTORY_LIMIT)
    saveHistory()
  }
}

// ---------- 输入处理（监听在 onMounted 注册，SSR 安全） ----------
const areaRef = ref(null)

function handleAreaPointerDown(e) {
  if (e.button !== 0) return // 只认主键（左键 / 触摸 / 触控笔主键）
  handleActivate(e.timeStamp)
}

function handleKeyActivate(e) {
  if (e.key !== ' ' && e.key !== 'Enter') return
  // 焦点在区域内按钮上时保持原生键盘行为
  if (e.target && typeof e.target.closest === 'function' && e.target.closest('button')) return
  e.preventDefault()
  handleActivate(e.timeStamp)
}

function handleActivate(eventTs) {
  if (phase.value === 'idle') { startTest(); return }
  const kind = classifyClick(phase.value)
  if (kind === 'early') markEarly()
  else if (kind === 'valid') recordReaction(eventTs)
  // result / summary：忽略（result 自动推进，summary 用按钮操作）
}

function preventDefaultHandler(e) {
  e.preventDefault()
}

// 切走页面时定时器会被节流/挂起，任何未完成的回合一律作废，防止把挂起时间误计成成绩
function handleVisibilityChange() {
  if (document.visibilityState !== 'hidden') return
  if (phase.value === 'waiting' || phase.value === 'ready' || phase.value === 'result') {
    clearAllTimers()
    lastResult.value = null
    t0 = null
    readyFallbackTs = null
    interrupted.value = true
    phase.value = 'idle'
  }
}

// ---------- localStorage（读写均 try/catch，读只在 onMounted） ----------
function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return
    history.value = parsed
      .filter((it) => it && typeof it.t === 'number' && typeof it.avg === 'number' && typeof it.best === 'number')
      .slice(0, HISTORY_LIMIT)
  } catch (e) { /* 忽略损坏或不可用的本地存储 */ }
}

function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
  } catch (e) { /* 隐私模式 / 配额不足等场景静默降级为仅内存 */ }
}

function clearHistory() {
  history.value = []
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) { /* 忽略 */ }
}

// ---------- 展示辅助 ----------
function dotClass(i) {
  if (i < completedCount.value) return 'bg-green-500'
  if (i === completedCount.value && (phase.value === 'waiting' || phase.value === 'ready' || phase.value === 'result')) {
    return 'bg-primary animate-pulse'
  }
  return 'bg-muted border border-border'
}

function chipClassOf(r) {
  if (!r) return 'bg-muted/50 text-muted-foreground border-border'
  if (r.kind === 'valid') return 'bg-green-500/10 text-green-600 border-green-500/20'
  if (r.kind === 'early') return 'bg-red-500/10 text-red-600 border-red-500/20'
  return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
}

function chipLabelOf(r) {
  if (!r) return '待测'
  if (r.kind === 'valid') return r.ms + ' ms'
  if (r.kind === 'early') return '抢先'
  return '超时'
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  const area = areaRef.value
  if (area) {
    area.addEventListener('pointerdown', handleAreaPointerDown)
    area.addEventListener('keydown', handleKeyActivate)
    // 测试中右键 / 长按弹出菜单会打断节奏，直接拦截
    area.addEventListener('contextmenu', preventDefaultHandler)
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)

  loadHistory()
  addRecentTool('reaction-time-test')
})

onBeforeUnmount(() => {
  const area = areaRef.value
  if (area) {
    area.removeEventListener('pointerdown', handleAreaPointerDown)
    area.removeEventListener('keydown', handleKeyActivate)
    area.removeEventListener('contextmenu', preventDefaultHandler)
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  clearAllTimers()
})
</script>
