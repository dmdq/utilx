<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->
    
    <!-- 增强型头部 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">在线编码解码工具箱</h1>
      <p class="text-muted-foreground max-w-3xl">支持Base64、URL编码、HTML实体编码等多种编码解码操作，保障数据传输安全性和完整性。</p>
    </div>
    
    <!-- 工具网格 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
      <ToolCard
        v-for="tool in categoryTools"
        :key="tool.id"
        :tool="tool"
        :title="tool.name"
        :description="tool.description"
        :category="tool.category"
        :usage-count="formatViewCount(tool.viewCount)"
        :icon="tool.icon"
        @select="handleToolSelect"
      />
    </div>
    
    <!-- SEO知识库区域 -->
    <div class="mt-8">
      <!-- 编码格式速查手册 -->
      <h2 class="text-2xl font-bold mb-6">编码格式速查手册</h2>
      
      <div class="space-y-8">
        <!-- Base64 原理与应用 -->
        <div>
          <h3 class="text-xl font-semibold mb-3 flex items-center">
            <span class="font-mono text-primary mr-2">#</span>
            Base64 原理与应用
          </h3>
          <p class="text-muted-foreground mb-3">
            Base64 是一种基于64个可打印字符来表示二进制数据的表示方法。它常用于在通常处理文本数据的场合传输二进制数据，
            如图片、音频、视频等多媒体文件在网络上的传输。
          </p>
          <div class="rounded-lg p-4">
            <h4 class="font-semibold text-primary mb-2">应用场景：</h4>
            <ul class="space-y-1 text-sm">
              <li class="flex items-start">
                <span class="font-mono text-primary mr-2">•</span>
                <span>电子邮件附件传输（MIME）</span>
              </li>
              <li class="flex items-start">
                <span class="font-mono text-primary mr-2">•</span>
                <span>在URL、Cookie或表单数据中嵌入二进制数据</span>
              </li>
              <li class="flex items-start">
                <span class="font-mono text-primary mr-2">•</span>
                <span>CSS中嵌入小图片以减少HTTP请求</span>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- URL 编码规则 -->
        <div>
          <h3 class="text-xl font-semibold mb-3 flex items-center">
            <span class="font-mono text-primary mr-2">#</span>
            URL 编码规则
          </h3>
          <p class="text-muted-foreground mb-3">
            URL 编码（也称为百分号编码）是特定上下文的统一资源定位符（URL）的编码机制。它主要用于统一资源标识符（URI）中，
            通过将特殊字符转换为"%XX"的形式（其中XX是字符的ASCII码的十六进制表示）来确保URL的正确传输。
          </p>
          <div class="rounded-lg p-4">
            <h4 class="font-semibold text-primary mb-2">需要编码的字符：</h4>
            <ul class="space-y-1 text-sm">
              <li class="flex items-start">
                <span class="font-mono text-primary mr-2">•</span>
                <span>保留字符：<span class="font-mono bg-muted px-1 rounded">! * ' ( ) ; : @ & = + $ , / ? # [ ]</span></span>
              </li>
              <li class="flex items-start">
                <span class="font-mono text-primary mr-2">•</span>
                <span>非ASCII字符：如中文、日文等Unicode字符</span>
              </li>
              <li class="flex items-start">
                <span class="font-mono text-primary mr-2">•</span>
                <span>不安全字符：空格、%、&lt;、&gt;、#、%、{、}、|、\、^、~、[、]、`</span>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- JWT 结构 -->
        <div>
          <h3 class="text-xl font-semibold mb-3 flex items-center">
            <span class="font-mono text-primary mr-2">#</span>
            JWT (JSON Web Token) 结构
          </h3>
          <p class="text-muted-foreground mb-3">
            JWT是一种开放标准（RFC 7519），用于在各方之间安全地传输信息。JWT由三部分组成，用点（.）分隔，通常看起来像这样：
            <span class="font-mono bg-muted px-1 rounded break-all">xxxxx.yyyyy.zzzzz</span>
          </p>
          <div class="rounded-lg p-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 class="font-semibold text-primary mb-2">Header（头部）</h4>
                <p class="text-sm">
                  包含令牌的类型（即JWT）和所用的签名算法，如HMAC SHA256或RSA。
                </p>
              </div>
              <div>
                <h4 class="font-semibold text-primary mb-2">Payload（负载）</h4>
                <p class="text-sm">
                  包含声明（claims），即要传输的数据。声明有三种类型：注册声明、公共声明和私有声明。
                </p>
              </div>
              <div>
                <h4 class="font-semibold text-primary mb-2">Signature（签名）</h4>
                <p class="text-sm">
                  用于验证令牌在传输过程中没有被更改，并确认发送方的身份。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 常见问题 FAQ -->
      <h2 class="text-2xl font-bold mt-12 mb-6">常见问题 (FAQ)</h2>
      
      <div class="space-y-6">
        <div class="border-l-2 border-primary pl-4 py-1">
          <h3 class="text-lg font-semibold mb-2">Q: 在线解码安全吗？</h3>
          <p class="text-muted-foreground">
            A: <span class="font-semibold">绝对安全</span>。Util.cn 采用 WebAssembly 和 JS 本地计算技术，所有编码解码操作都在您的浏览器本地完成，
            您的数据永远不会上传到服务器。我们致力于为开发者提供安全可靠的工具。
          </p>
        </div>
        
        <div class="border-l-2 border-primary pl-4 py-1">
          <h3 class="text-lg font-semibold mb-2">Q: 为什么 Base64 编码后体积会变大？</h3>
          <p class="text-muted-foreground">
            A: Base64 编码使用 64 个字符（A-Z, a-z, 0-9, +, /）来表示二进制数据。由于每 3 个字节的二进制数据会被编码为 4 个 Base64 字符，
            因此编码后的数据体积大约会增加 <span class="font-mono font-semibold">33%</span>。这是正常的数学现象，不是程序问题。
          </p>
        </div>
        
        <div class="border-l-2 border-primary pl-4 py-1">
          <h3 class="text-lg font-semibold mb-2">Q: URL 编码和 HTML 实体编码有什么区别？</h3>
          <p class="text-muted-foreground">
            A: URL 编码主要用于 URL 中特殊字符的转义，格式为 <span class="font-mono bg-muted px-1 rounded">%XX</span>；
            HTML 实体编码用于在 HTML 文档中表示特殊字符，如 <span class="font-mono bg-muted px-1 rounded">&amp;lt;</span> 表示 &lt;，
            <span class="font-mono bg-muted px-1 rounded">&amp;amp;</span> 表示 &amp;。两者用途和编码方式都不同。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import Breadcrumb from '~/components/Breadcrumb.vue'
import ToolCard from '~/components/ToolCard.vue'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

// 使用SEO composable设置页面标题
const { setPageTitle } = useSEO()
setPageTitle('在线编码解码工具箱')


const category = categories.find(c => c.id === 'encode')

// 当前分类的工具
const categoryTools = computed(() => {
  return tools.filter(tool => tool.category === category.id)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
})

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w+`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k+`
  }
  return `${count}`
}

const handleToolSelect = (tool) => {
  // 获取工具URL
  const toolUrl = `/tools/${tool.id}/`
  // 跳转到具体工具页面
  navigateTo(toolUrl)
  // 添加到最近使用
  addRecentTool(tool.id)
}
</script>