<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Fish class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电子木鱼</h1>
          <p class="text-sm text-muted-foreground mt-1">点击或按空格敲一下，功德 +1 —— 一只纯本地运行的解压小木鱼</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线电子木鱼：点一下大木鱼或按空格键，木鱼回弹、涟漪扩散、"+1"上浮，随机弹出一句轻松短语，功德 +1。
        木鱼声由 WebAudio 实时合成（正弦主体音 + 低频"咚"感 + 高频瞬态三层叠加），提供清脆 / 低沉 / 电音三种音色；
        1 秒内连敲 5 次触发「疾风连击」，每攒满 100 功德弹出里程碑提示；静音后依然计数，办公室摸鱼也不打扰同事。
        计数只保存在你本机浏览器里，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 大木鱼区（移动端置顶，lg 下占右侧两列） -->
      <div class="order-1 lg:order-2 lg:col-span-2 bg-card border border-border rounded-lg p-6 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Hand class="w-5 h-5 mr-2 text-primary" /> 敲击区
          </h2>
          <span class="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info class="w-3.5 h-3.5" /> 点击木鱼或按空格键，每次按下计 1 次
          </span>
        </div>

        <!-- 大块交互区：pointerdown 敲击 -->
        <div
          ref="areaRef"
          class="relative flex-1 min-h-[420px] rounded-xl border-2 border-dashed border-primary/40 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 overflow-hidden select-none touch-none cursor-pointer"
          @pointerdown="handleAreaPointerDown"
        >
          <!-- 里程碑横幅（每 +100 功德弹出） -->
          <div class="absolute top-3 inset-x-0 flex justify-center pointer-events-none">
            <div v-if="milestoneText" class="wf-banner inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/25 text-green-600 text-sm rounded-full px-3.5 py-1.5 shadow-sm">
              <CheckCircle class="w-4 h-4 flex-shrink-0" />
              <span>{{ milestoneText }}</span>
            </div>
          </div>

          <!-- 中央木鱼（SVG 绘制：椭圆鱼形 + 木纹弧线 + 敲击缝） -->
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div ref="fishRef" class="wf-fish">
              <svg viewBox="0 0 220 200" class="w-44 h-40 sm:w-60 sm:h-52 drop-shadow-xl" aria-hidden="true">
                <defs>
                  <radialGradient id="wfBody" cx="38%" cy="30%" r="85%">
                    <stop offset="0%" stop-color="#e6b483" />
                    <stop offset="55%" stop-color="#c08a52" />
                    <stop offset="100%" stop-color="#8d5c31" />
                  </radialGradient>
                  <radialGradient id="wfInner" cx="42%" cy="36%" r="80%">
                    <stop offset="0%" stop-color="#f0d2a2" />
                    <stop offset="100%" stop-color="#c9975f" />
                  </radialGradient>
                </defs>
                <!-- 鱼尾 -->
                <path d="M180 100 L 212 74 L 204 100 L 212 126 Z" fill="#a5713d" stroke="#7c5227" stroke-width="2" stroke-linejoin="round" />
                <!-- 主体 -->
                <ellipse cx="102" cy="100" rx="84" ry="66" fill="url(#wfBody)" stroke="#7c5227" stroke-width="3" />
                <!-- 木纹弧线 -->
                <path d="M36 72 Q 102 34 168 72" fill="none" stroke="#9a6b3a" stroke-width="2" opacity="0.5" />
                <path d="M44 84 Q 102 50 160 84" fill="none" stroke="#9a6b3a" stroke-width="2" opacity="0.38" />
                <path d="M52 96 Q 102 66 152 96" fill="none" stroke="#9a6b3a" stroke-width="2" opacity="0.26" />
                <!-- 高光 -->
                <ellipse cx="70" cy="66" rx="26" ry="13" fill="#ffffff" opacity="0.16" transform="rotate(-16 70 66)" />
                <!-- 内圈敲击区 -->
                <ellipse cx="102" cy="102" rx="54" ry="43" fill="url(#wfInner)" stroke="#a4763f" stroke-width="2" />
                <!-- 月牙敲击缝 -->
                <path d="M64 112 Q 102 136 140 112" fill="none" stroke="#6f4a24" stroke-width="7" stroke-linecap="round" />
                <!-- 眼睛 -->
                <circle cx="82" cy="90" r="4.5" fill="#5f3d1e" />
                <circle cx="122" cy="90" r="4.5" fill="#5f3d1e" />
              </svg>
            </div>
            <p class="mt-4 text-sm text-muted-foreground">笃—— 功德 +1</p>
          </div>

          <!-- 随机禅语弹出（换 key 重放动画） -->
          <div v-if="zenText" :key="zenKey" class="wf-zen text-base sm:text-lg font-medium text-primary bg-card/90 border border-primary/20 rounded-full px-4 py-1.5 shadow-sm">
            {{ zenText }}
          </div>

          <!-- 连击彩蛋 -->
          <div class="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
            <div
              v-if="combo.level > 0"
              class="wf-combo inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 text-sm font-medium rounded-full px-3.5 py-1.5"
              :class="{ 'wf-combo-fast': combo.level >= 2 }"
            >
              <Sparkles class="w-4 h-4 flex-shrink-0" />
              <span>{{ combo.label }} ×{{ comboTaps }}</span>
            </div>
          </div>

          <!-- 涟漪扩散圈 -->
          <span
            v-for="r in ripples"
            :key="'r' + r.id"
            class="wf-ripple w-16 h-16 rounded-full border-2 border-primary/50"
            :style="{ left: r.x + 'px', top: r.y + 'px' }"
          ></span>
          <!-- "+1" 上浮渐隐 -->
          <span
            v-for="f in floatTexts"
            :key="'f' + f.id"
            class="wf-float text-primary font-bold text-lg"
            :style="{ left: f.x + 'px', top: f.y + 'px' }"
          >{{ f.text }}</span>

          <!-- 角标实时计数 -->
          <div class="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-card/80 border border-border text-xs text-muted-foreground pointer-events-none">
            本次会话：{{ sessionCount }} 次
          </div>
          <div class="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-card/80 border border-border text-xs text-muted-foreground pointer-events-none font-mono">
            功德 {{ formatCount(totalMerit) }}
          </div>
        </div>
      </div>

      <!-- 侧面板 -->
      <div class="order-2 lg:order-1 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Fish class="w-5 h-5 mr-2 text-primary" /> 功德面板
        </h2>

        <!-- 计数三卡 -->
        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">功德总数（历史累计）</p>
          <p class="text-3xl font-bold text-primary tabular-nums inline-block" :class="comboClass">{{ formatCount(totalMerit) }}</p>
          <p class="text-xs text-muted-foreground mt-1">今天已敲 {{ formatCount(todayCount) }} 下</p>
        </div>
        <div class="grid grid-cols-2 gap-2 text-center">
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">今日</p>
            <p class="text-xl font-bold text-foreground tabular-nums">{{ formatCount(todayCount) }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">本次会话</p>
            <p class="text-xl font-bold text-foreground tabular-nums">{{ formatCount(sessionCount) }}</p>
          </div>
        </div>

        <!-- 音色选择 -->
        <div class="space-y-1.5">
          <label for="wf-tone" class="text-sm font-medium text-foreground">木鱼音色</label>
          <select
            id="wf-tone"
            v-model="tone"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="t in toneOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>

        <!-- 静音开关 -->
        <button
          type="button"
          class="w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition flex items-center justify-center gap-2"
          :class="muted ? 'bg-muted hover:bg-muted/80 border-border text-muted-foreground' : 'bg-primary/10 hover:bg-primary/15 border-primary/30 text-primary'"
          @click="toggleMute"
        >
          <VolumeX v-if="muted" class="w-4 h-4" />
          <Volume2 v-else class="w-4 h-4" />
          {{ muted ? '已静音（仍会计数）' : '声音开启' }}
        </button>
        <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5 -mt-2">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-muted-foreground/70" />
          <span>静音后敲击照常计数、只有动画没有声音，办公室摸鱼也不打扰同事。</span>
        </p>

        <!-- 重置 -->
        <button
          type="button"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          @click="resetAll"
        >
          <RotateCcw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 清零重来
        </button>

        <!-- 最近禅语记录 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">最近禅语（最多 {{ ZEN_LOG_MAX }} 条）</p>
          <ul class="space-y-1.5">
            <li
              v-for="item in zenLog"
              :key="item.id"
              class="flex items-start gap-2 text-xs bg-muted/40 border border-border rounded px-2.5 py-1.5"
            >
              <span class="font-mono text-muted-foreground/70 flex-shrink-0">{{ item.time }}</span>
              <span class="text-foreground">{{ item.text }}</span>
            </li>
            <li v-if="!zenLog.length" class="text-xs text-muted-foreground px-2.5 py-2 bg-muted/30 rounded border border-dashed border-border">
              还没有记录，去右边敲一下试试
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <div class="relative">
      <button
        type="button"
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>电子木鱼是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          电子木鱼是一款网页版解压小玩具，把传统木鱼「笃、笃」的敲击感搬进浏览器：点击大木鱼或按下空格键，
          木鱼缩放回弹、涟漪扩散、"+1"上浮，同时随机弹出一句轻松短语，计数 +1。
          木鱼声完全由 WebAudio 实时合成——正弦主体音（600-800Hz 指数衰减约 80ms）、低频"咚"感（150Hz 衰减约 120ms）
          与高频噪声瞬态（约 10ms burst）三层叠加，模拟实心木料的敲击质感，不加载任何音频文件、零第三方依赖。
          它的定位就是一只趣味计数小玩具：数字只是「敲了多少下」的记录，不承载任何别的含义。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么敲木鱼能解压？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          从体感上说，敲木鱼和捏泡泡纸、转笔属于同一类：节奏性的重复动作本身容易让人进入专注而放松的状态，
          类似深呼吸、数息给注意力一个简单的落点。每一次敲击又伴随声音、回弹动画与计数 +1 的即时反馈，
          构成一个轻量的「动作—回报」循环，帮你把注意力从烦心事上挪开几分钟。
          当然它只是个小玩具，敲完记得起身接杯水，真正的休息不能靠它代劳。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">功德数会同步或上传吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不会。功德总数与「今日」计数保存在你本机浏览器的 localStorage（键名 electronic-woodfish），
          关闭页面再打开不会清零，也不发送任何网络请求；「本次会话」计数只在当前页面有效，刷新后归零。
          想从头开始就点「清零重来」（有确认弹窗防误触），或清除浏览器的站点数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">键盘空格也能敲</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          可以。页面聚焦后按空格即敲击一次，按住不放的系统自动重复不计次；
          输入框、下拉框、按钮聚焦时空格不会触发敲击，避免误操作。搭配静音开关（静音仍计数），
          在办公室摸鱼也只有你自己知道。手速快的话，试试 1 秒内连敲 5 次，会有小彩蛋。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">适合哪些时刻？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>工作间隙的 30 秒放空：跟着敲击节奏深呼吸，比刷短视频更容易收心。</li>
          <li>办公室静音摸鱼：开着静音敲，只有动画和计数，不打扰同事。</li>
          <li>单纯好奇木鱼声音：清脆、低沉、电音三种音色随便切，听听 WebAudio 怎么把一块「木头」敲出三种感觉。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">电子木鱼是什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">一款网页版解压小玩具：点击大木鱼或按空格键，木鱼回弹、涟漪与"+1"上浮，随机弹出轻松短语并计数。木鱼声由 WebAudio 实时三层合成，零音频文件、零第三方依赖，纯本地运行。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么敲木鱼能解压？</h3>
            <p class="text-sm text-muted-foreground mt-1">节奏性的重复动作容易帮人进入专注放松的状态，加上声音、回弹与计数 +1 的即时反馈，构成一个轻量的「动作—回报」循环，把注意力从压力源上挪开几分钟。它只是趣味小玩具，不能替代真正的休息。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">功德数会同步或上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。功德总数与今日计数保存在本机浏览器 localStorage（键名 electronic-woodfish），关闭页面再打开不会清零，也不上传任何数据；「本次会话」计数随页面关闭结束。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">键盘空格也能敲吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">可以。页面聚焦后按空格即敲击一次，按住不放的自动重复不计次；输入框、下拉框与按钮聚焦时空格不触发，避免误操作。搭配静音开关（静音仍计数），办公室摸鱼也不打扰同事。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'electronic-woodfish'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Fish, Volume2, VolumeX, RotateCcw, CheckCircle,
  ChevronUp, ChevronDown, Info, Sparkles, Hand
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '电子木鱼 - 在线敲木鱼解压玩具，功德+1',
  description: '免费在线电子木鱼：点击或空格键敲一下，功德+1，WebAudio 实时合成清脆/低沉/电音三种木鱼音，回弹、涟漪与随机禅语动画，每 +100 里程碑提示，1 秒 5 连触发疾风连击，静音模式适合办公室摸鱼，计数纯本地保存不上传',
  keywords: '电子木鱼,木鱼,功德+1,解压,敲木鱼,在线解压玩具,办公室摸鱼',
  author: '有条工具',
  ogTitle: '电子木鱼 - 在线敲木鱼解压玩具 | 有条工具',
  ogDescription: '敲一下，功德+1。WebAudio 合成木鱼音，回弹涟漪禅语动画，纯本地解压小玩具。',
  ogUrl: 'https://www.util.cn/tools/electronic-woodfish',
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
          name: '电子木鱼',
          url: 'https://www.util.cn/tools/electronic-woodfish',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '点击大木鱼或按空格键敲击，功德 +1',
            'WebAudio 三层合成木鱼音（主体音 + 低频咚感 + 高频瞬态）',
            '清脆 / 低沉 / 电音方波三种音色',
            '木鱼弹跳、涟漪扩散与 +1 上浮动画',
            '随机禅语弹出与最近 10 条记录',
            '每 +100 功德里程碑提示',
            '1 秒内连敲 5 次触发疾风连击',
            '静音模式仍计数，适合办公室场景',
            '总数 / 今日 / 本次三维计数，千分位显示',
            '纯本地运行，计数不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '电子木鱼', item: 'https://www.util.cn/tools/electronic-woodfish/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '电子木鱼是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '一款网页版解压小玩具：点击大木鱼或按空格键，木鱼回弹、涟漪与"+1"上浮，随机弹出轻松短语并计数。木鱼声由 WebAudio 实时三层合成，零音频文件、零第三方依赖，纯本地运行。' }
            },
            {
              '@type': 'Question',
              name: '为什么敲木鱼能解压？',
              acceptedAnswer: { '@type': 'Answer', text: '节奏性的重复动作容易帮人进入专注放松的状态，加上声音、回弹与计数+1的即时反馈，构成一个轻量的动作—回报循环，把注意力从压力源上挪开几分钟。它只是趣味小玩具，不能替代真正的休息。' }
            },
            {
              '@type': 'Question',
              name: '功德数会同步或上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。功德总数与今日计数保存在本机浏览器 localStorage（键名 electronic-woodfish），关闭页面再打开不会清零，也不上传任何数据；本次会话计数随页面关闭结束。' }
            },
            {
              '@type': 'Question',
              name: '键盘空格也能敲吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以。页面聚焦后按空格即敲击一次，按住不放的自动重复不计次；输入框、下拉框与按钮聚焦时空格不触发，避免误操作。搭配静音开关（静音仍计数），办公室摸鱼也不打扰同事。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_INTERVALS = 12      // 连击判定最多保留的相邻间隔样本数
const COMBO_WINDOW_MS = 1000  // 连击统计窗口：1 秒
const COMBO_FAST_TAPS = 3     // 窗口内敲击 ≥3 次：手感渐快
const COMBO_GALE_TAPS = 5     // 窗口内敲击 ≥5 次：疾风连击
const MILESTONE_STEP = 100    // 里程碑步长：每 +100 功德触发
const ZEN_LOG_MAX = 10        // 禅语记录最多保留条数

// 禅语短语（解压小玩具口径，只做趣味计数）
const ZEN_PHRASES = [
  '心静自然凉',
  '今天也是元气满满的一天',
  '事已至此，先吃饭吧',
  '慢慢来，比较快',
  '深呼吸，烦恼 -1',
  '摸鱼五分钟，回血一整天',
  '进度条会动的，别急',
  '屏幕之外，记得喝水',
  '敲一敲，肩颈松一松',
  '别慌，问题不大',
  '今天的烦恼，就到今天为止',
  '先敲一下，再想三秒'
]

// 里程碑短语（每 +100 功德随机弹出一条）
const MILESTONE_PHRASES = [
  '里程碑达成，节奏稳得很',
  '整百纪念！给自己点个赞',
  '又攒下一个整百，今天也很努力',
  '手速与心境俱佳，继续保持',
  '整百打卡成功，休息一下眼睛吧'
]

// 音色分层参数：main 主体音 / thump 低频"咚"感 / transient 高频瞬态（null 表示无该层）
const TONE_PARAM_TABLE = {
  crisp: {
    main: { type: 'sine', freq: 720, decay: 0.08, gain: 0.55 },
    thump: { freq: 150, decay: 0.12, gain: 0.5 },
    transient: { cutoff: 3000, decay: 0.01, gain: 0.35 }
  },
  deep: {
    main: { type: 'sine', freq: 430, decay: 0.11, gain: 0.6 },
    thump: { freq: 110, decay: 0.16, gain: 0.6 },
    transient: { cutoff: 1800, decay: 0.012, gain: 0.22 }
  },
  square: {
    main: { type: 'square', freq: 540, decay: 0.09, gain: 0.3 },
    thump: { freq: 150, decay: 0.1, gain: 0.25 },
    transient: null
  }
}

// 记录一次相邻敲击间隔，超出上限时只保留最近样本
function recordInterval(list, interval) {
  const next = list.concat(interval)
  return next.length > MAX_INTERVALS ? next.slice(next.length - MAX_INTERVALS) : next
}

// 按种子从短语数组中确定性取一条：同一种子永远返回同一条，且必在数组范围内
function pickPhraseOf(list, seed) {
  if (!list.length) return ''
  const i = ((seed % list.length) + list.length) % list.length
  return list[i]
}

// 随机禅语：pickZenOf(seed) 同种子结果确定，可单测
function pickZenOf(seed) {
  return pickPhraseOf(ZEN_PHRASES, seed)
}

// 里程碑短语：种子取里程碑序号（第几次整百）
function pickMilestoneOf(seed) {
  return pickPhraseOf(MILESTONE_PHRASES, seed)
}

// 统计最近 windowMs 内的敲击次数：从尾部累加间隔，塞不进窗口即停；
// 命中的间隔数 + 1（最后一次敲击本身）即窗口内次数
function tapsWithinWindowOf(intervals, windowMs) {
  let sum = 0
  let gaps = 0
  for (let i = intervals.length - 1; i >= 0; i--) {
    const ms = intervals[i]
    if (sum + ms > windowMs) break
    sum += ms
    gaps += 1
  }
  return gaps + 1
}

// 连击等级：{ level, label } —— 0 无 / 1 快（窗口内 ≥3 次）/ 2 疾风（窗口内 ≥5 次）
function comboLevelOf(intervals) {
  const taps = tapsWithinWindowOf(intervals, COMBO_WINDOW_MS)
  if (taps >= COMBO_GALE_TAPS) return { level: 2, label: '疾风连击' }
  if (taps >= COMBO_FAST_TAPS) return { level: 1, label: '手感渐快' }
  return { level: 0, label: '无' }
}

// 里程碑判定：count 恰为 MILESTONE_STEP 的正整数倍时返回该里程碑数值，否则 null
function milestoneOf(count) {
  if (count > 0 && count % MILESTONE_STEP === 0) return count
  return null
}

// 计数千分位格式化：1234567 → '1,234,567'
function formatCount(n) {
  const safe = Math.max(0, Math.floor(Number(n) || 0))
  return String(safe).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 本地日期戳（按浏览器时区）：2026-11-03
function todayStampOf(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// 时分秒戳（用于禅语记录展示）：14:05:09
function timeStampOf(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

// 取音色分层参数副本（未知音色回落清脆版），避免调用方改动污染参数表
function toneLayersOf(toneName) {
  const t = TONE_PARAM_TABLE[toneName] || TONE_PARAM_TABLE.crisp
  return {
    main: { ...t.main },
    thump: { ...t.thump },
    transient: t.transient ? { ...t.transient } : null
  }
}

// ---------- 常量与选项 ----------
const toneOptions = [
  { value: 'crisp', label: '清脆 · 经典小木鱼' },
  { value: 'deep', label: '低沉 · 厚重大木鱼' },
  { value: 'square', label: '电音 · 方波复古版' }
]

// ---------- 页面状态 ----------
const seoContentVisible = ref(true)
const totalMerit = ref(0)      // 功德总数（历史累计，localStorage 持久化）
const todayCount = ref(0)      // 今日计数（跨天自动归零）
const sessionCount = ref(0)    // 本次会话计数（刷新即清零）
const tapIntervals = ref([])   // 最近相邻敲击间隔（ms），连击判定用
const muted = ref(false)       // 静音开关（静音仍计数，localStorage 持久化）
const tone = ref('crisp')      // 当前音色
const zenLog = ref([])         // 最近禅语记录 [{ id, text, time }]
const zenText = ref('')        // 当前弹出的禅语
const zenKey = ref(0)          // 禅语动画重放 key
const milestoneText = ref('')  // 当前里程碑横幅文案
const ripples = ref([])        // 涟漪列表 [{ id, x, y }]
const floatTexts = ref([])     // "+1" 浮字列表 [{ id, text, x, y }]
const comboTick = ref(0)       // 连击窗口滑出的重算信号

let zenSeed = Math.floor(Math.random() * 100000) // 禅语随机种子源
let effectId = 0
let lastTapAt = null
let todayStamp = todayStampOf(new Date())

const combo = computed(() => {
  void comboTick.value // 仅为建立依赖：连击窗口滑出后由定时器 +1 触发重算（静止也能降级）
  return comboLevelOf(tapIntervals.value)
})
const comboTaps = computed(() => {
  void comboTick.value
  return tapsWithinWindowOf(tapIntervals.value, COMBO_WINDOW_MS)
})
const comboClass = computed(() => {
  if (combo.value.level >= 2) return 'wf-num-fast'
  if (combo.value.level === 1) return 'wf-num-mid'
  return ''
})

// ---------- 定时器统一管理（卸载时全部清理） ----------
const pendingTimers = new Set()

function later(fn, ms) {
  const id = setTimeout(() => {
    pendingTimers.delete(id)
    fn()
  }, ms)
  pendingTimers.add(id)
  return id
}

// ---------- WebAudio 木鱼音合成 ----------
// 为什么不在 onMounted 里创建 AudioContext：浏览器自动播放策略规定 AudioContext
// 必须在用户手势的调用栈中创建/恢复，否则创建后停留在 suspended 状态、首次发声被拦。
// onMounted 时机没有手势上下文，因此懒加载：只在第一次敲击回调里创建。
let audioCtx = null
let noiseBuffer = null

function ensureAudioContext() {
  if (audioCtx) return audioCtx
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  audioCtx = new Ctx() // 仅在用户手势回调中创建（SSR / 自动播放策略安全）
  return audioCtx
}

// 白噪声缓冲（0.05s，一次性生成复用），供高频瞬态层使用
function ensureNoiseBuffer(ctx) {
  if (noiseBuffer) return noiseBuffer
  const len = Math.max(1, Math.floor(ctx.sampleRate * 0.05))
  noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return noiseBuffer
}

// 敲击音：三层叠加模拟实心木鱼声
// 第 1 层 主体音（正弦/方波，指数衰减 + 轻微下滑音高）；第 2 层 低频"咚"感（150Hz 一带快速下滑）；
// 第 3 层 高频噪声瞬态（约 10ms burst 过带通，模拟槌头接触的"嗒"，电音版无此层）
function playWoodfishSound() {
  if (muted.value) return
  const ctx = ensureAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume() // 部分浏览器创建后仍需 resume 一次
  const t0 = ctx.currentTime
  const layers = toneLayersOf(tone.value)
  const detune = 1 + (Math.random() * 0.06 - 0.03) // 每次轻微失谐，避免机械感

  const osc = ctx.createOscillator()
  const og = ctx.createGain()
  osc.type = layers.main.type
  osc.frequency.setValueAtTime(layers.main.freq * detune, t0)
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, layers.main.freq * 0.8), t0 + layers.main.decay)
  og.gain.setValueAtTime(layers.main.gain, t0)
  og.gain.exponentialRampToValueAtTime(0.0001, t0 + layers.main.decay)
  osc.connect(og)
  og.connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + layers.main.decay + 0.03)

  const thump = ctx.createOscillator()
  const tg = ctx.createGain()
  thump.type = 'sine'
  thump.frequency.setValueAtTime(layers.thump.freq, t0)
  thump.frequency.exponentialRampToValueAtTime(Math.max(30, layers.thump.freq * 0.55), t0 + layers.thump.decay)
  tg.gain.setValueAtTime(layers.thump.gain, t0)
  tg.gain.exponentialRampToValueAtTime(0.0001, t0 + layers.thump.decay)
  thump.connect(tg)
  tg.connect(ctx.destination)
  thump.start(t0)
  thump.stop(t0 + layers.thump.decay + 0.03)

  if (layers.transient) {
    const src = ctx.createBufferSource()
    src.buffer = ensureNoiseBuffer(ctx)
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = layers.transient.cutoff
    bp.Q.value = 1
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(layers.transient.gain, t0)
    ng.gain.exponentialRampToValueAtTime(0.0001, t0 + layers.transient.decay)
    src.connect(bp)
    bp.connect(ng)
    ng.connect(ctx.destination)
    src.start(t0)
    src.stop(t0 + layers.transient.decay + 0.02)
  }
}

// ---------- 动效 ----------
const areaRef = ref(null)
const fishRef = ref(null)

// 木鱼缩放弹跳：scale 1 → 0.92 → 1.05 → 1 弹性回弹（Web Animations API，可逐次重触发）
function bounceFish() {
  const el = fishRef.value
  if (!el || typeof el.animate !== 'function') return
  el.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(0.92)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(1)' }
    ],
    { duration: 240, easing: 'cubic-bezier(0.22, 1.4, 0.36, 1)' }
  )
}

function spawnRipple(x, y) {
  const id = ++effectId
  ripples.value = [...ripples.value, { id, x, y }]
  later(() => {
    ripples.value = ripples.value.filter((r) => r.id !== id)
  }, 750)
}

function spawnFloat(text, x, y) {
  const id = ++effectId
  floatTexts.value = [...floatTexts.value, { id, text, x, y }]
  later(() => {
    floatTexts.value = floatTexts.value.filter((f) => f.id !== id)
  }, 950)
}

let zenToken = 0
function showZen(text) {
  const my = ++zenToken
  zenText.value = text
  zenKey.value += 1
  later(() => {
    if (zenToken === my) zenText.value = '' // 仅当未被下一次敲击覆盖时收起
  }, 2400)
}

let milestoneToken = 0
function showMilestone(text) {
  const my = ++milestoneToken
  milestoneText.value = text
  later(() => {
    if (milestoneToken === my) milestoneText.value = ''
  }, 2600)
}

function pushZenLog(text) {
  const entry = { id: ++effectId, text, time: timeStampOf(new Date()) }
  zenLog.value = [entry, ...zenLog.value].slice(0, ZEN_LOG_MAX)
}

// ---------- 敲击主流程 ----------
function registerTap(x, y) {
  playWoodfishSound() // 声音最先，减少可感知延迟

  const now = performance.now()
  if (lastTapAt !== null) {
    tapIntervals.value = recordInterval(tapIntervals.value, Math.max(0, Math.round(now - lastTapAt)))
  }
  lastTapAt = now
  later(() => { comboTick.value += 1 }, COMBO_WINDOW_MS + 150) // 连击窗口滑出后刷新等级

  sessionCount.value += 1
  const stamp = todayStampOf(new Date())
  if (stamp !== todayStamp) {
    todayStamp = stamp // 跨天：今日计数归零，历史累计保留
    todayCount.value = 0
  }
  todayCount.value += 1
  totalMerit.value += 1

  bounceFish()
  spawnRipple(x, y)
  spawnFloat('+1', x, y - 6)
  const zen = pickZenOf(zenSeed++)
  showZen(zen)
  pushZenLog(zen)

  const ms = milestoneOf(totalMerit.value)
  if (ms !== null) showMilestone(`功德 ${formatCount(ms)}！${pickMilestoneOf(ms / MILESTONE_STEP)}`)

  saveMerit()
}

// 点击敲击：记录点击坐标供涟漪与浮字定位
function handleAreaPointerDown(e) {
  if (e.button !== 0) return // 仅响应左键 / 触摸 / 触控笔
  e.preventDefault() // 防止快速连点触发文本选中
  let x = 0
  let y = 0
  const area = areaRef.value
  if (area) {
    const rect = area.getBoundingClientRect()
    x = e.clientX - rect.left
    y = e.clientY - rect.top
  }
  registerTap(x, y)
}

// 空格敲击：坐标取敲击区中心偏上（木鱼位置）
function handleKeydown(e) {
  if (e.code !== 'Space' && e.key !== ' ') return
  if (e.repeat) return // 按住空格的系统自动重复不计次
  const tag = e.target && e.target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return
  e.preventDefault() // 阻止页面滚动
  let x = 0
  let y = 0
  const area = areaRef.value
  if (area) {
    const rect = area.getBoundingClientRect()
    x = rect.width / 2
    y = rect.height * 0.42
  }
  registerTap(x, y)
}

// ---------- 面板操作 ----------
function toggleMute() {
  muted.value = !muted.value
  saveMerit() // 音效开关一并持久化
}

function resetAll() {
  const ok = window.confirm('确定清空全部功德与禅语记录吗？清零后不可恢复。')
  if (!ok) return
  totalMerit.value = 0
  todayCount.value = 0
  sessionCount.value = 0
  tapIntervals.value = []
  lastTapAt = null
  zenLog.value = []
  zenText.value = ''
  milestoneText.value = ''
  saveMerit()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- localStorage 持久化（功德数 + 音效开关 + 音色，try/catch 兜底） ----------
const STORAGE_KEY = 'electronic-woodfish'

// 读取只在 onMounted 进行，避免 SSR 阶段访问 window/localStorage
function loadMerit() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object') return
    if (typeof saved.total === 'number' && Number.isFinite(saved.total) && saved.total >= 0) {
      totalMerit.value = Math.floor(saved.total)
    }
    todayStamp = todayStampOf(new Date())
    if (saved.day === todayStamp && typeof saved.today === 'number' && saved.today >= 0) {
      todayCount.value = Math.floor(saved.today)
    } else {
      todayCount.value = 0 // 跨天：今日计数归零，历史累计保留
    }
    if (typeof saved.muted === 'boolean') muted.value = saved.muted
    if (typeof saved.tone === 'string' && TONE_PARAM_TABLE[saved.tone]) tone.value = saved.tone
  } catch {
    /* localStorage 不可用或数据损坏时忽略，使用默认值 */
  }
}

function saveMerit() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      v: 1,
      total: totalMerit.value,
      today: todayCount.value,
      day: todayStamp,
      muted: muted.value,
      tone: tone.value
    }))
  } catch {
    /* 写入失败（隐私模式 / 配额满）时静默忽略 */
  }
}

watch(tone, saveMerit)

onMounted(() => {
  loadMerit()
  window.addEventListener('keydown', handleKeydown)
  addRecentTool('electronic-woodfish')
})

onBeforeUnmount(() => {
  // 1) 移除键盘监听
  window.removeEventListener('keydown', handleKeydown)
  // 2) 清空所有待执行的动效定时器（涟漪 / 浮字 / 禅语 / 里程碑 / 连击刷新）
  for (const id of pendingTimers) clearTimeout(id)
  pendingTimers.clear()
  // 3) 关闭并释放 AudioContext，释放音频线程资源
  if (audioCtx) {
    try { audioCtx.close() } catch { /* 已关闭时忽略 */ }
    audioCtx = null
    noiseBuffer = null
  }
})
</script>

<style scoped>
/* 木鱼回弹由 Web Animations API 逐次触发，这里只定义循环 / 一次性动画与定位 */

/* "+1" 上浮渐隐 */
@keyframes wf-float-up {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
  18% { opacity: 1; transform: translate(-50%, calc(-50% - 10px)) scale(1); }
  100% { opacity: 0; transform: translate(-50%, calc(-50% - 72px)) scale(1.12); }
}
.wf-float {
  position: absolute;
  pointer-events: none;
  animation: wf-float-up 0.9s ease-out forwards;
}

/* 涟漪扩散圈 */
@keyframes wf-ripple-go {
  0% { opacity: 0.65; transform: translate(-50%, -50%) scale(0.25); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2.8); }
}
.wf-ripple {
  position: absolute;
  pointer-events: none;
  animation: wf-ripple-go 0.72s ease-out forwards;
}

/* 禅语弹出（自带水平居中位移） */
@keyframes wf-zen-pop {
  0% { opacity: 0; transform: translate(-50%, 10px) scale(0.92); }
  14% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  78% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -12px) scale(0.98); }
}
.wf-zen {
  position: absolute;
  left: 50%;
  top: 13%;
  white-space: nowrap;
  pointer-events: none;
  animation: wf-zen-pop 2.3s ease-out forwards;
}

/* 里程碑横幅 */
@keyframes wf-banner-in {
  0% { opacity: 0; transform: translateY(-10px) scale(0.95); }
  12% { opacity: 1; transform: translateY(0) scale(1); }
  82% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-6px); }
}
.wf-banner {
  animation: wf-banner-in 2.6s ease-out forwards;
}

/* 连击徽标：弹入；疾风档持续脉冲 */
@keyframes wf-combo-pop {
  0% { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes wf-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.14); }
}
.wf-combo {
  animation: wf-combo-pop 0.25s ease-out;
}
.wf-combo-fast {
  animation: wf-pulse 0.45s ease-in-out infinite;
}

/* 连击时大数字加速跳动（快 / 疾风两档） */
.wf-num-mid {
  animation: wf-pulse 0.9s ease-in-out infinite;
}
.wf-num-fast {
  animation: wf-pulse 0.45s ease-in-out infinite;
}

.wf-fish {
  will-change: transform;
}
</style>
