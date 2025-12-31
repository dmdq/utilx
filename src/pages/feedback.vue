<template>
  <div class="max-w-8xl mx-auto py-8">
    <div class="prose prose-gray dark:prose-invert max-w-none">
      <MarkdownRenderer :content="pageContent" />
    </div>
  </div>
</template>

<script setup>
import MarkdownRenderer from '~/components/MarkdownRenderer.vue'
import { ref } from 'vue'


import { useSEO } from '~/composables/useSEO'

// 使用SEO composable设置页面标题
const { setPageTitle } = useSEO()
setPageTitle('提交反馈')


// SEO配置
useSeoMeta({
  description: '向Util提交问题反馈、功能建议或商务合作。我们重视每一个用户的反馈，致力于提供更好的在线工具服务。',
  keywords: ['反馈', '建议', '问题反馈', '联系我们', '商务合作']
})

// 直接导入Markdown文件内容
import feedbackContent from '~/content/feedback.md?raw'

const pageContent = ref(feedbackContent)
</script>