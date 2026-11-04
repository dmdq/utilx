<template>
  <AllToolsDirectory :page-number="pageNumber" />
</template>

<script setup>
import { computed } from 'vue'
import AllToolsDirectory from '~/components/AllToolsDirectory.vue'
import { TOTAL_TOOL_PAGES } from '~/data/pagination'

const route = useRoute()

const pageNumber = computed(() => Number(route.params.page) || 1)

// 只接受 /all/page/2 .. /all/page/16；越界页码不生成静态页，
// 客户端误导航时也直接落到 404，避免与最后一页产生重复内容。
definePageMeta({
  validate: (to) => {
    const n = Number(to.params.page)
    return Number.isInteger(n) && n >= 2 && n <= TOTAL_TOOL_PAGES
  }
})
</script>
