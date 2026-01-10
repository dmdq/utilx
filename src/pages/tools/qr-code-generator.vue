<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">二维码生成器 - 在线QR码创建工具</h1>
      <p class="text-muted-foreground">一款免费的在线 QR Code Generator。快速生成自定义样式的二维码，支持URL、文本、颜色和尺寸定制。帮助您创建专业的二维码用于营销、分享和标识。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">设置</label>
        </div>
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">内容</label>
            <textarea v-model="content" rows="3" class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="输入URL或文本..."></textarea>
            <p class="text-xs text-muted-foreground mt-1">支持网址、文本、联系方式等多种内容</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">前景色</label>
              <div class="flex items-center gap-2">
                <input v-model="foregroundColor" type="color" class="w-12 h-10 rounded cursor-pointer border border-border">
                <input v-model="foregroundColor" type="text" class="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm" placeholder="#000000">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">背景色</label>
              <div class="flex items-center gap-2">
                <input v-model="backgroundColor" type="color" class="w-12 h-10 rounded cursor-pointer border border-border">
                <input v-model="backgroundColor" type="text" class="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm" placeholder="#FFFFFF">
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">尺寸: {{ size }}x{{ size }}px</label>
            <input v-model.number="size" type="range" min="128" max="512" step="32" class="w-full">
            <div class="flex justify-between text-xs text-muted-foreground mt-1">
              <span>128px</span>
              <span>512px</span>
            </div>
          </div>

          <div class="flex gap-2">
            <button @click="loadPreset('url')" class="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded text-foreground transition-colors text-sm">
              URL示例
            </button>
            <button @click="loadPreset('text')" class="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded text-foreground transition-colors text-sm">
              文本示例
            </button>
            <button @click="loadPreset('wifi')" class="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded text-foreground transition-colors text-sm">
              WiFi示例
            </button>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">预览</label>
        </div>
        <div class="bg-card border border-border rounded-lg p-6 flex-1 flex flex-col">
          <div class="flex-1 flex items-center justify-center p-4 bg-muted rounded-lg mb-4">
            <img v-if="qrUrl" :src="qrUrl" class="max-w-full max-h-full border border-border rounded" alt="QR Code">
            <div v-else class="text-muted-foreground flex flex-col items-center gap-2">
              <QrCode class="w-16 h-16 opacity-50" />
              <span>输入内容生成二维码</span>
            </div>
          </div>
          <button @click="downloadQR" :disabled="!qrUrl" class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <Download class="w-4 h-4" />
            下载二维码
          </button>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是二维码？
        </h2>
        <p class="text-muted-foreground mb-4">
          二维码（QR Code）是一种矩阵式二维条码，由日本公司 DENSO Wave 于 1994 年发明。
          "QR"代表"Quick Response"（快速响应），因为它可以高速读取大量信息。
          二维码可以存储超过 4000 个字母数字字符，比传统一维条码的容量大得多。
        </p>
        <p class="text-muted-foreground">
          二维码具有容错能力，即使部分区域被损坏或遮挡，仍然可以正确解码。
          这种特性使其非常适合在户外、包装等可能受损的环境中使用。
          随着智能手机的普及，二维码已成为连接物理世界和数字世界的重要桥梁。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          二维码的应用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>营销推广</strong>：将二维码印在海报、传单、产品包装上，引导用户访问网站</li>
          <li><strong>移动支付</strong>：微信支付、支付宝等扫码支付已成为主流支付方式</li>
          <li><strong>电子票务</strong>：电影票、演唱会门票、航班登机牌等电子凭证</li>
          <li><strong>产品追溯</strong>：食品、药品等产品的生产批次、产地信息查询</li>
          <li><strong>WiFi分享</strong>：扫描二维码自动连接WiFi，无需输入密码</li>
          <li><strong>名片信息</strong>：包含联系信息的二维码，方便保存到手机通讯录</li>
          <li><strong>社交媒体</strong>：微信、QQ等社交账号的添加好友</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在输入框中输入您想要转换的内容（URL、文本等）</li>
          <li>选择前景色和背景色（建议使用高对比度配色）</li>
          <li>调整二维码尺寸以满足您的需求</li>
          <li>预览生成效果，满意后点击下载按钮</li>
          <li>将生成的二维码用于您的项目或分享</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          二维码设计最佳实践
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>保持高对比度</strong>：深色前景 + 浅色背景最利于扫描识别</li>
          <li><strong>尺寸适中</strong>：至少 2x2 厘米，确保扫描设备能清晰识别</li>
          <li><strong>留有边距</strong>：二维码周围留出空白区域，避免干扰</li>
          <li><strong>测试扫描</strong>：生成后务必用多款设备测试扫描效果</li>
          <li><strong>选择合适容错率</strong>：根据使用场景选择适当的容错级别</li>
          <li><strong>内容简短</strong>：内容越少，二维码越简单，识别率越高</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          特殊格式示例
        </h2>
        <div class="bg-muted rounded-lg p-4 mb-6 overflow-x-auto">
          <pre class="text-sm font-mono text-foreground"><code>// WiFi连接格式
WIFI:T:WPA;S:网络名称;P:密码;;

// 电子邮件格式
mailto:example@email.com?subject=主题&body=内容

// 电话号码格式
tel:+8613800138000

// 短信格式
smsto:13800138000:短信内容

// 名片格式 (vCard)
BEGIN:VCARD
VERSION:3.0
FN:张三
ORG:公司名称
TITLE:职位
TEL;TYPE=CELL:13800138000
EMAIL:example@email.com
END:VCARD</code></pre>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">二维码有有效期吗？</h3>
            <p class="text-muted-foreground mt-1">
              二维码本身没有有效期，只要图案清晰可识别就可以一直使用。
              但如果二维码指向的是一个URL链接，那么该链接所指向的网页可能会失效或变更。
              对于长期使用的二维码，建议使用短链接服务，以便随时更新目标地址。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">二维码存储的信息安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              二维码本身只是信息编码，不包含恶意代码。
              但扫描二维码时要注意安全：不要轻易扫描来源不明的二维码，
              特别是那些要求输入密码或个人信息的二维码。
              扫描前确认二维码的来源和可信度。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何在印刷品上确保二维码可识别？</h3>
            <p class="text-muted-foreground mt-1">
              1. 确保二维码尺寸至少 2x2 厘米；2. 使用高对比度颜色（黑/白最佳）；
              3. 保持印刷清晰，避免模糊或重影；4. 周围留有足够空白（至少4个模块的宽度）；
              5. 避免将二维码印在折痕、曲面或反光材料上；6. 印刷后务必测试扫描效果。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { HelpCircle, ChevronUp, QrCode, Download, Link, FileText, Wifi } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '二维码生成器 - 在线QR码创建工具 | Util工具箱',
  description: '免费在线二维码生成工具，快速生成自定义样式的二维码，支持URL、文本、颜色和尺寸定制。帮助您创建专业的二维码用于营销、分享和标识。',
  keywords: '二维码生成器,QR码,qrcode,二维码制作,在线二维码,QR Code,二维码生成,二维码设计',
  author: 'Util工具箱',
  ogTitle: '二维码生成器 - 免费在线QR码创建',
  ogDescription: '专业的二维码生成工具，支持URL、文本、颜色和尺寸定制。快速生成高质量二维码。',
  ogImage: 'https://www.util.cn/images/tools/qr-code-generator.png',
  ogUrl: 'https://www.util.cn/tools/qr-code-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '二维码生成器 - 免费在线QR码创建',
  twitterDescription: '专业的二维码生成工具，支持URL、文本、颜色和尺寸定制。',
  twitterImage: 'https://www.util.cn/images/tools/qr-code-generator.png'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: '二维码生成器',
            description: '免费在线二维码生成工具，支持多种内容格式和样式定制',
            url: 'https://www.util.cn/tools/qr-code-generator',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'URL二维码生成',
              '文本二维码生成',
              'WiFi二维码生成',
              '自定义颜色',
              '尺寸调整',
              '即时预览',
              '高清下载'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '二维码生成器',
                item: 'https://www.util.cn/tools/qr-code-generator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '二维码有有效期吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '二维码本身没有有效期，只要图案清晰可识别就可以一直使用。但如果二维码指向的是一个URL链接，那么该链接所指向的网页可能会失效或变更。'
                }
              },
              {
                '@type': 'Question',
                name: '二维码存储的信息安全吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '二维码本身只是信息编码，不包含恶意代码。但扫描二维码时要注意安全：不要轻易扫描来源不明的二维码，特别是那些要求输入密码或个人信息的二维码。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const content = ref('https://example.com')
const foregroundColor = ref('#000000')
const backgroundColor = ref('#FFFFFF')
const size = ref(256)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  QrCode, Download, Link, FileText, Wifi
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'qr-code-generator'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'barcode-generator'),
    tools.find(t => t.id === 'url-shortener'),
    tools.find(t => t.id === 'image-compressor'),
    tools.find(t => t.id === 'color-picker')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

const qrUrl = computed(() => {
  if (!content.value) return ''

  // 使用公共二维码API生成
  const apiUrl = 'https://api.qrserver.com/v1/create-qr-code/'
  const params = new URLSearchParams({
    size: `${size.value}x${size.value}`,
    data: content.value,
    color: foregroundColor.value.slice(1),
    bgcolor: backgroundColor.value.slice(1),
    format: 'png',
    qzone: 1
  })
  return `${apiUrl}?${params.toString()}`
})

function loadPreset(type) {
  switch (type) {
    case 'url':
      content.value = 'https://example.com'
      break
    case 'text':
      content.value = '这是一段示例文本内容'
      break
    case 'wifi':
      content.value = 'WIFI:T:WPA;S:MyNetwork;P:MyPassword;;'
      break
  }
}

async function downloadQR() {
  if (!qrUrl.value) return

  try {
    const response = await fetch(qrUrl.value)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qrcode.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    // 如果下载失败，尝试在新窗口打开
    window.open(qrUrl.value, '_blank')
  }
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
