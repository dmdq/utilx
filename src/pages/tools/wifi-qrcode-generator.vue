<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Wifi class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Wi-Fi二维码生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">SSID + 密码生成扫码连网二维码，访客扫码即连，无需口头报密码</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入 Wi-Fi 名称与密码，按标准 WIFI: URI 规范本地拼接字符串并渲染二维码。手机相机扫码即可自动连接网络，适合贴在路由器旁、办公室工位、民宿与店铺前台。支持 WPA/WPA2、WEP 与无加密三种类型，并可标记隐藏网络。
      </p>
      <!-- 隐私提示 -->
      <div class="mt-4 bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-start gap-3">
        <ShieldCheck class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <p class="text-sm text-foreground leading-relaxed">
          <strong>SSID 与密码仅在本地拼接渲染，不会上传</strong>。二维码在浏览器内直接生成，字符串与密码不经过任何网络请求，生成后可断网使用。
        </p>
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 表单 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Info class="w-5 h-5 mr-2 text-primary" /> 网络信息
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">Wi-Fi 名称（SSID）</label>
          <input
            v-model="ssid"
            type="text"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="例如：Home-WiFi"
            @input="generate"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">密码</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :disabled="encryption === 'nopass'"
              class="w-full px-3 py-2.5 pr-11 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="无加密时可留空"
              @input="generate"
            />
            <button
              type="button"
              @click="toggleShowPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              :title="showPassword ? '隐藏密码' : '显示密码'"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">加密类型</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="opt in encryptionOptions"
              :key="opt.value"
              @click="setEncryption(opt.value)"
              :class="encryption === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ opt.label }}</button>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-foreground">隐藏网络</p>
            <p class="text-xs text-muted-foreground mt-0.5">路由器关闭了 SSID 广播时开启</p>
          </div>
          <button
            @click="toggleHidden"
            :class="hidden ? 'bg-primary' : 'bg-muted'"
            class="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
            aria-label="切换隐藏网络"
          >
            <span
              :class="hidden ? 'translate-x-5' : 'translate-x-0.5'"
              class="absolute left-0 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
            ></span>
          </button>
        </div>

        <!-- 编码串折叠显示 -->
        <div class="border border-border rounded-lg">
          <button
            @click="showUri = !showUri"
            class="w-full flex items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>查看编码串（WIFI: URI）</span>
            <ChevronUp v-if="showUri" class="w-4 h-4" />
            <ChevronDown v-else class="w-4 h-4" />
          </button>
          <div v-show="showUri" class="px-4 pb-3">
            <code class="block bg-muted rounded p-3 text-xs text-foreground break-all select-all">{{ wifiUri }}</code>
            <p class="text-xs text-muted-foreground mt-2">按 WiFi 联盟规范：反斜杠、分号、逗号、冒号、双引号五类字符会自动加反斜杠转义。</p>
          </div>
        </div>
      </div>

      <!-- 二维码输出 -->
      <div class="bg-card border border-border rounded-lg p-6 flex flex-col items-center">
        <h2 class="text-lg font-semibold flex items-center self-start mb-4">
          <QrCode class="w-5 h-5 mr-2 text-primary" /> 扫码即连
        </h2>

        <div v-if="qrDataUrl" class="w-full">
          <img :src="qrDataUrl" alt="Wi-Fi 连接二维码" class="w-full max-w-xs mx-auto rounded-lg border border-border" />
          <button
            @click="downloadQr"
            class="mt-4 w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Download class="w-4 h-4" /> 下载 PNG
          </button>
          <div class="mt-4 bg-muted/60 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
            <p class="flex items-start gap-2">
              <Printer class="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
              <span>建议截图或打印后贴在路由器旁、前台或工位，访客扫码即可连网，无需口头报密码。</span>
            </p>
          </div>
        </div>

        <div v-else-if="errorMsg" class="py-12 text-center text-red-500 text-sm">{{ errorMsg }}</div>

        <div v-else class="py-12 text-center text-muted-foreground">
          <QrCode class="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p class="text-sm">输入 Wi-Fi 名称后二维码会自动生成</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 Wi-Fi 二维码</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Wi-Fi 二维码是把网络名称与密码按 WIFI: URI 规范编码成的二维码，iPhone、安卓与主流相机扫一扫即可弹出连接确认，免去手动输入长密码的麻烦，也避免口头报密码带来的泄露风险。
          </p>
          <h3 class="text-lg font-semibold text-foreground">什么是 Wi-Fi 二维码</h3>
          <p>
            它本质上是一段形如 WIFI:T:WPA;S:名称;P:密码;; 的文本。iOS、Android 等系统相机识别到 WIFI: 前缀后，会自动解析加密类型、SSID 与密码并引导连接；隐藏网络通过 H:true 标记，无加密网络则省略密码字段。
          </p>
          <h3 class="text-lg font-semibold text-foreground">密码安全吗</h3>
          <p>
            本工具的拼接与二维码渲染全部在浏览器本地完成，SSID 与密码不会上传到任何服务器，也不会写入本地存储；生成后断开网络仍可继续使用，敏感网络建议生成后及时关闭页面。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">手机扫不出来怎么办？</span>先确认 SSID 拼写与大小写和路由器一致；5GHz 与 2.4GHz 同名网络通常可混扫。老款机型对 WPA3 支持有限，可先把路由器加密方式调为 WPA2 再生成。</li>
            <li><span class="text-foreground font-medium">改了 Wi-Fi 密码要重新生成吗？</span>要。二维码里编码的是生成那一刻的密码，路由器修改密码后旧二维码会连接失败，重新输入并生成一张即可。</li>
            <li><span class="text-foreground font-medium">名称或密码里有特殊字符可以吗？</span>可以。反斜杠、分号、逗号、冒号、双引号这五个字符会按规范自动加反斜杠转义，普通中文名称也可直接使用。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'wifi-qrcode-generator'" :category="'network'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Wifi, ShieldCheck, Info, Eye, EyeOff, Download,
  ChevronUp, ChevronDown, QrCode, Printer
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Wi-Fi二维码生成器 - 扫码连网',
  description: '在线 Wi-Fi 二维码生成器，SSID 与密码本地拼接渲染扫码连网二维码，支持 WPA/WPA2、WEP、无加密与隐藏网络，密码不上传，适合贴在路由器旁供访客扫码',
  keywords: 'wifi二维码生成, 扫码连wifi, 访客wifi码, 无线二维码, wifi分享码, 路由器二维码',
  author: 'Util工具箱',
  ogTitle: 'Wi-Fi二维码生成器 - 有条工具',
  ogDescription: 'SSID+密码本地生成扫码连网二维码，密码不出浏览器',
  ogUrl: 'https://www.util.cn/tools/wifi-qrcode-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'Wi-Fi二维码生成器',
          url: 'https://www.util.cn/tools/wifi-qrcode-generator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['WIFI: URI 标准编码', 'WPA/WPA2 与 WEP 支持', '无加密网络', '隐藏网络标记', '特殊字符自动转义', '本地生成不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '网络工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: 'Wi-Fi二维码生成器', item: 'https://www.util.cn/tools/wifi-qrcode-generator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '手机扫不出来怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '确认 SSID 拼写与大小写一致，老机型可把路由器加密方式调为 WPA2 后重新生成。' }
            },
            {
              '@type': 'Question',
              name: '改了 Wi-Fi 密码要重新生成吗？',
              acceptedAnswer: { '@type': 'Answer', text: '要。二维码编码的是生成那一刻的密码，路由器修改密码后需重新生成。' }
            },
            {
              '@type': 'Question',
              name: '名称或密码里有特殊字符可以吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以。反斜杠、分号、逗号、冒号、双引号五类字符会按规范自动加反斜杠转义。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'wifi-qrcode-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 纯函数：特殊字符转义与 WIFI: URI 拼装 ----------
function escapeWifiValue(v) {
  return v.replace(/([\\;,:"])/g, '\\$1')
}

function buildWifiUri(opts) {
  const ssid = escapeWifiValue(opts.ssid || '')
  const t = opts.encryption === 'nopass' ? 'nopass' : (opts.encryption || 'WPA')
  let uri = 'WIFI:T:' + t + ';S:' + ssid + ';'
  if (opts.encryption !== 'nopass') {
    uri += 'P:' + escapeWifiValue(opts.password || '') + ';'
  }
  if (opts.hidden) uri += 'H:true;'
  uri += ';'
  return uri
}

// ---------- 状态 ----------
const encryptionOptions = [
  { value: 'WPA', label: 'WPA / WPA2' },
  { value: 'WEP', label: 'WEP' },
  { value: 'nopass', label: '无加密' }
]
const ssid = ref('')
const password = ref('')
const showPassword = ref(false)
const encryption = ref('WPA')
const hidden = ref(false)
const qrDataUrl = ref('')
const errorMsg = ref('')
const showUri = ref(false)
const seoContentVisible = ref(true)

// 纯字符串计算，可在 computed 中安全使用
const wifiUri = computed(() => buildWifiUri({
  ssid: ssid.value,
  password: password.value,
  encryption: encryption.value,
  hidden: hidden.value
}))

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 用户交互回调 ----------
const toggleShowPassword = () => { showPassword.value = !showPassword.value }

const setEncryption = (v) => {
  encryption.value = v
  if (v === 'nopass') password.value = ''
  generate()
}

const toggleHidden = () => {
  hidden.value = !hidden.value
  generate()
}

// 生成二维码（动态加载站内已安装的 qrcode 包，toDataURL 渲染）
const generate = async () => {
  if (!ssid.value.trim()) {
    qrDataUrl.value = ''
    errorMsg.value = ''
    return
  }
  try {
    errorMsg.value = ''
    const QRCode = await import('qrcode')
    qrDataUrl.value = await QRCode.toDataURL(wifiUri.value, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#FFFFFF' }
    })
  } catch (e) {
    qrDataUrl.value = ''
    errorMsg.value = '二维码生成失败，请检查输入内容后重试'
  }
}

const downloadQr = () => {
  if (!qrDataUrl.value) return
  const a = document.createElement('a')
  a.href = qrDataUrl.value
  a.download = 'wifi-qrcode.png'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>
