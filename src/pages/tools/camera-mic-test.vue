<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Webcam class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">摄像头麦克风测试</h1>
          <p class="text-sm text-muted-foreground mt-1">视频会议前快速自检摄像头画面与麦克风声音，实测分辨率、帧率与输入电平</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线摄像头麦克风测试工具：本地回显摄像头画面并实测分辨率与帧率，实时绘制麦克风时域波形与 dBFS 电平条，支持 5 秒录音回放自检采集链路。
        视频会议（腾讯会议 / Zoom / 飞书）前花一分钟确认设备可用，避免开会才发现「对方看不到我」「听不到我说话」。
        全程零上传：画面与声音只在你的浏览器内存中处理，关闭页面即释放。
      </p>
    </div>

    <!-- 环境提示条（onMounted 判定） -->
    <div
      v-if="envNotice.level === 'warn'"
      class="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 flex items-start gap-2"
    >
      <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{{ envNotice.text }}</span>
    </div>
    <div
      v-else-if="envNotice.level === 'error'"
      class="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 flex items-start gap-2"
    >
      <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{{ envNotice.text }}</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 摄像头卡片 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Video class="w-5 h-5 mr-2 text-primary" /> 摄像头测试
        </h2>

        <!-- 权限 / 状态行 -->
        <p class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5" :class="LEVEL_CLASSES[camHint.level]">
          <CheckCircle v-if="camPerm === 'granted'" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <TriangleAlert v-else-if="camPerm === 'denied' || camPerm === 'notfound'" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <Info v-else class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ camHint.text }}</span>
        </p>

        <!-- 本地回显 -->
        <div class="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <video ref="videoRef" autoplay muted playsinline class="w-full h-full object-contain" @loadedmetadata="handleVideoMeta"></video>
          <div v-if="!camOn" class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-muted-foreground">
            <Webcam class="w-10 h-10 mb-2 opacity-40" />
            <p class="text-sm font-medium">点击「开启摄像头」开始本地回显</p>
            <p class="text-xs opacity-70 mt-1">画面只在本地显示，不会被录制或上传</p>
          </div>
          <div v-else class="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-card/80 border border-border text-xs text-foreground pointer-events-none font-mono">
            {{ camResolutionText }}
          </div>
        </div>

        <!-- 设备选择 -->
        <div class="flex items-center gap-2">
          <select
            v-model="camDeviceId"
            :disabled="!camOn || camDevices.length === 0"
            class="flex-1 h-9 px-2.5 bg-background border border-border border-border rounded-lg text-sm text-foreground disabled:opacity-50"
            @change="switchCamera"
          >
            <option v-for="(d, i) in camDevices" :key="d.deviceId || i" :value="d.deviceId">{{ deviceLabelOf(d, i) }}</option>
          </select>
          <button
            @click="refreshCamDevices"
            :disabled="!camOn"
            title="重新读取设备列表"
            class="h-9 w-9 flex-shrink-0 flex items-center justify-center bg-muted hover:bg-muted/80 border border-border rounded-lg text-muted-foreground transition disabled:opacity-50"
          >
            <RefreshCw class="w-4 h-4" />
          </button>
        </div>

        <!-- 操作按钮 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="startCamera()"
            :disabled="camOn || camPerm === 'requesting'"
            class="px-4 py-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" />{{ camPerm === 'requesting' ? '等待授权…' : '开启摄像头' }}
          </button>
          <button
            @click="stopCamera"
            :disabled="!camOn"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Square class="w-4 h-4 inline mr-1.5 -mt-0.5" />停止
          </button>
        </div>

        <!-- 错误内联提示 -->
        <p v-if="camError" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ camError }}</span>
        </p>

        <!-- 实测信息卡 -->
        <div class="grid grid-cols-2 gap-2 text-center">
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">实测分辨率</p>
            <p class="text-sm font-bold text-foreground font-mono">{{ camResolutionText }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">实测帧率</p>
            <p class="text-sm font-bold text-foreground font-mono">{{ camFpsText }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">协商参数（track.getSettings）</p>
            <p class="text-sm font-bold text-foreground font-mono">{{ camSettingsText }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">当前设备</p>
            <p class="text-sm font-bold text-foreground truncate" :title="camLabel">{{ camLabel }}</p>
          </div>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          分辨率与帧率均为「实测值」：实测帧率按画面实际刷新计数（2 秒滑动窗口），可能与摄像头标称值不同，一切以浏览器与设备的协商结果为准。视频会议建议实测分辨率不低于 640×360，最好达到 1280×720。
        </p>
      </div>

      <!-- 麦克风卡片 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Mic class="w-5 h-5 mr-2 text-primary" /> 麦克风测试
        </h2>

        <!-- 权限 / 状态行 -->
        <p class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5" :class="LEVEL_CLASSES[micHint.level]">
          <CheckCircle v-if="micPerm === 'granted'" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <TriangleAlert v-else-if="micPerm === 'denied' || micPerm === 'notfound'" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <Info v-else class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ micHint.text }}</span>
        </p>

        <!-- 实时波形 -->
        <div class="relative w-full h-[120px] bg-muted/40 border border-border rounded-lg overflow-hidden">
          <canvas ref="micCanvasRef" class="absolute inset-0 w-full h-full"></canvas>
          <div v-if="!micOn" class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-muted-foreground">
            <Mic class="w-8 h-8 mb-1.5 opacity-40" />
            <p class="text-sm font-medium">开启后对麦克风说话，波形与电平应明显摆动</p>
          </div>
        </div>

        <!-- 电平条 -->
        <div>
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="text-muted-foreground">输入电平（-60 ~ 0 dBFS）</span>
            <span class="font-mono font-bold text-foreground">{{ micDbfsText }}</span>
          </div>
          <div class="h-3 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 rounded-full"
              :style="{ width: micLevelPercent + '%' }"
            ></div>
          </div>
          <p
            v-if="micOn && micDbfs <= SILENT_DBFS"
            class="mt-2 text-xs leading-relaxed text-amber-700 bg-amber-500/10 rounded p-2 flex items-start gap-1.5"
          >
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>对麦克风说话时电平应明显摆动；当前低于 -50 dBFS，几乎无声。请检查是否选错输入设备、麦克风被静音或系统输入音量为 0。</span>
          </p>
        </div>

        <!-- 操作按钮 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="startMic"
            :disabled="micOn || micPerm === 'requesting'"
            class="px-4 py-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" />{{ micPerm === 'requesting' ? '等待授权…' : '开启麦克风' }}
          </button>
          <button
            @click="stopMic"
            :disabled="!micOn"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Square class="w-4 h-4 inline mr-1.5 -mt-0.5" />停止
          </button>
        </div>

        <!-- 录音回放测试 -->
        <div class="bg-muted/40 border border-border rounded-lg p-3 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-medium text-foreground">录音回放测试</p>
            <button
              @click="startRecording"
              :disabled="!micOn || recState === 'recording'"
              class="px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ recState === 'recording' ? `录制中 ${recCountdown}s` : '录制 5 秒' }}
            </button>
          </div>
          <audio v-if="audioUrl" :src="audioUrl" controls class="w-full"></audio>
          <p class="text-xs text-muted-foreground leading-relaxed">
            点击后自动录制 5 秒并停止，生成回放。建议戴耳机回放以避免回声；如果回放无声，说明采集链路有问题（输入设备选错、被静音或系统权限未放行）。
          </p>
        </div>

        <!-- 错误内联提示 -->
        <p v-if="micError" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ micError }}</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>摄像头麦克风测试是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          摄像头麦克风测试是一款浏览器本地设备自检工具。它通过 getUserMedia 分别申请摄像头与麦克风权限：摄像头部分在本地回显画面，
          读取 video 元素的实际分辨率、按画面刷新计数实测帧率，并列出 track.getSettings() 中浏览器与设备协商出的参数，还支持在多个摄像头之间切换；
          麦克风部分用 AudioContext + AnalyserNode 每帧读取 2048 个时域采样点，实时绘制波形并按 RMS 换算 dBFS 电平，
          同时支持用 MediaRecorder 录 5 秒再回放，验证「采集 → 编码 → 播放」整条链路。所有数据只在内存中处理，零上传。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么测摄像头和麦克风能不能用？</h3>
        <ol class="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>点「开启摄像头」并在浏览器弹窗中允许权限，看到自己的画面即采集正常；观察实测分辨率与帧率是否达标。</li>
          <li>有多个摄像头时，用下拉框切换并确认每个都能出画面（外接 USB 摄像头、虚拟摄像头都可测）。</li>
          <li>点「开启麦克风」，对着麦克风正常说话，波形应随之起伏，电平数字应明显上摆。</li>
          <li>点「录制 5 秒」，倒计时结束后播放录音：能听到自己刚才的声音，说明采集、编码与回放链路都正常。</li>
          <li>两个设备都测完后点「停止」释放设备，避免下次开会时摄像头被占用。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">视频会议前自检清单</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>分辨率：实测达到 1280×720（720p）及以上，至少不低于 640×360。</li>
          <li>帧率：实测不低于 15 fps，低于此值画面会明显卡顿。</li>
          <li>电平：正常说话时电平应在 -40 ~ 0 dBFS 之间明显摆动，长期低于 -50 dBFS 说明几乎无声。</li>
          <li>回放：5 秒录音回放清晰可闻、无断续；戴耳机回放避免回声啸叫。</li>
          <li>环境：确认页面运行在 HTTPS 或 localhost 下，否则浏览器可能拒绝授予设备权限。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">浏览器提示权限被拒绝怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">Chrome 可点击地址栏左侧的锁图标 → 网站设置 → 把「摄像头」「麦克风」改为「允许」，然后刷新页面重试；macOS 用户还需要在 系统设置 → 隐私与安全性 → 摄像头 / 麦克风 中勾选当前浏览器。若改完后仍失败，检查是否被其他会议软件占用了设备。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">测试画面和录音会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会，零上传。摄像头画面只通过本地 video 元素回显，波形与电平在浏览器内存中计算，录音 Blob 也只存在内存里，页面不发送任何包含音视频的网络请求，关闭或刷新页面后立即释放。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">实测帧率为什么比摄像头标称值低？</h3>
            <p class="text-sm text-muted-foreground mt-1">浏览器会根据光线、带宽与设备能力重新协商参数：光线不足时摄像头可能自动降到 15-20 fps，虚拟摄像头也可能只提供固定帧率。本工具的帧率按画面实际刷新计数（2 秒滑动窗口平均），反映的是真实输出，比标称值更有参考意义。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'camera-mic-test'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Webcam, Mic, Video, Play, Square, TriangleAlert, CheckCircle,
  ChevronUp, ChevronDown, Info, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '摄像头麦克风测试 - 在线摄像头/麦克风检测与录音回放工具',
  description: '免费在线摄像头麦克风测试工具：本地回显画面、实测分辨率与帧率、实时麦克风电平 dBFS 与波形、5 秒录音回放自检，视频会议前快速排查设备不可用，纯浏览器本地运行零上传',
  keywords: '摄像头测试,麦克风测试,摄像头在线检测,麦克风检测,视频会议自检,麦克风电平测试,录音回放测试,摄像头帧率测试',
  author: '有条工具',
  ogTitle: '摄像头麦克风测试 - 在线摄像头/麦克风检测工具 | 有条工具',
  ogDescription: '实测分辨率、帧率与麦克风电平，录音回放自检采集链路，视频会议前一键自检。',
  ogUrl: 'https://www.util.cn/tools/camera-mic-test',
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
          name: '摄像头麦克风测试',
          url: 'https://www.util.cn/tools/camera-mic-test',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['摄像头本地回显与实测分辨率', '实测帧率（2 秒滑动窗口）', '多摄像头设备切换', '麦克风电平 dBFS 实时监测', '时域波形可视化', '5 秒录音回放自检', '零上传本地运行']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '摄像头麦克风测试', item: 'https://www.util.cn/tools/camera-mic-test/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '浏览器提示权限被拒绝怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: 'Chrome 可点击地址栏左侧的锁图标 → 网站设置 → 把「摄像头」「麦克风」改为「允许」，然后刷新页面重试；macOS 用户还需要在 系统设置 → 隐私与安全性 → 摄像头/麦克风 中勾选当前浏览器。若改完后仍失败，检查是否被其他会议软件占用了设备。' }
            },
            {
              '@type': 'Question',
              name: '测试画面和录音会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，零上传。摄像头画面只通过本地 video 元素回显，波形与电平在浏览器内存中计算，录音 Blob 也只存在内存里，页面不发送任何包含音视频的网络请求，关闭或刷新页面后立即释放。' }
            },
            {
              '@type': 'Question',
              name: '实测帧率为什么比摄像头标称值低？',
              acceptedAnswer: { '@type': 'Answer', text: '浏览器会根据光线、带宽与设备能力重新协商参数：光线不足时摄像头可能自动降到 15-20 fps，虚拟摄像头也可能只提供固定帧率。本工具的帧率按画面实际刷新计数（2 秒滑动窗口平均），反映的是真实输出。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const SILENT_DBFS = -50    // 电平低于此值视为「几乎无声」
const FPS_WINDOW_MS = 2000 // 实测帧率的滑动窗口时长

// RMS 换算 dBFS：rms<=0 时钳制到 -100，保留 1 位小数
function rmsToDbfs(rms) {
  if (!(rms > 0)) return -100
  return Math.max(-100, Math.round(20 * Math.log10(rms) * 10) / 10)
}

// dBFS 映射到电平条宽度百分比：-60~0 线性映射 0~100
function dbfsToPercent(dbfs) {
  if (dbfs <= -60) return 0
  if (dbfs >= 0) return 100
  return Math.round(((dbfs + 60) / 60) * 100)
}

// 权限状态机文案映射
const PERMISSION_HINTS = {
  idle: { text: '尚未请求权限：点击下方「开启」按钮，并在浏览器弹窗中选择「允许」。', level: 'muted' },
  requesting: { text: '正在请求设备权限，请在浏览器弹窗中点击「允许」。', level: 'warn' },
  granted: { text: '已获得权限，设备采集正常。', level: 'ok' },
  denied: { text: '权限已被拒绝：Chrome 可点击地址栏锁图标 → 网站设置 → 将「摄像头 / 麦克风」改为允许；macOS 还需在 系统设置 → 隐私与安全性 → 摄像头 / 麦克风 中勾选当前浏览器。', level: 'error' },
  notfound: { text: '未检测到可用设备，请确认设备已连接并在系统中被识别。', level: 'error' }
}

function permissionHint(state) {
  return PERMISSION_HINTS[state] || PERMISSION_HINTS.idle
}

// 环境判定：不支持 mediaDevices → error；非 HTTPS 且非 localhost → warn
function envNoticeOf(protocol, hostname, hasMediaDevices) {
  if (!hasMediaDevices) {
    return { level: 'error', text: '当前浏览器不支持设备采集（缺少 navigator.mediaDevices），请更换最新版 Chrome / Edge / Safari / Firefox。' }
  }
  const secure = protocol === 'https:'
  const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)
  if (!secure && !local) {
    return { level: 'warn', text: '摄像头/麦克风权限需要 HTTPS 或 localhost 环境，当前页面可能无法申请设备权限。' }
  }
  return { level: 'ok', text: '' }
}

// 设备显示名：label 为空时按序号回退
function deviceLabelOf(device, index) {
  const label = ((device && device.label) || '').trim()
  return label || `摄像头 ${index + 1}`
}

// 实测帧率：按 currentTime 变化时刻样本，在滑动窗口内做平均（样本不足返回 null）
function fpsFromSamples(samples, now, windowMs = FPS_WINDOW_MS) {
  const recent = samples.filter((t) => t > now - windowMs)
  if (recent.length < 2) return null
  const span = now - recent[0]
  if (span <= 0) return null
  return Math.round(((recent.length - 1) * 1000) / span)
}

// 录音编码选择：优先 audio/webm，不支持（如 Safari）时返回空串使用浏览器默认
function pickRecorderMime(isTypeSupported) {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm']
  for (const mime of candidates) {
    if (isTypeSupported(mime)) return mime
  }
  return ''
}

// 绘制时域波形：中心基线 + 实际采样折线
function drawWaveform(ctx, data, w, h) {
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, h / 2)
  ctx.lineTo(w, h / 2)
  ctx.stroke()
  if (!data || !data.length) return
  ctx.strokeStyle = '#2563eb'
  ctx.lineWidth = 2
  ctx.beginPath()
  const step = w / (data.length - 1)
  const amp = h / 2 - 4
  for (let i = 0; i < data.length; i++) {
    const v = Math.max(-1, Math.min(1, data[i]))
    const x = i * step
    const y = h / 2 - v * amp
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

// 权限文案配色
const LEVEL_CLASSES = {
  muted: 'bg-muted/60 text-muted-foreground',
  warn: 'bg-amber-500/10 text-amber-700',
  ok: 'bg-green-500/10 text-green-700',
  error: 'bg-red-500/10 text-red-600'
}

// ---------- 页面状态 ----------
const seoContentVisible = ref(true)
const envNotice = ref({ level: 'ok', text: '' })

// 摄像头
const camPerm = ref('idle')
const camOn = ref(false)
const camError = ref('')
const camDevices = ref([])
const camDeviceId = ref('')
const camResolutionText = ref('—')
const camFpsText = ref('—')
const camSettingsText = ref('—')
const camLabel = ref('—')
const videoRef = ref(null)

// 麦克风
const micPerm = ref('idle')
const micOn = ref(false)
const micError = ref('')
const micDbfs = ref(-100)
const micCanvasRef = ref(null)
const audioUrl = ref('')
const recState = ref('idle')
const recCountdown = ref(0)

const camHint = computed(() => permissionHint(camPerm.value))
const micHint = computed(() => permissionHint(micPerm.value))
const micDbfsText = computed(() => (micOn.value ? `${micDbfs.value.toFixed(1)} dBFS` : '—'))
const micLevelPercent = computed(() => (micOn.value ? dbfsToPercent(micDbfs.value) : 0))

// ---------- 非响应式内部句柄（仅用户回调 / rAF 中触碰，SSR 安全） ----------
let camStream = null
let micStream = null
let audioContext = null
let analyser = null
let floatData = null
let micCtx = null
let micW = 0
let micH = 0
let mediaRecorder = null
let recChunks = []
let recTimer = null
let rafId = null
let lastVideoTime = -1
let fpsSamples = []
let lastCamUiTs = 0
let lastMicUiTs = 0

// ---------- 事件处理（仅在用户回调中访问浏览器 API，SSR 安全） ----------
async function startCamera(deviceId) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    camPerm.value = 'idle'
    camError.value = '当前浏览器不支持设备采集（缺少 navigator.mediaDevices）'
    return
  }
  const targetId = deviceId || camDeviceId.value
  camPerm.value = 'requesting'
  camError.value = ''
  try {
    const video = { width: { ideal: 1280 }, height: { ideal: 720 } }
    if (targetId) video.deviceId = { exact: targetId }
    const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false })
    stopCameraTracks() // 切换设备时先释放旧流
    camStream = stream
    const el = videoRef.value
    if (el) {
      el.srcObject = stream
      if (el.play) el.play().catch(() => {})
    }
    camOn.value = true
    camPerm.value = 'granted'
    lastVideoTime = -1
    fpsSamples = []
    readTrackSettings()
    const track = stream.getVideoTracks()[0]
    camLabel.value = (track && track.label) || '未知设备'
    await refreshCamDevices()
  } catch (err) {
    const name = err && err.name
    if (name === 'OverconstrainedError' && targetId) {
      // 设备列表过期（如被拔出）时退回默认摄像头重试一次
      camDeviceId.value = ''
      return startCamera('')
    }
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      camPerm.value = 'denied'
    } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
      camPerm.value = 'notfound'
    } else {
      camPerm.value = 'idle'
    }
    camError.value = `摄像头开启失败：${(err && err.message) || '未知错误'}`
  }
}

function stopCameraTracks() {
  if (camStream) {
    camStream.getTracks().forEach((t) => t.stop())
    camStream = null
  }
}

function stopCamera() {
  stopCameraTracks()
  const el = videoRef.value
  if (el) el.srcObject = null
  camOn.value = false
  camResolutionText.value = '—'
  camFpsText.value = '—'
  camSettingsText.value = '—'
  camLabel.value = '—'
}

async function refreshCamDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    camDevices.value = devices.filter((d) => d.kind === 'videoinput')
    if (!camDeviceId.value && camDevices.value.length) {
      camDeviceId.value = camDevices.value[0].deviceId
    }
  } catch {
    camDevices.value = []
  }
}

function switchCamera() {
  if (camDeviceId.value) startCamera(camDeviceId.value)
}

function handleVideoMeta() {
  const el = videoRef.value
  if (el && el.videoWidth) {
    camResolutionText.value = `${el.videoWidth}×${el.videoHeight}`
  }
}

function readTrackSettings() {
  const track = camStream && camStream.getVideoTracks()[0]
  if (!track || typeof track.getSettings !== 'function') {
    camSettingsText.value = '—'
    return
  }
  const s = track.getSettings() || {}
  const parts = []
  if (s.width && s.height) parts.push(`${s.width}×${s.height}`)
  if (s.frameRate) parts.push(`${Math.round(s.frameRate)} fps`)
  camSettingsText.value = parts.length ? parts.join(' · ') : '—'
}

async function startMic() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    micPerm.value = 'idle'
    micError.value = '当前浏览器不支持设备采集（缺少 navigator.mediaDevices）'
    return
  }
  micPerm.value = 'requesting'
  micError.value = ''
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true }
    })
    micStream = stream
    const Ctx = window.AudioContext || window.webkitAudioContext
    audioContext = new Ctx()
    const source = audioContext.createMediaStreamSource(stream)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048
    floatData = new Float32Array(analyser.fftSize)
    source.connect(analyser)
    resizeMicCanvas()
    micOn.value = true
    micPerm.value = 'granted'
  } catch (err) {
    const name = err && err.name
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      micPerm.value = 'denied'
    } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
      micPerm.value = 'notfound'
    } else {
      micPerm.value = 'idle'
    }
    micError.value = `麦克风开启失败：${(err && err.message) || '未知错误'}`
  }
}

function stopMic() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    try { mediaRecorder.stop() } catch { /* 已停止则忽略 */ }
  }
  if (recTimer) {
    clearInterval(recTimer)
    recTimer = null
  }
  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop())
    micStream = null
  }
  analyser = null
  floatData = null
  if (audioContext) {
    try { audioContext.close() } catch { /* 已关闭则忽略 */ }
    audioContext = null
  }
  micOn.value = false
  micDbfs.value = -100
  recState.value = 'idle'
  recCountdown.value = 0
}

function resizeMicCanvas() {
  const canvas = micCanvasRef.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  micW = canvas.clientWidth || 600
  micH = canvas.clientHeight || 120
  canvas.width = Math.max(1, Math.round(micW * dpr))
  canvas.height = Math.max(1, Math.round(micH * dpr))
  micCtx = canvas.getContext('2d')
  if (micCtx) micCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function startRecording() {
  if (!micOn.value || !micStream) return
  if (typeof window.MediaRecorder === 'undefined') {
    micError.value = '当前浏览器不支持 MediaRecorder 录音，可通过电平条与波形观察采集状态'
    return
  }
  const mime = pickRecorderMime((m) => MediaRecorder.isTypeSupported(m))
  try {
    mediaRecorder = mime ? new MediaRecorder(micStream, { mimeType: mime }) : new MediaRecorder(micStream)
  } catch (err) {
    micError.value = `录音初始化失败：${(err && err.message) || '未知错误'}`
    return
  }
  recChunks = []
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size) recChunks.push(e.data)
  }
  mediaRecorder.onstop = finishRecording
  mediaRecorder.start()
  recState.value = 'recording'
  recCountdown.value = 5
  recTimer = setInterval(() => {
    recCountdown.value -= 1
    if (recCountdown.value <= 0) {
      if (recTimer) {
        clearInterval(recTimer)
        recTimer = null
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
    }
  }, 1000)
}

function finishRecording() {
  const type = (mediaRecorder && mediaRecorder.mimeType) || 'audio/webm'
  const blob = new Blob(recChunks, { type })
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioUrl.value = URL.createObjectURL(blob)
  recState.value = 'done'
}

// ---------- rAF 主循环（帧率采样 + 波形绘制，onMounted 启动） ----------
function loop() {
  rafId = requestAnimationFrame(loop)
  const now = performance.now()

  // 摄像头：currentTime 发生变化才算一帧
  if (camOn.value) {
    const el = videoRef.value
    if (el && el.currentTime !== lastVideoTime) {
      lastVideoTime = el.currentTime
      fpsSamples.push(now)
      if (fpsSamples.length > 240) fpsSamples = fpsSamples.slice(-240)
    }
    if (now - lastCamUiTs >= 500) { // 实测帧率每 0.5s 刷新一次
      lastCamUiTs = now
      const fps = fpsFromSamples(fpsSamples, now)
      if (fps !== null) camFpsText.value = `${fps} fps`
    }
  }

  // 麦克风：每帧采 RMS 并重绘波形，电平数字/条按 10Hz 节流
  if (micOn.value && analyser && floatData) {
    analyser.getFloatTimeDomainData(floatData)
    let sum = 0
    for (let i = 0; i < floatData.length; i++) sum += floatData[i] * floatData[i]
    const rms = Math.sqrt(sum / floatData.length)
    drawWaveform(micCtx, floatData, micW, micH)
    if (now - lastMicUiTs >= 100) {
      lastMicUiTs = now
      micDbfs.value = rmsToDbfs(rms)
    }
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  // 仅环境检查，不触碰任何设备采集 API
  envNotice.value = envNoticeOf(
    window.location.protocol,
    window.location.hostname,
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  )
  rafId = requestAnimationFrame(loop)
  addRecentTool('camera-mic-test')
})

onBeforeUnmount(() => {
  // 1) 停掉 rAF 主循环
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  // 2) 停掉录音倒计时
  if (recTimer) {
    clearInterval(recTimer)
    recTimer = null
  }
  // 3) 停掉 MediaRecorder（断开回调避免卸载后再触发）
  if (mediaRecorder) {
    mediaRecorder.ondataavailable = null
    mediaRecorder.onstop = null
    if (mediaRecorder.state === 'recording') {
      try { mediaRecorder.stop() } catch { /* 已停止则忽略 */ }
    }
    mediaRecorder = null
  }
  // 4) 停掉摄像头流（track.stop()）
  stopCameraTracks()
  const el = videoRef.value
  if (el) el.srcObject = null
  // 5) 停掉麦克风流（track.stop()）
  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop())
    micStream = null
  }
  // 6) 关闭 AudioContext
  analyser = null
  floatData = null
  if (audioContext) {
    try { audioContext.close() } catch { /* 已关闭则忽略 */ }
    audioContext = null
  }
  // 7) 释放录音回放的 Object URL
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = ''
  }
  micCtx = null
})
</script>
