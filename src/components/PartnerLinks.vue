<script setup>
// 「合作伙伴」栏（阶段2 基础设施）：只在挂载它的专题页渲染，
// 实际可见性由 src/data/partners.js 的 enabled 开关与 item.url 是否非空决定，
// 双开关均关闭时整块不渲染（SSR 与客户端一致，无水合差异）。
import { Handshake } from 'lucide-vue-next'
import { partners } from '~/data/partners'

const activePartners = computed(() =>
  partners.filter(p => p.enabled && (p.items || []).some(i => i.enabled && i.url))
)

const visibleItems = (p) => (p.items || []).filter(i => i.enabled && i.url)
</script>

<template>
  <section v-for="p in activePartners" :key="p.id" class="bg-transparent border-0 border-b border-border/40 rounded-none p-6 mb-12">
    <h2 class="text-lg font-semibold text-foreground mb-3 flex items-center">
      <Handshake class="w-5 h-5 mr-2 text-primary" /> {{ p.slotTitle || '合作伙伴' }}
    </h2>
    <p v-if="p.note" class="text-xs text-muted-foreground mb-4 leading-relaxed">{{ p.note }}</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <a
        v-for="item in visibleItems(p)"
        :key="item.url"
        :href="item.url"
        rel="sponsored nofollow"
        target="_blank"
        class="block bg-transparent border-0 border-b border-border/40 rounded-none p-4 hover:bg-muted/25 transition-colors"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-medium text-foreground text-sm">{{ item.name }}</span>
          <span class="text-[11px] px-1.5 py-0.5 border border-border text-muted-foreground">{{ item.tag }}</span>
        </div>
        <p class="text-xs text-muted-foreground mt-2 leading-relaxed">{{ item.desc }}</p>
      </a>
    </div>
  </section>
</template>
