<script setup>
// 老页面 SEO 缺口的布局级兜底注入（数据源 src/data/legacy-seo.json，scripts/gen-legacy-sets.js 生成）
// 三件事，均只对「构建期判定缺失」的老页面生效，页面自带的不重复注入：
//   1. noRelated —— 注入 <RelatedTools>（相关工具推荐，含职业工具箱段）
//   2. noJsonLd  —— 注入 WebApplication JSON-LD 结构化数据
//   3. noSeoMeta —— 注入 title/description/og meta 回退
// 手动补齐某页后跑 npm run gen:legacy-seo 刷新集合即可移出。
import { computed } from 'vue'
import { tools } from '~/data/tools'
import legacy from '~/data/legacy-seo.json'
import RelatedTools from '~/components/RelatedTools.vue'

const props = defineProps({ routePath: { type: String, default: '' } })

const toolId = computed(() => {
  const m = /^\/tools\/([a-z0-9-]+)/.exec(props.routePath)
  return m ? m[1] : null
})
const tool = computed(() => (toolId.value ? tools.find(t => t.id === toolId.value) : null))
const showRelated = computed(() => !!tool.value && legacy.noRelated.includes(toolId.value))
const injectJsonLd = computed(() => !!tool.value && legacy.noJsonLd.includes(toolId.value))
const injectMeta = computed(() => !!tool.value && legacy.noSeoMeta.includes(toolId.value))

const jsonLd = computed(() => {
  if (!injectJsonLd.value || !tool.value) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.value.name,
    description: tool.value.description,
    url: `https://www.util.cn/tools/${tool.value.id}/`,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }
  }
})

useHead(() => {
  const head = {}
  if (jsonLd.value) {
    head.script = [{ type: 'application/ld+json', innerHTML: JSON.stringify(jsonLd.value) }]
  }
  if (injectMeta.value && tool.value) {
    head.title = `${tool.value.name} - 有条工具`
    head.meta = [
      { name: 'description', content: tool.value.description },
      { name: 'keywords', content: (tool.value.keywords || []).join(',') },
      { property: 'og:title', content: `${tool.value.name} - 有条工具` },
      { property: 'og:description', content: tool.value.description }
    ]
  }
  return head
})
</script>

<template>
  <RelatedTools v-if="showRelated && tool" :current-tool-id="tool.id" :category="tool.category" />
</template>
