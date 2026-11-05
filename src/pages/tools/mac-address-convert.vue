<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">MAC 地址转换工具</h1>
      <p class="text-muted-foreground">MAC 地址格式转换与编码，支持多种格式</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入 MAC 地址</h2>
          <div class="flex gap-2">
            <button @click="clearInput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
            <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
          </div>
        </div>

        <textarea v-model="inputText" placeholder="请输入 MAC 地址..." class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">转换结果</h2>
          <span v-if="copyStatus !== 'idle'" class="text-xs" :class="copyStatus === 'ok' ? 'text-green-600' : 'text-red-500'">
            {{ copyStatus === 'ok' ? '已复制到剪贴板' : '复制失败，请手动选择复制' }}
          </span>
        </div>
        <div v-if="results.colon" class="p-3 bg-muted rounded-lg">
          <div class="flex items-center justify-between gap-2 mb-1">
            <p class="text-xs text-muted-foreground">冒号分隔 (XX:XX:XX:XX:XX:XX) · IEEE 802 写法，Linux/macOS 常见</p>
            <button @click="copyResult(results.colon)" class="px-2 py-1 border border-border text-xs text-muted-foreground hover:text-foreground transition flex-shrink-0">复制</button>
          </div>
          <code class="text-sm font-mono break-all">{{ results.colon }}</code>
        </div>
        <div v-if="results.dash" class="p-3 bg-muted rounded-lg">
          <div class="flex items-center justify-between gap-2 mb-1">
            <p class="text-xs text-muted-foreground">连字符分隔 (XX-XX-XX-XX-XX-XX) · Windows 网卡属性、蓝牙常见</p>
            <button @click="copyResult(results.dash)" class="px-2 py-1 border border-border text-xs text-muted-foreground hover:text-foreground transition flex-shrink-0">复制</button>
          </div>
          <code class="text-sm font-mono break-all">{{ results.dash }}</code>
        </div>
        <div v-if="results.dot" class="p-3 bg-muted rounded-lg">
          <div class="flex items-center justify-between gap-2 mb-1">
            <p class="text-xs text-muted-foreground">点分隔 (XXXX.XXXX.XXXX) · 思科设备 show 命令常见</p>
            <button @click="copyResult(results.dot)" class="px-2 py-1 border border-border text-xs text-muted-foreground hover:text-foreground transition flex-shrink-0">复制</button>
          </div>
          <code class="text-sm font-mono break-all">{{ results.dot }}</code>
        </div>
        <div v-if="results.hex" class="p-3 bg-muted rounded-lg">
          <div class="flex items-center justify-between gap-2 mb-1">
            <p class="text-xs text-muted-foreground">连续十六进制 (XXXXXXXXXXXX) · 无分隔，注册表与部分日志常见</p>
            <button @click="copyResult(results.hex)" class="px-2 py-1 border border-border text-xs text-muted-foreground hover:text-foreground transition flex-shrink-0">复制</button>
          </div>
          <code class="text-sm font-mono break-all">{{ results.hex }}</code>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative mt-12">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>MAC 地址格式转换是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          同一个 MAC（媒体访问控制）地址在不同设备、系统和配置界面上有多种书写习惯：交换机命令行用点分、Windows 用连字符、Linux 用冒号。
          排查网络问题时经常要把一种写法转成另一种——比如把手机「关于本机」里冒号分隔的地址，对到思科交换机 MAC 地址表里点分的三段写法。
          本工具自动剥离大小写、空格、冒号、横杠与点等分隔符，提取出 12 位十六进制后实时生成四种格式，输入任意一种写法即可。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>MAC 地址的三种书写规范</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          最常见的是 IEEE 802 规定的冒号分隔写法（如 00:1A:2B:3C:4D:5E），Linux 的 ip link、macOS 的系统报告、Wireshark 抓包都采用它；
          连字符写法（00-1A-2B-3C-4D-5E）出现在 Windows 的 ipconfig /all、网卡属性面板和不少蓝牙设备标签上；
          点分写法（001A.2B3C.4D5E）是思科 IOS 的习惯，三个四位的「点分组」在 show mac address-table、show arp 输出里最常见。
          三种写法指向同一个 48 位地址，只是分隔符不同，转换本身不会改变地址内容。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>EUI-48 与 EUI-64 有什么区别？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          传统网卡 MAC 是 48 位，即 EUI-48：前 3 字节是厂商标识 OUI（组织唯一标识符，由 IEEE 分配），后 3 字节是厂商自配的序列号，
          所以查 MAC 前缀能定位到「这块网卡是谁造的」。IPv6 无状态自动配置把 48 位扩展成 64 位接口标识（EUI-64）：
          在 OUI 和序列号中间插入 FFFE，并把 U/L 位取反，得到形如 xx:xx:xx:FF:FE:xx:xx 的 64 位标识。
          判断一个 IPv6 接口标识是否由 MAC 推导而来，就看中间有没有 FF:FE。本工具处理的是 48 位地址的写法互换。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>为什么手机开了「私有无线局域网地址」后 MAC 会变？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          iOS、Android 和 Windows 新版本默认开启 MAC 随机化：连接每个 Wi-Fi 时不再使用网卡真实 MAC，而是生成一个随机地址，
          以免商场、机场等场所用 MAC 跨网络追踪设备轨迹。这带来两个常见困惑：一是做 MAC 绑定、家长控制或门禁白名单时，
          要到系统的 Wi-Fi 详情里找「私有地址」而非真实硬件地址；二是关闭再重开随机化，或重置网络设置后地址会重新生成，
          原来的白名单条目就失效了。在路由器上看到的地址变了，不一定是网卡坏了，先检查随机化设置。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>MAC 地址的作用边界：局域网内有效</h2>
        <p class="text-sm text-muted-foreground leading-relaxed">
          MAC 是二层地址，只在同一个局域网（同一广播域）内用于设备寻址：交换机靠 MAC 地址表把帧转发到对应端口，
          同网段设备靠 ARP 把 IP 解析成 MAC 再封装数据帧。数据包一旦经过路由器跨网段，源 MAC 就会被替换为路由器接口的 MAC，
          对端服务器根本看不到你的真实 MAC——所以 MAC 无法像 IP 一样在公网上定位设备，也有人据此把 MAC 当作「本地身份证」。
          这也是为什么跨网段排查只能靠 IP 与路由表，MAC 地址表查询仅在本交换机、本 VLAN 范围内有意义。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">MAC 地址能改吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">可以。Linux 的 ip link set dev eth0 address、macOS 的 SpoofMAC 类工具、Windows 部分网卡驱动的「本地管理地址」选项都能临时覆盖 MAC；系统和部分 App 也提供「随机地址」开关。改动只影响本机对外呈现的地址，网卡出厂写入的硬件地址并没有被擦除，重启或恢复设置后通常会回到原地址。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">两台设备的 MAC 地址会重复吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">理论上不会。OUI 下的序列号由厂商保证唯一，全球 48 位空间足以覆盖所有设备；但历史上确实出现过厂商复用地址段的回收事故，另外手动改 MAC、虚拟机和容器克隆网卡也可能造出局域网内重复。同一广播域里出现两个相同 MAC 时，交换机 MAC 地址表会在端口间反复漂移，表现为时通时断，可在交换机上查 MAC 漂移日志确认。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">怎么查自己手机的 MAC 地址？</h3>
            <p class="text-sm text-muted-foreground mt-1">iPhone：设置 → 通用 → 关于本机 →「无线局域网地址」；连接 Wi-Fi 后在当前网络详情里还能看到「私有无线局域网地址」（随机化后的实际使用地址）。Android：设置 → 关于手机 → 状态信息，或 WLAN 高级设置里查看；同样注意区分「设备 MAC」与按网络随机化的地址。Windows 用 ipconfig /all 看「物理地址」，它使用连字符写法，可直接粘贴到本工具统一转换。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'mac-address-convert'" :category="'encode'" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import RelatedTools from '~/components/RelatedTools.vue'
import { useSEO } from '~/composables/useSEO'
import { trackEvent } from '~/utils/track'
const { setPageTitle } = useSEO()
setPageTitle('MAC地址转换工具')

const inputText = ref('')
const results = ref({ colon: '', dash: '', dot: '', hex: '' })
const copyStatus = ref('idle')
const seoContentVisible = ref(true)

const examples = [
  '00:1A:2B:3C:4D:5E',
  '00-1A-2B-3C-4D-5E',
  '001A.2B3C.4D5E',
  '001A2B3C4D5E'
]
const currentExample = ref(0)

const parseMAC = (mac) => {
  const clean = mac.replace(/[^0-9A-Fa-f]/g, '')
  if (clean.length !== 12) return null

  const parts = clean.match(/.{2}/g)
  if (!parts) return null

  return {
    colon: parts.join(':').toUpperCase(),
    dash: parts.join('-').toUpperCase(),
    dot: [parts.slice(0, 2).join(''), parts.slice(2, 4).join(''), parts.slice(4, 6).join('')].join('.').toUpperCase(),
    hex: clean.toUpperCase()
  }
}

watch(inputText, (newText) => {
  if (newText) {
    const parsed = parseMAC(newText.trim())
    if (parsed) {
      results.value = parsed
    } else {
      results.value = { colon: '', dash: '', dot: '', hex: '' }
    }
  } else {
    results.value = { colon: '', dash: '', dot: '', hex: '' }
  }
})

const clearInput = () => { inputText.value = ''; results.value = { colon: '', dash: '', dot: '', hex: '' } }
const loadExample = () => { inputText.value = examples[currentExample.value]; currentExample.value = (currentExample.value + 1) % examples.length }

// ---------- 复制（浏览器 API 仅在回调内，SSR 安全） ----------
let copyTimer = null
function flashCopy(status) {
  copyStatus.value = status
  if (copyTimer !== null) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copyStatus.value = 'idle'
    copyTimer = null
  }, 1600)
}

async function copyResult(text) {
  try {
    await navigator.clipboard.writeText(text)
    flashCopy('ok')
    trackEvent('工具结果', '复制', 'mac-address-convert')
  } catch (err) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      flashCopy(ok ? 'ok' : 'fail')
      if (ok) trackEvent('工具结果', '复制', 'mac-address-convert')
    } catch (err2) {
      flashCopy('fail')
    }
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- SEO ----------
useSeoMeta({
  title: 'MAC地址格式转换 - 在线MAC地址冒号/横杠/点分互转工具',
  description: '免费在线 MAC 地址格式转换工具，输入任意写法实时转出冒号分隔（IEEE 802）、连字符、思科点分与连续十六进制四种格式，自动识别大小写与分隔符，支持一键复制，附 EUI-48/EUI-64、MAC 随机化与局域网作用边界说明，纯浏览器本地运行不上传',
  keywords: 'MAC地址转换,MAC地址格式转换,MAC地址在线转换,MAC地址点分,思科MAC地址格式,MAC地址冒号分隔,EUI-48,EUI-64,物理地址转换,MAC地址查询',
  author: '有条工具',
  ogTitle: 'MAC地址格式转换 - 在线MAC地址冒号/横杠/点分互转工具 | 有条工具',
  ogDescription: '冒号、横杠、思科点分、连续十六进制四种 MAC 写法实时互转，一键复制。',
  ogUrl: 'https://www.util.cn/tools/mac-address-convert',
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
          name: 'MAC地址格式转换工具',
          url: 'https://www.util.cn/tools/mac-address-convert',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '冒号分隔（IEEE 802）格式输出',
            '连字符分隔（Windows 常见）格式输出',
            '思科点分（XXXX.XXXX.XXXX）格式输出',
            '连续十六进制格式输出',
            '自动剥离分隔符与大小写',
            '四种结果一键复制，本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '编码解码', item: 'https://www.util.cn/encode/' },
            { '@type': 'ListItem', position: 3, name: 'MAC地址转换', item: 'https://www.util.cn/tools/mac-address-convert/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'MAC 地址能改吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以。Linux 的 ip link set dev eth0 address、macOS 与 Windows 的驱动或工具都能临时覆盖 MAC，系统和部分 App 的「随机地址」开关也会替换对外呈现的地址；网卡出厂写入的硬件地址不会被擦除，重启或恢复设置后通常会回到原地址。' }
            },
            {
              '@type': 'Question',
              name: '两台设备的 MAC 地址会重复吗？',
              acceptedAnswer: { '@type': 'Answer', text: '理论上不会：OUI 下的序列号由厂商保证唯一，全球 48 位空间足够覆盖所有设备；但手动改 MAC、虚拟机克隆网卡或厂商复用地址段可能造成局域网内重复，表现为交换机 MAC 地址表端口反复漂移、网络时通时断。' }
            },
            {
              '@type': 'Question',
              name: '怎么查自己手机的 MAC 地址？',
              acceptedAnswer: { '@type': 'Answer', text: 'iPhone 在「设置 → 通用 → 关于本机 → 无线局域网地址」查看，当前网络详情里还有随机化后的「私有无线局域网地址」；Android 在「设置 → 关于手机 → 状态信息」或 WLAN 高级设置查看；Windows 用 ipconfig /all 看「物理地址」，注意区分真实硬件地址与随机化地址。' }
            }
          ]
        }
      ]
    })
  }]
})
</script>
