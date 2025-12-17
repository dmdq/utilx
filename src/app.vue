<script setup>
import { initToolsData } from '~/composables/useTools'
import { siteConfig } from '~/data/site'

// 初始化工具数据
initToolsData()

// 提供全局配置
provide('siteConfig', siteConfig)

// 全局样式和配置
useHead({
  title: siteConfig.title,
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { hid: 'description', name: 'description', content: siteConfig.description },
    { name: 'keywords', content: siteConfig.keywords }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.loli.net' },
    // { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
    {
      
      href: 'https://fonts.loli.net/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
      // href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
      rel: 'stylesheet'
    }
  ]
})

</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>