<template>
  <div class="max-w-8xl mx-auto py-8">
    <div class="prose prose-gray dark:prose-invert max-w-none">
      <MarkdownRenderer :content="pageContent" />
    </div>
  </div>
</template>

<script setup>
import MarkdownRenderer from '~/components/MarkdownRenderer.vue'
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'default',
  title: '常见问题'
})

import { useSEO } from '~/composables/useSEO'

// 使用SEO composable设置页面标题
const { setPageTitle } = useSEO()
setPageTitle('常见问题')


// SEO配置
useSeoMeta({
  // title: '常见问题',
  description: 'Util.cn 工具使用常见问题解答，包括工具使用、隐私安全、性能限制、技术问题等，帮助您更好地使用我们的在线工具。',
  keywords: ['FAQ', '常见问题', '帮助', '使用指南', '问题解答']
})

// 直接导入Markdown文件内容
import faqContent from '~/content/faq.md?raw'

const pageContent = ref(faqContent)
</script>