<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <AudioLines class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">白噪音发生器</h1>
          <p class="text-sm text-muted-foreground mt-1">白 / 粉 / 棕噪音与雨声、海浪、风扇六种声景，WebAudio 实时合成零音频文件，助眠专注背景音</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线白噪音发生器：六种声景全部由浏览器 WebAudio 在本地实时合成——白噪音为均匀白噪声缓冲无缝循环，粉噪音经 Paul Kellet 简化近似滤波器做 -3dB/倍频程滚降，
        棕噪音由白噪积分得到低频厚重的轰声，雨声为粉噪带通 1-4kHz 叠加慢速随机增益起伏，海浪为棕噪低通叠加 8-12 秒周期潮汐涨落，风扇/空调为棕噪窄带通 250Hz 的稳定机械嗡声。
        不加载任何音频文件、零流量消耗；支持音量平方响度曲线调节、30/60/90 分钟定时（到时前 3 秒开始淡出）与剩余时间倒计时，适合掩蔽环境噪声、助眠放松与学习专注。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：播放控制面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Volume2 class="w-5 h-5 mr-2 text-primary" /> 播放控制
        </h2>

        <!-- 播放 / 暂停 -->
        <button
          @click="togglePlay"
          class="w-full px-4 py-3.5 rounded-lg text-base font-semibold transition flex items-center justify-center gap-2"
          :class="isPlaying ? 'bg-muted hover:bg-muted/80 border border-border text-foreground' : 'bg-primary text-primary-foreground hover:opacity-90'"
        >
          <template v-if="isPlaying">
            <Pause class="w-5 h-5" /> 暂停
          </template>
          <template v-else>
            <Play class="w-5 h-5" /> 播放{{ selectedName }}
          </template>
        </button>

        <!-- 音量（0-100，映射增益平方曲线） -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label for="wn-volume" class="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Volume2 class="w-4 h-4 text-primary" /> 音量
            </label>
            <span class="text-xs text-muted-foreground font-mono">{{ volume }}%</span>
          </div>
          <input
            id="wn-volume"
            v-model.number="volume"
            type="range"
            min="0"
            max="100"
            step="1"
            class="w-full accent-primary"
            aria-label="音量滑杆"
          />
          <p class="text-xs text-muted-foreground">滑杆按人耳响度口径映射为增益平方曲线：50% 时实际增益为 0.25，中段调节听感更线性。</p>
        </div>

        <!-- 定时停止 -->
        <div class="space-y-2">
          <label for="wn-timer" class="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Timer class="w-4 h-4 text-primary" /> 定时停止
          </label>
          <select
            id="wn-timer"
            v-model.number="timerMinutes"
            class="w-full h-10 px-2.5 bg-background border border-border border-border rounded-lg text-sm text-foreground"
          >
            <option v-for="opt in TIMER_OPTIONS" :key="opt.minutes" :value="opt.minutes">{{ opt.label }}</option>
          </select>
          <p class="text-xs text-muted-foreground">到时前 3 秒开始淡出、倒计时归零时恰好无声；播放中调整定时将从当前时刻重新计时。</p>
        </div>

        <!-- 重置 -->
        <button
          @click="resetAll"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-2"
        >
          <RefreshCw class="w-4 h-4" /> 重置全部设置
        </button>

        <!-- 静态提示条 -->
        <p class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>长期戴耳机大音量会损伤听力，建议 50% 以下音量；白噪音适合掩蔽环境噪声，不适合替代安静环境本身。</span>
        </p>

        <!-- 错误内联提示 -->
        <p v-if="audioError" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ audioError }}</span>
        </p>
      </div>

      <!-- 右：声景选择与状态（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <AudioLines class="w-5 h-5 mr-2 text-primary" /> 选择声景
          </h2>
          <span
            v-if="isPlaying"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-600"
          >
            <CheckCircle class="w-3.5 h-3.5" /> 播放中
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground"
          >
            <Info class="w-3.5 h-3.5" /> 未播放
          </span>
        </div>

        <!-- 声景卡片单选（6 张） -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            v-for="s in SOUNDSCAPES"
            :key="s.type"
            type="button"
            @click="selectSoundscape(s.type)"
            class="relative text-left rounded-lg border p-3 space-y-1.5 transition"
            :class="selectedType === s.type ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:bg-muted/60'"
            :aria-pressed="selectedType === s.type"
          >
            <CheckCircle
              v-if="selectedType === s.type"
              class="absolute top-2 right-2 w-4 h-4 text-primary"
            />
            <span class="inline-flex p-1.5 rounded-md" :class="s.tint">
              <component :is="s.icon" class="w-4 h-4" />
            </span>
            <p class="text-sm font-semibold text-foreground">{{ s.name }}</p>
            <p class="text-[11px] text-muted-foreground leading-relaxed">{{ s.desc }}</p>
          </button>
        </div>
        <p class="text-xs text-muted-foreground">
          点击卡片选中声景；播放中切换会自动交叉淡入新声景，已播放时长与定时继续累计。三种基础噪音由算法直接算出样本，雨声 / 海浪 / 风扇在噪音之上叠加滤波与慢速增益起伏。
        </p>

        <!-- 声波律动条（纯 CSS 动画，播放时按各自周期往复缩放） -->
        <div
          class="h-24 rounded-xl border border-border bg-muted/30 flex items-end justify-center gap-1 px-4 py-3 overflow-hidden select-none"
          aria-hidden="true"
        >
          <i
            v-for="n in 36"
            :key="n"
            class="flex-1 min-w-[3px] max-w-[8px] rounded-full bg-primary/40 noise-bar"
            :class="isPlaying ? 'noise-bar-active' : ''"
            :style="barStyle(n)"
          ></i>
        </div>
        <p class="text-center text-[10px] text-muted-foreground/70 -mt-3">
          {{ isPlaying ? '正在实时合成：' + selectedName : '选择声景并点击播放，波形开始律动' }}
        </p>

        <!-- 状态显示 -->
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">播放中声景</p>
            <p class="text-sm font-bold text-foreground truncate" :title="playingName">{{ playingName }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">已播放时长</p>
            <p class="text-sm font-bold text-foreground font-mono">{{ playedText }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">定时剩余</p>
            <p class="text-sm font-bold text-foreground font-mono">{{ remainText }}</p>
          </div>
        </div>
        <!-- 定时剩余进度条 -->
        <div v-if="isPlaying && timerTotalSec" class="h-1.5 bg-muted rounded-full overflow-hidden" aria-hidden="true">
          <div class="h-full bg-primary/70 rounded-full transition-all duration-300" :style="{ width: remainPercent + '%' }"></div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>白噪音发生器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          白噪音发生器是一款在浏览器里实时合成背景噪声的在线工具。它不依赖任何音频文件，而是用 WebAudio 接口按算法逐样本算出噪声：
          白噪音是均匀分布的随机信号，粉噪音经 Paul Kellet 简化近似滤波器让高频按每倍频程 -3dB 滚降，棕噪音对白噪音积分使能量集中在低频；
          在此之上，雨声叠加 1-4kHz 带通与慢速随机增益起伏，海浪叠加低通与 8-12 秒周期的潮汐涨落，风扇/空调叠加 250Hz 窄带通形成稳定的机械嗡声。
          页面提供音量调节、30/60/90 分钟定时淡出与倒计时，可用于掩蔽环境噪声、助眠放松或作为学习工作的背景音。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">白噪音是什么原理？（掩蔽效应）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          核心是掩蔽效应：一个声音的「可察觉度」取决于它与背景的对比，而不只是它自己的绝对响度。突发的说话声、关门声之所以吵，
          是因为它们从安静背景中「跳」出来；把一层均匀、宽带、稳定的噪声铺在听阈之上后，环境声需要越过更高的底噪才能被注意到，突兀感随之大幅下降。
          同时，稳定的噪声本身不含信息量，大脑对它会产生「习惯化」，听一会儿就不再主动注意——这两点共同解释了为什么一层简单的噪声能让人更容易入睡、更不容易被打断。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">白噪音、粉噪音、棕噪音有什么区别？（频谱与听感）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          三者的区别在于能量随频率的衰减斜率，直接决定了听感：
        </p>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground mt-2">
          <li><span class="font-semibold text-foreground">白噪音</span>：各频率能量相等（0 dB/倍频程），听感均匀偏亮，像收音机空白频道的「嘶」声；掩蔽人声、键盘声效果最强，但长时间大音量更容易听觉疲劳。</li>
          <li><span class="font-semibold text-foreground">粉噪音</span>：能量按每倍频程 -3dB 滚降，每个八度听上去一样响，听感是柔和的「沙」声；接近许多自然声与电子设备本底噪声的频谱，长时间收听更舒适。</li>
          <li><span class="font-semibold text-foreground">棕噪音</span>：能量按约 -6dB/倍频程滚降（可理解为对白噪音做积分），低频集中，听感低沉的「轰」声，像远雷、瀑布或高速公路；对掩蔽低频交通噪声与助眠最友好。</li>
        </ul>
        <p class="text-xs text-muted-foreground mt-2">
          本工具的粉噪采用 Paul Kellet 简化（economy）三极点滤波器、棕噪采用漏积分器，全部在缓冲生成阶段逐样本完成，不依赖任何滤波音频文件。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么雨声、海浪特别助眠？（掩蔽 + 节奏规律）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一是它们本质上仍是宽带噪声，掩蔽效应同样成立，能盖住街面与室内的大多数突发声；二是它们在噪声之上叠加了缓慢、规律的增益起伏——
          雨点的疏密、潮汐的涨落——这种接近 1/f 节奏的慢变化既足够「有生命感」让神经放松，又足够规律不至于唤起主动注意，
          比完全静止的噪声更不容易让人越听越清醒。本工具的雨声用两条频率互不整除的慢速 LFO 叠加模拟随机疏密，海浪用 8-12 秒随机周期的正弦起伏模拟潮汐，每次播放的周期都略有不同。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">学习 / 工作时放白噪音好吗？（因人而异）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          诚实的答案是：因人而异。如果你容易被突发人声、键盘声打断（尤其在开放式办公室），低音量的白噪 / 粉噪提供的稳定掩蔽通常有助于维持专注；
          但如果你在安静环境里本来就能专注，额外的噪声反而会占用一部分注意力资源，在记忆、阅读理解类任务上可能表现为变慢或出错变多。
          建议用 30-40% 音量、开启与关闭各试 10-15 分钟，以实际完成任务的表现（而不是当下「感觉」）来判断是否适合自己；
          长时间使用优先选粉噪 / 棕噪并配合定时功能，让听觉有规律的休息窗口。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">会不会耗流量？（零音频文件，全本地合成）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不会。本工具不内置、也不加载任何音频文件——六种声景全部由浏览器 WebAudio 在你的设备上实时合成（噪声缓冲 + 滤波器 + LFO 调制），
          打开页面之后不再产生任何音频相关的网络请求，也没有任何数据上传，页面保持打开时离线也能照常发声。
          噪声缓冲每段约 3 秒并做了无缝循环拼接，重复利用同一段内存，长时间播放也不会持续占用流量与大量内存。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">白噪音真的能助眠吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">对多数人有帮助，原理是掩蔽效应：用均匀稳定的宽带噪声盖住突发环境声、降低其突兀度，大脑不再被惊动就容易入睡。但个体差异明显，建议从粉噪或棕噪、30-40% 音量开始尝试，并用定时功能避免通宵播放。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">白噪音、粉噪音、棕噪音该选哪种？</h3>
            <p class="text-sm text-muted-foreground mt-1">想掩蔽人声、键盘声选白噪或粉噪；助眠、放松优先棕噪（低频厚重不刺耳）；喜欢自然氛围选雨声、海浪。简单记：越「棕」越低沉柔和，越「白」越明亮均匀。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">会不会耗流量或上传我的数据？</h3>
            <p class="text-sm text-muted-foreground mt-1">都不会。所有声音由 WebAudio 在本地实时合成，零音频文件、零网络请求；音量与声景偏好只保存在你本机浏览器的 localStorage 中，清除站点数据即恢复默认。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">长时间开着白噪音睡觉安全吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">关键在音量：长期大音量（尤其戴耳机）会损伤听力，建议保持在 50% 以下、以「刚好盖过环境噪声」为准，并使用 30/60/90 分钟定时淡出。白噪音只能掩蔽噪声，不能替代真正的安静环境与规律作息。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'white-noise-generator'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  AudioLines, Play, Pause, Volume2, Timer, CloudRain,
  CheckCircle, ChevronUp, ChevronDown, Info, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '白噪音发生器 - 在线白噪音/雨声/海浪助眠专注工具',
  description: '免费在线白噪音发生器：WebAudio 实时合成白噪音、粉噪音、棕噪音、雨声、海浪、风扇六种助眠专注声景，零音频文件不耗流量，音量调节与 30/60/90 分钟定时淡出、剩余时间倒计时，掩蔽环境噪声与学习背景音必备，纯浏览器本地运行',
  keywords: '白噪音,white noise,雨声助眠,专注音乐,学习背景音,粉噪音,棕噪音,白噪音发生器,助眠白噪音',
  author: '有条工具',
  ogTitle: '白噪音发生器 - 在线白噪音/雨声/海浪助眠专注工具 | 有条工具',
  ogDescription: 'WebAudio 实时合成六种声景，零音频文件零流量，定时淡出与倒计时，助眠专注背景音。',
  ogUrl: 'https://www.util.cn/tools/white-noise-generator',
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
          name: '白噪音发生器',
          url: 'https://www.util.cn/tools/white-noise-generator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['六种声景实时合成（白/粉/棕噪音、雨声、海浪、风扇）', 'WebAudio 本地合成零音频文件零流量', '音量平方响度曲线调节', '30/60/90 分钟定时与 3 秒淡出', '剩余时间倒计时与播放时长统计', '雨声随机疏密 / 海浪 8-12 秒潮汐 LFO 调制', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '白噪音发生器', item: 'https://www.util.cn/tools/white-noise-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '白噪音真的能助眠吗？',
              acceptedAnswer: { '@type': 'Answer', text: '对多数人有帮助，原理是掩蔽效应：用均匀稳定的宽带噪声盖住突发环境声、降低其突兀度，大脑不再被惊动就容易入睡。但个体差异明显，建议从粉噪或棕噪、30-40% 音量开始尝试，并用定时功能避免通宵播放。' }
            },
            {
              '@type': 'Question',
              name: '白噪音、粉噪音、棕噪音该选哪种？',
              acceptedAnswer: { '@type': 'Answer', text: '想掩蔽人声、键盘声选白噪或粉噪；助眠、放松优先棕噪（低频厚重不刺耳）；喜欢自然氛围选雨声、海浪。越棕越低沉柔和，越白越明亮均匀。' }
            },
            {
              '@type': 'Question',
              name: '会不会耗流量或上传我的数据？',
              acceptedAnswer: { '@type': 'Answer', text: '都不会。所有声音由 WebAudio 在本地实时合成，零音频文件、零网络请求；偏好设置只保存在本机浏览器 localStorage 中。' }
            },
            {
              '@type': 'Question',
              name: '长时间开着白噪音睡觉安全吗？',
              acceptedAnswer: { '@type': 'Answer', text: '关键在音量：长期大音量会损伤听力，建议保持在 50% 以下并使用定时淡出功能；白噪音只能掩蔽噪声，不能替代真正的安静环境与规律作息。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 说明：本区全部为不触碰浏览器 API / Vue 响应式的纯函数与常量，可整体抽出独立单测。
const NOISE_KINDS = ['white', 'pink', 'brown'] // 缓冲内核支持的噪声种类
const PINK_SCALE = 0.11   // 粉噪输出归一系数（Paul Kellet 对 economy 版的推荐量级，避免样本过热）
const BROWN_SCALE = 3.5   // 棕噪漏积分器经典补偿系数（把 0.02 步长的微小积分幅度放大到可听范围）
const SEAM_FADE_SAMPLES = 4096 // 循环接缝交叉淡化长度（约 93ms @44.1kHz，对 2-4 秒缓冲足够平滑）
const FADE_SECONDS = 3    // 定时到点前的淡出时长（秒）
const VOLUME_MAX = 100    // 音量滑杆上限

// 带通参数换算：中心频率取上下限的几何均值，Q = 中心频率 / 带宽。
// 例：雨声带通 1-4kHz → 中心 2000Hz、Q ≈ 0.667。
function bandpassParams(fLow, fHigh) {
  const lo = Math.max(1, Number(fLow) || 0)
  const hi = Math.max(lo + 1, Number(fHigh) || 0)
  const freq = Math.sqrt(lo * hi)
  return { freq: Math.round(freq), q: freq / (hi - lo) }
}

// 六种声景的合成参数描述（只描述、不执行，可在 Node 里直接断言）：
// type        缓冲内核噪声种类：'white' | 'pink' | 'brown'
// filterType  声源后的 BiquadFilter 类型；null = 不加滤波器（白/粉/棕的频谱整形已在内核完成）
// freq / q    滤波器频率与 Q 值（filterType 为 null 时为 0）
// gain        该声景的输出增益补偿（不同噪声能量不同，用来把响度拉到同一量级）
// modulation  增益起伏调制：null = 无；random-drift = 多条慢速 LFO 叠加模拟随机疏密（雨声）；
//             tide-swell = 单条正弦 LFO 模拟潮汐（海浪，播放时以 8-12s 随机周期起振）
function buildNoiseConfig(type) {
  switch (type) {
    // 白噪音：白噪声缓冲无缝循环 + 无滤波（平坦频谱），均匀「嘶」声
    case 'white':
      return { type: 'white', filterType: null, freq: 0, q: 0, gain: 0.3, modulation: null }
    // 粉噪音：-3dB/倍频程滚降由内核的 Paul Kellet 简化滤波器完成，无需 BiquadFilter
    case 'pink':
      return { type: 'pink', filterType: null, freq: 0, q: 0, gain: 0.45, modulation: null }
    // 棕噪音：白噪积分（内核完成），低频集中、听感低沉
    case 'brown':
      return { type: 'brown', filterType: null, freq: 0, q: 0, gain: 0.55, modulation: null }
    // 雨声：粉噪 + 带通 1-4kHz（中心 2000Hz、Q≈0.667）+ 慢速随机增益起伏（两条非整除频率 LFO 模拟疏密）
    case 'rain': {
      const bp = bandpassParams(1000, 4000)
      return { type: 'pink', filterType: 'bandpass', freq: bp.freq, q: bp.q, gain: 0.9, modulation: { kind: 'random-drift', depth: 0.3, lfoRatesHz: [0.11, 0.17] } }
    }
    // 海浪：棕噪 + 低通 + 周期 8-12s 的正弦增益起伏（潮汐；periodSec 为标称值，播放时随机化）
    case 'ocean':
      return { type: 'brown', filterType: 'lowpass', freq: 900, q: 0.7, gain: 0.6, modulation: { kind: 'tide-swell', depth: 0.4, periodSec: 10 } }
    // 风扇/空调：棕噪 + 窄带通 ~250Hz（稳定机械嗡声）
    case 'fan':
      return { type: 'brown', filterType: 'bandpass', freq: 250, q: 3, gain: 0.75, modulation: null }
    default:
      return null
  }
}

// 噪声样本内核：按 kind 产出 length 个原始样本（不含循环拼接，真实 AudioBuffer 在用户回调里创建）。
// - white：均匀白噪声（均值≈0、方差>0，频谱平坦）；
// - pink：白噪过 Paul Kellet 简化（economy）三极点滤波器，功率谱约 -3dB/倍频程滚降；
// - brown：白噪经漏积分器积分（约 -6dB/倍频程、低频集中），首个样本固定为 0（积分起点）。
// rand 可注入以做确定性单测，默认 Math.random。
function generateNoiseBufferKernel(kind, length, rand = Math.random) {
  const n = Math.max(0, Math.floor(Number(length) || 0))
  const out = new Float64Array(n)
  if (kind === 'pink') {
    let b0 = 0
    let b1 = 0
    let b2 = 0
    for (let i = 0; i < n; i++) {
      const w = rand() * 2 - 1
      b0 = 0.99765 * b0 + w * 0.0990460
      b1 = 0.96300 * b1 + w * 0.2965164
      b2 = 0.57000 * b2 + w * 1.0526913
      out[i] = (b0 + b1 + b2 + w * 0.1848) * PINK_SCALE
    }
  } else if (kind === 'brown') {
    let state = 0
    for (let i = 0; i < n; i++) {
      if (i > 0) state = (state + 0.02 * (rand() * 2 - 1)) / 1.02
      out[i] = state * BROWN_SCALE
    }
  } else {
    // white 与未知 kind：均匀白噪声
    for (let i = 0; i < n; i++) out[i] = rand() * 2 - 1
  }
  return out
}

// 无缝循环拼接：额外生成 fadeLen 个「尾部延续样本」，把缓冲头部 fadeLen 个样本改写为
// 「原头部样本 × t + 回绕延续样本 × (1-t)」的线性交叉淡化（t 从 0 递增到 1）。
// 效果：回绕点 out[len-1] → out[0] 恰好是同一连续噪声流的相邻样本（raw[len-1] → raw[len]），
// 数学上不存在接缝跳变，消除循环处的周期性咔哒声——对棕噪 / 粉噪这类样本间相关的波形尤其重要。
function makeLoopSamples(kind, length, rand = Math.random) {
  const len = Math.max(0, Math.floor(Number(length) || 0))
  if (len < 8) return generateNoiseBufferKernel(kind, len, rand) // 过短不做淡化
  const fadeLen = Math.min(SEAM_FADE_SAMPLES, Math.floor(len / 4))
  const raw = generateNoiseBufferKernel(kind, len + fadeLen, rand)
  const out = raw.slice(0, len)
  for (let j = 0; j < fadeLen; j++) {
    const t = (j + 1) / fadeLen // j=0 时几乎全取回绕延续样本，保证与 out[len-1] 连续
    out[j] = raw[j] * t + raw[len + j] * (1 - t)
  }
  return out
}

// 音量 → 线性增益：增益 = (百分比 / 100) 的平方，夹到 [0,1]。
// 人耳对响度的感知近似与声强（功率）成正比，而功率与增益平方成正比，
// 因此平方映射让滑杆中段的听感变化更接近线性（50% → 0.25 倍增益）。
function volumeToGain(percent) {
  const p = Number(percent)
  if (!Number.isFinite(p)) return 0
  const clamped = Math.min(VOLUME_MAX, Math.max(0, p)) / VOLUME_MAX
  return clamped * clamped
}

// 定时分钟 → 秒：30/60/90 分钟 → 1800/3600/5400 秒；0、负数或非法值 = 不限时（null）
function timerSecondsOf(minutes) {
  const m = Number(minutes)
  if (!Number.isFinite(m) || m <= 0) return null
  return Math.round(m * 60)
}

// 播放进度口径：elapsedSec 为本次已播放秒数（可为小数），timerSec 为定时时长秒数（null = 不限时）。
// 返回 playedSec（取整秒）、remainSec（向上取整的剩余秒数，不限时为 null）、
// fadeRemaining（剩余 ≤ FADE_SECONDS 秒时给出淡出时长，用于提前启动线性淡出，否则 null）、ended（已到时）。
function playProgressOf(elapsedSec, timerSec) {
  const played = Math.max(0, Math.floor(Number(elapsedSec) || 0))
  const t = Number(timerSec)
  if (!Number.isFinite(t) || t <= 0) {
    return { playedSec: played, remainSec: null, fadeRemaining: null, ended: false }
  }
  const remain = Math.max(0, Math.ceil(t - Number(elapsedSec)))
  return {
    playedSec: played,
    remainSec: remain,
    fadeRemaining: remain <= FADE_SECONDS ? remain : null,
    ended: Number(elapsedSec) >= t
  }
}

// 秒 → 时钟文本：不足 1 小时输出 mm:ss（如 00:59），满 1 小时输出 h:mm:ss（如 1:31:01）
function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const ss = String(s % 60).padStart(2, '0')
  const mm = String(Math.floor(s / 60) % 60).padStart(2, '0')
  const hour = Math.floor(s / 3600)
  return hour > 0 ? `${hour}:${mm}:${ss}` : `${mm}:${ss}`
}

// 海浪潮汐周期：给定 [0,1] 随机数返回 8-12 秒周期（每次播放随机取值，模拟天然潮汐的不完全规则）
function oceanPeriodOf(rand) {
  const r = Number(rand)
  const clamped = Number.isFinite(r) ? Math.min(1, Math.max(0, r)) : 0.5
  return 8 + clamped * 4
}

// ---------- 声景卡片与控制选项（含图标组件，非纯逻辑） ----------
const SOUNDSCAPES = [
  { type: 'white', name: '白噪音', desc: '全频均匀的「嘶」声，掩蔽人声杂音效果最强', icon: AudioLines, tint: 'bg-slate-500/10 text-slate-600' },
  { type: 'pink', name: '粉噪音', desc: '低频更足的柔和「沙」声，长时间听更不刺耳', icon: AudioLines, tint: 'bg-violet-500/10 text-violet-600' },
  { type: 'brown', name: '棕噪音', desc: '低沉厚重的「轰」声，像远雷与瀑布，最适助眠', icon: AudioLines, tint: 'bg-amber-500/10 text-amber-600' },
  { type: 'rain', name: '雨声', desc: '沙沙雨点疏密起伏，清脆而安定', icon: CloudRain, tint: 'bg-sky-500/10 text-sky-600' },
  { type: 'ocean', name: '海浪', desc: '约 10 秒一次缓慢涨落的潮汐声，松弛感强', icon: RefreshCw, tint: 'bg-cyan-500/10 text-cyan-600' },
  { type: 'fan', name: '风扇 / 空调', desc: '低沉稳定的机械嗡声，像身边的送风口', icon: Volume2, tint: 'bg-emerald-500/10 text-emerald-600' }
]

const TIMER_OPTIONS = [
  { minutes: 0, label: '不限时（持续播放）' },
  { minutes: 30, label: '30 分钟' },
  { minutes: 60, label: '60 分钟' },
  { minutes: 90, label: '90 分钟' }
]

// ---------- 页面状态 ----------
const seoContentVisible = ref(true)
const isPlaying = ref(false)
const audioError = ref('')
const selectedType = ref('white') // 当前选中的声景 key
const volume = ref(40)            // 0-100（默认 40，呼应「50% 以下」的听力建议）
const timerMinutes = ref(0)       // 0 = 不限时
const playedSec = ref(0)          // 已播放秒数（250ms 轮询刷新）
const remainSec = ref(null)       // 定时剩余秒数，null = 不限时

const selectedName = computed(() => {
  const hit = SOUNDSCAPES.find((s) => s.type === selectedType.value)
  return hit ? hit.name : '白噪音'
})
const playingName = computed(() => (isPlaying.value ? selectedName.value : '—'))
const playedText = computed(() => (isPlaying.value ? formatClock(playedSec.value) : '—'))
const remainText = computed(() => {
  if (!isPlaying.value) return '—'
  return remainSec.value === null ? '不限时' : formatClock(remainSec.value)
})
const timerTotalSec = computed(() => timerSecondsOf(timerMinutes.value))
const remainPercent = computed(() => {
  if (!timerTotalSec.value || remainSec.value === null) return 0
  return Math.max(0, Math.min(100, (remainSec.value / timerTotalSec.value) * 100))
})

// 律动条样式：按序号派生各自的基准高度、动画周期与相位（错开，避免整排同步摆动）
function barStyle(n) {
  const dur = (0.7 + ((n * 7) % 9) * 0.11).toFixed(2)
  const delay = (((n * 13) % 11) * 0.09).toFixed(2)
  const h = 22 + ((n * 29) % 62)
  return { height: h + '%', animationDuration: dur + 's', animationDelay: delay + 's' }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- WebAudio 资源（非响应式，仅用户回调 / 定时器中触碰，SSR 安全） ----------
let audioCtx = null
let masterGain = null
let activeVoice = null        // 当前声部 { src, voiceGain, modGain, lfos: [] }
const bufferCache = new Map() // kind → AudioBuffer（随 audioCtx 生命周期，unmount 时清空）
let tickTimer = null          // 250ms 状态轮询定时器
let playStartAt = 0           // 本次播放开始时刻（Date.now()）
let timerEndAt = 0            // 定时结束时刻（0 = 不限时）
let fadeArmed = false         // 是否已启动到时淡出

const BUFFER_SECONDS = 3 // 循环缓冲时长：3 秒（2-4 秒无缝循环口径的中值）
const TICK_MS = 250      // 状态轮询周期

function ensureAudioContext() {
  if (audioCtx) return audioCtx
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  audioCtx = new Ctx() // 仅在用户点击回调中创建（SSR / 自动播放策略安全）
  masterGain = audioCtx.createGain()
  masterGain.gain.value = volumeToGain(volume.value)
  masterGain.connect(audioCtx.destination)
  bufferCache.clear()
  return audioCtx
}

// 按噪声种类生成（并缓存）无缝循环 AudioBuffer：样本由纯函数 makeLoopSamples 算出
function ensureBuffer(kind) {
  if (!audioCtx) return null
  const cached = bufferCache.get(kind)
  if (cached) return cached
  const len = Math.max(1, Math.floor(audioCtx.sampleRate * BUFFER_SECONDS))
  const buffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate)
  buffer.getChannelData(0).set(makeLoopSamples(kind, len))
  bufferCache.set(kind, buffer)
  return buffer
}

// 增益起伏调制：把慢速 LFO 振荡器接入 modGain.gain（与声部淡入淡出用的 voiceGain 分离，
// 保证定时淡出把 voiceGain 拉到 0 时声音一定归零，不被 LFO 残留分量顶住）。返回 LFO 列表以便停止。
function attachModulation(cfg, modGain) {
  const mod = cfg.modulation
  if (!mod || !audioCtx) return []
  const oscs = []
  // random-drift（雨声）：两条非整除频率的慢速正弦叠加，波形不周期重复，听感接近随机疏密；
  // tide-swell（海浪）：单条正弦，周期每次播放从 8-12s 随机取值。
  const rates = mod.kind === 'random-drift'
    ? mod.lfoRatesHz
    : [1 / oceanPeriodOf(Math.random())]
  for (const rate of rates) {
    const osc = audioCtx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = rate
    const depthGain = audioCtx.createGain()
    depthGain.gain.value = mod.depth / rates.length
    osc.connect(depthGain)
    depthGain.connect(modGain.gain)
    osc.start()
    oscs.push(osc)
  }
  return oscs
}

// 搭建声部：BufferSource(loop) → [BiquadFilter] → voiceGain(淡入到 cfg.gain) → modGain(1±LFO) → masterGain
function startVoice(cfg) {
  if (!audioCtx || !masterGain || !cfg) return null
  const buffer = ensureBuffer(cfg.type)
  if (!buffer) return null
  const src = audioCtx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  let head = src
  if (cfg.filterType) {
    const filter = audioCtx.createBiquadFilter()
    filter.type = cfg.filterType
    filter.frequency.value = cfg.freq
    filter.Q.value = cfg.q
    src.connect(filter)
    head = filter
  }
  const voiceGain = audioCtx.createGain()
  voiceGain.gain.value = 0
  head.connect(voiceGain)
  const modGain = audioCtx.createGain()
  modGain.gain.value = 1
  voiceGain.connect(modGain)
  modGain.connect(masterGain)
  // 150ms 淡入，避免起播爆音
  const t = audioCtx.currentTime
  voiceGain.gain.setValueAtTime(0, t)
  voiceGain.gain.linearRampToValueAtTime(cfg.gain, t + 0.15)
  const lfos = attachModulation(cfg, modGain)
  src.start()
  // 源停止后自动摘除节点，长会话不累积残留
  src.onended = () => {
    try { voiceGain.disconnect() } catch { /* 已断开则忽略 */ }
    try { modGain.disconnect() } catch { /* 已断开则忽略 */ }
  }
  return { src, voiceGain, modGain, lfos }
}

// 停止声部：voiceGain 快速淡出 + 源与 LFO 定点 stop（voiceGain 无 LFO 直连，.value 读取精确无跳变）
function stopVoice(voice, fadeSec = 0.08) {
  if (!voice || !audioCtx) return
  const t = audioCtx.currentTime
  const g = voice.voiceGain.gain
  try {
    g.cancelScheduledValues(t)
    g.setValueAtTime(g.value, t)
    g.linearRampToValueAtTime(0, t + fadeSec)
    voice.src.stop(t + fadeSec + 0.02)
  } catch { /* 已停止则忽略 */ }
  for (const osc of voice.lfos) {
    try { osc.stop(t + fadeSec + 0.05) } catch { /* 已停止则忽略 */ }
  }
}

// ---------- 播放控制（用户回调，SSR 安全） ----------
function rearmTimer() {
  fadeArmed = false
  const sec = timerSecondsOf(timerMinutes.value)
  timerEndAt = sec === null ? 0 : Date.now() + sec * 1000
}

function startPlayback() {
  audioError.value = ''
  const ctx = ensureAudioContext()
  if (!ctx) {
    audioError.value = '当前浏览器不支持 WebAudio（缺少 AudioContext），请更换最新版 Chrome / Edge / Safari / Firefox。'
    return
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  const cfg = buildNoiseConfig(selectedType.value)
  if (!cfg) {
    audioError.value = '声景参数异常，请重新选择声景后再播放。'
    return
  }
  stopVoice(activeVoice)
  activeVoice = startVoice(cfg)
  if (!activeVoice) {
    audioError.value = '音频初始化失败，请刷新页面后重试。'
    return
  }
  playStartAt = Date.now()
  rearmTimer()
  isPlaying.value = true
  startTick()
}

function pausePlayback() {
  stopVoice(activeVoice)
  activeVoice = null
  isPlaying.value = false
  stopTick()
  playedSec.value = 0
  remainSec.value = null
  timerEndAt = 0
  fadeArmed = false
}

function togglePlay() {
  if (isPlaying.value) pausePlayback()
  else startPlayback()
}

// 播放中切换声景：旧声部 80ms 淡出、新声部 150ms 淡入；已播放时长与定时继续累计，
// 若正处于到时淡出中则视为继续收听，重新武装定时。
function selectSoundscape(type) {
  selectedType.value = type
  if (!isPlaying.value) return
  const cfg = buildNoiseConfig(type)
  stopVoice(activeVoice)
  activeVoice = startVoice(cfg)
  if (fadeArmed) rearmTimer()
}

function resetAll() {
  pausePlayback()
  selectedType.value = 'white'
  volume.value = 40
  timerMinutes.value = 0
  audioError.value = ''
}

// 到时淡出：把 voiceGain 从当前值在剩余秒数内线性拉到 0（倒计时归零时恰好无声），并定点停源
function beginFadeOut(durSec) {
  if (!activeVoice || !audioCtx) return
  const dur = Math.max(0.1, durSec)
  const t = audioCtx.currentTime
  const g = activeVoice.voiceGain.gain
  try {
    g.cancelScheduledValues(t)
    g.setValueAtTime(g.value, t)
    g.linearRampToValueAtTime(0, t + dur)
    activeVoice.src.stop(t + dur + 0.05)
  } catch { /* 已停止则忽略 */ }
}

// ---------- 定时轮询（250ms，状态显示 + 到时淡出触发） ----------
function tick() {
  if (!audioCtx || !isPlaying.value) return
  const elapsed = (Date.now() - playStartAt) / 1000
  const timerSec = timerEndAt > 0 ? Math.max(0, (timerEndAt - playStartAt) / 1000) : null
  const prog = playProgressOf(elapsed, timerSec)
  playedSec.value = prog.playedSec
  remainSec.value = prog.remainSec
  // 剩余 ≤3 秒：启动淡出（淡出时长 = 剩余秒数，保证归零时无声）
  if (prog.fadeRemaining !== null && !fadeArmed && activeVoice) {
    fadeArmed = true
    beginFadeOut(prog.fadeRemaining)
  }
  if (prog.ended) pausePlayback()
}

function startTick() {
  if (tickTimer === null) tickTimer = setInterval(tick, TICK_MS)
}

function stopTick() {
  if (tickTimer !== null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

// 音量实时生效（平方曲线），并持久化偏好
watch(volume, (v) => {
  if (audioCtx && masterGain) {
    masterGain.gain.setTargetAtTime(volumeToGain(v), audioCtx.currentTime, 0.05)
  }
})

// 播放中调整定时：从当前时刻重新计时
watch(timerMinutes, () => {
  if (isPlaying.value) rearmTimer()
})

// ---------- localStorage 持久化（声景 / 音量 / 定时，try/catch 兜底） ----------
const STORAGE_KEY = 'white-noise-generator-prefs'

function loadPrefs() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object') return
    if (typeof saved.volume === 'number') volume.value = Math.min(100, Math.max(0, Math.round(saved.volume)))
    if (SOUNDSCAPES.some((s) => s.type === saved.soundscape)) selectedType.value = saved.soundscape
    if (TIMER_OPTIONS.some((o) => o.minutes === saved.timerMinutes)) timerMinutes.value = saved.timerMinutes
  } catch {
    /* localStorage 不可用或数据损坏时忽略，使用默认值 */
  }
}

function savePrefs() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      volume: volume.value,
      soundscape: selectedType.value,
      timerMinutes: timerMinutes.value
    }))
  } catch {
    /* 写入失败（隐私模式 / 配额满）时静默忽略 */
  }
}

watch([volume, timerMinutes, selectedType], savePrefs)

onMounted(() => {
  loadPrefs()
  addRecentTool('white-noise-generator')
})

onBeforeUnmount(() => {
  // 1) 停止 250ms 状态轮询定时器
  stopTick()
  // 2) 停止当前声部：噪声源 stop + 全部 LFO 调制振荡器 stop（onended 随后摘除节点）
  stopVoice(activeVoice)
  activeVoice = null
  isPlaying.value = false
  // 3) 关闭并释放 AudioContext，清空缓冲缓存与主增益引用
  bufferCache.clear()
  masterGain = null
  if (audioCtx) {
    try { audioCtx.close() } catch { /* 已关闭则忽略 */ }
    audioCtx = null
  }
})
</script>

<style scoped>
/* 声波律动条：播放时按各自周期与相位往复缩放（纯 CSS 动画，零依赖；transform 不触发布局） */
.noise-bar {
  transform-origin: bottom;
  transform: scaleY(0.3);
  opacity: 0.45;
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.noise-bar-active {
  animation-name: wn-bar-swing;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  transition: none;
  opacity: 1;
}
@keyframes wn-bar-swing {
  from { transform: scaleY(0.25); }
  to { transform: scaleY(1); }
}
</style>
