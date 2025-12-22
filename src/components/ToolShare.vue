<template>
  <div class="flex items-center gap-2">
    <button
      @click="shareTool"
      class="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
      title="分享工具"
    >
      <Icon name="Share2" class="w-4 h-4" />
    </button>

    <button
      @click="copyLink"
      class="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
      title="复制链接"
    >
      <Icon name="Link" class="w-4 h-4" />
    </button>

    <button
      @click="generateQRCode"
      class="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
      title="二维码"
    >
      <Icon name="QrCode" class="w-4 h-4" />
    </button>
  </div>

  <!-- 分享对话框 -->
  <div v-if="showShareDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-card rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-semibold mb-4">分享工具</h3>

      <div class="space-y-4">
        <!-- 社交媒体分享 -->
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="platform in socialPlatforms"
            :key="platform.name"
            @click="shareToSocial(platform)"
            class="p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
          >
            <Icon :name="platform.icon" class="w-5 h-5 mx-auto mb-1" />
            <div class="text-xs">{{ platform.name }}</div>
          </button>
        </div>

        <!-- 复制链接 -->
        <div class="p-3 bg-muted rounded-lg">
          <div class="flex items-center gap-2">
            <input
              ref="shareUrlInput"
              :value="shareUrl"
              readonly
              class="flex-1 bg-transparent text-sm"
            />
            <button
              @click="copyLink"
              class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
            >
              复制
            </button>
          </div>
        </div>

        <!-- 二维码 -->
        <div v-if="qrCodeUrl" class="flex justify-center p-4 bg-muted rounded-lg">
          <img :src="qrCodeUrl" alt="QR Code" class="w-32 h-32" />
        </div>
      </div>

      <button
        @click="closeShareDialog"
        class="mt-4 w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
      >
        关闭
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Share2, Link, QrCode, Twitter, Facebook, MessageCircle } from 'lucide-vue-next'

const props = defineProps({
  toolUrl: {
    type: String,
    required: true
  },
  toolName: {
    type: String,
    required: true
  },
  toolDescription: {
    type: String,
    default: ''
  }
})

const showShareDialog = ref(false)
const qrCodeUrl = ref('')
const shareUrlInput = ref(null)

const shareUrl = computed(() => {
  if (process.client) {
    return window.location.origin + props.toolUrl
  }
  return props.toolUrl
})

const socialPlatforms = [
  {
    name: 'Twitter',
    icon: 'Twitter',
    url: 'https://twitter.com/intent/tweet'
  },
  {
    name: 'Facebook',
    icon: 'Facebook',
    url: 'https://www.facebook.com/sharer/sharer.php'
  },
  {
    name: '微信',
    icon: 'MessageCircle',
    url: '#'
  }
]

const shareTool = () => {
  if (navigator.share) {
    navigator.share({
      title: props.toolName,
      text: props.toolDescription,
      url: shareUrl.value
    })
  } else {
    showShareDialog.value = true
  }
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    // 这里可以添加成功提示
    console.log('链接已复制')
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const shareToSocial = (platform) => {
  const params = new URLSearchParams({
    url: shareUrl.value,
    text: `${props.toolName} - ${props.toolDescription}`
  })

  window.open(`${platform.url}?${params}`, '_blank')
}

const generateQRCode = () => {
  // 使用免费的二维码API
  qrCodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl.value)}`
}

const closeShareDialog = () => {
  showShareDialog.value = false
  qrCodeUrl.value = ''
}
</script>