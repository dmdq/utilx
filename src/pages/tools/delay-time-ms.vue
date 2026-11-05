<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Music class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">BPM 延时换算计算器（Delay Time ms）</h1>
          <p class="text-sm text-muted-foreground mt-1">音符时值全表 · 附点 / 三连音 · 反向求 BPM · 混音延迟与预延迟注记</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 BPM 到毫秒延时换算工具：输入歌曲速度（预设 60–174 BPM 或自定义），一次给出全音符到六十四分音符的直拍、附点、三连音三列时值（ms），
        支持反向「给目标毫秒数求对应 BPM」，并附混音应用注记（延迟时间选四分 / 附点、预延迟 1/64 或独立 10–40ms、混响预延迟参考）。
        适用于混音、现场调音、MIDI 编曲与效果器设置；全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <div class="flex items-start gap-2 bg-muted/60 border border-border rounded-lg p-3 mb-6 text-xs text-muted-foreground leading-relaxed">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>口径：四分音符时值 ms = 60000 ÷ BPM；附点 = ×1.5，三连音 = ×2/3。预延迟（Pre-delay）通常不需要跟 BPM——常用 1/64 时值或独立的 10–40ms。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：输入面板（侧栏） -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 速度参数
        </h2>

        <!-- BPM 输入 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">歌曲速度 BPM（拍/分钟）</p>
          <input v-model="bpmIn" type="number" step="1" min="1" max="999" @change="saveState" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 120" />
          <p v-if="bpmError" class="text-xs text-red-500 mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {{ bpmError }}
          </p>
        </div>

        <!-- BPM 预设 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">常用速度预设</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in BPM_PRESETS" :key="preset"
              @click="applyBpm(preset)"
              class="px-3 py-1.5 rounded-lg border text-sm font-medium transition"
              :class="bpmText === String(preset) ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'"
            >{{ preset }}</button>
          </div>
          <p class="text-[10px] text-muted-foreground mt-2">60 慢速民谣 · 90 老派 Hip-Hop · 128 House · 174 Drum&Bass，其余为流行 / 摇滚常见区间锚点。</p>
        </div>

        <!-- 反向换算 -->
        <div class="pt-1 border-t border-border">
          <p class="text-sm font-medium text-foreground mb-1.5 mt-3">反向：给毫秒求 BPM</p>
          <p class="text-[10px] text-muted-foreground mb-2">目标时值对应哪个音符，就按哪个口径反推</p>
          <div class="flex items-center gap-2">
            <input v-model="revMsIn" type="number" step="1" min="1" max="60000" @change="saveState" class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="目标毫秒，如 250" />
            <span class="text-xs text-muted-foreground flex-shrink-0">ms</span>
          </div>
          <select v-model="revDiv" @change="saveState" class="w-full mt-2 px-2.5 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option v-for="d in NOTE_DIVISIONS" :key="d.id" :value="d.id">{{ d.name }}口径</option>
          </select>
          <p v-if="revMsError" class="text-xs text-red-500 mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {{ revMsError }}
          </p>
        </div>

        <button
          @click="resetAll"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置全部参数
        </button>
      </div>

      <!-- 右：结果面板（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 结论卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Timer class="w-5 h-5 mr-2 text-primary" /> 速度速览
          </h2>
          <div v-if="bpm !== null" class="bg-muted/40 border border-border rounded-lg p-5">
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-card border border-border rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">当前 BPM</p>
                <p class="text-4xl font-bold text-primary">{{ fmt(bpm, 0) }}</p>
                <p class="text-[10px] text-muted-foreground mt-1 font-mono">拍 / 分钟</p>
              </div>
              <div class="bg-card border border-border rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">四分音符（一拍）</p>
                <p class="text-4xl font-bold text-primary">{{ fmtMs(quarterMs) }}<span class="text-lg font-semibold text-muted-foreground">ms</span></p>
                <p class="text-[10px] text-muted-foreground mt-1 font-mono">60000 ÷ BPM</p>
              </div>
              <div class="bg-card border border-border rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">附点八分（经典延迟）</p>
                <p class="text-4xl font-bold text-primary">{{ fmtMs(dottedEighthMs) }}<span class="text-lg font-semibold text-muted-foreground">ms</span></p>
                <p class="text-[10px] text-muted-foreground mt-1 font-mono">×1.5</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground text-center mt-3">混音口诀：延迟时间常用四分或附点八分；预延迟另算，见下方注记卡。</p>
          </div>
          <div v-else class="p-8 text-center text-sm text-muted-foreground bg-muted/40 border border-border rounded-lg">
            请输入有效的 BPM（1–999）生成时值全表
          </div>
        </div>

        <!-- 全表 -->
        <div v-if="bpm !== null" class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ListMusic class="w-5 h-5 mr-2 text-primary" /> 音符时值全表（{{ fmt(bpm, 0) }} BPM）
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-[10px] text-muted-foreground">
                <tr class="border-b border-border">
                  <th class="text-left py-1.5 font-medium">音符时值</th>
                  <th class="text-right py-1.5 font-medium">直拍 ms</th>
                  <th class="text-right py-1.5 font-medium">附点 ms（×1.5）</th>
                  <th class="text-right py-1.5 font-medium">三连音 ms（×2/3）</th>
                  <th class="text-right py-1.5 font-medium hidden sm:table-cell">秒（≥1s）</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in tableRows" :key="row.id" class="border-b border-border/50 last:border-0">
                  <td class="py-1.5 text-foreground whitespace-nowrap">
                    {{ row.name }}
                    <span v-if="row.tag" class="ml-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">{{ row.tag }}</span>
                  </td>
                  <td class="py-1.5 text-right font-mono text-primary font-semibold">{{ row.straight }}</td>
                  <td class="py-1.5 text-right font-mono text-foreground">{{ row.dotted }}</td>
                  <td class="py-1.5 text-right font-mono text-foreground">{{ row.triplet }}</td>
                  <td class="py-1.5 text-right font-mono text-muted-foreground text-xs hidden sm:table-cell">{{ row.secText || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[10px] text-muted-foreground leading-relaxed">
            三连音列按精确倍率 ×2/3 计算后四舍五入到 0.01ms；实际设备多取整数毫秒，DAW 内以听感微调为准。秒列仅对 ≥1s 的直拍时值提示换算（1000ms = 1s）。
          </p>
        </div>

        <!-- 混音应用注记卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <SlidersHorizontal class="w-5 h-5 mr-2 text-primary" /> 混音应用注记
          </h2>
          <div class="space-y-2">
            <div class="flex items-start gap-3 p-3 bg-muted/50 border border-border rounded-lg">
              <span class="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium flex-shrink-0 mt-0.5">延迟时间</span>
              <p class="text-xs text-muted-foreground leading-relaxed">人声 / 主奏延迟首选<strong class="text-foreground">四分音符</strong>（跟拍稳）或<strong class="text-foreground">附点八分</strong>（切分推进感，经典 U2 式回声）；填太密的十六分容易糊，必要时用反馈量与滤波收尾。</p>
            </div>
            <div class="flex items-start gap-3 p-3 bg-muted/50 border border-border rounded-lg">
              <span class="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium flex-shrink-0 mt-0.5">预延迟</span>
              <p class="text-xs text-muted-foreground leading-relaxed">预延迟<strong class="text-foreground">不必跟 BPM</strong>：两种口径任选——按表中 1/64 行取时值，或直接用独立于速度的 <strong class="text-foreground">10–40ms</strong>。作用是让干声先落耳，再进回声 / 混响，保住清晰度。</p>
            </div>
            <div class="flex items-start gap-3 p-3 bg-muted/50 border border-border rounded-lg">
              <span class="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium flex-shrink-0 mt-0.5">混响预延迟</span>
              <p class="text-xs text-muted-foreground leading-relaxed">混响预延迟常见 <strong class="text-foreground">20–80ms</strong>：人声取 20–40ms 防糊，鼓组 / 大空间氛围可到 60–80ms 造「大屋子」感；超过 ~100ms 会听出「干湿分离」的两截感。</p>
            </div>
          </div>
        </div>

        <!-- 反向结果卡 -->
        <div v-if="revBpm !== null" class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Undo2 class="w-5 h-5 mr-2 text-primary" /> 反向换算结果
          </h2>
          <div class="bg-muted/40 border border-border rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">{{ revMsText }} ms 按{{ revDivName }}口径</p>
            <p class="text-4xl font-bold text-primary">≈ {{ fmtMs(revBpm) }}<span class="text-lg font-semibold text-muted-foreground"> BPM</span></p>
            <p class="text-[10px] text-muted-foreground mt-1 font-mono">BPM = 60000 × 拍数 ÷ ms</p>
            <p class="text-xs text-muted-foreground mt-2">换一个口径（如把 250ms 当八分音符）结果会 ×2 或 ÷2，注意与混音意图一致。</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>为什么 delay 要跟 BPM 对齐？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          延迟效果器把信号复制并推迟后再放出来。推迟量如果恰好等于歌曲里某个音符的时值（四分、八分、附点八分……），
          每一次回声都会<strong class="text-foreground">踩在节拍网格上</strong>，回声从「干扰」变成「节奏的一部分」——人声尾部逐拍递减、吉他回声填空拍，
          听感整洁且有推进感。反过来，如果延迟 437ms 这种与速度无关的值，回声会漂在拍点之间，与鼓的关系时前时后，听起来浑浊且业余。
          换算口诀只有一条：一拍 ms = 60000 ÷ BPM（120 BPM → 500ms），再按音符时值倍乘即可。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">附点和三连音：两个最常用的「错拍」修饰</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          附点音符 = 原时值 ×1.5（延长一半），三连音 = 原时值 ×2/3（三个音占原两个音的时长）。延迟里最经典的是
          <strong class="text-foreground">附点八分</strong>：它落在拍点之间的切分位置，产生「后半拍追着走」的推进感（The Edge、大量英伦吉他音墙的标配）；
          三连音时值则用于 shuffle、12/8、swing 语感的歌曲——这种歌的「八分」其实唱成三连音框架，延迟若按直拍八分设就会与律动错位。
          拿不准时，把两列都试一遍，跟鼓对齐的那个就是对的。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">预延迟（Pre-delay）的作用：为什么要独立于 BPM</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          预延迟是干声与第一个回声 / 混响反射之间的<strong class="text-foreground">时间间隔</strong>。哈斯效应告诉我们：约 1–35ms 内到达的延迟声会被大脑融合进干声，
          不被听成独立回声，只增加「厚度」。所以把混响的首个反射推后 10–40ms，干声就有了一段「独占时间」，在混响糊上来之前先把清晰度送进耳朵——
          这就是预延迟提升人声辨识度的原理。因为它本质是与「融合窗」对话而不是与节拍对话，所以<strong class="text-foreground">通常独立于 BPM 设置</strong>；
          若想仍与速度挂钩，可取表中 1/64 行的时值作为折中。混响预延迟略大（20–80ms）还能模拟大房间的真实反射间隔。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">拍频与 LFO 同步：把调制也挂上速度</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          同一套思路适用于调制类效果：合唱 / 颤音 / 移相的 LFO 速率（Hz）与 BPM 换算关系是 <strong class="text-foreground">Hz = BPM ÷ 60</strong>
          （120 BPM 的一拍 LFO = 2Hz）。把 LFO 定在四分音符（BPM/60）、八分（BPM/120）或两小节一圈（BPM/120 再减半），
          调制起伏就会与鼓点同呼吸；延迟反馈通路的调制（磁带抖动感）常取 1/8 或 1/4 一圈。反过来，听到 LFO 与节拍「打架」的慢速拍频，
          多半就是速率没挂上速度网格。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">DAW 里为什么还要微调？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本表给出的是<strong class="text-foreground">数学理论值</strong>，而真实混音要在 DAW 里微调，原因有四：
          一是 groove——真实鼓点常带 swing / humanize 偏移，回声要对齐的是「演奏出来的拍」而不是数学拍；
          二是精度与口径——硬件延迟的 ms 旋钮按整数步进，插件同步则可能按 1/32T 等网格取值，两边对不上；
          三是听感优先——若 375ms 的附点八分与底鼓打架，40ms 内的挪动完全合法；
          四是段落变化——主歌 / 副歌常换延迟密度，理论值只是每段的起点。原则：先按表设值，再用耳朵做 ±10–30ms 的最后裁决。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">120 BPM 时延迟时间设多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">四分音符 500ms（跟拍稳）、附点八分 375ms（切分推进）、八分 250ms（更密的节奏回声）。人声推荐从前两者起步，配合反馈 2–4 次与低通滤波。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">预延迟设多少合适？</h3>
            <p class="text-sm text-muted-foreground mt-1">独立于 BPM 的 10–40ms 是常用区间（人声偏小、器乐与氛围可偏大）；想跟速度就取 1/64 时值。混响预延迟可到 20–80ms 造空间感。超过 ~100ms 干湿会分离成两截。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">给 250ms 反推 BPM 是多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">按四分音符口径：BPM = 60000 ÷ 250 = 240（很快的 punk / drum&bass 区间）。若 250ms 其实对应八分音符，则 BPM 为 120——反推时务必先确认口径。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么我的附点延迟听起来还是不齐？</h3>
            <p class="text-sm text-muted-foreground mt-1">先确认 BPM 与工程一致；再检查歌曲是否有 swing（此时该用三连音列）；最后允许自己 ±10–30ms 微调——理论值是起点，耳朵才是裁判。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有公式都在浏览器本地计算，不记录、不发送任何输入内容，参数仅保存在本机浏览器中用于下次恢复。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'delay-time-ms'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Music, Calculator, RefreshCw, Info, TriangleAlert,
  ChevronUp, ChevronDown, Timer, ListMusic, SlidersHorizontal, Undo2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'BPM延时换算计算器 - Delay Time 毫秒对照表与反向求BPM在线工具',
  description: '免费在线 BPM 延时换算：输入速度一键生成全音符到 1/64 的直拍/附点/三连音毫秒全表，附反向给 ms 求 BPM、混音延迟与预延迟（10-40ms / 1/64）注记，纯浏览器本地运行不上传',
  keywords: 'bpm延时换算,delay time,毫秒换算,附点八分,预延迟,混音延迟时间',
  author: '有条工具',
  ogTitle: 'BPM延时换算计算器 - Delay Time 毫秒对照表与反向求BPM在线工具 | 有条工具',
  ogDescription: '音符时值毫秒全表（直拍/附点/三连音）、反向求 BPM 与混音延迟预延迟注记。',
  ogUrl: 'https://www.util.cn/tools/delay-time-ms',
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
          name: 'BPM 延时换算计算器',
          url: 'https://www.util.cn/tools/delay-time-ms',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['BPM 到音符时值毫秒全表', '直拍 / 附点 / 三连音三列对照', '全音符到 1/64 七档时值', '反向给 ms 求对应 BPM', '常用速度预设 60–174', '混音延迟与预延迟应用注记', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: 'BPM 延时换算计算器', item: 'https://www.util.cn/tools/delay-time-ms' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '120 BPM 时延迟时间设多少？',
              acceptedAnswer: { '@type': 'Answer', text: '四分音符 500ms（跟拍稳）、附点八分 375ms（切分推进）、八分 250ms（更密回声）。人声从前两者起步。' }
            },
            {
              '@type': 'Question',
              name: '预延迟设多少合适？',
              acceptedAnswer: { '@type': 'Answer', text: '独立于 BPM 的 10–40ms 常用（人声偏小、氛围可偏大）；想跟速度取 1/64 时值；混响预延迟可到 20–80ms。' }
            },
            {
              '@type': 'Question',
              name: '给 250ms 反推 BPM 是多少？',
              acceptedAnswer: { '@type': 'Answer', text: '按四分音符口径 BPM = 60000 ÷ 250 = 240；若 250ms 对应八分音符则为 120。反推时先确认口径。' }
            },
            {
              '@type': 'Question',
              name: '为什么 delay 要跟 BPM 对齐？',
              acceptedAnswer: { '@type': 'Answer', text: '对齐节拍网格的回声会成为节奏的一部分，不齐的回声漂在拍点之间，听感浑浊。一拍 ms = 60000 ÷ BPM。' }
            },
            {
              '@type': 'Question',
              name: 'DAW 里为什么还要微调？',
              acceptedAnswer: { '@type': 'Answer', text: 'groove/swing 偏移、设备步进精度、听感优先与段落变化都要求在理论值基础上 ±10–30ms 微调。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const BPM_MAX = 999    // BPM 输入上限
const MS_MAX = 60000   // 反向毫秒输入上限

// 数值解析：字符串/数字 → 有限数或 null
function toNum(v) {
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

// 音符时值 ms = 60000 ÷ BPM × beats（beats 为相对四分音符的拍数）
// 验证：noteMs(120, 1) = 500；noteMs(120, 0.5) = 250（八分）
function noteMs(bpm, beats) {
  if (!(bpm > 0)) return null
  return (60000 / bpm) * beats
}

// 附点时值 = 原时值 ×1.5（延长一半）
// 验证：dottedMs(250) = 375（附点八分 @120BPM）
function dottedMs(ms) {
  if (ms === null || !Number.isFinite(ms)) return null
  return ms * 1.5
}

// 三连音时值 = 原时值 ×2/3（三个音占原两个音的时长）
// 验证：tripletMs(250) ≈ 166.67（三连音八分 @120BPM，显示按 0.01ms 取整）
function tripletMs(ms) {
  if (ms === null || !Number.isFinite(ms)) return null
  return ms * (2 / 3)
}

// 反向：目标 ms + 口径（beats）→ BPM = 60000 × beats ÷ ms
// 验证：bpmFromMs(250, 1) = 240（四分口径）；bpmFromMs(500, 1) = 120（往返闭合）
function bpmFromMs(ms, beats) {
  if (!(ms > 0) || !Number.isFinite(beats) || beats <= 0) return null
  return (60000 * beats) / ms
}

// 毫秒显示：四舍五入到 0.01ms；整数不带小数，避免浮点尾差上屏
function fmtMs(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  const r = Math.round(v * 100) / 100
  return Number.isInteger(r) ? String(r) : r.toFixed(2)
}

// 显示格式化：null / 非数值 → '—'
function fmt(v, digits) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return v.toFixed(digits)
}

// ---------- 常量与基础数据 ----------
// 音符时值表：beats 为相对四分音符的拍数；1/64 供预延迟口径取值
const NOTE_DIVISIONS = [
  { id: '1/1', name: '全音符', beats: 4, tag: '' },
  { id: '1/2', name: '二分音符', beats: 2, tag: '' },
  { id: '1/4', name: '四分音符', beats: 1, tag: '延迟常用' },
  { id: '1/8', name: '八分音符', beats: 0.5, tag: '' },
  { id: '1/16', name: '十六分音符', beats: 0.25, tag: '' },
  { id: '1/32', name: '三十二分音符', beats: 0.125, tag: '' },
  { id: '1/64', name: '六十四分音符', beats: 0.0625, tag: '预延迟常用' }
]

// BPM 预设：慢速民谣到 Drum&Bass 的常用锚点
const BPM_PRESETS = [60, 80, 90, 100, 120, 128, 140, 160, 174]

const DEFAULTS = { bpm: '120', revMs: '250', revDiv: '1/4' }
const STORAGE_PREFIX = 'delay-time-ms'

// ---------- UI 状态 ----------
const bpmIn = ref(DEFAULTS.bpm)
const revMsIn = ref(DEFAULTS.revMs)
const revDiv = ref(DEFAULTS.revDiv)
const seoContentVisible = ref(true)

// 校验与解析
const bpm = computed(() => toNum(bpmIn.value))
const bpmText = computed(() => bpmIn.value)
const bpmError = computed(() => (bpm.value === null || bpm.value <= 0 || bpm.value > BPM_MAX ? `BPM 需在 1–${BPM_MAX} 之间` : ''))
const revMs = computed(() => toNum(revMsIn.value))
const revMsError = computed(() => (revMs.value === null || revMs.value <= 0 || revMs.value > MS_MAX ? `毫秒需在 1–${MS_MAX} 之间` : ''))
const revDivName = computed(() => {
  const d = NOTE_DIVISIONS.find((x) => x.id === revDiv.value)
  return d ? d.name : '四分音符'
})

// 速览值
const quarterMs = computed(() => (bpmError.value ? null : noteMs(bpm.value, 1)))
const dottedEighthMs = computed(() => (quarterMs.value === null ? null : dottedMs(quarterMs.value * 0.5)))

// 全表行（直拍 / 附点 / 三连音 + 秒提示）
const tableRows = computed(() => {
  if (bpmError.value) return []
  return NOTE_DIVISIONS.map((d) => {
    const ms = noteMs(bpm.value, d.beats)
    return {
      id: d.id,
      name: d.name,
      tag: d.tag,
      straight: fmtMs(ms),
      dotted: fmtMs(dottedMs(ms)),
      triplet: fmtMs(tripletMs(ms)),
      secText: ms !== null && ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : ''
    }
  })
})

// 反向结果
const revBpm = computed(() => {
  if (revMsError.value) return null
  const d = NOTE_DIVISIONS.find((x) => x.id === revDiv.value)
  if (!d) return null
  return bpmFromMs(revMs.value, d.beats)
})
const revMsText = computed(() => fmtMs(revMs.value))

// ---------- 交互 ----------
function applyBpm(v) {
  bpmIn.value = String(v)
  saveState()
}

function resetAll() {
  bpmIn.value = DEFAULTS.bpm
  revMsIn.value = DEFAULTS.revMs
  revDiv.value = DEFAULTS.revDiv
  saveState()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 本地持久化：键前缀 = 工具 id；仅在交互回调与 onMounted 中读写
function saveState() {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}.bpm`, bpmIn.value)
    localStorage.setItem(`${STORAGE_PREFIX}.revMs`, revMsIn.value)
    localStorage.setItem(`${STORAGE_PREFIX}.revDiv`, revDiv.value)
  } catch (e) { /* 隐私模式等场景静默降级 */ }
}

function restoreState() {
  try {
    const bpmSaved = localStorage.getItem(`${STORAGE_PREFIX}.bpm`)
    if (bpmSaved !== null && toNum(bpmSaved) !== null && toNum(bpmSaved) > 0 && toNum(bpmSaved) <= BPM_MAX) bpmIn.value = bpmSaved
    const revMsSaved = localStorage.getItem(`${STORAGE_PREFIX}.revMs`)
    if (revMsSaved !== null && toNum(revMsSaved) !== null && toNum(revMsSaved) > 0 && toNum(revMsSaved) <= MS_MAX) revMsIn.value = revMsSaved
    const revDivSaved = localStorage.getItem(`${STORAGE_PREFIX}.revDiv`)
    if (revDivSaved !== null && NOTE_DIVISIONS.some((d) => d.id === revDivSaved)) revDiv.value = revDivSaved
  } catch (e) { /* 静默降级 */ }
}

onMounted(() => {
  addRecentTool('delay-time-ms')
  restoreState()
})
</script>
